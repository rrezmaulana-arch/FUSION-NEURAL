import { useState, useEffect } from 'react';
import { Upload, Wallet, CheckCircle } from 'lucide-react';
import { db } from '../../../lib/firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';

export default function BankReconPage() {
  const [unverifiedTransfers, setUnverifiedTransfers] = useState<any[]>([]);
  const [pettyCashBalance, setPettyCashBalance] = useState(1500000); // Default, updated from Firestore
  const [currentBudget, setCurrentBudget] = useState(500000000);

  useEffect(() => {
    // Listen for manual transfers pending verification
    const q = query(
      collection(db, 'finance_transactions'),
      where('status', '==', 'PENDING_VERIFICATION')
    );
    
    const unsubscribeTx = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUnverifiedTransfers(data);
    });

    // Listen for real petty cash balance
    const unsubscribeStats = onSnapshot(doc(db, 'finance_metrics', 'stats'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.petty_cash !== undefined) setPettyCashBalance(data.petty_cash);
        if (data.budget !== undefined) setCurrentBudget(data.budget);
      }
    });

    return () => {
      unsubscribeTx();
      unsubscribeStats();
    };
  }, []);

  const handleVerify = async (txId: string, orderId: string) => {
    try {
      await updateDoc(doc(db, 'finance_transactions', txId), {
        status: 'PAID',
        verified_at: serverTimestamp()
      });
      if (orderId) {
        await updateDoc(doc(db, 'orders', orderId), {
          status: 'PAID' // This will trigger it to show up in Admin Shipping
        });
      }
      alert("Pembayaran berhasil diverifikasi!");
    } catch (e) {
      console.error(e);
      alert("Gagal verifikasi pembayaran");
    }
  };

  const handlePettyCashExpense = async () => {
    const amountStr = prompt("Masukkan jumlah pengeluaran Kas Kecil (Rp):");
    const desc = prompt("Untuk keperluan apa?");
    if (!amountStr || !desc) return;
    
    const amount = parseInt(amountStr);
    if (isNaN(amount) || amount <= 0) return alert("Jumlah tidak valid");

    try {
      await addDoc(collection(db, 'finance_transactions'), {
        type: 'PETTY_CASH',
        amount: -amount,
        description: desc,
        status: 'PAID',
        timestamp: serverTimestamp()
      });

      // Update petty cash in finance_metrics
      await updateDoc(doc(db, 'finance_metrics', 'stats'), {
        petty_cash: pettyCashBalance - amount,
        budget: currentBudget - amount // subtract from total budget too
      });

      alert("Kas Kecil berhasil dicatat.");
    } catch(e) {
      alert("Gagal mencatat Kas Kecil.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
          <Wallet className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Bank Recon & Petty Cash</h1>
          <p className="text-slate-500 text-sm">Verify manual bank transfers and manage daily petty cash.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
          <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-500" /> Pending Verification
          </h2>
          <div className="space-y-4">
            {unverifiedTransfers.length === 0 && <p className="text-sm text-slate-500 text-center py-4">Tidak ada transfer manual yang menunggu verifikasi.</p>}
            {unverifiedTransfers.map(tx => (
              <div key={tx.id} className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex flex-col gap-3">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-bold text-sm text-slate-800">Rp {tx.amount?.toLocaleString('id-ID')}</p>
                    <p className="text-xs text-slate-500">Sender: {tx.sender_name || 'Unknown'}</p>
                  </div>
                  <a href={tx.proof_url || '#'} target="_blank" rel="noreferrer" className="px-2 py-1 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-lg hover:bg-emerald-100 flex items-center gap-1 border border-emerald-200">
                    <Upload className="w-3 h-3" /> Bukti
                  </a>
                </div>
                <button 
                  onClick={() => handleVerify(tx.id, tx.order_id)}
                  className="w-full py-1.5 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-700"
                >
                  Verify Payment
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
          <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Wallet className="w-5 h-5 text-slate-500" /> Petty Cash (Kas Kecil)
          </h2>
          <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl mb-4">
            <p className="text-sm text-emerald-600 font-medium">Current Balance</p>
            <p className="text-2xl font-black text-emerald-700">Rp {pettyCashBalance.toLocaleString('id-ID')}</p>
          </div>
          <button 
            onClick={handlePettyCashExpense}
            className="w-full py-2 bg-slate-800 text-white rounded-lg text-sm font-semibold hover:bg-slate-700"
          >
            Record Expense
          </button>
        </div>
      </div>
    </div>
  );
}
