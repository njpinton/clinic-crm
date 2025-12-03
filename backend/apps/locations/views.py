"""
ViewSets for PSGC Location API endpoints.
Provides read-only API for querying Philippine geographic data.
"""
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Prefetch
import sentry_sdk

from .models import PSGCRegion, PSGCProvince, PSGCMunicipality, PSGCBarangay
from .serializers import (
    PSGCRegionSerializer,
    PSGCRegionListSerializer,
    PSGCRegionDetailSerializer,
    PSGCProvinceSerializer,
    PSGCProvinceListSerializer,
    PSGCProvinceDetailSerializer,
    PSGCMunicipalitySerializer,
    PSGCMunicipalityListSerializer,
    PSGCMunicipalityDetailSerializer,
    PSGCBarangaySerializer,
    PSGCBarangayListSerializer,
)


class PSGCRegionViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for Philippine Regions.

    Provides:
    - list: GET /api/psgc/regions/ - List all regions
    - retrieve: GET /api/psgc/regions/{id}/ - Get region details with provinces

    Read-only access - PSGC data is managed through admin interface.
    """
    queryset = PSGCRegion.objects.all()
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'psgc_id']
    ordering_fields = ['name', 'psgc_id', 'created_at']
    ordering = ['name']

    def get_serializer_class(self):
        """Return appropriate serializer based on action."""
        if self.action == 'retrieve':
            return PSGCRegionDetailSerializer
        elif self.action == 'list':
            return PSGCRegionListSerializer
        return PSGCRegionSerializer

    def get_queryset(self):
        """Optimize queryset with prefetch for detail views."""
        queryset = super().get_queryset()
        if self.action == 'retrieve':
            queryset = queryset.prefetch_related('provinces')
        return queryset

    def list(self, request, *args, **kwargs):
        """List all Philippine regions."""
        try:
            return super().list(request, *args, **kwargs)
        except Exception as e:
            sentry_sdk.capture_exception(e)
            return Response(
                {'error': 'Failed to retrieve regions'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def retrieve(self, request, *args, **kwargs):
        """Retrieve a specific region with its provinces."""
        try:
            return super().retrieve(request, *args, **kwargs)
        except Exception as e:
            sentry_sdk.capture_exception(e)
            return Response(
                {'error': 'Failed to retrieve region'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class PSGCProvinceViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for Philippine Provinces.

    Provides:
    - list: GET /api/psgc/provinces/ - List all provinces
    - list: GET /api/psgc/provinces/?region_id={id} - Filter provinces by region
    - retrieve: GET /api/psgc/provinces/{id}/ - Get province details with municipalities

    Read-only access - PSGC data is managed through admin interface.
    """
    queryset = PSGCProvince.objects.all()
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['region']
    search_fields = ['name', 'psgc_id', 'region__name']
    ordering_fields = ['name', 'psgc_id', 'created_at']
    ordering = ['name']

    def get_serializer_class(self):
        """Return appropriate serializer based on action."""
        if self.action == 'retrieve':
            return PSGCProvinceDetailSerializer
        elif self.action == 'list':
            return PSGCProvinceListSerializer
        return PSGCProvinceSerializer

    def get_queryset(self):
        """
        Filter provinces by region if region_id is provided.
        Optimize queryset with prefetch for detail views.
        """
        queryset = super().get_queryset().select_related('region')

        # Filter by region_id if provided
        region_id = self.request.query_params.get('region_id', None)
        if region_id:
            queryset = queryset.filter(region_id=region_id)

        # Prefetch municipalities for detail view
        if self.action == 'retrieve':
            queryset = queryset.prefetch_related('municipalities')

        return queryset

    def list(self, request, *args, **kwargs):
        """List provinces, optionally filtered by region."""
        try:
            return super().list(request, *args, **kwargs)
        except Exception as e:
            sentry_sdk.capture_exception(e)
            return Response(
                {'error': 'Failed to retrieve provinces'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def retrieve(self, request, *args, **kwargs):
        """Retrieve a specific province with its municipalities."""
        try:
            return super().retrieve(request, *args, **kwargs)
        except Exception as e:
            sentry_sdk.capture_exception(e)
            return Response(
                {'error': 'Failed to retrieve province'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class PSGCMunicipalityViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for Philippine Cities and Municipalities.

    Provides:
    - list: GET /api/psgc/municipalities/ - List all municipalities
    - list: GET /api/psgc/municipalities/?province_id={id} - Filter by province
    - list: GET /api/psgc/municipalities/?is_city=true - Filter cities only
    - retrieve: GET /api/psgc/municipalities/{id}/ - Get municipality details with barangays

    Read-only access - PSGC data is managed through admin interface.
    """
    queryset = PSGCMunicipality.objects.all()
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['province', 'is_city']
    search_fields = ['name', 'psgc_id', 'province__name', 'province__region__name']
    ordering_fields = ['name', 'psgc_id', 'created_at']
    ordering = ['name']

    def get_serializer_class(self):
        """Return appropriate serializer based on action."""
        if self.action == 'retrieve':
            return PSGCMunicipalityDetailSerializer
        elif self.action == 'list':
            return PSGCMunicipalityListSerializer
        return PSGCMunicipalitySerializer

    def get_queryset(self):
        """
        Filter municipalities by province if province_id is provided.
        Optimize queryset with prefetch for detail views.
        """
        queryset = super().get_queryset().select_related('province', 'province__region')

        # Filter by province_id if provided
        province_id = self.request.query_params.get('province_id', None)
        if province_id:
            queryset = queryset.filter(province_id=province_id)

        # Prefetch barangays for detail view
        if self.action == 'retrieve':
            queryset = queryset.prefetch_related('barangays')

        return queryset

    def list(self, request, *args, **kwargs):
        """List municipalities, optionally filtered by province or city type."""
        try:
            return super().list(request, *args, **kwargs)
        except Exception as e:
            sentry_sdk.capture_exception(e)
            return Response(
                {'error': 'Failed to retrieve municipalities'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def retrieve(self, request, *args, **kwargs):
        """Retrieve a specific municipality with its barangays."""
        try:
            return super().retrieve(request, *args, **kwargs)
        except Exception as e:
            sentry_sdk.capture_exception(e)
            return Response(
                {'error': 'Failed to retrieve municipality'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class PSGCBarangayViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for Philippine Barangays.

    Provides:
    - list: GET /api/psgc/barangays/ - List all barangays
    - list: GET /api/psgc/barangays/?municipality_id={id} - Filter by municipality
    - retrieve: GET /api/psgc/barangays/{id}/ - Get barangay details

    Read-only access - PSGC data is managed through admin interface.
    """
    queryset = PSGCBarangay.objects.all()
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['municipality']
    search_fields = ['name', 'psgc_id', 'municipality__name', 'municipality__province__name']
    ordering_fields = ['name', 'psgc_id', 'created_at']
    ordering = ['name']

    def get_serializer_class(self):
        """Return appropriate serializer based on action."""
        if self.action == 'list':
            return PSGCBarangayListSerializer
        return PSGCBarangaySerializer

    def get_queryset(self):
        """
        Filter barangays by municipality if municipality_id is provided.
        Optimize queryset with select_related.
        """
        queryset = super().get_queryset().select_related(
            'municipality',
            'municipality__province',
            'municipality__province__region'
        )

        # Filter by municipality_id if provided
        municipality_id = self.request.query_params.get('municipality_id', None)
        if municipality_id:
            queryset = queryset.filter(municipality_id=municipality_id)

        return queryset

    def list(self, request, *args, **kwargs):
        """List barangays, optionally filtered by municipality."""
        try:
            return super().list(request, *args, **kwargs)
        except Exception as e:
            sentry_sdk.capture_exception(e)
            return Response(
                {'error': 'Failed to retrieve barangays'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def retrieve(self, request, *args, **kwargs):
        """Retrieve a specific barangay."""
        try:
            return super().retrieve(request, *args, **kwargs)
        except Exception as e:
            sentry_sdk.capture_exception(e)
            return Response(
                {'error': 'Failed to retrieve barangay'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
