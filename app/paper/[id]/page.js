'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { papersAPI, citationsAPI, projectsAPI } from '@/lib/api';
import { storage } from '@/lib/storage';
import { copyToClipboard, downloadFile } from '@/lib/utils';

export default function PaperDetailPage() {
  const router = useRouter();
  const params = useParams();
  const paperId = params.id;

  const [paper, setPaper] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [citations, setCitations] = useState({});
  const [selectedFormat, setSelectedFormat] = useState('apa');
  const [projects, setProjects] = useState([]);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState('');

  const isLoggedIn = storage.isLoggedIn();

  useEffect(() => {
    loadPaper();
    if (isLoggedIn) {
      loadProjects();
    }
  }, [paperId]);

  useEffect(() => {
    if (paper?.doi) {
      fetchCitation(paper.doi, selectedFormat);
    }
  }, [paper?.doi, selectedFormat]);

  const loadPaper = async () => {
    try {
      setLoading(true);
      const response = await papersAPI.getPaper(paperId);
      setPaper(response.data.paper);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load paper');
    } finally {
      setLoading(false);
    }
  };

  const fetchCitation = async (doi, format) => {
    try {
      const response = await citationsAPI.getCitation(doi, format);
      setCitations({
        ...citations,
        [format]: response.data
      });
    } catch (error) {
      console.error('Citation fetch error:', error);
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

  const handleSave = () => {
    if (!isLoggedIn) {
      router.push('/login');
      return;
    }

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
      await papersAPI.savePaper(paperId, selectedProject);
      alert('Paper saved successfully!');
      setShowSaveModal(false);
      setSelectedProject('');
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to save paper');
    }
  };

  const handleCopyCitation = async () => {
    const citation = citations[selectedFormat]?.citation;
    if (citation) {
      const copied = await copyToClipboard(citation);
      alert(copied ? 'Citation copied to clipboard!' : 'Failed to copy citation');
    }
  };

  const handleDownloadBibtex = () => {
    const bibtex = citations[selectedFormat]?.bibtex;
    if (bibtex) {
      const filename = `${paper?.title?.slice(0, 30)}.bib`;
      downloadFile(bibtex, filename, 'application/x-bibtex');
    }
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="flex justify-center items-center min-h-screen">
          <div className="text-center">
            <div className="spinner mx-auto mb-4"></div>
            <p className="text-gray-600">Loading paper...</p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  if (error) {
    return (
      <>
        <Header />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="card p-8 bg-red-50 border-l-4" style={{ borderColor: '#ef4444' }}>
            <p className="text-red-800 text-lg">{error}</p>
            <button
              onClick={() => router.back()}
              className="btn btn-primary mt-4"
              style={{ backgroundColor: '#003f87' }}
            >
              Go Back
            </button>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  if (!paper) return null;

  const currentCitation = citations[selectedFormat];

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Back Button */}
          <button
            onClick={() => router.back()}
            className="text-blue-600 hover:text-blue-800 mb-6 flex items-center gap-2"
            style={{ color: '#003f87' }}
          >
            ← Back to Results
          </button>

          {/* Paper Header */}
          <div className="card p-8 mb-8">
            <div className="mb-6">
              {paper.is_oa && (
                <span className="badge badge-success mb-4">🔓 Open Access</span>
              )}
            </div>

            <h1 className="text-3xl font-bold mb-4 text-gray-900">{paper.title}</h1>

            {/* Authors */}
            {paper.authors && paper.authors.length > 0 && (
              <div className="mb-6">
                <p className="text-gray-700 mb-2">
                  <strong>Authors:</strong>
                </p>
                <div className="flex flex-wrap gap-2">
                  {paper.authors.map((author, idx) => (
                    <div
                      key={idx}
                      className="bg-gray-100 px-4 py-2 rounded-lg"
                    >
                      <p className="font-medium text-gray-900">{author.name}</p>
                      {author.institution && (
                        <p className="text-xs text-gray-600">{author.institution}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Meta Information */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-6 border-y border-gray-200 my-6">
              <div>
                <p className="text-gray-600 text-sm">Publication Year</p>
                <p className="text-xl font-bold" style={{ color: '#003f87' }}>
                  {paper.year || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Citations</p>
                <p className="text-xl font-bold" style={{ color: '#003f87' }}>
                  {paper.citation_count || 0}
                </p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Journal/Venue</p>
                <p className="font-semibold text-gray-900">
                  {paper.journal || 'Unknown'}
                </p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">DOI</p>
                <p className="font-semibold text-gray-900 truncate">
                  {paper.doi || 'N/A'}
                </p>
              </div>
            </div>

            {/* Abstract */}
            {paper.abstract && (
              <div className="mb-8">
                <h3 className="text-xl font-bold mb-4" style={{ color: '#003f87' }}>
                  Abstract
                </h3>
                <p className="text-gray-700 leading-relaxed">
                  {paper.abstract}
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap gap-3">
              {paper.is_oa && paper.pdf_url && (
                <a
                  href={paper.pdf_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary"
                  style={{ backgroundColor: '#003f87' }}
                >
                  📥 Download PDF
                </a>
              )}

              {paper.doi && (
                <a
                  href={`https://doi.org/${paper.doi}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary"
                  style={{ borderColor: '#003f87', color: '#003f87' }}
                >
                  🔗 View via DOI
                </a>
              )}

              {isLoggedIn && (
                <button
                  onClick={handleSave}
                  className="btn btn-secondary"
                  style={{ borderColor: '#003f87', color: '#003f87' }}
                >
                  💾 Save Paper
                </button>
              )}
            </div>
          </div>

          {/* Citation Generator */}
          {paper.doi && (
            <div className="card p-8">
              <h3 className="text-xl font-bold mb-6" style={{ color: '#003f87' }}>
                Citation Generator
              </h3>

              {/* Format Selection */}
              <div className="mb-6">
                <label className="block mb-2 font-medium">Citation Format</label>
                <div className="flex flex-wrap gap-2">
                  {['apa', 'mla', 'chicago', 'harvard'].map((format) => (
                    <button
                      key={format}
                      onClick={() => setSelectedFormat(format)}
                      className={`px-4 py-2 rounded font-medium transition-all ${
                        selectedFormat === format
                          ? 'text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                      style={
                        selectedFormat === format
                          ? { backgroundColor: '#003f87' }
                          : {}
                      }
                    >
                      {format.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Citation Display */}
              {currentCitation ? (
                <div>
                  <div className="bg-gray-50 p-4 rounded border border-gray-200 mb-4">
                    <p className="text-gray-900 leading-relaxed font-mono text-sm">
                      {currentCitation.citation}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={handleCopyCitation}
                      className="btn btn-secondary"
                      style={{ borderColor: '#003f87', color: '#003f87' }}
                    >
                      📋 Copy Citation
                    </button>
                    <button
                      onClick={handleDownloadBibtex}
                      className="btn btn-secondary"
                      style={{ borderColor: '#003f87', color: '#003f87' }}
                    >
                      📥 Download BibTeX
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <div className="spinner mx-auto mb-2"></div>
                  <p className="text-gray-600">Loading citation...</p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Save Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="card p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Save Paper</h3>
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