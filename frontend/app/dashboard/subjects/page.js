'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import api from '../../../lib/api';

const PRESET_COLORS = [
  '#1e3a6e', '#2a4f96', '#276749', '#c9a500',
  '#c0392b', '#8e44ad', '#16a085', '#d35400',
  '#2c3e50', '#1a7f37',
];

// ── Modal ─────────────────────────────────────────────────────────────
function SubjectModal({ open, onClose, onSave, editData }) {
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm();
  const selectedColor = watch('color', '#1e3a6e');

  useEffect(() => {
    if (!open) return;
    if (editData) {
      reset({ name: editData.name, description: editData.description || '', color: editData.color || '#1e3a6e', status: editData.status });
    } else {
      reset({ name: '', description: '', color: '#1e3a6e', status: 'active' });
    }
  }, [open, editData]);

  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box modal-box--sm" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{editData ? 'Fanni tahrirlash' : "Yangi fan qo'shish"}</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit(onSave)}>
          <div className="modal-body">
            <div className="field">
              <label>Fan nomi</label>
              <input type="text" placeholder="Masalan: Matematika"
                className={errors.name ? 'err' : ''}
                {...register('name', { required: 'Fan nomi majburiy' })} />
              {errors.name && <span className="field-err">{errors.name.message}</span>}
            </div>

            <div className="field">
              <label>Tavsif (ixtiyoriy)</label>
              <input type="text" placeholder="Qisqacha tavsif..."
                {...register('description')} />
            </div>

            <div className="field">
              <label>Rang</label>
              <div className="color-picker">
                {PRESET_COLORS.map((c) => (
                  <button key={c} type="button"
                    className={`color-dot${selectedColor === c ? ' selected' : ''}`}
                    style={{ background: c }}
                    onClick={() => setValue('color', c)}
                  />
                ))}
              </div>
              <input type="hidden" {...register('color')} />
            </div>

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
          <p className="delete-text"><strong>{name}</strong> fanini o'chirishni tasdiqlaysizmi?</p>
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
export default function SubjectsPage() {
  const [subjects, setSubjects]         = useState([]);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState('');
  const [modalOpen, setModalOpen]       = useState(false);
  const [editData, setEditData]         = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [toast, setToast]               = useState(null);

  const showToast = (text, type = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchSubjects = async () => {
    try {
      const res = await api.get('/subjects');
      setSubjects(res.data.data);
    } catch {
      showToast("Yuklashda xatolik", 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSubjects(); }, []);

  const handleSave = async (data) => {
    try {
      if (editData) {
        await api.put(`/subjects/${editData._id}`, data);
        showToast('Fan yangilandi');
      } else {
        await api.post('/subjects', data);
        showToast("Fan qo'shildi");
      }
      setModalOpen(false);
      fetchSubjects();
    } catch (err) {
      showToast(err.response?.data?.message || 'Xatolik yuz berdi', 'error');
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/subjects/${deleteTarget._id}`);
      showToast("Fan o'chirildi");
      setDeleteTarget(null);
      fetchSubjects();
    } catch {
      showToast("O'chirishda xatolik", 'error');
    }
  };

  const filtered = subjects.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.description && s.description.toLowerCase().includes(search.toLowerCase()))
  );

  const activeCount = subjects.filter((s) => s.status === 'active').length;

  return (
    <div className="page-content">
      {toast && <div className={`toast toast--${toast.type}`}>{toast.text}</div>}

      <div className="page-header">
        <div>
          <h1 className="page-title">Fanlar</h1>
          <p className="page-subtitle">Jami: {subjects.length} ta · Faol: {activeCount} ta</p>
        </div>
        <button className="btn-add" onClick={() => { setEditData(null); setModalOpen(true); }}>
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Fan qo'shish
        </button>
      </div>

      {/* Search */}
      <div className="table-toolbar">
        <div className="search-box">
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input type="text" placeholder="Fan nomi bo'yicha qidirish..."
            value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      {/* Cards grid */}
      {loading ? (
        <div className="table-empty" style={{ background: 'none' }}>
          <div className="loading-spinner" style={{ margin: '0 auto' }} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="table-empty" style={{ background: 'var(--white)', borderRadius: 14 }}>
          <div className="table-empty-icon">📚</div>
          <div className="table-empty-text">
            {search ? "Natija topilmadi" : "Hali fan qo'shilmagan"}
          </div>
        </div>
      ) : (
        <div className="subjects-grid">
          {filtered.map((s, i) => (
            <div key={s._id} className="subject-card">
              <div className="subject-card-top">
                <div className="subject-icon" style={{ background: s.color + '22', color: s.color }}>
                  <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                  </svg>
                </div>
                <span className="subject-num">#{i + 1}</span>
              </div>

              <div className="subject-card-body">
                <div className="subject-name" style={{ color: s.color }}>{s.name}</div>
                {s.description && (
                  <div className="subject-desc">{s.description}</div>
                )}
              </div>

              <div className="subject-card-footer">
                <span className={`status-badge status-badge--${s.status}`}>
                  {s.status === 'active' ? 'Faol' : 'Nofaol'}
                </span>
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
              </div>

              <div className="subject-card-bar" style={{ background: s.color }} />
            </div>
          ))}
        </div>
      )}

      <SubjectModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        editData={editData}
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
