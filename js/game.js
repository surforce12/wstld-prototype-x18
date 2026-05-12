// Core Game Logic

// Map Generation
function genMap(){
  const map=[];
  for(let y=0;y<MAP_H;y++){
    map[y]=[];
    for(let x=0;x<MAP_W;x++){
      if(Math.random()<0.05)map[y][x]=T.WATER;
      else if(Math.random()<0.15)map[y][x]=T.SAND;
      else map[y][x]=T.GRASS;
    }
  }
  
  // Add resources
  for(let i=0;i<200;i++){
    const x=~~(Math.random()*MAP_W),y=~~(Math.random()*MAP_H);
    if(map[y][x]===T.GRASS){
      const r=Math.random();
      if(r<0.3)map[y][x]=T.TREE;
      else if(r<0.5)map[y][x]=T.ROCK;
      else if(r<0.55)map[y][x]=T.ORE;
      else if(r<0.7)map[y][x]=T.PLANT;
    }
  }
  
  return map;
}

// Movement and collision
function canWalk(x,y){
  const tx=~~(x/TILE),ty=~~(y/TILE);
  if(tx<0||tx>=MAP_W||ty<0||ty>=MAP_H)return false;
  const tile=S.map[ty][tx];
  if(tile===T.WATER||tile===T.ROCK||tile===T.ORE)return false;
  
  // Check objects
  for(const obj of S.objs){
    if(Math.hypot(obj.x-x,obj.y-y)<TILE/2)return false;
  }
  
  return true;
}

function movePlayer(p,input,dt){
  let dx=0,dy=0;
  const k=input||keys;
  
  if(INPUT.type === 'mobile'){
    // Use virtual joystick for mobile
    dx = INPUT.virtualJoystick.x;
    dy = INPUT.virtualJoystick.y;
  } else {
    // Use keyboard for desktop
    if(k['w']||k['arrowup'])    dy=-1;
    if(k['s']||k['arrowdown'])  dy= 1;
    if(k['a']||k['arrowleft'])  dx=-1;
    if(k['d']||k['arrowright']) dx= 1;
  }
  
  if(dx&&dy){dx*=.707;dy*=.707;}
  const spd=p.spd*dt;
  if(canWalk(p.x+dx*spd,p.y))p.x+=dx*spd;
  if(canWalk(p.x,p.y+dy*spd))p.y+=dy*spd;
}

// Combat
function getTgt(player=S.p,aim=null){
  const p=player,cv=document.getElementById('canvas'),r=cv.getBoundingClientRect();
  const mx=aim?aim.x:(mouse.x-r.left+S.cam.x),my=aim?aim.y:(mouse.y-r.top+S.cam.y);
  let minDist=Infinity,closest=null;
  for(const g of S.ghouls){
    const d=Math.hypot(g.x-mx,g.y-my);
    if(d<minDist&&d<GR){
      minDist=d;closest=g;
    }
  }
  return closest;
}

function attack(player=S.p,aim=null){
  const tgt=getTgt(player,aim);
  if(!tgt) return;
  const dmg=player.hotbar[player.hsel]==='🪓'?8:5;
  tgt.hp-=dmg;
  glog(`Hit ${tgt.em} -${dmg}`,'');
  if(tgt.hp<=0){
    const idx=S.ghouls.indexOf(tgt);
    S.ghouls.splice(idx,1);
    gainXP(10,player);
    S.stats.kills++;
    // Drop loot
    if(Math.random()<0.3){
      S.loot.push({
        x:tgt.x,y:tgt.y,
        em:Math.random()<0.5?'🌿':'🪵',
        n:Math.random()<0.5?'Food':'Wood',
        a:~~(Math.random()*3+1)
      });
    }
    glog(`Killed ${tgt.em}`,'good');
  }
}

