import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Button, Input, Card } from '../components/UI';
import toast from 'react-hot-toast';

export default function Login() {
  const { login } = useAuth();
  const [form, setForm] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!form.username.trim() || !form.password.trim()) {
      return toast.error('Please enter username and password');
    }
    setLoading(true);
    try {
      await login(form.username, form.password);
      toast.success('Welcome back!');
    } catch (err) {
      const msg = err.response?.data?.error || 'Login failed';
      if (msg.includes('Invalid')) {
        toast.error('Invalid username or password');
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-2xl text-white font-bold">TZ</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{import.meta.env.VITE_APP_NAME}</h1>
          <p className="text-sm text-gray-500 mt-1">Admin Panel</p>
        </div>

        <Card className="p-8">
          <h2 className="text-lg font-semibold text-center mb-6">Sign In</h2>
          <form onSubmit={handleLogin} className="space-y-4">
            <Input
              label="Username"
              value={form.username}
              onChange={e => setForm({ ...form, username: e.target.value })}
              placeholder="Enter your username"
              autoComplete="username"
            />
            <Input
              label="Password"
              type="password"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              placeholder="Enter your password"
              autoComplete="current-password"
            />
            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
