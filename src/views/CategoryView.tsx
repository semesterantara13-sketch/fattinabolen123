/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Category } from '../types';
import { db } from '../lib/firebase';
import { collection, onSnapshot, addDoc, deleteDoc, doc, updateDoc, serverTimestamp, query, orderBy, where, getDocs } from 'firebase/firestore';
import { Plus, Trash2, Edit2, X, Check, Search, Tag } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const CategoryView = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'categories'), orderBy('name', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const cats = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Category[];
      setCategories(cats);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;

    try {
      await addDoc(collection(db, 'categories'), {
        name: newCategoryName.trim(),
        createdAt: serverTimestamp()
      });
      setNewCategoryName('');
    } catch (err) {
      console.error('Error adding category:', err);
      alert('Gagal menambah kategori');
    }
  };

  const handleDeleteCategory = async (id: string, name: string) => {
    // Check if category is being used by products first (optional but good UX)
    try {
      const productQuery = query(collection(db, 'products'), where('category', '==', name));
      const productSnap = await getDocs(productQuery);
      
      let message = `Apakah Anda yakin ingin menghapus kategori "${name}"?`;
      if (!productSnap.empty) {
        message = `Kategori "${name}" masih digunakan oleh ${productSnap.size} produk. Menghapusnya dapat menyebabkan produk tersebut tidak memiliki kategori. Tetap hapus?`;
      }

      if (!confirm(message)) return;
      
      await deleteDoc(doc(db, 'categories', id));
      alert('Kategori berhasil dihapus');
    } catch (err) {
      console.error('Error deleting category:', err);
      alert('Gagal menghapus kategori: ' + (err instanceof Error ? err.message : 'Error tidak diketahui'));
    }
  };

  const startEditing = (category: Category) => {
    setEditingId(category.id);
    setEditingName(category.name);
  };

  const handleUpdateCategory = async () => {
    if (!editingId || !editingName.trim()) return;
    try {
      await updateDoc(doc(db, 'categories', editingId), {
        name: editingName.trim()
      });
      setEditingId(null);
    } catch (err) {
      console.error('Error updating category:', err);
      alert('Gagal mengubah kategori');
    }
  };

  const filteredCategories = categories.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-surface">
      {/* Header */}
      <header className="px-6 py-6 border-b border-outline-variant bg-surface/80 backdrop-blur-xl sticky top-0 z-20">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Tag className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-on-surface tracking-tight">Manajemen Kategori</h1>
              <p className="text-sm font-medium text-on-surface-variant">Kelola pengelompokan produk Anda</p>
            </div>
          </div>
        </div>

        {/* Search & Add */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant group-focus-within:text-primary transition-colors" />
            <input
              type="text"
              placeholder="Cari kategori..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 bg-surface-container-low border border-outline-variant rounded-2xl outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-medium text-sm"
            />
          </div>
          <form onSubmit={handleAddCategory} className="flex gap-2">
            <input
              type="text"
              placeholder="Kategori baru"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              className="flex-1 sm:w-64 px-4 py-3.5 bg-surface-container-low border border-outline-variant rounded-2xl outline-none focus:border-primary transition-all font-medium text-sm"
            />
            <button
              type="submit"
              disabled={!newCategoryName.trim()}
              className="px-6 py-3.5 bg-primary text-on-primary rounded-2xl font-bold text-sm shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50 disabled:shadow-none flex items-center gap-2 whitespace-nowrap"
            >
              <Plus className="w-5 h-5" />
              Tambah
            </button>
          </form>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 p-6 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : filteredCategories.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <AnimatePresence mode="popLayout">
              {filteredCategories.map((category) => (
                <motion.div
                  key={category.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="p-4 bg-surface-container-low border border-outline-variant rounded-2xl group hover:border-primary/50 transition-colors"
                >
                  {editingId === category.id ? (
                    <div className="flex flex-col gap-3">
                      <input
                        autoFocus
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        className="w-full px-3 py-2 bg-surface border border-primary rounded-xl outline-none font-bold text-sm"
                        onKeyDown={(e) => e.key === 'Enter' && handleUpdateCategory()}
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={handleUpdateCategory}
                          className="flex-1 py-2 bg-primary text-on-primary rounded-xl font-bold text-xs flex items-center justify-center gap-1"
                        >
                          <Check className="w-4 h-4" /> Simpan
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="flex-1 py-2 bg-surface-container-high text-on-surface rounded-xl font-bold text-xs flex items-center justify-center gap-1"
                        >
                          <X className="w-4 h-4" /> Batal
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-10 h-10 rounded-xl bg-surface flex items-center justify-center shrink-0">
                          <Tag className="w-5 h-5 text-on-surface-variant" />
                        </div>
                        <span className="font-bold text-on-surface truncate">{category.name}</span>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => startEditing(category)}
                          className="p-2 hover:bg-primary/10 text-primary rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(category.id, category.name)}
                          className="p-2 hover:bg-error/10 text-error rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <div className="w-16 h-16 rounded-full bg-surface-container-high flex items-center justify-center mb-4">
              <Tag className="w-8 h-8 text-on-surface-variant" />
            </div>
            <h3 className="font-bold text-on-surface">Tidak ada kategori ditemukan</h3>
            <p className="text-sm text-on-surface-variant max-w-xs mt-1">
              {searchQuery ? 'Coba ubah kata kunci pencarian Anda' : 'Mulai tambahkan kategori produk Anda di atas'}
            </p>
          </div>
        )}
      </main>
    </div>
  );
};
