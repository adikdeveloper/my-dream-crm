'use client';

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
        lastName:  editData.lastName,
        subject:   editData.subject,
        salary:    editData.salary,
        status:    editData.status,
        group:     editData.group?._id || editData.group || '',
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

// ── Main Page ─────────────────────────────────────────────────────────
export default function TeachersPage() {
  const [teachers, setTeachers]       = useState([]);
  const [groups, setGroups]           = useState([]);
  const [subjects, setSubjects]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState('');
  const [modalOpen, setModalOpen]     = useState(false);
  const [editData, setEditData]       = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [toast, setToast]             = useState(null);

  const showToast = (text, type = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchAll = async () => {
    try {
      const [tRes, gRes, sRes] = await Promise.all([
        api.get('/teachers'),
        api.get('/groups'),
        api.get('/subjects'),
      ]);
      setTeachers(tRes.data.data);
      setGroups(gRes.data.data);
      setSubjects(sRes.data.data.filter((s) => s.status === 'active'));
    } catch {
      showToast("Ma'lumotlarni yuklashda xatolik", 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

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

  const openAdd  = () => { setEditData(null); setModalOpen(true); };
  const openEdit = (t)  => { setEditData(t); setModalOpen(true); };

  const filtered = teachers.filter((t) => {
    const q = search.toLowerCase();
    return (
      t.firstName.toLowerCase().includes(q) ||
      t.lastName.toLowerCase().includes(q)  ||
      t.subject.toLowerCase().includes(q)   ||
      t.phone.includes(q)
    );
  });

  const salaryLabel = (t) =>
    t.salaryType === 'percent'
      ? `${t.salary}%`
      : `${Number(t.salary).toLocaleString()} so'm`;

  return (
    <div className="page-content">
      {toast && <div className={`toast toast--${toast.type}`}>{toast.text}</div>}

      <div className="page-header">
        <div>
          <h1 className="page-title">O'qituvchilar</h1>
          <p className="page-subtitle">Jami: {teachers.length} ta o'qituvchi</p>
        </div>
        <button className="btn-add" onClick={openAdd}>
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Qo'shish
        </button>
      </div>

      <div className="table-toolbar">
        <div className="search-box">
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Ism, fan yoki telefon bo'yicha..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="table-card">
        {loading ? (
          <div className="table-empty">
            <div className="loading-spinner" style={{ margin: '0 auto' }} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="table-empty">
            <div className="table-empty-icon">👨‍🏫</div>
            <div className="table-empty-text">
              {search ? "Qidiruv bo'yicha natija topilmadi" : "Hali o'qituvchi qo'shilmagan"}
            </div>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Ism Familiya</th>
                <th>Telefon</th>
                <th>Fan</th>
                <th>Guruh</th>
                <th>Maosh</th>
                <th>Status</th>
                <th>Harakatlar</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t, i) => (
                <tr key={t._id}>
                  <td className="td-num">{i + 1}</td>
                  <td>
                    <div className="td-user">
                      <div className="td-avatar">{t.firstName[0]}{t.lastName[0]}</div>
                      <span>{t.firstName} {t.lastName}</span>
                    </div>
                  </td>
                  <td className="td-phone">{t.phone}</td>
                  <td>{t.subject}</td>
                  <td>
                    {t.group
                      ? <span className="group-badge">{t.group.name}</span>
                      : <span className="td-empty">—</span>}
                  </td>
                  <td className="td-salary">{salaryLabel(t)}</td>
                  <td>
                    <span className={`status-badge status-badge--${t.status}`}>
                      {t.status === 'active' ? 'Faol' : 'Nofaol'}
                    </span>
                  </td>
                  <td>
                    <div className="td-actions">
                      <button className="btn-icon btn-icon--edit" onClick={() => openEdit(t)} title="Tahrirlash">
                        <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>
                      <button className="btn-icon btn-icon--delete" onClick={() => setDeleteTarget(t)} title="O'chirish">
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

      <TeacherModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        editData={editData}
        groups={groups}
        subjects={subjects}
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
