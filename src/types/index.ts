// src/types/index.ts

export interface Produk {
  ID_Produk: string;
  Nama_Produk: string;
  Kategori: string;
  Harga_Modal: number;
  Harga_Jual: number;
  Stok_Awal: number;
  Stok_Minimal: number;
  Satuan: string;
  Foto?: string;
}

export interface CartItem extends Produk {
  Jumlah_Beli: number;
  Total_Harga: number;
}

export interface Transaksi {
  ID_Transaksi: string;
  Waktu: string;
  ID_Produk: string;
  Jumlah_Beli: number;
  Total_Harga: number;
  // Field tambahan untuk fitur Hutang
  Metode_Pembayaran?: "Tunai" | "Transfer" | "Hutang";
  Nama_Pelanggan?: string;
  Status_Hutang?: "Belum Lunas" | "Lunas";
}

// Ini yang dicari oleh api.ts Anda!
export interface ApiResponse<T = any> {
  error: boolean;
  message: string;
  data?: T;
}
