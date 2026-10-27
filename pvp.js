import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.180.0/+esm';
import {makeJobWeaponModel,jobHeldBladeYaw,jobHeldWeaponScale,JOBS} from './job-system.js?v=20261027storyMesh04';
import {PVP_WEAPONS} from './pvp-weapon-models.js?v=20261027unique110';
import {makeFirstPersonHand} from './first-person-hand.js?v=20261022pvpFirst01';
import {makeAvatarHeldItems} from './avatar-held-items.js?v=20261022pvpFirst01';

const $=id=>document.getElementById(id);

// PvP equipment fallback: every registered class receives a visible 3D weapon.
// These are existing weapon meshes; bespoke models can replace them later.
const PVP_WEAPON_FOR_JOB=new Map(PVP_WEAPONS.map(w=>[w.id,w.weaponId]));
function pvpExclusiveWeapon(job){return PVP_WEAPON_FOR_JOB.get(job)??300}
const PVP_WEAPON_IDS={fighter:191,spear:199,alchemist:207,ninja:191,reaper:196,gunner:193,summoner:207,time:207,chain:199,hammer:198,beast:193,barrier:192,curse:207,katana:197,reflect:192,bomber:206,gravity:207,machine:200,phantom:191,star:206,mimic:190,swordsaint:197,dragonking:206,underking:196,thundergod:206,dimensionking:207};
const PVP_WEAPON_GROUPS=['191','192','207','193','207','207','199','200','206','191'];
function pvpWeapon(job){
 if(CLASSES[job])return pvpExclusiveWeapon(job);
 if(JOBS[job]?.weapon!=null)return JOBS[job].weapon;
 if(PVP_WEAPON_IDS[job]!=null)return PVP_WEAPON_IDS[job];
 if(job.startsWith('extra_'))return Number(PVP_WEAPON_GROUPS[Math.min(9,Math.floor((Number(job.slice(6))-1)/8))]);
 return 190;
}
function pvpWeaponKind(job){
 const id=pvpWeapon(job);
 const exclusive=PVP_WEAPONS.find(w=>w.weaponId===id);
 if(exclusive){const k=exclusive.kind;return ['bow','crossbow'].includes(k)?'bow':['staff','book','orb','potion','ring','brush','lute'].includes(k)?'staff':k==='shield'?'shield':k==='dual'?'dual':['trident','chain'].includes(k)?'spear':'sword';}
 if(id===193||id===204||id===205)return 'bow';
 if(id===207||id===206||id===194)return 'staff';
 if(id===192||id===201||id===202)return 'shield';
 if(id===191||id===200)return 'dual';
 if(id===199)return 'spear';
 return 'sword';
}
// A shared set of distinct combat passives, assigned by job archetype.
// Passive damage, healing and crowd-control are calculated by the match host.
function pvpPassive(job){
 const id=job.startsWith('extra_')?Math.min(9,Math.floor((Number(job.slice(6))-1)/8)):({
 fighter:0,spear:6,alchemist:4,ninja:0,reaper:4,gunner:3,summoner:5,time:2,chain:6,hammer:1,beast:5,barrier:1,curse:4,katana:6,reflect:1,bomber:8,gravity:2,machine:7,phantom:0,star:8,mimic:9,swordsaint:6,dragonking:5,underking:4,thundergod:8,dimensionking:9
 }[job]??(job==='merc'?0:job==='shield'?1:job==='archer'?3:job==='mage'?2:6));
 return id;
}

const CLASSES={
  extra_001:{name:'盗賊',hp:95,speed:9.1,range:2.7,damage:13,cooldown:390,arc:0.09},
  extra_002:{name:'影武者',hp:98,speed:9.1,range:2.7,damage:13,cooldown:390,arc:0.09},
  extra_003:{name:'疾風剣士',hp:101,speed:9.1,range:2.7,damage:13,cooldown:390,arc:0.09},
  extra_004:{name:'曲芸師',hp:95,speed:9.1,range:2.7,damage:13,cooldown:390,arc:0.09},
  extra_005:{name:'追跡者',hp:98,speed:9.1,range:2.7,damage:13,cooldown:390,arc:0.09},
  extra_006:{name:'夜叉',hp:101,speed:9.1,range:2.7,damage:13,cooldown:390,arc:0.09},
  extra_007:{name:'時渡り',hp:95,speed:9.1,range:2.7,damage:13,cooldown:390,arc:0.09},
  extra_008:{name:'鉄騎士',hp:153,speed:5.9,range:2.9,damage:16,cooldown:790,arc:0.13},
  extra_009:{name:'重戦士',hp:156,speed:5.9,range:2.9,damage:16,cooldown:790,arc:0.13},
  extra_010:{name:'不動兵',hp:150,speed:5.9,range:2.9,damage:16,cooldown:790,arc:0.13},
  extra_011:{name:'岩石兵',hp:153,speed:5.9,range:2.9,damage:16,cooldown:790,arc:0.13},
  extra_012:{name:'守護者',hp:156,speed:5.9,range:2.9,damage:16,cooldown:790,arc:0.13},
  extra_013:{name:'鎧武者',hp:150,speed:5.9,range:2.9,damage:16,cooldown:790,arc:0.13},
  extra_014:{name:'巨人兵',hp:153,speed:5.9,range:2.9,damage:16,cooldown:790,arc:0.13},
  extra_015:{name:'不死兵',hp:156,speed:5.9,range:2.9,damage:16,cooldown:790,arc:0.13},
  extra_016:{name:'水術師',hp:98,speed:7,range:7.7,damage:19,cooldown:980,arc:0.39},
  extra_017:{name:'風術師',hp:101,speed:7,range:7.7,damage:19,cooldown:980,arc:0.39},
  extra_018:{name:'土術師',hp:104,speed:7,range:7.7,damage:19,cooldown:980,arc:0.39},
  extra_019:{name:'光術師',hp:98,speed:7,range:7.7,damage:19,cooldown:980,arc:0.39},
  extra_020:{name:'闇術師',hp:101,speed:7,range:7.7,damage:19,cooldown:980,arc:0.39},
  extra_021:{name:'毒術師',hp:104,speed:7,range:7.7,damage:19,cooldown:980,arc:0.39},
  extra_022:{name:'時間術師',hp:98,speed:7,range:7.7,damage:19,cooldown:980,arc:0.39},
  extra_023:{name:'空間術師',hp:101,speed:7,range:7.7,damage:19,cooldown:980,arc:0.39},
  extra_024:{name:'狙撃兵',hp:102,speed:7.3,range:11,damage:16,cooldown:880,arc:0.49},
  extra_025:{name:'砲兵',hp:96,speed:7.3,range:11,damage:16,cooldown:880,arc:0.49},
  extra_026:{name:'投槍兵',hp:99,speed:7.3,range:11,damage:16,cooldown:880,arc:0.49},
  extra_027:{name:'クロスボウ兵',hp:102,speed:7.3,range:11,damage:16,cooldown:880,arc:0.49},
  extra_028:{name:'投石兵',hp:96,speed:7.3,range:11,damage:16,cooldown:880,arc:0.49},
  extra_029:{name:'連弩兵',hp:99,speed:7.3,range:11,damage:16,cooldown:880,arc:0.49},
  extra_030:{name:'魔銃士',hp:102,speed:7.3,range:11,damage:16,cooldown:880,arc:0.49},
  extra_031:{name:'狩人',hp:96,speed:7.3,range:11,damage:16,cooldown:880,arc:0.49},
  extra_032:{name:'死霊術師',hp:111,speed:7.2,range:6.3,damage:18,cooldown:850,arc:0.31},
  extra_033:{name:'吸血鬼',hp:114,speed:7.2,range:6.3,damage:18,cooldown:850,arc:0.31},
  extra_034:{name:'人形使い',hp:108,speed:7.2,range:6.3,damage:18,cooldown:850,arc:0.31},
  extra_035:{name:'夢幻師',hp:111,speed:7.2,range:6.3,damage:18,cooldown:850,arc:0.31},
  extra_036:{name:'封印師',hp:114,speed:7.2,range:6.3,damage:18,cooldown:850,arc:0.31},
  extra_037:{name:'魂狩り',hp:108,speed:7.2,range:6.3,damage:18,cooldown:850,arc:0.31},
  extra_038:{name:'魔剣士',hp:111,speed:7.2,range:6.3,damage:18,cooldown:850,arc:0.31},
  extra_039:{name:'霊媒師',hp:114,speed:7.2,range:6.3,damage:18,cooldown:850,arc:0.31},
  extra_040:{name:'竜使い',hp:106,speed:7.1,range:7.4,damage:17,cooldown:940,arc:0.36},
  extra_041:{name:'蟲使い',hp:109,speed:7.1,range:7.4,damage:17,cooldown:940,arc:0.36},
  extra_042:{name:'鳥使い',hp:112,speed:7.1,range:7.4,damage:17,cooldown:940,arc:0.36},
  extra_043:{name:'魔物使い',hp:106,speed:7.1,range:7.4,damage:17,cooldown:940,arc:0.36},
  extra_044:{name:'精霊使い',hp:109,speed:7.1,range:7.4,damage:17,cooldown:940,arc:0.36},
  extra_045:{name:'傀儡師',hp:112,speed:7.1,range:7.4,damage:17,cooldown:940,arc:0.36},
  extra_046:{name:'植物使い',hp:106,speed:7.1,range:7.4,damage:17,cooldown:940,arc:0.36},
  extra_047:{name:'幻獣使い',hp:109,speed:7.1,range:7.4,damage:17,cooldown:940,arc:0.36},
  extra_048:{name:'鎌使い',hp:126,speed:7.2,range:3.8,damage:18,cooldown:700,arc:0.15},
  extra_049:{name:'鞭使い',hp:120,speed:7.2,range:3.8,damage:18,cooldown:700,arc:0.15},
  extra_050:{name:'鉄球使い',hp:123,speed:7.2,range:3.8,damage:18,cooldown:700,arc:0.15},
  extra_051:{name:'棒術師',hp:126,speed:7.2,range:3.8,damage:18,cooldown:700,arc:0.15},
  extra_052:{name:'戦斧使い',hp:120,speed:7.2,range:3.8,damage:18,cooldown:700,arc:0.15},
  extra_053:{name:'三叉槍兵',hp:123,speed:7.2,range:3.8,damage:18,cooldown:700,arc:0.15},
  extra_054:{name:'チャクラム使い',hp:126,speed:7.2,range:3.8,damage:18,cooldown:700,arc:0.15},
  extra_055:{name:'二刀流剣士',hp:120,speed:7.2,range:3.8,damage:18,cooldown:700,arc:0.15},
  extra_056:{name:'工兵',hp:123,speed:7.1,range:7.3,damage:18,cooldown:850,arc:0.35},
  extra_057:{name:'科学者',hp:126,speed:7.1,range:7.3,damage:18,cooldown:850,arc:0.35},
  extra_058:{name:'蒸気騎士',hp:120,speed:7.1,range:7.3,damage:18,cooldown:850,arc:0.35},
  extra_059:{name:'爆破技師',hp:123,speed:7.1,range:7.3,damage:18,cooldown:850,arc:0.35},
  extra_060:{name:'人造人間',hp:126,speed:7.1,range:7.3,damage:18,cooldown:850,arc:0.35},
  extra_061:{name:'電磁兵',hp:120,speed:7.1,range:7.3,damage:18,cooldown:850,arc:0.35},
  extra_062:{name:'ドローン使い',hp:123,speed:7.1,range:7.3,damage:18,cooldown:850,arc:0.35},
  extra_063:{name:'機巧師',hp:126,speed:7.1,range:7.3,damage:18,cooldown:850,arc:0.35},
  extra_064:{name:'月影騎士',hp:110,speed:7.5,range:7,damage:21,cooldown:1000,arc:0.35},
  extra_065:{name:'太陽騎士',hp:113,speed:7.5,range:7,damage:21,cooldown:1000,arc:0.35},
  extra_066:{name:'虚空使い',hp:116,speed:7.5,range:7,damage:21,cooldown:1000,arc:0.35},
  extra_067:{name:'天空兵',hp:110,speed:7.5,range:7,damage:21,cooldown:1000,arc:0.35},
  extra_068:{name:'混沌術師',hp:113,speed:7.5,range:7,damage:21,cooldown:1000,arc:0.35},
  extra_069:{name:'星喰い',hp:116,speed:7.5,range:7,damage:21,cooldown:1000,arc:0.35},
  extra_070:{name:'天使',hp:110,speed:7.5,range:7,damage:21,cooldown:1000,arc:0.35},
  extra_071:{name:'悪魔',hp:113,speed:7.5,range:7,damage:21,cooldown:1000,arc:0.35},
  extra_072:{name:'予言者',hp:116,speed:7.5,range:7,damage:21,cooldown:1000,arc:0.35},
  extra_073:{name:'道化師',hp:106,speed:8,range:5.2,damage:16,cooldown:680,arc:0.22},
  extra_074:{name:'賭博師',hp:109,speed:8,range:5.2,damage:16,cooldown:680,arc:0.22},
  extra_075:{name:'変身師',hp:112,speed:8,range:5.2,damage:16,cooldown:680,arc:0.22},
  extra_076:{name:'音楽家',hp:106,speed:8,range:5.2,damage:16,cooldown:680,arc:0.22},
  extra_077:{name:'踊り子',hp:109,speed:8,range:5.2,damage:16,cooldown:680,arc:0.22},
  extra_078:{name:'料理人',hp:112,speed:8,range:5.2,damage:16,cooldown:680,arc:0.22},
  extra_079:{name:'画家',hp:106,speed:8,range:5.2,damage:16,cooldown:680,arc:0.22},
  sword:{name:'剣士',hp:120,speed:7.1,range:3.0,damage:18,cooldown:630,arc:.18},
  merc:{name:'傭兵',hp:105,speed:8.6,range:2.65,damage:10,cooldown:300,arc:.05},
  shield:{name:'盾兵',hp:155,speed:5.7,range:2.6,damage:13,cooldown:850,arc:.05,block:.70},
  archer:{name:'弓兵',hp:90,speed:7.5,range:13,damage:16,cooldown:900,arc:.78},
  mage:{name:'魔術師',hp:100,speed:6.9,range:7.3,damage:21,cooldown:1150,arc:.38},
  fighter:{name:'格闘家',hp:125,speed:9,range:2.1,damage:9,cooldown:260,arc:0.07},
  spear:{name:'槍兵',hp:110,speed:7,range:4.3,damage:15,cooldown:680,arc:0.09},
  alchemist:{name:'錬金術師',hp:95,speed:7,range:8,damage:14,cooldown:850,arc:0.38},
  ninja:{name:'忍者',hp:90,speed:10,range:2.6,damage:12,cooldown:340,arc:0.08},
  reaper:{name:'死神',hp:115,speed:7.3,range:3.6,damage:22,cooldown:880,arc:0.22},
  gunner:{name:'銃士',hp:95,speed:7.6,range:12,damage:13,cooldown:480,arc:0.5},
  summoner:{name:'召喚士',hp:100,speed:6.9,range:7.2,damage:17,cooldown:920,arc:0.38},
  time:{name:'時空使い',hp:90,speed:8,range:7.2,damage:17,cooldown:870,arc:0.3},
  chain:{name:'鎖使い',hp:110,speed:7.6,range:5,damage:13,cooldown:590,arc:0.18},
  hammer:{name:'ハンマー使い',hp:145,speed:5.8,range:3,damage:25,cooldown:1150,arc:0.18},
  beast:{name:'獣使い',hp:110,speed:7.5,range:8,damage:16,cooldown:830,arc:0.4},
  barrier:{name:'結界師',hp:130,speed:6.1,range:6.5,damage:13,cooldown:900,arc:0.32},
  curse:{name:'呪術師',hp:95,speed:7.1,range:7,damage:18,cooldown:920,arc:0.4},
  katana:{name:'刀使い',hp:108,speed:8.1,range:3,damage:19,cooldown:670,arc:0.12},
  reflect:{name:'反射騎士',hp:160,speed:5.6,range:2.7,damage:12,cooldown:880,arc:0.09},
  bomber:{name:'爆弾兵',hp:105,speed:7,range:8,damage:20,cooldown:1100,arc:0.55},
  gravity:{name:'重力術師',hp:100,speed:6.8,range:7.5,damage:19,cooldown:1020,arc:0.45},
  machine:{name:'機械兵',hp:125,speed:7.4,range:3,damage:17,cooldown:610,arc:0.14},
  phantom:{name:'幻影師',hp:95,speed:9.1,range:3,damage:14,cooldown:470,arc:0.12},
  star:{name:'星術師',hp:90,speed:6.6,range:8,damage:23,cooldown:1200,arc:0.5},
  mimic:{name:'模倣者',hp:110,speed:7.5,range:4,damage:17,cooldown:680,arc:0.2},
  swordsaint:{name:'剣聖',hp:135,speed:8.4,range:3.3,damage:22,cooldown:570,arc:0.16},
  dragonking:{name:'竜王',hp:155,speed:6.9,range:8,damage:22,cooldown:1050,arc:0.45},
  underking:{name:'冥王',hp:150,speed:7.1,range:4,damage:24,cooldown:880,arc:0.24},
  thundergod:{name:'雷神',hp:115,speed:8,range:9,damage:23,cooldown:950,arc:0.45},
  dimensionking:{name:'次元王',hp:125,speed:8.7,range:8,damage:23,cooldown:920,arc:0.45}
};


