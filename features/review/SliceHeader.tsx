"use client";

import React from "react";

export function SliceHeader({
  title,
  id,
}: {
  title: string;
  id?: string;
}) {
  return (
    <tr
      id={id}
      role="rowheader"
      className="sticky top-12 z-20 bg-base-100/95 backdrop-blur supports-[backdrop-filter]:bg-base-100/80"
      aria-label={`${title} section`}
    >
      <td colSpan={5} className="py-2">
        <div className="text-sm font-semibold tracking-wide uppercase opacity-80">
          {title}
        </div>
      </td>
    </tr>
  );
}
