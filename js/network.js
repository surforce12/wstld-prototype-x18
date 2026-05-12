// Network Management (PeerJS Multiplayer)

// Host game
function hostGame(){
  if(!hasPeer()){setNetStatus('PeerJS did not load. Check internet, then reload.');return;}
  if(NET.peer){setNetStatus('Already hosting. Refresh to create new room.');return;}
  NET.mode='host';
  console.log('[HOST] Creating new Peer instance...');
  NET.peer=new Peer();
  setNetStatus('Creating host room...');
  NET.peer.on('open',id=>{
    NET.id=id;
    document.getElementById('peerid').textContent=id;
    console.log('[HOST] Room created with ID:', id);
    setNetStatus('Send this ID to your friend, then press SURVIVE.');
  });
  NET.peer.on('connection',conn=>{
    if(NET.conn){
      console.log('[HOST] Extra connection rejected');
      conn.close();return;
    }
    console.log('[HOST] Guest connecting...');
    attachConnection(conn);
    setNetStatus('Friend connected. Host owns the world simulation.');
  });
  NET.peer.on('error',err=>{
    console.error('[HOST] Peer error:', err);
    setNetStatus(`Network error: ${err.type||err.message}`);
  });
  NET.peer.on('disconnected',()=>{
    console.log('[HOST] Disconnected from PeerJS server');
    setNetStatus('Lost connection to PeerJS server. Try refreshing.');
  });
}

// Join game
function joinGame(){
  if(!hasPeer()){setNetStatus('PeerJS did not load. Check internet, then reload.');return;}
  const id=(document.getElementById('joinid').value||'').trim();
  if(!id){setNetStatus('Paste your friend host ID first.');return;}
  NET.mode='guest';
  console.log('[GUEST] Connecting to host ID:', id);
  NET.peer=new Peer();
  setNetStatus('Connecting...');
  NET.peer.on('open',()=>{
    console.log('[GUEST] Peer opened, attempting connection to host...');
    const conn=NET.peer.connect(id,{reliable:false});
    if(!conn){
      console.error('[GUEST] Failed to create connection');
      setNetStatus('Failed to create connection. Check host ID.');
      return;
    }
    attachConnection(conn);
  });
  NET.peer.on('error',err=>{
    console.error('[GUEST] Peer error:', err);
    setNetStatus(`Network error: ${err.type||err.message}`);
  });
  NET.peer.on('disconnected',()=>{
    console.log('[GUEST] Disconnected from PeerJS server');
    setNetStatus('Lost connection to PeerJS server. Try refreshing.');
  });
}

// Attach connection handlers
function attachConnection(conn){
  NET.conn=conn;
  console.log(`[${NET.mode.toUpperCase()}] Attaching connection handlers...`);
  conn.on('open',()=>{
    NET.connected=true;
    NET.mapSent=false;
    NET.tileDirty=[];
    console.log(`[${NET.mode.toUpperCase()}] Connection opened successfully!`);
    if(NET.mode==='guest'){
      console.log('[GUEST] Sending hello message...');
      sendHello();
    }
    if(NET.mode==='host'&&running&&!S.p2){
      S.p2=clonePlayer(S.p,NET.guestName);
      const sp=findSafeNear(S.p.x,S.p.y);
      S.p2.x=sp.x;S.p2.y=sp.y;S.remotePlayer=S.p2;
      console.log('[HOST] Created guest player at position:', sp);
    }
    setNetStatus(NET.mode==='host'?'Friend connected. Press SURVIVE.':'Connected. Waiting for host world...');
  });
  conn.on('data',handleNetMessage);
  conn.on('close',()=>{
    NET.connected=false;
    console.log(`[${NET.mode.toUpperCase()}] Connection closed`);
    setNetStatus('Friend disconnected.');
  });
  conn.on('error',err=>{
    console.error(`[${NET.mode.toUpperCase()}] Connection error:`, err);
    setNetStatus(`Connection error: ${err.message||err}`);
  });
}

