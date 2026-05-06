"""
URLs de la API
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from .views import InstalacionViewSet
from .auth_views import login_view, logout_view, me_view

router = DefaultRouter()
router.register(r'instalaciones', InstalacionViewSet, basename='instalacion')

urlpatterns = [
    # Endpoints de instalaciones (público por ahora)
    path('', include(router.urls)),
    
    # Endpoints de autenticación
    path('auth/login/', login_view, name='login'),
    path('auth/logout/', logout_view, name='logout'),
    path('auth/me/', me_view, name='me'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]