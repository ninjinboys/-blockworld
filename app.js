import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.180.0/+esm';

const $=id=>document.getElementById(id);
const game=$('game'),coordsEl=$('coords'),biomeEl=$('biome'),clockEl=$('clock'),weatherEl=$('weather'),hotbarEl=$('hotbar'),msgEl=$('message'),cover=$('startCover'),loading=$('loading'),crafting=$('crafting'),recipeList=$('recipeList'),craftInventory=$('craftInventory'),levelText=$('levelText'),xpText=$('xpText'),xpFill=$('xpFill'),blueprintText=$('blueprintText'),breakMeter=$('breakMeter'),breakLabel=$('breakLabel'),breakFill=$('breakFill');
const authCover=$('authCover'),authForm=$('authForm'),authName=$('authName'),authPassword=$('authPassword'),authSubmit=$('authSubmit'),authError=$('authError'),authModeText=$('authModeText'),showLogin=$('showLogin'),showCreate=$('showCreate'),accountNameEl=$('accountName'),saveStatusEl=$('saveStatus'),saveNowBtn=$('saveNow'),logoutBtn=$('logoutBtn');
const worldCover=$('worldCover'),worldGrid=$('worldGrid'),worldAccountName=$('worldAccountName'),worldLogout=$('worldLogout'),worldListBtn=$('worldListBtn'),accountBox=$('accountBox');

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

const CHUNK=16,RENDER_RADIUS=3,HEIGHT=48,SEA=11;
const B={AIR:0,GRASS:1,DIRT:2,STONE:3,SAND:4,WATER:5,LOG:6,LEAF:7,COAL:8,IRON:9,GOLD:10,DIAMOND:11,SNOW:12,GRAVEL:13,CACTUS:14,PLANK:15,COBBLE:16,GLASS:17,BEDROCK:18,CRAFTING_TABLE:19,FURNACE:20};
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
  WOOD_AXE:138
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
  138:'木の斧'
};
const biomeNames=['Plains','Forest','Desert','Taiga','Snowy Peaks','Swamp','Ocean','River'];
const buildable=[B.GRASS,B.DIRT,B.STONE,B.SAND,B.LOG,B.LEAF,B.COBBLE,B.PLANK,B.GLASS];
const placeableItemToBlock={[I.CRAFTING_TABLE]:B.CRAFTING_TABLE,[I.FURNACE]:B.FURNACE};
const specialBlockDrops={[B.CRAFTING_TABLE]:I.CRAFTING_TABLE,[B.FURNACE]:I.FURNACE};
const inventory={
  [B.GRASS]:0,[B.DIRT]:0,[B.STONE]:0,[B.SAND]:0,[B.LOG]:0,[B.LEAF]:0,[B.COBBLE]:0,[B.PLANK]:0,[B.GLASS]:0,[B.COAL]:0,
  [I.STICK]:0,[I.CRAFTING_TABLE]:0,[I.FURNACE]:0,[I.WOOD_PICK]:0,[I.STONE_PICK]:0,
  [I.RAW_IRON]:0,[I.RAW_GOLD]:0,[I.IRON_INGOT]:0,[I.GOLD_INGOT]:0,[I.DIAMOND]:0,
  [I.STONE_SWORD]:0,[I.STONE_AXE]:0,[I.STONE_SHOVEL]:0,
  [I.IRON_PICK]:0,[I.IRON_SWORD]:0,[I.IRON_AXE]:0,[I.IRON_SHOVEL]:0,
  [I.GOLD_PICK]:0,[I.GOLD_SWORD]:0,[I.GOLD_AXE]:0,[I.GOLD_SHOVEL]:0,
  [I.DIAMOND_PICK]:0,[I.DIAMOND_SWORD]:0,[I.DIAMOND_AXE]:0,[I.DIAMOND_SHOVEL]:0,
  [I.IRON_HELMET]:0,[I.IRON_CHEST]:0,[I.IRON_LEGS]:0,[I.IRON_BOOTS]:0,
  [I.GOLD_HELMET]:0,[I.GOLD_CHEST]:0,[I.GOLD_LEGS]:0,[I.GOLD_BOOTS]:0,
  [I.DIAMOND_HELMET]:0,[I.DIAMOND_CHEST]:0,[I.DIAMOND_LEGS]:0,[I.DIAMOND_BOOTS]:0,
  [I.WOOD_AXE]:0
};
const hotbarSlots=Array(9).fill(null),acquiredOrder=[];
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
  [I.WOOD_AXE]:'木斧'
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
function drawItemIcon(g,id){
  g.clearRect(0,0,16,16);
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
  {name:'木の斧',out:I.WOOD_AXE,qty:1,needs:[[B.PLANK,3],[I.STICK,2]],unlockLevel:5},
  {name:'かまど',out:I.FURNACE,qty:1,needs:[[B.COBBLE,8]],unlockLevel:7}
];
const workbenchRecipes=[
  {name:'石のツルハシ',out:I.STONE_PICK,qty:1,needs:[[B.COBBLE,3],[I.STICK,2]],unlockLevel:6},
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
  {name:'金インゴット',out:I.GOLD_INGOT,qty:1,needs:[[I.RAW_GOLD,1],[B.COAL,1]],unlockLevel:7,xp:6}
];
const blockXP={[B.GRASS]:1,[B.DIRT]:1,[B.SAND]:1,[B.LEAF]:1,[B.LOG]:4,[B.STONE]:3,[B.GRAVEL]:2,[B.COAL]:6,[B.IRON]:10,[B.GOLD]:14,[B.DIAMOND]:25,[B.CACTUS]:2};
const hardness={
  [B.GRASS]:0.55,[B.DIRT]:0.45,[B.SAND]:0.4,[B.LEAF]:0.22,[B.SNOW]:0.18,[B.GRAVEL]:0.75,[B.CACTUS]:0.65,
  [B.LOG]:1.55,[B.PLANK]:1.25,[B.GLASS]:0.3,[B.CRAFTING_TABLE]:2.0,
  [B.STONE]:3.0,[B.COBBLE]:3.4,[B.COAL]:3.5,[B.IRON]:4.2,[B.GOLD]:4.0,[B.DIAMOND]:5.0,[B.FURNACE]:3.8,
  [B.BEDROCK]:Infinity
};
const rockBlocks=new Set([B.STONE,B.COBBLE,B.COAL,B.IRON,B.GOLD,B.DIAMOND,B.FURNACE]);

