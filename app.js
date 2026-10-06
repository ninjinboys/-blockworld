import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.180.0/+esm';

const $=id=>document.getElementById(id);
const game=$('game'),coordsEl=$('coords'),biomeEl=$('biome'),clockEl=$('clock'),weatherEl=$('weather'),hotbarEl=$('hotbar'),msgEl=$('message'),cover=$('startCover'),loading=$('loading'),crafting=$('crafting'),recipeList=$('recipeList'),craftInventory=$('craftInventory'),levelText=$('levelText'),xpText=$('xpText'),xpFill=$('xpFill'),blueprintText=$('blueprintText'),breakMeter=$('breakMeter'),breakLabel=$('breakLabel'),breakFill=$('breakFill');

const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;
game.appendChild(renderer.domElement);

const scene=new THREE.Scene();
scene.background=new THREE.Color(0x87b9e7);
scene.fog=new THREE.Fog(0x87b9e7,28,66);
const camera=new THREE.PerspectiveCamera(73,innerWidth/innerHeight,.05,120);

const hemi=new THREE.HemisphereLight(0xcbe9ff,0x5f7049,1.25);
scene.add(hemi);
const sun=new THREE.DirectionalLight(0xffefd0,2.0);
sun.castShadow=true;
sun.shadow.mapSize.set(1024,1024);
sun.shadow.camera.left=-26;sun.shadow.camera.right=26;sun.shadow.camera.top=26;sun.shadow.camera.bottom=-26;
scene.add(sun);

const sunBox=new THREE.Mesh(new THREE.BoxGeometry(2.1,2.1,.5),new THREE.MeshBasicMaterial({color:0xffef9f}));
const moonBox=new THREE.Mesh(new THREE.BoxGeometry(1.7,1.7,.5),new THREE.MeshBasicMaterial({color:0xe5edf5}));
scene.add(sunBox,moonBox);

const SIZE=68,HALF=SIZE>>1,HEIGHT=38,SEA=11;
const B={AIR:0,GRASS:1,DIRT:2,STONE:3,SAND:4,WATER:5,LOG:6,LEAF:7,COAL:8,IRON:9,GOLD:10,DIAMOND:11,SNOW:12,GRAVEL:13,CACTUS:14,PLANK:15,COBBLE:16,GLASS:17,BEDROCK:18};
const I={STICK:101,CRAFTING_TABLE:102,FURNACE:103,WOOD_PICK:104,STONE_PICK:105};
const names={1:'草',2:'土',3:'石',4:'砂',5:'水',6:'原木',7:'葉',8:'石炭鉱石',9:'鉄鉱石',10:'金鉱石',11:'ダイヤ鉱石',12:'雪',13:'砂利',14:'サボテン',15:'木材',16:'丸石',17:'ガラス',18:'岩盤',101:'棒',102:'作業台',103:'かまど',104:'木のツルハシ',105:'石のツルハシ'};
const biomeNames=['Plains','Forest','Desert','Taiga','Snowy Peaks','Swamp','Ocean','River'];
const buildable=[B.GRASS,B.DIRT,B.STONE,B.SAND,B.LOG,B.LEAF,B.COBBLE,B.PLANK,B.GLASS];
const inventory={[B.GRASS]:0,[B.DIRT]:0,[B.STONE]:0,[B.SAND]:0,[B.LOG]:0,[B.LEAF]:0,[B.COBBLE]:0,[B.PLANK]:0,[B.GLASS]:0,[B.COAL]:0,[B.IRON]:0,[B.GOLD]:0,[B.DIAMOND]:0,[I.STICK]:0,[I.CRAFTING_TABLE]:0,[I.FURNACE]:0,[I.WOOD_PICK]:0,[I.STONE_PICK]:0};
const hotbarSlots=Array(9).fill(null),acquiredOrder=[];
const itemColors={1:'#61a14b',2:'#845735',3:'#808487',4:'#d7c889',6:'#79532f',7:'#417b3b',8:'#454545',9:'#b78770',10:'#d6b33d',11:'#4ccbd2',15:'#ad7b46',16:'#686c6c',17:'#ccebee'};
const itemGlyphs={[I.STICK]:'棒',[I.CRAFTING_TABLE]:'台',[I.FURNACE]:'炉',[I.WOOD_PICK]:'木⛏',[I.STONE_PICK]:'石⛏'};
const recipes=[
  {name:'木材 ×4',out:B.PLANK,qty:4,needs:[[B.LOG,1]],unlockLevel:2},
  {name:'棒 ×4',out:I.STICK,qty:4,needs:[[B.PLANK,2]],unlockLevel:3},
  {name:'作業台',out:I.CRAFTING_TABLE,qty:1,needs:[[B.PLANK,4]],unlockLevel:4},
  {name:'木のツルハシ',out:I.WOOD_PICK,qty:1,needs:[[B.PLANK,3],[I.STICK,2]],unlockLevel:5},
  {name:'石のツルハシ',out:I.STONE_PICK,qty:1,needs:[[B.COBBLE,3],[I.STICK,2]],unlockLevel:6},
  {name:'かまど',out:I.FURNACE,qty:1,needs:[[B.COBBLE,8]],unlockLevel:7}
];
const blockXP={[B.GRASS]:1,[B.DIRT]:1,[B.SAND]:1,[B.LEAF]:1,[B.LOG]:4,[B.STONE]:3,[B.GRAVEL]:2,[B.COAL]:6,[B.IRON]:10,[B.GOLD]:14,[B.DIAMOND]:25,[B.CACTUS]:2};
const hardness={
  [B.GRASS]:0.55,[B.DIRT]:0.45,[B.SAND]:0.4,[B.LEAF]:0.22,[B.SNOW]:0.18,[B.GRAVEL]:0.75,[B.CACTUS]:0.65,
  [B.LOG]:1.55,[B.PLANK]:1.25,[B.GLASS]:0.3,
  [B.STONE]:3.0,[B.COBBLE]:3.4,[B.COAL]:3.5,[B.IRON]:4.2,[B.GOLD]:4.0,[B.DIAMOND]:5.0,
  [B.BEDROCK]:Infinity
};
const rockBlocks=new Set([B.STONE,B.COBBLE,B.COAL,B.IRON,B.GOLD,B.DIAMOND]);

