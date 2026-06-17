/**
 * components/umkm/BottomNav.tsx — Mobile Bottom Navigation
 * 5 menu: Beranda, Chat, Stok, Keuangan, Settings
 */
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, MessageCircle, Package, Wallet, Settings } from 'lucide-react';

const NAV_ITEMS = [
  { path: '/umkm', icon: Home, label: 'Beranda', exact: true },
  { path: '/umkm/chat', icon: MessageCircle, label: 'Chat' },
  { path: '/umkm/stok', icon: Package, label: 'Stok' },
  { path: '/umkm/keuangan', icon: Wallet, label: 'Uang' },
  { path: '/umkm/settings', icon: Settings, label: 'Setting' },
];

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-t border-slate-200/60 safe-area-pb">
      <div className="max-w-lg mx-auto flex items-center justify-around px-2 py-1">
        {NAV_ITEMS.map((item) => {
          const isActive = item.exact
            ? location.pathname === item.path
            : location.pathname.startsWith(item.path);
          const Icon = item.icon;

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center gap-0.5 py-2 px-3 rounded-xl transition-all ${
                isActive
                  ? 'text-purple-600'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.5]'}`} />
              <span className={`text-[10px] font-semibold ${isActive ? 'text-purple-600' : ''}`}>
                {item.label}
              </span>
              {isActive && (
                <div className="w-1 h-1 rounded-full bg-purple-600 mt-0.5" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
