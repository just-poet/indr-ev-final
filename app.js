const VALID_ROUTES = new Set(["home", "about", "solutions", "host", "franchise", "partners", "faq"]);

const FAQ_ANSWERS = {
    land: "Our biggest USP is that we can provide prime highway land along with the charging setup, so you do not need to own property to start a franchise conversation.",
    chargers: "We offer AC chargers from 7.4 kW to 22 kW and DC fast chargers from 30 kW up to 240 kW with single and dual gun configurations.",
    host: "We work with commercial property owners, hotel and restaurant operators, mall spaces, and highway landowners with accessible parking locations.",
    cost: "The standard 60 kW fast charger package starts around Rs. 15 lakh, while higher-capacity packages scale upward based on site and hardware requirements.",
    roi: "The current model highlights profit potential up to roughly Rs. 1.5 lakh or more per month, with a smart royalty model that starts only after stronger monthly revenue is reached.",
    certifications: "Yes. The chargers are positioned as ARAI certified, weather protected, and built around BIS, CEA, and ISO aligned safety expectations.",
    subsidies: "Yes. The company messaging states support for claiming FAME-linked incentives and for navigating approvals where programs are applicable.",
    warranty: "The public site currently presents long-term warranty support, installation help, remote monitoring, and post-installation assistance as part of the package."
};

const currencyFormatter = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
});

document.addEventListener("DOMContentLoaded", () => {
    initChatbot();
    initNavigation();
    initPublicApp();
    initDelhiMap();
});

function initNavigation() {
    const toggle = document.querySelector(".menu-toggle");
    const navigation = document.getElementById("primary-nav");
    const close = () => {
        navigation.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
        toggle.setAttribute("aria-label", "Open navigation");
    };
    toggle.addEventListener("click", () => {
        const open = toggle.getAttribute("aria-expanded") !== "true";
        navigation.classList.toggle("is-open", open);
        toggle.setAttribute("aria-expanded", String(open));
        toggle.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
    });
    navigation.addEventListener("click", (event) => {
        if (event.target.closest("a")) close();
    });
    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
            close();
            toggle.focus();
        }
    });
    document.addEventListener("click", (event) => {
        if (!event.target.closest("header")) close();
    });
    window.addEventListener("hashchange", close);
    window.matchMedia("(min-width: 851px)").addEventListener("change", close);
}

function initPublicApp() {
    const appContent = document.getElementById("app-content");

    if (!appContent) {
        return;
    }

    if (!location.hash || !VALID_ROUTES.has(location.hash.slice(1))) {
        history.replaceState(null, "", "#home");
    }

    renderRoute();

    document.querySelector(".skip-link").addEventListener("click", (event) => {
        event.preventDefault();
        appContent.focus();
        appContent.scrollIntoView();
    });

    window.addEventListener("hashchange", renderRoute);

    document.querySelectorAll('a[href^="#"]').forEach((link) => {
        link.addEventListener("click", () => {
            const route = normaliseRoute(link.getAttribute("href"));
            if (route === normaliseRoute(location.hash)) {
                window.setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 0);
            }
        });
    });
}

function renderRoute() {
    const appContent = document.getElementById("app-content");

    if (!appContent) {
        return;
    }

    const route = normaliseRoute(location.hash);
    const template = document.getElementById(`tmpl-${route}`) || document.getElementById("tmpl-home");

    appContent.innerHTML = template ? template.innerHTML : "";
    appContent.dataset.route = route;
    const title = route === "home" ? "Premium Charging Network" : route === "partners" ? "Our Partners" : route.charAt(0).toUpperCase() + route.slice(1);
    document.title = `INDR EV | ${title}`;
    appContent.querySelectorAll("img:not([alt])").forEach((image) => {
        image.alt = "INDR EV charging infrastructure";
    });
    window.scrollTo(0, 0);
    setActiveNav(route);
    initRouteFeatures(route);
}