let selected=null,seed=(Date.now()>>>0),weather='clear',started=false,craftOpen=false,craftMode='inventory',level=1,xp=0,miningHeld=false,miningKey=null,miningElapsed=0,miningId=null;
const chunks=new Map(),editChunks=new Map();
let streamCX=NaN,streamCZ=NaN;
let currentAccount=null,currentWorldSlot=null,worldReady=false,saveInterval=null,saveDirty=false,generatorVersion=5;
const ACCOUNT_REGISTRY_KEY='blockworld_accounts_v1',SAVE_PREFIX='blockworld_save_v3:',LEGACY_SAVE_PREFIX='blockworld_save_v2:',MAX_WORLDS=5;

const inside=(x,y,z)=>y>=0&&y<HEIGHT;
const chunkCoord=v=>Math.floor(v/CHUNK);
const localCoord=v=>((v%CHUNK)+CHUNK)%CHUNK;
const chunkKey=(cx,cz)=>cx+','+cz;
const cIndex=(lx,y,lz)=>(y*CHUNK+lz)*CHUNK+lx;
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
function markSaveDirty(){if(currentAccount&&currentWorldSlot){saveDirty=true;setSaveStatus('未保存')}}
function serializeEdits(){return [...editChunks.entries()].map(([k,m])=>[k,[...m.entries()]])}
function restoreEdits(raw){
  editChunks.clear();
  if(!Array.isArray(raw))return;
  for(const row of raw){
    if(!Array.isArray(row)||row.length!==2||!Array.isArray(row[1]))continue;
    const m=new Map();
    for(const pair of row[1])if(Array.isArray(pair)&&pair.length===2)m.set(Number(pair[0]),Number(pair[1]));
    editChunks.set(String(row[0]),m);
  }
}
function makeSaveData(){
  return {
    version:3,worldSlot:currentWorldSlot,generatorVersion,savedAt:Date.now(),seed:seed>>>0,
    level,xp,weather,dayTime,
    inventory:{...inventory},acquiredOrder:[...acquiredOrder],hotbarSlots:[...hotbarSlots],selected,
    player:{x:player.pos.x,y:player.pos.y,z:player.pos.z,yaw:player.yaw,pitch:player.pitch},
    edits:serializeEdits()
  };
}
function saveCurrentGame(showMessage=false){
  if(!currentAccount||!currentWorldSlot||!worldReady)return false;
  try{
    localStorage.setItem(saveKeyForAccount(currentAccount.key,currentWorldSlot),JSON.stringify(makeSaveData()));
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
  for(const k of Object.keys(inventory))inventory[k]=0;
  if(data.inventory&&typeof data.inventory==='object'){
    for(const [k,v] of Object.entries(data.inventory))if(Object.prototype.hasOwnProperty.call(inventory,k))inventory[k]=Math.max(0,Number(v)||0);
  }
  acquiredOrder.length=0;
  if(Array.isArray(data.acquiredOrder))for(const id of data.acquiredOrder){
    const n=Number(id);if(Object.prototype.hasOwnProperty.call(inventory,n)&&!acquiredOrder.includes(n))acquiredOrder.push(n);
  }
  hotbarSlots.fill(null);
  if(Array.isArray(data.hotbarSlots))for(let i=0;i<Math.min(9,data.hotbarSlots.length);i++){const n=data.hotbarSlots[i];hotbarSlots[i]=n==null?null:Number(n)}
  selected=data.selected==null?null:Number(data.selected);restoreEdits(data.edits);
  if(data.player&&Number.isFinite(data.player.x)&&Number.isFinite(data.player.y)&&Number.isFinite(data.player.z)){
    player.pos.set(data.player.x,data.player.y,data.player.z);player.yaw=Number(data.player.yaw)||0;player.pitch=Number(data.player.pitch)||0;return true;
  }
  return false;
}
function resetWorldRuntime(){
  started=false;craftOpen=false;crafting.classList.remove('open');primaryActionStop();
  meshes.forEach(m=>scene.remove(m));meshes=[];lookup.clear();
  mobs.forEach(m=>scene.remove(m));mobs.length=0;
  chunks.clear();streamCX=NaN;streamCZ=NaN;player.vel.set(0,0,0);player.onGround=false;
}
function freshSeed(){
  try{return crypto.getRandomValues(new Uint32Array(1))[0]>>>0}catch{return Date.now()>>>0}
}
async function initializeAccountWorld(save,slot){
  currentWorldSlot=slot;worldReady=false;worldCover.style.display='none';cover.style.display='flex';
  accountBox.style.display='block';
  loading.textContent='セーブデータを読み込み中...';resetWorldRuntime();
  let hasSavedPos=false;
  if(save)hasSavedPos=applySaveData(save);
  else{
    seed=freshSeed();generatorVersion=5;level=1;xp=0;weather='clear';dayTime=.24;selected=null;
    for(const k of Object.keys(inventory))inventory[k]=0;
    acquiredOrder.length=0;hotbarSlots.fill(null);editChunks.clear();
  }
  await new Promise(r=>setTimeout(r,30));
  if(!hasSavedPos)spawn();
  loading.textContent='周辺チャンクを生成中...';await new Promise(r=>setTimeout(r,30));
  streamChunks(true);
  for(let i=0;i<12&&blocked(player.pos.x,player.pos.y,player.pos.z);i++)player.pos.y+=1;
  rain.visible=weather==='rain';weatherEl.textContent=weather==='rain'?'Rain':'Clear';
  accountNameEl.textContent=currentAccount.name+' · W'+slot+' · GEN'+generatorVersion;
  renderHotbar();updateProgress();
  loading.textContent=save?'ワールド'+slot+'を復元しました':'ワールド'+slot+'を作成しました';
  worldReady=true;saveDirty=false;saveCurrentGame(false);
  clearInterval(saveInterval);saveInterval=setInterval(()=>saveCurrentGame(false),10000);
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
function showWorldSelection(){
  if(!currentAccount)return;
  if(worldReady)saveCurrentGame(false);
  clearInterval(saveInterval);saveInterval=null;
  resetWorldRuntime();worldReady=false;currentWorldSlot=null;
  cover.style.display='none';accountBox.style.display='none';worldCover.style.display='flex';
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
      currentAccount={key,name};setSaveStatus('ワールド未選択');
    }else{
      const acc=reg.accounts[key];
      if(!acc){authError.textContent='そのアカウントはありません';return}
      const hash=await passwordHash(password,b64ToBytes(acc.salt));
      if(!safeEqual(hash,acc.hash)){authError.textContent='パスワードが違います';return}
      currentAccount={key,name:acc.name||name};setSaveStatus('ワールド未選択');
    }
    authPassword.value='';authCover.style.display='none';cover.style.display='none';accountBox.style.display='none';
    worldCover.style.display='flex';renderWorldSelection();
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
  const h=Math.max(3,Math.min(HEIGHT-6,Math.floor(y)));
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

  const h=Math.max(3,Math.min(HEIGHT-5,Math.floor(y)));
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

  const h=Math.max(3,Math.min(HEIGHT-5,Math.floor(y)));
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

  const h=Math.max(3,Math.min(HEIGHT-5,Math.floor(y)));
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
  if(y<0||y>=HEIGHT)return B.AIR;
  if(y>h)return y<=SEA?B.WATER:B.AIR;
  if(y===0)return B.BEDROCK;

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
    if(y<8&&r>.986)id=B.DIAMOND;
    else if(y<15&&r>.974)id=B.GOLD;
    else if(y<27&&r>.955)id=B.IRON;
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
  if(y<0||y>=HEIGHT||chunkCoord(x)!==cx||chunkCoord(z)!==cz)return;
  data[cIndex(localCoord(x),y,localCoord(z))]=id;
}
function generateChunk(cx,cz){
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
  for(let lx=0;lx<CHUNK;lx++)for(let lz=0;lz<CHUNK;lz++){
    const x=x0+lx,z=z0+lz,info=getInfo(x,z);
    for(let y=0;y<HEIGHT;y++)data[cIndex(lx,y,lz)]=blockFromInfo(x,y,z,info);
  }

  // Natural surface features are generated from deterministic roots with margins,
  // so they line up across chunk boundaries.
  for(let x=x0-3;x<x0+CHUNK+3;x++)for(let z=z0-3;z<z0+CHUNK+3;z++){
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
            if(chunkCoord(tx)===cx&&chunkCoord(tz)===cz&&ty>=0&&ty<HEIGHT){
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
          if(chunkCoord(tx)===cx&&chunkCoord(tz)===cz&&ty>=0&&ty<HEIGHT){
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

  const edits=editChunks.get(chunkKey(cx,cz));
  if(edits)for(const [i,v] of edits)data[i]=v;
  return {cx,cz,data};
}
function ensureChunk(cx,cz){
  const k=chunkKey(cx,cz);
  let c=chunks.get(k);
  if(!c){c=generateChunk(cx,cz);chunks.set(k,c)}
  return c;
}
function getLoaded(x,y,z){
  if(y<0||y>=HEIGHT)return B.AIR;
  const c=chunks.get(chunkKey(chunkCoord(x),chunkCoord(z)));
  return c?c.data[cIndex(localCoord(x),y,localCoord(z))]:B.AIR;
}
function get(x,y,z){
  if(y<0||y>=HEIGHT)return B.AIR;
  const cx=chunkCoord(x),cz=chunkCoord(z),c=chunks.get(chunkKey(cx,cz));
  if(c)return c.data[cIndex(localCoord(x),y,localCoord(z))];
  const edits=editChunks.get(chunkKey(cx,cz)),i=cIndex(localCoord(x),y,localCoord(z));
  if(edits&&edits.has(i))return edits.get(i);
  return baseBlockAt(x,y,z);
}
function set(x,y,z,v){
  if(y<0||y>=HEIGHT)return;
  const cx=chunkCoord(x),cz=chunkCoord(z),c=ensureChunk(cx,cz),i=cIndex(localCoord(x),y,localCoord(z));
  c.data[i]=v;
  const k=chunkKey(cx,cz);
  let edits=editChunks.get(k);
  if(!edits){edits=new Map();editChunks.set(k,edits)}
  edits.set(i,v);
  markSaveDirty();
}
function streamChunks(force=false){
  const cx=chunkCoord(Math.floor(player.pos.x)),cz=chunkCoord(Math.floor(player.pos.z));
  if(!force&&cx===streamCX&&cz===streamCZ)return false;
  streamCX=cx;streamCZ=cz;
  const wanted=new Set();
  for(let dx=-RENDER_RADIUS;dx<=RENDER_RADIUS;dx++)for(let dz=-RENDER_RADIUS;dz<=RENDER_RADIUS;dz++){
    const x=cx+dx,z=cz+dz,k=chunkKey(x,z);wanted.add(k);ensureChunk(x,z);
  }
  for(const k of [...chunks.keys()])if(!wanted.has(k))chunks.delete(k);
  rebuild();spawnMobs();
  return true;
}

function tex(rgb,noise=.12,pattern=''){const c=document.createElement('canvas');c.width=c.height=16;const g=c.getContext('2d');for(let y=0;y<16;y++)for(let x=0;x<16;x++){const n=(hash3(x,y,pattern.length,12345)-.5)*noise*255;g.fillStyle=`rgb(${Math.max(0,Math.min(255,rgb[0]+n))|0},${Math.max(0,Math.min(255,rgb[1]+n))|0},${Math.max(0,Math.min(255,rgb[2]+n))|0})`;g.fillRect(x,y,1,1)}if(pattern==='grassSide'){g.fillStyle='#43883d';g.fillRect(0,0,16,4)}if(pattern==='log'){g.fillStyle='rgba(60,35,18,.3)';for(let x=2;x<16;x+=4)g.fillRect(x,0,1,16)}if(pattern.startsWith('ore')){const color=pattern==='oreC'?'#222':pattern==='oreI'?'#b78669':pattern==='oreG'?'#e4b935':'#43cad0';g.fillStyle=color;[[3,4],[11,3],[7,8],[13,11],[4,13]].forEach(([x,y])=>g.fillRect(x,y,2,2))}if(pattern==='plank'){g.fillStyle='rgba(70,43,20,.32)';for(let y=3;y<16;y+=4)g.fillRect(0,y,16,1)}if(pattern==='cobble'){g.strokeStyle='rgba(20,20,20,.28)';g.strokeRect(1.5,1.5,6,5);g.strokeRect(8.5,2.5,6,5);g.strokeRect(4.5,8.5,8,6)}
if(pattern==='craft'){g.strokeStyle='#5f3d20';g.lineWidth=2;g.strokeRect(2,2,12,12);g.beginPath();g.moveTo(8,2);g.lineTo(8,14);g.moveTo(2,8);g.lineTo(14,8);g.stroke();g.fillStyle='#d6a267';g.fillRect(5,5,6,6)}
if(pattern==='furnace'){g.fillStyle='#3c3c3c';g.fillRect(3,4,10,4);g.fillStyle='#1f1f1f';g.fillRect(4,10,8,4);g.fillStyle='#8b5a2b';g.fillRect(5,11,6,2)}
const t=new THREE.CanvasTexture(c);t.magFilter=THREE.NearestFilter;t.minFilter=THREE.NearestFilter;t.colorSpace=THREE.SRGBColorSpace;return t}
const T={grass:tex([92,159,64],.15),grassSide:tex([121,88,52],.15,'grassSide'),dirt:tex([125,86,54],.16),stone:tex([124,126,128],.12),sand:tex([215,200,140],.08),log:tex([113,79,44],.14,'log'),leaf:tex([59,120,52],.19),coal:tex([119,121,122],.11,'oreC'),iron:tex([119,121,122],.11,'oreI'),gold:tex([119,121,122],.11,'oreG'),diamond:tex([119,121,122],.11,'oreD'),snow:tex([238,242,245],.03),gravel:tex([116,110,108],.18),cactus:tex([57,126,55],.1),plank:tex([167,120,70],.1,'plank'),cobble:tex([102,105,106],.16,'cobble'),bedrock:tex([55,57,58],.24),craft:tex([164,113,62],.10,'craft'),furnace:tex([112,114,114],.14,'furnace')};
const L=t=>new THREE.MeshLambertMaterial({map:t});
const grassSide=L(T.grassSide),dirt=L(T.dirt),grass=L(T.grass),stone=L(T.stone),sand=L(T.sand),log=L(T.log);
const leaf=new THREE.MeshLambertMaterial({map:T.leaf,transparent:true,opacity:.92}),water=new THREE.MeshLambertMaterial({color:0x397bc6,transparent:true,opacity:.58,depthWrite:false}),glass=new THREE.MeshLambertMaterial({color:0xcce8ee,transparent:true,opacity:.32,depthWrite:false});
const M={[B.GRASS]:[grassSide,grassSide,grass,dirt,grassSide,grassSide],[B.DIRT]:dirt,[B.STONE]:stone,[B.SAND]:sand,[B.WATER]:water,[B.LOG]:log,[B.LEAF]:leaf,[B.COAL]:L(T.coal),[B.IRON]:L(T.iron),[B.GOLD]:L(T.gold),[B.DIAMOND]:L(T.diamond),[B.SNOW]:L(T.snow),[B.GRAVEL]:L(T.gravel),[B.CACTUS]:L(T.cactus),[B.PLANK]:L(T.plank),[B.COBBLE]:L(T.cobble),[B.GLASS]:glass,[B.BEDROCK]:L(T.bedrock),[B.CRAFTING_TABLE]:L(T.craft),[B.FURNACE]:L(T.furnace)};
const box=new THREE.BoxGeometry(1,1,1);
let meshes=[],lookup=new Map();
function rebuild(){
  meshes.forEach(m=>scene.remove(m));meshes=[];lookup.clear();
  const groups={};Object.keys(M).forEach(k=>groups[k]=[]);
  const nb=[[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]];
  for(const c of chunks.values()){
    const x0=c.cx*CHUNK,z0=c.cz*CHUNK;
    for(let y=0;y<HEIGHT;y++)for(let lz=0;lz<CHUNK;lz++)for(let lx=0;lx<CHUNK;lx++){
      const id=c.data[cIndex(lx,y,lz)];if(id===B.AIR)continue;
      const x=x0+lx,z=z0+lz;let vis=false;
      for(const[dX,dY,dZ]of nb){
        const n=getLoaded(x+dX,y+dY,z+dZ);
        if(id===B.WATER?n!==B.WATER:n===B.AIR||n===B.WATER||n===B.GLASS){vis=true;break}
      }
      if(vis)groups[id].push({x,y,z});
    }
  }
  const dummy=new THREE.Object3D();
  for(const key in groups){
    const id=+key,a=groups[id];if(!a.length)continue;
    const m=new THREE.InstancedMesh(box,M[id],a.length);
    m.userData.id=id;m.castShadow=id!==B.WATER&&id!==B.GLASS;m.receiveShadow=id!==B.WATER;
    a.forEach((p,i)=>{dummy.position.set(p.x,p.y,p.z);dummy.updateMatrix();m.setMatrixAt(i,dummy.matrix)});
    scene.add(m);meshes.push(m);lookup.set(m.uuid,a);
  }
}

const mobs=[];
function cube(g,sx,sy,sz,color,x,y,z){const m=new THREE.Mesh(new THREE.BoxGeometry(sx,sy,sz),new THREE.MeshLambertMaterial({color}));m.position.set(x,y,z);m.castShadow=true;g.add(m)}
function spawnMobs(){
  mobs.forEach(m=>scene.remove(m));mobs.length=0;
  const pcx=chunkCoord(player.pos.x),pcz=chunkCoord(player.pos.z);
  for(let i=0;i<12;i++){
    const rx=hash3(i,pcx,pcz,seed+71),rz=hash3(i+91,pcz,pcx,seed+81);
    const x=Math.floor(player.pos.x+(rx-.5)*58),z=Math.floor(player.pos.z+(rz-.5)*58);
    const h=surfaceAt(x,z),bio=biomeAt(x,z);
    if(h<=SEA||bio===2||bio===6)continue;
    const type=i%3,color=type===0?0xeeeeea:type===1?0xe8999f:0x7b5239,g=new THREE.Group();
    cube(g,1.15,.72,.65,color,0,.85,0);cube(g,.57,.57,.55,color,0,.95,-.56);
    for(const lx of[-.4,.4])for(const lz of[-.2,.2])cube(g,.16,.55,.16,type===0?0x444444:color,lx,.33,lz);
    g.position.set(x,h+.05,z);
    g.userData={angle:hash2(x,z)*Math.PI*2,t:2+hash2(z,x)*3,speed:.25+hash2(x+4,z+2)*.28,hp:type===2?4:3,xp:type===2?18:type===1?14:12,name:type===0?'ヒツジ':type===1?'ブタ':'ウシ'};
    scene.add(g);mobs.push(g);
  }
}

const clouds=[];
for(let i=0;i<10;i++){const g=new THREE.Group(),mat=new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.75,depthWrite:false});for(let j=0;j<3;j++){const m=new THREE.Mesh(new THREE.BoxGeometry(6+j*1.4,.55,3),mat);m.position.x=j*4;g.add(m)}g.position.set(-40+hash3(i,2,3,44)*80,25+hash3(i,3,4,55)*4,-35+hash3(i,4,5,66)*70);scene.add(g);clouds.push(g)}

const rainN=500,rainA=new Float32Array(rainN*3);
for(let i=0;i<rainN;i++){rainA[i*3]=(Math.random()-.5)*44;rainA[i*3+1]=5+Math.random()*28;rainA[i*3+2]=(Math.random()-.5)*44}
const rainG=new THREE.BufferGeometry();rainG.setAttribute('position',new THREE.BufferAttribute(rainA,3));
const rain=new THREE.Points(rainG,new THREE.PointsMaterial({color:0xb8d7f0,size:.09,transparent:true,opacity:.78}));
rain.visible=false;scene.add(rain);

const player={pos:new THREE.Vector3(),vel:new THREE.Vector3(),yaw:0,pitch:0,onGround:false},PR=.28,PH=1.78,EYE=1.62;
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
function spawn(){
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
  player.pos.set(best.x+.5,surfaceAt(best.x,best.z)+1.05,best.z+.5);
  player.vel.set(0,0,0)
}

const ray=new THREE.Raycaster();ray.far=6;
function target(){ray.setFromCamera(new THREE.Vector2(0,0),camera);const h=ray.intersectObjects(meshes,false);return h.find(v=>v.object.userData.id!==B.WATER)||h[0]||null}
function flash(t){msgEl.textContent=t;msgEl.style.opacity=1;clearTimeout(flash.t);flash.t=setTimeout(()=>msgEl.style.opacity=0,1200)}
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
  const woodLike=new Set([B.LOG,B.PLANK,B.CRAFTING_TABLE]);
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
  normalizeHotbar();markSaveDirty();
}
function removeItem(id,qty=1){
  inventory[id]=Math.max(0,(inventory[id]||0)-qty);
  normalizeHotbar();markSaveDirty();
}
function finishMine(x,y,z,id){
  if(get(x,y,z)!==id)return;
  set(x,y,z,B.AIR);
  let drop=specialBlockDrops[id]??id;
  if(id===B.STONE)drop=B.COBBLE;
  if(id===B.GRASS)drop=B.DIRT;
  if(id===B.IRON)drop=I.RAW_IRON;
  if(id===B.GOLD)drop=I.RAW_GOLD;
  if(id===B.DIAMOND)drop=I.DIAMOND;
  if(buildable.includes(drop)||drop===B.COAL||drop===I.RAW_IRON||drop===I.RAW_GOLD||drop===I.DIAMOND||drop===I.CRAFTING_TABLE||drop===I.FURNACE)addItem(drop,1);
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
function place(){const h=target();if(!h||!h.face)return;if(selected==null||(inventory[selected]||0)<=0){flash('置けるブロックを持っていません');return}
  const blockId=buildable.includes(selected)?selected:placeableItemToBlock[selected];
  if(blockId==null){flash((names[selected]||'このアイテム')+'は設置できません');return}
  const p=lookup.get(h.object.uuid)?.[h.instanceId];if(!p)return;const n=h.face.normal,x=p.x+Math.round(n.x),y=p.y+Math.round(n.y),z=p.z+Math.round(n.z);if(!inside(x,y,z)||get(x,y,z)!==B.AIR)return;
  set(x,y,z,blockId);if(blocked(player.pos.x,player.pos.y,player.pos.z)){set(x,y,z,B.AIR);return}
  const placedName=names[selected]||names[blockId]||'ブロック';removeItem(selected,1);rebuild();renderHotbar();flash(placedName+'を設置')
}
function attackMob(){
  ray.setFromCamera(new THREE.Vector2(0,0),camera);
  const hits=ray.intersectObjects(mobs,true).filter(h=>h.distance<=4.5);
  if(!hits.length)return false;
  let root=hits[0].object;
  while(root.parent&&!mobs.includes(root))root=root.parent;
  if(!mobs.includes(root))return false;
  const damage=selected===I.DIAMOND_SWORD?4:selected===I.IRON_SWORD?3:selected===I.GOLD_SWORD?2:selected===I.STONE_SWORD?2:1;
  root.userData.hp-=damage;
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
    const key=document.createElement('span');key.className='key';key.textContent=i+1;d.appendChild(key);
    if(id!=null){
      d.appendChild(itemCanvas(id,'item-icon hotbar-icon'));
      const qty=document.createElement('span');qty.className='qty';qty.textContent=count;d.appendChild(qty);
      const name=document.createElement('span');name.className='item-name';name.textContent=names[id]||'ITEM';d.appendChild(name);
      d.title=names[id]||'アイテム';
      d.addEventListener('pointerdown',e=>{e.stopPropagation();selected=id;renderHotbar()});
    }
    hotbarEl.appendChild(d);
  });
}

