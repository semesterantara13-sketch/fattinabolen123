/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Wallet, Search, Filter, Plus, Package, Zap, Megaphone, Utensils, X, Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import React, { useState, useEffect } from 'react';
import { Expense, ExpenseCategory } from '../types';
import { db } from '../lib/firebase';
import { collection, onSnapshot, query, orderBy, addDoc, serverTimestamp } from 'firebase/firestore';

export const ExpenseView = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category: ExpenseCategory.OPERASIONAL,
    amount: 0,
    notes: ''
  });

  useEffect(() => {
    const q = query(collection(db, 'expenses'), orderBy('date', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Expense));
      setExpenses(data);
      setLoading(false);
    });
    return unsub;
  }, []);

  const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'expenses'), {
        ...formData,
        date: serverTimestamp(),
        status: 'SELESAI'
      });
      setShowModal(false);
      setFormData({ name: '', category: ExpenseCategory.OPERASIONAL, amount: 0, notes: '' });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="bg-surface min-h-screen pb-32">
      <header className="bg-surface dark:bg-on-surface flex justify-between items-center px-4 py-4 w-full sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container overflow-hidden">
             <div className="w-full h-full bg-primary flex items-center justify-center text-white font-bold">F</div>
          </div>
          <h1 className="text-lg font-bold text-primary">Fattina Bolen</h1>
        </div>
        <Bell className="w-6 h-6 text-primary" />
      </header>

      <main className="px-4 py-6 max-w-4xl mx-auto space-y-8">
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-outline-variant/30">
            <p className="text-[10px] font-bold text-on-surface-variant mb-1 uppercase tracking-widest">TOTAL PENGELUARAN (BULAN INI)</p>
            <h2 className="text-3xl font-bold text-error">Rp {totalExpense.toLocaleString('id-ID')}</h2>
            <div className="mt-4 flex items-center gap-1 text-on-surface-variant text-xs font-semibold">
              <Zap className="w-4 h-4 text-error" />
              <span>12% lebih tinggi dari bulan lalu</span>
            </div>
          </div>
        </section>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-grow min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
            <input
              type="text"
              placeholder="Cari pengeluaran..."
              className="w-full pl-10 pr-4 py-2 bg-surface-container-low border-none rounded-xl focus:ring-2 focus:ring-primary text-sm font-medium"
            />
          </div>
          <button className="px-4 py-2 bg-white border border-outline-variant/30 rounded-xl flex items-center gap-2 text-xs font-bold text-on-surface-variant hover:bg-surface-container-low">
            <Filter className="w-4 h-4" />
            Filter
          </button>
        </div>

        <div className="space-y-4">
          <h3 className="text-base font-bold px-1">Terbaru</h3>
          {expenses.map((e, idx) => (
            <motion.div
              key={e.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-white p-4 rounded-2xl shadow-sm border border-surface-container-low flex items-center justify-between hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  e.category === ExpenseCategory.LOGISTIK ? 'bg-orange-100 text-orange-600' :
                  e.category === ExpenseCategory.OPERASIONAL ? 'bg-blue-100 text-blue-600' :
                  e.category === ExpenseCategory.PEMASARAN ? 'bg-purple-100 text-purple-600' :
                  'bg-emerald-100 text-emerald-600'
                }`}>
                  {e.category === ExpenseCategory.LOGISTIK ? <Package className="w-6 h-6" /> :
                   e.category === ExpenseCategory.OPERASIONAL ? <Zap className="w-6 h-6" /> :
                   e.category === ExpenseCategory.PEMASARAN ? <Megaphone className="w-6 h-6" /> :
                   <Utensils className="w-6 h-6" />}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-on-surface">{e.name}</h4>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">{e.category}</span>
                    <span className="w-1 h-1 rounded-full bg-outline-variant" />
                    <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                      {e.date?.toDate().toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-base font-bold text-error">Rp {e.amount.toLocaleString('id-ID')}</p>
                <span className="inline-block px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-[8px] font-bold uppercase">SELESAI</span>
              </div>
            </motion.div>
          ))}
        </div>
      </main>

      <button 
        onClick={() => setShowModal(true)}
        className="fixed bottom-24 right-6 w-14 h-14 bg-primary text-white rounded-2xl shadow-xl flex items-center justify-center transition-transform active:scale-90 z-40"
      >
        <Plus className="w-8 h-8" />
      </button>

      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[60] flex items-end justify-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
              className="absolute inset-0 bg-on-surface/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="relative w-full max-w-2xl bg-white rounded-t-[32px] p-6 shadow-2xl"
            >
              <div className="w-12 h-1 bg-outline-variant rounded-full mx-auto mb-6" />
              <header className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-bold">Tambah Pengeluaran</h2>
                <button onClick={() => setShowModal(false)} className="p-2"><X className="w-6 h-6" /></button>
              </header>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-on-surface-variant uppercase ml-1">Nama Pengeluaran</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-4 bg-surface-container-low border-none rounded-xl focus:ring-2 focus:ring-primary text-sm font-semibold"
                    placeholder="Misal: Sewa Toko"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-on-surface-variant uppercase ml-1">Kategori</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value as ExpenseCategory })}
                      className="w-full px-4 py-4 bg-surface-container-low border-none rounded-xl focus:ring-2 focus:ring-primary text-sm font-semibold appearance-none"
                    >
                      {Object.values(ExpenseCategory).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-on-surface-variant uppercase ml-1">Jumlah (Rp)</label>
                    <input
                      type="number"
                      required
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                      className="w-full px-4 py-4 bg-surface-container-low border-none rounded-xl focus:ring-2 focus:ring-primary text-sm font-bold"
                    />
                  </div>
                </div>
                <button className="w-full bg-primary text-white font-bold py-4 rounded-xl shadow-lg active:scale-95 transition-all mt-4">
                  Simpan Pengeluaran
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
