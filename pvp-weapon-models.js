// PvP-exclusive armory. Separate from the NEXACRAFT story-mode weapons (190–207).
// Models are real procedural Three.js meshes and can be exported to GLB.
export const PVP_WEAPONS=[
 ['pvp_katana','影打・黒月','katana',0x8e9bd5,'忍者・刀使い'],
 ['pvp_scythe','冥府の大鎌','scythe',0x9a62d7,'死神・魂狩り'],
 ['pvp_pistol','蒼雷銃','gun',0x61c8ff,'銃士・魔銃士'],
 ['pvp_summon','召喚の魔導書','book',0x65d8a2,'召喚士・精霊使い'],
 ['pvp_chains','拘束の鎖','chain',0xc5a6f0,'鎖使い・封印師'],
 ['pvp_hammer','地砕きの大槌','hammer',0xe9a766,'ハンマー使い'],
 ['pvp_claws','獣王の爪','claw',0xf2b86a,'獣使い・格闘家'],
 ['pvp_barrier','結界の法環','ring',0x5ce7d9,'結界師・霊媒師'],
 ['pvp_curse','呪詛の短杖','staff',0xc65be0,'呪術師・闇術師'],
 ['pvp_bomb','爆裂手榴弾','bomb',0xff7954,'爆弾兵・爆破技師'],
 ['pvp_gravity','重力の宝珠','orb',0x9470fa,'重力術師・虚空使い'],
 ['pvp_machine','機巧の連射銃','rifle',0x75d2dc,'機械兵・工兵'],
 ['pvp_star','星辰の錫杖','staff',0xffd36e,'星術師・光術師'],
 ['pvp_dual','双牙短剣','dual',0x69c9f0,'傭兵・二刀流剣士'],
 ['pvp_trident','深海の三叉槍','trident',0x63d1d5,'槍兵・三叉槍兵'],
 ['pvp_bow','月光の長弓','bow',0x9dc4ff,'弓兵・狩人'],
 ['pvp_shield','城塞の戦盾','shield',0xc2a86d,'盾兵・守護者'],
 ['pvp_axe','炎獄の戦斧','axe',0xf18a64,'戦斧使い・重戦士'],
 ['pvp_wand','時空の砂時計杖','staff',0x7cb7ff,'時空使い・時間術師'],
 ['pvp_dragon','竜帝の巨剣','greatsword',0xf58e55,'竜王・魔剣士'],
 ['pvp_thunder','雷神の戦槌','hammer',0xf5e46e,'雷神・電磁兵'],
 ['pvp_dimension','次元断ち','greatsword',0xb58dff,'次元王・空間術師'],
 ['pvp_puppet','傀儡の操糸具','ring',0xeaa0b8,'傀儡師・人形使い'],
 ['pvp_flail','鉄球鎖','flail',0xc5c7d0,'鉄球使い'],
 ['pvp_whip','深紅の鞭','whip',0xe57b91,'鞭使い'],
 ['pvp_chakram','回帰の円刃','chakram',0x80e4e8,'チャクラム使い'],
 ['pvp_crossbow','機械式連弩','crossbow',0xc3b48a,'クロスボウ兵・連弩兵'],
 ['pvp_cannon','破城砲','cannon',0xf2aa70,'砲兵・投石兵'],
 ['pvp_potion','錬金の試薬瓶','potion',0x7ce8aa,'錬金術師・科学者'],
 ['pvp_brush','創造の絵筆','brush',0xeaa0f6,'画家'],
 ['pvp_lute','戦律の竪琴','lute',0xe7c18b,'音楽家・踊り子'],
 ['pvp_dice','運命の賽','dice',0xffd889,'賭博師・道化師']
].map(([id,name,kind,color,forJobs],i)=>({id,name,kind,color,forJobs,weaponId:300+i}));
export const PVP_WEAPON_BY_ID=new Map(PVP_WEAPONS.map(w=>[w.weaponId,w]));
const byKey=new Map(PVP_WEAPONS.map(w=>[w.id,w]));
export function makePvpWeaponModel(T,key){
 const w=typeof key==='number'?PVP_WEAPON_BY_ID.get(key):byKey.get(key);
 if(!w)return null;
 const g=new T.Group();
 const metal=new T.MeshStandardMaterial({color:0xaab9c6,metalness:.83,roughness:.25});
 const dark=new T.MeshStandardMaterial({color:0x293342,metalness:.74,roughness:.3});
 const gold=new T.MeshStandardMaterial({color:0xd8a957,metalness:.77,roughness:.26});
 const glow=new T.MeshStandardMaterial({color:w.color,emissive:w.color,emissiveIntensity:.36,metalness:.4,roughness:.24});
 const wood=new T.MeshStandardMaterial({color:0x6b4833,roughness:.77});
 const add=(geometry,material,x=0,y=0,z=0)=>{const m=new T.Mesh(geometry,material);m.position.set(x,y,z);m.castShadow=true;g.add(m);return m};
 const box=(x,y,z,a,b,c,m=metal)=>add(new T.BoxGeometry(a,b,c),m,x,y,z);
 const rod=(x,y,z,r,h,m=metal)=>add(new T.CylinderGeometry(r,r,h,12),m,x,y,z);
 const ball=(x,y,z,r,m=glow)=>add(new T.IcosahedronGeometry(r,1),m,x,y,z);
 const blade=(x,y,h,width=.23,m=metal)=>{box(x,y,0,width,h,.09,m);add(new T.ConeGeometry(width*.68,.35,4),m,x,y+h/2+.17,0).rotation.y=Math.PI/4};
 const shaft=(h=2.4)=>{rod(0,h/2,0,.065,h,wood);rod(0,.19,0,.095,.28,gold)};
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
 g.name=w.name;g.userData.pvpWeaponId=w.weaponId;return g;
}
