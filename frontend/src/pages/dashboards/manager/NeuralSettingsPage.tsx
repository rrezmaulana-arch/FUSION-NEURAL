import { useState, useEffect } from 'react';
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
      const apiKey = import.meta.env.VITE_BACKEND_API_KEY || '';
      const res = await fetch(`${baseUrl}/api/business-logic`, {
        headers: { 'X-API-KEY': apiKey }
      });
      if (!res.ok) throw new Error('API Error');
      const data = await res.json();
      setConfig(data);
    } catch (e) {
      console.error("Fetch config failed, using fallback", e);
      // Fallback config so it doesn't get stuck loading
      setConfig({
        business_hours: { start: "08:00", end: "20:00", active_interval_minutes: 10 },
        rules: {
          admin: { cooldown_hours_per_item: 12 },
          marketing: { max_posts_per_day: 2 },
          finance: { minimum_budget_threshold: 1000000 }
        },
        products: {
          "SKU-001": { name: "Fusion Core Base", hpp: 50000, selling_price: 150000, safety_stock: 20 },
          "SKU-002": { name: "Neural Link Cable", hpp: 15000, selling_price: 45000, safety_stock: 50 }
        }
      });
    }
  };

  const saveConfig = async () => {
    setIsSaving(true);
    setStatusMsg("");
    try {
      const baseUrl = import.meta.env.VITE_PYTHON_BACKEND_URL || 'http://localhost:8000';
      const apiKey = import.meta.env.VITE_BACKEND_API_KEY || '';
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
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2 flex items-center gap-3">
            <Settings className="text-indigo-400" /> Neural Global Settings
          </h1>
          <p className="text-slate-400 text-sm">
            Konfigurasi core AI & parameter bisnis untuk agen otonom.
          </p>
        </div>
        <button 
          onClick={saveConfig} disabled={isSaving}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors text-sm font-semibold disabled:opacity-50"
        >
          <Save size={16} />
          {isSaving ? 'Menyimpan...' : 'Save Configuration'}
        </button>
      </div>

      {statusMsg && (
        <div className="mb-6 p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-sm">
          {statusMsg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Heartbeat Logic */}
        <div className="bg-[#0f172a] rounded-xl p-6 border border-white/10">
          <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
            <Zap className="text-amber-400" size={18} /> Business Hours & Heartbeat
          </h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-black/20">
              <div>
                <label className="text-sm text-slate-300 block">Start Ops Hour</label>
                <span className="text-xs text-slate-500">Waktu operasional AI harian.</span>
              </div>
              <input 
                type="time" 
                value={config.business_hours?.start || "08:00"}
                onChange={(e) => setConfig({...config, business_hours: {...config.business_hours, start: e.target.value}})}
                className="bg-transparent border border-white/10 rounded px-3 py-1 text-white outline-none"
              />
            </div>
            
            <div className="flex items-center justify-between p-3 rounded-lg bg-black/20">
              <div>
                <label className="text-sm text-slate-300 block">End Ops Hour</label>
                <span className="text-xs text-slate-500">Batas akhir operasional.</span>
              </div>
              <input 
                type="time" 
                value={config.business_hours?.end || "20:00"}
                onChange={(e) => setConfig({...config, business_hours: {...config.business_hours, end: e.target.value}})}
                className="bg-transparent border border-white/10 rounded px-3 py-1 text-white outline-none"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-black/20 border-l-4 border-amber-500">
              <div>
                <label className="text-sm text-slate-300 block">Tick Rate (Minutes)</label>
                <span className="text-xs text-slate-500">Frekuensi agen mengecek task.</span>
              </div>
              <input 
                type="number" 
                value={config.business_hours?.active_interval_minutes || 10}
                onChange={(e) => setConfig({...config, business_hours: {...config.business_hours, active_interval_minutes: parseInt(e.target.value)}})}
                className="bg-transparent border border-white/10 rounded px-3 py-1 text-white outline-none w-20 text-right"
              />
            </div>
          </div>
        </div>

        {/* Guardrails */}
        <div className="bg-[#0f172a] rounded-xl p-6 border border-white/10">
          <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
            <ShieldAlert className="text-rose-400" size={18} /> Neural Guardrails
          </h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-black/20">
              <div>
                <label className="text-sm text-slate-300 block">Admin: Cooldown Restock</label>
                <span className="text-xs text-slate-500">Jeda (jam) AI melakukan order supplier ulang.</span>
              </div>
              <input 
                type="number" 
                value={config.rules?.admin?.cooldown_hours_per_item || 12}
                onChange={(e) => setConfig({...config, rules: {...config.rules, admin: {...config.rules?.admin, cooldown_hours_per_item: parseInt(e.target.value)}}})}
                className="bg-transparent border border-white/10 rounded px-3 py-1 text-white outline-none w-20 text-right"
              />
            </div>
            
            <div className="flex items-center justify-between p-3 rounded-lg bg-black/20">
              <div>
                <label className="text-sm text-slate-300 block">Marketing: Max Posts / Day</label>
                <span className="text-xs text-slate-500">Batas spam AI ke sosmed.</span>
              </div>
              <input 
                type="number" 
                value={config.rules?.marketing?.max_posts_per_day || 2}
                onChange={(e) => setConfig({...config, rules: {...config.rules, marketing: {...config.rules?.marketing, max_posts_per_day: parseInt(e.target.value)}}})}
                className="bg-transparent border border-white/10 rounded px-3 py-1 text-white outline-none w-20 text-right"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-black/20">
              <div>
                <label className="text-sm text-slate-300 block">Finance: Min. Budget Alert</label>
                <span className="text-xs text-slate-500">Batas minimum saldo operasional.</span>
              </div>
              <input 
                type="number" 
                value={config.rules?.finance?.minimum_budget_threshold || 1000000}
                onChange={(e) => setConfig({...config, rules: {...config.rules, finance: {...config.rules?.finance, minimum_budget_threshold: parseInt(e.target.value)}}})}
                className="bg-transparent border border-white/10 rounded px-3 py-1 text-white outline-none w-32 text-right"
              />
            </div>
          </div>
        </div>

        {/* Master Products List */}
        <div className="lg:col-span-2 bg-[#0f172a] rounded-xl p-6 border border-white/10 mt-2">
          <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
            <Package className="text-indigo-400" size={18} /> Master Product Config
          </h2>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-slate-400 text-sm border-b border-white/10">
                  <th className="pb-3 font-semibold">SKU / ID</th>
                  <th className="pb-3 font-semibold">Item Name</th>
                  <th className="pb-3 font-semibold">Base Cost (HPP)</th>
                  <th className="pb-3 font-semibold">Selling Price</th>
                  <th className="pb-3 font-semibold">Safety Stock</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {Object.keys(config.products || {}).map(sku => (
                  <tr key={sku} className="border-b border-white/5 hover:bg-white/5">
                    <td className="py-3 text-indigo-300 font-mono text-xs">{sku}</td>
                    <td className="py-3 pr-4">
                      <input 
                        type="text" 
                        value={config.products[sku].name}
                        onChange={(e) => setConfig({...config, products: {...config.products, [sku]: {...config.products[sku], name: e.target.value}}})}
                        className="bg-black/20 border border-white/10 rounded px-2 py-1 text-white outline-none w-full"
                      />
                    </td>
                    <td className="py-3 pr-4">
                      <input 
                        type="number" 
                        value={config.products[sku].hpp}
                        onChange={(e) => setConfig({...config, products: {...config.products, [sku]: {...config.products[sku], hpp: parseInt(e.target.value)}}})}
                        className="bg-black/20 border border-white/10 rounded px-2 py-1 text-white outline-none w-24"
                      />
                    </td>
                    <td className="py-3 pr-4">
                      <input 
                        type="number" 
                        value={config.products[sku].selling_price}
                        onChange={(e) => setConfig({...config, products: {...config.products, [sku]: {...config.products[sku], selling_price: parseInt(e.target.value)}}})}
                        className="bg-black/20 border border-white/10 rounded px-2 py-1 text-white outline-none w-24"
                      />
                    </td>
                    <td className="py-3">
                      <input 
                        type="number" 
                        value={config.products[sku].safety_stock}
                        onChange={(e) => setConfig({...config, products: {...config.products, [sku]: {...config.products[sku], safety_stock: parseInt(e.target.value)}}})}
                        className="bg-black/20 border border-white/10 rounded px-2 py-1 text-white outline-none w-16 text-center"
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
