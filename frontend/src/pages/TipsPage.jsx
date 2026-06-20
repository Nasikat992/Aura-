import { useEffect, useRef, useState } from 'react';

import { api } from '../api/client';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';

const ALL_EXAMPLES = [
  'Я сегодня иду на встречу с HR, подбери мне образ.',
  'Мне нужен спокойный образ для офиса и прохладной погоды.',
  'Собери мне casual look на выходные с тем, что уже есть в гардеробе.',
  'Подбери образ для деловой встречи в теплую погоду.',
  'Мне нужен стильный look для вечера с друзьями.',
  'Собери повседневный образ для прогулки по городу.',
  'Подбери одежду для романтического свидания.',
  'Мне нужен комфортный образ для работы из дома.',
  'Собери спортивный look для активного отдыха.',
  'Подбери элегантный образ для важного события.',
  'Мне нужен минималистичный стиль на каждый день.',
  'Собери образ в стиле бохо для выходных.',
  'Подбери одежду для путешествия в прохладную погоду.',
  'Мне нужен яркий и запоминающийся look.',
  'Собери классический образ для офиса.',
  'Подбери комфортную одежду для долгого дня.',
  'Мне нужен стильный look для фотосессии.',
  'Собери образ в скандинавском стиле.',
  'Подбери одежду для пляжного отдыха.',
  'Мне нужен универсальный образ на все случаи жизни.',
];

// Функция для выбора 3 случайных примеров
const getRandomExamples = () => {
  const shuffled = [...ALL_EXAMPLES].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, 3);
};