function initRouteFeatures(route) {
    if (route === "home") {
        initEcoCalculator();
    }

    if (route === "franchise" || route === "host") {
        initProfitCalculator();
    }
}

function initEcoCalculator() {
    const distanceSlider = document.getElementById("eco-dist");
    const mileageSlider = document.getElementById("eco-mileage");
    const petrolSlider = document.getElementById("eco-petrol");

    if (!distanceSlider || !mileageSlider || !petrolSlider) {
        return;
    }

    const distanceValue = document.getElementById("eco-dist-val");
    const mileageValue = document.getElementById("eco-mileage-val");
    const petrolValue = document.getElementById("eco-petrol-val");
    const iceCost = document.getElementById("eco-ice-cost");
    const evCost = document.getElementById("eco-ev-cost");
    const annualSavings = document.getElementById("eco-annual-savings");
    const co2Value = document.getElementById("eco-co2");

    const render = () => {
        const dailyDistance = Number(distanceSlider.value);
        const mileage = Number(mileageSlider.value);
        const petrolPrice = Number(petrolSlider.value);
        const monthlyDistance = dailyDistance * 30;
        const monthlyPetrolCost = (monthlyDistance / mileage) * petrolPrice;
        const evCostPerKm = 1.80;
        const monthlyEvCost = monthlyDistance * evCostPerKm;
        const annualSavingsValue = (monthlyPetrolCost - monthlyEvCost) * 12;
        const annualPetrolLitres = ((dailyDistance * 365) / mileage);
        const annualCo2Reduction = (annualPetrolLitres * 2.31) / 1000;

        distanceValue.textContent = `${dailyDistance} km`;
        mileageValue.textContent = `${mileage} km/l`;
        petrolValue.textContent = formatCurrency(petrolPrice);
        iceCost.textContent = formatCurrency(monthlyPetrolCost);
        evCost.textContent = formatCurrency(monthlyEvCost);
        annualSavings.textContent = formatCurrency(annualSavingsValue);
        co2Value.textContent = `${annualCo2Reduction.toFixed(1)} Tons`;
    };

    [distanceSlider, mileageSlider, petrolSlider].forEach((slider) => {
        slider.addEventListener("input", render);
    });

    render();
}

function initProfitCalculator() {
    const carsSlider = document.getElementById("calc-cars");

    if (!carsSlider) {
        return;
    }

    carsSlider.setAttribute("aria-label", "Cars charged per day");

    const carsValue = document.getElementById("calc-cars-val");
    const dailyValue = document.getElementById("calc-daily");
    const monthlyValue = document.getElementById("calc-monthly");
    const yearlyValue = document.getElementById("calc-yearly");
    const roiValue = document.getElementById("calc-roi");
    const breakevenValue = document.getElementById("calc-breakeven");

    const render = () => {
        const cars = Number(carsSlider.value);
        const dailyProfit = cars * 360;
        const monthlyProfit = dailyProfit * 30;
        const yearlyProfit = dailyProfit * 365;
        const investment = 1500000;
        const roi = (yearlyProfit / investment) * 100;
        const breakEvenMonths = Math.max(1, Math.ceil(investment / monthlyProfit));

        carsValue.textContent = `${cars} cars`;
        dailyValue.textContent = formatCurrency(dailyProfit);
        monthlyValue.textContent = formatCurrency(monthlyProfit);
        yearlyValue.textContent = formatCurrency(yearlyProfit);
        roiValue.textContent = `${Math.round(roi)}%`;
        breakevenValue.innerHTML = `<i class="fas fa-check-circle" style="color:#39ff14; margin-right:8px;"></i> Break-even in ${breakEvenMonths} months at current rate`;
    };

    carsSlider.addEventListener("input", render);
    render();
}

