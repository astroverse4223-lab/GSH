import Link from "next/link";
import { LinkProps } from "next/link";
import { AnchorHTMLAttributes, forwardRef } from "react";
import styles from "./RGBButton.module.css";
import { cn } from "@/lib/utils";

interface RGBLinkProps
  extends LinkProps,
    Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkProps> {
  variant?: "primary" | "secondary" | "accent" | "ghost";
  size?: "sm" | "md" | "lg";
  pulse?: boolean;
}

const RGBLink = forwardRef<HTMLAnchorElement, RGBLinkProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      pulse = false,
      children,
      href,
      ...props
    },
    ref
  ) => {
    return (
      <Link
        className={cn(
          styles.rgbButton,
          styles[variant],
          styles[size],
          pulse && styles.pulse,
          className
        )}
        ref={ref}
        href={href}
        {...props}>
        {children}
      </Link>
    );
  }
);

RGBLink.displayName = "RGBLink";

export default RGBLink;
