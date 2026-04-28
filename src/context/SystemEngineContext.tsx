import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { TrendingUp, Users } from 'lucide-react';
import { NeuralCore } from '../services/NeuralCore';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

// --- TYPES ---
interface Transaction { id: number; type: string; amount: number; time: string; isPositive: boolean; }
interface Conversion { id: number; title: string; desc: string; val: string; icon: any; }
interface LogEntry { id: string; time: string; lat: string; status: string; style: string; }
interface Performer { id: string; name: string; role: string; score: number; status: 'Online' | 'Offline' | 'Busy'; initial: string; color: string; }

interface SystemEngineState {
  // Finance State
  revenue: number;
  expenses: number;
  transactions: Transaction[];
  financeChartData: number[];
  
  // Marketing State
  campaignActive: boolean;
  setCampaignActive: (active: boolean) => void;
  budgetUsed: number;
  conversions: Conversion[];
  eqHeights: number[];

  // Admin State
  payloads: number;
  activeNodes: number;
  adminLogs: LogEntry[];
  adminChartData: { h1: number; h2: number }[];

  // Manager State (Aggregated & Simulated)
  systemRequests: number;
  performers: Performer[];
  pingPerformer: (id: string) => void;

  // Simulator State
  isSimulating: boolean;
  toggleSimulator: () => void;
  simulatorStats: any;
  resetSimulator: () => Promise<void>;
}

const SystemEngineContext = createContext<SystemEngineState | undefined>(undefined);

