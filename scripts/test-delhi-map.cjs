const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const application = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');

function harness({ fail = false, reduce = false } = {}) {
    const listeners = {};
    const motion = { matches: reduce, addEventListener: (_, callback) => { listeners.motion = callback; } };
    const svg = { paused: false, pauseAnimations() { this.paused = true; }, unpauseAnimations() { this.paused = false; } };
    const element = { dataset: {}, replaceChildren(child) { this.child = child; } };
    const document = { hidden: false, addEventListener: (event, callback) => { listeners[event] = callback; }, getElementById: () => element, importNode: () => svg };
    let requests = 0;
    const context = vm.createContext({
        document, window: { matchMedia: () => motion }, console: { warn() {} },
        fetch: async url => { assert(url.startsWith('assets/map/')); requests++; return { ok: !fail, text: async () => '<svg/>' }; },
        DOMParser: class { parseFromString() { return { querySelector: () => null, documentElement: { localName: 'svg' } }; } }
    });
    vm.runInContext(application, context);
    return { context, document, element, listeners, motion, svg, requestCount: () => requests };
}

(async () => {
    const live = harness();
    await live.context.initDelhiMap();
    assert.equal(live.element.dataset.ready, 'true');
    assert.equal(live.svg.paused, false);
    live.document.hidden = true;
    live.listeners.visibilitychange();
    assert.equal(live.svg.paused, true, 'Hidden tabs must pause animation');
    live.motion.matches = true;
    live.document.hidden = false;
    live.listeners.visibilitychange();
    assert.equal(live.svg.paused, true, 'Reduced motion must remain paused when visible');
    live.motion.matches = false;
    live.listeners.motion();
    assert.equal(live.svg.paused, false, 'Animation must resume when motion is allowed');
    await live.context.initDelhiMap();
    assert.equal(live.requestCount(), 1, 'Do not load a second map or attach duplicate animation listeners');

    const reduced = harness({ reduce: true });
    await reduced.context.initDelhiMap();
    assert.equal(reduced.svg.paused, true, 'Respect reduced motion on initial load');
    const failed = harness({ fail: true });
    await failed.context.initDelhiMap();
    assert.equal(failed.element.child, undefined, 'A missing map asset must not break page rendering');
    console.log('PASS: self-hosted loading, reduced motion, visibility pause/resume, duplicate init, and network fallback.');
})().catch(error => { console.error(error); process.exitCode = 1; });
