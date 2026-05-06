// src/app/riwayat/RiwayatClient.tsx
"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { gasFetch } from "@/lib/api";
import { Transaksi, Produk } from "@/types";

export default function RiwayatClient() {
  const [searchQuery, setSearchQuery] = useState("");

  // Tarik data transaksi & produk
  const {
    data: transactions,
    isLoading: loadingTrx,
    isError: errorTrx,
  } = useQuery({
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

  const isLoading = loadingTrx || loadingProd;

  // Logika Pencarian & Pengurutan (Terbaru di atas)
  const filteredTransactions =
    (Array.isArray(transactions) ? transactions : [])
      .filter((trx) => {
        const product = (Array.isArray(products) ? products : []).find((p) => p.ID_Produk === trx.ID_Produk);
        const productName = product ? product.Nama_Produk.toLowerCase() : "";
        const search = searchQuery.toLowerCase();

        return (
          trx.ID_Transaksi.toLowerCase().includes(search) ||
          productName.includes(search)
        );
      })
      .reverse();

  if (isLoading) {
    return (
      <div className="h-[calc(100vh-2rem)] flex justify-center items-center bg-slate-50">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
          <p className="font-bold">Menarik riwayat dari server...</p>
        </div>
      </div>
    );
  }

  if (errorTrx) {
    return (
      <div className="h-[calc(100vh-2rem)] flex justify-center items-center bg-slate-50 text-red-500 font-bold">
        Gagal memuat data transaksi.
      </div>
    );
  }

  return (
    <div className="p-6 h-[calc(100vh-2rem)] flex flex-col bg-slate-50">
      {/* HEADER */}
      <div className="mb-6 bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800">
            Riwayat Transaksi
          </h1>
          <p className="text-sm text-slate-500 font-medium">
            Laporan detail semua penjualan di toko Anda
          </p>
        </div>

        {/* PENCARIAN */}
        <div className="relative w-full md:w-80">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 absolute left-3 top-2.5 text-slate-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            placeholder="Cari No. Nota atau Nama Produk..."
            className="w-full border-2 border-slate-200 bg-slate-50 rounded-xl pl-10 pr-4 py-2 focus:border-blue-500 focus:bg-white outline-none font-medium text-slate-700 transition-colors"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* TABEL DATA */}
      <div className="flex-1 overflow-hidden bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col">
        <div className="overflow-y-auto custom-scrollbar flex-1 p-0">
          <table className="w-full text-left">
            <thead className="bg-slate-50 sticky top-0 border-b border-slate-200 z-10">
              <tr>
                <th className="p-4 font-bold text-slate-600 text-sm">
                  Waktu & No. Nota
                </th>
                <th className="p-4 font-bold text-slate-600 text-sm">
                  Detail Item
                </th>
                <th className="p-4 font-bold text-slate-600 text-sm text-center">
                  Jumlah
                </th>
                <th className="p-4 font-bold text-slate-600 text-sm text-right">
                  Total Transaksi
                </th>
              </tr>
            </thead>
            <tbody>
              {(Array.isArray(filteredTransactions) ? filteredTransactions : []).map((trx, idx) => {
                const product = (Array.isArray(products) ? products : []).find(
                  (p) => p.ID_Produk === trx.ID_Produk,
                );
                // Format tanggal dari string ISO
                const dateObj = new Date(trx.Waktu);
                const timeString = dateObj.toLocaleTimeString("id-ID", {
                  hour: "2-digit",
                  minute: "2-digit",
                });
                const dateString = dateObj.toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                });

                return (
                  <tr
                    key={idx}
                    className="border-b border-slate-50 hover:bg-slate-50 transition-colors"
                  >
                    <td className="p-4">
                      <p className="font-bold text-slate-800">
                        {timeString}{" "}
                        <span className="text-slate-400 font-normal text-xs ml-1">
                          {dateString}
                        </span>
                      </p>
                      <p className="text-xs font-mono text-blue-600 mt-1">
                        {trx.ID_Transaksi}
                      </p>
                    </td>
                    <td className="p-4">
                      <p className="font-bold text-sm text-slate-800">
                        {product ? product.Nama_Produk : "Produk Dihapus"}
                      </p>
                      <p className="text-xs text-slate-500">
                        Kategori: {product ? product.Kategori : "-"}
                      </p>
                    </td>
                    <td className="p-4 text-center">
                      <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-xs font-bold">
                        {trx.Jumlah_Beli} {product?.Satuan || "Item"}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <p className="font-black text-emerald-600">
                        Rp {Number(trx.Total_Harga).toLocaleString("id-ID")}
                      </p>
                    </td>
                  </tr>
                );
              })}

              {filteredTransactions.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-12 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-400">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-12 w-12 mb-3 text-slate-300"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1}
                          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                        />
                      </svg>
                      <p className="font-medium">
                        Tidak ada data transaksi yang ditemukan.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
