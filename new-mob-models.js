/* NEXACRAFT | New creature models v1: sculpt/preview only, not world spawns.
 * All species face local -Z and use no downloaded textures.
 * Their rig groups can be animated by animateNewMob() in a future AI system.
 */
export const NEW_MOBS=[
  {id:'deer',name:'シカ',kind:'草食・森',height:'約2.8ブロック'},
  {id:'wolf',name:'オオカミ',kind:'肉食・森',height:'約1.8ブロック'},
  {id:'bear',name:'ヒグマ',kind:'大型・森林',height:'約2.5ブロック'},
  {id:'boar',name:'イノシシ',kind:'草原・森',height:'約1.6ブロック'},
  {id:'spider',name:'巨大クモ',kind:'洞窟・夜',height:'約1.2ブロック'},
  {id:'eagle',name:'ワシ',kind:'飛行・山岳',height:'翼幅約4.2ブロック'},
  {id:'crocodile',name:'ワニ',kind:'水辺・沼地',height:'全長約4.9ブロック'},
  {id:'shark',name:'サメ',kind:'海洋',height:'全長約4.3ブロック'},
  {id:'elephant',name:'ゾウ',kind:'草原',height:'約3.8ブロック'},
  {id:'golem',name:'ストーンゴーレム',kind:'山岳・準ボス',height:'約3.5ブロック'}
];
export function createNewMobModels(THREE){
  const materials=new Map();
  const mat=c=>{
    if(!materials.has(c))materials.set(c,new THREE.MeshLambertMaterial({color:c}));
    return materials.get(c);
  };
  const block=(g,w,h,d,c,x=0,y=0,z=0,rz=0,rx=0)=>{
    const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat(c));
    m.position.set(x,y,z);m.rotation.set(rx,0,rz);m.castShadow=true;
    m.receiveShadow=true;g.add(m);return m;
  };
  function pivot(g,x,y,z){const p=new THREE.Group();p.position.set(x,y,z);g.add(p);return p}
  function leg(g,x,z,atY,height,size,color,hoof){
    const p=pivot(g,x,atY,z);
    block(p,size,height,size*.96,color,0,-height*.50);
    block(p,size+.08,.14,size+.10,hoof,0,-height+.05,-.05);
    (g.userData.walkLegs??=[]).push(p);return p;
  }
  function legs4(g,x,z,atY,height,size,color,hoof){
    for(const sx of [-x,x])for(const sz of [-z,z])leg(g,sx,sz,atY,height,size,color,hoof);
  }
  function eye(g,x,y,z,c=0x121516){
    block(g,.105,.115,.055,0x29221d,x,y,z+.029);
    block(g,.075,.082,.041,c,x,y,z);
  }
  // Deer: long pastern legs, angular muzzle and elaborately forked antlers.
  function buildDeer(){
    const g=new THREE.Group(),fur=0xb47340,bright=0xcb965e,dark=0x5a392a;
    block(g,.90,.71,1.50,fur,0,1.50,.04);
    block(g,.83,.11,1.22,bright,0,1.90,.01);
    block(g,.70,.12,1.22,0xdac5a3,0,1.13,.05);
    block(g,.45,.98,.50,bright,0,1.98,-.67,-.21);
    block(g,.43,.45,.48,fur,0,2.39,-1.04);
    block(g,.31,.23,.48,0xc69b75,0,2.26,-1.43,.11);
    block(g,.28,.09,.13,0x3a2a22,0,2.29,-1.71);
    for(const side of [-1,1]){
      block(g,.24,.18,.18,fur,side*.34,2.56,-1.07,side*.19);
      block(g,.16,.075,.09,0xf1c7ae,side*.35,2.58,-1.14,side*.19);
      eye(g,side*.15,2.44,-1.287,0x30281e);
      block(g,.13,.49,.14,dark,side*.20,2.83,-1.02,side*-.13);
      block(g,.13,.58,.13,0xb99a75,side*.32,3.20,-.97,side*-.15);
      block(g,.11,.33,.13,0xd1b793,side*.45,3.49,-1.03,side*-.18);
      for(let k=0;k<3;k++)
        block(g,.10,.29,.10,k===2?0xe4d0ae:0xb99a75,
          side*(.35+k*.16),3.07+k*.19,-1.13+k*.17,
          side*(k===0?.35:.24));
    }
    block(g,.20,.34,.18,0xe3c8a2,0,1.62,.87,-.25);
    legs4(g,.33,.51,1.27,1.18,.16,fur,dark);
    for(const p of g.userData.walkLegs)block(p,.14,.08,.16,bright,0,-.66);
    return g;
  }
  // Wolf: athletic outline, long snout, pointed ears and curled thick tail.
  function buildWolf(){
    const g=new THREE.Group(),fur=0x737780,slate=0x555962,silver=0xa1a4a5,white=0xcdcbbe;
    block(g,1.03,.81,1.67,fur,0,1.05,.12);
    block(g,.88,.17,1.53,slate,0,1.47,.12);
    block(g,.81,.18,1.25,white,0,.66,-.02);
    block(g,.89,.90,.72,slate,0,1.20,-.61);
    block(g,.75,.56,.68,fur,0,1.43,-1.03);
    block(g,.51,.24,.62,white,0,1.18,-1.52,.04);
    block(g,.30,.15,.19,0x262729,0,1.26,-1.88);
    block(g,.41,.06,.25,0x38363a,0,1.05,-1.63);
    for(const side of [-1,1]){
      block(g,.25,.36,.19,slate,side*.24,1.83,-1.00,-side*.11);
      block(g,.13,.22,.17,0xc2abb1,side*.24,1.85,-1.12,-side*.11);
      eye(g,side*.21,1.46,-1.37,0xe7c66e);
      block(g,.065,.07,.035,0x202328,side*.21,1.46,-1.41);
      block(g,.20,.08,.14,white,side*.19,1.09,-1.73);
    }
    const tail=pivot(g,0,1.24,1.01);
    block(tail,.28,.33,.78,slate,0,.18,.33,.28);
    block(tail,.31,.34,.41,silver,0,.30,.68,.23);
    g.userData.tail=tail;
    legs4(g,.36,.54,1.05,.85,.25,slate,0x3c4148);
    return g;
  }
  // Bear: humped shoulder and massive paws, small round ears and claws.
  function buildBear(){
    const g=new THREE.Group(),fur=0x62442f,dark=0x3b291f,honey=0x8c6443;
    block(g,1.65,1.25,2.06,fur,0,1.32,.23);
    block(g,1.75,.63,1.00,dark,0,2.07,-.48);
    block(g,1.49,.24,1.52,honey,0,2.02,.42);
    block(g,1.12,.89,.89,fur,0,1.73,-1.15);
    block(g,.83,.36,.49,honey,0,1.41,-1.68);
    block(g,.42,.17,.20,0x222024,0,1.53,-1.99);
    block(g,.42,.12,.27,dark,0,1.25,-1.85);
    for(const side of [-1,1]){
      block(g,.28,.29,.21,fur,side*.42,2.22,-1.22);
      block(g,.15,.17,.07,0xb18e6b,side*.42,2.24,-1.33);
      eye(g,side*.30,1.86,-1.605,0x11151a);
    }
    legs4(g,.58,.69,1.15,1.06,.47,fur,dark);
    for(const p of g.userData.walkLegs)for(const d of [-.16,0,.16])
      block(p,.095,.15,.21,0xcdbda8,d,-1.03,-.27,-.30);
    return g;
  }
  // Boar: bristly ridge, prominent curved ivory tusks and broad muzzle.
  function buildBoar(){
    const g=new THREE.Group(),fur=0x594337,shade=0x332b28,rust=0x78604b;
    block(g,1.24,.89,1.64,fur,0,.95,.16);
    block(g,1.34,.91,.83,shade,0,1.13,-.50);
    for(let k=0;k<7;k++){
      const y=1.58+Math.sin(k/6*Math.PI)*.15;
      block(g,.27,.20,.29,k%2?shade:rust,0,y,-.74+k*.23,-.20);
    }
    block(g,.91,.69,.72,rust,0,1.05,-1.01);
    block(g,.59,.29,.36,shade,0,.87,-1.49);
    block(g,.67,.32,.12,0x947569,0,.95,-1.66);
    for(const side of [-1,1]){
      block(g,.10,.10,.065,shade,side*.20,.96,-1.740);
      block(g,.23,.29,.11,shade,side*.31,1.52,-1.08,side*-.25);
      eye(g,side*.28,1.24,-1.34);
      block(g,.15,.27,.17,0xbcb39a,side*.36,1.00,-1.45,-side*.26);
      block(g,.105,.22,.13,0xf0e5c8,side*.41,1.20,-1.53,side*.34);
    }
    block(g,.13,.11,.25,shade,0,1.06,1.10,.23);
    legs4(g,.43,.50,.83,.69,.27,fur,shade);
    return g;
  }
  // Spider: eight separately pivoted, jointed legs; red multi-eye array.
  function buildSpider(){
    const g=new THREE.Group(),carapace=0x252333,belly=0x402e42,black=0x17141e,glow=0xf74463;
    block(g,1.08,.49,1.06,carapace,0,.75,-.48);
    block(g,1.32,.74,1.41,belly,0,.83,.66);
    block(g,1.19,.14,1.20,0x62516a,0,1.24,.66);
    block(g,.76,.31,.11,black,0,.68,-1.06);
    for(const side of [-1,1]){
      for(const x of [.14,.37])block(g,.115,.10,.055,glow,side*x,.90,-1.044);
      block(g,.13,.27,.17,0xe5e0d8,side*.22,.54,-1.11,side*.21);
    }
    for(let i=0;i<4;i++)for(const side of [-1,1]){
      const z=-.82+i*.47;
      const legPivot=pivot(g,side*.48,.87,z);
      const joint=block(legPivot,.61,.18,.22,carapace,side*.35,.22,0,side*.47);
      block(legPivot,.20,.53,.19,black,side*.72,-.18,side*(i-1.5)*.06,side*-.17);
      block(legPivot,.23,.11,.26,0x554760,side*.73,-.48,side*(i-1.5)*.06);
      (g.userData.spiderLegs??=[]).push({p:legPivot,side,i});
    }
    return g;
  }
  // Eagle: sweeping articulated wings and separate layered feather tips.
  function buildEagle(){
    const g=new THREE.Group(),brown=0x77502e,plume=0x9b6a3d,dark=0x463325,white=0xf0ede1;
    block(g,.80,.73,1.24,brown,0,1.45,.10);
    block(g,.62,.66,.54,white,0,1.83,-.56);
    block(g,.48,.40,.51,white,0,1.94,-.88);
    block(g,.21,.18,.28,0xcda248,0,1.79,-1.26);
    block(g,.09,.16,.13,0xd9aa43,0,1.68,-1.41,.36);
    for(const side of [-1,1]){
      eye(g,side*.20,1.96,-1.128,0x272323);
      const wing=pivot(g,side*.39,1.76,-.06);
      block(wing,1.14,.17,.68,brown,side*.57,.0,0,side*.10);
      block(wing,1.05,.10,.48,plume,side*1.23,-.13,-.02,side*.07);
      for(let i=0;i<6;i++){
        block(wing,.27,.10,.53,i%2?dark:0x8c6037,
          side*(.38+i*.235),-.22,.19+i*.045,side*.07);
      }
      (g.userData.wings??=[]).push({p:wing,side});
      block(g,.16,.33,.17,0xb9a250,side*.22,.94,.36);
      for(let i=-1;i<=1;i++)block(g,.08,.10,.29,0xbdb18b,side*.22+i*.09,.78,.12,.0);
    }
    for(let i=-2;i<=2;i++)block(g,.16,.10,.62,i%2?plume:dark,i*.16,1.25,.92+i*.05,0,-.22);
    g.userData.floatY=0.16;
    return g;
  }
  // Crocodile: exceptionally long jaw, dorsal scutes and tapering tail.
  function buildCrocodile(){
    const g=new THREE.Group(),hide=0x4b6640,back=0x2a4430,scales=0x6e8052,belly=0xb8b589;
    block(g,1.32,.63,2.40,hide,0,.68,.07);
    block(g,1.18,.18,2.06,belly,0,.36,.08);
    for(let z=-.94;z<=1.0;z+=.35)for(const x of [-.38,0,.38])
      block(g,.24,.12,.25,(Math.round(z*8)+Math.round(x*10))%2?back:scales,x,1.07,z);
    block(g,1.07,.52,.93,hide,0,.72,-1.45);
    block(g,.87,.24,.98,hide,0,.55,-2.25);
    block(g,.92,.12,1.05,belly,0,.34,-2.18);
    block(g,.90,.17,.43,back,0,.65,-2.70);
    for(const side of [-1,1]){
      block(g,.27,.23,.26,back,side*.40,.99,-1.70);
      eye(g,side*.40,1.08,-1.79,0xdfb35a);
      block(g,.14,.075,.10,0x141b16,side*.30,.74,-2.84);
      for(let i=0;i<5;i++)
        block(g,.065,.13,.14,0xe6dec6,side*.41,.37,-1.73-i*.25,.24);
    }
    const tail=pivot(g,0,.67,1.19);
    for(let i=0;i<5;i++){
      const w=1.11-i*.19;
      block(tail,w,.55-i*.08,.67,hide,0,-i*.035,(i+.5)*.62);
      block(tail,w*.52,.15,.31,back,0,.24-i*.03,(i+.5)*.62);
    }
    g.userData.tail=tail;
    legs4(g,.54,.83,.68,.48,.29,hide,back);
    return g;
  }
  // Shark: low-poly water body, separate dorsal/pectoral fins and swishing tail.
  function buildShark(){
    const g=new THREE.Group(),blue=0x577789,top=0x344c61,white=0xd0dce0,ink=0x15242b;
    block(g,1.32,.83,2.10,blue,0,1.16,-.16);
    block(g,1.22,.16,1.88,white,0,.76,-.19);
    block(g,1.00,.66,.88,top,0,1.14,-1.44);
    block(g,.75,.16,.56,white,0,.82,-1.80);
    block(g,.56,.17,.25,ink,0,.76,-1.87);
    for(const side of [-1,1]){
      eye(g,side*.45,1.32,-1.77);
      for(let k=0;k<4;k++)block(g,.032,.26,.08,ink,side*.655,1.16,-.95+k*.15);
      const fin=block(g,.89,.14,.62,top,side*.93,.89,-.06,side*-.22);
      fin.rotation.y=side*.13;
      block(g,.21,.11,.35,blue,side*.68,1.43,.77);
    }
    // Swept dorsal fin and tiny second fin.
    block(g,.19,.67,.55,top,0,1.77,.03,-.36);
    block(g,.17,.31,.25,top,0,1.64,1.05,-.18);
    const tail=pivot(g,0,1.12,.96);
    block(tail,.56,.48,1.26,blue,0,0,.55);
    block(tail,.25,.24,.64,top,0,0,1.18);
    block(tail,.23,.92,.28,top,0,.13,1.57,.23);
    block(tail,.20,.56,.27,top,0,-.49,1.56,-.19);
    g.userData.tail=tail;g.userData.floatY=.10;
    return g;
  }
  // Elephant: monumental form, enormous ears, hanging jointed trunk, tusks.
  function buildElephant(){
    const g=new THREE.Group(),grey=0x85898e,slate=0x686f76,light=0xa2a8ad,ivory=0xf0e3c9;
    block(g,2.32,1.87,2.90,grey,0,2.09,.22);
    block(g,2.19,.23,2.61,light,0,3.13,.16);
    block(g,1.72,1.78,1.39,grey,0,2.60,-1.30);
    block(g,1.35,.92,.64,slate,0,2.16,-2.01);
    for(const side of [-1,1]){
      block(g,.23,1.43,.91,slate,side*1.15,2.83,-1.19,side*-.11);
      block(g,.13,1.21,.77,0xc38e90,side*1.29,2.83,-1.24,side*-.11);
      eye(g,side*.55,2.98,-2.045,0x25272c);
      block(g,.27,.25,.26,0xb1b1a8,side*.58,3.05,-2.10);
      block(g,.29,.62,.30,ivory,side*.62,2.02,-2.24,side*.20);
      block(g,.23,.43,.24,ivory,side*.78,1.89,-2.50,side*.43);
      block(g,.16,.32,.19,0xfff0d6,side*.93,1.96,-2.70,side*.46);
    }
    const trunk=pivot(g,0,2.56,-2.25);
    for(let i=0;i<6;i++){
      block(trunk,.55-i*.062,.45,.52-i*.05,i%2?grey:slate,
        0,-i*.35,-i*.11,-i*.035);
    }
    block(trunk,.35,.22,.35,light,0,-2.13,-.67);
    g.userData.trunk=trunk;
    legs4(g,.77,.95,1.51,1.43,.69,grey,slate);
    block(g,.22,.17,.70,slate,0,2.03,1.91,-.26);
    return g;
  }
  // Golem: broad independently swinging fists, rocky plating and glowing core.
  function buildStoneGolem(){
    const g=new THREE.Group(),stone=0x858c8d,slate=0x51595d,dark=0x394449,moss=0x547457,core=0x83ebc7;
    block(g,1.86,1.73,1.04,slate,0,2.09,.04);
    block(g,2.03,.23,1.22,stone,0,2.99,.01);
    block(g,1.37,1.12,1.20,stone,0,2.12,-.02);
    block(g,.76,.40,.74,slate,0,1.24,.12);
    block(g,.87,.78,.78,stone,0,3.20,-.08);
    block(g,.74,.13,.19,dark,0,3.25,-.49);
    for(const side of [-1,1]){
      block(g,.23,.15,.065,core,side*.23,3.39,-.496);
      const arm=pivot(g,side*1.09,2.77,.01);
      block(arm,.81,.98,.88,slate,0,-.43,0);
      block(arm,.78,.34,.93,stone,0,-.92,0);
      block(arm,.95,.66,1.01,dark,0,-1.31,-.08);
      block(arm,.48,.14,.25,moss,side*.13,-.31,-.47);
      (g.userData.arms??=[]).push({p:arm,side});
      const foot=leg(g,side*.48,.12,1.33,1.20,.73,stone,slate);
      block(foot,.75,.15,.32,dark,0,-1.10,-.18);
    }
    block(g,.45,.52,.18,slate,0,2.04,-.66);
    block(g,.31,.34,.11,core,0,2.04,-.785);
    block(g,.16,.20,.07,0xd4fff2,0,2.04,-.85);
    for(const [x,y,z] of [[-.58,2.64,-.52],[.66,1.73,-.59],[0,2.81,.61],[-.31,1.14,-.54]])
      block(g,.18,.31,.07,moss,x,y,z,.18);
    return g;
  }
  const builders={deer:buildDeer,wolf:buildWolf,bear:buildBear,boar:buildBoar,
    spider:buildSpider,eagle:buildEagle,crocodile:buildCrocodile,shark:buildShark,
    elephant:buildElephant,golem:buildStoneGolem};
  return {
    builders,
    build(id){const fn=builders[id];if(!fn)throw new Error('Unknown mob '+id);
      const g=fn();g.userData.newMobType=id;return g;},
    animate(g,t,walking=true){
      const rig=g.userData;
      const speed=rig.newMobType==='bear'||rig.newMobType==='elephant'?.6:1;
      const stride=walking?Math.sin(t*5*speed)*.31:0;
      for(const [i,leg]of (rig.walkLegs||[]).entries())
        leg.rotation.x=((i===0||i===3)?1:-1)*stride;
      for(const {p,side,i}of rig.spiderLegs||[]){
        p.rotation.z=side*(.07+Math.sin(t*7+i*Math.PI*.7+(side>0?Math.PI:0))*.16);
        p.rotation.y=Math.sin(t*6+i*.9)*.17;
      }
      for(const {p,side}of rig.wings||[])
        p.rotation.z=side*(.17+Math.sin(t*4.5)*.42);
      if(rig.tail)rig.tail.rotation.y=Math.sin(t*3.5)*.19;
      if(rig.trunk)rig.trunk.rotation.x=Math.sin(t*1.9)*.10;
      for(const {p,side}of rig.arms||[])
        p.rotation.x=side*Math.sin(t*2.3)*.19;
      // Movement and network snapshots own the root position. Bob only the
      // display rig so flying/swimming mobs never teleport back to spawn height.
      if(rig.floatY&&rig.stepVisual)
        rig.stepVisual.position.y=Math.sin(t*2)*rig.floatY;
    }
  };
}
