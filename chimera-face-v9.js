/**
 * NEXACRAFT V9 — COMPLETE new dark feline roaring face.
 * Does not paint over the old face: V8 base has excised the original
 * skull from both body and mane. This module deletes V8 head completely.
 * True Three.js live 3D voxel meshes. No images, no GLB, no canvas textures.
 */
import {dressChimera as assembleBody} from "./chimera-reference-face-v8.js?v=v9BodyHeadRemoved20261014";
export function dressChimera(root,T){
  const base=assembleBody(root,T), torso=base.decor;
  for(const node of [...torso.children])
    if(/CHIMERA V8 REPLACED FULL LION HEAD/.test(node.name||""))
      torso.remove(node);
  const head=new T.Group();
  head.name="V9 — TOTALLY NEW FEROCIOUS LION FACE";
  torso.add(head);
  const cube=new T.BoxGeometry(1,1,1),
    voxelMat=new T.MeshStandardMaterial({color:0xffffff,roughness:.94,metalness:0,flatShading:true}),
    glow=new T.MeshBasicMaterial({color:0xffae29});
  const dummy=new T.Object3D(),color=new T.Color();
  const rnd=(a,b,c)=>{const x=Math.sin(a*129.7+b*311.7+c*75.31)*43758.54;return x-Math.floor(x);};
  const palette=(arr,a,b,c)=>arr[Math.floor(rnd(a,b,c)*arr.length)];
  const brown=[0x3e2c26,0x4a342b,0x5b3b2c,0x705036,0x382c29],
    darkBrown=[0x211916,0x30221c,0x463024,0x66402a],
    muzzleTan=[0xb98b59,0xd6a36c,0xe9bc83,0xcea072,0xf0cb92],
    russet=[0x632b16,0x7a3519,0x95401c,0x9c5122,0xb5652b,0xcf833b,0xd58f43],
    ivory=[0xffedcf,0xf4dbb5,0xe4ca9e,0xd8b790],
    mouth=[0x11090d,0x211017,0x351219], tongue=[0x983943,0x732b37,0xae4d56],
    lipColor=[0x563423,0x7a4d2c,0x9c663c,0xb67f4b];
  function add(list,x,y,z,w,h,d,colors,i=0,j=0,k=0){
    list.push([x,y,z,w,h,d,Array.isArray(colors)?palette(colors,i,j,k):colors]);
  }
  function batch(list,name,parent=head,material=voxelMat){
    const m=new T.InstancedMesh(cube,material,list.length);
    m.name=name;m.frustumCulled=false;
    for(let i=0;i<list.length;i++){
      const q=list[i];
      dummy.position.set(q[0],q[1],q[2]);
      dummy.rotation.set(0,0,0);dummy.scale.set(q[3],q[4],q[5]);
      dummy.updateMatrix();m.setMatrixAt(i,dummy.matrix);
      m.setColorAt(i,color.setHex(q[6]));
    }
    m.instanceMatrix.needsUpdate=true;
    if(m.instanceColor)m.instanceColor.needsUpdate=true;
    parent.add(m);return m;
  }
  function ellipsoid(list,x0,y0,z0,rx,ry,rz,colors,seed=0,step=.128,cut){
    const sphere=(x,y,z)=>
      ((x-x0)/rx)**2+((y-y0)/ry)**2+((z-z0)/rz)**2;
    const nx=Math.ceil(rx/step),ny=Math.ceil(ry/step),nz=Math.ceil(rz/step);
    for(let ix=-nx;ix<=nx;ix++)for(let iy=-ny;iy<=ny;iy++)
    for(let iz=-nz;iz<=nz;iz++){
      const x=x0+ix*step,y=y0+iy*step,z=z0+iz*step;
      if(sphere(x,y,z)>1||cut?.(x,y,z))continue;
      if(sphere(x-step,y,z)<1&&sphere(x+step,y,z)<1&&
         sphere(x,y-step,z)<1&&sphere(x,y+step,z)<1&&
         sphere(x,y,z-step)<1&&sphere(x,y,z+step)<1)continue;
      add(list,x,y,z,step*1.04,step*1.04,step*1.04,colors,ix+seed,iy,iz);
    }
  }
  // The muscular cranium ends BEHIND the projecting black lion muzzle.
  // Unlike the old upright snout, the profile has a flat feline forehead.
  const bone=[],muzzle=[],brow=[],eyes=[],cavity=[],lips=[],fangs=[],sideHair=[],teeth=[];
  const centerZ=-5.35;
  // Black-dark forehead much broader than gold muzzle; brow shadows
  // sit OVER bright amber eyes, as in the concept close-up.
  ellipsoid(bone,0,4.18,centerZ,1.20,.79,.68,brown,7,.13,
    (x,y,z)=>Math.abs(x)<.77&&y<3.80&&z<-5.27);
  ellipsoid(bone,-.87,3.92,-5.41,.43,.57,.43,brown,10,.13);
  ellipsoid(bone,.87,3.92,-5.41,.43,.57,.43,brown,17,.13);
  for(const side of [-1,1]){
    // Projection of the forehead in profile, square strong brows.
    for(let j=0;j<11;j++){
      const t=j/10;
      const x=side*(.12+.95*t), y=4.40+.21*t-.08*Math.sin(t*Math.PI);
      add(brow,x,y,-5.99,.175,.30,.28,
        [0x211818,0x2b1d1a,0x403025],j,side,19);
      if(j%2===0)
        add(brow,x,y+.17,-5.92,.155,.16,.21,brown,j,side,22);
    }
    // The rim is huge, but the pupil is narrow and glowing, not a square eye.
    add(brow,side*.52,4.18,-6.08,.41,.27,.19,0x120e0f);
    add(brow,side*.52,4.18,-6.208,.29,.12,.08,0x663518);
    add(eyes,side*.52,4.20,-6.275,.20,.102,.06,0xffffff);
    add(brow,side*.526,4.197,-6.333,.049,.115,.039,0x0d0a09);
    add(brow,side*.486,4.235,-6.348,.037,.031,.036,0xffe1a1);
    // Defined dark heavy cheekbone blending into the gold nose.
    ellipsoid(bone,side*.89,3.83,-5.57,.52,.50,.45,
      [0x463126,0x5e3f2e,0x704b35,0x795138],side+30,.13);
    // Full feline pads on either side, their joint creates a W-shaped
    // upper lip and a triangular nose. No long ungulate nose bridge.
    ellipsoid(muzzle,side*.34,3.69,-6.025,.44,.31,.40,muzzleTan,side+12,.113);
    for(let j=0;j<9;j++){
      const t=j/8;
      add(lips,side*(.75+.04*t),3.59-.75*t,-6.025+.03*t,
        .215,.22,.21,lipColor,j,side,6);
    }
    // Shadows and folds separating upper muzzle from the mouth.
    for(let j=0;j<6;j++){
      const x=side*(.13+j*.113),y=3.52-j*.015;
      add(lips,x,y,-6.37,.15,.09,.10,[0x3a241c,0x5c3524,0x8a5731],j,side,5);
    }
    // Precisely placed 3D saber fang. Its curved tip hangs INSIDE dark gape.
    for(let j=0;j<27;j++){
      const t=j/26,w=.245*Math.pow(1-t,.72)+.02;
      const x=side*(.51-.16*t),y=3.57-1.43*t,
        z=-6.45-.19*Math.sin(Math.PI*t);
      add(fangs,x,y,z,w*1.52,.076,w*1.67,ivory,j,side,9);
    }
    // A small cheek tooth beside each long canine.
    for(let n=0;n<3;n++)for(let j=0;j<7;j++){
      const t=j/6,w=.09*(1-t)+.02;
      add(teeth,side*(.17+n*.12),3.54-.22*t,-6.455,
        w*1.55,.055,w*1.5,ivory,n,j,side);
    }
    // Left/right face side fur grows around jaws without covering eyes.
    for(let row=0;row<9;row++){
      const y=4.44-row*.235;
      for(let j=0;j<7;j++){
        const t=j/6;
        const x=side*(1.04+j*.135),z=-5.43+.31*t;
        add(sideHair,x,y-.17*t,z,
          .23,.25,.24,russet,row,j,side);
      }
    }
    // Smoothed stepped tufted wolf-style cheeklocks further from the face.
    for(let strand=0;strand<63;strand++){
      const x0=side*(1.12+.60*rnd(strand,side,13)),
        y0=4.64+.24*rnd(strand,side,2),
        z0=-4.83-.36*rnd(strand,side,5);
      const length=1.25+1.23*rnd(strand,side,7);
      const count=9+Math.floor(5*rnd(strand,side,9));
      for(let j=0;j<count;j++){
        const t=j/(count-1);
        const x=x0+side*(.20*t+.045*Math.sin(j*.77+strand)),
          y=y0-length*t,z=z0-.15*t;
        add(sideHair,x,y,z,.205,.24,.23,
          t<.30?russet:[0xa75829,0xbd6c30,0xd08339],
          strand,j,side);
      }
    }
  }
  // Broad black lion nose — flattened inverted triangle.
  for(let r=0;r<4;r++)for(let i=-(6-r);i<=6-r;i++){
    add(muzzle,i*.096,3.90-r*.097,-6.50+.015*Math.abs(i),
      .111,.111,.15,[0x161313,0x231c1b,0x36302c],i,r,9);
  }
  // Dark nostril wells, not a white/pale equine upper snout.
  for(const side of [-1,1])
    add(muzzle,side*.31,3.87,-6.60,.16,.08,.05,0x0f0c0c);
  // A deep hollow mouth: black throat recessed behind the gold lips. Tall,
  // wide and oval with actual BLACK SPACE at the bottom sides.
  for(let iy=0;iy<16;iy++)for(let ix=-9;ix<=9;ix++){
    const x=ix*.086,y=2.30+iy*.094;
    const v=(x/.81)**2+((y-3.08)/.80)**2;
    if(v>=1)continue;
    const z=-5.97+.14*v;
    add(cavity,x,y,z,.093,.10,.108,
      [0x08070a,0x170b11,0x220f14],ix,iy,12);
    if(y<2.77&&Math.abs(x)<.37)
      add(cavity,x,y,z-.065,.092,.1,.06,tongue,ix,iy,15);
  }
  // Upper mouth is U-shaped. No old pale "teeth wall".
  for(const side of [-1,1])for(let row=0;row<5;row++){
    const y=3.50+.060*row;
    for(let j=0;j<5;j++){
      const x=side*(.24+j*.126);
      add(lips,x,y,-6.22+.07*row,.146,.11,.15,lipColor,row,j,side);
    }
  }
  // Physical lower jaw U with empty black center and separate teeth.
  const jawPivot=new T.Group();jawPivot.name="DARK-LIPPED HINGED LION MANDIBLE";
  jawPivot.position.set(0,3.62,-5.62);
  head.add(jawPivot);
  const jaw=[],lowerTeeth=[],chin=[];
  for(let i=-8;i<=8;i++)for(let j=0;j<11;j++){
    const x=i*.103,z=-.88+j*.097;
    const e=(x/.91)**2+((z+.42)/.56)**2;
    if(e>=1)continue;
    const front=j<2,edge=Math.abs(i)>6;
    if(!front&&!edge)continue;
    add(jaw,x,-1.22,z,.132,.18,.13,
      [0x9d754c,0xb58153,0xc7975d,0xd3ab75],i,j,21);
  }
  for(const side of [-1,1]){
    for(let i=0;i<14;i++){
      const t=i/13;
      add(jaw,side*(.74+.035*Math.sin(t*Math.PI)),
        -1.21+1.17*t,-.66+.55*t,
        .173,.190,.172,[0x705038,0x8b5e41,0xa7794d],i,side,12);
    }
    for(let j=0;j<9;j++){
      const t=j/8,w=.133*(1-t)+.019;
      add(lowerTeeth,side*(.37-.09*t),-.99+.48*t,
        -.83-.05*t,w*1.5,.065,w*1.6,ivory,j,side,22);
    }
  }
  for(let i=-4;i<=4;i++)for(let j=0;j<5;j++){
    const t=j/4;
    add(chin,i*.127,-1.37-t*.34+Math.abs(i)*.018,
      -.68+.09*t,.154,.160,.151,muzzleTan,i,j,13);
  }
  batch(jaw,"GOLD LOWER LION JAW WITH GAP",jawPivot);
  batch(lowerTeeth,"UPWARD TEETH IN LION JAW",jawPivot);
  batch(chin,"WILD FUR UNDER CHIN",jawPivot);
  // Top center fringe unites head and body mane visually.
  for(let strand=0;strand<120;strand++){
    const x=(rnd(strand,1,6)*2-1)*1.06,
      y=4.75+.27*rnd(strand,3,1),
      z=-4.85-.48*rnd(strand,6,2);
    const n=3+Math.floor(rnd(strand,8,2)*6);
    for(let k=0;k<n;k++)
      add(sideHair,x+.015*k,y+.10*k,z+.015*k,
        .22,.24,.22,russet,strand,k,26);
  }
  const parts=[
    [bone,"DARK WIDE LION SKULL"],[brow,"BLACK ANGRY BROWS / PUPILS"],
    [eyes,"2 GLOWING LION EYES",glow],
    [muzzle,"SPLIT LION MUZZLE + BLACK NOSE"],
    [lips,"DARK UPPER LIPS AROUND OPEN MOUTH"],
    [cavity,"REAL DEEP OVAL ROARING MAW"],
    [fangs,"GIANT LONG IVORY CURVED FANGS"],
    [teeth,"SMALL UPPER INCISORS"],[sideHair,"FACE FRAMING DARK ORANGE RUFF"]
  ];
  for(const [pieces,name,m] of parts)batch(pieces,name,head,m||voxelMat);
  let last=0;
  function update(motion){
    base.update(motion);
    const roar=motion?.roar||0;
    head.position.y=.03*roar;
    jawPivot.position.y=3.62-.23*roar;
    jawPivot.rotation.x=-.14*roar;
    last=roar;
  }
  update();
  return {...base,update,kind:"CHIMERA-LION-FACE-V9",actualHead:head,
    oldHeadRemoved:true,voxelsNew:parts.reduce((n,p)=>n+p[0].length,0)};
}
