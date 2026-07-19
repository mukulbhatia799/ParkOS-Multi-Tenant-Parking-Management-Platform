import axios from "axios";
import { useEffect, useState } from "react";
import { getLots } from "../api/slots.api";
import { getBillingRecords, getPricingRules, createPricingRule, updatePricingRule, deletePricingRule } from "../api/billing.api";
import { useAuth } from "../context/AuthContext";
import { getSocket } from "../socket/socketClient";
import { BillingRecord, FeeCalculatedPayload, ParkingLot, PricingRule, Role } from "../types";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";

function fmt(amount: number, currency: string) {
  return `${currency} ${amount.toLocaleString("en-IN")}`;
}

function extractError(err: unknown) {
  if (axios.isAxiosError(err) && typeof err.response?.data?.error === "string") return err.response.data.error;
  return "Something went wrong";
}

export function Billing() {
  const { token, user } = useAuth();
  const isAdmin = user?.role === Role.CLIENT_ADMIN || user?.role === Role.SUPER_ADMIN;

  const [lots, setLots] = useState<ParkingLot[]>([]);
  const [selectedLotId, setSelectedLotId] = useState<string | null>(null);
  const [billingRecords, setBillingRecords] = useState<BillingRecord[]>([]);
  const [pricingRules, setPricingRules] = useState<PricingRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // New rule form
  const [showRuleForm, setShowRuleForm] = useState(false);
  const [ruleForm, setRuleForm] = useState({ name: "", ratePerHour: 50, currency: "INR", gracePeriodMinutes: 15, maxDailyCharge: "" });
  const [ruleError, setRuleError] = useState<string | null>(null);
  const [savingRule, setSavingRule] = useState(false);

  useEffect(() => {
    getLots().then((data) => {
      setLots(data);
      if (data.length > 0) setSelectedLotId(data[0]._id);
      else setLoading(false);
    }).catch(() => { setError("Failed to load lots"); setLoading(false); });
  }, []);

  useEffect(() => {
    if (!selectedLotId) return;
    setLoading(true);
    Promise.all([getBillingRecords(selectedLotId), getPricingRules(selectedLotId)])
      .then(([billing, rules]) => {
        setBillingRecords(billing);
        setPricingRules(rules);
        setLoading(false);
      })
      .catch(() => { setError("Failed to load billing data"); setLoading(false); });
  }, [selectedLotId]);

  // Live fee events via socket
  useEffect(() => {
    if (!token || !selectedLotId) return;
    const socket = getSocket(token);
    socket.emit("subscribe:lot", selectedLotId);

    function handleFee(payload: FeeCalculatedPayload) {
      if (payload.lotId !== selectedLotId) return;
      const newRecord: BillingRecord = {
        _id: payload.billingRecordId,
        clientId: "",
        parkingRecordId: payload.parkingRecordId,
        lotId: payload.lotId,
        licensePlate: payload.licensePlate,
        durationMinutes: payload.durationMinutes,
        amountDue: payload.amountDue,
        currency: payload.currency,
        calculatedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };
      setBillingRecords((prev) => [newRecord, ...prev]);
    }

    socket.on("fee:calculated", handleFee);
    return () => { socket.off("fee:calculated", handleFee); };
  }, [token, selectedLotId]);

  async function handleCreateRule() {
    if (!selectedLotId) return;
    setRuleError(null);
    setSavingRule(true);
    try {
      const rule = await createPricingRule({
        lotId: selectedLotId,
        name: ruleForm.name,
        ratePerHour: ruleForm.ratePerHour,
        currency: ruleForm.currency,
        gracePeriodMinutes: ruleForm.gracePeriodMinutes,
        maxDailyCharge: ruleForm.maxDailyCharge ? Number(ruleForm.maxDailyCharge) : undefined,
      });
      setPricingRules((prev) => [rule, ...prev]);
      setShowRuleForm(false);
      setRuleForm({ name: "", ratePerHour: 50, currency: "INR", gracePeriodMinutes: 15, maxDailyCharge: "" });
    } catch (err) {
      setRuleError(extractError(err));
    } finally {
      setSavingRule(false);
    }
  }

  async function handleToggleRule(rule: PricingRule) {
    try {
      const updated = await updatePricingRule(rule._id, { isActive: !rule.isActive });
      setPricingRules((prev) => prev.map((r) => (r._id === rule._id ? updated : r)));
    } catch { /* ignore */ }
  }

  async function handleDeleteRule(ruleId: string) {
    try {
      await deletePricingRule(ruleId);
      setPricingRules((prev) => prev.filter((r) => r._id !== ruleId));
    } catch { /* ignore */ }
  }

  return (
    <div className="space-y-6">
      {/* Header + lot selector */}
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-semibold text-slate-900">Billing</h2>
        {lots.length > 1 && (
          <select className="border border-slate-200 rounded-lg px-2 py-1 text-sm" value={selectedLotId ?? ""} onChange={(e) => setSelectedLotId(e.target.value)}>
            {lots.map((l) => <option key={l._id} value={l._id}>{l.name}</option>)}
          </select>
        )}
        {lots.length === 1 && <span className="text-sm text-slate-500">{lots[0].name}</span>}
      </div>

      {error && <p className="text-status-critical text-sm">{error}</p>}
      {loading && <p className="text-slate-500">Loading...</p>}

      {!loading && !error && (
        <>
          {/* Pricing Rules */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-800">Pricing Rules</h3>
              {isAdmin && (
                <Button size="sm" onClick={() => setShowRuleForm((v) => !v)}>
                  {showRuleForm ? "Cancel" : "+ Add Rule"}
                </Button>
              )}
            </div>

            {showRuleForm && isAdmin && (
              <Card className="bg-slate-50 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-500">Rule Name</label>
                    <input className="w-full border border-slate-200 rounded-lg px-2 py-1 text-sm mt-1" value={ruleForm.name}
                      onChange={(e) => setRuleForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Standard Rate" />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500">Rate / Hour</label>
                    <input type="number" className="w-full border border-slate-200 rounded-lg px-2 py-1 text-sm mt-1" value={ruleForm.ratePerHour}
                      onChange={(e) => setRuleForm((f) => ({ ...f, ratePerHour: Number(e.target.value) }))} />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500">Currency</label>
                    <input className="w-full border border-slate-200 rounded-lg px-2 py-1 text-sm mt-1" value={ruleForm.currency}
                      onChange={(e) => setRuleForm((f) => ({ ...f, currency: e.target.value }))} />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500">Grace Period (min)</label>
                    <input type="number" className="w-full border border-slate-200 rounded-lg px-2 py-1 text-sm mt-1" value={ruleForm.gracePeriodMinutes}
                      onChange={(e) => setRuleForm((f) => ({ ...f, gracePeriodMinutes: Number(e.target.value) }))} />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500">Max Daily Charge (optional)</label>
                    <input type="number" className="w-full border border-slate-200 rounded-lg px-2 py-1 text-sm mt-1" value={ruleForm.maxDailyCharge}
                      onChange={(e) => setRuleForm((f) => ({ ...f, maxDailyCharge: e.target.value }))} placeholder="Leave blank for no limit" />
                  </div>
                </div>
                {ruleError && <p className="text-status-critical text-sm">{ruleError}</p>}
                <Button size="sm" onClick={handleCreateRule} loading={savingRule} disabled={!ruleForm.name}>
                  Save Rule
                </Button>
              </Card>
            )}

            {pricingRules.length === 0 ? (
              <p className="text-slate-500 text-sm">No pricing rules yet. Add one above.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {pricingRules.map((rule) => (
                  <Card key={rule._id} className={`space-y-1 ${!rule.isActive ? "bg-slate-50 opacity-60" : ""}`}>
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-slate-800">{rule.name}</span>
                      <Badge tone={rule.isActive ? "success" : "neutral"}>{rule.isActive ? "Active" : "Inactive"}</Badge>
                    </div>
                    <p className="text-sm text-slate-600">{fmt(rule.ratePerHour, rule.currency)} / hour</p>
                    <p className="text-xs text-slate-500">Grace period: {rule.gracePeriodMinutes} min{rule.maxDailyCharge ? ` · Max/day: ${fmt(rule.maxDailyCharge, rule.currency)}` : ""}</p>
                    {isAdmin && (
                      <div className="flex gap-2 pt-1">
                        <Button size="sm" variant="secondary" onClick={() => handleToggleRule(rule)}>
                          {rule.isActive ? "Deactivate" : "Activate"}
                        </Button>
                        <Button size="sm" variant="danger" onClick={() => handleDeleteRule(rule._id)}>Delete</Button>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Billing Records */}
          <div className="space-y-2">
            <h3 className="font-semibold text-slate-800">Recent Billing Records</h3>
            <Card padded={false} className="overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-slate-500">
                  <tr>
                    <th className="px-3 py-2 font-medium">Plate</th>
                    <th className="px-3 py-2 font-medium">Duration</th>
                    <th className="px-3 py-2 font-medium">Amount Due</th>
                    <th className="px-3 py-2 font-medium">Calculated At</th>
                  </tr>
                </thead>
                <tbody>
                  {billingRecords.map((r) => (
                    <tr key={r._id} className="border-t border-slate-100">
                      <td className="px-3 py-2 font-mono font-medium text-slate-800">{r.licensePlate}</td>
                      <td className="px-3 py-2">{r.durationMinutes} min</td>
                      <td className="px-3 py-2 font-semibold text-status-good">{fmt(r.amountDue, r.currency)}</td>
                      <td className="px-3 py-2 text-slate-500">{new Date(r.calculatedAt).toLocaleString()}</td>
                    </tr>
                  ))}
                  {billingRecords.length === 0 && (
                    <tr><td colSpan={4} className="px-3 py-4 text-center text-slate-500">No billing records yet. Vehicle exits will appear here automatically.</td></tr>
                  )}
                </tbody>
              </table>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
