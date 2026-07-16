
(function(){
  "use strict";
  const library=window.PENELOPE_LIBRARY||{},profiles=window.PENELOPE_PROFILES||{};
  const easterEggs=window.PENELOPE_EASTER_EGGS||{};
  const $=id=>document.getElementById(id);
  const pick=(items,index)=>items&&items.length?items[((index%items.length)+items.length)%items.length]:"Penelope misplaced this section.";
  let currentKey=null,currentEntry=null,cycle=0,apiSequence=0;
  let searchCount=Number(window.PenelopeStorage.get("penelopeSearchCount",0));
  let honkCount=Number(window.PenelopeStorage.get("penelopeHonkCount",0));
  const visitCount=Number(window.PenelopeStorage.get("penelopeVisitCount",0))+1;
  const savedTheme=window.PenelopeStorage.get("penelopeTheme","light");
  window.PenelopeStorage.set("penelopeVisitCount",visitCount);
  if(savedTheme==="dark")document.body.classList.add("dark");

  function updateThemeButton(){const dark=document.body.classList.contains("dark");$("themeBtn").textContent=dark?"☀️ Light shelves":"🌙 Dark shelves";$("themeBtn").setAttribute("aria-pressed",String(dark))}
  function toggleTheme(){document.body.classList.toggle("dark");window.PenelopeStorage.set("penelopeTheme",document.body.classList.contains("dark")?"dark":"light");updateThemeButton()}
  function counters(){$("searchCount").textContent=searchCount;$("honkCount").textContent=honkCount}
  counters();
  setTimeout(counters,0);
  function bubble(text){$("penelopeBubble").innerHTML="<strong>Penelope says:</strong><br>“"+text+"”"}
  function footprints(){const rect=$("penelopeBtn").getBoundingClientRect();for(let i=0;i<4;i++){const foot=document.createElement("span");foot.className="footprint";foot.textContent=i%2?"•":"𓅰";foot.style.left=rect.left+rect.width*.2+i*18+"px";foot.style.top=rect.bottom-8+i*4+"px";document.body.appendChild(foot);setTimeout(()=>foot.remove(),1600)}}
  function honk(){honkCount++;window.PenelopeStorage.set("penelopeHonkCount",honkCount);counters();window.dispatchEvent(new CustomEvent("penelope:activity-changed",{detail:{type:"honk"}}));footprints();const text=window.PenelopePersonality.clickLine(honkCount,searchCount,visitCount);bubble(text);const button=$("penelopeBtn");button.classList.remove("honking");void button.offsetWidth;button.classList.add("honking");window.PenelopePersonality.sound(text.includes("Double"))}
  function profile(entry){const base=profiles[entry.key]||profiles.default||{},result={};["audiences","genres","quotes","reviews","trailers","morals","endings","questions"].forEach(field=>result[field]=entry[field]||base[field]||["Penelope has not cataloged this section yet."]);return result}
  function hideStatus(){$("apiLoading").classList.add("hidden");$("notFound").classList.add("hidden")}
  function showSuggestions(value,target=$("suggestions")){
    const matches=window.PenelopeSearch.suggestions(value,5);target.innerHTML="";
    if(!matches.length){target.classList.remove("show");return}
    const label=document.createElement("strong");label.textContent="Did you mean:";
    const row=document.createElement("div");row.className="button-row";
    matches.forEach(({entry})=>{const button=document.createElement("button");button.textContent=entry.name+" · "+entry.type;button.addEventListener("click",()=>{target.classList.remove("show");$("query").value=entry.name;runSearch(entry.name)});row.appendChild(button)});
    target.append(label,row);target.classList.add("show");
  }
  function shelfLabel(shelf){return{approved:"🪿 Goose Approved",favorites:"📚 My Favorites",shame:"🏆 Hall of Shame"}[shelf]||"Saved"}
  function renderSavedInto(wrap){
    if(!wrap)return;
    const items=window.PenelopeCard.all();
    wrap.innerHTML="";
    if(!items.length){
      wrap.innerHTML="<p>Your card is empty. Save a favorite misunderstanding after searching for a book.</p>";
      return;
    }
    ["approved","favorites","shame"].forEach(shelf=>{
      const shelfItems=items.filter(item=>item.shelf===shelf);
      if(!shelfItems.length)return;
      const section=document.createElement("section");
      section.className="saved-shelf";
      const heading=document.createElement("div");
      heading.className="saved-shelf-heading";
      const h4=document.createElement("h4");
      h4.textContent=shelfLabel(shelf);
      const clear=document.createElement("button");
      clear.className="remove";
      clear.textContent="Clear shelf";
      clear.addEventListener("click",()=>{
        window.PenelopeCard.clearShelf(shelf);
        renderSaved();
  renderLibraryHoldings();
      });
      heading.append(h4,clear);
      section.appendChild(heading);
      shelfItems.forEach(item=>{
        const div=document.createElement("div");
        div.className="saved-entry";
        const strong=document.createElement("strong");
        strong.textContent=item.title+" · "+item.type;
        const p=document.createElement("p");
        p.textContent=item.synopsis;
        const small=document.createElement("small");
        small.textContent=`Saved ${item.date} · ${item.source}`;
        const remove=document.createElement("button");
        remove.className="remove";
        remove.textContent="Remove";
        remove.addEventListener("click",()=>{
          window.PenelopeCard.remove(item.id);
          renderSaved();
        });
        div.append(strong,p,small,document.createElement("br"),remove);
        section.appendChild(div);
      });
      wrap.appendChild(section);
    });
  }

  function renderSaved(){
    renderSavedInto($("savedItems"));
    renderSavedInto($("homeSavedItems"));
  }

  function renderEntry(entry,key,advance=false){
    const repeated=currentKey===key;cycle=(advance||repeated)?cycle+1:0;currentKey=key;currentEntry=entry;
    searchCount++;
    window.PenelopeStorage.set("penelopeSearchCount",searchCount);
    if(!entry.apiSource&&window.PenelopeMemory){
      window.PenelopeMemory.recordSearch(entry,key,collectionsForKey(key));
    }
    counters();window.dispatchEvent(new CustomEvent("penelope:activity-changed",{detail:{type:"search",key}}));hideStatus();
    const level=$("level").value,options=entry[level]||entry.silly||entry.mild,p=profile(entry);
    $("result").classList.remove("hidden");$("entityType").textContent=entry.type;$("resultTitle").textContent=entry.name;
    const source=$("sourceBadge"),preview=$("sourcePreview");
    if(entry.apiSource){
      source.textContent="📚 Borrowed through Interlibrary Loan";
      source.classList.remove("hidden");
    }else{
      source.textContent="";
      source.classList.add("hidden");
    }
    preview.textContent="";
    preview.classList.add("hidden");
    $("award").textContent=pick(["🏆 Certified Librarian Nightmare","🪿 Goose-Approved Misinformation","📚 Book Club Menace","🚨 English Teacher Alert"],cycle+2);
    const witty=entry.apiSource?"Good news! I found the book. Bad news! I misunderstood it.":window.PenelopePersonality.lineFor(entry,key,cycle,searchCount,repeated,level);
    $("penelopeLine").textContent="🪿 Penelope says: “"+witty+"”";bubble(witty);$("synopsis").textContent=pick(options,cycle);
    $("rating").textContent=(4.5+((entry.name.length*7+cycle*11)%49)/100).toFixed(2);
    $("audience").textContent="Based on "+(1250+((entry.name.length*643+cycle*977)%8750)).toLocaleString()+" "+pick(p.audiences,cycle+1);
    const genres=$("genres");genres.innerHTML="";[0,1,2,3].map(i=>pick(p.genres,cycle+i)).filter((value,index,array)=>array.indexOf(value)===index).forEach(value=>{const chip=document.createElement("span");chip.textContent=value;genres.appendChild(chip)});
    $("quote").textContent="“"+pick(p.quotes,cycle+1)+"”";$("review").textContent=pick(p.reviews,cycle+2);$("trailer").textContent=pick(p.trailers,cycle+3);$("moral").textContent=pick(p.morals,cycle+4);$("ending").textContent=pick(p.endings,cycle+5);$("question").textContent=pick(p.questions,cycle+6);
    const related=$("related");related.innerHTML="";(entry.related||[]).forEach(value=>{const button=document.createElement("button");button.textContent=value;button.addEventListener("click",()=>runSearch(value));related.appendChild(button)});
    $("saveStatus").textContent="";renderSaved();$("result").scrollIntoView({behavior:"smooth",block:"start"});
  }
  function showNotFound(value,apiFailed=false){
    $("apiLoading").classList.add("hidden");$("result").classList.add("hidden");$("notFound").classList.remove("hidden");
    $("notFound").querySelector("p").textContent=apiFailed?"Penelope could not reach the public shelves. This book may be checked out, or Open Library may be temporarily unavailable.":"Penelope checked every shelf. This title may be checked out or it has not entered the misinformation system yet.";
    const target=$("notFoundSuggestions");target.innerHTML="";window.PenelopeSearch.suggestions(value,4).forEach(({entry})=>{const button=document.createElement("button");button.textContent=entry.name+" · "+entry.type;button.addEventListener("click",()=>runSearch(entry.name));target.appendChild(button)});bubble("I checked every shelf. This title may already be checked out.")
  }
  async function searchOpenLibrary(value){
    const requestId=++apiSequence;$("result").classList.add("hidden");$("notFound").classList.add("hidden");$("apiLoading").classList.remove("hidden");bubble("The handcrafted catalog missed. I am consulting the public shelves.");
    try{const results=await window.PenelopeOpenLibrary.search(value);if(requestId!==apiSequence)return;if(!results.length){showNotFound(value,false);return}renderEntry(results[0].entry,"api:"+window.PenelopeSearch.normalize(results[0].entry.name),false)}
    catch(error){console.error("Open Library search failed:",error);if(requestId===apiSequence)showNotFound(value,true)}
  }


  function renderLibraryHoldings(){
    const entries=Object.values(window.PENELOPE_LIBRARY||{});
    const counts={Book:0,"Book Series":0,Author:0,Character:0};
    entries.forEach(entry=>{if(Object.prototype.hasOwnProperty.call(counts,entry.type))counts[entry.type]++});
    const wrap=$("libraryHoldings");
    if(wrap)wrap.innerHTML=`<p>Books <strong>${counts.Book}</strong></p><p>Series <strong>${counts["Book Series"]}</strong></p><p>Authors <strong>${counts.Author}</strong></p><p>Characters <strong>${counts.Character}</strong></p><p>Wonderful Misunderstandings <strong>${entries.length}</strong></p>`;
    const arrival=$("comicsArrivalCount");if(arrival)arrival.textContent="39";
  }

  function collectionsForKey(key){
    return Object.entries(window.PENELOPE_COLLECTIONS||{})
      .filter(([,collection])=>Array.isArray(collection.keys)&&collection.keys.includes(key))
      .map(([collectionKey])=>collectionKey);
  }

  function renderLegacyPassport(){
    const grid=$("passportGrid");
    if(!grid)return;
    grid.innerHTML="";
    try{
      if(!window.PenelopeMemory||typeof window.PenelopeMemory.achievements!=="function"){
        grid.innerHTML='<p class="passport-fallback">Penelope is still opening the Passport desk. Please refresh once.</p>';
        return;
      }
      const achievements=window.PenelopeMemory.achievements();
      if(!Array.isArray(achievements)||!achievements.length){
        grid.innerHTML='<p class="passport-fallback">No stamps loaded yet. Your activity is safe; Penelope is repairing the stamp drawer.</p>';
        return;
      }
      achievements.forEach(achievement=>{
      const card=document.createElement("article");
      card.className="passport-stamp "+(achievement.earned?"earned":"locked");
      const icon=document.createElement("span");
      icon.className="passport-icon";
      icon.textContent=achievement.icon;
      const title=document.createElement("strong");
      title.textContent=achievement.name;
      const detail=document.createElement("small");
      detail.textContent=achievement.detail;
      const state=document.createElement("em");
      state.textContent=achievement.earned?"STAMPED":`${Math.min(achievement.current||0,achievement.target||0)} / ${achievement.target||1}`;
      const track=document.createElement("div");
      track.className="passport-progress";
      const fill=document.createElement("span");
      fill.style.width=((achievement.progress||0)*100)+"%";
      track.appendChild(fill);
      card.append(icon,title,detail,track,state);
      grid.appendChild(card);
      });
    }catch(error){
      console.error("Passport render failed",error);
      grid.innerHTML='<p class="passport-fallback">The Passport drawer jammed, but your searches and honks are still safe.</p>';
    }
  }

  function checkEasterEgg(value){
    const normalized=window.PenelopeSearch.normalize(value);
    const line=easterEggs[normalized];
    if(!line)return false;
    window.PenelopeMemory?.recordEasterEgg(normalized);
    bubble(line);
    $("result").classList.add("hidden");
    $("apiLoading").classList.add("hidden");
    $("notFound").classList.add("hidden");
    const panel=$("collectionPanel");
    panel.innerHTML=`<div class="easter-egg-result"><span>🥚</span><h3>${value}</h3><p>“${line}”</p></div>`;
    panel.classList.remove("hidden");
    panel.scrollIntoView({behavior:"smooth",block:"start"});
    window.PenelopePassport?.render?.();
    return true;
  }

  function runSearch(value,advance=false){
    if(checkEasterEgg(value))return;
    const key=window.PenelopeSearch.keyFor(value);
    if(key){
      renderEntry(library[key],key,advance);
      return;
    }
    searchOpenLibrary(value);
  }



  function clearCollectionPanel(){
    const panel=$("collectionPanel");
    panel.innerHTML="";
    panel.classList.add("hidden");
    $("collectionSelect").value="";
    bubble("Shelf cleared. I have returned the books with only minor inaccuracies.");
  }

  function renderCollection(collectionKey){
    const collection=(window.PENELOPE_COLLECTIONS||{})[collectionKey];
    const panel=$("collectionPanel");
    panel.innerHTML="";
    if(!collection){panel.classList.add("hidden");return}
    const heading=document.createElement("div");heading.className="collection-heading";
    const title=document.createElement("h3");title.textContent=collection.name;
    const description=document.createElement("p");description.textContent=collection.description;
    heading.append(title,description);panel.appendChild(heading);
    const grid=document.createElement("div");grid.className="collection-grid";
    collection.keys.forEach(key=>{
      const entry=library[key];if(!entry)return;
      const card=document.createElement("button");card.className="collection-card";
      const name=document.createElement("strong");name.textContent=entry.name;
      const type=document.createElement("span");type.textContent=entry.type;
      const teaser=document.createElement("small");
      teaser.textContent=collectionKey==="penelope-favorites"
        ?pick(entry.wild||entry.silly,0)
        :pick(entry.silly||entry.mild,0);
      card.append(name,type,teaser);
      card.addEventListener("click",()=>{$("query").value=entry.name;runSearch(entry.name)});
      grid.appendChild(card);
    });
    panel.appendChild(grid);panel.classList.remove("hidden");
    panel.scrollIntoView({behavior:"smooth",block:"start"});
  }


  let tournamentQueue=[],tournamentWinners=[],tournamentRound=0,tournamentPairIndex=0;
  function tournamentExplanation(key){
    const entry=library[key];
    return pick(entry.wild||entry.silly||entry.mild,Math.abs(key.length+tournamentRound));
  }
  function showTournamentMatch(){
    const match=$("tournamentMatch"),status=$("tournamentStatus");
    if(tournamentQueue.length===1&&!tournamentWinners.length){
      const winner=library[tournamentQueue[0]];
      status.textContent=`Champion: ${winner.name}`;
      match.innerHTML="";
      const card=document.createElement("div");card.className="champion-card";
      const h=document.createElement("h3");h.textContent="🪿 Penelope crowns "+winner.name;
      const p=document.createElement("p");p.textContent=tournamentExplanation(tournamentQueue[0]);
      const save=document.createElement("button");save.textContent="🏆 Save Champion to Hall of Shame";
      save.addEventListener("click",()=>{
        window.PenelopeCard.save(winner,p.textContent,"shame");renderSaved();$("saveStatus").textContent="Tournament champion saved!";
      });
      card.append(h,p,save);match.appendChild(card);match.classList.remove("hidden");return;
    }
    if(tournamentPairIndex>=tournamentQueue.length){
      tournamentQueue=tournamentWinners;tournamentWinners=[];tournamentPairIndex=0;tournamentRound++;
      if(tournamentQueue.length===1){showTournamentMatch();return}
    }
    const leftKey=tournamentQueue[tournamentPairIndex],rightKey=tournamentQueue[tournamentPairIndex+1];
    if(!rightKey){tournamentWinners.push(leftKey);tournamentPairIndex+=2;showTournamentMatch();return}
    status.textContent=`Round ${tournamentRound+1} · Match ${Math.floor(tournamentPairIndex/2)+1}`;
    match.innerHTML="";
    [leftKey,rightKey].forEach(key=>{
      const entry=library[key],button=document.createElement("button");button.className="tournament-choice";
      const name=document.createElement("strong");name.textContent=entry.name;
      const type=document.createElement("span");type.textContent=entry.type;
      const text=document.createElement("p");text.textContent=tournamentExplanation(key);
      button.append(name,type,text);
      button.addEventListener("click",()=>{tournamentWinners.push(key);tournamentPairIndex+=2;showTournamentMatch()});
      match.appendChild(button);
    });
    match.classList.remove("hidden");
  }
  function startTournament(){
    const collection=(window.PENELOPE_COLLECTIONS||{})[$("tournamentCollection").value];
    if(!collection||collection.keys.length<2){$("tournamentStatus").textContent="This shelf needs at least two entries.";return}
    const requested=Number($("tournamentSize").value||16);
    const available=Math.min(requested,collection.keys.length);
    let bracket=1;
    while(bracket*2<=available)bracket*=2;
    tournamentQueue=[...collection.keys].sort(()=>Math.random()-.5).slice(0,Math.max(2,bracket));
    tournamentWinners=[];tournamentRound=0;tournamentPairIndex=0;showTournamentMatch();
    $("tournament").scrollIntoView({behavior:"smooth",block:"start"});
  }
  $("resetPassportBtn").addEventListener("click",()=>{
    if(confirm("Reset Penelope's Library Passport and browsing memory?")){
      window.PenelopeMemory?.resetAchievements();
      window.PenelopePassport?.render?.();
      bubble("Passport reset. I have forgotten everything except where the snacks are.");
    }
  });

  window.addEventListener("penelope:desk-open",event=>{
    const name=event.detail?.name;
    if(name){
      $("query").value=name;
      runSearch(name);
    }
  });

  $("searchBtn").addEventListener("click",()=>runSearch($("query").value));$("themeBtn").addEventListener("click",toggleTheme);
  $("browseCollectionBtn").addEventListener("click",()=>renderCollection($("collectionSelect").value));
  $("clearCollectionBtn").addEventListener("click",clearCollectionPanel);
  $("startTournamentBtn").addEventListener("click",startTournament);
  $("collectionSelect").addEventListener("change",event=>{if(event.target.value)renderCollection(event.target.value)});
  $("query").addEventListener("keydown",event=>{if(event.key==="Enter"){event.preventDefault();runSearch(event.target.value)}});
  $("query").addEventListener("input",event=>{const value=event.target.value.trim();value.length>=3?showSuggestions(value):$("suggestions").classList.remove("show")});
  document.querySelectorAll(".example").forEach(button=>button.addEventListener("click",()=>{$("query").value=button.dataset.query;runSearch(button.dataset.query)}));
  $("tryAgainBtn").addEventListener("click",()=>{if(currentEntry)renderEntry(currentEntry,currentKey,true)});
  $("worseBtn").addEventListener("click",()=>{const level=$("level");level.value=level.value==="mild"?"silly":"wild";if(currentEntry)renderEntry(currentEntry,currentKey,true)});
  $("honkBtn").addEventListener("click",honk);$("penelopeBtn").addEventListener("click",honk);
  document.querySelectorAll(".save-shelf").forEach(button=>button.addEventListener("click",()=>{if(!currentEntry)return;const saved=window.PenelopeCard.save(currentEntry,$("synopsis").textContent,button.dataset.shelf);if(saved)window.dispatchEvent(new CustomEvent("penelope:activity-changed",{detail:{type:"save",shelf:button.dataset.shelf}}));$("saveStatus").textContent=saved?`Saved to ${shelfLabel(button.dataset.shelf)}!`:"That exact explanation is already on this shelf.";renderSaved()}));
  $("homeCardBtn").addEventListener("click",()=>{
    renderSaved();
    $("homeCardPanel").classList.remove("hidden");
    $("homeCardPanel").scrollIntoView({behavior:"smooth",block:"start"});
  });
  $("closeHomeCardBtn").addEventListener("click",()=>{
    $("homeCardPanel").classList.add("hidden");
    $("homeCardBtn").scrollIntoView({behavior:"smooth",block:"center"});
  });

  $("openCardBtn").addEventListener("click",()=>{renderSaved();$("savedItems").scrollIntoView({behavior:"smooth",block:"start"})});

  function initializeFoundationModules(){
    document.documentElement.classList.add("penelope-module-ready");
    window.PenelopeMemoryV2?.init?.();
    window.PenelopeSeasonal?.init?.();
    window.PenelopeDesk?.init?.({library,runSearch,bubble,pick});
    window.PenelopeTournament?.init?.({library,collections:window.PENELOPE_COLLECTIONS||{}});
  }

  window.PenelopeApp={
    search:runSearch,
    showMessage:bubble,
    refreshSaved:renderSaved,
    getCurrentEntry:()=>currentEntry,
    getCurrentKey:()=>currentKey
  };

  initializeFoundationModules();
  window.PenelopePassport?.init?.();
  searchCount=Number(window.PenelopeStorage.get("penelopeSearchCount",searchCount)||searchCount);
  honkCount=Number(window.PenelopeStorage.get("penelopeHonkCount",honkCount)||honkCount);
  updateThemeButton();
  counters();
  requestAnimationFrame(counters);
  setTimeout(()=>{counters();window.PenelopePassport?.render?.()},120);
  setTimeout(()=>{counters();window.PenelopePassport?.render?.()},600);
  window.addEventListener("load",()=>{counters();window.PenelopePassport?.render?.()},{once:true});
  renderSaved();
  window.PenelopePassport?.render?.();
  const visitDays=window.PenelopeMemory?.recordVisit()||1;
  const seasonal=window.PenelopeMemory?.applySeason();
  let greeting=window.PenelopeMemory?.memoryGreeting(visitDays)
    ||(visitCount>1?"Welcome back! I see you're still looking for accurate summaries.":"Welcome to my library. Please keep all facts outside.");
  if(seasonal&&Math.random()<0.35){
    const lines=seasonal.config.lines;
    greeting=lines[Math.floor(Math.random()*lines.length)];
  }
  bubble(greeting);
})();