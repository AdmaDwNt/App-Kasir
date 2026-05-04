import { create } from "zustand";
import { CartItem, Produk } from "@/types";

interface CartState {
  cart: CartItem[];
  addToCart: (produk: Produk) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, qty: number) => void;
  clearCart: () => void;
  getTotal: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  cart: [],

  addToCart: (produk) =>
    set((state) => {
      // Cek apakah produk sudah ada di keranjang
      const existingItem = state.cart.find(
        (item) => item.ID_Produk === produk.ID_Produk,
      );

      if (existingItem) {
        // Jika ada, tambahkan quantity-nya saja
        return {
          cart: state.cart.map((item) =>
            item.ID_Produk === produk.ID_Produk
              ? {
                  ...item,
                  Jumlah_Beli: item.Jumlah_Beli + 1,
                  Total_Harga: (item.Jumlah_Beli + 1) * item.Harga_Jual,
                }
              : item,
          ),
        };
      }

      // Jika belum ada, masukkan produk baru ke keranjang dengan qty 1
      return {
        cart: [
          ...state.cart,
          {
            ...produk,
            Jumlah_Beli: 1,
            Total_Harga: produk.Harga_Jual,
            Diskon: 0,
          },
        ],
      };
    }),

  removeFromCart: (id) =>
    set((state) => ({
      cart: state.cart.filter((item) => item.ID_Produk !== id),
    })),

  updateQuantity: (id, qty) =>
    set((state) => ({
      cart: state.cart.map((item) =>
        item.ID_Produk === id
          ? {
              ...item,
              Jumlah_Beli: qty,
              Total_Harga: qty * item.Harga_Jual, // Total harga langsung terupdate otomatis
            }
          : item,
      ),
    })),

  clearCart: () => set({ cart: [] }),

  // Fungsi helper untuk menghitung Grand Total di halaman kasir
  getTotal: () =>
    get().cart.reduce((total, item) => total + item.Total_Harga, 0),
}));
