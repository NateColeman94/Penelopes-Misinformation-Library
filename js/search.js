(function(){
  const library=window.PENELOPE_LIBRARY||{};
  const aliases=window.PENELOPE_ALIASES||{};
  const normalize=value=>String(value||"").toLowerCase().trim().replace(/[’']/g,"").replace(/[^a-z0-9]+/g," ").trim();
  function distance(a,b){
    const rows=Array.from({length:a.length+1},()=>Array(b.length+1).fill(0));
    for(let i=0;i<=a.length;i++)rows[i][0]=i;
    for(let j=0;j<=b.length;j++)rows[0][j]=j;
    for(let i=1;i<=a.length;i++)for(let j=1;j<=b.length;j++)
      rows[i][j]=Math.min(rows[i-1][j]+1,rows[i][j-1]+1,rows[i-1][j-1]+(a[i-1]===b[j-1]?0:1));
    return rows[a.length][b.length];
  }
  function meaningfulPartial(n,key,name){
    // Never let tiny catalog keys such as "it" hijack a longer unrelated title
    // such as "Without Warning". Partial matching now requires a substantial token.
    const candidates=[key,name].map(normalize).filter(Boolean);
    return candidates.some(candidate=>{
      if(candidate.length<4||n.length<4)return false;
      if(candidate.includes(n))return n.length>=4;
      if(n.includes(candidate))return candidate.length>=5&&candidate.length/n.length>=0.5;
      return false;
    });
  }
  function keyFor(value){
    const n=normalize(value);
    if(!n)return null;
    const alias=aliases[n];
    if(alias&&library[alias])return alias;
    if(library[n])return n;
    const byName=Object.entries(library).find(([,entry])=>normalize(entry.name)===n);
    if(byName)return byName[0];
    const partial=Object.entries(library).filter(([key,entry])=>meaningfulPartial(n,key,entry.name));
    if(partial.length===1)return partial[0][0];
    const ranked=Object.entries(library).map(([key,entry])=>{
      const score=Math.min(distance(n,normalize(key)),distance(n,normalize(entry.name)));
      return {key,score};
    }).sort((a,b)=>a.score-b.score);
    // Fuzzy matching is conservative and disabled for very short catalog titles.
    const threshold=Math.max(1,Math.floor(n.length*.16));
    return ranked.length&&ranked[0].score<=threshold&&normalize(ranked[0].key).length>=4?ranked[0].key:null;
  }
  function suggestions(value,limit=5){
    const n=normalize(value);
    if(n.length<2)return[];
    return Object.entries(library).map(([key,entry])=>{
      let score=Math.min(distance(n,normalize(key)),distance(n,normalize(entry.name)));
      if(meaningfulPartial(n,key,entry.name))score-=5;
      return {key,entry,score};
    }).sort((a,b)=>a.score-b.score).slice(0,limit);
  }
  window.PenelopeSearch={normalize,keyFor,suggestions};
})();
