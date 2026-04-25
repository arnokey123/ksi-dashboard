"use client";

import { useState, useMemo } from 'react';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

// --- HELPERS ---
const formatNairobiTime = (timestamp: number) => {
  const date = new Date(timestamp);
  return date.toLocaleString('en-KE', { timeZone: 'Africa/Nairobi', dateStyle: 'medium', timeStyle: 'short' }); // FIXED
};

const formatShortDate = (timestamp: number) => {
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-KE', { timeZone: 'Africa/Nairobi', day: 'numeric', month: 'short', year: 'numeric' );
};

const filterByTime = (sales: any[], range: string) => {
  const now = new Date();
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const nairobiNow = new Date(utc + (3600000 * 3));

  return sales.filter((s: any) => {
    const date = new Date(s.time);
    if (isNaN(date.getTime())) return false;
    if (range === 'day') return date.toDateString() === nairobiNow.toDateString();
    if (range === 'week') return (nairobiNow.getTime() - date.getTime()) <= 7 * 24 * 60 * 60 * 1000;
    if (range === 'month') return date.getMonth() === nairobiNow.getMonth() && date.getFullYear() === nairobiNow.getFullYear();
    if (range === 'year') return date.getFullYear() === nairobiNow.getFullYear();
    return true;
  });
};

const getSaleTotal = (s: any) => {
  if (s.total && !isNaN(Number(s.total))) return Number(s.total);
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

function StatCard({ title, value, suffix = "" }: { title: string, value: number, suffix?: string }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
      <div className="text-zinc-500 text-xs uppercase font-bold">{title}</div>
      <div className="text-2xl font-bold text-white mt-1">{value.toLocaleString()} <span className="text-sm text-zinc-400">{suffix}</span></div>
    </div>
  );
}

