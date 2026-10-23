from django.urls import path

from . import views

urlpatterns = [path("incidents/", views.IncidentListCreateView.as_view(), name="incidents")]
