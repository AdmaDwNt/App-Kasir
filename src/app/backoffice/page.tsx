import { Product, Kas } from "@/types";
import BackofficeClient from "./BackofficeClient";

export default async function Backoffice() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL as string;
  let products: Product[] = [];
  let kasData: Kas[] = [];

  try {
    // Tarik data Produk (untuk dropdown kulakan) dan data Kas secara bersamaan
    const [resProd, resKas] = await Promise.all([
      fetch(`${API_URL}?data=produk`, {
        cache: "force-cache",
        next: { tags: ["products"] },
      }),
      fetch(`${API_URL}?data=kas`, {
        cache: "force-cache",
        next: { tags: ["kas"] },
      }),
    ]);

    if (resProd.ok) products = await resProd.json();
    if (resKas.ok) kasData = await resKas.json();
  } catch (error) {
    console.error("Fetch error:", error);
  }

  return <BackofficeClient initialProducts={products} initialKas={kasData} />;
}
