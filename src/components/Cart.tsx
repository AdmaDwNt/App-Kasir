// src/components/Cart.tsx
"use client";

import { useState } from "react";
import { useCartStore } from "@/store/useCartStore";
import PaymentModal from "./PaymentModal"; // Import komponen modal yang baru dibuat

export default function Cart() {
  // Mengambil state dan action dari global store Zustand
  const { cart, removeFromCart, updateQuantity, getTotal, clearCart } =
    useCartStore();

  // State lokal untuk mengatur apakah Payment Modal terbuka atau tertutup
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  // Fungsi yang dipanggil ketika pembayaran sukses di dalam Modal
  const handlePaymentSuccess = () => {
    setIsPaymentModalOpen(false); // Tutup modal
    clearCart(); // Kosongkan keranjang
  };

  return (
    <>
      {/* KONTINER UTAMA KERANJANG */}
      <div className="bg-white p-5 flex flex-col h-full rounded-2xl shadow-sm border border-slate-100">
        {/* Header Keranjang */}
        <h2 className="text-xl font-bold mb-4 text-slate-800 border-b pb-4">
          Keranjang
        </h2>

        {/* Area Daftar Produk (Bisa di-scroll) */}
        <div className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar">
          {/* Kondisi jika keranjang kosong */}
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-12 w-12 opacity-50"
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
              <p className="font-medium">Belum ada produk</p>
            </div>
          ) : (
            // Melakukan perulangan/mapping data produk di keranjang
            cart.map((item) => (
              <div
                key={item.ID_Produk}
                className="flex justify-between items-start bg-slate-50 p-3 rounded-xl border border-slate-100"
              >
                {/* Informasi Nama & Harga Produk */}
                <div className="flex-1 pr-2">
                  <p className="font-semibold text-sm text-slate-800 line-clamp-2">
                    {item.Nama_Produk}
                  </p>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Rp {item.Harga_Jual.toLocaleString("id-ID")} / {item.Satuan}
                  </p>
                  <p className="text-sm font-bold text-blue-600 mt-1">
                    Rp {item.Total_Harga.toLocaleString("id-ID")}
                  </p>
                </div>

                {/* Kontrol Kuantitas & Tombol Hapus */}
                <div className="flex flex-col items-end space-y-2">
                  <button
                    onClick={() => removeFromCart(item.ID_Produk)}
                    className="text-red-400 hover:text-red-600 transition p-1"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                  {/* Input Angka untuk merubah Jumlah Beli */}
                  <input
                    type="number"
                    min="1"
                    value={item.Jumlah_Beli}
                    onChange={(e) =>
                      updateQuantity(
                        item.ID_Produk,
                        parseInt(e.target.value) || 1,
                      )
                    }
                    className="w-14 border border-slate-200 rounded-lg p-1 text-center text-sm font-medium focus:outline-none focus:border-blue-500 bg-white"
                  />
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Area: Menampilkan Total & Tombol Aksi */}
        <div className="mt-4 pt-4 border-t border-slate-200">
          <div className="flex justify-between items-center mb-5">
            <span className="text-slate-500 font-semibold">Total Tagihan</span>
            <span className="font-black text-2xl text-slate-800">
              Rp {getTotal().toLocaleString("id-ID")}
            </span>
          </div>

          <div className="flex gap-3">
            {/* Tombol Kosongkan Keranjang */}
            <button
              onClick={clearCart}
              disabled={cart.length === 0}
              className="w-1/3 py-3 bg-red-50 text-red-600 border border-red-100 rounded-xl hover:bg-red-100 font-bold transition disabled:opacity-50 disabled:hover:bg-red-50"
            >
              Batal
            </button>

            {/* Tombol Proses Bayar -> Akan membuka PaymentModal */}
            <button
              onClick={() => setIsPaymentModalOpen(true)}
              disabled={cart.length === 0}
              className="w-2/3 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-bold transition shadow-md shadow-blue-600/30 disabled:opacity-50 disabled:shadow-none"
            >
              Proses Bayar
            </button>
          </div>
        </div>
      </div>

      {/* RENDER KOMPONEN MODAL (Hanya terlihat jika isPaymentModalOpen = true) */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        cart={cart}
        total={getTotal()}
        onSuccess={handlePaymentSuccess}
      />
    </>
  );
}
