'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import api from '../../../lib/api';

function formatPhone(raw) {
  const digits = raw.replace(/\D/g, '');
  const local = digits.startsWith('998') ? digits.slice(3, 12) : digits.slice(0, 9);
  let result = '+998';
  if (local.length > 0) result += '-' + local.slice(0, 2);
  if (local.length > 2) result += '-' + local.slice(2, 5);
  if (local.length > 5) result += '-' + local.slice(5, 7);
  if (local.length > 7) result += '-' + local.slice(7, 9);
  return result;
}

export default function ProfilePage() {
  const [user, setUser]               = useState(null);
  const [profileMsg, setProfileMsg]   = useState(null);
  const [passwordMsg, setPasswordMsg] = useState(null);
  const [profileLoading, setProfileLoading]   = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [phoneDisplay, setPhoneDisplay] = useState('+998-');

  const profileForm  = useForm();
  const passwordForm = useForm();

  useEffect(() => {
    api.get('/auth/me').then((res) => {
      const u = res.data.user;
      setUser(u);
      setPhoneDisplay(u.phone || '+998-');
      profileForm.reset({ firstName: u.firstName, lastName: u.lastName });
      profileForm.setValue('phone', u.phone || '');
    });
  }, []);

  const handlePhoneInput = (e) => {
    const formatted = formatPhone(e.target.value);
    setPhoneDisplay(formatted);
    const digits = e.target.value.replace(/\D/g, '');
    const local = digits.startsWith('998') ? digits.slice(3, 12) : digits.slice(0, 9);
    profileForm.setValue('phone', '+998' + local, { shouldValidate: true });
  };

  const onProfileSubmit = async (data) => {
    setProfileLoading(true);
    setProfileMsg(null);
    try {
      const res = await api.put('/auth/update-profile', data);
      setUser(res.data.user);
      setProfileMsg({ type: 'success', text: 'Profil muvaffaqiyatli yangilandi!' });
    } catch (err) {
      setProfileMsg({ type: 'error', text: err.response?.data?.message || 'Xatolik yuz berdi' });
    } finally {
      setProfileLoading(false);
    }
  };

  const onPasswordSubmit = async (data) => {
    if (data.newPassword !== data.confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'Yangi parollar mos kelmayapti' });
      return;
    }
    setPasswordLoading(true);
    setPasswordMsg(null);
    try {
      await api.put('/auth/change-password', {
        oldPassword: data.oldPassword,
        newPassword: data.newPassword,
      });
      setPasswordMsg({ type: 'success', text: "Parol muvaffaqiyatli o'zgartirildi!" });
      passwordForm.reset();
    } catch (err) {
      setPasswordMsg({ type: 'error', text: err.response?.data?.message || 'Xatolik yuz berdi' });
    } finally {
      setPasswordLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="page-content">
      <div className="page-header">
        <h1 className="page-title">Profil</h1>
        <p className="page-subtitle">Shaxsiy ma'lumotlaringizni boshqaring</p>
      </div>

      <div className="profile-grid">

        {/* ── Shaxsiy ma'lumotlar ── */}
        <div className="profile-card">
          <div className="profile-card-header">
            <div className="profile-avatar-big">
              {user.firstName?.[0]}{user.lastName?.[0]}
            </div>
            <div>
              <div className="profile-card-title">Shaxsiy ma'lumotlar</div>
              <div className="profile-card-sub">{user.role}</div>
            </div>
          </div>

          {profileMsg && (
            <div className={`profile-msg profile-msg--${profileMsg.type}`}>
              {profileMsg.type === 'success' ? '✓' : '✕'} {profileMsg.text}
            </div>
          )}

          <form onSubmit={profileForm.handleSubmit(onProfileSubmit)}>
            <input type="hidden" {...profileForm.register('phone', {
              validate: (v) => (v && v.replace(/\D/g, '').length === 12) || "To'liq raqam kiriting"
            })} />

            <div className="profile-form-row">
              <div className="field">
                <label>Ism</label>
                <input
                  type="text"
                  placeholder="Ismingiz"
                  className={profileForm.formState.errors.firstName ? 'err' : ''}
                  {...profileForm.register('firstName', { required: 'Majburiy' })}
                />
                {profileForm.formState.errors.firstName && (
                  <span className="field-err">{profileForm.formState.errors.firstName.message}</span>
                )}
              </div>
              <div className="field">
                <label>Familiya</label>
                <input
                  type="text"
                  placeholder="Familiyangiz"
                  className={profileForm.formState.errors.lastName ? 'err' : ''}
                  {...profileForm.register('lastName', { required: 'Majburiy' })}
                />
                {profileForm.formState.errors.lastName && (
                  <span className="field-err">{profileForm.formState.errors.lastName.message}</span>
                )}
              </div>
            </div>

            <div className="field">
              <label>Rol</label>
              <input type="text" value={user.role} disabled className="field-disabled" />
            </div>

            <div className="field">
              <label>Telefon raqam</label>
              <input
                type="tel"
                value={phoneDisplay}
                onChange={handlePhoneInput}
                onKeyDown={(e) => { if (e.key === 'Backspace' && phoneDisplay === '+998-') e.preventDefault(); }}
                onFocus={(e) => { const l = e.target.value.length; e.target.setSelectionRange(l, l); }}
                className={profileForm.formState.errors.phone ? 'err' : ''}
                placeholder="+998-__-___-__-__"
              />
              {profileForm.formState.errors.phone && (
                <span className="field-err">{profileForm.formState.errors.phone.message}</span>
              )}
            </div>

            <button type="submit" className="profile-btn" disabled={profileLoading}>
              {profileLoading ? 'Saqlanmoqda...' : 'Saqlash'}
            </button>
          </form>
        </div>

        {/* ── Parol almashtirish ── */}
        <div className="profile-card">
          <div className="profile-card-header" style={{ marginBottom: 0 }}>
            <div className="profile-icon-box profile-icon-box--gold">
              <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <rect x="3" y="11" width="18" height="11" rx="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <div>
              <div className="profile-card-title">Parol almashtirish</div>
              <div className="profile-card-sub">Xavfsizlik uchun parolni yangilang</div>
            </div>
          </div>

          <div className="profile-divider" />

          {passwordMsg && (
            <div className={`profile-msg profile-msg--${passwordMsg.type}`}>
              {passwordMsg.type === 'success' ? '✓' : '✕'} {passwordMsg.text}
            </div>
          )}

          <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}>
            <div className="field">
              <label>Eski parol</label>
              <input
                type="password"
                placeholder="Hozirgi parolingiz"
                className={passwordForm.formState.errors.oldPassword ? 'err' : ''}
                {...passwordForm.register('oldPassword', { required: 'Majburiy' })}
              />
              {passwordForm.formState.errors.oldPassword && (
                <span className="field-err">{passwordForm.formState.errors.oldPassword.message}</span>
              )}
            </div>
            <div className="field">
              <label>Yangi parol</label>
              <input
                type="password"
                placeholder="Kamida 6 ta belgi"
                className={passwordForm.formState.errors.newPassword ? 'err' : ''}
                {...passwordForm.register('newPassword', {
                  required: 'Majburiy',
                  minLength: { value: 6, message: 'Kamida 6 ta belgi' },
                })}
              />
              {passwordForm.formState.errors.newPassword && (
                <span className="field-err">{passwordForm.formState.errors.newPassword.message}</span>
              )}
            </div>
            <div className="field">
              <label>Yangi parolni tasdiqlang</label>
              <input
                type="password"
                placeholder="Qayta kiriting"
                className={passwordForm.formState.errors.confirmPassword ? 'err' : ''}
                {...passwordForm.register('confirmPassword', { required: 'Majburiy' })}
              />
              {passwordForm.formState.errors.confirmPassword && (
                <span className="field-err">{passwordForm.formState.errors.confirmPassword.message}</span>
              )}
            </div>

            <button type="submit" className="profile-btn profile-btn--gold" disabled={passwordLoading}>
              {passwordLoading ? "O'zgartirilmoqda..." : "Parolni o'zgartirish"}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
