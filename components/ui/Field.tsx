"use client";

import { cn } from "@/lib/utils";
import { Check } from "@phosphor-icons/react";
import type { ReactNode } from "react";

export const CONTROL =
  "w-full rounded-soft-sm border bg-white px-3.5 text-[15px] text-ink transition-[border-color,box-shadow,background-color] duration-200 ease-out-quint placeholder:text-muted/70 hover:border-muted/45 focus:border-brand focus:outline-none focus-visible:ring-4 focus-visible:ring-brand/12 focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:bg-mist disabled:text-muted";

const CONTROL_BORDER = "border-hairline";
const ERROR_BORDER = "border-sale focus:border-sale focus-visible:ring-sale/15";

export type FieldProps = {
  label: string;
  htmlFor?: string;
  hint?: string;
  error?: string;
  optional?: string;
  children: ReactNode;
  className?: string;
};

/** Label above, helper beside the label, error below. One gap scale everywhere. */
export function Field({
  label,
  htmlFor,
  hint,
  error,
  optional,
  children,
  className,
}: FieldProps) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-baseline justify-between gap-3">
        <label
          htmlFor={htmlFor}
          className="text-[13px] font-semibold tracking-[-0.005em] text-ink"
        >
          {label}
        </label>
        {optional && (
          <span className="text-[11px] font-medium text-muted">{optional}</span>
        )}
      </div>
      {children}
      {error ? (
        <p
          id={htmlFor ? `${htmlFor}-error` : undefined}
          role="alert"
          className="text-[12px] font-medium leading-snug text-sale"
        >
          {error}
        </p>
      ) : hint ? (
        <p
          id={htmlFor ? `${htmlFor}-hint` : undefined}
          className="text-[12px] leading-snug text-muted"
        >
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export type TextInputProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  hint?: string;
  optional?: string;
  type?: React.InputHTMLAttributes<HTMLInputElement>["type"];
  inputMode?: React.ComponentProps<"input">["inputMode"];
  autoComplete?: string;
  placeholder?: string;
  maxLength?: number;
  min?: number | string;
  max?: number | string;
  name?: string;
  disabled?: boolean;
  readOnly?: boolean;
  enterKeyHint?: React.ComponentProps<"input">["enterKeyHint"];
  pattern?: string;
  autoFocus?: boolean;
  inputClassName?: string;
  className?: string;
  trailing?: ReactNode;
  onBlur?: () => void;
};

export function TextInput({
  id,
  label,
  value,
  onChange,
  error,
  hint,
  optional,
  type = "text",
  inputMode,
  autoComplete,
  placeholder,
  maxLength,
  min,
  max,
  name,
  disabled,
  readOnly,
  enterKeyHint,
  pattern,
  autoFocus,
  inputClassName,
  className,
  trailing,
  onBlur,
}: TextInputProps) {
  const describedBy =
    (error ? `${id}-error ` : "") + (hint && !error ? `${id}-hint` : "");

  return (
    <Field label={label} htmlFor={id} hint={hint} error={error} optional={optional} className={className}>
      <div className="relative">
        <input
          id={id}
          name={name}
          type={type}
          value={value}
          inputMode={inputMode}
          autoComplete={autoComplete}
          placeholder={placeholder}
          maxLength={maxLength}
          min={min}
          max={max}
          pattern={pattern}
          disabled={disabled}
          readOnly={readOnly}
          autoFocus={autoFocus}
          enterKeyHint={enterKeyHint}
          onBlur={onBlur}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy.trim() || undefined}
          onChange={(event) => onChange(event.target.value)}
          className={cn(
            CONTROL,
            "h-12",
            error ? ERROR_BORDER : CONTROL_BORDER,
            trailing && "pe-11",
            inputClassName,
          )}
        />
        {trailing && (
          <span className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 text-muted">
            {trailing}
          </span>
        )}
      </div>
    </Field>
  );
}

export function Textarea({
  id,
  label,
  value,
  onChange,
  hint,
  rows = 3,
  placeholder,
  maxLength,
  optional,
  className,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  rows?: number;
  placeholder?: string;
  maxLength?: number;
  optional?: string;
  className?: string;
}) {
  return (
    <Field label={label} htmlFor={id} hint={hint} optional={optional} className={className}>
      <textarea
        id={id}
        rows={rows}
        value={value}
        placeholder={placeholder}
        maxLength={maxLength}
        aria-describedby={hint ? `${id}-hint` : undefined}
        onChange={(event) => onChange(event.target.value)}
        className={cn(CONTROL, CONTROL_BORDER, "min-h-[88px] py-3 leading-relaxed")}
      />
    </Field>
  );
}

export function Checkbox({
  id,
  checked,
  onChange,
  label,
  description,
  className,
}: {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: ReactNode;
  description?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-start gap-3", className)}>
      <button
        type="button"
        id={id}
        role="checkbox"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "mt-px flex h-5 w-5 shrink-0 items-center justify-center rounded-soft-sm border transition-colors duration-200",
          checked
            ? "border-brand bg-brand text-white"
            : "border-muted/40 bg-white hover:border-brand/50",
        )}
      >
        {checked && <Check size={13} weight="bold" aria-hidden="true" />}
      </button>
      <label htmlFor={id} className="cursor-pointer select-none text-[14px] leading-snug text-ink">
        {label}
        {description && (
          <span className="mt-0.5 block text-[12px] text-muted">{description}</span>
        )}
      </label>
    </div>
  );
}

/** iOS-style switch: used for the two boolean preferences in the flow. */
export function Switch({
  id,
  checked,
  onChange,
  label,
}: {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <label htmlFor={id} className="cursor-pointer select-none text-[14px] text-ink">
        {label}
      </label>
      <button
        type="button"
        id={id}
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative h-7 w-12 shrink-0 rounded-full transition-colors duration-200",
          checked ? "bg-mint" : "bg-hairline",
        )}
      >
        <span
          className={cn(
            "absolute top-1 h-5 w-5 rounded-full bg-white shadow-[0_1px_2px_rgba(15,23,42,0.3)] transition-[inset-inline-start] duration-200 ease-out-quint",
            checked ? "start-[calc(100%-1.5rem)]" : "start-1",
          )}
        />
      </button>
    </div>
  );
}
