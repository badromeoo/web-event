"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

export default function EditEvent() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [availableSeats, setAvailableSeats] = useState("");
  const [bankAccountNumber, setBankAccountNumber] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  useEffect(() => {
    // Cek token
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    // Fetch data event
    const fetchEventData = async () => {
      try {
        setIsFetching(true);
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/events/${id}`);

        if (response.ok) {
          const data = await response.json();

          // Isi semua useState dengan data yang didapat
          setName(data.name || "");
          setDescription(data.description || "");
          setPrice(data.price?.toString() || "");
          setAvailableSeats(data.availableSeats?.toString() || "");
          setBankAccountNumber(data.bankAccountNumber || "");

          // Format tanggal untuk input type="date" (YYYY-MM-DD)
          if (data.startDate) {
            const startDateObj = new Date(data.startDate);
            setStartDate(startDateObj.toISOString().split('T')[0]);
          }
          if (data.endDate) {
            const endDateObj = new Date(data.endDate);
            setEndDate(endDateObj.toISOString().split('T')[0]);
          }
        } else {
          const errorData = await response.json();
          setError(errorData.message || "Gagal mengambil data event");
        }
      } catch (err) {
        setError("Terjadi kesalahan saat mengambil data event");
      } finally {
        setIsFetching(false);
      }
    };

    fetchEventData();
  }, [id, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setError("");
    setIsLoading(true);

    try {
      const token = localStorage.getItem("token");

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/events/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          description,
          price: Number(price),
          availableSeats: Number(availableSeats),
          startDate,
          endDate,
          bankAccountNumber,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setMessage("Event berhasil di-update!");
        console.log(data);
      } else {
        const errorData = await response.json();
        setError(errorData.message || "Gagal mengupdate event");
      }
    } catch (err) {
      setError("Terjadi kesalahan saat mengupdate event");
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-8">
            <p className="text-center text-gray-600">Memuat data event...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">Edit Event</h1>

          {message && <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">{message}</div>}

          {error && <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Nama Event
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full text-black px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-black outline-none"
                placeholder="Masukkan nama event"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Deskripsi
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                rows={4}
                className="w-full text-black px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-black outline-none resize-none"
                placeholder="Masukkan deskripsi event"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
                  Harga (Rp)
                </label>
                <input
                  type="number"
                  id="price"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  required
                  min="0"
                  className="w-full text-black px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-black outline-none"
                  placeholder="0"
                />
                <div className="mt-4">
                  <label htmlFor="bankAccountNumber" className="block text-sm font-medium text-gray-700 mb-2">
                    Nomor Rekening
                  </label>
                  <input
                    type="text"
                    id="bankAccountNumber"
                    value={bankAccountNumber}
                    onChange={(e) => setBankAccountNumber(e.target.value)}
                    required
                    className="w-full text-black px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-black outline-none"
                    placeholder="Masukkan nomor rekening"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="availableSeats" className="block text-sm font-medium text-gray-700 mb-2">
                  Jumlah Kursi
                </label>
                <input
                  type="number"
                  id="availableSeats"
                  value={availableSeats}
                  onChange={(e) => setAvailableSeats(e.target.value)}
                  required
                  min="1"
                  className="w-full text-black px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-black outline-none"
                  placeholder="0"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">
                  Tanggal Mulai
                </label>
                <input
                  type="date"
                  id="startDate"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                  className="w-full text-black px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-black outline-none"
                />
              </div>

              <div>
                <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-2">
                  Tanggal Selesai
                </label>
                <input
                  type="date"
                  id="endDate"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                  className="w-full text-black px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-black outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-black text-white py-3 px-4 rounded-md  focus:outline-none focus:ring-2 f focus:ring-offset-2 font-medium transition-colors disabled:bg-black disabled:cursor-not-allowed"
            >
              {isLoading ? "Mengupdate Event..." : "Update Event"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
