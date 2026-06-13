/**
 * Project: FUSION NEURAL
 * Created by: Miftah Afreza Maulana (rrez_.maulana)
 * Role: Product Engineer (UI/UX & Full-Stack)
 * Copyright (c) 2026. All rights reserved.
 */
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { Flame, AlertTriangle, Server, Cpu, Cloud, Zap, CheckCircle2 } from 'lucide-react';
import { FirebaseLogger } from '../../../services/FirebaseLogger';
import PageHeader from '../../../components/ui/PageHeader';

const INFRA_COSTS = [
  { name: 'Groq API (LLM)', monthly: 350000, icon: Cpu, color: 'text-purple-600 bg-purple-50' },
  { name: 'Firebase (Firestore + Auth)', monthly: 150000, icon: Cloud, color: 'text-blue-600 bg-blue-50' },
  { name: 'Vercel (Hosting)', monthly: 0, icon: Server, color: 'text-slate-600 bg-slate-100' },
];

export default function OperationalBurnPage() {
  const [finance, setFinance] = useState<any>(null);
  const [budgetCap, setBudgetCap] = useState(1000000);
  const [inputCap, setInputCap] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'financial_reports', 'latest'), (snap) => {
      if (snap.exists()) setFinance(snap.data());
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'financial_policy', 'config'), (snap) => {
      if (snap.exists() && snap.data().budget_cap) {
        setBudgetCap(snap.data().budget_cap);
        setInputCap(snap.data().budget_cap.toString());
      }
    });
    return () => unsub();
  }, []);

  const apiCost = finance?.api_cost ?? 0;
  const totalInfra = INFRA_COSTS.reduce((a, c) => a + c.monthly, 0);
  const totalBurn = apiCost + totalInfra;
  const burnPct = budgetCap > 0 ? Math.min((totalBurn / budgetCap) * 100, 100) : 0;
  const isOverBudget = totalBurn > budgetCap;

  const handleSaveCap = async () => {
    const cap = parseInt(inputCap) || 0;
    if (cap <= 0) return;
    setIsSaving(true);
    try {
      await setDoc(doc(db, 'financial_policy', 'config'), { budget_cap: cap }, { merge: true });
      setBudgetCap(cap);
      await FirebaseLogger.logAgentAction('Finance', 'BUDGET_CAP_SET', `Budget cap diubah ke Rp ${cap.toLocaleString('id-ID')}`);
      setSavedMsg('Budget cap tersimpan!');
      setTimeout(() => setSavedMsg(''), 3000);
    } catch (e) { console.error(e); }
    finally { setIsSaving(false); }
  };

  return (
    <div className="space-y-6 pb-10">
      <PageHeader
        title="Operational Burn"
        subtitle="Biaya infrastruktur — memantau setiap tetes pengeluaran sistem"
        accent="purple"
        icon={<Flame size={22} className="text-white" />}
      />

      {/* Burn Rate Alert */}
      {isOverBudget && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 bg-rose-50 border border-rose-200 rounded-2xl p-4"
        >
          <AlertTriangle size={18} className="text-rose-500 shrink-0" />
          <div>
            <p className="text-sm font-black text-rose-700">Burn Rate Alert!</p>
            <p className="text-xs text-rose-600">Total biaya melebihi budget cap. Review pengeluaran segera.</p>
          </div>
        </motion.div>
      )}

      {/* Budget Gauge */}
      <motion.div id="burn-gauge" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className={`relative rounded-3xl p-8 overflow-hidden shadow-sm border ${isOverBudget ? 'bg-rose-50 border-rose-200' : 'bg-white border-slate-200'}`}
      >
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-4">
            <Flame size={16} className={isOverBudget ? 'text-rose-500' : 'text-amber-500'} />
            <span className={`text-xs font-bold uppercase tracking-widest ${isOverBudget ? 'text-rose-600' : 'text-amber-500'}`}>
              {isOverBudget ? 'OVER BUDGET' : 'Burn Monitor'}
            </span>
          </div>
          <div className="flex items-end gap-3 mb-2">
            <span className={`text-4xl font-black ${isOverBudget ? 'text-rose-600' : 'text-slate-800'}`}>Rp {totalBurn.toLocaleString('id-ID')}</span>
            <span className={`${isOverBudget ? 'text-rose-500' : 'text-slate-500'} text-sm mb-1`}>/ bulan</span>
          </div>
          <div className={`w-full rounded-full h-3 mb-2 ${isOverBudget ? 'bg-rose-200' : 'bg-slate-100'}`}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${burnPct}%` }}
              transition={{ duration: 1.5, ease: 'easeOut' }}
              className={`h-3 rounded-full ${isOverBudget ? 'bg-rose-500' : burnPct > 70 ? 'bg-amber-500' : 'bg-purple-500'}`}
            />
          </div>
          <p className={`${isOverBudget ? 'text-rose-600' : 'text-slate-500'} text-xs`}>{burnPct.toFixed(1)}% dari budget cap Rp {budgetCap.toLocaleString('id-ID')}</p>
        </div>
      </motion.div>

      {/* Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* API Token Audit */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm"
        >
          <h3 className="text-sm font-black text-slate-800 mb-5 flex items-center gap-2">
            <Zap size={15} className="text-purple-500" /> API Token Audit
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-600">Total API Cost (bulan ini)</p>
                <p className="text-2xl font-black text-slate-800">Rp {apiCost.toLocaleString('id-ID')}</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center">
                <Cpu size={20} className="text-purple-500" />
              </div>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 space-y-2">
              {[
                { label: 'Campaign Forge', cost: Math.round(apiCost * 0.35) },
                { label: 'Strategic Audit', cost: Math.round(apiCost * 0.40) },
                { label: 'Market Signals', cost: Math.round(apiCost * 0.15) },
                { label: 'Others', cost: Math.round(apiCost * 0.10) },
              ].map((item, i) => (
                <div key={i} className="flex justify-between text-xs">
                  <span className="text-slate-500">{item.label}</span>
                  <span className="font-bold text-slate-700">Rp {item.cost.toLocaleString('id-ID')}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Infrastructure Cost */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm"
        >
          <h3 className="text-sm font-black text-slate-800 mb-5 flex items-center gap-2">
            <Server size={15} className="text-blue-500" /> Infrastructure Cost
          </h3>
          <div className="space-y-3">
            {INFRA_COSTS.map((infra, i) => (
              <div key={i} className={`flex items-center gap-3 p-3 rounded-xl ${infra.color.split(' ')[1]}`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${infra.color}`}>
                  <infra.icon size={14} />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-bold text-slate-700">{infra.name}</p>
                </div>
                <span className="text-sm font-black text-slate-800">
                  {infra.monthly === 0 ? <span className="text-purple-600 text-xs font-bold">FREE</span> : `Rp ${infra.monthly.toLocaleString('id-ID')}`}
                </span>
              </div>
            ))}
            <div className="border-t border-slate-100 pt-3 flex justify-between">
              <span className="text-xs font-bold text-slate-500">Total Infrastruktur</span>
              <span className="text-sm font-black text-slate-800">Rp {totalInfra.toLocaleString('id-ID')}</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Budget Cap Setting */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
        <h3 className="text-sm font-black text-slate-800 mb-4 flex items-center gap-2">
          <Flame size={15} className="text-amber-500" /> Budget Cap Setting
        </h3>
        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Batas Pengeluaran Bulanan (Rp)</label>
            <input
              type="number"
              value={inputCap}
              onChange={e => setInputCap(e.target.value)}
              placeholder={budgetCap.toString()}
              className="w-full text-sm text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 ring-purple-300"
            />
          </div>
          <button onClick={handleSaveCap} disabled={isSaving}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-bold rounded-xl transition-all ${savedMsg ? 'bg-purple-600 text-white' : 'bg-slate-800 text-white hover:bg-slate-700'} disabled:opacity-50`}
          >
            {savedMsg ? <><CheckCircle2 size={14} /> Tersimpan!</> : 'Simpan'}
          </button>
        </div>
      </div>
    </div>
  );
}

