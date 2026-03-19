import { useState, useEffect } from 'react';
import api from '../api';
import { Card, Select, Loader, EmptyState, StatCard } from '../components/UI';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import toast from 'react-hot-toast';

const COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#64748b'];

export default function Analytics() {
  const [tests, setTests] = useState([]);
  const [orgs, setOrgs] = useState([]);
  const [filterOrg, setFilterOrg] = useState('');
  const [selectedTest, setSelectedTest] = useState('');
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/organizations').then(res => setOrgs(res.data)).catch(() => {});
  }, []);

  useEffect(() => {
    const params = filterOrg ? `?organization=${filterOrg}` : '';
    api.get(`/tests${params}`).then(res => {
      setTests(res.data);
      setSelectedTest('');
      setAnalytics(null);
      if (res.data.length > 0) {
        setSelectedTest(res.data[0]._id);
      }
    }).catch(() => {});
  }, [filterOrg]);

  useEffect(() => {
    if (!selectedTest) return;
    setLoading(true);
    api.get(`/analytics/test/${selectedTest}`)
      .then(res => setAnalytics(res.data))
      .catch(() => toast.error('Failed to load analytics'))
      .finally(() => setLoading(false));
  }, [selectedTest]);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-sm text-gray-500 mt-1">Test performance analytics and insights</p>
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
            label="Test"
            value={selectedTest}
            onChange={e => setSelectedTest(e.target.value)}
            options={[
              { value: '', label: 'Select a test' },
              ...tests.map(t => ({ value: t._id, label: t.title }))
            ]}
            className="w-64"
          />
        </div>
      </div>

      {!selectedTest && (
        <Card><EmptyState icon="📈" title="Select a test" description="Choose a test to view analytics" /></Card>
      )}

      {loading && <Loader />}

      {analytics && !loading && (
        <>
          {analytics.totalCandidates === 0 ? (
            <Card><EmptyState icon="📊" title="No data yet" description="No candidates have attempted this test" /></Card>
          ) : (
            <>
              {/* Overview Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <StatCard label="Total Candidates" value={analytics.totalCandidates} icon="👥" color="indigo" />
                <StatCard label="Average Score" value={`${analytics.averagePercentage}%`} icon="📊" color="blue" />
                <StatCard label="Highest Score" value={analytics.highestScore} icon="🏆" color="green" />
                <StatCard label="Lowest Score" value={analytics.lowestScore} icon="📉" color="red" />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Score Distribution */}
                <Card className="p-5">
                  <h2 className="text-base font-semibold mb-4">Score Distribution</h2>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={analytics.scoreDistribution}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="range" tick={{ fontSize: 11 }} />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </Card>

                {/* Pass/Fail Ratio */}
                <Card className="p-5">
                  <h2 className="text-base font-semibold mb-4">Pass / Fail Ratio (50% threshold)</h2>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Pass', value: analytics.passFailRatio.pass },
                          { name: 'Fail', value: analytics.passFailRatio.fail }
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        <Cell fill="#22c55e" />
                        <Cell fill="#ef4444" />
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </Card>
              </div>

              {/* Question Analysis */}
              <Card className="p-5 mb-6">
                <h2 className="text-base font-semibold mb-4">Question Analysis</h2>
                <ResponsiveContainer width="100%" height={Math.max(300, analytics.questionAnalysis.length * 40)}>
                  <BarChart
                    data={analytics.questionAnalysis.map((q, i) => ({
                      name: `Q${i + 1}`,
                      correct: q.correctPercentage,
                      skipped: q.skippedPercentage
                    }))}
                    layout="vertical"
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} />
                    <YAxis dataKey="name" type="category" width={40} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="correct" name="Correct %" fill="#22c55e" radius={[0, 4, 4, 0]} />
                    <Bar dataKey="skipped" name="Skipped %" fill="#f59e0b" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Card>

              {/* Question Details Table */}
              <Card>
                <div className="p-5 border-b border-gray-100">
                  <h2 className="text-base font-semibold">Detailed Question Breakdown</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="text-left text-xs font-medium text-gray-500 uppercase px-5 py-3">#</th>
                        <th className="text-left text-xs font-medium text-gray-500 uppercase px-5 py-3">Question</th>
                        <th className="text-left text-xs font-medium text-gray-500 uppercase px-5 py-3">Type</th>
                        <th className="text-left text-xs font-medium text-gray-500 uppercase px-5 py-3">Marks</th>
                        <th className="text-left text-xs font-medium text-gray-500 uppercase px-5 py-3">Correct %</th>
                        <th className="text-left text-xs font-medium text-gray-500 uppercase px-5 py-3">Skipped %</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analytics.questionAnalysis.map((q, idx) => (
                        <tr key={q.questionId} className="border-b border-gray-50">
                          <td className="px-5 py-3 text-sm">{idx + 1}</td>
                          <td className="px-5 py-3 text-sm max-w-xs truncate">{q.questionText}</td>
                          <td className="px-5 py-3 text-sm">{q.type}</td>
                          <td className="px-5 py-3 text-sm">{q.marks}</td>
                          <td className="px-5 py-3 text-sm font-medium text-green-600">{q.correctPercentage}%</td>
                          <td className="px-5 py-3 text-sm font-medium text-amber-600">{q.skippedPercentage}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </>
          )}
        </>
      )}
    </div>
  );
}
