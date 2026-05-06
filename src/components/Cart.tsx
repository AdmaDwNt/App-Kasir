// src/components/Cart.tsx
"use client";

import { useState } from "react";
import { useCartStore } from "@/store/useCartStore";
import PaymentModal from "./PaymentModal";

export default function Cart() {
  const { items, removeFromCart, updateQty, getTotal, clearCart } = useCartStore();
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  const { subtotal, totalDiscount, grandTotal } = getTotal();

  const handlePaymentSuccess = () => {
    setIsPaymentModalOpen(false);
    clearCart();
  };

  return (
    <>
      <div className="bg-white p-5 flex flex-col h-full rounded-2xl shadow-sm border border-slate-200">
        <div className="border-b border-slate-100 pb-4 mb-4 flex justify-between items-center">
          <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Pesanan
          </h2>
          <span className="bg-slate-100 text-slate-600 text-xs font-bold px-2 py-1 rounded-md">
            {items.length} Item
          </span>
        </div>

        <div className="flex-1 overflow-y-auto pr-1 space-y-3 custom-scrollbar">
          {!Array.isArray(items) || items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              <p className="font-medium text-sm">Keranjang masih kosong</p>
            </div>
          ) : (
            (Array.isArray(items) ? items : []).map((item) => {
              const rowTotal = (item.qty * item.harga_satuan) - item.diskon_item;
              return (
                <div key={`${item.id_produk}-${item.is_rentengan}`} className="flex flex-col bg-slate-50 p-3 rounded-xl border border-slate-100 relative group">
                  {item.is_rentengan && (
                    <span className="absolute -top-2 -right-2 bg-indigo-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-sm z-10">
                      RENTENGAN
                    </span>
                  )}
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1 pr-2">
                      <p className="font-bold text-sm text-slate-800 line-clamp-2 leading-tight">
                        {item.nama}
                      </p>
                      <p className="text-xs text-slate-500 font-medium mt-1">
                        Rp {item.harga_satuan.toLocaleString("id-ID")} {item.diskon_item > 0 && <span className="text-red-400 ml-1">(-Rp {item.diskon_item.toLocaleString("id-ID")})</span>}
                      </p>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.id_produk, item.is_rentengan)}
                      className="text-slate-300 hover:text-red-500 transition-colors p-1"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>

                  <div className="flex justify-between items-end mt-1">
                    <div className="flex items-center gap-1 bg-white rounded-lg p-0.5 border border-slate-200">
                      <button
                        onClick={() => updateQty(item.id_produk, item.is_rentengan, Math.max(1, item.qty - 1))}
                        className="w-7 h-7 rounded-md bg-slate-50 text-slate-600 font-bold hover:bg-slate-200 transition-colors flex items-center justify-center"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="1"
                        value={item.qty}
                        onChange={(e) => updateQty(item.id_produk, item.is_rentengan, parseInt(e.target.value) || 1)}
                        className="w-8 text-center text-sm font-bold text-slate-800 bg-transparent focus:outline-none"
                      />
                      <button
                        onClick={() => updateQty(item.id_produk, item.is_rentengan, item.qty + 1)}
                        className="w-7 h-7 rounded-md bg-slate-50 text-slate-600 font-bold hover:bg-slate-200 transition-colors flex items-center justify-center"
                      >
                        +
                      </button>
                    </div>
                    <p className="text-sm font-black text-blue-600">
                      Rp {rowTotal.toLocaleString("id-ID")}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="mt-4 pt-4 border-t border-slate-200 flex flex-col gap-2">
          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-500 font-medium">Subtotal</span>
            <span className="font-bold text-slate-700">Rp {subtotal.toLocaleString("id-ID")}</span>
          </div>
          {totalDiscount > 0 && (
            <div className="flex justify-between items-center text-sm">
              <span className="text-red-400 font-medium">Diskon</span>
              <span className="font-bold text-red-500">-Rp {totalDiscount.toLocaleString("id-ID")}</span>
            </div>
          )}
          <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-100">
            <span className="text-slate-800 font-black">Grand Total</span>
            <span className="font-black text-2xl text-blue-600 tracking-tight">
              Rp {grandTotal.toLocaleString("id-ID")}
            </span>
          </div>

          <div className="flex gap-2 mt-4">
            <button
              onClick={clearCart}
              disabled={items.length === 0}
              className="px-4 py-3 bg-white text-red-500 border-2 border-red-100 rounded-xl hover:bg-red-50 font-bold transition-colors disabled:opacity-50"
            >
              Batal
            </button>
            <button
              onClick={() => setIsPaymentModalOpen(true)}
              disabled={items.length === 0}
              className="flex-1 py-3 bg-slate-800 text-white rounded-xl hover:bg-slate-900 font-black transition-all shadow-lg shadow-slate-200 disabled:opacity-50 disabled:shadow-none"
            >
              Proses Bayar
            </button>
          </div>
        </div>
      </div>

      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        onSuccess={handlePaymentSuccess}
      />
    </>
  );
}
