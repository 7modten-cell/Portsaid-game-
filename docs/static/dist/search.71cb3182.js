window.SmartSearch=(function(){'use strict';const AR_MAP={'أ':'a','إ':'a','آ':'a','ا':'a','ى':'a','ة':'h','ب':'b','ت':'t','ث':'th','ج':'j','ح':'h','خ':'kh','د':'d','ذ':'z','ر':'r','ز':'z','س':'s','ش':'sh','ص':'s','ض':'d','ط':'t','ظ':'z','ع':'a','غ':'gh','ف':'f','ق':'q','ك':'k','ل':'l','م':'m','ن':'n','ه':'h','و':'w','ي':'y','ئ':'y','ؤ':'w','ء':'','ّ':'','َ':'','ُ':'','ِ':'','ً':'','ٌ':'','ٍ':'','ْ':'','ـ':''};function transliterateAr(text){let r='';for(const ch of text)r+=AR_MAP[ch]!==undefined?AR_MAP[ch]:ch;return r;}
function normalizeAr(text){return String(text).replace(/[أإآ]/g,'ا').replace(/ة/g,'ه').replace(/ى/g,'ي').replace(/[ّ-ٰ]/g,'').replace(/ـ/g,'').replace(/\s+/g,' ').trim();}
function stripArticle(text){return String(text).replace(/^ال|(\s)ال/g,'$1').trim();}
function hasArabic(text){return/[\u0600-\u06FF]/.test(text);}
function levenshtein(a,b){if(!a.length)return b.length;if(!b.length)return a.length;let prev=Array.from({length:a.length+1},(_,j)=>j);for(let i=1;i<=b.length;i++){const cur=[i];for(let j=1;j<=a.length;j++){cur[j]=b[i-1]===a[j-1]?prev[j-1]:1+Math.min(prev[j-1],prev[j],cur[j-1]);}
prev=cur;}
return prev[a.length];}
function score(rawQuery,text){const q=String(rawQuery||'').toLowerCase().trim();if(!q)return 0;const title=String(text||'');const titleLow=title.toLowerCase();const qNorm=normalizeAr(q);const tNorm=normalizeAr(titleLow);const qStrip=stripArticle(qNorm);const tStrip=stripArticle(tNorm);if(titleLow===q)return 100;if(titleLow.startsWith(q))return 93;if(titleLow.includes(q))return 88;if(tNorm===qNorm||tStrip===qStrip)return 85;if(tNorm.startsWith(qNorm)||tStrip.startsWith(qStrip))return 80;if(tNorm.includes(qNorm)||tStrip.includes(qStrip))return 76;const qWords=qStrip.split(/\s+/).filter(w=>w.length>1);const tWords=tStrip.split(/\s+/);if(qWords.length){let matched=0;for(const qw of qWords)
if(tWords.some(tw=>tw===qw||tw.startsWith(qw)||(qw.length>=4&&tw.includes(qw))))matched++;const ratio=matched/qWords.length;if(ratio===1)return 73;if(ratio>=0.5)return Math.round(50*ratio);}
const isAr=hasArabic(q);const qTrans=(isAr?transliterateAr(q):q).toLowerCase().replace(/\s+/g,'').trim();const tTrans=(isAr?titleLow:transliterateAr(normalizeAr(titleLow))).toLowerCase().replace(/\s+/g,'').trim();if(tTrans.startsWith(qTrans))return 69;if(tTrans.includes(qTrans))return 65;let best=0;for(const qw of qWords.length?qWords:[qStrip]){if(qw.length<4)continue;for(const tw of tWords){if(tw.length<4)continue;const d=levenshtein(qw,tw.slice(0,Math.max(qw.length+1,tw.length)));const tol=qw.length>=7?2:1;if(d<=tol)best=Math.max(best,58-d*6);else if(qw.length>=4&&tw.startsWith(qw.slice(0,3)))best=Math.max(best,45);}}
return best;}
function esc(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
function highlight(title,q){const safe=esc(title);const query=String(q||'').trim();if(!query)return safe;const low=title.toLowerCase();const qLow=query.toLowerCase();let i=low.indexOf(qLow);if(i===-1)i=normalizeAr(low).indexOf(normalizeAr(qLow));if(i===-1)return safe;const e=esc(title.slice(i,i+query.length));return esc(title.slice(0,i))+'<mark>'+e+'</mark>'+esc(title.slice(i+query.length));}
function getRecents(key){try{return JSON.parse(localStorage.getItem(key)||'[]');}catch(e){return[];}}
function pushRecent(key,term){try{const t=String(term||'').trim();if(!t)return;const list=getRecents(key).filter(x=>x!==t);list.unshift(t);localStorage.setItem(key,JSON.stringify(list.slice(0,6)));}catch(e){}}
function attach(cfg){const input=cfg.input,box=cfg.box;if(!input||!box)return;let items=[],activeIdx=-1,timer=null;let clearBtn=null;if(cfg.clear!==false&&input.parentElement){clearBtn=document.createElement('button');clearBtn.type='button';clearBtn.className='nav-search-clear';clearBtn.setAttribute('aria-label','مسح البحث');clearBtn.innerHTML='<i class="fa-solid fa-xmark"></i>';clearBtn.style.display='none';input.parentElement.appendChild(clearBtn);clearBtn.addEventListener('click',()=>{input.value='';clearBtn.style.display='none';hide();if(cfg.onClear)cfg.onClear();else input.dispatchEvent(new Event('input'));input.focus();});}
const syncClear=()=>{if(clearBtn)clearBtn.style.display=input.value.trim()?'flex':'none';};function hide(){box.style.display='none';activeIdx=-1;}
function renderRecents(){const rec=cfg.recentKey?getRecents(cfg.recentKey):[];if(!rec.length){hide();return;}
items=rec.map(t=>({title:t,recent:true}));box.innerHTML=`<div class="suggestion-head"><i class="fa-solid fa-clock-rotate-left"></i> عمليات البحث الأخيرة</div>`+
items.map((it,i)=>`
                <div class="suggestion-item${i === activeIdx ? ' active' : ''}" data-i="${i}">
                    <span class="suggestion-ic"><i class="fa-solid fa-clock-rotate-left"></i></span>
                    <span><span class="suggestion-title">${esc(it.title)}</span></span>
                </div>`).join('');box.style.display='block';}
function render(q){const res=(cfg.fetch(q)||[]).slice(0,8);items=res;activeIdx=-1;if(!res.length){box.innerHTML='<div class="suggestion-empty"><i class="fa-solid fa-magnifying-glass"></i> لا توجد نتائج مطابقة</div>';box.style.display='block';return;}
box.innerHTML=res.map((it,i)=>`
                <div class="suggestion-item${i === activeIdx ? ' active' : ''}" data-i="${i}">
                    ${it.img ? `<img class="suggestion-img"src="${esc(it.img)}"alt=""loading="lazy"onerror="this.style.visibility='hidden'">` : `<span class="suggestion-ic"><i class="fa-solid ${it.icon || 'fa-magnifying-glass'}"></i></span>`}
                    <span style="flex:1;min-width:0;">
                        <span class="suggestion-title">${highlight(it.title, q)}</span>
                        ${it.meta ? `<span class="suggestion-meta">${esc(it.meta)}</span>` : ''}
                    </span>
                    ${it.cat ? `<span class="suggestion-cat">${esc(it.cat)}</span>` : ''}
                </div>`).join('');box.style.display='block';}
function choose(it){if(!it)return;if(cfg.recentKey)pushRecent(cfg.recentKey,it.title);hide();cfg.onSelect(it);}
input.addEventListener('input',()=>{syncClear();clearTimeout(timer);timer=setTimeout(()=>{const q=input.value.trim();if(!q){renderRecents();if(!q&&cfg.onClear)cfg.onClear();return;}
render(q);},150);});input.addEventListener('focus',()=>{syncClear();const q=input.value.trim();if(q)render(q);else renderRecents();});input.addEventListener('keydown',e=>{if(e.key==='Escape'){hide();return;}
const vis=box.style.display==='block';if(!vis)return;if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();const n=items.length;if(!n)return;activeIdx=e.key==='ArrowDown'?(activeIdx+1)%n:(activeIdx-1+n)%n;box.querySelectorAll('.suggestion-item').forEach((el,i)=>el.classList.toggle('active',i===activeIdx));const act=box.querySelector('.suggestion-item.active');if(act)act.scrollIntoView({block:'nearest'});}else if(e.key==='Enter'){if(activeIdx>=0&&items[activeIdx]){e.preventDefault();choose(items[activeIdx]);}}});box.addEventListener('click',e=>{const el=e.target.closest('.suggestion-item');if(!el)return;choose(items[parseInt(el.dataset.i,10)]);});document.addEventListener('click',e=>{if(!box.contains(e.target)&&e.target!==input&&!(clearBtn&&clearBtn.contains(e.target)))hide();});}
return{score,normalizeAr,transliterateAr,highlight,attach,levenshtein,getRecents,pushRecent};})();