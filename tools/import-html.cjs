'use strict';
// One-time migration, or explicit re-import of a newer single-file build.
// Future development should normally edit the split files directly.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const sourceArg = process.argv.slice(2).find(arg => !arg.startsWith('--'));
if (!sourceArg) throw Error('Usage: node tools/import-html.cjs <source.html> [--overwrite]');
const sourcePath = path.resolve(sourceArg);
if (sourcePath === path.join(root, 'index.html')) throw Error('Choose the original single-file HTML, not this split index.html.');
if (fs.existsSync(path.join(root, 'index.html')) && !process.argv.includes('--overwrite')) {
  throw Error('Split files already exist. Re-import replaces index.html, JS, CSS and matching assets. Use --overwrite only to intentionally replace them.');
}
const hash = data => crypto.createHash('sha256').update(data).digest('hex');
let html = fs.readFileSync(sourcePath, 'utf8');
const manifest = {source: {name: path.basename(sourcePath), bytes: Buffer.byteLength(html), sha256: hash(Buffer.from(html))}, scripts: [], styles: [], assets: [], files: []};
const outputs = new Map();
const media = new Map();
const extensions = {'image/png': 'png', 'image/webp': 'webp', 'audio/webm': 'webm'};
html = html.replace(/data:([^;,"'\s<>]+);base64,([A-Za-z0-9+/=]+)/g, (uri, mime, base64) => {
  const data = Buffer.from(base64, 'base64');
  if (data.toString('base64') !== base64) throw Error('Invalid base64 asset');
  const sha256 = hash(data);
  const key = `${mime}:${sha256}`;
  if (media.has(key)) return media.get(key);
  const ext = extensions[mime];
  if (!ext) throw Error(`Unsupported embedded media: ${mime}`);
  const kind = mime.startsWith('audio/') ? 'audio' : 'images';
  const assetPath = `assets/${kind}/${kind === 'audio' ? 'track' : 'image'}-${sha256.slice(0, 16)}.${ext}`;
  outputs.set(assetPath, data);
  media.set(key, assetPath);
  manifest.assets.push({path: assetPath, mime, bytes: data.length, sha256});
  return assetPath;
});
const scriptNames = ['preview-storage', 'game', 'brood-boss', 'spirit-boss', 'skull-cleave', 'fire-arrow', 'glowburst', 'ice-arrow', 'thunder', 'haunt-burst', 'lancer-preview', 'troll-preview'];
let scriptIndex = 0, styleIndex = 0;
html = html.replace(/<(script|style)\b([^>]*)>([\s\S]*?)<\/\1>/gi, (full, tag, attributes, body) => {
  tag = tag.toLowerCase();
  if (tag === 'script' && /\bsrc\s*=/i.test(attributes)) return full;
  let filePath, generatedTag, list;
  if (tag === 'script') {
    const index = scriptIndex++;
    filePath = `js/${String(index).padStart(2, '0')}-${scriptNames[index] || 'script'}.js`;
    new vm.Script(body, {filename: filePath});
    // Keep classic scripts synchronous and in exactly their original positions.
    generatedTag = `<script${attributes} src="${filePath}"></script>`;
    list = manifest.scripts;
  } else {
    const index = styleIndex++;
    filePath = `css/${index === 0 ? 'game' : index === 1 ? 'preview' : 'extra-' + index}.css`;
    generatedTag = `<link rel="stylesheet"${attributes} href="${filePath}">`;
    // CSS URLs resolve relative to css/, whereas JS media paths resolve from the page.
    for (const asset of manifest.assets) body = body.split(asset.path).join('../' + asset.path);
    list = manifest.styles;
  }
  outputs.set(filePath, Buffer.from(body));
  list.push({path: filePath, tag, attributes, generatedTag});
  return generatedTag;
});
if (!manifest.scripts.length || !manifest.assets.length) throw Error('Expected a single-file KEYWARD game containing embedded scripts and media.');
outputs.set('index.html', Buffer.from(html));
outputs.set('.nojekyll', Buffer.alloc(0));
for (const [filePath, data] of outputs) manifest.files.push({path: filePath, bytes: data.length, sha256: hash(data)});
// Validate everything before writing any generated game file.
for (const [filePath, data] of outputs) {
  const target = path.join(root, filePath);
  fs.mkdirSync(path.dirname(target), {recursive: true});
  fs.writeFileSync(target, data);
}
fs.writeFileSync(path.join(root, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log(JSON.stringify({sourceBytes: manifest.source.bytes, htmlBytes: Buffer.byteLength(html), scripts: manifest.scripts.length, assets: manifest.assets.length, gameBytes: [...outputs.values()].reduce((sum, data) => sum + data.length, 0)}, null, 2));
