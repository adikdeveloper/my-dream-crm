'use client';

import { useState, useEffect, useCallback } from 'react';
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

function formatDate(dateStr) {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString('ru-RU');
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

// ── View Modal ─────────────────────────────────────────────────────────
function StudentViewModal({ student, onClose, onEdit }) {
  if (!student) return null;
  const groupPrice     = student.group?.price || 0;
  const discount       = student.discount || 0;
  const effectivePrice = Math.max(0, groupPrice - discount);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box modal-box--view" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="svm-header">
          <div className="svm-avatar">
            {student.firstName[0]}{student.lastName[0]}
          </div>
          <div className="svm-title">
            <div className="svm-name">{student.firstName} {student.lastName}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
              {student.group
                ? <span className="group-badge">{student.group.name}</span>
                : <span style={{ fontSize: 12, color: 'var(--gray-400)' }}>Guruхsiz</span>}
              <span className={`status-badge status-badge--${student.status}`}>
                {student.status === 'active' ? 'Faol' : 'Nofaol'}
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
                <div className="svm-row-value">{student.phone || '—'}</div>
              </div>
            </div>
            {student.parentPhone && student.parentPhone.replace(/\D/g,'').length > 3 && (
              <div className="svm-row">
                <span className="svm-icon">👨‍👩‍👦</span>
                <div>
                  <div className="svm-row-label">Ota-ona telefoni</div>
                  <div className="svm-row-value">{student.parentPhone}</div>
                </div>
              </div>
            )}
          </div>

          {/* O'qish */}
          <div className="svm-section">
            <div className="svm-section-title">O'qish ma'lumotlari</div>
            <div className="svm-row">
              <span className="svm-icon">🎓</span>
              <div>
                <div className="svm-row-label">Guruh · Fan</div>
                <div className="svm-row-value">
                  {student.group ? `${student.group.name} — ${student.group.subject || ''}` : '—'}
                </div>
              </div>
            </div>
            <div className="svm-row">
              <span className="svm-icon">📅</span>
              <div>
                <div className="svm-row-label">Kelib boshlagan sana</div>
                <div className="svm-row-value">{student.startDate ? formatDate(student.startDate) : '—'}</div>
              </div>
            </div>
            <div className="svm-row">
              <span className="svm-icon">🎂</span>
              <div>
                <div className="svm-row-label">Tug'ilgan sana</div>
                <div className="svm-row-value">{student.birthDate ? formatDate(student.birthDate) : '—'}</div>
              </div>
            </div>
          </div>

          {/* To'lov */}
          {groupPrice > 0 && (
            <div className="svm-payment-box">
              <div className="svm-payment-row">
                <span>Guruh narxi</span>
                <span>{groupPrice.toLocaleString('uz-UZ')} so'm</span>
              </div>
              {discount > 0 && (
                <div className="svm-payment-row svm-payment-row--discount">
                  <span>Skidka</span>
                  <span>− {discount.toLocaleString('uz-UZ')} so'm</span>
                </div>
              )}
              <div className="svm-payment-row svm-payment-row--total">
                <span>Oylik to'lov</span>
                <span>{effectivePrice.toLocaleString('uz-UZ')} so'm</span>
              </div>
            </div>
          )}

        </div>

        <div className="modal-footer">
          <button className="btn-cancel" onClick={onClose}>Yopish</button>
          <button className="btn-save" onClick={() => { onClose(); onEdit(student); }}>
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
            Tahrirlash
          </button>
        </div>

      </div>
    </div>
  );
}

