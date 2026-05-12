// UI Management

// Panel management
function togglePanel(n){PSTATE[n]=!PSTATE[n];syncPanels();}
function closePanel(n){PSTATE[n]=false;syncPanels();}
function syncPanels(){
  const map={craft:'fp-craft',inv:'fp-inv',res:'fp-res',skills:'fp-skills',trade:'fp-trade'};
  const bm={craft:'pb-craft',inv:'pb-inv',res:'pb-res',skills:'pb-skills'};
  for(const[n,eid]of Object.entries(map)){
    const el=document.getElementById(eid);
    if(el)el.style.display=PSTATE[n]?'flex':'none';
  }
  for(const[n,eid]of Object.entries(bm)){
    const el=document.getElementById(eid);
    if(el)el.classList.toggle('on',PSTATE[n]);
  }
}

// HUD Updates
function updateHUD(){
  const p=S.p,res=playerRes(p);
  const sb=(id,v,mx)=>{const el=document.getElementById(id);if(el)el.style.width=`${Math.max(0,Math.min(100,v/mx*100))}%`;};
  const st=(id,v)=>{const el=document.getElementById(id);if(el)el.textContent=v;};
  sb('bhp',p.hp,p.maxhp);sb('bhu',p.hun,100);sb('btm',p.tmp,100);
  sb('bxp',p.xp,p.xpn);sb('bxp2',p.xp,p.xpn);
  st('vhp',~~p.hp);st('vhu',~~p.hun);st('vtm',~~p.tmp);
  st('vlvl',p.lvl);st('vlvl2',p.lvl);
  st('hghouls',S.ghouls.length);st('hwave',S.wave);
  st('rwood',res.wood);st('rstone',res.stone);st('rfood',res.food);st('rmetal',res.metal);
  st('skillpoints',p.skillPoints||0);
  updCraft();
  updateWeather();
}

function updCraft(){
  const res=playerRes(S.p);
  for(const[id,rec] of Object.entries(REC)){
    const btn=document.getElementById(`craft-${id}`);
    if(!btn)continue;
    btn.disabled=!Object.entries(rec.cost).every(([k,v])=>(res[k]||0)>=v);
  }
}

// Game log
function glog(msg,type){
  const el=document.getElementById('log'),e=document.createElement('div');
  e.className='le'+(type?' '+type:'');e.textContent='> '+msg;el.appendChild(e);
  setTimeout(()=>e.remove(),4000);
  while(el.children.length>7)el.removeChild(el.firstChild);
}

// Flash effects
function flash(){const el=document.getElementById('dflash');el.style.opacity='1';setTimeout(()=>el.style.opacity='0',120);}

// Death and respawn
function die(){
  running=false;
  const m=~~(S.stats.surv/60),s=~~(S.stats.surv%60);
  document.getElementById('dstats').innerHTML=`Survived ${m}m ${s}s | Day ${S.day} | Wave ${S.wave}<br>Ghouls killed: ${S.stats.kills}`;
  document.getElementById('dscr').style.display='flex';
}

function respawn(){document.getElementById('dscr').style.display='none';initAndStart();}

// Show game UI
function showGameUi(){
  document.getElementById('splash').style.display='none';
  document.getElementById('hud').style.display='flex';
  document.getElementById('hotbar').style.display='flex';
  document.getElementById('pbtns').style.display='flex';
}

// Multiplayer UI
function ensureNetworkUi(){
  const mp=document.getElementById('multiplayer');
  const sp=document.getElementById('splash');
  if(mp)mp.style.display='flex';
  if(sp)sp.style.display='none';
}

function showHost(){
  document.getElementById('multiplayer').style.display='none';
  document.getElementById('splash').style.display='flex';
  document.getElementById('sbtn').textContent='▶ HOST GAME';
  document.getElementById('sbtn').onclick=hostGame;
}

function showJoin(){
  document.getElementById('multiplayer').style.display='none';
  document.getElementById('splash').style.display='flex';
  const joinDiv=document.createElement('div');
  joinDiv.style.cssText='margin-bottom:16px;';
  joinDiv.innerHTML=`
    <input type="text" id="joinid" placeholder="Paste host ID..." style="width:300px;margin-bottom:8px;">
    <button onclick="joinGame()" style="width:300px;">JOIN GAME</button>
  `;
  document.getElementById('sbtn').parentElement.insertBefore(joinDiv, document.getElementById('sbtn'));
  document.getElementById('sbtn').textContent='▶ BACK';
  document.getElementById('sbtn').onclick=()=>{
    location.reload();
  };
}

function startSolo(){
  document.getElementById('multiplayer').style.display='none';
  document.getElementById('splash').style.display='flex';
  document.getElementById('sbtn').textContent='▶ SURVIVE';
  document.getElementById('sbtn').onclick=startGame;
}

// Copy peer ID
function copyPeerId(){
  if(!NET.id){setNetStatus('Host first, then copy the generated ID.');return;}
  navigator.clipboard?.writeText(NET.id);
  setNetStatus('Host ID copied.');
}

// Skills system
function unlockPerk(perkId,player=S.p){
  const perk=PERKS[perkId];
  if(!perk||player.skills.perks.includes(perkId)){
    glog('Perk not available or already unlocked!','warn');
    return;
  }
  if(player.skillPoints<perk.cost){
    glog(`Need ${perk.cost} skill points for ${perk.name}!`,'warn');
    return;
  }
  
  player.skills.perks.push(perkId);
  player.skillPoints-=perk.cost;
  glog(`Perk unlocked: ${perk.name}!`,'good');
  
  // Apply perk effects
  if(perkId==='tank'){
    player.spd*=0.7;
  }
  updateHUD();
}

// Resize canvases
function resizeCanvases(){
  const cv=document.getElementById('canvas');
  cv.width=window.innerWidth;
  cv.height=window.innerHeight;
  const mc=document.getElementById('minimap');
  mc.width=120;mc.height=120;
}
