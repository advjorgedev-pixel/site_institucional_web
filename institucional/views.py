from django.views.generic import TemplateView, ListView, DetailView
from django.utils import timezone
from django.shortcuts import get_object_or_404
from .models import BlogPost


class HomeView(TemplateView):
    template_name = "home/home_site.html"

class AboutView(TemplateView):
    template_name = "about/about_site.html"

class ServicesView(TemplateView):
    template_name = "services/services_site.html"

class BlogPostListView(ListView):
    model = BlogPost
    template_name = "blog/blog_list.html"
    context_object_name = "posts"
    paginate_by = 6

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
            for word in words:
                qs = qs.filter(title__icontains=word)

        return qs

    def get_context_data(self, **kwargs):
        ctx = super().get_context_data(**kwargs)
        ctx["q"] = (self.request.GET.get("q") or "").strip()
        ctx["area_selected"] = (self.request.GET.get("area") or "").strip()
        return ctx


class ContactView(TemplateView):
    template_name = "contact/contact_site.html"
