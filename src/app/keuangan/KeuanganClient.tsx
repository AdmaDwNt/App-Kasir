// src/app/keuangan/KeuanganClient.tsx
"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Transaksi } from "@/types";
import { toast } from "react-hot-toast";

export default function KeuanganClient() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"Piutang" | "Kas">("Piutang");

  // Tarik data transaksi dari cache
  const { data: transactions, isLoading } = useQuery({
    queryKey: ["transaksi"],
    queryFn: () => api.get<Transaksi>("transaksi"),
  });

  // Simulasi data Hutang (Karena API GAS saat ini hanya merekam barang,
  // kita mock logika hutangnya untuk UI Dashboard Piutang)
  const piutangList = [
    {
      id: "TRX-260501-A1",
      nama: "Bu Tejo",
      tanggal: "01/05/2026",
      total: 45000,
      status: "Belum Lunas",
    },
    {
      id: "TRX-260502-B2",
      nama: "Pak RT",
      tanggal: "02/05/2026",
      total: 120000,
      status: "Belum Lunas",
    },
    {
      id: "TRX-260428-C3",
      nama: "Mas Tiyo",
      tanggal: "28/04/2026",
      total: 15000,
      status: "Belum Lunas",
    },
  ];

  const handlePelunasan = (nama: string) => {
    // Di backend nyata, ini akan memanggil api.post({ action: 'lunasi_hutang', ... })
    const toastId = toast.loading(`Memproses pelunasan ${nama}...`);
    setTimeout(() => {
      toast.success(`Hutang ${nama} berhasil dilunasi!`, { id: toastId });
    }, 1500);
  };

  if (isLoading) {
    return (
      <div className="h-[calc(100vh-2rem)] flex justify-center items-center bg-slate-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 h-[calc(100vh-2rem)] flex flex-col bg-slate-50">
      {/* HEADER */}
      <div className="mb-6">
        <h1 className="text-2xl font-black text-slate-800">
          Keuangan & Piutang
        </h1>
        <p className="text-sm text-slate-500 font-medium">
          Pantau arus kas dan tagihan pelanggan (Kasbon)
        </p>
      </div>

      {/* TAB NAVIGATION */}
      <div className="flex gap-2 mb-6 bg-white p-1 rounded-xl w-fit shadow-sm border border-slate-100">
        <button
          onClick={() => setActiveTab("Piutang")}
          className={`px-6 py-2 rounded-lg font-bold text-sm transition-all ${activeTab === "Piutang" ? "bg-blue-600 text-white shadow-md" : "text-slate-500 hover:bg-slate-50"}`}
        >
          Buku Piutang (Kasbon)
        </button>
        <button
          onClick={() => setActiveTab("Kas")}
          className={`px-6 py-2 rounded-lg font-bold text-sm transition-all ${activeTab === "Kas" ? "bg-blue-600 text-white shadow-md" : "text-slate-500 hover:bg-slate-50"}`}
        >
          Arus Kas Masuk
        </button>
      </div>

      {/* KONTEN: BUKU PIUTANG */}
      {activeTab === "Piutang" && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col flex-1">
          <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-red-50/30">
            <div>
              <h3 className="font-bold text-slate-800">
                Daftar Tagihan Pelanggan
              </h3>
              <p className="text-xs text-slate-500">
                Catatan pelanggan yang membayar dengan metode Hutang
              </p>
            </div>
            <div className="bg-red-100 text-red-600 px-4 py-2 rounded-xl font-black shadow-sm">
              Total Piutang: Rp 180.000
            </div>
          </div>

          <div className="overflow-y-auto custom-scrollbar flex-1 p-0">
            <table className="w-full text-left">
              <thead className="bg-slate-50 sticky top-0 border-b border-slate-100">
                <tr>
                  <th className="p-4 font-bold text-slate-600 text-sm">
                    Pelanggan
                  </th>
                  <th className="p-4 font-bold text-slate-600 text-sm">
                    No. Transaksi
                  </th>
                  <th className="p-4 font-bold text-slate-600 text-sm text-right">
                    Total Hutang
                  </th>
                  <th className="p-4 font-bold text-slate-600 text-sm text-center">
                    Status
                  </th>
                  <th className="p-4 font-bold text-slate-600 text-sm text-center">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody>
                {piutangList.map((item, idx) => (
                  <tr
                    key={idx}
                    className="border-b border-slate-50 hover:bg-slate-50 transition-colors"
                  >
                    <td className="p-4">
                      <p className="font-bold text-slate-800">{item.nama}</p>
                      <p className="text-xs text-slate-500">{item.tanggal}</p>
                    </td>
                    <td className="p-4 text-sm font-mono text-slate-500">
                      {item.id}
                    </td>
                    <td className="p-4 text-right font-bold text-red-500">
                      Rp {item.total.toLocaleString("id-ID")}
                    </td>
                    <td className="p-4 text-center">
                      <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-bold">
                        {item.status}
                      </span>
                    </td>
                    <td className="p-4 flex justify-center">
                      <button
                        onClick={() => handlePelunasan(item.nama)}
                        className="px-4 py-1.5 bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100 rounded-lg text-xs font-bold transition-colors"
                      >
                        Lunasi
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* KONTEN: ARUS KAS */}
      {activeTab === "Kas" && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col flex-1">
          <div className="flex flex-col items-center justify-center h-full text-slate-400">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-16 w-16 mb-4 text-slate-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="font-bold text-lg text-slate-600">
              Buku Kas Sedang Disinkronisasi
            </p>
            <p className="text-sm">
              Data riwayat kas masuk sedang ditarik dari Google Sheets.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
