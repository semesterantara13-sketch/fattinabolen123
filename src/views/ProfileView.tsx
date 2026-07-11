/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { User, Store, MapPin, Phone, Mail, Lock, LogOut, ChevronRight, Bell, Camera, Edit2, Plus, Trash2, Key, Save, X, Tag, Percent } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import React, { useState, useEffect } from 'react';
import { UserAccount, ShopInfo } from '../types';
import { db } from '../lib/firebase';
import { collection, doc, updateDoc, onSnapshot, addDoc, deleteDoc, query, getDocs, serverTimestamp, setDoc } from 'firebase/firestore';

export const ProfileView = ({ userRole, currentUser, onLogout, onTabChange }: { userRole: string, currentUser: UserAccount | null, onLogout: () => void, onTabChange: (tab: string) => void }) => {
  const [shopInfo, setShopInfo] = useState<ShopInfo | null>(null);
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [isEditingShop, setIsEditingShop] = useState(false);
  const [isManagingUsers, setIsManagingUsers] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  
  // Shop Edit State
  const [editShop, setEditShop] = useState<ShopInfo>({ name: '', address: '', phone: '', logoUrl: '' });
  
  // User Management State
  const [newUser, setNewUser] = useState({ username: '', password: '', role: 'Kasir' as 'Admin' | 'Kasir', name: '' });
  
  // Password Change State
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
  const [passError, setPassError] = useState('');

  useEffect(() => {
    const unsubShop = onSnapshot(doc(db, 'settings', 'shop_info'), (snap) => {
      if (snap.exists()) {
        const data = snap.data() as ShopInfo;
        setShopInfo(data);
        setEditShop(data);
      }
    });

    const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
      const u = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserAccount));
      setUsers(u);
    });

    return () => {
      unsubShop();
      unsubUsers();
    };
  }, []);

  const handleUpdateShop = async () => {
    try {
      const shopRef = doc(db, 'settings', 'shop_info');
      await setDoc(shopRef, {
        ...editShop,
        updatedAt: serverTimestamp()
      }, { merge: true });
      setIsEditingShop(false);
      alert('Informasi toko berhasil disimpan!');
    } catch (err: any) {
      console.error('Update shop error:', err);
      alert('Gagal memperbarui informasi toko: ' + (err.message || 'Error tidak diketahui'));
    }
  };

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
          const MAX_WIDTH = 400;
          const MAX_HEIGHT = 400;

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
        setEditShop({ ...editShop, logoUrl: compressedBase64 });
      } catch (err) {
        console.error('Upload error:', err);
        alert('Gagal memproses gambar. Pastikan file adalah gambar yang valid.');
      }
    }
  };

  const handleAddUser = async () => {
    if (!newUser.username || !newUser.password || !newUser.name) return;
    try {
      await addDoc(collection(db, 'users'), newUser);
      setNewUser({ username: '', password: '', role: 'Kasir', name: '' });
    } catch (err) {
      alert('Gagal menambah pengguna');
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (id === currentUser?.id) {
      alert('Tidak dapat menghapus akun sendiri');
      return;
    }
    if (confirm('Hapus pengguna ini?')) {
      try {
        await deleteDoc(doc(db, 'users', id));
      } catch (err) {
        alert('Gagal menghapus pengguna');
      }
    }
  };

  const handleChangePassword = async () => {
    if (passwords.new !== passwords.confirm) {
      setPassError('Konfirmasi password tidak cocok');
      return;
    }
    if (passwords.current !== currentUser?.password) {
      setPassError('Password saat ini salah');
      return;
    }

    try {
      if (currentUser?.id) {
        await updateDoc(doc(db, 'users', currentUser.id), {
          password: passwords.new
        });
        alert('Password berhasil diubah');
        setIsChangingPassword(false);
        setPasswords({ current: '', new: '', confirm: '' });
        setPassError('');
      }
    } catch (err) {
      setPassError('Gagal mengubah password');
    }
  };

  return (
    <div className="bg-surface min-h-screen">
      <header className="bg-surface shadow-sm sticky top-0 z-50 flex justify-between items-center px-4 py-4 w-full">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center overflow-hidden">
            {shopInfo?.logoUrl ? (
              <img src={shopInfo.logoUrl} alt="Logo" className="w-full h-full object-cover" />
            ) : (
              <Store className="w-6 h-6 text-primary" />
            )}
          </div>
          <h1 className="text-lg font-bold text-primary">{shopInfo?.name || 'Fattina Bolen'}</h1>
        </div>
        <button onClick={onLogout} className="text-error p-2 hover:bg-error/10 rounded-full transition-colors">
          <LogOut className="w-6 h-6" />
        </button>
      </header>

      <main className="px-4 mt-8 max-w-2xl mx-auto pb-32 space-y-8">
        <section className="flex flex-col items-center mb-10">
          <div className="relative mb-4">
            <div className="w-24 h-24 rounded-full border-4 border-surface-container shadow-lg overflow-hidden flex items-center justify-center bg-surface-container-high">
              {shopInfo?.logoUrl ? (
                <img src={shopInfo.logoUrl} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <User className="w-12 h-12 text-primary" />
              )}
            </div>
            {userRole === 'Admin' && (
              <button onClick={() => setIsEditingShop(true)} className="absolute bottom-0 right-0 bg-primary text-white w-8 h-8 rounded-full flex items-center justify-center shadow-md border-2 border-white active:scale-90 transition-transform">
                <Camera className="w-4 h-4" />
              </button>
            )}
          </div>
          <h2 className="text-xl font-bold text-on-surface">{shopInfo?.name || 'Fattina Bolen'}</h2>
          <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-widest mt-1">{currentUser?.name} • {userRole}</p>
        </section>

        <div className="space-y-6">
          {/* Shop Information Section */}
          <section className="bg-surface-container-lowest rounded-3xl p-6 border border-outline-variant/30 shadow-sm relative overflow-hidden">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold text-primary uppercase tracking-widest">Informasi Toko</h3>
              {userRole === 'Admin' && !isEditingShop && (
                <button onClick={() => setIsEditingShop(true)} className="text-primary p-2 hover:bg-primary/10 rounded-full transition-colors">
                  <Edit2 className="w-4 h-4" />
                </button>
              )}
            </div>
            
            {isEditingShop ? (
              <div className="space-y-4">
                <div className="flex flex-col items-center gap-4 mb-4">
                  <div className="w-24 h-24 rounded-2xl bg-surface-container-low border-2 border-dashed border-outline-variant flex items-center justify-center overflow-hidden relative group">
                    {editShop.logoUrl ? (
                      <img src={editShop.logoUrl} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <Camera className="w-8 h-8 text-outline" />
                    )}
                    <label htmlFor="shop-logo-upload" className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 sm:group-hover:opacity-100 transition-opacity cursor-pointer">
                      <span className="text-[10px] text-white font-bold uppercase">Upload</span>
                    </label>
                    {/* On mobile, show a small edit icon if no hover */}
                    <div className="absolute bottom-1 right-1 bg-primary text-white p-1 rounded-md sm:hidden">
                      <Camera className="w-3 h-3" />
                    </div>
                    <input 
                      id="shop-logo-upload"
                      type="file" 
                      accept="image/*" 
                      onChange={handleFileUpload} 
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                    />
                  </div>
                  <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Ketuk gambar untuk ganti logo</p>
                </div>
                <input placeholder="Nama Toko" value={editShop.name} onChange={e => setEditShop({...editShop, name: e.target.value})} className="w-full px-4 py-3 bg-surface-container-low rounded-xl outline-none font-semibold text-sm" />
                <input placeholder="Alamat" value={editShop.address} onChange={e => setEditShop({...editShop, address: e.target.value})} className="w-full px-4 py-3 bg-surface-container-low rounded-xl outline-none font-semibold text-sm" />
                <input placeholder="Telepon" value={editShop.phone} onChange={e => setEditShop({...editShop, phone: e.target.value})} className="w-full px-4 py-3 bg-surface-container-low rounded-xl outline-none font-semibold text-sm" />
                <input placeholder="URL Logo (Opsional)" value={editShop.logoUrl} onChange={e => setEditShop({...editShop, logoUrl: e.target.value})} className="w-full px-4 py-3 bg-surface-container-low rounded-xl outline-none font-semibold text-sm" />
                <div className="flex gap-2">
                  <button onClick={handleUpdateShop} className="flex-1 bg-primary text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2">
                    <Save className="w-4 h-4" /> Simpan
                  </button>
                  <button onClick={() => setIsEditingShop(false)} className="px-6 bg-surface-container-high text-on-surface-variant py-3 rounded-xl font-bold text-sm">
                    Batal
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <ProfileItem icon={Store} label="Nama Toko" value={shopInfo?.name || '-'} />
                <ProfileItem icon={MapPin} label="Alamat" value={shopInfo?.address || '-'} />
                <ProfileItem icon={Phone} label="Nomor Telepon" value={shopInfo?.phone || '-'} />
              </div>
            )}
          </section>

          {/* User Management Section (Admin Only) */}
          {userRole === 'Admin' && (
            <section className="bg-surface-container-lowest rounded-3xl p-6 border border-outline-variant/30 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold text-primary uppercase tracking-widest">Manajemen Pengguna</h3>
                <button onClick={() => setIsManagingUsers(!isManagingUsers)} className="text-primary p-2 hover:bg-primary/10 rounded-full transition-colors">
                  {isManagingUsers ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                </button>
              </div>

              {isManagingUsers && (
                <div className="mb-6 p-4 bg-surface-container-low rounded-2xl space-y-3">
                  <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Tambah Staff Baru</p>
                  <input placeholder="Nama Lengkap" value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} className="w-full px-4 py-2 bg-white rounded-lg outline-none text-sm" />
                  <div className="grid grid-cols-2 gap-2">
                    <input placeholder="Username" value={newUser.username} onChange={e => setNewUser({...newUser, username: e.target.value})} className="px-4 py-2 bg-white rounded-lg outline-none text-sm" />
                    <input type="password" placeholder="Password" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} className="px-4 py-2 bg-white rounded-lg outline-none text-sm" />
                  </div>
                  <select value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value as any})} className="w-full px-4 py-2 bg-white rounded-lg outline-none text-sm">
                    <option value="Kasir">Kasir</option>
                    <option value="Admin">Admin</option>
                  </select>
                  <button onClick={handleAddUser} className="w-full bg-primary text-white py-2 rounded-lg font-bold text-sm">Tambah</button>
                </div>
              )}

              <div className="space-y-2">
                {users.map(u => (
                  <div key={u.id} className="flex items-center justify-between p-3 hover:bg-surface-container-low rounded-xl transition-colors group">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-primary font-bold">
                        {u.name[0]}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-on-surface">{u.name}</p>
                        <p className="text-[10px] font-semibold text-on-surface-variant uppercase">{u.role} • @{u.username}</p>
                      </div>
                    </div>
                    {currentUser?.id !== u.id && (
                      <button onClick={() => u.id && handleDeleteUser(u.id)} className="p-2 text-outline hover:text-error transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Category Management Shortcut (Admin Only) */}
          {userRole === 'Admin' && (
            <section className="bg-surface-container-lowest rounded-3xl p-6 border border-outline-variant/30 shadow-sm">
              <h3 className="text-sm font-bold text-primary uppercase tracking-widest mb-4">Pengaturan Produk</h3>
              <button onClick={() => onTabChange('category')} className="w-full flex items-center justify-between p-4 bg-surface-container-low rounded-2xl active:scale-[0.98] transition-transform">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                    <Tag className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold">Manajemen Kategori</p>
                    <p className="text-[10px] text-on-surface-variant font-semibold">Tambah, edit, dan hapus kategori produk</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-outline" />
              </button>

              <button onClick={() => onTabChange('discount')} className="w-full flex items-center justify-between p-4 bg-surface-container-low rounded-2xl active:scale-[0.98] transition-transform mt-2">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                    <Percent className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold">Manajemen Potongan</p>
                    <p className="text-[10px] text-on-surface-variant font-semibold">Atur diskon dan potongan harga transaksi</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-outline" />
              </button>
            </section>
          )}

          {/* Account Security */}
          <section className="bg-surface-container-lowest rounded-3xl p-6 border border-outline-variant/30 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold text-primary uppercase tracking-widest">Keamanan Akun</h3>
            </div>
            
            {!isChangingPassword ? (
              <button onClick={() => setIsChangingPassword(true)} className="w-full flex items-center justify-between p-4 bg-surface-container-low rounded-2xl active:scale-[0.98] transition-transform">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                    <Key className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold">Ganti Password</p>
                    <p className="text-[10px] text-on-surface-variant font-semibold">Ubah password akses masuk Anda</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-outline" />
              </button>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <input type="password" placeholder="Password Saat Ini" value={passwords.current} onChange={e => setPasswords({...passwords, current: e.target.value})} className="w-full px-4 py-3 bg-surface-container-low rounded-xl outline-none font-semibold text-sm" />
                  <input type="password" placeholder="Password Baru" value={passwords.new} onChange={e => setPasswords({...passwords, new: e.target.value})} className="w-full px-4 py-3 bg-surface-container-low rounded-xl outline-none font-semibold text-sm" />
                  <input type="password" placeholder="Konfirmasi Password Baru" value={passwords.confirm} onChange={e => setPasswords({...passwords, confirm: e.target.value})} className="w-full px-4 py-3 bg-surface-container-low rounded-xl outline-none font-semibold text-sm" />
                </div>
                {passError && <p className="text-error text-[10px] font-bold text-center">{passError}</p>}
                <div className="flex gap-2">
                  <button onClick={handleChangePassword} className="flex-1 bg-primary text-white py-3 rounded-xl font-bold text-sm">Update Password</button>
                  <button onClick={() => setIsChangingPassword(false)} className="px-6 bg-surface-container-high text-on-surface-variant py-3 rounded-xl font-bold text-sm">Batal</button>
                </div>
              </div>
            )}
          </section>

          <button onClick={onLogout} className="w-full bg-error-container text-on-error-container flex items-center justify-center gap-3 py-5 rounded-3xl font-bold active:scale-[0.98] transition-transform duration-150 shadow-sm">
            <LogOut className="w-5 h-5" />
            <span>Keluar dari Aplikasi</span>
          </button>
          
          <p className="text-center text-[10px] font-bold text-outline py-4 uppercase tracking-[0.2em]">Fattina Bolen v2.4.1 (Stable)</p>
        </div>
      </main>
    </div>
  );
};

const ProfileItem = ({ icon: Icon, label, value }: { icon: any, label: string, value: string }) => (
  <div className="flex items-center p-4 hover:bg-surface-container-low transition-colors group cursor-pointer rounded-xl">
    <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-primary">
      <Icon className="w-5 h-5" />
    </div>
    <div className="ml-4 flex-1">
      <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">{label}</p>
      <p className="text-sm font-bold text-on-surface leading-snug">{value}</p>
    </div>
    <ChevronRight className="w-5 h-5 text-outline" />
  </div>
);
