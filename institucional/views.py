from urllib.parse import quote

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


class BankLawView(TemplateView):
    template_name = "lp/bank.html"

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context["lp_brand_url"] = "#home"
        whatsapp_message = _(
            "Olá! Vim pela página de Direito Bancário e gostaria de analisar meu caso."
        )
        context["lp_whatsapp_url"] = (
            f"https://wa.me/5548988366235?text={quote(str(whatsapp_message))}"
        )
        context["lp_hero"] = {
            "eyebrow": _("Direito Bancário · São José / SC"),
            "title": _("Entenda seus direitos nas relações com bancos."),
            "description": _("Análise jurídica clara de contratos, cobranças e dívidas bancárias."),
            "primary_label": _("Solicitar análise do meu caso"),
            "primary_url": context["lp_whatsapp_url"],
            "primary_external": True,
            "primary_icon": "whatsapp",
            "secondary_label": _("Conhecer áreas de atuação"),
            "secondary_url": "#atuacao",
            "highlights": [
                {"icon": "person", "title": _("Atendimento direto"), "detail": _("com o advogado")},
                {"icon": "shield", "title": _("Estratégia e clareza"), "detail": _("em todas as etapas")},
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
        context["lp_help"] = {
            "id": "atuacao",
            "eyebrow": _("Como posso ajudar"),
            "title": _("Atuação em diferentes situações bancárias"),
            "description": _("Análise técnica e orientação jurídica para pessoas físicas e jurídicas."),
            "cards": [
                {
                    "icon": "document",
                    "title": _("Revisão de empréstimos e financiamentos"),
                    "description": _("Análise de contrato, CET, tarifas, seguros e evolução da dívida."),
                    "details": [
                        _("Conferência das cláusulas e dos encargos previstos no contrato."),
                        _("Levantamento dos pagamentos, do saldo e dos documentos relevantes."),
                    ],
                },
                {
                    "icon": "car",
                    "title": _("Busca e apreensão de veículos"),
                    "description": _("Análise de contrato, mora, notificação e encargos."),
                    "details": [
                        _("Verificação da notificação e da constituição em mora."),
                        _("Conferência dos valores cobrados e do histórico do financiamento."),
                    ],
                },
                {
                    "icon": "gavel",
                    "title": _("Cobranças e execuções bancárias"),
                    "description": _("Defesa de pessoas físicas e jurídicas em cobranças e execuções."),
                    "details": [
                        _("Análise do processo, dos títulos e dos valores exigidos."),
                        _("Avaliação de prazos, garantias e possibilidades de defesa."),
                    ],
                },
                {
                    "icon": "handshake",
                    "title": _("Negociação de dívidas bancárias"),
                    "description": _("Análise da situação e alternativas de renegociação."),
                    "details": [
                        _("Mapeamento do saldo, dos contratos e da capacidade de pagamento."),
                        _("Avaliação das propostas e condições de quitação ou parcelamento."),
                    ],
                },
                {
                    "icon": "chart",
                    "title": _("Juros e revisão de contratos"),
                    "description": _("Avaliação de taxas e encargos conforme o caso concreto."),
                    "details": [
                        _("Conferência de taxas, indexadores e encargos previstos."),
                        _("Comparação entre o contrato e as cobranças realizadas."),
                    ],
                },
            ],
        }
        context["lp_process"] = {
            "id": "processo",
            "title": _("Como funciona"),
            "highlight": _("a análise"),
            "description": _("Um processo simples, com foco na clareza e na sua segurança jurídica."),
            "button_label": _("Conversar sobre meu caso"),
            "button_url": context["lp_whatsapp_url"],
            "button_external": True,
            "background_image": "img/lp/process-background.webp",
            "steps": [
                {
                    "icon": "document",
                    "title": _("Você apresenta o contrato"),
                    "description": _("Envio dos documentos para análise inicial."),
                },
                {
                    "icon": "search",
                    "title": _("Análise de taxas, encargos e documentos"),
                    "description": _("Estudo técnico da situação com base na legislação."),
                },
                {
                    "icon": "document",
                    "title": _("Orientação sobre caminhos possíveis"),
                    "description": _("Explicação clara das alternativas jurídicas para o seu caso."),
                },
            ],
        }
        context["lp_about"] = {
            "id": "sobre",
            "eyebrow": _("Sobre o advogado"),
            "title": _("Atendimento jurídico com experiência prática"),
            "description": _(
                "Compromisso com um atendimento próximo, análise técnica e orientação clara em todas as etapas."
            ),
            "background_image": "img/lp/about-background.webp",
            "photo": "img/photos/jorge_com_fundo.webp",
            "photo_alt": _("Jorge R. Sarobe em seu escritório"),
            "name": "Jorge R. Sarobe",
            "registration": _("OAB/SC 74.996"),
            "credentials": [
                {
                    "icon": "graduation",
                    "title": _("Formação sólida"),
                    "description": _("Graduado pela Universidade Estácio de Sá (2020)"),
                },
                {
                    "icon": "book",
                    "title": _("Especialização"),
                    "description": _("Pós-graduação em Direito Bancário"),
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
            "description": _(
                "Reunimos as principais perguntas para esclarecer o processo de análise e atendimento."
            ),
            "items": [
                {
                    "question": _("Como funciona a análise do meu caso?"),
                    "answer": _(
                        "Você apresenta sua situação e os documentos disponíveis. O advogado avalia os pontos relevantes e explica as possibilidades, os riscos e os próximos passos conforme o caso."
                    ),
                },
                {
                    "question": _("Quais documentos preciso enviar?"),
                    "answer": _(
                        "Contratos, extratos, comprovantes de pagamento e comunicações do banco costumam ajudar. Se faltar algum documento, você receberá orientação sobre o que reunir."
                    ),
                },
                {
                    "question": _("Quanto tempo leva para receber a análise?"),
                    "answer": _(
                        "O prazo depende da complexidade da situação e do recebimento dos documentos necessários. Após o primeiro contato, informamos uma previsão de retorno para o seu caso."
                    ),
                    "open": True,
                },
                {
                    "question": _("A consulta é paga?"),
                    "answer": _(
                        "As condições da consulta e dos honorários são informadas antes da contratação, de acordo com o atendimento e o serviço necessários."
                    ),
                },
                {
                    "question": _("Vocês atuam em todo o Brasil?"),
                    "answer": _(
                        "O atendimento pode ocorrer online. A possibilidade de atuação em outras localidades é avaliada conforme a demanda e a localidade envolvida."
                    ),
                },
                {
                    "question": _("Quais são as áreas de atuação?"),
                    "answer": _(
                        "Em Direito Bancário, a atuação inclui análise de contratos, busca e apreensão de veículos, cobranças, negociações de dívidas e revisão de encargos, conforme a situação apresentada."
                    ),
                },
                {
                    "question": _("Como faço para iniciar o atendimento?"),
                    "answer": _(
                        "Entre em contato pelo WhatsApp, explique brevemente o caso e informe quais documentos possui. Você receberá orientação sobre os próximos passos."
                    ),
                },
            ],
        }
        return context
