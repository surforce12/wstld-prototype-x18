// Inventory Management System

// Add resources with stacking
function addResource(player, resourceType, amount){
  const res=playerRes(player);
  const stackSize=STACK_SIZES[resourceType]||STACK_SIZES.wood;
  const current=res[resourceType]||0;
  const canAdd=Math.min(amount, stackSize - (current % stackSize));
  res[resourceType]=current + canAdd;
  
  // Add to inventory with proper stacking
  if(canAdd > 0){
    const bag=playerBag(player);
    const icons={wood:'🪵',stone:'🪨',food:'🌿',metal:'⚙️'};
    const icon=icons[resourceType]||'📦';
    const itemName=resourceType.charAt(0).toUpperCase()+resourceType.slice(1);
    
    // Find existing stacks that aren't full
    const existingStacks=bag.filter(i=>i.name===itemName && i.c < stackSize);
    let remainingAmount=canAdd;
    
    // Fill existing stacks first
    for(const stack of existingStacks){
      if(remainingAmount <= 0)break;
      const spaceLeft=stackSize - stack.c;
      const toAdd=Math.min(remainingAmount, spaceLeft);
      stack.c += toAdd;
      remainingAmount -= toAdd;
    }
    
    // Create new stacks for remaining amount
    while(remainingAmount > 0){
      const newStackAmount=Math.min(remainingAmount, stackSize);
      bag.push({em:icon,name:itemName,c:newStackAmount});
      remainingAmount -= newStackAmount;
    }
    
    if(player===S.p){
      updInv();
      glog(`+${canAdd} ${icon} ${itemName}`,'good');
    }
  }
  
  return canAdd === amount; // Returns true if all resources added
}

// Move item from hotbar to inventory
function moveFromHotbarToInventory(slotIndex){
  const hotbar=playerHotbar(S.p);
  const item=hotbar[slotIndex];
  
  if(!item || item === '' || slotIndex === 0){
    return; // Silent return, no error message
  }
  
  const bag=playerBag(S.p);
  const icons={'🪵':'Wood','🪨':'Stone','🌿':'Food','⚙️':'Metal','🪓':'Hatchet','⛏':'Pickaxe','🏹':'Bow'};
  const itemName=icons[item]||'Item';
  
  // Add to inventory
  const existing=bag.find(i=>i.name===itemName);
  if(existing){
    existing.c=(existing.c||1)+1;
  } else {
    bag.push({em:item,name:itemName,c:1});
  }
  
  // Remove from hotbar
  hotbar[slotIndex]='';
  S.p.hotbar=hotbar;
  
  updHotbar();
  updInv();
  glog(`Moved ${item} to inventory`,'good');
}

// Drop resources on ground
function dropResources(player, resourceType, amount){
  const res=playerRes(player);
  const available=Math.min(amount, res[resourceType]||0);
  if(available<=0)return false;
  
  res[resourceType]-=available;
  
  // Create loot pile on ground
  const icons={wood:'🪵',stone:'🪨',food:'🌿',metal:'⚙️',gem:'💎'};
  S.loot.push({
    x:player.x,
    y:player.y,
    em:icons[resourceType]||'📦',
    n:resourceType.charAt(0).toUpperCase()+resourceType.slice(1),
    a:available,
    isResource:true
  });
  
  glog(`Dropped ${available} ${icons[resourceType]} ${resourceType}`,'');
  return true;
}

// Pick up resources from ground
function pickupResources(player, loot){
  if(!loot.isResource)return false;
  
  const res=playerRes(player);
  const added=addResource(player, loot.n.toLowerCase(), loot.a);
  
  if(added){
    glog(`+${loot.a} ${loot.em} ${loot.n}`,'good');
    return true;
  } else {
    glog(`Inventory full for ${loot.n}!`,'warn');
    return false;
  }
}

