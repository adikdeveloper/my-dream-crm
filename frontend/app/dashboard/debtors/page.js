'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../../lib/api';

const MONTHS_UZ = ['Yanvar','Fevral','Mart','Aprel','May','Iyun','Iyul','Avgust','Sentabr','Oktabr','Noyabr','Dekabr'];

function currentMonthValue() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function monthLabel(val) {
  if (!val) return '';
  const [y, m] = val.split('-');
  return `${MONTHS_UZ[parseInt(m) - 1]} ${y}`;
}

// ── To'lov qo'shish tezkor modali ─────────────────────────────────────
function QuickPayModal({ debtor, onClose, onPaid, groups }) {
  const [payType, setPayType] = useState('cash');
  const [amount, setAmount]   = useState(debtor.debt || '');
  const [loading, setLoading] = useState(false);

  const handlePay = async () => {
    if (!amount) return;
    setLoading(true);
    try {
      await api.post('/payments', {
        student:     debtor._id,
        group:       debtor.group._id,
        amount:      Number(amount),
        paymentType: payType,
        month:       debtor.month,
        paidAt:      new Date().toISOString().slice(0, 10),
        status:      'paid',
      });
      onPaid();
    } catch (err) {
      alert(err.response?.data?.message || 'Xatolik');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box modal-box--sm" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>To'lov qabul qilish</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          {/* O'quvchi info */}
          <div className="quick-pay-student">
            <div className="td-avatar td-avatar--teal" style={{ width: 40, height: 40, fontSize: 14 }}>
              {debtor.firstName[0]}{debtor.lastName[0]}
            </div>
            <div>
              <div style={{ fontWeight: 700, color: 'var(--navy)' }}>{debtor.firstName} {debtor.lastName}</div>
              <div style={{ fontSize: 12, color: 'var(--gray-400)' }}>{debtor.group?.name}</div>
            </div>
          </div>

          {/* Summa */}
          <div className="field" style={{ marginTop: 16 }}>
            <label>Summa (so'm)</label>
            <div className="salary-input-wrap">
              <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)}
                min={0} placeholder="500 000"
                style={{ width:'100%', padding:'11px 44px 11px 14px', border:'1.5px solid var(--gray-200)', borderRadius:8, fontSize:14, color:'var(--navy)', background:'var(--gray-50)', outline:'none' }} />
              <span className="salary-suffix">so'm</span>
            </div>
          </div>

          {/* To'lov turi */}
          <div className="field">
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
          <button className="btn-cancel" onClick={onClose}>Bekor qilish</button>
          <button className="btn-save" onClick={handlePay} disabled={loading || !amount}>
            {loading ? 'Saqlanmoqda...' : "✓ To'lovni tasdiqlash"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────
export default function DebtorsPage() {
  const router = useRouter();
  const [debtors, setDebtors]         = useState([]);
  const [totalDebt, setTotalDebt]     = useState(0);
  const [loading, setLoading]         = useState(true);
  const [filterMonth, setFilterMonth] = useState(currentMonthValue());
  const [filterGroup, setFilterGroup] = useState('');
  const [search, setSearch]           = useState('');
  const [groups, setGroups]           = useState([]);
  const [payTarget, setPayTarget]     = useState(null);
  const [toast, setToast]             = useState(null);

  const showToast = (text, type = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchDebtors = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ month: filterMonth });
      if (filterGroup) params.append('group', filterGroup);
      const res = await api.get(`/debtors?${params}`);
      setDebtors(res.data.data);
      setTotalDebt(res.data.totalDebt);
    } catch {
      showToast('Yuklashda xatolik', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    api.get('/groups').then((r) => setGroups(r.data.data));
  }, []);

  useEffect(() => { fetchDebtors(); }, [filterMonth, filterGroup]);

  const filtered = debtors.filter((d) => {
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
    showToast("To'lov muvaffaqiyatli qabul qilindi! ✓");
    fetchDebtors();
  };

  return (
    <div className="page-content">
      {toast && <div className={`toast toast--${toast.type}`}>{toast.text}</div>}

      <div className="page-header">
        <div>
          <h1 className="page-title">Qarzdorlar</h1>
          <p className="page-subtitle">{monthLabel(filterMonth)} · {debtors.length} ta o'quvchi to'lovini kutmoqda</p>
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
            <div className="debtor-stat-value">{totalDebt.toLocaleString()} so'm</div>
          </div>
        </div>
        <div className="debtor-stat debtor-stat--blue">
          <div className="debtor-stat-icon">
            <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
            </svg>
          </div>
          <div>
            <div className="debtor-stat-label">Hisob oyi</div>
            <div className="debtor-stat-value" style={{ fontSize: 15 }}>{monthLabel(filterMonth)}</div>
          </div>
        </div>
      </div>

      {/* Filterlar */}
      <div className="filter-bar">
        <div className="search-box">
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input type="text" placeholder="Ism, telefon yoki guruh..."
            value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        <input type="month" value={filterMonth}
          onChange={(e) => setFilterMonth(e.target.value)}
          className="filter-month" />

        <select className="filter-select" value={filterGroup}
          onChange={(e) => setFilterGroup(e.target.value)}>
          <option value="">Barcha guruhlar</option>
          {groups.map((g) => <option key={g._id} value={g._id}>{g.name}</option>)}
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
              {search || filterGroup
                ? 'Natija topilmadi'
                : `${monthLabel(filterMonth)} oyida barcha o'quvchilar to'lovni amalga oshirgan!`}
            </div>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>O'quvchi</th>
                <th>Telefon</th>
                <th>Ota-ona tel.</th>
                <th>Guruh</th>
                <th>Qarz miqdori</th>
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
                      <span>{d.firstName} {d.lastName}</span>
                    </div>
                  </td>
                  <td className="td-phone">{d.phone}</td>
                  <td className="td-phone">
                    {d.parentPhone && d.parentPhone !== '+998'
                      ? d.parentPhone
                      : <span className="td-empty">—</span>}
                  </td>
                  <td><span className="group-badge">{d.group?.name}</span></td>
                  <td>
                    <span className="debt-amount">
                      {d.debt ? `${Number(d.debt).toLocaleString()} so'm` : '—'}
                    </span>
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
          groups={groups}
        />
      )}
    </div>
  );
}
