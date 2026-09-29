(function () {
    "use strict";

    const calculator = document.querySelector("[data-lp-calculator]");
    if (!calculator) return;
    const isSpanish = document.documentElement.lang.toLowerCase().startsWith("es");
    const copy = isSpanish ? {
        invalidRates: "La serie de tasas seleccionada no es válida.", noRates: "No hay tasas válidas para esta modalidad.",
        loadRates: "No se pudo cargar la base del Banco Central.", noMonths: "No hay meses disponibles para esta modalidad en el período común de las series.",
        chooseMonth: "Elija el mes", availableMonths: (first, last) => `Meses disponibles: ${first} a ${last}.`,
        chooseModality: "Seleccione una modalidad", chooseContract: "Seleccione la modalidad del contrato para continuar.",
        chooseAvailableMonth: "Seleccione uno de los meses disponibles en el calendario.", principal: "Indique un importe financiado mayor que cero.",
        terms: "Indique entre 1 y 600 cuotas.", payment: "Indique el importe de una cuota mayor que cero.",
        paymentLow: "La cuota indicada es menor que el importe financiado dividido por el número de cuotas. Revise los datos.",
        inferredRate: "No se pudo estimar la tasa a partir de las cuotas bajo la hipótesis Price. Revise los importes indicados.",
        missingRate: (month) => `No hay una tasa del Banco Central para ${month} en esta modalidad. Seleccione otro mes disponible.`,
        resultHeading: "Resultado de la simulación", resultIntro: "La tasa se estimó automáticamente a partir de los importes indicados.",
        highDifference: "Diferencia considerable respecto a la media del Banco Central · requiere análisis",
        aboveAverage: "Por encima de la media del Banco Central · requiere análisis",
        withinAverage: "La comparación de tasas no indica una diferencia superior a la media",
        source: (series, date, last) => `Fuente: serie BCB/SGS ${series}, ${date}. Datos disponibles hasta ${last}.`,
        comparison: (payment, total, difference) => `Bajo la hipótesis Price con la media del Banco Central, la cuota sería ${payment} y el total ${total}. Diferencia estimada: ${difference}.`,
        noAlternative: "No es posible estimar con esta cuota y plazo.",
        alternative: (rate, total, average) => `Tasa estimada: ${rate}% mensual; total: ${total}. Con la media del Banco Central: ${average}.`,
        calculatorError: "No se pudo calcular ahora. Inténtelo de nuevo.", calendarHint: "Elija un mes con una tasa disponible del Banco Central.",
        loadingMonths: "Cargando meses...", rateError: "No se pudieron consultar las tasas. Inténtelo de nuevo.",
        whatsapp: (details, principal, payment, rate, average) => `Hola. Utilicé la calculadora bancaria y quisiera información sobre el análisis de mi contrato. Modalidad: ${details.person} - ${details.modality}. Mes del contrato: ${details.date}. Importe financiado: ${principal}. ${details.terms} cuotas; cuota indicada: ${payment}. Bajo la hipótesis Price, tasa estimada: ${rate}% mensual; media del Banco Central: ${average}% mensual. Entiendo que el sistema real y la valoración jurídica dependen del contrato.`,
    } : {
        invalidRates: "A base de taxas selecionada é inválida.", noRates: "Não há taxas válidas para esta modalidade.",
        loadRates: "Não foi possível carregar a base do Banco Central.", noMonths: "Não há meses disponíveis para esta modalidade na faixa comum das séries.",
        chooseMonth: "Escolha o mês", availableMonths: (first, last) => `Meses disponíveis: ${first} a ${last}.`,
        chooseModality: "Selecione uma modalidade", chooseContract: "Selecione a modalidade do contrato para continuar.",
        chooseAvailableMonth: "Selecione um dos meses disponíveis no calendário.", principal: "Informe um valor financiado maior que zero.",
        terms: "Informe uma quantidade entre 1 e 600 parcelas.", payment: "Informe o valor de uma parcela maior que zero.",
        paymentLow: "A parcela informada é menor que o valor financiado dividido pelo número de parcelas. Confira os dados.",
        inferredRate: "Não foi possível estimar a taxa pelas parcelas na hipótese Price. Confira os valores informados.",
        missingRate: (month) => `Não há taxa BCB para ${month} nesta modalidade. Selecione outro mês disponível no calendário.`,
        resultHeading: "Resultado da simulação", resultIntro: "A taxa foi estimada automaticamente a partir dos valores informados.",
        highDifference: "Diferença expressiva em relação à média BCB · requer análise",
        aboveAverage: "Acima da média BCB · requer análise", withinAverage: "Comparação de taxas sem diferença acima da média",
        source: (series, date, last) => `Fonte: série BCB/SGS ${series}, ${date}. Base estática atualizada até ${last}.`,
        comparison: (payment, total, difference) => `Na hipótese Price com a média BCB, a parcela seria ${payment} e o total ${total}. Diferença estimada: ${difference}.`,
        noAlternative: "Não é possível estimar com esta parcela e prazo.",
        alternative: (rate, total, average) => `Taxa estimada: ${rate}% a.m.; total: ${total}. Com a média BCB: ${average}.`,
        calculatorError: "Não foi possível calcular agora. Tente novamente.", calendarHint: "Escolha um mês com taxa disponível no Banco Central.",
        loadingMonths: "Carregando meses...", rateError: "Não foi possível consultar as taxas agora. Tente novamente.",
        whatsapp: (details, principal, payment, rate, average) => `Olá! Usei a calculadora bancária e gostaria de informações sobre a análise do meu contrato. Modalidade: ${details.person} - ${details.modality}. Mês do financiamento: ${details.date}. Valor financiado: ${principal}. ${details.terms} parcelas; parcela informada: ${payment}. Na hipótese Price, taxa estimada: ${rate}% a.m.; média BCB: ${average}% a.m. Sei que o sistema real e a avaliação jurídica dependem da análise do contrato.`,
    };

    const form = calculator.querySelector("[data-calculator-form]");
    const modalityField = form.elements.modality;
    const dateField = form.elements.date;
    const pjSeriesNote = calculator.querySelector("[data-pj-series-note]");
    const errorBox = calculator.querySelector("[data-calculator-error]");
    const resultContent = calculator.querySelector("[data-result-content]");
    const resultHeading = calculator.querySelector("[data-result-heading]");
    const resultIntro = calculator.querySelector("[data-result-intro]");
    const resultStatus = calculator.querySelector("[data-result-status]");
    const selectShell = calculator.querySelector("[data-calculator-select]");
    const selectTrigger = calculator.querySelector("[data-calculator-select-trigger]");
    const selectValue = calculator.querySelector("[data-calculator-select-value]");
    const selectList = calculator.querySelector("[data-calculator-select-options]");
    const calendarShell = calculator.querySelector("[data-calculator-calendar]");
    const calendarTrigger = calculator.querySelector("[data-calendar-trigger]");
    const calendarValue = calculator.querySelector("[data-calendar-value]");
    const calendarPanel = calculator.querySelector("[data-calendar-panel]");
    const calendarRange = calculator.querySelector("[data-calendar-range]");
    const calendarPrevious = calculator.querySelector("[data-calendar-prev]");
    const calendarNext = calculator.querySelector("[data-calendar-next]");
    const calendarYearToggle = calculator.querySelector("[data-calendar-year-toggle]");
    const calendarMonths = calculator.querySelector("[data-calendar-months]");
    const calendarYears = calculator.querySelector("[data-calendar-years]");
    const steps = Array.from(calculator.querySelectorAll("[data-calculator-step]"));
    const progressItems = Array.from(calculator.querySelectorAll("[data-calculator-progress]"));
    const backButton = calculator.querySelector("[data-calculator-back]");
    const nextButton = calculator.querySelector("[data-calculator-next]");
    const initialNextButtonText = nextButton.textContent;
    const submitButton = calculator.querySelector("[data-calculator-submit]");
    const newButton = calculator.querySelector("[data-calculator-new]");
    const moneyFields = Array.from(calculator.querySelectorAll("[data-calculator-money]"));
    const rateCache = new Map();
    let currentStep = 0;
    let interactionVersion = 0;
    let hasResult = false;
    let calendarAvailability = null;
    let calendarViewYear = null;
    const initialResultHeading = resultHeading.textContent;
    const initialResultIntro = resultIntro.textContent;
    const currency = new Intl.NumberFormat(isSpanish ? "es-ES" : "pt-BR", { style: "currency", currency: "BRL" });
    const moneyInputFormat = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const percent = new Intl.NumberFormat(isSpanish ? "es-ES" : "pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const monthNames = { jan: 1, fev: 2, mar: 3, abr: 4, mai: 5, jun: 6, jul: 7, ago: 8, set: 9, out: 10, nov: 11, dez: 12 };
    const calendarMonthNames = isSpanish
        ? ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"]
        : ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

    function parseDecimal(value) {
        let normalized = String(value).trim().replace(/\s|R\$/g, "");
        if (normalized.includes(",")) {
            normalized = normalized.replace(/\./g, "").replace(",", ".");
        } else if (/^\d{1,3}(\.\d{3})+$/.test(normalized)) {
            normalized = normalized.replace(/\./g, "");
        }
        if (!/^\d+(?:\.\d+)?$/.test(normalized)) return NaN;
        return Number(normalized);
    }

    function normalizeMoneyDigits(value) {
        return String(value).replace(/\D/g, "").slice(0, 15).replace(/^0+(?=\d)/, "");
    }

    function formatMoneyDigits(digits) {
        return digits ? moneyInputFormat.format(Number(digits) / 100) : "";
    }

    function attachMoneyMask(field) {
        const initialAmount = parseDecimal(field.value);
        let previousDigits = Number.isFinite(initialAmount) && initialAmount >= 0
            ? normalizeMoneyDigits(String(Math.round(initialAmount * 100))) : "";
        field.value = formatMoneyDigits(previousDigits);
        let previousFormatted = field.value;

        field.addEventListener("input", (event) => {
            let digits = normalizeMoneyDigits(field.value);
            const deleting = event.inputType?.startsWith("delete") || field.value.length < previousFormatted.length;
            if (deleting && digits === previousDigits) digits = digits.slice(0, -1);
            field.value = formatMoneyDigits(digits);
            previousDigits = digits;
            previousFormatted = field.value;
            field.setSelectionRange(field.value.length, field.value.length);
        });

        field.addEventListener("paste", (event) => {
            const amount = parseDecimal(event.clipboardData.getData("text"));
            const cents = Math.round(amount * 100);
            if (!Number.isFinite(amount) || amount < 0 || !Number.isSafeInteger(cents) || String(cents).length > 15) {
                event.preventDefault();
                return;
            }
            event.preventDefault();
            previousDigits = normalizeMoneyDigits(String(cents));
            field.value = formatMoneyDigits(previousDigits);
            previousFormatted = field.value;
            field.dispatchEvent(new Event("input", { bubbles: true }));
        });

        return () => {
            previousDigits = "";
            previousFormatted = "";
            field.value = "";
        };
    }

    function paymentFor(principal, terms, rate, system) {
        if (system === "sac") return principal / terms + principal * rate;
        if (system === "gauss") {
            return principal * (1 + rate * terms) / (terms * (1 + rate * (terms - 1) / 2));
        }
        return rate === 0 ? principal / terms : principal * rate / (1 - Math.pow(1 + rate, -terms));
    }

    function inferRate(principal, terms, payment, system) {
        const minimum = principal / terms;
        if (payment < minimum - 0.01) return NaN;
        if (Math.abs(payment - minimum) < 0.01) return 0;
        if (system === "sac") return (payment - minimum) / principal;
        let low = 0;
        let high = 1;
        while (paymentFor(principal, terms, high, system) < payment && high < 100) high *= 2;
        if (paymentFor(principal, terms, high, system) < payment) return NaN;
        for (let index = 0; index < 100; index += 1) {
            const middle = (low + high) / 2;
            if (paymentFor(principal, terms, middle, system) < payment) low = middle;
            else high = middle;
        }
        return (low + high) / 2;
    }

    function simulate(principal, terms, rate, system) {
        const firstPayment = paymentFor(principal, terms, rate, system);
        let total = 0;
        let balance = principal;

        for (let number = 1; number <= terms; number += 1) {
            let payment;
            if (system === "sac") {
                const amortization = number === terms ? balance : principal / terms;
                payment = amortization + balance * rate;
                balance = Math.max(0, balance - amortization);
            } else if (system === "gauss") {
                payment = firstPayment;
            } else {
                payment = number === terms ? balance * (1 + rate) : firstPayment;
                balance = Math.max(0, balance * (1 + rate) - payment);
            }
            total += payment;
        }

        return { firstPayment, total, interest: Math.max(0, total - principal) };
    }

    function parseRates(csv, series) {
        const lines = csv.trim().split(/\r?\n/);
        if (!lines[0] || !lines[0].includes(series)) throw new Error(copy.invalidRates);
        const rates = new Map();
        for (const line of lines.slice(1)) {
            const match = /^([a-z]{3})\/(\d{2});(\d+(?:,\d+)?)$/.exec(line.trim());
            if (!match || !monthNames[match[1]]) continue;
            const year = 2000 + Number(match[2]);
            const month = String(monthNames[match[1]]).padStart(2, "0");
            const key = `${year}-${month}`;
            rates.set(key, Number(match[3].replace(",", ".")) / 100);
        }
        if (!rates.size) throw new Error(copy.noRates);
        const labels = Array.from(rates.keys()).sort();
        return { rates, first: labels[0], last: labels[labels.length - 1] };
    }

    async function getRates(series, url) {
        if (!rateCache.has(series)) {
            const request = fetch(url, { cache: "no-cache" })
                .then((response) => {
                    if (!response.ok) throw new Error(copy.loadRates);
                    return response.text();
                })
                .then((csv) => parseRates(csv, series));
            rateCache.set(series, request);
        }
        try {
            return await rateCache.get(series);
        } catch (error) {
            rateCache.delete(series);
            throw error;
        }
    }

    function formatMonth(key) {
        const [year, month] = key.split("-");
        return `${month}/${year}`;
    }

    function clearResult() {
        interactionVersion += 1;
        hasResult = false;
        resultContent.hidden = true;
        resultHeading.textContent = initialResultHeading;
        resultIntro.textContent = initialResultIntro;
        resultStatus.textContent = "";
        resultStatus.className = "lp-calculator__status";
        for (const selector of [
            "[data-result-rate]", "[data-result-average]", "[data-result-difference]",
            "[data-result-source]", "[data-result-payment]", "[data-result-total]",
            "[data-result-interest]", "[data-result-comparison]", "[data-result-gauss]",
            "[data-result-sac]",
        ]) {
            calculator.querySelector(selector).textContent = "";
        }
        calculator.querySelector(".lp-calculator__alternatives").open = false;
        calculator.querySelector("[data-result-whatsapp]").href = calculator.dataset.whatsappUrl;
        submitButton.hidden = currentStep !== steps.length - 1;
        newButton.hidden = true;
        errorBox.hidden = true;
    }

    const nativeOptions = Array.from(modalityField.options).filter((option) => option.value);
    const customOptions = [];
    let activeOptionIndex = -1;
    let typedSearch = "";
    let searchTimer;

    function formatCalendarMonth(key) {
        const [year, month] = key.split("-");
        return `${calendarMonthNames[Number(month) - 1]} de ${year}`;
    }

    function getCalendarAvailability(datasets, selectedIndex) {
        const commonStart = datasets.map((data) => data.first).sort().at(-1);
        const today = new Date();
        const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
        const months = Array.from(datasets[selectedIndex].rates.keys())
            .filter((month) => month >= commonStart && month <= currentMonth)
            .sort();
        if (!months.length) throw new Error(copy.noMonths);
        return {
            months: new Set(months),
            years: Array.from(new Set(months.map((month) => Number(month.slice(0, 4))))),
            first: months[0],
            last: months[months.length - 1],
        };
    }

    async function loadCalendarAvailability() {
        rateCache.clear();
        const datasets = await Promise.all(nativeOptions.map((option) => getRates(option.value, option.dataset.ratesUrl)));
        const selectedIndex = nativeOptions.findIndex((option) => option.value === modalityField.value);
        return getCalendarAvailability(datasets, selectedIndex);
    }

    function syncCalendarValue() {
        calendarValue.textContent = dateField.value ? formatCalendarMonth(dateField.value) : copy.chooseMonth;
        if (dateField.value) calendarTrigger.removeAttribute("aria-invalid");
    }

    function renderCalendar() {
        if (!calendarAvailability) return;
        const years = calendarAvailability.years;
        if (!years.includes(calendarViewYear)) calendarViewYear = years[years.length - 1];
        const yearIndex = years.indexOf(calendarViewYear);
        calendarYearToggle.textContent = String(calendarViewYear);
        calendarPrevious.disabled = yearIndex === 0;
        calendarNext.disabled = yearIndex === years.length - 1;
        calendarMonths.replaceChildren();

        calendarMonthNames.forEach((name, index) => {
            const key = `${calendarViewYear}-${String(index + 1).padStart(2, "0")}`;
            const button = document.createElement("button");
            button.type = "button";
            button.textContent = name.slice(0, 3);
            button.setAttribute("aria-label", `${name} de ${calendarViewYear}`);
            button.setAttribute("aria-pressed", String(dateField.value === key));
            button.disabled = !calendarAvailability.months.has(key);
            button.addEventListener("click", () => {
                dateField.value = key;
                dateField.dispatchEvent(new Event("change", { bubbles: true }));
                syncCalendarValue();
                closeCalendar(true);
            });
            calendarMonths.appendChild(button);
        });

        calendarYears.replaceChildren();
        years.forEach((year) => {
            const button = document.createElement("button");
            button.type = "button";
            button.textContent = String(year);
            button.setAttribute("aria-pressed", String(year === calendarViewYear));
            button.addEventListener("click", () => {
                calendarViewYear = year;
                calendarYears.hidden = true;
                calendarMonths.hidden = false;
                calendarYearToggle.setAttribute("aria-expanded", "false");
                renderCalendar();
                calendarYearToggle.focus();
            });
            calendarYears.appendChild(button);
        });
    }

    function setCalendarAvailability(availability) {
        calendarAvailability = availability;
        if (!availability.months.has(dateField.value)) dateField.value = "";
        calendarViewYear = Number((dateField.value || availability.last).slice(0, 4));
        calendarRange.textContent = copy.availableMonths(formatCalendarMonth(availability.first), formatCalendarMonth(availability.last));
        syncCalendarValue();
        renderCalendar();
    }

    function openCalendar() {
        if (!calendarAvailability) return;
        renderCalendar();
        calendarPanel.hidden = false;
        calendarTrigger.setAttribute("aria-expanded", "true");
        calendarYearToggle.focus();
    }

    function closeCalendar(returnFocus = false) {
        calendarPanel.hidden = true;
        calendarYears.hidden = true;
        calendarMonths.hidden = false;
        calendarTrigger.setAttribute("aria-expanded", "false");
        calendarYearToggle.setAttribute("aria-expanded", "false");
        if (returnFocus) calendarTrigger.focus();
    }

    function initCalendar() {
        dateField.hidden = true;
        calendarShell.hidden = false;
        const label = calculator.querySelector("#calculator-date-label");
        label.removeAttribute("for");
        label.addEventListener("click", () => calendarTrigger.focus());
        syncCalendarValue();
    }

    function syncCustomSelect() {
        const selected = modalityField.selectedOptions[0];
        selectValue.textContent = selected && selected.value ? selected.textContent.trim() : copy.chooseModality;
        customOptions.forEach((option, index) => {
            option.setAttribute("aria-selected", String(nativeOptions[index].value === modalityField.value));
        });
        if (modalityField.value) selectTrigger.removeAttribute("aria-invalid");
    }

    function setActiveOption(index) {
        if (!customOptions.length) return;
        activeOptionIndex = (index + customOptions.length) % customOptions.length;
        customOptions.forEach((option, position) => {
            option.classList.toggle("is-active", position === activeOptionIndex);
        });
        const active = customOptions[activeOptionIndex];
        selectTrigger.setAttribute("aria-activedescendant", active.id);
        active.scrollIntoView({ block: "nearest" });
    }

    function openCustomSelect() {
        selectList.hidden = false;
        selectTrigger.setAttribute("aria-expanded", "true");
        const selectedIndex = nativeOptions.findIndex((option) => option.value === modalityField.value);
        setActiveOption(selectedIndex < 0 ? 0 : selectedIndex);
    }

    function closeCustomSelect() {
        selectList.hidden = true;
        selectTrigger.setAttribute("aria-expanded", "false");
        selectTrigger.removeAttribute("aria-activedescendant");
        customOptions.forEach((option) => option.classList.remove("is-active"));
        activeOptionIndex = -1;
        typedSearch = "";
        clearTimeout(searchTimer);
    }

    function chooseOption(index) {
        if (!nativeOptions[index]) return;
        modalityField.value = nativeOptions[index].value;
        modalityField.dispatchEvent(new Event("change", { bubbles: true }));
        closeCustomSelect();
        selectTrigger.focus();
    }

    function initCustomSelect() {
        for (const nativeGroup of modalityField.querySelectorAll("optgroup")) {
            const group = document.createElement("div");
            group.className = "lp-calculator__select-group";
            group.setAttribute("role", "group");
            group.setAttribute("aria-label", nativeGroup.label);

            const heading = document.createElement("p");
            heading.className = "lp-calculator__select-group-label";
            heading.setAttribute("aria-hidden", "true");
            heading.textContent = nativeGroup.label;
            group.appendChild(heading);

            for (const nativeOption of nativeGroup.querySelectorAll("option")) {
                const option = document.createElement("div");
                const index = customOptions.length;
                option.id = `calculator-modality-option-${index}`;
                option.setAttribute("role", "option");
                option.setAttribute("aria-selected", "false");
                option.textContent = nativeOption.textContent.trim();
                option.addEventListener("click", () => chooseOption(index));
                group.appendChild(option);
                customOptions.push(option);
            }
            selectList.appendChild(group);
        }

        modalityField.hidden = true;
        selectShell.hidden = false;
        const label = calculator.querySelector("#calculator-modality-label");
        label.removeAttribute("for");
        label.addEventListener("click", () => selectTrigger.focus());
        syncCustomSelect();
    }

    function setStep(index, focus = false) {
        closeCustomSelect();
        closeCalendar();
        interactionVersion += 1;
        currentStep = index;
        steps.forEach((step, position) => { step.hidden = position !== index; });
        progressItems.forEach((item, position) => {
            item.classList.toggle("is-current", position === index);
            item.classList.toggle("is-complete", position < index);
            if (position === index) item.setAttribute("aria-current", "step");
            else item.removeAttribute("aria-current");
        });
        backButton.hidden = index === 0;
        nextButton.hidden = index === steps.length - 1;
        submitButton.hidden = index !== steps.length - 1 || hasResult;
        newButton.hidden = index !== steps.length - 1 || !hasResult;
        errorBox.hidden = true;
        if (focus) {
            const legend = steps[index].querySelector("legend");
            legend.tabIndex = -1;
            legend.focus();
        }
    }

    function validateStep(index) {
        if (index === 0) {
            if (!modalityField.value) {
                selectTrigger.setAttribute("aria-invalid", "true");
                return copy.chooseContract;
            }
            return "";
        }
        if (index === 1) {
            const date = dateField.value;
            const principal = parseDecimal(form.elements.principal.value);
            if (!calendarAvailability || !calendarAvailability.months.has(date)) {
                calendarTrigger.setAttribute("aria-invalid", "true");
                return copy.chooseAvailableMonth;
            }
            if (!Number.isFinite(principal) || principal <= 0) return copy.principal;
            return "";
        }
        const principal = parseDecimal(form.elements.principal.value);
        const terms = Number(form.elements.terms.value);
        const payment = parseDecimal(form.elements.payment.value);
        if (!Number.isInteger(terms) || terms < 1 || terms > 600) return copy.terms;
        if (!Number.isFinite(payment) || payment <= 0) return copy.payment;
        if (payment < principal / terms - 0.01) return copy.paymentLow;
        return "";
    }

    function setText(selector, value) {
        calculator.querySelector(selector).textContent = value;
    }

    function updateWhatsApp(details) {
        const link = calculator.querySelector("[data-result-whatsapp]");
        try {
            const url = new URL(calculator.dataset.whatsappUrl);
            const message = copy.whatsapp(details, currency.format(details.principal), currency.format(details.payment), percent.format(details.rate * 100), percent.format(details.average * 100));
            url.searchParams.set("text", message);
            link.href = url.toString();
        } catch (_) {
            link.href = calculator.dataset.whatsappUrl;
        }
    }

    function showError(message) {
        errorBox.textContent = message;
        errorBox.hidden = false;
        resultContent.hidden = true;
        errorBox.focus();
    }

    async function handleSubmit(event) {
        event.preventDefault();
        if (hasResult) return;
        errorBox.hidden = true;
        resultContent.hidden = true;

        for (let index = 0; index < steps.length; index += 1) {
            const message = validateStep(index);
            if (message) {
                setStep(index);
                showError(message);
                return;
            }
        }

        const principal = parseDecimal(form.elements.principal.value);
        const terms = Number(form.elements.terms.value);
        const payment = parseDecimal(form.elements.payment.value);
        const date = form.elements.date.value;
        const series = modalityField.value;
        const selectedOption = modalityField.selectedOptions[0];

        const rate = inferRate(principal, terms, payment, "price");
        if (!Number.isFinite(rate) || rate < 0 || rate > 1) {
            showError(copy.inferredRate);
            return;
        }

        submitButton.disabled = true;
        const requestVersion = interactionVersion;
        try {
            const data = await getRates(series, selectedOption.dataset.ratesUrl);
            if (requestVersion !== interactionVersion) return;
            const average = data.rates.get(date);
            if (average === undefined) {
                setStep(1);
                showError(copy.missingRate(formatMonth(date)));
                return;
            }

            const estimate = simulate(principal, terms, rate, "price");
            const benchmark = simulate(principal, terms, average, "price");
            const difference = rate - average;
            const above = difference > 0.00005;
            const potential = rate >= average * 1.5;
            resultHeading.textContent = copy.resultHeading;
            resultIntro.textContent = copy.resultIntro;
            resultStatus.textContent = potential ? copy.highDifference : above ? copy.aboveAverage : copy.withinAverage;
            resultStatus.className = `lp-calculator__status lp-calculator__status--${above ? "above" : "within"}`;
            setText("[data-result-rate]", `${percent.format(rate * 100)}% a.m.`);
            setText("[data-result-average]", `${percent.format(average * 100)}% a.m.`);
            setText("[data-result-difference]", `${difference >= 0 ? "+" : ""}${percent.format(difference * 100)} p.p.`);
            setText("[data-result-source]", copy.source(series, formatMonth(date), formatMonth(data.last)));
            setText("[data-result-payment]", currency.format(payment));
            setText("[data-result-total]", currency.format(payment * terms));
            setText("[data-result-interest]", currency.format(payment * terms - principal));
            setText("[data-result-comparison]", copy.comparison(currency.format(benchmark.firstPayment), currency.format(benchmark.total), currency.format(estimate.total - benchmark.total)));

            for (const system of ["gauss", "sac"]) {
                const alternativeRate = inferRate(principal, terms, payment, system);
                if (!Number.isFinite(alternativeRate) || alternativeRate > 1) {
                    setText(`[data-result-${system}]`, copy.noAlternative);
                    continue;
                }
                const alternative = simulate(principal, terms, alternativeRate, system);
                const averageAlternative = simulate(principal, terms, average, system);
                setText(`[data-result-${system}]`, copy.alternative(percent.format(alternativeRate * 100), currency.format(alternative.total), currency.format(averageAlternative.total)));
            }

            updateWhatsApp({ modality: selectedOption.textContent, person: selectedOption.dataset.person, date, principal, terms, payment, rate, average });
            resultContent.hidden = false;
            hasResult = true;
            submitButton.hidden = true;
            newButton.hidden = false;
            resultHeading.focus();
        } catch (error) {
            if (requestVersion === interactionVersion) showError(error.message || copy.calculatorError);
        } finally {
            submitButton.disabled = false;
        }
    }

    modalityField.addEventListener("change", () => {
        syncCustomSelect();
        pjSeriesNote.hidden = modalityField.value !== "25450";
        calendarAvailability = null;
        dateField.value = "";
        calendarRange.textContent = copy.calendarHint;
        syncCalendarValue();
        closeCalendar();
    });
    dateField.addEventListener("change", syncCalendarValue);
    calendarTrigger.addEventListener("click", () => {
        if (calendarPanel.hidden) openCalendar();
        else closeCalendar(true);
    });
    calendarPrevious.addEventListener("click", () => {
        const years = calendarAvailability.years;
        calendarViewYear = years[years.indexOf(calendarViewYear) - 1];
        renderCalendar();
    });
    calendarNext.addEventListener("click", () => {
        const years = calendarAvailability.years;
        calendarViewYear = years[years.indexOf(calendarViewYear) + 1];
        renderCalendar();
    });
    calendarYearToggle.addEventListener("click", () => {
        const showYears = calendarYears.hidden;
        calendarYears.hidden = !showYears;
        calendarMonths.hidden = showYears;
        calendarYearToggle.setAttribute("aria-expanded", String(showYears));
        if (showYears) {
            const selectedYear = calendarYears.querySelector('[aria-pressed="true"]');
            if (selectedYear) selectedYear.focus();
        }
    });
    calendarShell.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && !calendarPanel.hidden) {
            event.preventDefault();
            closeCalendar(true);
        }
    });
    calendarShell.addEventListener("focusout", (event) => {
        if (!calendarShell.contains(event.relatedTarget)) closeCalendar();
    });
    selectTrigger.addEventListener("click", () => {
        if (selectList.hidden) openCustomSelect();
        else closeCustomSelect();
    });
    selectTrigger.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            if (!selectList.hidden) {
                event.preventDefault();
                closeCustomSelect();
            }
            return;
        }
        if (event.key === "Tab") {
            closeCustomSelect();
            return;
        }
        if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            if (selectList.hidden) {
                openCustomSelect();
                if (event.key === "ArrowUp" && !modalityField.value) setActiveOption(customOptions.length - 1);
            } else {
                setActiveOption(activeOptionIndex + (event.key === "ArrowDown" ? 1 : -1));
            }
            return;
        }
        if (event.key === "Home" || event.key === "End") {
            event.preventDefault();
            if (selectList.hidden) openCustomSelect();
            setActiveOption(event.key === "Home" ? 0 : customOptions.length - 1);
            return;
        }
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            if (selectList.hidden) openCustomSelect();
            else chooseOption(activeOptionIndex);
            return;
        }
        if (event.key.length === 1 && !event.ctrlKey && !event.altKey && !event.metaKey) {
            event.preventDefault();
            clearTimeout(searchTimer);
            typedSearch += event.key.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
            searchTimer = setTimeout(() => { typedSearch = ""; }, 700);
            if (selectList.hidden) openCustomSelect();
            const matchingIndex = nativeOptions.findIndex((option) => option.textContent.trim()
                .normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().startsWith(typedSearch));
            if (matchingIndex >= 0) setActiveOption(matchingIndex);
        }
    });
    document.addEventListener("pointerdown", (event) => {
        if (!selectList.hidden && !selectShell.contains(event.target)) closeCustomSelect();
        if (!calendarPanel.hidden && !calendarShell.contains(event.target)) closeCalendar();
    });
    backButton.addEventListener("click", () => {
        if (hasResult) clearResult();
        setStep(currentStep - 1, true);
    });
    newButton.addEventListener("click", () => {
        form.reset();
        resetMoneyMasks.forEach((resetMask) => resetMask());
        syncCustomSelect();
        calendarAvailability = null;
        calendarRange.textContent = copy.calendarHint;
        syncCalendarValue();
        pjSeriesNote.hidden = true;
        selectTrigger.removeAttribute("aria-invalid");
        calendarTrigger.removeAttribute("aria-invalid");
        clearResult();
        setStep(0);
        selectTrigger.focus();
    });
    nextButton.addEventListener("click", async () => {
        const message = validateStep(currentStep);
        if (message) {
            showError(message);
            return;
        }
        if (currentStep !== 0) {
            setStep(currentStep + 1, true);
            return;
        }
        const requestVersion = interactionVersion;
        nextButton.disabled = true;
        nextButton.textContent = copy.loadingMonths;
        try {
            const availability = await loadCalendarAvailability();
            if (requestVersion !== interactionVersion) return;
            setCalendarAvailability(availability);
            setStep(1, true);
        } catch (error) {
            if (requestVersion === interactionVersion) showError(error.message || copy.rateError);
        } finally {
            nextButton.disabled = false;
            nextButton.textContent = initialNextButtonText;
        }
    });
    form.addEventListener("input", () => {
        interactionVersion += 1;
        if (hasResult) clearResult();
        else {
            resultContent.hidden = true;
            errorBox.hidden = true;
        }
    });
    form.addEventListener("change", () => {
        interactionVersion += 1;
        if (hasResult) clearResult();
        else {
            resultContent.hidden = true;
            errorBox.hidden = true;
        }
    });
    form.addEventListener("submit", handleSubmit);
    const resetMoneyMasks = moneyFields.map(attachMoneyMask);
    initCustomSelect();
    initCalendar();
    setStep(0);
})();
