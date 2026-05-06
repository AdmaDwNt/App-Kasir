// src/components/PaymentModal.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { gasFetch } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";
import { useCartStore } from "@/store/useCartStore";
import { toast } from "react-hot-toast";
import { toPng } from "html-to-image";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const QUICK_CASH_OPTIONS = [5000, 10000, 20000, 50000, 100000];

export default function PaymentModal({
  isOpen,
  onClose,
  onSuccess,
}: PaymentModalProps) {
  const queryClient = useQueryClient();
  const { items: cart, globalDiscount, getTotal, clearCart } = useCartStore();
  const { grandTotal: total } = getTotal();
  const contentRef = useRef<HTMLDivElement>(null);

  const [paymentMethod, setPaymentMethod] = useState<
    "Tunai" | "Transfer" | "Hutang"
  >("Tunai");
  const [amountPaid, setAmountPaid] = useState<number | "">("");
  const [customerName, setCustomerName] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);

  const [isSuccessState, setIsSuccessState] = useState(false);
  const [trxData, setTrxData] = useState<any>(null);

  const [printSize, setPrintSize] = useState<"58mm" | "80mm" | "A4">("58mm");

  useEffect(() => {
    if (isOpen) {
      setIsSuccessState(false);
      setTrxData(null);
      setPaymentMethod("Tunai");
      setAmountPaid("");
      setCustomerName("");
    }
  }, [isOpen]);

  const changeAmount = typeof amountPaid === "number" ? amountPaid - total : 0;

  const isValidToPay =
    (paymentMethod === "Tunai" &&
      typeof amountPaid === "number" &&
      amountPaid >= total) ||
    paymentMethod === "Transfer" ||
    (paymentMethod === "Hutang" && customerName.trim() !== "");

  const generateTrxId = () => {
    const d = new Date();
    const yy = d.getFullYear().toString().slice(2);
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const randomSuffix = Math.random()
      .toString(36)
      .substring(2, 6)
      .toUpperCase();
    return `TRX-${yy}${mm}${dd}-${randomSuffix}`;
  };

  const handlePayment = async () => {
    if (!isValidToPay) return;
    setIsProcessing(true);
    const toastId = toast.loading("Memproses pembayaran...");
    const newTrxId = generateTrxId();

    try {
      const payload = {
        action: "checkout",
        ID_Transaksi: newTrxId,
        tipe_pembayaran: paymentMethod,
        total_harga: total,
        diskon_global: globalDiscount,
        detail_transaksi: (Array.isArray(cart) ? cart : []).map((item) => ({
          id_produk: item.id_produk,
          qty: item.qty,
          harga_satuan: item.harga_satuan,
          diskon_item: item.diskon_item,
          is_rentengan: item.is_rentengan,
        })),
      };

      const response = await gasFetch("?action=checkout", { method: "POST", body: JSON.stringify(payload) });

      if (response.status === "error")
        throw new Error(response.message || "Gagal mencatat transaksi.");

      await queryClient.invalidateQueries({ queryKey: ["produk"] });
      toast.success("Transaksi Berhasil!", { id: toastId, duration: 3000 });

      setTrxData({
        trxId: newTrxId,
        cart: [...cart],
        total,
        amountPaid: paymentMethod === "Tunai" ? amountPaid : total,
        changeAmount,
        paymentMethod,
        customerName,
        date: new Date().toLocaleString("id-ID"),
      });
      
      clearCart();
      setIsSuccessState(true);
    } catch (error: any) {
      console.error("Payment Error:", error);
      toast.error(error.message || "Koneksi ke server gagal.", { id: toastId });
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShareWAText = () => {
    let text = `*POSPro - Struk Pembelian*\n`;
    text += `No: ${trxData.trxId}\n`;
    text += `Tanggal: ${trxData.date}\n`;
    if (trxData.customerName) text += `Pelanggan: ${trxData.customerName}\n`;
    text += `--------------------------------\n`;

    (Array.isArray(trxData.cart) ? trxData.cart : []).forEach((item: any) => {
      text += `${item.nama} ${item.is_rentengan ? "(Renteng)" : ""}\n`;
      text += `${item.qty} x Rp ${item.harga_satuan.toLocaleString("id-ID")} = Rp ${((item.qty * item.harga_satuan) - item.diskon_item).toLocaleString("id-ID")}\n`;
    });

    text += `--------------------------------\n`;
    text += `*Total: Rp ${trxData.total.toLocaleString("id-ID")}*\n`;
    text += `Metode: ${trxData.paymentMethod}\n`;

    if (trxData.paymentMethod === "Tunai") {
      text += `Bayar: Rp ${trxData.amountPaid.toLocaleString("id-ID")}\n`;
      text += `Kembali: Rp ${trxData.changeAmount.toLocaleString("id-ID")}\n`;
    }
    text += `--------------------------------\n`;
    text += `Terima Kasih telah berbelanja!\n`;

    const waLink = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(waLink, "_blank");
  };

  const handleShareWAImage = async () => {
    if (!contentRef.current) return;

    const toastId = toast.loading("Membuat gambar nota...");
    try {
      const dataUrl = await toPng(contentRef.current, {
        backgroundColor: "#ffffff",
        pixelRatio: 2,
      });

      const downloadLink = document.createElement("a");
      downloadLink.href = dataUrl;
      downloadLink.download = `Nota_${trxData.trxId}.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);

      toast.success("Nota berhasil diunduh!", { id: toastId });

      const text = `Terima kasih telah berbelanja! Berikut adalah detail transaksi Anda dengan No: ${trxData.trxId}.\n*(Silakan lampirkan gambar nota yang telah diunduh)*`;
      const waLink = `https://wa.me/?text=${encodeURIComponent(text)}`;

      setTimeout(() => window.open(waLink, "_blank"), 800);
    } catch (error) {
      console.error(error);
      toast.error("Gagal membuat gambar nota.", { id: toastId });
    }
  };

  const handleFinish = () => {
    onSuccess();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* 
        Sihir CSS: Dinamis merubah ukuran kertas browser (@page) 
        sesuai dengan pilihan ukuran nota kasir.
      */}
      {isSuccessState && (
        <style
          dangerouslySetInnerHTML={{
            __html: `
          @media print {
            body * { visibility: hidden !important; }
            #print-area, #print-area * { visibility: visible !important; }
            #print-area {
              position: absolute !important;
              left: 0 !important;
              top: 0 !important;
              width: ${printSize === "A4" ? "100%" : printSize} !important;
              margin: 0 !important;
              padding: ${printSize === "A4" ? "15mm" : "0"} !important;
            }
            @page {
              /* Memaksa Chrome/Edge mengubah ukuran kertas preview menjadi kotak struk! */
              size: ${printSize === "A4" ? "A4" : printSize === "80mm" ? "80mm auto" : "58mm auto"};
              margin: 0mm;
            }
          }
        `,
          }}
        />
      )}

      <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
          <div className="bg-slate-50 border-b border-slate-100 p-4 flex justify-between items-center shrink-0">
            <h3 className="text-lg font-bold text-slate-800">
              {isSuccessState ? "Transaksi Sukses" : "Proses Pembayaran"}
            </h3>
            {!isSuccessState && (
              <button
                onClick={onClose}
                disabled={isProcessing}
                className="text-slate-400 hover:text-slate-600 transition-colors"
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
            )}
          </div>

          <div className="p-5 overflow-y-auto custom-scrollbar flex-1">
            {/* FORM PEMBAYARAN */}
            {!isSuccessState && (
              <div className="space-y-5">
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-center">
                  <p className="text-blue-600 font-semibold text-sm mb-1">
                    Total Tagihan
                  </p>
                  <p className="text-3xl font-black text-blue-700">
                    Rp {total.toLocaleString("id-ID")}
                  </p>
                </div>

                <div>
                  <p className="text-sm font-semibold text-slate-700 mb-2">
                    Metode Pembayaran
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {["Tunai", "Transfer", "Hutang"].map((method) => (
                      <button
                        key={method}
                        onClick={() => {
                          setPaymentMethod(method as any);
                          setAmountPaid("");
                        }}
                        className={`py-2 rounded-lg text-sm font-bold border transition ${
                          paymentMethod === method
                            ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                            : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        {method}
                      </button>
                    ))}
                  </div>
                </div>

                {paymentMethod === "Tunai" && (
                  <div className="space-y-4 animate-in slide-in-from-top-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-700 mb-2">
                        Uang Diterima
                      </p>
                      <div className="relative mb-3">
                        <span className="absolute left-3 top-2.5 font-bold text-slate-400">
                          Rp
                        </span>
                        <input
                          type="number"
                          className="w-full border-2 border-slate-200 rounded-xl pl-10 pr-4 py-2.5 font-bold text-slate-800 text-lg focus:outline-none focus:border-blue-500 transition-colors"
                          placeholder="0"
                          value={amountPaid}
                          onChange={(e) =>
                            setAmountPaid(
                              e.target.value ? Number(e.target.value) : "",
                            )
                          }
                        />
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => setAmountPaid(total)}
                          className="px-3 py-1.5 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-lg text-xs font-bold hover:bg-emerald-100 transition-colors"
                        >
                          Uang Pas
                        </button>
                        {QUICK_CASH_OPTIONS.filter((val) => val >= total).map(
                          (val) => (
                            <button
                              key={val}
                              onClick={() => setAmountPaid(val)}
                              className="px-3 py-1.5 bg-slate-50 text-slate-600 border border-slate-200 rounded-lg text-xs font-bold hover:bg-slate-100 hover:text-blue-600 transition-colors"
                            >
                              {val.toLocaleString("id-ID")}
                            </button>
                          ),
                        )}
                      </div>
                    </div>
                    <div className="flex justify-between items-center py-2 border-t border-slate-100">
                      <span className="text-sm font-semibold text-slate-500">
                        Kembalian
                      </span>
                      <span
                        className={`text-xl font-bold ${changeAmount < 0 ? "text-red-500" : "text-emerald-500"}`}
                      >
                        Rp{" "}
                        {changeAmount < 0
                          ? "0"
                          : changeAmount.toLocaleString("id-ID")}
                      </span>
                    </div>
                  </div>
                )}

                {paymentMethod === "Hutang" && (
                  <div className="animate-in slide-in-from-top-2">
                    <p className="text-sm font-semibold text-slate-700 mb-2">
                      Nama Pelanggan (Wajib)
                    </p>
                    <input
                      type="text"
                      className="w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 font-medium text-slate-800 focus:outline-none focus:border-blue-500 transition-colors"
                      placeholder="Masukkan nama pelanggan..."
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                    />
                  </div>
                )}
              </div>
            )}

            {/* LAYAR SUKSES & PREVIEW STRUK */}
            {isSuccessState && trxData && (
              <div className="flex flex-col items-center animate-in zoom-in duration-300 w-full">
                <div className="w-full bg-slate-50 p-2 rounded-xl border border-slate-200 mb-4 flex justify-between items-center gap-2">
                  <span className="text-xs font-bold text-slate-500 pl-2">
                    Ukuran Cetak:
                  </span>
                  <div className="flex gap-1">
                    {["58mm", "80mm", "A4"].map((size) => (
                      <button
                        key={size}
                        onClick={() => setPrintSize(size as any)}
                        className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${printSize === size ? "bg-blue-600 text-white" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"}`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-200 p-4 rounded-xl shadow-inner w-full flex justify-center mb-4 overflow-x-auto">
                  {/* === TARGET CETAK === */}
                  {/* Jika A4, kita ubah fontnya menjadi Arial/Sans-serif agar lebih profesional */}
                  <div
                    id="print-area"
                    ref={contentRef}
                    style={{
                      width:
                        printSize === "58mm"
                          ? "58mm"
                          : printSize === "80mm"
                            ? "80mm"
                            : "100%",
                      backgroundColor: "#ffffff",
                      color: "#000000",
                      padding: printSize === "A4" ? "30px" : "10px",
                      fontFamily:
                        printSize === "A4"
                          ? "ui-sans-serif, system-ui, sans-serif"
                          : "monospace",
                      fontSize: printSize === "A4" ? "14px" : "12px",
                      lineHeight: printSize === "A4" ? "1.6" : "1.3",
                      minHeight: "100px",
                      boxSizing: "border-box",
                    }}
                  >
                    <div
                      style={{
                        textAlign: printSize === "A4" ? "left" : "center",
                        marginBottom: "15px",
                        borderBottom:
                          printSize === "A4"
                            ? "3px solid #1e293b"
                            : "2px solid black",
                        paddingBottom: "10px",
                      }}
                    >
                      <h2
                        style={{
                          margin: 0,
                          fontWeight: 900,
                          fontSize: printSize === "A4" ? "28px" : "14px",
                          color: "#1e293b",
                        }}
                      >
                        {printSize === "A4" ? "INVOICE / NOTA" : "POSPro UMKM"}
                      </h2>
                      {printSize === "A4" && (
                        <p
                          style={{
                            margin: 0,
                            fontWeight: "bold",
                            marginTop: "5px",
                          }}
                        >
                          POSPro UMKM
                        </p>
                      )}
                      <p
                        style={{
                          margin: 0,
                          fontSize: printSize === "A4" ? "13px" : "10px",
                          color: printSize === "A4" ? "#64748b" : "inherit",
                        }}
                      >
                        Jl. Teknologi Masa Depan No. 99
                      </p>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        flexDirection: printSize === "A4" ? "row" : "column",
                        justifyContent: "space-between",
                        borderBottom: "1px dashed #cbd5e1",
                        paddingBottom: "12px",
                        marginBottom: "12px",
                        fontSize: printSize === "A4" ? "14px" : "10px",
                      }}
                    >
                      <div>
                        <div style={{ margin: 0 }}>
                          <span
                            style={{
                              color: printSize === "A4" ? "#64748b" : "inherit",
                            }}
                          >
                            No. Nota:
                          </span>{" "}
                          <strong>{trxData.trxId}</strong>
                        </div>
                        <div style={{ margin: 0 }}>
                          <span
                            style={{
                              color: printSize === "A4" ? "#64748b" : "inherit",
                            }}
                          >
                            Tanggal:
                          </span>{" "}
                          {trxData.date}
                        </div>
                      </div>
                      {trxData.customerName && (
                        <div
                          style={{
                            marginTop: printSize === "A4" ? "0" : "4px",
                            textAlign: printSize === "A4" ? "right" : "left",
                          }}
                        >
                          <div style={{ margin: 0 }}>
                            <span
                              style={{
                                color:
                                  printSize === "A4" ? "#64748b" : "inherit",
                              }}
                            >
                              Kepada Yth:
                            </span>
                          </div>
                          <div
                            style={{
                              margin: 0,
                              fontSize: printSize === "A4" ? "16px" : "inherit",
                            }}
                          >
                            <strong>{trxData.customerName}</strong>
                          </div>
                        </div>
                      )}
                    </div>

                    <table
                      style={{
                        width: "100%",
                        textAlign: "left",
                        borderCollapse: "collapse",
                        marginBottom: "12px",
                      }}
                    >
                      {printSize === "A4" && (
                        <thead>
                          <tr
                            style={{
                              backgroundColor: "#f1f5f9",
                              color: "#334155",
                            }}
                          >
                            <th
                              style={{
                                padding: "10px",
                                borderBottom: "2px solid #cbd5e1",
                              }}
                            >
                              Deskripsi Produk
                            </th>
                            <th
                              style={{
                                padding: "10px",
                                textAlign: "center",
                                borderBottom: "2px solid #cbd5e1",
                              }}
                            >
                              Qty
                            </th>
                            <th
                              style={{
                                padding: "10px",
                                textAlign: "right",
                                borderBottom: "2px solid #cbd5e1",
                              }}
                            >
                              Harga Satuan
                            </th>
                            <th
                              style={{
                                padding: "10px",
                                textAlign: "right",
                                borderBottom: "2px solid #cbd5e1",
                              }}
                            >
                              Jumlah
                            </th>
                          </tr>
                        </thead>
                      )}
                      <tbody>
                        {(Array.isArray(trxData.cart) ? trxData.cart : []).map((item: any, idx: number) => {
                          const rowTotal = (item.qty * item.harga_satuan) - item.diskon_item;
                          return printSize === "A4" ? (
                            <tr
                              key={idx}
                              style={{ borderBottom: "1px solid #e2e8f0" }}
                            >
                              <td
                                style={{
                                  padding: "12px 10px",
                                  fontWeight: 500,
                                }}
                              >
                                {item.nama} {item.is_rentengan ? "(Renteng)" : ""}
                              </td>
                              <td
                                style={{
                                  padding: "12px 10px",
                                  textAlign: "center",
                                }}
                              >
                                {item.qty}
                              </td>
                              <td
                                style={{
                                  padding: "12px 10px",
                                  textAlign: "right",
                                  color: "#64748b",
                                }}
                              >
                                {item.harga_satuan.toLocaleString("id-ID")}
                              </td>
                              <td
                                style={{
                                  padding: "12px 10px",
                                  textAlign: "right",
                                  fontWeight: "bold",
                                }}
                              >
                                {rowTotal.toLocaleString("id-ID")}
                              </td>
                            </tr>
                          ) : (
                            <tr key={idx}>
                              <td
                                style={{
                                  padding: "4px 0",
                                  verticalAlign: "top",
                                  borderBottom: "1px dotted #ccc",
                                }}
                              >
                                <span style={{ fontWeight: "bold" }}>
                                  {item.nama} {item.is_rentengan ? "(Rtg)" : ""}
                                </span>
                                <br />
                                <span style={{ fontSize: "10px" }}>
                                  {item.qty} x{" "}
                                  {item.harga_satuan.toLocaleString("id-ID")}
                                </span>
                              </td>
                              <td
                                style={{
                                  padding: "4px 0",
                                  verticalAlign: "bottom",
                                  textAlign: "right",
                                  fontWeight: "bold",
                                  borderBottom: "1px dotted #ccc",
                                }}
                              >
                                {rowTotal.toLocaleString("id-ID")}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>

                    <div
                      style={{
                        display: "flex",
                        justifyContent: "flex-end",
                        borderTop:
                          printSize === "A4" ? "none" : "2px solid black",
                        paddingTop: "8px",
                        marginTop: "8px",
                      }}
                    >
                      <div
                        style={{ width: printSize === "A4" ? "300px" : "100%" }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            fontWeight: "bold",
                            padding: printSize === "A4" ? "8px 10px" : "0",
                            backgroundColor:
                              printSize === "A4" ? "#f8fafc" : "transparent",
                            borderRadius: "8px",
                          }}
                        >
                          <span
                            style={{
                              fontSize: printSize === "A4" ? "16px" : "inherit",
                            }}
                          >
                            Total Tagihan:
                          </span>
                          <span
                            style={{
                              fontSize: printSize === "A4" ? "18px" : "16px",
                              color: printSize === "A4" ? "#2563eb" : "inherit",
                            }}
                          >
                            Rp {trxData.total.toLocaleString("id-ID")}
                          </span>
                        </div>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            fontSize: printSize === "A4" ? "14px" : "12px",
                            marginTop: "8px",
                            padding: printSize === "A4" ? "0 10px" : "0",
                            color: printSize === "A4" ? "#64748b" : "inherit",
                          }}
                        >
                          <span>Bayar ({trxData.paymentMethod}):</span>
                          <span
                            style={{
                              fontWeight:
                                printSize === "A4" ? "bold" : "normal",
                              color: "black",
                            }}
                          >
                            Rp {trxData.amountPaid.toLocaleString("id-ID")}
                          </span>
                        </div>
                        {trxData.paymentMethod === "Tunai" && (
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              fontSize: printSize === "A4" ? "14px" : "12px",
                              marginTop: "4px",
                              padding: printSize === "A4" ? "0 10px" : "0",
                              color: printSize === "A4" ? "#64748b" : "inherit",
                            }}
                          >
                            <span>Kembalian:</span>
                            <span
                              style={{
                                fontWeight:
                                  printSize === "A4" ? "bold" : "normal",
                                color: "black",
                              }}
                            >
                              Rp {trxData.changeAmount.toLocaleString("id-ID")}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div
                      style={{
                        textAlign: "center",
                        marginTop: "24px",
                        paddingTop: "16px",
                        borderTop: "1px dashed #cbd5e1",
                      }}
                    >
                      <p
                        style={{
                          margin: 0,
                          fontWeight: "bold",
                          fontSize: printSize === "A4" ? "16px" : "12px",
                        }}
                      >
                        Terima Kasih Atas Kepercayaan Anda
                      </p>
                      <p
                        style={{
                          margin: 0,
                          fontSize: "10px",
                          color: "#94a3b8",
                          marginTop: "4px",
                        }}
                      >
                        Powered by POSPro System
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="p-4 bg-slate-50 border-t border-slate-100 shrink-0">
            {!isSuccessState ? (
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={onClose}
                  disabled={isProcessing}
                  className="py-3 rounded-xl font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 disabled:opacity-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={handlePayment}
                  disabled={!isValidToPay || isProcessing}
                  className="py-3 rounded-xl font-bold text-white bg-blue-600 shadow-md shadow-blue-600/30 hover:bg-blue-700 disabled:opacity-50 disabled:shadow-none flex justify-center items-center transition-all"
                >
                  {isProcessing ? "Memproses..." : "Konfirmasi"}
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <button
                  onClick={handlePrint}
                  className="py-3 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-900 flex justify-center items-center gap-2 transition-colors shadow-md"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 002 2h6a2 2 0 002-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Cetak Thermal / PDF
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handleShareWAText}
                    className="py-2.5 bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold rounded-xl hover:bg-emerald-100 flex justify-center items-center gap-2 transition-colors text-sm"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.898-4.45 9.896-9.896 0-2.639-1.027-5.119-2.895-6.985-1.868-1.866-4.348-2.895-6.985-2.895-5.448 0-9.896 4.448-9.896 9.896 0 2.116.596 3.716 1.592 5.392l-1.127 4.121 4.223-1.125z" />
                    </svg>
                    WA (Teks)
                  </button>
                  <button
                    onClick={handleShareWAImage}
                    className="py-2.5 bg-[#25D366] text-white font-bold rounded-xl hover:bg-[#20bd5a] flex justify-center items-center gap-2 transition-colors shadow-md shadow-emerald-500/30 text-sm"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.898-4.45 9.896-9.896 0-2.639-1.027-5.119-2.895-6.985-1.868-1.866-4.348-2.895-6.985-2.895-5.448 0-9.896 4.448-9.896 9.896 0 2.116.596 3.716 1.592 5.392l-1.127 4.121 4.223-1.125z" />
                    </svg>
                    WA (Gambar)
                  </button>
                </div>

                <button
                  onClick={handleFinish}
                  className="py-3 w-full bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-md mt-2"
                >
                  Selesai & Transaksi Baru
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
