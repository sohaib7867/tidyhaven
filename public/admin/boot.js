(async function(){
 const status=document.getElementById('status');
 try{
  const response=await fetch('/admin/config.json',{cache:'no-store'});if(!response.ok)throw new Error('The editor configuration could not be loaded.');
  const config=await response.json();
  const local=['localhost','127.0.0.1'].includes(location.hostname);
  if(local){config.local_backend=true;config.backend.repo=config.backend.repo||'local/preview';config.publish_mode='simple';document.getElementById('local-note').hidden=false;}
  else if(!config.backend.repo){status.textContent='Your editor is installed. Connect this site to its GitHub repository and configure GitHub sign-in in Netlify to activate saving and publishing.';return;}
  await new Promise((resolve,reject)=>{const s=document.createElement('script');s.src='/admin/vendor/decap-cms.js';s.onload=resolve;s.onerror=()=>reject(new Error('The editor could not load. Refresh this page to try again.'));document.body.append(s);});
  window.CMS.registerPreviewStyle('/style.css');
  const h=window.h;
  function PostPreview(props){
   const data=props.entry.getIn(['data']).toJS();
   const asset=v=>v?String(props.getAsset(v)):'';
   const blocks=(data.blocks||[]).map((b,i)=>{
    if(b.type==='text')return h('section',{key:i},b.heading?h('h2',{},b.heading):null,props.widgetsFor('blocks').getIn([i,'widgets','body']));
    if(b.type==='image')return h('figure',{key:i},h('img',{src:asset(b.image),alt:b.alt||'',style:{maxWidth:'100%'}}),h('figcaption',{},b.caption||''));
    if(b.type==='product')return h('section',{key:i,className:'product-block'},h('h2',{},b.name||'Product'),b.image?h('img',{src:asset(b.image),alt:b.alt||'',style:{maxWidth:'100%'}}):null,props.widgetsFor('blocks').getIn([i,'widgets','description']),h('span',{className:'button'},b.button||'View product'));
    return null;
   });
   return h('article',{className:'article-body',style:{padding:'30px',maxWidth:'760px',margin:'auto'}},h('p',{className:'post-category'},data.category||''),h('h1',{},data.title||'Your post title'),h('p',{},data.description||''),data.image?h('img',{src:asset(data.image),alt:data.imageAlt||'',style:{maxWidth:'100%',maxHeight:'400px',objectFit:'contain'}}):null,data.affiliate?h('p',{className:'affiliate-note'},'Affiliate links disclosure will appear here.'):null,...blocks);
  }
  window.CMS.registerPreviewTemplate('posts',PostPreview);
  window.CMS.registerPreviewTemplate('homepage',props=>{const d=props.entry.getIn(['data']).toJS();return h('div',{className:'hero-copy',style:{padding:'30px'}},d.logo?h('img',{src:String(props.getAsset(d.logo)),alt:'Logo',style:{width:'65px'}}):null,h('h1',{},(d.headline||[]).join(' ')),h('p',{},d.intro||''),d.heroImage?h('img',{src:String(props.getAsset(d.heroImage)),alt:d.heroAlt||'',style:{maxWidth:'100%'}}):null);});
  document.getElementById('setup').remove();window.CMS.init({config});
 }catch(error){status.textContent=error.message;}
})();
