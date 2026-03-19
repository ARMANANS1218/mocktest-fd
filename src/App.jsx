import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import AdminLayout from './components/AdminLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Organizations from './pages/Organizations';
import QuestionPapers from './pages/QuestionPapers';
import QuestionPaperBuilder from './pages/QuestionPaperBuilder';
import BulkImport from './pages/BulkImport';
import ManageTests from './pages/ManageTests';
import CandidateAttempts from './pages/CandidateAttempts';
import AttemptDetail from './pages/AttemptDetail';
import EvaluateWritten from './pages/EvaluateWritten';
import Analytics from './pages/Analytics';
import Reports from './pages/Reports';
import TestPage from './pages/TestPage';
import TestComplete from './pages/TestComplete';
import UserManagement from './pages/UserManagement';
import ViewerReports from './pages/ViewerReports';
import { Loader } from './components/UI';

function ProtectedRoute({ children }) {
  const { admin, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader /></div>;
  if (!admin) return <Navigate to="/login" replace />;
  return children;
}

function AdminOrSubadminRoute({ children }) {
  const { admin, loading, isViewer } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader /></div>;
  if (!admin) return <Navigate to="/login" replace />;
  if (isViewer) return <Navigate to="/viewer-reports" replace />;
  return children;
}

function AdminOnlyRoute({ children }) {
  const { admin, loading, isAdmin } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader /></div>;
  if (!admin) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;
  return children;
}

function ViewerRoute({ children }) {
  const { admin, loading, isViewer } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader /></div>;
  if (!admin) return <Navigate to="/login" replace />;
  if (!isViewer) return <Navigate to="/" replace />;
  return children;
}

function HomeRedirect() {
  const { isViewer } = useAuth();
  if (isViewer) return <Navigate to="/viewer-reports" replace />;
  return <Dashboard />;
}

export default function App() {
  const { admin, loading } = useAuth();

  return (
    <Routes>
      {/* Public candidate routes */}
      <Route path="/test/:uniqueLink" element={<TestPage />} />
      <Route path="/test-complete" element={<TestComplete />} />

      {/* Login */}
      <Route path="/login" element={
        loading ? <div className="min-h-screen flex items-center justify-center"><Loader /></div>
          : admin ? <Navigate to="/" replace /> : <Login />
      } />

      {/* Protected admin routes */}
      <Route path="/" element={
        <ProtectedRoute><AdminLayout /></ProtectedRoute>
      }>
        <Route index element={<HomeRedirect />} />
        <Route path="organizations" element={<AdminOrSubadminRoute><Organizations /></AdminOrSubadminRoute>} />
        <Route path="question-papers" element={<AdminOrSubadminRoute><QuestionPapers /></AdminOrSubadminRoute>} />
        <Route path="question-papers/new" element={<AdminOrSubadminRoute><QuestionPaperBuilder /></AdminOrSubadminRoute>} />
        <Route path="question-papers/edit/:id" element={<AdminOrSubadminRoute><QuestionPaperBuilder /></AdminOrSubadminRoute>} />
        <Route path="question-papers/import" element={<AdminOrSubadminRoute><BulkImport /></AdminOrSubadminRoute>} />
        <Route path="tests" element={<AdminOrSubadminRoute><ManageTests /></AdminOrSubadminRoute>} />
        <Route path="attempts" element={<AdminOrSubadminRoute><CandidateAttempts /></AdminOrSubadminRoute>} />
        <Route path="attempts/:id" element={<AdminOrSubadminRoute><AttemptDetail /></AdminOrSubadminRoute>} />
        <Route path="evaluate" element={<AdminOrSubadminRoute><EvaluateWritten /></AdminOrSubadminRoute>} />
        <Route path="analytics" element={<AdminOrSubadminRoute><Analytics /></AdminOrSubadminRoute>} />
        <Route path="reports" element={<AdminOrSubadminRoute><Reports /></AdminOrSubadminRoute>} />
        <Route path="users" element={<AdminOnlyRoute><UserManagement /></AdminOnlyRoute>} />
        <Route path="viewer-reports" element={<ViewerRoute><ViewerReports /></ViewerRoute>} />
      </Route>

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
