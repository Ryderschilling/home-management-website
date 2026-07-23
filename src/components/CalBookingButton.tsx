"use client";

import { useEffect } from "react";
import { getCalApi } from "@calcom/embed-react";

const CAL_LINK = "ryder-schilling-dnfebm/request-a-free-walkthrough";
const CAL_NAMESPACE = "request-a-free-walkthrough";

export default function CalBookingButton() {
  useEffect(() => {
    (async function initCal() {
      const cal = await getCalApi({ namespace: CAL_NAMESPACE });
      cal("ui", {
        theme: "dark",
        styles: {
          branding: {
            brandColor: "#1d4ed8",
          },
        },
        hideEventTypeDetails: false,
        layout: "month_view",
      });
    })();
  }, []);

  return (
    <button
      type="button"
      data-cal-namespace={CAL_NAMESPACE}
      data-cal-link={CAL_LINK}
      data-cal-config={JSON.stringify({ layout: "month_view", theme: "dark" })}
      className="ch-btn ch-btn--light"
    >
      Book a Free Walkthrough
    </button>
  );
}
