from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/v1/', include('emails.urls')),
    path('api/v1/delivery/', include('delivery.urls')),
    path('api/v1/', include('delivery.urls')),
]
