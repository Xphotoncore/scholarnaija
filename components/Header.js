'use client';

import { useState } from 'react';
import Link from 'next/link';
import { storage } from '@/lib/storage';
import { useRouter } from 'next/navigation';

export default function Header() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(() => storage.isLoggedIn());
  const [menuOpen, setMenuOpen] = useState(false);
  const user = storage.getUser();

  const handleLogout = () => {
    storage.clearAll();
    setIsLoggedIn(false);
    router.push('/');
    setMenuOpen(false);
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 font-bold text-xl" style={{ color: '#003f87' }}>
            <span className="text-2xl">📚</span>
            ScholarNaija
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {isLoggedIn && (
              <>
                <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">
                  Dashboard
                </Link>
                <Link href="/projects" className="text-gray-600 hover:text-gray-900">
                  Projects
                </Link>
              </>
            )}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-4">
            {!isLoggedIn ? (
              <>
                <Link href="/login" className="hidden sm:block text-gray-600 hover:text-gray-900">
                  Sign In
                </Link>
                <Link href="/register" className="btn btn-primary hidden sm:inline-block" style={{ backgroundColor: '#003f87' }}>
                  Get Started
                </Link>
              </>
            ) : (
              <div className="relative">
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200"
                >
                  <span className="text-sm font-medium text-gray-700">{user?.email}</span>
                  <span className="text-xl">👤</span>
                </button>
                
                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2">
                    <Link href="/profile" className="block px-4 py-2 hover:bg-gray-50 text-gray-700">
                      Profile
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 hover:bg-gray-50 text-gray-700 text-sm"
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100"
            >
              <span className="text-xl">☰</span>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && !isLoggedIn && (
          <div className="md:hidden pb-4 border-t border-gray-200">
            <Link href="/login" className="block py-2 text-gray-600 hover:text-gray-900">
              Sign In
            </Link>
            <Link href="/register" className="block py-2 text-gray-600 hover:text-gray-900">
              Get Started
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}