// Game State Management
let S={},keys={},mouse={x:0,y:0},running=false,last=0;

// Input Management
const INPUT={
  type:'desktop', // 'desktop' or 'mobile'
  touchActive:false,
  touchStartX:0,
  touchStartY:0,
  virtualJoystick:{x:0,y:0}
};

// Network State
const NET={
  mode:'solo',peer:null,conn:null,id:'',remoteInput:null,guestName:'GUEST',
  inputTimer:0,snapTimer:0,connected:false,started:false,looping:false,
  mapSent:false,tileDirty:[]
};

// Panel State
const PSTATE={craft:false,inv:false,res:false,skills:false};

// Drag and Drop State
let draggedItem=null;
let draggedFrom=null;

// Create initial game state
function mkState(){
  return{
    p:makePlayer('HOST'),
    p2:null,remotePlayer:null,
    time:6*3600,day:1,wave:1,wleft:0,
    map:[],ghouls:[],loot:[],objs:[],
    cam:{x:0,y:0},stats:{surv:0,kills:0},stimer:0,
    weather:WEATHER.CLEAR,weatherIntensity:0,weatherTimer:0,weatherParticles:[]
  };
}

// Create player object
function makePlayer(name){
  return{
    x:0,y:0,hp:100,maxhp:100,hun:100,tmp:80,spd:50,ang:0,
    em:'🧙',name:name||'Player',
    bag:[],hotbar:['✊','','','','','','','','',''],hsel:0,
    invSize:12, // Base inventory size, can be increased with backpack
    skills:{
      unlocked:[],perks:[]
    },
    skillPoints:0
  };
}

// Clone player for multiplayer
function clonePlayer(p,name){
  return {...p,...playerLoadout(),hp:p.maxhp,hun:100,tmp:80,xp:0,xpn:100,lvl:1,inv:0,name};
}

// Player loadout
function playerLoadout(){
  return{
    res:{wood:0,stone:0,food:0,metal:0},
    bag:[],hotbar:['✊','','','','','','','','',''],hsel:0,
    invSize:12 // Base inventory size, can be increased with backpack
  };
}

// Player data accessors
function playerRes(player=S.p){return player.res||(player.res={wood:0,stone:0,food:0,metal:0});}
function playerBag(player=S.p){return player.bag||(player.bag=[]);}
function playerHotbar(player=S.p){return player.hotbar||(player.hotbar=['✊','','','','','','','','','']);}

// Network status
function setNetStatus(msg){
  const el=document.getElementById('netstatus');
  if(el)el.textContent=msg;
  console.log('[NETWORK]', msg);
}

// Check if PeerJS is loaded
function hasPeer(){
  const loaded=typeof Peer!=='undefined';
  if(!loaded){
    console.error('[NETWORK] PeerJS library not loaded');
  }
  return loaded;
}
