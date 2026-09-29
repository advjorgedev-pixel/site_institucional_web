from urllib.parse import quote

from django.conf import settings
from django.views.generic import TemplateView, ListView, DetailView
from django.utils.translation import gettext_lazy as _
from django.utils import timezone
from django.http import Http404, HttpResponse
from django.views.decorators.http import require_safe
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


@require_safe
def bank_calculator_rates(request, series):
    if series not in {25443, 25444, 25450, 25464, 25471}:
        raise Http404

    csv_path = settings.BASE_DIR / "institucional" / "data" / "lp" / "bank" / f"{series}.csv"
    if not csv_path.is_file():
        raise Http404

    response = HttpResponse(csv_path.read_bytes(), content_type="text/csv; charset=utf-8")
    response["X-Robots-Tag"] = "noindex"
    response["Cache-Control"] = "no-cache"
    return response


class BankLawView(TemplateView):
    template_name = "lp/bank.html"

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context["lp_brand_url"] = "#home"
        whatsapp_message = _(
            "Olá! Encontrei a página de Direito Bancário e gostaria de informações sobre atendimento."
        )
        context["lp_whatsapp_url"] = (
            f"https://wa.me/5548988366235?text={quote(str(whatsapp_message))}"
        )
        context["lp_hero"] = {
            "eyebrow": _("Direito Bancário · São José / SC"),
            "title": _("Direito bancário: contratos, cobranças e financiamentos"),
            "description": _("Informações sobre revisão de contratos, busca e apreensão, execuções bancárias e negociação de dívidas. Cada situação exige análise individual."),
            "primary_label": _("Contato com o advogado"),
            "primary_url": context["lp_whatsapp_url"],
            "primary_external": True,
            "primary_icon": "whatsapp",
            "secondary_label": _("Ver temas de atuação"),
            "secondary_url": "#atuacao",
            "highlights": [
                {"icon": "person", "title": _("Atendimento direto"), "detail": _("com o advogado")},
                {"icon": "shield", "title": _("Análise individual"), "detail": _("de cada situação")},
                {"icon": "scale", "title": _("OAB/SC 74.996"), "detail": _("Regularmente inscrito")},
            ],
        }
        context["lp_nav_items"] = [
            {"label": _("Home"), "url": "#home"},
            {"label": _("Atuação"), "url": "#atuacao"},
            {"label": _("Calculadora"), "url": "#calculadora"},
            {"label": _("Sobre"), "url": "#sobre"},
            {"label": _("Avaliações"), "url": "#avaliacoes"},
            {"label": _("FAQ"), "url": "#faq"},
        ]
        context["lp_meta_description"] = _(
            "Direito bancário em São José/SC: informações sobre contratos, financiamentos, busca e apreensão, cobranças e renegociação de dívidas."
        )
        context["lp_meta_title"] = _("Direito Bancário em São José/SC | Jorge R. Sarobe")
        context["lp_header_contact_label"] = _("Contato")
        context["lp_header_contact_aria"] = _("Contato com o advogado pelo WhatsApp")
        context["lp_footer_heading"] = _("Informações e contato")
        context["lp_footer_contact_description"] = _(
            "Jorge R. Sarobe, OAB/SC 74.996, atende em São José/SC. Entre em contato para informações sobre a análise do seu caso."
        )
        context["lp_cta"] = {
            "eyebrow": _("Contato"),
            "title": _("Dúvidas sobre um contrato bancário?"),
            "description": _("As informações desta página são gerais. A avaliação jurídica depende dos documentos e das circunstâncias do contrato."),
            "primary_label": _("Contato pelo WhatsApp"),
            "primary_url": context["lp_whatsapp_url"],
            "primary_external": True,
            "primary_icon": "whatsapp",
            "note": _("Jorge R. Sarobe · OAB/SC 74.996 · São José/SC"),
        }
        context["lp_help"] = {
            "id": "atuacao",
            "eyebrow": _("Direito Bancário"),
            "title": _("Temas de atuação em Direito Bancário"),
            "description": _("A atuação depende dos documentos, da modalidade contratual e das circunstâncias de cada caso."),
            "cards": [
                {
                    "icon": "document",
                    "title": _("Revisão de empréstimos e financiamentos"),
                    "description": _("Análise de juros, encargos, CET, tarifas, seguros, capitalização e evolução da dívida."),
                    "details": [
                        _("Pode abranger financiamento de veículos, empréstimos pessoais e contratos empresariais."),
                        _("A revisão depende do contrato, do histórico de pagamentos e da análise jurídica."),
                    ],
                },
                {
                    "icon": "car",
                    "title": _("Defesa em busca e apreensão de veículos"),
                    "description": _("Atuação em ações ligadas a financiamento com alienação fiduciária."),
                    "details": [
                        _("Análise do contrato, da mora e da notificação."),
                        _("Conferência dos encargos cobrados e das circunstâncias da ação."),
                    ],
                },
                {
                    "icon": "gavel",
                    "title": _("Defesa em cobranças e execuções bancárias"),
                    "description": _("Defesa de pessoas físicas e empresas em ações de cobrança e execução."),
                    "details": [
                        _("Análise de CCB, empréstimos, capital de giro, cheque especial e outras dívidas bancárias."),
                        _("Avaliação do título, dos valores exigidos, dos prazos e das possibilidades de defesa."),
                    ],
                },
                {
                    "icon": "handshake",
                    "title": _("Negociação e renegociação de dívidas bancárias"),
                    "description": _("Análise do débito e das condições propostas para pessoas e empresas."),
                    "details": [
                        _("Atuação extrajudicial ou judicial, conforme as circunstâncias."),
                        _("Avaliação de quitação, parcelamento e revisão das condições da dívida."),
                    ],
                },
                {
                    "icon": "chart",
                    "title": _("Juros abusivos e revisão de contratos bancários"),
                    "description": _("Análise técnica das taxas e dos encargos aplicados ao contrato."),
                    "details": [
                        _("Comparação com parâmetros do Banco Central, quando juridicamente pertinentes."),
                        _("Taxa acima da média, isoladamente, não define abusividade."),
                    ],
                },
            ],
        }
        context["lp_process"] = {
            "id": "processo",
            "title": _("Como ocorre"),
            "highlight": _("a análise jurídica"),
            "description": _("A orientação considera os documentos disponíveis, a legislação e as particularidades do contrato."),
            "button_label": _("Informações de contato"),
            "button_url": context["lp_whatsapp_url"],
            "button_external": True,
            "background_image": "img/lp/process-background.webp",
            "steps": [
                {
                    "icon": "document",
                    "title": _("Você apresenta o contrato"),
                    "description": _("Relato da situação e apresentação dos documentos disponíveis."),
                },
                {
                    "icon": "search",
                    "title": _("Análise de taxas, encargos e documentos"),
                    "description": _("Exame do contrato, das cobranças e dos documentos pertinentes."),
                },
                {
                    "icon": "document",
                    "title": _("Orientação sobre caminhos possíveis"),
                    "description": _("Esclarecimento das possibilidades e dos riscos identificados."),
                },
            ],
        }
        context["lp_about"] = {
            "id": "sobre",
            "eyebrow": _("Sobre o advogado"),
            "title": _("Jorge R. Sarobe: formação e atuação em Direito Bancário"),
            "description": _(
                "Advogado inscrito na OAB/SC sob o nº 74.996, com atendimento em São José/SC. Formação em Direito Bancário documentada abaixo."
            ),
            "background_image": "img/lp/about-background.webp",
            "photo": "img/photos/jorge_com_fundo.webp",
            "photo_alt": _("Jorge R. Sarobe em seu escritório"),
            "name": "Jorge R. Sarobe",
            "registration": _("OAB/SC 74.996"),
            "credentials": [
                {
                    "icon": "graduation",
                    "title": _("Graduação em Direito"),
                    "description": _("Graduado pela Universidade Estácio de Sá (2020)"),
                },
                {
                    "icon": "book",
                    "title": _("Formação em Direito Bancário"),
                    "description": _("Pós-graduação em Direito Bancário e certificado ESA em Direito Bancário na Prática"),
                },
                {
                    "icon": "people",
                    "title": _("Atuação institucional"),
                    "description": _("Integrante da Comissão de Direito Bancário da OAB/SC — Subseção São José"),
                },
                {
                    "icon": "court",
                    "title": _("Experiência prática"),
                    "description": _("Ex-conciliador judicial no Fórum de São José/SC"),
                },
            ],
            "quote": {
                "text": _(
                    "Meu compromisso é oferecer um atendimento jurídico claro, ético e técnico, sempre com foco na análise responsável de cada caso."
                ),
                "author": "Jorge R. Sarobe",
                "registration": _("OAB/SC 74.996"),
            },
            "documents_label": _("Documentos de formação em Direito Bancário"),
            "modal_title": _("Documento de Direito Bancário"),
            "documents": [
                {
                    "path": "doc/Diploma Direito Bancário.pdf",
                    "label": _("Ver diploma de Direito Bancário"),
                    "caption": _("Visualizar PDF"),
                },
                {
                    "path": "doc/Certificado ESA Direito Bancario.pdf",
                    "label": _("Ver certificado ESA: Direito Bancário na Prática"),
                    "caption": _("Visualizar PDF"),
                },
            ],
        }
        context["lp_faq"] = {
            "id": "faq",
            "eyebrow": "FAQ",
            "title": _("Dúvidas frequentes"),
            "description": _("Respostas gerais sobre contratos, cobranças e atendimento. A análise de cada caso depende dos documentos."),
            "items": [
                {
                    "question": _("O que pode ser analisado em um contrato bancário?"),
                    "answer": _(
                        "Podem ser examinados juros, encargos, CET, tarifas, seguros, capitalização e evolução da dívida, conforme a modalidade e os documentos disponíveis. A análise não implica revisão automática do contrato."
                    ),
                },
                {
                    "question": _("Quais documentos ajudam na análise?"),
                    "answer": _(
                        "Contrato, extratos, comprovantes de pagamento, planilhas e comunicações do banco costumam ser úteis. Em processos judiciais, também são importantes a petição e as intimações recebidas."
                    ),
                },
                {
                    "question": _("Taxa acima da média do Banco Central é abusiva?"),
                    "answer": _(
                        "Não necessariamente. As séries do Banco Central são referências estatísticas, não limites legais automáticos. A avaliação jurídica considera a modalidade, a época da contratação, as cláusulas e as circunstâncias do caso."
                    ),
                    "open": True,
                },
                {
                    "question": _("O que é examinado em busca e apreensão de veículo?"),
                    "answer": _(
                        "Em financiamentos com alienação fiduciária, podem ser examinados o contrato, a mora, a notificação, os encargos cobrados e os documentos do processo. Os prazos judiciais exigem atenção individual."
                    ),
                },
                {
                    "question": _("Como funciona a defesa em cobrança ou execução bancária?"),
                    "answer": _(
                        "O advogado examina o título, a dívida exigida, os documentos e os prazos processuais. A atuação pode envolver CCB, empréstimos, capital de giro e cheque especial, conforme o caso."
                    ),
                },
                {
                    "question": _("É possível negociar uma dívida bancária?"),
                    "answer": _(
                        "Podem ser avaliadas propostas de renegociação, quitação ou parcelamento, pela via extrajudicial ou judicial. As condições dependem do contrato, do débito e da negociação com a instituição financeira."
                    ),
                },
                {
                    "question": _("Como obter informações sobre atendimento e honorários?"),
                    "answer": _(
                        "O contato pode ser feito pelo WhatsApp. As condições da consulta e dos honorários são informadas antes de eventual contratação, conforme o serviço necessário."
                    ),
                },
            ],
        }
        return context
