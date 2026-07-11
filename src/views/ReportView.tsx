/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TrendingUp, TrendingDown, FileText, Table, ChevronRight, BarChart3, PieChart as PieChartIcon, LineChart as LineChartIcon } from 'lucide-react';
import { motion } from 'motion/react';
import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, AreaChart, Area } from 'recharts';
import { Transaction, Expense } from '../types';
import { db } from '../lib/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';

export const ReportView = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const qT = query(collection(db, 'transactions'), orderBy('date', 'desc'));
      const qE = query(collection(db, 'expenses'), orderBy('date', 'desc'));
      
      const [snapT, snapE] = await Promise.all([getDocs(qT), getDocs(qE)]);
      
      setTransactions(snapT.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction)));
      setExpenses(snapE.docs.map(doc => ({ id: doc.id, ...doc.data() } as Expense)));
      setLoading(false);
    };
    fetchData();
  }, []);

  const totalRevenue = transactions.reduce((sum, t) => sum + t.total, 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const netProfit = totalRevenue - totalExpenses;

  // Process Daily Sales (Last 7 Days)
  const last7Days = [...Array(7)].map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return {
      date: d.toISOString().split('T')[0],
      dayName: d.toLocaleDateString('id-ID', { weekday: 'short' }),
      value: 0
    };
  }).reverse();

  transactions.forEach(t => {
    if (!t.date) return;
    const dateStr = t.date.toDate().toISOString().split('T')[0];
    const day = last7Days.find(d => d.date === dateStr);
    if (day) day.value += t.total;
  });

  const dailyData = last7Days.map(d => ({ name: d.dayName, value: d.value }));

  // Process Category Distribution
  const categoryMap: Record<string, number> = {};
  transactions.forEach(t => {
    t.items.forEach(item => {
      const cat = item.category || 'Lainnya';
      categoryMap[cat] = (categoryMap[cat] || 0) + (item.price * item.quantity);
    });
  });

  const categoryData = Object.entries(categoryMap).map(([name, value]) => ({ name, value }));
  const totalCatValue = categoryData.reduce((sum, c) => sum + c.value, 0);
  const categoryPercentages = categoryData.map(c => ({
    name: c.name,
    value: totalCatValue > 0 ? Math.round((c.value / totalCatValue) * 100) : 0
  })).sort((a, b) => b.value - a.value).slice(0, 3);

  // Process Monthly Sales (Current Year)
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const monthlyData = months.map(m => ({ name: m, current: 0, last: 0 }));
  
  const currentYear = new Date().getFullYear();
  transactions.forEach(t => {
    if (!t.date) return;
    const date = t.date.toDate();
    if (date.getFullYear() === currentYear) {
      monthlyData[date.getMonth()].current += t.total;
    } else if (date.getFullYear() === currentYear - 1) {
      monthlyData[date.getMonth()].last += t.total;
    }
  });

  const COLORS = ['#16A34A', '#fea619', '#545c72'];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-surface">
        <div className="text-primary font-bold animate-pulse">Memuat Laporan...</div>
      </div>
    );
  }

  return (
    <div className="bg-surface min-h-screen">
      <header className="flex justify-between items-center px-4 py-4 sticky top-0 z-50 bg-surface shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center overflow-hidden">
            <PieChartIcon className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-lg font-bold text-primary">Fattina POS</h1>
        </div>
      </header>

      <main className="px-4 pb-32 pt-6 max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <p className="text-[10px] font-bold text-primary tracking-[0.2em] uppercase mb-1">Analisis Finansial</p>
            <h2 className="text-3xl font-bold text-on-surface">Laporan Keuangan</h2>
          </div>
          <div className="flex gap-2">
            <button className="flex items-center gap-2 px-6 py-2.5 bg-white border border-outline-variant text-primary font-bold text-sm rounded-xl shadow-sm active:scale-95 transition-all">
              Export PDF
            </button>
            <button className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white font-bold text-sm rounded-xl shadow-sm active:scale-95 transition-all">
              Export Excel
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <SummaryCard title="Total Pendapatan" amount={totalRevenue} change="+12.5%" type="up" color="primary" />
          <SummaryCard title="Total Pengeluaran" amount={totalExpenses} change="-2.4%" type="down" color="secondary" />
          <SummaryCard title="Laba Bersih" amount={netProfit} change="+18.2%" type="up" color="primary-container" />
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Daily Sales */}
          <div className="lg:col-span-8 bg-white p-6 rounded-2xl shadow-sm border border-outline-variant/30">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-base font-bold">Penjualan Harian</h3>
              <select className="bg-surface-container-low border-none rounded-lg text-xs font-bold px-3 py-1.5 outline-none">
                <option>7 Hari Terakhir</option>
              </select>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 600, fill: '#64748b' }} dy={10} />
                  <YAxis hide />
                  <Tooltip 
                    cursor={{ fill: '#F8FAFC' }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-on-surface text-white px-3 py-2 rounded-lg shadow-xl text-xs font-bold">
                            Rp {payload[0].value?.toLocaleString('id-ID')}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="value" fill="#16A34A" radius={[8, 8, 8, 8]} barSize={32} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Category Distribution */}
          <div className="lg:col-span-4 bg-white p-6 rounded-2xl shadow-sm border border-outline-variant/30 flex flex-col">
            <h3 className="text-base font-bold mb-6">Kategori Produk Terlaris</h3>
            <div className="flex-grow flex items-center justify-center">
              <div className="w-48 h-48">
                {categoryPercentages.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryPercentages}
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {categoryPercentages.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center text-xs font-semibold text-on-surface-variant italic">Belum ada data</div>
                )}
              </div>
            </div>
            <div className="mt-6 space-y-3">
              {categoryPercentages.map((d, i) => (
                <div key={d.name} className="flex justify-between items-center text-xs font-semibold">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                    <span className="text-on-surface-variant">{d.name}</span>
                  </div>
                  <span className="text-on-surface">{d.value}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Monthly Trend */}
          <div className="lg:col-span-12 bg-white p-6 rounded-2xl shadow-sm border border-outline-variant/30">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-base font-bold">Tren Penjualan Bulanan</h3>
              <div className="flex gap-4">
                <LegendItem color="#16A34A" label="Tahun Ini" />
                <LegendItem color="#bdcaba" label="Tahun Lalu" />
              </div>
            </div>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyData}>
                  <defs>
                    <linearGradient id="colorCurrent" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#16A34A" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#16A34A" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 600, fill: '#64748b' }} dy={10} />
                  <YAxis hide />
                  <Tooltip />
                  <Area type="monotone" dataKey="current" stroke="#16A34A" strokeWidth={3} fillOpacity={1} fill="url(#colorCurrent)" />
                  <Area type="monotone" dataKey="last" stroke="#bdcaba" strokeWidth={2} strokeDasharray="5 5" fill="transparent" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

const SummaryCard = ({ title, amount, change, type, color }: any) => (
  <div className={`bg-white p-6 rounded-2xl shadow-sm border-l-4 border-${color} border border-outline-variant/30`}>
    <div className="flex justify-between items-start mb-4">
      <div className={`p-2 bg-${color}/10 rounded-lg`}>
        {type === 'up' ? <TrendingUp className={`w-5 h-5 text-${color}`} /> : <TrendingDown className={`w-5 h-5 text-${color}`} />}
      </div>
      <span className={`text-[10px] font-bold text-${color}`}>{change}</span>
    </div>
    <p className="text-xs font-semibold text-on-surface-variant mb-1 uppercase tracking-wider">{title}</p>
    <p className="text-xl font-bold text-on-surface">Rp {amount.toLocaleString('id-ID')}</p>
  </div>
);

const LegendItem = ({ color, label }: any) => (
  <div className="flex items-center gap-2">
    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
    <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">{label}</span>
  </div>
);
