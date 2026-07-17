(function(){
  "use strict";

  const SEARCH_URL="https://openlibrary.org/search.json";
  const clean=value=>String(value||"").replace(/\s+/g," ").trim();
  const normalize=value=>clean(value).toLowerCase().replace(/[’']/g,"").replace(/[^a-z0-9]+/g," ").trim();
  const titleCase=value=>String(value||"").replace(/\b\w/g,letter=>letter.toUpperCase());
  const preferredAuthors={
    "without warning":"lynette eason",
    "river of secrets":"lynette eason"
  };

  function parseQuery(value){
    const raw=clean(value);
    const match=raw.match(/^(.+?)\s+by\s+(.+)$/i);
    return match?{title:clean(match[1]),author:clean(match[2])}:{title:raw,author:""};
  }
  function words(value){return normalize(value).split(" ").filter(word=>word.length>1)}
  function titleScore(query,title){
    const q=normalize(query),t=normalize(title);
    if(!q||!t)return -Infinity;
    if(q===t)return 1000;
    const qWords=words(q),tWords=new Set(words(t));
    const overlap=qWords.filter(word=>tWords.has(word)).length;
    const coverage=qWords.length?overlap/qWords.length:0;
    if(coverage===1)return 700-Math.abs(t.length-q.length);
    if(coverage>=0.8&&qWords.length>=2)return 450+Math.round(coverage*100)-Math.abs(t.length-q.length);
    return -Infinity;
  }
  function authorScore(wanted,authors){
    const target=normalize(wanted);
    if(!target)return 0;
    const values=(Array.isArray(authors)?authors:[]).map(normalize);
    if(values.some(author=>author===target))return 500;
    if(values.some(author=>author.includes(target)||target.includes(author)))return 350;
    return -250;
  }
  function usableSubjects(doc){
    return [...new Set(Array.isArray(doc.subject)?doc.subject:[])]
      .filter(value=>typeof value==="string"&&value.length>2&&value.length<52)
      .filter(value=>!/accessible book|protected daisy|internet archive|large type|fiction$/i.test(value))
      .slice(0,10);
  }
  function entryFrom(doc,query,matchInfo){
    const title=clean(doc.title)||clean(query)||"Unknown Book";
    const authors=Array.isArray(doc.author_name)?doc.author_name.slice(0,3):[];
    const subjects=usableSubjects(doc);
    const a=subjects[0]||"unexpected decisions";
    const b=subjects[1]||"literary complications";
    const c=subjects[2]||"questionable planning";
    const authorText=authors.length?authors.join(", "):"an unidentified author";
    const year=doc.first_publish_year?String(doc.first_publish_year):"an undisclosed year";
    return {
      name:title,type:"Book",key:"interlibrary",apiSource:"Interlibrary Loan",
      apiMetadata:{authors,firstPublishYear:doc.first_publish_year||null,openLibraryKey:doc.key||null,coverId:doc.cover_i||null,subjects,confidence:matchInfo.confidence,requestedTitle:query},
      related:authors,
      mild:[`${title} by ${authorText} appears to involve ${a.toLowerCase()}, ${b.toLowerCase()}, and several decisions Penelope has declined to verify.`,`This ${year} title combines ${a.toLowerCase()} with a manageable amount of ${c.toLowerCase()}.`],
      silly:[`${title} turns ${a.toLowerCase()} into a library incident involving ${b.toLowerCase()} and insufficient supervision.`,`${authorText} appears to have written a story where ${a.toLowerCase()} collides with ${c.toLowerCase()} and everyone ignores the simplest solution.`,`Penelope found the correct catalog record through interlibrary loan and immediately misunderstood its subject headings.`],
      wild:[`${titleCase(a)} acquires narrative authority and immediately destabilizes the entire book.`,`One routine case of ${b.toLowerCase()} becomes an interlibrary emergency with no responsible adult in sight.`],
      audiences:[`readers researching ${a.toLowerCase()}`,`librarians suspicious of ${b.toLowerCase()}`,`book clubs debating ${c.toLowerCase()}`],
      genres:[`${titleCase(a)} Management`,`${titleCase(b)} Logistics`,`${titleCase(c)} Studies`,"Interlibrary Misinformation"],
      quotes:[`Please note that ${a.toLowerCase()} was not included in the circulation policy.`,`The neighboring library has declined responsibility for ${b.toLowerCase()}.`],
      reviews:[`Correct title and author. Extremely questionable explanation.`,`The catalog record was located successfully. The meaning remains at large.`],
      trailers:[`One borrowed title. ${authors.length||"Several"} credited author${authors.length===1?"":"s"}. Unlimited ${c.toLowerCase()}.`],
      morals:[`${titleCase(a)} works best when paired with judgment.`,`Interlibrary loan can identify the book. It cannot make Penelope explain it responsibly.`],
      endings:[`Everyone discusses ${b.toLowerCase()} before the final chapter.`,`The title is returned to the neighboring library with a polite apology.`],
      questions:[`How might ${a.toLowerCase()} shape the real story?`,`Which part of this borrowed misunderstanding is most suspicious?`]
    };
  }
  async function request(params){
    const response=await fetch(`${SEARCH_URL}?${new URLSearchParams(params)}`,{headers:{Accept:"application/json"},cache:"no-store"});
    if(!response.ok)throw new Error(`Interlibrary catalog returned ${response.status}`);
    const payload=await response.json();
    return Array.isArray(payload.docs)?payload.docs:[];
  }
  async function search(query){
    const parsed=parseQuery(query),q=parsed.title;
    const wantedAuthor=parsed.author||preferredAuthors[normalize(q)]||"";
    const fields="key,title,author_name,first_publish_year,subject,cover_i,edition_count";
    let docs=await request({title:q,limit:"50",fields});
    if(!docs.length)docs=await request({q:`title:\"${q}\"`,limit:"50",fields});
    if(!docs.length)docs=await request({q,limit:"50",fields});
    const ranked=docs.map(doc=>{
      const tScore=titleScore(q,doc.title);
      const aScore=authorScore(wantedAuthor,doc.author_name);
      const metadataBonus=(doc.cover_i?10:0)+(Array.isArray(doc.subject)&&doc.subject.length?15:0)+Math.min(Number(doc.edition_count||0),50);
      const total=tScore+aScore+metadataBonus;
      return {doc,total,tScore,aScore};
    }).filter(item=>Number.isFinite(item.tScore)).sort((a,b)=>b.total-a.total);
    if(!ranked.length)return[];
    const best=ranked[0];
    // Require an exact/near-exact title. Author mismatches are rejected when an author is known.
    if(best.tScore<650)return[];
    if(wantedAuthor&&best.aScore<0)return[];
    return ranked.slice(0,8).map(({doc,tScore,aScore})=>{
      const confidence=tScore>=1000&&(aScore>=0)?"high":"medium";
      return {doc,entry:entryFrom(doc,q,{confidence})};
    });
  }
  window.PenelopeOpenLibrary={search};
})();
