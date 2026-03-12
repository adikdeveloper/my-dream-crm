'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import api from '../../../lib/api';

const MONTHS_UZ = ['Yanvar','Fevral','Mart','Aprel','May','Iyun','Iyul','Avgust','Sentabr','Oktabr','Noyabr','Dekabr'];

const PAYMENT_TYPES = {
  cash:     { label: 'Naqd',      color: '#276749', bg: '#d4edda' },
  card:     { label: 'Karta',     color: '#1a5276', bg: '#d6eaf8' },
  transfer: { label: "O'tkazma",  color: '#7d3c98', bg: '#e8d5f5' },
};

const STATUS_MAP = {
  paid:      { label: "To'langan",    color: '#276749', bg: '#d4edda' },
  pending:   { label: 'Kutilmoqda',   color: '#c9a500', bg: '#fff8e1' },
  cancelled: { label: 'Bekor qilindi',color: '#c0392b', bg: '#fdecea' },
};

function currentMonthValue() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function monthLabel(val) {
  if (!val) return '';
  const [y, m] = val.split('-');
  return `${MONTHS_UZ[parseInt(m) - 1]} ${y}`;
}

// ── Modal ─────────────────────────────────────────────────────────────
function PaymentModal({ open, onClose, onSave, editData, students, groups }) {
  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm();
  const selectedGroup = watch('group');

  useEffect(() => {
    if (!open) return;
    if (editData) {
      reset({
        student:     editData.student?._id || '',
        group:       editData.group?._id   || '',
        amount:      editData.amount,
        paymentType: editData.paymentType,
        month:       editData.month,
        paidAt:      editData.paidAt ? editData.paidAt.slice(0, 10) : new Date().toISOString().slice(0, 10),
        note:        editData.note || '',
        status:      editData.status,
      });
    } else {
      reset({
        student: '', group: '', amount: '', paymentType: 'cash',
        month: currentMonthValue(),
        paidAt: new Date().toISOString().slice(0, 10),
        note: '', status: 'paid',
      });
    }
  }, [open, editData]);

  // Guruh tanlanganda narxini avtomatik to'ldirish
  useEffect(() => {
    if (!selectedGroup || editData) return;
    const g = groups.find((g) => g._id === selectedGroup);
    if (g?.price) setValue('amount', g.price);
  }, [selectedGroup]);

  if (!open) return null;

  // Guruhga ko'ra o'quvchilarni filter qilish
  const filteredStudents = selectedGroup
    ? students.filter((s) => s.group?._id === selectedGroup || s.group === selectedGroup)
    : students;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{editData ? "To'lovni tahrirlash" : "Yangi to'lov qo'shish"}</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit(onSave)}>
          <div className="modal-body">

            {/* Guruh */}
            <div className="field">
              <label>Guruh</label>
              <select className={errors.group ? 'err' : ''} {...register('group', { required: 'Majburiy' })}>
                <option value="">— Guruh tanlang —</option>
                {groups.map((g) => <option key={g._id} value={g._id}>{g.name} ({g.subject})</option>)}
              </select>
              {errors.group && <span className="field-err">{errors.group.message}</span>}
            </div>

            {/* O'quvchi */}
            <div className="field">
              <label>O'quvchi</label>
              <select className={errors.student ? 'err' : ''} {...register('student', { required: 'Majburiy' })}>
                <option value="">— O'quvchi tanlang —</option>
                {filteredStudents.map((s) => (
                  <option key={s._id} value={s._id}>{s.firstName} {s.lastName}</option>
                ))}
              </select>
              {errors.student && <span className="field-err">{errors.student.message}</span>}
            </div>

            {/* Summa + To'lov turi */}
            <div className="modal-row">
              <div className="field">
                <label>Summa (so'm)</label>
                <div className="salary-input-wrap">
                  <input type="number" placeholder="500 000" min={0}
                    className={errors.amount ? 'err' : ''}
                    {...register('amount', { required: 'Majburiy', min: { value: 1, message: "0 dan katta bo'lsin" } })} />
                  <span className="salary-suffix">so'm</span>
                </div>
                {errors.amount && <span className="field-err">{errors.amount.message}</span>}
              </div>
              <div className="field">
                <label>To'lov turi</label>
                <select {...register('paymentType')}>
                  <option value="cash">💵 Naqd</option>
                  <option value="card">💳 Karta</option>
                  <option value="transfer">🏦 O'tkazma</option>
                </select>
              </div>
            </div>

            {/* Oy + Sana */}
            <div className="modal-row">
              <div className="field">
                <label>To'lov oyi</label>
                <input type="month" {...register('month', { required: 'Majburiy' })}
                  className={errors.month ? 'err' : ''}
                  style={{ width:'100%', padding:'11px 14px', border:'1.5px solid var(--gray-200)', borderRadius:8, fontSize:14, color:'var(--navy)', background:'var(--gray-50)', outline:'none' }} />
                {errors.month && <span className="field-err">{errors.month.message}</span>}
              </div>
              <div className="field">
                <label>To'lov sanasi</label>
                <input type="date" {...register('paidAt')}
                  style={{ width:'100%', padding:'11px 14px', border:'1.5px solid var(--gray-200)', borderRadius:8, fontSize:14, color:'var(--navy)', background:'var(--gray-50)', outline:'none' }} />
              </div>
            </div>

            {/* Status + Izoh */}
            <div className="modal-row">
              <div className="field">
                <label>Status</label>
                <select {...register('status')}>
                  <option value="paid">✅ To'langan</option>
                  <option value="pending">⏳ Kutilmoqda</option>
                  <option value="cancelled">❌ Bekor qilindi</option>
                </select>
              </div>
              <div className="field">
                <label>Izoh (ixtiyoriy)</label>
                <input type="text" placeholder="Qisqacha izoh..." {...register('note')} />
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-cancel" onClick={onClose}>Bekor qilish</button>
            <button type="submit" className="btn-save">{editData ? 'Saqlash' : "Qo'shish"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Delete Confirm ─────────────────────────────────────────────────────
function DeleteModal({ onConfirm, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box modal-box--sm" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>O'chirishni tasdiqlash</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <p className="delete-text">Bu to'lovni o'chirishni tasdiqlaysizmi?</p>
        </div>
        <div className="modal-footer">
          <button className="btn-cancel" onClick={onClose}>Bekor qilish</button>
          <button className="btn-delete" onClick={onConfirm}>Ha, o'chirish</button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────
export default function PaymentsPage() {
  const [payments, setPayments]         = useState([]);
  const [students, setStudents]         = useState([]);
  const [groups, setGroups]             = useState([]);
  const [loading, setLoading]           = useState(true);
  const [totalAmount, setTotalAmount]   = useState(0);

  const [filterMonth, setFilterMonth]   = useState(currentMonthValue());
  const [filterGroup, setFilterGroup]   = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [search, setSearch]             = useState('');

  const [modalOpen, setModalOpen]       = useState(false);
  const [editData, setEditData]         = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [toast, setToast]               = useState(null);

  const showToast = (text, type = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchPayments = async () => {
    try {
      const params = new URLSearchParams();
      if (filterMonth)  params.append('month',  filterMonth);
      if (filterGroup)  params.append('group',  filterGroup);
      if (filterStatus) params.append('status', filterStatus);

      const res = await api.get(`/payments?${params}`);
      setPayments(res.data.data);
      setTotalAmount(res.data.totalAmount);
    } catch {
      showToast("Yuklashda xatolik", 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchMeta = async () => {
    const [sRes, gRes] = await Promise.all([api.get('/students'), api.get('/groups')]);
    setStudents(sRes.data.data);
    setGroups(gRes.data.data);
  };

  useEffect(() => { fetchMeta(); }, []);
  useEffect(() => { fetchPayments(); }, [filterMonth, filterGroup, filterStatus]);

  const handleSave = async (data) => {
    try {
      const payload = { ...data, amount: Number(data.amount) };
      if (editData) {
        await api.put(`/payments/${editData._id}`, payload);
        showToast("To'lov yangilandi");
      } else {
        await api.post('/payments', payload);
        showToast("To'lov qo'shildi");
      }
      setModalOpen(false);
      fetchPayments();
    } catch (err) {
      showToast(err.response?.data?.message || 'Xatolik yuz berdi', 'error');
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/payments/${deleteTarget}`);
      showToast("To'lov o'chirildi");
      setDeleteTarget(null);
      fetchPayments();
    } catch {
      showToast("O'chirishda xatolik", 'error');
    }
  };

  const filtered = payments.filter((p) => {
    const q = search.toLowerCase();
    return (
      `${p.student?.firstName} ${p.student?.lastName}`.toLowerCase().includes(q) ||
      p.group?.name.toLowerCase().includes(q)
    );
  });

  const paidCount    = payments.filter((p) => p.status === 'paid').length;
  const pendingCount = payments.filter((p) => p.status === 'pending').length;

  return (
    <div className="page-content">
      {toast && <div className={`toast toast--${toast.type}`}>{toast.text}</div>}

      <div className="page-header">
        <div>
          <h1 className="page-title">To'lovlar</h1>
          <p className="page-subtitle">{monthLabel(filterMonth)} · Jami: {payments.length} ta</p>
        </div>
        <button className="btn-add" onClick={() => { setEditData(null); setModalOpen(true); }}>
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          To'lov qo'shish
        </button>
      </div>

      {/* Statistika kartochalari */}
      <div className="payment-stats">
        <div className="payment-stat payment-stat--green">
          <div className="payment-stat-label">Jami tushum</div>
          <div className="payment-stat-value">{totalAmount.toLocaleString()} so'm</div>
        </div>
        <div className="payment-stat payment-stat--blue">
          <div className="payment-stat-label">To'langan</div>
          <div className="payment-stat-value">{paidCount} ta</div>
        </div>
        <div className="payment-stat payment-stat--yellow">
          <div className="payment-stat-label">Kutilmoqda</div>
          <div className="payment-stat-value">{pendingCount} ta</div>
        </div>
        <div className="payment-stat payment-stat--navy">
          <div className="payment-stat-label">Oy</div>
          <div className="payment-stat-value" style={{ fontSize: 15 }}>{monthLabel(filterMonth)}</div>
        </div>
      </div>

      {/* Filter qatori */}
      <div className="filter-bar">
        <div className="search-box">
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input type="text" placeholder="O'quvchi yoki guruh..."
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

        <select className="filter-select" value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="">Barcha status</option>
          <option value="paid">To'langan</option>
          <option value="pending">Kutilmoqda</option>
          <option value="cancelled">Bekor qilindi</option>
        </select>
      </div>

      {/* Jadval */}
      <div className="table-card">
        {loading ? (
          <div className="table-empty"><div className="loading-spinner" style={{ margin: '0 auto' }} /></div>
        ) : filtered.length === 0 ? (
          <div className="table-empty">
            <div className="table-empty-icon">💳</div>
            <div className="table-empty-text">
              {search || filterGroup || filterStatus ? "Natija topilmadi" : "Bu oyda to'lov yo'q"}
            </div>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>O'quvchi</th>
                <th>Guruh</th>
                <th>Summa</th>
                <th>To'lov turi</th>
                <th>Oy</th>
                <th>Sana</th>
                <th>Status</th>
                <th>Harakatlar</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, i) => {
                const pType  = PAYMENT_TYPES[p.paymentType] || PAYMENT_TYPES.cash;
                const pStatus = STATUS_MAP[p.status] || STATUS_MAP.paid;
                return (
                  <tr key={p._id}>
                    <td className="td-num">{i + 1}</td>
                    <td>
                      <div className="td-user">
                        <div className="td-avatar td-avatar--teal">
                          {p.student?.firstName?.[0]}{p.student?.lastName?.[0]}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 13 }}>
                            {p.student?.firstName} {p.student?.lastName}
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--gray-400)' }}>{p.student?.phone}</div>
                        </div>
                      </div>
                    </td>
                    <td><span className="group-badge">{p.group?.name}</span></td>
                    <td className="td-salary">{Number(p.amount).toLocaleString()} so'm</td>
                    <td>
                      <span className="payment-type-badge" style={{ color: pType.color, background: pType.bg }}>
                        {pType.label}
                      </span>
                    </td>
                    <td style={{ fontSize: 13 }}>{monthLabel(p.month)}</td>
                    <td className="td-phone">
                      {p.paidAt ? new Date(p.paidAt).toLocaleDateString('uz-UZ') : '—'}
                    </td>
                    <td>
                      <span className="payment-type-badge" style={{ color: pStatus.color, background: pStatus.bg }}>
                        {pStatus.label}
                      </span>
                    </td>
                    <td>
                      <div className="td-actions">
                        <button className="btn-icon btn-icon--edit"
                          onClick={() => { setEditData(p); setModalOpen(true); }}>
                          <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>
                        <button className="btn-icon btn-icon--delete"
                          onClick={() => setDeleteTarget(p._id)}>
                          <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                            <path d="M10 11v6M14 11v6" />
                            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <PaymentModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        editData={editData}
        students={students}
        groups={groups}
      />
      {deleteTarget && (
        <DeleteModal
          onConfirm={handleDelete}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
