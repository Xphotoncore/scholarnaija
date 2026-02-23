'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { projectsAPI } from '@/lib/api';
import { storage } from '@/lib/storage';

export default function ProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({ title: '', description: '' });

  const isLoggedIn = storage.isLoggedIn();

  useEffect(() => {
    if (!isLoggedIn) {
      router.push('/login');
      return;
    }
    loadProjects();
  }, [isLoggedIn]);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const response = await projectsAPI.getProjects();
      setProjects(response.data.projects || []);
    } catch (error) {
      console.error('Error loading projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!formData.title) {
      alert('Project title is required');
      return;
    }

    try {
      await projectsAPI.createProject(formData);
      setFormData({ title: '', description: '' });
      setShowCreateModal(false);
      loadProjects();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to create project');
    }
  };

  const handleDeleteProject = async (projectId) => {
    if (!confirm('Are you sure you want to delete this project?')) return;

    try {
      await projectsAPI.deleteProject(projectId);
      loadProjects();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to delete project');
    }
  };

  const handleExportProject = async (projectId, format) => {
    try {
      const response = await projectsAPI.exportProject(projectId, format);
      // Create download link
      const element = document.createElement('a');
      element.setAttribute('href', `data:text/plain;charset=utf-8,${encodeURIComponent(response.data)}`);
      element.setAttribute('download', `project_${projectId}.${format}`);
      element.style.display = 'none';
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    } catch (error) {
      alert('Failed to export project');
    }
  };

  if (!isLoggedIn) return null;

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900">My Projects</h1>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn btn-primary"
              style={{ backgroundColor: '#003f87' }}
            >
              + New Project
            </button>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="spinner mx-auto mb-4"></div>
              <p className="text-gray-600">Loading projects...</p>
            </div>
          ) : projects.length === 0 ? (
            <div className="card p-8 text-center">
              <p className="text-gray-600 text-lg mb-4">No projects yet</p>
              <p className="text-gray-500 mb-6">
                Create a project to start organizing your research papers
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="btn btn-primary"
                style={{ backgroundColor: '#003f87' }}
              >
                Create First Project
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => (
                <div key={project.id} className="card p-6 hover:shadow-lg transition-all">
                  <h3 className="text-xl font-bold mb-2 text-gray-900">
                    {project.title}
                  </h3>
                  {project.description && (
                    <p className="text-gray-600 text-sm mb-4">
                      {project.description}
                    </p>
                  )}

                  <div className="bg-gray-50 p-3 rounded mb-4">
                    <p className="text-sm text-gray-700">
                      <strong>{project.paperCount}</strong> papers saved
                    </p>
                  </div>

                  <div className="space-y-2">
                    <button
                      onClick={() => router.push(`/projects/${project.id}`)}
                      className="btn btn-secondary w-full"
                      style={{ borderColor: '#003f87', color: '#003f87' }}
                    >
                      View Papers
                    </button>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleExportProject(project.id, 'bib')}
                        className="btn btn-ghost text-xs"
                        style={{ color: '#003f87' }}
                      >
                        BibTeX
                      </button>
                      <button
                        onClick={() => handleExportProject(project.id, 'text')}
                        className="btn btn-ghost text-xs"
                        style={{ color: '#003f87' }}
                      >
                        Text
                      </button>
                    </div>

                    <button
                      onClick={() => handleDeleteProject(project.id)}
                      className="btn w-full text-red-600 hover:bg-red-50 border border-red-200"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Create Project Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="card p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Create New Project</h3>

            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label>Project Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Thesis Research"
                  required
                />
              </div>

              <div>
                <label>Description (Optional)</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="What's this project about?"
                  rows="3"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="btn btn-primary flex-1"
                  style={{ backgroundColor: '#003f87' }}
                >
                  Create
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setFormData({ title: '', description: '' });
                  }}
                  className="btn btn-secondary flex-1"
                  style={{ borderColor: '#003f87', color: '#003f87' }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
}