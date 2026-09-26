"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Square Web Payments SDK, card only. The card fields live in Square's iframe,
 * so card numbers never touch our server. Shared by checkout and the account
 * page's "update card" form.
 */
export type SquareCard = {
  tokenize: () => Promise<{ status: string; token?: string; errors?: Array<{ message: string }> }>;
  attach: (sel: string) => Promise<void>;
  destroy?: () => Promise<void>;
};
type SquarePayments = { card: (opts?: Record<string, unknown>) => Promise<SquareCard> };
declare global {
  interface Window {
    Square?: { payments: (appId: string, locationId: string) => SquarePayments };
  }
}

export type SquareConfig = { appId: string; locationId: string; env: "sandbox" | "production" };

export function useSquareCard(cfg: SquareConfig, containerId: string, enabled: boolean) {
  const cardRef = useRef<SquareCard | null>(null);
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || !cfg.appId || !cfg.locationId) return;
    const src = cfg.env === "production" ? "https://web.squarecdn.com/v1/square.js" : "https://sandbox.web.squarecdn.com/v1/square.js";
    let cancelled = false;
    const init = async () => {
      try {
        if (!window.Square) {
          await new Promise<void>((resolve, reject) => {
            const existing = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`);
            if (existing) {
              existing.addEventListener("load", () => resolve());
              existing.addEventListener("error", () => reject(new Error("load")));
              if (window.Square) resolve();
              return;
            }
            const sc = document.createElement("script");
            sc.src = src;
            sc.async = true;
            sc.onload = () => resolve();
            sc.onerror = () => reject(new Error("load"));
            document.head.appendChild(sc);
          });
        }
        if (cancelled || !window.Square) return;
        const payments = window.Square.payments(cfg.appId, cfg.locationId);
        const card = await payments.card({
          style: {
            input: { fontSize: "18px", color: "#0a0a0a" },
            ".input-container": { borderColor: "#c9c9c4", borderRadius: "8px" },
            ".input-container.is-focus": { borderColor: "#0d7f79" },
          },
        });
        await card.attach(`#${containerId}`);
        if (cancelled) {
          await card.destroy?.();
          return;
        }
        cardRef.current = card;
        setReady(true);
      } catch (e) {
        console.error(e);
        setLoadError("The card form could not load. Refresh the page, or text Ryder and he will invoice you.");
      }
    };
    init();
    return () => {
      cancelled = true;
      cardRef.current?.destroy?.();
      cardRef.current = null;
    };
  }, [enabled, cfg.appId, cfg.locationId, cfg.env, containerId]);

  /** Returns a one-time token, or throws a readable message. */
  const tokenize = async (): Promise<string> => {
    if (!cardRef.current) throw new Error("The card form is still loading. Give it a second.");
    const r = await cardRef.current.tokenize();
    if (r.status !== "OK" || !r.token) throw new Error(r.errors?.[0]?.message ?? "Please check your card details.");
    return r.token;
  };

  return { ready, loadError, tokenize };
}
