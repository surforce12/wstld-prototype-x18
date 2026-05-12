// Input Management

// Keyboard events
document.addEventListener('keydown',e=>{
  const k=e.key.toLowerCase();keys[k]=true;
  if(!running)return;
  if(k==='e')interact();
  if(k==='f')useItem();
  if(k===' '){e.preventDefault();attack();}
  if(k==='c')togglePanel('craft');
  if(k==='i')togglePanel('inv');
  if(k==='k')togglePanel('skills');
  if(k==='m'){const mc=document.getElementById('minimap');mc.style.display=mc.style.display==='none'?'block':'none';}
  // Movement keys
  if(k==='a'||k==='arrowleft')keys.a=true;
  if(k==='d'||k==='arrowright')keys.d=true;
  if('12345678'.includes(k)&&k>='1'&&k<='8'){
    const i=+k-1;S.p.hsel=i;
    document.querySelectorAll('.hs').forEach((s,j)=>s.classList.toggle('active',j===i));
  }
  // Drop items with Q
  if(k==='q')dropItemMenu();
});

document.addEventListener('keyup',e=>{keys[e.key.toLowerCase()]=false;});

// Mouse events
document.getElementById('canvas').addEventListener('click',(e)=>{
  if(!running)return;
  const cv=document.getElementById('canvas'),r=cv.getBoundingClientRect();
  const mx=e.clientX-r.left+S.cam.x,my=e.clientY-r.top+S.cam.y;
  
  // Check if clicking on actual hotbar UI elements, not game world
  const hotbarEl = document.getElementById('hotbar');
  const hotbarRect = hotbarEl.getBoundingClientRect();
  if(e.clientX >= hotbarRect.left && e.clientX <= hotbarRect.right &&
     e.clientY >= hotbarRect.top && e.clientY <= hotbarRect.bottom){
    // Click is on hotbar UI, handle hotbar interaction
    const slotWidth = hotbarRect.width / 8;
    const clickedSlot = Math.floor((e.clientX - hotbarRect.left) / slotWidth);
    if(clickedSlot >= 0 && clickedSlot < 8){
      if(S.p.hsel===clickedSlot){
        // Move item from hotbar to inventory
        moveFromHotbarToInventory(clickedSlot);
      } else {
        // Select hotbar slot
        S.p.hsel=clickedSlot;
        updHotbar();
      }
    }
    return;
  }
  
  // Regular attack for game world clicks
  attack();
});

document.addEventListener('mousemove',e=>{
  mouse={x:e.clientX,y:e.clientY};
  if(!S.p||!running)return;
  const cv=document.getElementById('canvas'),r=cv.getBoundingClientRect();
  S.p.ang=Math.atan2(e.clientY-r.top-(S.p.y-S.cam.y),e.clientX-r.left-(S.p.x-S.cam.x));
});

// Drag and drop for hotbar
document.querySelectorAll('.hs').forEach((slot,i)=>{
  slot.addEventListener('dragstart',(e)=>{
    if(i===0)return; // Can't drag hand slot
    e.dataTransfer.effectAllowed='move';
    draggedItem={type:'hotbar',index:i,item:S.p.hotbar[i]};
    draggedFrom='hotbar';
    slot.classList.add('dragging');
  });
  
  slot.addEventListener('dragend',()=>{
    slot.classList.remove('dragging');
    draggedItem=null;
    draggedFrom=null;
  });
  
  slot.addEventListener('dragover',(e)=>{
    e.preventDefault();
    if(i!==0){ // Can't drop on hand slot
      slot.classList.add('dragging');
    }
  });
  
  slot.addEventListener('dragleave',()=>{
    slot.classList.remove('dragging');
  });
  
  slot.addEventListener('drop',(e)=>{
    e.preventDefault();
    slot.classList.remove('dragging');
    if(!draggedItem || i===0)return;
    
    handleDrop(draggedItem,{type:'hotbar',index:i});
  });
});

// Mobile controls
function detectDeviceType(){
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
                 (typeof window.orientation !== "undefined") || 
                 (navigator.maxTouchPoints && navigator.maxTouchPoints > 0);
  
  INPUT.type = isMobile ? 'mobile' : 'desktop';
  
  if(INPUT.type === 'mobile'){
    glog('Mobile device detected - Touch controls enabled','good');
  } else {
    glog('Desktop detected - Keyboard/Mouse controls enabled','good');
  }
}

function setupMobileControls(){
  if(INPUT.type !== 'mobile')return;
  
  const joystick = document.getElementById('virtual-joystick');
  const joystickHandle = document.querySelector('.joystick-handle');
  const btnInteract = document.getElementById('btn-interact');
  const btnAttack = document.getElementById('btn-attack');
  
  joystick.style.display = 'block';
  
  // Joystick movement
  let joystickActive = false;
  
  joystickHandle.addEventListener('touchstart', (e) => {
    e.preventDefault();
    joystickActive = true;
    const touch = e.touches[0];
    INPUT.touchStartX = touch.clientX;
    INPUT.touchStartY = touch.clientY;
  });
  
  joystickHandle.addEventListener('touchmove', (e) => {
    e.preventDefault();
    if(!joystickActive)return;
    
    const touch = e.touches[0];
    const deltaX = touch.clientX - INPUT.touchStartX;
    const deltaY = touch.clientY - INPUT.touchStartY;
    
    // Update virtual joystick position
    const maxDistance = 40;
    const distance = Math.min(Math.sqrt(deltaX * deltaX + deltaY * deltaY), maxDistance);
    const angle = Math.atan2(deltaY, deltaX);
    
    INPUT.virtualJoystick.x = Math.cos(angle) * distance / maxDistance;
    INPUT.virtualJoystick.y = Math.sin(angle) * distance / maxDistance;
    
    joystickHandle.style.transform = `translate(${INPUT.virtualJoystick.x * 20}px, ${INPUT.virtualJoystick.y * 20}px)`;
  });
  
  joystickHandle.addEventListener('touchend', () => {
    joystickActive = false;
    INPUT.virtualJoystick.x = 0;
    INPUT.virtualJoystick.y = 0;
    joystickHandle.style.transform = 'translate(0px, 0px)';
  });
  
  // Button controls
  btnInteract.addEventListener('touchstart', (e) => {
    e.preventDefault();
    keys.e = true;
    setTimeout(() => keys.e = false, 100);
  });
  
  btnAttack.addEventListener('touchstart', (e) => {
    e.preventDefault();
    keys[' '] = true;
    setTimeout(() => keys[' '] = false, 100);
  });
  
  // Touch controls for canvas
  const canvas = document.getElementById('canvas');
  
  canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    INPUT.touchStartX = touch.clientX - rect.left;
    INPUT.touchStartY = touch.clientY - rect.top;
    INPUT.touchActive = true;
  });
  
  canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    if(!INPUT.touchActive)return;
    
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const deltaX = touch.clientX - rect.left - INPUT.touchStartX;
    const deltaY = touch.clientY - rect.top - INPUT.touchStartY;
    
    // Update aim based on touch
    mouse.x = touch.clientX;
    mouse.y = touch.clientY;
  });
  
  canvas.addEventListener('touchend', () => {
    INPUT.touchActive = false;
  });
}
