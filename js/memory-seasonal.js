
(function(){
  "use strict";
  const Storage=window.PenelopeStorage;
  const DAY_KEY="penelopeVisitDays";
  const MEMORY_KEY="penelopeMemoryV1";
  const ACHIEVEMENT_KEY="penelopeAchievementsV1";

  const today=()=>new Date().toISOString().slice(0,10);
  const getMemory=()=>Storage.get(MEMORY_KEY,{
    totalSearches:0,
    categories:{},
    titles:{},
    easterEggs:[],
    savedCount:0,
    tournamentWins:0
  });
  const saveMemory=memory=>Storage.set(MEMORY_KEY,memory);

  function recordVisit(){
    const days=Storage.get(DAY_KEY,[]);
    const current=today();
    if(!days.includes(current)){
      days.push(current);
      Storage.set(DAY_KEY,days.slice(-365));
    }
    return days.length;
  }

  function recordSearch(entry,key,collectionKeys=[]){
    const memory=getMemory();
    memory.totalSearches=(memory.totalSearches||0)+1;
    memory.titles[key]=(memory.titles[key]||0)+1;
    collectionKeys.forEach(collection=>{
      memory.categories[collection]=(memory.categories[collection]||0)+1;
    });
    saveMemory(memory);
    return memory;
  }

  function recordEasterEgg(term){
    const memory=getMemory();
    if(!memory.easterEggs.includes(term))memory.easterEggs.push(term);
    saveMemory(memory);
  }

  function dominantShelf(){
    const categories=getMemory().categories||{};
    const entries=Object.entries(categories).sort((a,b)=>b[1]-a[1]);
    return entries.length?entries[0][0]:null;
  }

  function memoryGreeting(visitDays){
    const memory=getMemory();
    const shelf=dominantShelf();
    if(visitDays>=100)return "At this point, I'm fairly certain you work here.";
    if(visitDays>=25)return "I've already stamped your library card three times today.";
    if(visitDays>=10)return "You know where everything is better than I do.";
    if(visitDays>=5)return "You're becoming one of my favorite patrons.";
    if(visitDays>=2&&shelf){
      const shelfLines={
        fantasy:"Fantasy again? Excellent choice.",
        "ya-favorites":"Back to Young Adult? The teenagers remain unsupervised.",
        manga:"You've wandered into the manga aisle again.",
        "mystery-horror":"You're much braver than I am.",
        romance:"Romance again? Good luck to everyone involved.",
        "literary-classics":"The classics have been expecting you.",
        "childrens-books":"The picture books are behaving today.",
        "christian-books":"The reflection shelf is ready for you.",
        "comics-graphic":"The capes have reorganized themselves again."
      };
      return shelfLines[shelf]||"Welcome back. Your usual shelf is waiting.";
    }
    if(visitDays>=2)return "Welcome back! I see you're still looking for accurate summaries.";
    if(memory.totalSearches>=100)return "I'm going to need another stamp.";
    if(memory.totalSearches>=50)return "The checkout desk has never been this popular.";
    if(memory.totalSearches>=10)return "You're keeping me wonderfully busy.";
    return "Welcome to my library. Please keep all facts outside.";
  }

  function season(){
    const date=new Date();
    const month=date.getMonth();
    const day=date.getDate();
    if(month===9&&day===31)return "halloween";
    if(month===11&&day>=20&&day<=31)return "holiday";
    if(month===1&&day>=10&&day<=14)return "valentine";
    if(month>=2&&month<=4)return "spring";
    if(month>=5&&month<=7)return "summer";
    if(month>=8&&month<=10)return "autumn";
    return "winter";
  }

  const seasonConfig={
    spring:{
      className:"season-spring",desk:"🌷",
      lines:["Someone keeps pressing flowers inside the poetry books.","The gardening section is unusually optimistic today."]
    },
    summer:{
      className:"season-summer",desk:"🧋",
      lines:["Summer reading counts—even the wonderfully misunderstood kind.","The beach reads are trying to escape again."]
    },
    autumn:{
      className:"season-autumn",desk:"🍂",
      lines:["The Horror shelf gets suspiciously popular this time of year.","I have found cinnamon between the pages again."]
    },
    winter:{
      className:"season-winter",desk:"☕",
      lines:["Please warm your hands before touching the rare books.","The fireplace has checked out every cozy mystery."]
    },
    halloween:{
      className:"season-halloween",desk:"🎃",
      lines:["I have confirmed at least three ghosts have overdue books.","The fake cobwebs have become administratively complicated."]
    },
    holiday:{
      className:"season-holiday",desk:"✨",
      lines:["Holiday romances have escaped again.","The cocoa is warm. The summaries remain unreliable."]
    },
    valentine:{
      className:"season-valentine",desk:"💌",
      lines:["Handle the Romance shelf with dramatic expectations.","The love letters are overdue and emotionally complicated."]
    }
  };

  function applySeason(){
    const key=season(),config=seasonConfig[key];
    document.body.classList.add(config.className);
    const layer=document.getElementById("seasonalLayer");
    const desk=document.getElementById("seasonalDeskItem");
    if(layer)layer.dataset.season=key;
    if(desk)desk.textContent=config.desk;
    return {key,config};
  }

  const achievementDefs=[
    {id:"first-search",icon:"📚",name:"First Checkout",test:s=>s.searches>=1,detail:"Performed your first search."},
    {id:"goose-approved",icon:"🪿",name:"Goose Approved",test:s=>s.saved>=1,detail:"Saved your first misunderstanding."},
    {id:"honk-enthusiast",icon:"📣",name:"Honk Enthusiast",test:s=>s.honks>=10,detail:"Requested ten librarian reactions."},
    {id:"fantasy-explorer",icon:"🏰",name:"Fantasy Explorer",test:s=>(s.categories.fantasy||0)>=5,detail:"Explored five Fantasy entries."},
    {id:"disney-scholar",icon:"👑",name:"Disney Scholar",test:s=>(s.categories["disney"]||0)>=5||(s.categories["penelope-favorites"]||0)>=10,detail:"Explored Disney and fairy-tale shelves."},
    {id:"manga-marathon",icon:"🎌",name:"Manga Marathon",test:s=>(s.categories.manga||0)>=10,detail:"Visited ten Manga entries."},
    {id:"classic-collector",icon:"📜",name:"Classic Collector",test:s=>(s.categories["literary-classics"]||0)>=10,detail:"Read ten Literary Classics entries."},
    {id:"penelope-regular",icon:"🪪",name:"Penelope Regular",test:s=>s.visitDays>=5,detail:"Visited on five different days."},
    {id:"easter-egg-hunter",icon:"🥚",name:"Easter Egg Hunter",test:s=>s.easterEggs>=5,detail:"Discovered five hidden searches."},
    {id:"hall-curator",icon:"🏆",name:"Hall of Shame Curator",test:s=>s.shame>=5,detail:"Saved five entries to the Hall of Shame."}
  ];

  function stats(){
    const memory=getMemory();
    const card=window.PenelopeCard?window.PenelopeCard.all():[];
    return {
      searches:memory.totalSearches||0,
      categories:memory.categories||{},
      easterEggs:(memory.easterEggs||[]).length,
      visitDays:Storage.get(DAY_KEY,[]).length,
      honks:Number(Storage.get("penelopeHonkCount",0)),
      saved:card.length,
      shame:card.filter(item=>item.shelf==="shame").length
    };
  }

  function achievements(){
    const s=stats();
    return achievementDefs.map(def=>({...def,earned:Boolean(def.test(s))}));
  }

  function resetAchievements(){
    Storage.set(ACHIEVEMENT_KEY,[]);
    Storage.set(MEMORY_KEY,{totalSearches:0,categories:{},titles:{},easterEggs:[],savedCount:0,tournamentWins:0});
    Storage.set(DAY_KEY,[today()]);
  }

  window.PenelopeMemory={
    recordVisit,recordSearch,recordEasterEgg,memoryGreeting,applySeason,
    getMemory,achievements,resetAchievements,season
  };
})();
