'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import api from '../../../lib/api';

const DAYS_OPTIONS = [
  { value: 'Du-Cho-Ju', label: 'Du · Cho · Ju' },
  { value: 'Se-Pay-Sha', label: 'Se · Pay · Sha' },
  { value: 'Har kuni', label: 'Har kuni' },
  { value: 'Dam olish', label: 'Dam olish kunlari' },
];

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('ru-RU');
}

// ── Students View Modal ───────────────────────────────────────────────
function StudentsViewModal({ group, onClose }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    if (!group) return;
    api.get('/students')
      .then((res) => {
        const inGroup = res.data.data.filter(
          (s) => s.group && (s.group._id === group._id || s.group === group._id)
        );
        setStudents(inGroup);
      })
      .catch(() => setStudents([]))
      .finally(() => setLoading(false));
  }, [group]);

  if (!group) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box modal-box--students" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3>{group.name} — O'quvchilar</h3>
            <p style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 2 }}>
              {loading ? 'Yuklanmoqda…' : `${students.length} ta o'quvchi`}
            </p>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="students-list-body">
          {loading ? (
            <div className="table-empty">
              <div className="loading-spinner" style={{ margin: '0 auto' }} />
            </div>
          ) : students.length === 0 ? (
            <div className="table-empty">
              <div className="table-empty-icon">👤</div>
              <div className="table-empty-text">Bu guruhda o'quvchi yo'q</div>
            </div>
          ) : (
            students.map((s, i) => (
              <div key={s._id} className="student-list-row">
                <span className="student-list-num">{i + 1}</span>
                <div className="td-avatar td-avatar--teal" style={{ flexShrink: 0 }}>
                  {s.firstName[0].toUpperCase()}
                </div>
                <div className="student-list-info">
                  <span className="student-list-name">{s.firstName} {s.lastName}</span>
                  <span className="student-list-phone">{s.phone}</span>
                </div>
                <span className={`status-badge status-badge--${s.status}`}>
                  {s.status === 'active' ? 'Faol' : 'Nofaol'}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ── Students Manage Modal ─────────────────────────────────────────────
function StudentsManageModal({ group, onClose, onSaved, showToast }) {
  const [allStudents, setAllStudents] = useState([]);
  const [checked, setChecked]         = useState(new Set());
  const [initial, setInitial]         = useState(new Set());
  const [loading, setLoading]         = useState(true);
  const [saving, setSaving]           = useState(false);
  const [search, setSearch]           = useState('');

  useEffect(() => {
    if (!group) return;
    api.get('/students').then((res) => {
      const all = res.data.data;
      setAllStudents(all);
      const inGroup = new Set(
        all.filter((s) => s.group && (s.group._id === group._id || s.group === group._id))
           .map((s) => s._id)
      );
      setChecked(new Set(inGroup));
      setInitial(new Set(inGroup));
    }).catch(() => {}).finally(() => setLoading(false));
  }, [group]);

  const toggle = (id) => {
    setChecked((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const toAdd    = [...checked].filter((id) => !initial.has(id));
      const toRemove = [...initial].filter((id) => !checked.has(id));

      await Promise.all([
        ...toAdd.map((id)    => api.put(`/students/${id}`, { group: group._id })),
        ...toRemove.map((id) => api.put(`/students/${id}`, { group: null })),
      ]);

      showToast("O'quvchilar saqlandi");
      onSaved();
      onClose();
    } catch {
      showToast("Saqlashda xatolik", 'error');
    } finally {
      setSaving(false);
    }
  };

  if (!group) return null;

  const filtered = allStudents.filter((s) => {
    const q = search.toLowerCase();
    return `${s.firstName} ${s.lastName}`.toLowerCase().includes(q) ||
           s.phone.includes(q);
  });

  const changedCount = [...checked].filter((id) => !initial.has(id)).length +
                       [...initial].filter((id) => !checked.has(id)).length;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box modal-box--students" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3>{group.name} — O'quvchilarni boshqarish</h3>
            <p style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 2 }}>
              {checked.size} ta tanlangan{changedCount > 0 ? ` · ${changedCount} ta o'zgarish` : ''}
            </p>
          </div>
          <button className="modal-close" onClick={onClose} disabled={saving}>✕</button>
        </div>

        {/* Search */}
        <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--gray-100)' }}>
          <div className="search-box" style={{ width: '100%' }}>
            <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="text"
              placeholder="Ism yoki telefon..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="students-list-body">
          {loading ? (
            <div className="table-empty">
              <div className="loading-spinner" style={{ margin: '0 auto' }} />
            </div>
          ) : filtered.length === 0 ? (
            <div className="table-empty">
              <div className="table-empty-text">Natija topilmadi</div>
            </div>
          ) : (
            filtered.map((s) => {
              const isChecked = checked.has(s._id);
              const wasChecked = initial.has(s._id);
              const changed = isChecked !== wasChecked;
              return (
                <label key={s._id} className={`student-manage-row${isChecked ? ' student-manage-row--checked' : ''}${changed ? ' student-manage-row--changed' : ''}`}>
                  <input
                    type="checkbox"
                    className="student-manage-checkbox"
                    checked={isChecked}
                    onChange={() => toggle(s._id)}
                  />
                  <div className="td-avatar td-avatar--teal" style={{ flexShrink: 0 }}>
                    {s.firstName[0].toUpperCase()}
                  </div>
                  <div className="student-list-info">
                    <span className="student-list-name">{s.firstName} {s.lastName}</span>
                    <span className="student-list-phone">
                      {s.phone}
                      {s.group && !isChecked && s.group.name && s.group._id !== group._id
                        ? <span className="student-other-group"> · {s.group.name}</span>
                        : null}
                    </span>
                  </div>
                  {changed && (
                    <span className={`manage-change-badge ${isChecked ? 'manage-change-badge--add' : 'manage-change-badge--remove'}`}>
                      {isChecked ? "+ Qo'shildi" : "− Chiqarildi"}
                    </span>
                  )}
                </label>
              );
            })
          )}
        </div>

        <div className="modal-footer">
          <button className="btn-cancel" onClick={onClose} disabled={saving}>Bekor qilish</button>
          <button
            className="btn-save"
            onClick={handleSave}
            disabled={saving || changedCount === 0}
          >
            {saving ? 'Saqlanmoqda…' : `Saqlash${changedCount > 0 ? ` (${changedCount})` : ''}`}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Debtors View Modal ────────────────────────────────────────────────
function DebtorsViewModal({ group, onClose }) {
  const [debtors, setDebtors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!group) return;
    api.get('/debtors')
      .then((res) => {
        const inGroup = res.data.data.filter(
          (d) => d.group && (d.group._id === group._id || d.group === group._id)
        );
        setDebtors(inGroup);
      })
      .catch(() => setDebtors([]))
      .finally(() => setLoading(false));
  }, [group]);

  if (!group) return null;

  const totalDebt = debtors.reduce((sum, d) => sum + (d.debt || 0), 0);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box modal-box--students" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3>{group.name} — Qarzdorlar</h3>
            <p style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 2 }}>
              {loading ? 'Yuklanmoqda…' : `${debtors.length} ta qarzdor`}
            </p>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="students-list-body">
          {loading ? (
            <div className="table-empty">
              <div className="loading-spinner" style={{ margin: '0 auto' }} />
            </div>
          ) : debtors.length === 0 ? (
            <div className="table-empty">
              <div className="table-empty-icon">✅</div>
              <div className="table-empty-text">Bu guruhda barcha o'quvchilar to'lagan!</div>
            </div>
          ) : (
            debtors.map((d, i) => (
              <div key={d._id} className="student-list-row debtor-list-row">
                <span className="student-list-num">{i + 1}</span>
                <div className="td-avatar td-avatar--red" style={{ flexShrink: 0 }}>
                  {d.firstName[0].toUpperCase()}
                </div>
                <div className="student-list-info">
                  <span className="student-list-name">{d.firstName} {d.lastName}</span>
                  <span className="student-list-phone">{d.phone}</span>
                </div>
                <span className="debt-amount">
                  {Number(d.debt || 0).toLocaleString('uz-UZ')} so'm
                </span>
              </div>
            ))
          )}
        </div>

        {!loading && debtors.length > 0 && (
          <div className="debtors-modal-footer">
            <span className="debtors-total-label">Jami qarz:</span>
            <span className="debtors-total-value">{Number(totalDebt).toLocaleString('uz-UZ')} so'm</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Quick Add Student Modal ───────────────────────────────────────────
function QuickAddStudentModal({ group, onClose, onSaved, showToast }) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (group) reset({ firstName: '', lastName: '', phone: '', parentPhone: '' });
  }, [group, reset]);

  if (!group) return null;

  const handleSave = async (data) => {
    if (saving) return;
    setSaving(true);
    try {
      await api.post('/students', {
        firstName:   data.firstName.trim(),
        lastName:    data.lastName.trim(),
        phone:       data.phone.trim(),
        parentPhone: data.parentPhone?.trim() || '',
        group:       group._id,
        status:      'active',
      });
      showToast("O'quvchi qo'shildi");
      onSaved();
      onClose();
    } catch (err) {
      showToast(err.response?.data?.message || 'Xatolik yuz berdi', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box modal-box--sm" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3>Yangi o'quvchi qo'shish</h3>
            <p style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 2 }}>{group.name}</p>
          </div>
          <button className="modal-close" onClick={onClose} disabled={saving}>✕</button>
        </div>
        <form onSubmit={handleSubmit(handleSave)}>
          <div className="modal-body">
            <div className="modal-row">
              <div className="field">
                <label>Ism</label>
                <input type="text" placeholder="Ali"
                  className={errors.firstName ? 'err' : ''}
                  {...register('firstName', { required: 'Majburiy' })} />
                {errors.firstName && <span className="field-err">{errors.firstName.message}</span>}
              </div>
              <div className="field">
                <label>Familiya</label>
                <input type="text" placeholder="Valiyev"
                  className={errors.lastName ? 'err' : ''}
                  {...register('lastName', { required: 'Majburiy' })} />
                {errors.lastName && <span className="field-err">{errors.lastName.message}</span>}
              </div>
            </div>
            <div className="field">
              <label>Telefon</label>
              <input type="text" placeholder="+998 90 123 45 67"
                className={errors.phone ? 'err' : ''}
                {...register('phone', { required: 'Majburiy' })} />
              {errors.phone && <span className="field-err">{errors.phone.message}</span>}
            </div>
            <div className="field">
              <label>Ota-ona telefoni <span style={{ color: 'var(--gray-400)', fontWeight: 400 }}>(ixtiyoriy)</span></label>
              <input type="text" placeholder="+998 90 000 00 00"
                {...register('parentPhone')} />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-cancel" onClick={onClose} disabled={saving}>Bekor qilish</button>
            <button type="submit" className="btn-save" disabled={saving}>
              {saving ? 'Qo\'shilmoqda…' : "Qo'shish"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── View Modal (guruh haqida) ─────────────────────────────────────────
function ViewModal({ group, onClose, debtorCount, onStudentsView, onStudentsManage, onAddStudent, onDebtorsView }) {
  if (!group) return null;

  const rows = [
    {
      icon: (
        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
      label: "O'quvchilar soni",
      value: `${group.studentCount ?? 0} ta`,
      color: 'blue',
      actions: (
        <div style={{ display: 'flex', gap: 5, marginLeft: 'auto' }}>
          <button
            className="btn-icon-xs btn-icon-xs--view"
            title="O'quvchilarni ko'rish"
            onClick={() => { onClose(); onStudentsView(group); }}
          >
            <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </button>
          <button
            className="btn-icon-xs btn-icon-xs--edit"
            title="O'quvchilarni boshqarish"
            onClick={() => { onClose(); onStudentsManage(group); }}
          >
            <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
          <button
            className="btn-icon-xs btn-icon-xs--add"
            title="Yangi o'quvchi qo'shish"
            onClick={() => { onClose(); onAddStudent(group); }}
          >
            <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
        </div>
      ),
    },
    {
      icon: (
        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <line x1="12" y1="1" x2="12" y2="23" />
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      ),
      label: 'Guruh narxi',
      value: group.price ? `${Number(group.price).toLocaleString('uz-UZ')} so'm / oy` : 'Belgilanmagan',
      color: 'gold',
    },
    {
      icon: (
        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      ),
      label: 'Guruh ochilgan sana',
      value: formatDate(group.createdAt),
      color: 'navy',
    },
    {
      icon: (
        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      ),
      label: "Qarzdor o'quvchilar",
      value: debtorCount === null ? 'Yuklanmoqda…' : `${debtorCount} ta`,
      color: 'red',
      actions: debtorCount > 0 ? (
        <div style={{ marginLeft: 'auto' }}>
          <button
            className="btn-icon-xs btn-icon-xs--red"
            title="Qarzdorlarni ko'rish"
            onClick={() => { onClose(); onDebtorsView(group); }}
          >
            <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </button>
        </div>
      ) : null,
    },
    {
      icon: (
        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      ),
      label: 'Kunlar va vaqt',
      value: group.days
        ? `${group.days}${group.startTime && group.endTime ? ` · ${group.startTime}вЂ“${group.endTime}` : ''}`
        : '—',
      color: 'teal',
    },
    {
      icon: (
        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      ),
      label: "O'qituvchi",
      value: group.teacher
        ? `${group.teacher.firstName} ${group.teacher.lastName}`
        : 'Tayinlanmagan',
      color: 'navy',
    },
    {
      icon: (
        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
          <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
        </svg>
      ),
      label: 'Fan',
      value: group.subject,
      color: 'green',
    },
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box modal-box--view" onClick={(e) => e.stopPropagation()}>
        <div className="view-modal-header">
          <div className="view-modal-avatar">{group.name[0].toUpperCase()}</div>
          <div className="view-modal-title-wrap">
            <h3 className="view-modal-title">{group.name}</h3>
            <span className={`status-badge status-badge--${group.status}`}>
              {group.status === 'active' ? 'Faol' : 'Nofaol'}
            </span>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="view-modal-body">
          {rows.map((row, i) => (
            <div key={i} className="view-info-row">
              <div className={`view-info-icon view-info-icon--${row.color}`}>{row.icon}</div>
              <div className="view-info-content">
                <span className="view-info-label">{row.label}</span>
                <span className="view-info-value">{row.value}</span>
              </div>
              {row.actions || null}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Group Modal (qo'shish/tahrirlash) ────────────────────────────────
function GroupModal({ open, onClose, onSave, editData, teachers, subjects, isSaving }) {
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm();

  useEffect(() => {
    if (!open) return;
    if (editData) {
      reset({
        name:      editData.name,
        subject:   editData.subject,
        teacher:   editData.teacher?._id || editData.teacher || '',
        days:      editData.days || '',
        startTime: editData.startTime || '',
        endTime:   editData.endTime || '',
        price:     editData.price || '',
        status:    editData.status,
      });
    } else {
      reset({ name: '', subject: '', teacher: '', days: '', startTime: '', endTime: '', price: '', status: 'active' });
    }
  }, [editData, open, reset]);

  const selectedSubject = watch('subject');
  const selectedTeacherId = watch('teacher');
  const compatibleTeachers = teachers.filter((teacher) => {
    const isCurrentTeacher = selectedTeacherId && teacher._id === selectedTeacherId;
    const sameSubject = !selectedSubject || teacher.subject === selectedSubject;
    const isAvailable = !teacher.group || teacher.group._id === editData?._id || isCurrentTeacher;
    const isActiveTeacher = teacher.status === 'active' || isCurrentTeacher;
    return sameSubject && isAvailable && isActiveTeacher;
  });

  useEffect(() => {
    if (!open || !selectedTeacherId) return;
    if (!compatibleTeachers.some((teacher) => teacher._id === selectedTeacherId)) {
      setValue('teacher', '');
    }
  }, [compatibleTeachers, open, selectedTeacherId, setValue]);

  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{editData ? 'Guruhni tahrirlash' : "Yangi guruh qo'shish"}</h3>
          <button className="modal-close" onClick={onClose} disabled={isSaving}>✕</button>
        </div>
        <form onSubmit={handleSubmit(onSave)}>
          <div className="modal-body">
            <div className="field">
              <label>Guruh nomi</label>
              <input type="text" placeholder="Masalan: Ingliz tili — Boshlang'ich"
                className={errors.name ? 'err' : ''}
                {...register('name', { required: 'Guruh nomi majburiy', validate: v => v.trim().length > 0 || 'Majburiy' })} />
              {errors.name && <span className="field-err">{errors.name.message}</span>}
            </div>
            <div className="modal-row">
              <div className="field">
                <label>Fan</label>
                <select className={errors.subject ? 'err' : ''}
                  {...register('subject', { required: 'Majburiy' })}>
                  <option value="">Tanlang</option>
                  {subjects.map((s) => <option key={s._id} value={s.name}>{s.name}</option>)}
                </select>
                {errors.subject && <span className="field-err">{errors.subject.message}</span>}
              </div>
              <div className="field">
                <label>O'qituvchi</label>
                <select {...register('teacher')}>
                  <option value="">— Tanlang —</option>
                  {compatibleTeachers.map((teacher) => (
                    <option key={teacher._id} value={teacher._id}>{teacher.firstName} {teacher.lastName}</option>
                  ))}
                </select>
                {teachers.length > 0 && compatibleTeachers.length === 0 && selectedSubject && (
                  <span className="field-err" style={{ display: 'inline-block', marginTop: 8 }}>
                    Tanlangan fan uchun mos faol o'qituvchi yo'q.
                  </span>
                )}
              </div>
            </div>
            <div className="modal-row">
              <div className="field">
                <label>Dars kunlari</label>
                <select {...register('days')}>
                  <option value="">— Tanlang —</option>
                  {DAYS_OPTIONS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
                </select>
              </div>
              <div className="field">
                <label>Status</label>
                <select {...register('status')}>
                  <option value="active">Faol</option>
                  <option value="inactive">Nofaol</option>
                </select>
              </div>
            </div>
            <div className="modal-row">
              <div className="field">
                <label>Boshlanish vaqti</label>
                <input type="time" {...register('startTime')} />
              </div>
              <div className="field">
                <label>Tugash vaqti</label>
                <input type="time" {...register('endTime')} />
              </div>
            </div>
            <div className="field">
              <label>Oylik to'lov (so'm)</label>
              <div className="salary-input-wrap">
                <input type="number" placeholder="500 000" min={0}
                  {...register('price', { min: { value: 0, message: "0 dan katta bo'lsin" } })} />
                <span className="salary-suffix">so'm</span>
              </div>
              {errors.price && <span className="field-err">{errors.price.message}</span>}
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-cancel" onClick={onClose} disabled={isSaving}>Bekor qilish</button>
            <button type="submit" className="btn-save" disabled={isSaving}>
              {isSaving ? 'Saqlanmoqda…' : editData ? 'Saqlash' : "Qo'shish"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Delete Confirm ────────────────────────────────────────────────────
function DeleteModal({ name, onConfirm, onClose, isDeleting }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box modal-box--sm" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>O'chirishni tasdiqlash</h3>
          <button className="modal-close" onClick={onClose} disabled={isDeleting}>✕</button>
        </div>
        <div className="modal-body">
          <p className="delete-text"><strong>{name}</strong> guruhini o'chirishni tasdiqlaysizmi?</p>
          <p className="delete-text" style={{ marginTop: 8, fontSize: 12, color: '#c0392b' }}>
            Guruhni o'chirish uchun undagi barcha o'quvchilar boshqa guruhga o'tkazilgan bo'lishi kerak.
          </p>
        </div>
        <div className="modal-footer">
          <button className="btn-cancel" onClick={onClose} disabled={isDeleting}>Bekor qilish</button>
          <button className="btn-delete" onClick={onConfirm} disabled={isDeleting}>
            {isDeleting ? "O'chirilmoqda…" : "Ha, o'chirish"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────
export default function GroupsPage() {
  const [groups, setGroups]             = useState([]);
  const [teachers, setTeachers]         = useState([]);
  const [subjects, setSubjects]         = useState([]);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [modalOpen, setModalOpen]       = useState(false);
  const [editData, setEditData]         = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [viewTarget, setViewTarget]     = useState(null);
  const [debtorCount, setDebtorCount]   = useState(null);
  const [studentsView, setStudentsView]     = useState(null); // ko'z: o'quvchilar ro'yxati
  const [studentsManage, setStudentsManage] = useState(null); // qalam: o'quvchilarni boshqarish
  const [addStudentGroup, setAddStudentGroup] = useState(null); // +: yangi o'quvchi qo'shish
  const [debtorsView, setDebtorsView]         = useState(null); // qarzdorlar ro'yxati
  const [isSaving, setIsSaving]         = useState(false);
  const [isDeleting, setIsDeleting]     = useState(false);
  const [toast, setToast]               = useState(null);

  const showToast = useCallback((text, type = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const fetchAll = useCallback(async () => {
    try {
      const [gRes, tRes, sRes] = await Promise.all([
        api.get('/groups'),
        api.get('/teachers'),
        api.get('/subjects'),
      ]);
      setGroups(gRes.data.data);
      setTeachers(tRes.data.data);
      setSubjects(sRes.data.data.filter((s) => s.status === 'active'));
    } catch {
      showToast("Ma'lumotlarni yuklashda xatolik", 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  useEffect(() => {
    if (!viewTarget) return;
    setDebtorCount(null);
    api.get('/debtors')
      .then((res) => {
        const count = res.data.data.filter(
          (d) => d.group && (d.group._id === viewTarget._id || d.group === viewTarget._id)
        ).length;
        setDebtorCount(count);
      })
      .catch(() => setDebtorCount(0));
  }, [viewTarget]);

  const handleSave = async (data) => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      const payload = { ...data, name: data.name.trim(), price: Number(data.price) || 0, teacher: data.teacher || null };
      if (editData) {
        await api.put(`/groups/${editData._id}`, payload);
        showToast('Guruh yangilandi');
      } else {
        await api.post('/groups', payload);
        showToast("Guruh qo'shildi");
      }
      setModalOpen(false);
      setEditData(null);
      fetchAll();
    } catch (err) {
      showToast(err.response?.data?.message || 'Xatolik yuz berdi', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (isDeleting) return;
    setIsDeleting(true);
    try {
      await api.delete(`/groups/${deleteTarget._id}`);
      showToast("Guruh o'chirildi");
      setDeleteTarget(null);
      fetchAll();
    } catch (err) {
      showToast(err.response?.data?.message || "O'chirishda xatolik", 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const filtered = groups.filter((g) => {
    const q = search.toLowerCase();
    const matchSearch =
      g.name.toLowerCase().includes(q) ||
      g.subject.toLowerCase().includes(q) ||
      (g.teacher && `${g.teacher.firstName} ${g.teacher.lastName}`.toLowerCase().includes(q));
    return matchSearch && (filterStatus === 'all' || g.status === filterStatus);
  });

  const activeCount   = groups.filter((g) => g.status === 'active').length;
  const inactiveCount = groups.filter((g) => g.status === 'inactive').length;
  const totalStudents = groups.reduce((sum, g) => sum + (g.studentCount || 0), 0);

  return (
    <div className="page-content">
      {toast && <div className={`toast toast--${toast.type}`}>{toast.text}</div>}

      <div className="page-header">
        <div>
          <h1 className="page-title">Guruhlar</h1>
          <p className="page-subtitle">Jami: {groups.length} ta guruh · {totalStudents} ta o'quvchi</p>
        </div>
        <button className="btn-add" onClick={() => { setEditData(null); setModalOpen(true); }}>
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Qo'shish
        </button>
      </div>

      {/* Stats */}
      <div className="group-stats">
        <div className={`group-stat-item${filterStatus === 'all' ? ' active' : ''}`} onClick={() => setFilterStatus('all')}>
          <span className="group-stat-num">{groups.length}</span>
          <span className="group-stat-label">Hammasi</span>
        </div>
        <div className={`group-stat-item group-stat-item--green${filterStatus === 'active' ? ' active' : ''}`} onClick={() => setFilterStatus('active')}>
          <span className="group-stat-num">{activeCount}</span>
          <span className="group-stat-label">Faol</span>
        </div>
        <div className={`group-stat-item group-stat-item--gray${filterStatus === 'inactive' ? ' active' : ''}`} onClick={() => setFilterStatus('inactive')}>
          <span className="group-stat-num">{inactiveCount}</span>
          <span className="group-stat-label">Nofaol</span>
        </div>
      </div>

      {/* Search */}
      <div className="table-toolbar">
        <div className="search-box">
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input type="text" placeholder="Guruh nomi, fan yoki o'qituvchi..."
            value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      {/* Table */}
      <div className="table-card">
        {loading ? (
          <div className="table-empty"><div className="loading-spinner" style={{ margin: '0 auto' }} /></div>
        ) : filtered.length === 0 ? (
          <div className="table-empty">
            <div className="table-empty-icon">📚</div>
            <div className="table-empty-text">
              {search || filterStatus !== 'all' ? 'Natija topilmadi' : "Hali guruh qo'shilmagan"}
            </div>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Guruh nomi</th>
                <th>O'qituvchi</th>
                <th>O'quvchilar</th>
                <th>Status</th>
                <th>Harakatlar</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((g, i) => (
                <tr key={g._id}>
                  <td className="td-num">{i + 1}</td>
                  <td>
                    <div className="td-user">
                      <div className="td-avatar td-avatar--gold">{g.name[0].toUpperCase()}</div>
                      <div>
                        <div style={{ fontWeight: 600 }}>{g.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 2 }}>{g.subject}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    {g.teacher
                      ? <span>{g.teacher.firstName} {g.teacher.lastName}</span>
                      : <span className="td-empty">—</span>}
                  </td>
                  <td>
                    <span className="group-student-count">{g.studentCount || 0} ta</span>
                  </td>
                  <td>
                    <span className={`status-badge status-badge--${g.status}`}>
                      {g.status === 'active' ? 'Faol' : 'Nofaol'}
                    </span>
                  </td>
                  <td>
                    <div className="td-actions">
                      <button className="btn-icon btn-icon--view" onClick={() => setViewTarget(g)} title="Ko'rish">
                        <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      </button>
                      <button className="btn-icon btn-icon--edit" onClick={() => { setEditData(g); setModalOpen(true); }} title="Tahrirlash">
                        <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>
                      <button className="btn-icon btn-icon--delete" onClick={() => setDeleteTarget(g)} title="O'chirish">
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
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modals */}
      <StudentsViewModal
        group={studentsView}
        onClose={() => setStudentsView(null)}
      />

      <StudentsManageModal
        group={studentsManage}
        onClose={() => setStudentsManage(null)}
        onSaved={fetchAll}
        showToast={showToast}
      />

      <ViewModal
        group={viewTarget}
        onClose={() => setViewTarget(null)}
        debtorCount={debtorCount}
        onStudentsView={(g) => setStudentsView(g)}
        onStudentsManage={(g) => setStudentsManage(g)}
        onAddStudent={(g) => setAddStudentGroup(g)}
        onDebtorsView={(g) => setDebtorsView(g)}
      />

      <DebtorsViewModal
        group={debtorsView}
        onClose={() => setDebtorsView(null)}
      />

      <QuickAddStudentModal
        group={addStudentGroup}
        onClose={() => setAddStudentGroup(null)}
        onSaved={fetchAll}
        showToast={showToast}
      />

      <GroupModal
        open={modalOpen}
        onClose={() => { if (!isSaving) { setModalOpen(false); setEditData(null); } }}
        onSave={handleSave}
        editData={editData}
        teachers={teachers}
        subjects={subjects}
        isSaving={isSaving}
      />

      {deleteTarget && (
        <DeleteModal
          name={deleteTarget.name}
          onConfirm={handleDelete}
          onClose={() => { if (!isDeleting) setDeleteTarget(null); }}
          isDeleting={isDeleting}
        />
      )}
    </div>
  );
}


