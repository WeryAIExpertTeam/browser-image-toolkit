/* ================== 通用工具 ================== */
const $=(id)=>document.getElementById(id);
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function requireZip(){if(window.JSZip)return true;toast('ZIP library unavailable. Reload the page and try again.');return false}
function toast(m,ms=2400){const t=$('toast');t.textContent=m;t.classList.add('show');clearTimeout(toast._t);toast._t=setTimeout(()=>t.classList.remove('show'),ms)}
function fmtSize(n){if(n<1024)return n+' B';if(n<1024*1024)return (n/1024).toFixed(1)+' KB';return (n/1024/1024).toFixed(2)+' MB'}
function fmtTime(s){return s<60?s.toFixed(1)+'s':Math.floor(s/60)+'m'+Math.floor(s%60)+'s'}
function loadImg(src){return new Promise((res,rej)=>{const i=new Image();i.onload=()=>res(i);i.onerror=rej;i.src=src})}
function fileToImg(file){return new Promise((res,rej)=>{const r=new FileReader();r.onload=async e=>{try{res(await loadImg(e.target.result))}catch(err){rej(err)}};r.onerror=rej;r.readAsDataURL(file)})}
function dlBlob(blob,name){const u=URL.createObjectURL(blob);const a=document.createElement('a');a.href=u;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(u),400)}
function dlCanvas(c,name,type='image/png',q){c.toBlob(b=>dlBlob(b,name),type,q)}
function ease(t,type){
  if(type==='linear')return t;
  if(type==='quad')return t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2;
  if(type==='in')return t*t*t;
  if(type==='out')return 1-Math.pow(1-t,3);
  return t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;
}

/* Tab 切换 + breadcrumb */
const tabNames={collage:'Collage',compress:'Compress images',cropper:'Grid crop',compare:'Before / after',cover:'Cover maker',bgremove:'Remove background'};
document.querySelectorAll('.nav-item[data-tab]').forEach(item=>{
  item.addEventListener('click',()=>{
    document.querySelectorAll('.nav-item').forEach(x=>x.classList.remove('active'));
    document.querySelectorAll('.tab-pane').forEach(x=>x.classList.remove('active'));
    item.classList.add('active');
    const id=item.dataset.tab;
    $('tab-'+id).classList.add('active');
    $('bread-cur').textContent=tabNames[id];
  });
});

function bindSeg(el,cb){el.querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{el.querySelectorAll('button').forEach(x=>x.classList.remove('on'));b.classList.add('on');cb&&cb(b.dataset.v)}))}
function bindChips(el,cb,multi=false){
  el.querySelectorAll('.chip').forEach(c=>c.addEventListener('click',()=>{
    if(!multi){el.querySelectorAll('.chip').forEach(x=>x.classList.remove('on'));c.classList.add('on')}
    else c.classList.toggle('on');
    cb&&cb(c);
  }));
}
function bindDrop(dropEl,inputEl,onFiles,opt={}){
  const accept=opt.accept;const multi=opt.multi!==false;
  dropEl.addEventListener('click',()=>inputEl.click());
  dropEl.addEventListener('dragover',e=>{e.preventDefault();dropEl.classList.add('over')});
  dropEl.addEventListener('dragleave',()=>dropEl.classList.remove('over'));
  dropEl.addEventListener('drop',e=>{e.preventDefault();dropEl.classList.remove('over');let fs=[...e.dataTransfer.files];if(accept)fs=fs.filter(f=>f.type.startsWith(accept+'/')||(accept==='image'&&/\.(heic|heif)$/i.test(f.name)));if(fs.length)onFiles(multi?fs:[fs[0]])});
  inputEl.addEventListener('change',e=>{const fs=[...e.target.files];if(fs.length)onFiles(multi?fs:[fs[0]]);e.target.value=''});
}

/* ================================================================
   1. Collage
   ================================================================ */
