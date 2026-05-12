// Main Game Loop and Initialization

// Game loop
function loop(t){
  if(!running)return;
  const dt=Math.min((t-last)/1000,0.1);last=t;
  
  if(NET.mode==='guest'){
    sendGuestInput(dt);
    if(S.p&&S.map&&S.map.length)movePlayer(S.p,keys,dt);
    const cv=document.getElementById('canvas');
    if(S.p){S.cam.x=S.p.x-cv.width/2;S.cam.y=S.p.y-cv.height/2;}
    updateHUD();updateClock();updateNight();
    return;
  }
  
  // Movement
  movePlayer(S.p,keys,dt);
  if(S.p2&&NET.remoteInput){
    movePlayer(S.p2,NET.remoteInput.keys,dt);
    S.p2.ang=NET.remoteInput.ang||S.p2.ang;
    S.remotePlayer=S.p2;
  }
  
  // Update game state
  S.time+=dt;
  if(S.time>=24*3600){S.time-=24*3600;S.day++;}
  S.stats.surv+=dt;
  S.stimer+=dt;
  
  // Update enemies
  updateEnemies(dt);
  
  // Update boss
  if(S.ghouls.some(g=>g.em==='☠️')){
    const boss=S.ghouls.find(g=>g.em==='☠️');
    if(boss)updateBoss(boss,dt);
  }
  
  // Update objects
  S.objs=S.objs.filter(obj=>{
    if(obj.update)obj.update(dt);
    return true;
  });
  
  // Auto-pick loot
  for(let i=S.loot.length-1;i>=0;i--){
    const l=S.loot[i];
    if(alivePlayers().some(pl=>Math.hypot(l.x-pl.x,l.y-pl.y)<32)){
      const picker=alivePlayers().find(pl=>Math.hypot(l.x-pl.x,l.y-pl.y)<32);
      if(!picker)continue;
      
      if(l.isResource){
        // Handle resource stacking
        pickupResources(picker, l);
      } else {
        // Handle regular loot
        const res=playerRes(picker);
        if(l.n==='Food') addResource(picker, 'food', l.a);
        if(l.n==='Wood') addResource(picker, 'wood', l.a);
        if(l.n==='Metal') addResource(picker, 'metal', l.a);
        if(picker===S.p)glog(`+${l.a} ${l.em}`,'good');
      }
      S.loot.splice(i,1);
    }
  }
  
  // Check wave completion
  if(S.ghouls.length===0&&S.wleft){
    S.wave++;
    glog(`Wave ${S.wave} complete!`,'good');
    gainXP(50);
    if(S.wave<=WAVES.length){
      startWave(S.wave);
    }else{
      // Spawn boss
      const sp=findSpawn();
      S.ghouls.push({
        x:sp.x+200,y:sp.y,
        hp:200,mhp:200,spd:15,dmg:12,
        em:'☠️',acd:0,special:true
      });
      glog('BOSS BATTLE! Plague Lord incoming!','danger');
    }
  }
  
  // Update camera
  const cv=document.getElementById('canvas');
  S.cam.x=S.p.x-cv.width/2;S.cam.y=S.p.y-cv.height/2;
  
  // Update UI
  updateHUD();updateClock();updateNight();
  
  // Network sync
  syncWorld();
  
  // Render
  render();
  
  // Continue loop
  requestAnimationFrame(loop);
}

// Start game loop
function startLoop(){
  running=true;
  if(NET.looping)return;
  NET.looping=true;
  last=performance.now();
  requestAnimationFrame(loop);
}

// Initialize and start game
function initAndStart(){
  NET.mapSent=false;NET.tileDirty=[];
  S=mkState();S.map=genMap();
  S.p.name=localName('HOST');
  const sp=findSpawn();S.p.x=sp.x;S.p.y=sp.y;
  if(NET.mode==='host'&&NET.connected)S.p2=clonePlayer(S.p,NET.guestName);
  if(S.p2){const sp2=findSafeNear(S.p.x,S.p.y);S.p2.x=sp2.x;S.p2.y=sp2.y;S.remotePlayer=S.p2;}
  
  resizeCanvases();
  const mc=document.getElementById('minimap');mc.style.display='block';
  startWave(1);
  updInv();updHotbar();updCraft();
  
  // Detect device type and setup controls
  detectDeviceType();
  setupMobileControls();
  
  startLoop();
  glog('Welcome to Wasteland. Survive.','good');
  if(INPUT.type === 'mobile'){
    glog('Touch controls: Tap to interact, drag to move','good');
  } else {
    glog('E=gather  SPACE=attack  F=use item','');
    glog('C=craft  I=inventory  Q=drop item','');
  }
}

// Start game
function startGame(){
  if(NET.mode==='guest'){setNetStatus('Guest starts when the host presses SURVIVE.');return;}
  showGameUi();
  initAndStart();
}

// Window resize handler
window.addEventListener('resize',resizeCanvases);
