"""
URLs de la API
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import InstalacionViewSet

# Router automático de DRF
router = DefaultRouter()
router.register(r'instalaciones', InstalacionViewSet, basename='instalacion')

urlpatterns = [
    path('', include(router.urls)),
]