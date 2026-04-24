import { Sparkles, Users, BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function MarketingDashboard() {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 mb-8">
        <h2 className="text-xl font-bold text-slate-800 mb-2">Marketing Overview</h2>
        <p className="text-sm text-slate-500">Campaign performance and lead generation powered by AI Marketing.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-500 font-medium text-sm">Active Campaigns</h3>
            <div className="p-2 bg-slate-50 rounded-lg"><Sparkles className="w-5 h-5 text-purple-500" /></div>
          </div>
          <div className="text-3xl font-bold text-slate-800">12</div>
        </div>
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-500 font-medium text-sm">New Leads</h3>
            <div className="p-2 bg-slate-50 rounded-lg"><Users className="w-5 h-5 text-blue-500" /></div>
          </div>
          <div className="text-3xl font-bold text-slate-800">1,482</div>
        </div>
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-500 font-medium text-sm">Conversion Rate</h3>
            <div className="p-2 bg-slate-50 rounded-lg"><BarChart3 className="w-5 h-5 text-emerald-500" /></div>
          </div>
          <div className="text-3xl font-bold text-slate-800">4.2%</div>
        </div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mt-8 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm"
      >
        <h3 className="font-bold text-slate-800 mb-4">Top Performing Content</h3>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600">
                  <Sparkles size={18} />
                </div>
                <div>
                  <div className="font-medium text-slate-700">Q3 Launch Campaign</div>
                  <div className="text-xs text-slate-400">TikTok & Instagram</div>
                </div>
              </div>
              <div className="font-bold text-purple-600">+2.4k Engagement</div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