// Interaction
function interact(player=S.p,aim=null){
  const p=player,cv=document.getElementById('canvas'),r=cv.getBoundingClientRect();
  const mx=aim?aim.x:(mouse.x-r.left+S.cam.x),my=aim?aim.y:(mouse.y-r.top+S.cam.y);
  const tx=~~(mx/TILE),ty=~~(my/TILE);
  if(tx<0||tx>=MAP_W||ty<0||ty>=MAP_H)return;
  const tile=S.map[ty][tx];
  let ok=false;
  
  // Gathering bonuses
  const hasHatchet=playerBag(player).some(i=>i.name==='Hatchet');
  const hasPickaxe=playerBag(player).some(i=>i.name==='Pickaxe');
  const gatheringBonus=hasHatchet&&tile===T.TREE?2:hasPickaxe&&tile===T.ROCK?2:1;
  const hh=player.hotbar[player.hsel]==='🪓';
  const hp2=player.hotbar[player.hsel]==='⛏';
  
  if(tile.t===T.TREE) {
    const amount=Math.floor((hh?3:1)*gatheringBonus);
    const added=addResource(player, 'wood', amount);
    if(added && player===S.p)glog(`+${amount} 🪵`,'good'),ok=true;
    else if(!added && player===S.p)glog('Wood stacks full!','warn');
  }
  if(tile.t===T.ROCK) {
    const amount=Math.floor((hp2?3:1)*gatheringBonus);
    const added=addResource(player, 'stone', amount);
    if(added && player===S.p)glog(`+${amount} 🪨`,'good'),ok=true;
    else if(!added && player===S.p)glog('Stone stacks full!','warn');
  }
  if(tile.t===T.ORE)  {
    const amount=Math.floor(1*gatheringBonus);
    const added=addResource(player, 'metal', amount);
    if(added && player===S.p)glog(`+${amount} ⚙️`,'good'),ok=true;
    else if(!added && player===S.p)glog('Metal stacks full!','warn');
  }
  if(tile.t===T.PLANT){
    const amount=Math.floor(2*gatheringBonus);
    const added=addResource(player, 'food', amount);
    if(added && player===S.p)glog(`+${amount} 🌿`,'good'),ok=true;
    else if(!added && player===S.p)glog('Food stacks full!','warn');
  }
  
  if(ok){
    gainXP(2,player);
    if(tile===T.TREE||tile===T.ROCK||tile===T.ORE){
      S.map[ty][tx]=T.GRASS;
      if(NET.mode==='host')NET.tileDirty.push({x:tx,y:ty,t:T.GRASS});
    }else if(tile===T.PLANT){
      S.map[ty][tx]=T.GRASS;
      if(NET.mode==='host')NET.tileDirty.push({x:tx,y:ty,t:T.GRASS});
      setTimeout(()=>{
        if(S.map[ty][tx]===T.GRASS)S.map[ty][tx]=T.PLANT;
      },10000);
    }
  }
}

// Item usage
function useItem(player=S.p){
  const item=player.hotbar[player.hsel];
  if(!item||item==='✊'){glog('Empty slot!','warn');return;}
  const icons={'🩹':'Bandage','🍲':'Stew','🕯':'Torch'};
  const name=icons[item];
  if(!name){glog('Cannot use this item!','warn');return;}
  
  const bag=playerBag(player);
  const idx=bag.findIndex(i=>i.name===name);
  if(idx<0){glog('Item not in inventory!','warn');return;}
  const itm=bag[idx];
  
  if(name==='Bandage'){
    if(player.hp>=player.maxhp){glog('Health full!','warn');return;}
    player.hp=Math.min(player.maxhp,player.hp+25);
    glog('Healed +25 HP','good');
  }
  if(name==='Stew'){
    if(player.hun>=100){glog('Hunger full!','warn');return;}
    player.hun=Math.min(100,player.hun+40);
    player.hp=Math.min(player.maxhp,player.hp+10);
    glog('Ate stew +40 Hunger +10 HP','good');
  }
  if(name==='Torch'){
    const sp=findSafeNear(player.x,player.y);
    placeObj(T.TORCH,'🕯',player,sp.x,sp.y);
    glog('Placed torch','good');
  }
  
  itm.c--;
  if(itm.c<=0)bag.splice(idx,1);
  updInv();
  gainXP(5,player);
}

