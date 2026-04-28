'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import api from '../../lib/api';

const MONTHS_UZ = ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'Iyun', 'Iyul', 'Avg', 'Sen', 'Okt', 'Noy', 'Dek'];

const PAYMENT_TYPE_META = {
  cash: { label: 'Naqd', color: '#1e3a6e' },
  card: { label: 'Karta', color: '#2a4f96' },
  transfer: { label: "O'tkazma", color: '#f5c518' },
};

const STATUS_META = {
  paid: { label: "To'langan", color: '#276749' },
  partial: { label: 'Qisman', color: '#d97706' },
  pending: { label: 'Kutilmoqda', color: '#b45309' },
  cancelled: { label: 'Bekor', color: '#dc2626' },
};

function formatCurrency(value) {
  return `${Number(value || 0).toLocaleString('uz-UZ')} so'm`;
}

function formatCompact(value) {
  const amount = Number(value || 0);
  if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)}M`;
  if (amount >= 1000) return `${Math.round(amount / 1000)}K`;
  return String(amount);
}

function monthLabel(value) {
  if (!value) return '';
  const [year, month] = value.split('-');
  const monthIndex = Number(month) - 1;
  return `${MONTHS_UZ[monthIndex] || month} ${year}`;
}

function percent(value, total) {
  if (!total) return 0;
  return Math.round((Number(value || 0) / Number(total)) * 100);
}

function TrendTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="db-tooltip">
      <div className="db-tooltip-title">{label}</div>
      <div className="db-tooltip-row">
        <span>Tushum</span>
        <strong>{formatCurrency(payload[0]?.value || 0)}</strong>
      </div>
      <div className="db-tooltip-row">
        <span>To'lovlar</span>
        <strong>{payload[1]?.value || 0} ta</strong>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    api.get(`/reports?year=${year}`)
      .then((res) => { if (!cancelled) setReport(res.data.data); })
      .catch((err) => { if (!cancelled) setError(err.response?.data?.message || "Xatolik yuz berdi"); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [year, refreshKey]);

  const yearOptions = Array.from({ length: 4 }, (_, i) => currentYear - i);

  const summary = report?.summary || {
    totalStudents: 0, activeStudents: 0, totalTeachers: 0,
    totalGroups: 0, debtorsCount: 0, currentMonthIncome: 0,
    yearTotal: 0, currentMonth: '',
  };

  const monthlySeries = Array.from({ length: 12 }, (_, i) => {
    const key = `${year}-${String(i + 1).padStart(2, '0')}`;
    const found = report?.monthlyPayments?.find((m) => m.month === key);
    return { key, label: MONTHS_UZ[i], income: found?.total || 0, count: found?.count || 0 };
  });

  let peakMonth = monthlySeries[0];
  monthlySeries.forEach((m) => { if (m.income > peakMonth.income) peakMonth = m; });

  const inactiveStudents = Math.max(0, summary.totalStudents - summary.activeStudents);
  const debtFreeStudents = Math.max(0, summary.activeStudents - summary.debtorsCount);
  const collectionRate = summary.activeStudents
    ? Math.round((debtFreeStudents / summary.activeStudents) * 100) : 0;

  const completedMonths = year === currentYear ? new Date().getMonth() + 1 : 12;
  const averageIncome = completedMonths ? Math.round(summary.yearTotal / completedMonths) : 0;

  const paymentTypeData = (report?.paymentTypes || [])
    .map((item) => ({
      key: item.type,
      label: PAYMENT_TYPE_META[item.type]?.label || item.type,
      color: PAYMENT_TYPE_META[item.type]?.color || '#64748b',
      value: item.total,
      count: item.count,
    }))
    .filter((item) => item.value > 0)
    .sort((a, b) => b.value - a.value);

  const totalPaymentTypeVolume = paymentTypeData.reduce((s, i) => s + i.value, 0);

  const totalStatusCount = (report?.paymentStatuses || []).reduce((s, i) => s + i.count, 0);
  const paymentStatusData = Object.entries(STATUS_META).map(([key, meta]) => {
    const found = report?.paymentStatuses?.find((i) => i.status === key);
    const count = found?.count || 0;
    return { key, label: meta.label, color: meta.color, count, share: percent(count, totalStatusCount) };
  });

  const topGroups = report?.studentsByGroup || [];

  const kpiCards = [
    {
      icon: (
        <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
      label: "O'quvchilar",
      value: summary.totalStudents,
      sub: `${summary.activeStudents} faol`,
      color: 'blue',
    },
    {
      icon: (
        <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <rect x="2" y="5" width="20" height="14" rx="2" /><path d="M2 10h20" />
        </svg>
      ),
      label: "To'lov intizomi",
      value: `${collectionRate}%`,
      sub: summary.debtorsCount > 0 ? `${summary.debtorsCount} ta qarzdor` : "Qarzdor yo'q",
      color: 'emerald',
    },
    {
      icon: (
        <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c3 3 9 3 12 0v-5" />
        </svg>
      ),
      label: "O'qituvchilar",
      value: summary.totalTeachers,
      sub: `${summary.totalGroups} ta guruh`,
      color: 'amber',
    },
    {
      icon: (
        <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      ),
      label: "Oylik tushum",
      value: formatCompact(summary.currentMonthIncome),
      sub: formatCurrency(summary.currentMonthIncome),
      color: 'violet',
    },
  ];

  if (!report && loading) {
    return (
      <div className="db-page">
        <div className="db-topbar">
          <div>
            <h1 className="db-title">Dashboard</h1>
            <p className="db-subtitle">O'quv markazi boshqaruv paneli</p>
          </div>
        </div>
        <div className="db-kpi-row">
          {[1, 2, 3, 4].map(i => <div key={i} className="db-skeleton db-skeleton--card" />)}
        </div>
        <div className="db-grid-2">
          <div className="db-skeleton db-skeleton--chart" />
          <div className="db-skeleton db-skeleton--chart" />
        </div>
      </div>
    );
  }

  if (!report && !loading && error) {
    return (
      <div className="db-page">
        <div className="db-topbar">
          <h1 className="db-title">Dashboard</h1>
        </div>
        <div className="db-error-box">
          <p>{error}</p>
          <button type="button" className="btn-save" onClick={() => setRefreshKey(v => v + 1)}>
            Qayta urinish
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="db-page">
      {/* Topbar */}
      <div className="db-topbar">
        <div>
          <h1 className="db-title">Dashboard</h1>
          <p className="db-subtitle">
            {monthLabel(summary.currentMonth) || `${year}-yil`} • O'quv markazi boshqaruv paneli
          </p>
        </div>
        <div className="db-controls">
          <select
            className="filter-select"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
          >
            {yearOptions.map(y => <option key={y} value={y}>{y}-yil</option>)}
          </select>
          <Link href="/dashboard/reports" className="btn-save" style={{ textDecoration: 'none', padding: '9px 18px', fontSize: '13px' }}>
            Hisobot
          </Link>
        </div>
      </div>

      {error && (
        <div className="db-alert db-alert--error">
          {error}
          <button type="button" onClick={() => setRefreshKey(v => v + 1)}>Qayta yuklash</button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="db-kpi-row">
        {kpiCards.map((card) => (
          <div key={card.label} className={`db-kpi db-kpi--${card.color}`}>
            <div className={`db-kpi-icon db-kpi-icon--${card.color}`}>{card.icon}</div>
            <div className="db-kpi-body">
              <div className="db-kpi-value">{card.value}</div>
              <div className="db-kpi-label">{card.label}</div>
              <div className="db-kpi-sub">{card.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="db-grid-2">
        {/* Income trend chart */}
        <div className="db-card">
          <div className="db-card-head">
            <div>
              <div className="db-card-title">{year}-yil daromad oqimi</div>
              <div className="db-card-sub">Oylik tushum va to'lovlar soni</div>
            </div>
            <div className="db-chip">{formatCompact(summary.yearTotal)}</div>
          </div>
          <div className="db-chart-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlySeries} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <defs>
                  <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#1e3a6e" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#1e3a6e" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef1f7" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9aa3b8' }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={formatCompact} tick={{ fontSize: 11, fill: '#9aa3b8' }} axisLine={false} tickLine={false} />
                <Tooltip content={<TrendTooltip />} />
                <Area type="monotone" dataKey="income" stroke="#1e3a6e" strokeWidth={2.5} fill="url(#incomeGrad)" />
                <Area type="monotone" dataKey="count" stroke="#f5c518" strokeWidth={2} fill="transparent" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="db-mini-stats">
            <div className="db-mini-stat">
              <span>Yillik jami</span>
              <strong>{formatCurrency(summary.yearTotal)}</strong>
            </div>
            <div className="db-mini-stat">
              <span>Eng yuqori oy</span>
              <strong>{peakMonth?.label || '-'}</strong>
            </div>
            <div className="db-mini-stat">
              <span>O'rtacha oylik</span>
              <strong>{formatCurrency(averageIncome)}</strong>
            </div>
          </div>
        </div>

        {/* Payment types */}
        <div className="db-card">
          <div className="db-card-head">
            <div>
              <div className="db-card-title">To'lov kanallari</div>
              <div className="db-card-sub">Qaysi kanal asosiy ulushni beradi</div>
            </div>
          </div>
          {paymentTypeData.length === 0 ? (
            <div className="db-empty">Bu period uchun to'lov ma'lumoti topilmadi.</div>
          ) : (
            <div className="db-payment-layout">
              <div className="db-donut-wrap">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={paymentTypeData} dataKey="value" innerRadius={54} outerRadius={80} paddingAngle={3}>
                      {paymentTypeData.map((item) => (
                        <Cell key={item.key} fill={item.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => formatCurrency(v)} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="db-donut-center">
                  <span>Jami</span>
                  <strong>{formatCompact(totalPaymentTypeVolume)}</strong>
                </div>
              </div>
              <div className="db-pay-list">
                {paymentTypeData.map((item) => (
                  <div key={item.key} className="db-pay-row">
                    <span className="db-pay-dot" style={{ background: item.color }} />
                    <div className="db-pay-info">
                      <div className="db-pay-head">
                        <strong>{item.label}</strong>
                        <span>{percent(item.value, totalPaymentTypeVolume)}%</span>
                      </div>
                      <div className="db-pay-track">
                        <div className="db-pay-fill" style={{
                          width: `${Math.max(8, percent(item.value, totalPaymentTypeVolume))}%`,
                          background: item.color,
                        }} />
                      </div>
                    </div>
                    <div className="db-pay-amount">
                      <strong>{formatCompact(item.value)}</strong>
                      <span>{item.count} ta</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom row */}
      <div className="db-grid-3">
        {/* Groups */}
        <div className="db-card">
          <div className="db-card-head">
            <div className="db-card-title">Guruhlar yuklamasi</div>
            <Link href="/dashboard/groups" className="db-link">Ko'rish</Link>
          </div>
          {topGroups.length === 0 ? (
            <div className="db-empty">Guruhlar bo'yicha ma'lumot yo'q.</div>
          ) : (
            <div className="db-group-list">
              {topGroups.map((item) => {
                const w = percent(item.count, topGroups[0]?.count || 1);
                return (
                  <div key={item.name} className="db-group-item">
                    <div className="db-group-head">
                      <strong>{item.name}</strong>
                      <span>{item.count} ta</span>
                    </div>
                    <div className="db-bar-track">
                      <div className="db-bar-fill" style={{ width: `${Math.max(10, w)}%` }} />
                    </div>
                    <div className="db-group-sub">{item.subject || "Fan ko'rsatilmagan"}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Payment statuses */}
        <div className="db-card">
          <div className="db-card-head">
            <div className="db-card-title">To'lov statuslari</div>
          </div>
          <div className="db-status-list">
            {paymentStatusData.map((item) => (
              <div key={item.key} className="db-status-row">
                <div className="db-status-head">
                  <div className="db-status-label">
                    <span className="db-status-dot" style={{ background: item.color }} />
                    <strong>{item.label}</strong>
                  </div>
                  <span className="db-status-count">{item.count} ta</span>
                </div>
                <div className="db-bar-track">
                  <div className="db-bar-fill" style={{
                    width: `${Math.max(item.count ? 8 : 0, item.share)}%`,
                    background: item.color,
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick nav */}
        <div className="db-card">
          <div className="db-card-head">
            <div className="db-card-title">Tezkor o'tish</div>
          </div>
          <div className="db-quick-grid">
            {[
              {
                href: '/dashboard/students', label: "O'quvchilar", color: 'blue',
                icon: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></svg>
              },
              {
                href: '/dashboard/payments', label: "To'lovlar", color: 'emerald',
                icon: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="2" y="5" width="20" height="14" rx="2" /><path d="M2 10h20" /></svg>
              },
              {
                href: '/dashboard/teachers', label: "O'qituvchilar", color: 'amber',
                icon: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M22 10v6M2 10l10-5 10 5-10 5z" /></svg>
              },
              {
                href: '/dashboard/groups', label: 'Guruhlar', color: 'navy',
                icon: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 7h18M3 12h18M3 17h18" /></svg>
              },
              {
                href: '/dashboard/debtors', label: 'Qarzdorlar', color: 'red',
                icon: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path d="M12 8v4l3 3" /></svg>
              },
              {
                href: '/dashboard/reports', label: 'Hisobotlar', color: 'violet',
                icon: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 20V10M12 20V4M6 20v-6" /></svg>
              },
            ].map((item) => (
              <Link key={item.href} href={item.href} className={`db-quick-item db-quick-item--${item.color}`}>
                <div className="db-quick-icon">{item.icon}</div>
                <span>{item.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
