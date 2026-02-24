from django.contrib.sitemaps import Sitemap
from django.urls import reverse
from django.utils import translation
from django.utils import timezone

from .models import BlogPost


LANG_CODES = ("pt-br", "es")


class StaticViewMultilangSitemap(Sitemap):
    priority = 0.8
    changefreq = "weekly"

    def items(self):
        static_names = ["home", "about", "services", "blog_list", "contact"]
        return [(lang, name) for lang in LANG_CODES for name in static_names]

    def location(self, item):
        lang, url_name = item
        with translation.override(lang):
            return reverse(url_name)


class BlogPostMultilangSitemap(Sitemap):
    priority = 0.7
    changefreq = "weekly"

    def items(self):
        qs = (
            BlogPost.objects
            .filter(status=BlogPost.Status.PUBLISHED)
            .filter(published_at__isnull=False, published_at__lte=timezone.now())
            .order_by("-published_at", "-created_at")
        )

        items = []
        for post in qs:
            # PT-BR sempre
            items.append(("pt-br", post))

            # ES só se tiver conteúdo
            if (post.title_es or "").strip() and (post.content_es or "").strip():
                items.append(("es", post))

        return items

    def lastmod(self, item):
        _lang, post = item
        return post.updated_at or post.published_at

    def location(self, item):
        lang, post = item
        with translation.override(lang):
            return post.get_absolute_url()