from django.contrib.auth.models import User
from rest_framework import serializers

from .models import AIRecommendation, ChatMessage, ChatSession, Collection, Look, UserProfile, WardrobeItem


class LenientPrimaryKeyRelatedField(serializers.PrimaryKeyRelatedField):
    def __init__(self, *args, invalid_behavior='error', **kwargs):
        self.invalid_behavior = invalid_behavior
        super().__init__(*args, **kwargs)

    def to_internal_value(self, data):
        try:
            return super().to_internal_value(data)
        except serializers.ValidationError:
            if self.invalid_behavior == 'null':
                return None
            raise


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name')


class UserProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    avatar_url = serializers.SerializerMethodField()
    wardrobe_count = serializers.ReadOnlyField()
    accessories_count = serializers.ReadOnlyField()
    chats_count = serializers.ReadOnlyField()

    class Meta:
        model = UserProfile
        fields = (
            'id',
            'user',
            'avatar',
            'avatar_url',
            'bio',
            'occupation',
            'lifestyle',
            'favorite_occasions',
            'city_climate',
            'sizes_note',
            'wardrobe_count',
            'accessories_count',
            'chats_count',
            'created_at',
            'updated_at',
        )
        read_only_fields = ('created_at', 'updated_at')

    def get_avatar_url(self, obj):
        request = self.context.get('request')
        if obj.avatar and request:
            return request.build_absolute_uri(obj.avatar.url)
        return None


class UserRegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)
    password2 = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ('username', 'email', 'first_name', 'last_name', 'password', 'password2')

    def validate(self, data):
        if data['password'] != data['password2']:
            raise serializers.ValidationError({'password2': 'Пароли не совпадают'})
        return data

    def create(self, validated_data):
        validated_data.pop('password2')
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        UserProfile.objects.get_or_create(user=user)
        return user


class WardrobeItemSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()
    category_label = serializers.CharField(source='get_category_display', read_only=True)
    is_accessory = serializers.ReadOnlyField()

    class Meta:
        model = WardrobeItem
        fields = (
            'id',
            'name',
            'category',
            'category_label',
            'color',
            'brand',
            'season',
            'image',
            'image_url',
            'notes',
            'purchase_date',
            'is_favorite',
            'times_worn',
            'is_accessory',
            'created_at',
        )
        read_only_fields = ('created_at',)

    def get_image_url(self, obj):
        request = self.context.get('request')
        if obj.image and request:
            return request.build_absolute_uri(obj.image.url)
        return None


class ChatMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatMessage
        fields = ('id', 'role', 'content', 'created_at')
        read_only_fields = ('id', 'created_at')


class ChatSessionSerializer(serializers.ModelSerializer):
    messages_count = serializers.SerializerMethodField()
    last_message = serializers.SerializerMethodField()

    class Meta:
        model = ChatSession
        fields = ('id', 'title', 'messages_count', 'last_message', 'created_at', 'updated_at')
        read_only_fields = ('created_at', 'updated_at')

    def get_messages_count(self, obj):
        return obj.messages.count()

    def get_last_message(self, obj):
        message = obj.messages.order_by('-created_at').first()
        if not message:
            return None
        return {
            'role': message.role,
            'content': message.content,
            'created_at': message.created_at,
        }


class ChatMessageCreateSerializer(serializers.Serializer):
    content = serializers.CharField()


class AIRecommendationSerializer(serializers.ModelSerializer):
    class Meta:
        model = AIRecommendation
        fields = ('id', 'rec_type', 'input_params', 'result', 'created_at')
        read_only_fields = ('created_at',)


class CollectionSerializer(serializers.ModelSerializer):
    looks_count = serializers.SerializerMethodField()

    class Meta:
        model = Collection
        fields = ('id', 'name', 'description', 'looks_count', 'created_at')
        read_only_fields = ('created_at',)

    def get_looks_count(self, obj):
        return obj.looks.count()


class LookSerializer(serializers.ModelSerializer):
    collection = LenientPrimaryKeyRelatedField(
        queryset=Collection.objects.none(),
        allow_null=True,
        required=False,
        invalid_behavior='null',
    )
    items = LenientPrimaryKeyRelatedField(
        queryset=WardrobeItem.objects.none(),
        many=True,
        invalid_behavior='null',
    )
    collection_detail = CollectionSerializer(source='collection', read_only=True)
    items_detail = WardrobeItemSerializer(source='items', many=True, read_only=True)

    class Meta:
        model = Look
        fields = (
            'id',
            'name',
            'collection',
            'collection_detail',
            'items',
            'items_detail',
            'rating',
            'ai_feedback',
            'created_at',
        )
        read_only_fields = ('rating', 'ai_feedback', 'created_at')

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            self.fields['collection'].queryset = Collection.objects.filter(user=request.user)
            self.fields['items'].queryset = WardrobeItem.objects.filter(user=request.user)
            self.fields['items'].child_relation.queryset = WardrobeItem.objects.filter(user=request.user)

    def validate_items(self, items):
        items = [item for item in items if item is not None]
        if not items:
            raise serializers.ValidationError('Добавь хотя бы одну существующую вещь в образ.')
        return items
