"use client";

import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

// --- HELPER FUNCTIONS ---
const formatNairobiTime = (timestamp: number) => {
  const date = new Date(timestamp);
  return date.toLocaleString('en-KE', { 
    timeZone: 'Africa/Nairobi', 
    dateStyle: 'medium', 
    timeStyle: 'short' 
  });
};

const formatShortDate = (timestamp: number) => {
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-KE', { 
    timeZone: 'Africa/Nairobi', 
    day: 'numeric', 
    month: 'short' 
  });
};

const getDayName = (timestamp: number) => {
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-KE', { timeZone: 'Africa/Nairobi', weekday: 'short' });
};

// --- COMPONENTS ---

// Simple CSS Bar Chart
function WeeklyChart({ sales }: { sales: any[] }) {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const last7Days: { [key: string]: number } = {};
  
  // Init last 7 days with 0
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toLocaleDateString('en-KE', { timeZone: 'Africa/Nairobi' });
    last7Days[key] = 0;
  }

  // Aggregate sales
  sales.forEach((s: any) => {
    const key = new Date(s.time).toLocaleDateString('en-KE', { timeZone: 'Africa/Nairobi' });
    if (last7Days[key] !== undefined) last7Days[key] += s.total || 0;
  });

  const maxVal = Math.max(...Object.values(last7Days), 1);
  const entries = Object.entries(last7Days);

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
      <h3 className="text-zinc-400 text-sm font-bold uppercase mb-4">Revenue (Last 7 Days)</h3>
      <div className="flex items-end justify-between gap-2 h-32">
        {entries.map(([date, val], i) => (
          <div key={i} className="flex flex-col items-center gap-1 flex-1">
            <div className="w-full bg-zinc-800 rounded-t relative" style={{ height: `${(val / maxVal) * 100}%`, minHeight: '4px' }}>
              <div className="absolute -top-5 w-full text-center text-[10px] text-zinc-500">{val > 0 ? (val/1000).toFixed(1)+'k' : ''}</div>
              <div className="w-full h-full bg-gradient-to-t from-orange-600 to-orange-400 rounded-t opacity-80"></div>
            </div>
            <span className="text-[10px] text-zinc-500">{days[new Date(date).getDay()]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Payment Split Donut (CSS)
function PaymentSplit({ sales }: { sales: any[] }) {
  let cash = 0, mpesa = 0, other = 0;
  sales.forEach((s: any) => {
    if(s.payment === 'cash') cash += s.total;
    else if(s.payment === 'mpesa') mpesa += s.total;
    else other += s.total;
  });
  const total = cash + mpesa + other;
  
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex flex-col justify-between">
      <h3 className="text-zinc-400 text-sm font-bold uppercase mb-4">Payment Mix</h3>
      <div className="flex items-center justify-around">
        {/* Visual Circle */}
        <div className="relative w-20 h-20">
           <svg className="w-full h-full transform -rotate-90">
             <circle cx="40" cy="40" r="35" stroke="#27272a" strokeWidth="8" fill="none" />
             {mpesa > 0 && <circle cx="40" cy="40" r="35" stroke="#16a34a" strokeWidth="8" fill="none" 
               strokeDasharray={`${(mpesa/total) * 220} 220`} />}
             {cash > 0 && <circle cx="40" cy="40" r="35" stroke="#eab308" strokeWidth="8" fill="none" 
               strokeDasharray={`${(cash/total) * 220} 220`}
               strokeDashoffset={`-${(mpesa/total) * 220}`} />}
           </svg>
           <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">
             {total > 0 ? `${sales.length}` : '0'}
           </div>
        </div>
        
        {/* Legend */}
        <div className="flex flex-col gap-2 text-xs">
           <div className="flex items-center gap-2">
             <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
             <span className="text-zinc-400">Cash ({((cash/total)*100 || 0).toFixed(0)}%)</span>
           </div>
           <div className="flex items-center gap-2">
             <span className="w-2 h-2 rounded-full bg-green-600"></span>
             <span className="text-zinc-400">M-Pesa ({((mpesa/total)*100 || 0).toFixed(0)}%)</span>
           </div>
        </div>
      </div>
    </div>
  );
}

// Top Selling Items
function TopItems({ sales }: { sales: any[] }) {
  const itemCount: { [key: string]: number } = {};
  
  sales.forEach((s: any) => {
    s.items?.forEach((it: any) => {
      itemCount[it.name] = (itemCount[it.name] || 0) + it.qty;
    });
  });

  const sorted = Object.entries(itemCount).sort((a, b) => b[1] - a[1]).slice(0, 5);

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
      <h3 className="text-zinc-400 text-sm font-bold uppercase mb-3">Top Selling Items</h3>
      <div className="space-y-2">
        {sorted.length === 0 ? <div className="text-zinc-600 text-xs">No data</div> : 
          sorted.map(([name, qty], i) => (
            <div key={i} className="flex justify-between items-center text-xs">
              <span className="text-zinc-300 truncate pr-2">{name}</span>
              <span className="text-zinc-500 font-mono bg-zinc-800 px-2 rounded">{qty} sold</span>
            </div>
          ))
        }
      </div>
    </div>
  );
}

// --- MAIN PAGE ---
export default function ShopDashboard() {
  const { data: sales, isLoading, mutate } = useSWR('/api/sales', fetcher, { 
    refreshInterval: 5000,
    fallbackData: [] 
  });

  const totalRevenue = sales.reduce((sum: number, s: any) => sum + (s.total || 0), 0);
  
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
      <div className="sticky top-0 z-10 bg-zinc-950/80 backdrop-blur-sm border-b border-zinc-800 p-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-lg font-bold text-white">Sales Dashboard</h1>
            <p className="text-xs text-zinc-500">Last updated: Just now</p>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-emerald-400 bg-emerald-900/30 px-2 py-1 rounded border border-emerald-800/50">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            LIVE
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* METRICS GRID */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-gradient-to-br from-orange-600 to-orange-500 rounded-xl p-4 shadow-lg">
            <div className="text-white/80 text-[10px] uppercase font-bold">Total Revenue</div>
            <div className="text-xl font-bold text-white mt-1">KSh {totalRevenue.toLocaleString()}</div>
          </div>
          
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <div className="text-zinc-500 text-[10px] uppercase font-bold">Total Sales</div>
            <div className="text-xl font-bold text-white mt-1">{sales.length}</div>
          </div>
          
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <div className="text-zinc-500 text-[10px] uppercase font-bold">Avg. Order</div>
            <div className="text-xl font-bold text-white mt-1">
              KSh {sales.length ? (totalRevenue/sales.length).toFixed(0) : 0}
            </div>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <div className="text-zinc-500 text-[10px] uppercase font-bold">Top Item</div>
            <div className="text-sm font-bold text-white mt-1 truncate">N/A</div> 
          </div>
        </div>

        {/* CHARTS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <WeeklyChart sales={sales} />
          </div>
          <div className="space-y-4">
            <PaymentSplit sales={sales} />
          </div>
        </div>

        <TopItems sales={sales} />

        {/* SALES LIST */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-zinc-800">
            <h3 className="text-zinc-400 text-sm font-bold uppercase">Recent Transactions</h3>
          </div>
          <div className="divide-y divide-zinc-800">
            {isLoading ? (
              <div className="p-4 text-zinc-500 text-sm">Loading...</div>
            ) : sales.length === 0 ? (
              <div className="p-10 text-center text-zinc-600 text-sm">No sales found</div>
            ) : (
              sales.slice(0, 10).map((sale: any, i: number) => (
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
      </div>
    </div>
  );
}
