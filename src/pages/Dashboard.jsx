import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { StatCard, Card, Badge, Loader, Select } from '../components/UI';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [orgs, setOrgs] = useState([]);
  const [filterOrg, setFilterOrg] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/organizations').then(res => setOrgs(res.data)).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = filterOrg ? `?organization=${filterOrg}` : '';
    api.get(`/analytics/dashboard${params}`)
      .then(res => setStats(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [filterOrg]);

  if (loading) return <Loader />;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Overview of your mock test platform</p>
        </div>
        <Select
          value={filterOrg}
          onChange={e => setFilterOrg(e.target.value)}
          options={[
            { value: '', label: 'All Organizations' },
            ...orgs.map(o => ({ value: o._id, label: o.name }))
          ]}
          className="w-64"
        />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Tests" value={stats?.totalTests || 0} icon="📋" color="indigo" />
        <StatCard label="Active Tests" value={stats?.activeTests || 0} icon="✅" color="green" />
        <StatCard label="Total Attempts" value={stats?.totalAttempts || 0} icon="👥" color="blue" />
        <StatCard label="Pending Evaluation" value={stats?.pendingEvaluation || 0} icon="⏳" color="amber" />
      </div>

      {/* Organization Overview */}
      {!filterOrg && stats?.orgSummary?.length > 0 && (
        <Card className="mb-8">
          <div className="p-5 border-b border-gray-100">
            <h2 className="text-lg font-semibold">Organizations</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-5">
            {stats.orgSummary.map(org => (
              <div
                key={org.orgId}
                onClick={() => setFilterOrg(org.orgId)}
                className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50/30 cursor-pointer transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center text-lg font-bold">
                  {org.orgName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium">{org.orgName}</p>
                  <p className="text-xs text-gray-500">{org.testCount} test{org.testCount !== 1 ? 's' : ''}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Average Score */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Average Score</h2>
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full border-4 border-indigo-500 flex items-center justify-center">
              <span className="text-xl font-bold text-indigo-600">{stats?.averageScore || 0}%</span>
            </div>
            <div>
              <p className="text-sm text-gray-500">Across all tests</p>
              <p className="text-sm text-gray-500 mt-1">{stats?.totalAttempts || 0} total attempts</p>
            </div>
          </div>
        </Card>

        {/* Quick Actions */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
          <div className="space-y-2">
            <Link
              to="/question-papers/new"
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-100"
            >
              <span className="text-xl">📝</span>
              <div>
                <p className="text-sm font-medium">Create Question Paper</p>
                <p className="text-xs text-gray-500">Build a new question paper</p>
              </div>
            </Link>
            <Link
              to="/tests"
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-100"
            >
              <span className="text-xl">🔗</span>
              <div>
                <p className="text-sm font-medium">Manage Tests</p>
                <p className="text-xs text-gray-500">Create tests and generate links</p>
              </div>
            </Link>
            <Link
              to="/evaluate"
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-100"
            >
              <span className="text-xl">✏️</span>
              <div>
                <p className="text-sm font-medium">Evaluate Answers</p>
                <p className="text-xs text-gray-500">{stats?.pendingEvaluation || 0} pending evaluations</p>
              </div>
            </Link>
          </div>
        </Card>
      </div>

      {/* Recent Attempts */}
      {stats?.recentAttempts?.length > 0 && (
        <Card className="mt-6">
          <div className="p-5 border-b border-gray-100">
            <h2 className="text-lg font-semibold">Recent Attempts</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left text-xs font-medium text-gray-500 uppercase px-5 py-3">Candidate</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase px-5 py-3">Test</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase px-5 py-3">Score</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase px-5 py-3">Status</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase px-5 py-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentAttempts.map(a => (
                  <tr key={a._id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-5 py-3">
                      <p className="text-sm font-medium">{a.fullName}</p>
                      <p className="text-xs text-gray-500">{a.ecnNumber}</p>
                    </td>
                    <td className="px-5 py-3 text-sm">{a.test?.title || 'N/A'}</td>
                    <td className="px-5 py-3 text-sm font-medium">{a.totalScore}/{a.totalPossibleMarks} ({a.percentage}%)</td>
                    <td className="px-5 py-3">
                      <Badge color={a.status === 'evaluated' ? 'green' : a.status === 'submitted' ? 'amber' : 'gray'}>
                        {a.status}
                      </Badge>
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-500">
                      {a.submittedAt ? new Date(a.submittedAt).toLocaleDateString() : 'N/A'}
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
