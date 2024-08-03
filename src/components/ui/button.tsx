import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { useState } from "react";
import { AiOutlineCheck } from "react-icons/ai";
import { GiClubs, GiDiamonds, GiHearts, GiSpades } from "react-icons/gi";
import { FaLock } from "react-icons/fa";

import { IoIosArrowForward } from "react-icons/io";
import { cn } from "~/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 border-2",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "border-2 transition-all",
        // ideally wanted a link variant but wasn't conducive to how we set up the button variants below..
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-lightGreen underline-offset-4 hover:underline",
        text: "text-primary",
        drawer:
          "text-darkGreen border-darkGreen w-full !rounded-none h-full absolute top-0 left-0",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 px-3",
        lg: "h-11 px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  forceHover?: boolean;
  isDisabled?: boolean; // I feel like there is a way around this, but not messing with it right now
  tempDisabled?: boolean;
  showLoadingSpinnerOnClick?: boolean;
  innerText?: string;
  innerTextWhenLoading?: string;
  onClickFunction?: () => void;
  width?: string;
  height?: string;
  icon?: JSX.Element;
  iconOnLeft?: boolean;
  rotateIcon?: boolean;
  showCardSuitAccents?: boolean;
  showArrow?: boolean;
  showCheckmark?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      isDisabled, // I feel like there is a way around this, but not messing with it right now
      asChild = false,
      showLoadingSpinnerOnClick,
      innerText,
      innerTextWhenLoading,
      onClickFunction,
      icon,
      iconOnLeft,
      rotateIcon,
      showCardSuitAccents,
      showArrow = true,
      showCheckmark,
      ...props
    },
    ref,
  ) => {
    const Comp = asChild ? Slot : "button";

    // not a fan of having this much state in here, but otherwise it's offloaded
    // to the parent component, which is not ideal either

    const [buttonIsActive, setButtonIsActive] = useState(false);
    const [showLoadingSpinner, setShowLoadingSpinner] = useState(false);
    const [tempDisabled, setTempDisabled] = useState(false);
    const [brightness, setBrightness] = useState(1);

    const forceHover = false; // add this as prop later

    const dynamicOpacity =
      isDisabled || tempDisabled
        ? buttonIsActive || forceHover
          ? 0.35
          : 0.25
        : 1;

    if (variant === "text") {
      return (
        <div
          onMouseEnter={() => setBrightness(0.75)}
          onMouseLeave={() => setBrightness(1)}
          onPointerDown={() => {
            setBrightness(0.65);
          }}
          onPointerUp={() => {
            setBrightness(1);
          }}
          onPointerLeave={() => {
            setBrightness(1);
          }}
          className="baseFlex"
        >
          <Comp
            style={{
              color: "hsl(120deg, 100%, 86%)",
              filter: `brightness(${brightness})`,
            }}
            className={`${cn(
              `${buttonVariants({ variant, size, className })} relative`,
            )} `}
            ref={ref}
            {...props}
          >
            {innerText}
            {icon}
          </Comp>
        </div>
      );
    }

    if (variant === "drawer") {
      return (
        <div
          className={`${className} baseFlex relative z-[500] w-full px-2 py-4 transition-colors ${
            buttonIsActive ? "bg-black/25" : "bg-zinc-200"
          }`}
          onPointerDown={() => {
            if (isDisabled) return;
            setButtonIsActive(true);
          }}
          onPointerUp={() => {
            if (isDisabled) return;
            setButtonIsActive(false);
          }}
          onPointerLeave={() => {
            if (isDisabled) return;
            setButtonIsActive(false);
          }}
        >
          <Comp
            className={cn(buttonVariants({ variant, size, className }))}
            ref={ref}
            {...props}
          />

          {isDisabled && (
            <p className="baseFlex absolute right-16 w-32 gap-2 text-sm text-darkGreen/70">
              Log in to access
              <FaLock />
            </p>
          )}

          {showArrow && (
            <IoIosArrowForward size={"1rem"} className="absolute right-4" />
          )}
          {showCheckmark && (
            <AiOutlineCheck size={"1rem"} className="absolute right-4" />
          )}
        </div>
      );
    }

    if (variant === "destructive") {
      return (
        <div
          onMouseEnter={() => setButtonIsActive(true)}
          onMouseLeave={() => setButtonIsActive(false)}
          onPointerDown={() => {
            setBrightness(0.75);
            setButtonIsActive(true);
          }}
          onPointerUp={() => {
            setBrightness(1);
            setButtonIsActive(false);
          }}
          onPointerLeave={() => {
            setBrightness(1);
            setButtonIsActive(false);
          }}
        >
          <Comp
            style={{
              borderColor: buttonIsActive
                ? "hsl(0, 84%, 50%)"
                : "hsl(0, 84%, 60%)",
              backgroundColor: buttonIsActive
                ? "hsl(0, 84%, 50%)"
                : "hsl(0, 84%, 95%)",
              color: buttonIsActive
                ? "hsl(255, 100%, 100%)"
                : "hsl(0, 84%, 40%)",
              filter: `brightness(${brightness})`,
            }}
            className={`${cn(
              `${buttonVariants({ variant, size, className })} relative`,
            )} `}
            ref={ref}
            {...props}
          >
            {innerText}
            {icon}
          </Comp>
        </div>
      );
    }

    if (variant === "secondary") {
      return (
        <div
          onMouseEnter={() => setButtonIsActive(true)}
          onMouseLeave={() => setButtonIsActive(false)}
          onPointerDown={() => {
            setBrightness(0.75);
            setButtonIsActive(true);
          }}
          onPointerUp={() => {
            setBrightness(1);
            setButtonIsActive(false);
          }}
          onPointerLeave={() => {
            setBrightness(1);
            setButtonIsActive(false);
          }}
        >
          <Comp
            style={{
              borderColor:
                buttonIsActive || forceHover
                  ? `hsl(120deg 100% 18% / ${dynamicOpacity})`
                  : `hsl(120deg 100% 86% / ${dynamicOpacity})`,
              backgroundColor:
                buttonIsActive || forceHover
                  ? `hsl(120deg 100% 86% / ${dynamicOpacity})`
                  : `hsl(120deg 100% 18% / ${dynamicOpacity})`,
              color:
                buttonIsActive || forceHover
                  ? `hsl(120deg 100% 18% / ${dynamicOpacity})`
                  : `hsl(120deg 100% 86% / ${dynamicOpacity})`,
              filter: `brightness(${brightness})`,
            }}
            className={`${cn(
              `${buttonVariants({ variant, size, className })} relative`,
            )}`}
            ref={ref}
            {...props}
          >
            {iconOnLeft && icon && (
              <div
                style={{
                  transform: rotateIcon ? "rotate(540deg)" : "rotate(0deg)",
                  transition: "transform 0.5s ease-in-out",
                }}
              >
                {icon}
              </div>
            )}
            {innerText}
            {!iconOnLeft && !showLoadingSpinner && icon && (
              <div
                style={{
                  transform: rotateIcon ? "rotate(540deg)" : "rotate(0deg)",
                  transition: "transform 0.5s ease-in-out",
                }}
              >
                {icon}
              </div>
            )}

            {showCardSuitAccents && (
              <>
                <GiClubs
                  size={"0.9rem"}
                  style={{
                    position: "absolute",
                    color: "hsl(120deg 100% 18%)",
                    left: "0.25rem",
                    top: "0.25rem",
                    transform: "rotate(315deg)",
                    opacity: buttonIsActive || forceHover ? 1 : 0,
                  }}
                />
                <GiDiamonds
                  size={"0.9rem"}
                  style={{
                    position: "absolute",
                    color: "hsl(120deg 100% 18%)",
                    right: "0.25rem",
                    top: "0.25rem",
                    transform: "rotate(45deg)",
                    opacity: buttonIsActive || forceHover ? 1 : 0,
                  }}
                />
                <GiHearts
                  size={"0.9rem"}
                  style={{
                    position: "absolute",
                    color: "hsl(120deg 100% 18%)",
                    left: "0.25rem",
                    bottom: "0.25rem",
                    transform: "rotate(225deg)",
                    opacity: buttonIsActive || forceHover ? 1 : 0,
                  }}
                />
                <GiSpades
                  size={"0.9rem"}
                  style={{
                    position: "absolute",
                    color: "hsl(120deg 100% 18%)",
                    right: "0.25rem",
                    bottom: "0.25rem",
                    transform: "rotate(135deg)",
                    opacity: buttonIsActive || forceHover ? 1 : 0,
                  }}
                />
              </>
            )}
          </Comp>
        </div>
      );
    }

    if (variant === "default" || variant === undefined) {
      return (
        <div
          className="baseFlex gap-2"
          onMouseEnter={() => setBrightness(0.9)}
          onMouseLeave={() => setBrightness(1)}
          onPointerDown={() => setBrightness(0.75)}
          onPointerUp={() => setBrightness(1)}
          onPointerLeave={() => setBrightness(1)}
          onClick={() => {
            if (isDisabled || tempDisabled) return;

            if (showLoadingSpinnerOnClick) {
              setShowLoadingSpinner(true);
              setTempDisabled(true);

              setTimeout(() => {
                setShowLoadingSpinner(false);
                setTempDisabled(false);
                onClickFunction?.();
              }, 1000);
            } else {
              onClickFunction?.();
            }
          }}
        >
          <Comp
            style={{
              filter: `brightness(${brightness})`,
              cursor: isDisabled || tempDisabled ? "not-allowed" : "pointer",
              opacity: isDisabled || tempDisabled ? 0.25 : 1,
              // TODO: I really don't know why this wasn't working on mobile safari... explicitly defining for the time being
              backgroundColor: "hsl(120deg, 100%, 86%)",
              color: "hsl(120deg, 100%, 18%)",
            }}
            className={`${cn(buttonVariants({ variant, size, className }))}`}
            ref={ref}
            {...props}
          >
            {iconOnLeft && icon}
            {showLoadingSpinner ? innerTextWhenLoading : innerText}
            {!iconOnLeft && !showLoadingSpinner && icon}

            {/* technically could structure so that icon/loading spinner could be animate presence'd,
                but not essential right now */}

            {showLoadingSpinner && (
              <div
                style={{
                  width: "1.5rem",
                  height: "1.5rem",
                  borderTop: `0.35rem solid hsla(120deg, 100%, 18%, 40%)`,
                  borderRight: `0.35rem solid hsla(120deg, 100%, 18%, 40%)`,
                  borderBottom: `0.35rem solid hsla(120deg, 100%, 18%, 40%)`,
                  borderLeft: `0.35rem solid hsl(120deg, 100%, 18%)`,
                }}
                className="loadingSpinner"
              ></div>
            )}
          </Comp>
        </div>
      );
    }

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
