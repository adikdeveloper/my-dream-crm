'use client';

import { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import api from '../../../lib/api';

const MONTHS_UZ = ['Yan','Fev','Mar','Apr','May','Iyu','Iyu','Avg','Sen','Okt','Noy','Dek'];

const PIE_COLORS = {
  cash:      '#276749',
  card:      '#1e3a6e',
  transfer:  '#8e44ad',
  paid:      '#276749',
  pending:   '#c9a500',
  cancelled: '#c0392b',
};

const TYPE_LABELS   = { cash: 'Naqd', card: 'Karta', transfer: "O'tkazma" };
const STATUS_LABELS = { paid: "To'langan", pending: 'Kutilmoqda', cancelled: 'Bekor' };

function formatSum(v) {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000)     return `${(v / 1_000).toFixed(0)}K`;
  return String(v);
}

function monthShort(val) {
  if (!val) return '';
  const m = parseInt(val.split('-')[1]) - 1;
  return MONTHS_UZ[m];
}

// ── Summary card ──────────────────────────────────────────────────────
function SummaryCard({ icon, label, value, sub, color }) {
  return (
    <div className="report-summary-card">
      <div className="report-summary-icon" style={{ background: color + '18', color }}>
        {icon}
      </div>
      <div>
        <div className="report-summary-value">{value}</div>
        <div className="report-summary-label">{label}</div>
        {sub && <div className="report-summary-sub">{sub}</div>}
      </div>
    </div>
  );
}

// ── Custom tooltip ────────────────────────────────────────────────────
function BarTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip-title">{label}</div>
      <div className="chart-tooltip-row">
        <span>Daromad:</span>
        <strong>{Number(payload[0]?.value || 0).toLocaleString()} so'm</strong>
      </div>
      {payload[1] && (
        <div className="chart-tooltip-row">
          <span>To'lovlar:</span>
          <strong>{payload[1]?.value} ta</strong>
        </div>
      )}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────
