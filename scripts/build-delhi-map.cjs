// Render a self-hosted map and road-following animation from the bundled OSM extract.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

const directory = path.join(__dirname, '..', 'assets', 'map');
const source = JSON.parse(fs.readFileSync(path.join(directory, 'delhi-source.json'), 'utf8'));
assert(!source.remark, source.remark);
const ways = source.elements.filter(element => element.type === 'way' && element.geometry?.length > 1);
const north = 28.76;
const west = 77.06;
const scale = 5600;
const mercator = latitude => Math.log(Math.tan(Math.PI / 4 + latitude * Math.PI / 360)) * 180 / Math.PI;
const project = ({ lat, lon }) => [(lon - west) * scale, (mercator(north) - mercator(lat)) * scale];
const width = (77.34 - west) * scale;
const height = (mercator(north) - mercator(28.49)) * scale;
const round = value => Number(value.toFixed(2));
const point = location => project(location).map(round).join(',');
const drawPath = geometry => 'M' + geometry.map(point).join('L');
const nodes = new Map();
const graph = new Map();
const roadEdges = new Set();
const edgeKey = (a, b) => `${a}:${b}`;

function connect(a, b, way) {
    if (!graph.has(a)) graph.set(a, []);
    const start = project(nodes.get(a));
    const end = project(nodes.get(b));
    graph.get(a).push({ to: b, length: Math.hypot(end[0] - start[0], end[1] - start[1]), way });
    roadEdges.add(edgeKey(a, b));
}

const roads = ways.filter(way => way.tags?.highway && !['no', 'private'].includes(way.tags?.access));
roads.forEach(way => way.nodes.forEach((id, index) => nodes.set(id, way.geometry[index])));
roads.forEach(way => {
    const oneWay = ['yes', '1', 'true'].includes(way.tags.oneway) || (way.tags.junction === 'roundabout' && way.tags.oneway !== 'no');
    for (let index = 1; index < way.nodes.length; index++) {
        const a = way.nodes[index - 1];
        const b = way.nodes[index];
        if (way.tags.oneway !== '-1') connect(a, b, way.id);
        if (!oneWay) connect(b, a, way.id);
    }
});

function nearest(lat, lon) {
    const target = project({ lat, lon });
    let winner;
    let distance = Infinity;
    for (const [id, node] of nodes) {
        if (!graph.has(id)) continue;
        const xy = project(node);
        const candidate = Math.hypot(xy[0] - target[0], xy[1] - target[1]);
        if (candidate < distance) { distance = candidate; winner = id; }
    }
    return winner;
}

class MinHeap {
    values = [];
    push(value) {
        let index = this.values.length;
        this.values.push(value);
        while (index > 0) {
            const parent = (index - 1) >> 1;
            if (this.values[parent].distance <= value.distance) break;
            this.values[index] = this.values[parent];
            index = parent;
        }
        this.values[index] = value;
    }
    pop() {
        const first = this.values[0];
        const last = this.values.pop();
        if (!this.values.length) return first;
        let index = 0;
        while (index * 2 + 1 < this.values.length) {
            let child = index * 2 + 1;
            if (child + 1 < this.values.length && this.values[child + 1].distance < this.values[child].distance) child++;
            if (this.values[child].distance >= last.distance) break;
            this.values[index] = this.values[child];
            index = child;
        }
        this.values[index] = last;
        return first;
    }
}

function shortestPath(start, finish) {
    const distances = new Map([[start, 0]]);
    const previous = new Map();
    const queue = new MinHeap();
    queue.push({ id: start, distance: 0 });
    while (queue.values.length) {
        const current = queue.pop();
        if (current.id === finish) {
            const route = [finish];
            while (route[0] !== start) route.unshift(previous.get(route[0]));
            return route;
        }
        if (current.distance !== distances.get(current.id)) continue;
        for (const edge of graph.get(current.id) || []) {
            const candidate = current.distance + edge.length;
            if (candidate < (distances.get(edge.to) ?? Infinity)) {
                distances.set(edge.to, candidate);
                previous.set(edge.to, current.id);
                queue.push({ id: edge.to, distance: candidate });
            }
        }
    }
    throw new Error(`No connected road path between ${start} and ${finish}`);
}

const itineraries = [
    { name: 'Central Delhi', stops: [[28.6328, 77.2197], [28.6129, 77.2295], [28.5687, 77.2071], [28.5915, 77.1628]] },
    { name: 'Old Delhi to ITO', stops: [[28.6674, 77.2284], [28.6303, 77.2414], [28.6129, 77.2295], [28.6441, 77.2102]] },
    { name: 'Ring Road', stops: [[28.6843, 77.1543], [28.6448, 77.1783], [28.5915, 77.1628], [28.6697, 77.1336]] },
    { name: 'South Delhi', stops: [[28.5687, 77.2071], [28.5492, 77.2507], [28.5865, 77.2557], [28.6129, 77.2295]] }
];

const routes = itineraries.map(itinerary => {
    const stops = itinerary.stops.map(stop => nearest(...stop));
    const ids = [];
    for (let index = 0; index < stops.length; index++) {
        const segment = shortestPath(stops[index], stops[(index + 1) % stops.length]);
        ids.push(...(index === 0 ? segment : segment.slice(1)));
    }
    assert.equal(ids[0], ids.at(-1), 'Animation must form a closed road loop');
    for (let index = 1; index < ids.length; index++) {
        assert(roadEdges.has(edgeKey(ids[index - 1], ids[index])), 'Every animation segment must be an actual road edge');
    }
    return { name: itinerary.name, nodes: ids, d: drawPath(ids.map(id => nodes.get(id))) };
});

