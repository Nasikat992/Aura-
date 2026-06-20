import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { api } from '../api/client';
import { useAuth } from '../hooks/useAuth';
import { getCategoryIcon, getCategoryLabel } from '../constants/wardrobe';

export default function Dashboard() {
  const { profile } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/dashboard/')
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="loading-overlay">
        <span className="spinner spinner-dark" />
        Загружаем твой стиль...
      </div>
    );
  }

  const { stats = {}, recent_wardrobe = [], recent_chats = [] } = data || {};
  const name = profile?.user?.first_name || profile?.user?.username || 'Стилист';

  return (
    <div className="fade-up">
      <div className="page-header">
        <div className="page-tag">Главная</div>
        <h1 className="page-title">
          Привет, <em>{name}</em> ✨
        </h1>
        <p className="page-subtitle">
          Твой персональный AI-стилист уже готов собрать следующий образ.
        </p>
      </div>

      <div className="stats-grid stagger">
        <div className="stat-card fade-up">
          <div className="stat-icon">👗</div>
          <div className="stat-num">{stats.wardrobe_count ?? 0}</div>
          <div className="stat-label">Вещей в гардеробе</div>
        </div>
        <div className="stat-card fade-up">
          <div className="stat-icon">👜</div>
          <div className="stat-num">{stats.accessories_count ?? 0}</div>
          <div className="stat-label">Аксессуаров</div>
        </div>
        <div className="stat-card fade-up">
          <div className="stat-icon">❤️</div>
          <div className="stat-num">{stats.fav_count ?? 0}</div>
          <div className="stat-label">Любимых вещей</div>
        </div>
        <div className="stat-card fade-up">
          <div className="stat-icon">💬</div>
          <div className="stat-num">{stats.chats_count ?? 0}</div>
          <div className="stat-label">Диалогов с ассистентом</div>
        </div>
      </div>

      <div className="grid-3 mb-6 stagger">
        <button
          className="card fade-up"
          style={{ cursor: 'pointer', textAlign: 'left', display: 'flex', flexDirection: 'column' }}
          onClick={() => navigate('/wardrobe')}
        >
          <div style={{ fontSize: 32, marginBottom: 12 }}>👗</div>
          <div className="section-title" style={{ fontSize: 17 }}>Гардероб</div>
          <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 6, lineHeight: 1.6, flex: 1 }}>
            Держи в порядке базовые вещи и используй их в подборе образов.
          </p>
          <div className="btn btn-ghost btn-sm mt-4" style={{ alignSelf: 'flex-end' }}>Открыть →</div>
        </button>
        <button
          className="card fade-up"
          style={{ cursor: 'pointer', textAlign: 'left', display: 'flex', flexDirection: 'column' }}
          onClick={() => navigate('/accessories')}
        >
          <div style={{ fontSize: 32, marginBottom: 12 }}>👜</div>
          <div className="section-title" style={{ fontSize: 17 }}>Аксессуары</div>
          <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 6, lineHeight: 1.6, flex: 1 }}>
            Украшения, часы, ремни и очки теперь живут в отдельном разделе.
          </p>
          <div className="btn btn-ghost btn-sm mt-4" style={{ alignSelf: 'flex-end' }}>Открыть →</div>
        </button>
        <button
          className="card fade-up"
          style={{ cursor: 'pointer', textAlign: 'left', display: 'flex', flexDirection: 'column' }}
          onClick={() => navigate('/tips')}
        >
          <div style={{ fontSize: 32, marginBottom: 12 }}>🤖</div>
          <div className="section-title" style={{ fontSize: 17 }}>Чат-ассистент</div>
          <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 6, lineHeight: 1.6, flex: 1 }}>
            Попроси собрать образ для встречи, офиса, поездки или прогулки.
          </p>
          <div className="btn btn-ghost btn-sm mt-4" style={{ alignSelf: 'flex-end' }}>Открыть →</div>
        </button>
      </div>

      {recent_wardrobe.length > 0 && (
        <div className="mb-6">
          <div className="flex-between mb-4">
            <div className="section-title">Последние вещи 👗</div>
            <button className="btn btn-outline btn-sm" onClick={() => navigate('/wardrobe')}>
              Весь гардероб
            </button>
          </div>
          <div className="grid-auto stagger">
            {recent_wardrobe.slice(0, 4).map(item => (
              <div key={item.id} className="item-card fade-up">
                <div className="item-img">
                  {item.image_url ? <img src={item.image_url} alt={item.name} /> : getCategoryIcon(item.category)}
                </div>
                <div className="item-body">
                  <div className="item-name">{item.name}</div>
                  <div className="item-meta">{item.brand || 'без бренда'} · {item.color || '—'}</div>
                </div>
                <div className="item-footer">
                  <span className={`category-pill cat-${item.category}`}>{item.category_label || getCategoryLabel(item.category)}</span>
                  {item.is_favorite && <span>❤️</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {recent_chats.length > 0 && (
        <div>
          <div className="flex-between mb-4">
            <div className="section-title">Последние диалоги 💬</div>
            <button className="btn btn-outline btn-sm" onClick={() => navigate('/tips')}>
              Открыть чат
            </button>
          </div>
          <div className="grid-2 stagger">
            {recent_chats.map(chat => (
              <button
                key={chat.id}
                className="card fade-up"
                style={{ textAlign: 'left', border: 'none', cursor: 'pointer' }}
                onClick={() => navigate('/tips')}
              >
                <div className="section-title" style={{ fontSize: 18, marginBottom: 10 }}>{chat.title || 'Новый диалог'}</div>
                <p style={{ color: 'var(--muted)', lineHeight: 1.7, minHeight: 72 }}>
                  {chat.last_message?.content?.slice(0, 140) || 'Диалог пока без сообщений.'}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      {!data || (stats.wardrobe_count === 0 && stats.accessories_count === 0 && stats.chats_count === 0) ? (
        <div className="card mt-8" style={{ textAlign: 'center', padding: '60px 40px' }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>🌿</div>
          <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 28, marginBottom: 8 }}>
            Начни собирать стильную систему
          </div>
          <p style={{ color: 'var(--muted)', fontSize: 15, marginBottom: 28, maxWidth: 460, margin: '0 auto 28px' }}>
            Заполни профиль, добавь вещи и аксессуары, а потом задай первый запрос в чат-ассистенте.
          </p>
          <div className="flex-center gap-3">
            <button className="btn btn-primary" onClick={() => navigate('/profile')}>
              👤 Заполнить профиль
            </button>
            <button className="btn btn-outline" onClick={() => navigate('/tips')}>
              💬 Начать чат
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