// Evolution branches: first choice at Lv.50, specialization at Lv.100.
// Evolutions retain the original job's XP and level.
const EVOLUTIONS={
 extra_001:[['盗賊・技巧','盗賊・剛力'],[['盗賊・達人','盗賊・神速'],['盗賊・覇者','盗賊・守護']]],
 extra_002:[['影武者・技巧','影武者・剛力'],[['影武者・達人','影武者・神速'],['影武者・覇者','影武者・守護']]],
 extra_003:[['疾風剣士・技巧','疾風剣士・剛力'],[['疾風剣士・達人','疾風剣士・神速'],['疾風剣士・覇者','疾風剣士・守護']]],
 extra_004:[['曲芸師・技巧','曲芸師・剛力'],[['曲芸師・達人','曲芸師・神速'],['曲芸師・覇者','曲芸師・守護']]],
 extra_005:[['追跡者・技巧','追跡者・剛力'],[['追跡者・達人','追跡者・神速'],['追跡者・覇者','追跡者・守護']]],
 extra_006:[['夜叉・技巧','夜叉・剛力'],[['夜叉・達人','夜叉・神速'],['夜叉・覇者','夜叉・守護']]],
 extra_007:[['時渡り・技巧','時渡り・剛力'],[['時渡り・達人','時渡り・神速'],['時渡り・覇者','時渡り・守護']]],
 extra_008:[['鉄騎士・技巧','鉄騎士・剛力'],[['鉄騎士・達人','鉄騎士・神速'],['鉄騎士・覇者','鉄騎士・守護']]],
 extra_009:[['重戦士・技巧','重戦士・剛力'],[['重戦士・達人','重戦士・神速'],['重戦士・覇者','重戦士・守護']]],
 extra_010:[['不動兵・技巧','不動兵・剛力'],[['不動兵・達人','不動兵・神速'],['不動兵・覇者','不動兵・守護']]],
 extra_011:[['岩石兵・技巧','岩石兵・剛力'],[['岩石兵・達人','岩石兵・神速'],['岩石兵・覇者','岩石兵・守護']]],
 extra_012:[['守護者・技巧','守護者・剛力'],[['守護者・達人','守護者・神速'],['守護者・覇者','守護者・守護']]],
 extra_013:[['鎧武者・技巧','鎧武者・剛力'],[['鎧武者・達人','鎧武者・神速'],['鎧武者・覇者','鎧武者・守護']]],
 extra_014:[['巨人兵・技巧','巨人兵・剛力'],[['巨人兵・達人','巨人兵・神速'],['巨人兵・覇者','巨人兵・守護']]],
 extra_015:[['不死兵・技巧','不死兵・剛力'],[['不死兵・達人','不死兵・神速'],['不死兵・覇者','不死兵・守護']]],
 extra_016:[['水術師・技巧','水術師・剛力'],[['水術師・達人','水術師・神速'],['水術師・覇者','水術師・守護']]],
 extra_017:[['風術師・技巧','風術師・剛力'],[['風術師・達人','風術師・神速'],['風術師・覇者','風術師・守護']]],
 extra_018:[['土術師・技巧','土術師・剛力'],[['土術師・達人','土術師・神速'],['土術師・覇者','土術師・守護']]],
 extra_019:[['光術師・技巧','光術師・剛力'],[['光術師・達人','光術師・神速'],['光術師・覇者','光術師・守護']]],
 extra_020:[['闇術師・技巧','闇術師・剛力'],[['闇術師・達人','闇術師・神速'],['闇術師・覇者','闇術師・守護']]],
 extra_021:[['毒術師・技巧','毒術師・剛力'],[['毒術師・達人','毒術師・神速'],['毒術師・覇者','毒術師・守護']]],
 extra_022:[['時間術師・技巧','時間術師・剛力'],[['時間術師・達人','時間術師・神速'],['時間術師・覇者','時間術師・守護']]],
 extra_023:[['空間術師・技巧','空間術師・剛力'],[['空間術師・達人','空間術師・神速'],['空間術師・覇者','空間術師・守護']]],
 extra_024:[['狙撃兵・技巧','狙撃兵・剛力'],[['狙撃兵・達人','狙撃兵・神速'],['狙撃兵・覇者','狙撃兵・守護']]],
 extra_025:[['砲兵・技巧','砲兵・剛力'],[['砲兵・達人','砲兵・神速'],['砲兵・覇者','砲兵・守護']]],
 extra_026:[['投槍兵・技巧','投槍兵・剛力'],[['投槍兵・達人','投槍兵・神速'],['投槍兵・覇者','投槍兵・守護']]],
 extra_027:[['クロスボウ兵・技巧','クロスボウ兵・剛力'],[['クロスボウ兵・達人','クロスボウ兵・神速'],['クロスボウ兵・覇者','クロスボウ兵・守護']]],
 extra_028:[['投石兵・技巧','投石兵・剛力'],[['投石兵・達人','投石兵・神速'],['投石兵・覇者','投石兵・守護']]],
 extra_029:[['連弩兵・技巧','連弩兵・剛力'],[['連弩兵・達人','連弩兵・神速'],['連弩兵・覇者','連弩兵・守護']]],
 extra_030:[['魔銃士・技巧','魔銃士・剛力'],[['魔銃士・達人','魔銃士・神速'],['魔銃士・覇者','魔銃士・守護']]],
 extra_031:[['狩人・技巧','狩人・剛力'],[['狩人・達人','狩人・神速'],['狩人・覇者','狩人・守護']]],
 extra_032:[['死霊術師・技巧','死霊術師・剛力'],[['死霊術師・達人','死霊術師・神速'],['死霊術師・覇者','死霊術師・守護']]],
 extra_033:[['吸血鬼・技巧','吸血鬼・剛力'],[['吸血鬼・達人','吸血鬼・神速'],['吸血鬼・覇者','吸血鬼・守護']]],
 extra_034:[['人形使い・技巧','人形使い・剛力'],[['人形使い・達人','人形使い・神速'],['人形使い・覇者','人形使い・守護']]],
 extra_035:[['夢幻師・技巧','夢幻師・剛力'],[['夢幻師・達人','夢幻師・神速'],['夢幻師・覇者','夢幻師・守護']]],
 extra_036:[['封印師・技巧','封印師・剛力'],[['封印師・達人','封印師・神速'],['封印師・覇者','封印師・守護']]],
 extra_037:[['魂狩り・技巧','魂狩り・剛力'],[['魂狩り・達人','魂狩り・神速'],['魂狩り・覇者','魂狩り・守護']]],
 extra_038:[['魔剣士・技巧','魔剣士・剛力'],[['魔剣士・達人','魔剣士・神速'],['魔剣士・覇者','魔剣士・守護']]],
 extra_039:[['霊媒師・技巧','霊媒師・剛力'],[['霊媒師・達人','霊媒師・神速'],['霊媒師・覇者','霊媒師・守護']]],
 extra_040:[['竜使い・技巧','竜使い・剛力'],[['竜使い・達人','竜使い・神速'],['竜使い・覇者','竜使い・守護']]],
 extra_041:[['蟲使い・技巧','蟲使い・剛力'],[['蟲使い・達人','蟲使い・神速'],['蟲使い・覇者','蟲使い・守護']]],
 extra_042:[['鳥使い・技巧','鳥使い・剛力'],[['鳥使い・達人','鳥使い・神速'],['鳥使い・覇者','鳥使い・守護']]],
 extra_043:[['魔物使い・技巧','魔物使い・剛力'],[['魔物使い・達人','魔物使い・神速'],['魔物使い・覇者','魔物使い・守護']]],
 extra_044:[['精霊使い・技巧','精霊使い・剛力'],[['精霊使い・達人','精霊使い・神速'],['精霊使い・覇者','精霊使い・守護']]],
 extra_045:[['傀儡師・技巧','傀儡師・剛力'],[['傀儡師・達人','傀儡師・神速'],['傀儡師・覇者','傀儡師・守護']]],
 extra_046:[['植物使い・技巧','植物使い・剛力'],[['植物使い・達人','植物使い・神速'],['植物使い・覇者','植物使い・守護']]],
 extra_047:[['幻獣使い・技巧','幻獣使い・剛力'],[['幻獣使い・達人','幻獣使い・神速'],['幻獣使い・覇者','幻獣使い・守護']]],
 extra_048:[['鎌使い・技巧','鎌使い・剛力'],[['鎌使い・達人','鎌使い・神速'],['鎌使い・覇者','鎌使い・守護']]],
 extra_049:[['鞭使い・技巧','鞭使い・剛力'],[['鞭使い・達人','鞭使い・神速'],['鞭使い・覇者','鞭使い・守護']]],
 extra_050:[['鉄球使い・技巧','鉄球使い・剛力'],[['鉄球使い・達人','鉄球使い・神速'],['鉄球使い・覇者','鉄球使い・守護']]],
 extra_051:[['棒術師・技巧','棒術師・剛力'],[['棒術師・達人','棒術師・神速'],['棒術師・覇者','棒術師・守護']]],
 extra_052:[['戦斧使い・技巧','戦斧使い・剛力'],[['戦斧使い・達人','戦斧使い・神速'],['戦斧使い・覇者','戦斧使い・守護']]],
 extra_053:[['三叉槍兵・技巧','三叉槍兵・剛力'],[['三叉槍兵・達人','三叉槍兵・神速'],['三叉槍兵・覇者','三叉槍兵・守護']]],
 extra_054:[['チャクラム使い・技巧','チャクラム使い・剛力'],[['チャクラム使い・達人','チャクラム使い・神速'],['チャクラム使い・覇者','チャクラム使い・守護']]],
 extra_055:[['二刀流剣士・技巧','二刀流剣士・剛力'],[['二刀流剣士・達人','二刀流剣士・神速'],['二刀流剣士・覇者','二刀流剣士・守護']]],
 extra_056:[['工兵・技巧','工兵・剛力'],[['工兵・達人','工兵・神速'],['工兵・覇者','工兵・守護']]],
 extra_057:[['科学者・技巧','科学者・剛力'],[['科学者・達人','科学者・神速'],['科学者・覇者','科学者・守護']]],
 extra_058:[['蒸気騎士・技巧','蒸気騎士・剛力'],[['蒸気騎士・達人','蒸気騎士・神速'],['蒸気騎士・覇者','蒸気騎士・守護']]],
 extra_059:[['爆破技師・技巧','爆破技師・剛力'],[['爆破技師・達人','爆破技師・神速'],['爆破技師・覇者','爆破技師・守護']]],
 extra_060:[['人造人間・技巧','人造人間・剛力'],[['人造人間・達人','人造人間・神速'],['人造人間・覇者','人造人間・守護']]],
 extra_061:[['電磁兵・技巧','電磁兵・剛力'],[['電磁兵・達人','電磁兵・神速'],['電磁兵・覇者','電磁兵・守護']]],
 extra_062:[['ドローン使い・技巧','ドローン使い・剛力'],[['ドローン使い・達人','ドローン使い・神速'],['ドローン使い・覇者','ドローン使い・守護']]],
 extra_063:[['機巧師・技巧','機巧師・剛力'],[['機巧師・達人','機巧師・神速'],['機巧師・覇者','機巧師・守護']]],
 extra_064:[['月影騎士・技巧','月影騎士・剛力'],[['月影騎士・達人','月影騎士・神速'],['月影騎士・覇者','月影騎士・守護']]],
 extra_065:[['太陽騎士・技巧','太陽騎士・剛力'],[['太陽騎士・達人','太陽騎士・神速'],['太陽騎士・覇者','太陽騎士・守護']]],
 extra_066:[['虚空使い・技巧','虚空使い・剛力'],[['虚空使い・達人','虚空使い・神速'],['虚空使い・覇者','虚空使い・守護']]],
 extra_067:[['天空兵・技巧','天空兵・剛力'],[['天空兵・達人','天空兵・神速'],['天空兵・覇者','天空兵・守護']]],
 extra_068:[['混沌術師・技巧','混沌術師・剛力'],[['混沌術師・達人','混沌術師・神速'],['混沌術師・覇者','混沌術師・守護']]],
 extra_069:[['星喰い・技巧','星喰い・剛力'],[['星喰い・達人','星喰い・神速'],['星喰い・覇者','星喰い・守護']]],
 extra_070:[['天使・技巧','天使・剛力'],[['天使・達人','天使・神速'],['天使・覇者','天使・守護']]],
 extra_071:[['悪魔・技巧','悪魔・剛力'],[['悪魔・達人','悪魔・神速'],['悪魔・覇者','悪魔・守護']]],
 extra_072:[['予言者・技巧','予言者・剛力'],[['予言者・達人','予言者・神速'],['予言者・覇者','予言者・守護']]],
 extra_073:[['道化師・技巧','道化師・剛力'],[['道化師・達人','道化師・神速'],['道化師・覇者','道化師・守護']]],
 extra_074:[['賭博師・技巧','賭博師・剛力'],[['賭博師・達人','賭博師・神速'],['賭博師・覇者','賭博師・守護']]],
 extra_075:[['変身師・技巧','変身師・剛力'],[['変身師・達人','変身師・神速'],['変身師・覇者','変身師・守護']]],
 extra_076:[['音楽家・技巧','音楽家・剛力'],[['音楽家・達人','音楽家・神速'],['音楽家・覇者','音楽家・守護']]],
 extra_077:[['踊り子・技巧','踊り子・剛力'],[['踊り子・達人','踊り子・神速'],['踊り子・覇者','踊り子・守護']]],
 extra_078:[['料理人・技巧','料理人・剛力'],[['料理人・達人','料理人・神速'],['料理人・覇者','料理人・守護']]],
 extra_079:[['画家・技巧','画家・剛力'],[['画家・達人','画家・神速'],['画家・覇者','画家・守護']]],
 fighter:[['格闘家・技巧','格闘家・剛力'],[['格闘家・達人','格闘家・神速'],['格闘家・覇者','格闘家・守護']]],
 spear:[['槍兵・技巧','槍兵・剛力'],[['槍兵・達人','槍兵・神速'],['槍兵・覇者','槍兵・守護']]],
 alchemist:[['錬金術師・技巧','錬金術師・剛力'],[['錬金術師・達人','錬金術師・神速'],['錬金術師・覇者','錬金術師・守護']]],
 ninja:[['忍者・技巧','忍者・剛力'],[['忍者・達人','忍者・神速'],['忍者・覇者','忍者・守護']]],
 reaper:[['死神・技巧','死神・剛力'],[['死神・達人','死神・神速'],['死神・覇者','死神・守護']]],
 gunner:[['銃士・技巧','銃士・剛力'],[['銃士・達人','銃士・神速'],['銃士・覇者','銃士・守護']]],
 summoner:[['召喚士・技巧','召喚士・剛力'],[['召喚士・達人','召喚士・神速'],['召喚士・覇者','召喚士・守護']]],
 time:[['時空使い・技巧','時空使い・剛力'],[['時空使い・達人','時空使い・神速'],['時空使い・覇者','時空使い・守護']]],
 chain:[['鎖使い・技巧','鎖使い・剛力'],[['鎖使い・達人','鎖使い・神速'],['鎖使い・覇者','鎖使い・守護']]],
 hammer:[['ハンマー使い・技巧','ハンマー使い・剛力'],[['ハンマー使い・達人','ハンマー使い・神速'],['ハンマー使い・覇者','ハンマー使い・守護']]],
 beast:[['獣使い・技巧','獣使い・剛力'],[['獣使い・達人','獣使い・神速'],['獣使い・覇者','獣使い・守護']]],
 barrier:[['結界師・技巧','結界師・剛力'],[['結界師・達人','結界師・神速'],['結界師・覇者','結界師・守護']]],
 curse:[['呪術師・技巧','呪術師・剛力'],[['呪術師・達人','呪術師・神速'],['呪術師・覇者','呪術師・守護']]],
 katana:[['刀使い・技巧','刀使い・剛力'],[['刀使い・達人','刀使い・神速'],['刀使い・覇者','刀使い・守護']]],
 reflect:[['反射騎士・技巧','反射騎士・剛力'],[['反射騎士・達人','反射騎士・神速'],['反射騎士・覇者','反射騎士・守護']]],
 bomber:[['爆弾兵・技巧','爆弾兵・剛力'],[['爆弾兵・達人','爆弾兵・神速'],['爆弾兵・覇者','爆弾兵・守護']]],
 gravity:[['重力術師・技巧','重力術師・剛力'],[['重力術師・達人','重力術師・神速'],['重力術師・覇者','重力術師・守護']]],
 machine:[['機械兵・技巧','機械兵・剛力'],[['機械兵・達人','機械兵・神速'],['機械兵・覇者','機械兵・守護']]],
 phantom:[['幻影師・技巧','幻影師・剛力'],[['幻影師・達人','幻影師・神速'],['幻影師・覇者','幻影師・守護']]],
 star:[['星術師・技巧','星術師・剛力'],[['星術師・達人','星術師・神速'],['星術師・覇者','星術師・守護']]],
 mimic:[['模倣者・技巧','模倣者・剛力'],[['模倣者・達人','模倣者・神速'],['模倣者・覇者','模倣者・守護']]],
 swordsaint:[['剣聖・技巧','剣聖・剛力'],[['剣聖・達人','剣聖・神速'],['剣聖・覇者','剣聖・守護']]],
 dragonking:[['竜王・技巧','竜王・剛力'],[['竜王・達人','竜王・神速'],['竜王・覇者','竜王・守護']]],
 underking:[['冥王・技巧','冥王・剛力'],[['冥王・達人','冥王・神速'],['冥王・覇者','冥王・守護']]],
 thundergod:[['雷神・技巧','雷神・剛力'],[['雷神・達人','雷神・神速'],['雷神・覇者','雷神・守護']]],
 dimensionking:[['次元王・技巧','次元王・剛力'],[['次元王・達人','次元王・神速'],['次元王・覇者','次元王・守護']]],
 sword:[['戦士','槍使い','戦斧使い'],[['大剣士','狂戦士'],['槍騎士','竜騎士'],['破壊者','処刑人']]],
 merc:[['双剣士','格闘家'],[['暗殺者','剣舞士'],['武闘家','拳聖']]],
 shield:[['重装兵','タンク'],[['鉄壁兵','守護騎士'],['聖騎士','要塞兵']]],
 archer:[['剛弓兵','速弓兵'],[['狙撃手','破甲射手'],['連射手','遊撃手']]],
 mage:[['炎術師','氷術師','雷術師'],[['爆炎術師','灼熱術師'],['氷結術師','吹雪術師'],['雷撃術師','雷帝術師']]]
};
function evolutionName(job,first=progress[job]?.evo1,second=progress[job]?.evo2){
 const tree=EVOLUTIONS[job];return second!=null&&first!=null?tree[1][first]?.[second]||CLASSES[job].name:first!=null?tree[0][first]||CLASSES[job].name:CLASSES[job].name;
}
function evolutionModifiers(job,first,second){
 const names=EVOLUTIONS[job];if(!names||first==null)return {hp:0,damage:0,speed:1,range:1,cooldown:1};
 const a=first,b=second??-1;
 const base=[
  {hp:12,damage:3,speed:.95,range:1,cooldown:1.08},
  {hp:-5,damage:1,speed:1.12,range:1.18,cooldown:.94},
  {hp:18,damage:4,speed:.90,range:1.08,cooldown:1.12}
 ][a]||{hp:0,damage:0,speed:1,range:1,cooldown:1};
 if(job==='shield')Object.assign(base,{hp:base.hp+20,damage:Math.max(0,base.damage-2),speed:base.speed*.96});
 if(job==='archer')Object.assign(base,{hp:base.hp-8,range:base.range*1.18});
 if(job==='mage')Object.assign(base,{hp:base.hp-6,damage:base.damage+2});
 if(job==='merc')Object.assign(base,{hp:base.hp-8,speed:base.speed*1.08,cooldown:base.cooldown*.92});
 if(b===0){base.hp+=22;base.damage+=3;base.speed*=.94;base.cooldown*=1.08}
 if(b===1){base.hp-=8;base.damage+=1;base.speed*=1.10;base.cooldown*=.90}
 return base;
}
function evolutionFor(job,level,first,second){
 const lv=Math.max(1,Math.min(MAX_PVP_LEVEL,Number(level)||1));
 return evolutionModifiers(job,lv>=50?first:null,lv>=100?second:null);
}
function renderEvolution(){
 const root=document.getElementById('pvpEvolution');if(!root)return;
 const p=progress[myClass],tree=EVOLUTIONS[myClass];
 root.replaceChildren();
 const title=document.createElement('div');title.textContent='進化：'+evolutionName(myClass)+'　（Lv.50 / Lv.100）';root.append(title);
 function buttons(stage,options){
  const row=document.createElement('div');row.className='evolution-options';
  options.forEach((name,index)=>{
   const btn=document.createElement('button');btn.type='button';btn.textContent=name;
   const chosen=stage===1?p.evo1:p.evo2;
   btn.className='secondary'+(chosen===index?' evo-selected':'');
   btn.disabled=stage===1?p.level<50||p.evo1!=null:p.level<100||p.evo1==null||p.evo2!=null;
   btn.onclick=()=>{
    if(stage===1){if(p.level<50||p.evo1!=null)return;p.evo1=index}
    else{if(p.level<100||p.evo1==null||p.evo2!=null)return;p.evo2=index}
    saveProgress();renderProgress();renderJobs();
   };
   row.append(btn);
  });root.append(row);
 }
 if(p.evo1==null)buttons(1,tree[0]);
 else if(p.evo2==null)buttons(2,tree[1][p.evo1]);
 else{const done=document.createElement('div');done.textContent='最終進化完了：'+evolutionName(myClass);root.append(done)}
}