const groups = new Map();
for (const way of ways) {
    let type;
    if (way.tags?.highway) type = /motorway|trunk|primary/.test(way.tags.highway) ? 'major' : 'minor';
    else if (way.tags?.waterway) type = 'river';
    else if (way.tags?.natural === 'water') type = 'water';
    else if (way.tags?.leisure === 'park') type = 'park';
    if (!type) continue;
    if (!groups.has(type)) groups.set(type, []);
    groups.get(type).push(drawPath(way.geometry) + (type === 'park' || type === 'water' ? 'Z' : ''));
}

const labels = [
    ['DELHI', 28.708, 77.206, 'city'], ['CONNAUGHT PLACE', 28.6355, 77.218, 'district'],
    ['INDIA GATE', 28.6118, 77.231, 'district'], ['OLD DELHI', 28.656, 77.235, 'district'],
    ['KAROL BAGH', 28.652, 77.188, 'district'], ['PUNJABI BAGH', 28.674, 77.132, 'district'],
    ['SOUTH DELHI', 28.544, 77.220, 'district'], ['DHAULA KUAN', 28.587, 77.162, 'district'],
    ['YAMUNA', 28.683, 77.251, 'river-label']
];

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${round(width)} ${round(height)}" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
<title>Delhi roads, with illustrative electric cars following the OpenStreetMap road network</title>
<metadata>Map data (c) OpenStreetMap contributors, ODbL 1.0. https://www.openstreetmap.org/copyright. Source timestamp: ${source.osm3s.timestamp_osm_base}. Decorative animation; not live traffic or charger locations.</metadata>
<defs>
<pattern id="map-grid" width="70" height="70" patternUnits="userSpaceOnUse"><path d="M70 0H0V70" fill="none" stroke="#203d2b" stroke-width=".6" opacity=".2"/></pattern>
<radialGradient id="car-light"><stop stop-color="#aaff9d" stop-opacity=".24"/><stop offset="1" stop-color="#39ff14" stop-opacity="0"/></radialGradient>
<g id="map-car"><ellipse rx="30" ry="22" fill="url(#car-light)"/><rect x="-14" y="-7" width="28" height="14" rx="4" fill="#07120c" stroke="#9bff86" stroke-width="1.5"/><rect x="-6" y="-5" width="12" height="10" rx="2" fill="#39ff14" fill-opacity=".28"/><path d="M8-5 12-3V3L8 5Z" fill="#bcffae"/><path d="M-12-4V-2M-12 2V4" stroke="#61f5c2" stroke-width="2"/><path d="M14-4 34-10V10L14 4Z" fill="#b2ffae" fill-opacity=".07"/></g>
${routes.map((route, index) => `<path id="delhi-road-loop-${index}" d="${route.d}"/>`).join('\n')}
</defs>
<rect width="100%" height="100%" fill="#08140e"/><rect width="100%" height="100%" fill="url(#map-grid)"/>
<g fill="#142b1c" stroke="#24472d" stroke-width=".7">${(groups.get('park') || []).map(d => `<path d="${d}"/>`).join('')}</g>
<g fill="#0e2d2c" stroke="#1a4740" stroke-width="1">${(groups.get('water') || []).map(d => `<path d="${d}"/>`).join('')}</g>
<g fill="none" stroke="#194039" stroke-width="13" stroke-linecap="round">${(groups.get('river') || []).map(d => `<path d="${d}"/>`).join('')}</g>
<g fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="${(groups.get('minor') || []).join('')}" stroke="#264332" stroke-width="1.6"/><path d="${(groups.get('major') || []).join('')}" stroke="#3b5c44" stroke-width="3"/></g>
<g fill="none" stroke="#39ff14" stroke-linecap="round" stroke-linejoin="round">${routes.map((_, index) => `<use href="#delhi-road-loop-${index}" stroke-width="9" opacity=".045"/><use href="#delhi-road-loop-${index}" stroke-width="1.7" opacity=".44"/>`).join('')}</g>
<g font-family="Outfit, sans-serif" text-anchor="middle" fill="#a1b7a5" paint-order="stroke" stroke="#08140e" stroke-width="5" stroke-linejoin="round">${labels.map(([label, lat, lon, type]) => { const [x, y] = project({ lat, lon }); return `<text x="${round(x)}" y="${round(y)}" class="${type}" font-size="${type === 'city' ? 33 : 13}" letter-spacing="${type === 'city' ? 10 : 2}" opacity="${type === 'city' ? .75 : .65}">${label}</text>`; }).join('')}</g>
<g class="map-vehicles">${routes.flatMap((_, index) => [0, 1, 2].map((car, carIndex) => `<g class="map-vehicle car-${carIndex}" data-route="${index}"><use href="#map-car"/><animateMotion dur="${110 + index * 19}s" begin="-${car * (110 + index * 19) / 3 + index * 7}s" rotate="auto" repeatCount="indefinite" calcMode="paced"><mpath href="#delhi-road-loop-${index}"/></animateMotion></g>`)).join('')}</g>
</svg>`;

fs.writeFileSync(path.join(directory, 'delhi-roads.svg'), svg);
fs.writeFileSync(path.join(directory, 'route-validation.json'), JSON.stringify({ source: 'OpenStreetMap', license: 'ODbL-1.0', timestamp: source.osm3s.timestamp_osm_base, roads: roads.length, routes: routes.map(route => ({ name: route.name, nodes: route.nodes.length, closed: true, everySegmentOnRoad: true })) }, null, 2) + '\n');
console.log(`Generated ${roads.length} roads and ${routes.length} closed road loops. All animation segments validated against OSM road edges. SVG size: ${Buffer.byteLength(svg)} bytes.`);
