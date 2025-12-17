"use client";

interface NeonButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "accent";
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function NeonButton({
  children,
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: NeonButtonProps) {
  const variantClasses = {
    primary: "text-neon-primary border-neon-primary hover:bg-neon-primary/10",
    secondary:
      "text-neon-secondary border-neon-secondary hover:bg-neon-secondary/10",
    accent: "text-neon-accent border-neon-accent hover:bg-neon-accent/10",
  };

  const sizeClasses = {
    sm: "px-3 py-1 text-sm",
    md: "px-4 py-2",
    lg: "px-6 py-3 text-lg",
  };

  return (
    <button
      {...props}
      className={`
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${className}
        border-2 rounded-md
        transition-all duration-300
        ${
          props.disabled
            ? "opacity-50 cursor-not-allowed"
            : `hover:shadow-neon-${variant} active:scale-95`
        }
      `}>
      {children}
    </button>
  );
}