(function(){
  const images=[];let mode='grid';let labelPos='tl';let scale=1;
  const $drop=$('cl-drop'),$input=$('cl-input'),$inputF=$('cl-input-folder'),$thumbs=$('cl-thumbs'),$count=$('cl-count'),$prev=$('cl-preview');
  bindSeg($('cl-mode'),v=>{mode=v;$('cl-grid-only').style.display=v==='grid'?'grid':'none';render()});
  bindSeg($('cl-scale'),v=>{scale=+v;render()});
  bindSeg($('cl-lbl-pos'),v=>{labelPos=v;render()});
  bindChips($('cl-preset'),c=>{$('cl-cellw').value=c.dataset.cw;$('cl-cellh').value=c.dataset.ch;render()});

  bindDrop($drop,$input,addFiles,{accept:'image'});
  $('cl-pick-file').onclick=e=>{e.stopPropagation();$input.click()};
  $('cl-pick-folder').onclick=e=>{e.stopPropagation();$inputF.click()};
  $inputF.addEventListener('change',e=>{const fs=[...e.target.files].filter(f=>f.type.startsWith('image/'));if(fs.length)addFiles(fs);e.target.value=''});

  async function addFiles(fs){
    if(fs.length>30)toast(`Adding ${fs.length} images…`,1500);
    for(const f of fs){
      try{const img=await fileToImg(f);images.push({file:f,img,name:f.name,size:f.size})}
      catch(e){console.error(e)}
    }
    renderThumbs();render();
  }

  $('cl-clear').onclick=()=>{images.length=0;renderThumbs();render()};
  $('cl-quality').addEventListener('input',e=>$('cl-qv').textContent=(+e.target.value).toFixed(2));
  ['cl-cellw','cl-cellh','cl-cols','cl-gap','cl-fit','cl-bg','cl-quality','cl-lbl-idx','cl-lbl-name','cl-lbl-start','cl-lbl-size','cl-lbl-fg','cl-lbl-bg','cl-lbl-pad'].forEach(id=>$(id).addEventListener('input',render));
  $('cl-sort').addEventListener('change',()=>{sortImages();renderThumbs();render()});

  function sortImages(){
    const m=$('cl-sort').value;
    if(m==='name-asc')images.sort((a,b)=>a.name.localeCompare(b.name));
    else if(m==='name-desc')images.sort((a,b)=>b.name.localeCompare(a.name));
    else if(m==='size-desc')images.sort((a,b)=>b.size-a.size);
    else if(m==='random')images.sort(()=>Math.random()-.5);
  }

  // Drag reorder in thumbnails
  let dragIdx=null;
  function renderThumbs(){
    $count.textContent=images.length;
    $thumbs.innerHTML='';
    images.forEach((it,i)=>{
      const d=document.createElement('div');d.className='thumb';d.draggable=true;
      d.innerHTML=`<img src="${it.img.src}" loading="lazy"><div class="idx">${i+1}</div><button class="x" data-i="${i}">×</button><div class="nm" translate="no">${escapeHtml(it.name)}</div>`;
      d.addEventListener('dragstart',()=>{dragIdx=i;d.classList.add('dragging')});
      d.addEventListener('dragend',()=>d.classList.remove('dragging'));
      d.addEventListener('dragover',e=>e.preventDefault());
      d.addEventListener('drop',e=>{e.preventDefault();if(dragIdx==null||dragIdx===i)return;const[m]=images.splice(dragIdx,1);images.splice(i,0,m);dragIdx=null;renderThumbs();render()});
      $thumbs.appendChild(d);
    });
    $thumbs.querySelectorAll('.x').forEach(b=>b.onclick=e=>{e.stopPropagation();images.splice(+b.dataset.i,1);renderThumbs();render()});
  }

  function drawImageFit(ctx,img,x,y,w,h,fit){
    if(fit==='cover'){
      const ir=img.width/img.height,br=w/h;
      let sw=img.width,sh=img.height,sx=0,sy=0;
      if(ir>br){sw=img.height*br;sx=(img.width-sw)/2}else{sh=img.width/br;sy=(img.height-sh)/2}
      ctx.drawImage(img,sx,sy,sw,sh,x,y,w,h);
    } else {
      const ir=img.width/img.height,br=w/h;
      let dw=w,dh=h,dx=x,dy=y;
      if(ir>br){dh=w/ir;dy=y+(h-dh)/2}else{dw=h*ir;dx=x+(w-dw)/2}
      ctx.drawImage(img,dx,dy,dw,dh);
    }
  }

  function drawLabel(ctx,x,y,w,h,idx,name){
    const showIdx=$('cl-lbl-idx').checked, showName=$('cl-lbl-name').checked;
    if(!showIdx&&!showName)return;
    const pad=+$('cl-lbl-pad').value*scale;
    const fs=+$('cl-lbl-size').value*scale;
    const fg=$('cl-lbl-fg').value, bg=$('cl-lbl-bg').value;
    ctx.save();ctx.font=`600 ${fs}px Inter, sans-serif`;ctx.textBaseline='top';
    const lines=[];
    if(showIdx)lines.push(String(+$('cl-lbl-start').value+idx-1));
    if(showName)lines.push(name.length>26?name.slice(0,24)+'…':name);
    if(!lines.length){ctx.restore();return}
    const tw=Math.max(...lines.map(l=>ctx.measureText(l).width));
    const th=lines.length*fs*1.15;
    let bx,by;
    if(labelPos==='tl'){bx=x+pad;by=y+pad}
    else if(labelPos==='tr'){bx=x+w-pad-tw-pad;by=y+pad}
    else if(labelPos==='bl'){bx=x+pad;by=y+h-pad-th}
    else{bx=x+w-pad-tw-pad;by=y+h-pad-th}
    ctx.fillStyle=bg;ctx.globalAlpha=.8;ctx.fillRect(bx,by,tw+pad,th+pad*.4);ctx.globalAlpha=1;
    ctx.fillStyle=fg;
    lines.forEach((l,i)=>ctx.fillText(l,bx+pad/2,by+pad*.2+i*fs*1.15));
    ctx.restore();
  }

  let renderTimer;
  function render(){
    clearTimeout(renderTimer);
    renderTimer=setTimeout(_render,30);
  }
  function _render(){
    if(!images.length){
      $prev.innerHTML=`<div class="empty"><svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="6" y="6" width="22" height="22" rx="2"/><rect x="36" y="10" width="22" height="22" rx="2"/><rect x="10" y="36" width="22" height="22" rx="2"/><rect x="40" y="40" width="18" height="18" rx="2"/></svg><div class="empty-title">Add images to start a collage</div></div>`;
      return;
    }
    const cw0=+$('cl-cellw').value, ch0=+$('cl-cellh').value;
    const cw=cw0*scale, ch=ch0*scale;
    const gap=Math.max(0,+$('cl-gap').value*scale);
    const cols=mode==='hconcat'?images.length:mode==='vconcat'?1:Math.max(1,+$('cl-cols').value);
    const rows=Math.ceil(images.length/cols);
    const W=cols*cw+(cols-1)*gap, H=rows*ch+(rows-1)*gap;
    const c=document.createElement('canvas');c.width=W;c.height=H;
    const ctx=c.getContext('2d');
    ctx.fillStyle=$('cl-bg').value;ctx.fillRect(0,0,W,H);
    images.forEach((it,i)=>{
      const r=Math.floor(i/cols),col=i%cols;
      const x=col*(cw+gap),y=r*(ch+gap);
      drawImageFit(ctx,it.img,x,y,cw,ch,$('cl-fit').value);
      drawLabel(ctx,x,y,cw,ch,i+1,it.name);
    });
    $prev.innerHTML='';
    c.style.maxWidth='100%';c.style.height='auto';
    $prev.appendChild(c);
    $prev._canvas=c;
  }

  $('cl-export').onclick=()=>{
    if(!images.length)return toast('Add an image first');
    const c=$prev._canvas;if(!c)return;
    dlCanvas(c,`collage-${Date.now()}.png`);
  };
  $('cl-export-each').onclick=async()=>{
    if(!images.length)return toast('Add an image first');
    if(!requireZip())return;const zip=new JSZip();
    const cw=+$('cl-cellw').value*scale, ch=+$('cl-cellh').value*scale;
    for(let i=0;i<images.length;i++){
      const c=document.createElement('canvas');c.width=cw;c.height=ch;
      const ctx=c.getContext('2d');
      ctx.fillStyle=$('cl-bg').value;ctx.fillRect(0,0,cw,ch);
      drawImageFit(ctx,images[i].img,0,0,cw,ch,$('cl-fit').value);
      drawLabel(ctx,0,0,cw,ch,i+1,images[i].name);
      const b=await new Promise(r=>c.toBlob(r,'image/png'));
      zip.file(`${String(i+1).padStart(3,'0')}.png`,b);
    }
    dlBlob(await zip.generateAsync({type:'blob'}),`collage-numbered-${Date.now()}.zip`);
    toast('Numbered ZIP exported');
  };
})();

