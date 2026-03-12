'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import Cookies from 'js-cookie';
import api from '../../../lib/api';

// +998-90-123-45-67 formatiga keltiradi
function formatPhone(raw) {
  const digits = raw.replace(/\D/g, '');
  // Agar foydalanuvchi 998 bilan boshlasa, uni olib tashlaymiz
  const local = digits.startsWith('998') ? digits.slice(3, 12) : digits.slice(0, 9);

  let result = '+998';
  if (local.length > 0) result += '-' + local.slice(0, 2);
  if (local.length > 2) result += '-' + local.slice(2, 5);
  if (local.length > 5) result += '-' + local.slice(5, 7);
  if (local.length > 7) result += '-' + local.slice(7, 9);
  return result;
}

export default function LoginPage() {
  const router = useRouter();
  const [phoneDisplay, setPhoneDisplay] = useState('+998-');
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, setValue, formState: { errors } } = useForm();

  const handlePhoneChange = (e) => {
    const formatted = formatPhone(e.target.value);
    setPhoneDisplay(formatted);
    // DB ga saqlanadigan normallashtirilgan raqam: +998XXXXXXXXX
    const digits = e.target.value.replace(/\D/g, '');
    const local = digits.startsWith('998') ? digits.slice(3, 12) : digits.slice(0, 9);
    setValue('phone', '+998' + local, { shouldValidate: true });
  };

  const handlePhoneKeyDown = (e) => {
    // +998- prefixini o'chirishga yo'l qo'ymaymiz
    if (e.key === 'Backspace' && phoneDisplay === '+998-') {
      e.preventDefault();
    }
  };

  const handlePhoneFocus = (e) => {
    // Kursor oxiriga borsin
    const len = e.target.value.length;
    e.target.setSelectionRange(len, len);
  };

  const onSubmit = async (data) => {
    setLoading(true);
    setServerError('');
    try {
      const res = await api.post('/auth/login', data);
      Cookies.set('token', res.data.token, { expires: 7 });
      router.push('/dashboard');
    } catch (err) {
      setServerError(err.response?.data?.message || 'Telefon raqam yoki parol noto\'g\'ri');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <Image src="/logo.jpg" alt="My Dream School" width={90} height={90} priority />
          <h1>My Dream School</h1>
          <p>CRM Tizimi</p>
        </div>

        {serverError && (
          <div className="login-error">{serverError}</div>
        )}

        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Hidden field for react-hook-form */}
          <input type="hidden" {...register('phone', {
            validate: (v) => (v && v.replace(/\D/g, '').length === 12)
              || 'To\'liq telefon raqam kiriting'
          })} />

          <div className="field">
            <label>Telefon raqam</label>
            <input
              type="tel"
              value={phoneDisplay}
              onChange={handlePhoneChange}
              onKeyDown={handlePhoneKeyDown}
              onFocus={handlePhoneFocus}
              className={errors.phone ? 'err' : ''}
              placeholder="+998-__-___-__-__"
            />
            {errors.phone && <span className="field-err">{errors.phone.message}</span>}
          </div>

          <div className="field">
            <label>Parol</label>
            <input
              type="password"
              placeholder="••••••••"
              className={errors.password ? 'err' : ''}
              {...register('password', { required: 'Parol kiritish majburiy' })}
            />
            {errors.password && <span className="field-err">{errors.password.message}</span>}
          </div>

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? 'Yuklanmoqda...' : 'Kirish'}
          </button>
        </form>
      </div>
    </div>
  );
}
