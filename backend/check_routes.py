import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'dovi_project.settings')
django.setup()

from delivery.models import DeliveryRoute

count = DeliveryRoute.objects.count()
print(f"DeliveryRoute count in sqlite: {count}")
