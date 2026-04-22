"use client";

import { useState } from "react";
import useIntel from "@/hooks/useIntel";

// Define Strict Sectors
const SECTORS = [
  { id: "overview", name: "Overview", icon: "📊", color: "bg-zinc-700" },
  { id: "fintech", name: "Fintech", icon: "💵", color: "bg-blue-600" },
  { id: "clean energy", name: "Clean Energy", icon: "⚡", color: "bg-emerald-600" },
  { id: "agriculture", name: "Agriculture", icon: "🌾", color: "bg-yellow-600" },
  { id: "logistics", name: "Logistics", icon: "🚚", color: "bg-cyan-600" },
  { id: "infrastructure", name: "Infrastructure", icon: "🏗️", color: "bg-orange-600" },
  { id: "healthcare", name: "Healthcare", icon: "🏥", color: "bg-pink-600" },
  { id: "e-mobility", name: "E-Mobility", icon: "🔋", color: "bg-purple-600" },
  { id: "manufacturing", name: "Manufacturing", icon: "🏭", color: "bg-amber-600" },
];

export default function Home() {
  const [activeSector, setActiveSector] = useState("overview");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { intelligenceData, isLoading, isError } = useIntel();

  // ROBUST FILTER
  const filteredNews = intelligenceData?.filter((item) => {
    if (activeSector === "overview") return true;
    
    // Normalize both strings to lowercase for comparison
    const itemSector = (item.sector || "").toLowerCase().trim();
    const targetSector = activeSector.toLowerCase();
    
    return itemSector === targetSector;
  }) || [];

  // Grouping for Overview
  const groupedNews = intelligenceData?.reduce((acc, item) => {
    const sectorKey = (item.sector || "General").toUpperCase();
    if (!acc[sectorKey]) acc[sectorKey] = [];
    acc[sectorKey].push(item);
    return acc;
  }, {} as Record<string, typeof intelligenceData>);

  const currentSectorDetails = SECTORS.find(s => s.id === activeSector);

  if (isLoading) return <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-500 animate-pulse">Initializing System...</div>;
  if (isError) return <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-red-500">System Error</div>;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col md:flex-row">
      
      {/* MOBILE HEADER */}
      <header className="md:hidden sticky top-0 z-50 bg-zinc-900/80 backdrop-blur-lg border-b border-zinc-800 p-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${currentSectorDetails?.color || 'bg-zinc-700'}`}>
            <span>{currentSectorDetails?.icon}</span>
          </div>
          <div>
            <h1 className="text-sm font-bold text-white">KSI</h1>
            <p className="text-[10px] text-zinc-400 -mt-0.5">{currentSectorDetails?.name}</p>
          </div>
        </div>
        <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-2xl text-zinc-400 p-2">
          {isMenuOpen ? "✕" : "☰"}
        </button>
      </header>

      {/* SIDEBAR */}
      <aside className={`
        fixed inset-y-0 left-0 w-72 bg-zinc-900 border-r border-zinc-800 z-40 
        transform transition-transform duration-300 ease-in-out
        ${isMenuOpen ? "translate-x-0" : "-translate-x-full"}
        md:relative md:translate-x-0 md:flex md:flex-col
      `}>
        <div className="p-6 border-b border-zinc-800 hidden md:block">
          <h1 className="text-2xl font-bold text-white tracking-tight">KSI</h1>
          <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-medium mt-1">Kenya Sector Intel</p>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {SECTORS.map((sector) => {
            const isActive = activeSector === sector.id;
            const count = sector.id === "overview" 
              ? intelligenceData?.length 
              : intelligenceData?.filter(i => (i.sector || "").toLowerCase() === sector.id).length;

            return (
              <button
                key={sector.id}
                onClick={() => { setActiveSector(sector.id); setIsMenuOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group
                  ${isActive 
                    ? "bg-white text-zinc-900 shadow-lg shadow-white/5" 
                    : "hover:bg-zinc-800/60 text-zinc-400"
                  }`}
              >
                <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${isActive ? 'bg-zinc-100' : sector.color + ' bg-opacity-20'}`}>
                  {sector.icon}
                </span>
                <span className="flex-1 text-left text-sm font-medium">{sector.name}</span>
                {count !== undefined && count > 0 && (
                  <span className={`text-xs px-2 py-0.5 rounded-full ${isActive ? 'bg-zinc-900/10 text-zinc-600' : 'bg-zinc-800 text-zinc-500'}`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* OVERLAY FOR MOBILE */}
      {isMenuOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 md:hidden" onClick={() => setIsMenuOpen(false)} />
      )}

      {/* MAIN CONTENT */}
      <main className="flex-1 overflow-y-auto pb-10">
        {/* DESKTOP HEADER */}
        <div className="hidden md:block sticky top-0 z-20 bg-zinc-950/80 backdrop-blur-lg border-b border-zinc-800/50 p-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-white">{currentSectorDetails?.name}</h2>
              <p className="text-xs text-zinc-500 mt-1">Strategic Analysis Feed</p>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              LIVE FEED
            </div>
          </div>
        </div>

        <div className="p-4 md:p-6 mt-2 md:mt-0">
          {/* CONTENT GRID */}
          {activeSector === "overview" && groupedNews ? (
            <div className="space-y-8">
              {Object.entries(groupedNews).map(([sector, items]) => (
                <div key={sector}>
                  <div className="flex items-center gap-2 mb-4">
                    <span className={`w-1.5 h-1.5 rounded-full ${SECTORS.find(s => s.id === sector.toLowerCase())?.color || 'bg-zinc-500'}`}></span>
                    <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500">{sector}</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {items.map((item) => <NewsCard key={item.id} item={item} />)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredNews.length > 0 ? (
                filteredNews.map((item) => <NewsCard key={item.id} item={item} />)
              ) : (
                <div className="col-span-full py-20 text-center text-zinc-500 border border-dashed border-zinc-800 rounded-lg bg-zinc-900/20">
                  No data for this sector.
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

// NEWS CARD COMPONENT
function NewsCard({ item }: { item: any }) {
  const sectorConfig = SECTORS.find(s => s.id === (item.sector || "").toLowerCase());
  
  return (
    <div className="group bg-zinc-900/40 border border-zinc-800/60 rounded-xl overflow-hidden hover:border-zinc-700 transition-all duration-300 flex flex-col">
      <div className="p-5 flex flex-col flex-1">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <span className={`text-[9px] uppercase font-bold tracking-wider text-zinc-500 bg-zinc-800 px-2 py-1 rounded`}>
            {item.sector}
          </span>
          <span className="text-[10px] text-zinc-600 font-mono">{item.date}</span>
        </div>

        {/* Title */}
        <h3 className="text-sm font-semibold text-zinc-100 leading-snug mb-4 flex-1">
          {item.title}
        </h3>

        {/* Analysis */}
        <div className="space-y-3 text-xs">
          <div className="bg-zinc-800/40 p-2.5 rounded border-l-2 border-zinc-600">
            <p className="text-zinc-400 leading-relaxed">{item.interpretation}</p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="bg-emerald-500/5 border border-dashed border-emerald-500/20 p-2 rounded">
              <h4 className="text-[9px] uppercase font-bold text-emerald-500 mb-1">Opportunity</h4>
              <p className="text-[10px] text-zinc-500 leading-relaxed">{item.opportunity}</p>
            </div>
            <div className="bg-red-500/5 border border-dashed border-red-500/20 p-2 rounded">
              <h4 className="text-[9px] uppercase font-bold text-red-500 mb-1">Risk</h4>
              <p className="text-[10px] text-zinc-500 leading-relaxed">{item.risk}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
