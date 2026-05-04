// src/components/POSClient.tsx
"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Produk, CartItem } from "@/types";
import PaymentModal from "./PaymentModal";
import { toast } from "react-hot-toast";

export default function POSClient() {
  // 1. PULL DATA DARI SERVER (LEWAT REACT QUERY)
  const {
    data: products,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["produk"],
    queryFn: () => api.get<Produk>("produk"),
  });

  // 2. STATE APLIKASI
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Semua");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  // 3. LOGIKA KATEGORI & PENCARIAN
  const categories = useMemo(() => {
    if (!products) return ["Semua"];
    const cats = Array.from(new Set(products.map((p) => p.Kategori)));
    return ["Semua", ...cats];
  }, [products]);

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    return products.filter((p) => {
      const matchSearch =
        p.Nama_Produk.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.ID_Produk.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCat =
        selectedCategory === "Semua" || p.Kategori === selectedCategory;
      return matchSearch && matchCat;
    });
  }, [products, searchQuery, selectedCategory]);

  // 4. LOGIKA KERANJANG BELANJA
  const addToCart = (produk: Produk) => {
    if (produk.Stok_Awal <= 0) {
      toast.error("Stok produk habis!");
      return;
    }
    setCart((prev) => {
      const existing = prev.find((item) => item.ID_Produk === produk.ID_Produk);
      if (existing) {
        if (existing.Jumlah_Beli >= produk.Stok_Awal) {
          toast.error("Maksimal stok tercapai!");
          return prev;
        }
        return prev.map((item) =>
          item.ID_Produk === produk.ID_Produk
            ? {
                ...item,
                Jumlah_Beli: item.Jumlah_Beli + 1,
                Total_Harga: (item.Jumlah_Beli + 1) * item.Harga_Jual,
              }
            : item,
        );
      }
      return [
        ...prev,
        { ...produk, Jumlah_Beli: 1, Total_Harga: produk.Harga_Jual },
      ];
    });
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((item) => item.ID_Produk !== id));
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.ID_Produk === id) {
          const newQty = item.Jumlah_Beli + delta;
          if (newQty <= 0) return item;
          if (newQty > item.Stok_Awal) {
            toast.error("Stok tidak cukup!");
            return item;
          }
          return {
            ...item,
            Jumlah_Beli: newQty,
            Total_Harga: newQty * item.Harga_Jual,
          };
        }
        return item;
      }),
    );
  };

  const clearCart = () => {
    if (confirm("Kosongkan keranjang?")) setCart([]);
  };

  const totalTagihan = cart.reduce((sum, item) => sum + item.Total_Harga, 0);

  // 5. RENDER LOADING / ERROR STATE
  if (isLoading)
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-400">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <p className="font-bold">Memuat menu kasir dari Google Sheets...</p>
      </div>
    );

  if (isError)
    return (
      <div className="h-full flex items-center justify-center text-red-500 font-bold">
        Gagal menarik data produk. Pastikan URL Google Script benar.
      </div>
    );

  // 6. RENDER UI UTAMA
  return (
    <div className="flex h-[calc(100vh-2rem)] bg-slate-50 p-4 gap-4">
      {/* KIRI: Area Katalog Produk */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Search */}
        <div className="relative mb-4 shrink-0">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 absolute left-3 top-3.5 text-slate-400"
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
            placeholder="Ketik nama produk atau barcode..."
            className="w-full pl-10 pr-4 py-3.5 rounded-xl border-2 border-slate-200 focus:outline-none focus:border-blue-500 font-medium text-slate-700 shadow-sm transition-colors"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Kategori Pills */}
        <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-2 mb-4 shrink-0">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-5 py-2.5 rounded-xl font-bold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                  : "bg-white border-2 border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Grid Produk */}
        <div className="flex-1 overflow-y-auto custom-scrollbar pb-20">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredProducts.map((p) => (
              <div
                key={p.ID_Produk}
                onClick={() => addToCart(p)}
                className="bg-white rounded-2xl p-3 border-2 border-slate-100 shadow-sm hover:shadow-md hover:border-blue-300 transition-all cursor-pointer flex flex-col h-full group"
              >
                <div className="aspect-video bg-slate-100 rounded-xl mb-3 overflow-hidden flex items-center justify-center relative">
                  {p.Foto ? (
                    <img
                      src={p.Foto}
                      alt={p.Nama_Produk}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <span className="text-xs font-bold text-slate-300">
                      No Image
                    </span>
                  )}
                  {/* Badge Alert Stok */}
                  {p.Stok_Awal <= p.Stok_Minimal && (
                    <span className="absolute top-2 right-2 bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-md shadow-sm">
                      STOK MENIPIS
                    </span>
                  )}
                </div>
                <div className="text-center flex flex-col flex-1">
                  <p className="font-bold text-slate-800 text-sm mb-1 leading-tight">
                    {p.Nama_Produk}
                  </p>
                  <p className="text-[10px] text-slate-500 mb-2">
                    {p.Kategori} • {p.Satuan}
                  </p>
                  <div className="mt-auto">
                    <p className="font-black text-blue-600 text-lg mb-1">
                      Rp {p.Harga_Jual.toLocaleString("id-ID")}
                    </p>
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${p.Stok_Awal <= p.Stok_Minimal ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600"}`}
                    >
                      Stok: {p.Stok_Awal}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            {filteredProducts.length === 0 && (
              <div className="col-span-full py-10 text-center text-slate-400 font-bold">
                Produk tidak ditemukan.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* KANAN: Sidebar Keranjang */}
      <div className="w-80 bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col shrink-0 overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-blue-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            Keranjang
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-16 w-16 mb-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              <p className="font-bold text-sm">Belum ada produk</p>
            </div>
          ) : (
            <div className="space-y-4">
              {cart.map((item) => (
                <div key={item.ID_Produk} className="flex gap-2">
                  <div className="flex-1">
                    <p className="font-bold text-slate-800 text-sm leading-tight">
                      {item.Nama_Produk}
                    </p>
                    <p className="text-xs text-blue-600 font-black mt-1">
                      Rp {item.Total_Harga.toLocaleString("id-ID")}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 bg-slate-50 rounded-lg p-1 border border-slate-100 h-fit">
                    <button
                      onClick={() => updateQuantity(item.ID_Produk, -1)}
                      className="w-6 h-6 rounded bg-white shadow-sm font-black text-slate-600 hover:text-blue-600 transition-colors"
                    >
                      -
                    </button>
                    <span className="text-xs font-bold w-4 text-center">
                      {item.Jumlah_Beli}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.ID_Produk, 1)}
                      className="w-6 h-6 rounded bg-white shadow-sm font-black text-slate-600 hover:text-blue-600 transition-colors"
                    >
                      +
                    </button>
                  </div>
                  <button
                    onClick={() => removeFromCart(item.ID_Produk)}
                    className="w-8 h-8 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 flex items-center justify-center shrink-0 transition-colors"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-100">
          <div className="flex justify-between items-center mb-4">
            <span className="font-bold text-slate-500 text-sm">
              Total Tagihan
            </span>
            <span className="font-black text-2xl text-blue-600 tracking-tight">
              Rp {totalTagihan.toLocaleString("id-ID")}
            </span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={clearCart}
              disabled={cart.length === 0}
              className="px-4 py-3.5 rounded-xl font-bold text-red-500 bg-red-50 hover:bg-red-100 disabled:opacity-50 transition-colors"
            >
              Batal
            </button>
            <button
              onClick={() => setIsPaymentModalOpen(true)}
              disabled={cart.length === 0}
              className="flex-1 py-3.5 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-600/30 disabled:opacity-50 disabled:shadow-none transition-colors"
            >
              Proses Bayar
            </button>
          </div>
        </div>
      </div>

      {/* 7. PEMANGGILAN MODAL PEMBAYARAN */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        cart={cart}
        total={totalTagihan}
        onSuccess={() => setCart([])} // Kosongkan keranjang jika sukses bayar
      />
    </div>
  );
}
