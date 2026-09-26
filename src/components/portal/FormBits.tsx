"use client";

import { useFormStatus } from "react-dom";
import type { ReactNode } from "react";

export function SubmitButton({
  children,
  pending: pendingLabel = "One moment",
  variant = "primary",
  className = "",
  disabled,
}: {
  children: ReactNode;
  pending?: string;
  variant?: "primary" | "dark" | "ghost" | "danger" | "plain";
  className?: string;
  disabled?: boolean;
}) {
  const { pending } = useFormStatus();
  const v = variant === "plain" ? "" : `pt-btn--${variant}`;
  return (
    <button type="submit" className={`pt-btn ${v} ${className}`} disabled={pending || disabled} aria-busy={pending}>
      {pending ? (
        <>
          <span className="pt-spinner" aria-hidden="true" /> {pendingLabel}
        </>
      ) : (
        children
      )}
    </button>
  );
}

export function FormMessage({ state }: { state: { error?: string; ok?: boolean; message?: string } | null | undefined }) {
  if (!state) return null;
  if (state.error) {
    return (
      <div className="pt-alert pt-alert--error" role="alert">
        {state.error}
      </div>
    );
  }
  if (state.ok && state.message) {
    return (
      <div className="pt-alert pt-alert--ok" role="status">
        {state.message}
      </div>
    );
  }
  return null;
}

export function Field({
  label,
  help,
  children,
}: {
  label: string;
  help?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label className="pt-label">{label}</label>
      {children}
      {help ? <p className="pt-help">{help}</p> : null}
    </div>
  );
}
