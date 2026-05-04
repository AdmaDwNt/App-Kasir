// src/components/Sidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Sidebar() {
  const pathname = usePathname();

  // Daftar Menu sesuai rancangan Anda
  const menuItems = [
    {
      name: "POS Kasir",
      path: "/",
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
        />
      ),
    },
    {
      name: "Dashboard",
      path: "/backoffice",
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
        />
      ),
    },
    {
      name: "Master Produk",
      path: "/produk",
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
        />
      ),
    },
    {
      name: "Riwayat Transaksi",
      path: "/riwayat",
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
        />
      ),
    },
    {
      name: "Keuangan & Kas",
      path: "/keuangan",
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      ),
    },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shrink-0 h-screen hidden md:flex">
      {/* Brand Logo Area */}
      <div className="h-16 flex items-center px-6 border-b border-slate-100">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3 shadow-md shadow-blue-600/30">
          <span className="text-white font-black text-xl leading-none">P</span>
        </div>
        <span className="text-xl font-black text-slate-800 tracking-tight">
          POSPro
        </span>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
        <p className="px-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
          Menu Utama
        </p>

        {menuItems.map((item) => {
          const isActive = pathname === item.path;
          return (
            <Link
              key={item.path}
              href={item.path}
              prefetch={true} // Meload halaman di background sebelum diklik (Best Practice Next.js)
              className={`flex items-center px-3 py-3 rounded-xl font-bold transition-all duration-200 ${
                isActive
                  ? "bg-blue-50 text-blue-600"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
              }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={`h-5 w-5 mr-3 ${isActive ? "text-blue-600" : "text-slate-400"}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {item.icon}
              </svg>
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Profil/Pengaturan di Bawah */}
      <div className="p-4 border-t border-slate-100">
        <button className="flex items-center w-full px-3 py-2 rounded-xl hover:bg-slate-50 transition-colors">
          <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold mr-3">
            A
          </div>
          <div className="text-left">
            <p className="text-sm font-bold text-slate-800">Admin</p>
            <p className="text-xs font-medium text-slate-500">Toko Utama</p>
          </div>
        </button>
      </div>
    </aside>
  );
}
