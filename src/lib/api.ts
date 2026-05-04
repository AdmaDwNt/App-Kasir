// src/lib/api.ts
import { ApiResponse } from "@/types";

const GAS_URL = process.env.NEXT_PUBLIC_GAS_URL;

export const api = {
  get: async <T>(dataParam: string): Promise<T[]> => {
    if (!GAS_URL) throw new Error("NEXT_PUBLIC_GAS_URL belum diset!");
    try {
      const res = await fetch(`${GAS_URL}?data=${dataParam}`, {
        cache: "no-store",
        redirect: "follow", // Wajib untuk melewati sistem keamanan Google
      });

      const textData = await res.text();

      // === 🚨 RADAR DEBUGGING KHUSUS 🚨 ===
      // Ini akan mencetak teks mentah dari Google ke Console Browser
      console.log(
        `[🔍 RAW DATA ${dataParam.toUpperCase()}]`,
        textData.substring(0, 200),
      );

      let json;
      try {
        json = JSON.parse(textData);
        // Menangani kasus "Double Stringify" khas Google Apps Script
        if (typeof json === "string") {
          json = JSON.parse(json);
        }
      } catch (e) {
        console.error(`❌ Data ${dataParam} bukan JSON valid:`, textData);
        return [];
      }

      // --- LOGIKA PENCARI ARRAY (SUPER KEBAL PELURU) ---
      if (Array.isArray(json)) return json; // Jika langsung berupa array

      if (json && typeof json === "object") {
        if (json.error === true)
          throw new Error(json.message || "Error dari server");

        // Membabi buta mencari properti apapun yang bentuknya Array
        if (Array.isArray(json.data)) return json.data;
        for (const key in json) {
          if (Array.isArray(json[key])) return json[key];
        }
      }

      console.warn(
        `⚠️ Format JSON ${dataParam} tidak lazim, memaksa kosong:`,
        json,
      );
      return [];
    } catch (error) {
      console.error(`🔥 API GET Error (${dataParam}):`, error);
      return []; // Jangan lempar error agar layar tidak blank putih
    }
  },

  post: async (body: any): Promise<ApiResponse> => {
    if (!GAS_URL) throw new Error("NEXT_PUBLIC_GAS_URL belum diset!");
    try {
      const res = await fetch(GAS_URL, {
        method: "POST",
        redirect: "follow",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(body),
      });

      const textData = await res.text();
      let json;
      try {
        json = JSON.parse(textData);
        if (typeof json === "string") json = JSON.parse(json);
      } catch (e) {
        return {
          error: false,
          message: "Berhasil (tanpa balasan JSON)",
          data: textData,
        };
      }

      return json;
    } catch (error: any) {
      console.error("API POST Error:", error);
      return {
        error: true,
        message: error.message || "Gagal menghubungi server.",
      };
    }
  },
};
