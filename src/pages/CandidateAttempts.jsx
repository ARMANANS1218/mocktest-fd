import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { Card, Badge, Loader, EmptyState, Select } from '../components/UI';
import toast from 'react-hot-toast';

const ROLE_LABELS = { agent: 'Agent', tl: 'Team Leader', qa: 'QA' };

export default function CandidateAttempts() {
  const [attempts, setAttempts] = useState([]);
  const [tests, setTests] = useState([]);
  const [orgs, setOrgs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterTest, setFilterTest] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterOrg, setFilterOrg] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    Promise.all([
      api.get('/tests').then(res => setTests(res.data)),
      api.get('/organizations').then(res => setOrgs(res.data))
    ]).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filterTest) params.set('testId', filterTest);
    if (filterStatus) params.set('status', filterStatus);
    if (filterOrg) params.set('organization', filterOrg);
    if (filterRole) params.set('targetRole', filterRole);
    api.get(`/attempts?${params.toString()}`)
      .then(res => setAttempts(res.data))
      .catch(() => toast.error('Failed to load attempts'))
      .finally(() => setLoading(false));
  }, [filterTest, filterStatus, filterOrg, filterRole]);

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete attempt by "${name}"? This cannot be undone.`)) return;
    setDeleting(id);
    try {
      await api.delete(`/attempts/${id}`);
      setAttempts(prev => prev.filter(a => a._id !== id));
      toast.success('Attempt deleted');
    } catch {
      toast.error('Failed to delete attempt');
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Candidate Attempts</h1>
        <p className="text-sm text-gray-500 mt-1">View all test submissions</p>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Select
          label="Organization"
          value={filterOrg}
          onChange={e => setFilterOrg(e.target.value)}
          options={[
            { value: '', label: 'All Organizations' },
            ...orgs.map(o => ({ value: o._id, label: o.name }))
          ]}
        />
        <Select
          label="Role"
          value={filterRole}
          onChange={e => setFilterRole(e.target.value)}
          options={[
            { value: '', label: 'All Roles' },
            { value: 'agent', label: 'Agent' },
            { value: 'tl', label: 'Team Leader (TL)' },
            { value: 'qa', label: 'QA' },
          ]}
        />
        <Select
          label="Test"
          value={filterTest}
          onChange={e => setFilterTest(e.target.value)}
          options={[
            { value: '', label: 'All Tests' },
            ...tests.map(t => ({ value: t._id, label: t.title }))
          ]}
        />
        <Select
          label="Status"
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          options={[
            { value: '', label: 'All Statuses' },
            { value: 'submitted', label: 'Submitted' },
            { value: 'evaluated', label: 'Evaluated' },
          ]}
        />
      </div>

      {loading ? <Loader /> : attempts.length === 0 ? (
        <Card>
          <EmptyState icon="👥" title="No attempts found" description="No candidates have submitted any tests yet" />
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left text-xs font-medium text-gray-500 uppercase px-5 py-3">Candidate</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase px-5 py-3">ECN</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase px-5 py-3">Organization</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase px-5 py-3">Role</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase px-5 py-3">Test</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase px-5 py-3">Score</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase px-5 py-3">%</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase px-5 py-3">Status</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase px-5 py-3">Date</th>
                  <th className="text-right text-xs font-medium text-gray-500 uppercase px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {attempts.map(a => (
                  <tr key={a._id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-5 py-3 text-sm font-medium">{a.fullName}</td>
                    <td className="px-5 py-3 text-sm">{a.ecnNumber}</td>
                    <td className="px-5 py-3 text-sm">{a.organization?.name || a.organization || '-'}</td>
                    <td className="px-5 py-3 text-sm">{ROLE_LABELS[a.targetRole] || a.targetRole || '-'}</td>
                    <td className="px-5 py-3 text-sm">{a.test?.title || 'N/A'}</td>
                    <td className="px-5 py-3 text-sm font-medium">{a.totalScore}/{a.totalPossibleMarks}</td>
                    <td className="px-5 py-3 text-sm">{a.percentage}%</td>
                    <td className="px-5 py-3">
                      <Badge color={a.status === 'evaluated' ? 'green' : a.status === 'submitted' ? 'amber' : 'gray'}>
                        {a.status}
                      </Badge>
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-500">
                      {a.submittedAt ? new Date(a.submittedAt).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link to={`/attempts/${a._id}`} className="text-sm text-indigo-600 hover:underline">View</Link>
                        <button
                          onClick={() => handleDelete(a._id, a.fullName)}
                          disabled={deleting === a._id}
                          className="text-sm text-red-500 hover:text-red-700 hover:underline disabled:opacity-50"
                        >
                          {deleting === a._id ? '...' : 'Delete'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
