import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import { Card, Badge, Loader, Button, Input } from '../components/UI';
import toast from 'react-hot-toast';

export default function AttemptDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [attempt, setAttempt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [evalEdits, setEvalEdits] = useState({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    api.get(`/attempts/${id}`)
      .then(res => setAttempt(res.data))
      .catch(() => toast.error('Failed to load attempt'))
      .finally(() => setLoading(false));
  }, [id]);

  const downloadFile = async (url, filename) => {
    try {
      const res = await api.get(url, { responseType: 'blob' });
      const blob = new Blob([res.data]);
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(link.href);
    } catch {
      toast.error('Failed to download report');
    }
  };

  const safeFileName = (value) => (value || 'report').replace(/[^a-zA-Z0-9\s-]/g, '').trim().replace(/\s+/g, '_');

  const downloadPDF = () => {
    downloadFile(`/reports/candidate/${id}/pdf`, `${safeFileName(attempt?.fullName || id)}_Report.pdf`);
  };

  const downloadExcel = () => {
    downloadFile(`/reports/candidate/${id}/excel`, `${safeFileName(attempt?.fullName || id)}_Report.xlsx`);
  };

  const hasWrittenQuestions = attempt?.answers?.some(a => a.questionType === 'written');

  const startEdit = () => {
    const edits = {};
    attempt.answers.forEach(a => {
      if (a.questionType === 'written') {
        edits[a.questionId] = {
          adminMarks: a.adminMarks ?? 0,
          adminRemarks: a.adminRemarks || '',
          adminFeedback: a.adminFeedback || '',
        };
      }
    });
    setEvalEdits(edits);
    setEditMode(true);
  };

  const cancelEdit = () => {
    setEditMode(false);
    setEvalEdits({});
  };

  const saveEvaluations = async () => {
    const evaluations = Object.entries(evalEdits).map(([questionId, data]) => ({
      questionId,
      adminMarks: Number(data.adminMarks),
      adminRemarks: data.adminRemarks,
      adminFeedback: data.adminFeedback,
    }));
    setSaving(true);
    try {
      const res = await api.post(`/evaluation/${id}/evaluate`, { evaluations });
      toast.success('Evaluation saved');
      setEditMode(false);
      // Refresh attempt data
      const updated = await api.get(`/attempts/${id}`);
      setAttempt(updated.data);
    } catch {
      toast.error('Failed to save evaluation');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Delete this attempt by "${attempt.fullName}"? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      await api.delete(`/attempts/${id}`);
      toast.success('Attempt deleted');
      navigate('/attempts');
    } catch {
      toast.error('Failed to delete attempt');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <Loader />;
  if (!attempt) return <div className="text-center py-12 text-gray-500">Attempt not found</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Attempt Details</h1>
          <p className="text-sm text-gray-500 mt-1">{attempt.fullName} · {attempt.ecnNumber}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" onClick={downloadPDF}>📄 Download PDF</Button>
          <Button variant="secondary" size="sm" onClick={downloadExcel}>📊 Download Excel</Button>
          {hasWrittenQuestions && !editMode && (
            <Button variant="secondary" size="sm" onClick={startEdit}>✏️ Edit Evaluation</Button>
          )}
          {editMode && (
            <>
              <Button size="sm" onClick={saveEvaluations} disabled={saving}>
                {saving ? 'Saving...' : '💾 Save Evaluation'}
              </Button>
              <Button variant="secondary" size="sm" onClick={cancelEdit}>Cancel</Button>
            </>
          )}
          <Button variant="secondary" size="sm" onClick={handleDelete} disabled={deleting}
            className="!text-red-600 !border-red-200 hover:!bg-red-50">
            {deleting ? 'Deleting...' : '🗑️ Delete'}
          </Button>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Card className="p-5">
          <h2 className="text-sm font-semibold text-gray-500 mb-3">Candidate Info</h2>
          <div className="space-y-1 text-sm">
            <p><span className="text-gray-500">Name:</span> {attempt.fullName}</p>
            <p><span className="text-gray-500">ECN:</span> {attempt.ecnNumber}</p>
            <p><span className="text-gray-500">Organization:</span> {attempt.organization}</p>
            {attempt.email && <p><span className="text-gray-500">Email:</span> {attempt.email}</p>}
            <p><span className="text-gray-500">Submitted:</span> {attempt.submittedAt ? new Date(attempt.submittedAt).toLocaleString() : 'N/A'}</p>
          </div>
        </Card>
        <Card className="p-5">
          <h2 className="text-sm font-semibold text-gray-500 mb-3">Score Summary</h2>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-gray-500">Total Score</p>
              <p className="text-xl font-bold text-indigo-600">{attempt.totalScore}/{attempt.totalPossibleMarks}</p>
            </div>
            <div>
              <p className="text-gray-500">Percentage</p>
              <p className="text-xl font-bold text-indigo-600">{attempt.percentage}%</p>
            </div>
            <div>
              <p className="text-gray-500">Objective</p>
              <p className="font-medium">{attempt.objectiveScore}</p>
            </div>
            <div>
              <p className="text-gray-500">Written</p>
              <p className="font-medium">{attempt.writtenScore}</p>
            </div>
            <div>
              <p className="text-gray-500">Correct</p>
              <p className="font-medium text-green-600">{attempt.correctAnswers}</p>
            </div>
            <div>
              <p className="text-gray-500">Incorrect</p>
              <p className="font-medium text-red-600">{attempt.incorrectAnswers}</p>
            </div>
          </div>
          <div className="mt-3">
            <Badge color={attempt.status === 'evaluated' ? 'green' : 'amber'}>{attempt.status}</Badge>
          </div>
        </Card>
      </div>

      {/* Answers */}
      <h2 className="text-lg font-semibold mb-4">Question-wise Breakdown</h2>
      <div className="space-y-3">
        {attempt.answers.map((ans, idx) => (
          <Card key={ans._id} className="p-4">
            <div className="flex items-start gap-3">
              <span className={`flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                ans.questionType === 'written'
                  ? (ans.evaluationStatus === 'evaluated' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700')
                  : ans.isCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                {idx + 1}
              </span>
              <div className="flex-1">
                <p className="text-sm font-medium">{ans.questionText}</p>
                <div className="mt-2 text-sm space-y-1">
                  <p><span className="text-gray-500">Type:</span> {ans.questionType} <span className="text-gray-500 ml-2">Marks:</span> {ans.marks}/{ans.maxMarks}</p>
                  <p><span className="text-gray-500">Answer:</span> {ans.selectedAnswer || <em className="text-gray-400">Not answered</em>}</p>
                  {ans.questionType !== 'written' && (
                    <p><span className="text-gray-500">Correct Answer:</span> {ans.correctAnswer}</p>
                  )}
                  {ans.questionType === 'written' && ans.evaluationStatus === 'evaluated' && !editMode && (
                    <div className="bg-gray-50 p-2 rounded mt-2 text-xs">
                      <p><span className="text-gray-500">Admin Marks:</span> {ans.adminMarks}</p>
                      {ans.adminRemarks && <p><span className="text-gray-500">Remarks:</span> {ans.adminRemarks}</p>}
                      {ans.adminFeedback && <p><span className="text-gray-500">Feedback:</span> {ans.adminFeedback}</p>}
                    </div>
                  )}
                  {ans.questionType === 'written' && editMode && evalEdits[ans.questionId] && (
                    <div className="bg-indigo-50 p-3 rounded-lg mt-2 space-y-2 border border-indigo-100">
                      <div className="flex items-center gap-3">
                        <label className="text-xs font-medium text-gray-600 w-16">Marks</label>
                        <input
                          type="number"
                          min="0"
                          max={ans.maxMarks}
                          value={evalEdits[ans.questionId].adminMarks}
                          onChange={e => setEvalEdits(prev => ({
                            ...prev,
                            [ans.questionId]: { ...prev[ans.questionId], adminMarks: e.target.value }
                          }))}
                          className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                        <span className="text-xs text-gray-400">/ {ans.maxMarks}</span>
                      </div>
                      <div className="flex items-start gap-3">
                        <label className="text-xs font-medium text-gray-600 w-16 pt-1">Remarks</label>
                        <input
                          type="text"
                          value={evalEdits[ans.questionId].adminRemarks}
                          onChange={e => setEvalEdits(prev => ({
                            ...prev,
                            [ans.questionId]: { ...prev[ans.questionId], adminRemarks: e.target.value }
                          }))}
                          placeholder="Optional remarks"
                          className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>
                      <div className="flex items-start gap-3">
                        <label className="text-xs font-medium text-gray-600 w-16 pt-1">Feedback</label>
                        <input
                          type="text"
                          value={evalEdits[ans.questionId].adminFeedback}
                          onChange={e => setEvalEdits(prev => ({
                            ...prev,
                            [ans.questionId]: { ...prev[ans.questionId], adminFeedback: e.target.value }
                          }))}
                          placeholder="Optional feedback"
                          className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}