/* ================================================================
   2. Compress images (Web Worker pool)
   ================================================================ */
(function(){
  const list=[]; const results=new Map();
  let workerPool=null;
  const $drop=$('cp-drop'),$input=$('cp-input'),$count=$('cp-count'),$listBox=$('cp-list'),$prog=$('cp-prog');

  $('cp-quality').addEventListener('input',e=>$('cp-qv').textContent=(+e.target.value).toFixed(2));
  $('cp-concurrency').addEventListener('input',e=>$('cp-cv').textContent=e.target.value);

  bindDrop($drop,$input,addFiles,{accept:'image'});
  async function addFiles(fs){
    if(fs.length>20)toast(`Added ${fs.length} files`,1500);
    for(const f of fs){
      let file=f;
      if(/\.(heic|heif)$/i.test(f.name)){
        try{file=await convertHeic(f)}catch(e){console.error(e);toast('HEIC could not be decoded. Try a different image or export it as JPEG first.',6000);continue}
      }
      list.push({file,name:file.name,size:f.size,origName:f.name});
    }
    renderList();
  }

  async function convertHeic(file){
    if(!window.heic2any){
      await new Promise((res,rej)=>{const s=document.createElement('script');s.src='https://cdn.jsdelivr.net/npm/heic2any@0.0.4/dist/heic2any.min.js';s.onload=res;s.onerror=rej;document.head.appendChild(s)});
    }
    const blob=await window.heic2any({blob:file,toType:'image/jpeg',quality:.95});
    const b=Array.isArray(blob)?blob[0]:blob;
    return new File([b],file.name.replace(/\.(heic|heif)$/i,'.jpg'),{type:'image/jpeg'});
  }

  $('cp-clear').onclick=()=>{list.forEach(it=>{if(it.previewUrl)URL.revokeObjectURL(it.previewUrl)});list.length=0;results.clear();renderList();$('cp-stats').style.display='none';$prog.style.width='0%';$('cp-status').textContent='Ready';$('cp-empty').style.display='flex';$('cp-download').disabled=true};

  function renderList(){
    $count.textContent=list.length;$('cp-download').disabled=![...results.values()].some(r=>!r.error);
    $('cp-empty').style.display=list.length?'none':'flex';
    $listBox.innerHTML='';
    list.forEach((it,i)=>{
      const r=results.get(i);
      const row=document.createElement('div');row.className='list-row';
      const url=it.previewUrl||(it.previewUrl=URL.createObjectURL(it.file));
      let newPart=r?.error?'<span class="meta error">'+escapeHtml('Compression failed: '+r.error)+'</span>':'';
      if(r&&!r.error){
        const saved=((1-r.size/it.size)*100).toFixed(0);
        newPart=`<span class="size-chip ${r.size<it.size?'new':'bad'}">${fmtSize(r.size)}</span> <span class="meta">${saved>0?'Saved':'Larger'} ${Math.abs(saved)}%</span>`;
        if(r.w)newPart+=` <span class="meta">${r.w}×${r.h}</span>`;
      }
      row.innerHTML=`<img src="${url}" loading="lazy">
        <div><div class="name" translate="no">${escapeHtml(it.name)}</div><div class="sub"><span class="size-chip">${fmtSize(it.size)}</span> ${newPart}</div></div>
        ${r&&!r.error?`<button class="btn btn-ghost btn-sm" data-dl="${i}">Download</button>`:'<span></span>'}
        <button class="btn btn-ghost btn-sm" data-rm="${i}">×</button>`;
      $listBox.appendChild(row);
    });
    $listBox.querySelectorAll('button[data-rm]').forEach(b=>b.onclick=()=>{if($('cp-run').disabled)return;const [removed]=list.splice(+b.dataset.rm,1);if(removed.previewUrl)URL.revokeObjectURL(removed.previewUrl);results.clear();renderList()});
    $listBox.querySelectorAll('button[data-dl]').forEach(b=>b.onclick=()=>{
      const i=+b.dataset.dl, r=results.get(i);if(!r||r.error)return;
      const ext=r.type.split('/')[1].replace('jpeg','jpg');
      dlBlob(r.blob,list[i].name.replace(/\.[^.]+$/,'')+'.'+ext);
    });
  }

  // Worker pool with OffscreenCanvas
  function initWorkers(n){
    if(workerPool&&workerPool.length===n)return;
    if(workerPool)workerPool.forEach(w=>w.worker.terminate());
    const code=`self.onmessage=async(e)=>{
      const{id,buf,name,quality,maxSide,format,target,strategy,fileType}=e.data;
      try{
        const blob0=new Blob([buf],{type:fileType});
        const bmp=await createImageBitmap(blob0);
        let w=bmp.width,h=bmp.height;
        if(maxSide>0&&Math.max(w,h)>maxSide){const s=maxSide/Math.max(w,h);w=Math.round(w*s);h=Math.round(h*s)}
        const c=new OffscreenCanvas(w,h);
        const ctx=c.getContext('2d');
        ctx.drawImage(bmp,0,0,w,h);bmp.close();
        let type=format==='auto'?(strategy==='smart'&&blob0.type==='image/png'?'image/webp':blob0.type):format;
        if(!['image/jpeg','image/png','image/webp'].includes(type))type='image/jpeg';
        let q=quality;
        let blob=await c.convertToBlob({type,quality:q});
        if(target>0&&type!=='image/png'){
          let lo=.1,hi=.98,iter=0;
          while(iter<7&&Math.abs(blob.size/1024-target)>target*.08){
            if(blob.size/1024>target)hi=q;else lo=q;
            q=(lo+hi)/2;
            blob=await c.convertToBlob({type,quality:q});
            iter++;
          }
        }
        self.postMessage({id,ok:1,blob,size:blob.size,w,h,type,quality:q});
      }catch(err){self.postMessage({id,ok:0,error:err.message})}
    }`;
    const url=URL.createObjectURL(new Blob([code],{type:'application/javascript'}));
    workerPool=Array.from({length:n},()=>({worker:new Worker(url),busy:false}));
    URL.revokeObjectURL(url);
  }

  function runWorker(w,task){
    return new Promise((res,rej)=>{
      const id=Math.random();
      w.worker.onmessage=e=>{
        if(e.data.id!==id)return;
        if(e.data.ok)res(e.data);else rej(new Error(e.data.error));
      };
      const reader=new FileReader();
      reader.onload=()=>w.worker.postMessage({id,buf:reader.result,...task,fileType:task.file.type},[reader.result]);
      reader.onerror=()=>rej(new Error('Could not read file'));w.worker.onerror=e=>rej(new Error(e.message||'Worker failed'));reader.readAsArrayBuffer(task.file);
    });
  }

  $('cp-run').onclick=async()=>{
    if(!list.length)return toast('Add files first');
    $('cp-run').disabled=true;$('cp-clear').disabled=true;$('cp-drop').style.pointerEvents='none';
    const concurrency=+$('cp-concurrency').value;
    const opts={
      quality:+$('cp-quality').value,
      maxSide:$('cp-resize-on').checked?+$('cp-maxside').value:0,
      target:$('cp-target-on').checked?+$('cp-target').value:0,
      format:$('cp-format').value,
      strategy:$('cp-strategy').value
    };
    // adjust quality per strategy
    if(opts.strategy==='quality')opts.quality=Math.max(opts.quality,.9);
    else if(opts.strategy==='size')opts.quality=Math.min(opts.quality,.7);

    try{initWorkers(concurrency)}catch(e){$('cp-run').disabled=false;$('cp-clear').disabled=false;$('cp-drop').style.pointerEvents='';toast('Image workers are unavailable in this browser. Try current Chrome or Edge.',6000);return}
    results.clear();renderList();
    const t0=performance.now();
    let done=0;
    const queue=list.map((it,i)=>({i,task:{file:it.file,name:it.name,...opts}}));
    $('cp-stats').style.display='flex';

    async function loop(w){
      while(queue.length){
        const item=queue.shift();
        try{
          const r=await runWorker(w,item.task);
          results.set(item.i,r);
        }catch(e){
          results.set(item.i,{blob:list[item.i].file,size:list[item.i].size,type:list[item.i].file.type,error:e.message});
        }
        done++;
        $prog.style.width=(done/list.length*100)+'%';
        $('cp-status').textContent=`Processing ${done}/${list.length}`;
        if(done%2===0||done===list.length)renderList();
      }
    }
    await Promise.all(workerPool.map(loop));
    const elapsed=((performance.now()-t0)/1000);
    let to=0,tn=0;for(const[i,r]of results){to+=list[i].size;tn+=r.size}
    $('cp-stat-total').textContent=list.length;
    $('cp-stat-orig').textContent=fmtSize(to);
    $('cp-stat-new').textContent=fmtSize(tn);
    $('cp-stat-save').textContent=to?((1-tn/to)*100).toFixed(1)+'%':'0%';
    $('cp-stat-time').textContent=fmtTime(elapsed);
    const failed=[...results.values()].filter(r=>r.error).length;
    $('cp-status').textContent=failed?`Finished with ${failed} error(s) · ${fmtTime(elapsed)}`:`Done · ${fmtTime(elapsed)}`;
    $('cp-download').disabled=false;
    document.querySelector('#tab-compress .progress').classList.add('done');
    setTimeout(()=>document.querySelector('#tab-compress .progress').classList.remove('done'),500);
    renderList();
    const dl=$('cp-dlmode').value;
    if(dl==='each'||dl==='both'){
      for(const[i,r]of results){
      if(r.error)continue;
        const ext=r.type.split('/')[1].replace('jpeg','jpg');
        dlBlob(r.blob,list[i].name.replace(/\.[^.]+$/,'')+'.'+ext);
        await new Promise(r=>setTimeout(r,80));
      }
    }
    $('cp-run').disabled=false;$('cp-clear').disabled=false;$('cp-drop').style.pointerEvents='';toast('Compression complete');
  };
  $('cp-download').onclick=async()=>{
    if(!requireZip())return;const zip=new JSZip();
    for(const[i,r]of results){
      if(r.error)continue;
      const ext=r.type.split('/')[1].replace('jpeg','jpg');
      zip.file(list[i].name.replace(/\.[^.]+$/,'')+'.'+ext,r.blob);
    }
    dlBlob(await zip.generateAsync({type:'blob'}),`compressed-${Date.now()}.zip`);
  };
})();

