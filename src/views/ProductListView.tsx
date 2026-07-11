/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ArrowLeft, Bell, Search, Plus, Edit2, Trash2, Package, Tag } from 'lucide-react';
import { motion } from 'motion/react';
import { useState, useEffect } from 'react';
import { Product, Category } from '../types';
import { db } from '../lib/firebase';
import { collection, getDocs, onSnapshot, deleteDoc, doc, query, orderBy } from 'firebase/firestore';

export const ProductListView = ({ onAdd, onEdit }: { onAdd: () => void, onEdit: (product: Product) => void }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<{id: string, name: string}[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('Semua');

  useEffect(() => {
    const unsubProd = onSnapshot(collection(db, 'products'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
      setProducts(data);
      setLoading(false);
    });

    const qCat = query(collection(db, 'categories'), orderBy('name', 'asc'));
    const unsubCat = onSnapshot(qCat, (snapshot) => {
      const cats = snapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name as string
      }));
      // Filter out duplicates by name if any, but keep unique IDs
      const uniqueCats = Array.from(new Map(cats.map(c => [c.name, c])).values());
      setCategories([{ id: 'all', name: 'Semua' }, ...uniqueCats]);
    });

    return () => {
      unsubProd();
      unsubCat();
    };
  }, []);
  
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'Semua' || p.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const handleDelete = async (id: string) => {
    if (window.confirm('Hapus produk ini?')) {
      await deleteDoc(doc(db, 'products', id));
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <header className="flex justify-between items-center px-4 py-4 sticky top-0 z-50 bg-surface/80 backdrop-blur-md shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center overflow-hidden">
            <Package className="w-6 h-6 text-on-primary-container" />
          </div>
          <h1 className="text-lg font-bold text-primary leading-tight">Fattina Bolen</h1>
        </div>
        <button className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-surface-container-high transition-all">
          <Bell className="w-6 h-6 text-primary" />
        </button>
      </header>

      <main className="pb-24">
        {/* Search & Filter */}
        <section className="px-4 pt-4">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-outline group-focus-within:text-primary transition-colors" />
            <input
              type="text"
              placeholder="Cari produk..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-surface-container-low border-none rounded-xl focus:ring-2 focus:ring-primary transition-all outline-none"
            />
          </div>

          <div className="flex gap-2 mt-4 overflow-x-auto no-scrollbar py-1">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.name)}
                className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                  activeCategory === cat.name ? 'bg-primary text-white shadow-sm' : 'bg-surface-container-highest text-on-surface-variant hover:bg-surface-container-high'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </section>

        {/* Product Grid */}
        <section className="px-4 mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            <div className="col-span-full py-12 text-center text-on-surface-variant">Loading produk...</div>
          ) : filteredProducts.length === 0 ? (
            <div className="col-span-full py-12 text-center text-on-surface-variant">Produk tidak ditemukan</div>
          ) : (
            filteredProducts.map((p, index) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-surface-container-lowest rounded-2xl shadow-sm overflow-hidden border border-outline-variant/30"
              >
                <div className="aspect-square w-full relative">
                  <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                  <div className="absolute top-2 left-2 bg-primary/90 text-white px-3 py-1 rounded-full text-[8px] font-bold uppercase tracking-wider">
                    {p.category}
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-sm font-bold text-on-surface">{p.name}</h3>
                      <p className="text-xs text-on-surface-variant">Stok: {p.stock} {p.category === 'Minuman' ? 'cups' : 'pcs'}</p>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => onEdit(p)}
                        className="p-2 text-primary hover:bg-surface-container-high rounded-full transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(p.id)}
                        className="p-2 text-error hover:bg-error-container rounded-full transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="mt-4 flex justify-between items-center">
                    <span className="text-lg font-bold text-primary">Rp {p.price.toLocaleString('id-ID')}</span>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </section>
      </main>

      <button 
        onClick={onAdd}
        className="fixed bottom-24 right-4 w-14 h-14 bg-primary text-white rounded-full shadow-lg flex items-center justify-center transition-transform active:scale-90 z-50"
      >
        <Plus className="w-8 h-8" />
      </button>
    </div>
  );
};
