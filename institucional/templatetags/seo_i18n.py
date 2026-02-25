from django import template
from django.urls import translate_url

register = template.Library()

@register.simple_tag(takes_context=True)
def hreflang_url(context, lang_code):
    """
    Retorna a URL ABSOLUTA da página atual no idioma solicitado.
    Funciona com i18n_patterns e prefix_default_language=False.
    """
    request = context.get("request")
    if not request:
        return ""
    translated_path = translate_url(request.get_full_path(), lang_code)
    return request.build_absolute_uri(translated_path)