let selected=null,seed=(Date.now()>>>0),weather='clear',started=false,craftOpen=false,level=1,xp=0,miningHeld=false,miningKey=null,miningElapsed=0,miningId=null;
let voxels=new Uint8Array(SIZE*HEIGHT*SIZE),surface=new Int16Array(SIZE*SIZE),biomes=new Uint8Array(SIZE*SIZE);

const inside=(x,y,z)=>x>=-HALF&&x<HALF&&z>=-HALF&&z<HALF&&y>=0&&y<HEIGHT;
const wi=(x,y,z)=>(y*SIZE+(z+HALF))*SIZE+(x+HALF);
const si=(x,z)=>(z+HALF)*SIZE+(x+HALF);
const get=(x,y,z)=>inside(x,y,z)?voxels[wi(x,y,z)]:B.AIR;
const set=(x,y,z,v)=>{if(inside(x,y,z))voxels[wi(x,y,z)]=v};
const solid=id=>id!==B.AIR&&id!==B.WATER;

function hash3(x,y,z,s=seed){let n=(x*374761393+y*668265263+z*2147483647+s*1274126177)|0;n=(n^(n>>>13))*1274126177;n^=n>>>16;return(n>>>0)/4294967295}
const hash2=(x,z,s=seed)=>hash3(x,0,z,s),fade=t=>t*t*(3-2*t),lerp=(a,b,t)=>a+(b-a)*t;
function noise2(x,z,o=0){const x0=Math.floor(x),z0=Math.floor(z),tx=x-x0,tz=z-z0,f=(dx,dz)=>hash2(x0+dx,z0+dz,seed+o)*2-1;return lerp(lerp(f(0,0),f(1,0),fade(tx)),lerp(f(0,1),f(1,1),fade(tx)),fade(tz))}
function fbm(x,z,o=0,n=4){let v=0,a=.5,f=1,t=0;for(let i=0;i<n;i++){v+=noise2(x*f,z*f,o+i*101)*a;t+=a;a*=.5;f*=2}return v/t}
function noise3(x,y,z,o=0){const x0=Math.floor(x),y0=Math.floor(y),z0=Math.floor(z),tx=fade(x-x0),ty=fade(y-y0),tz=fade(z-z0),q=(a,b,c)=>hash3(x0+a,y0+b,z0+c,seed+o)*2-1;const x00=lerp(q(0,0,0),q(1,0,0),tx),x10=lerp(q(0,1,0),q(1,1,0),tx),x01=lerp(q(0,0,1),q(1,0,1),tx),x11=lerp(q(0,1,1),q(1,1,1),tx);return lerp(lerp(x00,x10,ty),lerp(x01,x11,ty),tz)}
function terrainH(x,z){const c=fbm(x*.018,z*.018,11,4),h=fbm(x*.055,z*.055,91,4),r=1-Math.abs(fbm(x*.027,z*.027,181,3));let y=SEA+3+c*7+h*3;if(c>.1)y+=Math.max(0,r-.48)*16;if(c<-.22)y-=4+Math.abs(c)*6;return Math.max(3,Math.min(HEIGHT-7,Math.floor(y)))}
function chooseBiome(h,temp,moist,river){if(river)return 7;if(h<SEA-2)return 6;if(temp>.28&&moist<-.18)return 2;if(temp<-.32&&h>SEA+6)return 4;if(temp<-.18)return 3;if(moist>.38&&h<=SEA+2)return 5;if(moist>.1)return 1;return 0}

function addTree(x,z,b){const h=surface[si(x,z)];if(h<SEA||get(x,h,z)===B.SAND)return;const tall=b===3?5:4;for(let y=1;y<=tall;y++)set(x,h+y,z,B.LOG);for(let dx=-2;dx<=2;dx++)for(let dz=-2;dz<=2;dz++)for(let dy=tall-1;dy<=tall+2;dy++)if(Math.abs(dx)+Math.abs(dz)+(dy===tall+2?2:0)<=5&&get(x+dx,h+dy,z+dz)===B.AIR)set(x+dx,h+dy,z+dz,B.LEAF)}
function house(cx,cz){const y=surface[si(cx,cz)]+1,w=5,d=5;for(let x=cx-2;x<=cx+2;x++)for(let z=cz-2;z<=cz+2;z++){set(x,y-1,z,B.COBBLE);for(let yy=y;yy<y+4;yy++)if(x===cx-2||x===cx+2||z===cz-2||z===cz+2)set(x,yy,z,B.PLANK)}set(cx,y,cz+2,B.AIR);set(cx,y+1,cz+2,B.AIR);for(let x=cx-3;x<=cx+3;x++)for(let z=cz-3;z<=cz+3;z++)set(x,y+4,z,B.PLANK)}
function village(){for(let r=14;r<27;r+=4)for(let a=0;a<20;a++){const ang=a/20*Math.PI*2,x=Math.round(Math.cos(ang)*r),z=Math.round(Math.sin(ang)*r),bio=biomes[si(x,z)];if((bio===0||bio===1)&&surface[si(x,z)]>SEA){house(x,z);if(x+7<HALF-3)house(x+7,z+2);return}}}

