import React, { useState, useEffect, useRef } from 'react';
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
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { colors, typography, shadows } from '../styles/theme';
import { api } from '../api/client';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';

export default function ProfileScreen() {
  const { profile, refreshProfile, logout } = useAuth();
  const toast = useToast();

  const [form, setForm] = useState({
    bio: '',
    occupation: '',
    lifestyle: '',
    favorite_occasions: '',
    city_climate: '',
    sizes_note: '',
  });

  const [avatarUri, setAvatarUri] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (profile) {
      setForm({
        bio: profile.bio || '',
        occupation: profile.occupation || '',
        lifestyle: profile.lifestyle || '',
        favorite_occasions: profile.favorite_occasions || '',
        city_climate: profile.city_climate || '',
        sizes_note: profile.sizes_note || '',
      });
      setAvatarUri(profile.avatar_url || null);
    }
  }, [profile]);

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handlePickAvatar = async () => {
    Alert.alert(
      'Изменить аватар',
      'Выберите источник фотографии:',
      [
        { text: 'Отмена', style: 'cancel' },
        { text: '📷 Камера', onPress: () => handleImageSource('camera') },
        { text: '🖼️ Галерея', onPress: () => handleImageSource('gallery') },
      ]
    );
  };

  const handleImageSource = async (source) => {
    let result;
    if (source === 'camera') {
      const { granted } = await ImagePicker.requestCameraPermissionsAsync();
      if (!granted) {
        Alert.alert('Доступ запрещен', 'Необходим доступ к вашей камере для съемки.');
        return;
      }
      result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
    } else {
      const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!granted) {
        Alert.alert('Доступ запрещен', 'Необходим доступ к вашей галерее для выбора фото.');
        return;
      }
      result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
    }

    if (!result.canceled) {
      setAvatarUri(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const hasLocalAvatar = avatarUri && !avatarUri.startsWith('http');
      
      if (hasLocalAvatar) {
        const data = new FormData();
        Object.entries(form).forEach(([key, val]) => {
          data.append(key, val);
        });

        const uriParts = avatarUri.split('/');
        const fileName = uriParts[uriParts.length - 1];
        const fileType = fileName.split('.').pop() || 'jpeg';

        data.append('avatar', {
          uri: avatarUri,
          name: fileName,
          type: `image/${fileType === 'jpg' ? 'jpeg' : fileType}`,
        });

        await api.upload('/profile/', data, 'PATCH');
      } else {
        await api.patch('/profile/', form);
      }

      await refreshProfile();
      toast('✅ Профиль успешно обновлен!', 'success');
    } catch (err) {
      toast(err.message || 'Ошибка обновления', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Выход из аккаунта',
      'Вы действительно хотите выйти?',
      [
        { text: 'Отмена', style: 'cancel' },
        { text: 'Выйти', style: 'destructive', onPress: () => logout() },
      ]
    );
  };

  if (!profile) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.roseDeep} />
        <Text style={styles.loadingText}>Загружаем профиль...</Text>
      </View>
    );
  }

  const user = profile.user || {};

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
      {/* Header Info */}
      <View style={styles.header}>
        <Text style={styles.tag}>Профиль</Text>
        <Text style={styles.title}>Мой <Text style={styles.italic}>профиль</Text></Text>
        <Text style={styles.subtitle}>
          Заполните образ жизни и предпочтения, чтобы ассистент давал идеальные рекомендации.
        </Text>
      </View>

      {/* Avatar Card */}
      <View style={styles.profileCard}>
        <TouchableOpacity style={styles.avatarWrapper} onPress={handlePickAvatar}>
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={styles.avatarImg} />
          ) : (
            <Text style={styles.avatarFallback}>👤</Text>
          )}
          <View style={styles.avatarEditBadge}>
            <Text style={styles.avatarEditBadgeText}>📷</Text>
          </View>
        </TouchableOpacity>

        <Text style={styles.userName}>
          {user.first_name ? `${user.first_name} ${user.last_name || ''}` : user.username}
        </Text>
        <Text style={styles.userEmail}>{user.email || 'no-email@example.com'}</Text>

        <View style={styles.tagsContainer}>
          {profile.occupation && <View style={styles.infoTag}><Text style={styles.infoTagText}>💼 {profile.occupation}</Text></View>}
          {profile.lifestyle && <View style={styles.infoTag}><Text style={styles.infoTagText}>🌿 {profile.lifestyle}</Text></View>}
          {profile.favorite_occasions && <View style={styles.infoTag}><Text style={styles.infoTagText}>📍 {profile.favorite_occasions}</Text></View>}
        </View>

        {/* Small stats row inside card */}
        <View style={styles.statsRow}>
          <View style={styles.statMiniBox}>
            <Text style={styles.statMiniIcon}>👗</Text>
            <Text style={styles.statMiniNum}>{profile.wardrobe_count ?? 0}</Text>
            <Text style={styles.statMiniLabel}>Вещей</Text>
          </View>
          <View style={styles.statMiniBox}>
            <Text style={styles.statMiniIcon}>👜</Text>
            <Text style={styles.statMiniNum}>{profile.accessories_count ?? 0}</Text>
            <Text style={styles.statMiniLabel}>Аксессуаров</Text>
          </View>
          <View style={styles.statMiniBox}>
            <Text style={styles.statMiniIcon}>💬</Text>
            <Text style={styles.statMiniNum}>{profile.chats_count ?? 0}</Text>
            <Text style={styles.statMiniLabel}>Чатов</Text>
          </View>
        </View>
      </View>

      {/* Edit Form Card */}
      <View style={styles.formCard}>
        <Text style={styles.formTitle}>✏️ Редактировать профиль</Text>

        <Text style={styles.formSubHeading}>🌿 Образ жизни</Text>

        <Text style={styles.label}>Роль / занятие</Text>
        <TextInput
          style={styles.input}
          value={form.occupation}
          onChangeText={val => handleChange('occupation', val)}
          placeholder="Например: HR, студент, менеджер"
          placeholderTextColor={colors.muted}
        />

        <Text style={styles.label}>Повседневный ритм</Text>
        <TextInput
          style={styles.input}
          value={form.lifestyle}
          onChangeText={val => handleChange('lifestyle', val)}
          placeholder="Например: Офис, активный график"
          placeholderTextColor={colors.muted}
        />

        <Text style={styles.label}>Любимые случаи</Text>
        <TextInput
          style={styles.input}
          value={form.favorite_occasions}
          onChangeText={val => handleChange('favorite_occasions', val)}
          placeholder="Например: Встречи с друзьями, театр"
          placeholderTextColor={colors.muted}
        />

        <Text style={styles.label}>Город / климат</Text>
        <TextInput
          style={styles.input}
          value={form.city_climate}
          onChangeText={val => handleChange('city_climate', val)}
          placeholder="Например: Бишкек, переменчивый климат"
          placeholderTextColor={colors.muted}
        />

        <View style={styles.divider} />

        <Text style={styles.label}>О себе</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={form.bio}
          onChangeText={val => handleChange('bio', val)}
          placeholder="Люблю аккуратные минималистичные образы..."
          placeholderTextColor={colors.muted}
          multiline={true}
          numberOfLines={3}
        />

        <Text style={styles.label}>Заметка о размерах / посадке</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={form.sizes_note}
          onChangeText={val => handleChange('sizes_note', val)}
          placeholder="Например: люблю свободный верх, оверсайз"
          placeholderTextColor={colors.muted}
          multiline={true}
          numberOfLines={3}
        />

        <TouchableOpacity
          onPress={handleSubmit}
          style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.submitBtnText}>💾 Сохранить профиль</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Text style={styles.logoutBtnText}>🚪 Выйти из аккаунта</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scrollContent: {
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
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 20,
    ...shadows.sm,
  },
  avatarWrapper: {
    position: 'relative',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.blush,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'visible',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: colors.roseDeep,
  },
  avatarImg: {
    width: '100%',
    height: '100%',
    borderRadius: 48,
  },
  avatarFallback: {
    fontSize: 48,
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: colors.roseDeep,
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  avatarEditBadgeText: {
    fontSize: 12,
    color: '#FFFFFF',
  },
  userName: {
    fontSize: 20,
    fontFamily: typography.titleBold,
    color: colors.text,
  },
  userEmail: {
    fontSize: 12,
    color: colors.muted,
    marginTop: 2,
    marginBottom: 14,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 20,
  },
  infoTag: {
    backgroundColor: colors.blush,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  infoTagText: {
    fontSize: 11,
    color: colors.roseDeep,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    width: '100%',
    borderTopWidth: 1,
    borderColor: '#FAF5F3',
    paddingTop: 16,
  },
  statMiniBox: {
    flex: 1,
    backgroundColor: colors.bg,
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  statMiniIcon: {
    fontSize: 16,
  },
  statMiniNum: {
    fontSize: 18,
    fontFamily: typography.titleBold,
    color: colors.roseDeep,
    marginTop: 2,
  },
  statMiniLabel: {
    fontSize: 9,
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 40,
    ...shadows.sm,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 20,
  },
  formSubHeading: {
    fontSize: 14,
    fontFamily: typography.titleBold,
    color: colors.muted,
    marginBottom: 14,
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
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 16,
  },
  textArea: {
    height: 70,
    textAlignVertical: 'top',
  },
  submitBtn: {
    backgroundColor: colors.roseDeep,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    ...shadows.sm,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  logoutBtn: {
    alignItems: 'center',
    paddingVertical: 14,
    marginTop: 12,
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: 12,
  },
  logoutBtnText: {
    color: colors.danger,
    fontWeight: '700',
    fontSize: 14,
  },
});
