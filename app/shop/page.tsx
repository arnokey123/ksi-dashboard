"use client"; // This makes it interactive

import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

// Function to fix the time to Nairobi Time
const formatNairobiTime = (timestamp: number) => {
  const date = new Date(timestamp);
  return date.toLocaleString('en-KE', { 
    timeZone: 'Africa/Nairobi', 
    dateStyle: 'medium', 
    timeStyle: 'short' 
  });
};

export default function ShopDashboard() {
  // Fetch data every 5 seconds (Real-time polling)
  const { data: sales, isLoading } = useSWR('/api/sales', fetcher, { 
    refreshInterval: 5000,
    fallbackData: [] 
  });

  const totalRevenue = sales.reduce((sum: number, s: any) => sum + (s.total || 0), 0);

  return (
    <div className="p-8 bg-zinc-950 min-h-screen text-zinc-100">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white">🛒 Shop Sales Analysis</h1>
        <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-900/20 px-3 py-1 rounded-full">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          LIVE
        </div>
      </div>
      
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-8">
        <h2 className="text-zinc-400 text-sm uppercase mb-1">Total Synced Revenue</h2>
        <div className="text-4xl font-bold text-green-400">KSh {totalRevenue.toLocaleString()}</div>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <div className="text-zinc-500">Loading...</div>
        ) : sales.length === 0 ? (
          <div className="text-zinc-500">No sales synced yet. Use the Sync button in your App.</div>
        ) : (
          sales.map((sale: any, i: number) => (
            <div key={i} className="bg-zinc-900 border border-zinc-800 p-4 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                {/* FIX: Using Nairobi Timezone */}
                <span className="text-zinc-400 text-xs">{formatNairobiTime(sale.time)}</span>
                <span className="text-green-400 font-bold">KSh {sale.total}</span>
              </div>
              <div className="text-white font-medium">
                {sale.items?.map((it: any) => `${it.name} (${it.qty})`).join(', ')}
              </div>
              <div className="text-xs text-blue-400 mt-1 uppercase">{sale.payment}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
