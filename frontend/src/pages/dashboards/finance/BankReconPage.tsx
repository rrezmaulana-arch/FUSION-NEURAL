/**
 * FUSION NEURAL — Arus Kas (Bank Reconciliation)
 * Terhubung dengan: Admin (orders), Marketing (ad spend), Simulator (transactions)
 */
import { useState, useEffect } from 'react';
import { Wallet, CheckCircle, ArrowUpRight, ArrowDownRight, RefreshCw } from 'lucide-react';
import { db } from '../../../lib/firebase';
import { collection, query, orderBy, limit, onSnapshot, doc, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import PageHeader from '../../../components/ui/PageHeader';

export default function BankReconPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpense, setTotalExpense] = useState(0);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [txForm, setTxForm] = useState({ amount: '', description: '', method: 'transfer', bank: '', type: 'EXPENSE' });
  const [isSaving, setIsSaving] = useState(false);

  const showFeedback = (type: 'success' | 'error', msg: string) => {
    setFeedback({ type, msg });
    setTimeout(() => setFeedback(null), 3000);
  };

  // Real-time listener — semua transaksi dari Simulator, Admin, Marketing
  useEffect(() => {
    const q = query(collection(db, 'finance_transactions'), orderBy('created_at', 'desc'), limit(50));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setTransactions(data);

      let income = 0, expense = 0;
      data.forEach((t: any) => {
        if (t.transaction_type === 'INCOME' || t.type === 'INCOME') income += t.amount || 0;
        else expense += t.amount || 0;
      });
      setTotalIncome(income);
      setTotalExpense(expense);
    });
    return () => unsub();
  }, []);

  const handleAddTransaction = async () => {
    if (!txForm.amount || Number(txForm.amount) <= 0) return;
    setIsSaving(true);
    try {
      await addDoc(collection(db, 'finance_transactions'), {
        amount: Number(txForm.amount),
        transaction_type: txForm.type,
        category: txForm.method === 'transfer' ? `Transfer ${txForm.bank}` : txForm.method === 'cash' ? 'Tunai' : 'Lainnya',
        description: txForm.description,
        method: txForm.method,
        bank: txForm.bank,
        status: 'PAID',
        created_at: new Date().toISOString(),
        timestamp: serverTimestamp()
      });
      setTxForm({ amount: '', description: '', method: 'transfer', bank: '', type: 'EXPENSE' });
      setShowAddForm(false);
      showFeedback('success', 'Transaksi berhasil ditambahkan!');
    } catch (e) {
      showFeedback('error', 'Gagal menambah transaksi');
    } finally {
      setIsSaving(false);
    }
  };

  const balance = totalIncome - totalExpense;

  return (
    <div className="space-y-6 pb-10">
      {feedback && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl text-sm font-bold shadow-lg ${
          feedback.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
        }`}>
          {feedback.msg}
        </div>
      )}

      <PageHeader
        title="Arus Kas"
        subtitle="Semua transaksi masuk & keluar — terhubung dengan Simulator, Admin, dan Marketing."
        accent="emerald"
        actions={
          <button onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-colors">
            <ArrowUpRight size={14} /> Tambah Transaksi
          </button>
        }
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <ArrowDownRight size={16} className="text-emerald-500" />
            <span className="text-[10px] font-bold text-slate-400 uppercase">Total Masuk</span>
          </div>
          <p className="text-2xl font-black text-emerald-600">+ Rp {totalIncome.toLocaleString('id-ID')}</p>
          <p className="text-[10px] text-slate-400 mt-1">Dari Simulator, Admin, Marketing</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <ArrowUpRight size={16} className="text-rose-500" />
            <span className="text-[10px] font-bold text-slate-400 uppercase">Total Keluar</span>
          </div>
          <p className="text-2xl font-black text-rose-600">- Rp {totalExpense.toLocaleString('id-ID')}</p>
          <p className="text-[10px] text-slate-400 mt-1">Ad spend, procurement, operasional</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Wallet size={16} className={balance >= 0 ? 'text-emerald-500' : 'text-rose-500'} />
            <span className="text-[10px] font-bold text-slate-400 uppercase">Saldo Bersih</span>
          </div>
          <p className={`text-2xl font-black ${balance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {balance >= 0 ? '+' : ''} Rp {balance.toLocaleString('id-ID')}
          </p>
          <p className="text-[10px] text-slate-400 mt-1">Income - Expense</p>
        </div>
      </div>

      {/* Add Transaction Form */}
      {showAddForm && (
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <h3 className="text-sm font-black text-slate-800 mb-4">Tambah Transaksi Manual</h3>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Tipe</label>
              <select value={txForm.type} onChange={e => setTxForm(f => ({ ...f, type: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-emerald-400">
                <option value="INCOME">Uang Masuk</option>
                <option value="EXPENSE">Uang Keluar</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Jumlah (Rp)</label>
              <input type="number" value={txForm.amount} onChange={e => setTxForm(f => ({ ...f, amount: e.target.value }))}
                placeholder="0" className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-emerald-400" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Metode</label>
              <select value={txForm.method} onChange={e => setTxForm(f => ({ ...f, method: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-emerald-400">
                <option value="transfer">Transfer Bank</option>
                <option value="cash">Tunai</option>
                <option value="ewallet">E-Wallet</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Deskripsi</label>
              <input value={txForm.description} onChange={e => setTxForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Keterangan..." className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-emerald-400" />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-3">
            <button onClick={() => setShowAddForm(false)} className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl">Batal</button>
            <button onClick={handleAddTransaction} disabled={isSaving || !txForm.amount}
              className="px-5 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 disabled:opacity-40">
              {isSaving ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </div>
      )}

      {/* Transaction List */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-black text-slate-800">Riwayat Transaksi</h3>
          <span className="text-[10px] font-bold text-slate-400">{transactions.length} transaksi</span>
        </div>
        <div className="divide-y divide-slate-50 max-h-[500px] overflow-y-auto">
          {transactions.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm">
              Belum ada transaksi. Jalankan Simulator untuk generate data otomatis.
            </div>
          ) : transactions.map((tx: any) => {
            const isIncome = tx.transaction_type === 'INCOME' || tx.type === 'INCOME';
            return (
              <div key={tx.id} className="flex items-center gap-4 px-5 py-3 hover:bg-slate-50 transition-colors">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isIncome ? 'bg-emerald-50' : 'bg-rose-50'}`}>
                  {isIncome ? <ArrowDownRight size={14} className="text-emerald-500" /> : <ArrowUpRight size={14} className="text-rose-500" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-700 truncate">{tx.description || tx.category || '-'}</p>
                  <p className="text-[10px] text-slate-400">{tx.category} • {tx.method || '-'}</p>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-black ${isIncome ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {isIncome ? '+' : '-'}Rp {(tx.amount || 0).toLocaleString('id-ID')}
                  </p>
                  <p className="text-[10px] text-slate-400">{tx.created_at?.substring?.(0, 10) || ''}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
