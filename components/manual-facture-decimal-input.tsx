"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import {
  MANUAL_FACTURE_DECIMAL_PLACES,
  formatManualFactureDecimalInput,
  parseManualFactureDecimalInput,
} from "@/lib/manual-facture-format";

type ManualFactureDecimalInputProps = {
  value: number;
  onChange: (value: number) => void;
  onBlur?: () => void;
  id?: string;
  name?: string;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
};

export default function ManualFactureDecimalInput({
  value,
  onChange,
  onBlur,
  id,
  name,
  placeholder = "0,00",
  className,
  disabled,
}: ManualFactureDecimalInputProps) {
  const [display, setDisplay] = useState(() => formatManualFactureDecimalInput(value));

  useEffect(() => {
    setDisplay(formatManualFactureDecimalInput(value));
  }, [value]);

  const sanitize = (raw: string) => {
    let v = raw.replace(/[^0-9,.]/g, "");
    v = v.replace(/\./g, ",");
    const parts = v.split(",");
    if (parts.length > 2) {
      v = `${parts[0]},${parts.slice(1).join("")}`;
    }
    const [, decimals] = v.split(",");
    if (decimals && decimals.length > MANUAL_FACTURE_DECIMAL_PLACES) {
      const [intPart, decPart] = v.split(",");
      v = `${intPart},${decPart.slice(0, MANUAL_FACTURE_DECIMAL_PLACES)}`;
    }
    return v;
  };

  return (
    <Input
      type="text"
      inputMode="decimal"
      id={id}
      name={name}
      placeholder={placeholder}
      disabled={disabled}
      value={display}
      className={className}
      onChange={(e) => {
        const next = sanitize(e.target.value);
        setDisplay(next);
        onChange(parseManualFactureDecimalInput(next));
      }}
      onBlur={() => {
        const parsed = parseManualFactureDecimalInput(display);
        setDisplay(formatManualFactureDecimalInput(parsed));
        onChange(parsed);
        onBlur?.();
      }}
    />
  );
}
