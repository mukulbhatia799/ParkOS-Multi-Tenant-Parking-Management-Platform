import axios from "axios";
import { FormEvent, useEffect, useState } from "react";
import { UserPlus, Trash2, ShieldOff, ShieldCheck } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { listUsers, inviteUser, updateUser, deleteUser } from "../api/users.api";
import { AppUser, Role, ROLE_LABELS } from "../types";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";

function extractError(err: unknown): string {
  if (axios.isAxiosError(err) && typeof err.response?.data?.error === "string") return err.response.data.error;
  return "Something went wrong";
}

const INVITABLE_ROLES = [Role.CLIENT_ADMIN, Role.OPERATOR];

function statusBadge(status: AppUser["status"]) {
  if (status === "active") return <Badge tone="success">Active</Badge>;
  if (status === "invited") return <Badge tone="warning">Invited</Badge>;
  return <Badge tone="danger">Disabled</Badge>;
}

export function Users() {
  const { user } = useAuth();

  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteForm, setInviteForm] = useState({ name: "", email: "", role: Role.OPERATOR });
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviting, setInviting] = useState(false);

  const isAdmin = user?.role === Role.CLIENT_ADMIN;

  useEffect(() => {
    if (!isAdmin || !user?.clientId) {
      setLoading(false);
      return;
    }
    listUsers(user.clientId)
      .then(setUsers)
      .catch(() => setError("Failed to load users"))
      .finally(() => setLoading(false));
  }, [isAdmin, user?.clientId]);

  async function handleInvite(e: FormEvent) {
    e.preventDefault();
    if (!user?.clientId) return;
    setInviteError(null);
    setInviting(true);
    try {
      const created = await inviteUser(user.clientId, inviteForm);
      setUsers((prev) => [created, ...prev]);
      setShowInviteForm(false);
      setInviteForm({ name: "", email: "", role: Role.OPERATOR });
    } catch (err) {
      setInviteError(extractError(err));
    } finally {
      setInviting(false);
    }
  }

  async function handleToggleStatus(target: AppUser) {
    if (!user?.clientId || target.status === "invited") return;
    try {
      const nextStatus = target.status === "active" ? "disabled" : "active";
      const updated = await updateUser(user.clientId, target._id, { status: nextStatus });
      setUsers((prev) => prev.map((u) => (u._id === target._id ? updated : u)));
    } catch { /* ignore */ }
  }

  async function handleRoleChange(target: AppUser, role: Role) {
    if (!user?.clientId) return;
    try {
      const updated = await updateUser(user.clientId, target._id, { role });
      setUsers((prev) => prev.map((u) => (u._id === target._id ? updated : u)));
    } catch { /* ignore */ }
  }

  async function handleDelete(target: AppUser) {
    if (!user?.clientId) return;
    try {
      await deleteUser(user.clientId, target._id);
      setUsers((prev) => prev.filter((u) => u._id !== target._id));
    } catch { /* ignore */ }
  }

  if (!isAdmin) {
    return (
      <Card className="max-w-md">
        <p className="text-sm text-slate-600">Access restricted to Admins.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Team</h2>
          <p className="text-sm text-slate-500">Invite teammates and manage their access.</p>
        </div>
        <Button icon={<UserPlus className="h-4 w-4" />} onClick={() => setShowInviteForm((v) => !v)}>
          {showInviteForm ? "Cancel" : "Invite"}
        </Button>
      </div>

      {showInviteForm && (
        <Card>
          <form onSubmit={handleInvite} className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-slate-500">Name</label>
                <input
                  className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-accent-400"
                  value={inviteForm.name}
                  onChange={(e) => setInviteForm((f) => ({ ...f, name: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="text-xs text-slate-500">Email</label>
                <input
                  type="email"
                  className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-accent-400"
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm((f) => ({ ...f, email: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="text-xs text-slate-500">Role</label>
                <select
                  className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-accent-400"
                  value={inviteForm.role}
                  onChange={(e) => setInviteForm((f) => ({ ...f, role: e.target.value as Role }))}
                >
                  {INVITABLE_ROLES.map((r) => (
                    <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                  ))}
                </select>
              </div>
            </div>
            {inviteError && <p className="text-status-critical text-sm">{inviteError}</p>}
            <Button type="submit" loading={inviting} size="sm">Send Invite</Button>
          </form>
        </Card>
      )}

      {error && <p className="text-status-critical text-sm">{error}</p>}
      {loading && <p className="text-slate-500 text-sm">Loading...</p>}

      {!loading && !error && (
        <Card padded={false} className="overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-4 py-2.5 font-medium">Name</th>
                <th className="px-4 py-2.5 font-medium">Email</th>
                <th className="px-4 py-2.5 font-medium">Role</th>
                <th className="px-4 py-2.5 font-medium">Status</th>
                <th className="px-4 py-2.5 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id} className="border-t border-slate-100">
                  <td className="px-4 py-2.5 font-medium text-slate-800">{u.name}</td>
                  <td className="px-4 py-2.5 text-slate-600">{u.email}</td>
                  <td className="px-4 py-2.5">
                    {u.role === Role.SUPER_ADMIN ? (
                      <Badge tone="info">{ROLE_LABELS[u.role]}</Badge>
                    ) : (
                      <select
                        className="border border-slate-200 rounded-md px-1.5 py-0.5 text-xs"
                        value={u.role}
                        onChange={(e) => handleRoleChange(u, e.target.value as Role)}
                      >
                        {INVITABLE_ROLES.map((r) => (
                          <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                        ))}
                      </select>
                    )}
                  </td>
                  <td className="px-4 py-2.5">{statusBadge(u.status)}</td>
                  <td className="px-4 py-2.5">
                    <div className="flex justify-end gap-1.5">
                      {u.status !== "invited" && (
                        <button
                          onClick={() => handleToggleStatus(u)}
                          title={u.status === "active" ? "Disable" : "Enable"}
                          className="p-1.5 rounded-md border border-slate-200 text-slate-500 hover:bg-slate-50"
                        >
                          {u.status === "active" ? <ShieldOff className="h-3.5 w-3.5" /> : <ShieldCheck className="h-3.5 w-3.5" />}
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(u)}
                        title="Remove"
                        className="p-1.5 rounded-md border border-slate-200 text-status-critical hover:bg-red-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-slate-500">
                    No teammates yet. Invite one above.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
