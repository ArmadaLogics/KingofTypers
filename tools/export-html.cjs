'use strict';
// Explicit optional standalone export. KEYWARD-Web remains the editable source.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');
const outputArg=process.argv.slice(2).find(arg=>!arg.startsWith('--'));
if(!outputArg)throw Error('Usage: node tools/export-html.cjs <output.html> [--overwrite]');
const output=path.resolve(outputArg);
if(output===root||output.startsWith(root+path.sep))throw Error('Export outside KEYWARD-Web to keep its scripts and media external.');
if(path.extname(output).toLowerCase()!=='.html')throw Error('Choose an .html output file.');
if(fs.existsSync(output)&&!process.argv.includes('--overwrite'))throw Error('Output already exists. Use --overwrite to replace it explicitly.');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'manifest.json'),'utf8'));
const read=name=>{
 const target=path.resolve(root,name);
 if(!target.startsWith(root+path.sep))throw Error('Path outside game folder: '+name);
 return fs.readFileSync(target);
};
const media=new Map(manifest.assets.map(asset=>[asset.path,`data:${asset.mime};base64,${read(asset.path).toString('base64')}`]));
const dynamicRoots=new Set();
const embed=body=>body.replace(/(?:\.\.\/)?assets\/[A-Za-z0-9_./-]+/g,reference=>{
 const key=reference.replace(/^\.\.\//,'');
 if(key.endsWith('/')&&fs.existsSync(path.join(root,key))&&fs.statSync(path.join(root,key)).isDirectory()){dynamicRoots.add(key);return key;}
 if(!media.has(key))throw Error('Media missing from manifest: '+key);
 return media.get(key);
});
let scripts=0,styles=0;
let html=read('index.html').toString();
html=html.replace(/<script\b([^>]*?)\bsrc="([^"]+)"([^>]*)>\s*<\/script>/gi,(_,before,name,after)=>{
 const body=embed(read(name).toString());new vm.Script(body,{filename:name});scripts++;
 return `<script${before}${after}>${body.replace(/<\/script/gi,'<\\/script')}</script>`;
});
html=html.replace(/<link\b[^>]*rel="stylesheet"[^>]*href="([^"]+)"[^>]*>/gi,(_,name)=>{
 styles++;return '<style>'+embed(read(name).toString())+'</style>';
});
if(scripts!==manifest.scripts.length||styles!==manifest.styles.length)throw Error('Script or style inventory does not match the page shell.');
if(/<(?:script|link)\b[^>]*(?:src|href)=/i.test(html))throw Error('Standalone export still references local scripts/styles.');
for(const match of html.matchAll(/(?:\.\.\/)?assets\/[A-Za-z0-9_./-]+/g))if(!dynamicRoots.has(match[0]))throw Error('Standalone export still references local file: '+match[0]);
// Preview modules can construct image URLs from a directory and frame number.
// Embed those images too and resolve their src assignments inside this export.
const dynamicMedia={};
const dynamicTypes={'.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.jpg':'image/jpeg','.jpeg':'image/jpeg','.gif':'image/gif'};
function includeDirectory(relative){for(const entry of fs.readdirSync(path.join(root,relative),{withFileTypes:true})){const name=relative+entry.name;if(entry.isDirectory())includeDirectory(name+'/');else{const mime=dynamicTypes[path.extname(name).toLowerCase()];if(mime)dynamicMedia[name]=`data:${mime};base64,${read(name).toString('base64')}`;}}}
for(const prefix of dynamicRoots)includeDirectory(prefix);
if(Object.keys(dynamicMedia).length){
 const resolver='(()=>{const media='+JSON.stringify(dynamicMedia)+',property=Object.getOwnPropertyDescriptor(HTMLImageElement.prototype,"src");Object.defineProperty(HTMLImageElement.prototype,"src",{...property,set(value){property.set.call(this,media[String(value).replace(/^\\.\\.\\//,"")]||value);}});})();';
 new vm.Script(resolver,{filename:'standalone-dynamic-image-resolver'});
 html=html.replace('<head>','<head>\n<script>'+resolver+'</script>');scripts++;
}
// Validate the actual HTML boundaries after escaping inline closing-script text.
const inline=[...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)];
if(inline.length!==scripts)throw Error('Inline script boundaries changed during export.');
inline.forEach((match,index)=>new vm.Script(match[1],{filename:'standalone-script-'+index}));
fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,html);
console.log(JSON.stringify({output,scripts,styles,assets:media.size,dynamicImages:Object.keys(dynamicMedia).length,bytes:Buffer.byteLength(html),sha256:crypto.createHash('sha256').update(html).digest('hex')},null,2));
