const VALID_ROUTES = new Set(["home", "about", "solutions", "host", "franchise", "faq"]);

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

const delhiRoutes = [
    // Expressway 1: Epic sweeping vertical on the East
    [
        [28.7100, 77.2800],
        [28.6750, 77.2850],
        [28.6200, 77.3000],
        [28.5700, 77.3200],
        [28.5300, 77.3400]
    ],
    // Expressway 2: Huge diagonal sweeping from North-West to South-East
    [
        [28.7200, 77.1200],
        [28.6800, 77.1600],
        [28.6400, 77.2000],
        [28.5900, 77.2300],
        [28.5400, 77.2600]
    ],
    // Expressway 3: Broad curved horizontal across the South
    [
        [28.5500, 77.1200],
        [28.5350, 77.1600],
        [28.5250, 77.2100],
        [28.5350, 77.2600],
        [28.5600, 77.3000]
    ],
    // Expressway 4: Sweeping Northern curve
    [
        [28.6800, 77.0800],
        [28.7050, 77.1300],
        [28.7200, 77.1900],
        [28.7150, 77.2500],
        [28.6900, 77.3000]
    ]
];

const delhiStations = [
    { name: "Saket", coords: [28.5245, 77.2066] },
    { name: "Connaught Place", coords: [28.6315, 77.2167] },
    { name: "India Gate", coords: [28.6129, 77.2295] },
    { name: "Dwarka", coords: [28.5921, 77.0460] },
    { name: "Kashmere Gate", coords: [28.6673, 77.2273] }
];

const currencyFormatter = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
});

document.addEventListener("DOMContentLoaded", () => {
    initDelhiMap();
    initChatbot();
    initPublicApp();
});

function initPublicApp() {
    const appContent = document.getElementById("app-content");

    if (!appContent) {
        return;
    }

    if (!location.hash || !VALID_ROUTES.has(location.hash.slice(1))) {
        history.replaceState(null, "", "#home");
    }

    renderRoute();

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
    });

    chatbotClose.addEventListener("click", () => {
        chatbotWindow.classList.add("hidden");
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



function initDelhiMap() {
    const mapElement = document.getElementById("real-map-bg");

    if (!mapElement || mapElement.dataset.ready === "true" || typeof L === "undefined") {
        return;
    }

    mapElement.dataset.ready = "true";

    const map = L.map(mapElement, {
        zoomControl: false,
        attributionControl: false,
        dragging: false,
        scrollWheelZoom: false,
        doubleClickZoom: false,
        boxZoom: false,
        keyboard: false,
        touchZoom: false,
        tap: false
    });

    map.setView([28.6139, 77.2090], 11.5);

    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        subdomains: "abcd",
        maxZoom: 19
    }).addTo(map);

    delhiRoutes.forEach((route, index) => {
        L.polyline(route, {
            color: index % 2 === 0 ? "#39ff14" : "#8cffd7",
            weight: index % 2 === 0 ? 3 : 2,
            opacity: index % 2 === 0 ? 0.85 : 0.55,
            className: "delhi-route"
        }).addTo(map);
    });

    animateDelhiVehicles(map);
    window.addEventListener("resize", () => map.invalidateSize());
}

function animateDelhiVehicles(map) {
    const vehicles = delhiRoutes.map((route, index) => {
        const metric = buildRouteMetric(route);
        const marker = L.marker(route[0], {
            interactive: false,
            zIndexOffset: 1000,
            icon: L.divIcon({
                className: "custom-leaflet-car",
                html: `
                    <div class="ev-car-marker" aria-hidden="true">
                        <div class="ev-car-shell">
                            <svg width="28" height="16" viewBox="0 0 28 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <rect x="1" y="2" width="26" height="12" rx="4" fill="#000" stroke="#39ff14" stroke-width="2"/>
                                <rect x="7" y="3" width="10" height="10" rx="2" fill="#39ff14" opacity="0.3"/>
                                <path d="M22 3 L26 5 L26 11 L22 13 Z" fill="#39ff14"/>
                            </svg>
                        </div>
                    </div>
                `,
                iconSize: [28, 16],
                iconAnchor: [14, 8]
            })
        }).addTo(map);

        return {
            marker,
            metric,
            distance: 0,
            speed: 0.035
        };
    });

    let previousFrame = performance.now();

    const tick = (now) => {
        const deltaSeconds = Math.min((now - previousFrame) / 1000, 0.05);
        previousFrame = now;

        vehicles.forEach((vehicle) => {
            vehicle.distance = (vehicle.distance + (vehicle.metric.totalLength * vehicle.speed * deltaSeconds)) % vehicle.metric.totalLength;

            const point = getPointAtDistance(vehicle.metric, vehicle.distance);
            vehicle.marker.setLatLng(point.latLng);

            const markerElement = vehicle.marker.getElement();
            const shell = markerElement?.querySelector(".ev-car-shell");
            if (shell) {
                shell.style.transform = `rotate(${point.angle}deg)`;
            }
        });

        window.requestAnimationFrame(tick);
    };

    window.requestAnimationFrame(tick);
}

function buildRouteMetric(route) {
    const segments = [];
    let totalLength = 0;

    for (let index = 0; index < route.length - 1; index += 1) {
        const start = route[index];
        const end = route[index + 1];
        const dx = end[1] - start[1];
        const dy = end[0] - start[0];
        const length = Math.sqrt((dx * dx) + (dy * dy));

        segments.push({ start, end, length });
        totalLength += length;
    }

    return { route, segments, totalLength };
}

function getPointAtDistance(metric, distance) {
    let traversed = 0;

    for (const segment of metric.segments) {
        if (distance <= traversed + segment.length) {
            const localDistance = distance - traversed;
            const progress = segment.length === 0 ? 0 : localDistance / segment.length;
            const lat = segment.start[0] + ((segment.end[0] - segment.start[0]) * progress);
            const lng = segment.start[1] + ((segment.end[1] - segment.start[1]) * progress);
            const dx = segment.end[1] - segment.start[1]; // Longitude (Screen X)
            const dy = segment.start[0] - segment.end[0]; // Latitude (Screen Y is inverted)
            const angle = Math.atan2(dy, dx) * (180 / Math.PI);

            return {
                latLng: [lat, lng],
                angle
            };
        }

        traversed += segment.length;
    }

    return {
        latLng: metric.route[metric.route.length - 1],
        angle: 0
    };
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
            link.style.color = "#39ff14"; // Highlight active link
        } else {
            link.style.color = ""; // Reset to default
        }
    });
}

