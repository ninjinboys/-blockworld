/* NEXACRAFT 3D creature gallery registry.
 * RULE: When a new mob or boss gains a 3D model, register it here /
 * in NEW_MOBS so https://nexacraft.pages.dev/new-mobs shows it.
 * Future bosses get a catalog entry AND a 3D build/animate adapter below.
 * Do not expose placeholder models as implemented enemies.
 */
import {NEW_MOBS,createNewMobModels} from './new-mob-models.js?v=20261017villageModel03';
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

// A single listing used by the gallery; future wildlife are added to
// NEW_MOBS, future bosses to BOSS_MOBS with a matching builder/animator.
export const CREATURE_CATALOG=[
  ...NEW_MOBS.map(entry=>({...entry,boss:false,status:'実装済'})),
  ...VILLAGE_NPCS,
  ...BOSS_MOBS
];
export function createCreatureCatalogue(T){
  const animals=createNewMobModels(T);
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
      return animals.build(id);
    },
    animate(model,seconds,walking=true){
      const boss=bosses[model.userData.newMobType||model.userData.galleryBossType];
      if(boss)return boss.animate(model,seconds);
      if(model.userData.galleryNpcType)return villagers.animate(model,seconds,walking);
      return animals.animate(model,seconds,walking);
    }
  };
}
