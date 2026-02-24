from django.urls import path
from . import views


urlpatterns = [
    path('', views.HomeView.as_view(), name='home'),
    path('sobre/', views.AboutView.as_view(), name='about'),
    path('especialidades/', views.ServicesView.as_view(), name='services'),
    path('contato/', views.ContactView.as_view(), name='contact'),
    path('atualizacoes/', views.BlogPostListView.as_view(), name='blog_list'),
    path("atualizacoes/<slug:slug>/", views.BlogPostDetailView.as_view(), name="blog_detail"),
]