function generate(){
  voxels.fill(0);
  for(let x=-HALF;x<HALF;x++)for(let z=-HALF;z<HALF;z++){
    let h=terrainH(x,z);
    const river=Math.abs(fbm(x*.035+20,z*.035-18,260,4))<.045&&h>SEA-2;
    if(river)h=Math.min(h,SEA-1);
    const temp=fbm(x*.018+80,z*.018-60,331,3)-h*.009,moist=fbm(x*.022-42,z*.022+51,441,3),bio=chooseBiome(h,temp,moist,river);
    surface[si(x,z)]=h;biomes[si(x,z)]=bio;
    for(let y=0;y<=h;y++){
      let id=y===0?B.BEDROCK:B.STONE;
      if(y>0){
        if(y>=h-3)id=(bio===2||bio===6||bio===7)?B.SAND:(bio===4&&y===h?B.SNOW:(y===h?B.GRASS:B.DIRT));
        if(y>2&&y<h-3){const c=noise3(x*.095,y*.12,z*.095,810)*.67+noise3(x*.19,y*.19,z*.19,1210)*.33;if(c>.54&&y<SEA+9)id=B.AIR}
        if(id===B.STONE){const r=hash3(x,y,z,seed+5100);if(y<7&&r>.986)id=B.DIAMOND;else if(y<13&&r>.974)id=B.GOLD;else if(y<23&&r>.955)id=B.IRON;else if(r>.932)id=B.COAL;else if(r<.018)id=B.GRAVEL}
      }
      set(x,y,z,id);
    }
    if(h<SEA)for(let y=h+1;y<=SEA;y++)set(x,y,z,B.WATER);
  }
  for(let x=-HALF+3;x<HALF-3;x++)for(let z=-HALF+3;z<HALF-3;z++){
    const b=biomes[si(x,z)],r=hash2(x,z,seed+780);
    if((b===1&&r>.93)||(b===3&&r>.915)||(b===0&&r>.982))addTree(x,z,b);
    if(b===2&&r>.986){const h=surface[si(x,z)],n=2+Math.floor(hash2(x,z,seed+900)*3);for(let y=1;y<=n;y++)set(x,h+y,z,B.CACTUS)}
  }
  village();
}

