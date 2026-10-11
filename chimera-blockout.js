/**
 * NEXACRAFT Chimera — ANATOMY BLOCKOUT v3.2 — lion head lifted in sync with anatomical bones
 *
 * Surface masses are built DIRECTLY on the redesigned Chimera Skeleton v3,
 * not on any of the previously rejected box-lion or fur models.
 *
 * Focus: silhouette and COM proportions, NOT ornament.
 * No mane strands, horns, eyes, scales, tusks, hair or gameplay boss AI.
 * Shell uses only tapering meshes, shoulder masses, bent limbs, skull/jaw
 * and a single continuous sculpted serpent coil rooted in the pelvis.
 *
 * Bone hierarchy can be displayed/hidden in viewer to verify fit.
 */
import {
  buildChimeraSkeleton,animateChimeraSkeleton,
  CHIMERA_ARMATURE,CHIMERA_MOVEMENT
} from './chimera-skeleton.js?v=20261011anatomyBones03';

export {CHIMERA_ARMATURE,CHIMERA_MOVEMENT};

const P={
  spine:0x494743,
  shoulder:0x716456,
  chest:0x69645b,
  belly:0x4a4644,
  pelvis:0x63574f,
  limb:0x806e5f,
  limbShade:0x584c45,
  forepaw:0x716256,
  head:0x8d7664,
  brow:0x736053,
  muzzle:0x9b8067,
  neck:0x796858,
  jaw:0x8f7362,
  mouth:0x251a1a,
  serpent:0x566154,
  serpentShadow:0x3a4b41,
  serpentLight:0x69705c,
  serpentHead:0x737b63,
  platform:0x3f3f3f
};
export function buildChimeraBlockout(T){
  const skeleton=buildChimeraSkeleton(T);
  skeleton.name='CHIMERA ANATOMICAL BLOCKOUT III / ORIGINAL STRUCTURE';
  const rig=skeleton.userData.skeleton;
  const mass=new T.Group();mass.name='MAJOR ANATOMICAL MASSES / NO FUR';
  skeleton.add(mass);
  const mat={};
  for(const [key,color] of Object.entries(P))
    mat[key]=new T.MeshStandardMaterial({
      color,metalness:0,roughness:.99,flatShading:true
    });
  const sph=new T.SphereGeometry(1,12,9);
  const up=new T.Vector3(0,1,0);
  const vector=(a)=>new T.Vector3(...a);
  const geometryObjects=[],major=[],limbMasses={},nameMap={};
  function record(m,label){
    m.name=label;
    m.castShadow=true;
    m.receiveShadow=true;
    m.userData.anatomicalBlockout=true;
    mass.add(m);major.push(m);nameMap[label]=m;
    return m;
  }
  function sphere(name,pos,rad,material,rotX=0,rotY=0,rotZ=0){
    const o=new T.Mesh(sph,mat[material]);
    o.position.set(...pos);
    o.scale.set(...rad);
    o.rotation.set(rotX,rotY,rotZ);
    return record(o,name);
  }
  function slab(name,pos,scale,material,rx=0,ry=0,rz=0){
    const box=new T.Mesh(new T.BoxGeometry(1,1,1),mat[material]);
    box.position.set(...pos);box.scale.set(...scale);
    box.rotation.set(rx,ry,rz);
    geometryObjects.push(box.geometry);
    return record(box,name);
  }
  function between(name,a,b,r1,r2,material){
    const o=new T.Mesh(sph,mat[material]);
    const item={mesh:record(o,name),r1,r2};
    positionBetween(item,a,b);
    return item;
  }
  function positionBetween(item,a,b){
    const p=vector(a),v=vector(b),delta=v.clone().sub(p);
    const len=delta.length();
    const center=p.clone().add(v).multiplyScalar(.5);
    item.mesh.position.copy(center);
    item.mesh.quaternion.setFromUnitVectors(up,delta.normalize());
    item.mesh.scale.set(item.r1,len*.68,item.r2);
  }
  // Underlying giant low-poly body, each outline profile [z, y, x-radius,
  // y-radius, color] controls an independent anatomical cross section.
  function ellipticalLoft(name,profile,materialName){
    const vertices=[],colors=[],indices=[],side=16;
    for(let i=0;i<profile.length;i++){
      const [z,y,wide,deep,color]=profile[i];
      const shade=new T.Color(color);
      for(let j=0;j<side;j++){
        const a=(j/side)*Math.PI*2;
        vertices.push(Math.cos(a)*wide,y+Math.sin(a)*deep,z);
        const factor=.93+.055*Math.cos(a+.3);
        colors.push(shade.r*factor,shade.g*factor,shade.b*factor);
      }
    }
    for(let k=0;k<profile.length-1;k++)for(let j=0;j<side;j++){
      const a=k*side+j,b=k*side+(j+1)%side;
      const c=(k+1)*side+j,d=(k+1)*side+(j+1)%side;
      indices.push(a,c,b,b,c,d);
    }
    for(let j=1;j<side-1;j++){
      indices.push(0,j,j+1);
      const end=(profile.length-1)*side;
      indices.push(end,end+j+1,end+j);
    }
    const g=new T.BufferGeometry();
    g.setAttribute('position',new T.Float32BufferAttribute(vertices,3));
    g.setAttribute('color',new T.Float32BufferAttribute(colors,3));
    g.setIndex(indices);
    g.computeVertexNormals();
    geometryObjects.push(g);
    const mesh=new T.Mesh(g,new T.MeshStandardMaterial({
      vertexColors:true,roughness:.98,metalness:0,flatShading:true,
      side:T.DoubleSide
    }));
    return record(mesh,name);
  }

  // =============================================================
  // PRIMARY MASS — a genuine massive, quadrupedal lion silhouette
  // No cheap short rectangular body or upright block shoulders.
  // =============================================================
  ellipticalLoft('1. SLANTED LONG MUSCULAR LION TRUNK',[
    [-2.18,2.43,.40,.63,P.shoulder],
    [-1.76,2.43,1.42,1.33,P.shoulder],
    [-1.24,2.47,1.74,1.46,P.chest],
    [-.67,2.40,1.59,1.33,P.spine],
    [-.08,2.30,1.38,1.17,P.belly],
    [.59,2.30,1.14,1.00,P.belly],
    [1.23,2.32,1.10,.99,P.spine],
    [1.76,2.40,1.24,1.11,P.pelvis],
    [2.26,2.47,1.26,1.13,P.pelvis],
    [2.73,2.47,.89,.94,P.pelvis],
    [3.01,2.50,.27,.43,P.limbShade]
  ],'spine');

  // Vast, visibly separate forequarter: body mass stretches continuously
  // down into shoulders at the front. Width dwarfs the narrower loin.
  sphere('2. LEFT HUGE LION SHOULDER',[-1.10,2.52,-1.43],
    [.96,1.38,1.02],'shoulder',.26,0,-.19);
  sphere('3. RIGHT HUGE LION SHOULDER',[1.10,2.52,-1.43],
    [.96,1.38,1.02],'shoulder',.26,0,.19);
  sphere('4. DEEP HANGING LION BRISKET',[0,1.82,-1.45],
    [1.24,1.15,1.05],'chest',-.18);
  sphere('5. DEEP HEAVY RIB CAGE',[0,2.01,-.54],
    [1.21,.96,1.35],'belly');
  sphere('6. NARROWER LOIN',[0,2.33,1.21],
    [1.02,.82,.96],'spine');
  sphere('7. ROUNDED HINDQUARTERS',[0,2.39,2.38],
    [1.27,1.08,1.03],'pelvis');

  // The reference's shoulders dominate the lion neck width and the head
  // emerges horizontally FORWARD. This is only muscle-blockout shape,
  // NOT a gold mane, hair or decorative collar.
  sphere('8. HEAVY PREDATOR NECK / ANATOMICAL MANTLE',[0,3.17,-2.17],
    [1.66,1.52,1.37],'neck',-.18);
  sphere('9. OUTWARD BROAD STERNUM',[0,2.18,-2.26],
    [1.24,.95,.95],'chest',-.16);

  // A real large elongated head, not a short cuboid attached to a fringe.
  sphere('10. ELONGATED WIDE LION CRANIUM',[0,3.99,-3.58],
    [1.21,.83,1.16],'head',-.12);
  for(const sign of [-1,1]){
    sphere('11. LION STRONG TEMPORAL CHEEKS '+sign,[sign*.84,3.62,-3.68],
      [.48,.63,.68],'brow');
  }
  sphere('12. GIGANTIC PROJECTED MUZZLE',[0,3.79,-4.24],
    [.84,.44,.63],'muzzle');
  sphere('13. BONY UPPER JAW RIDGE',[0,3.53,-4.27],
    [.78,.22,.55],'head');

  // Deep gaping lower jaw is not fused with the cranium.
  sphere('14. DEEP PREDATOR MOUTH CAVITY',[0,3.29,-4.10],
    [.72,.34,.46],'mouth');
  sphere('15. MASSIVE LOWER JAW',[0,3.00,-4.19],
    [.86,.27,.72],'jaw');
  sphere('16. STRONG JAW HINGE',[0,3.40,-3.55],
    [.84,.33,.48],'head');

  // Four articulated heavy legs, TRUE connected segment volumes.
  // Segment positions are updated in animateChimeraBlockout from IK.
  for(const id of rig.legOrder){
    const l=rig.legs[id];
    const fore=l.kind==='fore';
    const pieces={
      hip:sphere('MASSIVE '+id+' SHOULDER/HAUNCH',
        l.shoulder,fore?[.94,.98,.88]:[.91,1.02,.98],
        fore?'shoulder':'pelvis'),
      upper:between(id+' HEAVY THIGH/UPPER LEG',l.shoulder,l.elbow,
        fore?.73:.76,fore?.67:.66,fore?'limb':'pelvis'),
      joint:sphere(id+' LARGE CONNECTED ELBOW/KNEE',
        l.elbow,fore?[.56,.60,.53]:[.58,.62,.60],'limbShade'),
      lower:between(id+' ANGLED MUSCULAR FOREARM',l.elbow,l.wrist,
        fore?.49:.42,fore?.44:.41,fore?'limb':'limbShade'),
      hock:sphere(id+' ROBUST ANKLE/HOCK',l.wrist,
        fore?[.47,.46,.46]:[.42,.43,.45],'limb'),
      paw:sphere(id+' MASSIVE LION GROUNDED PAW',
        l.paw,fore?[.86,.32,.98]:[.67,.29,.84],'forepaw'),
      toes:sphere(id+' LARGE POWERFUL PAW TOES',
        l.toe,fore?[.80,.23,.59]:[.65,.21,.51],'forepaw')
    };
    limbMasses[id]=pieces;
  }

  // Thick serpent tail must be ONE unbroken volume growing out of the
  // rump. The coil is almost as visually dominant as the lion's trunk.
  // We use a real CatmullRom tube, with anatomy-driven radii measured at
  // exactly the 12 joint sections, not spheres or noisy caterpillar bumps.
  const pts=rig.serpent.map(x=>vector(x));
  const curve=new T.CatmullRomCurve3(pts,false,'centripetal');
  const count=80,sides=14,coords=[],colors=[],faces=[];
  const startRad=rig.tailRadii;
  function radius(t){
    const h=t*(startRad.length-1),i=Math.min(startRad.length-2,Math.floor(h));
    return startRad[i]*(1-(h-i))+startRad[i+1]*(h-i);
  }
  function surface(t,theta){
    const pos=curve.getPoint(t),tangent=curve.getTangent(t);
    const reference=Math.abs(tangent.y)>.88?
      new T.Vector3(1,0,0):new T.Vector3(0,1,0);
    const cross=new T.Vector3().crossVectors(tangent,reference).normalize();
    const binormal=new T.Vector3().crossVectors(tangent,cross).normalize();
    return pos.addScaledVector(cross,Math.cos(theta)*radius(t))
      .addScaledVector(binormal,Math.sin(theta)*radius(t)*.94);
  }
  for(let i=0;i<=count;i++){
    const t=i/count;
    for(let k=0;k<sides;k++){
      const v=surface(t,k/sides*Math.PI*2);
      coords.push(v.x,v.y,v.z);
      const shade=.88+.09*Math.cos(k/sides*Math.PI*2+.2);
      const col=new T.Color(i%12<4?P.serpentLight:
        i%12<9?P.serpent:P.serpentShadow);
      colors.push(col.r*shade,col.g*shade,col.b*shade);
    }
  }
  for(let i=0;i<count;i++)for(let k=0;k<sides;k++){
    const a=i*sides+k,b=i*sides+(k+1)%sides;
    const c=(i+1)*sides+k,d=(i+1)*sides+(k+1)%sides;
    faces.push(a,c,b,b,c,d);
  }
  for(let i=1;i<sides-1;i++){
    faces.push(0,i+1,i);
    const end=count*sides;
    faces.push(end,end+i,end+i+1);
  }
  const tailGeo=new T.BufferGeometry();
  tailGeo.setAttribute('position',new T.Float32BufferAttribute(coords,3));
  tailGeo.setAttribute('color',new T.Float32BufferAttribute(colors,3));
  tailGeo.setIndex(faces);tailGeo.computeVertexNormals();
  geometryObjects.push(tailGeo);
  const tail=new T.Mesh(tailGeo,new T.MeshStandardMaterial({
    vertexColors:true,roughness:1,metalness:0,flatShading:true,
    side:T.DoubleSide
  }));
  record(tail,'17. ONE CONTINUOUS HUGE SNAKE COIL ROOTED AT SACRUM');
  const snakeHead=sphere('18. EXPANDED RAISED SNAKE HEAD',
    [-3.24,5.17,.64],[.73,.47,.98],'serpentHead',-.12);
  sphere('19. LONG SNAKE MUZZLE',[-3.24,5.12,-.03],
    [.52,.24,.57],'serpentHead',-.11);
  sphere('20. SEPARATE SNAKE LOWER JAW',
    [-3.24,4.78,-.18],[.58,.15,.59],'serpent');
  // Anatomy, not complete skin: keep head and jaws in neutral clay.
  skeleton.userData._threeClass=T;
  skeleton.userData.chimeraBlockout={
    geometryObjects,materials:Object.values(mat),major,limbMasses,
    massGroup:mass,head:snakeHead,tail,
    setBonesVisible(on){
      // True IK rig remains live while visual skeleton overlay is hidden.
      for(const child of skeleton.children)
        if(child!==mass)child.visible=on;
    },
    setMassVisible(on){mass.visible=on;},
    getMassMeasurements(){return {
      lionSkullCenter:[0,3.99,-3.58],
      shoulderMass:[1.11,2.56,-1.39],
      brisketDepth:1.95-.99,
      frontFootWidth:2*2.08,
      rumpCenterZ:2.38,
      tailRoot:[...rig.serpent[0]],
      tailLast:[...rig.serpent.at(-1)],
      torsoLength:3.01-(-2.18),
      bodyVolumes:major.length,
      spineBones:rig.skinBones.length
    }}
  };
  skeleton.userData.chimeraModelPhase='reference-silhouette-blockout';
  skeleton.userData.chimeraVersion='CHIMERA_BODY_MASS_V3_2_RAISED_LION_HEAD';
  skeleton.userData.chimeraBlockout.setBonesVisible(false);
  return skeleton;
}

