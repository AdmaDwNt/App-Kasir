"use client";

import { useState, useMemo, useEffect } from "react";
import { Product, CartItem } from "@/types";
import ProductCard from "@/components/ProductCard";
import Cart from "@/components/Cart";
import {
  Search,
  CheckCircle2,
  XCircle,
  Wallet,
  Loader2,
  Printer,
  MessageCircle,
  Check,
  Scissors,
} from "lucide-react";

export default function POSClient({
  initialProducts,
}: {
  initialProducts: Product[];
}) {
  const [products] = useState<Product[]>(initialProducts);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [heldCart, setHeldCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Semua");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [cashInput, setCashInput] = useState<string>("");

  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [lastTransaction, setLastTransaction] = useState<CartItem[]>([]);
  const [lastTotal, setLastTotal] = useState(0);
  const [lastCash, setLastCash] = useState(0);
  const [lastId, setLastId] = useState("");

  const [isSplitModalOpen, setIsSplitModalOpen] = useState(false);
  const [selectedSplitProduct, setSelectedSplitProduct] =
    useState<Product | null>(null);
  const [customQty, setCustomQty] = useState("");

  useEffect(() => {
    const savedCart = localStorage.getItem("warungCart");
    const savedHeld = localStorage.getItem("warungHeldCart");
    if (savedCart) setCart(JSON.parse(savedCart));
    if (savedHeld) setHeldCart(JSON.parse(savedHeld));
  }, []);

  useEffect(() => {
    localStorage.setItem("warungCart", JSON.stringify(cart));
    localStorage.setItem("warungHeldCart", JSON.stringify(heldCart));
  }, [cart, heldCart]);

  const categories = useMemo(
    () => [
      "Semua",
      ...Array.from(new Set(products.map((p) => p.Kategori).filter(Boolean))),
    ],
    [products],
  );

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchSearch = p.Nama_Produk?.toLowerCase().includes(
        searchQuery.toLowerCase(),
      );
      const matchCategory =
        selectedCategory === "Semua" || p.Kategori === selectedCategory;
      return matchSearch && matchCategory;
    });
  }, [products, searchQuery, selectedCategory]);

  const showToast = (
    message: string,
    type: "success" | "error" = "success",
  ) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleAddToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find(
        (item) => item.ID_Produk === product.ID_Produk,
      );
      if (existing)
        return prev.map((item) =>
          item.ID_Produk === product.ID_Produk
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart((prev) =>
      prev.map((item) =>
        item.ID_Produk === id
          ? { ...item, quantity: Math.max(1, item.quantity + delta) }
          : item,
      ),
    );
  };

  const removeItem = (id: string) =>
    setCart((prev) => prev.filter((item) => item.ID_Produk !== id));

  const handleHoldOrder = () => {
    if (cart.length === 0) return;
    setHeldCart(cart);
    setCart([]);
    showToast("Pesanan disimpan sementara", "success");
  };

  const handleResumeOrder = () => {
    if (heldCart.length === 0) return;
    setCart(heldCart);
    setHeldCart([]);
    showToast("Pesanan dilanjutkan", "success");
  };

  const totalTagihan = cart.reduce(
    (total, item) => total + item.Harga_Jual * item.quantity,
    0,
  );

  const kembalian =
    parseInt(cashInput.replace(/\D/g, "") || "0") - totalTagihan;

  const handleFormatRupiah = (val: string) => {
    const numberString = val.replace(/\D/g, "");
    setCashInput(
      numberString ? parseInt(numberString).toLocaleString("id-ID") : "",
    );
  };

  const submitTransaction = async () => {
    if (kembalian < 0) return showToast("Uang pembeli kurang!", "error");
    setIsSubmitting(true);

    const now = new Date();
    const datePart = now.toISOString().slice(2, 10).replace(/-/g, "");
    const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
    const trxId = `TRX-${datePart}-${randomPart}`;

    try {
      await fetch(process.env.NEXT_PUBLIC_API_URL as string, {
        method: "POST",
        mode: "no-cors",
        body: JSON.stringify({
          action: "transaksi_kasir",
          ID_Transaksi: trxId,
          cart: cart.map((item) => ({
            ID_Produk: item.ID_Produk,
            Jumlah_Beli: item.quantity,
            Total_Harga: item.Harga_Jual * item.quantity,
          })),
        }),
      });

      const { refreshAllData } = await import("@/app/actions");
      await refreshAllData();

      setLastTransaction([...cart]);
      setLastTotal(totalTagihan);
      setLastCash(parseInt(cashInput.replace(/\D/g, "") || "0"));
      setLastId(trxId);

      setCart([]);
      setCashInput("");
      setIsCheckoutOpen(false);
      setIsReceiptOpen(true);
      showToast("Transaksi berhasil!", "success");
    } catch (error) {
      showToast("Gagal memproses transaksi.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const sendWhatsApp = () => {
    let text = `*WARUNG KITA*\nID: ${lastId}\n\n`;
    lastTransaction.forEach((item) => {
      text += `${item.quantity}x ${item.Nama_Produk}\nRp ${(item.Harga_Jual * item.quantity).toLocaleString("id-ID")}\n`;
    });
    text += `\n*Total:* Rp ${lastTotal.toLocaleString("id-ID")}`;
    text += `\n*Tunai:* Rp ${lastCash.toLocaleString("id-ID")}`;
    text += `\n*Kembali:* Rp ${(lastCash - lastTotal).toLocaleString("id-ID")}`;
    text += `\n\nTerima kasih atas kunjungannya!`;

    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  const printReceipt = () => {
    window.print();
  };

  const handlePecahRenteng = async () => {
    if (!selectedSplitProduct || !customQty) return;
    setIsSubmitting(true);

    try {
      await fetch(process.env.NEXT_PUBLIC_API_URL as string, {
        method: "POST",
        mode: "no-cors",
        body: JSON.stringify({
          action: "pecah_renteng",
          ID_Produk: selectedSplitProduct.ID_Produk,
          Parent_ID: (selectedSplitProduct as any).Parent_ID,
          Jumlah_Konversi: Number(customQty),
        }),
      });

      const { refreshAllData } = await import("@/app/actions");
      await refreshAllData();
      showToast("Stok berhasil dipecah!");
      setIsSplitModalOpen(false);
    } catch (error) {
      showToast("Gagal pecah stok", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row w-full h-screen overflow-hidden relative">
      <div
        className={`fixed top-8 left-1/2 -translate-x-1/2 z-[100] transition-all duration-500 ease-out flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl border bg-white dark:bg-gray-800 border-red-100 dark:border-red-900 ${toast ? "translate-y-0 opacity-100" : "-translate-y-10 opacity-0 pointer-events-none"}`}
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

      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-gray-900 rounded-3xl w-full max-w-md p-6 shadow-2xl animate-in zoom-in-95">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Wallet /> Pembayaran
            </h2>
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-2xl flex justify-between items-center mb-6">
              <span className="text-gray-500">Total Tagihan</span>
              <span className="text-3xl font-black">
                Rp {totalTagihan.toLocaleString("id-ID")}
              </span>
            </div>
            <div className="mb-6">
              <label className="block text-sm font-semibold mb-2">
                Uang Diterima (Rp)
              </label>
              <input
                type="text"
                value={cashInput}
                onChange={(e) => handleFormatRupiah(e.target.value)}
                placeholder="0"
                className="w-full p-4 bg-white dark:bg-gray-950 border-2 border-gray-200 dark:border-gray-800 rounded-2xl text-xl font-bold focus:outline-none focus:border-gray-900 dark:focus:border-gray-100"
              />
              <div className="grid grid-cols-3 gap-2 mt-3">
                <button
                  onClick={() =>
                    setCashInput(totalTagihan.toLocaleString("id-ID"))
                  }
                  className="py-2 bg-gray-100 dark:bg-gray-800 rounded-xl text-sm font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  Uang Pas
                </button>
                <button
                  onClick={() => setCashInput("50.000")}
                  className="py-2 bg-gray-100 dark:bg-gray-800 rounded-xl text-sm font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  50 Ribu
                </button>
                <button
                  onClick={() => setCashInput("100.000")}
                  className="py-2 bg-gray-100 dark:bg-gray-800 rounded-xl text-sm font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  100 Ribu
                </button>
              </div>
            </div>
            <div className="flex justify-between items-end mb-6">
              <span className="text-gray-500">Kembalian</span>
              <span
                className={`text-2xl font-bold ${kembalian < 0 ? "text-red-500" : "text-green-500"}`}
              >
                {kembalian < 0
                  ? "Kurang!"
                  : `Rp ${kembalian.toLocaleString("id-ID")}`}
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setIsCheckoutOpen(false)}
                className="px-6 py-4 rounded-xl font-bold bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-white hover:bg-gray-200 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={submitTransaction}
                disabled={kembalian < 0 || isSubmitting || !cashInput}
                className={`flex-1 py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${kembalian < 0 || isSubmitting || !cashInput ? "bg-gray-200 text-gray-400" : "bg-gray-900 dark:bg-white dark:text-black text-white hover:bg-black"}`}
              >
                {isSubmitting ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <CheckCircle2 />
                )}{" "}
                Lunas
              </button>
            </div>
          </div>
        </div>
      )}

      {isReceiptOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-xl w-full max-w-sm p-0 shadow-2xl overflow-hidden flex flex-col text-black">
            <div
              id="printable-receipt"
              className="p-6 bg-white font-mono text-sm flex-1"
            >
              <div className="text-center mb-4">
                <h2 className="text-xl font-bold mb-1">WARUNG KITA</h2>
                <p className="text-xs text-gray-500">
                  Jl. Contoh Alamat No.123
                </p>
                <p className="text-xs text-gray-500">
                  {new Date().toLocaleString("id-ID")}
                </p>
                <p className="text-xs text-gray-500 border-b border-dashed border-gray-300 pb-4 mb-4">
                  {lastId}
                </p>
              </div>
              <ul className="space-y-2 mb-4 border-b border-dashed border-gray-300 pb-4">
                {lastTransaction.map((item) => (
                  <li
                    key={item.ID_Produk}
                    className="flex justify-between items-start"
                  >
                    <div>
                      <span className="font-bold">{item.Nama_Produk}</span>
                      <div className="text-xs text-gray-500">
                        {item.quantity} x{" "}
                        {item.Harga_Jual.toLocaleString("id-ID")}
                      </div>
                    </div>
                    <span className="font-bold">
                      {(item.Harga_Jual * item.quantity).toLocaleString(
                        "id-ID",
                      )}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="space-y-1 mb-6 border-b border-dashed border-gray-300 pb-4">
                <div className="flex justify-between text-lg font-black">
                  <span>Total</span>
                  <span>Rp {lastTotal.toLocaleString("id-ID")}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Tunai</span>
                  <span>Rp {lastCash.toLocaleString("id-ID")}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Kembali</span>
                  <span>
                    Rp {(lastCash - lastTotal).toLocaleString("id-ID")}
                  </span>
                </div>
              </div>
              <div className="text-center font-bold text-xs uppercase">
                Terima Kasih Atas Kunjungan Anda
              </div>
            </div>

            <div className="p-4 bg-gray-50 border-t border-gray-200 grid grid-cols-2 gap-2 no-print">
              <button
                onClick={printReceipt}
                className="py-3 bg-gray-900 text-white rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-black transition-colors"
              >
                <Printer size={18} /> Cetak
              </button>
              <button
                onClick={sendWhatsApp}
                className="py-3 bg-green-500 text-white rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-green-600 transition-colors"
              >
                <MessageCircle size={18} /> Kirim WA
              </button>
              <button
                onClick={() => setIsReceiptOpen(false)}
                className="col-span-2 py-3 bg-white border border-gray-300 text-gray-800 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-gray-100 mt-2"
              >
                <Check size={18} /> Selesai
              </button>
            </div>
          </div>
        </div>
      )}

      {isSplitModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 w-full max-w-xs shadow-2xl animate-in zoom-in-95">
            <h3 className="font-black text-lg mb-2">Pecah Renteng?</h3>
            <p className="text-xs text-gray-500 mb-4">
              1 stok{" "}
              <span className="font-bold text-gray-900 dark:text-white">
                {(selectedSplitProduct as any)?.Parent_ID}
              </span>{" "}
              akan dikurangi untuk menambah stok eceran ini.
            </p>

            <label className="block text-[10px] font-black uppercase text-gray-400 mb-1">
              Jumlah Eceran yang Didapat
            </label>
            <input
              type="number"
              value={customQty}
              onChange={(e) => setCustomQty(e.target.value)}
              className="w-full p-3 bg-gray-100 dark:bg-gray-800 rounded-xl outline-none font-black text-center text-xl mb-4 focus:ring-2 focus:ring-amber-500 transition-all"
            />

            <div className="flex gap-2">
              <button
                onClick={() => setIsSplitModalOpen(false)}
                className="flex-1 py-3 font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handlePecahRenteng}
                disabled={isSubmitting}
                className="flex-1 py-3 bg-amber-500 text-white rounded-xl font-bold shadow-lg shadow-amber-500/20 hover:bg-amber-600 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? "Proses..." : "Konfirmasi"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        <div className="px-4 lg:px-8 pt-8 pb-4 z-10 shrink-0">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                Kasir Pintar
              </h1>
            </div>
            <div className="relative w-full md:w-72">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                placeholder="Cari barang..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-sm focus:ring-2 focus:ring-gray-900 outline-none"
              />
            </div>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${selectedCategory === category ? "bg-gray-900 dark:bg-white dark:text-black text-white" : "bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-800"}`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 lg:px-8 pb-8 scrollbar-hide">
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-5 pb-20">
            {filteredProducts.map((product) => (
              <div
                key={product.ID_Produk}
                className="relative group z-0 h-full"
              >
                <ProductCard product={product} onAddToCart={handleAddToCart} />

                {(product as any).Parent_ID && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedSplitProduct(product);
                      setCustomQty(
                        String((product as any).Isi_Per_Parent || 10),
                      );
                      setIsSplitModalOpen(true);
                    }}
                    className="absolute -top-2 -right-2 bg-amber-500 text-white p-2 rounded-full shadow-lg hover:scale-110 transition-all z-10"
                    title="Pecah Renteng"
                  >
                    <Scissors size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <Cart
        cart={cart}
        heldCart={heldCart}
        updateQuantity={updateQuantity}
        removeItem={removeItem}
        totalTagihan={totalTagihan}
        setIsCheckoutOpen={setIsCheckoutOpen}
        handleHoldOrder={handleHoldOrder}
        handleResumeOrder={handleResumeOrder}
      />
    </div>
  );
}