function hasNeeds(recipe){return recipe.needs.every(([id,n])=>(inventory[id]||0)>=n)}
function distanceToBlock(x,y,z){
  const dx=player.pos.x-x,dy=(player.pos.y+1)-y,dz=player.pos.z-z;
  return Math.hypot(dx,dy,dz);
}
function stationInReach(){
  const h=target();
  if(h){
    const p=lookup.get(h.object.uuid)?.[h.instanceId];
    if(p){
      const id=get(p.x,p.y,p.z);
      if((id===B.CRAFTING_TABLE||id===B.FURNACE)&&h.distance<=5)return id;
    }
  }
  let best=null,bestD=3.25;
  const px=Math.floor(player.pos.x),py=Math.floor(player.pos.y),pz=Math.floor(player.pos.z);
  for(let x=px-3;x<=px+3;x++)for(let y=Math.max(0,py-2);y<=Math.min(HEIGHT-1,py+3);y++)for(let z=pz-3;z<=pz+3;z++){
    const id=get(x,y,z);
    if(id!==B.CRAFTING_TABLE&&id!==B.FURNACE)continue;
    const d=distanceToBlock(x,y,z);
    if(d<bestD){bestD=d;best=id}
  }
  return best;
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
  if(craftMode==='workbench'){title.textContent='WORKBENCH';sub.textContent='作業台専用：石以上のツール・防具'}
  else if(craftMode==='furnace'){title.textContent='FURNACE';sub.textContent='石炭を燃料に原石を精錬'}
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
    const verb=craftMode==='furnace'?'精錬':'作る';

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
  r.needs.forEach(([id,n])=>removeItem(id,n));
  addItem(r.out,r.qty);
  if(craftMode==='furnace'&&r.xp)gainXP(r.xp,r.name+'を精錬');
  renderHotbar();renderCrafting();flash(r.name+(craftMode==='furnace'?'を精錬':'をクラフト'));
}
function setCraftOpen(v){
  craftOpen=v;crafting.classList.toggle('open',v);crafting.setAttribute('aria-hidden',String(!v));
  Object.keys(keys).forEach(k=>keys[k]=false);
  if(v){
    craftMode=chooseCraftMode();
    primaryActionStop();document.exitPointerLock?.();renderCrafting();
    if(craftMode==='inventory')flash('近くの作業台・かまどで専用メニューが開きます');
  } else if(started&&!matchMedia('(pointer:coarse)').matches){renderer.domElement.requestPointerLock?.()}
}

