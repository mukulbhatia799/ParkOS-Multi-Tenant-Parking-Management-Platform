import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, ParkingSquare, AlertCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/Button";

const DEMO_ACCOUNTS = [
  { label: "Admin", email: "admin@demomall.com" },
  { label: "Operator", email: "operator@demomall.com" },
  { label: "Super Admin", email: "super@platform.com" },
];

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("admin@demomall.com");
  const [password, setPassword] = useState("Password123!");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      navigate("/dashboard");
    } catch {
      setError("Invalid email or password");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-accent-50 px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center gap-2 mb-6">
          <div className="h-11 w-11 rounded-xl bg-accent-500 flex items-center justify-center shadow-soft">
            <ParkingSquare className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-xl font-semibold text-slate-900">ParkOS</h1>
          <p className="text-sm text-slate-500">Sign in to your parking operations dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white border border-slate-200 shadow-softLg rounded-2xl p-7 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-400 focus:border-accent-400"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-400 focus:border-accent-400"
                required
              />
            </div>
          </div>

          {error && (
            <p className="flex items-center gap-1.5 text-status-critical text-xs">
              <AlertCircle className="h-3.5 w-3.5" /> {error}
            </p>
          )}

          <Button type="submit" loading={loading} className="w-full">
            Sign in
          </Button>

          <p className="text-center text-xs text-slate-500">
            New here?{" "}
            <Link to="/signup" className="text-accent-600 font-medium hover:underline">
              Sign up
            </Link>
          </p>
        </form>

        <div className="mt-4 border border-slate-200 rounded-xl bg-white/70 p-3">
          <p className="text-xs text-slate-500 mb-2 text-center">Quick-fill a demo account (password: Password123!)</p>
          <div className="flex items-center justify-center gap-2 flex-wrap">
            {DEMO_ACCOUNTS.map((acc) => (
              <button
                key={acc.email}
                type="button"
                onClick={() => {
                  setEmail(acc.email);
                  setPassword("Password123!");
                }}
                className="text-xs px-2.5 py-1 rounded-full border border-slate-200 text-slate-600 hover:bg-accent-50 hover:border-accent-200 hover:text-accent-700 transition"
              >
                {acc.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
