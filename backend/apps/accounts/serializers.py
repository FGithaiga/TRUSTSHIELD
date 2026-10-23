import re

from django.contrib.auth import password_validation
from rest_framework import serializers

from .models import User

ALLOWED_PREFERENCES = {"save_scan_text", "weekly_summary"}
PHONE_RE = re.compile(r"^(?:\+?254|0)(?:7|1)\d{8}$")


def normalize_phone(value):
    return re.sub(r"[\s-]", "", value or "")


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "full_name", "email", "phone", "date_joined", "preferences"]
        read_only_fields = ["id", "email", "date_joined"]

    def validate_full_name(self, value):
        if not value.strip():
            raise serializers.ValidationError("Enter your name.")
        return value.strip()

    def validate_phone(self, value):
        value = normalize_phone(value)
        if value and not PHONE_RE.match(value):
            raise serializers.ValidationError("Enter a Kenyan mobile number, for example 0712345678.")
        return value

    def validate_preferences(self, value):
        if not isinstance(value, dict) or set(value) - ALLOWED_PREFERENCES:
            raise serializers.ValidationError("Unknown preference.")
        if any(not isinstance(v, bool) for v in value.values()):
            raise serializers.ValidationError("Preferences must be true or false.")
        return value

    def update(self, instance, validated_data):
        prefs = validated_data.pop("preferences", None)
        if prefs is not None:
            instance.preferences = {**instance.preferences, **prefs}
        return super().update(instance, validated_data)


class RegisterSerializer(serializers.Serializer):
    full_name = serializers.CharField(max_length=120)
    email = serializers.EmailField()
    phone = serializers.CharField(max_length=20, required=False, allow_blank=True)
    password = serializers.CharField(write_only=True, trim_whitespace=False)

    def validate_full_name(self, value):
        if not value.strip():
            raise serializers.ValidationError("Enter your name.")
        return value.strip()

    def validate_email(self, value):
        value = value.lower().strip()
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("An account with this email already exists.")
        return value

    def validate_phone(self, value):
        value = normalize_phone(value)
        if value and not PHONE_RE.match(value):
            raise serializers.ValidationError("Enter a Kenyan mobile number, for example 0712345678.")
        if value and User.objects.filter(phone=value).exists():
            raise serializers.ValidationError("This phone number is already registered.")
        return value

    def validate(self, attrs):
        candidate = User(email=attrs["email"], full_name=attrs["full_name"])
        try:
            password_validation.validate_password(attrs["password"], candidate)
        except Exception as exc:
            raise serializers.ValidationError({"password": list(exc.messages)})
        return attrs

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)


def _check_password(password, user):
    try:
        password_validation.validate_password(password, user)
    except Exception as exc:
        raise serializers.ValidationError(list(exc.messages))
    return password


class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()


class PasswordResetConfirmSerializer(serializers.Serializer):
    uid = serializers.CharField()
    token = serializers.CharField()
    password = serializers.CharField(trim_whitespace=False)


class ChangePasswordSerializer(serializers.Serializer):
    current_password = serializers.CharField(trim_whitespace=False)
    new_password = serializers.CharField(trim_whitespace=False)

    def validate_current_password(self, value):
        if not self.context["request"].user.check_password(value):
            raise serializers.ValidationError("Your current password is incorrect.")
        return value

    def validate_new_password(self, value):
        return _check_password(value, self.context["request"].user)


class LoginSerializer(serializers.Serializer):
    identifier = serializers.CharField()
    password = serializers.CharField(trim_whitespace=False)

    def validate(self, attrs):
        identifier = attrs["identifier"].strip()
        if "@" in identifier:
            user = User.objects.filter(email__iexact=identifier).first()
        else:
            user = User.objects.filter(phone=normalize_phone(identifier)).first()
        if user is None:
            # Hash anyway so an unknown account takes as long as a wrong password;
            # otherwise response timing reveals which emails and phones are registered.
            User().set_password(attrs["password"])
        # Same message for unknown user and wrong password, so accounts cannot be enumerated.
        if not user or not user.is_active or not user.check_password(attrs["password"]):
            raise serializers.ValidationError("Incorrect email, phone number or password.")
        attrs["user"] = user
        return attrs