function initChatbot() {
    const chatbotButton = document.getElementById("chatbot-button");
    const chatbotWindow = document.getElementById("chatbot-window");
    const chatbotClose = document.getElementById("chatbot-close");
    const chatbotMessages = document.getElementById("chatbot-messages");

    if (!chatbotButton || !chatbotWindow || !chatbotClose || !chatbotMessages) {
        return;
    }

    chatbotButton.addEventListener("click", () => {
        chatbotWindow.classList.toggle("hidden");
        chatbotButton.setAttribute("aria-expanded", String(!chatbotWindow.classList.contains("hidden")));
        if (!chatbotWindow.classList.contains("hidden")) chatbotClose.focus();
    });

    chatbotClose.addEventListener("click", () => {
        chatbotWindow.classList.add("hidden");
        chatbotButton.setAttribute("aria-expanded", "false");
        chatbotButton.focus();
    });

    chatbotWindow.addEventListener("keydown", (event) => {
        if (event.key === "Escape") chatbotClose.click();
    });

    document.querySelectorAll(".chat-faq-btn").forEach((button) => {
        button.addEventListener("click", () => {
            const key = button.dataset.faq || "";
            appendChatMessage(button.textContent || "", "user");
            appendChatMessage(FAQ_ANSWERS[key] || "I can help with our charging, hosting, investment, and support topics. Please pick another question from the list.", "bot");
        });
    });
}

function appendChatMessage(text, role) {
    const chatbotMessages = document.getElementById("chatbot-messages");

    if (!chatbotMessages) {
        return;
    }

    const message = document.createElement("div");
    message.className = `message ${role}`;
    message.textContent = text;
    chatbotMessages.appendChild(message);
    chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
}



async function initDelhiMap() {
    const mapElement = document.getElementById("real-map-bg");

    if (!mapElement || mapElement.dataset.ready === "true") {
        return;
    }

    try {
        const response = await fetch("assets/map/delhi-roads.svg?v=20261020-map1");
        if (!response.ok) throw new Error("Could not load the Delhi map");
        const source = new DOMParser().parseFromString(await response.text(), "image/svg+xml");
        if (source.querySelector("parsererror") || source.documentElement.localName !== "svg") {
            throw new Error("Invalid Delhi map asset");
        }

        const map = document.importNode(source.documentElement, true);
        mapElement.replaceChildren(map);
        mapElement.dataset.ready = "true";

        // Native SVG motion keeps the cars and roads aligned at every screen size.
        const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
        const updateMotion = () => {
            if (document.hidden || motionPreference.matches) map.pauseAnimations();
            else map.unpauseAnimations();
        };
        document.addEventListener("visibilitychange", updateMotion);
        motionPreference.addEventListener("change", updateMotion);
        updateMotion();
    } catch (error) {
        // The site's gradient remains usable if the decorative asset cannot load.
        console.warn("Delhi background unavailable:", error.message);
    }
}

function normaliseRoute(hashValue) {
    const rawValue = String(hashValue || "").replace("#", "").trim().toLowerCase();
    return VALID_ROUTES.has(rawValue) ? rawValue : "home";
}

function formatCurrency(value) {
    return currencyFormatter.format(Math.round(value));
}

function formatDate(dateString) {
    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) {
        return dateString;
    }

    return date.toLocaleDateString("en-IN", {
        year: "numeric",
        month: "short",
        day: "numeric"
    });
}

function formatDateTime(dateString) {
    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) {
        return dateString;
    }

    return date.toLocaleString("en-IN", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit"
    });
}

function escapeHtml(value) {
    return String(value || "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
}

function escapeAttribute(value) {
    return escapeHtml(value);
}

function setActiveNav(route) {
    document.querySelectorAll("header .nav-links a, header nav a").forEach((link) => {
        if (link.getAttribute("href") === `#${route}`) {
            link.classList.add("active");
            link.setAttribute("aria-current", "page");
        } else {
            link.classList.remove("active");
            link.removeAttribute("aria-current");
        }
    });
}

