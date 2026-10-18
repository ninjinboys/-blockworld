/* Deterministic NEXACRAFT villages. Generated from the world seed and terrain,
 * using only existing block IDs. Site placement and buildings do not write
 * player edits: saved edits are applied after the village pass.
 */
export function createVillageSystem({seed,surfaceAt,biomeAt,B,SEA,WORLD_TOP,CHUNK,Y_MIN,cIndex,chunkCoord,canPlaceVillage=()=>true,canPlaceFurniture=()=>true}){
 const CELL=128,RADIUS=19,CACHE_LIMIT=190,sites=new Map();
 function hash(a,b,salt=0){
   let x=Math.imul((a|0)^seed,0x9e3779b1)^Math.imul((b|0)+salt,0x85ebca77);
   x=Math.imul(x^(x>>>16),0x7feb352d);
   x=Math.imul(x^(x>>>15),0x846ca68b);
   return ((x^(x>>>16))>>>0)/4294967296;
 }
 function site(cx,cz){
   const key=cx+','+cz;if(sites.has(key))return sites.get(key);
   let found=null;
   // Site attempts are deterministic, independently computed for every cell.
   for(let i=0;i<17;i++){
     const x=cx*CELL+20+Math.floor(hash(cx*31+i,cz*41+1,11)*88);
     const z=cz*CELL+20+Math.floor(hash(cx*37,cz*29+i,17)*88);
     const biome=biomeAt(x,z),y=surfaceAt(x,z);
     if(![0,1,3].includes(biome)||y<=SEA+3||y>WORLD_TOP-10)continue;
     const heights=[];
     let dry=true;
     for(const [dx,dz] of [[0,0],[-15,-15],[15,-15],[-15,15],[15,15],
                             [0,16],[0,-16],[16,0],[-16,0]]){
       const sx=x+dx,sz=z+dz,h=surfaceAt(sx,sz),b=biomeAt(sx,sz);
       if(h<=SEA+2||b===2||b===6||b===7){dry=false;break}
       heights.push(h);
     }
     if(!dry||Math.max(...heights)-Math.min(...heights)>3)continue;
     const base=Math.round(heights.reduce((a,b)=>a+b,0)/heights.length);
     // Reserve the central radius for villages, but keep the player's initial
     // world spawn free of a newly created village.
     if(Math.hypot(x,z)<38||!canPlaceVillage(x,z,RADIUS))continue;
     found={key,cellX:cx,cellZ:cz,x,z,y:base,radius:RADIUS,
       name:'村',village:true};
     break;
   }
   sites.set(key,found);
   if(sites.size>CACHE_LIMIT)sites.delete(sites.keys().next().value);
   return found;
 }
 function nearby(x,z,r=0){
   const range=r+RADIUS+5;
   const x0=Math.floor((x-range)/CELL),x1=Math.floor((x+range)/CELL);
   const z0=Math.floor((z-range)/CELL),z1=Math.floor((z+range)/CELL);
   const out=[];
   for(let gx=x0;gx<=x1;gx++)for(let gz=z0;gz<=z1;gz++){
     const v=site(gx,gz);
     if(v&&Math.hypot(v.x-x,v.z-z)<=range)out.push(v);
   }
   return out;
 }
 // Villages always have at least two loot chests; other homes get one
 // by a deterministic seeded roll. Retrofit beds and treasure into existing
 // village homes as explicitly requested, regardless of visit history.
 function houseFurniture(site,offsetX,offsetZ,index){
   const hx=site.x+offsetX,hz=site.z+offsetZ;
   const face=offsetZ<0?1:-1;
   // House 0 and house 2 already had chests before this update. Keep both
   // rather than deleting one due to a new random roll.
   return {fresh:true,hasChest:index===0||index===2||
       hash(site.cellX*19+index,site.cellZ*23+index,9153)>.43,
     chest:{x:hx+2,y:site.y+1,z:hz+face}};
 }
 function lootChestAt(x,y,z){
   for(const site of nearby(x,z,5)){
     for(const [i,[ox,oz]] of [[-11,-11],[11,-11],[-11,11],[11,11]].entries()){
       const f=houseFurniture(site,ox,oz,i);
       if(f.hasChest&&f.chest.x===x&&f.chest.y===y&&f.chest.z===z)
         return {siteKey:site.key,house:i,houseX:site.x+ox,houseZ:site.z+oz};
     }
   }
   return null;
 }
 function decorate(data,cx,cz){
   const x0=cx*CHUNK,z0=cz*CHUNK;
   const radius=RADIUS+CHUNK;
   const relevant=nearby(x0+(CHUNK-1)/2,z0+(CHUNK-1)/2,radius);
   if(!relevant.length)return;
   function put(x,y,z,id){
     if(!Number.isInteger(y)||y<Y_MIN||y>WORLD_TOP)return;
     if(chunkCoord(x)!==cx||chunkCoord(z)!==cz)return;
     data[cIndex(x-x0,y,z-z0)]=id;
   }
   function prep(v){
     const vx=v.x,vz=v.z,h=v.y;
     const minX=Math.max(x0,vx-RADIUS),maxX=Math.min(x0+CHUNK-1,vx+RADIUS);
     const minZ=Math.max(z0,vz-RADIUS),maxZ=Math.min(z0+CHUNK-1,vz+RADIUS);
     if(minX>maxX||minZ>maxZ)return;
     for(let x=minX;x<=maxX;x++)for(let z=minZ;z<=maxZ;z++){
       const dx=Math.abs(x-vx),dz=Math.abs(z-vz);
       // Village clearing, foundation and paths. Avoid flattening beyond
       // the village area, preserving existing forests and caves around it.
       if(dx>17||dz>17)continue;
       const ground=surfaceAt(x,z);
       // Leave the outer corner terrain intact except within housing plots.
       const houseZone=(Math.abs(dx-11)<=4&&Math.abs(dz-11)<=4);
       const path=dx<=1||dz<=1||(dx<=2&&dz<=16)||(dz<=2&&dx<=16);
       const plaza=dx<=3&&dz<=3;
       if(!houseZone&&!path&&!plaza)continue;
       if(Math.abs(ground-h)>3)continue;
       const floor=houseZone?B.COBBLE:path?B.GRAVEL:B.COBBLE;
       for(let y=Math.min(ground,h-3);y<=h;y++)put(x,y,z,y===h?floor:B.DIRT);
       for(let y=h+1;y<=Math.min(h+9,WORLD_TOP);y++)put(x,y,z,B.AIR);
     }
   }
   function house(v,offsetX,offsetZ,variant){
     const hx=v.x+offsetX,hz=v.z+offsetZ,h=v.y;
     const face=offsetZ<0?1:-1,frontZ=hz+face*3;
     // Four houses with individual trim and roof variants.
     const wall=(variant%2===0)?B.PLANK:B.COBBLE;
     const roof=(variant%2===0)?B.COBBLE:B.PLANK;
     for(let dx=-3;dx<=3;dx++)for(let dz=-3;dz<=3;dz++){
       const x=hx+dx,z=hz+dz,border=Math.abs(dx)===3||Math.abs(dz)===3;
       put(x,h,z,B.PLANK);
       for(let y=h+1;y<=h+3;y++){
         const isWindow=(y===h+2&&((Math.abs(dx)===3&&dz===0)||
             (Math.abs(dz)===3&&Math.abs(dx)===2)));
         put(x,y,z,border?(isWindow?B.GLASS:wall):B.AIR);
       }
       put(x,h+4,z,roof);
     }
     // A stepped gable roof and squared beams.
     for(let x=hx-4;x<=hx+4;x++)for(let z=hz-4;z<=hz+4;z++){
       const edge=Math.max(Math.abs(x-hx),Math.abs(z-hz));
       if(edge===4)put(x,h+4,z,roof);
       if(edge<=2)put(x,h+5,z,roof);
       if(edge<=1&&variant%2===0)put(x,h+6,z,B.PLANK);
     }
     for(const sx of [-3,3])for(const sz of [-3,3])
       for(let y=h+1;y<=h+3;y++)put(hx+sx,y,hz+sz,B.LOG);
     // Facades lie in the X axis (fixed Z), so the CLOSED panels must lie
     // along X too. DOOR_Z made each village door stick sideways into the
     // doorway instead of closing it; use the same DOOR_X type as a player door.
     put(hx,h+1,frontZ,B.DOOR_X);put(hx,h+2,frontZ,B.DOOR_X_TOP);
     const backZ=hz-face*1;
     put(hx-2,h+1,backZ,B.CRAFTING_TABLE);
     put(hx+2,h+1,backZ,B.FURNACE);
     const furniture=houseFurniture(v,offsetX,offsetZ,variant);
     // Two-block bed with headboard at the back, walking clearance at
     // the front and no overlap with workbench, furnace or doorway.
     // Saved player edits are still applied last by the chunk generator.
     put(hx-1,h+1,hz-face,B.BED);
     put(hx-1,h+1,hz-face*2,B.BED_HEAD);
     if(furniture.hasChest)
       put(furniture.chest.x,furniture.chest.y,furniture.chest.z,B.CHEST);
     // Short porch connects each front door to the village's main path.
     for(let q=4;q<=10;q++){
       const px=hx,pz=hz+face*q;
       const ground=surfaceAt(px,pz);
       if(Math.abs(ground-h)>3)continue;
       for(let y=Math.min(ground,h-3);y<=h;y++)put(px,y,pz,y===h?B.GRAVEL:B.DIRT);
       for(let y=h+1;y<=h+3;y++)put(px,y,pz,B.AIR);
     }
   }
   function well(v){
     const x=v.x,z=v.z,h=v.y;
     for(let dx=-2;dx<=2;dx++)for(let dz=-2;dz<=2;dz++){
       const edge=Math.max(Math.abs(dx),Math.abs(dz));
       put(x+dx,h,z+dz,edge===2?B.COBBLE:B.PLANK);
       if(edge===1)put(x+dx,h+1,z+dz,B.COBBLE);
     }
     put(x,h+1,z,B.WATER);
     for(const dx of [-1,1])for(const dz of [-1,1]){
       for(let y=h+2;y<=h+4;y++)put(x+dx,y,z+dz,B.LOG);
     }
     for(let dx=-2;dx<=2;dx++)for(let dz=-2;dz<=2;dz++)
       put(x+dx,h+5,z+dz,B.PLANK);
     put(x,h+6,z,B.COBBLE);
   }
   for(const v of relevant){
     // Village decorations are derived solely from seed+terrain and do not
     // mutate the editable world. Chunk boundaries join without seams.
     prep(v);
     for(const [i,[x,z]] of [[-11,-11],[11,-11],[-11,11],[11,11]].entries())
       house(v,x,z,i);
     well(v);
   }
 }
 return {site,nearby,decorate,lootChestAt};
}
