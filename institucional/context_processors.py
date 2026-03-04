from django.conf import settings

def env_flags(request):
    return {
        "IS_PROD": getattr(settings, "IS_PROD", False),
        "GTM_ID": getattr(settings, "GTM_ID", ""),
    }