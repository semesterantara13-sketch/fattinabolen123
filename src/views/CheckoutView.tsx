/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ArrowLeft, Edit3, Plus, Minus, CreditCard, Wallet, QrCode, ShoppingCart, Percent, Tag as TagIcon, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect } from 'react';
import { CartItem, PaymentMethod, TransactionStatus, Discount } from '../types';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp, updateDoc, doc, increment, query, where, getDocs } from 'firebase/firestore';

export const CheckoutView = ({ cart: initialCart, onBack, onComplete }: { cart: CartItem[], onBack: () => void, onComplete: (transactionId: string) => void }) => {
  const [cart, setCart] = useState(initialCart);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.TUNAI);
  const [loading, setLoading] = useState(false);
  const [availableDiscounts, setAvailableDiscounts] = useState<Discount[]>([]);
  const [selectedDiscount, setSelectedDiscount] = useState<Discount | null>(null);
  const [showDiscountModal, setShowDiscountModal] = useState(false);

  useEffect(() => {
    const fetchDiscounts = async () => {
      try {
        const q = query(collection(db, 'discounts'), where('isActive', '==', true));
        const snapshot = await getDocs(q);
        const discounts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Discount[];
        setAvailableDiscounts(discounts);
      } catch (err) {
        console.error('Error fetching discounts:', err);
      }
    };
    fetchDiscounts();
  }, []);

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  const calculateDiscountAmount = () => {
    if (!selectedDiscount) return 0;
    if (selectedDiscount.type === 'percentage') {
      return Math.round((subtotal * selectedDiscount.value) / 100);
    }
    return selectedDiscount.value;
  };

  const discountAmount = calculateDiscountAmount();
  const tax = Math.round((subtotal - discountAmount) * 0.11);
  const total = subtotal - discountAmount + tax;

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const handlePayment = async () => {
    setLoading(true);
    try {
      const transactionData = {
        invoiceNumber: `TRX-${Date.now().toString().slice(-5)}`,
        date: serverTimestamp(),
        items: cart,
        subtotal,
        discount: discountAmount,
        discountDetails: selectedDiscount ? {
          id: selectedDiscount.id,
          name: selectedDiscount.name,
          type: selectedDiscount.type,
          value: selectedDiscount.value
        } : null,
        tax,
        total,
        paymentMethod,
        status: TransactionStatus.SUKSES,
        cashierName: 'Admin'
      };

      const docRef = await addDoc(collection(db, 'transactions'), transactionData);
      
      // Update stocks and check for low stock
      for (const item of cart) {
        const productRef = doc(db, 'products', item.id);
        await updateDoc(productRef, {
          stock: increment(-item.quantity)
        });

        // Trigger notification for low stock (local check)
        const currentStock = item.stock - item.quantity;
        if (currentStock <= (item.minStock || 5)) {
          await addDoc(collection(db, 'notifications'), {
            title: 'Stok Rendah!',
            message: `Produk '${item.name}' tersisa ${currentStock} unit.`,
            type: 'WARNING',
            category: 'PENTING',
            date: serverTimestamp(),
            isRead: false,
            actionLabel: 'Restock'
          });
        }
      }

      await addDoc(collection(db, 'notifications'), {
        title: 'Transaksi Berhasil',
        message: `Pembayaran ${paymentMethod} sebesar Rp ${total.toLocaleString('id-ID')} sukses.`,
        type: 'SUCCESS',
        category: 'TRANSAKSI',
        date: serverTimestamp(),
        isRead: false,
        actionLabel: 'Lihat Struk'
      });

      onComplete(docRef.id);
    } catch (err) {
      console.error(err);
      alert('Gagal memproses pembayaran');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <header className="flex justify-between items-center px-4 py-4 sticky top-0 z-50 bg-surface shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="text-on-surface-variant active:scale-95 transition-all">
            <ArrowLeft className="w-6 h-6 text-primary" />
          </button>
          <h1 className="text-xl font-bold text-primary">Checkout</h1>
        </div>
        <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center text-[10px] text-on-primary-container font-bold">AD</div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-8 flex-1 pb-40 w-full">
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">Keranjang Belanja</h2>
            <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">{cart.length} Item</span>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {cart.map(item => (
              <div key={item.id} className="bg-surface-container-lowest p-4 rounded-2xl shadow-sm border border-outline-variant/30 flex gap-4 items-start group">
                <div className="w-16 h-16 rounded-xl bg-surface-container overflow-hidden flex-shrink-0">
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <h3 className="text-sm font-bold truncate">{item.name}</h3>
                    <p className="text-sm font-bold text-primary">Rp {item.price.toLocaleString('id-ID')}</p>
                  </div>
                  <div className="flex items-center justify-between gap-4 mt-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-1 text-on-surface-variant">
                        <Edit3 className="w-3 h-3" />
                        <input
                          type="text"
                          placeholder="Tambah catatan..."
                          className="bg-transparent border-none p-0 text-xs focus:ring-0 placeholder:text-outline w-full"
                          value={item.notes || ''}
                          onChange={(e) => {
                            const newCart = [...cart];
                            const idx = newCart.findIndex(i => i.id === item.id);
                            newCart[idx].notes = e.target.value;
                            setCart(newCart);
                          }}
                        />
                      </div>
                    </div>
                    <div className="flex items-center bg-surface-container-low rounded-full px-1 py-1">
                      <button 
                        onClick={() => updateQuantity(item.id, -1)}
                        className="w-8 h-8 flex items-center justify-center hover:bg-surface-container-high rounded-full transition-colors"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-8 text-center font-bold text-xs">{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.id, 1)}
                        className="w-8 h-8 flex items-center justify-center hover:bg-surface-container-high rounded-full transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Discount Section */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold">Potongan Harga</h2>
          {selectedDiscount ? (
            <div className="flex items-center justify-between p-4 bg-primary/5 border border-primary/20 rounded-2xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <Percent className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-bold">{selectedDiscount.name}</p>
                  <p className="text-xs text-primary font-semibold">
                    Terpasang: {selectedDiscount.type === 'percentage' ? `${selectedDiscount.value}%` : `Rp ${selectedDiscount.value.toLocaleString('id-ID')}`}
                  </p>
                </div>
              </div>
              <button onClick={() => setSelectedDiscount(null)} className="p-2 hover:bg-error/10 text-error rounded-xl transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <button 
              onClick={() => setShowDiscountModal(true)}
              className="w-full flex items-center justify-between p-4 bg-surface-container-lowest border border-outline-variant/30 rounded-2xl hover:bg-surface-container-low transition-all"
            >
              <div className="flex items-center gap-3 text-on-surface-variant">
                <TagIcon className="w-5 h-5" />
                <span className="text-sm font-bold">Pilih Potongan / Kupon</span>
              </div>
              <Plus className="w-5 h-5 text-primary" />
            </button>
          )}
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-bold">Metode Pembayaran</h2>
          <div className="grid grid-cols-3 gap-3">
            {[
              { id: PaymentMethod.TUNAI, icon: Wallet, label: 'Tunai' },
              { id: PaymentMethod.QRIS, icon: QrCode, label: 'QRIS' },
              { id: PaymentMethod.TRANSFER, icon: CreditCard, label: 'Transfer' },
            ].map(method => (
              <button
                key={method.id}
                onClick={() => setPaymentMethod(method.id)}
                className={`p-4 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all border ${
                  paymentMethod === method.id ? 'bg-primary/5 border-primary shadow-sm' : 'bg-surface-container-lowest border-outline-variant/30 hover:bg-surface-container-low'
                }`}
              >
                <method.icon className={`w-8 h-8 ${paymentMethod === method.id ? 'text-primary' : 'text-on-surface-variant'}`} />
                <span className={`text-[10px] font-bold ${paymentMethod === method.id ? 'text-primary' : 'text-on-surface-variant'}`}>{method.label}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="bg-surface-container-low rounded-3xl p-6 space-y-4 border border-outline-variant/20">
          <h2 className="text-lg font-bold">Ringkasan Pesanan</h2>
          <div className="space-y-2">
            <div className="flex justify-between items-center text-on-surface-variant text-sm font-medium">
              <span>Subtotal</span>
              <span>Rp {subtotal.toLocaleString('id-ID')}</span>
            </div>
            {selectedDiscount && (
              <div className="flex justify-between items-center text-on-surface-variant text-sm font-medium">
                <span>Potongan ({selectedDiscount.name})</span>
                <span className="text-error">- Rp {discountAmount.toLocaleString('id-ID')}</span>
              </div>
            )}
            <div className="flex justify-between items-center text-on-surface-variant text-sm font-medium">
              <span>Pajak (11%)</span>
              <span>Rp {tax.toLocaleString('id-ID')}</span>
            </div>
            <div className="pt-4 border-t border-outline-variant/30 flex justify-between items-center">
              <span className="text-lg font-bold">Grand Total</span>
              <span className="text-2xl font-bold text-primary">Rp {total.toLocaleString('id-ID')}</span>
            </div>
          </div>
        </section>
      </main>

      <div className="fixed bottom-0 left-0 w-full z-50 bg-white border-t border-outline-variant/20 px-4 py-4 shadow-[0_-4px_24px_rgba(0,0,0,0.06)] pb-safe">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-6">
          <div className="hidden sm:block">
            <p className="text-[10px] font-bold text-on-surface-variant uppercase">Total Tagihan</p>
            <p className="text-xl font-bold text-on-surface">Rp {total.toLocaleString('id-ID')}</p>
          </div>
          <button
            onClick={handlePayment}
            disabled={loading}
            className="flex-1 h-14 bg-primary hover:bg-primary-container text-white rounded-2xl flex items-center justify-center gap-2 font-bold transition-all active:scale-[0.98] shadow-lg disabled:opacity-50"
          >
            {loading ? <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <ShoppingCart className="w-6 h-6" />}
            <span>Bayar Sekarang</span>
          </button>
        </div>
      </div>

      {/* Discount Selection Modal */}
      <AnimatePresence>
        {showDiscountModal && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDiscountModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="relative w-full max-w-md bg-surface rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold">Pilih Potongan</h3>
                <button onClick={() => setShowDiscountModal(false)} className="p-2 hover:bg-surface-container-high rounded-full">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                {availableDiscounts.length > 0 ? (
                  availableDiscounts.map(discount => (
                    <button
                      key={discount.id}
                      onClick={() => {
                        setSelectedDiscount(discount);
                        setShowDiscountModal(false);
                      }}
                      className="w-full flex items-center gap-4 p-4 bg-surface-container-low border border-outline-variant/30 rounded-2xl hover:border-primary/50 transition-all text-left"
                    >
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${discount.type === 'percentage' ? 'bg-secondary/10 text-secondary' : 'bg-tertiary/10 text-tertiary'}`}>
                        {discount.type === 'percentage' ? <Percent className="w-6 h-6" /> : <Wallet className="w-6 h-6" />}
                      </div>
                      <div className="flex-1">
                        <p className="font-bold">{discount.name}</p>
                        <p className="text-sm font-black text-primary">
                          {discount.type === 'percentage' ? `${discount.value}%` : `Rp ${discount.value.toLocaleString('id-ID')}`}
                        </p>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="text-center py-10">
                    <p className="text-on-surface-variant font-medium">Belum ada potongan aktif</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
