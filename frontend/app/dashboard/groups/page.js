'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import api from '../../../lib/api';


const DAYS_OPTIONS = [
  { value: 'Du-Cho-Ju', label: 'Du · Cho · Ju' },
  { value: 'Se-Pay-Sha', label: 'Se · Pay · Sha' },
  { value: 'Har kuni', label: 'Har kuni' },
  { value: 'Dam olish', label: 'Dam olish kunlari' },
];

// ── Modal ────────────────────────────────────────────────────────────
function GroupModal({ open, onClose, onSave, editData, teachers, subjects }) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

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
  }, [open, editData]);

  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{editData ? 'Guruhni tahrirlash' : "Yangi guruh qo'shish"}</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit(onSave)}>
          <div className="modal-body">

            {/* Guruh nomi */}
            <div className="field">
              <label>Guruh nomi</label>
              <input type="text" placeholder="Masalan: Ingliz tili — Boshlang'ich"
                className={errors.name ? 'err' : ''}
                {...register('name', { required: 'Guruh nomi majburiy' })} />
              {errors.name && <span className="field-err">{errors.name.message}</span>}
            </div>

            {/* Fan + O'qituvchi */}
            <div className="modal-row">
              <div className="field">
                <label>Fan</label>
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
                <label>O'qituvchi</label>
                <select {...register('teacher')}>
                  <option value="">— Tanlang —</option>
                  {teachers.map((t) => (
                    <option key={t._id} value={t._id}>{t.firstName} {t.lastName}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Kunlar + Vaqt */}
            <div className="modal-row">
              <div className="field">
                <label>Dars kunlari</label>
                <select {...register('days')}>
                  <option value="">— Tanlang —</option>
                  {DAYS_OPTIONS.map((d) => (
                    <option key={d.value} value={d.value}>{d.label}</option>
                  ))}
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

            {/* Vaqt */}
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

            {/* Narx */}
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
            <button type="button" className="btn-cancel" onClick={onClose}>Bekor qilish</button>
            <button type="submit" className="btn-save">{editData ? 'Saqlash' : "Qo'shish"}</button>
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
            <strong>{name}</strong> guruhini o'chirishni tasdiqlaysizmi?
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
export default function GroupsPage() {
  const [groups, setGroups]           = useState([]);
  const [teachers, setTeachers]       = useState([]);
  const [subjects, setSubjects]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
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
  };

  useEffect(() => { fetchAll(); }, []);

  const handleSave = async (data) => {
    try {
      const payload = {
        ...data,
        price:   Number(data.price) || 0,
        teacher: data.teacher || null,
      };
      if (editData) {
        await api.put(`/groups/${editData._id}`, payload);
        showToast('Guruh yangilandi');
      } else {
        await api.post('/groups', payload);
        showToast("Guruh qo'shildi");
      }
      setModalOpen(false);
      fetchAll();
    } catch (err) {
      showToast(err.response?.data?.message || 'Xatolik yuz berdi', 'error');
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/groups/${deleteTarget._id}`);
      showToast("Guruh o'chirildi");
      setDeleteTarget(null);
      fetchAll();
    } catch {
      showToast("O'chirishda xatolik", 'error');
    }
  };

  const openAdd  = () => { setEditData(null); setModalOpen(true); };
  const openEdit = (g) => { setEditData(g); setModalOpen(true); };

  const filtered = groups.filter((g) => {
    const q = search.toLowerCase();
    const matchSearch =
      g.name.toLowerCase().includes(q) ||
      g.subject.toLowerCase().includes(q) ||
      (g.teacher && `${g.teacher.firstName} ${g.teacher.lastName}`.toLowerCase().includes(q));
    const matchStatus = filterStatus === 'all' || g.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const activeCount   = groups.filter((g) => g.status === 'active').length;
  const inactiveCount = groups.filter((g) => g.status === 'inactive').length;

  return (
    <div className="page-content">
      {toast && <div className={`toast toast--${toast.type}`}>{toast.text}</div>}

      <div className="page-header">
        <div>
          <h1 className="page-title">Guruhlar</h1>
          <p className="page-subtitle">Jami: {groups.length} ta guruh</p>
        </div>
        <button className="btn-add" onClick={openAdd}>
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Qo'shish
        </button>
      </div>

      {/* Stats */}
      <div className="group-stats">
        <div className={`group-stat-item${filterStatus === 'all' ? ' active' : ''}`}
          onClick={() => setFilterStatus('all')}>
          <span className="group-stat-num">{groups.length}</span>
          <span className="group-stat-label">Hammasi</span>
        </div>
        <div className={`group-stat-item group-stat-item--green${filterStatus === 'active' ? ' active' : ''}`}
          onClick={() => setFilterStatus('active')}>
          <span className="group-stat-num">{activeCount}</span>
          <span className="group-stat-label">Faol</span>
        </div>
        <div className={`group-stat-item group-stat-item--gray${filterStatus === 'inactive' ? ' active' : ''}`}
          onClick={() => setFilterStatus('inactive')}>
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
          <div className="table-empty">
            <div className="loading-spinner" style={{ margin: '0 auto' }} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="table-empty">
            <div className="table-empty-icon">📚</div>
            <div className="table-empty-text">
              {search || filterStatus !== 'all' ? "Natija topilmadi" : "Hali guruh qo'shilmagan"}
            </div>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Guruh nomi</th>
                <th>Fan</th>
                <th>O'qituvchi</th>
                <th>Kunlar</th>
                <th>Vaqt</th>
                <th>Oylik to'lov</th>
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
                      <div className="td-avatar td-avatar--gold">
                        {g.name[0]}
                      </div>
                      <span style={{ fontWeight: 600 }}>{g.name}</span>
                    </div>
                  </td>
                  <td>{g.subject}</td>
                  <td>
                    {g.teacher
                      ? <span>{g.teacher.firstName} {g.teacher.lastName}</span>
                      : <span className="td-empty">—</span>}
                  </td>
                  <td>
                    {g.days
                      ? <span className="days-badge">{g.days}</span>
                      : <span className="td-empty">—</span>}
                  </td>
                  <td className="td-time">
                    {g.startTime && g.endTime
                      ? `${g.startTime} – ${g.endTime}`
                      : <span className="td-empty">—</span>}
                  </td>
                  <td className="td-salary">
                    {g.price ? `${Number(g.price).toLocaleString()} so'm` : <span className="td-empty">—</span>}
                  </td>
                  <td>
                    <span className={`status-badge status-badge--${g.status}`}>
                      {g.status === 'active' ? 'Faol' : 'Nofaol'}
                    </span>
                  </td>
                  <td>
                    <div className="td-actions">
                      <button className="btn-icon btn-icon--edit" onClick={() => openEdit(g)} title="Tahrirlash">
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

      <GroupModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        editData={editData}
        teachers={teachers}
        subjects={subjects}
      />
      {deleteTarget && (
        <DeleteModal
          name={deleteTarget.name}
          onConfirm={handleDelete}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
