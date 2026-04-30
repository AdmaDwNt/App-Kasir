"use server";

import { revalidateTag } from "next/cache";

export async function refreshAllData() {
  // Ini akan menghancurkan cache lama dan memaksa Next.js menarik data baru di background
  revalidateTag("products");
  revalidateTag("transactions");
  revalidateTag("kas"); // Tambahkan baris ini
}
