/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Bell, ArrowLeft, CheckCircle2, History, CreditCard, ChevronRight, Search, ListFilter } from 'lucide-react';
import { motion } from 'motion/react';
import { useState, useEffect } from 'react';
import { Transaction } from '../types';
import { db } from '../lib/firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';

export const HistoryView = ({ onSelect }: { onSelect: (id: string) => void }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('Hari ini');

  useEffect(() => {
    const q = query(collection(db, 'transactions'), orderBy('date', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
      setTransactions(data);
      setLoading(false);
    });
    return unsub;
  }, []);

  const filters = ['Hari ini', 'Minggu ini', 'Bulan ini', 'Kustom'];

  return (
    <div className="bg-surface min-h-screen flex flex-col">
      <header className="bg-surface shadow-sm sticky top-0 z-50 flex justify-between items-center px-4 py-4 w-full">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center overflow-hidden">
            <History className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-lg font-bold text-primary">Fattina Bolen</h1>
        </div>
        <Bell className="w-6 h-6 text-primary" />
      </header>

      <main className="flex-1 px-4 py-6 max-w-4xl mx-auto w-full mb-24 space-y-8">
        <section className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-on-surface tracking-tight">Riwayat Transaksi</h2>
            <p className="text-sm text-on-surface-variant font-medium mt-1">Pantau performa penjualan Anda secara real-time.</p>
          </div>

          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-outline" />
            <input
              type="text"
              placeholder="Cari nomor invoice..."
              className="w-full pl-12 pr-4 py-4 bg-surface-container-lowest border border-outline-variant rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all text-sm font-semibold"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            {filters.map(f => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`px-6 py-2.5 rounded-full text-xs font-bold whitespace-nowrap transition-all active:scale-95 border ${
                  activeFilter === f ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' : 'bg-surface-container-lowest text-on-surface-variant border-outline-variant hover:bg-surface-container-high'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-3">
          {loading ? (
            <div className="text-center py-12 text-on-surface-variant font-bold">Memuat transaksi...</div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-12 text-on-surface-variant font-bold">Belum ada transaksi</div>
          ) : (
            transactions.map((t, index) => (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => onSelect(t.id)}
                className="bg-surface-container-lowest rounded-2xl p-4 shadow-sm border border-outline-variant/30 flex items-center justify-between group hover:shadow-md transition-all cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    t.status === 'GAGAL' ? 'bg-error-container/20 text-error' : 'bg-surface-container-low text-primary'
                  }`}>
                    {t.status === 'GAGAL' ? <Bell className="w-6 h-6" /> : <CreditCard className="w-6 h-6" />}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-on-surface">{t.invoiceNumber}</span>
                    <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                      {t.date?.toDate().toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}, {t.date?.toDate().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-base font-bold text-on-surface">Rp {t.total.toLocaleString('id-ID')}</span>
                  <span className={`px-3 py-0.5 rounded-full text-[8px] font-bold uppercase ${
                    t.status === 'SUKSES' ? 'bg-primary-container/20 text-primary-container' : 'bg-error-container text-on-error-container'
                  }`}>
                    {t.status}
                  </span>
                </div>
              </motion.div>
            ))
          )}
        </section>
      </main>
    </div>
  );
};
