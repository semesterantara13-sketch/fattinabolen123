/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CheckCircle2, Wallet, QrCode, Printer, Send, Plus, ShoppingBag, Bell, ArrowLeft, MessageCircle, Bluetooth, Usb } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect } from 'react';
import { Transaction, ShopInfo } from '../types';
import { db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import EscPosEncoder from 'esc-pos-encoder';

export const ReceiptView = ({ transactionId, onNewTransaction }: { transactionId: string, onNewTransaction: () => void }) => {
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [shopInfo, setShopInfo] = useState<ShopInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPrinterMenu, setShowPrinterMenu] = useState(false);
  const [printing, setPrinting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const transRef = doc(db, 'transactions', transactionId);
        const transSnap = await getDoc(transRef);
        
        if (transSnap.exists()) {
          setTransaction({ id: transSnap.id, ...transSnap.data() } as Transaction);
        }

        const shopRef = doc(db, 'settings', 'shopInfo');
        const shopSnap = await getDoc(shopRef);
        if (shopSnap.exists()) {
          setShopInfo(shopSnap.data() as ShopInfo);
        }
      } catch (err) {
        console.error('Error fetching receipt data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [transactionId]);

  const generateEscPosBuffer = () => {
    if (!transaction) return null;

    const encoder = new EscPosEncoder();
    let result = encoder
      .initialize()
      .codepage('cp850')
      .align('center')
      .line(shopInfo?.name?.toUpperCase() || 'FATTINA BOLEN')
      .line(shopInfo?.address || '')
      .line(`Telp: ${shopInfo?.phone || '-'}`)
      .line('--------------------------------')
      .align('left')
      .line(`Inv: #${transaction.invoiceNumber}`)
      .line(`Tgl: ${transaction.date?.toDate().toLocaleDateString('id-ID')} ${transaction.date?.toDate().toLocaleTimeString('id-ID')}`)
      .line('--------------------------------');

    transaction.items.forEach(item => {
      result = result
        .line(item.name)
        .line(`${item.quantity} x ${item.price.toLocaleString('id-ID')} = ${(item.price * item.quantity).toLocaleString('id-ID')}`);
    });

    result = result
      .line('--------------------------------')
      .align('right')
      .line(`Subtotal: ${transaction.subtotal.toLocaleString('id-ID')}`);

    if (transaction.discount > 0) {
      result = result.line(`Diskon: -${transaction.discount.toLocaleString('id-ID')}`);
    }

    result = result
      .line(`Pajak: ${transaction.tax.toLocaleString('id-ID')}`)
      .bold(true)
      .line(`TOTAL: Rp ${transaction.total.toLocaleString('id-ID')}`)
      .bold(false)
      .line('--------------------------------')
      .align('center')
      .line(`Metode: ${transaction.paymentMethod}`)
      .newline()
      .line('Terima kasih atas kunjungan Anda!')
      .newline()
      .newline()
      .cut();

    return result.encode();
  };

  const handleBluetoothPrint = async () => {
    if (!transaction) return;
    setPrinting(true);
    try {
      const device = await (navigator as any).bluetooth.requestDevice({
        filters: [{ services: ['000018f0-0000-1000-8000-00805f9b34fb'] }],
        optionalServices: ['000018f0-0000-1000-8000-00805f9b34fb']
      });

      const server = await device.gatt?.connect();
      const service = await server?.getPrimaryService('000018f0-0000-1000-8000-00805f9b34fb');
      const characteristics = await service?.getCharacteristics();
      const characteristic = characteristics?.find((c: any) => c.properties.write || c.properties.writeWithoutResponse);

      if (!characteristic) throw new Error('Printer characteristic not found');

      const buffer = generateEscPosBuffer();
      if (buffer) {
        // Chunk size for BLE is usually small
        const chunkSize = 20;
        for (let i = 0; i < buffer.length; i += chunkSize) {
          await characteristic.writeValue(buffer.slice(i, i + chunkSize));
        }
      }
      alert('Berhasil mengirim data ke printer Bluetooth');
    } catch (err) {
      console.error('Bluetooth Print Error:', err);
      alert('Gagal mencetak via Bluetooth: ' + (err as Error).message);
    } finally {
      setPrinting(false);
      setShowPrinterMenu(false);
    }
  };

  const handleUsbPrint = async () => {
    if (!transaction) return;
    setPrinting(true);
    try {
      const device = await (navigator as any).usb.requestDevice({ filters: [] });
      await device.open();
      if (device.configuration === null) await device.selectConfiguration(1);
      await device.claimInterface(0);

      const buffer = generateEscPosBuffer();
      if (buffer) {
        await device.transferOut(1, buffer);
      }
      alert('Berhasil mengirim data ke printer USB');
    } catch (err) {
      console.error('USB Print Error:', err);
      alert('Gagal mencetak via USB: ' + (err as Error).message);
    } finally {
      setPrinting(false);
      setShowPrinterMenu(false);
    }
  };

  const handleSystemPrint = () => {
    window.print();
    setShowPrinterMenu(false);
  };

  const handleWhatsApp = () => {
    if (!transaction) return;

    const phoneNumber = prompt('Masukkan nomor WhatsApp tujuan (contoh: 628123456789):', '62');
    if (!phoneNumber) return;

    let message = `*STRUK PEMBAYARAN - ${shopInfo?.name || 'Fattina Bolen'}*\n`;
    message += `--------------------------------\n`;
    message += `Inv: #${transaction.invoiceNumber}\n`;
    message += `Tgl: ${transaction.date?.toDate().toLocaleDateString('id-ID')} ${transaction.date?.toDate().toLocaleTimeString('id-ID')}\n`;
    message += `--------------------------------\n`;
    
    transaction.items.forEach(item => {
      message += `${item.name}\n`;
      message += `${item.quantity} x Rp ${item.price.toLocaleString('id-ID')} = Rp ${(item.price * item.quantity).toLocaleString('id-ID')}\n`;
    });
    
    message += `--------------------------------\n`;
    message += `Subtotal: Rp ${transaction.subtotal.toLocaleString('id-ID')}\n`;
    if (transaction.discount > 0) {
      message += `Potongan: -Rp ${transaction.discount.toLocaleString('id-ID')}\n`;
    }
    message += `Pajak: Rp ${transaction.tax.toLocaleString('id-ID')}\n`;
    message += `*TOTAL: Rp ${transaction.total.toLocaleString('id-ID')}*\n`;
    message += `--------------------------------\n`;
    message += `Metode: ${transaction.paymentMethod}\n`;
    message += `\nTerima kasih atas kunjungan Anda!`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${phoneNumber.replace(/\+/g, '').replace(/\s/g, '')}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-surface">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  );

  if (!transaction) return (
    <div className="min-h-screen flex items-center justify-center bg-surface">
      <div className="text-center">
        <p className="text-on-surface-variant font-bold">Transaksi tidak ditemukan</p>
        <button onClick={onNewTransaction} className="mt-4 text-primary font-bold">Kembali ke Beranda</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-surface flex flex-col print:bg-white">
      {/* Print Specific Styles for 58mm */}
      <style>{`
        @media print {
          @page {
            size: 58mm auto;
            margin: 0;
          }
          body {
            width: 58mm;
            margin: 0;
            padding: 0;
            background: white;
          }
          body * { visibility: hidden; }
          #receipt-content, #receipt-content * { visibility: visible; }
          #receipt-content { 
            position: absolute; 
            left: 0; 
            top: 0; 
            width: 58mm; 
            padding: 4mm; 
            margin: 0;
            box-shadow: none;
            border: none;
            font-size: 10pt;
          }
          #receipt-content img {
            max-width: 30mm;
          }
          .no-print { display: none !important; }
        }
      `}</style>

      <header className="flex justify-between items-center px-4 py-4 sticky top-0 z-50 bg-surface/80 backdrop-blur-xl shadow-sm no-print">
        <div className="flex items-center gap-3">
          <button onClick={onNewTransaction} className="w-10 h-10 rounded-full hover:bg-surface-container-low flex items-center justify-center transition-colors">
            <ArrowLeft className="w-6 h-6 text-primary" />
          </button>
          <h1 className="text-lg font-bold text-primary">Detail Transaksi</h1>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowPrinterMenu(true)} className="p-2 bg-primary/10 text-primary rounded-xl hover:bg-primary/20 transition-colors">
            <Printer className="w-5 h-5" />
          </button>
          <button onClick={handleWhatsApp} className="p-2 bg-primary/10 text-primary rounded-xl hover:bg-primary/20 transition-colors">
            <MessageCircle className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="flex-grow container mx-auto px-4 py-8 flex flex-col items-center max-w-md pb-40">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex flex-col items-center mb-8 no-print"
        >
          <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mb-4 shadow-lg shadow-success/10">
            <CheckCircle2 className="w-12 h-12 text-success" />
          </div>
          <h2 className="text-2xl font-bold text-center text-on-surface">Pembayaran Berhasil</h2>
          <p className="text-sm text-on-surface-variant text-center mt-1">
            {transaction.date?.toDate().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })} • {transaction.date?.toDate().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
          </p>
        </motion.div>

        {/* Receipt Card */}
        <div id="receipt-content" className="w-full bg-white rounded-3xl shadow-xl shadow-on-surface/5 p-8 relative mb-8 overflow-hidden border border-outline-variant/30">
          <div className="flex flex-col items-center mb-6 text-center">
            {shopInfo?.logoUrl ? (
              <img src={shopInfo.logoUrl} alt="Logo" className="w-16 h-16 object-contain mb-4 filter grayscale contrast-125" />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                <ShoppingBag className="w-8 h-8 text-primary" />
              </div>
            )}
            <h3 className="text-xl font-black text-on-surface uppercase">{shopInfo?.name || 'FATTINA POS'}</h3>
            <p className="text-[10px] font-bold text-on-surface-variant max-w-[200px] mt-1 leading-relaxed">
              {shopInfo?.address || 'Alamat Toko Belum Diatur'}
            </p>
            <p className="text-[10px] font-bold text-on-surface-variant mt-1">
              Telp: {shopInfo?.phone || '-'}
            </p>
          </div>

          <div className="flex flex-col items-center border-y border-dashed border-outline-variant/50 py-4 mb-6">
            <p className="text-[10px] font-bold text-outline uppercase tracking-[0.2em]">#{transaction.invoiceNumber}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[10px] font-black text-on-surface uppercase bg-surface-container-low px-2 py-0.5 rounded">
                METODE: {transaction.paymentMethod}
              </span>
            </div>
          </div>

          <div className="space-y-4">
            {transaction.items.map((item, idx) => (
              <div key={idx} className="flex justify-between items-start gap-4">
                <div className="flex flex-col flex-1">
                  <span className="text-sm font-bold text-on-surface leading-tight">{item.name}</span>
                  <span className="text-[10px] font-bold text-on-surface-variant uppercase mt-0.5">
                    {item.quantity} x {item.price.toLocaleString('id-ID')}
                  </span>
                </div>
                <span className="text-sm font-bold text-on-surface shrink-0">
                  {(item.price * item.quantity).toLocaleString('id-ID')}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-8 pt-6 border-t border-dashed border-outline-variant/50 space-y-2">
            <div className="flex justify-between text-on-surface-variant text-xs font-bold">
              <span>Subtotal</span>
              <span>{transaction.subtotal.toLocaleString('id-ID')}</span>
            </div>
            
            {transaction.discount > 0 && (
              <div className="flex justify-between text-error text-xs font-bold">
                <span>Potongan {transaction.discountDetails ? `(${transaction.discountDetails.name})` : ''}</span>
                <span>- {transaction.discount.toLocaleString('id-ID')}</span>
              </div>
            )}
            
            <div className="flex justify-between text-on-surface-variant text-xs font-bold">
              <span>Pajak</span>
              <span>{transaction.tax.toLocaleString('id-ID')}</span>
            </div>
            
            <div className="flex justify-between items-center pt-4 border-t border-dashed border-outline-variant/30">
              <span className="text-lg font-black text-on-surface uppercase">Total</span>
              <span className="text-2xl font-black text-primary">Rp {transaction.total.toLocaleString('id-ID')}</span>
            </div>
          </div>

          <div className="mt-10 flex flex-col items-center">
            <div className="w-24 h-24 p-2 border-2 border-outline-variant/20 rounded-2xl opacity-80">
              <QrCode className="w-full h-full text-on-surface-variant" />
            </div>
            <p className="text-[10px] font-black text-on-surface-variant mt-6 uppercase tracking-widest text-center">
              Terima Kasih Atas Kunjungan Anda<br/>Semoga Hari Anda Menyenangkan
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="w-full space-y-4 px-2 no-print">
          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={() => setShowPrinterMenu(true)}
              className="flex flex-col items-center justify-center gap-2 bg-surface-container-low text-primary font-bold py-5 rounded-3xl border border-outline-variant/30 hover:border-primary/30 transition-all active:scale-[0.98] group"
            >
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Printer className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest">Cetak Struk</span>
            </button>
            <button 
              onClick={handleWhatsApp}
              className="flex flex-col items-center justify-center gap-2 bg-surface-container-low text-primary font-bold py-5 rounded-3xl border border-outline-variant/30 hover:border-primary/30 transition-all active:scale-[0.98] group"
            >
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <MessageCircle className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest">Kirim WA</span>
            </button>
          </div>
          <button 
            onClick={onNewTransaction}
            className="w-full flex items-center justify-center gap-3 bg-primary text-on-primary font-black py-5 rounded-3xl shadow-xl shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-0.5 active:translate-y-0 transition-all"
          >
            <Plus className="w-6 h-6" />
            <span className="text-base uppercase tracking-widest">Transaksi Baru</span>
          </button>
        </div>
      </main>

      {/* Printer Selection Modal */}
      <AnimatePresence>
        {showPrinterMenu && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPrinterMenu(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] no-print"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 bg-surface rounded-t-[32px] p-8 z-[101] no-print shadow-2xl"
            >
              <div className="w-12 h-1.5 bg-outline-variant/30 rounded-full mx-auto mb-8" />
              <h3 className="text-xl font-black text-on-surface mb-6 text-center">Pilih Metode Cetak</h3>
              
              <div className="grid grid-cols-1 gap-4 mb-8">
                <button
                  onClick={handleBluetoothPrint}
                  disabled={printing}
                  className="flex items-center gap-4 p-5 bg-surface-container-low rounded-2xl border border-outline-variant/30 hover:border-primary transition-all group"
                >
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                    <Bluetooth className="w-6 h-6" />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-on-surface">Cetak via Bluetooth</p>
                    <p className="text-xs text-on-surface-variant font-medium">Hubungkan ke printer Bluetooth (58mm)</p>
                  </div>
                </button>

                <button
                  onClick={handleUsbPrint}
                  disabled={printing}
                  className="flex items-center gap-4 p-5 bg-surface-container-low rounded-2xl border border-outline-variant/30 hover:border-primary transition-all group"
                >
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                    <Usb className="w-6 h-6" />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-on-surface">Cetak via Kabel USB</p>
                    <p className="text-xs text-on-surface-variant font-medium">Gunakan kabel data USB OTG</p>
                  </div>
                </button>

                <button
                  onClick={handleSystemPrint}
                  disabled={printing}
                  className="flex items-center gap-4 p-5 bg-surface-container-low rounded-2xl border border-outline-variant/30 hover:border-primary transition-all group"
                >
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                    <Printer className="w-6 h-6" />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-on-surface">Cetak Sistem Browser</p>
                    <p className="text-xs text-on-surface-variant font-medium">Gunakan dialog cetak bawaan browser</p>
                  </div>
                </button>
              </div>

              <button
                onClick={() => setShowPrinterMenu(false)}
                className="w-full py-4 text-on-surface-variant font-black uppercase tracking-widest text-sm hover:text-on-surface transition-colors"
              >
                Batal
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Printing Loading Overlay */}
      <AnimatePresence>
        {printing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-md z-[200] flex flex-col items-center justify-center no-print text-white"
          >
            <div className="w-20 h-20 relative mb-6">
              <div className="absolute inset-0 border-4 border-white/20 rounded-full" />
              <div className="absolute inset-0 border-4 border-white border-t-transparent rounded-full animate-spin" />
            </div>
            <p className="text-xl font-black uppercase tracking-widest">Sedang Mencetak...</p>
            <p className="text-sm opacity-60 mt-2 font-medium">Jangan putus koneksi printer Anda</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

