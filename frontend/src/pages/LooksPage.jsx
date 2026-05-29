import { useEffect, useState } from 'react';

import { api } from '../api/client';
import { getCategoryIcon, getCategoryLabel } from '../constants/wardrobe';
import { useToast } from '../hooks/useToast';

async function fetchAllPages(url) {
  let nextUrl = url;
  let results = [];

  while (nextUrl) {
    const response = await api.get(nextUrl);
    if (Array.isArray(response)) {
      results = [...results, ...response];
      break;
    }

    results = [...results, ...(response.results ?? [])];
    if (!response.next) break;

    const next = new URL(response.next);
    nextUrl = `${next.pathname.replace('/api', '')}${next.search}`;
  }

  return results;
}

function LookCard({ look, onEdit, onDelete, onRate, ratingId }) {
  const title = look.name?.trim() || 'Образ без названия';
  const itemCount = look.items_detail?.length ?? look.items?.length ?? 0;
  const ratingText = look.rating ? '★'.repeat(look.rating) : 'Без оценки';

  return (
    <article className="look-card">
      <div className="look-card-head">
        <div>
          <div className="look-card-title">{title}</div>
          <div className="look-card-meta">
            {look.collection_detail?.name || 'Без коллекции'} · {itemCount} вещей
          </div>
        </div>
        <div className="look-rating-badge">{ratingText}</div>
      </div>

      <div className="look-chip-list">
        {(look.items_detail || []).slice(0, 5).map(item => (
          <span key={item.id} className="look-chip">
            {getCategoryIcon(item.category)} {item.name}
          </span>
        ))}
      </div>

      <div className={`ai-feedback-box ${look.ai_feedback ? 'ready' : ''}`}>
        {look.ai_feedback || 'Пока без AI-оценки. Сохрани образ и запусти анализ.'}
      </div>

      <div className="look-card-actions">
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => onEdit(look)}>Редактировать</button>
        <button type="button" className="btn btn-outline btn-sm" onClick={() => onRate(look.id)} disabled={ratingId === look.id}>
          {ratingId === look.id ? 'Оцениваю...' : 'Оценить AI'}
        </button>
        <button type="button" className="btn btn-danger btn-sm" onClick={() => onDelete(look.id)}>Удалить</button>
      </div>
    </article>
  );
}

