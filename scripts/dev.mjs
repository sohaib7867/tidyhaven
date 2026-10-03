import {createServer} from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {watch} from 'node:fs';
import {spawn} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {build} from './build.mjs';
const root=path.resolve(fileURLToPath(new URL('..',import.meta.url)));
await build(root);
const proxy=spawn(process.execPath,[path.join(root,'node_modules/decap-server/dist/index.js')],{cwd:root,env:{...process.env,BIND_HOST:'127.0.0.1',PORT:'8081',ORIGIN:'http://localhost:8080'},stdio:'inherit'});
proxy.on('error',error=>{console.error(error.message);process.exit(1);});
proxy.on('exit',code=>{if(code) {console.error('The local CMS service stopped. Check that port 8081 is available.');process.exit(code);}});
const types={'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml','.webp':'image/webp','.gif':'image/gif'};
const server=createServer(async(req,res)=>{try{
 const url=new URL(req.url,'http://localhost');const rel=decodeURIComponent(url.pathname);const out=path.join(root,'dist');let file=path.resolve(out,'.'+rel);
 if(!file.startsWith(out+path.sep)&&file!==out){res.writeHead(403);res.end();return;}
 if((await stat(file)).isDirectory())file=path.join(file,'index.html');
 const bytes=await readFile(file);res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'});res.end(bytes);
 }catch{res.writeHead(404,{'Content-Type':'text/plain'});res.end('Not found');}});
server.on('error',error=>{console.error(error.message);proxy.kill();process.exit(1);});
server.listen(8080,'127.0.0.1',()=>console.log('Local website: http://localhost:8080/\nLocal admin: http://localhost:8080/admin/\nLocal saves update files on this computer. They do not publish online.'));
let timer,busy=false,again=false;
async function rebuild(){if(busy){again=true;return;}busy=true;try{await build(root);}catch(e){console.error('Build failed:',e.message);}finally{busy=false;if(again){again=false;rebuild();}}}
const watchers=['content','public','templates'].map(dir=>watch(path.join(root,dir),{recursive:true},()=>{clearTimeout(timer);timer=setTimeout(rebuild,500);}));
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>{watchers.forEach(w=>w.close());server.close();proxy.kill();process.exit(0);});