function OutfitRecommendationCard({ recommendation }) {
  const { items = [], description = '', occasion = '' } = recommendation;

  return (
    <div className="outfit-recommendation-card">
      <div className="outfit-header">
        <h4>Рекомендуемый образ</h4>
        {occasion && <span className="outfit-occasion">{occasion}</span>}
      </div>
      
      {description && (
        <p className="outfit-description">{description}</p>
      )}
      
      <div className="outfit-items">
        {items.map((item, index) => (
          <div key={index} className="outfit-item">
            {item.image && (
              <img 
                src={item.image} 
                alt={item.name} 
                className="outfit-item-image"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            )}
            <div className="outfit-item-info">
              <div className="outfit-item-name">{item.name}</div>
              <div className="outfit-item-details">
                {item.category && <span>{item.category}</span>}
                {item.color && <span>{item.color}</span>}
                {item.brand && <span>{item.brand}</span>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Функция для парсинга рекомендаций образов из текста ИИ
const parseOutfitRecommendation = (content) => {
  // Ищем паттерны типа "ВЕРХ: Черный свитер" или "НИЗ: Синие джинсы"
  const lines = content.split('\n');
  const items = [];
  let description = '';
  let occasion = '';
  
  for (const line of lines) {
    const upperMatch = line.match(/^ВЕРХ:\s*(.+)$/i);
    const lowerMatch = line.match(/^НИЗ:\s*(.+)$/i);
    const shoesMatch = line.match(/^ОБУВЬ:\s*(.+)$/i);
    const accessoryMatch = line.match(/^АКСЕССУАРЫ?:\s*(.+)$/i);
    const occasionMatch = line.match(/^СИТУАЦИЯ:\s*(.+)$/i);
    
    if (upperMatch) {
      items.push({ name: upperMatch[1].trim(), category: 'Верхняя одежда' });
    } else if (lowerMatch) {
      items.push({ name: lowerMatch[1].trim(), category: 'Нижняя одежда' });
    } else if (shoesMatch) {
      items.push({ name: shoesMatch[1].trim(), category: 'Обувь' });
    } else if (accessoryMatch) {
      items.push({ name: accessoryMatch[1].trim(), category: 'Аксессуары' });
    } else if (occasionMatch) {
      occasion = occasionMatch[1].trim();
    } else if (!line.includes(':') && line.trim() && !description) {
      // Первая строка без двоеточия - описание
      description = line.trim();
    }
  }
  
  // Если нашли хотя бы 2 элемента, считаем это рекомендацией образа
  if (items.length >= 2) {
    return { items, description, occasion };
  }
  
  return null;
};

export default function TipsPage() {
  const toast = useToast();
  const { profile } = useAuth();
  const messagesEndRef = useRef(null);
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [prompt, setPrompt] = useState('');
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [examples, setExamples] = useState(getRandomExamples());

  const activeSession = sessions.find(session => session.id === activeSessionId) || null;

  const loadSessions = async (preferredId = null) => {
    setLoadingSessions(true);
    try {
      const response = await api.get('/chat-sessions/');
      const list = response.results ?? response;
      setSessions(list);
      const nextId = preferredId || activeSessionId || list[0]?.id || null;
      setActiveSessionId(nextId);
      if (!nextId) setMessages([]);
    } finally {
      setLoadingSessions(false);
    }
  };

  const loadMessages = async sessionId => {
    if (!sessionId) {
      setMessages([]);
      return;
    }
    setLoadingMessages(true);
    try {
      const response = await api.get(`/chat-sessions/${sessionId}/messages/`);
      setMessages(response.results ?? response);
    } finally {
      setLoadingMessages(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  useEffect(() => {
    loadMessages(activeSessionId);
  }, [activeSessionId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const createSession = async (firstPrompt = '') => {
    const created = await api.post('/chat-sessions/', {
      title: firstPrompt ? firstPrompt.slice(0, 70) : 'Новый диалог',
    });
    const nextSession = { ...created, last_message: null, messages_count: 0 };
    setSessions(prev => [nextSession, ...prev]);
    setActiveSessionId(created.id);
    setMessages([]);
    return created;
  };

  const sendMessage = async customPrompt => {
    const content = (customPrompt ?? prompt).trim();
    if (!content) return;

    setSending(true);
    try {
      let sessionId = activeSessionId;
      if (!sessionId) {
        const session = await createSession(content);
        sessionId = session.id;
      }

      const response = await api.post(`/chat-sessions/${sessionId}/messages/`, { content });
      const newMessages = response.messages || [];
      setMessages(prev => [...prev, ...newMessages]);
      setSessions(prev => {
        const updated = response.session;
        const rest = prev.filter(session => session.id !== updated.id);
        return [updated, ...rest];
      });
      setActiveSessionId(response.session.id);
      setPrompt('');
    } catch (error) {
      toast(error.message, 'error');
    } finally {
      setSending(false);
    }
  };

  const deleteSession = async sessionId => {
    if (!confirm('Удалить этот диалог? Это действие нельзя отменить.')) return;
    
    try {
      await api.delete(`/chat-sessions/${sessionId}/`);
      setSessions(prev => prev.filter(session => session.id !== sessionId));
      if (activeSessionId === sessionId) {
        const remaining = sessions.filter(session => session.id !== sessionId);
        setActiveSessionId(remaining[0]?.id || null);
      }
      toast('Диалог удален', 'success');
    } catch (error) {
      toast(error.message, 'error');
    }
  };

  const refreshExamples = () => {
    setExamples(getRandomExamples());
  };

  const onSubmit = async event => {
    event.preventDefault();
    await sendMessage();
  };

  return (
    <div className="fade-up">
      <div className="page-header">
        <div className="page-tag">AI Чат</div>
        <h1 className="page-title">Стильный <em>ассистент</em></h1>
        <p className="page-subtitle">Опиши событие или задачу, а ассистент подберёт образ на основе твоего гардероба и аксессуаров.</p>
      </div>

      <div className="chat-layout">
        <aside className="chat-sidebar card">
          <div className="flex-between" style={{ marginBottom: 16 }}>
            <div className="section-title" style={{ fontSize: 18 }}>Диалоги</div>
            <button className="btn btn-ghost btn-sm" onClick={() => createSession('')}>+ Новый</button>
          </div>

          {loadingSessions ? (
            <div style={{ color: 'var(--muted)', fontSize: 14 }}>Загружаем историю...</div>
          ) : sessions.length === 0 ? (
            <div style={{ color: 'var(--muted)', fontSize: 14, lineHeight: 1.6 }}>
              Здесь появятся твои чаты с ассистентом.
            </div>
          ) : (
            <div className="chat-session-list">
              {sessions.map(session => (
                <div key={session.id} className="chat-session-wrapper">
                  <button
                    className={`chat-session-item ${session.id === activeSessionId ? 'active' : ''}`}
                    onClick={() => setActiveSessionId(session.id)}
                  >
                    <div className="chat-session-title">{session.title || 'Новый диалог'}</div>
                    <div className="chat-session-preview">
                      {session.last_message?.content || 'Диалог пока пуст'}
                    </div>
                  </button>
                  <button 
                    className="chat-session-delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteSession(session.id);
                    }}
                    title="Удалить диалог"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </aside>

        <section className="chat-panel card">
          <div className="chat-panel-body">
            {loadingMessages ? (
              <div className="loading-overlay">
                <span className="spinner spinner-dark" /> Загружаем чат...
              </div>
            ) : messages.length === 0 ? (
              <div className="chat-empty-state">
                <div style={{ fontSize: 56, marginBottom: 14 }}>🤖</div>
                <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 30, marginBottom: 8 }}>
                  Спроси о своём образе
                </div>
                <p style={{ color: 'var(--muted)', maxWidth: 560, margin: '0 auto 22px', lineHeight: 1.7 }}>
                  Ассистент посмотрит на вещи в твоём гардеробе и предложит готовый комплект без лишней анкеты и сложных настроек.
                </p>
                <div className="chat-example-list">
                  {examples.map(example => (
                    <button key={example} className="chat-example" onClick={() => sendMessage(example)}>
                      {example}
                    </button>
                  ))}
                  <button className="chat-example-refresh" onClick={refreshExamples} title="Показать другие примеры">
                    🔄
                  </button>
                </div>
              </div>
            ) : (
              <div className="chat-messages">
                {messages.map(message => {
                  const outfitRecommendation = message.role === 'assistant' ? parseOutfitRecommendation(message.content) : null;
                  
                  let displayContent = message.content;
                  let imageUrl = message.image_url;

                  // Parse image URL from content if it was saved as text in the database
                  if (!imageUrl && displayContent) {
                    if (displayContent.includes('image.pollinations.ai')) {
                      const match = displayContent.match(/(https:\/\/image\.pollinations\.ai[^\s]+)/);
                      if (match) {
                        imageUrl = match[1];
                        displayContent = displayContent.replace(imageUrl, '').trim();
                      }
                    } else if (displayContent.includes('data:image/')) {
                      const match = displayContent.match(/(data:image\/[^\s]+)/);
                      if (match) {
                        imageUrl = match[1];
                        displayContent = displayContent.replace(imageUrl, '').trim();
                      }
                    }
                  }
                  
                  return (
                    <div key={message.id} className={`chat-message ${message.role}`}>
                      <div className="chat-bubble">
                        <div className="chat-role">{message.role === 'assistant' ? 'AURA' : 'Ты'}</div>
                        <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>{displayContent}</div>
                        {imageUrl && (
                          <img
                            src={imageUrl}
                            alt="AI примерка образа"
                            className="chat-generated-image"
                          />
                        )}
                        {outfitRecommendation && (
                          <OutfitRecommendationCard recommendation={outfitRecommendation} />
                        )}
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          <form onSubmit={onSubmit} className="chat-composer">
            <textarea
              value={prompt}
              onChange={event => setPrompt(event.target.value)}
              className="form-control"
              placeholder="Например: Я иду на встречу с HR, хочу выглядеть уверенно и спокойно. Подбери образ из моего гардероба."
            />
            <div className="flex-between" style={{ alignItems: 'center', gap: 12 }}>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                {activeSession ? `Диалог: ${activeSession.title || 'Новый чат'}` : 'Начни новый диалог одним сообщением'}
              </div>
              <button className="btn btn-primary" type="submit" disabled={sending}>
                {sending ? <><span className="spinner" /> Отправляю...</> : 'Отправить'}
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
