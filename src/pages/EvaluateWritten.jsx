import { useState, useEffect } from 'react';
import api from '../api';
import { Card, Button, Input, Textarea, Badge, Select, Loader, EmptyState } from '../components/UI';
import toast from 'react-hot-toast';

const ROLE_LABELS = { agent: 'Agent', tl: 'Team Leader', qa: 'QA' };

export default function EvaluateWritten() {
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [evaluations, setEvaluations] = useState({});
  const [saving, setSaving] = useState(false);
  const [orgs, setOrgs] = useState([]);
  const [filterOrg, setFilterOrg] = useState('');
  const [filterRole, setFilterRole] = useState('');

  useEffect(() => {
    api.get('/organizations').then(res => setOrgs(res.data)).catch(() => {});
  }, []);

  const load = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filterOrg) params.append('organization', filterOrg);
    if (filterRole) params.append('targetRole', filterRole);
    api.get(`/evaluation/pending?${params}`)
      .then(res => setAttempts(res.data))
      .catch(() => toast.error('Failed to load'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [filterOrg, filterRole]);

  const selectAttempt = (attempt) => {
    setSelected(attempt);
    const evals = {};
    attempt.answers.forEach(a => {
      if (a.questionType === 'written') {
        evals[a.questionId] = {
          adminMarks: a.adminMarks ?? 0,
          adminRemarks: a.adminRemarks || '',
          adminFeedback: a.adminFeedback || ''
        };
      }
    });
    setEvaluations(evals);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = Object.entries(evaluations).map(([questionId, data]) => ({
        questionId,
        adminMarks: Number(data.adminMarks) || 0,
        adminRemarks: data.adminRemarks,
        adminFeedback: data.adminFeedback
      }));
      await api.post(`/evaluation/${selected._id}/evaluate`, { evaluations: payload });
      toast.success('Evaluation saved');
      setSelected(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loader />;

  if (selected) {
    const writtenAnswers = selected.answers.filter(a => a.questionType === 'written');
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Evaluate Written Answers</h1>
            <p className="text-sm text-gray-500 mt-1">{selected.fullName} · {selected.ecnNumber}</p>
          </div>
          <Button variant="secondary" onClick={() => setSelected(null)}>← Back</Button>
        </div>

        {/* Objective Summary */}
        <Card className="p-4 mb-4">
          <div className="flex items-center gap-6 text-sm">
            <div>
              <span className="text-gray-500">Objective Score:</span>
              <span className="font-semibold ml-1">{selected.objectiveScore}</span>
            </div>
            <div>
              <span className="text-gray-500">Total Possible:</span>
              <span className="font-semibold ml-1">{selected.totalPossibleMarks}</span>
            </div>
            <Badge color={selected.status === 'evaluated' ? 'green' : 'amber'}>{selected.status}</Badge>
          </div>
        </Card>

        {/* Written Questions */}
        <div className="space-y-4">
          {writtenAnswers.map((ans, idx) => {
            const evaluation = evaluations[ans.questionId] || {};
            return (
              <Card key={ans.questionId} className="p-5">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">
                  Written Question {idx + 1}
                  <span className="font-normal text-gray-400 ml-2">({ans.maxMarks} marks)</span>
                </h3>
                <p className="text-sm text-gray-900 mb-3">{ans.questionText}</p>

                <div className="bg-gray-50 rounded-lg p-3 mb-4">
                  <p className="text-xs text-gray-500 mb-1">Candidate's Answer:</p>
                  <p className="text-sm whitespace-pre-wrap">{ans.selectedAnswer || <em className="text-gray-400">No answer provided</em>}</p>
                </div>

                <div className="grid gap-3 md:grid-cols-3">
                  <Input
                    label={`Marks (max ${ans.maxMarks})`}
                    type="number"
                    min="0"
                    max={ans.maxMarks}
                    value={evaluation.adminMarks}
                    onChange={e => setEvaluations(prev => ({
                      ...prev,
                      [ans.questionId]: { ...prev[ans.questionId], adminMarks: e.target.value }
                    }))}
                  />
                  <Input
                    label="Remarks"
                    value={evaluation.adminRemarks}
                    onChange={e => setEvaluations(prev => ({
                      ...prev,
                      [ans.questionId]: { ...prev[ans.questionId], adminRemarks: e.target.value }
                    }))}
                    placeholder="Brief remark"
                  />
                  <Input
                    label="Improvement Feedback"
                    value={evaluation.adminFeedback}
                    onChange={e => setEvaluations(prev => ({
                      ...prev,
                      [ans.questionId]: { ...prev[ans.questionId], adminFeedback: e.target.value }
                    }))}
                    placeholder="Suggestions for improvement"
                  />
                </div>
              </Card>
            );
          })}
        </div>

        <div className="flex justify-end mt-6">
          <Button onClick={handleSave} disabled={saving} size="lg">
            {saving ? 'Saving...' : 'Save Evaluation'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Evaluate Written Answers</h1>
          <p className="text-sm text-gray-500 mt-1">Review and score written question answers</p>
        </div>
        <div className="flex items-end gap-3">
          <Select
            label="Organization"
            value={filterOrg}
            onChange={e => setFilterOrg(e.target.value)}
            options={[
              { value: '', label: 'All Organizations' },
              ...orgs.map(o => ({ value: o._id, label: o.name }))
            ]}
            className="w-48"
          />
          <Select
            label="Role"
            value={filterRole}
            onChange={e => setFilterRole(e.target.value)}
            options={[
              { value: '', label: 'All Roles' },
              { value: 'agent', label: 'Agent' },
              { value: 'tl', label: 'Team Leader' },
              { value: 'qa', label: 'QA' }
            ]}
            className="w-40"
          />
        </div>
      </div>

      {attempts.length === 0 ? (
        <Card>
          <EmptyState icon="✅" title="All caught up!" description="No written answers pending evaluation" />
        </Card>
      ) : (
        <div className="grid gap-3">
          {attempts.map(a => (
            <Card key={a._id} className="p-4 cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => selectAttempt(a)}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold">{a.fullName}</p>
                  <p className="text-xs text-gray-500">{a.ecnNumber} · {a.organization?.name || a.organization}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {a.test?.title || 'N/A'}
                    {a.targetRole && <span className="ml-2 text-indigo-500 font-medium">{ROLE_LABELS[a.targetRole]}</span>}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{a.answers.filter(ans => ans.questionType === 'written' && ans.evaluationStatus === 'pending').length} pending</p>
                  <Badge color="amber">Needs Review</Badge>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
