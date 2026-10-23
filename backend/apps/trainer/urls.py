from django.urls import path

from . import views

urlpatterns = [
    path("trainer/round/", views.round_, name="trainer-round"),
    path("trainer/answer/", views.answer, name="trainer-answer"),
    path("trainer/stats/", views.stats, name="trainer-stats"),
]
