import { render, fireEvent, cleanup } from "@testing-library/react";
import { expect, describe, it, vi, afterEach } from "vitest";

import SecondaryButton from "../SecondaryButton";

afterEach(cleanup);

describe("SecondaryButton", () => {
  it("should render a button with inner text", () => {
    const buttonText = "Click me!";
    const { getByText } = render(
      <SecondaryButton extraPadding={false} innerText={buttonText} />
    );
    const buttonElement = getByText(buttonText);
    expect(buttonElement).toBeDefined();
  });

  it("should call the onClickFunction prop when clicked", () => {
    const onClickMock = vi.fn();
    const { getByRole } = render(
      <SecondaryButton
        extraPadding={false}
        innerText="Click me!"
        onClickFunction={onClickMock}
      />
    );
    const buttonElement = getByRole("button");
    fireEvent.click(buttonElement);
    expect(onClickMock).toHaveBeenCalled();
  });

  it("should have 'not-allowed' cursor when disabled prop is true", () => {
    const onClickMock = vi.fn();
    const { getByRole } = render(
      <SecondaryButton
        extraPadding={false}
        innerText="Click me!"
        onClickFunction={onClickMock}
        disabled
      />
    );
    const buttonElement = getByRole("button");
    const cursorStyle = window.getComputedStyle(buttonElement).cursor;

    expect(cursorStyle).toBe("not-allowed");
    fireEvent.click(buttonElement);
    expect(onClickMock).not.toHaveBeenCalled();
  });

  it("should show a loading spinner when showLoadingSpinnerOnClick prop is true", () => {
    const onClickMock = vi.fn();
    const { getByRole, getByTestId } = render(
      <SecondaryButton
        extraPadding={false}
        innerText="Click me!"
        onClickFunction={onClickMock}
        showLoadingSpinnerOnClick
      />
    );
    const buttonElement = getByRole("button");
    fireEvent.click(buttonElement);
    const loadingSpinnerElement = getByTestId("loadingSpinner");
    expect(loadingSpinnerElement).toBeDefined();
  });

  it("should show hover tooltip text when hoverTooltipText prop is provided and button is hovered", () => {
    const tooltipText = "I have been hovered!";
    const { getByRole, getByText } = render(
      <SecondaryButton
        extraPadding={false}
        innerText="Hover me!"
        hoverTooltipText={tooltipText}
        hoverTooltipTextPosition={"bottom"}
      />
    );
    const buttonElement = getByRole("button");
    fireEvent.pointerEnter(buttonElement);
    const tooltipElement = getByText(tooltipText);
    expect(tooltipElement).toBeDefined();
  });
});
