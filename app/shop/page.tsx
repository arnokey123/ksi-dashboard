"use client";

import { useState, useMemo } from 'react';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

// --- HELPERS ---
const formatNairobiTime = (timestamp: number) => {
  const date = new Date(timestamp);
  return date.toLocaleString('en-KE', { timeZone: 'Africa/Nairobi', dateStyle: 'medium', timeStyle: 'short' });
};

// Updated to handle data robustly
const getSaleTotal = (s: any) => {
  // Prefer the main total if available
  if (s.total && !isNaN(Number(s.total))) return Number(s.total);
  // Fallback: Sum of item prices (item.price is already total for the line)
  if (s.items && Array.isArray(s.items)) return s.items.reduce((sum: number, it: any) => sum + (Number(it.price) || 0), 0);
  return 0;
};

// --- COMPONENTS ---
function WeeklyChart({ sales }: { sales: any[] }) {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dailyTotals = [0, 0, 0, 0, 0, 0, 0];
  sales.forEach((s: any) => {
    const date = new Date(s.time);
    if (!isNaN(date.getTime())) dailyTotals[date.getDay()] += getSaleTotal(s);
  });
  const maxVal = Math.max(...dailyTotals, 1);

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
      <h3 className="text-zinc-400 text-sm font-bold uppercase mb-4">Revenue Trend</h3>
      <div className="flex items-end justify-between gap-2 h-32">
        {dailyTotals.map((val, i) => (
          <div key={i} className="flex flex-col items-center gap-1 flex-1">
            <div className="w-full bg-zinc-800 rounded-t relative" style={{ height: `${(val / maxVal) * 100}%`, minHeight: val > 0 ? '4px' : '0px' }}>
              {val > 0 && <div className="absolute -top-5 w-full text-center text-[10px] text-zinc-500">{(val / 1000).toFixed(1) + 'k'}</div>}
              <div className="w-full h-full bg-gradient-to-t from-blue-600 to-blue-400 rounded-t opacity-80"></div>
            </div>
            <span className="text-[10px] text-zinc-500">{days[i]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatCard({ title, value, suffix = "", color = "text-white" }: { title: string, value: number, suffix?: string, color?: string }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
      <div className="text-zinc-500 text-xs uppercase font-bold">{title}</div>
      <div className={`text-xl font-bold ${color} mt-1`}>
        {value.toLocaleString()} <span className="text-xs text-zinc-400">{suffix}</span>
      </div>
    </div>
  );
}

export default function ShopDashboard() {
  const [tab, setTab] = useState('overview');
  const [page, setPage] = useState(1);
  const itemsPerPage = 15;

  // --- FILTER STATES ---
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');

  const { data: sales, isLoading, mutate } = useSWR('/api/sales', fetcher, { refreshInterval: 5000, fallbackData: [] });
  const { data: inventory, mutate: mutateInventory } = useSWR('/api/inventory', fetcher, { refreshInterval: 10000, fallbackData: [] });

  // --- FILTERING LOGIC ---
  const filteredSales = useMemo(() => {
    return sales.filter((s: any) => {
      const saleDate = new Date(s.time);
      if (paymentFilter !== 'all' && s.payment !== paymentFilter) return false;
      if (startDate) { if (saleDate < new Date(startDate)) return false; }
      if (endDate) { if (saleDate > new Date(endDate + "T23:59:59")) return false; }
      return true;
    });
  }, [sales, startDate, endDate, paymentFilter]);

  // --- FLATTEN ITEMS FOR LIST VIEW ---
  const flatItems = useMemo(() => {
    const items: any[] = [];
    filteredSales.forEach((sale: any) => {
      (sale.items || []).forEach((it: any) => {
        items.push({
          ...it,
          time: sale.time,
          payment: sale.payment,
          debtor: sale.debtor,
          sale_id: sale.time
        });
      });
    });
    return items;
  }, [filteredSales]);

  // --- CALCULATIONS ---
  // Calculate totals based on filtered sales
  const totalCash = filteredSales.filter((s: any) => s.payment === 'cash').reduce((sum: number, s: any) => sum + getSaleTotal(s), 0);
  const totalMpesa = filteredSales.filter((s: any) => s.payment === 'mpesa').reduce((sum: number, s: any) => sum + getSaleTotal(s), 0);
  const totalCredit = filteredSales.filter((s: any) => s.payment === 'credit').reduce((sum: number, s: any) => sum + getSaleTotal(s), 0);
  const totalRevenue = totalCash + totalMpesa + totalCredit;

  const totalPages = Math.ceil(flatItems.length / itemsPerPage);
  const paginatedItems = flatItems.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  const avgOrder = filteredSales.length ? (totalRevenue / filteredSales.length) : 0;

  const handleDelete = async (time: number) => {
    if(!confirm("Delete this sale?")) return;
    try {
      await fetch(`/api/sales?time=${time}`, { method: 'DELETE' });
      mutate();
    } catch (e) { alert("Error"); }
  };

  const handleClearAll = async () => {
    if(!confirm("DELETE ALL RECORDS? This cannot be undone.")) return;
    try {
      await fetch(`/api/sales?time=all`, { method: 'DELETE' });
      mutate();
    } catch (e) { alert("Error deleting all"); }
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
          {['overview', 'transactions', 'inventory'].map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === t ? 'border-blue-500 text-white' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* CONTENT */}
      <div className="p-4 space-y-4">
        
        {/* INVENTORY TAB */}
        {tab === 'inventory' && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-zinc-800 flex justify-between items-center">
              <h3 className="text-zinc-400 text-sm font-bold uppercase">Stock Levels</h3>
              <span className="text-xs text-zinc-500">{inventory.length} Items</span>
            </div>
            <div className="divide-y divide-zinc-800">
              {inventory.length === 0 ? (
                <div className="p-10 text-center text-zinc-600">No inventory found.</div>
              ) : (
                inventory.map((item: any, i: number) => (
                  <div key={i} className="p-3 flex justify-between items-center">
                    <div>
                      <div className="text-sm text-white font-medium">{item.name}</div>
                      <div className="text-xs text-zinc-500">KSh {item.price} / {item.unit || 'ea'}</div>
                    </div>
                    <div className={`text-sm font-mono font-bold ${item.stock <= 0 ? 'text-red-400' : item.stock < 5 ? 'text-yellow-400' : 'text-green-400'}`}>
                      {item.stock ? item.stock.toFixed(item.unit === 'each' ? 0 : 2) : 0} left
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* OVERVIEW TAB */}
        {tab === 'overview' && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatCard title="Revenue" value={totalRevenue} suffix="KSh" color="text-orange-400" />
              <StatCard title="Sales" value={filteredSales.length} color="text-white" />
              <StatCard title="Avg Order" value={avgOrder.toFixed(0)} suffix="KSh" color="text-white" />
              <StatCard title="Items" value={inventory.length} color="text-white" />
            </div>
            <WeeklyChart sales={filteredSales} />
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
              <h3 className="text-zinc-400 text-sm font-bold uppercase mb-3">Top Selling Items</h3>
              <div className="space-y-2">
                {Object.entries(flatItems.reduce((acc: any, it: any) => {
                  acc[it.name] = (acc[it.name] || 0) + (it.qty || 0);
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
            {/* FILTERS SECTION */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-3">
              <div className="flex flex-wrap gap-2 justify-between items-center">
                 <h3 className="text-sm font-bold text-zinc-300">Filters</h3>
                 <button 
                   onClick={handleClearAll}
                   className="text-[10px] bg-red-900/30 text-red-400 border border-red-800 px-2 py-1 rounded hover:bg-red-900/50"
                 >
                   🗑 Clear All Records
                 </button>
              </div>
              
              {/* Date Inputs */}
              <div className="flex flex-wrap gap-2 items-center">
                <div className="flex items-center gap-1">
                  <label className="text-xs text-zinc-500">From:</label>
                  <input 
                    type="date" 
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="bg-zinc-800 border border-zinc-700 text-xs text-white px-2 py-1 rounded"
                  />
                </div>
                <div className="flex items-center gap-1">
                  <label className="text-xs text-zinc-500">To:</label>
                  <input 
                    type="date" 
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="bg-zinc-800 border border-zinc-700 text-xs text-white px-2 py-1 rounded"
                  />
                </div>
                <button 
                   onClick={() => { setStartDate(''); setEndDate(''); }}
                   className="text-xs text-blue-400 hover:text-blue-300"
                 >
                   Reset Dates
                 </button>
              </div>

              {/* Payment Filter Buttons */}
              <div className="flex gap-1 overflow-x-auto pb-1">
                {[
                  { id: 'all', label: 'All Records' },
                  { id: 'cash', label: '💵 Cash' },
                  { id: 'mpesa', label: '📱 M-Pesa' },
                  { id: 'credit', label: '📝 Credit' }
                ].map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setPaymentFilter(p.id)}
                    className={`px-3 py-1 rounded text-xs font-bold whitespace-nowrap transition-colors ${
                      paymentFilter === p.id ? 'bg-blue-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* SUMMARY BOX */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-orange-900/20 border border-orange-800 rounded-xl p-3">
                <div className="text-orange-400 text-xs font-bold">Total Revenue</div>
                <div className="text-xl font-bold text-orange-500">KSh {totalRevenue.toLocaleString()}</div>
              </div>
              <div className="bg-green-900/20 border border-green-800 rounded-xl p-3">
                <div className="text-green-400 text-xs font-bold">Cash Total</div>
                <div className="text-xl font-bold text-green-500">KSh {totalCash.toLocaleString()}</div>
              </div>
              <div className="bg-blue-900/20 border border-blue-800 rounded-xl p-3">
                <div className="text-blue-400 text-xs font-bold">M-Pesa Total</div>
                <div className="text-xl font-bold text-blue-500">KSh {totalMpesa.toLocaleString()}</div>
              </div>
              <div className="bg-red-900/20 border border-red-800 rounded-xl p-3">
                <div className="text-red-400 text-xs font-bold">Credit Total</div>
                <div className="text-xl font-bold text-red-500">KSh {totalCredit.toLocaleString()}</div>
              </div>
            </div>

            {/* SALES LIST - FLATTENED ITEMS */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
              <div className="divide-y divide-zinc-800">
                {paginatedItems.length === 0 ? (
                  <div className="p-10 text-center text-zinc-600">No items found for selected filters</div>
                ) : (
                  paginatedItems.map((item: any, i: number) => (
                    <div key={i} className="p-3 hover:bg-zinc-800/30 flex justify-between items-center">
                      <div className="flex-1">
                        <div className="flex justify-between mb-1">
                          <span className="text-xs text-zinc-400">{formatNairobiTime(item.time)}</span>
                          {/* FIX: item.price is ALREADY the total. Do not multiply by qty. */}
                          <span className="text-sm font-bold text-green-400">
                            KSh {item.price ? Number(item.price).toLocaleString() : '0'}
                          </span>
                        </div>
                        {/* Item Name + Qty */}
                        <div className="text-sm text-zinc-100 font-medium">
                          {item.name} <span className="text-zinc-500">× {item.qty}</span>
                        </div>
                        <div className="text-[10px] mt-0.5 uppercase flex items-center gap-1">
                          <span className={`px-1.5 py-0.5 rounded text-white ${item.payment === 'cash' ? 'bg-green-600' : item.payment === 'mpesa' ? 'bg-blue-600' : item.payment === 'credit' ? 'bg-red-600' : 'bg-zinc-600'}`}>{item.payment}</span>
                          {item.payment === 'credit' && item.debtor && <span className="text-zinc-400 font-normal normal-case">• {item.debtor}</span>}
                        </div>
                      </div>
                      <button onClick={() => handleDelete(item.sale_id)} className="ml-2 text-zinc-700 hover:text-red-500 transition-opacity p-2 opacity-50 hover:opacity-100">🗑</button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* PAGINATION */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-4">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 text-xs bg-zinc-800 rounded disabled:opacity-50"> Prev </button>
                <span className="text-xs text-zinc-500">Page {page} of {totalPages}</span>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1 text-xs bg-zinc-800 rounded disabled:opacity-50"> Next </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
