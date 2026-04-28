'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import api from '../../../lib/api';

const MONTHS_UZ = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'];

const PAYMENT_TYPES = {
  cash: { label: 'Naqd', color: '#276749', bg: '#d4edda' },
  card: { label: 'Karta', color: '#1a5276', bg: '#d6eaf8' },
  transfer: { label: "O'tkazma", color: '#7d3c98', bg: '#e8d5f5' },
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

function fmt(n) { return Number(n || 0).toLocaleString('uz-UZ'); }

// ── DeleteModal ────────────────────────────────────────────
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

// ── O'quvchi to'lov modali ─────────────────────────────────
function StudentPaymentModal({ open, onClose, onSave, editData, students, groups }) {
  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm();
  const selectedGroup = watch('group');

  useEffect(() => {
    if (!open) return;
    if (editData) {
      reset({
        student: editData.student?._id || '',
        group: editData.group?._id || '',
        amount: editData.amount,
        paymentType: editData.paymentType,
        month: editData.month,
        paidAt: editData.paidAt ? editData.paidAt.slice(0, 10) : new Date().toISOString().slice(0, 10),
        note: editData.note || '',
        status: editData.status,
      });
    } else {
      reset({
        student: '', group: '', amount: '', paymentType: 'cash',
        month: currentMonthValue(), paidAt: new Date().toISOString().slice(0, 10),
        note: '', status: 'paid'
      });
    }
  }, [open, editData, reset]);

  useEffect(() => {
    if (!selectedGroup || editData) return;
    const g = groups.find((g) => g._id === selectedGroup);
    if (g?.price) setValue('amount', g.price);
  }, [selectedGroup, editData, groups, setValue]);

  if (!open) return null;

  const filteredStudents = selectedGroup
    ? students.filter((s) => s.group?._id === selectedGroup || s.group === selectedGroup)
    : students;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{editData ? "To'lovni tahrirlash" : "O'quvchi to'lovini qo'shish"}</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit((d) => onSave({ ...d, category: 'student' }))}>
          <div className="modal-body">
            <div className="field">
              <label>Guruh</label>
              <select className={errors.group ? 'err' : ''} {...register('group', { required: 'Majburiy' })}>
                <option value="">— Guruh tanlang —</option>
                {groups.map((g) => <option key={g._id} value={g._id}>{g.name} ({g.subject})</option>)}
              </select>
              {errors.group && <span className="field-err">{errors.group.message}</span>}
            </div>
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
                  <option value="cash">Naqd</option>
                  <option value="card">Karta</option>
                  <option value="transfer">O'tkazma</option>
                </select>
              </div>
            </div>
            <div className="modal-row">
              <div className="field">
                <label>To'lov oyi</label>
                <input type="month" {...register('month', { required: 'Majburiy' })}
                  className={errors.month ? 'err' : ''}
                  style={{ width: '100%', padding: '11px 14px', border: '1.5px solid var(--gray-200)', borderRadius: 8, fontSize: 14, color: 'var(--navy)', background: 'var(--gray-50)', outline: 'none' }} />
                {errors.month && <span className="field-err">{errors.month.message}</span>}
              </div>
              <div className="field">
                <label>To'lov sanasi</label>
                <input type="date" {...register('paidAt')}
                  style={{ width: '100%', padding: '11px 14px', border: '1.5px solid var(--gray-200)', borderRadius: 8, fontSize: 14, color: 'var(--navy)', background: 'var(--gray-50)', outline: 'none' }} />
              </div>
            </div>
            <div className="modal-row">
              <div className="field">
                <label>Status</label>
                <select {...register('status')}>
                  <option value="paid">To'langan</option>
                  <option value="pending">Kutilmoqda</option>
                  <option value="cancelled">Bekor qilindi</option>
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

// ── O'qituvchi to'lov modali ───────────────────────────────
function TeacherPaymentModal({ open, onClose, onSave, editData, teachers, prefill }) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  useEffect(() => {
    if (!open) return;
    if (editData) {
      reset({
        teacher: editData.teacher?._id || '',
        amount: editData.amount,
        paymentType: editData.paymentType,
        month: editData.month,
        paidAt: editData.paidAt ? editData.paidAt.slice(0, 10) : new Date().toISOString().slice(0, 10),
        note: editData.note || '',
      });
    } else if (prefill) {
      reset({
        teacher: prefill.teacherId || '',
        amount: prefill.amount || '',
        paymentType: 'cash',
        month: prefill.month || currentMonthValue(),
        paidAt: new Date().toISOString().slice(0, 10),
        note: '',
      });
    } else {
      reset({
        teacher: '', amount: '', paymentType: 'cash',
        month: currentMonthValue(), paidAt: new Date().toISOString().slice(0, 10), note: ''
      });
    }
  }, [open, editData, prefill, reset]);

  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{editData ? "To'lovni tahrirlash" : "Maosh to'lash"}</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit((d) => onSave({ ...d, category: 'teacher' }))}>
          <div className="modal-body">
            <div className="field">
              <label>O'qituvchi</label>
              <select className={errors.teacher ? 'err' : ''} {...register('teacher', { required: 'Majburiy' })}
                disabled={!!prefill}>
                <option value="">— O'qituvchi tanlang —</option>
                {teachers.map((t) => (
                  <option key={t._id} value={t._id}>{t.firstName} {t.lastName} — {t.subject}</option>
                ))}
              </select>
              {errors.teacher && <span className="field-err">{errors.teacher.message}</span>}
            </div>
            <div className="modal-row">
              <div className="field">
                <label>Maosh summasi (so'm)</label>
                <div className="salary-input-wrap">
                  <input type="number" placeholder="0" min={0}
                    className={errors.amount ? 'err' : ''}
                    {...register('amount', { required: 'Majburiy', min: { value: 1, message: "0 dan katta" } })} />
                  <span className="salary-suffix">so'm</span>
                </div>
                {errors.amount && <span className="field-err">{errors.amount.message}</span>}
              </div>
              <div className="field">
                <label>To'lov turi</label>
                <select {...register('paymentType')}>
                  <option value="cash">Naqd</option>
                  <option value="card">Karta</option>
                  <option value="transfer">O'tkazma</option>
                </select>
              </div>
            </div>
            <div className="modal-row">
              <div className="field">
                <label>Oy</label>
                <input type="month" {...register('month')}
                  style={{ width: '100%', padding: '11px 14px', border: '1.5px solid var(--gray-200)', borderRadius: 8, fontSize: 14, color: 'var(--navy)', background: 'var(--gray-50)', outline: 'none' }} />
              </div>
              <div className="field">
                <label>To'lov sanasi</label>
                <input type="date" {...register('paidAt')}
                  style={{ width: '100%', padding: '11px 14px', border: '1.5px solid var(--gray-200)', borderRadius: 8, fontSize: 14, color: 'var(--navy)', background: 'var(--gray-50)', outline: 'none' }} />
              </div>
            </div>
            <div className="field">
              <label>Izoh (ixtiyoriy)</label>
              <input type="text" placeholder="Maosh, bonus, avans..." {...register('note')} />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-cancel" onClick={onClose}>Bekor qilish</button>
            <button type="submit" className="btn-save">{editData ? 'Saqlash' : "To'lash"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Maosh hisob-kitobi paneli ──────────────────────────────
function TeacherSalaryPanel({ onPay, refreshKey }) {
  const [salaries, setSalaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    setLoading(true);
    api.get('/payments/teacher-salary?includeInactive=1')
      .then((r) => setSalaries(r.data.data))
      .catch(() => { })
      .finally(() => setLoading(false));
  }, [refreshKey]);

  if (loading) return <div className="loading-spinner" style={{ margin: '20px auto' }} />;
  if (!salaries.length) return (
    <div className="table-empty" style={{ padding: 24 }}>
      <div className="table-empty-text">O'qituvchilar topilmadi</div>
    </div>
  );

  return (
    <div className="salary-panel">
      {salaries.map((t) => {
        const pct = t.salaryType === 'percent';
        const isExpanded = expanded === t._id;

        // Hisob-kitobni aniqroq ko'rsatish uchun barcha to'lovlarni sum qilish
        const totalStudentPayments = t.monthlyBreakdown?.reduce((s, m) => s + m.studentPayments, 0) || 0;

        return (
          <div key={t._id} className="salary-card-wrap" style={{ marginBottom: 12 }}>
            <div
              className={`db-card salary-card${t.balance === 0 && t.totalShouldReceive > 0 ? ' salary-card--paid' : ''}`}
              style={{ cursor: 'pointer', padding: 16, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}
              onClick={() => setExpanded(isExpanded ? null : t._id)}
            >
              <div className="salary-card-left">
                <div className="td-avatar td-avatar--navy" style={{ width: 44, height: 44, fontSize: 15, flexShrink: 0 }}>
                  {t.firstName[0]}{t.lastName[0]}
                </div>
                <div>
                  <div className="salary-card-name">{t.firstName} {t.lastName}</div>
                  <div className="salary-card-group">
                    {t.group?.name || 'Guruhsiz'} &middot;{' '}
                    {pct
                      ? <><span className="salary-type-badge salary-type-badge--pct">{t.salary}%</span> ulush</>
                      : <><span className="salary-type-badge salary-type-badge--fix">{fmt(t.salary)} so'm</span> belgilangan</>
                    }
                  </div>
                </div>
              </div>

              <div className="salary-card-cols" style={{ display: 'flex', gap: 24, flex: 1, borderLeft: '1px solid var(--gray-100)', paddingLeft: 24 }}>
                {pct ? (
                  <div className="salary-col">
                    <div className="salary-col-label" style={{ fontSize: 11, color: 'var(--gray-400)' }}>O'quvchilar to'ladi ({t.salary}%)</div>
                    <div className="salary-col-value" style={{ fontSize: 14, fontWeight: 600 }}>{fmt(totalStudentPayments)} so'm</div>
                  </div>
                ) : null}
                <div className="salary-col">
                  <div className="salary-col-label" style={{ fontSize: 11, color: 'var(--gray-400)' }}>Olishi kerak</div>
                  <div className="salary-col-value salary-col-value--should" style={{ fontSize: 15, fontWeight: 700, color: '#1a5276' }}>{fmt(t.totalShouldReceive)} so'm</div>
                </div>
                <div className="salary-col">
                  <div className="salary-col-label" style={{ fontSize: 11, color: 'var(--gray-400)' }}>To'langan</div>
                  <div className="salary-col-value salary-col-value--paid" style={{ fontSize: 15, fontWeight: 700, color: '#276749' }}>{fmt(t.totalPaid)} so'm</div>
                </div>
                <div className="salary-col">
                  <div className="salary-col-label" style={{ fontSize: 11, color: 'var(--gray-400)' }}>Qoldiq</div>
                  <div className={`salary-col-value ${t.balance > 0 ? 'salary-col-value--debt' : 'salary-col-value--zero'}`} style={{ fontSize: 15, fontWeight: 800, color: t.balance > 0 ? '#b45309' : '#9aa3b8' }}>
                    {fmt(t.balance)} so'm
                  </div>
                </div>
              </div>

              <div className="salary-card-action">
                {t.balance === 0 && t.totalShouldReceive > 0 ? (
                  <span className="salary-paid-badge">&#10003; To'langan</span>
                ) : (
                  <button className="btn-pay" disabled={t.balance === 0}
                    onClick={(e) => { e.stopPropagation(); onPay({ teacherId: t._id, teacherName: `${t.firstName} ${t.lastName}`, amount: t.balance }); }}>
                    <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    To'lash
                  </button>
                )}
                <span className="salary-expand-icon" style={{ marginLeft: 8, fontSize: 14, color: 'var(--gray-400)', display: 'inline-block', transition: 'transform 0.2s', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9" /></svg>
                </span>
              </div>
            </div>

            {isExpanded && (
              <div className="salary-detail">
                {t.monthlyBreakdown && t.monthlyBreakdown.length > 0 && (
                  <div className="salary-detail-section">
                    <div className="salary-detail-title">Oylik hisob-kitob</div>
                    <table className="salary-detail-table">
                      <thead>
                        <tr>
                          <th>Oy</th>
                          <th>O'quvchilar to'lovi</th>
                          <th>Olishi kerak</th>
                        </tr>
                      </thead>
                      <tbody>
                        {t.monthlyBreakdown.map((m) => (
                          <tr key={m.month}>
                            <td style={{ fontWeight: 600 }}>{monthLabel(m.month)}</td>
                            <td>{fmt(m.studentPayments)} so'm</td>
                            <td style={{ fontWeight: 700, color: '#1a5276' }}>{fmt(m.shouldReceive)} so'm</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="salary-detail-section">
                  <div className="salary-detail-title">To'lov tarixi</div>
                  {t.paymentHistory && t.paymentHistory.length > 0 ? (
                    <table className="salary-detail-table">
                      <thead>
                        <tr>
                          <th>Sana</th>
                          <th>Summa</th>
                          <th>To'lov turi</th>
                          <th>Izoh</th>
                        </tr>
                      </thead>
                      <tbody>
                        {t.paymentHistory.map((p, i) => (
                          <tr key={i}>
                            <td>{p.paidAt ? new Date(p.paidAt).toLocaleDateString('uz-UZ') : '—'}</td>
                            <td style={{ fontWeight: 700, color: '#276749' }}>{fmt(p.amount)} so'm</td>
                            <td><PayTypeBadge type={p.paymentType} /></td>
                            <td style={{ fontSize: 12, color: 'var(--gray-400)' }}>{p.note || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div style={{ padding: '12px 0', fontSize: 13, color: 'var(--gray-400)' }}>Hali to'lov qilinmagan</div>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Boshqa to'lov modali ───────────────────────────────────
function OtherPaymentModal({ open, onClose, onSave, editData }) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  useEffect(() => {
    if (!open) return;
    if (editData) {
      reset({
        description: editData.description || '',
        amount: editData.amount,
        paymentType: editData.paymentType,
        paidAt: editData.paidAt ? editData.paidAt.slice(0, 10) : new Date().toISOString().slice(0, 10),
        note: editData.note || '',
      });
    } else {
      reset({
        description: '', amount: '', paymentType: 'cash',
        paidAt: new Date().toISOString().slice(0, 10), note: ''
      });
    }
  }, [open, editData, reset]);

  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{editData ? "To'lovni tahrirlash" : "Boshqa to'lov qo'shish"}</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit((d) => onSave({ ...d, category: 'other' }))}>
          <div className="modal-body">
            <div className="field">
              <label>Tavsif (nima uchun)</label>
              <input type="text" placeholder="Masalan: Internet, ijara, buyumlar..."
                className={errors.description ? 'err' : ''}
                {...register('description', { required: 'Majburiy' })} />
              {errors.description && <span className="field-err">{errors.description.message}</span>}
            </div>
            <div className="modal-row">
              <div className="field">
                <label>Summa (so'm)</label>
                <div className="salary-input-wrap">
                  <input type="number" placeholder="0" min={0}
                    className={errors.amount ? 'err' : ''}
                    {...register('amount', { required: 'Majburiy', min: { value: 1, message: "0 dan katta" } })} />
                  <span className="salary-suffix">so'm</span>
                </div>
                {errors.amount && <span className="field-err">{errors.amount.message}</span>}
              </div>
              <div className="field">
                <label>To'lov turi</label>
                <select {...register('paymentType')}>
                  <option value="cash">Naqd</option>
                  <option value="card">Karta</option>
                  <option value="transfer">O'tkazma</option>
                </select>
              </div>
            </div>
            <div className="field">
              <label>To'lov sanasi</label>
              <input type="date" {...register('paidAt')}
                style={{ width: '100%', padding: '11px 14px', border: '1.5px solid var(--gray-200)', borderRadius: 8, fontSize: 14, color: 'var(--navy)', background: 'var(--gray-50)', outline: 'none' }} />
            </div>
            <div className="field">
              <label>Izoh (ixtiyoriy)</label>
              <input type="text" placeholder="Qo'shimcha ma'lumot..." {...register('note')} />
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

// ── Helper components ──────────────────────────────────────
function PayTypeBadge({ type }) {
  const pt = PAYMENT_TYPES[type] || PAYMENT_TYPES.cash;
  return <span className="payment-type-badge" style={{ color: pt.color, background: pt.bg }}>{pt.label}</span>;
}

function ActionBtns({ onEdit, onDelete }) {
  return (
    <div className="td-actions">
      <button className="btn-icon btn-icon--edit" onClick={onEdit} title="Tahrirlash">
        <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
      </button>
      <button className="btn-icon btn-icon--delete" onClick={onDelete} title="O'chirish">
        <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
          <path d="M10 11v6M14 11v6" />
          <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
        </svg>
      </button>
    </div>
  );
}

// ── Tables ─────────────────────────────────────────────────
function StudentTable({ data, onEdit, onDelete }) {
  return (
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
          <th>Harakatlar</th>
        </tr>
      </thead>
      <tbody>
        {data.map((p, i) => (
          <tr key={p._id}>
            <td className="td-num">{i + 1}</td>
            <td>
              <div className="td-user">
                <div className="td-avatar td-avatar--teal">
                  {p.student?.firstName?.[0]}{p.student?.lastName?.[0]}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{p.student?.firstName} {p.student?.lastName}</div>
                  <div style={{ fontSize: 12, color: 'var(--gray-400)' }}>{p.student?.phone}</div>
                </div>
              </div>
            </td>
            <td><span className="group-badge">{p.group?.name}</span></td>
            <td className="td-salary">{fmt(p.amount)} so'm</td>
            <td><PayTypeBadge type={p.paymentType} /></td>
            <td style={{ fontSize: 13 }}>{monthLabel(p.month)}</td>
            <td className="td-phone">{p.paidAt ? new Date(p.paidAt).toLocaleDateString('uz-UZ') : '—'}</td>
            <td><ActionBtns onEdit={() => onEdit(p)} onDelete={() => onDelete(p._id)} /></td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function TeacherTable({ data, onEdit, onDelete }) {
  return (
    <table className="data-table">
      <thead>
        <tr>
          <th>#</th>
          <th>O'qituvchi</th>
          <th>Summa</th>
          <th>To'lov turi</th>
          <th>Oy</th>
          <th>Sana</th>
          <th>Izoh</th>
          <th>Harakatlar</th>
        </tr>
      </thead>
      <tbody>
        {data.map((p, i) => (
          <tr key={p._id}>
            <td className="td-num">{i + 1}</td>
            <td>
              <div className="td-user">
                <div className="td-avatar td-avatar--navy">
                  {p.teacher?.firstName?.[0]}{p.teacher?.lastName?.[0]}
                </div>
                <div style={{ fontWeight: 600, fontSize: 13 }}>
                  {p.teacher?.firstName} {p.teacher?.lastName}
                </div>
              </div>
            </td>
            <td className="td-salary">{fmt(p.amount)} so'm</td>
            <td><PayTypeBadge type={p.paymentType} /></td>
            <td style={{ fontSize: 13 }}>{monthLabel(p.month) || '—'}</td>
            <td className="td-phone">{p.paidAt ? new Date(p.paidAt).toLocaleDateString('uz-UZ') : '—'}</td>
            <td style={{ fontSize: 12, color: 'var(--gray-400)' }}>{p.note || '—'}</td>
            <td><ActionBtns onEdit={() => onEdit(p)} onDelete={() => onDelete(p._id)} /></td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function OtherTable({ data, onEdit, onDelete }) {
  return (
    <table className="data-table">
      <thead>
        <tr>
          <th>#</th>
          <th>Tavsif</th>
          <th>Summa</th>
          <th>To'lov turi</th>
          <th>Sana</th>
          <th>Izoh</th>
          <th>Harakatlar</th>
        </tr>
      </thead>
      <tbody>
        {data.map((p, i) => (
          <tr key={p._id}>
            <td className="td-num">{i + 1}</td>
            <td style={{ fontWeight: 600, fontSize: 13 }}>{p.description || '—'}</td>
            <td className="td-salary">{fmt(p.amount)} so'm</td>
            <td><PayTypeBadge type={p.paymentType} /></td>
            <td className="td-phone">{p.paidAt ? new Date(p.paidAt).toLocaleDateString('uz-UZ') : '—'}</td>
            <td style={{ fontSize: 12, color: 'var(--gray-400)' }}>{p.note || '—'}</td>
            <td><ActionBtns onEdit={() => onEdit(p)} onDelete={() => onDelete(p._id)} /></td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// ── Main Page ──────────────────────────────────────────────
export default function PaymentsPage() {
  const [activeTab, setActiveTab] = useState('student');
  const [payments, setPayments] = useState([]);
  const [students, setStudents] = useState([]);
  const [groups, setGroups] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalAmount, setTotalAmount] = useState(0);

  const [filterGroup, setFilterGroup] = useState('');
  const [search, setSearch] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [prefill, setPrefill] = useState(null);
  const [salaryKey, setSalaryKey] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = useCallback((text, type = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ category: activeTab });
      if (filterGroup && activeTab === 'student') params.append('group', filterGroup);
      const res = await api.get(`/payments?${params}`);
      setPayments(res.data.data);
      setTotalAmount(res.data.totalAmount);
    } catch {
      showToast('Yuklashda xatolik', 'error');
    } finally {
      setLoading(false);
    }
  }, [activeTab, filterGroup, showToast]);

  const fetchMeta = useCallback(async () => {
    const [sRes, gRes, tRes] = await Promise.all([
      api.get('/students'),
      api.get('/groups'),
      api.get('/teachers'),
    ]);
    setStudents(sRes.data.data);
    setGroups(gRes.data.data);
    setTeachers(tRes.data.data);
  }, []);

  useEffect(() => { fetchMeta(); }, [fetchMeta]);
  useEffect(() => { fetchPayments(); }, [fetchPayments]);

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
      setEditData(null);
      setPrefill(null);
      fetchPayments();
      if (data.category === 'teacher') setSalaryKey((k) => k + 1);
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
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      `${p.student?.firstName || ''} ${p.student?.lastName || ''}`.toLowerCase().includes(q) ||
      `${p.teacher?.firstName || ''} ${p.teacher?.lastName || ''}`.toLowerCase().includes(q) ||
      (p.group?.name || '').toLowerCase().includes(q) ||
      (p.description || '').toLowerCase().includes(q)
    );
  });

  const TABS = [
    { key: 'student', label: "O'quvchilar to'lovlari" },
    { key: 'teacher', label: "O'qituvchi maoshlari" },
    { key: 'other', label: "Boshqa to'lovlar" },
  ];

  const tabTotal = filtered.reduce((s, p) => s + (p.amount || 0), 0);

  const kpiCards = [
    {
      label: 'Jami summa',
      value: `${fmt(totalAmount)} so'm`,
      color: 'emerald',
      icon: <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="2" y="5" width="20" height="14" rx="2" /><path d="M2 10h20" /></svg>
    },
    {
      label: 'Yozuvlar soni',
      value: `${payments.length} ta`,
      color: 'blue',
      icon: <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>
    },
    {
      label: "Ko'rsatilmoqda",
      value: `${filtered.length} ta`,
      color: 'amber',
      icon: <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
    },
    {
      label: "Ko'rsatilgan summa",
      value: `${fmt(tabTotal)} so'm`,
      color: 'navy',
      icon: <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
    }
  ];

  return (
    <div className="db-page">
      {toast && <div className={`toast toast--${toast.type}`}>{toast.text}</div>}

      <div className="db-topbar" style={{ marginBottom: 8 }}>
        <div>
          <h1 className="db-title">To'lovlar</h1>
          <p className="db-subtitle">
            {TABS.find((t) => t.key === activeTab)?.label} &middot; {filtered.length} ta
          </p>
        </div>
        <button className="btn-add" onClick={() => { setEditData(null); setModalOpen(true); }}>
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Qo'shish
        </button>
      </div>

      {/* Statistika (Yangi db-kpi-row dizayni) */}
      <div className="db-kpi-row" style={{ marginBottom: 16 }}>
        {kpiCards.map((card, i) => (
          <div key={i} className={`db-kpi db-kpi--${card.color}`}>
            <div className={`db-kpi-icon db-kpi-icon--${card.color}`}>{card.icon}</div>
            <div className="db-kpi-body">
              <div className="db-kpi-value" style={{ fontSize: 22 }}>{card.value}</div>
              <div className="db-kpi-label">{card.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Tablar */}
      <div className="pay-tabs">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            className={`pay-tab${activeTab === tab.key ? ' pay-tab--active' : ''}`}
            onClick={() => { setActiveTab(tab.key); setSearch(''); setFilterGroup(''); }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filter */}
      <div className="filter-bar">
        <div className="search-box">
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input type="text"
            placeholder={activeTab === 'student' ? "O'quvchi yoki guruh..." : activeTab === 'teacher' ? "O'qituvchi..." : "Tavsif..."}
            value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        {activeTab === 'student' && (
          <select className="filter-select" value={filterGroup}
            onChange={(e) => setFilterGroup(e.target.value)}>
            <option value="">Barcha guruhlar</option>
            {groups.map((g) => <option key={g._id} value={g._id}>{g.name}</option>)}
          </select>
        )}
      </div>

      {/* O'qituvchi maosh paneli */}
      {activeTab === 'teacher' && (
        <TeacherSalaryPanel
          refreshKey={salaryKey}
          onPay={(pf) => { setPrefill(pf); setEditData(null); setModalOpen(true); }}
        />
      )}

      {/* To'lovlar tarixi */}
      <div className="db-card" style={{ padding: 0, overflow: 'hidden' }}>
        {activeTab === 'teacher' && (
          <div style={{ padding: '12px 18px 8px', fontWeight: 700, fontSize: 13, color: 'var(--gray-400)', borderBottom: '1px solid var(--gray-100)' }}>
            Barcha to'lovlar tarixi
          </div>
        )}
        {loading ? (
          <div className="table-empty"><div className="loading-spinner" style={{ margin: '0 auto' }} /></div>
        ) : filtered.length === 0 ? (
          <div className="table-empty">
            <div className="table-empty-icon">
              <svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" style={{ opacity: 0.35 }}>
                <rect x="2" y="5" width="20" height="14" rx="2" /><path d="M2 10h20" />
              </svg>
            </div>
            <div className="table-empty-text">{search ? 'Natija topilmadi' : "Hozircha to'lov yo'q"}</div>
          </div>
        ) : activeTab === 'student' ? (
          <StudentTable data={filtered} onEdit={(p) => { setEditData(p); setModalOpen(true); }} onDelete={(id) => setDeleteTarget(id)} />
        ) : activeTab === 'teacher' ? (
          <TeacherTable data={filtered} onEdit={(p) => { setEditData(p); setPrefill(null); setModalOpen(true); }} onDelete={(id) => setDeleteTarget(id)} />
        ) : (
          <OtherTable data={filtered} onEdit={(p) => { setEditData(p); setModalOpen(true); }} onDelete={(id) => setDeleteTarget(id)} />
        )}
      </div>

      {/* Modallar */}
      {activeTab === 'student' && (
        <StudentPaymentModal open={modalOpen} onClose={() => { setModalOpen(false); setEditData(null); }}
          onSave={handleSave} editData={editData} students={students} groups={groups} />
      )}
      {activeTab === 'teacher' && (
        <TeacherPaymentModal open={modalOpen} onClose={() => { setModalOpen(false); setEditData(null); setPrefill(null); }}
          onSave={handleSave} editData={editData} teachers={teachers} prefill={prefill} />
      )}
      {activeTab === 'other' && (
        <OtherPaymentModal open={modalOpen} onClose={() => { setModalOpen(false); setEditData(null); }}
          onSave={handleSave} editData={editData} />
      )}

      {deleteTarget && (
        <DeleteModal onConfirm={handleDelete} onClose={() => setDeleteTarget(null)} />
      )}
    </div>
  );
}
