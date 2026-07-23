"use client";

import { useEffect } from "react";
import { getCalApi } from "@calcom/embed-react";

const CAL_LINK = "ryder-schilling-dnfebm/request-a-free-walkthrough";
const CAL_NAMESPACE = "floating-walkthrough";
const FLOATING_BUTTON_ID = "chm-cal-floating-button";
const BRAND_COLOR = "#1d4ed8";

export default function CalFloatingWidget() {
  useEffect(() => {
    let cancelled = false;

    (async function initCal() {
      const cal = await getCalApi({ namespace: CAL_NAMESPACE });
      if (cancelled) return;

      cal("ui", {
        theme: "dark",
        styles: {
          branding: {
            brandColor: BRAND_COLOR,
          },
        },
        hideEventTypeDetails: false,
        layout: "month_view",
      });

      cal("floatingButton", {
        calLink: CAL_LINK,
        buttonText: "Book a Free Walkthrough",
        buttonPosition: "bottom-right",
        buttonColor: BRAND_COLOR,
        buttonTextColor: "#ffffff",
        attributes: { id: FLOATING_BUTTON_ID },
        config: { layout: "month_view", theme: "dark" },
      });
    })();

    return () => {
      cancelled = true;
      document.getElementById(FLOATING_BUTTON_ID)?.remove();
      document.querySelectorAll("cal-modal-box").forEach((el) => el.remove());
    };
  }, []);

  return null;
}
