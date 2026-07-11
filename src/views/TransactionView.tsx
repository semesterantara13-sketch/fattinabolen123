/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Search, ShoppingBasket, Plus, Minus, ArrowRight, ShoppingBag, Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect } from 'react';
import { Product, CartItem, Category } from '../types';
import { db } from '../lib/firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';

export const TransactionView = ({ onCheckout }: { onCheckout: (cart: CartItem[]) => void }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<{id: string, name: string}[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeCategory, setActiveCategory] = useState('Semua');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const unsubProd = onSnapshot(collection(db, 'products'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
      setProducts(data);
    });

    const qCat = query(collection(db, 'categories'), orderBy('name', 'asc'));
    const unsubCat = onSnapshot(qCat, (snapshot) => {
      const cats = snapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name as string
      }));
      const uniqueCats = Array.from(new Map(cats.map(c => [c.name, c])).values());
      setCategories([{ id: 'all', name: 'Semua' }, ...uniqueCats]);
    });

    return () => {
      unsubProd();
      unsubCat();
    };
  }, []);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (id: string) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === id);
      if (existing && existing.quantity > 1) {
        return prev.map(item => item.id === id ? { ...item, quantity: item.quantity - 1 } : item);
      }
      return prev.filter(item => item.id !== id);
    });
  };

  const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="flex flex-col min-h-screen bg-surface">
      <header className="flex justify-between items-center px-4 py-4 sticky top-0 z-50 bg-surface shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center overflow-hidden">
            <ShoppingBag className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-lg font-bold text-primary">Fattina Bolen</h1>
        </div>
        <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container-high transition-all text-primary">
          <Bell className="w-6 h-6" />
        </button>
      </header>

      <main className="flex-grow px-4 pt-4 pb-40">
        <section className="mb-6 space-y-4">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-outline group-focus-within:text-primary transition-colors" />
            <input
              type="text"
              placeholder="Cari produk..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-surface-container-low border-none rounded-2xl py-3.5 pl-12 pr-4 text-sm focus:ring-2 focus:ring-primary-container transition-all shadow-sm outline-none"
            />
          </div>

          <div className="flex overflow-x-auto gap-2 pb-1 no-scrollbar">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.name)}
                className={`whitespace-nowrap px-6 py-2 rounded-full font-semibold transition-all active:scale-95 shadow-sm ${
                  activeCategory === cat.name ? 'bg-primary text-white' : 'bg-surface-container-highest text-on-surface-variant hover:bg-surface-container-high'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </section>

        <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.filter(p => activeCategory === 'Semua' || p.category === activeCategory).map(p => (
            <motion.div
              key={p.id}
              whileTap={{ scale: 0.95 }}
              onClick={() => addToCart(p)}
              className="bg-white rounded-2xl overflow-hidden shadow-sm border border-outline-variant hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="aspect-square relative overflow-hidden">
                <img src={p.image} alt={p.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                <div className="absolute top-2 right-2 px-2 py-1 rounded-lg bg-surface/90 backdrop-blur-sm shadow-sm">
                  <p className="text-[10px] font-bold text-on-surface-variant">Stok: {p.stock}</p>
                </div>
              </div>
              <div className="p-4">
                <h3 className="text-sm font-bold text-on-surface truncate">{p.name}</h3>
                <div className="mt-2 flex items-center justify-between">
                  <p className="text-sm font-bold text-primary">Rp{p.price.toLocaleString('id-ID')}</p>
                  <Plus className="w-5 h-5 text-primary" />
                </div>
              </div>
            </motion.div>
          ))}
        </section>
      </main>

      <AnimatePresence>
        {cart.length > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-24 left-4 right-4 z-50"
          >
            <div className="bg-inverse-surface text-inverse-on-surface p-4 rounded-3xl flex items-center justify-between shadow-2xl border border-white/10 backdrop-blur-md">
              <div className="flex items-center gap-4">
                <div className="bg-primary p-2.5 rounded-2xl">
                  <ShoppingBasket className="w-6 h-6 text-on-primary" />
                </div>
                <div>
                  <p className="text-sm font-bold leading-tight">{totalItems} Item Terpilih</p>
                  <p className="text-xs font-semibold text-primary-fixed opacity-90">Total: Rp{totalAmount.toLocaleString('id-ID')}</p>
                </div>
              </div>
              <button 
                onClick={() => onCheckout(cart)}
                className="bg-primary hover:bg-primary-container text-white px-8 py-3 rounded-2xl font-bold flex items-center gap-2 transition-all active:scale-95 shadow-lg"
              >
                <span>Checkout</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
