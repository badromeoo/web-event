"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { jwtDecode } from "jwt-decode";

interface DecodedToken {
  role: string;
  userId: string;
  [key: string]: any;
}

export default function Navbar() {
  const [userRole, setUserRole] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    
    const token = localStorage.getItem("token");

    if (token) {
      try {
        
        const decoded = jwtDecode<DecodedToken>(token);
        setUserRole(decoded.role);
      } catch (error) {
        console.error("Error decoding token:", error);
        
        localStorage.removeItem("token");
        setUserRole(null);
      }
    } else {
      setUserRole(null);
    }
  }, []);

  const handleLogout = () => {
    
    localStorage.removeItem("token");
    setUserRole(null);
    
    router.push("/login");
  };

  return (
    <nav className="bg-gray-900 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo / Brand */}
          <div className="">
            <Link href="/" className="text-2xl font-bold hover:text-gray-300 transition-colors">
              EventPlatform
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="flex items-center space-x-6">
            {/* Tamu (Tidak Login) */}
            {userRole === null && (
              <>
                <Link
                  href="/login"
                  className="px-4 py-2 rounded-md hover:bg-gray-800 transition-colors"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Register
                </Link>
              </>
            )}

            {/* Customer */}
            {userRole === "CUSTOMER" && (
              <>
                <Link
                  href="/profile"
                  className="px-4 py-2 rounded-md hover:bg-gray-800 transition-colors"
                >
                  Profil
                </Link>
                <Link
                  href="/my-transactions"
                  className="px-4 py-2 rounded-md hover:bg-gray-800 transition-colors"
                >
                  Transaksiku
                </Link>
                
                
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-red-600 rounded-md hover:bg-red-700 transition-colors"
                >
                  Logout
                </button>
              </>
            )}

            {/* Organizer */}
            {userRole === "ORGANIZER" && (
              <>
                <Link
                  href="/dashboard"
                  className="px-4 py-2 rounded-md hover:bg-gray-800 transition-colors"
                >
                  Dashboard
                </Link>
                <Link
                  href="/create-event"
                  className="px-4 py-2 rounded-md hover:bg-gray-800 transition-colors"
                >
                  Buat Event
                </Link>
                <Link
                  href="/profile"
                  className="px-4 py-2 rounded-md hover:bg-gray-800 transition-colors"
                >
                  Profile
                </Link>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-red-600 rounded-md hover:bg-red-700 transition-colors"
                >
                  Logout
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
