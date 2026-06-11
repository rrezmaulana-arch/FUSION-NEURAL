/**
 * FUSION NEURAL — Admin: Pesanan & Pengiriman
 * Wrapper page combining Order Stream + Shipping into tabbed view
 */
import { useState } from 'react';
import { ShoppingCart, Truck } from 'lucide-react';
import OrderStreamPage from './OrderStreamPage';
import ShippingReturnsPage from './ShippingReturnsPage';

const TABS = [
  { id: 'orders' as const, label: 'Pesanan', icon: ShoppingCart },
  { id: 'shipping' as const, label: 'Pengiriman & Retur', icon: Truck },
];

export default function AdminOrdersPage() {
  const [activeTab, setActiveTab] = useState<'orders' | 'shipping'>('orders');

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
      {activeTab === 'orders' && <OrderStreamPage />}
      {activeTab === 'shipping' && <ShippingReturnsPage />}
    </div>
  );
}