export const SystemEngineProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // --- INITIAL STATES ---
  // Finance
  const [revenue, setRevenue] = useState(2450000);
  const [expenses, setExpenses] = useState(840000);
  const [transactions, setTransactions] = useState<Transaction[]>([
    { id: 1, type: 'Incoming Transfer', amount: 12450.00, time: 'Just now', isPositive: true },
    { id: 2, type: 'Server Infrastructure', amount: 840.50, time: '10 mins ago', isPositive: false },
  ]);
  const [financeChartData, setFinanceChartData] = useState([40, 60, 45, 80, 50, 95]);

  // Marketing
  const [campaignActive, setCampaignActive] = useState(false);
  const [budgetUsed, setBudgetUsed] = useState(1200);
  const [conversions, setConversions] = useState<Conversion[]>([
    { id: 1, title: 'Enterprise Plan Upgrade', desc: 'TechCorp Inc. • Inbound Lead', val: '$3,200', icon: TrendingUp },
  ]);
  const [eqHeights, setEqHeights] = useState([40, 70, 30, 90, 50, 80, 20, 60, 100, 40, 70, 30, 80, 50, 40]);

  // Admin
  const [payloads, setPayloads] = useState(11354);
  const [activeNodes, setActiveNodes] = useState(45439);
  const [adminLogs, setAdminLogs] = useState<LogEntry[]>([
    { id: '#HG-101', time: 'Just now', lat: '12ms', status: 'Synced', style: 'bg-emerald-50 text-emerald-600' },
  ]);
  const [adminChartData] = useState<{ h1: number; h2: number }[]>(
    Array.from({ length: 7 }).map(() => ({ h1: Math.floor(Math.random() * 60) + 20, h2: Math.floor(Math.random() * 50) + 20 }))
  );

  // Manager
  const [systemRequests, setSystemRequests] = useState(824);
  const [performers, setPerformers] = useState<Performer[]>([
    { id: '1', name: 'AI Manager', role: 'Cortex', score: 99.8, status: 'Online', initial: 'MGR', color: 'bg-indigo-100 text-indigo-600' },
    { id: '2', name: 'AI Admin', role: 'Logistics', score: 98.5, status: 'Online', initial: 'ADM', color: 'bg-emerald-100 text-emerald-600' },
    { id: '3', name: 'AI Marketing', role: 'Expansion', score: 96.2, status: 'Online', initial: 'MKT', color: 'bg-amber-100 text-amber-600' },
    { id: '4', name: 'AI Finance', role: 'Guardian', score: 99.9, status: 'Online', initial: 'FIN', color: 'bg-rose-100 text-rose-600' },
  ]);

  // Global Simulator State
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulatorStats, setSimulatorStats] = useState<any>({});
  const simulatorInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const simulationCycles = useRef(0);

  useEffect(() => {
    // Force initialize prompts to Firebase — wrapped in try/catch to prevent crash if Firestore is offline
    NeuralCore.initCorePrompts().catch((e) => console.warn('Neural Core init skipped (Firestore offline?):', e));

    // Listen to market_simulator/live_stats globally
    const unsub = onSnapshot(doc(db, 'market_simulator', 'live_stats'), (docSnap) => {
      if (docSnap.exists()) {
        setSimulatorStats(docSnap.data());
      }
    });

    return () => {
      unsub();
      if (simulatorInterval.current) clearInterval(simulatorInterval.current);
    };
  }, []);

  const runSimulationCycle = async () => {
    try {
      const events = ["Sudden Order Spike", "Competitor Flash Sale", "Viral TikTok Video Mentioning Us"];
      const randomEvent = events[Math.floor(Math.random() * events.length)];
      
      // Use the latest stats available in state
      setSimulatorStats((currentStats: any) => {
        NeuralCore.triggerMarketEvent(randomEvent, currentStats).catch(console.error);
        return currentStats;
      });
    } catch (error) {
      console.error(error);
    }
  };

  const toggleSimulator = async () => {
    if (isSimulating) {
      setIsSimulating(false);
      if (simulatorInterval.current) clearInterval(simulatorInterval.current);
    } else {
      setIsSimulating(true);
      simulationCycles.current = 0; // reset cycle
      await NeuralCore.initCorePrompts();
      
      runSimulationCycle();
      simulationCycles.current++;

      simulatorInterval.current = setInterval(() => {
        // Berhenti sendiri jika sudah jalan 20 kali pesanan / event
        if (simulationCycles.current >= 20) {
          setIsSimulating(false);
          if (simulatorInterval.current) clearInterval(simulatorInterval.current);
          return;
        }
        runSimulationCycle();
        simulationCycles.current++;
      }, 15000);
    }
  };


  const resetSimulator = async () => {
    try {
      // 1. Ambil fungsi getDocs, collection, deleteDoc dari firebase/firestore
      const { getDocs, collection, deleteDoc } = await import('firebase/firestore');
      
      // 2. Bersihkan semua koleksi simulasi kecuali neural_configs
      const collectionsToClear = ['orders', 'inventory', 'financial_reports', 'activity_logs', 'market_simulator'];
      
      for (const colName of collectionsToClear) {
        const querySnapshot = await getDocs(collection(db, colName));
        const deletePromises = querySnapshot.docs.map(document => deleteDoc(document.ref));
        await Promise.all(deletePromises);
      }

      // 3. Kembalikan market_simulator ke state awal
      const resetData = {
        revenue: 120000,
        cost: 45000,
        orders: 340,
        last_event: 'System Reset',
        logs: ['System Reset and History Cleared'],
        new_orders: [],
        inventory_items: [
          { sku: 'WAT-2023-001', qty: 142, image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=150&q=80' },
          { sku: 'AUD-2023-045', qty: 8, image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=150&q=80' }
        ],
        geo_stats: { 'Jakarta': 120, 'Bandung': 85, 'Surabaya': 45, 'Medan': 30, 'Bali': 10 }
      };
      await setDoc(doc(db, 'market_simulator', 'live_stats'), resetData);
      
      console.log("All simulator databases cleared successfully.");
    } catch (e) {
      console.error("Failed to reset simulator databases:", e);
    }
  };

  // --- THE VIRTUAL NEURAL ENGINE (Backend Loop) ---
  useEffect(() => {
    const engineInterval = setInterval(() => {
      // 1. Core System Ticks (Always running)
      setSystemRequests(prev => prev + Math.floor(Math.random() * 5));
      setPayloads(prev => prev + Math.floor(Math.random() * 15) + 5);
      
      // Node fluctuation
      if (Math.random() > 0.8) setActiveNodes(prev => prev + (Math.random() > 0.5 ? 2 : -2));

      // 2. Marketing & Interconnected Logic
      if (campaignActive) {
        // Equalizer visual animation
        setEqHeights(prev => prev.map(() => Math.floor(Math.random() * 80) + 20));
        
        // Burn budget rapidly (Marketing)
        const budgetBurn = parseFloat((Math.random() * 15).toFixed(2));
        setBudgetUsed(prev => Math.min(10000, prev + budgetBurn));

        // Increase expenses (Finance)
        setExpenses(prev => prev + budgetBurn);

        // Heavy Payload generation (Admin)
        setPayloads(prev => prev + Math.floor(Math.random() * 50) + 20);

        // Generate Conversions -> Creates Revenue (Interconnected!)
        if (Math.random() > 0.6) {
          const revGain = parseFloat((Math.random() * 500).toFixed(2));
          setRevenue(prev => prev + revGain);
          
          // Add Conversion Log
          const types = [
            { title: 'Pro Plan Purchase', desc: 'Retargeting • Facebook', icon: TrendingUp },
            { title: 'Webinar Registration', desc: 'LinkedIn Ad • B2B', icon: Users },
          ];
          const type = types[Math.floor(Math.random() * types.length)];
          setConversions(prev => [{ id: Date.now(), ...type, val: `$${revGain}` }, ...prev].slice(0, 5));
          
          // Add Finance Transaction
          setTransactions(prev => [{
            id: Date.now(), type: 'Campaign Conversion', amount: revGain, time: 'Just now', isPositive: true
          }, ...prev].slice(0, 5));
        }

      } else {
        // Idle State: Slow passive income and expenses
        if (Math.random() > 0.8) {
          const revGain = Math.floor(Math.random() * 50);
          setRevenue(prev => prev + revGain);
          setTransactions(prev => [{
            id: Date.now(), type: 'Organic Income', amount: revGain, time: 'Just now', isPositive: true
          }, ...prev].slice(0, 5));
        }
        if (Math.random() > 0.9) {
          setExpenses(prev => prev + Math.floor(Math.random() * 20));
        }
      }

      // 3. Admin Logs Generator
      if (Math.random() > 0.7) {
        const statuses = [
          { status: 'Synced', style: 'bg-emerald-50 text-emerald-600' },
          { status: 'Retrying', style: 'bg-amber-50 text-amber-600' }
        ];
        const s = statuses[Math.floor(Math.random() * statuses.length)];
        setAdminLogs(prev => [{
          id: `#ND-${Math.floor(Math.random() * 900) + 100}`,
          time: 'Just now',
          lat: `${Math.floor(Math.random() * 40) + 5}ms`,
          ...s
        }, ...prev].slice(0, 6));
      }

      // 4. Update Charts randomly
      if (Math.random() > 0.7) {
        setFinanceChartData(prev => {
          const arr = [...prev];
          arr[5] = Math.min(100, Math.max(20, arr[5] + (Math.random() > 0.5 ? 5 : -5)));
          return arr;
        });
      }

    }, 2000); // Ticks every 2 seconds

    return () => clearInterval(engineInterval);
  }, [campaignActive]);

  // Ping action for manager
  const pingPerformer = (id: string) => {
    setPerformers(prev => prev.map(p => {
      if (p.id === id) {
        const nextStatus = p.status === 'Online' ? 'Busy' : p.status === 'Busy' ? 'Offline' : 'Online';
        return { ...p, status: nextStatus };
      }
      return p;
    }));
  };

  return (
    <SystemEngineContext.Provider value={{
      revenue, expenses, transactions, financeChartData,
      campaignActive, setCampaignActive, budgetUsed, conversions, eqHeights,
      payloads, activeNodes, adminLogs, adminChartData,
      systemRequests, performers, pingPerformer,
      isSimulating, toggleSimulator, simulatorStats, resetSimulator
    }}>
      {children}
    </SystemEngineContext.Provider>
  );
};

export const useSystemEngine = () => {
  const context = useContext(SystemEngineContext);
  if (context === undefined) {
    throw new Error('useSystemEngine must be used within a SystemEngineProvider');
  }
  return context;
};
