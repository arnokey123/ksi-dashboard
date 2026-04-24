"use client";

import { useState, useMemo } from 'react';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

// --- HELPERS ---
const formatNairobiTime = (timestamp: number) => {
  const date = new Date(timestamp);
  return date.toLocaleString('en-KE', { 
    timeZone: 'Africa/Nairobi', 
    dateStyle: 'medium', 
    timeStyle: 'short' 
  });
};

// Filter Logic
const filterByTime = (sales: any[], range: string) => {
  const now = new Date();
  return sales.filter((s: any) => {
    const date = new Date(s.time);
    if (range === 'day') return date.toDateString() === now.toDateString();
    if (range === 'week') {
      const startOfWeek = new Date(now); startOfWeek.setDate(now.getDate() - now.getDay());
      return date >= startOfWeek;
    }
    if (range === 'month') return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    if (range === 'year') return date.getFullYear() === now.getFullYear();
    return true;
  });
};

// --- COMPONENTS ---

function WeeklyChart({ data }: { data: number[] }) {
  const max = Math.max(...data, 1);
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
      <h3 className="text-zinc-400 text-sm font-bold uppercase mb-4">Revenue Trend</h3>
      <div className="flex items-end justify-between gap-2 h-32">
        {data.map((val, i) => (
          <div key={i} className="flex flex-col items-center gap-1 flex-1">
            <div className="w-full bg-zinc-800 rounded-t relative" style={{ height: `${(val / max) * 100}%`, minHeight: '4px' }}>
              <div className="absolute -top-5 w-full text-center text-[10px] text-zinc-500">{val > 0 ? `${(val/1000).toFixed(0)}k` : ''}</div>
              <div className="w-full h-full bg-gradient-to-t from-blue-600 to-blue-400 rounded-t opacity-80"></div>
            </div>
            <span className="text-[10px] text-zinc-500">{days[i]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatCard({ title, value, suffix = "" }: { title: string, value: number, suffix?: string }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
      <div className="text-zinc-500 text-xs uppercase font-bold">{title}</div>
      <div className="text-2xl font-bold text-white mt-1">
        {typeof value === 'number' ? value.toLocaleString() : value} <span className="text-sm text-zinc-400">{suffix}</span>
      </div>
    </div>
  );
}

export default function ShopDashboard() {
  const [tab, setTab] = useState('overview');
  const [timeRange, setTimeRange] = useState('week');
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;

  const { data: sales, isLoading, mutate } = useSWR('/api/sales', fetcher, { 
    refreshInterval: 5000, fallbackData: [] 
  });

  // Filter Sales based on Time Range
  const filteredSales = useMemo(() => filterByTime(sales, timeRange), [sales, timeRange]);
  
  // Pagination Logic
  const totalPages = Math.ceil(filteredSales.length / itemsPerPage);
  const paginatedSales = filteredSales.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  // Stats Calculation
  const totalRevenue = filteredSales.reduce((sum: number, s: any) => sum + (s.total || 0), 0);
  const avgOrder = filteredSales.length ? (totalRevenue / filteredSales.length) : 0;

  // Chart Data Logic (Last 7 days)
  const chartData = useMemo(() => {
    const days = [0,0,0,0,0,0,0];
    const today = new Date();
    filteredSales.forEach((s: any) => {
      const d = new Date(s.time);
      const diff = Math.floor((today.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
      if (diff >= 0 && diff < 7) days[6 - diff] += s.total;
    });
    return days;
  }, [filteredSales]);

  const handleDelete = async (time: number) => {
    if(!confirm("Delete this sale?")) return;
    try {
      await fetch(`/api/sales?time=${time}`, { method: 'DELETE' });
      mutate();
    } catch (e) { alert("Error"); }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 pb-10">
      {/* HEADER */}
      <div className="sticky top-0 z-10 bg-zinc-950 border-b border-zinc-800">
        <div className="p-4 flex justify-between items-center">
          <div>
            <h1 className="text-lg font-bold text-white">Sales Dashboard</h1>
            <p className="text-xs text-zinc-500">Analysis & Insights</p>
          </div>
          <span className="flex items-center gap-2 text-[10px] text-emerald-400 bg-emerald-900/30 px-2 py-1 rounded border border-emerald-800/50">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> LIVE
          </span>
        </div>

        {/* TABS */}
        <div className="flex border-b border-zinc-800 px-4">
          {['overview', 'transactions'].map((t) => (
            <button 
              key={t} 
              onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                tab === t ? 'border-blue-500 text-white' : 'border-transparent text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {/* TIME FILTER */}
        <div className="p-2 flex gap-1 overflow-x-auto">
          {[
            { id: 'day', label: 'Today' }, 
            { id: 'week', label: 'Week' }, 
            { id: 'month', label: 'Month' }, 
            { id: 'year', label: 'Year' }, 
            { id: 'all', label: 'All Time' }
          ].map((t) => (
            <button 
              key={t.id}
              onClick={() => { setTimeRange(t.id); setPage(1); }}
              className={`px-3 py-1 rounded text-xs font-bold whitespace-nowrap transition-colors ${
                timeRange === t.id ? 'bg-blue-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* CONTENT */}
      <div className="p-4 space-y-4">
        {isLoading ? <div className="text-zinc-500 p-10 text-center">Loading data...</div> : (
          <>
            {/* OVERVIEW TAB */}
            {tab === 'overview' && (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <StatCard title="Revenue" value={totalRevenue} suffix="KSh" />
                  <StatCard title="Sales" value={filteredSales.length} />
                  <StatCard title="Avg Order" value={avgOrder.toFixed(0)} suffix="KSh" />
                  <StatCard title="Growth" value="+12" suffix="%" /> {/* Placeholder */}
                </div>
                
                <WeeklyChart data={chartData} />
                
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
                  <h3 className="text-zinc-400 text-sm font-bold uppercase mb-3">Top Items</h3>
                  <div className="space-y-2">
                    {Object.entries(filteredSales.reduce((acc: any, s: any) => {
                      s.items?.forEach((it: any) => acc[it.name] = (acc[it.name] || 0) + it.qty);
                      return acc;
                    }, {})).sort((a: any, b: any) => b[1] - a[1]).slice(0, 5).map(([name, qty], i) => (
                      <div key={i} className="flex justify-between items-center text-xs bg-zinc-800/50 p-2 rounded">
                        <span className="text-zinc-300 truncate pr-2">{name}</span>
                        <span className="text-zinc-400 font-mono">{qty} sold</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* TRANSACTIONS TAB */}
            {tab === 'transactions' && (
              <>
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                  <div className="divide-y divide-zinc-800">
                    {paginatedSales.length === 0 ? (
                      <div className="p-10 text-center text-zinc-600">No sales found for this period</div>
                    ) : (
                      paginatedSales.map((sale: any, i: number) => (
                        <div key={i} className="p-3 hover:bg-zinc-800/30 flex justify-between items-center group">
                          <div className="flex-1">
                            <div className="flex justify-between mb-1">
                              <span className="text-xs text-zinc-400">{formatNairobiTime(sale.time)}</span>
                              <span className="text-sm font-bold text-green-400">KSh {sale.total}</span>
                            </div>
                            <div className="text-sm text-zinc-200 truncate">
                              {sale.items?.map((it: any) => `${it.name} (${it.qty})`).join(', ')}
                            </div>
                            <div className="text-[10px] text-blue-400 mt-0.5 uppercase">{sale.payment}</div>
                          </div>
                          <button 
                            onClick={() => handleDelete(sale.time)}
                            className="ml-2 text-zinc-700 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-2"
                          >
                            🗑
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* PAGINATION CONTROLS */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-2 mt-4">
                    <button 
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="px-3 py-1 text-xs bg-zinc-800 rounded disabled:opacity-50"
                    > Prev </button>
                    
                    <span className="text-xs text-zinc-500">
                      Page {page} of {totalPages}
                    </span>
                    
                    <button 
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="px-3 py-1 text-xs bg-zinc-800 rounded disabled:opacity-50"
                    > Next </button>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
