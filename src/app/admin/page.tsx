"use client";

import { useEffect, useState } from "react";
import { siteData, Service } from "@/data/siteData";
import { nanoid } from "nanoid";

export default function AdminPage() {
  const [data, setData] = useState(siteData);
  const [services, setServices] = useState<Service[]>([]);
  const [saved, setSaved] = useState(false);

  // Load stored data
  useEffect(() => {
    const storedSite = localStorage.getItem("site-data");
    const storedServices = localStorage.getItem("services");

    if (storedSite) setData(JSON.parse(storedSite));
    setServices(storedServices ? JSON.parse(storedServices) : siteData.services);
  }, []);

  const saveChanges = () => {
    localStorage.setItem("site-data", JSON.stringify(data));
    localStorage.setItem("services", JSON.stringify(services));
    setSaved(true);

    setTimeout(() => setSaved(false), 2500);
  };

  const updateSiteField = (key: string, value: string) => {
    setSaved(false);
    setData((prev) => ({ ...prev, [key]: value }));
  };

  const updateService = (id: string, key: keyof Service, value: string) => {
    setSaved(false);
    setServices((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [key]: value } : s))
    );
  };

  const addService = () => {
    setSaved(false);
    setServices((prev) => [
      ...prev,
      {
        id: nanoid(),
        title: "New Service",
        description: "",
        price: "",
        image: "",
      },
    ]);
  };

  const removeService = (id: string) => {
    setSaved(false);
    setServices((prev) => prev.filter((s) => s.id !== id));
  };

  return (
    <main className="min-h-screen bg-white px-10 py-14 text-black">
      <div className="max-w-5xl mx-auto space-y-16">

        {/* Header */}
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-serif">Site Control Center</h1>
            <p className="text-sm text-gray-600">
              Manage website content and services.
            </p>
          </div>

          <div className="flex items-center space-x-4">
            {saved && (
              <span className="text-xs uppercase tracking-widest text-green-600">
                Saved ✓
              </span>
            )}
            <button
              onClick={saveChanges}
              className="border px-6 py-2 text-xs uppercase tracking-widest hover:bg-black hover:text-white transition"
            >
              Save Changes
            </button>
          </div>
        </header>

        {/* Site Info */}
        <section className="space-y-6">
          <h2 className="text-xl font-medium">Site Information</h2>

          {Object.entries({
            businessName: data.businessName,
            serviceArea: data.serviceArea,
            startingPrice: data.startingPrice,
            contactEmail: data.contactEmail,
          }).map(([key, value]) => (
            <div key={key} className="space-y-1">
              <label className="block text-sm capitalize">{key}</label>
              <input
                className="w-full border px-3 py-2 text-sm"
                value={value}
                onChange={(e) => updateSiteField(key, e.target.value)}
              />
            </div>
          ))}
        </section>

        {/* Services */}
        <section className="space-y-6">
          <h2 className="text-xl font-medium">Services</h2>

          {services.map((service) => (
            <div key={service.id} className="border p-6 space-y-3">
              <input
                className="w-full border px-3 py-2 text-sm"
                value={service.title}
                onChange={(e) =>
                  updateService(service.id, "title", e.target.value)
                }
                placeholder="Service title"
              />
              <textarea
                className="w-full border px-3 py-2 text-sm"
                value={service.description}
                onChange={(e) =>
                  updateService(service.id, "description", e.target.value)
                }
                placeholder="Description"
              />
              <div className="grid grid-cols-2 gap-4">
                <input
                  className="border px-3 py-2 text-sm"
                  value={service.price}
                  onChange={(e) =>
                    updateService(service.id, "price", e.target.value)
                  }
                  placeholder="Price"
                />
                <input
                  className="border px-3 py-2 text-sm"
                  value={service.image}
                  onChange={(e) =>
                    updateService(service.id, "image", e.target.value)
                  }
                  placeholder="/image.png"
                />
              </div>

              <button
                onClick={() => removeService(service.id)}
                className="text-xs uppercase tracking-wide text-red-600"
              >
                Remove service
              </button>
            </div>
          ))}

          <button
            onClick={addService}
            className="border px-6 py-2 text-xs uppercase tracking-widest hover:bg-black hover:text-white transition"
          >
            Add Service
          </button>
        </section>

        {/* Footer */}
        <a
          href="/"
          className="block text-xs uppercase tracking-widest text-gray-500 hover:text-black"
        >
          ← Back to Website
        </a>
      </div>
    </main>
  );
}


