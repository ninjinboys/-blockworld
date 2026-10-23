import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.180.0/+esm';
import {JOBS,STARTING_JOBS,JOB_WEAPON_IDS,jobWeapon,jobCanUse,jobNextOptions,jobCanChange,
  drawJobWeaponIcon} from './job-system.js?v=20261023bowFacingForward24';
import {makeFirstPersonHand} from './first-person-hand.js?v=20261023bowFacingForward24';
import {makeAvatarHeldItems} from './avatar-held-items.js?v=20261023bowFacingForward24';
import {createBlockworldNetwork} from './multiplayer-network.js?v=20261009multi1';
import {buildChimera,animateChimera} from './chimera-sculpt-v4.js?v=20261017chimeraBoss01';
import {createNewMobModels} from './new-mob-models.js?v=20261018neutralGolem01';
import {createVillageSystem} from './village-system.js?v=20261018RetrofitVillageHomes01';
import {createVillagerModels} from './villager-model.js?v=20261017villagerFold02';
import {createWarpWorkbenchModel} from './warp-workbench-model.js?v=20261019warpStation01';
import {createBossArenaModel} from './boss-arena-model.js?v=20261023bossAltarCraft02';
import {createBossWarpDeviceModel} from './boss-warp-device-model.js?v=20261023bossWarp01';
import {createBuildingBlockModels} from './building-block-models.js?v=20261020twoBlockBedrollFence04';
import {drawNewItemArt,drawNewBlockArt} from './item-pixel-art.js?v=20261020waterBucket02';
import {drawDetailedItemIcon} from './item-art-icons.js?v=20261019pixelArt01';
import {cloudEnabled,cloudRegister,cloudLogin,cloudRestore,cloudSignOut,
  cloudReadAll,cloudQueueSave,cloudFlush} from './nexacraft-cloud.js?v=20261014cloudActivated01';

const $=id=>document.getElementById(id);
const game=$('game'),coordsEl=$('coords'),biomeEl=$('biome'),clockEl=$('clock'),weatherEl=$('weather'),hotbarEl=$('hotbar'),msgEl=$('message'),cover=$('startCover'),loading=$('loading'),crafting=$('crafting'),recipeList=$('recipeList'),craftInventory=$('craftInventory'),levelText=$('levelText'),xpText=$('xpText'),xpFill=$('xpFill'),blueprintText=$('blueprintText'),breakMeter=$('breakMeter'),breakLabel=$('breakLabel'),breakFill=$('breakFill'),heartsEl=$('hearts'),deathScreen=$('deathScreen'),respawnBtn=$('respawnBtn');
const authCover=$('authCover'),authForm=$('authForm'),authName=$('authName'),authPassword=$('authPassword'),authSubmit=$('authSubmit'),authError=$('authError'),authModeText=$('authModeText'),showLogin=$('showLogin'),showCreate=$('showCreate'),accountNameEl=$('accountName'),saveStatusEl=$('saveStatus'),saveNowBtn=$('saveNow'),logoutBtn=$('logoutBtn');
const mapCover=$('mapCover'),menuCover=$('menuCover'),menuAccountName=$('menuAccountName'),singlePlayBtn=$('singlePlayBtn'),menuLogout=$('menuLogout'),worldBack=$('worldBack');
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
const B={AIR:0,GRASS:1,DIRT:2,STONE:3,SAND:4,WATER:5,LOG:6,LEAF:7,COAL:8,IRON:9,GOLD:10,DIAMOND:11,SNOW:12,GRAVEL:13,CACTUS:14,PLANK:15,COBBLE:16,GLASS:17,BEDROCK:18,CRAFTING_TABLE:19,FURNACE:20,BED:21,BED_HEAD:22,DOOR_X:23,DOOR_X_TOP:24,DOOR_X_OPEN:25,DOOR_X_OPEN_TOP:26,DOOR_Z:27,DOOR_Z_TOP:28,DOOR_Z_OPEN:29,DOOR_Z_OPEN_TOP:30,TORCH:31,CHEST:32,WARP_WORKBENCH_X:33,WARP_WORKBENCH_X_END:34,WARP_WORKBENCH_Z:35,WARP_WORKBENCH_Z_END:36,STONE_BRICKS:37,MOSSY_STONE_BRICKS:38,CRACKED_STONE_BRICKS:39,POLISHED_STONE:40,MARBLE:41,OBSIDIAN:42,RED_BRICKS:43,WOOD_STAIRS:44,STONE_STAIRS:45,WOOD_SLAB:46,IRON_BARS:47,WOOD_FENCE:48,FENCE_GATE:49,LADDER:50,TRAPDOOR:51,LANTERN:52,BOOKSHELF:53,BARREL:54,TNT:55,CAMPFIRE:56};
// Orientation and open-state variants are regular voxel ids, and persist with edits.
Object.assign(B,{
  WOOD_STAIRS_E:57,WOOD_STAIRS_S:58,WOOD_STAIRS_W:59,
  STONE_STAIRS_E:60,STONE_STAIRS_S:61,STONE_STAIRS_W:62,
  FENCE_GATE_E:63,FENCE_GATE_S:64,FENCE_GATE_W:65,
  FENCE_GATE_OPEN_N:66,FENCE_GATE_OPEN_E:67,FENCE_GATE_OPEN_S:68,FENCE_GATE_OPEN_W:69,
  LADDER_E:70,LADDER_S:71,LADDER_W:72,
  TRAPDOOR_OPEN_N:73,TRAPDOOR_OPEN_E:74,TRAPDOOR_OPEN_S:75,TRAPDOOR_OPEN_W:76,WOOD_SLAB_TOP:77,
  SLEEPING_BAG_WORLD:78,SLEEPING_BAG_HEAD:79,
  SLEEPING_BAG_E:80,SLEEPING_BAG_S:81,SLEEPING_BAG_W:82,
  SLEEPING_BAG_HEAD_E:83,SLEEPING_BAG_HEAD_S:84,SLEEPING_BAG_HEAD_W:85,
  BOSS_ARENA_CORE:86,BOSS_WARP_DEVICE:88,BOSS_WARP_PART:89
});
const SHAPED_VARIANT_BASE=new Map([
  [B.WOOD_STAIRS_E,B.WOOD_STAIRS],[B.WOOD_STAIRS_S,B.WOOD_STAIRS],[B.WOOD_STAIRS_W,B.WOOD_STAIRS],
  [B.STONE_STAIRS_E,B.STONE_STAIRS],[B.STONE_STAIRS_S,B.STONE_STAIRS],[B.STONE_STAIRS_W,B.STONE_STAIRS],
  [B.FENCE_GATE_E,B.FENCE_GATE],[B.FENCE_GATE_S,B.FENCE_GATE],[B.FENCE_GATE_W,B.FENCE_GATE],
  [B.FENCE_GATE_OPEN_N,B.FENCE_GATE],[B.FENCE_GATE_OPEN_E,B.FENCE_GATE],
  [B.FENCE_GATE_OPEN_S,B.FENCE_GATE],[B.FENCE_GATE_OPEN_W,B.FENCE_GATE],
  [B.LADDER_E,B.LADDER],[B.LADDER_S,B.LADDER],[B.LADDER_W,B.LADDER],
  [B.TRAPDOOR_OPEN_N,B.TRAPDOOR],[B.TRAPDOOR_OPEN_E,B.TRAPDOOR],
  [B.TRAPDOOR_OPEN_S,B.TRAPDOOR],[B.TRAPDOOR_OPEN_W,B.TRAPDOOR],
  [B.WOOD_SLAB_TOP,B.WOOD_SLAB],
  [B.SLEEPING_BAG_E,B.SLEEPING_BAG_WORLD],
  [B.SLEEPING_BAG_S,B.SLEEPING_BAG_WORLD],
  [B.SLEEPING_BAG_W,B.SLEEPING_BAG_WORLD],
  [B.SLEEPING_BAG_HEAD_E,B.SLEEPING_BAG_HEAD],
  [B.SLEEPING_BAG_HEAD_S,B.SLEEPING_BAG_HEAD],
  [B.SLEEPING_BAG_HEAD_W,B.SLEEPING_BAG_HEAD]
]);
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
  COOKED_PORK:144,COOKED_BEEF:145,DOOR:146,TORCH:147,CHEST:148,BOW:149,ARROW:150,SADDLE:151,LION_FANG:152,BUFFALO_HORN:153,ANACONDA_HIDE:155,SHIELD:156,CHIMERA_SOUL:157,CHIMERA_HIDE:158,
  CHIMERA_HELMET:159,CHIMERA_CHEST:160,CHIMERA_LEGS:161,CHIMERA_BOOTS:162,
  CHIMERA_FANG:163,CHIMERA_DAGGER:164,CHIMERA_HORN:165,CHIMERA_BOW:166,
  WARP_WORKBENCH:167,BOSS_ARENA_CORE:208,BOSS_WARP_DEVICE:209,
  SPEAR:168,IRON_DAGGER:169,BATTLE_AXE:170,HAMMER:171,CROSSBOW:172,THROWING_KNIFE:173,MOLOTOV:174,HEAL_POTION:175,STAMINA_POTION:176,POISON_ARROW:177,BUCKET:178,FISHING_ROD:179,COMPASS:180,MAP:181,BINOCULARS:182,ROPE:183,NAME_TAG:184,BACKPACK:185,GLIDER:186,SLEEPING_BAG:187,FLINT_STEEL:188,WATER_BUCKET:189
};
const names={
  1:'草',2:'土',3:'石',4:'砂',5:'水',6:'原木',7:'葉',8:'石炭',9:'鉄鉱石',10:'金鉱石',11:'ダイヤ鉱石',12:'雪',13:'砂利',14:'サボテン',15:'木材',16:'丸石',17:'ガラス',18:'岩盤',19:'作業台',20:'かまど',33:'転送作業台',34:'転送作業台',35:'転送作業台',36:'転送作業台',
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
  144:'焼き豚肉',145:'ステーキ',146:'木のドア',147:'松明',31:'松明',148:'チェスト',32:'チェスト',149:'弓',150:'矢',151:'鞍',152:'ライオンの牙',153:'バッファローの角',155:'オオアナコンダの革',156:'盾',157:'キメラの魂',158:'キメラの革',
  159:'キメラのヘルメット',160:'キメラのチェストプレート',161:'キメラのレギンス',162:'キメラのブーツ',163:'キメラの牙',164:'キメラのダガー',
  165:'キメラの角',166:'キメラの弓',167:'転送作業台',208:'ボスアリーナの核',
  21:'ベッド',22:'ベッド',23:'木のドア',24:'木のドア',25:'開いたドア',26:'開いたドア',27:'木のドア',28:'木のドア',29:'開いたドア',30:'開いたドア'
};
names[B.BOSS_ARENA_CORE]='ボスアリーナの祭壇';
names[B.BOSS_WARP_DEVICE]='ボス転送装置';names[B.BOSS_WARP_PART]='ボス転送装置';
names[B.STONE_BRICKS]='石レンガ';
names[B.MOSSY_STONE_BRICKS]='苔むした石レンガ';
names[B.CRACKED_STONE_BRICKS]='ひび割れた石レンガ';
names[B.POLISHED_STONE]='磨かれた石';
names[B.MARBLE]='白い大理石';
names[B.OBSIDIAN]='黒曜石';
names[B.RED_BRICKS]='レンガ';
names[B.WOOD_STAIRS]='木の階段';
names[B.STONE_STAIRS]='石の階段';
names[B.WOOD_SLAB]='木のハーフブロック';
names[B.IRON_BARS]='鉄格子';
names[B.WOOD_FENCE]='木のフェンス';
names[B.FENCE_GATE]='フェンスゲート';
names[B.LADDER]='はしご';
names[B.TRAPDOOR]='トラップドア';
names[B.LANTERN]='ランタン';
names[B.BOOKSHELF]='本棚';
names[B.BARREL]='樽';
names[B.TNT]='TNT';
names[B.CAMPFIRE]='焚き火';
names[I.SPEAR]='槍';
names[I.IRON_DAGGER]='鉄のダガー';
names[I.BATTLE_AXE]='戦斧';
names[I.HAMMER]='ハンマー';
names[I.CROSSBOW]='クロスボウ';
names[I.THROWING_KNIFE]='投げナイフ';
names[I.MOLOTOV]='火炎瓶';
names[I.HEAL_POTION]='回復ポーション';
names[I.STAMINA_POTION]='スタミナポーション';
names[I.POISON_ARROW]='毒矢';
names[I.BUCKET]='バケツ';
names[I.FISHING_ROD]='釣り竿';
names[I.COMPASS]='コンパス';
names[I.MAP]='地図';
names[I.BINOCULARS]='双眼鏡';
names[I.ROPE]='ロープ';
names[I.NAME_TAG]='名札';
names[I.BACKPACK]='リュック';
names[I.GLIDER]='グライダー';
names[I.SLEEPING_BAG]='寝袋';
names[B.SLEEPING_BAG_WORLD]='設置した寝袋';
names[B.SLEEPING_BAG_HEAD]='設置した寝袋';
names[I.FLINT_STEEL]='火打石と打ちがね';
names[I.WATER_BUCKET]='水入りバケツ';
for(const [variant,base] of SHAPED_VARIANT_BASE)names[variant]=names[base];
// Each new sleeping bag occupies two neighboring cells. The original ID 78
// remains the north-facing foot so older single-cell saves still load safely.
const SLEEPING_BAG_FEET=[B.SLEEPING_BAG_WORLD,B.SLEEPING_BAG_E,B.SLEEPING_BAG_S,B.SLEEPING_BAG_W];
const SLEEPING_BAG_HEADS=[B.SLEEPING_BAG_HEAD,B.SLEEPING_BAG_HEAD_E,B.SLEEPING_BAG_HEAD_S,B.SLEEPING_BAG_HEAD_W];
const SLEEPING_BAG_DIRECTIONS=[[0,-1],[1,0],[0,1],[-1,0]];
const SLEEPING_BAG_BLOCKS=new Set([...SLEEPING_BAG_FEET,...SLEEPING_BAG_HEADS]);
const isSleepingBagBlock=id=>SLEEPING_BAG_BLOCKS.has(id);
for(const id of SLEEPING_BAG_BLOCKS)names[id]='設置した寝袋';
function sleepingBagOther(x,y,z,id=get(x,y,z)){
  const footDir=SLEEPING_BAG_FEET.indexOf(id),headDir=SLEEPING_BAG_HEADS.indexOf(id);
  const foot=footDir>=0,d=foot?footDir:headDir;
  if(d<0)return null;
  const [dx,dz]=SLEEPING_BAG_DIRECTIONS[d];
  const tx=x+(foot?dx:-dx),tz=z+(foot?dz:-dz);
  if(get(tx,y,tz)!==(foot?SLEEPING_BAG_HEADS[d]:SLEEPING_BAG_FEET[d]))return null;
  return {x:tx,y,z:tz};
}
const NEW_BUILD_BLOCKS=[B.STONE_BRICKS,B.MOSSY_STONE_BRICKS,B.CRACKED_STONE_BRICKS,B.POLISHED_STONE,B.MARBLE,B.OBSIDIAN,B.RED_BRICKS,B.WOOD_STAIRS,B.STONE_STAIRS,B.WOOD_SLAB,B.IRON_BARS,B.WOOD_FENCE,B.FENCE_GATE,B.LADDER,B.TRAPDOOR,B.LANTERN,B.BOOKSHELF,B.BARREL,B.TNT,B.CAMPFIRE];
const NEW_ITEM_IDS=[I.SPEAR,I.IRON_DAGGER,I.BATTLE_AXE,I.HAMMER,I.CROSSBOW,I.THROWING_KNIFE,I.MOLOTOV,I.HEAL_POTION,I.STAMINA_POTION,I.POISON_ARROW,I.BUCKET,I.FISHING_ROD,I.COMPASS,I.MAP,I.BINOCULARS,I.ROPE,I.NAME_TAG,I.BACKPACK,I.GLIDER,I.SLEEPING_BAG,I.FLINT_STEEL,I.WATER_BUCKET];
const biomeNames=['Plains','Forest','Desert','Taiga','Snowy Peaks','Swamp','Ocean','River','Jungle'];
const buildable=[B.GRASS,B.DIRT,B.STONE,B.SAND,B.LOG,B.LEAF,B.COBBLE,B.PLANK,B.GLASS,B.SNOW,B.GRAVEL,B.CACTUS,...NEW_BUILD_BLOCKS];
const placeableItemToBlock={[I.CRAFTING_TABLE]:B.CRAFTING_TABLE,[I.FURNACE]:B.FURNACE,[I.BED]:B.BED,[I.DOOR]:B.DOOR_X,[I.TORCH]:B.TORCH,[I.CHEST]:B.CHEST};
const WARP_WORKBENCH_BLOCKS=new Set([B.WARP_WORKBENCH_X,B.WARP_WORKBENCH_X_END,B.WARP_WORKBENCH_Z,B.WARP_WORKBENCH_Z_END]);
const isWarpWorkbench=id=>WARP_WORKBENCH_BLOCKS.has(id);
const isBossWarp=id=>id===B.BOSS_WARP_DEVICE||id===B.BOSS_WARP_PART;
const BOSS_WARP_OFFSETS=Array.from({length:9},(_,i)=>({dx:i%3-1,dz:Math.floor(i/3)-1}));
const specialBlockDrops={[B.BOSS_ARENA_CORE]:I.BOSS_ARENA_CORE,[B.BOSS_WARP_DEVICE]:I.BOSS_WARP_DEVICE,[B.BOSS_WARP_PART]:I.BOSS_WARP_DEVICE,[B.CRAFTING_TABLE]:I.CRAFTING_TABLE,[B.FURNACE]:I.FURNACE,[B.BED]:I.BED,[B.BED_HEAD]:I.BED,[B.TORCH]:I.TORCH,[B.CHEST]:I.CHEST,[B.WARP_WORKBENCH_X]:I.WARP_WORKBENCH,[B.WARP_WORKBENCH_X_END]:I.WARP_WORKBENCH,[B.WARP_WORKBENCH_Z]:I.WARP_WORKBENCH,[B.WARP_WORKBENCH_Z_END]:I.WARP_WORKBENCH,[B.SLEEPING_BAG_WORLD]:I.SLEEPING_BAG};
for(const id of SLEEPING_BAG_BLOCKS)specialBlockDrops[id]=I.SLEEPING_BAG;
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
  [I.CHIMERA_HELMET]:0,[I.CHIMERA_CHEST]:0,[I.CHIMERA_LEGS]:0,[I.CHIMERA_BOOTS]:0,
  [I.WOOD_AXE]:0,
  [I.WOOL]:0,[I.RAW_PORK]:0,[I.RAW_BEEF]:0,[I.LEATHER]:0,[I.LION_FANG]:0,[I.BUFFALO_HORN]:0,[I.ANACONDA_HIDE]:0,[I.CHIMERA_SOUL]:0,[I.CHIMERA_HIDE]:0,
  [I.CHIMERA_FANG]:0,[I.CHIMERA_DAGGER]:0,[I.CHIMERA_HORN]:0,[I.CHIMERA_BOW]:0,[I.BED]:0,
  [I.COOKED_PORK]:0,[I.COOKED_BEEF]:0,[I.DOOR]:0,[I.TORCH]:0,[I.CHEST]:0,[I.BOW]:0,[I.ARROW]:0,[I.SADDLE]:0,[I.SHIELD]:0,[I.WARP_WORKBENCH]:0,[I.BOSS_ARENA_CORE]:0,[I.BOSS_WARP_DEVICE]:0,
  ...Object.fromEntries(NEW_BUILD_BLOCKS.map(id=>[id,0])),...Object.fromEntries(NEW_ITEM_IDS.map(id=>[id,0])),
  ...Object.fromEntries(JOB_WEAPON_IDS.map(id=>[id,0]))
};
// Preserve old saves when retired items disappear. The obsolete
// all-rounder-only sword (195) becomes an ordinary iron sword instead.
const migrateOldMeat=id=>Number(id)===154?I.RAW_BEEF:
  Number(id)===195?I.IRON_SWORD:Number(id);
const hotbarSlots=Array(9).fill(null),acquiredOrder=[];
const inventorySlots=Array(36).fill(null);
// Each world has its own job progression. Legacy worlds start unassigned
// without removing any of their existing inventory.
let activeJob='all',jobSelected=false;
for(const [key,data] of Object.entries(JOBS).filter(([,data])=>Number.isInteger(data.weapon)))names[data.weapon]=data.name+'の専用'+
  ({sword:'剣',greatsword:'大剣',axe:'戦斧',spear:'槍',dual:'双剣',shield:'盾',bow:'弓',staff:'杖'}[data.kind]||'武器');

const equippedArmor=[null,null,null,null]; // helmet / chest / legs / boots
let equippedBackpack=false;
const backpackSlots=Array(9).fill(null);
let offhandItem=null; // torch or shield: a single physical item moved from inventory
let shieldGuarding=false;
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
  [I.CHIMERA_HELMET]:'キ頭',[I.CHIMERA_CHEST]:'キ胴',[I.CHIMERA_LEGS]:'キ脚',[I.CHIMERA_BOOTS]:'キ靴',
  [I.WOOD_AXE]:'木斧',
  [I.WOOL]:'羊',[I.RAW_PORK]:'豚',[I.RAW_BEEF]:'牛',[I.LEATHER]:'革',[I.LION_FANG]:'牙',[I.BUFFALO_HORN]:'角',[I.ANACONDA_HIDE]:'蛇革',[I.CHIMERA_SOUL]:'魂',[I.CHIMERA_HIDE]:'キ革',[I.CHIMERA_FANG]:'キ牙',[I.CHIMERA_DAGGER]:'短剣',
  [I.CHIMERA_HORN]:'キ角',[I.CHIMERA_BOW]:'キ弓',[I.BED]:'床',
  [I.COOKED_PORK]:'焼豚',[I.COOKED_BEEF]:'焼牛',[I.DOOR]:'ドア',[I.TORCH]:'松明',[I.CHEST]:'箱',[I.WARP_WORKBENCH]:'転送台',[I.BOSS_ARENA_CORE]:'闘技場',[I.BOSS_WARP_DEVICE]:'転送門',[I.BOW]:'弓',[I.ARROW]:'矢',[I.SADDLE]:'鞍',[I.SHIELD]:'盾'
};

const ICON_MAT={
  wood:{main:'#9a6335',light:'#c58a50',dark:'#624021'},
  stone:{main:'#8b9096',light:'#b8bdc2',dark:'#555b60'},
  iron:{main:'#c8d0d7',light:'#f0f4f6',dark:'#7b858d'},
  gold:{main:'#e0b52e',light:'#ffe16a',dark:'#9d7613'},
  diamond:{main:'#43d7df',light:'#9affff',dark:'#168891'},
  chimera:{main:'#59415e',light:'#c99e6b',dark:'#251c2c'}
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
  if(id===I.CHIMERA_DAGGER)return ICON_MAT.chimera;
  if([I.WOOD_PICK,I.WOOD_AXE].includes(id))return ICON_MAT.wood;
  if([I.STONE_PICK,I.STONE_SWORD,I.STONE_AXE,I.STONE_SHOVEL].includes(id))return ICON_MAT.stone;
  if([I.IRON_PICK,I.IRON_SWORD,I.IRON_AXE,I.IRON_SHOVEL].includes(id))return ICON_MAT.iron;
  if([I.GOLD_PICK,I.GOLD_SWORD,I.GOLD_AXE,I.GOLD_SHOVEL].includes(id))return ICON_MAT.gold;
  return ICON_MAT.diamond;
}
function toolType(id){
  if([I.WOOD_PICK,I.STONE_PICK,I.IRON_PICK,I.GOLD_PICK,I.DIAMOND_PICK].includes(id))return 'pick';
  if(id===I.CHIMERA_DAGGER)return 'dagger';
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
    // Curved single-edge katana: broad blade, bright cutting edge, wrapped
    // handle and a compact tsuba instead of a straight rapier crossguard.
    poly(g,[[4,11],[7,7],[9,4],[12,2],[14,1],[13,4],[11,6],[9,9],[6,12]],outline);
    poly(g,[[6,10],[8,7],[10,4],[13,2],[12,5],[10,7],[8,10]],m.main);
    pixelLine(g,12,3,7,10,m.light,1);
    ir(g,3,10,6,2,m.dark);ir(g,4,10,4,1,m.light);
    pixelLine(g,5,11,2,15,handle,3);
    ir(g,3,12,2,1,m.light);ir(g,2,14,2,1,m.light);
  }else if(t==='dagger'){
    // The Chimera fang-blade is a short, broad wakizashi-style katana.
    poly(g,[[5,10],[7,7],[10,4],[13,2],[12,5],[9,8],[7,11]],'#251d2b');
    poly(g,[[6,9],[8,7],[11,4],[12,3],[11,6],[8,9]],m.light);
    pixelLine(g,11,4,7,9,'#fff1cf',1);
    ir(g,4,10,5,2,'#3c293d');ir(g,4,10,3,1,'#d1aa7d');
    pixelLine(g,5,12,3,15,'#37252f',3);
    ir(g,3,13,2,1,'#c9a572');
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
  const chimera=[I.CHIMERA_HELMET,I.CHIMERA_CHEST,I.CHIMERA_LEGS,I.CHIMERA_BOOTS];
  const m=chimera.includes(id)?ICON_MAT.chimera:iron.includes(id)?ICON_MAT.iron:gold.includes(id)?ICON_MAT.gold:ICON_MAT.diamond;
  const group=chimera.includes(id)?chimera:iron.includes(id)?iron:gold.includes(id)?gold:[I.DIAMOND_HELMET,I.DIAMOND_CHEST,I.DIAMOND_LEGS,I.DIAMOND_BOOTS];
  const idx=group.indexOf(id),o='#2b2b2b';
  if(idx===0){ir(g,4,3,8,2,o);ir(g,3,5,10,6,o);ir(g,4,4,8,2,m.light);ir(g,4,6,8,4,m.main);ir(g,5,9,2,2,m.dark);ir(g,9,9,2,2,m.dark)}
  if(idx===1){poly(g,[[5,2],[11,2],[14,5],[12,8],[11,14],[5,14],[4,8],[2,5]],o);poly(g,[[6,3],[10,3],[12,5],[10,7],[10,13],[6,13],[6,7],[4,5]],m.main);ir(g,6,3,4,1,m.light);ir(g,6,8,4,1,m.dark)}
  if(idx===2){ir(g,4,3,8,4,o);ir(g,4,6,4,8,o);ir(g,8,6,4,8,o);ir(g,5,4,6,2,m.light);ir(g,5,6,3,7,m.main);ir(g,9,6,2,7,m.main);ir(g,6,10,1,3,m.dark);ir(g,10,10,1,3,m.dark)}
  if(idx===3){ir(g,3,7,5,7,o);ir(g,9,7,4,7,o);ir(g,4,8,3,4,m.main);ir(g,10,8,2,4,m.main);ir(g,3,12,5,1,m.light);ir(g,9,12,4,1,m.light)}
  if(chimera.includes(id)){
    if(idx===0){ir(g,3,1,2,4,'#e4d6b5');ir(g,11,1,2,4,'#e4d6b5')}
    if(idx===1){ir(g,5,8,2,3,'#e6ce98');ir(g,9,8,2,3,'#e6ce98')}
    if(idx===2){ir(g,5,10,1,3,'#d2ad81');ir(g,10,10,1,3,'#d2ad81')}
    if(idx===3){ir(g,3,13,4,1,'#e6ce98');ir(g,9,13,4,1,'#e6ce98')}
  }
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
  if(id===I.LION_FANG){
    poly(g,[[4,2],[12,2],[11,7],[9,12],[7,15],[5,9]],'#f0e5bd');
    ir(g,5,3,5,2,'#fff7dd');ir(g,7,12,2,2,'#b6a17a');return;
  }
  if(id===I.BUFFALO_HORN){
    poly(g,[[2,4],[4,3],[7,8],[10,10],[13,7],[14,5],[14,10],[12,13],[8,13],[5,11]],'#c4b89a');
    ir(g,3,4,2,3,'#f1e7ce');ir(g,10,11,3,2,'#867962');return;
  }
  if(id===I.CHIMERA_FANG){
    poly(g,[[4,1],[8,2],[11,5],[10,10],[7,15],[6,11],[5,7]],'#29232e');
    poly(g,[[5,2],[8,3],[10,5],[9,9],[7,13],[7,8],[6,5]],'#f2e1bb');
    ir(g,7,3,2,2,'#fff7e1');ir(g,6,11,2,2,'#ad8c81');return;
  }
  if(id===I.CHIMERA_HORN){
    poly(g,[[2,13],[3,7],[5,3],[10,1],[8,4],[7,8],[11,13],[8,14],[5,12]],'#2d2833');
    poly(g,[[3,11],[4,7],[6,4],[9,2],[7,6],[6,9],[9,12],[7,13]],'#777179');
    ir(g,5,5,2,2,'#bcb1af');return;
  }
  if(id===I.ANACONDA_HIDE){
    poly(g,[[4,2],[7,3],[10,2],[13,5],[11,8],[13,12],[9,14],[6,12],[3,13],[2,9],[4,6]],'#5a7439');
    ir(g,5,5,3,2,'#2c4226');ir(g,9,8,3,2,'#293e24');
    ir(g,5,10,4,2,'#b2a675');return;
  }
  if(id===I.CHIMERA_HIDE){
    // Thick layered beast hide: dark mane, scaled tail and golden edge.
    poly(g,[[3,3],[6,2],[9,4],[12,3],[14,7],[12,10],[13,13],[9,14],[6,12],[2,13],[3,9],[1,7]],'#33283a');
    poly(g,[[4,4],[7,3],[9,5],[11,4],[13,7],[10,10],[11,12],[7,11],[4,12],[4,9],[2,7]],'#715568');
    ir(g,5,5,4,2,'#be926a');ir(g,6,9,5,2,'#4a6857');ir(g,10,5,2,2,'#d4b07f');return;
  }
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
  if(drawJobWeaponIcon(g,id))return;
  if(drawDetailedItemIcon(g,id))return;
  if(id===I.WOOL||id===I.RAW_PORK||id===I.RAW_BEEF||id===I.LEATHER||
    id===I.COOKED_PORK||id===I.COOKED_BEEF||id===I.LION_FANG||
    id===I.BUFFALO_HORN||id===I.ANACONDA_HIDE||id===I.CHIMERA_HIDE||
    id===I.CHIMERA_FANG||id===I.CHIMERA_HORN)return mobDropIcon(g,id);
  // Actual silhouettes/textures for every new block and item (no letter glyphs).
  if(NEW_BUILD_BLOCKS.includes(id)){drawNewBlockArt(g,id);return}
  if(NEW_ITEM_IDS.includes(id)){drawNewItemArt(g,id);return}
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
  if(id===I.BOSS_ARENA_CORE||id===B.BOSS_ARENA_CORE){
    ir(g,1,11,14,4,'#0d191e');ir(g,2,9,12,3,'#354249');
    poly(g,[[2,10],[4,3],[7,7],[7,11]],'#202f38');
    poly(g,[[14,10],[12,3],[9,7],[9,11]],'#202f38');
    ir(g,4,6,1,5,'#24c7b4');ir(g,11,6,1,5,'#24c7b4');
    ir(g,7,3,2,9,'#54f9df');ir(g,5,6,6,2,'#9ffff1');return;
  }
  if(id===I.WARP_WORKBENCH||isWarpWorkbench(id)){
    ir(g,1,10,14,4,'#0b1418');ir(g,2,8,12,3,'#333f43');
    poly(g,[[2,11],[3,4],[6,7],[6,11]],'#344247');
    poly(g,[[14,11],[13,4],[10,7],[10,11]],'#344247');
    ir(g,4,7,1,5,'#30cdbb');ir(g,11,7,1,5,'#30cdbb');
    poly(g,[[7,2],[9,2],[10,9],[6,9]],'#151f23');
    ir(g,8,4,1,5,'#2fe9c8');
    poly(g,[[8,6],[9,8],[12,9],[9,10],[8,12],[7,10],[4,9],[7,8]],'#9affef');
    return;
  }
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
  if(id===I.DOOR){ir(g,5,1,7,14,'#57361e');ir(g,6,2,5,12,'#aa703a');ir(g,7,3,3,4,'#d2a06a');ir(g,7,8,3,4,'#835129');ir(g,10,8,1,1,'#ffdc83');return}
  if(id===I.CHEST){
    ir(g,2,5,12,9,'#352216');ir(g,3,6,10,7,'#9c632e');
    ir(g,3,5,10,3,'#cb8c46');ir(g,4,6,8,1,'#edb66c');
    ir(g,2,12,12,2,'#48301e');ir(g,3,9,10,1,'#6b411f');
    ir(g,7,7,3,6,'#463c28');ir(g,8,8,1,4,'#f8d568');return;
  }
  if(id===I.TORCH){ir(g,7,6,3,9,'#58391e');ir(g,8,7,1,8,'#c59054');ir(g,6,3,5,5,'#ec7424');ir(g,7,1,3,6,'#ffb431');ir(g,8,0,1,6,'#fff2a1');return}
  if(id===I.CHIMERA_SOUL){
    // Glowing violet soul enclosed by ivory horn fragments.
    poly(g,[[8,0],[11,3],[14,7],[12,12],[8,15],[4,12],[2,7],[5,3]],'#3c204c');
    poly(g,[[8,2],[11,5],[12,9],[8,13],[4,9],[5,5]],'#9151cd');
    ir(g,7,4,3,6,'#e7baff');ir(g,8,3,1,8,'#fff2fb');
    ir(g,3,4,2,3,'#eee1ba');ir(g,11,4,2,3,'#eee1ba');
    ir(g,5,11,2,2,'#704ca0');return;
  }
  if(id===I.SHIELD){
    // Full-size embossed shield icon: wooden center surrounded by steel edging.
    poly(g,[[2,1],[13,1],[14,9],[8,15],[2,9]],'#505b60');
    poly(g,[[3,2],[12,2],[12,9],[8,13],[3,9]],'#c5d0d3');
    poly(g,[[4,3],[11,3],[11,9],[8,12],[4,9]],'#7b5131');
    ir(g,6,3,3,8,'#a47147');
    ir(g,4,5,8,1,'#5e3c24');
    ir(g,7,5,2,4,'#e4e8e6');
    ir(g,8,7,1,2,'#879399');
    return;
  }
  if(id===I.SADDLE){
    // Leather saddle, curved seat, straps and brass buckle.
    ir(g,2,7,12,5,'#4d2e20');ir(g,3,6,10,5,'#92552f');
    ir(g,4,4,8,4,'#b77a47');ir(g,5,3,6,2,'#d39c64');
    ir(g,3,11,3,3,'#64402b');ir(g,10,11,3,3,'#64402b');
    ir(g,2,8,2,3,'#d6b35f');ir(g,12,8,2,3,'#d6b35f');
    ir(g,6,8,4,1,'#e1ac70');return;
  }
  if(id===I.CHIMERA_BOW){
    // Heavy horn bow with pale horn tips and a gold string.
    pixelLine(g,11,1,5,4,'#ddd0bb',3);pixelLine(g,5,4,4,11,'#4c3b4f',3);
    pixelLine(g,4,11,10,15,'#a99a8c',3);pixelLine(g,11,2,11,14,'#e1b96a',1);
    ir(g,3,7,3,3,'#3c273a');ir(g,10,2,2,2,'#f8e5cd');
    ir(g,9,13,3,2,'#f8e5cd');return;
  }
  if(id===I.BOW){
    // Dark curved wood with a taut pale string and grip.
    pixelLine(g,11,1,5,4,'#58331b',2);pixelLine(g,5,4,4,11,'#a5713c',2);
    pixelLine(g,4,11,10,15,'#683f21',2);
    pixelLine(g,11,2,11,14,'#e8dcb6',1);ir(g,4,7,3,3,'#3c271d');return;
  }
  if(id===I.ARROW){
    pixelLine(g,3,13,12,4,'#4b3424',3);pixelLine(g,3,13,12,4,'#af8453',2);
    poly(g,[[11,1],[15,1],[15,5],[12,6]],'#aab8c4');
    ir(g,2,10,2,4,'#ece0c0');ir(g,4,12,2,2,'#e6d5a4');return;
  }
  if(id===I.STICK)return stickIcon(g);
  if(id===I.RAW_IRON)return rawChunkIcon(g,'#8e7569','#c79a81','#624f47');
  if(id===I.RAW_GOLD)return rawChunkIcon(g,'#a88d32','#f0ca45','#6d5a21');
  if(id===I.IRON_INGOT)return ingotIcon(g,ICON_MAT.iron);
  if(id===I.GOLD_INGOT)return ingotIcon(g,ICON_MAT.gold);
  if(id===I.DIAMOND)return gemIcon(g,ICON_MAT.diamond);
  if(toolType(id))return toolIcon(g,id);
  if(armorPartForId(id)>=0)return armorIcon(g,id);
  ir(g,3,3,10,10,'#777');ir(g,5,5,6,6,'#aaa');
}
const recipes=[
  {name:'木材 ×4',out:B.PLANK,qty:4,needs:[[B.LOG,1]],unlockLevel:2},
  {name:'棒 ×4',out:I.STICK,qty:4,needs:[[B.PLANK,2]],unlockLevel:3},
  {name:'作業台',out:I.CRAFTING_TABLE,qty:1,needs:[[B.PLANK,4]],unlockLevel:4},
  {name:'木のツルハシ',out:I.WOOD_PICK,qty:1,needs:[[B.PLANK,3],[I.STICK,2]],unlockLevel:5},
  {name:'木の斧',out:I.WOOD_AXE,qty:1,needs:[[B.PLANK,3],[I.STICK,2]],unlockLevel:5},
  {name:'松明 ×4',out:I.TORCH,qty:4,needs:[[B.COAL,1],[I.STICK,1]],unlockLevel:3},
  {name:'矢 ×4',out:I.ARROW,qty:4,needs:[[B.COBBLE,1],[I.STICK,1]],unlockLevel:5}
];
const workbenchRecipes=[
  {name:'キメラの魂',out:I.CHIMERA_SOUL,qty:1,needs:[[I.LION_FANG,1],[I.ANACONDA_HIDE,1],[I.BUFFALO_HORN,1]],unlockLevel:1},
  {name:'キメラのヘルメット',out:I.CHIMERA_HELMET,qty:1,needs:[[I.CHIMERA_HIDE,3]],unlockLevel:1},
  {name:'キメラのチェストプレート',out:I.CHIMERA_CHEST,qty:1,needs:[[I.CHIMERA_HIDE,3]],unlockLevel:1},
  {name:'キメラのレギンス',out:I.CHIMERA_LEGS,qty:1,needs:[[I.CHIMERA_HIDE,3]],unlockLevel:1},
  {name:'キメラのブーツ',out:I.CHIMERA_BOOTS,qty:1,needs:[[I.CHIMERA_HIDE,3]],unlockLevel:1},
  {name:'キメラのダガー',out:I.CHIMERA_DAGGER,qty:1,needs:[[I.CHIMERA_FANG,3]],unlockLevel:1},
  {name:'キメラの弓',out:I.CHIMERA_BOW,qty:1,needs:[[I.CHIMERA_HORN,3]],unlockLevel:1},
  {name:'ベッド',out:I.BED,qty:1,needs:[[I.WOOL,3],[B.PLANK,3]],unlockLevel:6},
  {name:'木のドア',out:I.DOOR,qty:1,needs:[[B.PLANK,6]],unlockLevel:6},
  {name:'チェスト',out:I.CHEST,qty:1,needs:[[B.PLANK,8]],unlockLevel:6},
  {name:'盾',out:I.SHIELD,qty:1,needs:[[B.PLANK,6],[I.IRON_INGOT,1]],unlockLevel:8},
  {name:'転送作業台',out:I.WARP_WORKBENCH,qty:1,needs:[[I.IRON_INGOT,8]],unlockLevel:8},
  {name:'弓',out:I.BOW,qty:1,needs:[[I.STICK,3],[I.WOOL,3]],unlockLevel:7},
  {name:'鞍',out:I.SADDLE,qty:1,needs:[[I.LEATHER,5]],unlockLevel:7},
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

  {name:'金のツルハシ',out:I.GOLD_PICK,qty:1,needs:[[I.GOLD_INGOT,3],[I.STICK,2]],unlockLevel:40},
  {name:'金の剣',out:I.GOLD_SWORD,qty:1,needs:[[I.GOLD_INGOT,2],[I.STICK,1]],unlockLevel:40},
  {name:'金の斧',out:I.GOLD_AXE,qty:1,needs:[[I.GOLD_INGOT,3],[I.STICK,2]],unlockLevel:40},
  {name:'金のシャベル',out:I.GOLD_SHOVEL,qty:1,needs:[[I.GOLD_INGOT,1],[I.STICK,2]],unlockLevel:40},
  {name:'金のヘルメット',out:I.GOLD_HELMET,qty:1,needs:[[I.GOLD_INGOT,5]],unlockLevel:40},
  {name:'金のチェストプレート',out:I.GOLD_CHEST,qty:1,needs:[[I.GOLD_INGOT,8]],unlockLevel:40},
  {name:'金のレギンス',out:I.GOLD_LEGS,qty:1,needs:[[I.GOLD_INGOT,7]],unlockLevel:40},
  {name:'金のブーツ',out:I.GOLD_BOOTS,qty:1,needs:[[I.GOLD_INGOT,4]],unlockLevel:40},

  {name:'ダイヤのツルハシ',out:I.DIAMOND_PICK,qty:1,needs:[[I.DIAMOND,3],[I.STICK,2]],unlockLevel:100},
  {name:'ダイヤの剣',out:I.DIAMOND_SWORD,qty:1,needs:[[I.DIAMOND,2],[I.STICK,1]],unlockLevel:100},
  {name:'ダイヤの斧',out:I.DIAMOND_AXE,qty:1,needs:[[I.DIAMOND,3],[I.STICK,2]],unlockLevel:100},
  {name:'ダイヤのシャベル',out:I.DIAMOND_SHOVEL,qty:1,needs:[[I.DIAMOND,1],[I.STICK,2]],unlockLevel:100},
  {name:'ダイヤのヘルメット',out:I.DIAMOND_HELMET,qty:1,needs:[[I.DIAMOND,5]],unlockLevel:100},
  {name:'ダイヤのチェストプレート',out:I.DIAMOND_CHEST,qty:1,needs:[[I.DIAMOND,8]],unlockLevel:100},
  {name:'ダイヤのレギンス',out:I.DIAMOND_LEGS,qty:1,needs:[[I.DIAMOND,7]],unlockLevel:100},
  {name:'ダイヤのブーツ',out:I.DIAMOND_BOOTS,qty:1,needs:[[I.DIAMOND,4]],unlockLevel:100}
];

const expansionRecipes=[
  {name:'石レンガ ×4',out:B.STONE_BRICKS,qty:4,needs:[[B.STONE,4]],unlockLevel:5},
  {name:'苔むした石レンガ',out:B.MOSSY_STONE_BRICKS,qty:1,needs:[[B.STONE_BRICKS,1],[B.LEAF,1]],unlockLevel:5},
  {name:'ひび割れた石レンガ',out:B.CRACKED_STONE_BRICKS,qty:1,needs:[[B.STONE_BRICKS,1]],unlockLevel:5},
  {name:'磨かれた石',out:B.POLISHED_STONE,qty:1,needs:[[B.STONE,2]],unlockLevel:5},
  {name:'白い大理石',out:B.MARBLE,qty:1,needs:[[B.STONE,3],[B.SAND,1]],unlockLevel:6},
  {name:'黒曜石',out:B.OBSIDIAN,qty:1,needs:[[B.STONE,4],[B.COAL,2]],unlockLevel:7},
  {name:'レンガ ×4',out:B.RED_BRICKS,qty:4,needs:[[B.DIRT,4],[B.COAL,1]],unlockLevel:6},
  {name:'木の階段 ×4',out:B.WOOD_STAIRS,qty:4,needs:[[B.PLANK,6]],unlockLevel:5},
  {name:'石の階段 ×4',out:B.STONE_STAIRS,qty:4,needs:[[B.STONE,6]],unlockLevel:5},
  {name:'木のハーフブロック ×6',out:B.WOOD_SLAB,qty:6,needs:[[B.PLANK,3]],unlockLevel:5},
  {name:'鉄格子 ×4',out:B.IRON_BARS,qty:4,needs:[[I.IRON_INGOT,6]],unlockLevel:8},
  {name:'木のフェンス ×3',out:B.WOOD_FENCE,qty:3,needs:[[B.PLANK,4],[I.STICK,2]],unlockLevel:5},
  {name:'フェンスゲート',out:B.FENCE_GATE,qty:1,needs:[[B.PLANK,2],[I.STICK,4]],unlockLevel:5},
  {name:'はしご ×3',out:B.LADDER,qty:3,needs:[[I.STICK,7]],unlockLevel:5},
  {name:'トラップドア ×2',out:B.TRAPDOOR,qty:2,needs:[[B.PLANK,6]],unlockLevel:5},
  {name:'ランタン',out:B.LANTERN,qty:1,needs:[[I.IRON_INGOT,2],[I.TORCH,1]],unlockLevel:8},
  {name:'本棚',out:B.BOOKSHELF,qty:1,needs:[[B.PLANK,6],[I.LEATHER,2]],unlockLevel:7},
  {name:'樽',out:B.BARREL,qty:1,needs:[[B.PLANK,6],[B.WOOD_SLAB,2]],unlockLevel:5},
  {name:'TNT',out:B.TNT,qty:1,needs:[[B.SAND,4],[B.COAL,5]],unlockLevel:8},
  {name:'焚き火',out:B.CAMPFIRE,qty:1,needs:[[B.LOG,3],[I.STICK,3],[B.COAL,1]],unlockLevel:5},
  {name:'槍',out:I.SPEAR,qty:1,needs:[[I.IRON_INGOT,2],[I.STICK,2]],unlockLevel:8},
  {name:'鉄のダガー',out:I.IRON_DAGGER,qty:1,needs:[[I.IRON_INGOT,1],[I.STICK,1]],unlockLevel:8},
  {name:'戦斧',out:I.BATTLE_AXE,qty:1,needs:[[I.IRON_INGOT,4],[I.STICK,2]],unlockLevel:8},
  {name:'ハンマー',out:I.HAMMER,qty:1,needs:[[I.IRON_INGOT,5],[I.STICK,2]],unlockLevel:8},
  {name:'クロスボウ',out:I.CROSSBOW,qty:1,needs:[[I.IRON_INGOT,2],[B.PLANK,3],[I.STICK,2]],unlockLevel:8},
  {name:'投げナイフ ×4',out:I.THROWING_KNIFE,qty:4,needs:[[I.IRON_INGOT,2],[I.STICK,1]],unlockLevel:8},
  {name:'火炎瓶 ×2',out:I.MOLOTOV,qty:2,needs:[[B.GLASS,2],[B.COAL,2],[I.LEATHER,1]],unlockLevel:8},
  {name:'回復ポーション',out:I.HEAL_POTION,qty:1,needs:[[B.GLASS,1],[B.LEAF,3]],unlockLevel:7},
  {name:'スタミナポーション',out:I.STAMINA_POTION,qty:1,needs:[[B.GLASS,1],[B.CACTUS,2]],unlockLevel:7},
  {name:'毒矢 ×4',out:I.POISON_ARROW,qty:4,needs:[[I.ARROW,4],[B.CACTUS,1]],unlockLevel:7},
  {name:'バケツ',out:I.BUCKET,qty:1,needs:[[I.IRON_INGOT,3]],unlockLevel:8},
  {name:'釣り竿',out:I.FISHING_ROD,qty:1,needs:[[I.STICK,3],[I.WOOL,2]],unlockLevel:6},
  {name:'コンパス',out:I.COMPASS,qty:1,needs:[[I.IRON_INGOT,4],[I.GOLD_INGOT,1]],unlockLevel:8},
  {name:'地図',out:I.MAP,qty:1,needs:[[B.PLANK,2],[I.LEATHER,2]],unlockLevel:7},
  {name:'双眼鏡',out:I.BINOCULARS,qty:1,needs:[[I.IRON_INGOT,3],[B.GLASS,2]],unlockLevel:8},
  {name:'ロープ ×3',out:I.ROPE,qty:3,needs:[[I.WOOL,3]],unlockLevel:6},
  {name:'名札',out:I.NAME_TAG,qty:1,needs:[[I.LEATHER,1],[I.IRON_INGOT,1]],unlockLevel:7},
  {name:'リュック',out:I.BACKPACK,qty:1,needs:[[I.LEATHER,6],[I.WOOL,2]],unlockLevel:7},
  {name:'グライダー',out:I.GLIDER,qty:1,needs:[[I.LEATHER,6],[B.PLANK,4],[I.WOOL,2]],unlockLevel:8},
  {name:'寝袋',out:I.SLEEPING_BAG,qty:1,needs:[[I.WOOL,3],[I.LEATHER,1]],unlockLevel:6},
  {name:'火打石と打ちがね',out:I.FLINT_STEEL,qty:1,needs:[[I.IRON_INGOT,1],[B.GRAVEL,1]],unlockLevel:7}
];
workbenchRecipes.push(...expansionRecipes);
// Every class weapon can be remade if lost. All-rounders can craft any of
// them once the relevant level is reached, but other jobs must specialize.
const jobWeaponIngredients=kind=>({
  sword:[[I.IRON_INGOT,2],[I.STICK,1]],
  greatsword:[[I.IRON_INGOT,6],[I.STICK,2]],
  axe:[[I.IRON_INGOT,5],[I.STICK,2]],
  spear:[[I.IRON_INGOT,3],[I.STICK,3]],
  dual:[[I.IRON_INGOT,3],[I.STICK,2]],
  shield:[[I.IRON_INGOT,5],[B.PLANK,3]],
  bow:[[I.STICK,4],[I.WOOL,2]],
  staff:[[I.STICK,3],[B.GLASS,1]]
}[kind]||[[I.IRON_INGOT,2],[I.STICK,2]]);
workbenchRecipes.push(...Object.values(JOBS).filter(j=>Number.isInteger(j.weapon)).map(j=>({
  name:names[j.weapon],out:j.weapon,qty:1,
  needs:jobWeaponIngredients(j.kind),unlockLevel:j.level
})));
const warpWorkbenchRecipes=[
  {name:'ボス転送装置（3×3設置）',out:I.BOSS_WARP_DEVICE,qty:1,
    needs:[[B.OBSIDIAN,12],[B.POLISHED_STONE,8],[I.IRON_INGOT,8],[I.DIAMOND,2]],unlockLevel:8},
  {name:'ボス専用アリーナの核',out:I.BOSS_ARENA_CORE,qty:1,
    needs:[[B.STONE_BRICKS,32],[B.OBSIDIAN,16],[I.IRON_INGOT,8],[I.DIAMOND,2]],
    unlockLevel:8}
];
const furnaceRecipes=[
  {name:'鉄インゴット',out:I.IRON_INGOT,qty:1,needs:[[I.RAW_IRON,1],[B.COAL,1]],unlockLevel:7,xp:4},
  {name:'金インゴット',out:I.GOLD_INGOT,qty:1,needs:[[I.RAW_GOLD,1],[B.COAL,1]],unlockLevel:7,xp:6},
  {name:'焼き豚肉',out:I.COOKED_PORK,qty:1,needs:[[I.RAW_PORK,1],[B.COAL,1]],unlockLevel:7,xp:2},
  {name:'ステーキ',out:I.COOKED_BEEF,qty:1,needs:[[I.RAW_BEEF,1],[B.COAL,1]],unlockLevel:7,xp:3},
  {name:'ガラス',out:B.GLASS,qty:1,needs:[[B.SAND,1],[B.COAL,1]],unlockLevel:7,xp:2}
];
// 木材3個を石炭1個の代替燃料として使う。材料とレベルは通常のかまどと同じ。
const furnaceWoodRecipes=furnaceRecipes.map(r=>({
  ...r,name:r.name+'（木材燃料）',
  needs:r.needs.map(([id,n])=>[id,id===B.COAL?n*3:n]).reduce((acc,[id,n])=>{
    const fuel=id===B.COAL?B.PLANK:id;
    const existing=acc.find(x=>x[0]===fuel);
    if(existing)existing[1]+=n;else acc.push([fuel,n]);
    return acc;
  },[])
}));
const hardnessNew={};for(const id of NEW_BUILD_BLOCKS)hardnessNew[id]=id===B.OBSIDIAN?8:2.2;
for(const [variant,base] of SHAPED_VARIANT_BASE)hardnessNew[variant]=hardnessNew[base];
const blockXP={[B.GRASS]:1,[B.DIRT]:1,[B.SAND]:1,[B.LEAF]:1,[B.LOG]:4,[B.STONE]:3,[B.GRAVEL]:2,[B.COAL]:6,[B.IRON]:10,[B.GOLD]:14,[B.DIAMOND]:25,[B.CACTUS]:2};
const hardness={...hardnessNew,
  [B.GRASS]:0.55,[B.DIRT]:0.45,[B.SAND]:0.4,[B.LEAF]:0.22,[B.SNOW]:0.18,[B.GRAVEL]:0.75,[B.CACTUS]:0.65,
  [B.LOG]:1.55,[B.PLANK]:1.25,[B.GLASS]:0.3,[B.CRAFTING_TABLE]:2.0,[B.BED]:1.0,[B.BED_HEAD]:1.0,
  [B.STONE]:3.0,[B.COBBLE]:3.4,[B.COAL]:3.5,[B.IRON]:4.2,[B.GOLD]:4.0,[B.DIAMOND]:5.0,[B.FURNACE]:3.8,
  [B.DOOR_X]:1.4,[B.DOOR_X_TOP]:1.4,[B.DOOR_X_OPEN]:1.4,[B.DOOR_X_OPEN_TOP]:1.4,
  [B.DOOR_Z]:1.4,[B.DOOR_Z_TOP]:1.4,[B.DOOR_Z_OPEN]:1.4,[B.DOOR_Z_OPEN_TOP]:1.4,
  [B.TORCH]:.15,[B.CHEST]:2.5,[B.WOOD_SLAB_TOP]:1.25,
  [B.WARP_WORKBENCH_X]:3.2,[B.WARP_WORKBENCH_X_END]:3.2,
  [B.WARP_WORKBENCH_Z]:3.2,[B.WARP_WORKBENCH_Z_END]:3.2,
  [B.BEDROCK]:Infinity
};
const rockBlocks=new Set([
  B.STONE,B.COBBLE,B.COAL,B.IRON,B.GOLD,B.DIAMOND,B.FURNACE,...WARP_WORKBENCH_BLOCKS,
  B.STONE_BRICKS,B.MOSSY_STONE_BRICKS,B.CRACKED_STONE_BRICKS,B.POLISHED_STONE,
  B.MARBLE,B.OBSIDIAN,B.RED_BRICKS,B.STONE_STAIRS,
  B.STONE_STAIRS_E,B.STONE_STAIRS_S,B.STONE_STAIRS_W,
  B.IRON_BARS,B.LANTERN
]);

let selected=null,seed=(Date.now()>>>0),weather='clear',started=false,craftOpen=false,craftMode='inventory',level=1,xp=0,miningHeld=false,miningKey=null,miningElapsed=0,miningId=null;
const chunks=new Map(),editChunks=new Map();
// 27 slots per chest, indexed by world position and saved alongside edits.
const CHEST_SIZE=27,chestContents=new Map(),villageLootGranted=new Set();
let chestOpen=false,chestLocation=null,chestOneAtATime=false,chestPending=null,chestRequestId=0;
const chestKey=(x,y,z)=>x+','+y+','+z;
function normalizedChest(raw){
  return Array.from({length:CHEST_SIZE},(_,i)=>{
    const st=Array.isArray(raw)?raw[i]:null,id=migrateOldMeat(st?.id),qty=Number(st?.qty);
    return st&&Number.isInteger(id)&&Object.hasOwn(inventory,id)&&Number.isInteger(qty)&&qty>0?{id,qty:Math.min(qty,maxStackFor(id))}:null;
  });
}
// Seeded treasure ranges from wooden tools to very rare diamond equipment.
function generateVillageChestLoot(x,y,z){
  const roll=n=>hash3(x+n*41,y+n*17,z-n*29,(seed+62529)>>>0);
  const luck=roll(1);
  const tier=luck>.98?'diamond':luck>.85?'gold':luck>.58?'iron':luck>.27?'stone':'wood';
  const gear={
    wood:[I.WOOD_PICK,I.WOOD_AXE],
    stone:[I.STONE_PICK,I.STONE_SWORD,I.STONE_AXE,I.STONE_SHOVEL],
    iron:[I.IRON_PICK,I.IRON_SWORD,I.IRON_AXE,I.IRON_HELMET,I.IRON_CHEST],
    gold:[I.GOLD_PICK,I.GOLD_SWORD,I.GOLD_AXE,I.GOLD_HELMET,I.GOLD_CHEST],
    diamond:[I.DIAMOND_PICK,I.DIAMOND_SWORD,I.DIAMOND_HELMET,I.DIAMOND_CHEST,
      I.DIAMOND_LEGS,I.DIAMOND_BOOTS]
  }[tier];
  const materials={
    wood:[B.PLANK,I.STICK,B.LOG,B.COBBLE],
    stone:[B.COBBLE,B.COAL,I.STICK,B.PLANK],
    iron:[I.RAW_IRON,B.COAL,I.IRON_INGOT,B.COBBLE],
    gold:[I.RAW_GOLD,I.GOLD_INGOT,B.COAL,I.IRON_INGOT],
    diamond:[I.DIAMOND,I.IRON_INGOT,I.RAW_GOLD,B.COAL]
  }[tier];
  const slots=Array(CHEST_SIZE).fill(null);
  slots[0]={id:gear[Math.floor(roll(2)*gear.length)],qty:1};
  const qty=(id,n)=>Math.min(maxStackFor(id),1+Math.floor(roll(n)*((tier==='diamond')?3:8)));
  for(let n=1;n<=3;n++){
    const id=materials[Math.floor(roll(n+4)*materials.length)];
    slots[n]={id,qty:qty(id,n+10)};
  }
  if(roll(19)>.42){
    const id=roll(20)>.50?I.LEATHER:I.WOOL;
    slots[4]={id,qty:1+Math.floor(roll(21)*5)};
  }
  if(roll(22)>.70)slots[5]={id:I.ARROW,qty:2+Math.floor(roll(23)*8)};
  return slots;
}
function chestSlots(x,y,z){
  const k=chestKey(x,y,z),hadSavedChest=chestContents.has(k);
  let slots=chestContents.get(k);
  if(!slots){slots=Array(CHEST_SIZE).fill(null);chestContents.set(k,slots)}
  // Do not re-roll chests that were already claimed or player-placed.
  // The original village houses (exploration revision 1) had two EMPTY
  // chests before village loot was added. Retrofit these ONCE, preserving
  // items players may already have deposited.
  if(multiRole!=='guest'&&!villageLootGranted.has(k)&&get(x,y,z)===B.CHEST){
    const cx=chunkCoord(x),cz=chunkCoord(z),index=cIndex(localCoord(x),y,localCoord(z));
    if(!editChunks.get(chunkKey(cx,cz))?.has(index)){
      const info=villageWorld().lootChestAt(x,y,z);
      if(info){
        const oldVillage=!villageFurnitureAllowed(info.houseX,info.houseZ);
        if(!hadSavedChest||oldVillage){
          const loot=generateVillageChestLoot(x,y,z);
          for(const item of loot){
            if(!item)continue;
            const vacant=slots.findIndex(existing=>!existing);
            if(vacant!==-1)slots[vacant]=item;
          }
        }
        // A previously opened or emptied chest from a NEW village already
        // had its reward. Claim it without refilling even with older saves.
        villageLootGranted.add(k);
        if(worldReady)markSaveDirty();
      }
    }
  }
  return slots;
}
function serializeChests(){
  // Opened treasure chests may be in unloaded chunks: get() only sees
  // original base terrain there. Removals are handled by set().
  return [...chestContents].map(([k,slots])=>[k,slots.map(st=>st?{...st}:null)]);
}
function restoreChests(raw){
  chestContents.clear();
  if(!Array.isArray(raw))return;
  for(const pair of raw.slice(0,2048)){
    if(!Array.isArray(pair)||pair.length!==2||typeof pair[0]!=='string')continue;
    const xyz=pair[0].split(',').map(Number);
    if(xyz.length===3&&xyz.every(Number.isInteger)&&xyz[1]>=Y_MIN&&xyz[1]<=WORLD_TOP&&
       Math.abs(xyz[0])<1000000&&Math.abs(xyz[2])<1000000)
      chestContents.set(chestKey(...xyz),normalizedChest(pair[1]));
  }
}
function chestCapacity(slots,id){
  return slots.reduce((n,st)=>n+(!st?maxStackFor(id):st.id===id?Math.max(0,maxStackFor(id)-st.qty):0),0);
}
function chestAdd(slots,id,count){
  let remain=Math.max(0,Math.min(64,Math.floor(count))),requested=remain;
  for(const st of slots){
    if(!st||st.id!==id||st.qty>=maxStackFor(id))continue;
    const n=Math.min(remain,maxStackFor(id)-st.qty);st.qty+=n;remain-=n;if(!remain)break;
  }
  while(remain>0){
    const i=slots.findIndex(st=>!st);if(i<0)break;
    const n=Math.min(remain,maxStackFor(id));slots[i]={id,qty:n};remain-=n;
  }
  return requested-remain;
}
function chestTake(slots,index,count){
  const st=slots[index];if(!st)return null;
  const n=Math.min(st.qty,Math.max(0,Math.floor(count)));if(!n)return null;
  const result={id:st.id,qty:n};st.qty-=n;if(!st.qty)slots[index]=null;return result;
}
const chestSpill=(x,y,z)=>chestSlots(x,y,z).filter(Boolean).map(st=>({...st}));
const chestIsOpenAt=(x,y,z)=>chestOpen&&chestLocation?.key===chestKey(x,y,z);
function chestApplyState(x,y,z,raw){
  if(get(x,y,z)!==B.CHEST)return false;
  chestContents.set(chestKey(x,y,z),normalizedChest(raw));
  // Host sent authoritative chest contents: a later host migration must
  // not regenerate the same treasure when an old village was retrofitted.
  const chunk=chunkKey(chunkCoord(x),chunkCoord(z));
  if(!editChunks.get(chunk)?.has(cIndex(localCoord(x),y,localCoord(z)))&&
     villageWorld().lootChestAt(x,y,z))villageLootGranted.add(chestKey(x,y,z));
  markSaveDirty();
  if(chestIsOpenAt(x,y,z))renderChestUI();
  return true;
}

let streamCX=NaN,streamCZ=NaN;
let currentAccount=null,currentWorldSlot=null,worldReady=false,saveInterval=null,saveDirty=false,generatorVersion=5;
let testPanelOpen=false,activeTestTab='items';
let activeMap='overworld'; // The previous game is always The Overworld.
const TESTWORLD_SURFACE_Y=12;
const mapDisplayName=()=>activeMap==='testworld'?'Testworld':'The Overworld';
// Restoring a remembered local session must not depend on Firebase network.
// Cloud writes are permitted only after THIS exact user has a verified
// Firebase session. A legacy/local-only auto-login remains playable offline.
let cloudSessionReady=false;
let multiRole=null,multiHostSlot=null,multiHostId='',multiBusy=false,multiApplying=false,multiMembers={};
const multiGuestRecords=new Map(),multiAvatars=new Map(),multiFriendsOnline=new Map();
let multiLastPose=0,multiLastProfile=0,multiPendingTimer=null,multiClosing=false,multiProfileSaveTimer=null;
let multiOriginName='',multiMigration=null,multiCheckpoint=null,multiRoster=[],multiWorldKind='multi';
let singleWorldMembers={};
let multiLastCheckpoint=0,multiMigrationGeneration=0;
let lastCloudWorldSaveAt=0;
const MULTI_HOST='blockworld_multi_host_v1:',MULTI_MEMBER='blockworld_multi_member_v1:';
const TEST_MULTI_HOST='blockworld_testworld_multi_host_v1:',TEST_MULTI_MEMBER='blockworld_testworld_multi_member_v1:';
const MULTI_HANDOFF='blockworld_multi_handoff_v1:',TEST_MULTI_HANDOFF='blockworld_testworld_multi_handoff_v1:';
const FRIEND_ID='blockworld_friend_id_v1:',FRIENDS_KEY='blockworld_friends_v1:';
const ACCOUNT_REGISTRY_KEY='blockworld_accounts_v1',SESSION_KEY='blockworld_session_v1',SAVE_PREFIX='blockworld_save_v3:',LEGACY_SAVE_PREFIX='blockworld_save_v2:',MAX_WORLDS=5;
const TEST_SAVE_PREFIX='blockworld_testworld_save_v1:';

const inside=(x,y,z)=>y>=Y_MIN&&y<=WORLD_TOP;
const chunkCoord=v=>Math.floor(v/CHUNK);
const localCoord=v=>((v%CHUNK)+CHUNK)%CHUNK;
const chunkKey=(cx,cz)=>cx+','+cz;
const cIndex=(lx,y,lz)=>((y-Y_MIN)*CHUNK+lz)*CHUNK+lx;
// Persistent per-chunk generation history. 0 = legacy/protected terrain;
// 1 = jungle-era terrain. Future biome/structure releases must increment
// this revision and only add that release's content where stamp >= revision.
// Recording is done after finishing a first-time chunk, not when rebuilding.
const FEATURE_REVISION=2,exploredChunkRevisions=new Map();
function chunkHasFeature(cx,cz,revision=FEATURE_REVISION){
  const stamp=exploredChunkRevisions.get(chunkKey(cx,cz));
  return (stamp===undefined?FEATURE_REVISION:stamp)>=revision;
}
function featureAllowed(x,z,revision=FEATURE_REVISION){
  return chunkHasFeature(chunkCoord(x),chunkCoord(z),revision);
}
function registerExploredChunk(cx,cz){
  const k=chunkKey(cx,cz);
  if(exploredChunkRevisions.has(k))return;
  exploredChunkRevisions.set(k,FEATURE_REVISION);
  if(worldReady)markSaveDirty();
}
function restoreExploration(data){
  exploredChunkRevisions.clear();
  if(Array.isArray(data.exploredChunks)){
    for(const row of data.exploredChunks.slice(0,180000)){
      if(!Array.isArray(row)||row.length!==2||typeof row[0]!=='string'||
         !/^-?\d+,-?\d+$/.test(row[0])||!Number.isInteger(row[1]))continue;
      const [cx,cz]=row[0].split(',').map(Number);
      if(!Number.isSafeInteger(cx)||!Number.isSafeInteger(cz)||Math.abs(cx)>100000||Math.abs(cz)>100000)continue;
      exploredChunkRevisions.set(row[0],Math.max(0,Math.min(FEATURE_REVISION,row[1])));
    }
    return;
  }
  // Old saves never recorded which chunks were rendered. Recover the
  // safest available evidence: spawn, last player position, bed and edits.
  // Exclude wide buffers around each to avoid villages/jungle on houses.
  function protect(cx,cz,r){
    for(let dx=-r;dx<=r;dx++)for(let dz=-r;dz<=r;dz++)
      exploredChunkRevisions.set(chunkKey(cx+dx,cz+dz),0);
  }
  for(const point of [data.initialSpawn,data.bedSpawn,data.player]){
    if(point&&Number.isFinite(point.x)&&Number.isFinite(point.z))
      protect(chunkCoord(Math.floor(point.x)),chunkCoord(Math.floor(point.z)),8);
  }
  if(Array.isArray(data.edits)){
    for(const row of data.edits){
      if(!Array.isArray(row)||typeof row[0]!=='string'||!/^-?\d+,-?\d+$/.test(row[0]))continue;
      const [cx,cz]=row[0].split(',').map(Number);
      if(Number.isSafeInteger(cx)&&Number.isSafeInteger(cz)&&Math.abs(cx)<100000&&Math.abs(cz)<100000)
        protect(cx,cz,5);
    }
  }
}
function villageSiteAllowed(x,z,radius){
  // A house of four buildings, paths, or the village plaza may not overlap
  // any protected / previously generated older chunk.
  const minX=chunkCoord(x-radius-2),maxX=chunkCoord(x+radius+2);
  const minZ=chunkCoord(z-radius-2),maxZ=chunkCoord(z+radius+2);
  for(let cx=minX;cx<=maxX;cx++)for(let cz=minZ;cz<=maxZ;cz++)
    if(!chunkHasFeature(cx,cz,1))return false;
  return true;
}
function villageFurnitureAllowed(hx,hz){
  // Both blocks of each bed and all of the house must be newly generated.
  // Never re-furnish buildings already visited before this release.
  for(let cx=chunkCoord(hx-4);cx<=chunkCoord(hx+4);cx++)
    for(let cz=chunkCoord(hz-4);cz<=chunkCoord(hz+4);cz++)
      if(!chunkHasFeature(cx,cz,2))return false;
  return true;
}
const DOOR_ALL=new Set([B.DOOR_X,B.DOOR_X_TOP,B.DOOR_X_OPEN,B.DOOR_X_OPEN_TOP,B.DOOR_Z,B.DOOR_Z_TOP,B.DOOR_Z_OPEN,B.DOOR_Z_OPEN_TOP]);
const DOOR_OPEN=new Set([B.DOOR_X_OPEN,B.DOOR_X_OPEN_TOP,B.DOOR_Z_OPEN,B.DOOR_Z_OPEN_TOP]);
const DOOR_TOP=new Set([B.DOOR_X_TOP,B.DOOR_X_OPEN_TOP,B.DOOR_Z_TOP,B.DOOR_Z_OPEN_TOP]);
const isDoor=id=>DOOR_ALL.has(id);
const NON_COLLIDING_BUILDINGS=new Set([
  ...SLEEPING_BAG_BLOCKS,B.LADDER,B.LADDER_E,B.LADDER_S,B.LADDER_W,
  B.LANTERN,B.CAMPFIRE,
  B.FENCE_GATE_OPEN_N,B.FENCE_GATE_OPEN_E,B.FENCE_GATE_OPEN_S,B.FENCE_GATE_OPEN_W
]);
const solid=id=>id!==B.AIR&&id!==B.WATER&&id!==B.TORCH&&
  !DOOR_OPEN.has(id)&&!NON_COLLIDING_BUILDINGS.has(id);


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
// Firebase is the authenticated source of truth when configured.
// LocalStorage remains a speed/offline cache, not a global account registry.
function verifyLocalPassword(acc,password){
  return passwordHash(password,b64ToBytes(acc.salt))
    .then(hash=>safeEqual(hash,acc.hash));
}
async function setLocalCloudCache(key,name,password){
  const reg=loadAccountRegistry();
  if(reg.accounts[key] && reg.accounts[key].salt && reg.accounts[key].hash){
    if(!(await verifyLocalPassword(reg.accounts[key],password)))
      throw Error('この端末には同じ名前の別アカウントがあります');
  }else{
    const salt=crypto.getRandomValues(new Uint8Array(16));
    reg.accounts[key]={name,salt:bytesToB64(salt),
      hash:await passwordHash(password,salt),createdAt:Date.now()};
    saveAccountRegistry(reg);
  }
}
async function cloudMergeWorlds(uploadLocal=false){
  const remote=await cloudReadAll();
  for(let slot=1;slot<=MAX_WORLDS;slot++){
    const key=saveKeyForAccount(currentAccount.key,slot,'overworld');
    let local=null;
    try{const raw=localStorage.getItem(key);if(raw)local=JSON.parse(raw)}catch{}
    const distant=remote.get(slot);
    const tLocal=Number(local?.savedAt)||0,tRemote=Number(distant?.savedAt)||0;
    if(distant && (tRemote>=tLocal||!local)){
      try{localStorage.setItem(key,JSON.stringify(distant))}
      catch(e){console.warn('Cloud world does not fit local cache',e)}
    }else if(local && (uploadLocal||tLocal>tRemote)){
      await cloudQueueSave(slot,local);
    }
  }
}
async function cloudAuthSubmit(name,password,key,reg,mode){
  let identity;
  if(mode==='create'){
    if(reg.accounts[key]?.hash){
      if(!(await verifyLocalPassword(reg.accounts[key],password)))
        throw Error('同名の端末内アカウントがあります');
    }
    identity=await cloudRegister(name,password);
  }else{
    try{
      identity=await cloudLogin(name,password);
    }catch(e){
      // First sign-in by an existing local user securely registers their
      // established username/password in Firebase and imports old saves.
      // A temporary network/Firestore error must NOT cause a duplicate
      // create attempt or mask the real Firebase problem.
      if(!['auth/invalid-credential','auth/wrong-password','auth/user-not-found'].includes(e.code))
        throw e;
      const old=reg.accounts[key];
      if(!old?.salt||!old?.hash||!(await verifyLocalPassword(old,password)))
        throw e;
      identity=await cloudRegister(name,password);
    }
  }
  try{await setLocalCloudCache(identity.key,identity.name,password)}
  catch(e){await cloudSignOut();throw e}
  currentAccount={key:identity.key,name:identity.name};
  cloudSessionReady=true;
  rememberSession(identity.key);
  setSaveStatus('クラウド同期中…');
  try{await cloudMergeWorlds()}catch(e){
    console.warn('Cloud worlds sync failed',e);
    setSaveStatus('クラウド同期失敗（端末保存は有効）');
  }
  setSaveStatus('ワールド未選択');
  showMapSelection();
}
async function restoreCloudSession(){
  try{
    const identity=await cloudRestore();
    // Existing remembered players can continue straight into their saved
    // worlds. Without a Firebase account the game stays local-only until
    // the player explicitly signs in with their existing password.
    if(!identity){
      if(!currentAccount)authName.focus();
      return;
    }
    if(currentAccount && currentAccount.key!==identity.key){
      // Never silently switch the current local player's identity or
      // upload their saves to a different signed-in Firebase account.
      console.warn('A different cloud account is signed in; local session retained');
      setSaveStatus('端末保存中（クラウドのアカウントが異なります）');
      return;
    }
    const alreadyRestored=!!currentAccount;
    const reg=loadAccountRegistry();
    if(!reg.accounts[identity.key]){
      reg.accounts[identity.key]={name:identity.name,cloud:true,createdAt:Date.now()};
      saveAccountRegistry(reg);
    }
    currentAccount={key:identity.key,name:identity.name};
    cloudSessionReady=true;
    rememberSession(identity.key);
    // An old local session may have entered a world while Firebase booted.
    // Do not reload or discard the in-memory world when auth finishes.
    if(!worldReady){
      try{await cloudMergeWorlds()}
      catch(e){console.warn('Cloud session world sync failed',e)}
      setSaveStatus('ワールド未選択');
    }
    if(!alreadyRestored)showMapSelection();
  }catch(e){
    console.warn('Cloud session restoration failed; using local account',e);
    // Failure to load Firebase must never break legacy auto-login.
    if(!currentAccount){
      if(!restoreSession()){
        authError.textContent='クラウド接続を確認してください。端末内アカウントは保持されています。';
        authName.focus();
      }
    }
  }
}
function restoreSession(){
  try{
    const raw=localStorage.getItem(SESSION_KEY);
    if(!raw)return false;
    const saved=JSON.parse(raw),reg=loadAccountRegistry(),acc=reg.accounts?.[saved?.key];
    if(!acc){clearSession();return false}
    currentAccount={key:saved.key,name:acc.name||saved.key};
    cloudSessionReady=false;
    setSaveStatus(cloudEnabled?'端末保存で自動ログイン':'ワールド未選択');
    showMapSelection();
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
function saveKeyForAccount(key,slot,map=activeMap){return (map==='testworld'?TEST_SAVE_PREFIX:SAVE_PREFIX)+encodeURIComponent(key)+':'+slot}
function migrateLegacySave(key){
  try{
    const legacy=localStorage.getItem(legacySaveKey(key));
    const slot1=localStorage.getItem(saveKeyForAccount(key,1,'overworld'));
    if(legacy&&!slot1)localStorage.setItem(saveKeyForAccount(key,1,'overworld'),legacy);
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
// Torches and lanterns are saved as normal block edits (31/52). Index both
// light emitters so already-placed lanterns start lighting after save/load.
const TORCH_LIGHT_RADIUS=8,TORCH_LIGHT_COUNT=7;
const torchLocations=new Map();
const isLightEmitter=id=>id===B.TORCH||id===B.LANTERN;
const torchCellKey=(x,y,z)=>x+','+y+','+z;
function indexTorchCell(x,y,z,id){
  const key=torchCellKey(x,y,z);
  if(isLightEmitter(id))torchLocations.set(key,{x,y,z,id});
  else torchLocations.delete(key);
}
function rebuildTorchIndex(){
  torchLocations.clear();
  for(const [key,entries] of editChunks){
    const parts=key.split(',').map(Number);
    if(parts.length!==2||!parts.every(Number.isInteger))continue;
    for(const [i,id] of entries){
      if(!isLightEmitter(id)||!Number.isInteger(i)||i<0||i>=CHUNK*HEIGHT*CHUNK)continue;
      const x=parts[0]*CHUNK+(i%CHUNK);
      const z=parts[1]*CHUNK+(Math.floor(i/CHUNK)%CHUNK);
      const y=Y_MIN+Math.floor(i/(CHUNK*CHUNK));
      indexTorchCell(x,y,z,id);
    }
  }
}
function torchProtectsSpawn(x,y,z){
  const r2=TORCH_LIGHT_RADIUS*TORCH_LIGHT_RADIUS;
  for(const t of torchLocations.values()){
    const dx=t.x-x,dy=t.y+.5-y,dz=t.z-z;
    if(dx*dx+dy*dy+dz*dz<=r2)return true;
  }
  return false;
}

function restoreEdits(raw,saveVersion=3){
  editChunks.clear();torchLocations.clear();
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
  rebuildTorchIndex();
}
// Fix doors that were placed in mid-air by older BLOCKWORLD versions.
// Work on the saved edits BEFORE chunks load, so meshes never show their
// obsolete positions. Preserve open/closed state and the original facing.
function repairFloatingDoorsOnLoad(){
  // The host owns shared world edits; guest clients must never rewrite them.
  if(multiRole==='guest')return 0;
  const candidateDoors=[];
  for(const [key,edits] of editChunks){
    const [cx,cz]=key.split(',').map(Number);
    if(!Number.isInteger(cx)||!Number.isInteger(cz))continue;
    for(const [index,id] of edits){
      if(!isDoor(id)||DOOR_TOP.has(id))continue;
      const localX=index%CHUNK,localZ=Math.floor(index/CHUNK)%CHUNK;
      const y=Math.floor(index/(CHUNK*CHUNK))+Y_MIN;
      if(y<Y_MIN+1||y+1>WORLD_TOP)continue;
      candidateDoors.push({x:cx*CHUNK+localX,y,z:cz*CHUNK+localZ,id});
    }
  }
  function editDoorCell(x,y,z,id){
    const key=chunkKey(chunkCoord(x),chunkCoord(z));
    let chunkEdits=editChunks.get(key);
    if(!chunkEdits){chunkEdits=new Map();editChunks.set(key,chunkEdits)}
    const index=cIndex(localCoord(x),y,localCoord(z));
    chunkEdits.set(index,id);
    const chunk=chunks.get(key);
    if(chunk)chunk.data[index]=id;
  }
  let repairs=0;
  for(const {x,y,z,id} of candidateDoors){
    if(get(x,y,z)!==id||get(x,y+1,z)!==id+1)continue;
    if(solid(get(x,y-1,z)))continue; // already standing on a floor
    let newY=null;
    // Don't pass through intermediate walls, roofs or existing buildings.
    // The old bottom/top already occupy y and y+1.
    for(let scan=y-1;scan>=Math.max(Y_MIN+1,y-12);scan--){
      if(get(x,scan,z)!==B.AIR)break;
      if(get(x,scan+1,z)!==B.AIR)continue;
      if(solid(get(x,scan-1,z))){newY=scan;break}
    }
    if(newY===null)continue; // don't destroy unsupported user structures
    editDoorCell(x,y,z,B.AIR);
    editDoorCell(x,y+1,z,B.AIR);
    editDoorCell(x,newY,z,id);
    editDoorCell(x,newY+1,z,id+1);
    repairs++;
  }
  return repairs;
}
function makeSaveData(){
  return {
    version:4,worldSlot:currentWorldSlot,mapType:activeMap,generatorVersion,savedAt:Date.now(),seed:seed>>>0,
    level,xp,weather,dayTime,health,stamina,staminaRunSeconds,staminaRegenSeconds,cameraMode,
    activeJob,jobSelected,
    initialSpawn:initialSpawn?{x:initialSpawn.x,y:initialSpawn.y,z:initialSpawn.z}:null,
    bedSpawn:bedSpawn?{x:bedSpawn.x,y:bedSpawn.y,z:bedSpawn.z}:null,
    inventory:{...inventory},acquiredOrder:[...acquiredOrder],hotbarSlots:[...hotbarSlots],selected,
    inventorySlots:inventorySlots.map(v=>v?{id:v.id,qty:v.qty}:null),selectedHotbarIndex,
    equippedArmor:[...equippedArmor],equippedBackpack,backpackSlots:backpackSlots.map(v=>v?{...v}:null),offhandItem:offhandItem?{...offhandItem}:null,
    worldDrops:serializeWorldDrops(),fires:serializeBurningBlocks(),
    testMobs:activeMap==='testworld'?serializeTestMobs():undefined,
    player:{x:player.pos.x,y:player.pos.y,z:player.pos.z,yaw:player.yaw,pitch:player.pitch},
    edits:serializeEdits(),chests:serializeChests(),villageLootGranted:[...villageLootGranted],
    exploredChunks:[...exploredChunkRevisions],
    saddledHorses:serializeSaddledHorses(),
    summonedChimeras:serializeSummonedChimeras(),
    ridingHorseIndex:ridingHorse?saddledHorsesForSave().indexOf(ridingHorse):-1
  };
}
function saveCurrentGame(showMessage=false){
  if(!currentAccount||!currentWorldSlot||!worldReady)return false;
  const wasDirty=saveDirty;
  try{
    if(multiRole==='guest'){
      const profile=multiProfile();
      localStorage.setItem(multiGuestSaveKey(),JSON.stringify(profile));
      if(multiHostId===multiOwnId()){
        // Recover the original owner's own slot on rejoining a transferred room.
        const restored={...makeSaveData(),members:multiCheckpoint?.world?.members||{},
          originName:multiOriginName||currentAccount.name,worldKind:multiWorldKind};
        const ownerKey=multiWorldKind==='single'
          ?saveKeyForAccount(currentAccount.key,currentWorldSlot):multiWorldKey(currentWorldSlot);
        localStorage.setItem(ownerKey,JSON.stringify(restored));
      }
      if(multiplayerNetwork.connected)multiplayerNetwork.send({t:'profile',profile});
      saveDirty=false;setSaveStatus('マルチ：持ち物保存済み');
      if(showMessage)flash('持ち物を保存しました');
      return true;
    }
    const key=multiRole==='host'
      ?(multiHostId===multiOwnId()
        ?(multiWorldKind==='single'?saveKeyForAccount(currentAccount.key,currentWorldSlot):multiWorldKey(currentWorldSlot))
        :multiHandoffSaveKey(multiHostId,currentWorldSlot))
      :saveKeyForAccount(currentAccount.key,currentWorldSlot);
    const payload=makeSaveData();
    if(multiRole==='host'){
      payload.members=multiMembers;
      payload.originName=multiOriginName||currentAccount.name;
      payload.worldKind=multiWorldKind;
    }else if(!multiRole&&Object.keys(singleWorldMembers).length){
      // Preserve friend's profile without re-parsing the entire world on each
      // autosave, which previously caused brief stalls on large worlds.
      payload.members=singleWorldMembers;
      payload.worldKind='single';
      payload.originName=currentAccount.name;
    }
    localStorage.setItem(key,JSON.stringify(payload));
    if(activeMap==='overworld'&&cloudEnabled&&cloudSessionReady&&!multiRole&&(wasDirty||showMessage||Date.now()-lastCloudWorldSaveAt>120000)){
      lastCloudWorldSaveAt=Date.now();
      const slot=currentWorldSlot;
      void cloudQueueSave(slot,payload).catch(e=>{
        console.warn('Cloud world save failed',e);
        setSaveStatus('端末保存済 / クラウド保存失敗');
      });
    }
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
  activeMap=data.mapType==='testworld'?'testworld':'overworld';
  if(Number.isFinite(data.seed))seed=data.seed>>>0;
  generatorVersion=Math.max(1,Number(data.generatorVersion)||1);
  restoreExploration(data);
  level=Math.max(1,Math.min(150,Number(data.level)||1));xp=Math.max(0,Number(data.xp)||0);
  // Earlier Testworld builds incorrectly allowed LV30/90 specializations
  // from LV1. Repair any already-saved early class on load without touching
  // inventory, player level or other world data.
  const restoredJob=JOBS[data.activeJob]?data.activeJob:'all';
  const restoredRank=JOBS[restoredJob].level;
  activeJob=restoredRank<=level?restoredJob:
    restoredJob==='tank'&&level>=30?'shieldElite':JOBS[restoredJob].group;
  jobSelected=!!(data.jobSelected&&JOBS[data.activeJob]);
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
      if(v&&Number.isFinite(Number(v.id))&&Number(v.qty)>0)inventorySlots[i]={id:migrateOldMeat(v.id),qty:Math.max(1,Math.floor(Number(v.qty)))};
    }
  }else{
    migrateLegacyInventoryToSlots(data);
  }
  selectedHotbarIndex=Number.isInteger(data.selectedHotbarIndex)?Math.max(0,Math.min(8,data.selectedHotbarIndex)):0;
  if(data.selected!=null&&!inventorySlots[selectedHotbarIndex]){
    const oldSelected=Number(data.selected),idx=inventorySlots.findIndex((v,i)=>i<9&&v?.id===oldSelected);
    if(idx>=0)selectedHotbarIndex=idx;
  }
  const previousOffhand=data.offhandItem??data.offhandTorch;
  offhandItem=([I.TORCH,I.SHIELD].includes(Number(previousOffhand?.id))&&Number(previousOffhand.qty)>0)
    ?{id:Number(previousOffhand.id),qty:1}:null;
  shieldGuarding=false;refreshShieldControl();
  syncDerivedInventory();
  normalizeArmor(data.equippedArmor);equippedBackpack=data.equippedBackpack===true;
  backpackSlots.fill(null);
  if(equippedBackpack&&Array.isArray(data.backpackSlots))for(let i=0;i<9;i++){
    const st=data.backpackSlots[i];
    if(st&&Number.isInteger(st.id)&&Object.hasOwn(inventory,st.id)&&Number.isInteger(st.qty)&&st.qty>0)
      backpackSlots[i]={id:st.id,qty:Math.min(64,st.qty)};
  }
  applyArmorAppearance(playerAvatar,equippedArmor);
  restoreEdits(data.edits,Number(data.version)||3);
  const correctedDoors=repairFloatingDoorsOnLoad();
  if(correctedDoors)console.info('BLOCKWORLD: corrected '+correctedDoors+' floating door(s) in saved world.');
  restoreChests(data.chests);
  villageLootGranted.clear();
  if(Array.isArray(data.villageLootGranted)){
    for(const key of data.villageLootGranted.slice(0,12000))
      if(typeof key==='string'&&/^-?\d+,-?\d+,-?\d+$/.test(key))villageLootGranted.add(key);
  }
  restoreSaddledHorses(data);
  restoreSummonedChimeras(data);
  if(activeMap==='testworld')restoreTestMobs(data.testMobs);
  restoreWorldDrops(data.worldDrops);
  restoreBurningBlocks(data.fires);

  if(data.player&&Number.isFinite(data.player.x)&&Number.isFinite(data.player.y)&&Number.isFinite(data.player.z)){
    player.pos.set(data.player.x,data.player.y,data.player.z);
    player.yaw=Number(data.player.y)||0;player.pitch=Number(data.player.pitch)||0;
    // The player may have saved right below an old floating door. Once
    // that door is anchored, move them sideways rather than teleporting
    // them through the house roof in the blocked-spawn recovery loop.
    if(correctedDoors>0&&blocked(player.pos.x,player.pos.y,player.pos.z)){
      for(const [dx,dz] of [[1.1,0],[-1.1,0],[0,1.1],[0,-1.1],[1.1,1.1],[-1.1,1.1],[1.1,-1.1],[-1.1,-1.1]]){
        const nx=player.pos.x+dx,nz=player.pos.z+dz,ny=player.pos.y;
        if(!blocked(nx,ny,nz)&&blocked(nx,ny-.12,nz)){
          player.pos.set(nx,ny,nz);break;
        }
      }
    }
    if(ridingHorse)syncRiderToHorse();
    return true;
  }
  return false;
}
// Optional in-world Chimera MODEL REVIEW. Nothing spawns in regular play.
// Open ?chimeraTest=1, choose a saved world and tap 世界に入る to inspect scale,
// lighting and shape beside your character. No combat, drops, save or AI yet.
const CHIMERA_VISUAL_TEST=new URLSearchParams(location.search).get('chimeraTest')==='1';
let chimeraVisualModel=null,animateChimeraVisual=null;
function removeChimeraVisualTest(){
  if(!chimeraVisualModel)return;
  scene.remove(chimeraVisualModel);
  chimeraVisualModel.traverse(o=>{
    if(!o.isMesh)return;
    o.geometry?.dispose();
    if(o.userData.mobOwnMaterial)o.material?.dispose();
  });
  chimeraVisualModel=null;animateChimeraVisual=null;
}
async function spawnChimeraVisualTest(){
  if(!CHIMERA_VISUAL_TEST||chimeraVisualModel||!worldReady||!started)return;
  const slot=currentWorldSlot;
  try{
    const art=await import('./chimera-sculpt-v4.js?v=20261011sculptIV_rev4');
    if(!worldReady||!started||currentWorldSlot!==slot)return;
    const creature=art.buildChimera(THREE);
    // Place on terrain, ahead of the camera, with the lion head looking
    // toward the player. Prefer broad nearly-flat spaces over steep ledges.
    const fx=-Math.sin(player.yaw),fz=-Math.cos(player.yaw);
    let chosen=null,score=-Infinity;
    for(let j=0;j<16;j++){
      const angle=player.yaw+(j%2===0?1:-1)*Math.floor(j/2)*.34;
      const distance=10+(j%3)*1.0;
      const xx=Math.round(player.pos.x-Math.sin(angle)*distance);
      const zz=Math.round(player.pos.z-Math.cos(angle)*distance);
      const ground=surfaceAt(xx,zz);
      if(ground<=SEA)continue;
      let difference=0;
      for(const [a,b] of [[-2,0],[2,0],[0,-2],[0,2],[-2,-2],[2,2]]){
        difference+=Math.abs(surfaceAt(xx+a,zz+b)-ground);
      }
      const quality=20-difference*2-Math.abs(distance-10);
      if(quality>score){score=quality;chosen={x:xx,z:zz,y:ground}}
    }
    if(!chosen){
      const x=Math.round(player.pos.x+fx*10),z=Math.round(player.pos.z+fz*10);
      chosen={x,z,y:surfaceAt(x,z)};
    }
    creature.position.set(chosen.x,chosen.y+.04,chosen.z);
    const heading=Math.atan2(player.pos.x-chosen.x,player.pos.z-chosen.z);
    creature.rotation.y=heading+Math.PI;
    scene.add(creature);
    chimeraVisualModel=creature;animateChimeraVisual=art.animateChimera;
    flash('キメラの3D外観確認モデルを表示（戦闘・ドロップなし）');
  }catch(err){
    console.warn('Chimera model test could not load',err);
    flash('キメラ3Dモデルの読み込みに失敗しました');
  }
}
function resetWorldRuntime(){
  closeExplorerMap(false);closeBinoculars();
  testPanelOpen=false;$('testWorldPanel').classList.remove('open');
  $('testWorldPanel').setAttribute('aria-hidden','true');$('testWorldOpen').hidden=true;
  multiSleepReset();
  removeChimeraVisualTest();
  ridingHorse=null;
  resetSprint();
  chatReset();
  playerHurtAt=-Infinity;playerHurtUntil=0;playerHurtSeq=0;
  playerKnockbackX=0;playerKnockbackZ=0;playerKnockbackTime=0;
  damageScreenTint.style.opacity='0';
  setAvatarDamageFlash(playerAvatar,false);
  cameraMode=0;updateViewLabel();playerAvatar.visible=false;
  activeJob='all';jobSelected=false;setJobOpen(false);
  equippedArmor.fill(null);equippedBackpack=false;backpackSlots.fill(null);offhandItem=null;shieldGuarding=false;refreshShieldControl();applyArmorAppearance(playerAvatar,equippedArmor);
  clearFlyingArrows();selectedArrowAmmo=I.ARROW;gliderActive=false;
  while(thrownKnives.length){const shot=thrownKnives.pop();scene.remove(shot.model)}
  while(activeFlames.length){const f=activeFlames.pop();scene.remove(f.group)}
  burningBlocks.clear();fireUpdateAccumulator=0;
  stamina=MAX_STAMINA;staminaRunSeconds=0;staminaRegenSeconds=0;
  started=false;craftOpen=false;inventoryOpen=false;crafting.classList.remove('open');inventoryScreen.classList.remove('open');primaryActionStop();
  for(const c of chunks.values())removeChunkMeshes(c);
  meshes=[];lookup.clear();pendingChunkLoads.length=0;pendingChunkJob=null;dirtyMeshKeys.clear();
  for(let i=mobs.length-1;i>=0;i--){
    const m=mobs[i];
    removeZombie(m);
  }
  chimeraSummonPending=null;
  mobs.length=0;passiveSpawnCooldown=20;zombieSpawnCooldown=1;spiderSpawnCooldown=10;nightZombieWaveStarted=false;
  cachedVillageWorld=null;cachedVillageSeed=null;cachedVillageGenerator=null;
  villagerSpawnCooldown=3;villageCitizenLastSpawn.clear();villageGuardianLastSpawn.clear();
  multiLastMobSync=0;multiMobSeq=0;multiAppliedMobSeq=-1;
  clearWorldDrops();chestContents.clear();villageLootGranted.clear();chestOpen=false;chestLocation=null;chestPending=null;
  $('chestScreen').classList.remove('open');
  chunks.clear();exploredChunkRevisions.clear();torchLocations.clear();clearTorchLights();streamCX=NaN;streamCZ=NaN;player.vel.set(0,0,0);player.onGround=false;
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
  singleWorldMembers=save?.members&&typeof save.members==='object'?{...save.members}:{};
  let hasSavedPos=false;
  if(save)hasSavedPos=applySaveData(save);
  else{
    seed=freshSeed();generatorVersion=6;level=1;xp=0;activeJob='all';jobSelected=false;weather='clear';dayTime=.24;selected=null;
    stamina=MAX_STAMINA;staminaRunSeconds=0;staminaRegenSeconds=0;
    health=MAX_HEALTH;dead=false;fallOriginY=null;initialSpawn=null;bedSpawn=null;healthRegenTimer=0;
    clearInventorySlots();selectedHotbarIndex=0;inventorySelectedSlot=null;offhandItem=null;shieldGuarding=false;refreshShieldControl();syncDerivedInventory();
    editChunks.clear();exploredChunkRevisions.clear();torchLocations.clear();chestContents.clear();clearWorldDrops();
  }
  await new Promise(r=>setTimeout(r,30));
  ensureInitialSpawn();
  if(!hasSavedPos)spawn();
  loading.textContent='周辺チャンクを生成中...';await new Promise(r=>setTimeout(r,30));
  streamChunks(true);
  for(let i=0;i<12&&blocked(player.pos.x,player.pos.y,player.pos.z);i++)player.pos.y+=1;
  rain.visible=weather==='rain';weatherEl.textContent=weather==='rain'?'Rain':'Clear';
  accountNameEl.textContent=currentAccount.name+' · '+mapDisplayName()+' · W'+slot+' · GEN'+generatorVersion;
  $('testWorldOpen').hidden=true; // Appear only after actually entering Testworld.
  renderHotbar();updateProgress();renderHealth();renderStamina();updateViewLabel();
  loading.textContent=save?mapDisplayName()+' WORLD '+slot+'を復元しました':mapDisplayName()+' WORLD '+slot+'を作成しました';
  worldReady=true;saveDirty=false;saveCurrentGame(false);
  if(activeMap==='overworld'&&cloudEnabled&&cloudSessionReady&&!save){
    // New worlds need an initial cloud snapshot even without edits yet.
    void cloudQueueSave(slot,makeSaveData()).catch(e=>
      console.warn('Initial cloud world save failed',e));
  }
  clearInterval(saveInterval);saveInterval=setInterval(()=>saveCurrentGame(false),20000);
}
function formatSavedAt(ms){
  if(!Number.isFinite(ms))return '保存日時不明';
  const d=new Date(ms),mo=d.getMonth()+1,da=d.getDate(),hh=String(d.getHours()).padStart(2,'0'),mm=String(d.getMinutes()).padStart(2,'0');
  return mo+'/'+da+' '+hh+':'+mm;
}
function renderWorldSelection(){
  if(!currentAccount)return;
  if(activeMap==='overworld')migrateLegacySave(currentAccount.key);
  $('worldMapHeading').textContent=mapDisplayName();
  $('worldMapDescription').textContent=activeMap==='testworld'
    ?'Testworld専用のセーブ（最大5個）。石だけの平坦なテストマップです。'
    :'従来のセーブ（最大5個）。既存ワールドはそのまま残ります。';
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
    }else meta.textContent='空きスロット · 新規はGEN6';
    info.appendChild(meta);

    const actions=document.createElement('div');actions.className='world-slot-actions';
    const play=document.createElement('button');play.type='button';play.textContent=save?'続きから':'新しく作る';
    play.addEventListener('click',()=>initializeAccountWorld(save,slot));actions.appendChild(play);
    const share=document.createElement('button');share.type='button';
    share.className='share-world';share.textContent='フレンドと遊ぶ';
    share.addEventListener('click',()=>multiHostSingleWorld(slot,save));
    actions.appendChild(share);
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
function showMapSelection(){
  if(!currentAccount)return;
  if(multiRole)multiLeave(true);
  if(worldReady){
    saveCurrentGame(false);
    clearInterval(saveInterval);saveInterval=null;
    resetWorldRuntime();worldReady=false;currentWorldSlot=null;
  }
  authCover.style.display='none';cover.style.display='none';
  accountBox.style.display='none';worldCover.style.display='none';menuCover.style.display='none';
  $('multiCover').style.display='none';
  $('mapAccountName').textContent=currentAccount.name;
  mapCover.style.display='flex';
  document.exitPointerLock?.();
  multiStartPresence();
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
  worldCover.style.display='none';mapCover.style.display='none';menuAccountName.textContent=currentAccount.name;
  $('menuMapName').textContent=mapDisplayName();
  menuCover.style.display='flex';
  document.exitPointerLock?.();
  multiStartPresence();
}
function showWorldSelection(){
  if(!currentAccount)return;
  if(worldReady)saveCurrentGame(false);
  clearInterval(saveInterval);saveInterval=null;
  resetWorldRuntime();worldReady=false;currentWorldSlot=null;
  chatReset();
  cover.style.display='none';accountBox.style.display='none';menuCover.style.display='none';mapCover.style.display='none';worldCover.style.display='flex';
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
    if(cloudEnabled){
      await cloudAuthSubmit(name,password,key,reg,mode);
      authPassword.value='';
      return;
    }
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
    showMapSelection();
  }catch(err){
    authError.textContent=cloudEnabled
      ?(err?.message||'クラウドログインに失敗しました')
      :'アカウント処理に失敗しました';
    console.warn?.('auth failed',err);
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
  // GEN6 reserves deserts and swamps for other maps: tiny rare pockets only.
  // Existing GEN4/GEN5 worlds retain their original base geography.
  if(generatorVersion>=6){
    if(mountain>.60)return c.temp<-.06?4:3;
    if(c.moist>.57&&c.continental<.16&&c.macro>.45)return 5;
    if(c.temp>.38&&c.moist<-.22&&c.macro>.45)return 2;
    if(c.temp<-.28)return 3;
    return c.moist>.08?1:0;
  }
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
  // Vast warm, humid patches form a distinct JUNGLE region, without
  // introducing extra desert/swamp geography into the Overworld.
  // The underlying ground height stays exactly the original V4 height.
  // A chunk visited before the jungle release keeps its old V4 biome.
  if(generatorVersion>=4&&featureAllowed(x,z,1)&&!river&&!lake&&
     (bio===0||bio===1)&&h>SEA+2&&p.rugged<.53&&
     p.temp>-.18&&p.moist>-.12){
    const regionalRain=fbm(p.X*.0038+104,p.Z*.0038-67,8811,4);
    if(regionalRain>.14)bio=8;
  }
  return {h,bio,river:river||lake,riverBank,rugged:p.rugged,temp:p.temp,moist:p.moist,lake};
}

function terrainProfile(x,z){
  if(generatorVersion>=4)return terrainProfileV4(x,z);
  if(generatorVersion>=3)return terrainProfileV3(x,z);
  if(generatorVersion>=2)return terrainProfileV2(x,z);
  return terrainProfileV1(x,z);
}
function columnInfo(x,z){
  if(activeMap==='testworld')return {h:TESTWORLD_SURFACE_Y,bio:0,river:false,riverBank:false,rugged:0,temp:0,moist:0,lake:false};
  if(generatorVersion>=4)return columnInfoV4(x,z);
  if(generatorVersion>=3)return columnInfoV3(x,z);
  if(generatorVersion>=2)return columnInfoV2(x,z);
  return columnInfoV1(x,z);
}
const surfaceAt=(x,z)=>columnInfo(x,z).h;
const biomeAt=(x,z)=>columnInfo(x,z).bio;

function blockFromInfo(x,y,z,info){
  if(activeMap==='testworld'){
    if(y<Y_MIN||y>WORLD_TOP)return B.AIR;
    if(y===Y_MIN)return B.BEDROCK;
    return y<=TESTWORLD_SURFACE_Y?B.STONE:B.AIR;
  }
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
    if(y<=-56&&r>.9953333333333333)id=B.DIAMOND;
    else if(y<=-25&&r>.9913333333333333)id=B.GOLD;
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
  // Jungle has its own taller trees. Do not generate standard forest trees.
  if(info.bio===8)return false;
  // V4 keeps forests readable: clumps exist, but there are large gaps and plains are genuinely open.
  if(info.bio===1)return cluster>-.08&&naturalScatterRoot(x,z,3,721,.36);
  if(info.bio===3)return cluster>-.15&&naturalScatterRoot(x,z,3,731,.32);
  if(info.bio===0)return cluster>.60&&naturalScatterRoot(x,z,5,741,.48);
  if(info.bio===5)return cluster>.24&&naturalScatterRoot(x,z,4,751,.40);
  return false;
}
function isJungleTreeRoot(x,z,info){
  if(info.bio!==8||info.h<=SEA+2||info.river||info.riverBank||info.rugged>.56)return false;
  // Dense but separated emergent trees; broad continuous jungle regions.
  return naturalScatterRoot(x,z,3,8817,.26);
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
  if(activeMap==='testworld'){
    // Stone in every horizontal direction; no trees, ores, caves, villages or structures.
    // The usual edit overlay still supports building, mining and saving.
    const layer=CHUNK*CHUNK;
    data.fill(B.BEDROCK,0,layer);
    data.fill(B.STONE,layer,(TESTWORLD_SURFACE_Y-Y_MIN+1)*layer);
    const edits=editChunks.get(chunkKey(cx,cz));
    if(edits)for(const [i,v] of edits)data[i]=v;
    yield;
    return {cx,cz,data};
  }
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

  // Tall jungle canopy with clustered leaves, branches and hanging vines.
  // Roots scan a 4-block margin so crowns continue across chunk edges.
  // Never spill new vegetation back into a protected legacy chunk.
  if(chunkHasFeature(cx,cz,1)){
    for(let x=x0-4;x<x0+CHUNK+4;x++)for(let z=z0-4;z<z0+CHUNK+4;z++){
      const info=getInfo(x,z),h=info.h;
      if(!isJungleTreeRoot(x,z,info))continue;
      const tall=8+Math.floor(hash2(x,z,seed+8821)*5);
      for(let y=1;y<=tall;y++)writeGenerated(data,cx,cz,x,h+y,z,B.LOG);
      for(const side of [-1,1]){
        const branchY=h+tall-2;
        if(hash2(x+side,z,seed+8825)>.24){
          writeGenerated(data,cx,cz,x+side,branchY,z,B.LOG);
          writeGenerated(data,cx,cz,x+side*2,branchY,z,B.LEAF);
        }
      }
      for(let dy=-3;dy<=2;dy++){
        const radius=dy>=1?2:dy===-3?2:3;
        for(let dx=-radius;dx<=radius;dx++)for(let dz=-radius;dz<=radius;dz++){
          const dist=dx*dx+dz*dz,rr=radius*radius;
          if(dist>rr+2||hash3(x+dx,h+tall+dy,z+dz,seed+8827)<.20)continue;
          const tx=x+dx,ty=h+tall+dy,tz=z+dz;
          if(chunkCoord(tx)!==cx||chunkCoord(tz)!==cz||!inside(tx,ty,tz))continue;
          const i=cIndex(localCoord(tx),ty,localCoord(tz));
          if(data[i]===B.AIR)data[i]=B.LEAF;
          // Natural hanging foliage (vines without new block IDs).
          if(dy===-2&&dist>=4&&hash3(tx,ty,tz,seed+8833)>.79){
            for(let down=1;down<=2;down++){
              const j=cIndex(localCoord(tx),ty-down,localCoord(tz));
              if(inside(tx,ty-down,tz)&&data[j]===B.AIR)data[j]=B.LEAF;
            }
          }
        }
      }
    }
  }

  // Settlements respect player construction: world edits are applied LAST.
  villageWorld().decorate(data,cx,cz);
  const edits=editChunks.get(chunkKey(cx,cz));
  if(edits)for(const [i,v] of edits)data[i]=v;
  return {cx,cz,data};
}
let cachedVillageWorld=null,cachedVillageSeed=null,cachedVillageGenerator=null;
function villageWorld(){
  if(!cachedVillageWorld||cachedVillageSeed!==seed||cachedVillageGenerator!==generatorVersion){
    cachedVillageSeed=seed;cachedVillageGenerator=generatorVersion;
    cachedVillageWorld=createVillageSystem({seed,surfaceAt,biomeAt,B,SEA,
      WORLD_TOP,CHUNK,Y_MIN,cIndex,chunkCoord,canPlaceVillage:villageSiteAllowed,
      canPlaceFurniture:villageFurnitureAllowed});
  }
  return cachedVillageWorld;
}
function generateChunk(cx,cz){
  const iter=generateChunkSteps(cx,cz);
  let n=iter.next();while(!n.done)n=iter.next();
  return n.value;
}
function ensureChunk(cx,cz){
  const k=chunkKey(cx,cz);
  let c=chunks.get(k);
  if(!c){c=generateChunk(cx,cz);chunks.set(k,c);registerExploredChunk(cx,cz)}
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
  const before=c.data[i];
  if(before===B.CHEST&&v!==B.CHEST){
    chestContents.delete(chestKey(x,y,z));
    if(chestIsOpenAt(x,y,z))setChestOpen(false);
  }
  c.data[i]=v;
  // Player chests must be empty even when replacing a village treasure.
  if(v===B.CHEST&&!chestContents.has(chestKey(x,y,z)))
    chestContents.set(chestKey(x,y,z),Array(CHEST_SIZE).fill(null));
  const k=chunkKey(cx,cz);
  let edits=editChunks.get(k);
  if(!edits){edits=new Map();editChunks.set(k,edits)}
  edits.set(i,v);
  if(isLightEmitter(v)||torchLocations.has(torchCellKey(x,y,z)))indexTorchCell(x,y,z,v);
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
        chunks.set(k,next.value);registerExploredChunk(job.cx,job.cz);queueMeshNear(job.cx,job.cz);
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
// Replace flat plain colors with dedicated pixel materials and true 3D shapes.
const detailedBlockModels=createBuildingBlockModels(THREE,B);
const newBlockMaterials=detailedBlockModels.materials;
const M={...newBlockMaterials,[B.WARP_WORKBENCH_X]:stone,[B.WARP_WORKBENCH_X_END]:stone,[B.WARP_WORKBENCH_Z]:stone,[B.WARP_WORKBENCH_Z_END]:stone,[B.BOSS_ARENA_CORE]:stone,[B.BOSS_WARP_DEVICE]:stone,[B.BOSS_WARP_PART]:stone,[B.GRASS]:[grassSide,grassSide,grass,dirt,grassSide,grassSide],[B.DIRT]:dirt,[B.STONE]:stone,[B.SAND]:sand,[B.WATER]:water,[B.LOG]:log,[B.LEAF]:leaf,[B.COAL]:L(T.coal),[B.IRON]:L(T.iron),[B.GOLD]:L(T.gold),[B.DIAMOND]:L(T.diamond),[B.SNOW]:L(T.snow),[B.GRAVEL]:L(T.gravel),[B.CACTUS]:L(T.cactus),[B.PLANK]:L(T.plank),[B.COBBLE]:L(T.cobble),[B.GLASS]:glass,[B.BEDROCK]:L(T.bedrock),[B.CRAFTING_TABLE]:L(T.craft),[B.FURNACE]:L(T.furnace),[B.BED]:bedFootMaterials,[B.BED_HEAD]:bedHeadMaterials};
const box=new THREE.BoxGeometry(1,1,1),bedBox=new THREE.BoxGeometry(1,.5,1);
const doorBox=new THREE.BoxGeometry(.92,.998,.14);
function doorTexture(top){
  const canvas=document.createElement('canvas');canvas.width=16;canvas.height=16;
  const g=canvas.getContext('2d');
  g.fillStyle='#a36d3a';g.fillRect(0,0,16,16);
  g.fillStyle='#5a371f';g.fillRect(0,0,2,16);g.fillRect(14,0,2,16);
  g.fillRect(0,0,16,2);g.fillRect(0,14,16,2);
  if(top){
    g.fillStyle='#3d281b';g.fillRect(3,3,10,10);
    g.fillStyle='#83bac7';g.fillRect(4,4,8,8);
    g.fillStyle='#a8d5df';g.fillRect(5,4,2,4);g.fillRect(9,8,2,3);
    g.fillStyle='#543925';g.fillRect(7,4,2,8);
  }else{
    g.fillStyle='#82532e';g.fillRect(3,3,10,11);
    g.fillStyle='#c58b51';g.fillRect(4,4,8,9);
    g.fillStyle='#8d5c33';g.fillRect(7,4,2,9);
    g.fillStyle='#efcb69';g.fillRect(11,6,2,3);
  }
  const texture=new THREE.CanvasTexture(canvas);
  texture.magFilter=THREE.NearestFilter;texture.minFilter=THREE.NearestFilter;
  texture.colorSpace=THREE.SRGBColorSpace;return texture;
}
const doorTopMat=L(doorTexture(true)),doorBottomMat=L(doorTexture(false));
const doorSideMat=L(T.plank);
// BoxGeometry material order is right, left, top, bottom, front, back.
// Only the broad front/back faces have a window/handle. Do not print the
// whole door onto its narrow edge (previously looked like a third door).
const doorFaceTop=[doorSideMat,doorSideMat,doorSideMat,doorSideMat,doorTopMat,doorTopMat];
const doorFaceBottom=[doorSideMat,doorSideMat,doorSideMat,doorSideMat,doorBottomMat,doorBottomMat];
for(const id of DOOR_ALL)M[id]=DOOR_TOP.has(id)?doorFaceTop:doorFaceBottom;
// Chest lid seam, inset wooden panels and a silver-gold front latch.
function chestTexture(part){
  const canvas=document.createElement('canvas');canvas.width=16;canvas.height=16;
  const g=canvas.getContext('2d');
  g.fillStyle='#a66e35';g.fillRect(0,0,16,16);
  g.fillStyle='#3e2819';g.fillRect(0,0,16,2);g.fillRect(0,14,16,2);
  g.fillRect(0,0,2,16);g.fillRect(14,0,2,16);
  g.fillStyle='#c18c52';g.fillRect(2,2,12,2);
  g.fillStyle='#70451f';g.fillRect(2,5,12,1);g.fillRect(2,10,12,1);
  g.fillStyle='#d6a166';g.fillRect(3,3,10,1);g.fillRect(3,7,10,1);
  g.fillStyle='#865428';g.fillRect(3,11,10,2);
  if(part==='front'){
    g.fillStyle='#3d331c';g.fillRect(6,4,5,8);
    g.fillStyle='#d2c181';g.fillRect(7,4,3,7);
    g.fillStyle='#fff1ac';g.fillRect(8,5,1,3);
    g.fillStyle='#695026';g.fillRect(8,9,1,2);
  }else if(part==='top'){
    g.fillStyle='#704721';g.fillRect(3,3,10,10);
    g.fillStyle='#cc9858';g.fillRect(4,4,8,8);
    g.fillStyle='#e2b577';g.fillRect(5,5,6,1);
  }else if(part==='bottom'){
    g.fillStyle='#604022';g.fillRect(2,2,12,12);
  }
  const t=new THREE.CanvasTexture(canvas);t.magFilter=THREE.NearestFilter;
  t.minFilter=THREE.NearestFilter;t.colorSpace=THREE.SRGBColorSpace;return t;
}
const chestBox=new THREE.BoxGeometry(.90,.88,.90);
const chestSideMat=L(chestTexture('side')),chestTopMat=L(chestTexture('top'));
const chestFrontMat=L(chestTexture('front')),chestBottomMat=L(chestTexture('bottom'));
M[B.CHEST]=[chestSideMat,chestSideMat,chestTopMat,chestBottomMat,chestFrontMat,chestSideMat];

// Lightweight 3D torch: narrow wooden stem and two emissive flame voxels.
const torchStemGeometry=new THREE.BoxGeometry(.14,.55,.14);
const torchFlameGeometry=new THREE.BoxGeometry(.19,.20,.19);
const torchTipGeometry=new THREE.BoxGeometry(.105,.14,.105);
const torchStemMaterial=new THREE.MeshLambertMaterial({color:0x916132});
const torchFlameMaterial=new THREE.MeshBasicMaterial({color:0xffa629,toneMapped:false});
const torchTipMaterial=new THREE.MeshBasicMaterial({color:0xffeaa5,toneMapped:false});
M[B.TORCH]=torchStemMaterial;
function buildTorchMeshes(p,sceneChunk,built){
  const pieces=[
    [torchStemGeometry,torchStemMaterial,-.17],
    [torchFlameGeometry,torchFlameMaterial,.16],
    [torchTipGeometry,torchTipMaterial,.26]
  ];
  const dummy=new THREE.Object3D();
  for(const [geo,material,offset] of pieces){
    const mesh=new THREE.InstancedMesh(geo,material,p.length);
    mesh.userData.id=B.TORCH;
    mesh.castShadow=false;mesh.receiveShadow=false;
    for(let i=0;i<p.length;i++){
      const t=p[i];
      dummy.position.set(t.x,t.y+offset,t.z);dummy.rotation.set(0,0,0);
      dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);
    }
    scene.add(mesh);meshes.push(mesh);lookup.set(mesh.uuid,p);built.push(mesh);
  }
}
// Pool real point lights for torches AND lanterns instead of making a GPU
// light for every block. Meshes also glow via their unlit flame/glass material.
const torchLights=Array.from({length:TORCH_LIGHT_COUNT},()=>{
  const light=new THREE.PointLight(0xffb76a,24,TORCH_LIGHT_RADIUS+1,1.25);
  light.castShadow=false;light.visible=false;scene.add(light);return light;
});
let lastTorchLightUpdate=0;
function clearTorchLights(){
  for(const light of torchLights)light.visible=false;
  lastTorchLightUpdate=0;
}
function updateTorchLights(now){
  if(now-lastTorchLightUpdate<300)return;
  lastTorchLightUpdate=now;
  const eligible=[];
  for(const t of torchLocations.values()){
    const dx=t.x-player.pos.x,dy=t.y-player.pos.y,dz=t.z-player.pos.z;
    const d2=dx*dx+dy*dy+dz*dz;
    if(d2>25*25)continue;
    eligible.push({t,d2});
  }
  eligible.sort((a,b)=>a.d2-b.d2);
  for(let i=0;i<torchLights.length;i++){
    const light=torchLights[i],match=eligible[i];
    light.visible=!!match;
    if(match){
      const lantern=match.t.id===B.LANTERN;
      light.color.setHex(lantern?0xffdfa0:0xffb76a);
      light.intensity=lantern?30:24;
      light.position.set(match.t.x,match.t.y+(lantern?-.08:.32),match.t.z);
    }
  }
}
const warpWorkbenchVisual=createWarpWorkbenchModel(THREE);
const bossArenaVisual=createBossArenaModel(THREE);
const bossWarpVisual=createBossWarpDeviceModel(THREE);
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
    const x=x0+lx,z=z0+lz;
    // Door panels are THIN, unlike opaque terrain blocks. Both lower and
    // upper halves MUST render even inside a tight wood/stone doorway.
    // Previous terrain face-culling hid the bottom half when enclosed, so
    // it looked like the door was floating. Opening the door accidentally
    // made both halves render because the open IDs were treated as air.
    let visible=isDoor(id)||id===B.TORCH||id===B.CHEST||isWarpWorkbench(id)||id===B.BOSS_ARENA_CORE||isBossWarp(id)||detailedBlockModels.custom.has(id);
    if(!visible)for(const [dx,dy,dz] of neighborVectors){
      const nx=lx+dx,ny=y+dy,nz=lz+dz;
      const b=(nx>=0&&nx<CHUNK&&nz>=0&&nz<CHUNK&&ny>=Y_MIN&&ny<=WORLD_TOP)
        ?data[cIndex(nx,ny,nz)]:getLoaded(x+dx,ny,z+dz);
      // Doors leave visible space beside their thin panel: render the
      // neighbouring wall, floor and ceiling faces too.
      if(id===B.WATER?b!==B.WATER:
         b===B.AIR||b===B.WATER||b===B.GLASS||isDoor(b)||b===B.TORCH||b===B.CHEST||isWarpWorkbench(b)||b===B.BOSS_ARENA_CORE||isBossWarp(b)||detailedBlockModels.custom.has(b)){visible=true;break}
    }
    if(visible)groups[id].push({x,y,z});
  }
  const dummy=new THREE.Object3D(),built=[];
  for(const key in groups){
    const id=+key,p=groups[id];if(!p.length)continue;
    if(id===B.TORCH){buildTorchMeshes(p,c,built);continue}
    if(id===B.WARP_WORKBENCH_X||id===B.WARP_WORKBENCH_Z){
      warpWorkbenchVisual.build(p,id===B.WARP_WORKBENCH_Z,scene,meshes,lookup,built,id);
      continue;
    }
    if(id===B.WARP_WORKBENCH_X_END||id===B.WARP_WORKBENCH_Z_END)continue;
    if(id===B.BOSS_WARP_DEVICE){bossWarpVisual.build(p,scene,meshes,lookup,built,id);continue;}
    if(id===B.BOSS_WARP_PART)continue;
    if(id===B.BOSS_ARENA_CORE){
      bossArenaVisual.build(p,scene,meshes,lookup,built,id);
      continue;
    }
    if(detailedBlockModels.custom.has(id)){
      detailedBlockModels.build(id,p,scene,meshes,lookup,built,getLoaded);
      continue;
    }
    const geo=id===B.CHEST?chestBox:isDoor(id)?doorBox:(id===B.BED||id===B.BED_HEAD)?bedBox:box;
    const m=new THREE.InstancedMesh(geo,M[id],p.length);
    m.userData.id=id;
    // Shadows are expensive on mobile. Nearby terrain keeps its shadows.
    m.castShadow=id!==B.WATER&&id!==B.GLASS&&Math.abs(c.cx-streamCX)<=1&&Math.abs(c.cz-streamCZ)<=1;
    m.receiveShadow=id!==B.WATER;
    p.forEach((v,i)=>{
      dummy.rotation.set(0,0,0);
      if(isDoor(id)){
        const alongZ=id>=B.DOOR_Z,open=DOOR_OPEN.has(id);
        dummy.rotation.y=alongZ?Math.PI/2:0;
        if(open){
          // Rotate around the left jamb rather than spinning around the
          // panel's center and shifting into the doorway.
          dummy.rotation.y=alongZ?0:Math.PI/2;
          dummy.position.set(v.x+(alongZ?.46:-.46),v.y,v.z+(alongZ?-.46:.46));
        }else dummy.position.set(v.x,v.y,v.z);
      }else dummy.position.set(v.x,id===B.CHEST?v.y-.06:(id===B.BED||id===B.BED_HEAD)?v.y-.25:v.y,v.z);
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

const newMobModels=createNewMobModels(THREE);
const villagerModels=createVillagerModels(THREE);
const NEW_WILD_TYPES=new Set(['deer','wolf','bear','boar','eagle','crocodile','shark','elephant']);
const NEW_MOB_TYPES=new Set([...NEW_WILD_TYPES,'spider','golem']);
const NEW_MOB_STATS={
  deer:{name:'シカ',hp:12,xp:20,speed:.54,height:3.73,kind:'passive'},
  wolf:{name:'オオカミ',hp:20,xp:32,speed:.62,height:2.07,kind:'predator',damage:2},
  bear:{name:'ヒグマ',hp:50,xp:75,speed:.38,height:2.59,kind:'predator',damage:5},
  boar:{name:'イノシシ',hp:24,xp:31,speed:.57,height:1.88,kind:'predator',damage:3},
  spider:{name:'巨大クモ',hp:16,xp:29,speed:2.1,height:1.42,kind:'night',damage:2},
  golem:{name:'ストーンゴーレム',hp:120,xp:0,speed:.85,height:3.6,kind:'neutral',damage:7},
  eagle:{name:'ワシ',hp:14,xp:36,speed:2.7,height:2.35,kind:'flying'},
  crocodile:{name:'ワニ',hp:36,xp:58,speed:.30,height:1.38,kind:'predator',damage:4},
  shark:{name:'サメ',hp:32,xp:58,speed:1.7,height:1.89,kind:'swimming',damage:4},
  elephant:{name:'ゾウ',hp:80,xp:105,speed:.22,height:3.50,kind:'predator',damage:6}
};
// Village guardian golems spawn only beside generated villages (never as wildlife).
const mobs=[];
function ensureMobId(m){
  if(!m.userData.netId)m.userData.netId=crypto.randomUUID();
  return m.userData.netId;
}
let ridingHorse=null; // Only saddled horses persist. Unridden horses stay at their chosen spot.
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


// Expanded wildlife. All models face local -Z and use the same blocky
// primitives as cows, pigs and sheep. No texture downloads are required.
function createMobLegs(g,positions,color,hoof,thickness,height){
  const legs=[];
  for(const [x,z] of positions){
    const pivot=new THREE.Group();pivot.position.set(x,.91,z);
    cube(pivot,thickness,height,thickness*1.08,color,0,-height*.49,0);
    cube(pivot,thickness+.065,.18,thickness*1.26,hoof,0,-height+.075,-.045);
    g.add(pivot);legs.push(pivot);
  }
  g.userData.walkLegs=legs;
}
function buildHorse(){
  const g=new THREE.Group();
  // Lean riding-sized horse: long back, tapered forward neck, narrow muzzle,
  // side-facing eyes and properly long hooved legs. < 1 block shoulder width.
  const coat=0x93572f,chestnut=0xaa6b3a,highlight=0xb67b45;
  const shade=0x78462a,cream=0xcfaa86,muzzle=0xb58d6a;
  const mane=0x30241e,maneShade=0x483028,hooves=0x282522,eye=0x151311;
  cube(g,.88,.74,1.90,coat,0,1.50,.14);
  cube(g,.82,.14,1.78,chestnut,0,1.90,.13);
  cube(g,.83,.64,.59,highlight,0,1.48,.76);
  cube(g,.85,.75,.56,chestnut,0,1.53,-.56);
  cube(g,.72,.13,1.50,shade,0,1.17,.12);
  cube(g,.56,.19,.76,chestnut,0,1.97,-.43);
  cube(g,.44,1.02,.49,coat,0,2.08,-.80,-.34);
  cube(g,.37,.72,.40,chestnut,0,2.26,-1.04,-.29);
  cube(g,.47,.42,.64,chestnut,0,2.46,-1.37,.13);
  cube(g,.42,.23,.45,muzzle,0,2.29,-1.79,.14);
  cube(g,.40,.12,.34,cream,0,2.18,-1.80,.05);
  cube(g,.41,.07,.29,shade,0,2.12,-1.82);
  for(const sign of [-1,1]){
    const x=sign*.17;
    cube(g,.14,.29,.18,coat,x,2.79,-1.14,0,0,sign*-.10);
    cube(g,.07,.18,.14,muzzle,x,2.82,-1.25);
    cube(g,.065,.12,.12,shade,sign*.24,2.52,-1.42);
    cube(g,.044,.078,.082,eye,sign*.279,2.53,-1.43);
    cube(g,.034,.042,.037,eye,sign*.13,2.33,-2.015);
  }
  // Short dark mane along the sloping back of the neck.
  cube(g,.43,.15,.25,mane,0,2.72,-1.21);
  for(let i=0;i<6;i++)
    cube(g,.46-i*.013,.14,.20,i%2?maneShade:mane,0,2.65-i*.17,-1.10+i*.092,-.20);
  // Slim tail at the rump (rather than a giant vertical appendage).
  cube(g,.16,.16,.44,coat,0,1.64,1.17,-.29);
  cube(g,.20,.49,.22,maneShade,0,1.27,1.42,-.26);
  cube(g,.25,.35,.28,mane,0,1.00,1.49,-.13);
  const legs=[];
  for(const [x,z] of [[-.31,-.59],[.31,-.59],[-.31,.77],[.31,.77]]){
    const joint=new THREE.Group();joint.position.set(x,1.23,z);
    cube(joint,.20,.58,.25,chestnut,0,-.29,0);
    cube(joint,.16,.52,.21,coat,0,-.80,-.025);
    cube(joint,.26,.16,.34,hooves,0,-1.14,-.085);
    cube(joint,.19,.085,.22,shade,0,-.58,.012);
    g.add(joint);legs.push(joint);
  }
  g.userData.walkLegs=legs;
  return g;
}

// The saddle is attached to the visible horse rig, so it stays on the back
// during stepping and walking instead of hovering at world coordinates.
// The saddle is centered at horse Y≈2.08; rider hip is local Y=.69.
// Lower the avatar root so the hips actually rest on the saddle instead of
// placing its feet on top of the saddle like a standing character.
const HORSE_RIDER_ROOT_Y=1.39,HORSE_WALK_SPEED=6.1,HORSE_RUN_SPEED=8.5;
function showHorseSaddle(horse){
  if(!horse||horse.userData.type!=='horse'||horse.userData.saddleVisual)return;
  const rig=horse.userData.stepVisual||horse;
  const g=new THREE.Group();
  const dark=0x44291d,leather=0x784628,light=0xa46b3c,brass=0xdcb76a;
  cube(g,.94,.12,1.10,dark,0,1.965,.12);
  cube(g,.78,.14,.84,leather,0,2.035,.12);
  cube(g,.62,.10,.30,light,0,2.12,-.26);
  cube(g,.62,.13,.27,dark,0,2.115,.56);
  for(const side of [-1,1]){
    cube(g,.11,.56,.11,dark,side*.48,1.68,.18);
    cube(g,.14,.08,.32,brass,side*.51,1.40,.20);
    cube(g,.10,.10,.15,light,side*.53,1.47,.19);
  }
  rig.add(g);horse.userData.saddleVisual=g;
}
function saddledHorsesForSave(){
  return mobs.filter(m=>m.userData.type==='horse'&&m.userData.saddled&&
    (activeMap!=='testworld'||!m.userData.testSpawned)).slice(0,64);
}
function serializeSaddledHorses(){
  return saddledHorsesForSave().map(m=>({
    x:m.position.x,y:m.position.y,z:m.position.z,
    angle:m.userData.angle,hp:m.userData.hp,netId:ensureMobId(m)
  }));
}
function restoreSaddledHorses(data){
  ridingHorse=null;
  // Guests receive the host's live horses; don't restore duplicates.
  if(multiRole==='guest'||!Array.isArray(data?.saddledHorses))return;
  const entries=data.saddledHorses.slice(0,64);
  const savedRider=Number.isInteger(data.ridingHorseIndex)?data.ridingHorseIndex:-1;
  for(let i=0;i<entries.length;i++){
    const v=entries[i];
    if(!v||![v.x,v.y,v.z,v.angle].every(Number.isFinite)||
       Math.abs(v.x)>1000000||Math.abs(v.z)>1000000||v.y<Y_MIN||v.y>WORLD_TOP)continue;
    const h=buildHorse();
    h.position.set(v.x,v.y,v.z);h.userData={
      ...h.userData,type:'horse',name:'馬',angle:v.angle,
      t:2,speed:.70,hp:Math.max(1,Math.min(10,Number(v.hp)||10)),xp:24,
      hostile:false,attackCooldown:0,chaseTime:0,phase:0,saddled:true,
      netId:typeof v.netId==='string'&&/^[0-9a-f-]{36}$/.test(v.netId)?v.netId:crypto.randomUUID()
    };
    h.rotation.y=v.angle+Math.PI;
    setupMobStepAnimation(h);
    showHorseSaddle(h);
    scene.add(h);mobs.push(h);
    if(i===savedRider&&!dead&&multiRole!=='guest')ridingHorse=h;
  }
}
function syncRiderToHorse(){
  if(!ridingHorse)return;
  player.pos.set(ridingHorse.position.x,ridingHorse.position.y+HORSE_RIDER_ROOT_Y,ridingHorse.position.z);
  player.vel.y=0;player.onGround=true;fallOriginY=null;
}
// Use the same reticle, raycaster and wall occlusion as regular block use.
// This avoids saddling or mounting a horse through a wall.
function aimedHorse(){
  aimPlayerRay();
  const hits=ray.intersectObjects(mobs,true).filter(h=>h.distance<=4.5);
  if(!hits.length)return null;
  const hit=hits[0];
  let m=hit.object;
  while(m.parent&&!mobs.includes(m))m=m.parent;
  if(!mobs.includes(m)||m.userData.type!=='horse')return null;
  const block=target();
  return block&&block.distance<hit.distance-.05?null:m;
}
function useHorse(horse){
  if(multiRole){
    flash('馬への騎乗は現在シングルプレイ専用です');return true;
  }
  if(!horse.userData.saddled){
    if(selected!==I.SADDLE||(inventory[I.SADDLE]||0)<1){
      flash('馬に乗るには革で作った鞍を持って「設置・使用」');return true;
    }
    if(consumeSelected(1)!==1)return true;
    horse.userData.saddled=true;
    horse.userData.fleeTime=0;
    showHorseSaddle(horse);
    markSaveDirty();flash('馬に鞍をつけました！ もう一度「設置・使用」で乗れます');
    return true;
  }
  if(ridingHorse){flash('すでに馬に乗っています');return true}
  if(blocked(horse.position.x,horse.position.y+HORSE_RIDER_ROOT_Y,horse.position.z)){
    flash('頭上が狭いため、ここでは乗れません');return true;
  }
  ridingHorse=horse;horse.userData.fleeTime=0;horse.userData.ridingMoved=false;
  syncRiderToHorse();markSaveDirty();
  flash('乗馬中！ 方向キーで移動・青い上矢印で疾走・攻撃ボタンで降りる');
  return true;
}
function dismountHorse(){
  if(!ridingHorse)return false;
  const horse=ridingHorse,angle=horse.userData.angle;
  const sideX=Math.cos(angle),sideZ=-Math.sin(angle);
  const frontX=Math.sin(angle),frontZ=Math.cos(angle);
  const spots=[
    [sideX*1.65,sideZ*1.65],[-sideX*1.65,-sideZ*1.65],
    [-frontX*1.95,-frontZ*1.95],[frontX*2.35,frontZ*2.35],
    [sideX*2.2,sideZ*2.2],[-sideX*2.2,-sideZ*2.2]
  ];
  for(const [dx,dz] of spots){
    const x=horse.position.x+dx,z=horse.position.z+dz;
    for(const offset of [1.01,2.01,.01,-.99]){
      const y=horse.position.y+offset;
      if(!blocked(x,y,z)&&blocked(x,y-.60,z)){
        ridingHorse=null;horse.userData.ridingMoved=false;
        player.pos.set(x,y,z);player.vel.set(0,0,0);
        player.onGround=true;fallOriginY=null;
        markSaveDirty();flash('馬から降りました。鞍をつけた馬はその場で待ちます');
        return true;
      }
    }
  }
  flash('降りる場所に足場と空きスペースがありません');
  return true; // Consume attack even if dismount isn't safe.
}
function updateRidingHorse(input,dt,running){
  const horse=ridingHorse;if(!horse)return;
  const prev=horse.position.clone(),prevAngle=horse.userData.angle;
  let moved=false;
  if(input.lengthSq()>.001){
    const heading=Math.atan2(input.x,input.z);
    horse.userData.angle=heading;
    moved=mobWalkStep(horse,heading,(running?HORSE_RUN_SPEED:HORSE_WALK_SPEED)*dt);
    // A low ceiling may clear the horse but clip the rider: undo that step.
    if(moved&&blocked(horse.position.x,horse.position.y+HORSE_RIDER_ROOT_Y,horse.position.z)){
      horse.position.copy(prev);horse.userData.angle=prevAngle;moved=false;
    }
    if(moved){
      horse.rotation.y=heading+Math.PI;
      if(!horse.userData.lastSaveMark||performance.now()-horse.userData.lastSaveMark>1500){
        horse.userData.lastSaveMark=performance.now();markSaveDirty();
      }
    }
  }
  horse.userData.ridingMoved=moved;
  player.vel.set((horse.position.x-prev.x)/Math.max(dt,.001),0,(horse.position.z-prev.z)/Math.max(dt,.001));
  syncRiderToHorse();
}
const LARGE_PREDATOR_SCALE=1.5; // Uniform size increase for bison and lions.
function buildBison(){
  const g=new THREE.Group();
  g.scale.setScalar(LARGE_PREDATOR_SCALE);
  // Black buffalo: layered near-black charcoal fur and subtle silver-gray
  // highlights retain the massive shape and texture in both daylight and dusk.
  // Ivory horns stay pale for contrast; the nose is dark slate instead of brown.
  const brown=0x1a1c1d,back=0x34383a,dark=0x121416,deep=0x090b0d;
  const fur=0x101214,furLite=0x292d30,horn=0xcfc2a0,tip=0xf0e5cb;
  const nose=0x272a2d,nostril=0x070809,eye=0xff3042,pupil=0x160609;
  // Front-heavy powerful body with a high shoulder hump.
  cube(g,1.52,1.16,2.07,brown,0,1.13,.15);
  cube(g,1.47,.28,1.73,back,0,1.76,.40);
  cube(g,1.61,1.42,1.19,fur,0,1.67,-.45);
  cube(g,1.48,.39,1.05,furLite,0,2.34,-.39);
  for(const x of[-.59,-.30,0,.30,.59])for(const z of[-.94,-.64,-.34]){
    cube(g,.30,.17,.32,(Math.abs(x)<.3?fur:dark),x,2.35-Math.abs(x)*.12,z);
  }
  // Rough block fur on chest and cheeks.
  for(const x of[-.62,-.34,0,.34,.62]){
    cube(g,.24,.51,.30,x===0?deep:fur,x,.79,-.98);
    cube(g,.24,.40,.29,fur,x,1.47,-1.08);
  }
  cube(g,1.07,.80,.79,dark,0,1.65,-1.13);
  cube(g,.79,.43,.51,nose,0,1.36,-1.57);
  for(const x of[-.25,.25]){
    cube(g,.12,.085,.04,nostril,x,1.36,-1.848);
    // Red, front-facing eyes with a narrow dark pupil, visible on black fur.
    cube(g,.18,.16,.075,eye,x*1.55,1.79,-1.55);
    cube(g,.057,.105,.038,pupil,x*1.55,1.79,-1.604);
    cube(g,.16,.12,.14,tip,x*1.49,2.05,-1.29);
    const side=Math.sign(x);
    cube(g,.38,.21,.29,horn,side*.67,2.01,-1.18,0,0,side*.14);
    cube(g,.22,.38,.21,tip,side*.86,2.23,-1.14,0,0,side*.28);
  }
  cube(g,.34,.43,.37,deep,0,.93,-1.39);
  cube(g,.16,.28,.20,deep,0,1.12,1.26,.16);
  cube(g,.24,.28,.17,fur,0,.92,1.32);
  createMobLegs(g,[[-.55,-.56],[.55,-.56],[-.53,.77],[.53,.77]],brown,deep,.34,.73);
  return g;
}
function buildLion(){
  const g=new THREE.Group();
  g.scale.setScalar(LARGE_PREDATOR_SCALE);
  const gold=0xc68d4d,light=0xe2ac65,brown=0x874c2b,mane=0x684027;
  const deep=0x442719,cream=0xeac895,eye=0xe5bc43,black=0x251c16,tooth=0xfff3dd;
  cube(g,1.38,.88,1.86,gold,0,1.17,.13);
  cube(g,1.25,.16,1.45,light,0,1.62,.22);
  cube(g,1.56,1.38,1.11,mane,0,1.57,-.73);
  for(const x of[-.65,-.35,0,.35,.65]){
    cube(g,.33,.39,.34,x===0?brown:deep,x,1.10,-1.07);
    cube(g,.28,.25,.36,brown,x,2.23-Math.abs(x)*.25,-.79);
  }
  // Squared muzzle, watchful yellow eyes and toothy mouth.
  cube(g,.90,.70,.74,gold,0,1.67,-1.25);
  cube(g,.89,.19,.20,cream,0,1.43,-1.68);
  cube(g,.46,.26,.33,cream,0,1.50,-1.66);
  cube(g,.35,.14,.20,deep,0,1.27,-1.72);
  cube(g,.29,.17,.17,black,0,1.64,-1.83);
  for(const x of[-.35,.35]){
    cube(g,.20,.24,.16,light,x,2.12,-1.16);
    cube(g,.15,.10,.035,black,x*.74,1.83,-1.661);
    cube(g,.105,.11,.04,eye,x*.74,1.72,-1.677);
    cube(g,.06,.11,.05,black,x*.74,1.72,-1.704);
    cube(g,.085,.14,.09,tooth,x*.70,1.29,-1.79);
    cube(g,.28,.12,.13,brown,x,1.88,-1.62);
  }
  cube(g,.15,.16,.14,tooth,0,1.24,-1.77);
  // Tail with the recognisable dark tuft.
  cube(g,.17,.16,.56,gold,0,1.35,1.24,-.19);
  cube(g,.22,.18,.42,brown,0,1.29,1.66,.07);
  cube(g,.30,.27,.35,deep,0,1.32,1.88);
  createMobLegs(g,[[-.51,-.58],[.51,-.58],[-.51,.71],[.51,.71]],gold,brown,.33,.70);
  return g;
}

// Giant anaconda: ONE continuous, tapering snake body (not disconnected
// box segments that look like a caterpillar). Eight blocks from nose to tip.
// Local -Z faces forward. This skeleton also drives its collision rings.
const ANACONDA_BODY=[
  // sideways offset, longitudinal z, whole width, whole height, depth, center Y
  [-.03,-2.40,.86,.69,.92,1.23],
  [-.11,-1.63,1.00,.85,.96,1.08],
  [-.25,-.85,1.14,.98,.98,1.04],
  [-.12,-.07,1.20,1.01,.99,1.04],
  [ .17, .71,1.18,1.00,.98,1.01],
  [ .28,1.49,1.12,.96,.96,.98],
  [ .16,2.27,.92,.82,.90,.90],
  [-.12,3.02,.70,.65,.76,.82],
  [-.25,3.57,.45,.44,.61,.75],
  [-.25,3.93,.22,.24,.48,.70]
];
// Extra ends: the front slips inside the raised head, while the far end
// shrinks into a point. The model head/tail combined remain ~8 blocks.
const ANACONDA_SKIN_PATH=[
  [-.02,-2.78,.67,.54,1.35],
  ...ANACONDA_BODY.map(([x,z,w,h,depth,y])=>[x,z,w,h,y]),
  [-.25,4.17,.035,.045,.70]
];
const ANACONDA_BLOTCHES=Array.from({length:13},(_,i)=>[
  -2.23+i*.47+Math.sin(i*7.43)*.13,
  Math.PI/2+(i%2?.57:-.56)+Math.sin(i*2.3)*.12,
  .19+Math.abs(Math.sin(i*1.27))*.095,
  .26+Math.abs(Math.cos(i*3.1))*.09
]);
const anacondaSkinMaterial=new THREE.MeshLambertMaterial({
  color:0xffffff,vertexColors:true
});
function anacondaProfile(z){
  const points=ANACONDA_SKIN_PATH;
  let k=0;
  while(k<points.length-2&&points[k+1][1]<z)k++;
  const a=points[k],b=points[k+1];
  const t=Math.max(0,Math.min(1,(z-a[1])/(b[1]-a[1])));
  // Catmull-Rom interpolation eliminates discontinuities at every body ring.
  const before=points[Math.max(0,k-1)],after=points[Math.min(points.length-1,k+2)];
  return [0,2,3,4].map(index=>{
    const A=before[index],B=a[index],C=b[index],D=after[index];
    return .5*(2*B+(-A+C)*t+(2*A-5*B+4*C-D)*t*t+(-A+3*B-3*C+D)*t*t*t);
  });
}
function buildAnaconda(){
  const g=new THREE.Group();
  const green=0x526d31,dark=0x293b23,olive=0x6e8541;
  const belly=0xc6b783,eye=0xe9d05d,pupil=0x11170c,red=0xb8202b;
  // Construct ONE continuous, low-poly body mesh, without separate rings.
  // Vertex colors paint scales, belly and markings directly on the skin:
  // no raised bumps, joints, collars or cubes along the back.
  const vertices=[],colors=[],indices=[];
  const zStart=ANACONDA_SKIN_PATH[0][1],zEnd=4.17;
  const lengthSteps=72,radialSteps=20;
  const pigment=Object.fromEntries([
    ['green',0x556e34],['shade',0x3c572c],['side',0x637c3c],
    ['belly',0xc6b783],['bellyShade',0xab9869],['spot',0x243820],
    ['highlight',0x71884b]
  ].map(([name,color])=>[name,new THREE.Color(color)]));
  for(let i=0;i<=lengthSteps;i++){
    const z=zStart+(zEnd-zStart)*i/lengthSteps;
    const [side,width,height,centerY]=anacondaProfile(z);
    for(let j=0;j<=radialSteps;j++){
      const theta=j*Math.PI*2/radialSteps;
      const radialX=Math.cos(theta),radialY=Math.sin(theta);
      vertices.push(side+radialX*width*.5,centerY+radialY*height*.5,z);
      let shade=radialY<-.60?(i%11<6?'belly':'bellyShade'):
        radialY>.78?'green':radialY>.20?'side':'shade';
      if(radialY>.13){
        for(const [spotZ,spotTheta,zRadius,thetaRadius] of ANACONDA_BLOTCHES){
          let dTheta=Math.abs(theta-spotTheta);
          dTheta=Math.min(dTheta,2*Math.PI-dTheta);
          const distance=((z-spotZ)/zRadius)**2+(dTheta/thetaRadius)**2;
          if(distance<1){shade='spot';break}
        }
      }
      // A narrow, uninterrupted darker dorsal stripe follows the snake.
      if(radialY>.94&&shade!=='spot')shade='highlight';
      const col=pigment[shade];
      colors.push(col.r,col.g,col.b);
    }
  }
  for(let i=0;i<lengthSteps;i++)for(let j=0;j<radialSteps;j++){
    const a=i*(radialSteps+1)+j,b=a+radialSteps+1;
    indices.push(a,a+1,b,b,a+1,b+1);
  }
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
  geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  const body=new THREE.Mesh(geometry,anacondaSkinMaterial);
  body.castShadow=true;body.receiveShadow=true;g.add(body);
  g.userData.snakeBody=body;
  g.userData.snakeBasePositions=Float32Array.from(vertices);

  // Long low triangular-looking head and a subtly raised neck.
  // Its snout, tiny eyes and horizontal slit distinguish it from a grub.
  cube(g,.86,.36,.89,dark,0,1.66,-3.10);
  cube(g,.80,.16,.82,belly,0,1.46,-3.21);
  cube(g,.81,.19,.72,olive,0,1.84,-3.23);
  cube(g,.68,.23,.55,green,0,1.67,-3.53);
  cube(g,.65,.055,.38,0x1d2319,0,1.52,-3.53);
  for(const sign of [-1,1]){
    // Yellow eyes on BOTH sides: real snake rather than a segmented larva.
    cube(g,.13,.14,.15,eye,sign*.435,1.87,-3.18);
    cube(g,.04,.105,.065,pupil,sign*.505,1.87,-3.21);
    cube(g,.075,.045,.07,0x202a19,sign*.21,1.74,-3.79);
  }
  cube(g,.09,.045,.19,red,0,1.52,-3.73);
  cube(g,.043,.035,.14,red,-.06,1.52,-3.79,0,-.22);
  cube(g,.043,.035,.14,red,.06,1.52,-3.79,0,.22);
  return g;
}
function animateAnaconda(m,dt,now,moving){
  const mesh=m.userData.snakeBody,original=m.userData.snakeBasePositions;
  if(!mesh||!original)return;
  const target=moving?.105:.016;
  m.userData.snakeSway=(m.userData.snakeSway||0)*(1-Math.min(1,dt*6))+
    target*Math.min(1,dt*6);
  // Animate the vertices of ONE continuous skin. Never part the body into
  // visible sections. Keep the neck stationary and move mainly the tail.
  const positions=mesh.geometry.attributes.position;
  const phase=m.userData.phase||0;
  for(let k=0;k<original.length;k+=3){
    const z=original[k+2];
    const tailBias=Math.max(0,Math.min(1,(z+2.0)/6.17));
    positions.array[k]=original[k]+Math.sin(now*.004-z*1.05+phase)*
      m.userData.snakeSway*tailBias;
  }
  positions.needsUpdate=true;
}
// Night-time hostile mob: a green version of the player silhouette.
// Face points along local -Z. Both arms are kept in front, even while moving.
const ZOMBIE_LIMIT=7,ZOMBIE_AGGRO_RANGE=28,ZOMBIE_ATTACK_RANGE=1.35;
const SKELETON_LIMIT=3,SKELETON_AGGRO_RANGE=24,SKELETON_SHOOT_RANGE=17;
let zombieSpawnCooldown=1,skeletonSpawnCooldown=7,spiderSpawnCooldown=10,nightZombieWaveStarted=false;
const SPIDER_LIMIT=3;
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
// The skeleton is entirely voxel-built so its silhouette matches NEXACRAFT.
// All bones have open space around them; a visible bow sits beside its left hand.
function buildSkeleton(){
  const g=new THREE.Group();
  const bone=0xe7e3d6,light=0xf6f3e8,shadow=0xb8b3a7,dark=0x27282d;
  const wood=0x87552f,string=0xeee8cf;
  // Angular skull with recessed dark eyes and an open toothy jaw.
  cube(g,.63,.55,.53,bone,0,1.50,0);
  cube(g,.57,.09,.55,light,0,1.78,0);
  cube(g,.17,.17,.035,dark,-.16,1.52,-.281);
  cube(g,.17,.17,.035,dark,.16,1.52,-.281);
  cube(g,.10,.12,.035,shadow,0,1.40,-.285);
  cube(g,.46,.105,.43,shadow,0,1.25,.01);
  for(const x of [-.15,-.05,.05,.15])cube(g,.057,.075,.036,light,x,1.24,-.215);
  // Spine, collarbone, and thin ribs with visible dark gaps.
  cube(g,.11,.68,.12,shadow,0,.98,.03);
  cube(g,.64,.085,.15,light,0,1.36,.01);
  for(const y of [1.27,1.13,.99,.85]){
    cube(g,.57,.077,.13,bone,0,y,-.025);
    cube(g,.49,.055,.10,shadow,0,y+.013,.10);
  }
  cube(g,.53,.14,.23,bone,0,.69,0);
  const leftArm=new THREE.Group(),rightArm=new THREE.Group();
  const leftLeg=new THREE.Group(),rightLeg=new THREE.Group();
  for(const [side,arm,leg] of [[-1,leftArm,leftLeg],[1,rightArm,rightLeg]]){
    arm.position.set(side*.36,1.32,0);
    cube(arm,.15,.34,.16,bone,0,-.20,0);
    cube(arm,.18,.13,.18,shadow,0,-.41,0);
    cube(arm,.14,.28,.14,light,0,-.56,-.02);
    cube(arm,.21,.12,.18,bone,0,-.72,-.02);
    g.add(arm);
    leg.position.set(side*.19,.67,0);
    cube(leg,.17,.34,.19,bone,0,-.20,0);
    cube(leg,.20,.14,.21,shadow,0,-.40,0);
    cube(leg,.16,.28,.18,light,0,-.55,0);
    cube(leg,.26,.10,.35,bone,0,-.71,-.07);
    g.add(leg);
  }
  // Wooden recurved bow attached to the left wrist, string on the right.
  const bow=new THREE.Group();
  bow.position.set(-.065,-.69,-.18);
  bow.rotation.set(.12,-.18,-.04);
  for(let i=0;i<=8;i++){
    const t=i/8,y=(t-.5)*1.02;
    const slat=cube(bow,.085,.16,.10,i%2?wood:0xb27c44,
      -.25*Math.sin(Math.PI*t),y,0);
    slat.rotation.z=(t-.5)*.7;
  }
  cube(bow,.024,1.10,.022,string,.025,0,-.03);
  leftArm.add(bow);
  g.userData.parts={leftArm,rightArm,leftLeg,rightLeg};
  g.scale.x=.80;g.scale.z=.88;
  return g;
}
// Solid block collision for every walking mob (cow/pig/sheep/zombie/skeleton).
// surfaceAt() describes generated ground only. Placed blocks and removed
// blocks live in get(), so height checks alone let mobs pass through walls.
function mobCollisionShape(m,x,z,angle=m.userData.angle){
  const type=m.userData.type;
  if(type==='zombie'||type==='skeleton'||type==='villager')return [[x,z,.34]];
  if(NEW_MOB_TYPES.has(type)){
    const direction=Number.isFinite(angle)?angle:0,fx=Math.sin(direction),fz=Math.cos(direction);
    const dims={
      deer:[[0,.45],[.72,.32],[-.52,.36]],
      wolf:[[0,.52],[.75,.36],[-.66,.36]],
      bear:[[0,.80],[.94,.70],[-.74,.69]],
      boar:[[0,.60],[.69,.50],[-.59,.48]],
      spider:[[0,.83],[.48,.62]],
      golem:[[0,.79]],
      eagle:[[0,.48]],
      crocodile:[[0,.64],[1.32,.50],[-1.02,.56]],
      shark:[[0,.65],[1.19,.44],[-1.14,.43]],
      elephant:[[0,1.19],[1.17,1.03],[-.95,1.04]]
    }[type]||[[0,.52]];
    return dims.map(([offset,r])=>[x+fx*offset,z+fz*offset,r]);
  }
  if(type==='chimera'){
    // Approximate the sculpt's broad lion chest and long serpent tail.
    const a=Number.isFinite(angle)?angle:0,fx=Math.sin(a),fz=Math.cos(a);
    return [[0,1.15],[1.25,1.15],[-1.25,1.12],[2.30,.82],[-2.45,.84]]
      .map(([forward,r])=>[x+fx*forward,z+fz*forward,r]);
  }
  const direction=Number.isFinite(angle)?angle:0;
  const fx=Math.sin(direction),fz=Math.cos(direction);
  if(type==='horse')return [
    [x,z,.45],[x+fx*.53,z+fz*.53,.42],[x-fx*.63,z-fz*.63,.40],
    [x+fx*1.57,z+fz*1.57,.34,1.90,2.90]
  ];
  if(type==='anaconda'){
    // Small oriented circles follow the complete eight-block S-shaped body.
    // Local sideways offsets match the visual body; the added clearance
    // covers its subtle animated sway. The taller head is a separate ring.
    const rings=[
      [3.15,0,.57,2.16],[2.67,-.04,.53,1.80],
      ...ANACONDA_BODY.map(([side,z,width,height,depth,y])=>[
        -z,side,Math.max(width*.5,depth*.5)+.13,y+height*.5+.04
      ])
    ];
    const rx=Math.cos(direction);
    return rings.map(([forwardOffset,sideOffset,r,top])=>[
      x+fx*forwardOffset-rx*sideOffset,
      z+fz*forwardOffset+fx*sideOffset,
      r,undefined,top
    ]);
  }
  if(type==='bison'||type==='lion'){
    const scale=LARGE_PREDATOR_SCALE;
    // Each collision circle grows and moves along the same axis as the model.
    const shape=type==='bison'?[[0,.76],[.84,.65],[-.65,.62]]
      :[[0,.67],[.95,.49],[-.73,.58]];
    return shape.map(([forwardOffset,r])=>[
      x+fx*forwardOffset*scale,z+fz*forwardOffset*scale,r*scale
    ]);
  }
  // Body and projecting head of the three original farm animals.
  return [[x,z,.46],[x+fx*.72,z+fz*.72,.33]];
}
function mobVerticalBounds(m,rootY=m.position.y){
  const type=m.userData.type;
  // Unlike feet, the larger animals' ears/hump/mane reach well above 2 blocks.
  const foot=type==='chimera'?rootY:rootY+((type==='zombie'||type==='skeleton'||type==='spider')?.025:.50);
  const height=type==='villager'?1.93:NEW_MOB_STATS[type]?.height??(type==='chimera'?5.05:type==='zombie'||type==='skeleton'?1.74:type==='horse'?2.40:
    type==='bison'?2.11*LARGE_PREDATOR_SCALE:
    type==='lion'?1.98*LARGE_PREDATOR_SCALE:
    type==='anaconda'?1.67:1.14);
  return [foot,foot+height];
}
function mobCircleTouchesBlock(x,z,r,bx,bz){
  const dx=Math.max(Math.abs(x-bx)-.5,0),dz=Math.max(Math.abs(z-bz)-.5,0);
  return dx*dx+dz*dz<r*r-1e-7;
}
function mobSpaceFree(m,x,rootY,z,angle=m.userData.angle){
  const [foot,top]=mobVerticalBounds(m,rootY),eps=1e-4;
  const fromY=Math.ceil(foot-.5+eps),toY=Math.floor(top+.5-eps);
  for(const [cx,cz,r,localBottom,localTop] of mobCollisionShape(m,x,z,angle)){
    const bottom=localBottom==null?fromY:Math.ceil(rootY+localBottom-.5+eps);
    const topY=localTop==null?toY:Math.floor(rootY+localTop+.5-eps);
    const fromX=Math.ceil(cx-r-.5+eps),toX=Math.floor(cx+r+.5-eps);
    const fromZ=Math.ceil(cz-r-.5+eps),toZ=Math.floor(cz+r+.5-eps);
    for(let bx=fromX;bx<=toX;bx++)for(let bz=fromZ;bz<=toZ;bz++){
      if(!mobCircleTouchesBlock(cx,cz,r,bx,bz))continue;
      for(let by=bottom;by<=topY;by++){
        if(solid(get(bx,by,bz)))return false;
      }
    }
  }
  return true;
}
function mobOverlapsBlock(m,bx,by,bz){
  const [foot,top]=mobVerticalBounds(m);
  if(by+.5<=foot+.0001||by-.5>=top-.0001)return false;
  return mobCollisionShape(m,m.position.x,m.position.z).some(([x,z,r,lower,upper])=>{
    if(lower!=null&&by+.5<=m.position.y+lower+.0001)return false;
    if(upper!=null&&by-.5>=m.position.y+upper-.0001)return false;
    return mobCircleTouchesBlock(x,z,r,bx,bz);
  });
}
// Visual-only child rig: physics uses the new height immediately, while the
// visible mob visibly hops up / drops down instead of teleporting a block.
function setupMobStepAnimation(m){
  const body=new THREE.Group();
  for(const child of [...m.children])body.add(child);
  m.add(body);
  m.userData.stepVisual=body;
}
function animateMobStep(m,dt){
  const model=m.userData.stepVisual;if(!model)return;
  if(Math.abs(model.position.y)<.005){model.position.y=0;return}
  model.position.y+=(0-model.position.y)*Math.min(1,dt*12);
}
// A long muzzle can hit a wall before the front legs reach it. Jump
// decisions must only consider solid blocks at FOOT height, never the nose.
function mobLowStepObstacle(m,x,rootY,z,angle){
  const feet=mobVerticalBounds(m,rootY)[0];
  const by=Math.ceil(feet-.5+1e-4);
  for(const [cx,cz,r,lower] of mobCollisionShape(m,x,z,angle)){
    if(lower!=null)continue; // a horse's high muzzle is not a hoof
    const x1=Math.ceil(cx-r-.5),x2=Math.floor(cx+r+.5);
    const z1=Math.ceil(cz-r-.5),z2=Math.floor(cz+r+.5);
    for(let bx=x1;bx<=x2;bx++)for(let bz=z1;bz<=z2;bz++){
      if(mobCircleTouchesBlock(cx,cz,r,bx,bz)&&solid(get(bx,by,bz)))return true;
    }
  }
  return false;
}
// Swept movement for all animals and zombies. A one-block wall can be
// climbed when the entire head/body clears it; higher walls stay blocked.
// Always read placed/removed voxels through get(), never only surfaceAt().
function mobWalkStep(m,angle,distance,isZombie=false){
  if(performance.now()<(m.userData.jobDebuffUntil||0))distance*=.42;
  const steps=Math.max(1,Math.ceil(Math.abs(distance)/.09)),step=distance/steps;
  const rootOffset=isZombie?.51:.04;
  let moved=false;
  for(let i=0;i<steps;i++){
    const nx=m.position.x+Math.sin(angle)*step;
    const nz=m.position.z+Math.cos(angle)*step;
    const bx=Math.round(nx),bz=Math.round(nz);
    let ground=surfaceAt(bx,bz);
    // Village paths and houses are flattened at the village's base elevation.
    // The procedural terrain sampler has not changed, so consult the actual
    // placed foundation for villagers and their guardians when inside villages.
    // Without this they can treat old buried terrain as a step or an open hole.
    const ud=m.userData;
    if((ud.type==='villager'||ud.type==='golem')&&Number.isFinite(ud.homeY)&&
       Math.abs(bx-ud.homeX)<=18&&Math.abs(bz-ud.homeZ)<=18){
      const floorY=ud.homeY;
      if(solid(get(bx,floorY,bz))&&!solid(get(bx,floorY+1,bz)))
        ground=floorY;
    }
    if(ground<(isZombie?SEA:SEA+1)||ground>WORLD_TOP-3)break;
    if(!isZombie&&biomeAt(bx,bz)===6)break;
    // Even a mined-away floor must be verified. A shallow hole can be walked into.
    const floor=solid(get(bx,ground,bz))?ground:
      solid(get(bx,ground-1,bz))?ground-1:null;
    if(floor===null)break;
    const naturalY=floor+rootOffset,oldY=m.position.y;
    if(naturalY>oldY+1.15||naturalY<oldY-1.15)break;
    let candidateY=oldY;
    if(naturalY>oldY+.09)candidateY=naturalY;
    else if(naturalY<oldY-.12&&mobSpaceFree(m,nx,naturalY,nz,angle))
      candidateY=naturalY;
    if(!mobSpaceFree(m,nx,candidateY,nz,angle)){
      if(naturalY>oldY+.12)break; // terrain step already exhausted
      if(!mobLowStepObstacle(m,nx,oldY,nz,angle))break;
      const raisedY=oldY+1;
      if(raisedY+mobVerticalBounds(m,0)[1]>WORLD_TOP+1.5||
         !mobSpaceFree(m,nx,raisedY,nz,angle))break;
      candidateY=raisedY;
    }
    m.position.x=nx;m.position.z=nz;
    if(Math.abs(candidateY-oldY)>.10){
      m.position.y=candidateY;
      if(m.userData.stepVisual){
        const mesh=m.userData.stepVisual;
        mesh.position.y=Math.max(-1.03,Math.min(1.03,mesh.position.y+oldY-candidateY));
      }
    }else m.position.y+=(candidateY-m.position.y)*(isZombie?.35:1);
    moved=true;
  }
  return moved;
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
    if(torchProtectsSpawn(x,y+1,z))continue;
    if(mobs.some(m=>Math.hypot(m.position.x-x,m.position.z-z)<3.5))continue;
    const g=buildZombie();
    g.position.set(x,y+.51,z);
    g.userData={...g.userData,type:'zombie',name:'ゾンビ',hp:10,xp:24,
      angle:Math.random()*Math.PI*2,speed:1.45,
      attackCooldown:.8,hitFlash:0,phase:Math.random()*Math.PI*2};
    setupMobStepAnimation(g);
    scene.add(g);mobs.push(g);
    return true;
  }
  return false;
}
function countSpiders(){return mobs.filter(m=>m.userData.type==='spider').length}
function spawnNightSpider(){
  if(countSpiders()>=SPIDER_LIMIT)return false;
  const phase=Math.random()*Math.PI*2;
  for(let i=0;i<52;i++){
    const angle=phase+i*2.399963229728653,dist=10+Math.random()*15;
    const x=Math.round(player.pos.x+Math.cos(angle)*dist);
    const z=Math.round(player.pos.z+Math.sin(angle)*dist);
    if(!isZombieGround(x,z))continue;
    const y=surfaceAt(x,z);
    if(Math.abs(y+.51-player.pos.y)>5||torchProtectsSpawn(x,y+1,z))continue;
    if(mobs.some(m=>Math.hypot(m.position.x-x,m.position.z-z)<3))continue;
    const g=createNewMob('spider',x,y+.51,z);
    if(!mobSpaceFree(g,x,y+.51,z,g.userData.angle)){
      disposeUnusedNewMob(g);continue;
    }
    g.userData.spawnedAt=performance.now();
    scene.add(g);mobs.push(g);return true;
  }
  return false;
}
function countSkeletons(){
  return mobs.reduce((sum,m)=>sum+(m.userData.type==='skeleton'?1:0),0);
}
function spawnSkeleton(){
  if(countSkeletons()>=SKELETON_LIMIT)return false;
  const phase=Math.random()*Math.PI*2;
  for(let attempt=0;attempt<64;attempt++){
    const angle=phase+attempt*2.399963229728653;
    const radius=12+Math.random()*14;
    const x=Math.round(player.pos.x+Math.cos(angle)*radius);
    const z=Math.round(player.pos.z+Math.sin(angle)*radius);
    if(!isZombieGround(x,z))continue;
    const y=surfaceAt(x,z);
    if(Math.abs(y+.51-player.pos.y)>5)continue;
    if(torchProtectsSpawn(x,y+1,z))continue;
    if(mobs.some(m=>Math.hypot(m.position.x-x,m.position.z-z)<4))continue;
    const skeleton=buildSkeleton();
    skeleton.position.set(x,y+.51,z);
    skeleton.userData={...skeleton.userData,type:'skeleton',name:'スケルトン',
      hp:8,xp:26,angle:Math.random()*Math.PI*2,speed:1.10,
      attackCooldown:1.2+Math.random(),hitFlash:0,phase:Math.random()*Math.PI*2};
    setupMobStepAnimation(skeleton);
    scene.add(skeleton);mobs.push(skeleton);
    return true;
  }
  return false;
}
// Check solid world blocks between the bow and player, including houses and walls.
function skeletonHasLineOfSight(origin,target){
  const dx=target.x-origin.x,dy=target.y-origin.y,dz=target.z-origin.z;
  const dist=Math.hypot(dx,dy,dz);
  const steps=Math.max(1,Math.ceil(dist/.22));
  for(let i=2;i<steps-1;i++){
    const t=i/steps;
    if(solid(get(Math.round(origin.x+dx*t),Math.round(origin.y+dy*t),
      Math.round(origin.z+dz*t))))return false;
  }
  return true;
}
function updateSkeleton(m,dt,now){
  const dx=player.pos.x-m.position.x,dz=player.pos.z-m.position.z;
  const distance=Math.hypot(dx,dz),ud=m.userData;
  ud.attackCooldown=Math.max(0,ud.attackCooldown-dt);
  if(distance<SKELETON_AGGRO_RANGE&&Math.abs(player.pos.y-m.position.y)<5){
    ud.angle=Math.atan2(dx,dz);
    // Keep enough space to use the bow; backpedal if cornered.
    let direction=ud.angle,step=0;
    if(distance>12)step=ud.speed*dt;
    else if(distance<5){direction+=Math.PI;step=ud.speed*.83*dt}
    else if(distance>7&&distance<11){
      direction+=Math.sin(ud.phase)>0?Math.PI/2:-Math.PI/2;
      step=ud.speed*.37*dt;
    }
    if(step&&!mobWalkStep(m,direction,step,true))
      mobWalkStep(m,direction+.65,step*.6,true);
    m.rotation.y=ud.angle+Math.PI;
    if(distance>3.0&&distance<SKELETON_SHOOT_RANGE&&ud.attackCooldown<=0){
      const origin=new THREE.Vector3(
        m.position.x+Math.sin(ud.angle)*.48,m.position.y+1.28,
        m.position.z+Math.cos(ud.angle)*.48);
      const target=new THREE.Vector3(player.pos.x,player.pos.y+1.10,player.pos.z);
      if(skeletonHasLineOfSight(origin,target)){
        if(shootSkeletonArrow(origin,target,m.position))ud.attackCooldown=2.3+Math.random()*.5;
      }else ud.attackCooldown=.45;
    }
  }else{
    ud.angle+=Math.sin(now*.0007+ud.phase)*dt*.14;
    m.rotation.y=ud.angle+Math.PI;
  }
  const limbs=ud.parts;
  if(limbs){
    const walking=distance>12||distance<5;
    const stride=walking?Math.sin(now*.008+ud.phase)*.35:0;
    limbs.leftLeg.rotation.x=stride;
    limbs.rightLeg.rotation.x=-stride;
    // Keep the bow raised and the draw hand near the string while aiming.
    limbs.leftArm.rotation.x=1.05+stride*.13;
    limbs.leftArm.rotation.z=-.20;
    limbs.rightArm.rotation.x=1.16+(ud.attackCooldown>.9?.07:0);
    limbs.rightArm.rotation.y=-.20;
  }
}
function updateZombieSpawning(dt){
  if(multiRole==='guest'||activeMap==='testworld')return;
  if(!isNightTime()){
    zombieSpawnCooldown=1;
    skeletonSpawnCooldown=7;
    spiderSpawnCooldown=10;
    nightZombieWaveStarted=false;
    // Both undead enemies and their flying arrows disappear at dawn.
    for(let i=mobs.length-1;i>=0;i--)
      if(mobs[i].userData.type==='zombie'||mobs[i].userData.type==='skeleton'||mobs[i].userData.type==='spider')
        removeZombie(mobs[i]);
    if(skeletonArrows.length)clearSkeletonArrows();
    return;
  }
  for(let i=mobs.length-1;i>=0;i--){
    const m=mobs[i];
    if((m.userData.type==='zombie'||m.userData.type==='skeleton'||m.userData.type==='spider')&&
      Math.hypot(m.position.x-player.pos.x,m.position.z-player.pos.z)>75)
      removeZombie(m);
  }
  if(!nightZombieWaveStarted){
    nightZombieWaveStarted=true;
    zombieSpawnCooldown=4;
    // An opening wave makes the enemies easy to spot at the start of night.
    spawnZombie();spawnZombie();spawnSkeleton();spawnNightSpider();
    skeletonSpawnCooldown=9;spiderSpawnCooldown=11;
    // Night enemies still spawn normally; no repetitive nightfall banner.
    return;
  }
  spiderSpawnCooldown-=dt;
  if(spiderSpawnCooldown<=0){
    spiderSpawnCooldown=countSpiders()<SPIDER_LIMIT?9:14;
    spawnNightSpider();
  }
  skeletonSpawnCooldown-=dt;
  if(skeletonSpawnCooldown<=0){
    skeletonSpawnCooldown=countSkeletons()<SKELETON_LIMIT?8:13;
    spawnSkeleton();
  }
  zombieSpawnCooldown-=dt;
  if(zombieSpawnCooldown>0)return;
  const nearby=mobs.filter(m=>m.userData.type==='zombie'&&Math.hypot(
    m.position.x-player.pos.x,m.position.z-player.pos.z)<38).length;
  zombieSpawnCooldown=nearby<2?3:nearby<4?5:8;
  if(nearby<5)spawnZombie();
}
function zombieStep(m,angle,step){
  return mobWalkStep(m,angle,step,true);
}
function updateSpider(m,dt,now){
  const ud=m.userData,dx=player.pos.x-m.position.x,dz=player.pos.z-m.position.z;
  const dist=Math.hypot(dx,dz),dy=Math.abs(player.pos.y-m.position.y);
  ud.attackCooldown=Math.max(0,(ud.attackCooldown||0)-dt);
  if(dist<21&&dy<3.0){
    ud.angle=Math.atan2(dx,dz);
    if(dist>1.12){
      const step=ud.speed*dt;
      if(!mobWalkStep(m,ud.angle,step,true))
        if(!mobWalkStep(m,ud.angle+Math.PI/2,step*.7,true))
          mobWalkStep(m,ud.angle-Math.PI/2,step*.7,true);
    }
    m.rotation.y=ud.angle+Math.PI;
    if(dist<1.55&&dy<1.75&&ud.attackCooldown<=0){
      ud.attackCooldown=1.45;
      damagePlayer(NEW_MOB_STATS.spider.damage,'巨大クモの噛みつき',m.position);
    }
  }else{
    ud.angle+=Math.sin(now*.0008+ud.phase)*dt*.15;
    m.rotation.y=ud.angle+Math.PI;
  }
  newMobModels.animate(m,now*.001,true);
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
      damagePlayer(1,'ゾンビの攻撃',m.position);
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


/* Provisional summonable Chimera boss using the latest Sculpt IV 3D mesh.
 * One boss per world, never a random spawn. Its full 300 HP is preserved.
 */
const CHIMERA_MAX_HEALTH=300,CHIMERA_HIT_DAMAGE=8;
let chimeraSummonPending=null;
function chimeraBoss(){
  return mobs.find(m=>m.userData.type==='chimera'&&m.userData.hp>0)||null;
}
function serializeSummonedChimeras(){
  return mobs.filter(m=>m.userData.type==='chimera'&&m.userData.hp>0&&
    (activeMap!=='testworld'||!m.userData.testSpawned)).slice(0,1)
    .map(m=>({x:m.position.x,y:m.position.y,z:m.position.z,
      angle:m.userData.angle,hp:m.userData.hp,netId:ensureMobId(m)}));
}
function makeChimeraMob(x,y,z,angle,hp=CHIMERA_MAX_HEALTH,netId=null){
  const m=buildChimera(THREE);
  m.position.set(x,y,z);m.rotation.y=angle+Math.PI;
  m.userData={...m.userData,type:'chimera',name:'キメラ',
    hp:Math.max(1,Math.min(CHIMERA_MAX_HEALTH,Math.floor(hp))),
    xp:300,angle,netId:netId||crypto.randomUUID(),
    attackCooldown:1.8,hitFlash:0,phase:0,hostile:true,spawnedAt:performance.now(),
    speed:2.3,fleeTime:0,t:2};
  scene.add(m);mobs.push(m);
  return m;
}
function restoreSummonedChimeras(data){
  if(multiRole==='guest'||!Array.isArray(data?.summonedChimeras))return;
  for(const row of data.summonedChimeras.slice(0,1)){
    if(!row||![row.x,row.y,row.z,row.angle,row.hp].every(Number.isFinite)||
      Math.abs(row.x)>1e6||Math.abs(row.z)>1e6||row.y<Y_MIN||
      row.y>WORLD_TOP||row.hp<=0)continue;
    makeChimeraMob(row.x,row.y,row.z,row.angle,row.hp,
      typeof row.netId==='string'&&/^[0-9a-f-]{36}$/.test(row.netId)?row.netId:null);
  }
}
function summonChimeraAt(x,groundY,z,summoner=player.pos){
  if(chimeraBoss())return {ok:false,reason:'すでにキメラが召喚されています'};
  if(![x,groundY,z].every(Number.isInteger)||!inside(x,groundY,z)||
    groundY>WORLD_TOP-7)return {ok:false,reason:'召喚する場所が高すぎます'};
  const floor=get(x,groundY,z);
  if(!solid(floor)||floor===B.LEAF||floor===B.CACTUS||isBedBlock(floor))
    return {ok:false,reason:'キメラの魂は地面や床の上で使用してください'};
  // Existing terrain geometry, ceilings and homes are respected.
  const y=groundY+.51,angle=Math.atan2(summoner.x-x,summoner.z-z);
  const probe={userData:{type:'chimera',angle},position:{x,y,z}};
  if(!mobSpaceFree(probe,x,y,z,angle))
    return {ok:false,reason:'キメラの召喚には周囲と上空に広い空間が必要です'};
  const m=makeChimeraMob(x,y,z,angle);
  markSaveDirty();
  if(multiRole==='host'&&multiplayerNetwork.connected)multiplayerNetwork.send(multiMobSnapshot());
  return {ok:true,mob:m};
}
function useChimeraSoul(x,y,z){
  if(!started||dead||sleeping||(inventory[I.CHIMERA_SOUL]||0)<1)return;
  if(multiRole==='guest'){
    if(!multiplayerNetwork.connected){flash('マルチプレイの接続がありません');return}
    if(chimeraSummonPending){flash('召喚を確認中です');return}
    const requestId=crypto.randomUUID();
    chimeraSummonPending=requestId;
    multiplayerNetwork.send({t:'chimeraSummon',requestId,x,y,z});
    setTimeout(()=>{
      if(chimeraSummonPending===requestId){
        chimeraSummonPending=null;flash('召喚の応答がありませんでした');
      }
    },9000);
    return;
  }
  const result=summonChimeraAt(x,y,z);
  if(!result.ok){flash(result.reason);return}
  removeItem(I.CHIMERA_SOUL,1);
  renderHotbar();saveCurrentGame(false);flash('キメラを召喚した！');
}
function hostHandleChimeraSummon(message,from,peerId){
  if(typeof message.requestId!=='string'||message.requestId.length>90||
    ![message.x,message.y,message.z].every(Number.isInteger))return;
  const p=from.player;
  if(!p||![p.x,p.y,p.z].every(Number.isFinite))return;
  const dist=Math.hypot(p.x-message.x,p.y-message.y,p.z-message.z);
  let result={ok:false,reason:'召喚できませんでした'};
  if(dist>8)result.reason='離れた場所には召喚できません';
  else if(performance.now()-(from.lastSummonAt??-Infinity)<1200)
    result.reason='少し待ってから召喚してください';
  else{
    from.lastSummonAt=performance.now();
    result=summonChimeraAt(message.x,message.y,message.z,p);
    if(result.ok)saveCurrentGame(false);
  }
  multiplayerNetwork.send({t:'chimeraSummonResult',requestId:message.requestId,
    ok:result.ok,reason:result.reason||''},peerId);
}
function guestHandleChimeraSummonResult(message){
  if(!chimeraSummonPending||message.requestId!==chimeraSummonPending)return;
  chimeraSummonPending=null;
  if(message.ok){
    removeItem(I.CHIMERA_SOUL,1);renderHotbar();markSaveDirty();
    saveCurrentGame(false);flash('キメラを召喚した！');
  }else flash(message.reason||'召喚に失敗しました');
}
function updateChimera(m,dt,now){
  const d=m.userData;
  d.attackCooldown=Math.max(0,(d.attackCooldown||0)-dt);
  const candidates=[{position:player.pos,peerId:null}];
  if(multiRole==='host'){
    for(const [peerId,g] of multiGuestRecords){
      if(g.player&&performance.now()-(g.lastPoseAt||0)<5000)
        candidates.push({position:g.player,peerId});
    }
  }
  let nearest=null,best=Infinity;
  for(const entry of candidates){
    const p=entry.position;
    if(![p.x,p.y,p.z].every(Number.isFinite))continue;
    const dist=Math.hypot(p.x-m.position.x,p.z-m.position.z);
    if(dist<best&&Math.abs(p.y-m.position.y)<5.5){
      nearest=entry;best=dist;
    }
  }
  let moving=false;
  if(nearest&&best<38){
    const p=nearest.position;
    const dx=p.x-m.position.x,dz=p.z-m.position.z;
    d.angle=Math.atan2(dx,dz);m.rotation.y=d.angle+Math.PI;
    if(best>3.0){
      moving=mobWalkStep(m,d.angle,Math.min(dt*2.4,Math.max(0,best-2.9)),true);
      if(!moving)moving=mobWalkStep(m,d.angle+.72,dt*1.4,true);
    }
    if(best<=3.65&&d.attackCooldown<=0){
      d.attackCooldown=1.65;
      if(nearest.peerId){
        multiplayerNetwork.send({t:'chimeraStrike',x:m.position.x,
          y:m.position.y,z:m.position.z,id:ensureMobId(m)},nearest.peerId);
      }else if(!dead)damagePlayer(CHIMERA_HIT_DAMAGE,'キメラの攻撃',m.position);
    }
  }
  animateChimera(m,now*.001,moving?'walk':'idle');
}

// Bison fight back; lions and giant anacondas actively hunt nearby players.
// Anacondas bite using their raised HEAD, not their distant body center.
function updateDangerousMob(m,dt,now){
  const d=m.userData,dx=player.pos.x-m.position.x,dz=player.pos.z-m.position.z;
  const dist=Math.hypot(dx,dz),heightDiff=Math.abs(player.pos.y-m.position.y);
  const snake=d.type==='anaconda';
  d.attackCooldown=Math.max(0,(d.attackCooldown||0)-dt);
  if((d.type==='lion'&&dist<=6&&heightDiff<3)||
     (snake&&dist<=9&&heightDiff<2.8))d.hostile=true;
  if(!d.hostile)return false;
  const chaseRadius=snake?22:d.type==='lion'?17:24;
  if(dist>chaseRadius||heightDiff>4){
    if((d.type==='lion'||snake)&&dist>chaseRadius)d.hostile=false;
    return false;
  }
  d.angle=Math.atan2(dx,dz);
  m.rotation.y=d.angle+Math.PI;
  const reach=snake?1.25:(d.type==='bison'?1.60:1.45)*LARGE_PREDATOR_SCALE;
  // Only the head has fangs; the tail cannot deliver an attack.
  const headDist=()=>snake?Math.hypot(
    player.pos.x-(m.position.x+Math.sin(d.angle)*3.15),
    player.pos.z-(m.position.z+Math.cos(d.angle)*3.15)
  ):dist;
  if(headDist()>reach*(snake?1:.79)){
    const speed=snake?2.9:d.type==='bison'?3.3:4.5;
    if(!mobWalkStep(m,d.angle,speed*dt)){
      // Work around rocks and player-built walls; do not phase through them.
      if(!mobWalkStep(m,d.angle+Math.PI/2,speed*dt))
        mobWalkStep(m,d.angle-Math.PI/2,speed*dt);
    }
  }
  if(headDist()<=reach&&heightDiff<(snake?2.65:2.1)&&d.attackCooldown<=0){
    d.attackCooldown=snake?1.6:d.type==='bison'?1.5:1.3;
    damagePlayer(10,snake?'オオアナコンダの噛みつき':d.type==='bison'?'バイソンの突進':'ライオンの攻撃',m.position);
  }
  return true;
}
function animateWildMob(m,dt,now,moving){
  if(NEW_MOB_TYPES.has(m.userData.type)){
    newMobModels.animate(m,now*.001,moving);return;
  }
  if(m.userData.type==='anaconda'){animateAnaconda(m,dt,now,moving);return}
  const legs=m.userData.walkLegs;
  if(!legs?.length)return;
  const speed=m.userData.fleeTime>0?2.1:m.userData.hostile?1.9:1;
  const swing=moving?Math.sin(now*.009*speed+m.userData.phase)*(.23*speed):0;
  for(let i=0;i<legs.length;i++){
    const sign=(i===0||i===3)?1:-1;
    legs[i].rotation.x+=(swing*sign-legs[i].rotation.x)*Math.min(1,dt*12);
  }
}
// Build the released wildlife models, including the neutral village golem.
function createNewMob(type,x,y,z){
  const stats=NEW_MOB_STATS[type];
  if(!stats)throw new Error('Unregistered mob '+type);
  const g=newMobModels.build(type);
  const heading=Math.random()*Math.PI*2;
  g.position.set(x,y,z);g.rotation.y=heading+Math.PI;
  g.userData={...g.userData,type,name:stats.name,hp:stats.hp,xp:stats.xp,
    angle:heading,t:1.5+Math.random()*3,speed:stats.speed,
    hostile:type==='spider'||type==='shark',fleeTime:0,
    attackCooldown:.6,hitFlash:0,phase:Math.random()*Math.PI*2,
    spawnedAt:performance.now(),turnTime:0};
  setupMobStepAnimation(g);
  return g;
}
function disposeUnusedNewMob(g){
  g.traverse(o=>{
    if(o.isMesh){o.geometry?.dispose();if(o.userData.mobOwnMaterial)o.material?.dispose()}
  });
}
function newMobBiomeOK(type,bio,h,x,z){
  if(type==='deer')return [0,1,3,8].includes(bio);
  if(type==='wolf')return [1,3,4,5,8].includes(bio);
  if(type==='bear')return [1,3,4,8].includes(bio);
  if(type==='boar')return [0,1,5,8].includes(bio);
  if(type==='crocodile')return [5,7,8].includes(bio)&&h<=SEA+6;
  if(type==='elephant')return [0,8].includes(bio)&&h<SEA+17;
  if(type==='eagle')return [0,1,3,4,8].includes(bio)&&h<WORLD_TOP-8;
  if(type==='shark')return (bio===6||bio===7)&&h<SEA-2&&get(x,SEA-1,z)===B.WATER;
  return false;
}
// Winged animals and sharks need continuous movement through three dimensions.
// Collision tests sample actual voxels so they cannot fly through roofs/stone.
function updateFlyingOrSwimmingMob(m,dt,now){
  const d=m.userData,type=d.type,isEagle=type==='eagle';
  const bx=Math.round(m.position.x),bz=Math.round(m.position.z);
  d.t=Math.max(0,(d.t||0)-dt);
  if(d.t<=0){
    d.t=2.8+Math.random()*3.5;
    d.angle+=(Math.random()-.5)*(isEagle?1.3:1.7);
  }
  if(d.fleeTime>0){
    d.fleeTime-=dt;
    const awayX=m.position.x-player.pos.x,awayZ=m.position.z-player.pos.z;
    if(awayX*awayX+awayZ*awayZ>1)d.angle=Math.atan2(awayX,awayZ);
  }
  const top=surfaceAt(bx,bz);
  const drift=Math.sin(now*.0015+d.phase);
  if(isEagle){
    // Neutral in the wild: circles overhead, only dives and pecks back
    // when a player has attacked it first.
    const dx=player.pos.x-m.position.x,dz=player.pos.z-m.position.z;
    const dist=Math.hypot(dx,dz);
    const provoked=d.hostile===true&&dist<24&&!dead;
    if(d.hostile&&!provoked)d.hostile=false;
    if(provoked)d.angle=Math.atan2(dx,dz);
    const targetY=provoked
      ?Math.max(top+2.20,Math.min(WORLD_TOP-3,player.pos.y+1.8))
      :Math.max(top+3.8,Math.min(WORLD_TOP-3,top+6.2+drift*.5));
    const dy=Math.max(-3.0,Math.min(3.0,(targetY-m.position.y)*(provoked?1.35:.75)));
    const vx=Math.sin(d.angle)*d.speed*(provoked?1.35:1)*dt;
    const vz=Math.cos(d.angle)*d.speed*(provoked?1.35:1)*dt;
    const nextY=Math.min(WORLD_TOP-2,Math.max(top+(provoked?2.12:2.5),m.position.y+dy*dt));
    const nx=m.position.x+vx,nz=m.position.z+vz;
    if(!solid(get(Math.round(nx),Math.round(nextY),Math.round(nz)))&&
       !solid(get(Math.round(nx),Math.round(nextY+1),Math.round(nz)))&&
       surfaceAt(Math.round(nx),Math.round(nz))<nextY-2.2){
      m.position.set(nx,nextY,nz);
    }else{
      d.angle+=Math.PI*.57;
      m.position.y=Math.min(WORLD_TOP-2,m.position.y+dt*.7);
    }
    d.attackCooldown=Math.max(0,(d.attackCooldown||0)-dt);
    if(provoked&&dist<2.3&&Math.abs(player.pos.y-m.position.y)<3.1&&d.attackCooldown<=0){
      d.attackCooldown=1.75;
      damagePlayer(2,'ワシの急降下攻撃',m.position);
    }
  }else if(activeMap==='testworld'){
    // Keep a shark visible for model testing even on a waterless stone plane.
    m.position.y=top+1.28+drift*.05;
    d.attackCooldown=Math.max(0,(d.attackCooldown||0)-dt);
  }else{
    // Sharks stay submerged. Reject any proposed tile lacking actual water.
    const swimY=Math.min(SEA-1.05,Math.max(top+1.15,m.position.y+drift*dt*.11));
    const nx=m.position.x+Math.sin(d.angle)*d.speed*dt;
    const nz=m.position.z+Math.cos(d.angle)*d.speed*dt;
    const iy=Math.round(swimY);
    if(get(Math.round(nx),iy,Math.round(nz))===B.WATER&&
       get(Math.round(nx),iy+1,Math.round(nz))===B.WATER&&
       !solid(get(Math.round(nx),iy-1,Math.round(nz)))){
      m.position.set(nx,swimY,nz);
    }else d.angle+=(Math.PI*.47)+(Math.random()-.5)*.60;
    // Ocean predator: only follows/attacks swimmers, never walks ashore.
    const dx=player.pos.x-m.position.x,dz=player.pos.z-m.position.z;
    const dist=Math.hypot(dx,dz);
    d.attackCooldown=Math.max(0,(d.attackCooldown||0)-dt);
    if(dist<9&&Math.abs(player.pos.y-m.position.y)<4&&playerInWater()){
      d.angle=Math.atan2(dx,dz);
      if(dist<1.8&&d.attackCooldown<=0){
        d.attackCooldown=1.7;
        damagePlayer(NEW_MOB_STATS.shark.damage,'サメの噛みつき',m.position);
      }
    }
  }
  m.rotation.y=d.angle+Math.PI;
  newMobModels.animate(m,now*.001,true);
}
function updateNewLandMob(m,dt,now){
  const d=m.userData,info=NEW_MOB_STATS[d.type];
  if(!info)return false;
  const dx=player.pos.x-m.position.x,dz=player.pos.z-m.position.z;
  const dist=Math.hypot(dx,dz),diffY=Math.abs(player.pos.y-m.position.y);
  d.attackCooldown=Math.max(0,(d.attackCooldown||0)-dt);
  // Wolves and bears notice nearby players; boars and elephants fight back
  // only when provoked; crocodiles hunt near water and swamp banks.
  if((d.type==='wolf'&&dist<7&&diffY<2.5)||
     (d.type==='bear'&&dist<5&&diffY<2.6)||
     (d.type==='crocodile'&&dist<6&&diffY<2.6&&playerInWater()))
    d.hostile=true;
  if(!d.hostile||dist>23||diffY>4)return false;
  d.angle=Math.atan2(dx,dz);
  m.rotation.y=d.angle+Math.PI;
  const reach=d.type==='elephant'?2.5:d.type==='bear'?2.0:d.type==='crocodile'?2.25:1.48;
  let moved=false;
  if(dist>reach*.77){
    const chaseSpeed=d.type==='elephant'?2.4:d.type==='bear'?2.3:d.type==='crocodile'?1.6:d.type==='boar'?3.2:3.1;
    const step=chaseSpeed*dt;
    moved=mobWalkStep(m,d.angle,step);
    if(!moved)moved=mobWalkStep(m,d.angle+.70,step*.8);
  }
  if(dist<=reach&&diffY<2.3&&d.attackCooldown<=0){
    d.attackCooldown=d.type==='elephant'?2.4:1.4;
    damagePlayer(info.damage||2,info.name+'の攻撃',m.position);
  }
  newMobModels.animate(m,now*.001,moved);
  return true;
}


/* Testworld creative spawner. The catalog uses the actual game item/mob IDs,
   not duplicated test-only models. This mode NEVER appears in The Overworld. */
const TEST_MOB_CATALOG=[
  {key:'sheep',type:0,name:'ヒツジ',icon:'🐑'},
  {key:'pig',type:1,name:'ブタ',icon:'🐷'},
  {key:'cow',type:2,name:'ウシ',icon:'🐄'},
  {key:'horse',type:'horse',name:'馬',icon:'🐴'},
  {key:'bison',type:'bison',name:'バッファロー',icon:'🐃'},
  {key:'lion',type:'lion',name:'ライオン',icon:'🦁'},
  {key:'anaconda',type:'anaconda',name:'オオアナコンダ',icon:'🐍'},
  {key:'deer',type:'deer',name:'シカ',icon:'🦌'},
  {key:'wolf',type:'wolf',name:'オオカミ',icon:'🐺'},
  {key:'bear',type:'bear',name:'ヒグマ',icon:'🐻'},
  {key:'boar',type:'boar',name:'イノシシ',icon:'🐗'},
  {key:'eagle',type:'eagle',name:'ワシ',icon:'🦅'},
  {key:'crocodile',type:'crocodile',name:'ワニ',icon:'🐊'},
  {key:'shark',type:'shark',name:'サメ',icon:'🦈'},
  {key:'elephant',type:'elephant',name:'ゾウ',icon:'🐘'},
  {key:'zombie',type:'zombie',name:'ゾンビ',icon:'🧟'},
  {key:'skeleton',type:'skeleton',name:'スケルトン',icon:'💀'},
  {key:'spider',type:'spider',name:'巨大クモ',icon:'🕷️'},
  {key:'villager0',type:'villager',variant:0,name:'村人',icon:'🧑'},
  {key:'villager1',type:'villager',variant:1,name:'農民',icon:'🧑‍🌾'},
  {key:'villager2',type:'villager',variant:2,name:'職人',icon:'🧑‍🔧'},
  {key:'villager3',type:'villager',variant:3,name:'学者',icon:'🧑‍🏫'},
  {key:'golem',type:'golem',name:'ストーンゴーレム',icon:'🗿'},
  {key:'chimera',type:'chimera',name:'キメラ',icon:'🐲'}
];
const TEST_MOB_BY_KEY=new Map(TEST_MOB_CATALOG.map(row=>[row.key,row]));
const TEST_ITEM_IDS=[...new Set([
  ...Object.values(B).filter(id=>id>B.AIR&&id<=B.BEDROCK),
  ...NEW_BUILD_BLOCKS,
  ...Object.values(I),...JOB_WEAPON_IDS
])].filter(id=>Number.isInteger(id)&&names[id]).sort((a,b)=>a-b);

// Test-spawned models use the same builders, AI, hit boxes, drops and attacks.
function testCreateMob(key,x,y,z,angle,hp=null,netId=null,saddled=false){
  const def=TEST_MOB_BY_KEY.get(key);if(!def)return null;
  const type=def.type;
  if(type==='chimera'){
    const m=makeChimeraMob(x,y,z,angle,
      Number.isFinite(hp)&&hp>0?hp:CHIMERA_MAX_HEALTH,netId);
    m.userData.testSpawned=true;m.userData.testCatalogKey=key;
    return m;
  }
  let m=null,alreadyAnimated=false;
  if(NEW_MOB_TYPES.has(type)){
    m=createNewMob(type,x,y,z);alreadyAnimated=true;
  }else if(type===0)m=buildSheep();
  else if(type===1)m=buildPig();
  else if(type===2)m=buildCow();
  else if(type==='horse')m=buildHorse();
  else if(type==='bison')m=buildBison();
  else if(type==='lion')m=buildLion();
  else if(type==='anaconda')m=buildAnaconda();
  else if(type==='zombie')m=buildZombie();
  else if(type==='skeleton')m=buildSkeleton();
  else if(type==='villager')m=villagerModels.build(def.variant||0);
  if(!m)return null;
  const stats=NEW_MOB_STATS[type];
  const baseHp=stats?.hp??(type==='bison'||type==='lion'||type==='anaconda'?100:
    type==='villager'?20:type==='horse'?10:type==='zombie'?10:type==='skeleton'?8:5);
  const speed=stats?.speed??(type==='zombie'?1.45:type==='skeleton'?1.1:
    type==='villager'?.68:type==='horse'?.70:type==='bison'?.28:
    type==='lion'?.38:type==='anaconda'?.31:.32);
  m.position.set(x,y,z);m.rotation.y=angle+Math.PI;
  m.userData={...m.userData,type,name:def.name,angle,
    hp:Math.max(1,Math.min(300,Number.isFinite(hp)?hp:baseHp)),xp:stats?.xp??12,
    speed,t:2,phase:Math.random()*Math.PI*2,fleeTime:0,hitFlash:0,
    attackCooldown:1,hostile:type==='shark'||type==='spider',
    spawnedAt:performance.now(),testSpawned:true,testCatalogKey:key,
    netId:netId||crypto.randomUUID(),saddled:!!saddled,
    variant:def.variant||0,
    homeX:x,homeZ:z,homeY:Math.round(y-.04),villageKey:'test:'+x+':'+z};
  if(!alreadyAnimated)setupMobStepAnimation(m);
  if(type==='horse'&&saddled)showHorseSaddle(m);
  scene.add(m);mobs.push(m);return m;
}
function serializeTestMobs(){
  return mobs.filter(m=>m.userData.testSpawned&&m.userData.hp>0)
    .slice(0,320).map(m=>({
      key:m.userData.testCatalogKey,
      x:+m.position.x.toFixed(2),y:+m.position.y.toFixed(2),
      z:+m.position.z.toFixed(2),angle:+(m.userData.angle||0).toFixed(3),
      hp:m.userData.hp,netId:ensureMobId(m),
      saddled:!!m.userData.saddled
    }));
}
function restoreTestMobs(rows){
  if(activeMap!=='testworld'||multiRole==='guest'||!Array.isArray(rows))return;
  for(const m of rows.slice(0,320)){
    if(!m||!TEST_MOB_BY_KEY.has(m.key)||
       ![m.x,m.y,m.z,m.angle,m.hp].every(Number.isFinite)||
       Math.abs(m.x)>1000000||Math.abs(m.z)>1000000||
       m.y<Y_MIN||m.y>WORLD_TOP||m.hp<=0||m.hp>300)continue;
    testCreateMob(m.key,m.x,m.y,m.z,m.angle,m.hp,
      typeof m.netId==='string'&&/^[0-9a-f-]{36}$/.test(m.netId)?m.netId:null,
      m.saddled===true);
  }
}
function testMobHeight(type,ground){
  return ground+(type==='zombie'||type==='skeleton'||type==='spider'||type==='chimera'?.51:
    type==='eagle'?5.0:type==='shark'?1.28:.04);
}
function testSpawnMobs(key,qty,center=player.pos){
  if(activeMap!=='testworld'||multiRole==='guest'||!worldReady)return 0;
  const def=TEST_MOB_BY_KEY.get(key);
  if(!def||!center||![center.x,center.y,center.z].every(Number.isFinite))return 0;
  qty=Math.max(1,Math.min(20,Math.floor(qty)));
  let made=0;
  for(let index=0;index<qty;index++){
    if(multiRole==='host'&&mobs.length>=110)break; // existing P2P mob-state capacity
    let point=null,angle=0;
    for(let attempt=0;attempt<65;attempt++){
      const sweep=index*2.399963+attempt*.95;
      const radius=5.8+Math.floor((index+attempt)/6)*2.5;
      const forwardAngle=Math.atan2(-Math.sin(player.yaw),-Math.cos(player.yaw));
      const direction=forwardAngle+sweep-(Math.PI*.8);
      const x=Math.round(center.x+Math.cos(direction)*radius);
      const z=Math.round(center.z+Math.sin(direction)*radius);
      const ground=surfaceAt(x,z);
      const y=testMobHeight(def.type,ground);
      angle=Math.atan2(center.x-x,center.z-z);
      if(ground>WORLD_TOP-9||!solid(get(x,ground,z)))continue;
      const probe={userData:{type:def.type,angle},position:{x,y,z}};
      if(!mobSpaceFree(probe,x,y,z,angle))continue;
      const clearance=def.type==='chimera'||def.type==='elephant'?5.2:
        def.type==='anaconda'||def.type==='bison'||def.type==='lion'?3.8:2.4;
      if(mobs.some(m=>Math.hypot(m.position.x-x,m.position.z-z)<clearance))continue;
      if(Math.hypot(center.x-x,center.z-z)<4)continue;
      point={x,y,z};break;
    }
    if(!point)break;
    try{
      const spawned=testCreateMob(key,point.x,point.y,point.z,angle);
      if(spawned)made++;
    }catch(error){console.warn('Testworld creature creation failed',error);break}
  }
  if(made)markSaveDirty();
  return made;
}
function testClearMobs(){
  if(activeMap!=='testworld'||multiRole==='guest'||!worldReady)return 0;
  const rows=mobs.filter(m=>m.userData.testSpawned);
  for(const m of rows){
    if(ridingHorse===m)ridingHorse=null;
    removeZombie(m);
  }
  if(rows.length)markSaveDirty();
  return rows.length;
}
function testWorldStatus(text){$('testWorldStatus').textContent=text}
function testReadCount(){
  const input=$('testWorldQty'),n=Math.floor(Number(input.value));
  if(!Number.isFinite(n)||n<1){input.value='1';return 1}
  return Math.min(9999,n);
}
function testGrantItem(id,qty){
  if(activeMap!=='testworld'||!worldReady||!started||!TEST_ITEM_IDS.includes(id))return;
  const left=addItem(id,qty),held=qty-left;
  // The 36 inventory slots aren't infinite: spill any overflow as ONE world
  // item entity, so even a full bag cannot discard the requested materials.
  if(left>0)spawnWorldDrop(id,left,Math.round(player.pos.x),player.pos.y+1.1,
    Math.round(player.pos.z),{pickupDelay:1.2});
  testWorldStatus((names[id]||'アイテム')+' ×'+qty+
    (left?'（持ち物 '+held+'・足元 '+left+'）':' を持ち物に追加しました'));
}
function testWorldRenderCatalog(){
  const catalog=$('testWorldCatalog');
  const search=$('testWorldSearch').value.trim().toLocaleLowerCase('ja');
  const isItems=activeTestTab==='items';
  const rows=isItems?TEST_ITEM_IDS.map(id=>({key:id,name:names[id]})):TEST_MOB_CATALOG;
  const shown=rows.filter(r=>String(r.name||'').toLocaleLowerCase('ja').includes(search));
  const list=document.createDocumentFragment();
  for(const row of shown){
    const entry=document.createElement('div');entry.className='test-world-row';
    const main=document.createElement('div');main.className='test-world-row-name';
    if(isItems){main.appendChild(itemCanvas(row.key,'item-icon'))}
    else{const icon=document.createElement('span');icon.className='test-mob-icon';icon.textContent=row.icon;main.appendChild(icon)}
    const title=document.createElement('span');title.textContent=row.name;main.appendChild(title);
    const action=document.createElement('button');action.type='button';
    action.textContent=isItems?'追加':'出す';
    action.setAttribute('aria-label',row.name+'を出す');
    action.addEventListener('click',()=>{
      if(activeMap!=='testworld'||!worldReady||!started)return;
      const qty=testReadCount();
      if(isItems){testGrantItem(row.key,qty);return}
      const amount=Math.min(qty,20);
      if(multiRole==='guest'){
        if(!multiplayerNetwork.connected){testWorldStatus('マルチプレイに接続されていません');return}
        multiplayerNetwork.send({t:'testSpawnMobs',key:row.key,qty:amount});
        testWorldStatus(row.name+' ×'+amount+' の出現をホストに依頼中…');
        return;
      }
      const made=testSpawnMobs(row.key,amount);
      if(multiRole==='host'&&made&&multiplayerNetwork.connected)
        multiplayerNetwork.send(multiMobSnapshot());
      testWorldStatus(row.name+' ×'+made+'体 出しました'+
        (made<amount?'（空き場所またはマルチ上限を確認してください）':'')+
        (qty>20?' ／ 1回20体まで。繰り返し出せます':''));
    });
    entry.append(main,action);list.appendChild(entry);
  }
  if(!shown.length){const empty=document.createElement('p');empty.textContent='該当するものがありません';list.appendChild(empty)}
  catalog.replaceChildren(list);
}
function testWorldSelectTab(tab){
  activeTestTab=tab;
  $('testItemsTab').setAttribute('aria-pressed',String(tab==='items'));
  $('testMobsTab').setAttribute('aria-pressed',String(tab==='mobs'));
  $('testWorldClearMobs').hidden=tab!=='mobs';
  $('testWorldClearItems').hidden=tab!=='items';
  $('testWorldQty').max=tab==='items'?'9999':'20';
  $('testWorldQty').value=tab==='items'?'64':'1';
  $('testWorldSearch').value='';
  testWorldStatus(tab==='items'?'好きなアイテムを持ち物に追加できます。':'好きなモブを何度でも召喚できます。');
  testWorldRenderCatalog();
}
function setTestPanelOpen(open){
  if(open&&(activeMap!=='testworld'||!worldReady||!started||dead))return;
  if(open){
    if(inventoryOpen)setInventoryOpen(false);
    if(craftOpen)setCraftOpen(false);
    if(chestOpen)setChestOpen(false);
    primaryActionStop();document.exitPointerLock?.();
    Object.keys(keys).forEach(k=>keys[k]=false);resetSprint();
  }
  testPanelOpen=!!open;
  $('testWorldPanel').classList.toggle('open',testPanelOpen);
  $('testWorldPanel').setAttribute('aria-hidden',String(!testPanelOpen));
  if(testPanelOpen)testWorldSelectTab(activeTestTab);
  else if(started&&!matchMedia('(pointer:coarse)').matches)
    renderer.domElement.requestPointerLock?.();
}
$('testWorldOpen').addEventListener('click',()=>setTestPanelOpen(true));
$('testWorldClose').addEventListener('click',()=>setTestPanelOpen(false));
$('testWorldPanel').addEventListener('pointerdown',e=>{if(e.target===$('testWorldPanel'))setTestPanelOpen(false)});
$('testItemsTab').addEventListener('click',()=>testWorldSelectTab('items'));
$('testMobsTab').addEventListener('click',()=>testWorldSelectTab('mobs'));
$('testWorldSearch').addEventListener('input',testWorldRenderCatalog);
$('testWorldClearItems').addEventListener('click',()=>{
  if(activeMap!=='testworld'||!worldReady)return;
  clearInventorySlots();syncDerivedInventory();renderHotbar();
  applyArmorAppearance(playerAvatar,equippedArmor);refreshShieldControl();markSaveDirty();
  testWorldStatus('持ち物を空にしました（装備中の防具・左手も解除）');
});
$('testWorldClearMobs').addEventListener('click',()=>{
  if(activeMap!=='testworld'||!worldReady)return;
  if(multiRole==='guest'){
    if(!multiplayerNetwork.connected){testWorldStatus('マルチプレイに接続されていません');return}
    multiplayerNetwork.send({t:'testClearMobs'});
    testWorldStatus('ホストにモブ削除を依頼中…');return;
  }
  const removed=testClearMobs();
  if(multiRole==='host'&&multiplayerNetwork.connected)multiplayerNetwork.send(multiMobSnapshot());
  testWorldStatus('出したモブを'+removed+'体削除しました');
});

let passiveSpawnCooldown=20;
const MOB_SPAWN_WEIGHTS=[
  {type:0,weight:24},      // sheep: common
  {type:1,weight:24},      // pig: common
  {type:2,weight:24},      // cow: common
  {type:'horse',weight:18},// horse: a little rarer than normal farm animals
  {type:'bison',weight:5}, // bison: rare, dangerous if provoked
  {type:'lion',weight:5},  // lion: rare, attacks within six blocks
  {type:'anaconda',weight:5}, // original giant anaconda
  {type:'deer',weight:15},{type:'wolf',weight:9},
  {type:'bear',weight:5},{type:'boar',weight:12},
  {type:'crocodile',weight:7},{type:'eagle',weight:11},
  {type:'shark',weight:12},{type:'elephant',weight:4}
];
function chooseWildMob(){
  // Normalize against the actual total: adding a fifth-weight snake must
  // never make the final entry unreachable (old hardcoded total was 100).
  let roll=Math.random()*MOB_SPAWN_WEIGHTS.reduce((n,e)=>n+e.weight,0);
  for(const entry of MOB_SPAWN_WEIGHTS){
    roll-=entry.weight;
    if(roll<0)return entry.type;
  }
  return 2;
}
// The species-selection weights stay identical for bison, lions and
// anacondas (5 / 105 each). Retry unsuitable terrain instead of
// silently discarding a rare roll because the enlarged animal needs room.
const MAX_WILD_ANIMALS=18;
const WILD_COMMON_LIFETIME_MS=3*60*1000,WILD_RARE_LIFETIME_MS=8*60*1000;
function spawnPassiveMob(anchor=player.pos){
  const wildCount=mobs.filter(m=>m.userData.type!=='zombie'&&m.userData.type!=='skeleton'&&m.userData.type!=='spider'&&m.userData.type!=='chimera'&&m.userData.type!=='villager'&&m.userData.type!=='golem'&&!m.userData.saddled).length;
  if(wildCount>=(multiRole==='host'?30:MAX_WILD_ANIMALS))return false;

  // Choose the species ONCE before checking locations. A bison failing its
  // first flat-ground test still gets a chance to spawn as a bison.
  const type=chooseWildMob();
  const large=type==='bison'||type==='lion'||type==='anaconda'||type==='elephant'||type==='bear'||type==='crocodile';
  const special=type==='eagle'||type==='shark';
  const tries=special?90:type==='anaconda'?30:NEW_WILD_TYPES.has(type)?45:large?18:8;
  const phase=Math.random()*Math.PI*2;
  let g=null;
  for(let attempt=0;attempt<tries;attempt++){
    const angle=phase+attempt*2.399963229728653; // Spread attempts around the player.
    const dist=19+Math.random()*17;
    const x=Math.floor(anchor.x+Math.cos(angle)*dist);
    const z=Math.floor(anchor.z+Math.sin(angle)*dist);
    const h=surfaceAt(x,z),bio=biomeAt(x,z);
    if(NEW_WILD_TYPES.has(type)){
      if(!newMobBiomeOK(type,bio,h,x,z))continue;
      if(type==='shark'){
        if(get(x,SEA-1,z)!==B.WATER||get(x,SEA-2,z)!==B.WATER)continue;
      }else if(h<=SEA||bio===2||bio===6||(bio===7&&type!=='crocodile'))continue;
    }else if(h<=SEA||bio===2||bio===6||bio===7)continue;
    if(mobs.some(m=>Math.hypot(m.position.x-x,m.position.z-z)<(large?7:5)))continue;

    // Only allocate geometry after a plausible terrain/biome match.
    const initialY=type==='eagle'?Math.min(WORLD_TOP-3,h+6):
      type==='shark'?SEA-1.5:h+.04;
    if(!g)g=NEW_WILD_TYPES.has(type)?createNewMob(type,x,initialY,z):
      type===0?buildSheep():type===1?buildPig():type===2?buildCow():
      type==='horse'?buildHorse():type==='bison'?buildBison():
      type==='lion'?buildLion():buildAnaconda();
    g.position.set(x,initialY,z);
    const heading=hash2(x,z)*Math.PI*2;
    g.userData.type=type;g.userData.angle=heading;
    if(type!=='shark'&&!mobSpaceFree(g,x,g.position.y,z,heading))continue;
    if(type==='eagle'&&solid(get(x,Math.round(initialY+1),z)))continue;

    // Turn the model to match the tested collision footprint immediately.
    g.rotation.y=heading+Math.PI;
    if(!NEW_WILD_TYPES.has(type)){
      g.userData={
        ...g.userData,
        angle:heading,
        t:2+hash2(z,x)*3,
        speed:type==='horse'?.70:type==='bison'?.28:type==='lion'?.38:type==='anaconda'?.31:.22+hash2(x+4,z+2)*.24,
        hp:type==='horse'?10:large?100:type===2?5:3,
        xp:type==='horse'?24:type==='bison'?85:type==='lion'||type==='anaconda'?90:type===2?18:type===1?14:12,
        name:type===0?'ヒツジ':type===1?'ブタ':type===2?'ウシ':
          type==='horse'?'馬':type==='bison'?'バイソン':type==='lion'?'ライオン':'オオアナコンダ',
        type,
        spawnedAt:performance.now(),
        hostile:false,attackCooldown:0,chaseTime:0,phase:Math.random()*Math.PI*2
      };
      setupMobStepAnimation(g);
    }else{
      // Actual names, HP and behavior are registered by createNewMob.
      g.userData.angle=heading;g.userData.t=2+hash2(z,x)*3;
    }
    scene.add(g);mobs.push(g);
    return true;
  }
  // All sampled locations were unsuitable, not an invalid animal species.
  if(g)disposeUnusedNewMob(g);
  return false;
}
function multiSpawnAnchors(){
  const anchors=[player.pos];
  if(multiRole==='host'){
    const now=performance.now();
    for(const guest of multiGuestRecords.values())
      if(guest.player&&now-(guest.lastPoseAt||0)<5000&&
         Number.isFinite(guest.player.x)&&Number.isFinite(guest.player.z))
        anchors.push(guest.player);
  }
  return anchors;
}
// Four profession variants per village; villagers are regenerated on demand
// near the player, not stored as disposable passive wildlife. Host owns them.
let villagerSpawnCooldown=3;
const villageCitizenLastSpawn=new Map(),villageGuardianLastSpawn=new Map(),MAX_VILLAGERS=20;
const VILLAGER_WANDER_RADIUS=14;
function spawnVillager(site,idx){
  const locations=[[-11,-5],[11,-5],[-11,5],[11,5]];
  const [dx,dz]=locations[idx%4],x=site.x+dx,z=site.z+dz,y=site.y+.04;
  if(!chunks.has(chunkKey(chunkCoord(x),chunkCoord(z))))return false;
  if(!solid(get(x,site.y,z))||get(x,site.y+1,z)!==B.AIR)return false;
  if(mobs.some(m=>Math.hypot(m.position.x-x,m.position.z-z)<1.1))return false;
  const g=villagerModels.build(idx%4),angle=Math.random()*Math.PI*2;
  g.position.set(x,y,z);
  g.rotation.y=angle+Math.PI;
  g.userData={...g.userData,type:'villager',name:['村人','農民','職人','学者'][idx%4],
    hp:20,xp:2,villageKey:site.key,homeX:site.x,homeY:site.y,homeZ:site.z,
    variant:idx%4,angle,speed:.68,t:1+Math.random()*3,
    phase:Math.random()*Math.PI*2,fleeTime:0,hitFlash:0,
    spawnedAt:performance.now()};
  if(!mobSpaceFree(g,x,y,z,angle)){disposeUnusedNewMob(g);return false}
  setupMobStepAnimation(g);
  scene.add(g);mobs.push(g);return true;
}
function spawnVillageGuardian(site){
  const x=site.x+2,z=site.z+7,y=site.y+.04;
  if(!chunks.has(chunkKey(chunkCoord(x),chunkCoord(z))))return false;
  if(!solid(get(x,site.y,z))||get(x,site.y+1,z)!==B.AIR)return false;
  const g=createNewMob('golem',x,y,z);
  g.userData.villageKey=site.key;
  g.userData.homeX=site.x;g.userData.homeY=site.y;g.userData.homeZ=site.z;
  g.userData.t=2.0;
  if(!mobSpaceFree(g,x,y,z,g.userData.angle)){disposeUnusedNewMob(g);return false}
  scene.add(g);mobs.push(g);return true;
}
function updateVillageGuardian(m,dt,now){
  const d=m.userData;
  d.attackCooldown=Math.max(0,(d.attackCooldown||0)-dt);
  // Neutral toward players: never attack on sight. Retaliate only against
  // the player who damaged this golem (host or a specific multiplayer guest).
  // After twelve seconds, or when the attacker leaves, return to patrol.
  if(d.hostile&&d.hostileTargetId){
    let target=null,peerId=null;
    if(d.hostileTargetId==='host'){
      if(!dead)target=player.pos;
    }else if(multiRole==='host'){
      for(const [id,record] of multiGuestRecords){
        if(record.id===d.hostileTargetId&&record.player&&
           now-(record.lastPoseAt||0)<5000){
          target=record.player;peerId=id;break;
        }
      }
    }
    const range=target?Math.hypot(target.x-m.position.x,target.z-m.position.z):Infinity;
    const homeRange=target?Math.hypot(target.x-d.homeX,target.z-d.homeZ):Infinity;
    if(now<(d.hostileUntil||0)&&range<24&&homeRange<31&&
       Math.abs(target.y-m.position.y)<4.5){
      d.angle=Math.atan2(target.x-m.position.x,target.z-m.position.z);
      let moving=false;
      if(range>2.25){
        moving=mobWalkStep(m,d.angle,2.1*dt);
        if(!moving)moving=mobWalkStep(m,d.angle+Math.PI*.5,1.25*dt);
      }
      if(range<=2.75&&Math.abs(target.y-m.position.y)<3.1&&
         d.attackCooldown<=0){
        d.attackCooldown=1.85;
        if(peerId){
          multiplayerNetwork.send({t:'golemStrike',
            x:m.position.x,y:m.position.y,z:m.position.z,id:ensureMobId(m)},peerId);
        }else damagePlayer(NEW_MOB_STATS.golem.damage,'ゴーレムの攻撃',m.position);
      }
      m.rotation.y=d.angle+Math.PI;
      newMobModels.animate(m,now*.001,moving);
      return;
    }
    d.hostile=false;d.hostileTargetId=null;d.hostileUntil=0;
  }
  const villains=mobs.filter(other=>other!==m&&other.userData.hp>0&&
    ['zombie','skeleton','spider','wolf','bear','lion'].includes(other.userData.type)&&
    Math.hypot(other.position.x-d.homeX,other.position.z-d.homeZ)<24);
  let enemy=null,range=Infinity;
  for(const v of villains){
    const dd=Math.hypot(v.position.x-m.position.x,v.position.z-m.position.z);
    if(dd<range){range=dd;enemy=v}
  }
  let moving=false;
  if(enemy&&range<17){
    const dx=enemy.position.x-m.position.x,dz=enemy.position.z-m.position.z;
    d.angle=Math.atan2(dx,dz);
    if(range>2.15){
      moving=mobWalkStep(m,d.angle,1.45*dt);
      if(!moving)moving=mobWalkStep(m,d.angle+Math.PI*.5,.9*dt);
    }
    if(range<=2.55&&Math.abs(enemy.position.y-m.position.y)<3.1&&d.attackCooldown<=0){
      d.attackCooldown=1.85;
      enemy.userData.hp-=NEW_MOB_STATS.golem.damage;
      setMobHitFlash(enemy);
      if(enemy.userData.hp<=0){
        dropMobLoot(enemy);
        removeZombie(enemy);
      }
    }
  }else{
    const dx=d.homeX-m.position.x,dz=d.homeZ-m.position.z;
    const dist=Math.hypot(dx,dz);
    if(dist>11){d.angle=Math.atan2(dx,dz);d.t=1;}
    else{
      d.t=Math.max(0,(d.t||0)-dt);
      if(d.t<=0){d.t=2+Math.random()*3;d.angle+=(Math.random()-.5)*2}
    }
    moving=mobWalkStep(m,d.angle,.58*dt);
  }
  m.rotation.y=d.angle+Math.PI;
  newMobModels.animate(m,now*.001,moving);
}
function updateVillager(m,dt,now){
  const d=m.userData;
  const dx=d.homeX-m.position.x,dz=d.homeZ-m.position.z;
  const distance=Math.hypot(dx,dz);
  if(d.fleeTime>0){
    d.fleeTime=Math.max(0,d.fleeTime-dt);
    // Escape while threatened, returning to the village afterwards.
  }else if(distance>VILLAGER_WANDER_RADIUS){
    d.angle=Math.atan2(dx,dz);
    d.t=2.8;
  }else{
    d.t=Math.max(0,(d.t||0)-dt);
    if(d.t<=0){d.t=1.1+Math.random()*3.7;d.angle+=(Math.random()-.5)*2.2}
  }
  const stride=d.fleeTime>0?2.1:.75,step=stride*dt;
  let moved=mobWalkStep(m,d.angle,step,false);
  if(!moved){
    d.angle+=(Math.random()<.5?1:-1)*(Math.PI*.55);
    d.t=.6;
    moved=mobWalkStep(m,d.angle,step*.55,false);
  }
  m.rotation.y=d.angle+Math.PI;
  villagerModels.animate(m,now*.001,moved);
}
function updateVillagerSpawning(dt){
  if(multiRole==='guest'||!worldReady||activeMap==='testworld')return;
  villagerSpawnCooldown-=dt;
  if(villagerSpawnCooldown>0)return;
  villagerSpawnCooldown=7.5;
  const anchors=multiSpawnAnchors(),now=performance.now();
  // Only a small number of occupied villages are loaded. Do not keep NPCs
  // hundreds of blocks away (or drain mobile Safari's GPU).
  for(const m of [...mobs]){
    if(m.userData.type!=='villager'&&m.userData.type!=='golem')continue;
    const nearby=Math.min(...anchors.map(a=>Math.hypot(m.position.x-a.x,m.position.z-a.z)));
    if(nearby>105)removeZombie(m);
  }
  for(const anchor of anchors){
    for(const site of villageWorld().nearby(anchor.x,anchor.z,55)){
      if(Math.hypot(anchor.x-site.x,anchor.z-site.z)>60)continue;
      if(!mobs.some(m=>m.userData.type==='golem'&&m.userData.villageKey===site.key)){
        const since=now-(villageGuardianLastSpawn.get(site.key)||0);
        if(since>120_000||!villageGuardianLastSpawn.has(site.key)){
          if(spawnVillageGuardian(site))villageGuardianLastSpawn.set(site.key,now);
        }
      }
      if(mobs.filter(m=>m.userData.type==='villager').length>=MAX_VILLAGERS)return;
      const existing=new Set(mobs.filter(m=>m.userData.type==='villager'&&
        m.userData.villageKey===site.key).map(m=>m.userData.variant));
      if(existing.size>=4)continue;
      if(existing.size>0&&now-(villageCitizenLastSpawn.get(site.key)||0)<60_000)continue;
      let any=false;
      for(let i=0;i<4;i++){
        if(existing.has(i))continue;
        if(spawnVillager(site,i))any=true;
      }
      if(any)villageCitizenLastSpawn.set(site.key,now);
    }
  }
}
function updatePassiveSpawning(dt){
  if(multiRole==='guest'||activeMap==='testworld')return;
  passiveSpawnCooldown-=dt;
  if(passiveSpawnCooldown>0)return;
  passiveSpawnCooldown=25;
  const anchors=multiSpawnAnchors();

  // Before, spawning stopped permanently once only SIX animals were nearby.
  // Retire old wild animals beyond close range so stationary worlds continue
  // cycling spawn rolls, while keeping rare animals around much longer.
  const now=performance.now();
  for(let i=mobs.length-1;i>=0;i--){
    const m=mobs[i],ud=m.userData;
    if(ud.saddled||ud.type==='zombie'||ud.type==='skeleton'||ud.type==='spider'||ud.type==='chimera'||ud.type==='villager'||ud.type==='golem')continue;
    const distance=Math.min(...anchors.map(p=>Math.hypot(m.position.x-p.x,m.position.z-p.z)));
    const rare=ud.type==='bison'||ud.type==='lion'||ud.type==='anaconda'||
      NEW_WILD_TYPES.has(ud.type);
    const age=now-(ud.spawnedAt??now);
    if(distance>180||(distance>25&&age>(rare?WILD_RARE_LIFETIME_MS:WILD_COMMON_LIFETIME_MS))){
      removeZombie(m); // Shared safe scene/memory cleanup, not just for zombies.
    }
  }

  for(const anchor of anchors){
    const nearby=mobs.filter(m=>m.userData.type!=='zombie'&&m.userData.type!=='skeleton'&&m.userData.type!=='spider'&&m.userData.type!=='chimera'&&m.userData.type!=='villager'&&m.userData.type!=='golem'&&
      !m.userData.saddled&&Math.hypot(m.position.x-anchor.x,m.position.z-anchor.z)<55).length;
    const attempts=nearby<4?3:nearby<10?2:nearby<15?1:0;
    for(let i=0;i<attempts;i++)spawnPassiveMob(anchor);
  }
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
// Transient hurt feedback is not part of the save data or the player stats.
// The knockback impulse is kept separate from walking velocity, otherwise the
// movement controller would immediately cancel it on the following frame.
const PLAYER_HURT_FLASH_MS=420;
let playerHurtAt=-Infinity,playerHurtUntil=0,playerHurtSeq=0;
let playerKnockbackX=0,playerKnockbackZ=0,playerKnockbackTime=0;

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
// Fold-out low-poly wings are visible behind the character while gliding.
const gliderWings=new THREE.Group();
gliderWings.name='deployed hang glider';
gliderWings.position.set(0,1.34,.30);
for(const sign of [-1,1]){
  const sail=new THREE.Shape();
  sail.moveTo(0,.22);sail.lineTo(sign*.48,.52);
  sail.lineTo(sign*1.65,.22);sail.lineTo(sign*1.80,.02);
  sail.lineTo(sign*.87,-.14);sail.lineTo(0,.04);sail.closePath();
  const mesh=new THREE.Mesh(new THREE.ShapeGeometry(sail),
    new THREE.MeshLambertMaterial({color:sign<0?0x78aeb5:0x649faa,side:THREE.DoubleSide}));
  mesh.position.z=.11;gliderWings.add(mesh);
  const edge=new THREE.Mesh(new THREE.BoxGeometry(1.73,.052,.045),
    new THREE.MeshLambertMaterial({color:0x364a56}));
  edge.position.set(sign*.86,.24,.14);
  edge.rotation.z=sign*-.02;gliderWings.add(edge);
}
gliderWings.visible=false;
playerAvatar.add(gliderWings);
const avatarHeldItems=makeAvatarHeldItems(THREE,drawItemIcon);
// Body and armor flash red without recoloring any shared mob/player materials.
// Exclude meshes inside the hand-held item pivots: the body takes the hit,
// while the sword, torch and shield retain their normal colors.
const avatarDamageRed=new THREE.MeshBasicMaterial({
  color:0xdb4545,depthTest:true,depthWrite:true,toneMapped:false
});
// A screen hit pulse makes the damage unmistakable in first person,
// even when the held item covers most of the arm.
const damageScreenTint=document.createElement('div');
damageScreenTint.id='nexacraft-hurt-pulse';
Object.assign(damageScreenTint.style,{
  position:'fixed',inset:'0',pointerEvents:'none',zIndex:'19',
  background:'rgba(255,16,16,.15)',opacity:'0',
  willChange:'opacity'
});
document.body.appendChild(damageScreenTint);
function updateDamageScreenTint(now){
  const remaining=Math.max(0,playerHurtUntil-now);
  if(!remaining){damageScreenTint.style.opacity='0';return}
  const fraction=remaining/PLAYER_HURT_FLASH_MS;
  // Single quick, subtle pulse; no sustained strobe.
  damageScreenTint.style.opacity=String(Math.min(1,Math.sqrt(fraction)));
}
const HURT_TEST_MODE=new URLSearchParams(location.search).get('hurtTest')==='1';
let hurtTestPlayed=false;
function setAvatarDamageFlash(model,active){
  if(!model)return;
  let originals=model.userData.damageFlashOriginals;
  if(active){
    if(originals)return;
    originals=new Map();
    const equipped=model.userData.heldItemsView;
    const roots=new Set([equipped?.right,equipped?.left]);
    model.traverse(mesh=>{
      if(!mesh.isMesh)return;
      for(let node=mesh;node&&node!==model;node=node.parent){
        if(roots.has(node))return;
      }
      originals.set(mesh,mesh.material);
      mesh.material=avatarDamageRed;
    });
    model.userData.damageFlashOriginals=originals;
  }else if(originals){
    for(const [mesh,original] of originals)mesh.material=original;
    delete model.userData.damageFlashOriginals;
  }
}
// One-shot gestures are local timestamps. Multiplayer sends their sequence
// plus elapsed age, not a raw clock that differs between devices.
let avatarActionSeq=0,avatarActionKind=null,avatarActionAt=-Infinity;
function triggerAvatarAction(kind){
  avatarActionKind=kind;
  avatarActionAt=performance.now();
  avatarActionSeq=(avatarActionSeq+1)%100000000;
}
const VIEW_LABELS=['一人称','三人称（背面）','二人称風（正面）'];
let cameraMode=0;
// First-person hand is a true 3D viewmodel attached to the gameplay camera.
// Selection follows the actual 9-slot inventory, including stack depletion.
const firstPersonHand=makeFirstPersonHand(THREE,{
  scene,camera,drawItemIcon,
  getHeld:()=>inventorySlots[selectedHotbarIndex],
  getOffhand:()=>offhandItem,
  isGuarding:()=>shieldGuarding,
  isVisible:()=>started&&worldReady&&!dead&&!sleeping&&!craftOpen&&
    !inventoryOpen&&!chestOpen&&cameraMode===0,
  getMovement:()=>Math.hypot(player.vel.x,player.vel.z),
  isMining:()=>miningHeld,
  isHurt:()=>performance.now()<playerHurtUntil
});
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
  if(binocularActive)closeBinoculars();
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
  applyArmorAppearance(playerAvatar,equippedArmor);
  playerAvatar.visible=started&&!dead&&!sleeping&&cameraMode!==0;
  if(!playerAvatar.visible){
    setAvatarDamageFlash(playerAvatar,false);
    return;
  }
  const selectedStack=inventorySlots[selectedHotbarIndex];
  avatarHeldItems.sync(playerAvatar,
    selectedStack&&selectedStack.qty>0?selectedStack.id:null,offhandItem?.id??null);
  setAvatarDamageFlash(playerAvatar,now<playerHurtUntil);
  playerAvatar.position.copy(player.pos);
  playerAvatar.rotation.y=ridingHorse?ridingHorse.rotation.y:player.yaw;
  gliderWings.visible=gliderActive&&!ridingHorse;
  const moving=Math.hypot(player.vel.x,player.vel.z);
  const stride=moving>.3?Math.sin(now*.009*(moving>5.2?1.45:1))*(Math.min(.58,moving*.12)):0;
  const limbs=playerAvatar.userData.limbs;
  if(ridingHorse){
    // Sit upright with knees and boots on OPPOSITE sides of the horse.
    // The old pose kept the feet over the saddle and swung both rigid legs
    // backward, which looked like a standing character floating on the horse.
    for(const [side,leg] of [[-1,limbs.leftLeg],[1,limbs.rightLeg]]){
      leg.position.set(side*.50,.69,0);
      leg.rotation.set(.12,0,side*.50);
    }
    // Both hands reach forward toward the reins instead of hanging behind
    // the rider. Keep the saddle pose steady even while the horse gallops.
    for(const [side,arm] of [[-1,limbs.leftArm],[1,limbs.rightArm]]){
      arm.position.set(side*.32,1.30,-.04);
      arm.rotation.set(.86,0,-side*.12);
    }
  }else{
    // Reset every transformed axis as soon as the rider dismounts so walking,
    // sprinting, jumping and armor attached to the limbs work exactly as before.
    for(const [side,leg] of [[-1,limbs.leftLeg],[1,limbs.rightLeg]]){
      leg.position.set(side*.20,.69,0);
      leg.rotation.set(side===-1?stride:-stride,0,0);
    }
    for(const [side,arm] of [[-1,limbs.leftArm],[1,limbs.rightArm]]){
      arm.position.set(side*.36,1.30,0);
      arm.rotation.set(side===-1?-stride*.8:stride*.8,0,0);
    }
    if(!player.onGround){
      limbs.leftLeg.rotation.x=.15;
      limbs.rightLeg.rotation.x=-.15;
    }
    // Slightly separate held hands from the torso rather than floating the
    // tools away from the hands. Both first-person and horse reins are unchanged.
    limbs.rightArm.rotation.z=selectedStack?.qty>0?.30:0;
    limbs.leftArm.rotation.z=(offhandItem?.id===I.SHIELD||offhandItem?.id===I.TORCH)?-.34:0;
  }
  avatarHeldItems.animate(playerAvatar,now,{
    kind:avatarActionKind,at:avatarActionAt,
    mining:miningHeld,drawing:bowDrawing,guarding:shieldGuarding,riding:!!ridingHorse
  });
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
  id=migrateOldMeat(id);
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
          if(left<=0){removeWorldDrop(d);continue}
        }
      }
    }
  }
}

function blocked(px,py,pz){
  const e=1e-4;
  const minX=Math.ceil((px-PR)-0.5+e),maxX=Math.floor((px+PR)+0.5-e);
  // Fence collision extends to 1.0 above the block center (1.5 high).
  // Read the cell below normal foot height or a jump could skip its hitbox.
  const minY=Math.ceil(py-1.0+e),maxY=Math.floor((py+PH)+0.5-e);
  const minZ=Math.ceil((pz-PR)-0.5+e),maxZ=Math.floor((pz+PR)+0.5-e);
  for(let x=minX;x<=maxX;x++)for(let y=minY;y<=maxY;y++)for(let z=minZ;z<=maxZ;z++){
    const id=get(x,y,z);if(!solid(id))continue;
    const shapes=detailedBlockModels.collisionBoxes(id);
    if(!shapes){
      // The expanded vertical search must not mistake ordinary floor blocks
      // beneath the player's feet for a collision.
      if(py+PH>y-.5+e&&py<y+.5-e)return true;
      continue;
    }
    for(const [lx,rx,by,ty,lz,rz] of shapes)
      if(px+PR>x+lx+e&&px-PR<x+rx-e&&py+PH>y+by+e&&py<y+ty-e&&
         pz+PR>z+lz+e&&pz-PR<z+rz-e)return true;
  }
  return false;
}
// Walk up the two 0.5-block treads of a real stair without pressing Jump.
// A step is permitted only when its *actual collision surface* is at most
// half a block higher than the player's feet. Full cubes and fences cannot
// be climbed. Inspect every block touched by the player hitbox: sampling
// only the center voxel misses the first stair near an edge/corner.
function tryAutoStep(nx,nz){
  if(ridingHorse||playerInWater())return false;
  if(!player.onGround&&!blocked(player.pos.x,player.pos.y-.085,player.pos.z))
    return false;
  const epsilon=1e-4,feet=player.pos.y;
  const minX=Math.ceil(nx-PR-.5+epsilon),maxX=Math.floor(nx+PR+.5-epsilon);
  const minZ=Math.ceil(nz-PR-.5+epsilon),maxZ=Math.floor(nz+PR+.5-epsilon);
  const lowY=Math.floor(feet-.51),highY=Math.ceil(feet+.51);
  let nextFoot=null;
  for(let x=minX;x<=maxX;x++)for(let z=minZ;z<=maxZ;z++)
    for(let y=lowY;y<=highY;y++){
      const id=get(x,y,z),base=detailedBlockModels.canonical(id);
      if(id!==B.WOOD_SLAB&&id!==B.WOOD_SLAB_TOP&&
         base!==B.WOOD_STAIRS&&base!==B.STONE_STAIRS)continue;
      const shapes=detailedBlockModels.collisionBoxes(id);
      for(const [lx,rx,by,ty,lz,rz] of shapes||[]){
        if(nx+PR<=x+lx+epsilon||nx-PR>=x+rx-epsilon||
           nz+PR<=z+lz+epsilon||nz-PR>=z+rz-epsilon)continue;
        const top=y+ty;
        if(top>feet+.012&&top<=feet+.512&&
           feet+PH>y+by+epsilon)
          nextFoot=Math.max(nextFoot??-Infinity,top+.015);
      }
    }
  if(nextFoot===null||blocked(player.pos.x,nextFoot,player.pos.z)||
     blocked(nx,nextFoot,nz))return false;
  player.pos.set(nx,nextFoot,nz);
  player.vel.y=0;
  player.onGround=true;
  fallOriginY=null;
  return true;
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
      if(axis!=='y'&&tryAutoStep(nx,nz))continue;
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
  if(activeMap==='testworld')return {x:.5,y:TESTWORLD_SURFACE_Y+1.05,z:.5};
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
function warpWorkbenchOther(x,y,z,id=get(x,y,z)){
  const offsets={
    [B.WARP_WORKBENCH_X]:[1,0,B.WARP_WORKBENCH_X_END],
    [B.WARP_WORKBENCH_X_END]:[-1,0,B.WARP_WORKBENCH_X],
    [B.WARP_WORKBENCH_Z]:[0,1,B.WARP_WORKBENCH_Z_END],
    [B.WARP_WORKBENCH_Z_END]:[0,-1,B.WARP_WORKBENCH_Z]
  };
  const rule=offsets[id];if(!rule)return null;
  const tx=x+rule[0],tz=z+rule[1];
  return get(tx,y,tz)===rule[2]?{x:tx,y,z:tz}:null;
}
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
// Respawn beside the bed at the same floor height, not by climbing through
// the ceiling. The previous "raise Y until not blocked" could move a player
// through a house roof and into a tree growing over the house.
function safeBedRespawn(foot,head){
  const floorY=foot.y-1;
  const positions=new Map();
  function consider(x,z){
    const key=x+','+z;
    if((x===foot.x&&z===foot.z)||(x===head.x&&z===head.z)||positions.has(key))return;
    const distance=Math.min(
      Math.hypot(x-foot.x,z-foot.z),Math.hypot(x-head.x,z-head.z));
    positions.set(key,{x,z,distance});
  }
  // Side and end spaces closest to the two halves are preferred.
  for(const half of [foot,head]){
    for(const radius of [1,2,3,4])
      for(let dx=-radius;dx<=radius;dx++)
        for(let dz=-radius;dz<=radius;dz++){
          if(Math.max(Math.abs(dx),Math.abs(dz))!==radius)continue;
          consider(half.x+dx,half.z+dz);
        }
  }
  const candidates=[...positions.values()].sort((a,b)=>a.distance-b.distance);
  for(const tile of candidates){
    const {x,z}=tile,y=foot.y-.44;
    // A floor must actually exist at the bed's level and both body blocks
    // must fit; never search upward to an exposed rooftop/tree canopy.
    const floor=get(x,floorY,z);
    if(!solid(floor)||floor===B.LEAF||floor===B.CACTUS||isBedBlock(floor))continue;
    if(!blocked(x,y,z)&&blocked(x,y-.12,z))return {x,y,z};
  }
  // Only as a backup, allow standing ON a bed if there is enough headroom.
  for(const half of [foot,head]){
    const p={x:half.x,y:half.y+.56,z:half.z};
    if(!blocked(p.x,p.y,p.z)&&blocked(p.x,p.y-.12,p.z))return p;
  }
  return null;
}
function activeRespawnPoint(){
  if(bedSpawn){
    const foot=canonicalBedFoot(bedSpawn.x,bedSpawn.y,bedSpawn.z);
    const head=foot&&findBedOtherHalf(foot.x,foot.y,foot.z,B.BED);
    if(foot&&head){
      const safe=safeBedRespawn(foot,head);
      if(safe)return safe;
      // Keep the bed assignment. A rebuilt house might create room later.
      flash('ベッドの周囲に安全な空間がないため初期地点に復活しました');
    }else bedSpawn=null;
  }
  return ensureInitialSpawn();
}
function spawn(useBed=false){
  const p=useBed?activeRespawnPoint():ensureInitialSpawn();
  player.pos.set(p.x,p.y,p.z);
  player.vel.set(0,0,0);player.onGround=false;fallOriginY=null;
  playerKnockbackX=0;playerKnockbackZ=0;playerKnockbackTime=0;
  // The bed candidate was collision checked at its actual floor height.
  // Never lift a bed respawn vertically onto the roof.
  if(blocked(p.x,p.y,p.z)){
    const fallback=ensureInitialSpawn();
    player.pos.set(fallback.x,fallback.y,fallback.z);
    for(let i=0;i<16&&blocked(player.pos.x,player.pos.y,player.pos.z);i++)player.pos.y+=1;
  }
}

const ray=new THREE.Raycaster();ray.far=6;
// Unlike target(), water aiming must not skip the water surface to hit stone.
function targetWater(){
  aimPlayerRay();
  const cx=chunkCoord(Math.floor(player.pos.x)),cz=chunkCoord(Math.floor(player.pos.z)),nearby=[];
  for(let dx=-1;dx<=1;dx++)for(let dz=-1;dz<=1;dz++){
    const c=chunks.get(chunkKey(cx+dx,cz+dz));
    if(c?.renderMeshes)nearby.push(...c.renderMeshes);
  }
  for(const h of ray.intersectObjects(nearby,false)){
    if(h.distance>5.6)break;
    const p=lookup.get(h.object.uuid)?.[h.instanceId];
    if(!p)continue;
    const id=get(p.x,p.y,p.z);
    if(id===B.WATER)return p;
    if(solid(id))break;
  }
  return null;
}
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
  closeExplorerMap(false);closeBinoculars();
  playerKnockbackX=0;playerKnockbackZ=0;playerKnockbackTime=0;
  ridingHorse=null;
  setShieldGuard(false);
  dead=true;health=0;renderHealth();primaryActionStop();
  Object.keys(keys).forEach(k=>keys[k]=false);
  resetSprint();
  craftOpen=false;inventoryOpen=false;
  crafting.classList.remove('open');inventoryScreen.classList.remove('open');
  crafting.setAttribute('aria-hidden','true');inventoryScreen.setAttribute('aria-hidden','true');
  deathScreen.classList.add('open');deathScreen.setAttribute('aria-hidden','false');
  document.exitPointerLock?.();markSaveDirty();saveCurrentGame(false);
}
function damagePlayer(points,source='ダメージ',attacker=null){
  if(dead||points<=0)return;
  if(shieldGuarding&&offhandItem?.id===I.SHIELD&&/攻撃|噛みつき|突進/.test(source)){
    return;
  }
  healthRegenTimer=0;
  const taken=Math.max(1,Math.ceil(points*(1-armorReduction())));
  const hitAt=performance.now();
  playerHurtAt=hitAt;
  playerHurtUntil=hitAt+PLAYER_HURT_FLASH_MS;
  playerHurtSeq=(playerHurtSeq+1)%100000000;
  // Fall impacts flash red too, but don't bounce the player off the ground.
  // Hostile attacks push away from the actual attacking creature.
  if(source!=='落下ダメージ'&&!ridingHorse){
    let dx=Number.isFinite(attacker?.x)?player.pos.x-attacker.x:Math.sin(player.yaw);
    let dz=Number.isFinite(attacker?.z)?player.pos.z-attacker.z:Math.cos(player.yaw);
    const length=Math.hypot(dx,dz);
    if(length<.001){dx=Math.sin(player.yaw);dz=Math.cos(player.yaw)}
    else{dx/=length;dz/=length}
    const strength=/突進/.test(source)?5.5:4.2;
    playerKnockbackX=dx*strength;
    playerKnockbackZ=dz*strength;
    playerKnockbackTime=.38;
    // Instant collision-tested nudge, then a longer eased recoil.
    movePlayerAxis('x',dx*.035);
    movePlayerAxis('z',dz*.035);
    player.vel.y=Math.max(player.vel.y,1.3);
    player.onGround=false;
    fallOriginY=null;
  }
  health=Math.max(0,health-taken);renderHealth();markSaveDirty();
  if(health<=0){showDeathScreen();return}
  // Red flash, health HUD and knockback already signal the hit.
  // No large floating combat message over the hotbar.
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
  playerHurtAt=-Infinity;playerHurtUntil=0;
  playerKnockbackX=0;playerKnockbackZ=0;playerKnockbackTime=0;
  damageScreenTint.style.opacity='0';
  setAvatarDamageFlash(playerAvatar,false);
  stamina=MAX_STAMINA;staminaRunSeconds=0;staminaRegenSeconds=0;
  deathScreen.classList.remove('open');deathScreen.setAttribute('aria-hidden','true');
  spawn(true);streamChunks(true);
  player.yaw=0;player.pitch=0;renderHealth();renderStamina();markSaveDirty();saveCurrentGame(false);
  last=performance.now();
  if(!matchMedia('(pointer:coarse)').matches)renderer.domElement.requestPointerLock?.();
}

function xpNeeded(lv){return 12+lv*8}
// Large, dangerous wildlife should feel rewarding even at high player levels.
// Exactly three level thresholds are awarded at the player's CURRENT level;
// the XP already earned toward the next level is preserved. Neutral village
// golems, ordinary livestock, and the separately balanced Chimera boss are excluded.
const LARGE_MOB_XP_TYPES=new Set(['lion','bison','anaconda','bear','elephant','crocodile','shark']);
function defeatedMobXP(mob){
  if(!LARGE_MOB_XP_TYPES.has(mob.userData.type))return mob.userData.xp??12;
  return xpNeeded(level)+xpNeeded(level+1)+xpNeeded(level+2);
}
function nextBlueprint(){return [...recipes,...workbenchRecipes].sort((a,b)=>a.unlockLevel-b.unlockLevel).find(r=>r.unlockLevel>level)||null}
function updateProgress(){
  const need=xpNeeded(level),pct=level>=150?100:Math.max(0,Math.min(100,xp/need*100));
  levelText.textContent='LV '+level;xpText.textContent=level>=150?'MAX LEVEL':xp+' / '+need+' XP';xpFill.style.width=pct+'%';
  updateJobHud();
  const next=nextBlueprint();blueprintText.textContent=next?'次の設計図：'+next.name.replace(/ ×\d+$/,'')+'（LV '+next.unlockLevel+'）':'全設計図を獲得済み';
}
function gainXP(amount,source=''){
  if(amount<=0||level>=150)return;
  xp+=amount;let unlocked=[];
  while(level<150&&xp>=xpNeeded(level)){
    xp-=xpNeeded(level);level++;
    const rs=[...recipes,...workbenchRecipes].filter(r=>r.unlockLevel===level);unlocked.push(...rs.map(r=>r.name.replace(/ ×\d+$/,'')));
  }
  if(level>=150)xp=0;
  updateProgress();markSaveDirty();
  // XP increases are already visible in the permanent XP bar.
  // Keep the infrequent level-up / blueprint notice only.
  if(jobSelected&&jobNextOptions(activeJob,level).length){
    flash('ジョブ進化が解放！ JOBから進化先を選べます（LV '+level+'）');
  }else if(unlocked.length)flash('LEVEL UP! LV '+level+'　設計図獲得：'+unlocked.join(' / '));
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
  const woodLike=new Set([B.LOG,B.PLANK,B.CRAFTING_TABLE,B.BED,B.BED_HEAD,B.CHEST,...DOOR_ALL,
  B.WOOD_STAIRS,B.WOOD_STAIRS_E,B.WOOD_STAIRS_S,B.WOOD_STAIRS_W,
  B.WOOD_SLAB,B.WOOD_FENCE,B.FENCE_GATE,B.FENCE_GATE_E,B.FENCE_GATE_S,B.FENCE_GATE_W,
  B.FENCE_GATE_OPEN_N,B.FENCE_GATE_OPEN_E,B.FENCE_GATE_OPEN_S,B.FENCE_GATE_OPEN_W,
  B.LADDER,B.LADDER_E,B.LADDER_S,B.LADDER_W,
  B.TRAPDOOR,B.TRAPDOOR_OPEN_N,B.TRAPDOOR_OPEN_E,B.TRAPDOOR_OPEN_S,B.TRAPDOOR_OPEN_W,
  B.BOOKSHELF,B.BARREL]);
  const softLike=new Set([B.GRASS,B.DIRT,B.SAND,B.GRAVEL,B.SNOW]);
  const axeSpeed=selected===I.DIAMOND_AXE?6.5:selected===I.IRON_AXE?5:selected===I.GOLD_AXE?5.8:selected===I.STONE_AXE?3.2:selected===I.WOOD_AXE?2.1:1;
  const shovelSpeed=selected===I.DIAMOND_SHOVEL?6.5:selected===I.IRON_SHOVEL?5:selected===I.GOLD_SHOVEL?5.8:selected===I.STONE_SHOVEL?3.2:1;
  if(woodLike.has(id))return axeSpeed;
  if(softLike.has(id))return shovelSpeed;
  if(!rockBlocks.has(id))return 1;
  const t=pickTier();
  // Mining is deliberately responsive even on touch devices. These
  // multipliers make stone take ~0.75s (wood), ~0.43s (stone),
  // ~0.30s (iron), ~0.25s (gold) or ~0.19s (diamond).
  if(t>=4)return 16.0;
  if(selected===I.GOLD_PICK)return 12.0;
  if(t>=3)return 10.0;
  if(t>=2)return 7.0;
  if(t>=1)return 4.0;
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
  ...JOB_WEAPON_IDS,
  I.WOOD_PICK,I.STONE_PICK,I.IRON_PICK,I.GOLD_PICK,I.DIAMOND_PICK,
  I.STONE_SWORD,I.IRON_SWORD,I.GOLD_SWORD,I.DIAMOND_SWORD,
  I.WOOD_AXE,I.STONE_AXE,I.IRON_AXE,I.GOLD_AXE,I.DIAMOND_AXE,
  I.STONE_SHOVEL,I.IRON_SHOVEL,I.GOLD_SHOVEL,I.DIAMOND_SHOVEL,
  I.IRON_HELMET,I.IRON_CHEST,I.IRON_LEGS,I.IRON_BOOTS,
  I.GOLD_HELMET,I.GOLD_CHEST,I.GOLD_LEGS,I.GOLD_BOOTS,
  I.DIAMOND_HELMET,I.DIAMOND_CHEST,I.DIAMOND_LEGS,I.DIAMOND_BOOTS,
  I.CHIMERA_HELMET,I.CHIMERA_CHEST,I.CHIMERA_LEGS,I.CHIMERA_BOOTS,
  I.BED,I.BOW,I.SADDLE,I.SHIELD,I.WATER_BUCKET,I.CHIMERA_DAGGER,I.CHIMERA_BOW
]);
function maxStackFor(id){return NON_STACKABLE.has(id)?1:64}
const ARMOR_NAMES=['頭','胸','脚','足'];
function armorPartForId(id){
  if(Number.isInteger(id)&&id>=I.CHIMERA_HELMET&&id<=I.CHIMERA_BOOTS)
    return id-I.CHIMERA_HELMET;
  return Number.isInteger(id)&&id>=I.IRON_HELMET&&id<=I.DIAMOND_BOOTS?(id-I.IRON_HELMET)%4:-1;
}
function armorColor(id){
  if(id>=I.CHIMERA_HELMET&&id<=I.CHIMERA_BOOTS)return 0x695273;
  if(id>=I.DIAMOND_HELMET)return 0x58d6e9;
  if(id>=I.GOLD_HELMET)return 0xebc149;
  return 0xabb6c1;
}
function armorReduction(){
  let protection=0;
  for(const id of equippedArmor){
    if(armorPartForId(id)<0)continue;
    protection+=id>=I.CHIMERA_HELMET?.14:id>=I.DIAMOND_HELMET?.12:id>=I.GOLD_HELMET?.07:.09;
  }
  const defense=jobSelected?(JOBS[activeJob]?.defense||0):0;
  return Math.min(.86,1-(1-Math.min(.55,protection))*(1-defense));
}
function normalizeArmor(raw){
  equippedArmor.fill(null);
  if(!Array.isArray(raw))return;
  for(let i=0;i<4;i++){
    const id=Number(raw[i]);
    if(armorPartForId(id)===i)equippedArmor[i]=id;
  }
}
function equipFromInventory(index){
  const st=inventorySlots[index];if(!st)return;
  const part=armorPartForId(st.id);
  if(part<0){flash('防具を選択してください');return}
  const previous=equippedArmor[part];
  equippedArmor[part]=st.id;
  inventorySlots[index]=previous==null?null:{id:previous,qty:1};
  inventorySelectedSlot=null;syncDerivedInventory();
  markSaveDirty();renderHotbar();renderInventoryUI();
  applyArmorAppearance(playerAvatar,equippedArmor);
  flash(names[st.id]+'を装備した');
}
function removeEquippedArmor(part){
  const id=equippedArmor[part];if(id==null)return;
  const empty=firstEmptySlot(0,36);
  if(empty<0){flash('防具を外すには空きスロットが必要');return}
  inventorySlots[empty]={id,qty:1};equippedArmor[part]=null;
  syncDerivedInventory();markSaveDirty();renderHotbar();renderInventoryUI();
  applyArmorAppearance(playerAvatar,equippedArmor);
  flash(names[id]+'を外した');
}
function onArmorSlotTap(part){
  const index=inventorySelectedSlot;
  const selectedStack=index==null?null:inventorySlots[index];
  const chosenPart=selectedStack?armorPartForId(selectedStack.id):-1;
  if(chosenPart>=0){
    if(chosenPart!==part){
      flash(names[selectedStack.id]+'は「'+ARMOR_NAMES[chosenPart]+'」に装備できます');
      return;
    }
    equipFromInventory(index);
    return;
  }
  removeEquippedArmor(part);
}
function renderArmorUI(){
  const box=$('inventoryArmor');if(!box)return;
  box.replaceChildren();
  const stack=inventorySelectedSlot==null?null:inventorySlots[inventorySelectedSlot];
  const selectedPart=stack?armorPartForId(stack.id):-1;
  for(let i=0;i<4;i++){
    const id=equippedArmor[i],button=document.createElement('button');
    button.type='button';
    button.className='armor-slot'+(id!=null?' wearing':'')+(selectedPart===i?' equip-target':'');
    const label=document.createElement('span');label.textContent=ARMOR_NAMES[i];button.appendChild(label);
    if(id!=null)button.appendChild(itemCanvas(id,'item-icon'));
    else{const blank=document.createElement('strong');blank.textContent='＋';button.appendChild(blank)}
    button.title=selectedPart===i?'タップして'+names[stack.id]+'を装備'
      :selectedPart>=0?'選択中の防具とは異なる部位です'
      :id!=null?'タップして'+names[id]+'を外す'
      :'防具を選んで装備欄をタップ';
    button.addEventListener('click',()=>onArmorSlotTap(i));box.appendChild(button);
  }
  const bag=document.createElement('button');bag.type='button';
  bag.className='armor-slot'+(equippedBackpack?' wearing':'');
  const title=document.createElement('span');title.textContent='リュック';bag.appendChild(title);
  if(equippedBackpack)bag.appendChild(itemCanvas(I.BACKPACK,'item-icon'));
  else{const plus=document.createElement('strong');plus.textContent='＋';bag.appendChild(plus)}
  bag.title=equippedBackpack?'タップしてリュックを外す（中身が空のときのみ）':'リュックを選んでタップすると装備';
  bag.addEventListener('click',()=>{
    if(equippedBackpack){
      if(backpackSlots.some(Boolean)){flash('リュックの中身を空にしてください');return}
      const empty=firstEmptySlot(0,36);
      if(empty<0){flash('持ち物に空きがありません');return}
      inventorySlots[empty]={id:I.BACKPACK,qty:1};equippedBackpack=false;
    }else{
      const st=inventorySelectedSlot==null?null:inventorySlots[inventorySelectedSlot];
      if(st?.id!==I.BACKPACK){flash('リュックを選択してください');return}
      removeFromSlot(inventorySelectedSlot,1);equippedBackpack=true;
    }
    inventorySelectedSlot=null;syncDerivedInventory();markSaveDirty();renderInventoryUI();renderHotbar();
  });
  box.appendChild(bag);
  const def=$('armorDefense');if(def)def.textContent='防御 '+Math.round(armorReduction()*100)+'%';
}
// Layered voxel armor, not a painted texture. All armor plates are actual
// 3-D meshes with their own depth, highlights, seams, trims and raised rivets.
// Attach shoulder, leg and boot pieces to animated limb pivots so they walk.
function applyArmorAppearance(model,armor){
  if(!model)return;
  const accepted=Array.isArray(armor)?armor:[];
  const signature=accepted.map((id,i)=>armorPartForId(Number(id))===i?Number(id):0).join(',');
  if(model.userData.armorSignature===signature)return;
  for(const {mesh,parent} of model.userData.armorMeshes||[]){
    parent.remove(mesh);mesh.geometry.dispose();
  }
  const drawn=[],limbs=model.userData.limbs;
  function plate(parent,w,h,d,color,x,y,z,rx=0,ry=0,rz=0){
    if(!parent)return;
    const mesh=cube(parent,w,h,d,color,x,y,z,rx,ry,rz);
    drawn.push({mesh,parent});
    return mesh;
  }
  const colorSchemes={
    iron:{base:0xadb9c4,light:0xe4edf0,edge:0x566675,shade:0x8797a3,emblem:0x446c8c},
    gold:{base:0xe4af33,light:0xffe18a,edge:0x805321,shade:0xb17c24,emblem:0xb75d31},
    diamond:{base:0x42ced9,light:0xb0ffed,edge:0x226c89,shade:0x279baf,emblem:0x3160bc},
    chimera:{base:0x59465e,light:0xc99e70,edge:0x24202d,shade:0x8a6854,emblem:0x9960b0}
  };
  for(let i=0;i<4;i++){
    const id=Number(accepted[i]);
    if(armorPartForId(id)!==i)continue;
    const p=id>=I.CHIMERA_HELMET?colorSchemes.chimera:
      id>=I.DIAMOND_HELMET?colorSchemes.diamond:
      id>=I.GOLD_HELMET?colorSchemes.gold:colorSchemes.iron;
    const {base,light,edge,shade,emblem}=p;
    if(i===0){
      // Helmet: thick crown, a raised ridge, broad brow, cheek/ear guards
      // and an open-faced visor: both eyes remain fully visible.
      plate(model,.83,.22,.70,base,0,1.78,0);
      plate(model,.77,.08,.65,light,0,1.915,-.012);
      plate(model,.18,.075,.71,shade,0,1.965,-.007);
      plate(model,.84,.11,.15,edge,0,1.70,-.330);
      plate(model,.69,.08,.075,light,0,1.728,-.412);
      plate(model,.77,.25,.115,base,0,1.665,.326);
      plate(model,.66,.08,.12,edge,0,1.53,.337);
      for(const side of [-1,1]){
        plate(model,.135,.38,.59,base,side*.398,1.61,0);
        plate(model,.045,.27,.52,shade,side*.480,1.64,0);
        plate(model,.15,.22,.17,edge,side*.399,1.470,-.252);
        plate(model,.11,.13,.24,light,side*.425,1.825,-.24);
        plate(model,.05,.055,.06,emblem,side*.476,1.63,-.18);
      }
      plate(model,.16,.085,.105,emblem,0,1.735,-.435);
      plate(model,.11,.055,.115,light,0,1.786,-.432);
      if(id===I.CHIMERA_HELMET){
        // Thick swept buffalo horns + distinct lion mane wrapping the head.
        // Every part has depth; don't just repaint the old metal helmet.
        for(const side of [-1,1]){
          plate(model,.31,.29,.33,0x544856,side*.34,1.99,.02,0,0,-side*.23);
          plate(model,.27,.25,.29,0xab987f,side*.49,2.16,-.09,0,0,-side*.47);
          plate(model,.20,.24,.22,0xe3d3b3,side*.57,2.31,-.19,-.10,0,-side*.52);
          plate(model,.12,.19,.14,0xf2e7d1,side*.62,2.44,-.28,-.22,0,-side*.53);
          for(let tuft=0;tuft<3;tuft++)
            plate(model,.19,.30,.23,tuft%2?0x8a5c36:0xc68b49,
              side*(.42+tuft*.025),1.48-tuft*.17,.15+tuft*.045,
              0,0,side*(.15+tuft*.17));
        }
        for(let tuft=0;tuft<5;tuft++){
          const x=(tuft-2)*.17;
          plate(model,.21,.23+(tuft%2)*.08,.21,
            tuft%2?0xb77e41:0x8e5a32,x,1.48,-.41,0,0,x*.4);
        }
        plate(model,.31,.20,.14,0xcda36a,0,1.82,-.40);
        plate(model,.15,.115,.085,0xf0dbb6,0,1.85,-.486);
      }
    }
    if(i===1){
      // Cuirass: thick chest / back shells and chunky shoulder pauldrons.
      // A separate raised breastplate and center boss give real depth.
      plate(model,.83,.65,.23,base,0,1.09,-.265);
      plate(model,.79,.60,.19,shade,0,1.11,.273);
      plate(model,.70,.08,.34,light,0,1.435,-.05);
      plate(model,.88,.12,.50,edge,0,.742,0);
      plate(model,.73,.09,.42,base,0,.800,0);
      plate(model,.69,.32,.14,light,0,1.235,-.411);
      plate(model,.65,.30,.16,shade,0,.936,-.421);
      plate(model,.20,.43,.13,base,0,1.070,-.486);
      plate(model,.13,.33,.05,light,0,1.070,-.567);
      plate(model,.24,.24,.14,edge,0,1.230,-.532,0,0,Math.PI/4);
      plate(model,.135,.135,.08,emblem,0,1.230,-.640,0,0,Math.PI/4);
      if(id===I.CHIMERA_CHEST){
        // Layered anaconda-scale breastplate, lion fur collar and trophy fangs.
        for(let row=0;row<3;row++)for(let col=-1;col<=1;col++){
          plate(model,.18,.16,.075,(row+col)%2?0x467665:0x274b43,
            col*.207,1.29-row*.18,-.505+row*.016,0,0,col*.10);
          plate(model,.095,.038,.036,0x8ab5a1,col*.207,1.33-row*.18,-.555);
        }
        for(const side of [-1,1]){
          for(let tuft=0;tuft<3;tuft++)
            plate(model,.17,.19,.21,tuft%2?0xba7c42:0xd29e5b,
              side*(.26+tuft*.07),1.46-tuft*.14,-.28,0,0,side*(.10+tuft*.1));
          plate(model,.16,.31,.17,0xc8b38f,side*.30,1.12,-.54,0,0,side*.17);
          plate(model,.08,.17,.105,0xf6e9c9,side*.33,.91,-.60,0,0,side*.17);
        }
      }
      for(const side of [-1,1]){
        plate(model,.14,.58,.39,base,side*.426,1.08,0);
        plate(model,.075,.50,.12,edge,side*.496,1.10,-.187);
        // A raised armour buckle on each side of the belt.
        plate(model,.065,.075,.05,light,side*.348,.743,-.271);
        const arm=side<0?limbs?.leftArm:limbs?.rightArm;
        if(!arm)continue;
        // Rounded-ish pauldrons are built from stepped 3D voxels.
        plate(arm,.43,.24,.48,edge,side*.04,-.090,0,0,0,side*-.12);
        plate(arm,.49,.19,.44,base,side*.067,-.125,-.023,0,0,side*-.12);
        plate(arm,.34,.11,.39,light,side*.072,-.054,-.027);
        plate(arm,.39,.24,.37,shade,side*.036,-.295,0);
        plate(arm,.36,.095,.40,edge,side*.025,-.436,0);
        plate(arm,.09,.14,.06,emblem,side*.086,-.282,-.217);
        if(id===I.CHIMERA_CHEST){
          // Each shoulder has a raised buffalo-horn crest and lion fur tufts.
          plate(arm,.26,.22,.32,0x5a473c,side*.07,-.03,-.08);
          plate(arm,.19,.25,.22,0xc7af8e,side*.11,.14,-.09,0,0,-side*.22);
          plate(arm,.115,.20,.135,0xf1e2c5,side*.16,.34,-.12,0,0,-side*.35);
          for(let row=0;row<2;row++)
            plate(arm,.20,.15,.095,row?0x437160:0x284a42,
              side*.06,-.24-row*.155,-.27);
        }
      }
    }
    if(i===2){
      // Leggings: waist guard + separated plates per thigh, knee and calf.
      plate(model,.76,.16,.52,edge,0,.68,0);
      plate(model,.72,.13,.57,base,0,.645,-.025);
      plate(model,.63,.06,.10,light,0,.720,-.280);
      plate(model,.18,.19,.12,base,0,.589,-.293);
      for(const side of [-1,1]){
        const leg=side<0?limbs?.leftLeg:limbs?.rightLeg;
        if(!leg)continue;
        plate(leg,.38,.44,.43,edge,0,-.195,0);
        plate(leg,.34,.40,.45,base,0,-.200,-.044);
        plate(leg,.255,.33,.075,light,0,-.215,-.292);
        plate(leg,.36,.18,.49,shade,0,-.440,-.018);
        plate(leg,.33,.14,.52,base,0,-.489,-.083);
        plate(leg,.17,.10,.06,emblem,0,-.476,-.375);
        plate(leg,.10,.28,.08,shade,side*.154,-.235,-.105);
        if(id===I.CHIMERA_LEGS){
          // Overlapping serpent scales with ridged bison bone along the sides.
          for(let row=0;row<3;row++){
            plate(leg,.26,.12,.12,row%2?0x3f6b5c:0x558475,
              0,-.08-row*.145,-.333-row*.004);
            plate(leg,.085,.18,.12,0xd1b48c,side*.17,-.17-row*.14,-.20);
          }
          plate(leg,.19,.13,.16,0x765566,0,-.49,-.32);
        }
      }
    }
    if(i===3){
      // Boots: tall raised shin plates, ankle cuff, wide metal toe cap,
      // protruding heel and a dark sole. Entire boot follows each leg.
      for(const side of [-1,1]){
        const leg=side<0?limbs?.leftLeg:limbs?.rightLeg;
        if(!leg)continue;
        plate(leg,.375,.37,.415,edge,0,-.475,0);
        plate(leg,.340,.36,.41,base,0,-.477,-.030);
        plate(leg,.245,.24,.075,light,0,-.463,-.275);
        plate(leg,.42,.105,.48,shade,0,-.559,-.045);
        plate(leg,.43,.19,.60,base,0,-.621,-.092);
        plate(leg,.37,.09,.18,light,0,-.606,-.389);
        plate(leg,.435,.067,.61,edge,0,-.702,-.092);
        plate(leg,.28,.13,.15,shade,0,-.615,.22);
        plate(leg,.085,.095,.052,emblem,0,-.442,-.319);
        if(id===I.CHIMERA_BOOTS){
          // Clawed beast paws: three pronounced ivory talons per boot.
          for(const claw of [-1,0,1]){
            plate(leg,.13,.12,.29,0x684b55,claw*.145,-.65,-.425,0,0,-claw*.08);
            plate(leg,.095,.10,.17,0xe9dbc3,claw*.145,-.66,-.593,-.23,0,-claw*.13);
            plate(leg,.052,.06,.10,0xf8eddb,claw*.145,-.68,-.704,-.30,0,-claw*.13);
          }
          for(let row=0;row<2;row++)
            plate(leg,.25,.11,.11,row?0x427160:0x31584b,
              0,-.38+row*.14,-.322);
        }
      }
    }
  }
  model.userData.armorMeshes=drawn;
  model.userData.armorSignature=signature;
}

function clearInventorySlots(){
  inventorySlots.fill(null);equippedArmor.fill(null);hotbarSlots.fill(null);acquiredOrder.length=0;offhandItem=null;
  equippedBackpack=false;backpackSlots.fill(null);
  for(const k of Object.keys(inventory))inventory[k]=0;
  selected=null;inventorySelectedSlot=null;
}
function syncDerivedInventory(){
  for(const k of Object.keys(inventory))inventory[k]=0;
  acquiredOrder.length=0;
  for(let i=0;i<36;i++){
    const st=inventorySlots[i];
    if(st&&st.qty>0){
      st.id=migrateOldMeat(st.id);
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
    for(const [k,v] of Object.entries(data.inventory))if(Number(v)>0){
      const id=migrateOldMeat(k);counts[id]=(counts[id]||0)+Math.floor(Number(v));
    }
  }
  if(Array.isArray(data?.hotbarSlots)){
    for(let i=0;i<Math.min(9,data.hotbarSlots.length);i++){
      const id=migrateOldMeat(data.hotbarSlots[i]);
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
  if(binocularActive)closeBinoculars();
  if(eatingHeld)resetEating();
  if(bowDrawing)endBowDraw(false);
  selectedHotbarIndex=Math.max(0,Math.min(8,index));syncDerivedInventory();renderHotbar();
  const arrow=inventorySlots[selectedHotbarIndex]?.id;
  if(arrow===I.ARROW||arrow===I.POISON_ARROW){
    selectedArrowAmmo=arrow;
    if(started)flash(arrow===I.POISON_ARROW?'毒矢を装填しました。弓・クロスボウで発射できます':'通常の矢を装填しました');
  }
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
// Torch or shield shares one physical offhand slot; items are never duplicated.
function canEquipOffhand(id){return id===I.TORCH||id===I.SHIELD}
function setShieldGuard(value){
  shieldGuarding=!!(value&&offhandItem?.id===I.SHIELD&&started&&!dead&&!inventoryOpen&&!craftOpen&&!chestOpen&&!sleeping);
  const btn=$('tapGuard');if(btn)btn.classList.toggle('active',shieldGuarding);
}
function refreshShieldControl(){
  const btn=$('tapGuard');if(!btn)return;
  btn.hidden=offhandItem?.id!==I.SHIELD;
  btn.classList.toggle('active',shieldGuarding);
}
function equipOffhand(index){
  const st=inventorySlots[index];
  if(!st||!canEquipOffhand(st.id)||st.qty<=0){flash('左手に持てるのは松明か盾です');return}
  if(offhandItem){flash('先に左手のアイテムを外してください');return}
  const id=st.id;
  st.qty-=1;
  if(st.qty<=0)inventorySlots[index]=null;
  offhandItem={id,qty:1};
  if(!inventorySlots[index])inventorySelectedSlot=null;
  syncDerivedInventory();markSaveDirty();renderHotbar();renderInventoryUI();
  refreshShieldControl();
  flash('左手に'+names[id]+'を持ちました');
}
function unequipOffhand(){
  if(!offhandItem)return;
  const id=offhandItem.id;
  if(!canFitItem(id,1)){flash('持ち物がいっぱいで'+names[id]+'を戻せません');return}
  const left=addItem(id,1);
  if(left){flash(names[id]+'を戻せません');return}
  offhandItem=null;setShieldGuard(false);
  markSaveDirty();renderHotbar();renderInventoryUI();refreshShieldControl();
  flash('左手の'+names[id]+'を外しました');
}
function renderOffhandUI(){
  const slot=$('inventoryOffhand'),button=$('inventoryOffhandEquip');
  slot.replaceChildren();
  const selected=inventorySelectedSlot==null?null:inventorySlots[inventorySelectedSlot];
  slot.classList.toggle('wearing',!!offhandItem);
  slot.classList.toggle('equip-target',!offhandItem&&!!selected&&canEquipOffhand(selected.id));
  if(offhandItem){
    const id=offhandItem.id;
    slot.appendChild(itemCanvas(id,'item-icon'));
    slot.title='左手：'+names[id]+'（タップで外す）';
  }else{
    const label=document.createElement('span');label.textContent='左手';slot.appendChild(label);
    slot.title='左手：空（松明か盾を選んでタップ）';
  }
  slot.setAttribute('aria-label',slot.title);
  button.textContent=offhandItem?'装備中：タップで外す':'選択した松明・盾を左手に持つ';
  refreshShieldControl();
}
function renderInventoryUI(){
  const bagArea=$('backpackInventory');
  if(bagArea){
    bagArea.hidden=!equippedBackpack;
    const grid=$('backpackSlots');
    grid.replaceChildren();
    if(equippedBackpack)for(let i=0;i<9;i++){
      const st=backpackSlots[i],button=document.createElement('button');
      button.className='inv-slot';button.type='button';
      if(st){button.appendChild(itemCanvas(st.id,'item-icon'));const qty=document.createElement('span');qty.textContent=st.qty;button.appendChild(qty)}
      else button.textContent='＋';
      button.title=st?'タップで持ち物に戻す':'選択したアイテムをリュックに入れる';
      button.addEventListener('click',()=>{
        if(st){
          if(!canFitItem(st.id,st.qty)){flash('持ち物がいっぱいです');return}
          addItem(st.id,st.qty);backpackSlots[i]=null;
        }else{
          const selectedStack=inventorySelectedSlot==null?null:inventorySlots[inventorySelectedSlot];
          if(!selectedStack)return;
          if(selectedStack.id===I.BACKPACK){flash('リュックの中にリュックは入れられません');return}
          backpackSlots[i]={...selectedStack};
          inventorySlots[inventorySelectedSlot]=null;inventorySelectedSlot=null;
          syncDerivedInventory();
        }
        markSaveDirty();renderInventoryUI();renderHotbar();
      });
      grid.appendChild(button);
    }
  }
  renderOffhandUI();
  inventoryMainGrid.innerHTML='';inventoryHotbarGrid.innerHTML='';
  for(let i=9;i<36;i++)inventoryMainGrid.appendChild(renderInventorySlot(i));
  for(let i=0;i<9;i++)inventoryHotbarGrid.appendChild(renderInventorySlot(i));
  const st=inventorySelectedSlot==null?null:inventorySlots[inventorySelectedSlot];
  inventoryDetailIcon.innerHTML='';
  if(!st){
    inventoryDetail.classList.add('empty');inventoryDetailName.textContent='アイテムを選択';inventoryDetailQty.textContent='';
    inventoryMove.disabled=true;inventorySplit.disabled=true;inventoryDrop.disabled=true;
    $('inventoryEquip').disabled=true;$('inventoryOffhandEquip').disabled=!offhandItem;renderArmorUI();return;
  }
  inventoryDetail.classList.remove('empty');inventoryDetailIcon.appendChild(itemCanvas(st.id,'item-icon'));
  inventoryDetailName.textContent=names[st.id]||'ITEM';inventoryDetailQty.textContent='× '+st.qty;
  inventoryMove.disabled=false;inventoryMove.textContent=inventorySelectedSlot<9?'インベントリへ':'ホットバーへ';
  inventorySplit.disabled=st.qty<2;inventoryDrop.disabled=false;
  $('inventoryEquip').disabled=armorPartForId(st.id)<0;
  $('inventoryOffhandEquip').disabled=!offhandItem&&!canEquipOffhand(st.id);
  renderArmorUI();
}
// Chest transfer UI. Touch a bag item to store it, or a chest item to
// retrieve it. The single-item switch is useful for splitting stacks.
function chestStatus(text){$('chestHint').textContent=text}
function chestRange(){return chestLocation&&get(chestLocation.x,chestLocation.y,chestLocation.z)===B.CHEST}
function setChestOpen(open,point=null){
  if(!open&&chestPending){flash('通信中です。少し待ってください');return}
  if(open){
    if(!point||get(point.x,point.y,point.z)!==B.CHEST)return;
    if(craftOpen)setCraftOpen(false);
    if(inventoryOpen)setInventoryOpen(false);
    chestLocation={...point,key:chestKey(point.x,point.y,point.z)};
    chestSlots(point.x,point.y,point.z);
    // Guests request the authoritative contents on first opening; a chest
    // may have been looted by a friend since the last checkpoint.
    if(multiRole==='guest'&&multiplayerNetwork.connected)
      multiplayerNetwork.send({t:'chestLook',x:point.x,y:point.y,z:point.z});
  }else chestLocation=null;
  chestOpen=!!open;$('chestScreen').classList.toggle('open',chestOpen);
  $('chestScreen').setAttribute('aria-hidden',String(!chestOpen));
  Object.keys(keys).forEach(k=>keys[k]=false);resetSprint();primaryActionStop();
  if(chestOpen){
    document.exitPointerLock?.();
    chestStatus('持ち物をタップして収納 / チェスト内をタップして取り出す');
    renderChestUI();
  }else if(started&&!matchMedia('(pointer:coarse)').matches){
    renderer.domElement.requestPointerLock?.();
  }
}
function renderChestUI(){
  if(!chestOpen||!chestLocation)return;
  const {x,y,z}=chestLocation,slots=chestSlots(x,y,z);
  const container=$('chestGrid'),bag=$('chestBagGrid');
  container.replaceChildren();bag.replaceChildren();
  const build=(st,onClick,index,fromBag)=>{
    const button=document.createElement('button');
    button.type='button';button.className='inv-slot'+(chestPending?' chest-busy':'');
    button.disabled=!!chestPending||!st;
    if(st){
      button.appendChild(itemCanvas(st.id,'item-icon'));
      const qty=document.createElement('span');qty.className='stack-qty';qty.textContent=st.qty;
      button.appendChild(qty);
      button.title=(names[st.id]||'ITEM')+' ×'+st.qty+(fromBag?' を収納':' を取り出す');
      button.setAttribute('aria-label',button.title);
    }else button.setAttribute('aria-label','空き');
    button.addEventListener('click',()=>onClick(index));
    return button;
  };
  for(let i=0;i<CHEST_SIZE;i++)container.appendChild(build(slots[i],chestSlotTap,i,false));
  for(let i=0;i<36;i++)bag.appendChild(build(inventorySlots[i],chestInventoryTap,i,true));
  $('chestSingle').textContent=chestOneAtATime?'1個ずつ：ON':'1個ずつ：OFF';
  $('chestSingle').disabled=!!chestPending;
  $('chestClose').disabled=!!chestPending;
}
function chestInventoryTap(index){
  if(!chestRange()||chestPending)return;
  const st=inventorySlots[index];if(!st)return;
  const qty=chestOneAtATime?1:st.qty;
  chestTransfer('deposit',index,qty,st.id);
}
function chestSlotTap(index){
  if(!chestRange()||chestPending)return;
  const st=chestSlots(chestLocation.x,chestLocation.y,chestLocation.z)[index];if(!st)return;
  const qty=chestOneAtATime?1:st.qty;
  chestTransfer('withdraw',index,qty,st.id);
}
function chestBroadcast(){
  if(multiRole!=='host'||!multiplayerNetwork.connected||!chestLocation)return;
  const {x,y,z}=chestLocation;
  multiplayerNetwork.send({t:'chestState',x,y,z,slots:chestSlots(x,y,z)});
}
function chestTransfer(kind,index,count,id){
  if(!chestRange()||chestPending)return;
  const {x,y,z}=chestLocation;
  if(multiRole==='guest'){
    if(!multiplayerNetwork.connected){chestStatus('接続されていません');return}
    const slots=chestSlots(x,y,z);
    if(kind==='deposit'&&(!inventorySlots[index]||inventorySlots[index].id!==id))return;
    if(kind==='withdraw'&&(!slots[index]||slots[index].id!==id))return;
    const room=kind==='deposit'?chestCapacity(slots,id):chestRoomForPlayer(id);
    const qty=Math.min(count,room);
    if(!qty){chestStatus('収納先に空きがありません');return}
    const requestId=++chestRequestId;
    chestPending={requestId,kind,index,id,qty,x,y,z,tries:0};
    sendChestRequest();
    renderChestUI();chestStatus('フレンドのワールドと同期中…');return;
  }
  const slots=chestSlots(x,y,z);
  let moved=0;
  if(kind==='deposit'){
    const st=inventorySlots[index];if(!st||st.id!==id)return;
    moved=chestAdd(slots,id,Math.min(st.qty,count));
    if(moved)removeFromSlot(index,moved);
  }else{
    const st=slots[index];if(!st||st.id!==id)return;
    const room=chestRoomForPlayer(id);
    const taken=chestTake(slots,index,Math.min(room,count));
    if(taken){
      const leftover=addItem(taken.id,taken.qty);moved=taken.qty-leftover;
      if(leftover)chestAdd(slots,taken.id,leftover);
    }
  }
  if(!moved){chestStatus('空きがありません');return}
  markSaveDirty();if(multiRole==='host')chestBroadcast();
  renderChestUI();
  chestStatus((kind==='deposit'?'収納した':'取り出した')+'：'+(names[id]||'アイテム')+' ×'+moved);
}
function chestRoomForPlayer(id){
  let total=0;
  for(const st of inventorySlots)
    total+=!st?maxStackFor(id):st.id===id?Math.max(0,maxStackFor(id)-st.qty):0;
  return total;
}
// A request is retried with the same ID. The host deduplicates it so lost
// acknowledgements cannot double-spend the chest's stored items.
function sendChestRequest(){
  const q=chestPending;if(!q||multiRole!=='guest')return;
  q.tries++;
  multiplayerNetwork.send({t:'chestTransfer',requestId:q.requestId,
    kind:q.kind,index:q.index,id:q.id,qty:q.qty,x:q.x,y:q.y,z:q.z});
  setTimeout(()=>{
    if(chestPending!==q)return;
    if(q.tries<5&&multiplayerNetwork.connected)sendChestRequest();
    else {chestPending=null;renderChestUI();chestStatus('通信が途切れました。もう一度チェストを開いて確認してください')}
  },1700);
}
function chestReceiveResult(reply){
  const q=chestPending;
  if(!q||reply.requestId!==q.requestId||reply.x!==q.x||reply.y!==q.y||reply.z!==q.z)return;
  // Keep the pending lock until both the world chest and personal inventory
  // have been updated. No other UI transaction can interleave here.
  const n=Math.max(0,Math.min(64,Number(reply.qty)||0));
  if(reply.ok&&n&&reply.id===q.id){
    if(q.kind==='deposit'){
      const st=inventorySlots[q.index];
      if(st?.id===q.id&&st.qty>=n)removeFromSlot(q.index,n);
    }else addItem(q.id,n);
  }
  if(Array.isArray(reply.slots))chestApplyState(q.x,q.y,q.z,reply.slots);
  chestPending=null;renderChestUI();
  chestStatus(reply.ok?'移動完了：'+(names[q.id]||'アイテム')+' ×'+n:reply.reason||'移動できませんでした');
}
$('chestClose').addEventListener('click',()=>setChestOpen(false));
$('chestScreen').addEventListener('pointerdown',e=>{if(e.target===$('chestScreen'))setChestOpen(false)});
$('chestSingle').addEventListener('click',()=>{chestOneAtATime=!chestOneAtATime;renderChestUI()});
function setInventoryOpen(v){
  if(v&&explorerMapOpen)closeExplorerMap(false);
  if(v&&binocularActive)closeBinoculars();
  if(v&&testPanelOpen)setTestPanelOpen(false);
  if(v&&jobOpen)setJobOpen(false);
  setShieldGuard(false);
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

  const chestDrops=id===B.CHEST?chestSpill(x,y,z):[];
  const doorOther=isDoor(id)?{x,y:y+(DOOR_TOP.has(id)?-1:1),z}:null;
  const bedFoot=isBedBlock(id)?canonicalBedFoot(x,y,z):null;
  const bedOther=isBedBlock(id)?findBedOtherHalf(x,y,z,id):null;
  const warpOther=isWarpWorkbench(id)?warpWorkbenchOther(x,y,z,id):null;
  const bagOther=isSleepingBagBlock(id)?sleepingBagOther(x,y,z,id):null;
  const brokeRespawnBed=!!(bedFoot&&bedSpawn&&bedSpawn.x===bedFoot.x&&bedSpawn.y===bedFoot.y&&bedSpawn.z===bedFoot.z);

  set(x,y,z,B.AIR);
  for(const st of chestDrops)spawnWorldDrop(st.id,st.qty,x,y,z,{scatter:true,pickupDelay:1.1});
  const torchOnTop=get(x,y+1,z)===B.TORCH;
  if(torchOnTop){
    set(x,y+1,z,B.AIR);
    spawnWorldDrop(I.TORCH,1,x,y+1,z,{pickupDelay:.45});
  }
  if(bedOther)set(bedOther.x,bedOther.y,bedOther.z,B.AIR);
  if(warpOther)set(warpOther.x,warpOther.y,warpOther.z,B.AIR);
  if(bagOther)set(bagOther.x,bagOther.y,bagOther.z,B.AIR);
  if(doorOther&&isDoor(get(doorOther.x,doorOther.y,doorOther.z)))
    set(doorOther.x,doorOther.y,doorOther.z,B.AIR);
  if(brokeRespawnBed)bedSpawn=null;

  let drop=specialBlockDrops[id]??detailedBlockModels.canonical(id);
  if(id===B.STONE)drop=B.COBBLE;
  if(id===B.GRASS)drop=B.DIRT;
  if(id===B.IRON)drop=I.RAW_IRON;
  if(id===B.GOLD)drop=I.RAW_GOLD;
  if(id===B.DIAMOND)drop=I.DIAMOND;
  if(isBedBlock(id))drop=I.BED;
  if(isDoor(id))drop=I.DOOR;
  if(id===B.TORCH)drop=I.TORCH;
  if(id===B.CHEST)drop=I.CHEST;
  if(isWarpWorkbench(id))drop=I.WARP_WORKBENCH;
  if(isSleepingBagBlock(id))drop=I.SLEEPING_BAG;

  // Stone can be broken by hand, but only a wooden pickaxe or better yields cobblestone.
  const canDrop=id!==B.STONE||pickTier()>=1;
  if(canDrop&&(buildable.includes(drop)||drop===B.COAL||drop===I.RAW_IRON||drop===I.RAW_GOLD||drop===I.DIAMOND||drop===I.CRAFTING_TABLE||drop===I.FURNACE||drop===I.BED||drop===I.DOOR||drop===I.TORCH||drop===I.CHEST||drop===I.WARP_WORKBENCH||drop===I.BOSS_ARENA_CORE||drop===I.SLEEPING_BAG)){
    const spawnAt=minedDropPosition(x,y,z);
    spawnWorldDrop(drop,1,spawnAt.x,spawnAt.y,spawnAt.z,{pickupDelay:.45});
  }
  rebuildEdited({x,z},...(bedOther?[bedOther]:[]),...(doorOther?[doorOther]:[]),...(warpOther?[warpOther]:[]),...(bagOther?[bagOther]:[]));gainXP(blockXP[id]||1,names[id]||'採掘');
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
  if(!miningHeld||craftOpen||inventoryOpen||chestOpen){clearMining();return}
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
// The door consists of two stacked block IDs. Open/closed state lives in
// the world grid, so existing saves and multiplayer block replication handle it.
function doorCounterpart(id){return DOOR_TOP.has(id)?id-1:id+1}
function doorUse(x,y,z){
  const id=get(x,y,z);if(!isDoor(id))return false;
  const bottomY=DOOR_TOP.has(id)?y-1:y;
  const base=get(x,bottomY,z);
  if(!isDoor(base)||DOOR_TOP.has(base)||get(x,bottomY+1,z)!==doorCounterpart(base)){
    flash('ドアが壊れています');return true;
  }
  const next=base+(DOOR_OPEN.has(base)?-2:2),upper=next+1;
  if(!DOOR_OPEN.has(next)){
    const touchingPlayer=Math.abs(player.pos.x-x)<PR+.5&&Math.abs(player.pos.z-z)<PR+.5&&
      player.pos.y<bottomY+1.5&&player.pos.y+PH>bottomY-.5;
    if(touchingPlayer||mobs.some(m=>mobOverlapsBlock(m,x,bottomY,z)||mobOverlapsBlock(m,x,bottomY+1,z))){
      flash('ドアの中に誰かがいます');return true;
    }
  }
  set(x,bottomY,z,next);set(x,bottomY+1,z,upper);
  rebuildEdited({x,z});return true;
}
function aimedDoor(){
  aimPlayerRay();
  const hit=target();
  // An OPEN door's drawn panel swings into an adjacent physical block,
  // while its stored voxel remains at the original doorway coordinate.
  // Use the actual mesh instance's stored coordinates first.
  if(hit&&hit.distance<=5){
    const block=lookup.get(hit.object.uuid)?.[hit.instanceId];
    if(block&&isDoor(get(block.x,block.y,block.z)))return block;
  }
  const maxDist=Math.min(5,hit?.distance==null?5:hit.distance+.18);
  for(let d=.25;d<=maxDist;d+=.12){
    const x=Math.round(ray.ray.origin.x+ray.ray.direction.x*d);
    const y=Math.round(ray.ray.origin.y+ray.ray.direction.y*d);
    const z=Math.round(ray.ray.origin.z+ray.ray.direction.z*d);
    if(isDoor(get(x,y,z)))return {x,y,z};
  }
  return null;
}
// Doors must stand on a solid floor. When the crosshair targets the upper
// part of an empty doorway or the underside of a roof, find the actual
// supported bottom cell instead of hanging a door in mid-air.
function doorSupportedBaseY(x,aimY,z){
  for(let baseY=aimY;baseY>=Math.max(Y_MIN+1,aimY-4);baseY--){
    if(!inside(x,baseY,z)||get(x,baseY,z)!==B.AIR)break;
    const upper=baseY+1;
    if(inside(x,upper,z)&&get(x,upper,z)===B.AIR&&solid(get(x,baseY-1,z)))
      return baseY;
  }
  return null;
}
function place(){
  if(jobOpen)return;
  if(chatViewActive||chestOpen||craftOpen||inventoryOpen||testPanelOpen||explorerMapOpen)return;
  if(started&&!dead&&!sleeping){
    firstPersonHand.swing(.6);
    triggerAvatarAction('use');
  }
  if(ridingHorse){flash('攻撃ボタンで馬から降りられます');return}
  const horse=aimedHorse();
  if(horse&&selected!==I.CHIMERA_SOUL&&useHorse(horse))return;
  if(useExpansionItem())return;
  if(jobWeapon(selected)?.kind==='staff'){castJobMagic(jobWeapon(selected));return}
  if(selected===I.CHIMERA_SOUL){
    const hit=target(),ground=hit&&hit.distance<=5?lookup.get(hit.object.uuid)?.[hit.instanceId]:null;
    if(!ground||!hit.face||hit.face.normal.y<.5){
      flash('キメラの魂は地面の上面に向けて使用してください');return;
    }
    useChimeraSoul(ground.x,ground.y,ground.z);
    return;
  }
  // Interacting with a chest takes priority even when holding food or
  // a placeable block. Players can always open their storage.
  const h=target();
  const aimed=h&&h.distance<=5?lookup.get(h.object.uuid)?.[h.instanceId]:null;
  if(aimed&&get(aimed.x,aimed.y,aimed.z)===B.CHEST){
    setChestOpen(true,{x:aimed.x,y:aimed.y,z:aimed.z});return;
  }
  if(aimed&&get(aimed.x,aimed.y,aimed.z)===B.BOSS_ARENA_CORE){
    if(h.object.userData.bossArenaAltar===true){setCraftOpen(true);return;}
    flash('中央の台座に照準を合わせて CRAFT で祭壇を開けます');return;
  }
  if(aimed&&isWarpWorkbench(get(aimed.x,aimed.y,aimed.z))){
    setCraftOpen(true);return;
  }
  if(aimed&&isSleepingBagBlock(get(aimed.x,aimed.y,aimed.z))){
    if(!isNightTime()){flash('寝袋で眠れるのは夜だけです');return}
    if(sleeping)return;
    const targetId=get(aimed.x,aimed.y,aimed.z);
    const partner=sleepingBagOther(aimed.x,aimed.y,aimed.z,targetId);
    // Standalone ID 78 is supported for existing saved single-cell bags.
    if(!partner&&targetId!==B.SLEEPING_BAG_WORLD){
      flash('寝袋の片側が壊れています');return;
    }
    const foot=SLEEPING_BAG_HEADS.includes(targetId)&&partner?partner:aimed;
    sleepInBed({x:foot.x,y:foot.y,z:foot.z},true);
    if(sleeping){
      // Single-use: remove both bedroll cells, never leave a stray pillow.
      set(aimed.x,aimed.y,aimed.z,B.AIR);
      if(partner)set(partner.x,partner.y,partner.z,B.AIR);
      rebuildEdited({x:aimed.x,z:aimed.z},...(partner?[partner]:[]));
    }
    return;
  }
  if(aimed&&h.distance<=5&&detailedBlockModels.interact(get(aimed.x,aimed.y,aimed.z))){
    const before=get(aimed.x,aimed.y,aimed.z),next=detailedBlockModels.toggle(before);
    if(next!==before){
      set(aimed.x,aimed.y,aimed.z,next);
      if(solid(next)&&blocked(player.pos.x,player.pos.y,player.pos.z)){
        set(aimed.x,aimed.y,aimed.z,before);
        flash('閉じる場所にプレイヤーがいます');return;
      }
      rebuildEdited({x:aimed.x,z:aimed.z});
    }
    return;
  }
  if(startEating())return;
  const door=aimedDoor();if(door&&doorUse(door.x,door.y,door.z))return;
  if(!h||!h.face)return;
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
      sleepInBed(foot);
    }else{
      saveCurrentGame(false);
      flash('リスポーン地点を設定しました。夜になると眠れます');
    }
    return;
  }

  if(selected==null||(inventory[selected]||0)<=0){flash('置けるブロックを持っていません');return}

  const n=h.face.normal,x=p.x+Math.round(n.x),y=p.y+Math.round(n.y),z=p.z+Math.round(n.z);
  if(!inside(x,y,z)||get(x,y,z)!==B.AIR)return;

  if(selected===I.BOSS_ARENA_CORE){
    // A REAL 13x13 walkable voxel floor; all edits are saved and networked.
    // Require a clear, level surface: never overwrite existing homes, doors
    // or the player's position with a one-click prefabricated building.
    if(y>WORLD_TOP-12||!h.face||h.face.normal.y<.5){
      flash('ボスアリーナは上空12マス空いた地面に設置してください');return;
    }
    const floor=[];
    for(let dz=-6;dz<=6;dz++)for(let dx=-6;dx<=6;dx++){
      if(dx*dx+dz*dz>72)continue;
      const xx=x+dx,zz=z+dz;
      if(!inside(xx,y-1,zz)||!inside(xx,y+9,zz)||
        !solid(get(xx,y-1,zz))||
        isWarpWorkbench(get(xx,y-1,zz))||
        [B.CHEST,B.BED,B.BED_HEAD,B.BOSS_ARENA_CORE].includes(get(xx,y-1,zz))||
        isDoor(get(xx,y-1,zz))||get(xx,y,zz)!==B.AIR){
        flash('アリーナには13×13マスの平らな空き地が必要です');return;
      }
      floor.push({x:xx,y:y-1,z:zz,dx,dz});
    }
    if(mobs.some(m=>Math.abs(m.position.x-x)<6&&
      Math.abs(m.position.z-z)<6&&Math.abs(m.position.y-y)<3)){
      flash('アリーナ内にモブがいます');return;
    }
    if(Math.hypot(player.pos.x-x,player.pos.z-z)<.9){
      flash('祭壇の真上では設置できません');return;
    }
    const positions=[];
    for(const cell of floor){
      const {dx,dz}=cell,outer=Math.max(Math.abs(dx),Math.abs(dz));
      const core=dx*dx+dz*dz<=10;
      const rim=outer>=5;
      const block=core||rim?B.OBSIDIAN:
        (dx+dz)%5===0?B.POLISHED_STONE:B.STONE_BRICKS;
      if(get(cell.x,cell.y,cell.z)!==block){
        set(cell.x,cell.y,cell.z,block);positions.push(cell);
      }
    }
    set(x,y,z,B.BOSS_ARENA_CORE);positions.push({x,z});
    consumeSelected(1);rebuildEdited(...positions);renderHotbar();
    flash('ボス専用アリーナが完成！黒石の神殿と戦闘床を設置しました');
    return;
  }
  if(selected===I.WARP_WORKBENCH){
    // Two cells across the player's view. Both must be empty and supported.
    const fx=-Math.sin(player.yaw),fz=-Math.cos(player.yaw);
    const alongX=Math.abs(fz)>=Math.abs(fx);
    const x2=x+(alongX?1:0),z2=z+(alongX?0:1);
    if(!inside(x2,y,z2)||get(x2,y,z2)!==B.AIR){
      flash('転送作業台は横2マスの空きが必要です');return;
    }
    if(!solid(get(x,y-1,z))||!solid(get(x2,y-1,z2))){
      flash('転送作業台は横2マスとも床の上に置いてください');return;
    }
    if(mobs.some(m=>mobOverlapsBlock(m,x,y,z)||mobOverlapsBlock(m,x2,y,z2))){
      flash('モブの中には設置できません');return;
    }
    set(x,y,z,alongX?B.WARP_WORKBENCH_X:B.WARP_WORKBENCH_Z);
    set(x2,y,z2,alongX?B.WARP_WORKBENCH_X_END:B.WARP_WORKBENCH_Z_END);
    if(blocked(player.pos.x,player.pos.y,player.pos.z)){
      set(x,y,z,B.AIR);set(x2,y,z2,B.AIR);
      rebuildEdited({x,z},{x:x2,z:z2});return;
    }
    consumeSelected(1);rebuildEdited({x,z},{x:x2,z:z2});renderHotbar();
    return;
  }
  if(selected===I.CHEST){
    if(mobs.some(m=>mobOverlapsBlock(m,x,y,z))){flash('モブの中には設置できません');return}
    set(x,y,z,B.CHEST);
    if(blocked(player.pos.x,player.pos.y,player.pos.z)){set(x,y,z,B.AIR);rebuildEdited({x,z});return}
    consumeSelected(1);rebuildEdited({x,z});return;
  }
  if(selected===I.TORCH){
    if(!solid(get(x,y-1,z))){
      flash('松明はブロックの上に設置してください');return;
    }
    set(x,y,z,B.TORCH);
    consumeSelected(1);rebuildEdited({x,z});return;
  }
  if(selected===I.DOOR){
    const baseY=doorSupportedBaseY(x,y,z);
    if(baseY===null){
      flash('ドアは床の上に置いてください（上にも2マスの空きが必要）');
      return;
    }
    const upper=baseY+1;
    const touchesPlayer=Math.abs(player.pos.x-x)<PR+.5&&Math.abs(player.pos.z-z)<PR+.5&&
      player.pos.y<upper+.5&&player.pos.y+PH>baseY-.5;
    if(touchesPlayer||mobs.some(m=>mobOverlapsBlock(m,x,baseY,z)||mobOverlapsBlock(m,x,upper,z))){
      flash('ドアの位置にプレイヤーかモブがいます');return;
    }
    const alongZ=Math.abs(Math.cos(player.yaw))>Math.abs(Math.sin(player.yaw));
    const bottom=alongZ?B.DOOR_X:B.DOOR_Z;
    set(x,baseY,z,bottom);set(x,upper,z,bottom+1);
    consumeSelected(1);rebuildEdited({x,z});return;
  }
  if(selected===I.SLEEPING_BAG){
    const {dx,dz}=bedDirectionFromYaw(),x2=x+dx,z2=z+dz;
    if(!inside(x2,y,z2)||get(x2,y,z2)!==B.AIR){
      flash('寝袋は縦2マスの空きが必要です');return;
    }
    if(!solid(get(x,y-1,z))||!solid(get(x2,y-1,z2))){
      flash('寝袋は2マスとも床の上に設置してください');return;
    }
    if(mobs.some(m=>mobOverlapsBlock(m,x,y,z)||mobOverlapsBlock(m,x2,y,z2))){
      flash('モブのいる場所には寝袋を設置できません');return;
    }
    const direction=SLEEPING_BAG_DIRECTIONS.findIndex(v=>v[0]===dx&&v[1]===dz);
    if(direction<0)return;
    const foot=SLEEPING_BAG_FEET[direction],head=SLEEPING_BAG_HEADS[direction];
    set(x,y,z,foot);set(x2,y,z2,head);
    if(consumeSelected(1)!==1){
      set(x,y,z,B.AIR);set(x2,y,z2,B.AIR);
      rebuildEdited({x,z},{x:x2,z:z2});return;
    }
    rebuildEdited({x,z},{x:x2,z:z2});renderHotbar();
    flash('2マスの寝袋を設置しました。夜に「使う」で眠れます');return;
  }
  if(selected===I.BED){
    const dir=bedDirectionFromYaw(),x2=x+dir.dx,z2=z+dir.dz;
    if(!inside(x2,y,z2)||get(x2,y,z2)!==B.AIR){
      flash('ベッドを置くには縦2マスの空きが必要です');
      return;
    }
    if(mobs.some(m=>mobOverlapsBlock(m,x,y,z)||mobOverlapsBlock(m,x2,y,z2))){
      flash('モブの中にはブロックを置けません');return;
    }
    set(x,y,z,B.BED);
    set(x2,y,z2,B.BED_HEAD);
    if(blocked(player.pos.x,player.pos.y,player.pos.z)){
      set(x,y,z,B.AIR);set(x2,y,z2,B.AIR);rebuildEdited({x,z},{x:x2,z:z2});
      return;
    }
    consumeSelected(1);rebuildEdited({x,z},{x:x2,z:z2});renderHotbar();
    return;
  }

  let blockId=(buildable.includes(selected)||(activeMap==='testworld'&&selected>B.AIR&&selected<=B.BEDROCK))?selected:placeableItemToBlock[selected];
  if(blockId==null){flash((names[selected]||'このアイテム')+'は設置できません');return}
  const forwardX=-Math.sin(player.yaw),forwardZ=-Math.cos(player.yaw);
  let direction=Math.abs(forwardX)>Math.abs(forwardZ)
    ?(forwardX>=0?1:3):(forwardZ>=0?2:0);
  if(blockId===B.LADDER){
    if(Math.abs(n.y)>.5){flash('はしごは壁の側面に設置してください');return}
    const wallX=-Math.round(n.x),wallZ=-Math.round(n.z);
    direction=Math.abs(wallX)>Math.abs(wallZ)?(wallX>0?1:3):(wallZ>0?2:0);
  }
  if(blockId===B.WOOD_SLAB){
    // On a ceiling, or on the upper half of a wall, place a TOP half-slab.
    if(n.y<-.5||(Math.abs(n.y)<.5&&h.point.y-p.y>0))
      blockId=B.WOOD_SLAB_TOP;
  }
  blockId=detailedBlockModels.placedVariant(blockId,direction);
  if(mobs.some(m=>mobOverlapsBlock(m,x,y,z))){
    flash('モブの中にはブロックを置けません');return;
  }
  set(x,y,z,blockId);
  if(blocked(player.pos.x,player.pos.y,player.pos.z)){set(x,y,z,B.AIR);return}
  consumeSelected(1);rebuildEdited({x,z});renderHotbar();
}

function prepareMobHitMaterials(root){
  root.traverse(o=>{
    if(!o.isMesh||!o.material)return;
    if(!o.userData.mobOwnMaterial){
      o.material=o.material.clone();
      o.userData.mobOwnMaterial=true;
    }
    if(o.userData.mobBaseColor==null&&o.material?.color)
      o.userData.mobBaseColor=o.material.color.getHex();
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
  if(type==='chimera'){
    // Temporary fixed loot: 20 hide, 6 fangs and 6 horns per kill.
    spawnWorldDrop(I.CHIMERA_HIDE,20,x-.25,root.position.y+1.5,z,{scatter:true,pickupDelay:.55});
    spawnWorldDrop(I.CHIMERA_FANG,6,x+.3,root.position.y+1.5,z-.3,{scatter:true,pickupDelay:.55});
    spawnWorldDrop(I.CHIMERA_HORN,6,x,root.position.y+1.5,z+.35,{scatter:true,pickupDelay:.55});
    return;
  }
  if(type==='zombie'||type==='spider'||type==='eagle'||type==='shark'||type==='villager')return;
  if(type==='golem'){
    spawnWorldDrop(B.COBBLE,2+Math.floor(Math.random()*4),x,y,z,{scatter:true,pickupDelay:.55});
    return;
  }
  if(type==='deer'||type==='wolf'||type==='bear'||type==='crocodile'||type==='elephant'){
    spawnWorldDrop(I.LEATHER,type==='elephant'?3:1+Math.floor(Math.random()*2),
      x,y,z,{scatter:true,pickupDelay:.55});return;
  }
  if(type==='boar'){
    spawnWorldDrop(I.RAW_PORK,1+Math.floor(Math.random()*3),x,y,z,{scatter:true,pickupDelay:.55});
    return;
  }
  if(type==='skeleton'){
    spawnWorldDrop(I.ARROW,1+Math.floor(Math.random()*2),x,y,z,
      {scatter:true,pickupDelay:.55});
    return;
  }
  if(type==='lion'){
    spawnWorldDrop(I.LION_FANG,1+Math.floor(Math.random()*2),x,y,z,{scatter:true,pickupDelay:.55});
    return;
  }
  if(type==='bison'){
    spawnWorldDrop(I.BUFFALO_HORN,1,x-.18,y,z,{scatter:true,pickupDelay:.55});
    return;
  }
  if(type==='anaconda'){
    spawnWorldDrop(I.ANACONDA_HIDE,1+Math.floor(Math.random()*2),x,y,z,{scatter:true,pickupDelay:.55});
    return;
  }
  if(type==='horse'){
    spawnWorldDrop(I.LEATHER,1+Math.floor(Math.random()*2),x,y,z,{scatter:true,pickupDelay:.55});
    return;
  }
  if(type===0){
    spawnWorldDrop(I.WOOL,1+Math.floor(Math.random()*2),x,y,z,{scatter:true,pickupDelay:.55});
  }else if(type===1){
    spawnWorldDrop(I.RAW_PORK,1+Math.floor(Math.random()*2),x,y,z,{scatter:true,pickupDelay:.55});
  }else{
    spawnWorldDrop(I.RAW_BEEF,1+Math.floor(Math.random()*2),x,y,z,{scatter:true,pickupDelay:.55});
    spawnWorldDrop(I.LEATHER,1,x+.12,y,z+.08,{scatter:true,pickupDelay:.55});
  }
}
// Visual flight effects for the new bow item.
const flyingArrows=[],BOW_DRAW_MS=900;
let selectedArrowAmmo=I.ARROW;
const usableArrowAmmo=()=>((inventory[selectedArrowAmmo]||0)>0?selectedArrowAmmo:(inventory[I.ARROW]||0)>0?I.ARROW:(inventory[I.POISON_ARROW]||0)>0?I.POISON_ARROW:null);
let bowDrawing=false,bowDrawStart=0,bowLastShot=-1000;
const arrowForward=new THREE.Vector3(0,0,-1);
function arrowModel(poison=false){
  const m=new THREE.Group();
  cube(m,.045,.045,.7,0x986337,0,0,.04);
  cube(m,.14,.13,.15,poison?0x36ed76:0xbec6cc,0,0,-.38);
  cube(m,.13,.025,.17,0xe8e1c8,0,.06,.34);
  cube(m,.025,.13,.17,0xdce0df,0,0,.34);
  return m;
}
function removeFlyingArrow(index){
  const shot=flyingArrows[index];if(!shot)return;
  scene.remove(shot.model);
  shot.model.traverse(o=>{if(o.isMesh)o.geometry.dispose()});
  flyingArrows.splice(index,1);
}
function clearFlyingArrows(){
  while(flyingArrows.length)removeFlyingArrow(flyingArrows.length-1);
  clearSkeletonArrows();
  bowDrawing=false;bowDrawStart=0;
}
// Enemy projectiles have their OWN hit test; they cannot harm the skeleton,
// never consume the player's arrows and cannot harm other mobs.
const skeletonArrows=[];
function removeSkeletonArrow(index){
  const shot=skeletonArrows[index];
  if(!shot)return;
  scene.remove(shot.model);
  shot.model.traverse(o=>{if(o.isMesh)o.geometry.dispose()});
  skeletonArrows.splice(index,1);
}
function clearSkeletonArrows(){
  while(skeletonArrows.length)removeSkeletonArrow(skeletonArrows.length-1);
}
function shootSkeletonArrow(origin,target,attacker){
  const dx=target.x-origin.x,dz=target.z-origin.z;
  const horizontal=Math.hypot(dx,dz);
  if(horizontal<.5||horizontal>23)return false;
  const speed=17.0,time=horizontal/speed,gravity=10.5;
  const velocity=new THREE.Vector3(
    dx/horizontal*speed,
    (target.y-origin.y+.5*gravity*time*time)/time,
    dz/horizontal*speed);
  if(Math.abs(velocity.y)>17)return false;
  if(skeletonArrows.length>=22)removeSkeletonArrow(0);
  const model=arrowModel();
  model.position.copy(origin);
  model.quaternion.setFromUnitVectors(arrowForward,velocity.clone().normalize());
  scene.add(model);
  skeletonArrows.push({model,velocity,age:0,attacker:{
    x:attacker.x,y:attacker.y,z:attacker.z
  }});
  return true;
}
function updateSkeletonArrows(dt){
  for(let i=skeletonArrows.length-1;i>=0;i--){
    const shot=skeletonArrows[i];
    shot.age+=dt;
    if(shot.age>3.2){removeSkeletonArrow(i);continue}
    const velocity=shot.velocity;
    const displacement=velocity.clone().multiplyScalar(dt);
    const steps=Math.max(1,Math.ceil(displacement.length()/.12));
    const advance=displacement.divideScalar(steps);
    const pos=shot.model.position.clone();
    let stopped=false;
    for(let j=0;j<steps;j++){
      pos.add(advance);
      if(pos.y<Y_MIN||pos.y>WORLD_TOP+2){stopped=true;break}
      if(solid(get(Math.round(pos.x),Math.round(pos.y),Math.round(pos.z)))){
        stopped=true;break;
      }
      const dx=pos.x-player.pos.x,dz=pos.z-player.pos.z;
      if(dx*dx+dz*dz<.39*.39&&pos.y>player.pos.y+.06&&
        pos.y<player.pos.y+PH-.08){
        damagePlayer(2,'スケルトンの矢の攻撃',shot.attacker);
        stopped=true;break;
      }
    }
    if(stopped){removeSkeletonArrow(i);continue}
    shot.model.position.copy(pos);
    velocity.y-=10.5*dt;
    shot.model.quaternion.setFromUnitVectors(arrowForward,velocity.clone().normalize());
  }
}
function spawnFlyingArrow(origin,direction,power=1,visualOnly=false,bowId=I.BOW,ammoType=I.ARROW){
  const vec=new THREE.Vector3(direction.x,direction.y,direction.z);
  if(![origin.x,origin.y,origin.z,vec.x,vec.y,vec.z,power].every(Number.isFinite)||vec.lengthSq()<.5)return false;
  vec.normalize();if(flyingArrows.length>=36)removeFlyingArrow(0);
  const model=arrowModel(ammoType===I.POISON_ARROW),velocity=vec.multiplyScalar(14+17*Math.max(.15,Math.min(1,power)));
  model.position.set(origin.x,origin.y,origin.z);
  model.quaternion.setFromUnitVectors(arrowForward,velocity.clone().normalize());
  scene.add(model);
  flyingArrows.push({model,velocity,age:0,power,visualOnly,bowId,ammoType});
  return true;
}
function updateFlyingArrows(dt){
  for(let i=flyingArrows.length-1;i>=0;i--){
    const shot=flyingArrows[i];shot.age+=dt;
    if(shot.age>5.5){removeFlyingArrow(i);continue}
    shot.velocity.y-=10.5*dt;
    const position=shot.model.position.clone();
    const motion=shot.velocity.clone().multiplyScalar(dt);
    const steps=Math.max(1,Math.ceil(motion.length()/.18));
    const step=motion.divideScalar(steps);
    let stopped=false;
    for(let j=0;j<steps;j++){
      position.add(step);
      if(position.y<Y_MIN||position.y>WORLD_TOP+2){stopped=true;break}
      if(solid(get(Math.round(position.x),Math.round(position.y),Math.round(position.z)))){stopped=true;break}
      if(!shot.visualOnly&&arrowHitNearbyMob(position,shot.power,shot.bowId,shot.ammoType)){stopped=true;break}
    }
    if(stopped){removeFlyingArrow(i);continue}
    shot.model.position.copy(position);
    shot.model.quaternion.setFromUnitVectors(arrowForward,shot.velocity.clone().normalize());
  }
}
function bowHitDamage(power,bow,attackerJob=activeJob){
  const charged=Math.max(.15,Math.min(1,Number.isFinite(power)?power:0));
  const jobBow=jobWeapon(bow);
  if(jobBow?.kind==='bow')return Math.max(1,Math.round((1+jobBow.damage*charged)*(attackerJob==='all'?.65:1)));
  const raw=bow===I.CHIMERA_BOW?Math.round(2+5*charged):bow===I.CROSSBOW?Math.round(3+5*charged):Math.max(1,Math.round(1+3*charged));
  return attackerJob==='all'&&jobSelected?Math.max(1,Math.round(raw*.65)):raw;
}
function arrowHitNearbyMob(point,power,bowId=I.BOW,ammoType=I.ARROW){
  for(const m of mobs){
    if(m.userData.hp<=0)continue;
    const [bottom,top]=mobVerticalBounds(m);
    if(point.y<bottom-.1||point.y>top+.1)continue;
    for(const [x,z,r,low,high] of mobCollisionShape(m,m.position.x,m.position.z)){
      if(low!=null&&point.y<m.position.y+low-.1)continue;
      if(high!=null&&point.y>m.position.y+high+.1)continue;
      const dx=point.x-x,dz=point.z-z;
      if(dx*dx+dz*dz>(r+.10)*(r+.10))continue;
      damageMob(m,bowHitDamage(power,bowId),'arrow',power,'host',ammoType===I.POISON_ARROW);
      return true;
    }
  }
  return false;
}
const isBowWeapon=id=>id===I.BOW||id===I.CHIMERA_BOW||id===I.CROSSBOW||jobWeapon(id)?.kind==='bow';
function updateBowDraw(now){
  if(!bowDrawing)return;
  if(!started||dead||!isBowWeapon(selected)||!jobCanUse(activeJob,selected)){endBowDraw(false);return}
  const pct=Math.min(100,(now-bowDrawStart)/(jobWeapon(selected)?.draw||BOW_DRAW_MS)*100);
  breakLabel.textContent=(usableArrowAmmo()===I.POISON_ARROW?'毒矢':'弓')+' '+Math.floor(pct)+'%（離すと発射）';
  breakFill.style.width=pct+'%';
  breakMeter.classList.add('active');
}
function startBowDraw(){
  if(bowDrawing)return;
  if(!usableArrowAmmo()){flash('矢も毒矢もありません');return}
  bowDrawing=true;bowDrawStart=performance.now();
  updateBowDraw(bowDrawStart);
}
function endBowDraw(fire=false){
  if(!bowDrawing)return;
  const duration=performance.now()-bowDrawStart;
  bowDrawing=false;bowDrawStart=0;
  clearMining();
  if(!fire||!isBowWeapon(selected)||!jobCanUse(activeJob,selected)||dead||!started||craftOpen||inventoryOpen||chestOpen)return;
  const now=performance.now();
  if(now-bowLastShot<(jobWeapon(selected)?.cooldown||230))return;
  const ammo=usableArrowAmmo();
  if(!ammo){flash('矢も毒矢もありません');return}
  aimPlayerRay();
  const origin=gameplayAimOrigin.clone().addScaledVector(gameplayAimDirection,.65);
  origin.y-=.08;
  const power=Math.max(.2,Math.min(1,duration/(jobWeapon(selected)?.draw||BOW_DRAW_MS)));
  if(removeItem(ammo,1)!==0){flash('矢がありません');return}
  bowLastShot=now;
  triggerAvatarAction('fire');
  spawnFlyingArrow(origin,gameplayAimDirection,power,false,selected,ammo);
  if(multiRole&&multiplayerNetwork.connected){
    multiplayerNetwork.send({t:'arrowShot',x:origin.x,y:origin.y,z:origin.z,
      dx:gameplayAimDirection.x,dy:gameplayAimDirection.y,dz:gameplayAimDirection.z,
      power,ammoType:ammo,id:multiOwnId()});
  }
}
// Java Edition-style attack recharge: a sword takes about 0.625 seconds
// between full-strength hits. All melee weapons use this pacing for now.
const PLAYER_MELEE_COOLDOWN_MS=625;
let lastPlayerMeleeAt=-Infinity;
function attackMob(){
  const weapon=jobWeapon(selected);
  if(weapon&&!jobCanUse(activeJob,selected))return false;
  aimPlayerRay();
  const reach=weapon?weapon.range:(selected===I.SPEAR?5.5:4.5);
  const hits=ray.intersectObjects(mobs,true).filter(h=>h.distance<=reach);
  if(!hits.length)return false;
  let root=hits[0].object;
  while(root.parent&&!mobs.includes(root))root=root.parent;
  if(!mobs.includes(root))return false;
  const now=performance.now();
  const delay=weapon?Math.round(weapon.cooldown*(activeJob==='all'?1.25:1)):
    [I.CHIMERA_DAGGER,I.IRON_DAGGER].includes(selected)?425:
    [I.HAMMER,I.BATTLE_AXE].includes(selected)?850:PLAYER_MELEE_COOLDOWN_MS;
  if(now-lastPlayerMeleeAt<delay)return true;
  lastPlayerMeleeAt=now;
  if(weapon){
    firstPersonHand.swing(1,weapon.kind==='spear'?'thrust':'swing');
    triggerAvatarAction(weapon.kind==='spear'?'thrust':'attack');
  }
  let damage=meleeMobDamage(selected);
  if(jobSelected&&activeJob==='all'&&!weapon)damage=Math.max(1,Math.round(damage*.65));
  damageMob(root,damage);
  return true;
}
function meleeMobDamage(weapon,attackerJob=activeJob){
  const j=jobWeapon(weapon);
  if(j)return Math.max(1,Math.round(j.damage*(attackerJob==='all'?.65:1)));
  return weapon===I.CHIMERA_DAGGER?5:weapon===I.SPEAR?3:weapon===I.IRON_DAGGER?2:weapon===I.BATTLE_AXE?5:weapon===I.HAMMER?6:weapon===I.DIAMOND_SWORD?4:weapon===I.IRON_SWORD?3:
    weapon===I.GOLD_SWORD?2:weapon===I.STONE_SWORD?2:1;
}
function damageMob(root,damage,via='melee',power=1,attackerId='host',poison=false){
  if(!root||!mobs.includes(root)||root.userData.hp<=0)return;
  if(multiRole==='guest'){
    const id=root.userData.netId;
    if(!id||!multiplayerNetwork.connected)return;
    setMobHitFlash(root);
    multiplayerNetwork.send({t:'mobHit',id,via,power,poison:!!poison});
    return true;
  }
  root.userData.hp-=damage;
  if(poison&&via==='arrow'&&root.userData.hp>0){root.userData.poisonRemaining=6;root.userData.poisonTimer=1}
  setMobHitFlash(root);
  if(root.userData.type==='golem'&&root.userData.hp>0){
    root.userData.hostile=true;
    root.userData.hostileTargetId=attackerId;
    root.userData.hostileUntil=performance.now()+12000;
    root.userData.attackCooldown=Math.max(root.userData.attackCooldown||0,.45);
  }else if(root.userData.type==='bison'||root.userData.type==='lion'||root.userData.type==='anaconda'||root.userData.type==='chimera'||
      ['wolf','bear','boar','crocodile','elephant','spider','shark','eagle'].includes(root.userData.type)){
    root.userData.hostile=true;
    root.userData.attackCooldown=Math.max(root.userData.attackCooldown||0,.45);
  }else if(root.userData.type!=='zombie'&&root.userData.type!=='skeleton')makeMobFlee(root);

  if(root.userData.hp<=0){
    if(root.userData.type==='horse'&&root.userData.saddled){
      spawnWorldDrop(I.SADDLE,1,root.position.x,root.position.y+1,root.position.z,{scatter:true,pickupDelay:.55});
      if(ridingHorse===root)ridingHorse=null;
    }
    const earned=defeatedMobXP(root),name=root.userData.name||'動物';
    dropMobLoot(root);
    if(root.userData.type==='zombie'||root.userData.type==='skeleton'||root.userData.type==='chimera'||root.userData.type==='villager'||NEW_MOB_TYPES.has(root.userData.type))removeZombie(root);
    else {scene.remove(root);const i=mobs.indexOf(root);if(i>=0)mobs.splice(i,1)}
    gainXP(earned,name+'を倒した');
  }
  return true;
}


/* Expansion: recoverable throwing knives, animated fire, and utility items. */
const thrownKnives=[],activeFlames=[];

const burningBlocks=new Map();
const FLAMMABLE_BLOCKS=new Set([B.LOG,B.LEAF,B.PLANK,B.WOOD_STAIRS,B.WOOD_STAIRS_E,
  B.WOOD_STAIRS_S,B.WOOD_STAIRS_W,B.WOOD_SLAB,B.WOOD_FENCE,
  B.FENCE_GATE,B.FENCE_GATE_E,B.FENCE_GATE_S,B.FENCE_GATE_W,
  B.BOOKSHELF,B.BARREL,B.CRAFTING_TABLE,B.CHEST]);
const FIRE_OFFSETS=[[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]];
let fireUpdateAccumulator=0;
const fireKey=(x,y,z)=>x+','+y+','+z;
function serializeBurningBlocks(){
  return [...burningBlocks.values()].slice(0,70).map(f=>({x:f.x,y:f.y,z:f.z,age:f.age,life:f.life}));
}
function restoreBurningBlocks(rows){
  burningBlocks.clear();
  if(!Array.isArray(rows))return;
  for(const f of rows.slice(0,70)){
    if(!f||![f.x,f.y,f.z,f.age,f.life].every(Number.isFinite)||
       ![f.x,f.y,f.z].every(Number.isInteger)||!inside(f.x,f.y,f.z)||
       !FLAMMABLE_BLOCKS.has(get(f.x,f.y,f.z)))continue;
    const life=Math.max(12,Math.min(65,f.life));
    burningBlocks.set(fireKey(f.x,f.y,f.z),{
      x:f.x,y:f.y,z:f.z,age:Math.max(0,Math.min(life-.1,f.age)),
      life,spark:0,spread:0
    });
  }
}
function startWoodFire(x,y,z){
  if(!inside(x,y,z)||!FLAMMABLE_BLOCKS.has(get(x,y,z)))return false;
  const key=fireKey(x,y,z);
  if(burningBlocks.has(key))return true;
  if(burningBlocks.size>=70)return false;
  burningBlocks.set(key,{x,y,z,age:0,life:28+Math.random()*19,spark:0,spread:0});
  createFlame(x,y+.28,z,3.4,'molotov');markSaveDirty();
  return true;
}
function extinguishNearWater(x,y,z){
  let changed=false;
  for(const [key,f] of burningBlocks){
    if(Math.abs(f.x-x)<=1&&Math.abs(f.y-y)<=1&&Math.abs(f.z-z)<=1){
      burningBlocks.delete(key);changed=true;
    }
  }
  if(changed)markSaveDirty();
}
function updateBurningBlocks(dt){
  if(multiRole==='guest'||!started)return;
  fireUpdateAccumulator+=dt;
  if(fireUpdateAccumulator<.35)return;
  const passed=Math.min(1,fireUpdateAccumulator);
  fireUpdateAccumulator=0;
  const affected=[];
  for(const [key,f] of [...burningBlocks]){
    if(!FLAMMABLE_BLOCKS.has(get(f.x,f.y,f.z))){
      burningBlocks.delete(key);continue;
    }
    if(FIRE_OFFSETS.some(([dx,dy,dz])=>get(f.x+dx,f.y+dy,f.z+dz)===B.WATER)){
      burningBlocks.delete(key);markSaveDirty();continue;
    }
    f.age+=passed;f.spark+=passed;f.spread+=passed;
    if(f.spark>=2.65){f.spark=0;createFlame(f.x,f.y+.28,f.z,3.2,'molotov')}
    if(f.spread>=6.5){
      f.spread=0;
      const options=FIRE_OFFSETS.map((o,i)=>({o,sort:Math.random()})).sort((a,b)=>a.sort-b.sort);
      let count=0;
      for(const {o:[dx,dy,dz]} of options){
        if(count>=2)break;
        if(Math.random()<.60&&startWoodFire(f.x+dx,f.y+dy,f.z+dz))count++;
      }
    }
    if(f.age>=f.life){
      burningBlocks.delete(key);set(f.x,f.y,f.z,B.AIR);
      affected.push({x:f.x,z:f.z});markSaveDirty();
    }
  }
  if(affected.length)rebuildEdited(...affected);
}

function launchThrowingKnife(){
  if((inventory[I.THROWING_KNIFE]||0)<1)return;
  aimPlayerRay();
  const start=gameplayAimOrigin.clone().addScaledVector(gameplayAimDirection,.75);
  const velocity=gameplayAimDirection.clone().multiplyScalar(17);
  const model=new THREE.Group();
  cube(model,.065,.065,.68,0xc7d5db,0,0,-.07);
  cube(model,.17,.12,.18,0x79583c,0,0,.3);
  model.position.copy(start);scene.add(model);
  if(consumeSelected(1)!==1){scene.remove(model);return}
  thrownKnives.push({model,velocity,age:0});
  flash('投げナイフを投げた！ 着地点で回収できます');
}
function settleKnife(shot){
  const p=shot.model.position;
  spawnWorldDrop(I.THROWING_KNIFE,1,p.x,p.y,p.z,{pickupDelay:.6});
  scene.remove(shot.model);shot.model.traverse(o=>{if(o.isMesh)o.geometry.dispose()});
}
function updateThrownKnives(dt){
  for(let i=thrownKnives.length-1;i>=0;i--){
    const shot=thrownKnives[i];shot.age+=dt;
    shot.velocity.y-=12*dt;
    const step=shot.velocity.clone().multiplyScalar(dt);
    const count=Math.max(1,Math.ceil(step.length()/.12));step.divideScalar(count);
    let hit=shot.age>6;
    for(let k=0;k<count&&!hit;k++){
      shot.model.position.add(step);
      const p=shot.model.position;
      if(p.y<Y_MIN||p.y>WORLD_TOP+1||solid(get(Math.round(p.x),Math.round(p.y),Math.round(p.z)))){
        shot.model.position.sub(step.multiplyScalar(.45));hit=true;break;
      }
      for(const mob of mobs){
        if(mob.userData.hp<=0||Math.hypot(p.x-mob.position.x,p.z-mob.position.z)>1)continue;
        const [bottom,top]=mobVerticalBounds(mob);
        if(p.y>=bottom&&p.y<=top){damageMob(mob,3,'arrow',.7);hit=true;break}
      }
    }
    if(hit){settleKnife(shot);thrownKnives.splice(i,1)}
    else shot.model.rotation.x+=dt*19;
  }
}
function createFlame(x,y,z,life=5,source='fire'){
  const group=new THREE.Group();
  const shards=[];
  for(let i=0;i<8;i++){
    const color=i%3===0?0xffe76e:i%3===1?0xff8428:0xe83919;
    const material=new THREE.MeshBasicMaterial({color,transparent:true,opacity:.85,depthWrite:false});
    const mesh=new THREE.Mesh(new THREE.ConeGeometry(.13+Math.random()*.11,.4+Math.random()*.38,4),material);
    mesh.position.set((Math.random()-.5)*.9,.23+Math.random()*.25,(Math.random()-.5)*.9);
    group.add(mesh);shards.push(mesh);
  }
  group.position.set(x,y,z);scene.add(group);
  activeFlames.push({group,shards,age:0,life,source,damageClock:0});
  if(activeFlames.length>120){
    const old=activeFlames.shift();scene.remove(old.group);
    old.group.traverse(o=>{if(o.isMesh){o.geometry.dispose();o.material.dispose()}});
  }
}
function updateExpansionEffects(dt){
  updateThrownKnives(dt);
  updateBurningBlocks(dt);
  for(let i=activeFlames.length-1;i>=0;i--){
    const f=activeFlames[i];f.age+=dt;f.damageClock+=dt;
    for(let j=0;j<f.shards.length;j++){
      const mesh=f.shards[j];
      mesh.scale.y=.65+.38*Math.sin(f.age*12+j*2);
      mesh.position.y=.18+.12*Math.sin(f.age*9+j*3);
      mesh.material.opacity=Math.max(0,.9*(1-f.age/f.life));
    }
    if(f.source==='molotov'&&f.damageClock>.7){
      f.damageClock=0;
      if(Math.hypot(player.pos.x-f.group.position.x,player.pos.z-f.group.position.z)<1.1)
        damagePlayer(1,'炎に触れた');
      if(multiRole!=='guest')for(const mob of [...mobs]){
        if(Math.hypot(mob.position.x-f.group.position.x,mob.position.z-f.group.position.z)<1.2)
          damageMob(mob,1,'fire');
      }
    }
    if(f.age>=f.life){
      scene.remove(f.group);f.group.traverse(o=>{if(o.isMesh){o.geometry.dispose();o.material.dispose()}});
      activeFlames.splice(i,1);
    }
  }
}
function igniteBlockAt(x,y,z){
  if(get(x,y,z)===B.TNT){
    const visited=new Set();
    for(let dx=-2;dx<=2;dx++)for(let dy=-2;dy<=2;dy++)for(let dz=-2;dz<=2;dz++){
      if(dx*dx+dy*dy+dz*dz>7)continue;
      const bx=x+dx,by=y+dy,bz=z+dz,id=get(bx,by,bz);
      if(id===B.AIR||id===B.BEDROCK||!inside(bx,by,bz))continue;
      set(bx,by,bz,B.AIR);visited.add(bx+','+bz);
    }
    for(const key of visited){const [cx,cz]=key.split(',').map(Number);rebuildEdited({x:cx,z:cz})}
    for(let i=0;i<10;i++)createFlame(x+(Math.random()-.5)*3,y+.2,z+(Math.random()-.5)*3,1.3,'visual');
    if(Math.hypot(player.pos.x-x,player.pos.z-z)<4)damagePlayer(5,'TNTの爆発');
    flash('TNTが爆発した！');return true;
  }
  if(startWoodFire(x,y,z)){flash('火がついた！ 木は燃え続けて周囲に広がる');return true}
  createFlame(x,y+.6,z,5,'molotov');return true;
}
function throwMolotov(){
  if((inventory[I.MOLOTOV]||0)<1)return;
  aimPlayerRay();
  const start=gameplayAimOrigin.clone().addScaledVector(gameplayAimDirection,.6);
  const raycast=target();
  const impact=raycast&&raycast.distance<12?raycast.point:
    start.clone().addScaledVector(gameplayAimDirection,8);
  const y=Math.max(Y_MIN+1,Math.min(WORLD_TOP,impact.y));
  consumeSelected(1);
  for(let i=0;i<5;i++)createFlame(impact.x+(Math.random()-.5)*1.8,y,impact.z+(Math.random()-.5)*1.8,6,'molotov');
  flash('火炎瓶を投げた！');
}

/* Real world map: procedural terrain rendered north-up, incrementally so iPads
   remain responsive. The arrow is the player, not a text-only coordinate. */
let explorerMapOpen=false,explorerMapZoom=2,explorerMapRenderSerial=0;
let binocularActive=false,binocularPreviousMode=0;
let gliderActive=false; // Deployed by using the glider; persists only until landing or putting it away.
function drawExplorerMap(){
  const g=$('explorerMapCanvas').getContext('2d',{alpha:false});if(!g)return;
  const ticket=++explorerMapRenderSerial,size=100,tile=4,scale=explorerMapZoom;
  const cx=Math.floor(player.pos.x),cz=Math.floor(player.pos.z);
  const x0=cx-50*scale,z0=cz-50*scale;
  $('explorerMapCoords').textContent='X '+cx+' · Z '+cz;
  $('explorerMapScale').textContent=size*scale+' × '+size*scale;
  g.fillStyle='#c8c4a8';g.fillRect(0,0,400,400);
  let row=0;
  function batch(){
    if(!explorerMapOpen||ticket!==explorerMapRenderSerial)return;
    const end=Math.min(size,row+5);
    for(;row<end;row++)for(let col=0;col<size;col++){
      const x=x0+col*scale,z=z0+row*scale;
      const info=columnInfo(x,z),h=info.h,bio=info.bio;
      let color;
      if(activeMap==='testworld')color=[118,127,132];
      else if(h<=SEA||info.river||info.lake)color=[47,118,160];
      else if(bio===2||bio===6)color=[216,193,132];
      else if(bio===4)color=[221,236,229];
      else if(bio===3)color=[70,110,83];
      else if(bio===5)color=[81,116,84];
      else if(bio===8)color=[45,116,62];
      else if(bio===1)color=[75,138,78];
      else if(info.rugged>.52)color=[119,128,127];
      else color=[122,166,91];
      const lift=Math.max(-23,Math.min(23,(h-SEA)*.62));
      g.fillStyle='rgb('+color.map(c=>Math.max(0,Math.min(255,Math.round(c+lift)))).join(',')+')';
      g.fillRect(col*tile,row*tile,tile,tile);
    }
    if(row<size){requestAnimationFrame(batch);return}
    g.strokeStyle='rgba(40,55,42,.17)';g.lineWidth=1;
    for(let i=0;i<=size;i+=10){
      const n=i*tile+.5;
      g.beginPath();g.moveTo(n,0);g.lineTo(n,400);g.stroke();
      g.beginPath();g.moveTo(0,n);g.lineTo(400,n);g.stroke();
    }
    const mark=(p,color,label)=>{
      if(!p||![p.x,p.z].every(Number.isFinite))return;
      const x=(p.x-x0)/scale*tile,z=(p.z-z0)/scale*tile;
      if(x<0||x>=400||z<0||z>=400)return;
      g.beginPath();g.arc(x,z,5,0,Math.PI*2);g.fillStyle=color;g.fill();
      g.strokeStyle='#fff';g.lineWidth=2;g.stroke();
      if(label){g.font='bold 12px monospace';g.fillStyle='#fff';g.fillText(label,x+9,z-7)}
    };
    mark(initialSpawn,'#e9c34c','SPAWN');mark(bedSpawn,'#dc83b7','BED');
    g.save();g.translate((cx-x0)/scale*tile,(cz-z0)/scale*tile);
    g.rotate(-player.yaw);g.lineWidth=3;g.strokeStyle='#23362e';g.fillStyle='#fff';
    g.beginPath();g.moveTo(0,-12);g.lineTo(8,9);g.lineTo(0,4);g.lineTo(-8,9);g.closePath();
    g.stroke();g.fill();g.restore();
  }
  requestAnimationFrame(batch);
}
function closeExplorerMap(returnFocus=true){
  if(!explorerMapOpen)return;
  explorerMapOpen=false;explorerMapRenderSerial++;
  $('explorerMapOverlay').classList.remove('open');
  $('explorerMapOverlay').setAttribute('aria-hidden','true');
  if(returnFocus&&started&&!matchMedia('(pointer:coarse)').matches)
    renderer.domElement.requestPointerLock?.();
}
function openExplorerMap(){
  if(!started||dead||sleeping)return;
  if(inventoryOpen)setInventoryOpen(false);
  if(craftOpen)setCraftOpen(false);
  if(testPanelOpen)setTestPanelOpen(false);
  if(chestOpen)setChestOpen(false);
  closeBinoculars();
  explorerMapOpen=true;
  $('explorerMapOverlay').classList.add('open');
  $('explorerMapOverlay').setAttribute('aria-hidden','false');
  Object.keys(keys).forEach(k=>keys[k]=false);resetSprint();
  primaryActionStop();document.exitPointerLock?.();
  drawExplorerMap();
}
function closeBinoculars(){
  if(!binocularActive)return;
  binocularActive=false;cameraMode=binocularPreviousMode;
  camera.fov=73;camera.updateProjectionMatrix();updateViewLabel();
  $('binocularOverlay').classList.remove('active');
  $('binocularOverlay').setAttribute('aria-hidden','true');
}
function toggleBinoculars(){
  if(!started||dead||sleeping)return;
  if(binocularActive){closeBinoculars();return}
  binocularPreviousMode=cameraMode;
  binocularActive=true;cameraMode=0;updateViewLabel();
  camera.fov=24;camera.updateProjectionMatrix();
  $('binocularOverlay').classList.add('active');
  $('binocularOverlay').setAttribute('aria-hidden','false');
  flash('双眼鏡：拡大中 · もう一度使用すると解除');
}
$('explorerMapClose').addEventListener('click',()=>closeExplorerMap());
$('explorerMapOverlay').addEventListener('pointerdown',e=>{
  if(e.target===$('explorerMapOverlay'))closeExplorerMap()
});
$('explorerMapPlus').addEventListener('click',()=>{
  explorerMapZoom=Math.max(1,explorerMapZoom/2);drawExplorerMap();
});
$('explorerMapMinus').addEventListener('click',()=>{
  explorerMapZoom=Math.min(8,explorerMapZoom*2);drawExplorerMap();
});
$('binocularClose').addEventListener('click',closeBinoculars);

function useExpansionItem(){
  if(selected===I.POISON_ARROW||selected===I.ARROW){
    selectedArrowAmmo=selected;
    flash(selected===I.POISON_ARROW?'毒矢を装填した。弓で撃てます':'普通の矢を装填した');return true;
  }
  if(selected===I.THROWING_KNIFE){launchThrowingKnife();return true}
  if(selected===I.MOLOTOV){throwMolotov();return true}
  if(selected===I.FLINT_STEEL){
    const hit=target(),p=hit&&hit.distance<=5?lookup.get(hit.object.uuid)?.[hit.instanceId]:null;
    if(!p){flash('着火するブロックに照準を合わせてください');return true}
    igniteBlockAt(p.x,p.y,p.z);return true;
  }
  if(selected===I.HEAL_POTION){
    if(health>=MAX_HEALTH){flash('体力は満タンです');return true}
    consumeSelected(1);health=Math.min(MAX_HEALTH,health+10);renderHealth();
    flash('体力を5ハート回復した');return true;
  }
  if(selected===I.STAMINA_POTION){
    consumeSelected(1);stamina=MAX_STAMINA;staminaRunSeconds=0;renderStamina();
    flash('スタミナが回復した');return true;
  }
  // The sleeping bag is first placed on the ground and then interacted with.
  if(selected===I.COMPASS){
    const target=bedSpawn||initialSpawn||{x:0,z:0};
    const angle=Math.atan2(target.x-player.pos.x,target.z-player.pos.z)*180/Math.PI;
    flash('スポーン地点：'+Math.round(angle)+'°の方向');return true;
  }
  if(selected===I.MAP){openExplorerMap();return true}
  if(selected===I.BINOCULARS){toggleBinoculars();return true}
  if(selected===I.GLIDER){
    gliderActive=!gliderActive;
    if(gliderActive)fallOriginY=null;
    flash(gliderActive?'グライダー展開！ 崖から飛び降りると滑空します':'グライダーを収納しました');return true;
  }
  if(selected===I.BUCKET){
    const p=targetWater();
    if(!p){flash('水面に照準を合わせてください');return true}
    if(!canFitItem(I.WATER_BUCKET,1)&&inventorySlots[selectedHotbarIndex]?.qty!==1){
      flash('水入りバケツを入れる空きがありません');return true;
    }
    if(consumeSelected(1)!==1)return true;
    set(p.x,p.y,p.z,B.AIR);rebuildEdited(p);
    if(!inventorySlots[selectedHotbarIndex]){
      inventorySlots[selectedHotbarIndex]={id:I.WATER_BUCKET,qty:1};
      syncDerivedInventory();renderHotbar();markSaveDirty();
    }else if(addItem(I.WATER_BUCKET,1)>0)
      spawnWorldDrop(I.WATER_BUCKET,1,player.pos.x,player.pos.y+1,player.pos.z);
    flash('水を汲んだ！ 水入りバケツを入手');return true;
  }
  if(selected===I.WATER_BUCKET){
    const hit=target(),p=hit&&hit.distance<=5?lookup.get(hit.object.uuid)?.[hit.instanceId]:null;
    if(!p||!hit.face){flash('水を流す地面や壁を狙ってください');return true}
    const n=hit.face.normal,x=p.x+Math.round(n.x),y=p.y+Math.round(n.y),z=p.z+Math.round(n.z);
    if(!inside(x,y,z)||get(x,y,z)!==B.AIR){flash('水を置くスペースがありません');return true}
    if(consumeSelected(1)!==1)return true;
    set(x,y,z,B.WATER);rebuildEdited({x,z});
    if(!inventorySlots[selectedHotbarIndex]){
      inventorySlots[selectedHotbarIndex]={id:I.BUCKET,qty:1};
      syncDerivedInventory();renderHotbar();markSaveDirty();
    }else if(addItem(I.BUCKET,1)>0)
      spawnWorldDrop(I.BUCKET,1,player.pos.x,player.pos.y+1,player.pos.z);
    extinguishNearWater(x,y,z);
    flash('水を流した。空のバケツが戻った');return true;
  }
  return false;
}

// Food is used with the place/use button, one portion per tap. The old hold timers stay inert for legacy input compatibility.
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
  const food=selected;
  if(removeFromSlot(selectedHotbarIndex,1)!==1)return true;
  const recovered=Math.min(MAX_HEALTH-health,FOOD_HEAL_POINTS[food]);
  health=Math.min(MAX_HEALTH,health+FOOD_HEAL_POINTS[food]);
  healthRegenTimer=0;renderHealth();markSaveDirty();
  // Updated hearts provide eating feedback without a toast.
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
  // Health HUD reflects the restored hearts.
}
let lastJobSpellAt=-Infinity;
function castJobMagic(weapon){
  if(!weapon||weapon.kind!=='staff'||!jobCanUse(activeJob,selected))return false;
  const now=performance.now(),delay=Math.round(weapon.cooldown*(activeJob==='all'?1.25:1));
  if(now-lastJobSpellAt<delay)return true;
  lastJobSpellAt=now;
  aimPlayerRay();
  const hit=ray.intersectObjects(mobs,true)
    .find(h=>h.distance<=weapon.range);
  const center=hit?hit.point.clone():gameplayAimOrigin.clone()
    .addScaledVector(gameplayAimDirection,Math.min(weapon.range,5));
  // Visual magic sphere pulses at the point of impact and dissipates.
  const orb=new THREE.Mesh(new THREE.SphereGeometry(Math.min(weapon.radius*.45,1.15),12,8),
    new THREE.MeshBasicMaterial({color:activeJob==='supportMage'?0x91e7bb:0xa894ff,
      transparent:true,opacity:.37,depthWrite:false}));
  orb.position.copy(center);scene.add(orb);
  setTimeout(()=>{scene.remove(orb);orb.geometry.dispose();orb.material.dispose()},360);
  let count=0;
  const matches=[...mobs].filter(m=>m.userData.hp>0&&
    m.position.distanceTo(center)<=weapon.radius+1.1);
  count=matches.length;
  if(multiRole==='guest'){
    // One validated area spell packet, not one mobHit message per target.
    // The host applies all damage and effects authoritatively.
    if(multiplayerNetwork.connected)
      multiplayerNetwork.send({t:'jobSpell',weapon:selected,
        x:center.x,y:center.y,z:center.z});
  }else{
    for(const m of matches){
      const attack=Math.max(1,Math.round(weapon.damage*(activeJob==='all'?.65:1)));
      damageMob(m,attack,'magic',1,'host');
      if(weapon.key==='supportMage')m.userData.jobDebuffUntil=now+6500;
    }
  }
  if(weapon.key==='supportMage'&&health<MAX_HEALTH){
    health=Math.min(MAX_HEALTH,health+2);renderHealth();markSaveDirty();
  }
  triggerAvatarAction('fire');
  firstPersonHand.swing(.8,'swing');
  flash(weapon.key==='supportMage'?'支援魔法：範囲内の敵を弱体化・体力回復':
    '範囲魔法 '+count+'体に命中');
  return true;
}
let jobAttackHeld=false;
function primaryActionStart(){
  if(jobOpen)return;
  if(chatViewActive||!started||dead||sleeping||craftOpen||inventoryOpen||chestOpen||testPanelOpen||explorerMapOpen)return;
  if(ridingHorse){dismountHorse();return}
  const jobItem=jobWeapon(selected);
  if(jobItem&&!jobCanUse(activeJob,selected)){
    flash('この武器は別のジョブ専用です。JOB画面で確認してください');return;
  }
  if(jobItem?.kind==='staff'){castJobMagic(jobItem);return}
  if(jobItem?.kind==='bow'){startBowDraw();return}
  if(jobItem){jobAttackHeld=true;attackMob();return}
  // Usable equipment responds to the main action button as well as USE.
  if([I.MAP,I.BINOCULARS,I.POISON_ARROW,I.ARROW,I.GLIDER].includes(selected)){
    useExpansionItem();return;
  }
  firstPersonHand.swing(1,selected===I.SPEAR?'thrust':'swing');
  if(selected!==I.BOW&&selected!==I.CHIMERA_BOW&&selected!==I.CROSSBOW)
    triggerAvatarAction(selected===I.SPEAR?'thrust':'attack');
  if(isBowWeapon(selected)){startBowDraw();return}
  if(attackMob()){miningHeld=false;clearMining();return}
  miningHeld=true;startMining();
}
function primaryActionStop(fire=false){
  jobAttackHeld=false;
  endBowDraw(fire);
  eatingHeld=false;eatingElapsed=0;eatingStartedAt=0;eatingSlot=-1;eatingItem=null;
  miningHeld=false;clearMining();
}


// Job tree: six basic classes, LV30 specializations, tank at LV90.
// Only the Testworld debug map permits selecting any evolution for testing.
let jobOpen=false;
function updateJobHud(){
  const button=$('jobOpenButton');if(!button)return;
  button.style.display=started&&worldReady?'block':'none';
  const entry=JOBS[activeJob]||JOBS.all;
  button.textContent='⚔ JOB：'+(jobSelected?entry.name:'未選択');
  button.classList.toggle('ready',!jobSelected||jobNextOptions(activeJob,level).length>0);
  button.title='ジョブ選択・進化（現在 LV '+level+'）';
}
function renderJobScreen(){
  const name=jobSelected?JOBS[activeJob].name:'未選択';
  $('jobCurrent').textContent='現在のジョブ：'+name+'　·　LV '+level+'/150';
  $('jobTitle').textContent=jobSelected?'⚔ ジョブ進化':'⚔ ジョブ選択';
  $('jobInfo').textContent=jobSelected
    ?(jobNextOptions(activeJob,level).length?'進化可能！ 好きな進化先を選ぼう。':
      '一次進化はLV30、盾兵系のタンク進化はLV90で解放されます。')
    :'LV1では初期ジョブのみ選択可能。専用武器は作業台で素材を集めて製作します。';
  // Testworld also obeys evolution levels. Debug item spawning is separate
  // from the job tree: no immediate LV30/LV90 class unlocks.
  const options=jobSelected?[activeJob,...(JOBS[activeJob]?.next||[])]:STARTING_JOBS;
  $('jobOptions').replaceChildren();
  for(const key of options){
    const j=JOBS[key],current=jobSelected&&key===activeJob;
    const eligible=(!jobSelected&&STARTING_JOBS.includes(key))||
      (jobSelected&&jobCanChange(activeJob,key,level));
    const button=document.createElement('button');
    button.type='button';
    button.className='job-card'+(current?' current':eligible?' available':'');
    button.disabled=!eligible||current;
    const title=document.createElement('strong');
    title.textContent=j.name+(current?' ✔':'');
    const detail=document.createElement('span');
    detail.textContent='LV '+j.level+'　·　'+(Number.isInteger(j.weapon)?names[j.weapon]:'専用武器なし・全武器使用可能');
    const body=document.createElement('small');
    body.textContent=j.desc+(eligible&&!current?' · タップして選択':
      !current&&level<j.level?' · LV'+j.level+'で解放':'');
    button.append(title,detail,body);
    if(eligible&&!current)button.addEventListener('click',()=>chooseJob(key));
    $('jobOptions').appendChild(button);
  }
}
function setJobOpen(open){
  jobOpen=!!open;
  const screen=$('jobScreen');if(!screen)return;
  screen.classList.toggle('open',jobOpen);
  screen.setAttribute('aria-hidden',String(!jobOpen));
  if(jobOpen){
    if(inventoryOpen)setInventoryOpen(false);
    if(craftOpen)setCraftOpen(false);
    if(chestOpen)setChestOpen(false);
    if(testPanelOpen)setTestPanelOpen(false);
    Object.keys(keys).forEach(k=>keys[k]=false);
    resetSprint();primaryActionStop();document.exitPointerLock?.();
    renderJobScreen();
  }else if(started&&!dead&&!matchMedia('(pointer:coarse)').matches){
    renderer.domElement.requestPointerLock?.();
  }
}
function chooseJob(key){
  if(!JOBS[key])return;
  const allowed=(!jobSelected&&STARTING_JOBS.includes(key))||
    (jobSelected&&jobCanChange(activeJob,key,level));
  if(!allowed){
    flash('このジョブはまだ解放されていません（LV'+JOBS[key].level+'以上）');
    return;
  }
  // Changing jobs never grants a weapon, arrows or crafting ingredients.
  // The player must make their job weapon at a crafting table.
  activeJob=key;jobSelected=true;markSaveDirty();
  updateJobHud();renderJobScreen();renderHotbar();
  flash(JOBS[key].name+'になりました！ 専用武器は作業台で製作できます');
  setJobOpen(false);
  saveCurrentGame(false);
}
$('jobOpenButton').addEventListener('pointerdown',e=>{
  e.preventDefault();e.stopPropagation();
  if(!started||dead||!worldReady)return;
  setJobOpen(!jobOpen);
});
$('jobClose').addEventListener('click',()=>setJobOpen(false));
$('jobScreen').addEventListener('pointerdown',e=>{
  if(e.target===$('jobScreen'))setJobOpen(false);
});

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
  // The decorated arena shares a single stored core block. Only the
  // explicitly tagged CENTRAL dais meshes count as the altar station.
  if(id===B.BOSS_ARENA_CORE&&h.object.userData.bossArenaAltar===true)return 'arena';
  return (id===B.CRAFTING_TABLE||id===B.FURNACE||isWarpWorkbench(id))?id:null;
}
function chooseCraftMode(){
  const station=stationInReach();
  if(station===B.CRAFTING_TABLE)return 'workbench';
  if(station===B.FURNACE)return 'furnace';
  if(isWarpWorkbench(station))return 'warp';
  if(station==='arena')return 'arena';
  return 'inventory';
}
function currentRecipeList(){
  const list=craftMode==='arena'?[]:
    craftMode==='workbench'?workbenchRecipes:
    craftMode==='furnace'?[...furnaceRecipes,...furnaceWoodRecipes]:
    craftMode==='warp'?warpWorkbenchRecipes:recipes;
  // Always display recipes from the lowest unlock level to the highest,
  // including newly added items. Sorting a copy keeps the original lists
  // intact; craftRecipe(i) uses the very same sorted indices as the UI.
  return [...list].sort((a,b)=>(a.unlockLevel??0)-(b.unlockLevel??0));
}
function renderCrafting(){
  const title=document.querySelector('.craft-title'),sub=document.querySelector('.craft-sub');
  if(craftMode==='workbench'){title.textContent='WORKBENCH';sub.textContent='作業台専用：ツール・防具・設備'}
  else if(craftMode==='furnace'){title.textContent='FURNACE';sub.textContent='石炭1個 または 木材3個を燃料に精錬・調理（砂→ガラスも可）'}
  else if(craftMode==='warp'){title.textContent='WARP WORKBENCH';sub.textContent='ボス用設備を製作して設置できます'}
  else if(craftMode==='arena'){title.textContent='BOSS ALTAR';sub.textContent='ボスアリーナ中央の台座'}
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
  const search=($('craftSearch')?.value||'').trim().toLocaleLowerCase('ja');
  const count=$('craftCount');
  if(count)count.textContent=craftMode==='arena'?'祭壇':(search?list.filter(r=>(r.name+' '+(names[r.out]||'')).toLocaleLowerCase('ja').includes(search)).length:list.length)+' 種類';
  const toolbar=document.querySelector('.craft-toolbar');
  if(toolbar)toolbar.style.display=craftMode==='arena'?'none':'';
  if(craftMode==='arena'){
    const info=document.createElement('div');
    info.className='recipe';info.style.padding='18px';
    info.textContent='ボス召喚機能は現在準備中です。';
    recipeList.appendChild(info);
    return;
  }
  if(craftMode==='warp'&&!list.length){
    const info=document.createElement('div');
    info.className='recipe';info.style.padding='18px';
    info.textContent='ボス用ワープ装置の製作台です。ワープ装置の材料レシピは今後追加します。';
    recipeList.appendChild(info);
  }
  list.forEach((r,i)=>{
    if(search&&!(r.name+' '+(names[r.out]||'')).toLocaleLowerCase('ja').includes(search))return;
    const wrongJob=!!jobWeapon(r.out)&&(!jobSelected||!jobCanUse(activeJob,r.out));
    const locked=level<r.unlockLevel||wrongJob,can=!locked&&hasNeeds(r);
    const d=document.createElement('div');d.className='recipe'+(locked?' locked':'');
    const needText=r.needs.map(([id,n])=>`${names[id]} ×${n}`).join(' ＋ ');
    const verb=craftMode==='furnace'?'焼く':'作る';

    const main=document.createElement('div');main.className='recipe-main';
    main.appendChild(itemCanvas(r.out,'item-icon recipe-icon'));
    const copy=document.createElement('div');copy.className='recipe-copy';
    const rn=document.createElement('div');rn.className='recipe-name';rn.textContent=(locked?'🔒 ':'')+r.name;
    const lv=document.createElement('span');lv.className='recipe-level';lv.textContent='LV '+r.unlockLevel;rn.appendChild(lv);
    const needs=document.createElement('div');needs.className='recipe-needs';needs.textContent=wrongJob?'このジョブでは使用できません':level<r.unlockLevel?'設計図未取得':needText;
    copy.append(rn,needs);main.appendChild(copy);

    const button=document.createElement('button');button.disabled=!can;button.textContent=verb;
    button.addEventListener('click',()=>craftRecipe(i));
    d.append(main,button);recipeList.appendChild(d);
  });
}
function craftRecipe(i){
  const list=currentRecipeList(),r=list[i];
  if(jobWeapon(r.out)&&(!jobSelected||!jobCanUse(activeJob,r.out))){flash('現在のジョブでは製作できません');return}
  if(level<r.unlockLevel){flash('LV '+r.unlockLevel+'で設計図を獲得');return}
  if(!hasNeeds(r)){flash('材料が足りません');return}
  if(!canFitItem(r.out,r.qty)){flash('インベントリがいっぱいです');return}
  r.needs.forEach(([id,n])=>removeItem(id,n));
  addItem(r.out,r.qty);
  if(craftMode==='furnace'&&r.xp)gainXP(r.xp,r.name+'を精錬');
  renderHotbar();renderCrafting();
}
function setCraftOpen(v){
  if(v&&explorerMapOpen)closeExplorerMap(false);
  if(v&&binocularActive)closeBinoculars();
  if(v&&testPanelOpen)setTestPanelOpen(false);
  craftOpen=v;crafting.classList.toggle('open',v);crafting.setAttribute('aria-hidden',String(!v));
  Object.keys(keys).forEach(k=>keys[k]=false);
  resetSprint();
  if(v){
    if(inventoryOpen)setInventoryOpen(false);
    if(jobOpen)setJobOpen(false);
    craftMode=chooseCraftMode();
    primaryActionStop();document.exitPointerLock?.();$('craftSearch').value='';renderCrafting();
    if(craftMode==='inventory')flash('作業台・かまど・転送作業台・アリーナ中央の台座に照準を合わせると専用メニューが開きます');
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
  setShieldGuard(false);
});
addEventListener('keydown',e=>{
  const k=e.key.toLowerCase();
  if(explorerMapOpen){if(k==='escape'){e.preventDefault();closeExplorerMap()}return}
  if(binocularActive&&k==='escape'){e.preventDefault();closeBinoculars();return}
  if(testPanelOpen){if(k==='escape'){e.preventDefault();setTestPanelOpen(false)}return}

  if(chatViewActive){
    if(k==='escape'){e.preventDefault();chatCloseView(true)}
    return;
  }
  // Never interpret chat/login text as walking or game hotkeys.
  if(e.target?.closest?.('input, textarea, [contenteditable="true"]'))return;
  if((k==='t'||k==='enter')&&chatAvailable()&&!craftOpen&&!inventoryOpen&&!chestOpen&&!sleeping){
    e.preventDefault();if(!e.repeat)chatOpenView();return;
  }
  if(dead)return;
  if(chestOpen){if(k==='escape'){e.preventDefault();setChestOpen(false)}return}
  if((k==='v'||e.code==='F5')&&started){e.preventDefault();if(!e.repeat)cycleCameraMode();return}
  if(k==='e'&&started){e.preventDefault();setInventoryOpen(!inventoryOpen);return}
  if(k==='c'&&started){e.preventDefault();setCraftOpen(!craftOpen);return}
  if(craftOpen||inventoryOpen||sleeping)return;
  if(k==='g'&&started){e.preventDefault();setShieldGuard(true);return}
  keys[k]=true;
  if((k==='w'||k==='arrowup'||k==='shift')&&started)updateSprintIntent();
  if(e.code==='Space'){e.preventDefault();jump()}
  if(/^[1-9]$/.test(e.key))selectHotbar(+e.key-1);
  if(k==='r'){weather=weather==='clear'?'rain':'clear';rain.visible=weather==='rain';weatherEl.textContent=weather==='rain'?'Rain':'Clear'}
});
addEventListener('keyup',e=>{
  if(chatViewActive||e.target?.closest?.('input, textarea, [contenteditable="true"]'))return;
  const k=e.key.toLowerCase();
  if(k==='g'){setShieldGuard(false);return}
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
  if(ridingHorse)return;
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

renderer.domElement.addEventListener('click',()=>{if(!dead&&!craftOpen&&!inventoryOpen&&!chestOpen&&!matchMedia('(pointer:coarse)').matches)renderer.domElement.requestPointerLock?.()});
addEventListener('mousemove',e=>{if(document.pointerLockElement===renderer.domElement){player.yaw-=e.movementX*.0022;player.pitch-=e.movementY*.0022;player.pitch=Math.max(-1.48,Math.min(1.48,player.pitch))}});
renderer.domElement.addEventListener('mousedown',e=>{if(chatViewActive||!started||dead||craftOpen||inventoryOpen||chestOpen)return;if(e.button===0&&document.pointerLockElement===renderer.domElement)primaryActionStart();if(e.button===2){if(offhandItem?.id===I.SHIELD&&!e.shiftKey)setShieldGuard(true);else place()}});
addEventListener('mouseup',e=>{if(e.button===0)primaryActionStop(true);if(e.button===2)setShieldGuard(false)});
renderer.domElement.addEventListener('contextmenu',e=>e.preventDefault());

let touchLook=null;
renderer.domElement.addEventListener('pointerdown',e=>{if(dead||craftOpen||inventoryOpen||chestOpen)return;if(e.pointerType==='touch'&&e.clientX>innerWidth*.35)touchLook={x:e.clientX,y:e.clientY}});
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
    if(!started||dead||craftOpen||inventoryOpen||chestOpen||sleeping)return;
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
['pointerup','pointercancel','pointerleave'].forEach(t=>$('tapMine').addEventListener(t,e=>{e.preventDefault();primaryActionStop(t==='pointerup')}));
$('tapPlace').addEventListener('pointerdown',e=>{e.preventDefault();place()});
const guardBtn=$('tapGuard');
guardBtn.addEventListener('pointerdown',e=>{
  e.preventDefault();setShieldGuard(true);
  try{guardBtn.setPointerCapture(e.pointerId)}catch{}
});
for(const type of ['pointerup','pointercancel','pointerleave','lostpointercapture']){
  guardBtn.addEventListener(type,e=>{e.preventDefault();setShieldGuard(false)});
}
guardBtn.addEventListener('contextmenu',e=>e.preventDefault());
$('tapInventory').addEventListener('pointerdown',e=>{e.preventDefault();setInventoryOpen(true)});
$('tapCraft').addEventListener('pointerdown',e=>{e.preventDefault();setCraftOpen(true)});
inventoryClose.addEventListener('click',()=>setInventoryOpen(false));
inventoryScreen.addEventListener('pointerdown',e=>{if(e.target===inventoryScreen)setInventoryOpen(false)});
inventoryMove.addEventListener('click',()=>{if(inventorySelectedSlot!=null)moveInventoryStack(inventorySelectedSlot)});
inventorySplit.addEventListener('click',()=>{if(inventorySelectedSlot!=null)splitInventoryStack(inventorySelectedSlot)});
inventoryDrop.addEventListener('click',()=>{if(inventorySelectedSlot!=null)dropInventoryStack(inventorySelectedSlot)});
$('inventoryEquip').addEventListener('click',()=>{if(inventorySelectedSlot!=null)equipFromInventory(inventorySelectedSlot)});
$('inventoryOffhandEquip').addEventListener('click',()=>{if(offhandItem)unequipOffhand();else if(inventorySelectedSlot!=null)equipOffhand(inventorySelectedSlot)});
$('inventoryOffhand').addEventListener('click',()=>{if(offhandItem)unequipOffhand();else if(inventorySelectedSlot!=null)equipOffhand(inventorySelectedSlot);else flash('インベントリの松明か盾を選択してください')});
$('craftClose').addEventListener('click',()=>setCraftOpen(false));
$('craftSearch').addEventListener('input',renderCrafting);
crafting.addEventListener('pointerdown',e=>{if(e.target===crafting)setCraftOpen(false)});

let last=performance.now(),dayTime=.24;
const DAY_START=.25,DAY_END=.75,DAY_REAL_SECONDS=15*60,NIGHT_REAL_SECONDS=5*60;
let sleeping=false,sleepOverlay=null,sleepCounter=null,sleepBanner=null,multiSleepTimer=null;
let multiSleepSnapshot={asleep:0,total:0};
function isNightTime(){
  return dayTime<DAY_START||dayTime>=DAY_END;
}
function sleepDisplay(waiting=false,isBag=false){
  if(sleepOverlay)return;
  const veil=document.createElement('div');
  veil.setAttribute('role','status');
  Object.assign(veil.style,{
    position:'fixed',inset:'0',zIndex:'55',
    background:'rgba(0,0,0,.96)',color:'#ffffff',
    font:'bold 22px system-ui,sans-serif',display:'flex',
    alignItems:'center',justifyContent:'center',flexDirection:'column',gap:'14px',
    padding:'24px',opacity:'0',transition:'opacity .3s ease',
    pointerEvents:'auto',textAlign:'center'
  });
  const title=document.createElement('div');
  title.textContent=isBag?
    (waiting?'寝袋で眠っています… ほかのプレイヤーを待っています':'寝袋で眠っています…'):
    (waiting?'ほかのプレイヤーを待っています…':'眠っています…');
  veil.append(title);
  sleepCounter=document.createElement('div');
  Object.assign(sleepCounter.style,{font:'bold 20px system-ui,sans-serif',color:'#c2f0e4'});
  veil.append(sleepCounter);
  if(waiting){
    const wake=document.createElement('button');
    wake.type='button';wake.textContent='起きる';
    Object.assign(wake.style,{font:'bold 17px system-ui,sans-serif',
      background:'#32645a',color:'#fff',border:'2px solid #8ad0bb',
      borderRadius:'8px',padding:'12px 28px',minHeight:'48px',cursor:'pointer'});
    wake.addEventListener('click',multiSleepCancel);
    veil.append(wake);
  }
  document.body.append(veil);sleepOverlay=veil;
  requestAnimationFrame(()=>{if(sleepOverlay===veil)veil.style.opacity='1'});
}
function sleepHide(){
  sleeping=false;
  sleepOverlay?.remove();sleepOverlay=null;sleepCounter=null;
}
function multiSleepBannerUpdate(asleep,total){
  const show=!!multiRole&&started&&asleep>0&&total>0&&!sleeping;
  if(!show){sleepBanner?.remove();sleepBanner=null;return}
  if(!sleepBanner){
    sleepBanner=document.createElement('div');
    sleepBanner.setAttribute('role','status');
    Object.assign(sleepBanner.style,{
      position:'fixed',zIndex:'24',top:'68px',left:'50%',transform:'translateX(-50%)',
      padding:'10px 16px',border:'1px solid #78c6b3',borderRadius:'8px',
      background:'rgba(9,33,35,.9)',color:'#eafff5',font:'bold 15px system-ui,sans-serif',
      pointerEvents:'none',whiteSpace:'nowrap',textAlign:'center'
    });
    document.body.append(sleepBanner);
  }
  sleepBanner.textContent=`${total}人中${asleep}人が睡眠中`;
}
function multiSleepShowCount(asleep,total){
  multiSleepSnapshot={asleep,total};
  if(sleepCounter)sleepCounter.textContent=`${total}人中${asleep}人が睡眠中`;
  multiSleepBannerUpdate(asleep,total);
}
function multiSleepReset(){
  if(multiSleepTimer){clearTimeout(multiSleepTimer);multiSleepTimer=null}
  sleepHide();
  sleepBanner?.remove();sleepBanner=null;
  multiSleepSnapshot={asleep:0,total:0};
}
function multiSleepCounts(){
  const guests=[...multiGuestRecords.values()];
  return {total:1+guests.length,asleep:Number(sleeping)+guests.filter(g=>g.sleeping===true).length};
}
function multiSleepHostFinish(naturalMorning=false){
  if(multiRole!=='host'||!worldReady)return;
  if(!naturalMorning){
    const {total,asleep}=multiSleepCounts();
    if(!isNightTime()||asleep!==total)return;
    dayTime=DAY_START+.02;markSaveDirty();
  }
  for(const guest of multiGuestRecords.values())guest.sleeping=false;
  if(multiplayerNetwork.connected)
    multiplayerNetwork.send({t:'sleepDone',dayTime,naturalMorning});
  multiSleepReset();
  markSaveDirty();saveCurrentGame(false);
  if(started)flash(naturalMorning?'朝になりました':'全員が眠ったので朝になりました！');
}
function multiSleepHostSync(){
  if(multiRole!=='host'||!worldReady)return;
  const {total,asleep}=multiSleepCounts();
  multiSleepShowCount(asleep,total);
  if(multiplayerNetwork.connected)
    multiplayerNetwork.send({t:'sleepState',asleep,total});
  if(multiSleepTimer){clearTimeout(multiSleepTimer);multiSleepTimer=null}
  if(sleeping&&isNightTime()&&asleep===total){
    // Delay briefly so everyone sees the complete count. Recount at finish
    // to avoid skipping the night if somebody joined or woke in between.
    multiSleepTimer=setTimeout(()=>{
      multiSleepTimer=null;multiSleepHostFinish(false);
    },550);
  }
}
function multiSleepCancel(){
  if(!sleeping)return;
  if(multiRole==='guest'&&multiplayerNetwork.connected)
    multiplayerNetwork.send({t:'sleepRequest',sleeping:false});
  multiSleepReset();
  if(multiRole==='host')multiSleepHostSync();
}
function sleepInBed(foot=null,isBag=false){
  if(sleeping||dead||!started)return;
  if(multiRole==='guest'&&!multiplayerNetwork.connected){
    flash('通信が切れています。再接続してから眠ってください');return;
  }
  sleeping=true;primaryActionStop();
  Object.keys(keys).forEach(k=>keys[k]=false);
  resetSprint();
  if(multiRole){
    sleepDisplay(true,isBag);
    if(multiRole==='host')multiSleepHostSync();
    else{
      // Send an up-to-date position before sleep request so the host can
      // validate the bed interaction without relying on a stale pose.
      multiplayerNetwork.send({t:'pose',id:multiOwnId(),player:multiCurrentPose()});
      multiplayerNetwork.send({t:'sleepRequest',sleeping:true,bed:foot});
      multiSleepShowCount(1,Math.max(1,multiRoster.length));
    }
    return;
  }
  // Single player still skips immediately.
  sleepDisplay(false,isBag);
  setTimeout(()=>{
    if(!sleeping||multiRole)return;
    dayTime=DAY_START+.02;markSaveDirty();saveCurrentGame(false);
    multiSleepReset();
    flash('朝になりました！ リスポーン地点も設定しました');
  },isBag?1400:650);
}
function advanceDayTime(dt){
  const isDay=dayTime>=DAY_START&&dayTime<DAY_END;
  const halfCycleSeconds=isDay?DAY_REAL_SECONDS:NIGHT_REAL_SECONDS;
  dayTime=(dayTime+dt*(.5/halfCycleSeconds))%1;
}
const forward=new THREE.Vector3(),right=new THREE.Vector3(),move=new THREE.Vector3();
function loop(now){
  const dt=Math.min(.035,(now-last)/1000);last=now;
  if(started&&!dead&&!sleeping&&!chestOpen){
    updateWorldDrops(dt,now);updatePassiveSpawning(dt);updateVillagerSpawning(dt);updateHealthRegen(dt);
    const activelySprinting=!craftOpen&&!inventoryOpen&&sprinting&&stamina>0&&isForwardHeld()&&!keys.s&&!keys.arrowdown&&!playerInWater();
    updateStaminaRecovery(dt,activelySprinting);
  }
  // The host clock keeps running while waiting in bed for other sleepers.
  // A single-player sleeper retains the normal short sunrise transition.
  if(started&&!dead&&multiRole==='host'&&sleeping&&!chestOpen)
    advanceDayTime(dt);
  if(started&&!dead&&!sleeping&&!craftOpen&&!inventoryOpen&&!chestOpen&&!testPanelOpen&&!explorerMapOpen&&!jobOpen){
    updateBowDraw(now);
    if(jobAttackHeld&&jobWeapon(selected)&&!['bow','staff'].includes(jobWeapon(selected).kind))attackMob();
    updateMining(dt);
    updateEating(dt);
    if(multiRole!=='guest')advanceDayTime(dt);
    updateZombieSpawning(dt);
    const inWater=playerInWater();
    const sy=Math.sin(player.yaw),cy=Math.cos(player.yaw);forward.set(-sy,0,-cy);right.set(cy,0,-sy);move.set(0,0,0);
    if(isForwardHeld())move.add(forward);if(keys.s||keys.arrowdown)move.sub(forward);if(keys.d||keys.arrowright)move.add(right);if(keys.a||keys.arrowleft)move.sub(right);
    const running=sprinting&&stamina>0&&isForwardHeld()&&!keys.s&&!keys.arrowdown&&!inWater;
    if(running)updateStaminaDuringSprint(dt);
    if(move.lengthSq())move.normalize().multiplyScalar(inWater?2.6:(gliderActive&&!player.onGround?Math.max(WALK_SPEED,6.3):(running&&stamina>0?SPRINT_SPEED:WALK_SPEED)));
    // While airborne, a deployed glider converts downward momentum into
    // a controlled forward glide rather than a normal high-speed fall.
    if(gliderActive&&!player.onGround&&!inWater){
      move.addScaledVector(forward,3.0);
    }
    if(ridingHorse)updateRidingHorse(move,dt,running);
    else {
    player.vel.x+=(move.x-player.vel.x)*Math.min(1,dt*(inWater?7:11));
    player.vel.z+=(move.z-player.vel.z)*Math.min(1,dt*(inWater?7:11));
    if(inWater){
      const swimHeld=keys[' ']||keys.swimup;
      if(swimHeld)player.vel.y=Math.min(4.8,player.vel.y+15*dt);
      else player.vel.y=Math.max(-2.2,player.vel.y-3.2*dt);
      player.vel.x*=Math.pow(.86,dt*60);
      player.vel.z*=Math.pow(.86,dt*60);
      player.vel.y*=Math.pow(.96,dt*60);
    }else if(gliderActive&&!player.onGround){
      player.vel.y=Math.max(-2.65,player.vel.y-3.4*dt);
    }else{
      player.vel.y-=18*dt;
    }
    // Collision-aware hit recoil. The separate impulse decays over half a
    // second, even if the player holds a movement button during the impact.
    const recoiling=playerKnockbackTime>0;
    const recoilX=recoiling?playerKnockbackX:0;
    const recoilZ=recoiling?playerKnockbackZ:0;
    if(!movePlayerAxis('x',(player.vel.x+recoilX)*dt))playerKnockbackX=0;
    if(!movePlayerAxis('z',(player.vel.z+recoilZ)*dt))playerKnockbackZ=0;
    if(recoiling){
      const decay=Math.exp(-6.2*dt);
      playerKnockbackX*=decay;playerKnockbackZ*=decay;
      playerKnockbackTime=Math.max(0,playerKnockbackTime-dt);
      if(playerKnockbackTime===0){playerKnockbackX=0;playerKnockbackZ=0}
    }
    const preVerticalY=player.pos.y,wasGrounded=player.onGround,vy=player.vel.y;
    player.onGround=false;
    movePlayerAxis('y',vy*dt);
    const nowInWater=playerInWater();

    if(nowInWater){
      fallOriginY=null;
    }else if(player.onGround){
      const gliderLanding=gliderActive&&!wasGrounded;
      if(gliderLanding){gliderActive=false;flash('グライダー着地')}
      if(!gliderLanding&&fallOriginY!=null&&vy<0)applyFallDamage(fallOriginY-player.pos.y);
      fallOriginY=null;
    }else if(wasGrounded&&vy<=0){
      // Walked off an edge: remember the ledge height.
      fallOriginY=preVerticalY;
    }else if(fallOriginY==null&&vy<0){
      // Safety for cases where the player becomes airborne without a normal ledge/jump transition.
      fallOriginY=preVerticalY;
    }

    }
    if(player.pos.y<Y_MIN-5&&!dead){health=0;showDeathScreen()}
    streamChunks();
    processChunkStreaming();
    updateTorchLights(now);
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
      animateMobStep(m,dt);
      if(multiRole!=='guest'&&m.userData.poisonRemaining>0){
        const d=m.userData;
        d.poisonRemaining=Math.max(0,d.poisonRemaining-dt);d.poisonTimer=(d.poisonTimer??1)-dt;
        if(d.poisonTimer<=0){
          d.poisonTimer+=1;damageMob(m,1,'poison');
          if(!mobs.includes(m))return;
        }
      }
      if(m.userData.hitFlash>0){
        m.userData.hitFlash-=dt;
        if(m.userData.hitFlash<=0)restoreMobColors(m);
      }
      if(multiRole==='guest'){
        const target=m.userData.netTarget;
        if(target){
          const offset=m.position.distanceTo(target);
          if(offset>7)m.position.copy(target);
          else m.position.lerp(target,Math.min(1,dt*10));
          const yaw=(m.userData.netAngle??0)+Math.PI;
          m.rotation.y+=Math.atan2(Math.sin(yaw-m.rotation.y),Math.cos(yaw-m.rotation.y))*Math.min(1,dt*13);
          const moving=offset>.035;
          if(m.userData.type==='zombie'||m.userData.type==='skeleton'){
            const parts=m.userData.parts;
            if(parts){
              const stride=moving?Math.sin(now*.008+m.userData.phase)*.34:0;
              parts.leftLeg.rotation.x=stride;parts.rightLeg.rotation.x=-stride;
              if(m.userData.type==='zombie'){
                parts.leftArm.rotation.x=1.38+stride*.12;parts.rightArm.rotation.x=1.38-stride*.12;
              }
            }
          }else if(m.userData.type==='chimera')animateChimera(m,now*.001,moving?'walk':'idle');
          else if(m.userData.type==='villager')villagerModels.animate(m,now*.001,moving);
          else animateWildMob(m,dt,now,moving);
        }
        return;
      }
      if(m.userData.type==='chimera'){
        updateChimera(m,dt,now);
        return;
      }
      if(m.userData.type==='zombie'){
        updateZombie(m,dt,now);
        return;
      }
      if(m.userData.type==='skeleton'){
        updateSkeleton(m,dt,now);
        return;
      }
      if(m.userData.type==='spider'){
        updateSpider(m,dt,now);
        return;
      }
      if(m.userData.type==='villager'){
        updateVillager(m,dt,now);
        return;
      }
      if(m.userData.type==='golem'){
        updateVillageGuardian(m,dt,now);
        return;
      }
      if(m.userData.type==='eagle'||m.userData.type==='shark'){
        updateFlyingOrSwimmingMob(m,dt,now);
        return;
      }
      if(m.userData.saddled){
        animateWildMob(m,dt,now,m===ridingHorse&&!!m.userData.ridingMoved);
        return;
      }
      if((m.userData.type==='lion'||m.userData.type==='bison'||m.userData.type==='anaconda')&&updateDangerousMob(m,dt,now)){
        animateWildMob(m,dt,now,true);
        return;
      }
      if(NEW_WILD_TYPES.has(m.userData.type)&&
         NEW_MOB_STATS[m.userData.type]?.kind==='predator'&&
         updateNewLandMob(m,dt,now))return;
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
      const fleeMult=m.userData.fleeTime>0?(m.userData.type==='horse'?9:3.4):1;
      const speed=m.userData.speed*fleeMult;
      if(mobWalkStep(m,m.userData.angle,speed*dt)){
        m.rotation.y=m.userData.angle+Math.PI;
        animateWildMob(m,dt,now,true);
      }else{
        // Don't keep pushing into the same wall; choose another direction.
        m.userData.angle+=(m.userData.fleeTime>0?Math.PI*.65:Math.PI*.56);
        m.userData.t=Math.min(m.userData.t||1,1);
        animateWildMob(m,dt,now,false);
      }
    });

    updateFlyingArrows(dt);
    updateExpansionEffects(dt);
    if(multiRole!=='guest')updateSkeletonArrows(dt);
    const bx=Math.floor(player.pos.x),bz=Math.floor(player.pos.z);
    coordsEl.textContent=`X ${bx} Y ${Math.floor(player.pos.y)} Z ${bz}`;
    // Show the natural biome without the village icon or arrival popup.
    // Village buildings, villagers and golems are unaffected.
    biomeEl.textContent=activeMap==='testworld'?'Testworld':(biomeNames[biomeAt(bx,bz)]||'Unknown');
    const mins=Math.floor(dayTime*1440),hh=String(Math.floor(mins/60)%24).padStart(2,'0'),mm=String(mins%60).padStart(2,'0');
    // Time stays visible, but no zombie/skeleton/spider icons or counts.
    clockEl.textContent=(isNightTime()?'☾':'☀')+' '+hh+':'+mm;
    const eye=blockAtPoint(player.pos.x,player.pos.y+EYE,player.pos.z);scene.fog.near=eye===B.WATER?1:28;scene.fog.far=eye===B.WATER?14:66;
  }
  if(multiRole==='host'&&!isNightTime()&&
      (sleeping||[...multiGuestRecords.values()].some(g=>g.sleeping)))
    multiSleepHostFinish(true);
  chatSyncVisible();
  if(started&&multiRole)multiTick(now);
  if(!started||dead||sleeping)playerAvatar.visible=false;
  if(chimeraVisualModel&&animateChimeraVisual)
    animateChimeraVisual(chimeraVisualModel,now*.001,false);
  firstPersonHand.update(dt,now);
  updateDamageScreenTint(now);
  // Render-only micro-shake after updating the follow camera. Aim, raycasts
  // and actual collision use player.pos and remain unaffected.
  if(now<playerHurtUntil&&started&&!dead&&cameraMode===0){
    const remaining=(playerHurtUntil-now)/PLAYER_HURT_FLASH_MS;
    camera.translateX(Math.sin(now*.067)*.013*remaining);
    camera.translateY(Math.cos(now*.054)*.008*remaining);
  }
  renderer.render(scene,camera);
  requestAnimationFrame(loop);
}

function resize(){renderer.setSize(innerWidth,innerHeight,false);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix()}
addEventListener('resize',resize);resize();


/* Real-time, host-owned 4-player rooms. Single saves remain separate. */
const multiplayerNetwork=createBlockworldNetwork(multiEvent,()=>({
  roomCode:multiplayerNetwork.connected?multiplayerNetwork.code:''
}));

/* Compact, temporary multiplayer chat. No accounts beyond the room see it,
 * no messages are included in local saves, and all text uses textContent. */
const chatRoot=$('gameChat'),chatToggle=$('chatToggle'),chatPanel=$('chatPanel');
const chatMessages=$('chatMessages'),chatInput=$('chatInput'),chatUnreadBadge=$('chatUnread');
const chatHint=$('chatHint'),chatPeerLastSent=new Map();
let chatUnreadCount=0,chatLocalLastSent=-Infinity,chatViewActive=false;
function chatCleanText(value){
  if(typeof value!=='string'||value.length>640)return '';
  return Array.from(value.replace(/[\u0000-\u001f\u007f-\u009f]/g,' ').trim()).slice(0,160).join('');
}
function chatAvailable(){
  return !!(started&&worldReady&&!dead&&multiRole&&multiplayerNetwork.connected);
}
function chatShowUnread(){
  chatUnreadBadge.hidden=chatUnreadCount<=0;
  chatUnreadBadge.textContent=chatUnreadCount>9?'9+':String(chatUnreadCount);
  chatToggle.setAttribute('aria-label',chatUnreadCount?'チャットを開く、未読'+chatUnreadCount+'件':'チャットを開く');
}
function chatCloseView(refocusGame=false){
  if(chatPanel.hidden)return;
  chatViewActive=false;chatPanel.hidden=true;
  chatToggle.setAttribute('aria-expanded','false');
  chatInput.blur();
  if(refocusGame&&started&&!dead&&!matchMedia('(pointer:coarse)').matches)
    renderer.domElement.requestPointerLock?.();
}
function chatOpenView(){
  if(!chatAvailable())return;
  chatViewActive=true;chatPanel.hidden=false;
  chatToggle.setAttribute('aria-expanded','true');
  chatUnreadCount=0;chatShowUnread();
  Object.keys(keys).forEach(k=>keys[k]=false);
  resetSprint();primaryActionStop();setShieldGuard(false);
  document.exitPointerLock?.();
  chatHint.textContent='同じワールドのプレイヤーに届きます';
  chatInput.focus({preventScroll:true});
  chatMessages.scrollTop=chatMessages.scrollHeight;
}
function chatSyncVisible(){
  const available=chatAvailable();
  if(chatRoot.hidden===available)chatRoot.hidden=!available;
  if(!available&&chatViewActive)chatCloseView();
}
function chatReset(){
  chatCloseView();
  chatUnreadCount=0;chatLocalLastSent=-Infinity;chatPeerLastSent.clear();
  chatShowUnread();
  chatMessages.replaceChildren();
  const p=document.createElement('p');p.className='chat-empty';
  p.textContent='メッセージはまだありません。';chatMessages.append(p);
  chatRoot.hidden=true;
  chatInput.value='';
}
function chatAppend(sender,message,id){
  if(typeof sender!=='string'||typeof id!=='string'||!/^[A-Z2-9]{10}$/.test(id))return;
  const clean=chatCleanText(message);
  if(!clean||clean!==message)return;
  const empty=chatMessages.querySelector('.chat-empty');
  if(empty)empty.remove();
  const nearBottom=chatMessages.scrollHeight-chatMessages.scrollTop-chatMessages.clientHeight<48;
  const row=document.createElement('div');
  row.className='chat-line'+(id===multiOwnId()?' own':'');
  const stamp=document.createElement('span');stamp.className='chat-time';
  stamp.textContent=new Date().toLocaleTimeString('ja-JP',{hour:'2-digit',minute:'2-digit'});
  const name=document.createElement('strong');name.className='chat-name';
  name.textContent=sender.slice(0,20)+':';
  const content=document.createElement('span');content.className='chat-text';
  content.textContent=clean;
  row.append(stamp,name,content);chatMessages.append(row);
  while(chatMessages.children.length>55)chatMessages.firstElementChild?.remove();
  if(chatViewActive&&nearBottom)chatMessages.scrollTop=chatMessages.scrollHeight;
  if(!chatViewActive){
    chatUnreadCount=Math.min(99,chatUnreadCount+1);chatShowUnread();
  }
}
function chatSendMessage(event){
  event.preventDefault();
  if(!chatAvailable()){chatHint.textContent='マルチプレイ接続中のみ送信できます';return}
  const text=chatCleanText(chatInput.value);
  if(!text)return;
  const now=performance.now();
  if(now-chatLocalLastSent<850){chatHint.textContent='少し待ってから送信してください';return}
  chatLocalLastSent=now;
  chatHint.textContent='同じワールドのプレイヤーに届きます';
  chatInput.value='';
  if(multiRole==='host'){
    const packet={t:'chat',id:multiOwnId(),name:currentAccount.name.slice(0,20),text};
    chatAppend(packet.name,packet.text,packet.id);
    multiplayerNetwork.send(packet);
  }else multiplayerNetwork.send({t:'chat',text});
  chatInput.focus({preventScroll:true});
}
function chatHostReceive(message,peerId,from){
  const raw=message?.text;
  const text=chatCleanText(raw);
  if(!text||raw!==text)return;
  const now=performance.now();
  if(now-(chatPeerLastSent.get(peerId)||-Infinity)<850)return;
  chatPeerLastSent.set(peerId,now);
  // Host sets sender identity from the authenticated room connection.
  const packet={t:'chat',id:from.id,name:from.name.slice(0,20),text};
  chatAppend(packet.name,packet.text,packet.id);
  multiplayerNetwork.send(packet);
}
function chatGuestReceive(message){
  if(typeof message?.name!=='string'||message.name.length>20)return;
  chatAppend(message.name,message.text,message.id);
}
chatToggle.addEventListener('click',()=>chatPanel.hidden?chatOpenView():chatCloseView(true));
$('chatClose').addEventListener('click',()=>chatCloseView(true));
$('chatForm').addEventListener('submit',chatSendMessage);
// iOS Safari shrinks the visual viewport when the keyboard opens.
function chatResizeForKeyboard(){
  if(window.visualViewport){
    chatPanel.style.maxHeight=Math.max(116,window.visualViewport.height-20)+'px';
  }
}
window.visualViewport?.addEventListener('resize',chatResizeForKeyboard);
chatResizeForKeyboard();
const multiViews=['multiHome','multiSlots','multiJoin','multiFriends','multiLobby'];
let multiViewId='multiHome',multiPresenceBusy=false,friendRefreshBusy=false;
function multiWorldKey(slot){return (activeMap==='testworld'?TEST_MULTI_HOST:MULTI_HOST)+currentAccount.key+':'+slot}
function multiHandoffSaveKey(originId,slot){
  return (activeMap==='testworld'?TEST_MULTI_HANDOFF:MULTI_HANDOFF)+currentAccount.key+':'+(multiWorldKind==='single'?'single:':'')+originId+':'+slot;
}
function multiGuestSaveKey(){
  return (activeMap==='testworld'?TEST_MULTI_MEMBER:MULTI_MEMBER)+(multiWorldKind==='single'?'single:':'')+currentAccount.key+':'+multiHostId+':'+multiHostSlot;
}
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
  $('multiTitle').textContent=({multiHome:mapDisplayName()+' · マルチプレイ',multiSlots:mapDisplayName()+' · ワールドを作る',multiJoin:'コードで参加',multiFriends:'フレンド一覧',multiLobby:'マルチプレイの部屋'})[v];
  if(v==='multiSlots')multiRenderSlots();
  if(v==='multiFriends')multiRenderFriends();
}
function multiShow(v='multiHome'){
  menuCover.style.display='none';worldCover.style.display='none';mapCover.style.display='none';
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
    job:activeJob,jobSelected,
    yaw:player.yaw,pitch:player.pitch,
    speed:Math.hypot(player.vel.x,player.vel.z),
    onGround:player.onGround,armor:[...equippedArmor],
    held:inventorySlots[selectedHotbarIndex]?.id??null,
    offhand:offhandItem?.id??null,
    actionSeq:avatarActionSeq,actionKind:avatarActionKind,
    actionAge:Math.max(0,Math.min(1,(performance.now()-avatarActionAt)/1000)),
    mining:miningHeld,drawing:bowDrawing,guarding:shieldGuarding,
    hurtSeq:playerHurtSeq,
    hurtAge:Math.max(0,Math.min(1,(performance.now()-playerHurtAt)/1000))
  };
}
function multiProfile(){
  return {name:currentAccount.name,savedAt:Date.now(),level,xp,health,stamina,staminaRunSeconds,
    staminaRegenSeconds,cameraMode,selectedHotbarIndex,activeJob,jobSelected,
    inventorySlots:inventorySlots.map(s=>s?{id:s.id,qty:s.qty}:null),
    equippedArmor:[...equippedArmor],equippedBackpack,backpackSlots:backpackSlots.map(v=>v?{...v}:null),offhandItem:offhandItem?{...offhandItem}:null,
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
  $('multiEnter').textContent=started?'ゲームに戻る':'ワールドに入る';
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
  const prefix=(activeMap==='testworld'?TEST_MULTI_HANDOFF:MULTI_HANDOFF)+currentAccount.key+':';
  for(let i=0;i<localStorage.length;i++){
    const key=localStorage.key(i);
    if(!key?.startsWith(prefix))continue;
    let saved=null;try{saved=JSON.parse(localStorage.getItem(key)||'null')}catch{}
    if(!saved||!Number.isInteger(saved.worldSlot))continue;
    const parts=key.slice(prefix.length).split(':');
    const kind=parts[0]==='single'?'single':'multi';
    const origin=kind==='single'?parts[1]:parts[0],slot=saved.worldSlot;
    if(!/^[A-Z2-9]{10}$/.test(origin)||slot<1||slot>5)continue;
    const card=document.createElement('div');card.className='multi-slot';
    const name=document.createElement('strong');
    name.textContent=(kind==='single'?'引き継いだシングル WORLD ':'引き継いだ WORLD ')+slot;
    const desc=document.createElement('span');desc.textContent='元の作成者：'+(saved.originName||origin)+' · '+formatSavedAt(saved.savedAt);
    const buttons=document.createElement('div');buttons.className='multi-slot-actions';
    const play=document.createElement('button');play.type='button';play.textContent='続きから開く';
    play.addEventListener('click',()=>multiHost(slot,saved,origin));
    const del=document.createElement('button');del.type='button';del.className='multi-delete';del.textContent='削除';
    del.addEventListener('click',()=>{if(confirm('引き継いだワールドの保存データを削除しますか？')){localStorage.removeItem(key);multiRenderSlots()}});
    buttons.append(play,del);card.append(name,desc,buttons);grid.append(card);
  }
}

async function multiOpenRoom(){
  for(let tries=0;tries<4;tries++){
    const code=multiCode();
    try{await multiplayerNetwork.host(code);return code}
    catch(error){if(tries===3)throw error}
  }
}
function multiSetSingleHost(slot,saved){
  multiRole='host';multiWorldKind='single';multiHostSlot=slot;multiHostId=multiOwnId();
  multiOriginName=currentAccount.name;
  multiMigration=null;multiCheckpoint=null;multiRoster=[];multiLastCheckpoint=0;
  multiGuestRecords.clear();
  multiMembers=saved?.members&&typeof saved.members==='object'?{...saved.members}:{};
}
async function multiHostSingleWorld(slot,save=null,alreadyPlaying=false){
  if(multiBusy)return;
  if(multiRole){flash('すでに共有中のワールドです');return}
  if(!currentAccount||!Number.isInteger(slot)||slot<1||slot>MAX_WORLDS)return;
  if(alreadyPlaying&&(!worldReady||currentWorldSlot!==slot))return;
  multiBusy=true;
  const wasInGame=alreadyPlaying&&started;
  multiSetSingleHost(slot,save||readSaveForAccount(currentAccount.key,slot));
  if(!wasInGame)multiShow('multiLobby');
  multiStatus('シングルワールドを共有する準備をしています…');
  try{
    if(!alreadyPlaying)await initializeAccountWorld(save,slot);
    const code=await multiOpenRoom();
    multiRoster=[{id:multiOwnId(),name:currentAccount.name,player:multiCurrentPose()}];
    multiLobby(code,true);
    $('multiRoomTip').textContent='シングル WORLD '+slot+' を共有中。コードやフレンド一覧から参加できます。';
    $('multiEnter').textContent=wasInGame?'ゲームに戻る':'ワールドに入る';
    multiStatus('シングル WORLD '+slot+' を公開しました。元のワールド・持ち物をそのまま使えます。');
    saveCurrentGame(false);
  }catch(error){
    console.warn('Single-world sharing failed',error);
    multiplayerNetwork.leaveRoom();
    if(worldReady)saveCurrentGame(false);
    multiRole=null;multiWorldKind='multi';multiHostId='';multiHostSlot=null;
    multiGuestRecords.clear();multiMembers={};
    if(wasInGame){
      $('multiCover').style.display='none';cover.style.display='none';
      flash('招待を開始できません：'+error.message);
    }else{
      if(worldReady){resetWorldRuntime();worldReady=false;currentWorldSlot=null}
      multiShow('multiHome');multiStatus('共有できませんでした：'+error.message);
    }
  }finally{multiBusy=false}
}
async function multiInviteFromGame(){
  if(!currentAccount||!worldReady)return;
  if(multiRole==='guest'){flash('他の人のワールドでは招待できません');return}
  if(multiRole==='host'&&multiplayerNetwork.connected){
    multiLobby(multiplayerNetwork.code,true);
    $('multiEnter').textContent='ゲームに戻る';
    multiStatus('このコードを送るか、フレンド一覧から参加してもらってください。');
    return;
  }
  await multiHostSingleWorld(currentWorldSlot,readSaveForAccount(currentAccount.key,currentWorldSlot),true);
}
async function multiHost(slot,save,originId=null){
  if(multiBusy)return;
  multiBusy=true;multiRole='host';multiHostSlot=slot;multiHostId=originId||multiOwnId();
  multiWorldKind=save?.worldKind==='single'?'single':'multi';
  multiOriginName=save?.originName||currentAccount.name;
  multiMigration=null;multiCheckpoint=null;multiRoster=[];multiLastCheckpoint=0;
  multiGuestRecords.clear();multiMembers=save?.members&&typeof save.members==='object'?save.members:{};
  multiStatus('ワールドを準備しています…');
  try{
    await initializeAccountWorld(save,slot);
    multiStatus('部屋を作成しています…');
    const code=await multiOpenRoom();
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
  // Host pose packets used to omit the id, accidentally creating a second
  // unnamed copy of the same player on guests.
  if(typeof id!=='string'||!/^[A-Z2-9]{10}$/.test(id))return;
  if(id===multiOwnId()||!pose||!Number.isFinite(pose.x)||!Number.isFinite(pose.y)||!Number.isFinite(pose.z))return;
  if(Math.abs(pose.x)>1000000||Math.abs(pose.y)>1000000||Math.abs(pose.z)>1000000)return;
  const yaw=Number.isFinite(pose.yaw)?pose.yaw:0;
  let model=multiAvatars.get(id);
  if(!model){
    model=createPlayerModel();
    model.userData.multiMove={
      target:new THREE.Vector3(pose.x,pose.y,pose.z),
      yaw,speed:0,grounded:true,phase:0,swing:0,lastReceived:performance.now(),
      actionSeq:-1,actionKind:null,actionAt:-Infinity,mining:false,drawing:false,guarding:false,
      hurtSeq:-1,hurtUntil:0
    };
    model.position.set(pose.x,pose.y,pose.z);
    model.rotation.y=yaw;
    model.visible=started;
    scene.add(model);multiAvatars.set(id,model);
  }
  const motion=model.userData.multiMove;
  if(Array.isArray(pose.armor))applyArmorAppearance(model,pose.armor);
  avatarHeldItems.sync(model,pose.held??null,pose.offhand??null);
  motion.target.set(pose.x,pose.y,pose.z);
  motion.yaw=yaw;
  // Older clients only send a position; estimate speed as fallback.
  const dt=Math.max(.05,(performance.now()-motion.lastReceived)/1000);
  const sampledSpeed=model.position.distanceTo(motion.target)/dt;
  motion.speed=Number.isFinite(pose.speed)?Math.max(0,Math.min(8,pose.speed)):Math.min(8,sampledSpeed);
  motion.grounded=pose.onGround!==false;
  // Process only new action events, so the same attack never restarts on
  // each 150ms network pose packet. Old clients simply have no motion fields.
  if(Number.isSafeInteger(pose.actionSeq)&&pose.actionSeq>=0&&pose.actionSeq!==motion.actionSeq){
    motion.actionSeq=pose.actionSeq;
    motion.actionKind=['attack','use','fire'].includes(pose.actionKind)?pose.actionKind:null;
    const age=Number(pose.actionAge);
    motion.actionAt=performance.now()-Math.max(0,Math.min(1,Number.isFinite(age)?age:0))*1000;
  }
  motion.mining=pose.mining===true;
  motion.drawing=pose.drawing===true;
  motion.guarding=pose.guarding===true;
  if(Number.isSafeInteger(pose.hurtSeq)&&pose.hurtSeq>=0&&pose.hurtSeq!==motion.hurtSeq){
    motion.hurtSeq=pose.hurtSeq;
    const age=Number(pose.hurtAge);
    const elapsed=Number.isFinite(age)?Math.max(0,Math.min(1,age))*1000:1000;
    motion.hurtUntil=performance.now()+Math.max(0,PLAYER_HURT_FLASH_MS-elapsed);
  }
  motion.lastReceived=performance.now();
}
function multiAnimateAvatars(now){
  const dt=multiLastVisualFrame?Math.max(0,Math.min(.05,(now-multiLastVisualFrame)/1000)):1/60;
  multiLastVisualFrame=now;
  const lerp=Math.min(1,dt*14),turnLerp=Math.min(1,dt*13),swingLerp=Math.min(1,dt*12);
  for(const [id,model] of multiAvatars){
    const m=model.userData.multiMove;
    const age=now-m.lastReceived;
    // Lost connections can miss peerLeft; never leave a frozen silhouette.
    if(age>12000){multiRemoveAvatar(id);continue}
    model.visible=started&&age<3500;
    if(!model.visible)continue;
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
    // Identical hand spacing for other players seen in multiplayer.
    limbs.rightArm.rotation.z=model.userData.heldItemsView?.mainId!=null?.30:0;
    limbs.leftArm.rotation.z=model.userData.heldItemsView?.offhandId!=null?-.34:0;
    if(!m.grounded){
      limbs.leftLeg.rotation.x=.15;
      limbs.rightLeg.rotation.x=-.15;
    }
    avatarHeldItems.animate(model,now,{
      kind:m.actionKind,at:m.actionAt,
      mining:fresh&&m.mining,drawing:fresh&&m.drawing,guarding:fresh&&m.guarding
    });
    setAvatarDamageFlash(model,now<m.hurtUntil);
  }
}
function multiClearAvatars(){
  for(const model of multiAvatars.values()){
    setAvatarDamageFlash(model,false);
    avatarHeldItems.dispose(model);
    scene.remove(model);model.traverse(o=>{if(o.isMesh)o.geometry.dispose()});
  }
  multiAvatars.clear();multiLastVisualFrame=0;
}

// Share the same host-owned animals across all connected players. Snapshots
// include removals, which prevents dead/despawned creatures from lingering.
let multiLastMobSync=0,multiMobSeq=0,multiAppliedMobSeq=-1;
const MULTI_MOB_TYPES=new Set([0,1,2,'horse','bison','lion','anaconda','zombie','skeleton','chimera','villager',...NEW_MOB_TYPES]);
function multiMobSnapshot(){
  return {t:'mobState',seq:++multiMobSeq,mobs:mobs.slice(0,110).map(m=>({
    id:ensureMobId(m),type:m.userData.type,
    x:+m.position.x.toFixed(2),y:+m.position.y.toFixed(2),
    z:+m.position.z.toFixed(2),angle:+(m.userData.angle||0).toFixed(3),
    hp:m.userData.hp,phase:m.userData.phase||0,
    saddled:!!m.userData.saddled,hostile:!!m.userData.hostile,
    variant:m.userData.type==='villager'?m.userData.variant:undefined,
    hit:m.userData.hitFlash>0
  }))};
}
function multiCreateSharedMob(type){
  if(type===0)return buildSheep();
  if(type===1)return buildPig();
  if(type===2)return buildCow();
  if(type==='horse')return buildHorse();
  if(type==='lion')return buildLion();
  if(type==='bison')return buildBison();
  if(type==='anaconda')return buildAnaconda();
  if(type==='zombie')return buildZombie();
  if(type==='skeleton')return buildSkeleton();
  if(type==='chimera')return buildChimera(THREE);
  if(type==='villager')return villagerModels.build();
  if(NEW_MOB_TYPES.has(type))return newMobModels.build(type);
  return null;
}
function multiApplyMobSnapshot(packet){
  if(multiRole!=='guest'||!worldReady||!packet||!Array.isArray(packet.mobs)||
     packet.mobs.length>110||!Number.isSafeInteger(packet.seq)||packet.seq<0||
     packet.seq<=multiAppliedMobSeq)return;
  const seen=new Set(),existing=new Map();
  for(const m of mobs)if(m.userData.netId)existing.set(m.userData.netId,m);
  const prepared=[];
  for(const d of packet.mobs){
    if(!d||typeof d.id!=='string'||!/^[0-9a-f-]{36}$/.test(d.id)||
      !MULTI_MOB_TYPES.has(d.type)||seen.has(d.id)||
      ![d.x,d.y,d.z,d.angle,d.hp].every(Number.isFinite)||
      Math.abs(d.x)>1e6||Math.abs(d.z)>1e6||d.y<Y_MIN-5||
      d.y>WORLD_TOP+6||d.hp<=0||d.hp>(d.type==='chimera'?CHIMERA_MAX_HEALTH:200))continue;
    seen.add(d.id);
    prepared.push(d);
  }
  multiAppliedMobSeq=packet.seq;
  for(const d of prepared){
    let m=existing.get(d.id);
    if(m&&m.userData.type!==d.type){removeZombie(m);m=null}
    if(!m){
      m=d.type==='villager'?villagerModels.build(Number.isInteger(d.variant)?d.variant:0):multiCreateSharedMob(d.type);
      if(!m)continue;
      m.position.set(d.x,d.y,d.z);
      m.userData={...m.userData,type:d.type,netId:d.id,hp:d.hp,
        angle:d.angle,netAngle:d.angle,phase:Number(d.phase)||0,
        hostile:d.hostile===true,attackCooldown:0,hitFlash:0,
        speed:0,t:1,fleeTime:0,saddled:d.saddled===true,
        variant:d.type==='villager'&&Number.isInteger(d.variant)?Math.max(0,Math.min(3,d.variant)):0};
      m.rotation.y=d.angle+Math.PI;
      setupMobStepAnimation(m);
      if(d.type==='horse'&&d.saddled)showHorseSaddle(m);
      scene.add(m);mobs.push(m);
    }
    m.userData.netTarget=new THREE.Vector3(d.x,d.y,d.z);
    m.userData.netAngle=d.angle;
    m.userData.angle=d.angle;
    m.userData.hp=d.hp;
    m.userData.phase=Number(d.phase)||0;
    m.userData.hostile=d.hostile===true;
    if(d.type==='horse'&&d.saddled&&!m.userData.saddleVisual)
      showHorseSaddle(m);
    if(d.hit&&m.userData.hitFlash<=0)setMobHitFlash(m);
  }
  for(const m of [...mobs])
    if(!seen.has(m.userData.netId))removeZombie(m);
}
function multiProcessJobSpell(message,from){
  if(multiRole!=='host'||!from?.player||
     ![message.x,message.y,message.z].every(Number.isFinite))return;
  const pose=from.player,job=JOBS[pose.job]?pose.job:'all';
  const weapon=jobWeapon(Number(message.weapon));
  if(!weapon||weapon.kind!=='staff'||pose.held!==Number(message.weapon)||
     !jobCanUse(job,weapon.weapon))return;
  if(![pose.x,pose.y,pose.z].every(Number.isFinite))return;
  const origin=new THREE.Vector3(pose.x,pose.y+EYE,pose.z);
  const center=new THREE.Vector3(message.x,message.y,message.z);
  if(origin.distanceTo(center)>weapon.range+2)return;
  const now=performance.now(),delay=Math.round(weapon.cooldown*(job==='all'?1.25:1));
  if(now-(from.lastJobSpellAt??-Infinity)<delay)return;
  from.lastJobSpellAt=now;
  for(const m of [...mobs]){
    if(m.userData.hp<=0||m.position.distanceTo(center)>weapon.radius+1.1)continue;
    damageMob(m,Math.max(1,Math.round(weapon.damage*(job==='all'?.65:1))),
      'magic',1,from.id);
    if(weapon.key==='supportMage')m.userData.jobDebuffUntil=now+6500;
  }
  if(multiplayerNetwork.connected)multiplayerNetwork.send(multiMobSnapshot());
}
function multiProcessMobHit(message,from){
  if(multiRole!=='host'||!from?.player||
     typeof message.id!=='string'||!/^[0-9a-f-]{36}$/.test(message.id))return;
  const m=mobs.find(m=>ensureMobId(m)===message.id);
  if(!m||m.userData.hp<=0)return;
  const pose=from.player;
  if(![pose.x,pose.y,pose.z].every(Number.isFinite))return;
  const via=message.via==='arrow'?'arrow':'melee';
  const shooterJob=JOBS[pose.job]?pose.job:'all';
  if(jobWeapon(pose.held)&&!jobCanUse(shooterJob,pose.held))return;
  const dist=Math.hypot(pose.x-m.position.x,pose.y-m.position.y,pose.z-m.position.z);
  if(dist>(via==='arrow'?70:5.5))return;
  const now=performance.now(),delay=via==='arrow'?140:320;
  if(now-(from.lastMobHitAt??-Infinity)<delay)return;
  from.lastMobHitAt=now;
  const power=Number(message.power);
  const damage=via==='arrow'
    ?bowHitDamage(power,pose.held,shooterJob)
    :meleeMobDamage(pose.held,shooterJob);
  damageMob(m,damage,via,power,from.id,via==='arrow'&&message.poison===true);
  if(multiplayerNetwork.connected)multiplayerNetwork.send(multiMobSnapshot());
}
// Host processes guest chest transfers in a single serial handler.
// Receipts are cached for retransmission so duplicate packets cannot
// withdraw or deposit the same stack twice.
const chestReceipts=new Map();
function chestBroadcastAt(x,y,z){
  if(multiRole==='host'&&multiplayerNetwork.connected)
    multiplayerNetwork.send({t:'chestState',x,y,z,slots:chestSlots(x,y,z)});
}
function handleGuestChestTransfer(message,peerId,from){
  const {requestId,x,y,z,id,index,qty,kind}=message;
  if(!Number.isInteger(requestId)||requestId<1||requestId>1e10)return;
  if(![x,y,z,id,index,qty].every(Number.isInteger)||Math.abs(x)>1000000||Math.abs(z)>1000000||
     !inside(x,y,z)||!chestValidItemId(id)||qty<1||qty>64||!['deposit','withdraw'].includes(kind))return;
  const receiptKey=peerId+':'+requestId;
  const previous=chestReceipts.get(receiptKey);
  if(previous){
    multiplayerNetwork.send({...previous,slots:get(x,y,z)===B.CHEST?chestSlots(x,y,z):[]},peerId);
    return;
  }
  const result={t:'chestResult',requestId,x,y,z,id,qty:0,ok:false,reason:'チェストを操作できません'};
  const position=from.player;
  if(get(x,y,z)===B.CHEST&&position&&Math.hypot(position.x-x,position.y-y,position.z-z)<8){
    const slots=chestSlots(x,y,z);
    if(kind==='deposit'&&index>=0&&index<36){
      result.qty=chestAdd(slots,id,qty);
    }else if(kind==='withdraw'&&index>=0&&index<CHEST_SIZE&&slots[index]?.id===id){
      result.qty=chestTake(slots,index,qty)?.qty||0;
    }
    if(result.qty){
      result.ok=true;markSaveDirty();
      chestBroadcastAt(x,y,z);
      if(chestIsOpenAt(x,y,z))renderChestUI();
    }else result.reason='空きがありません';
  }
  result.slots=get(x,y,z)===B.CHEST?chestSlots(x,y,z):[];
  chestReceipts.set(receiptKey,{...result});
  if(chestReceipts.size>512)chestReceipts.delete(chestReceipts.keys().next().value);
  multiplayerNetwork.send(result,peerId);
}
function chestValidItemId(id){return Number.isInteger(id)&&Object.hasOwn(inventory,id)}
function validArrowPacket(p){
  if(!p||![p.x,p.y,p.z,p.dx,p.dy,p.dz,p.power].every(Number.isFinite))return false;
  if(Math.abs(p.x)>1000000||Math.abs(p.z)>1000000||p.y<Y_MIN-2||p.y>WORLD_TOP+5)return false;
  const sq=p.dx*p.dx+p.dy*p.dy+p.dz*p.dz;
  return sq>.8&&sq<1.2&&p.power>=.15&&p.power<=1;
}
function showRemoteArrow(p){
  if(!validArrowPacket(p)||p.id===multiOwnId())return;
  spawnFlyingArrow({x:p.x,y:p.y,z:p.z},{x:p.dx,y:p.dy,z:p.dz},p.power,true,I.BOW,p.ammoType===I.POISON_ARROW?I.POISON_ARROW:I.ARROW);
}
function multiApplyBlock(b){
  if(!worldReady||![b.x,b.y,b.z,b.v].every(Number.isInteger))return;
  if(!inside(b.x,b.y,b.z)||b.v<0||b.v>B.BOSS_WARP_PART||Math.abs(b.x)>1000000||Math.abs(b.z)>1000000)return;
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
  activeMap=message.world.mapType==='testworld'?'testworld':'overworld';
  multiWorldKind=message.worldKind==='single'?'single':'multi';
  if(worldReady){
    multiCheckpoint={...message,t:'checkpoint',hostId:message.currentHostId||message.hostId,
      originId:message.hostId,originName:message.originName||multiOriginName,worldKind:multiWorldKind,
      world:{...message.world,members:message.members||{}},people:message.people||[]};
    if(Array.isArray(message.people))multiUpdateRoster(message.people);
    for(const p of message.people||[])multiShowAvatar(p.id,p.player);
    multiApplyMobSnapshot(message.mobState);
    // Rejoining an ongoing migrated room must not reset this player's items.
    multiplayerNetwork.send({t:'profile',profile:multiProfile()});
    return;
  }
  clearTimeout(multiPendingTimer);multiPendingTimer=null;
  multiHostId=message.hostId;multiHostSlot=message.slot;
  multiOriginName=message.originName||multiOriginName||'プレイヤー';
  multiCheckpoint={...message,t:'checkpoint',hostId:message.currentHostId||message.hostId,
    originId:message.hostId,originName:message.originName,worldKind:multiWorldKind,
    world:{...message.world,members:message.members||{}},people:message.people||[]};
  multiUpdateRoster(message.people);
  let backup=null;try{backup=JSON.parse(localStorage.getItem(multiGuestSaveKey())||'null')}catch{}
  const stored=message.member;
  const who=backup&&(!stored||backup.savedAt>stored.savedAt)?backup:stored;
  const data={...message.world,version:4,inventorySlots:Array(36).fill(null),
    equippedArmor:[null,null,null,null],offhandItem:null,
    selectedHotbarIndex:0,level:1,xp:0,health:20,stamina:20,staminaRunSeconds:0,
    staminaRegenSeconds:0,cameraMode:0,player:null,bedSpawn:null,activeJob:'all',jobSelected:false};
  if(who)for(const field of ['inventorySlots','selectedHotbarIndex','level','xp','health','stamina','staminaRunSeconds','staminaRegenSeconds','cameraMode','player','bedSpawn','equippedArmor','offhandItem','offhandTorch','activeJob','jobSelected'])
    if(Object.hasOwn(who,field))data[field]=who[field];
  try{
    await initializeAccountWorld(data,message.slot);
    $('multiCover').style.display='none';$('startBtn').click();
    for(const p of message.people||[])multiShowAvatar(p.id,p.player);
    multiApplyMobSnapshot(message.mobState);
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
    worldKind:multiWorldKind,hostId:multiOwnId(),slot:currentWorldSlot,
    world:{...makeSaveData(),members:{...multiMembers}},
    mobState:multiMobSnapshot(),people:multiRosterSnapshot()
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
  // Host-supplied roster is authoritative: immediately discard departed
  // or legacy phantom avatars, rather than keeping them visible forever.
  if(multiRole==='guest')
    for(const id of [...multiAvatars.keys()])
      if(!seen.has(id))multiRemoveAvatar(id);
}
function multiProfileFromWorld(world){
  const fields=['inventorySlots','selectedHotbarIndex','level','xp','health','stamina','staminaRunSeconds','activeJob','jobSelected',
    'staminaRegenSeconds','cameraMode','player','bedSpawn','equippedArmor'];
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
  avatarHeldItems.dispose(model);
  setAvatarDamageFlash(model,false);
  scene.remove(model);model.traverse(o=>{if(o.isMesh)o.geometry.dispose()});multiAvatars.delete(id);
}
function multiPrepareMigration(checkpoint,plannedLeader=null){
  if(multiRole!=='guest'||multiMigration||!worldReady)return;
  const code=multiplayerNetwork.code;
  if(!/^[A-Z0-9]{6}$/.test(code))return;
  // Recreate votes with the new host; never carry a stale sleeping state
  // through network migration or a vanished host.
  multiSleepReset();
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
  multiApplyMobSnapshot(checkpoint.mobState);
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
  rebuildTorchIndex();
  // Restore any loot claims recorded by the departing host; otherwise a
  // promoted guest could respawn treasure that another player took.
  if(Array.isArray(world.villageLootGranted))
    for(const key of world.villageLootGranted)
      if(typeof key==='string'&&/^-?\d+,-?\d+,-?\d+$/.test(key))
        villageLootGranted.add(key);
  // Restore chest state found in the host checkpoint if a guest missed it.
  if(Array.isArray(world.chests))for(const row of world.chests){
    if(!Array.isArray(row)||typeof row[0]!=='string'||chestContents.has(row[0]))continue;
    const xyz=row[0].split(',').map(Number);
    if(xyz.length!==3||xyz.every(n=>Number.isInteger(n))&&get(...xyz)===B.CHEST)
      chestContents.set(row[0],normalizedChest(row[1]));
  }
  chestReceipts.clear();
  multiHostId=job.checkpoint.originId||multiHostId;
  multiHostSlot=job.checkpoint.slot||currentWorldSlot;
  multiWorldKind=job.checkpoint.worldKind==='single'?'single':'multi';
  multiOriginName=job.checkpoint.originName||multiOriginName||'プレイヤー';
  activeMap=job.checkpoint.world?.mapType==='testworld'?'testworld':'overworld';
  multiMembers=multiMigrationMembers(job.checkpoint);
  // A successor must not retain another player's old saved host profile as
  // its own inventory. Its own current inventory stays entirely untouched.
  multiMobSeq=Math.max(multiMobSeq,multiAppliedMobSeq);
  multiRole='host';multiGuestRecords.clear();
  multiRemoveAvatar(job.checkpoint.hostId);
  const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
  for(let attempt=0;attempt<12;attempt++){
    if(multiMigration!==job||multiRole!=='host')return;
    try{
      await multiplayerNetwork.host(job.code);
      if(multiMigration!==job){multiplayerNetwork.leaveRoom({handoff:true});return}
      multiMigration=null;multiLastCheckpoint=0;
      multiSleepHostSync();
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
  if(message.t==='mobState'){
    if(multiRole==='guest')multiApplyMobSnapshot(message);
    return;
  }
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
        originName:multiOriginName,worldKind:multiWorldKind,
        currentHostId:multiOwnId(),members:multiMembers,
        slot:currentWorldSlot,member:multiMembers[record.id]||null,
        mobState:multiMobSnapshot(),people
      },peerId);
      multiplayerNetwork.send({t:'roster',people});
      multiplayerNetwork.send({t:'joinNotice',name:record.name});
      multiPeople();multiSleepHostSync();return;
    }
    const from=multiGuestRecords.get(peerId);if(!from)return;
    if(message.t==='chat'){chatHostReceive(message,peerId,from);return}
    if(message.t==='sleepRequest'){
      if(message.sleeping===false){
        from.sleeping=false;
      }else if(message.sleeping===true&&isNightTime()&&
          Number.isInteger(message.bed?.x)&&Number.isInteger(message.bed?.y)&&
          Number.isInteger(message.bed?.z)&&from.player&&
          [from.player.x,from.player.y,from.player.z].every(Number.isFinite)&&
          Math.hypot(from.player.x-message.bed.x,from.player.y-message.bed.y,
            from.player.z-message.bed.z)<7.5){
        from.sleeping=true;
      }else{
        multiplayerNetwork.send({t:'sleepRejected'},peerId);return;
      }
      multiSleepHostSync();return;
    }
    if(message.t==='testSpawnMobs'){
      if(activeMap!=='testworld'||!Number.isInteger(message.qty)||message.qty<1||
         message.qty>20||!TEST_MOB_BY_KEY.has(message.key)||!from.player||
         ![from.player.x,from.player.y,from.player.z].every(Number.isFinite))return;
      const now=performance.now();
      if(now-(from.testSpawnAt??-Infinity)<300)return;
      from.testSpawnAt=now;
      const count=testSpawnMobs(message.key,message.qty,from.player);
      multiplayerNetwork.send({t:'testSpawnResult',count},peerId);
      multiplayerNetwork.send(multiMobSnapshot());
      return;
    }
    if(message.t==='testClearMobs'){
      if(activeMap!=='testworld'||!from.player)return;
      const now=performance.now();
      if(now-(from.testClearAt??-Infinity)<750)return;
      from.testClearAt=now;
      const count=testClearMobs();
      multiplayerNetwork.send({t:'testClearResult',count},peerId);
      multiplayerNetwork.send(multiMobSnapshot());
      return;
    }
    if(message.t==='chimeraSummon'){hostHandleChimeraSummon(message,from,peerId);return}
    if(message.t==='mobHit'){multiProcessMobHit(message,from);return}
    if(message.t==='jobSpell'){multiProcessJobSpell(message,from);return}
    if(message.t==='pose'&&message.player&&Number.isFinite(message.player.x)){
      from.player=message.player;from.lastPoseAt=performance.now();
      multiShowAvatar(from.id,from.player);
      multiplayerNetwork.send({t:'pose',id:from.id,player:from.player});
    }else if(message.t==='profile'&&Array.isArray(message.profile?.inventorySlots)){
      multiMembers[from.id]={...message.profile,name:from.name};markSaveDirty();
    }else if(message.t==='chestTransfer'){
      handleGuestChestTransfer(message,peerId,from);
    }else if(message.t==='chestLook'){
      const p=from.player;
      if([message.x,message.y,message.z].every(Number.isInteger)&&
         inside(message.x,message.y,message.z)&&p&&
         Math.hypot(p.x-message.x,p.y-message.y,p.z-message.z)<8&&
         get(message.x,message.y,message.z)===B.CHEST)
        multiplayerNetwork.send({t:'chestState',x:message.x,y:message.y,z:message.z,
          slots:chestSlots(message.x,message.y,message.z)},peerId);
    }else if(message.t==='arrowShot'&&validArrowPacket(message)){
      const p=from.player;
      if(p&&Math.hypot(message.x-p.x,message.y-p.y,message.z-p.z)<5){
        const event={...message,id:from.id};
        showRemoteArrow(event);multiplayerNetwork.send(event);
      }
    }else if(message.t==='block'){multiApplyBlock(message);multiplayerNetwork.send(message)}
    else if(message.t==='dropAdd'||message.t==='dropRemove'){multiApplyDrop(message);multiplayerNetwork.send(message)}
  }else{
    if(message.t==='testSpawnResult'&&activeMap==='testworld')
      testWorldStatus('モブを'+(Number(message.count)||0)+'体出しました');
    if(message.t==='testClearResult'&&activeMap==='testworld')
      testWorldStatus('モブを'+(Number(message.count)||0)+'体削除しました');
    if(message.t==='sleepState'){
      if(Number.isInteger(message.total)&&Number.isInteger(message.asleep)&&
          message.total>=1&&message.total<=4&&message.asleep>=0&&
          message.asleep<=message.total)
        multiSleepShowCount(message.asleep,message.total);
    }
    if(message.t==='sleepDone'&&Number.isFinite(message.dayTime)&&
        message.dayTime>=0&&message.dayTime<1){
      dayTime=message.dayTime;
      const wasSleeping=sleeping;
      multiSleepReset();
      if(wasSleeping)flash(message.naturalMorning?'朝になりました！':'全員が眠ったので朝になりました！');
    }
    if(message.t==='sleepRejected'&&sleeping){
      multiSleepReset();flash('ベッドで眠れませんでした。もう一度お試しください');
    }
    if(message.t==='chat')chatGuestReceive(message);
    if(message.t==='chimeraSummonResult')guestHandleChimeraSummonResult(message);
    if(message.t==='chimeraStrike'&&Number.isFinite(message.x)&&Number.isFinite(message.z)&&
       mobs.some(m=>m.userData.type==='chimera'&&m.userData.netId===message.id)&&
       Math.hypot(player.pos.x-message.x,player.pos.z-message.z)<7)
      damagePlayer(CHIMERA_HIT_DAMAGE,'キメラの攻撃',message);
    if(message.t==='golemStrike'&&Number.isFinite(message.x)&&Number.isFinite(message.z)&&
       mobs.some(m=>m.userData.type==='golem'&&m.userData.netId===message.id)&&
       Math.hypot(player.pos.x-message.x,player.pos.z-message.z)<4.5)
      damagePlayer(NEW_MOB_STATS.golem.damage,'ゴーレムの攻撃',message);
    if(message.t==='pose'){
      // Gracefully handle an old host version which sent poses without IDs.
      const id=typeof message.id==='string'?message.id:multiCheckpoint?.hostId;
      if(id===multiCheckpoint?.hostId||multiRoster.some(p=>p.id===id))
        multiShowAvatar(id,message.player);
    }
    if(message.t==='block')multiApplyBlock(message);
    if(message.t==='arrowShot')showRemoteArrow(message);
    if(message.t==='chestState'&&[message.x,message.y,message.z].every(Number.isInteger))
      chestApplyState(message.x,message.y,message.z,message.slots);
    if(message.t==='chestResult')chestReceiveResult(message);
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
    chatPeerLastSent.delete(e.peerId);
    const guest=multiGuestRecords.get(e.peerId);
    if(guest){
      multiGuestRecords.delete(e.peerId);
      multiRemoveAvatar(guest.id);
      multiplayerNetwork.send({t:'peerLeft',id:guest.id});
      multiSleepHostSync();
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
  if(multiRole==='host'&&worldReady&&multiplayerNetwork.connected&&
     now-multiLastMobSync>450){
    multiLastMobSync=now;
    if(multiGuestRecords.size)multiplayerNetwork.send(multiMobSnapshot());
  }
  if(now-multiLastPose>150){
    multiLastPose=now;
    if(multiplayerNetwork.connected){
      multiplayerNetwork.send({t:'pose',id:multiOwnId(),player:multiCurrentPose()});
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
  multiSleepReset();
  clearTimeout(multiPendingTimer);multiPendingTimer=null;
  clearTimeout(multiProfileSaveTimer);multiProfileSaveTimer=null;
  if(worldReady)saveCurrentGame(false);
  const handoff=multiHostExitSnapshot();
  multiRole=null;multiHostSlot=null;multiHostId='';multiOriginName='';multiWorldKind='multi';
  multiMigration=null;multiCheckpoint=null;multiRoster=[];
  multiplayerNetwork.leaveRoom({handoff});
  multiGuestRecords.clear();multiMembers={};chestReceipts.clear();multiClearAvatars();
  chimeraSummonPending=null;
  chatReset();
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
  if(multiViewId==='multiLobby'){
    if(worldReady&&started){$('multiCover').style.display='none';cover.style.display='none';return}
    multiLeave();return;
  }
  if(multiViewId!=='multiHome'){multiView('multiHome');return}
  $('multiCover').style.display='none';menuCover.style.display='flex';
});
$('multiLeave').addEventListener('click',()=>multiLeave());
$('multiEnter').addEventListener('click',()=>{
  if(multiRole!=='host'||!worldReady)return;
  $('multiCover').style.display='none';
  if(started){cover.style.display='none';return}
  $('startBtn').click();
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
$('multiRoomCopy').addEventListener('click',async()=>{
  const code=multiplayerNetwork.code;if(!code)return;
  try{await navigator.clipboard.writeText(code);multiStatus('参加コード '+code+' をコピーしました')}
  catch{multiStatus('参加コード：'+code)}
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

$('mapOverworld').addEventListener('click',()=>{activeMap='overworld';showMainMenu()});
$('mapTestworld').addEventListener('click',()=>{activeMap='testworld';showMainMenu()});
$('menuMapBack').addEventListener('click',showMapSelection);
singlePlayBtn.addEventListener('click',showWorldSelection);
worldBack.addEventListener('click',showMainMenu);
menuLogout.addEventListener('click',async()=>{
  try{await cloudFlush();await cloudSignOut()}catch(e){console.warn('Cloud logout',e)}
  clearSession();location.reload();
});
saveNowBtn.addEventListener('click',()=>saveCurrentGame(true));
$('inviteFriendsBtn').addEventListener('click',()=>multiInviteFromGame());
worldListBtn.addEventListener('click',()=>{
  if(!currentAccount)return;
  if(multiRole)multiLeave();else showWorldSelection();
});
worldLogout.addEventListener('click',async()=>{
  try{await cloudFlush();await cloudSignOut()}catch(e){console.warn('Cloud logout',e)}
  clearSession();location.reload();
});
logoutBtn.addEventListener('click',()=>{
  if(!currentAccount)return;
  if(confirm('セーブしてログアウトしますか？')){
    saveCurrentGame(false);
    const handoff=multiRole==='host'&&multiGuestRecords.size>0;
    if(multiRole)multiLeave(true);
    clearInterval(saveInterval);
    void (async()=>{
      try{await cloudFlush();await cloudSignOut()}catch(e){console.warn('Cloud logout',e)}
      clearSession();
      // A reload right away would abort in-flight WebRTC world migration.
      if(handoff)setTimeout(()=>location.reload(),900);
      else location.reload();
    })();
  }
});
document.addEventListener('visibilitychange',()=>{if(document.hidden)saveCurrentGame(false)});
addEventListener('pagehide',()=>saveCurrentGame(false));

respawnBtn.addEventListener('click',()=>respawnPlayer());

$('viewModeButton').addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();cycleCameraMode()});
updateViewLabel();
$('startBtn').addEventListener('click',()=>{
  if(!worldReady||!currentAccount)return;
  started=true;cover.style.display='none';last=performance.now();renderHealth();updateJobHud();
  $('testWorldOpen').hidden=activeMap!=='testworld';
  if(multiRole)multiSleepBannerUpdate(multiSleepSnapshot.asleep,multiSleepSnapshot.total);
  chatSyncVisible();
  if(dead){showDeathScreen();return}
  if(!jobSelected){setJobOpen(true)}
  else if(!matchMedia('(pointer:coarse)').matches)renderer.domElement.requestPointerLock?.();
  void spawnChimeraVisualTest();
  // Opt-in visual QA: opening the game with ?hurtTest=1 fires exactly one
  // real damage event after entering a world, no zombie required.
  if(HURT_TEST_MODE&&!hurtTestPlayed){
    hurtTestPlayed=true;
    setTimeout(()=>{
      if(!started||dead||!worldReady)return;
      damagePlayer(1,'ダメージ演出テスト',{
        x:player.pos.x+1,z:player.pos.z
      });
    },1100);
  }
});
if(cloudEnabled){
  const note=document.querySelector('.auth-note');
  if(note)note.textContent='クラウド対応：同じユーザー名とパスワードで別の端末からログインできます。初回の旧アカウント移行は元の端末でログインしてください。';
  // Restore the existing remembered account immediately, without waiting
  // for Firebase libraries, credentials or Firestore/network availability.
  if(!restoreSession())authName.focus();
  void restoreCloudSession();
}else if(!restoreSession())authName.focus();
requestAnimationFrame(loop);
