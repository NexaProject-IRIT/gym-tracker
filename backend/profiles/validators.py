from django.core.exceptions import ValidationError


class HasDigitValidator:
    def validate(self, password, user=None):
        if not any(c.isdigit() for c in password):
            raise ValidationError('Пароль должен содержать хотя бы одну цифру.')

    def get_help_text(self):
        return 'Пароль должен содержать хотя бы одну цифру.'
