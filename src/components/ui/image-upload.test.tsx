import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

import { ImageUpload } from "@/components/ui/image-upload";

// next/image pulls server-only bits under vitest; render it as a plain <img>.
vi.mock("next/image", () => ({
  default: (props: Record<string, unknown>) => {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...(props as Record<string, unknown>)} />;
  },
}));

// Safety net for ImageUpload (Yellow/Green tier — logic-bearing). Exercises the
// real validation + upload pipeline (mime, size, id extraction, error paths, clear).
// The dimension-check branch is skipped: it depends on real <img> loading, which
// jsdom does not perform.
function fileInputOf(container: HTMLElement) {
  return container.querySelector('input[type="file"]') as HTMLInputElement;
}

function makeFile(name: string, type: string, sizeBytes?: number) {
  const f = new File(["x"], name, { type });
  if (sizeBytes != null) {
    Object.defineProperty(f, "size", { value: sizeBytes });
  }
  return f;
}

function selectFile(input: HTMLInputElement, file: File) {
  fireEvent.change(input, { target: { files: [file] } });
}

describe("ImageUpload", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("rejects an invalid mime type", () => {
    const onError = vi.fn();
    const onChange = vi.fn();
    const { container } = render(
      <ImageUpload onChange={onChange} onError={onError} />,
    );
    selectFile(fileInputOf(container), makeFile("a.txt", "text/plain"));
    expect(onError).toHaveBeenCalledWith(
      expect.stringContaining("Invalid file type"),
    );
    expect(onChange).not.toHaveBeenCalled();
  });

  it("rejects a file over the size limit", () => {
    const onError = vi.fn();
    const { container } = render(
      <ImageUpload onError={onError} maxFileSizeMb={5} />,
    );
    selectFile(
      fileInputOf(container),
      makeFile("big.png", "image/png", 6 * 1024 * 1024),
    );
    expect(onError).toHaveBeenCalledWith(
      expect.stringContaining("5MB or less"),
    );
  });

  it("uploads a valid file and reports the returned id", async () => {
    const onChange = vi.fn();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({ mediaId: "abc" }) }),
    );
    const { container } = render(<ImageUpload onChange={onChange} />);
    selectFile(fileInputOf(container), makeFile("a.png", "image/png", 100));
    await waitFor(() => expect(onChange).toHaveBeenCalledWith("abc"));
    expect(fetch).toHaveBeenCalledWith(
      "/api/library/images/upload",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("extracts the id from a nested data payload", async () => {
    const onChange = vi.fn();
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue({ ok: true, json: async () => ({ data: { imageId: "xyz" } }) }),
    );
    const { container } = render(<ImageUpload onChange={onChange} />);
    selectFile(fileInputOf(container), makeFile("a.png", "image/png", 100));
    await waitFor(() => expect(onChange).toHaveBeenCalledWith("xyz"));
  });

  it("errors when the response has no image id", async () => {
    const onError = vi.fn();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) }),
    );
    const { container } = render(<ImageUpload onError={onError} />);
    selectFile(fileInputOf(container), makeFile("a.png", "image/png", 100));
    await waitFor(() =>
      expect(onError).toHaveBeenCalledWith(
        expect.stringContaining("image id was not returned"),
      ),
    );
  });

  it("errors when the upload request fails", async () => {
    const onError = vi.fn();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 500 }),
    );
    const { container } = render(<ImageUpload onError={onError} />);
    selectFile(fileInputOf(container), makeFile("a.png", "image/png", 100));
    await waitFor(() =>
      expect(onError).toHaveBeenCalledWith(
        expect.stringContaining("Upload failed"),
      ),
    );
  });

  it("clears the selection via the Clear button", () => {
    const onChange = vi.fn();
    render(<ImageUpload value="pic.png" onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: "Clear" }));
    expect(onChange).toHaveBeenCalledWith("");
  });
});
