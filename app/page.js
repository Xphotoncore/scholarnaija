'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SearchBar from '@/components/SearchBar';
import { searchAPI } from '@/lib/api';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const [trending, setTrending] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTrending();
  }, []);

  const fetchTrending = async () => {
    try {
      setLoading(true);
      const response = await searchAPI.getTrendingNigeria();
      setTrending(response.data.trendingByDiscipline || []);
    } catch (error) {
      console.error('Error fetching trending:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query) => {
    router.push(`/search?q=${encodeURIComponent(query)}`);
  };

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">
              Free Academic Journal Access
            </h1>
            <p className="text-xl text-gray-600 mb-2">
              For Nigerian University Students
            </p>
            <p className="text-gray-500 text-lg">
              Discover, save, and cite academic papers from OpenAlex & Crossref
            </p>
          </div>

          {/* Search Bar */}
          <div className="mb-16">
            <SearchBar onSearch={handleSearch} />
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <div className="card p-6 text-center">
              <div className="text-4xl mb-4">🔍</div>
              <h3 className="font-bold mb-2">Smart Search</h3>
              <p className="text-gray-600 text-sm">
                Search papers by keywords, authors, institutions, and more
              </p>
            </div>
            <div className="card p-6 text-center">
              <div className="text-4xl mb-4">📚</div>
              <h3 className="font-bold mb-2">Save & Organize</h3>
              <p className="text-gray-600 text-sm">
                Create projects and save your favorite papers in one place
              </p>
            </div>
            <div className="card p-6 text-center">
              <div className="text-4xl mb-4">📝</div>
              <h3 className="font-bold mb-2">Citation Generator</h3>
              <p className="text-gray-600 text-sm">
                Generate citations in APA, MLA, Chicago, and Harvard formats
              </p>
            </div>
          </div>

          {/* Trending Disciplines */}
          {!loading && trending.length > 0 && (
            <section>
              <h2 className="text-3xl font-bold mb-8 text-gray-900">
                Trending Research Topics in Nigeria
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {trending.map((discipline) => (
                  <div key={discipline.discipline} className="card p-6">
                    <h3 className="text-xl font-bold mb-4" style={{ color: '#003f87' }}>
                      {discipline.discipline}
                    </h3>
                    <div className="space-y-3">
                      {discipline.papers?.slice(0, 3).map((paper, idx) => (
                        <div
                          key={idx}
                          onClick={() => router.push(`/paper/${encodeURIComponent(paper.id)}`)}
                          className="p-3 bg-gray-50 rounded hover:bg-gray-100 cursor-pointer transition-colors"
                        >
                          <p className="font-medium text-sm text-gray-900 line-clamp-2 mb-1">
                            {paper.title}
                          </p>
                          <div className="flex justify-between text-xs text-gray-600">
                            <span>{paper.year}</span>
                            <span>{paper.citationCount} citations</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() => handleSearch(discipline.discipline)}
                      className="mt-4 btn btn-secondary w-full"
                      style={{ borderColor: '#003f87', color: '#003f87' }}
                    >
                      View More
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}