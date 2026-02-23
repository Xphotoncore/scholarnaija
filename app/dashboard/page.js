'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { authAPI, projectsAPI } from '@/lib/api';
import { storage } from '@/lib/storage';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  const isLoggedIn = storage.isLoggedIn();

  useEffect(() => {
    if (!isLoggedIn) {
      router.push('/login');
      return;
    }
    loadDashboard();
  }, [isLoggedIn]);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const [userRes, projectsRes] = await Promise.all([
        authAPI.getMe(),
        projectsAPI.getProjects()
      ]);

      setUser(userRes.data.user);
      setProjects(projectsRes.data.projects || []);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isLoggedIn) return null;

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Welcome Section */}
          {!loading && user && (
            <div className="card p-8 mb-12 bg-gradient-to-r" style={{ backgroundImage: 'linear-gradient(135deg, #003f87 0%, #0052b3 100%)' }}>
              <h1 className="text-4xl font-bold text-white mb-2">
                Welcome, {user.firstName || user.email}!
              </h1>
              <p className="text-blue-100">
                {user.institution && `from ${user.institution}`}
              </p>
            </div>
          )}

          {loading ? (
            <div className="text-center py-12">
              <div className="spinner mx-auto mb-4"></div>
              <p className="text-gray-600">Loading dashboard...</p>
            </div>
          ) : (
            <div className="space-y-12">
              {/* Quick Actions */}
              <section>
                <h2 className="text-2xl font-bold mb-6 text-gray-900">Quick Actions</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Link
                    href="/"
                    className="card p-6 hover:shadow-lg transition-all text-center cursor-pointer"
                  >
                    <div className="text-4xl mb-4">🔍</div>
                    <h3 className="font-bold text-lg mb-2">Search Papers</h3>
                    <p className="text-gray-600 text-sm">
                      Discover academic papers
                    </p>
                  </Link>

                  <Link
                    href="/projects"
                    className="card p-6 hover:shadow-lg transition-all text-center cursor-pointer"
                  >
                    <div className="text-4xl mb-4">📂</div>
                    <h3 className="font-bold text-lg mb-2">View Projects</h3>
                    <p className="text-gray-600 text-sm">
                      Manage your research projects
                    </p>
                  </Link>

                  <Link
                    href="/profile"
                    className="card p-6 hover:shadow-lg transition-all text-center cursor-pointer"
                  >
                    <div className="text-4xl mb-4">👤</div>
                    <h3 className="font-bold text-lg mb-2">Edit Profile</h3>
                    <p className="text-gray-600 text-sm">
                      Update your information
                    </p>
                  </Link>
                </div>
              </section>

              {/* Recent Projects */}
              {projects.length > 0 && (
                <section>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">Your Projects</h2>
                    <Link
                      href="/projects"
                      className="text-blue-600 hover:text-blue-800 font-medium"
                      style={{ color: '#003f87' }}
                    >
                      View All →
                    </Link>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {projects.slice(0, 4).map((project) => (
                      <Link
                        key={project.id}
                        href={`/projects/${project.id}`}
                        className="card p-6 hover:shadow-lg transition-all cursor-pointer"
                      >
                        <h3 className="text-lg font-bold mb-2 text-gray-900">
                          {project.title}
                        </h3>
                        {project.description && (
                          <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                            {project.description}
                          </p>
                        )}
                        <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                          <span className="text-sm text-gray-500">
                            {project.paperCount} papers
                          </span>
                          <span className="text-blue-600" style={{ color: '#003f87' }}>
                            →
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              {/* Stats Section */}
              <section>
                <h2 className="text-2xl font-bold mb-6 text-gray-900">Your Stats</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="card p-6 text-center">
                    <p className="text-4xl font-bold" style={{ color: '#003f87' }}>
                      {projects.length}
                    </p>
                    <p className="text-gray-600 mt-2">Active Projects</p>
                  </div>

                  <div className="card p-6 text-center">
                    <p className="text-4xl font-bold" style={{ color: '#003f87' }}>
                      {projects.reduce((sum, p) => sum + (p.paperCount || 0), 0)}
                    </p>
                    <p className="text-gray-600 mt-2">Papers Saved</p>
                  </div>

                  <div className="card p-6 text-center">
                    <p className="text-4xl font-bold" style={{ color: '#003f87' }}>
                      ✓
                    </p>
                    <p className="text-gray-600 mt-2">Account Active</p>
                  </div>
                </div>
              </section>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}