export default function ShopDashboard() {
  const [tab, setTab] = useState('overview');
  
  // Filters
  const [timeRange, setTimeRange] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;

  // Inventory Filters
  const [invSearch, setInvSearch] = useState('');
  const [lowStockFilter, setLowStockFilter] = useState(false);

  const { data: sales, isLoading, mutate } = useSWR('/api/sales', fetcher, { refreshInterval: 5000, fallbackData: [] });
  const { data: inventory } = useSWR('/api/inventory', fetcher, { refreshInterval: 10000, fallbackData: [] });

  // --- SALES FILTERING ---
  const filteredSales = useMemo(() => {
    let result = sales;
    result = filterByTime(result, timeRange);
    if (paymentFilter !== 'all') result = result.filter((s: any) => s.payment === paymentFilter);
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      result = result.filter((s: any) => 
        s.items?.some((it: any) => it.name?.toLowerCase().includes(query)) || 
        s.payment?.toLowerCase().includes(query) ||
        s.debtor?.toLowerCase().includes(query) // Search by debtor name too
      );
    }
    return result;
  }, [sales, timeRange, paymentFilter, searchQuery]);

  const totalPages = Math.ceil(filteredSales.length / itemsPerPage);
  const paginatedSales = filteredSales.slice((page - 1) * itemsPerPage, page * itemsPerPage);
  useMemo(() => { setPage(1); }, [timeRange, paymentFilter, searchQuery]);

  // --- INVENTORY FILTERING ---
  const filteredInventory = useMemo(() => {
    let result = inventory;
    if (invSearch.trim() !== '') {
      result = result.filter((it: any) => it.name?.toLowerCase().includes(invSearch.toLowerCase()));
    }
    if (lowStockFilter) {
      result = result.filter((it: any) => (it.stock || 0) < 5);
    }
    return result;
  }, [inventory, invSearch, lowStockFilter]);

  const totalRevenue = filteredSales.reduce((sum: number, s: any) => sum + getSaleTotal(s), 0);
  const avgOrder = filteredSales.length ? (totalRevenue / filteredSales.length) : 0;
  
  const handleDelete = async (time: number) => {
    if(!confirm("Delete this sale?")) return;
    try { await fetch(`/api/sales?time=${time}`, { method: 'DELETE' }); mutate(); } catch (e) { alert("Error"); }
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

        {/* FILTERS */}
        {tab === 'transactions' && (
          <div className="p-2 flex flex-col gap-2 bg-zinc-900/50">
            <input 
              type="text" 
              placeholder="Search items or debtor..." 
              className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <div className="flex gap-1 overflow-x-auto">
              {[
                { id: 'all', label: 'All' }, { id: 'day', label: 'Today' }, { id: 'week', label: 'Week' }, { id: 'month', label: 'Month' }, { id: 'year', label: 'Year' }
              ].map((t) => (
                <button key={t.id} onClick={() => setTimeRange(t.id)} className={`px-3 py-1 rounded text-xs font-bold whitespace-nowrap transition-colors ${timeRange === t.id ? 'bg-blue-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}>
                  {t.label}
                </button>
              ))}
              <div className="border-l border-zinc-700 mx-1 h-6"></div>
              {[
                { id: 'all', label: 'All Pay' }, { id: 'cash', label: 'Cash' }, { id: 'mpesa', label: 'M-Pesa' }, { id: 'credit', label: 'Credit' }
              ].map((t) => (
                <button key={t.id} onClick={() => setPaymentFilter(t.id)} className={`px-3 py-1 rounded text-xs font-bold whitespace-nowrap transition-colors ${paymentFilter === t.id ? 'bg-orange-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {tab === 'inventory' && (
          <div className="p-2 flex gap-2 bg-zinc-900/50">
            <input 
              type="text" 
              placeholder="Search inventory..." 
              className="flex-1 bg-zinc-800 border border-zinc-700 rounded px-3 py-1.5 text-xs focus:outline-none"
              value={invSearch}
              onChange={(e) => setInvSearch(e.target.value)}
            />
            <button 
              onClick={() => setLowStockFilter(!lowStockFilter)}
              className={`px-3 py-1.5 rounded text-xs font-bold whitespace-nowrap transition-colors ${lowStockFilter ? 'bg-red-600 text-white' : 'bg-zinc-800 text-zinc-400'}`}
            >
              Low Stock
            </button>
          </div>
        )}
      </div>

      {/* CONTENT */}
      <div className="p-4 space-y-4">
        
        {/* INVENTORY TAB */}
        {tab === 'inventory' && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-zinc-800"><h3 className="text-zinc-400 text-sm font-bold uppercase">Stock Levels</h3></div>
            <div className="divide-y divide-zinc-800">
              {filteredInventory.length === 0 ? <div className="p-10 text-center text-zinc-600">No items found.</div> : filteredInventory.map((item: any, i: number) => (
                <div key={i} className="p-3 flex justify-between items-center">
                  <div>
                    <div className="text-sm text-white font-medium">{item.name}</div>
                    <div className="text-xs text-zinc-500">KSh {item.price} / {item.unit || 'ea'}</div>
                  </div>
                  <div className={`text-sm font-mono font-bold ${item.stock <= 0 ? 'text-red-400' : item.stock < 5 ? 'text-yellow-400' : 'text-green-400'}`}>
                    {item.stock ? item.stock.toFixed(item.unit === 'each' ? 0 : 2) : 0} left
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* OVERVIEW TAB */}
        {tab === 'overview' && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatCard title="Revenue" value={totalRevenue} suffix="KSh" />
              <StatCard title="Sales" value={filteredSales.length} />
              <StatCard title="Avg Order" value={avgOrder.toFixed(0)} suffix="KSh" />
              <StatCard title="Items" value={inventory.length} />
            </div>
            <WeeklyChart sales={filteredSales} />
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
              <h3 className="text-zinc-400 text-sm font-bold uppercase mb-3">Top Selling Items</h3>
              <div className="space-y-2">
                {Object.entries(filteredSales.reduce((acc: any, s: any) => {
                  s.items?.forEach((it: any) => acc[it.name] = (acc[it.name] || 0) + (it.qty || 0));
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
            <div className="text-xs text-zinc-500 px-1">Showing {paginatedSales.length} of {filteredSales.length} sales</div>
            <div className="space-y-3">
              {paginatedSales.length === 0 ? (
                <div className="p-10 text-center text-zinc-600 bg-zinc-900 rounded-xl">No sales found.</div>
              ) : (
                paginatedSales.map((sale: any, i: number) => (
                  <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden group relative">
                    {/* Main Card Header */}
                    <div className="p-3 border-b border-zinc-800 flex justify-between items-center bg-zinc-800/30">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] text-zinc-400">{formatNairobiTime(sale.time)}</span>
                        {/* PAYMENT BADGES */}
                        {sale.payment === 'credit-settled' ? (
                          <span className="text-[10px] uppercase font-bold text-purple-400">✓ DEBT SETTLED</span>
                        ) : (
                          <span className="text-[10px] uppercase font-bold text-blue-400">{sale.payment}</span>
                        )}
                      </div>
                      <span className="text-base font-bold text-green-400">KSh {getSaleTotal(sale)}</span>
                    </div>

                    {/* ITEMS LIST */}
                    <div className="p-2 space-y-1">
                      {sale.items?.map((it: any, idx: number) => (
                        <div key={idx} className="flex justify-between items-center text-xs p-2 bg-zinc-800/20 rounded">
                          <div className="flex items-center gap-2">
                            <span className="text-zinc-300">{it.name}</span>
                            <span className="text-zinc-600">x{it.qty}</span>
                          </div>
                          <span className="text-zinc-400 font-mono">KSh {it.price}</span>
                        </div>
                      ))}
                    </div>

                    {/* DEBTOR / CREDIT INFO SECTION */}
                    {sale.payment === 'credit' && sale.debtor && (
                      <div className="px-3 pb-2 pt-0 border-t border-zinc-800 mt-1">
                        <div className="text-[10px] text-zinc-400 flex items-center gap-1 pt-2">
                          <span>📝 Debtor:</span> 
                          <span className="font-bold text-red-400">{sale.debtor}</span>
                        </div>
                      </div>
                    )}

                    {/* SETTLED CREDIT INFO SECTION */}
                    {sale.payment === 'credit-settled' && sale.debtor && (
                      <div className="px-3 pb-2 pt-0 border-t border-zinc-800 mt-1">
                        <div className="flex flex-col gap-1 pt-2">
                          <div className="text-[10px] text-zinc-400 flex items-center gap-1">
                            <span>👤 Paid by:</span> 
                            <span className="font-bold text-purple-400">{sale.debtor}</span>
                          </div>
                          {sale.originalTime && (
                            <div className="text-[10px] text-zinc-500 flex items-center gap-1">
                              <span>📅 Credit taken on:</span> 
                              <span className="text-zinc-400">{formatShortDate(sale.originalTime)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Delete Button */}
                    <button 
                      onClick={() => handleDelete(sale.time)}
                      className="absolute top-2 right-2 text-zinc-700 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity text-xs bg-zinc-900 px-2 py-1 rounded border border-zinc-700"
                    >
                      Delete
                    </button>
                  </div>
                ))
              )}
            </div>

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