/* ================================================================
   3. Grid crop
   ================================================================ */
(function(){
  let loaded=null,scale=1;
  bindDrop($('cr-drop'),$('cr-input'),async fs=>{loaded=await fileToImg(fs[0]);init()},{accept:'image',multi:false});
  ['cr-rows','cr-cols','cr-pw','cr-ph','cr-ox','cr-oy'].forEach(id=>$(id).addEventListener('input',drawGrid));
  $('cr-auto').onclick=()=>{
    if(!loaded)return;
    let pw=+$('cr-pw').value, ph=+$('cr-ph').value;
    const c=+$('cr-cols').value, r=+$('cr-rows').value;
    if(!pw)pw=Math.floor(loaded.width/c);
    if(!ph)ph=Math.floor(loaded.height/r);
    $('cr-pw').value=Math.floor(loaded.width/c);$('cr-ph').value=Math.floor(loaded.height/r);
    $('cr-ox').value=0;$('cr-oy').value=0;drawGrid();
  };
  $('cr-center').onclick=()=>{
    if(!loaded)return;
    const tw=(+$('cr-cols').value)*(+$('cr-pw').value),th=(+$('cr-rows').value)*(+$('cr-ph').value);
    $('cr-ox').value=Math.max(0,Math.floor((loaded.width-tw)/2));
    $('cr-oy').value=Math.max(0,Math.floor((loaded.height-th)/2));
    drawGrid();
  };
  function init(){
    $('cr-pw').value=Math.floor(loaded.width/(+$('cr-cols').value));
    $('cr-ph').value=Math.floor(loaded.height/(+$('cr-rows').value));
    $('cr-ox').value=0;$('cr-oy').value=0;
    $('cr-run').disabled=false;
    drawPreview();drawGrid();
  }
  function drawPreview(){
    const maxW=900;scale=Math.min(1,maxW/loaded.width);
    const w=Math.round(loaded.width*scale),h=Math.round(loaded.height*scale);
    const stack=document.createElement('div');stack.className='canvas-stack';
    const c=document.createElement('canvas');c.width=w;c.height=h;c.getContext('2d').drawImage(loaded,0,0,w,h);
    const g=document.createElement('canvas');g.width=w;g.height=h;g.className='grid-overlay';
    stack.appendChild(c);stack.appendChild(g);
    $('cr-preview').innerHTML='';$('cr-preview').appendChild(stack);
    drawPreview._g=g;
  }
  function drawGrid(){
    if(!loaded||!drawPreview._g)return;
    const g=drawPreview._g,ctx=g.getContext('2d');
    const rows=+$('cr-rows').value,cols=+$('cr-cols').value;
    const pw=+$('cr-pw').value,ph=+$('cr-ph').value,ox=+$('cr-ox').value,oy=+$('cr-oy').value;
    ctx.clearRect(0,0,g.width,g.height);
    const s=scale,gx=ox*s,gy=oy*s,gw=cols*pw*s,gh=rows*ph*s;
    ctx.fillStyle='rgba(0,0,0,.55)';
    ctx.fillRect(0,0,g.width,gy);ctx.fillRect(0,gy+gh,g.width,g.height-gy-gh);
    ctx.fillRect(0,gy,gx,gh);ctx.fillRect(gx+gw,gy,g.width-gx-gw,gh);
    const ofx=ox+cols*pw>loaded.width, ofy=oy+rows*ph>loaded.height, overflow=ofx||ofy;
    ctx.strokeStyle=overflow?'#F59E0B':'#6366F1';ctx.lineWidth=2;ctx.strokeRect(gx,gy,gw,gh);
    ctx.strokeStyle=overflow?'rgba(245,158,11,.7)':'rgba(99,102,241,.6)';ctx.lineWidth=1;ctx.setLineDash([5,4]);
    for(let r=1;r<rows;r++){const y=gy+r*ph*s;ctx.beginPath();ctx.moveTo(gx,y);ctx.lineTo(gx+gw,y);ctx.stroke()}
    for(let c=1;c<cols;c++){const x=gx+c*pw*s;ctx.beginPath();ctx.moveTo(x,gy);ctx.lineTo(x,gy+gh);ctx.stroke()}
    ctx.setLineDash([]);
    const tw=cols*pw,th=rows*ph;
    $('cr-info').innerHTML=`<span class="meta">Original ${loaded.width}×${loaded.height}</span> · <span class="meta">Tile ${pw}×${ph}</span> · <span class="meta">Offset ${ox},${oy}</span> · <span class="meta">Covered ${tw}×${th}</span> · <span class="meta">${rows*cols} tiles</span>${overflow?' · <span class="hint-warn">⚠ Out of bounds '+(ofx?'width':'')+(ofy?'height':'')+'</span>':''}`;
  }
  $('cr-run').onclick=async()=>{
    if(!loaded)return;
    const rows=+$('cr-rows').value,cols=+$('cr-cols').value;
    const pw=+$('cr-pw').value,ph=+$('cr-ph').value,ox=+$('cr-ox').value,oy=+$('cr-oy').value;
    const fmt=$('cr-fmt').value, ext=fmt.split('/')[1].replace('jpeg','jpg');
    const prefix=$('cr-prefix').value||'piece';
    if(!requireZip())return;const zip=new JSZip();
    const t=document.createElement('canvas');t.width=pw;t.height=ph;const tc=t.getContext('2d');
    for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){
      tc.clearRect(0,0,pw,ph);tc.drawImage(loaded,ox+c*pw,oy+r*ph,pw,ph,0,0,pw,ph);
      const b=await new Promise(res=>t.toBlob(res,fmt));
      zip.file(`${prefix}_${r+1}_${c+1}.${ext}`,b);
    }
    dlBlob(await zip.generateAsync({type:'blob'}),`${prefix}-${Date.now()}.zip`);
    toast('Crop complete');
  };
})();

