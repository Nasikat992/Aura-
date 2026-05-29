import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { colors, shadows } from '../styles/theme';
import { getCategoryOptions, SEASONS } from '../constants/wardrobe';
import { api } from '../api/client';
import { useToast } from '../hooks/useToast';

export default function ItemModal({ visible, item, kind, onClose, onSaved }) {
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
  });
  
  const [imageUri, setImageUri] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      if (item) {
        setForm({
          name: item.name || '',
          category: item.category || categoryOptions[0]?.[0] || 'other',
          color: item.color || '',
          brand: item.brand || '',
          season: item.season || 'all',
          purchase_date: item.purchase_date || '',
          notes: item.notes || '',
          is_favorite: !!item.is_favorite,
        });
        setImageUri(item.image_url || item.image || null);
      } else {
        setForm({
          name: '',
          category: categoryOptions[0]?.[0] || 'other',
          color: '',
          brand: '',
          season: 'all',
          purchase_date: '',
          notes: '',
          is_favorite: false,
        });
        setImageUri(null);
      }
    }
  }, [visible, item, kind]);

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handlePickImage = async () => {
    const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!granted) {
      Alert.alert('Доступ запрещен', 'Необходим доступ к вашей галерее для выбора фото.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleTakePhoto = async () => {
    const { granted } = await ImagePicker.requestCameraPermissionsAsync();
    if (!granted) {
      Alert.alert('Доступ запрещен', 'Необходим доступ к вашей камере для съемки.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      toast('Название вещи обязательно', 'error');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: form.name.trim(),
        category: form.category,
        color: form.color.trim(),
        brand: form.brand.trim(),
        season: form.season,
        notes: form.notes.trim(),
        is_favorite: String(form.is_favorite),
      };

      if (form.purchase_date.match(/^\d{4}-\d{2}-\d{2}$/)) {
        payload.purchase_date = form.purchase_date;
      }

      // Check if image is a local URI (not remote URL starting with http)
      const hasLocalImage = imageUri && !imageUri.startsWith('http');

      let result;
      if (hasLocalImage) {
        const data = new FormData();
        Object.entries(payload).forEach(([key, val]) => {
          data.append(key, val);
        });
        
        const uriParts = imageUri.split('/');
        const fileName = uriParts[uriParts.length - 1];
        const fileType = fileName.split('.').pop() || 'jpeg';
        
        data.append('image', {
          uri: imageUri,
          name: fileName,
          type: `image/${fileType === 'jpg' ? 'jpeg' : fileType}`,
        });
        
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
      toast(error.message || 'Ошибка сохранения', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>{item ? 'Редактировать вещь' : 'Новая вещь'}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
            <Text style={styles.label}>Название*</Text>
            <TextInput
              style={styles.input}
              value={form.name}
              onChangeText={val => handleChange('name', val)}
              placeholder={kind === 'accessories' ? 'Например: Золотые часы' : 'Например: Белая рубашка'}
              placeholderTextColor={colors.muted}
            />

            <View style={styles.row}>
              <View style={styles.flexHalf}>
                <Text style={styles.label}>Категория</Text>
                <View style={styles.pickerWrapper}>
                  <TextInput
                    style={styles.pickerDummy}
                    value={categoryOptions.find(o => o[0] === form.category)?.[1] || ''}
                    editable={false}
                  />
                  <ScrollView style={styles.dropdown} nestedScrollEnabled={true}>
                    {categoryOptions.map(([val, label]) => (
                      <TouchableOpacity
                        key={val}
                        style={[styles.dropdownItem, form.category === val && styles.dropdownItemActive]}
                        onPress={() => handleChange('category', val)}
                      >
                        <Text style={[styles.dropdownText, form.category === val && styles.dropdownTextActive]}>{label}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </View>

              <View style={styles.flexHalf}>
                <Text style={styles.label}>Сезон</Text>
                <View style={styles.pickerWrapper}>
                  <TextInput
                    style={styles.pickerDummy}
                    value={SEASONS.find(s => s[0] === form.season)?.[1] || ''}
                    editable={false}
                  />
                  <ScrollView style={styles.dropdown} nestedScrollEnabled={true}>
                    {SEASONS.map(([val, label]) => (
                      <TouchableOpacity
                        key={val}
                        style={[styles.dropdownItem, form.season === val && styles.dropdownItemActive]}
                        onPress={() => handleChange('season', val)}
                      >
                        <Text style={[styles.dropdownText, form.season === val && styles.dropdownTextActive]}>{label}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.flexHalf}>
                <Text style={styles.label}>Цвет</Text>
                <TextInput
                  style={styles.input}
                  value={form.color}
                  onChangeText={val => handleChange('color', val)}
                  placeholder="Белый"
                  placeholderTextColor={colors.muted}
                />
              </View>
              <View style={styles.flexHalf}>
                <Text style={styles.label}>Бренд</Text>
                <TextInput
                  style={styles.input}
                  value={form.brand}
                  onChangeText={val => handleChange('brand', val)}
                  placeholder="Massimo Dutti"
                  placeholderTextColor={colors.muted}
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.flexHalf}>
                <Text style={styles.label}>Дата покупки</Text>
                <TextInput
                  style={styles.input}
                  value={form.purchase_date}
                  onChangeText={val => handleChange('purchase_date', val)}
                  placeholder="ГГГГ-ММ-ДД"
                  placeholderTextColor={colors.muted}
                />
              </View>
              <View style={[styles.flexHalf, styles.switchContainer]}>
                <Text style={[styles.label, { marginBottom: 0 }]}>❤️ Любимая</Text>
                <Switch
                  value={form.is_favorite}
                  onValueChange={val => handleChange('is_favorite', val)}
                  trackColor={{ false: colors.border, true: colors.roseMid }}
                  thumbColor={form.is_favorite ? colors.roseDeep : '#f4f3f4'}
                />
              </View>
            </View>

            <Text style={styles.label}>Заметки</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={form.notes}
              onChangeText={val => handleChange('notes', val)}
              placeholder="Подходит для..."
              placeholderTextColor={colors.muted}
              multiline={true}
              numberOfLines={3}
            />

            <Text style={styles.label}>Фотография</Text>
            <View style={styles.photoContainer}>
              {imageUri ? (
                <View style={styles.imagePreviewWrapper}>
                  <Image source={{ uri: imageUri }} style={styles.imagePreview} />
                  <TouchableOpacity onPress={() => setImageUri(null)} style={styles.removeImageButton}>
                    <Text style={styles.removeImageText}>✕</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <Text style={styles.noPhotoText}>Фото не выбрано</Text>
              )}

              <View style={styles.photoButtons}>
                <TouchableOpacity onPress={handleTakePhoto} style={styles.photoBtn}>
                  <Text style={styles.photoBtnText}>📷 Камера</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handlePickImage} style={styles.photoBtn}>
                  <Text style={styles.photoBtnText}>🖼️ Галерея</Text>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              onPress={handleSubmit}
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.submitButtonText}>💾 Сохранить</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.bg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '90%',
    paddingTop: 16,
    ...shadows.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.roseDeep,
  },
  closeButton: {
    padding: 8,
  },
  closeText: {
    fontSize: 18,
    color: colors.muted,
    fontWeight: '700',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#FFFFFF',
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
    gap: 12,
    marginBottom: 16,
  },
  flexHalf: {
    flex: 1,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 44,
  },
  pickerWrapper: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    overflow: 'hidden',
    minHeight: 120,
  },
  pickerDummy: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 12,
    color: colors.roseDeep,
    fontWeight: '700',
    borderBottomWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.blush,
  },
  dropdown: {
    flex: 1,
    height: 80,
  },
  dropdownItem: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderColor: '#FAF5F3',
  },
  dropdownItemActive: {
    backgroundColor: colors.blush,
  },
  dropdownText: {
    fontSize: 12,
    color: colors.text,
  },
  dropdownTextActive: {
    fontWeight: '700',
    color: colors.roseDeep,
  },
  textArea: {
    height: 70,
    textAlignVertical: 'top',
  },
  photoContainer: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    marginBottom: 24,
  },
  noPhotoText: {
    fontSize: 13,
    color: colors.muted,
    marginVertical: 12,
  },
  imagePreviewWrapper: {
    position: 'relative',
    marginVertical: 8,
  },
  imagePreview: {
    width: 120,
    height: 120,
    borderRadius: 12,
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: colors.danger,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  removeImageText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '700',
  },
  photoButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  photoBtn: {
    backgroundColor: colors.blush,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  photoBtnText: {
    fontSize: 12,
    color: colors.roseDeep,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: colors.roseDeep,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
