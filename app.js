import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.180.0/+esm';
import {createBlockworldNetwork} from './multiplayer-network.js?v=20261009multi1';

const $=id=>document.getElementById(id);
const game=$('game'),coordsEl=$('coords'),biomeEl=$('biome'),clockEl=$('clock'),weatherEl=$('weather'),hotbarEl=$('hotbar'),msgEl=$('message'),cover=$('startCover'),loading=$('loading'),crafting=$('crafting'),recipeList=$('recipeList'),craftInventory=$('craftInventory'),levelText=$('levelText'),xpText=$('xpText'),xpFill=$('xpFill'),blueprintText=$('blueprintText'),breakMeter=$('breakMeter'),breakLabel=$('breakLabel'),breakFill=$('breakFill'),heartsEl=$('hearts'),deathScreen=$('deathScreen'),respawnBtn=$('respawnBtn');
const authCover=$('authCover'),authForm=$('authForm'),authName=$('authName'),authPassword=$('authPassword'),authSubmit=$('authSubmit'),authError=$('authError'),authModeText=$('authModeText'),showLogin=$('showLogin'),showCreate=$('showCreate'),accountNameEl=$('accountName'),saveStatusEl=$('saveStatus'),saveNowBtn=$('saveNow'),logoutBtn=$('logoutBtn');
const menuCover=$('menuCover'),menuAccountName=$('menuAccountName'),singlePlayBtn=$('singlePlayBtn'),menuLogout=$('menuLogout'),worldBack=$('worldBack');
const worldCover=$('worldCover'),worldGrid=$('worldGrid'),worldAccountName=$('worldAccountName'),worldLogout=$('worldLogout'),worldListBtn=$('worldListBtn'),accountBox=$('accountBox');
const inventoryScreen=$('inventoryScreen'),inventoryMainGrid=$('inventoryMainGrid'),inventoryHotbarGrid=$('inventoryHotbarGrid'),inventoryClose=$('inventoryClose'),inventoryDetail=$('inventoryDetail'),inventoryDetailIcon=$('inventoryDetailIcon'),inventoryDetailName=$('inventoryDetailName'),inventoryDetailQty=$('inventoryDetailQty'),inventoryMove=$('inventoryMove'),inventorySplit=$('inventorySplit'),inventoryDrop=$('inventoryDrop');

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

const CHUNK=16,RENDER_RADIUS=3,Y_MIN=-80,WORLD_TOP=47,HEIGHT=WORLD_TOP-Y_MIN+1,SEA=11;
// Terrain height uses the old 48-block world cap so existing landscapes stay unchanged.
const TERRAIN_HEIGHT=48;
const B={AIR:0,GRASS:1,DIRT:2,STONE:3,SAND:4,WATER:5,LOG:6,LEAF:7,COAL:8,IRON:9,GOLD:10,DIAMOND:11,SNOW:12,GRAVEL:13,CACTUS:14,PLANK:15,COBBLE:16,GLASS:17,BEDROCK:18,CRAFTING_TABLE:19,FURNACE:20,BED:21,BED_HEAD:22};
const I={
  STICK:101,CRAFTING_TABLE:102,FURNACE:103,WOOD_PICK:104,STONE_PICK:105,
  RAW_IRON:106,RAW_GOLD:107,IRON_INGOT:108,GOLD_INGOT:109,DIAMOND:110,
  STONE_SWORD:111,STONE_AXE:112,STONE_SHOVEL:113,
  IRON_PICK:114,IRON_SWORD:115,IRON_AXE:116,IRON_SHOVEL:117,
  GOLD_PICK:118,GOLD_SWORD:119,GOLD_AXE:120,GOLD_SHOVEL:121,
  DIAMOND_PICK:122,DIAMOND_SWORD:123,DIAMOND_AXE:124,DIAMOND_SHOVEL:125,
  IRON_HELMET:126,IRON_CHEST:127,IRON_LEGS:128,IRON_BOOTS:129,
  GOLD_HELMET:130,GOLD_CHEST:131,GOLD_LEGS:132,GOLD_BOOTS:133,
  DIAMOND_HELMET:134,DIAMOND_CHEST:135,DIAMOND_LEGS:136,DIAMOND_BOOTS:137,
  WOOD_AXE:138,
  WOOL:139,RAW_PORK:140,RAW_BEEF:141,LEATHER:142,BED:143,
  COOKED_PORK:144,COOKED_BEEF:145
};
const names={
  1:'草',2:'土',3:'石',4:'砂',5:'水',6:'原木',7:'葉',8:'石炭',9:'鉄鉱石',10:'金鉱石',11:'ダイヤ鉱石',12:'雪',13:'砂利',14:'サボテン',15:'木材',16:'丸石',17:'ガラス',18:'岩盤',19:'作業台',20:'かまど',
  101:'棒',102:'作業台',103:'かまど',104:'木のツルハシ',105:'石のツルハシ',
  106:'鉄の原石',107:'金の原石',108:'鉄インゴット',109:'金インゴット',110:'ダイヤモンド',
  111:'石の剣',112:'石の斧',113:'石のシャベル',
  114:'鉄のツルハシ',115:'鉄の剣',116:'鉄の斧',117:'鉄のシャベル',
  118:'金のツルハシ',119:'金の剣',120:'金の斧',121:'金のシャベル',
  122:'ダイヤのツルハシ',123:'ダイヤの剣',124:'ダイヤの斧',125:'ダイヤのシャベル',
  126:'鉄のヘルメット',127:'鉄のチェストプレート',128:'鉄のレギンス',129:'鉄のブーツ',
  130:'金のヘルメット',131:'金のチェストプレート',132:'金のレギンス',133:'金のブーツ',
  134:'ダイヤのヘルメット',135:'ダイヤのチェストプレート',136:'ダイヤのレギンス',137:'ダイヤのブーツ',
  138:'木の斧',
  139:'羊毛',140:'生の豚肉',141:'生の牛肉',142:'革',143:'ベッド',
  144:'焼き豚肉',145:'ステーキ',
  21:'ベッド',22:'ベッド'
};
const biomeNames=['Plains','Forest','Desert','Taiga','Snowy Peaks','Swamp','Ocean','River'];
const buildable=[B.GRASS,B.DIRT,B.STONE,B.SAND,B.LOG,B.LEAF,B.COBBLE,B.PLANK,B.GLASS,B.SNOW,B.GRAVEL,B.CACTUS];
const placeableItemToBlock={[I.CRAFTING_TABLE]:B.CRAFTING_TABLE,[I.FURNACE]:B.FURNACE,[I.BED]:B.BED};
const specialBlockDrops={[B.CRAFTING_TABLE]:I.CRAFTING_TABLE,[B.FURNACE]:I.FURNACE,[B.BED]:I.BED,[B.BED_HEAD]:I.BED};
const inventory={
  [B.GRASS]:0,[B.DIRT]:0,[B.STONE]:0,[B.SAND]:0,[B.LOG]:0,[B.LEAF]:0,[B.COBBLE]:0,[B.PLANK]:0,[B.GLASS]:0,[B.COAL]:0,[B.SNOW]:0,[B.GRAVEL]:0,[B.CACTUS]:0,
  [I.STICK]:0,[I.CRAFTING_TABLE]:0,[I.FURNACE]:0,[I.WOOD_PICK]:0,[I.STONE_PICK]:0,
  [I.RAW_IRON]:0,[I.RAW_GOLD]:0,[I.IRON_INGOT]:0,[I.GOLD_INGOT]:0,[I.DIAMOND]:0,
  [I.STONE_SWORD]:0,[I.STONE_AXE]:0,[I.STONE_SHOVEL]:0,
  [I.IRON_PICK]:0,[I.IRON_SWORD]:0,[I.IRON_AXE]:0,[I.IRON_SHOVEL]:0,
  [I.GOLD_PICK]:0,[I.GOLD_SWORD]:0,[I.GOLD_AXE]:0,[I.GOLD_SHOVEL]:0,
  [I.DIAMOND_PICK]:0,[I.DIAMOND_SWORD]:0,[I.DIAMOND_AXE]:0,[I.DIAMOND_SHOVEL]:0,
  [I.IRON_HELMET]:0,[I.IRON_CHEST]:0,[I.IRON_LEGS]:0,[I.IRON_BOOTS]:0,
  [I.GOLD_HELMET]:0,[I.GOLD_CHEST]:0,[I.GOLD_LEGS]:0,[I.GOLD_BOOTS]:0,
  [I.DIAMOND_HELMET]:0,[I.DIAMOND_CHEST]:0,[I.DIAMOND_LEGS]:0,[I.DIAMOND_BOOTS]:0,
  [I.WOOD_AXE]:0,
  [I.WOOL]:0,[I.RAW_PORK]:0,[I.RAW_BEEF]:0,[I.LEATHER]:0,[I.BED]:0,
  [I.COOKED_PORK]:0,[I.COOKED_BEEF]:0
};
const hotbarSlots=Array(9).fill(null),acquiredOrder=[];
const inventorySlots=Array(36).fill(null);
let selectedHotbarIndex=0,inventorySelectedSlot=null,inventoryOpen=false;
const itemColors={1:'#61a14b',2:'#845735',3:'#808487',4:'#d7c889',6:'#79532f',7:'#417b3b',8:'#454545',9:'#b78770',10:'#d6b33d',11:'#4ccbd2',15:'#ad7b46',16:'#686c6c',17:'#ccebee'};
const itemGlyphs={
  [I.STICK]:'棒',[I.CRAFTING_TABLE]:'台',[I.FURNACE]:'炉',[I.WOOD_PICK]:'木⛏',[I.STONE_PICK]:'石⛏',
  [I.RAW_IRON]:'鉄原',[I.RAW_GOLD]:'金原',[I.IRON_INGOT]:'鉄',[I.GOLD_INGOT]:'金',[I.DIAMOND]:'◆',
  [I.STONE_SWORD]:'石剣',[I.STONE_AXE]:'石斧',[I.STONE_SHOVEL]:'石掘',
  [I.IRON_PICK]:'鉄⛏',[I.IRON_SWORD]:'鉄剣',[I.IRON_AXE]:'鉄斧',[I.IRON_SHOVEL]:'鉄掘',
  [I.GOLD_PICK]:'金⛏',[I.GOLD_SWORD]:'金剣',[I.GOLD_AXE]:'金斧',[I.GOLD_SHOVEL]:'金掘',
  [I.DIAMOND_PICK]:'ダ⛏',[I.DIAMOND_SWORD]:'ダ剣',[I.DIAMOND_AXE]:'ダ斧',[I.DIAMOND_SHOVEL]:'ダ掘',
  [I.IRON_HELMET]:'鉄頭',[I.IRON_CHEST]:'鉄胴',[I.IRON_LEGS]:'鉄脚',[I.IRON_BOOTS]:'鉄靴',
  [I.GOLD_HELMET]:'金頭',[I.GOLD_CHEST]:'金胴',[I.GOLD_LEGS]:'金脚',[I.GOLD_BOOTS]:'金靴',
  [I.DIAMOND_HELMET]:'ダ頭',[I.DIAMOND_CHEST]:'ダ胴',[I.DIAMOND_LEGS]:'ダ脚',[I.DIAMOND_BOOTS]:'ダ靴',
  [I.WOOD_AXE]:'木斧',
  [I.WOOL]:'羊',[I.RAW_PORK]:'豚',[I.RAW_BEEF]:'牛',[I.LEATHER]:'革',[I.BED]:'床',
  [I.COOKED_PORK]:'焼豚',[I.COOKED_BEEF]:'焼牛'
};

const ICON_MAT={
  wood:{main:'#9a6335',light:'#c58a50',dark:'#624021'},
  stone:{main:'#8b9096',light:'#b8bdc2',dark:'#555b60'},
  iron:{main:'#c8d0d7',light:'#f0f4f6',dark:'#7b858d'},
  gold:{main:'#e0b52e',light:'#ffe16a',dark:'#9d7613'},
  diamond:{main:'#43d7df',light:'#9affff',dark:'#168891'}
};
function itemCanvas(id,cls='item-icon'){
  const c=document.createElement('canvas');
  c.width=16;c.height=16;c.className=cls;
  const g=c.getContext('2d');g.imageSmoothingEnabled=false;
  drawItemIcon(g,id);
  return c;
}
function ir(g,x,y,w,h,color){g.fillStyle=color;g.fillRect(x,y,w,h)}
function poly(g,pts,color){g.fillStyle=color;g.beginPath();g.moveTo(pts[0][0],pts[0][1]);for(let i=1;i<pts.length;i++)g.lineTo(pts[i][0],pts[i][1]);g.closePath();g.fill()}
function pixelLine(g,x0,y0,x1,y1,color,w=1){
  const dx=Math.abs(x1-x0),sx=x0<x1?1:-1,dy=-Math.abs(y1-y0),sy=y0<y1?1:-1;let err=dx+dy;
  while(true){ir(g,x0,y0,w,w,color);if(x0===x1&&y0===y1)break;const e2=2*err;if(e2>=dy){err+=dy;x0+=sx}if(e2<=dx){err+=dx;y0+=sy}}
}
function blockIcon(g,top,front,side,kind='plain'){
  poly(g,[[2,4],[8,1],[14,4],[8,7]],top);
  poly(g,[[2,4],[8,7],[8,14],[2,11]],front);
  poly(g,[[8,7],[14,4],[14,11],[8,14]],side);
  ir(g,2,4,1,7,'rgba(255,255,255,.18)');
  ir(g,13,5,1,6,'rgba(0,0,0,.18)');
  if(kind==='grass'){ir(g,2,4,6,2,'#62a84f');ir(g,8,5,6,2,'#4c8f43');ir(g,4,8,2,1,'#6e482d');ir(g,10,9,2,1,'#5d3b28')}
  if(kind==='stone'){ir(g,4,7,2,1,'#6f7478');ir(g,5,11,2,1,'#a4a8ab');ir(g,10,7,2,1,'#676c70');ir(g,11,11,1,1,'#b3b7ba')}
  if(kind==='sand'){ir(g,5,3,1,1,'#efe1a4');ir(g,4,9,1,1,'#bfae72');ir(g,11,8,1,1,'#f2dfa0')}
  if(kind==='log'){ir(g,5,2,6,1,'#6d4223');ir(g,6,3,4,1,'#d09758');ir(g,4,7,1,5,'#5e391f');ir(g,10,8,1,5,'#81502b')}
  if(kind==='leaf'){ir(g,4,3,2,1,'#74a95d');ir(g,5,8,1,1,'#2f6734');ir(g,10,7,2,1,'#315f32');ir(g,11,11,1,1,'#6ea45b')}
  if(kind==='plank'){ir(g,3,7,5,1,'#6e4828');ir(g,3,11,5,1,'#6e4828');ir(g,9,9,5,1,'#6b4426')}
  if(kind==='cobble'){ir(g,3,7,3,2,'#60656a');ir(g,5,11,3,2,'#6b7075');ir(g,9,7,3,2,'#5b6064');ir(g,10,11,3,2,'#777c80')}
  if(kind==='glass'){g.globalAlpha=.55;ir(g,4,5,1,5,'#eaffff');ir(g,10,6,1,4,'#eaffff');g.globalAlpha=1}
  if(kind==='oreCoal'||kind==='oreIron'||kind==='oreGold'||kind==='oreDiamond'){
    const col=kind==='oreCoal'?'#252729':kind==='oreIron'?'#b77e61':kind==='oreGold'?'#e7bd35':'#45d5dc';
    ir(g,4,8,2,2,col);ir(g,6,11,1,1,col);ir(g,10,7,2,2,col);ir(g,11,11,1,2,col);
  }
  if(kind==='snow'){ir(g,3,5,5,1,'#ffffff');ir(g,9,5,4,1,'#dfeef5')}
  if(kind==='gravel'){ir(g,4,8,2,2,'#8c8480');ir(g,6,11,2,1,'#5f5a58');ir(g,10,8,2,1,'#aaa29d')}
  if(kind==='cactus'){ir(g,5,4,1,8,'#276c31');ir(g,11,5,1,7,'#235e2b')}
  if(kind==='bedrock'){ir(g,4,8,2,2,'#222');ir(g,6,11,2,1,'#777');ir(g,10,7,2,2,'#252525')}
  if(kind==='table'){ir(g,3,5,5,1,'#633d20');ir(g,5,2,1,4,'#e2b273');ir(g,9,3,1,3,'#5c371d');ir(g,10,8,3,1,'#e0a75d')}
  if(kind==='furnace'){ir(g,3,7,5,2,'#3d4144');ir(g,4,10,4,3,'#202224');ir(g,10,8,3,1,'#4d5154');ir(g,10,10,3,2,'#d0732d')}
}
function materialForTool(id){
  if([I.WOOD_PICK,I.WOOD_AXE].includes(id))return ICON_MAT.wood;
  if([I.STONE_PICK,I.STONE_SWORD,I.STONE_AXE,I.STONE_SHOVEL].includes(id))return ICON_MAT.stone;
  if([I.IRON_PICK,I.IRON_SWORD,I.IRON_AXE,I.IRON_SHOVEL].includes(id))return ICON_MAT.iron;
  if([I.GOLD_PICK,I.GOLD_SWORD,I.GOLD_AXE,I.GOLD_SHOVEL].includes(id))return ICON_MAT.gold;
  return ICON_MAT.diamond;
}
function toolType(id){
  if([I.WOOD_PICK,I.STONE_PICK,I.IRON_PICK,I.GOLD_PICK,I.DIAMOND_PICK].includes(id))return 'pick';
  if([I.STONE_SWORD,I.IRON_SWORD,I.GOLD_SWORD,I.DIAMOND_SWORD].includes(id))return 'sword';
  if([I.WOOD_AXE,I.STONE_AXE,I.IRON_AXE,I.GOLD_AXE,I.DIAMOND_AXE].includes(id))return 'axe';
  if([I.STONE_SHOVEL,I.IRON_SHOVEL,I.GOLD_SHOVEL,I.DIAMOND_SHOVEL].includes(id))return 'shovel';
  return null;
}
function toolIcon(g,id){
  const m=materialForTool(id),t=toolType(id),handle='#78502e',handleHi='#a77343',outline='#242424';
  if(t==='pick'){
    pixelLine(g,5,4,12,4,outline,2);pixelLine(g,4,5,12,5,m.dark,1);
    ir(g,4,3,7,1,m.light);ir(g,3,4,9,1,m.main);ir(g,11,5,2,1,m.dark);
    pixelLine(g,8,6,4,13,outline,3);pixelLine(g,8,6,4,13,handle,2);pixelLine(g,8,6,5,11,handleHi,1);
  }else if(t==='sword'){
    pixelLine(g,10,2,5,10,outline,3);pixelLine(g,10,2,5,10,m.main,2);pixelLine(g,9,3,6,8,m.light,1);
    ir(g,3,9,6,2,outline);ir(g,4,9,4,1,m.dark);pixelLine(g,5,11,3,14,outline,3);pixelLine(g,5,11,3,14,handle,2);
  }else if(t==='axe'){
    pixelLine(g,8,6,4,14,outline,3);pixelLine(g,8,6,4,14,handle,2);pixelLine(g,8,6,5,12,handleHi,1);
    poly(g,[[6,3],[11,2],[13,4],[11,8],[7,7]],outline);poly(g,[[7,4],[11,3],[12,4],[10,7],[7,6]],m.main);ir(g,8,4,3,1,m.light);
  }else if(t==='shovel'){
    pixelLine(g,8,6,4,14,outline,3);pixelLine(g,8,6,4,14,handle,2);pixelLine(g,8,6,5,12,handleHi,1);
    poly(g,[[7,2],[11,3],[11,6],[8,8],[5,6],[5,4]],outline);poly(g,[[7,3],[10,4],[10,6],[8,7],[6,6],[6,4]],m.main);ir(g,7,3,2,1,m.light);
  }
}
function armorIcon(g,id){
  const iron=[I.IRON_HELMET,I.IRON_CHEST,I.IRON_LEGS,I.IRON_BOOTS],gold=[I.GOLD_HELMET,I.GOLD_CHEST,I.GOLD_LEGS,I.GOLD_BOOTS];
  const m=iron.includes(id)?ICON_MAT.iron:gold.includes(id)?ICON_MAT.gold:ICON_MAT.diamond;
  const group=iron.includes(id)?iron:gold.includes(id)?gold:[I.DIAMOND_HELMET,I.DIAMOND_CHEST,I.DIAMOND_LEGS,I.DIAMOND_BOOTS];
  const idx=group.indexOf(id),o='#2b2b2b';
  if(idx===0){ir(g,4,3,8,2,o);ir(g,3,5,10,6,o);ir(g,4,4,8,2,m.light);ir(g,4,6,8,4,m.main);ir(g,5,9,2,2,m.dark);ir(g,9,9,2,2,m.dark)}
  if(idx===1){poly(g,[[5,2],[11,2],[14,5],[12,8],[11,14],[5,14],[4,8],[2,5]],o);poly(g,[[6,3],[10,3],[12,5],[10,7],[10,13],[6,13],[6,7],[4,5]],m.main);ir(g,6,3,4,1,m.light);ir(g,6,8,4,1,m.dark)}
  if(idx===2){ir(g,4,3,8,4,o);ir(g,4,6,4,8,o);ir(g,8,6,4,8,o);ir(g,5,4,6,2,m.light);ir(g,5,6,3,7,m.main);ir(g,9,6,2,7,m.main);ir(g,6,10,1,3,m.dark);ir(g,10,10,1,3,m.dark)}
  if(idx===3){ir(g,3,7,5,7,o);ir(g,9,7,4,7,o);ir(g,4,8,3,4,m.main);ir(g,10,8,2,4,m.main);ir(g,3,12,5,1,m.light);ir(g,9,12,4,1,m.light)}
}
function rawChunkIcon(g,main,bright,dark){
  poly(g,[[3,6],[6,3],[11,4],[14,8],[11,13],[5,12],[2,9]],'#2d2d2d');
  poly(g,[[4,6],[6,4],[10,5],[13,8],[10,12],[5,11],[3,9]],main);
  ir(g,6,5,2,2,bright);ir(g,10,8,2,2,dark);ir(g,5,9,2,1,bright);
}
function ingotIcon(g,m){
  poly(g,[[4,5],[11,5],[14,8],[12,12],[4,12],[2,9]],'#2d2d2d');
  poly(g,[[5,6],[10,6],[12,8],[11,10],[5,10],[4,9]],m.main);
  ir(g,5,6,5,1,m.light);ir(g,5,10,6,1,m.dark);
}
function gemIcon(g,m){
  poly(g,[[8,2],[13,5],[12,10],[8,14],[4,10],[3,5]],'#1d4548');
  poly(g,[[8,3],[12,5],[11,9],[8,13],[5,9],[4,5]],m.main);
  poly(g,[[5,5],[8,3],[8,12],[5,9]],m.light);
  ir(g,10,6,1,3,m.dark);
}
function stickIcon(g){pixelLine(g,11,3,4,13,'#332417',3);pixelLine(g,11,3,4,13,'#8b5b32',2);pixelLine(g,10,4,5,11,'#c08a52',1)}
function mobDropIcon(g,id){
  if(id===I.WOOL){
    ir(g,4,4,8,8,'#f4f1e9');ir(g,3,6,2,5,'#ded9cf');ir(g,11,5,2,6,'#ffffff');
    ir(g,5,3,3,2,'#ffffff');ir(g,8,3,3,2,'#e7e2d8');ir(g,6,11,5,2,'#c9c4bb');return;
  }
  if(id===I.RAW_PORK||id===I.RAW_BEEF||id===I.COOKED_PORK||id===I.COOKED_BEEF){
    const cooked=id===I.COOKED_PORK||id===I.COOKED_BEEF;
    const pork=id===I.RAW_PORK||id===I.COOKED_PORK;
    const main=cooked?(pork?'#b96a35':'#824326'):(pork?'#d8737d':'#a84448');
    const light=cooked?(pork?'#e39a4d':'#b8773e'):(pork?'#f3a2aa':'#d8666b');
    const dark=cooked?(pork?'#70371e':'#532919'):(pork?'#9e4f58':'#6f2b30');
    poly(g,[[3,6],[6,3],[11,4],[13,7],[11,12],[6,13],[3,10]],main);
    ir(g,6,5,4,2,light);ir(g,4,8,2,2,dark);ir(g,9,10,2,2,dark);
    if(cooked){ir(g,9,5,2,1,'#f2c475');ir(g,6,11,3,1,dark)}
    return;
  }
  if(id===I.LEATHER){
    poly(g,[[4,3],[7,4],[9,3],[12,5],[11,8],[13,11],[10,13],[7,12],[4,13],[3,9],[4,7],[3,5]],'#8a5533');
    ir(g,6,5,4,2,'#b77a4e');ir(g,5,10,5,1,'#5f3822');return;
  }
}
function drawItemIcon(g,id){
  g.clearRect(0,0,16,16);
  if(id===I.WOOL||id===I.RAW_PORK||id===I.RAW_BEEF||id===I.LEATHER||
    id===I.COOKED_PORK||id===I.COOKED_BEEF)return mobDropIcon(g,id);
  if(id===B.GRASS)return blockIcon(g,'#78b85c','#785032','#5f4028','grass');
  if(id===B.DIRT)return blockIcon(g,'#98643c','#7c4e31','#684029','plain');
  if(id===B.STONE)return blockIcon(g,'#a3a7aa','#888d91','#6f7478','stone');
  if(id===B.SAND)return blockIcon(g,'#eadb99','#d2c183','#b8a96f','sand');
  if(id===B.WATER)return blockIcon(g,'#65b4df','#3687c4','#2b69a1','glass');
  if(id===B.LOG)return blockIcon(g,'#b88149','#87552e','#674123','log');
  if(id===B.LEAF)return blockIcon(g,'#639a4d','#447c3e','#315f31','leaf');
  if(id===B.COAL)return blockIcon(g,'#92979b','#777c80','#62676b','oreCoal');
  if(id===B.IRON)return blockIcon(g,'#92979b','#777c80','#62676b','oreIron');
  if(id===B.GOLD)return blockIcon(g,'#92979b','#777c80','#62676b','oreGold');
  if(id===B.DIAMOND)return blockIcon(g,'#92979b','#777c80','#62676b','oreDiamond');
  if(id===B.SNOW)return blockIcon(g,'#ffffff','#e6f0f5','#cddce4','snow');
  if(id===B.GRAVEL)return blockIcon(g,'#99918c','#7b7572','#625e5b','gravel');
  if(id===B.CACTUS)return blockIcon(g,'#4c9b50','#377d3e','#286030','cactus');
  if(id===B.PLANK)return blockIcon(g,'#c58b50','#a86f3d','#89562f','plank');
  if(id===B.COBBLE)return blockIcon(g,'#858a8e','#6f7478','#595e62','cobble');
  if(id===B.GLASS)return blockIcon(g,'#d9f7fb','#9ddce6','#72b9c8','glass');
  if(id===B.BEDROCK)return blockIcon(g,'#6e7174','#505356','#37393b','bedrock');
  if(id===B.CRAFTING_TABLE||id===I.CRAFTING_TABLE)return blockIcon(g,'#d7a05e','#9d6234','#774523','table');
  if(id===B.FURNACE||id===I.FURNACE)return blockIcon(g,'#a0a5a8','#777c7f','#5b6063','furnace');
  if(id===I.BED||id===B.BED||id===B.BED_HEAD){
    // side-view pixel bed: wood frame + red blanket + white pillow + four feet
    ir(g,1,9,14,3,'#6b4325');
    ir(g,2,5,12,5,'#c92f38');
    ir(g,2,4,5,3,'#f3f0e8');
    ir(g,3,5,4,1,'#d9d4c9');
    ir(g,7,6,7,1,'#e4575f');
    ir(g,2,10,2,3,'#4c2e19');
    ir(g,12,10,2,3,'#4c2e19');
    ir(g,1,8,14,1,'#8f1e25');
    return;
  }
  if(id===I.STICK)return stickIcon(g);
  if(id===I.RAW_IRON)return rawChunkIcon(g,'#8e7569','#c79a81','#624f47');
  if(id===I.RAW_GOLD)return rawChunkIcon(g,'#a88d32','#f0ca45','#6d5a21');
  if(id===I.IRON_INGOT)return ingotIcon(g,ICON_MAT.iron);
  if(id===I.GOLD_INGOT)return ingotIcon(g,ICON_MAT.gold);
  if(id===I.DIAMOND)return gemIcon(g,ICON_MAT.diamond);
  if(toolType(id))return toolIcon(g,id);
  if(id>=I.IRON_HELMET&&id<=I.DIAMOND_BOOTS)return armorIcon(g,id);
  ir(g,3,3,10,10,'#777');ir(g,5,5,6,6,'#aaa');
}
const recipes=[
  {name:'木材 ×4',out:B.PLANK,qty:4,needs:[[B.LOG,1]],unlockLevel:2},
  {name:'棒 ×4',out:I.STICK,qty:4,needs:[[B.PLANK,2]],unlockLevel:3},
  {name:'作業台',out:I.CRAFTING_TABLE,qty:1,needs:[[B.PLANK,4]],unlockLevel:4},
  {name:'木のツルハシ',out:I.WOOD_PICK,qty:1,needs:[[B.PLANK,3],[I.STICK,2]],unlockLevel:5},
  {name:'木の斧',out:I.WOOD_AXE,qty:1,needs:[[B.PLANK,3],[I.STICK,2]],unlockLevel:5}
];
const workbenchRecipes=[
  {name:'ベッド',out:I.BED,qty:1,needs:[[I.WOOL,3],[B.PLANK,3]],unlockLevel:6},
  {name:'石のツルハシ',out:I.STONE_PICK,qty:1,needs:[[B.COBBLE,3],[I.STICK,2]],unlockLevel:6},
  {name:'かまど',out:I.FURNACE,qty:1,needs:[[B.COBBLE,8]],unlockLevel:7},
  {name:'石の剣',out:I.STONE_SWORD,qty:1,needs:[[B.COBBLE,2],[I.STICK,1]],unlockLevel:6},
  {name:'石の斧',out:I.STONE_AXE,qty:1,needs:[[B.COBBLE,3],[I.STICK,2]],unlockLevel:6},
  {name:'石のシャベル',out:I.STONE_SHOVEL,qty:1,needs:[[B.COBBLE,1],[I.STICK,2]],unlockLevel:6},

  {name:'鉄のツルハシ',out:I.IRON_PICK,qty:1,needs:[[I.IRON_INGOT,3],[I.STICK,2]],unlockLevel:8},
  {name:'鉄の剣',out:I.IRON_SWORD,qty:1,needs:[[I.IRON_INGOT,2],[I.STICK,1]],unlockLevel:8},
  {name:'鉄の斧',out:I.IRON_AXE,qty:1,needs:[[I.IRON_INGOT,3],[I.STICK,2]],unlockLevel:8},
  {name:'鉄のシャベル',out:I.IRON_SHOVEL,qty:1,needs:[[I.IRON_INGOT,1],[I.STICK,2]],unlockLevel:8},
  {name:'鉄のヘルメット',out:I.IRON_HELMET,qty:1,needs:[[I.IRON_INGOT,5]],unlockLevel:9},
  {name:'鉄のチェストプレート',out:I.IRON_CHEST,qty:1,needs:[[I.IRON_INGOT,8]],unlockLevel:9},
  {name:'鉄のレギンス',out:I.IRON_LEGS,qty:1,needs:[[I.IRON_INGOT,7]],unlockLevel:9},
  {name:'鉄のブーツ',out:I.IRON_BOOTS,qty:1,needs:[[I.IRON_INGOT,4]],unlockLevel:9},

  {name:'金のツルハシ',out:I.GOLD_PICK,qty:1,needs:[[I.GOLD_INGOT,3],[I.STICK,2]],unlockLevel:10},
  {name:'金の剣',out:I.GOLD_SWORD,qty:1,needs:[[I.GOLD_INGOT,2],[I.STICK,1]],unlockLevel:10},
  {name:'金の斧',out:I.GOLD_AXE,qty:1,needs:[[I.GOLD_INGOT,3],[I.STICK,2]],unlockLevel:10},
  {name:'金のシャベル',out:I.GOLD_SHOVEL,qty:1,needs:[[I.GOLD_INGOT,1],[I.STICK,2]],unlockLevel:10},
  {name:'金のヘルメット',out:I.GOLD_HELMET,qty:1,needs:[[I.GOLD_INGOT,5]],unlockLevel:11},
  {name:'金のチェストプレート',out:I.GOLD_CHEST,qty:1,needs:[[I.GOLD_INGOT,8]],unlockLevel:11},
  {name:'金のレギンス',out:I.GOLD_LEGS,qty:1,needs:[[I.GOLD_INGOT,7]],unlockLevel:11},
  {name:'金のブーツ',out:I.GOLD_BOOTS,qty:1,needs:[[I.GOLD_INGOT,4]],unlockLevel:11},

  {name:'ダイヤのツルハシ',out:I.DIAMOND_PICK,qty:1,needs:[[I.DIAMOND,3],[I.STICK,2]],unlockLevel:12},
  {name:'ダイヤの剣',out:I.DIAMOND_SWORD,qty:1,needs:[[I.DIAMOND,2],[I.STICK,1]],unlockLevel:12},
  {name:'ダイヤの斧',out:I.DIAMOND_AXE,qty:1,needs:[[I.DIAMOND,3],[I.STICK,2]],unlockLevel:12},
  {name:'ダイヤのシャベル',out:I.DIAMOND_SHOVEL,qty:1,needs:[[I.DIAMOND,1],[I.STICK,2]],unlockLevel:12},
  {name:'ダイヤのヘルメット',out:I.DIAMOND_HELMET,qty:1,needs:[[I.DIAMOND,5]],unlockLevel:13},
  {name:'ダイヤのチェストプレート',out:I.DIAMOND_CHEST,qty:1,needs:[[I.DIAMOND,8]],unlockLevel:13},
  {name:'ダイヤのレギンス',out:I.DIAMOND_LEGS,qty:1,needs:[[I.DIAMOND,7]],unlockLevel:13},
  {name:'ダイヤのブーツ',out:I.DIAMOND_BOOTS,qty:1,needs:[[I.DIAMOND,4]],unlockLevel:13}
];
const furnaceRecipes=[
  {name:'鉄インゴット',out:I.IRON_INGOT,qty:1,needs:[[I.RAW_IRON,1],[B.COAL,1]],unlockLevel:7,xp:4},
  {name:'金インゴット',out:I.GOLD_INGOT,qty:1,needs:[[I.RAW_GOLD,1],[B.COAL,1]],unlockLevel:7,xp:6},
  {name:'焼き豚肉',out:I.COOKED_PORK,qty:1,needs:[[I.RAW_PORK,1],[B.COAL,1]],unlockLevel:7,xp:2},
  {name:'ステーキ',out:I.COOKED_BEEF,qty:1,needs:[[I.RAW_BEEF,1],[B.COAL,1]],unlockLevel:7,xp:3}
];
const blockXP={[B.GRASS]:1,[B.DIRT]:1,[B.SAND]:1,[B.LEAF]:1,[B.LOG]:4,[B.STONE]:3,[B.GRAVEL]:2,[B.COAL]:6,[B.IRON]:10,[B.GOLD]:14,[B.DIAMOND]:25,[B.CACTUS]:2};
const hardness={
  [B.GRASS]:0.55,[B.DIRT]:0.45,[B.SAND]:0.4,[B.LEAF]:0.22,[B.SNOW]:0.18,[B.GRAVEL]:0.75,[B.CACTUS]:0.65,
  [B.LOG]:1.55,[B.PLANK]:1.25,[B.GLASS]:0.3,[B.CRAFTING_TABLE]:2.0,[B.BED]:1.0,[B.BED_HEAD]:1.0,
  [B.STONE]:3.0,[B.COBBLE]:3.4,[B.COAL]:3.5,[B.IRON]:4.2,[B.GOLD]:4.0,[B.DIAMOND]:5.0,[B.FURNACE]:3.8,
  [B.BEDROCK]:Infinity
};
const rockBlocks=new Set([B.STONE,B.COBBLE,B.COAL,B.IRON,B.GOLD,B.DIAMOND,B.FURNACE]);

