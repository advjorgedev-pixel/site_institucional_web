from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.conf.urls.i18n import i18n_patterns
from django.contrib.sitemaps.views import sitemap
from django.views.generic import TemplateView
from institucional.sitemap import StaticViewMultilangSitemap, BlogPostMultilangSitemap
from django.conf.urls import handler404, handler500, handler403

handler404 = "django.views.defaults.page_not_found"
handler500 = "django.views.defaults.server_error"
handler403 = "django.views.defaults.permission_denied"


sitemaps = {
    "static": StaticViewMultilangSitemap,
    "blog": BlogPostMultilangSitemap,
}

urlpatterns = [
    path("admin/", admin.site.urls),
    path("i18n/", include("django.conf.urls.i18n")),
    path("sitemap.xml", sitemap, {"sitemaps": sitemaps}, name="sitemap"),
    path("robots.txt", TemplateView.as_view( template_name="robots.txt", content_type="text/plain"), name="robots", ),
]

urlpatterns += i18n_patterns(
    path("", include("institucional.urls")),
    prefix_default_language=False,
)

urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
