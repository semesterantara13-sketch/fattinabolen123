/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ArrowLeft, Camera, Plus, Minus, Save, Lightbulb, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import React, { useState, useEffect } from 'react';
import { Product, Category } from '../types';
import { db } from '../lib/firebase';
import { collection, addDoc, updateDoc, doc, serverTimestamp, getDocs, query, orderBy } from 'firebase/firestore';

export const ProductFormView = ({ product, onBack }: { product?: Product, onBack: () => void }) => {
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [formData, setFormData] = useState({
    name: product?.name || '',
    category: product?.category || '',
    price: product?.price || 0,
    cost: product?.cost || 0,
    stock: product?.stock || 0,
    minStock: product?.minStock || 5,
    image: product?.image || 'https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=400&auto=format&fit=crop',
    description: product?.description || '',
    sku: product?.sku || '',
    isActive: product?.isActive ?? true
  });

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const q = query(collection(db, 'categories'), orderBy('name', 'asc'));
        const snapshot = await getDocs(q);
        const cats = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Category[];
        setCategories(cats);
        
        if (!product && cats.length > 0 && !formData.category) {
          setFormData(prev => ({ ...prev, category: cats[0].name }));
        }
      } catch (err) {
        console.error('Error fetching categories:', err);
      }
    };
    fetchCategories();
  }, [product]);

  // Image Compression Utility
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const MAX_WIDTH = 500;
          const MAX_HEIGHT = 500;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.6)); // Compress to 60% quality
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressedBase64 = await compressImage(file);
        setFormData({ ...formData, image: compressedBase64 });
      } catch (err) {
        console.error('Upload error:', err);
        alert('Gagal memproses gambar. Pastikan file adalah gambar yang valid.');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (product?.id) {
        await updateDoc(doc(db, 'products', product.id), {
          ...formData,
          updatedAt: serverTimestamp()
        });
      } else {
        await addDoc(collection(db, 'products'), {
          ...formData,
          createdAt: serverTimestamp()
        });
      }
      onBack();
    } catch (err) {
      console.error(err);
      alert('Gagal menyimpan produk');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface">
      <header className="bg-surface shadow-sm sticky top-0 z-50 flex justify-between items-center px-4 py-4 w-full">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="text-on-surface-variant active:scale-95 transition-all">
            <ArrowLeft className="w-6 h-6 text-primary" />
          </button>
          <h1 className="text-xl font-bold text-primary">{product ? 'Edit Produk' : 'Tambah Produk'}</h1>
        </div>
        <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center overflow-hidden">
          <div className="w-full h-full bg-primary flex items-center justify-center text-white font-bold">F</div>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 py-6 space-y-6 pb-32">
        <section className="space-y-2">
          <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Foto Produk</label>
          <div className="relative w-full aspect-video rounded-2xl overflow-hidden border-2 border-dashed border-outline-variant bg-surface-container-low group cursor-pointer transition-colors hover:border-primary">
            <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/20 flex flex-col items-center justify-center space-y-2 opacity-0 group-hover:opacity-100 sm:group-hover:opacity-100 transition-opacity">
              <Camera className="w-10 h-10 text-white" />
              <p className="text-xs text-white font-bold">Ganti Foto Produk</p>
            </div>
            {/* Mobile indicator */}
            <div className="absolute bottom-4 right-4 bg-primary text-white p-2 rounded-xl sm:hidden">
              <Camera className="w-5 h-5" />
            </div>
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleFileUpload} 
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
            />
          </div>
        </section>

        <form className="space-y-6" id="productForm" onSubmit={handleSubmit}>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-on-surface-variant">Nama Produk</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Contoh: Kopi Susu Gula Aren"
              className="w-full bg-surface-container-low border-none rounded-2xl px-4 py-3 text-on-surface focus:ring-2 focus:ring-primary/20 outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-on-surface-variant">Kategori</label>
            <select
              required
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full bg-surface-container-low border-none rounded-2xl px-4 py-3 text-on-surface focus:ring-2 focus:ring-primary/20 outline-none appearance-none"
            >
              <option value="" disabled>Pilih Kategori</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.name}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-on-surface-variant">Harga Jual</label>
              <div className="relative flex items-center">
                <span className="absolute left-4 font-bold text-primary">Rp</span>
                <input
                  type="number"
                  required
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                  className="w-full bg-surface-container-low border-none rounded-2xl pl-12 pr-4 py-3 font-bold text-primary focus:ring-2 focus:ring-primary/20 outline-none"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-on-surface-variant">Harga Modal</label>
              <div className="relative flex items-center">
                <span className="absolute left-4 font-bold text-on-surface-variant">Rp</span>
                <input
                  type="number"
                  value={formData.cost}
                  onChange={(e) => setFormData({ ...formData, cost: Number(e.target.value) })}
                  className="w-full bg-surface-container-low border-none rounded-2xl pl-12 pr-4 py-3 font-bold text-on-surface focus:ring-2 focus:ring-primary/20 outline-none"
                />
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-on-surface-variant">Jumlah Stok</label>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, stock: Math.max(0, formData.stock - 1) })}
                className="w-14 h-14 rounded-2xl bg-surface-container-high flex items-center justify-center text-on-surface active:scale-90 transition-transform"
              >
                <Minus className="w-6 h-6" />
              </button>
              <input
                type="number"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
                className="flex-1 text-center bg-surface-container-low border-none rounded-2xl py-4 font-bold text-xl text-on-surface focus:ring-2 focus:ring-primary/20 outline-none"
              />
              <button
                type="button"
                onClick={() => setFormData({ ...formData, stock: formData.stock + 1 })}
                className="w-14 h-14 rounded-2xl bg-primary-container/20 flex items-center justify-center text-primary active:scale-90 transition-transform"
              >
                <Plus className="w-6 h-6" />
              </button>
            </div>
          </div>
        </form>

        <div className="bg-white rounded-2xl p-4 flex items-start gap-4 border border-outline-variant/30 shadow-sm">
          <div className="bg-secondary-container/20 p-2 rounded-lg">
            <Lightbulb className="w-5 h-5 text-secondary" />
          </div>
          <div>
            <p className="text-sm font-bold text-secondary">Tips</p>
            <p className="text-xs text-on-surface-variant leading-relaxed">Gunakan foto dengan latar belakang putih agar produk terlihat lebih premium di katalog aplikasi.</p>
          </div>
        </div>
      </main>

      <div className="fixed bottom-0 left-0 w-full bg-white/80 backdrop-blur-md p-4 pb-safe z-40 border-t border-outline-variant/20">
        <button
          type="submit"
          form="productForm"
          disabled={loading}
          className="w-full bg-primary hover:bg-primary-container text-white font-bold py-4 rounded-2xl shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading ? <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save className="w-6 h-6" />}
          <span>{product ? 'Simpan Perubahan' : 'Simpan Produk'}</span>
        </button>
      </div>
    </div>
  );
};