// ── Modal ─────────────────────────────────────────────────────────────
function StudentModal({ open, onClose, onSave, editData, groups, isSaving }) {
  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm();
  const [phoneDisplay, setPhoneDisplay]             = useState('+998-');
  const [parentPhoneDisplay, setParentPhoneDisplay] = useState('+998-');

  const selectedGroupId = watch('group');
  const discountValue   = watch('discount');

  // Tanlangan guruh narxi
  const selectedGroup = groups.find((g) => g._id === selectedGroupId);
  const groupPrice    = selectedGroup?.price || 0;
  const discountNum   = Number(discountValue) || 0;
  const effectivePrice = Math.max(0, groupPrice - discountNum);

  useEffect(() => {
    if (!open) return;
    if (editData) {
      reset({
        firstName:   editData.firstName,
        lastName:    editData.lastName,
        group:       editData.group?._id || editData.group || '',
        birthDate:   editData.birthDate   ? editData.birthDate.slice(0, 10)  : '',
        startDate:   editData.startDate   ? editData.startDate.slice(0, 10)  : '',
        discount:    editData.discount    || 0,
        status:      editData.status,
      });
      setPhoneDisplay(editData.phone || '+998-');
      setValue('phone', editData.phone || '');
      setParentPhoneDisplay(editData.parentPhone || '+998-');
      setValue('parentPhone', editData.parentPhone || '');
    } else {
      reset({ firstName: '', lastName: '', group: '', birthDate: '', startDate: '', discount: 0, status: 'active' });
      setPhoneDisplay('+998-');
      setValue('phone', '');
      setParentPhoneDisplay('+998-');
      setValue('parentPhone', '');
    }
  }, [open, editData, reset, setValue]);

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
          <button className="modal-close" onClick={onClose} disabled={isSaving}>✕</button>
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

            {/* Kelib boshlagan sana / Skidka */}
            <div className="modal-row">
              <div className="field">
                <label>Kelib boshlagan sana</label>
                <input type="date" {...register('startDate')}
                  style={{ width: '100%', padding: '11px 14px', border: '1.5px solid var(--gray-200)', borderRadius: 8, fontSize: 14, color: 'var(--navy)', background: 'var(--gray-50)', outline: 'none' }} />
              </div>
              <div className="field">
                <label>Skidka (so'm)</label>
                <div className="salary-input-wrap">
                  <input type="number" placeholder="0" min={0}
                    {...register('discount', { min: { value: 0, message: "0 dan katta bo'lsin" } })} />
                  <span className="salary-suffix">so'm</span>
                </div>
                {errors.discount && <span className="field-err">{errors.discount.message}</span>}
              </div>
            </div>

            {/* Oylik to'lov hisob-kitobi */}
            {groupPrice > 0 && (
              <div className="payment-calc-box">
                <div className="payment-calc-row">
                  <span>Guruh narxi</span>
                  <span>{groupPrice.toLocaleString('uz-UZ')} so'm</span>
                </div>
                {discountNum > 0 && (
                  <div className="payment-calc-row payment-calc-row--discount">
                    <span>Skidka</span>
                    <span>− {discountNum.toLocaleString('uz-UZ')} so'm</span>
                  </div>
                )}
                <div className="payment-calc-row payment-calc-row--total">
                  <span>Oylik to'lov</span>
                  <span>{effectivePrice.toLocaleString('uz-UZ')} so'm</span>
                </div>
              </div>
            )}

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
  const [viewData, setViewData]         = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isSaving, setIsSaving]         = useState(false);
  const [toast, setToast]               = useState(null);

  const showToast = useCallback((text, type = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const fetchAll = useCallback(async () => {
    try {
      const [sRes, gRes] = await Promise.all([api.get('/students'), api.get('/groups')]);
      setStudents(sRes.data.data);
      setGroups(gRes.data.data);
    } catch {
      showToast("Ma'lumotlarni yuklashda xatolik", 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleSave = async (data) => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      const payload = {
        ...data,
        group:     data.group     || null,
        startDate: data.startDate || null,
        birthDate: data.birthDate || null,
        discount:  Number(data.discount) || 0,
      };
      if (editData) {
        await api.put(`/students/${editData._id}`, payload);
        showToast("O'quvchi yangilandi");
      } else {
        await api.post('/students', payload);
        showToast("O'quvchi qo'shildi");
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
      s.phone.includes(q)                   ||
      (s.group && s.group.name.toLowerCase().includes(q));
    const matchGroup  = filterGroup  === 'all' || s.group?._id === filterGroup;
    const matchStatus = filterStatus === 'all' || s.status === filterStatus;
    return matchSearch && matchGroup && matchStatus;
  });

  const activeCount   = students.filter((s) => s.status === 'active').length;
  const discountCount = students.filter((s) => s.discount > 0).length;

  return (
    <div className="page-content">
      {toast && <div className={`toast toast--${toast.type}`}>{toast.text}</div>}

      <div className="page-header">
        <div>
          <h1 className="page-title">O'quvchilar</h1>
          <p className="page-subtitle">
            Jami: {students.length} ta · Faol: {activeCount} ta
            {discountCount > 0 && ` · Skidkali: ${discountCount} ta`}
          </p>
        </div>
        <button className="btn-add" onClick={() => { setEditData(null); setModalOpen(true); }}>
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Qo'shish
        </button>
      </div>

      {/* Filter */}
      <div className="filter-bar">
        <div className="search-box">
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input type="text" placeholder="Ism yoki telefon..."
            value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="filter-select" value={filterGroup} onChange={(e) => setFilterGroup(e.target.value)}>
          <option value="all">Barcha guruhlar</option>
          {groups.map((g) => <option key={g._id} value={g._id}>{g.name}</option>)}
        </select>
        <select className="filter-select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
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
                ? 'Natija topilmadi' : "Hali o'quvchi qo'shilmagan"}
            </div>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Ism Familiya</th>
                <th>Telefon</th>
                <th>Guruh</th>
                <th>Boshlagan sana</th>
                <th>Oylik to'lov</th>
                <th>Status</th>
                <th>Harakatlar</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s, i) => {
                const groupPrice    = s.group?.price || 0;
                const discount      = s.discount || 0;
                const effectivePrice = Math.max(0, groupPrice - discount);

                return (
                  <tr key={s._id}>
                    <td className="td-num">{i + 1}</td>
                    <td>
                      <div className="td-user">
                        <div className="td-avatar td-avatar--teal">
                          {s.firstName[0]}{s.lastName[0]}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600 }}>{s.firstName} {s.lastName}</div>
                          {s.parentPhone && s.parentPhone.replace(/\D/g, '').length > 3 && (
                            <div style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 1 }}>
                              {s.parentPhone}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="td-phone">{s.phone}</td>
                    <td>
                      {s.group
                        ? <span className="group-badge">{s.group.name}</span>
                        : <span className="td-empty">—</span>}
                    </td>
                    <td className="td-phone">
                      {s.startDate
                        ? formatDate(s.startDate)
                        : <span className="td-empty">—</span>}
                    </td>
                    <td>
                      {groupPrice > 0 ? (
                        <div className="price-cell">
                          <span className="td-salary">{effectivePrice.toLocaleString('uz-UZ')} so'm</span>
                          {discount > 0 && (
                            <span className="discount-badge">
                              −{discount.toLocaleString('uz-UZ')}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="td-empty">—</span>
                      )}
                    </td>
                    <td>
                      <span className={`status-badge status-badge--${s.status}`}>
                        {s.status === 'active' ? 'Faol' : 'Nofaol'}
                      </span>
                    </td>
                    <td>
                      <div className="td-actions">
                        <button className="btn-icon btn-icon--view"
                          onClick={() => setViewData(s)} title="Ko'rish">
                          <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                            <circle cx="12" cy="12" r="3"/>
                          </svg>
                        </button>
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
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {viewData && (
        <StudentViewModal
          student={viewData}
          onClose={() => setViewData(null)}
          onEdit={(s) => { setEditData(s); setModalOpen(true); }}
        />
      )}
      <StudentModal
        open={modalOpen}
        onClose={() => { if (!isSaving) { setModalOpen(false); setEditData(null); } }}
        onSave={handleSave}
        editData={editData}
        groups={groups}
        isSaving={isSaving}
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
