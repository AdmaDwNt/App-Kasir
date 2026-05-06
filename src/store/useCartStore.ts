// src/store/useCartStore.ts
import { create } from "zustand";
import { Produk } from "@/types";

export interface CartItem {
  id_produk: string;
  nama: string;
  qty: number;
  harga_satuan: number;
  diskon_item: number;
  is_rentengan: boolean;
  // Referensi data produk asli untuk keperluan UI
  produk_ref: Produk;
}

export interface CartState {
  items: CartItem[];
  globalDiscount: number;
  
  // Actions
  addItem: (product: Produk, qty: number, is_rentengan: boolean) => void;
  removeItem: (id_produk: string, is_rentengan: boolean) => void;
  updateQty: (id_produk: string, is_rentengan: boolean, qty: number) => void;
  setItemDiscount: (id_produk: string, is_rentengan: boolean, discount: number) => void;
  setGlobalDiscount: (discount: number) => void;
  clearCart: () => void;
  
  // Computed / Getters
  getTotal: () => {
    subtotal: number;
    totalDiscount: number;
    grandTotal: number;
  };
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  globalDiscount: 0,

  addItem: (product, qty, is_rentengan) => set((state) => {
    // 1. Tentukan harga satuan.
    // Jika is_rentengan true, gunakan Harga_Renteng (jika ada) atau fallback ke Harga_Jual standar
    const harga_satuan = is_rentengan 
      ? ((product as any).Harga_Renteng || product.Harga_Jual) 
      : product.Harga_Jual;

    // 2. Cek apakah item dengan composite key (id_produk + is_rentengan) sudah ada
    // Memungkinkan user beli eceran dan rentengan untuk produk yang sama
    const existingIndex = state.items.findIndex(
      (item) => item.id_produk === product.ID_Produk && item.is_rentengan === is_rentengan
    );

    if (existingIndex >= 0) {
      // Update item yang sudah ada: tambahkan kuantitasnya
      const newItems = [...state.items];
      newItems[existingIndex] = {
        ...newItems[existingIndex],
        qty: newItems[existingIndex].qty + qty,
      };
      return { items: newItems };
    }

    // 3. Tambahkan item baru ke keranjang jika belum ada
    const newItem: CartItem = {
      id_produk: product.ID_Produk,
      nama: product.Nama_Produk,
      qty,
      harga_satuan,
      diskon_item: 0,
      is_rentengan,
      produk_ref: product,
    };

    return { items: [...state.items, newItem] };
  }),

  removeItem: (id_produk, is_rentengan) => set((state) => ({
    // Menghapus berdasarkan composite key
    items: state.items.filter(
      (item) => !(item.id_produk === id_produk && item.is_rentengan === is_rentengan)
    ),
  })),

  updateQty: (id_produk, is_rentengan, qty) => set((state) => ({
    items: state.items.map((item) =>
      item.id_produk === id_produk && item.is_rentengan === is_rentengan
        ? { ...item, qty }
        : item
    ),
  })),

  setItemDiscount: (id_produk, is_rentengan, discount) => set((state) => ({
    items: state.items.map((item) =>
      item.id_produk === id_produk && item.is_rentengan === is_rentengan
        ? { ...item, diskon_item: discount } // Set nominal diskon khusus per item
        : item
    ),
  })),

  setGlobalDiscount: (discount) => set({ globalDiscount: discount }),

  clearCart: () => set({ items: [], globalDiscount: 0 }),

  // Menghitung rekapitulasi keranjang belanja
  getTotal: () => {
    const { items, globalDiscount } = get();
    
    let totalHargaKotor = 0;
    let itemDiscountsTotal = 0;

    items.forEach((item) => {
      // Hitung total harga dasar tanpa diskon
      totalHargaKotor += item.qty * item.harga_satuan;
      // Hitung total nominal diskon yang diterapkan pada tiap-tiap baris item
      itemDiscountsTotal += item.diskon_item;
    });

    // Subtotal: Total harga semua item setelah dikurangi diskon masing-masing item
    const subtotal = totalHargaKotor - itemDiscountsTotal;

    // Total Discount: Gabungan dari semua diskon item ditambah diskon global (per transaksi)
    const totalDiscount = itemDiscountsTotal + globalDiscount;

    // Grand Total: Subtotal akhir yang harus dibayar setelah dikurangi diskon global
    const grandTotal = subtotal - globalDiscount;

    return {
      subtotal, 
      totalDiscount,
      // Pastikan Grand Total tidak bernilai negatif
      grandTotal: grandTotal >= 0 ? grandTotal : 0, 
    };
  },
}));