function tex(rgb,noise=.12,pattern=''){const c=document.createElement('canvas');c.width=c.height=16;const g=c.getContext('2d');for(let y=0;y<16;y++)for(let x=0;x<16;x++){const n=(hash3(x,y,pattern.length,12345)-.5)*noise*255;g.fillStyle=`rgb(${Math.max(0,Math.min(255,rgb[0]+n))|0},${Math.max(0,Math.min(255,rgb[1]+n))|0},${Math.max(0,Math.min(255,rgb[2]+n))|0})`;g.fillRect(x,y,1,1)}if(pattern==='grassSide'){g.fillStyle='#43883d';g.fillRect(0,0,16,4)}if(pattern==='log'){g.fillStyle='rgba(60,35,18,.3)';for(let x=2;x<16;x+=4)g.fillRect(x,0,1,16)}if(pattern.startsWith('ore')){const color=pattern==='oreC'?'#222':pattern==='oreI'?'#b78669':pattern==='oreG'?'#e4b935':'#43cad0';g.fillStyle=color;[[3,4],[11,3],[7,8],[13,11],[4,13]].forEach(([x,y])=>g.fillRect(x,y,2,2))}if(pattern==='plank'){g.fillStyle='rgba(70,43,20,.32)';for(let y=3;y<16;y+=4)g.fillRect(0,y,16,1)}if(pattern==='cobble'){g.strokeStyle='rgba(20,20,20,.28)';g.strokeRect(1.5,1.5,6,5);g.strokeRect(8.5,2.5,6,5);g.strokeRect(4.5,8.5,8,6)}const t=new THREE.CanvasTexture(c);t.magFilter=THREE.NearestFilter;t.minFilter=THREE.NearestFilter;t.colorSpace=THREE.SRGBColorSpace;return t}
const T={grass:tex([92,159,64],.15),grassSide:tex([121,88,52],.15,'grassSide'),dirt:tex([125,86,54],.16),stone:tex([124,126,128],.12),sand:tex([215,200,140],.08),log:tex([113,79,44],.14,'log'),leaf:tex([59,120,52],.19),coal:tex([119,121,122],.11,'oreC'),iron:tex([119,121,122],.11,'oreI'),gold:tex([119,121,122],.11,'oreG'),diamond:tex([119,121,122],.11,'oreD'),snow:tex([238,242,245],.03),gravel:tex([116,110,108],.18),cactus:tex([57,126,55],.1),plank:tex([167,120,70],.1,'plank'),cobble:tex([102,105,106],.16,'cobble'),bedrock:tex([55,57,58],.24)};
const L=t=>new THREE.MeshLambertMaterial({map:t});
const grassSide=L(T.grassSide),dirt=L(T.dirt),grass=L(T.grass),stone=L(T.stone),sand=L(T.sand),log=L(T.log);
const leaf=new THREE.MeshLambertMaterial({map:T.leaf,transparent:true,opacity:.92}),water=new THREE.MeshLambertMaterial({color:0x397bc6,transparent:true,opacity:.58,depthWrite:false}),glass=new THREE.MeshLambertMaterial({color:0xcce8ee,transparent:true,opacity:.32,depthWrite:false});
const M={[B.GRASS]:[grassSide,grassSide,grass,dirt,grassSide,grassSide],[B.DIRT]:dirt,[B.STONE]:stone,[B.SAND]:sand,[B.WATER]:water,[B.LOG]:log,[B.LEAF]:leaf,[B.COAL]:L(T.coal),[B.IRON]:L(T.iron),[B.GOLD]:L(T.gold),[B.DIAMOND]:L(T.diamond),[B.SNOW]:L(T.snow),[B.GRAVEL]:L(T.gravel),[B.CACTUS]:L(T.cactus),[B.PLANK]:L(T.plank),[B.COBBLE]:L(T.cobble),[B.GLASS]:glass,[B.BEDROCK]:L(T.bedrock)};
const box=new THREE.BoxGeometry(1,1,1);
let meshes=[],lookup=new Map();
function rebuild(){
  meshes.forEach(m=>scene.remove(m));meshes=[];lookup.clear();
  const groups={};Object.keys(M).forEach(k=>groups[k]=[]);
  const nb=[[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]];
  for(let y=0;y<HEIGHT;y++)for(let z=-HALF;z<HALF;z++)for(let x=-HALF;x<HALF;x++){
    const id=get(x,y,z);if(id===B.AIR)continue;let vis=false;
    for(const[dX,dY,dZ]of nb){const n=get(x+dX,y+dY,z+dZ);if(id===B.WATER?n!==B.WATER:n===B.AIR||n===B.WATER||n===B.GLASS){vis=true;break}}
    if(vis)groups[id].push({x,y,z});
  }
  const dummy=new THREE.Object3D();
  for(const key in groups){const id=+key,a=groups[id];if(!a.length)continue;const m=new THREE.InstancedMesh(box,M[id],a.length);m.userData.id=id;m.castShadow=id!==B.WATER&&id!==B.GLASS;m.receiveShadow=id!==B.WATER;a.forEach((p,i)=>{dummy.position.set(p.x,p.y,p.z);dummy.updateMatrix();m.setMatrixAt(i,dummy.matrix)});scene.add(m);meshes.push(m);lookup.set(m.uuid,a)}
}

const mobs=[];
function cube(g,sx,sy,sz,color,x,y,z){const m=new THREE.Mesh(new THREE.BoxGeometry(sx,sy,sz),new THREE.MeshLambertMaterial({color}));m.position.set(x,y,z);m.castShadow=true;g.add(m)}
function spawnMobs(){mobs.forEach(m=>scene.remove(m));mobs.length=0;for(let i=0;i<10;i++){const x=Math.floor(hash3(i,1,2,seed+71)*(SIZE-14))-HALF+7,z=Math.floor(hash3(i,3,4,seed+81)*(SIZE-14))-HALF+7;if(surface[si(x,z)]<=SEA||biomes[si(x,z)]===2)continue;const type=i%3,color=type===0?0xeeeeea:type===1?0xe8999f:0x7b5239,g=new THREE.Group();cube(g,1.15,.72,.65,color,0,.85,0);cube(g,.57,.57,.55,color,0,.95,-.56);for(const lx of[-.4,.4])for(const lz of[-.2,.2])cube(g,.16,.55,.16,type===0?0x444444:color,lx,.33,lz);g.position.set(x,surface[si(x,z)]+.05,z);g.userData={angle:hash2(x,z)*Math.PI*2,t:2+hash2(z,x)*3,speed:.25+hash2(x+4,z+2)*.28,hp:type===2?4:3,xp:type===2?18:type===1?14:12,name:type===0?'ヒツジ':type===1?'ブタ':'ウシ'};scene.add(g);mobs.push(g)}}

const clouds=[];
for(let i=0;i<10;i++){const g=new THREE.Group(),mat=new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.75,depthWrite:false});for(let j=0;j<3;j++){const m=new THREE.Mesh(new THREE.BoxGeometry(6+j*1.4,.55,3),mat);m.position.x=j*4;g.add(m)}g.position.set(-40+hash3(i,2,3,44)*80,25+hash3(i,3,4,55)*4,-35+hash3(i,4,5,66)*70);scene.add(g);clouds.push(g)}

