// NEXACRAFT — craftable Overworld Boss Arena.
// One permanent arena-core voxel owns this render-only gothic set dressing.
// Real collision comes from its 13x13 stone/obsidian voxel battle floor.
// Instanced meshes: mobile-friendly, save/load uses normal world block edits.
export function createBossArenaModel(THREE){
  const cube=new THREE.BoxGeometry(1,1,1);
  const oct=new THREE.OctahedronGeometry(1,0);
  const spire=new THREE.ConeGeometry(.5,1,4,1);
  spire.rotateY(Math.PI/4);
  const mat={
    black:new THREE.MeshStandardMaterial({color:0x0a1116,roughness:.94,metalness:.16}),
    dark:new THREE.MeshStandardMaterial({color:0x1d282e,roughness:.90,metalness:.14}),
    stone:new THREE.MeshStandardMaterial({color:0x2d3b43,roughness:.80,metalness:.16}),
    rim:new THREE.MeshStandardMaterial({color:0x515f66,roughness:.58,metalness:.44}),
    metal:new THREE.MeshStandardMaterial({color:0x283c42,roughness:.44,metalness:.64}),
    cyan:new THREE.MeshBasicMaterial({color:0x27cfba,toneMapped:false}),
    bright:new THREE.MeshBasicMaterial({color:0x9affed,toneMapped:false})
  };
  const shapes={cube,oct,spire};
  const specs=[];
  const put=(material,x,y,z,sx,sy,sz,rot=0,shape='cube',altar=false)=>{
    specs.push({material,x,y,z,sx,sy,sz,rot,shape,altar});
  };
  // Floor-etched circuit and concentric combat runes.
  // Anchor voxel occupies the altar centre at y=0; floor TOP is y=-.50.
  for(let d=-6;d<=6;d++){
    put('metal',d,-.478,-5.45,.94,.023,.12);
    put('cyan',d,-.456,-5.45,.19,.020,.034);
    if(Math.abs(d)>1){
      put('metal',d,-.478,5.43,.91,.023,.13);
      put('cyan',d,-.454,5.43,.20,.023,.038);
    }
  }
  for(const s of [-1,1]){
    for(const a of [3.2,5.35]){
      put('metal',s*a,-.47,0,.12,.030,11.1);
      put('cyan',s*a,-.442,0,.044,.019,10.9);
    }
    put('metal',s*5.45,-.45,0,.27,.13,12.7);
    put('stone',s*5.72,-.29,0,.62,.27,12.85);
    // Paired stepped entrance pylons.
    for(const x of [s*4.8,s*2.95]){
      put('black',x,-.21,5.0,1.6,.57,1.55);
      put('stone',x,.11,5.0,1.18,.15,1.19);
      put('dark',x,.29,5.0,.70,.36,.70);
      put('cyan',x,.47,5.38,.34,.38,.055);
      put('bright',x,.47,5.44,.18,.29,.062,0,'oct');
    }
  }
  // Ascending steps and embedded energy lane up to the dais.
  for(let j=0;j<4;j++){
    put('stone',0,-.37+j*.045,5.9-j*.66,2.9-j*.31,.11,.53);
    put('metal',0,-.298+j*.045,5.9-j*.66,1.9-j*.26,.026,.057);
    put('cyan',0,-.278+j*.045,5.9-j*.66,.045,.022,.31);
  }
  // Immense portal foundation rising at the FAR SIDE of the ring.
  for(const s of [-1,1]){
    put('black',s*2.9,-.17,-3.78,2.35,.74,2.26);
    put('stone',s*2.9,.26,-3.78,2.10,.20,1.97);
    put('rim',s*2.9,.46,-3.78,1.75,.13,1.58);
    // Heroic dark stone pylons and vertical glowing inset channels.
    put('black',s*2.22,2.75,-4.36,1.19,5.15,1.23);
    put('stone',s*2.25,2.72,-3.67,1.05,4.77,.48);
    put('rim',s*1.83,2.66,-3.36,.17,4.58,.13);
    put('cyan',s*1.70,2.75,-3.28,.085,4.25,.035);
    put('dark',s*1.98,5.47,-4.34,1.01,1.43,.83,-s*.16);
    put('stone',s*1.88,6.22,-4.32,.86,1.49,.73,-s*.21,'spire');
    put('black',s*1.38,7.22,-4.36,.83,1.92,.82,-s*.15);
    put('rim',s*1.35,7.69,-3.91,.25,.85,.18,-s*.19);
    put('black',s*1.17,8.55,-4.35,.70,1.60,.71,-s*.11,'spire');
    // The huge SIDE WINGS are built from radial stepped stone segments.
    for(let i=0;i<9;i++){
      const t=i/8,angle=(.13+t*1.11);
      const x=s*(3.10+Math.sin(angle)*2.25);
      const y=1.02+t*4.18;
      const z=-4.50+(1-t)*.48;
      put('dark',x,y,z,.77,.94,.95,s*(.15+t*.63));
      put('stone',x+s*.18,y+.22,z+.26,.69,.46,.68,s*(.15+t*.63));
      put('rim',x-s*.32,y+.10,z+.30,.16,.69,.14,s*(.15+t*.63));
      put('cyan',x-s*.43,y+.07,z+.40,.067,.73,.043,s*(.15+t*.63));
    }
    // Suspended rock shards with glowing seams; static, no draw updates.
    for(let k=0;k<10;k++){
      const ang=(k*2.39996+s*.50),rad=3.7+(k%4)*.65;
      const x=s*(4.1+Math.cos(ang)*rad*.38);
      const y=3.2+(k%5)*.87;
      const z=-3.9+Math.sin(ang)*1.65;
      put('black',x,y,z,.27+(k%3)*.18,.31+(k%4)*.16,.35,s*(k*.31),'oct');
      put('cyan',x,y-.11,z+.21,.18,.038,.045,s*(k*.31));
    }
  }
  // Central double-spired tower, cyan spine and four-way celestial star.
  put('black',0,2.67,-4.72,1.21,5.68,1.16);
  put('stone',0,3.15,-4.01,.66,5.65,.40);
  put('black',0,6.78,-4.72,.95,2.36,.86);
  put('dark',0,8.25,-4.74,.64,1.38,.68,0,'spire');
  put('rim',0,5.83,-3.73,1.03,.25,.30);
  put('rim',0,4.43,-3.73,1.03,.24,.30);
  put('cyan',0,4.75,-3.55,.10,6.20,.055);
  put('bright',0,3.30,-3.46,.09,3.32,.080);
  // Celestial star at focal point; layering reads well from several angles.
  put('black',0,3.54,-2.94,2.45,2.45,.39,Math.PI/4);
  put('metal',0,3.54,-2.69,1.90,1.90,.18,Math.PI/4);
  put('cyan',0,3.54,-2.52,2.02,.15,.14);
  put('cyan',0,3.54,-2.51,.15,2.02,.15);
  put('bright',0,3.54,-2.38,.72,.72,.25,Math.PI/4);
  put('bright',0,3.54,-2.20,.22,.22,.23,0,'oct');
  for(let n=0;n<12;n++){
    const theta=n*Math.PI/6;
    put(n%2?'cyan':'bright',Math.cos(theta)*1.43,
      3.54+Math.sin(theta)*1.43,-2.51,
      .10,.16,.12,n*.27,'oct');
  }
  // Short low altar in the middle of the circular battle ring.
  // Only these central dais meshes may open the boss-altar interface.
  // Outer wings, portal, steps and glowing scenery must not trigger it.
  put('black',0,-.24,0,1.50,.52,1.50,0,'cube',true);
  put('stone',0,.02,0,1.22,.15,1.22,0,'cube',true);
  put('metal',0,.18,0,.95,.20,.95,0,'cube',true);
  put('cyan',0,.31,0,.63,.08,.63,0,'cube',true);
  put('bright',0,.52,0,.42,.41,.42,0,'oct',true);

  const byGroup=new Map();
  for(const p of specs){
    const key=p.material+'/'+p.shape+'/'+(p.altar?'altar':'scenery');
    if(!byGroup.has(key))byGroup.set(key,{material:mat[p.material],geometry:shapes[p.shape],parts:[],altar:p.altar});
    byGroup.get(key).parts.push(p);
  }
  const dummy=new THREE.Object3D();
  function build(anchors,scene,meshes,lookup,built,id){
    if(!anchors.length)return;
    for(const {material,geometry,parts,altar} of byGroup.values()){
      const mesh=new THREE.InstancedMesh(geometry,material,anchors.length*parts.length);
      mesh.userData.id=id;
      mesh.userData.bossArenaAltar=!!altar;mesh.castShadow=false;mesh.receiveShadow=true;
      mesh.frustumCulled=false;
      const hitCells=[];
      let i=0;
      for(const anchor of anchors)for(const p of parts){
        dummy.position.set(anchor.x+p.x,anchor.y+p.y,anchor.z+p.z);
        dummy.rotation.set(0,0,p.rot);
        dummy.scale.set(p.sx,p.sy,p.sz);
        dummy.updateMatrix();
        mesh.setMatrixAt(i++,dummy.matrix);
        hitCells.push(anchor);
      }
      mesh.instanceMatrix.needsUpdate=true;
      scene.add(mesh);meshes.push(mesh);built.push(mesh);
      lookup.set(mesh.uuid,hitCells);
    }
  }
  return {build,partCount:specs.length,drawCalls:byGroup.size};
}