let selected=null,seed=(Date.now()>>>0),weather='clear',started=false,craftOpen=false,craftMode='inventory',level=1,xp=0,miningHeld=false,miningKey=null,miningElapsed=0,miningId=null;
const chunks=new Map(),editChunks=new Map();
let streamCX=NaN,streamCZ=NaN;
let currentAccount=null,currentWorldSlot=null,worldReady=false,saveInterval=null,saveDirty=false,generatorVersion=5;
let multiRole=null,multiHostSlot=null,multiHostId='',multiBusy=false,multiApplying=false,multiMembers={};
const multiGuestRecords=new Map(),multiAvatars=new Map(),multiFriendsOnline=new Map();
let multiLastPose=0,multiLastProfile=0,multiPendingTimer=null,multiClosing=false,multiProfileSaveTimer=null;
let multiOriginName='',multiMigration=null,multiCheckpoint=null,multiRoster=[];
let multiLastCheckpoint=0,multiMigrationGeneration=0;
const MULTI_HOST='blockworld_multi_host_v1:',MULTI_MEMBER='blockworld_multi_member_v1:';
const MULTI_HANDOFF='blockworld_multi_handoff_v1:';
const FRIEND_ID='blockworld_friend_id_v1:',FRIENDS_KEY='blockworld_friends_v1:';
const ACCOUNT_REGISTRY_KEY='blockworld_accounts_v1',SESSION_KEY='blockworld_session_v1',SAVE_PREFIX='blockworld_save_v3:',LEGACY_SAVE_PREFIX='blockworld_save_v2:',MAX_WORLDS=5;

const inside=(x,y,z)=>y>=Y_MIN&&y<=WORLD_TOP;
const chunkCoord=v=>Math.floor(v/CHUNK);
const localCoord=v=>((v%CHUNK)+CHUNK)%CHUNK;
const chunkKey=(cx,cz)=>cx+','+cz;
const cIndex=(lx,y,lz)=>((y-Y_MIN)*CHUNK+lz)*CHUNK+lx;
const solid=id=>id!==B.AIR&&id!==B.WATER;


