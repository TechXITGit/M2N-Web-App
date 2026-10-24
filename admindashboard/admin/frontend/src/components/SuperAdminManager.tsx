import React, { useEffect, useState } from 'react';
import axios from 'axios';
import useAuthStore from '../store/authStore';

interface AdminUser {
  _id: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
  permissions?: string[];
}

interface Receptionist {
  _id: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
  permissions?: string[];
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

  // Unified form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'admin', // default to admin
    hotelId: '',
    permissions: [] as string[]
  });

  const [editMode, setEditMode] = useState<{ id: string, type: 'admin' | 'receptionist' } | null>(null);

  const availablePermissions = [
    { id: 'hotels', label: 'Hotel & Room Management' },
    { id: 'global_categories', label: 'Room Categories' },
    { id: 'bookings', label: 'Bookings & Inventory' }
  ];

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
      const { data } = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/admin`, getConfig());
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
      const { data } = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/receptionists`, getConfig());
      setReceptionists(data);
    } catch (err: any) {
      console.error(err);
    }
  };

  const fetchHotels = async () => {
    try {
      const { data } = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/hotels`, getConfig());
      setHotels(data);
    } catch (err: any) {
      console.error(err);
    }
  };

  const handlePermissionChange = (permId: string) => {
    setFormData(prev => {
      const perms = [...prev.permissions];
      if (perms.includes(permId)) {
        return { ...prev, permissions: perms.filter(p => p !== permId) };
      } else {
        perms.push(permId);
        return { ...prev, permissions: perms };
      }
    });
  };

  const handleUnifiedSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      if (editMode) {
        if (editMode.type === 'admin') {
          await axios.put(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/admin/${editMode.id}`, formData, getConfig());
        } else {
          await axios.put(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/receptionists/${editMode.id}`, formData, getConfig());
        }
        setEditMode(null);
      } else {
        if (formData.role === 'admin') {
          await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/admin`, formData, getConfig());
        } else {
          if (!formData.hotelId) {
            setError('Please assign a hotel to the receptionist.');
            return;
          }
          await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/receptionists`, formData, getConfig());
        }
      }

      setFormData({ name: '', email: '', password: '', phone: '', role: 'admin', hotelId: '', permissions: [] });
      fetchAdmins();
      fetchReceptionists();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Action failed');
    }
  };

  const handleDeleteAdmin = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this admin?')) {
      try {
        await axios.delete(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/admin/${id}`, getConfig());
        fetchAdmins();
      } catch (err: any) {
        setError(err.response?.data?.message || 'Delete failed');
      }
    }
  };

  const handleReset2FA = async (id: string) => {
    if (window.confirm('Are you sure you want to reset 2FA for this admin? They will have to re-configure it on their next login.')) {
      try {
        await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/admin/${id}/reset-2fa`, {}, getConfig());
        alert('2FA reset successfully.');
        fetchAdmins();
      } catch (err: any) {
        setError(err.response?.data?.message || '2FA Reset failed');
      }
    }
  };

  const handleEditAdmin = (admin: AdminUser) => {
    setEditMode({ id: admin._id, type: 'admin' });
    setFormData({
      name: admin.name,
      email: admin.email,
      password: '',
      phone: admin.phone || '',
      role: 'admin',
      hotelId: '',
      permissions: admin.permissions || []
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteReceptionist = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this receptionist?')) {
      try {
        await axios.delete(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/receptionists/${id}`, getConfig());
        fetchReceptionists();
      } catch (err: any) {
        setError(err.response?.data?.message || 'Delete failed');
      }
    }
  };

  const handleEditReceptionist = (rec: Receptionist) => {
    setEditMode({ id: rec._id, type: 'receptionist' });
    setFormData({
      name: rec.name,
      email: rec.email,
      password: '',
      phone: rec.phone || '',
      role: 'receptionist',
      hotelId: rec.hotelId?._id || '',
      permissions: rec.permissions || []
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (user?.role !== 'superadmin') {
    return <div className="text-red-500">Access Denied</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="t-section text-2xl">Manage Users & Roles</h2>
      </div>

      {error && <div className="p-4 mb-6 bg-red-100 text-red-700">{error}</div>}

      {/* UNIFIED CREATION FORM */}
      <div className="bg-white p-6 shadow-sm border border-gray-200 rounded-lg mb-12 max-w-4xl">
        <h2 className="t-section text-xl mb-6">{editMode ? 'Edit User' : 'Role & Access Management'}</h2>
        <form onSubmit={handleUnifiedSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
            <div>
              <label className="u-label-sm block mb-2">Role</label>
              <select
                className="field w-full"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                disabled={!!editMode} // Cannot change role once created
              >
                <option value="admin">Admin</option>
                <option value="receptionist">Receptionist</option>
              </select>
            </div>

            {formData.role === 'receptionist' && (
              <div>
                <label className="u-label-sm block mb-2">Assigned Hotel</label>
                <select
                  className="field w-full"
                  value={formData.hotelId}
                  onChange={(e) => setFormData({ ...formData, hotelId: e.target.value })}
                  required={formData.role === 'receptionist'}
                >
                  <option value="" disabled>Select a hotel...</option>
                  {hotels.map((h) => (
                    <option key={h._id} value={h._id}>{h.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="pt-6 border-t border-gray-100">
            <h3 className="u-label-sm mb-4">Section Permissions (Check to grant access)</h3>
            <div className="flex flex-wrap gap-6">
              {availablePermissions.map(perm => (
                <label key={perm.id} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-black focus:ring-black border-gray-300 rounded"
                    checked={formData.permissions.includes(perm.id)}
                    onChange={() => handlePermissionChange(perm.id)}
                  />
                  <span className="text-sm font-medium text-gray-700">{perm.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button type="submit" className="btn-outline w-48 justify-center">
              {editMode ? 'Update User' : 'Create User'}
            </button>
            {editMode && (
              <button
                type="button"
                onClick={() => { setEditMode(null); setFormData({ name: '', email: '', password: '', phone: '', role: 'admin', hotelId: '', permissions: [] }); }}
                className="u-label hover:underline text-gray-500"
              >
                Cancel Edit
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="grid grid-cols-1 gap-10">
        {/* ADMINISTRATORS LIST */}
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
                        <button onClick={() => handleEditAdmin(admin)} className="text-blue-600 hover:underline text-sm font-semibold">Edit</button>
                        {admin.role !== 'superadmin' && (
                          <>
                            <button onClick={() => handleReset2FA(admin._id)} className="text-orange-600 hover:underline text-sm font-semibold">Reset 2FA</button>
                            <button onClick={() => handleDeleteAdmin(admin._id)} className="text-red-600 hover:underline text-sm font-semibold">Delete</button>
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

        {/* RECEPTIONISTS LIST */}
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
                        <button onClick={() => handleEditReceptionist(rec)} className="text-blue-600 hover:underline text-sm font-semibold">Edit</button>
                        <button onClick={() => handleDeleteReceptionist(rec._id)} className="text-red-600 hover:underline text-sm font-semibold">Delete</button>
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
  );
};

export default SuperAdminManager;