const rainN=500,rainA=new Float32Array(rainN*3);
for(let i=0;i<rainN;i++){rainA[i*3]=(Math.random()-.5)*44;rainA[i*3+1]=5+Math.random()*28;rainA[i*3+2]=(Math.random()-.5)*44}
const rainG=new THREE.BufferGeometry();rainG.setAttribute('position',new THREE.BufferAttribute(rainA,3));
const rain=new THREE.Points(rainG,new THREE.PointsMaterial({color:0xb8d7f0,size:.09,transparent:true,opacity:.78}));
rain.visible=false;scene.add(rain);

const player={pos:new THREE.Vector3(),vel:new THREE.Vector3(),yaw:0,pitch:0,onGround:false},PR=.28,PH=1.78,EYE=1.62;
function blocked(px,py,pz){for(let x=Math.floor(px-PR);x<=Math.floor(px+PR);x++)for(let y=Math.floor(py);y<=Math.floor(py+PH-.05);y++)for(let z=Math.floor(pz-PR);z<=Math.floor(pz+PR);z++)if(solid(get(x,y,z)))return true;return false}
function spawn(){let best={x:0,z:0,d:1e9};for(let x=-10;x<=10;x++)for(let z=-10;z<=10;z++){const h=surface[si(x,z)],b=biomes[si(x,z)],d=x*x+z*z;if(h>SEA&&b!==2&&b!==6&&d<best.d)best={x,z,d}}player.pos.set(best.x+.5,surface[si(best.x,best.z)]+1.05,best.z+.5);player.vel.set(0,0,0)}

const ray=new THREE.Raycaster();ray.far=6;
function target(){ray.setFromCamera(new THREE.Vector2(0,0),camera);const h=ray.intersectObjects(meshes,false);return h.find(v=>v.object.userData.id!==B.WATER)||h[0]||null}
function flash(t){msgEl.textContent=t;msgEl.style.opacity=1;clearTimeout(flash.t);flash.t=setTimeout(()=>msgEl.style.opacity=0,1200)}
function xpNeeded(lv){return 12+lv*8}
function nextBlueprint(){return recipes.find(r=>r.unlockLevel>level)||null}
function updateProgress(){
  const need=xpNeeded(level),pct=Math.max(0,Math.min(100,xp/need*100));
  levelText.textContent='LV '+level;xpText.textContent=xp+' / '+need+' XP';xpFill.style.width=pct+'%';
  const next=nextBlueprint();blueprintText.textContent=next?'次の設計図：'+next.name.replace(/ ×\d+$/,'')+'（LV '+next.unlockLevel+'）':'全設計図を獲得済み';
}
function gainXP(amount,source=''){
  if(amount<=0)return;
  xp+=amount;let unlocked=[];
  while(xp>=xpNeeded(level)){
    xp-=xpNeeded(level);level++;
    const rs=recipes.filter(r=>r.unlockLevel===level);unlocked.push(...rs.map(r=>r.name.replace(/ ×\d+$/,'')));
  }
  updateProgress();
  if(unlocked.length)flash('LEVEL UP! LV '+level+'　設計図獲得：'+unlocked.join(' / '));
  else flash('+'+amount+' XP'+(source?'　'+source:''));
}
function toolSpeed(id){
  if(!rockBlocks.has(id))return 1;
  if((inventory[I.STONE_PICK]||0)>0)return 3.6;
  if((inventory[I.WOOD_PICK]||0)>0)return 2.2;
  return 1;
}
function canMineBlock(id,showMessage=true){
  const hasWood=(inventory[I.WOOD_PICK]||0)>0,hasStone=(inventory[I.STONE_PICK]||0)>0;
  if(id===B.BEDROCK){if(showMessage)flash('岩盤は壊せません');return false}
  if(id===B.WATER||id===B.AIR)return false;
  if(id===B.COAL&&!hasWood&&!hasStone){if(showMessage)flash('石炭にはツルハシが必要');return false}
  if([B.IRON,B.GOLD,B.DIAMOND].includes(id)&&!hasStone){if(showMessage)flash('この鉱石には石のツルハシが必要');return false}
  return true;
}
function normalizeHotbar(){
  for(let i=0;i<hotbarSlots.length;i++){
    const id=hotbarSlots[i];
    if(id!=null&&(inventory[id]||0)<=0)hotbarSlots[i]=null;
  }
  for(const id of acquiredOrder){
    if((inventory[id]||0)>0&&!hotbarSlots.includes(id)){
      const empty=hotbarSlots.indexOf(null);
      if(empty>=0)hotbarSlots[empty]=id;
    }
  }
  if(selected!=null&&(inventory[selected]||0)<=0)selected=null;
  if(selected==null)selected=hotbarSlots.find(id=>id!=null&&(inventory[id]||0)>0)??null;
}
function addItem(id,qty=1){
  if(qty<=0)return;
  inventory[id]=(inventory[id]||0)+qty;
  if(!acquiredOrder.includes(id))acquiredOrder.push(id);
  normalizeHotbar();
}
function removeItem(id,qty=1){
  inventory[id]=Math.max(0,(inventory[id]||0)-qty);
  normalizeHotbar();
}
function finishMine(x,y,z,id){
  if(get(x,y,z)!==id)return;
  set(x,y,z,B.AIR);
  let drop=id;
  if(id===B.STONE)drop=B.COBBLE;
  if(id===B.GRASS)drop=B.DIRT;
  if(buildable.includes(drop)||[B.COAL,B.IRON,B.GOLD,B.DIAMOND].includes(drop))addItem(drop,1);
  rebuild();renderHotbar();gainXP(blockXP[id]||1,names[id]||'採掘');
}
function clearMining(){
  miningKey=null;miningElapsed=0;miningId=null;
  breakFill.style.width='0%';breakMeter.classList.remove('active');
}
function startMining(){
  const h=target();if(!h){clearMining();return}
  const p=lookup.get(h.object.uuid)?.[h.instanceId];if(!p){clearMining();return}
  const id=get(p.x,p.y,p.z);if(!canMineBlock(id,true)){clearMining();return}
  miningKey=`${p.x},${p.y},${p.z}`;miningElapsed=0;miningId=id;
  breakLabel.textContent=(names[id]||'ブロック')+' 硬度 '+(Number.isFinite(hardness[id])?hardness[id].toFixed(1):'∞');
  breakFill.style.width='0%';breakMeter.classList.add('active');
}
function updateMining(dt){
  if(!miningHeld||craftOpen){clearMining();return}
  const h=target();if(!h){clearMining();return}
  const p=lookup.get(h.object.uuid)?.[h.instanceId];if(!p){clearMining();return}
  const id=get(p.x,p.y,p.z),key=`${p.x},${p.y},${p.z}`;
  if(!canMineBlock(id,false)){clearMining();return}
  if(key!==miningKey||id!==miningId){miningKey=key;miningElapsed=0;miningId=id}
  const need=(hardness[id]??1)/toolSpeed(id);
  miningElapsed+=dt;
  const pct=Math.max(0,Math.min(100,miningElapsed/need*100));
  breakLabel.textContent=(names[id]||'ブロック')+' '+Math.floor(pct)+'%';
  breakFill.style.width=pct+'%';breakMeter.classList.add('active');
  if(miningElapsed>=need){
    finishMine(p.x,p.y,p.z,id);
    miningElapsed=0;miningKey=null;miningId=null;
    breakFill.style.width='0%';
  }
}
function place(){const h=target();if(!h||!h.face)return;if(selected==null||(inventory[selected]||0)<=0){flash('置けるブロックを持っていません');return}if(!buildable.includes(selected)){flash((names[selected]||'このアイテム')+'は今は設置できません');return}const p=lookup.get(h.object.uuid)?.[h.instanceId];if(!p)return;const n=h.face.normal,x=p.x+Math.round(n.x),y=p.y+Math.round(n.y),z=p.z+Math.round(n.z);if(!inside(x,y,z)||get(x,y,z)!==B.AIR)return;set(x,y,z,selected);if(blocked(player.pos.x,player.pos.y,player.pos.z)){set(x,y,z,B.AIR);return}removeItem(selected,1);rebuild();renderHotbar();flash((names[selected]||'ブロック')+'を設置')}
function attackMob(){
  ray.setFromCamera(new THREE.Vector2(0,0),camera);
  const hits=ray.intersectObjects(mobs,true).filter(h=>h.distance<=4.5);
  if(!hits.length)return false;
  let root=hits[0].object;
  while(root.parent&&!mobs.includes(root))root=root.parent;
  if(!mobs.includes(root))return false;
  root.userData.hp--;
  if(root.userData.hp<=0){
    const earned=root.userData.xp||12,name=root.userData.name||'動物';
    scene.remove(root);const i=mobs.indexOf(root);if(i>=0)mobs.splice(i,1);
    gainXP(earned,name+'を倒した');
  }else flash((root.userData.name||'動物')+'に攻撃　HP '+root.userData.hp);
  return true;
}
function primaryActionStart(){
  if(attackMob()){miningHeld=false;clearMining();return}
  miningHeld=true;startMining();
}
function primaryActionStop(){miningHeld=false;clearMining()}