function accountKey(name){return name.normalize('NFKC').trim().toLocaleLowerCase('ja-JP')}
function validAccountName(name){
  const n=name.normalize('NFKC').trim();
  return n.length>=2&&n.length<=20&&!/[\u0000-\u001f<>:"/\\|?*]/.test(n);
}
function loadAccountRegistry(){
  try{return JSON.parse(localStorage.getItem(ACCOUNT_REGISTRY_KEY)||'{"version":1,"accounts":{}}')}
  catch{return {version:1,accounts:{}}}
}
function saveAccountRegistry(reg){localStorage.setItem(ACCOUNT_REGISTRY_KEY,JSON.stringify(reg))}
function rememberSession(key){
  try{localStorage.setItem(SESSION_KEY,JSON.stringify({key,rememberedAt:Date.now()}))}catch{}
}
function clearSession(){
  try{localStorage.removeItem(SESSION_KEY)}catch{}
}
function restoreSession(){
  try{
    const raw=localStorage.getItem(SESSION_KEY);
    if(!raw)return false;
    const saved=JSON.parse(raw),reg=loadAccountRegistry(),acc=reg.accounts?.[saved?.key];
    if(!acc){clearSession();return false}
    currentAccount={key:saved.key,name:acc.name||saved.key};
    setSaveStatus('ワールド未選択');
    showMainMenu();
    return true;
  }catch{
    clearSession();
    return false;
  }
}
function bytesToB64(bytes){let t='';for(const b of bytes)t+=String.fromCharCode(b);return btoa(t)}
function b64ToBytes(t){const raw=atob(t),out=new Uint8Array(raw.length);for(let i=0;i<raw.length;i++)out[i]=raw.charCodeAt(i);return out}
async function passwordHash(password,salt){
  const base=await crypto.subtle.importKey('raw',new TextEncoder().encode(password),'PBKDF2',false,['deriveBits']);
  const bits=await crypto.subtle.deriveBits({name:'PBKDF2',salt,iterations:120000,hash:'SHA-256'},base,256);
  return bytesToB64(new Uint8Array(bits));
}
function safeEqual(a,b){
  if(a.length!==b.length)return false;
  let d=0;for(let i=0;i<a.length;i++)d|=a.charCodeAt(i)^b.charCodeAt(i);return d===0;
}
function legacySaveKey(key){return LEGACY_SAVE_PREFIX+encodeURIComponent(key)}
function saveKeyForAccount(key,slot){return SAVE_PREFIX+encodeURIComponent(key)+':'+slot}
function migrateLegacySave(key){
  try{
    const legacy=localStorage.getItem(legacySaveKey(key));
    const slot1=localStorage.getItem(saveKeyForAccount(key,1));
    if(legacy&&!slot1)localStorage.setItem(saveKeyForAccount(key,1),legacy);
  }catch(e){console.warn?.('legacy save migration failed',e)}
}
function setSaveStatus(text){saveStatusEl.textContent=text}
function markSaveDirty(){
  if(!currentAccount||!currentWorldSlot)return;
  saveDirty=true;setSaveStatus('未保存');
  // Guest inventory updates should reach the host promptly, not only on the
  // periodic save. Coalesce rapid mining/crafting updates into one message.
  if(multiRole==='guest'&&worldReady&&!multiApplying){
    clearTimeout(multiProfileSaveTimer);
    multiProfileSaveTimer=setTimeout(()=>saveCurrentGame(false),700);
  }
}
function serializeEdits(){return [...editChunks.entries()].map(([k,m])=>[k,[...m.entries()]])}
function restoreEdits(raw,saveVersion=3){
  editChunks.clear();
  if(!Array.isArray(raw))return;
  // Saves made before deeper terrain stored y=0..47 directly in the chunk index.
  // Shift only those old indices; new-world edits already use y=-80..47.
  const oldYOffset=saveVersion<4?(-Y_MIN*CHUNK*CHUNK):0;
  for(const row of raw){
    if(!Array.isArray(row)||row.length!==2||!Array.isArray(row[1]))continue;
    const m=new Map();
    for(const pair of row[1]){
      if(!Array.isArray(pair)||pair.length!==2)continue;
      const oldIndex=Number(pair[0]),block=Number(pair[1]);
      const i=oldIndex+oldYOffset;
      if(Number.isInteger(i)&&i>=0&&i<CHUNK*HEIGHT*CHUNK&&Number.isInteger(block))
        m.set(i,block);
    }
    if(m.size)editChunks.set(String(row[0]),m);
  }
}
function makeSaveData(){
  return {
    version:4,worldSlot:currentWorldSlot,generatorVersion,savedAt:Date.now(),seed:seed>>>0,
    level,xp,weather,dayTime,health,stamina,staminaRunSeconds,staminaRegenSeconds,cameraMode,
    initialSpawn:initialSpawn?{x:initialSpawn.x,y:initialSpawn.y,z:initialSpawn.z}:null,
    bedSpawn:bedSpawn?{x:bedSpawn.x,y:bedSpawn.y,z:bedSpawn.z}:null,
    inventory:{...inventory},acquiredOrder:[...acquiredOrder],hotbarSlots:[...hotbarSlots],selected,
    inventorySlots:inventorySlots.map(v=>v?{id:v.id,qty:v.qty}:null),selectedHotbarIndex,
    worldDrops:serializeWorldDrops(),
    player:{x:player.pos.x,y:player.pos.y,z:player.pos.z,yaw:player.yaw,pitch:player.pitch},
    edits:serializeEdits()
  };
}
function saveCurrentGame(showMessage=false){
  if(!currentAccount||!currentWorldSlot||!worldReady)return false;
  try{
    if(multiRole==='guest'){
      const profile=multiProfile();
      localStorage.setItem(multiGuestSaveKey(),JSON.stringify(profile));
      if(multiHostId===multiOwnId()){
        // If the original creator rejoins a migrated room, recover its latest
        // shared world back into its own multi-world slot automatically.
        const restored={...makeSaveData(),members:multiCheckpoint?.world?.members||{},
          originName:multiOriginName||currentAccount.name};
        localStorage.setItem(multiWorldKey(currentWorldSlot),JSON.stringify(restored));
      }
      if(multiplayerNetwork.connected)multiplayerNetwork.send({t:'profile',profile});
      saveDirty=false;setSaveStatus('マルチ：持ち物保存済み');
      if(showMessage)flash('持ち物を保存しました');
      return true;
    }
    const key=multiRole==='host'
      ?(multiHostId===multiOwnId()?multiWorldKey(currentWorldSlot):multiHandoffSaveKey(multiHostId,currentWorldSlot))
      :saveKeyForAccount(currentAccount.key,currentWorldSlot);
    const payload=makeSaveData();
    if(multiRole==='host'){
      payload.members=multiMembers;
      payload.originName=multiOriginName||currentAccount.name;
    }
    localStorage.setItem(key,JSON.stringify(payload));
    saveDirty=false;
    const d=new Date(),hh=String(d.getHours()).padStart(2,'0'),mm=String(d.getMinutes()).padStart(2,'0');
    setSaveStatus('W'+currentWorldSlot+' 保存済 '+hh+':'+mm);
    if(showMessage)flash('ワールド'+currentWorldSlot+'をセーブしました');
    return true;
  }catch(e){
    setSaveStatus('保存失敗');
    if(showMessage)flash('セーブに失敗しました');
    console.warn?.('save failed',e);return false;
  }
}
function readSaveForAccount(key,slot){
  try{const raw=localStorage.getItem(saveKeyForAccount(key,slot));return raw?JSON.parse(raw):null}catch{return null}
}
function applySaveData(data){
  if(!data||typeof data!=='object')return false;
  if(Number.isFinite(data.seed))seed=data.seed>>>0;
  generatorVersion=Math.max(1,Number(data.generatorVersion)||1);
  level=Math.max(1,Number(data.level)||1);xp=Math.max(0,Number(data.xp)||0);
  weather=data.weather==='rain'?'rain':'clear';
  dayTime=Number.isFinite(data.dayTime)?Math.max(0,Math.min(.999999,data.dayTime)):.24;
  health=Number.isFinite(Number(data.health))?Math.max(0,Math.min(MAX_HEALTH,Math.floor(Number(data.health)))):MAX_HEALTH;
  dead=health<=0;
  cameraMode=Number.isInteger(data.cameraMode)?Math.max(0,Math.min(2,data.cameraMode)):0;
  updateViewLabel();
  stamina=Number.isFinite(data.stamina)?Math.max(0,Math.min(MAX_STAMINA,Math.floor(data.stamina))):MAX_STAMINA;
  staminaRunSeconds=Number.isFinite(data.staminaRunSeconds)?Math.max(0,Math.min(STAMINA_SECONDS_PER_HALF-.0001,data.staminaRunSeconds)):0;
  staminaRegenSeconds=Number.isFinite(data.staminaRegenSeconds)?Math.max(0,Math.min(STAMINA_SECONDS_PER_HALF-.0001,data.staminaRegenSeconds)):0;
  initialSpawn=(data.initialSpawn&&Number.isFinite(data.initialSpawn.x)&&Number.isFinite(data.initialSpawn.y)&&Number.isFinite(data.initialSpawn.z))
    ?{x:Number(data.initialSpawn.x),y:Number(data.initialSpawn.y),z:Number(data.initialSpawn.z)}:null;
  bedSpawn=(data.bedSpawn&&Number.isFinite(data.bedSpawn.x)&&Number.isFinite(data.bedSpawn.y)&&Number.isFinite(data.bedSpawn.z))
    ?{x:Math.round(Number(data.bedSpawn.x)),y:Math.round(Number(data.bedSpawn.y)),z:Math.round(Number(data.bedSpawn.z))}:null;

  clearInventorySlots();
  if(Array.isArray(data.inventorySlots)&&data.inventorySlots.length){
    for(let i=0;i<Math.min(36,data.inventorySlots.length);i++){
      const v=data.inventorySlots[i];
      if(v&&Number.isFinite(Number(v.id))&&Number(v.qty)>0)inventorySlots[i]={id:Number(v.id),qty:Math.max(1,Math.floor(Number(v.qty)))};
    }
  }else{
    migrateLegacyInventoryToSlots(data);
  }
  selectedHotbarIndex=Number.isInteger(data.selectedHotbarIndex)?Math.max(0,Math.min(8,data.selectedHotbarIndex)):0;
  if(data.selected!=null&&!inventorySlots[selectedHotbarIndex]){
    const oldSelected=Number(data.selected),idx=inventorySlots.findIndex((v,i)=>i<9&&v?.id===oldSelected);
    if(idx>=0)selectedHotbarIndex=idx;
  }
  syncDerivedInventory();
  restoreEdits(data.edits,Number(data.version)||3);
  restoreWorldDrops(data.worldDrops);

  if(data.player&&Number.isFinite(data.player.x)&&Number.isFinite(data.player.y)&&Number.isFinite(data.player.z)){
    player.pos.set(data.player.x,data.player.y,data.player.z);player.yaw=Number(data.player.yaw)||0;player.pitch=Number(data.player.pitch)||0;return true;
  }
  return false;
}
function resetWorldRuntime(){
  resetSprint();
  cameraMode=0;updateViewLabel();playerAvatar.visible=false;
  stamina=MAX_STAMINA;staminaRunSeconds=0;staminaRegenSeconds=0;
  started=false;craftOpen=false;inventoryOpen=false;crafting.classList.remove('open');inventoryScreen.classList.remove('open');primaryActionStop();
  for(const c of chunks.values())removeChunkMeshes(c);
  meshes=[];lookup.clear();pendingChunkLoads.length=0;pendingChunkJob=null;dirtyMeshKeys.clear();
  for(let i=mobs.length-1;i>=0;i--){
    const m=mobs[i];
    if(m.userData.type==='zombie')removeZombie(m);
    else scene.remove(m);
  }
  mobs.length=0;passiveSpawnCooldown=20;zombieSpawnCooldown=1;nightZombieWaveStarted=false;
  clearWorldDrops();
  chunks.clear();streamCX=NaN;streamCZ=NaN;player.vel.set(0,0,0);player.onGround=false;
  health=MAX_HEALTH;dead=false;fallOriginY=null;initialSpawn=null;bedSpawn=null;healthRegenTimer=0;
  deathScreen.classList.remove('open');deathScreen.setAttribute('aria-hidden','true');
}
function freshSeed(){
  try{return crypto.getRandomValues(new Uint32Array(1))[0]>>>0}catch{return Date.now()>>>0}
}
async function initializeAccountWorld(save,slot){
  currentWorldSlot=slot;worldReady=false;menuCover.style.display='none';worldCover.style.display='none';cover.style.display='flex';
  accountBox.style.display='block';
  loading.textContent='セーブデータを読み込み中...';resetWorldRuntime();
  let hasSavedPos=false;
  if(save)hasSavedPos=applySaveData(save);
  else{
    seed=freshSeed();generatorVersion=5;level=1;xp=0;weather='clear';dayTime=.24;selected=null;
    stamina=MAX_STAMINA;staminaRunSeconds=0;staminaRegenSeconds=0;
    health=MAX_HEALTH;dead=false;fallOriginY=null;initialSpawn=null;bedSpawn=null;healthRegenTimer=0;
    clearInventorySlots();selectedHotbarIndex=0;inventorySelectedSlot=null;syncDerivedInventory();
    editChunks.clear();clearWorldDrops();
  }
  await new Promise(r=>setTimeout(r,30));
  ensureInitialSpawn();
  if(!hasSavedPos)spawn();
  loading.textContent='周辺チャンクを生成中...';await new Promise(r=>setTimeout(r,30));
  streamChunks(true);
  for(let i=0;i<12&&blocked(player.pos.x,player.pos.y,player.pos.z);i++)player.pos.y+=1;
  rain.visible=weather==='rain';weatherEl.textContent=weather==='rain'?'Rain':'Clear';
  accountNameEl.textContent=currentAccount.name+' · W'+slot+' · GEN'+generatorVersion;
  renderHotbar();updateProgress();renderHealth();renderStamina();updateViewLabel();
  loading.textContent=save?'ワールド'+slot+'を復元しました':'ワールド'+slot+'を作成しました';
  worldReady=true;saveDirty=false;saveCurrentGame(false);
  clearInterval(saveInterval);saveInterval=setInterval(()=>saveCurrentGame(false),20000);
}
function formatSavedAt(ms){
  if(!Number.isFinite(ms))return '保存日時不明';
  const d=new Date(ms),mo=d.getMonth()+1,da=d.getDate(),hh=String(d.getHours()).padStart(2,'0'),mm=String(d.getMinutes()).padStart(2,'0');
  return mo+'/'+da+' '+hh+':'+mm;
}
function renderWorldSelection(){
  if(!currentAccount)return;
  migrateLegacySave(currentAccount.key);
  worldAccountName.textContent=currentAccount.name;worldGrid.innerHTML='';
  for(let slot=1;slot<=MAX_WORLDS;slot++){
    const save=readSaveForAccount(currentAccount.key,slot),card=document.createElement('div');
    card.className='world-slot'+(save?'':' empty');
    const info=document.createElement('div');
    const title=document.createElement('div');title.className='world-slot-title';title.textContent='WORLD '+slot;info.appendChild(title);
    const meta=document.createElement('div');meta.className='world-slot-meta';
    if(save){
      const x=Math.floor(save.player?.x||0),z=Math.floor(save.player?.z||0);
      meta.textContent='LV '+(save.level||1)+'  ·  GEN'+(save.generatorVersion||1)+'  ·  '+formatSavedAt(save.savedAt)+'\nX '+x+' / Z '+z;
      meta.style.whiteSpace='pre-line';
    }else meta.textContent='空きスロット · 新規はGEN5';
    info.appendChild(meta);

    const actions=document.createElement('div');actions.className='world-slot-actions';
    const play=document.createElement('button');play.type='button';play.textContent=save?'続きから':'新しく作る';
    play.addEventListener('click',()=>initializeAccountWorld(save,slot));actions.appendChild(play);
    if(save){
      const del=document.createElement('button');del.type='button';del.className='delete-world';del.textContent='削除';
      del.addEventListener('click',()=>{
        if(confirm('WORLD '+slot+'を完全に削除しますか？')){
          localStorage.removeItem(saveKeyForAccount(currentAccount.key,slot));renderWorldSelection();
        }
      });
      actions.appendChild(del);
    }
    card.append(info,actions);worldGrid.appendChild(card);
  }
}
function showMainMenu(){
  if(!currentAccount)return;
  if(multiRole)multiLeave(true);
  if(worldReady){
    saveCurrentGame(false);
    clearInterval(saveInterval);saveInterval=null;
    resetWorldRuntime();worldReady=false;currentWorldSlot=null;
  }
  authCover.style.display='none';cover.style.display='none';accountBox.style.display='none';
  worldCover.style.display='none';menuAccountName.textContent=currentAccount.name;
  menuCover.style.display='flex';
  document.exitPointerLock?.();
  multiStartPresence();
}
function showWorldSelection(){
  if(!currentAccount)return;
  if(worldReady)saveCurrentGame(false);
  clearInterval(saveInterval);saveInterval=null;
  resetWorldRuntime();worldReady=false;currentWorldSlot=null;
  cover.style.display='none';accountBox.style.display='none';menuCover.style.display='none';worldCover.style.display='flex';
  document.exitPointerLock?.();renderWorldSelection();
}
function setAuthMode(mode){
  const create=mode==='create';authForm.dataset.mode=mode;
  showLogin.classList.toggle('active',!create);showCreate.classList.toggle('active',create);
  authModeText.textContent=create?'新しいアカウントを作成':'アカウントにログイン';
  authSubmit.textContent=create?'アカウント作成':'ログイン';
  authPassword.autocomplete=create?'new-password':'current-password';authError.textContent='';
}
async function submitAuth(e){
  e.preventDefault();authError.textContent='';
  const name=authName.value.normalize('NFKC').trim(),password=authPassword.value;
  if(!validAccountName(name)){authError.textContent='名前は2〜20文字で入力してください';return}
  if(password.length<6){authError.textContent='パスワードは6文字以上にしてください';return}
  const key=accountKey(name),reg=loadAccountRegistry(),mode=authForm.dataset.mode||'login';
  authSubmit.disabled=true;authSubmit.textContent=mode==='create'?'作成中...':'確認中...';
  try{
    if(mode==='create'){
      if(reg.accounts[key]){authError.textContent='その名前はすでに使われています';return}
      const salt=crypto.getRandomValues(new Uint8Array(16)),hash=await passwordHash(password,salt);
      reg.accounts[key]={name,salt:bytesToB64(salt),hash,createdAt:Date.now()};saveAccountRegistry(reg);
      currentAccount={key,name};rememberSession(key);setSaveStatus('ワールド未選択');
    }else{
      const acc=reg.accounts[key];
      if(!acc){authError.textContent='そのアカウントはありません';return}
      const hash=await passwordHash(password,b64ToBytes(acc.salt));
      if(!safeEqual(hash,acc.hash)){authError.textContent='パスワードが違います';return}
      currentAccount={key,name:acc.name||name};rememberSession(key);setSaveStatus('ワールド未選択');
    }
    authPassword.value='';
    showMainMenu();
  }catch(err){
    authError.textContent='アカウント処理に失敗しました';console.warn?.('auth failed',err);
  }finally{
    authSubmit.disabled=false;authSubmit.textContent=(authForm.dataset.mode||'login')==='create'?'アカウント作成':'ログイン';
  }
}

function hash3Legacy(x,y,z,s=seed){
  let n=(x*374761393+y*668265263+z*2147483647+s*1274126177)|0;
  n=(n^(n>>>13))*1274126177;n^=n>>>16;
  return(n>>>0)/4294967295
}
function hash3Modern(x,y,z,s=seed){
  // Strong 32-bit avalanche mixing with independent X/Y/Z multipliers.
  // Math.imul keeps the intended low 32 bits without the old Z-axis correlation.
  let h=(s|0);
  h^=Math.imul(x|0,0x9e3779b1);
  h^=Math.imul(y|0,0x85ebca77);
  h^=Math.imul(z|0,0xc2b2ae3d);
  h^=h>>>16;h=Math.imul(h,0x7feb352d);
  h^=h>>>15;h=Math.imul(h,0x846ca68b);
  h^=h>>>16;
  return(h>>>0)/4294967296
}
function hash3(x,y,z,s=seed){return generatorVersion>=5?hash3Modern(x,y,z,s):hash3Legacy(x,y,z,s)}
const hash2=(x,z,s=seed)=>hash3(x,0,z,s),fade=t=>t*t*(3-2*t),lerp=(a,b,t)=>a+(b-a)*t;
function noise2(x,z,o=0){const x0=Math.floor(x),z0=Math.floor(z),tx=x-x0,tz=z-z0,f=(dx,dz)=>hash2(x0+dx,z0+dz,seed+o)*2-1;return lerp(lerp(f(0,0),f(1,0),fade(tx)),lerp(f(0,1),f(1,1),fade(tx)),fade(tz))}
function fbm(x,z,o=0,n=4){let v=0,a=.5,f=1,t=0;for(let i=0;i<n;i++){v+=noise2(x*f,z*f,o+i*101)*a;t+=a;a*=.5;f*=2}return v/t}
function noise3(x,y,z,o=0){const x0=Math.floor(x),y0=Math.floor(y),z0=Math.floor(z),tx=fade(x-x0),ty=fade(y-y0),tz=fade(z-z0),q=(a,b,c)=>hash3(x0+a,y0+b,z0+c,seed+o)*2-1;const x00=lerp(q(0,0,0),q(1,0,0),tx),x10=lerp(q(0,1,0),q(1,1,0),tx),x01=lerp(q(0,0,1),q(1,0,1),tx),x11=lerp(q(0,1,1),q(1,1,1),tx);return lerp(lerp(x00,x10,ty),lerp(x01,x11,ty),tz)}
function terrainProfileV1(x,z){
  const continent=fbm(x*.006,z*.006,11,5);
  const regional=fbm(x*.017+31,z*.017-27,91,4);
  const detail=fbm(x*.062-80,z*.062+60,151,3);
  const ridge=1-Math.abs(fbm(x*.012+120,z*.012-90,181,4));
  const mountainMask=Math.max(0,Math.min(1,(regional+continent*.45+.18)*1.45));
  const ridgeLift=Math.pow(Math.max(0,(ridge-.48)/.52),1.65)*mountainMask*23;
  const broadHills=regional*5.2+detail*1.7;
  let y=SEA+5+continent*8.5+broadHills+ridgeLift;
  if(continent<-.22)y-=2+Math.abs(continent+.22)*12;
  const plateau=fbm(x*.009-210,z*.009+160,222,3);
  if(plateau>.48&&continent>.02&&y>SEA+7){
    const stepped=Math.round(y/3)*3;y=lerp(y,stepped,.62);
  }
  const h=Math.max(3,Math.min(TERRAIN_HEIGHT-6,Math.floor(y)));
  return {h,continent,regional,rugged:Math.max(0,(ridge-.43)/.57)*mountainMask};
}
function chooseBiomeV1(h,temp,moist,river,rugged){
  if(river)return 7;if(h<SEA-2)return 6;
  if(rugged>.62&&h>SEA+10)return temp<-.05?4:3;
  if(temp>.30&&moist<-.20)return 2;
  if(temp<-.33&&h>SEA+5)return 4;
  if(temp<-.20)return 3;
  if(moist>.42&&h<=SEA+3)return 5;
  if(moist>.12)return 1;
  return 0;
}
function columnInfoV1(x,z){
  const p=terrainProfileV1(x,z);let h=p.h;
  const rf=Math.abs(fbm(x*.019+20,z*.019-18,260,4));
  const width=.030+(fbm(x*.008-50,z*.008+45,275,3)+1)*.010;
  const river=rf<width&&h>SEA-3,riverBank=!river&&rf<width*1.75&&h<=SEA+4;
  if(river)h=Math.min(h,SEA-1);
  const temp=fbm(x*.008+80,z*.008-60,331,4)-h*.0085;
  const moist=fbm(x*.009-42,z*.009+51,441,4);
  return {h,bio:chooseBiomeV1(h,temp,moist,river,p.rugged),river,riverBank,rugged:p.rugged,temp,moist,lake:false};
}

function climateV2(x,z){
  // Domain warping breaks up long repeating stripes and creates larger natural regions.
  const wx=fbm(x*.0042+17,z*.0042-29,1301,3)*72;
  const wz=fbm(x*.0042-53,z*.0042+41,1401,3)*72;
  const X=x+wx,Z=z+wz;
  const continental=fbm(X*.0036,Z*.0036,1501,4);
  const temp=fbm(X*.0062+80,Z*.0062-60,1601,3);
  const moist=fbm(X*.0060-42,Z*.0060+51,1701,3);
  const hills=fbm(X*.014+31,Z*.014-27,1801,3);
  const detail=fbm(x*.052-80,z*.052+60,1901,2);
  const ridge=1-Math.abs(fbm(X*.011+120,Z*.011-90,2001,3));
  const erosion=fbm(X*.009-210,Z*.009+160,2101,3);
  return {X,Z,continental,temp,moist,hills,detail,ridge,erosion};
}
function chooseBiomeV2(c,mountainStrength){
  if(c.continental<-.24)return 6;
  if(mountainStrength>.62)return c.temp<-.08?4:3;
  if(c.moist>.48&&c.continental<.20)return 5;
  if(c.temp>.26&&c.moist<-.08)return 2;
  if(c.temp<-.24)return 3;
  if(c.moist>.10)return 1;
  return 0;
}
function terrainProfileV2(x,z){
  const c=climateV2(x,z);
  const mountainBase=Math.max(0,(c.ridge-.52)/.48);
  const mountainZone=Math.max(0,Math.min(1,(c.hills+.30)*1.25))*Math.max(0,Math.min(1,(c.continental+.35)*1.5));
  const mountainStrength=Math.pow(mountainBase,1.45)*mountainZone;
  let bio=chooseBiomeV2(c,mountainStrength);

  // Each biome has its own terrain character instead of sharing one universal height field.
  let base=SEA+5,amp=2.2,detailAmp=1.0;
  if(bio===0){base=SEA+5;amp=2.0;detailAmp=.9}       // broad plains
  if(bio===1){base=SEA+6;amp=3.4;detailAmp=1.1}       // rolling forest
  if(bio===2){base=SEA+4;amp=1.8;detailAmp=.8}         // flatter desert
  if(bio===3){base=SEA+7;amp=4.6;detailAmp=1.3}        // taiga / high country
  if(bio===4){base=SEA+10;amp=5.5;detailAmp=1.5}       // snowy mountain base
  if(bio===5){base=SEA+2;amp=1.2;detailAmp=.55}        // low swamp
  if(bio===6){base=SEA-5;amp=3.2;detailAmp=.7}         // ocean floor

  let y=base+c.hills*amp+c.detail*detailAmp+c.continental*4.0;
  if(bio===6)y-=Math.max(0,-c.continental-.15)*10;

  if(mountainStrength>.05&&bio!==6&&bio!==5){
    y+=mountainStrength*(18+c.ridge*8);
    if(mountainStrength>.55)bio=c.temp<-.08?4:3;
  }

  // Occasional broad shelves and escarpments make exploration less like smooth noise.
  const shelf=Math.max(0,(c.erosion-.42)/.58);
  if(shelf>.18&&bio!==5&&bio!==6&&mountainStrength<.45){
    const stepped=Math.round(y/2)*2;
    y=lerp(y,stepped,Math.min(.58,shelf*.62));
  }

  const h=Math.max(3,Math.min(TERRAIN_HEIGHT-5,Math.floor(y)));
  return {h,bio,continental:c.continental,rugged:mountainStrength,temp:c.temp,moist:c.moist,X:c.X,Z:c.Z};
}
function columnInfoV2(x,z){
  const p=terrainProfileV2(x,z);let h=p.h,bio=p.bio;
  // Warped river channels cross biome borders.
  const riverField=Math.abs(fbm(p.X*.016+20,p.Z*.016-18,2201,4));
  const riverWidth=.026+(fbm(p.X*.005-50,p.Z*.005+45,2301,2)+1)*.009;
  let river=riverField<riverWidth&&p.continental>-.18&&h>SEA-3;

  // Small inland basins become lakes, especially in plains/forest.
  const basin=fbm(p.X*.020+310,p.Z*.020-270,2401,3);
  const lakeMask=fbm(p.X*.006-140,p.Z*.006+190,2501,2);
  const lake=!river&&p.continental>-.08&&p.continental<.34&&p.rugged<.22&&lakeMask>.46&&basin<-.38&&h<=SEA+7;

  if(river)h=Math.min(h,SEA-1);
  if(lake)h=Math.min(h,SEA-1);
  const riverBank=!river&&!lake&&riverField<riverWidth*1.85&&h<=SEA+5;
  if(lake)bio=p.moist>.18?5:7;
  return {h,bio,river:river||lake,riverBank,rugged:p.rugged,temp:p.temp,moist:p.moist,lake};
}

function climateV3(x,z){
  // Different scales are warped independently so long straight/repeating bands do not appear.
  const warpX=fbm(x*.0061+12,z*.0061-37,3101,3)*38+fbm(x*.017-71,z*.017+53,3111,2)*10;
  const warpZ=fbm(x*.0061-44,z*.0061+29,3121,3)*38+fbm(x*.017+61,z*.017-47,3131,2)*10;
  const X=x+warpX,Z=z+warpZ;
  return {
    X,Z,
    continental:fbm(X*.0047,Z*.0047,3201,4),
    temp:fbm(X*.010+80,Z*.010-60,3211,3),
    moist:fbm(X*.010-42,Z*.010+51,3221,3),
    region:fbm(X*.013+31,Z*.013-27,3231,3),
    rolling:fbm(X*.030-80,Z*.030+60,3241,3),
    detail:fbm(x*.078+19,z*.078-23,3251,2),
    ridge:1-Math.abs(fbm(X*.015+120,Z*.015-90,3261,3)),
    erosion:fbm(X*.020-210,Z*.020+160,3271,2)
  };
}
function chooseBiomeV3(c,mountain){
  if(c.continental<-.27)return 6;
  if(mountain>.58)return c.temp<-.04?4:3;
  if(c.moist>.50&&c.continental<.18)return 5;
  if(c.temp>.28&&c.moist<-.10)return 2;
  if(c.temp<-.30)return 3;
  if(c.moist>.12)return 1;
  return 0;
}
function terrainProfileV3(x,z){
  const c=climateV3(x,z);
  const ridgeShape=Math.pow(Math.max(0,(c.ridge-.50)/.50),1.55);
  const mountainZone=Math.max(0,Math.min(1,(c.region+.22)*1.35))*Math.max(0,Math.min(1,(c.continental+.28)*1.7));
  const mountain=ridgeShape*mountainZone;
  let bio=chooseBiomeV3(c,mountain);

  let y=SEA+5;
  if(bio===6){
    y=SEA-5+c.region*2.7+c.rolling*1.2-Math.max(0,-c.continental-.18)*9;
  }else if(bio===5){
    y=SEA+2+c.region*.9+c.rolling*.65;
  }else if(bio===2){
    y=SEA+4+c.region*1.5+c.rolling*.9+c.detail*.25;
  }else if(bio===0){
    y=SEA+5+c.region*1.8+c.rolling*1.15+c.detail*.35;
  }else if(bio===1){
    y=SEA+6+c.region*2.7+c.rolling*1.6+c.detail*.45;
  }else if(bio===3){
    y=SEA+7+c.region*3.2+c.rolling*2.1+c.detail*.55;
  }else{
    y=SEA+9+c.region*3.5+c.rolling*2.2+c.detail*.55;
  }

  // Broad hills and mountains blend continuously. No height snapping / artificial terraces.
  if(bio!==6&&bio!==5){
    y+=mountain*(17+c.ridge*9);
    if(mountain>.58)bio=c.temp<-.04?4:3;
  }

  // Natural valleys: erosion lowers broad areas without creating parallel steps.
  const valley=Math.max(0,(-c.erosion-.28)/.72);
  if(bio!==6)y-=valley*(bio===5?1.0:2.3);

  const h=Math.max(3,Math.min(TERRAIN_HEIGHT-5,Math.floor(y)));
  return {h,bio,continental:c.continental,rugged:mountain,temp:c.temp,moist:c.moist,X:c.X,Z:c.Z};
}
function columnInfoV3(x,z){
  const p=terrainProfileV3(x,z);let h=p.h,bio=p.bio;

  const riverField=Math.abs(fbm(p.X*.019+20,p.Z*.019-18,3301,4));
  const riverWidth=.022+(fbm(p.X*.008-50,p.Z*.008+45,3311,2)+1)*.008;
  const river=riverField<riverWidth&&p.continental>-.20&&h>SEA-3;

  const lakeShape=fbm(p.X*.025+310,p.Z*.025-270,3321,3);
  const lakeRegion=fbm(p.X*.010-140,p.Z*.010+190,3331,2);
  const lake=!river&&p.continental>-.10&&p.continental<.30&&p.rugged<.18&&lakeRegion>.52&&lakeShape<-.46&&h<=SEA+6;

  if(river||lake)h=Math.min(h,SEA-1);
  const riverBank=!river&&!lake&&riverField<riverWidth*1.9&&h<=SEA+5;
  if(lake)bio=p.moist>.18?5:7;
  return {h,bio,river:river||lake,riverBank,rugged:p.rugged,temp:p.temp,moist:p.moist,lake};
}


function climateV4(x,z){
  const warpX=fbm(x*.008+17,z*.008-29,4101,3)*30+fbm(x*.026-41,z*.026+63,4111,2)*8;
  const warpZ=fbm(x*.008-53,z*.008+47,4121,3)*30+fbm(x*.026+57,z*.026-35,4131,2)*8;
  const X=x+warpX,Z=z+warpZ;
  const largeTemp=fbm(X*.007+80,Z*.007-60,4201,3);
  const largeMoist=fbm(X*.007-42,Z*.007+51,4211,3);
  return {
    X,Z,
    continental:fbm(X*.0052,Z*.0052,4221,4),
    temp:largeTemp*.72+fbm(X*.020+13,Z*.020-17,4231,2)*.28,
    moist:largeMoist*.72+fbm(X*.020-19,Z*.020+11,4241,2)*.28,
    macro:fbm(X*.011+31,Z*.011-27,4251,3),
    hills:fbm(X*.028-80,Z*.028+60,4261,3),
    local:fbm(x*.072+19,z*.072-23,4271,2),
    micro:fbm(x*.145-9,z*.145+15,4281,2),
    ridge:1-Math.abs(fbm(X*.018+120,Z*.018-90,4291,3)),
    valley:fbm(X*.023-210,Z*.023+160,4301,2)
  };
}
function chooseBiomeV4(c,mountain){
  if(c.continental<-.29)return 6;
  if(mountain>.60)return c.temp<-.06?4:3;
  if(c.moist>.52&&c.continental<.16)return 5;
  if(c.temp>.25&&c.moist<-.10)return 2;
  if(c.temp<-.28)return 3;
  if(c.moist>.08)return 1;
  return 0;
}
function terrainProfileV4(x,z){
  const c=climateV4(x,z);
  const ridge=Math.pow(Math.max(0,(c.ridge-.54)/.46),1.7);
  const mountainZone=Math.max(0,Math.min(1,(c.macro+.20)*1.45))*Math.max(0,Math.min(1,(c.continental+.30)*1.8));
  const mountain=ridge*mountainZone;
  let bio=chooseBiomeV4(c,mountain),y;

  if(bio===6)y=SEA-6+c.macro*2.6+c.hills*1.2-Math.max(0,-c.continental-.16)*8;
  else if(bio===5)y=SEA+2+c.macro*.8+c.hills*.6+c.local*.2;
  else if(bio===2)y=SEA+4+c.macro*1.4+c.hills*.85+c.local*.35+c.micro*.12;
  else if(bio===0)y=SEA+5+c.macro*1.6+c.hills*1.0+c.local*.55+c.micro*.18;
  else if(bio===1)y=SEA+6+c.macro*2.2+c.hills*1.45+c.local*.65+c.micro*.20;
  else if(bio===3)y=SEA+7+c.macro*2.7+c.hills*1.8+c.local*.75+c.micro*.22;
  else y=SEA+9+c.macro*3.0+c.hills*1.9+c.local*.75+c.micro*.22;

  if(bio!==6&&bio!==5){
    y+=mountain*(19+c.ridge*8);
    if(mountain>.60)bio=c.temp<-.06?4:3;
  }

  const valley=Math.max(0,(-c.valley-.30)/.70);
  if(bio!==6)y-=valley*(bio===5?.8:2.0);

  const h=Math.max(3,Math.min(TERRAIN_HEIGHT-5,Math.floor(y)));
  return {h,bio,continental:c.continental,rugged:mountain,temp:c.temp,moist:c.moist,X:c.X,Z:c.Z};
}
function columnInfoV4(x,z){
  const p=terrainProfileV4(x,z);let h=p.h,bio=p.bio;
  const riverField=Math.abs(fbm(p.X*.021+20,p.Z*.021-18,4401,4));
  const riverWidth=.020+(fbm(p.X*.010-50,p.Z*.010+45,4411,2)+1)*.007;
  const river=riverField<riverWidth&&p.continental>-.21&&h>SEA-3;

  const lakeShape=fbm(p.X*.031+310,p.Z*.031-270,4421,3);
  const lakeRegion=fbm(p.X*.013-140,p.Z*.013+190,4431,2);
  const lake=!river&&p.continental>-.10&&p.continental<.30&&p.rugged<.18&&lakeRegion>.50&&lakeShape<-.49&&h<=SEA+6;

  if(river||lake)h=Math.min(h,SEA-1);
  const riverBank=!river&&!lake&&riverField<riverWidth*1.95&&h<=SEA+5;
  if(lake)bio=p.moist>.18?5:7;
  return {h,bio,river:river||lake,riverBank,rugged:p.rugged,temp:p.temp,moist:p.moist,lake};
}

function terrainProfile(x,z){
  if(generatorVersion>=4)return terrainProfileV4(x,z);
  if(generatorVersion>=3)return terrainProfileV3(x,z);
  if(generatorVersion>=2)return terrainProfileV2(x,z);
  return terrainProfileV1(x,z);
}
function columnInfo(x,z){
  if(generatorVersion>=4)return columnInfoV4(x,z);
  if(generatorVersion>=3)return columnInfoV3(x,z);
  if(generatorVersion>=2)return columnInfoV2(x,z);
  return columnInfoV1(x,z);
}
const surfaceAt=(x,z)=>columnInfo(x,z).h;
const biomeAt=(x,z)=>columnInfo(x,z).bio;

function blockFromInfo(x,y,z,info){
  const {h,bio,river,riverBank,rugged}=info;
  if(y<Y_MIN||y>WORLD_TOP)return B.AIR;
  if(y>h)return y<=SEA?B.WATER:B.AIR;
  if(y===Y_MIN)return B.BEDROCK;

  let id=B.STONE;
  const beach=h<=SEA+1;
  const exposedRock=(rugged>.48&&h>SEA+7);
  if(y>=h-3){
    if(river){
      id=y===h?(hash2(x,z,seed+602)>.48?B.GRAVEL:B.SAND):B.SAND;
    }else if(beach||riverBank||bio===2||bio===6){
      id=B.SAND;
    }else if(exposedRock&&y>=h-1){
      id=B.STONE;
    }else if(bio===4&&y===h){
      id=B.SNOW;
    }else{
      id=y===h?B.GRASS:B.DIRT;
    }
  }

  if(y>2&&y<h-3){
    const c=noise3(x*.092,y*.115,z*.092,810)*.66+noise3(x*.185,y*.18,z*.185,1210)*.34;
    if(c>.535&&y<SEA+13)id=B.AIR;
  }
  if(id===B.STONE){
    const r=hash3(x,y,z,seed+5100);
    // Deep mining now matters: diamond near bedrock, gold at middle-deep
    // levels, and iron underground. Above-ground ore no longer appears.
    if(y<=-56&&r>.986)id=B.DIAMOND;
    else if(y<=-25&&r>.974)id=B.GOLD;
    else if(y<=8&&r>.955)id=B.IRON;
    else if(r>.932)id=B.COAL;
    else if(r<.018)id=B.GRAVEL;
  }
  return id;
}
function baseBlockAt(x,y,z){return blockFromInfo(x,y,z,columnInfo(x,z))}
function featureCellRoot(x,z,spacing,salt){
  const cx=Math.floor(x/spacing),cz=Math.floor(z/spacing);
  const ox=Math.floor(hash3(cx,1,cz,seed+salt)*spacing);
  const oz=Math.floor(hash3(cx,2,cz,seed+salt+17)*spacing);
  return x===cx*spacing+ox&&z===cz*spacing+oz;
}
function naturalScatterRoot(x,z,radius,salt,minScore=.0){
  const score=hash2(x,z,seed+salt);
  if(score<minScore)return false;
  const rr=radius*radius;
  for(let dx=-radius;dx<=radius;dx++)for(let dz=-radius;dz<=radius;dz++){
    if(dx===0&&dz===0)continue;
    if(dx*dx+dz*dz>rr)continue;
    if(hash2(x+dx,z+dz,seed+salt)>score)return false;
  }
  return true;
}
function isTreeRoot(x,z,info){
  if(info.h<SEA+1||info.river||info.riverBank||info.rugged>.72)return false;
  const cluster=fbm(x*.020+70,z*.020-55,710,3);
  if(generatorVersion<2){
    if(info.bio===1)return cluster>-.18&&featureCellRoot(x,z,5,721)&&hash2(x,z,seed+722)>.12;
    if(info.bio===3)return cluster>-.28&&featureCellRoot(x,z,6,731)&&hash2(x,z,seed+732)>.10;
    if(info.bio===0)return cluster>.48&&featureCellRoot(x,z,9,741)&&hash2(x,z,seed+742)>.35;
    if(info.bio===5)return cluster>.30&&featureCellRoot(x,z,8,751)&&hash2(x,z,seed+752)>.25;
    return false;
  }
  if(generatorVersion===2){
    if(info.bio===1)return cluster>-.05&&featureCellRoot(x,z,4,721)&&hash2(x,z,seed+722)>.16;
    if(info.bio===3)return cluster>-.20&&featureCellRoot(x,z,5,731)&&hash2(x,z,seed+732)>.12;
    if(info.bio===0)return cluster>.56&&featureCellRoot(x,z,11,741)&&hash2(x,z,seed+742)>.42;
    if(info.bio===5)return cluster>.18&&featureCellRoot(x,z,7,751)&&hash2(x,z,seed+752)>.28;
    return false;
  }

  if(generatorVersion===3){
    if(info.bio===1)return cluster>-.12&&naturalScatterRoot(x,z,2,721,.30);
    if(info.bio===3)return cluster>-.18&&naturalScatterRoot(x,z,2,731,.26);
    if(info.bio===0)return cluster>.52&&naturalScatterRoot(x,z,4,741,.38);
    if(info.bio===5)return cluster>.18&&naturalScatterRoot(x,z,3,751,.32);
    return false;
  }
  // V4 keeps forests readable: clumps exist, but there are large gaps and plains are genuinely open.
  if(info.bio===1)return cluster>-.08&&naturalScatterRoot(x,z,3,721,.36);
  if(info.bio===3)return cluster>-.15&&naturalScatterRoot(x,z,3,731,.32);
  if(info.bio===0)return cluster>.60&&naturalScatterRoot(x,z,5,741,.48);
  if(info.bio===5)return cluster>.24&&naturalScatterRoot(x,z,4,751,.40);
  return false;
}
function isBoulderRoot(x,z,info){
  if(info.h<=SEA+1||info.river||info.bio===2||info.bio===6||info.bio===7)return false;
  const rocky=info.rugged>.26||fbm(x*.031-90,z*.031+105,760,3)>.52;
  if(!rocky)return false;
  if(generatorVersion>=3)return naturalScatterRoot(x,z,5,761,.48);
  return featureCellRoot(x,z,12,761)&&hash2(x,z,seed+762)>.38;
}

function writeGenerated(data,cx,cz,x,y,z,id){
  if(y<Y_MIN||y>WORLD_TOP||chunkCoord(x)!==cx||chunkCoord(z)!==cz)return;
  data[cIndex(localCoord(x),y,localCoord(z))]=id;
}
function* generateChunkSteps(cx,cz){
  const data=new Uint8Array(CHUNK*HEIGHT*CHUNK);
  const x0=cx*CHUNK,z0=cz*CHUNK;
  const infoCache=new Map();
  const getInfo=(x,z)=>{
    const k=x+','+z;
    let info=infoCache.get(k);
    if(!info){info=columnInfo(x,z);infoCache.set(k,info)}
    return info;
  };

  // Compute each column once; richer terrain stays fast enough for streaming.
  for(let lx=0;lx<CHUNK;lx++){
    for(let lz=0;lz<CHUNK;lz++){
      const x=x0+lx,z=z0+lz,info=getInfo(x,z);
      for(let y=Y_MIN;y<=WORLD_TOP;y++)data[cIndex(lx,y,lz)]=blockFromInfo(x,y,z,info);
    }
    yield; // Pause after each terrain slice when streaming.
  }

  // Natural surface features are generated from deterministic roots with margins,
  // so they line up across chunk boundaries.
  for(let x=x0-3;x<x0+CHUNK+3;x++){
    for(let z=z0-3;z<z0+CHUNK+3;z++){
    const info=getInfo(x,z),h=info.h;

    if(isTreeRoot(x,z,info)&&blockFromInfo(x,h,z,info)!==B.SAND){
      const hv=hash2(x,z,seed+805);
      const tall=info.bio===3?5+Math.floor(hv*3):4+Math.floor(hv*2);

      for(let y=1;y<=tall;y++)writeGenerated(data,cx,cz,x,h+y,z,B.LOG);

      if(info.bio===3){
        // Narrow conifer-style crown.
        for(let dy=tall-2;dy<=tall+2;dy++){
          const radius=dy>=tall+1?1:dy===tall?1:2;
          for(let dx=-radius;dx<=radius;dx++)for(let dz=-radius;dz<=radius;dz++){
            if(Math.abs(dx)+Math.abs(dz)>radius+1)continue;
            const tx=x+dx,ty=h+dy,tz=z+dz;
            if(chunkCoord(tx)===cx&&chunkCoord(tz)===cz&&inside(tx,ty,tz)){
              const i=cIndex(localCoord(tx),ty,localCoord(tz));
              if(data[i]===B.AIR)data[i]=B.LEAF;
            }
          }
        }
      }else{
        // Rounded broadleaf crown with a little asymmetry.
        for(let dx=-2;dx<=2;dx++)for(let dz=-2;dz<=2;dz++)for(let dy=tall-1;dy<=tall+2;dy++){
          const wobble=hash3(x+dx,dy,z+dz,seed+806)>.12;
          if(!wobble||Math.abs(dx)+Math.abs(dz)+(dy===tall+2?2:0)>5)continue;
          const tx=x+dx,ty=h+dy,tz=z+dz;
          if(chunkCoord(tx)===cx&&chunkCoord(tz)===cz&&inside(tx,ty,tz)){
            const i=cIndex(localCoord(tx),ty,localCoord(tz));
            if(data[i]===B.AIR)data[i]=B.LEAF;
          }
        }
      }
    }

    const cactusRoot=generatorVersion>=3
      ? naturalScatterRoot(x,z,3,900,.54)
      : featureCellRoot(x,z,7,900)&&hash2(x,z,seed+901)>.52;
    if(info.bio===2&&cactusRoot){
      const n=2+Math.floor(hash2(x,z,seed+902)*3);
      for(let y=1;y<=n;y++)writeGenerated(data,cx,cz,x,h+y,z,B.CACTUS);
    }

    if(isBoulderRoot(x,z,info)){
      const rock=hash2(x,z,seed+770)>.55?B.COBBLE:B.STONE;
      writeGenerated(data,cx,cz,x,h+1,z,rock);
      if(hash2(x,z,seed+771)>.35)writeGenerated(data,cx,cz,x+1,h+1,z,rock);
      if(hash2(x,z,seed+772)>.50)writeGenerated(data,cx,cz,x,h+1,z+1,rock);
      if(hash2(x,z,seed+773)>.67)writeGenerated(data,cx,cz,x,h+2,z,rock);
    }
    }
    yield; // Pause after each surface feature slice.
  }

  const edits=editChunks.get(chunkKey(cx,cz));
  if(edits)for(const [i,v] of edits)data[i]=v;
  return {cx,cz,data};
}
function generateChunk(cx,cz){
  const iter=generateChunkSteps(cx,cz);
  let n=iter.next();while(!n.done)n=iter.next();
  return n.value;
}
function ensureChunk(cx,cz){
  const k=chunkKey(cx,cz);
  let c=chunks.get(k);
  if(!c){c=generateChunk(cx,cz);chunks.set(k,c)}
  return c;
}
function getLoaded(x,y,z){
  if(y<Y_MIN)return B.BEDROCK;
  if(y>WORLD_TOP)return B.AIR;
  const c=chunks.get(chunkKey(chunkCoord(x),chunkCoord(z)));
  // Avoid drawing entire -80..-1 stone cliffs at the edge of loaded chunks.
  // An unloaded neighboring underground chunk is solid until streamed in.
  return c?c.data[cIndex(localCoord(x),y,localCoord(z))]:(y<0?B.STONE:B.AIR);
}
function get(x,y,z){
  if(y<Y_MIN)return B.BEDROCK;
  if(y>WORLD_TOP)return B.AIR;
  const cx=chunkCoord(x),cz=chunkCoord(z),c=chunks.get(chunkKey(cx,cz));
  if(c)return c.data[cIndex(localCoord(x),y,localCoord(z))];
  const edits=editChunks.get(chunkKey(cx,cz)),i=cIndex(localCoord(x),y,localCoord(z));
  if(edits&&edits.has(i))return edits.get(i);
  return baseBlockAt(x,y,z);
}
function set(x,y,z,v){
  if(!inside(x,y,z))return;
  const cx=chunkCoord(x),cz=chunkCoord(z),c=ensureChunk(cx,cz),i=cIndex(localCoord(x),y,localCoord(z));
  c.data[i]=v;
  const k=chunkKey(cx,cz);
  let edits=editChunks.get(k);
  if(!edits){edits=new Map();editChunks.set(k,edits)}
  edits.set(i,v);
  markSaveDirty();
  if(multiRole&&!multiApplying&&multiplayerNetwork.connected)multiplayerNetwork.send({t:'block',x,y,z,v});
}
// Outer terrain is streamed across frames instead of blocking input.
const pendingChunkLoads=[],dirtyMeshKeys=new Set();
let pendingChunkJob=null,wantedChunkKeys=new Set();
function queueMeshNear(cx,cz){
  for(const [dx,dz] of [[0,0],[1,0],[-1,0],[0,1],[0,-1]]){
    const k=chunkKey(cx+dx,cz+dz);
    if(chunks.has(k))dirtyMeshKeys.add(k);
  }
}
function streamChunks(force=false){
  const cx=chunkCoord(Math.floor(player.pos.x)),cz=chunkCoord(Math.floor(player.pos.z));
  if(!force&&cx===streamCX&&cz===streamCZ)return false;
  streamCX=cx;streamCZ=cz;
  const wanted=new Set(),missing=[];
  for(let dx=-RENDER_RADIUS;dx<=RENDER_RADIUS;dx++)for(let dz=-RENDER_RADIUS;dz<=RENDER_RADIUS;dz++)
    wanted.add(chunkKey(cx+dx,cz+dz));
  wantedChunkKeys=wanted;
  for(const [k,c] of [...chunks]){
    if(wanted.has(k))continue;
    removeChunkMeshes(c);chunks.delete(k);dirtyMeshKeys.delete(k);
    queueMeshNear(c.cx,c.cz);
  }
  if(pendingChunkJob&&!wanted.has(chunkKey(pendingChunkJob.cx,pendingChunkJob.cz)))pendingChunkJob=null;
  if(force){
    // Initial world / respawn: nearby 3x3 is needed immediately for collision.
    for(let dx=-1;dx<=1;dx++)for(let dz=-1;dz<=1;dz++){
      ensureChunk(cx+dx,cz+dz);dirtyMeshKeys.add(chunkKey(cx+dx,cz+dz));
    }
    for(const k of [...dirtyMeshKeys]){
      const c=chunks.get(k);if(c)rebuildChunkMesh(c);dirtyMeshKeys.delete(k);
    }
  }
  for(let dx=-RENDER_RADIUS;dx<=RENDER_RADIUS;dx++)for(let dz=-RENDER_RADIUS;dz<=RENDER_RADIUS;dz++){
    const x=cx+dx,z=cz+dz,k=chunkKey(x,z);
    if(!chunks.has(k)&&(!pendingChunkJob||chunkKey(pendingChunkJob.cx,pendingChunkJob.cz)!==k))
      missing.push({cx:x,cz:z,distance:dx*dx+dz*dz});
  }
  missing.sort((a,b)=>a.distance-b.distance);
  pendingChunkLoads.length=0;pendingChunkLoads.push(...missing);
  // An already-rendered chunk can move into shadow range as the player walks.
  // Reflagging existing meshes is cheap; no geometry rebuild is needed.
  for(const c of chunks.values()){
    const near=Math.abs(c.cx-cx)<=1&&Math.abs(c.cz-cz)<=1;
    for(const m of c.renderMeshes||[])
      m.castShadow=near&&m.userData.id!==B.WATER&&m.userData.id!==B.GLASS;
  }
  return true;
}
function processChunkStreaming(){
  if(dirtyMeshKeys.size){
    const k=dirtyMeshKeys.values().next().value;dirtyMeshKeys.delete(k);
    const c=chunks.get(k);if(c)rebuildChunkMesh(c);
    return;
  }
  if(!pendingChunkJob){
    while(pendingChunkLoads.length){
      const task=pendingChunkLoads.shift(),k=chunkKey(task.cx,task.cz);
      if(!wantedChunkKeys.has(k)||chunks.has(k))continue;
      pendingChunkJob={...task,steps:generateChunkSteps(task.cx,task.cz)};
      break;
    }
  }
  if(!pendingChunkJob)return;
  const job=pendingChunkJob,now=performance.now();
  do{
    const next=job.steps.next();
    if(next.done){
      const k=chunkKey(job.cx,job.cz);
      if(wantedChunkKeys.has(k)&&!chunks.has(k)){
        chunks.set(k,next.value);queueMeshNear(job.cx,job.cz);
      }
      pendingChunkJob=null;break;
    }
  }while(performance.now()-now<3);
}

function tex(rgb,noise=.12,pattern=''){const c=document.createElement('canvas');c.width=c.height=16;const g=c.getContext('2d');for(let y=0;y<16;y++)for(let x=0;x<16;x++){const n=(hash3(x,y,pattern.length,12345)-.5)*noise*255;g.fillStyle=`rgb(${Math.max(0,Math.min(255,rgb[0]+n))|0},${Math.max(0,Math.min(255,rgb[1]+n))|0},${Math.max(0,Math.min(255,rgb[2]+n))|0})`;g.fillRect(x,y,1,1)}if(pattern==='grassSide'){g.fillStyle='#43883d';g.fillRect(0,0,16,4)}if(pattern==='log'){g.fillStyle='rgba(60,35,18,.3)';for(let x=2;x<16;x+=4)g.fillRect(x,0,1,16)}if(pattern.startsWith('ore')){const color=pattern==='oreC'?'#222':pattern==='oreI'?'#b78669':pattern==='oreG'?'#e4b935':'#43cad0';g.fillStyle=color;[[3,4],[11,3],[7,8],[13,11],[4,13]].forEach(([x,y])=>g.fillRect(x,y,2,2))}if(pattern==='plank'){g.fillStyle='rgba(70,43,20,.32)';for(let y=3;y<16;y+=4)g.fillRect(0,y,16,1)}if(pattern==='cobble'){g.strokeStyle='rgba(20,20,20,.28)';g.strokeRect(1.5,1.5,6,5);g.strokeRect(8.5,2.5,6,5);g.strokeRect(4.5,8.5,8,6)}
if(pattern==='craft'){g.strokeStyle='#5f3d20';g.lineWidth=2;g.strokeRect(2,2,12,12);g.beginPath();g.moveTo(8,2);g.lineTo(8,14);g.moveTo(2,8);g.lineTo(14,8);g.stroke();g.fillStyle='#d6a267';g.fillRect(5,5,6,6)}
if(pattern==='furnace'){g.fillStyle='#3c3c3c';g.fillRect(3,4,10,4);g.fillStyle='#1f1f1f';g.fillRect(4,10,8,4);g.fillStyle='#8b5a2b';g.fillRect(5,11,6,2)}
if(pattern==='bedFootTop'){
  g.fillStyle='#c82d36';g.fillRect(0,0,16,16);
  g.fillStyle='#e9555d';g.fillRect(1,1,14,3);
  g.fillStyle='#a92028';g.fillRect(0,12,16,4);
  g.fillStyle='#8d1b22';g.fillRect(0,15,16,1);
}
if(pattern==='bedHeadTop'){
  // Make the whole head-half a pillow so BoxGeometry UV rotation cannot leave it on one side.
  g.fillStyle='#e5e1d8';g.fillRect(0,0,16,16);
  g.fillStyle='#f5f2ea';g.fillRect(1,1,14,14);
  g.fillStyle='#ffffff';g.fillRect(2,2,12,3);
  g.fillStyle='#d1ccc1';g.fillRect(1,13,14,2);
  g.fillStyle='#c3beb3';g.fillRect(0,15,16,1);
}
if(pattern==='bedSide'){
  g.fillStyle='#c82d36';g.fillRect(0,0,16,8);
  g.fillStyle='#9d2027';g.fillRect(0,7,16,2);
  g.fillStyle='#744724';g.fillRect(0,9,16,4);
  g.fillStyle='#4c2e19';g.fillRect(1,13,3,3);g.fillRect(12,13,3,3);
  g.fillStyle='#9a6636';g.fillRect(0,9,16,1);
}
if(pattern==='bedEnd'){
  g.fillStyle='#c82d36';g.fillRect(0,0,16,8);
  g.fillStyle='#9d2027';g.fillRect(0,7,16,2);
  g.fillStyle='#744724';g.fillRect(0,9,16,5);
  g.fillStyle='#4c2e19';g.fillRect(1,13,3,3);g.fillRect(12,13,3,3);
}
if(pattern==='bedBottom'){
  g.fillStyle='#5b371f';g.fillRect(0,0,16,16);
  g.fillStyle='#7a4b29';g.fillRect(2,2,12,12);
}
const t=new THREE.CanvasTexture(c);t.magFilter=THREE.NearestFilter;t.minFilter=THREE.NearestFilter;t.colorSpace=THREE.SRGBColorSpace;return t}
const T={grass:tex([92,159,64],.15),grassSide:tex([121,88,52],.15,'grassSide'),dirt:tex([125,86,54],.16),stone:tex([124,126,128],.12),sand:tex([215,200,140],.08),log:tex([113,79,44],.14,'log'),leaf:tex([59,120,52],.19),coal:tex([119,121,122],.11,'oreC'),iron:tex([119,121,122],.11,'oreI'),gold:tex([119,121,122],.11,'oreG'),diamond:tex([119,121,122],.11,'oreD'),snow:tex([238,242,245],.03),gravel:tex([116,110,108],.18),cactus:tex([57,126,55],.1),plank:tex([167,120,70],.1,'plank'),cobble:tex([102,105,106],.16,'cobble'),bedrock:tex([55,57,58],.24),craft:tex([164,113,62],.10,'craft'),furnace:tex([112,114,114],.14,'furnace'),
bedFootTop:tex([194,45,53],.02,'bedFootTop'),
bedHeadTop:tex([194,45,53],.02,'bedHeadTop'),
bedSide:tex([126,67,35],.02,'bedSide'),
bedEnd:tex([126,67,35],.02,'bedEnd'),
bedBottom:tex([92,56,31],.02,'bedBottom')};
const L=t=>new THREE.MeshLambertMaterial({map:t});
const grassSide=L(T.grassSide),dirt=L(T.dirt),grass=L(T.grass),stone=L(T.stone),sand=L(T.sand),log=L(T.log);
const leaf=new THREE.MeshLambertMaterial({map:T.leaf,transparent:true,opacity:.92}),water=new THREE.MeshLambertMaterial({color:0x397bc6,transparent:true,opacity:.58,depthWrite:false}),glass=new THREE.MeshLambertMaterial({color:0xcce8ee,transparent:true,opacity:.32,depthWrite:false});
const bedSide=L(T.bedSide),bedEnd=L(T.bedEnd),bedBottom=L(T.bedBottom),bedFootTop=L(T.bedFootTop),bedHeadTop=L(T.bedHeadTop);
const bedFootMaterials=[bedSide,bedSide,bedFootTop,bedBottom,bedEnd,bedEnd];
const bedHeadMaterials=[bedSide,bedSide,bedHeadTop,bedBottom,bedEnd,bedEnd];
const M={[B.GRASS]:[grassSide,grassSide,grass,dirt,grassSide,grassSide],[B.DIRT]:dirt,[B.STONE]:stone,[B.SAND]:sand,[B.WATER]:water,[B.LOG]:log,[B.LEAF]:leaf,[B.COAL]:L(T.coal),[B.IRON]:L(T.iron),[B.GOLD]:L(T.gold),[B.DIAMOND]:L(T.diamond),[B.SNOW]:L(T.snow),[B.GRAVEL]:L(T.gravel),[B.CACTUS]:L(T.cactus),[B.PLANK]:L(T.plank),[B.COBBLE]:L(T.cobble),[B.GLASS]:glass,[B.BEDROCK]:L(T.bedrock),[B.CRAFTING_TABLE]:L(T.craft),[B.FURNACE]:L(T.furnace),[B.BED]:bedFootMaterials,[B.BED_HEAD]:bedHeadMaterials};
const box=new THREE.BoxGeometry(1,1,1),bedBox=new THREE.BoxGeometry(1,.5,1);
let meshes=[],lookup=new Map();
const neighborVectors=[[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]];
function removeChunkMeshes(c){
  if(!c.renderMeshes?.length)return;
  const removed=new Set(c.renderMeshes);
  for(const m of removed){
    scene.remove(m);lookup.delete(m.uuid);m.dispose();
  }
  meshes=meshes.filter(m=>!removed.has(m));c.renderMeshes=[];
}
function rebuildChunkMesh(c){
  removeChunkMeshes(c);
  const groups={};Object.keys(M).forEach(k=>groups[k]=[]);
  const data=c.data,x0=c.cx*CHUNK,z0=c.cz*CHUNK;
  for(let y=Y_MIN;y<=WORLD_TOP;y++)for(let lz=0;lz<CHUNK;lz++)for(let lx=0;lx<CHUNK;lx++){
    const id=data[cIndex(lx,y,lz)];if(id===B.AIR)continue;
    const x=x0+lx,z=z0+lz;let visible=false;
    for(const [dx,dy,dz] of neighborVectors){
      const nx=lx+dx,ny=y+dy,nz=lz+dz;
      const b=(nx>=0&&nx<CHUNK&&nz>=0&&nz<CHUNK&&ny>=Y_MIN&&ny<=WORLD_TOP)
        ?data[cIndex(nx,ny,nz)]:getLoaded(x+dx,ny,z+dz);
      if(id===B.WATER?b!==B.WATER:b===B.AIR||b===B.WATER||b===B.GLASS){visible=true;break}
    }
    if(visible)groups[id].push({x,y,z});
  }
  const dummy=new THREE.Object3D(),built=[];
  for(const key in groups){
    const id=+key,p=groups[id];if(!p.length)continue;
    const geo=(id===B.BED||id===B.BED_HEAD)?bedBox:box;
    const m=new THREE.InstancedMesh(geo,M[id],p.length);
    m.userData.id=id;
    // Shadows are expensive on mobile. Nearby terrain keeps its shadows.
    m.castShadow=id!==B.WATER&&id!==B.GLASS&&Math.abs(c.cx-streamCX)<=1&&Math.abs(c.cz-streamCZ)<=1;
    m.receiveShadow=id!==B.WATER;
    p.forEach((v,i)=>{
      dummy.position.set(v.x,(id===B.BED||id===B.BED_HEAD)?v.y-.25:v.y,v.z);
      dummy.updateMatrix();m.setMatrixAt(i,dummy.matrix);
    });
    scene.add(m);meshes.push(m);lookup.set(m.uuid,p);built.push(m);
  }
  c.renderMeshes=built;
}
function rebuildEdited(...positions){
  const affected=new Set();
  for(const {x,z} of positions){
    const cx=chunkCoord(x),cz=chunkCoord(z),lx=localCoord(x),lz=localCoord(z);
    affected.add(chunkKey(cx,cz));
    if(lx===0)affected.add(chunkKey(cx-1,cz));
    if(lx===CHUNK-1)affected.add(chunkKey(cx+1,cz));
    if(lz===0)affected.add(chunkKey(cx,cz-1));
    if(lz===CHUNK-1)affected.add(chunkKey(cx,cz+1));
  }
  for(const k of affected){
    dirtyMeshKeys.delete(k);
    const c=chunks.get(k);if(c)rebuildChunkMesh(c);
  }
}

const mobs=[];
const mobMaterials=new Map();
function mobMat(color){
  const key=String(color);
  if(!mobMaterials.has(key))mobMaterials.set(key,new THREE.MeshLambertMaterial({color}));
  return mobMaterials.get(key);
}
function cube(g,sx,sy,sz,color,x,y,z,rx=0,ry=0,rz=0){
  const m=new THREE.Mesh(new THREE.BoxGeometry(sx,sy,sz),mobMat(color));
  m.position.set(x,y,z);m.rotation.set(rx,ry,rz);m.castShadow=true;m.receiveShadow=true;g.add(m);return m
}
function voxelPatch(g,color,x,y,z,sx,sy,sz){return cube(g,sx,sy,sz,color,x,y,z)}

function buildSheep(){
  const g=new THREE.Group();
  const wool=0xf2efe6,woolLight=0xfffdf7,woolShade=0xd9d4c8,skin=0xd8c6aa,ear=0xe8b0a3,eye=0x171717,nose=0xd98987,hoof=0x4a3b35;

  // About 1 block wide and under 2 blocks long overall.
  cube(g,.96,.74,1.10,wool,0,1.00,.02);
  cube(g,.86,.16,1.16,woolLight,0,1.40,.02);
  for(const x of[-.29,0,.29])for(const z of[-.36,0,.36]){
    cube(g,.24,.18,.28,(x===0?woolLight:woolShade),x,1.37,z);
  }

  // head
  cube(g,.58,.58,.50,skin,0,1.08,-.78);
  cube(g,.66,.20,.57,woolLight,0,1.40,-.77);
  cube(g,.16,.22,.16,woolShade,-.23,1.45,-.88);
  cube(g,.16,.22,.16,woolShade,.23,1.45,-.88);

  // ears
  cube(g,.20,.16,.12,skin,-.35,1.18,-.79,0,0,.14);
  cube(g,.20,.16,.12,skin,.35,1.18,-.79,0,0,-.14);
  cube(g,.11,.09,.07,ear,-.36,1.18,-.86,0,0,.14);
  cube(g,.11,.09,.07,ear,.36,1.18,-.86,0,0,-.14);

  // face
  cube(g,.09,.14,.035,eye,-.15,1.19,-1.045);
  cube(g,.09,.14,.035,eye,.15,1.19,-1.045);
  cube(g,.18,.11,.055,nose,0,1.03,-1.05);
  cube(g,.07,.06,.06,0x7a514a,0,.96,-1.055);

  // legs
  for(const x of[-.29,.29])for(const z of[-.36,.36]){
    cube(g,.20,.50,.20,skin,x,.47,z);
    cube(g,.22,.14,.22,hoof,x,.17,z);
  }
  return g;
}

function buildPig(){
  const g=new THREE.Group();
  const pink=0xef8f95,pinkLight=0xf6a4a9,pinkShade=0xd96f78,snout=0xf3a0a2,nostril=0x70464a,eye=0x171717,hoof=0x5b3c3e;

  // slimmer body, longer front-to-back silhouette
  cube(g,.95,.68,1.12,pink,0,.94,.02);
  cube(g,.84,.14,1.16,pinkLight,0,1.31,.02);

  // head
  cube(g,.60,.56,.50,pinkLight,0,1.03,-.80);
  cube(g,.36,.22,.14,snout,0,.96,-1.095);
  cube(g,.07,.07,.035,nostril,-.10,.96,-1.175);
  cube(g,.07,.07,.035,nostril,.10,.96,-1.175);
  cube(g,.08,.13,.035,eye,-.15,1.17,-1.045);
  cube(g,.08,.13,.035,eye,.15,1.17,-1.045);

  // ears
  cube(g,.20,.25,.11,pinkShade,-.27,1.34,-.80,0,0,-.10);
  cube(g,.20,.25,.11,pinkShade,.27,1.34,-.80,0,0,.10);

  // legs
  for(const x of[-.29,.29])for(const z of[-.37,.37]){
    cube(g,.20,.46,.20,pinkShade,x,.44,z);
    cube(g,.22,.13,.22,hoof,x,.17,z);
  }

  // curled tail
  cube(g,.10,.10,.20,pinkShade,.35,1.02,.62);
  cube(g,.10,.22,.10,pinkShade,.35,1.12,.73);
  cube(g,.17,.10,.10,pinkShade,.28,1.22,.73);
  return g;
}

function buildCow(){
  const g=new THREE.Group();
  const brown=0x744a32,brownDark=0x4f3024,white=0xf1eee5,cream=0xd9c6aa,pink=0xd88f91,eye=0x141414,hoof=0x292525,horn=0xcab489;

  // roughly one block wide, just under two blocks long overall
  cube(g,1.00,.76,1.20,brown,0,1.02,.03);

  // patches adjusted to the slimmer, longer body
  voxelPatch(g,white,-.27,1.22,-.34,.34,.28,.04);
  voxelPatch(g,white,.25,1.08,.50,.30,.34,.04);
  voxelPatch(g,white,-.03,1.40,.06,.42,.07,.56);
  voxelPatch(g,white,.48,1.03,.05,.04,.40,.44);

  // head + muzzle
  cube(g,.62,.60,.54,brownDark,0,1.10,-.84);
  voxelPatch(g,white,-.15,1.22,-1.125,.23,.30,.035);
  cube(g,.40,.23,.16,cream,0,.98,-1.145);
  cube(g,.07,.07,.035,0x4b3a33,-.11,.98,-1.235);
  cube(g,.07,.07,.035,0x4b3a33,.11,.98,-1.235);
  cube(g,.08,.13,.035,eye,-.16,1.23,-1.115);
  cube(g,.08,.13,.035,eye,.16,1.23,-1.115);

  // ears
  cube(g,.22,.16,.13,brown,-.37,1.27,-.84,0,0,.14);
  cube(g,.22,.16,.13,brown,.37,1.27,-.84,0,0,-.14);
  cube(g,.11,.07,.07,pink,-.38,1.27,-.91);
  cube(g,.11,.07,.07,pink,.38,1.27,-.91);

  // horns
  cube(g,.11,.22,.11,horn,-.22,1.50,-.85,0,0,-.14);
  cube(g,.11,.22,.11,horn,.22,1.50,-.85,0,0,.14);

  // legs
  for(const x of[-.31,.31])for(const z of[-.40,.40]){
    cube(g,.22,.52,.22,brown,x,.47,z);
    cube(g,.23,.16,.23,white,x,.24,z);
    cube(g,.24,.12,.24,hoof,x,.12,z);
  }

  // udder + tail
  cube(g,.32,.14,.28,pink,0,.57,.30);
  cube(g,.10,.40,.10,brownDark,0,1.00,.68,0,0,.10);
  cube(g,.15,.15,.15,hoof,0,.75,.78);
  return g;
}

// Night-time hostile mob: a green version of the player silhouette.
// Face points along local -Z. Both arms are kept in front, even while moving.
const ZOMBIE_LIMIT=7,ZOMBIE_AGGRO_RANGE=28,ZOMBIE_ATTACK_RANGE=1.35;
let zombieSpawnCooldown=1,nightZombieWaveStarted=false;
function buildZombie(){
  const g=new THREE.Group();
  const skin=0x6fbf5f,skinLight=0x8bd275,skinDark=0x447c3c;
  const shirt=0x4e9848,shirtLight=0x69af60,shirtDark=0x397438;
  const pants=0x386c3e,pantsShade=0x2a5732,boots=0x23492a,sole=0x1d3724;
  const eyes=0xddebc9,eyeDark=0x202d20;

  // Same short head / tall torso / blocky limbs as the player avatar.
  cube(g,.66,.52,.53,skin,0,1.53,0);
  cube(g,.66,.10,.53,skinLight,0,1.75,0);
  cube(g,.08,.10,.027,eyes,-.16,1.53,-.281);
  cube(g,.08,.10,.027,eyes,.16,1.53,-.281);
  cube(g,.04,.06,.030,eyeDark,-.16,1.53,-.298);
  cube(g,.04,.06,.030,eyeDark,.16,1.53,-.298);
  cube(g,.18,.045,.03,skinDark,0,1.40,-.285);

  cube(g,.74,.85,.42,shirt,0,1.00,0);
  cube(g,.69,.10,.44,shirtLight,0,1.37,0);
  cube(g,.12,.60,.025,shirtDark,0,1.00,-.224);

  const leftArm=new THREE.Group(),rightArm=new THREE.Group();
  const leftLeg=new THREE.Group(),rightLeg=new THREE.Group();
  for(const [side,arm,leg] of [[-1,leftArm,leftLeg],[1,rightArm,rightLeg]]){
    arm.position.set(side*.36,1.30,0);
    cube(arm,.255,.45,.35,shirt,0,-.22,0);
    cube(arm,.262,.12,.36,shirtDark,0,-.47,0);
    cube(arm,.225,.18,.29,skin,0,-.61,0);
    // Positive X rotation brings a hanging arm toward local -Z (the front).
    arm.rotation.x=1.38;
    g.add(arm);

    leg.position.set(side*.20,.69,0);
    cube(leg,.29,.54,.34,pants,0,-.24,0);
    cube(leg,.29,.11,.345,pantsShade,0,-.51,0);
    cube(leg,.32,.14,.43,boots,0,-.61,-.04);
    cube(leg,.325,.055,.45,sole,0,-.69,-.045);
    g.add(leg);
  }
  g.userData.parts={leftArm,rightArm,leftLeg,rightLeg};
  // Match the compact player's overall proportions.
  g.scale.x=.72;
  g.scale.z=.88;
  return g;
}
function isZombieGround(x,z){
  const y=surfaceAt(x,z);
  return y>=SEA&&y<WORLD_TOP-2&&solid(get(x,y,z))&&
    get(x,y+1,z)===B.AIR&&get(x,y+2,z)===B.AIR;
}
function removeZombie(m){
  const i=mobs.indexOf(m);
  if(i>=0)mobs.splice(i,1);
  scene.remove(m);
  m.traverse(o=>{
    if(!o.isMesh)return;
    o.geometry?.dispose();
    if(o.userData.mobOwnMaterial)o.material?.dispose();
  });
}
function countZombies(){
  return mobs.reduce((sum,m)=>sum+(m.userData.type==='zombie'?1:0),0);
}
function spawnZombie(){
  if(countZombies()>=ZOMBIE_LIMIT)return false;
  // Search around the player, not beyond normal sight distance.
  // The evenly spread angles cover both sides of the player even when
  // the random direction happens to face water or mountain terrain.
  const phase=Math.random()*Math.PI*2;
  for(let attempt=0;attempt<64;attempt++){
    const ring=attempt<48?0:1;
    const angle=phase+attempt*Math.PI*(3-Math.sqrt(5));
    const dist=ring?19+Math.random()*12:9+Math.random()*9;
    const x=Math.round(player.pos.x+Math.cos(angle)*dist);
    const z=Math.round(player.pos.z+Math.sin(angle)*dist);
    if(!isZombieGround(x,z))continue;
    const y=surfaceAt(x,z);
    if(Math.abs(y+.51-player.pos.y)>5.5)continue;
    if(mobs.some(m=>Math.hypot(m.position.x-x,m.position.z-z)<3.5))continue;
    const g=buildZombie();
    g.position.set(x,y+.51,z);
    g.userData={...g.userData,type:'zombie',name:'ゾンビ',hp:10,xp:24,
      angle:Math.random()*Math.PI*2,speed:1.45,
      attackCooldown:.8,hitFlash:0,phase:Math.random()*Math.PI*2};
    scene.add(g);mobs.push(g);
    return true;
  }
  return false;
}
function updateZombieSpawning(dt){
  if(!isNightTime()){
    zombieSpawnCooldown=1;
    nightZombieWaveStarted=false;
    // Zombies disappear at sunrise, regardless of the player's location.
    for(let i=mobs.length-1;i>=0;i--)
      if(mobs[i].userData.type==='zombie')removeZombie(mobs[i]);
    return;
  }
  for(let i=mobs.length-1;i>=0;i--){
    const m=mobs[i];
    if(m.userData.type==='zombie'&&Math.hypot(m.position.x-player.pos.x,m.position.z-player.pos.z)>75)
      removeZombie(m);
  }
  if(!nightZombieWaveStarted){
    nightZombieWaveStarted=true;
    zombieSpawnCooldown=4;
    // An opening wave makes the enemies easy to spot at the start of night.
    spawnZombie();spawnZombie();
    if(dayTime>=DAY_END)flash('夜になった！ ゾンビに注意！');
    return;
  }
  zombieSpawnCooldown-=dt;
  if(zombieSpawnCooldown>0)return;
  const nearby=mobs.filter(m=>m.userData.type==='zombie'&&Math.hypot(
    m.position.x-player.pos.x,m.position.z-player.pos.z)<38).length;
  zombieSpawnCooldown=nearby<2?3:nearby<4?5:8;
  if(nearby<5)spawnZombie();
}
function zombieStep(m,angle,step){
  const nx=m.position.x+Math.sin(angle)*step;
  const nz=m.position.z+Math.cos(angle)*step;
  const x=Math.round(nx),z=Math.round(nz);
  if(!isZombieGround(x,z))return false;
  const groundY=surfaceAt(x,z)+.51;
  if(Math.abs(groundY-m.position.y)>1.18)return false;
  m.position.x=nx;m.position.z=nz;
  m.position.y+=(groundY-m.position.y)*.25;
  return true;
}
function updateZombie(m,dt,now){
  const dx=player.pos.x-m.position.x,dz=player.pos.z-m.position.z;
  const distance=Math.hypot(dx,dz);
  const ud=m.userData;
  ud.attackCooldown=Math.max(0,ud.attackCooldown-dt);
  if(distance<ZOMBIE_AGGRO_RANGE&&Math.abs(player.pos.y-m.position.y)<5){
    ud.angle=Math.atan2(dx,dz);
    if(distance>ZOMBIE_ATTACK_RANGE*.75){
      const step=ud.speed*dt;
      if(!zombieStep(m,ud.angle,step)){
        // Try a short sidestep around uneven ground or trees.
        if(!zombieStep(m,ud.angle+Math.PI/2,step))
          zombieStep(m,ud.angle-Math.PI/2,step);
      }
    }
    m.rotation.y=ud.angle+Math.PI;
    if(distance<ZOMBIE_ATTACK_RANGE&&Math.abs(player.pos.y-m.position.y)<1.8&&ud.attackCooldown<=0){
      ud.attackCooldown=1.8;
      damagePlayer(1,'ゾンビの攻撃');
    }
  }else{
    // Distant zombies idle; only nearby enemies seek the player.
    ud.angle+=Math.sin(now*.00055+ud.phase)*dt*.18;
    m.rotation.y=ud.angle+Math.PI;
  }
  const parts=ud.parts;
  if(parts){
    const stride=Math.sin(now*.007+ud.phase);
    parts.leftLeg.rotation.x=stride*.38;
    parts.rightLeg.rotation.x=-stride*.38;
    // Hold both arms in front like a zombie, with a subtle walking sway.
    // Local -Z is forward, so the X angle must be positive.
    parts.leftArm.rotation.x=1.38+stride*.055;
    parts.rightArm.rotation.x=1.38-stride*.055;
    if(distance<ZOMBIE_ATTACK_RANGE+.35){
      parts.leftArm.rotation.x=1.48+Math.sin(now*.016)*.10;
      parts.rightArm.rotation.x=1.48-Math.sin(now*.016)*.10;
    }
  }
}

let passiveSpawnCooldown=20;
function spawnPassiveMob(){
  if(mobs.length>=20)return false;
  const angle=Math.random()*Math.PI*2;
  const dist=18+Math.random()*14;
  const x=Math.floor(player.pos.x+Math.cos(angle)*dist);
  const z=Math.floor(player.pos.z+Math.sin(angle)*dist);
  const h=surfaceAt(x,z),bio=biomeAt(x,z);
  if(h<=SEA||bio===2||bio===6||bio===7)return false;
  if(mobs.some(m=>Math.hypot(m.position.x-x,m.position.z-z)<5))return false;

  const type=Math.floor(Math.random()*3);
  const g=type===0?buildSheep():type===1?buildPig():buildCow();
  g.position.set(x,h+.04,z);
  g.userData={
    angle:hash2(x,z)*Math.PI*2,
    t:2+hash2(z,x)*3,
    speed:.22+hash2(x+4,z+2)*.24,
    hp:type===2?5:3,
    xp:type===2?18:type===1?14:12,
    name:type===0?'ヒツジ':type===1?'ブタ':'ウシ',
    type
  };
  scene.add(g);mobs.push(g);
  return true;
}
function updatePassiveSpawning(dt){
  passiveSpawnCooldown-=dt;
  if(passiveSpawnCooldown>0)return;
  passiveSpawnCooldown=25;

  // Animals persist over a wide area. They are only cleaned up once very far away.
  for(let i=mobs.length-1;i>=0;i--){
    const m=mobs[i];
    if(Math.hypot(m.position.x-player.pos.x,m.position.z-player.pos.z)>180){
      scene.remove(m);mobs.splice(i,1);
    }
  }

  // Old animals can stay behind without preventing fresh animals from appearing near the player.
  const nearby=mobs.filter(m=>Math.hypot(m.position.x-player.pos.x,m.position.z-player.pos.z)<55).length;
  const attempts=nearby<3?3:nearby<6?2:0;
  for(let i=0;i<attempts;i++)spawnPassiveMob();
}

// Clouds float well above the tallest terrain (world height is 48 blocks).
const CLOUD_BASE_Y=55,CLOUD_HEIGHT_RANGE=4;
const clouds=[];
for(let i=0;i<10;i++){
  const g=new THREE.Group(),mat=new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.75,depthWrite:false});
  for(let j=0;j<3;j++){
    const m=new THREE.Mesh(new THREE.BoxGeometry(6+j*1.4,.55,3),mat);
    m.position.x=j*4;g.add(m);
  }
  g.position.set(-40+hash3(i,2,3,44)*80,CLOUD_BASE_Y+hash3(i,3,4,55)*CLOUD_HEIGHT_RANGE,-35+hash3(i,4,5,66)*70);
  scene.add(g);clouds.push(g);
}

