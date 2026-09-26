"use client";

/**
 * Dark glass auth styling, ported from the 21st.dev "modern-stunning-sign-in"
 * card (HextaUI). Classes kept as published; only the copy and the wiring are ours.
 */
import { useFormStatus } from "react-dom";
import type { ReactNode } from "react";

export const INPUT =
  "w-full px-5 py-3 rounded-xl bg-white/10 text-white placeholder-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400";

export function AuthInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${INPUT} ${props.className ?? ""}`} />;
}

export function AuthButton({ children, pending: pendingLabel = "One moment", secondary }: { children: ReactNode; pending?: string; secondary?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={
        secondary
          ? "w-full flex items-center justify-center gap-2 bg-gradient-to-b from-[#232526] to-[#2d2e30] rounded-full px-5 py-3 font-medium text-white shadow hover:brightness-110 transition mb-2 text-sm disabled:opacity-60"
          : "w-full bg-white/10 text-white font-medium px-5 py-3 rounded-full shadow hover:bg-white/20 transition mb-3 text-sm disabled:opacity-60"
      }
    >
      {pending ? pendingLabel : children}
    </button>
  );
}

export function AuthMessage({ state }: { state: { error?: string; ok?: boolean; message?: string } | null | undefined }) {
  if (!state) return null;
  if (state.error) return <div className="text-sm text-red-400 text-left" role="alert">{state.error}</div>;
  if (state.ok && state.message) return <div className="text-sm text-emerald-300 text-left" role="status">{state.message}</div>;
  return null;
}

export function AuthTitle({ children }: { children: ReactNode }) {
  return <h2 className="text-2xl font-semibold text-white mb-6 text-center">{children}</h2>;
}

export function AuthSub({ children }: { children: ReactNode }) {
  return <p className="text-sm text-gray-300 text-center -mt-4 mb-6">{children}</p>;
}

export function AuthFoot({ children }: { children: ReactNode }) {
  return (
    <div className="w-full text-center mt-2">
      <span className="text-xs text-gray-400">{children}</span>
    </div>
  );
}

export const LINK = "underline text-white/80 hover:text-white";