/* ================================================================
   4. Before / after
   ================================================================ */
(function(){
  let imgA=null,imgB=null,raf=null;
  const canvas=$('cm-canvas'),ctx=canvas.getContext('2d');
  function bindSlot(slotId,inputId,which){
    const slot=$(slotId),input=$(inputId);
    slot.addEventListener('click',e=>{if(e.target.tagName!=='BUTTON')input.click()});
    input.addEventListener('change',async e=>{
      const f=e.target.files[0];if(!f)return;
      const img=await fileToImg(f);
      if(which==='a')imgA=img;else imgB=img;
      slot.innerHTML=`<img src="${img.src}"><button class="clear-pill" data-w="${which}">Remove</button>`;
      slot.classList.add('has');
      slot.querySelector('.clear-pill').onclick=ev=>{ev.stopPropagation();clearSlot(which)};
      check();
    });
  }
  function clearSlot(w){
    if(w==='a'){imgA=null;$('cm-slot-a').innerHTML='<span>+ Image A<br><small style="color:var(--text-3)">Before</small></span>';$('cm-slot-a').classList.remove('has')}
    else{imgB=null;$('cm-slot-b').innerHTML='<span>+ Image B<br><small style="color:var(--text-3)">After</small></span>';$('cm-slot-b').classList.remove('has')}
    check();
  }
  bindSlot('cm-slot-a','cm-input-a','a');
  bindSlot('cm-slot-b','cm-input-b','b');
  function check(){const ok=!!(imgA&&imgB);$('cm-preview').disabled=!ok;$('cm-record').disabled=!ok;if(ok){setupCanvas();drawFrame(0)}}

  function setupCanvas(){
    const W=+$('cm-w').value;
    const base=$('cm-ratio').value;
    let ratio;
    if(base==='A')ratio=imgA.height/imgA.width;
    else if(base==='B')ratio=imgB.height/imgB.width;
    else{const[a,b]=base.split('/').map(Number);ratio=b/a}
    canvas.width=W;canvas.height=Math.round(W*ratio);
    canvas.style.display='block';$('cm-empty').style.display='none';
  }
  function drawFit(c,img,x,y,w,h){
    const ir=img.width/img.height,br=w/h;let dw=w,dh=h,dx=x,dy=y;
    if(ir>br){dh=w/ir;dy=y+(h-dh)/2}else{dw=h*ir;dx=x+(w-dw)/2}
    c.drawImage(img,dx,dy,dw,dh);
  }
  function drawFrame(p){
    const w=canvas.width,h=canvas.height;
    ctx.fillStyle=$('cm-bg').value;ctx.fillRect(0,0,w,h);
    const lp=w*p;
    if(lp<w){ctx.save();ctx.beginPath();ctx.rect(lp,0,w-lp,h);ctx.clip();drawFit(ctx,imgA,0,0,w,h);ctx.restore()}
    if(lp>0){ctx.save();ctx.beginPath();ctx.rect(0,0,lp,h);ctx.clip();drawFit(ctx,imgB,0,0,w,h);ctx.restore()}
    const showLine=$('cm-line-on').checked;
    if(!showLine)return;
    const lw=+$('cm-lw').value;
    if(lw>0&&p>0&&p<1){
      if($('cm-glow').checked){
        ctx.save();
        const gw=Math.max(20,lw*4);
        const grad=ctx.createLinearGradient(lp-gw,0,lp+gw,0);
        grad.addColorStop(0,'rgba(255,255,255,0)');
        grad.addColorStop(.5,'rgba(255,255,255,.25)');
        grad.addColorStop(1,'rgba(255,255,255,0)');
        ctx.fillStyle=grad;ctx.fillRect(lp-gw,0,gw*2,h);
        ctx.restore();
      }
      ctx.save();ctx.strokeStyle=$('cm-lc').value;ctx.lineWidth=lw;
      ctx.shadowColor='rgba(0,0,0,.4)';ctx.shadowBlur=10;ctx.shadowOffsetX=1;
      ctx.beginPath();ctx.moveTo(lp,0);ctx.lineTo(lp,h);ctx.stroke();
      ctx.restore();
    }
  }
  ['cm-w','cm-ratio','cm-bg'].forEach(id=>$(id).addEventListener('change',()=>{if(imgA&&imgB){setupCanvas();drawFrame(0)}}));
  ['cm-lw','cm-lc','cm-line-on','cm-glow'].forEach(id=>$(id).addEventListener('input',()=>imgA&&imgB&&drawFrame(canvas._lastP||0)));

  $('cm-preview').onclick=()=>{
    if(!imgA||!imgB)return;
    if(raf)cancelAnimationFrame(raf);
    $('cm-stop').style.display='';$('cm-preview').disabled=true;
    const dur=+$('cm-dur').value*1000;
    const easing=$('cm-easing').checked, etype=$('cm-ease-type').value;
    const t0=performance.now();
    function loop(t){
      const e=t-t0;let p=Math.min(e/dur,1);if(easing)p=ease(p,etype);
      canvas._lastP=p;drawFrame(p);
      if(p<1)raf=requestAnimationFrame(loop);else{raf=null;$('cm-stop').style.display='none';$('cm-preview').disabled=false}
    }
    raf=requestAnimationFrame(loop);
  };
  $('cm-stop').onclick=()=>{if(raf)cancelAnimationFrame(raf);raf=null;$('cm-stop').style.display='none';$('cm-preview').disabled=false};

  $('cm-record').onclick=async()=>{
    if(!imgA||!imgB)return;
    if(typeof MediaRecorder==='undefined'||!canvas.captureStream)return toast('This browser does not support WebM recording');
    if(raf)cancelAnimationFrame(raf);raf=null;
    setupCanvas();
    $('cm-record').disabled=true;$('cm-preview').disabled=true;
    const fps=+$('cm-fps').value, dur=+$('cm-dur').value*1000;
    const easing=$('cm-easing').checked, etype=$('cm-ease-type').value;
    const mimes=['video/webm;codecs=vp9','video/webm;codecs=vp8','video/webm'];
    let mime=null;for(const m of mimes)if(MediaRecorder.isTypeSupported(m)){mime=m;break}
    if(!mime){$('cm-record').disabled=false;$('cm-preview').disabled=false;return toast('This browser does not support WebM recording')}
    const stream=canvas.captureStream(fps);
    const chunks=[];
    const rec=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:8000000});
    rec.ondataavailable=e=>e.data.size&&chunks.push(e.data);
    rec.onstop=()=>{$('cm-record').disabled=false;$('cm-preview').disabled=false;stream.getTracks().forEach(t=>t.stop());dlBlob(new Blob(chunks,{type:mime}),`compare-${Date.now()}.webm`);toast('Video downloaded')};
    rec.start();
    const t0=performance.now();
    await new Promise(res=>{function loop(t){const e=t-t0;let p=Math.min(e/dur,1);if(easing)p=ease(p,etype);drawFrame(p);if(p<1)requestAnimationFrame(loop);else res()}requestAnimationFrame(loop)});
    setTimeout(()=>rec.stop(),200);
  };
})();

