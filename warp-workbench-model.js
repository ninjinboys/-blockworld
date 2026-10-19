// NEXACRAFT: two-cell obelisk-like WARP WORKBENCH.
// Rendered from one anchor cell with instanced parts (including the adjacent cell).
// The world grid and save data retain both occupied blocks; no remote assets needed.
export function createWarpWorkbenchModel(THREE){
  const cube=new THREE.BoxGeometry(1,1,1);
  const crystal=new THREE.OctahedronGeometry(1,0);
  const point=new THREE.ConeGeometry(.5,1,4,1);
  point.rotateY(Math.PI/4);
  const makeStone=color=>new THREE.MeshLambertMaterial({color});
  const materials={
    dark:makeStone(0x161e22),
    black:makeStone(0x0a1317),
    stone:makeStone(0x2b363a),
    edge:makeStone(0x5c6665),
    steel:new THREE.MeshStandardMaterial({color:0x52666d,roughness:.46,metalness:.66}),
    green:new THREE.MeshBasicMaterial({color:0x30d3bb,toneMapped:false}),
    bright:new THREE.MeshBasicMaterial({color:0x96fff0,toneMapped:false})
  };
  const specs=[];
  function part(mat,x,y,z,sx,sy,sz,rot=0,shape='cube'){
    specs.push({mat,x,y,z,sx,sy,sz,rot,shape});
  }
  // Exactly two blocks wide: armored stone-and-iron base with a divided top.
  for(const side of [-1,1]){
    part('black',side*.50,-.32,0,.98,.32,.96);
    part('stone',side*.50,-.15,0,.985,.11,.98);
    part('edge',side*.50,-.075,0,.965,.06,.93);
    part('dark',side*.49,.017,0,.94,.135,.86);
    part('steel',side*.77,-.21,.49,.32,.21,.045);
    part('steel',side*.77,-.21,-.49,.32,.21,.045);
    // Twin broken obelisk wings and their luminous inner rim.
    part('stone',side*.77,.44,-.13,.42,.80,.63);
    part('edge',side*.75,.84,-.17,.43,.19,.69);
    part('dark',side*.71,1.13,-.20,.32,.46,.48,-side*.27);
    part('stone',side*.64,1.47,-.20,.37,.34,.42,-side*.60,'point');
    part('green',side*.515,.62,.205,.045,.71,.035);
    part('green',side*.47,1.02,.205,.048,.41,.035,-side*.27);
    part('black',side*.68,.46,.36,.24,.36,.10);
    part('bright',side*.68,.49,.425,.075,.18,.038,'0','crystal');
    // Curved wings rising toward the central needle.
    part('dark',side*.43,1.13,-.27,.21,.53,.30,-side*.31);
    part('green',side*.38,1.16,-.09,.048,.35,.05,-side*.31);
    part('steel',side*.38,.02,.42,.21,.055,.15);
    part('green',side*.40,.065,.51,.18,.028,.025);
  }
  part('black',0,.10,-.20,.54,.50,.70);
  part('stone',0,.44,-.21,.40,.34,.58);
  part('stone',0,.87,-.23,.30,.56,.41);
  part('black',0,1.28,-.24,.22,.43,.32);
  part('edge',0,1.58,-.24,.28,.28,.31,0,'point');
  part('green',0,.98,.005,.085,1.10,.065);
  part('green',0,.16,.46,.53,.04,.11);
  part('dark',0,.18,.49,.27,.04,.19);
  // Four-way cyan energy core in front of the central obelisk.
  part('bright',0,.96,.31,.29,.37,.20,0,'crystal');
  part('green',0,.96,.39,.67,.065,.06);
  part('bright',0,.96,.44,.26,.25,.13,0,'crystal');
  for(const side of [-1,1]){
    part('stone',side*.25,1.78,-.19,.20,.17,.19,side*.2);
    part('green',side*.25,1.78,.005,.13,.043,.034);
  }
  // Build one InstancedMesh per material+geometry (small GPU draw-call count).
  const groups=new Map();
  for(const spec of specs){
    const key=spec.mat+':'+spec.shape;
    if(!groups.has(key))groups.set(key,{material:materials[spec.mat],geometry:spec.shape==='crystal'?crystal:spec.shape==='point'?point:cube,parts:[]});
    groups.get(key).parts.push(spec);
  }
  const qAxis=new THREE.Vector3(0,1,0),qObj=new THREE.Quaternion(),qLocal=new THREE.Quaternion();
  const euler=new THREE.Euler(),offset=new THREE.Vector3(),dummy=new THREE.Object3D();
  function build(anchors,alongZ,scene,meshes,lookup,built,baseId){
    if(!anchors.length)return;
    const qWorld=new THREE.Quaternion().setFromAxisAngle(qAxis,alongZ?-Math.PI/2:0);
    for(const group of groups.values()){
      const instances=anchors.length*group.parts.length;
      const mesh=new THREE.InstancedMesh(group.geometry,group.material,instances);
      mesh.userData.id=baseId;
      mesh.castShadow=false;mesh.receiveShadow=true;mesh.frustumCulled=false;
      const targets=[];
      let i=0;
      for(const a of anchors){
        const cx=a.x+(alongZ?0:.5),cz=a.z+(alongZ?.5:0);
        for(const p of group.parts){
          offset.set(p.x,p.y,p.z).applyQuaternion(qWorld);
          dummy.position.set(cx+offset.x,a.y+offset.y,cz+offset.z);
          euler.set(0,0,Number(p.rot)||0);
          qLocal.setFromEuler(euler);qObj.copy(qWorld).multiply(qLocal);
          dummy.quaternion.copy(qObj);dummy.scale.set(p.sx,p.sy,p.sz);
          dummy.updateMatrix();mesh.setMatrixAt(i++,dummy.matrix);
          targets.push(a);
        }
      }
      mesh.instanceMatrix.needsUpdate=true;
      scene.add(mesh);meshes.push(mesh);lookup.set(mesh.uuid,targets);built.push(mesh);
    }
  }
  return {build};
}
