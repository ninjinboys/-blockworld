/**
 * CHIMERA V7 — ACTUAL THREE-DIMENSIONAL LION FACE REPLACEMENT.
 * Keeps the V5 body / limbs / buffalo horns / anaconda, but completely
 * removes the previous lion-face meshes. No reference image is rendered.
 * Inspired by reference: fierce short dark lion brow, deeply recessed mouth,
 * massive sabre teeth, layered orange face ruff with volumetric silhouette.
 */
import {dressChimera as baseModel} from "./chimera-v5-reference.js?v=v7_20261014body";
export function dressChimera(root,T) {
  const base=baseModel(root,T);
  const container=base.decor;
  for(const old of [...container.children]) {
    if(/LION FACE V5|LION HEAD V6|REFERENCE LION FACE/.test(old.name||""))
      container.remove(old);
  }
  // V5 torso contains an OLD LION FACE already baked into the torso batch.
  // Remove it geometrically; adding ornaments before did NOT remove it.
  const erased={skull:0,hair:0};
  const mtx=new T.Matrix4(),zero=new T.Matrix4().makeScale(0,0,0);
  function strip(mesh,section) {
    for(let i=0;i<mesh.count;i++){
      mesh.getMatrixAt(i,mtx);
      const m=mtx.elements,x=m[12],y=m[13],z=m[14];
      const cut=section==="skull"
        ?((z < -3.43 && y > 2.65)||(z < -4.0 && y > 2.10))
        :(z < -4.54 && Math.abs(x)<1.25 && y>3.0 && y<4.65);
      if(cut){
        mesh.setMatrixAt(i,zero);
        erased[section]++;
      }
    }
    mesh.instanceMatrix.needsUpdate=true;
  }
  for(const mesh of container.children){
    if(mesh.name==="VOXEL CHEST / LION CORE / RUMP")
      strip(mesh,"skull");
    if(mesh.name==="LAYERED SHAGGY ORANGE MANE")
      for(const layer of mesh.children)
        if(layer.name?.includes("INTERLOCKING BLOCK-MANE"))strip(layer,"hair");
  }
  console.info("Chimera V8 old baked-in face removed",erased);
  const head=new T.Group();
  head.name="CHIMERA V8 REPLACED FULL LION HEAD, NOT AN OVERLAY";
  head.position.z=-.48;
  container.add(head);
  const atlas={
    cranium:[0x382d29,0x43332c,0x543f34,0x634738,0x725039],
    upper:[0x705039,0x815b3c,0x8d6243,0x9b704a],
    bridge:[0x403631,0x544137,0x5e4737],
    tan:[0xe0b982,0xcda16d,0xd7ae78,0xc29360,0xe5be8d],
    under:[0xb8814c,0x95633d,0xa87543,0xc48d58],
    brown:[0x8a421e,0x9a4d24,0xad5c25,0xc26f2c,0xd28b3e,0x69331d,0x7b3c20],
    darkbrown:[0x39231c,0x4c291e,0x66351f,0x86431e],
    bone:[0xf7e6c4,0xe8d5b0,0xdac49c,0xffedce],
    lips:[0x301e1c,0x4c2c23,0x5c3627],
    mouth:[0x110b0d,0x1b0b11,0x30121b],
    tongue:[0x88313d,0xb05058,0x6c2735]
  };
  const cube=new T.BoxGeometry(1,1,1);
  const mat=new T.MeshStandardMaterial({color:0xffffff,roughness:.96,metalness:0,flatShading:true});
  const light=new T.MeshBasicMaterial({color:0xffc045});
  const obj=new T.Object3D(),color=new T.Color();
  const rand=(a,b,c)=>{
    let n=Math.sin(a*127.1+b*311.7+c*74.7)*43758.5453123;
    return n-Math.floor(n);
  };
  const sample=(p,a,b,c)=>p[Math.min(p.length-1,Math.floor(rand(a,b,c)*p.length))];
  const box=(list,x,y,z,w,h,d,pal,a,b,c)=>{
    list.push([x,y,z,w,h,d,Array.isArray(pal)?sample(pal,a,b,c):pal]);
  };
  const commit=(list,name,group=head,material=mat)=>{
    const inst=new T.InstancedMesh(cube,material,list.length);
    inst.name=name;inst.frustumCulled=false;
    for(let i=0;i<list.length;i++){
      const p=list[i];
      obj.position.set(p[0],p[1],p[2]);
      obj.rotation.set(0,0,0);
      obj.scale.set(p[3],p[4],p[5]);
      obj.updateMatrix();inst.setMatrixAt(i,obj.matrix);
      inst.setColorAt(i,color.setHex(p[6]));
    }
    inst.instanceMatrix.needsUpdate=true;
    if(inst.instanceColor)inst.instanceColor.needsUpdate=true;
    group.add(inst);return inst;
  };
  const res=.126,cranium=[],bridge=[],cheeks=[],pads=[],eyes=[],eyeBack=[],nose=[],maw=[],tongue=[],fangs=[],teeth=[],ruff=[],brow=[];
  // Build only the visible surface of the merged head shapes, so adjoining
  // cheeks/brows are a single sculpt rather than a stack of floating cubes.
  const shapes=[
    [0,4.13,-4.82,1.16,.83,.75],
    [-.75,3.86,-4.98,.57,.66,.64],
    [.75,3.86,-4.98,.57,.66,.64],
    [0,4.42,-4.98,.92,.40,.57],
    [0,3.90,-5.02,.79,.36,.48]
  ];
  const inside=(x,y,z)=>shapes.some(s=>
    ((x-s[0])/s[3])**2+((y-s[1])/s[4])**2+
    ((z-s[2])/s[5])**2<1);
  const mouthCut=(x,y,z)=>
    y<3.75 && y>2.44 && Math.abs(x)<.83 && z< -5.07;
  for(let ix=-11;ix<=11;ix++)for(let iy=0;iy<=15;iy++)
  for(let iz=-12;iz<=8;iz++){
    const x=ix*res,y=3.20+iy*res,z=-4.88+iz*res;
    if(!inside(x,y,z)||mouthCut(x,y,z))continue;
    if(inside(x+res,y,z)&&inside(x-res,y,z)&&
      inside(x,y+res,z)&&inside(x,y-res,z)&&
      inside(x,y,z+res)&&inside(x,y,z-res)&&
      !mouthCut(x+res,y,z)&&!mouthCut(x-res,y,z)&&
      !mouthCut(x,y+res,z)&&!mouthCut(x,y-res,z))continue;
    const pal=y>4.26?atlas.cranium:
      (z<-5.17?atlas.bridge:atlas.upper);
    box(cranium,x,y,z,res*1.05,res*1.05,res*1.05,pal,ix,iy,iz);
  }
  // An oversized central feline brow shield and long angled brows,
  // with visible dark eyebrow shadows above angry glowing amber eyes.
  for(let side of [-1,1]){
    for(let j=0;j<11;j++){
      const t=j/10,x=side*(.055+t*.98);
      const y=4.50+.11*t-.065*Math.sin(t*Math.PI);
      box(brow,x,y,-5.68,.15,.30,.28,
        [0x271e1b,0x3b2a21,0x4f3627],j,side,4);
      if(j%2===0)
        box(brow,x,y+.17,-5.55,.16,.15,.21,atlas.cranium,j,side,5);
    }
    // A row of shadowed eye-sockets is deliberately wider than the iris.
    box(eyeBack,side*.51,4.185,-5.78,.46,.265,.21,0x100c0e,side,1,0);
    box(eyeBack,side*.51,4.185,-5.930,.325,.135,.11,0x572d18,side,2,0);
    box(eyes,side*.51,4.19,-6.012,.240,.115,.06,0xffcd38,side,3,0);
    box(eyeBack,side*.522,4.19,-6.064,.049,.125,.060,0x130d0c,side,4,0);
    box(eyeBack,side*.475,4.228,-6.071,.045,.036,.040,0xfff2ac,side,5,0);
    // Big feline eye/cheek ridge, NOT a cylindrical mammal snout.
    for(let j=0;j<11;j++){
      const t=j/10;
      box(cheeks,side*(.91+.10*t),4.07-.82*t,
        -5.23-.14*t,.26,.24,.25,
        atlas.upper,j,side,14);
    }
    // Feline pads are two pale bulges on each side of a triangular black nose.
    const px=side*.38,py=3.73,pz=-5.61,rx=.48,ry=.32,rz=.48;
    const field=(x,y,z)=>((x-px)/rx)**2+((y-py)/ry)**2+((z-pz)/rz)**2;
    for(let i=-4;i<=4;i++)for(let j=-3;j<=3;j++)
    for(let k=-4;k<=4;k++){
      const x=px+i*.120,y=py+j*.120,z=pz+k*.120;
      if(field(x,y,z)>1)continue;
      if(field(x+.12,y,z)<1&&field(x-.12,y,z)<1&&
        field(x,y+.12,z)<1&&field(x,y-.12,z)<1&&
        field(x,y,z+.12)<1&&field(x,y,z-.12)<1)continue;
      box(pads,x,y,z,.134,.134,.134,atlas.tan,i,j,k+side);
    }
    // Dark seams between pad and mouth, and subtle whisker spots.
    for(let j=0;j<4;j++){
      box(bridge,side*(.15+.15*j),3.545-j*.027,-6.16,
        .15,.087,.087,atlas.lips,j,side,2);
    }
    for(let j=0;j<3;j++)
      box(bridge,side*(.29+.105*j),3.666-.025*j,-6.15,
        .045,.049,.037,0x523624,j,side,6);
    // Eye-to-nose dark fur blade for aggressive lion scowl.
    for(let j=0;j<5;j++)
      box(bridge,side*(.26-.02*j),4.21-j*.073,-5.75-j*.043,
        .18,.175,.18,atlas.bridge,j,side,17);
    // Large sweeping saber-teeth truly hang from the ivory UPPER lip.
    // Distinct thick bases, curving tips, 1.25 blocks in length.
    for(let j=0;j<23;j++){
      const t=j/22,w=(.24*Math.pow(1-t,.73)+.027);
      box(fangs,side*(.51-.13*t),3.56-1.32*t,
        -6.15-.16*Math.sin(Math.PI*t),w*1.50,.079,w*1.72,
        atlas.bone,j,side,25);
    }
    // Two tiny front incisors, not a continuous solid pale mask.
    for(let tooth=0;tooth<2;tooth++)for(let j=0;j<5;j++){
      const t=j/4,r=.085*(1-t)+.027;
      box(teeth,side*(.15+tooth*.12),3.53-.20*t,
        -6.11,r*1.5,.065,r*1.6,atlas.bone,tooth,j,side);
    }
    // Ear pair embedded deeply in the neck ruff.
    box(ruff,side*1.07,4.81,-4.17,.42,.47,.31,
      [0x64341f,0x774222],side,0,0);
    box(ruff,side*1.07,4.83,-4.35,.23,.28,.11,0xa76835,side,1,0);
  }
  // The nose is a wide, near-black downward-facing triangle, not a box muzzle.
  for(let row=0;row<4;row++)for(let c=-(5-row);c<=5-row;c++){
    box(nose,c*.105,3.89-.084*row,-6.17+.015*Math.abs(c),
      .120,.112,.155,[0x1a1717,0x2a2220,0x342824],c,row,19);
  }
  for(let side of [-1,1])
    box(nose,side*.30,3.86,-6.30,.18,.075,.045,0x100e0e,side,1,12);
  for(let row=0;row<3;row++)
    box(bridge,0,3.59-row*.085,-6.18,.095,.105,.075,
      [0x40281e,0x6b4228],row,0,3);
  // An actually volumetric mouth opening with a black RECESSED throat.
  // Leave a 20cm gap between the forward teeth and throat black surface.
  for(let ix=-10;ix<=10;ix++)for(let iy=0;iy<=16;iy++){
    const x=ix*.083,y=2.39+iy*.084;
    const n=(x/.87)**2+((y-3.12)/.78)**2;
    if(n>1)continue;
    const z=-5.87+.05*n;
    box(maw,x,y,z,.090,.094,.085,atlas.mouth,ix,iy,4);
    if(y<2.95&&Math.abs(x)<.37&&n<.72)
      box(tongue,x,y,z-.065,.093,.089,.066,atlas.tongue,ix,iy,13);
  }
  // Upper lip folds over the dark cavern, no pale 'white smile' frame.
  for(let side of [-1,1])for(let j=0;j<10;j++){
    const t=j/9;
    box(bridge,side*(.15+.51*t),3.61-.085*t,-5.86,
      .15,.11,.16,[0x8c5735,0xaf7543,0xc38b53],side,j,0);
  }
  // Attached lower jaw pivots at each side of the face. No free/falling parts.
  const jaw=new T.Group();jaw.name="HINGED LION LOWER LIP AND CHIN";
  jaw.position.set(0,3.60,-5.27);head.add(jaw);
  const chin=[],lowerFangs=[],chinFur=[];
  for(let i=-8;i<=8;i++)for(let j=0;j<=8;j++){
    const x=i*.10,z=-.96+j*.106;
    if((x/.86)**2+((z+.67)/.52)**2>1)continue;
    if(j>2&&Math.abs(i)<5)continue; // hollow U
    box(chin,x,-1.21,z,.12,.17,.126,atlas.under,i,j,4);
  }
  for(let side of [-1,1]){
    for(let j=0;j<13;j++){
      const t=j/12;
      box(chin,side*(.67+.04*Math.sin(t*Math.PI)),
        -1.18+1.17*t,-.77+.66*t,
        .155,.178,.15,atlas.under,side,j,0);
    }
    for(let j=0;j<8;j++){
      const t=j/7,w=.125*(1-t)+.018;
      box(lowerFangs,side*(.39-.095*t),
        -1.10+.43*t,-.93-.07*t,
        w*1.45,.078,w*1.48,atlas.bone,side,j,1);
    }
  }
  for(let j=-4;j<=4;j++)for(let k=0;k<5;k++){
    const t=k/4;
    box(chinFur,j*.12,-1.38-t*.28+Math.abs(j)*.023,
      -.84+.10*t,.14,.15,.145,
      [0xc19058,0xe1aa70,0xb27c49],j,k,6);
  }
  commit(chin,"LOWER LION MANDIBLE / PHYSICAL U-SHAPE",jaw);
  commit(lowerFangs,"UPWARD LOWER CANINES",jaw);
  commit(chinFur,"GOLDEN LION CHIN FUR",jaw);
  // Frame the face with 3D curling hair tufts of uneven sizes and lengths.
  // Deep russet roots, glowing amber tips, a messy genuine lion silhouette.
  for(let side of [-1,1]){
    for(let strand=0;strand<75;strand++){
      const r=rand(side,strand,12),rr=rand(strand,side,20);
      const x0=side*(1.11+.62*r);
      const y0=4.78+.30*rand(strand,1,side);
      const z0=-4.40-.66*rand(strand,side,24);
      const length=1.40+1.15*rr;
      const sections=10+Math.floor(rand(strand,side,8)*6);
      for(let k=0;k<sections;k++){
        const t=k/(sections-1);
        const x=x0+side*(.16*t+.035*Math.sin(k*.7+strand*.8)),
          y=y0-length*t,
          z=z0-.23*t-.10*Math.sin(Math.PI*t);
        if(Math.abs(x)<1.06&&y>3.64)continue;
        const palette=t<.34?atlas.darkbrown:atlas.brown;
        box(ruff,x,y,z,.205+.04*rand(k,strand,4),.21,.22,
          palette,strand,k,side);
      }
    }
    // The mane hangs around the chin like a ruff but never covers the jaw.
    for(let row=0;row<7;row++)for(let t=0;t<6;t++){
      const x=side*(1.02+.15*t),y=3.77-.26*row,
        z=-4.87-.043*t;
      box(ruff,x,y,z,.24,.28,.22,atlas.brown,row,t,side);
    }
  }
  // Strong jagged fringe across the crown (back from eyes).
  for(let strand=0;strand<110;strand++){
    const x=(rand(strand,17,5)*2-1)*1.13;
    const z=-4.51-.66*rand(strand,6,3);
    const y=4.72+.26*rand(strand,3,4);
    const n=3+Math.floor(rand(strand,2,5)*5);
    for(let j=0;j<n;j++)
      box(ruff,x+j*.02,y+j*.095,z+j*.03,.24,.23,.235,
        atlas.brown,strand,j,3);
  }
  // Unmistakable NEW head independent of the older face,
  // all parts are parented under the SAME moving head group.
  commit(cranium,"SCULPTED BROAD LION CRANIUM");
  commit(cheeks,"HEAVY LION CHEEKBONES");
  commit(pads,"PALE SPLIT FELINE WHISKER PADS");
  commit(brow,"DARK ANGLED LION EYEBROWS");
  commit(eyeBack,"DEEPSET EYE SOCKETS");
  const glowingEyes=commit(eyes,"AMBER EYE FIRE");
  glowingEyes.material=light;
  commit(nose,"BROAD BLACK TRIANGULAR CAT NOSE");
  commit(bridge,"SHADOWS AND FACE BRIDGE");
  commit(maw,"HOLLOW 3D ROARING MOUTH");
  commit(tongue,"DEEP RED TONGUE");
  commit(fangs,"GIANT CURVED SABRE FANGS");
  commit(teeth,"UPPER INCISORS");
  commit(ruff,"SHAGGY LION FACE MANE + EARS");

  function update(animation){
    base.update(animation);
    const roar=animation?.roar||0;
    const bite=animation?.bite||0;
    jaw.rotation.x=-.16*roar+.065*bite;
    jaw.position.y=3.60-.18*roar;
    head.position.y=.018*roar;
  }
  update();
  return {...base,update,kind:"real-old-face-geometrically-removed-v8",
    actualHead:head,oldFaceRemoved:erased};
}
