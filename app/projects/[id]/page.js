'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { projectsAPI, papersAPI } from '@/lib/api';
import { storage } from '@/lib/storage';
import { formatDate, downloadFile } from '@/lib/utils';

export default function ProjectDetailPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.id;

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const isLoggedIn = storage.isLoggedIn();

  useEffect(() => {
    if (!isLoggedIn) {
      router.push('/login');
      return;
    }
    loadProject();
  }, [projectId, isLoggedIn]);

  const loadProject = async () => {
    try {
      setLoading(true);
      const response = await projectsAPI.getProject(projectId);
      setProject(response.data.project);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load project');
    } finally {
      setLoading(false);
    }
  };

  const handleRemovePaper = async (paperId) => {
    if (!confirm('Remove this paper from the project?')) return;

    try {
      await papersAPI.removeSavedPaper(paperId);
      loadProject();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to remove paper');
    }
  };

  const handleExport = async (format) => {
    try {
      const response = await projectsAPI.exportProject(projectId, format);
      const filename = `${project.title}_references.${format === 'bib' ? 'bib' : 'txt'}`;
      downloadFile(response.data, filename);
    } catch (error) {
      alert('Failed to export');
    }
  };

  if (!isLoggedIn) return null;

  if (loading) {
    return (
      <>
        <Header />
        <div className="flex justify-center items-center min-h-screen">
          <div className="text-center">
            <div className="spinner mx-auto mb-4"></div>
            <p className="text-gray-600">Loading project...</p>
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

  if (!project) return null;

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="flex justify-between items-start gap-6 mb-8">
            <div>
              <button
                onClick={() => router.back()}
                className="text-blue-600 hover:text-blue-800 mb-4 flex items-center gap-2"
                style={{ color: '#003f87' }}
              >
                ← Back to Projects
              </button>
              <h1 className="text-4xl font-bold text-gray-900">{project.title}</h1>
              {project.description && (
                <p className="text-gray-600 mt-2">{project.description}</p>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handleExport('bib')}
                className="btn btn-secondary"
                style={{ borderColor: '#003f87', color: '#003f87' }}
              >
                📥 Export BibTeX
              </button>
              <button
                onClick={() => handleExport('text')}
                className="btn btn-secondary"
                style={{ borderColor: '#003f87', color: '#003f87' }}
              >
                📥 Export Text
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="card p-4 text-center">
              <p className="text-3xl font-bold" style={{ color: '#003f87' }}>
                {project.paperCount || 0}
              </p>
              <p className="text-gray-600 text-sm">Papers</p>
            </div>
          </div>

          {/* Papers List */}
          {(!project.savedPapers || project.savedPapers.length === 0) ? (
            <div className="card p-8 text-center">
              <p className="text-gray-600 text-lg mb-4">No papers in this project yet</p>
              <button
                onClick={() => router.push('/')}
                className="btn btn-primary"
                style={{ backgroundColor: '#003f87' }}
              >
                Search & Add Papers
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {project.savedPapers.map((paper) => (
                <div key={paper.id} className="card p-6 hover:shadow-lg transition-all">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {paper.title}
                      </h3>
                      <p className="text-sm text-gray-600 mb-2">
                        {paper.authors || 'Unknown authors'}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        {paper.doi && (
                          <a
                            href={`https://doi.org/${paper.doi}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800"
                            style={{ color: '#003f87' }}
                          >
                            DOI: {paper.doi}
                          </a>
                        )}
                        <span>{formatDate(paper.saved_at)}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleRemovePaper(paper.id)}
                      className="btn text-red-600 hover:bg-red-50 border border-red-200"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}