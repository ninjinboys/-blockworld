/* NEXACRAFT 3D creature gallery registry.
 * RULE: When a new mob or boss gains a 3D model, register it here /
 * in NEW_MOBS so https://nexacraft.pages.dev/new-mobs shows it.
 * Future bosses get a catalog entry AND a 3D build/animate adapter below.
 * Do not expose placeholder models as implemented enemies.
 */
import {NEW_MOBS,createNewMobModels} from './new-mob-models.js?v=20261018neutralGolem01';
import {LEGACY_MOBS,createLegacyMobModels} from './legacy-mob-models.js?v=20261018allOriginal01';
import {buildChimera,animateChimera} from './chimera-sculpt-v4.js?v=20261017chimeraBoss01';
import {createVillagerModels} from './villager-model.js?v=20261017villagerFold02';

export const VILLAGE_NPCS=[
  {id:'villager',name:'村人',kind:'村・一般住民',height:'約2ブロック',npc:true,status:'実装済'},
  {id:'villager_farmer',name:'村人（農民）',kind:'村・農民',height:'約2.6ブロック',npc:true,status:'実装済'},
  {id:'villager_crafter',name:'村人（職人）',kind:'村・職人',height:'約2ブロック',npc:true,status:'実装済'},
  {id:'villager_scholar',name:'村人（学者）',kind:'村・学者',height:'約2ブロック',npc:true,status:'実装済'}
];
export const BOSS_MOBS=[
  {id:'chimera',name:'キメラ',kind:'召喚ボス・オーバーワールド',
   height:'全高約5ブロック',description:'ライオン・バッファロー・巨大蛇の特徴を持つ召喚ボス。体力300。',boss:true,status:'実装済'}
];

// Display the history of implemented mobs, rather than grouping by type.
// Stone golems entered the game with villages, after village residents.
// Chimera is a separately featured boss, excluded from chronological numbering.
const historicalMobs=[
  ...LEGACY_MOBS,
  ...NEW_MOBS.filter(entry=>entry.id!=='golem'),
  ...VILLAGE_NPCS,
  ...NEW_MOBS.filter(entry=>entry.id==='golem')
];
export const CREATURE_CATALOG=[
  ...historicalMobs.map((entry,index)=>({...entry,boss:false,status:'実装済',order:index+1})),
  ...BOSS_MOBS
];
export function createCreatureCatalogue(T){
  const animals=createNewMobModels(T);
  const originals=createLegacyMobModels(T);
  const villagers=createVillagerModels(T);
  const residents={
    villager:0,villager_farmer:1,villager_crafter:2,villager_scholar:3
  };
  const bosses={
    chimera:{
      build:()=>buildChimera(T),
      animate:(model,seconds)=>animateChimera(model,seconds,'idle')
    }
  };
  for(const entry of BOSS_MOBS)
    if(!bosses[entry.id])throw new Error('Missing 3D boss adapter: '+entry.id);
  return {
    build(id){
      if(bosses[id])return bosses[id].build();
      if(Object.hasOwn(residents,id)){
        const g=villagers.build(residents[id]);
        g.userData.galleryNpcType=id;return g;
      }
      if(LEGACY_MOBS.some(entry=>entry.id===id))return originals.build(id);
      return animals.build(id);
    },
    animate(model,seconds,walking=true){
      const boss=bosses[model.userData.newMobType||model.userData.galleryBossType];
      if(boss)return boss.animate(model,seconds);
      if(model.userData.galleryNpcType)return villagers.animate(model,seconds,walking);
      if(model.userData.galleryLegacyType)return originals.animate(model,seconds,walking);
      return animals.animate(model,seconds,walking);
    }
  };
}
