
(function(){
  "use strict";
  const library=window.PENELOPE_LIBRARY||{},profiles=window.PENELOPE_PROFILES||{};
  const $=id=>document.getElementById(id);
  const pick=(items,index)=>items&&items.length?items[((index%items.length)+items.length)%items.length]:"Penelope misplaced this section.";
  let currentKey=null,currentEntry=null,cycle=0;
  let searchCount=Number(sessionStorage.getItem("penelopeSearchCount")||0);
  let honkCount=Number(window.PenelopeStorage.get("penelopeHonkCount",0));
  const visitCount=Number(window.PenelopeStorage.get("penelopeVisitCount",0))+1;
  const savedTheme=window.PenelopeStorage.get("penelopeTheme","light");
  window.PenelopeStorage.set("penelopeVisitCount",visitCount);
  if(savedTheme==="dark")document.body.classList.add("dark");

  function updateThemeButton(){
    const button=$("themeBtn");
    if(!button)return;
    const dark=document.body.classList.contains("dark");
    button.textContent=dark?"☀️ Light shelves":"🌙 Dark shelves";
    button.setAttribute("aria-pressed",String(dark));
  }
  function toggleTheme(){
    document.body.classList.toggle("dark");
    window.PenelopeStorage.set("penelopeTheme",document.body.classList.contains("dark")?"dark":"light");
    updateThemeButton();
  }
  function counters(){
    $("searchCount").textContent=searchCount;
    $("honkCount").textContent=honkCount;
  }
  function bubble(text){$("penelopeBubble").innerHTML="<strong>Penelope says:</strong><br>“"+text+"”"}
  function footprints(){
    const rect=$("penelopeBtn").getBoundingClientRect();
    for(let i=0;i<4;i++){
      const foot=document.createElement("span");foot.className="footprint";foot.textContent=i%2?"•":"𓅰";
      foot.style.left=rect.left+rect.width*.2+i*18+"px";foot.style.top=rect.bottom-8+i*4+"px";
      document.body.appendChild(foot);setTimeout(()=>foot.remove(),1600);
    }
  }
  function honk(){
    honkCount++;window.PenelopeStorage.set("penelopeHonkCount",honkCount);counters();footprints();
    const text=window.PenelopePersonality.clickLine(honkCount,searchCount,visitCount);
    bubble(text);const button=$("penelopeBtn");button.classList.remove("honking");void button.offsetWidth;button.classList.add("honking");
    window.PenelopePersonality.sound(text.includes("Double"));
  }
  function profile(entry){
    const base=profiles[entry.key]||profiles.default||{};
    const fields=["audiences","genres","quotes","reviews","trailers","morals","endings","questions"];
    const result={};fields.forEach(field=>result[field]=entry[field]||base[field]||["Penelope has not cataloged this section yet."]);return result;
  }
  function showSuggestions(value,target=$("suggestions")){
    const matches=window.PenelopeSearch.suggestions(value,5);
    target.innerHTML="";
    if(!matches.length){target.classList.remove("show");return}
    const label=document.createElement("strong");label.textContent="Did you mean:";
    const row=document.createElement("div");row.className="button-row";
    matches.forEach(({key,entry})=>{
      const button=document.createElement("button");button.textContent=entry.name+" · "+entry.type;
      button.addEventListener("click",()=>{target.classList.remove("show");$("query").value=entry.name;runSearch(entry.name)});
      row.appendChild(button);
    });
    target.append(label,row);target.classList.add("show");
  }
  function renderSaved(){
    const wrap=$("savedItems"),items=window.PenelopeCard.all();wrap.innerHTML="";
    if(!items.length){wrap.innerHTML="<p>Your card is empty. Save a favorite misunderstanding.</p>";return}
    items.forEach(item=>{
      const div=document.createElement("div");div.className="saved-entry";
      const strong=document.createElement("strong");strong.textContent=item.title+" · "+item.type;
      const p=document.createElement("p");p.textContent=item.synopsis;
      const small=document.createElement("small");small.textContent="Saved "+item.date;
      const remove=document.createElement("button");remove.className="remove";remove.textContent="Remove";
      remove.addEventListener("click",()=>{window.PenelopeCard.remove(item.id);renderSaved()});
      div.append(strong,p,small,document.createElement("br"),remove);wrap.appendChild(div);
    });
  }
  function render(key,advance=false){
    const entry=library[key];if(!entry)return;
    const repeated=currentKey===key;
    cycle=(advance||repeated)?cycle+1:0;currentKey=key;currentEntry=entry;
    searchCount++;sessionStorage.setItem("penelopeSearchCount",searchCount);counters();
    const level=$("level").value,options=entry[level]||entry.silly||entry.mild;
    const p=profile(entry);
    $("notFound").classList.add("hidden");$("result").classList.remove("hidden");
    $("entityType").textContent=entry.type;$("resultTitle").textContent=entry.name;
    $("award").textContent=pick(["🏆 Certified Librarian Nightmare","🪿 Goose-Approved Misinformation","📚 Book Club Menace","🚨 English Teacher Alert"],cycle+2);
    const witty=window.PenelopePersonality.lineFor(entry,key,cycle,searchCount,repeated);
    $("penelopeLine").textContent="🪿 Penelope says: “"+witty+"”";bubble(witty);
    $("synopsis").textContent=pick(options,cycle);
    $("rating").textContent=(4.5+((entry.name.length*7+cycle*11)%49)/100).toFixed(2);
    $("audience").textContent="Based on "+(1250+((entry.name.length*643+cycle*977)%8750)).toLocaleString()+" "+pick(p.audiences,cycle+1);
    const genres=$("genres");genres.innerHTML="";[0,1,2,3].map(i=>pick(p.genres,cycle+i)).filter((v,i,a)=>a.indexOf(v)===i).forEach(value=>{const chip=document.createElement("span");chip.textContent=value;genres.appendChild(chip)});
    $("quote").textContent="“"+pick(p.quotes,cycle+1)+"”";$("review").textContent=pick(p.reviews,cycle+2);
    $("trailer").textContent=pick(p.trailers,cycle+3);$("moral").textContent=pick(p.morals,cycle+4);
    $("ending").textContent=pick(p.endings,cycle+5);$("question").textContent=pick(p.questions,cycle+6);
    const related=$("related");related.innerHTML="";(entry.related||[]).forEach(value=>{const button=document.createElement("button");button.textContent=value;button.addEventListener("click",()=>runSearch(value));related.appendChild(button)});
    $("saveStatus").textContent="";renderSaved();
    $("result").scrollIntoView({behavior:"smooth",block:"start"});
  }
  function showNotFound(value){
    $("result").classList.add("hidden");$("notFound").classList.remove("hidden");
    const target=$("notFoundSuggestions");target.innerHTML="";
    window.PenelopeSearch.suggestions(value,4).forEach(({entry})=>{
      const button=document.createElement("button");button.textContent=entry.name+" · "+entry.type;button.addEventListener("click",()=>runSearch(entry.name));target.appendChild(button);
    });
    bubble("I checked every shelf. This title may already be checked out.");
  }
  function runSearch(value,advance=false){
    const key=window.PenelopeSearch.keyFor(value);
    if(!key){showNotFound(value);return}
    render(key,advance);
  }

  $("searchBtn").addEventListener("click",()=>runSearch($("query").value));
  $("themeBtn").addEventListener("click",toggleTheme);
  $("query").addEventListener("keydown",event=>{if(event.key==="Enter"){event.preventDefault();runSearch(event.target.value)}});
  $("query").addEventListener("input",event=>{const value=event.target.value.trim();value.length>=3?showSuggestions(value):$("suggestions").classList.remove("show")});
  document.querySelectorAll(".example").forEach(button=>button.addEventListener("click",()=>{$("query").value=button.dataset.query;runSearch(button.dataset.query)}));
  $("tryAgainBtn").addEventListener("click",()=>currentKey&&render(currentKey,true));
  $("worseBtn").addEventListener("click",()=>{const level=$("level");level.value=level.value==="mild"?"silly":"wild";currentKey&&render(currentKey,true)});
  $("honkBtn").addEventListener("click",honk);$("penelopeBtn").addEventListener("click",honk);
  $("saveBtn").addEventListener("click",()=>{
    if(!currentEntry)return;
    const saved=window.PenelopeCard.save(currentEntry,$("synopsis").textContent);
    $("saveStatus").textContent=saved?"Saved to your card!":"Already on your card.";
    renderSaved();
  });

  updateThemeButton();counters();renderSaved();
  bubble(visitCount>1?"Welcome back! I see you're still looking for accurate summaries.":"Welcome to my library. Please keep all facts outside.");
})();
