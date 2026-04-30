"use client";

import { useState, useMemo } from "react";
import { Product } from "@/types";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  X,
  Filter,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  UploadCloud,
  Link as LinkIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { refreshAllData } from "@/app/actions";

export default function ProdukClient({
  initialProducts,
}: {
  initialProducts: Product[];
}) {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<Partial<Product>>({});

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const router = useRouter();

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const categories = useMemo(() => {
    const cats = initialProducts.map((p) => p.Kategori).filter(Boolean);
    return Array.from(new Set(cats));
  }, [initialProducts]);

  const filtered = initialProducts.filter((p) => {
    const matchSearch =
      p.Nama_Produk?.toLowerCase().includes(search.toLowerCase()) ||
      p.ID_Produk?.toLowerCase().includes(search.toLowerCase());
    const matchCategory = categoryFilter ? p.Kategori === categoryFilter : true;
    const matchMin = minPrice ? p.Harga_Jual >= Number(minPrice) : true;
    const matchMax = maxPrice ? p.Harga_Jual <= Number(maxPrice) : true;
    return matchSearch && matchCategory && matchMin && matchMax;
  });

  const confirmDelete = (id: string) => setDeleteId(id);

  const executeDelete = async () => {
    if (!deleteId) return;
    try {
      await fetch(process.env.NEXT_PUBLIC_API_URL as string, {
        method: "POST",
        mode: "no-cors",
        body: JSON.stringify({ action: "hapus_produk", ID_Produk: deleteId }),
      });
      await refreshAllData();
      router.refresh();
      showToast("Produk berhasil dihapus!", "success");
    } catch (e) {
      showToast("Gagal menghapus data produk.", "error");
    }
    setDeleteId(null);
  };

  const openAddModal = () => {
    setFormData({});
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setFormData(product);
    setIsEditing(true);
    setIsModalOpen(true);
  };

  // FUNGSI KOMPRESI FOTO (Canvas API -> Base64)
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 150; // Dikecilkan agar muat di Google Sheets (Max 50rb karakter)
        const scaleSize = MAX_WIDTH / img.width;
        canvas.width = MAX_WIDTH;
        canvas.height = img.height * scaleSize;

        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);

        const dataUrl = canvas.toDataURL("image/jpeg", 0.6); // Kualitas 60%
        setFormData({ ...formData, Foto: dataUrl });
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await fetch(process.env.NEXT_PUBLIC_API_URL as string, {
        method: "POST",
        mode: "no-cors",
        body: JSON.stringify({
          action: isEditing ? "edit_produk" : "tambah_produk",
          ...formData,
        }),
      });
      await refreshAllData();
      setIsModalOpen(false);
      setFormData({});
      router.refresh();
      showToast(
        isEditing ? "Data diperbarui!" : "Produk ditambahkan!",
        "success",
      );
    } catch (e) {
      showToast("Gagal menyimpan ke database.", "error");
    }
    setIsSubmitting(false);
  };

  return (
    <div className="p-4 lg:p-8 max-w-6xl mx-auto h-full overflow-y-auto scrollbar-hide">
      {/* TOAST NOTIFICATION */}
      <div
        className={`fixed top-8 left-1/2 -translate-x-1/2 z-[100] transition-all duration-500 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl border bg-white dark:bg-gray-800 ${toast ? "translate-y-0 opacity-100" : "-translate-y-10 opacity-0 pointer-events-none"} ${toast?.type === "success" ? "border-green-100" : "border-red-100"}`}
      >
        {toast?.type === "success" ? (
          <CheckCircle2 className="text-green-500" size={20} />
        ) : (
          <XCircle className="text-red-500" size={20} />
        )}
        <p className="font-semibold text-sm text-gray-800 dark:text-gray-100">
          {toast?.message}
        </p>
      </div>

      {/* MODAL HAPUS */}
      {deleteId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-gray-900 rounded-3xl w-full max-w-sm p-6 shadow-2xl text-center animate-in zoom-in-95">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="text-red-600" size={32} />
            </div>
            <h3 className="text-xl font-bold mb-2">Hapus Produk?</h3>
            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 py-3 bg-gray-100 dark:bg-gray-800 rounded-xl font-semibold"
              >
                Batal
              </button>
              <button
                onClick={executeDelete}
                className="flex-1 py-3 bg-red-600 text-white rounded-xl font-semibold"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL TAMBAH/EDIT */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <form
            onSubmit={handleSave}
            className="bg-white dark:bg-gray-900 rounded-3xl w-full max-w-md p-6 shadow-2xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto scrollbar-hide"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">
                {isEditing ? "Edit Produk" : "Tambah Produk Baru"}
              </h2>
              <button type="button" onClick={() => setIsModalOpen(false)}>
                <X className="text-gray-400" />
              </button>
            </div>

            <div className="space-y-4">
              {/* AREA UPLOAD FOTO */}
              <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-4 relative overflow-hidden group">
                {formData.Foto ? (
                  <>
                    <img
                      src={formData.Foto}
                      alt="Preview"
                      className="h-32 object-contain"
                    />
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-white text-xs font-bold">
                        Ganti Foto
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="text-center">
                    <UploadCloud
                      className="mx-auto text-gray-400 mb-2"
                      size={32}
                    />
                    <span className="text-sm text-gray-500 font-medium">
                      Upload Foto Produk
                    </span>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>

              {/* DATA UTAMA */}
              <input
                required
                disabled={isEditing}
                placeholder="ID Produk (cth: P008)"
                value={formData.ID_Produk || ""}
                className="w-full p-3 border border-gray-200 dark:border-gray-800 rounded-xl bg-gray-50 dark:bg-gray-950 outline-none disabled:opacity-50"
                onChange={(e) =>
                  setFormData({ ...formData, ID_Produk: e.target.value })
                }
              />
              <input
                required
                placeholder="Nama Produk"
                value={formData.Nama_Produk || ""}
                className="w-full p-3 border border-gray-200 dark:border-gray-800 rounded-xl bg-gray-50 dark:bg-gray-950 outline-none"
                onChange={(e) =>
                  setFormData({ ...formData, Nama_Produk: e.target.value })
                }
              />

              <div className="flex gap-4">
                <input
                  required
                  placeholder="Kategori"
                  value={formData.Kategori || ""}
                  className="w-1/2 p-3 border border-gray-200 rounded-xl bg-gray-50 dark:bg-gray-950 outline-none"
                  onChange={(e) =>
                    setFormData({ ...formData, Kategori: e.target.value })
                  }
                />
                <input
                  required
                  placeholder="Satuan (cth: pcs)"
                  value={formData.Satuan || ""}
                  className="w-1/2 p-3 border border-gray-200 rounded-xl bg-gray-50 dark:bg-gray-950 outline-none"
                  onChange={(e) =>
                    setFormData({ ...formData, Satuan: e.target.value })
                  }
                />
              </div>
              <div className="flex gap-4">
                <input
                  required
                  type="number"
                  placeholder="Harga Modal"
                  value={formData.Harga_Modal || ""}
                  className="w-1/2 p-3 border border-gray-200 rounded-xl bg-gray-50 dark:bg-gray-950 outline-none"
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      Harga_Modal: Number(e.target.value),
                    })
                  }
                />
                <input
                  required
                  type="number"
                  placeholder="Harga Jual"
                  value={formData.Harga_Jual || ""}
                  className="w-1/2 p-3 border border-gray-200 rounded-xl bg-gray-50 dark:bg-gray-950 outline-none"
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      Harga_Jual: Number(e.target.value),
                    })
                  }
                />
              </div>
              <div className="flex gap-4">
                <input
                  required
                  type="number"
                  placeholder="Stok Awal"
                  value={formData.Stok_Awal || ""}
                  className="w-1/2 p-3 border border-gray-200 rounded-xl bg-gray-50 dark:bg-gray-950 outline-none"
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      Stok_Awal: Number(e.target.value),
                    })
                  }
                />
                <input
                  required
                  type="number"
                  placeholder="Stok Min"
                  value={formData.Stok_Minimal || ""}
                  className="w-1/2 p-3 border border-gray-200 rounded-xl bg-gray-50 dark:bg-gray-950 outline-none"
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      Stok_Minimal: Number(e.target.value),
                    })
                  }
                />
              </div>

              {/* AREA PENGATURAN RENTENG */}
              <div className="p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 rounded-xl space-y-3">
                <h3 className="text-xs font-black text-amber-700 dark:text-amber-500 uppercase flex items-center gap-1 mb-2">
                  <LinkIcon size={12} /> Pengaturan Eceran (Opsional)
                </h3>
                <select
                  value={formData.Parent_ID || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, Parent_ID: e.target.value })
                  }
                  className="w-full p-3 border border-amber-200 dark:border-gray-800 rounded-xl bg-white dark:bg-gray-950 outline-none text-sm"
                >
                  <option value="">-- Bukan Barang Eceran --</option>
                  {initialProducts.map((p) => (
                    <option key={p.ID_Produk} value={p.ID_Produk}>
                      {p.ID_Produk} - {p.Nama_Produk}
                    </option>
                  ))}
                </select>
                {formData.Parent_ID && (
                  <input
                    type="number"
                    placeholder="Isi per Renteng (cth: 10)"
                    value={formData.Isi_Per_Parent || ""}
                    className="w-full p-3 border border-amber-200 dark:border-gray-800 rounded-xl bg-white dark:bg-gray-950 outline-none text-sm"
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        Isi_Per_Parent: Number(e.target.value),
                      })
                    }
                  />
                )}
              </div>
            </div>
            <button
              disabled={isSubmitting}
              className="w-full mt-6 bg-gray-900 dark:bg-white text-white dark:text-black p-4 rounded-xl font-bold hover:opacity-90 transition-all"
            >
              {isSubmitting
                ? "Memproses..."
                : isEditing
                  ? "Update Data"
                  : "Simpan Produk"}
            </button>
          </form>
        </div>
      )}

      {/* HEADER & FILTER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <h1 className="text-3xl font-bold">Master Produk</h1>
        <button
          onClick={openAddModal}
          className="w-full sm:w-auto bg-gray-900 dark:bg-white text-white dark:text-black px-5 py-2.5 rounded-xl flex items-center justify-center gap-2 font-bold shadow-lg transition-transform"
        >
          <Plus size={20} /> Tambah Baru
        </button>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6">
        <div className="p-4 border-b border-gray-100 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Cari ID / Nama..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800 rounded-xl outline-none"
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="relative">
            <Filter
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
            <select
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800 rounded-xl outline-none appearance-none"
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="">Semua Kategori</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <input
            type="number"
            placeholder="Harga Min (Rp)"
            className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 rounded-xl outline-none"
            onChange={(e) => setMinPrice(e.target.value)}
          />
          <input
            type="number"
            placeholder="Harga Max (Rp)"
            className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 rounded-xl outline-none"
            onChange={(e) => setMaxPrice(e.target.value)}
          />
        </div>

        <div className="overflow-x-auto scrollbar-hide">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 text-sm uppercase">
                <th className="p-5 font-semibold">ID</th>
                <th className="p-5 font-semibold">Nama Produk</th>
                <th className="p-5 font-semibold">Kategori</th>
                <th className="p-5 font-semibold">Stok</th>
                <th className="p-5 font-semibold">Harga Jual</th>
                <th className="p-5 font-semibold text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {filtered.map((p) => (
                <tr
                  key={p.ID_Produk}
                  className="hover:bg-gray-50 dark:hover:bg-gray-800/30"
                >
                  <td className="p-5 font-mono text-xs">{p.ID_Produk}</td>
                  <td className="p-5 font-bold flex items-center gap-3">
                    {p.Foto && (
                      <img
                        src={p.Foto}
                        alt="img"
                        className="w-8 h-8 rounded-md object-cover bg-white"
                      />
                    )}
                    <div>
                      {p.Nama_Produk}
                      {p.Parent_ID && (
                        <span className="block text-[10px] text-amber-600 font-mono">
                          Eceran dari: {p.Parent_ID}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-5">
                    <span className="bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-lg text-sm">
                      {p.Kategori}
                    </span>
                  </td>
                  <td className="p-5">
                    {p.Stok_Awal}{" "}
                    <span className="text-gray-400 text-xs">{p.Satuan}</span>
                  </td>
                  <td className="p-5 font-bold text-green-600">
                    Rp {(p.Harga_Jual || 0).toLocaleString("id-ID")}
                  </td>
                  <td className="p-5 flex justify-center gap-2">
                    <button
                      onClick={() => openEditModal(p)}
                      className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg"
                    >
                      <Pencil size={18} />
                    </button>
                    <button
                      onClick={() => confirmDelete(p.ID_Produk)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
