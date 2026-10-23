import random
from datetime import timedelta
from functools import lru_cache

from django.utils import timezone
from rest_framework import serializers, status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from apps.scans.analysis import engine

from .challenges import BY_ID, CHALLENGES, LEVELS
from .models import TrainerAnswer

ROUND_SIZE = 5


@lru_cache(maxsize=None)
def _analysis(challenge_id):
    """Run the real pipeline (rules, link checks and ML models) once per challenge."""
    c = BY_ID[challenge_id]
    r = engine.analyze(c["scan_type"], c["text"], c.get("offer_type"))
    return {
        "risk_level": r["risk_level"],
        "risk_score": r["risk_score"],
        "scam_category": r["scam_category"],
        "findings": [{"title": f["title"], "severity": f["severity"], "source": f["source"]} for f in r["findings"][:4]],
        "model": {"model": r["model_result"]["model"], "label": r["model_result"]["label"]} if r["model_result"] else None,
        "anatomy": r["anatomy"],
    }


def _stats(user):
    answers = TrainerAnswer.objects.filter(user=user)
    total = answers.count()
    correct = answers.filter(correct=True).count()
    accuracy = round(correct / total * 100) if total else 0

    days = set(answers.values_list("created_at__date", flat=True))
    today = timezone.localdate()
    streak, day = 0, today if today in days else today - timedelta(days=1)
    while day in days:
        streak += 1
        day -= timedelta(days=1)

    index = next(i for i, (_, n, acc) in enumerate(LEVELS) if total >= n and accuracy >= acc)
    name = LEVELS[index][0]
    nxt = None
    if index > 0:
        next_name, need_n, need_acc = LEVELS[index - 1]
        nxt = {"name": next_name, "answers_needed": max(0, need_n - total), "accuracy_needed": need_acc}
    return {"answered": total, "correct": correct, "accuracy": accuracy, "streak_days": streak,
            "level": name, "next_level": nxt, "played_today": today in days}


@api_view(["GET"])
def round_(request):
    items = random.sample(CHALLENGES, ROUND_SIZE)
    return Response({
        "challenges": [{"id": c["id"], "scan_type": c["scan_type"], "offer_type": c.get("offer_type"), "text": c["text"]} for c in items],
        "stats": _stats(request.user),
    })


class AnswerSerializer(serializers.Serializer):
    challenge_id = serializers.ChoiceField(choices=list(BY_ID))
    answer = serializers.ChoiceField(choices=["scam", "safe"])


@api_view(["POST"])
def answer(request):
    s = AnswerSerializer(data=request.data)
    s.is_valid(raise_exception=True)
    c = BY_ID[s.validated_data["challenge_id"]]
    correct = s.validated_data["answer"] == c["answer"]
    TrainerAnswer.objects.create(user=request.user, challenge_id=c["id"], answer=s.validated_data["answer"], correct=correct)
    analysis = _analysis(c["id"])
    return Response({
        "correct": correct,
        "answer": c["answer"],
        "lesson": c["lesson"],
        "analysis": analysis,
        "trustshield_agrees": (analysis["risk_level"] != "clear") == (c["answer"] == "scam"),
        "stats": _stats(request.user),
    }, status=status.HTTP_201_CREATED)


@api_view(["GET"])
def stats(request):
    return Response(_stats(request.user))