// Eight starter jobs, unlockable jobs and five secret jobs.
const TRIAL_CODE='nexa13';
const TRIAL_DURATION_MS=24*60*60*1000;
let trialExpires=0;
function trialKey(){return 'nexacraft_pvp_trial_v1:'+encodeURIComponent(progressAccountKey||'local-player')}
function trialActive(){return trialExpires>Date.now()}
function loadTrial(){try{trialExpires=Math.max(0,Number(localStorage.getItem(trialKey()))||0)}catch{trialExpires=0}}
function redeemTrialCode(code){
 const notice=document.getElementById('pvpCodeNotice');
 if(code.trim()!==TRIAL_CODE){if(notice)notice.textContent='コードが違います';return}
 trialExpires=Date.now()+TRIAL_DURATION_MS;
 try{localStorage.setItem(trialKey(),String(trialExpires))}catch{}
 if(notice)notice.textContent='🔓 全ジョブを24時間使用できます';
 renderJobs();
}
const STARTER_JOBS=new Set(['sword','merc','shield','archer','mage','fighter','spear','alchemist']);
const SECRET_JOBS=new Set(['swordsaint','dragonking','underking','thundergod','dimensionking','extra_007','extra_015','extra_023','extra_047','extra_069','extra_072','extra_079']);
const JOB_ICONS={"extra_001":"🥷","extra_002":"🥷","extra_003":"🥷","extra_004":"🥷","extra_005":"🥷","extra_006":"🥷","extra_007":"🥷","extra_008":"🛡️","extra_009":"🛡️","extra_010":"🛡️","extra_011":"🛡️","extra_012":"🛡️","extra_013":"🛡️","extra_014":"🛡️","extra_015":"🛡️","extra_016":"🔮","extra_017":"🔮","extra_018":"🔮","extra_019":"🔮","extra_020":"🔮","extra_021":"🔮","extra_022":"🔮","extra_023":"🔮","extra_024":"🏹","extra_025":"🏹","extra_026":"🏹","extra_027":"🏹","extra_028":"🏹","extra_029":"🏹","extra_030":"🏹","extra_031":"🏹","extra_032":"💀","extra_033":"💀","extra_034":"💀","extra_035":"💀","extra_036":"💀","extra_037":"💀","extra_038":"💀","extra_039":"💀","extra_040":"🐉","extra_041":"🐉","extra_042":"🐉","extra_043":"🐉","extra_044":"🐉","extra_045":"🐉","extra_046":"🐉","extra_047":"🐉","extra_048":"⚔️","extra_049":"⚔️","extra_050":"⚔️","extra_051":"⚔️","extra_052":"⚔️","extra_053":"⚔️","extra_054":"⚔️","extra_055":"⚔️","extra_056":"⚙️","extra_057":"⚙️","extra_058":"⚙️","extra_059":"⚙️","extra_060":"⚙️","extra_061":"⚙️","extra_062":"⚙️","extra_063":"⚙️","extra_064":"🌌","extra_065":"🌌","extra_066":"🌌","extra_067":"🌌","extra_068":"🌌","extra_069":"🌌","extra_070":"🌌","extra_071":"🌌","extra_072":"🌌","extra_073":"🃏","extra_074":"🃏","extra_075":"🃏","extra_076":"🃏","extra_077":"🃏","extra_078":"🃏","extra_079":"🃏","fighter":"👊","spear":"🔱","alchemist":"⚗️","ninja":"🥷","reaper":"💀","gunner":"🔫","summoner":"🐉","time":"⏳","chain":"⛓️","hammer":"🔨","beast":"🐺","barrier":"🌀","curse":"👻","katana":"⚔️","reflect":"🛡️","bomber":"💣","gravity":"🌌","machine":"🤖","phantom":"👤","star":"🌠","mimic":"🃏","swordsaint":"👑","dragonking":"🐉","underking":"💀","thundergod":"⚡","dimensionking":"🌌"};
const UNLOCK_HINTS={"extra_001":"傭兵Lv.20 ＋ 累計5勝","extra_002":"傭兵Lv.35 ＋ 累計20勝","extra_003":"傭兵Lv.50 ＋ 累計35勝","extra_004":"傭兵Lv.65 ＋ 累計50勝","extra_005":"傭兵Lv.80 ＋ 累計65勝","extra_006":"傭兵Lv.95 ＋ 累計80勝","extra_008":"盾兵Lv.125 ＋ 累計5勝","extra_009":"盾兵Lv.140 ＋ 累計20勝","extra_010":"盾兵Lv.20 ＋ 累計35勝","extra_011":"盾兵Lv.35 ＋ 累計50勝","extra_012":"盾兵Lv.50 ＋ 累計65勝","extra_013":"盾兵Lv.65 ＋ 累計80勝","extra_014":"盾兵Lv.80 ＋ 累計95勝","extra_016":"魔術師Lv.110 ＋ 累計20勝","extra_017":"魔術師Lv.125 ＋ 累計35勝","extra_018":"魔術師Lv.140 ＋ 累計50勝","extra_019":"魔術師Lv.20 ＋ 累計65勝","extra_020":"魔術師Lv.35 ＋ 累計80勝","extra_021":"魔術師Lv.50 ＋ 累計95勝","extra_022":"魔術師Lv.65 ＋ 累計5勝","extra_024":"弓兵Lv.95 ＋ 累計35勝","extra_025":"弓兵Lv.110 ＋ 累計50勝","extra_026":"弓兵Lv.125 ＋ 累計65勝","extra_027":"弓兵Lv.140 ＋ 累計80勝","extra_028":"弓兵Lv.20 ＋ 累計95勝","extra_029":"弓兵Lv.35 ＋ 累計5勝","extra_030":"弓兵Lv.50 ＋ 累計20勝","extra_031":"弓兵Lv.65 ＋ 累計35勝","extra_032":"魔術師Lv.80 ＋ 累計50勝","extra_033":"魔術師Lv.95 ＋ 累計65勝","extra_034":"魔術師Lv.110 ＋ 累計80勝","extra_035":"魔術師Lv.125 ＋ 累計95勝","extra_036":"魔術師Lv.140 ＋ 累計5勝","extra_037":"魔術師Lv.20 ＋ 累計20勝","extra_038":"魔術師Lv.35 ＋ 累計35勝","extra_039":"魔術師Lv.50 ＋ 累計50勝","extra_040":"召喚士Lv.65 ＋ 累計65勝","extra_041":"召喚士Lv.80 ＋ 累計80勝","extra_042":"召喚士Lv.95 ＋ 累計95勝","extra_043":"召喚士Lv.110 ＋ 累計5勝","extra_044":"召喚士Lv.125 ＋ 累計20勝","extra_045":"召喚士Lv.140 ＋ 累計35勝","extra_046":"召喚士Lv.20 ＋ 累計50勝","extra_048":"剣士Lv.50 ＋ 累計80勝","extra_049":"剣士Lv.65 ＋ 累計95勝","extra_050":"剣士Lv.80 ＋ 累計5勝","extra_051":"剣士Lv.95 ＋ 累計20勝","extra_052":"剣士Lv.110 ＋ 累計35勝","extra_053":"剣士Lv.125 ＋ 累計50勝","extra_054":"剣士Lv.140 ＋ 累計65勝","extra_055":"剣士Lv.20 ＋ 累計80勝","extra_056":"銃士Lv.35 ＋ 累計95勝","extra_057":"銃士Lv.50 ＋ 累計5勝","extra_058":"銃士Lv.65 ＋ 累計20勝","extra_059":"銃士Lv.80 ＋ 累計35勝","extra_060":"銃士Lv.95 ＋ 累計50勝","extra_061":"銃士Lv.110 ＋ 累計65勝","extra_062":"銃士Lv.125 ＋ 累計80勝","extra_063":"銃士Lv.140 ＋ 累計95勝","extra_064":"魔術師Lv.20 ＋ 累計5勝","extra_065":"魔術師Lv.35 ＋ 累計20勝","extra_066":"魔術師Lv.50 ＋ 累計35勝","extra_067":"魔術師Lv.65 ＋ 累計50勝","extra_068":"魔術師Lv.80 ＋ 累計65勝","extra_070":"魔術師Lv.110 ＋ 累計95勝","extra_071":"魔術師Lv.125 ＋ 累計5勝","extra_073":"錬金術師Lv.20 ＋ 累計35勝","extra_074":"錬金術師Lv.35 ＋ 累計50勝","extra_075":"錬金術師Lv.50 ＋ 累計65勝","extra_076":"錬金術師Lv.65 ＋ 累計80勝","extra_077":"錬金術師Lv.80 ＋ 累計95勝","extra_078":"錬金術師Lv.95 ＋ 累計5勝","ninja":"傭兵Lv.30 ＋ 累計20勝","reaper":"剣士Lv.100 ＋ 累計100勝","gunner":"弓兵Lv.25","summoner":"魔術師Lv.50 ＋ 累計30勝","time":"魔術師Lv.150 ＋ 累計200勝","chain":"傭兵Lv.40","hammer":"盾兵Lv.35","beast":"弓兵Lv.50 ＋ 累計40勝","barrier":"盾兵Lv.75 ＋ 魔術師Lv.50","curse":"魔術師Lv.60","katana":"剣士Lv.40","reflect":"盾兵Lv.100","bomber":"銃士Lv.50","gravity":"魔術師Lv.100","machine":"銃士Lv.75","phantom":"忍者Lv.100","star":"魔術師Lv.125","mimic":"基本5職すべてLv.100"};
const EXTRA_UNLOCK_RULES={"extra_001":["merc",20,5],"extra_002":["merc",35,20],"extra_003":["merc",50,35],"extra_004":["merc",65,50],"extra_005":["merc",80,65],"extra_006":["merc",95,80],"extra_007":["merc",110,95],"extra_008":["shield",125,5],"extra_009":["shield",140,20],"extra_010":["shield",20,35],"extra_011":["shield",35,50],"extra_012":["shield",50,65],"extra_013":["shield",65,80],"extra_014":["shield",80,95],"extra_015":["shield",95,5],"extra_016":["mage",110,20],"extra_017":["mage",125,35],"extra_018":["mage",140,50],"extra_019":["mage",20,65],"extra_020":["mage",35,80],"extra_021":["mage",50,95],"extra_022":["mage",65,5],"extra_023":["mage",80,20],"extra_024":["archer",95,35],"extra_025":["archer",110,50],"extra_026":["archer",125,65],"extra_027":["archer",140,80],"extra_028":["archer",20,95],"extra_029":["archer",35,5],"extra_030":["archer",50,20],"extra_031":["archer",65,35],"extra_032":["mage",80,50],"extra_033":["mage",95,65],"extra_034":["mage",110,80],"extra_035":["mage",125,95],"extra_036":["mage",140,5],"extra_037":["mage",20,20],"extra_038":["mage",35,35],"extra_039":["mage",50,50],"extra_040":["summoner",65,65],"extra_041":["summoner",80,80],"extra_042":["summoner",95,95],"extra_043":["summoner",110,5],"extra_044":["summoner",125,20],"extra_045":["summoner",140,35],"extra_046":["summoner",20,50],"extra_047":["summoner",35,65],"extra_048":["sword",50,80],"extra_049":["sword",65,95],"extra_050":["sword",80,5],"extra_051":["sword",95,20],"extra_052":["sword",110,35],"extra_053":["sword",125,50],"extra_054":["sword",140,65],"extra_055":["sword",20,80],"extra_056":["gunner",35,95],"extra_057":["gunner",50,5],"extra_058":["gunner",65,20],"extra_059":["gunner",80,35],"extra_060":["gunner",95,50],"extra_061":["gunner",110,65],"extra_062":["gunner",125,80],"extra_063":["gunner",140,95],"extra_064":["mage",20,5],"extra_065":["mage",35,20],"extra_066":["mage",50,35],"extra_067":["mage",65,50],"extra_068":["mage",80,65],"extra_069":["mage",95,80],"extra_070":["mage",110,95],"extra_071":["mage",125,5],"extra_072":["mage",140,20],"extra_073":["alchemist",20,35],"extra_074":["alchemist",35,50],"extra_075":["alchemist",50,65],"extra_076":["alchemist",65,80],"extra_077":["alchemist",80,95],"extra_078":["alchemist",95,5],"extra_079":["alchemist",110,20]};
function totalWins(){return Object.values(progress).reduce((sum,p)=>sum+(p?.wins||0),0)}
function unlocked(job){
 if(trialActive()||STARTER_JOBS.has(job))return true;
 if(EXTRA_UNLOCK_RULES[job]){const [base,level,wins]=EXTRA_UNLOCK_RULES[job];return (progress[base]?.level||1)>=level&&totalWins()>=wins;}
 const lv=j=>progress[j]?.level||1,w=totalWins();
 switch(job){
 case 'ninja':return lv('merc')>=30&&w>=20;
 case 'reaper':return lv('sword')>=100&&w>=100;
 case 'gunner':return lv('archer')>=25;
 case 'summoner':return lv('mage')>=50&&w>=30;
 case 'time':return lv('mage')>=150&&w>=200;
 case 'chain':return lv('merc')>=40;
 case 'hammer':return lv('shield')>=35;
 case 'beast':return lv('archer')>=50&&w>=40;
 case 'barrier':return lv('shield')>=75&&lv('mage')>=50;
 case 'curse':return lv('mage')>=60;
 case 'katana':return lv('sword')>=40;
 case 'reflect':return lv('shield')>=100;
 case 'bomber':return lv('gunner')>=50;
 case 'gravity':return lv('mage')>=100;
 case 'machine':return lv('gunner')>=75;
 case 'phantom':return lv('ninja')>=100;
 case 'star':return lv('mage')>=125;
 case 'mimic':return ['sword','merc','shield','archer','mage'].every(j=>lv(j)>=100);
 case 'swordsaint':return lv('sword')>=250&&w>=300;
 case 'dragonking':return lv('summoner')>=250&&w>=500;
 case 'underking':return lv('reaper')>=250&&w>=500;
 case 'thundergod':return lv('mage')>=250&&progress.mage?.evo1===2&&progress.mage?.evo2===1&&w>=300;
 case 'dimensionking':return lv('time')>=250&&w>=1000;
 default:return false;
 }
}
function renderJobs(){
 const root=document.getElementById('jobs');if(!root)return;
 root.replaceChildren();
 const labels=[['基本ジョブ',Object.keys(CLASSES).filter(j=>STARTER_JOBS.has(j))],['解放ジョブ',Object.keys(CLASSES).filter(j=>!STARTER_JOBS.has(j)&&!SECRET_JOBS.has(j))],['隠しジョブ',Object.keys(CLASSES).filter(j=>SECRET_JOBS.has(j))]];
 for(const [label,jobs] of labels){
  const heading=document.createElement('h3');heading.className='job-group-title';heading.textContent=label;root.append(heading);
  for(const job of jobs){
   const ok=unlocked(job),secret=SECRET_JOBS.has(job),button=document.createElement('button');
   button.type='button';button.dataset.job=job;button.className='job'+(myClass===job?' selected':'')+(ok?'':' job-locked')+(secret&&!ok?' job-secret':'');
   const icon=document.createElement('span');icon.textContent=secret&&!ok?'❔':ok?(JOB_ICONS[job]||({sword:'⚔️',merc:'🗡️',shield:'🛡️',archer:'🏹',mage:'🔮'}[job])):'🔒';
   const name=document.createElement('strong');name.textContent=secret&&!ok?'？？？':CLASSES[job].name;
   button.append(icon,name);
   if(!ok){
    const hint=document.createElement('small');hint.className='job-unlock-hint';
    hint.textContent=secret?'条件：？？？':UNLOCK_HINTS[job]||'条件未達成';button.append(hint);
    button.title=secret?'隠しジョブ：条件は秘密':hint.textContent;
   }
   root.append(button);
  }
 }
}

