import { Product } from "@/types";
import POSClient from "@/components/POSClient";

export default async function Home() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL as string;
  let products: Product[] = [];

  // 🚨 RADAR DEBUGGING: Mencetak URL ke terminal VS Code Kakak 🚨
  console.log("==================================================");
  console.log("1. ISI DARI .env.local :", API_URL);
  console.log("2. URL YANG DIPANGGIL  :", `${API_URL}?data=produk`);
  console.log("==================================================");

  try {
    // Matikan cache sementara agar kita dapat respon paling fresh
    const response = await fetch(`${API_URL}?data=produk`, {
      cache: "no-store",
      redirect: "follow",
    });

    if (response.ok) {
      const textData = await response.text();
      try {
        products = JSON.parse(textData);
        console.log("✅ BERHASIL! Mendapatkan", products.length, "produk.");
      } catch (parseError) {
        console.error(
          "❌ GAGAL BACA JSON. Balasan asli dari Google:",
          textData.substring(0, 150),
        );
      }
    } else {
      console.error(
        "❌ GAGAL TERHUBUNG:",
        response.status,
        response.statusText,
      );
    }
  } catch (error) {
    console.error("❌ KESALAHAN FATAL:", error);
  }

  return (
    <main className="h-screen bg-white dark:bg-black text-gray-900 dark:text-gray-100 overflow-hidden">
      <POSClient initialProducts={products} />
    </main>
  );
}
