"use client";

import { useState } from "react";
import { Product, Kas } from "@/types";
import {
  Wallet,
  PackagePlus,
  ArrowDownRight,
  ArrowUpRight,
  X,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { refreshAllData } from "@/app/actions";

export default function BackofficeClient({
  initialProducts,
  initialKas,
}: {
  initialProducts: Product[];
  initialKas: Kas[];
}) {
  const [activeModal, setActiveModal] = useState<
    "shift" | "kulakan" | "pengeluaran" | "pemasukan" | null
  >(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  // State Form
  const [nominal, setNominal] = useState("");
  const [keterangan, setKeterangan] = useState("");
  const [idProduk, setIdProduk] = useState("");
  const [jumlahStok, setJumlahStok] = useState("");

  const router = useRouter();
  const reversedKas = [...initialKas].reverse();

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    let jenis = "";
    if (activeModal === "shift")
      jenis = keterangan.includes("Tutup") ? "Tutup Shift" : "Buka Shift";
    if (activeModal === "kulakan") jenis = "Kulakan";
    if (activeModal === "pengeluaran") jenis = "Pengeluaran";
    if (activeModal === "pemasukan") jenis = "Pemasukan Lain";

    try {
      await fetch(process.env.NEXT_PUBLIC_API_URL as string, {
        method: "POST",
        mode: "no-cors",
        body: JSON.stringify({
          action: "catat_kas",
          Jenis: jenis,
          Nominal: Number(nominal),
          Keterangan:
            activeModal === "kulakan"
              ? `Kulakan Produk: ${idProduk} (${jumlahStok} qty)`
              : keterangan,
          ID_Produk: idProduk,
          Jumlah_Stok: Number(jumlahStok),
        }),
      });
      await refreshAllData();
      setActiveModal(null);
      setNominal("");
      setKeterangan("");
      setIdProduk("");
      setJumlahStok("");
      router.refresh();
      showToast("Data berhasil dicatat!", "success");
    } catch (err) {
      showToast("Gagal menyimpan data.", "error");
    }
    setIsSubmitting(false);
  };

  return (
    <div className="p-4 lg:p-8 max-w-6xl mx-auto h-full overflow-y-auto scrollbar-hide">
      {/* TOAST CUSTOM */}
      <div
        className={`fixed top-8 left-1/2 -translate-x-1/2 z-[100] transition-all duration-500 ease-out flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl border bg-white dark:bg-gray-800 ${toast ? "translate-y-0 opacity-100" : "-translate-y-10 opacity-0 pointer-events-none"} ${toast?.type === "success" ? "border-green-100 dark:border-green-900" : "border-red-100 dark:border-red-900"}`}
      >
        {toast?.type === "success" ? (
          <CheckCircle2 className="text-green-500" size={20} />
        ) : (
          <XCircle className="text-red-500" size={20} />
        )}
        <p className="font-semibold text-sm text-gray-800 dark:text-gray-100">
          {toast?.message}
        </p>
      </div>

      {/* MODAL GLOBAL UNTUK SEMUA AKSI */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <form
            onSubmit={handleSave}
            className="bg-white dark:bg-gray-900 rounded-3xl w-full max-w-md p-6 shadow-2xl animate-in zoom-in-95"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold capitalize">
                Catat {activeModal}
              </h2>
              <button type="button" onClick={() => setActiveModal(null)}>
                <X className="text-gray-400 hover:text-gray-900 dark:hover:text-white" />
              </button>
            </div>

            <div className="space-y-4">
              {activeModal === "shift" && (
                <select
                  required
                  className="w-full p-3 border border-gray-200 dark:border-gray-800 rounded-xl bg-gray-50 dark:bg-gray-950 focus:ring-2 outline-none"
                  onChange={(e) => setKeterangan(e.target.value)}
                >
                  <option value="">Pilih Jenis Shift...</option>
                  <option value="Buka Shift (Modal Awal)">
                    Buka Shift (Modal Awal Laci)
                  </option>
                  <option value="Tutup Shift (Setoran)">
                    Tutup Shift (Total Uang Laci Aktual)
                  </option>
                </select>
              )}

              {activeModal === "kulakan" && (
                <>
                  <select
                    required
                    className="w-full p-3 border border-gray-200 dark:border-gray-800 rounded-xl bg-gray-50 dark:bg-gray-950 focus:ring-2 outline-none"
                    onChange={(e) => setIdProduk(e.target.value)}
                  >
                    <option value="">Pilih Produk yang Dibeli...</option>
                    {initialProducts.map((p) => (
                      <option key={p.ID_Produk} value={p.ID_Produk}>
                        {p.Nama_Produk} (Sisa: {p.Stok_Awal})
                      </option>
                    ))}
                  </select>
                  <input
                    required
                    type="number"
                    placeholder="Jumlah Barang Masuk (Qty)"
                    className="w-full p-3 border border-gray-200 dark:border-gray-800 rounded-xl bg-gray-50 dark:bg-gray-950 focus:ring-2 outline-none"
                    onChange={(e) => setJumlahStok(e.target.value)}
                  />
                </>
              )}

              {activeModal !== "shift" && activeModal !== "kulakan" && (
                <input
                  required
                  type="text"
                  placeholder="Keterangan (Cth: Beli Gas, Bayar Sampah)"
                  className="w-full p-3 border border-gray-200 dark:border-gray-800 rounded-xl bg-gray-50 dark:bg-gray-950 focus:ring-2 outline-none"
                  onChange={(e) => setKeterangan(e.target.value)}
                />
              )}

              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">
                  Rp
                </span>
                <input
                  required
                  type="number"
                  placeholder={
                    activeModal === "shift"
                      ? "Total Uang"
                      : "Total Biaya/Nominal"
                  }
                  className="w-full pl-12 pr-4 p-3 border border-gray-200 dark:border-gray-800 rounded-xl bg-gray-50 dark:bg-gray-950 focus:ring-2 focus:ring-gray-900 outline-none font-bold"
                  onChange={(e) => setNominal(e.target.value)}
                />
              </div>
            </div>

            <button
              disabled={isSubmitting}
              className="w-full mt-8 bg-gray-900 dark:bg-white dark:text-black text-white p-4 rounded-xl font-bold active:scale-95 transition-all"
            >
              {isSubmitting ? "Memproses..." : "Simpan Pencatatan"}
            </button>
          </form>
        </div>
      )}

      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Modul Backoffice</h1>
        <p className="text-gray-500">
          Kelola arus kas, shift kasir, dan restock barang warung.
        </p>
      </div>

      {/* QUICK ACTIONS CARD */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <button
          onClick={() => setActiveModal("shift")}
          className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 flex flex-col items-center justify-center gap-3 hover:shadow-lg transition-all group"
        >
          <div className="p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-xl group-hover:scale-110 transition-transform">
            <Wallet size={24} />
          </div>
          <span className="font-bold text-sm">Buka/Tutup Shift</span>
        </button>
        <button
          onClick={() => setActiveModal("kulakan")}
          className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 flex flex-col items-center justify-center gap-3 hover:shadow-lg transition-all group"
        >
          <div className="p-3 bg-orange-50 dark:bg-orange-900/30 text-orange-600 rounded-xl group-hover:scale-110 transition-transform">
            <PackagePlus size={24} />
          </div>
          <span className="font-bold text-sm">Kulakan (Restock)</span>
        </button>
        <button
          onClick={() => setActiveModal("pengeluaran")}
          className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 flex flex-col items-center justify-center gap-3 hover:shadow-lg transition-all group"
        >
          <div className="p-3 bg-red-50 dark:bg-red-900/30 text-red-600 rounded-xl group-hover:scale-110 transition-transform">
            <ArrowDownRight size={24} />
          </div>
          <span className="font-bold text-sm">Catat Pengeluaran</span>
        </button>
        <button
          onClick={() => setActiveModal("pemasukan")}
          className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 flex flex-col items-center justify-center gap-3 hover:shadow-lg transition-all group"
        >
          <div className="p-3 bg-green-50 dark:bg-green-900/30 text-green-600 rounded-xl group-hover:scale-110 transition-transform">
            <ArrowUpRight size={24} />
          </div>
          <span className="font-bold text-sm">Pemasukan Lain</span>
        </button>
      </div>

      {/* TABEL RIWAYAT KAS */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden mb-6">
        <div className="p-5 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/20">
          <h2 className="font-bold">Buku Riwayat Kas</h2>
        </div>
        <div className="overflow-x-auto scrollbar-hide">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 text-sm uppercase">
                <th className="p-5 font-semibold">Waktu</th>
                <th className="p-5 font-semibold">Jenis Transaksi</th>
                <th className="p-5 font-semibold">Keterangan</th>
                <th className="p-5 font-semibold text-right">Nominal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {reversedKas.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-10 text-center text-gray-500">
                    Belum ada catatan kas.
                  </td>
                </tr>
              ) : (
                reversedKas.map((k, i) => (
                  <tr
                    key={i}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/30"
                  >
                    <td className="p-5 text-sm text-gray-500">
                      {new Date(k.Waktu).toLocaleString("id-ID")}
                    </td>
                    <td className="p-5 font-bold">
                      <span
                        className={`px-3 py-1 rounded-lg text-xs ${
                          k.Jenis.includes("Pengeluaran") ||
                          k.Jenis.includes("Kulakan")
                            ? "bg-red-50 text-red-600 dark:bg-red-900/30"
                            : k.Jenis.includes("Shift")
                              ? "bg-blue-50 text-blue-600 dark:bg-blue-900/30"
                              : "bg-green-50 text-green-600 dark:bg-green-900/30"
                        }`}
                      >
                        {k.Jenis}
                      </span>
                    </td>
                    <td className="p-5 text-sm">{k.Keterangan}</td>
                    <td
                      className={`p-5 font-bold text-right ${k.Jenis.includes("Pengeluaran") || k.Jenis.includes("Kulakan") ? "text-red-500" : "text-green-500"}`}
                    >
                      {k.Jenis.includes("Pengeluaran") ||
                      k.Jenis.includes("Kulakan")
                        ? "-"
                        : "+"}{" "}
                      Rp {(k.Nominal || 0).toLocaleString("id-ID")}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
