import React, { useEffect, useState } from 'react';
import axios from 'axios';
import useAuthStore from '../store/authStore';

interface AdminUser {
  _id: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
}

interface Receptionist {
  _id: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
  hotelId: {
    _id: string;
    name: string;
  };
}

interface Hotel {
  _id: string;
  name: string;
}

const SuperAdminManager: React.FC = () => {
  const { user } = useAuthStore();
  
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [receptionists, setReceptionists] = useState<Receptionist[]>([]);
  const [hotels, setHotels] = useState<Hotel[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({ name: '', email: '', password: '', phone: '' });
  const [editMode, setEditMode] = useState<string | null>(null);

  const [recFormData, setRecFormData] = useState({ name: '', email: '', password: '', phone: '', hotelId: '' });
  const [recEditMode, setRecEditMode] = useState<string | null>(null);

  useEffect(() => {
    if (user?.role === 'superadmin') {
      fetchAdmins();
      fetchReceptionists();
      fetchHotels();
    }
  }, [user]);

  const getConfig = () => ({
    headers: {
      Authorization: `Bearer ${user?.token}`,
    },
  });

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:6001/api'}/admin`, getConfig());
      const formattedData = data.map((admin: any) => ({
        ...admin,
        _id: admin._id || admin.id
      }));
      setAdmins(formattedData);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch admins');
    } finally {
      setLoading(false);
    }
  };

  const fetchReceptionists = async () => {
    try {
      const { data } = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:6001/api'}/receptionists`, getConfig());
      setReceptionists(data);
    } catch (err: any) {
      console.error(err);
    }
  };

  const fetchHotels = async () => {
    try {
      const { data } = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:6001/api'}/hotels`, getConfig());
      setHotels(data);
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleCreateOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editMode) {
        await axios.put(`${import.meta.env.VITE_API_URL || 'http://localhost:6001/api'}/admin/${editMode}`, formData, getConfig());
        setEditMode(null);
      } else {
        await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:6001/api'}/admin`, formData, getConfig());
      }
      setFormData({ name: '', email: '', password: '', phone: '' });
      fetchAdmins();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Action failed');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this admin?')) {
      try {
        await axios.delete(`${import.meta.env.VITE_API_URL || 'http://localhost:6001/api'}/admin/${id}`, getConfig());
        fetchAdmins();
      } catch (err: any) {
        setError(err.response?.data?.message || 'Delete failed');
      }
    }
  };

  const handleReset2FA = async (id: string) => {
    if (window.confirm('Are you sure you want to reset 2FA for this admin? They will have to re-configure it on their next login.')) {
      try {
        await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:6001/api'}/admin/${id}/reset-2fa`, {}, getConfig());
        alert('2FA reset successfully.');
        fetchAdmins();
      } catch (err: any) {
        setError(err.response?.data?.message || '2FA Reset failed');
      }
    }
  };

  const handleEdit = (admin: AdminUser) => {
    setEditMode(admin._id);
    setFormData({ name: admin.name, email: admin.email, password: '', phone: admin.phone || '' });
  };

  const handleRecCreateOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (recEditMode) {
        await axios.put(`${import.meta.env.VITE_API_URL || 'http://localhost:6001/api'}/receptionists/${recEditMode}`, recFormData, getConfig());
        setRecEditMode(null);
      } else {
        await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:6001/api'}/receptionists`, recFormData, getConfig());
      }
      setRecFormData({ name: '', email: '', password: '', phone: '', hotelId: '' });
      fetchReceptionists();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Receptionist action failed');
    }
  };

  const handleRecDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this receptionist?')) {
      try {
        await axios.delete(`${import.meta.env.VITE_API_URL || 'http://localhost:6001/api'}/receptionists/${id}`, getConfig());
        fetchReceptionists();
      } catch (err: any) {
        setError(err.response?.data?.message || 'Delete failed');
      }
    }
  };

  const handleRecEdit = (rec: Receptionist) => {
    setRecEditMode(rec._id);
    setRecFormData({ name: rec.name, email: rec.email, password: '', phone: rec.phone || '', hotelId: rec.hotelId?._id || '' });
  };

  if (user?.role !== 'superadmin') {
    return <div className="text-red-500">Access Denied</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="t-section text-2xl">Manage Administrators & Receptionists</h2>
      </div>

      {error && <div className="p-4 mb-6 bg-red-100 text-red-700">{error}</div>}

      {/* ADMINISTRATORS SECTION */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-12">
        <div className="md:col-span-1">
          <div className="bg-white p-6 shadow-sm border border-gray-200 rounded-lg">
            <h2 className="t-section text-xl mb-6">{editMode ? 'Edit Admin' : 'Create Admin'}</h2>
            <form onSubmit={handleCreateOrUpdate} className="space-y-6">
              <div>
                <label className="u-label-sm block mb-2">Name</label>
                <input
                  type="text"
                  className="field w-full"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="u-label-sm block mb-2">Email</label>
                <input
                  type="email"
                  className="field w-full"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="u-label-sm block mb-2">Phone Number</label>
                <input
                  type="tel"
                  className="field w-full"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="u-label-sm block mb-2">
                  Password {editMode && '(Leave blank to keep current)'}
                </label>
                <input
                  type="password"
                  className="field w-full"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required={!editMode}
                />
              </div>
              <div className="flex gap-4">
                <button type="submit" className="btn-outline w-full justify-center">
                  {editMode ? 'Update' : 'Create'}
                </button>
                {editMode && (
                  <button 
                    type="button" 
                    onClick={() => { setEditMode(null); setFormData({ name: '', email: '', password: '', phone: '' }); }}
                    className="u-label hover:underline text-gray-500"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>

        <div className="md:col-span-2">
          <div className="bg-white p-6 shadow-sm border border-gray-200 rounded-lg">
            <h2 className="t-section text-xl mb-6">Administrators List</h2>
            {loading ? (
              <p>Loading...</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="p-3 u-label">Name</th>
                      <th className="p-3 u-label">Email</th>
                      <th className="p-3 u-label">Phone</th>
                      <th className="p-3 u-label">Role</th>
                      <th className="p-3 u-label">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {admins.map((admin) => (
                      <tr key={admin._id} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="p-3">{admin.name}</td>
                        <td className="p-3">{admin.email}</td>
                        <td className="p-3">{admin.phone || '-'}</td>
                        <td className="p-3 capitalize">{admin.role}</td>
                        <td className="p-3 flex gap-4">
                          <button onClick={() => handleEdit(admin)} className="text-blue-600 hover:underline text-sm font-semibold">Edit</button>
                          {admin.role !== 'superadmin' && (
                            <>
                              <button onClick={() => handleReset2FA(admin._id)} className="text-orange-600 hover:underline text-sm font-semibold">Reset 2FA</button>
                              <button onClick={() => handleDelete(admin._id)} className="text-red-600 hover:underline text-sm font-semibold">Delete</button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                    {admins.length === 0 && (
                      <tr>
                        <td colSpan={5} className="p-4 text-center text-gray-500">No administrators found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* RECEPTIONISTS SECTION */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
        <div className="md:col-span-1">
          <div className="bg-white p-6 shadow-sm border border-gray-200 rounded-lg">
            <h2 className="t-section text-xl mb-6">{recEditMode ? 'Edit Receptionist' : 'Create Receptionist'}</h2>
            <form onSubmit={handleRecCreateOrUpdate} className="space-y-6">
              <div>
                <label className="u-label-sm block mb-2">Name</label>
                <input
                  type="text"
                  className="field w-full"
                  value={recFormData.name}
                  onChange={(e) => setRecFormData({ ...recFormData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="u-label-sm block mb-2">Email</label>
                <input
                  type="email"
                  className="field w-full"
                  value={recFormData.email}
                  onChange={(e) => setRecFormData({ ...recFormData, email: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="u-label-sm block mb-2">Phone Number</label>
                <input
                  type="tel"
                  className="field w-full"
                  value={recFormData.phone}
                  onChange={(e) => setRecFormData({ ...recFormData, phone: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="u-label-sm block mb-2">Assigned Hotel</label>
                <select 
                  className="field w-full"
                  value={recFormData.hotelId}
                  onChange={(e) => setRecFormData({ ...recFormData, hotelId: e.target.value })}
                  required
                >
                  <option value="" disabled>Select a hotel...</option>
                  {hotels.map((h) => (
                    <option key={h._id} value={h._id}>{h.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="u-label-sm block mb-2">
                  Password {recEditMode && '(Leave blank to keep current)'}
                </label>
                <input
                  type="password"
                  className="field w-full"
                  value={recFormData.password}
                  onChange={(e) => setRecFormData({ ...recFormData, password: e.target.value })}
                  required={!recEditMode}
                />
              </div>
              <div className="flex gap-4">
                <button type="submit" className="btn-outline w-full justify-center">
                  {recEditMode ? 'Update' : 'Create'}
                </button>
                {recEditMode && (
                  <button 
                    type="button" 
                    onClick={() => { setRecEditMode(null); setRecFormData({ name: '', email: '', password: '', phone: '', hotelId: '' }); }}
                    className="u-label hover:underline text-gray-500"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>

        <div className="md:col-span-2">
          <div className="bg-white p-6 shadow-sm border border-gray-200 rounded-lg">
            <h2 className="t-section text-xl mb-6">Receptionist List</h2>
            {loading ? (
              <p>Loading...</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="p-3 u-label">Name</th>
                      <th className="p-3 u-label">Email</th>
                      <th className="p-3 u-label">Hotel</th>
                      <th className="p-3 u-label">Phone</th>
                      <th className="p-3 u-label">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {receptionists.map((rec) => (
                      <tr key={rec._id} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="p-3">{rec.name}</td>
                        <td className="p-3">{rec.email}</td>
                        <td className="p-3">{rec.hotelId?.name || 'Unknown'}</td>
                        <td className="p-3">{rec.phone || '-'}</td>
                        <td className="p-3 flex gap-4">
                          <button onClick={() => handleRecEdit(rec)} className="text-blue-600 hover:underline text-sm font-semibold">Edit</button>
                          <button onClick={() => handleRecDelete(rec._id)} className="text-red-600 hover:underline text-sm font-semibold">Delete</button>
                        </td>
                      </tr>
                    ))}
                    {receptionists.length === 0 && (
                      <tr>
                        <td colSpan={5} className="p-4 text-center text-gray-500">No receptionists found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminManager;
