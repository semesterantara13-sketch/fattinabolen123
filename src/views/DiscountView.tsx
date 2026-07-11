/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Discount } from '../types';
import { db } from '../lib/firebase';
import { collection, onSnapshot, addDoc, deleteDoc, doc, updateDoc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { Plus, Trash2, Edit2, X, Check, Search, Percent, Banknote } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const DiscountView = () => {
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Form state
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'percentage' as 'fixed' | 'percentage',
    value: 0,
    isActive: true
  });

  useEffect(() => {
    const q = query(collection(db, 'discounts'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Discount[];
      setDiscounts(data);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const resetForm = () => {
    setFormData({ name: '', type: 'percentage', value: 0, isActive: true });
    setIsAdding(false);
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || formData.value < 0) return;

    try {
      if (editingId) {
        await updateDoc(doc(db, 'discounts', editingId), {
          ...formData,
          updatedAt: serverTimestamp()
        });
      } else {
        await addDoc(collection(db, 'discounts'), {
          ...formData,
          createdAt: serverTimestamp()
        });
      }
      resetForm();
    } catch (err) {
      console.error('Error saving discount:', err);
      alert('Gagal menyimpan potongan');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus potongan ini?')) return;
    try {
      await deleteDoc(doc(db, 'discounts', id));
    } catch (err) {
      alert('Gagal menghapus potongan');
    }
  };

  const startEdit = (discount: Discount) => {
    setFormData({
      name: discount.name,
      type: discount.type,
      value: discount.value,
      isActive: discount.isActive
    });
    setEditingId(discount.id);
    setIsAdding(true);
  };

  const filteredDiscounts = discounts.filter(d => 
    d.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-surface">
      <header className="px-6 py-6 border-b border-outline-variant bg-surface/80 backdrop-blur-xl sticky top-0 z-20">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Percent className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-on-surface tracking-tight">Manajemen Potongan</h1>
              <p className="text-sm font-medium text-on-surface-variant">Atur diskon dan potongan harga</p>
            </div>
          </div>
          {!isAdding && (
            <button
              onClick={() => setIsAdding(true)}
              className="px-6 py-3 bg-primary text-on-primary rounded-2xl font-bold text-sm shadow-lg shadow-primary/20 flex items-center gap-2 hover:-translate-y-0.5 transition-all"
            >
              <Plus className="w-5 h-5" />
              Tambah Potongan
            </button>
          )}
        </div>

        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant group-focus-within:text-primary transition-colors" />
          <input
            type="text"
            placeholder="Cari potongan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 bg-surface-container-low border border-outline-variant rounded-2xl outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-medium text-sm"
          />
        </div>
      </header>

      <main className="flex-1 p-6 overflow-y-auto">
        <AnimatePresence>
          {isAdding && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-8 p-6 bg-surface-container-high rounded-3xl border border-primary/20"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-bold text-on-surface">{editingId ? 'Edit Potongan' : 'Tambah Potongan Baru'}</h2>
                <button onClick={resetForm} className="p-2 hover:bg-surface-container-highest rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-on-surface-variant uppercase ml-2">Nama Potongan</label>
                  <input
                    required
                    placeholder="Contoh: Diskon Member"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 bg-surface rounded-2xl border border-outline-variant outline-none focus:border-primary font-semibold text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-on-surface-variant uppercase ml-2">Tipe Potongan</label>
                  <div className="flex p-1 bg-surface rounded-2xl border border-outline-variant">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, type: 'percentage' })}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${formData.type === 'percentage' ? 'bg-primary text-on-primary' : 'hover:bg-surface-container-low'}`}
                    >
                      Persentase (%)
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, type: 'fixed' })}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${formData.type === 'fixed' ? 'bg-primary text-on-primary' : 'hover:bg-surface-container-low'}`}
                    >
                      Nominal (Rp)
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-on-surface-variant uppercase ml-2">Nilai {formData.type === 'percentage' ? '(%)' : '(Rp)'}</label>
                  <input
                    type="number"
                    required
                    min="0"
                    max={formData.type === 'percentage' ? '100' : undefined}
                    value={formData.value}
                    onChange={e => setFormData({ ...formData, value: Number(e.target.value) })}
                    className="w-full px-4 py-3 bg-surface rounded-2xl border border-outline-variant outline-none focus:border-primary font-bold text-sm"
                  />
                </div>

                <div className="flex items-end pb-1">
                  <button
                    type="submit"
                    className="w-full py-3 bg-primary text-on-primary rounded-2xl font-bold text-sm shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
                  >
                    <Check className="w-5 h-5" />
                    Simpan Potongan
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            <AnimatePresence mode="popLayout">
              {filteredDiscounts.map((discount) => (
                <motion.div
                  key={discount.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="p-5 bg-surface-container-low border border-outline-variant rounded-3xl group hover:border-primary/40 transition-colors relative overflow-hidden"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex gap-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${discount.type === 'percentage' ? 'bg-secondary/10 text-secondary' : 'bg-tertiary/10 text-tertiary'}`}>
                        {discount.type === 'percentage' ? <Percent className="w-6 h-6" /> : <Banknote className="w-6 h-6" />}
                      </div>
                      <div>
                        <h3 className="font-bold text-on-surface">{discount.name}</h3>
                        <p className="text-2xl font-black text-primary mt-1">
                          {discount.type === 'percentage' ? `${discount.value}%` : `Rp ${discount.value.toLocaleString()}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => startEdit(discount)} className="p-2 hover:bg-primary/10 text-primary rounded-xl">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(discount.id)} className="p-2 hover:bg-error/10 text-error rounded-xl">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-outline-variant/30 flex justify-between items-center">
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider ${discount.isActive ? 'bg-success/10 text-success' : 'bg-outline-variant text-on-surface-variant'}`}>
                      {discount.isActive ? 'Aktif' : 'Nonaktif'}
                    </span>
                    <button 
                      onClick={() => updateDoc(doc(db, 'discounts', discount.id), { isActive: !discount.isActive })}
                      className="text-[10px] font-bold text-primary hover:underline uppercase"
                    >
                      {discount.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {filteredDiscounts.length === 0 && !isLoading && (
              <div className="col-span-full py-20 text-center">
                <div className="w-20 h-20 bg-surface-container-high rounded-full flex items-center justify-center mx-auto mb-4">
                  <Percent className="w-10 h-10 text-outline" />
                </div>
                <h3 className="font-bold text-on-surface">Belum ada potongan</h3>
                <p className="text-sm text-on-surface-variant mt-2">Daftar potongan harga yang Anda buat akan muncul di sini.</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};
