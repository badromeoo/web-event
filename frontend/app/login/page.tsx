'use client';

import { useState, FormEvent, useEffect} from 'react';
import { useRouter } from 'next/navigation';


export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setMessage('');

    const apiUrl = process.env.NEXT_PUBLIC_API_URL ;

    try {
      const res = await fetch(`${apiUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json(); // nunggu response dan parsing ke JSON

      if (res.ok) { // cek response statusnya 200-299(ok) 
        const token = data.token;
        if (token) {
          localStorage.setItem('token', token); //simpen token di localStorage
        }

    
        setMessage('Login berhasil! Mengarahkan...');
        setEmail('');
        setPassword('');
        setTimeout(() => router.push('/profile'), 600);
      } else {
        setMessage(`Error: ${data.message || 'Login gagal'}`); 
      }
    } catch (err) {
      setMessage('Error: Tidak dapat terhubung ke server.'); // server error
    }
  };

useEffect(() => {
  const token = localStorage.getItem('token');
  if (token) {
    router.push('/');
  }}, [router]);

  return (
    
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center text-gray-900">Login</h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="text-sm font-medium text-gray-700">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full text-black px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-black focus:border-black"
            />
          </div>
          <div>
            <label htmlFor="password" className="text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full text-black px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-black focus:border-black"
            />
          </div>
          <p className=' text-black'>Don't have an account? <a href="/register" className="text-blue-600 hover:underline">Register here</a></p>
          <div>
            <button
              type="submit"
              className="w-full px-4 py-2 text-sm font-medium text-white bg-black border border-transparent rounded-md shadow-sm hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
            >
              Login
            </button>
          </div>
        </form>
        {message && (
          <p
            className={`mt-4 text-center text-sm ${
              message.startsWith('Login berhasil') ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {message}
          </p>
        )}
      </div>
    </div>
    
  );
}