// Game Constants
const TILE=40,MAP_W=64,MAP_H=64,DAY_DUR=240,PR=8,GR=TILE*1.5;

// Tile Types
const T={GRASS:0,TREE:1,ROCK:2,WATER:3,SAND:4,ORE:5,PLANT:6,FIRE:7,WALL:8,SPIKE:9,TORCH:10};

// Weather Types
const WEATHER={CLEAR:0,RAIN:1,SNOW:2,FOG:3,STORM:4};

// Resource stacking limits
const STACK_SIZES={
  wood:20, stone:40, food:20, metal:10,
  gem:5, 'rare-wood':10, 'rare-stone':20
};

// Tile Colors
const TCOL={0:'#1a2e10',1:'#0d2008',2:'#2a2520',3:'#0a1a2a',4:'#2a2010',5:'#1a1520',6:'#162a08',7:'#3a2000',8:'#2a2520',9:'#221a10',10:'#1a1800'};

// Crafting Recipes
const REC={
  hatchet: {cost:{wood:5,stone:3},em:'🪓',name:'Hatchet'},
  pickaxe: {cost:{wood:5,stone:8},em:'⛏',name:'Pickaxe'},
  campfire:{cost:{wood:8},em:'🔥',name:'Campfire',place:T.FIRE},
  torch:   {cost:{wood:3,food:1},em:'🕯',name:'Torch',place:T.TORCH},
  wall:    {cost:{wood:10,stone:5},em:'🧱',name:'Wall',place:T.WALL},
  spikes:  {cost:{stone:5,metal:3},em:'🪤',name:'Spikes',place:T.SPIKE},
  bow:     {cost:{wood:8,food:3},em:'🏹',name:'Bow'},
  bandage: {cost:{food:4},em:'🩹',name:'Bandage'},
  stew:    {cost:{food:4,wood:2},em:'🍲',name:'Stew'},
  backpack: {cost:{wood:15,stone:10,food:5},em:'🎒',name:'Backpack',effect:'inventory'},
};

// Enemy Types
const ENEMY_TYPES={
  ghoul:{hp:30,mhp:30,spd:30,dmg:5,em:'🧟',acd:0},
  fast:{hp:20,mhp:20,spd:60,dmg:3,em:'👻',acd:0},
  tank:{hp:60,mhp:60,spd:20,dmg:10,em:'🧟‍♂️',acd:0},
  plague:{hp:80,mhp:80,spd:25,dmg:6,em:'☠️',acd:0,special:true},
  spore:{hp:20,mhp:20,spd:40,dmg:8,em:'🦠',type:'spore',acd:0}
};

// Boss Types
const BOSS_TYPES={
  plague:{hp:200,mhp:200,spd:15,dmg:12,em:'☠️',acd:0,special:true}
};

// Wave Configurations
const WAVES=[
  {ghouls:3,fast:0,tank:0},
  {ghouls:5,fast:1,tank:0},
  {ghouls:7,fast:2,tank:0},
  {ghouls:10,fast:3,tank:1},
  {ghouls:12,fast:4,tank:2},
  {ghouls:15,fast:6,tank:3},
  {ghouls:18,fast:8,tank:4},
  {ghouls:20,fast:10,tank:5},
  {ghouls:25,fast:12,tank:6},
  {ghouls:30,fast:15,tank:8}
];

// Skill Perks
const PERKS={
  regen:{name:'Regeneration',cost:3,description:'Slowly regenerate health'},
  nightvision:{name:'Night Vision',cost:2,description:'See better at night'},
  lucky:{name:'Lucky',cost:4,description:'Better loot drops'},
  tank:{name:'Tank',cost:5,description:'50% damage reduction but slower'},
  scavenger:{name:'Scavenger',cost:3,description:'Double gathering speed'}
};
