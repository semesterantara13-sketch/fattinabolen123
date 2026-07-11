/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CheckCircle2, Wallet, QrCode, Printer, Send, Plus, ShoppingBag, Bell } from 'lucide-react';
import { motion } from 'motion/react';
import { useState, useEffect } from 'react';
import { Transaction } from '../types';
import { db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export const ReceiptView = ({ transactionId, onNewTransaction }: { transactionId: string, onNewTransaction: () => void }) => {
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTransaction = async () => {
      const docRef = doc(db, 'transactions', transactionId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setTransaction({ id: docSnap.id, ...docSnap.data() } as Transaction);
      }
      setLoading(false);
    };
    fetchTransaction();
  }, [transactionId]);

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!transaction) return <div className="min-h-screen flex items-center justify-center">Transaksi tidak ditemukan</div>;

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <header className="flex justify-between items-center px-4 py-4 sticky top-0 z-50 bg-surface shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center">
            <ShoppingBag className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-lg font-bold text-primary">Fattina POS</h1>
        </div>
        <Bell className="w-6 h-6 text-primary" />
      </header>

      <main className="flex-grow container mx-auto px-4 py-8 flex flex-col items-center max-w-md pb-40">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex flex-col items-center mb-8"
        >
          <div className="w-20 h-20 rounded-full bg-primary-container flex items-center justify-center mb-4 shadow-lg shadow-primary-container/20">
            <CheckCircle2 className="w-12 h-12 text-primary fill-primary-container" />
          </div>
          <h2 className="text-2xl font-bold text-center text-on-surface">Pembayaran Berhasil</h2>
          <p className="text-sm text-on-surface-variant text-center mt-1">
            {transaction.date?.toDate().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })} • {transaction.date?.toDate().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
          </p>
        </motion.div>

        <div className="w-full bg-white rounded-2xl shadow-md p-6 relative mb-8 overflow-hidden">
          {/* Jagged edge simulation */}
          <div className="absolute top-0 left-0 right-0 h-1 flex">
             {Array.from({ length: 20 }).map((_, i) => (
               <div key={i} className="flex-1 h-2 bg-surface transform rotate-45 -translate-y-1" />
             ))}
          </div>

          <div className="flex flex-col items-center border-b border-dashed border-outline-variant pb-6 mb-6 mt-2">
            <p className="text-[10px] font-bold text-outline uppercase tracking-[0.2em]">ID Transaksi: #{transaction.invoiceNumber}</p>
            <div className="flex items-center gap-2 mt-2 text-primary">
              <QrCode className="w-4 h-4" />
              <span className="text-xs font-bold uppercase">{transaction.paymentMethod}</span>
            </div>
          </div>

          <div className="space-y-4">
            {transaction.items.map((item, idx) => (
              <div key={idx} className="flex justify-between items-start">
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-on-surface">{item.name}</span>
                  <span className="text-[10px] font-bold text-on-surface-variant uppercase">Qty: {item.quantity} x Rp {item.price.toLocaleString('id-ID')}</span>
                </div>
                <span className="text-sm font-bold text-on-surface">Rp {(item.price * item.quantity).toLocaleString('id-ID')}</span>
              </div>
            ))}
          </div>

          <div className="mt-8 pt-6 border-t border-dashed border-outline-variant space-y-2">
            <div className="flex justify-between text-on-surface-variant text-xs font-semibold">
              <span>Subtotal</span>
              <span>Rp {transaction.subtotal.toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between text-on-surface-variant text-xs font-semibold">
              <span>Pajak (10%)</span>
              <span>Rp {transaction.tax.toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between items-center pt-2">
              <span className="text-lg font-bold text-on-surface">Total</span>
              <span className="text-2xl font-bold text-primary">Rp {transaction.total.toLocaleString('id-ID')}</span>
            </div>
          </div>

          <div className="mt-8 flex flex-col items-center">
            <div className="w-24 h-24 bg-surface-container-low rounded-xl flex items-center justify-center p-4">
              <QrCode className="w-full h-full text-outline-variant" />
            </div>
            <p className="text-[10px] font-bold text-outline mt-4 uppercase tracking-widest">Terima kasih atas kunjungan Anda</p>
          </div>
        </div>

        <div className="w-full space-y-4 px-2">
          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={() => window.print()}
              className="flex flex-col items-center justify-center gap-1 bg-white border border-primary text-primary font-bold py-4 rounded-2xl shadow-sm transition-all hover:bg-surface-container-low active:scale-95"
            >
              <Printer className="w-5 h-5" />
              <span className="text-[10px] uppercase">Cetak Struk</span>
            </button>
            <button className="flex flex-col items-center justify-center gap-1 bg-white border border-primary text-primary font-bold py-4 rounded-2xl shadow-sm transition-all hover:bg-surface-container-low active:scale-95">
              <Send className="w-5 h-5" />
              <span className="text-[10px] uppercase">WhatsApp</span>
            </button>
          </div>
          <button 
            onClick={onNewTransaction}
            className="w-full flex items-center justify-center gap-2 bg-primary text-white font-bold py-4 rounded-2xl shadow-lg transition-all hover:bg-primary-container active:scale-95"
          >
            <Plus className="w-6 h-6" />
            <span className="text-base uppercase tracking-wider">Transaksi Baru</span>
          </button>
        </div>
      </main>
    </div>
  );
};
