(function(){
  "use strict";
  let context=null;
  let shuffleOffset=0;
  let noticeOffset=0;

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
    render();
  }
  window.PenelopeDesk={init,selection,render};
})();
