"use server";

import { revalidatePath } from "next/cache";

export async function refreshAllData() {
  // Ini akan menghancurkan cache lama dan me-refresh seluruh rute aplikasi
  revalidatePath("/", "layout");
}
