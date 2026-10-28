/* NEXACRAFT right-hand 3D viewmodel, matched to current inventory icon IDs.
 * Camera-attached so it never changes world interaction/raycasting.
 * No external textures. Hotbar art uses the game's existing drawItemIcon().
 */
import {makeNewHeldItemModel} from './item-held-models.js?v=20261020spearBlade03';
import {makeJobWeaponModel,jobWeapon,jobHeldWeaponScale,jobHeldBladeYaw} from './job-system.js?v=20261023bowFacingForward24';
import {PVP_WEAPON_BY_ID,makePvpWeaponModel} from './pvp-weapon-models.js?v=20261028originalShapes20';
const baseJobWeapon=jobWeapon,baseMakeJobWeaponModel=makeJobWeaponModel,baseScale=jobHeldWeaponScale,baseYaw=jobHeldBladeYaw;
const pvpJobWeapon=id=>PVP_WEAPON_BY_ID.get(id)||baseJobWeapon(id);
const pvpMakeWeapon=(T,id)=>PVP_WEAPON_BY_ID.has(id)?makePvpWeaponModel(T,id):baseMakeJobWeaponModel(T,id);
const pvpHeldScale=(id,view)=>PVP_WEAPON_BY_ID.has(id)?(view==='first'?.48:.40):baseScale(id,view);
const pvpHeldYaw=id=>PVP_WEAPON_BY_ID.has(id)?0:baseYaw(id);


