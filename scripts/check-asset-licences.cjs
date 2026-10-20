// Check resource provenance records and local references, not legal compliance.
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const html = read('index.html');
const manifestPath = path.join(root, 'assets/licenses/vendor-manifest.json');
const vendorFiles = [
    'assets/vendor/outfit/Outfit-variable.ttf',
    'assets/vendor/outfit/OFL.txt',
    'assets/vendor/fontawesome/css/fontawesome.min.css',
    'assets/vendor/fontawesome/css/solid.min.css',
    'assets/vendor/fontawesome/webfonts/fa-solid-900.woff2',
    'assets/vendor/fontawesome/webfonts/fa-solid-900.ttf',
    'assets/vendor/fontawesome/LICENSE.txt'
];
const hash = file => crypto.createHash('sha256').update(fs.readFileSync(path.join(root, file))).digest('hex');

if (process.argv.includes('--record')) {
    const manifest = {
        description: 'Checksums of the bundled vendor files; not a legal certification.',
        outfitSource: 'https://github.com/google/fonts/tree/8b0a1d0f5983c89bc2b93f1b5fb55f9e252744b5/ofl/outfit',
        fontAwesomeSource: 'https://github.com/FortAwesome/Font-Awesome/tree/6.4.0',
        files: vendorFiles.map(file => ({ path: file, sha256: hash(file) }))
    };
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
assert.deepEqual(manifest.files.map(file => file.path).sort(), [...vendorFiles].sort());
for (const file of manifest.files) assert.equal(hash(file.path), file.sha256, `Vendor file changed: ${file.path}`);

const cssFiles = new Set(['site.css']);
let references = 0;
function localReference(reference, from) {
    assert(!/^(https?:)?\/\//i.test(reference), `Automatic external resource in ${from}: ${reference}`);
    if (reference.startsWith('#') || reference.startsWith('data:')) return;
    const file = path.resolve(root, path.dirname(from), decodeURIComponent(reference.split(/[?#]/)[0]));
    assert(file.startsWith(root + path.sep), `Resource escapes website directory: ${reference}`);
    assert(fs.existsSync(file), `Missing resource: ${reference} in ${from}`);
    references++;
    if (file.endsWith('.css')) cssFiles.add(path.relative(root, file));
}

for (const match of html.matchAll(/<(?:img|script|link)\b[^>]*?\b(?:src|href)="([^"]+)"/g)) localReference(match[1], 'index.html');
for (const match of html.matchAll(/<a\b[^>]*?\bhref="([^"]+)"/g)) {
    if (!/^(?:https?:|mailto:|tel:|#)/i.test(match[1])) localReference(match[1], 'index.html');
}
for (const file of cssFiles) {
    const css = read(file);
    for (const match of css.matchAll(/url\(\s*["']?([^\s)"']+)["']?\s*\)/g)) localReference(match[1], file);
    assert(!/@import\s/i.test(css), `Review new CSS import: ${file}`);
}
for (const match of read('app.js').matchAll(/fetch\("([^"]+)"/g)) localReference(match[1], 'app.js');

assert(!/\son[a-z]+\s*=/i.test(html), 'Inline event handlers must be replaced by local script listeners');
assert(html.includes('Content-Security-Policy'));
assert(html.includes('href="#legal"'));
assert(html.includes('id="tmpl-legal"'));
assert(html.includes('https://www.openstreetmap.org/copyright'));
assert(read('assets/vendor/outfit/OFL.txt').includes('Copyright 2021 The Outfit Project Authors'));
assert(read('assets/vendor/fontawesome/LICENSE.txt').includes('Copyright 2023 Fonticons, Inc.'));
assert(read('assets/map/LICENSE.md').includes('ODbL'));
assert(read('THIRD_PARTY_NOTICES.md').replace(/\s+/g, ' ').includes('owner confirmation, not independent verification'));
for (const file of ['assets/vendor/fontawesome/css/fontawesome.min.css', 'assets/vendor/fontawesome/css/solid.min.css']) {
    assert(read(file).includes('Copyright 2023 Fonticons, Inc.'), `Missing original notice: ${file}`);
}

const iconDefinitions = read('assets/vendor/fontawesome/css/fontawesome.min.css');
const icons = new Set([...html.matchAll(/\bfa-([a-z0-9-]+)\b/g)].map(match => match[1]));
for (const icon of icons) assert(iconDefinitions.includes(`.fa-${icon}:`), `Missing icon definition: ${icon}`);
console.log(`PASS: ${references} local asset references, ${vendorFiles.length} vendor checksums, licence notices, icon definitions, credits route and same-origin policy. This is not legal clearance.`);