function renderHotbar(){
  normalizeHotbar();hotbarEl.innerHTML='';
  hotbarSlots.forEach((id,i)=>{
    const d=document.createElement('div'),count=id==null?0:(inventory[id]||0);
    d.className='slot'+(id!=null&&id===selected?' active':'');
    if(id==null){
      d.innerHTML=`<span class="key">${i+1}</span>`;
    }else{
      const visual=itemGlyphs[id]
        ? `<span class="item-glyph">${itemGlyphs[id]}</span>`
        : `<span class="swatch" style="background:${itemColors[id]||'#777'}"></span>`;
      d.innerHTML=`<span class="key">${i+1}</span>${visual}<span class="qty">${count}</span><span class="item-name">${names[id]||'ITEM'}</span>`;
      d.title=names[id]||'アイテム';
      d.addEventListener('pointerdown',e=>{e.stopPropagation();selected=id;renderHotbar()});
    }
    hotbarEl.appendChild(d);
  });
}

function hasNeeds(recipe){return recipe.needs.every(([id,n])=>(inventory[id]||0)>=n)}
function renderCrafting(){
  const ids=[B.LOG,B.PLANK,B.COBBLE,B.COAL,B.IRON,B.GOLD,B.DIAMOND,I.STICK,I.CRAFTING_TABLE,I.FURNACE,I.WOOD_PICK,I.STONE_PICK];
  const owned=ids.filter(id=>(inventory[id]||0)>0);craftInventory.innerHTML=owned.length?owned.map(id=>`<div class="inv-chip">${names[id]} <strong>${inventory[id]}</strong></div>`).join(''):'<div class="inv-chip">持ち物なし</div>';
  recipeList.innerHTML='';
  recipes.forEach((r,i)=>{
    const locked=level<r.unlockLevel,can=!locked&&hasNeeds(r);
    const d=document.createElement('div');d.className='recipe'+(locked?' locked':'');
    const needText=r.needs.map(([id,n])=>`${names[id]} ×${n}`).join(' ＋ ');
    d.innerHTML=`<div><div class="recipe-name">${locked?'🔒 ':''}${r.name}<span class="recipe-level">LV ${r.unlockLevel}</span></div><div class="recipe-needs">${locked?'設計図未取得':needText}</div></div><button ${can?'':'disabled'}>作る</button>`;
    d.querySelector('button').addEventListener('click',()=>craftRecipe(i));
    recipeList.appendChild(d);
  });
}
function craftRecipe(i){
  const r=recipes[i];
  if(level<r.unlockLevel){flash('LV '+r.unlockLevel+'で設計図を獲得');return}
  if(!hasNeeds(r)){flash('材料が足りません');return}
  r.needs.forEach(([id,n])=>removeItem(id,n));
  addItem(r.out,r.qty);
  renderHotbar();renderCrafting();flash(r.name+'をクラフト');
}
function setCraftOpen(v){
  craftOpen=v;crafting.classList.toggle('open',v);crafting.setAttribute('aria-hidden',String(!v));
  Object.keys(keys).forEach(k=>keys[k]=false);
  if(v){primaryActionStop();document.exitPointerLock?.();renderCrafting()}
  else if(started&&!matchMedia('(pointer:coarse)').matches){renderer.domElement.requestPointerLock?.()}
}

