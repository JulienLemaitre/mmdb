import React from "react";

type BadgeProps = {
  text: string;
  type?: "neutral" | "primary" | "secondary" | "accent" | "ghost";
  outline?: boolean;
  styles?: string;
};

export default function Badge({
  text,
  type = "accent",
  styles,
  outline = false,
}: BadgeProps) {
  return (
    <div
      className={`badge badge-${type} badge-outline ${outline ? "badge-outline" : ""} ${styles}`}
    >
      {text}
    </div>
  );
}
