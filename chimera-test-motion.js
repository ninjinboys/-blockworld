/**
 * NEXACRAFT CHIMERA: MID-BOSS MOTION PASS 02
 * Dramatic poses, charge, roar, connected snake tail strike, recoil.
 * Existing anatomical IK and single skin remain the source of truth.
 * 15 fps deform update; no GLB, texture or per-frame geometry allocations.
 */
export function createTestMotion(root, animateRig, THREE) {
  const state = root.userData.chimeraSkin;
  if (!state?.tail || !state?.torso) throw Error("Chimera skin is missing");
  const meshes = new Map(state.meshes.map(m => [m.name, m]));
  const lionJaw = meshes.get("OPEN LOWER LION JAW");
  const snakeJaw = meshes.get("SEPARATE LOWER SNAKE JAW");
  const headNames = ["RAISED PREDATOR SNAKE HEAD","SNAKE UPPER MUZZLE","SEPARATE LOWER SNAKE JAW"];
  const headBases = headNames.map(name=>meshes.get(name)).filter(Boolean)
    .map(mesh=>({mesh,base:mesh.position.clone(),rotation:mesh.rotation.clone()}));
  const jawBase = lionJaw?.position.clone();
  const jawRotation = lionJaw?.rotation.clone();
  const torso = state.torso.geometry;
  const torsoAttr = torso.attributes.position;
  const torsoRest = new Float32Array(torsoAttr.array);
  const tail = state.tail.geometry;
  const tailAttr = tail.attributes.position;
  const tailRest = new Float32Array(tailAttr.array);
  const tailRings=125,sideCount=20;
  state.tail.frustumCulled=false;
  state.torso.frustumCulled=false;
  const clamp=x=>Math.max(0,Math.min(1,x));
  const smooth=x=>{x=clamp(x);return x*x*(3-2*x);};
  const pulse=(t,d,attack=.3,recover=.38)=>{
    if(t<=0||t>=d)return 0;
    return smooth(t/attack)*smooth((d-t)/recover);
  };
  let stepBlend=0,deathBlend=0;
  const floorRing = THREE && new THREE.Mesh(
    new THREE.RingGeometry(.93,1.06,32),
    new THREE.MeshBasicMaterial({
      color:0xefcb83, transparent:true, opacity:0,
      depthWrite:false, side:THREE.DoubleSide
    }));
  if(floorRing){
    floorRing.name="BOSS GROUND SHOCKWAVE";
    floorRing.rotation.x=-Math.PI/2;
    floorRing.visible=false;
    root.parent.add(floorRing);
  }
  function update(time,dt,mode="idle",age=0){
    dt=Math.max(0,Math.min(.12,dt)); // 15fps pose update
    const isWalk=mode==="walk", isCharge=mode==="charge";
    const moving=isWalk||isCharge;
    const heavyRoar=mode==="roar"?pulse(age,2.2,.55,.55):0;
    const strike=mode==="tail"?pulse(age,1.9,.36,.44):0;
    const recoil=mode==="hurt"?pulse(age,.56,.10,.24):0;
    const bite=mode==="bite"?pulse(age,.90,.19,.24):0;
    const hitWave=(heavyRoar>.01||strike>.05)?Math.max(heavyRoar,strike*.6):0;
    animateRig(root,time,isCharge?"charge":isWalk?"walk":"idle");

    const rigPhase=root.userData.skeleton?.gaitPhase||0;
    const foot=Math.sin(rigPhase*Math.PI*4);
    const stomp=Math.pow(Math.abs(foot),2);
    stepBlend+=(Number(moving)-stepBlend)*Math.min(1,dt*9);
    deathBlend+=(Number(mode==="death")-deathBlend)*Math.min(1,dt*1.8);
    const alive=1-deathBlend;

    // Large, readable silhouette changes are essential for a mid-boss.
    // Pitch raises the lion's head during roar, lowers it for charge.
    const breath=Math.sin(time*2.1);
    const pitch= -.19*(isCharge?1:0) + .23*heavyRoar -.14*bite + .12*recoil;
    const roll=(moving?.064*foot:.022*Math.sin(time*.95))
        + .065*heavyRoar*Math.sin(time*7.2)+.10*recoil;
    root.rotation.x=alive*pitch;
    root.rotation.z=alive*roll-deathBlend*.68;
    root.position.y=alive*(
       -.04 + .040*breath
       + stepBlend*(isCharge?.28:.13)*stomp
       - .17*heavyRoar*(1-heavyRoar)
       + .23*heavyRoar
       + .10*recoil
       - .10*bite
    ) - deathBlend*.43;
    // Slow mass transfer makes the idle pose visibly alive.
    const forehead= .34*heavyRoar - .12*recoil -.17*bite;
    const muzzleLift=.68*heavyRoar-.15*bite+.085*breath;
    const spineRise=.085*breath+.075*stepBlend*stomp;
    const verts=torsoAttr.array;
    for(let i=0;i<torsoRest.length;i+=3){
      const x=torsoRest[i],y=torsoRest[i+1],z=torsoRest[i+2];
      const face=smooth((-z-2.35)/2.50);
      const chest=smooth((-z+.5)/2.6)*(1-face);
      const belly=(1-face)*.027*breath;
      verts[i]=x+(1-face)*.032*Math.sin(time*.9);
      verts[i+1]=y+face*(muzzleLift+forehead)
       +chest*(spineRise+.12*heavyRoar)+belly;
      verts[i+2]=z-face*(.13*heavyRoar+.20*bite)
       +chest*.06*stomp*stepBlend;
    }
    torsoAttr.needsUpdate=true;
    torso.computeVertexNormals();

    // The jaw is a genuinely separate surface.
    // Open it very widely on roar; retain a natural small idle opening.
    if(lionJaw&&jawBase){
      const gape=.09+.66*heavyRoar+.40*bite+.07*Math.sin(time*2)**2;
      lionJaw.position.set(jawBase.x,jawBase.y-gape,jawBase.z-.10*heavyRoar);
      lionJaw.rotation.x=jawRotation.x-.40*heavyRoar-.25*bite;
    }

    // Animate the original seamless anaconda skin: no detached segments.
    // A strongly curved whip sweeps more than two whole world blocks.
    const vertsTail=tailAttr.array;
    let endX=0,endY=0,endZ=0;
    const sweep = Math.sin(age*7.7-.65)*strike;
    for(let ring=0;ring<tailRings;ring++){
      const u=ring/(tailRings-1);
      const distal=smooth((u-.07)/.93);
      const wave=Math.sin(time*1.55-u*4.9);
      const attackPhase=Math.sin(age*7.7-u*2.1);
      const dx=distal*(.32*wave+2.45*strike*attackPhase);
      const dy=distal*(.18*Math.cos(time*1.75-u*3.1)+.65*strike);
      const dz=distal*(.18*Math.cos(time*1.2-u*4.0)-1.30*strike
                     +.22*heavyRoar);
      for(let j=0;j<sideCount;j++){
        const k=(ring*sideCount+j)*3;
        vertsTail[k]=tailRest[k]+dx;
        vertsTail[k+1]=tailRest[k+1]+dy;
        vertsTail[k+2]=tailRest[k+2]+dz;
      }
      if(ring===tailRings-1){endX=dx;endY=dy;endZ=dz;}
    }
    tailAttr.needsUpdate=true;
    tail.computeVertexNormals();
    for(const entry of headBases){
      entry.mesh.position.set(entry.base.x+endX,entry.base.y+endY,entry.base.z+endZ);
      entry.mesh.rotation.set(entry.rotation.x-.17*strike,
        entry.rotation.y+.40*Math.sin(time*1.5)+.58*sweep,
        entry.rotation.z+.16*Math.cos(time*1.3));
    }
    if(snakeJaw){
      snakeJaw.position.y-=.10+.40*strike+.18*heavyRoar;
    }

    if(floorRing){
      const bang=heavyRoar>0.28?heavyRoar:
                 isCharge?stomp*.53: strike>.35?strike*.50:0;
      floorRing.visible=bang>.05;
      if(floorRing.visible){
        floorRing.position.set(root.position.x,.036,root.position.z);
        floorRing.scale.setScalar(1.0+(1-bang)*3.4);
        floorRing.material.opacity=bang*.40;
      }
    }
    root.userData.testMotion=mode;
    return {mode,roar:heavyRoar,tail:strike,stomp,charge:isCharge,death:deathBlend};
  }
  return {update};
}
