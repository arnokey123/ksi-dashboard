"use client";

import { useState } from "react";
import useIntel from "@/hooks/useIntel";

// Configuration: Match these exactly to the Python script sectors
const SECTOR_CONFIG = [
  { name: "Overview", icon: "📊", color: "text-white", match: "OVERVIEW" },
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Mobile toggle
  const { intelligenceData, isLoading, isError } = useIntel();

  // 1. FILTER LOGIC (Fixed for Case Sensitivity)
  const filteredNews = intelligenceData?.filter((item) => {
    if (activeSector === "Overview") return true;
    
    // Find the config for the active sector
    const config = SECTOR_CONFIG.find(s => s.name === activeSector);
    if (!config) return false;

    // Compare in Uppercase to ensure match
    return (item.sector || "").toUpperCase() === config.match.toUpperCase();
  }) || [];

  // 2. GROUP LOGIC (For Overview)
  const groupedNews = intelligenceData?.reduce((acc, item) => {
    const sectorKey = item.sector || "GENERAL";
    if (!acc[sectorKey]) {
      acc[sectorKey] = [];
    }
    acc[sectorKey].push(item);
    return acc;
  }, {} as Record<string, typeof intelligenceData>);

  // Helper to select sector and close menu
  const handleSectorChange = (sectorName: string) => {
    setActiveSector(sectorName);
    setIsSidebarOpen(false); // Close sidebar on mobile after selection
  };

  if (isLoading) return <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-500">Loading...</div>;
  if (isError) return <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-red-500">Error.</div>;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col md:flex-row">
      
      {/* --- MOBILE HEADER --- */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-900/50 sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
          <h1 className="text-lg font-bold">KSI</h1>
        </div>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="text-zinc-400 p-2">
          {isSidebarOpen ? "✕" : "☰"}
        </button>
      </div>

      {/* --- SIDEBAR --- */}
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 md:hidden" onClick={() => setIsSidebarOpen(false)}></div>
      )}

      <aside className={`
        fixed md:sticky top-0 left-0 h-screen w-72 border-r border-zinc-800/50 p-6 flex flex-col bg-zinc-900/90 backdrop-blur-md z-50
        transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
        md:translate-x-0
      `}>
        <div className="mb-8 hidden md:block">
          <h1 className="text-xl font-bold tracking-tight text-white">KSI</h1>
          <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-medium">Kenya Sector Intel</p>
        </div>

        <nav className="flex flex-col gap-1 flex-1 overflow-y-auto">
          {SECTOR_CONFIG.map((sector) => {
            const isActive = activeSector === sector.name;
            const count = sector.name === "Overview" 
              ? intelligenceData?.length 
              : intelligenceData?.filter(i => (i.sector || "").toUpperCase() === sector.match.toUpperCase()).length;

            return (
              <button 
                key={sector.name}
                onClick={() => handleSectorChange(sector.name)}
                className={`
                  flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-200 group text-left
                  ${isActive 
                    ? "bg-white text-zinc-900 shadow-lg" 
                    : "hover:bg-zinc-800/50 text-zinc-400 hover:text-zinc-100"
                  }
                `}
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">{sector.icon}</span>
                  <span className="text-sm font-medium">{sector.name}</span>
                </div>
                {count !== undefined && count > 0 && (
                   <span className={`text-xs px-2 py-0.5 rounded-full font-mono ${isActive ? 'bg-zinc-900/10 text-zinc-600' : 'bg-zinc-800 text-zinc-500'}`}>
                     {count}
                   </span>
                )}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 p-6 md:p-8 overflow-y-auto pb-20">
        
        {/* HEADER */}
        <header className="mb-8">
          <h2 className="text-2xl font-bold tracking-tight text-white">
            {activeSector === "Overview" ? "Intelligence Feed" : activeSector}
          </h2>
          <p className="text-sm text-zinc-500 mt-1">
            {activeSector === "Overview" ? "All sectors combined" : "Filtered strategic analysis"}
          </p>
        </header>

        {/* NEWS GRID */}
        <div className="space-y-8">
          {activeSector === "Overview" && groupedNews ? (
            // OVERVIEW MODE: Group by Sector
            Object.entries(groupedNews).map(([sector, items]) => (
              <div key={sector}>
                <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-4 border-b border-zinc-800 pb-2">
                  {sector}
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {items.map((item) => (
                     <NewsCard key={item.id} item={item} />
                  ))}
                </div>
              </div>
            ))
          ) : (
            // SECTOR MODE: Simple List
            filteredNews.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {filteredNews.map((item) => (
                  <NewsCard key={item.id} item={item} />
                ))}
              </div>
            ) : (
              <div className="text-center py-20 text-zinc-500 border border-dashed border-zinc-800 rounded-lg bg-zinc-900/20">
                <p className="text-sm">No intelligence available for this sector today.</p>
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
  const sectorConfig = SECTOR_CONFIG.find(s => s.match === (item.sector || "").toUpperCase());
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
          <div className="bg-zinc-800/30 p-2.5 rounded border-l-2 border-zinc-700">
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
