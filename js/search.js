
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
  function keyFor(value){
    const n=normalize(value);
    const alias=aliases[n];
    if(alias&&library[alias])return alias;
    if(library[n])return n;
    const byName=Object.entries(library).find(([,entry])=>normalize(entry.name)===n);
    if(byName)return byName[0];
    const partial=Object.entries(library).filter(([key,entry])=>{
      const normalizedName=normalize(entry.name);
      // Never let a one- or two-letter title (for example "It") match merely
      // because those letters occur inside a longer query such as "Without".
      if(n.length<3||key.length<3||normalizedName.length<3)return false;
      return key.includes(n)||normalizedName.includes(n)||n.includes(key);
    });
    if(partial.length===1)return partial[0][0];
    const ranked=Object.entries(library).map(([key,entry])=>{
      const score=Math.min(distance(n,key),distance(n,normalize(entry.name)));
      return {key,score};
    }).sort((a,b)=>a.score-b.score);
    return ranked.length&&ranked[0].score<=Math.max(2,Math.floor(n.length*.22))?ranked[0].key:null;
  }
  function suggestions(value,limit=5){
    const n=normalize(value);
    if(n.length<2)return[];
    return Object.entries(library).map(([key,entry])=>{
      let score=Math.min(distance(n,key),distance(n,normalize(entry.name)));
      if(key.includes(n)||normalize(entry.name).includes(n))score-=5;
      return {key,entry,score};
    }).sort((a,b)=>a.score-b.score).slice(0,limit);
  }
  window.PenelopeSearch={normalize,keyFor,suggestions};
})();
