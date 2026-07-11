/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Bell, ArrowLeft, CheckCircle2, CloudFog, Megaphone, Package, ChevronRight, Check } from 'lucide-react';
import { motion } from 'motion/react';
import React, { useState, useEffect } from 'react';
import { Notification } from '../types';
import { db } from '../lib/firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';

export const NotificationView = ({ onBack }: { onBack: () => void }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activeFilter, setActiveFilter] = useState('Semua');

  useEffect(() => {
    const q = query(collection(db, 'notifications'), orderBy('date', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification));
      setNotifications(data);
    });
    return unsub;
  }, []);

  const filters = ['Semua', 'Penting', 'Transaksi', 'Sistem'];

  const filteredNotifications = notifications.filter(n => {
    if (activeFilter === 'Semua') return true;
    if (activeFilter === 'Penting') return n.category === 'PENTING' || n.type === 'ERROR';
    if (activeFilter === 'Transaksi') return n.category === 'TRANSAKSI';
    if (activeFilter === 'Sistem') return n.category === 'SISTEM';
    return true;
  });

  // Group by date
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const todayNotifications = filteredNotifications.filter(n => n.date?.toDate() >= today);
  const olderNotifications = filteredNotifications.filter(n => n.date?.toDate() < today);

  return (
    <div className="bg-surface min-h-screen pb-32">
      <nav className="bg-surface shadow-sm flex justify-between items-center px-4 py-4 w-full sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="transition-all duration-200 active:scale-95 text-primary">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold text-primary">Notifikasi</h1>
        </div>
      </nav>

      <main className="px-4 pt-6 space-y-6">
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {filters.map(f => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`px-6 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all active:scale-95 ${
                activeFilter === f ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="space-y-8 min-h-[300px]">
          {filteredNotifications.length > 0 ? (
            <>
              {todayNotifications.length > 0 && (
                <section className="space-y-4">
                  <h2 className="text-[10px] font-bold text-outline px-1 uppercase tracking-[0.2em]">Hari Ini</h2>
                  <div className="space-y-3">
                    {todayNotifications.map(n => (
                      <NotificationItem 
                        key={n.id}
                        icon={n.category === 'TRANSAKSI' ? CheckCircle2 : n.category === 'SISTEM' ? CloudFog : Megaphone} 
                        title={n.title} 
                        message={n.message} 
                        time={n.date?.toDate().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                        type={n.type}
                        actionLabel={n.actionLabel}
                      />
                    ))}
                  </div>
                </section>
              )}

              {olderNotifications.length > 0 && (
                <section className="space-y-4">
                  <h2 className="text-[10px] font-bold text-outline px-1 uppercase tracking-[0.2em]">Sebelumnya</h2>
                  <div className="space-y-3 opacity-80">
                    {olderNotifications.map(n => (
                      <NotificationItem 
                        key={n.id}
                        icon={n.category === 'TRANSAKSI' ? CheckCircle2 : n.category === 'SISTEM' ? CloudFog : Megaphone} 
                        title={n.title} 
                        message={n.message} 
                        time={n.date?.toDate().toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                        type={n.type}
                        actionLabel={n.actionLabel}
                      />
                    ))}
                  </div>
                </section>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
              <div className="w-16 h-16 bg-surface-container rounded-full flex items-center justify-center text-outline">
                <Bell className="w-8 h-8 opacity-20" />
              </div>
              <div>
                <p className="text-on-surface font-bold">Tidak Ada Notifikasi</p>
                <p className="text-xs text-on-surface-variant max-w-[200px] mx-auto">Kami akan memberi tahu Anda saat ada pembaruan penting.</p>
              </div>
            </div>
          )}
        </div>

        {/* Featured Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-primary p-8 flex items-center group shadow-xl shadow-primary/20">
          <div className="z-10 space-y-2 max-w-[70%]">
            <h4 className="text-xl font-bold text-on-primary leading-tight">Optimalkan Stok Anda</h4>
            <p className="text-xs text-on-primary-container opacity-90 leading-relaxed font-medium">Analisis cerdas kami mendeteksi tren kenaikan permintaan pada akhir pekan ini.</p>
          </div>
          <div className="absolute right-0 top-0 h-full w-1/3 overflow-hidden pointer-events-none">
            <img 
              src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=400&auto=format&fit=crop" 
              className="w-full h-full object-cover opacity-20 mix-blend-overlay group-hover:scale-110 transition-transform duration-700" 
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary/80 to-transparent" />
        </div>
      </main>
    </div>
  );
};

const NotificationItem = ({ icon: Icon, title, message, time, type, actionLabel }: any) => {
  const borderColor = type === 'WARNING' ? 'border-secondary' : type === 'SUCCESS' ? 'border-primary' : 'border-tertiary';
  const iconBg = type === 'WARNING' ? 'bg-secondary-container text-on-secondary-container' : type === 'SUCCESS' ? 'bg-primary-container text-on-primary-container' : 'bg-tertiary-container text-on-tertiary-container';

  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      className={`bg-surface-container-lowest rounded-2xl p-4 shadow-sm border-l-4 ${borderColor} flex items-start gap-4 transition-all`}
    >
      <div className={`${iconBg} w-12 h-12 rounded-xl flex items-center justify-center shrink-0`}>
        <Icon className="w-6 h-6" />
      </div>
      <div className="flex-1 space-y-1">
        <div className="flex justify-between items-start">
          <h3 className="text-sm font-bold text-on-surface leading-tight">{title}</h3>
          <span className="text-[10px] font-bold text-outline uppercase tracking-wider">{time}</span>
        </div>
        <p className="text-xs text-on-surface-variant leading-relaxed font-medium">{message}</p>
        {actionLabel && (
          <button className="pt-2 text-primary text-[10px] font-bold uppercase tracking-[0.15em] hover:underline transition-all">
            {actionLabel}
          </button>
        )}
      </div>
    </motion.div>
  );
};
