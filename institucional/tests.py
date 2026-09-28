from django.template.loader import render_to_string
from django.test import SimpleTestCase, override_settings
from django.urls import reverse


@override_settings(
    COMPRESS_ENABLED=False,
    COMPRESS_OFFLINE=False,
    SECURE_SSL_REDIRECT=False,
)
class LandingPageComponentTests(SimpleTestCase):
    def test_bank_page_uses_shared_components_and_assets(self):
        response = self.client.get(reverse("bank_law"))

        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "data-lp-help-card", count=5)
        self.assertContains(response, "data-step-number", count=3)
        self.assertContains(response, "data-lp-faq-item", count=7)
        self.assertContains(response, "img/lp/process-background.webp")
        self.assertContains(response, "img/lp/about-background.webp")
        self.assertContains(response, "/static/css/lp.css")
        self.assertContains(response, "/static/js/lp.js")
        self.assertNotContains(response, "lp_bank.css")
        self.assertNotContains(response, "lp_bank.js")

    def test_shared_components_accept_other_view_data(self):
        help_html = render_to_string("lp/components/_help.html", {
            "lp_help": {
                "title": "Outra atuação",
                "cards": [{
                    "icon": "document",
                    "title": "Serviço",
                    "description": "Descrição",
                    "details": ["Detalhe"],
                }],
            },
        })
        process_html = render_to_string("lp/components/_process.html", {
            "lp_process": {
                "title": "Etapas",
                "steps": [{"title": "Primeira etapa", "description": "Descrição"}],
            },
        })
        about_html = render_to_string("lp/components/_about.html", {
            "lp_about": {"title": "Sobre"},
        })
        faq_html = render_to_string("lp/components/_faq.html", {
            "lp_faq": {
                "title": "Perguntas",
                "items": [{"question": "Questão?", "answer": "Resposta."}],
            },
        })

        self.assertIn("Outra atuação", help_html)
        self.assertIn("Primeira etapa", process_html)
        self.assertIn("Sobre", about_html)
        self.assertNotIn("data-lp-document-modal", about_html)
        self.assertIn("Questão?", faq_html)
