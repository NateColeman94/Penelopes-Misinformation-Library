(function(){
  "use strict";

  const Storage=window.PenelopeStorage;
  const DAY_KEY="penelopeVisitDays";
  const MEMORY_KEY="penelopeMemoryV1";
  const ACHIEVEMENT_KEY="penelopeAchievementsV1";

  const today=()=>new Date().toISOString().slice(0,10);

  function defaultMemory(){
    return {
      totalSearches:0,
      categories:{},
      titles:{},
      easterEggs:[],
      savedCount:0,
      tournamentWins:0
    };
  }

  function getMemory(){
    return Storage.get(MEMORY_KEY,defaultMemory());
  }

  function saveMemory(memory){
    Storage.set(MEMORY_KEY,memory);
  }

  function migrateLegacyActivity(){
    const memory=getMemory();
    const counterSearches=Number(Storage.get("penelopeSearchCount",0)||0);

    // Preserve whichever search total is higher.
    memory.totalSearches=Math.max(
      Number(memory.totalSearches||0),
      counterSearches
    );

    if(!memory.categories||typeof memory.categories!=="object"){
      memory.categories={};
    }
    if(!memory.titles||typeof memory.titles!=="object"){
      memory.titles={};
    }
    if(!Array.isArray(memory.easterEggs)){
      memory.easterEggs=[];
    }

    saveMemory(memory);
    return memory;
  }

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
    const memory=migrateLegacyActivity();
    const visibleCounter=Number(Storage.get("penelopeSearchCount",0)||0);

    // app.js increments the visible counter before calling this function.
    memory.totalSearches=Math.max(
      Number(memory.totalSearches||0)+1,
      visibleCounter
    );

    memory.titles[key]=(memory.titles[key]||0)+1;

    collectionKeys.forEach(collection=>{
      memory.categories[collection]=(memory.categories[collection]||0)+1;
    });

    saveMemory(memory);
    return memory;
  }

  function recordEasterEgg(term){
    const memory=migrateLegacyActivity();
    if(!memory.easterEggs.includes(term)){
      memory.easterEggs.push(term);
    }
    saveMemory(memory);
  }

  function dominantShelf(){
    const categories=migrateLegacyActivity().categories||{};
    const entries=Object.entries(categories).sort((a,b)=>b[1]-a[1]);
    return entries.length?entries[0][0]:null;
  }

  function memoryGreeting(visitDays){
    const memory=migrateLegacyActivity();
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
      className:"season-spring",
      desk:"🌷",
      lines:[
        "Someone keeps pressing flowers inside the poetry books.",
        "The gardening section is unusually optimistic today."
      ]
    },
    summer:{
      className:"season-summer",
      desk:"🧋",
      lines:[
        "Summer reading counts—even the wonderfully misunderstood kind.",
        "The beach reads are trying to escape again."
      ]
    },
    autumn:{
      className:"season-autumn",
      desk:"🍂",
      lines:[
        "The Horror shelf gets suspiciously popular this time of year.",
        "I have found cinnamon between the pages again."
      ]
    },
    winter:{
      className:"season-winter",
      desk:"☕",
      lines:[
        "Please warm your hands before touching the rare books.",
        "The fireplace has checked out every cozy mystery."
      ]
    },
    halloween:{
      className:"season-halloween",
      desk:"🎃",
      lines:[
        "I have confirmed at least three ghosts have overdue books.",
        "The fake cobwebs have become administratively complicated."
      ]
    },
    holiday:{
      className:"season-holiday",
      desk:"✨",
      lines:[
        "Holiday romances have escaped again.",
        "The cocoa is warm. The summaries remain unreliable."
      ]
    },
    valentine:{
      className:"season-valentine",
      desk:"💌",
      lines:[
        "Handle the Romance shelf with dramatic expectations.",
        "The love letters are overdue and emotionally complicated."
      ]
    }
  };

  function applySeason(){
    const key=season();
    const config=seasonConfig[key];
    document.body.classList.add(config.className);

    const layer=document.getElementById("seasonalLayer");
    const desk=document.getElementById("seasonalDeskItem");

    if(layer)layer.dataset.season=key;
    if(desk)desk.textContent=config.desk;

    return {key,config};
  }

  const achievementDefs=[
    {id:"first-search",icon:"📚",name:"First Checkout",current:s=>s.searches,target:1,detail:"Perform your first search."},
    {id:"goose-approved",icon:"🪿",name:"Goose Approved",current:s=>s.saved,target:1,detail:"Save your first misunderstanding."},
    {id:"honk-enthusiast",icon:"📣",name:"Honk Enthusiast",current:s=>s.honks,target:10,detail:"Request ten librarian reactions."},
    {id:"frequent-honker",icon:"🎺",name:"Frequent Honker",current:s=>s.honks,target:30,detail:"Request thirty Penelope reactions."},
    {id:"fantasy-explorer",icon:"🏰",name:"Fantasy Explorer",current:s=>s.categories.fantasy||0,target:5,detail:"Explore five Fantasy entries."},
    {id:"dragon-tamer",icon:"🐉",name:"Dragon Tamer",current:s=>s.categories.fantasy||0,target:25,detail:"Explore twenty-five Fantasy entries."},
    {id:"disney-scholar",icon:"👑",name:"Disney Scholar",current:s=>(s.categories["disney-wing"]||0)+(s.categories["disney-villains"]||0)+(s.categories.descendants||0)+(s.categories["kingdom-keepers"]||0),target:5,detail:"Explore five Disney Wing entries."},
    {id:"royal-reader",icon:"🏰",name:"Royal Reader",current:s=>(s.categories["disney-wing"]||0)+(s.categories["disney-villains"]||0)+(s.categories.descendants||0),target:20,detail:"Explore twenty Disney and fairy-tale entries."},
    {id:"manga-marathon",icon:"🎌",name:"Manga Marathon",current:s=>s.categories.manga||0,target:10,detail:"Visit ten Manga entries."},
    {id:"classic-collector",icon:"📜",name:"Classic Collector",current:s=>s.categories["literary-classics"]||0,target:10,detail:"Read ten Literary Classics entries."},
    {id:"mystery-reader",icon:"🔎",name:"Amateur Detective",current:s=>s.categories["mystery-horror"]||0,target:10,detail:"Investigate ten Mystery & Horror entries."},
    {id:"romance-reader",icon:"💗",name:"Hopeless Romantic",current:s=>s.categories.romance||0,target:10,detail:"Explore ten Romance entries."},
    {id:"penelope-regular",icon:"🪪",name:"Penelope Regular",current:s=>s.visitDays,target:5,detail:"Visit on five different days."},
    {id:"easter-egg-hunter",icon:"🥚",name:"Easter Egg Hunter",current:s=>s.easterEggs,target:5,detail:"Discover five hidden searches."},
    {id:"hall-curator",icon:"🏆",name:"Hall of Shame Curator",current:s=>s.shame,target:5,detail:"Save five entries to the Hall of Shame."},
    {id:"library-supporter",icon:"📇",name:"Library Supporter",current:s=>s.saved,target:10,detail:"Save ten misunderstandings to your Library Card."}
  ];

  function stats(){
    const memory=migrateLegacyActivity();
    const card=window.PenelopeCard?window.PenelopeCard.all():[];

    return {
      searches:Math.max(
        Number(memory.totalSearches||0),
        Number(Storage.get("penelopeSearchCount",0)||0)
      ),
      categories:memory.categories||{},
      easterEggs:(memory.easterEggs||[]).length,
      visitDays:Storage.get(DAY_KEY,[]).length,
      honks:Number(Storage.get("penelopeHonkCount",0)||0),
      saved:card.length,
      shame:card.filter(item=>item.shelf==="shame").length
    };
  }

  function achievements(){
    const currentStats=stats();
    const earnedIds=Storage.get(ACHIEVEMENT_KEY,[]);
    const earnedSet=new Set(Array.isArray(earnedIds)?earnedIds:[]);
    const results=achievementDefs.map(def=>{
      const current=Math.max(0,Number(def.current(currentStats)||0));
      if(current>=def.target)earnedSet.add(def.id);
      return {
        id:def.id,icon:def.icon,name:def.name,detail:def.detail,
        current,target:def.target,
        progress:Math.min(current/def.target,1),
        earned:earnedSet.has(def.id)
      };
    });
    Storage.set(ACHIEVEMENT_KEY,[...earnedSet]);
    return results;
  }

  function resetAchievements(){
    Storage.set(ACHIEVEMENT_KEY,[]);
    Storage.set(MEMORY_KEY,defaultMemory());
    Storage.set("penelopeSearchCount",0);
    Storage.set(DAY_KEY,[today()]);
  }

  migrateLegacyActivity();

  window.PenelopeMemory={
    recordVisit,
    recordSearch,
    recordEasterEgg,
    memoryGreeting,
    applySeason,
    getMemory:migrateLegacyActivity,
    achievements,
    resetAchievements,
    stats,
    season
  };
})();