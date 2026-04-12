'use client';

import { useEffect, useState } from 'react';
import { Shield, User as UserIcon, Loader2, AlertCircle, CheckCircle } from 'lucide-react';

interface UserRecord {
  _id: string;
  name?: string;
  email: string;
  image?: string;
  role: 'admin' | 'user';
}

export function UserManagement() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    fetch('/api/admin/users')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) setUsers(data);
        else setError(data.error ?? 'Failed to load users');
      })
      .catch(() => setError('Network error'))
      .finally(() => setLoading(false));
  }, []);

  const handleRoleChange = async (userId: string, newRole: 'admin' | 'user') => {
    setUpdating(userId);
    setToast(null);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });
      const data = await res.json();
      if (!res.ok) {
        setToast({ type: 'error', message: data.error ?? 'Update failed' });
      } else {
        setUsers(prev => prev.map(u => u._id === userId ? { ...u, role: data.role } : u));
        setToast({ type: 'success', message: `Role updated to "${newRole}" for ${data.name ?? data.email}.` });
      }
    } catch {
      setToast({ type: 'error', message: 'Network error during update' });
    } finally {
      setUpdating(null);
    }
  };

  return (
    <div className="bg-slate-800 rounded-lg p-6">
      <div className="flex items-center gap-3 mb-6">
        <Shield className="w-6 h-6 text-orange-400" />
        <h2 className="text-xl font-semibold text-white">User Management</h2>
      </div>

      {toast && (
        <div className={`flex items-center gap-2 mb-4 p-3 rounded-lg border text-sm ${
          toast.type === 'success'
            ? 'bg-green-500/10 border-green-500/20 text-green-400'
            : 'bg-red-500/10 border-red-500/20 text-red-400'
        }`}>
          {toast.type === 'success'
            ? <CheckCircle className="w-4 h-4 shrink-0" />
            : <AlertCircle className="w-4 h-4 shrink-0" />}
          {toast.message}
        </div>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-slate-400">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Loading users…</span>
        </div>
      ) : error ? (
        <div className="flex items-center gap-2 text-red-400">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700 text-slate-400 text-left">
                <th className="pb-3 pr-4 font-medium">User</th>
                <th className="pb-3 pr-4 font-medium">Email</th>
                <th className="pb-3 font-medium">Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {users.map(user => (
                <tr key={user._id} className="py-2">
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-2">
                      {user.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={user.image} alt="" className="w-7 h-7 rounded-full" />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-slate-600 flex items-center justify-center">
                          <UserIcon className="w-4 h-4 text-slate-400" />
                        </div>
                      )}
                      <span className="text-white">{user.name ?? '—'}</span>
                    </div>
                  </td>
                  <td className="py-3 pr-4 text-slate-300">{user.email}</td>
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <select
                        value={user.role}
                        onChange={e => handleRoleChange(user._id, e.target.value as 'admin' | 'user')}
                        disabled={updating === user._id}
                        className="bg-slate-700 border border-slate-600 text-white rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500 disabled:opacity-50"
                      >
                        <option value="user">user</option>
                        <option value="admin">admin</option>
                      </select>
                      {updating === user._id && (
                        <Loader2 className="w-4 h-4 text-orange-400 animate-spin" />
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {users.length === 0 && (
            <p className="text-slate-400 text-center py-6">No users found.</p>
          )}
        </div>
      )}
    </div>
  );
}
