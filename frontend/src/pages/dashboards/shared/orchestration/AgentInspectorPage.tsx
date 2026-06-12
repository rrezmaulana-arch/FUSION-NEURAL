import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Cpu, Zap, Terminal, Code2, Network, Activity, GlobeLock } from 'lucide-react';
import PageHeader from '../../../../components/ui/PageHeader';

export default function AgentInspectorPage() {
  const [selectedAgent, setSelectedAgent] = useState('Neural Finance');
  const [typingText, setTypingText] = useState('');
  
  const agents = [
    { name: 'Neural Marketing', id: 'marketing', desc: 'Creative & Outreach Engine' },
    { name: 'Neural Finance', id: 'finance', desc: 'Profitability & Tax Sentinel' },
    { name: 'Neural Admin', id: 'admin', desc: 'Logistics & Compliance Core' },
    { name: 'Neural Manager', id: 'manager', desc: 'Orchestrator & Strategy Hub' }
  ];

  const agentData = {
    'Neural Marketing': {
      prompt: "# IDENTITY\nYou are Neural Marketing, the Ethical Persuader.\nYour goal is to maximize campaign reach while adhering to UU ITE.\n\n# CAPABILITIES\n- Read Firestore\n- Generate Ad Copy\n- Request Approvals",
      tools: ['firestore_read', 'groq_completion', 'campaign_generator', 'slack_notify']
    },
    'Neural Finance': {
      prompt: "# IDENTITY\nYou are Neural Finance, the Tax & Profit Sentinel.\nYour goal is to optimize costs and prevent zero-price bugs.\n\n# CAPABILITIES\n- Audit Invoices\n- Calculate ROI\n- Enforce Budget Locks",
      tools: ['firestore_sync', 'deepseek_evaluator', 'budget_lock', 'human_approval_gate']
    },
    'Neural Admin': {
      prompt: "# IDENTITY\nYou are Neural Admin, the Logistics Guardian.\nYour goal is to maintain absolute structural integrity of the workspace.\n\n# CAPABILITIES\n- Manage File System\n- Sync Database\n- Error Recovery",
      tools: ['file_writer', 'workspace_manager', 'db_sync', 'error_logger']
    },
    'Neural Manager': {
      prompt: "# IDENTITY\nYou are Neural Manager, the Orchestrator.\nYour goal is to delegate tickets and oversee all operations.\n\n# CAPABILITIES\n- Ticket Assignment\n- System Override\n- Final Approval",
      tools: ['agent_delegator', 'system_override', 'ticket_manager', 'global_broadcast']
    }
  };

  const activeData = agentData[selectedAgent as keyof typeof agentData] || agentData['Neural Finance'];

  useEffect(() => {
    setTypingText('');
    let i = 0;
    const speed = 15;
    const typeWriter = setInterval(() => {
      if (i < activeData.prompt.length) {
        setTypingText((prev) => prev + activeData.prompt.charAt(i));
        i++;
      } else {
        clearInterval(typeWriter);
      }
    }, speed);
    return () => clearInterval(typeWriter);
  }, [selectedAgent]);

  return (
    <div className="space-y-6 pb-10 h-[calc(100vh-6rem)] flex flex-col">
      <PageHeader
        title="Agent Inspector Core"
        subtitle="Glass-box observability into Neural Engine states and attached cognitive tools"
        accent="purple"
      />
      
      <div className="flex-1 flex flex-col md:flex-row gap-6 min-h-0">
        {/* Sidebar */}
        <div className="w-full md:w-72 shrink-0 bg-white/50 backdrop-blur-xl border border-white/20 rounded-3xl p-5 overflow-y-auto shadow-xl shadow-slate-200/50">
          <div className="flex items-center gap-2 mb-6">
            <Network className="text-purple-500" size={18} />
            <h3 className="text-xs font-black text-slate-700 uppercase tracking-widest">Active Neural Nodes</h3>
          </div>
          <div className="space-y-3">
            {agents.map(ag => (
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                key={ag.name}
                onClick={() => setSelectedAgent(ag.name)}
                className={`w-full text-left p-4 rounded-2xl transition-all duration-300 ${
                  selectedAgent === ag.name 
                    ? 'bg-gradient-to-br from-purple-500 to-teal-600 text-white shadow-lg shadow-purple-500/30' 
                    : 'bg-white border border-slate-100 text-slate-600 hover:border-purple-200 hover:bg-purple-50'
                }`}
              >
                <div className="flex items-center gap-3 mb-1">
                  <Bot size={18} className={selectedAgent === ag.name ? "text-purple-100" : "text-purple-600"} />
                  <span className="font-black text-sm">{ag.name}</span>
                </div>
                <p className={`text-[10px] pl-7 ${selectedAgent === ag.name ? 'text-purple-100' : 'text-slate-400'}`}>
                  {ag.desc}
                </p>
              </motion.button>
            ))}
          </div>
        </div>
        
        {/* Main Content */}
        <div className="flex-1 bg-slate-900 rounded-3xl overflow-hidden flex flex-col shadow-2xl relative">
          {/* Glass Header */}
          <div className="p-6 border-b border-slate-700/50 bg-slate-800/50 backdrop-blur-md flex flex-wrap items-start justify-between relative z-10">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 bg-purple-500/20 border border-purple-500/50 text-purple-400 rounded-2xl flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                <Bot size={32} />
              </div>
              <div>
                <h2 className="text-3xl font-black text-white tracking-tight">{selectedAgent}</h2>
                <div className="flex items-center gap-3 mt-2">
                  <span className="px-2.5 py-1 bg-purple-500/20 text-purple-400 rounded-full text-[10px] font-bold tracking-widest flex items-center gap-1.5 uppercase border border-purple-500/30">
                    <Zap size={10} className="animate-pulse"/> Node Online
                  </span>
                  <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
                    <Activity size={12} /> Sync: 12ms
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex-1 p-6 grid grid-cols-1 lg:grid-cols-2 gap-6 overflow-y-auto relative z-10">
            {/* Memory & Context Terminal */}
            <div className="space-y-3">
               <h3 className="text-sm font-bold text-slate-300 flex items-center gap-2 tracking-wide">
                 <Terminal size={16} className="text-purple-400" /> SYSTEM_PROMPT.MD
               </h3>
               <div className="bg-black/40 border border-slate-700 rounded-2xl p-5 text-purple-400 font-mono text-xs shadow-inner h-[300px] overflow-y-auto relative group">
                 <div className="absolute top-4 right-4 opacity-20 group-hover:opacity-100 transition-opacity">
                    <GlobeLock size={60} />
                 </div>
                 <pre className="whitespace-pre-wrap leading-relaxed z-10 relative">
                   {typingText}
                   <motion.span 
                    animate={{ opacity: [0, 1, 0] }} 
                    transition={{ repeat: Infinity, duration: 0.8 }}
                    className="inline-block w-2 h-3 bg-purple-400 ml-1"
                   />
                 </pre>
               </div>
            </div>
            
            {/* Attached Tools */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-300 flex items-center gap-2 tracking-wide">
                <Code2 size={16} className="text-purple-400" /> COGNITIVE TOOLS
              </h3>
              <div className="grid gap-3">
                <AnimatePresence mode="popLayout">
                  {activeData.tools.map((tool, idx) => (
                    <motion.div 
                      key={tool}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="flex items-center justify-between p-4 border border-slate-700/50 rounded-2xl bg-slate-800/30 hover:bg-slate-800/60 transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="bg-slate-700 p-2 rounded-lg group-hover:bg-purple-500/20 transition-colors">
                          <Cpu size={16} className="text-slate-300 group-hover:text-purple-400 transition-colors" />
                        </div>
                        <span className="font-mono text-slate-200 text-sm">{tool}</span>
                      </div>
                      <span className="text-[10px] bg-purple-500/10 border border-purple-500/30 text-purple-400 px-3 py-1 rounded-full font-black tracking-widest uppercase">
                        Active
                      </span>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </div>
          
          {/* Background Grid Effect */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none opacity-20" />
        </div>
      </div>
    </div>
  );
}

