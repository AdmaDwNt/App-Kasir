// src/app/produk/ProdukClient.tsx
"use client";

import { useState } from "react";
import { useProducts } from "@/hooks/useProducts";
import { api } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { Produk } from "@/types";

export default function ProdukClient() {
  const queryClient = useQueryClient();
  const { data: products, isLoading, isError } = useProducts();

  // STATE PENCARIAN & FILTER
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Semua");

  // STATE MODAL & FORM
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isPecahModalOpen, setIsPecahModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // STATE DATA FORM PRODUK
  const initialFormState = {
    ID_Produk: "",
    Nama_Produk: "",
    Kategori: "",
    Satuan: "",
    Harga_Modal: 0,
    Harga_Jual: 0,
    Stok_Awal: 0,
    Stok_Minimal: 0,
    Foto: "",
  };
  const [formData, setFormData] = useState<any>(initialFormState);

  // STATE DATA PECAH RENTENG
  const [pecahData, setPecahData] = useState({
    Parent_ID: "",
    ID_Produk: "",
    Jumlah_Konversi: 0,
  });

  // --- FILTERING LOGIC ---
  const categories = [
    "Semua",
    ...Array.from(new Set(products?.map((p) => p.Kategori) || [])),
  ];
  const filteredProducts = products?.filter((p) => {
    const matchSearch =
      p.Nama_Produk.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.ID_Produk.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCat =
      selectedCategory === "Semua" || p.Kategori === selectedCategory;
    return matchSearch && matchCat;
  });

  const openFormModal = (produk?: Produk) => {
    if (produk) {
      setFormData(produk);
      setEditingId(produk.ID_Produk);
    } else {
      setFormData({
        ...initialFormState,
        ID_Produk: `P${Date.now().toString().slice(-4)}`,
      });
      setEditingId(null);
    }
    setIsFormModalOpen(true);
  };

  // --- FITUR BARU: AUTO-COMPRESS GAMBAR & UPLOAD ---
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        // KITA KECILKAN MAX LEBAR 300px AGAR MUAT DI GOOGLE SHEET
        const MAX_WIDTH = 300;
        const scaleSize = MAX_WIDTH / img.width;
        canvas.width = MAX_WIDTH;
        canvas.height = img.height * scaleSize;

        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);

        // Kompresi kualitas JPG menjadi 60%
        const base64String = canvas.toDataURL("image/jpeg", 0.6);
        setFormData({ ...formData, Foto: base64String });
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    const toastId = toast.loading(
      editingId ? "Menyimpan perubahan..." : "Menambahkan produk...",
    );

    try {
      const payload = {
        action: editingId ? "edit_produk" : "tambah_produk",
        ...formData,
      };

      const response = await api.post(payload);
      if (response.error) throw new Error(response.message);

      await queryClient.invalidateQueries({ queryKey: ["produk"] });
      toast.success(editingId ? "Produk diperbarui!" : "Produk ditambahkan!", {
        id: toastId,
      });
      setIsFormModalOpen(false);
    } catch (error: any) {
      toast.error(error.message || "Gagal menyimpan data.", { id: toastId });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async (id: string, nama: string) => {
    if (!confirm(`Hapus produk ${nama}? Data tidak bisa dikembalikan.`)) return;

    const toastId = toast.loading("Menghapus produk...");
    try {
      const response = await api.post({
        action: "hapus_produk",
        ID_Produk: id,
      });
      if (response.error) throw new Error(response.message);

      await queryClient.invalidateQueries({ queryKey: ["produk"] });
      toast.success("Produk dihapus!", { id: toastId });
    } catch (error: any) {
      toast.error(error.message || "Gagal menghapus produk.", { id: toastId });
    }
  };

  const handlePecahRenteng = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    const toastId = toast.loading("Memproses konversi stok...");

    try {
      const payload = {
        action: "pecah_renteng",
        Parent_ID: pecahData.Parent_ID,
        ID_Produk: pecahData.ID_Produk,
        Jumlah_Konversi: Number(pecahData.Jumlah_Konversi),
      };

      const response = await api.post(payload);
      if (response.error) throw new Error(response.message);

      await queryClient.invalidateQueries({ queryKey: ["produk"] });
      toast.success("Pecah renteng berhasil!", { id: toastId });
      setIsPecahModalOpen(false);
      setPecahData({ Parent_ID: "", ID_Produk: "", Jumlah_Konversi: 0 });
    } catch (error: any) {
      toast.error(error.message || "Gagal memecah renteng.", { id: toastId });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="p-6 h-[calc(100vh-2rem)] flex flex-col bg-slate-50">
      <div className="flex justify-between items-center mb-6 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-black text-slate-800">Master Produk</h1>
          <p className="text-sm text-slate-500 font-medium">
            Kelola data barang, harga, dan stok
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setIsPecahModalOpen(true)}
            className="px-4 py-2.5 bg-amber-50 text-amber-600 border border-amber-200 rounded-xl font-bold hover:bg-amber-100 transition-colors flex items-center gap-2"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Pecah Renteng
          </button>
          <button
            onClick={() => openFormModal()}
            className="px-4 py-2.5 bg-blue-600 text-white rounded-xl font-bold shadow-md shadow-blue-600/30 hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Tambah Produk
          </button>
        </div>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="relative flex-1 bg-white p-2 rounded-2xl shadow-sm border border-slate-100 flex items-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 ml-3 text-slate-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            placeholder="Cari ID atau nama produk..."
            className="w-full border-none bg-transparent pl-3 pr-4 py-2 focus:outline-none text-slate-700 font-medium"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <select
          className="bg-white border border-slate-200 py-2 px-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-700 shadow-sm min-w-[200px]"
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div className="flex-1 overflow-hidden bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col">
        <div className="overflow-y-auto custom-scrollbar flex-1">
          {isLoading ? (
            <div className="flex justify-center items-center h-full text-slate-400">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
              Memuat data...
            </div>
          ) : isError ? (
            <div className="flex justify-center items-center h-full text-red-500">
              Gagal memuat data produk.
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 sticky top-0 z-10 border-b border-slate-200">
                <tr>
                  <th className="p-4 font-bold text-slate-600 text-sm">
                    Info Produk
                  </th>
                  <th className="p-4 font-bold text-slate-600 text-sm">
                    Kategori
                  </th>
                  <th className="p-4 font-bold text-slate-600 text-sm text-right">
                    Harga Modal
                  </th>
                  <th className="p-4 font-bold text-slate-600 text-sm text-right">
                    Harga Jual
                  </th>
                  <th className="p-4 font-bold text-slate-600 text-sm text-center">
                    Stok
                  </th>
                  <th className="p-4 font-bold text-slate-600 text-sm text-center">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts?.map((p) => (
                  <tr
                    key={p.ID_Produk}
                    className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-slate-200 overflow-hidden flex items-center justify-center text-xs text-slate-400 font-bold shrink-0">
                          {p.Foto ? (
                            <img
                              src={p.Foto}
                              alt={p.Nama_Produk}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            "IMG"
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 text-sm">
                            {p.Nama_Produk}
                          </p>
                          <p className="text-xs text-slate-500 font-mono">
                            {p.ID_Produk}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-sm font-medium text-slate-600">
                      {p.Kategori}
                    </td>
                    <td className="p-4 text-sm font-medium text-slate-600 text-right">
                      Rp {p.Harga_Modal.toLocaleString("id-ID")}
                    </td>
                    <td className="p-4 text-sm font-bold text-blue-600 text-right">
                      Rp {p.Harga_Jual.toLocaleString("id-ID")}
                    </td>
                    <td className="p-4 text-center">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold ${p.Stok_Awal <= p.Stok_Minimal ? "bg-red-100 text-red-600" : "bg-emerald-100 text-emerald-600"}`}
                      >
                        {p.Stok_Awal} {p.Satuan}
                      </span>
                    </td>
                    <td className="p-4 flex justify-center gap-2">
                      <button
                        onClick={() => openFormModal(p)}
                        className="p-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                        title="Edit"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                          />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(p.ID_Produk, p.Nama_Produk)}
                        className="p-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                        title="Hapus"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredProducts?.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="p-8 text-center text-slate-400 font-medium"
                    >
                      Data produk tidak ditemukan.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* MODAL 1: FORM TAMBAH/EDIT PRODUK */}
      {isFormModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-slate-50 border-b border-slate-100 p-4 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800">
                {editingId ? "Edit Produk" : "Tambah Produk Baru"}
              </h3>
              <button
                onClick={() => setIsFormModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmitForm}>
              <div className="p-5 grid grid-cols-2 gap-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
                {/* --- BAGIAN UPLOAD FOTO --- */}
                <div className="col-span-2 mb-2">
                  <label className="block text-xs font-bold text-slate-600 mb-2">
                    Foto Produk (Otomatis Compress)
                  </label>
                  <div className="flex items-center gap-4">
                    {/* Preview Foto */}
                    {formData.Foto ? (
                      <div className="relative w-20 h-20 rounded-xl border border-slate-200 shadow-sm overflow-hidden shrink-0">
                        <img
                          src={formData.Foto}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, Foto: "" })}
                          className="absolute top-0 right-0 bg-red-500 text-white p-1 rounded-bl-lg hover:bg-red-600"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-3 w-3"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={3}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </div>
                    ) : (
                      <div className="w-20 h-20 rounded-xl border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400 shrink-0">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-6 w-6"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                    )}
                    {/* Input File */}
                    <div className="flex-1">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                      />
                      <p className="text-[11px] text-slate-400 mt-1 font-medium">
                        Pilih gambar dari File Explorer. Sistem akan mengecilkan
                        ukurannya agar Google Sheet tidak error.
                      </p>
                    </div>
                  </div>
                </div>

                {/* --- INPUT TEXT LAINNYA --- */}
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    ID Produk
                  </label>
                  <input
                    required
                    type="text"
                    className="w-full border-2 border-slate-200 rounded-xl px-3 py-2 focus:border-blue-500 outline-none font-medium text-slate-800 bg-slate-50"
                    value={formData.ID_Produk}
                    onChange={(e) =>
                      setFormData({ ...formData, ID_Produk: e.target.value })
                    }
                    disabled={!!editingId}
                  />
                </div>
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    Nama Produk
                  </label>
                  <input
                    required
                    type="text"
                    className="w-full border-2 border-slate-200 rounded-xl px-3 py-2 focus:border-blue-500 outline-none font-medium text-slate-800"
                    value={formData.Nama_Produk}
                    onChange={(e) =>
                      setFormData({ ...formData, Nama_Produk: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    Kategori
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="Misal: Sembako"
                    className="w-full border-2 border-slate-200 rounded-xl px-3 py-2 focus:border-blue-500 outline-none font-medium text-slate-800"
                    value={formData.Kategori}
                    onChange={(e) =>
                      setFormData({ ...formData, Kategori: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    Satuan
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="Misal: Pcs, Kg"
                    className="w-full border-2 border-slate-200 rounded-xl px-3 py-2 focus:border-blue-500 outline-none font-medium text-slate-800"
                    value={formData.Satuan}
                    onChange={(e) =>
                      setFormData({ ...formData, Satuan: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    Harga Modal
                  </label>
                  <input
                    required
                    type="number"
                    className="w-full border-2 border-slate-200 rounded-xl px-3 py-2 focus:border-blue-500 outline-none font-medium text-slate-800"
                    value={formData.Harga_Modal}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        Harga_Modal: Number(e.target.value),
                      })
                    }
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    Harga Jual
                  </label>
                  <input
                    required
                    type="number"
                    className="w-full border-2 border-slate-200 rounded-xl px-3 py-2 focus:border-blue-500 outline-none font-medium text-slate-800"
                    value={formData.Harga_Jual}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        Harga_Jual: Number(e.target.value),
                      })
                    }
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    Stok Saat Ini
                  </label>
                  <input
                    required
                    type="number"
                    className="w-full border-2 border-slate-200 rounded-xl px-3 py-2 focus:border-blue-500 outline-none font-medium text-slate-800"
                    value={formData.Stok_Awal}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        Stok_Awal: Number(e.target.value),
                      })
                    }
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    Batas Stok Minimal (Alert)
                  </label>
                  <input
                    required
                    type="number"
                    className="w-full border-2 border-slate-200 rounded-xl px-3 py-2 focus:border-blue-500 outline-none font-medium text-slate-800"
                    value={formData.Stok_Minimal}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        Stok_Minimal: Number(e.target.value),
                      })
                    }
                  />
                </div>
              </div>
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-200 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="px-5 py-2.5 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {isProcessing ? "Menyimpan..." : "Simpan Produk"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: PECAH RENTENG */}
      {isPecahModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-amber-50 border-b border-amber-100 p-4 flex justify-between items-center">
              <h3 className="text-lg font-bold text-amber-800 flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M8 5a1 1 0 100 2h5.586l-1.293 1.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L13.586 5H8zM12 15a1 1 0 100-2H6.414l1.293-1.293a1 1 0 10-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L6.414 15H12z" />
                </svg>
                Pecah Renteng
              </h3>
              <button
                onClick={() => setIsPecahModalOpen(false)}
                className="text-amber-600 hover:text-amber-800"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <form onSubmit={handlePecahRenteng}>
              <div className="p-5 space-y-4">
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 text-xs text-blue-700 font-medium">
                  Fitur ini akan mengurangi{" "}
                  <strong>1 Stok Induk (Grosir)</strong> dan menambahkan stok
                  hasil eceran ke produk tujuan.
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    Pilih Produk Induk (Yang akan dikurangi 1)
                  </label>
                  <select
                    required
                    className="w-full border-2 border-slate-200 rounded-xl px-3 py-2.5 focus:border-amber-500 outline-none font-bold text-slate-800"
                    value={pecahData.Parent_ID}
                    onChange={(e) =>
                      setPecahData({ ...pecahData, Parent_ID: e.target.value })
                    }
                  >
                    <option value="" disabled>
                      -- Pilih Produk Grosir/Renteng --
                    </option>
                    {products?.map((p) => (
                      <option key={p.ID_Produk} value={p.ID_Produk}>
                        {p.Nama_Produk} (Sisa: {p.Stok_Awal})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-center my-2">
                  <div className="bg-slate-100 p-2 rounded-full text-slate-400">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 14l-7 7m0 0l-7-7m7 7V3"
                      />
                    </svg>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    Pilih Produk Eceran (Yang akan ditambah)
                  </label>
                  <select
                    required
                    className="w-full border-2 border-slate-200 rounded-xl px-3 py-2.5 focus:border-amber-500 outline-none font-bold text-slate-800"
                    value={pecahData.ID_Produk}
                    onChange={(e) =>
                      setPecahData({ ...pecahData, ID_Produk: e.target.value })
                    }
                  >
                    <option value="" disabled>
                      -- Pilih Produk Ecer/Pcs --
                    </option>
                    {products?.map((p) => (
                      <option key={p.ID_Produk} value={p.ID_Produk}>
                        {p.Nama_Produk} (Sisa: {p.Stok_Awal})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    Berapa isinya per 1 Induk?
                  </label>
                  <div className="relative">
                    <input
                      required
                      type="number"
                      min="1"
                      className="w-full border-2 border-slate-200 rounded-xl pl-4 pr-12 py-2.5 focus:border-amber-500 outline-none font-bold text-xl text-slate-800"
                      value={pecahData.Jumlah_Konversi || ""}
                      onChange={(e) =>
                        setPecahData({
                          ...pecahData,
                          Jumlah_Konversi: Number(e.target.value),
                        })
                      }
                      placeholder="Misal: 12"
                    />
                    <span className="absolute right-4 top-3 text-slate-400 font-bold">
                      Pcs
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsPecahModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-200 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="px-5 py-2.5 rounded-xl font-bold text-white bg-amber-500 hover:bg-amber-600 shadow-md shadow-amber-500/30 transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {isProcessing ? "Memproses..." : "Konversi Sekarang"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