// PvP progression: independent XP per job, levels 1–250.
// Victories against both players and CPU award 100 XP.
const MAX_PVP_LEVEL=250,WIN_XP=100;
const xpToNext=level=>100+Math.floor((level-1)*20);
const freshProgress=()=>Object.fromEntries(Object.keys(CLASSES).map(job=>[job,{level:1,xp:0,wins:0}]));
let progress=freshProgress(),progressAccountKey='';
function progressKey(key){return 'nexacraft_pvp_levels_v1:'+encodeURIComponent(key)}
function loadProgress(){
 const identity=window.NEXACRAFT_PVP_ACCOUNT;
 const key=identity?.uid||identity?.key||'local-player';
 if(key===progressAccountKey)return;
 progressAccountKey=key;progress=freshProgress();loadTrial();
 if(key){try{
  const saved=JSON.parse(localStorage.getItem(progressKey(key))||'{}');
  for(const job of Object.keys(CLASSES)){
   const v=saved[job];if(!v)continue;
   progress[job]={level:THREE.MathUtils.clamp(Math.floor(Number(v.level)||1),1,MAX_PVP_LEVEL),
    xp:Math.max(0,Math.floor(Number(v.xp)||0)),wins:Math.max(0,Math.floor(Number(v.wins)||0)),evo1:Number.isInteger(v.evo1)&&v.evo1>=0&&v.evo1<EVOLUTIONS[job][0].length?v.evo1:null,evo2:null};
   if(progress[job].evo1!=null&&Number.isInteger(v.evo2)&&v.evo2>=0&&v.evo2<EVOLUTIONS[job][1][progress[job].evo1].length)progress[job].evo2=v.evo2;
   if(progress[job].level===MAX_PVP_LEVEL)progress[job].xp=0;
   else progress[job].xp=Math.min(progress[job].xp,xpToNext(progress[job].level)-1);
  }
 }catch(e){console.warn('PvP progression restore failed',e)}}
 renderProgress();renderJobs();
}
function saveProgress(){
 if(!progressAccountKey)return;
 try{localStorage.setItem(progressKey(progressAccountKey),JSON.stringify(progress))}
 catch(e){console.warn('PvP progression save failed',e)}
}
function jobLevel(job){return progress[job]?.level||1}
function fighterStats(job,level,first=progress[job]?.evo1,second=progress[job]?.evo2){
 const c=CLASSES[job]||CLASSES.sword;
 const lv=THREE.MathUtils.clamp(Math.floor(Number(level)||1),1,MAX_PVP_LEVEL);
 const e=evolutionFor(job,lv,first,second);
 return {hp:c.hp+2*(lv-1)+e.hp,damage:c.damage+Math.floor((lv-1)/5)+e.damage};
}
function awardWin(){
 if(!progressAccountKey)return '';
 const p=progress[myClass],before=p.level;
 p.wins++;p.xp+=WIN_XP;
 while(p.level<MAX_PVP_LEVEL&&p.xp>=xpToNext(p.level)){p.xp-=xpToNext(p.level);p.level++;}
 if(p.level===MAX_PVP_LEVEL)p.xp=0;
 saveProgress();renderProgress();renderJobs();
 return '  +'+WIN_XP+' EXP'+(p.level>before?'  LEVEL UP! Lv.'+p.level:'');
}
function renderProgress(){
 const p=progress[myClass],el=document.getElementById('pvpLevelInfo');
 if(!el||!p)return;
 el.textContent=CLASSES[myClass].name+' Lv.'+p.level+' / '+MAX_PVP_LEVEL+
  (p.level===MAX_PVP_LEVEL?'  MAX':'  EXP '+p.xp+'/'+xpToNext(p.level))+
  '  勝利 '+p.wins+'  /  '+evolutionName(myClass);
 renderEvolution();
}
window.addEventListener('nexacraft-pvp-account',loadProgress);

const PEER_URL='https://cdn.jsdelivr.net/npm/peerjs@1.5.5/+esm';
const PEER_PREFIX='nexacraft-pvp-arena-v1-';
const roundLength=180;
let myClass='sword',enemyClass='sword',role='',state='menu',roomCode='',peer=null,connection=null,peerLoader=null;
let enemyLevel=1,enemyEvo1=null,enemyEvo2=null;
let me=null,rival=null,myAvatar=null,enemyAvatar=null,roundEnd=0,remaining=roundLength,lastSync=0,lastClock=0;
let keys=new Set(),clock=new THREE.Clock(),effects=[],noticeTimeout=0;
// Analog mobile joystick: x = strafe (+right), y = backward (+down).
const joystick={x:0,y:0,pointerId:null};
const JUMP_SPEED=7.4,GRAVITY=19.5;
let lookPitch=0,walkMotion=0,walkPhase=0,lastHurtUntil=0,attackVisualAt=0,enemyAttackAt=-Infinity;
// CPU-only projectiles. PvP between human players keeps its existing rules.
let cpuProjectiles=[];
let entranceStart=0,entranceFightAnnounced=false;
const entranceDuration=6500;
const gateCloseDuration=1600; // The iron gates descend after the fighters enter.
const GATE_OPEN_HEIGHT=12;
const ENTRANCE_Z=64,ENTRANCE_END_Z=12;
const arenaGates=[];
let cpuAim={x:0,z:0,nextUpdate:0};
const touchLooks=new Map();
const clampPitch=v=>THREE.MathUtils.clamp(v,-1.28,1.28);
function rotateView(dx,dy,sensitivity=.0034){
 if(state!=='playing'||!me)return;
 // Camera faces sin(face),cos(face); moving the pointer right decreases face.
 me.face=(me.face-dx*sensitivity+Math.PI*4)%(Math.PI*2);
 lookPitch=clampPitch(lookPitch-dy*sensitivity);
}

const scene=new THREE.Scene();
scene.background=new THREE.Color(0x0d1d2d);
scene.fog=new THREE.FogExp2(0x0d1d2d,.020);
const camera=new THREE.PerspectiveCamera(73,1,.1,130);
camera.rotation.order='YXZ';
camera.position.set(0,15,19);
const renderer=new THREE.WebGLRenderer({antialias:false,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1));
renderer.shadowMap.enabled=false;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.outputColorSpace=THREE.SRGBColorSpace;
$('stage').append(renderer.domElement);
const firstPersonHand=makeFirstPersonHand(THREE,{
 scene,camera,drawItemIcon:()=>{},
 getHeld:()=>state==='playing'?{id:pvpWeapon(myClass),qty:1}:null,
 getOffhand:()=>null,
 isGuarding:()=>state==='playing'&&!!me?.guard,
 isVisible:()=>state==='playing',
 getMovement:()=>walkMotion,
 isMining:()=>false,
 isHurt:()=>performance.now()<lastHurtUntil
});
const avatarItems=makeAvatarHeldItems(THREE,()=>{});

