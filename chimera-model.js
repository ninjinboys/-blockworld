/*
 * NEXACRAFT — Chimera art model, v1.
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
  version:1,
  role:'オーバーワールド中ボス',
  direction:'-Z',
  height:4.65,
  length:8.3,
  hornsWidth:4.7,
  distinguishingFeatures:[
    '厚い金茶色の段状たてがみ',
    '水牛の左右に反り上がる大角',
    '黄色く光る獅子の目と長い上顎の牙',
    '黒っぽい筋肉質の四足体',
    '地面から持ち上がった巨大な蛇の尾と独立した蛇頭'
  ]
});

export function buildChimera(THREE){
  const root=new THREE.Group();
  root.name='CHIMERA_BOSS_MODEL';
  const joints={};
  const batches=new Map();
  let seed=1469;
  const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
  const C={
    coat:0x514039,coatShade:0x372f31,coatLight:0x765747,
    back:0x29282b,backHi:0x484043,
    amber:0xb67132,gold:0xda922f,ochre:0x95551f,copper:0x76401f,
    deepMane:0x59301c,maneHi:0xe0a44a,
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

  // Independently rigged 4 heavy feline limbs, feet planted around y=0.
  // Forelegs are twice as visually dominant as the hind legs.
  function leg(name,sign,front){
    const pivot=makeJoint(root,name,sign*(front?.84:.82),front?2.02:1.78,
      front?-.93:1.28);
    if(front){
      box(pivot,0,-.32,0,.74,.93,.81,C.coatLight,0,0,sign*-.10);
      box(pivot,0,-.86,-.16,.68,.85,.69,C.coat,0,0,sign*.05);
      box(pivot,sign*.08,-1.34,-.36,.75,.68,.77,C.coatLight);
      box(pivot,sign*.09,-1.67,-.55,.89,.39,.96,C.coat);
      box(pivot,sign*.09,-1.83,-.77,1.03,.26,.94,C.coatShade);
      for(let i=0;i<4;i++){
        const x=(i-1.5)*.245+sign*.10;
        box(pivot,x,-1.88,-1.05,.22,.28,.42,C.hoof);
        box(pivot,x,-1.89,-1.31,.17,.19,.29,C.claw,-.11);
        box(pivot,x,-1.54,-.82,.19,.23,.27,i%2?C.coat:C.coatLight);
      }
      // Angular protective shoulder strands.
      for(let i=0;i<6;i++){
        box(pivot,sign*.25,-.15-i*.19,-.24+i*.045,.27,.36,.35,
          i%3===0?C.ochre:C.copper,0,0,sign*.12);
      }
    }else{
      box(pivot,0,-.23,0,.75,.86,.95,C.coatLight,0,0,sign*.09);
      box(pivot,sign*.08,-.77,.26,.55,.78,.57,C.coat);
      box(pivot,sign*.04,-1.22,.17,.51,.53,.52,C.coatLight,0,0,-sign*.08);
      box(pivot,sign*.03,-1.55,-.09,.73,.31,.77,C.coatShade);
      for(let i=0;i<4;i++){
        const x=(i-1.5)*.18;
        box(pivot,x,-1.61,-.40,.17,.21,.36,C.hoof);
        box(pivot,x,-1.64,-.61,.11,.17,.24,C.claw,-.15);
      }
      for(let k=0;k<8;k++)box(pivot,sign*.29,-.12-k*.14,.04+rand()*.13,
        .15,.22,.29,k%3?C.coat:C.copper,0,0,sign*.08);
    }
    return pivot;
  }
  leg('frontLeft',-1,true);leg('frontRight',1,true);
  leg('backLeft',-1,false);leg('backRight',1,false);

  // Lion head / roar: physically distinct cranium and lower jaw.
  const head=makeJoint(root,'lionHead',0,2.96,-1.70);
  const mainFace=C.amber,cheek=C.ochre;
  box(head,0,0,-.38,1.23,.91,.91,mainFace);
  box(head,0,.31,-.53,1.37,.42,.75,C.ochre);
  box(head,0,.10,-.85,.95,.48,.64,C.gold);
  for(const sign of [-1,1]){
    box(head,sign*.52,.27,-.50,.35,.37,.59,C.copper,0,0,sign*-.22);
    box(head,sign*.42,.18,-.93,.31,.24,.21,C.ochre);
    box(head,sign*.39,.28,-1.16,.31,.17,.10,C.lip);
    // Jet-dark sockets; honey-yellow luminous rectangular eyes.
    box(head,sign*.36,.23,-1.228,.30,.22,.035,C.coatShade);
    box(head,sign*.36,.23,-1.250,.195,.11,.029,0x000000);
    box(head,sign*.36,.23,-1.274,.135,.099,.024,0xffc643);
    box(head,sign*.36,.23,-1.299,.053,.105,.02,0xffec92);
    box(head,sign*.35,.25,-1.323,.027,.092,.014,0x482a11);
    // Fierce, diagonally slanted brows. Upper cheek framing.
    box(head,sign*.37,.425,-1.174,.46,.17,.21,C.copper,0,0,sign*.14);
    box(head,sign*.65,-.08,-.80,.27,.47,.53,C.copper,0,0,sign*.14);
    box(head,sign*.33,-.24,-1.17,.47,.27,.44,C.maneHi);
  }
  // Broad lion snout and black triangular-ish nose made from stepped voxels.
  box(head,0,-.21,-1.10,1.05,.34,.40,C.amber);
  box(head,-.25,-.21,-1.39,.47,.30,.37,C.gold);
  box(head,.25,-.21,-1.39,.47,.30,.37,C.gold);
  box(head,0,-.12,-1.60,.46,.17,.15,C.hoof);
  box(head,0,-.225,-1.58,.31,.18,.14,C.lip);
  // Strong open maw extends UNDER the nose, full cavity visible frontally.
  box(head,0,-.65,-1.24,.91,.78,.16,C.lip);
  box(head,0,-.60,-1.335,.75,.61,.045,C.mouth);
  box(head,0,-.85,-1.378,.39,.17,.035,C.tongue);
  box(head,0,-.70,-1.397,.10,.31,.031,0x6e2534);
  const jaw=makeJoint(head,'lionJaw',0,-.93,-1.06);
  box(jaw,0,0,-.18,.94,.27,.62,C.gold);
  box(jaw,0,.14,-.38,.77,.13,.44,C.coatLight);
  box(jaw,0,-.18,-.38,.78,.15,.40,C.copper);
  box(jaw,0,.18,-.52,.44,.09,.28,C.tongue);
  // Oversized ivory saber fangs, visually essential in the reference.
  for(const sign of [-1,1]){
    taperedTube(head,[
      [sign*.31,-.30,-1.52],[sign*.31,-.49,-1.60],
      [sign*.29,-.78,-1.62],[sign*.27,-1.06,-1.61],
      [sign*.26,-1.17,-1.59]
    ],[.175,.160,.125,.075,.012],
    [C.teeth,C.teeth,C.toothShade,C.teeth,C.teeth],5);
    // Supporting incisors, tiny lower teeth and two lower canines.
    box(head,sign*.115,-.38,-1.582,.11,.21,.13,C.teeth);
    taperedTube(jaw,[
      [sign*.335,.15,-.54],[sign*.34,.31,-.55],
      [sign*.32,.43,-.54]
    ],[.115,.075,.014],[C.teeth,C.toothShade,C.teeth],5);
  }

  // Massive mane: tightly stacked variable-size cuboid locks; a visibly
  // three-dimensional volume, not a flat orange shell painted on the head.
  const mane=makeJoint(root,'mane',0,2.58,-1.41);
  box(mane,0,-.05,-.02,2.21,2.10,1.28,C.deepMane);
  box(mane,0,.70,.10,2.22,.68,1.42,C.copper);
  box(mane,0,-.71,.05,1.93,.74,1.26,C.copper);
  for(let layer=0;layer<9;layer++){
    const y=.98-layer*.28;
    const width=1.10+Math.sin(layer/9*Math.PI)*.18;
    for(let j=-6;j<=6;j++){
      const t=j/6;
      const x=t*width+(rand()-.5)*.10;
      const z=.05+.23*Math.abs(t)+(rand()-.5)*.30;
      const size=.20+rand()*.13;
      // Face must be OPEN at the front; frame it with thick cheek locks.
      if(Math.abs(x)<.51&&z<-.12&&y>-.50)continue;
      const shade=rand();
      const color=shade<.20?C.maneHi:shade<.44?C.gold:shade<.70?C.amber:
        shade<.86?C.ochre:C.deepMane;
      box(mane,x,y,z,size,.34+rand()*.34,.31+rand()*.14,
        color,rand()*.08,0,t*.14);
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
  for(let i=0;i<40;i++){
    const x=(rand()-.5)*1.52,z=-.52+rand()*.94;
    const y=-1.09-rand()*.35;
    box(mane,x,y,z,.23+rand()*.10,.38+rand()*.24,.26,
      rand()<.38?C.deepMane:C.ochre,-.09,0,(rand()-.5)*.13);
  }

  // Monumental buffalo horns emerge on BOTH SIDES of the skull and sweep
  // outward, curling sharply UP to tapered charcoal tips.
  for(const sign of [-1,1]){
    taperedTube(root,[
      [sign*.60,3.61,-1.92],
      [sign*.83,3.67,-1.94],
      [sign*1.22,3.63,-1.95],
      [sign*1.61,3.60,-1.91],
      [sign*1.96,3.73,-1.87],
      [sign*2.22,4.05,-1.84],
      [sign*2.30,4.35,-1.81],
      [sign*2.24,4.59,-1.79]
    ],[.30,.33,.32,.28,.22,.15,.092,.008],
    [C.horn,C.hornEdge,C.horn,C.horn,C.hornEdge,C.horn,C.hornTip,C.hornTip],7);
    // Distinct bronze-gold base collars carved into each horn.
    box(root,sign*.88,3.68,-1.94,.28,.31,.34,C.snakeGold,0,0,sign*.13);
    box(root,sign*1.07,3.68,-1.95,.11,.31,.29,C.horn,0,0,sign*.12);
  }

  // Two glowing eyes are real unlit meshes, not merely yellow painted voxels.
  const eyeMat=new THREE.MeshBasicMaterial({color:0xffe46b});
  const snakeEyeMat=new THREE.MeshBasicMaterial({color:0xffe26b});
  for(const sign of [-1,1]){
    const e=new THREE.Mesh(new THREE.BoxGeometry(.135,.10,.028),eyeMat.clone());
    e.position.set(sign*.36,.23,-1.314);
    e.castShadow=false;e.userData.mobOwnMaterial=true;head.add(e);
  }

  // 8+-block snake-tail assembly. It is a single watertight tube (continuous
  // body) with subtle block-scale camouflage and a separately articulated
  // predatory snake head above and behind the feline back.
  const tail=makeJoint(root,'snakeTail',0,1.57,1.64);
  const snakePoints=[
    [0,0,0],[.04,-.04,.48],[.37,.04,1.00],[.89,.23,1.52],
    [1.51,.45,1.95],[2.01,.89,2.14],[2.18,1.47,2.15],
    [2.07,2.02,1.98],[1.72,2.40,1.64],[1.43,2.53,1.28]
  ];
  const snakeCurve=new THREE.CatmullRomCurve3(snakePoints.map(p=>point(...p)),false,'catmullrom',.38);
  const V=[],colors=[],faces=[];
  const segments=56,radial=12;
  const pigment=new THREE.Color();
  let baseGeometry;
  for(let i=0;i<segments;i++){
    for(let j=0;j<radial;j++){
      const t0=i/segments,t1=(i+1)/segments;
      const a0=j/radial*Math.PI*2,a1=(j+1)/radial*Math.PI*2;
      const uv=(t,angle)=>{
        const v=snakeCurve.getPoint(t),tangent=snakeCurve.getTangent(t);
        const helper=Math.abs(tangent.y)>.88?point(1,0,0):point(0,1,0);
        const u=new THREE.Vector3().crossVectors(tangent,helper).normalize();
        const w=new THREE.Vector3().crossVectors(tangent,u).normalize();
        const taper=1-.76*Math.pow(t,1.30);
        const radius=(.43+.07*Math.sin(t*Math.PI))*taper;
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
  const snakeHead=makeJoint(tail,'snakeHead',1.43,2.53,1.28);
  box(snakeHead,0,0,-.35,.77,.47,.82,C.snake);
  box(snakeHead,0,.20,-.36,.67,.18,.68,C.snakeGold);
  box(snakeHead,0,-.08,-.72,.63,.31,.66,C.snake);
  box(snakeHead,0,-.21,-.72,.55,.23,.55,C.snakeBelly);
  box(snakeHead,0,-.33,-.86,.60,.16,.57,C.snakeDark);
  box(snakeHead,0,-.23,-1.00,.52,.29,.12,C.snakeLip);
  box(snakeHead,0,-.265,-1.05,.37,.24,.04,C.mouth);
  const lowerSnakeJaw=makeJoint(snakeHead,'snakeJaw',0,-.39,-.60);
  box(lowerSnakeJaw,0,0,-.21,.65,.17,.70,C.snakeBelly);
  box(lowerSnakeJaw,0,.13,-.34,.45,.075,.38,C.tongue);
  box(snakeHead,0,-.36,-1.08,.09,.06,.32,0xab4556);
  box(snakeHead,-.07,-.36,-1.24,.065,.047,.24,0xa93849,0,-.12);
  box(snakeHead,.07,-.36,-1.24,.065,.047,.24,0xa93849,0,.12);
  for(const sign of [-1,1]){
    box(snakeHead,sign*.30,.15,-.72,.16,.21,.26,C.snakeDark);
    box(snakeHead,sign*.31,.185,-.83,.115,.10,.08,0xffd24e);
    box(snakeHead,sign*.31,.185,-.89,.037,.12,.025,0x171910);
    const glow=new THREE.Mesh(new THREE.BoxGeometry(.085,.084,.023),snakeEyeMat.clone());
    glow.position.set(sign*.31,.19,-.919);
    glow.userData.mobOwnMaterial=true;snakeHead.add(glow);
    box(snakeHead,sign*.21,-.08,-1.072,.078,.065,.09,C.snakeDark);
    taperedTube(snakeHead,[
      [sign*.25,-.16,-1.03],[sign*.25,-.34,-1.06],[sign*.23,-.57,-1.08]
    ],[.104,.080,.008],[C.teeth,C.teeth,C.toothShade],5);
    taperedTube(lowerSnakeJaw,[
      [sign*.22,.10,-.48],[sign*.23,.26,-.48]
    ],[.072,.008],[C.teeth,C.teeth],5);
  }
  // Dorsal lip scales keep the reptile angular and distinctly a snake.
  for(let i=0;i<9;i++){
    const x=((i%3)-1)*.24, z=-.30-Math.floor(i/3)*.21;
    box(snakeHead,x,.265-(i%2)*.03,z,.19,.10,.18,
      i%3===0?C.snakeGold:C.snakeDark);
  }

  finishBoxes();
  root.userData.chimeraRig={
    frontLeft:joints.frontLeft,frontRight:joints.frontRight,
    backLeft:joints.backLeft,backRight:joints.backRight,
    mane,head,jaw,tail,snakeHead,lowerSnakeJaw
  };
  root.userData.chimeraVersion=CHIMERA_DESIGN.version;
  root.userData.chimeraVisualOnly=true;
  root.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true}});
  return root;
}

export function animateChimera(chimera,elapsedSeconds,walking=false){
  const r=chimera?.userData?.chimeraRig;
  if(!r)return;
  const t=elapsedSeconds;
  const stride=walking?.17:.020;
  const ease=(target,current)=>current+(target-current)*.20;
  const s=Math.sin(t*3.45);
  for(const [part,sign] of [
    [r.frontLeft,1],[r.frontRight,-1],
    [r.backLeft,-1],[r.backRight,1]
  ]){
    if(!part)continue;
    part.rotation.x=ease(stride*s*sign,part.rotation.x);
  }
  r.mane.position.y=2.58+Math.sin(t*1.60)*.025;
  r.head.rotation.x=.018+Math.sin(t*.89)*.021;
  // Slow breathing roar animation: open mouth remains visible even at rest.
  r.jaw.rotation.x=-.10+Math.sin(t*1.92)*.092;
  r.tail.rotation.y=Math.sin(t*1.20)*.135;
  r.tail.rotation.z=Math.sin(t*1.04+.5)*.055;
  r.snakeHead.rotation.y=Math.sin(t*1.63)*.16;
  r.snakeHead.rotation.z=Math.sin(t*.77)*.057;
  r.lowerSnakeJaw.rotation.x=-.10+Math.sin(t*1.72+.8)*.07;
}