export default function LooksPage() {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [collections, setCollections] = useState([]);
  const [looks, setLooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingCollection, setSavingCollection] = useState(false);
  const [savingLook, setSavingLook] = useState(false);
  const [ratingLookId, setRatingLookId] = useState(null);
  const [editingLookId, setEditingLookId] = useState(null);
  const [lookName, setLookName] = useState('');
  const [collectionId, setCollectionId] = useState('');
  const [selectedItemIds, setSelectedItemIds] = useState([]);
  const [rating, setRating] = useState(0);
  const [aiFeedback, setAiFeedback] = useState('');
  const [collectionName, setCollectionName] = useState('');
  const [collectionDescription, setCollectionDescription] = useState('');
  const [collectionFilter, setCollectionFilter] = useState('');

  const selectedItems = items.filter(item => selectedItemIds.includes(item.id));
  const filteredLooks = collectionFilter
    ? looks.filter(look => String(look.collection ?? '') === String(collectionFilter))
    : looks;
  const getCollectionLookCount = collectionIdValue => looks.filter(
    look => String(look.collection ?? '') === String(collectionIdValue),
  ).length;

  const resetEditor = () => {
    setEditingLookId(null);
    setLookName('');
    setCollectionId('');
    setSelectedItemIds([]);
    setRating(0);
    setAiFeedback('');
  };

  const syncLookInState = look => {
    setLooks(prev => {
      const next = prev.filter(entry => entry.id !== look.id);
      return [look, ...next];
    });
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [wardrobeItems, accessoryItems, collectionsRes, looksRes] = await Promise.all([
        fetchAllPages('/wardrobe/?kind=wardrobe'),
        fetchAllPages('/wardrobe/?kind=accessories'),
        api.get('/collections/'),
        api.get('/looks/'),
      ]);
      setItems([...wardrobeItems, ...accessoryItems]);
      setCollections(collectionsRes.results ?? collectionsRes);
      setLooks(looksRes.results ?? looksRes);
    } catch (error) {
      toast(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const validItemIds = new Set(items.map(item => item.id));
    setSelectedItemIds(prev => prev.filter(id => validItemIds.has(id)));
  }, [items]);

  useEffect(() => {
    if (!collectionId) return;
    const hasCollection = collections.some(collection => String(collection.id) === String(collectionId));
    if (!hasCollection) {
      setCollectionId('');
    }
  }, [collectionId, collections]);

  const toggleItem = itemId => {
    setSelectedItemIds(prev => (
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    ));
  };

  const editLook = look => {
    setEditingLookId(look.id);
    setLookName(look.name || '');
    setCollectionId(look.collection ? String(look.collection) : '');
    setSelectedItemIds((look.items || []).map(Number));
    setRating(look.rating || 0);
    setAiFeedback(look.ai_feedback || '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const saveCollection = async event => {
    event.preventDefault();
    if (!collectionName.trim()) return;
    setSavingCollection(true);
    try {
      const created = await api.post('/collections/', {
        name: collectionName.trim(),
        description: collectionDescription.trim(),
      });
      setCollections(prev => [created, ...prev]);
      setCollectionId(String(created.id));
      setCollectionName('');
      setCollectionDescription('');
      toast('Коллекция создана', 'success');
    } catch (error) {
      toast(error.message, 'error');
    } finally {
      setSavingCollection(false);
    }
  };

  const saveLook = async event => {
    event.preventDefault();
    const validItemIds = new Set(items.map(item => item.id));
    const sanitizedItemIds = selectedItemIds.filter(id => validItemIds.has(id));
    const normalizedCollectionId = collectionId && collections.some(
      collection => String(collection.id) === String(collectionId),
    )
      ? Number(collectionId)
      : null;

    if (sanitizedItemIds.length !== selectedItemIds.length) {
      setSelectedItemIds(sanitizedItemIds);
    }

    if (normalizedCollectionId === null && collectionId) {
      setCollectionId('');
    }

    if (!sanitizedItemIds.length) {
      toast('Выбери хотя бы одну вещь для образа.', 'error');
      return;
    }

    setSavingLook(true);
    try {
      const payload = {
        name: lookName.trim(),
        collection: normalizedCollectionId,
        items: sanitizedItemIds,
      };
      const saved = editingLookId
        ? await api.patch(`/looks/${editingLookId}/`, payload)
        : await api.post('/looks/', payload);
      syncLookInState(saved);
      setEditingLookId(saved.id);
      setLookName(saved.name || '');
      setCollectionId(saved.collection ? String(saved.collection) : '');
      setSelectedItemIds((saved.items || []).map(Number));
      setRating(saved.rating || 0);
      setAiFeedback(saved.ai_feedback || '');
      toast(editingLookId ? 'Образ обновлён' : 'Образ сохранён', 'success');
    } catch (error) {
      toast(error.message, 'error');
    } finally {
      setSavingLook(false);
    }
  };

  const deleteCollection = async id => {
    if (!window.confirm('Удалить коллекцию? Образы останутся, но будут без коллекции.')) return;
    try {
      await api.delete(`/collections/${id}/`);
      setCollections(prev => prev.filter(collection => collection.id !== id));
      setLooks(prev => prev.map(look => (
        look.collection === id
          ? { ...look, collection: null, collection_detail: null }
          : look
      )));
      if (String(collectionId) === String(id)) setCollectionId('');
      if (String(collectionFilter) === String(id)) setCollectionFilter('');
      toast('Коллекция удалена', 'default');
    } catch (error) {
      toast(error.message, 'error');
    }
  };

  const deleteLook = async id => {
    if (!window.confirm('Удалить образ?')) return;
    try {
      await api.delete(`/looks/${id}/`);
      setLooks(prev => prev.filter(look => look.id !== id));
      if (editingLookId === id) resetEditor();
      toast('Образ удалён', 'default');
    } catch (error) {
      toast(error.message, 'error');
    }
  };

  const rateLook = async id => {
    setRatingLookId(id);
    try {
      const updated = await api.post(`/looks/${id}/ai_feedback/`, {});
      syncLookInState(updated);
      if (editingLookId === id) {
        setRating(updated.rating || 0);
        setAiFeedback(updated.ai_feedback || '');
      }
      toast('AI оценил образ', 'success');
    } catch (error) {
      toast(error.message, 'error');
    } finally {
      setRatingLookId(null);
    }
  };

  const applyCollectionToEditor = id => setCollectionId(String(id));

  return (
    <div className="fade-up">
      <div className="page-header">
        <div className="page-tag">Looks Lab</div>
        <h1 className="page-title">Мои <em>образы</em></h1>
        <p className="page-subtitle">
          Собирай комплекты из своего гардероба, сохраняй их в коллекции и получай короткую AI-оценку.
        </p>
      </div>

      <div style={{ display: 'flex', gap: 16, marginBottom: 28, flexWrap: 'wrap' }}>
        {[
          { icon: '✨', val: looks.length, label: 'Всего образов' },
          { icon: '🗂️', val: collections.length, label: 'Коллекций' },
          { icon: '⭐', val: looks.filter(look => look.rating > 0).length, label: 'С оценкой AI' },
        ].map(card => (
          <div key={card.label} className="card-sm" style={{ flex: 1, minWidth: 160, textAlign: 'center' }}>
            <div style={{ fontSize: 22 }}>{card.icon}</div>
            <div style={{ fontFamily: 'Cormorant Garamond,serif', fontSize: 26, color: 'var(--rose-deep)' }}>{card.val}</div>
            <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1 }}>{card.label}</div>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="loading-overlay">
          <span className="spinner spinner-dark" /> Загружаем твои образы...
        </div>
      ) : (
        <>
          <div className="looks-layout">
            <section className="card">
              <div className="flex-between" style={{ marginBottom: 16, gap: 12, flexWrap: 'wrap' }}>
                <div>
                  <div className="section-title" style={{ marginBottom: 6 }}>
                    {editingLookId ? 'Редактирование образа' : 'Собрать новый образ'}
                  </div>
                  <div className="text-muted" style={{ fontSize: 14 }}>
                    Выбрано вещей: {selectedItemIds.length}
                  </div>
                </div>
                {editingLookId && (
                  <button type="button" className="btn btn-ghost btn-sm" onClick={resetEditor}>
                    Сбросить редактор
                  </button>
                )}
              </div>

              <form onSubmit={saveLook}>
                <div className="form-grid-2">
                  <div className="form-group">
                    <label className="form-label">Название образа</label>
                    <input
                      className="form-control"
                      value={lookName}
                      onChange={event => setLookName(event.target.value)}
                      placeholder="Например, Office Friday"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Коллекция</label>
                    <select
                      className="form-control"
                      value={collectionId}
                      onChange={event => setCollectionId(event.target.value)}
                    >
                      <option value="">Без коллекции</option>
                      {collections.map(collection => (
                        <option key={collection.id} value={collection.id}>{collection.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Подходящие вещи</label>
                  {items.length === 0 ? (
                    <div className="empty-state" style={{ padding: '32px 16px' }}>
                      <div className="empty-icon" style={{ fontSize: 40 }}>👗</div>
                      <div className="empty-title">Гардероб пока пуст</div>
                      <p className="empty-desc">Сначала добавь вещи в гардероб и аксессуары, чтобы собирать образы.</p>
                    </div>
                  ) : (
                    <div className="looks-item-grid">
                      {items.map(item => {
                        const selected = selectedItemIds.includes(item.id);
                        return (
                          <button
                            key={item.id}
                            type="button"
                            className={`look-select-card ${selected ? 'selected' : ''}`}
                            onClick={() => toggleItem(item.id)}
                          >
                            <div className="look-select-media">
                              {item.image_url ? <img src={item.image_url} alt={item.name} /> : <span>{getCategoryIcon(item.category)}</span>}
                            </div>
                            <div className="look-select-title">{item.name}</div>
                            <div className="look-select-meta">{getCategoryLabel(item.category)}</div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="look-chip-list" style={{ marginBottom: 18 }}>
                  {selectedItems.map(item => (
                    <button
                      key={item.id}
                      type="button"
                      className="look-chip look-chip-remove"
                      onClick={() => toggleItem(item.id)}
                    >
                      {getCategoryIcon(item.category)} {item.name} ×
                    </button>
                  ))}
                  {selectedItems.length === 0 && <span className="text-muted">Выбранные вещи появятся здесь.</span>}
                </div>

                {(rating > 0 || aiFeedback) && (
                  <div className="ai-feedback-box ready" style={{ marginBottom: 18 }}>
                    <strong style={{ display: 'block', marginBottom: 6 }}>AI оценка: {rating ? `${rating}/5` : 'ожидается'}</strong>
                    {aiFeedback || 'Пока без комментария.'}
                  </div>
                )}

                <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
                  <button className="btn btn-primary" type="submit" disabled={savingLook}>
                    {savingLook ? 'Сохраняю...' : editingLookId ? 'Сохранить изменения' : 'Сохранить образ'}
                  </button>
                  {editingLookId && (
                    <button
                      className="btn btn-outline"
                      type="button"
                      onClick={() => rateLook(editingLookId)}
                      disabled={ratingLookId === editingLookId}
                    >
                      {ratingLookId === editingLookId ? 'Оцениваю...' : 'Оценить AI'}
                    </button>
                  )}
                </div>
              </form>
            </section>

            <aside className="card">
              <div className="section-title">Коллекции</div>
              <p className="text-muted" style={{ fontSize: 14, marginBottom: 18 }}>
                Сохраняй свои стилистические подборки: Streetwear, Old Money, Office и другие.
              </p>

              <form onSubmit={saveCollection} style={{ marginBottom: 22 }}>
                <div className="form-group">
                  <label className="form-label">Название коллекции</label>
                  <input
                    className="form-control"
                    value={collectionName}
                    onChange={event => setCollectionName(event.target.value)}
                    placeholder="Например, Weekend Soft"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Описание</label>
                  <textarea
                    className="form-control form-control-notes"
                    value={collectionDescription}
                    onChange={event => setCollectionDescription(event.target.value)}
                    placeholder="Коротко опиши вайб этой коллекции"
                  />
                </div>
                <button className="btn btn-primary" type="submit" disabled={savingCollection}>
                  {savingCollection ? 'Создаю...' : 'Создать коллекцию'}
                </button>
              </form>

              <div className="looks-collection-list">
                <button
                  type="button"
                  className={`look-collection-row ${collectionFilter === '' ? 'active' : ''}`}
                  onClick={() => setCollectionFilter('')}
                >
                  <span>Все образы</span>
                  <span>{looks.length}</span>
                </button>
                {collections.map(collection => (
                  <div key={collection.id} className={`look-collection-row ${String(collectionFilter) === String(collection.id) ? 'active' : ''}`}>
                    <button type="button" className="look-collection-main" onClick={() => setCollectionFilter(String(collection.id))}>
                      <span>{collection.name}</span>
                      <span>{getCollectionLookCount(collection.id)}</span>
                    </button>
                    <div className="flex gap-2">
                      <button type="button" className="btn btn-ghost btn-sm" onClick={() => applyCollectionToEditor(collection.id)}>
                        В редактор
                      </button>
                      <button type="button" className="btn btn-danger btn-sm" onClick={() => deleteCollection(collection.id)}>
                        ×
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </aside>
          </div>

          <section className="card mt-6">
            <div className="flex-between" style={{ marginBottom: 18, gap: 12, flexWrap: 'wrap' }}>
              <div>
                <div className="section-title" style={{ marginBottom: 6 }}>Сохранённые образы</div>
                <div className="text-muted" style={{ fontSize: 14 }}>
                  {collectionFilter ? 'Показаны образы выбранной коллекции.' : 'Здесь хранятся все твои сохранённые комбинации.'}
                </div>
              </div>
              <select
                className="form-control"
                style={{ width: 240 }}
                value={collectionFilter}
                onChange={event => setCollectionFilter(event.target.value)}
              >
                <option value="">Все коллекции</option>
                {collections.map(collection => (
                  <option key={collection.id} value={collection.id}>{collection.name}</option>
                ))}
              </select>
            </div>

            {filteredLooks.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">✨</div>
                <div className="empty-title">Образов пока нет</div>
                <p className="empty-desc">Собери первый комплект выше и сохрани его в одну из коллекций.</p>
              </div>
            ) : (
              <div className="looks-saved-grid">
                {filteredLooks.map(look => (
                  <LookCard
                    key={look.id}
                    look={look}
                    onEdit={editLook}
                    onDelete={deleteLook}
                    onRate={rateLook}
                    ratingId={ratingLookId}
                  />
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
