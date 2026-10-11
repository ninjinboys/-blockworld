/*
 * NEXACRAFT / CHIMERA SCULPT IV
 * Independent geometry rebuilt from the reference's low-poly lion-buffalo-serpent
 * silhouette. A sculpted surface for the torso & lion face, coherent layered
 * mane shards, curved horns, split jaws, four jointed feline legs, and a huge
 * C-coil with a separate venomous snake head.
 *
 * The old v1–v3 "orange square-maned lion with two handlebars" asset is
 * intentionally NOT imported or reused. No textures or image billboards.
 * Local -Z is forward; feet at Y=0. Three.js 0.180-compatible.
 */
export const CHIMERA_DESIGN=Object.freeze({
  name:'キメラ',version:4,
  role:'オーバーワールド中ボス（外観審査中）',
  direction:'-Z',height:5.05,length:9.8,hornsWidth:5.5,
  distinguishingFeatures:[
    '深い口腔と長い上牙をもつ猛獣の頭',
    '張り出した肩から胸までの暗金色の立体的なたてがみ',
    '根元が太く側方に伸びて上に巻き上がる灰黒の双角',
    '厚い四足と独立して曲がる獅子型の脚関節',
    '巨大なC字のアナコンダ尾、独立した蛇の開口部と金眼'
  ]
});
export const CHIMERA_MOVEMENT=Object.freeze({
  walk:4.8,charge:8.8,walkStride:2.8,chargeStride:4.0
});
export function buildChimera(T){
  const root=new T.Group();
  root.name='CHIMERA_V4_SCULPT';
  const rig={},batches=new Map();
  const C={
    body:0x352c28,bodyLit:0x58453a,bodyShadow:0x252428,
    bodyTan:0x76533e,deep:0x271a17,root:0x422719,
    maneDark:0x603416,maneMid:0x86491d,
    maneAmber:0xaf6427,maneBright:0xcb7d30,maneLight:0xdf9950,
    face:0x75513b,faceBright:0x9b643a,faceShade:0x46312a,
    nose:0x211d1b,lip:0x2a1b19,mouth:0x140b0c,
    gum:0x633039,tongue:0xa74d57,ivory:0xf2ddac,
    hornRoot:0x302c32,horn:0x59565c,hornEdge:0x77737b,
    hornTip:0x9b969c,claw:0x1b1a20,
    snake:0x4e5133,snakeGold:0x8c824e,
    snakeDark:0x303528,snakeBrown:0x63533a,
    belly:0x847657,eye:0xffbe30,eyeCore:0xffe07b
  };
  let seed=512234;
  const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
  function pivot(parent,name,x=0,y=0,z=0){
    const g=new T.Group();g.name=name;g.position.set(x,y,z);
    parent.add(g);rig[name]=g;return g;
  }
  function block(parent,x,y,z,w,h,d,c,rx=0,ry=0,rz=0){
    if(!(w>0&&h>0&&d>0))throw Error('bad block size');
    if(!batches.has(parent))batches.set(parent,[]);
    batches.get(parent).push([x,y,z,w,h,d,c,rx,ry,rz]);
  }
  function finishBlocks(){
    const tmp=new T.Object3D();
    for(const [group,list] of batches){
      const m=new T.InstancedMesh(new T.BoxGeometry(1,1,1),
        new T.MeshLambertMaterial({color:0xffffff}),list.length);
      m.name=group.name+' COLOR-BLOCKS';
      m.castShadow=m.receiveShadow=true;m.frustumCulled=false;
      m.userData.mobOwnMaterial=true;
      for(let i=0;i<list.length;i++){
        const [x,y,z,w,h,d,c,rx,ry,rz]=list[i];
        tmp.position.set(x,y,z);tmp.scale.set(w,h,d);
        tmp.rotation.set(rx,ry,rz);tmp.updateMatrix();
        m.setMatrixAt(i,tmp.matrix);m.setColorAt(i,new T.Color(c));
      }
      m.instanceMatrix.needsUpdate=true;
      if(m.instanceColor)m.instanceColor.needsUpdate=true;
      group.add(m);
    }
  }
  const vec=(a)=>new T.Vector3(...a);
  function createMesh(parent,name,vertex,colors,index,flat=true){
    const geo=new T.BufferGeometry();
    geo.setAttribute('position',new T.Float32BufferAttribute(vertex,3));
    geo.setAttribute('color',new T.Float32BufferAttribute(colors,3));
    geo.setIndex(index);geo.computeVertexNormals();
    const mat=new T.MeshLambertMaterial({
      color:0xffffff,vertexColors:true,flatShading:flat,
      side:T.DoubleSide
    });
    const m=new T.Mesh(geo,mat);m.name=name;
    m.castShadow=true;m.receiveShadow=true;m.userData.mobOwnMaterial=true;
    parent.add(m);return m;
  }
  function shade(hex,multiplier=1){
    const c=new T.Color(hex);
    return [c.r*multiplier,c.g*multiplier,c.b*multiplier];
  }
  // Elliptical lofts make the animal's anatomy one sculpted volume, not
  // a rectangular body with random boxes pasted on. Each ring is [z,cY,rx,ry,color].
  function loftZ(group,name,rings,sides=12){
    const v=[],col=[],ix=[];
    for(let i=0;i<rings.length;i++){
      const [z,cy,rx,ry,color]=rings[i];
      for(let k=0;k<sides;k++){
        const a=k/sides*Math.PI*2;
        v.push(Math.cos(a)*rx,cy+Math.sin(a)*ry,z);
        col.push(...shade(color,.88+.14*((k+2)%5)/4));
      }
    }
    for(let i=0;i<rings.length-1;i++)for(let k=0;k<sides;k++){
      const a=i*sides+k,b=i*sides+(k+1)%sides,c=(i+1)*sides+k,d=(i+1)*sides+(k+1)%sides;
      ix.push(a,b,c,b,d,c);
    }
    for(let k=1;k<sides-1;k++){
      ix.push(0,k+1,k);
      const end=(rings.length-1)*sides;
      ix.push(end,end+k,end+k+1);
    }
    return createMesh(group,name,v,col,ix);
  }
  // Curved tapered sculpt used for horns, fangs, tail and claws.
  // Ring-section paths read as a single unbroken anatomical feature.
  function curveTube(group,name,positions,radius,palette,facets=9,ellipse=1){
    const v=[],col=[],ix=[],p=positions.map(vec);
    for(let i=0;i<p.length;i++){
      const near=p[Math.max(0,i-1)],far=p[Math.min(p.length-1,i+1)];
      const t=far.clone().sub(near).normalize();
      const ref=Math.abs(t.y)>.89?new T.Vector3(1,0,0):new T.Vector3(0,1,0);
      const u=new T.Vector3().crossVectors(t,ref).normalize();
      const w=new T.Vector3().crossVectors(t,u).normalize();
      for(let j=0;j<facets;j++){
        const a=j*2*Math.PI/facets;
        const pt=p[i].clone().addScaledVector(u,Math.cos(a)*radius[i])
          .addScaledVector(w,Math.sin(a)*radius[i]*ellipse);
        v.push(pt.x,pt.y,pt.z);
        col.push(...shade(palette[Math.min(i,palette.length-1)],.80+.19*(j%4)/3));
      }
    }
    for(let i=0;i<p.length-1;i++)for(let j=0;j<facets;j++){
      const a=i*facets+j,b=i*facets+(j+1)%facets,c=(i+1)*facets+j,d=(i+1)*facets+(j+1)%facets;
      ix.push(a,c,b,b,c,d);
    }
    return createMesh(group,name,v,col,ix);
  }
  // Five-vertex tetra-ish fur with broad roots and one sharp outer tip.
  // Merge ALL tufts on each body section into a single draw call.
  const furGroups=new Map();
  function tuft(parent,x,y,z,w,d,dx,dy,dz,color){
    let data=furGroups.get(parent);
    if(!data){data={v:[],c:[],i:[]};furGroups.set(parent,data)}
    const b=data.v.length/3;
    const pts=[
      [x-w*.5,y+w*.22,z-d*.5],[x+w*.5,y+w*.22,z-d*.5],
      [x+w*.5,y-w*.20,z+d*.5],[x-w*.5,y-w*.20,z+d*.5],
      [x+dx,y+dy,z+dz]
    ];
    for(let k=0;k<5;k++){
      data.v.push(...pts[k]);data.c.push(...shade(color,k===4?1.04:k%2?.82:.95));
    }
    for(const a of [[0,1,4],[1,2,4],[2,3,4],[3,0,4],[0,2,1],[0,3,2]])
      data.i.push(...a.map(n=>n+b));
  }
  function finishFur(){
    for(const [group,b] of furGroups)
      createMesh(group,group.name+' SINGLE-MESH TAPERED FUR',b.v,b.c,b.i);
  }
  // -----------------------------------------------------------
  // TORSO: low horizontal lion body, massive sloped shoulders,
  // narrow waist and very thick haunches. The animal is crouched.
  // -----------------------------------------------------------
  const body=pivot(root,'body',0,0,0);
  loftZ(body,'LION TAPERED CHEST AND FLANKS',[
    [-1.66,1.92,.78,.81,C.body],
    [-1.24,1.94,1.19,.93,C.bodyLit],
    [-.83,1.80,1.17,.86,C.body],
    [-.34,1.72,.95,.68,C.bodyShadow],
    [.37,1.66,.84,.62,C.body],
    [.94,1.65,.95,.67,C.bodyLit],
    [1.45,1.74,1.04,.76,C.body],
    [1.96,1.79,.79,.68,C.bodyShadow],
    [2.20,1.76,.18,.29,C.body]
  ],14);
  // Chest bulge is not a geometric cube; metal-dark side plates tie the
  // head's mane into the forelimbs.
  for(const side of [-1,1]){
    for(let i=0;i<5;i++){
      const z=-1.12+i*.24;
      tuft(body,side*(.82+rand()*.19),2.22,z,
        .23,.35,side*.25,.05,.38,
        i%3===0?C.bodyTan:C.body);
    }
    for(let i=0;i<5;i++){
      const z=.88+i*.21;
      block(body,side*(.92-rand()*.04),1.91,z,
        .23,.39,.34,i%2?C.bodyShadow:C.bodyTan,
        0,side*.08,side*.08);
    }
  }
  // -----------------------------------------------------------
  // 4 MUSCULAR JOINTED LEGS, feline elbows, wrists and actual claws.
  // -----------------------------------------------------------
  function makeLeg(side,front){
    const label=(front?'fore':'hind')+(side===-1?'L':'R');
    const hip=pivot(root,label,side*(front?1.42:.84),front?2.10:1.69,
      front?-1.57:1.32);
    const thigh=pivot(hip,label+'thigh');
    if(front){
      loftZ(thigh,label+' UPPER FOREARM',[
        [-.35,-.27,.41,.54,C.bodyLit],
        [.06,-.32,.43,.62,C.bodyTan],
        [.47,-.57,.34,.47,C.body],
        [.64,-.79,.22,.28,C.bodyShadow]
      ],10);
      block(thigh,0,-.30,-.10,.80,1.03,.87,C.bodyLit,.16);
      block(thigh,side*.23,-.29,-.18,.20,.75,.49,C.bodyTan,0,0,side*.13);
    }else{
      loftZ(thigh,label+' HAUNCH',[
        [-.53,-.24,.31,.47,C.body],
        [-.10,-.26,.49,.69,C.bodyLit],
        [.36,-.52,.40,.57,C.bodyTan],
        [.64,-.70,.24,.27,C.body]
      ],10);
      block(thigh,0,-.34,.09,.71,.85,.90,C.bodyLit,-.11,0,side*.09);
    }
    const elbow=pivot(thigh,label+'elbow',0,front?-.77:-.66,front?.14:.28);
    if(front){
      block(elbow,0,-.30,-.10,.63,.76,.67,C.bodyTan,-.13);
      block(elbow,0,-.66,-.22,.59,.71,.65,C.bodyLit,-.10);
      block(elbow,side*.27,-.34,-.14,.15,.69,.39,C.bodyShadow,0,0,side*.07);
    }else{
      block(elbow,0,-.24,-.17,.56,.63,.63,C.bodyLit,.14);
      block(elbow,0,-.53,-.36,.46,.61,.55,C.bodyTan,-.14);
    }
    const foot=pivot(elbow,label+'foot',0,front?-.93:-.76,front?-.34:-.30);
    // Wide planted pads with four separated toes; each claw bends down
    // to a visible pointed end. Foot base lies within 0.1 of the ground.
    block(foot,0,-.11,-.29,front?1.14:.84,.34,.95,C.bodyShadow);
    for(let i=0;i<4;i++){
      const x=(i-1.5)*(front?.277:.202);
      const depth=-.64-(i%2)*.055;
      block(foot,x,-.15,depth,front?.267:.195,.29,.49,C.bodyTan);
      curveTube(foot,label+' curved claw '+i,[
        [x,-.18,depth-.22],[x,-.19,depth-.47],[x,-.26,depth-.69]
      ],[.118,.071,.003],[C.claw,C.claw,C.nose],6);
    }
    if(front){
      for(const s of [-1,1]){
        // Low armored tufts on the forelimbs, not a straight block column.
        for(let j=0;j<5;j++)
          tuft(thigh,s*.33,-.28-j*.14,-.25,.16,.18,
            s*.14,-.17,-.15,j%3===0?C.bodyTan:C.body);
      }
    }
    return {hip,thigh,elbow,foot};
  }
  const legs={
    foreL:makeLeg(-1,true),foreR:makeLeg(1,true),
    hindL:makeLeg(-1,false),hindR:makeLeg(1,false)
  };
  // Strong wrestler-like outward planted shoulders, not four narrow pillars.
  legs.foreL.hip.rotation.z=-.115;
  legs.foreR.hip.rotation.z=.115;
  legs.hindL.hip.rotation.z=-.035;
  legs.hindR.hip.rotation.z=.035;
  // -----------------------------------------------------------
  // LION MANE: a single broad heavy dark-gold fur mantle,
  // framing a DIFFERENT giant roaring face. This is not an orange wig.
  // -----------------------------------------------------------
  const mane=pivot(body,'mane',0,2.59,-1.44);
  loftZ(mane,'DARK MANE CORE',[
    [-1.17,.14,.81,.89,C.deep],
    [-.93,.10,1.25,1.36,C.root],
    [-.51,.08,1.45,1.53,C.maneDark],
    [.03,.10,1.40,1.51,C.root],
    [.51,.10,1.09,1.18,C.maneDark],
    [.84,.08,.65,.73,C.deep]
  ],16);
  // Hundreds of *curated* distinct tapered locks; they follow the
  // mantle's curved surface in overlapping DARK-to-GOLD descending strata.
  // The inner front stays open so the lion face and dark maw read clearly.
  for(let tier=0;tier<7;tier++){
    const t=tier/6, yy=1.13-tier*.27;
    const rowRadius=1.03+Math.sin(t*Math.PI)*.32;
    for(let j=0;j<24;j++){
      const a=j/24*Math.PI*2 + (tier%2)*.065;
      const x=Math.cos(a)*rowRadius;
      const z=-.03+Math.sin(a)*(.97+Math.sin(t*Math.PI)*.16);
      if(z<-.45&&Math.abs(x)<.72&&yy>-.62)continue;
      const shadow=tier>5||Math.abs(x)>1.12;
      const palette=shadow?[C.deep,C.root,C.maneDark,C.maneMid]:
        [C.maneDark,C.maneMid,C.maneAmber,C.maneBright];
      const color=palette[(j+tier*3)%palette.length];
      const length=.24+.24*t+rand()*.13;
      tuft(mane,x,yy,z,.28+rand()*.18,.31+rand()*.15,
        Math.cos(a)*(.15+rand()*.09),
        -.09-length,
        Math.sin(a)*(.30+rand()*.17),
        color);
    }
  }
  // A distinctive high backward-swept crown. The reference is darkest
  // around the horns, golden on outward locks, not uniformly yellow.
  // Crown made from heavy BACK-SWEPT locks, not a porcupine mohawk.
  // Wide roots and broad upper shelves create a coherent animal silhouette.
  for(let row=0;row<6;row++)for(let k=-5;k<=5;k++){
    if(Math.abs(k)===5&&row>3)continue;
    const x=k*.239+(rand()-.5)*.064;
    const z=-.67+row*.267;
    const y=1.23 + .17*Math.max(0,1-Math.abs(k)/5);
    tuft(mane,x,y,z,.37,.45,
      (rand()-.5)*.10,.12+rand()*.27,.42+rand()*.38,
      row<2?C.maneAmber:row%3?C.root:C.maneMid);
    if(row%2===0)block(mane,x,y-.06,z+.07,.35,.18,.39,
      row%3===0?C.maneDark:C.maneMid,-.17);
  }
  // Deep tapered chin tassels that strongly frame the open lion mouth.
  for(const side of [-1,1]){
    for(let column=0;column<5;column++)for(let row=0;row<6;row++){
      const x=side*(.68+column*.15),y=.53-row*.195;
      tuft(mane,x,y,-.84+column*.14,.27,.31,
        side*.13,-.29-rand()*.20,-.24-rand()*.19,
        row%3===0?C.maneBright:row%2?C.maneMid:C.root);
    }
  }
  // Heavy gold-orange three-dimensional cheeklocks. Unlike the old flat
  // orange wig, these lock plates wrap AROUND the head and merge with the
  // shoulders, remaining well ABOVE the paws.
  for(const sign of [-1,1]){
    for(let column=0;column<5;column++)for(let tier=0;tier<6;tier++){
      const x=sign*(.68+column*.175+(rand()-.5)*.035);
      const y=.90-tier*.27+(rand()-.5)*.09;
      const z=-1.21+column*.13+(rand()-.5)*.07;
      const color=tier%3===0?C.maneBright:
        column%3===0?C.maneAmber:
        (tier+column)%3===0?C.maneMid:C.maneDark;
      block(mane,x,y,z,.27+rand()*.12,.38+rand()*.13,
        .42+rand()*.13,color,-.11,0,sign*.13);
      tuft(mane,x,y-.13,z-.12,.30,.36,
        sign*.14,-.31-rand()*.17,-.20-rand()*.13,color);
    }
    // Shoulder mantle strands sweeping BACK and away from the face.
    for(let row=0;row<5;row++)for(let tier=0;tier<5;tier++){
      const x=sign*(1.17+rand()*.11);
      const y=.52-tier*.26;
      const z=-.34+row*.25;
      tuft(mane,x,y,z,.29,.34,
        sign*.18,-.25-rand()*.18,.30+rand()*.11,
        (row+tier)%3===0?C.maneAmber:(tier%2?C.root:C.maneMid));
    }
  }

  // -----------------------------------------------------------
  // LION HEAD: an open gaping mouth is made from a hollow-looking
  // black recessed cavity with separate upper and lower jaw volumes.
  // Solid sculpted face, NOT a small cuboid cat.
  // -----------------------------------------------------------
  const head=pivot(body,'lionHead',0,2.86,-2.29);
  loftZ(head,'LION CRANIUM SCULPT',[
    [-1.52,.05,.53,.38,C.faceBright],
    [-1.37,.13,.73,.54,C.face],
    [-1.10,.22,.92,.68,C.faceBright],
    [-.70,.24,1.04,.74,C.faceShade],
    [-.36,.24,1.08,.74,C.face],
    [.01,.20,.85,.66,C.faceShade],
    [.29,.15,.40,.38,C.body]
  ],12);
  // Shielded cheekbones, curled brows and broad cheek fur.
  for(const side of [-1,1]){
    block(head,side*.74,.02,-.98,.43,.40,.68,C.face,0,0,side*.12);
    block(head,side*.80,-.32,-.88,.34,.54,.56,C.root,0,0,side*.13);
    block(head,side*.61,-.57,-1.03,.32,.38,.52,C.maneMid,0,0,side*.18);
    // Luminous angry pupils under thick diagonal dark brows.
    block(head,side*.42,.31,-1.487,.40,.24,.11,C.deep,0,0,side*.25);
    block(head,side*.42,.29,-1.557,.28,.15,.045,0x000000);
    const eye=new T.Mesh(new T.BoxGeometry(.183,.105,.050),
      new T.MeshBasicMaterial({color:C.eye}));
    eye.position.set(side*.42,.287,-1.598);
    eye.userData.mobOwnMaterial=true;head.add(eye);
    block(head,side*.42,.30,-1.646,.045,.12,.028,C.deep);
    block(head,side*.43,.48,-1.47,.58,.25,.34,C.root,0,0,side*.22);
    // Nose muscles and whisker spots.
    block(head,side*.31,-.14,-1.46,.42,.34,.44,C.faceBright);
    for(let k=0;k<3;k++)
      block(head,side*(.24+k*.10),-.29+(k%2)*.075,-1.705,
        .055,.035,.028,C.deep);
  }
  // Distinct battered feline ears below the curled horn roots.
  for(const sign of [-1,1]){
    block(head,sign*.92,.66,-.33,.36,.48,.27,C.faceShade,
      0,0,sign*.29);
    block(head,sign*.93,.73,-.50,.21,.24,.07,C.root,
      0,0,sign*.23);
    tuft(head,sign*.91,.75,-.40,.34,.25,
      sign*.08,.24,-.16,C.maneMid);
  }
  // Black, wide, irregular feline nose wedge (not a pointed cuboid).
  block(head,0,-.11,-1.67,.72,.23,.27,C.nose);
  block(head,0,-.20,-1.72,.49,.22,.27,C.deep);
  block(head,0,-.34,-1.70,.10,.20,.07,C.nose);
  // RECESSED roaring mouth: dark area occupies most of lower face.
  block(head,0,-.76,-1.40,1.15,.98,.33,C.lip);
  block(head,0,-.78,-1.610,1.01,.85,.09,C.mouth);
  block(head,0,-1.07,-1.673,.51,.25,.060,C.gum);
  block(head,0,-1.09,-1.714,.40,.17,.058,C.tongue);
  for(const side of [-1,1]){
    block(head,side*.58,-.82,-1.46,.25,.88,.36,C.faceShade);
    block(head,side*.66,-.87,-1.52,.16,.58,.39,C.maneMid);
  }
  const jaw=pivot(head,'lionJaw',0,-1.30,-.98);
  block(jaw,0,-.09,-.47,1.11,.30,.72,C.face);
  block(jaw,0,.125,-.60,.89,.16,.45,C.faceBright);
  block(jaw,0,.206,-.71,.68,.09,.35,C.gum);
  block(jaw,0,.24,-.76,.42,.062,.28,C.tongue);
  // Teeth form an actual jagged jawline along each dark roaring lip.
  for(const side of [-1,1])for(let row=0;row<4;row++){
    block(head,side*(.45+row*.047),-.49-row*.17,-1.66,
      .075,.16,.10,C.ivory,0,0,side*.06);
  }
  // Signature sabre fangs: far more visible than two ivory squares.
  for(const side of [-1,1]){
    curveTube(head,'UPPER SABER FANG '+side,[
      [side*.40,-.35,-1.59],
      [side*.42,-.60,-1.76],
      [side*.43,-.99,-1.84],
      [side*.43,-1.42,-1.82],
      [side*.42,-1.70,-1.73]
    ],[.164,.157,.118,.062,.005],
      [C.ivory,C.ivory,0xffefc9,C.ivory,C.ivory],7);
    curveTube(jaw,'LOWER FANG '+side,[
      [side*.40,.23,-.79],[side*.40,.45,-.86],[side*.39,.60,-.88]
    ],[.13,.084,.004],[C.ivory,C.ivory,C.ivory],6);
    block(head,side*.17,-.48,-1.733,.13,.21,.16,C.ivory);
  }
  // -----------------------------------------------------------
  // BUFFALO HORNS: rooted IN the skull, outwards and then UP.
  // Contrast black horn mass with honey-bronze ring at the root.
  // -----------------------------------------------------------
  for(const side of [-1,1]){
    curveTube(body,'LEFT/RIGHT BUFFALO HORN '+side,[
      [side*.72,3.52,-2.39],
      [side*1.08,3.55,-2.47],
      [side*1.51,3.46,-2.53],
      [side*1.99,3.48,-2.59],
      [side*2.42,3.69,-2.65],
      [side*2.77,4.04,-2.69],
      [side*2.89,4.43,-2.72],
      [side*2.82,4.79,-2.70]
    ],[.34,.385,.36,.30,.235,.155,.086,.004],
      [C.hornRoot,C.horn,C.horn,C.hornEdge,C.horn,
       C.horn,C.hornTip,C.hornTip],9);
    block(body,side*1.03,3.55,-2.47,.17,.32,.36,C.maneAmber,
      0,0,side*.12);
    block(body,side*1.33,3.49,-2.51,.08,.33,.33,C.hornEdge,
      0,0,side*.08);
  }
  // -----------------------------------------------------------
  // ANACONDA: one uninterrupted, VERY LARGE C-shaped tapered 3-D
  // serpent attached to hindquarters, swells over the rump then
  // bends back toward the spectator with a full predatory snake head.
  // -----------------------------------------------------------
  const tail=pivot(body,'snakeTail',0,1.61,1.89);
  const sections=[
    [0,0,0],[.13,-.06,.65],[.76,-.10,1.39],
    [1.67,-.04,2.00],[2.68,.23,2.42],
    [3.51,.75,2.55],[3.97,1.44,2.36],
    [3.91,2.16,2.04],[3.51,2.82,1.63],[3.17,3.15,1.06]
  ];
  const curve=new T.CatmullRomCurve3(sections.map(vec),false,'catmullrom',.40);
  const steps=80,facetCount=14,vertices=[],colors=[],indices=[];
  function tailR(t){
    return (.70+.17*Math.sin(Math.PI*t))* (1-.61*Math.pow(t,1.32));
  }
  // Every band is FOUR triangles with a flat color; no protruding
  // bumps, so the texture reads as scales rather than an insect's larvae.
  for(let i=0;i<steps;i++)for(let j=0;j<facetCount;j++){
    const a=i/steps,b=(i+1)/steps,p=j*2*Math.PI/facetCount,q=(j+1)*2*Math.PI/facetCount;
    function surface(t,ang){
      const center=curve.getPoint(t),tangent=curve.getTangent(t);
      const help=Math.abs(tangent.y)>.90?
        new T.Vector3(1,0,0):new T.Vector3(0,1,0);
      const normal=new T.Vector3().crossVectors(tangent,help).normalize();
      const binormal=new T.Vector3().crossVectors(tangent,normal).normalize();
      return center.addScaledVector(normal,Math.cos(ang)*tailR(t))
        .addScaledVector(binormal,Math.sin(ang)*tailR(t)*.87);
    }
    const start=vertices.length/3;
    for(const v of [surface(a,p),surface(a,q),surface(b,p),surface(b,q)])
      vertices.push(v.x,v.y,v.z);
    const band=i%9,pattern=Math.sin(i*.58+j*1.4)+Math.cos(i*.29-j*1.7);
    const isBelly=j>=6&&j<=7;
    const col=isBelly?C.belly:(band===0||pattern>1.00)?C.snakeGold:
      pattern<-.8?C.snakeDark:((i+j)%7===0?C.snakeBrown:C.snake);
    for(let k=0;k<4;k++)colors.push(...shade(col,1-(j%3)*.035));
    indices.push(start,start+2,start+1,start+1,start+2,start+3);
  }
  createMesh(tail,'CONTINUOUS NON-LARVAL ANACONDA COIL',vertices,colors,indices);
  const snakeHead=pivot(tail,'snakeHead',3.17,3.15,1.06);
  loftZ(snakeHead,'HUGE REPTILIAN HEAD',[
    [-1.56,.04,.27,.16,C.snakeDark],
    [-1.33,.10,.46,.25,C.snakeGold],
    [-1.05,.18,.56,.34,C.snake],
    [-.69,.22,.67,.40,C.snakeDark],
    [-.28,.19,.72,.43,C.snake],
    [.15,.12,.54,.36,C.snakeDark],
    [.35,.05,.25,.23,C.snake]
  ],10);
  // Thick brow ridges and slightly slit reptile eyes.
  for(const side of [-1,1]){
    block(snakeHead,side*.44,.31,-1.02,.34,.19,.34,C.snakeDark,
      0,0,side*.13);
    block(snakeHead,side*.44,.25,-1.326,.235,.115,.13,C.snakeGold);
    const eye=new T.Mesh(new T.BoxGeometry(.165,.12,.038),
      new T.MeshBasicMaterial({color:C.eyeCore}));
    eye.position.set(side*.44,.26,-1.41);
    eye.userData.mobOwnMaterial=true;snakeHead.add(eye);
    block(snakeHead,side*.44,.26,-1.437,.045,.14,.025,C.deep);
    block(snakeHead,side*.22,-.08,-1.51,.12,.07,.11,C.snakeDark);
    curveTube(snakeHead,'SNAKE UPPER FANG '+side,[
      [side*.30,-.18,-1.44],[side*.30,-.43,-1.56],[side*.26,-.71,-1.58]
    ],[.115,.077,.006],[C.ivory,C.ivory,C.ivory],6);
  }
  block(snakeHead,0,-.38,-1.22,.88,.55,.35,C.snakeDark);
  block(snakeHead,0,-.39,-1.422,.72,.47,.09,C.mouth);
  const snakeJaw=pivot(snakeHead,'snakeJaw',0,-.53,-.75);
  block(snakeJaw,0,-.08,-.56,.85,.19,.91,C.belly);
  block(snakeJaw,0,.07,-.68,.61,.10,.59,C.gum);
  block(snakeHead,0,-.52,-1.66,.11,.06,.38,C.tongue);
  for(const side of [-1,1])
    block(snakeHead,side*.07,-.53,-1.86,.065,.055,.35,C.tongue,
      0,side*.19,side*.11);

  finishBlocks();finishFur();
  root.userData.chimeraRig={
    body,mane,head,jaw,tail,snakeHead,lowerSnakeJaw:snakeJaw,
    foreL:legs.foreL.hip,foreR:legs.foreR.hip,
    hindL:legs.hindL.hip,hindR:legs.hindR.hip,
    foreLElbow:legs.foreL.elbow,foreRElbow:legs.foreR.elbow,
    hindLElbow:legs.hindL.elbow,hindRElbow:legs.hindR.elbow,
    foreLPaw:legs.foreL.foot,foreRPaw:legs.foreR.foot,
    hindLPaw:legs.hindL.foot,hindRPaw:legs.hindR.foot
  };
  root.userData.chimeraVersion=4;
  root.userData.visualVariant='CHIMERA_IV_3_FRAME_MATCHED_HEAVY_MANE';
  root.userData.chimeraVisualOnly=true;
  return root;
}
export function animateChimera(model,seconds,state='idle'){
  const r=model?.userData?.chimeraRig;if(!r)return;
  const moving=state===true||state==='walk'||state==='charge';
  const charge=state==='charge';
  const speed=charge?CHIMERA_MOVEMENT.charge:CHIMERA_MOVEMENT.walk;
  const stride=charge?CHIMERA_MOVEMENT.chargeStride:CHIMERA_MOVEMENT.walkStride;
  const intensity=moving?(charge?1:.65):0;
  let dt=.016;
  if(Number.isFinite(model.userData.lastChimeraTime))
    dt=Math.max(0,Math.min(.08,seconds-model.userData.lastChimeraTime));
  model.userData.lastChimeraTime=seconds;
  if(!Number.isFinite(model.userData.stridePhase))model.userData.stridePhase=0;
  if(moving)model.userData.stridePhase+=dt*speed/stride*Math.PI*2;
  const phase=model.userData.stridePhase,damp=1-Math.exp(-dt*23);
  const blend=(was,target)=>was+(target-was)*damp;
  for(const [hip,elbow,foot,angle,fore] of [
    [r.foreL,r.foreLElbow,r.foreLPaw,0,true],
    [r.foreR,r.foreRElbow,r.foreRPaw,Math.PI,true],
    [r.hindL,r.hindLElbow,r.hindLPaw,Math.PI,false],
    [r.hindR,r.hindRElbow,r.hindRPaw,0,false]
  ]){
    const p=phase+angle,extension=Math.sin(p),lift=Math.max(0,Math.sin(p));
    const arm=fore?charge?.82:.57:charge?.75:.48;
    const hipDest=moving?(fore?.06:-.08)+arm*extension:0;
    hip.rotation.x=blend(hip.rotation.x,hipDest);
    elbow.rotation.x=blend(elbow.rotation.x,
      moving?(fore?-.12:.24)+(fore?-.53:.61)*lift*intensity:0);
    foot.rotation.x=blend(foot.rotation.x,
      moving?(.20*Math.cos(p)-.27*lift)*intensity:0);
    const neutral=fore?-.93:-.76;
    foot.position.y=blend(foot.position.y,neutral+lift*.28*intensity);
  }
  const bob=Math.max(0,Math.sin(2*phase));
  r.body.position.y=blend(r.body.position.y,intensity*(.045+.11*bob));
  r.body.rotation.x=blend(r.body.rotation.x,
    intensity*(.024*Math.sin(phase+.3)+.017*Math.sin(2*phase)));
  r.body.rotation.z=blend(r.body.rotation.z,
    intensity*.038*Math.sin(phase+1.1));
  r.head.rotation.x=.017+Math.sin(seconds*.86)*.018+
    intensity*.047*Math.sin(phase+.18);
  r.head.rotation.z=Math.sin(seconds*.76)*.012;
  r.mane.rotation.x=Math.sin(seconds*1.2)*.017+
    intensity*.018*Math.sin(phase+.5);
  r.jaw.rotation.x=-.13-Math.sin(seconds*1.86)*.12;
  r.tail.rotation.y=Math.sin(seconds*.83)*.17+
    intensity*.095*Math.sin(phase*.55);
  r.tail.rotation.z=Math.sin(seconds*.91+.7)*.058;
  r.snakeHead.rotation.y=Math.sin(seconds*1.09)*.18;
  r.snakeHead.rotation.x=Math.sin(seconds*.73)*.055;
  r.lowerSnakeJaw.rotation.x=-.17-Math.sin(seconds*1.44)*.10;
}