const rainN=500,rainA=new Float32Array(rainN*3);
for(let i=0;i<rainN;i++){rainA[i*3]=(Math.random()-.5)*44;rainA[i*3+1]=5+Math.random()*28;rainA[i*3+2]=(Math.random()-.5)*44}
const rainG=new THREE.BufferGeometry();rainG.setAttribute('position',new THREE.BufferAttribute(rainA,3));
const rain=new THREE.Points(rainG,new THREE.PointsMaterial({color:0xb8d7f0,size:.09,transparent:true,opacity:.78}));
rain.visible=false;scene.add(rain);

const player={pos:new THREE.Vector3(),vel:new THREE.Vector3(),yaw:0,pitch:0,onGround:false},PR=.28,PH=1.78,EYE=1.62;

/* Original voxel explorer model: teal coat, amber pack, denim trousers. */
function createPlayerModel(){
  const g=new THREE.Group(),limbs={};
  const skin=0xd4a078,skinShade=0xb98059,hair=0x392921,hairLight=0x53392c;
  const jacket=0x247f9b,jacketLight=0x38a5b6,jacketDark=0x185569;
  const pants=0x34466b,pantsShade=0x25334f,boots=0x332d2e,sole=0x18191c;
  const pack=0xc08a46,packTrim=0xe4b76d,eye=0x24242a;

  // Shorter head and taller torso, preserving the character's overall height.
  // The model's feet stand at y=0, and its face points along local -Z.
  cube(g,.66,.52,.53,skin,0,1.53,0);
  cube(g,.68,.16,.55,hair,0,1.77,.005);
  cube(g,.69,.11,.34,hair,-.005,1.69,-.155);
  cube(g,.17,.11,.10,hairLight,-.24,1.69,-.290);
  cube(g,.13,.12,.09,hair,.17,1.69,-.295);
  cube(g,.08,.10,.022,eye,-.16,1.53,-.279);
  cube(g,.08,.10,.022,eye,.16,1.53,-.279);
  cube(g,.15,.04,.025,skinShade,0,1.40,-.281);
  cube(g,.07,.11,.055,skinShade,-.335,1.52,.01);
  cube(g,.07,.11,.055,skinShade,.335,1.52,.01);

  cube(g,.74,.85,.42,jacket,0,1.00,0);
  cube(g,.69,.10,.44,jacketLight,0,1.37,0);
  cube(g,.12,.64,.025,jacketDark,0,1.00,-.224);
  cube(g,.20,.18,.04,jacketLight,0,1.24,-.234);
  cube(g,.11,.07,.035,packTrim,.17,.99,-.231);
  // The backpack also extends to match the longer torso.
  cube(g,.53,.67,.19,pack,0,1.01,.31);
  cube(g,.51,.11,.205,packTrim,0,1.29,.32);
  cube(g,.13,.47,.035,packTrim,-.21,1.02,.427);
  cube(g,.13,.47,.035,packTrim,.21,1.02,.427);

  for(const [name,side] of [['left',-1],['right',1]]){
    const arm=new THREE.Group();
    arm.position.set(side*.36,1.30,0);
    cube(arm,.255,.45,.35,jacket,0,-.22,0);
    cube(arm,.262,.12,.36,jacketDark,0,-.47,0);
    cube(arm,.225,.18,.29,skin,0,-.61,0);
    g.add(arm);limbs[name+'Arm']=arm;
    const leg=new THREE.Group();
    leg.position.set(side*.20,.69,0);
    cube(leg,.29,.54,.34,pants,0,-.24,0);
    cube(leg,.29,.11,.345,pantsShade,0,-.51,0);
    cube(leg,.32,.14,.43,boots,0,-.61,-.04);
    cube(leg,.325,.055,.45,sole,0,-.69,-.045);
    g.add(leg);limbs[name+'Leg']=leg;
  }
  g.userData.limbs=limbs;
  // Slimmer silhouette: original arm-to-arm width 0.982 blocks -> 0.707 blocks.
  // Only the horizontal axis is scaled; height and animation remain unchanged.
  g.scale.x=.72;
  g.scale.z=.88;
  return g;
}
function buildPlayerAvatar(){
  const g=createPlayerModel();
  g.visible=false;
  scene.add(g);
  return g;
}
const playerAvatar=buildPlayerAvatar();
const VIEW_LABELS=['一人称','三人称（背面）','二人称風（正面）'];
let cameraMode=0;
const cameraEye=new THREE.Vector3(),cameraWanted=new THREE.Vector3(),cameraVector=new THREE.Vector3(),cameraLook=new THREE.Vector3();
const gameplayAimDirection=new THREE.Vector3(),gameplayAimOrigin=new THREE.Vector3();
function updateViewLabel(){
  const button=document.getElementById('viewModeButton');
  if(button){
    button.textContent='視点：'+VIEW_LABELS[cameraMode];
    button.setAttribute('aria-label','視点切り替え。現在：'+VIEW_LABELS[cameraMode]);
  }
  document.getElementById('crosshair')?.classList.toggle('view-front',cameraMode===2);
}
function cycleCameraMode(){
  if(!started||dead||sleeping||craftOpen||inventoryOpen)return;
  cameraMode=(cameraMode+1)%3;
  updateViewLabel();
  markSaveDirty();
  flash('視点：'+VIEW_LABELS[cameraMode]);
}
function aimPlayerRay(){
  const cp=Math.cos(player.pitch);
  gameplayAimDirection.set(-Math.sin(player.yaw)*cp,Math.sin(player.pitch),-Math.cos(player.yaw)*cp).normalize();
  gameplayAimOrigin.set(player.pos.x,player.pos.y+EYE,player.pos.z);
  ray.set(gameplayAimOrigin,gameplayAimDirection);
}
function updatePlayerAvatar(now){
  playerAvatar.visible=started&&!dead&&!sleeping&&cameraMode!==0;
  if(!playerAvatar.visible)return;
  playerAvatar.position.copy(player.pos);
  playerAvatar.rotation.y=player.yaw;
  const moving=Math.hypot(player.vel.x,player.vel.z);
  const stride=moving>.3?Math.sin(now*.009*(moving>5.2?1.45:1))*(Math.min(.58,moving*.12)):0;
  const limbs=playerAvatar.userData.limbs;
  limbs.leftLeg.rotation.x=stride;
  limbs.rightLeg.rotation.x=-stride;
  limbs.leftArm.rotation.x=-stride*.8;
  limbs.rightArm.rotation.x=stride*.8;
  if(!player.onGround){
    limbs.leftLeg.rotation.x=.15;
    limbs.rightLeg.rotation.x=-.15;
  }
}
function updateGameCamera(){
  cameraEye.set(player.pos.x,player.pos.y+EYE,player.pos.z);
  camera.rotation.order='YXZ';
  if(cameraMode===0){
    camera.position.copy(cameraEye);
    camera.rotation.y=player.yaw;
    camera.rotation.x=player.pitch;
    return;
  }
  const sy=Math.sin(player.yaw),cy=Math.cos(player.yaw);
  if(cameraMode===1){
    cameraWanted.set(cameraEye.x+sy*4.2,cameraEye.y+1.0-Math.sin(player.pitch)*1.0,cameraEye.z+cy*4.2);
    const cp=Math.cos(player.pitch);
    cameraLook.set(cameraEye.x-sy*cp*5,cameraEye.y+Math.sin(player.pitch)*5,cameraEye.z-cy*cp*5);
  }else{
    cameraWanted.set(cameraEye.x-sy*3.6,cameraEye.y+.65,cameraEye.z-cy*3.6);
    cameraLook.set(cameraEye.x,cameraEye.y-.15,cameraEye.z);
  }
  // Fast voxel sampling avoids a costly instance-mesh raycast every frame on iPads.
  cameraVector.copy(cameraWanted).sub(cameraEye);
  const wantedDistance=cameraVector.length();
  cameraVector.normalize();
  let distance=wantedDistance;
  for(let t=.3;t<=wantedDistance;t+=.14){
    const bx=Math.floor(cameraEye.x+cameraVector.x*t+.5);
    const by=Math.floor(cameraEye.y+cameraVector.y*t+.5);
    const bz=Math.floor(cameraEye.z+cameraVector.z*t+.5);
    const block=get(bx,by,bz);
    if(solid(block)&&block!==B.GLASS){
      distance=Math.max(.27,t-.18);
      break;
    }
  }
  camera.position.copy(cameraEye).addScaledVector(cameraVector,distance);
  // Hide the body if there is no room for the camera to pull out.
  if(distance<.8)playerAvatar.visible=false;
  camera.lookAt(cameraLook);
}