// Send network message
function sendNet(msg){
  if(!NET.conn||!NET.conn.open){
    console.warn(`[${NET.mode.toUpperCase()}] Cannot send - connection not open`);
    return;
  }
  try{
    NET.conn.send(msg);
    console.log(`[${NET.mode.toUpperCase()}] Sent:`, msg.type, msg);
  }
  catch(err){
    console.error(`[${NET.mode.toUpperCase()}] Send failed:`, err);
    setNetStatus(`Send failed: ${err.message||err}`);
  }
}

// Handle incoming network messages
function handleNetMessage(msg){
  if(!msg||!msg.type){
    console.warn(`[${NET.mode.toUpperCase()}] Received empty or invalid message:`, msg);
    return;
  }
  console.log(`[${NET.mode.toUpperCase()}] Received:`, msg.type, msg);
  
  if(NET.mode==='host'&&msg.type==='hello'){
    NET.guestName=cleanName(msg.name,'GUEST');
    if(S.p2)S.p2.name=NET.guestName;
    console.log('[HOST] Guest introduced as:', NET.guestName);
  }
  if(NET.mode==='host'&&msg.type==='input'){
    NET.remoteInput=msg.input;
    NET.guestName=cleanName(msg.input.name,NET.guestName);
    if(S.p2)S.p2.name=NET.guestName;
  }
  if(NET.mode==='host'&&msg.type==='action'&&S.p2){
    NET.guestName=cleanName(msg.name,NET.guestName);
    if(S.p2)S.p2.name=NET.guestName;
    const aim=msg.aim||(NET.remoteInput?{x:NET.remoteInput.aimX,y:NET.remoteInput.aimY}:null);
    console.log('[HOST] Guest action:', msg.action, msg.id||'');
    if(msg.action==='interact')interact(S.p2,aim);
    if(msg.action==='attack')attack(S.p2);
    if(msg.action==='use')useItem(S.p2);
    if(msg.action==='craft')craft(msg.id,S.p2);
  }
  if(NET.mode==='guest'&&msg.type==='state'){
    console.log('[GUEST] Received world state from host');
    const prev=S||{},next=msg.state;
    const map=next.map||prev.map;
    applyTileChanges(map,next.tileChanges);
    S={...next,map};
    const host=S.p,guest=S.p2;
    if(guest){S.p=guest;S.remotePlayer=host;}
    else S.remotePlayer=null;
    NET.started=true;
    showGameUi();
    resizeCanvases();
    const cv=document.getElementById('canvas');
    S.cam.x=S.p.x-cv.width/2;S.cam.y=S.p.y-cv.height/2;
    updateHUD();updateClock();updateNight();
    startLoop();
    console.log('[GUEST] Game started successfully!');
  }
}

// Send hello message
function sendHello(){
  const name=localName('GUEST');
  sendNet({type:'hello',name});
}

// Send guest input
function sendGuestInput(dt){
  if(!NET.connected)return;
  NET.inputTimer+=dt;
  if(NET.inputTimer<0.05)return;
  NET.inputTimer=0;
  const cv=document.getElementById('canvas'),r=cv.getBoundingClientRect();
  sendNet({
    type:'input',
    input:{
      name:localName('GUEST'),
      keys:keys,
      aimX:mouse.x-r.left+S.cam.x,
      aimY:mouse.y-r.top+S.cam.y
    }
  });
}

// Apply tile changes
function applyTileChanges(map,changes){
  if(!changes)return;
  for(const c of changes){
    if(c.y>=0&&c.y<map.length&&c.x>=0&&c.x<map[0].length){
      map[c.y][c.x]=c.t;
    }
  }
}

// Sync world state
function syncWorld(){
  if(NET.mode!=='host'||!NET.connected)return;
  NET.snapTimer+=dt;
  if(NET.snapTimer<0.1)return;
  NET.snapTimer=0;
  
  const state={
    p:S.p,p2:S.p2,remotePlayer:S.remotePlayer,
    time:S.time,day:S.day,wave:S.wave,wleft:S.wleft,
    ghouls:S.ghouls,loot:S.loot,objs:S.objs,
    stats:S.stats,weather:S.weather,
    map:NET.mapSent?null:S.map,
    tileChanges:NET.tileDirty
  };
  
  sendNet({type:'state',state});
  
  if(!NET.mapSent){
    NET.mapSent=true;
    NET.tileDirty=[];
  }
}
