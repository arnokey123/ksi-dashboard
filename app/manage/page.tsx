"use client";

import { useState } from 'react';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function ManagePage() {
  const { data: sales, mutate, isLoading } = useSWR('/api/sales', fetcher);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editData, setEditData] = useState<any>(null);

  const handleDelete = async (id: number) => {
    if(!confirm("Delete this sale?")) return;
    try {
      await fetch(`/api/sales?id=${id}`, { method: 'DELETE' });
      mutate(); // Refresh list
    } catch (e) { alert("Error deleting"); }
  };

  const handleClearAll = async () => {
    if(!confirm("DELETE ALL SALES? This cannot be undone.")) return;
    try {
      await fetch('/api/sales/clear', { method: 'DELETE' });
      mutate();
    } catch (e) { alert("Error clearing"); }
  };

  const startEdit = (sale: any) => {
    setEditingId(sale.id);
    // Prepare data for editing (stringify for the text area)
    setEditData(JSON.stringify(sale, null, 2));
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditData(null);
  };

  const saveEdit = async (id: number) => {
    try {
      const parsed = JSON.parse(editData);
      // Remove ID from the data object before sending
      const { id: _, ...newData } = parsed;
      
      await fetch(`/api/sales?id=${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newData })
      });
      mutate();
      cancelEdit();
    } catch (e) { alert("Invalid JSON format"); }
  };

  if (isLoading) return <div className="p-10 text-white">Loading...</div>;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold">Admin Panel</h1>
            <p className="text-zinc-500 text-sm">Manage synced records</p>
          </div>
          <button 
            onClick={handleClearAll}
            className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded text-sm font-bold"
          >
            Delete All Records
          </button>
        </div>

        <div className="space-y-4">
          {sales && sales.map((sale: any) => (
            <div key={sale.id} className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 relative group">
              {editingId === sale.id ? (
                // EDIT MODE
                <div className="space-y-3">
                  <textarea 
                    value={editData}
                    onChange={(e) => setEditData(e.target.value)}
                    className="w-full h-48 bg-zinc-800 p-2 rounded text-xs font-mono text-zinc-200 border border-zinc-700 focus:outline-none focus:border-blue-500"
                  />
                  <div className="flex gap-2">
                    <button onClick={() => saveEdit(sale.id)} className="px-3 py-1 bg-blue-600 rounded text-xs font-bold">Save</button>
                    <button onClick={cancelEdit} className="px-3 py-1 bg-zinc-700 rounded text-xs font-bold">Cancel</button>
                  </div>
                </div>
              ) : (
                // VIEW MODE
                <>
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-xs text-zinc-500">ID: {sale.id}</div>
                      <h3 className="text-lg font-semibold mt-1">{sale.title || "Unknown Sale"}</h3>
                      <div className="text-green-400 font-bold">KSh {sale.total || 0}</div>
                      <div className="text-xs text-blue-400 uppercase">{sale.payment}</div>
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => startEdit(sale)}
                        className="px-3 py-1 bg-zinc-800 rounded text-xs font-bold hover:bg-zinc-700"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDelete(sale.id)}
                        className="px-3 py-1 bg-red-900/50 text-red-400 rounded text-xs font-bold hover:bg-red-800"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}
          
          {!sales?.length && (
            <div className="text-center text-zinc-500 py-20">No records found.</div>
          )}
        </div>
      </div>
    </div>
  );
}
