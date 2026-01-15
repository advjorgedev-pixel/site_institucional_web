import re
from django.core.exceptions import ValidationError
from django.utils.translation import gettext as _


class UppercaseValidator:
    def validate(self, password, user=None):
        if not re.findall('[A-Z]', password):
            raise ValidationError(
                _("A senha deve conter pelo menos uma letra maiúscula."),
                code='password_no_upper',
            )

    def get_help_text(self):
        return _("Sua senha deve conter pelo menos uma letra maiúscula.")


class LowercaseValidator:
    def validate(self, password, user=None):
        if not re.findall('[a-z]', password):
            raise ValidationError(
                _("A senha deve conter pelo menos uma letra minúscula."),
                code='password_no_lower',
            )

    def get_help_text(self):
        return _("Sua senha deve conter pelo menos uma letra minúscula.")


class SpecialCharacterValidator:
    def validate(self, password, user=None):
        if not re.findall('[^A-Za-z0-9]', password):
            raise ValidationError(
                _("A senha deve conter pelo menos um caractere especial."),
                code='password_no_special',
            )

    def get_help_text(self):
        return _("Sua senha deve conter pelo menos um caractere especial.")


class NumberValidator:
    def validate(self, password, user=None):
        if not re.findall('[0-9]', password):
            raise ValidationError(
                _("A senha deve conter pelo menos um número."),
                code='password_no_number',
            )

    def get_help_text(self):
        return _("Sua senha deve conter pelo menos um número.")
