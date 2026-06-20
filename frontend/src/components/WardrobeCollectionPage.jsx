import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { api } from '../api/client';
import { useToast } from '../hooks/useToast';
import { getCategoryIcon, getCategoryLabel, getCategoryOptions, SEASONS } from '../constants/wardrobe';

const ITEMS_PER_PAGE = 15;

function normalizePurchaseDate(value) {
  if (!value || typeof value !== 'string') return '';
  const isoMatch = value.match(/^\d{4}-\d{2}-\d{2}$/);
  if (isoMatch) return value;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toISOString().slice(0, 10);
}

function buildItemPayload(form) {
  const payload = {
    name: form.name?.trim() || '',
    category: form.category,
    color: form.color?.trim() || '',
    brand: form.brand?.trim() || '',
    season: form.season,
    notes: form.notes?.trim() || '',
    is_favorite: Boolean(form.is_favorite),
  };

  const purchaseDate = normalizePurchaseDate(form.purchase_date);
  payload.purchase_date = purchaseDate || null;

  return payload;
}

function ItemModal({ item, kind, onClose, onSaved }) {
  const toast = useToast();
  const categoryOptions = getCategoryOptions(kind);
  const [form, setForm] = useState({
    name: '',
    category: categoryOptions[0]?.[0] || 'other',
    color: '',
    brand: '',
    season: 'all',
    purchase_date: '',
    notes: '',
    is_favorite: false,
    ...(item || {}),
    purchase_date: normalizePurchaseDate(item?.purchase_date),
  });
  const [loading, setLoading] = useState(false);
  const [imgFile, setImgFile] = useState(null);
  const fileRef = useRef();

  const handle = event => {
    const { name, value, type, checked } = event.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const submit = async event => {
    event.preventDefault();
    setLoading(true);
    try {
      const payload = buildItemPayload(form);
      let result;
      if (imgFile) {
        const data = new FormData();
        Object.entries(payload).forEach(([key, value]) => {
          if (value === null || value === undefined) return;
          data.append(key, value);
        });
        data.append('image', imgFile);
        result = item
          ? await api.upload(`/wardrobe/${item.id}/`, data, 'PATCH')
          : await api.upload('/wardrobe/', data);
      } else {
        result = item
          ? await api.patch(`/wardrobe/${item.id}/`, payload)
          : await api.post('/wardrobe/', payload);
      }
      toast(item ? '✅ Вещь обновлена!' : '✅ Вещь добавлена!', 'success');
      onSaved(result);
      onClose();
    } catch (error) {
      toast(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={event => event.target === event.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">{item ? 'Редактировать вещь' : 'Новая вещь'} {kind === 'accessories' ? '👜' : '👗'}</div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={submit}>
          <div className="form-group">
            <label className="form-label">Название*</label>
            <input
              name="name"
              value={form.name}
              onChange={handle}
              className="form-control"
              placeholder={kind === 'accessories' ? 'Золотые часы' : 'Белая рубашка'}
              required
            />
          </div>
          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Категория</label>
              <select name="category" value={form.category} onChange={handle} className="form-control">
                {categoryOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Сезон</label>
              <select name="season" value={form.season} onChange={handle} className="form-control">
                {SEASONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Цвет</label>
              <input name="color" value={form.color} onChange={handle} className="form-control" placeholder="Белый" />
            </div>
            <div className="form-group">
              <label className="form-label">Бренд</label>
              <input name="brand" value={form.brand} onChange={handle} className="form-control" placeholder="Massimo Dutti" />
            </div>
            <div className="form-group">
              <label className="form-label">Дата покупки</label>
              <input
                name="purchase_date"
                type="date"
                value={form.purchase_date}
                onChange={handle}
                className="form-control"
              />
            </div>
            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 28 }}>
              <input
                type="checkbox"
                id="fav"
                name="is_favorite"
                checked={form.is_favorite}
                onChange={handle}
                style={{ width: 16, height: 16, accentColor: 'var(--rose-deep)' }}
              />
              <label htmlFor="fav" style={{ fontSize: 14, cursor: 'pointer' }}>❤️ Любимая вещь</label>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Заметки</label>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handle}
              className="form-control form-control-notes"
              placeholder={kind === 'accessories' ? 'Подходит к строгим образам...' : 'Идеальна для офиса и встреч...'}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Фото</label>
            <input
              type="file"
              accept="image/*"
              ref={fileRef}
              style={{ display: 'none' }}
              onChange={event => setImgFile(event.target.files[0])}
            />
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => fileRef.current.click()}>
              📷 {imgFile ? imgFile.name : 'Выбрать фото'}
            </button>
          </div>
          <div className="flex gap-2 mt-4">
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <><span className="spinner" /> Сохраняю...</> : '💾 Сохранить'}
            </button>
            <button type="button" className="btn btn-outline" onClick={onClose}>Отмена</button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Pagination component ── */
function Pagination({ currentPage, totalPages, baseUrl }) {
  const navigate = useNavigate();

  if (totalPages <= 1) return null;

  const goTo = page => navigate(`${baseUrl}/page/${page}`);

  // Build page number list with ellipsis
  const pages = [];
  for (let i = 1; i <= totalPages; i++) {
    if (
      i === 1 ||
      i === totalPages ||
      (i >= currentPage - 1 && i <= currentPage + 1)
    ) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== '…') {
      pages.push('…');
    }
  }

  return (
    <div className="pagination">
      <button
        className="pagination-btn"
        onClick={() => goTo(currentPage - 1)}
        disabled={currentPage <= 1}
        aria-label="Предыдущая страница"
      >
        ‹
      </button>

      {pages.map((page, idx) =>
        page === '…' ? (
          <span key={`ellipsis-${idx}`} className="pagination-ellipsis">…</span>
        ) : (
          <button
            key={page}
            className={`pagination-btn${page === currentPage ? ' pagination-btn--active' : ''}`}
            onClick={() => goTo(page)}
            aria-label={`Страница ${page}`}
            aria-current={page === currentPage ? 'page' : undefined}
          >
            {page}
          </button>
        )
      )}

      <button
        className="pagination-btn"
        onClick={() => goTo(currentPage + 1)}
        disabled={currentPage >= totalPages}
        aria-label="Следующая страница"
      >
        ›
      </button>
    </div>
  );
}

export default function WardrobeCollectionPage({
  kind,
  pageTag,
  title,
  subtitle,
  emptyIcon,
  emptyTitle,
  emptyDesc,
  addLabel,
  baseUrl = '/wardrobe',
}) {
  const toast = useToast();
  const navigate = useNavigate();
  const { page: pageParam } = useParams();
  const currentPage = Math.max(1, parseInt(pageParam, 10) || 1);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [stats, setStats] = useState({});
  const [filter, setFilter] = useState({ category: '', season: '', search: '' });
  const categoryOptions = getCategoryOptions(kind);

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ kind });
      if (filter.category) params.append('category', filter.category);
      if (filter.season) params.append('season', filter.season);
      if (filter.search) params.append('search', filter.search);
      const [itemsRes, statsRes] = await Promise.all([
        api.get(`/wardrobe/?${params.toString()}`),
        api.get(`/wardrobe/stats/?${new URLSearchParams({ kind }).toString()}`),
      ]);
      setItems(itemsRes.results ?? itemsRes);
      setStats(statsRes);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [kind, filter.category, filter.season, filter.search]);

  // Reset to page 1 when filters change
  useEffect(() => {
    if (currentPage !== 1) {
      navigate(`${baseUrl}/page/1`, { replace: true });
    }
  }, [filter.category, filter.season, filter.search]);

  const totalPages = Math.ceil(items.length / ITEMS_PER_PAGE);
  const safeCurrentPage = Math.min(currentPage, totalPages || 1);
  const pagedItems = items.slice(
    (safeCurrentPage - 1) * ITEMS_PER_PAGE,
    safeCurrentPage * ITEMS_PER_PAGE,
  );

  const toggleFav = async item => {
    try {
      const response = await api.post(`/wardrobe/${item.id}/toggle_favorite/`);
      setItems(prev => prev.map(entry =>
        entry.id === item.id ? { ...entry, is_favorite: response.is_favorite } : entry
      ));
      setStats(prev => ({
        ...prev,
        favorites: Math.max(
          (prev.favorites ?? 0) + (response.is_favorite ? 1 : -1),
          0,
        ),
      }));
    } catch (error) {
      toast(error.message, 'error');
    }
  };

  const deleteItem = async id => {
    if (!window.confirm('Удалить вещь?')) return;
    await api.delete(`/wardrobe/${id}/`);
    const deleted = items.find(item => item.id === id);
    setItems(prev => prev.filter(item => item.id !== id));
    setStats(prev => ({
      ...prev,
      total: Math.max((prev.total || 1) - 1, 0),
      favorites: Math.max((prev.favorites ?? 0) - (deleted?.is_favorite ? 1 : 0), 0),
    }));
    toast('Удалено', 'default');
  };

  const onSaved = item => {
    setItems(prev => {
      const existingIndex = prev.findIndex(entry => entry.id === item.id);
      if (existingIndex >= 0) {
        return prev.map(entry => entry.id === item.id ? item : entry);
      }
      return [item, ...prev];
    });
    load();
  };

  const statCards = [
    { icon: kind === 'accessories' ? '👜' : '👗', val: stats.total ?? 0, label: kind === 'accessories' ? 'Всего аксессуаров' : 'Всего вещей' },
    { icon: '❤️', val: stats.favorites ?? 0, label: 'Любимых' },
    { icon: '📚', val: stats.by_category?.length ?? 0, label: 'Категорий' },
  ];

  return (
    <div className="fade-up">
      {/* ── Header ── */}
      <div className="page-header">
        <div className="page-tag">{pageTag}</div>
        <h1 className="page-title">{title}</h1>
        <p className="page-subtitle">{subtitle}</p>
      </div>

      {/* ── Stat cards ── */}
      <div className="wardrobe-stats-row">
        {statCards.map(card => (
          <div key={card.label} className="wardrobe-stat-card">
            <div className="wardrobe-stat-icon">{card.icon}</div>
            <div className="wardrobe-stat-num">{card.val}</div>
            <div className="wardrobe-stat-label">{card.label}</div>
          </div>
        ))}
      </div>

      {/* ── Filters + Add button ── */}
      <div className="wardrobe-toolbar">
        <div className="wardrobe-filters">
          <input
            placeholder="🔍 Поиск..."
            value={filter.search}
            onChange={event => setFilter(prev => ({ ...prev, search: event.target.value }))}
            className="form-control wardrobe-search"
          />
          <select
            value={filter.category}
            onChange={event => setFilter(prev => ({ ...prev, category: event.target.value }))}
            className="form-control wardrobe-select"
          >
            <option value="">Все категории</option>
            {categoryOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
          <select
            value={filter.season}
            onChange={event => setFilter(prev => ({ ...prev, season: event.target.value }))}
            className="form-control wardrobe-select wardrobe-select--sm"
          >
            <option value="">Все сезоны</option>
            {SEASONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </div>

        <button className="btn btn-primary wardrobe-add-btn" onClick={() => setModal('new')}>
          {addLabel}
        </button>
      </div>

      {/* ── Content ── */}
      {loading ? (
        <div className="loading-overlay">
          <span className="spinner spinner-dark" /> Загружаем коллекцию...
        </div>
      ) : items.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">{emptyIcon}</div>
          <div className="empty-title">{emptyTitle}</div>
          <p className="empty-desc">{emptyDesc}</p>
          <button className="btn btn-primary" onClick={() => setModal('new')}>{addLabel}</button>
        </div>
      ) : (
        <>
          <div className="grid-auto stagger">
            {pagedItems.map(item => (
              <div key={item.id} className="item-card fade-up" onClick={() => setModal(item)}>
                <div className="item-img">
                  {item.image_url ? <img src={item.image_url} alt={item.name} /> : <span>{getCategoryIcon(item.category)}</span>}
                  <button className="item-fav" onClick={event => { event.stopPropagation(); toggleFav(item); }}>
                    {item.is_favorite ? '❤️' : '🤍'}
                  </button>
                </div>
                <div className="item-body">
                  <div className="item-name">{item.name}</div>
                  <div className="item-meta">
                    {item.brand || 'без бренда'} · {item.color || 'цвет не указан'}
                  </div>
                </div>
                <div className="item-footer">
                  <span className={`category-pill cat-${item.category}`}>{item.category_label || getCategoryLabel(item.category)}</span>
                  <button
                    className="btn btn-danger btn-sm"
                    style={{ padding: '4px 10px', fontSize: 11 }}
                    onClick={event => { event.stopPropagation(); deleteItem(item.id); }}
                  >
                    🗑
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* ── Pagination ── */}
          {totalPages > 1 && (
            <div className="wardrobe-pagination-row">
              <span className="pagination-info">
                Показано {(safeCurrentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(safeCurrentPage * ITEMS_PER_PAGE, items.length)} из {items.length}
              </span>
              <Pagination
                currentPage={safeCurrentPage}
                totalPages={totalPages}
                baseUrl={baseUrl}
              />
            </div>
          )}
        </>
      )}

      {/* ── Modal ── */}
      {modal && (
        <ItemModal
          item={modal === 'new' ? null : modal}
          kind={kind}
          onClose={() => setModal(null)}
          onSaved={onSaved}
        />
      )}
    </div>
  );
}
