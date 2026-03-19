import { useState, useEffect } from 'react';
import api from '../api';
import { Card, Button, Input, Textarea, Badge, Loader, EmptyState } from '../components/UI';
import toast from 'react-hot-toast';

export default function Organizations() {
  const [orgs, setOrgs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ name: '', description: '' });
  const [saving, setSaving] = useState(false);

  const loadOrgs = () => {
    api.get('/organizations')
      .then(res => setOrgs(res.data))
      .catch(() => toast.error('Failed to load organizations'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadOrgs(); }, []);

  const resetForm = () => {
    setForm({ name: '', description: '' });
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Organization name is required');
    setSaving(true);
    try {
      if (editingId) {
        await api.put(`/organizations/${editingId}`, form);
        toast.success('Organization updated');
      } else {
        await api.post('/organizations', form);
        toast.success('Organization created');
      }
      resetForm();
      loadOrgs();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (org) => {
    setForm({ name: org.name, description: org.description || '' });
    setEditingId(org._id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this organization? This does not delete associated tests.')) return;
    try {
      await api.delete(`/organizations/${id}`);
      toast.success('Deleted');
      loadOrgs();
    } catch {
      toast.error('Failed to delete');
    }
  };

  if (loading) return <Loader />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Organizations</h1>
          <p className="text-sm text-gray-500 mt-1">Manage organizations for your mock test platform</p>
        </div>
        <Button onClick={() => { resetForm(); setShowForm(!showForm); }}>
          {showForm ? 'Cancel' : '+ Add Organization'}
        </Button>
      </div>

      {showForm && (
        <Card className="p-5 mb-6">
          <h2 className="text-base font-semibold mb-4">{editingId ? 'Edit' : 'New'} Organization</h2>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 md:grid-cols-2">
              <Input
                label="Organization Name *"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="e.g., Acme Corp"
              />
              <Textarea
                label="Description"
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                placeholder="Brief description of the organization"
                rows={1}
              />
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={resetForm}>Cancel</Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving...' : editingId ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {orgs.length === 0 ? (
        <Card>
          <EmptyState
            icon="🏢"
            title="No organizations yet"
            description="Create your first organization to start managing mock tests"
            action={<Button onClick={() => setShowForm(true)}>Add Organization</Button>}
          />
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {orgs.map(org => (
            <Card key={org._id} className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center text-lg font-bold">
                    {org.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-gray-900">{org.name}</h3>
                    <Badge color={org.isActive ? 'green' : 'red'}>
                      {org.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
              </div>
              {org.description && (
                <p className="text-sm text-gray-500 mb-3">{org.description}</p>
              )}
              <p className="text-xs text-gray-400 mb-4">
                Created {new Date(org.createdAt).toLocaleDateString()}
              </p>
              <div className="flex items-center gap-2">
                <Button variant="secondary" size="sm" onClick={() => handleEdit(org)}>Edit</Button>
                <Button variant="danger" size="sm" onClick={() => handleDelete(org._id)}>Delete</Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
