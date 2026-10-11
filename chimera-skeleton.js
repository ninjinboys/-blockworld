/**
 * NEXACRAFT: CHIMERA ANATOMICAL SKELETON v2 — real Three.js Bone graph
 *
 * ONLY THE BONES — NOT the old lion model, not fur, a texture, or an image.
 * 1 unit = 1 Minecraft-like block. Front = local -Z. Ground = Y=0.
 * This file is the source of truth for future boss mesh skinning.
 */
export const CHIMERA_ARMATURE=Object.freeze({
  version:2,name:'キメラ / 基本骨格',
  shoulderHeight:3.45,hipHeight:2.60,
  shoulderWidth:2.65,forefootWidth:3.68,hipWidth:1.75,
  bodyFromZ:-1.65,bodyToZ:2.16,skullNoseZ:-3.72,
  tailHeadHeight:4.53,status:'骨格の検証段階・表皮装飾なし'
});
export const CHIMERA_MOVEMENT=Object.freeze({
  walk:4.8,charge:8.8,walkStride:1.16,chargeStride:1.85
});
export function buildChimeraSkeleton(T){
  const root=new T.Group();root.name='CHIMERA / SKELETON — JOINTS ONLY';
  const bones=new T.Group();bones.name='THE BONES';root.add(bones);
  const cage=new T.Group();cage.name='ANATOMICAL MASS VOLUMES';root.add(cage);
  const axes=new T.Group();axes.name='HORN CENTRELINE GUIDES';root.add(axes);
  const marks=new T.Group();marks.name='PIVOT JOINTS';root.add(marks);
  const mats={
    spine:new T.MeshStandardMaterial({color:0xe6d7b4,roughness:.73,metalness:.06}),
    fore:new T.MeshStandardMaterial({color:0x56d4d6,roughness:.70}),
    hind:new T.MeshStandardMaterial({color:0xe7b077,roughness:.70}),
    tail:new T.MeshStandardMaterial({color:0x86d8a0,roughness:.72}),
    skull:new T.MeshStandardMaterial({color:0xf1d58e,roughness:.68}),
    axis:new T.MeshStandardMaterial({color:0xb6b5bf,roughness:.72}),
    mass:new T.MeshStandardMaterial({color:0x6982a9,roughness:.88,
      opacity:.15,transparent:true,depthWrite:false,side:T.DoubleSide}),
    boneMass:new T.MeshStandardMaterial({color:0xd1b996,roughness:.91,
      opacity:.20,transparent:true,depthWrite:false,side:T.DoubleSide})
  };
  const tube=new T.CylinderGeometry(1,1,1,10,1,false);
  const sphere=new T.SphereGeometry(1,14,10);
  const UP=new T.Vector3(0,1,0);
  const rods=[],joints=new Map(),volumes=[];
  const makeVec=(a)=>new T.Vector3(a[0],a[1],a[2]);
  const lerp=(a,b,k)=>a+(b-a)*k;
  function positionRod(item,a,b){
    const p=makeVec(a),q=makeVec(b);
    const d=q.clone().sub(p),len=Math.max(.000001,d.length());
    item.mesh.position.copy(p).add(q).multiplyScalar(.5);
    item.mesh.quaternion.setFromUnitVectors(UP,d.normalize());
    item.mesh.scale.set(item.radius,len,item.radius);
    item.a=[...a];item.b=[...b];
  }
  function rod(label,a,b,radius=.10,type='spine',parent=bones){
    const mesh=new T.Mesh(tube,mats[type]);mesh.name=label;
    mesh.castShadow=true;parent.add(mesh);
    const item={mesh,radius,type,a:[...a],b:[...b]};rods.push(item);
    positionRod(item,a,b);return item;
  }
  function line(name,points,r=.06,type='spine',parent=bones){
    const out=[];
    for(let k=1;k<points.length;k++)
      out.push(rod(name+' '+k,points[k-1],points[k],r,type,parent));
    return out;
  }
  function marker(label,pos,size=.12,type='skull',parent=marks){
    const mesh=new T.Mesh(sphere,mats[type]);mesh.name=label;
    mesh.position.set(...pos);mesh.scale.setScalar(size);
    parent.add(mesh);joints.set(label,mesh);return mesh;
  }
  function setJoint(label,pos){const x=joints.get(label);if(x)x.position.set(...pos)}
  function volume(label,pos,scales,type='mass'){
    const mesh=new T.Mesh(sphere,mats[type]);mesh.name=label;
    mesh.position.set(...pos);mesh.scale.set(...scales);
    cage.add(mesh);volumes.push(mesh);return mesh;
  }
  const restSpine=[
    [0,3.22,-1.60],[0,3.45,-1.27],[0,3.39,-.68],
    [0,3.24,-.02],[0,3.10,.64],[0,2.91,1.22],
    [0,2.68,1.74],[0,2.49,2.13]
  ];
  line('LONG FELINE SPINE',restSpine,.114,'spine');
  restSpine.forEach((pt,i)=>marker('vertebra'+i,pt,.095,'spine'));
  // Multiple distinct chest masses. Powerful high withers, deep brisket,
  // narrow middle ribs, broad thick hindquarters.
  volume('SHOULDERS ARE 2.8 BLOCKS WIDE',[0,2.43,-1.07],
    [1.42,1.06,.91]);
  volume('DEEP CHEST WITH CURVED BREASTBONE',[0,2.16,-.38],
    [1.24,1.03,1.40]);
  volume('TAPERED LOIN',[0,2.13,.79],[.86,.73,.80]);
  volume('WIDE PELVIS + THIGHS',[0,2.26,1.64],[1.06,.91,.78]);
  // Rib cage is transparent, articulated volumes are distinct from bones.
  for(let row=0;row<7;row++){
    const z=-1.28+row*.35,w=1.18-row*.038,h=3.36-row*.065;
    const hoop=[
      [0,h,z],[-w*.69,h-.22,z],[-w,h-.58,z],
      [-w*.94,h-1.05,z],[-w*.51,h-1.42,z],
      [0,h-1.54,z],[w*.51,h-1.42,z],
      [w*.94,h-1.05,z],[w,h-.58,z],
      [w*.69,h-.22,z],[0,h,z]
    ];
    line('RIB ARC '+row,hoop,.032,'spine',cage);
  }
  rod('HEAVY FORWARD BRISKET',[0,1.26,-1.50],
    [0,1.42,-.23],.12,'spine');
  const legs={},legOrder=[];
  for(const side of [-1,1]){
    const name=side<0?'L':'R';
    line('SHOULDER BLADE '+name,[
      [side*.51,3.56,-1.41],[side*1.21,3.11,-1.22],
      [side*1.33,2.90,-1.40]
    ],.142,'spine');
    line('PELVIC ARCH '+name,[
      [side*.25,2.81,1.54],[side*.80,2.72,1.61],
      [side*.88,2.52,1.70]
    ],.133,'spine');
    const fore={
      id:'fore'+name,kind:'fore',side,
      shoulder:[side*1.32,2.93,-1.36],
      elbow:[side*1.59,1.70,-1.83],
      wrist:[side*1.80,.74,-2.22],
      paw:[side*1.84,.23,-2.63],
      toe:[side*1.84,.18,-3.05],
      L1:1.39,L2:1.35
    };
    const hind={
      id:'hind'+name,kind:'hind',side,
      shoulder:[side*.88,2.49,1.69],
      elbow:[side*.98,1.57,1.09],
      wrist:[side*1.02,.76,2.27],
      paw:[side*1.04,.23,2.46],
      toe:[side*1.04,.18,2.79],
      L1:1.24,L2:1.34
    };
    for(const leg of [fore,hind]){
      legs[leg.id]=leg;legOrder.push(leg.id);
      const tint=leg.kind==='fore'?'fore':'hind';
      const s=leg.id;
      const jointsRest=[
        [s+'Shoulder',leg.shoulder,.20],
        [s+'Joint',leg.elbow,.145],
        [s+'Ankle',leg.wrist,.129],
        [s+'Paw',leg.paw,.15],
        [s+'Toe',leg.toe,.11]
      ];
      for(const [k,p,r] of jointsRest)marker(k,p,r,tint);
      leg.segments={
        upper:rod(s+' UPPER BONES',leg.shoulder,leg.elbow,
          leg.kind==='fore'?.175:.174,tint),
        shin:rod(s+' FOREARM / TIBIA',leg.elbow,leg.wrist,
          .131,tint),
        ankle:rod(s+' WRIST / HOCK TO PAW',leg.wrist,leg.paw,
          .124,tint),
        paw:rod(s+' PAW SKELETON',leg.paw,leg.toe,.129,tint)
      };
      if(leg.kind==='fore'){
        const m=volume(s+' 0.8-BLOCK SHOULDERS',
          [leg.shoulder[0],2.15,-1.54],[.45,.83,.53],'boneMass');
        m.rotation.x=-.25;
      }else{
        const m=volume(s+' MUSCULAR THIGHS',
          [leg.shoulder[0],2.03,1.71],[.53,.76,.70],'boneMass');
        m.rotation.x=.17;
      }
    }
  }
  // Lion's massive head must be IN FRONT of the shoulders, with a
  // real long down-sloping neck, a cranium and a separate jaw arch.
  const neck=[
    [0,3.32,-1.55],[0,3.51,-1.98],
    [0,3.61,-2.43],[0,3.52,-2.94],
    [0,3.36,-3.29]
  ];
  line('CERVICAL VERTEBRAE',neck,.133,'skull');
  neck.forEach((pt,i)=>marker('cervical'+i,pt,.13,'skull'));
  volume('MASSIVE NECK (NOT MANE)',[0,3.06,-1.99],
    [1.27,1.18,1.01],'mass');
  volume('LION CRANIUM',[0,3.46,-3.06],[.79,.64,.79],'boneMass');
  volume('LION SNOUT SKULL',[0,3.19,-3.61],[.52,.36,.45],'boneMass');
  line('FELINE UPPER PROFILE',[
    [0,3.72,-2.72],[0,3.58,-3.28],[0,3.26,-3.75]
  ],.074,'skull');
  line('LION LOWER JAW',[
    [-.45,3.08,-2.99],[-.38,2.90,-3.44],
    [0,2.90,-3.80],[.38,2.90,-3.44],
    [.45,3.08,-2.99]
  ],.081,'skull');
  marker('lionChin',[0,2.90,-3.80],.13,'skull');
  // Horn growth direction guides only. Actual horns are for AFTER
  // the proportions are approved, never baked into this skeletal pass.
  for(const side of [-1,1]){
    line('HORN ROOT GUIDE '+side,[
      [side*.62,3.83,-2.81],[side*1.16,3.82,-2.83],
      [side*1.81,3.79,-2.80],[side*2.35,4.08,-2.80],
      [side*2.65,4.53,-2.76],[side*2.69,4.96,-2.71]
    ],.052,'axis',axes);
  }
  // Tail emerges from the sacrum; coils to the model's LEFT (-X).
  // From front, the snake visibly occupies the opposite half of the
  // overall silhouette, just like the user's approved reference art.
  const serpent=[
    [0,2.46,2.09],[0,2.34,2.48],
    [-.48,2.09,3.08],[-1.23,1.90,3.61],
    [-2.21,1.89,3.99],[-3.14,2.06,4.00],
    [-3.83,2.53,3.73],[-4.18,3.28,3.34],
    [-4.09,4.03,2.77],[-3.70,4.51,2.17],
    [-3.22,4.65,1.42],[-3.06,4.51,.96]
  ];
  const radius=[.65,.67,.66,.64,.60,.56,.50,.45,.37,.30,.25,.20];
  line('ONE CONTINUOUS REPTILE TAIL SPINE',serpent,.14,'tail');
  for(let i=0;i<serpent.length;i++){
    marker('snakeTailJoint'+i,serpent[i],radius[i]*.23+.042,'tail');
    volume('SNAKE THICKNESS RADIUS '+i,serpent[i],
      [radius[i],radius[i],radius[i]],'mass');
  }
  volume('RAISED SNAKE CRANIUM',[-3.06,4.50,.62],
    [.58,.43,.87],'boneMass');
  line('SNAKE UPPER JAW',[
    serpent[serpent.length-1],[-3.06,4.44,.22],
    [-3.06,4.35,-.20]
  ],.092,'tail');
  line('SNAKE LOWER JAW',[
    [-3.06,4.28,.70],[-3.06,4.05,-.17]
  ],.07,'tail');

  function solveIK(start,end,L1,L2,bend){
    const A=makeVec(start),B=makeVec(end),delta=B.clone().sub(A);
    const D=Math.min(L1+L2-.004,Math.max(.01,delta.length()));
    const unit=delta.normalize();
    const a=(D*D+L1*L1-L2*L2)/(2*D);
    const h=Math.sqrt(Math.max(0,L1*L1-a*a));
    const n=makeVec(bend);
    n.addScaledVector(unit,-n.dot(unit));
    if(n.length()<.00001)n.set(0,0,-1);
    n.normalize();
    const joint=A.clone().addScaledVector(unit,a).addScaledVector(n,h);
    return [joint.x,joint.y,joint.z];
  }
  // -------- REAL THREE.JS BONE HIERARCHY (SKINNABLE) --------
  // Previously, adding decorative boxes changed no underlying skeleton.
  // This is an explicit Three.js Skeleton with named hierarchical bones,
  // rest/bind matrices and stable pivot positions; a future SkinnedMesh
  // can bind to these nodes instead of inventing its own proportions.
  const rootBone=new T.Bone();
  rootBone.name='CHIMERA_WORLD_ROOT';
  root.add(rootBone);
  const skinBones=[rootBone],bindRest=new Map();
  bindRest.set(rootBone,[0,0,0]);
  function bind(name,parent,world){
    const parentWorld=bindRest.get(parent);
    if(!parentWorld)throw Error('Missing parent rest transform: '+name);
    const joint=new T.Bone();
    joint.name=name;
    joint.position.set(world[0]-parentWorld[0],
      world[1]-parentWorld[1],world[2]-parentWorld[2]);
    parent.add(joint);
    bindRest.set(joint,[...world]);
    skinBones.push(joint);
    return joint;
  }
  const spineBones=[];
  for(let i=0;i<restSpine.length;i++)
    spineBones.push(bind('vertebra_'+i,
      i===0?rootBone:spineBones[i-1],restSpine[i]));
  const neckBones=[];
  for(let i=0;i<neck.length;i++)
    neckBones.push(bind('cervical_'+i,
      i===0?spineBones[0]:neckBones[i-1],neck[i]));
  const skullBone=bind('lion_cranium',neckBones.at(-1),
    [0,3.48,-3.18]);
  const jawBone=bind('lion_lower_jaw',skullBone,[0,2.90,-3.52]);
  const legBones={};
  for(const key of legOrder){
    const leg=legs[key];
    const parent=leg.kind==='fore'?spineBones[1]:spineBones[6];
    const shoulderBone=bind(key+'_shoulder',parent,leg.shoulder);
    const jointBone=bind(key+'_'+(leg.kind==='fore'?'elbow':'knee'),
      shoulderBone,leg.elbow);
    const ankleBone=bind(key+'_'+(leg.kind==='fore'?'wrist':'hock'),
      jointBone,leg.wrist);
    const pawBone=bind(key+'_paw',ankleBone,leg.paw);
    const toeBone=bind(key+'_toe',pawBone,leg.toe);
    legBones[key]={shoulder:shoulderBone,joint:jointBone,
      ankle:ankleBone,paw:pawBone,toe:toeBone};
    leg.boneGraph=legBones[key];
  }
  const snakeBones=[];
  for(let i=0;i<serpent.length;i++)
    snakeBones.push(bind('anaconda_vertebra_'+i,
      i===0?spineBones.at(-1):snakeBones[i-1],serpent[i]));
  const snakeSkullBone=bind('anaconda_head',
    snakeBones.at(-1),[-3.06,4.50,.62]);
  const snakeJawBone=bind('anaconda_lower_jaw',
    snakeSkullBone,[-3.06,4.09,-.17]);
  // The root has already been attached to the visible model. Evaluate the
  // bind pose before computing inverse rest matrices.
  root.updateMatrixWorld(true);
  const threeSkeleton=new T.Skeleton(skinBones);
  const skeleton={
    legs,legOrder,serpent,tailRadii:radius,restSpine,neck,
    joints,rods,volumeGroup:cage,axesGroup:axes,
    realBones:threeSkeleton,skinBones,rootBone,spineBones,neckBones,
    skullBone,jawBone,legBones,snakeBones,snakeSkullBone,snakeJawBone,
    bindRest,
    solveIK,positionRod,setJoint,
    showVolumes(on){cage.visible=on;},
    showHornGuides(on){axes.visible=on;},
    snapshot(){return {
      shoulderSpan:2*1.32,forefootSpan:2*1.84,hipSpan:2*.88,
      torsoZSpan:2.20-(-1.66),skullReach:-3.80,
      serpentBase:[...serpent[0]],serpentHead:[...serpent.at(-1)]
    }}
  };
  root.userData.skeleton=skeleton;
  root.userData.chimeraSkeletonOnly=true;
  root.userData.chimeraVersion='SKELETON_02_HIERARCHICAL_BONES';
  return root;
}

