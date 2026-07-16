
(function(){
  "use strict";
  const exact={
    "the hobbit":["I've checked this out 437 times. It's still mostly walking.","Thirteen dwarves entered. The pantry never recovered.","This could have been an email, but they chose a mountain."],
    "harry potter":["I've filed seven safety complaints with Hogwarts.","That school has moving stairs and no visible risk committee.","Every September they reopen as though nothing happened."],
    "the hunger games":["I would have declined the invitation.","The waiver form was deeply inadequate.","Reality television should not require archery."],
    "moby dick":["This could have been avoided by choosing a different hobby.","I recommend bird-watching next time.","The whale has declined to comment."],
    "the fellowship of the ring":["I hope somebody packed comfortable shoes.","One ring, nine walkers, and still no shuttle service.","I've shelved this under Aggressive Hiking."],
    "gandalf":["Excellent mentor. Suspicious calendar.","He has once again withheld the second half of the instructions.","Fireworks: approved. Communication plan: under review."],
    "percy jackson":["The liability paperwork for Camp Half-Blood is substantial.","The gods have once again delegated everything to a child.","I have placed Olympus on administrative review."],
    "the great gatsby":["I've never trusted anyone who throws parties that large.","The green light is not an approved communication method.","That house has more guests than emotional honesty."],
    "charlottes web":["The spider had better handwriting than most patrons.","A surprisingly effective barnyard publicity campaign.","I awarded Charlotte honorary librarian status."],
    "jane austen":["She could create three misunderstandings before lunchtime.","Every polite sentence contains a second, sharper sentence.","I keep her books near the emergency tea."],
    "sherlock holmes":["He keeps reorganizing my mystery shelf without asking.","The hat is unofficial. The confidence is not.","He solved the case and ignored the return date."],
    "1984":["I lowered my voice before opening this one.","The Ministry has requested my overdue records. I declined.","This catalog entry has been revised by someone named Winston."],
    "animal farm":["The pigs have requested access to the circulation budget.","All library cards are equal, apparently.","The farm meeting minutes look increasingly suspicious."],
    "the odyssey":["The return trip has exceeded the estimated travel time.","I recommend fewer islands next time.","This patron has been trying to get home since antiquity."],
    "gone girl":["I would not share a joint library account with either of them.","The diary has been placed in evidence.","Marriage counseling left the building."],
    "coraline":["I have sealed the small door behind the biography shelf.","Button eyes violate library dress code.","The other librarian is not authorized."],
    "green eggs and ham":["The food sample policy has been suspended.","He said no forty-six times. I counted.","The rhyming sales representative is back."],
    "twilight":["The weather is doing most of the flirting.","I have moved this to the Sparkling Reference section.","The biology department has asked several questions."],
    "the screwtape letters":["The correspondence has been intercepted by the theology desk.","Temptation should not use office stationery.","I have marked the sender as spiritually suspicious."]
  };

  const honks=[
    "HONK!","Double honk! HONK HONK!","Librarian honk.","Quiet-library honk.",
    "Concerned honk.","Professional honk.","Tiny offended honk.","Happy checkout honk.",
    "Disapproving reference-desk honk.","Emergency circulation honk.","Whispered honk.",
    "Honk with footnotes.","Honk, respectfully.","Honk of uncertain classification.",
    "A carefully cataloged honk.","A mildly judgmental honk.","A first-edition honk.",
    "A limited-circulation honk.","A surprisingly literary honk.","A honk from the restricted section.",
    "One overdue honk.","A honk with excellent penmanship.","A cardigan-approved honk.",
    "A honk filed under Other.","A confident honk with no supporting sources.",
    "A very small honk with enormous authority.","A honk that has seen things.",
    "A suspiciously well-read honk.","A goose-reviewed honk.","A honk requesting interlibrary assistance."
  ];

  const libraryRemarks=[
    "This belongs in Fiction... probably.","I've misplaced the accurate summary again.",
    "Please return all facts to the circulation desk.","The catalog insists this is somebody else's problem.",
    "This explanation is overdue.","Please whisper around the misinformation.",
    "I've shelved this incorrectly on purpose.","Someone has written in the margins.",
    "This belongs somewhere between Fantasy and Tax Law.","The truth is currently being rebound.",
    "I've stamped this Probably Not Correct.","The card catalog has declined responsibility.",
    "This title has been moved to the Unsupervised Ideas shelf.","The accurate edition is out for repairs.",
    "I found a bookmark, but no evidence.","The reference desk is pretending not to know me.",
    "This book has exceeded its permitted number of subplots.","I have issued the plot a temporary library card.",
    "The appendix is under observation.","The footnotes are organizing.",
    "This copy smells faintly of bad decisions.","The shelf label was emotionally unprepared.",
    "The index has filed a grievance.","Someone returned the symbolism without its dust jacket.",
    "This chapter requires a hall pass.","The ending has been placed on reserve.",
    "The author has not responded to my cataloging questions.","The genre classification remains a personal dispute.",
    "I have placed a small cone around the plot hole.","The library board has requested fewer metaphors.",
    "This explanation passed goose review with concerning speed.","I found the title. The meaning remains at large.",
    "The spine is intact. The facts are not.","I would not cite this in a paper.",
    "This was remembered creatively.","The characters deserved better planning.",
    "I have seen worse summaries, but not during business hours.","The plot has been asked to lower its voice.",
    "The book club is requesting protective equipment.","This story has been alphabetized by emotional damage.",
    "I have checked three shelves. None contained the truth.","Please keep your hands inside the misinformation at all times.",
    "The synopsis has left no forwarding address.","This copy is now part of an ongoing investigation.",
    "The library stamp is legally decorative.","I was there. I wasn't, but I say I was.",
    "This answer has been goose-reviewed and lightly questioned.","The facts are available in another building.",
    "The book appears to know what it did.","I have added one warning label and two bookmarks.",
    "The reading room has become involved.","The Dewey Decimal System asked not to be blamed.",
    "This is not how the author remembers it.","The plot is wearing a fake mustache.",
    "I have filed this under Confidently Incorrect.","The bibliography is accurate. My behavior is not.",
    "The title is real. Everything after that is a personal choice.","The shelves have begun whispering again.",
    "The narrative has exceeded its approved drama allowance.","This summary is being monitored by a cardigan."
  ];

  const busy=[
    "You're keeping me very busy today.","Another search? My feathers are filing overtime.",
    "At this rate, I may need a second stamp.","The circulation desk has noticed your enthusiasm.",
    "I have not sat down since the third wizard.","The catalog is beginning to recognize your typing style.",
    "You are personally responsible for today's shelf traffic.","My tea has gone cold from all this misinformation.",
    "The return cart is now emotionally involved.","I admire your commitment to avoiding accurate summaries."
  ];

  const repeat=[
    "Welcome back! I see you're still looking for accurate summaries.","You returned. The facts did not.",
    "I saved your usual seat near the inaccurate reference section.","Still avoiding the reliable edition?",
    "Welcome back. Your borrowing history remains suspicious.","I had a feeling the truth wouldn't keep you away.",
    "Your usual misinformation is waiting at the desk.","I polished your library card and removed the evidence."
  ];

  const emergency=[
    "Library Emergency mode activated. I have removed the remaining factual safeguards.",
    "Honk! The nonsense level has exceeded normal circulation limits.",
    "Please remain calm. The explanation is now operating without supervision.",
    "I have stamped this explanation EXCEPTIONALLY SILLY.",
    "The accurate summary has evacuated the building.",
    "All responsible interpretations should proceed to the nearest exit.",
    "The card catalog is spinning. This is not a drill.",
    "I have authorized full-strength misinformation.",
    "The reference section has entered a state of dramatic uncertainty.",
    "Emergency honk protocol is now in effect."
  ];

  const byType={
    Book:["I found the plot and immediately misfiled it.","This book has been shelved under Avoidable Complications.","The story is real. My explanation has other plans."],
    "Book Series":["I reviewed every volume and misunderstood them consistently.","The series has been cataloged under Recurring Problems.","Several books later, nobody has improved the paperwork."],
    Author:["I examined the author's style and filed it under Distinctive Nonsense.","The bibliography is accurate. My explanation is not.","I reviewed the author's career and misplaced the central point."],
    Creator:["I examined the creator's work and filed it under Highly Specific Brilliance.","The panels are accurate. My interpretation has escaped."],
    Character:["I opened the character file. Their personality needs supervision.","I assessed their strengths, flaws, and questionable choices.","This character has been flagged for highly specific behavior."],
    "Manga Series":["I reviewed the chapters and lost count responsibly.","The power system has exceeded shelf capacity.","Several volumes later, the friendship remains operational."],
    "Comic Series":["The cape has been cataloged. The continuity has not.","I found three origins and filed all of them.","The superhero shelf has requested another timeline."],
    "Graphic Novel":["The pictures are accurate. My explanation is not.","I inspected every panel and misunderstood them sequentially."],
    "Graphic Novel Series":["The leveling system has been approved by no librarian.","The panels continue. My accuracy does not."]
  };

  const pick=(items,index)=>items[((index%items.length)+items.length)%items.length];

  function seasonalLine(){
    const month=new Date().getMonth();
    if(month===9)return "I've decorated the Horror shelf with fake cobwebs. One of them moved.";
    if(month===11)return "Holiday romances have escaped again.";
    if(month===0)return "New year, same unreliable catalog.";
    if(month===5||month===6)return "Summer reading has become suspiciously adventurous.";
    return null;
  }

  function lineFor(entry,key,cycle,searchCount,isRepeat,level){
    if(level==="wild")return pick(emergency,cycle+searchCount);
    if(exact[key])return pick(exact[key],cycle);
    if(searchCount>0&&searchCount%12===0){
      const seasonal=seasonalLine();
      if(seasonal)return seasonal;
    }
    if(searchCount>0&&searchCount%6===0)return pick(busy,searchCount);
    if(isRepeat)return pick(["You searched this again. I admire your commitment to misinformation.","Still checking? The accurate version remains checked out.","A repeat request. I have made it less responsible."],cycle);
    return pick(byType[entry.type]||libraryRemarks,cycle+searchCount);
  }

  function clickLine(honkCount,searchCount,visitCount){
    if(honkCount%5===0)return "Double honk! HONK HONK!";
    if(visitCount>2&&honkCount%7===0)return pick(repeat,honkCount+visitCount);
    if(searchCount>=5&&honkCount%5===0)return pick(busy,honkCount+searchCount);
    if(honkCount%3===0)return pick(honks,honkCount);
    return pick(libraryRemarks,honkCount+searchCount+visitCount);
  }

  function sound(doubleHonk=false){
    try{
      const AudioCtx=window.AudioContext||window.webkitAudioContext;
      const ctx=new AudioCtx(),count=doubleHonk?2:1;
      for(let i=0;i<count;i++){
        const osc=ctx.createOscillator(),gain=ctx.createGain(),start=ctx.currentTime+i*.22;
        osc.type="square";
        osc.frequency.setValueAtTime(310,start);
        osc.frequency.exponentialRampToValueAtTime(190,start+.18);
        gain.gain.setValueAtTime(.0001,start);
        gain.gain.exponentialRampToValueAtTime(.2,start+.02);
        gain.gain.exponentialRampToValueAtTime(.0001,start+.24);
        osc.connect(gain);gain.connect(ctx.destination);osc.start(start);osc.stop(start+.25);
      }
    }catch(error){console.warn("Honk unavailable",error)}
  }

  window.PenelopePersonality={lineFor,clickLine,sound};
})();
