/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Home, ReceiptText, Package, PieChart, User, Plus, Bell, ShoppingBag, ArrowLeft, Tag, Percent } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import React, { useState, useEffect } from 'react';
import { CartItem, Category, Product, ShopInfo, UserAccount } from './types';
import { db } from './lib/firebase';
import { collection, getDocs, addDoc, query, limit, doc, onSnapshot, setDoc, serverTimestamp, where } from 'firebase/firestore';

// Views
import { HomeView } from './views/HomeView';
import { ProductListView } from './views/ProductListView';
import { ProductFormView } from './views/ProductFormView';
import { CategoryView } from './views/CategoryView';
import { DiscountView } from './views/DiscountView';
import { TransactionView } from './views/TransactionView';
import { HistoryView } from './views/HistoryView';
import { ReportView } from './views/ReportView';
import { ExpenseView } from './views/ExpenseView';
import { ProfileView } from './views/ProfileView';
import { NotificationView } from './views/NotificationView';
import { CheckoutView } from './views/CheckoutView';
import { ReceiptView } from './views/ReceiptView';

const SplashScreen = ({ onComplete }: { onComplete: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(onComplete, 2500);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 bg-primary flex flex-col items-center justify-center z-[100]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="flex flex-col items-center"
      >
        <div className="w-32 h-32 flex items-center justify-center bg-white rounded-xl shadow-lg transform rotate-3 mb-8">
          <ShoppingBag className="w-16 h-16 text-primary fill-primary" />
        </div>
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white tracking-tight">Fattina POS</h1>
          <p className="text-sm text-on-primary-container/80 mt-2 opacity-90">Solusi Kasir Digital Modern</p>
        </div>
      </motion.div>
      <div className="absolute bottom-12 w-full px-8 flex flex-col items-center space-y-4">
        <div className="w-48 h-1 bg-white/20 rounded-full overflow-hidden relative">
          <motion.div
            initial={{ left: "-50%" }}
            animate={{ left: "100%" }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-0 bottom-0 w-1/2 bg-white"
          />
        </div>
        <div className="flex flex-col items-center">
          <span className="text-xs font-semibold text-white/60 tracking-[0.2em] uppercase animate-pulse">Menyiapkan Sistem</span>
          <span className="text-[10px] text-white/40 mt-1">v2.4.0 • Enterprise Edition</span>
        </div>
      </div>
    </div>
  );
};

const LoginPage = ({ onLogin, shopInfo }: { onLogin: (user: UserAccount) => void, shopInfo: ShopInfo | null }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      const q = query(collection(db, 'users'), where('username', '==', username), limit(1));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        const userData = { id: userDoc.id, ...userDoc.data() } as UserAccount;
        
        if (userData.password === password) {
          onLogin(userData);
        } else {
          setError('Password salah');
        }
      } else {
        setError('Username tidak ditemukan');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError(`Terjadi kesalahan: ${err.message || 'Gagal masuk'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-surface overflow-x-hidden relative">
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-32 -mt-32" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-secondary-container/5 rounded-full blur-3xl -ml-40 -mb-40" />
      
      <main className="flex-grow flex flex-col items-center justify-center px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <div className="flex flex-col items-center text-center mb-8">
            <div className="relative w-48 h-48 mb-6 bg-surface-container-low rounded-full flex items-center justify-center overflow-hidden shadow-xl border-4 border-white">
              {shopInfo?.logoUrl ? (
                <img src={shopInfo.logoUrl} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <ShoppingBag className="w-16 h-16 text-primary" />
              )}
            </div>
            <h1 className="text-3xl font-bold text-on-surface mb-1">{shopInfo?.name || 'Fattina POS'}</h1>
            <p className="text-on-surface-variant font-medium">Masuk ke dashboard POS Anda</p>
          </div>

          <div className="bg-surface-container-lowest shadow-2xl rounded-[32px] p-8 border border-outline-variant/30">
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-1">
                <label className="text-xs font-bold text-on-surface-variant ml-2 uppercase tracking-widest">Username</label>
                <input 
                  type="text" 
                  placeholder="Username" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-6 py-4 bg-surface-container-low border-none rounded-2xl focus:ring-2 focus:ring-primary transition-all outline-none font-semibold" 
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-on-surface-variant ml-2 uppercase tracking-widest">Password</label>
                <input 
                  type="password" 
                  placeholder="••••••••" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-6 py-4 bg-surface-container-low border-none rounded-2xl focus:ring-2 focus:ring-primary transition-all outline-none font-semibold" 
                />
              </div>

              <AnimatePresence>
                {error && (
                  <motion.p 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="text-error text-xs font-bold text-center px-2"
                  >
                    {error}
                  </motion.p>
                )}
              </AnimatePresence>

              <button 
                type="submit" 
                disabled={isLoading}
                className="w-full bg-primary hover:bg-primary-container text-white font-bold py-4 rounded-2xl shadow-lg shadow-primary/20 active:scale-[0.98] transition-all flex items-center justify-center space-x-2 mt-4 disabled:opacity-50"
              >
                <span>{isLoading ? 'Memproses...' : 'Masuk'}</span>
                <ArrowLeft className="w-5 h-5 rotate-180" />
              </button>
            </form>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [shopInfo, setShopInfo] = useState<ShopInfo | null>(null);
  const [activeTab, setActiveTab] = useState('home');
  const [currentView, setCurrentView] = useState('main'); // main, add-product, edit-product, checkout, receipt, notifications, history, expense
  const [editingProduct, setEditingProduct] = useState<Product | undefined>(undefined);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeTransactionId, setActiveTransactionId] = useState<string | null>(null);

  useEffect(() => {
    // Seed initial data if needed
    const seed = async () => {
      // Products Seed
      const qProd = query(collection(db, 'products'), limit(1));
      const prodSnap = await getDocs(qProd);
      if (prodSnap.empty) {
        const products = [
          { name: 'Bolen Pisang Cokelat', category: 'Bolen', price: 12500, cost: 8000, stock: 42, minStock: 10, image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=400', isActive: true },
          { name: 'Lapis Cokelat Premium', category: 'Kue', price: 25000, cost: 15000, stock: 12, minStock: 5, image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?q=80&w=400', isActive: true },
          { name: 'Thai Tea Signature', category: 'Minuman', price: 18000, cost: 10000, stock: 50, minStock: 20, image: 'https://images.unsplash.com/photo-1558857563-b371f31ca7fc?q=80&w=400', isActive: true },
        ];
        for (const p of products) {
          await addDoc(collection(db, 'products'), p);
        }
      }

      // Shop Info Seed
      const shopRef = doc(db, 'settings', 'shop_info');
      const shopSnap = await getDocs(query(collection(db, 'settings'), limit(1)));
      if (shopSnap.empty) {
        await setDoc(shopRef, {
          name: 'Fattina POS',
          address: 'Jakarta, Indonesia',
          phone: '081234567890',
          logoUrl: '',
          updatedAt: serverTimestamp()
        }, { merge: true });
      }

      // Categories Seed
      const catSnap = await getDocs(query(collection(db, 'categories'), limit(1)));
      if (catSnap.empty) {
        const defaultCats = [
          { id: 'cat_makanan', name: 'Makanan' },
          { id: 'cat_minuman', name: 'Minuman' },
          { id: 'cat_snack', name: 'Snack' },
          { id: 'cat_roti', name: 'Roti' },
          { id: 'cat_bolen', name: 'Bolen' },
          { id: 'cat_kue', name: 'Kue' }
        ];
        for (const cat of defaultCats) {
          await setDoc(doc(db, 'categories', cat.id), {
            name: cat.name,
            createdAt: serverTimestamp()
          });
        }
      }

      // Users Seed
      const usersSnap = await getDocs(collection(db, 'users'));
      if (usersSnap.empty) {
        await addDoc(collection(db, 'users'), {
          username: 'admin',
          password: 'pass123',
          role: 'Admin',
          name: 'Administrator'
        });
        await addDoc(collection(db, 'users'), {
          username: 'kasir',
          password: 'kasir123',
          role: 'Kasir',
          name: 'Staff Kasir'
        });
      }
    };
    seed();

    // Listen to Shop Info
    const unsubShop = onSnapshot(doc(db, 'settings', 'shop_info'), (snapshot) => {
      if (snapshot.exists()) {
        setShopInfo(snapshot.data() as ShopInfo);
      }
    });

    return () => unsubShop();
  }, []);

  if (showSplash) return <SplashScreen onComplete={() => setShowSplash(false)} />;
  if (!isLoggedIn) return <LoginPage shopInfo={shopInfo} onLogin={(user) => { setCurrentUser(user); setIsLoggedIn(true); }} />;

  const renderContent = () => {
    // Overlays / Sub-views
    if (currentView === 'add-product') return <ProductFormView onBack={() => setCurrentView('main')} />;
    if (currentView === 'edit-product') return <ProductFormView product={editingProduct} onBack={() => { setCurrentView('main'); setEditingProduct(undefined); }} />;
    if (currentView === 'checkout') return <CheckoutView cart={cart} onBack={() => setCurrentView('main')} onComplete={(id) => { setActiveTransactionId(id); setCurrentView('receipt'); }} />;
    if (currentView === 'receipt' && activeTransactionId) return <ReceiptView transactionId={activeTransactionId} onNewTransaction={() => { setCurrentView('main'); setActiveTab('transaction'); setActiveTransactionId(null); }} />;
    if (currentView === 'notifications') return <NotificationView onBack={() => setCurrentView('main')} />;
    if (currentView === 'expense') return <ExpenseView />;

    // Main Tabs
    switch (activeTab) {
      case 'home': return <HomeView shopInfo={shopInfo} userRole={currentUser?.role || 'Kasir'} onNavigate={(view) => setCurrentView(view)} onTabChange={setActiveTab} onNotification={() => setCurrentView('notifications')} />;
      case 'transaction': return <TransactionView onCheckout={(c) => { setCart(c); setCurrentView('checkout'); }} />;
      case 'history': return <HistoryView onSelect={(id) => { setActiveTransactionId(id); setCurrentView('receipt'); }} />;
      case 'product': return <ProductListView onAdd={() => setCurrentView('add-product')} onEdit={(p) => { setEditingProduct(p); setCurrentView('edit-product'); }} />;
      case 'category': return <CategoryView />;
      case 'discount': return <DiscountView />;
      case 'report': return <ReportView />;
      case 'profile': return <ProfileView userRole={currentUser?.role || 'Kasir'} currentUser={currentUser} onLogout={() => setIsLoggedIn(false)} onTabChange={setActiveTab} />;
      default: return <HomeView shopInfo={shopInfo} userRole={currentUser?.role || 'Kasir'} onNavigate={(view) => setCurrentView(view)} onTabChange={setActiveTab} onNotification={() => setCurrentView('notifications')} />;
    }
  };

  const showBottomNav = !['add-product', 'edit-product', 'checkout', 'receipt', 'notifications'].includes(currentView);

  return (
    <div className={`min-h-screen bg-surface ${showBottomNav ? 'pb-24' : ''}`}>
      <AnimatePresence mode="wait">
        <motion.div key={activeTab + currentView} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
          {renderContent()}
        </motion.div>
      </AnimatePresence>
      
      {showBottomNav && (
        <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center h-20 px-2 bg-surface-container-lowest shadow-[0_-4px_24px_rgba(0,0,0,0.06)] pb-safe">
          {[
            { id: 'home', icon: Home, label: 'Home' },
            { id: 'history', icon: ReceiptText, label: 'Transaksi' },
            { id: 'product', icon: Package, label: 'Produk' },
            { id: 'category', icon: Tag, label: 'Kategori' },
            { id: 'discount', icon: Percent, label: 'Potongan' },
            { id: 'report', icon: PieChart, label: 'Laporan' },
            { id: 'profile', icon: User, label: 'Profil' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setCurrentView('main'); }}
              className={`flex flex-col items-center justify-center px-4 py-1 transition-all duration-200 rounded-full ${
                activeTab === tab.id ? 'bg-primary-container text-on-primary-container' : 'text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              <tab.icon className={`w-6 h-6 ${activeTab === tab.id ? 'fill-current' : ''}`} />
              <span className="text-[10px] font-bold mt-1 uppercase tracking-wider">{tab.label}</span>
            </button>
          ))}
        </nav>
      )}
    </div>
  );
}
