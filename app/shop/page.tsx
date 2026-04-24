async function getSales() {
  // Fetching from your own API
  const res = await fetch('https://ksi-dashboard-dusky.vercel.app/api/sales', { cache: 'no-store' });
  if (!res.ok) return [];
  return res.json();
}

export default async function ShopDashboard() {
  const sales = await getSales();
  
  const totalRevenue = sales.reduce((sum: number, s: any) => sum + (s.total || 0), 0);

  return (
    <div className="p-8 bg-zinc-950 min-h-screen text-zinc-100">
      <h1 className="text-2xl font-bold text-white mb-6">🛒 Shop Sales Analysis</h1>
      
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-8">
        <h2 className="text-zinc-400 text-sm uppercase mb-1">Total Synced Revenue</h2>
        <div className="text-4xl font-bold text-green-400">KSh {totalRevenue.toLocaleString()}</div>
      </div>

      <div className="space-y-4">
        {sales.length === 0 ? (
          <div className="text-zinc-500">No sales synced yet. Use the Sync button in your App.</div>
        ) : (
          sales.map((sale: any, i: number) => (
            <div key={i} className="bg-zinc-900 border border-zinc-800 p-4 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="text-zinc-400 text-xs">{new Date(sale.time).toLocaleString()}</span>
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

