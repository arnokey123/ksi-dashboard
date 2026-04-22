"use client";

import { useState } from "react";
import useIntel from "@/hooks/useIntel";

const sectors = [
  { name: "Overview", icon: "📊" },
  { name: "Fintech", icon: "💵" },
  { name: "Clean Energy", icon: "⚡" },
  { name: "Logistics", icon: "🚚" },
  { name: "Agriculture", icon: "🌾" },
  { name: "Healthcare", icon: "🏥" },
  { name: "Infrastructure", icon: "🏗️" },
];

export default function Home() {
  const [activeSector, setActiveSector] = useState("Overview");
  
  // This fetches the data from your API (which reads intel.json)
  const { intelligenceData, isLoading, isError } = useIntel();

  if (isLoading) return <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-400">Loading Intelligence...</div>;
  if (isError) return <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-red-500">Error loading feed.</div>;

  const filteredNews = intelligenceData?.filter((item) => {
    if (activeSector === "Overview") return true;
    return item.sector === activeSector.toUpperCase();
  }) || [];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col md:flex-row">
      
      {/* SIDEBAR */}
      <aside className="w-full md:w-64 border-b md:border-b-0 md:border-r border-zinc-800 p-4 flex flex-col bg-zinc-900/50">
        <div className="mb-6">
          <h1 className="text-xl font-bold tracking-tighter text-white">KSI</h1>
          <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-medium">Kenya Sector Intel</p>
        </div>

        <div className="flex flex-row md:flex-col gap-1 overflow-x-auto md:overflow-visible pb-2 md:pb-0">
          {sectors.map((sector) => {
            const isActive = activeSector === sector.name;
            return (
              <button 
                key={sector.name}
                onClick={() => setActiveSector(sector.name)}
                className={`flex items-center justify-between px-3 py-2 rounded-md cursor-pointer transition-colors group whitespace-nowrap
                  ${isActive ? "bg-white text-zinc-900 font-bold" : "hover:bg-zinc-800/60 text-zinc-300"}
                `}
              >
                <div className="flex items-center gap-2">
                  <span>{sector.icon}</span>
                  <span className="text-xs">{sector.name}</span>
                </div>
              </button>
            );
          })}
        </div>
      </aside>

      {/* MAIN FEED */}
      <main className="flex-1 p-4 md:p-6 overflow-y-auto">
        
        <div className="flex justify-between items-center mb-6 border-b border-zinc-800 pb-4">
          <div>
            <h2 className="text-base font-semibold text-zinc-100">
              Intelligence Feed {activeSector !== "Overview" ? `— ${activeSector}` : ""}
            </h2>
            <p className="text-xs text-zinc-500">Real-time strategic analysis</p>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-emerald-400 bg-emerald-900/20 px-2 py-1 rounded border border-emerald-800/50">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            LIVE
          </div>
        </div>

        <div className="space-y-4">
          {filteredNews.length > 0 ? (
            filteredNews.map((item) => (
              <div key={item.id} className="bg-zinc-900/30 border border-zinc-800 rounded-lg overflow-hidden hover:border-zinc-700 transition-colors">
                <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-800/20">
                  <span className="text-[11px] uppercase tracking-wider font-bold text-cyan-400">{item.sector}</span>
                  <span className="text-[10px] text-zinc-500 font-mono">{item.date}</span>
                </div>

                <div className="p-5 space-y-4">
                  <h3 className="text-lg font-semibold text-zinc-100 leading-tight">{item.title}</h3>

                  <div className="bg-zinc-800/20 p-3 rounded border-l-2 border-zinc-600">
                    <h4 className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold mb-1">Interpretation</h4>
                    <p className="text-sm text-zinc-300 leading-relaxed">{item.interpretation}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="bg-zinc-900/80 p-3 rounded border border-dashed border-emerald-800/50 hover:border-emerald-500 transition-colors">
                      <h4 className="text-[10px] uppercase tracking-wider text-emerald-400 font-bold mb-2">↑ Opportunity</h4>
                      <p className="text-xs text-zinc-400 leading-relaxed">{item.opportunity}</p>
                    </div>
                    <div className="bg-zinc-900/80 p-3 rounded border border-dashed border-red-800/50 hover:border-red-500 transition-colors">
                      <h4 className="text-[10px] uppercase tracking-wider text-red-400 font-bold mb-2">↓ Risk</h4>
                      <p className="text-xs text-zinc-400 leading-relaxed">{item.risk}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-zinc-500 py-10 border border-dashed border-zinc-800 rounded-lg">
              <p>No intelligence entries found for this sector.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
