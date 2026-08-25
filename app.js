
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const todayKey = () => new Date().toISOString().slice(0,10);
const store = {
  get(k,d=null){ try{return JSON.parse(localStorage.getItem(k)) ?? d}catch{return d}},
  set(k,v){localStorage.setItem(k,JSON.stringify(v))}
};

const missions = [
  ["steps","10.000 stappen","Body"],
  ["sleep","Minstens 6 uur slaap","Sleep"],
  ["water","1 liter water","Glow"],
  ["food","Homemade food","Body"],
  ["movement","30–60 min bewegen","Body"],
  ["post","Dagelijkse post","Create"],
  ["business","Werk aan Out With It","Business"],
  ["screen","Bewust met series/schermtijd","Mind"],
  ["smoking","Roken bewust gelogd","Smoking"]
];

const lifeAreas = [
  ["🏠","Home","Daily reset, laundry, deep clean"],
  ["💪🏾","Body","Steps, movement, weight"],
  ["💄","Beauty","Skill tree & lessons"],
  ["👗","Style","Outfits, wishlist, wardrobe"],
  ["✨","Grooming","Hair, nails, bodycare"],
  ["🧴","Skin","AM, PM, SPF, glow"],
  ["😴","Sleep","Duration, quality, energy"],
  ["🧠","Mind","Journal, brain dump, identity"],
  ["📚","Brain","Books, courses, Spanish"],
  ["💰","Money","Spending, budget, goals"],
  ["🏡","Future Home","Budget, areas, viewings"],
  ["✈️","Career","Now, next, exit"],
  ["💼","Out With It","Build something weekly"],
  ["🌍","Life","Do, see, learn, travel"],
  ["👩🏾‍👧","Motherhood","Quality time & structure"],
  ["❤️","Relationships","Love, family, friends, boundaries"],
  ["🎉","Fun","Purely enjoyable experiences"],
  ["🌺","Identity","Who is Maya becoming?"]
];

function getToday(){
  return store.get("day-"+todayKey(), {checks:{}, home:{}, energy:null, scoreSaved:false});
}
function saveToday(d){ store.set("day-"+todayKey(),d); render(); }

function renderMissions(){
  const d=getToday();
  $("#missions").innerHTML=missions.map(([id,title,sub])=>`
    <div class="mission ${d.checks[id]?'done':''}">
      <div><div class="mission-title">${title}</div><div class="mission-sub">${sub}</div></div>
      <button class="toggle" data-mission="${id}">${d.checks[id]?'✓':'○'}</button>
    </div>`).join("");
  $$("[data-mission]").forEach(b=>b.onclick=()=>{
    const d=getToday(); d.checks[b.dataset.mission]=!d.checks[b.dataset.mission]; saveToday(d);
  });
}

function renderHome(){
  const d=getToday();
  const base=["Keuken","Hal","Woonkamer"];
  const day=new Date().getDay();
  const extra=day===2?["Badkamer","Toilet"]:day===3?["Slaapkamers"]:[];
  const items=[...base,...extra];
  $("#homeReset").innerHTML=items.map(x=>`<label><input type="checkbox" data-home="${x}" ${d.home[x]?'checked':''}> ${x}</label>`).join("");
  $$("[data-home]").forEach(i=>i.onchange=()=>{const d=getToday();d.home[i.dataset.home]=i.checked;saveToday(d)});
}

function score(){
  const d=getToday();
  const missionDone=missions.filter(([id])=>d.checks[id]).length;
  const homeKeys=Object.keys(d.home);
  const homeDone=homeKeys.filter(k=>d.home[k]).length;
  const denom=missions.length + Math.max(3,homeKeys.length);
  return Math.round((missionDone+homeDone)/denom*100);
}
function renderScore(){
  const s=score(); $("#meterFill").style.width=s+"%"; $("#scoreText").textContent=s+"%";
  const hist=store.get("history",{});
  hist[todayKey()]=s; store.set("history",hist);
  const dates=Object.keys(hist).sort();
  let streak=0;
  let cursor=new Date();
  while(true){
    const k=cursor.toISOString().slice(0,10);
    if((hist[k]||0)>=70){streak++;cursor.setDate(cursor.getDate()-1)} else break;
  }
  $("#streakText").textContent=`${streak} dagen streak`;
  const vals=dates.slice(-30).map(k=>hist[k]).filter(v=>typeof v==="number");
  $("#daysDone").textContent=vals.filter(v=>v>=70).length;
  $("#avgScore").textContent=(vals.length?Math.round(vals.reduce((a,b)=>a+b,0)/vals.length):0)+"%";
  let best=0,cur=0;
  for(const k of dates){ if(hist[k]>=70){cur++;best=Math.max(best,cur)}else cur=0; }
  $("#bestStreak").textContent=best;
}