const MAX_HEALTH=20,HEALTH_REGEN_SECONDS=5;
let health=MAX_HEALTH,dead=false,fallOriginY=null,initialSpawn=null,bedSpawn=null,healthRegenTimer=0;
const worldDrops=[],dropTextures=new Map();
function dropTexture(id){
  if(dropTextures.has(id))return dropTextures.get(id);
  const canvas=itemCanvas(id,'item-icon'),tex=new THREE.CanvasTexture(canvas);
  tex.magFilter=THREE.NearestFilter;tex.minFilter=THREE.NearestFilter;tex.colorSpace=THREE.SRGBColorSpace;
  dropTextures.set(id,tex);return tex;
}
function makeDropSprite(id){
  const mat=new THREE.SpriteMaterial({map:dropTexture(id),transparent:true,depthTest:true});
  const sp=new THREE.Sprite(mat);sp.scale.set(.58,.58,.58);sp.renderOrder=2;return sp;
}
// Each block occupies [coordinate - .5, coordinate + .5] on every axis.
// Dropped sprites are 0.58 blocks wide; prevent the item center from
// entering solid neighbors even if the mined cavity has a low ceiling.
const DROP_COLLISION_RADIUS=.27;
function dropSpaceFree(x,y,z){
  const r=DROP_COLLISION_RADIUS,eps=1e-5;
  const minX=Math.ceil(x-r-.5+eps),maxX=Math.floor(x+r+.5-eps);
  const minY=Math.ceil(y-r-.5+eps),maxY=Math.floor(y+r+.5-eps);
  const minZ=Math.ceil(z-r-.5+eps),maxZ=Math.floor(z+r+.5-eps);
  for(let bx=minX;bx<=maxX;bx++)for(let by=minY;by<=maxY;by++)for(let bz=minZ;bz<=maxZ;bz++)
    if(solid(get(bx,by,bz)))return false;
  return true;
}
function moveWorldDropAxis(d,axis,delta){
  if(!delta)return;
  const count=Math.max(1,Math.ceil(Math.abs(delta)/.13));
  const step=delta/count;
  for(let i=0;i<count;i++){
    const nx=d.x+(axis==='x'?step:0);
    const ny=d.y+(axis==='y'?step:0);
    const nz=d.z+(axis==='z'?step:0);
    if(dropSpaceFree(nx,ny,nz))d[axis]+=step;
    else{
      d['v'+axis]=0;
      break;
    }
  }
}
function unburyWorldDrop(d){
  if(dropSpaceFree(d.x,d.y,d.z))return;
  // Relocate old saved drops that were launched into the block above them.
  const bx=Math.round(d.x),by=Math.round(d.y),bz=Math.round(d.z);
  const offsets=[[0,-1,0],[0,0,0],[0,1,0],[-1,0,0],[1,0,0],[0,0,-1],[0,0,1],
    [0,-2,0],[-1,-1,0],[1,-1,0],[0,-1,-1],[0,-1,1]];
  for(const [dx,dy,dz] of offsets){
    if(!dropSpaceFree(bx+dx,by+dy,bz+dz))continue;
    d.x=bx+dx;d.y=by+dy;d.z=bz+dz;
    d.vx=d.vy=d.vz=0;
    return;
  }
}
function spawnWorldDrop(id,qty,x,y,z,opts={}){
  qty=Math.max(1,Math.floor(qty||1));
  const sprite=makeDropSprite(id);
  const uid=typeof opts.uid==='string'&&opts.uid.length<80?opts.uid:crypto.randomUUID();
  const d={id,qty,x,y,z,uid,vx:Number(opts.vx)||0,vy:Number(opts.vy)||0,vz:Number(opts.vz)||0,age:Number(opts.age)||0,pickupDelay:Number.isFinite(Number(opts.pickupDelay))?Number(opts.pickupDelay):.45,sprite,phase:Math.random()*Math.PI*2};
  if(opts.scatter){d.vx+=(Math.random()-.5)*1.4;d.vz+=(Math.random()-.5)*1.4;d.vy+=1.7+Math.random()*.7}
  unburyWorldDrop(d);
  sprite.position.set(d.x,d.y,d.z);scene.add(sprite);worldDrops.push(d);markSaveDirty();
  if(multiRole&&!multiApplying&&!opts.networkSilent&&multiplayerNetwork.connected)
    multiplayerNetwork.send({t:'dropAdd',drop:{uid:d.uid,id:d.id,qty:d.qty,x:d.x,y:d.y,z:d.z,age:d.age}});
  return d;
}
function removeWorldDrop(d){
  scene.remove(d.sprite);d.sprite.material.dispose();
  const i=worldDrops.indexOf(d);if(i>=0)worldDrops.splice(i,1);
  if(multiRole&&!multiApplying&&multiplayerNetwork.connected)multiplayerNetwork.send({t:'dropRemove',uid:d.uid});
}
function clearWorldDrops(){
  for(const d of worldDrops){scene.remove(d.sprite);d.sprite.material.dispose()}
  worldDrops.length=0;
}
function serializeWorldDrops(){
  return worldDrops.filter(d=>d.age<300).map(d=>({uid:d.uid,id:d.id,qty:d.qty,x:d.x,y:d.y,z:d.z,age:d.age}));
}
function restoreWorldDrops(raw){
  if(!Array.isArray(raw))return;
  for(const d of raw){
    if(!d||!Number.isFinite(Number(d.id))||!(Number(d.qty)>0))continue;
    spawnWorldDrop(Number(d.id),Number(d.qty),Number(d.x)||0,Number.isFinite(Number(d.y))?Number(d.y):1,Number(d.z)||0,{uid:d.uid,age:Number(d.age)||0,pickupDelay:.25,networkSilent:true});
  }
}
function updateWorldDrops(dt,now){
  for(let i=worldDrops.length-1;i>=0;i--){
    const d=worldDrops[i];d.age+=dt;
    if(d.age>300){removeWorldDrop(d);continue}
    // Step along each axis; ceilings, walls and floors all block movement.
    // Cap fall speed so fast drops cannot skip a thin ground layer.
    d.vy=Math.max(-18,d.vy-11*dt);
    moveWorldDropAxis(d,'x',d.vx*dt);
    moveWorldDropAxis(d,'z',d.vz*dt);
    moveWorldDropAxis(d,'y',d.vy*dt);
    d.vx*=Math.pow(.86,dt*60);
    d.vz*=Math.pow(.86,dt*60);
    d.sprite.position.set(d.x,d.y+Math.sin(now*.004+d.phase)*.06,d.z);
    d.sprite.material.rotation=Math.sin(now*.0015+d.phase)*.22;

    if(d.age>d.pickupDelay){
      const dist=Math.hypot(player.pos.x-d.x,player.pos.y+.8-d.y,player.pos.z-d.z);
      if(dist<1.45){
        const left=addItem(d.id,d.qty),picked=d.qty-left;
        if(picked>0){
          d.qty=left;
          if(left<=0){flash((names[d.id]||'アイテム')+'を拾った');removeWorldDrop(d);continue}
        }
      }
    }
  }
}

function blocked(px,py,pz){
  const e=1e-4;
  const minX=Math.ceil((px-PR)-0.5+e),maxX=Math.floor((px+PR)+0.5-e);
  const minY=Math.ceil(py-0.5+e),maxY=Math.floor((py+PH)+0.5-e);
  const minZ=Math.ceil((pz-PR)-0.5+e),maxZ=Math.floor((pz+PR)+0.5-e);
  for(let x=minX;x<=maxX;x++)for(let y=minY;y<=maxY;y++)for(let z=minZ;z<=maxZ;z++){
    if(solid(get(x,y,z)))return true;
  }
  return false;
}
function movePlayerAxis(axis,amount){
  if(!amount)return true;
  const steps=Math.max(1,Math.ceil(Math.abs(amount)/0.08));
  const step=amount/steps;
  for(let i=0;i<steps;i++){
    const nx=player.pos.x+(axis==='x'?step:0);
    const ny=player.pos.y+(axis==='y'?step:0);
    const nz=player.pos.z+(axis==='z'?step:0);
    if(blocked(nx,ny,nz)){
      if(axis==='x')player.vel.x=0;
      if(axis==='z')player.vel.z=0;
      if(axis==='y'){
        if(step<0)player.onGround=true;
        player.vel.y=0;
      }
      return false;
    }
    player.pos.set(nx,ny,nz);
  }
  return true;
}
function calculateInitialSpawn(){
  let best={x:0,z:0,score:1e9},fallback={x:0,z:0,score:1e9};
  const radius=generatorVersion>=4?44:10,step=generatorVersion>=4?2:1;
  for(let x=-radius;x<=radius;x+=step)for(let z=-radius;z<=radius;z+=step){
    const info=columnInfo(x,z),h=info.h,b=info.bio;
    if(h<=SEA||b===2||b===6||info.river)continue;
    const h1=surfaceAt(x+2,z),h2=surfaceAt(x-2,z),h3=surfaceAt(x,z+2),h4=surfaceAt(x,z-2);
    const slope=Math.max(Math.abs(h-h1),Math.abs(h-h2),Math.abs(h-h3),Math.abs(h-h4));
    const d=Math.hypot(x,z);
    const nearDifferent=[biomeAt(x+18,z),biomeAt(x-18,z),biomeAt(x,z+18),biomeAt(x,z-18)].some(v=>v!==b);
    const score=d+slope*12-(nearDifferent?12:0);
    if(score<fallback.score)fallback={x,z,score};
    if(b===0&&slope<=2&&score<best.score)best={x,z,score};
  }
  if(best.score===1e9)best=fallback;
  return {x:best.x+.5,y:surfaceAt(best.x,best.z)+1.05,z:best.z+.5};
}
function ensureInitialSpawn(){
  if(!initialSpawn)initialSpawn=calculateInitialSpawn();
  return initialSpawn;
}
function isBedBlock(id){return id===B.BED||id===B.BED_HEAD}
function findBedOtherHalf(x,y,z,id=get(x,y,z)){
  const want=id===B.BED?B.BED_HEAD:id===B.BED_HEAD?B.BED:null;
  if(want==null)return null;
  for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]){
    if(get(x+dx,y,z+dz)===want)return {x:x+dx,y,z:z+dz};
  }
  return null;
}
function canonicalBedFoot(x,y,z){
  const id=get(x,y,z);
  if(id===B.BED)return {x,y,z};
  if(id===B.BED_HEAD)return findBedOtherHalf(x,y,z,id);
  return null;
}
function bedDirectionFromYaw(){
  const fx=-Math.sin(player.yaw),fz=-Math.cos(player.yaw);
  return Math.abs(fx)>Math.abs(fz)?{dx:Math.sign(fx)||1,dz:0}:{dx:0,dz:Math.sign(fz)||-1};
}
function activeRespawnPoint(){
  if(bedSpawn){
    const foot=canonicalBedFoot(bedSpawn.x,bedSpawn.y,bedSpawn.z);
    if(foot&&findBedOtherHalf(foot.x,foot.y,foot.z,B.BED)){
      return {x:foot.x,y:foot.y+1.05,z:foot.z};
    }
    bedSpawn=null;
  }
  return ensureInitialSpawn();
}
function spawn(useBed=false){
  const p=useBed?activeRespawnPoint():ensureInitialSpawn();
  player.pos.set(p.x,p.y,p.z);
  player.vel.set(0,0,0);player.onGround=false;fallOriginY=null;
  for(let i=0;i<16&&blocked(player.pos.x,player.pos.y,player.pos.z);i++)player.pos.y+=1;
}

