"use client";

import { useState, useMemo } from "react";
import { Transaction, Product } from "@/types";
import {
  Wallet,
  TrendingDown,
  ArrowDownCircle,
  PackagePlus,
  Lock,
  XCircle,
  ArrowUpCircle,
  CheckCircle2,
  RefreshCw,
  Filter,
  Search,
  Calendar,
} from "lucide-react";
import { refreshAllData } from "@/app/actions";
import { useRouter } from "next/navigation";

interface Kas {
  ID_Kas: string;
  Waktu: string;
  Jenis: string;
  Nominal: number;
  Keterangan: string;
}

interface KeuanganClientProps {
  initialTransactions: Transaction[];
  initialProducts: Product[];
  initialKas: Kas[];
}

export default function KeuanganClient({
  initialTransactions,
  initialProducts,
  initialKas,
}: KeuanganClientProps) {
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toast, setToast] = useState<{
    msg: string;
    type: "success" | "error";
  } | null>(null);

  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("Semua"); // Semua, Pemasukan, Pengeluaran, Kulakan, Setoran
  const [filterDate, setFilterDate] = useState("Semua"); // Semua, Hari Ini, Minggu Ini, Bulan Ini

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<
    "Pengeluaran" | "Kulakan" | "Setoran"
  >("Pengeluaran");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [nominal, setNominal] = useState("");
  const [keterangan, setKeterangan] = useState("");
  const [idProduk, setIdProduk] = useState("");
  const [jumlahStok, setJumlahStok] = useState("");

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSync = async () => {
    setIsRefreshing(true);
    await refreshAllData();
    router.refresh();
    setIsRefreshing(false);
  };

  // 1. HITUNG METRIK DASHBOARD (Tetap Berdasarkan Seluruh Data)
  const { totalOmzet, totalPengeluaran, totalSetoran, saldoLaci } =
    useMemo(() => {
      const omzet = initialTransactions.reduce(
        (sum, t) => sum + Number(t.Total_Harga || 0),
        0,
      );
      let pengeluaran = 0;
      let setoran = 0;
      initialKas.forEach((k) => {
        if (k.Jenis === "Pengeluaran" || k.Jenis === "Kulakan")
          pengeluaran += Number(k.Nominal);
        if (k.Jenis === "Setoran") setoran += Number(k.Nominal);
      });
      return {
        totalOmzet: omzet,
        totalPengeluaran: pengeluaran,
        totalSetoran: setoran,
        saldoLaci: omzet - pengeluaran - setoran,
      };
    }, [initialTransactions, initialKas]);

  // 2. BUKU BESAR DENGAN FILTERING ENTERPRISE
  const filteredLedger = useMemo(() => {
    let combined: any[] = [];

    // Group Penjualan
    const trxMap = new Map();
    initialTransactions.forEach((t) => {
      const id = String(t.ID_Transaksi).trim();
      if (!trxMap.has(id)) {
        trxMap.set(id, {
          id,
          waktu: t.Waktu,
          jenis: "Pemasukan",
          nominal: 0,
          keterangan: `Penjualan Kasir (${id})`,
        });
      }
      trxMap.get(id).nominal += Number(t.Total_Harga || 0);
    });
    trxMap.forEach((val) => combined.push(val));

    // Masukkan data Kas
    initialKas.forEach((k) => {
      combined.push({
        id: k.ID_Kas,
        waktu: k.Waktu,
        jenis: k.Jenis,
        nominal: Number(k.Nominal),
        keterangan: k.Keterangan,
      });
    });

    // URUTKAN & FILTER
    return combined
      .filter((item) => {
        // Filter Jenis
        if (filterType !== "Semua" && item.jenis !== filterType) return false;

        // Filter Pencarian
        if (
          searchQuery &&
          !item.keterangan.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !item.id.toLowerCase().includes(searchQuery.toLowerCase())
        )
          return false;

        // Filter Waktu
        const d = new Date(item.waktu);
        const now = new Date();
        if (filterDate === "Hari Ini")
          return d.toDateString() === now.toDateString();
        if (filterDate === "Minggu Ini") {
          const weekAgo = new Date();
          weekAgo.setDate(now.getDate() - 7);
          return d >= weekAgo;
        }
        if (filterDate === "Bulan Ini")
          return (
            d.getMonth() === now.getMonth() &&
            d.getFullYear() === now.getFullYear()
          );

        return true;
      })
      .sort(
        (a, b) => new Date(b.waktu).getTime() - new Date(a.waktu).getTime(),
      );
  }, [initialTransactions, initialKas, filterType, filterDate, searchQuery]);

  const handleSubmitKas = async (e: React.FormEvent) => {
    e.preventDefault();
    const numNominal = Number(nominal.replace(/\D/g, ""));
    setIsSubmitting(true);
    try {
      await fetch(process.env.NEXT_PUBLIC_API_URL as string, {
        method: "POST",
        mode: "no-cors",
        body: JSON.stringify({
          action: "catat_kas",
          Jenis: modalType,
          Nominal: numNominal,
          Keterangan: keterangan,
          ID_Produk: modalType === "Kulakan" ? idProduk : "",
          Jumlah_Stok: modalType === "Kulakan" ? Number(jumlahStok) : 0,
        }),
      });
      await handleSync();
      setIsModalOpen(false);
      showToast(`${modalType} berhasil dicatat!`);
    } catch (error) {
      showToast("Gagal menyimpan.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto h-full overflow-y-auto scrollbar-hide">
      {/* Toast & Header tetap sama ... */}
      <div
        className={`fixed top-8 left-1/2 -translate-x-1/2 z-[100] transition-all duration-500 ease-out flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl border ${toast?.type === "error" ? "bg-white border-red-100" : "bg-gray-900 border-gray-800"} ${toast ? "translate-y-0 opacity-100" : "-translate-y-10 opacity-0 pointer-events-none"}`}
      >
        {toast?.type === "error" ? (
          <XCircle className="text-red-500" size={20} />
        ) : (
          <CheckCircle2 className="text-green-400" size={20} />
        )}
        <p
          className={`font-semibold text-sm ${toast?.type === "error" ? "text-gray-800" : "text-white"}`}
        >
          {toast?.msg}
        </p>
      </div>

      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Dashboard Keuangan
          </h1>
          <p className="text-gray-500 mt-1">
            Pantau arus kas dan operasional warung
          </p>
        </div>
        <button
          onClick={handleSync}
          disabled={isRefreshing}
          className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-900 dark:text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-sm"
        >
          <RefreshCw size={18} className={isRefreshing ? "animate-spin" : ""} />{" "}
          {isRefreshing ? "Menyinkronkan..." : "Refresh Data"}
        </button>
      </div>

      {/* Grid Dashboard & Tombol Aksi tetap sama ... */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-gray-900 rounded-3xl p-6 shadow-xl border border-gray-800 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform">
            <Wallet size={80} />
          </div>
          <p className="text-gray-400 text-xs font-black uppercase tracking-widest mb-1 relative z-10">
            Saldo Fisik Laci
          </p>
          <h2 className="text-3xl font-black text-white relative z-10 mb-4">
            Rp {saldoLaci.toLocaleString("id-ID")}
          </h2>
          <div className="inline-flex items-center gap-1.5 bg-gray-800 text-gray-300 px-3 py-1 rounded-lg text-[10px] font-bold">
            Siap disetor / digunakan
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
          <div className="flex justify-between items-start mb-4">
            <p className="text-gray-400 text-xs font-black uppercase tracking-widest">
              Total Omzet
            </p>
            <div className="p-2 bg-green-50 dark:bg-green-900/20 text-green-600 rounded-xl">
              <ArrowUpCircle size={20} />
            </div>
          </div>
          <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-1">
            Rp {totalOmzet.toLocaleString("id-ID")}
          </h2>
          <p className="text-xs text-gray-500 font-medium">
            Dari penjualan kasir
          </p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
          <div className="flex justify-between items-start mb-4">
            <p className="text-gray-400 text-xs font-black uppercase tracking-widest">
              Pengeluaran
            </p>
            <div className="p-2 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-xl">
              <TrendingDown size={20} />
            </div>
          </div>
          <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-1">
            Rp {totalPengeluaran.toLocaleString("id-ID")}
          </h2>
          <p className="text-xs text-gray-500 font-medium">
            Operasional & Kulakan
          </p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
          <div className="flex justify-between items-start mb-4">
            <p className="text-gray-400 text-xs font-black uppercase tracking-widest">
              Tarik Setoran
            </p>
            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-xl">
              <Lock size={20} />
            </div>
          </div>
          <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-1">
            Rp {totalSetoran.toLocaleString("id-ID")}
          </h2>
          <p className="text-xs text-gray-500 font-medium">
            Uang disetor ke brankas
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-800 mb-8">
        <h3 className="font-bold text-gray-900 dark:text-white mb-4">
          Tindakan Kasir (Petty Cash)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <button
            onClick={() => openModal("Pengeluaran")}
            className="flex items-center justify-center gap-3 py-4 bg-red-50 hover:bg-red-100 dark:bg-red-900/10 dark:hover:bg-red-900/20 text-red-600 rounded-2xl font-bold transition-all border border-red-100 dark:border-red-900/30"
          >
            <TrendingDown size={20} /> Catat Pengeluaran
          </button>
          <button
            onClick={() => openModal("Kulakan")}
            className="flex items-center justify-center gap-3 py-4 bg-amber-50 hover:bg-amber-100 dark:bg-amber-900/10 dark:hover:bg-amber-900/20 text-amber-600 rounded-2xl font-bold transition-all border border-amber-100 dark:border-amber-900/30"
          >
            <PackagePlus size={20} /> Restock / Kulakan
          </button>
          <button
            onClick={() => openModal("Setoran")}
            className="flex items-center justify-center gap-3 py-4 bg-gray-900 hover:bg-black text-white rounded-2xl font-bold transition-all shadow-lg shadow-gray-900/20"
          >
            <Lock size={20} /> Tutup Shift (Setoran)
          </button>
        </div>
      </div>

      {/* --- BAGIAN FILTERING ENTERPRISE --- */}
      <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm">
        <div className="p-6 border-b border-gray-100 dark:border-gray-800">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <h3 className="font-bold text-gray-900 dark:text-white">
              Buku Arus Kas (Ledger)
            </h3>

            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
              {/* Search Bar */}
              <div className="relative flex-1 lg:w-64">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  size={16}
                />
                <input
                  type="text"
                  placeholder="Cari ID / Keterangan..."
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-800 rounded-xl outline-none text-sm font-medium"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Filter Jenis */}
              <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
                {["Semua", "Pemasukan", "Pengeluaran"].map((t) => (
                  <button
                    key={t}
                    onClick={() => setFilterType(t)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${filterType === t ? "bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white" : "text-gray-500"}`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              {/* Filter Waktu */}
              <select
                className="p-2 bg-gray-100 dark:bg-gray-800 rounded-xl outline-none text-xs font-bold text-gray-600 dark:text-gray-200"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
              >
                <option value="Semua">Semua Waktu</option>
                <option value="Hari Ini">Hari Ini</option>
                <option value="Minggu Ini">7 Hari Terakhir</option>
                <option value="Bulan Ini">Bulan Ini</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto scrollbar-hide">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800/50 text-gray-400 text-[10px] uppercase font-black tracking-widest">
                <th className="p-6">Waktu</th>
                <th className="p-6">Keterangan / ID</th>
                <th className="p-6 text-center">Jenis</th>
                <th className="p-6 text-right">Nominal Masuk</th>
                <th className="p-6 text-right">Nominal Keluar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
              {filteredLedger.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="p-10 text-center text-gray-500 font-medium"
                  >
                    Tidak ada data yang sesuai dengan filter.
                  </td>
                </tr>
              ) : (
                filteredLedger.map((item, i) => {
                  const isMasuk = item.jenis === "Pemasukan";
                  const isSetoran = item.jenis === "Setoran";
                  return (
                    <tr
                      key={i}
                      className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors group"
                    >
                      <td className="p-6 text-xs text-gray-500 font-medium">
                        {new Date(item.waktu).toLocaleString("id-ID")}
                      </td>
                      <td className="p-6">
                        <p className="font-bold text-gray-900 dark:text-white">
                          {item.keterangan}
                        </p>
                        <p className="font-mono text-[10px] text-gray-400 mt-1">
                          {item.id}
                        </p>
                      </td>
                      <td className="p-6 text-center">
                        <span
                          className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${isMasuk ? "bg-green-50 text-green-600" : isSetoran ? "bg-blue-50 text-blue-600" : "bg-red-50 text-red-600"}`}
                        >
                          {item.jenis}
                        </span>
                      </td>
                      <td className="p-6 text-right font-black text-green-500">
                        {isMasuk
                          ? `Rp ${item.nominal.toLocaleString("id-ID")}`
                          : "-"}
                      </td>
                      <td className="p-6 text-right font-black text-red-500">
                        {!isMasuk
                          ? `Rp ${item.nominal.toLocaleString("id-ID")}`
                          : "-"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Modal tetap sama ... */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-gray-900 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 border border-gray-100 dark:border-gray-800">
            <div
              className={`p-6 text-white ${modalType === "Pengeluaran" ? "bg-red-600" : modalType === "Kulakan" ? "bg-amber-600" : "bg-gray-900"}`}
            >
              <h3 className="text-xl font-black mb-1">{modalType}</h3>
              <p className="text-xs opacity-80 font-medium">
                Uang akan memotong Saldo Laci Kasir.
              </p>
            </div>
            <form onSubmit={handleSubmitKas} className="p-6 space-y-5">
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2">
                  Nominal (Rp)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-gray-400">
                    Rp
                  </span>
                  <input
                    type="text"
                    required
                    value={nominal}
                    onChange={(e) =>
                      setNominal(
                        e.target.value
                          .replace(/\D/g, "")
                          .replace(/\B(?=(\d{3})+(?!\d))/g, "."),
                      )
                    }
                    placeholder="0"
                    className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-2xl outline-none focus:ring-2 focus:ring-gray-900 font-bold text-lg dark:text-white"
                  />
                </div>
              </div>
              {modalType === "Kulakan" && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2">
                      Produk
                    </label>
                    <select
                      required
                      value={idProduk}
                      onChange={(e) => setIdProduk(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-2xl outline-none font-bold text-sm dark:text-white"
                    >
                      <option value="">-- Pilih --</option>
                      {initialProducts.map((p) => (
                        <option key={p.ID_Produk} value={p.ID_Produk}>
                          {p.Nama_Produk}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2">
                      Qty
                    </label>
                    <input
                      type="number"
                      required
                      value={jumlahStok}
                      onChange={(e) => setJumlahStok(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-2xl outline-none font-bold text-sm dark:text-white"
                    />
                  </div>
                </div>
              )}
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2">
                  Keterangan
                </label>
                <input
                  type="text"
                  required
                  value={keterangan}
                  onChange={(e) => setKeterangan(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-2xl outline-none font-medium dark:text-white"
                />
              </div>
              <div className="flex gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`flex-1 py-3 text-white rounded-xl font-bold transition-all ${isSubmitting ? "opacity-50" : ""} ${modalType === "Pengeluaran" ? "bg-red-600" : modalType === "Kulakan" ? "bg-amber-600" : "bg-gray-900"}`}
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