// Update hotbar display
function updHotbar(){
  const p=S.p;
  const hotbar=p.hotbar||['✊','','','','','','','','',''];
  
  // Update hotbar display only (don't auto-fill from inventory)
  for(let i=0;i<8;i++){
    const sl=document.getElementById(`h${i}`);
    const num=sl.querySelector('.hn').outerHTML;
    let itemDisplay=hotbar[i]||'';
    
    // Add stack count if item is a resource
    if(itemDisplay && itemDisplay !== '✊'){
      const resourceIcons={'🪵':'Wood','🪨':'Stone','🌿':'Food','⚙️':'Metal'};
      const resourceName=resourceIcons[itemDisplay];
      if(resourceName){
        const res=playerRes(p);
        const amount=res[resourceName.toLowerCase()]||0;
        if(amount>0){
          itemDisplay+=`<span class="hc">${amount}</span>`;
        }
      }
    }
    
    sl.innerHTML=num+itemDisplay;
    sl.className='hs'+(p.hsel===i?' active':'');
  }
}

// Update inventory display
function updInv(){
  const grid=document.getElementById('igrid');grid.innerHTML='';
  const invSize=S.p.invSize||12;
  const bag=playerBag(S.p);
  const res=playerRes(S.p);
  let invIndex=0;
  
  // Add items from bag first
  bag.forEach((item,i)=>{
    if(invIndex>=invSize)return;
    const sl=document.createElement('div');sl.className='is';
    sl.draggable=true;
    sl.innerHTML=`${item.em}<span class="ic">${item.c>1?item.c:''}</span>`;
    sl.title=`${item.name} (from inventory)`;
    
    // Add drag events
    setupInventoryDragEvents(sl, i, item);
    
    grid.appendChild(sl);
    invIndex++;
  });
  
  // Add resources from res as stacks (only if not already in bag)
  const resourceIcons={wood:'🪵',stone:'🪨',food:'🌿',metal:'⚙️'};
  Object.entries(res).forEach(([type,amount])=>{
    if(invIndex>=invSize || amount<=0)return;
    const icon=resourceIcons[type];
    if(icon){
      // Check if this resource type is already in bag
      const itemName=type.charAt(0).toUpperCase()+type.slice(1);
      const existingInBag=bag.find(item=>item.name===itemName);
      
      if(!existingInBag){
        const stackSize=STACK_SIZES[type]||STACK_SIZES.wood;
        const stacksNeeded=Math.ceil(amount/stackSize);
        
        for(let i=0;i<stacksNeeded && invIndex<invSize;i++){
          const stackAmount=Math.min(stackSize, amount - (i*stackSize));
          const sl=document.createElement('div');sl.className='is';
          sl.draggable=true;
          sl.innerHTML=`${icon}<span class="ic">${stackAmount}</span>`;
          sl.title=`${itemName} (from resources)`;
          
          setupInventoryDragEvents(sl, invIndex, {em:icon,name:itemName,c:stackAmount});
          
          grid.appendChild(sl);
          invIndex++;
        }
      }
    }
  });
  
  // Fill remaining slots
  while(invIndex<invSize){
    const sl=document.createElement('div');sl.className='is';
    grid.appendChild(sl);
    invIndex++;
  }
  
  // Update grid columns based on inventory size
  const cols=Math.ceil(Math.sqrt(invSize));
  grid.style.gridTemplateColumns=`repeat(${cols}, 1fr)`;
}

// Setup drag events for inventory slots
function setupInventoryDragEvents(sl, index, item){
  sl.addEventListener('dragstart',(e)=>{
    e.dataTransfer.effectAllowed='move';
    draggedItem={type:'inventory',index:index,item:item};
    draggedFrom='inventory';
    sl.classList.add('dragging');
  });
  
  sl.addEventListener('dragend',()=>{
    sl.classList.remove('dragging');
    draggedItem=null;
    draggedFrom=null;
  });
  
  sl.addEventListener('dragover',(e)=>{
    e.preventDefault();
    sl.classList.add('dragging');
  });
  
  sl.addEventListener('dragleave',()=>{
    sl.classList.remove('dragging');
  });
  
  sl.addEventListener('drop',(e)=>{
    e.preventDefault();
    sl.classList.remove('dragging');
    if(!draggedItem)return;
    handleDrop(draggedItem,{type:'inventory',index:index});
  });
}

