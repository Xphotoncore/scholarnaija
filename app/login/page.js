'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { authAPI } from '@/lib/api';
import { storage } from '@/lib/storage';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authAPI.login(formData);
      storage.setToken(response.data.token);
      storage.setUser(response.data.user);
      router.push('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50 flex items-center py-12 px-4">
        <div className="max-w-md w-full mx-auto">
          <div className="card p-8">
            <h1 className="text-3xl font-bold mb-2 text-center text-gray-900">
              Sign In
            </h1>
            <p className="text-center text-gray-600 mb-6">
              Welcome back to ScholarNaija
            </p>

            {error && (
              <div className="card p-4 bg-red-50 border-l-4 mb-6" style={{ borderColor: '#ef4444' }}>
                <p className="text-red-800">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label>Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="your@email.com"
                />
              </div>

              <div>
                <label>Password</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary w-full disabled:opacity-50"
                style={{ backgroundColor: '#003f87' }}
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            <p className="text-center text-gray-600 mt-6">
              Don't have an account?{' '}
              <Link href="/register" className="font-bold" style={{ color: '#003f87' }}>
                Register here
              </Link>
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}