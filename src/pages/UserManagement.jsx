import { useState, useEffect } from 'react';
import api from '../api';
import { Card, Button, Input, Select, Badge, Loader, EmptyState } from '../components/UI';
import toast from 'react-hot-toast';

const ROLE_OPTIONS = [
  { value: 'admin', label: 'Admin' },
  { value: 'subadmin', label: 'Sub-Admin' },
  { value: 'viewer', label: 'Report Viewer' }
];

const ROLE_COLORS = { admin: 'indigo', subadmin: 'blue', viewer: 'amber' };
const ROLE_LABELS = { admin: 'Admin', subadmin: 'Sub-Admin', viewer: 'Report Viewer' };

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [orgs, setOrgs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ username: '', password: '', name: '', role: 'subadmin', organization: '' });
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([
      api.get('/users'),
      api.get('/organizations')
    ]).then(([usersRes, orgsRes]) => {
      setUsers(usersRes.data);
      setOrgs(orgsRes.data);
    }).catch(() => toast.error('Failed to load'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const resetForm = () => {
    setForm({ username: '', password: '', name: '', role: 'subadmin', organization: '' });
    setEditingId(null);
    setShowForm(false);
  };

  const startEdit = (user) => {
    setForm({
      username: user.username,
      password: '',
      name: user.name,
      role: user.role,
      organization: user.organization?._id || ''
    });
    setEditingId(user._id);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.role) return toast.error('Name and role are required');
    if (!editingId && (!form.username.trim() || !form.password.trim())) return toast.error('Username and password required');
    if (!editingId && form.password.length < 6) return toast.error('Password must be at least 6 characters');
    if (form.role === 'viewer' && !form.organization) return toast.error('Organization is required for Report Viewer');

    setSaving(true);
    try {
      const payload = { ...form };
      if (editingId && !payload.password) delete payload.password;

      if (editingId) {
        await api.put(`/users/${editingId}`, payload);
        toast.success('User updated');
      } else {
        await api.post('/users', payload);
        toast.success('User created');
      }
      resetForm();
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (user) => {
    if (!confirm(`Delete user "${user.name}" (${user.username})?`)) return;
    try {
      await api.delete(`/users/${user._id}`);
      toast.success('User deleted');
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete');
    }
  };

  if (loading) return <Loader />;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-sm text-gray-500 mt-1">Create and manage admin, sub-admin and report viewer accounts</p>
        </div>
        <Button onClick={() => { resetForm(); setShowForm(!showForm); }}>
          {showForm ? 'Cancel' : '+ New User'}
        </Button>
      </div>

      {showForm && (
        <Card className="p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">{editingId ? 'Edit User' : 'Create New User'}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Input
                label="Name *"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="Full name"
              />
              <Input
                label="Username *"
                value={form.username}
                onChange={e => setForm({ ...form, username: e.target.value })}
                placeholder="Login username"
                disabled={!!editingId}
              />
              <Input
                label={editingId ? 'New Password (leave blank to keep)' : 'Password *'}
                type="password"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                placeholder={editingId ? 'Leave blank to keep current' : 'Min 6 characters'}
              />
              <Select
                label="Role *"
                value={form.role}
                onChange={e => setForm({ ...form, role: e.target.value, organization: e.target.value !== 'viewer' ? '' : form.organization })}
                options={ROLE_OPTIONS}
              />
              {form.role === 'viewer' && (
                <Select
                  label="Organization *"
                  value={form.organization}
                  onChange={e => setForm({ ...form, organization: e.target.value })}
                  options={[
                    { value: '', label: 'Select Organization' },
                    ...orgs.map(o => ({ value: o._id, label: o.name }))
                  ]}
                />
              )}
            </div>

            {/* Role info */}
            <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600">
              {form.role === 'admin' && '🔑 Admin — Full access. Can create and manage all users, organizations, tests, and reports.'}
              {form.role === 'subadmin' && '🛡️ Sub-Admin — Full access to manage organizations, tests, evaluations, and reports. Cannot create or manage users.'}
              {form.role === 'viewer' && '👁️ Report Viewer — Can only view evaluated reports for their assigned organization and download them.'}
            </div>

            <div className="flex gap-3">
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving...' : editingId ? 'Update User' : 'Create User'}
              </Button>
              <Button variant="secondary" onClick={resetForm}>Cancel</Button>
            </div>
          </form>
        </Card>
      )}

      {users.length === 0 ? (
        <Card>
          <EmptyState icon="👤" title="No users yet" description="Create your first user account" />
        </Card>
      ) : (
        <div className="grid gap-3">
          {users.map(user => (
            <Card key={user._id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-sm font-bold flex-shrink-0">
                    {user.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-gray-900">{user.name}</p>
                      <Badge color={ROLE_COLORS[user.role] || 'gray'}>{ROLE_LABELS[user.role] || user.role}</Badge>
                    </div>
                    <p className="text-xs text-gray-500">
                      @{user.username}
                      {user.role === 'viewer' && user.organization && (
                        <span className="ml-2 text-indigo-500">· {user.organization.name || 'N/A'}</span>
                      )}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Created {new Date(user.createdAt).toLocaleDateString()}
                      {user.createdBy && ` by ${user.createdBy.name}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={() => startEdit(user)}>Edit</Button>
                  <Button variant="ghost" size="sm" className="text-red-600 hover:bg-red-50" onClick={() => handleDelete(user)}>Delete</Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
