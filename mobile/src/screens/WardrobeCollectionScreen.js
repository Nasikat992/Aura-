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
import { getCategoryIcon, getCategoryLabel, getCategoryOptions, SEASONS } from '../constants/wardrobe';
import { api } from '../api/client';
import { useToast } from '../hooks/useToast';
import ItemModal from '../components/ItemModal';

export default function WardrobeCollectionScreen({ kind, pageTag, title, subtitle }) {
  const toast = useToast();
  
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  
  const [filters, setFilters] = useState({ category: '', season: '', search: '' });
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const categoryOptions = getCategoryOptions(kind);

  const loadData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ kind });
      if (filters.category) params.append('category', filters.category);
      if (filters.season) params.append('season', filters.season);
      if (filters.search) params.append('search', filters.search);

      const [itemsRes, statsRes] = await Promise.all([
        api.get(`/wardrobe/?${params.toString()}`),
        api.get(`/wardrobe/stats/?${new URLSearchParams({ kind }).toString()}`),
      ]);
      
      setItems(itemsRes.results ?? itemsRes);
      setStats(statsRes);
    } catch (err) {
      console.log('Error loading collection:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [kind, filters.category, filters.season, filters.search]);

  const handleToggleFavorite = async (item) => {
    try {
      const response = await api.post(`/wardrobe/${item.id}/toggle_favorite/`);
      setItems(prev => prev.map(entry => (
        entry.id === item.id ? { ...entry, is_favorite: response.is_favorite } : entry
      )));
      setStats(prev => ({
        ...prev,
        favorites: Math.max((prev.favorites ?? 0) + (response.is_favorite ? 1 : -1), 0),
      }));
      toast(response.is_favorite ? '❤️ Добавлено в избранное!' : '🤍 Удалено из избранного', 'info');
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  const handleDeleteItem = (id) => {
    Alert.alert(
      'Удаление вещи',
      'Вы уверены, что хотите удалить эту вещь?',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Удалить',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/wardrobe/${id}/`);
              const deleted = items.find(entry => entry.id === id);
              setItems(prev => prev.filter(entry => entry.id !== id));
              setStats(prev => ({
                ...prev,
                total: Math.max((prev.total || 1) - 1, 0),
                favorites: Math.max((prev.favorites ?? 0) - (deleted?.is_favorite ? 1 : 0), 0),
              }));
              toast('🗑️ Вещь успешно удалена', 'info');
            } catch (err) {
              toast(err.message, 'error');
            }
          },
        },
      ]
    );
  };

  const handleSaved = () => {
    loadData();
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.tag}>{pageTag}</Text>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statIcon}>{kind === 'accessories' ? '👜' : '👗'}</Text>
            <Text style={styles.statNum}>{stats.total ?? 0}</Text>
            <Text style={styles.statLabel}>{kind === 'accessories' ? 'Всего' : 'Вещей'}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statIcon}>❤️</Text>
            <Text style={styles.statNum}>{stats.favorites ?? 0}</Text>
            <Text style={styles.statLabel}>Любимые</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statIcon}>🗂️</Text>
            <Text style={styles.statNum}>{stats.by_category?.length ?? 0}</Text>
            <Text style={styles.statLabel}>Категорий</Text>
          </View>
        </View>

        {/* Search & Filters */}
        <View style={styles.filtersCard}>
          <TextInput
            style={styles.searchInput}
            placeholder="🔍 Поиск..."
            value={filters.search}
            onChangeText={val => setFilters(prev => ({ ...prev, search: val }))}
            placeholderTextColor={colors.muted}
          />
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterPillsRow}>
            {/* Category selection */}
            <TouchableOpacity
              style={[styles.filterPill, !filters.category && styles.filterPillActive]}
              onPress={() => setFilters(prev => ({ ...prev, category: '' }))}
            >
              <Text style={[styles.filterPillText, !filters.category && styles.filterPillTextActive]}>Все категории</Text>
            </TouchableOpacity>
            {categoryOptions.map(([val, label]) => (
              <TouchableOpacity
                key={val}
                style={[styles.filterPill, filters.category === val && styles.filterPillActive]}
                onPress={() => setFilters(prev => ({ ...prev, category: val }))}
              >
                <Text style={[styles.filterPillText, filters.category === val && styles.filterPillTextActive]}>{label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterPillsRow}>
            {/* Season selection */}
            <TouchableOpacity
              style={[styles.filterPill, !filters.season && styles.filterPillActive]}
              onPress={() => setFilters(prev => ({ ...prev, season: '' }))}
            >
              <Text style={[styles.filterPillText, !filters.season && styles.filterPillTextActive]}>Все сезоны</Text>
            </TouchableOpacity>
            {SEASONS.map(([val, label]) => (
              <TouchableOpacity
                key={val}
                style={[styles.filterPill, filters.season === val && styles.filterPillActive]}
                onPress={() => setFilters(prev => ({ ...prev, season: val }))}
              >
                <Text style={[styles.filterPillText, filters.season === val && styles.filterPillTextActive]}>{label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* List Content */}
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.roseDeep} />
            <Text style={styles.loadingText}>Загружаем коллекцию...</Text>
          </View>
        ) : items.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>{kind === 'accessories' ? '👜' : '👗'}</Text>
            <Text style={styles.emptyTitle}>Здесь пока ничего нет</Text>
            <Text style={styles.emptyDesc}>Добавьте вещи, чтобы наполнить ваш гардероб.</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => {
                setSelectedItem(null);
                setModalVisible(true);
              }}
            >
              <Text style={styles.addButtonText}>+ Добавить вещь</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.grid}>
            {items.map(item => (
              <TouchableOpacity
                key={item.id}
                style={styles.itemCard}
                onPress={() => {
                  setSelectedItem(item);
                  setModalVisible(true);
                }}
              >
                <View style={styles.itemImageWrapper}>
                  {item.image_url ? (
                    <Image source={{ uri: item.image_url }} style={styles.itemImage} />
                  ) : (
                    <Text style={styles.itemEmojiFallback}>{getCategoryIcon(item.category)}</Text>
                  )}
                  <TouchableOpacity
                    style={styles.favHeartWrapper}
                    onPress={() => handleToggleFavorite(item)}
                  >
                    <Text style={styles.favHeart}>{item.is_favorite ? '❤️' : '🤍'}</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                  <Text style={styles.itemMeta} numberOfLines={1}>
                    {item.brand || 'без бренда'} · {item.color || '—'}
                  </Text>
                  <View style={styles.itemFooter}>
                    <View style={styles.pill}>
                      <Text style={styles.pillText}>{item.category_label || getCategoryLabel(item.category)}</Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleDeleteItem(item.id)}
                      style={styles.deleteBtn}
                    >
                      <Text style={styles.deleteBtnText}>🗑️</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Floating Add Button */}
      {items.length > 0 && (
        <TouchableOpacity
          style={styles.floatingAddBtn}
          onPress={() => {
            setSelectedItem(null);
            setModalVisible(true);
          }}
        >
          <Text style={styles.floatingAddText}>+</Text>
        </TouchableOpacity>
      )}

      {/* Modal */}
      <ItemModal
        visible={modalVisible}
        item={selectedItem}
        kind={kind}
        onClose={() => setModalVisible(false)}
        onSaved={handleSaved}
      />
    </View>
  );
}

const { width } = Dimensions.get('window');
const cardWidth = (width - 52) / 2;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 80,
  },
  center: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 13,
    color: colors.muted,
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
  subtitle: {
    fontSize: 13,
    color: colors.muted,
    lineHeight: 18,
    marginTop: 6,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  statIcon: {
    fontSize: 18,
    marginBottom: 2,
  },
  statNum: {
    fontSize: 20,
    fontFamily: typography.titleBold,
    color: colors.roseDeep,
  },
  statLabel: {
    fontSize: 10,
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  filtersCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 20,
    gap: 10,
    ...shadows.sm,
  },
  searchInput: {
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: colors.text,
  },
  filterPillsRow: {
    gap: 8,
    paddingBottom: 2,
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterPillActive: {
    backgroundColor: colors.roseDeep,
    borderColor: colors.roseDeep,
  },
  filterPillText: {
    fontSize: 11,
    color: colors.text,
    fontWeight: '600',
  },
  filterPillTextActive: {
    color: '#FFFFFF',
  },
  emptyState: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    marginTop: 10,
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
  addButton: {
    backgroundColor: colors.roseDeep,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    ...shadows.sm,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  itemCard: {
    width: cardWidth,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    overflow: 'hidden',
    ...shadows.sm,
  },
  itemImageWrapper: {
    height: 140,
    backgroundColor: colors.cardBg,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  itemImage: {
    width: '100%',
    height: '100%',
  },
  itemEmojiFallback: {
    fontSize: 48,
  },
  favHeartWrapper: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255,255,255,0.7)',
    padding: 6,
    borderRadius: 14,
  },
  favHeart: {
    fontSize: 12,
  },
  itemInfo: {
    padding: 10,
  },
  itemName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  itemMeta: {
    fontSize: 11,
    color: colors.muted,
    marginTop: 2,
    marginBottom: 8,
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pill: {
    backgroundColor: colors.blush,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    maxWidth: '75%',
  },
  pillText: {
    fontSize: 9,
    color: colors.roseDeep,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  deleteBtn: {
    padding: 4,
  },
  deleteBtnText: {
    fontSize: 12,
  },
  floatingAddBtn: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    backgroundColor: colors.roseDeep,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.lg,
  },
  floatingAddText: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '400',
    marginTop: -4,
  },
});
