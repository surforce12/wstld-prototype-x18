// Rendering System

// Main render function
function render(){
  const cv=document.getElementById('canvas'),ctx=cv.getContext('2d');
  const W=cv.width,H=cv.height,cam=S.cam;
  
  // Clear canvas
  ctx.fillStyle='#0d1208';
  ctx.fillRect(0,0,W,H);
  
  // Calculate visible bounds
  const startX=Math.max(0,Math.floor(cam.x/TILE)-1);
  const endX=Math.min(MAP_W,Math.ceil((cam.x+W)/TILE)+1);
  const startY=Math.max(0,Math.floor(cam.y/TILE)-1);
  const endY=Math.min(MAP_H,Math.ceil((cam.y+H)/TILE)+1);
  
  // Render tiles
  for(let y=startY;y<endY;y++){
    for(let x=startX;x<endX;x++){
      const tile=S.map[y][x];
      const sx=x*TILE-cam.x,sy=y*TILE-cam.y;
      if(sx<-TILE||sx>W||sy<-TILE||sy>H)continue;
      ctx.fillStyle=TCOL[tile];
      ctx.fillRect(sx,sy,TILE,TILE);
      
      // Tile details
      if(tile===T.TREE){
        ctx.fillStyle='#0d2008';
        ctx.fillRect(sx+12,sy+28,16,12);
        ctx.fillStyle='#162a08';
        ctx.beginPath();ctx.ellipse(sx+20,sy+20,12,16,0,0,Math.PI*2);ctx.fill();
      }
      if(tile===T.ROCK){
        ctx.fillStyle='#2a2520';
        ctx.beginPath();ctx.arc(sx+20,sy+20,12,0,Math.PI*2);ctx.fill();
      }
      if(tile===T.ORE){
        ctx.fillStyle='#2a2520';
        ctx.beginPath();ctx.arc(sx+20,sy+20,12,0,Math.PI*2);ctx.fill();
        ctx.fillStyle='#1a1520';
        ctx.fillRect(sx+16,sy+16,8,8);
      }
      if(tile===T.PLANT){
        ctx.fillStyle='#162a08';
        for(let i=0;i<5;i++){
          const angle=(Math.PI*2/5)*i;
          ctx.beginPath();ctx.moveTo(sx+20+Math.cos(angle)*8,sy+20+Math.sin(angle)*8);
          ctx.lineTo(sx+20+Math.cos(angle)*3,sy+20+Math.sin(angle)*3);
          ctx.strokeStyle='#162a08';ctx.lineWidth=2;ctx.stroke();
        }
      }
      if(tile===T.WATER){
        ctx.fillStyle='#0a1a2a';
        ctx.fillRect(sx,sy,TILE,TILE);
        ctx.fillStyle='#0d2535';
        ctx.beginPath();ctx.arc(sx+10,sy+10,3,0,Math.PI*2);ctx.fill();
        ctx.beginPath();ctx.arc(sx+30,sy+25,2,0,Math.PI*2);ctx.fill();
      }
      if(tile===T.SAND){
        ctx.fillStyle='#2a2010';
        for(let i=0;i<3;i++){
          const x=sx+10+i*10,y=sy+10+Math.random()*20;
          ctx.beginPath();ctx.arc(x,y,1,0,Math.PI*2);ctx.fill();
        }
      }
    }
  }
  
  // Render objects
  S.objs.forEach(obj=>{
    const sx=obj.x-cam.x,sy=obj.y-cam.y;
    if(sx<-40||sx>W+40||sy<-40||sy>H+40)return;
    
    // Object shadows
    ctx.fillStyle='rgba(0,0,0,.3)';
    ctx.beginPath();ctx.ellipse(sx,sy+16,12,4,0,0,Math.PI*2);ctx.fill();
    
    // Object rendering
    ctx.font='24px serif';ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillText(obj.em,sx,sy);
    ctx.textAlign='left';ctx.textBaseline='alphabetic';
    
    // Special object effects
    if(obj.type==='poison'){
      ctx.fillStyle='rgba(128,0,128,0.3)';
      ctx.beginPath();ctx.arc(sx,sy,40,0,Math.PI*2);ctx.fill();
    }
  });
  
  // Render loot
  S.loot.forEach(l=>{
    const sx=l.x-cam.x,sy=l.y-cam.y;
    if(sx<-40||sx>W+40||sy<-40||sy>H+40)return;
    ctx.fillStyle='rgba(0,0,0,.28)';ctx.beginPath();ctx.ellipse(sx,sy+12,10,4,0,0,Math.PI*2);ctx.fill();
    ctx.font='18px serif';ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillText(l.em,sx,sy);
    if(l.a>1){
      ctx.fillStyle='#fbbf24';ctx.font='10px monospace';
      ctx.fillText(l.a,sx+8,sy-8);
    }
    ctx.textAlign='left';ctx.textBaseline='alphabetic';
  });
  
  // Render ghouls
  S.ghouls.forEach(g=>{
    const sx=g.x-cam.x,sy=g.y-cam.y;
    if(sx<-40||sx>W+40||sy<-40||sy>H+40)return;
    ctx.fillStyle='rgba(0,0,0,.3)';ctx.beginPath();ctx.ellipse(sx,sy+16,10,4,0,0,Math.PI*2);ctx.fill();
    ctx.font='24px serif';ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillText(g.em,sx,sy);ctx.textAlign='left';ctx.textBaseline='alphabetic';
    const bw=30;
    ctx.fillStyle='#300';ctx.fillRect(sx-bw/2,sy-20,bw,4);
    ctx.fillStyle='#a00';ctx.fillRect(sx-bw/2,sy-20,bw*(g.hp/g.mhp),4);
  });
  
  // Render players
  const renderPlayer=(p,local)=>{
    const sx=p.x-cam.x,sy=p.y-cam.y;
    if(sx<-40||sx>W+40||sy<-40||sy>H+40)return;
    
    // Player shadow
    ctx.fillStyle='rgba(0,0,0,.4)';ctx.beginPath();ctx.ellipse(sx,sy+18,12,5,0,0,Math.PI*2);ctx.fill();
    
    // Player body
    ctx.font='28px serif';ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillText(p.em,sx,sy);
    
    // Player name
    ctx.fillStyle='#fbbf24';ctx.font='12px monospace';
    ctx.fillText(p.name,sx,sy-28);
    
    // Health bar
    const bw=40;
    ctx.fillStyle='#300';ctx.fillRect(sx-bw/2,sy-20,bw,4);
    ctx.fillStyle='#a00';ctx.fillRect(sx-bw/2,sy-20,bw*(p.hp/p.maxhp),4);
    
    // Local player indicator
    if(local){
      ctx.strokeStyle='#4ade80';ctx.lineWidth=2;ctx.beginPath();ctx.arc(sx,sy,30,0,Math.PI*2);ctx.stroke();
    }
    
    ctx.textAlign='left';ctx.textBaseline='alphabetic';
  };
  
  if(S.p)renderPlayer(S.p,true);
  if(S.p2)renderPlayer(S.p2,false);
  
  // Render projectiles
  if(S.projectiles){
    S.projectiles.forEach(pr=>{
      const sx=pr.x-cam.x,sy=pr.y-cam.y;
      ctx.font='18px serif';ctx.textAlign='center';ctx.textBaseline='middle';
      ctx.fillText(pr.em,sx,sy);
      ctx.textAlign='left';ctx.textBaseline='alphabetic';
    });
  }
  
  // Render minimap
  renderMinimap();
}

