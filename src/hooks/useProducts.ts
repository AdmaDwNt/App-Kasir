import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Produk } from "@/types";

export const useProducts = () => {
  return useQuery({
    queryKey: ["produk"], // Kunci cache untuk React Query
    queryFn: () => api.get<Produk>("produk"), // Memanggil utilitas api.ts kita
  });
};
