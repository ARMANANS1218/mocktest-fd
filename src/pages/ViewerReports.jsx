import { useState, useEffect } from 'react';
import api from '../api';
import { Card, Button, Select, Badge, Loader, EmptyState } from '../components/UI';
import toast from 'react-hot-toast';

const ROLE_LABELS = { agent: 'Agent', tl: 'Team Leader', qa: 'QA' };

export default function ViewerReports() {
  const [org, setOrg] = useState(null);
  const [tests, setTests] = useState([]);
  const [selectedTest, setSelectedTest] = useState('');
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingAttempts, setLoadingAttempts] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get('/viewer/org'),
      api.get('/viewer/tests')
    ]).then(([orgRes, testsRes]) => {
      setOrg(orgRes.data);
      setTests(testsRes.data);
    }).catch(() => toast.error('Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedTest) { setAttempts([]); return; }
    setLoadingAttempts(true);
    api.get(`/viewer/attempts?testId=${selectedTest}`)
      .then(res => setAttempts(res.data))
      .catch(() => toast.error('Failed to load attempts'))
      .finally(() => setLoadingAttempts(false));
  }, [selectedTest]);

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
      toast.error('Failed to download');
    }
  };

  const downloadIndividualPDF = (attemptId, name) => {
    const safeName = (name || 'report').replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_');
    downloadFile(`/viewer/candidate/${attemptId}/pdf`, `${safeName}_Report.pdf`);
  };

  const downloadAllExcel = () => {
    const testParam = selectedTest ? `?testId=${selectedTest}` : '';
    const name = org?.name || 'reports';
    downloadFile(`/viewer/download/excel${testParam}`, `${name.replace(/[^a-zA-Z0-9]/g, '_')}_Evaluated_Reports.xlsx`);
  };

  if (loading) return <Loader />;

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-2xl font-bold text-gray-900">Evaluated Reports</h1>
          {org && <Badge color="indigo">{org.name}</Badge>}
        </div>
        <p className="text-sm text-gray-500">View and download evaluated candidate reports for your organization</p>
      </div>

      {/* Filters */}
      <Card className="p-4 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-end gap-4">
          <Select
            label="Select Test"
            value={selectedTest}
            onChange={e => setSelectedTest(e.target.value)}
            options={[
              { value: '', label: 'Choose a test...' },
              ...tests.map(t => ({
                value: t._id,
                label: `${t.title}${t.questionPaper?.targetRole ? ` (${ROLE_LABELS[t.questionPaper.targetRole] || t.questionPaper.targetRole})` : ''}`
              }))
            ]}
            className="flex-1"
          />
          {attempts.length > 0 && (
            <Button onClick={downloadAllExcel} variant="secondary">
              Download All (Excel)
            </Button>
          )}
        </div>
      </Card>

      {/* Results */}
      {!selectedTest ? (
        <Card>
          <EmptyState icon="📋" title="Select a test" description="Choose a test from the dropdown to view evaluated reports" />
        </Card>
      ) : loadingAttempts ? (
        <Loader />
      ) : attempts.length === 0 ? (
        <Card>
          <EmptyState icon="📊" title="No evaluated reports" description="No candidates have been fully evaluated for this test yet" />
        </Card>
      ) : (
        <>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-gray-600 font-medium">
              {attempts.length} evaluated candidate{attempts.length !== 1 ? 's' : ''}
            </p>
          </div>

          {/* Table */}
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">#</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Candidate</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Employee Code</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Role</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Score</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Percentage</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Result</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Download</th>
                  </tr>
                </thead>
                <tbody>
                  {attempts.map((a, idx) => {
                    const resultLabel = a.resultLabel || 'Pending';
                    const passed = resultLabel !== 'Fail' && resultLabel !== 'Pending';
                    return (
                      <tr key={a._id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-500">{idx + 1}</td>
                        <td className="px-4 py-3 font-medium text-gray-900">{a.fullName}</td>
                        <td className="px-4 py-3 text-gray-600">{a.ecnNumber}</td>
                        <td className="px-4 py-3">
                          <Badge color="blue">{ROLE_LABELS[a.targetRole] || a.targetRole || 'N/A'}</Badge>
                        </td>
                        <td className="px-4 py-3 text-gray-700">{a.totalScore}/{a.totalPossibleMarks}</td>
                        <td className="px-4 py-3 font-semibold" style={{ color: passed ? '#16a34a' : '#dc2626' }}>
                          {a.percentage}%
                        </td>
                        <td className="px-4 py-3">
                          <Badge color={passed ? 'green' : 'red'}>{passed ? resultLabel : 'Fail'}</Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Button variant="ghost" size="sm" onClick={() => downloadIndividualPDF(a._id, a.fullName)}>
                            PDF
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
