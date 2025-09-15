"use client";

import * as React from "react";

export function Alert({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return <div className={`p-4 rounded-md border ${className}`}>{children}</div>;
}

export function AlertDescription({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return <div className={className}>{children}</div>;
}