const PLAY_RADIUS=48;
scene.background=new THREE.Color(0x7898af);
scene.fog=new THREE.FogExp2(0x7898af,.005);
camera.far=240;camera.updateProjectionMatrix();
const ambient=new THREE.HemisphereLight(0xc2d4e7,0x342a23,1.05);scene.add(ambient);
const sun=new THREE.DirectionalLight(0xffd09b,3.15);
sun.position.set(-35,60,35);sun.castShadow=true;sun.shadow.mapSize.set(512,512);
sun.shadow.camera.left=-75;sun.shadow.camera.right=75;sun.shadow.camera.top=75;sun.shadow.camera.bottom=-75;scene.add(sun);
const mat=(color,metalness=0,roughness=.92)=>new THREE.MeshStandardMaterial({color,metalness,roughness});
function block(w,h,d,color,x,y,z){
 const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat(color));m.position.set(x,y,z);
 m.castShadow=true;m.receiveShadow=true;scene.add(m);return m;
}
const sand=mat(0x967655),stone=mat(0x776554),dark=mat(0x40352f);
const ground=new THREE.Mesh(new THREE.CylinderGeometry(55,55,1,96),sand);
ground.position.y=-.52;ground.receiveShadow=true;scene.add(ground);
for(const radius of [8,24,39,48]){
 const ring=new THREE.Mesh(new THREE.RingGeometry(radius,radius+.24,96),dark);
 ring.rotation.x=-Math.PI/2;ring.position.y=.02;scene.add(ring);
}
// Multi-level Roman-style arena: vaulted galleries, audience, royal box and stone paving.
const TAU=Math.PI*2,SECTIONS=48,archCount=24;
const limestone=mat(0x8d7865),mortar=mat(0x41362f),lightStone=mat(0xb09a80);
const bronze=mat(0xc49b50,.35),cloth=mat(0x9d2535),shade=mat(0x392c2a);
function polar(radius,angle,y=0){return [Math.sin(angle)*radius,y,Math.cos(angle)*radius]}
function radialBlock(w,h,d,material,radius,angle,y){
 const [x,yy,z]=polar(radius,angle,y);
 const obj=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);
 obj.position.set(x,yy,z);obj.rotation.y=angle;
 obj.castShadow=false;obj.receiveShadow=false;scene.add(obj);return obj;
}
function arcStrip(radius,y,thickness,material){
 const m=new THREE.Mesh(new THREE.TorusGeometry(radius,thickness,6,96),material);
 m.rotation.x=Math.PI/2;m.position.y=y;scene.add(m);return m;
}
// Large individually laid flagstones, dark joints and central circular motif.
const paving=mat(0x8e745d),pavingAlt=mat(0xb69a79);
for(let r=5;r<49;r+=4.5){
 const count=Math.max(12,Math.floor(r*.7));
 for(let i=0;i<count;i++){
  const angle=(i+(Math.floor(r)%2)*.5)*TAU/count;
  const width=Math.min(3.9,r*TAU/count*.83);
  const tile=radialBlock(width,.055,3.7,i%3===0?pavingAlt:paving,r,angle,-.012);
  tile.castShadow=false;
 }
}
for(const radius of [8,24,39,48])arcStrip(radius,.065,.13,mortar);
const medallion=new THREE.Mesh(new THREE.RingGeometry(3.1,3.7,32),bronze);
medallion.rotation.x=-Math.PI/2;medallion.position.y=.09;scene.add(medallion);
// The seating is made of stepped horizontal rings, with stairs between sections.
const seatMats=[limestone,lightStone,mat(0x77614e)];
// Preserve two full-width entrance corridors centred on +/-Z.
// Previously every tier was an unbroken solid cylinder: fighters walked
// THROUGH its walls between the rear tunnel and the battle floor.
const GATE_CLEAR_HALF_ANGLE=.17;
const seatArcs=[
 [GATE_CLEAR_HALF_ANGLE,Math.PI-2*GATE_CLEAR_HALF_ANGLE],
 [Math.PI+GATE_CLEAR_HALF_ANGLE,Math.PI-2*GATE_CLEAR_HALF_ANGLE]
];
function insideEntranceLane(angle){
 const t=((angle%TAU)+TAU)%TAU;
 return Math.min(t,Math.abs(t-Math.PI),TAU-t)<GATE_CLEAR_HALF_ANGLE;
}
for(let tier=0;tier<8;tier++){
 const inner=55.3+tier*2.9,outer=inner+2.87,height=.75+tier*1.75;
 for(const [start,arcLength] of seatArcs){
  const seat=new THREE.Mesh(
   // Horizontal rings use X=cos(theta),Z=-sin(theta), unlike CylinderGeometry.
   // Rotate their missing wedge by 90 degrees to line up with the +/-Z gates.
   new THREE.RingGeometry(inner,outer,48,1,start+Math.PI/2,arcLength),seatMats[tier%3]);
  seat.rotation.x=-Math.PI/2;seat.position.y=height;seat.receiveShadow=true;scene.add(seat);
  const rise=new THREE.Mesh(
   new THREE.CylinderGeometry(outer,outer,1.75,48,1,true,start,arcLength),mortar);
  rise.material.side=THREE.DoubleSide;
  rise.position.y=height-.875;scene.add(rise);
 }
 for(let i=0;i<archCount;i++){
  const angle=i*TAU/archCount;
  if(insideEntranceLane(angle))continue;
  radialBlock(.28,.14,2.7,mortar,inner+1.4,angle,height+.09);
 }
}
// Solid masonry foundations under the seating: no more sky visible below the terraces.
const foundationMaterial=mat(0x796654);
const foundation=new THREE.Mesh(new THREE.CylinderGeometry(78.9,78.9,13.8,96,1,true),foundationMaterial);
foundation.position.y=6.9;foundation.material.side=THREE.DoubleSide;foundation.receiveShadow=true;scene.add(foundation);
// Vertical stone courses support the uppermost seats without covering the battle floor.
for(let tier=0;tier<8;tier+=2){
 const radius=56.75+tier*2.9,level=.75+tier*1.75;
 for(let i=0;i<archCount;i++){
  const a=(i+.5)*TAU/archCount;
  if(insideEntranceLane(a))continue;
  radialBlock(1.15,Math.max(.6,level),.7,limestone,radius,a,level*.5);
 }
}
// Two arcaded levels. Each bay has a real arched opening, not just columns and a straight beam.
const arcadeRadius=82,archSpan=TAU/archCount;
function addArcadeLevel(baseY,height){
 const beamY=baseY+height;
 // Three radial layers give every arcade a real walkable-looking depth.
 for(let i=0;i<archCount;i++){
  const angle=i*archSpan,mid=angle+archSpan*.5;
  for(const radius of [arcadeRadius-4.8,arcadeRadius+4.8]){
   radialBlock(4.7,height,5.2,limestone,radius,angle,baseY+height*.5);
   radialBlock(5.6,1.5,5.8,mortar,radius,angle,baseY+.75);
   radialBlock(5.7,1.7,5.9,lightStone,radius,angle,beamY-.85);
   const span=radius*archSpan;
   const archWidth=Math.max(2.4,span-4.7);
   const archRadius=archWidth*.5;
   for(let k=0;k<=7;k++){
    const t=Math.PI*k/7,offset=Math.cos(t)*archRadius,rise=Math.sin(t)*archRadius*.6;
    const segment=radialBlock(archWidth/7+.65,2.2,5.3,k%2?limestone:lightStone,
      radius,mid+offset/radius,beamY-3.6+rise);
    segment.rotation.z=-Math.cos(t)*.65;
   }
  }
  // Thick radial cross-walls visually connect the front and rear arch rings.
  radialBlock(4.8,2.1,14.8,mortar,arcadeRadius,angle,beamY-1.1);
  radialBlock(4.8,1.5,14.8,limestone,arcadeRadius,angle,baseY+.75);
 }
 for(const radius of [arcadeRadius-5.4,arcadeRadius+5.4]){
  arcStrip(radius,beamY,.75,mortar);
 }
}
addArcadeLevel(14,10);
addArcadeLevel(26,9);
for(let i=0;i<archCount;i++){
 const angle=i*archSpan;
 radialBlock(5.5,3.3,14.2,limestone,arcadeRadius,angle,37);
 if(i%4===0){
  const banner=radialBlock(3.5,7,.2,cloth,arcadeRadius-2,angle,28.2);
  const crest=radialBlock(1,1.5,.24,bronze,arcadeRadius-1.85,angle,29.1);
  const fringe=radialBlock(3.5,.35,.24,bronze,arcadeRadius-1.8,angle,24.7);
 }
 if(i%2===0){
  const x=Math.sin(angle)*arcadeRadius,z=Math.cos(angle)*arcadeRadius;
  const bowl=new THREE.Mesh(new THREE.CylinderGeometry(1.15,.7,.65,8),mortar);
  bowl.position.set(x,39,z);scene.add(bowl);
  const fire=new THREE.Mesh(new THREE.ConeGeometry(.85,2.5,7),new THREE.MeshBasicMaterial({color:0xff982c}));
  fire.position.set(x,40.5,z);scene.add(fire);
 }
}
// Continuous rear galleries and walkways give the arcade a real enclosed depth.
for(const [radius,y] of [[76.2,14.05],[87.8,14.05],[76.2,26.05],[87.8,26.05]]){
 const gallery=new THREE.Mesh(new THREE.RingGeometry(radius-1.6,radius+1.6,96),lightStone);
 gallery.rotation.x=-Math.PI/2;gallery.position.y=y;gallery.receiveShadow=true;scene.add(gallery);
}
for(let i=0;i<archCount;i++){
 const angle=(i+.5)*archSpan;
 // Recessed back-wall piers create shadows while preserving the open arch silhouette.
 for(const level of [14,26]){
  radialBlock(5.5,5,1.3,mortar,arcadeRadius+7.4,angle,level+3.1);
  radialBlock(5.8,1.1,1.5,lightStone,arcadeRadius+7.4,angle,level+6.2);
 }
}
// Brighten the spectator bowl independently from the shaded arch interiors.
const bowlFill=new THREE.DirectionalLight(0xffe1b6,1.3);
bowlFill.position.set(25,32,-22);scene.add(bowlFill);
// Crimson fabric canopies hung between high parapet posts.
for(let i=0;i<archCount;i+=4){
 const angle=(i+2)*archSpan;
 const canopy=radialBlock(arcadeRadius*archSpan*3.4,.22,7,cloth,arcadeRadius-1.2,angle,37.8);
 canopy.rotation.z=.035;
}
// Spectator silhouettes grouped into merged geometry for mobile performance.
const crowdGeometry=new THREE.BoxGeometry(.55,1.05,.55);
const crowdMaterial=mat(0x28221f);
const audience=new THREE.InstancedMesh(crowdGeometry,crowdMaterial,1100);
const dummy=new THREE.Object3D();
for(let i=0;i<1100;i++){
 const tier=i%8,seatAngle=((i*37)%1100)/1100*TAU;
 const radius=56.6+tier*2.9;
 dummy.position.set(Math.sin(seatAngle)*radius,1.35+tier*1.75,Math.cos(seatAngle)*radius);
 dummy.rotation.y=seatAngle;
 dummy.scale.setScalar(insideEntranceLane(seatAngle)?0:.75+(i%5)*.08);
 dummy.updateMatrix();
 audience.setMatrixAt(i,dummy.matrix);
}
audience.instanceMatrix.needsUpdate=true;audience.castShadow=false;scene.add(audience);
// Real staggered masonry courses: each joint belongs to a laid paving stone.
const jointMat=mat(0x66503e);
const jointGeom=new THREE.BoxGeometry(1,.012,.045);
const jointCount=1600;
const pavingJoints=new THREE.InstancedMesh(jointGeom,jointMat,jointCount);
const jointDummy=new THREE.Object3D();
let jointIndex=0;
for(let row=-23;row<=23&&jointIndex<jointCount;row++){
 const z=row*2.05;
 for(let col=-23;col<=23&&jointIndex<jointCount;col++){
  const x=(col+(row%2)*.5)*2.4;
  if(x*x+z*z>47*47)continue;
  jointDummy.position.set(x,.087,z);jointDummy.rotation.set(0,0,0);
  jointDummy.scale.set(2.15,1,1);jointDummy.updateMatrix();
  pavingJoints.setMatrixAt(jointIndex++,jointDummy.matrix);
 }
}
pavingJoints.count=jointIndex;pavingJoints.instanceMatrix.needsUpdate=true;scene.add(pavingJoints);
// Colour variation and stone courses on the spectator terraces.
const spectatorStone=mat(0xb49a7e);
for(let tier=0;tier<8;tier+=2){
 const radius=56.9+tier*2.9;
 for(let i=0;i<archCount;i++){
  const a=(i+.5)*archSpan;
  if(insideEntranceLane(a))continue;
  radialBlock(2.6,.28,.7,spectatorStone,radius,a,1.03+tier*1.75);
 }
}
// Simple recognizable heads above the dark spectator torsos.
const headGeometry=new THREE.BoxGeometry(.52,.52,.52);
const headMaterial=mat(0xc6a080);
const heads=new THREE.InstancedMesh(headGeometry,headMaterial,650);
const headDummy=new THREE.Object3D();
for(let i=0;i<650;i++){
 const tier=i%8,angle=((i*37)%653)/653*TAU,radius=56.6+tier*2.9;
 headDummy.position.set(Math.sin(angle)*radius,2.15+tier*1.75,Math.cos(angle)*radius);
 headDummy.rotation.y=angle;
 headDummy.scale.setScalar(insideEntranceLane(angle)?0:.78+(i%4)*.08);
 headDummy.updateMatrix();
 heads.setMatrixAt(i,headDummy.matrix);
}
heads.instanceMatrix.needsUpdate=true;scene.add(heads);
// Coloured crowd silhouettes, kept in two instanced batches for tablet performance.
for(const [tone,shift] of [[0x8e3c32,0],[0xb49a6e,1]]){
 const people=new THREE.InstancedMesh(new THREE.BoxGeometry(.62,1.25,.55),mat(tone),420);
 const person=new THREE.Object3D();
 for(let i=0;i<420;i++){
  const tier=(i*3+shift)%8,angle=((i*71+shift*19)%421)/421*TAU;
  const rad=56.6+tier*2.9;
  person.position.set(Math.sin(angle)*rad,1.48+tier*1.75,Math.cos(angle)*rad);
  person.rotation.y=angle;
  person.scale.setScalar(insideEntranceLane(angle)?0:.8+(i%4)*.07);
  person.updateMatrix();
  people.setMatrixAt(i,person.matrix);
 }
 people.instanceMatrix.needsUpdate=true;scene.add(people);
}
// Stone keystones, banner hems and flame glows make the upper arcade less bare.
const keystone=mat(0xc5ad91);
for(let i=0;i<archCount;i++){
 const angle=(i+.5)*archSpan;
 for(const y of [22.8,33.8])radialBlock(1.5,1.25,6.2,keystone,arcadeRadius-5,angle,y);
 if(i%4===0){
  radialBlock(4.2,.3,.35,bronze,arcadeRadius-2.1,i*archSpan,24.6);
  const p=polar(arcadeRadius,i*archSpan,39.8);
  const glow=new THREE.PointLight(0xffa247,1.1,13,2);glow.position.set(...p);scene.add(glow);
 }
}
// Monumental gate integrated into the seating wall, with a stone arch rather than a box.
for(const sign of [-1,1]){
 const z=sign*55.2;
 const movingGate=new THREE.Group();scene.add(movingGate);arenaGates.push(movingGate);
 const gateStone=mat(0xa58d73),gateDark=mat(0x4a4039);
 for(const x of [-8.2,8.2]){
  block(4.1,12.5,6.5,0x8c7761,x,6.25,z);
  block(5.4,1.4,7.4,0xb7a38c,x,12.6,z);
 }
 const archRadius=7.3;
 for(let i=0;i<=18;i++){
  const t=Math.PI*i/18;
  const x=Math.cos(t)*archRadius;
  const y=12.6+Math.sin(t)*5.4;
  const stone=new THREE.Mesh(new THREE.BoxGeometry(1.55,2.1,6.8),i%2?gateStone:lightStone);
  stone.position.set(x,y,z);stone.rotation.z=-Math.cos(t)*.7;stone.castShadow=true;scene.add(stone);
 }
 block(20,2.1,7.4,0x9e8870,0,18.8,z);
 block(21,1,8,0x5e4d3f,0,20.3,z);
 // Deep iron gate set back under the arched opening.
 // Raised portcullis is animated when fighters enter the arena.
 const gatePanel=new THREE.Mesh(new THREE.BoxGeometry(14.1,1,.5),gateDark);
 gatePanel.position.set(0,10,z+sign*2.5);movingGate.add(gatePanel);
 for(let i=-6;i<=6;i++){
  const bar=new THREE.Mesh(new THREE.BoxGeometry(.19,10,.65),mortar);
  bar.position.set(i,5,z-sign*1.1);movingGate.add(bar);
 }
 for(const x of [-11.8,11.8]){
  block(3.2,1.5,3.3,0x746251,x,1,z-sign*2.4);
  block(2,6.2,2,0xb7a38c,x,4.8,z-sign*2.4);
 }
 const royal=block(17,1.2,9,0x8b735e,0,22,z+sign*1.2);
 for(const x of [-7,0,7])block(1.3,7,1.5,0xb7a38c,x,25,z+sign*1.2);
 block(20,1.5,10,0x685242,0,29,z+sign*1.2);
 const royalBanner=block(5.5,7,.2,0x9d2535,0,24,z-sign*4.2);
 // Empty grey-stone entrance passage: no decorative posts, flames or protrusions.
 // Keep only the level floor, flat enclosing walls and roof.
 const tunnelCenter=sign*63.2;
 block(17,.55,19,0x888d92,0,-.28,tunnelCenter); // grey stone floor
 for(const x of [-8.2,8.2]){
  block(2.6,11.8,19,0x737981,x,5.9,tunnelCenter); // smooth grey side wall
 }
 block(17,1.4,19,0x666e76,0,12.4,tunnelCenter); // plain grey ceiling
 // Neutral fill keeps the grey interior readable without adding objects.
 const entryLight=new THREE.PointLight(0xe1ebff,1.8,25,2);
 entryLight.position.set(0,6,sign*58.5);scene.add(entryLight);
}
// Fighters spawn INSIDE the passages, behind the iron gates at z ±55.2.
const spawning=[new THREE.Vector3(0,0,-ENTRANCE_Z),new THREE.Vector3(0,0,ENTRANCE_Z)];
function createAvatar(team,job){
  const cube=(parent,w,h,d,color,x=0,y=0,z=0)=>{
    const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),new THREE.MeshLambertMaterial({color}));
    mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;
  };
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
  avatarItems.sync(g,pvpWeapon(job),null);
  return g;
}
function replaceAvatars(){
 if(myAvatar){scene.remove(myAvatar);myAvatar=null;}
 if(enemyAvatar){avatarItems.dispose(enemyAvatar);scene.remove(enemyAvatar);}
 // In first person the user's own body must not obstruct the view.
 // The exact NEXACRAFT right-hand viewmodel is attached directly to camera.
 enemyAvatar=createAvatar('enemy',enemyClass);
 scene.add(enemyAvatar); // Previously missing: the rival model was never rendered.
 syncAvatars();
}
function makeFighter(job,x,z,level=1,first=null,second=null){
 const c=fighterStats(job,level,first,second);
 return {x,y:0,vy:0,grounded:true,z,face:x<0?Math.PI/2:-Math.PI/2,hp:c.hp,max:c.hp,damage:c.damage,guard:false,lastAttack:-100000};
}
let remoteVisualReady=false;
function syncAvatars(dt=1/60){
 if(!rival||!enemyAvatar)return;
 const targetX=rival.x,targetY=rival.y||0,targetZ=rival.z;
 const gap=Math.hypot(enemyAvatar.position.x-targetX,enemyAvatar.position.z-targetZ);
 // Remote packets arrive at ~14Hz. Smooth only the visual avatar; retain
 // authoritative network coordinates for combat and hit validation.
 const blend=!remoteVisualReady||gap>12?1:1-Math.exp(-dt*16);
 enemyAvatar.position.x+= (targetX-enemyAvatar.position.x)*blend;
 enemyAvatar.position.y+= (targetY-enemyAvatar.position.y)*blend;
 enemyAvatar.position.z+= (targetZ-enemyAvatar.position.z)*blend;
 const yaw=rival.face+Math.PI;
 enemyAvatar.rotation.y+=Math.atan2(Math.sin(yaw-enemyAvatar.rotation.y),Math.cos(yaw-enemyAvatar.rotation.y))*blend;
 remoteVisualReady=true;
}
function resize(){
 const w=innerWidth,h=innerHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();
}
addEventListener('resize',resize);resize();
function uiNotice(msg,err=false){
 $('notice').textContent=msg;$('notice').classList.toggle('error',err);
}
function flash(msg){
 $('status').textContent=msg;$('status').style.display='block';
 clearTimeout(noticeTimeout);noticeTimeout=setTimeout(()=>$('status').style.display='none',1700);
}
function updateRoomStatus(){
 $('roomCode').textContent=roomCode||'------';
 $('roomState').textContent=state==='hosting'?(connection?.open?'対戦相手が入室':'参加を待っています'):state==='joining'?'接続中':state==='lobby'?'2人接続済み':'ルーム未接続';
 $('startMatch').disabled=role!=='host'||!connection?.open||state!=='lobby';
 $('startMatch').textContent=role==='guest'?'ホストの開始を待つ':connection?.open?'対戦開始':'2人そろったら対戦開始';
 $('hostBtn').disabled=state!=='menu';
 $('joinCode').disabled=state!=='menu';
 $('practiceBtn').disabled=state!=='menu';
 for(const b of $('jobs').querySelectorAll('button'))b.disabled=state!=='menu';
}
function setClass(job){
 if(state!=='menu'||!CLASSES[job])return;
 if(!unlocked(job)){const hint=SECRET_JOBS.has(job)?'隠しジョブ：解放条件は？？？':UNLOCK_HINTS[job];const el=document.getElementById('pvpJobHint');if(el)el.textContent='🔒 '+(hint||'未解放');return;}
 myClass=job;renderProgress();renderJobs();const hint=document.getElementById('pvpJobHint');if(hint)hint.textContent='';
 for(const b of $('jobs').querySelectorAll('.job'))b.classList.toggle('selected',b.dataset.job===job);
}
$('jobs').addEventListener('click',e=>{const b=e.target.closest('[data-job]');if(b)setClass(b.dataset.job)});
function generatedCode(){
 const letters='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
 const bytes=new Uint8Array(6);crypto.getRandomValues(bytes);
 return Array.from(bytes,n=>letters[n%letters.length]).join('');
}
async function loadPeer(){if(!peerLoader)peerLoader=import(PEER_URL).then(m=>m.Peer||m.default?.Peer||m.default);return peerLoader}
function shutdown(sendLeave=true){
 if(sendLeave&&connection?.open)try{connection.send({t:'leave'})}catch{}
 try{connection?.close()}catch{}
 try{peer?.destroy()}catch{}
 connection=null;peer=null;roomCode='';role='';
}
function showMenu(message=''){
 clearCpuProjectiles();removeSummons();
 resetJoystick();
 if(document.pointerLockElement===renderer.domElement)document.exitPointerLock?.();
 state='menu';keys.clear();touchLooks.clear();shutdown(false);
 // Restore the entrance to its initial closed state in the menu.
 arenaGates.forEach(g=>g.position.y=0);
 $('screen').style.display='flex';$('finish').style.display='none';$('top').classList.remove('show');
 $('mobileControls').classList.remove('show');$('controlsHelp').classList.remove('show');
 $('leaveButton').style.display='none';$('lookHelp').classList.remove('show');$('crosshair').classList.remove('show');$('weaponHud').classList.remove('show');
 $('backHome').style.display='block';loadProgress();renderProgress();updateRoomStatus();
 if(message)uiNotice(message,true);
}
function connectWire(conn,isHost){
 connection=conn;
 conn.on('open',()=>{
  state=isHost?'hosting':'joining';
  conn.send({t:'hello',class:myClass,level:jobLevel(myClass),evo1:progress[myClass]?.evo1,evo2:progress[myClass]?.evo2,name:isHost?'HOST':'GUEST'});
  uiNotice(isHost?'対戦相手と接続しました。':'接続成功。ホストの開始を待っています。');
  updateRoomStatus();
 });
 conn.on('data',data=>receive(data));
 conn.on('close',()=>{if(state!=='menu')showMenu('相手が退出したため接続が終了しました。')});
 conn.on('error',err=>{if(state!=='menu')showMenu('通信エラー: '+(err.message||'不明'))});
}
$('hostBtn').addEventListener('click',async()=>{
 if(state!=='menu')return;
 state='hosting';role='host';roomCode=generatedCode();
 updateRoomStatus();uiNotice('対戦ルームを準備しています…');
 try{
  const Peer=await loadPeer();
  const p=new Peer(PEER_PREFIX+roomCode);peer=p;
  p.on('open',()=>{uiNotice('ルームコードを友達に教えてください。');updateRoomStatus()});
  p.on('connection',conn=>{
   if(connection&&connection.open){conn.on('open',()=>{conn.send({t:'reject'});conn.close()});return}
   connectWire(conn,true);
  });
  p.on('error',e=>{if(state!=='menu')showMenu('ルーム作成失敗: '+(e.message||'接続エラー'))});
 }catch(e){showMenu('接続を開始できません: '+e.message)}
});
$('joinForm').addEventListener('submit',async e=>{
 e.preventDefault();if(state!=='menu')return;
 const code=$('joinCode').value.trim().toUpperCase();
 if(!/^[A-Z0-9]{6}$/.test(code)){uiNotice('6文字のコードを入力してください。',true);return}
 role='guest';roomCode=code;state='joining';updateRoomStatus();uiNotice('ルームに接続しています…');
 try{
  const Peer=await loadPeer(),p=new Peer();peer=p;
  const timeout=setTimeout(()=>{if(state==='joining')showMenu('ルームが見つからないか、応答しません。')},14000);
  p.on('open',()=>{
   if(state!=='joining')return;
   const conn=p.connect(PEER_PREFIX+code,{reliable:true});
   connectWire(conn,false);
  });
  p.on('error',e=>{clearTimeout(timeout);if(state!=='menu')showMenu('参加に失敗しました: '+(e.message||'接続エラー'))});
 }catch(e){showMenu('通信の準備に失敗: '+e.message)}
});
function receive(data){
 if(!data||typeof data!=='object'||typeof data.t!=='string')return;
 if(data.t==='reject'){showMenu('このルームは満員です。');return}
 if(data.t==='leave'){showMenu('相手が退出しました。');return}
 if(data.t==='hello'&&CLASSES[data.class]){
  enemyClass=data.class;enemyLevel=THREE.MathUtils.clamp(Math.floor(Number(data.level)||1),1,MAX_PVP_LEVEL);enemyEvo1=Number.isInteger(data.evo1)?data.evo1:null;enemyEvo2=Number.isInteger(data.evo2)?data.evo2:null;
  state='lobby';updateRoomStatus();
  uiNotice('相手のジョブ: '+CLASSES[enemyClass].name+'。'+(role==='host'?'「対戦開始」を押してください。':'開始を待っています。'));
  if(role==='host'&&connection?.open)connection.send({t:'helloAck',class:myClass,level:jobLevel(myClass),evo1:progress[myClass]?.evo1,evo2:progress[myClass]?.evo2});
  return;
 }
 if(data.t==='helloAck'&&CLASSES[data.class]){
  enemyClass=data.class;enemyLevel=THREE.MathUtils.clamp(Math.floor(Number(data.level)||1),1,MAX_PVP_LEVEL);state='lobby';updateRoomStatus();uiNotice('準備完了。ホストの開始を待っています。');return;
 }
 if(data.t==='start'&&role==='guest'){beginMatch();return}
 if(data.t==='state'&&state==='playing'&&Number.isFinite(data.x)&&Number.isFinite(data.z)&&Number.isFinite(data.face)){
  // Position updates are cosmetic until verified by the host on attack.
  const remoteDistance=Math.hypot(data.x,data.z);
  const remoteScale=remoteDistance>PLAY_RADIUS?PLAY_RADIUS/remoteDistance:1;
  rival.x=data.x*remoteScale;
  rival.z=data.z*remoteScale;
  rival.face=data.face;
  rival.y=Number.isFinite(data.y)?THREE.MathUtils.clamp(data.y,0,2.6):0;
  rival.guard=!!data.guard;
  return;
 }
 if(data.t==='ability'&&role==='host'&&state==='playing'){
  if(data.class!==enemyClass||!Number.isFinite(data.seq))return;
  const now=performance.now();if(now-(rival.lastAbility||0)<ABILITY_COOLDOWN)return;
  rival.lastAbility=now;activateAbility(true);return;
 }
 if(data.t==='abilityFx'&&role==='guest'&&state==='playing'){flash('✨ 相手が能力を発動！');return;}
 if(data.t==='attack'&&role==='host'&&state==='playing'){
  if(data.class!==enemyClass||!Number.isFinite(data.seq))return;
  animateSwing(enemyAvatar);
  resolveAttack(false);
  return;
 }
 if(data.t==='swing'&&role==='guest'&&state==='playing'){animateSwing(enemyAvatar);return}
 if(data.t==='hit'&&role==='guest'&&state==='playing'){
  if(!Number.isFinite(data.hostHp)||!Number.isFinite(data.guestHp))return;
  rival.hp=THREE.MathUtils.clamp(data.hostHp,0,rival.max);
  me.hp=THREE.MathUtils.clamp(data.guestHp,0,me.max);
  if(data.attackFromHost){flash('攻撃を受けた！');lastHurtUntil=performance.now()+280;effectLine(rival,me,enemyClass)}
  else {flash('HIT!');effectLine(me,rival,myClass)}
  updateHud();return;
 }
 if(data.t==='time'&&role==='guest'&&state==='playing'&&Number.isFinite(data.remaining)){
  remaining=Math.max(0,data.remaining);updateHud();return;
 }
 if(data.t==='end'&&role==='guest'&&state==='playing'){
  // hostWinner is translated into the guest's perspective.
  finishMatch(data.winner==='guest'?'win':data.winner==='host'?'lose':'draw',false);return;
 }
}
$('startMatch').addEventListener('click',()=>{
 if(role!=='host'||state!=='lobby'||!connection?.open)return;
 connection.send({t:'start'});beginMatch();
});
$('practiceBtn').addEventListener('click',()=>{
 if(state!=='menu')return;
 role='cpu';enemyClass=['sword','merc','shield','archer','mage'][Math.floor(Math.random()*5)];
 beginMatch();
});
function beginMatch(){
 clearCpuProjectiles();removeSummons();
 resetJoystick();
 state='playing';abilityReadyAt=0;keys.clear();touchLooks.clear();lookPitch=0;walkMotion=0;walkPhase=0;
 entranceStart=performance.now();entranceFightAnnounced=false;
 arenaGates.forEach(g=>g.position.y=0);
 const onLeft=role!=='guest';
 const a=onLeft?spawning[0]:spawning[1],b=onLeft?spawning[1]:spawning[0];
 loadProgress();me=makeFighter(myClass,a.x,a.z,jobLevel(myClass),progress[myClass]?.evo1,progress[myClass]?.evo2);rival=makeFighter(enemyClass,b.x,b.z,role==='cpu'?1:enemyLevel,enemyEvo1,enemyEvo2);
 if(role==='cpu'){
  rival=makeFighter(enemyClass,b.x,b.z,1);
  // The ranged CPU must spend time drawing its bow or preparing a spell.
  if(enemyClass==='archer'||enemyClass==='mage')rival.lastAttack=performance.now();
 }
 cpuAim={x:me.x,z:me.z,nextUpdate:0};
 roundEnd=entranceStart+entranceDuration+roundLength*1000;remaining=roundLength;lastSync=0;
 replaceAvatars();
 $('screen').style.display='none';$('finish').style.display='none';
 $('top').classList.add('show');$('controlsHelp').classList.add('show');
 $('mobileControls').classList.add('show');$('leaveButton').style.display='block';
 $('lookHelp').classList.add('show');
 window.setTimeout(()=>$('lookHelp').classList.remove('show'),4400);
 $('crosshair').classList.add('show');
 $('weaponHud').classList.add('show');
 $('weaponName').textContent=CLASSES[myClass].name+' / '+(pvpWeaponKind(myClass)==='dual'?'双剣':pvpWeaponKind(myClass)==='bow'?'弓':pvpWeaponKind(myClass)==='staff'?'魔法の杖':pvpWeaponKind(myClass)==='shield'?'盾':pvpWeaponKind(myClass)==='spear'?'槍':'剣');
 updateHud();flash('門が開く… 出陣！');
}
function updateHud(){
 if(!me||!rival)return;
 $('myName').textContent='YOU / '+evolutionName(myClass)+' Lv.'+jobLevel(myClass);
 $('enemyName').textContent=(role==='cpu'?'CPU':'RIVAL')+' / '+(role==='cpu'?CLASSES[enemyClass].name:evolutionName(enemyClass,enemyEvo1,enemyEvo2))+' Lv.'+(role==='cpu'?1:enemyLevel);
 $('myHealth').textContent=Math.ceil(me.hp)+' / '+me.max;
 $('enemyHealth').textContent=Math.ceil(rival.hp)+' / '+rival.max;
 $('myBar').style.width=(100*me.hp/me.max)+'%';
 $('enemyBar').style.width=(100*rival.hp/rival.max)+'%';
 updateAbilityButton();
 const time=Math.max(0,Math.ceil(remaining));
 $('clock').textContent=String(Math.floor(time/60)).padStart(2,'0')+':'+String(time%60).padStart(2,'0');
}
function animateSwing(avatar){if(avatar)enemyAttackAt=performance.now()}
function effectLine(from,to,job){
 if(!from||!to)return;
 const a=new THREE.Vector3(from.x,1.55,from.z),b=new THREE.Vector3(to.x,1.45,to.z);
 const diff=b.clone().sub(a);
 const color=job==='mage'?0xc77fff:job==='archer'?0xfce3a4:0xffc98b;
 const mesh=new THREE.Mesh(new THREE.CylinderGeometry(job==='mage'?.13:.06,job==='mage'?.18:.045,diff.length(),8),
  new THREE.MeshBasicMaterial({color,transparent:true,opacity:.85}));
 mesh.position.copy(a).addScaledVector(diff,.5);
 mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),diff.normalize());
 scene.add(mesh);effects.push({mesh,life:.23});
}
function resolveAttack(attackerIsHost){
 if(performance.now()<entranceStart+entranceDuration)return;
 if(state!=='playing'||!me||!rival)return;
 if(!attackerIsHost)animateSwing(enemyAvatar);
 const attacker=attackerIsHost?me:rival,target=attackerIsHost?rival:me;
 const job=attackerIsHost?myClass:enemyClass,c=CLASSES[job];
 const now=performance.now();
 if(now-attacker.lastAttack<c.cooldown)return;
 attacker.lastAttack=now;
 if(attacker.guard)return;
 const dx=target.x-attacker.x,dz=target.z-attacker.z;
 const dist=Math.hypot(dx,dz);
 const facing=(Math.sin(attacker.face)*dx+Math.cos(attacker.face)*dz)/(dist||1);
 if(dist>c.range||facing<c.arc)return;
 const targetJob=attackerIsHost?enemyClass:myClass;
 const block=target.abilityGuardUntil>now?.72:target.guard?(CLASSES[targetJob].block||.42):0;
 const passive=pvpPassive(job);
 // 0 critical combo, 1 armor, 2 arcane burst, 3 precision, 4 lifesteal,
 // 5 regeneration, 6 knockback, 7 overload, 8 explosion, 9 adaptive.
 const hits=attacker.comboHits=(attacker.comboHits||0)+1;
 const charged=!!attacker.abilityCharged;attacker.abilityCharged=false;
 const bonus=passive===0&&hits%3===0 ? .65 :passive===2 ? .18 :passive===3&&dist>c.range*.65 ? .28 :passive===7&&hits%4===0 ? .6 :passive===8 ? .22 :passive===9 ? .12 :0;
 const dealt=Math.max(1,Math.round(attacker.damage*(1+bonus+(charged?.8:0))*(1-block)*(pvpPassive(targetJob)===1 ? .87 : 1)));
 target.hp=Math.max(0,target.hp-Math.max(1,Math.round(dealt*(target.abilityCurseUntil>now?1.2:1))));
 if(passive===4)attacker.hp=Math.min(attacker.max,attacker.hp+Math.max(1,Math.round(dealt*.12)));
 if(passive===5)attacker.hp=Math.min(attacker.max,attacker.hp+2);
 if(passive===6&&dist>0){target.x+=dx/dist*.42;target.z+=dz/dist*.42;}
 if(passive===8&&hits%3===0)target.hp=Math.max(0,target.hp-Math.max(1,Math.round(dealt*.18)));
 effectLine(attacker,target,job);
 if(!attackerIsHost){flash('攻撃を受けた！');lastHurtUntil=now+280;}
 else flash('HIT! -'+dealt);
 updateHud();
 if(role==='host'&&connection?.open)connection.send({t:'hit',hostHp:me.hp,guestHp:rival.hp,attackFromHost:attackerIsHost});
 if(me.hp<=0||rival.hp<=0)endByHealth();
}
function endByHealth(){
 if(me.hp===rival.hp)finishMatch('draw',true);
 else finishMatch(me.hp>rival.hp?'win':'lose',true);
}
function finishMatch(outcome,decidedLocally){
 if(state!=='playing')return;
 clearCpuProjectiles();
 resetJoystick();
 if(document.pointerLockElement===renderer.domElement)document.exitPointerLock?.();
 $('lookHelp').classList.remove('show');$('crosshair').classList.remove('show');$('weaponHud').classList.remove('show');
 state='ended';
 if(decidedLocally&&role==='host'&&connection?.open){
  connection.send({t:'end',winner:outcome==='win'?'host':outcome==='lose'?'guest':'draw'});
 }
 const win=outcome==='win',draw=outcome==='draw';
 $('resultTitle').textContent=draw?'DRAW':win?'VICTORY':'DEFEAT';
 $('resultTitle').style.color=win?'#8df5c9':draw?'#a9e5ef':'#ffb1a0';
 const xpNotice=win?awardWin():'';
 $('resultText').textContent=(draw?'引き分け！':win?'勝利！ 相手を倒した！':'敗北。次の試合でリベンジしよう。')+xpNotice;
 $('againBtn').disabled=role==='guest';
 $('againBtn').textContent=role==='guest'?'ホストの再戦を待つ':'もう一度対戦';
 $('finish').style.display='flex';$('controlsHelp').classList.remove('show');$('mobileControls').classList.remove('show');
 keys.clear();resetJoystick();
}
$('againBtn').addEventListener('click',()=>{
 if(role==='guest')return;
 if(role==='host'){
  if(!connection?.open)return showMenu('相手が退出しました。');
  connection.send({t:'start'});
 }
 if(role==='cpu')enemyClass=['sword','merc','shield','archer','mage'][Math.floor(Math.random()*5)];
 beginMatch();
});
$('menuBtn').addEventListener('click',()=>{shutdown();showMenu()});
$('leaveButton').addEventListener('click',()=>{shutdown();showMenu()});


