import { useState, useEffect } from 'react';
import api from '../api';
import { Card, Button, Input, Select, Badge, Loader, EmptyState } from '../components/UI';
import toast from 'react-hot-toast';

const ROLE_LABELS = { agent: 'Agent', tl: 'Team Leader', qa: 'QA' };
const ROLE_COLORS = { agent: 'blue', tl: 'purple', qa: 'amber' };

export default function ManageTests() {
  const [tests, setTests] = useState([]);
  const [papers, setPapers] = useState([]);
  const [orgs, setOrgs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [filterOrg, setFilterOrg] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [form, setForm] = useState({
    title: '',
    organization: '',
    targetRole: 'agent',
    questionPaper: '',
    timerMode: 'full',
    fullTimerMinutes: 30
  });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    api.get('/organizations').then(res => setOrgs(res.data)).catch(() => { });
  }, []);

  const loadData = async () => {
    try {
      const params = new URLSearchParams();
      if (filterOrg) params.set('organization', filterOrg);
      if (filterRole) params.set('targetRole', filterRole);
      const [testsRes, papersRes] = await Promise.all([
        api.get(`/tests?${params.toString()}`),
        api.get('/question-papers')
      ]);
      setTests(testsRes.data);
      setPapers(papersRes.data);
    } catch {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [filterOrg, filterRole]);

  // Filter papers based on selected org & role in form
  const filteredPapers = papers.filter(p => {
    if (form.organization && (p.organization?._id || p.organization) !== form.organization) return false;
    if (form.targetRole && p.targetRole !== form.targetRole) return false;
    return true;
  });

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return toast.error('Title is required');
    if (!form.organization) return toast.error('Select an organization');
    if (!form.questionPaper) return toast.error('Select a question paper');

    setCreating(true);
    try {
      await api.post('/tests', form);
      toast.success('Test created');
      setShowCreate(false);
      setForm({ title: '', organization: '', targetRole: 'agent', questionPaper: '', timerMode: 'full', fullTimerMinutes: 30 });
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create test');
    } finally {
      setCreating(false);
    }
  };

  const handleToggle = async (id) => {
    try {
      await api.patch(`/tests/${id}/toggle`);
      loadData();
    } catch {
      toast.error('Failed to toggle');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this test?')) return;
    try {
      await api.delete(`/tests/${id}`);
      toast.success('Deleted');
      loadData();
    } catch {
      toast.error('Failed to delete');
    }
  };

  const getTestLink = (uniqueLink) => `${window.location.origin}/test/${uniqueLink}`;

  const copyLink = (uniqueLink) => {
    navigator.clipboard.writeText(getTestLink(uniqueLink));
    toast.success('Link copied to clipboard!');
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manage Tests</h1>
          <p className="text-sm text-gray-500 mt-1">Create tests and generate shareable links</p>
        </div>
        <Button onClick={() => setShowCreate(!showCreate)}>
          {showCreate ? 'Cancel' : '+ Create Test'}
        </Button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <Select
          label="Filter by Organization"
          value={filterOrg}
          onChange={e => setFilterOrg(e.target.value)}
          options={[
            { value: '', label: 'All Organizations' },
            ...orgs.map(o => ({ value: o._id, label: o.name }))
          ]}
        />
        <Select
          label="Filter by Role"
          value={filterRole}
          onChange={e => setFilterRole(e.target.value)}
          options={[
            { value: '', label: 'All Roles' },
            { value: 'agent', label: 'Agent' },
            { value: 'tl', label: 'Team Leader (TL)' },
            { value: 'qa', label: 'QA' },
          ]}
        />
      </div>

      {/* Create Form */}
      {showCreate && (
        <Card className="p-5 mb-6">
          <h2 className="text-base font-semibold mb-4">New Test</h2>
          <form onSubmit={handleCreate}>
            <div className="grid gap-4 md:grid-cols-2">
              <Input
                label="Test Title *"
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                placeholder="e.g., March Live Chat Mock Test - Agents"
              />
              <Select
                label="Organization *"
                value={form.organization}
                onChange={e => setForm({ ...form, organization: e.target.value, questionPaper: '' })}
                options={[
                  { value: '', label: 'Select Organization' },
                  ...orgs.map(o => ({ value: o._id, label: o.name }))
                ]}
              />
              <Select
                label="Target Role *"
                value={form.targetRole}
                onChange={e => setForm({ ...form, targetRole: e.target.value, questionPaper: '' })}
                options={[
                  { value: 'agent', label: 'Agent' },
                  { value: 'tl', label: 'Team Leader (TL)' },
                  { value: 'qa', label: 'QA' },
                ]}
              />
              <Select
                label="Question Paper *"
                value={form.questionPaper}
                onChange={e => setForm({ ...form, questionPaper: e.target.value })}
                options={[
                  { value: '', label: form.organization ? 'Select a question paper' : 'Select organization first' },
                  ...filteredPapers.map(p => ({ value: p._id, label: `${p.title} (${p.questions?.length || 0} Q, ${p.totalMarks} marks)` }))
                ]}
              />
              <Select
                label="Timer Mode"
                value={form.timerMode}
                onChange={e => setForm({ ...form, timerMode: e.target.value })}
                options={[
                  { value: 'full', label: 'Full Test Timer' },
                  { value: 'per_question', label: 'Per Question Timer' },
                ]}
              />
              {form.timerMode === 'full' && (
                <Input
                  label="Total Time (minutes)"
                  type="number"
                  min="1"
                  value={form.fullTimerMinutes}
                  onChange={e => setForm({ ...form, fullTimerMinutes: Number(e.target.value) })}
                />
              )}
            </div>
            <div className="mt-4 flex justify-end">
              <Button type="submit" disabled={creating}>
                {creating ? 'Creating...' : 'Create Test'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Tests List */}
      {loading ? <Loader /> : tests.length === 0 ? (
        <Card>
          <EmptyState
            icon="🔗"
            title="No tests yet"
            description="Create your first test to generate a candidate link"
          />
        </Card>
      ) : (
        <div className="grid gap-4">
          {tests.map(test => (
            <Card key={test._id} className="p-5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-semibold">{test.title}</h3>
                    <Badge color={test.isActive ? 'green' : 'red'}>
                      {test.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                    <Badge color="blue">
                      {test.timerMode === 'full' ? `${test.fullTimerMinutes} min` : 'Per Question'}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <Badge color="indigo">{test.organization?.name || 'N/A'}</Badge>
                    <Badge color={ROLE_COLORS[test.targetRole] || 'gray'}>
                      {ROLE_LABELS[test.targetRole] || test.targetRole}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Paper: {test.questionPaper?.title || 'N/A'} · {test.questionPaper?.questions?.length || 0} questions · {test.questionPaper?.totalMarks || 0} marks
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600 break-all">
                      {getTestLink(test.uniqueLink)}
                    </code>
                    <Button variant="ghost" size="sm" className="shrink-0" onClick={() => copyLink(test.uniqueLink)}>📋 Copy</Button>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="secondary" size="sm" onClick={() => handleToggle(test._id)}>
                    {test.isActive ? 'Deactivate' : 'Activate'}
                  </Button>
                  <Button variant="danger" size="sm" onClick={() => handleDelete(test._id)}>Delete</Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
