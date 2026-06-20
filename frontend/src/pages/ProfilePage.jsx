import { useRef, useState } from 'react';

import { api } from '../api/client';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';

const GENDER_LABELS = {
  woman: 'Женщина',
  man: 'Мужчина',
  non_binary: 'Небинарный',
  prefer_not_to_say: 'Предпочитаю не указывать',
};

export default function ProfilePage() {
  const { profile, refreshProfile } = useAuth();
  const toast = useToast();
  const fileRef = useRef();

  const [form, setForm] = useState({
    gender: profile?.gender || '',
    bio: profile?.bio || '',
    occupation: profile?.occupation || '',
    lifestyle: profile?.lifestyle || '',
    favorite_occasions: profile?.favorite_occasions || '',
    city_climate: profile?.city_climate || '',
    sizes_note: profile?.sizes_note || '',
  });
  const [loading, setLoading] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);

  const handle = event => setForm(prev => ({ ...prev, [event.target.name]: event.target.value }));

  const resetForm = () => {
    setForm({
      gender: profile?.gender || '',
      bio: profile?.bio || '',
      occupation: profile?.occupation || '',
      lifestyle: profile?.lifestyle || '',
      favorite_occasions: profile?.favorite_occasions || '',
      city_climate: profile?.city_climate || '',
      sizes_note: profile?.sizes_note || '',
    });
  };

  const submit = async event => {
    event.preventDefault();
    setLoading(true);
    try {
      if (avatarFile) {
        const data = new FormData();
        Object.entries(form).forEach(([key, value]) => value !== '' && data.append(key, value));
        data.append('avatar', avatarFile);
        await api.upload('/profile/', data, 'PATCH');
      } else {
        await api.patch('/profile/', form);
      }
      await refreshProfile();
      toast('✅ Профиль обновлён!', 'success');
    } catch (error) {
      toast(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!profile) {
    return (
      <div className="loading-overlay">
        <span className="spinner spinner-dark" /> Загружаем профиль...
      </div>
    );
  }

  const user = profile.user || {};

  return (
    <div className="fade-up">
      <div className="page-header">
        <div className="page-tag">Профиль</div>
        <h1 className="page-title">Мой <em>профиль</em></h1>
        <p className="page-subtitle">Заполни образ жизни и привычные сценарии, чтобы ассистент давал более точные рекомендации.</p>
      </div>

      <div className="profile-layout">
        <div className="card" style={{ textAlign: 'center' }}>
          <div
            style={{
              width: 100,
              height: 100,
              borderRadius: '50%',
              background: 'linear-gradient(135deg,var(--rose-mid),var(--rose))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 48,
              margin: '0 auto 16px',
              overflow: 'hidden',
              cursor: 'pointer',
            }}
            onClick={() => fileRef.current.click()}
          >
            {profile.avatar_url
              ? <img src={profile.avatar_url} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : (avatarFile ? '📷' : '👤')}
          </div>
          <input
            type="file"
            accept="image/*"
            ref={fileRef}
            style={{ display: 'none' }}
            onChange={event => setAvatarFile(event.target.files[0])}
          />
          {avatarFile && <p style={{ fontSize: 12, color: 'var(--rose-deep)', marginBottom: 8 }}>{avatarFile.name}</p>}

          <div style={{ fontFamily: 'Cormorant Garamond,serif', fontSize: 22, marginBottom: 4 }}>
            {user.first_name ? `${user.first_name} ${user.last_name || ''}` : user.username}
          </div>
          <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 16 }}>{user.email}</div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center' }}>
            {profile.gender && <span className="tag tag-sm">Пол: {GENDER_LABELS[profile.gender] || profile.gender}</span>}
            {profile.occupation && <span className="tag tag-sm">💼 {profile.occupation}</span>}
            {profile.lifestyle && <span className="tag tag-sm">🌿 {profile.lifestyle}</span>}
            {profile.favorite_occasions && <span className="tag tag-sm">📍 {profile.favorite_occasions}</span>}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 20 }}>
            {[
              { icon: '👗', val: profile.wardrobe_count, label: 'Вещей' },
              { icon: '👜', val: profile.accessories_count, label: 'Аксессуаров' },
              { icon: '💬', val: profile.chats_count, label: 'Чатов' },
            ].map(card => (
              <div key={card.label} style={{ background: 'var(--blush)', borderRadius: 12, padding: '12px 8px', textAlign: 'center' }}>
                <div style={{ fontSize: 16 }}>{card.icon}</div>
                <div style={{ fontFamily: 'Cormorant Garamond,serif', fontSize: 24, color: 'var(--rose-deep)' }}>{card.val}</div>
                <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1 }}>{card.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="section-title" style={{ marginBottom: 24 }}>✏️ Редактировать профиль</div>
          <form onSubmit={submit}>
            <div style={{ fontFamily: 'Cormorant Garamond,serif', fontSize: 18, marginBottom: 16, color: 'var(--muted)' }}>
              🌿 Образ жизни
            </div>
            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">Роль / занятие</label>
                <input name="occupation" value={form.occupation} onChange={handle} className="form-control" placeholder="HR, студент, менеджер" />
              </div>
              <div className="form-group">
                <label className="form-label">Пол для AI-примерки</label>
                <select name="gender" value={form.gender} onChange={handle} className="form-control">
                  <option value="">Не указан</option>
                  <option value="woman">Женщина</option>
                  <option value="man">Мужчина</option>
                  <option value="non_binary">Небинарный</option>
                  <option value="prefer_not_to_say">Предпочитаю не указывать</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Повседневный ритм</label>
                <input name="lifestyle" value={form.lifestyle} onChange={handle} className="form-control" placeholder="Офис, активный график, учёба" />
              </div>
              <div className="form-group">
                <label className="form-label">Любимые случаи</label>
                <input name="favorite_occasions" value={form.favorite_occasions} onChange={handle} className="form-control" placeholder="Офис, прогулки, встречи, ужины" />
              </div>
              <div className="form-group">
                <label className="form-label">Город / климат</label>
                <input name="city_climate" value={form.city_climate} onChange={handle} className="form-control" placeholder="Бишкек, переменчивая весна" />
              </div>
            </div>

            <div className="divider" />

            <div className="form-group">
              <label className="form-label">О себе</label>
              <textarea name="bio" value={form.bio} onChange={handle} className="form-control" placeholder="Люблю аккуратные минималистичные образы и спокойные цвета." />
            </div>
            <div className="form-group">
              <label className="form-label">Заметка о размерах / посадке</label>
              <textarea name="sizes_note" value={form.sizes_note} onChange={handle} className="form-control" placeholder="Например: люблю свободный верх, брюки полной длины и посадку mid-rise." />
            </div>

            <div className="flex gap-2 mt-4">
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? <><span className="spinner" /> Сохраняю...</> : '💾 Сохранить профиль'}
              </button>
              <button type="button" className="btn btn-outline" onClick={resetForm}>
                Сбросить
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
