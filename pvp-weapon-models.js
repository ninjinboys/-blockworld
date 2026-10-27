import {makeDetailedJobWeapon} from './job-weapon-models.js?v=20261023bowFacingForward24';
// PvP-exclusive armory. Separate from the NEXACRAFT story-mode weapons (190–207).
// Models are real procedural Three.js meshes and can be exported to GLB.
export const PVP_WEAPONS=[
 ['pvp_katana','刀','katana',0x8e9bd5,'忍者・刀使い'],
 ['pvp_scythe','大鎌','scythe',0x9a62d7,'死神・魂狩り'],
 ['pvp_pistol','拳銃','gun',0x61c8ff,'銃士・魔銃士'],
 ['pvp_summon','魔導書','book',0x65d8a2,'召喚士・精霊使い'],
 ['pvp_chains','鎖','chain',0xc5a6f0,'鎖使い・封印師'],
 ['pvp_hammer','大槌','hammer',0xe9a766,'ハンマー使い'],
 ['pvp_claws','爪','claw',0xf2b86a,'獣使い・格闘家'],
 ['pvp_barrier','法環','ring',0x5ce7d9,'結界師・霊媒師'],
 ['pvp_curse','呪術杖','staff',0xc65be0,'呪術師・闇術師'],
 ['pvp_bomb','爆弾','bomb',0xff7954,'爆弾兵・爆破技師'],
 ['pvp_gravity','宝珠','orb',0x9470fa,'重力術師・虚空使い'],
 ['pvp_machine','機関銃','rifle',0x75d2dc,'機械兵・工兵'],
 ['pvp_star','魔法杖','staff',0xffd36e,'星術師・光術師'],
 ['pvp_dual','双剣','dual',0x69c9f0,'傭兵・二刀流剣士'],
 ['pvp_trident','三叉槍','trident',0x63d1d5,'槍兵・三叉槍兵'],
 ['pvp_bow','長弓','bow',0x9dc4ff,'弓兵・狩人'],
 ['pvp_shield','大盾','shield',0xc2a86d,'盾兵・守護者'],
 ['pvp_axe','戦斧','axe',0xf18a64,'戦斧使い・重戦士'],
 ['pvp_wand','時空杖','staff',0x7cb7ff,'時空使い・時間術師'],
 ['pvp_dragon','大剣','greatsword',0xf58e55,'竜王・魔剣士'],
 ['pvp_thunder','雷槌','hammer',0xf5e46e,'雷神・電磁兵'],
 ['pvp_dimension','次元剣','greatsword',0xb58dff,'次元王・空間術師'],
 ['pvp_puppet','操糸具','ring',0xeaa0b8,'傀儡師・人形使い'],
 ['pvp_flail','鉄球','flail',0xc5c7d0,'鉄球使い'],
 ['pvp_whip','鞭','whip',0xe57b91,'鞭使い'],
 ['pvp_chakram','円刃','chakram',0x80e4e8,'チャクラム使い'],
 ['pvp_crossbow','クロスボウ','crossbow',0xc3b48a,'クロスボウ兵・連弩兵'],
 ['pvp_cannon','大砲','cannon',0xf2aa70,'砲兵・投石兵'],
 ['pvp_potion','薬瓶','potion',0x7ce8aa,'錬金術師・科学者'],
 ['pvp_brush','絵筆','brush',0xeaa0f6,'画家'],
 ['pvp_lute','竪琴','lute',0xe7c18b,'音楽家・踊り子'],
 ['pvp_dice','サイコロ','dice',0xffd889,'賭博師・道化師']
].map(([id,name,kind,color,forJobs],i)=>({id,name,kind,color,forJobs,weaponId:300+i}));
export const PVP_WEAPON_BY_ID=new Map(PVP_WEAPONS.map(w=>[w.weaponId,w]));
const byKey=new Map(PVP_WEAPONS.map(w=>[w.id,w]));
export function makePvpWeaponModel(T,key){
 const w=typeof key==='number'?PVP_WEAPON_BY_ID.get(key):byKey.get(key);
 if(!w)return null;
 // Build PvP arms on the actual story-mode forged meshes, not an unrelated
 // collection of primitives. The original silhouette and construction survive.
 const storyFamily={
  katana:['swordmaster','sword',30],greatsword:['warrior','greatsword',30],
  dual:['berserker','dual',30],scythe:['warrior','greatsword',30],
  gun:['powerArcher','bow',30],rifle:['powerArcher','bow',30],
  cannon:['warrior','greatsword',30],crossbow:['powerArcher','bow',30],
  bow:['powerArcher','bow',30],shield:['shieldElite','shield',30],
  staff:['battleMage','staff',30],trident:['lancer','spear',30],
  hammer:['axer','axe',30],axe:['axer','axe',30],
  flail:['axer','axe',30],whip:['lancer','spear',30],
  brush:['supportMage','staff',30],claw:['berserker','dual',30]
 };
 const family=storyFamily[w.kind];
 if(family){
  const [baseKey,baseKind,level]=family;
  const root=makeDetailedJobWeapon(T,{key:baseKey,kind:baseKind,level,name:w.name,group:baseKind});
  if(root){
   root.name=w.name;root.userData.pvpWeaponId=w.weaponId;
   // A distinct PvP forge finish while retaining the exact story-mode body.
   const accent=new T.MeshStandardMaterial({color:w.color,metalness:.38,roughness:.24,emissive:w.color,emissiveIntensity:.18,side:T.DoubleSide});
   const gold=new T.MeshStandardMaterial({color:0xcc9d5d,metalness:.82,roughness:.29,side:T.DoubleSide});
   const mark=new T.Mesh(new T.OctahedronGeometry(.105,0),accent);
   const bounds=new T.Box3().setFromObject(root);
   const center=bounds.getCenter(new T.Vector3());
   const size=bounds.getSize(new T.Vector3());
   mark.position.set(center.x,center.y+size.y*.22,bounds.max.z+.08);
   root.add(mark);
   for(const sign of [-1,1]){
    const gem=new T.Mesh(new T.OctahedronGeometry(.05,0),gold);
    gem.position.set(center.x+sign*Math.min(.25,size.x*.25),center.y+size.y*.17,bounds.max.z+.07);
    root.add(gem);
   }
   return root;
  }
 }
 const g=new T.Group();
 const metal=new T.MeshStandardMaterial({color:0x9aabb9,metalness:.82,roughness:.31,side:T.DoubleSide});
 const dark=new T.MeshStandardMaterial({color:0x343e49,metalness:.67,roughness:.42,side:T.DoubleSide});
 const gold=new T.MeshStandardMaterial({color:0xcc9d5d,metalness:.82,roughness:.29,side:T.DoubleSide});
 const glow=new T.MeshStandardMaterial({color:w.color,emissive:w.color,emissiveIntensity:.24,metalness:.32,roughness:.2,side:T.DoubleSide});
 const wood=new T.MeshStandardMaterial({color:0x493829,roughness:.89,side:T.DoubleSide});
 const add=(geometry,material,x=0,y=0,z=0)=>{const m=new T.Mesh(geometry,material);m.position.set(x,y,z);m.castShadow=true;g.add(m);return m};
 const box=(x,y,z,a,b,c,m=metal)=>add(new T.BoxGeometry(a,b,c),m,x,y,z);
 const rod=(x,y,z,r,h,m=metal)=>add(new T.CylinderGeometry(r,r,h,12),m,x,y,z);
 const ball=(x,y,z,r,m=glow)=>add(new T.IcosahedronGeometry(r,1),m,x,y,z);
 const blade=(x,y,h,width=.23,m=metal)=>{box(x,y,0,width,h,.09,m);add(new T.ConeGeometry(width*.68,.35,4),m,x,y+h/2+.17,0).rotation.y=Math.PI/4};
 const shaft=(h=2.4)=>{rod(0,h/2,0,.065,h,wood);rod(0,.19,0,.095,.28,gold)};
 // Match the main game's forged weapon design language: bevelled plates,
 // layered metal edges, restrained runes and leather/bronze fittings.
 const plate=(points,depth,mat=metal,z=0)=>{
  const shape=new T.Shape();shape.moveTo(points[0][0],points[0][1]);
  for(let i=1;i<points.length;i++)shape.lineTo(points[i][0],points[i][1]);
  shape.closePath();
  return add(new T.ExtrudeGeometry(shape,{depth,steps:1,bevelEnabled:true,bevelThickness:.012,bevelSize:.012,bevelSegments:2}),mat,0,0,z-depth/2);
 };
 const diamond=(x,y,width,height,mat=glow,z=.12)=>plate([[x,y+height],[x+width,y],[x,y-height],[x-width,y]],.035,mat,z);
 const k=w.kind;
 if(['katana','greatsword','dual'].includes(k)){
  const makeSword=(x=0,scale=1)=>{const b=new T.Group();g.add(b);b.position.x=x;b.scale.setScalar(scale);
   const m=new T.Mesh(new T.BoxGeometry(k==='greatsword'?.45:.19,1.85,.09),metal);m.position.y=1.75;b.add(m);
   const tip=new T.Mesh(new T.ConeGeometry(k==='greatsword'?.3:.135,.48,4),glow);tip.position.y=2.92;tip.rotation.y=Math.PI/4;b.add(tip);
   const grip=new T.Mesh(new T.CylinderGeometry(.075,.08,.65,10),dark);grip.position.y=.47;b.add(grip);
   const guard=new T.Mesh(new T.BoxGeometry(k==='greatsword'?1.12:.68,.11,.22),gold);guard.position.y=.83;b.add(guard);
   for(let i=0;i<5;i++){const wrap=new T.Mesh(new T.TorusGeometry(.081,.013,5,12),glow);wrap.position.y=.25+i*.1;wrap.rotation.x=Math.PI/2;b.add(wrap)}
  };makeSword(k==='dual'?-.4:0,k==='dual'?.82:1);if(k==='dual')makeSword(.4,.82);
 }else if(k==='scythe'){
  shaft(2.7);const curve=new T.CatmullRomCurve3([new T.Vector3(0,2.65,0),new T.Vector3(.5,2.95,0),new T.Vector3(1.15,2.88,0),new T.Vector3(1.55,2.35,0)]);
  add(new T.TubeGeometry(curve,22,.10,7,false),glow);ball(.13,2.7,0,.18);
 }else if(['gun','rifle','cannon','crossbow'].includes(k)){
  const length=k==='gun'?1.05:k==='cannon'?2.4:1.8;
  box(0,1.4,0,.34,.42,length,dark);const barrel=rod(0,1.45,-length*.47,.16,k==='cannon'?1.5:1.0,metal);barrel.rotation.x=Math.PI/2;
  rod(0,1.45,-length*.93,.19,.13,gold).rotation.x=Math.PI/2;
  box(0,.8,.36,.19,.9,.23,wood);box(0,1.7,.24,.32,.18,.3,glow);
  if(k==='crossbow'){box(0,1.5,-.6,1.6,.14,.13,gold);rod(0,1.55,-.6,.025,1.6,glow).rotation.z=Math.PI/2}
 }else if(k==='bow'){
  const curve=new T.CatmullRomCurve3([new T.Vector3(0,.1,0),new T.Vector3(-.35,.55,0),new T.Vector3(-.52,1.45,0),new T.Vector3(-.35,2.3,0),new T.Vector3(0,2.9,0)]);
  add(new T.TubeGeometry(curve,32,.075,8,false),wood);
  const string=rod(0,1.5,0,.016,2.8,glow);string.position.x=.03;
  ball(-.45,1.5,0,.11,gold);
 }else if(['staff','trident','hammer','axe','flail','whip','brush'].includes(k)){
  shaft(k==='whip'?1.3:2.5);
  if(k==='staff'){ball(0,2.72,0,.32);add(new T.TorusGeometry(.37,.035,8,30),gold,0,2.72,0);ball(0,2.72,0,.12,gold)}
  if(k==='trident'){for(const x of [-.35,0,.35]){rod(x,2.78,0,.06,.65,metal);add(new T.ConeGeometry(.13,.4,6),glow,x,3.29,0)}box(0,2.55,0,.85,.12,.12,gold)}
  if(k==='hammer'){box(0,2.48,0,1.45,.65,.66,dark);box(-.73,2.48,0,.18,.75,.72,glow);box(.73,2.48,0,.18,.75,.72,glow)}
  if(k==='axe'){box(.35,2.48,0,.7,.83,.17,glow);add(new T.ConeGeometry(.4,.8,4),metal,.72,2.5,0).rotation.z=-Math.PI/2}
  if(k==='flail'){const chain=new T.CatmullRomCurve3([new T.Vector3(0,2.5,0),new T.Vector3(.3,2.85,0),new T.Vector3(.55,3.1,0)]);add(new T.TubeGeometry(chain,16,.04,6,false),gold);ball(.55,3.1,0,.36,dark);for(let i=0;i<7;i++){const a=i*Math.PI*2/7;ball(.55+Math.cos(a)*.37,3.1+Math.sin(a)*.37,0,.10,metal)}}
  if(k==='whip'){const curve=new T.CatmullRomCurve3([new T.Vector3(0,1.3,0),new T.Vector3(.65,2,0),new T.Vector3(1.25,1.55,0),new T.Vector3(1.65,2.4,0),new T.Vector3(2.1,2.15,0)]);add(new T.TubeGeometry(curve,35,.055,7,false),glow)}
  if(k==='brush'){add(new T.ConeGeometry(.26,.5,10),glow,0,2.78,0);rod(0,2.35,0,.17,.2,gold)}
 }else if(k==='claw'){
  for(let i=-1;i<=1;i++){box(i*.25,.65,0,.15,.65,.18,dark);const claw=add(new T.ConeGeometry(.12,.9,6),glow,i*.25,1.48,-.15);claw.rotation.z=-.16*i}box(0,.3,.13,.85,.4,.32,gold);
 }else if(['ring','chakram'].includes(k)){
  add(new T.TorusGeometry(.85,k==='chakram'?.12:.07,10,50),k==='chakram'?metal:glow,0,1.5,0);
  add(new T.TorusGeometry(.57,.045,8,45),gold,0,1.5,.03);
  for(let i=0;i<8;i++){const a=i*Math.PI/4;ball(Math.cos(a)*.85,1.5+Math.sin(a)*.85,0,.12)}
  rod(0,.43,0,.075,.7,dark);
 }else if(k==='book'){
  box(-.32,1.35,0,.65,1.25,.14,dark);box(.32,1.35,0,.65,1.25,.14,dark);
  box(0,1.35,-.12,1.3,1.2,.08,glow);box(0,1.35,.14,1.3,1.2,.08,gold);
  ball(0,1.35,.2,.23);
 }else if(k==='shield'){
  const shape=new T.Shape();shape.moveTo(-.75,2.3);shape.lineTo(.75,2.3);shape.lineTo(.72,1.0);shape.lineTo(0,.4);shape.lineTo(-.72,1.0);shape.closePath();
  add(new T.ExtrudeGeometry(shape,{depth:.16,bevelEnabled:true,bevelSize:.06,bevelThickness:.05,bevelSegments:2}),dark,0,0,0);
  box(0,1.65,.24,.16,1.2,.12,gold);box(0,1.65,.25,1.05,.13,.12,gold);ball(0,1.65,.32,.23);
 }else if(k==='bomb'||k==='orb'||k==='potion'||k==='dice'){
  if(k==='dice'){box(0,1.4,0,1.05,1.05,1.05,glow);for(let i=0;i<3;i++)ball(-.26+i*.26,1.4,.54,.07,dark)}
  else if(k==='potion'){rod(0,.9,0,.15,.7,gold);ball(0,1.65,0,.55,glow);rod(0,2.28,0,.16,.45,wood)}
  else{ball(0,1.4,0,.66,k==='bomb'?dark:glow);for(let i=0;i<3;i++){const a=i*Math.PI/3;const hoop=add(new T.TorusGeometry(.7,.045,7,42),gold,0,1.4,0);hoop.rotation.y=a}if(k==='bomb')rod(0,2.17,0,.08,.42,glow)}
 }else if(k==='lute'){
  ball(0,1.0,0,.62,wood);box(0,1.85,0,.3,1.3,.2,wood);
  for(let i=-2;i<=2;i++)rod(i*.1,1.25,.55,.013,1.6,gold);
 }

 // PvP workshop finish pass: physical edge bevels, rivets, wraps, recessed panels
 // and class-specific silhouettes. These are real 3D components, not sprites.
 const trim=new T.MeshStandardMaterial({color:0xcedde5,metalness:.85,roughness:.22,side:T.DoubleSide});
 const inset=new T.MeshStandardMaterial({color:0x1a252d,metalness:.46,roughness:.5,side:T.DoubleSide});
 const ringAt=(x,y,z,r=.13,t=.018,m=gold)=>add(new T.TorusGeometry(r,t,8,20),m,x,y,z);
 const rivet=(x,y,z,r=.035)=>ball(x,y,z,r,gold);
 const cord=(points,r=.024,m=glow)=>add(new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),Math.max(12,points.length*5),r,7,false),m);
 if(['katana','greatsword','dual'].includes(k)){
  const count=k==='dual'?2:1;
  for(let n=0;n<count;n++){
   const x=count===2?(n?-.4:.4):0;
   const sc=count===2?.82:1;
   const bladeLength=1.85*sc;
   const ridge=box(x,1.75*sc, .055,.025,bladeLength,.022,trim);
   const fuller=box(x,1.78*sc,-.055,.032,bladeLength*.72,.018,inset);
   for(let j=0;j<6;j++)ringAt(x,.23*sc+j*.09*sc,.09,.074*sc,.008,glow);
   if(k==='katana'){
    const curve=new T.CatmullRomCurve3([new T.Vector3(x-.1,1.04,0),new T.Vector3(x-.16,1.75,0),new T.Vector3(x-.09,2.35,0),new T.Vector3(x,2.8,0)]);
    add(new T.TubeGeometry(curve,22,.024,6,false),trim);
   }
   rivet(x-.17*sc,.84*sc,.11,.034);rivet(x+.17*sc,.84*sc,.11,.034);
  }
 }
 if(k==='scythe'){
  // Long tapered cutting edge and a structural spine (not a bent tube).
  const shape=new T.Shape();
  shape.moveTo(.06,2.7);shape.bezierCurveTo(.4,3.32,1.23,3.35,1.85,2.42);
  shape.bezierCurveTo(1.46,2.75,.85,2.91,.35,2.77);shape.closePath();
  add(new T.ExtrudeGeometry(shape,{depth:.085,bevelEnabled:true,bevelThickness:.02,bevelSize:.018,bevelSegments:2}),metal,0,0,-.045);
  for(let j=0;j<8;j++)ringAt(0,.35+j*.24,.075,.075,.012,dark);
 }
 if(['gun','rifle','cannon','crossbow'].includes(k)){
  const len=k==='gun'?1.05:k==='cannon'?2.4:1.8;
  box(0,1.41,-len*.38,.23,.22,len*.6,trim);
  box(0,1.39,-len*.38,.13,.12,len*.64,inset);
  for(let j=0;j<4;j++)box(0,1.65,-len*.24-j*.18,.25,.045,.06,gold);
  box(0,.96,-.12,.16,.5,.34,inset);
  if(k==='rifle'||k==='cannon'){box(0,1.93,.1,.18,.17,.54,metal);ball(0,1.96,-.21,.095,glow)}
  if(k==='crossbow'){
   cord([[-.78,1.53,-.6],[0,1.55,-.48],[.78,1.53,-.6]],.015,trim);
   rod(0,1.58,-.45,.025,1.15,glow).rotation.x=Math.PI/2;
  }
 }
 if(k==='bow'){
  cord([[0,.12,.025],[-.43,.9,.025],[-.5,1.55,.025],[-.36,2.35,.025],[0,2.87,.025]],.02,gold);
  for(const y of [.32,2.67]){ringAt(-.13,y,.04,.12,.018,metal)}
  box(-.48,1.5,0,.18,.5,.24,dark);
  for(let j=0;j<6;j++)ringAt(-.48,1.31+j*.07,.12,.095,.009,glow);
 }
 if(k==='shield'){
  const border=new T.Shape();border.moveTo(-.82,2.36);border.lineTo(.82,2.36);border.lineTo(.79,.96);border.lineTo(0,.27);border.lineTo(-.79,.96);border.closePath();
  const hole=new T.Path();hole.moveTo(-.65,2.19);hole.lineTo(-.62,1.06);hole.lineTo(0,.53);hole.lineTo(.62,1.06);hole.lineTo(.65,2.19);hole.closePath();border.holes.push(hole);
  add(new T.ExtrudeGeometry(border,{depth:.07,bevelEnabled:true,bevelSize:.015,bevelThickness:.015,bevelSegments:2}),gold,0,0,.17);
  for(const x of [-.57,.57])for(const y of [1.15,1.65,2.08])rivet(x,y,.27);
  ringAt(0,1.65,.34,.3,.035,glow);
 }
 if(['staff','trident','hammer','axe','flail','whip','brush'].includes(k)){
  for(let j=0;j<9;j++){const y=.3+j*.15;ringAt(0,y,.055,.07,.012,j%2?gold:dark)}
  if(k==='staff'){for(let i=0;i<6;i++){const a=i*Math.PI/3;ball(Math.cos(a)*.31,2.72+Math.sin(a)*.31,.04,.055,gold)}}
  if(k==='hammer'){for(const x of [-.7,.7])for(const z of [-.25,.25])rivet(x,2.48,z,.07)}
  if(k==='axe'){for(const y of [2.2,2.5,2.78])rivet(.4,y,.1,.045)}
  if(k==='trident'){for(const x of [-.35,0,.35])cord([[x,2.64,.07],[x,3.06,.07],[x,3.42,.07]],.022,glow)}
  if(k==='flail'){for(let j=0;j<4;j++){const x=j*.16;ringAt(x,2.52+j*.18,.04,.07,.017,metal)}}
 }
 if(k==='book'){
  for(const x of [-.28,.28])for(let j=0;j<6;j++)box(x,1.03+j*.115,.19,.48,.014,.025,metal);
  ringAt(0,1.42,.25,.29,.032,gold);
  for(let j=0;j<5;j++)rivet(-.45+j*.22,.87,.18,.025);
 }
 if(k==='claw'){
  for(const x of [-.25,0,.25]){
   const shape=new T.Shape();shape.moveTo(x-.08,1.12);shape.lineTo(x-.06,1.9);shape.lineTo(x+.13,2.3);shape.lineTo(x+.08,1.18);shape.closePath();
   add(new T.ExtrudeGeometry(shape,{depth:.11,bevelEnabled:true,bevelSize:.012,bevelThickness:.012}),metal,0,0,-.18);
  }
  for(const x of [-.3,0,.3])rivet(x,.58,.3);
 }
 if(['ring','chakram'].includes(k)){
  for(let j=0;j<8;j++){const a=j*Math.PI/4;const x=Math.cos(a)*.86,y=1.5+Math.sin(a)*.86;
   const spike=add(new T.ConeGeometry(.11,.3,5),metal,x+Math.cos(a)*.16,y+Math.sin(a)*.16,0);
   spike.rotation.z=-a-Math.PI/2;
  }
 }
 if(['bomb','orb','potion','dice'].includes(k)){
  if(k==='potion'){ringAt(0,1.63,.48,.3,.03,gold);for(let j=0;j<4;j++)rivet(Math.cos(j*Math.PI/2)*.38,1.65+Math.sin(j*Math.PI/2)*.38,.32)}
  if(k==='bomb'){for(let j=0;j<6;j++){const a=j*Math.PI/3;rivet(Math.cos(a)*.59,1.4+Math.sin(a)*.59,.25,.05)}}
  if(k==='orb')for(let j=0;j<6;j++){const a=j*Math.PI/3;ball(Math.cos(a)*.8,1.4+Math.sin(a)*.8,0,.085,gold)}
  if(k==='dice')for(let j=0;j<4;j++)rivet(-.33+j*.22,1.04,.52,.045);
 }
 if(k==='lute'){
  ringAt(0,1.05,.57,.28,.04,gold);
  for(let j=0;j<6;j++)rivet(-.13+j*.052,2.38,.1,.032);
 }

 // Structural armour language shared with the main-game workshop.
 if(['katana','greatsword','dual'].includes(k)){
  const count=k==='dual'?2:1;
  for(let n=0;n<count;n++){
   const x=count===2?(n?-.4:.4):0,scale=count===2?.82:1;
   plate([[x-.13*scale,.99*scale],[x+.13*scale,.99*scale],[x+.15*scale,2.49*scale],[x,2.89*scale],[x-.15*scale,2.49*scale]],.025,trim,.075);
   diamond(x,1.07*scale,.09*scale,.13*scale,gold,.13);
   for(const side of [-1,1])diamond(x+side*.18*scale,.83*scale,.08*scale,.10*scale,glow,.14);
  }
 }else if(k==='shield'){
  for(const side of [-1,1])plate([[side*.18,2.04],[side*.56,2.11],[side*.55,1.24],[side*.18,.89]],.045,metal,.28);
  diamond(0,1.65,.28,.46,glow,.32);
 }else if(['staff','trident','hammer','axe','flail','brush'].includes(k)){
  plate([[-.13,2.25],[.13,2.25],[.19,2.49],[0,2.65],[-.19,2.49]],.09,dark,.11);
  diamond(0,2.46,.12,.17,glow,.2);
 }else if(['gun','rifle','cannon','crossbow'].includes(k)){
  for(const side of [-1,1]){box(side*.15,1.43,-.14,.045,.23,.74,metal);rivet(side*.17,1.43,.24,.035)}
  diamond(0,1.73,.09,.11,glow,.22);
 }else if(k==='book'){
  plate([[-.59,.79],[.59,.79],[.59,1.91],[-.59,1.91]],.035,dark,.25);
  diamond(0,1.38,.22,.32,glow,.32);
 }else if(['ring','chakram'].includes(k)){
  for(let j=0;j<4;j++){const a=j*Math.PI/2;diamond(Math.cos(a)*.83,1.5+Math.sin(a)*.83,.08,.15,gold,.11)}
 }
 g.name=w.name;g.userData.pvpWeaponId=w.weaponId;return g;
}