const ray=new THREE.Raycaster();ray.far=6;
function target(){
  aimPlayerRay();
  const cx=chunkCoord(Math.floor(player.pos.x)),cz=chunkCoord(Math.floor(player.pos.z)),nearby=[];
  for(let dx=-1;dx<=1;dx++)for(let dz=-1;dz<=1;dz++){
    const c=chunks.get(chunkKey(cx+dx,cz+dz));
    if(c?.renderMeshes)nearby.push(...c.renderMeshes);
  }
  const hits=ray.intersectObjects(nearby,false);
  return hits.find(v=>v.object.userData.id!==B.WATER)||hits[0]||null;
}
function flash(t){msgEl.textContent=t;msgEl.style.opacity=1;clearTimeout(flash.t);flash.t=setTimeout(()=>msgEl.style.opacity=0,1200)}
function renderHealth(){
  heartsEl.innerHTML='';
  for(let i=0;i<10;i++){
    const remaining=health-i*2;
    const img=document.createElement('img');
    img.className='heart-img';
    img.alt='';
    img.draggable=false;
    img.src=remaining>=2?'assets/heart-full.svg':remaining===1?'assets/heart-half.svg':'assets/heart-empty.svg';
    heartsEl.appendChild(img);
  }
  heartsEl.parentElement?.setAttribute('aria-label','体力 '+(health/2)+' / 10');
}
function renderStamina(){
  const hud=document.getElementById('staminaHud');
  const icons=document.querySelectorAll('#staminaIcons .stamina-img');
  if(!hud||icons.length!==10)return;
  for(let i=0;i<10;i++){
    const remaining=stamina-i*2;
    const kind=remaining>=2?'full':remaining===1?'half':'empty';
    const img=icons[i];
    if(!img.getAttribute('src')?.includes('stamina-'+kind+'.svg'))
      img.setAttribute('src','assets/stamina-'+kind+'.svg?v=20261008n');
  }
  hud.setAttribute('aria-label','スタミナ '+(stamina/2)+' / 10');
}
function updateStaminaDuringSprint(dt){
  if(stamina<=0)return;
  staminaRunSeconds+=dt;
  let spent=false;
  while(staminaRunSeconds>=STAMINA_SECONDS_PER_HALF&&stamina>0){
    staminaRunSeconds-=STAMINA_SECONDS_PER_HALF;
    stamina--;
    spent=true;
  }
  if(spent){
    renderStamina();
    markSaveDirty();
    if(stamina===0){
      staminaRunSeconds=0;
      resetSprint();
      flash('スタミナ切れ！ 走れません');
    }
  }
}
function updateStaminaRecovery(dt,isRunning){
  // Recovery starts after a full five seconds without sprinting.
  // Pausing to craft or walk still allows natural recovery.
  if(isRunning){
    staminaRegenSeconds=0;
    return;
  }
  if(stamina>=MAX_STAMINA){
    staminaRegenSeconds=0;
    return;
  }
  staminaRegenSeconds+=dt;
  let recovered=false;
  while(staminaRegenSeconds>=STAMINA_SECONDS_PER_HALF&&stamina<MAX_STAMINA){
    staminaRegenSeconds-=STAMINA_SECONDS_PER_HALF;
    stamina++;
    recovered=true;
  }
  if(recovered){
    renderStamina();
    markSaveDirty();
    if(stamina>=MAX_STAMINA)staminaRegenSeconds=0;
  }
}
function showDeathScreen(){
  dead=true;health=0;renderHealth();primaryActionStop();
  Object.keys(keys).forEach(k=>keys[k]=false);
  resetSprint();
  craftOpen=false;inventoryOpen=false;
  crafting.classList.remove('open');inventoryScreen.classList.remove('open');
  crafting.setAttribute('aria-hidden','true');inventoryScreen.setAttribute('aria-hidden','true');
  deathScreen.classList.add('open');deathScreen.setAttribute('aria-hidden','false');
  document.exitPointerLock?.();markSaveDirty();saveCurrentGame(false);
}
function damagePlayer(points,source='ダメージ'){
  if(dead||points<=0)return;
  healthRegenTimer=0;
  health=Math.max(0,health-Math.floor(points));renderHealth();markSaveDirty();
  if(health<=0){showDeathScreen();return}
  const heartsLost=points/2;
  flash(source+' -'+heartsLost.toFixed(heartsLost%1?1:0)+'♥');
}
function applyFallDamage(distance){
  const blocks=Math.round(Math.max(0,distance));
  if(blocks<=3)return;
  damagePlayer(blocks-3,'落下ダメージ');
}
function updateHealthRegen(dt){
  if(dead||health>=MAX_HEALTH){healthRegenTimer=0;return}
  healthRegenTimer+=dt;
  while(healthRegenTimer>=HEALTH_REGEN_SECONDS&&health<MAX_HEALTH){
    healthRegenTimer-=HEALTH_REGEN_SECONDS;
    health=Math.min(MAX_HEALTH,health+1);
    renderHealth();markSaveDirty();
  }
}
function respawnPlayer(){
  health=MAX_HEALTH;dead=false;fallOriginY=null;healthRegenTimer=0;
  stamina=MAX_STAMINA;staminaRunSeconds=0;staminaRegenSeconds=0;
  deathScreen.classList.remove('open');deathScreen.setAttribute('aria-hidden','true');
  spawn(true);streamChunks(true);
  player.yaw=0;player.pitch=0;renderHealth();renderStamina();markSaveDirty();saveCurrentGame(false);
  last=performance.now();
  if(!matchMedia('(pointer:coarse)').matches)renderer.domElement.requestPointerLock?.();
}

function xpNeeded(lv){return 12+lv*8}
function nextBlueprint(){return [...recipes,...workbenchRecipes].sort((a,b)=>a.unlockLevel-b.unlockLevel).find(r=>r.unlockLevel>level)||null}
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
    const rs=[...recipes,...workbenchRecipes].filter(r=>r.unlockLevel===level);unlocked.push(...rs.map(r=>r.name.replace(/ ×\d+$/,'')));
  }
  updateProgress();markSaveDirty();
  if(unlocked.length)flash('LEVEL UP! LV '+level+'　設計図獲得：'+unlocked.join(' / '));
  else flash('+'+amount+' XP'+(source?'　'+source:''));
}
function pickTier(){
  if(selected===I.DIAMOND_PICK)return 4;
  if(selected===I.IRON_PICK)return 3;
  if(selected===I.GOLD_PICK)return 2;
  if(selected===I.STONE_PICK)return 2;
  if(selected===I.WOOD_PICK)return 1;
  return 0;
}
function toolSpeed(id){
  const woodLike=new Set([B.LOG,B.PLANK,B.CRAFTING_TABLE,B.BED,B.BED_HEAD]);
  const softLike=new Set([B.GRASS,B.DIRT,B.SAND,B.GRAVEL,B.SNOW]);
  const axeSpeed=selected===I.DIAMOND_AXE?6.5:selected===I.IRON_AXE?5:selected===I.GOLD_AXE?5.8:selected===I.STONE_AXE?3.2:selected===I.WOOD_AXE?2.1:1;
  const shovelSpeed=selected===I.DIAMOND_SHOVEL?6.5:selected===I.IRON_SHOVEL?5:selected===I.GOLD_SHOVEL?5.8:selected===I.STONE_SHOVEL?3.2:1;
  if(woodLike.has(id))return axeSpeed;
  if(softLike.has(id))return shovelSpeed;
  if(!rockBlocks.has(id))return 1;
  const t=pickTier();
  if(t>=4)return 7.0;
  if(selected===I.GOLD_PICK)return 6.0;
  if(t>=3)return 5.2;
  if(t>=2)return 3.6;
  if(t>=1)return 2.2;
  return 1;
}
function canMineBlock(id,showMessage=true){
  const t=pickTier();
  if(id===B.BEDROCK){if(showMessage)flash('岩盤は壊せません');return false}
  if(id===B.WATER||id===B.AIR)return false;
  if(id===B.COAL&&t<1){if(showMessage)flash('石炭にはツルハシが必要');return false}
  if([B.IRON,B.GOLD].includes(id)&&t<2){if(showMessage)flash('この鉱石には石以上のツルハシが必要');return false}
  if(id===B.DIAMOND&&t<3){if(showMessage)flash('ダイヤには鉄以上のツルハシが必要');return false}
  return true;
}
const NON_STACKABLE=new Set([
  I.WOOD_PICK,I.STONE_PICK,I.IRON_PICK,I.GOLD_PICK,I.DIAMOND_PICK,
  I.STONE_SWORD,I.IRON_SWORD,I.GOLD_SWORD,I.DIAMOND_SWORD,
  I.WOOD_AXE,I.STONE_AXE,I.IRON_AXE,I.GOLD_AXE,I.DIAMOND_AXE,
  I.STONE_SHOVEL,I.IRON_SHOVEL,I.GOLD_SHOVEL,I.DIAMOND_SHOVEL,
  I.IRON_HELMET,I.IRON_CHEST,I.IRON_LEGS,I.IRON_BOOTS,
  I.GOLD_HELMET,I.GOLD_CHEST,I.GOLD_LEGS,I.GOLD_BOOTS,
  I.DIAMOND_HELMET,I.DIAMOND_CHEST,I.DIAMOND_LEGS,I.DIAMOND_BOOTS,
  I.BED
]);
function maxStackFor(id){return NON_STACKABLE.has(id)?1:64}
function clearInventorySlots(){
  inventorySlots.fill(null);hotbarSlots.fill(null);acquiredOrder.length=0;
  for(const k of Object.keys(inventory))inventory[k]=0;
  selected=null;inventorySelectedSlot=null;
}
function syncDerivedInventory(){
  for(const k of Object.keys(inventory))inventory[k]=0;
  acquiredOrder.length=0;
  for(let i=0;i<36;i++){
    const st=inventorySlots[i];
    if(st&&st.qty>0){
      inventory[st.id]=(inventory[st.id]||0)+st.qty;
      if(!acquiredOrder.includes(st.id))acquiredOrder.push(st.id);
    }else inventorySlots[i]=null;
  }
  for(let i=0;i<9;i++)hotbarSlots[i]=inventorySlots[i]?.id??null;
  if(selectedHotbarIndex<0||selectedHotbarIndex>8)selectedHotbarIndex=0;
  const st=inventorySlots[selectedHotbarIndex];
  selected=st?.id??null;
}
function migrateLegacyInventoryToSlots(data){
  clearInventorySlots();
  const counts={};
  if(data?.inventory&&typeof data.inventory==='object'){
    for(const [k,v] of Object.entries(data.inventory))if(Number(v)>0)counts[Number(k)]=Math.floor(Number(v));
  }
  if(Array.isArray(data?.hotbarSlots)){
    for(let i=0;i<Math.min(9,data.hotbarSlots.length);i++){
      const id=Number(data.hotbarSlots[i]);
      if(!Number.isFinite(id)||!(counts[id]>0))continue;
      const qty=Math.min(maxStackFor(id),counts[id]);
      inventorySlots[i]={id,qty};counts[id]-=qty;
    }
  }
  const order=[...(Array.isArray(data?.acquiredOrder)?data.acquiredOrder.map(Number):[]),...Object.keys(counts).map(Number)];
  for(const id of [...new Set(order)]){
    let left=counts[id]||0;
    while(left>0){
      let idx=inventorySlots.findIndex((v,i)=>i>=9&&!v);
      if(idx<0)idx=inventorySlots.findIndex(v=>!v);
      if(idx<0)break;
      const qty=Math.min(maxStackFor(id),left);inventorySlots[idx]={id,qty};left-=qty;
    }
  }
  syncDerivedInventory();
}
function normalizeHotbar(){syncDerivedInventory()}
function canFitItem(id,qty=1){
  let room=0,max=maxStackFor(id);
  for(const st of inventorySlots){
    if(!st)room+=max;
    else if(st.id===id)room+=Math.max(0,max-st.qty);
    if(room>=qty)return true;
  }
  return false;
}
function addItem(id,qty=1){
  let left=Math.max(0,Math.floor(qty));if(!left)return 0;
  const original=left,max=maxStackFor(id);
  for(const st of inventorySlots){
    if(!st||st.id!==id||st.qty>=max)continue;
    const take=Math.min(left,max-st.qty);st.qty+=take;left-=take;if(!left)break;
  }
  while(left>0){
    const idx=inventorySlots.findIndex(v=>!v);if(idx<0)break;
    const take=Math.min(left,max);inventorySlots[idx]={id,qty:take};left-=take;
  }
  if(left!==original){
    syncDerivedInventory();markSaveDirty();renderHotbar();
    if(inventoryOpen)renderInventoryUI();
  }
  return left;
}
function removeItem(id,qty=1){
  let left=Math.max(0,Math.floor(qty));
  for(let i=35;i>=0&&left>0;i--){
    const st=inventorySlots[i];if(!st||st.id!==id)continue;
    const take=Math.min(left,st.qty);st.qty-=take;left-=take;if(st.qty<=0)inventorySlots[i]=null;
  }
  syncDerivedInventory();markSaveDirty();renderHotbar();
  if(inventoryOpen)renderInventoryUI();
  return left;
}
function removeFromSlot(index,qty=1){
  const st=inventorySlots[index];if(!st)return 0;
  const take=Math.min(st.qty,Math.max(0,Math.floor(qty)));st.qty-=take;
  if(st.qty<=0)inventorySlots[index]=null;
  syncDerivedInventory();markSaveDirty();renderHotbar();
  if(inventoryOpen)renderInventoryUI();
  return take;
}
function consumeSelected(qty=1){return removeFromSlot(selectedHotbarIndex,qty)}
function selectHotbar(index){
  if(eatingHeld)resetEating();
  selectedHotbarIndex=Math.max(0,Math.min(8,index));syncDerivedInventory();renderHotbar();
  if(inventoryOpen)renderInventoryUI();
}
function firstEmptySlot(start=0,end=36,exclude=-1){
  for(let i=start;i<end;i++)if(i!==exclude&&!inventorySlots[i])return i;
  return -1;
}
function splitInventoryStack(index){
  const st=inventorySlots[index];if(!st||st.qty<2){flash('分けられる個数がありません');return}
  let empty=index<9?firstEmptySlot(0,9,index):firstEmptySlot(9,36,index);
  if(empty<0)empty=index<9?firstEmptySlot(9,36,index):firstEmptySlot(0,9,index);
  if(empty<0){flash('空きスロットがありません');return}
  const moved=Math.floor(st.qty/2);st.qty-=moved;inventorySlots[empty]={id:st.id,qty:moved};
  inventorySelectedSlot=empty;syncDerivedInventory();markSaveDirty();renderHotbar();renderInventoryUI();
}
function moveInventoryStack(index){
  const st=inventorySlots[index];if(!st)return;
  const toHotbar=index>=9;
  const empty=toHotbar?firstEmptySlot(0,9,index):firstEmptySlot(9,36,index);
  if(empty<0){flash(toHotbar?'ホットバーに空きがありません':'インベントリに空きがありません');return}
  inventorySlots[empty]=st;inventorySlots[index]=null;inventorySelectedSlot=empty;
  if(empty<9)selectedHotbarIndex=empty;
  syncDerivedInventory();markSaveDirty();renderHotbar();renderInventoryUI();
}
function dropInventoryStack(index){
  const st=inventorySlots[index];if(!st)return;
  const id=st.id,qty=st.qty;
  inventorySlots[index]=null;inventorySelectedSlot=null;syncDerivedInventory();markSaveDirty();renderHotbar();
  const fx=-Math.sin(player.yaw),fz=-Math.cos(player.yaw);
  spawnWorldDrop(id,qty,player.pos.x+fx*.85,player.pos.y+1.05,player.pos.z+fz*.85,{vx:fx*2.1,vz:fz*2.1,vy:1.8,pickupDelay:1.25});
  renderInventoryUI();flash((names[id]||'アイテム')+'を捨てた');
}
function renderInventorySlot(index){
  const st=inventorySlots[index],d=document.createElement('button');
  d.type='button';d.className='inv-slot'+(inventorySelectedSlot===index?' selected-slot':'')+(index===selectedHotbarIndex&&index<9?' hotbar-current':'');
  if(inventorySelectedSlot!=null&&inventorySelectedSlot!==index)d.classList.add('move-target');
  if(index<9){const n=document.createElement('span');n.className='slot-number';n.textContent=index+1;d.appendChild(n)}
  if(st){
    d.appendChild(itemCanvas(st.id,'item-icon'));
    const q=document.createElement('span');q.className='stack-qty';q.textContent=st.qty;d.appendChild(q);
    d.title=names[st.id]||'アイテム';
  }
  d.addEventListener('click',()=>{
    const from=inventorySelectedSlot;
    if(from!=null&&from!==index&&inventorySlots[from]){
      const moving=inventorySlots[from],target=inventorySlots[index];
      inventorySlots[index]=moving;
      inventorySlots[from]=target;
      inventorySelectedSlot=index;
      syncDerivedInventory();markSaveDirty();renderHotbar();renderInventoryUI();
      flash(target?'アイテムを入れ替えました':'アイテムを移動しました');
      return;
    }
    if(st){
      inventorySelectedSlot=index;
      if(index<9)selectedHotbarIndex=index;
    }else{
      inventorySelectedSlot=null;
    }
    syncDerivedInventory();renderHotbar();renderInventoryUI();
  });
  return d;
}
function renderInventoryUI(){
  inventoryMainGrid.innerHTML='';inventoryHotbarGrid.innerHTML='';
  for(let i=9;i<36;i++)inventoryMainGrid.appendChild(renderInventorySlot(i));
  for(let i=0;i<9;i++)inventoryHotbarGrid.appendChild(renderInventorySlot(i));
  const st=inventorySelectedSlot==null?null:inventorySlots[inventorySelectedSlot];
  inventoryDetailIcon.innerHTML='';
  if(!st){
    inventoryDetail.classList.add('empty');inventoryDetailName.textContent='アイテムを選択';inventoryDetailQty.textContent='';
    inventoryMove.disabled=true;inventorySplit.disabled=true;inventoryDrop.disabled=true;return;
  }
  inventoryDetail.classList.remove('empty');inventoryDetailIcon.appendChild(itemCanvas(st.id,'item-icon'));
  inventoryDetailName.textContent=names[st.id]||'ITEM';inventoryDetailQty.textContent='× '+st.qty;
  inventoryMove.disabled=false;inventoryMove.textContent=inventorySelectedSlot<9?'インベントリへ':'ホットバーへ';
  inventorySplit.disabled=st.qty<2;inventoryDrop.disabled=false;
}
function setInventoryOpen(v){
  inventoryOpen=v;inventoryScreen.classList.toggle('open',v);inventoryScreen.setAttribute('aria-hidden',String(!v));
  Object.keys(keys).forEach(k=>keys[k]=false);
  resetSprint();
  if(v){
    if(craftOpen)setCraftOpen(false);
    primaryActionStop();document.exitPointerLock?.();inventorySelectedSlot=null;renderInventoryUI();
  }else if(started&&!matchMedia('(pointer:coarse)').matches){renderer.domElement.requestPointerLock?.()}
}

