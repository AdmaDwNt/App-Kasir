// src/components/POSClient.tsx
"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { gasFetch } from "@/lib/api";
import { Produk } from "@/types";
import { useCartStore } from "@/store/useCartStore";
import Cart from "./Cart";

export default function POSClient() {
  const {
    data: products,
    isLoading,
    isError,
  } = useQuery({
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

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Semua");
  const { addItem } = useCartStore();

  const categories = useMemo(() => {
    if (!Array.isArray(products)) return ["Semua"];
    const cats = Array.from(new Set(products.map((p) => p.Kategori)));
    return ["Semua", ...cats];
  }, [products]);

  const filteredProducts = useMemo(() => {
    if (!Array.isArray(products)) return [];
    return products.filter((p) => {
      const matchSearch =
        p.Nama_Produk.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.ID_Produk.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCat =
        selectedCategory === "Semua" || p.Kategori === selectedCategory;
      return matchSearch && matchCat;
    });
  }, [products, searchQuery, selectedCategory]);

  if (isLoading)
    return (
      <div className="h-[calc(100vh-2rem)] flex flex-col items-center justify-center text-slate-400 bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <p className="font-bold">Memuat menu kasir dari Google Sheets...</p>
      </div>
    );

  if (isError)
    return (
      <div className="h-[calc(100vh-2rem)] flex items-center justify-center text-red-500 font-bold bg-slate-50">
        Gagal menarik data produk. Pastikan URL Google Script benar.
      </div>
    );

  return (
    <div className="flex h-[calc(100vh-2rem)] bg-slate-50 p-4 gap-4">
      {/* KIRI: Area Katalog Produk (65-70%) */}
      <div className="flex-[7] flex flex-col overflow-hidden">
        {/* Search & Kategori Header */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 mb-4 shrink-0 flex flex-col gap-4">
          <div className="relative">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 absolute left-3 top-3.5 text-slate-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Ketik nama produk atau barcode..."
              className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-slate-100 bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-500 font-medium text-slate-700 transition-colors"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-2">
            {(Array.isArray(categories) ? categories : []).map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-5 py-2 rounded-xl font-bold whitespace-nowrap transition-all text-sm ${
                  selectedCategory === cat
                    ? "bg-slate-800 text-white shadow-md"
                    : "bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Grid Produk */}
        <div className="flex-1 overflow-y-auto custom-scrollbar pb-2">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {(Array.isArray(filteredProducts) ? filteredProducts : []).map((p) => (
              <div
                key={p.ID_Produk}
                className="bg-white rounded-2xl p-3 border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col h-full group"
              >
                <div className="aspect-video bg-slate-50 rounded-xl mb-3 overflow-hidden flex items-center justify-center relative border border-slate-100">
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
                  {p.Stok_Awal <= p.Stok_Minimal && (
                    <span className="absolute top-2 right-2 bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-md shadow-sm">
                      STOK MENIPIS
                    </span>
                  )}
                </div>
                <div className="text-center flex flex-col flex-1">
                  <p className="font-bold text-slate-800 text-sm mb-1 leading-tight line-clamp-2">
                    {p.Nama_Produk}
                  </p>
                  <p className="text-[10px] font-medium text-slate-500 mb-2">
                    Stok: {p.Stok_Awal} {p.Satuan}
                  </p>
                  <div className="mt-auto pt-2 flex flex-col gap-2">
                    <button
                      onClick={() => addItem(p, 1, false)}
                      className="w-full py-2 bg-blue-50 text-blue-600 font-bold text-xs rounded-lg hover:bg-blue-600 hover:text-white transition-colors"
                    >
                      + Eceran (Rp {p.Harga_Jual.toLocaleString("id-ID")})
                    </button>
                    <button
                      onClick={() => addItem(p, 1, true)}
                      className="w-full py-2 bg-indigo-50 text-indigo-600 font-bold text-xs rounded-lg hover:bg-indigo-600 hover:text-white transition-colors"
                    >
                      + Renteng
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {filteredProducts.length === 0 && (
              <div className="col-span-full py-10 flex flex-col items-center text-slate-400 font-bold">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Produk tidak ditemukan.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* KANAN: Area Keranjang (30-35%) */}
      <div className="flex-[3] min-w-[320px]">
        <Cart />
      </div>
    </div>
  );
}
