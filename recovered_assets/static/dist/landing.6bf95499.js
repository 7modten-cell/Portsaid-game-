(function(){"use strict";function onCartChanged(){if(typeof window.updateLandStorage==="function")window.updateLandStorage();if(typeof window.updateLatestAddButtons==="function")window.updateLatestAddButtons();}
window.onCartChanged=onCartChanged;window.addEventListener("storage",e=>{if(e.key==="cart"||e.key==="storageLimit")onCartChanged();});window.addEventListener("focus",onCartChanged);document.addEventListener("visibilitychange",()=>{if(!document.hidden)onCartChanged();});if(typeof window.updateLandStorage==="function")window.updateLandStorage();if(typeof window.updateLatestAddButtons==="function")window.updateLatestAddButtons();const revealTargets=document.querySelectorAll(".hero-card, .section-block, .value-section, .site-footer");if(revealTargets.length&&"IntersectionObserver"in window){const rio=new IntersectionObserver(entries=>{entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add("revealed");rio.unobserve(entry.target);}});},{threshold:0.01,rootMargin:'0px 0px -20px 0px'});revealTargets.forEach(el=>{el.classList.add("reveal-ready");rio.observe(el);});}else{revealTargets.forEach(el=>el.classList.add("revealed"));}
const SHOWCASE_COUNT=18;function escShow(s){return String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;");}
function showcaseCardHTML(it){const price=parseFloat(it.p)||0;const fallback="/static/img/landing/cat-"+(it.y==="game"?"games":it.y==="program"?"software":"movies")+".webp";const priceHtml=price>0?`<span class="galaxy-card-price">${Math.round(price).toLocaleString("en-US")} <small>ج.م</small></span>`:``;return`
            <div class="galaxy-card" data-type="${escShow(it.y)}">
                <div class="galaxy-card-inner">
                    <div class="galaxy-card-img-wrap">
                        <img src="${escShow(it.i)}" alt="${escShow(it.t)}" loading="lazy" decoding="async"
                            data-fallback="${fallback}"
                            onerror="this.onerror=null;this.src=this.dataset.fallback||'/static/img/landing/cat-games.webp'">
                        <div class="galaxy-card-img-overlay"></div>
                        <span class="galaxy-new-badge show-badge badge-${escShow(it.bc)}">${escShow(it.b)}</span>
                        <button type="button" class="galaxy-card-add show-add-btn btn-game-add"
                            data-id="${it.id || ''}" data-title="${escShow(it.t)}" data-price="${it.p || 0}" data-size="${escShow(it.s)}"
                            data-cat-name="${escShow(it.c)}" data-type="${escShow(it.y)}"
                            onclick="toggleCart(this)" title="أضف للسلة" aria-label="أضف ${escShow(it.t)} للسلة">
                            <i class="fa-solid fa-plus"></i>
                        </button>
                    </div>
                    <div class="galaxy-card-info">
                        <h3 class="galaxy-card-title" title="${escShow(it.t)}">${escShow(it.t)}</h3>
                        <div class="galaxy-card-bottom">
                            <span class="galaxy-card-size"><i class="fa-solid fa-microchip"></i> ${escShow(it.s || '—')}</span>
                            ${priceHtml}
                        </div>
                    </div>
                </div>
            </div>`;}
function renderShowcase(){const track=document.getElementById("showTrack");if(!track||!Array.isArray(window.__SHOWCASE_POOL__))return;let counts={};try{counts=JSON.parse(localStorage.getItem("popCounts")||"{}");}catch(e){counts={};}
const scored=window.__SHOWCASE_POOL__.map(it=>({it,n:counts[(it.y||"game")+"|"+(it.t||"")]||0,}));scored.sort((a,b)=>b.n-a.n||String(b.it.d||"").localeCompare(String(a.it.d||"")));const top=scored.slice(0,SHOWCASE_COUNT);if(top.length&&top[0].n>0){top[0].it=Object.assign({},top[0].it,{b:"الأكثر طلباً",bc:"hot"});}
track.innerHTML=top.map(x=>showcaseCardHTML(x.it)).join("");if(typeof window.updateLatestAddButtons==="function")window.updateLatestAddButtons();initShowcaseAutoScroll();}
function initShowcaseAutoScroll(){if(window.innerWidth>767)return;const track=document.getElementById("showTrack");if(!track||track.children.length<2)return;setTimeout(()=>{const card=track.querySelector(".galaxy-card");if(!card)return;const amt=Math.min(window.innerWidth*.46-8,170)+12;track.scrollBy({left:-(amt*1.6),behavior:scrollMode()});setTimeout(()=>track.scrollBy({left:amt*1.6,behavior:scrollMode()}),1400);},900);}
function initCatAutoScroll(){if(window.innerWidth>767)return;const grid=document.getElementById("categories");const track=grid?grid.querySelector(".cat-grid"):null;if(!track||track.children.length<2)return;setTimeout(()=>{const card=track.querySelector(".cat-card");if(!card)return;const amt=Math.min(window.innerWidth*.46-8,170)+12;track.scrollBy({left:-(amt*1.6),behavior:scrollMode()});setTimeout(()=>track.scrollBy({left:amt*1.6,behavior:scrollMode()}),1400);},900);}
renderShowcase();initCatAutoScroll();const reducedMotion=window.matchMedia("(prefers-reduced-motion: reduce)").matches;const scrollMode=()=>(reducedMotion?"auto":"smooth");function flashLanding(el){if(!el)return;el.classList.add("search-flash");setTimeout(()=>el.classList.remove("search-flash"),1300);}
function scrollToBrowse(){const sec=document.getElementById("categories");if(!sec)return;const go=(behavior)=>{const nav=document.querySelector(".glass-header");const navH=nav?nav.getBoundingClientRect().height:72;const rect=sec.getBoundingClientRect();window.scrollTo({top:Math.max(0,rect.top+window.scrollY-navH-10),behavior:behavior||scrollMode(),});};go();setTimeout(()=>go("auto"),400);setTimeout(()=>go("auto"),900);setTimeout(()=>flashLanding(sec),950);}
function initLandingNavSearch(){const pool=window.__SHOWCASE_POOL__||[];function go(type,term){const base=type==="movie"?"/movies":type==="program"?"/programs":"/games";window.location.href=base+"?q="+encodeURIComponent(term);}
function bindSearchInput(inp,box,opts){if(!inp||!box)return null;opts=opts||{};function render(q){q=String(q||'').trim();if(!q){box.style.display="none";return;}
const scored=pool.map((it)=>({it,score:window.SmartSearch.score(q,it.t)})).filter((x)=>x.score>0).sort((a,b)=>b.score-a.score).slice(0,8);if(!scored.length){box.innerHTML='<div class="suggestion-empty">لا توجد نتائج مطابقة</div>';box.style.display="block";return;}
box.innerHTML=scored.map(({it})=>`
                    <div class="suggestion-item" data-title="${(it.t || '').replace(/"/g, '&quot;')}" data-type="${it.y === 'movie' ? 'movie' : it.y === 'program' ? 'program' : 'game'}">
                        <img class="suggestion-img" src="${it.i || ''}" alt="" loading="lazy"
                            onerror="this.style.visibility='hidden'">
                        <span>
                            <div class="suggestion-title">${it.t || ''}</div>
                            <div class="suggestion-meta">${it.y === 'movie' ? 'فيلم / مسلسل' : it.y === 'program' ? 'برنامج' : 'لعبة'}${it.c ? ' • ' + it.c : ''}</div>
                        </span>
                        <span class="suggestion-cat">${it.b || ''}</span>
                    </div>`).join("");box.style.display="block";}
inp.addEventListener("input",()=>render(inp.value));inp.addEventListener("focus",()=>{if(String(inp.value).trim())render(inp.value);});document.addEventListener("click",(e)=>{if(!box.contains(e.target)&&e.target!==inp)box.style.display="none";});box.addEventListener("click",(e)=>{const item=e.target.closest(".suggestion-item");if(!item)return;go(item.dataset.type,item.dataset.title);});inp.addEventListener("keydown",(e)=>{if(e.key!=="Enter")return;const q=String(inp.value||'').trim();if(!q){e.preventDefault();if(opts.onEmptyEnter)opts.onEmptyEnter();else scrollToBrowse();return;}
let games=0,movies=0;let programs=0;pool.forEach((it)=>{if(window.SmartSearch.score(q,it.t)>0){if(it.y==='movie')movies++;else if(it.y==='program')programs++;else games++;}});if(programs>movies&&programs>games)go("program",q);else go(movies>games?"movie":"game",q);});return inp;}
bindSearchInput(document.getElementById("landingSearch"),document.getElementById("landingSuggestions"));const bar=document.getElementById("landingSearchBar");const closeBtn=document.getElementById("landingSearchClose");const fab=document.getElementById("fabSearch");let floatFallbackTimer=null;let floatAnimationEndHandler=null;function clearFloatFocusSchedule(){clearTimeout(floatFallbackTimer);floatFallbackTimer=null;if(floatAnimationEndHandler&&bar){bar.removeEventListener("animationend",floatAnimationEndHandler);floatAnimationEndHandler=null;}}
function floatFocusPill(){clearFloatFocusSchedule();if(!bar.classList.contains("open"))return;const finp=document.getElementById("landingFloatSearch");if(!finp)return;const html=document.documentElement;const prev=html.style.scrollBehavior;html.style.scrollBehavior="auto";finp.focus({preventScroll:true});html.style.scrollBehavior=prev;}
function closeFloatSearch(){if(!bar)return;clearFloatFocusSchedule();bar.classList.remove("open");const finp=document.getElementById("landingFloatSearch");if(finp)finp.value="";const fbox=document.getElementById("landingFloatSuggestions");if(fbox)fbox.style.display="none";}
function openFloatSearch(){if(!bar)return;clearFloatFocusSchedule();bar.classList.add("open");const finp=document.getElementById("landingFloatSearch");if(!finp)return;finp.style.fontSize="16px";floatAnimationEndHandler=(event)=>{if(event.target!==bar)return;floatFocusPill();};bar.addEventListener("animationend",floatAnimationEndHandler);floatFallbackTimer=setTimeout(floatFocusPill,340);}
bindSearchInput(document.getElementById("landingFloatSearch"),document.getElementById("landingFloatSuggestions"),{onEmptyEnter:closeFloatSearch});if(fab&&bar){const isMobile=window.matchMedia("(max-width: 767px)");fab.addEventListener("click",(e)=>{e.preventDefault();if(!isMobile.matches){closeFloatSearch();const navInp=document.getElementById("landingSearch");if(navInp){window.scrollTo({top:0,behavior:scrollMode()});setTimeout(()=>navInp.focus({preventScroll:true}),120);}
return;}
if(bar.classList.contains("open"))closeFloatSearch();else openFloatSearch();});if(closeBtn)closeBtn.addEventListener("click",closeFloatSearch);document.addEventListener("click",(e)=>{if(bar.classList.contains("open")&&!bar.contains(e.target)&&!(fab&&fab.contains(e.target)))closeFloatSearch();});document.addEventListener("keydown",(e)=>{if(e.key==="Escape"&&bar.classList.contains("open"))closeFloatSearch();});}
const qs=new URLSearchParams(location.search).get("q");const inp=document.getElementById("landingSearch");if(qs&&String(qs).trim()&&inp)inp.value=qs;}
initLandingNavSearch();const fabTop=document.getElementById("fabTop");if(fabTop){fabTop.addEventListener("click",()=>window.scrollTo({top:0,behavior:scrollMode()}));}
document.querySelectorAll('a[href="#top"]').forEach(function(link){link.addEventListener("click",function(e){e.preventDefault();window.scrollTo({top:0,behavior:scrollMode()});if(history.replaceState)history.replaceState(null,"","#top");});});if(location.hash==="#top"){history.replaceState(null,"",location.pathname+location.search);window.scrollTo(0,0);}
const browseBtn=document.getElementById("browseStoreBtn");if(browseBtn){browseBtn.addEventListener("click",(e)=>{e.preventDefault();scrollToBrowse();});}
if(location.hash==="#categories"){setTimeout(scrollToBrowse,80);}
const floatingActions=document.getElementById("floatingActions");const sections=["top","showcase","categories","features","about"];const navLinks=document.querySelectorAll(".nav-links .nav-link");let spyOffsets=[];let pageBottom=0;let activeSection="";let actionsScrolled=false;function cacheSpyGeometry(){spyOffsets=sections.map(id=>{const el=document.getElementById(id);return el?{id,top:el.offsetTop}:null;}).filter(Boolean);pageBottom=Math.max(0,document.documentElement.scrollHeight-window.innerHeight-4);}
function updateScrollUi(y){const nextScrolled=y>400;if(floatingActions&&nextScrolled!==actionsScrolled){actionsScrolled=nextScrolled;floatingActions.classList.toggle("scrolled",nextScrolled);}
if(!navLinks.length||window.innerWidth<=1024)return;const probe=y+window.innerHeight*0.55;let current=spyOffsets.length?spyOffsets[0].id:"top";for(const section of spyOffsets){if(section.top<=probe)current=section.id;}
if(y>=pageBottom)current="about";if(current===activeSection)return;activeSection=current;navLinks.forEach(link=>link.classList.toggle("active",link.getAttribute("href")===`#${current}`));}
cacheSpyGeometry();if(typeof window.onFxScroll==="function"){window.onFxScroll(updateScrollUi);}else{let ticking=false;window.addEventListener("scroll",()=>{if(ticking)return;ticking=true;requestAnimationFrame(()=>{ticking=false;updateScrollUi(window.scrollY);});},{passive:true});}
window.addEventListener("resize",()=>{cacheSpyGeometry();updateScrollUi(window.scrollY);},{passive:true});updateScrollUi(window.scrollY);})();