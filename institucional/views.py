from django.views.generic import TemplateView, ListView, DetailView
from django.db.models import Count
from django.shortcuts import get_object_or_404
from . import models


class HomeView(TemplateView):
    template_name = "home/home_site.html"

class AboutView(TemplateView):
    template_name = "about/about_site.html"