const keys={};
addEventListener('keydown',e=>{const k=e.key.toLowerCase();if(k==='c'&&started){e.preventDefault();setCraftOpen(!craftOpen);return}if(craftOpen)return;keys[k]=true;if(e.code==='Space'){e.preventDefault();jump()}if(/^[1-9]$/.test(e.key)){const id=hotbarSlots[+e.key-1];if(id!=null&&(inventory[id]||0)>0)selected=id;renderHotbar()}if(k==='r'){weather=weather==='clear'?'rain':'clear';rain.visible=weather==='rain';weatherEl.textContent=weather==='rain'?'Rain':'Clear'}});
addEventListener('keyup',e=>keys[e.key.toLowerCase()]=false);
function jump(){if(player.onGround){player.vel.y=7.3;player.onGround=false}}

renderer.domElement.addEventListener('click',()=>{if(!craftOpen&&!matchMedia('(pointer:coarse)').matches)renderer.domElement.requestPointerLock?.()});
addEventListener('mousemove',e=>{if(document.pointerLockElement===renderer.domElement){player.yaw-=e.movementX*.0022;player.pitch-=e.movementY*.0022;player.pitch=Math.max(-1.48,Math.min(1.48,player.pitch))}});
renderer.domElement.addEventListener('mousedown',e=>{if(!started||craftOpen)return;if(e.button===0&&document.pointerLockElement===renderer.domElement)primaryActionStart();if(e.button===2)place()});
addEventListener('mouseup',e=>{if(e.button===0)primaryActionStop()});
renderer.domElement.addEventListener('contextmenu',e=>e.preventDefault());

let touchLook=null;
renderer.domElement.addEventListener('pointerdown',e=>{if(craftOpen)return;if(e.pointerType==='touch'&&e.clientX>innerWidth*.35)touchLook={x:e.clientX,y:e.clientY}});
renderer.domElement.addEventListener('pointermove',e=>{if(touchLook&&e.pointerType==='touch'){const dx=e.clientX-touchLook.x,dy=e.clientY-touchLook.y;player.yaw-=dx*.006;player.pitch=Math.max(-1.48,Math.min(1.48,player.pitch-dy*.006));touchLook={x:e.clientX,y:e.clientY}}});
renderer.domElement.addEventListener('pointerup',()=>touchLook=null);

function hold(q,k){const b=document.querySelector(q),on=e=>{e.preventDefault();keys[k]=true},off=e=>{e.preventDefault();keys[k]=false};b.addEventListener('pointerdown',on);['pointerup','pointercancel','pointerleave'].forEach(t=>b.addEventListener(t,off))}
hold('.pad .up','w');hold('.pad .down','s');hold('.pad .left','a');hold('.pad .right','d');
document.querySelector('.jump').addEventListener('pointerdown',e=>{e.preventDefault();jump()});
$('tapMine').addEventListener('pointerdown',e=>{e.preventDefault();primaryActionStart()});
['pointerup','pointercancel','pointerleave'].forEach(t=>$('tapMine').addEventListener(t,e=>{e.preventDefault();primaryActionStop()}));
$('tapPlace').addEventListener('pointerdown',e=>{e.preventDefault();place()});
$('tapCraft').addEventListener('pointerdown',e=>{e.preventDefault();setCraftOpen(true)});
$('craftClose').addEventListener('click',()=>setCraftOpen(false));
crafting.addEventListener('pointerdown',e=>{if(e.target===crafting)setCraftOpen(false)});

