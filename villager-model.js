/* NEXACRAFT villagers: full 3D voxel villagers for gameplay and the
 * /new-mobs encyclopedia. Three.js supplied by the caller.
 * Feet visually begin at local Y=0.5 to match the terrain top face.
 */
export const VILLAGER_VARIANTS=[
  {id:0,name:'村人',color:0x8d6d4b,trim:0xc5a36d},
  {id:1,name:'農民',color:0x5d8050,trim:0xd8b06a},
  {id:2,name:'職人',color:0x557b99,trim:0xbac7ca},
  {id:3,name:'学者',color:0x866299,trim:0xd1b9de}
];
export function createVillagerModels(T){
 const materialCache=new Map();
 function mat(c){
  if(!materialCache.has(c))materialCache.set(c,new T.MeshLambertMaterial({color:c}));
  return materialCache.get(c);
 }
 function block(parent,w,h,d,color,x=0,y=0,z=0){
  const m=new T.Mesh(new T.BoxGeometry(w,h,d),mat(color));
  m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;
  parent.add(m);return m;
 }
 function build(variant=0){
  const role=VILLAGER_VARIANTS[((variant%4)+4)%4],g=new T.Group();
  const skin=0xba8868,shade=0x9d694e,robe=role.color,trim=role.trim,eyes=0x27221d;
  // Long robe with layered hem, apron and sleeves.
  block(g,.72,.92,.48,robe,0,1.28,0);
  block(g,.78,.17,.53,trim,0,.81,0);
  block(g,.66,.13,.54,shade,0,1.69,0);
  block(g,.38,.66,.09,trim,0,1.20,-.286);
  block(g,.29,.08,.12,0xede0bb,0,.91,-.352);
  const leftLeg=new T.Group(),rightLeg=new T.Group(),walkLegs=[leftLeg,rightLeg];
  for(const [side,leg] of [[-1,leftLeg],[1,rightLeg]]){
   leg.position.set(side*.18,.93,0);
   block(leg,.27,.39,.30,0x4b3c36,0,-.18,0);
   block(leg,.29,.16,.36,0x302b29,0,-.36,-.04);
   g.add(leg);
   const arm=new T.Group();arm.position.set(side*.50,1.65,0);
   block(arm,.25,.57,.31,robe,0,-.28,0);
   block(arm,.26,.13,.34,trim,0,-.53,0);
   block(arm,.19,.21,.26,skin,0,-.65,0);
   // Villagers' arms are usually held together in front.
   arm.rotation.x=-.44;arm.rotation.z=side*.12;
   g.add(arm);
  }
  // Substantial head with prominent nose and eyebrows, not a player skin.
  block(g,.62,.61,.56,skin,0,1.97,-.01);
  block(g,.62,.15,.59,shade,0,2.26,-.015);
  for(const side of [-1,1]){
   block(g,.14,.09,.06,0x513c32,side*.17,2.10,-.311);
   block(g,.085,.10,.056,eyes,side*.17,2.03,-.326);
   block(g,.11,.19,.13,skin,side*.35,1.97,-.04);
  }
  block(g,.19,.28,.24,shade,0,1.94,-.39);
  block(g,.13,.19,.23,skin,0,1.93,-.51);
  block(g,.25,.07,.065,0x4b352d,0,1.76,-.304);
  // Profession details.
  if(variant%4===1){
   block(g,.79,.12,.70,0xc59c48,0,2.31,0);
   block(g,.51,.30,.47,0xa17b34,0,2.49,0);
   block(g,.26,.10,.55,0xd6b66b,0,2.61,0);
  }else if(variant%4===2){
   block(g,.19,.19,.10,0xd6e5e7,-.19,1.14,-.35);
   block(g,.19,.19,.10,0xd6e5e7,.19,1.14,-.35);
   block(g,.18,.09,.08,0x3f5361,0,1.12,-.42);
  }else if(variant%4===3){
   block(g,.72,.15,.62,0x674c84,0,2.31,-.01);
   for(const side of [-1,1])
    block(g,.25,.05,.066,0x222632,side*.18,2.05,-.342);
   block(g,.08,.05,.06,0xbab6c8,0,2.05,-.359);
  }
  g.userData.walkLegs=walkLegs;
  g.userData.villagerVariant=variant%4;
  return g;
 }
 function animate(model,seconds,moving){
  const legs=model.userData.walkLegs||[];
  const stride=moving?Math.sin(seconds*6.1)*.29:0;
  if(legs[0])legs[0].rotation.x=stride;
  if(legs[1])legs[1].rotation.x=-stride;
 }
 return {build,animate};
}
