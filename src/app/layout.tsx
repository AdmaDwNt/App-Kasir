// src/app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import QueryProvider from "@/components/QueryProvider";
import { Toaster } from "react-hot-toast";
import Sidebar from "@/components/Sidebar"; // KITA IMPORT SIDEBAR DI SINI

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "POSPro - Sistem Kasir UMKM",
  description: "Point of Sale Modern dan Cepat",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className={inter.className}>
        <QueryProvider>
          {/* KONTAINER UTAMA: Membagi layar jadi 2 kolom (Sidebar Kiri & Konten Kanan) */}
          <div className="flex h-screen w-full bg-slate-50 overflow-hidden">
            {/* Memanggil Komponen Sidebar */}
            <Sidebar />

            {/* Area Konten Dinamis (Halaman POS, Produk, dll akan masuk ke sini) */}
            <main className="flex-1 overflow-x-hidden overflow-y-auto">
              {children}
            </main>
          </div>

          <Toaster
            position="top-center"
            toastOptions={{
              duration: 3000,
              style: { borderRadius: "12px", fontWeight: "600" },
            }}
          />
        </QueryProvider>
      </body>
    </html>
  );
}
