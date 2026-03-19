import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { Card, Button, Badge, Loader, EmptyState, Select } from '../components/UI';
import toast from 'react-hot-toast';

const ROLE_LABELS = { agent: 'Agent', tl: 'Team Leader', qa: 'QA' };
const ROLE_COLORS = { agent: 'blue', tl: 'purple', qa: 'amber' };

export default function QuestionPapers() {
  const [papers, setPapers] = useState([]);
  const [orgs, setOrgs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterOrg, setFilterOrg] = useState('');
  const [filterRole, setFilterRole] = useState('');

  useEffect(() => {
    api.get('/organizations').then(res => setOrgs(res.data)).catch(() => {});
  }, []);

  const loadPapers = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filterOrg) params.set('organization', filterOrg);
    if (filterRole) params.set('targetRole', filterRole);
    api.get(`/question-papers?${params.toString()}`)
      .then(res => setPapers(res.data))
      .catch(() => toast.error('Failed to load question papers'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadPapers(); }, [filterOrg, filterRole]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this question paper?')) return;
    try {
      await api.delete(`/question-papers/${id}`);
      toast.success('Deleted');
      loadPapers();
    } catch {
      toast.error('Failed to delete');
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Question Papers</h1>
          <p className="text-sm text-gray-500 mt-1">Create and manage question papers by organization and role</p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/question-papers/import">
            <Button variant="secondary">📋 Bulk Import</Button>
          </Link>
          <Link to="/question-papers/new">
            <Button>+ Create New</Button>
          </Link>
        </div>
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

      {loading ? <Loader /> : papers.length === 0 ? (
        <Card>
          <EmptyState
            icon="📝"
            title="No question papers yet"
            description="Create your first question paper to get started"
            action={<Link to="/question-papers/new"><Button>Create Question Paper</Button></Link>}
          />
        </Card>
      ) : (
        <div className="grid gap-4">
          {papers.map(paper => (
            <Card key={paper._id} className="p-5">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="flex-1">
                  <h3 className="text-base font-semibold text-gray-900">{paper.title}</h3>
                  {paper.description && (
                    <p className="text-sm text-gray-500 mt-1">{paper.description}</p>
                  )}
                  <div className="flex flex-wrap items-center gap-2 mt-3">
                    <Badge color="indigo">{paper.organization?.name || 'N/A'}</Badge>
                    <Badge color={ROLE_COLORS[paper.targetRole] || 'gray'}>
                      {ROLE_LABELS[paper.targetRole] || paper.targetRole}
                    </Badge>
                    <Badge color="gray">{paper.questions?.length || 0} questions</Badge>
                    <Badge color="blue">{paper.totalMarks} marks</Badge>
                    <span className="text-xs text-gray-400">
                      Created {new Date(paper.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Link to={`/question-papers/edit/${paper._id}`}>
                    <Button variant="secondary" size="sm">Edit</Button>
                  </Link>
                  <Button variant="danger" size="sm" onClick={() => handleDelete(paper._id)}>Delete</Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
