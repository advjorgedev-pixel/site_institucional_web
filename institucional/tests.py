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
        self.assertNotContains(response, 'class="lp-process__number"')
        self.assertContains(response, "data-lp-faq-item", count=7)
        self.assertContains(response, "img/lp/process-background.webp")
        self.assertContains(response, "img/lp/about-background.webp")
        self.assertContains(response, "/static/css/lp.css")
        self.assertContains(response, "/static/js/lp.js")
        self.assertContains(response, "/static/css/aos.css")
        self.assertContains(response, "/static/js/aos.js")
        self.assertContains(response, "/static/js/animation_script.js")
        self.assertContains(response, 'class="lp-hero__content" data-aos="fade-up"')
        self.assertContains(response, 'class="lp-hero__highlight" data-aos="fade-up"', count=3)
        self.assertContains(response, 'class="col-12 col-md-6 col-lg-4 col-xl" data-aos="fade-up"', count=5)
        self.assertContains(response, 'class="lp-reviews__card" data-aos="fade-up"', count=3)
        self.assertContains(response, 'data-lp-faq-item data-aos="fade-up"', count=7)
        self.assertContains(response, "data-lp-calculator")
        self.assertContains(response, 'id="calculadora"')
        self.assertContains(response, "/static/css/calculator.css")
        self.assertContains(response, "/static/js/calculator.js")
        self.assertContains(response, "/static/data/lp/bank/25464.csv")
        self.assertContains(response, 'value="25450"')
        self.assertContains(response, "Arrendamento mercantil de veículos")
        self.assertContains(response, "data-calculator-step", count=3)
        self.assertContains(response, "data-calculator-progress", count=3)
        self.assertContains(response, 'type="month"')
        self.assertContains(response, "data-calculator-calendar")
        self.assertContains(response, "data-calendar-months")
        self.assertContains(response, "data-calendar-years")
        self.assertContains(response, "data-calendar-range")
        self.assertContains(response, 'aria-label="Escolha o mês do contrato"')
        self.assertContains(response, "data-result-gauss")
        self.assertContains(response, "data-result-sac")
        self.assertContains(response, "data-calculator-select-trigger")
        self.assertContains(response, "data-calculator-money", count=2)
        self.assertContains(response, "data-calculator-new")
        self.assertContains(response, "Fazer uma nova")
        self.assertContains(response, 'role="combobox"')
        self.assertContains(response, 'role="listbox"')
        self.assertNotContains(response, "data-result-chart")
        self.assertNotContains(response, "Evolução estimada do saldo devedor")
        self.assertNotContains(response, 'name="system"')
        self.assertNotContains(response, 'name="rate"')
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
