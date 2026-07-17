
(function(){
  "use strict";
  const SEARCH_URL="https://openlibrary.org/search.json";
  const clean=value=>String(value||"").replace(/\s+/g," ").trim();
  const titleCase=value=>String(value||"").replace(/\b\w/g,letter=>letter.toUpperCase());

  function usableSubjects(doc){
    return [...new Set(Array.isArray(doc.subject)?doc.subject:[])]
      .filter(value=>typeof value==="string"&&value.length>2&&value.length<52)
      .slice(0,12);
  }

  function entryFrom(doc,query){
    const title=clean(doc.title)||clean(query)||"Unknown Book";
    const authors=Array.isArray(doc.author_name)?doc.author_name.slice(0,3):[];
    const subjects=usableSubjects(doc);
    const a=subjects[0]||"unexpected decisions";
    const b=subjects[1]||"literary complications";
    const c=subjects[2]||"questionable planning";
    const authorText=authors.length?authors.join(", "):"an unidentified author";
    const year=doc.first_publish_year?String(doc.first_publish_year):"an undisclosed year";

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
        subjects
      },
      related:authors,
      mild:[
        `${title} appears to involve ${a.toLowerCase()}, ${b.toLowerCase()}, and several decisions Penelope has declined to verify.`,
        `A book from ${year} combines ${a.toLowerCase()} with a manageable amount of ${c.toLowerCase()}.`
      ],
      silly:[
        `${title} turns ${a.toLowerCase()} into a library incident involving ${b.toLowerCase()} and insufficient supervision.`,
        `${authorText} appears to have written a story where ${a.toLowerCase()} collides with ${c.toLowerCase()} and everyone ignores the simplest solution.`,
        `Penelope found the title through interlibrary loan and immediately shelved it under Avoidable Complications.`
      ],
      wild:[
        `${titleCase(a)} acquires narrative authority and immediately destabilizes the entire book.`,
        `One routine case of ${b.toLowerCase()} becomes an interlibrary emergency with no responsible adult in sight.`
      ],
      audiences:[
        `readers researching ${a.toLowerCase()}`,
        `librarians suspicious of ${b.toLowerCase()}`,
        `book clubs debating ${c.toLowerCase()}`
      ],
      genres:[
        `${titleCase(a)} Management`,
        `${titleCase(b)} Logistics`,
        `${titleCase(c)} Studies`,
        "Interlibrary Misinformation"
      ],
      quotes:[
        `Please note that ${a.toLowerCase()} was not included in the circulation policy.`,
        `The neighboring library has declined responsibility for ${b.toLowerCase()}.`
      ],
      reviews:[
        `Strong ${a.toLowerCase()}. Concerning ${b.toLowerCase()}.`,
        `The title was located successfully. The meaning remains at large.`
      ],
      trailers:[
        `One borrowed title. ${authors.length||"Several"} credited author${authors.length===1?"":"s"}. Unlimited ${c.toLowerCase()}.`
      ],
      morals:[
        `${titleCase(a)} works best when paired with judgment.`,
        `Interlibrary loan can find the book. It cannot make Penelope explain it responsibly.`
      ],
      endings:[
        `Everyone discusses ${b.toLowerCase()} before the final chapter.`,
        `The title is returned to the neighboring library with a polite apology.`
      ],
      questions:[
        `How might ${a.toLowerCase()} shape the real story?`,
        `Which part of this borrowed misunderstanding is most suspicious?`
      ]
    };
  }

  const normalizeTitle=value=>clean(value)
    .toLowerCase()
    .replace(/[’']/g,"")
    .replace(/[^a-z0-9]+/g," ")
    .trim();

  function titleScore(doc,query){
    const wanted=normalizeTitle(query);
    const title=normalizeTitle(doc&&doc.title);
    if(!wanted||!title)return -1000;
    if(title===wanted)return 1000;
    if(title.startsWith(wanted)||wanted.startsWith(title))return 700-Math.abs(title.length-wanted.length);
    if(title.includes(wanted)||wanted.includes(title))return 500-Math.abs(title.length-wanted.length);

    const wantedWords=wanted.split(" ").filter(word=>word.length>1);
    const titleWords=new Set(title.split(" "));
    const overlap=wantedWords.filter(word=>titleWords.has(word)).length;
    if(!overlap)return -1000;
    return Math.round((overlap/wantedWords.length)*300)-Math.abs(title.length-wanted.length);
  }

  async function search(query){
    const cleaned=clean(query);
    const params=new URLSearchParams({
      title:cleaned,
      limit:"20",
      fields:"key,title,author_name,first_publish_year,subject,cover_i,edition_count"
    });
    const response=await fetch(`${SEARCH_URL}?${params}`,{headers:{Accept:"application/json"}});
    if(!response.ok)throw new Error(`Interlibrary catalog returned ${response.status}`);
    const payload=await response.json();
    const docs=Array.isArray(payload.docs)?payload.docs:[];

    return docs
      .map(doc=>({doc,score:titleScore(doc,cleaned)}))
      .filter(result=>result.score>=200)
      .sort((a,b)=>b.score-a.score||Number(b.doc.edition_count||0)-Number(a.doc.edition_count||0))
      .slice(0,5)
      .map(({doc})=>({doc,entry:entryFrom(doc,cleaned)}));
  }

  window.PenelopeOpenLibrary={search};
})();
