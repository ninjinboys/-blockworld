/**
 * NEXACRAFT Chimera — appearance pass 01.
 * Lion mane, sweeping horns, fangs, claws, glowing eyes, ears,
 * smooth horn / mane / fang surfaces, serpent face and soft color bands.
 * Pure procedural lightweight meshes; no downloads/assets/GLB.
 */
export function dressChimera(root,T){
  const skin=root.userData.chimeraSkin;
  if(!skin?.tail||!skin?.meshes)throw Error("Chimera skin missing");
  const find=name=>skin.meshes.find(m=>m.name===name);
  const deco=new T.Group();deco.name="CHIMERA ORNAMENTS / REAL MESH";
  root.add(deco);
  const mat=(color,more={})=>new T.MeshStandardMaterial({
    color,roughness:.94,metalness:0,flatShading:false,...more});
  const P={
    maneDark:mat(0x4a291f),mane:mat(0x945029),maneGold:mat(0xbe7535),
    manelight:mat(0xd39342),horn:mat(0x35343b),hornLight:mat(0x55525a),
    skull:mat(0xaa8457),sand:mat(0xd1a471),nose:mat(0x241d20),
    eyeRim:mat(0x241b18),eyes:new T.MeshBasicMaterial({color:0xffbb30}),
    pupil:mat(0x19110e),bone:mat(0xf6eac9),boneShadow:mat(0xb7a78b),
    mouth:mat(0x321a1c),snake:mat(0x546934),snakeLight:mat(0x83955d),
    snakeDark:mat(0x314931),snakeEye:new T.MeshBasicMaterial({color:0xffbb36}),
    tongue:mat(0xd65e77),claws:mat(0x201e24)
  };
  // Reuse smooth meshes everywhere rather than six-sided faceted cones.
  // Shared geometries + instancing keep the 20x20 world fast on mobile.
  const sphereGeo=new T.SphereGeometry(1,24,16);
  const coneGeo=new T.ConeGeometry(1,1,16,1);
  const tuftGeo=(()=>{
    const sections=9,sides=12,verts=[],ids=[];
    for(let k=0;k<=sections;k++){
      const u=k/sections;
      const radius=.84*Math.pow(1-u,.72)+.004;
      const curve=.22*u*u;
      for(let j=0;j<sides;j++){
        const a=j*2*Math.PI/sides;
        verts.push(radius*Math.cos(a)+curve,u-.5,radius*Math.sin(a));
        if(k<sections){
          const p=k*sides+j,q=k*sides+(j+1)%sides;
          ids.push(p,q,p+sides,q,q+sides,p+sides);
        }
      }
    }
    const g=new T.BufferGeometry();
    g.setAttribute("position",new T.Float32BufferAttribute(verts,3));
    g.setIndex(ids);g.computeVertexNormals();
    return g;
  })();
  const dummy=new T.Object3D();
  const up=new T.Vector3(0,1,0);
  function ball(parent,name,xyz,sizes,material){
    const m=new T.Mesh(sphereGeo,material);m.name=name;
    m.position.set(...xyz);m.scale.set(...sizes);parent.add(m);return m;
  }
  function pointed(parent,name,from,to,radius,material){
    // The point of THREE.ConeGeometry is its +Y cap.
    const a=new T.Vector3(...from),b=new T.Vector3(...to);
    const mesh=new T.Mesh(coneGeo,material);
    mesh.name=name;mesh.position.copy(a).add(b).multiplyScalar(.5);
    const direction=b.clone().sub(a);
    mesh.quaternion.setFromUnitVectors(up,direction.clone().normalize());
    mesh.scale.set(radius,direction.length(),radius);
    parent.add(mesh);return mesh;
  }
  function curvedHorn(sign){
    const coords=[
      [sign*.84,4.38,-3.30],[sign*1.39,4.45,-3.38],
      [sign*2.19,4.39,-3.46],[sign*2.72,4.61,-3.50],
      [sign*3.07,5.20,-3.49],[sign*3.00,5.92,-3.50],
      [sign*2.76,6.39,-3.57]
    ];
    const path=new T.CatmullRomCurve3(coords.map(p=>new T.Vector3(...p)));
    const rows=60,sides=20,vertices=[],colors=[],indices=[];
    const c1=new T.Color(0x49464a),c2=new T.Color(0x1f2027);
    const tangent=new T.Vector3(),axis1=new T.Vector3(),axis2=new T.Vector3();
    for(let i=0;i<=rows;i++){
      const t=i/rows,p=path.getPoint(t);
      path.getTangent(t,tangent);
      axis1.set(0,0,1).addScaledVector(tangent,-tangent.z).normalize();
      axis2.crossVectors(tangent,axis1).normalize();
      const radius=.345*Math.pow(1-t,.78)+.003;
      for(let j=0;j<sides;j++){
        const angle=2*Math.PI*j/sides;
        const pos=p.clone().addScaledVector(axis1,Math.cos(angle)*radius)
          .addScaledVector(axis2,Math.sin(angle)*radius);
        vertices.push(pos.x,pos.y,pos.z);
        const color=c1.clone().lerp(c2,Math.min(1,t*.91));
        colors.push(color.r,color.g,color.b);
        if(i<rows){
          const a=i*sides+j,b=i*sides+(j+1)%sides,
            c=(i+1)*sides+j,d=(i+1)*sides+(j+1)%sides;
          indices.push(a,c,b,b,c,d);
        }
      }
    }
    const geo=new T.BufferGeometry();
    geo.setAttribute("position",new T.Float32BufferAttribute(vertices,3));
    geo.setAttribute("color",new T.Float32BufferAttribute(colors,3));
    geo.setIndex(indices);geo.computeVertexNormals();
    const horn=new T.Mesh(geo,new T.MeshStandardMaterial({
      color:0xffffff,vertexColors:true,roughness:.88,flatShading:false,
      side:T.DoubleSide}));
    horn.name=sign<0?"LEFT RAM HORN":"RIGHT RAM HORN";
    hornGroup.add(horn);
  }
  const hornGroup=new T.Group();hornGroup.name="BUFFALO HORNS";
  deco.add(hornGroup);
  curvedHorn(-1);curvedHorn(1);

  // Annular faceted mane geometry leaves the face open, unlike a
  // full sphere which would hide the anatomical skull.
  function furRing(name,cx,cy,cz,outerX,outerY,innerX,innerY,depth,material){
    const N=72,v=[],indices=[];
    // front inner rim, front outer edge, back outer edge, back inner rim
    for(let ring=0;ring<4;ring++){
      const rx=(ring===0||ring===3)?innerX:outerX;
      const ry=(ring===0||ring===3)?innerY:outerY;
      const zz=ring===0?cz-.12:ring===1?cz:ring===2?cz+depth:cz+depth*.72;
      for(let j=0;j<N;j++){
        const a=j*2*Math.PI/N;
        const ragged=ring===1||ring===2?1+.018*Math.sin(a*7):1;
        v.push(cx+Math.cos(a)*rx*ragged,
          cy+Math.sin(a)*ry*ragged,zz);
      }
    }
    for(let r=0;r<4;r++)for(let j=0;j<N;j++){
      const a=r*N+j,b=r*N+(j+1)%N,c=((r+1)%4)*N+j,d=((r+1)%4)*N+(j+1)%N;
      indices.push(a,b,c,b,d,c);
    }
    const geo=new T.BufferGeometry();
    geo.setAttribute("position",new T.Float32BufferAttribute(v,3));
    geo.setIndex(indices);geo.computeVertexNormals();
    const mesh=new T.Mesh(geo,material);mesh.name=name;
    mesh.material.side=T.DoubleSide;
    mane.add(mesh);
  }
  const mane=new T.Group();mane.name="3 LAYER LION MANE";
  deco.add(mane);
  furRing("dark outer mane",0,3.53,-2.88,1.95,1.83,1.12,.81,1.17,P.maneDark);
  furRing("thick umber mane",0,3.66,-3.34,1.70,1.56,.97,.75,.92,P.mane);
  furRing("amber face framing fur",0,3.76,-3.92,1.42,1.24,.83,.67,.54,P.maneGold);
  // 3 smooth curved tuft layers, still only 3 instanced draw calls.
  const layers=[
    {count:32,cx:0,cy:3.53,cz:-2.78,rx:1.78,ry:1.61,len:.61,r:.19,material:P.maneDark},
    {count:32,cx:0,cy:3.70,cz:-3.29,rx:1.65,ry:1.46,len:.52,r:.17,material:P.mane},
    {count:26,cx:0,cy:3.76,cz:-3.84,rx:1.36,ry:1.19,len:.39,r:.14,material:P.maneGold}
  ];
  for(let li=0;li<layers.length;li++){
    const a=layers[li];
    const inst=new T.InstancedMesh(tuftGeo,a.material,a.count);
    inst.name="MANE TUFTS LAYER "+li;inst.frustumCulled=false;
    for(let i=0;i<a.count;i++){
      const t=(i+.36*li)*Math.PI*2/a.count;
      const radial=new T.Vector3(Math.cos(t),Math.sin(t),-.18);
      // Gravity pulls lower tufts downward, creating a lion's heavy ruff.
      const gravity=Math.sin(t)<0?-.57:-.10;
      const dir=new T.Vector3(Math.cos(t)*.9,Math.sin(t)+gravity,-.38).normalize();
      dummy.position.set(a.cx+Math.cos(t)*a.rx,a.cy+Math.sin(t)*a.ry,a.cz);
      dummy.quaternion.setFromUnitVectors(up,dir);
      dummy.scale.set(a.r,a.len*(.8+.3*((i*7)%9)/8),a.r);
      dummy.updateMatrix();inst.setMatrixAt(i,dummy.matrix);
    }
    inst.instanceMatrix.needsUpdate=true;
    mane.add(inst);
  }

  // Distinct lion face: brow, ears, eyes, black nose and huge upper fangs.
  const face=new T.Group();face.name="LION EXPRESSIVE FACE";deco.add(face);
  for(const side of [-1,1]){
    // Ears rise above fur, so they are identifiable in silhouette.
    ball(face,"lion ear outer "+side,[side*.90,4.71,-3.91],[.37,.49,.20],P.maneDark);
    ball(face,"lion ear inner "+side,[side*.90,4.73,-4.08],[.23,.32,.11],P.skull);
    ball(face,"lion brow "+side,[side*.49,4.29,-4.49],[.38,.17,.25],P.maneDark);
    ball(face,"eye dark socket "+side,[side*.48,4.07,-4.67],[.26,.18,.15],P.eyeRim);
    ball(face,"golden eye "+side,[side*.48,4.08,-4.812],[.165,.106,.052],P.eyes);
    ball(face,"vertical cat pupil "+side,[side*.48,4.08,-4.859],[.042,.095,.030],P.pupil);
    ball(face,"lion cheek whisker mound "+side,[side*.36,3.67,-4.78],[.30,.20,.29],P.sand);
    pointed(face,"SABER TOOTH "+side,[side*.46,3.60,-4.82],
      [side*.35,2.78,-4.92],.20,P.bone);
    pointed(face,"smaller fang "+side,[side*.19,3.53,-4.98],
      [side*.17,3.18,-5.02],.078,P.boneShadow);
  }
  ball(face,"broad black cat nose",[0,3.85,-5.035],[.37,.19,.16],P.nose);
  ball(face,"dark open mouth",[0,3.25,-4.79],[.64,.37,.12],P.mouth);

  // Three claws on each moving paw, updated after the anatomical IK.
  const claws=[];
  for(const id of root.userData.skeleton.legOrder){
    const holder=new T.Group();holder.name=id+" THREE BLACK CLAWS";
    deco.add(holder);
    const span=id.startsWith("fore")?.28:.235;
    for(let i=-1;i<=1;i++){
      pointed(holder,id+" claw "+i,[i*span,.01,.07],
        [i*span,-.07,-.40],.13,P.claws);
    }
    claws.push({id,holder});
  }
  // Lower small incisors move with the jaw mesh as it opens.
  const jaw=find("OPEN LOWER LION JAW");
  if(jaw){
    const anchor=new T.Group();anchor.name="LOWER JAW TEETH";
    const scale=jaw.scale;
    anchor.scale.set(1/scale.x,1/scale.y,1/scale.z);
    jaw.add(anchor);
    for(const side of [-1,1]){
      pointed(anchor,"lower fang "+side,[side*.45,.16,-.46],
        [side*.42,.48,-.52],.10,P.bone);
    }
  }

  // All original anatomical meshes keep their geometry and motion.
  // Swap only materials, preserving tail's shared seamlessly skinned shape.
  const colorForName=(name)=>{
    if(name.includes("SNAKE")||name.includes("SERPENT"))return 0x657641;
    if(name.includes("UPPER LION MUZZLE")||name.includes("FACE CHEEKBONE"))
      return 0xa8895d;
    if(name.includes("OPEN LOWER LION JAW"))return 0x6d4b36;
    if(name.includes("JAW HINGE"))return 0x775039;
    if(name.includes("DELTOID"))return 0x6d4934;
    if(name.includes("BRISKET"))return 0x503b30;
    if(name.includes("CHEST SIDE"))return 0x765138;
    if(name.includes("hind")||name.includes("fore"))return 0x624637;
    if(name.includes("LION SKIN"))return 0x634536;
    return 0x67503c;
  };
  const materialCache=new Map();
  for(const m of skin.meshes){
    const color=colorForName(m.name);
    if(!materialCache.has(color))materialCache.set(color,mat(color,{side:T.DoubleSide}));
    m.material=materialCache.get(color);
  }
  // Stable vertex color bands on the *original* 125-ring animated snake tail.
  // The positional deformation in chimera-test-motion.js leaves them intact.
  const tailMesh=skin.tail;
  const attr=tailMesh.geometry.attributes.position;
  const colors=new Float32Array(attr.count*3);
  const stripeDark=new T.Color(0x405936);
  const stripeLight=new T.Color(0x80945b);
  const underside=new T.Color(0xa4a677);
  for(let i=0;i<attr.count;i++){
    const u=Math.floor(i/20)/124,a=(i%20)*Math.PI*2/20;
    // Broad bands with interpolated edges, not 8-ring hard stair steps.
    const band=Math.sin(u*Math.PI*12.4);
    const smoothBand=.5+.5*Math.tanh(band*3.5);
    const clr=stripeDark.clone().lerp(stripeLight,smoothBand);
    const bellyBlend=.26*Math.max(0,Math.sin(a));
    clr.lerp(underside,bellyBlend);
    const k=i*3;
    colors[k]=clr.r;colors[k+1]=clr.g;colors[k+2]=clr.b;
  }
  tailMesh.geometry.setAttribute("color",new T.BufferAttribute(colors,3));
  tailMesh.material=new T.MeshStandardMaterial({
    color:0xffffff,roughness:.93,flatShading:false,
    vertexColors:true,side:T.DoubleSide
  });
  // Snake-head eyes and tongue ride directly with its original animated head.
  const snake=find("RAISED PREDATOR SNAKE HEAD");
  if(snake){
    const headDetail=new T.Group();
    headDetail.name="SNAKE EYES / FANGS / FORKED TONGUE";
    headDetail.scale.set(1/snake.scale.x,1/snake.scale.y,1/snake.scale.z);
    snake.add(headDetail);
    for(const side of [-1,1]){
      ball(headDetail,"snake brow "+side,[side*.44,.27,-.51],
        [.23,.14,.15],P.snakeDark);
      ball(headDetail,"snake eye "+side,[side*.44,.28,-.60],
        [.15,.12,.07],P.snakeEye);
      ball(headDetail,"snake slit pupil "+side,[side*.44,.28,-.673],
        [.035,.10,.025],P.pupil);
      pointed(headDetail,"snake fang "+side,[side*.26,-.19,-.88],
        [side*.20,-.52,-1.04],.095,P.bone);
    }
    ball(headDetail,"snake nostrils",[0,.02,-.88],[.38,.095,.11],P.snakeDark);
    pointed(headDetail,"forked snake tongue core",[0,-.26,-.88],
      [0,-.35,-1.43],.058,P.tongue);
    pointed(headDetail,"fork 1",[0,-.35,-1.38],[-.18,-.30,-1.62],.038,P.tongue);
    pointed(headDetail,"fork 2",[0,-.35,-1.38],[.18,-.30,-1.62],.038,P.tongue);
  }

  let oldRoar=0;
  function update(animation){
    const roar=animation?.roar||0;
    face.position.y=.63*roar;
    mane.position.y=.14*roar;
    mane.rotation.x=-.045*roar;
    hornGroup.position.y=.19*roar;
    for(const {id,holder} of claws){
      const leg=root.userData.skeleton.legs[id],pose=leg?.display;
      if(pose){
        holder.position.set(pose.toe[0],pose.toe[1],
          pose.toe[2]);
      }else if(leg)holder.position.set(...leg.toe);
    }
  }
  update();
  return {update,decor:deco,materialPass:1};
}
