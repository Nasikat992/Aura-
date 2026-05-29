import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import { colors, typography, shadows } from '../styles/theme';
import { api } from '../api/client';
import { useToast } from '../hooks/useToast';
import OutfitRecommendationCard from '../components/OutfitRecommendationCard';

const ALL_EXAMPLES = [
  'Я сегодня иду на встречу с HR, подбери мне образ.',
  'Мне нужен спокойный образ для офиса и прохладной погоды.',
  'Собери мне casual look на выходные с тем, что уже есть в гардеробе.',
  'Подбери образ для деловой встречи в теплую погоду.',
  'Мне нужен стильный look для вечера с друзьями.',
  'Собери повседневный образ для прогулки по городу.',
];

const getRandomExamples = () => {
  const shuffled = [...ALL_EXAMPLES].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, 3);
};

const parseOutfitRecommendation = (content) => {
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
      description = line.trim();
    }
  }
  
  if (items.length >= 2) {
    return { items, description, occasion };
  }
  return null;
};

export default function TipsScreen() {
  const toast = useToast();
  const scrollRef = useRef();

  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [prompt, setPrompt] = useState('');
  
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [examples, setExamples] = useState(getRandomExamples());
  const [showSessionsList, setShowSessionsList] = useState(false);

  const activeSession = sessions.find(s => s.id === activeSessionId) || null;

  const loadSessions = async (preferredId = null) => {
    setLoadingSessions(true);
    try {
      const response = await api.get('/chat-sessions/');
      const list = response.results ?? response;
      setSessions(list);
      
      const nextId = preferredId || activeSessionId || list[0]?.id || null;
      setActiveSessionId(nextId);
      if (!nextId) setMessages([]);
    } catch (err) {
      console.log('Error loading sessions:', err);
    } finally {
      setLoadingSessions(false);
    }
  };

  const loadMessages = async (sessionId) => {
    if (!sessionId) {
      setMessages([]);
      return;
    }
    setLoadingMessages(true);
    try {
      const response = await api.get(`/chat-sessions/${sessionId}/messages/`);
      setMessages(response.results ?? response);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (err) {
      console.log('Error loading messages:', err);
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

  const handleCreateSession = async (firstPrompt = '') => {
    try {
      const created = await api.post('/chat-sessions/', {
        title: firstPrompt ? firstPrompt.slice(0, 40) : 'Новый диалог',
      });
      const nextSession = { ...created, last_message: null, messages_count: 0 };
      setSessions(prev => [nextSession, ...prev]);
      setActiveSessionId(created.id);
      setMessages([]);
      setShowSessionsList(false);
      return created;
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  const handleSendMessage = async (customPrompt) => {
    const content = (customPrompt ?? prompt).trim();
    if (!content) return;

    setSending(true);
    setPrompt('');
    try {
      let sessionId = activeSessionId;
      if (!sessionId) {
        const session = await handleCreateSession(content);
        sessionId = session.id;
      }

      // Add temporary user message to UI for fast responsiveness
      const tempUserMsg = { id: Date.now(), role: 'user', content };
      setMessages(prev => [...prev, tempUserMsg]);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);

      const response = await api.post(`/chat-sessions/${sessionId}/messages/`, { content });
      const newMessages = response.messages || [];
      
      // Update with correct database messages (user & assistant)
      setMessages(prev => prev.filter(m => m.id !== tempUserMsg.id).concat(newMessages));
      
      setSessions(prev => {
        const updated = response.session;
        const rest = prev.filter(s => s.id !== updated.id);
        return [updated, ...rest];
      });
      setActiveSessionId(response.session.id);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (error) {
      toast(error.message, 'error');
    } finally {
      setSending(false);
    }
  };

  const handleDeleteSession = (id) => {
    Alert.alert(
      'Удалить диалог',
      'Вы уверены, что хотите удалить этот диалог? История сообщений будет стёрта.',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Удалить',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/chat-sessions/${id}/`);
              setSessions(prev => prev.filter(s => s.id !== id));
              if (activeSessionId === id) {
                const remaining = sessions.filter(s => s.id !== id);
                setActiveSessionId(remaining[0]?.id || null);
              }
              toast('🗑️ Диалог успешно удален', 'info');
            } catch (err) {
              toast(err.message, 'error');
            }
          },
        },
      ]
    );
  };

  const handleRefreshExamples = () => {
    setExamples(getRandomExamples());
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      style={styles.container}
    >
      {/* Session selection header */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.sessionsToggleBtn}
          onPress={() => setShowSessionsList(!showSessionsList)}
        >
          <Text style={styles.sessionsToggleText}>
            💬 {activeSession ? activeSession.title : 'Выберите диалог'} ▾
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.newChatBtn}
          onPress={() => handleCreateSession('')}
        >
          <Text style={styles.newChatText}>+ Новый</Text>
        </TouchableOpacity>
      </View>

      {/* Floating Sessions List Overlay */}
      {showSessionsList && (
        <View style={styles.overlayList}>
          <Text style={styles.overlayTitle}>История диалогов</Text>
          {loadingSessions ? (
            <ActivityIndicator color={colors.roseDeep} />
          ) : sessions.length === 0 ? (
            <Text style={styles.noSessionsText}>Нет сохраненных диалогов</Text>
          ) : (
            <ScrollView style={styles.overlayScroll} nestedScrollEnabled={true}>
              {sessions.map(s => (
                <View key={s.id} style={styles.sessionRow}>
                  <TouchableOpacity
                    style={[styles.sessionItem, s.id === activeSessionId && styles.sessionItemActive]}
                    onPress={() => {
                      setActiveSessionId(s.id);
                      setShowSessionsList(false);
                    }}
                  >
                    <Text style={[styles.sessionText, s.id === activeSessionId && styles.sessionTextActive]} numberOfLines={1}>
                      {s.title || 'Без названия'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.delSessionBtn} onPress={() => handleDeleteSession(s.id)}>
                    <Text style={styles.delSessionText}>×</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          )}
        </View>
      )}

      {/* Chat Messages */}
      <View style={styles.chatArea}>
        {loadingMessages ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.roseDeep} />
            <Text style={styles.loadingText}>Загружаем переписку...</Text>
          </View>
        ) : messages.length === 0 ? (
          /* Empty Chat Welcome Screen */
          <ScrollView contentContainerStyle={styles.emptyWelcome} keyboardShouldPersistTaps="handled">
            <Text style={styles.welcomeEmoji}>🤖</Text>
            <Text style={styles.welcomeTitle}>Спроси о своём образе</Text>
            <Text style={styles.welcomeDesc}>
              Ассистент посмотрит на вещи в твоём гардеробе и предложит готовый комплект без лишней анкеты и сложных настроек.
            </Text>
            <View style={styles.examplesList}>
              {examples.map(ex => (
                <TouchableOpacity key={ex} style={styles.exampleCard} onPress={() => handleSendMessage(ex)}>
                  <Text style={styles.exampleText}>{ex}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity style={styles.refreshBtn} onPress={handleRefreshExamples}>
                <Text style={styles.refreshBtnText}>🔄 Другие примеры</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        ) : (
          /* Messages List */
          <ScrollView
            ref={scrollRef}
            contentContainerStyle={styles.messagesScroll}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
          >
            {messages.map(m => {
              const isUser = m.role === 'user';
              const outfitRecommendation = !isUser ? parseOutfitRecommendation(m.content) : null;
              
              return (
                <View key={m.id} style={[styles.messageRow, isUser ? styles.userRow : styles.assistantRow]}>
                  <View style={[styles.bubble, isUser ? styles.userBubble : styles.assistantBubble]}>
                    <Text style={[styles.bubbleRole, isUser ? styles.userRoleText : styles.assistantRoleText]}>
                      {isUser ? 'Вы' : 'AURA'}
                    </Text>
                    <Text style={[styles.bubbleText, isUser ? styles.userText : styles.assistantText]}>
                      {m.content}
                    </Text>
                    {outfitRecommendation && (
                      <OutfitRecommendationCard recommendation={outfitRecommendation} />
                    )}
                  </View>
                </View>
              );
            })}
          </ScrollView>
        )}
      </View>

      {/* Composer Input */}
      <View style={styles.composer}>
        <TextInput
          style={styles.composerInput}
          value={prompt}
          onChangeText={setPrompt}
          placeholder="Спросите AI-стилиста..."
          placeholderTextColor={colors.muted}
          multiline={true}
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!prompt.trim() || sending) && styles.sendBtnDisabled]}
          onPress={() => handleSendMessage()}
          disabled={!prompt.trim() || sending}
        >
          {sending ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <Text style={styles.sendBtnText}>Отправить</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderColor: colors.border,
    zIndex: 10,
  },
  sessionsToggleBtn: {
    flex: 1,
    marginRight: 12,
  },
  sessionsToggleText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.roseDeep,
  },
  newChatBtn: {
    backgroundColor: colors.blush,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  newChatText: {
    fontSize: 12,
    color: colors.roseDeep,
    fontWeight: '700',
  },
  overlayList: {
    position: 'absolute',
    top: 52,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderColor: colors.border,
    maxHeight: 220,
    padding: 16,
    zIndex: 9,
    ...shadows.md,
  },
  overlayTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  noSessionsText: {
    fontSize: 13,
    color: colors.muted,
    textAlign: 'center',
    marginVertical: 12,
  },
  overlayScroll: {
    maxHeight: 160,
  },
  sessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: '#FAF5F3',
  },
  sessionItem: {
    flex: 1,
    paddingVertical: 10,
  },
  sessionItemActive: {
    backgroundColor: colors.blush,
  },
  sessionText: {
    fontSize: 13,
    color: colors.text,
  },
  sessionTextActive: {
    fontWeight: '700',
    color: colors.roseDeep,
  },
  delSessionBtn: {
    padding: 8,
  },
  delSessionText: {
    fontSize: 16,
    color: colors.danger,
    fontWeight: '700',
  },
  chatArea: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 13,
    color: colors.muted,
  },
  emptyWelcome: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  welcomeEmoji: {
    fontSize: 56,
    marginBottom: 12,
  },
  welcomeTitle: {
    fontSize: 22,
    fontFamily: typography.titleBold,
    color: colors.text,
    marginBottom: 8,
  },
  welcomeDesc: {
    fontSize: 13,
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 24,
  },
  examplesList: {
    width: '100%',
    gap: 10,
  },
  exampleCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
    ...shadows.sm,
  },
  exampleText: {
    fontSize: 12,
    color: colors.text,
    lineHeight: 16,
  },
  refreshBtn: {
    alignItems: 'center',
    paddingVertical: 8,
    marginTop: 6,
  },
  refreshBtnText: {
    fontSize: 12,
    color: colors.roseDeep,
    fontWeight: '700',
  },
  messagesScroll: {
    padding: 16,
    gap: 16,
    paddingBottom: 30,
  },
  messageRow: {
    flexDirection: 'row',
    width: '100%',
  },
  userRow: {
    justifyContent: 'flex-end',
  },
  assistantRow: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '85%',
    borderRadius: 16,
    padding: 12,
    ...shadows.sm,
  },
  userBubble: {
    backgroundColor: colors.roseDeep,
    borderBottomRightRadius: 2,
  },
  assistantBubble: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.border,
    borderBottomLeftRadius: 2,
  },
  bubbleRole: {
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  userRoleText: {
    color: 'rgba(255,255,255,0.7)',
  },
  assistantRoleText: {
    color: colors.roseDeep,
  },
  bubbleText: {
    fontSize: 14,
    lineHeight: 20,
  },
  userText: {
    color: '#FFFFFF',
  },
  assistantText: {
    color: colors.text,
  },
  composer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    gap: 12,
  },
  composerInput: {
    flex: 1,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    maxHeight: 80,
    color: colors.text,
  },
  sendBtn: {
    backgroundColor: colors.roseDeep,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: {
    opacity: 0.5,
  },
  sendBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
