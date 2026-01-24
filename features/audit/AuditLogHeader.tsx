"use client";

import React from "react";

type Props = {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
};

export default function AuditLogHeader({ title, subtitle, action }: Props) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div>
        <h3 className="text-lg font-semibold">{title}</h3>
        {subtitle ? <div className="text-xs text-gray-500">{subtitle}</div> : null}
      </div>
      {action}
    </div>
  );
}
