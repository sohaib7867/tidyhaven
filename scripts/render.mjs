import MarkdownIt from 'markdown-it';
import sanitize from 'sanitize-html';
export const escape = value => String(value ?? '').replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function safeURL(value, {image=false}={}) {
 const s=String(value??'').trim();
 if(!s || /[\u0000-\u0020\\]/.test(s)) return '';
 if(s.startsWith('/')&&!s.startsWith('//')&&!s.includes('..')) return s;
 try{const u=new URL(s);if(u.protocol==='https:'&&!u.username&&!u.password)return u.href;}catch{}
 return '';
}
const md=new MarkdownIt({html:false,linkify:true,typographer:true});
export function markdown(value){return sanitize(md.render(String(value??'')),{allowedTags:[...sanitize.defaults.allowedTags,'img'],allowedAttributes:{a:['href','title','rel'],img:['src','alt','title','loading']},allowedSchemes:['https'],allowProtocolRelative:false,transformTags:{a:(tag,a)=>({tagName:'a',attribs:{...a,rel:'noopener noreferrer sponsored'}}),img:(tag,a)=>({tagName:'img',attribs:{...a,src:safeURL(a.src,{image:true}),loading:'lazy'}})}});}
export function renderBlock(b,index){
 if(!b || !['text','image','product'].includes(b.type))throw new Error('Unknown article block');
 const heading=b.heading||b.name;
 const h=heading?`<h2 id="section-${index+1}">${escape(heading)}</h2>`:'';
 if(b.type==='text')return `<section class="content-block">${h}${markdown(b.body)}</section>`;
 if(b.type==='image'){const src=safeURL(b.image,{image:true});if(!src)throw new Error('Invalid image URL');return `<figure class="content-image"><img src="${escape(src)}" alt="${escape(b.alt)}" loading="lazy">${b.caption?`<figcaption>${escape(b.caption)}</figcaption>`:''}</figure>`;}
 const url=safeURL(b.url);if(!url)throw new Error('Invalid product link');
 const src=b.image?safeURL(b.image,{image:true}):'';
 return `<section class="product-block">${h}${src?`<img src="${escape(src)}" alt="${escape(b.alt||b.name)}" loading="lazy">`:''}${markdown(b.description)}<a class="button" href="${escape(url)}" target="_blank" rel="sponsored noopener noreferrer">${escape(b.button||'View product')}</a></section>`;
}
export function card(p){return `<article class="blog-card"><a class="blog-image-link" href="/blog/${p.slug}/" aria-label="Read ${escape(p.title)}"><img src="${escape(safeURL(p.image,{image:true}))}" alt="${escape(p.imageAlt)}" loading="lazy"></a><div class="blog-card-copy"><p class="post-category">${escape(p.category)}</p><h3><a href="/blog/${p.slug}/">${escape(p.title)}</a></h3><p>${escape(p.description)}</p><a class="read-guide" href="/blog/${p.slug}/">Read the guide</a></div></article>`;}
export function applyTemplate(template, values){return template.replace(/\{\{([a-zA-Z]+)\}\}/g,(_,key)=>{if(!(key in values))throw new Error(`Missing template variable: ${key}`);return values[key];});}
export function pageHead(title,description){return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(title)} | TidyHavens</title><meta name="description" content="${escape(description)}"><link rel="icon" href="/assets/tidyhavens-logo.png"><link rel="stylesheet" href="/style.css"></head><body>`;}
export function article(p,header,footer,other){
 const contents=p.blocks.map((b,i)=>b.heading||b.name?`<li><a href="#section-${i+1}">${escape(b.heading||b.name)}</a></li>`:'').join('');
 return `${pageHead(p.title,p.description)}<a class="skip" href="#article">Skip to article</a>${header}<main id="article" class="article-page"><a class="back-link" href="/blog/">All guides</a><div class="article-heading"><p class="post-category">${escape(p.category)}</p><h1>${escape(p.title)}</h1><p class="article-deck">${escape(p.description)}</p><p class="byline">By TidyHavens · <time datetime="${escape(p.date)}">${new Date(p.date+'T12:00:00Z').toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric',timeZone:'UTC'})}</time></p></div><div class="article-layout"><aside class="article-aside"><figure><img src="${escape(safeURL(p.image,{image:true}))}" alt="${escape(p.imageAlt)}"><figcaption>The inspiration behind this guide.</figcaption></figure>${contents?`<nav class="contents" aria-label="In this guide"><strong>In this guide</strong><ol>${contents}</ol></nav>`:''}</aside><article class="article-body">${p.affiliate?'<p class="affiliate-note">This post contains affiliate links. We may earn a commission from qualifying purchases. As an Amazon Associate I earn from qualifying purchases.</p>':''}${p.blocks.map(renderBlock).join('')}${other?`<section class="related-guide"><p class="eyebrow">READ NEXT</p><h2><a href="/blog/${other.slug}/">${escape(other.title)}</a></h2><a class="read-guide" href="/blog/${other.slug}/">Read the guide</a></section>`:''}</article></div></main>${footer}</body></html>`;
}