/** A physical leg is solved from shoulder->wrist and separate paw targets:
 * it has an ELBOW/KNEE rather than a rigid swinging post. */
export function animateChimeraSkeleton(model,time,mode='idle'){
  const s=model?.userData?.skeleton;if(!s)return null;
  const active=mode===true||mode==='walk'||mode==='charge',rush=mode==='charge';
  const elapsed=Number.isFinite(s.previous)?Math.max(0,Math.min(.06,time-s.previous)):1/60;
  s.previous=time;
  if(!Number.isFinite(s.gaitPhase))s.gaitPhase=0;
  const stride=rush?CHIMERA_MOVEMENT.chargeStride:CHIMERA_MOVEMENT.walkStride;
  if(active)s.gaitPhase+=elapsed*(rush?8.8:4.8)/stride;
  const ease=1-Math.exp(-elapsed*18);
  for(const key of s.legOrder){
    const leg=s.legs[key],fore=leg.kind==='fore';
    const diagonal=(key==='foreL'||key==='hindR')?0:.5;
    const p=(s.gaitPhase+diagonal)%1,stance=.63;
    const swing=p>=stance;
    const t=swing?(p-stance)/(1-stance):p/stance;
    const reach=swing?stride*(.5-t):stride*(t-.5);
    const lift=swing?(rush?.50:.35)*Math.sin(t*Math.PI):0;
    const z=leg.paw[2]+(active?reach:0);
    const paw=[leg.paw[0],leg.paw[1]+lift,z];
    const wrist=[leg.wrist[0],leg.wrist[1]+lift,
      z+(leg.wrist[2]-leg.paw[2])];
    const mid=s.solveIK(leg.shoulder,wrist,leg.L1,leg.L2,
      fore?[0,.3,-1]:[0,.12,-1]);
    const toe=[leg.toe[0],leg.toe[1]+lift,z+leg.toe[2]-leg.paw[2]];
    if(!leg.display)leg.display={
      mid:[...leg.elbow],wrist:[...leg.wrist],paw:[...leg.paw],toe:[...leg.toe]
    };
    for(const [part,target] of [
      ['mid',mid],['wrist',wrist],['paw',paw],['toe',toe]
    ]){
      for(let i=0;i<3;i++)
        leg.display[part][i]+=(target[i]-leg.display[part][i])*ease;
    }
    const q=leg.display;
    s.positionRod(leg.segments.upper,leg.shoulder,q.mid);
    s.positionRod(leg.segments.shin,q.mid,q.wrist);
    s.positionRod(leg.segments.ankle,q.wrist,q.paw);
    s.positionRod(leg.segments.paw,q.paw,q.toe);
    s.setJoint(key+'Joint',q.mid);
    s.setJoint(key+'Ankle',q.wrist);
    s.setJoint(key+'Paw',q.paw);
    s.setJoint(key+'Toe',q.toe);
    // Update the genuine 5-bone limb hierarchy as well as the visible
    // segments. This keeps future skinning aligned to the physical joints.
    const hierarchy=leg.boneGraph;
    hierarchy.joint.position.set(q.mid[0]-leg.shoulder[0],
      q.mid[1]-leg.shoulder[1],q.mid[2]-leg.shoulder[2]);
    hierarchy.ankle.position.set(q.wrist[0]-q.mid[0],
      q.wrist[1]-q.mid[1],q.wrist[2]-q.mid[2]);
    hierarchy.paw.position.set(q.paw[0]-q.wrist[0],
      q.paw[1]-q.wrist[1],q.paw[2]-q.wrist[2]);
    hierarchy.toe.position.set(q.toe[0]-q.paw[0],
      q.toe[1]-q.paw[1],q.toe[2]-q.paw[2]);
  }
  // Evaluate the articulated world-space bone tree after leg IK.
  model.updateMatrixWorld(true);
  const amp=active?(rush?.11:.055):0;
  return {mode:active?(rush?'charge':'walk'):'idle',
    verticalShift:amp*Math.sin(s.gaitPhase*Math.PI*4)**2,
    phase:s.gaitPhase};
}
