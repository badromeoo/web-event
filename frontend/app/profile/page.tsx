"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  name: string;
  email: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fungsi untuk logout
  const handleLogout = () => {
    // Hapus token dari localStorage dan arahkan ke halaman login
    localStorage.removeItem("token");
    setUser(null);
    router.push("/login");
  };

  useEffect(() => {
    const token = localStorage.getItem("token");

    // Jika tidak ada token, arahkan ke halaman login
    if (!token) {
      router.push("/login");
      return;
    }

    // Ambil data user dari endpoint /api/auth/me
    const fetchUserData = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        const response = await fetch(`${apiUrl}/api/auth/me`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        // Jika fetch gagal atau token tidak valid
        if (!response.ok) {
          setError("Token kadaluwarsa atau tidak valid");
          router.push("/login");
          return;
        }

        // Jika berhasil, simpan data user ke state
        const data = await response.json();
        setUser(data);
        setLoading(false);
      } catch (err) {
        setError("Gagal memuat data user");
        router.push("/login");
      }
    };

    fetchUserData();
  }, [router]);

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Memuat...</div>;
  }

  if (error) {
    return <div className="flex items-center justify-center min-h-screen text-red-500">{error}</div>;
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg">
        <h1 className="text-3xl text-black font-bold mb-6">Profil Pengguna</h1>
        {user && (
          <div className="space-y-4">
            <div>
              <p className="text-black">Selamat datang,</p>
              <p className="text-2xl text-black font-semibold">{user.name}</p>
            </div>
            <div>
              <p className="text-gray-600">Email Anda:</p>
              <p className="text-lg text-black">{user.email}</p>
            </div>
            <div>
              <p className="text-gray-600">ID User:</p>
              <p className="text-lg text-black">{user.id}</p>
            </div>
            <div>
              <button onClick={handleLogout} className="mt-4 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded" aria-label="Logout">
                Logout
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
