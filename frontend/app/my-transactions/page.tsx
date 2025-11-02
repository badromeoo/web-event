"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Transaction {
  id: string;
  status: "WAITING_FOR_PAYMENT" | "WAITING_FOR_CONFIRMATION" | "DONE" | "REJECTED";
  event: {
    name: string;
    startDate?: string;
    bankAccountNumber?: string;
  };
  createdAt: string;
}

export default function MyTransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchTransactions = async () => {
      const token = localStorage.getItem("token");

      // Jika tidak ada token, redirect ke login
      if (!token) {
        router.push("/login");
        return;
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL;

      try {
        const res = await fetch(`${apiUrl}/api/transactions/my`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (res.ok) {
          const data = await res.json();
          setTransactions(data);
        } else if (res.status === 401) {
          // Token tidak valid, redirect ke login
          localStorage.removeItem("token");
          router.push("/login");
        } else {
          setMessage("Gagal mengambil data transaksi");
        }
      } catch (err) {
        setMessage("Error: Tidak dapat terhubung ke server");
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [router]);

  const handleUpload = async (transactionId: string) => {
    if (!selectedFile || uploadingId !== transactionId) {
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      setMessage("Token tidak ditemukan. Silakan login kembali.");
      router.push("/login");
      return;
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL;

    try {
      const formData = new FormData();
      formData.append("proof", selectedFile);

      const res = await fetch(`${apiUrl}/api/transactions/${transactionId}/upload`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (res.ok) {
        setMessage("Bukti pembayaran berhasil diunggah!");

        // Reset state
        setSelectedFile(null);
        setUploadingId(null);

        
        setTransactions((prev) => prev.map((t) => (t.id === transactionId ? { ...t, status: "WAITING_FOR_CONFIRMATION" } : t)));
      } else if (res.status === 401) {
        localStorage.removeItem("token");
        router.push("/login");
      } else {
        const errorData = await res.json();
        setMessage(errorData.message || "Gagal mengunggah bukti pembayaran");
      }
    } catch (err) {
      setMessage("Error: Tidak dapat terhubung ke server");
    }
  };

  const getStatusBadge = (status: Transaction["status"]) => {
    switch (status) {
      case "WAITING_FOR_PAYMENT":
        return <span className="px-3 py-1 text-sm font-medium text-yellow-800 bg-yellow-100 rounded-full">Menunggu Pembayaran</span>;
      case "WAITING_FOR_CONFIRMATION":
        return <span className="px-3 py-1 text-sm font-medium text-blue-800 bg-blue-100 rounded-full">Menunggu Konfirmasi</span>;
      case "DONE":
        return <span className="px-3 py-1 text-sm font-medium text-green-800 bg-green-100 rounded-full">Tiket Aktif</span>;
      case "REJECTED":
        return <span className="px-3 py-1 text-sm font-medium text-red-800 bg-red-100 rounded-full">Ditolak</span>;
      default:
        return null;
    }
  };

  const renderActionButton = (transaction: Transaction) => {
    switch (transaction.status) {
      case "WAITING_FOR_PAYMENT":
        return (
          <div>
            {transaction.event.bankAccountNumber && (
              <p className="mb-3 text-sm text-gray-700">
                Silakan transfer pembayaran ke: <span className="font-medium">{transaction.event.bankAccountNumber}</span>
              </p>
            )}
            <div className="space-y-3">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setSelectedFile(e.target.files[0]);
                    setUploadingId(transaction.id);
                  }
                }}
                className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none"
              />
              <button
                onClick={() => handleUpload(transaction.id)}
                disabled={!selectedFile || uploadingId !== transaction.id}
                className="px-4 py-2 text-sm font-medium text-white bg-black rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Konfirmasi Upload
              </button>
            </div>
          </div>
        );
      case "WAITING_FOR_CONFIRMATION":
        return <p className="text-sm text-gray-600">Menunggu Konfirmasi</p>;
      case "DONE":
        return <p className="text-sm font-medium text-green-600">Tiket Aktif</p>;
      case "REJECTED":
        return <p className="text-sm font-medium text-red-600">Ditolak</p>;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <p className="text-lg text-gray-700">Memuat data transaksi...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Transaksi Saya</h1>

        {message && <div className="mb-4 p-4 bg-green-200 border border-green-600 text-black rounded-md">{message}</div>}

        {transactions.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <p className="text-gray-600">Belum ada transaksi</p>
          </div>
        ) : (
          <div className="space-y-4">
            {transactions.map((transaction) => (
              <div key={transaction.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">{transaction.event.name}</h2>
                    {transaction.event.startDate && <p className="text-sm text-gray-600 mb-2">Tanggal Event: {new Date(transaction.event.startDate).toLocaleDateString("id-ID")}</p>}
                    <p className="text-xs text-gray-500">
                      Tanggal Transaksi:{" "}
                      {new Date(transaction.createdAt).toLocaleDateString("id-ID", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <div>{getStatusBadge(transaction.status)}</div>
                </div>

                <div className="border-t pt-4 mt-4">{renderActionButton(transaction)}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
