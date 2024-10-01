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
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-base font-normal ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 overflow-hidden",

  {
    variants: {
      variant: {
        default: "bg-lightGreen text-darkGreen",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 border-2",
        outline:
          "border-2 text-darkGreen border-darkGreen bg-white/85 hover:brightness-90 active:brightness-75",
        secondary: "border-2 select-none",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-lightGreen underline-offset-4 hover:underline",
        text: "text-lightGreen",
        sheet:
          "text-darkGreen border-darkGreen bg-zinc-200 w-full !rounded-none h-full baseFlex relative z-[500] w-full py-4",
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
  forceActive?: boolean;
  disabled?: boolean;
  showCardSuitAccents?: boolean;
  showArrow?: boolean;
  showCheckmark?: boolean;
  includeMouseEvents?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      className,
      variant,
      size,
      asChild = false,
      forceActive = false,
      showCardSuitAccents,
      showArrow,
      showCheckmark,
      includeMouseEvents,
      // ^ this one is purely only for buttons wrapped by <TooltipProvider>, since
      // the tooltip provider doesn't seem to work well with pointer leave events
      ...props
    },
    ref,
  ) => {
    const Comp = asChild ? Slot : "button";

    const disabled = props.disabled;

    const [isActive, setIsActive] = useState(false);
    const [brightness, setBrightness] = useState(1);

    // Prevents the suit accents from showing on touch devices, since
    // they only show for a fraction of a second, causing a flicker
    const [overrideHideSuitAccents, setOverrideHideSuitAccents] =
      useState(false);

    const dynamicOpacity = disabled ? 0.25 : 1;

    // TODO: can probably simplify these below outside of secondary variant most likely?

    if (variant === "text") {
      return (
        <Comp
          onPointerEnter={() => {
            setBrightness(0.75);
          }}
          onPointerLeave={() => {
            setBrightness(1);
          }}
          onPointerCancel={() => {
            setBrightness(1);
          }}
          onPointerDown={() => {
            setBrightness(0.65);
          }}
          onPointerUp={() => {
            setBrightness(1);
          }}
          style={{
            filter: `brightness(${brightness})`,
          }}
          className={`${cn(
            `${buttonVariants({ variant, size, className })} relative`,
          )} `}
          ref={ref}
          {...props}
        >
          {children}
        </Comp>
      );
    }

    if (variant === "sheet") {
      return (
        <Comp
          onPointerEnter={() => {
            setIsActive(true);
          }}
          onPointerLeave={() => {
            setIsActive(false);
          }}
          onPointerCancel={() => {
            setIsActive(false);
          }}
          onPointerDown={() => {
            setIsActive(true);
          }}
          onPointerUp={() => {
            setIsActive(false);
          }}
          className={cn(
            buttonVariants({ variant, size, className }),
            `relative ${isActive ? "brightness-75" : ""}`,
          )}
          ref={ref}
          {...props}
        >
          {children}

          {disabled && (
            <p className="baseFlex absolute right-16 w-32 gap-2 text-sm text-darkGreen/70">
              Sign in to access
              <FaLock />
            </p>
          )}

          {showArrow && (
            <IoIosArrowForward size={"1rem"} className="absolute right-4" />
          )}
          {showCheckmark && (
            <AiOutlineCheck size={"1rem"} className="absolute right-4" />
          )}
        </Comp>
      );
    }

    if (variant === "destructive") {
      return (
        <Comp
          onMouseDown={() => {
            if (!includeMouseEvents) return;
            setBrightness(0.75);
            setIsActive(true);
          }}
          onMouseLeave={() => {
            if (!includeMouseEvents) return;
            setBrightness(1);
            setIsActive(false);
          }}
          onPointerDown={() => {
            setBrightness(0.75);
            setIsActive(true);
          }}
          onPointerUp={() => {
            setBrightness(1);
            setIsActive(false);
          }}
          onPointerEnter={() => {
            setIsActive(true);
          }}
          onPointerLeave={() => {
            setBrightness(1);
            setIsActive(false);
          }}
          onTouchStart={() => {
            setBrightness(0.75);
            setIsActive(true);
          }}
          onTouchEnd={() => {
            setBrightness(1);
            setIsActive(false);
          }}
          onTouchCancel={() => {
            setBrightness(1);
            setIsActive(false);
          }}
          style={{
            borderColor: isActive ? "#dc2626" : "#dc2626",
            backgroundColor: isActive ? "#dc2626" : "rgba(255, 255, 255, 0.85)",
            color: isActive ? "hsl(255, 100%, 100%)" : "#dc2626",
            filter: `brightness(${brightness})`,
          }}
          className={`${cn(
            `${buttonVariants({ variant, size, className })} relative`,
          )} `}
          ref={ref}
          {...props}
        >
          {children}
        </Comp>
      );
    }

    if (variant === "secondary") {
      return (
        <Comp
          onMouseDown={() => {
            if (!includeMouseEvents) return;
            setBrightness(0.75);
            setIsActive(true);
          }}
          onMouseLeave={() => {
            if (!includeMouseEvents) return;
            setBrightness(1);
            setIsActive(false);
          }}
          onPointerDown={() => {
            setBrightness(0.75);
            setIsActive(true);
          }}
          onPointerUp={() => {
            setBrightness(1);
            setIsActive(false);
          }}
          onPointerEnter={() => {
            setIsActive(true);
            setOverrideHideSuitAccents(false);
          }}
          onPointerLeave={() => {
            setBrightness(1);
            setIsActive(false);
          }}
          onTouchStart={() => {
            setBrightness(0.75);
            setOverrideHideSuitAccents(true);
            setIsActive(true);
          }}
          onTouchEnd={() => {
            setBrightness(1);
            setIsActive(false);
          }}
          onTouchCancel={() => {
            setBrightness(1);
            setIsActive(false);
          }}
          style={{
            borderColor:
              isActive || forceActive
                ? `hsl(120deg 100% 18% / ${dynamicOpacity})`
                : `hsl(120deg 100% 86% / ${dynamicOpacity})`,
            backgroundColor:
              isActive || forceActive
                ? `hsl(120deg 100% 86% / ${dynamicOpacity})`
                : `hsl(120deg 100% 18% / ${dynamicOpacity})`,
            color:
              isActive || forceActive
                ? `hsl(120deg 100% 18% / ${dynamicOpacity})`
                : `hsl(120deg 100% 86% / ${dynamicOpacity})`,
            filter: `brightness(${brightness})`,
            padding: showCardSuitAccents ? "1.15rem 1.5rem" : "0",
          }}
          className={`${cn(
            `${buttonVariants({ variant, size, className })} relative !opacity-100`, // TODO: find better solution to this rather than using !opacity-100. Wanted to keep the primary button's opacity
          )}`}
          ref={ref}
          {...props}
        >
          {children}

          {!overrideHideSuitAccents && showCardSuitAccents && (
            <>
              <GiClubs
                className={`absolute left-1 top-1 size-[0.9rem] rotate-[315deg] text-darkGreen ${isActive || forceActive ? "opacity-100" : "opacity-0"}`}
              />
              <GiDiamonds
                className={`absolute right-1 top-1 size-[0.9rem] rotate-[45deg] text-darkGreen ${isActive || forceActive ? "opacity-100" : "opacity-0"}`}
              />
              <GiHearts
                className={`absolute bottom-1 left-1 size-[0.9rem] rotate-[225deg] text-darkGreen ${isActive || forceActive ? "opacity-100" : "opacity-0"}`}
              />
              <GiSpades
                className={`absolute bottom-1 right-1 size-[0.9rem] rotate-[135deg] text-darkGreen ${isActive || forceActive ? "opacity-100" : "opacity-0"}`}
              />
            </>
          )}
        </Comp>
      );
    }

    if (variant === "default" || variant === undefined) {
      return (
        <Comp
          onMouseDown={() => {
            if (!includeMouseEvents) return;
            setBrightness(0.75);
          }}
          onMouseLeave={() => {
            if (!includeMouseEvents) return;
            setBrightness(1);
          }}
          onPointerDown={() => setBrightness(0.75)}
          onPointerUp={() => setBrightness(1)}
          onPointerEnter={() => setBrightness(0.9)}
          onPointerLeave={() => setBrightness(1)}
          onTouchStart={() => setBrightness(0.75)}
          onTouchEnd={() => setBrightness(1)}
          onTouchCancel={() => setBrightness(1)}
          style={{
            filter: `brightness(${brightness})`,
            cursor: disabled ? "not-allowed" : "pointer",
            // opacity: disabled ? 0.25 : 1,
            userSelect: disabled ? "none" : "auto",
          }}
          className={`${cn(buttonVariants({ variant, size, className }))}`}
          ref={ref}
          {...props}
        >
          {children}
        </Comp>
      );
    }

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      >
        {children}
      </Comp>
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
