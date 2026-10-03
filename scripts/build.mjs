import {readFile,writeFile,readdir,mkdir,rm,cp,stat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {escape,safeURL,applyTemplate,card,article,pageHead} from './render.mjs';
import {cmsConfig} from './cms-config.mjs';
export async function build(root=path.resolve(fileURLToPath(new URL('..',import.meta.url))),env=process.env){
 const read=async p=>readFile(path.join(root,p),'utf8');
 const settings=JSON.parse(await read('content/settings.json'));
 const siteUrl=String(env.URL||env.DEPLOY_PRIME_URL||settings.siteUrl||'https://tidyhaven.netlify.app').replace(/\/$/,'');
 if(!/^https:\/\/[A-Za-z0-9.-]+(?::\d+)?$/.test(siteUrl))throw new Error('Invalid site URL');
 for(const key of ['heroImage','logo','pinterest'])if(!safeURL(settings[key]))throw new Error(`Invalid ${key}`);
 if(!Array.isArray(settings.headline)||!settings.headline.length)throw new Error('Headline lines are required');
 const files=(await readdir(path.join(root,'content/posts'))).filter(n=>n.endsWith('.json'));
 const posts=await Promise.all(files.map(async filename=>{
  const slug=filename.slice(0,-5);if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug))throw new Error('Invalid article filename');
  const p=JSON.parse(await read('content/posts/'+filename));
  if(!p.title||!p.description||!p.imageAlt||!safeURL(p.image)||!Array.isArray(p.blocks))throw new Error(`Missing required content: ${slug}`);
  if(!/^\d{4}-\d{2}-\d{2}$/.test(p.date)||new Date(p.date+'T12:00:00Z').toISOString().slice(0,10)!==p.date)throw new Error(`Invalid date: ${slug}`);
  return {...p,slug};
 }));
 const visible=posts.filter(p=>p.visible!==false).sort((a,b)=>b.date.localeCompare(a.date)||a.title.localeCompare(b.title));
 const vars={logo:escape(settings.logo),pinterest:escape(settings.pinterest)};
 const header=applyTemplate(await read('templates/header.html'),vars),footer=applyTemplate(await read('templates/footer.html'),vars);
 const listed=visible.filter(p=>p.showCard!==false);
 const section=`<section id="blog" class="blog-section" aria-labelledby="blog-title"><div class="section-head"><div><p class="eyebrow">THE TIDYHAVENS JOURNAL</p><h2 id="blog-title">Blog &amp; Guides</h2></div><a class="read-guide" href="/blog/">All guides</a></div><div class="blog-grid">${listed.slice(0,6).map(card).join('')||'<p>New guides are on the way.</p>'}</div></section>`;
 let home=applyTemplate(await read('templates/home.html'),{...vars,header,footer,headline:settings.headline.map((x,i)=>i===settings.headline.length-1?`<em>${escape(x)}</em>`:escape(x)).join('<br>'),intro:escape(settings.intro),heroImage:escape(settings.heroImage),heroAlt:escape(settings.heroAlt),blogSection:section});
 const rendered=visible.map((p,i)=>({slug:p.slug,html:article(p,header,footer,visible[(i+1)%visible.length]!==p?visible[(i+1)%visible.length]:null,siteUrl)}));
 const homeDescription='Desk setup inspiration, practical home office ideas and cozy anime room decor from TidyHavens.';
 const homeHead=pageHead('TidyHavens',homeDescription,{url:siteUrl+'/',image:new URL(settings.heroImage,siteUrl).href,json:[{'@context':'https://schema.org','@type':'WebSite',name:'TidyHavens',url:siteUrl+'/',description:homeDescription},{'@context':'https://schema.org','@type':'Organization',name:'TidyHavens',url:siteUrl+'/',logo:siteUrl+'/assets/tidyhavens-logo.png',sameAs:[settings.pinterest]}]}).replace(/<body>$/,'');
 home=home.replace(/^<!doctype html>[\s\S]*?<body>/,homeHead+'<body>');
 // Validate all content before replacing output. Source and drafts never enter dist.
 const out=path.join(root,'dist');await rm(out,{recursive:true,force:true});await cp(path.join(root,'public'),out,{recursive:true});
 await writeFile(path.join(out,'index.html'),home);
 await mkdir(path.join(out,'blog'),{recursive:true});
 await writeFile(path.join(out,'blog/index.html'),`${pageHead('Blog & Guides','Practical desk setup, home office and anime room decor guides from TidyHavens.',{url:siteUrl+'/blog/',image:new URL(settings.heroImage,siteUrl).href})}<a class="skip" href="#blog">Skip to guides</a>${header}<main class="blog-archive">${section}</main>${footer}</body></html>`);
 for(const p of rendered){await mkdir(path.join(out,'blog',p.slug),{recursive:true});await writeFile(path.join(out,'blog',p.slug,'index.html'),p.html);}
 const sitemap=[{loc:siteUrl+'/',lastmod:visible[0]?.date},{loc:siteUrl+'/blog/',lastmod:visible[0]?.date},...visible.map(p=>({loc:`${siteUrl}/blog/${p.slug}/`,lastmod:p.date}))];
 await writeFile(path.join(out,'sitemap.xml'),`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemap.map(x=>`  <url><loc>${escape(x.loc)}</loc>${x.lastmod?`<lastmod>${x.lastmod}</lastmod>`:''}</url>`).join('\n')}\n</urlset>\n`);
 await writeFile(path.join(out,'robots.txt'),`User-agent: *\nAllow: /\nDisallow: /admin/\n\nSitemap: ${siteUrl}/sitemap.xml\n`);
 let repo=env.CMS_GITHUB_REPO||'';
 if(!repo&&env.REPOSITORY_URL){const m=env.REPOSITORY_URL.match(/github\.com[:/]([^/]+\/[^/]+?)(?:\.git)?$/);if(m)repo=m[1];}
 if(repo&&!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repo))throw new Error('CMS_GITHUB_REPO must be owner/repository');
 await writeFile(path.join(out,'admin/config.json'),JSON.stringify(cmsConfig(repo,env.CMS_BRANCH||'main'),null,2));
 const cmsDir=path.join(root,'node_modules/decap-cms/dist');
 const cmsFiles=(await readdir(cmsDir)).filter(x=>!x.endsWith('.map'));
 await mkdir(path.join(out,'admin/vendor'),{recursive:true});
 for(const f of cmsFiles)await cp(path.join(cmsDir,f),path.join(out,'admin/vendor',f),{recursive:true});
 await writeFile(path.join(out,'404.html'),`${pageHead('Page not found','This page is not available.',{url:siteUrl+'/404.html'}).replace('<meta name="robots" content="index,follow,max-image-preview:large">','<meta name="robots" content="noindex,follow">')}<main class="article-page"><h1>Page not found</h1><p>This guide may have moved or been unpublished.</p><a class="button" href="/blog/">Browse the guides</a></main></body></html>`);
 console.log(`Built ${visible.length} published articles and the admin editor. ${repo?'GitHub repository configured.':'Live admin awaits the GitHub repository configuration.'}`);
 return {posts:visible.length};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))await build();
