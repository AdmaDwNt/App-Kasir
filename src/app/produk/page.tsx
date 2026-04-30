import { Product } from "@/types";
import ProdukClient from "./ProdukClient";

export default async function KelolaProduk() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL as string;
  let products: Product[] = [];

  try {
    // 🚀 AGGRESSIVE SERVER & CDN CACHING
    // Fitur sakti Next.js: Data ini ditarik saat pertama kali di-build/direquest,
    // lalu disimpan selamanya di memori sampai kita panggil revalidateTag("products").
    const res = await fetch(API_URL, {
      cache: "force-cache",
      next: { tags: ["products"] },
    });

    if (res.ok) {
      products = await res.json();
    }
  } catch (error) {
    console.error("Gagal mengambil data dari Google Sheets:", error);
  }

  // Oper data mentah ke Client Component yang merender tabel tanpa loading!
  return <ProdukClient initialProducts={products} />;
}
