from django.views.generic import TemplateView, ListView, DetailView
from django.utils.translation import gettext_lazy as _
from django.utils import timezone
from django.http import Http404
from .models import BlogPost, AreaOfPractice


class HomeView(TemplateView):
    template_name = "home/home_site.html"

class AboutView(TemplateView):
    template_name = "about/about_site.html"

class ServicesView(TemplateView):
    template_name = "services/services_site.html"

from django.utils import timezone, translation
from django.views.generic import ListView

from .models import AreaOfPractice, BlogPost


class BlogPostListView(ListView):
    model = BlogPost
    template_name = "blog/blog_list.html"
    context_object_name = "posts"
    paginate_by = 6

    def get_language(self) -> str:
        lang = (translation.get_language() or "pt-br").lower()
        # normaliza: es, es-es, es-ar -> es
        return "es" if lang.startswith("es") else "pt-br"

    def get_queryset(self):
        qs = (
            BlogPost.objects
            .filter(status=BlogPost.Status.PUBLISHED, published_at__lte=timezone.now())
            .select_related("area", "created_by")
            .prefetch_related("tags")
            .order_by("-published_at", "-created_at")
        )

        q = (self.request.GET.get("q") or "").strip()
        area_slug = (self.request.GET.get("area") or "").strip()

        if area_slug:
            qs = qs.filter(area__slug=area_slug)

        if q:
            words = [w for w in q.split() if w]
            lang = self.get_language()

            # busca AND palavra por palavra
            for word in words:
                if lang == "es":
                    qs = qs.filter(title_es__icontains=word)
                else:
                    qs = qs.filter(title_pt__icontains=word)

        return qs

    def get_context_data(self, **kwargs):
        ctx = super().get_context_data(**kwargs)

        q = (self.request.GET.get("q") or "").strip()
        area_selected = (self.request.GET.get("area") or "").strip()

        ctx["q"] = q
        ctx["area_selected"] = area_selected
        ctx["areas"] = AreaOfPractice.objects.filter(is_active=True).order_by("order", "name")
        base_qs = self.get_queryset()
        ctx["featured_post"] = base_qs.first()

        return ctx


class BlogPostDetailView(DetailView):
    model = BlogPost
    template_name = "blog/blog_detail.html"
    context_object_name = "post"
    slug_url_kwarg = "slug"

    def get_language(self) -> str:
        lang = (translation.get_language() or "pt-br").lower()
        return "es" if lang.startswith("es") else "pt-br"

    def get_queryset(self):
        return (
            BlogPost.objects
            .select_related("area", "created_by")
            .prefetch_related("tags")
        )

    def get_object(self, queryset=None):
        obj = super().get_object(queryset=queryset)

        is_staff = self.request.user.is_authenticated and self.request.user.is_staff
        if not is_staff:
            if obj.status != BlogPost.Status.PUBLISHED:
                raise Http404()
            if obj.published_at and obj.published_at > timezone.now():
                raise Http404()

        return obj

    def get_context_data(self, **kwargs):
        ctx = super().get_context_data(**kwargs)
        post = self.object

        lang = self.get_language()
        ctx["lang"] = lang

        if lang == "es":
            ctx["post_title"] = post.title_es or post.title_pt
            ctx["post_summary"] = post.summary_es or post.summary_pt
            ctx["post_content"] = post.content_es or post.content_pt
            ctx["meta_title"] = post.meta_title_es or post.meta_title_pt or post.title_pt
            ctx["meta_description"] = post.meta_description_es or post.meta_description_pt or post.summary_pt
        else:
            ctx["post_title"] = post.title_pt
            ctx["post_summary"] = post.summary_pt
            ctx["post_content"] = post.content_pt
            ctx["meta_title"] = post.meta_title_pt or post.title_pt
            ctx["meta_description"] = post.meta_description_pt or post.summary_pt

        # Relacionados (mesma área)
        ctx["related_posts"] = (
            BlogPost.objects
            .filter(status=BlogPost.Status.PUBLISHED, published_at__lte=timezone.now())
            .exclude(id=post.id)
            .filter(area=post.area)
            .select_related("area", "created_by")
            .prefetch_related("tags")
            .order_by("-published_at", "-created_at")
        )[:3]

        return ctx


class ContactView(TemplateView):
    template_name = "contact/contact_site.html"
