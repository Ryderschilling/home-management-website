"use client";

import { useEffect } from "react";

export default function PortalModal({
  title,
  step,
  onClose,
  children,
}: {
  title: string;
  step?: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div
      className="pt-modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="pt-modal">
        <div className="pt-modal-head">
          <div>
            {step ? <p className="pt-step">{step}</p> : null}
            <h2 className="pt-h2" style={{ marginBottom: 0 }}>{title}</h2>
          </div>
          <button type="button" className="pt-modal-close" onClick={onClose} aria-label="Close">
            &times;
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
