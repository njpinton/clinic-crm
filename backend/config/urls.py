"""
URL configuration for clinic CRM.
"""
from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
    TokenVerifyView,
)
from rest_framework.permissions import IsAuthenticated
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularSwaggerView,
    SpectacularRedocView,
)

urlpatterns = [
    path('admin/', admin.site.urls),

    # API Documentation (requires authentication)
    path('api/schema/', SpectacularAPIView.as_view(permission_classes=[IsAuthenticated]), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema', permission_classes=[IsAuthenticated]), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema', permission_classes=[IsAuthenticated]), name='redoc'),

    # JWT Authentication endpoints
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/token/verify/', TokenVerifyView.as_view(), name='token_verify'),

    # API endpoints
    path('api/', include('apps.core.urls')),
    path('api/', include('apps.users.urls')),
    path('api/', include('apps.patients.urls')),
    path('api/', include('apps.doctors.urls')),
    path('api/', include('apps.appointments.urls')),
    path('api/', include('apps.clinical_notes.urls')),
    path('api/', include('apps.prescriptions.urls')),
    path('api/', include('apps.insurance.urls')),
    path('api/', include('apps.laboratory.urls')),
    path('api/billing/', include('apps.billing.urls')),
]
