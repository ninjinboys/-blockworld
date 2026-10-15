/* NEXACRAFT right-hand 3D viewmodel, matched to current inventory icon IDs.
 * Camera-attached so it never changes world interaction/raycasting.
 * No external textures. Hotbar art uses the game's existing drawItemIcon().
 */
export function makeFirstPersonHand(THREE,{scene,camera,drawItemIcon,getHeld,isVisible,getMovement,isMining}){
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
  const FIRST_PERSON_ARM_TILT=.70;
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
  const blockColors={
    1:0x6a9b3c,2:0x81532f,3:0x888d8e,4:0xd6c28b,5:0x3486bc,
    6:0x946332,7:0x508b39,8:0x383a41,9:0xa39b8d,10:0xc7a13b,
    11:0x3acbd3,12:0xe8eff4,13:0x9e988e,14:0x398a40,
    15:0xc18d53,16:0x7f8182,17:0xbddfe1,18:0x25252b,
    19:0x8c552e,20:0x767b81,21:0xae5250,32:0x8c572e
  };
  let currentId=null,object=null,swingTime=0,walkPhase=0,lastMineSwing=0;
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
      handle();
      // Pointy, elongated blade. Color changes with stone/iron/gold/diamond.
      part(tool,.39,.090,.145,edge,0,.201,0); // crossguard
      part(tool,.30,.071,.16,main,0,.233,0);
      part(tool,.178,.45,.130,main,0,.475,0);
      part(tool,.047,.433,.142,shine,-.045,.47,-.001);
      part(tool,.148,.205,.116,main,0,.768,0);
      part(tool,.077,.129,.099,shine,0,.907,0);
      part(tool,.085,.08,.108,edge,0,.980,0);
      tool.rotation.set(-.18,.23,-.62);
      tool.scale.set(.91,.88,.91);
    }else if(pickIds.has(id)){
      handle(true);
      // Keep the pick shaft nearly vertical with just a slight leftward lean.
      part(tool,.49,.135,.158,main,0,.683,0);
      part(tool,.42,.048,.085,shine,0,.756,-.015);
      part(tool,.16,.14,.145,edge,-.27,.658,0,.36);
      part(tool,.16,.14,.145,edge,.27,.658,0,-.36);
      part(tool,.105,.12,.115,main,-.371,.612,0,.47);
      part(tool,.105,.12,.115,main,.371,.612,0,-.47);
      tool.rotation.set(-.18,-.34,-.51);
      tool.scale.set(.88,.84,.88);
    }else if(axeIds.has(id)){
      handle(true);
      // Keep axe shaft nearly upright; blade slightly left, not far left.
      part(tool,.32,.30,.18,main,-.12,.650,0);
      part(tool,.135,.39,.169,shine,-.292,.658,0);
      part(tool,.077,.36,.15,edge,-.385,.657,0);
      part(tool,.17,.13,.17,edge,.047,.650,0);
      tool.rotation.set(-.18,-.34,-.51);
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
    bow.rotation.set(-.15,.27,-.62);
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
    if(swordIds.has(id)||pickIds.has(id)||axeIds.has(id)||shovelIds.has(id)){
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
  camera.add(root);
  if(!camera.parent)scene.add(camera);
  root.visible=false;
  return {
    swing(power=1){
      swingTime=.39;
    },
    update(dt,now){
      const visible=Boolean(isVisible());
      root.visible=visible;
      if(!visible)return;
      const st=getHeld();
      const id=(st && Number(st.qty)>0)?st.id:null;
      if(id!==currentId){currentId=id;buildHeld(id)}
      const movement=Math.min(1,Math.max(0,Number(getMovement())||0)/4.4);
      walkPhase+=dt*(7.8+movement*2.9);
      if(isMining() && now-lastMineSwing>440){
        lastMineSwing=now;swingTime=.39;
      }
      swingTime=Math.max(0,swingTime-dt);
      const swing=swingTime>0?Math.sin(Math.PI*(1-swingTime/.39)):0;
      const bob=movement*Math.sin(walkPhase)*.017;
      root.position.set(
        FIRST_PERSON_ARM_X+bob*.45,
        FIRST_PERSON_ARM_Y+movement*Math.abs(Math.sin(walkPhase))*.027,
        FIRST_PERSON_ARM_Z
      );
      root.rotation.set(-swing*.18,0,FIRST_PERSON_ARM_TILT-swing*.46+bob*.25);
      pivot.rotation.x=.19-swing*.70;
      pivot.rotation.y=-.09;
      pivot.rotation.z=swing*.19;
      held.rotation.set(swing*.08,0,-swing*.15);
    }
  };
}
