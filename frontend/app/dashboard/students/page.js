'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
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

function PhoneInput({ value, onChange, onKeyDown, placeholder, className }) {
  return (
    <input
      type="tel"
      value={value}
      onChange={onChange}
      onKeyDown={onKeyDown}
      onFocus={(e) => { const l = e.target.value.length; e.target.setSelectionRange(l, l); }}
      placeholder={placeholder || '+998-__-___-__-__'}
      className={className}
    />
  );
}

// ── Modal ─────────────────────────────────────────────────────────────
function StudentModal({ open, onClose, onSave, editData, groups }) {
  const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm();
  const [phoneDisplay, setPhoneDisplay]       = useState('+998-');
  const [parentPhoneDisplay, setParentPhoneDisplay] = useState('+998-');

  useEffect(() => {
    if (!open) return;
    if (editData) {
      reset({
        firstName:   editData.firstName,
        lastName:    editData.lastName,
        group:       editData.group?._id || editData.group || '',
        birthDate:   editData.birthDate ? editData.birthDate.slice(0, 10) : '',
        status:      editData.status,
      });
      setPhoneDisplay(editData.phone || '+998-');
      setValue('phone', editData.phone || '');
      setParentPhoneDisplay(editData.parentPhone || '+998-');
      setValue('parentPhone', editData.parentPhone || '');
    } else {
      reset({ firstName: '', lastName: '', group: '', birthDate: '', status: 'active' });
      setPhoneDisplay('+998-');
      setValue('phone', '');
      setParentPhoneDisplay('+998-');
      setValue('parentPhone', '');
    }
  }, [open, editData]);

  const makePhoneHandler = (setDisplay, fieldName) => (e) => {
    const formatted = formatPhone(e.target.value);
    setDisplay(formatted);
    const digits = e.target.value.replace(/\D/g, '');
    const local = digits.startsWith('998') ? digits.slice(3, 12) : digits.slice(0, 9);
    setValue(fieldName, '+998' + local, { shouldValidate: true });
  };

  const makeKeyDown = (display) => (e) => {
    if (e.key === 'Backspace' && display === '+998-') e.preventDefault();
  };

  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{editData ? "O'quvchini tahrirlash" : "Yangi o'quvchi qo'shish"}</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit(onSave)}>
          <input type="hidden" {...register('phone', {
            validate: (v) => (v && v.replace(/\D/g, '').length === 12) || "To'liq raqam kiriting"
          })} />
          <input type="hidden" {...register('parentPhone')} />

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
            <div className="modal-row">
              <div className="field">
                <label>Telefon raqam</label>
                <PhoneInput
                  value={phoneDisplay}
                  onChange={makePhoneHandler(setPhoneDisplay, 'phone')}
                  onKeyDown={makeKeyDown(phoneDisplay)}
                  className={errors.phone ? 'err' : ''}
                />
                {errors.phone && <span className="field-err">{errors.phone.message}</span>}
              </div>
              <div className="field">
                <label>Ota-ona telefoni</label>
                <PhoneInput
                  value={parentPhoneDisplay}
                  onChange={makePhoneHandler(setParentPhoneDisplay, 'parentPhone')}
                  onKeyDown={makeKeyDown(parentPhoneDisplay)}
                  placeholder="+998-__-___-__-__"
                />
              </div>
            </div>

            {/* Guruh / Tug'ilgan sana */}
            <div className="modal-row">
              <div className="field">
                <label>Guruh</label>
                <select {...register('group')}>
                  <option value="">— Tanlang —</option>
                  {groups.map((g) => (
                    <option key={g._id} value={g._id}>{g.name} ({g.subject})</option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>Tug'ilgan sana</label>
                <input type="date" {...register('birthDate')}
                  style={{ width: '100%', padding: '11px 14px', border: '1.5px solid var(--gray-200)', borderRadius: 8, fontSize: 14, color: 'var(--navy)', background: 'var(--gray-50)', outline: 'none' }} />
              </div>
            </div>

            {/* Status */}
            <div className="field">
              <label>Status</label>
              <select {...register('status')}>
                <option value="active">Faol</option>
                <option value="inactive">Nofaol</option>
              </select>
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
function DeleteModal({ name, onConfirm, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box modal-box--sm" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>O'chirishni tasdiqlash</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <p className="delete-text"><strong>{name}</strong> ni o'chirishni tasdiqlaysizmi?</p>
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
export default function StudentsPage() {
  const [students, setStudents]         = useState([]);
  const [groups, setGroups]             = useState([]);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState('');
  const [filterGroup, setFilterGroup]   = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [modalOpen, setModalOpen]       = useState(false);
  const [editData, setEditData]         = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [toast, setToast]               = useState(null);

  const showToast = (text, type = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchAll = async () => {
    try {
      const [sRes, gRes] = await Promise.all([api.get('/students'), api.get('/groups')]);
      setStudents(sRes.data.data);
      setGroups(gRes.data.data);
    } catch {
      showToast("Ma'lumotlarni yuklashda xatolik", 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const handleSave = async (data) => {
    try {
      const payload = { ...data, group: data.group || null };
      if (editData) {
        await api.put(`/students/${editData._id}`, payload);
        showToast("O'quvchi yangilandi");
      } else {
        await api.post('/students', payload);
        showToast("O'quvchi qo'shildi");
      }
      setModalOpen(false);
      fetchAll();
    } catch (err) {
      showToast(err.response?.data?.message || 'Xatolik yuz berdi', 'error');
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/students/${deleteTarget._id}`);
      showToast("O'quvchi o'chirildi");
      setDeleteTarget(null);
      fetchAll();
    } catch {
      showToast("O'chirishda xatolik", 'error');
    }
  };

  const filtered = students.filter((s) => {
    const q = search.toLowerCase();
    const matchSearch =
      s.firstName.toLowerCase().includes(q) ||
      s.lastName.toLowerCase().includes(q)  ||
      s.phone.includes(q)                    ||
      (s.group && s.group.name.toLowerCase().includes(q));
    const matchGroup  = filterGroup  === 'all' || s.group?._id === filterGroup;
    const matchStatus = filterStatus === 'all' || s.status === filterStatus;
    return matchSearch && matchGroup && matchStatus;
  });

  const activeCount = students.filter((s) => s.status === 'active').length;

  const formatAge = (birthDate) => {
    if (!birthDate) return '—';
    const age = Math.floor((Date.now() - new Date(birthDate)) / (365.25 * 24 * 3600 * 1000));
    return `${age} yosh`;
  };

  return (
    <div className="page-content">
      {toast && <div className={`toast toast--${toast.type}`}>{toast.text}</div>}

      <div className="page-header">
        <div>
          <h1 className="page-title">O'quvchilar</h1>
          <p className="page-subtitle">Jami: {students.length} ta · Faol: {activeCount} ta</p>
        </div>
        <button className="btn-add" onClick={() => { setEditData(null); setModalOpen(true); }}>
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Qo'shish
        </button>
      </div>

      {/* Filter qatori */}
      <div className="filter-bar">
        <div className="search-box">
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input type="text" placeholder="Ism yoki telefon..."
            value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        <select className="filter-select"
          value={filterGroup} onChange={(e) => setFilterGroup(e.target.value)}>
          <option value="all">Barcha guruhlar</option>
          {groups.map((g) => <option key={g._id} value={g._id}>{g.name}</option>)}
        </select>

        <select className="filter-select"
          value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="all">Barcha status</option>
          <option value="active">Faol</option>
          <option value="inactive">Nofaol</option>
        </select>
      </div>

      {/* Jadval */}
      <div className="table-card">
        {loading ? (
          <div className="table-empty"><div className="loading-spinner" style={{ margin: '0 auto' }} /></div>
        ) : filtered.length === 0 ? (
          <div className="table-empty">
            <div className="table-empty-icon">🎓</div>
            <div className="table-empty-text">
              {search || filterGroup !== 'all' || filterStatus !== 'all'
                ? "Natija topilmadi" : "Hali o'quvchi qo'shilmagan"}
            </div>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Ism Familiya</th>
                <th>Telefon</th>
                <th>Ota-ona tel.</th>
                <th>Guruh</th>
                <th>Yoshi</th>
                <th>Status</th>
                <th>Harakatlar</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s, i) => (
                <tr key={s._id}>
                  <td className="td-num">{i + 1}</td>
                  <td>
                    <div className="td-user">
                      <div className="td-avatar td-avatar--teal">
                        {s.firstName[0]}{s.lastName[0]}
                      </div>
                      <span>{s.firstName} {s.lastName}</span>
                    </div>
                  </td>
                  <td className="td-phone">{s.phone}</td>
                  <td className="td-phone">
                    {s.parentPhone && s.parentPhone !== '+998'
                      ? s.parentPhone
                      : <span className="td-empty">—</span>}
                  </td>
                  <td>
                    {s.group
                      ? <span className="group-badge">{s.group.name}</span>
                      : <span className="td-empty">—</span>}
                  </td>
                  <td className="td-phone">{formatAge(s.birthDate)}</td>
                  <td>
                    <span className={`status-badge status-badge--${s.status}`}>
                      {s.status === 'active' ? 'Faol' : 'Nofaol'}
                    </span>
                  </td>
                  <td>
                    <div className="td-actions">
                      <button className="btn-icon btn-icon--edit"
                        onClick={() => { setEditData(s); setModalOpen(true); }} title="Tahrirlash">
                        <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>
                      <button className="btn-icon btn-icon--delete"
                        onClick={() => setDeleteTarget(s)} title="O'chirish">
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

      <StudentModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        editData={editData}
        groups={groups}
      />
      {deleteTarget && (
        <DeleteModal
          name={`${deleteTarget.firstName} ${deleteTarget.lastName}`}
          onConfirm={handleDelete}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