// Explicit job-by-job ability mapping. No name-based runtime guessing.
const ACTIVE_ABILITY_OVERRIDES={"extra_001":["盗賊加速","dash"],"extra_002":["影武者加速","dash"],"extra_003":["疾風剣士加速","dash"],"extra_004":["曲芸師加速","dash"],"extra_005":["追跡者加速","dash"],"extra_006":["夜叉の一撃","blast"],"extra_007":["時渡り拘束","slow"],"extra_008":["鉄騎士防御","guard"],"extra_009":["重戦士防御","guard"],"extra_010":["不動兵防御","guard"],"extra_011":["岩石兵の一撃","blast"],"extra_012":["守護者防御","guard"],"extra_013":["鎧武者防御","guard"],"extra_014":["巨人兵の一撃","blast"],"extra_015":["不死兵の一撃","blast"],"extra_016":["水術師攻撃","blast"],"extra_017":["風術師加速","dash"],"extra_018":["土術師攻撃","blast"],"extra_019":["光術師攻撃","blast"],"extra_020":["闇術師攻撃","blast"],"extra_021":["毒術師呪縛","curse"],"extra_022":["時間術師拘束","slow"],"extra_023":["空間術師の一撃","blast"],"extra_024":["狙撃兵攻撃","blast"],"extra_025":["砲兵攻撃","blast"],"extra_026":["投槍兵攻撃","blast"],"extra_027":["クロスボウ兵の一撃","blast"],"extra_028":["投石兵の一撃","blast"],"extra_029":["連弩兵の一撃","blast"],"extra_030":["魔銃士攻撃","blast"],"extra_031":["狩人の一撃","blast"],"extra_032":["死霊術師吸収","drain"],"extra_033":["吸血鬼吸収","drain"],"extra_034":["人形使い召喚","summon"],"extra_035":["夢幻師の一撃","blast"],"extra_036":["封印師拘束","slow"],"extra_037":["魂狩り吸収","drain"],"extra_038":["魔剣士攻撃","blast"],"extra_039":["霊媒師回復","heal"],"extra_040":["竜使い召喚","summon"],"extra_041":["蟲使い召喚","summon"],"extra_042":["鳥使い召喚","summon"],"extra_043":["魔物使い召喚","summon"],"extra_044":["精霊使い召喚","summon"],"extra_045":["傀儡師召喚","summon"],"extra_046":["植物使い召喚","summon"],"extra_047":["幻獣使い召喚","summon"],"extra_048":["鎌使い攻撃","blast"],"extra_049":["鞭使いの一撃","blast"],"extra_050":["鉄球使いの一撃","blast"],"extra_051":["棒術師の一撃","blast"],"extra_052":["戦斧使い攻撃","blast"],"extra_053":["三叉槍兵攻撃","blast"],"extra_054":["チャクラム使い召喚","summon"],"extra_055":["二刀流剣士攻撃","blast"],"extra_056":["工兵の一撃","blast"],"extra_057":["科学者の一撃","blast"],"extra_058":["蒸気騎士防御","guard"],"extra_059":["爆破技師攻撃","blast"],"extra_060":["人造人間の一撃","blast"],"extra_061":["電磁兵攻撃","blast"],"extra_062":["ドローン使い召喚","summon"],"extra_063":["機巧師の一撃","blast"],"extra_064":["月影騎士防御","guard"],"extra_065":["太陽騎士防御","guard"],"extra_066":["虚空使い攻撃","blast"],"extra_067":["天空兵の一撃","blast"],"extra_068":["混沌術師攻撃","blast"],"extra_069":["星喰い攻撃","blast"],"extra_070":["天使回復","heal"],"extra_071":["悪魔攻撃","blast"],"extra_072":["予言者の一撃","blast"],"extra_073":["道化師の一撃","blast"],"extra_074":["賭博師の一撃","blast"],"extra_075":["変身師の一撃","blast"],"extra_076":["音楽家の一撃","blast"],"extra_077":["踊り子加速","dash"],"extra_078":["料理人回復","heal"],"extra_079":["画家の一撃","blast"],"sword":["剣士攻撃","blast"],"merc":["傭兵の一撃","blast"],"shield":["盾兵防御","guard"],"archer":["弓兵攻撃","blast"],"mage":["魔術師攻撃","blast"],"fighter":["格闘家の一撃","blast"],"spear":["槍兵攻撃","blast"],"alchemist":["回復薬","heal"],"ninja":["影分身","summon"],"reaper":["死神吸収","drain"],"gunner":["銃士攻撃","blast"],"summoner":["召喚獣召喚","summon"],"time":["時間停止","slow"],"chain":["鎖使い拘束","slow"],"hammer":["ハンマー使い召喚","summon"],"beast":["獣使い召喚","summon"],"barrier":["結界","guard"],"curse":["呪い","curse"],"katana":["刀使い召喚","summon"],"reflect":["反射騎士防御","guard"],"bomber":["爆弾兵攻撃","blast"],"gravity":["重力術師拘束","slow"],"machine":["機械兵の一撃","blast"],"phantom":["幻影召喚","summon"],"star":["星術師攻撃","blast"],"mimic":["模倣者の一撃","blast"],"swordsaint":["剣気斬","blast"],"dragonking":["竜召喚","summon"],"underking":["冥王吸収","drain"],"thundergod":["雷神攻撃","blast"],"dimensionking":["次元斬","blast"]};
function jobAbility(job){return ACTIVE_ABILITY_OVERRIDES[job]||['通常攻撃','blast']}
const activeSummons=[];
function removeSummons(){
 for(const a of activeSummons){scene.remove(a.mesh);a.mesh.traverse(o=>{o.geometry?.dispose();if(o.material)o.material.dispose?.()})}
 activeSummons.length=0;
}
function spawnSummon(owner,job){
 const body=new THREE.Group();
 const color=/竜/.test(CLASSES[job].name)?0xff713d:/忍者|幻影/.test(CLASSES[job].name)?0x8471e9:0x67d9bc;
 const material=new THREE.MeshStandardMaterial({color,emissive:color,emissiveIntensity:.25});
 const torso=new THREE.Mesh(new THREE.BoxGeometry(.75,.65,.9),material);
 torso.position.y=.75;body.add(torso);
 const head=new THREE.Mesh(new THREE.BoxGeometry(.58,.48,.55),material);
 head.position.set(0,1.28,-.3);body.add(head);
 for(const side of [-1,1]){const leg=new THREE.Mesh(new THREE.BoxGeometry(.19,.52,.22),material);leg.position.set(side*.26,.26,side*.25);body.add(leg)}
 scene.add(body);
 activeSummons.push({mesh:body,owner,job,until:performance.now()+9000,lastHit:0});
}
function updateSummons(dt){
 const now=performance.now();
 for(let i=activeSummons.length-1;i>=0;i--){
  const a=activeSummons[i];
  if(now>a.until||state!=='playing'){scene.remove(a.mesh);a.mesh.traverse(o=>{o.geometry?.dispose();o.material?.dispose?.()});activeSummons.splice(i,1);continue}
  const actor=a.owner==='me'?me:rival,target=a.owner==='me'?rival:me;
  if(!actor||!target)continue;
  const dx=target.x-a.mesh.position.x,dz=target.z-a.mesh.position.z,d=Math.hypot(dx,dz)||1;
  if(a.mesh.position.lengthSq()<.01)a.mesh.position.set(actor.x+1,0,actor.z+1);
  if(d>1.7){a.mesh.position.x+=dx/d*dt*5;a.mesh.position.z+=dz/d*dt*5}
  a.mesh.rotation.y=Math.atan2(-dx,-dz);
  if(d<2.2&&now-a.lastHit>1300&&role!=='guest'){
   a.lastHit=now;
   target.hp=Math.max(0,target.hp-Math.max(2,Math.round(CLASSES[a.job].damage*.45)));
   effectLine({x:a.mesh.position.x,z:a.mesh.position.z},target,a.job);
   updateHud();
   if(role==='host'&&connection?.open)connection.send({t:'hit',hostHp:me.hp,guestHp:rival.hp,attackFromHost:a.owner==='me'});
   if(me.hp<=0||rival.hp<=0)endByHealth();
  }
 }
}

