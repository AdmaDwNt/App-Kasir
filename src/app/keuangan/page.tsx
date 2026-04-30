import { Transaction, Product } from "@/types";
import KeuanganClient from "./KeuanganClient";

export default async function Keuangan() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL as string;
  let transactions: Transaction[] = [];
  let products: Product[] = [];
  let kasData: any[] = [];

  try {
    const [resTx, resProd, resKas] = await Promise.all([
      fetch(`${API_URL}?data=transaksi`, {
        cache: "force-cache",
        next: { tags: ["transactions"] },
      }),
      fetch(`${API_URL}?data=produk`, {
        cache: "force-cache",
        next: { tags: ["products"] },
      }),
      fetch(`${API_URL}?data=kas`, {
        cache: "force-cache",
        next: { tags: ["kas"] },
      }),
    ]);

    if (resTx.ok) transactions = await resTx.json();
    if (resProd.ok) products = await resProd.json();
    if (resKas.ok) kasData = await resKas.json();
  } catch (error) {
    console.error("Gagal mengambil data keuangan:", error);
  }

  return (
    <KeuanganClient
      initialTransactions={transactions}
      initialProducts={products}
      initialKas={kasData}
    />
  );
}
