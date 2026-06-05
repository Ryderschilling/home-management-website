"use client";

import { useEffect, useRef } from "react";

// Watersound Origins Village Commons / pool & clubhouse area
// Verified via OSM geocoder: NatureWalk at Watersound Origins = 30.3076, -86.0056
// Village Commons is the central amenity hub just west of NatureWalk
const CENTER: [number, number] = [30.3040, -86.0090];
const ZOOM = 12;
// Service radius in meters (~5 miles out from clubhouse)
const RADIUS_METERS = 5984; // ~3.7 miles (trimmed 2 miles)

export default function ServiceAreaMap() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<unknown>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    // Guard against double-init from HMR — check the DOM directly
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((mapRef.current as any)._leaflet_id) return;

    let destroyed = false;

    import("leaflet").then((L) => {
      // Bail if cleanup already ran before the async import resolved
      if (destroyed || !mapRef.current) return;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((mapRef.current as any)._leaflet_id) return;

      // Fix Next.js marker icon path
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const map = L.map(mapRef.current!, {
        center: CENTER,
        zoom: ZOOM,
        scrollWheelZoom: false,
        zoomControl: true,
        attributionControl: true,
      });

      mapInstanceRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      L.circle(CENTER, {
        radius: RADIUS_METERS,
        color: "#2563eb",
        weight: 2,
        opacity: 0.6,
        fillColor: "#3b82f6",
        fillOpacity: 0.12,
      }).addTo(map);

      L.marker(CENTER, {
        title: "Watersound Origins — CHM Service Area",
      })
        .addTo(map)
        .bindPopup(
          '<div style="font-family:sans-serif;font-size:13px;line-height:1.5"><strong style="color:#1e3a5f;">Watersound Origins</strong><br/><span style="color:#555;">Coastal Home Management 30A</span></div>'
        );
    });

    return () => {
      destroyed = true;
      if (mapInstanceRef.current) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (mapInstanceRef.current as any).remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  return (
    <>
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        crossOrigin=""
      />
      <div
        ref={mapRef}
        style={{ width: "100%", height: "420px", borderRadius: "8px" }}
        className="border border-gray-200 shadow-sm"
        aria-label="Coastal Home Management 30A service area map"
      />
    </>
  );
}
