/*
 * NEXACRAFT — Chimera art model, v3 — rebuilt silhouette.
 * Reference: CHIMERA 3/4 concept with roaring lion, enormous upward buffalo
 * horns, thick golden cuboid mane, dark muscular body, and anaconda-headed tail.
 *
 * This is a real, animated 3-D model (NOT a billboard of the concept picture).
 * One local unit = one world block; faces local -Z. Feet rest at local Y=0.
 * Visual-only module: summoning, HP, combat and rewards are intentionally NOT
 * decided here. A standalone interactive 360-degree viewer imports this.
 *
 * Large decorative voxel groups are GPU-instanced to keep iPad draw calls
 * bounded. Independent joints permit walking, roaring and swaying.
 */

export const CHIMERA_DESIGN = Object.freeze({
  name:'キメラ',
  version:3,
  role:'オーバーワールド中ボス',
  direction:'-Z',
  height:5.4,
  length:10.1,
  hornsWidth:6.25,
  distinguishingFeatures:[
    '厚い金茶色の段状たてがみ',
    '水牛の左右に反り上がる大角',
    '黄色く光る獅子の目と長い上顎の牙',
    '黒っぽい筋肉質の四足体',
    '地面から持ち上がった巨大な蛇の尾と独立した蛇頭'
  ]
});

// Movement intent for the future boss AI, and real pacing for the preview.
// Player walks at 4.5 blocks/s and sprints at 7.2 blocks/s.
// This enemy can trot slightly faster than walking and CHARGE faster than sprinting.
export const CHIMERA_MOVEMENT=Object.freeze({
  walk:4.8, charge:8.8, walkStride:2.8, chargeStride:4.0
});

