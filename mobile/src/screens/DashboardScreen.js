import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { colors, typography, shadows } from '../styles/theme';
import { api } from '../api/client';
import { useAuth } from '../hooks/useAuth';
import { getCategoryIcon } from '../constants/wardrobe';

export default function DashboardScreen({ navigateTo }) {
  const { profile, refreshProfile } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      const response = await api.get('/dashboard/');
      setData(response);
    } catch (err) {
      console.log('Error loading dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.roseDeep} />
        <Text style={styles.loadingText}>Загружаем ваш стиль...</Text>
      </View>
    );
  }

  const { stats = {}, recent_wardrobe = [], recent_chats = [] } = data || {};
  const name = profile?.user?.first_name || profile?.user?.username || 'Стилист';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.tag}>Главная</Text>
        <Text style={styles.greeting}>
          Привет, <Text style={styles.italic}>{name}</Text> ✨
        </Text>
        <Text style={styles.subtitle}>
          Твой персональный AI-стилист уже готов собрать следующий образ.
        </Text>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statIcon}>👗</Text>
          <Text style={styles.statNum}>{stats.wardrobe_count ?? 0}</Text>
          <Text style={styles.statLabel}>Гардероб</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statIcon}>👜</Text>
          <Text style={styles.statNum}>{stats.accessories_count ?? 0}</Text>
          <Text style={styles.statLabel}>Аксессуары</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statIcon}>❤️</Text>
          <Text style={styles.statNum}>{stats.fav_count ?? 0}</Text>
          <Text style={styles.statLabel}>Любимые</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statIcon}>💬</Text>
          <Text style={styles.statNum}>{stats.chats_count ?? 0}</Text>
          <Text style={styles.statLabel}>Чаты</Text>
        </View>
      </View>

      {/* Quick Nav Row */}
      <Text style={styles.sectionHeading}>Быстрый переход 🚀</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickNavRow}>
        <TouchableOpacity style={styles.navCard} onPress={() => navigateTo('wardrobe')}>
          <Text style={styles.navCardEmoji}>👗</Text>
          <Text style={styles.navCardTitle}>Гардероб</Text>
          <Text style={styles.navCardDesc}>Держи в порядке базовые вещи.</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navCard} onPress={() => navigateTo('accessories')}>
          <Text style={styles.navCardEmoji}>👜</Text>
          <Text style={styles.navCardTitle}>Аксессуары</Text>
          <Text style={styles.navCardDesc}>Украшения, часы и ремни.</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navCard} onPress={() => navigateTo('tips')}>
          <Text style={styles.navCardEmoji}>🤖</Text>
          <Text style={styles.navCardTitle}>Ассистент</Text>
          <Text style={styles.navCardDesc}>Попроси собрать образ в чате.</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Recent Wardrobe */}
      {recent_wardrobe.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Последние вещи 👗</Text>
            <TouchableOpacity onPress={() => navigateTo('wardrobe')}>
              <Text style={styles.seeAll}>Все →</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.recentItemsScroll}>
            {recent_wardrobe.map(item => (
              <View key={item.id} style={styles.itemCard}>
                <View style={styles.itemImgWrapper}>
                  {item.image_url ? (
                    <Image source={{ uri: item.image_url }} style={styles.itemImg} />
                  ) : (
                    <Text style={styles.itemEmoji}>{getCategoryIcon(item.category)}</Text>
                  )}
                  {item.is_favorite && <Text style={styles.itemHeart}>❤️</Text>}
                </View>
                <View style={styles.itemBody}>
                  <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                  <Text style={styles.itemMeta} numberOfLines={1}>
                    {item.brand || 'без бренда'} · {item.color || '—'}
                  </Text>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Recent Chats */}
      {recent_chats.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Последние диалоги 💬</Text>
            <TouchableOpacity onPress={() => navigateTo('tips')}>
              <Text style={styles.seeAll}>Открыть чат</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.chatsList}>
            {recent_chats.map(chat => (
              <TouchableOpacity key={chat.id} style={styles.chatCard} onPress={() => navigateTo('tips')}>
                <Text style={styles.chatTitle} numberOfLines={1}>{chat.title || 'Новый диалог'}</Text>
                <Text style={styles.chatText} numberOfLines={2}>
                  {chat.last_message?.content || 'Диалог пока без сообщений.'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* If entirely empty */}
      {(!data || (stats.wardrobe_count === 0 && stats.accessories_count === 0 && stats.chats_count === 0)) && (
        <View style={styles.emptyWelcomeCard}>
          <Text style={styles.emptyWelcomeEmoji}>🌸</Text>
          <Text style={styles.emptyWelcomeTitle}>Начни собирать систему</Text>
          <Text style={styles.emptyWelcomeDesc}>
            Заполни профиль, добавь вещи и аксессуары, а потом задай первый запрос в чат-ассистенте.
          </Text>
          <View style={styles.emptyBtnRow}>
            <TouchableOpacity style={styles.emptyBtn} onPress={() => navigateTo('profile')}>
              <Text style={styles.emptyBtnText}>👤 Профиль</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.emptyBtn, styles.emptyBtnOutline]} onPress={() => navigateTo('tips')}>
              <Text style={styles.emptyBtnTextOutline}>💬 Чат</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.bg,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.muted,
  },
  header: {
    marginBottom: 24,
  },
  tag: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.roseDeep,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  greeting: {
    fontSize: 28,
    fontFamily: typography.titleBold,
    color: colors.text,
  },
  italic: {
    fontFamily: typography.titleItalic,
    fontStyle: 'italic',
  },
  subtitle: {
    fontSize: 14,
    color: colors.muted,
    lineHeight: 20,
    marginTop: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 28,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  statIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  statNum: {
    fontSize: 24,
    fontFamily: typography.titleBold,
    color: colors.roseDeep,
  },
  statLabel: {
    fontSize: 11,
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 4,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  quickNavRow: {
    gap: 12,
    paddingRight: 20,
    paddingBottom: 4,
  },
  navCard: {
    width: 140,
    backgroundColor: colors.cardBg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 14,
    ...shadows.sm,
  },
  navCardEmoji: {
    fontSize: 28,
    marginBottom: 8,
  },
  navCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  navCardDesc: {
    fontSize: 11,
    color: colors.muted,
    marginTop: 4,
    lineHeight: 14,
  },
  section: {
    marginTop: 28,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  seeAll: {
    fontSize: 13,
    color: colors.roseDeep,
    fontWeight: '700',
  },
  recentItemsScroll: {
    gap: 12,
    paddingRight: 20,
    paddingBottom: 4,
  },
  itemCard: {
    width: 120,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...shadows.sm,
  },
  itemImgWrapper: {
    height: 110,
    backgroundColor: colors.cardBg,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  itemImg: {
    width: '100%',
    height: '100%',
  },
  itemEmoji: {
    fontSize: 40,
  },
  itemHeart: {
    position: 'absolute',
    top: 6,
    right: 6,
    fontSize: 12,
  },
  itemBody: {
    padding: 8,
  },
  itemName: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
  },
  itemMeta: {
    fontSize: 10,
    color: colors.muted,
    marginTop: 2,
  },
  chatsList: {
    gap: 12,
  },
  chatCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  chatTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 6,
  },
  chatText: {
    fontSize: 12,
    color: colors.muted,
    lineHeight: 16,
  },
  emptyWelcomeCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    marginTop: 32,
    ...shadows.md,
  },
  emptyWelcomeEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyWelcomeTitle: {
    fontSize: 18,
    fontFamily: typography.titleBold,
    color: colors.text,
    marginBottom: 6,
  },
  emptyWelcomeDesc: {
    fontSize: 13,
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  emptyBtnRow: {
    flexDirection: 'row',
    gap: 12,
  },
  emptyBtn: {
    backgroundColor: colors.roseDeep,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    ...shadows.sm,
  },
  emptyBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  emptyBtnOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.roseDeep,
  },
  emptyBtnTextOutline: {
    color: colors.roseDeep,
    fontWeight: '700',
    fontSize: 13,
  },
});
