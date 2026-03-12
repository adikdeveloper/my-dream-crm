'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import Cookies from 'js-cookie';
import api from '../../../lib/api';

export default function RegisterPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm();

  const onSubmit = async (data) => {
    setLoading(true);
    setServerError('');
    try {
      const res = await api.post('/auth/register', {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: data.password,
      });
      Cookies.set('token', res.data.token, { expires: 7 });
      router.push('/dashboard');
    } catch (err) {
      setServerError(err.response?.data?.message || "Ro'yxatdan o'tishda xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      {/* Chap tomon */}
      <div className="auth-left">
        <Image
          src="/logo.jpg"
          alt="My Dream School"
          width={160}
          height={160}
          className="auth-left-logo"
          priority
        />
        <h1 className="auth-left-title">
          My Dream <span>School</span>
        </h1>
        <p className="auth-left-subtitle">Mijozlar boshqaruv tizimi</p>
        <div className="auth-left-divider" />
      </div>

      {/* O'ng tomon */}
      <div className="auth-right">
        <div className="auth-card">
          <h2 className="auth-title">Ro&apos;yxatdan o&apos;tish</h2>
          <p className="auth-desc">Yangi hisob yarating</p>

          {serverError && (
            <div className="alert alert-error">
              <span>⚠</span> {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="form-row">
              <div className="form-group">
                <label>Ism</label>
                <input
                  type="text"
                  placeholder="Ism"
                  className={errors.firstName ? 'error' : ''}
                  {...register('firstName', { required: 'Majburiy' })}
                />
                {errors.firstName && <span className="error-text">{errors.firstName.message}</span>}
              </div>

              <div className="form-group">
                <label>Familiya</label>
                <input
                  type="text"
                  placeholder="Familiya"
                  className={errors.lastName ? 'error' : ''}
                  {...register('lastName', { required: 'Majburiy' })}
                />
                {errors.lastName && <span className="error-text">{errors.lastName.message}</span>}
              </div>
            </div>

            <div className="form-group">
              <label>Email manzil</label>
              <input
                type="email"
                placeholder="email@example.com"
                className={errors.email ? 'error' : ''}
                {...register('email', {
                  required: 'Email kiritish majburiy',
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: "To'g'ri email kiriting",
                  },
                })}
              />
              {errors.email && <span className="error-text">{errors.email.message}</span>}
            </div>

            <div className="form-group">
              <label>Parol</label>
              <input
                type="password"
                placeholder="Kamida 6 ta belgi"
                className={errors.password ? 'error' : ''}
                {...register('password', {
                  required: 'Parol kiritish majburiy',
                  minLength: { value: 6, message: "Kamida 6 ta belgi" },
                })}
              />
              {errors.password && <span className="error-text">{errors.password.message}</span>}
            </div>

            <div className="form-group">
              <label>Parolni tasdiqlash</label>
              <input
                type="password"
                placeholder="Parolni qayta kiriting"
                className={errors.confirmPassword ? 'error' : ''}
                {...register('confirmPassword', {
                  required: 'Majburiy',
                  validate: (val) => val === watch('password') || 'Parollar mos kelmayapti',
                })}
              />
              {errors.confirmPassword && <span className="error-text">{errors.confirmPassword.message}</span>}
            </div>

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Yuklanmoqda...' : "Ro'yxatdan o'tish"}
            </button>
          </form>

          <div className="auth-footer">
            Hisobingiz bormi? <Link href="/login">Kirish</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
