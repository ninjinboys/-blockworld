/**
 * NEXACRAFT CHIMERA — REFERENCED VOXEL CREATURE (2026-10-13)
 * Full procedural 3D voxel shell using shared instanced cubes.
 * Anatomy / moving snake / 4-beat leg rig remain unchanged.
 * No pictures, no imported glb, no external texture files.
 */
export function dressChimera(root,T){
  const st=root.userData.chimeraSkin,rig=root.userData.skeleton;
  if(!st?.tail || !rig)throw Error("Missing base Chimera anatomical model");
  const deco=new T.Group();deco.name="CHIMERA REFERENCE VOXEL BODY";root.add(deco);
  // Hide clay surfaces, not their objects: the original rig still animates.
  // material.visible=false is intentional; set visible=false on a mesh
  // would also prevent its animated child attachments from displaying.
  st.meshes.forEach(m=>{m.material=new T.MeshStandardMaterial({visible:false});});
  const colors={
    coat:[0x554035,0x6b4b36,0x7e5233,0x453b36,0x916447],
    chest:[0x584036,0x714831,0x854d2a,0x9d612f],
    highlight:[0xb47438,0xc68a43,0x92552c,0xdb9851],
    mane:[0x73391c,0x985022,0xaf6327,0xc37730,0x85451f,0x5a301f,0xd08b41],
    horn:[0x35333a,0x47444a,0x605a59,0x282a31,0x82735e],
    snake:[0x37402b,0x5a5d2c,0x737343,0x9d9751,0x3b4b30,0xb4a274],
    bone:[0xe7d0a1,0xffe3b3,0xd5bb8b],
    claw:[0x28292b,0x3b3534,0x51453d],
    tan:[0xb89160,0xd3a36a,0x9d7a56],
    mouth:[0x28161a,0x411d22,0x682e34]
  };
  const cube=new T.BoxGeometry(1,1,1);
  const baseMaterial=new T.MeshStandardMaterial({color:0xffffff,roughness:.90,metalness:0});
  const dummy=new T.Object3D(),scratch=new T.Color(),vc=new T.Vector3(),up=new T.Vector3(0,1,0);
  const fract=v=>v-Math.floor(v);
  const hash=(a,b,c)=>fract(Math.sin(a*127.1+b*311.7+c*74.7)*43758.5453);
  const pick=(pal,a,b,c)=>pal[Math.floor(hash(a,b,c)*pal.length)%pal.length];
  const pack=(list,name,group=deco)=>{
    const mesh=new T.InstancedMesh(cube,baseMaterial,list.length);
    mesh.name=name;mesh.frustumCulled=false;
    for(let i=0;i<list.length;i++){
      const e=list[i];
      dummy.position.set(e[0],e[1],e[2]);
      dummy.rotation.set(0,0,0);
      const w=e[4]||e[3];
      dummy.scale.set(w,e[5]||e[3],e[6]||e[3]);dummy.updateMatrix();
      mesh.setMatrixAt(i,dummy.matrix);
      mesh.setColorAt(i,scratch.setHex(e[7]||e[8]||0xffffff));
    }
    mesh.instanceMatrix.needsUpdate=true;
    if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;
    group.add(mesh);return mesh;
  };
  // Explicit record format [x,y,z,unit,w,h,depth,color] avoids geometry per cube.
  const voxel=(a,x,y,z,size,color,w=size,h=size,d=size)=>
    a.push([x,y,z,size,w,h,d,color]);
  const gridStep=.215;
  const sdfEllip=(x,y,z,e)=>Math.sqrt(
    ((x-e[0])/e[3])**2+((y-e[1])/e[4])**2+((z-e[2])/e[5])**2);
  const bodyEllip=[
    [0,2.66,-1.29,1.71,1.52,1.70],
    [0,2.43,.20,1.30,1.08,2.10],
    [0,2.44,2.08,1.35,1.25,1.34],
    [0,3.22,-2.65,1.38,1.21,1.47],
    [0,3.92,-3.61,1.06,.76,1.02],
    [0,3.67,-4.46,.69,.34,.54]
  ];
  const inside=(x,y,z)=>bodyEllip.some(e=>sdfEllip(x,y,z,e)<1);
  const bodyVox=[];
  const xb=Math.ceil(2.25/gridStep),yb=Math.ceil(4.95/gridStep),
    zLow=Math.floor(-5.15/gridStep),zHigh=Math.ceil(3.6/gridStep);
  for(let ix=-xb;ix<=xb;ix++)for(let iy=4;iy<=yb;iy++)for(let iz=zLow;iz<=zHigh;iz++){
    const x=ix*gridStep,y=iy*gridStep,z=iz*gridStep;
    if(!inside(x,y,z))continue;
    if(inside(x+gridStep,y,z)&&inside(x-gridStep,y,z)&&
       inside(x,y+gridStep,z)&&inside(x,y-gridStep,z)&&
       inside(x,y,z+gridStep)&&inside(x,y,z-gridStep))continue;
    let pal=z<-2.4?colors.chest:colors.coat;
    if(z>1.50)pal=colors.coat;
    let color=pick(pal,ix,iy,iz);
    const patch=hash(ix*.7,iy*.33,iz*.4);
    if((ix+iz)%9<3 && patch>.47)color=colors.highlight[(ix+iy+100)%4];
    if(y<1.85)color=colors.coat[0];
    voxel(bodyVox,x,y,z,gridStep*1.045,color);
  }
  pack(bodyVox,"VOXEL CHEST / LION CORE / RUMP");

  // Heavy layered mane; hundreds of offset, non-uniform cuboid tufts wrap
  // the jaw, brow and shoulders, falling naturally down the sides.
  const mane=new T.Group();mane.name="LAYERED SHAGGY ORANGE MANE";deco.add(mane);
  const tufts=[];
  const maneLayers=[
    {z:-2.27,y:3.32,rx:1.65,ry:1.53,count:61,length:7},
    {z:-2.82,y:3.60,rx:1.84,ry:1.58,count:73,length:9},
    {z:-3.35,y:3.76,rx:1.63,ry:1.48,count:65,length:7},
    {z:-3.75,y:3.89,rx:1.38,ry:1.16,count:49,length:6}
  ];
  for(let layer=0;layer<maneLayers.length;layer++){
    const m=maneLayers[layer];
    for(let j=0;j<m.count;j++){
      const theta=(j+.37*layer)/m.count*Math.PI*2;
      const cs=Math.cos(theta),sn=Math.sin(theta);
      const jitter=hash(layer,j,12),sag=sn<0?.18:.06;
      const n=m.length+Math.floor(jitter*3);
      const size=.21+.03*hash(j,layer,4);
      const x0=cs*(m.rx+.085*Math.sin(j*13)),
        y0=m.y+sn*m.ry;
      for(let k=0;k<n;k++){
        const t=k/(n-1);
        const px=x0+cs*(.22+.20*t),
          py=y0+(sn*.20-.43-sag)*t,
          pz=m.z+(.12+.75*t)+.10*Math.sin(j*12.7);
        const color=pick(colors.mane,j,layer,k);
        voxel(tufts,px,py,pz,size,color,size*1.12,size*.90,size*1.16);
      }
    }
  }
  // Raise broken silhouette along top ridge: strongly recognisable spiky mane.
  for(let j=0;j<120;j++){
    const x=(hash(j,1,3)*2-1)*1.13;
    const z=-3.75+hash(j,2,3)*2.88;
    const y=4.40+.29*hash(j,3,4)-.12*Math.abs(x);
    const n=2+Math.floor(hash(j,7,5)*5);
    for(let k=0;k<n;k++)voxel(tufts,x+.03*k,y+.10*k,z+.13*k,
      .24,pick(colors.mane,j,k,6));
  }
  pack(tufts,"MANY INTERLOCKING BLOCK-MANE LOCKS",mane);

  // Great black curled buffalo horns, broad at temples and tapered at tips.
  const horns=new T.Group();horns.name="SYMMETRIC MASSIVE DARK HORNS";deco.add(horns);
  const hornBoxes=[];
  for(const side of [-1,1]){
    const pts=[
      [.78,4.41,-3.56],[1.26,4.39,-3.55],[1.83,4.27,-3.58],
      [2.40,4.35,-3.65],[2.83,4.69,-3.70],[2.99,5.23,-3.70],
      [2.86,5.84,-3.68],[2.52,6.18,-3.69]
    ].map(p=>new T.Vector3(side*p[0],p[1],p[2]));
    const curve=new T.CatmullRomCurve3(pts,false,"centripetal");
    for(let k=0;k<=55;k++){
      const t=k/55,p=curve.getPoint(t),dir=curve.getTangent(t).normalize();
      const tangentA=new T.Vector3(0,0,1).addScaledVector(dir,-dir.z).normalize(),
        tangentB=new T.Vector3().crossVectors(dir,tangentA).normalize();
      const radius=.43*(1-t)**.78+.017;
      const spokes=16;
      for(let j=0;j<spokes;j++){
        const a=j*Math.PI*2/spokes;
        const pos=p.clone().addScaledVector(tangentA,Math.cos(a)*radius)
          .addScaledVector(tangentB,Math.sin(a)*radius);
        const col=t<.24&&k%8<2?0x82735e:pick(colors.horn,k,j,side);
        voxel(hornBoxes,pos.x,pos.y,pos.z,.205,col);
      }
    }
  }
  pack(hornBoxes,"CURVED OBSIDIAN BUFFALO HORNS",horns);

  // Lion face V3: strong cheekbones and a BROAD short feline muzzle.
  // No free-floating jaw; all facial parts share a single animated group.
  const face=new T.Group();
  face.name="REFERENCE LION FACE V4 — BIG CAT NOT BUFFALO";
  face.position.z=-.22; // The face must project past the thick mane.
  deco.add(face);
  const skullV=[],browV=[],muzzleV=[],oralV=[],fangV=[],eyeV=[],ruffV=[];
  const vbox=(arr,x,y,z,w,h,d,color)=>
    voxel(arr,x,y,z,Math.min(w,h,d),color,w,h,d);
  const res=.126;
  // Only sample the outer skin of sculpted ellipsoids; back-half remains
  // embedded in the existing body, avoiding a second hollow, box-shaped head.
  const shell=(arr,center,radii,palette,seed,onlyFront=false)=>{
    const [cx,cy,cz]=center,[rx,ry,rz]=radii;
    const nx=Math.ceil(rx/res),ny=Math.ceil(ry/res),nz=Math.ceil(rz/res);
    const dist=(x,y,z)=>
      ((x-cx)/rx)**2+((y-cy)/ry)**2+((z-cz)/rz)**2;
    for(let i=-nx;i<=nx;i++)for(let j=-ny;j<=ny;j++)
    for(let k=-nz;k<=nz;k++){
      const x=cx+i*res,y=cy+j*res,z=cz+k*res;
      if(onlyFront&&z>cz+.10)continue;
      if(dist(x,y,z)>1)continue;
      if(dist(x+res,y,z)<1&&dist(x-res,y,z)<1&&
         dist(x,y+res,z)<1&&dist(x,y-res,z)<1&&
         dist(x,y,z+res)<1&&dist(x,y,z-res)<1)continue;
      const c=pick(palette,seed+i,j,k);
      vbox(arr,x,y,z,res*1.06,res*1.06,res*1.06,c);
    }
  };
  // The upper face is embedded in the anatomical skull (Z -4.4).
  // Cheek lumps are distinct, but all silhouettes remain rounded.
  shell(skullV,[0,3.96,-4.57],[1.13,.77,.70],
    [0x624532,0x76513a,0x684937,0x8a5b3c],13,true);
  for(const side of [-1,1]){
    shell(skullV,[side*.82,3.72,-4.65],[.51,.48,.52],
      [0x895c3a,0xa46a41,0x704732],33+side,true);
    // Folded whisker pads: feline split muzzle and compressed nose bridge.
    shell(muzzleV,[side*.33,3.74,-5.08],[.47,.32,.43],
      [0xdbb17f,0xe6bb84,0xbb8553,0xf0ca98],45+side,true);
    // Lower side cheeks form uninterrupted vertical edges of the mouth.
    for(let j=0;j<9;j++){
      const t=j/8;
      vbox(muzzleV,side*(.69+.05*t),3.60-.58*t,-5.20+.06*t,
        .22,.21,.20,pick([0x845333,0x9d6742,0xb17d4b],j,side,5));
    }
    // Tapered pale fur sheets at the cheeks. These remain outside the face
    // and do not cover the glowing eyes.
    for(let strand=0;strand<11;strand++){
      const t=strand/10;
      const x=side*(1.08+.30*t),y=4.29-.105*strand;
      const z=-4.59+.10*Math.sin(strand*.9);
      for(let j=0;j<4;j++){
        vbox(ruffV,x+side*j*.016,y-j*.15,z+j*.02,
          .19,.22,.22,pick(colors.mane,strand,j,side*7));
      }
    }
    // The heavy eye brow has a pronounced inward scowl.
    for(let j=0;j<9;j++){
      const x=side*(.12+j*.105);
      const y=4.32+(j*.018); // high, strong scowling lion brow
      vbox(browV,x,y,-5.22,.15,.26,.23,
        pick([0x322b26,0x4c3429,0x60422e],j,side,7));
    }
    // Eye socket sits below brow; narrow GOLD iris with slit pupil.
    vbox(browV,side*.51,4.105,-5.28,.35,.21,.16,0x1f1718);
    vbox(browV,side*.51,4.107,-5.38,.265,.102,.065,0x6f391a);
    vbox(eyeV,side*.51,4.11,-5.442,.185,.084,.052,0xffffff);
    vbox(browV,side*.515,4.108,-5.490,.041,.089,.050,0x15110e);
    vbox(browV,side*.477,4.142,-5.494,.034,.029,.039,0xffde85);
    // Correct small feline ears embedded near the horn bases.
    vbox(ruffV,side*1.01,4.70,-3.99,.43,.48,.32,0x513322);
    vbox(ruffV,side*1.01,4.72,-4.170,.245,.30,.095,0xb58452);
  }
  // Broad flattened upside-down-triangle nose, NOT a vertical dog snout.
  for(let row=0;row<3;row++){
    const n=4-row;
    for(let col=-n;col<=n;col++){
      const x=col*.097,y=3.86-row*.087,z=-5.41+.014*Math.abs(col);
      vbox(muzzleV,x,y,z-.04,.136,.116,.18,
        pick([0x161719,0x282125,0x393033],row,col,9));
    }
  }
  for(const side of [-1,1]){
    vbox(muzzleV,side*.26,3.81,-5.515,.115,.075,.071,0x120f10);
    // Small whisker freckles offset from the mouth, no protruding sticks.
    for(let i=0;i<3;i++)
      vbox(muzzleV,side*(.29+i*.105),3.61-.033*i,-5.39,
        .047,.052,.045,0x67452e);
  }
  // Deep dark oval mouth; do not draw any brown muzzle pixels over this area.
  for(let y=2.99;y<3.66;y+=.103)for(let x=-.59;x<=.59;x+=.103){
    const nx=x/.69,ny=(y-3.32)/.40;
    if(nx*nx+ny*ny>=1)continue;
    vbox(oralV,x,y,-5.57-.045*(1-nx*nx),.112,.118,.085,
      pick([0x0a080b,0x1c0e12,0x301118],x,y,7));
  }
  // Inner jaw tongue remains BEHIND the fangs, as a dark-red 3D shape.
  for(let y=3.00;y<3.19;y+=.108)for(let x=-.25;x<=.25;x+=.108){
    vbox(oralV,x,y,-5.63,.115,.109,.060,
      pick([0x70333c,0x933d46,0x6f2d37],x,y,13));
  }
  // Two unmistakable tapered sabre canines emerging from the upper lip.
  // The pointed tips stop just ABOVE the lower lip.
  for(const side of [-1,1]){
    for(let k=0;k<18;k++){
      const t=k/17;
      const w=.195*Math.pow(1-t,.71)+.024;
      const x=side*(.43-.085*t);
      const y=3.58-.74*t;
      const z=-5.57-.066*Math.sin(t*Math.PI);
      vbox(fangV,x,y,z,w*1.60,.067,w*1.55,
        pick([0xf7e0b3,0xe9cf9f,0xffe8c3],k,side,6));
    }
    // Smaller front incisors leave the center of the gaping maw visible.
    for(let i=0;i<2;i++)for(let k=0;k<4;k++){
      const t=k/3;
      vbox(fangV,side*(.16+.12*i),3.60-.15*t,-5.581,
        .083*(1-t)+.023,.070,.105*(1-t)+.025,0xdcc395);
    }
  }
  // Chin is INSIDE face coordinates (not in another absolute-coordinate
  // rig object), so it cannot detach and fall to the floor during roaring.
  const jawGroup=new T.Group();
  jawGroup.name="CONNECTED OPEN LION JAW / NO FREE PIECES";
  face.add(jawGroup);
  const chinV=[],lowerTeethV=[];
  // Rounded shallow U: x[-.67,.67], front lip at Z-5.33.
  for(let x=-.69;x<=.69;x+=.115)for(let z=-5.43;z<=-4.83;z+=.115){
    const e=(x/.76)**2+((z+5.12)/.46)**2;
    if(e>1)continue;
    const front=z<-5.22,outer=Math.abs(x)>.50;
    if(!front&&!outer)continue;
    vbox(chinV,x,2.97,z,.122,.20,.121,
      pick([0xa5794a,0xc18a55,0x8e5d3b,0xd09b60],x,z,9));
  }
  // Upturned mouth corners attach lip back to the cheek.
  for(const side of [-1,1]){
    for(let j=0;j<8;j++){
      const t=j/7;
      vbox(chinV,side*(.62+.02*t),2.98+.43*t,-5.25+.09*t,
        .152,.146,.147,
        pick([0xa87546,0x94603b,0xb7814d],j,side,14));
    }
    for(let k=0;k<7;k++){
      const t=k/6;
      const w=.115*(1-t)+.024;
      vbox(lowerTeethV,side*(.35-.055*t),3.01+.29*t,
        -5.443-.05*t,w*1.6,.075,w*1.5,
        pick([0xe5cfa3,0xf1ddb4],k,side,15));
    }
  }
  // Tiny cream fur chin tuft makes the open mouth look feline, not robotic.
  for(let j=-3;j<=3;j++)for(let k=0;k<3;k++){
    const t=Math.abs(j)/3;
    vbox(chinV,j*.135,2.79+.065*t-k*.068,-5.28+k*.08,
      .145,.145,.14,pick([0xc49a67,0xf0c390,0xa97948],j,k,14));
  }
  pack(chinV,"CONNECTING LION MANDIBLE",jawGroup);
  pack(lowerTeethV,"LOWER UPWARD CANINES",jawGroup);
  pack(skullV,"SCULPTED COMPACT LION SKULL",face);
  pack(muzzleV,"SPLIT LION MUZZLE AND NOSE",face);
  pack(browV,"HEAVY BROW AND SLIT PUPILS",face);
  pack(oralV,"DARK OPEN MOUTH / DEEP TONGUE",face);
  pack(fangV,"PAIR OF LONG SABRE CANINES",face);
  pack(ruffV,"CHEEK-LAYER MANE AND EARS",face);
  const iris=pack(eyeV,"BRIGHT ANGRY AMBER LION EYES",face);
  iris.material=new T.MeshBasicMaterial({color:0xffbd31});
  // Independent anatomical limbs: voxel rings follow the genuine IK
  // fore-elbow and rear-hock joints, not an unchanging stick leg.
  const legMeshes=[];
  for(const id of rig.legOrder){
    const leg=rig.legs[id],descs=[];
    for(let part=0;part<4;part++){
      const rings=[10,10,7,6][part],spokes=[14,12,12,14][part];
      for(let k=0;k<rings;k++)for(let j=0;j<spokes;j++){
        descs.push({part,t:(k+.5)/rings,a:j*Math.PI*2/spokes,
          radius:(part===0?.65:part===1?.38:part===2?.38:.54)*
            (1+.12*Math.sin((k/rings)*Math.PI)),
          tone:pick(part===3?colors.tan:colors.coat,k,j,part)});
      }
    }
    const inst=new T.InstancedMesh(cube,baseMaterial,descs.length);
    inst.name="ANIMATED VOXEL JOINTED LEG "+id;inst.frustumCulled=false;
    for(let i=0;i<descs.length;i++)
      inst.setColorAt(i,scratch.setHex(descs[i].tone));
    if(inst.instanceColor)inst.instanceColor.needsUpdate=true;
    deco.add(inst);legMeshes.push({leg,descs,mesh:inst});
  }
  // Heavy black toenails; attached to living pose via 4 small voxel clusters.
  const nails=[];
  for(const id of rig.legOrder){
    const group=new T.Group();group.name="BLACK CUBIC CLAWS "+id;deco.add(group);
    const nailsVox=[],leg=rig.legs[id];
    for(let finger=-1.5;finger<=1.5;finger++){
      for(let k=0;k<3;k++){
        const f=k/2;
        voxel(nailsVox,finger*.29,-.02-f*.07,-.02-f*.40,.22,
          pick(colors.claw,finger,k,1),.205*(1-.38*f),.21*(1-.35*f),.23);
      }
    }
    pack(nailsVox,"FOUR LARGE DARK TOE CLAWS",group);nails.push({group,leg});
  }

  // The original continuous anaconda tail is voxelized in instancing space;
  // each ring is recomputed directly from animated position attributes.
  const snakeTail=st.tail.geometry.attributes.position;
  const tailSamples=[];
  for(let ring=0;ring<=124;ring+=2){
    for(let side=0;side<20;side++){
      const u=ring/124,ang=side/20*Math.PI*2;
      const mod=Math.sin(u*67+side*.23)+.7*Math.sin(u*112-side*.43);
      const dark=mod>.47;
      const underskin=side>=9&&side<=14;
      const col=underskin?colors.snake[5]:
        (dark?colors.snake[0]:pick(colors.snake,ring,side,3));
      tailSamples.push({ring,side,col});
    }
  }
  const tailVox=new T.InstancedMesh(cube,baseMaterial,tailSamples.length);
  tailVox.name="BLOCK SCALE SNAKE TAIL CONNECTED TO HIPS";
  tailVox.frustumCulled=false;
  for(let i=0;i<tailSamples.length;i++)
    tailVox.setColorAt(i,scratch.setHex(tailSamples[i].col));
  if(tailVox.instanceColor)tailVox.instanceColor.needsUpdate=true;
  deco.add(tailVox);
  // Snake head: elongated squared predatory snout, amber eyes, open mouth,
  // venom fangs and split red tongue. Follows the original animated head.
  const snakeHeadSource=st.meshes.find(m=>m.name==="RAISED PREDATOR SNAKE HEAD");
  const snakeJawSource=st.meshes.find(m=>m.name==="SEPARATE LOWER SNAKE JAW");
  const head=new T.Group();head.name="SCULPTED VOXEL ANACONDA HEAD";deco.add(head);
  const snakeHeadVox=[];
  // local to the animated model's head center (not to its scaled mesh)
  const eHeads=[[0,0,0,.72,.46,.84],[0,-.12,-.63,.57,.25,.53]];
  const inHead=(x,y,z)=>eHeads.some(e=>sdfEllip(x,y,z,e)<1);
  const hs=.155;
  for(let ix=-6;ix<=6;ix++)for(let iy=-4;iy<=4;iy++)for(let iz=-9;iz<=7;iz++){
    const x=ix*hs,y=iy*hs,z=iz*hs;
    if(!inHead(x,y,z))continue;
    if(inHead(x+hs,y,z)&&inHead(x-hs,y,z)&&
      inHead(x,y+hs,z)&&inHead(x,y-hs,z)&&
      inHead(x,y,z+hs)&&inHead(x,y,z-hs))continue;
    const c=pick(y<-.20?colors.snake.slice(1):colors.snake,ix,iy,iz);
    voxel(snakeHeadVox,x,y,z,hs*1.10,c);
  }
  for(const side of [-1,1]){
    voxel(snakeHeadVox,side*.48,.19,-.49,.15,0x161d17,.25,.19,.18);
    voxel(snakeHeadVox,side*.48,.19,-.615,.13,0xffb628,.17,.13,.10);
    voxel(snakeHeadVox,side*.49,.19,-.675,.075,0x1b1c10,.046,.105,.041);
    for(let k=0;k<7;k++){
      const t=k/6;
      voxel(snakeHeadVox,side*(.34-.08*t),-.16-.67*t,-.85-.09*t,
        .14,colors.bone[k%3],.17*(1-t)+.04,.16,.15);
    }
  }
  for(let k=0;k<10;k++){
    const t=k/9;
    voxel(snakeHeadVox,-.06*t,-.31-.11*t,-1.04-t*.60,
      .115,0x8a324b,.12,.12,.18);
    if(k>6)for(const side of [-1,1])
      voxel(snakeHeadVox,side*(k-6)*.048,-.39,-1.55-(k-7)*.08,
        .10,0xb24b5a,.11,.09,.16);
  }
  pack(snakeHeadVox,"GREEN VOXEL SNAKE / EYES / FANGS / FORKED TONGUE",head);
  const snakeJaw=new T.Group();snakeJaw.name="OPEN LOWER SERPENT JAW";deco.add(snakeJaw);
  const snakeJawVox=[];
  for(let x=-.48;x<=.48;x+=.16)for(let z=-.46;z<=.52;z+=.16)
    if(x*x/.55**2+z*z/.60**2<1)
      voxel(snakeJawVox,x,0,z,.17,pick(colors.snake,x,z,8));
  pack(snakeJawVox,"FANGED LOWER SNAKE JAW",snakeJaw);

  // Empty holders are cheap; only five dynamic instance buffers are updated.
  const v1=new T.Vector3(),v2=new T.Vector3(),basis=new T.Vector3(),binorm=new T.Vector3();
  function update(animation){
    const r=animation?.roar||0;
    // Facial ornaments travel WITH the cranial skin during the roar.
    // The jaw stays physically joined at both corners.
    // The visible voxel body is rigid; keep all face sections joined.
    // Never inherit the hidden clay mesh's large vertex deformation.
    mane.position.y=.045*r;
    horns.position.y=.035*r;
    face.position.y=.045*r;
    jawGroup.position.y=-.13*r;
    jawGroup.rotation.x=-.045*r;
    for(const {leg,descs,mesh} of legMeshes){
      const q=leg.display||{mid:leg.elbow,wrist:leg.wrist,paw:leg.paw,toe:leg.toe};
      const chain=[
        [leg.shoulder,q.mid],[q.mid,q.wrist],
        [q.wrist,q.paw],[q.paw,q.toe]];
      for(let i=0;i<descs.length;i++){
        const d=descs[i],segment=chain[d.part];
        const a=segment[0],b=segment[1];
        v1.set(b[0]-a[0],b[1]-a[1],b[2]-a[2]).normalize();
        basis.set(1,0,0).addScaledVector(v1,-v1.x).normalize();
        binorm.crossVectors(v1,basis).normalize();
        const x=a[0]+(b[0]-a[0])*d.t,
          y=a[1]+(b[1]-a[1])*d.t,
          z=a[2]+(b[2]-a[2])*d.t;
        dummy.position.set(x+basis.x*Math.cos(d.a)*d.radius+
          binorm.x*Math.sin(d.a)*d.radius,
          y+basis.y*Math.cos(d.a)*d.radius+
          binorm.y*Math.sin(d.a)*d.radius,
          z+basis.z*Math.cos(d.a)*d.radius+
          binorm.z*Math.sin(d.a)*d.radius);
        dummy.rotation.set(0,0,0);
        const block=d.part===3?.24:.225;
        dummy.scale.set(block,block,block);dummy.updateMatrix();
        mesh.setMatrixAt(i,dummy.matrix);
      }
      mesh.instanceMatrix.needsUpdate=true;
    }
    for(const {group,leg} of nails){
      group.position.set(...(leg.display?.toe||leg.toe));
    }
    for(let i=0;i<tailSamples.length;i++){
      const {ring,side}=tailSamples[i];
      const v=(ring*20+side)*3,arr=snakeTail.array;
      dummy.position.set(arr[v],arr[v+1],arr[v+2]);
      dummy.rotation.set(0,0,0);
      dummy.scale.set(.215,.215,.215);dummy.updateMatrix();
      tailVox.setMatrixAt(i,dummy.matrix);
    }
    tailVox.instanceMatrix.needsUpdate=true;
    if(snakeHeadSource)head.position.copy(snakeHeadSource.position);
    if(snakeHeadSource)head.rotation.copy(snakeHeadSource.rotation);
    if(snakeJawSource)snakeJaw.position.copy(snakeJawSource.position);
    if(snakeJawSource)snakeJaw.rotation.copy(snakeJawSource.rotation);
  }
  update();
  return {update,decor:deco,kind:"voxel-reference-3d"};
}
