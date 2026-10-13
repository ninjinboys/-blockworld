/**
 * NEXACRAFT — distinct feline face replacement V6.
 * V5 torso, mane, horns, four articulated legs and snake are preserved.
 * This module REMOVES V5 face mesh and replaces it with a new sculptural
 * voxel lion head, built as an independent part with its own moving jaw.
 */
import {dressChimera as dressBase} from "./chimera-v5-reference.js?v=20261013v5body";
export function dressChimera(root,T) {
  const base=dressBase(root,T);
  const deco=base.decor;
  const previous=deco.children.find(x=>x.name?.includes("LION FACE V5"));
  if(previous)deco.remove(previous);
  else console.warn("V6: old head not located; replacing face anyway");

  const head=new T.Group();
  head.name="V6 COMPLETELY REPLACED LION HEAD";
  deco.add(head);
  const tongueMat=new T.MeshStandardMaterial({roughness:.97});
  const voxMat=new T.MeshStandardMaterial({color:0xffffff,roughness:.94,flatShading:true});
  const cube=new T.BoxGeometry(1,1,1);
  const dummy=new T.Object3D(),col=new T.Color();
  const fract=x=>x-Math.floor(x);
  const rand=(x,y,z)=>fract(Math.sin(x*128.39+y*217.32+z*74.73)*43758.48);
  const pal=(colors,x,y,z)=>colors[Math.floor(rand(x,y,z)*colors.length)%colors.length];
  // Pixel cubes [x,y,z,width,height,depth,materialRGB].
  const make=(arr,x,y,z,w,h,d,c)=>arr.push([x,y,z,w,h,d,c]);
  const solid=(arr,n,group=head)=>{
    const inst=new T.InstancedMesh(cube,voxMat,arr.length);
    inst.name=n;inst.frustumCulled=false;
    for(let i=0;i<arr.length;i++){
      const [x,y,z,w,h,d,c]=arr[i];
      dummy.position.set(x,y,z);
      dummy.rotation.set(0,0,0);
      dummy.scale.set(w,h,d);dummy.updateMatrix();
      inst.setMatrixAt(i,dummy.matrix);
      inst.setColorAt(i,col.setHex(c));
    }
    inst.instanceMatrix.needsUpdate=true;
    if(inst.instanceColor)inst.instanceColor.needsUpdate=true;
    group.add(inst);
    return inst;
  };
  const ochre=[0x775038,0x845940,0x684631,0x9e6841,0xac7243];
  const muzzle=[0xc99560,0xd9a66b,0xe9bb83,0xb8834f,0xf1c58c];
  const dark=[0x302019,0x3f2921,0x241a18];
  const mane=[0x7f381b,0x9c4a1f,0xb5662a,0xcf7a31,0xa05525,0xd99543,0x68331d];
  const bone=[0xe8d2a5,0xf6dfb6,0xd3b889];
  const step=.135,skull=[],pads=[],brow=[],rim=[],eyes=[],lip=[],fangs=[],hair=[],cheeks=[];
  const shell=(arr,at,rad,shades,seed,cut)=>{
    const [cx,cy,cz]=at,[rx,ry,rz]=rad;
    const nx=Math.ceil(rx/step),ny=Math.ceil(ry/step),nz=Math.ceil(rz/step);
    const f=(x,y,z)=>((x-cx)/rx)**2+((y-cy)/ry)**2+((z-cz)/rz)**2;
    for(let i=-nx;i<=nx;i++)for(let j=-ny;j<=ny;j++)for(let k=-nz;k<=nz;k++){
      const x=cx+i*step,y=cy+j*step,z=cz+k*step;
      if(f(x,y,z)>=1||cut?.(x,y,z))continue;
      if(f(x+step,y,z)<1&&f(x-step,y,z)<1&&f(x,y+step,z)<1&&
        f(x,y-step,z)<1&&f(x,y,z+step)<1&&f(x,y,z-step)<1)continue;
      make(arr,x,y,z,step*1.045,step*1.045,step*1.045,pal(shades,i+seed,j,k));
    }
  };
  // Skull pushes toward the camera, but the center BELOW the upper lip
  // is intentionally carved so the gaping mouth is not a painted rectangle.
  const mouthCut=(x,y,z)=>Math.abs(x)<.76&&y<3.67&&z<-5.17;
  shell(skull,[0,4.16,-4.98],[1.17,.77,.93],ochre,8,mouthCut);
  for(const side of [-1,1]){
    shell(cheeks,[side*.83,3.76,-5.08],[.44,.50,.51],
      [0x7a492e,0x9f663e,0xae7247,0x794a30],23+side,
      (x,y,z)=>y<3.48&&z<-5.25&&Math.abs(x)<.66);
    // Lions have a split, short and broad upper muzzle. Two independent
    // golden whisker pads meet at the dark black upside-down-triangle nose.
    shell(pads,[side*.37,3.74,-5.71],[.45,.29,.39],muzzle,34+side);
    // High heavy triangular eyebrows slope inward and hide most of the iris.
    for(let n=0;n<10;n++){
      const t=n/9,x=side*(.16+.83*t),y=4.37+.15*t;
      make(brow,x,y,-5.94,.18,.22,.24,
        pal([0x382720,0x483126,0x59402a],n,side,5));
    }
    // Eye is level with forehead: socket, amber slit, narrowed black pupil.
    make(brow,side*.56,4.185,-5.966,.35,.19,.14,0x211816);
    make(brow,side*.56,4.189,-6.061,.245,.095,.085,0x76421a);
    make(eyes,side*.56,4.194,-6.116,.180,.093,.046,0xffbb27);
    make(brow,side*.57,4.194,-6.160,.045,.090,.032,0x1a100e);
    make(brow,side*.525,4.225,-6.159,.03,.033,.028,0xfff4ac);
    // The mouth edges connect visibly to the cheeks and upper lip.
    for(let n=0;n<11;n++){
      const t=n/10;
      make(cheeks,side*(.73+.085*t),3.65-.78*t,-5.62+.11*t,
        .235,.21,.205,pal([0x956039,0xa87242,0xbd8550],n,side,8));
    }
    // Fine black smile line over the mouth and two whisker freckle dots.
    for(let n=0;n<4;n++)
      make(rim,side*(.19+n*.13),3.57-n*.02,-6.013,.133,.075,.075,0x5e3727);
    for(let n=0;n<3;n++)
      make(rim,side*(.30+n*.11),3.72-.05*n,-6.095,.048,.048,.039,0x704c31);
    // Small ears near horns, embedded in the mane (not two upright horns).
    make(hair,side*1.05,4.70,-4.62,.40,.39,.29,0x5c3322);
    make(hair,side*1.05,4.73,-4.77,.24,.25,.11,0xbf7d43);
    // Giant SABRE tooth: root tucked into upper lip, curves downward
    // in an overlapping voxel taper; two long ivory fangs dominate the jaw.
    for(let n=0;n<19;n++){
      const t=n/18;
      const width=.212*Math.pow(1-t,.72)+.028;
      make(fangs,side*(.54-.075*t),3.55-1.04*t,
        -6.171-.09*Math.sin(t*Math.PI),
        width*1.62,.085,width*1.75,
        pal(bone,n,side,1));
    }
    for(let tooth=0;tooth<3;tooth++)for(let j=0;j<5;j++){
      const t=j/4,w=.09*(1-t)+.028;
      make(fangs,side*(.10+tooth*.125),3.50-.18*t,-6.18,
        w*1.5,.07,w*1.5,0xd6c095);
    }
  }
  // A broad cat nose: reverse triangle tapered downward, black nostril pads.
  for(let row=0;row<4;row++){
    const n=5-row;
    for(let i=-n;i<=n;i++){
      make(pads,i*.100,3.97-row*.085,-6.20+.009*Math.abs(i),
        .116,.117,.185,
        pal([0x191619,0x2c2224,0x38302f],row,i,4));
    }
  }
  for(const side of [-1,1])
    make(rim,side*.32,3.93,-6.308,.146,.094,.059,0x161314);
  // Deep open mouth = 3D inset black cavity with a ROARING silhouette.
  // Larger than the V5 vertical slit, with visible rear palate and tongue.
  for(let y=2.69;y<=3.60;y+=.105)for(let x=-.68;x<=.68;x+=.105){
    const u=x/.76,v=(y-3.155)/.54;
    if(u*u+v*v>1)continue;
    const front=-6.22-.09*(1-u*u);
    make(lip,x,y,front,.119,.12,.10,
      pal([0x130c0e,0x230d15,0x2f151a],x,y,9));
    if(y<3.05&&Math.abs(x)<.35)
      make(lip,x,y,front-.055,.111,.11,.06,
        pal([0x6a2837,0x983947,0x772c39],x,y,6));
  }
  // Very bright orange eyes from the side as well as from straight ahead.
  const maneTufts=[];
  for(const side of [-1,1]){
    // Multiple irregular hair layers behind the cheeks; NEVER over the eyes.
    for(let strand=0;strand<78;strand++){
      const a=rand(strand,side,22);
      const x0=side*(1.00+a*.73);
      const y0=4.54+rand(strand,side,31)*.35;
      const z0=-4.67-rand(strand,side,25)*.66;
      const len=1.3+rand(strand,side,12)*1.4;
      const n=9+Math.floor(rand(strand,side,14)*6);
      for(let k=0;k<n;k++){
        const t=k/(n-1);
        const x=x0+side*(.06+.16*t)+.05*Math.sin(k*.71+strand),
          y=y0-len*t,
          z=z0-.24*t;
        if(Math.abs(x)<.92&&z< -5.1)continue;
        const color=pal(t<.5?mane:[0xae632b,0xd88a3f,0xa65529],strand,k,side);
        make(maneTufts,x,y,z,.205,.23,.215,color);
      }
    }
    // Cheek collar connects main mane to the lower jaw.
    for(let n=0;n<11;n++)for(let j=0;j<4;j++){
      let t=n/10;
      make(maneTufts,side*(1.00+.17*j),3.73-1.04*t,
        -5.27-.13*j,.235,.25,.23,
        pal(mane,n,j,side));
    }
  }
  // Forehead fringe covers the rear of the skull, leaving brow and eyes.
  for(let strand=0;strand<110;strand++){
    const x=(rand(strand,2,6)*2-1)*1.17;
    const z=-4.60-rand(strand,8,11)*.9;
    const y=4.66+rand(strand,9,4)*.32;
    for(let j=0;j<5;j++){
      make(maneTufts,x+j*.018,y+j*.10,z+j*.04,.22,.23,.21,
        pal(mane,strand,j,12));
    }
  }
  // Jaw hinge coordinates ensure there are NEVER pieces detached in front.
  const jawPivot=new T.Group();
  jawPivot.name="REAL HINGED LOWER JAW";head.add(jawPivot);
  jawPivot.position.set(0,3.49,-5.40);
  const chin=[],teeth=[],chinHair=[];
  for(let i=-8;i<=8;i++)for(let j=0;j<=6;j++){
    const x=i*.099,z=-.87+j*.107;
    const front=j<2,side=Math.abs(i)>6;
    if(!front&&!side)continue;
    if((x/.84)**2+((z+.62)/.52)**2>1)continue;
    const y=-.92-(front?.025:0);
    make(chin,x,y,z,.128,.20,.137,
      pal([0xd29d66,0xbb8657,0xa9794b,0xe0ae76],i,j,2));
  }
  // U-shaped jaw sides rise smoothly toward the hinge.
  for(const side of [-1,1]){
    for(let n=0;n<12;n++){
      const t=n/11;
      make(chin,side*(.73-.07*t),-.92+.99*t,
        -.71+.62*t,.17,.175,.175,
        pal([0x9d6940,0xbd8754,0x805238],n,side,13));
    }
    // Upward lower canine teeth, shorter than upper sabres.
    for(let n=0;n<9;n++){
      const t=n/8,w=.145*(1-t)+.022;
      make(teeth,side*(.40-.08*t),-.80+.41*t,
        -.84-.035*t,w*1.38,.075,w*1.48,
        pal(bone,n,side,16));
    }
  }
  // Bottom golden chin with a tuft of pale fur.
  for(let n=-4;n<=4;n++)for(let k=0;k<4;k++){
    const t=k/3;
    make(chinHair,n*.14,-1.03-.13*t+Math.abs(n)*.02,
      -.77+.10*t,.151,.150,.153,
      pal([0xc38c54,0xe9bc80,0xb27b46],n,k,11));
  }
  solid(chin,"U-SHAPE GOLD LION CHIN",jawPivot);
  solid(teeth,"LOWER LION CANINES",jawPivot);
  solid(chinHair,"CHIN FUR TUFT",jawPivot);

  const parts = [
    [skull,"BIG SHORT FELINE SKULL"],
    [cheeks,"THICK CAT CHEEKS"],
    [pads,"TWO ROUND SPLIT LION MUZZLE PADS / NOSE"],
    [brow,"FURROWED LION BROWS / BLACK SLIT PUPILS"],
    [eyes,"FIRE GOLD LION EYES"],
    [rim,"WHISKER FRECKLES AND MOUTH LINE"],
    [lip,"TRUE GAPING DARK LION MAW"],
    [fangs,"HUGE IVORY SABER CANINES"],
    [hair,"LION EARS"],
    [maneTufts,"LAYERED ORANGE LION FACE RUFF"]
  ];
  for(const [v,n] of parts) solid(v,n);

  // Jaw is permanently connected to the face group; rotate around the
  // anatomical hinge, instead of following old clay head's moved vertices.
  function update(animation){
    base.update(animation);
    const roar=animation?.roar||0;
    const bite=animation?.bite||0;
    head.position.y=.045*roar;
    jawPivot.rotation.x=.18*roar+.10*bite;
    jawPivot.position.y=3.49-.15*roar;
    // Keep the lion's muzzle and both long upper fangs stationary;
    // only its hinged lower lip can open.
  }
  update({roar:0});
  return {update,decor:deco,kind:"actual-new-voxel-lion-head-v6"};
}
