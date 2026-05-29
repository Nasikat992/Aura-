export const CATEGORY_META = {
  shirt_short: { icon: '👕', label: 'Рубашка с коротким рукавом' },
  shirt_long: { icon: '👔', label: 'Рубашка с длинным рукавом' },
  tshirt: { icon: '👕', label: 'Футболка' },
  top: { icon: '🎽', label: 'Топ' },
  blouse: { icon: '👚', label: 'Блузка' },
  jeans_ankle: { icon: '👖', label: 'Джинсы до щиколотки' },
  jeans_full: { icon: '👖', label: 'Джинсы полной длины' },
  pants_classic: { icon: '👖', label: 'Классические брюки' },
  pants_wide: { icon: '👖', label: 'Широкие брюки' },
  skirt_mini: { icon: '🩳', label: 'Мини-юбка' },
  skirt_midi: { icon: '👗', label: 'Юбка миди' },
  dress_casual: { icon: '👗', label: 'Повседневное платье' },
  dress_evening: { icon: '✨', label: 'Вечернее платье' },
  jumpsuit: { icon: '🪄', label: 'Комбинезон' },
  jacket: { icon: '🧥', label: 'Куртка' },
  blazer: { icon: '🧥', label: 'Пиджак' },
  coat: { icon: '🧥', label: 'Пальто' },
  trench: { icon: '🧥', label: 'Тренч' },
  hoodie: { icon: '🧶', label: 'Худи' },
  sweater: { icon: '🧶', label: 'Свитер' },
  sneakers: { icon: '👟', label: 'Кроссовки' },
  heels: { icon: '👠', label: 'Туфли на каблуке' },
  boots: { icon: '🥾', label: 'Ботинки' },
  loafers: { icon: '👞', label: 'Лоферы' },
  sandals: { icon: '🩴', label: 'Сандалии' },
  bag_daily: { icon: '👜', label: 'Повседневная сумка' },
  bag_evening: { icon: '👜', label: 'Вечерняя сумка' },
  accessory_jewelry: { icon: '💍', label: 'Украшения' },
  accessory_belt: { icon: '🪢', label: 'Ремень' },
  accessory_hat: { icon: '👒', label: 'Головной убор' },
  accessory_scarf: { icon: '🧣', label: 'Шарф / платок' },
  accessory_watch: { icon: '⌚', label: 'Часы' },
  accessory_glasses: { icon: '🕶️', label: 'Очки' },
  sports_set: { icon: '🏃', label: 'Спортивный комплект' },
  underwear: { icon: '🩱', label: 'Бельё' },
  other: { icon: '📦', label: 'Другое' },
};

export const ACCESSORY_CATEGORIES = [
  'accessory_jewelry',
  'accessory_belt',
  'accessory_hat',
  'accessory_scarf',
  'accessory_watch',
  'accessory_glasses',
];

export const WARDROBE_CATEGORIES = Object.keys(CATEGORY_META).filter(
  category => !ACCESSORY_CATEGORIES.includes(category)
);

export const SEASONS = [
  ['all', 'Всесезонная'],
  ['spring', 'Весна'],
  ['summer', 'Лето'],
  ['autumn', 'Осень'],
  ['winter', 'Зима'],
];

export function getCategoryOptions(kind = 'wardrobe') {
  const keys = kind === 'accessories' ? ACCESSORY_CATEGORIES : WARDROBE_CATEGORIES;
  return keys.map(key => [key, CATEGORY_META[key].label]);
}

export function getCategoryLabel(category) {
  return CATEGORY_META[category]?.label || category;
}

export function getCategoryIcon(category) {
  return CATEGORY_META[category]?.icon || '👗';
}
