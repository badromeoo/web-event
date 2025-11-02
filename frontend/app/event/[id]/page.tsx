"use client"

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';

interface EventDetail {
  id: number;
  name: string;
  description: string;
  price: number;
  startDate: string;
  endDate: string;
  availableSeats: number;
  organizer: {
    name: string;
  };
}

export default function EventDetailPage() {
  const router = useRouter();
  const params = useParams();
  const eventId = params.id as string;

  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!eventId) return;

    const fetchEventDetail = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        const response = await fetch(`${apiUrl}/api/events/${eventId}`, {
          cache: 'no-store',
        });

        if (!response.ok) {
          throw new Error('Failed to fetch event detail');
        }

        const data = await response.json();
        setEvent(data);
      } catch (err) {
        setError('Gagal memuat detail event');
      } finally {
        setLoading(false);
      }
    };

    fetchEventDetail();
  }, [eventId]);

  const handleBuyTicket = async () => {
    setMessage('');
    setError('');

    // Ambil token dari localStorage
    const token = localStorage.getItem('token');

    // Jika tidak ada token, arahkan ke login
    if (!token) {
      router.push('/login');
      return;
    }

    if (!event) return;

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const res = await fetch(`${apiUrl}/api/transactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ eventId: event.id }),
      });

      if (res.ok) {
        setMessage('Pembelian berhasil! Menunggu pembayaran.');
      } else {
        const errorData = await res.json();
        setError(errorData.message || 'Tiket sudah habis');
      }
    } catch (err) {
      setError('Terjadi kesalahan saat membeli tiket');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 flex items-center justify-center">
        <p className="text-gray-600">Memuat...</p>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 flex items-center justify-center">
        <p className="text-red-600">Event tidak ditemukan</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Event Name */}
          <h1 className="text-4xl font-bold text-gray-900 mb-6">
            {event.name}
          </h1>

          {/* Event Description */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-700 mb-2">
              Deskripsi
            </h2>
            <p className="text-gray-600 leading-relaxed">{event.description}</p>
          </div>

          {/* Event Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Price */}
            <div className="border-l-4 border-blue-500 pl-4">
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-1">
                Harga
              </h3>
              <p className="text-2xl font-bold text-blue-600">
                {event.price === 0
                  ? 'Gratis'
                  : `Rp ${event.price.toLocaleString('id-ID')}`}
              </p>
            </div>

            {/* Available Seats */}
            <div className="border-l-4 border-green-500 pl-4">
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-1">
                Sisa Kursi
              </h3>
              <p className="text-2xl font-bold text-green-600">
                {event.availableSeats} kursi
              </p>
            </div>

            {/* Start Date */}
            <div className="border-l-4 border-purple-500 pl-4">
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-1">
                Tanggal Mulai
              </h3>
              <p className="text-lg font-semibold text-gray-800">
                {new Date(event.startDate).toLocaleDateString('id-ID', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>

            {/* End Date */}
            <div className="border-l-4 border-orange-500 pl-4">
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-1">
                Tanggal Selesai
              </h3>
              <p className="text-lg font-semibold text-gray-800">
                {new Date(event.endDate).toLocaleDateString('id-ID', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </div>

          {/* Organizer */}
          <div className="border-t pt-6">
            <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">
              Penyelenggara
            </h3>
            <p className="text-xl font-semibold text-gray-800">
              {event.organizer.name}
            </p>
          </div>

          {/* Messages */}
          {message && (
            <div className="mt-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
              {message}
            </div>
          )}
          {error && (
            <div className="mt-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          {/* Action Button */}
          <div className="mt-8">
            <button
              className="w-full bg-black hover:bg-gray-800 text-white font-bold py-3 px-6 rounded-lg transition duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
              disabled={event.availableSeats === 0}
              onClick={handleBuyTicket}
            >
              {event.availableSeats === 0 ? 'Tiket Habis' : 'Beli Tiket Sekarang'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
