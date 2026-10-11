/**
 * NEXACRAFT: CHIMERA ANATOMICAL SKELETON v3 — reference-accurate long, massive feline proportions
 *
 * ONLY THE BONES — NOT the old lion model, not fur, a texture, or an image.
 * 1 unit = 1 Minecraft-like block. Front = local -Z. Ground = Y=0.
 * This file is the source of truth for future boss mesh skinning.
 */
export const CHIMERA_ARMATURE=Object.freeze({
  version:3,name:'キメラ / 参考画像準拠の体型',
  shoulderHeight:3.70,hipHeight:2.74,
  shoulderWidth:3.0,forefootWidth:4.16,hipWidth:1.96,
  bodyFromZ:-1.83,bodyToZ:2.78,skullNoseZ:-4.30,
  tailHeadHeight:5.26,status:'骨格の検証段階・表皮装飾なし'
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
  // REFERENCE: high forward hump, continuous long barrel, descending rump.
  // Over 4.5 blocks of torso, not an upright compact cattle-body.
  const restSpine=[
    [0,3.46,-1.83],[0,3.72,-1.40],[0,3.66,-.72],
    [0,3.46,.04],[0,3.31,.80],[0,3.12,1.51],
    [0,2.87,2.20],[0,2.65,2.78]
  ];
  line('LONG FELINE SPINE',restSpine,.114,'spine');
  restSpine.forEach((pt,i)=>marker('vertebra'+i,pt,.095,'spine'));
  // Multiple distinct chest masses. Powerful high withers, deep brisket,
  // narrow middle ribs, broad thick hindquarters.
  volume('FORWARD HEAVY WITHERS (3 BLOCKS WIDE)',[0,2.55,-1.15],
    [1.57,1.21,1.10]);
  volume('DEEP BRISKET AND RIB CAGE',[0,2.23,-.24],
    [1.34,1.18,1.65]);
  volume('NARROWED ABDOMEN',[0,2.16,1.08],[.94,.77,1.03]);
  volume('WIDE HAUNCHES (BUILT FOR SPRING)',[0,2.37,2.17],[1.16,1.02,1.09]);
  // Rib cage is transparent, articulated volumes are distinct from bones.
  for(let row=0;row<7;row++){
    const z=-1.34+row*.46,w=1.29-row*.043,h=3.61-row*.072;
    const hoop=[
      [0,h,z],[-w*.69,h-.22,z],[-w,h-.58,z],
      [-w*.94,h-1.05,z],[-w*.51,h-1.42,z],
      [0,h-1.54,z],[w*.51,h-1.42,z],
      [w*.94,h-1.05,z],[w,h-.58,z],
      [w*.69,h-.22,z],[0,h,z]
    ];
    line('RIB ARC '+row,hoop,.032,'spine',cage);
  }
  rod('HEAVY FORWARD BRISKET',[0,1.20,-1.72],
    [0,1.40,-.15],.14,'spine');
  const legs={},legOrder=[];
  for(const side of [-1,1]){
    const name=side<0?'L':'R';
    line('SHOULDER BLADE '+name,[
      [side*.59,3.79,-1.57],[side*1.32,3.27,-1.42],
      [side*1.50,3.06,-1.51]
    ],.158,'spine');
    line('PELVIC ARCH '+name,[
      [side*.31,3.05,2.14],[side*.85,2.94,2.30],
      [side*.98,2.70,2.34]
    ],.148,'spine');
    const fore={
      id:'fore'+name,kind:'fore',side,
      shoulder:[side*1.50,3.07,-1.52],
      elbow:[side*1.87,1.72,-2.26],
      wrist:[side*2.05,.76,-2.76],
      paw:[side*2.08,.23,-3.10],
      toe:[side*2.08,.18,-3.62],
      L1:1.61,L2:1.55
    };
    const hind={
      id:'hind'+name,kind:'hind',side,
      shoulder:[side*.98,2.68,2.27],
      elbow:[side*1.10,1.66,1.64],
      wrist:[side*1.18,.79,3.08],
      paw:[side*1.20,.23,3.35],
      toe:[side*1.20,.18,3.75],
      L1:1.42,L2:1.53
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
          [leg.shoulder[0],2.28,-1.85],[.62,.92,.67],'boneMass');
        m.rotation.x=-.25;
      }else{
        const m=volume(s+' MUSCULAR THIGHS',
          [leg.shoulder[0],2.15,2.24],[.63,.90,.80],'boneMass');
        m.rotation.x=.17;
      }
    }
  }
  // Lion's massive head must be IN FRONT of the shoulders, with a
  // real long down-sloping neck, a cranium and a separate jaw arch.
  const neck=[
    [0,3.55,-1.64],[0,3.77,-2.16],
    [0,3.86,-2.65],[0,3.73,-3.24],
    [0,3.56,-3.73]
  ];
  line('CERVICAL VERTEBRAE',neck,.133,'skull');
  neck.forEach((pt,i)=>marker('cervical'+i,pt,.13,'skull'));
  volume('HEAVY HORIZONTAL NECK / SHOULDER TRANSITION',[0,3.19,-2.20],
    [1.42,1.22,1.23],'mass');
  volume('LARGE FANGED PREDATOR CRANIUM',[0,3.66,-3.52],
    [1.02,.76,.98],'boneMass');
  volume('DEEP PROJECTED LION MUZZLE',[0,3.30,-4.00],
    [.70,.43,.57],'boneMass');
  line('FELINE UPPER PROFILE',[
    [0,4.04,-3.11],[0,3.88,-3.75],[0,3.32,-4.36]
  ],.074,'skull');
  line('LION LOWER JAW',[
    [-.56,3.20,-3.38],[-.48,2.87,-3.91],
    [0,2.80,-4.35],[.48,2.87,-3.91],
    [.56,3.20,-3.38]
  ],.081,'skull');
  marker('lionChin',[0,2.80,-4.35],.15,'skull');
  // Horn growth direction guides only. Actual horns are for AFTER
  // the proportions are approved, never baked into this skeletal pass.
  for(const side of [-1,1]){
    line('HORN ROOT GUIDE '+side,[
      [side*.88,4.00,-3.35],[side*1.44,4.01,-3.36],
      [side*2.12,3.98,-3.38],[side*2.65,4.28,-3.38],
      [side*3.00,4.81,-3.34],[side*3.02,5.30,-3.32]
    ],.052,'axis',axes);
  }
  // Tail emerges from the sacrum; coils to the model's LEFT (-X).
  // From front, the snake visibly occupies the opposite half of the
  // overall silhouette, just like the user's approved reference art.
  // Sweep out from the animal's sacrum, make a giant S-bend visible
  // BESIDE the rump, then rise in a thick C-shaped vertical neck.
  const serpent=[
    [0,2.60,2.73],[0,2.43,3.20],
    [-.40,2.15,3.82],[-1.25,1.96,4.47],
    [-2.35,1.99,4.82],[-3.47,2.13,4.72],
    [-4.34,2.65,4.31],[-4.71,3.54,3.73],
    [-4.50,4.42,3.05],[-4.01,5.04,2.34],
    [-3.43,5.32,1.57],[-3.24,5.17,1.06]
  ];
  const radius=[.84,.86,.81,.78,.73,.67,.60,.54,.46,.38,.31,.24];
  line('ONE CONTINUOUS REPTILE TAIL SPINE',serpent,.14,'tail');
  for(let i=0;i<serpent.length;i++){
    marker('snakeTailJoint'+i,serpent[i],radius[i]*.23+.042,'tail');
    volume('SNAKE THICKNESS RADIUS '+i,serpent[i],
      [radius[i],radius[i],radius[i]],'mass');
  }
  volume('RAISED SNAKE CRANIUM',[-3.24,5.19,.70],
    [.72,.50,1.01],'boneMass');
  line('SNAKE UPPER JAW',[
    serpent[serpent.length-1],[-3.24,5.08,.24],
    [-3.24,4.94,-.40]
  ],.100,'tail');
  line('SNAKE LOWER JAW',[
    [-3.24,4.96,.71],[-3.24,4.66,-.35]
  ],.080,'tail');

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
    [0,3.70,-3.66]);
  const jawBone=bind('lion_lower_jaw',skullBone,[0,2.80,-4.02]);
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
    snakeBones.at(-1),[-3.24,5.19,.70]);
  const snakeJawBone=bind('anaconda_lower_jaw',
    snakeSkullBone,[-3.24,4.66,-.35]);
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
      shoulderSpan:2*1.50,forefootSpan:2*2.08,hipSpan:2*.98,
      torsoZSpan:2.78-(-1.83),skullReach:-4.36,
      serpentBase:[...serpent[0]],serpentHead:[...serpent.at(-1)]
    }}
  };
  root.userData.skeleton=skeleton;
  root.userData.chimeraSkeletonOnly=true;
  root.userData.chimeraVersion='SKELETON_03_HEAVY_FORWARD_REFERENCE';
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
