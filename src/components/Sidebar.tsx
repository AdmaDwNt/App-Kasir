"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Calculator,
  PackagePlus,
  History,
  Store,
  Sun,
  Moon,
  WalletCards,
  Wallet,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export default function Sidebar() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const menuItems = [
    { name: "Kasir", icon: Calculator, path: "/" },
    { name: "Kelola Produk", icon: PackagePlus, path: "/produk" },
    { name: "Riwayat", icon: History, path: "/riwayat" },
    { name: "Keuangan", icon: Wallet, path: "/keuangan" },
    { name: "Backoffice", icon: WalletCards, path: "/backoffice" }, // Ini yang baru
  ];

  return (
    // Tambahkan scrollbar-hide di container utama aside
    <aside className="w-20 lg:w-64 bg-gray-900 dark:bg-black text-white h-screen flex flex-col transition-all duration-300 z-50 shrink-0 scrollbar-hide">
      <div className="h-20 flex items-center justify-center lg:justify-start lg:px-8 border-b border-gray-800 shrink-0">
        <Store className="text-white lg:mr-3" size={28} />
        <h1 className="text-xl font-bold tracking-wider hidden lg:block">
          WARUNG
        </h1>
      </div>

      {/* Tambahkan overflow-y-auto dan scrollbar-hide di area navigasi */}
      <nav className="flex-1 py-8 flex flex-col gap-2 px-3 lg:px-4 overflow-y-auto scrollbar-hide">
        {menuItems.map((item) => {
          const isActive = pathname === item.path;
          return (
            <Link
              key={item.path}
              href={item.path}
              prefetch={true}
              className={`flex items-center justify-center lg:justify-start gap-4 px-3 lg:px-4 py-3.5 rounded-xl transition-all duration-200 group shrink-0 ${
                isActive
                  ? "bg-white/10 text-white shadow-lg backdrop-blur-sm"
                  : "text-gray-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              <item.icon
                size={22}
                className={
                  isActive
                    ? "text-white"
                    : "group-hover:text-white transition-colors"
                }
              />
              <span
                className={`font-semibold hidden lg:block ${isActive ? "text-white" : ""}`}
              >
                {item.name}
              </span>
            </Link>
          );
        })}
      </nav>

      {mounted && (
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="mt-auto m-4 p-3 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-all flex items-center justify-center lg:justify-start gap-3 shrink-0"
        >
          {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
          <span className="hidden lg:block text-sm font-medium">
            Ganti Mode
          </span>
        </button>
      )}
    </aside>
  );
}
