"use client"; // This tells Next.js to run this logic in the browser

import { useState } from "react";

// 1. THE DATABASE (Our Mock Intelligence)
const intelligenceData = [
  {
    id: 1,
    sector: "FINTECH",
    title: "CBK Introduces Digital Credit Provider Licensing Framework",
    date: "Tue, 21 April 2026",
    type: "EVENT",
    interpretation: "The Central Bank of Kenya is asserting tighter oversight of the expanding digital lending ecosystem. This signals a deliberate regulatory shift toward consumer protection and market hygiene, responding to years of complaints around predatory lending practices by unregistered mobile lenders.",
    opportunity: "Formalisation creates a level playing field favouring well-capitalised, compliant fintechs. Licensed players gain reputational credibility and access to institutional capital.",
    risk: "Smaller and informal lenders may exit the market, creating short-term credit gaps in underserved segments. Compliance costs could squeeze margins for mid-tier players."
  },
  {
    id: 2,
    sector: "LOGISTICS",
    title: "Agri-logistics platform Twiga Foods announced a $12M expansion into 18 secondary towns.",
    date: "Tue, 21 April 2026",
    type: "EVENT",
    interpretation: "Twiga's expansion represents a significant bet on Kenya's secondary city growth story. By extending cold chain infrastructure beyond Nairobi, the company is addressing one of the most persistent inefficiencies in Kenya's food supply chain.",
    opportunity: "The cold chain buildout creates demand for refrigeration equipment suppliers and renewable energy solutions for off-grid cold storage.",
    risk: "Secondary town logistics operations face higher per-unit costs than Nairobi routes, putting pressure on unit economics."
  },
  {
    id: 3,
    sector: "CLEAN ENERGY",
    title: "KenGen secures $600M financing for 400MW geothermal expansion in Olkaria.",
    date: "Tue, 21 April 2026",
    type: "EVENT",
    interpretation: "This expansion cements Kenya's position as Africa's leading geothermal power producer. The scale of financing reflects high confidence from DFIs in Kenya's energy transition narrative and KenGen's execution track record.",
    opportunity: "Local engineering and drilling service providers stand to capture significant contract value. Kenya could become a regional electricity exporter.",
    risk: "Project timelines face risks from land use disputes with local communities. Currency exposure on dollar-denominated debt could strain finances."
  },
  {
    id: 4,
    sector: "AGRICULTURE",
    title: "Government lifts ban on GMO imports to combat rising food insecurity.",
    date: "Mon, 20 April 2026",
    type: "EVENT",
    interpretation: "A controversial but decisive policy shift aimed at lowering animal feed costs and addressing drought resilience. It signals a prioritization of food security over previous biosafety caution.",
    opportunity: "Opens the market for genetically modified seed technologies and large-scale commercial grain farming.",
    risk: "Potential backlash from export markets (EU) with strict GMO restrictions, and legal challenges from civil society groups."
  }
];

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
  // 2. THE STATE (The "Brain" that remembers what you clicked)
  const [activeSector, setActiveSector] = useState("Overview");

  // 3. THE FILTER (Logic to decide which news to show)
  const filteredNews = intelligenceData.filter((item) => {
    if (activeSector === "Overview") return true; // Show all if Overview is selected
    return item.sector === activeSector.toUpperCase(); // Match the sector name
  });

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
            // Logic to check if this button is active
            const isActive = activeSector === sector.name;
            
            return (
              <button 
                key={sector.name}
                onClick={() => setActiveSector(sector.name)} // 4. THE ACTION (Update state on click)
                className={`flex items-center justify-between px-3 py-2 rounded-md cursor-pointer transition-colors group whitespace-nowrap
                  ${isActive 
                    ? "bg-white text-zinc-900 font-bold" // Active style (White button)
                    : "hover:bg-zinc-800/60 text-zinc-300" // Inactive style
                  }
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
        
        {/* HEADER */}
        <div className="flex justify-between items-center mb-6 border-b border-zinc-800 pb-4">
          <div>
            <h2 className="text-base font-semibold text-zinc-100">
              Intelligence Feed {activeSector !== "Overview" ? `— ${activeSector}` : ""}
            </h2>
            <p className="text-xs text-zinc-500">Real-time strategic analysis</p>
          </div>
        </div>

        {/* NEWS LIST */}
        <div className="space-y-4">
          {filteredNews.length > 0 ? (
            filteredNews.map((item) => (
              <div key={item.id} className="bg-zinc-900/30 border border-zinc-800 rounded-lg overflow-hidden hover:border-zinc-700 transition-colors">
                
                {/* CARD HEADER */}
                <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-800/20">
                  <span className="text-[11px] uppercase tracking-wider font-bold text-cyan-400">{item.sector}</span>
                  <span className="text-[10px] text-zinc-500 font-mono">{item.date}</span>
                </div>

                {/* CARD BODY */}
                <div className="p-5 space-y-4">
                  <h3 className="text-lg font-semibold text-zinc-100 leading-tight">
                    {item.title}
                  </h3>

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
            <div className="text-center text-zinc-500 py-10">
              No intelligence entries found for this sector yet.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
