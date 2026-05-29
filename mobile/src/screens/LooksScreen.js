import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { colors, typography, shadows } from '../styles/theme';
import { getCategoryIcon, getCategoryLabel } from '../constants/wardrobe';
import { api } from '../api/client';
import { useToast } from '../hooks/useToast';

export default function LooksScreen() {
  const toast = useToast();
  
  // Tab control: 'list' (My Looks) or 'editor' (Looks Lab)
  const [activeTab, setActiveTab] = useState('list');
  
  const [items, setItems] = useState([]);
  const [collections, setCollections] = useState([]);
  const [looks, setLooks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Editor states
  const [editingLookId, setEditingLookId] = useState(null);
  const [lookName, setLookName] = useState('');
  const [collectionId, setCollectionId] = useState('');
  const [selectedItemIds, setSelectedItemIds] = useState([]);
  const [lookRating, setLookRating] = useState(0);
  const [lookFeedback, setLookFeedback] = useState('');
  
  // Collection creation states
  const [colName, setColName] = useState('');
  const [colDesc, setColDesc] = useState('');
  const [showColForm, setShowColForm] = useState(false);

  // Filters
  const [collectionFilter, setCollectionFilter] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [wardrobeRes, collectionsRes, looksRes] = await Promise.all([
        api.get('/wardrobe/'),
        api.get('/collections/'),
        api.get('/looks/'),
      ]);
      setItems(wardrobeRes.results ?? wardrobeRes);
      setCollections(collectionsRes.results ?? collectionsRes);
      setLooks(looksRes.results ?? looksRes);
    } catch (err) {
      console.log('Error loading looks data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const toggleSelectItem = (id) => {
    setSelectedItemIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleCreateCollection = async () => {
    if (!colName.trim()) {
      toast('Название коллекции обязательно', 'error');
      return;
    }
    try {
      const result = await api.post('/collections/', {
        name: colName.trim(),
        description: colDesc.trim(),
      });
      setCollections(prev => [result, ...prev]);
      setCollectionId(String(result.id));
      setColName('');
      setColDesc('');
      setShowColForm(false);
      toast('✨ Коллекция успешно создана', 'success');
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  const handleSaveLook = async () => {
    if (!selectedItemIds.length) {
      toast('Выберите хотя бы одну вещь для образа', 'error');
      return;
    }
    try {
      const payload = {
        name: lookName.trim() || 'Образ без названия',
        collection: collectionId ? Number(collectionId) : null,
        items: selectedItemIds,
      };

      const result = editingLookId
        ? await api.patch(`/looks/${editingLookId}/`, payload)
        : await api.post('/looks/', payload);

      setLooks(prev => {
        const rest = prev.filter(l => l.id !== result.id);
        return [result, ...rest];
      });

      toast(editingLookId ? '✨ Изменения сохранены!' : '✨ Образ успешно сохранен!', 'success');
      
      // Reset
      resetEditor();
      setActiveTab('list');
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  const resetEditor = () => {
    setEditingLookId(null);
    setLookName('');
    setCollectionId('');
    setSelectedItemIds([]);
    setLookRating(0);
    setLookFeedback('');
  };

  const handleEditLook = (look) => {
    setEditingLookId(look.id);
    setLookName(look.name || '');
    setCollectionId(look.collection ? String(look.collection) : '');
    setSelectedItemIds((look.items || []).map(Number));
    setLookRating(look.rating || 0);
    setLookFeedback(look.ai_feedback || '');
    setActiveTab('editor');
  };

  const handleDeleteLook = (id) => {
    Alert.alert(
      'Удалить образ',
      'Вы уверены, что хотите удалить этот образ?',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Удалить',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/looks/${id}/`);
              setLooks(prev => prev.filter(l => l.id !== id));
              toast('🗑️ Образ удален', 'info');
            } catch (err) {
              toast(err.message, 'error');
            }
          },
        },
      ]
    );
  };

  const handleEvaluateAI = async (id) => {
    toast('🤖 Запуск AI-анализа...', 'info');
    try {
      const result = await api.post(`/looks/${id}/ai_feedback/`, {});
      setLooks(prev => prev.map(l => l.id === id ? result : l));
      toast('✨ AI-оценка завершена!', 'success');
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  const filteredLooks = collectionFilter
    ? looks.filter(l => String(l.collection) === String(collectionFilter))
    : looks;

  return (
    <View style={styles.container}>
      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'list' && styles.tabButtonActive]}
          onPress={() => setActiveTab('list')}
        >
          <Text style={[styles.tabButtonText, activeTab === 'list' && styles.tabButtonTextActive]}>Мои образы</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'editor' && styles.tabButtonActive]}
          onPress={() => {
            if (!editingLookId) resetEditor();
            setActiveTab('editor');
          }}
        >
          <Text style={[styles.tabButtonText, activeTab === 'editor' && styles.tabButtonTextActive]}>
            {editingLookId ? 'Редактор ✏️' : 'Конструктор ⚒️'}
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.roseDeep} />
          <Text style={styles.loadingText}>Загружаем Looks Lab...</Text>
        </View>
      ) : activeTab === 'list' ? (
        /* MY LOOKS LIST */
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Header Info */}
          <View style={styles.header}>
            <Text style={styles.tag}>Looks Lab</Text>
            <Text style={styles.title}>Мои <Text style={styles.italic}>образы</Text></Text>
            <Text style={styles.subtitle}>
              Просматривайте ваши комплекты, фильтруйте по коллекциям и получайте ценный AI фидбек.
            </Text>
          </View>

          {/* Collection Filter row */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
            <TouchableOpacity
              style={[styles.filterPill, !collectionFilter && styles.filterPillActive]}
              onPress={() => setCollectionFilter('')}
            >
              <Text style={[styles.filterPillText, !collectionFilter && styles.filterPillTextActive]}>Все</Text>
            </TouchableOpacity>
            {collections.map(col => (
              <TouchableOpacity
                key={col.id}
                style={[styles.filterPill, String(collectionFilter) === String(col.id) && styles.filterPillActive]}
                onPress={() => setCollectionFilter(String(col.id))}
              >
                <Text style={[styles.filterPillText, String(collectionFilter) === String(col.id) && styles.filterPillTextActive]}>
                  {col.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {filteredLooks.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyEmoji}>✨</Text>
              <Text style={styles.emptyTitle}>Комплектов не найдено</Text>
              <Text style={styles.emptyDesc}>Соберите ваш первый модный образ прямо сейчас!</Text>
              <TouchableOpacity style={styles.emptyBtn} onPress={() => setActiveTab('editor')}>
                <Text style={styles.emptyBtnText}>+ Собрать образ</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.looksList}>
              {filteredLooks.map(look => {
                const ratingStars = look.rating ? '★'.repeat(look.rating) + '☆'.repeat(5 - look.rating) : 'Без оценки';
                return (
                  <View key={look.id} style={styles.lookCard}>
                    <View style={styles.lookHeader}>
                      <View style={styles.flex1}>
                        <Text style={styles.lookName}>{look.name || 'Образ без названия'}</Text>
                        <Text style={styles.lookMeta}>
                          {look.collection_detail?.name || 'Без коллекции'} · {look.items_detail?.length ?? 0} вещей
                        </Text>
                      </View>
                      <Text style={styles.lookRating}>{ratingStars}</Text>
                    </View>

                    {/* Horizontal Items list */}
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.lookItemsPills}>
                      {(look.items_detail || []).map(item => (
                        <View key={item.id} style={styles.itemTagPill}>
                          <Text style={styles.itemTagText}>
                            {getCategoryIcon(item.category)} {item.name}
                          </Text>
                        </View>
                      ))}
                    </ScrollView>

                    {/* AI Feedback */}
                    <View style={[styles.aiFeedbackBox, look.ai_feedback && styles.aiFeedbackBoxActive]}>
                      <Text style={[styles.aiFeedbackTitle, look.ai_feedback && styles.aiFeedbackTitleActive]}>
                        🤖 Оценка стилиста
                      </Text>
                      <Text style={styles.aiFeedbackText}>
                        {look.ai_feedback || 'Оцените комплект, чтобы получить рекомендации по стилю.'}
                      </Text>
                    </View>

                    <View style={styles.lookActions}>
                      <TouchableOpacity style={styles.actionBtn} onPress={() => handleEditLook(look)}>
                        <Text style={styles.actionBtnText}>✏️ Правка</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionBtn, styles.actionBtnOutline]}
                        onPress={() => handleEvaluateAI(look.id)}
                      >
                        <Text style={styles.actionBtnTextOutline}>🤖 Оценить AI</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDeleteLook(look.id)}>
                        <Text style={styles.deleteBtnText}>🗑️</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>
      ) : (
        /* CONSTRUCTOR EDITOR */
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Text style={styles.tag}>Конструктор</Text>
            <Text style={styles.title}>
              {editingLookId ? 'Редактировать' : 'Собрать'} <Text style={styles.italic}>образ</Text>
            </Text>
            <Text style={styles.subtitle}>
              Выберите вещи, задайте имя комплекта и соберите полноценный аутфит.
            </Text>
          </View>

          <View style={styles.editorCard}>
            <Text style={styles.label}>Название образа</Text>
            <TextInput
              style={styles.input}
              value={lookName}
              onChangeText={setLookName}
              placeholder="Например: Office Friday"
              placeholderTextColor={colors.muted}
            />

            <View style={styles.row}>
              <View style={styles.flex1}>
                <Text style={styles.label}>Коллекция</Text>
                <View style={styles.pickerFakeWrapper}>
                  <ScrollView style={styles.pickerDrop} nestedScrollEnabled={true}>
                    <TouchableOpacity
                      style={[styles.pickerDropItem, !collectionId && styles.pickerDropActive]}
                      onPress={() => setCollectionId('')}
                    >
                      <Text style={[styles.pickerDropText, !collectionId && styles.pickerDropTextActive]}>Без коллекции</Text>
                    </TouchableOpacity>
                    {collections.map(col => (
                      <TouchableOpacity
                        key={col.id}
                        style={[styles.pickerDropItem, collectionId === String(col.id) && styles.pickerDropActive]}
                        onPress={() => setCollectionId(String(col.id))}
                      >
                        <Text style={[styles.pickerDropText, collectionId === String(col.id) && styles.pickerDropTextActive]}>
                          {col.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </View>

              <TouchableOpacity
                style={styles.newColBtn}
                onPress={() => setShowColForm(!showColForm)}
              >
                <Text style={styles.newColBtnText}>{showColForm ? '✕' : '+ Коллекция'}</Text>
              </TouchableOpacity>
            </View>

            {/* Create Collection Form */}
            {showColForm && (
              <View style={styles.newColCard}>
                <Text style={styles.newColTitle}>Новая коллекция</Text>
                <TextInput
                  style={styles.smallInput}
                  value={colName}
                  onChangeText={setColName}
                  placeholder="Имя: Streetwear"
                  placeholderTextColor={colors.muted}
                />
                <TextInput
                  style={styles.smallInput}
                  value={colDesc}
                  onChangeText={setColDesc}
                  placeholder="Описание: Повседневные свободные образы..."
                  placeholderTextColor={colors.muted}
                />
                <TouchableOpacity style={styles.saveColBtn} onPress={handleCreateCollection}>
                  <Text style={styles.saveColBtnText}>Создать</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Choose Items Grid */}
            <Text style={[styles.label, { marginTop: 16 }]}>Выберите вещи ({selectedItemIds.length})</Text>
            {items.length === 0 ? (
              <Text style={styles.emptyItemsWarn}>У вас пока нет добавленных вещей в гардеробе.</Text>
            ) : (
              <View style={styles.chooseItemsContainer}>
                {items.map(item => {
                  const selected = selectedItemIds.includes(item.id);
                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={[styles.itemSelectCard, selected && styles.itemSelectCardActive]}
                      onPress={() => toggleSelectItem(item.id)}
                    >
                      <View style={styles.itemSelectMedia}>
                        {item.image_url ? (
                          <Image source={{ uri: item.image_url }} style={styles.itemSelectImg} />
                        ) : (
                          <Text style={styles.itemSelectEmoji}>{getCategoryIcon(item.category)}</Text>
                        )}
                        {selected && <View style={styles.selectedCircle}><Text style={styles.selectedCheck}>✓</Text></View>}
                      </View>
                      <Text style={styles.itemSelectTitle} numberOfLines={1}>{item.name}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            <View style={styles.actionsRow}>
              <TouchableOpacity style={styles.saveLookBtn} onPress={handleSaveLook}>
                <Text style={styles.saveLookBtnText}>💾 Сохранить образ</Text>
              </TouchableOpacity>
              {editingLookId && (
                <TouchableOpacity style={[styles.saveLookBtn, styles.cancelEditBtn]} onPress={resetEditor}>
                  <Text style={styles.cancelEditBtnText}>Сброс</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const { width } = Dimensions.get('window');
const itemSelectWidth = (width - 72) / 3;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
  },
  tabButtonActive: {
    borderBottomWidth: 2,
    borderBottomColor: colors.roseDeep,
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.muted,
  },
  tabButtonTextActive: {
    color: colors.roseDeep,
    fontWeight: '700',
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
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 20,
  },
  tag: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.roseDeep,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  title: {
    fontSize: 26,
    fontFamily: typography.titleBold,
    color: colors.text,
  },
  italic: {
    fontFamily: typography.titleItalic,
    fontStyle: 'italic',
  },
  subtitle: {
    fontSize: 13,
    color: colors.muted,
    lineHeight: 18,
    marginTop: 6,
  },
  filterRow: {
    gap: 8,
    paddingBottom: 16,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterPillActive: {
    backgroundColor: colors.roseDeep,
    borderColor: colors.roseDeep,
  },
  filterPillText: {
    fontSize: 12,
    color: colors.text,
    fontWeight: '600',
  },
  filterPillTextActive: {
    color: '#FFFFFF',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 6,
  },
  emptyDesc: {
    fontSize: 12,
    color: colors.muted,
    textAlign: 'center',
    marginBottom: 20,
  },
  emptyBtn: {
    backgroundColor: colors.roseDeep,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    ...shadows.sm,
  },
  emptyBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  looksList: {
    gap: 16,
  },
  lookCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  lookHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  flex1: {
    flex: 1,
  },
  lookName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  lookMeta: {
    fontSize: 11,
    color: colors.muted,
    marginTop: 2,
  },
  lookRating: {
    fontSize: 12,
    color: colors.roseDeep,
    fontWeight: '700',
  },
  lookItemsPills: {
    gap: 8,
    paddingBottom: 12,
  },
  itemTagPill: {
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  itemTagText: {
    fontSize: 11,
    color: colors.text,
  },
  aiFeedbackBox: {
    backgroundColor: colors.bg,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#FAF0EB',
    marginBottom: 14,
  },
  aiFeedbackBoxActive: {
    backgroundColor: '#FAF0ED',
    borderColor: colors.border,
  },
  aiFeedbackTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  aiFeedbackTitleActive: {
    color: colors.roseDeep,
  },
  aiFeedbackText: {
    fontSize: 12,
    color: colors.text,
    lineHeight: 16,
  },
  lookActions: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  actionBtn: {
    backgroundColor: colors.blush,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionBtnText: {
    fontSize: 11,
    color: colors.roseDeep,
    fontWeight: '700',
  },
  actionBtnOutline: {
    backgroundColor: colors.roseDeep,
  },
  actionBtnTextOutline: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  deleteBtn: {
    marginLeft: 'auto',
    padding: 8,
  },
  deleteBtnText: {
    fontSize: 14,
  },
  editorCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.text,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  input: {
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.text,
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  pickerFakeWrapper: {
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    height: 100,
    overflow: 'hidden',
  },
  pickerDrop: {
    flex: 1,
  },
  pickerDropItem: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderColor: '#FFF',
  },
  pickerDropActive: {
    backgroundColor: colors.blush,
  },
  pickerDropText: {
    fontSize: 12,
    color: colors.text,
  },
  pickerDropTextActive: {
    fontWeight: '700',
    color: colors.roseDeep,
  },
  newColBtn: {
    backgroundColor: colors.blush,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 22,
  },
  newColBtnText: {
    fontSize: 12,
    color: colors.roseDeep,
    fontWeight: '700',
  },
  newColCard: {
    backgroundColor: colors.bg,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
    gap: 10,
  },
  newColTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.roseDeep,
  },
  smallInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 12,
    color: colors.text,
  },
  saveColBtn: {
    backgroundColor: colors.roseDeep,
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  saveColBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  chooseItemsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 8,
    marginBottom: 20,
  },
  emptyItemsWarn: {
    fontSize: 12,
    color: colors.muted,
    marginVertical: 12,
    fontStyle: 'italic',
  },
  itemSelectCard: {
    width: itemSelectWidth,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 8,
    alignItems: 'center',
    position: 'relative',
  },
  itemSelectCardActive: {
    borderColor: colors.roseDeep,
    backgroundColor: colors.blush,
  },
  itemSelectMedia: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
    position: 'relative',
    overflow: 'hidden',
  },
  itemSelectImg: {
    width: '100%',
    height: '100%',
  },
  itemSelectEmoji: {
    fontSize: 24,
  },
  selectedCircle: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(138, 79, 79, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedCheck: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '700',
  },
  itemSelectTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    width: '100%',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  saveLookBtn: {
    flex: 2,
    backgroundColor: colors.roseDeep,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  saveLookBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  cancelEditBtn: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelEditBtnText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
});
