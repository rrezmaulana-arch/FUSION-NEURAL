/**
 * FUSION NEURAL — Admin: Inventaris & Stok
 * Wrapper page combining Inventory + Supplier + Procurement into tabbed view
 */
import { useState } from 'react';
import { Package, Building2, ClipboardList } from 'lucide-react';
import InventoryTrackerPage from './InventoryTrackerPage';
import SupplierHubPage from './SupplierHubPage';
import ProcurementPOPage from './ProcurementPOPage';

const TABS = [
  { id: 'inventory' as const, label: 'Inventaris', icon: Package },
  { id: 'supplier' as const, label: 'Supplier', icon: Building2 },
  { id: 'procurement' as const, label: 'Procurement & QC', icon: ClipboardList },
];

export default function AdminInventoryPage() {
  const [activeTab, setActiveTab] = useState<'inventory' | 'supplier' | 'procurement'>('inventory');

  return (
    <div>
      {/* Tab Navigation */}
      <div className="flex gap-1 bg-white p-1.5 rounded-2xl border border-slate-200 w-max shadow-sm mb-6">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === tab.id
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
            }`}
          >
            <tab.icon size={14} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'inventory' && <InventoryTrackerPage />}
      {activeTab === 'supplier' && <SupplierHubPage />}
      {activeTab === 'procurement' && <ProcurementPOPage />}
    </div>
  );
}