export default function ReportsPage() {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [year, setYear]     = useState(new Date().getFullYear());

  useEffect(() => {
    setLoading(true);
    api.get(`/reports?year=${year}`)
      .then((res) => setData(res.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [year]);

  const yearOptions = [2023, 2024, 2025, 2026];

  if (loading || !data) {
    return (
      <div className="page-content">
        <div className="page-header">
          <h1 className="page-title">Hisobotlar</h1>
        </div>
        <div className="table-empty" style={{ background: 'none' }}>
          <div className="loading-spinner" style={{ margin: '0 auto' }} />
        </div>
      </div>
    );
  }

  const { summary, monthlyPayments, paymentTypes, paymentStatuses, studentsByGroup } = data;

  // Bar chart uchun 12 oy skeleti
  const barData = Array.from({ length: 12 }, (_, i) => {
    const key = `${year}-${String(i + 1).padStart(2, '0')}`;
    const found = monthlyPayments.find((m) => m.month === key);
    return { month: MONTHS_UZ[i], total: found?.total || 0, count: found?.count || 0 };
  });

  // Pie chart — to'lov usullari
  const typeData = paymentTypes.map((p) => ({
    name:  TYPE_LABELS[p.type] || p.type,
    value: p.total,
    color: PIE_COLORS[p.type] || '#999',
  }));

  // Pie chart — to'lov holatlari
  const statusData = paymentStatuses.map((p) => ({
    name:  STATUS_LABELS[p.status] || p.status,
    value: p.count,
    color: PIE_COLORS[p.status] || '#999',
  }));

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">Hisobotlar</h1>
          <p className="page-subtitle">Moliyaviy va statistik tahlil</p>
        </div>
        <select className="filter-select" value={year}
          onChange={(e) => setYear(Number(e.target.value))}>
          {yearOptions.map((y) => <option key={y} value={y}>{y}-yil</option>)}
        </select>
      </div>

      {/* ── Summary cards ── */}
      <div className="report-summary-grid">
        <SummaryCard
          icon={<svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>}
          label="Jami o'quvchilar" value={summary.totalStudents}
          sub={`${summary.activeStudents} ta faol`} color="#276749"
        />
        <SummaryCard
          icon={<svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>}
          label="Jami o'qituvchilar" value={summary.totalTeachers}
          sub={`${summary.totalGroups} ta guruh`} color="#1e3a6e"
        />
        <SummaryCard
          icon={<svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></svg>}
          label="Joriy oy daromad" value={`${summary.currentMonthIncome.toLocaleString()} so'm`}
          sub="Faqat to'langan" color="#c9a500"
        />
        <SummaryCard
          icon={<svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>}
          label="Qarzdorlar" value={`${summary.debtorsCount} ta`}
          sub="Joriy oy" color="#c0392b"
        />
        <SummaryCard
          icon={<svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>}
          label={`${year}-yil jami daromad`} value={`${summary.yearTotal.toLocaleString()} so'm`}
          sub="Barcha to'langan" color="#8e44ad"
        />
      </div>

      {/* ── Oylik to'lovlar grafigi ── */}
      <div className="report-card">
        <div className="report-card-header">
          <h3>{year}-yil oylik daromad</h3>
          <span className="report-card-sub">so'mda</span>
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={barData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eef1f7" />
            <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#9aa3b8' }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={formatSum} tick={{ fontSize: 12, fill: '#9aa3b8' }} axisLine={false} tickLine={false} />
            <Tooltip content={<BarTooltip />} />
            <Bar dataKey="total" fill="#1e3a6e" radius={[6, 6, 0, 0]} maxBarSize={42} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ── Pastki 3 ta blok ── */}
      <div className="report-bottom-grid">

        {/* To'lov usullari */}
        <div className="report-card">
          <div className="report-card-header">
            <h3>To'lov usullari</h3>
            <span className="report-card-sub">summasi bo'yicha</span>
          </div>
          {typeData.length === 0 ? (
            <div className="chart-empty">Ma'lumot yo'q</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={typeData} cx="50%" cy="50%" innerRadius={52} outerRadius={80}
                  dataKey="value" paddingAngle={3}>
                  {typeData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Legend iconType="circle" iconSize={10}
                  formatter={(v) => <span style={{ fontSize: 12, color: '#3d4a63' }}>{v}</span>} />
                <Tooltip formatter={(v) => `${Number(v).toLocaleString()} so'm`} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* To'lov holatlari */}
        <div className="report-card">
          <div className="report-card-header">
            <h3>To'lov holatlari</h3>
            <span className="report-card-sub">soni bo'yicha</span>
          </div>
          {statusData.length === 0 ? (
            <div className="chart-empty">Ma'lumot yo'q</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" innerRadius={52} outerRadius={80}
                  dataKey="value" paddingAngle={3}>
                  {statusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Legend iconType="circle" iconSize={10}
                  formatter={(v) => <span style={{ fontSize: 12, color: '#3d4a63' }}>{v}</span>} />
                <Tooltip formatter={(v) => `${v} ta`} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Guruhlar bo'yicha o'quvchilar */}
        <div className="report-card">
          <div className="report-card-header">
            <h3>Guruhlardagi o'quvchilar</h3>
            <span className="report-card-sub">top 8</span>
          </div>
          {studentsByGroup.length === 0 ? (
            <div className="chart-empty">Ma'lumot yo'q</div>
          ) : (
            <div className="group-bar-list">
              {studentsByGroup.map((g, i) => {
                const max = studentsByGroup[0]?.count || 1;
                const pct = Math.round((g.count / max) * 100);
                return (
                  <div key={i} className="group-bar-item">
                    <div className="group-bar-label">
                      <span>{g.name}</span>
                      <span className="group-bar-count">{g.count} ta</span>
                    </div>
                    <div className="group-bar-track">
                      <div className="group-bar-fill" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
