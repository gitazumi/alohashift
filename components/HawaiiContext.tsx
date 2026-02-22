"use client";

// Hawaii-specific context panel
// Structured for future API integration (weather, school zones, incidents)

interface HawaiiContextItem {
  icon: React.ReactNode;
  label: string;
  value: string;
  status: "normal" | "warning" | "info";
  note: string;
}

const statusColors = {
  normal: "bg-emerald-50 border-emerald-200 text-emerald-700",
  warning: "bg-amber-50 border-amber-200 text-amber-700",
  info: "bg-blue-50 border-blue-100 text-blue-700",
};

function ContextCard({ item }: { item: HawaiiContextItem }) {
  return (
    <div
      className={`rounded-xl border p-4 ${statusColors[item.status]} opacity-80`}
    >
      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-base">{item.icon}</span>
        <span className="text-xs font-semibold uppercase tracking-widest">
          {item.label}
        </span>
      </div>
      <p className="font-semibold text-sm mb-1">{item.value}</p>
      <p className="text-xs opacity-70">{item.note}</p>
    </div>
  );
}

export default function HawaiiContext() {
  // Placeholder data — will be replaced with real API calls
  const contextItems: HawaiiContextItem[] = [
    {
      icon: "🌤",
      label: "Weather Impact",
      value: "Clear conditions",
      status: "normal",
      note: "No precipitation expected. Normal traffic patterns apply.",
    },
    {
      icon: "🏫",
      label: "School Zone Risk",
      value: "School day — elevated",
      status: "warning",
      note: "School zones active 7:30–8:30 AM near Pali Hwy and H1.",
    },
    {
      icon: "⚠️",
      label: "Road Incidents",
      value: "No active alerts",
      status: "info",
      note: "Data placeholder — connect to 511 Hawaii or HDOT API for live incidents.",
    },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6">
      <div className="flex items-center gap-2 mb-5">
        <span className="text-xl">🌺</span>
        <div>
          <h3 className="text-base font-semibold text-slate-800">
            Hawaii Context
          </h3>
          <p className="text-xs text-slate-400">
            Local factors that may affect your commute
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {contextItems.map((item) => (
          <ContextCard key={item.label} item={item} />
        ))}
      </div>

      <p className="text-xs text-slate-300 mt-4">
        Weather, school zone, and incident data are placeholders. Real-time API
        integration available in future versions.
      </p>
    </div>
  );
}