export function makeFirstPersonHand(THREE,{scene,camera,drawItemIcon,getHeld,getOffhand=()=>null,isGuarding=()=>false,isVisible,getMovement,isMining,isHurt=()=>false}){
  const basic=(color)=>new THREE.MeshBasicMaterial({
    color,depthTest:true,depthWrite:true,toneMapped:false
  });
  const skin=basic(0xd4a078),skinSide=basic(0xbc8760);
  const jacket=basic(0x247f9b),jacketShade=basic(0x185569),cuff=basic(0x38a5b6);
  const root=new THREE.Group();
  root.name='NEXACRAFT right hand and held item';
  // Minecraft-like pose: sleeve enters from the bottom-right and the fist
  // points diagonally UP-LEFT.  Keep the requested original hand/weapon scale.
  // World depth testing is preserved so walls and foliage occlude the hand.
  const FIRST_PERSON_ARM_X=1.07;
  const FIRST_PERSON_ARM_Y=-.96;
  const FIRST_PERSON_ARM_Z=-1.08;
  const FIRST_PERSON_ARM_TILT=.35;
  root.position.set(FIRST_PERSON_ARM_X,FIRST_PERSON_ARM_Y,FIRST_PERSON_ARM_Z);
  root.rotation.z=FIRST_PERSON_ARM_TILT;
  const pivot=new THREE.Group();
  root.add(pivot);
  const shape=(parent,w,h,d,material,x,y,z)=>{
    const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);
    mesh.position.set(x,y,z);
    mesh.renderOrder=10000;
    mesh.frustumCulled=false;
    parent.add(mesh);return mesh;
  };
  // A square sleeved player forearm extends from the bottom-right corner
  // into a distinct hand at the wrist. Colors match the actual 3D player.
  shape(pivot,.28,.69,.31,jacket,0,-.13,.00);
  shape(pivot,.30,.11,.33,jacketShade,0,.18,.00);
  shape(pivot,.292,.06,.337,cuff,0,.24,.002);
  shape(pivot,.258,.25,.287,skin,0,.385,-.012);
  shape(pivot,.083,.133,.11,skinSide,-.156,.385,-.086);
  const held=new THREE.Group();
  held.position.set(-.018,.60,-.155);
  pivot.add(held);
  // A separate left-arm rig appears only while a torch occupies offhand.
  // It enters from the bottom-left, without moving the right-hand tool.
  const leftRoot=new THREE.Group();
  leftRoot.name='NEXACRAFT offhand left arm';
  const OFFHAND_X=-1.18,OFFHAND_Y=-.99,OFFHAND_Z=-1.14,OFFHAND_TILT=-.43;
  leftRoot.position.set(OFFHAND_X,OFFHAND_Y,OFFHAND_Z);
  leftRoot.rotation.z=OFFHAND_TILT;
  shape(leftRoot,.28,.68,.31,jacket,0,-.14,0);
  shape(leftRoot,.30,.11,.33,jacketShade,0,.18,0);
  shape(leftRoot,.292,.065,.337,cuff,0,.24,0);
  shape(leftRoot,.258,.25,.287,skin,0,.385,-.012);
  shape(leftRoot,.084,.135,.11,skinSide,.157,.39,-.085);
  const leftTorch=new THREE.Group();
  leftTorch.position.set(0,.60,-.155);
  leftRoot.add(leftTorch);
  // Mercenary and Berserker each visibly hold their second blade in the
  // left fist instead of displaying two parallel swords in one hand.
  const jobDualBlades=new Map();
  // Cancel the left arm's -0.43 roll at the weapon grip (not at the
  // player's shoulder), keeping the 90-degree edge-forward yaw intact.
  const leftBladeStraightener=new THREE.Group();
  leftBladeStraightener.position.set(.025,.60,-.16);
  leftBladeStraightener.rotation.z=.50;
  leftRoot.add(leftBladeStraightener);
  for(const id of [191,200]){
    const model=pvpMakeWeapon(THREE,id);
    model.position.set(0,0,0);
    // Opposite-hand blades mirror the yaw: present the thin cutting edge.
    model.rotation.set(-.13,-.32-pvpHeldYaw(id),.20);
    model.scale.setScalar(pvpHeldScale(id,'first'));
    model.visible=false;
    leftBladeStraightener.add(model);
    jobDualBlades.set(id,model);
  }
  const torchBrown=basic(0x825025),torchLightWood=basic(0xb77a39),torchBand=basic(0x4b3528);
  const torchOrange=basic(0xff8b12),torchYellow=basic(0xffd850),torchWhite=basic(0xfff4b0);
  shape(leftTorch,.11,.49,.11,torchBrown,0,.20,0);
  shape(leftTorch,.044,.43,.018,torchLightWood,-.035,.20,-.055);
  shape(leftTorch,.135,.11,.13,torchBand,0,.49,0);
  shape(leftTorch,.16,.21,.16,torchOrange,0,.64,0);
  shape(leftTorch,.105,.17,.11,torchYellow,0,.72,-.012);
  shape(leftTorch,.062,.10,.070,torchWhite,0,.77,-.025);
  const offhandGlow=new THREE.PointLight(0xffaa49,1.2,4,2);
  offhandGlow.position.set(0,.75,-.07);leftTorch.add(offhandGlow);
  // A proper angular heater shield, wide at the shoulders and pointed below.
  // Both the torch and shield use the same offhand; no item duplication.
  const shield=new THREE.Group();
  shield.name='NEXACRAFT pointed offhand shield';
  const shieldWood=basic(0x795033),shieldPlank=basic(0x9e6d43);
  const shieldRim=basic(0x89969a),shieldBright=basic(0xc4d0d2);
  const shieldBoss=basic(0xb2c0c4),shieldDark=basic(0x48545a);
  // Extruded outlines give a single continuous shield silhouette instead of
  // the old rectangular slab; negative local Z is toward the camera.
  const shieldPlate=(points,z,depth,material)=>{
    const outline=new THREE.Shape();
    outline.moveTo(points[0][0],points[0][1]);
    for(let i=1;i<points.length;i++)outline.lineTo(points[i][0],points[i][1]);
    outline.closePath();
    const mesh=new THREE.Mesh(new THREE.ExtrudeGeometry(outline,{
      depth,steps:1,bevelEnabled:false,curveSegments:1
    }),material);
    mesh.position.z=z;
    mesh.renderOrder=10000;
    mesh.frustumCulled=false;
    shield.add(mesh);
  };
  // Dark metal edge, brighter raised steel rim, inset wooden face.
  shieldPlate([
    [-.44,1.10],[.44,1.10],[.52,1.00],[.52,.63],[.43,.38],
    [0,.04],[-.43,.38],[-.52,.63],[-.52,1.00]
  ],-.13,.20,shieldDark);
  shieldPlate([
    [-.42,1.075],[.42,1.075],[.49,.98],[.49,.63],[.39,.40],
    [0,.085],[-.39,.40],[-.49,.63],[-.49,.98]
  ],-.20,.07,shieldRim);
  shieldPlate([
    [-.36,1.015],[.36,1.015],[.425,.945],[.425,.64],[.34,.44],
    [0,.175],[-.34,.44],[-.425,.64],[-.425,.945]
  ],-.255,.045,shieldPlank);
  // Visible timber boards remain inside the tapered silhouette.
  shape(shield,.012,.65,.014,shieldWood,-.165,.68,-.281);
  shape(shield,.012,.65,.014,shieldWood,.165,.68,-.281);
  shape(shield,.050,.61,.022,shieldWood,0,.68,-.294);
  // Solid, squared iron boss and rivets emphasize that this is a shield.
  shape(shield,.29,.29,.080,shieldBoss,0,.69,-.340);
  shape(shield,.17,.17,.090,shieldBright,0,.69,-.392);
  for(const x of [-.39,.39])for(const y of [.67,.94]){
    shape(shield,.065,.065,.065,shieldBright,x,y,-.283);
  }
  // Twice as tall DOWNWARD: anchor its top edge at its original
  // screen height, and let the pointed end extend toward the bottom.
  // The .98 -> 1.96 Y scale adds 1.078 units above the former top
  // without compensation, so lower the entire shield by 1.078.
  shield.scale.set(.98,1.96,.98);
  shield.position.set(-.08,-1.058,-.40);
  shield.rotation.set(-.08,-.08,-.02);
  shield.visible=false;
  leftRoot.add(shield);
  leftRoot.visible=false;
  const blockColors={
    1:0x6a9b3c,2:0x81532f,3:0x888d8e,4:0xd6c28b,5:0x3486bc,
    6:0x946332,7:0x508b39,8:0x383a41,9:0xa39b8d,10:0xc7a13b,
    11:0x3acbd3,12:0xe8eff4,13:0x9e988e,14:0x398a40,
    15:0xc18d53,16:0x7f8182,17:0xbddfe1,18:0x25252b,
    19:0x8c552e,20:0x767b81,21:0xae5250,32:0x8c572e
  };
  let currentId=null,object=null,swingTime=0,swingStyle='swing',walkPhase=0,lastMineSwing=0;
  const itemMat=(c)=>basic(c);
  function clearHeld(){
    if(!object)return;
    held.remove(object);
    object.traverse(child=>{
      if(child.geometry)child.geometry.dispose();
      if(child.material){
        const ms=Array.isArray(child.material)?child.material:[child.material];
        for(const m of ms){m.map?.dispose();m.dispose();}
      }
    });
    object=null;
  }
  // The grip is at local Y=0. The palm visibly wraps the handle and the
  // tool projects diagonally upward into the screen (not a flat hotbar icon).
  const TIERS={
    wood:{main:0x95602d,shine:0xc88f48,edge:0x603c23},
    stone:{main:0x82888b,shine:0xbec5c6,edge:0x50565a},
    iron:{main:0xc2ccd1,shine:0xf1f6fa,edge:0x87949f},
    gold:{main:0xe0b432,shine:0xffe780,edge:0x986d14},
    diamond:{main:0x36c6d6,shine:0xa2fbff,edge:0x16808c}
  };
  const swordIds=new Set([111,115,119,123]);
  const CHIMERA_DAGGER=164,CHIMERA_BOW=166;
  const pickIds=new Set([104,105,114,118,122]);
  const axeIds=new Set([112,116,120,124,138]);
  const shovelIds=new Set([113,117,121,125]);
  function tierOf(id){
    if([104,138].includes(id))return TIERS.wood;
    if([105,111,112,113].includes(id))return TIERS.stone;
    if([114,115,116,117].includes(id))return TIERS.iron;
    if([118,119,120,121].includes(id))return TIERS.gold;
    return TIERS.diamond;
  }
  function part(parent,w,h,d,material,x,y,z,rz=0){
    const m=shape(parent,w,h,d,material,x,y,z);
    m.rotation.z=rz;
    return m;
  }
  // Weapon handles remain mostly vertical on-screen despite the diagonal arm.
  // The grip stays attached to the end of the forearm as in Minecraft.
  function craftWeapon(id){
    const tool=new THREE.Group(),metal=tierOf(id);
    const main=itemMat(metal.main),shine=itemMat(metal.shine),
      edge=itemMat(metal.edge),wood=itemMat(0x7e5331),
      woodHi=itemMat(0xa97948),binding=itemMat(0x463729);
    tool.name='3D voxel '+id;
    const handle=(long=false)=>{
      part(tool,.098,long?.69:.34,.108,wood,0,long?.29:0,0);
      part(tool,.037,long?.64:.27,.013,woodHi,-.028,long?.29:0,-.059);
      part(tool,.117,.12,.116,binding,0,-.11,0);
    };
    if(swordIds.has(id)){
      // Stone / iron / gold / diamond swords are ALL single-edged katana.
      // A real curved, BROAD blade replaces the old rapier-shaped spike.
      const grip=itemMat(0x302b36),wrap=itemMat(0xd4c4a6);
      handle();
      part(tool,.145,.37,.145,grip,0,.07,0);
      for(let j=0;j<5;j++){
        const y=-.065+j*.079;
        part(tool,.161,.032,.16,j%2?wrap:binding,0,y,0);
      }
      // Compact, flat Japanese guard (tsuba) and blade collar.
      part(tool,.50,.075,.36,edge,0,.322,0);
      part(tool,.39,.093,.43,main,0,.331,0);
      part(tool,.24,.115,.18,shine,0,.382,0);
      // Extend the BLADE, not the grip: six sweeping sections with a
      // recognizable long katana tip. Previous tip was at Y=1.28.
      const katanaBlade=[
        [.005,.50,.295,-.040],
        [.028,.71,.300,-.060],
        [.060,.93,.292,-.085],
        [.108,1.16,.270,-.115],
        [.170,1.38,.238,-.155],
        [.235,1.56,.180,-.230]
      ];
      for(const [x,y,w,tilt] of katanaBlade){
        part(tool,w,.235,.175,main,x,y,0,tilt);
        part(tool,.062,.231,.183,shine,x-w*.31,y,-.001,tilt);
        part(tool,.050,.225,.181,edge,x+w*.33,y,.004,tilt);
      }
      part(tool,.145,.180,.120,main,.285,1.73,0,-.34);
      part(tool,.060,.170,.125,shine,.225,1.72,-.010,-.34);
      part(tool,.042,.145,.105,edge,.332,1.75,.008,-.34);
      tool.rotation.set(-.18,.26,-.60);
      tool.scale.set(.90,.90,.90);
    }else if(pickIds.has(id)){
      handle(true);
      // Turn the pickaxe to face left/right: YAW +90deg. Keep Z tilt unchanged.
      part(tool,.49,.135,.158,main,0,.683,0);
      part(tool,.42,.048,.085,shine,0,.756,-.015);
      part(tool,.16,.14,.145,edge,-.27,.658,0,.36);
      part(tool,.16,.14,.145,edge,.27,.658,0,-.36);
      part(tool,.105,.12,.115,main,-.371,.612,0,.47);
      part(tool,.105,.12,.115,main,.371,.612,0,-.47);
      tool.rotation.set(-.18,-1.23,-.51);
      tool.scale.set(.88,.84,.88);
    }else if(axeIds.has(id)){
      handle(true);
      // Turn the axe head left/right around vertical Y axis (not Z-roll).
      part(tool,.32,.30,.18,main,-.12,.650,0);
      part(tool,.135,.39,.169,shine,-.292,.658,0);
      part(tool,.077,.36,.15,edge,-.385,.657,0);
      part(tool,.17,.13,.17,edge,.047,.650,0);
      tool.rotation.set(-.18,-1.23,-.51);
      tool.scale.set(.94,.91,.94);
    }else if(shovelIds.has(id)){
      handle(true);
      // Wide spade above a narrow shaft, not a flat 2D sprite.
      part(tool,.25,.31,.115,main,0,.765,0);
      part(tool,.215,.23,.052,shine,-.012,.769,-.063);
      part(tool,.18,.10,.108,edge,0,.574,0);
      part(tool,.12,.10,.10,main,0,.956,0);
      tool.rotation.set(-.16,.40,-.62);
      tool.scale.set(.89,.87,.89);
    }
    return tool;
  }
  function craftChimeraDagger(){
    // Fang-made short katana / wakizashi. Preserves the dagger's quick hit
    // gameplay and item name while matching the whole katana weapon family.
    const dagger=new THREE.Group();
    const grip=itemMat(0x392939),guard=itemMat(0xc39e78);
    const blade=itemMat(0xb39c88),edge=itemMat(0xffeacf);
    part(dagger,.15,.35,.15,grip,0,.07,0);
    for(let i=0;i<4;i++)
      part(dagger,.16,.035,.16,itemMat(i%2?0x785269:0xd5b68c),0,-.045+i*.087,0);
    part(dagger,.44,.072,.35,guard,0,.32,0);
    part(dagger,.31,.092,.34,itemMat(0x332b3d),0,.33,0);
    for(let i=0;i<4;i++){
      const x=[0,.025,.064,.116][i],y=.47+i*.165,w=i===3?.21:.28;
      part(dagger,w,.204,.15,blade,x,y,0,-.05-i*.032);
      part(dagger,.064,.204,.16,edge,x-w*.31,y,-.012,-.05-i*.032);
    }
    part(dagger,.16,.14,.12,edge,.163,1.113,0,-.22);
    dagger.rotation.set(-.18,.27,-.60);
    dagger.scale.set(.94,.87,.94);
    return dagger;
  }
  function craftChimeraBow(){
    const bow=new THREE.Group();
    const horn=itemMat(0x827781),hornEdge=itemMat(0xd0c1aa),string=itemMat(0xe9c97e);
    for(let i=0;i<=8;i++){
      const t=i/8,y=(t-.5)*1.19,x=-.29*Math.sin(Math.PI*t);
      part(bow,.10,.175,.12,i%2?horn:hornEdge,x,y,0,(t-.5)*.82);
    }
    part(bow,.024,1.22,.023,string,.07,0,-.04);
    part(bow,.16,.20,.16,itemMat(0x382639),-.3,0,0);
    part(bow,.085,.14,.08,hornEdge,.048,.625,0);
    part(bow,.085,.14,.08,hornEdge,.048,-.625,0);
    // Face the bow in the shooting direction, string in camera depth.
    bow.rotation.set(-.08,Math.PI/2,-.12);
    bow.scale.set(.90,.92,.90);
    return bow;
  }
  function craftBow(){
    const bow=new THREE.Group(),wood=itemMat(0x9d6133),
      highlight=itemMat(0xdba463),string=itemMat(0xe4d8b4);
    // Angled segmented wooden bow with a taut visible string.
    for(let i=0;i<9;i++){
      const t=i/8,y=(t-.5)*1.01,x=-.21*Math.sin(Math.PI*t);
      part(bow,.067,.16,.078,i%2?wood:highlight,x,y,0,
        (t-.5)*.55);
    }
    part(bow,.022,1.02,.021,string,.012,0,-.025);
    part(bow,.13,.18,.12,wood,-.19,.0,0);
    // The wooden bow also needs the same edge-forward shooting pose.
    bow.rotation.set(-.08,Math.PI/2,-.12);
    bow.scale.set(.86,.88,.86);
    return bow;
  }
  function fallbackSprite(id){
    const cv=document.createElement('canvas');cv.width=16;cv.height=16;
    const ctx=cv.getContext('2d');if(!ctx)return null;
    ctx.imageSmoothingEnabled=false;drawItemIcon(ctx,id);
    const tex=new THREE.CanvasTexture(cv);
    tex.magFilter=THREE.NearestFilter;
    tex.minFilter=THREE.NearestFilter;
    tex.colorSpace=THREE.SRGBColorSpace;
    const mat=new THREE.MeshBasicMaterial({
      map:tex,transparent:true,alphaTest:.075,side:THREE.DoubleSide,
      depthTest:true,depthWrite:true,toneMapped:false
    });
    const mesh=new THREE.Mesh(new THREE.PlaneGeometry(.40,.40),mat);
    mesh.rotation.set(-.07,.13,-.32);
    mesh.position.set(-.024,.115,-.012);
    return mesh;
  }
  function buildHeld(id){
    clearHeld();
    if(id==null)return;
    const placeBlock=Object.hasOwn(blockColors,id)&&id!==5;
    if(pvpJobWeapon(id)){
      object=pvpMakeWeapon(THREE,id);
      // A blade's wide XY face must NOT look back at the wielder.
      // Only rotate the hand-attached model; the gallery is unchanged.
      const kind=pvpJobWeapon(id).kind;
      if(kind==='bow'){
        // Hold the bow upright in the viewing plane, with its string and
        // full recurved limbs clearly visible, rather than edge-on and
        // leaning over the right half of the screen.
        // Bowstring should be behind the riser in DEPTH (toward the
        // archer), never displaced across the screen as a sideways bow.
        // The mesh is constructed in XY; quarter-turn yaw converts its
        // recurve/string separation from horizontal X to forward Z.
        object.rotation.set(-.06,Math.PI/2,-.12);
        object.position.set(-.12,-.04,-.20);
      }else if(kind==='shield'){
        // Front of the shield faces the viewer; the shield rests lower,
        // farther from the camera and to the right of the crosshair.
        object.rotation.set(-.05,-.16,-.18);
        object.position.set(.12,-.19,-.32);
      }else{
        object.rotation.set(-.16,.20+pvpHeldYaw(id),-.39);
      }
      // Only hand-attached instances shrink; workshop models stay full size.
      object.scale.setScalar(pvpHeldScale(id,'first'));
    }else if(id>=168&&id<=188){
      object=makeNewHeldItemModel(THREE,id);
      object.rotation.set(-.18,.28,-.58);
      object.scale.setScalar(.89);
    }else if(id===CHIMERA_DAGGER){
      object=craftChimeraDagger();
    }else if(id===CHIMERA_BOW){
      object=craftChimeraBow();
    }else if(swordIds.has(id)||pickIds.has(id)||axeIds.has(id)||shovelIds.has(id)){
      object=craftWeapon(id);
    }else if(id===149){
      object=craftBow();
    }else if(id===101||id===147||id===31){
      // Sticks and torches are long objects gripped at their bottom.
      object=new THREE.Group();
      const wood=itemMat(0x936232);
      part(object,.09,.57,.09,wood,0,.21,0);
      if(id!==101){
        const flame=itemMat(0xffc354),tip=itemMat(0xf18c20);
        part(object,.154,.16,.154,tip,0,.56,0);
        part(object,.105,.12,.105,flame,0,.66,0);
      }
      object.rotation.set(-.12,.28,-.16);
      object.scale.set(.90,.87,.90);
    }else if(placeBlock){
      const color=blockColors[id];
      const side=id===1?0x77532e:color;
      const top=id===1?0x6bb750:color;
      const materials=[side,side,top,side,color,color].map(itemMat);
      object=new THREE.Mesh(new THREE.BoxGeometry(.33,.33,.33),materials);
      object.rotation.set(.18,.52,-.18);
      object.position.set(.005,.025,-.015);
    }else{
      object=fallbackSprite(id);
    }
    if(!object)return;
    object.name='Held item '+id;
    object.traverse(n=>{if(n.isMesh||n.geometry){n.frustumCulled=false;n.renderOrder=10002}});
    held.add(object);
  }
  // Flash only skin, sleeves, and offhand arm; never recolor equipped tools,
  // torches or shields. Model and item materials are left untouched.
  const armParts=[...pivot.children,...leftRoot.children].filter(mesh=>mesh.isMesh)
    .map(mesh=>({mesh,original:mesh.material}));
  const hurtArmMaterial=basic(0xdb4545);
  let armDamageFlashing=false;
  camera.add(root,leftRoot);
  if(!camera.parent)scene.add(camera);
  root.visible=false;
  return {
    swing(power=1,style='swing'){
      swingTime=.39;
      swingStyle=style;
    },
    update(dt,now){
      const hit=Boolean(isHurt());
      if(hit!==armDamageFlashing){
        armDamageFlashing=hit;
        for(const {mesh,original} of armParts)
          mesh.material=hit?hurtArmMaterial:original;
      }
      const visible=Boolean(isVisible());
      root.visible=visible;
      const leftItem=getOffhand();
      const torchEquipped=leftItem?.id===147&&Number(leftItem.qty)>0;
      const shieldEquipped=leftItem?.id===156&&Number(leftItem.qty)>0;
      const st=getHeld();
      const id=(st && Number(st.qty)>0)?st.id:null;
      // The 90-degree model yaw exposed the arm's original roll as a
      // 20-degree lean. Counter-rotate the held weapon ONLY, leaving the
      // square forearm's Minecraft pose and all non-blade gear untouched.
      const straightenHeldBlade=pvpHeldYaw(id)!==0;
      const dualActive=pvpJobWeapon(id)?.kind==='dual'&&!torchEquipped&&!shieldEquipped;
      leftRoot.visible=visible&&(torchEquipped||shieldEquipped||dualActive);
      leftTorch.visible=torchEquipped;
      shield.visible=shieldEquipped;
      for(const [weaponId,blade] of jobDualBlades)blade.visible=dualActive&&weaponId===id;
      if(!visible)return;
      if(id!==currentId){currentId=id;buildHeld(id)}
      const movement=Math.min(1,Math.max(0,Number(getMovement())||0)/4.4);
      walkPhase+=dt*(7.8+movement*2.9);
      if(isMining() && now-lastMineSwing>440){
        lastMineSwing=now;swingTime=.39;
      }
      swingTime=Math.max(0,swingTime-dt);
      const swing=swingTime>0?Math.sin(Math.PI*(1-swingTime/.39)):0;
      const bob=movement*Math.sin(walkPhase)*.017;
      if(leftRoot.visible){
        const guarding=shieldEquipped&&isGuarding();
        leftRoot.position.set(
          OFFHAND_X+(guarding?.30:0)-bob*.40,
          OFFHAND_Y+(guarding?.27:0)+movement*Math.abs(Math.sin(walkPhase))*.02,
          OFFHAND_Z+(guarding?.11:0)
        );
        leftRoot.rotation.set(-swing*(dualActive?.20:.035),0,
          OFFHAND_TILT+(guarding?.19:0)+(dualActive?swing*.32:0)-bob*.18);
      }
      root.position.set(
        FIRST_PERSON_ARM_X+bob*.45,
        FIRST_PERSON_ARM_Y+movement*Math.abs(Math.sin(walkPhase))*.027,
        FIRST_PERSON_ARM_Z-(swingStyle==='thrust'?swing*.72:0)
      );
      root.rotation.set(-swing*(swingStyle==='thrust'?.30:.18),0,
        FIRST_PERSON_ARM_TILT-swing*(swingStyle==='thrust'?.09:.46)+bob*.25);
      pivot.rotation.x=.19-swing*(swingStyle==='thrust'?.16:.70);
      pivot.rotation.y=-.09;
      pivot.rotation.z=swing*.19;
      held.rotation.set(swingStyle==='thrust'?-swing*.80:swing*.08,0,
        (straightenHeldBlade?-.40:0)+
        (swingStyle==='thrust'?swing*.05:-swing*.15));
    }
  };
}
