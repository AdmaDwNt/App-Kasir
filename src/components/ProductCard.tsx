"use client";

import { Produk } from "@/types";
import { useCartStore } from "@/store/useCartStore";

export default function ProductCard({ produk }: { produk: Produk }) {
  const addToCart = useCartStore((state) => state.addToCart);

  // Jika stok habis atau minus, kita disable tombolnya
  const isOutOfStock = produk.Stok_Awal <= 0;

  return (
    <div
      onClick={() => !isOutOfStock && addToCart(produk)}
      className={`border p-4 rounded-xl shadow-sm transition flex flex-col items-center text-center bg-white ${
        isOutOfStock
          ? "opacity-50 cursor-not-allowed grayscale"
          : "hover:shadow-md cursor-pointer hover:border-blue-500"
      }`}
    >
      {/* Tampilkan gambar jika ada, jika tidak pakai placeholder */}
      {produk.Foto ? (
        <img
          src={produk.Foto}
          alt={produk.Nama_Produk}
          className="w-full h-28 object-cover rounded-lg mb-3"
        />
      ) : (
        <div className="w-full h-28 bg-slate-100 rounded-lg mb-3 flex items-center justify-center text-slate-400 text-xs font-medium">
          No Image
        </div>
      )}

      <h3 className="font-semibold text-slate-800 text-sm line-clamp-2 leading-tight min-h-[2.5rem]">
        {produk.Nama_Produk}
      </h3>
      <p className="text-xs text-slate-500 mt-1">
        {produk.Kategori} • {produk.Satuan}
      </p>
      <p className="font-bold text-blue-600 mt-2 text-lg">
        Rp {produk.Harga_Jual.toLocaleString("id-ID")}
      </p>

      <div
        className={`mt-2 text-xs font-semibold px-2 py-1 rounded-full ${isOutOfStock ? "bg-red-100 text-red-600" : "bg-green-100 text-green-700"}`}
      >
        Stok: {produk.Stok_Awal}
      </div>
    </div>
  );
}
