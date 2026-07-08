import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ModalCloseButton } from "./modal-close-button";

describe("ModalCloseButton", () => {
    it("calls onClose when clicked", () => {
        const onClose = vi.fn();
        render(<ModalCloseButton onClose={onClose} />);
        fireEvent.click(screen.getByRole("button", { name: "Close modal" }));
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("does not fire while disabled", () => {
        const onClose = vi.fn();
        render(<ModalCloseButton onClose={onClose} disabled />);
        fireEvent.click(screen.getByRole("button", { name: "Close modal" }));
        expect(onClose).not.toHaveBeenCalled();
    });

    it("is labeled for assistive tech", () => {
        render(<ModalCloseButton onClose={() => {}} />);
        expect(screen.getByRole("button", { name: "Close modal" })).toBeInTheDocument();
    });
});