// Eject mined items from the face the player is mining, not into the middle
// of the one-block cavity. In a low-ceiling tunnel, drops must be visible
// and reachable without mining the block above them.
function minedDropPosition(x,y,z){
  // The mined block has just become AIR. Its original center is guaranteed to
  // be free of adjacent solid voxels, even in a one-block-deep tunnel.
  // Spawning outside the hit face with an upward scatter impulse could send
  // ore into the block ABOVE the cavity, hiding it until that block was mined.
  return {x,y,z};
}
function finishMine(x,y,z,id){
  if(get(x,y,z)!==id)return;

  const bedFoot=isBedBlock(id)?canonicalBedFoot(x,y,z):null;
  const bedOther=isBedBlock(id)?findBedOtherHalf(x,y,z,id):null;
  const brokeRespawnBed=!!(bedFoot&&bedSpawn&&bedSpawn.x===bedFoot.x&&bedSpawn.y===bedFoot.y&&bedSpawn.z===bedFoot.z);

  set(x,y,z,B.AIR);
  if(bedOther)set(bedOther.x,bedOther.y,bedOther.z,B.AIR);
  if(brokeRespawnBed)bedSpawn=null;

  let drop=specialBlockDrops[id]??id;
  if(id===B.STONE)drop=B.COBBLE;
  if(id===B.GRASS)drop=B.DIRT;
  if(id===B.IRON)drop=I.RAW_IRON;
  if(id===B.GOLD)drop=I.RAW_GOLD;
  if(id===B.DIAMOND)drop=I.DIAMOND;
  if(isBedBlock(id))drop=I.BED;

  // Stone can be broken by hand, but only a wooden pickaxe or better yields cobblestone.
  const canDrop=id!==B.STONE||pickTier()>=1;
  if(canDrop&&(buildable.includes(drop)||drop===B.COAL||drop===I.RAW_IRON||drop===I.RAW_GOLD||drop===I.DIAMOND||drop===I.CRAFTING_TABLE||drop===I.FURNACE||drop===I.BED)){
    const spawnAt=minedDropPosition(x,y,z);
    spawnWorldDrop(drop,1,spawnAt.x,spawnAt.y,spawnAt.z,{pickupDelay:.45});
  }
  rebuildEdited({x,z},...(bedOther?[bedOther]:[]));gainXP(blockXP[id]||1,names[id]||'採掘');
  if(brokeRespawnBed)flash('ベッドが壊れたため初期スポーンに戻りました');
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
  if(!miningHeld||craftOpen||inventoryOpen){clearMining();return}
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
function place(){
  const h=target();if(!h||!h.face)return;
  const p=lookup.get(h.object.uuid)?.[h.instanceId];if(!p)return;
  const targetId=get(p.x,p.y,p.z);

  if(isBedBlock(targetId)&&h.distance<=5){
    const foot=canonicalBedFoot(p.x,p.y,p.z);
    if(!foot||!findBedOtherHalf(foot.x,foot.y,foot.z,B.BED)){
      flash('ベッドが壊れています');
      return;
    }
    bedSpawn={x:foot.x,y:foot.y,z:foot.z};
    markSaveDirty();
    if(isNightTime()){
      sleepInBed();
    }else{
      saveCurrentGame(false);
      flash('リスポーン地点を設定しました。夜になると眠れます');
    }
    return;
  }

  if(selected==null||(inventory[selected]||0)<=0){flash('置けるブロックを持っていません');return}

  const n=h.face.normal,x=p.x+Math.round(n.x),y=p.y+Math.round(n.y),z=p.z+Math.round(n.z);
  if(!inside(x,y,z)||get(x,y,z)!==B.AIR)return;

  if(selected===I.BED){
    const dir=bedDirectionFromYaw(),x2=x+dir.dx,z2=z+dir.dz;
    if(!inside(x2,y,z2)||get(x2,y,z2)!==B.AIR){
      flash('ベッドを置くには縦2マスの空きが必要です');
      return;
    }
    set(x,y,z,B.BED);
    set(x2,y,z2,B.BED_HEAD);
    if(blocked(player.pos.x,player.pos.y,player.pos.z)){
      set(x,y,z,B.AIR);set(x2,y,z2,B.AIR);rebuildEdited({x,z},{x:x2,z:z2});
      return;
    }
    consumeSelected(1);rebuildEdited({x,z},{x:x2,z:z2});renderHotbar();flash('ベッドを設置');
    return;
  }

  const blockId=buildable.includes(selected)?selected:placeableItemToBlock[selected];
  if(blockId==null){flash((names[selected]||'このアイテム')+'は設置できません');return}
  set(x,y,z,blockId);
  if(blocked(player.pos.x,player.pos.y,player.pos.z)){set(x,y,z,B.AIR);return}
  const placedName=names[selected]||names[blockId]||'ブロック';consumeSelected(1);rebuildEdited({x,z});renderHotbar();flash(placedName+'を設置')
}

function prepareMobHitMaterials(root){
  root.traverse(o=>{
    if(!o.isMesh||!o.material)return;
    if(!o.userData.mobOwnMaterial){
      o.material=o.material.clone();
      o.userData.mobOwnMaterial=true;
      o.userData.mobBaseColor=o.material.color.getHex();
    }
  });
}
function setMobHitFlash(root){
  prepareMobHitMaterials(root);
  root.userData.hitFlash=.22;
  root.traverse(o=>{
    if(o.isMesh&&o.material?.color)o.material.color.setHex(0xff4040);
  });
}
function restoreMobColors(root){
  root.traverse(o=>{
    if(o.isMesh&&o.material?.color&&o.userData.mobBaseColor!=null)o.material.color.setHex(o.userData.mobBaseColor);
  });
}
function makeMobFlee(root){
  const dx=root.position.x-player.pos.x,dz=root.position.z-player.pos.z;
  root.userData.angle=Math.atan2(dx,dz);
  root.userData.fleeTime=2.6;
  root.userData.t=2.6;
}
function dropMobLoot(root){
  const x=root.position.x,y=root.position.y+.75,z=root.position.z;
  const type=root.userData.type;
  if(type==='zombie')return; // Zombie kills grant XP; no animal meat drops.
  if(type===0){
    spawnWorldDrop(I.WOOL,1+Math.floor(Math.random()*2),x,y,z,{scatter:true,pickupDelay:.55});
  }else if(type===1){
    spawnWorldDrop(I.RAW_PORK,1+Math.floor(Math.random()*2),x,y,z,{scatter:true,pickupDelay:.55});
  }else{
    spawnWorldDrop(I.RAW_BEEF,1+Math.floor(Math.random()*2),x,y,z,{scatter:true,pickupDelay:.55});
    spawnWorldDrop(I.LEATHER,1,x+.12,y,z+.08,{scatter:true,pickupDelay:.55});
  }
}
function attackMob(){
  aimPlayerRay();
  const hits=ray.intersectObjects(mobs,true).filter(h=>h.distance<=4.5);
  if(!hits.length)return false;
  let root=hits[0].object;
  while(root.parent&&!mobs.includes(root))root=root.parent;
  if(!mobs.includes(root))return false;

  const damage=selected===I.DIAMOND_SWORD?4:selected===I.IRON_SWORD?3:selected===I.GOLD_SWORD?2:selected===I.STONE_SWORD?2:1;
  root.userData.hp-=damage;
  setMobHitFlash(root);
  if(root.userData.type!=='zombie')makeMobFlee(root);

  if(root.userData.hp<=0){
    const earned=root.userData.xp||12,name=root.userData.name||'動物';
    dropMobLoot(root);
    if(root.userData.type==='zombie')removeZombie(root);
    else {scene.remove(root);const i=mobs.indexOf(root);if(i>=0)mobs.splice(i,1)}
    gainXP(earned,name+'を倒した');
  }else{
    flash((root.userData.name||'動物')+'に攻撃　HP '+root.userData.hp);
  }
  return true;
}

// Food is eaten with a deliberate one-second hold on the attack/mine action.
const FOOD_EAT_SECONDS=1;
const FOOD_HEAL_POINTS={
  [I.RAW_PORK]:4,     // 2 hearts
  [I.COOKED_PORK]:8,  // 4 hearts (+2 hearts cooked)
  [I.RAW_BEEF]:6,     // 3 hearts
  [I.COOKED_BEEF]:10 // 5 hearts (+2 hearts cooked)
};
let eatingHeld=false,eatingElapsed=0,eatingStartedAt=0,eatingSlot=-1,eatingItem=null;
function resetEating(){
  eatingHeld=false;eatingElapsed=0;eatingStartedAt=0;eatingSlot=-1;eatingItem=null;
  if(!miningHeld)clearMining();
}
function startEating(){
  if(!started||dead||sleeping||craftOpen||inventoryOpen)return false;
  if(!Object.hasOwn(FOOD_HEAL_POINTS,selected))return false;
  miningHeld=false;clearMining();
  if(health>=MAX_HEALTH){flash('体力満タン：肉は食べられません');return true}
  const stack=inventorySlots[selectedHotbarIndex];
  if(!stack||stack.id!==selected||stack.qty<1)return true;
  eatingHeld=true;eatingElapsed=0;eatingStartedAt=performance.now();
  eatingSlot=selectedHotbarIndex;eatingItem=selected;
  breakLabel.textContent=(names[selected]||'肉')+' を食べる';
  breakFill.style.width='0%';breakMeter.classList.add('active');
  return true;
}
function updateEating(dt){
  if(!eatingHeld)return;
  const stack=inventorySlots[eatingSlot];
  if(dead||sleeping||craftOpen||inventoryOpen||eatingSlot!==selectedHotbarIndex||
     !stack||stack.id!==eatingItem||stack.qty<1){
    resetEating();return;
  }
  if(health>=MAX_HEALTH){resetEating();return}
  eatingElapsed=(performance.now()-eatingStartedAt)/1000;
  const pct=Math.min(100,eatingElapsed/FOOD_EAT_SECONDS*100);
  breakLabel.textContent=(names[eatingItem]||'肉')+' '+Math.floor(pct)+'%';
  breakFill.style.width=pct+'%';
  if(eatingElapsed<FOOD_EAT_SECONDS)return;
  const item=eatingItem;
  // Exactly one portion per continuous hold; release and hold again for another.
  resetEating();
  const consumed=removeFromSlot(selectedHotbarIndex,1);
  if(consumed!==1)return;
  const restored=Math.min(MAX_HEALTH-health,FOOD_HEAL_POINTS[item]);
  health=Math.min(MAX_HEALTH,health+FOOD_HEAL_POINTS[item]);
  healthRegenTimer=0;renderHealth();markSaveDirty();
  flash((names[item]||'肉')+'を食べた　♥+'+(restored/2));
}
function primaryActionStart(){
  if(!started||dead||sleeping||craftOpen||inventoryOpen)return;
  if(startEating())return;
  if(attackMob()){miningHeld=false;clearMining();return}
  miningHeld=true;startMining();
}
function primaryActionStop(){eatingHeld=false;eatingElapsed=0;eatingStartedAt=0;eatingSlot=-1;eatingItem=null;miningHeld=false;clearMining()}

function renderHotbar(){
  syncDerivedInventory();hotbarEl.innerHTML='';
  for(let i=0;i<9;i++){
    const st=inventorySlots[i],d=document.createElement('div');
    d.className='slot'+(i===selectedHotbarIndex?' active':'');
    const key=document.createElement('span');key.className='key';key.textContent=i+1;d.appendChild(key);
    if(st){
      d.appendChild(itemCanvas(st.id,'item-icon hotbar-icon'));
      const qty=document.createElement('span');qty.className='qty';qty.textContent=st.qty;d.appendChild(qty);
      const name=document.createElement('span');name.className='item-name';name.textContent=names[st.id]||'ITEM';d.appendChild(name);
      d.title=names[st.id]||'アイテム';
    }
    d.addEventListener('pointerdown',e=>{e.stopPropagation();selectHotbar(i)});
    hotbarEl.appendChild(d);
  }
}

function hasNeeds(recipe){return recipe.needs.every(([id,n])=>(inventory[id]||0)>=n)}
function distanceToBlock(x,y,z){
  const dx=player.pos.x-x,dy=(player.pos.y+1)-y,dz=player.pos.z-z;
  return Math.hypot(dx,dy,dz);
}
function stationInReach(){
  // Workbench/furnace menus only open when the center reticle is directly aiming at that block.
  const h=target();
  if(!h||h.distance>5)return null;
  const p=lookup.get(h.object.uuid)?.[h.instanceId];
  if(!p)return null;
  const id=get(p.x,p.y,p.z);
  return (id===B.CRAFTING_TABLE||id===B.FURNACE)?id:null;
}
function chooseCraftMode(){
  const station=stationInReach();
  if(station===B.CRAFTING_TABLE)return 'workbench';
  if(station===B.FURNACE)return 'furnace';
  return 'inventory';
}
function currentRecipeList(){
  return craftMode==='workbench'?workbenchRecipes:craftMode==='furnace'?furnaceRecipes:recipes;
}
function renderCrafting(){
  const title=document.querySelector('.craft-title'),sub=document.querySelector('.craft-sub');
  if(craftMode==='workbench'){title.textContent='WORKBENCH';sub.textContent='作業台専用：ツール・防具・設備'}
  else if(craftMode==='furnace'){title.textContent='FURNACE';sub.textContent='石炭で原石を精錬・生肉を調理'}
  else {title.textContent='CRAFTING';sub.textContent='インベントリで作れる基本アイテム'}
  const ids=Object.keys(inventory).map(Number);
  const owned=ids.filter(id=>(inventory[id]||0)>0);
  craftInventory.innerHTML='';
  if(!owned.length){
    const empty=document.createElement('div');empty.className='inv-chip';empty.textContent='持ち物なし';craftInventory.appendChild(empty);
  }else{
    owned.forEach(id=>{
      const chip=document.createElement('div');chip.className='inv-chip';
      chip.appendChild(itemCanvas(id,'item-icon inv-icon'));
      const label=document.createElement('span');label.className='inv-label';label.textContent=names[id]||'ITEM';chip.appendChild(label);
      const count=document.createElement('strong');count.textContent=inventory[id];chip.appendChild(count);
      craftInventory.appendChild(chip);
    });
  }
  recipeList.innerHTML='';
  const list=currentRecipeList();
  list.forEach((r,i)=>{
    const locked=level<r.unlockLevel,can=!locked&&hasNeeds(r);
    const d=document.createElement('div');d.className='recipe'+(locked?' locked':'');
    const needText=r.needs.map(([id,n])=>`${names[id]} ×${n}`).join(' ＋ ');
    const verb=craftMode==='furnace'?'焼く':'作る';

    const main=document.createElement('div');main.className='recipe-main';
    main.appendChild(itemCanvas(r.out,'item-icon recipe-icon'));
    const copy=document.createElement('div');copy.className='recipe-copy';
    const rn=document.createElement('div');rn.className='recipe-name';rn.textContent=(locked?'🔒 ':'')+r.name;
    const lv=document.createElement('span');lv.className='recipe-level';lv.textContent='LV '+r.unlockLevel;rn.appendChild(lv);
    const needs=document.createElement('div');needs.className='recipe-needs';needs.textContent=locked?'設計図未取得':needText;
    copy.append(rn,needs);main.appendChild(copy);

    const button=document.createElement('button');button.disabled=!can;button.textContent=verb;
    button.addEventListener('click',()=>craftRecipe(i));
    d.append(main,button);recipeList.appendChild(d);
  });
}
function craftRecipe(i){
  const list=currentRecipeList(),r=list[i];
  if(level<r.unlockLevel){flash('LV '+r.unlockLevel+'で設計図を獲得');return}
  if(!hasNeeds(r)){flash('材料が足りません');return}
  if(!canFitItem(r.out,r.qty)){flash('インベントリがいっぱいです');return}
  r.needs.forEach(([id,n])=>removeItem(id,n));
  addItem(r.out,r.qty);
  if(craftMode==='furnace'&&r.xp)gainXP(r.xp,r.name+'を精錬');
  renderHotbar();renderCrafting();flash(r.name+(craftMode==='furnace'?'が完成！':'をクラフト'));
}
function setCraftOpen(v){
  craftOpen=v;crafting.classList.toggle('open',v);crafting.setAttribute('aria-hidden',String(!v));
  Object.keys(keys).forEach(k=>keys[k]=false);
  resetSprint();
  if(v){
    if(inventoryOpen)setInventoryOpen(false);
    craftMode=chooseCraftMode();
    primaryActionStop();document.exitPointerLock?.();renderCrafting();
    if(craftMode==='inventory')flash('作業台・かまどにレティクルを合わせると専用メニューが開きます');
  } else if(started&&!matchMedia('(pointer:coarse)').matches){renderer.domElement.requestPointerLock?.()}
}

const keys={};
const MAX_STAMINA=20,STAMINA_SECONDS_PER_HALF=5;
let stamina=MAX_STAMINA,staminaRunSeconds=0,staminaRegenSeconds=0;
const SPRINT_SPEED=7.2,WALK_SPEED=4.5;
let sprinting=false;
function showSprintState(){
  const sprintButton=document.querySelector('.pad .sprint');
  if(sprintButton)sprintButton.classList.toggle('running',sprinting);
}
function isForwardHeld(){
  return !!(keys.w||keys.arrowup||keys.mobileWalk||keys.mobileSprint);
}
// The top touch arrow always runs; the original arrow always walks.
// Desktop players can hold Shift with W or Up to run. No double-tap detection.
function updateSprintIntent(){
  const wantsSprint=!!(keys.mobileSprint||(keys.shift&&(keys.w||keys.arrowup)));
  const next=stamina>0&&wantsSprint;
  if(next&&!sprinting)flash('ダッシュ！');
  sprinting=next;
  showSprintState();
}
function resetSprint(){
  sprinting=false;
  showSprintState();
}
addEventListener('blur',()=>{
  Object.keys(keys).forEach(k=>keys[k]=false);
  resetSprint();
  primaryActionStop();
});
addEventListener('keydown',e=>{
  const k=e.key.toLowerCase();
  if(dead)return;
  if((k==='v'||e.code==='F5')&&started){e.preventDefault();if(!e.repeat)cycleCameraMode();return}
  if(k==='e'&&started){e.preventDefault();setInventoryOpen(!inventoryOpen);return}
  if(k==='c'&&started){e.preventDefault();setCraftOpen(!craftOpen);return}
  if(craftOpen||inventoryOpen||sleeping)return;
  keys[k]=true;
  if((k==='w'||k==='arrowup'||k==='shift')&&started)updateSprintIntent();
  if(e.code==='Space'){e.preventDefault();jump()}
  if(/^[1-9]$/.test(e.key))selectHotbar(+e.key-1);
  if(k==='r'){weather=weather==='clear'?'rain':'clear';rain.visible=weather==='rain';weatherEl.textContent=weather==='rain'?'Rain':'Clear'}
});
addEventListener('keyup',e=>{
  const k=e.key.toLowerCase();
  keys[k]=false;
  if(k==='w'||k==='arrowup'||k==='shift')updateSprintIntent();
});
function blockAtPoint(x,y,z){return get(Math.floor(x+0.5),Math.floor(y+0.5),Math.floor(z+0.5))}
function playerInWater(){
  const x=player.pos.x,z=player.pos.z;
  return blockAtPoint(x,player.pos.y+0.15,z)===B.WATER||
         blockAtPoint(x,player.pos.y+0.9,z)===B.WATER||
         blockAtPoint(x,player.pos.y+1.55,z)===B.WATER;
}
function jump(){
  if(playerInWater()){
    fallOriginY=null;
    player.vel.y=Math.max(player.vel.y,4.6);
    player.onGround=false;
    return;
  }
  if(player.onGround){
    // Damage is based on the height of the ledge we left, not the jump apex.
    fallOriginY=player.pos.y;
    player.vel.y=7.3;player.onGround=false;
  }
}

renderer.domElement.addEventListener('click',()=>{if(!dead&&!craftOpen&&!inventoryOpen&&!matchMedia('(pointer:coarse)').matches)renderer.domElement.requestPointerLock?.()});
addEventListener('mousemove',e=>{if(document.pointerLockElement===renderer.domElement){player.yaw-=e.movementX*.0022;player.pitch-=e.movementY*.0022;player.pitch=Math.max(-1.48,Math.min(1.48,player.pitch))}});
renderer.domElement.addEventListener('mousedown',e=>{if(!started||dead||craftOpen||inventoryOpen)return;if(e.button===0&&document.pointerLockElement===renderer.domElement)primaryActionStart();if(e.button===2)place()});
addEventListener('mouseup',e=>{if(e.button===0)primaryActionStop()});
renderer.domElement.addEventListener('contextmenu',e=>e.preventDefault());

let touchLook=null;
renderer.domElement.addEventListener('pointerdown',e=>{if(dead||craftOpen||inventoryOpen)return;if(e.pointerType==='touch'&&e.clientX>innerWidth*.35)touchLook={x:e.clientX,y:e.clientY}});
renderer.domElement.addEventListener('pointermove',e=>{if(touchLook&&e.pointerType==='touch'){const dx=e.clientX-touchLook.x,dy=e.clientY-touchLook.y;player.yaw-=dx*.006;player.pitch=Math.max(-1.48,Math.min(1.48,player.pitch-dy*.006));touchLook={x:e.clientX,y:e.clientY}}});
renderer.domElement.addEventListener('pointerup',()=>touchLook=null);

function hold(q,k){const b=document.querySelector(q),on=e=>{e.preventDefault();keys[k]=true},off=e=>{e.preventDefault();keys[k]=false};b.addEventListener('pointerdown',on);['pointerup','pointercancel','pointerleave'].forEach(t=>b.addEventListener(t,off))}
// Mobile uses independent forward inputs so releasing Run while holding Walk
// (or vice versa) never interrupts the other touch.
const mobileForwardButton=document.querySelector('.pad .up');
const mobileSprintButton=document.querySelector('.pad .sprint');
function bindMobileForward(button,key){
  button.addEventListener('pointerdown',e=>{
    e.preventDefault();
    if(!started||dead||craftOpen||inventoryOpen||sleeping)return;
    keys[key]=true;
    try{button.setPointerCapture?.(e.pointerId)}catch{}
    updateSprintIntent();
  });
  const release=e=>{
    e.preventDefault();
    if(!keys[key])return;
    keys[key]=false;
    updateSprintIntent();
  };
  ['pointerup','pointercancel','pointerleave','lostpointercapture'].forEach(
    name=>button.addEventListener(name,release)
  );
  button.addEventListener('contextmenu',e=>e.preventDefault());
}
bindMobileForward(mobileForwardButton,'mobileWalk');
bindMobileForward(mobileSprintButton,'mobileSprint');
hold('.pad .down','s');hold('.pad .left','a');hold('.pad .right','d');
const jumpBtn=document.querySelector('.jump');
jumpBtn.addEventListener('pointerdown',e=>{e.preventDefault();keys.swimup=true;jump()});
['pointerup','pointercancel','pointerleave'].forEach(t=>jumpBtn.addEventListener(t,e=>{e.preventDefault();keys.swimup=false}));
$('tapMine').addEventListener('pointerdown',e=>{e.preventDefault();primaryActionStart()});
['pointerup','pointercancel','pointerleave'].forEach(t=>$('tapMine').addEventListener(t,e=>{e.preventDefault();primaryActionStop()}));
$('tapPlace').addEventListener('pointerdown',e=>{e.preventDefault();place()});
$('tapInventory').addEventListener('pointerdown',e=>{e.preventDefault();setInventoryOpen(true)});
$('tapCraft').addEventListener('pointerdown',e=>{e.preventDefault();setCraftOpen(true)});
inventoryClose.addEventListener('click',()=>setInventoryOpen(false));
inventoryScreen.addEventListener('pointerdown',e=>{if(e.target===inventoryScreen)setInventoryOpen(false)});
inventoryMove.addEventListener('click',()=>{if(inventorySelectedSlot!=null)moveInventoryStack(inventorySelectedSlot)});
inventorySplit.addEventListener('click',()=>{if(inventorySelectedSlot!=null)splitInventoryStack(inventorySelectedSlot)});
inventoryDrop.addEventListener('click',()=>{if(inventorySelectedSlot!=null)dropInventoryStack(inventorySelectedSlot)});
$('craftClose').addEventListener('click',()=>setCraftOpen(false));
crafting.addEventListener('pointerdown',e=>{if(e.target===crafting)setCraftOpen(false)});

let last=performance.now(),dayTime=.24;
const DAY_START=.25,DAY_END=.75,DAY_REAL_SECONDS=15*60,NIGHT_REAL_SECONDS=5*60;
let sleeping=false;
function isNightTime(){
  return dayTime<DAY_START||dayTime>=DAY_END;
}
function sleepInBed(){
  if(sleeping||dead||!started)return;
  sleeping=true;
  primaryActionStop();
  Object.keys(keys).forEach(k=>keys[k]=false);
  resetSprint();

  const veil=document.createElement('div');
  veil.setAttribute('role','status');
  veil.textContent='眠っています…';
  Object.assign(veil.style,{
    position:'fixed',inset:'0',zIndex:'55',
    background:'rgba(0,0,0,.97)',color:'#ffffff',
    font:'bold 22px monospace',display:'flex',
    alignItems:'center',justifyContent:'center',
    opacity:'0',transition:'opacity .4s ease',
    pointerEvents:'auto',textAlign:'center'
  });
  document.body.appendChild(veil);
  requestAnimationFrame(()=>{veil.style.opacity='1'});

  setTimeout(()=>{
    // The night is skipped; resume shortly after sunrise.
    dayTime=DAY_START+.02;
    markSaveDirty();
    saveCurrentGame(false);
    sleeping=false;
    veil.textContent='朝になりました';
    setTimeout(()=>{
      veil.style.opacity='0';
      setTimeout(()=>{
        veil.remove();
        flash('朝になりました！ リスポーン地点も設定しました');
      },420);
    },400);
  },650);
}
function advanceDayTime(dt){
  const isDay=dayTime>=DAY_START&&dayTime<DAY_END;
  const halfCycleSeconds=isDay?DAY_REAL_SECONDS:NIGHT_REAL_SECONDS;
  dayTime=(dayTime+dt*(.5/halfCycleSeconds))%1;
}
const forward=new THREE.Vector3(),right=new THREE.Vector3(),move=new THREE.Vector3();
function loop(now){
  const dt=Math.min(.035,(now-last)/1000);last=now;
  if(started&&!dead&&!sleeping){
    updateWorldDrops(dt,now);updatePassiveSpawning(dt);updateHealthRegen(dt);
    const activelySprinting=!craftOpen&&!inventoryOpen&&sprinting&&stamina>0&&isForwardHeld()&&!keys.s&&!keys.arrowdown&&!playerInWater();
    updateStaminaRecovery(dt,activelySprinting);
  }
  if(started&&!dead&&!sleeping&&!craftOpen&&!inventoryOpen){
    updateMining(dt);
    updateEating(dt);
    if(multiRole!=='guest')advanceDayTime(dt);
    updateZombieSpawning(dt);
    const inWater=playerInWater();
    const sy=Math.sin(player.yaw),cy=Math.cos(player.yaw);forward.set(-sy,0,-cy);right.set(cy,0,-sy);move.set(0,0,0);
    if(isForwardHeld())move.add(forward);if(keys.s||keys.arrowdown)move.sub(forward);if(keys.d||keys.arrowright)move.add(right);if(keys.a||keys.arrowleft)move.sub(right);
    const running=sprinting&&stamina>0&&isForwardHeld()&&!keys.s&&!keys.arrowdown&&!inWater;
    if(running)updateStaminaDuringSprint(dt);
    if(move.lengthSq())move.normalize().multiplyScalar(inWater?2.6:(running&&stamina>0?SPRINT_SPEED:WALK_SPEED));
    player.vel.x+=(move.x-player.vel.x)*Math.min(1,dt*(inWater?7:11));
    player.vel.z+=(move.z-player.vel.z)*Math.min(1,dt*(inWater?7:11));
    if(inWater){
      const swimHeld=keys[' ']||keys.swimup;
      if(swimHeld)player.vel.y=Math.min(4.8,player.vel.y+15*dt);
      else player.vel.y=Math.max(-2.2,player.vel.y-3.2*dt);
      player.vel.x*=Math.pow(.86,dt*60);
      player.vel.z*=Math.pow(.86,dt*60);
      player.vel.y*=Math.pow(.96,dt*60);
    }else{
      player.vel.y-=18*dt;
    }
    movePlayerAxis('x',player.vel.x*dt);
    movePlayerAxis('z',player.vel.z*dt);
    const preVerticalY=player.pos.y,wasGrounded=player.onGround,vy=player.vel.y;
    player.onGround=false;
    movePlayerAxis('y',vy*dt);
    const nowInWater=playerInWater();

    if(nowInWater){
      fallOriginY=null;
    }else if(player.onGround){
      if(fallOriginY!=null&&vy<0)applyFallDamage(fallOriginY-player.pos.y);
      fallOriginY=null;
    }else if(wasGrounded&&vy<=0){
      // Walked off an edge: remember the ledge height.
      fallOriginY=preVerticalY;
    }else if(fallOriginY==null&&vy<0){
      // Safety for cases where the player becomes airborne without a normal ledge/jump transition.
      fallOriginY=preVerticalY;
    }

    if(player.pos.y<Y_MIN-5&&!dead){health=0;showDeathScreen()}
    streamChunks();
    processChunkStreaming();
    updatePlayerAvatar(now);
    updateGameCamera();

    const ang=dayTime*Math.PI*2-Math.PI/2,day=Math.max(0,Math.sin(ang));
    sunBox.position.set(player.pos.x+Math.cos(ang)*48,Math.sin(ang)*48,player.pos.z+13);moonBox.position.set(player.pos.x-Math.cos(ang)*48,-Math.sin(ang)*48,player.pos.z-13);sun.position.copy(sunBox.position);
    sun.intensity=.14+2.2*day;hemi.intensity=.25+1.15*day;
    const sky=new THREE.Color().setHSL(.57,.48,.08+.56*day);scene.background.copy(sky);scene.fog.color.copy(sky);
    clouds.forEach((c,i)=>{
      c.position.x+=dt*(.5+i*.01);
      // Wrap in both horizontal directions so the sky stays populated while exploring.
      if(c.position.x>player.pos.x+50)c.position.x=player.pos.x-50;
      else if(c.position.x<player.pos.x-50)c.position.x=player.pos.x+50;
      if(Math.abs(c.position.z-player.pos.z)>45)c.position.z=player.pos.z+(hash3(i,7,9,seed)-.5)*70;
    });

    if(weather==='rain'){const a=rain.geometry.attributes.position.array;for(let i=0;i<rainN;i++){a[i*3+1]-=dt*19;if(a[i*3+1]<0){a[i*3+1]=25+Math.random()*9;a[i*3]=(Math.random()-.5)*44;a[i*3+2]=(Math.random()-.5)*44}}rain.position.set(player.pos.x,0,player.pos.z);rain.geometry.attributes.position.needsUpdate=true}

    mobs.forEach((m,i)=>{
      if(m.userData.hitFlash>0){
        m.userData.hitFlash-=dt;
        if(m.userData.hitFlash<=0)restoreMobColors(m);
      }
      if(m.userData.type==='zombie'){
        updateZombie(m,dt,now);
        return;
      }
      if(m.userData.fleeTime>0){
        m.userData.fleeTime-=dt;
        const dx=m.position.x-player.pos.x,dz=m.position.z-player.pos.z;
        if(dx*dx+dz*dz>1)m.userData.angle=Math.atan2(dx,dz);
      }else{
        m.userData.t-=dt;
        if(m.userData.t<=0){
          m.userData.t=1.5+hash3(i,Math.floor(now/1000),3,seed)*3;
          m.userData.angle+=(hash3(i,4,Math.floor(now/900),seed)-.5)*2.4;
        }
      }
      const fleeMult=m.userData.fleeTime>0?3.4:1;
      const speed=m.userData.speed*fleeMult;
      const x=m.position.x+Math.sin(m.userData.angle)*speed*dt;
      const z=m.position.z+Math.cos(m.userData.angle)*speed*dt;
      const ix=Math.round(x),iz=Math.round(z),h=surfaceAt(ix,iz),bio=biomeAt(ix,iz);
      if(h>SEA&&bio!==6){
        m.position.x=x;m.position.z=z;m.position.y=h+.05;m.rotation.y=m.userData.angle+Math.PI;
      }else if(m.userData.fleeTime>0){
        m.userData.angle+=Math.PI*.65;
      }
    });

    const bx=Math.floor(player.pos.x),bz=Math.floor(player.pos.z);
    coordsEl.textContent=`X ${bx} Y ${Math.floor(player.pos.y)} Z ${bz}`;biomeEl.textContent=biomeNames[biomeAt(bx,bz)]||'Unknown';
    const mins=Math.floor(dayTime*1440),hh=String(Math.floor(mins/60)%24).padStart(2,'0'),mm=String(mins%60).padStart(2,'0');
    clockEl.textContent=(isNightTime()?'☾':'☀')+' '+hh+':'+mm+(isNightTime()?'  🧟 '+countZombies():'');
    const eye=blockAtPoint(player.pos.x,player.pos.y+EYE,player.pos.z);scene.fog.near=eye===B.WATER?1:28;scene.fog.far=eye===B.WATER?14:66;
  }
  if(started&&multiRole)multiTick(now);
  if(!started||dead||sleeping)playerAvatar.visible=false;
  renderer.render(scene,camera);
  requestAnimationFrame(loop);
}

function resize(){renderer.setSize(innerWidth,innerHeight,false);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix()}
addEventListener('resize',resize);resize();


/* Real-time, host-owned 4-player rooms. Single saves remain separate. */
const multiplayerNetwork=createBlockworldNetwork(multiEvent,()=>({
  roomCode:multiplayerNetwork.connected?multiplayerNetwork.code:''
}));
const multiViews=['multiHome','multiSlots','multiJoin','multiFriends','multiLobby'];
let multiViewId='multiHome',multiPresenceBusy=false,friendRefreshBusy=false;
function multiWorldKey(slot){return MULTI_HOST+currentAccount.key+':'+slot}
function multiHandoffSaveKey(originId,slot){return MULTI_HANDOFF+currentAccount.key+':'+originId+':'+slot}
function multiGuestSaveKey(){return MULTI_MEMBER+currentAccount.key+':'+multiHostId+':'+multiHostSlot}
function multiOwnId(){
  const key=FRIEND_ID+currentAccount.key;let id=localStorage.getItem(key);
  if(!id||!/^[A-Z2-9]{10}$/.test(id)){
    const chars='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    id=Array.from(crypto.getRandomValues(new Uint8Array(10)),b=>chars[b%chars.length]).join('');
    localStorage.setItem(key,id);
  }
  return id;
}
function multiGetFriends(){try{return JSON.parse(localStorage.getItem(FRIENDS_KEY+currentAccount.key)||'{}')}catch{return {}}}
function multiSaveFriend(id,name){
  if(!/^[A-Z2-9]{10}$/.test(id)||id===multiOwnId())return;
  const friends=multiGetFriends();friends[id]=(name||'フレンド').slice(0,20);
  localStorage.setItem(FRIENDS_KEY+currentAccount.key,JSON.stringify(friends));multiRenderFriends();
}
function multiStatus(s){$('multiStatus').textContent=s}
function multiView(v){
  multiViewId=v;
  multiViews.forEach(id=>$(id).hidden=id!==v);
  $('multiTitle').textContent=({multiHome:'マルチプレイ',multiSlots:'ワールドを作る',multiJoin:'コードで参加',multiFriends:'フレンド一覧',multiLobby:'マルチプレイの部屋'})[v];
  if(v==='multiSlots')multiRenderSlots();
  if(v==='multiFriends')multiRenderFriends();
}
function multiShow(v='multiHome'){
  menuCover.style.display='none';worldCover.style.display='none';
  $('multiCover').style.display='flex';multiView(v);
  cover.style.display=worldReady?'flex':'none';
  multiStatus('最大4人。作成者が退出しても、残った人にホストを引き継ぎます。');
  document.exitPointerLock?.();
}
function multiStartPresence(){
  if(!currentAccount||multiPresenceBusy)return;
  multiPresenceBusy=true;
  multiplayerNetwork.startPresence(multiOwnId(),currentAccount.name)
    .catch(e=>console.warn('Friends are unavailable',e))
    .finally(()=>multiPresenceBusy=false);
}
function multiCode(){
  const chars='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from(crypto.getRandomValues(new Uint8Array(6)),b=>chars[b%chars.length]).join('');
}
function multiCurrentPose(){
  return {
    x:player.pos.x,y:player.pos.y,z:player.pos.z,
    yaw:player.yaw,pitch:player.pitch,
    speed:Math.hypot(player.vel.x,player.vel.z),
    onGround:player.onGround
  };
}
function multiProfile(){
  return {name:currentAccount.name,savedAt:Date.now(),level,xp,health,stamina,staminaRunSeconds,
    staminaRegenSeconds,cameraMode,selectedHotbarIndex,
    inventorySlots:inventorySlots.map(s=>s?{id:s.id,qty:s.qty}:null),
    bedSpawn:bedSpawn?{...bedSpawn}:null,
    player:multiCurrentPose()};
}
function multiPeople(){
  const names=[currentAccount.name+'（自分）',...[...multiGuestRecords.values()].map(r=>r.name)];
  $('multiPeople').textContent='参加人数：'+names.length+'/4人\n'+names.map(n=>'・'+n).join('\n');
}
function multiLobby(code,host){
  $('multiRoomCode').textContent=code;
  $('multiRoomTip').textContent=host?'このコードを友達に教えてください。ホストが退出しても残った人は続行できます。':'ワールドに接続しました。';
  $('multiEnter').hidden=!host;
  $('multiLeave').textContent='ワールドから退出';
  multiView('multiLobby');multiPeople();$('multiCover').style.display='flex';
}
function multiRenderSlots(){
  const grid=$('multiSlotGrid');grid.replaceChildren();
  for(let i=1;i<=5;i++){
    let save=null;try{save=JSON.parse(localStorage.getItem(multiWorldKey(i))||'null')}catch{}
    const card=document.createElement('div');card.className='multi-slot';
    const name=document.createElement('strong');name.textContent='MULTI WORLD '+i;
    const detail=document.createElement('span');detail.textContent=save?'保存済 · '+formatSavedAt(save.savedAt):'新規ワールド';
    const actions=document.createElement('div');actions.className='multi-slot-actions';
    const play=document.createElement('button');play.type='button';play.textContent=save?'続きを開く':'新しく作る';
    play.addEventListener('click',()=>multiHost(i,save));actions.append(play);
    if(save){
      const del=document.createElement('button');del.type='button';del.className='multi-delete';del.textContent='削除';
      del.addEventListener('click',()=>{
        if(confirm('マルチワールド'+i+'を削除しますか？ 参加者の保存データも消えます。')){
          localStorage.removeItem(multiWorldKey(i));multiRenderSlots();
        }
      });actions.append(del);
    }
    card.append(name,detail,actions);grid.append(card);
  }
  // A player who takes over somebody else's room keeps an isolated local
  // backup. It can be reopened without replacing their own five worlds.
  const prefix=MULTI_HANDOFF+currentAccount.key+':';
  for(let i=0;i<localStorage.length;i++){
    const key=localStorage.key(i);
    if(!key?.startsWith(prefix))continue;
    let saved=null;try{saved=JSON.parse(localStorage.getItem(key)||'null')}catch{}
    if(!saved||!Number.isInteger(saved.worldSlot))continue;
    const origin=key.slice(prefix.length).split(':')[0],slot=saved.worldSlot;
    if(!/^[A-Z2-9]{10}$/.test(origin)||slot<1||slot>5)continue;
    const card=document.createElement('div');card.className='multi-slot';
    const name=document.createElement('strong');name.textContent='引き継いだ WORLD '+slot;
    const desc=document.createElement('span');desc.textContent='元の作成者：'+(saved.originName||origin)+' · '+formatSavedAt(saved.savedAt);
    const buttons=document.createElement('div');buttons.className='multi-slot-actions';
    const play=document.createElement('button');play.type='button';play.textContent='続きから開く';
    play.addEventListener('click',()=>multiHost(slot,saved,origin));
    const del=document.createElement('button');del.type='button';del.className='multi-delete';del.textContent='削除';
    del.addEventListener('click',()=>{if(confirm('引き継いだワールドの保存データを削除しますか？')){localStorage.removeItem(key);multiRenderSlots()}});
    buttons.append(play,del);card.append(name,desc,buttons);grid.append(card);
  }
}
async function multiHost(slot,save,originId=null){
  if(multiBusy)return;
  multiBusy=true;multiRole='host';multiHostSlot=slot;multiHostId=originId||multiOwnId();
  multiOriginName=save?.originName||currentAccount.name;
  multiMigration=null;multiCheckpoint=null;multiRoster=[];multiLastCheckpoint=0;
  multiGuestRecords.clear();multiMembers=save?.members&&typeof save.members==='object'?save.members:{};
  multiStatus('ワールドを準備しています…');
  try{
    await initializeAccountWorld(save,slot);
    multiStatus('部屋を作成しています…');
    let code;
    for(let i=0;i<4;i++){
      code=multiCode();
      try{await multiplayerNetwork.host(code);break}
      catch(e){if(i===3)throw e}
    }
    multiRoster=[{id:multiOwnId(),name:currentAccount.name,player:multiCurrentPose()}];
    multiLobby(code,true);multiStatus('部屋を作成しました！');
  }catch(e){multiLeave(true);multiShow('multiSlots');multiStatus('部屋を作れません：'+e.message)}
  finally{multiBusy=false}
}
async function multiJoin(code){
  code=code.toUpperCase().trim();
  if(!/^[A-Z0-9]{6}$/.test(code)){multiStatus('6文字のコードを入力してください');return}
  if(multiBusy)return;
  multiBusy=true;multiStatus('ホストに接続しています…');
  try{
    await multiplayerNetwork.join(code);
    multiRole='guest';
    multiplayerNetwork.send({t:'hello',id:multiOwnId(),name:currentAccount.name});
    multiStatus('ホストからワールドを受信しています…');
    multiPendingTimer=setTimeout(()=>{
      if(multiRole==='guest'&&!worldReady){multiLeave(true);multiShow('multiJoin');multiStatus('ワールドの受信がタイムアウトしました')}
    },30000);
  }catch(e){multiplayerNetwork.leaveRoom();multiRole=null;multiStatus('参加できません：'+e.message)}
  finally{multiBusy=false}
}
// Remote players use precisely the same detailed character mesh as this player:
// hair, eyes, mouth, backpack, clothing details and pivoting arms/legs.
let multiLastVisualFrame=0;
function multiShowAvatar(id,pose){
  if(id===multiOwnId()||!pose||!Number.isFinite(pose.x)||!Number.isFinite(pose.y)||!Number.isFinite(pose.z))return;
  if(Math.abs(pose.x)>1000000||Math.abs(pose.y)>1000000||Math.abs(pose.z)>1000000)return;
  const yaw=Number.isFinite(pose.yaw)?pose.yaw:0;
  let model=multiAvatars.get(id);
  if(!model){
    model=createPlayerModel();
    model.userData.multiMove={
      target:new THREE.Vector3(pose.x,pose.y,pose.z),
      yaw,speed:0,grounded:true,phase:0,swing:0,lastReceived:performance.now()
    };
    model.position.set(pose.x,pose.y,pose.z);
    model.rotation.y=yaw;
    model.visible=started;
    scene.add(model);multiAvatars.set(id,model);
  }
  const motion=model.userData.multiMove;
  motion.target.set(pose.x,pose.y,pose.z);
  motion.yaw=yaw;
  // Older clients only send a position; estimate speed as fallback.
  const dt=Math.max(.05,(performance.now()-motion.lastReceived)/1000);
  const sampledSpeed=model.position.distanceTo(motion.target)/dt;
  motion.speed=Number.isFinite(pose.speed)?Math.max(0,Math.min(8,pose.speed)):Math.min(8,sampledSpeed);
  motion.grounded=pose.onGround!==false;
  motion.lastReceived=performance.now();
}
function multiAnimateAvatars(now){
  const dt=multiLastVisualFrame?Math.max(0,Math.min(.05,(now-multiLastVisualFrame)/1000)):1/60;
  multiLastVisualFrame=now;
  const lerp=Math.min(1,dt*14),turnLerp=Math.min(1,dt*13),swingLerp=Math.min(1,dt*12);
  for(const model of multiAvatars.values()){
    model.visible=started;
    if(!started)continue;
    const m=model.userData.multiMove;
    // Teleports/respawns should be instant; ordinary walking is smoothed.
    if(model.position.distanceToSquared(m.target)>81)model.position.copy(m.target);
    else model.position.lerp(m.target,lerp);
    const turn=Math.atan2(Math.sin(m.yaw-model.rotation.y),Math.cos(m.yaw-model.rotation.y));
    model.rotation.y+=turn*turnLerp;
    const fresh=now-m.lastReceived<700;
    const wantedSwing=fresh&&m.speed>.3?Math.min(.58,m.speed*.12):0;
    m.swing+=(wantedSwing-m.swing)*swingLerp;
    if(m.swing>.01&&fresh)m.phase+=dt*(m.speed>5.2?13.05:9);
    const stride=Math.sin(m.phase)*m.swing,limbs=model.userData.limbs;
    limbs.leftLeg.rotation.x=stride;
    limbs.rightLeg.rotation.x=-stride;
    limbs.leftArm.rotation.x=-stride*.8;
    limbs.rightArm.rotation.x=stride*.8;
    if(!m.grounded){
      limbs.leftLeg.rotation.x=.15;
      limbs.rightLeg.rotation.x=-.15;
    }
  }
}
function multiClearAvatars(){
  for(const model of multiAvatars.values()){
    scene.remove(model);model.traverse(o=>{if(o.isMesh)o.geometry.dispose()});
  }
  multiAvatars.clear();multiLastVisualFrame=0;
}
function multiApplyBlock(b){
  if(!worldReady||![b.x,b.y,b.z,b.v].every(Number.isInteger))return;
  if(!inside(b.x,b.y,b.z)||b.v<0||b.v>B.BED_HEAD||Math.abs(b.x)>1000000||Math.abs(b.z)>1000000)return;
  if(get(b.x,b.y,b.z)===b.v)return;
  multiApplying=true;try{set(b.x,b.y,b.z,b.v);rebuildEdited({x:b.x,z:b.z})}
  finally{multiApplying=false}
}
function multiApplyDrop(message){
  if(!worldReady)return;
  multiApplying=true;
  try{
    if(message.t==='dropAdd'){
      const d=message.drop;
      if(!d||typeof d.uid!=='string'||d.uid.length>80||!Number.isFinite(d.x)||!Number.isFinite(d.y)||!Number.isFinite(d.z))return;
      if(worldDrops.some(x=>x.uid===d.uid))return;
      spawnWorldDrop(d.id,d.qty,d.x,d.y,d.z,{uid:d.uid,age:d.age,networkSilent:true});
    }else{
      const d=worldDrops.find(x=>x.uid===message.uid);
      if(d)removeWorldDrop(d);
    }
  }finally{multiApplying=false}
}
async function multiWelcome(message){
  if(multiRole!=='guest'||!message.world)return;
  if(worldReady){
    multiCheckpoint={...message,t:'checkpoint',hostId:message.currentHostId||message.hostId,
      originId:message.hostId,originName:message.originName||multiOriginName,
      world:{...message.world,members:message.members||{}},people:message.people||[]};
    if(Array.isArray(message.people))multiUpdateRoster(message.people);
    for(const p of message.people||[])multiShowAvatar(p.id,p.player);
    // Rejoining an ongoing migrated room must not reset this player's items.
    multiplayerNetwork.send({t:'profile',profile:multiProfile()});
    return;
  }
  clearTimeout(multiPendingTimer);multiPendingTimer=null;
  multiHostId=message.hostId;multiHostSlot=message.slot;
  multiOriginName=message.originName||multiOriginName||'プレイヤー';
  multiCheckpoint={...message,t:'checkpoint',hostId:message.currentHostId||message.hostId,
    originId:message.hostId,originName:message.originName,
    world:{...message.world,members:message.members||{}},people:message.people||[]};
  multiUpdateRoster(message.people);
  let backup=null;try{backup=JSON.parse(localStorage.getItem(multiGuestSaveKey())||'null')}catch{}
  const stored=message.member;
  const who=backup&&(!stored||backup.savedAt>stored.savedAt)?backup:stored;
  const data={...message.world,version:4,inventorySlots:Array(36).fill(null),
    selectedHotbarIndex:0,level:1,xp:0,health:20,stamina:20,staminaRunSeconds:0,
    staminaRegenSeconds:0,cameraMode:0,player:null,bedSpawn:null};
  if(who)for(const field of ['inventorySlots','selectedHotbarIndex','level','xp','health','stamina','staminaRunSeconds','staminaRegenSeconds','cameraMode','player','bedSpawn'])
    if(Object.hasOwn(who,field))data[field]=who[field];
  try{
    await initializeAccountWorld(data,message.slot);
    $('multiCover').style.display='none';$('startBtn').click();
    for(const p of message.people||[])multiShowAvatar(p.id,p.player);
    multiplayerNetwork.send({t:'profile',profile:multiProfile()});
  }catch(e){multiLeave(true);multiShow('multiJoin');multiStatus('読み込みに失敗：'+e.message)}
}

// Host migration (the URL stays static; remaining players claim the same
// PeerJS room code). A checkpoint lets players recover from a sudden drop.
function multiRosterSnapshot(){
  return [{id:multiOwnId(),name:currentAccount.name,player:multiCurrentPose()},
    ...[...multiGuestRecords.values()].map(p=>({id:p.id,name:p.name,player:p.player||null}))];
}
function multiCheckpointNow(){
  return {
    t:'checkpoint',originId:multiHostId,originName:multiOriginName||currentAccount.name,
    hostId:multiOwnId(),slot:currentWorldSlot,
    world:{...makeSaveData(),members:{...multiMembers}},
    people:multiRosterSnapshot()
  };
}
function multiUpdateRoster(people){
  if(!Array.isArray(people))return;
  const seen=new Set(),valid=[];
  for(const p of people){
    if(!p||typeof p.id!=='string'||!/^[A-Z2-9]{10}$/.test(p.id)||seen.has(p.id))continue;
    seen.add(p.id);valid.push({id:p.id,name:String(p.name||'プレイヤー').slice(0,20),player:p.player||null});
  }
  multiRoster=valid;
}
function multiProfileFromWorld(world){
  const fields=['inventorySlots','selectedHotbarIndex','level','xp','health','stamina','staminaRunSeconds',
    'staminaRegenSeconds','cameraMode','player','bedSpawn'];
  const p={savedAt:world.savedAt||Date.now()};
  for(const k of fields)if(Object.hasOwn(world,k))p[k]=world[k];
  return p;
}
function multiMigrationMembers(snapshot){
  const members={...(snapshot.world?.members||{})};
  if(snapshot.hostId&&snapshot.hostId!==multiOwnId())
    members[snapshot.hostId]=multiProfileFromWorld(snapshot.world);
  return members;
}
function multiRemoveAvatar(id){
  const model=multiAvatars.get(id);
  if(!model)return;
  scene.remove(model);model.traverse(o=>{if(o.isMesh)o.geometry.dispose()});multiAvatars.delete(id);
}
function multiPrepareMigration(checkpoint,plannedLeader=null){
  if(multiRole!=='guest'||multiMigration||!worldReady)return;
  const code=multiplayerNetwork.code;
  if(!/^[A-Z0-9]{6}$/.test(code))return;
  const knownPeople=plannedLeader&&Array.isArray(checkpoint?.people)
    ?checkpoint.people:(multiRoster.length?multiRoster:(checkpoint.people||[]));
  const participants=knownPeople
    .filter(p=>p&&/^[A-Z2-9]{10}$/.test(p.id)&&p.id!==checkpoint.hostId);
  // Only active participants can become successor. This order is deterministic
  // on all clients; no master server or account-name search is required.
  const candidates=[...new Set(participants.map(p=>p.id))].sort();
  const leader=candidates.includes(plannedLeader)?plannedLeader:candidates[0];
  if(!leader){multiLeave(true);multiShow();multiStatus('参加者がいないため部屋を終了しました');return}
  multiMigration={
    code,leader,checkpoint,people:participants,
    generation:++multiMigrationGeneration
  };
  multiCheckpoint=checkpoint;
  multiUpdateRoster(participants);
  // The departing host must disappear from *every* remaining player's
  // screen, not only the guest who becomes the successor.
  multiRemoveAvatar(checkpoint.hostId);
  flash('ホストを引き継いでいます…');
  if(leader===multiOwnId())setTimeout(()=>multiPromoteHost(multiMigration),1200);
  else setTimeout(()=>multiReconnectHost(multiMigration),1400);
}
async function multiPromoteHost(job){
  if(multiMigration!==job||multiRole!=='guest')return;
  // Guests already own the latest blocks and world drops in memory.
  // Merge the host checkpoint where this peer has not received an edit,
  // without wiping its inventory, player position or ongoing gameplay.
  const world=job.checkpoint.world||{};
  if(Array.isArray(world.edits)){
    for(const entry of world.edits){
      if(!Array.isArray(entry)||typeof entry[0]!=='string'||!Array.isArray(entry[1]))continue;
      let edits=editChunks.get(entry[0]);
      if(!edits){edits=new Map();editChunks.set(entry[0],edits)}
      const loaded=chunks.get(entry[0]);let changed=false;
      for(const pair of entry[1]){
        if(!Array.isArray(pair)||!Number.isInteger(pair[0])||!Number.isInteger(pair[1]))continue;
        if(pair[0]<0||pair[0]>=CHUNK*HEIGHT*CHUNK)continue;
        if(!edits.has(pair[0])){
          edits.set(pair[0],pair[1]);
          if(loaded){loaded.data[pair[0]]=pair[1];changed=true}
        }
      }
      if(changed&&loaded)queueMeshNear(loaded.cx,loaded.cz);
    }
  }
  multiHostId=job.checkpoint.originId||multiHostId;
  multiHostSlot=job.checkpoint.slot||currentWorldSlot;
  multiOriginName=job.checkpoint.originName||multiOriginName||'プレイヤー';
  multiMembers=multiMigrationMembers(job.checkpoint);
  // A successor must not retain another player's old saved host profile as
  // its own inventory. Its own current inventory stays entirely untouched.
  multiRole='host';multiGuestRecords.clear();
  multiRemoveAvatar(job.checkpoint.hostId);
  const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
  for(let attempt=0;attempt<12;attempt++){
    if(multiMigration!==job||multiRole!=='host')return;
    try{
      await multiplayerNetwork.host(job.code);
      if(multiMigration!==job){multiplayerNetwork.leaveRoom({handoff:true});return}
      multiMigration=null;multiLastCheckpoint=0;
      saveCurrentGame(false);
      flash('ホストを引き継ぎました！このまま遊べます');
      return;
    }catch(e){
      if(attempt===11){console.warn('Host migration failed',e);break}
      await sleep(550+attempt*150);
    }
  }
  if(multiMigration===job){
    // If another participant claimed the code first, rejoin their session.
    multiRole='guest';await multiReconnectHost(job);
  }
}
async function multiReconnectHost(job){
  if(multiMigration!==job)return;
  const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
  for(let attempt=0;attempt<16;attempt++){
    if(multiMigration!==job||!worldReady)return;
    try{
      await multiplayerNetwork.join(job.code);
      if(multiMigration!==job)return;
      multiRole='guest';
      multiplayerNetwork.send({t:'hello',id:multiOwnId(),name:currentAccount.name,rejoining:true});
      // Keep rendering and gameplay while the connection is restored.
      multiMigration=null;
      multiCheckpoint=job.checkpoint;
      flash('新しいホストにつながりました');
      return;
    }catch(e){
      if(attempt===15){console.warn('Rejoin after host migration failed',e);break}
      await sleep(600+Math.min(attempt,8)*160);
    }
  }
  if(multiMigration===job){
    multiMigration=null;multiLeave(true);multiShow();
    multiStatus('ホストの引き継ぎができませんでした。再度参加してください。');
  }
}
function multiHostExitSnapshot(){
  if(multiRole!=='host'||!multiplayerNetwork.connected||!multiGuestRecords.size)return false;
  const snap=multiCheckpointNow();
  // The creator remains in the members map so their inventory returns
  // intact if they rejoin later.
  const people=snap.people.filter(p=>p.id!==multiOwnId());
  if(!people.length)return false;
  const leader=[...people].sort((a,b)=>a.id.localeCompare(b.id))[0].id;
  multiplayerNetwork.send({...snap,t:'handoff',leader});
  return true;
}
function multiRoomData(message,peerId){
  if(message.t==='reject'){multiLeave(true);multiShow('multiJoin');multiStatus(message.reason||'参加できません');return}
  if(message.t==='handoff'){
    // Explicit departure: the latest complete world is delivered before close.
    multiPrepareMigration({...message,t:'checkpoint'},message.leader);return;
  }
  if(message.t==='checkpoint'){
    if(multiRole==='guest'&&!multiMigration){
      multiCheckpoint=message;multiUpdateRoster(message.people);
    }
    return;
  }
  if(message.t==='roster'){
    if(multiRole==='guest'&&!multiMigration)multiUpdateRoster(message.people);
    return;
  }
  if(message.t==='roomClosed'){
    if(multiRole==='guest'&&multiCheckpoint){multiPrepareMigration(multiCheckpoint);return}
    multiLeave(true);multiShow('multiHome');multiStatus('部屋が終了しました');return;
  }
  if(message.t==='welcome'){multiWelcome(message);return}
  if(!multiRole||!multiplayerNetwork.connected)return;
  if(multiRole==='host'){
    if(message.t==='hello'){
      if(typeof message.name!=='string'||!/^[A-Z2-9]{10}$/.test(message.id||''))return;
      if(multiGuestRecords.size>=3||[...multiGuestRecords.values()].some(p=>p.id===message.id)){
        multiplayerNetwork.send({t:'reject',reason:'部屋は満員か、同じプレイヤーが参加しています'},peerId);return;
      }
      const record={id:message.id,name:message.name.slice(0,20)};
      multiGuestRecords.set(peerId,record);
      const people=multiRosterSnapshot();
      multiplayerNetwork.send({
        t:'welcome',world:makeSaveData(),hostId:multiHostId,
        originName:multiOriginName,currentHostId:multiOwnId(),members:multiMembers,
        slot:currentWorldSlot,member:multiMembers[record.id]||null,people
      },peerId);
      multiplayerNetwork.send({t:'roster',people});
      multiplayerNetwork.send({t:'joinNotice',name:record.name});
      multiPeople();return;
    }
    const from=multiGuestRecords.get(peerId);if(!from)return;
    if(message.t==='pose'&&message.player&&Number.isFinite(message.player.x)){
      from.player=message.player;multiShowAvatar(from.id,from.player);
      multiplayerNetwork.send({t:'pose',id:from.id,player:from.player});
    }else if(message.t==='profile'&&Array.isArray(message.profile?.inventorySlots)){
      multiMembers[from.id]={...message.profile,name:from.name};markSaveDirty();
    }else if(message.t==='block'){multiApplyBlock(message);multiplayerNetwork.send(message)}
    else if(message.t==='dropAdd'||message.t==='dropRemove'){multiApplyDrop(message);multiplayerNetwork.send(message)}
  }else{
    if(message.t==='pose')multiShowAvatar(message.id,message.player);
    if(message.t==='block')multiApplyBlock(message);
    if(message.t==='dropAdd'||message.t==='dropRemove')multiApplyDrop(message);
    if(message.t==='time'){
      if(Number.isFinite(message.dayTime))dayTime=message.dayTime;
      if(['clear','rain'].includes(message.weather)){
        weather=message.weather;rain.visible=weather==='rain';weatherEl.textContent=weather==='rain'?'Rain':'Clear';
      }
    }
    if(message.t==='peerLeft'){
      multiRemoveAvatar(message.id);
      multiRoster=multiRoster.filter(p=>p.id!==message.id);
    }
    if(message.t==='joinNotice')flash(message.name+' が参加しました');
  }
}
function multiEvent(e){
  if(e.type==='roomData'){multiRoomData(e.message,e.peerId);return}
  if(e.type==='peerLeft'){
    const guest=multiGuestRecords.get(e.peerId);
    if(guest){
      multiGuestRecords.delete(e.peerId);
      const model=multiAvatars.get(guest.id);
      if(model){scene.remove(model);model.traverse(o=>{if(o.isMesh)o.geometry.dispose()});multiAvatars.delete(guest.id)}
      multiplayerNetwork.send({t:'peerLeft',id:guest.id});
      multiplayerNetwork.send({t:'roster',people:multiRosterSnapshot()});
      multiPeople();
      if(worldReady)saveCurrentGame(false);
    }
  }
  if(e.type==='roomLost'&&multiRole&&!multiClosing){
    if(multiMigration)return;
    if(multiRole==='guest'&&multiCheckpoint&&worldReady){
      multiPrepareMigration(multiCheckpoint);return;
    }
    multiLeave(true);multiShow();multiStatus(e.reason||'接続が切れました');
  }
  if(e.type==='roomError'&&!multiMigration)multiStatus(e.reason||'通信エラー');
  if(e.type==='friendRequest'){
    const pending=$('friendPending');pending.hidden=false;pending.replaceChildren();
    const span=document.createElement('span');span.textContent=e.name+' からフレンド申請が届きました。';
    const accept=document.createElement('button');accept.type='button';accept.textContent='承認';
    accept.onclick=async()=>{multiSaveFriend(e.id,e.name);pending.hidden=true;
      try{await multiplayerNetwork.talkToFriend(e.id,{t:'friendAccepted',friendId:multiOwnId(),name:currentAccount.name})}catch{}
    };
    pending.append(span,accept);
    if($('multiCover').style.display!=='flex')flash('フレンド申請が届きました');
  }
  if(e.type==='friendAccepted'){multiSaveFriend(e.id,e.name);multiStatus('フレンドになりました：'+e.name)}
}
function multiTick(now){
  if(now-multiLastPose>150){
    multiLastPose=now;
    if(multiplayerNetwork.connected){
      multiplayerNetwork.send({t:'pose',player:multiCurrentPose()});
      if(multiRole==='host'&&Math.floor(now/2200)!==Math.floor((now-150)/2200))
        multiplayerNetwork.send({t:'time',dayTime,weather});
      // Periodic backup so a sudden tab closure also has a recovery path.
      if(multiRole==='host'&&multiGuestRecords.size&&now-multiLastCheckpoint>40000){
        multiLastCheckpoint=now;
        multiplayerNetwork.send(multiCheckpointNow());
      }
    }
  }
  if(multiRole==='guest'&&now-multiLastProfile>8000){multiLastProfile=now;saveCurrentGame(false)}
  multiAnimateAvatars(now);
}
function multiLeave(silent=false){
  if(multiClosing)return;
  multiClosing=true;
  clearTimeout(multiPendingTimer);multiPendingTimer=null;
  clearTimeout(multiProfileSaveTimer);multiProfileSaveTimer=null;
  if(worldReady)saveCurrentGame(false);
  const handoff=multiHostExitSnapshot();
  multiRole=null;multiHostSlot=null;multiHostId='';multiOriginName='';
  multiMigration=null;multiCheckpoint=null;multiRoster=[];
  multiplayerNetwork.leaveRoom({handoff});
  multiGuestRecords.clear();multiMembers={};multiClearAvatars();
  clearInterval(saveInterval);saveInterval=null;
  if(worldReady){resetWorldRuntime();worldReady=false;currentWorldSlot=null}
  cover.style.display='none';accountBox.style.display='none';
  document.exitPointerLock?.();
  multiClosing=false;
  if(!silent)multiShow();
}
function multiRenderFriends(){
  if(!currentAccount)return;
  $('friendSelfId').textContent=multiOwnId();
  const list=$('friendList');list.replaceChildren();
  const friends=multiGetFriends();
  if(!Object.keys(friends).length){const p=document.createElement('p');p.textContent='フレンドはいません。IDを交換して申請できます。';list.append(p)}
  for(const [id,name] of Object.entries(friends)){
    const card=document.createElement('div');card.className='friend-card';
    const text=document.createElement('div'),title=document.createElement('strong');title.textContent=name;
    const sub=document.createElement('span');sub.textContent=' ID: '+id+' · ⚫ 確認中';
    text.append(title,sub);card.append(text);
    const button=document.createElement('button');button.type='button';button.textContent='削除';
    button.onclick=()=>{const next=multiGetFriends();delete next[id];localStorage.setItem(FRIENDS_KEY+currentAccount.key,JSON.stringify(next));multiRenderFriends()};
    card.append(button);list.append(card);
    multiplayerNetwork.talkToFriend(id,{t:'status'},3000).then(data=>{
      multiFriendsOnline.set(id,data);
      sub.textContent=' ID: '+id+(data.roomCode?' · 🎮 プレイ中':' · 🟢 オンライン');
      if(data.roomCode){
        const join=document.createElement('button');join.type='button';join.textContent='参加';
        join.onclick=()=>{multiView('multiJoin');$('multiCodeInput').value=data.roomCode;multiJoin(data.roomCode)};
        card.insertBefore(join,button);
      }
    }).catch(()=>{multiFriendsOnline.delete(id);sub.textContent=' ID: '+id+' · ⚫ オフライン'});
  }
}
$('multiPlayBtn').addEventListener('click',()=>multiShow());
$('multiHostBtn').addEventListener('click',()=>multiView('multiSlots'));
$('multiJoinBtn').addEventListener('click',()=>multiView('multiJoin'));
$('multiFriendsBtn').addEventListener('click',()=>multiView('multiFriends'));
$('multiBack').addEventListener('click',()=>{
  if(multiViewId==='multiLobby'){multiLeave();return}
  if(multiViewId!=='multiHome'){multiView('multiHome');return}
  $('multiCover').style.display='none';menuCover.style.display='flex';
});
$('multiLeave').addEventListener('click',()=>multiLeave());
$('multiEnter').addEventListener('click',()=>{
  if(multiRole!=='host'||!worldReady)return;
  $('multiCover').style.display='none';$('startBtn').click();
});
$('multiJoinForm').addEventListener('submit',e=>{e.preventDefault();multiJoin($('multiCodeInput').value)});
$('friendAddForm').addEventListener('submit',async e=>{
  e.preventDefault();const id=$('friendAddId').value.trim().toUpperCase();
  if(!/^[A-Z2-9]{10}$/.test(id)||id===multiOwnId()){multiStatus('正しい10文字のフレンドIDを入力してください');return}
  try{
    await multiplayerNetwork.talkToFriend(id,{t:'friendRequest',friendId:multiOwnId(),name:currentAccount.name});
    multiStatus('フレンド申請を送りました。相手の承認を待ってください。');
  }catch(error){multiStatus('申請できません：'+error.message)}
});
$('friendCopy').addEventListener('click',async()=>{
  try{await navigator.clipboard.writeText(multiOwnId());multiStatus('フレンドIDをコピーしました')}
  catch{multiStatus('フレンドID：'+multiOwnId())}
});
$('friendRefresh').addEventListener('click',multiRenderFriends);

showLogin.addEventListener('click',()=>setAuthMode('login'));
showCreate.addEventListener('click',()=>setAuthMode('create'));
authForm.addEventListener('submit',submitAuth);
setAuthMode('login');

singlePlayBtn.addEventListener('click',showWorldSelection);
worldBack.addEventListener('click',showMainMenu);
menuLogout.addEventListener('click',()=>{clearSession();location.reload()});
saveNowBtn.addEventListener('click',()=>saveCurrentGame(true));
worldListBtn.addEventListener('click',()=>{
  if(!currentAccount)return;
  if(multiRole)multiLeave();else showWorldSelection();
});
worldLogout.addEventListener('click',()=>{clearSession();location.reload()});
logoutBtn.addEventListener('click',()=>{
  if(!currentAccount)return;
  if(confirm('セーブしてログアウトしますか？')){
    saveCurrentGame(false);
    const handoff=multiRole==='host'&&multiGuestRecords.size>0;
    if(multiRole)multiLeave(true);
    clearInterval(saveInterval);clearSession();
    // A reload right away would abort in-flight WebRTC world migration.
    if(handoff)setTimeout(()=>location.reload(),900);
    else location.reload();
  }
});
document.addEventListener('visibilitychange',()=>{if(document.hidden)saveCurrentGame(false)});
addEventListener('pagehide',()=>saveCurrentGame(false));

respawnBtn.addEventListener('click',()=>respawnPlayer());

$('viewModeButton').addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();cycleCameraMode()});
updateViewLabel();
$('startBtn').addEventListener('click',()=>{
  if(!worldReady||!currentAccount)return;
  started=true;cover.style.display='none';last=performance.now();renderHealth();
  if(dead){showDeathScreen();return}
  if(!matchMedia('(pointer:coarse)').matches)renderer.domElement.requestPointerLock?.();
});
if(!restoreSession())authName.focus();
requestAnimationFrame(loop);