// Handle drag and drop between slots
function handleDrop(draggedItem, target){
  if(draggedFrom === target.type && draggedItem.index === target.index)return;
  
  if(target.type === 'hotbar' && target.index === 0)return; // Can't drop on hand
  
  if(draggedFrom === 'hotbar' && target.type === 'hotbar'){
    // Hotbar to hotbar swap
    const temp=S.p.hotbar[target.index];
    S.p.hotbar[target.index]=S.p.hotbar[draggedItem.index];
    S.p.hotbar[draggedItem.index]=temp;
  } else if(draggedFrom === 'hotbar' && target.type === 'inventory'){
    // Hotbar to inventory
    moveFromHotbarToInventory(draggedItem.index);
  } else if(draggedFrom === 'inventory' && target.type === 'hotbar'){
    // Inventory to hotbar
    const bag=playerBag(S.p);
    const item=bag[draggedItem.index];
    if(item){
      S.p.hotbar[target.index]=item.em;
      bag.splice(draggedItem.index,1);
    }
  } else if(draggedFrom === 'inventory' && target.type === 'inventory'){
    // Inventory swap
    const bag=playerBag(S.p);
    const temp=bag[target.index];
    bag[target.index]=bag[draggedItem.index];
    bag[draggedItem.index]=temp;
  }
  
  updHotbar();
  updInv();
}

// Drop item menu
function dropItemMenu(){
  const hotbar=playerHotbar(S.p);
  const bag=playerBag(S.p);
  const items=[];
  
  // Collect items from hotbar (except hand slot)
  for(let i=1;i<hotbar.length;i++){
    const item=hotbar[i];
    if(item && item !== ''){
      const icons={'🪵':'Wood','🪨':'Stone','🌿':'Food','⚙️':'Metal','🪓':'Hatchet','⛏':'Pickaxe','🏹':'Bow','🩹':'Bandage','🕯':'Torch'};
      const itemName=icons[item]||'Item';
      items.push({type:'hotbar',index:i,name:itemName,em:item});
    }
  }
  
  // Collect items from inventory
  bag.forEach((item,i)=>{
    if(item){
      items.push({type:'inventory',index:i,name:item.name,em:item.em,c:item.c||1});
    }
  });
  
  if(items.length===0){
    glog('No items to drop!','warn');
    return;
  }
  
  // Simple drop: drop first available item
  const itemToDrop=items[0];
  const dropAmount=itemToDrop.c||1;
  
  if(itemToDrop.type==='hotbar'){
    // Remove from hotbar
    hotbar[itemToDrop.index]='';
    S.p.hotbar=hotbar;
    updHotbar();
    glog(`Dropped ${itemToDrop.em} from hotbar`,'');
  } else {
    // Remove from inventory
    bag.splice(itemToDrop.index,1);
    updInv();
    glog(`Dropped ${itemToDrop.em} from inventory`,'');
  }
  
  glog('Press Q again to drop more items','');
}

// Drop resource menu
function dropResourceMenu(){
  const res=playerRes(S.p);
  const resources=[];
  
  // Find available resources
  if(res.wood>0)resources.push({type:'wood',amount:res.wood,em:'🪵'});
  if(res.stone>0)resources.push({type:'stone',amount:res.stone,em:'🪨'});
  if(res.food>0)resources.push({type:'food',amount:res.food,em:'🌿'});
  if(res.metal>0)resources.push({type:'metal',amount:res.metal,em:'⚙️'});
  
  if(resources.length===0){
    glog('No resources to drop!','warn');
    return;
  }
  
  // Simple drop: drop first available resource
  const resource=resources[0];
  const dropAmount=Math.min(10, resource.amount); // Drop 10 at a time
  
  if(dropResources(S.p, resource.type, dropAmount)){
    glog(`Press D again to drop more ${resource.em}`,'');
  }
}
