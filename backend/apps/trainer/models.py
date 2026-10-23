from django.conf import settings
from django.db import models


class TrainerAnswer(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="trainer_answers")
    challenge_id = models.CharField(max_length=40)
    answer = models.CharField(max_length=10)
    correct = models.BooleanField()
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ["-created_at"]
