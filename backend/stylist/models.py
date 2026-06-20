from django.contrib.auth.models import User
from django.db import models


ACCESSORY_CATEGORIES = (
    'accessory_jewelry',
    'accessory_belt',
    'accessory_hat',
    'accessory_scarf',
    'accessory_watch',
    'accessory_glasses',
)


class UserProfile(models.Model):
    PLAN_CHOICES = [
        ('free', 'Базовый'),
        ('pro', 'Pro'),
    ]
    GENDER_CHOICES = [
        ('woman', 'Женщина'),
        ('man', 'Мужчина'),
        ('non_binary', 'Небинарный'),
        ('prefer_not_to_say', 'Предпочитаю не указывать'),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    plan_type = models.CharField(max_length=10, choices=PLAN_CHOICES, default='free')
    
    # Лимиты
    outfits_generated_today = models.PositiveIntegerField(default=0)
    messages_sent_today = models.PositiveIntegerField(default=0)
    last_limit_reset = models.DateField(auto_now_add=True)

    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)
    gender = models.CharField(max_length=32, choices=GENDER_CHOICES, blank=True)
    bio = models.TextField(blank=True)
    occupation = models.CharField(max_length=120, blank=True, verbose_name='Роль / занятие')
    lifestyle = models.CharField(max_length=120, blank=True, verbose_name='Образ жизни')
    favorite_occasions = models.CharField(max_length=255, blank=True, verbose_name='Любимые случаи')
    city_climate = models.CharField(max_length=160, blank=True, verbose_name='Город / климат')
    sizes_note = models.TextField(blank=True, verbose_name='Заметка о размерах')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Профиль'
        verbose_name_plural = 'Профили'

    def __str__(self):
        return f'Профиль: {self.user.get_full_name() or self.user.username} ({self.get_plan_type_display()})'

    def reset_limits_if_needed(self):
        """Сброс лимитов, если наступил новый день."""
        from django.utils import timezone
        today = timezone.now().date()
        if self.last_limit_reset < today:
            self.outfits_generated_today = 0
            self.messages_sent_today = 0
            self.last_limit_reset = today
            self.save()

    def can_generate_outfit(self):
        self.reset_limits_if_needed()
        if self.plan_type == 'pro':
            return True
        return self.outfits_generated_today < 10

    def can_send_message(self):
        self.reset_limits_if_needed()
        if self.plan_type == 'pro':
            return True
        return self.messages_sent_today < 20

    @property
    def wardrobe_count(self):
        return self.user.wardrobe_items.exclude(category__in=ACCESSORY_CATEGORIES).count()

    @property
    def accessories_count(self):
        return self.user.wardrobe_items.filter(category__in=ACCESSORY_CATEGORIES).count()

    @property
    def chats_count(self):
        return self.user.chat_sessions.count()


class WardrobeItem(models.Model):
    CATEGORY_CHOICES = [
        ('shirt_short', 'Рубашка с коротким рукавом'),
        ('shirt_long', 'Рубашка с длинным рукавом'),
        ('tshirt', 'Футболка'),
        ('top', 'Топ'),
        ('blouse', 'Блузка'),
        ('jeans_ankle', 'Джинсы до щиколотки'),
        ('jeans_full', 'Джинсы полной длины'),
        ('pants_classic', 'Классические брюки'),
        ('pants_wide', 'Широкие брюки'),
        ('skirt_mini', 'Мини-юбка'),
        ('skirt_midi', 'Юбка миди'),
        ('dress_casual', 'Повседневное платье'),
        ('dress_evening', 'Вечернее платье'),
        ('jumpsuit', 'Комбинезон'),
        ('jacket', 'Куртка'),
        ('blazer', 'Пиджак'),
        ('coat', 'Пальто'),
        ('trench', 'Тренч'),
        ('hoodie', 'Худи'),
        ('sweater', 'Свитер'),
        ('sneakers', 'Кроссовки'),
        ('heels', 'Туфли на каблуке'),
        ('boots', 'Ботинки'),
        ('loafers', 'Лоферы'),
        ('sandals', 'Сандалии'),
        ('bag_daily', 'Повседневная сумка'),
        ('bag_evening', 'Вечерняя сумка'),
        ('accessory_jewelry', 'Украшения'),
        ('accessory_belt', 'Ремень'),
        ('accessory_hat', 'Головной убор'),
        ('accessory_scarf', 'Шарф / платок'),
        ('accessory_watch', 'Часы'),
        ('accessory_glasses', 'Очки'),
        ('sports_set', 'Спортивный комплект'),
        ('underwear', 'Бельё'),
        ('other', 'Другое'),
    ]
    SEASON_CHOICES = [
        ('spring', 'Весна'),
        ('summer', 'Лето'),
        ('autumn', 'Осень'),
        ('winter', 'Зима'),
        ('all', 'Всесезонная'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='wardrobe_items')
    name = models.CharField(max_length=200, verbose_name='Название')
    category = models.CharField(max_length=32, choices=CATEGORY_CHOICES, verbose_name='Категория')
    color = models.CharField(max_length=100, blank=True, verbose_name='Цвет')
    brand = models.CharField(max_length=100, blank=True, verbose_name='Бренд')
    season = models.CharField(max_length=10, choices=SEASON_CHOICES, default='all', verbose_name='Сезон')
    image = models.ImageField(upload_to='wardrobe/', blank=True, null=True, verbose_name='Фото')
    notes = models.TextField(blank=True, verbose_name='Заметки')
    purchase_date = models.DateField(blank=True, null=True, verbose_name='Дата покупки')
    is_favorite = models.BooleanField(default=False, verbose_name='Любимая вещь')
    times_worn = models.PositiveIntegerField(default=0, verbose_name='Раз надето')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Вещь гардероба'
        verbose_name_plural = 'Гардероб'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.name} ({self.get_category_display()}) — {self.user.username}'

    @property
    def is_accessory(self):
        return self.category in ACCESSORY_CATEGORIES


