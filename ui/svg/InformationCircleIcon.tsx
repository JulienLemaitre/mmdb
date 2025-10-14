import React from "react";

export default function InformationCircleIcon(
  props: React.SVGProps<SVGSVGElement>,
) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className="w-6 h-6"
      {...props}
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 9v6m0-9h.01v.01H12V6Z"
      />
    </svg>
  );
}