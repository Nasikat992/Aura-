import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'aura_backend.settings')
django.setup()

from django.contrib.auth import get_user_model
from stylist.models import WardrobeItem

User = get_user_model()
users = User.objects.all()

items_data = [
    {'name': 'Белая базовая футболка', 'category': 'tshirt', 'color': 'Белый', 'season': 'all', 'brand': 'Zara'},
    {'name': 'Черные классические брюки', 'category': 'pants_classic', 'color': 'Черный', 'season': 'all', 'brand': 'Massimo Dutti'},
    {'name': 'Синие джинсы', 'category': 'jeans_full', 'color': 'Синий', 'season': 'all', 'brand': 'Levi\'s'},
    {'name': 'Бежевый тренч', 'category': 'trench', 'color': 'Бежевый', 'season': 'autumn', 'brand': 'Mango'},
    {'name': 'Черная водолазка', 'category': 'sweater', 'color': 'Черный', 'season': 'winter', 'brand': 'Uniqlo'},
    {'name': 'Светлое платье миди', 'category': 'dress_casual', 'color': 'Кремовый', 'season': 'summer', 'brand': 'H&M'},
    {'name': 'Белые кеды', 'category': 'sneakers', 'color': 'Белый', 'season': 'spring', 'brand': 'Nike'},
    {'name': 'Черные ботинки челси', 'category': 'boots', 'color': 'Черный', 'season': 'autumn', 'brand': 'Dr. Martens'},
    {'name': 'Кожаный ремень', 'category': 'accessory_belt', 'color': 'Коричневый', 'season': 'all', 'brand': 'Zara'},
    {'name': 'Сумка', 'category': 'other', 'color': 'Черный', 'season': 'all', 'brand': 'Michael Kors'}, 
]

count = 0
for user in users:
    for data in items_data:
        obj, created = WardrobeItem.objects.get_or_create(
            user=user, 
            name=data['name'], 
            defaults=data
        )
        if created:
            count += 1

print(f"Готово! Добавлено {count} новых вещей в гардероб.")
