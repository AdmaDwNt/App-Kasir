export type Product = {
  ID_Produk: string;
  Nama_Produk: string;
  Kategori: string;
  Satuan: string;
  Harga_Modal: number;
  Harga_Jual: number;
  Stok_Awal: number;
  Foto?: string; // Optional (bisa kosong)
  Parent_ID?: string; // Optional (berisi ID renteng)
  Isi_Per_Parent?: number | string; // Optional (jumlah default konversi)
};

export type CartItem = Product & {
  quantity: number;
};

// TAMBAHKAN INI:
export type Transaction = {
  ID_Transaksi: string;
  Waktu: string;
  ID_Produk: string;
  Jumlah_Beli: number;
  Total_Harga: number;
};
// Tambahkan ini di bagian bawah file
export type Kas = {
  ID_Kas: string;
  Waktu: string;
  Jenis: string;
  Nominal: number;
  Keterangan: string;
};
