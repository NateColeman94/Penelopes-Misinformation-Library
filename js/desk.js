(function(){
  "use strict";
  let context=null;
  let shuffleOffset=0;
  let noticeOffset=0;

  let personalRecommendationKey=null;
  let wildCardKey=null;

  const categoryFallbacks={
    fantasy:["the hobbit","six of crows","mistborn","the way of kings","howls moving castle"],
    "ya-favorites":["the hunger games","six of crows","fourth wing","divergent","shadow and bone"],
    manga:["fullmetal alchemist","one piece","spy x family","the apothecary diaries","demon slayer"],
    "mystery-horror":["rebecca","gone girl","coraline","the silent patient","the haunting of hill house"],
    romance:["pride and prejudice","book lovers","the notebook","red white and royal blue","outlander"],
    "literary-classics":["pride and prejudice","1984","the great gatsby","jane eyre","the odyssey"],
    "childrens-books":["charlottes web","matilda","winnie the pooh","the secret garden","where the wild things are"],
    "christian-books":["mere christianity","the screwtape letters","the pilgrims progress","redeeming love","the case for christ"],
    "comics-graphic":["watchmen","maus","persepolis","spider man","batman"],
    "penelope-favorites":["the hobbit","charlottes web","moby dick","pride and prejudice","coraline"]
  };

  const deskObjects=[
    {id:"tea",icon:"☕",name:"Tea Cup",detail:"Every librarian needs tea.",unlock:()=>true},
    {id:"books",icon:"📚",name:"Returned Books",detail:"Appears after five searches.",unlock:s=>s.searches>=5},
    {id:"glasses",icon:"👓",name:"Spare Glasses",detail:"Appears after ten searches.",unlock:s=>s.searches>=10},
    {id:"feather",icon:"🪶",name:"Feather Bookmark",detail:"Appears after ten honks.",unlock:s=>s.honks>=10},
    {id:"stamp",icon:"🗃️",name:"Brass Library Stamp",detail:"Appears after three saved explanations.",unlock:s=>s.saved>=3},
    {id:"patron",icon:"🪪",name:"Regular Patron Card",detail:"Appears after five visits.",unlock:s=>s.visits>=5},
    {id:"dragon",icon:"🐉",name:"Tiny Dragon",detail:"Appears after ten Fantasy searches.",unlock:s=>(s.categories.fantasy||0)>=10},
    {id:"magnifier",icon:"🔍",name:"Magnifying Glass",detail:"Appears after ten Mystery & Horror searches.",unlock:s=>(s.categories["mystery-horror"]||0)>=10},
    {id:"flower",icon:"🌸",name:"Pressed Flower",detail:"Appears after ten Romance searches.",unlock:s=>(s.categories.romance||0)>=10},
    {id:"crown",icon:"👑",name:"Crown Bookmark",detail:"Appears after repeated Disney and fairy-tale browsing.",unlock:s=>(s.categories["penelope-favorites"]||0)>=10},
    {id:"ramen",icon:"🍜",name:"Mini Ramen Bowl",detail:"Appears after ten Manga searches.",unlock:s=>(s.categories.manga||0)>=10},
    {id:"letter",icon:"✉️",name:"Patron Letter",detail:"Appears after five Easter eggs.",unlock:s=>s.easterEggs>=5}
  ];

  const $=id=>document.getElementById(id);
  function dailySeed(offset=0){
    const d=new Date();
    return Number(`${d.getFullYear()}${d.getMonth()+1}${d.getDate()}`)+offset;
  }
  function choose(items,offset=0){
    if(!Array.isArray(items)||!items.length)return null;
    return items[((dailySeed(offset)+shuffleOffset)%items.length+items.length)%items.length];
  }
  function selection(){
    const data=window.PENELOPE_DESK_DATA||{};
    return {
      reading:choose(data.currentlyReading,0),
      recommendation:choose(data.recommendations,7),
      misunderstanding:choose(data.misunderstandings,13),
      notice:choose(data.notices,19+noticeOffset),
      mail:choose(data.mail,29)
    };
  }
  function noteFor(key){
    const data=window.PENELOPE_DESK_DATA||{};
    const entry=context?.library?.[key];
    return data.notes?.[key] || entry?.silly?.[0] || "Penelope has misplaced the note.";
  }
  function setCard(prefix,key){
    const entry=context?.library?.[key];
    if(!entry)return;
    $(`desk${prefix}Title`).textContent=entry.name;
    $(`desk${prefix}Note`).textContent=`“${noteFor(key)}”`;
    $(`desk${prefix}Btn`).dataset.key=key;
  }
  function seasonObject(){
    const month=new Date().getMonth();
    if(month>=2&&month<=4)return {icon:"🌷",name:"Spring Flowers"};
    if(month>=5&&month<=7)return {icon:"🧋",name:"Summer Iced Tea"};
    if(month>=8&&month<=10)return {icon:"🎃",name:"Autumn Bookmark"};
    return {icon:"❄️",name:"Winter Snow Globe"};
  }

  function renderObjects(){
    const tray=$("deskObjectTray");
    if(!tray)return;
    const stats=window.PenelopeMemoryV2?.snapshot?.()||{
      searches:0,honks:0,visits:0,saved:0,categories:{},easterEggs:0
    };
    tray.innerHTML="";
    const unlocked=deskObjects.filter(object=>object.unlock(stats));
    const seasonal=seasonObject();
    [...unlocked,{id:"season",...seasonal,detail:"Changes with the season.",unlock:()=>true}].forEach(object=>{
      const item=document.createElement("div");
      item.className="desk-object";
      item.title=`${object.name}: ${object.detail}`;
      const icon=document.createElement("span");
      icon.textContent=object.icon;
      const label=document.createElement("small");
      label.textContent=object.name;
      item.append(icon,label);
      tray.appendChild(item);
    });
    const locked=deskObjects.length-unlocked.length;
    const note=$("deskProgressNote");
    if(note){
      if(locked===0)note.textContent="Penelope's desk is wonderfully crowded.";
      else if(unlocked.length<=2)note.textContent="The desk will quietly fill as you explore.";
      else note.textContent=`${unlocked.length} desk keepsakes collected · ${locked} still hidden`;
    }
  }


  function recommendationCandidates(){
    const library=window.PENELOPE_LIBRARY||{};
    const memory=window.PenelopeMemoryV2;
    const top=memory?.topCategories?.(3)||[];
    const candidateKeys=[];

    top.forEach(({key})=>{
      (categoryFallbacks[key]||[]).forEach(candidate=>{
        if(library[candidate]&&!candidateKeys.includes(candidate))candidateKeys.push(candidate);
      });
      const collection=(window.PENELOPE_COLLECTIONS||{})[key];
      if(collection&&Array.isArray(collection.keys)){
        collection.keys.forEach(candidate=>{
          if(library[candidate]&&!candidateKeys.includes(candidate))candidateKeys.push(candidate);
        });
      }
    });

    Object.keys(library).forEach(key=>{
      if(!candidateKeys.includes(key))candidateKeys.push(key);
    });

    const unseen=candidateKeys.filter(key=>!memory?.hasSeenTitle?.(key));
    return unseen.length?unseen:candidateKeys;
  }

  function recommendationReason(key){
    const top=window.PenelopeMemoryV2?.topCategories?.(2)||[];
    const readable={
      fantasy:"Fantasy",
      "ya-favorites":"Young Adult",
      manga:"Manga",
      "mystery-horror":"Mystery & Horror",
      romance:"Romance",
      "literary-classics":"Literary Classics",
      "childrens-books":"Children's Books",
      "christian-books":"Christian Books",
      "comics-graphic":"Comics & Graphic Novels",
      "penelope-favorites":"Penelope's Favorites"
    };
    if(!top.length)return "You have displayed excellent persistence and questionable trust in a goose.";
    const names=top.map(item=>readable[item.key]||item.key).join(" and ");
    const extra=(window.PenelopeMemoryV2?.snapshot?.().honks||0)>=15
      ?" You also made me honk enough times to influence the decision."
      :"";
    return `You keep returning to ${names}, so I selected something nearby—but not too obvious.${extra}`;
  }

  function choosePersonalRecommendation(forceNew=false){
    const library=window.PENELOPE_LIBRARY||{};
    const candidates=recommendationCandidates();
    if(!candidates.length)return null;

    if(forceNew||!personalRecommendationKey||!library[personalRecommendationKey]){
      const pool=candidates.filter(key=>key!==personalRecommendationKey);
      personalRecommendationKey=(pool.length?pool:candidates)[Math.floor(Math.random()*(pool.length||candidates.length))];
    }

    const entry=library[personalRecommendationKey];
    if(!entry)return null;
    const note=pick(entry.silly||entry.wild||entry.mild,Math.floor(Math.random()*7));
    return {key:personalRecommendationKey,entry,note,reason:recommendationReason(personalRecommendationKey)};
  }


  function chooseWildCard(excludeKey){
    const library=window.PENELOPE_LIBRARY||{};
    const all=Object.keys(library).filter(k=>k!==excludeKey&&library[k]?.name);
    if(!all.length)return null;
    const pool=all.filter(k=>k!==wildCardKey);
    wildCardKey=(pool.length?pool:all)[Math.floor(Math.random()*(pool.length||all.length))];
    const entry=library[wildCardKey];
    const note=pick(entry.silly||entry.wild||entry.mild,Math.floor(Math.random()*7));
    return {key:wildCardKey,entry,note};
  }

  const personalLetters=[
    "Dear reader, I've tucked these aside because I think they'll make you smile.",
    "I noticed where you lingered in the stacks, so I saved these before anyone else could misfile them.",
    "A librarian develops instincts. A goose develops stronger ones. These are for you."
  ];
  const personalSignatures=[
    "A goose never forgets a good reader.",
    "This book practically honked your name.",
    "I've been saving this one for the right patron.",
    "The mystery section insisted. I reluctantly agreed."
  ];

  function renderPersonalRecommendation(forceNew=false){
    const readiness=window.PenelopeMemoryV2?.recommendationReadiness?.();
    const lock=$("recommendationLock");
    const unlocked=$("recommendationUnlocked");
    if(!readiness||!lock||!unlocked)return;

    if(!readiness.unlocked){
      lock.classList.remove("hidden");
      unlocked.classList.add("hidden");
      const stats=window.PenelopeMemoryV2?.snapshot?.()||{searches:0,visits:0,saved:0,categories:{}};
      const variety=Object.keys(stats.categories||{}).filter(k=>(stats.categories[k]||0)>0).length;
      let message="I'm still learning which shelves you wander toward...";
      if(stats.searches>=5||stats.visits>=2)message="I've noticed your visits and I'm beginning to understand your shelves.";
      if(stats.searches>=8||stats.saved>=2||variety>=2)message="A few more adventures and I'll have something tucked aside just for you.";
      $("recommendationProgress").innerHTML=`<strong>Getting to Know You</strong><br>${message}`;
      return;
    }

    const recommendation=choosePersonalRecommendation(forceNew);
    if(!recommendation)return;
    lock.classList.add("hidden");
    unlocked.classList.remove("hidden");
    $("personalRecommendationTitle").textContent=recommendation.entry.name;
    $("personalRecommendationNote").textContent="“"+recommendation.note+"”";
    $("personalRecommendationReason").textContent=recommendation.reason;
    $("personalRecommendationLetter").textContent=personalLetters[Math.floor(Math.random()*personalLetters.length)];
    $("personalRecommendationSignature").textContent=personalSignatures[Math.floor(Math.random()*personalSignatures.length)]+" — Penelope 🪿";
    $("openPersonalRecommendationBtn").dataset.key=recommendation.key;
    const wild=chooseWildCard(recommendation.key);
    if(wild){$("wildCardTitle").textContent=wild.entry.name;$("wildCardNote").textContent=`“${wild.note}”`;$("openWildCardBtn").dataset.key=wild.key;}
  }

  function render(){
    const picked=selection();
    setCard("Reading",picked.reading);
    setCard("Recommendation",picked.recommendation);
    setCard("Misunderstanding",picked.misunderstanding);
    $("deskNotice").textContent=picked.notice||"The notice board is taking a personal day.";
    $("deskMailFrom").textContent=picked.mail?`From: ${picked.mail.from}`:"No mail today";
    $("openDeskMailBtn").disabled=!picked.mail;
    $("openDeskMailBtn").dataset.from=picked.mail?.from||"";
    $("openDeskMailBtn").dataset.text=picked.mail?.text||"";
    renderObjects();
    renderPersonalRecommendation(false);
    window.dispatchEvent(new CustomEvent("penelope:desk-rendered",{detail:picked}));
  }
  function openTitle(event){
    const key=event.currentTarget.dataset.key;
    const entry=context?.library?.[key];
    if(entry)context.runSearch(entry.name);
  }
  function openMail(){
    $("deskMailText").textContent=$("openDeskMailBtn").dataset.text||"The letter is blank. This feels intentional.";
    $("deskMailSignature").textContent=`— ${$("openDeskMailBtn").dataset.from||"An anonymous patron"}`;
    $("deskMailPanel").classList.remove("hidden");
    $("deskMailPanel").scrollIntoView({behavior:"smooth",block:"center"});
  }
  function init(options={}){
    context=options;
    ["deskReadingBtn","deskRecommendationBtn","deskMisunderstandingBtn"].forEach(id=>$(id)?.addEventListener("click",openTitle));
    $("refreshDeskBtn")?.addEventListener("click",()=>{shuffleOffset+=11;render();context?.bubble?.("I have rearranged my desk. Nothing is where I left it.")});
    $("newDeskNoticeBtn")?.addEventListener("click",()=>{noticeOffset+=1;render()});
    $("openDeskMailBtn")?.addEventListener("click",openMail);
    $("closeDeskMailBtn")?.addEventListener("click",()=>$("deskMailPanel").classList.add("hidden"));
    $("refreshPersonalRecommendationBtn")?.addEventListener("click",()=>renderPersonalRecommendation(true));
    $("openWildCardBtn")?.addEventListener("click",()=>{
      const key=$("openWildCardBtn").dataset.key; const entry=(window.PENELOPE_LIBRARY||{})[key]; if(entry)context?.runSearch?.(entry.name);
    });
    $("openPersonalRecommendationBtn")?.addEventListener("click",()=>{
      const key=$("openPersonalRecommendationBtn").dataset.key;
      const entry=(window.PENELOPE_LIBRARY||{})[key];
      if(entry){
        const input=$("query");
        if(input)input.value=entry.name;
        window.dispatchEvent(new CustomEvent("penelope:desk-open",{detail:{key,name:entry.name}}));
      }
    });
    window.addEventListener("penelope:memory-updated",()=>{renderObjects();renderPersonalRecommendation(false)});
    window.addEventListener("penelope:activity-changed",()=>setTimeout(renderObjects,30));
    render();
  }
  window.PenelopeDesk={init,selection,render,renderObjects,renderPersonalRecommendation};
})();