/* ================================================================
   5. Cover maker (with canvas drag)
   ================================================================ */
(function(){
  let bg=null,fg=null,shape='rect',arrowStyle='straight';
  const canvas=$('cv-canvas'),ctx=canvas.getContext('2d'),stage=$('cv-stage'),handles=$('cv-handles');
  bindDrop($('cv-drop-bg'),$('cv-bg-input'),async fs=>{bg=await fileToImg(fs[0]);render();$('cv-download').disabled=!bg},{accept:'image',multi:false});
  bindDrop($('cv-drop-fg'),$('cv-fg-input'),async fs=>{fg=await fileToImg(fs[0]);render()},{accept:'image',multi:false});
  bindSeg($('cv-shape'),v=>{shape=v;render()});
  bindSeg($('cv-arrow-style'),v=>{arrowStyle=v;render()});
  ['cv-size','cv-opacity','cv-rot'].forEach(id=>$(id).addEventListener('input',e=>{
    const lbl={'cv-size':'cv-sv','cv-opacity':'cv-ov','cv-rot':'cv-rv'}[id];
    $(lbl).textContent=id==='cv-opacity'?(+e.target.value).toFixed(2):e.target.value;
    render();
  }));
  ['cv-x','cv-y','cv-border','cv-bcolor','cv-arrow','cv-ax','cv-ay','cv-aw','cv-ac','cv-txt-on','cv-txt','cv-txt-size','cv-txt-fg','cv-txt-x','cv-txt-y','cv-txt-stroke','cv-txt-sc'].forEach(id=>$(id).addEventListener('input',render));
  $('cv-reset').onclick=()=>{
    $('cv-x').value=65;$('cv-y').value=60;$('cv-size').value=35;$('cv-sv').textContent='35';
    $('cv-opacity').value=1;$('cv-ov').textContent='1.00';
    $('cv-rot').value=0;$('cv-rv').textContent='0';
    $('cv-border').value=6;$('cv-bcolor').value='#FFFFFF';
    $('cv-arrow').checked=false;$('cv-txt-on').checked=false;
    document.querySelectorAll('#cv-shape button').forEach(b=>b.classList.toggle('on',b.dataset.v==='rect'));
    shape='rect';render();
  };

  function roundedRect(c,x,y,w,h,r){c.beginPath();c.moveTo(x+r,y);c.lineTo(x+w-r,y);c.quadraticCurveTo(x+w,y,x+w,y+r);c.lineTo(x+w,y+h-r);c.quadraticCurveTo(x+w,y+h,x+w-r,y+h);c.lineTo(x+r,y+h);c.quadraticCurveTo(x,y+h,x,y+h-r);c.lineTo(x,y+r);c.quadraticCurveTo(x,y,x+r,y);c.closePath()}

  function getOverlay(){
    if(!bg)return null;
    const sp=+$('cv-size').value/100;
    const fw=Math.round(bg.width*sp);
    const ratio=fg?fg.height/fg.width:1;
    const fh=Math.round(fw*ratio);
    const cx=+$('cv-x').value/100*bg.width;
    const cy=+$('cv-y').value/100*bg.height;
    const fx=Math.round(cx-fw/2),fy=Math.round(cy-fh/2);
    return{fx,fy,fw,fh,cx,cy};
  }

  function render(){
    if(!bg){canvas.style.display='none';return}
    canvas.style.display='block';
    canvas.width=bg.width;canvas.height=bg.height;
    ctx.drawImage(bg,0,0);

    if(fg){
      const{fx,fy,fw,fh,cx,cy}=getOverlay();
      const opacity=+$('cv-opacity').value, rot=+$('cv-rot').value*Math.PI/180;
      const border=+$('cv-border').value, bc=$('cv-bcolor').value;
      ctx.save();ctx.globalAlpha=opacity;
      ctx.translate(cx,cy);ctx.rotate(rot);ctx.translate(-cx,-cy);
      if(shape==='circle'){
        const r=Math.min(fw,fh)/2;
        ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.clip();
        ctx.drawImage(fg,cx-r,cy-r,r*2,r*2);
        ctx.restore();
        if(border>0){ctx.save();ctx.globalAlpha=opacity;ctx.translate(cx,cy);ctx.rotate(rot);ctx.translate(-cx,-cy);ctx.strokeStyle=bc;ctx.lineWidth=border;ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.stroke();ctx.restore()}
      } else {
        const rad=shape==='round'?Math.min(fw,fh)*0.08:0;
        roundedRect(ctx,fx,fy,fw,fh,rad);ctx.clip();
        ctx.drawImage(fg,fx,fy,fw,fh);
        ctx.restore();
        if(border>0){ctx.save();ctx.globalAlpha=opacity;ctx.translate(cx,cy);ctx.rotate(rot);ctx.translate(-cx,-cy);ctx.strokeStyle=bc;ctx.lineWidth=border;roundedRect(ctx,fx,fy,fw,fh,rad);ctx.stroke();ctx.restore()}
      }
    }

    if($('cv-arrow').checked){
      const ax=+$('cv-ax').value/100*bg.width;
      const ay=+$('cv-ay').value/100*bg.height;
      const tx=+$('cv-x').value/100*bg.width;
      const ty=+$('cv-y').value/100*bg.height;
      drawArrow(ctx,ax,ay,tx,ty,$('cv-ac').value,+$('cv-aw').value,arrowStyle);
    }

    if($('cv-txt-on').checked){
      const txt=$('cv-txt').value;const tsz=+$('cv-txt-size').value;
      const tx=+$('cv-txt-x').value/100*bg.width;const ty=+$('cv-txt-y').value/100*bg.height+tsz/2;
      const stroke=+$('cv-txt-stroke').value, sc=$('cv-txt-sc').value;
      ctx.save();ctx.font=`700 ${tsz}px Inter, sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';
      if(stroke>0){ctx.strokeStyle=sc;ctx.lineWidth=stroke*2;ctx.strokeText(txt,tx,ty)}
      ctx.fillStyle=$('cv-txt-fg').value;ctx.fillText(txt,tx,ty);
      ctx.restore();
    }
    updateHandles();
  }

  function drawArrow(c,x1,y1,x2,y2,col,w,style){
    const dx=x2-x1,dy=y2-y1,len=Math.hypot(dx,dy);if(len<1)return;
    const ux=dx/len,uy=dy/len;
    const head=Math.min(40,len*0.2);
    c.save();c.strokeStyle=col;c.fillStyle=col;c.lineWidth=w;c.lineCap='round';
    if(style==='curve'){
      const mx=(x1+x2)/2-uy*len*.2, my=(y1+y2)/2+ux*len*.2;
      c.beginPath();c.moveTo(x1,y1);c.quadraticCurveTo(mx,my,x2-ux*head*.6,y2-uy*head*.6);c.stroke();
    } else {
      c.beginPath();c.moveTo(x1,y1);c.lineTo(x2-ux*head*.6,y2-uy*head*.6);c.stroke();
    }
    // head end
    const a1x=x2-ux*head+uy*head*.4,a1y=y2-uy*head-ux*head*.4;
    const a2x=x2-ux*head-uy*head*.4,a2y=y2-uy*head+ux*head*.4;
    c.beginPath();c.moveTo(x2,y2);c.lineTo(a1x,a1y);c.lineTo(a2x,a2y);c.closePath();c.fill();
    if(style==='double'){
      const b1x=x1+ux*head+uy*head*.4,b1y=y1+uy*head-ux*head*.4;
      const b2x=x1+ux*head-uy*head*.4,b2y=y1+uy*head+ux*head*.4;
      c.beginPath();c.moveTo(x1,y1);c.lineTo(b1x,b1y);c.lineTo(b2x,b2y);c.closePath();c.fill();
    }
    c.restore();
  }

  // Drag interaction on canvas
  function updateHandles(){
    handles.innerHTML='';
    if(!fg||!bg)return;
    const rect=canvas.getBoundingClientRect(), stRect=stage.getBoundingClientRect();
    const sx=rect.width/bg.width, sy=rect.height/bg.height;
    const{fx,fy,fw,fh}=getOverlay();
    const ox=rect.left-stRect.left, oy=rect.top-stRect.top;
    const ring=document.createElement('div');ring.className='ring';
    ring.style.left=(ox+fx*sx)+'px';ring.style.top=(oy+fy*sy)+'px';
    ring.style.width=(fw*sx)+'px';ring.style.height=(fh*sy)+'px';
    handles.appendChild(ring);
    const corners=[['nw',fx,fy],['ne',fx+fw,fy],['sw',fx,fy+fh],['se',fx+fw,fy+fh]];
    corners.forEach(([dir,x,y])=>{
      const h=document.createElement('div');h.className='h';h.dataset.dir=dir;
      h.style.left=(ox+x*sx)+'px';h.style.top=(oy+y*sy)+'px';
      h.addEventListener('mousedown',startResize);
      handles.appendChild(h);
    });
  }

  let drag=null;
  canvas.addEventListener('mousedown',e=>{
    if(!fg||!bg)return;
    const rect=canvas.getBoundingClientRect();
    const mx=(e.clientX-rect.left)/rect.width*bg.width;
    const my=(e.clientY-rect.top)/rect.height*bg.height;
    const{fx,fy,fw,fh}=getOverlay();
    if(mx>=fx&&mx<=fx+fw&&my>=fy&&my<=fy+fh){
      drag={mode:'move',startMX:e.clientX,startMY:e.clientY,startX:+$('cv-x').value,startY:+$('cv-y').value};
      stage.classList.add('dragging');
    }
  });
  function startResize(e){
    e.stopPropagation();
    drag={mode:'resize',dir:e.target.dataset.dir,startMX:e.clientX,startMY:e.clientY,startSize:+$('cv-size').value,startX:+$('cv-x').value,startY:+$('cv-y').value};
  }
  window.addEventListener('mousemove',e=>{
    if(!drag||!bg)return;
    const rect=canvas.getBoundingClientRect();
    const sxx=rect.width/bg.width;
    const dx=(e.clientX-drag.startMX)/sxx, dy=(e.clientY-drag.startMY)/sxx;
    if(drag.mode==='move'){
      $('cv-x').value=Math.max(0,Math.min(100,drag.startX+dx/bg.width*100));
      $('cv-y').value=Math.max(0,Math.min(100,drag.startY+dy/bg.height*100));
    } else if(drag.mode==='resize'){
      const sign=drag.dir==='se'||drag.dir==='nw'?1:1;
      const delta=(drag.dir==='se'?(dx+dy):drag.dir==='sw'?(-dx+dy):drag.dir==='ne'?(dx-dy):(-dx-dy))/bg.width*100;
      $('cv-size').value=Math.max(5,Math.min(80,drag.startSize+delta));
      $('cv-sv').textContent=$('cv-size').value;
    }
    render();
  });
  window.addEventListener('mouseup',()=>{if(drag){drag=null;stage.classList.remove('dragging')}});

  $('cv-download').onclick=()=>{if(bg)dlCanvas(canvas,`cover-${Date.now()}.jpg`,'image/jpeg',.95)};
  // initial empty render
  render();
})();

/* Reset button */
$('btn-reset').onclick=()=>{
  const active=document.querySelector('.nav-item.active').dataset.tab;
  const map={collage:'cl-clear',compress:'cp-clear',cropper:null,compare:null,cover:'cv-reset',bgremove:null};
  const id=map[active];if(id)$(id).click();
};
$('btn-help').onclick=()=>toast('Tip: the main actions for each tool are in its top-right corner.',3500);
