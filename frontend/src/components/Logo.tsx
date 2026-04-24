import React from "react";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

const Logo: React.FC<LogoProps> = ({ className = "", size = "md" }) => {
  const sizeClasses = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-3xl",
    xl: "text-4xl",
  };

  return (
    <span
      className={`font-black tracking-tighter uppercase ${sizeClasses[size]} ${className}`}
      style={{ fontFamily: 'Outfit, sans-serif' }}
    >
      <span className="text-foreground">9X</span>
      <span className="text-blue-600">BET</span>
    </span>
  );
};

export default Logo;
