'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SearchBar from '@/components/SearchBar';
import PaperCard from '@/components/PaperCard';
import { searchAPI, papersAPI, projectsAPI } from '@/lib/api';
import { storage } from '@/lib/storage';

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';

  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [pageSize, setPageSize] = useState(20);

  // Filters
  const [yearMin, setYearMin] = useState('');
  const [yearMax, setYearMax] = useState(new Date().getFullYear());
  const [sortBy, setSortBy] = useState('cited_by_count');
  const [openAccessOnly, setOpenAccessOnly] = useState(false);

  // Projects for saving
  const [projects, setProjects] = useState([]);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [selectedPaper, setSelectedPaper] = useState(null);
  const [selectedProject, setSelectedProject] = useState('');

  const isLoggedIn = storage.isLoggedIn();

  useEffect(() => {
    if (query) {
      performSearch();
    }
    if (isLoggedIn) {
      loadProjects();
    }
  }, [query, page, yearMin, yearMax, sortBy, openAccessOnly]);

  const performSearch = async () => {
    if (!query) return;

    setLoading(true);
    setError('');

    try {
      const response = await searchAPI.searchPapers({
        q: query,
        year_min: yearMin || undefined,
        year_max: yearMax || undefined,
        sort: sortBy,
        open_access_only: openAccessOnly,
        page,
        page_size: pageSize
      });

      setPapers(response.data.results || []);
      setTotalCount(response.data.totalCount || 0);
    } catch (err) {
      setError(err.response?.data?.error || 'Search failed. Please try again.');
      setPapers([]);
    } finally {
      setLoading(false);
    }
  };

  const loadProjects = async () => {
    try {
      const response = await projectsAPI.getProjects();
      setProjects(response.data.projects || []);
    } catch (error) {
      console.error('Error loading projects:', error);
    }
  };

  const handleSave = (paper) => {
    if (!isLoggedIn) {
      router.push('/login');
      return;
    }

    setSelectedPaper(paper);
    if (projects.length === 0) {
      alert('Please create a project first');
      router.push('/projects');
    } else {
      setShowSaveModal(true);
    }
  };

  const confirmSave = async () => {
    if (!selectedProject) {
      alert('Please select a project');
      return;
    }

    try {
      await papersAPI.savePaper(selectedPaper.openalexId, selectedProject);
      alert('Paper saved successfully!');
      setShowSaveModal(false);
      setSelectedPaper(null);
      setSelectedProject('');
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to save paper');
    }
  };

  const handleNewSearch = (searchQuery) => {
    setPage(1);
    router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Search Bar */}
          <div className="mb-8">
            <SearchBar onSearch={handleNewSearch} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Filters Sidebar */}
            <div className="lg:col-span-1">
              <div className="card p-6 sticky top-20">
                <h3 className="font-bold mb-6" style={{ color: '#003f87' }}>Filters</h3>

                {/* Year Range */}
                <div className="form-group">
                  <label className="block mb-2">Year Range</label>
                  <input
                    type="number"
                    placeholder="From"
                    value={yearMin}
                    onChange={(e) => {
                      setYearMin(e.target.value);
                      setPage(1);
                    }}
                    className="w-full px-3 py-2 border rounded mb-2"
                  />
                  <input
                    type="number"
                    placeholder="To"
                    value={yearMax}
                    onChange={(e) => {
                      setYearMax(e.target.value);
                      setPage(1);
                    }}
                    className="w-full px-3 py-2 border rounded"
                  />
                </div>

                {/* Sort */}
                <div className="form-group">
                  <label>Sort By</label>
                  <select
                    value={sortBy}
                    onChange={(e) => {
                      setSortBy(e.target.value);
                      setPage(1);
                    }}
                    className="w-full px-3 py-2 border rounded"
                  >
                    <option value="cited_by_count">Citation Count</option>
                    <option value="-publication_year">Recent</option>
                    <option value="relevance">Relevance</option>
                  </select>
                </div>

                {/* Open Access */}
                <div className="form-group">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={openAccessOnly}
                      onChange={(e) => {
                        setOpenAccessOnly(e.target.checked);
                        setPage(1);
                      }}
                      className="mr-2"
                    />
                    <span className="text-sm">Open Access Only</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Results */}
            <div className="lg:col-span-3">
              {error && (
                <div className="card p-4 mb-6 bg-red-50 border-l-4" style={{ borderColor: '#ef4444' }}>
                  <p className="text-red-800">{error}</p>
                </div>
              )}

              {loading && (
                <div className="text-center py-12">
                  <div className="spinner mx-auto mb-4"></div>
                  <p className="text-gray-600">Searching papers...</p>
                </div>
              )}

              {!loading && papers.length === 0 && query && (
                <div className="card p-8 text-center">
                  <p className="text-gray-600 text-lg mb-4">No papers found for "{query}"</p>
                  <p className="text-gray-500">Try different keywords or adjust your filters</p>
                </div>
              )}

              {!loading && papers.length > 0 && (
                <>
                  <div className="mb-4 flex justify-between items-center">
                    <p className="text-gray-600">
                      Showing <strong>{(page - 1) * pageSize + 1}</strong> to{' '}
                      <strong>{Math.min(page * pageSize, totalCount)}</strong> of{' '}
                      <strong>{totalCount}</strong> results
                    </p>
                  </div>

                  {papers.map((paper) => (
                    <PaperCard
                      key={paper.openalexId || paper.id}
                      paper={paper}
                      onSave={handleSave}
                    />
                  ))}

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex justify-between items-center mt-8">
                      <button
                        onClick={() => setPage(Math.max(1, page - 1))}
                        disabled={page === 1}
                        className="btn btn-secondary disabled:opacity-50"
                      >
                        ← Previous
                      </button>
                      <span className="text-gray-600">
                        Page {page} of {totalPages}
                      </span>
                      <button
                        onClick={() => setPage(Math.min(totalPages, page + 1))}
                        disabled={page === totalPages}
                        className="btn btn-secondary disabled:opacity-50"
                      >
                        Next →
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Save Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="card p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Save Paper</h3>
            <p className="text-gray-600 mb-4 text-sm">
              {selectedPaper?.title}
            </p>

            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="w-full px-3 py-2 border rounded mb-4"
            >
              <option value="">Select a project...</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.title}
                </option>
              ))}
            </select>

            <div className="flex gap-2">
              <button
                onClick={confirmSave}
                className="btn btn-primary flex-1"
                style={{ backgroundColor: '#003f87' }}
              >
                Save
              </button>
              <button
                onClick={() => setShowSaveModal(false)}
                className="btn btn-secondary flex-1"
                style={{ borderColor: '#003f87', color: '#003f87' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
}