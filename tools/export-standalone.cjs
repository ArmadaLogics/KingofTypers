'use strict';
// Optional offline copy. The editable Web package keeps its external media and scripts.
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),manifest=JSON.parse(fs.readFileSync(path.join(root,'manifest.json')));
const output=process.argv[2];
if(!output)throw Error('Usage: node tools/export-standalone.cjs <output.html>');
const media=new Map(manifest.assets.map(a=>[a.path,`data:${a.mime};base64,${fs.readFileSync(path.join(root,a.path)).toString('base64')}`]));
function inlineMedia(source,css=false){
 for(const [file,data] of media)source=source.split((css?'../':'')+file).join(data);
 return source;
}
let html=fs.readFileSync(path.join(root,'index.html'),'utf8');
html=html.replace(/<script\b([^>]*)\bsrc="([^"]+)"([^>]*)><\/script>/g,(_,before,src,after)=>
 `<script${before}${after}>${inlineMedia(fs.readFileSync(path.join(root,src),'utf8'))}</script>`);
html=html.replace(/<link\b[^>]*rel="stylesheet"[^>]*href="([^"]+)"[^>]*>/g,(_,src)=>
 `<style>${inlineMedia(fs.readFileSync(path.join(root,src),'utf8'),true)}</style>`);
if(/(?:src|href)="(?:js|css|assets)\//.test(html)||/["'](?:assets\/images|assets\/audio)\//.test(html))throw Error('Unresolved local media in standalone export');
fs.writeFileSync(path.resolve(output),html);
console.log(JSON.stringify({output:path.resolve(output),bytes:Buffer.byteLength(html),version:manifest.version}));
