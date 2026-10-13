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

  // Real 3D lion face: sculpted muzzle and brows, recessed eyes,
  // deep roaring mouth, sabre canines and a hinged lower jaw.
  // The reference is a SHORT/BROAD lion face, not a long canine snout.
  const face=new T.Group();face.name="REFERENCE LION HEAD / ANATOMICAL MUZZLE";
  deco.add(face);
  const headShell=[],faceTrim=[],oral=[],goldEyes=[];
  const addFace=(arr,x,y,z,sx,sy,sz,col)=>
    voxel(arr,x,y,z,Math.min(sx,sy,sz),col,sx,sy,sz);
  const faceStep=.145;
  function faceMass(name,x0,y0,z0,rx,ry,rz,palette,seed,mode="all"){
    const dim=(v,r)=>Math.ceil(r/faceStep)+1;
    for(let ix=-dim(x0,rx);ix<=dim(x0,rx);ix++)
    for(let iy=-dim(y0,ry);iy<=dim(y0,ry);iy++)
    for(let iz=-dim(z0,rz);iz<=dim(z0,rz);iz++){
      const x=x0+ix*faceStep,y=y0+iy*faceStep,z=z0+iz*faceStep;
      const norm=(x,y,z)=>Math.sqrt(((x-x0)/rx)**2+
        ((y-y0)/ry)**2+((z-z0)/rz)**2);
      if(norm(x,y,z)>=1 ||
        (norm(x+faceStep,y,z)<1&&norm(x-faceStep,y,z)<1&&
         norm(x,y+faceStep,z)<1&&norm(x,y-faceStep,z)<1&&
         norm(x,y,z+faceStep)<1&&norm(x,y,z-faceStep)<1))continue;
      if(mode==="side" && Math.abs(x)<.40)continue;
      const shade=pick(palette,ix+seed,iy,iz);
      addFace(headShell,x,y,z,faceStep*1.05,faceStep*1.05,
        faceStep*1.05,shade);
    }
  }
  // A compact squared cranium, wide temples, heavy cheeks and whisker pads.
  faceMass("broad lion forehead",0,3.99,-4.23,1.02,.67,.84,
    [0x5d4536,0x72503b,0x825739,0x66503d],11);
  for(const side of [-1,1]){
    faceMass("high cheekbone",side*.77,3.75,-4.46,.45,.51,.53,
      [0x885b37,0x986b41,0x674b36,0xac7848],24+side);
    faceMass("feline muzzle pad",side*.30,3.68,-4.91,.40,.24,.39,
      [0xd3a06b,0xc69560,0xb98653,0xe0ad75],43+side);
  }
  // A recessed mouth reads as an opening even from 3/4 profile.
  for(let y=2.94;y<=3.54;y+=.13)for(let x=-.58;x<=.58;x+=.13){
    const nx=x/.69,ny=(y-3.23)/.42;
    if(nx*nx+ny*ny<1){
      const depth=-5.12-.06*(1-nx*nx);
      addFace(oral,x,y,depth,.14,.14,.15,
        pick([0x180e13,0x2a1418,0x35181c],x,y,5));
    }
  }
  // Interior throat and reddish tongue are behind the sharp teeth.
  for(let y=3.03;y<=3.36;y+=.12)for(let x=-.30;x<=.30;x+=.12){
    const nx=x/.41,ny=(y-3.15)/.25;
    if(nx*nx+ny*ny<1)
      addFace(oral,x,y,-5.17,.12,.12,.08,
        pick([0x5c242c,0x8d3542,0x461c27],x,y,4));
  }
  // Wide, powerful brows meet the bridge of the nose. Their deep lower
  // surfaces make the two bright amber pupils visibly inset.
  for(const side of [-1,1]){
    for(let j=0;j<7;j++){
      const x=side*(.20+j*.11),y=4.31-Math.abs(j-2)*.032;
      addFace(faceTrim,x,y,-5.10,.145,.23,.21,
        pick([0x302a27,0x4d3932,0x72513b],j,side,1));
    }
    // eye socket / iris / slit pupil stacked along local forward (-Z)
    addFace(faceTrim,side*.51,4.105,-5.137,.38,.205,.18,0x241b19);
    addFace(faceTrim,side*.51,4.110,-5.240,.255,.135,.075,0x87531f);
    addFace(goldEyes,side*.51,4.12,-5.292,.18,.095,.060,0xffffff);
    addFace(faceTrim,side*.525,4.12,-5.346,.042,.100,.045,0x110e0c);
    addFace(faceTrim,side*.46,4.158,-5.349,.050,.035,.045,0xffe9a1);
    // Feline whisker pads, darker smile line and strong upper lip.
    addFace(faceTrim,side*.35,3.63,-5.253,.50,.25,.21,0xce9862);
    for(let j=0;j<3;j++)
      addFace(faceTrim,side*(.30+.11*j),3.55-.026*j,-5.29,
        .12,.09,.095,0x513025);
    // Small nostril creases and pointed outer ears in the mane.
    addFace(faceTrim,side*.30,3.79,-5.356,.13,.093,.09,0x241d1c);
    addFace(faceTrim,side*.94,4.69,-3.95,.42,.52,.33,0x503123);
    addFace(faceTrim,side*.96,4.72,-4.16,.25,.30,.13,0xc38a51);
    // Two great downward sabre fangs; the taper is subtle at the top.
    const sabreFrom=[side*.51,3.57,-5.30],
      sabreTo=[side*.39,2.70,-5.37];
    for(let k=0;k<15;k++){
      const t=k/14;
      const tipX=sabreFrom[0]*(1-t)+sabreTo[0]*t;
      const w=.18*Math.pow(1-t,.68)+.028;
      addFace(faceTrim,tipX,3.57-.87*t,
        -5.30-.06*Math.sin(Math.PI*t),w*1.55,.083,w*1.55,
        pick([0xf2dcad,0xffe6b9,0xdec291],k,side,3));
    }
    // Secondary incisors frame the opening without closing it.
    for(let j=0;j<3;j++){
      const x=side*(.18+j*.105);
      for(let k=0;k<4;k++){
        const v=k/3;
        addFace(faceTrim,x,3.53-v*.15,-5.29,
          .095*(1-v)+.025,.07,.11*(1-v)+.028,0xdcca9e);
      }
    }
  }
  // Broad, triangular black lion nose rather than a pinched dog snout.
  for(let j=-4;j<=4;j++)for(let k=0;k<3;k++){
    const x=j*.105,y=3.80-k*.08;
    if(Math.abs(j)>4-k)continue;
    addFace(faceTrim,x,y,-5.39+(Math.abs(j)*.009),
      .125,.11,.15,pick([0x18191b,0x2c2526,0x393031],j,k,9));
  }
  // The central philtrum is dark; the side muzzle remains golden.
  for(let j=0;j<3;j++)
    addFace(faceTrim,0,3.63-j*.10,-5.344,.11,.105,.094,0x372626);
  const headBody=pack(headShell,"WIDE LION CRANIUM AND JOWLS",face);
  const mouthMesh=pack(oral,"OPEN DARK THROAT AND TONGUE",face);
  const detailMesh=pack(faceTrim,"REAL LION BROW / NOSE / SABERS",face);
  const ember=pack(goldEyes,"GLOWING GOLD LION IRIS",face);
  ember.material=new T.MeshBasicMaterial({color:0xffb92e});
  // Hinged lower jaw: the original skeletal solver moves this assembly.
  // Its front lip projects to the same plane as the upper sabres.
  const jawSource=st.meshes.find(m=>m.name==="OPEN LOWER LION JAW");
  const jawGroup=new T.Group();jawGroup.name="HINGED LOWER LION JAW / VOXEL";
  deco.add(jawGroup);
  const jawVox=[],jawTongue=[];
  // Original jaw pivot is approximately (0, 3.00, -4.22).
  // Its visible lip needs to reach forward to world Z -5.3.
  for(let ix=-6;ix<=6;ix++)for(let iz=-7;iz<=1;iz++){
    const x=ix*.12,z=-.49+iz*.11;
    const e=x*x/.79**2 + (z+.78)**2/.67**2;
    if(e>.98)continue;
    const edge=Math.abs(x)>.55||iz<-4;
    const y=edge?.014:-.058;
    addFace(jawVox,x,y,z,.135,.16,.14,
      pick(edge?[0x916843,0xae8050,0xc18b55]:
        [0x64412f,0x77503a,0x8f6346],ix,iz,2));
  }
  // Cheek-side jaw bones curl up around the mouth.
  for(const side of [-1,1])for(let k=0;k<9;k++){
    const t=k/8;
    addFace(jawVox,side*(.70-.06*t),.01+t*.25,-.48-t*.34,
      .16,.14,.15,pick([0x775239,0xa37b52],k,side,4));
  }
  // Lower upward canines.
  for(const side of [-1,1])for(let k=0;k<8;k++){
    const t=k/7;
    addFace(jawVox,side*(.40-.08*t),.10+.38*t,-1.01-.055*t,
      .16*(1-t)+.045,.11,.17*(1-t)+.035,
      pick([0xf2d8ae,0xd2b98e],k,side,5));
  }
  // Exposed mouth tongue follows opening of hinged lower jaw.
  for(let k=0;k<8;k++){
    const t=k/7;
    addFace(jawTongue,0,.055+.045*Math.sin(t*Math.PI),
      -.46-.60*t,.25*(1-.55*t),.09,.16,0x9d4754);
  }
  pack(jawVox,"LOWER JAW CHIN / UPPER-FACING TEETH",jawGroup);
  pack(jawTongue,"LION TONGUE",jawGroup);

  // Framing locks along cheeks: keeps the face integrated with its mane.
  // These are actual cuboids and do not cover the glowing eyes.
  const framing=[];
  for(const side of [-1,1]){
    for(let row=0;row<4;row++)for(let j=0;j<15;j++){
      const t=j/14;
      const x=side*(1.08+.10*Math.sin(j*1.31)+.16*row);
      const y=4.23-j*.075-row*.035;
      const z=-4.25-.11*(row%2)-.27*t;
      addFace(framing,x,y,z,.20,.23+.11*t,.20,
        pick(colors.mane,j,row,side+9));
    }
    for(let j=0;j<25;j++){
      const t=j/24,x=side*(.85+1.00*t);
      const y=4.56+.36*Math.sin(t*Math.PI),z=-3.96+.28*t;
      addFace(framing,x,y,z,.225,.20,.225,
        pick(colors.mane,j,side,22));
    }
  }
  const faceFrame=pack(framing,"MANE LOCKS FRAME LION FACE",face);

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
    mane.position.y=.15*r;
    horns.position.y=.21*r;
    face.position.y=.055*r;
    // No scenery changes: all movements happen in model-local space.
    if(jawSource){
      jawGroup.position.copy(jawSource.position);
      jawGroup.rotation.copy(jawSource.rotation);
    }
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