let last=performance.now(),dayTime=.24;
const forward=new THREE.Vector3(),right=new THREE.Vector3(),move=new THREE.Vector3();
function loop(now){
  const dt=Math.min(.035,(now-last)/1000);last=now;
  if(started&&!craftOpen){
    updateMining(dt);
    dayTime=(dayTime+dt/210)%1;
    const sy=Math.sin(player.yaw),cy=Math.cos(player.yaw);forward.set(-sy,0,-cy);right.set(cy,0,-sy);move.set(0,0,0);
    if(keys.w||keys.arrowup)move.add(forward);if(keys.s||keys.arrowdown)move.sub(forward);if(keys.d||keys.arrowright)move.add(right);if(keys.a||keys.arrowleft)move.sub(right);
    if(move.lengthSq())move.normalize().multiplyScalar(4.5);
    player.vel.x+=(move.x-player.vel.x)*Math.min(1,dt*11);player.vel.z+=(move.z-player.vel.z)*Math.min(1,dt*11);player.vel.y-=18*dt;
    let nx=player.pos.x+player.vel.x*dt;if(!blocked(nx,player.pos.y,player.pos.z))player.pos.x=nx;else player.vel.x=0;
    let nz=player.pos.z+player.vel.z*dt;if(!blocked(player.pos.x,player.pos.y,nz))player.pos.z=nz;else player.vel.z=0;
    let ny=player.pos.y+player.vel.y*dt;if(!blocked(player.pos.x,ny,player.pos.z)){player.pos.y=ny;player.onGround=false}else{if(player.vel.y<0)player.onGround=true;player.vel.y=0}
    if(player.pos.y<-5||Math.abs(player.pos.x)>HALF+3||Math.abs(player.pos.z)>HALF+3)spawn();
    camera.position.set(player.pos.x,player.pos.y+EYE,player.pos.z);camera.rotation.order='YXZ';camera.rotation.y=player.yaw;camera.rotation.x=player.pitch;

    const ang=dayTime*Math.PI*2-Math.PI/2,day=Math.max(0,Math.sin(ang));
    sunBox.position.set(Math.cos(ang)*48,Math.sin(ang)*48,13);moonBox.position.set(-Math.cos(ang)*48,-Math.sin(ang)*48,-13);sun.position.copy(sunBox.position);
    sun.intensity=.14+2.2*day;hemi.intensity=.25+1.15*day;
    const sky=new THREE.Color().setHSL(.57,.48,.08+.56*day);scene.background.copy(sky);scene.fog.color.copy(sky);
    clouds.forEach((c,i)=>{c.position.x+=dt*(.5+i*.01);if(c.position.x>50)c.position.x=-50});

    if(weather==='rain'){const a=rain.geometry.attributes.position.array;for(let i=0;i<rainN;i++){a[i*3+1]-=dt*19;if(a[i*3+1]<0){a[i*3+1]=25+Math.random()*9;a[i*3]=(Math.random()-.5)*44;a[i*3+2]=(Math.random()-.5)*44}}rain.position.set(player.pos.x,0,player.pos.z);rain.geometry.attributes.position.needsUpdate=true}

    mobs.forEach((m,i)=>{m.userData.t-=dt;if(m.userData.t<=0){m.userData.t=1.5+hash3(i,Math.floor(now/1000),3,seed)*3;m.userData.angle+=(hash3(i,4,Math.floor(now/900),seed)-.5)*2.4}const x=m.position.x+Math.sin(m.userData.angle)*m.userData.speed*dt,z=m.position.z+Math.cos(m.userData.angle)*m.userData.speed*dt,ix=Math.round(x),iz=Math.round(z);if(ix>-HALF+2&&ix<HALF-2&&iz>-HALF+2&&iz<HALF-2&&surface[si(ix,iz)]>SEA){m.position.x=x;m.position.z=z;m.position.y=surface[si(ix,iz)]+.05;m.rotation.y=m.userData.angle}});

    const bx=Math.max(-HALF,Math.min(HALF-1,Math.floor(player.pos.x))),bz=Math.max(-HALF,Math.min(HALF-1,Math.floor(player.pos.z)));
    coordsEl.textContent=`X ${bx} Y ${Math.floor(player.pos.y)} Z ${bz}`;biomeEl.textContent=biomeNames[biomes[si(bx,bz)]]||'Unknown';
    const mins=Math.floor(dayTime*1440),hh=String(Math.floor(mins/60)%24).padStart(2,'0'),mm=String(mins%60).padStart(2,'0');clockEl.textContent=(day>.2?'☀':'☾')+' '+hh+':'+mm;
    const eye=get(Math.floor(player.pos.x),Math.floor(player.pos.y+EYE),Math.floor(player.pos.z));scene.fog.near=eye===B.WATER?1:28;scene.fog.far=eye===B.WATER?14:66;
  }
  renderer.render(scene,camera);
  requestAnimationFrame(loop);
}

function resize(){renderer.setSize(innerWidth,innerHeight,false);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix()}
addEventListener('resize',resize);resize();

async function init(){loading.textContent='地形生成中...';await new Promise(r=>setTimeout(r,40));generate();loading.textContent='ブロック描画中...';await new Promise(r=>setTimeout(r,40));rebuild();spawnMobs();spawn();renderHotbar();updateProgress();loading.textContent='準備完了'}
await init();
$('startBtn').addEventListener('click',()=>{started=true;cover.style.display='none';if(!matchMedia('(pointer:coarse)').matches)renderer.domElement.requestPointerLock?.()});
requestAnimationFrame(loop);
