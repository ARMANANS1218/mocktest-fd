import { useState, useEffect } from 'react';
import api from '../api';
import { Card, Button, Select, Loader, EmptyState } from '../components/UI';
import toast from 'react-hot-toast';

const ROLE_LABELS = { agent: 'Agent', tl: 'Team Leader', qa: 'QA' };

export default function Reports() {
  const [tests, setTests] = useState([]);
  const [selectedTest, setSelectedTest] = useState('');
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [orgs, setOrgs] = useState([]);
  const [filterOrg, setFilterOrg] = useState('');
  const [filterRole, setFilterRole] = useState('');

  useEffect(() => {
    api.get('/organizations').then(res => setOrgs(res.data)).catch(() => {});
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    if (filterOrg) params.append('organization', filterOrg);
    if (filterRole) params.append('targetRole', filterRole);
    api.get(`/tests?${params}`).then(res => {
      setTests(res.data);
      setSelectedTest('');
      setAttempts([]);
    }).catch(() => {});
  }, [filterOrg, filterRole]);

  useEffect(() => {
    if (!selectedTest) { setAttempts([]); return; }
    setLoading(true);
    api.get(`/attempts?testId=${selectedTest}`)
      .then(res => setAttempts(res.data.filter(a => a.status !== 'in_progress')))
      .catch(() => toast.error('Failed to load'))
      .finally(() => setLoading(false));
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
      toast.error('Failed to download report');
    }
  };

  const downloadCombinedExcel = () => {
    const test = tests.find(t => t._id === selectedTest);
    downloadFile(`/reports/test/${selectedTest}/excel`, `combined-report-${test?.title || 'test'}.xlsx`);
  };

  const downloadCombinedPDF = () => {
    const test = tests.find(t => t._id === selectedTest);
    downloadFile(`/reports/test/${selectedTest}/pdf`, `combined-report-${test?.title || 'test'}.pdf`);
  };

  const downloadIndividualPDF = (attemptId, name) => {
    downloadFile(`/reports/candidate/${attemptId}/pdf`, `report-${name || attemptId}.pdf`);
  };

  const downloadIndividualExcel = (attemptId, name) => {
    downloadFile(`/reports/candidate/${attemptId}/excel`, `report-${name || attemptId}.xlsx`);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-sm text-gray-500 mt-1">Generate and download candidate reports</p>
        </div>
      </div>

      <Card className="p-5 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:items-end">
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
              { value: 'tl', label: 'Team Leader' },
              { value: 'qa', label: 'QA' }
            ]}
          />
          <Select
            label="Select Test"
            value={selectedTest}
            onChange={e => setSelectedTest(e.target.value)}
            options={[
              { value: '', label: 'Choose a test...' },
              ...tests.map(t => ({ value: t._id, label: t.title }))
            ]}
          />
          {selectedTest && attempts.length > 0 && (
            <div className="flex gap-2">
              <Button variant="primary" onClick={downloadCombinedExcel}>📊 Excel</Button>
              <Button variant="secondary" onClick={downloadCombinedPDF}>📄 PDF</Button>
            </div>
          )}
        </div>
      </Card>

      {!selectedTest && (
        <Card><EmptyState icon="📄" title="Select a test" description="Choose a test to view and download reports" /></Card>
      )}

      {loading && <Loader />}

      {selectedTest && !loading && attempts.length === 0 && (
        <Card><EmptyState icon="📭" title="No submissions" description="No candidates have submitted this test" /></Card>
      )}

      {attempts.length > 0 && !loading && (
        <Card>
          <div className="p-5 border-b border-gray-100">
            <h2 className="text-base font-semibold">Individual Reports ({attempts.length} candidates)</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left text-xs font-medium text-gray-500 uppercase px-5 py-3">#</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase px-5 py-3">Candidate</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase px-5 py-3">ECN</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase px-5 py-3">Organization</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase px-5 py-3">Role</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase px-5 py-3">Score</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase px-5 py-3">%</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase px-5 py-3">Download</th>
                </tr>
              </thead>
              <tbody>
                {attempts.map((a, idx) => (
                  <tr key={a._id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-5 py-3 text-sm">{idx + 1}</td>
                    <td className="px-5 py-3 text-sm font-medium">{a.fullName}</td>
                    <td className="px-5 py-3 text-sm">{a.ecnNumber}</td>
                    <td className="px-5 py-3 text-sm">{a.organization?.name || a.organization}</td>
                    <td className="px-5 py-3 text-sm">{ROLE_LABELS[a.targetRole] || '-'}</td>
                    <td className="px-5 py-3 text-sm font-medium">{a.totalScore}/{a.totalPossibleMarks}</td>
                    <td className="px-5 py-3 text-sm">{a.percentage}%</td>
                    <td className="px-5 py-3">
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => downloadIndividualPDF(a._id, a.fullName)}>PDF</Button>
                        <Button variant="ghost" size="sm" onClick={() => downloadIndividualExcel(a._id, a.fullName)}>Excel</Button>
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
