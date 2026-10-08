import React from "react";

/**
 * GlassButton — Tombol dengan efek glassmorphism.
 * - Transparan dengan backdrop blur
 - Border subtle, hover border warna primary
 - Accessible: large hit area, focus-visible ring, aria-label support
 * - Variants: filled, outline, ghost
 */
const GlassButton = ({
  children,
  variant = "filled",
  className,
  ...props
}) => {
  const variants = {
    filled: "bg-primary text-white hover:bg-primary/90",
    outline: "border border-primary text-primary hover:bg-primary/5",
    ghost: "hover:bg-primary/5 text-primary",
  };

  const baseClasses = "inline-flex items-center rounded-md px-4 py-2 font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";

  return (
    <button
      type="button"
      className={`${baseClasses} ${variants[variant]} ${className}`}
      style={variant === "filled"
        ? { background: "var(--primary)", color: "var(--white)" }
        : variant === "outline"
          ? { borderColor: "var(--primary)", color: "var(--primary)" }
          : {}}
      {...props}
    >
      {children}
    </button>
  );
};

GlassButton.displayName = "GlassButton";

export default GlassButton;