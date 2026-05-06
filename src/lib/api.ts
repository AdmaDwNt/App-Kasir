// src/lib/api.ts
import { ApiResponse } from "@/types";

export async function gasFetch<T = any>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
  const GAS_URL = process.env.NEXT_PUBLIC_GAS_API_URL;
  
  if (!GAS_URL) {
    throw new Error("NEXT_PUBLIC_GAS_API_URL environment variable belum diset di .env.local!");
  }

  // Menyusun URL (Endpoint bisa berupa query string seperti "?action=getProduk")
  // Atau menggunakan string kosong jika endpoint tidak diisi
  let url = GAS_URL;
  if (endpoint) {
    url = endpoint.startsWith('?') || endpoint.startsWith('&') 
      ? `${GAS_URL}${endpoint}` 
      : `${GAS_URL}?endpoint=${endpoint}`;
  }

  // Menggabungkan options bawaan dengan requirement khusus GAS
  const fetchOptions: RequestInit = {
    ...options,
    redirect: "follow", // Wajib untuk melewati sistem redirect keamanan Google
    headers: {
      "Content-Type": "text/plain;charset=utf-8", // Sangat penting: Hindari CORS preflight OPTIONS
      ...(options?.headers || {}),
    },
  };

  try {
    const response = await fetch(url, fetchOptions);

    // Error handling spesifik HTTP response
    if (!response.ok) {
      throw new Error(`Gagal menghubungi server GAS. HTTP Status: ${response.status} ${response.statusText}`);
    }

    const textData = await response.text();
    let jsonData;

    try {
      jsonData = JSON.parse(textData);
      
      // Menangani kasus "Double Stringify" yang sering terjadi di Google Apps Script
      if (typeof jsonData === "string") {
        jsonData = JSON.parse(jsonData);
      }
    } catch (parseError) {
      throw new Error(`Response dari GAS bukan format JSON yang valid. Raw text: ${textData.substring(0, 150)}...`);
    }

    // Validasi response berdasarkan standar ApiResponse
    if (jsonData?.status === "error") {
      throw new Error(jsonData.message || "Terjadi kesalahan logika pada server GAS.");
    }

    console.log("Raw GAS Response:", jsonData);

    return jsonData as ApiResponse<T>;
    
  } catch (error: any) {
    console.error(`🔥 gasFetch Error [${endpoint}]:`, error);
    throw error; // Lempar error agar bisa ditangani (catch) oleh komponen/React Query
  }
}
