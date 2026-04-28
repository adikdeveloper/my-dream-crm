'use client';

import { useState, useEffect, useCallback } from 'react';
import api from '../../../lib/api';

const MONTHS_UZ = ['Yanvar','Fevral','Mart','Aprel','May','Iyun',
                   'Iyul','Avgust','Sentabr','Oktabr','Noyabr','Dekabr'];

function monthLabel(val) {
  if (!val) return '';
  const [y, m] = val.split('-');
  return `${MONTHS_UZ[parseInt(m) - 1]} ${y}`;
}

// min — qarzdor oylar soni filtri (0 = hammasi)
const PERIODS = [
  { value: 'all', label: 'Barchasi',       min: 0 },
  { value: '1',   label: '1 oydan beri',   min: 1 },
  { value: '3',   label: '3 oydan beri',   min: 3 },
  { value: '6',   label: '6 oydan beri',   min: 6 },
];

// ── To'lov modali ─────────────────────────────────────────────────────
function QuickPayModal({ debtor, onClose, onPaid }) {
  const [checked, setChecked]  = useState({});   // { [month]: bool }
  const [amounts, setAmounts]  = useState({});   // { [month]: number }
  const [payType, setPayType]  = useState('cash');
  const [loading, setLoading]  = useState(false);
  const [errors, setErrors]    = useState({});

  useEffect(() => {
    const initChecked = {};
    const initAmounts = {};
    debtor.months.forEach((row) => {
      initChecked[row.month] = true;
      initAmounts[row.month] = row.debt;
    });
    setChecked(initChecked);
    setAmounts(initAmounts);
  }, [debtor]);

  const toggleCheck = (month, debt) => {
    setChecked((prev) => {
      const next = { ...prev, [month]: !prev[month] };
      // belgilansa — to'liq qarz; olib tashlansa — 0
      setAmounts((a) => ({ ...a, [month]: next[month] ? debt : 0 }));
      setErrors((e) => ({ ...e, [month]: '' }));
      return next;
    });
  };

  const setAmount = (month, val) => {
    setAmounts((prev) => ({ ...prev, [month]: val }));
    setErrors((prev) => ({ ...prev, [month]: '' }));
  };

  const totalEntered = debtor.months.reduce(
    (s, row) => s + (checked[row.month] ? (Number(amounts[row.month]) || 0) : 0), 0
  );

  const handlePay = async () => {
    const newErrors = {};
    let hasAny = false;
    debtor.months.forEach((row) => {
      if (!checked[row.month]) return;
      const v = Number(amounts[row.month]) || 0;
      if (v <= 0) { newErrors[row.month] = 'Summa kiriting'; return; }
      if (v > row.debt) { newErrors[row.month] = `Max: ${row.debt.toLocaleString('uz-UZ')}`; return; }
      hasAny = true;
    });
    if (Object.keys(newErrors).length) { setErrors(newErrors); return; }
    if (!hasAny) { setErrors({ _global: 'Kamida bitta oyni belgilang' }); return; }

    setLoading(true);
    try {
      await Promise.all(
        debtor.months
          .filter((row) => checked[row.month] && Number(amounts[row.month]) > 0)
          .map((row) =>
            api.post('/payments', {
              student:     debtor._id,
              group:       debtor.group._id,
              amount:      Number(amounts[row.month]),
              paymentType: payType,
              month:       row.month,
              paidAt:      new Date().toISOString().slice(0, 10),
            })
          )
      );
      onPaid();
    } catch (err) {
      setErrors({ _global: err.response?.data?.message || 'Xatolik yuz berdi' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box modal-box--pay" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3>To'lov qabul qilish</h3>
            <p style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 2 }}>
              {debtor.firstName} {debtor.lastName} · {debtor.group?.name}
            </p>
          </div>
          <button className="modal-close" onClick={onClose} disabled={loading}>✕</button>
        </div>

        <div className="modal-body" style={{ padding: '12px 20px' }}>

          {/* O'quvchi info */}
          <div className="quick-pay-student" style={{ marginBottom: 14 }}>
            <div className="td-avatar td-avatar--teal" style={{ width: 40, height: 40, fontSize: 14 }}>
              {debtor.firstName[0]}{debtor.lastName[0]}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, color: 'var(--navy)' }}>{debtor.firstName} {debtor.lastName}</div>
              <div style={{ fontSize: 12, color: 'var(--gray-400)' }}>{debtor.phone}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>Jami qarz</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#c0392b' }}>
                {debtor.totalDebt.toLocaleString('uz-UZ')} so'm
              </div>
            </div>
          </div>

          {/* Oylar jadvali */}
          <div className="pay-months-list">
            <div className="pay-months-header">
              <span style={{ gridColumn: 'span 1' }}></span>
              <span>Oy</span>
              <span>Qarz</span>
              <span>To'lov summasi</span>
            </div>
            {debtor.months.map((row) => {
              const isChecked = !!checked[row.month];
              const v         = Number(amounts[row.month]) || 0;
              const isPartial = isChecked && v > 0 && v < row.debt;
              return (
                <div
                  key={row.month}
                  className={`pay-month-row${!isChecked ? ' pay-month-row--off' : ''}`}
                  onClick={() => toggleCheck(row.month, row.debt)}
                >
                  {/* Checkbox */}
                  <div className="pay-month-check">
                    <div className={`pay-checkbox${isChecked ? ' pay-checkbox--on' : ''}`}>
                      {isChecked && (
                        <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      )}
                    </div>
                  </div>

                  {/* Oy nomi */}
                  <div className="pay-month-name">
                    <span>{monthLabel(row.month)}</span>
                    {row.isProRata && <span className="prorata-badge">Pro-rata</span>}
                  </div>

                  {/* Qarz */}
                  <div style={{ fontSize: 13, color: isChecked ? '#c0392b' : 'var(--gray-400)', fontWeight: 600 }}>
                    {row.debt.toLocaleString('uz-UZ')}
                  </div>

                  {/* Input */}
                  <div className="pay-month-input-wrap" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="number"
                      className={`pay-month-input${errors[row.month] ? ' err' : ''}`}
                      value={isChecked ? (amounts[row.month] ?? '') : ''}
                      onChange={(e) => setAmount(row.month, e.target.value)}
                      disabled={!isChecked}
                      min={0}
                      max={row.debt}
                      placeholder="0"
                    />
                    {isPartial && <span className="pay-month-partial">qisman</span>}
                    {errors[row.month] && <span className="field-err" style={{ fontSize: 10 }}>{errors[row.month]}</span>}
                  </div>
                </div>
              );
            })}
          </div>

          {errors._global && (
            <div style={{ color: '#c0392b', fontSize: 12, marginTop: 4, fontWeight: 600 }}>
              {errors._global}
            </div>
          )}

          {totalEntered > 0 && (
            <div className="pay-total-row">
              <span>Jami to'lov:</span>
              <span>{totalEntered.toLocaleString('uz-UZ')} so'm</span>
            </div>
          )}

          {/* To'lov turi */}
          <div className="field" style={{ marginTop: 12, marginBottom: 0 }}>
            <label>To'lov turi</label>
            <div className="pay-type-row">
              {[['cash','💵 Naqd'],['card','💳 Karta'],['transfer',"🏦 O'tkazma"]].map(([val, lbl]) => (
                <button key={val} type="button"
                  className={`pay-type-btn${payType === val ? ' active' : ''}`}
                  onClick={() => setPayType(val)}>
                  {lbl}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-cancel" onClick={onClose} disabled={loading}>Bekor qilish</button>
          <button className="btn-save" onClick={handlePay} disabled={loading || totalEntered === 0}>
            {loading ? 'Saqlanmoqda…' : `✓ To'lash (${totalEntered.toLocaleString('uz-UZ')} so'm)`}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────
export default function DebtorsPage() {
  const [debtors, setDebtors]         = useState([]);
  const [totalDebt, setTotalDebt]     = useState(0);
  const [loading, setLoading]         = useState(true);
  const [period, setPeriod]           = useState('all');
  const [filterGroup, setFilterGroup] = useState('');
  const [search, setSearch]           = useState('');
  const [groups, setGroups]           = useState([]);
  const [payTarget, setPayTarget]     = useState(null);
  const [toast, setToast]             = useState(null);

  const showToast = useCallback((text, type = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const fetchDebtors = useCallback(async () => {
    setLoading(true);
    try {
      // Backend har doim barcha oylarni qaytaradi; filtrlash frontendda
      const params = new URLSearchParams({ period: 'all' });
      if (filterGroup) params.append('group', filterGroup);
      const res = await api.get(`/debtors?${params}`);
      setDebtors(res.data.data);
      setTotalDebt(res.data.totalDebt);
    } catch {
      showToast('Yuklashda xatolik', 'error');
    } finally {
      setLoading(false);
    }
  }, [filterGroup, showToast]);

  useEffect(() => {
    api.get('/groups').then((r) => setGroups(r.data.data));
  }, []);

  useEffect(() => { fetchDebtors(); }, [fetchDebtors]);

  const currentPeriod = PERIODS.find((p) => p.value === period) || PERIODS[0];

  const filtered = debtors.filter((d) => {
    if (currentPeriod.min > 0 && d.months.length < currentPeriod.min) return false;
    const q = search.toLowerCase();
    return (
      d.firstName.toLowerCase().includes(q) ||
      d.lastName.toLowerCase().includes(q)  ||
      d.phone.includes(q)                   ||
      (d.group?.name || '').toLowerCase().includes(q)
    );
  });

  const handlePaid = () => {
    setPayTarget(null);
    showToast("To'lov muvaffaqiyatli qabul qilindi ✓");
    fetchDebtors();
  };

  const periodLabel = currentPeriod.label;

  return (
    <div className="page-content">
      {toast && <div className={`toast toast--${toast.type}`}>{toast.text}</div>}

      <div className="page-header">
        <div>
          <h1 className="page-title">Qarzdorlar</h1>
          <p className="page-subtitle">
            {periodLabel} · {filtered.length} ta o'quvchi · Jami: {totalDebt.toLocaleString('uz-UZ')} so'm
          </p>
        </div>
      </div>

      {/* Statistika */}
      <div className="debtor-stats">
        <div className="debtor-stat debtor-stat--red">
          <div className="debtor-stat-icon">
            <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/>
            </svg>
          </div>
          <div>
            <div className="debtor-stat-label">Qarzdorlar soni</div>
            <div className="debtor-stat-value">{debtors.length} ta</div>
          </div>
        </div>
        <div className="debtor-stat debtor-stat--orange">
          <div className="debtor-stat-icon">
            <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/>
            </svg>
          </div>
          <div>
            <div className="debtor-stat-label">Umumiy qarz</div>
            <div className="debtor-stat-value">{totalDebt.toLocaleString('uz-UZ')} so'm</div>
          </div>
        </div>
        <div className="debtor-stat debtor-stat--blue">
          <div className="debtor-stat-icon">
            <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </div>
          <div>
            <div className="debtor-stat-label">Oylar soni</div>
            <div className="debtor-stat-value">{currentPeriod.min === 0 ? 'Barchasi' : `${currentPeriod.min}+`}</div>
          </div>
        </div>
      </div>

      {/* Period filter + qidiruv */}
      <div className="filter-bar">
        <div className="search-box">
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input type="text" placeholder="Ism, telefon yoki guruh..."
            value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        <select className="filter-select" value={filterGroup}
          onChange={(e) => setFilterGroup(e.target.value)}>
          <option value="">Barcha guruhlar</option>
          {groups.map((g) => <option key={g._id} value={g._id}>{g.name}</option>)}
        </select>

        <select
          className="filter-select"
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
        >
          {PERIODS.map((p) => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </select>
      </div>

      {/* Jadval */}
      <div className="table-card">
        {loading ? (
          <div className="table-empty"><div className="loading-spinner" style={{ margin: '0 auto' }} /></div>
        ) : filtered.length === 0 ? (
          <div className="table-empty">
            <div className="table-empty-icon">🎉</div>
            <div className="table-empty-text">
              {search || filterGroup ? 'Natija topilmadi' : `${periodLabel} ichida hamma to'lovlar amalga oshirilgan!`}
            </div>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>O'quvchi</th>
                <th>Guruh</th>
                <th>Qarzdor oylar</th>
                <th>Jami qarz</th>
                <th>Amal</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((d, i) => (
                <tr key={d._id} className="debtor-row">
                  <td className="td-num">{i + 1}</td>
                  <td>
                    <div className="td-user">
                      <div className="td-avatar td-avatar--red">
                        {d.firstName[0]}{d.lastName[0]}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600 }}>{d.firstName} {d.lastName}</div>
                        <div style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 1 }}>{d.phone}</div>
                      </div>
                    </div>
                  </td>
                  <td><span className="group-badge">{d.group?.name}</span></td>
                  <td>
                    <div className="debt-months-summary">
                      <span className="debt-months-count">{d.months.length} ta oy</span>
                      {d.months.length === 1 ? (
                        <span className="debt-months-range">{monthLabel(d.months[0].month)}</span>
                      ) : (
                        <span className="debt-months-range">
                          {monthLabel(d.months[0].month)} – {monthLabel(d.months[d.months.length - 1].month)}
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    <div>
                      <span className="debt-amount">{d.totalDebt.toLocaleString('uz-UZ')} so'm</span>
                      {d.totalPaid > 0 && (
                        <div style={{ fontSize: 11, color: '#276749', marginTop: 2 }}>
                          To'langan: {d.totalPaid.toLocaleString('uz-UZ')}
                        </div>
                      )}
                    </div>
                  </td>
                  <td>
                    <button className="btn-pay" onClick={() => setPayTarget(d)}>
                      <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                      To'lash
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {payTarget && (
        <QuickPayModal
          debtor={payTarget}
          onClose={() => setPayTarget(null)}
          onPaid={handlePaid}
        />
      )}
    </div>
  );
}
