import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,cp,symlink,readFile,writeFile,rm,access,mkdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import {build} from '../scripts/build.mjs';
import {renderBlock,markdown,safeURL} from '../scripts/render.mjs';
import {cmsConfig} from '../scripts/cms-config.mjs';
const original=process.cwd();
test('create, edit, hide and delete posts rebuild routes and preserve uploads',async()=>{
 const root=await mkdtemp(path.join(tmpdir(),'tidyhavens-test-'));
 try{
  for(const dir of ['public','content','templates'])await cp(path.join(original,dir),path.join(root,dir),{recursive:true});
  await symlink(path.join(original,'node_modules'),path.join(root,'node_modules'),'dir');
  await build(root,{CMS_GITHUB_REPO:'test-owner/test-repository'});
  const existing='dist/blog/japandi-anime-desk-setup/index.html';assert.match(await readFile(path.join(root,existing),'utf8'),/Japandi Meets Anime/);
  await mkdir(path.join(root,'public/uploads'),{recursive:true});await cp(path.join(root,'public/assets/tidyhavens-logo.png'),path.join(root,'public/uploads/example.png'));
  const file=path.join(root,'content/posts/a-new-desk.json');
  const post={title:'A new desk',date:'2026-09-30',description:'New daily post',image:'/uploads/example.png',imageAlt:'Example upload',category:'Desk Gadgets & Accessories',visible:true,affiliate:true,blocks:[{type:'text',heading:'First',body:'**Useful** text'},{type:'image',image:'/uploads/example.png',alt:'Uploaded image',caption:'An example'},{type:'product',name:'Stand',description:'A product',url:'https://example.com/item'}]};
  await writeFile(file,JSON.stringify(post));await build(root,{});
  let page=await readFile(path.join(root,'dist/blog/a-new-desk/index.html'),'utf8');assert.match(page,/Useful<\/strong>/);assert.match(page,/sponsored noopener noreferrer/);assert.match(page,/qualifying purchases/);await access(path.join(root,'dist/uploads/example.png'));
  assert.match(await readFile(path.join(root,'dist/index.html'),'utf8'),/a-new-desk/);
  post.title='Edited title';post.blocks.reverse();await writeFile(file,JSON.stringify(post));await build(root,{});page=await readFile(path.join(root,'dist/blog/a-new-desk/index.html'),'utf8');assert.match(page,/<h1>Edited title<\/h1>/);assert.ok(page.indexOf('class="product-block"')<page.indexOf('class="content-block"'));
  post.visible=false;await writeFile(file,JSON.stringify(post));await build(root,{});await assert.rejects(access(path.join(root,'dist/blog/a-new-desk/index.html')));assert.doesNotMatch(await readFile(path.join(root,'dist/index.html'),'utf8'),/Edited title/);
  await rm(file);await build(root,{});await assert.rejects(access(path.join(root,'dist/content/posts')));
 }finally{await rm(root,{recursive:true,force:true});}
});
test('unsafe markup and product URLs cannot execute',()=>{
 assert.equal(safeURL('javascript:alert(1)'), '');assert.equal(safeURL('//evil.example'),'');assert.equal(safeURL('/../private'),'');
 assert.doesNotMatch(markdown('<script>alert(1)</script>\n[bad](javascript:alert(1))'),/<script|href="javascript:/);
 assert.throws(()=>renderBlock({type:'product',name:'X',url:'javascript:alert(1)'},0));
 assert.match(renderBlock({type:'text',heading:'<img onerror=alert(1)>',body:'Hello'},0),/&lt;img/);
});
test('live admin does not initialize without a configured repository',async()=>{
 const code=await readFile('public/admin/boot.js','utf8');const status={textContent:''};let initialized=false;
 const context={location:{hostname:'my-site.netlify.app'},document:{getElementById:()=>status,createElement:()=>{throw Error('Should not load CMS');}},window:{CMS:{init:()=>{initialized=true;}}},fetch:async()=>({ok:true,json:async()=>cmsConfig('')})};
 await vm.runInNewContext(code,context);assert.equal(initialized,false);assert.match(status.textContent,/Connect this site/);
});
test('CMS fields target source files and use GitHub editorial workflow',()=>{
 const c=cmsConfig('owner/repo');assert.equal(c.backend.name,'github');assert.equal(c.publish_mode,'editorial_workflow');assert.equal(c.local_backend,undefined);assert.equal(c.media_folder,'public/uploads');assert.equal(c.collections[0].format,'json');assert.equal(c.collections[0].folder,'content/posts');assert.equal(c.collections[0].fields.find(f=>f.name==='blocks').types.length,5);
});
test('advertising integrations are included with clear sponsored semantics',async()=>{
 const footer=await readFile('templates/footer.html','utf8');
 assert.match(footer,/container-643b7fea0209b78198418dfbd6fa2446/);
 assert.match(footer,/0aff0b9ce2e405fd5fc7b41ca12bf686\.js/);
 assert.match(footer,/key=b781f8203a11f6f9fb944008dbdf27e2/);
 assert.match(footer,/rel="sponsored noopener noreferrer"/);
 assert.match(footer,/Advertisement/);
});
