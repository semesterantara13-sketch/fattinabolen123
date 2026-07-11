/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ShoppingBag, Bell, Wallet, TrendingUp, CheckCircle2, Plus, Package, PieChart, ReceiptText, Tag, Percent } from 'lucide-react';
import { motion } from 'motion/react';
import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, query, orderBy, limit, onSnapshot, where, Timestamp } from 'firebase/firestore';
import { Transaction, Product, ShopInfo } from '../types';

export const HomeView = ({ shopInfo, userRole, onNavigate, onTabChange, onNotification }: { shopInfo: ShopInfo | null, userRole: string, onNavigate: (view: string) => void, onTabChange: (tab: string) => void, onNotification: () => void }) => {
  const [latestTransactions, setLatestTransactions] = useState<Transaction[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [metrics, setMetrics] = useState({
    totalRevenue: 0,
    totalTransactions: 0,
    todayRevenue: 0,
    revenueGrowth: 12, // Placeholder for growth calculation
  });

  useEffect(() => {
    // Latest Transactions
    const qLatest = query(collection(db, 'transactions'), orderBy('date', 'desc'), limit(3));
    const unsubscribeLatest = onSnapshot(qLatest, (snapshot) => {
      const txs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
      setLatestTransactions(txs);
    });

    // Low Stock Products
    const qStock = query(collection(db, 'products'), orderBy('stock', 'asc'), limit(5));
    const unsubscribeStock = onSnapshot(qStock, (snapshot) => {
      const prods = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
      setLowStockProducts(prods.filter(p => p.stock <= (p.minStock || 10)));
    });

    // Overall Metrics (Simplified for performance, in real app might use aggregation or specific period)
    const qMetrics = query(collection(db, 'transactions'), orderBy('date', 'desc'));
    const unsubscribeMetrics = onSnapshot(qMetrics, (snapshot) => {
      const txs = snapshot.docs.map(doc => doc.data() as Transaction);
      
      const totalRev = txs.reduce((acc, curr) => acc + curr.total, 0);
      const totalTx = txs.length;
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayRev = txs
        .filter(t => t.date && t.date.toDate() >= today)
        .reduce((acc, curr) => acc + curr.total, 0);

      setMetrics({
        totalRevenue: totalRev,
        totalTransactions: totalTx,
        todayRevenue: todayRev,
        revenueGrowth: 12,
      });
    });

    return () => {
      unsubscribeLatest();
      unsubscribeStock();
      unsubscribeMetrics();
    };
  }, []);

  return (
    <div className="flex flex-col">
      <header className="flex justify-between items-center px-4 py-4 sticky top-0 z-50 bg-surface/80 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-sm border border-primary/5 overflow-hidden">
            {shopInfo?.logoUrl ? (
              <img src={shopInfo.logoUrl} alt="Logo" className="w-full h-full object-cover" />
            ) : (
              <ShoppingBag className="w-6 h-6" />
            )}
          </div>
          <div>
            <h1 className="text-lg font-bold text-primary leading-tight">{shopInfo?.name || 'Fattina POS'}</h1>
            <p className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider">Halo, {userRole}</p>
          </div>
        </div>
        <button onClick={onNotification} className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-surface-container-high transition-all">
          <Bell className="w-6 h-6 text-on-surface-variant" />
        </button>
      </header>

      <main className="px-4 py-4 space-y-6">
        {/* Metrics Grid */}
        <section className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="col-span-2 md:col-span-1 p-4 rounded-2xl bg-surface-container-lowest shadow-sm border border-outline-variant/30 flex flex-col justify-between min-h-[140px] relative overflow-hidden">
            <div className="absolute -right-4 -top-4 opacity-10">
              <Wallet className="w-24 h-24" />
            </div>
            <div>
              <span className="text-on-surface-variant text-xs font-semibold">Total Penjualan</span>
              <h2 className="text-xl font-bold text-primary mt-1">Rp {metrics.totalRevenue.toLocaleString('id-ID')}</h2>
            </div>
            <div className="flex items-center gap-1 text-primary text-[10px] font-bold">
              <TrendingUp className="w-3 h-3" />
              <span>+{metrics.revenueGrowth}% vs Kemarin</span>
            </div>
          </div>
          
          <div className="p-4 rounded-2xl bg-surface-container-lowest shadow-sm border border-outline-variant/30 flex flex-col justify-between min-h-[140px]">
            <div>
              <span className="text-on-surface-variant text-xs font-semibold">Transaksi</span>
              <h2 className="text-xl font-bold text-on-surface mt-1">{metrics.totalTransactions}</h2>
            </div>
            <div className="flex items-center gap-1 text-primary text-[10px] font-bold">
              <CheckCircle2 className="w-3 h-3" />
              <span>Stabil</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-secondary-container/10 border border-secondary-container/30 shadow-sm flex flex-col justify-between min-h-[140px]">
            <div>
              <span className="text-on-secondary-container text-xs font-semibold">Pendapatan Hari Ini</span>
              <h2 className="text-xl font-bold text-secondary mt-1">Rp {metrics.todayRevenue.toLocaleString('id-ID')}</h2>
            </div>
            <button onClick={() => onTabChange('report')} className="text-secondary text-[10px] font-bold flex items-center gap-1">
              Lihat Grafik <TrendingUp className="w-3 h-3" />
            </button>
          </div>
        </section>

        {/* Quick Menu */}
        <section className="space-y-4">
          <h3 className="text-lg font-bold text-on-surface">Menu Cepat</h3>
          <div className="grid grid-cols-4 gap-4">
            <QuickMenuBtn icon={Plus} label="Transaksi Baru" primary onClick={() => onTabChange('transaction')} />
            <QuickMenuBtn icon={Package} label="Produk" onClick={() => onTabChange('product')} />
            <QuickMenuBtn icon={Tag} label="Kategori" onClick={() => onTabChange('category')} />
            <QuickMenuBtn icon={Percent} label="Potongan" onClick={() => onTabChange('discount')} />
            <QuickMenuBtn icon={PieChart} label="Laporan" onClick={() => onTabChange('report')} />
            <QuickMenuBtn icon={Wallet} label="Pengeluaran" onClick={() => onNavigate('expense')} />
          </div>
        </section>

        {/* Transactions & Alerts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <section className="space-y-4">
            <div className="flex justify-between items-end">
              <h3 className="text-lg font-bold text-on-surface">Transaksi Terbaru</h3>
              <button onClick={() => onTabChange('history')} className="text-primary text-xs font-bold hover:underline">Lihat Semua</button>
            </div>
            <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 shadow-sm overflow-hidden divide-y divide-surface-container-low min-h-[200px]">
              {latestTransactions.length > 0 ? (
                latestTransactions.map(tx => (
                  <TransactionItem 
                    key={tx.id}
                    id={tx.invoiceNumber} 
                    time={tx.date?.toDate().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) || '--:--'} 
                    method={tx.paymentMethod} 
                    amount={tx.total.toLocaleString('id-ID')} 
                    status={tx.status} 
                  />
                ))
              ) : (
                <div className="p-8 text-center text-on-surface-variant text-sm font-semibold">Belum ada transaksi</div>
              )}
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex justify-between items-end">
              <h3 className="text-lg font-bold text-on-surface">Stok Rendah</h3>
              <button onClick={() => onTabChange('product')} className="text-primary text-xs font-bold hover:underline">Restock</button>
            </div>
            <div className="space-y-2">
              {lowStockProducts.length > 0 ? (
                lowStockProducts.map(p => (
                  <AlertItem key={p.id} title={p.name} stock={p.stock} type={p.stock <= 5 ? "error" : undefined} />
                ))
              ) : (
                <div className="p-8 text-center bg-surface-container-lowest rounded-2xl border border-outline-variant/30 text-on-surface-variant text-sm font-semibold italic">Semua stok aman</div>
              )}
            </div>
          </section>
        </div>

        {/* Banner */}
        <div className="w-full h-48 rounded-2xl overflow-hidden relative group">
          <img
            src="https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=1000&auto=format&fit=crop"
            alt="Coffee Shop"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-on-surface/80 via-on-surface/20 to-transparent flex flex-col justify-end p-6">
            <h4 className="text-white text-xl font-bold">Efisiensi Dalam Genggaman</h4>
            <p className="text-white/80 text-sm">Kelola bisnis Anda lebih mudah dengan Fattina POS Premium.</p>
          </div>
        </div>
      </main>
      
      {/* FAB */}
      <button onClick={() => onTabChange('transaction')} className="fixed bottom-24 right-6 w-14 h-14 bg-primary text-white rounded-2xl shadow-xl flex items-center justify-center active:scale-90 transition-transform z-40">
        <Plus className="w-8 h-8" />
      </button>
    </div>
  );
};

const QuickMenuBtn = ({ icon: Icon, label, primary, onClick }: any) => (
  <button onClick={onClick} className="flex flex-col items-center gap-2 group active:scale-95 transition-transform">
    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm transition-all ${
      primary ? 'bg-primary-container text-on-primary-container shadow-md' : 'bg-surface-container-highest text-primary hover:bg-surface-variant'
    }`}>
      <Icon className="w-7 h-7" />
    </div>
    <span className="text-[10px] font-bold text-on-surface-variant text-center leading-tight uppercase tracking-wider">{label}</span>
  </button>
);

const TransactionItem = ({ id, time, method, amount, status }: any) => (
  <div className="p-4 flex items-center justify-between hover:bg-surface-container-low transition-colors cursor-pointer">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-primary">
        <ReceiptText className="w-5 h-5" />
      </div>
      <div>
        <p className="text-sm font-bold">{id}</p>
        <p className="text-[10px] font-semibold text-on-surface-variant uppercase">{time} • {method}</p>
      </div>
    </div>
    <div className="text-right">
      <p className="text-sm font-bold text-on-surface">Rp {amount}</p>
      <span className={`px-2 py-0.5 rounded-full text-[8px] font-bold uppercase ${
        status === 'SUKSES' ? 'bg-primary-container/30 text-on-primary-container' : 'bg-secondary-container/30 text-on-secondary-container'
      }`}>
        {status}
      </span>
    </div>
  </div>
);

const AlertItem = ({ title, stock, type }: any) => (
  <div className={`p-4 rounded-xl flex items-center gap-4 border ${
    type === 'error' ? 'bg-error-container/20 border-error-container' : 'bg-surface-container-lowest border-outline-variant/30'
  }`}>
    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
      type === 'error' ? 'bg-error-container text-error' : 'bg-surface-container text-on-surface-variant'
    }`}>
      <Package className="w-6 h-6" />
    </div>
    <div className="flex-1">
      <p className={`text-sm font-bold ${type === 'error' ? 'text-on-error-container' : 'text-on-surface'}`}>{title}</p>
      <p className={`text-[10px] font-bold ${type === 'error' ? 'text-error' : 'text-on-surface-variant'}`}>Sisa {stock} unit</p>
    </div>
    <button className={`px-4 py-1.5 rounded-full text-xs font-bold active:scale-95 transition-all ${
      type === 'error' ? 'bg-error text-white' : 'bg-surface-container text-on-surface-variant'
    }`}>
      {type === 'error' ? 'Order' : 'Restock'}
    </button>
  </div>
);
