// src/app/backoffice/BackofficeClient.tsx
"use client";

import { useQuery } from "@tanstack/react-query";
import { gasFetch } from "@/lib/api";
import { Produk, Transaksi } from "@/types";
import Link from "next/link";

export default function BackofficeClient() {
  // Menarik 2 data sekaligus secara paralel dengan Caching React Query
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

  // --- KALKULASI STATISTIK ---
  const totalProducts = Array.isArray(products) ? products.length : 0;
  const totalTransactions = Array.isArray(transactions) ? transactions.length : 0;

  const totalRevenue = (Array.isArray(transactions) ? transactions : []).reduce(
    (sum, trx) => sum + Number(trx.Total_Harga),
    0,
  );

  const lowStockProducts = (Array.isArray(products) ? products : []).filter(
    (p) => p.Stok_Awal <= p.Stok_Minimal,
  );

  const recentTransactions = [...(Array.isArray(transactions) ? transactions : [])].reverse().slice(0, 5);

  if (isLoading) {
    return (
      <div className="h-[calc(100vh-2rem)] flex flex-col justify-center items-center text-slate-400 bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <p className="font-bold">Menganalisis data dari server...</p>
      </div>
    );
  }

  return (
    <div className="p-6 min-h-screen bg-slate-50">
      {/* HEADER */}
      <div className="mb-8">
        <h1 className="text-2xl font-black text-slate-800">Dashboard</h1>
        <p className="text-sm text-slate-500 font-medium">
          Ringkasan performa dan notifikasi toko Anda
        </p>
      </div>

      {/* 4 KARTU STATISTIK UTAMA */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Kartu Pendapatan */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase">
              Total Pendapatan
            </p>
            <p className="text-xl font-black text-slate-800">
              Rp {totalRevenue.toLocaleString("id-ID")}
            </p>
          </div>
        </div>

        {/* Kartu Transaksi */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
              />
            </svg>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase">
              Item Terjual
            </p>
            <p className="text-xl font-black text-slate-800">
              {totalTransactions} Transaksi
            </p>
          </div>
        </div>

        {/* Kartu Total Produk */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
              />
            </svg>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase">
              Jenis Produk
            </p>
            <p className="text-xl font-black text-slate-800">
              {totalProducts} Item
            </p>
          </div>
        </div>

        {/* Kartu Alert Stok */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${lowStockProducts.length > 0 ? "bg-red-50 text-red-600" : "bg-slate-50 text-slate-400"}`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase">
              Peringatan Stok
            </p>
            <p
              className={`text-xl font-black ${lowStockProducts.length > 0 ? "text-red-600" : "text-slate-800"}`}
            >
              {lowStockProducts.length} Menipis
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* TABEL TRANSAKSI TERBARU */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
            <h3 className="font-bold text-slate-800">5 Transaksi Terakhir</h3>
            <Link
              href="/riwayat"
              className="text-xs font-bold text-blue-600 hover:text-blue-800"
            >
              Lihat Semua
            </Link>
          </div>
          <div className="p-0">
            {Array.isArray(recentTransactions) && recentTransactions.length > 0 ? (
              <table className="w-full text-left">
                <tbody>
                  {recentTransactions.map((trx, idx) => {
                    const product = (Array.isArray(products) ? products : []).find(
                      (p) => p.ID_Produk === trx.ID_Produk,
                    );
                    return (
                      <tr
                        key={idx}
                        className="border-b border-slate-50 last:border-0 hover:bg-slate-50"
                      >
                        <td className="p-4 py-3">
                          <p className="font-bold text-sm text-slate-800">
                            {trx.ID_Transaksi}
                          </p>
                          <p className="text-xs text-slate-500">
                            {new Date(trx.Waktu).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </td>
                        <td className="p-4 py-3">
                          <p className="font-medium text-sm text-slate-700">
                            {product ? product.Nama_Produk : trx.ID_Produk}
                          </p>
                          <p className="text-xs font-bold text-slate-400">
                            {trx.Jumlah_Beli} Item
                          </p>
                        </td>
                        <td className="p-4 py-3 text-right">
                          <p className="font-bold text-sm text-emerald-600">
                            Rp {Number(trx.Total_Harga).toLocaleString("id-ID")}
                          </p>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <p className="p-6 text-center text-sm text-slate-400 font-medium">Belum ada transaksi.</p>
            )}
          </div>
        </div>

        {/* TABEL ALERT STOK MENIPIS */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
            <h3 className="font-bold text-slate-800">
              Peringatan Stok Menipis
            </h3>
            <Link
              href="/produk"
              className="text-xs font-bold text-blue-600 hover:text-blue-800"
            >
              Kelola Produk
            </Link>
          </div>
          <div className="p-0">
            {Array.isArray(lowStockProducts) && lowStockProducts.length > 0 ? (
              <table className="w-full text-left">
                <tbody>
                  {lowStockProducts.slice(0, 5).map((p) => (
                    <tr
                      key={p.ID_Produk}
                      className="border-b border-slate-50 last:border-0 hover:bg-slate-50"
                    >
                      <td className="p-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                            {p.Foto ? (
                              <img
                                src={p.Foto}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-[10px] text-slate-400 font-bold">
                                IMG
                              </span>
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-sm text-slate-800">
                              {p.Nama_Produk}
                            </p>
                            <p className="text-xs text-slate-500">{p.Kategori}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 py-3 text-right">
                        <p
                          className={`font-black text-sm ${p.Stok_Awal <= 0 ? "text-red-600" : "text-amber-600"}`}
                        >
                          Sisa {p.Stok_Awal} {p.Satuan}
                        </p>
                        <p className="text-xs text-slate-400 font-medium">
                          Min: {p.Stok_Minimal}
                        </p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="p-6 text-center text-sm text-slate-400 font-medium">Stok dalam kondisi aman! 🎉</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
