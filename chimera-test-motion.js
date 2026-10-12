/**
 * NEXACRAFT 20x20 Chimera animation pass.
 * Uses existing chimera-skin.js anatomical IK. No textures, GLB,
 * or changes to the canonical chimera model.
 */
export function createTestMotion(root, animateRig) {
  const state = root.userData.chimeraSkin;
  if (!state || !state.tail || !state.torso) throw Error("Chimera skin not initialized");
  const meshes = new Map(state.meshes.map(mesh => [mesh.name, mesh]));
  const lionJaw = meshes.get("OPEN LOWER LION JAW");
  const snakeJaw = meshes.get("SEPARATE LOWER SNAKE JAW");
  const snakeHeadNames = [
    "RAISED PREDATOR SNAKE HEAD",
    "SNAKE UPPER MUZZLE",
    "SEPARATE LOWER SNAKE JAW"
  ];
  const heads = snakeHeadNames.map(name => meshes.get(name)).filter(Boolean);
  const headBases = heads.map(mesh => ({mesh, position: mesh.position.clone(), rotation: mesh.rotation.clone()}));
  const lionJawBase = lionJaw?.position.clone();
  const lionJawRot = lionJaw?.rotation.clone();
  const torsoPosition = state.torso.geometry.attributes.position;
  const torsoBase = new Float32Array(torsoPosition.array);
  const tailPosition = state.tail.geometry.attributes.position;
  const tailBase = new Float32Array(tailPosition.array);
  // Original tail has 125 rings, 20 vertices in each ring.
  const ringCount = 125;
  const pointsPerRing = 20;
  state.tail.frustumCulled = false;
  state.torso.frustumCulled = false;
  let previous = "idle";
  let blend = 0, fall = 0;
  const clamp01 = x => Math.min(1, Math.max(0, x));
  const smooth = x => { x=clamp01(x); return x*x*(3-2*x); };
  function update(time, dt, mode="idle", age=0) {
    const walking = mode==="walk" || mode==="charge";
    // Existing real joint solver (foreleg elbows + feline rear hocks).
    animateRig(root, time, mode==="charge"?"charge":walking?"walk":"idle");
    const speed = mode==="charge" ? 10.2 : walking ? 5.9 : 1.6;
    const phase = time*speed;
    const roar = mode==="roar" ? Math.sin(Math.PI*clamp01(age/1.22))**2 : 0;
    const whip = mode==="tail" ? Math.sin(Math.PI*clamp01(age/1.1)) : 0;
    const hurt = mode==="hurt" ? Math.sin(Math.PI*clamp01(age/.38)) : 0;
    const bite = mode==="bite" ? Math.sin(Math.PI*clamp01(age/.7))**2 : 0;
    blend += ((walking?1:0)-blend)*Math.min(1,dt*7);
    fall += ((mode==="death"?1:0)-fall)*Math.min(1,dt*2.3);
    const bounce = blend*Math.abs(Math.sin(phase))*(mode==="charge"?.095:.047);
    // Gentle idle breathing; grounded movement is mostly from the IK limbs.
    root.position.y = -.02*fall + (1-fall)*(.014*Math.sin(time*2.5)+bounce);
    root.rotation.z = (1-fall)*blend*.023*Math.sin(phase*.5)-fall*.53;
    root.rotation.x = (1-fall)*(-.04*(mode==="charge") + .08*roar + .045*bite);
    const jawOpen = .07+.23*roar+.15*bite+.05*Math.sin(time*1.6)**2;
    if (lionJaw && lionJawBase) {
      lionJaw.position.set(lionJawBase.x, lionJawBase.y-jawOpen, lionJawBase.z+.09*jawOpen);
      lionJaw.rotation.x = lionJawRot.x-.25*roar-.10*bite;
    }
    // Facial surface follows the lifted roar pose, without disconnecting the neck.
    const faceLift = .14*roar - .055*bite + .025*hurt;
    for(let i=0;i<torsoBase.length;i+=3){
      const z=torsoBase[i+2];
      const influence=smooth((-z-2.2)/2.6);
      torsoPosition.array[i]=torsoBase[i];
      torsoPosition.array[i+1]=torsoBase[i+1]+influence*faceLift+
        (1-influence)*.012*Math.sin(time*2.6);
      torsoPosition.array[i+2]=z-.055*roar*influence;
    }
    torsoPosition.needsUpdate=true;
    state.torso.geometry.computeVertexNormals();
    // Deform the one continuous snake skin instead of moving a train of cylinders.
    // The displacement grows toward its head and vanishes at the pelvis.
    const tipPhase=time*(mode==="tail"?8.2:1.65);
    let endDx=0,endDz=0,endDy=0;
    for(let ring=0;ring<ringCount;ring++){
      const u=ring/(ringCount-1);
      const distal=u*u*(3-2*u);
      const wave=Math.sin(tipPhase-u*5.6);
      const dx=distal*(.085*wave+1.0*whip*Math.sin(u*Math.PI*.8));
      const dz=distal*(.045*Math.cos(tipPhase*.8-u*3.7)-.65*whip);
      const dy=distal*(.065*Math.cos(tipPhase*.85-u*4)+.18*whip);
      for(let j=0;j<pointsPerRing;j++){
        const k=(ring*pointsPerRing+j)*3;
        tailPosition.array[k]=tailBase[k]+dx;
        tailPosition.array[k+1]=tailBase[k+1]+dy;
        tailPosition.array[k+2]=tailBase[k+2]+dz;
      }
      if(ring===ringCount-1){endDx=dx;endDz=dz;endDy=dy;}
    }
    tailPosition.needsUpdate=true;
    state.tail.geometry.computeVertexNormals();
    for(const {mesh,position,rotation} of headBases){
      mesh.position.set(position.x+endDx,position.y+endDy,position.z+endDz);
      mesh.rotation.set(rotation.x,rotation.y+.07*Math.sin(time*1.8)+.2*whip,rotation.z+.045*Math.cos(time*1.5));
    }
    if(snakeJaw){
      const base=headBases.find(x=>x.mesh===snakeJaw);
      if(base)snakeJaw.position.y-=.09+.20*whip+.12*roar;
    }
    if(mode!==previous){previous=mode;root.userData.testMotion=mode;}
    return {mode,roar,whip,bounce,fall};
  }
  return {update};
}
