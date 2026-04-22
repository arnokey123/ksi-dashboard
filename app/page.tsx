"use client";

import { useState } from "react";
import useIntel from "@/hooks/useIntel";

// Configuration: Match these exactly to the Python script sectors
const SECTOR_CONFIG = [
  { name: "Overview", icon: "📊", color: "text-white" },
  { name: "Fintech", icon: "💵", color: "text-blue-400", match: "FINTECH" },
  { name: "Clean Energy", icon: "⚡", color: "text-emerald-400", match: "CLEAN ENERGY" },
  { name: "Agriculture", icon: "🌾", color: "text-yellow-400", match: "AGRICULTURE" },
  { name: "Logistics", icon: "🚚", color: "text-cyan-400", match: "LOGISTICS" },
  { name: "Infrastructure", icon: "🏗️", color: "text-orange-400", match: "INFRASTRUCTURE" },
  { name: "Healthcare", icon: "🏥", color: "text-pink-400", match: "HEALTHCARE" },
  { name: "E-Mobility", icon: "🔋", color: "text-purple-400", match: "E-MOBILITY" },
  { name: "Manufacturing", icon: "🏭", color: "text-amber-400", match: "MANUFACTURING" },
];

export default function Home() {
  const [activeSector, setActiveSector] = useState("Overview");
  const { intelligenceData, isLoading, isError } = useIntel();

  // 1. FILTER LOGIC (Fixed)
  const filteredNews = intelligenceData?.filter((item) => {
    if (activeSector === "Overview") return true; // Show all
    
    // Find the config for the active sector to get the 'match' string
    const config = SECTOR_CONFIG.find(s => s.name === activeSector);
    
    // Check if the item's sector matches the required string (e.g., "FINTECH")
    return item.sector === config?.match;
  }) || [];

  // 2. GROUP LOGIC (For Overview)
  const groupedNews = intelligenceData?.reduce((acc, item) => {
    if (!acc[item.sector]) {
      acc[item.sector] = [];
    }
    acc[item.sector].push(item);
    return acc;
  }, {} as Record<string, typeof intelligenceData>);

  if (isLoading) return <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-500 animate-pulse">Initializing Intelligence...</div>;
  if (isError) return <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-red-500">Connection Error.</div>;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col md:flex-row">
      
      {/* SIDEBAR */}
      <aside className="w-full md:w-72 border-b md:border-b-0 md:border-r border-zinc-800/50 p-6 flex flex-col bg-zinc-900/30 backdrop-blur-sm sticky top-0 h-screen">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <h1 className="text-xl font-bold tracking-tight text-white">KSI</h1>
          </div>
          <p className="text-[11px] uppercase tracking-widest text-zinc-600 font-medium pl-4">Kenya Sector Intel</p>
        </div>

        <nav className="flex flex-col gap-1 flex-1 overflow-y-auto">
          {SECTOR_CONFIG.map((sector) => {
            const isActive = activeSector === sector.name;
            const count = sector.name === "Overview" 
              ? intelligenceData?.length 
              : intelligenceData?.filter(i => i.sector === sector.match).length;

            return (
              <button 
                key={sector.name}
                onClick={() => setActiveSector(sector.name)}
                className={`
                  flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-200 group text-left
                  ${isActive 
                    ? "bg-white text-zinc-900 shadow-lg shadow-white/5" 
                    : "hover:bg-zinc-800/50 text-zinc-400 hover:text-zinc-100"
                  }
                `}
              >
                <div className="flex items-center gap-3">
                  <span className={`text-lg ${isActive ? 'opacity-100' : 'opacity-70 group-hover:opacity-100'}`}>
                    {sector.icon}
                  </span>
                  <span className="text-sm font-medium">{sector.name}</span>
                </div>
                {count !== undefined && count > 0 && (
                   <span className={`text-xs px-2 py-0.5 rounded-full font-mono ${isActive ? 'bg-zinc-900/10 text-zinc-700' : 'bg-zinc-800 text-zinc-500'}`}>
                     {count}
                   </span>
                )}
              </button>
            );
          })}
        </nav>
        
        <div className="mt-4 pt-4 border-t border-zinc-800/50 hidden md:block">
           <p className="text-[10px] text-zinc-600 text-center">Updated Automatically</p>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 p-6 md:p-8 overflow-y-auto">
        
        {/* HEADER */}
        <header className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-white">
              {activeSector === "Overview" ? "Intelligence Feed" : activeSector}
            </h2>
            <p className="text-sm text-zinc-500 mt-1">
              Real-time strategic analysis for Kenyan markets
            </p>
          </div>
          
          {/* STATUS BADGE */}
          <div className="flex items-center gap-2 bg-zinc-900/50 border border-zinc-800 px-3 py-1.5 rounded-full">
             <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
             </span>
             <span className="text-xs text-zinc-400 font-mono">LIVE</span>
          </div>
        </header>

        {/* NEWS GRID */}
        <div className="space-y-8">
          {activeSector === "Overview" && groupedNews ? (
            // OVERVIEW MODE: Group by Sector
            Object.entries(groupedNews).map(([sector, items]) => (
              <div key={sector}>
                <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-4 border-b border-zinc-800/50 pb-2">
                  {sector}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {items.map((item) => (
                     <NewsCard key={item.id} item={item} />
                  ))}
                </div>
              </div>
            ))
          ) : (
            // SECTOR MODE: Simple List
            filteredNews.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredNews.map((item) => (
                  <NewsCard key={item.id} item={item} />
                ))}
              </div>
            ) : (
              <div className="text-center py-20 text-zinc-500 border border-dashed border-zinc-800 rounded-lg bg-zinc-900/20">
                <p className="text-sm">No intelligence available for this sector.</p>
              </div>
            )
          )}
        </div>
      </main>
    </div>
  );
}

// SUB-COMPONENT: News Card
function NewsCard({ item }: { item: any }) {
  const sectorConfig = SECTOR_CONFIG.find(s => s.match === item.sector);
  const colorClass = sectorConfig?.color || "text-zinc-400";

  return (
    <div className="bg-zinc-900/40 border border-zinc-800/50 rounded-xl overflow-hidden flex flex-col hover:border-zinc-700/50 hover:bg-zinc-900/60 transition-all duration-300">
      
      <div className="p-5 flex-1 flex flex-col">
        <div className="flex justify-between items-center mb-3">
          <span className={`text-[10px] uppercase font-bold tracking-wider ${colorClass}`}>
            {item.sector}
          </span>
          <span className="text-[10px] text-zinc-600 font-mono">{item.date}</span>
        </div>

        <h3 className="text-base font-semibold text-zinc-100 leading-snug mb-3 flex-1">
          {item.title}
        </h3>

        <div className="space-y-3 text-xs">
          <div className="bg-zinc-800/20 p-2.5 rounded border-l-2 border-zinc-700">
            <p className="text-zinc-400 leading-relaxed">{item.interpretation}</p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="bg-emerald-500/5 p-2 rounded border border-dashed border-emerald-500/20">
              <h4 className="text-[9px] uppercase font-bold text-emerald-500 mb-0.5">Opportunity</h4>
              <p className="text-[10px] text-zinc-500 leading-relaxed line-clamp-2">{item.opportunity}</p>
            </div>
            <div className="bg-red-500/5 p-2 rounded border border-dashed border-red-500/20">
              <h4 className="text-[9px] uppercase font-bold text-red-500 mb-0.5">Risk</h4>
              <p className="text-[10px] text-zinc-500 leading-relaxed line-clamp-2">{item.risk}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
