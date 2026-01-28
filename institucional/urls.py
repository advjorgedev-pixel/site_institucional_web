from django.urls import path
from . import views

urlpatterns = [
    path('', views.HomeView.as_view(), name='home'),
    path('sobre/', views.AboutView.as_view(), name='about'),
]