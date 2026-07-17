(function(){
  "use strict";

  const SEARCH_URL="https://openlibrary.org/search.json";
  const OPEN_LIBRARY="https://openlibrary.org";
  const clean=value=>String(value||"").replace(/\s+/g," ").trim();
  const normalize=value=>clean(value).toLowerCase().replace(/[’']/g,"").replace(/[^a-z0-9]+/g," ").trim();
  const titleCase=value=>clean(value).replace(/\b\w/g,letter=>letter.toUpperCase());
  const unique=items=>[...new Set(items.filter(Boolean).map(clean).filter(Boolean))];

  // Open Library sometimes has several books with the same title. These hints
  // disambiguate titles that have already caused incorrect catalog matches.
  const TITLE_AUTHOR_HINTS={
    "without warning":"lynette eason",
    "river of secrets":"lynette eason"
  };

  function parseQuery(value){
    const raw=clean(value);
    const match=raw.match(/^(.*?)\s+by\s+(.+)$/i);
    return match?{title:clean(match[1]),author:clean(match[2])}:{title:raw,author:""};
  }

  function words(value){
    return normalize(value).split(" ").filter(word=>word.length>1);
  }

  function titleScore(query,title){
    const q=normalize(query),t=normalize(title);
    if(!q||!t)return -Infinity;
    if(q===t)return 1200;
    if(t.startsWith(q)||q.startsWith(t))return 700-Math.abs(t.length-q.length);
    const qWords=words(q),tWords=new Set(words(t));
    const overlap=qWords.filter(word=>tWords.has(word)).length;
    const coverage=qWords.length?overlap/qWords.length:0;
    if(coverage===1)return 520-Math.abs(t.length-q.length);
    if(coverage>=0.8)return 340+Math.round(coverage*100)-Math.abs(t.length-q.length);
    return -Infinity;
  }

  function authorScore(expected,authors){
    const wanted=normalize(expected);
    if(!wanted)return 0;
    const normalized=(authors||[]).map(normalize);
    if(normalized.some(author=>author===wanted))return 500;
    if(normalized.some(author=>author.includes(wanted)||wanted.includes(author)))return 300;
    const wantedWords=words(wanted);
    if(normalized.some(author=>wantedWords.every(word=>author.includes(word))))return 200;
    return -600;
  }

  function descriptionText(details){
    const value=details&&details.description;
    if(typeof value==="string")return clean(value);
    if(value&&typeof value.value==="string")return clean(value.value);
    return "";
  }

  function usableSubjects(doc,details){
    return unique([
      ...(Array.isArray(details&&details.subjects)?details.subjects:[]),
      ...(Array.isArray(doc.subject)?doc.subject:[])
    ]).filter(value=>value.length>2&&value.length<65).slice(0,14);
  }

  function contextSignals(doc,details){
    const subjects=usableSubjects(doc,details);
    const people=unique(Array.isArray(details&&details.subject_people)?details.subject_people:[]).slice(0,4);
    const places=unique(Array.isArray(details&&details.subject_places)?details.subject_places:[]).slice(0,3);
    const times=unique(Array.isArray(details&&details.subject_times)?details.subject_times:[]).slice(0,2);
    const description=descriptionText(details);
    return {subjects,people,places,times,description};
  }

  function contextQuality(signals){
    let score=0;
    if(signals.description.length>=40)score+=4;
    if(signals.subjects.length>=2)score+=2;
    if(signals.people.length)score+=2;
    if(signals.places.length)score+=1;
    return score;
  }

  function clippedContext(description){
    if(!description)return "";
    const sentences=description.split(/(?<=[.!?])\s+/).filter(Boolean);
    return clean(sentences.slice(0,2).join(" ")).slice(0,300).replace(/\s+\S*$/,"");
  }

  function entryFrom(doc,query,details){
    const title=clean(doc.title)||clean(query)||"Unknown Book";
    const authors=Array.isArray(doc.author_name)?doc.author_name.slice(0,3):[];
    const authorText=authors.length?authors.join(", "):"an unidentified author";
    const year=doc.first_publish_year?String(doc.first_publish_year):"an undisclosed year";
    const signals=contextSignals(doc,details);
    const subjectA=signals.subjects[0]||"a difficult situation";
    const subjectB=signals.subjects[1]||"unexpected consequences";
    const subjectC=signals.subjects[2]||"questionable decisions";
    const person=signals.people[0]||"the main character";
    const place=signals.places[0]||"a location Penelope has filed incorrectly";
    const realContext=clippedContext(signals.description);
    const contextLabel=unique([subjectA,subjectB,signals.people[0],signals.places[0]]).slice(0,4).join(" · ");

    // These lines deliberately misunderstand real catalog context rather than
    // inventing an unrelated generic plot. No accurate synopsis is displayed.
    const mild=[
      `${title} appears to involve ${subjectA.toLowerCase()} and ${subjectB.toLowerCase()}. Penelope has classified this as a careful study of why nobody reads the instructions first.`,
      `In ${title}, ${person} encounters ${subjectA.toLowerCase()} near ${place}. Penelope believes the sensible solution was a strongly worded library card.`
    ];
    const silly=[
      `${title} follows ${person}, who becomes tangled in ${subjectA.toLowerCase()} and ${subjectB.toLowerCase()}. Penelope has concluded that the entire crisis began because someone returned an important clue to the wrong shelf.`,
      `${authorText} wrote ${title}, a tale connected to ${subjectA.toLowerCase()}, ${subjectB.toLowerCase()}, and ${place}. Naturally, Penelope interprets this as an elaborate dispute over interlibrary-loan etiquette.`,
      `The real catalog points toward ${subjectA.toLowerCase()} and ${subjectC.toLowerCase()}. Penelope therefore insists ${title} is about ${person} attempting to solve everything with a mislabeled bookmark.`
    ];
    const wild=[
      `${titleCase(subjectA)} gains sentience, recruits ${person}, and declares ${place} an independent library branch. ${subjectB} is appointed head of security.`,
      `In Penelope's version of ${title}, ${person} must defeat ${subjectC.toLowerCase()} using only a due-date stamp, three suspicious footnotes, and absolutely no reliable advice.`
    ];

    return {
      name:title,
      type:"Book",
      key:"interlibrary",
      apiSource:"Interlibrary Loan",
      apiMetadata:{
        authors,
        firstPublishYear:doc.first_publish_year||null,
        openLibraryKey:doc.key||null,
        coverId:doc.cover_i||null,
        subjects:signals.subjects,
        people:signals.people,
        places:signals.places,
        contextLabel,
        contextAvailable:contextQuality(signals)>=2,
        realContext
      },
      related:authors,
      mild,silly,wild,
      audiences:[`readers of ${subjectA.toLowerCase()}`,`book clubs discussing ${subjectB.toLowerCase()}`,`librarians investigating ${subjectC.toLowerCase()}`],
      genres:[`${titleCase(subjectA)} Mismanagement`,`${titleCase(subjectB)} Logistics`,`${titleCase(subjectC)} Studies`,"Interlibrary Misinformation"],
      quotes:[`“I was told ${subjectA.toLowerCase()} would be handled by the neighboring branch.”`,`“Nobody mentioned ${subjectB.toLowerCase()} on the checkout slip.”`],
      reviews:[`The catalog context is recognizable. Penelope's conclusions are not.`,`A convincing case for keeping ${subjectC.toLowerCase()} away from unsupervised geese.`],
      trailers:[`From the public catalog: ${title}. From Penelope: one borrowed book, one wildly unreliable interpretation, and far too much ${subjectA.toLowerCase()}.`],
      morals:[`${titleCase(subjectA)} should never be managed by a goose with stamping privileges.`,`Finding the correct book does not guarantee receiving a correct explanation.`],
      endings:[`${person} resolves the actual problem; Penelope files the paperwork under ${titleCase(subjectB)}.`,`The book is returned to its home library with the plot intact and Penelope's dignity missing.`],
      questions:[`Which real theme—${subjectA.toLowerCase()} or ${subjectB.toLowerCase()}—did Penelope misunderstand most dramatically?`,`How does ${person} probably differ from Penelope's version?`]
    };
  }

  async function request(params){
    const response=await fetch(`${SEARCH_URL}?${new URLSearchParams(params)}`,{headers:{Accept:"application/json"},cache:"no-store"});
    if(!response.ok)throw new Error(`Interlibrary catalog returned ${response.status}`);
    const payload=await response.json();
    return Array.isArray(payload.docs)?payload.docs:[];
  }

  async function fetchWork(key){
    if(!key||!String(key).startsWith("/works/"))return {};
    try{
      const response=await fetch(`${OPEN_LIBRARY}${key}.json`,{headers:{Accept:"application/json"},cache:"no-store"});
      if(!response.ok)return {};
      return await response.json();
    }catch(_error){return {}}
  }

  async function search(query){
    const parsed=parseQuery(query);
    const q=parsed.title;
    const expectedAuthor=parsed.author||TITLE_AUTHOR_HINTS[normalize(q)]||"";
    const fields="key,title,author_name,first_publish_year,subject,cover_i,edition_count";

    let docs=await request({title:q,limit:"30",fields});
    if(!docs.length)docs=await request({q:`title:\"${q}\"`,limit:"30",fields});
    if(!docs.length)docs=await request({q,limit:"30",fields});

    const ranked=docs.map(doc=>{
      const titlePoints=titleScore(q,doc.title);
      const authorPoints=authorScore(expectedAuthor,doc.author_name||[]);
      const popularity=Math.min(50,Number(doc.edition_count||0));
      return {doc,score:titlePoints+authorPoints+popularity,titlePoints,authorPoints};
    }).filter(item=>Number.isFinite(item.titlePoints))
      .filter(item=>!expectedAuthor||item.authorPoints>=0)
      .sort((a,b)=>b.score-a.score);

    if(!ranked.length)return [];

    const candidates=await Promise.all(ranked.slice(0,5).map(async item=>{
      const details=await fetchWork(item.doc.key);
      const signals=contextSignals(item.doc,details);
      return {...item,details,quality:contextQuality(signals)};
    }));

    candidates.sort((a,b)=>b.score-a.score||b.quality-a.quality);
    const best=candidates[0];
    if(!best)return [];

    // Require both a dependable title match and enough catalog context to make
    // the silly synopsis meaningfully about the selected work.
    if(best.titlePoints<500)return [];
    if(best.quality<2)return [];

    return [{doc:best.doc,entry:entryFrom(best.doc,q,best.details)}];
  }

  window.PenelopeOpenLibrary={search};
})();