const ABILITY_COOLDOWN=14000;
let abilityReadyAt=0,abilityCharged=false;
const ABILITY_NAMES=['連撃','鉄壁','魔力解放','狙撃','吸収','再生','衝撃波','過負荷','爆裂','適応'];
function updateAbilityButton(){
 const btn=document.getElementById('abilityBtn'),desktop=document.getElementById('abilityDesktop');
 const remaining=Math.max(0,Math.ceil((abilityReadyAt-performance.now())/1000));
 const label='✨ '+jobAbility(myClass)[0]+(remaining?' '+remaining+'秒':'');
 for(const el of [btn,desktop])if(el){el.textContent=label;el.disabled=state!=='playing'||remaining>0;}
}
function activateAbility(remote=false){
 if(state!=='playing'||!me||!rival||performance.now()<entranceStart+entranceDuration)return;
 const now=performance.now();
 if(!remote&&now<abilityReadyAt)return;
 if(!remote){abilityReadyAt=now+ABILITY_COOLDOWN;updateAbilityButton();}
 const job=remote?enemyClass:myClass,actor=remote?rival:me,enemy=remote?me:rival;
 const [abilityName,abilityType]=jobAbility(job);
 if(abilityType==='summon')spawnSummon(remote?'rival':'me',job);
 else if(abilityType==='heal')actor.hp=Math.min(actor.max,actor.hp+Math.round(actor.max*.3));
 else if(abilityType==='guard'){actor.abilityGuardUntil=now+6500;actor.hp=Math.min(actor.max,actor.hp+Math.round(actor.max*.08));}
 else if(abilityType==='dash'){actor.abilitySpeedUntil=now+6500;actor.abilityCharged=true;}
 else if(abilityType==='slow'){enemy.abilitySlowUntil=now+4200;enemy.hp=Math.max(0,enemy.hp-Math.round(actor.damage*.35));}
 else if(abilityType==='drain'){const amount=Math.round(actor.damage*1.1);enemy.hp=Math.max(0,enemy.hp-amount);actor.hp=Math.min(actor.max,actor.hp+Math.round(amount*.65));effectLine(actor,enemy,job);}
 else if(abilityType==='curse'){enemy.abilityCurseUntil=now+7000;enemy.hp=Math.max(0,enemy.hp-Math.round(actor.damage*.6));}
 else if(abilityType==='blast'){
  const distance=Math.hypot(actor.x-enemy.x,actor.z-enemy.z);
  if(distance<=Math.max(8,CLASSES[job].range+2)){enemy.hp=Math.max(0,enemy.hp-Math.round(actor.damage*1.6));effectLine(actor,enemy,job);}
 }
 if(!remote&&role==='guest'&&connection?.open)connection.send({t:'ability',class:myClass,seq:Math.floor(now)});
 if(!remote&&role==='host'&&connection?.open)connection.send({t:'abilityFx'});
 if(role==='host'&&connection?.open)connection.send({t:'hit',hostHp:me.hp,guestHp:rival.hp,attackFromHost:!remote});
 flash('✨ '+abilityName+'！');updateHud();
 if(me.hp<=0||rival.hp<=0)endByHealth();
}

