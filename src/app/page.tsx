// src/app/page.tsx
import POSClient from "@/components/POSClient";

export default function Home() {
  return (
    <main className="h-screen bg-slate-50 text-slate-900 overflow-hidden">
      {/* Panggil komponen tanpa props apa-apa! */}
      <POSClient />
    </main>
  );
}
