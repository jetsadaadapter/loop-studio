import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

import {
  Field,
  FieldError,
  FieldLegend,
  FieldSeparator,
  FieldLabel,
} from "@/components/ui/field";

// Safety net for the Field family (fan-out 17, Orange tier per LOOP-ENGINEERING.md).
// Focus on the real logic (FieldError's dedup/single/list/null branches) plus the
// cva orientation on Field and the data-attribute contracts the layout CSS keys off.

describe("Field", () => {
  it("renders a vertical group by default", () => {
    const { container } = render(<Field>x</Field>);
    const el = container.firstChild as HTMLElement;
    expect(el).toHaveAttribute("role", "group");
    expect(el).toHaveAttribute("data-slot", "field");
    expect(el).toHaveAttribute("data-orientation", "vertical");
    expect(el.className).toContain("flex-col");
  });

  it("applies horizontal orientation classes", () => {
    const { container } = render(<Field orientation="horizontal">x</Field>);
    const el = container.firstChild as HTMLElement;
    expect(el).toHaveAttribute("data-orientation", "horizontal");
    expect(el.className).toContain("flex-row");
  });

  it("matches the default snapshot", () => {
    const { container } = render(<Field>x</Field>);
    expect(container.firstChild).toMatchSnapshot();
  });
});

describe("FieldLegend", () => {
  it("defaults to the legend variant", () => {
    const { container } = render(<FieldLegend>L</FieldLegend>);
    expect(container.firstChild).toHaveAttribute("data-variant", "legend");
  });

  it("supports the label variant", () => {
    const { container } = render(<FieldLegend variant="label">L</FieldLegend>);
    expect(container.firstChild).toHaveAttribute("data-variant", "label");
  });
});

describe("FieldSeparator", () => {
  it("marks data-content=false and renders no content span without children", () => {
    const { container } = render(<FieldSeparator />);
    expect(container.firstChild).toHaveAttribute("data-content", "false");
    expect(screen.queryByText("OR")).toBeNull();
  });

  it("renders children in a content span and marks data-content=true", () => {
    const { container } = render(<FieldSeparator>OR</FieldSeparator>);
    expect(container.firstChild).toHaveAttribute("data-content", "true");
    expect(screen.getByText("OR")).toBeInTheDocument();
  });
});

describe("FieldLabel", () => {
  it("renders its children", () => {
    render(<FieldLabel>Name</FieldLabel>);
    expect(screen.getByText("Name")).toBeInTheDocument();
  });
});

describe("FieldError", () => {
  it("renders nothing with no errors and no children", () => {
    const { container } = render(<FieldError />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing for an empty errors array", () => {
    const { container } = render(<FieldError errors={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders a single error message as an alert (not a list)", () => {
    render(<FieldError errors={[{ message: "Required" }]} />);
    const alert = screen.getByRole("alert");
    expect(alert).toHaveAttribute("data-slot", "field-error");
    expect(alert).toHaveTextContent("Required");
    expect(screen.queryByRole("listitem")).toBeNull();
  });

  it("de-dupes identical messages down to one", () => {
    render(<FieldError errors={[{ message: "Dup" }, { message: "Dup" }]} />);
    expect(screen.getByRole("alert")).toHaveTextContent("Dup");
    expect(screen.queryAllByRole("listitem")).toHaveLength(0);
  });

  it("renders multiple distinct messages as a list", () => {
    render(<FieldError errors={[{ message: "A" }, { message: "B" }]} />);
    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(2);
    expect(items.map((li) => li.textContent)).toEqual(["A", "B"]);
  });

  it("lets children override the errors prop", () => {
    render(<FieldError errors={[{ message: "ignored" }]}>Custom</FieldError>);
    expect(screen.getByRole("alert")).toHaveTextContent("Custom");
    expect(screen.queryByText("ignored")).toBeNull();
  });

  it("renders nothing when the single error has no message", () => {
    const { container } = render(<FieldError errors={[{}]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("matches the multi-error list snapshot", () => {
    const { container } = render(
      <FieldError errors={[{ message: "A" }, { message: "B" }]} />,
    );
    expect(container.firstChild).toMatchSnapshot();
  });
});