// Crafting
function craft(id,player=S.p){
  if(NET.mode==='guest'&&player===S.p){sendNet({type:'action',action:'craft',id,name:localName('GUEST')});return;}
  const rec=REC[id],res=playerRes(player);
  for(const[k,v]of Object.entries(rec.cost))if((res[k]||0)<v){if(player===S.p)glog('Not enough resources!','warn');return;}
  for(const[k,v]of Object.entries(rec.cost))res[k]-=v;
  if(rec.place!==undefined)placeObj(rec.place,rec.em,player);
  else if(rec.effect==='inventory'){
    // Backpack increases inventory size
    player.invSize+=10;
    glog(`Inventory increased to ${player.invSize} slots!`,'good');
  } else {
    addInv(rec.em,rec.name,player);
    if(player===S.p)updHotbar();
  }
  gainXP(15,player);if(player===S.p)glog(`Crafted ${rec.em} ${rec.name}`,'good');
  if(player===S.p){updCraft();updInv();}
}

// Place objects
function placeObj(tile,em,player=S.p,x,y){
  if(!x||!y){x=player.x;y=player.y;}
  const tx=~~(x/TILE),ty=~~(y/TILE);
  if(tx<0||tx>=MAP_W||ty<0||ty>=MAP_H)return;
  if(S.map[ty][tx]!==T.GRASS)return;
  S.map[ty][tx]=tile;
  if(NET.mode==='host')NET.tileDirty.push({x:tx,y:ty,t:tile});
  S.objs.push({x:tx*TILE+TILE/2,y:ty*TILE+TILE/2,em});
  glog(`Placed ${em}`,'good');
}

// Add item to inventory
function addInv(em,name,player=S.p){
  const bag=playerBag(player);
  const existing=bag.find(i=>i.name===name);
  if(existing)existing.c++;
  else bag.push({em,name,c:1});
  if(player===S.p)updInv();
}

// Experience and leveling
function gainXP(n,player=S.p){
  player.xp+=n;
  // Check level up
  if(player.xp>=player.xpn){
    player.lvl++;
    player.skillPoints+=2;
    player.xpn=player.lvl*100;
    player.hp=player.maxhp;
    player.hun=100;
    glog(`LEVEL ${player.lvl}! +2 skill points`,'good');
  }
}

// Spawn points
function findSpawn(){
  for(let y=0;y<MAP_H;y++){
    for(let x=0;x<MAP_W;x++){
      if(S.map[y][x]===T.GRASS){
        const nearWater=([[-1,0],[1,0],[0,-1],[0,1]]).some(([dx,dy])=>{
          const nx=x+dx,ny=y+dy;
          return nx>=0&&nx<MAP_W&&ny>=0&&ny<MAP_H&&S.map[ny][nx]===T.WATER;
        });
        if(!nearWater) return {x:x*TILE+TILE/2,y:y*TILE+TILE/2};
      }
    }
  }
  return {x:MAP_W*TILE/2,y:MAP_H*TILE/2};
}

function findSafeNear(x,y){
  const candidates=[];
  for(let dy=-3;dy<=3;dy++){
    for(let dx=-3;dx<=3;dx++){
      const tx=~~(x/TILE)+dx,ty=~~(y/TILE)+dy;
      if(tx>=0&&tx<MAP_W&&ty>=0&&ty<MAP_H&&S.map[ty][tx]===T.GRASS){
        candidates.push({x:tx*TILE+TILE/2,y:ty*TILE+TILE/2});
      }
    }
  }
  if(candidates.length===0) return findSpawn();
  return candidates[~~(Math.random()*candidates.length)];
}

// Wave system
function startWave(n){
  S.wave=n;S.wleft=WAVES[Math.min(n-1,WAVES.length-1)];
  glog(`Wave ${n} incoming!`,'warn');
  spawnWaveEnemies();
}

function spawnWaveEnemies(){
  const sp=findSpawn();
  const types=['ghoul','fast','tank'];
  for(const[type,count]of Object.entries(S.wleft)){
    for(let i=0;i<count;i++){
      const angle=Math.random()*Math.PI*2;
      const dist=200+Math.random()*100;
      const enemy=ENEMY_TYPES[type];
      S.ghouls.push({
        x:sp.x+Math.cos(angle)*dist,
        y:sp.y+Math.sin(angle)*dist,
        hp:enemy.hp,mhp:enemy.mhp,spd:enemy.spd,dmg:enemy.dmg,
        em:enemy.em,acd:0
      });
    }
  }
}

