"use client";

import {
  ShoppingBag,
  Minus,
  Plus,
  Trash2,
  Banknote,
  PauseCircle,
  PlayCircle,
} from "lucide-react";
import { CartItem } from "@/types";

interface CartProps {
  cart: CartItem[];
  heldCart: CartItem[];
  updateQuantity: (id: string, delta: number) => void;
  removeItem: (id: string) => void;
  totalTagihan: number;
  setIsCheckoutOpen: (isOpen: boolean) => void;
  handleHoldOrder: () => void;
  handleResumeOrder: () => void;
}

export default function Cart({
  cart,
  heldCart,
  updateQuantity,
  removeItem,
  totalTagihan,
  setIsCheckoutOpen,
  handleHoldOrder,
  handleResumeOrder,
}: CartProps) {
  return (
    <div className="w-full lg:w-[400px] bg-white dark:bg-gray-900 border-l border-gray-100 dark:border-gray-800 shadow-2xl flex flex-col h-[50vh] lg:h-full z-20 shrink-0">
      <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-white dark:bg-gray-900">
        <div className="flex items-center gap-2">
          <ShoppingBag size={20} className="text-gray-900 dark:text-white" />
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            Keranjang
          </h2>
        </div>

        {/* TOMBOL PENDING / AMBIL PESANAN */}
        <div className="flex gap-2">
          {heldCart.length > 0 && cart.length === 0 && (
            <button
              onClick={handleResumeOrder}
              className="flex items-center gap-1 text-xs font-bold bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg hover:bg-blue-200 transition-colors"
            >
              <PlayCircle size={14} /> Lanjut ({heldCart.length})
            </button>
          )}
          <button
            onClick={handleHoldOrder}
            disabled={cart.length === 0}
            className={`flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${cart.length === 0 ? "bg-gray-100 text-gray-400" : "bg-orange-100 text-orange-700 hover:bg-orange-200"}`}
          >
            <PauseCircle size={14} /> Pending
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 scrollbar-hide">
        {cart.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-4">
            <ShoppingBag size={48} className="opacity-20" />
            <p className="text-sm">Keranjang masih kosong</p>
          </div>
        ) : (
          <ul className="space-y-4">
            {cart.map((item) => (
              <li
                key={item.ID_Produk}
                className="flex flex-col gap-3 pb-4 border-b border-gray-50 dark:border-gray-800/50 last:border-0"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-sm leading-tight">
                      {item.Nama_Produk}
                    </p>
                    <p className="text-gray-500 text-xs mt-1">
                      Rp {item.Harga_Jual.toLocaleString("id-ID")}
                    </p>
                  </div>
                  <p className="font-bold text-sm">
                    Rp{" "}
                    {(item.Harga_Jual * item.quantity).toLocaleString("id-ID")}
                  </p>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-800 rounded-lg p-1">
                    <button
                      onClick={() => updateQuantity(item.ID_Produk, -1)}
                      className="p-1 text-gray-500 hover:bg-white dark:hover:bg-gray-700 rounded-md shadow-sm"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="text-sm font-semibold w-4 text-center">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.ID_Produk, 1)}
                      className="p-1 text-gray-500 hover:bg-white dark:hover:bg-gray-700 rounded-md shadow-sm"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  <button
                    onClick={() => removeItem(item.ID_Produk)}
                    className="p-2 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="p-5 border-t border-gray-100 dark:border-gray-800">
        <div className="flex justify-between items-center mb-4">
          <span className="text-gray-500 text-sm font-medium">
            Total Tagihan
          </span>
          <span className="text-2xl font-black">
            Rp {totalTagihan.toLocaleString("id-ID")}
          </span>
        </div>
        <button
          onClick={() => setIsCheckoutOpen(true)}
          disabled={cart.length === 0}
          className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${cart.length === 0 ? "bg-gray-100 dark:bg-gray-800 text-gray-400" : "bg-gray-900 dark:bg-white dark:text-black text-white hover:scale-[0.98] shadow-xl"}`}
        >
          <Banknote size={20} /> Bayar Sekarang
        </button>
      </div>
    </div>
  );
}
