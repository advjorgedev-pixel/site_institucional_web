# admin.py
from django.contrib import admin

from .models import AreaOfPractice, BlogPost, Tag


@admin.register(Tag)
class TagAdmin(admin.ModelAdmin):
    list_display = ("name", "slug")
    search_fields = ("name", "slug")
    prepopulated_fields = {"slug": ("name",)}
    ordering = ("name",)


@admin.register(AreaOfPractice)
class AreaOfPracticeAdmin(admin.ModelAdmin):
    list_display = ("name", "slug", "is_active", "order")
    list_filter = ("is_active",)
    list_editable = ("is_active", "order")
    search_fields = ("name", "slug")
    prepopulated_fields = {"slug": ("name",)}
    ordering = ("order", "name")


@admin.register(BlogPost)
class BlogPostAdmin(admin.ModelAdmin):
    list_display = ("title_pt", "area", "status", "published_at", "created_at", "created_by")
    list_filter = ("status", "area", "tags", "created_at")
    search_fields = (
        "title_pt", "title_es",
        "summary_pt", "summary_es",
        "content_pt", "content_es",
        "meta_title_pt", "meta_title_es",
        "meta_description_pt", "meta_description_es",
        "slug",
    )
    autocomplete_fields = ("area", "tags", "created_by")
    readonly_fields = ("created_at", "updated_at")
    date_hierarchy = "published_at"
    ordering = ("-published_at", "-created_at")

    fieldsets = (
        ("Conteúdo (PT-BR)", {"fields": ("title_pt", "summary_pt", "content_pt")}),
        ("Conteúdo (ES)", {"fields": ("title_es", "summary_es", "content_es")}),
        ("Mídia", {"fields": ("cover",)}),
        ("Classificação", {"fields": ("area", "tags", "status", "published_at")}),
        ("SEO (PT-BR)", {"fields": ("meta_title_pt", "meta_description_pt")}),
        ("SEO (ES)", {"fields": ("meta_title_es", "meta_description_es")}),
        ("URL", {"fields": ("slug",)}),
        ("Auditoria", {"fields": ("created_by", "created_at", "updated_at")}),
    )

    def save_model(self, request, obj, form, change):
        if not change and not obj.created_by_id:
            obj.created_by = request.user
        super().save_model(request, obj, form, change)