// AI for enemies
function updateEnemies(dt){
  S.ghouls.forEach(g=>{
    if(g.acd>0)g.acd-=dt;
    const pl=alivePlayers()[0];
    if(!pl)return;
    const dx=pl.x-g.x,dy=pl.y-g.y,dist=Math.hypot(dx,dy);
    if(dist<TILE*2){
      // Attack
      if(g.acd<=0){
        pl.hp-=g.dmg;
        g.acd=1.5;
        glog(`${g.em} hit you -${g.dmg}`,'danger');
      }
    } else {
      // Move towards player
      const ang=Math.atan2(dy,dx);
      const spd=g.spd*dt;
      const nx=g.x+Math.cos(ang)*spd,ny=g.y+Math.sin(ang)*spd;
      if(canWalk(nx,ny)){g.x=nx;g.y=ny;}
    }
  });
}

// Boss mechanics
function updateBoss(boss,dt){
  if(!boss.special)return;
  boss.scd=(boss.scd||0)+dt;
  if(boss.scd>5){
    boss.scd=0;
    const ability=['poison','spawn'][~~(Math.random()*2)];
    if(ability==='poison'){
      // Create poison cloud
      for(let i=0;i<8;i++){
        const angle=(Math.PI*2/8)*i;
        const x=boss.x+Math.cos(angle)*80;
        const y=boss.y+Math.sin(angle)*80;
        S.objs.push({
          x,y,type:'poison',em:'☠️',timer:3,
          update:function(dt){
            this.timer-=dt;
            if(this.timer<=0){
              const idx=S.objs.indexOf(this);
              S.objs.splice(idx,1);
              return;
            }
            // Damage nearby players
            alivePlayers().forEach(pl=>{
              if(Math.hypot(pl.x-this.x,pl.y-this.y)<TILE){
                pl.hp-=15*dt;
              }
            });
          }
        });
      }
      glog('Plague released poison!','danger');
    }
    if(ability==='spawn'){
      for(let i=0;i<3;i++){
        const angle=(Math.PI*2/3)*i;
        const x=boss.x+Math.cos(angle)*100;
        const y=boss.y+Math.sin(angle)*100;
        S.ghouls.push({
          x:x,y:y,hp:20,mhp:20,spd:40,dmg:8,em:'🦠',type:'spore',acd:0
        });
      }
      glog('Plague spawned spores!','danger');
    }
  }
}

// Time and weather
function updateClock(){
  const h=~~(S.time/3600)%24,m=~~((S.time%3600)/60);
  const str=`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
  let phase='☀ MORNING';
  if(h>=12&&h<18)phase='🌤 AFTERNOON';else if(h>=18&&h<20)phase='🌅 DUSK';else if(h>=20||h<6)phase='🌙 NIGHT';
  const $=id=>document.getElementById(id);
  if($('htime'))$('htime').textContent=str;
  if($('hday')) $('hday').textContent=`DAY ${S.day}`;
  if($('hphase'))$('hphase').textContent=phase;
}

function updateWeather(){
  const weatherEl=document.getElementById('hweather');
  const iconEl=document.getElementById('hweather-icon');
  const textEl=document.getElementById('hweather-text');
  
  if(!weatherEl||!iconEl||!textEl)return;
  
  const weatherNames=['CLEAR','RAIN','SNOW','FOG','STORM'];
  const weatherIcons=['☀','🌧','❄️','🌫','⛈'];
  
  if(S.weather!==undefined && S.weather!==null){
    weatherEl.style.display='flex';
    iconEl.textContent=weatherIcons[S.weather]||'☀';
    textEl.textContent=weatherNames[S.weather]||'CLEAR';
  } else {
    weatherEl.style.display='none';
  }
}

function nightFac(){
  const h=S.time/3600;
  if(h>=8&&h<18)return 0;if(h>=18&&h<20)return(h-18)/2;
  if(h>=20||h<4)return 1;if(h>=4&&h<6)return 1-(h-4)/2;return 0;
}

function updateNight(){document.getElementById('nover').style.opacity=nightFac()*.65;}

// Helper functions
function alivePlayers(){
  return [S.p,S.p2].filter(p=>p&&p.hp>0);
}

function cleanName(name,def='Player'){
  return (name||'').toString().trim().slice(0,12)||def;
}

function localName(suffix=''){
  const nick=document.getElementById('nickname')?.value?.trim();
  return nick?`${nick}${suffix?' '+suffix:''}`:suffix||'Player';
}