function requestAttack(){
 if(state!=='playing'||!me)return;
 const now=performance.now();
 if(now-me.lastAttack<CLASSES[myClass].cooldown)return;
 if(keys.has('KeyG'))return;
 // Unlike the top-down prototype, attacks follow actual first-person aim.
 const kind=pvpWeaponKind(myClass);
 firstPersonHand.swing(1,kind==='spear'?'thrust':'swing');
 attackVisualAt=now;
 if(role==='host'&&connection?.open)connection.send({t:'swing'});
 if(role==='host'||role==='cpu')resolveAttack(true);
 else {
  me.lastAttack=now;
  if(connection?.open)connection.send({t:'attack',class:myClass,seq:Math.floor(now)});
 }
}
document.getElementById('abilityDesktop')?.addEventListener('click',()=>activateAbility());
window.addEventListener('keydown',e=>{
 if(state!=='playing')return;
 if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();
 keys.add(e.code);
 if(e.code==='Space'&&!e.repeat)requestJump();
 if(e.code==='KeyF'&&!e.repeat)requestAttack();
 if(e.code==='KeyR'&&!e.repeat)activateAbility();
});
window.addEventListener('keyup',e=>keys.delete(e.code));
window.addEventListener('blur',()=>{keys.clear();resetJoystick();});
document.addEventListener('visibilitychange',()=>{if(document.hidden){keys.clear();resetJoystick();}});
function requestJump(){
 if(state!=='playing'||!me||!me.grounded)return;
 me.vy=JUMP_SPEED;
 me.grounded=false;
}
function advanceJump(dt){
 if(!me||me.grounded)return;
 me.y+=me.vy*dt-.5*GRAVITY*dt*dt;
 me.vy-=GRAVITY*dt;
 if(me.y<=0){me.y=0;me.vy=0;me.grounded=true;}
}
function resetJoystick(){
 joystick.x=0;joystick.y=0;joystick.pointerId=null;
 const thumb=$('stickThumb'),base=$('moveStick');
 if(thumb)thumb.style.transform='translate(-50%, -50%)';
 if(base)base.classList.remove('active');
}
const hitUi=e=>!!e.target.closest('button, input, .panel, #top, #mobileControls');
renderer.domElement.addEventListener('pointerdown',e=>{
 if(state!=='playing')return;
 if(e.pointerType==='touch'){
  touchLooks.set(e.pointerId,{x:e.clientX,y:e.clientY});renderer.domElement.setPointerCapture(e.pointerId);return;
 }
 if(e.button!==0)return;
 if(document.pointerLockElement!==renderer.domElement&&renderer.domElement.requestPointerLock){
  // First click captures the mouse; subsequent clicks swing the weapon.
  try{Promise.resolve(renderer.domElement.requestPointerLock()).catch(()=>{});}catch(e){console.warn(e)}
  return;
 }
 requestAttack();
});
renderer.domElement.addEventListener('pointermove',e=>{
 if(state!=='playing')return;
 if(e.pointerType==='touch'){
  const prev=touchLooks.get(e.pointerId);if(!prev)return;
  rotateView(e.clientX-prev.x,e.clientY-prev.y,.006);
  prev.x=e.clientX;prev.y=e.clientY;
 }else if(document.pointerLockElement===renderer.domElement||(e.buttons&1)){
  rotateView(e.movementX,e.movementY,.0031);
 }
});
renderer.domElement.addEventListener('pointerup',e=>touchLooks.delete(e.pointerId));
renderer.domElement.addEventListener('pointercancel',e=>touchLooks.delete(e.pointerId));
// Stable, multi-touch analog joystick. Capture only its own pointer, so the
// other thumb can aim and press attack/jump simultaneously.
const moveStick=$('moveStick'),stickThumb=$('stickThumb');
const JOYSTICK_DEADZONE=.10;
function updateJoystickPointer(e){
 const rect=moveStick.getBoundingClientRect();
 const radius=Math.max(1,Math.min(rect.width,rect.height)*.5-stickThumb.offsetWidth*.5-5);
 const dx=e.clientX-(rect.left+rect.width*.5);
 const dy=e.clientY-(rect.top+rect.height*.5);
 const length=Math.hypot(dx,dy);
 const capped=Math.min(length,radius);
 const activeMagnitude=length>0?Math.max(0,(capped/radius-JOYSTICK_DEADZONE)/(1-JOYSTICK_DEADZONE)):0;
 joystick.x=length>0?dx/length*activeMagnitude:0;
 joystick.y=length>0?dy/length*activeMagnitude:0;
 const thumbX=length>0?dx/length*capped:0,thumbY=length>0?dy/length*capped:0;
 stickThumb.style.transform='translate(-50%, -50%) translate('+thumbX+'px, '+thumbY+'px)';
}
moveStick.addEventListener('pointerdown',e=>{
 if(state!=='playing'||joystick.pointerId!==null)return;
 e.preventDefault();
 joystick.pointerId=e.pointerId;
 moveStick.classList.add('active');
 moveStick.setPointerCapture(e.pointerId);
 updateJoystickPointer(e);
});
moveStick.addEventListener('pointermove',e=>{
 if(joystick.pointerId!==e.pointerId)return;
 e.preventDefault();updateJoystickPointer(e);
});
function releaseJoystick(e){
 if(joystick.pointerId!==e.pointerId)return;
 e.preventDefault();resetJoystick();
}
for(const eventName of ['pointerup','pointercancel','lostpointercapture']){
 moveStick.addEventListener(eventName,releaseJoystick);
}
for(const b of document.querySelectorAll('#mobileControls button')){
 const key=b.dataset.key,action=b.dataset.action;
 const release=e=>{e.preventDefault();if(key)keys.delete(key)};
 b.addEventListener('pointerdown',e=>{
  if(state!=='playing')return;
  e.preventDefault();b.setPointerCapture(e.pointerId);
  if(key)keys.add(key);
  else if(action==='jump')requestJump();
  else if(action==='attack')requestAttack();
  else if(action==='ability')activateAbility();
 });
 b.addEventListener('pointerup',release);
 b.addEventListener('pointercancel',release);
 b.addEventListener('lostpointercapture',release);
}
function moveLocal(dt){
 if(performance.now()<entranceStart+entranceDuration)return;
 const keyX=(keys.has('KeyD')||keys.has('ArrowRight')?1:0)-(keys.has('KeyA')||keys.has('ArrowLeft')?1:0);
 const keyZ=(keys.has('KeyS')||keys.has('ArrowDown')?1:0)-(keys.has('KeyW')||keys.has('ArrowUp')?1:0);
 const x=keyX+joystick.x,z=keyZ+joystick.y;
 const len=Math.hypot(x,z),scale=len>1?1/len:1;
 const c=CLASSES[myClass];
 const speed=c.speed*(me.abilitySpeedUntil>performance.now()?1.65:1)*(me.abilitySlowUntil>performance.now()?.45:1)*(keys.has('ShiftLeft')||keys.has('ShiftRight')?1.4:1);
 const forward=-z*scale,strafe=x*scale;
 const yaw=me.face;
 // Analog motion is proportional to joystick tilt, including diagonals.
 const dx=(Math.sin(yaw)*forward-Math.cos(yaw)*strafe)*speed*dt;
 const dz=(Math.cos(yaw)*forward+Math.sin(yaw)*strafe)*speed*dt;
 const nx=me.x+dx,nz=me.z+dz,dist=Math.hypot(nx,nz);
 const boundaryScale=dist>PLAY_RADIUS?PLAY_RADIUS/dist:1;
 me.x=nx*boundaryScale;me.z=nz*boundaryScale;
 walkMotion=Math.hypot(dx,dz)/Math.max(dt,.001);
 me.guard=keys.has('KeyG');
 advanceJump(dt);
 // Optional keyboard turning works without pointer lock.
 if(keys.has('KeyQ'))rotateView(dt*135,0);
 if(keys.has('KeyE'))rotateView(-dt*135,0);
}
// Ranged CPU: imperfect tracking, actual moving arrows/orbs and dodgeable hits.
function clearCpuProjectiles(){
 for(const shot of cpuProjectiles){
  scene.remove(shot.mesh);
  shot.mesh.geometry.dispose();
  shot.mesh.material.dispose();
 }
 cpuProjectiles.length=0;
}
function fireCpuRanged(now){
 if(role!=='cpu'||state!=='playing'||!rival||!me)return;
 const archer=enemyClass==='archer';
 rival.lastAttack=now;
 animateSwing(enemyAvatar);
 // Spread is independent per shot, so standing still is easier to hit than
 // a moving player. The aim direction is already based on a delayed snapshot.
 const spread=(Math.random()-.5)*(archer?.26:.32);
 const angle=rival.face+spread;
 const speed=archer?12.5:9;
 const mesh=archer
  ?new THREE.Mesh(new THREE.CylinderGeometry(.022,.022,.75,7),
    new THREE.MeshStandardMaterial({color:0xf5d19a,emissive:0x392508,metalness:.14}))
  :new THREE.Mesh(new THREE.SphereGeometry(.19,12,8),
    new THREE.MeshBasicMaterial({color:0xc88cff}));
 const vx=Math.sin(angle),vz=Math.cos(angle);
 const startX=rival.x+vx*.65,startZ=rival.z+vz*.65;
 mesh.position.set(startX,1.42,startZ);
 if(archer)mesh.quaternion.setFromUnitVectors(
  new THREE.Vector3(0,1,0),new THREE.Vector3(vx,0,vz));
 scene.add(mesh);
 cpuProjectiles.push({
  mesh,x:startX,z:startZ,vx,vz,speed,travelled:0,
  range:CLASSES[enemyClass].range,damage:archer?12:15,
  radius:archer?.56:.79
 });
}
// Summons are updated from the existing frame loop.
function updateCpuProjectiles(dt){
 if(role!=='cpu'||state!=='playing')return;
 for(let i=cpuProjectiles.length-1;i>=0;i--){
  const shot=cpuProjectiles[i],px=shot.x,pz=shot.z;
  const sx=shot.vx*shot.speed*dt,sz=shot.vz*shot.speed*dt;
  shot.x+=sx;shot.z+=sz;shot.travelled+=Math.hypot(sx,sz);
  shot.mesh.position.set(shot.x,1.42,shot.z);
  // Segment collision avoids arrows passing through the player at low FPS.
  const segmentLengthSq=sx*sx+sz*sz;
  const t=segmentLengthSq
    ?THREE.MathUtils.clamp(((me.x-px)*sx+(me.z-pz)*sz)/segmentLengthSq,0,1)
    :0;
  const hx=px+t*sx,hz=pz+t*sz;
  const verticalGap=Math.abs(1.42-(me.y+1.2));
  const hit=verticalGap<.78&&(me.x-hx)**2+(me.z-hz)**2<shot.radius**2;
  const expired=shot.travelled>=shot.range||
    Math.abs(shot.x)>PLAY_RADIUS+1||Math.abs(shot.z)>PLAY_RADIUS+1;
  if(hit){
   const blocking=me.guard?(CLASSES[myClass].block||.42):0;
   const damage=Math.max(1,Math.round(shot.damage*(1-blocking)));
   me.hp=Math.max(0,me.hp-damage);
   lastHurtUntil=performance.now()+280;
   flash('攻撃を受けた！ -'+damage);
   updateHud();
  }
  if(hit||expired){
   scene.remove(shot.mesh);
   shot.mesh.geometry.dispose();
   shot.mesh.material.dispose();
   cpuProjectiles.splice(i,1);
  }
  if(hit&&me.hp<=0){endByHealth();return}
 }
}
function stepCPU(dt){
 const c=CLASSES[enemyClass],dx=me.x-rival.x,dz=me.z-rival.z,d=Math.hypot(dx,dz)||1;
 const now=performance.now();
 const ranged=enemyClass==='archer'||enemyClass==='mage';
 if(ranged){
  if(now>=cpuAim.nextUpdate){
   // Updates are deliberately infrequent; the aim won't follow dodges instantly.
   const jitter=(enemyClass==='archer'?1.10:1.30)*(.65+.45*Math.min(d/c.range,1));
   cpuAim.x=me.x+(Math.random()*2-1)*jitter;
   cpuAim.z=me.z+(Math.random()*2-1)*jitter;
   cpuAim.nextUpdate=now+470+Math.random()*360;
  }
  const wanted=Math.atan2(cpuAim.x-rival.x,cpuAim.z-rival.z);
  const delta=Math.atan2(Math.sin(wanted-rival.face),Math.cos(wanted-rival.face));
  rival.face+=THREE.MathUtils.clamp(delta,-dt*2.3,dt*2.3);
 }else rival.face=Math.atan2(dx,dz);
 const safeRange=Math.max(2.2,c.range*.67);
 if(d>safeRange){
  rival.x=THREE.MathUtils.clamp(rival.x+dx/d*c.speed*.66*dt,-PLAY_RADIUS,PLAY_RADIUS);
  rival.z=THREE.MathUtils.clamp(rival.z+dz/d*c.speed*.66*dt,-PLAY_RADIUS,PLAY_RADIUS);
 }else if(d<c.range*.42){
  rival.x=THREE.MathUtils.clamp(rival.x-dx/d*c.speed*.3*dt,-PLAY_RADIUS,PLAY_RADIUS);
  rival.z=THREE.MathUtils.clamp(rival.z-dz/d*c.speed*.3*dt,-PLAY_RADIUS,PLAY_RADIUS);
 }
 rival.guard=enemyClass==='shield'&&d<3.4&&Math.sin(now/700)>0.15;
 if(ranged){
  // Longer intervals + real projectile flight instead of unavoidable instant hits.
  const interval=c.cooldown*(enemyClass==='archer'?1.45:1.5);
  if(d<c.range&&now-rival.lastAttack>=interval)fireCpuRanged(now);
 }else if(d<c.range&&now-rival.lastAttack>c.cooldown+200){
  resolveAttack(false);
 }
}
function update(dt,t){
 if(state!=='playing'||!me||!rival)return;
 const entryProgress=THREE.MathUtils.clamp((t-entranceStart)/entranceDuration,0,1);
 if(entryProgress<1){
  // Stay behind the bars for the opening beat; only then walk out.
  const travel=THREE.MathUtils.smoothstep(entryProgress,.23,.90);
  const startSide=role==='guest'?1:-1;
  const zDistance=ENTRANCE_Z-(ENTRANCE_Z-ENTRANCE_END_Z)*travel;
  me.z=startSide*zDistance;
  me.x=0;me.face=startSide>0?Math.PI:0;
  rival.z=-startSide*zDistance;
  rival.x=0;rival.face=startSide>0?0:Math.PI;
  const gateLift=GATE_OPEN_HEIGHT*THREE.MathUtils.smoothstep(entryProgress,.02,.27);
  arenaGates.forEach(g=>g.position.y=gateLift);
  remaining=roundLength;updateHud();syncAvatars(dt);
  if(entryProgress>.92&&!entranceFightAnnounced){
   entranceFightAnnounced=true;flash('FIGHT!');
  }
  return;
 }
 // Both fighters have safely crossed the portcullis (at Z +/-55).
 // Close both iron gates smoothly after FIGHT, without blocking the battle.
 const closingProgress=THREE.MathUtils.clamp(
  (t-entranceStart-entranceDuration)/gateCloseDuration,0,1);
 const gateHeight=GATE_OPEN_HEIGHT*(1-THREE.MathUtils.smoothstep(closingProgress,0,1));
 arenaGates.forEach(g=>g.position.y=gateHeight);
 moveLocal(dt);
 if(role==='cpu'){
  stepCPU(dt);
  updateSummons(dt);
  updateCpuProjectiles(dt);
 }
 if(role==='host'||role==='cpu'){
  remaining=Math.max(0,(roundEnd-t)/1000);
  if(remaining===0){
   const score=me.hp/me.max-rival.hp/rival.max;
   finishMatch(Math.abs(score)<.0001?'draw':score>0?'win':'lose',true);
  }
 }
 if(role!=='cpu'&&connection?.open&&t-lastSync>70){
  connection.send({t:'state',x:me.x,y:me.y,z:me.z,face:me.face,guard:me.guard});
  if(role==='host'&&t-lastClock>350){
   lastClock=t;
   connection.send({t:'time',remaining});
  }
  lastSync=t;
 }
 if(Math.floor(t/100)!==Math.floor((t-dt*1000)/100))updateHud();
}
function animate(){
 requestAnimationFrame(animate);
 const dt=Math.min(clock.getDelta(),.04),t=performance.now();
 update(dt,t);
 if(state==='playing'&&me){
  syncAvatars(dt);
  // Actual player eye height, view direction controlled by mouse / swipe.
  walkPhase+=dt*(walkMotion>0.1?9:0);
  camera.position.set(me.x,1.62+me.y+(me.grounded?Math.sin(walkPhase)*.018*Math.min(walkMotion/6,1):0),me.z);
  camera.rotation.set(lookPitch,me.face+Math.PI,0,'YXZ');
 }else{
  camera.position.lerp(new THREE.Vector3(0,15,19),Math.min(1,dt*3));
  camera.lookAt(0,0,0);
 }
 if(enemyAvatar){
  const limbs=enemyAvatar.userData.limbs;
  if(limbs){
   const stride=Math.min(1,Math.hypot(rival.x-(enemyAvatar.userData.lastX??rival.x),rival.z-(enemyAvatar.userData.lastZ??rival.z))*12);
   const phase=t*.008;
   limbs.leftLeg.rotation.x=Math.sin(phase)*stride*.6;
   limbs.rightLeg.rotation.x=-Math.sin(phase)*stride*.6;
   limbs.rightArm.rotation.set(-Math.sin(phase)*stride*.23,0,.05);
   limbs.leftArm.rotation.set(Math.sin(phase)*stride*.23,0,-.05);
   enemyAvatar.userData.lastX=rival.x;enemyAvatar.userData.lastZ=rival.z;
  }
  avatarItems.animate(enemyAvatar,t,{kind:'attack',at:enemyAttackAt,guarding:rival.guard});
 }
 firstPersonHand.update(dt,t);
 for(let i=effects.length-1;i>=0;i--){
  const e=effects[i];e.life-=dt;e.mesh.material.opacity=Math.max(0,e.life/.23)*.85;
  if(e.life<=0){scene.remove(e.mesh);e.mesh.geometry.dispose();e.mesh.material.dispose();effects.splice(i,1)}
 }
 renderer.render(scene,camera);
}
animate();
loadProgress();renderJobs();
const trialForm=document.getElementById('pvpTrialForm');
trialForm?.addEventListener('submit',e=>{e.preventDefault();redeemTrialCode(document.getElementById('pvpTrialCode').value);document.getElementById('pvpTrialCode').value='';});
setInterval(()=>{if(trialExpires&&trialExpires<=Date.now()){trialExpires=0;if(!STARTER_JOBS.has(myClass)&&!unlocked(myClass)&&state==='menu')myClass='sword';renderJobs();renderProgress();const notice=document.getElementById('pvpCodeNotice');if(notice)notice.textContent='体験コードの有効期限が切れました';}},30000);
uiNotice('ジョブを選んでルームを作成するか、CPUと練習しよう。');
