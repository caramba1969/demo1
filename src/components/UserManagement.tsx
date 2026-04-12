'use client';

import { useEffect, useState } from 'react';
import { Shield, User as UserIcon, Loader2, AlertCircle, CheckCircle, Trash2 } from 'lucide-react';
import { useSession } from 'next-auth/react';

interface UserStats {
  factoryCount: number;
  locationCount: number;
  productionLineCount: number;
}

interface UserRecord {
  _id: string;
  name?: string;
  email: string;
  image?: string;
  role: 'admin' | 'user';
  stats?: UserStats;
}

export function UserManagement() {
  const { data: session } = useSession();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    fetch('/api/admin/users?stats=true')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) setUsers(data);
        else setError(data.error ?? 'Failed to load users');
      })
      .catch(() => setError('Network error'))
      .finally(() => setLoading(false));
  }, []);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 5000);
  };

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
        showToast('error', data.error ?? 'Update failed');
      } else {
        setUsers(prev => prev.map(u => u._id === userId ? { ...u, role: data.role } : u));
        showToast('success', `Role updated to "${newRole}" for ${data.name ?? data.email}.`);
      }
    } catch {
      showToast('error', 'Network error during update');
    } finally {
      setUpdating(null);
    }
  };

  const handleDelete = async (userId: string) => {
    setUpdating(userId);
    setConfirmDelete(null);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) {
        showToast('error', data.error ?? 'Delete failed');
      } else {
        setUsers(prev => prev.filter(u => u._id !== userId));
        const d = data.deleted;
        showToast(
          'success',
          `"${data.email}" deleted — ${d.factories} factories, ${d.productionLines} production lines, ${d.locations} locations removed.`
        );
      }
    } catch {
      showToast('error', 'Network error during delete');
    } finally {
      setUpdating(null);
    }
  };

  const deleteWarning = (user: UserRecord) => {
    const s = user.stats;
    if (!s) return null;
    const parts: string[] = [];
    if (s.factoryCount > 0) parts.push(`${s.factoryCount} factor${s.factoryCount !== 1 ? 'ies' : 'y'}`);
    if (s.productionLineCount > 0) parts.push(`${s.productionLineCount} production line${s.productionLineCount !== 1 ? 's' : ''}`);
    if (s.locationCount > 0) parts.push(`${s.locationCount} location${s.locationCount !== 1 ? 's' : ''}`);
    return parts.length > 0 ? `Will permanently delete: ${parts.join(', ')}.` : 'No data found for this user.';
  };

  return (
    <div className="bg-slate-800 rounded-lg p-6">
      <div className="flex items-center gap-3 mb-6">
        <Shield className="w-6 h-6 text-orange-400" />
        <h2 className="text-xl font-semibold text-white">User Management</h2>
        <span className="ml-auto text-xs text-slate-400">{users.length} user{users.length !== 1 ? 's' : ''}</span>
      </div>

      {toast && (
        <div className={`flex items-start gap-2 mb-4 p-3 rounded-lg border text-sm ${
          toast.type === 'success'
            ? 'bg-green-500/10 border-green-500/20 text-green-400'
            : 'bg-red-500/10 border-red-500/20 text-red-400'
        }`}>
          {toast.type === 'success'
            ? <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
            : <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />}
          <span>{toast.message}</span>
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
                <th className="pb-3 pr-4 font-medium">Data</th>
                <th className="pb-3 pr-4 font-medium">Role</th>
                <th className="pb-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {users.map(user => {
                const isSelf = session?.user?.id === user._id;
                const isDeleting = updating === user._id;
                const isPendingConfirm = confirmDelete === user._id;

                return (
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
                        <span className="text-white">
                          {user.name ?? '—'}
                          {isSelf && <span className="ml-1 text-xs text-orange-400">(you)</span>}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 pr-4 text-slate-300">{user.email}</td>
                    <td className="py-3 pr-4">
                      {user.stats ? (
                        <div className="flex gap-2 text-xs text-slate-400">
                          <span title="Factories">🏭 {user.stats.factoryCount}</span>
                          <span title="Production lines">⚙️ {user.stats.productionLineCount}</span>
                          <span title="Locations">📍 {user.stats.locationCount}</span>
                        </div>
                      ) : (
                        <span className="text-slate-600 text-xs">—</span>
                      )}
                    </td>
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2">
                        <select
                          value={user.role}
                          onChange={e => handleRoleChange(user._id, e.target.value as 'admin' | 'user')}
                          disabled={isDeleting}
                          className="bg-slate-700 border border-slate-600 text-white rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500 disabled:opacity-50"
                        >
                          <option value="user">user</option>
                          <option value="admin">admin</option>
                        </select>
                        {isDeleting && (
                          <Loader2 className="w-4 h-4 text-orange-400 animate-spin" />
                        )}
                      </div>
                    </td>
                    <td className="py-3">
                      {isSelf ? (
                        <span className="text-xs text-slate-600 italic">—</span>
                      ) : isPendingConfirm ? (
                        <div className="flex flex-col gap-1">
                          <span className="text-xs text-red-400 font-medium">Are you sure?</span>
                          {deleteWarning(user) && (
                            <span className="text-xs text-slate-400">{deleteWarning(user)}</span>
                          )}
                          <div className="flex gap-2 mt-1">
                            <button
                              onClick={() => handleDelete(user._id)}
                              className="text-xs bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded transition-colors"
                            >
                              Yes, delete all
                            </button>
                            <button
                              onClick={() => setConfirmDelete(null)}
                              className="text-xs bg-slate-600 hover:bg-slate-500 text-white px-2 py-1 rounded transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDelete(user._id)}
                          disabled={isDeleting}
                          title="Delete user and all their data"
                          className="flex items-center gap-1 text-xs text-slate-400 hover:text-red-400 hover:bg-red-500/10 px-2 py-1 rounded transition-colors disabled:opacity-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
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