export function animateChimeraBlockout(root,time,mode='idle'){
  const rig=root?.userData?.skeleton,anatomy=root?.userData?.chimeraBlockout;
  if(!rig||!anatomy)return;
  const result=animateChimeraSkeleton(root,time,mode);
  // Drive visible mass to the ACTUAL joint solution. No separate pretend gait.
  for(const id of rig.legOrder){
    const l=rig.legs[id],m=anatomy.limbMasses[id];
    const pose=l.display||{
      mid:l.elbow,wrist:l.wrist,paw:l.paw,toe:l.toe
    };
    const V=(coords)=>new root.userData._threeClass.Vector3(...coords);
    const UP=new root.userData._threeClass.Vector3(0,1,0);
    function connect(item,a,b){
      const A=V(a),B=V(b),offset=B.clone().sub(A),len=offset.length();
      item.mesh.position.copy(A).add(B).multiplyScalar(.5);
      item.mesh.quaternion.setFromUnitVectors(UP,offset.normalize());
      item.mesh.scale.set(item.r1,len*.68,item.r2);
    }
    connect(m.upper,l.shoulder,pose.mid);
    connect(m.lower,pose.mid,pose.wrist);
    m.joint.position.set(...pose.mid);
    m.hock.position.set(...pose.wrist);
    m.paw.position.set(...pose.paw);
    m.toes.position.set(...pose.toe);
  }
  return result;
}
