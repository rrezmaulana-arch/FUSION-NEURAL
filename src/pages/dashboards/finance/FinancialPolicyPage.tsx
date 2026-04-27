import { useState, useEffect } from 'react';

import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { Shield as _S, Save, CheckCircle2, RefreshCw, Percent, DollarSign, PiggyBank } from 'lucide-react';
import { FirebaseLogger } from '../../../services/FirebaseLogger';

interface PolicyConfig {
  margin_target: number;
  budget_cap: number;
  tax_reserve_pct: number;
  emergency_reserve_pct: number;
  daily_agent_limit: number;
}

const DEFAULT_POLICY: PolicyConfig = {
  margin_target: 20,
  budget_cap: 1000000,
  tax_reserve_pct: 11,
  emergency_reserve_pct: 5,
  daily_agent_limit: 100,
};

export default function FinancialPolicyPage() {
  const [policy, setPolicy] = useState<PolicyConfig>(DEFAULT_POLICY);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'financial_policy', 'config'), (snap) => {
      if (snap.exists()) {
        setPolicy({ ...DEFAULT_POLICY, ...snap.data() });
      }
    });
    return () => unsub();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    setSaved(false);
    try {
      await setDoc(doc(db, 'financial_policy', 'config'), policy, { merge: true });
      await FirebaseLogger.logAgentAction('Finance', 'POLICY_UPDATED', `Margin target: ${policy.margin_target}%, Budget cap: Rp ${policy.budget_cap.toLocaleString('id-ID')}`);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) { console.error(e); }
    finally { setIsSaving(false); }
  };

  const update = (key: keyof PolicyConfig, value: number) => {
    setPolicy(p => ({ ...p, [key]: value }));
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-start sm:items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Financial Policy</h1>
          <p className="text-slate-500 text-sm mt-1">Blueprint kebijakan — aturan main finansial bagi seluruh agen AI</p>
        </div>
        <button onClick={handleSave} disabled={isSaving}
          className={`shrink-0 flex items-center gap-2 px-5 py-2.5 text-sm font-bold rounded-xl transition-all shadow-md ${saved ? 'bg-emerald-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-white'} disabled:opacity-50`}
        >
          {isSaving ? <><RefreshCw size={15} className="animate-spin" /> Menyimpan...</>
            : saved ? <><CheckCircle2 size={15} /> Tersimpan!</>
            : <><Save size={15} /> Simpan Policy</>}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Margin Locking */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
              <Percent size={18} className="text-emerald-600" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-800">Margin Locking</h3>
              <p className="text-[10px] text-slate-400">Target profit minimum yang harus dikejar AI Marketing</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Target Margin (%)</label>
                <span className="text-xs font-black text-emerald-600">{policy.margin_target}%</span>
              </div>
              <input
                type="range" min={5} max={60} step={1}
                value={policy.margin_target}
                onChange={e => update('margin_target', parseInt(e.target.value))}
                className="w-full accent-emerald-500"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>5% (Minimal)</span><span>60% (Premium)</span>
              </div>
            </div>
            <div className={`p-3 rounded-xl text-xs font-bold ${
              policy.margin_target >= 30 ? 'bg-emerald-50 text-emerald-700' :
              policy.margin_target >= 20 ? 'bg-blue-50 text-blue-700' :
              'bg-amber-50 text-amber-700'
            }`}>
              {policy.margin_target >= 30 ? 'Target agresif — AI Marketing akan memprioritaskan produk premium'
                : policy.margin_target >= 20 ? 'Target sehat — keseimbangan volume & profitabilitas'
                : 'Target konservatif — waspadai kompetitor dengan margin lebih tinggi'}
            </div>
          </div>
        </div>

        {/* Budget Cap */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
              <DollarSign size={18} className="text-amber-600" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-800">Budget Cap</h3>
              <p className="text-[10px] text-slate-400">Batas pengeluaran bulanan agen otonom</p>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Batas Bulanan (Rp)</label>
              <input
                type="number"
                value={policy.budget_cap}
                onChange={e => update('budget_cap', parseInt(e.target.value) || 0)}
                className="w-full text-sm text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 ring-emerald-300"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Limit API Calls Harian (per Agen)</label>
              <input
                type="number"
                value={policy.daily_agent_limit}
                onChange={e => update('daily_agent_limit', parseInt(e.target.value) || 0)}
                className="w-full text-sm text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 ring-emerald-300"
              />
            </div>
          </div>
        </div>

        {/* Tax & Reserve */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm md:col-span-2">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <PiggyBank size={18} className="text-blue-600" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-800">Tax & Reserve Automation</h3>
              <p className="text-[10px] text-slate-400">Penyisihan dana otomatis dari setiap transaksi</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Pajak PPN (%)</label>
                <span className="text-xs font-black text-blue-600">{policy.tax_reserve_pct}%</span>
              </div>
              <input
                type="range" min={0} max={20} step={0.5}
                value={policy.tax_reserve_pct}
                onChange={e => update('tax_reserve_pct', parseFloat(e.target.value))}
                className="w-full accent-blue-500"
              />
              <p className="text-[10px] text-slate-400 mt-1">PPN Indonesia standar 11%</p>
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Dana Darurat (%)</label>
                <span className="text-xs font-black text-purple-600">{policy.emergency_reserve_pct}%</span>
              </div>
              <input
                type="range" min={0} max={20} step={1}
                value={policy.emergency_reserve_pct}
                onChange={e => update('emergency_reserve_pct', parseInt(e.target.value))}
                className="w-full accent-purple-500"
              />
              <p className="text-[10px] text-slate-400 mt-1">Disarankan min. 5% dari revenue</p>
            </div>
          </div>

          {/* Policy Preview */}
          <div className="mt-5 bg-slate-900 rounded-xl p-4">
            <p className="text-teal-400 text-[10px] font-bold uppercase tracking-widest mb-3">Policy Preview — Yang Diterapkan ke Semua Agen</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'Min Margin', value: `${policy.margin_target}%` },
                { label: 'Budget Cap', value: `Rp ${(policy.budget_cap/1e6).toFixed(1)}M` },
                { label: 'PPN', value: `${policy.tax_reserve_pct}%` },
                { label: 'Dana Darurat', value: `${policy.emergency_reserve_pct}%` },
              ].map((item, i) => (
                <div key={i} className="text-center bg-white/5 rounded-lg py-2">
                  <p className="text-slate-500 text-[9px] font-bold uppercase">{item.label}</p>
                  <p className="text-white text-sm font-black mt-0.5">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