function renderMoney(){
  const rows=store.get("money",[]);
  const income=rows.filter(r=>r.type==="income").reduce((a,r)=>a+r.amount,0);
  const expense=rows.filter(r=>r.type==="expense").reduce((a,r)=>a+r.amount,0);
  $("#incomeTotal").textContent="€"+income.toFixed(2);
  $("#expenseTotal").textContent="€"+expense.toFixed(2);
  $("#balanceTotal").textContent="€"+(income-expense).toFixed(2);
  $("#moneyList").innerHTML=rows.slice().reverse().map(r=>`
    <div class="mission"><div><div class="mission-title">${r.category||"Overig"}</div><div class="mission-sub">${r.date}</div></div>
    <strong>${r.type==="expense"?"−":"+"} €${r.amount.toFixed(2)}</strong></div>`).join("");
}

function render(){
  renderMissions(); renderHome(); renderScore(); renderMoney();
  $("#lifeGrid").innerHTML=lifeAreas.map(([i,t,s])=>`<div class="life-card"><span>${i}</span><b>${t}</b><small>${s}</small></div>`).join("");
}

$$(".tab").forEach(b=>b.onclick=()=>{
  $$(".tab").forEach(x=>x.classList.remove("active")); $$(".panel").forEach(x=>x.classList.remove("active"));
  b.classList.add("active"); $("#"+b.dataset.tab).classList.add("active");
});

$("#resetToday").onclick=()=>{localStorage.removeItem("day-"+todayKey());render()};
$("#addMoney").onclick=()=>{
  const amount=parseFloat($("#moneyAmount").value); if(!amount)return;
  const rows=store.get("money",[]);
  rows.push({amount,type:$("#moneyType").value,category:$("#moneyCategory").value.trim(),date:todayKey()});
  store.set("money",rows); $("#moneyAmount").value=""; $("#moneyCategory").value=""; renderMoney();
};
$("#energy").oninput=e=>$("#energyValue").textContent=e.target.value+"/10";
$("#saveEnergy").onclick=()=>{const d=getToday();d.energy=+$("#energy").value;saveToday(d)};
$("#saveWeek").onclick=()=>store.set("week",{
  focus:$("#weekFocus").value,win:$("#weekWin").value,drain:$("#weekDrain").value
});
const wk=store.get("week",{});
$("#weekFocus").value=wk.focus||""; $("#weekWin").value=wk.win||""; $("#weekDrain").value=wk.drain||"";

function ytEmbed(url){
  try{
    const u=new URL(url);
    let id=u.searchParams.get("v");
    if(!id && u.hostname.includes("youtu.be")) id=u.pathname.slice(1);
    return id ? `https://www.youtube.com/embed/${id}` : null;
  }catch{return null}
}
$("#saveVideo").onclick=()=>{
  const url=$("#videoUrl").value.trim(), emb=ytEmbed(url);
  store.set("workoutVideo",url);
  $("#videoFrame").innerHTML=emb?`<iframe src="${emb}" allow="picture-in-picture; fullscreen" allowfullscreen></iframe>`:"Deze link kon niet als YouTube-video worden herkend.";
};
const vid=store.get("workoutVideo","");
$("#videoUrl").value=vid;
if(vid){const emb=ytEmbed(vid); if(emb)$("#videoFrame").innerHTML=`<iframe src="${emb}" allow="picture-in-picture; fullscreen" allowfullscreen></iframe>`}

function unlock(){
  const pin=store.get("pin",null);
  if(pin && $("#pinInput").value!==pin){alert("Pincode klopt niet.");return}
  $("#lockScreen").classList.add("hidden"); $("#app").classList.remove("hidden");
}
$("#unlockBtn").onclick=unlock;
$("#setPinBtn").onclick=()=>{
  const p=prompt("Kies een pincode van 4–6 cijfers:");
  if(p && /^\d{4,6}$/.test(p)){store.set("pin",p);alert("Pincode opgeslagen.");}else if(p!==null) alert("Gebruik 4–6 cijfers.");
};
$("#lockBtn").onclick=()=>{$("#app").classList.add("hidden");$("#lockScreen").classList.remove("hidden");$("#pinInput").value=""};

const h=new Date().getHours();
$("#greeting").textContent=h<12?"Good morning, Queen.":h<18?"Good afternoon, Queen.":"Good evening, Queen.";
render();

if("serviceWorker" in navigator){navigator.serviceWorker.register("sw.js").catch(()=>{})}
