"use client";

import { useState, useMemo } from "react";
import { Transaction, Product } from "@/types";
import {
  FileDown,
  Search,
  Filter,
  XCircle,
  Printer,
  Receipt,
  List,
  X,
  MessageCircle,
  RefreshCw,
} from "lucide-react";
import * as XLSX from "xlsx";
import { refreshAllData } from "@/app/actions";
import { useRouter } from "next/navigation";

interface RiwayatClientProps {
  initialTransactions: Transaction[];
  initialProducts: Product[];
}

interface GroupedTransaction {
  ID_Transaksi: string;
  Waktu: string;
  Total_Tagihan: number;
  Total_Item: number;
  Items: Transaction[];
}

export default function RiwayatClient({
  initialTransactions,
  initialProducts,
}: RiwayatClientProps) {
  const [search, setSearch] = useState("");
  const [timeFilter, setTimeFilter] = useState("all");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  // DEFAULT VIEW: "GROUPED" (PER STRUK)
  const [viewMode, setViewMode] = useState<"grouped" | "raw">("grouped");
  const [selectedReceipt, setSelectedReceipt] =
    useState<GroupedTransaction | null>(null);

  // STATE UNTUK SINKRONISASI
  const [isRefreshing, setIsRefreshing] = useState(false);
  const router = useRouter();

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // FUNGSI SINKRONISASI MANUAL
  const handleSync = async () => {
    setIsRefreshing(true);
    await refreshAllData();
    router.refresh();
    setIsRefreshing(false);
    showToast("Data berhasil disinkronkan dengan Spreadsheet!");
  };

  // LOGIKA PENGELOMPOKAN STRUK
  const groupedTransactions = useMemo(() => {
    const map = new Map<string, GroupedTransaction>();

    initialTransactions.forEach((t) => {
      const idStr = String(t.ID_Transaksi).trim();
      if (!idStr || idStr === "undefined") return;

      if (!map.has(idStr)) {
        map.set(idStr, {
          ID_Transaksi: idStr,
          Waktu: t.Waktu,
          Total_Tagihan: 0,
          Total_Item: 0,
          Items: [],
        });
      }

      const group = map.get(idStr)!;
      group.Items.push(t);
      group.Total_Tagihan += Number(t.Total_Harga || 0);
      group.Total_Item += Number(t.Jumlah_Beli || 0);
    });

    // Urutkan berdasarkan waktu terbaru (Descending)
    return Array.from(map.values()).sort(
      (a, b) => new Date(b.Waktu).getTime() - new Date(a.Waktu).getTime(),
    );
  }, [initialTransactions]);

  const isDateInRange = (dateStr: string) => {
    if (timeFilter === "all") return true;
    const d = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = today.getTime() - d.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    switch (timeFilter) {
      case "today":
        return diffDays === 0;
      case "2days":
        return diffDays <= 1;
      case "1week":
        return diffDays <= 6;
      case "custom":
        if (!customStart || !customEnd) return true;
        return (
          d >= new Date(customStart) && d <= new Date(customEnd + "T23:59:59")
        );
      default:
        return true;
    }
  };

  const filteredGrouped = groupedTransactions.filter((g) => {
    return (
      g.ID_Transaksi?.toLowerCase().includes(search.toLowerCase()) &&
      isDateInRange(g.Waktu)
    );
  });

  const filteredRaw = initialTransactions
    .filter((t) => {
      const matchSearch =
        String(t.ID_Transaksi).toLowerCase().includes(search.toLowerCase()) ||
        String(t.ID_Produk).toLowerCase().includes(search.toLowerCase());
      return matchSearch && isDateInRange(t.Waktu);
    })
    .reverse();

  const getProductName = (id: string) => {
    const p = initialProducts.find((prod) => prod.ID_Produk === id);
    return p ? p.Nama_Produk : id;
  };

  const sendWhatsApp = (receipt: GroupedTransaction) => {
    let text = `*WARUNG KITA*\nID: ${receipt.ID_Transaksi}\n\n`;
    receipt.Items.forEach((item) => {
      text += `${item.Jumlah_Beli}x ${getProductName(item.ID_Produk)}\nRp ${Number(item.Total_Harga).toLocaleString("id-ID")}\n`;
    });
    text += `\n*TOTAL:* Rp ${receipt.Total_Tagihan.toLocaleString("id-ID")}`;
    text += `\n\nTerima kasih atas kunjungannya!`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  const exportExcel = () => {
    const dataToExport =
      viewMode === "grouped"
        ? filteredGrouped.map((g) => ({
            "ID Struk": g.ID_Transaksi,
            Waktu: new Date(g.Waktu).toLocaleString("id-ID"),
            "Daftar Barang": g.Items.map(
              (i) => `${getProductName(i.ID_Produk)} (${i.Jumlah_Beli})`,
            ).join(", "),
            "Total Qty": g.Total_Item,
            "Total Bayar": g.Total_Tagihan,
          }))
        : filteredRaw;

    if (dataToExport.length === 0) return showToast("Data kosong!");
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan");
    XLSX.writeFile(workbook, `Laporan_${new Date().getTime()}.xlsx`);
  };

  return (
    <div className="p-4 lg:p-8 max-w-6xl mx-auto h-full overflow-y-auto scrollbar-hide">
      {/* TOAST NOTIFIKASI */}
      <div
        className={`fixed top-8 left-1/2 -translate-x-1/2 z-[100] transition-all duration-500 ease-out flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl border bg-white dark:bg-gray-800 border-red-100 dark:border-red-900 ${toast ? "translate-y-0 opacity-100" : "-translate-y-10 opacity-0 pointer-events-none"}`}
      >
        <XCircle className="text-red-500" size={20} />
        <p className="font-semibold text-sm text-gray-800 dark:text-gray-100">
          {toast}
        </p>
      </div>

      {/* MODAL STRUK (UNTUK CETAK ULANG) */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-xl w-full max-w-sm p-0 shadow-2xl overflow-hidden flex flex-col text-black animate-in zoom-in-95">
            <div
              id="printable-receipt"
              className="p-6 bg-white font-mono text-sm flex-1"
            >
              <div className="text-center mb-4 border-b border-dashed border-gray-300 pb-4">
                <h2 className="text-xl font-bold mb-1 uppercase tracking-tighter">
                  Warung Kita
                </h2>
                <p className="text-[10px] text-gray-500">
                  {new Date(selectedReceipt.Waktu).toLocaleString("id-ID")}
                </p>
                <p className="text-[10px] text-gray-500 font-bold">
                  {selectedReceipt.ID_Transaksi}
                </p>
              </div>
              <ul className="space-y-2 mb-4 border-b border-dashed border-gray-300 pb-4">
                {selectedReceipt.Items.map((item, idx) => {
                  const hargaSatuan =
                    Number(item.Total_Harga) / Number(item.Jumlah_Beli);
                  return (
                    <li key={idx} className="flex justify-between items-start">
                      <div className="max-w-[150px]">
                        <span className="font-bold uppercase text-xs">
                          {getProductName(item.ID_Produk)}
                        </span>
                        <div className="text-[10px] text-gray-400">
                          {item.Jumlah_Beli} x{" "}
                          {hargaSatuan.toLocaleString("id-ID")}
                        </div>
                      </div>
                      <span className="font-bold text-xs">
                        {Number(item.Total_Harga).toLocaleString("id-ID")}
                      </span>
                    </li>
                  );
                })}
              </ul>
              <div className="flex justify-between text-base font-black mb-4">
                <span>TOTAL</span>
                <span>
                  Rp {selectedReceipt.Total_Tagihan.toLocaleString("id-ID")}
                </span>
              </div>
              <div className="text-center text-[10px] uppercase font-bold italic">
                *** Salinan Struk ***
              </div>
            </div>
            <div className="p-4 bg-gray-50 border-t border-gray-200 grid grid-cols-2 gap-2 no-print">
              <button
                onClick={() => window.print()}
                className="py-3 bg-gray-900 text-white rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-black transition-colors"
              >
                <Printer size={18} /> Cetak
              </button>
              <button
                onClick={() => sendWhatsApp(selectedReceipt)}
                className="py-3 bg-green-500 text-white rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-green-600 transition-colors"
              >
                <MessageCircle size={18} /> WA
              </button>
              <button
                onClick={() => setSelectedReceipt(null)}
                className="col-span-2 py-3 bg-white border border-gray-300 text-gray-800 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-gray-100 mt-1"
              >
                <X size={18} /> Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HEADER & TOGGLE TAMPILAN */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Riwayat Transaksi
          </h1>
          <p className="text-gray-500 mt-1">
            Menampilkan{" "}
            {viewMode === "grouped"
              ? filteredGrouped.length + " Struk"
              : filteredRaw.length + " Baris Item"}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
          <div className="flex bg-gray-100 dark:bg-gray-800 p-1.5 rounded-2xl w-full lg:w-auto shadow-inner">
            <button
              onClick={() => setViewMode("grouped")}
              className={`flex-1 lg:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${viewMode === "grouped" ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-md" : "text-gray-500"}`}
            >
              <Receipt size={18} /> Per Struk
            </button>
            <button
              onClick={() => setViewMode("raw")}
              className={`flex-1 lg:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${viewMode === "raw" ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-md" : "text-gray-500"}`}
            >
              <List size={18} /> Per Item
            </button>
          </div>

          <button
            onClick={handleSync}
            disabled={isRefreshing}
            className="flex items-center justify-center gap-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 text-gray-900 dark:text-white px-5 py-2 rounded-xl font-bold transition-all"
          >
            <RefreshCw
              size={18}
              className={isRefreshing ? "animate-spin" : ""}
            />
            {isRefreshing ? "Loading..." : "Sinkronkan"}
          </button>

          <button
            onClick={exportExcel}
            className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-xl font-bold transition-all shadow-lg"
          >
            <FileDown size={18} /> Ekspor Excel
          </button>
        </div>
      </div>

      {/* SEARCH & FILTER */}
      <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm p-4 mb-8 flex flex-col lg:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            size={18}
          />
          <input
            type="text"
            placeholder="Cari ID Struk / TRX..."
            className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-2xl outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100"
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="w-full lg:w-48 p-3 bg-gray-50 dark:bg-gray-800 rounded-2xl outline-none font-bold text-sm"
          onChange={(e) => setTimeFilter(e.target.value)}
        >
          <option value="all">Semua Waktu</option>
          <option value="today">Hari Ini</option>
          <option value="2days">2 Hari Terakhir</option>
          <option value="1week">1 Minggu Terakhir</option>
        </select>
      </div>

      {/* RENDER MODE PER STRUK (KARTU) */}
      {viewMode === "grouped" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredGrouped.length === 0 ? (
            <div className="col-span-full py-20 text-center text-gray-400 font-medium">
              Tidak ada data struk.
            </div>
          ) : (
            filteredGrouped.map((g) => (
              <div
                key={g.ID_Transaksi}
                className="bg-white dark:bg-gray-900 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 overflow-hidden hover:shadow-xl transition-all border-b-4 border-b-gray-900 dark:border-b-white"
              >
                <div className="p-6">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                        Nomor Struk
                      </span>
                      <h3 className="font-mono font-bold text-gray-900 dark:text-white">
                        {g.ID_Transaksi}
                      </h3>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(g.Waktu).toLocaleString("id-ID")}
                      </p>
                    </div>
                    <div className="bg-green-50 dark:bg-green-900/20 text-green-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter">
                      Terbayar
                    </div>
                  </div>

                  {/* DAFTAR ITEM DALAM KARTU */}
                  <div className="space-y-4 mb-8">
                    {g.Items.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex justify-between items-center text-sm"
                      >
                        <div className="flex gap-3 items-center">
                          <div className="w-8 h-8 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center justify-center font-bold text-xs">
                            {item.Jumlah_Beli}
                          </div>
                          <div>
                            <p className="font-bold text-gray-800 dark:text-gray-200">
                              {getProductName(item.ID_Produk)}
                            </p>
                            <p className="text-[10px] text-gray-400">
                              @ Rp{" "}
                              {(
                                Number(item.Total_Harga) /
                                Number(item.Jumlah_Beli)
                              ).toLocaleString("id-ID")}
                            </p>
                          </div>
                        </div>
                        <p className="font-black text-gray-900 dark:text-white">
                          Rp {Number(item.Total_Harga).toLocaleString("id-ID")}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-between items-center pt-6 border-t border-gray-50 dark:border-gray-800">
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase">
                        Total Tagihan
                      </p>
                      <p className="text-2xl font-black text-green-600 dark:text-green-400">
                        Rp {g.Total_Tagihan.toLocaleString("id-ID")}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setSelectedReceipt(g)}
                        className="p-3 bg-gray-900 dark:bg-white dark:text-black text-white rounded-2xl hover:scale-110 transition-all shadow-lg shadow-gray-900/10"
                      >
                        <Printer size={20} />
                      </button>
                      <button
                        onClick={() => sendWhatsApp(g)}
                        className="p-3 bg-green-500 text-white rounded-2xl hover:scale-110 transition-all shadow-lg shadow-green-500/20"
                      >
                        <MessageCircle size={20} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        /* RENDER MODE PER ITEM (TABEL) */
        <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800/50 text-gray-400 text-[10px] uppercase font-black tracking-widest">
                <th className="p-6">ID TRX</th>
                <th className="p-6">Waktu</th>
                <th className="p-6">Nama Produk</th>
                <th className="p-6 text-center">Jumlah</th>
                <th className="p-6 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
              {filteredRaw.map((t, i) => (
                <tr
                  key={i}
                  className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors"
                >
                  <td className="p-6 font-mono text-[10px] font-bold text-gray-400">
                    {t.ID_Transaksi}
                  </td>
                  <td className="p-6 text-xs text-gray-500">
                    {new Date(t.Waktu).toLocaleString("id-ID")}
                  </td>
                  <td className="p-6 font-bold text-gray-900 dark:text-white">
                    {getProductName(t.ID_Produk)}
                  </td>
                  <td className="p-6 text-center font-black text-gray-400">
                    {t.Jumlah_Beli}
                  </td>
                  <td className="p-6 font-black text-gray-900 dark:text-white text-right">
                    Rp {Number(t.Total_Harga).toLocaleString("id-ID")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