// Minimap rendering
function renderMinimap(){
  const cv=document.getElementById('minimap'),ctx=cv.getContext('2d');
  const scale=120/MAP_W;
  
  ctx.fillStyle='#0d1208';
  ctx.fillRect(0,0,120,120);
  
  // Render tiles on minimap
  for(let y=0;y<MAP_H;y++){
    for(let x=0;x<MAP_W;x++){
      const tile=S.map[y][x];
      if(tile===T.WATER)ctx.fillStyle='#0a1a2a';
      else if(tile===T.SAND)ctx.fillStyle='#2a2010';
      else continue;
      ctx.fillRect(x*scale,y*scale,scale,scale);
    }
  }
  
  // Render objects on minimap
  ctx.fillStyle='#fbbf24';
  S.objs.forEach(obj=>{
    ctx.fillRect(obj.x*scale-1,obj.y*scale-1,2,2);
  });
  
  // Render loot on minimap
  ctx.fillStyle='#22c55e';
  S.loot.forEach(l=>{
    ctx.fillRect(l.x*scale-1,l.y*scale-1,2,2);
  });
  
  // Render ghouls on minimap
  ctx.fillStyle='#ef4444';
  S.ghouls.forEach(g=>{
    ctx.fillRect(g.x*scale-1,g.y*scale-1,2,2);
  });
  
  // Render players on minimap
  ctx.fillStyle='#4ade80';
  if(S.p)ctx.fillRect(S.p.x*scale-2,S.p.y*scale-2,4,4);
  if(S.p2)ctx.fillRect(S.p2.x*scale-2,S.p2.y*scale-2,4,4);
  
  // Render viewport
  const mainCanvas=document.getElementById('canvas');
  ctx.strokeStyle='#ffffff33';
  ctx.strokeRect(
    S.cam.x*scale,
    S.cam.y*scale,
    mainCanvas.width*scale,
    mainCanvas.height*scale
  );
}
