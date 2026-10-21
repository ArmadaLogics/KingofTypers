'use strict';
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
assert.ok(fs.existsSync(path.join(root, 'index.html')), 'The split game must have its own index.html');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
assert.ok(Buffer.byteLength(html) < 10000, 'The entry HTML must stay small');
for (const match of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)) assert.equal(match[1].trim(), '', 'Game scripts must be external');
assert.ok(!/data:[^;,]+;base64,/.test(html), 'Media must be external');
const hash = data => crypto.createHash('sha256').update(data).digest('hex');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.json')));
const sourceArg = process.argv[2];
let largest = {path: '', bytes: 0}, total = 0, editedFiles = 0;
for (const item of manifest.files) {
  const data = fs.readFileSync(path.join(root, item.path));
  if (hash(data) !== item.sha256) editedFiles++;
  if (sourceArg) assert.equal(hash(data), item.sha256, `File changed since import: ${item.path}`);
  assert.ok(data.length < 25 * 1024 * 1024, `Too large for GitHub browser upload: ${item.path}`);
  if (item.path.endsWith('.js')) new vm.Script(data.toString(), {filename: item.path});
  if (data.length > largest.bytes) largest = {path: item.path, bytes: data.length};
  total += data.length;
}
assert.equal([...html.matchAll(/<script\b[^>]*src="([^"]+)"/g)].length, manifest.scripts.length);
assert.equal([...html.matchAll(/<link\b[^>]*href="([^"]+)"/g)].length, manifest.styles.length);
for (const item of [...manifest.scripts, ...manifest.styles]) assert.ok(html.includes(`"${item.path}"`));
if (sourceArg) {
  const source = fs.readFileSync(path.resolve(sourceArg), 'utf8');
  assert.equal(hash(Buffer.from(source)), manifest.source.sha256, 'Original source has changed');
  let restored = html;
  for (const item of [...manifest.scripts, ...manifest.styles]) {
    let body = fs.readFileSync(path.join(root, item.path), 'utf8');
    for (const asset of manifest.assets) {
      const reference = item.tag === 'style' ? '../' + asset.path : asset.path;
      if (body.includes(reference)) body = body.split(reference).join(`data:${asset.mime};base64,${fs.readFileSync(path.join(root, asset.path)).toString('base64')}`);
    }
    restored = restored.replace(item.generatedTag, `<${item.tag}${item.attributes}>${body}</${item.tag}>`);
  }
  for (const asset of manifest.assets) {
    if (restored.includes(asset.path)) restored = restored.split(asset.path).join(`data:${asset.mime};base64,${fs.readFileSync(path.join(root, asset.path)).toString('base64')}`);
  }
  assert.equal(hash(Buffer.from(restored)), hash(Buffer.from(source)), 'Extraction must preserve the original HTML, script order, styles and media exactly');
}
console.log(JSON.stringify({passed: true, scripts: manifest.scripts.length, styles: manifest.styles.length, assets: manifest.assets.length, htmlBytes: Buffer.byteLength(html), totalBytes: total, editedFiles, largest}, null, 2));
