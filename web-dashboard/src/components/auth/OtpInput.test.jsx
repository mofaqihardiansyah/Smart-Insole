import React from "react";
import { describe, it, expect, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import OtpInput from "./OtpInput";

const renderInput = (props = {}) =>
  render(
    <OtpInput
      id="otp"
      value=""
      onChange={vi.fn()}
      language="id"
      {...props}
    />
  );

describe("OtpInput", () => {
  it("renders one labelled box per digit", () => {
    renderInput();

    const boxes = screen.getAllByRole("textbox");
    expect(boxes).toHaveLength(6);
    expect(boxes[0]).toHaveAttribute("aria-label", "Digit 1 dari 6");
    expect(boxes[5]).toHaveAttribute("aria-label", "Digit 6 dari 6");
    expect(boxes[0]).toHaveAttribute("autocomplete", "one-time-code");
  });

  it("distributes a pasted code from the first box", () => {
    const onChange = vi.fn();
    renderInput({ onChange });

    const first = screen.getAllByRole("textbox")[0];
    fireEvent.paste(first, {
      clipboardData: { getData: () => "123456" },
    });

    expect(onChange).toHaveBeenCalledWith("123456");
  });

  it("distributes a multi digit change, which is what mobile autofill sends", () => {
    const onChange = vi.fn();
    renderInput({ onChange });

    fireEvent.change(screen.getAllByRole("textbox")[0], {
      target: { value: "654321" },
    });

    expect(onChange).toHaveBeenCalledWith("654321");
  });

  it("moves focus forward after a digit and back on an empty Backspace", () => {
    const onChange = vi.fn();
    renderInput({ value: "12", onChange });

    const boxes = screen.getAllByRole("textbox");
    boxes[2].focus();
    fireEvent.keyDown(boxes[2], { key: "Backspace" });

    expect(onChange).toHaveBeenCalledWith("1");
    expect(boxes[1]).toHaveFocus();
  });

  it("announces an error as an alert and links it to the boxes", () => {
    renderInput({ error: "Kode tidak sesuai." });

    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("Kode tidak sesuai.");
    expect(screen.getAllByRole("textbox")[0]).toHaveAttribute(
      "aria-invalid",
      "true"
    );
  });
});