export function buildChimera(THREE){
  const root=new THREE.Group();
  root.name='CHIMERA_BOSS_MODEL';
  const joints={};
  const batches=new Map();
  // Angular faceted tapered fur tufts are welded into a single render mesh.
  const furTriangles=new Map();
  let seed=1469;
  const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
  const C={
    coat:0x54433b,coatShade:0x302c31,coatLight:0x755747,
    back:0x29292c,backHi:0x4a4040,
    amber:0xa6652c,gold:0xc78231,ochre:0x84421e,copper:0x6b381f,
    deepMane:0x4b2b1d,maneHi:0xdf9b40,
    lip:0x32272a,mouth:0x220f15,tongue:0x9c4250,
    teeth:0xffefc8,toothShade:0xcbb58b,
    horn:0x45454e,hornEdge:0x6f6d75,hornTip:0x92919a,
    hoof:0x27262b,claw:0x16171c,
    snake:0x525837,snakeDark:0x303629,snakeGold:0x9b8952,
    snakeBelly:0xb9a47a,snakeLip:0x22291c
  };
  const point=(x,y,z)=>new THREE.Vector3(x,y,z);
  const makeJoint=(parent,name,x=0,y=0,z=0)=>{
    const g=new THREE.Group();g.name=name;g.position.set(x,y,z);
    parent.add(g);joints[name]=g;return g;
  };

  // Accumulate colored boxes by rigid rig part; ONE InstancedMesh per group.
  // The dense faceted mane and paws therefore cost ~10 draw calls, not 500.
  function box(group,x,y,z,w,h,d,color,rx=0,ry=0,rz=0){
    if(w<=0||h<=0||d<=0)throw Error('Invalid Chimera box dimensions');
    let set=batches.get(group);
    if(!set){set=[];batches.set(group,set)}
    set.push({x,y,z,w,h,d,color,rx,ry,rz});
  }
  function furWedge(group,x,y,z,dx,dy,dz,w,d,color){
    let b=furTriangles.get(group);
    if(!b){b={vertices:[],colors:[],indices:[]};furTriangles.set(group,b)}
    const points=[
      [x-w*.5,y+w*.10,z-d*.5],[x+w*.5,y+w*.10,z-d*.5],
      [x+w*.5,y-w*.25,z+d*.5],[x-w*.5,y-w*.25,z+d*.5],
      [x+dx,y+dy,z+dz]
    ];
    const base=b.vertices.length/3,col=new THREE.Color(color);
    for(let k=0;k<5;k++){
      b.vertices.push(...points[k]);
      const shade=k===4?1.02:k%2===0?.73:.92;
      b.colors.push(col.r*shade,col.g*shade,col.b*shade);
    }
    for(const tri of [[0,1,4],[1,2,4],[2,3,4],[3,0,4],[0,2,1],[0,3,2]])
      b.indices.push(base+tri[0],base+tri[1],base+tri[2]);
  }
  function finishFur(){
    for(const [group,b] of furTriangles){
      const geo=new THREE.BufferGeometry();
      geo.setAttribute('position',new THREE.Float32BufferAttribute(b.vertices,3));
      geo.setAttribute('color',new THREE.Float32BufferAttribute(b.colors,3));
      geo.setIndex(b.indices);geo.computeVertexNormals();
      const mat=new THREE.MeshLambertMaterial({
        color:0xffffff,vertexColors:true,flatShading:true,side:THREE.DoubleSide
      });
      const mesh=new THREE.Mesh(geo,mat);
      mesh.name=group.name+' ANGULAR WILD MANE';
      mesh.castShadow=true;mesh.receiveShadow=true;
      mesh.userData.mobOwnMaterial=true;
      group.add(mesh);
    }
  }
  function finishBoxes(){
    const obj=new THREE.Object3D();
    for(const [group,boxes] of batches){
      const geometry=new THREE.BoxGeometry(1,1,1);
      const material=new THREE.MeshLambertMaterial({color:0xffffff});
      const inst=new THREE.InstancedMesh(geometry,material,boxes.length);
      inst.name=group.name+' VOXEL DETAILS';
      inst.castShadow=true;inst.receiveShadow=true;inst.frustumCulled=false;
      inst.userData.mobOwnMaterial=true;
      for(let i=0;i<boxes.length;i++){
        const b=boxes[i];
        obj.position.set(b.x,b.y,b.z);
        obj.rotation.set(b.rx,b.ry,b.rz);
        obj.scale.set(b.w,b.h,b.d);
        obj.updateMatrix();
        inst.setMatrixAt(i,obj.matrix);
        inst.setColorAt(i,new THREE.Color(b.color));
      }
      inst.instanceMatrix.needsUpdate=true;
      if(inst.instanceColor)inst.instanceColor.needsUpdate=true;
      group.add(inst);
    }
  }

  // Ring-meshed faceted tapered horns. The whole curve is continuous;
  // individual cylinder pieces would have obvious gaps at each bend.
  function taperedTube(parent,coords,radii,colors,facets=7,flat=true){
    const vertices=[],indices=[],shades=[];
    const pts=coords.map(p=>point(...p));
    const UP=point(0,1,0);
    const tint=new THREE.Color();
    for(let i=0;i<pts.length;i++){
      const tangent=pts[Math.min(i+1,pts.length-1)].clone()
        .sub(pts[Math.max(i-1,0)]).normalize();
      const ref=Math.abs(tangent.y)>.90?point(1,0,0):UP;
      const side=new THREE.Vector3().crossVectors(tangent,ref).normalize();
      const upper=new THREE.Vector3().crossVectors(tangent,side).normalize();
      for(let j=0;j<facets;j++){
        const theta=j/facets*Math.PI*2;
        const offset=side.clone().multiplyScalar(Math.cos(theta)*radii[i])
          .addScaledVector(upper,Math.sin(theta)*radii[i]);
        const v=pts[i].clone().add(offset);
        vertices.push(v.x,v.y,v.z);
        const base=colors[Math.min(i,colors.length-1)];
        tint.setHex(base);
        const shade=1-.13*(j%3===0?1:0)-.065*(j%2);
        shades.push(tint.r*shade,tint.g*shade,tint.b*shade);
      }
    }
    for(let i=0;i<pts.length-1;i++)for(let j=0;j<facets;j++){
      const a=i*facets+j,b=i*facets+(j+1)%facets;
      const c=(i+1)*facets+j,d=(i+1)*facets+(j+1)%facets;
      indices.push(a,c,b,b,c,d);
    }
    const geom=new THREE.BufferGeometry();
    geom.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
    geom.setAttribute('color',new THREE.Float32BufferAttribute(shades,3));
    geom.setIndex(indices);geom.computeVertexNormals();
    const mesh=new THREE.Mesh(geom,new THREE.MeshLambertMaterial({
      color:0xffffff,vertexColors:true,flatShading:flat,side:THREE.DoubleSide
    }));
    mesh.castShadow=true;mesh.receiveShadow=true;
    mesh.userData.mobOwnMaterial=true;parent.add(mesh);
    return mesh;
  }

  // Massive charcoal feline body, lightening toward the copper shoulder
  // plates; broad belly and humped hindquarters, not a single plain cube.
  // Torso is the gait's moving centre of gravity. Head, horn, mane and
  // serpent tail follow its natural bounce without detaching from the neck.
  const core=makeJoint(root,'body');
  box(core,0,1.50,.23,1.77,1.20,2.99,C.coat);
  box(core,0,1.94,.17,1.88,.76,2.75,C.back);
  box(core,0,2.38,.18,1.54,.25,2.55,C.backHi);
  box(core,0,1.16,.29,1.35,.27,2.42,C.coatShade);
  box(core,0,2.35,-.85,2.12,1.10,1.22,C.coat);
  box(core,0,1.79,-.91,1.92,1.12,.91,C.coatLight);
  box(core,0,1.86,1.27,1.88,1.31,1.34,C.coat);
  box(core,0,2.37,1.16,1.72,.40,1.34,C.coatShade);
  // Shoulders, haunches and chunky overlapping armor-fur plates.
  for(const sign of [-1,1]){
    box(core,sign*.86,2.07,-.67,.63,1.08,.82,C.coatLight,0,0,sign*-.06);
    box(core,sign*.86,1.75,1.24,.56,.90,.92,C.coat,0,0,sign*.12);
    box(core,sign*.96,2.26,-.57,.25,.58,.91,C.copper,0,0,sign*.21);
    // Break up the rectangular hip silhouette into sloping feline flanks.
    for(let b=0;b<18;b++){
      const zz=.02+(b%6)*.28+(rand()-.5)*.12;
      const yy=1.65+Math.floor(b/6)*.24+(rand()-.5)*.10;
      const xx=sign*(.90+rand()*.065);
      box(core,xx,yy,zz,.16,.20+rand()*.17,.33+rand()*.13,
        rand()<.42?C.coat:rand()<.53?C.copper:C.coatShade,
        0,0,sign*(.03+.12*rand()));
    }
    for(let row=0;row<4;row++)for(let col=0;col<9;col++){
      const z=-.47+col*.26+(rand()-.5)*.10;
      const y=2.36-row*.29+(rand()-.5)*.08;
      const p=Math.min(1,Math.max(0,(col-1)/8));
      const x=sign*(1.01-row*.020+(rand()-.5)*.032);
      const hue=col<4?(row%2?C.ochre:C.coatLight):
        (rand()<.18?C.coatLight:rand()<.30?C.coat:C.coatShade);
      box(core,x,y,z,.13,.24,.25,hue,0,0,sign*.15*(1-p));
    }
    // Ridge of copper plates across the back of the shoulders.
    for(let k=0;k<7;k++){
      const zz=-.75+k*.25;
      box(core,sign*(.38+.18*rand()),2.58+rand()*.10,zz,
        .31,.16,.34,k%3===0?C.ochre:C.coatLight,0,sign*.08,0);
    }
  }
  // Broad back ends in a three-tier square-voxel spine, not spikes.
  for(let i=0;i<10;i++){
    box(core,(rand()-.5)*1.25,2.50-rand()*.06,-1.05+i*.31,
      .31+rand()*.16,.11+rand()*.11,.30,
      i%4===0?C.copper:C.coatShade);
  }

  // Lion legs are NOT rigid paddles: the four independent hips each have
  // separate elbows/knees and ankle/paw joints. Charging involves real
  // weight transfer through the shoulders and the hind leg kick-off.
  function leg(name,sign,front){
    const pivot=makeJoint(root,name,sign*(front?.89:.82),front?2.14:1.95,
      front?-1.42:1.30);
    if(front){
      // Layered shoulder and long slanted upper forelimb.
      box(pivot,0,-.23,-.07,.89,.85,.95,C.coatLight,0,0,sign*-.09);
      box(pivot,0,-.65,-.23,.76,.88,.79,C.coat, -.16,0,sign*.04);
      box(pivot,sign*.20,-.45,-.40,.28,.73,.57,C.copper,-.13,0,sign*.16);
      box(pivot,sign*.07,-.32,.26,.57,.59,.54,C.coatShade,0,0,-sign*.10);
      const elbow=makeJoint(pivot,name+'Elbow',sign*.035,-.85,-.37);
      box(elbow,0,-.20,-.05,.73,.72,.75,C.coatLight,-.10);
      box(elbow,0,-.53,-.17,.70,.82,.69,C.coat,-.15);
      box(elbow,sign*.08,-.75,-.32,.66,.40,.72,C.coatLight);
      for(let i=0;i<5;i++){
        box(elbow,sign*.29,-.05-i*.15,.08,.15,.24,.23,
          i%2?C.ochre:C.copper,0,0,sign*.08);
      }
      const paw=makeJoint(elbow,name+'Paw',sign*.02,-.97,-.46);
      // Each front paw rests on the floor at Y~0 in the neutral pose.
      box(paw,0,-.12,-.16,1.04,.35,.98,C.coatShade);
      box(paw,0,-.25,-.37,1.11,.17,.83,C.coat);
      for(let k=0;k<4;k++){
        const x=(k-1.5)*.25;
        box(paw,x,-.19,-.68,.225,.29,.47,k%2?C.coatLight:C.coat);
        box(paw,x,-.24,-.96,.18,.21,.32,C.claw,-.24);
      }
      // Longer articulated black scythe claws. Front view must show four
    // individual tips extending past the toes like the concept reference.
    for(let k=0;k<4;k++){
      const xx=(k-1.5)*.25;
      taperedTube(paw,[
        [xx,-.13,-.93],[xx,-.19,-1.19],[xx,-.24,-1.47]
      ],[.109,.069,.005],[C.hoof,C.claw,0x0a090b],5);
    }
    // Fine outer paw ridges look like tendon plates, not flat mittens.
      for(const side of [-1,1]){
        box(paw,side*.45,-.06,-.46,.14,.28,.59,C.copper,0,0,side*.14);
      }
    }else{
      // Big haunches and sharply articulated rear hock, like a lion.
      box(pivot,0,-.27,.03,.83,.95,1.04,C.coatLight,0,0,sign*.11);
      box(pivot,-sign*.02,-.62,.25,.68,.74,.76,C.coat, -.17,0,sign*-.14);
      box(pivot,sign*.19,-.22,.18,.26,.75,.54,C.copper,0,0,sign*.20);
      const elbow=makeJoint(pivot,name+'Elbow',sign*.045,-.77,.28);
      box(elbow,0,-.30,-.08,.56,.77,.60,C.coatLight,.23);
      box(elbow,0,-.65,-.27,.58,.61,.64,C.coat,-.19);
      box(elbow,sign*.13,-.75,-.30,.31,.30,.35,C.copper);
      const paw=makeJoint(elbow,name+'Paw',0,-.90,-.30);
      box(paw,0,-.09,-.25,.80,.26,.76,C.coatShade);
      box(paw,0,-.14,-.40,.89,.20,.69,C.coat);
      for(let k=0;k<4;k++){
        const x=(k-1.5)*.19;
        box(paw,x,-.16,-.57,.19,.22,.35,C.coatLight);
        box(paw,x,-.19,-.76,.14,.15,.24,C.claw,-.17);
      }
      for(let k=0;k<7;k++){
        box(pivot,sign*.30,-.12-k*.14,.13+rand()*.13,.15,.22,.30,
          k%3===0?C.copper:C.coatShade,0,0,sign*.05);
      }
    }
    return pivot;
  }
  leg('frontLeft',-1,true);leg('frontRight',1,true);
  leg('backLeft',-1,false);leg('backRight',1,false);

  // Lion head / roar: physically distinct cranium and lower jaw.
  // The lion's HEAD (and therefore its silhouette) must dominate the frame.
  const head=makeJoint(core,'lionHead',0,3.13,-2.27);
  head.scale.set(1.28,1.19,1.24);
  const mainFace=C.amber;
  // Multi-layer cranium: broad temples taper into a strong feline snout.
  // Cheekbones and jaw are distinct, rather than one cartoon box.
  box(head,0,0,-.36,1.52,1.00,1.08,C.coat);
  box(head,0,.32,-.53,1.37,.47,.79,C.copper);
  box(head,0,.13,-.89,1.03,.52,.73,mainFace);
  box(head,0,-.19,-1.03,.96,.34,.56,C.ochre);
  for(const sign of [-1,1]){
    box(head,sign*.56,.24,-.56,.38,.41,.65,C.copper,0,0,sign*-.20);
    box(head,sign*.45,.09,-.99,.37,.32,.33,C.ochre);
    box(head,sign*.40,.28,-1.16,.32,.16,.11,C.lip);
    // Sculpted cheeks form deep side shadows beneath angry brows.
    box(head,sign*.60,-.27,-1.05,.26,.48,.42,C.deepMane,0,0,sign*.19);
    box(head,sign*.45,-.41,-1.16,.27,.41,.43,C.amber,0,0,sign*.14);
    box(head,sign*.60,-.67,-1.00,.21,.42,.38,C.ochre,0,0,sign*.26);
    // Jet-dark sockets; honey-yellow luminous rectangular eyes.
    box(head,sign*.36,.23,-1.266,.34,.20,.04,C.coatShade,0,0,sign*.14);
    box(head,sign*.36,.23,-1.294,.229,.105,.029,0x070606,0,0,sign*.10);
    box(head,sign*.36,.23,-1.319,.166,.073,.023,0xffc643,0,0,sign*.10);
    box(head,sign*.36,.23,-1.341,.075,.092,.018,0xffe887);
    box(head,sign*.352,.236,-1.362,.034,.082,.016,0x301e0e);
    // Fierce, diagonally slanted brows. Upper cheek framing.
    box(head,sign*.37,.40,-1.258,.53,.19,.25,C.deepMane,0,0,sign*.26);
    box(head,sign*.63,-.06,-.82,.28,.47,.57,C.copper,0,0,sign*.18);
    box(head,sign*.32,-.28,-1.23,.43,.25,.42,C.ochre);
    // Sparse small whisker scars (voxel sculpture, not texture).
    for(let dot=0;dot<3;dot++)
      box(head,sign*(.30+dot*.095),-.35+(dot%2)*.09,-1.473,
        .055,.046,.030,dot===1?C.deepMane:C.copper);
  }
  // Broad lion snout and black triangular-ish nose made from stepped voxels.
  box(head,0,-.21,-1.14,1.06,.35,.47,C.amber);
  box(head,-.275,-.19,-1.44,.48,.29,.40,C.gold);
  box(head,.275,-.19,-1.44,.48,.29,.40,C.gold);
  box(head,0,-.13,-1.66,.48,.20,.18,C.hoof);
  box(head,0,-.24,-1.635,.32,.19,.15,C.lip);
  box(head,0,-.30,-1.655,.10,.15,.055,C.coatShade);
  // Strong open maw extends UNDER the nose, full cavity visible frontally.
  box(head,0,-.76,-1.30,1.06,1.00,.24,C.lip);
  box(head,0,-.77,-1.441,.89,.83,.075,C.mouth);
  box(head,0,-1.015,-1.489,.45,.17,.055,C.tongue);
  box(head,0,-.85,-1.490,.11,.30,.035,0x6e2534);
  const jaw=makeJoint(head,'lionJaw',0,-1.18,-1.07);
  box(jaw,0,0,-.24,1.04,.29,.67,C.ochre);
  box(jaw,0,.155,-.46,.85,.14,.49,C.coatLight);
  box(jaw,0,-.17,-.43,.82,.15,.48,C.copper);
  box(jaw,0,.20,-.59,.54,.11,.28,C.tongue);
  // Oversized ivory saber fangs, visually essential in the reference.
  for(const sign of [-1,1]){
    taperedTube(head,[
      [sign*.35,-.31,-1.57],[sign*.35,-.51,-1.69],
      [sign*.33,-.85,-1.71],[sign*.30,-1.16,-1.68],
      [sign*.28,-1.37,-1.61]
    ],[.180,.173,.131,.078,.009],
    [C.teeth,C.teeth,C.toothShade,C.teeth,C.teeth],5);
    // Supporting incisors, tiny lower teeth and two lower canines.
    box(head,sign*.115,-.41,-1.662,.12,.27,.15,C.teeth);
    taperedTube(jaw,[
      [sign*.345,.18,-.60],[sign*.34,.35,-.60],
      [sign*.32,.50,-.59]
    ],[.125,.078,.008],[C.teeth,C.toothShade,C.teeth],5);
  }

  // Massive mane: tightly stacked variable-size cuboid locks; a visibly
  // three-dimensional volume, not a flat orange shell painted on the head.
  // Wrap the head in a lion's huge full neck mane, not an orange crest.
  const mane=makeJoint(core,'mane',0,2.71,-1.56);
  mane.scale.set(1.24,1.22,1.26);
  box(mane,0,-.05,-.02,2.26,2.13,1.42,C.deepMane);
  box(mane,0,.70,.10,2.24,.68,1.46,C.copper);
  box(mane,0,-.71,.05,1.95,.74,1.34,C.copper);
  for(let layer=0;layer<9;layer++){
    const y=.98-layer*.28;
    const width=1.10+Math.sin(layer/9*Math.PI)*.18;
    for(let j=-6;j<=6;j++){
      const t=j/6;
      const x=t*width+(rand()-.5)*.10;
      const z=-.12+.30*Math.abs(t)+(rand()-.5)*.45;
      const size=.20+rand()*.14;
      // Face must be OPEN at the front; frame it with thick cheek locks.
      if(Math.abs(x)<.51&&z<-.12&&y>-.50)continue;
      const shade=rand();
      const color=shade<.15?C.maneHi:shade<.36?C.gold:shade<.65?C.amber:
        shade<.87?C.ochre:C.deepMane;
      box(mane,x,y,z,size,.36+rand()*.36,.32+rand()*.18,
        color,-.05+rand()*.12,0,t*.18);
    }
  }
  // Bold upper crown pointing backward, stepped silhouettes along skull.
  for(let row=0;row<5;row++)for(let i=-6;i<=6;i++){
    if(Math.abs(i)>6-row*.35)continue;
    const x=i*.21+(rand()-.5)*.07;
    box(mane,x,1.06+rand()*.14+(.32-Math.abs(x)*.24),
      -.39+row*.28,.21+rand()*.11,.38+rand()*.40,.34,
      rand()<.56?C.gold:rand()<.55?C.maneHi:C.copper,
      -.16,0,(rand()-.5)*.32);
  }
  // Long cheek and chest locks, descending toward the front legs.
  for(const sign of [-1,1]){
    for(let row=0;row<6;row++)for(let j=0;j<8;j++){
      const x=sign*(.64+row*.115+(rand()-.5)*.06);
      const y=.60-j*.37+(rand()-.5)*.05;
      const z=-.36+row*.085+(rand()-.5)*.17;
      box(mane,x,y,z,.23+rand()*.12,.43+rand()*.27,.29+rand()*.12,
        rand()<.34?C.gold:rand()<.48?C.amber:C.copper,
        -.11,0,sign*(.06+.08*rand()));
    }
  }
  for(let i=0;i<80;i++){
    const x=(rand()-.5)*1.80,z=-.51+rand()*.98;
    const y=-1.00-rand()*.72;
    box(mane,x,y,z,.21+rand()*.12,.38+rand()*.33,.24+rand()*.12,
      rand()<.30?C.deepMane:rand()<.49?C.ochre:C.amber,
      -.05-rand()*.17,0,(rand()-.5)*.20);
  }
  // Long, layered swept-back locks soften the side silhouette WITHOUT
  // replacing the authentic cube-built mane with flat paper surfaces.
  for(const sign of [-1,1])for(let row=0;row<4;row++)
    for(let k=0;k<14;k++){
      const x=sign*(.90+row*.15+rand()*.11);
      const z=-.15+row*.18+(k%7)*.25+(rand()-.5)*.13;
      const y=.59-Math.floor(k/7)*.53-rand()*.16;
      box(mane,x,y,z,.17+rand()*.10,.30+rand()*.28,.40+rand()*.17,
        rand()<.32?C.copper:rand()<.47?C.ochre:C.amber,
        -.31,0,sign*.12);
    }

  // Completely NEW silhouette: many wedge-shaped mane locks flare outward
  // and down, making the mane jagged and long rather than a toy block wig.
  for(const sign of [-1,1]){
    for(let layer=0;layer<7;layer++)for(let k=0;k<12;k++){
      const x=sign*(.79+layer*.115+(rand()-.5)*.08);
      const y=1.00-k*.23+(rand()-.5)*.10;
      const z=-.78+layer*.20+(rand()-.5)*.18;
      furWedge(mane,x,y,z,
        sign*(.08+rand()*.19),-.35-rand()*.56,
        -.08-rand()*.25,.19+rand()*.14,.27+rand()*.15,
        rand()<.22?C.maneHi:rand()<.43?C.gold:rand()<.67?C.amber:C.deepMane);
    }
    for(let k=0;k<45;k++){
      const x=sign*(.52+(k%5)*.14+rand()*.10);
      const y=.48-Math.floor(k/5)*.18;
      furWedge(mane,x,y,-.85+rand()*.19,
        sign*.12,-.22-rand()*.33,-.23-rand()*.20,
        .14+rand()*.11,.26+rand()*.10,
        rand()<.38?C.copper:rand()<.49?C.maneHi:C.ochre);
    }
    // Angular dark cheek fur framing the jaws.
    for(let k=0;k<24;k++){
      furWedge(head,sign*(.55+rand()*.24),-.11-k*.036,-.90,
        sign*(.10+rand()*.17),-.22-rand()*.26,-.25,
        .16,.22,k%3===0?C.copper:C.deepMane);
    }
  }
  // Aggressive swept-back crest, separated into sharp sculpted tufts.
  for(let row=0;row<8;row++)for(let col=-6;col<=6;col++){
    const x=col*.24+(rand()-.5)*.10;
    const z=-.45+row*.24+(rand()-.5)*.10;
    const y=1.30+Math.max(0,.23-Math.abs(x)*.14)+rand()*.12;
    furWedge(mane,x,y,z,(rand()-.5)*.15,
      .38+rand()*.45,.30+rand()*.35,
      .19+rand()*.12,.25+rand()*.12,
      rand()<.28?C.deepMane:rand()<.39?C.maneHi:C.copper);
  }

  // Buffalo horns: conspicuously WIDER and more swept-back than v1.
  // Each starts deep in the mane, reaches out horizontally, then curls UP.
  // Attached to the torso rig so the roots never float when the boss breathes.
  for(const sign of [-1,1]){
    taperedTube(core,[
      [sign*.63,3.58,-1.98],
      [sign*.93,3.60,-2.02],
      [sign*1.37,3.55,-2.07],
      [sign*1.79,3.49,-2.14],
      [sign*2.30,3.56,-2.29],
      [sign*2.78,3.80,-2.42],
      [sign*3.02,4.29,-2.54],
      [sign*3.12,4.78,-2.61],
      [sign*3.00,5.23,-2.68]
    ],[.33,.37,.35,.31,.25,.19,.13,.077,.005],
    [C.horn,C.hornEdge,C.horn,C.horn,C.hornEdge,C.horn,
     C.horn,C.hornTip,C.hornTip],9);
    // Visible scarred stone bands interrupt the smooth cartoon horn tube.
    for(const [xx,yy,zz] of [
      [1.63,3.50,-2.14],[2.13,3.53,-2.25],[2.70,3.78,-2.40]
    ]){
      box(core,sign*xx,yy,zz,.09,.33,.38,
        rand()<.5?C.hornEdge:C.horn,0,0,sign*.12);
    }
    // Fine bronze-black collar detailing is part of the reference silhouette.
    box(core,sign*.94,3.60,-2.03,.25,.33,.38,C.snakeGold,0,0,sign*.09);
    box(core,sign*1.10,3.57,-2.07,.10,.34,.35,C.horn,0,0,sign*.10);
    box(core,sign*1.56,3.53,-2.10,.07,.27,.29,C.hornEdge,0,0,sign*.15);
  }

  // Two glowing eyes are real unlit meshes, not merely yellow painted voxels.
  const eyeMat=new THREE.MeshBasicMaterial({color:0xffe46b});
  const snakeEyeMat=new THREE.MeshBasicMaterial({color:0xffe26b});
  for(const sign of [-1,1]){
    const e=new THREE.Mesh(new THREE.BoxGeometry(.153,.077,.028),eyeMat.clone());
    e.position.set(sign*.36,.23,-1.357);
    e.castShadow=false;e.userData.mobOwnMaterial=true;head.add(e);
  }

  // 8+-block snake-tail assembly. It is a single watertight tube (continuous
  // body) with subtle block-scale camouflage and a separately articulated
  // predatory snake head above and behind the feline back.
  const tail=makeJoint(core,'snakeTail',0,1.57,1.64);
  // Clearly visible C-shaped thick snake, extended to the right.
  const snakePoints=[
    [0,0,0],[.12,-.11,.54],[.67,-.11,1.23],[1.55,.07,1.92],
    [2.42,.36,2.27],[3.16,.79,2.34],[3.54,1.40,2.20],
    [3.49,2.13,1.88],[3.19,2.80,1.50],[2.86,3.08,1.06]
  ];
  const snakeCurve=new THREE.CatmullRomCurve3(snakePoints.map(p=>point(...p)),false,'catmullrom',.38);
  const V=[],colors=[],faces=[];
  const segments=56,radial=12;
  const pigment=new THREE.Color();
  for(let i=0;i<segments;i++){
    for(let j=0;j<radial;j++){
      const t0=i/segments,t1=(i+1)/segments;
      const a0=j/radial*Math.PI*2,a1=(j+1)/radial*Math.PI*2;
      const uv=(t,angle)=>{
        const v=snakeCurve.getPoint(t),tangent=snakeCurve.getTangent(t);
        const helper=Math.abs(tangent.y)>.88?point(1,0,0):point(0,1,0);
        const u=new THREE.Vector3().crossVectors(tangent,helper).normalize();
        const w=new THREE.Vector3().crossVectors(tangent,u).normalize();
        const taper=1-.63*Math.pow(t,1.30);
        const radius=(.68+.10*Math.sin(t*Math.PI))*taper;
        return v.addScaledVector(u,Math.cos(angle)*radius)
          .addScaledVector(w,Math.sin(angle)*radius*.89);
      };
      const points=[uv(t0,a0),uv(t0,a1),uv(t1,a0),uv(t1,a1)];
      const start=V.length/3;
      for(const p of points)V.push(p.x,p.y,p.z);
      // Small scale-sized golden and slate olive patches matching the
      // reference's checkered anaconda hide, but NO protruding larval bumps.
      const signal=Math.sin(i*.85+j*1.7)+Math.sin(i*.41-j*2.11);
      const dark=signal>.85||signal<-.90;
      const medium=signal>.24;
      const color=(j>=4&&j<=7)?C.snakeBelly:
        dark?C.snakeDark:medium?C.snakeGold:C.snake;
      pigment.setHex(color);
      const dim=1-.06*(j%3);
      for(let n=0;n<4;n++)colors.push(pigment.r*dim,pigment.g*dim,pigment.b*dim);
      faces.push(start,start+2,start+1,start+1,start+2,start+3);
    }
  }
  const snakeGeom=new THREE.BufferGeometry();
  snakeGeom.setAttribute('position',new THREE.Float32BufferAttribute(V,3));
  snakeGeom.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
  snakeGeom.setIndex(faces);snakeGeom.computeVertexNormals();
  const snakeMesh=new THREE.Mesh(snakeGeom,new THREE.MeshLambertMaterial({
    color:0xffffff,vertexColors:true,flatShading:true,side:THREE.DoubleSide
  }));
  snakeMesh.name='CONTINUOUS SCULPTED SNAKE TAIL';
  snakeMesh.castShadow=true;snakeMesh.receiveShadow=true;
  snakeMesh.userData.mobOwnMaterial=true;tail.add(snakeMesh);

  // Facing toward the player's screen (local -Z), with a long angular upper
  // jaw, golden eye sockets, lower mandible, fangs and a forked red tongue.
  const snakeHead=makeJoint(tail,'snakeHead',2.86,3.08,1.06);
  snakeHead.scale.set(1.34,1.30,1.38);
  // Wedge-like reptile skull: large at the neck, tapering into a long
  // heavy upper jaw. The open lower jaw is a completely separate joint.
  box(snakeHead,0,0,-.29,.83,.45,.83,C.snake);
  box(snakeHead,0,.20,-.35,.78,.18,.72,C.snakeGold);
  box(snakeHead,0,-.065,-.76,.69,.30,.72,C.snake);
  box(snakeHead,0,-.22,-.91,.57,.22,.64,C.snakeBelly);
  box(snakeHead,0,-.33,-.93,.64,.16,.62,C.snakeDark);
  box(snakeHead,0,-.20,-1.10,.55,.28,.20,C.snakeLip);
  box(snakeHead,0,-.285,-1.18,.48,.27,.045,C.mouth);
  const lowerSnakeJaw=makeJoint(snakeHead,'snakeJaw',0,-.45,-.62);
  box(lowerSnakeJaw,0,0,-.24,.70,.17,.78,C.snakeBelly);
  box(lowerSnakeJaw,0,.13,-.43,.49,.075,.43,C.tongue);
  box(snakeHead,0,-.44,-1.15,.09,.06,.35,0xab4556);
  box(snakeHead,-.07,-.44,-1.35,.065,.047,.27,0xa93849,0,-.12);
  box(snakeHead,.07,-.44,-1.35,.065,.047,.27,0xa93849,0,.12);
  for(const sign of [-1,1]){
    box(snakeHead,sign*.34,.15,-.76,.18,.22,.30,C.snakeDark);
    box(snakeHead,sign*.32,.195,-.94,.125,.105,.075,0xffd24e);
    box(snakeHead,sign*.32,.195,-1.005,.039,.12,.026,0x171910);
    const glow=new THREE.Mesh(new THREE.BoxGeometry(.105,.087,.027),snakeEyeMat.clone());
    glow.position.set(sign*.32,.195,-1.038);
    glow.userData.mobOwnMaterial=true;snakeHead.add(glow);
    box(snakeHead,sign*.23,-.09,-1.185,.09,.065,.10,C.snakeDark);
    taperedTube(snakeHead,[
      [sign*.27,-.21,-1.11],[sign*.27,-.39,-1.14],
      [sign*.24,-.63,-1.19]
    ],[.11,.083,.007],[C.teeth,C.teeth,C.toothShade],5);
    taperedTube(lowerSnakeJaw,[
      [sign*.23,.12,-.55],[sign*.23,.28,-.55]
    ],[.077,.008],[C.teeth,C.teeth],5);
  }
  // Dorsal lip scales keep the reptile angular and distinctly a snake.
  for(let i=0;i<12;i++){
    const x=((i%3)-1)*.26, z=-.25-Math.floor(i/3)*.22;
    box(snakeHead,x,.265-(i%2)*.03,z,.19,.10,.20,
      i%4===0?C.snakeGold:C.snakeDark);
  }

  finishBoxes();
  finishFur();
  root.userData.chimeraRig={
    body:core,
    frontLeft:joints.frontLeft,frontRight:joints.frontRight,
    backLeft:joints.backLeft,backRight:joints.backRight,
    frontLeftElbow:joints.frontLeftElbow,frontRightElbow:joints.frontRightElbow,
    backLeftElbow:joints.backLeftElbow,backRightElbow:joints.backRightElbow,
    frontLeftPaw:joints.frontLeftPaw,frontRightPaw:joints.frontRightPaw,
    backLeftPaw:joints.backLeftPaw,backRightPaw:joints.backRightPaw,
    mane,head,jaw,tail,snakeHead,lowerSnakeJaw
  };
  root.userData.chimeraVersion=CHIMERA_DESIGN.version;
  root.userData.chimeraLookRevision='20261011-large-head-spiked-mane-visible-serpent-v3';
  root.userData.visualVariant='v3-giant-lion-angular-wild-mane-coiled-serpent';
  root.userData.chimeraVisualOnly=true;
  root.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true}});
  return root;
}