class Collection(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='collections')
    name = models.CharField(max_length=100, verbose_name='Название коллекции (например, Streetwear)')
    description = models.TextField(blank=True, verbose_name='Описание')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Коллекция'
        verbose_name_plural = 'Коллекции'

    def __str__(self):
        return f'{self.name} — {self.user.username}'


class Look(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='looks')
    name = models.CharField(max_length=200, blank=True, verbose_name='Название образа')
    items = models.ManyToManyField(WardrobeItem, related_name='looks', verbose_name='Вещи в образе')
    collection = models.ForeignKey(Collection, on_delete=models.SET_NULL, null=True, blank=True, related_name='looks', verbose_name='Коллекция')
    ai_feedback = models.TextField(blank=True, verbose_name='Отзыв AI')
    rating = models.PositiveIntegerField(default=0, verbose_name='Оценка')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Образ'
        verbose_name_plural = 'Образы'

    def __str__(self):
        return f'Образ {self.pk} ({self.name or "Без названия"}) — {self.user.username}'


class ChatSession(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='chat_sessions')
    title = models.CharField(max_length=200, blank=True, verbose_name='Название диалога')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Чат-сессия'
        verbose_name_plural = 'Чат-сессии'
        ordering = ['-updated_at', '-created_at']

    def __str__(self):
        return self.title or f'Диалог {self.pk} — {self.user.username}'


class ChatMessage(models.Model):
    ROLE_CHOICES = [
        ('user', 'Пользователь'),
        ('assistant', 'Ассистент'),
    ]

    session = models.ForeignKey(ChatSession, on_delete=models.CASCADE, related_name='messages')
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, verbose_name='Роль')
    content = models.TextField(verbose_name='Сообщение')
    image = models.ImageField(upload_to='chat/generated_outfits/', blank=True, null=True)
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Сообщение чата'
        verbose_name_plural = 'Сообщения чата'
        ordering = ['created_at']

    def __str__(self):
        return f'{self.get_role_display()} · {self.session_id}'


class AIRecommendation(models.Model):
    REC_TYPE_CHOICES = [
        ('wardrobe', '👗 Гардероб'),
        ('capsule', '📦 Капсула'),
        ('colors', '🎨 Цвета'),
        ('full', '✨ Полный анализ'),
        ('grwm', '🔥 Генерация GRWM'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='ai_recommendations')
    rec_type = models.CharField(max_length=20, choices=REC_TYPE_CHOICES, default='full', verbose_name='Тип')
    input_params = models.JSONField(default=dict, verbose_name='Входные параметры')
    result = models.JSONField(default=dict, verbose_name='Результат AI')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'AI Рекомендация'
        verbose_name_plural = 'AI Рекомендации'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.get_rec_type_display()} — {self.user.username} ({self.created_at.strftime("%d.%m.%Y")})'


    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='ai_recommendations')
    rec_type = models.CharField(max_length=20, choices=REC_TYPE_CHOICES, default='full', verbose_name='Тип')
    input_params = models.JSONField(default=dict, verbose_name='Входные параметры')
    result = models.JSONField(default=dict, verbose_name='Результат AI')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'AI Рекомендация'
        verbose_name_plural = 'AI Рекомендации'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.get_rec_type_display()} — {self.user.username} ({self.created_at.strftime("%d.%m.%Y")})'
