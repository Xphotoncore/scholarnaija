'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { authAPI } from '@/lib/api';
import { storage } from '@/lib/storage';

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    institution: ''
  });

  const isLoggedIn = storage.isLoggedIn();

  useEffect(() => {
    if (!isLoggedIn) {
      router.push('/login');
      return;
    }
    loadProfile();
  }, [isLoggedIn]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const response = await authAPI.getMe();
      const userData = response.data.user;
      setUser(userData);
      setFormData({
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        institution: userData.institution || ''
      });
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setSaving(true);

    try {
      const response = await authAPI.updateProfile(formData);
      storage.setUser(response.data.user);
      setUser(response.data.user);
      setMessage('Profile updated successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage(error.response?.data?.error || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (!isLoggedIn) return null;

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <button
            onClick={() => router.back()}
            className="text-blue-600 hover:text-blue-800 mb-6 flex items-center gap-2"
            style={{ color: '#003f87' }}
          >
            ← Back
          </button>

          <div className="card p-8">
            <h1 className="text-3xl font-bold mb-2 text-gray-900">Profile</h1>
            <p className="text-gray-600 mb-8">
              Manage your account information
            </p>

            {message && (
              <div className={`card p-4 mb-6 ${message.includes('success') ? 'bg-green-50 border-l-4' : 'bg-red-50 border-l-4'}`}
                style={message.includes('success') ? { borderColor: '#10b981' } : { borderColor: '#ef4444' }}>
                <p className={message.includes('success') ? 'text-green-800' : 'text-red-800'}>
                  {message}
                </p>
              </div>
            )}

            {loading ? (
              <div className="text-center py-12">
                <div className="spinner mx-auto mb-4"></div>
                <p className="text-gray-600">Loading profile...</p>
              </div>
            ) : user ? (
              <form onSubmit={handleSubmit} className="max-w-2xl">
                {/* Email (read-only) */}
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={user.email}
                    disabled
                    className="bg-gray-100"
                  />
                  <p className="text-sm text-gray-500 mt-2">
                    Email cannot be changed
                  </p>
                </div>

                {/* First Name */}
                <div className="form-group">
                  <label>First Name</label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    placeholder="Your first name"
                  />
                </div>

                {/* Last Name */}
                <div className="form-group">
                  <label>Last Name</label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    placeholder="Your last name"
                  />
                </div>

                {/* Institution */}
                <div className="form-group">
                  <label>Institution</label>
                  <input
                    type="text"
                    name="institution"
                    value={formData.institution}
                    onChange={handleChange}
                    placeholder="e.g., University of Lagos"
                  />
                </div>

                {/* Account Info */}
                <div className="bg-gray-50 p-6 rounded-lg mb-8">
                  <h3 className="font-bold text-gray-900 mb-4">Account Information</h3>
                  <div className="space-y-2 text-sm text-gray-600">
                    <p><strong>Member Since:</strong> {new Date(user.createdAt).toLocaleDateString()}</p>
                    <p><strong>Account Status:</strong> <span className="text-green-600 font-medium">Active</span></p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-4">
                  <button
                    type="submit"
                    disabled={saving}
                    className="btn btn-primary disabled:opacity-50"
                    style={{ backgroundColor: '#003f87' }}
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>

                  <button
                    type="button"
                    onClick={() => router.push('/dashboard')}
                    className="btn btn-secondary"
                    style={{ borderColor: '#003f87', color: '#003f87' }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : null}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}