const keys={};
addEventListener('keydown',e=>{const k=e.key.toLowerCase();if(k==='c'&&started){e.preventDefault();setCraftOpen(!craftOpen);return}if(craftOpen)return;keys[k]=true;if(e.code==='Space'){e.preventDefault();jump()}if(/^[1-9]$/.test(e.key)){const id=hotbarSlots[+e.key-1];if(id!=null&&(inventory[id]||0)>0)selected=id;renderHotbar()}if(k==='r'){weather=weather==='clear'?'rain':'clear';rain.visible=weather==='rain';weatherEl.textContent=weather==='rain'?'Rain':'Clear'}});
addEventListener('keyup',e=>keys[e.key.toLowerCase()]=false);
function blockAtPoint(x,y,z){return get(Math.floor(x+0.5),Math.floor(y+0.5),Math.floor(z+0.5))}
function playerInWater(){
  const x=player.pos.x,z=player.pos.z;
  return blockAtPoint(x,player.pos.y+0.15,z)===B.WATER||
         blockAtPoint(x,player.pos.y+0.9,z)===B.WATER||
         blockAtPoint(x,player.pos.y+1.55,z)===B.WATER;
}
function jump(){
  if(playerInWater()){
    player.vel.y=Math.max(player.vel.y,4.6);
    player.onGround=false;
    return;
  }
  if(player.onGround){player.vel.y=7.3;player.onGround=false}
}

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
const jumpBtn=document.querySelector('.jump');
jumpBtn.addEventListener('pointerdown',e=>{e.preventDefault();keys.swimup=true;jump()});
['pointerup','pointercancel','pointerleave'].forEach(t=>jumpBtn.addEventListener(t,e=>{e.preventDefault();keys.swimup=false}));
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
    const inWater=playerInWater();
    const sy=Math.sin(player.yaw),cy=Math.cos(player.yaw);forward.set(-sy,0,-cy);right.set(cy,0,-sy);move.set(0,0,0);
    if(keys.w||keys.arrowup)move.add(forward);if(keys.s||keys.arrowdown)move.sub(forward);if(keys.d||keys.arrowright)move.add(right);if(keys.a||keys.arrowleft)move.sub(right);
    if(move.lengthSq())move.normalize().multiplyScalar(inWater?2.6:4.5);
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
    const vy=player.vel.y;
    player.onGround=false;
    movePlayerAxis('y',vy*dt);
    if(player.pos.y<-5)spawn();
    streamChunks();
    camera.position.set(player.pos.x,player.pos.y+EYE,player.pos.z);camera.rotation.order='YXZ';camera.rotation.y=player.yaw;camera.rotation.x=player.pitch;

    const ang=dayTime*Math.PI*2-Math.PI/2,day=Math.max(0,Math.sin(ang));
    sunBox.position.set(player.pos.x+Math.cos(ang)*48,Math.sin(ang)*48,player.pos.z+13);moonBox.position.set(player.pos.x-Math.cos(ang)*48,-Math.sin(ang)*48,player.pos.z-13);sun.position.copy(sunBox.position);
    sun.intensity=.14+2.2*day;hemi.intensity=.25+1.15*day;
    const sky=new THREE.Color().setHSL(.57,.48,.08+.56*day);scene.background.copy(sky);scene.fog.color.copy(sky);
    clouds.forEach((c,i)=>{c.position.x+=dt*(.5+i*.01);if(c.position.x>player.pos.x+50)c.position.x=player.pos.x-50;if(Math.abs(c.position.z-player.pos.z)>45)c.position.z=player.pos.z+(hash3(i,7,9,seed)-.5)*70});

    if(weather==='rain'){const a=rain.geometry.attributes.position.array;for(let i=0;i<rainN;i++){a[i*3+1]-=dt*19;if(a[i*3+1]<0){a[i*3+1]=25+Math.random()*9;a[i*3]=(Math.random()-.5)*44;a[i*3+2]=(Math.random()-.5)*44}}rain.position.set(player.pos.x,0,player.pos.z);rain.geometry.attributes.position.needsUpdate=true}

    mobs.forEach((m,i)=>{m.userData.t-=dt;if(m.userData.t<=0){m.userData.t=1.5+hash3(i,Math.floor(now/1000),3,seed)*3;m.userData.angle+=(hash3(i,4,Math.floor(now/900),seed)-.5)*2.4}const x=m.position.x+Math.sin(m.userData.angle)*m.userData.speed*dt,z=m.position.z+Math.cos(m.userData.angle)*m.userData.speed*dt,ix=Math.round(x),iz=Math.round(z),h=surfaceAt(ix,iz),bio=biomeAt(ix,iz);if(h>SEA&&bio!==6){m.position.x=x;m.position.z=z;m.position.y=h+.05;m.rotation.y=m.userData.angle}});

    const bx=Math.floor(player.pos.x),bz=Math.floor(player.pos.z);
    coordsEl.textContent=`X ${bx} Y ${Math.floor(player.pos.y)} Z ${bz}`;biomeEl.textContent=biomeNames[biomeAt(bx,bz)]||'Unknown';
    const mins=Math.floor(dayTime*1440),hh=String(Math.floor(mins/60)%24).padStart(2,'0'),mm=String(mins%60).padStart(2,'0');clockEl.textContent=(day>.2?'☀':'☾')+' '+hh+':'+mm;
    const eye=blockAtPoint(player.pos.x,player.pos.y+EYE,player.pos.z);scene.fog.near=eye===B.WATER?1:28;scene.fog.far=eye===B.WATER?14:66;
  }
  renderer.render(scene,camera);
  requestAnimationFrame(loop);
}

