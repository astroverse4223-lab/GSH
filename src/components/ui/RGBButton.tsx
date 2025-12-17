import { ButtonHTMLAttributes, forwardRef } from "react";
import styles from "./RGBButton.module.css";
import { cn } from "@/lib/utils";

interface RGBButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "accent" | "ghost";
  size?: "sm" | "md" | "lg";
  pulse?: boolean;
}

const RGBButton = forwardRef<HTMLButtonElement, RGBButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      pulse = false,
      disabled = false,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        className={cn(
          styles.rgbButton,
          styles[variant],
          styles[size],
          pulse && styles.pulse,
          disabled && styles.disabled,
          className
        )}
        disabled={disabled}
        ref={ref}
        {...props}>
        {children}
      </button>
    );
  }
);

RGBButton.displayName = "RGBButton";

export default RGBButton;
