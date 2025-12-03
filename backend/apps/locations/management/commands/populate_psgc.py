"""
Management command to populate PSGC (Philippine Standard Geographic Code) data from the API.
Fetches regions, provinces, municipalities, and barangays and stores them in the database.
"""
import requests
from django.core.management.base import BaseCommand
from django.db import transaction
from apps.locations.models import PSGCRegion, PSGCProvince, PSGCMunicipality, PSGCBarangay


class Command(BaseCommand):
    help = 'Populate PSGC (Philippine Standard Geographic Code) geographic data from the API'

    def add_arguments(self, parser):
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Clear existing PSGC data before populating',
        )

    def handle(self, *args, **options):
        if options['clear']:
            self.stdout.write(self.style.WARNING('Clearing existing PSGC data...'))
            PSGCRegion.objects.all().delete()
            PSGCProvince.objects.all().delete()
            PSGCMunicipality.objects.all().delete()
            PSGCBarangay.objects.all().delete()
            self.stdout.write(self.style.SUCCESS('✓ Cleared existing data'))

        self.stdout.write('Fetching PSGC data from API (psgc.rootscratch.com)...\n')

        try:
            self.populate_regions()
            self.populate_provinces()
            self.populate_municipalities()
            self.populate_barangays()
            self.stdout.write(self.style.SUCCESS('\n✓ Successfully populated PSGC data!'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'\n✗ Error: {str(e)}'))
            raise

    def populate_regions(self):
        """Fetch and populate all regions."""
        self.stdout.write('Fetching regions...')
        url = 'https://psgc.rootscratch.com/region'

        try:
            response = requests.get(url, timeout=30)
            response.raise_for_status()
            regions = response.json()

            with transaction.atomic():
                created_count = 0
                for region_data in regions:
                    region, created = PSGCRegion.objects.update_or_create(
                        psgc_id=region_data['psgc_id'],
                        defaults={
                            'name': region_data['name'],
                            'correspondence_code': region_data.get('correspondence_code', ''),
                        }
                    )
                    if created:
                        created_count += 1

            self.stdout.write(self.style.SUCCESS(f'  ✓ Populated {len(regions)} regions ({created_count} new)'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'  ✗ Failed to fetch regions: {str(e)}'))
            raise

    def populate_provinces(self):
        """Fetch and populate all provinces for each region."""
        self.stdout.write('Fetching provinces...')

        regions = PSGCRegion.objects.all()
        total_provinces = 0
        created_count = 0

        for region in regions:
            url = f'https://psgc.rootscratch.com/province?id={region.psgc_id}'

            try:
                response = requests.get(url, timeout=30)
                response.raise_for_status()
                provinces = response.json()

                with transaction.atomic():
                    for prov_data in provinces:
                        province, created = PSGCProvince.objects.update_or_create(
                            psgc_id=prov_data['psgc_id'],
                            defaults={
                                'name': prov_data['name'],
                                'region': region,
                                'correspondence_code': prov_data.get('correspondence_code', ''),
                            }
                        )
                        if created:
                            created_count += 1
                        total_provinces += 1
            except Exception as e:
                self.stdout.write(self.style.WARNING(f'  ⚠ Failed for region {region.name}: {str(e)}'))
                continue

        self.stdout.write(self.style.SUCCESS(f'  ✓ Populated {total_provinces} provinces ({created_count} new)'))

    def populate_municipalities(self):
        """Fetch and populate all municipalities for each province."""
        self.stdout.write('Fetching municipalities/cities...')

        provinces = PSGCProvince.objects.all()
        total_municipalities = 0
        created_count = 0

        for province in provinces:
            url = f'https://psgc.rootscratch.com/municipal-city?id={province.psgc_id}'

            try:
                response = requests.get(url, timeout=30)
                response.raise_for_status()
                municipalities = response.json()

                with transaction.atomic():
                    for mun_data in municipalities:
                        municipality, created = PSGCMunicipality.objects.update_or_create(
                            psgc_id=mun_data['psgc_id'],
                            defaults={
                                'name': mun_data['name'],
                                'province': province,
                                'correspondence_code': mun_data.get('correspondence_code', ''),
                                'is_city': mun_data.get('municipality_classification', '') == 'City',
                            }
                        )
                        if created:
                            created_count += 1
                        total_municipalities += 1
            except Exception as e:
                self.stdout.write(self.style.WARNING(f'  ⚠ Failed for province {province.name}: {str(e)}'))
                continue

        self.stdout.write(self.style.SUCCESS(
            f'  ✓ Populated {total_municipalities} municipalities/cities ({created_count} new)'
        ))

    def populate_barangays(self):
        """Fetch and populate all barangays for each municipality."""
        self.stdout.write('Fetching barangays...')

        municipalities = PSGCMunicipality.objects.all()
        total_barangays = 0
        created_count = 0

        for municipality in municipalities:
            url = f'https://psgc.rootscratch.com/barangay?id={municipality.psgc_id}'

            try:
                response = requests.get(url, timeout=30)
                response.raise_for_status()
                barangays = response.json()

                with transaction.atomic():
                    for bar_data in barangays:
                        barangay, created = PSGCBarangay.objects.update_or_create(
                            psgc_id=bar_data['psgc_id'],
                            defaults={
                                'name': bar_data['name'],
                                'municipality': municipality,
                                'correspondence_code': bar_data.get('correspondence_code', ''),
                            }
                        )
                        if created:
                            created_count += 1
                        total_barangays += 1
            except Exception as e:
                self.stdout.write(self.style.WARNING(f'  ⚠ Failed for municipality {municipality.name}: {str(e)}'))
                continue

        self.stdout.write(self.style.SUCCESS(f'  ✓ Populated {total_barangays} barangays ({created_count} new)'))
