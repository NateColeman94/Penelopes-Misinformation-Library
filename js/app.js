
const DATA=window.LIBRARY_DATA, PROFILES=window.HUMOR_PROFILES;
const PENNY=["Honk! I found it, but the accurate summary wandered off.","I checked three shelves. Every explanation was equally incorrect.","The catalog filed this under Questionable Life Choices.","That is absolutely not what happened. Five stars."];
const AWARDS=["🏆 Certified Librarian Nightmare","🏅 Incorrect but Confident","🪿 Goose-Approved Misinformation","🚨 English Teacher Alert"];
let current="",item=null,cycle=0;
const norm=s=>s.toLowerCase().trim().replace(/[’']/g,"").replace(/\s+/g," ");
const pick=(a,i)=>a[((i%a.length)+a.length)%a.length];
function resolve(q){const n=norm(q);if(DATA[n])return DATA[n];for(const[k,v]of Object.entries(DATA))if(n.includes(k)||k.includes(n))return v;return{name:q||"Untitled Book",type:"Mystery Search",key:"default",related:["Percy Jackson","The Fellowship of the Ring","Harry Potter","Gandalf"],mild:["A normal book becomes an avoidable group project."],silly:["A collection of questionable decisions becomes hardcover.","Everyone ignores the obvious solution because the sequel needs material."],wild:["The plot escapes supervision and begins filing paperwork.","A bookmark becomes the most responsible character."]}}
function render(q,advance=false){if(!q.trim())q="Percy Jackson";const same=norm(q)===norm(current);cycle=(advance||same)?cycle+1:0;current=q;item=resolve(q);const lvl=document.getElementById("level").value,p=PROFILES[item.key]||PROFILES.default;
document.getElementById("title").textContent=item.name;document.getElementById("type").textContent=item.type;document.getElementById("penelopeLine").textContent="🪿 Penelope says: “"+pick(PENNY,cycle)+"”";document.getElementById("synopsis").textContent=pick(item[lvl],cycle);
document.getElementById("ratingNumber").textContent=(4.5+((item.name.length*7+cycle*11)%49)/100).toFixed(2);document.getElementById("audience").textContent=`Based on ${(1250+((item.name.length*643+cycle*977)%8750)).toLocaleString()} ${pick(p.audiences,cycle+1)}`;document.getElementById("award").textContent=pick(AWARDS,cycle+2);
const g=document.getElementById("genres");g.innerHTML="";[0,1,2,3].map(i=>pick(p.genres,cycle+i)).filter((v,i,a)=>a.indexOf(v)===i).forEach(x=>{const s=document.createElement("span");s.textContent=x;g.appendChild(s)});
for(const [id,key,off] of [["quote","quotes",1],["review","reviews",2],["trailer","trailers",3],["moral","morals",4],["ending","endings",5],["discussion","questions",6]])document.getElementById(id).textContent=(id==="quote"?"“":"")+pick(p[key],cycle+off)+(id==="quote"?"”":"");
const r=document.getElementById("relatedButtons");r.innerHTML="";item.related.forEach(x=>{const b=document.createElement("button");b.textContent=x;b.onclick=()=>{document.getElementById("query").value=x;render(x)};r.appendChild(b)});renderVotes();document.getElementById("result").classList.add("show")}
function renderVotes(){const w=document.getElementById("voteButtons"),labels=["😂 Brilliantly Wrong","🤨 Almost Believable","🙄 Needs More Nonsense"],k="votes:"+norm(item.name)+":"+cycle,v=JSON.parse(localStorage.getItem(k)||"[0,0,0]");w.innerHTML="";labels.forEach((x,i)=>{const b=document.createElement("button");b.textContent=`${x} (${v[i]})`;b.onclick=()=>{v[i]++;localStorage.setItem(k,JSON.stringify(v));renderVotes()};w.appendChild(b)})}
document.getElementById("searchBtn").onclick=()=>render(document.getElementById("query").value);
document.getElementById("query").onkeydown=e=>{if(e.key==="Enter")render(e.target.value)};
document.getElementById("tryAnother").onclick=()=>render(current,true);
document.getElementById("makeWorse").onclick=()=>{const l=document.getElementById("level");l.value=l.value==="mild"?"silly":"wild";render(current,true)};
document.getElementById("goose").onclick=()=>document.getElementById("bubble").innerHTML="<strong>Penelope says:</strong><br>“"+pick(PENNY,Math.floor(Math.random()*PENNY.length)+cycle)+"”";
document.querySelectorAll(".example").forEach(b=>b.onclick=()=>{document.getElementById("query").value=b.dataset.query;render(b.dataset.query)});
