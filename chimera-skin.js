/**
 * NEXACRAFT — CHIMERA UNPAINTED SKIN 01.
 * Built on anatomical skeleton V3.2. No old cuboid lion, fur, scales,
 * horns, eyes, fang sculpt, paint or boss AI. Uniform neutral clay skin.
 * Segmented legs follow the already-existing four-leg inverse kinematics.
 */
import {
  buildChimeraBlockout,animateChimeraBlockout,
  CHIMERA_ARMATURE,CHIMERA_MOVEMENT
} from './chimera-blockout.js?v=20261011bodyMassV3_skin01';
export {CHIMERA_ARMATURE,CHIMERA_MOVEMENT};
export const CHIMERA_SKIN_INFO=Object.freeze({
  version:1,type:'Single-color muscle/skin',noDecor:true
});
export function buildChimeraSkin(T){
  const root=buildChimeraBlockout(T);
  root.name='CHIMERA UNPAINTED SKIN / MUSCLE SHELL 01';
  const rig=root.userData.skeleton,inside=root.userData.chimeraBlockout;
  const skin=new T.Group();skin.name='UNCOLORED SMOOTH SKIN';root.add(skin);
  const material=new T.MeshStandardMaterial({
    color:0xc9c4bd,metalness:0,roughness:1,flatShading:false,
    side:T.DoubleSide
  });
  const meshes=[],geometries=[],limbs={};
  const ball=new T.SphereGeometry(1,20,16);geometries.push(ball);
  const vec=(a)=>new T.Vector3(...a),UP=new T.Vector3(0,1,0);
  function add(name,geometry){
    const mesh=new T.Mesh(geometry,material);
    mesh.name=name;mesh.castShadow=true;mesh.receiveShadow=true;
    mesh.userData.skinSurface=true;skin.add(mesh);meshes.push(mesh);
    return mesh;
  }
  function ellipsoid(name,p,r,rotate=[0,0,0]){
    const mesh=add(name,ball);
    mesh.position.set(...p);mesh.scale.set(...r);
    mesh.rotation.set(...rotate);
    return mesh;
  }
  const cat=(a,b,c,d,t)=>.5*((2*b)+(-a+c)*t+
    (2*a-5*b+4*c-d)*t*t+(-a+3*b-3*c+d)*t*t*t);
  function loft(name,profile){
    const sides=24,steps=7,ringCount=(profile.length-1)*steps+1;
    const points=[],tris=[];
    for(let i=0;i<ringCount;i++){
      const k=Math.min(profile.length-2,Math.floor(i/steps));
      const t=(i-k*steps)/steps,vals=[];
      for(let j=0;j<4;j++){
        const a=profile[Math.max(0,k-1)][j],b=profile[k][j],
          c=profile[k+1][j],d=profile[Math.min(profile.length-1,k+2)][j];
        vals.push(cat(a,b,c,d,t));
      }
      const [z,cy,wide,high]=vals;
      for(let a=0;a<sides;a++){
        const rad=a*2*Math.PI/sides,nx=Math.cos(rad),ny=Math.sin(rad);
        const bulge=.08*Math.exp(-(((z+1.45)/.8)**2));
        points.push(nx*(wide+bulge),cy+ny*high,z);
      }
    }
    for(let i=0;i<ringCount-1;i++)for(let j=0;j<sides;j++){
      const a=i*sides+j,b=i*sides+(j+1)%sides,
        c=(i+1)*sides+j,d=(i+1)*sides+(j+1)%sides;
      tris.push(a,b,c,b,d,c);
    }
    for(let j=1;j<sides-1;j++){
      tris.push(0,j,j+1);
      const end=(ringCount-1)*sides;
      tris.push(end,end+j+1,end+j);
    }
    const g=new T.BufferGeometry();
    g.setAttribute('position',new T.Float32BufferAttribute(points,3));
    g.setIndex(tris);g.computeVertexNormals();geometries.push(g);
    return add(name,g);
  }
  // One connected anatomical loft replaces overlapping boxes:
  // muzzle/head merge into lifted neck, massive deep chest, narrower
  // loin, large haunches. Surface remains smooth, uniformly clay colored.
  const torso=loft('CONTINUOUS LION SKIN — HEAD/NECK/CHEST/WAIST/HIPS',[
    [-5.03,3.74,.12,.15],[-4.78,3.83,.63,.32],
    [-4.36,3.94,.86,.49],[-3.99,4.03,1.12,.72],
    [-3.53,4.02,1.29,.90],[-3.09,3.82,1.45,1.15],
    [-2.66,3.45,1.56,1.29],[-2.27,3.05,1.69,1.44],
    [-1.84,2.58,1.74,1.47],[-1.25,2.50,1.80,1.49],
    [-.68,2.44,1.66,1.41],[-.01,2.39,1.45,1.23],
    [.66,2.39,1.25,1.09],[1.20,2.40,1.20,1.04],
    [1.82,2.44,1.32,1.14],[2.43,2.49,1.34,1.20],
    [2.92,2.51,.88,.97],[3.30,2.51,.13,.24]
  ]);
  // Shoulder plates are broad and smoothly domed, with skin overlapping
  // the unified rib cage. All surfaces share the same material.
  for(const sign of [-1,1]){
    ellipsoid('DELTOID '+sign,[sign*1.35,2.34,-1.51],
      [.66,1.01,.78],[.21,0,sign*.12]);
    ellipsoid('CHEST SIDE MUSCLE '+sign,[sign*1.10,2.21,-.72],
      [.38,.63,.90],[-.15,0,sign*.11]);
    ellipsoid('FACE CHEEKBONE '+sign,[sign*.84,3.63,-3.73],
      [.44,.46,.56],[-.14,0,sign*.11]);
    ellipsoid('JAW HINGE '+sign,[sign*.54,3.27,-3.75],
      [.32,.38,.49],[-.15,0,sign*.16]);
  }
  ellipsoid('DEEP HANGING BRISKET',[0,1.53,-1.39],
    [.99,.58,.83],[-.19,0,0]);
  // Lower jaws are genuinely separate. Mouth opening is formed by
  // empty space / cast shadows rather than fake black paint.
  ellipsoid('UPPER LION MUZZLE',[0,3.65,-4.48],
    [.67,.34,.51],[-.08,0,0]);
  ellipsoid('OPEN LOWER LION JAW',[0,3.00,-4.22],
    [.86,.25,.72],[-.09,0,0]);

  function positionBetween(part,start,end){
    const a=vec(start),b=vec(end),d=b.clone().sub(a);
    const len=Math.max(.00001,d.length());
    part.mesh.position.copy(a).add(b).multiplyScalar(.5);
    part.mesh.quaternion.setFromUnitVectors(UP,d.normalize());
    part.mesh.scale.set(part.width,len*.70,part.depth);
  }
  function connect(name,a,b,width,depth){
    const part={mesh:add(name,ball),width,depth};
    positionBetween(part,a,b);
    return part;
  }
  // Four muscular front/rear limbs follow the 50-bone IK skeleton.
  // Smooth overlaps between joint volumes prevent disconnected segments.
  for(const id of rig.legOrder){
    const l=rig.legs[id],f=l.kind==='fore';
    limbs[id]={
      upper:connect(id+' THICK UPPER LEG',l.shoulder,l.elbow,
        f?.70:.72,f?.64:.68),
      elbow:ellipsoid(id+' ELBOW/KNEE',l.elbow,
        f?[.51,.56,.53]:[.56,.56,.57]),
      lower:connect(id+' LOWER LEG',l.elbow,l.wrist,
        f?.49:.44,f?.45:.43),
      wrist:ellipsoid(id+' WRIST/HOCK',l.wrist,
        f?[.43,.44,.42]:[.39,.40,.42]),
      paw:ellipsoid(id+' HUGE PAW',l.paw,
        f?[.88,.34,.92]:[.72,.29,.78]),
      toes:ellipsoid(id+' TOES',l.toe,
        f?[.77,.22,.49]:[.65,.20,.44])
    };
  }
  // One uninterrupted tapering snake muscle/skin with no "caterpillar"
  // cylinders, scales, patterns or seams. Width measured from skeleton.
  const snakePath=new T.CatmullRomCurve3(
    rig.serpent.map(vec),false,'centripetal');
  const slices=124,side=20,pts=[],tri=[],radii=rig.tailRadii;
  function tailRadius(t){
    const tpos=t*(radii.length-1),k=Math.min(radii.length-2,
      Math.floor(tpos));
    const f=tpos-k,s=f*f*(3-2*f);
    return 1.045*(radii[k]*(1-s)+radii[k+1]*s);
  }
  for(let i=0;i<=slices;i++){
    const t=i/slices,at=snakePath.getPoint(t),
      tangent=snakePath.getTangent(t);
    const anchor=Math.abs(tangent.y)>.90?
      new T.Vector3(1,0,0):new T.Vector3(0,1,0);
    const normal=new T.Vector3().crossVectors(tangent,anchor).normalize();
    const binormal=new T.Vector3().crossVectors(tangent,normal).normalize();
    for(let j=0;j<side;j++){
      const a=j*2*Math.PI/side;
      const v=at.clone().addScaledVector(
        normal,Math.cos(a)*tailRadius(t)).addScaledVector(
        binormal,Math.sin(a)*tailRadius(t)*.96);
      pts.push(v.x,v.y,v.z);
    }
  }
  for(let i=0;i<slices;i++)for(let j=0;j<side;j++){
    const a=i*side+j,b=i*side+(j+1)%side,
      c=(i+1)*side+j,d=(i+1)*side+(j+1)%side;
    tri.push(a,c,b,b,c,d);
  }
  for(let j=1;j<side-1;j++){
    tri.push(0,j+1,j);
    const end=slices*side;tri.push(end,end+j,end+j+1);
  }
  const tailGeo=new T.BufferGeometry();
  tailGeo.setAttribute('position',new T.Float32BufferAttribute(pts,3));
  tailGeo.setIndex(tri);tailGeo.computeVertexNormals();geometries.push(tailGeo);
  const tail=add('ONE CONNECTED SNAKE SKIN FROM SACRUM',tailGeo);
  ellipsoid('RAISED PREDATOR SNAKE HEAD',
    [-3.24,5.17,.67],[.72,.47,.94],[-.12,0,0]);
  ellipsoid('SNAKE UPPER MUZZLE',
    [-3.24,5.06,-.10],[.54,.27,.63],[-.11,0,0]);
  ellipsoid('SEPARATE LOWER SNAKE JAW',
    [-3.24,4.69,-.22],[.57,.16,.60],[-.09,0,0]);

  inside.setMassVisible(false);inside.setBonesVisible(false);
  const state={
    skin,meshes,limbs,tail,torso,material,geometries,
    showSkin(on){skin.visible=!!on},
    showInside(on){
      inside.setMassVisible(!!on);
      inside.setBonesVisible(!!on);
      skin.visible=!on;
    },
    getDetails(){return {
      phase:'unpainted skin',skinMeshes:meshes.length,
      torsoVertices:torso.geometry.attributes.position.count,
      serpentVertices:tail.geometry.attributes.position.count,
      trueBones:rig.skinBones.length,
      forepawWidth:rig.snapshot().forefootSpan,
      headY:CHIMERA_ARMATURE.lionCraniumY
    }}
  };
  root.userData.chimeraSkin=state;
  root.userData.chimeraVersion='CHIMERA_SKIN_01';
  return root;
}
export function animateChimeraSkin(root,time,mode='idle'){
  const movement=animateChimeraBlockout(root,time,mode);
  const rig=root?.userData?.skeleton,state=root?.userData?.chimeraSkin;
  if(!rig||!state)return movement;
  const V=a=>new root.userData._threeClass.Vector3(...a),
    UP=new root.userData._threeClass.Vector3(0,1,0);
  const connect=(part,start,end)=>{
    const a=V(start),b=V(end),d=b.clone().sub(a),
      len=Math.max(.00001,d.length());
    part.mesh.position.copy(a).add(b).multiplyScalar(.5);
    part.mesh.quaternion.setFromUnitVectors(UP,d.normalize());
    part.mesh.scale.set(part.width,len*.70,part.depth);
  };
  for(const id of rig.legOrder){
    const l=rig.legs[id],part=state.limbs[id],
      pose=l.display||{mid:l.elbow,wrist:l.wrist,paw:l.paw,toe:l.toe};
    connect(part.upper,l.shoulder,pose.mid);
    connect(part.lower,pose.mid,pose.wrist);
    part.elbow.position.set(...pose.mid);
    part.wrist.position.set(...pose.wrist);
    part.paw.position.set(...pose.paw);
    part.toes.position.set(...pose.toe);
  }
  return movement;
}
