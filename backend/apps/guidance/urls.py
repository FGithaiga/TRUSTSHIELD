from django.urls import path

from . import views

urlpatterns = [path("guidance/", views.guidance, name="guidance")]
