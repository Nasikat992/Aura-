from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.models import User
from django.utils.html import format_html

from .models import ACCESSORY_CATEGORIES, AIRecommendation, ChatMessage, ChatSession, Collection, Look, UserProfile, WardrobeItem


class UserProfileInline(admin.StackedInline):
    model = UserProfile
    can_delete = False
    verbose_name_plural = '✨ Профиль стилиста'
    fieldsets = (
        ('Профиль', {'fields': ('avatar', 'gender', 'bio')}),
        ('Образ жизни', {'fields': ('occupation', 'lifestyle', 'favorite_occasions', 'city_climate', 'sizes_note')}),
    )


class UserAdmin(BaseUserAdmin):
    inlines = (UserProfileInline,)
    list_display = ('username', 'get_full_name', 'email', 'wardrobe_count', 'chat_count', 'is_active', 'date_joined')
    list_filter = ('is_active', 'is_staff', 'date_joined')
    search_fields = ('username', 'email', 'first_name', 'last_name')

    def wardrobe_count(self, obj):
        count = obj.wardrobe_items.count()
        color = '#e07090' if count > 0 else '#aaa'
        return format_html('<b style="color:{}">{} вещей</b>', color, count)

    wardrobe_count.short_description = '👗 Гардероб'

    def chat_count(self, obj):
        count = obj.chat_sessions.count()
        color = '#e07090' if count > 0 else '#aaa'
        return format_html('<b style="color:{}">{} чатов</b>', color, count)

    chat_count.short_description = '💬 Чаты'


admin.site.unregister(User)
admin.site.register(User, UserAdmin)


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'gender', 'occupation', 'lifestyle', 'favorite_occasions', 'updated_at')
    list_filter = ('gender', 'lifestyle')
    search_fields = ('user__username', 'user__email', 'occupation', 'favorite_occasions', 'city_climate')
    readonly_fields = ('created_at', 'updated_at', 'wardrobe_count_display', 'accessories_count_display', 'chats_count_display')
    fieldsets = (
        ('👤 Пользователь', {'fields': ('user', 'avatar', 'gender', 'bio')}),
        ('🌿 Образ жизни', {'fields': ('occupation', 'lifestyle', 'favorite_occasions', 'city_climate', 'sizes_note')}),
        ('📊 Статистика', {'fields': ('wardrobe_count_display', 'accessories_count_display', 'chats_count_display', 'created_at', 'updated_at')}),
    )

    def wardrobe_count_display(self, obj):
        return obj.wardrobe_count

    wardrobe_count_display.short_description = 'Вещей в гардеробе'

    def accessories_count_display(self, obj):
        return obj.accessories_count

    accessories_count_display.short_description = 'Аксессуаров'

    def chats_count_display(self, obj):
        return obj.chats_count

    chats_count_display.short_description = 'Диалогов'


@admin.register(WardrobeItem)
class WardrobeItemAdmin(admin.ModelAdmin):
    list_display = ('name', 'user', 'category_badge', 'color_chip', 'brand', 'season', 'kind_badge', 'is_favorite', 'times_worn')
    list_filter = ('category', 'season', 'is_favorite', 'created_at')
    search_fields = ('name', 'brand', 'color', 'user__username', 'notes')
    list_editable = ('is_favorite', 'times_worn')
    readonly_fields = ('created_at', 'image_preview')
    date_hierarchy = 'created_at'
    fieldsets = (
        ('📦 Основное', {'fields': ('user', 'name', 'category', 'season', 'is_favorite')}),
        ('🎨 Детали', {'fields': ('color', 'brand', 'purchase_date', 'times_worn')}),
        ('📷 Фото и заметки', {'fields': ('image', 'image_preview', 'notes')}),
        ('📅 Даты', {'fields': ('created_at',), 'classes': ('collapse',)}),
    )

    def category_badge(self, obj):
        return format_html(
            '<span style="background:#fce8ef;padding:2px 8px;border-radius:12px;font-size:12px">{}</span>',
            obj.get_category_display(),
        )

    category_badge.short_description = 'Категория'

    def color_chip(self, obj):
        if obj.color:
            return format_html(
                '<span style="display:inline-block;width:14px;height:14px;border-radius:50%;'
                'background:{};border:1px solid #ddd;vertical-align:middle;margin-right:6px"></span>{}',
                obj.color,
                obj.color,
            )
        return '—'

    color_chip.short_description = 'Цвет'

    def kind_badge(self, obj):
        label = 'Аксессуар' if obj.category in ACCESSORY_CATEGORIES else 'Гардероб'
        bg = '#fef3e2' if obj.category in ACCESSORY_CATEGORIES else '#e8f0fe'
        return format_html('<span style="background:{};padding:2px 8px;border-radius:12px;font-size:12px">{}</span>', bg, label)

    kind_badge.short_description = 'Раздел'

    def image_preview(self, obj):
        if obj.image:
            return format_html('<img src="{}" width="120" style="border-radius:8px"/>', obj.image.url)
        return '—'

    image_preview.short_description = 'Превью'


class ChatMessageInline(admin.TabularInline):
    model = ChatMessage
    extra = 0
    readonly_fields = ('role', 'content', 'image', 'metadata', 'created_at')
    can_delete = False


@admin.register(ChatSession)
class ChatSessionAdmin(admin.ModelAdmin):
    list_display = ('id', 'title', 'user', 'messages_count', 'updated_at')
    search_fields = ('title', 'user__username', 'messages__content')
    readonly_fields = ('created_at', 'updated_at')
    inlines = (ChatMessageInline,)

    def messages_count(self, obj):
        return obj.messages.count()

    messages_count.short_description = 'Сообщений'


@admin.register(AIRecommendation)
class AIRecommendationAdmin(admin.ModelAdmin):
    list_display = ('user', 'rec_type', 'created_at')
    list_filter = ('rec_type', 'created_at')
    search_fields = ('user__username',)
    readonly_fields = ('created_at', 'input_params', 'result')


@admin.register(Collection)
class CollectionAdmin(admin.ModelAdmin):
    list_display = ('name', 'user', 'created_at')
    search_fields = ('name', 'description', 'user__username')
    readonly_fields = ('created_at',)


@admin.register(Look)
class LookAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'user', 'collection', 'rating', 'created_at')
    list_filter = ('rating', 'created_at')
    search_fields = ('name', 'user__username', 'ai_feedback')
    readonly_fields = ('created_at',)
    filter_horizontal = ('items',)
