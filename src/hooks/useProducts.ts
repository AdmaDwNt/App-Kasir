import { useQuery } from "@tanstack/react-query";
import { gasFetch } from "@/lib/api";
import { Produk } from "@/types";

export const useProducts = () => {
  return useQuery({
    queryKey: ["produk"], // Kunci cache untuk React Query
    queryFn: async () => {
      try {
        const res = await gasFetch<any>("?data=produk");
        // Defensive programming: Tangani response array langsung maupun response dengan properti 'data'
        if (Array.isArray(res)) {
          return res as Produk[];
        }
        return (res?.data as Produk[]) || [];
      } catch (error) {
        console.error("Gagal mengambil data produk dari GAS:", error);
        throw error;
      }
    },
  });
};