function resize(){renderer.setSize(innerWidth,innerHeight,false);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix()}
addEventListener('resize',resize);resize();

showLogin.addEventListener('click',()=>setAuthMode('login'));
showCreate.addEventListener('click',()=>setAuthMode('create'));
authForm.addEventListener('submit',submitAuth);
setAuthMode('login');

saveNowBtn.addEventListener('click',()=>saveCurrentGame(true));
worldListBtn.addEventListener('click',()=>{
  if(!currentAccount)return;
  showWorldSelection();
});
worldLogout.addEventListener('click',()=>{location.reload()});
logoutBtn.addEventListener('click',()=>{
  if(!currentAccount)return;
  if(confirm('セーブしてログアウトしますか？')){
    saveCurrentGame(false);clearInterval(saveInterval);location.reload();
  }
});
document.addEventListener('visibilitychange',()=>{if(document.hidden)saveCurrentGame(false)});
addEventListener('pagehide',()=>saveCurrentGame(false));

$('startBtn').addEventListener('click',()=>{
  if(!worldReady||!currentAccount)return;
  started=true;cover.style.display='none';last=performance.now();
  if(!matchMedia('(pointer:coarse)').matches)renderer.domElement.requestPointerLock?.();
});
authName.focus();
requestAnimationFrame(loop);
