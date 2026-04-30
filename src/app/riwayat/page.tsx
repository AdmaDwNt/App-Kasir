import { Transaction, Product } from "@/types";
import RiwayatClient from "./RiwayatClient";

export default async function Riwayat() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL as string;
  let transactions: Transaction[] = [];
  let products: Product[] = []; // Tambahan untuk mengambil nama produk

  try {
    // Menarik data Transaksi dan Produk secara bersamaan dari Cache Agresif
    const [resTx, resProd] = await Promise.all([
      fetch(`${API_URL}?data=transaksi`, {
        cache: "force-cache",
        next: { tags: ["transactions"] },
      }),
      fetch(`${API_URL}?data=produk`, {
        cache: "force-cache",
        next: { tags: ["products"] },
      }),
    ]);

    if (resTx.ok) transactions = await resTx.json();
    if (resProd.ok) products = await resProd.json();
  } catch (error) {
    console.error("Gagal mengambil data dari Google Sheets:", error);
  }

  // Oper kedua data ke Client
  return (
    <RiwayatClient
      initialTransactions={transactions}
      initialProducts={products}
    />
  );
}
