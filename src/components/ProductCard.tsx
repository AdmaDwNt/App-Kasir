"use client";

import { Product } from "@/types";
import { AlertCircle } from "lucide-react";

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
}

export default function ProductCard({
  product,
  onAddToCart,
}: ProductCardProps) {
  // Cek apakah stok tipis (jika stok minimal kosong, kita pakai default 5)
  const isLowStock = product.Stok_Awal <= (product.Stok_Minimal || 5);

  return (
    <div
      onClick={() => onAddToCart(product)}
      className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 cursor-pointer hover:shadow-xl hover:border-gray-300 dark:hover:border-gray-600 transition-all active:scale-95 relative overflow-hidden group flex flex-col h-full justify-between"
    >
      {/* BADGE STOK TIPIS */}
      {isLowStock && (
        <div className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg flex items-center gap-1 z-10 shadow-sm">
          <AlertCircle size={12} /> Sisa: {product.Stok_Awal}
        </div>
      )}

      <div>
        {/* AREA FOTO PRODUK: Akan menampilkan foto jika ada, jika tidak kembali ke emoji kotak */}
        <div className="aspect-square bg-gray-50 dark:bg-gray-800 rounded-xl mb-4 flex items-center justify-center overflow-hidden group-hover:bg-gray-100 dark:group-hover:bg-gray-700 transition-colors">
          {product.Foto ? (
            <img
              src={product.Foto}
              alt={product.Nama_Produk}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-4xl opacity-80">📦</span>
          )}
        </div>

        <h3 className="font-bold text-gray-900 dark:text-gray-100 leading-tight mb-1">
          {product.Nama_Produk}
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
          {product.Kategori}
        </p>
      </div>

      <div className="flex justify-between items-end mt-auto">
        <span className="font-black text-green-600 dark:text-green-400">
          Rp {(product.Harga_Jual || 0).toLocaleString("id-ID")}
        </span>
      </div>
    </div>
  );
}
