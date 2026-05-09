import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, Settings, Package, ShieldAlert, Zap, Server } from 'lucide-react';

export default function NeuralSettingsPage() {
  const [config, setConfig] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const baseUrl = import.meta.env.VITE_PYTHON_BACKEND_URL || 'http://localhost:8000';
      const apiKey = import.meta.env.VITE_BACKEND_API_KEY || 'fusion-neural-secret-key-2026';
      const res = await fetch(`${baseUrl}/api/business-logic`, {
        headers: { 'X-API-KEY': apiKey }
      });
      const data = await res.json();
      setConfig(data);
    } catch (e) {
      console.error(e);
    }
  };

  const saveConfig = async () => {
    setIsSaving(true);
    setStatusMsg("");
    try {
      const baseUrl = import.meta.env.VITE_PYTHON_BACKEND_URL || 'http://localhost:8000';
      const apiKey = import.meta.env.VITE_BACKEND_API_KEY || 'fusion-neural-secret-key-2026';
      await fetch(`${baseUrl}/api/business-logic`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-API-KEY': apiKey
        },
        body: JSON.stringify(config)
      });
      setStatusMsg("Configuration synchronized to Neural Engine.");
      setTimeout(() => setStatusMsg(""), 3000);
    } catch (e) {
      setStatusMsg("Failed to synchronize.");
      console.error(e);
    }
    setIsSaving(false);
  };

  if (!config) return <div className="p-8 text-slate-400">Loading Neural Config...</div>;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="pb-20">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
            <Settings size={24} className="text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-100">Neural Command Center</h1>
            <p className="text-sm text-slate-400 mt-1 font-mono">AUTONOMOUS BUSINESS LOGIC & DATA REFERENCE</p>
          </div>
        </div>
        <button 
          onClick={saveConfig}
          disabled={isSaving}
          className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold transition-all shadow-[0_0_20px_rgba(79,70,229,0.3)] disabled:opacity-50"
        >
          <Save size={18} />
          {isSaving ? 'Syncing...' : 'Save & Sync to AI'}
        </button>
      </div>

      {statusMsg && (
        <div className="mb-6 p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-sm flex items-center gap-3">
          <Server size={16} />
          {statusMsg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Heartbeat Logic */}
        <div className="bg-slate-900/50 border border-slate-700/50 rounded-2xl p-6 backdrop-blur-sm">
          <div className="flex items-center gap-3 mb-6">
            <Zap className="text-amber-400" size={20} />
            <h2 className="text-lg font-bold text-slate-200">Autonomous Heartbeat (Loop Interval)</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-slate-400">Business Start Hour</label>
              <input 
                type="time" 
                value={config.business_hours?.start || "08:00"}
                onChange={(e) => setConfig({...config, business_hours: {...config.business_hours, start: e.target.value}})}
                className="bg-black/40 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 w-32 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-slate-400">Business End Hour</label>
              <input 
                type="time" 
                value={config.business_hours?.end || "20:00"}
                onChange={(e) => setConfig({...config, business_hours: {...config.business_hours, end: e.target.value}})}
                className="bg-black/40 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 w-32 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-slate-400">Active Interval (Minutes)</label>
              <input 
                type="number" 
                value={config.business_hours?.active_interval_minutes || 10}
                onChange={(e) => setConfig({...config, business_hours: {...config.business_hours, active_interval_minutes: parseInt(e.target.value)}})}
                className="bg-black/40 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 w-32 focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>
            <p className="text-xs text-slate-500 mt-2">The engine will check for tasks every {config.business_hours?.active_interval_minutes} minutes during business hours.</p>
          </div>
        </div>

        {/* Guardrails */}
        <div className="bg-slate-900/50 border border-slate-700/50 rounded-2xl p-6 backdrop-blur-sm">
          <div className="flex items-center gap-3 mb-6">
            <ShieldAlert className="text-red-400" size={20} />
            <h2 className="text-lg font-bold text-slate-200">Neural Guardrails</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-slate-400">Admin Cooldown (Hours)</label>
              <input 
                type="number" 
                value={config.rules?.admin?.cooldown_hours_per_item || 12}
                onChange={(e) => setConfig({...config, rules: {...config.rules, admin: {...config.rules?.admin, cooldown_hours_per_item: parseInt(e.target.value)}}})}
                className="bg-black/40 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 w-32 focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-slate-400">Marketing Quota / Day</label>
              <input 
                type="number" 
                value={config.rules?.marketing?.max_posts_per_day || 2}
                onChange={(e) => setConfig({...config, rules: {...config.rules, marketing: {...config.rules?.marketing, max_posts_per_day: parseInt(e.target.value)}}})}
                className="bg-black/40 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 w-32 focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-slate-400">Minimum Ops Budget</label>
              <input 
                type="number" 
                value={config.rules?.finance?.minimum_budget_threshold || 1000000}
                onChange={(e) => setConfig({...config, rules: {...config.rules, finance: {...config.rules?.finance, minimum_budget_threshold: parseInt(e.target.value)}}})}
                className="bg-black/40 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 w-48 focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>
          </div>
        </div>

        {/* Master Products List */}
        <div className="lg:col-span-2 bg-slate-900/50 border border-slate-700/50 rounded-2xl p-6 backdrop-blur-sm">
          <div className="flex items-center gap-3 mb-6">
            <Package className="text-emerald-400" size={20} />
            <h2 className="text-lg font-bold text-slate-200">Master Product Reference</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="pb-3 text-sm font-bold text-slate-400 uppercase tracking-wider">SKU / ID</th>
                  <th className="pb-3 text-sm font-bold text-slate-400 uppercase tracking-wider">Product Name</th>
                  <th className="pb-3 text-sm font-bold text-slate-400 uppercase tracking-wider">HPP (Modal)</th>
                  <th className="pb-3 text-sm font-bold text-slate-400 uppercase tracking-wider">Selling Price</th>
                  <th className="pb-3 text-sm font-bold text-slate-400 uppercase tracking-wider">Safety Stock</th>
                </tr>
              </thead>
              <tbody>
                {Object.keys(config.products || {}).map(sku => (
                  <tr key={sku} className="border-b border-slate-800/50">
                    <td className="py-4 font-mono text-sm text-slate-300">{sku}</td>
                    <td className="py-4">
                      <input 
                        type="text" 
                        value={config.products[sku].name}
                        onChange={(e) => setConfig({...config, products: {...config.products, [sku]: {...config.products[sku], name: e.target.value}}})}
                        className="bg-black/20 border border-transparent hover:border-slate-700 focus:border-indigo-500 rounded px-3 py-1.5 text-slate-200 w-full outline-none transition-colors"
                      />
                    </td>
                    <td className="py-4">
                      <input 
                        type="number" 
                        value={config.products[sku].hpp}
                        onChange={(e) => setConfig({...config, products: {...config.products, [sku]: {...config.products[sku], hpp: parseInt(e.target.value)}}})}
                        className="bg-black/20 border border-transparent hover:border-slate-700 focus:border-indigo-500 rounded px-3 py-1.5 text-slate-200 w-32 outline-none font-mono transition-colors"
                      />
                    </td>
                    <td className="py-4">
                      <input 
                        type="number" 
                        value={config.products[sku].selling_price}
                        onChange={(e) => setConfig({...config, products: {...config.products, [sku]: {...config.products[sku], selling_price: parseInt(e.target.value)}}})}
                        className="bg-black/20 border border-transparent hover:border-slate-700 focus:border-indigo-500 rounded px-3 py-1.5 text-slate-200 w-32 outline-none font-mono transition-colors"
                      />
                    </td>
                    <td className="py-4">
                      <input 
                        type="number" 
                        value={config.products[sku].safety_stock}
                        onChange={(e) => setConfig({...config, products: {...config.products, [sku]: {...config.products[sku], safety_stock: parseInt(e.target.value)}}})}
                        className="bg-black/20 border border-transparent hover:border-slate-700 focus:border-indigo-500 rounded px-3 py-1.5 text-slate-200 w-24 outline-none font-mono transition-colors"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