/**
 * Frame-rate independent four-legged locomotion. The gait is measured in
 * blocks/second, not arbitrary "sin(t*.009)" or one stationary leg wiggle.
 * Mode: false/'idle', true/'walk', or 'charge' (boss rush).
 * The in-world boss AI can eventually call this with its actual movement mode.
 */
export function animateChimera(chimera,elapsedSeconds,mode='idle'){
  const r=chimera?.userData?.chimeraRig;
  if(!r)return;
  const t=elapsedSeconds;
  const state=mode===true?'walk':mode==='charge'?'charge':
    mode==='walk'?'walk':'idle';
  const moving=state!=='idle';
  const charging=state==='charge';
  const intensity=moving?(charging?1:.70):0;
  const moveSpeed=charging?CHIMERA_MOVEMENT.charge:CHIMERA_MOVEMENT.walk;
  const travelPerCycle=charging?CHIMERA_MOVEMENT.chargeStride:CHIMERA_MOVEMENT.walkStride;
  const lerp=(old,target,response)=>old+(target-old)*response;
  // Response in units of elapsed time (not FPS): 30/60/120 Hz animate
  // the same way on iPad without dampening fast leg cycles too much.
  const last=chimera.userData.chimeraAnimLast;
  chimera.userData.chimeraAnimLast=t;
  const delta=last==null ? 1/60 : Math.max(0,Math.min(.080,t-last));
  const damp=1-Math.exp(-delta*27);
  // Accumulate travel into the gait rather than deriving foot poses directly
  // from t*speed. Switching from walk to charge keeps each planted foot
  // continuous instead of snapping to another unrelated animation phase.
  if(chimera.userData.chimeraGaitPhase==null)
    chimera.userData.chimeraGaitPhase=0;
  if(moving)
    chimera.userData.chimeraGaitPhase+=delta*moveSpeed/travelPerCycle*Math.PI*2;
  const phase=chimera.userData.chimeraGaitPhase;

  // Quadruped trot / gallop: front-left and hind-right hit the ground
  // together; the other diagonal pair offsets by half a gait cycle.
  const legs=[
    [r.frontLeft,r.frontLeftElbow,r.frontLeftPaw,0,true],
    [r.frontRight,r.frontRightElbow,r.frontRightPaw,Math.PI,true],
    [r.backLeft,r.backLeftElbow,r.backLeftPaw,Math.PI,false],
    [r.backRight,r.backRightElbow,r.backRightPaw,0,false]
  ];
  for(const [hip,knee,paw,offset,front] of legs){
    const p=phase+offset;
    const forward=Math.sin(p);
    const lift=Math.max(0,Math.sin(p));
    const stride=front?(charging?.88:.58):(charging?.83:.54);
    const hipTarget=moving?stride*forward+(front?.10:-.12):0;
    const kneeTarget=moving?(front?-.19:.29)
      +(front?-.65:.67)*lift*intensity:0;
    const pawTarget=moving?(.24*Math.cos(p)-.23*lift)*intensity:0;
    hip.rotation.x=lerp(hip.rotation.x,hipTarget,damp);
    knee.rotation.x=lerp(knee.rotation.x,kneeTarget,damp);
    paw.rotation.x=lerp(paw.rotation.x,pawTarget,damp);
    paw.position.y=lerp(paw.position.y,(front?-.97:-.90)+lift*.27*intensity,damp);
  }

  // Body mass must LEAD the walk, not remain perfectly motionless while
  // the feet flutter. Head, mane, horns and tail inherit this moving torso.
  const beat=Math.sin(2*phase);
  r.body.position.y=lerp(r.body.position.y,
    intensity*(.062+.115*Math.max(0,beat)),damp);
  r.body.rotation.x=lerp(r.body.rotation.x,
    intensity*(.018*Math.sin(phase+.7)+.024*Math.sin(2*phase)),damp);
  r.body.rotation.z=lerp(r.body.rotation.z,
    intensity*(.040*Math.sin(phase+1.1)),damp);
  r.mane.position.y=2.71+Math.sin(t*1.67)*.024;
  r.mane.rotation.x=.025*Math.sin(t*1.93)+intensity*.022*Math.sin(phase+.4);
  r.head.rotation.x=.015+Math.sin(t*.81)*.026
    +intensity*.048*Math.sin(phase+.2);
  r.head.rotation.z=.012*Math.sin(t*.66)+intensity*.026*Math.sin(phase-.3);
  // The roar is an independent jaw movement rather than jaw+head rotation.
  r.jaw.rotation.x=-.23-.075*Math.sin(t*1.77);
  r.tail.rotation.y=Math.sin(t*1.13)*.20+intensity*.11*Math.sin(phase*.5);
  r.tail.rotation.z=Math.sin(t*.95+.5)*.085+intensity*.06*Math.sin(phase+.7);
  r.tail.rotation.x=Math.sin(t*.72)*.035;
  r.snakeHead.rotation.y=Math.sin(t*1.47)*.22;
  r.snakeHead.rotation.z=Math.sin(t*.91)*.10;
  r.snakeHead.rotation.x=Math.sin(t*.67)*.065;
  r.lowerSnakeJaw.rotation.x=-.22-.065*Math.sin(t*1.72+.8);
}
