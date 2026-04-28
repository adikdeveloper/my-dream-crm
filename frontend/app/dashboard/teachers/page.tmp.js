'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import api from '../../../lib/api';

function formatPhone(raw) {
  const digits = raw.replace(/\D/g, '');
  const local = digits.startsWith('998') ? digits.slice(3, 12) : digits.slice(0, 9);
  let r = '+998';
  if (local.length > 0) r += '-' + local.slice(0, 2);
  if (local.length > 2) r += '-' + local.slice(2, 5);
  if (local.length > 5) r += '-' + local.slice(5, 7);
  if (local.length > 7) r += '-' + local.slice(7, 9);
  return r;
}

function currentMonthValue() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}
const MONTHS_UZ = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'];
function monthLabel(val) {
  if (!val) return '';
  const [y, m] = val.split('-');
  return `${MONTHS_UZ[parseInt(m) - 1]} ${y}`;
}
function fmt(n) { return Number(n || 0).toLocaleString('uz-UZ'); }

// ── Teacher View Modal ────────────────────────────────────────────────
function TeacherViewModal({ teacher, onClose, onEdit }) {
  const [salary, setSalary] = useState(null);
  const [loadingSalary, setLoadingSalary] = useState(true);
  const month = currentMonthValue();

  useEffect(() => {
    if (!teacher) return;
    api.get(`/payments/teacher-salary`)
      .then((r) => {
        const found = r.data.data.find((t) => t._id === teacher._id);
        if (found) {
          const mData = found.monthlyBreakdown?.find(m => m.month === month) || { studentPayments: 0, shouldReceive: 0 };
          const alreadyPaid = found.paymentHistory?.filter(p => p.month === month).reduce((s, p) => s + p.amount, 0) || 0;
          setSalary({
            ...found,
            totalStudentPayments: mData.studentPayments,
            shouldReceive: mData.shouldReceive,
            alreadyPaid: alreadyPaid,
            balance: Math.max(0, mData.shouldReceive - alreadyPaid)
          });
        } else {
          setSalary(null);
        }
      })
      .catch(() => setSalary(null))
      .finally(() => setLoadingSalary(false));
  }, [teacher, month]);

  if (!teacher) return null;

  const isPct = teacher.salaryType === 'percent';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box modal-box--view" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="svm-header">
          <div className="svm-avatar" style={{ background: 'linear-gradient(135deg, #1a5276, #2e86c1)' }}>
            {teacher.firstName[0]}{teacher.lastName[0]}
          </div>
          <div className="svm-title">
            <div className="svm-name">{teacher.firstName} {teacher.lastName}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
              <span className="group-badge">{teacher.subject}</span>
              <span className={`status-badge status-badge--${teacher.status}`}>
                {teacher.status === 'active' ? 'Faol' : 'Nofaol'}
              </span>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body" style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Kontakt */}
          <div className="svm-section">
            <div className="svm-section-title">Kontakt</div>
            <div className="svm-row">
              <span className="svm-icon">📞</span>
              <div>
                <div className="svm-row-label">Telefon</div>
                <div className="svm-row-value">{teacher.phone}</div>
              </div>
            </div>
          </div>

          {/* Guruh */}
          <div className="svm-section">
            <div className="svm-section-title">Dars guruhi</div>
            {teacher.group ? (
              <div className="svm-row">
                <span className="svm-icon">🏫</span>
                <div>
                  <div className="svm-row-label">Guruh</div>
                  <div className="svm-row-value">{teacher.group.name}
                    {teacher.group.subject ? ` — ${teacher.group.subject}` : ''}
                  </div>
                </div>
              </div>
            ) : (
              <div className="svm-row">
                <span className="svm-icon">🏫</span>
                <div className="svm-row-value" style={{ color: 'var(--gray-400)' }}>Guruh biriktirilmagan</div>
              </div>
            )}
          </div>

          {/* Maosh */}
          <div className="svm-section">
            <div className="svm-section-title">Maosh tartibi</div>
            <div className="svm-row">
              <span className="svm-icon">{isPct ? '📊' : '💰'}</span>
              <div>
                <div className="svm-row-label">{isPct ? 'Ulush (foiz)' : "Belgilangan maosh"}</div>
                <div className="svm-row-value">
                  {isPct ? `${teacher.salary}% (o'quvchilar to'lovidan)` : `${fmt(teacher.salary)} so'm / oy`}
                </div>
              </div>
            </div>
          </div>

          {/* Joriy oy hisob-kitobi */}
          <div className="svm-payment-box">
            <div className="svm-payment-row" style={{ background: 'var(--gray-50)', fontWeight: 700, color: 'var(--gray-600)' }}>
              <span>{monthLabel(month)} — maosh holati</span>
              {loadingSalary && <span style={{ fontSize: 11, fontWeight: 400 }}>yuklanmoqda…</span>}
            </div>
            {!loadingSalary && salary ? (
              <>
                {isPct && (
                  <div className="svm-payment-row">
                    <span>O'quvchilar to'lovi</span>
                    <span>{fmt(salary.totalStudentPayments)} so'm</span>
                  </div>
                )}
                <div className="svm-payment-row">
                  <span>Olishi kerak</span>
                  <span style={{ color: '#1a5276', fontWeight: 700 }}>{fmt(salary.shouldReceive)} so'm</span>
                </div>
                <div className="svm-payment-row">
                  <span>To'langan</span>
                  <span style={{ color: '#276749', fontWeight: 700 }}>{fmt(salary.alreadyPaid)} so'm</span>
                </div>
                <div className="svm-payment-row svm-payment-row--total">
                  <span>Qoldiq</span>
                  <span style={{ color: salary.balance > 0 ? '#c0392b' : '#276749' }}>
                    {fmt(salary.balance)} so'm
                  </span>
                </div>
              </>
            ) : !loadingSalary ? (
              <div className="svm-payment-row" style={{ color: 'var(--gray-400)' }}>
                <span>Ma'lumot topilmadi</span>
              </div>
            ) : null}
          </div>

        </div>

        <div className="modal-footer">
          <button className="btn-cancel" onClick={onClose}>Yopish</button>
          <button className="btn-save" onClick={() => { onClose(); onEdit(teacher); }}>
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            Tahrirlash
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Teacher Modal ────────────────────────────────────────────────────
function TeacherModal({ open, onClose, onSave, editData, groups, subjects }) {
  const router = useRouter();
  const [phoneDisplay, setPhoneDisplay] = useState('+998-');
  const [salaryType, setSalaryType] = useState('sum');
  const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm();

  useEffect(() => {
    if (!open) return;
    if (editData) {
      reset({
        firstName: editData.firstName,
        lastName: editData.lastName,
        subject: editData.subject,
        salary: editData.salary,
        status: editData.status,
        group: editData.group?._id || editData.group || '',
      });
      setPhoneDisplay(editData.phone || '+998-');
      setValue('phone', editData.phone || '');
      setSalaryType(editData.salaryType || 'sum');
    } else {
      reset({ firstName: '', lastName: '', subject: '', salary: '', status: 'active', group: '' });
      setPhoneDisplay('+998-');
      setValue('phone', '');
      setSalaryType('sum');
    }
  }, [open, editData]);

  const handlePhoneInput = (e) => {
    const formatted = formatPhone(e.target.value);
    setPhoneDisplay(formatted);
    const digits = e.target.value.replace(/\D/g, '');
    const local = digits.startsWith('998') ? digits.slice(3, 12) : digits.slice(0, 9);
    setValue('phone', '+998' + local, { shouldValidate: true });
  };

  const onSubmit = (data) => {
    onSave({ ...data, salaryType });
  };

  if (!open) return null;

  const hasGroups = groups.length > 0;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{editData ? "O'qituvchini tahrirlash" : "Yangi o'qituvchi qo'shish"}</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <input type="hidden" {...register('phone', {
            validate: (v) => (v && v.replace(/\D/g, '').length === 12) || "To'liq raqam kiriting"
          })} />

          <div className="modal-body">
            {/* Ism / Familiya */}
            <div className="modal-row">
              <div className="field">
                <label>Ism</label>
                <input type="text" placeholder="Ism" className={errors.firstName ? 'err' : ''}
                  {...register('firstName', { required: 'Majburiy' })} />
                {errors.firstName && <span className="field-err">{errors.firstName.message}</span>}
              </div>
              <div className="field">
                <label>Familiya</label>
                <input type="text" placeholder="Familiya" className={errors.lastName ? 'err' : ''}
                  {...register('lastName', { required: 'Majburiy' })} />
                {errors.lastName && <span className="field-err">{errors.lastName.message}</span>}
              </div>
            </div>

            {/* Telefon */}
            <div className="field">
              <label>Telefon raqam</label>
              <input type="tel" value={phoneDisplay} onChange={handlePhoneInput}
                onKeyDown={(e) => { if (e.key === 'Backspace' && phoneDisplay === '+998-') e.preventDefault(); }}
                onFocus={(e) => { const l = e.target.value.length; e.target.setSelectionRange(l, l); }}
                className={errors.phone ? 'err' : ''}
                placeholder="+998-__-___-__-__" />
              {errors.phone && <span className="field-err">{errors.phone.message}</span>}
            </div>

            {/* Fan */}
            <div className="modal-row">
              <div className="field">
                <label>Fan (yo'nalish)</label>
                <select className={errors.subject ? 'err' : ''}
                  {...register('subject', { required: 'Majburiy' })}>
                  <option value="">Tanlang</option>
                  {subjects.map((s) => (
                    <option key={s._id} value={s.name}>{s.name}</option>
                  ))}
                </select>
                {errors.subject && <span className="field-err">{errors.subject.message}</span>}
              </div>
              <div className="field">
                <label>Status</label>
                <select {...register('status')}>
                  <option value="active">Faol</option>
                  <option value="inactive">Nofaol</option>
                </select>
              </div>
            </div>

            {/* Maosh + Turi */}
            <div className="field">
              <label>Maosh</label>
              <div className="salary-row">
                {/* Toggle */}
                <div className="salary-toggle">
                  <button
                    type="button"
                    className={`salary-toggle-btn${salaryType === 'sum' ? ' active' : ''}`}
                    onClick={() => setSalaryType('sum')}
                  >
                    so'm
                  </button>
                  <button
                    type="button"
                    className={`salary-toggle-btn${salaryType === 'percent' ? ' active' : ''}`}
                    onClick={() => setSalaryType('percent')}
                  >
                    %
                  </button>
                </div>
                {/* Input */}
                <div className="salary-input-wrap">
                  <input
                    type="number"
                    placeholder={salaryType === 'sum' ? '2 000 000' : '30'}
                    className={errors.salary ? 'err' : ''}
                    min={0}
                    max={salaryType === 'percent' ? 100 : undefined}
                    {...register('salary', {
                      required: 'Majburiy',
                      min: { value: 0, message: "0 dan katta bo'lsin" },
                      ...(salaryType === 'percent' && { max: { value: 100, message: '100% dan oshmasin' } }),
                    })}
                  />
                  <span className="salary-suffix">{salaryType === 'sum' ? "so'm" : '%'}</span>
                </div>
              </div>
              {errors.salary && <span className="field-err">{errors.salary.message}</span>}
            </div>

            {/* Guruh */}
            <div className="field">
              <label>Guruh</label>
              {hasGroups ? (
                <select {...register('group')}>
                  <option value="">— Guruh tanlang —</option>
                  {groups.map((g) => (
                    <option key={g._id} value={g._id}>{g.name} ({g.subject})</option>
                  ))}
                </select>
              ) : (
                <div className="no-group-box">
                  <span>Hali guruh qo'shilmagan</span>
                  <button
                    type="button"
                    className="btn-goto-groups"
                    onClick={() => { onClose(); router.push('/dashboard/groups'); }}
                  >
                    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    Guruh qo'shish
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-cancel" onClick={onClose}>Bekor qilish</button>
            <button type="submit" className="btn-save">
              {editData ? 'Saqlash' : "Qo'shish"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Delete Confirm ────────────────────────────────────────────────────
function DeleteModal({ name, onConfirm, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box modal-box--sm" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>O'chirishni tasdiqlash</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <p className="delete-text">
            <strong>{name}</strong> ni o'chirishni tasdiqlaysizmi? Bu amalni qaytarib bo'lmaydi.
          </p>
        </div>
        <div className="modal-footer">
          <button className="btn-cancel" onClick={onClose}>Bekor qilish</button>
          <button className="btn-delete" onClick={onConfirm}>Ha, o'chirish</button>
        </div>
      </div>
    </div>
  );
}

export default function TeachersPage() {
  const currentMonth = currentMonthValue();
  const [teachers, setTeachers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [salaryRows, setSalaryRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [viewData, setViewData] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (text, type = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [teachersRes, groupsRes, subjectsRes, salaryRes] = await Promise.allSettled([
        api.get('/teachers'),
        api.get('/groups'),
        api.get('/subjects'),
        api.get('/payments/teacher-salary'),
      ]);

      if (teachersRes.status !== 'fulfilled' || groupsRes.status !== 'fulfilled' || subjectsRes.status !== 'fulfilled') {
        throw new Error("Ma'lumotlarni yuklashda xatolik");
      }

      setTeachers(teachersRes.value.data.data);
      setGroups(groupsRes.value.data.data);
      setSubjects(subjectsRes.value.data.data.filter((item) => item.status === 'active'));
      setSalaryRows(salaryRes.status === 'fulfilled' ? salaryRes.value.data.data : []);
    } catch {
      showToast("Ma'lumotlarni yuklashda xatolik", 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const handleSave = async (data) => {
    try {
      const payload = { ...data, salary: Number(data.salary) };
      if (editData) {
        await api.put(`/teachers/${editData._id}`, payload);
        showToast("O'qituvchi yangilandi");
      } else {
        await api.post('/teachers', payload);
        showToast("O'qituvchi qo'shildi");
      }
      setModalOpen(false);
      fetchAll();
    } catch (err) {
      showToast(err.response?.data?.message || 'Xatolik yuz berdi', 'error');
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/teachers/${deleteTarget._id}`);
      showToast("O'qituvchi o'chirildi");
      setDeleteTarget(null);
      fetchAll();
    } catch {
      showToast("O'chirishda xatolik", 'error');
    }
  };

  const openAdd = () => {
    setEditData(null);
    setModalOpen(true);
  };

  const openEdit = (teacher) => {
    setEditData(teacher);
    setModalOpen(true);
  };

  const salaryMap = {};
  salaryRows.forEach((row) => {
    const monthData = row.monthlyBreakdown?.find((item) => item.month === currentMonth) || {
      studentPayments: 0,
      shouldReceive: 0,
    };
    const alreadyPaid = row.paymentHistory
      ?.filter((payment) => payment.month === currentMonth)
      .reduce((sum, payment) => sum + payment.amount, 0) || 0;

    salaryMap[row._id] = {
      totalStudentPayments: monthData.studentPayments || 0,
      shouldReceive: monthData.shouldReceive || 0,
      alreadyPaid,
      balance: Math.max(0, (monthData.shouldReceive || 0) - alreadyPaid),
    };
  });

  const allSubjectOptions = Array.from(new Set(subjects.map((item) => item.name))).sort((left, right) => left.localeCompare(right));

  const filtered = [...teachers]
    .filter((teacher) => {
      const query = search.toLowerCase().trim();
      const matchesSearch = !query || (
        teacher.firstName.toLowerCase().includes(query)
        || teacher.lastName.toLowerCase().includes(query)
        || teacher.subject.toLowerCase().includes(query)
        || teacher.phone.includes(query)
        || (teacher.group?.name || '').toLowerCase().includes(query)
      );
      const matchesStatus = statusFilter === 'all' || teacher.status === statusFilter;
      const matchesSubject = !subjectFilter || teacher.subject === subjectFilter;
      return matchesSearch && matchesStatus && matchesSubject;
    })
    .sort((left, right) => {
      if (left.status !== right.status) return left.status === 'active' ? -1 : 1;
      return `${left.firstName} ${left.lastName}`.localeCompare(`${right.firstName} ${right.lastName}`);
    });

  const activeTeachers = teachers.filter((teacher) => teacher.status === 'active');
  const inactiveTeachers = teachers.filter((teacher) => teacher.status === 'inactive');
  const assignedTeachers = teachers.filter((teacher) => teacher.group).length;
  const percentTeachers = teachers.filter((teacher) => teacher.salaryType === 'percent').length;
  const fixedTeachers = teachers.filter((teacher) => teacher.salaryType === 'sum').length;
  const uniqueSubjects = Array.from(new Set(teachers.map((teacher) => teacher.subject).filter(Boolean)));

  const payrollTotals = teachers.reduce((accumulator, teacher) => {
    const snapshot = salaryMap[teacher._id] || {
      totalStudentPayments: 0,
      shouldReceive: 0,
      alreadyPaid: 0,
      balance: 0,
    };

    return {
      shouldReceive: accumulator.shouldReceive + snapshot.shouldReceive,
      alreadyPaid: accumulator.alreadyPaid + snapshot.alreadyPaid,
      balance: accumulator.balance + snapshot.balance,
    };
  }, {
    shouldReceive: 0,
    alreadyPaid: 0,
    balance: 0,
  });

  const assignmentRate = activeTeachers.length ? Math.round((assignedTeachers / activeTeachers.length) * 100) : 0;
  const topSubjects = Object.entries(
    teachers.reduce((accumulator, teacher) => {
      accumulator[teacher.subject] = (accumulator[teacher.subject] || 0) + 1;
      return accumulator;
    }, {})
  ).sort((left, right) => right[1] - left[1]).slice(0, 4);

  const statusButtons = [
    { value: 'all', label: 'Barchasi' },
    { value: 'active', label: 'Faol' },
    { value: 'inactive', label: 'Nofaol' },
  ];

  const salaryLabel = (teacher) => (
    teacher.salaryType === 'percent'
      ? `${teacher.salary}%`
      : `${fmt(teacher.salary)} so'm`
  );

  return (
    <div className="page-content teachers-page">
      {toast ? <div className={`toast toast--${toast.type}`}>{toast.text}</div> : null}

      <section className="teachers-hero">
        <div className="teachers-hero-main">
          <div className="teachers-hero-kicker">Akademik jamoa</div>
          <h1 className="teachers-hero-title">O'qituvchilar bo'limi</h1>
          <p className="teachers-hero-copy">
            Jamoani boshqarish, maosh holatini kuzatish va guruhlar bo'yicha yuklamani bir joydan nazorat qilish uchun yangilangan ko'rinish.
          </p>

          <div className="teachers-hero-actions">
            <button className="btn-add teachers-btn-add" onClick={openAdd}>
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Yangi o'qituvchi
            </button>
            <Link href="/dashboard/payments" className="teachers-ghost-btn">
              Maoshlar bo'limi
            </Link>
          </div>

          <div className="teachers-hero-strip">
            <div className="teachers-hero-strip-item">
              <span>Faol jamoa</span>
              <strong>{activeTeachers.length} ta</strong>
            </div>
            <div className="teachers-hero-strip-item">
              <span>Biriktirilgan guruhlar</span>
              <strong>{assignedTeachers} ta</strong>
            </div>
            <div className="teachers-hero-strip-item">
              <span>{monthLabel(currentMonth)}</span>
              <strong>{fmt(payrollTotals.balance)} so'm qoldiq</strong>
            </div>
          </div>
        </div>

        <div className="teachers-hero-side">
          <div className="teachers-payroll-box">
            <div className="teachers-panel-kicker">Joriy oy maoshi</div>
            <div className="teachers-payroll-amount">{fmt(payrollTotals.shouldReceive)} so'm</div>
            <div className="teachers-payroll-meta">To'langan: {fmt(payrollTotals.alreadyPaid)} so'm</div>
            <div className="teachers-payroll-track">
              <div
                className="teachers-payroll-fill"
                style={{ width: `${payrollTotals.shouldReceive ? Math.min(100, Math.round((payrollTotals.alreadyPaid / payrollTotals.shouldReceive) * 100)) : 0}%` }}
              />
            </div>
            <div className="teachers-payroll-foot">
              <span>Qoldiq</span>
              <strong>{fmt(payrollTotals.balance)} so'm</strong>
            </div>
          </div>

          <div className="teachers-subject-box">
            <div className="teachers-panel-kicker">Top yo'nalishlar</div>
            {topSubjects.length === 0 ? (
              <div className="teachers-subject-empty">Hali fanlar bo'yicha ma'lumot yo'q</div>
            ) : (
              <div className="teachers-subject-list">
                {topSubjects.map(([subject, count]) => (
                  <div key={subject} className="teachers-subject-row">
                    <span>{subject}</span>
                    <strong>{count} ta</strong>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="teachers-stat-grid">
        <article className="teacher-stat-card teacher-stat-card--blue">
          <div className="teacher-stat-icon teacher-stat-icon--blue">
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <div className="teacher-stat-label">Jami o'qituvchilar</div>
          <div className="teacher-stat-value">{teachers.length} ta</div>
          <p className="teacher-stat-meta">{activeTeachers.length} ta faol, {inactiveTeachers.length} ta nofaol</p>
        </article>

        <article className="teacher-stat-card teacher-stat-card--emerald">
          <div className="teacher-stat-icon teacher-stat-icon--emerald">
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <rect x="2" y="3" width="20" height="18" rx="2" />
              <path d="M3 7h18M3 12h18M3 17h18" />
            </svg>
          </div>
          <div className="teacher-stat-label">Guruh qamrovi</div>
          <div className="teacher-stat-value">{assignmentRate}%</div>
          <p className="teacher-stat-meta">{assignedTeachers} ta o'qituvchi guruhga biriktirilgan</p>
        </article>
        <article className="teacher-stat-card teacher-stat-card--amber">
          <div className="teacher-stat-icon teacher-stat-icon--amber">
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <line x1="12" y1="1" x2="12" y2="23" />
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </div>
          <div className="teacher-stat-label">Maosh modeli</div>
          <div className="teacher-stat-value">{percentTeachers} / {fixedTeachers}</div>
          <p className="teacher-stat-meta">Foizli va belgilangan maosh modeli nisbatlari</p>
        </article>

        <article className="teacher-stat-card teacher-stat-card--violet">
          <div className="teacher-stat-icon teacher-stat-icon--violet">
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
          </div>
          <div className="teacher-stat-label">Fanlar qamrovi</div>
          <div className="teacher-stat-value">{uniqueSubjects.length} ta</div>
          <p className="teacher-stat-meta">Jamoa qamrab olgan faol yo'nalishlar soni</p>
        </article>
      </section>

      <section className="teachers-toolbar-card">
        <div className="teachers-toolbar-head">
          <div>
            <h2 className="teachers-section-title">Jamoa rosteri</h2>
            <p className="teachers-section-subtitle">{filtered.length} ta natija ko'rsatilmoqda</p>
          </div>

          <select className="filter-select teachers-filter-select" value={subjectFilter} onChange={(event) => setSubjectFilter(event.target.value)}>
            <option value="">Barcha fanlar</option>
            {allSubjectOptions.map((subject) => (
              <option key={subject} value={subject}>{subject}</option>
            ))}
          </select>
        </div>

        <div className="teachers-filter-row">
          <div className="search-box teachers-search-box">
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="text"
              placeholder="Ism, fan, guruh yoki telefon bo'yicha qidiring..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <div className="teachers-status-tabs">
            {statusButtons.map((item) => (
              <button
                key={item.value}
                type="button"
                className={`teachers-status-tab${statusFilter === item.value ? ' teachers-status-tab--active' : ''}`}
                onClick={() => setStatusFilter(item.value)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="teachers-roster-card">
        {loading ? (
          <div className="table-empty">
            <div className="loading-spinner" style={{ margin: '0 auto' }} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="teachers-empty-state">
            <div className="teachers-empty-icon">
              <svg width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <h3>Natija topilmadi</h3>
            <p>{search || subjectFilter || statusFilter !== 'all' ? "Filtrlarni o'zgartirib qayta urinib ko'ring" : "Hali o'qituvchi qo'shilmagan"}</p>
          </div>
        ) : (
          <div className="teachers-grid">
            {filtered.map((teacher) => {
              const snapshot = salaryMap[teacher._id] || {
                totalStudentPayments: 0,
                shouldReceive: 0,
                alreadyPaid: 0,
                balance: 0,
              };
              const progress = snapshot.shouldReceive
                ? Math.min(100, Math.round((snapshot.alreadyPaid / snapshot.shouldReceive) * 100))
                : 0;

              return (
                <article key={teacher._id} className={`teacher-profile-card${teacher.status === 'inactive' ? ' teacher-profile-card--muted' : ''}`}>
                  <div className="teacher-card-head">
                    <div className="teacher-card-person">
                      <div className={`teacher-card-avatar teacher-card-avatar--${teacher.status}`}>
                        {teacher.firstName[0]}{teacher.lastName[0]}
                      </div>
                      <div>
                        <div className="teacher-card-name">{teacher.firstName} {teacher.lastName}</div>
                        <div className="teacher-card-badges">
                          <span className="teacher-subject-pill">{teacher.subject}</span>
                          <span className={`status-badge status-badge--${teacher.status}`}>
                            {teacher.status === 'active' ? 'Faol' : 'Nofaol'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="td-actions teacher-card-actions">
                      <button className="btn-icon btn-icon--view" onClick={() => setViewData(teacher)} title="Ko'rish">
                        <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      </button>
                      <button className="btn-icon btn-icon--edit" onClick={() => openEdit(teacher)} title="Tahrirlash">
                        <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>
                      <button className="btn-icon btn-icon--delete" onClick={() => setDeleteTarget(teacher)} title="O'chirish">
                        <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                          <path d="M10 11v6M14 11v6" />
                          <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  <div className="teacher-card-grid">
                    <div className="teacher-card-info">
                      <span>Telefon</span>
                      <strong>{teacher.phone}</strong>
                    </div>
                    <div className="teacher-card-info">
                      <span>Guruh</span>
                      <strong>{teacher.group?.name || 'Biriktirilmagan'}</strong>
                    </div>
                    <div className="teacher-card-info">
                      <span>Maosh</span>
                      <strong>{salaryLabel(teacher)}</strong>
                    </div>
                    <div className="teacher-card-info">
                      <span>Turi</span>
                      <strong>{teacher.salaryType === 'percent' ? 'Foizli' : 'Belgilangan'}</strong>
                    </div>
                  </div>
