"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export default function QueryProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // Menggunakan useState agar QueryClient tidak dirender ulang setiap kali React me-render komponen
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 5, // Data dianggap "fresh" selama 5 menit (Cahcing agresif)
            refetchOnWindowFocus: true, // Otomatis refresh data saat user kembali membuka tab browser
            retry: 1, // Jika gagal fetch ke GAS, coba 1 kali lagi
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
