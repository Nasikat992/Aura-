import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, shadows } from '../styles/theme';

export default function OutfitRecommendationCard({ recommendation }) {
  if (!recommendation) return null;
  const { items = [], description = '', occasion = '' } = recommendation;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Рекомендуемый образ ✨</Text>
        {!!occasion && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{occasion}</Text>
          </View>
        )}
      </View>

      {!!description && (
        <Text style={styles.description}>{description}</Text>
      )}

      <View style={styles.itemsContainer}>
        {items.map((item, index) => (
          <View key={index} style={styles.itemRow}>
            <View style={styles.iconCircle}>
              <Text style={styles.itemIcon}>
                {item.category === 'Верхняя одежда' || item.category?.toLowerCase()?.includes('верх') ? '👕' :
                 item.category === 'Нижняя одежда' || item.category?.toLowerCase()?.includes('низ') ? '👖' :
                 item.category === 'Обувь' || item.category?.toLowerCase()?.includes('обув') ? '👟' :
                 item.category === 'Аксессуары' || item.category?.toLowerCase()?.includes('аксес') ? '👜' : '👗'}
              </Text>
            </View>
            <View style={styles.itemInfo}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemCategory}>{item.category}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    flexWrap: 'wrap',
    gap: 8,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.roseDeep,
    fontFamily: 'System',
  },
  badge: {
    backgroundColor: colors.blush,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 11,
    color: colors.roseDeep,
    fontWeight: '600',
  },
  description: {
    fontSize: 13,
    color: colors.text,
    lineHeight: 18,
    marginBottom: 14,
    fontStyle: 'italic',
  },
  itemsContainer: {
    gap: 10,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg,
    padding: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F5ECE8',
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.blush,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  itemIcon: {
    fontSize: 18,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  itemCategory: {
    fontSize: 10,
    color: colors.muted,
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
