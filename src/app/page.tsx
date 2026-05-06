"use client";

import { useQuery } from "@tanstack/react-query";
import { gasFetch } from "@/lib/api";
import { Produk, Transaksi } from "@/types";

export default function DashboardPage() {
  const { data: products, isLoading: loadingProd } = useQuery({
    queryKey: ["produk"],
    queryFn: async () => {
      try {
        const res = await gasFetch<any>("?data=produk");
        return Array.isArray(res) ? res : (res?.data || []);
      } catch (error) {
        console.error("Fetch error:", error);
        return [];
      }
    },
  });

  const { data: transactions, isLoading: loadingTrx } = useQuery({
    queryKey: ["transaksi"],
    queryFn: async () => {
      try {
        const res = await gasFetch<any>("?data=transaksi");
        return Array.isArray(res) ? res : (res?.data || []);
      } catch (error) {
        console.error("Fetch error:", error);
        return [];
      }
    },
  });

  const isLoading = loadingProd || loadingTrx;

  const totalProducts = Array.isArray(products) ? products.length : 0;
  const lowStockProducts = (Array.isArray(products) ? products : []).filter((p) => p.Stok_Awal <= p.Stok_Minimal);
  const totalLowStock = lowStockProducts.length;

  const totalTransactions = Array.isArray(transactions) ? transactions.length : 0;
  const totalRevenue = (Array.isArray(transactions) ? transactions : []).reduce((sum, trx) => sum + Number(trx.Total_Harga), 0);

  if (isLoading) {
    return (
      <div className="h-[calc(100vh-2rem)] flex flex-col justify-center items-center text-slate-400 bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <p className="font-bold">Menganalisis data dari server...</p>
      </div>
    );
  }

  return (
    <div className="p-8 w-full max-w-7xl mx-auto space-y-8 bg-slate-50 min-h-screen">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Dashboard</h1>
        <p className="text-slate-500 mt-1">Ringkasan aktivitas dan performa bisnis hari ini.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Produk" value={totalProducts.toString()} subtitle="Produk aktif" />
        <StatCard title="Stock Rendah" value={totalLowStock.toString()} subtitle="Butuh restock segera" alert={totalLowStock > 0} />
        <StatCard title="Transaksi Harian" value={totalTransactions.toString()} subtitle="Total transaksi" />
        <StatCard title="Total Pendapatan" value={`Rp ${totalRevenue.toLocaleString("id-ID")}`} subtitle="Nilai penjualan" />
      </div>

      {/* Charts Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-800 mb-4">Grafik Penjualan 7 Hari Terakhir</h2>
          <div className="w-full h-64 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-center">
            <span className="text-slate-400 font-medium">Fitur Grafik Segera Hadir</span>
          </div>
        </div>
        
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-800 mb-4">Distribusi Kategori</h2>
          <div className="w-full h-64 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-center">
            <span className="text-slate-400 font-medium">Fitur Pie Chart Segera Hadir</span>
          </div>
        </div>
      </div>

      {/* Tables Area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-800 mb-4">Transaksi Terbaru</h2>
          <div className="w-full h-72 bg-slate-50 rounded-xl border border-slate-100 overflow-hidden flex flex-col">
            <div className="overflow-y-auto flex-1">
              {Array.isArray(transactions) && transactions.length > 0 ? (
                <table className="w-full text-left">
                  <tbody>
                    {(Array.isArray(transactions) ? transactions : []).slice(0).reverse().slice(0, 5).map((trx, idx) => {
                      const product = (Array.isArray(products) ? products : []).find((p) => p.ID_Produk === trx.ID_Produk);
                      return (
                        <tr key={idx} className="border-b border-slate-200 last:border-0 hover:bg-white">
                          <td className="p-4 py-3">
                            <p className="font-bold text-sm text-slate-800">{trx.ID_Transaksi}</p>
                            <p className="text-xs text-slate-500">{new Date(trx.Waktu).toLocaleDateString("id-ID")}</p>
                          </td>
                          <td className="p-4 py-3">
                            <p className="font-medium text-sm text-slate-700">{product ? product.Nama_Produk : trx.ID_Produk}</p>
                            <p className="text-xs font-bold text-slate-400">{trx.Jumlah_Beli} Item</p>
                          </td>
                          <td className="p-4 py-3 text-right">
                            <p className="font-bold text-sm text-emerald-600">Rp {Number(trx.Total_Harga).toLocaleString("id-ID")}</p>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <div className="flex h-full items-center justify-center">
                  <span className="text-slate-400 font-medium">Belum ada data</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-800 mb-4">Low Stock Alert</h2>
          <div className="w-full h-72 bg-slate-50 rounded-xl border border-slate-100 overflow-hidden flex flex-col">
            <div className="overflow-y-auto flex-1">
              {Array.isArray(lowStockProducts) && lowStockProducts.length > 0 ? (
                <table className="w-full text-left">
                  <tbody>
                    {(Array.isArray(lowStockProducts) ? lowStockProducts : []).slice(0, 5).map((p) => (
                      <tr key={p.ID_Produk} className="border-b border-slate-200 last:border-0 hover:bg-white">
                        <td className="p-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                              {p.Foto ? (
                                <img src={p.Foto} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-[10px] text-slate-400 font-bold">IMG</span>
                              )}
                            </div>
                            <div>
                              <p className="font-bold text-sm text-slate-800">{p.Nama_Produk}</p>
                              <p className="text-xs text-slate-500">{p.Kategori}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 py-3 text-right">
                          <p className="font-black text-sm text-red-600">Sisa {p.Stok_Awal}</p>
                          <p className="text-xs text-slate-400 font-medium">Min: {p.Stok_Minimal}</p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="flex h-full items-center justify-center">
                  <span className="text-slate-400 font-medium">Stok dalam kondisi aman! 🎉</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, subtitle, trend, alert }: { title: string, value: string, subtitle: string, trend?: string, alert?: boolean }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
      <div className="mb-4">
        <h3 className="text-slate-500 font-medium text-sm mb-1">{title}</h3>
        <p className={`text-3xl font-black ${alert ? 'text-red-500' : 'text-slate-800'}`}>{value}</p>
      </div>
      <div>
        <p className="text-sm font-medium text-slate-500">{subtitle}</p>
        {trend && (
          <p className="text-xs font-semibold text-emerald-600 mt-2 bg-emerald-50 inline-block px-2 py-1 rounded-md">
            {trend}
          </p>
        )}
      </div>
    </div>
  );
}
