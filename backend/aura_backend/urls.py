from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.views.static import serve
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

# ── Custom Admin Branding ──
admin.site.site_header  = '✨ AURA — Панель управления'
admin.site.site_title   = 'AURA Admin'
admin.site.index_title  = 'Добро пожаловать в AURA'

urlpatterns = [
    path('admin/', admin.site.urls),

    # JWT auth
    path('api/auth/token/',         TokenObtainPairView.as_view(),  name='token_obtain_pair'),
    path('api/auth/token/refresh/', TokenRefreshView.as_view(),     name='token_refresh'),

    # App API
    path('api/', include('stylist.urls')),

    # Serve media files in production (even when DEBUG=False)
    re_path(r'^media/(?P<path>.*)$', serve, {'document_root': settings.MEDIA_ROOT}),
]
