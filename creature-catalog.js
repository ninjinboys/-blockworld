/* NEXACRAFT 3D creature gallery registry.
 * RULE: When a new mob or boss gains a 3D model, register it here /
 * in NEW_MOBS so https://nexacraft.pages.dev/new-mobs shows it.
 * Future bosses get a catalog entry AND a 3D build/animate adapter below.
 * Do not expose placeholder models as implemented enemies.
 */
import {NEW_MOBS,createNewMobModels} from './new-mob-models.js?v=20261017mobRelease02';
import {buildChimera,animateChimera} from './chimera-sculpt-v4.js?v=20261017chimeraBoss01';

export const BOSS_MOBS=[
  {id:'chimera',name:'キメラ',kind:'召喚ボス・オーバーワールド',
   height:'全高約5ブロック',description:'ライオン・バッファロー・巨大蛇の特徴を持つ召喚ボス。体力300。',boss:true,status:'実装済'}
];

// A single listing used by the gallery; future wildlife are added to
// NEW_MOBS, future bosses to BOSS_MOBS with a matching builder/animator.
export const CREATURE_CATALOG=[
  ...NEW_MOBS.map(entry=>({...entry,boss:false,status:entry.id==='golem'?'村の実装待ち':'実装済'})),
  ...BOSS_MOBS
];
export function createCreatureCatalogue(T){
  const animals=createNewMobModels(T);
  const bosses={
    chimera:{
      build:()=>buildChimera(T),
      animate:(model,seconds)=>animateChimera(model,seconds,'idle')
    }
  };
  for(const entry of BOSS_MOBS)
    if(!bosses[entry.id])throw new Error('Missing 3D boss adapter: '+entry.id);
  return {
    build(id){return bosses[id]?bosses[id].build():animals.build(id);},
    animate(model,seconds,walking=true){
      const boss=bosses[model.userData.newMobType||model.userData.galleryBossType];
      return boss?boss.animate(model,seconds):animals.animate(model,seconds,walking);
    }
  };
}
