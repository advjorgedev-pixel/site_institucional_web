import os
import uuid

from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models
from django.urls import reverse
from django.utils import timezone
from django.utils.text import slugify


def blog_cover_upload_to(instance, filename: str) -> str:
    ext = filename.split(".")[-1].lower()
    return f"blog/covers/{instance.slug or uuid.uuid4()}.{ext}"


class Tag(models.Model):
    name = models.CharField(max_length=80, unique=True, verbose_name="Nome da tag")
    slug = models.SlugField(max_length=80, unique=True, blank=True, db_index=True, verbose_name="Slug")

    class Meta:
        verbose_name = "Tag"
        verbose_name_plural = "Tags"
        ordering = ["name"]

    def __str__(self) -> str:
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)[:80]
        super().save(*args, **kwargs)


class AreaOfPractice(models.Model):
    name = models.CharField(max_length=80, unique=True, verbose_name="Área de atuação")
    slug = models.SlugField(max_length=80, unique=True, blank=True, db_index=True, verbose_name="Slug")
    is_active = models.BooleanField(default=True, verbose_name="Ativa")
    order = models.PositiveIntegerField(default=0, db_index=True, verbose_name="Ordem")

    class Meta:
        verbose_name = "Área de atuação"
        verbose_name_plural = "Áreas de atuação"
        ordering = ["order", "name"]

    def __str__(self) -> str:
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)[:80]
        super().save(*args, **kwargs)


class BlogPost(models.Model):
    class Status(models.TextChoices):
        DRAFT = "draft", "Rascunho"
        PUBLISHED = "published", "Publicado"

    meta_title = models.CharField(max_length=60, blank=True, verbose_name="Meta title")
    meta_description = models.CharField(max_length=160, blank=True, verbose_name="Meta description")

    title = models.CharField(max_length=120, verbose_name="Título")
    slug = models.SlugField(max_length=80, unique=True, blank=True, db_index=True, verbose_name="Slug")

    cover = models.ImageField(
        upload_to=blog_cover_upload_to,
        blank=True,
        null=True,
        verbose_name="Imagem de capa",
    )

    summary = models.CharField(max_length=160, blank=True, verbose_name="Resumo")
    content = models.TextField(verbose_name="Conteúdo")

    tags = models.ManyToManyField(Tag, blank=True, related_name="posts", verbose_name="Tags")
    area = models.ForeignKey(
        AreaOfPractice,
        on_delete=models.PROTECT,
        related_name="posts",
        verbose_name="Área de atuação",
    )

    status = models.CharField(
        max_length=12,
        choices=Status.choices,
        default=Status.DRAFT,
        db_index=True,
        verbose_name="Status",
    )
    published_at = models.DateTimeField(blank=True, null=True, db_index=True, verbose_name="Publicado em")

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="blog_posts",
        verbose_name="Criado por",
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Criado em")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Atualizado em")

    class Meta:
        verbose_name = "Post do blog"
        verbose_name_plural = "Posts do blog"
        ordering = ["-published_at", "-created_at"]
        indexes = [
            models.Index(fields=["status", "-published_at"]),
        ]

    def __str__(self) -> str:
        return self.title

    def get_absolute_url(self):
        return reverse("blog_detail", kwargs={"slug": self.slug})

    @property
    def is_published(self) -> bool:
        return self.status == self.Status.PUBLISHED and (self.published_at or timezone.now()) <= timezone.now()

    def clean(self):
        super().clean()

        if self.cover:
            max_bytes = 2 * 1024 * 1024  # 2 MB
            if self.cover.size > max_bytes:
                raise ValidationError({"cover": "A imagem de capa deve ter no máximo 2 MB."})

            valid_ext = {".jpg", ".jpeg", ".png", ".webp"}
            name = (self.cover.name or "").lower()
            _, ext = os.path.splitext(name)
            if ext and ext not in valid_ext:
                raise ValidationError({"cover": "Formato inválido. Use JPG, PNG ou WEBP."})

        if self.status == self.Status.PUBLISHED and not self.published_at:
            self.published_at = timezone.now()

        # Defaults SEO
        if not self.meta_title:
            self.meta_title = self.title[:60]
        if not self.meta_description and self.summary:
            self.meta_description = self.summary[:160]

    def save(self, *args, **kwargs):
        if not self.slug:
            base = slugify(self.title)[:70] or str(uuid.uuid4())[:8]
            slug = base
            i = 2
            while BlogPost.objects.filter(slug=slug).exclude(pk=self.pk).exists():
                slug = f"{base}-{i}"
                i += 1
            self.slug = slug

        self.full_clean()

        old_cover_path = None
        if self.pk:
            old = BlogPost.objects.filter(pk=self.pk).only("cover").first()
            if old and old.cover and self.cover != old.cover:
                old_cover_path = getattr(old.cover, "path", None)

        super().save(*args, **kwargs)

        if old_cover_path and os.path.isfile(old_cover_path):
            os.remove(old_cover_path)

    def delete(self, *args, **kwargs):
        cover_path = getattr(self.cover, "path", None)
        super().delete(*args, **kwargs)
        if cover_path and os.path.isfile(cover_path):
            os.remove(cover_path)
