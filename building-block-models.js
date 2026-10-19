// NEXACRAFT building blocks: voxel-face textures, real stepped/half-height
// geometry and compact batched 3D fittings. Existing block IDs remain valid.
export function createBuildingBlockModels(THREE,B){
  const cv=(kind)=>{
    const c=document.createElement('canvas');c.width=32;c.height=32;
    const g=c.getContext('2d');g.imageSmoothingEnabled=false;
    let seed=2166136261;
    for(const ch of kind)seed=(Math.imul(seed^ch.charCodeAt(0),16777619))>>>0;
    function rnd(){seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296}
    function fill(color,x=0,y=0,w=32,h=32){g.fillStyle=color;g.fillRect(x,y,w,h)}
    function lines(color,coords){
      g.strokeStyle=color;g.lineWidth=1;g.beginPath();
      for(const path of coords){g.moveTo(path[0],path[1]);for(let i=2;i<path.length;i+=2)g.lineTo(path[i],path[i+1])}
      g.stroke();
    }
    if(kind.startsWith('brick-')){
      const red=kind==='brick-red',moss=kind==='brick-moss',cracked=kind==='brick-crack';
      fill(red?'#a84b3c':'#85878b');
      for(let y=0;y<32;y+=8){
        fill(red?'#4c3934':'#454b4e',0,y,32,1);
        const shift=(y/8%2)*8;
        for(let x=-shift;x<32;x+=16){
          fill(red?'#c16a51':'#a2a5a8',x+1,y+1,14,6);
          fill(red?'#a34e41':'#777e82',x+2,y+5,11,1);
          fill(red?'#613d35':'#50565b',x+15,y+1,1,7);
          if(rnd()>.4)fill(red?'#d47e62':'#b8babd',x+3,y+2,5,1);
        }
      }
      if(moss)for(let i=0;i<65;i++){const x=Math.floor(rnd()*32),y=Math.floor(rnd()*32);fill(i%3?'#526c48':'#718b53',x,y,2+rnd()*4,1+rnd()*3)}
      if(cracked)lines('#313b40',[[5,1,8,7,6,12,11,17,10,25,14,31],[18,3,15,9,21,14,19,19,23,24]]);
    }else if(kind==='polished'){
      fill('#aeb4ba');
      for(let i=0;i<28;i++){
        const x=Math.floor(rnd()*32),y=Math.floor(rnd()*32);
        fill(i%2?'#9ca4ab':'#c5ccd1',x,y,Math.floor(rnd()*7)+2,1);
      }
      lines('#78848e',[[1,1,30,1],[1,30,30,30],[1,1,1,30],[30,1,30,30]]);
    }else if(kind==='marble'){
      fill('#eae7e2');
      for(let i=0;i<32;i++)fill(i%3?'#eeeae5':'#dcd9d3',Math.floor(rnd()*32),Math.floor(rnd()*32),2+rnd()*7,1);
      lines('#bcb8b3',[[0,11,7,7,12,12,20,6,31,9],[2,29,12,23,18,25,31,17],[16,0,20,6,17,12]]);
      lines('#ffffff',[[0,10,7,6,12,11,20,5,31,8]]);
    }else if(kind==='obsidian'){
      fill('#191725');
      for(let i=0;i<38;i++)fill(i%3?'#322a43':'#443455',rnd()*32,rnd()*32,1+rnd()*3,1+rnd()*6);
      lines('#725d94',[[4,32,12,23,10,15,18,8,21,0],[25,30,22,24,27,18,25,11]]);
      fill('#6c5491',24,3,2,3);
    }else if(kind==='wood'||kind==='wood-top'){
      fill('#ad7945');
      if(kind==='wood'){
        for(let y=0;y<32;y+=8){fill('#754724',0,y,32,2);fill('#d29b5b',0,y+2,32,1);
          fill('#754724',(y/8%2)*14+11,y+2,2,6);
          for(let i=0;i<4;i++)fill(i%2?'#a56e3e':'#c08a4e',rnd()*32,y+3+rnd()*4,5+rnd()*8,1)
        }
      }else{
        fill('#80502d',0,0,32,2);fill('#80502d',0,30,32,2);
        for(let x=0;x<32;x+=10){fill('#734626',x,2,1,28);fill('#c6965a',x+2,2,2,28)}
      }
    }else if(kind==='fence'||kind==='wood-dark'){
      fill('#77502f');for(let x=1;x<32;x+=9){fill('#ad7744',x,0,2,32);fill('#5d3b23',x+7,0,1,32)}
      for(let y=0;y<32;y+=11)fill('#c38c53',0,y,32,1);
    }else if(kind==='iron'){
      fill('#828c97');for(let x=0;x<32;x+=8){fill('#aebbc4',x+1,0,2,32);fill('#56616a',x+7,0,1,32)}
      for(let y=0;y<32;y+=11)fill('#49565e',0,y,32,1);
    }else if(kind==='books'){
      fill('#5b371f');fill('#b28755',0,0,32,3);fill('#b28755',0,29,32,3);
      for(let shelf=0;shelf<2;shelf++){
        const y=3+shelf*13;
        for(let x=1;x<31;){
          const w=2+Math.floor(rnd()*4),col=['#a63c36','#354b91','#438165','#b27a2d','#764b88','#dbc59a'][Math.floor(rnd()*6)];
          fill(col,x,y,w,10);fill('#e6c487',x+1,y+2,1,2);fill('#26352d',x,y+9,w,1);
          x+=w+1;
        }
        fill('#d3a36b',0,y+10,32,2);
      }
    }else if(kind==='books-side'){
      fill('#9a6a3b');for(let y=0;y<32;y+=8){fill('#774523',0,y,32,2);fill('#bd8850',0,y+2,32,1)}
    }else if(kind==='barrel'){
      fill('#82562f');
      for(let x=0;x<32;x+=7){fill('#a97b47',x+1,0,2,32);fill('#654224',x+6,0,1,32)}
      for(let y of [5,25]){fill('#484a49',0,y,32,3);fill('#8a9193',0,y,32,1)}
    }else if(kind==='barrel-top'){
      fill('#624021');fill('#a67b48',3,3,26,26);
      for(let x=4;x<30;x+=7){fill('#694522',x,3,2,26);fill('#c29257',x+2,3,2,26)}
      fill('#4a4c4b',0,0,32,3);fill('#4a4c4b',0,29,32,3);
    }else if(kind==='tnt'){
      fill('#be2f2a');for(let i=0;i<35;i++)fill(i%2?'#e54836':'#862621',rnd()*32,rnd()*32,3+rnd()*5,2);
      fill('#f2e7d6',0,11,32,10);fill('#c8bfae',0,20,32,1);
      // A distinct three-column explosive hazard silhouette (not a letter glyph).
      for(let i=0;i<3;i++){const x=4+i*9;fill('#433b32',x,13,5,1);fill('#433b32',x+2,13,1,6)}
    }else if(kind==='tnt-top'){
      fill('#a52523');fill('#dc3f36',3,3,26,26);
      for(let i=0;i<4;i++){fill('#6a2925',5+i*6,7,2,18)}
      fill('#efe7bb',14,13,4,6);fill('#494e43',15,8,2,5);
    }else{
      fill('#888888');
    }
    const t=new THREE.CanvasTexture(c);t.magFilter=THREE.NearestFilter;
    t.minFilter=THREE.NearestFilter;t.colorSpace=THREE.SRGBColorSpace;
    return t;
  };
  const textured={};
  for(const kind of ['brick-stone','brick-moss','brick-crack','brick-red','polished','marble','obsidian','wood','wood-top','fence','wood-dark','iron','books','books-side','barrel','barrel-top','tnt','tnt-top'])
    textured[kind]=new THREE.MeshLambertMaterial({map:cv(kind)});
  const flat={
    dark:new THREE.MeshLambertMaterial({color:0x333d43}),
    trim:new THREE.MeshLambertMaterial({color:0x5c666a}),
    lanternFrame:new THREE.MeshLambertMaterial({color:0x3b4445}),
    lanternGlow:new THREE.MeshBasicMaterial({color:0xffdf74,toneMapped:false}),
    lanternFlame:new THREE.MeshBasicMaterial({color:0xffa02f,toneMapped:false}),
    fire:new THREE.MeshBasicMaterial({color:0xff8e20,toneMapped:false}),
    fireHot:new THREE.MeshBasicMaterial({color:0xffe45d,toneMapped:false}),
    ember:new THREE.MeshBasicMaterial({color:0xf04b21,toneMapped:false}),
    charcoal:new THREE.MeshLambertMaterial({color:0x392f2a})
  };
  const mats={...textured,...flat};
  const cube=new THREE.BoxGeometry(1,1,1);
  const cylinder=new THREE.CylinderGeometry(1,1,1,8,1);
  const cone=new THREE.ConeGeometry(.5,1,4,1);cone.rotateY(Math.PI/4);
  const meshG={cube,cylinder,cone};
  const m={
    [B.STONE_BRICKS]:textured['brick-stone'],
    [B.MOSSY_STONE_BRICKS]:textured['brick-moss'],
    [B.CRACKED_STONE_BRICKS]:textured['brick-crack'],
    [B.POLISHED_STONE]:textured.polished,
    [B.MARBLE]:textured.marble,
    [B.OBSIDIAN]:textured.obsidian,
    [B.RED_BRICKS]:textured['brick-red'],
    [B.WOOD_STAIRS]:textured.wood,[B.STONE_STAIRS]:textured['brick-stone'],
    [B.WOOD_SLAB]:textured.wood,[B.WOOD_SLAB_TOP]:textured.wood,
    [B.IRON_BARS]:textured.iron,[B.WOOD_FENCE]:textured.fence,
    [B.FENCE_GATE]:textured.fence,[B.LADDER]:textured.wood,
    [B.TRAPDOOR]:textured.fence,[B.LANTERN]:flat.lanternFrame,
    [B.BOOKSHELF]:[textured['books-side'],textured['books-side'],textured.wood,textured.wood,textured.books,textured.books],
    [B.BARREL]:[textured.barrel,textured.barrel,textured['barrel-top'],textured['barrel-top'],textured.barrel,textured.barrel],
    [B.TNT]:[textured.tnt,textured.tnt,textured['tnt-top'],textured.tnt,textured.tnt,textured.tnt],
    [B.CAMPFIRE]:flat.charcoal,
    [B.SLEEPING_BAG_WORLD]:textured.fence
  };
  const variants=new Map();
  // base ids: 44/45/49/50/51 are the default north-facing blocks.
  for(const [base,ids,open] of [
    [B.WOOD_STAIRS,[B.WOOD_STAIRS,B.WOOD_STAIRS_E,B.WOOD_STAIRS_S,B.WOOD_STAIRS_W],false],
    [B.STONE_STAIRS,[B.STONE_STAIRS,B.STONE_STAIRS_E,B.STONE_STAIRS_S,B.STONE_STAIRS_W],false],
    [B.FENCE_GATE,[B.FENCE_GATE,B.FENCE_GATE_E,B.FENCE_GATE_S,B.FENCE_GATE_W],false],
    [B.FENCE_GATE,[B.FENCE_GATE_OPEN_N,B.FENCE_GATE_OPEN_E,B.FENCE_GATE_OPEN_S,B.FENCE_GATE_OPEN_W],true],
    [B.LADDER,[B.LADDER,B.LADDER_E,B.LADDER_S,B.LADDER_W],false],
    [B.TRAPDOOR,[B.TRAPDOOR_OPEN_N,B.TRAPDOOR_OPEN_E,B.TRAPDOOR_OPEN_S,B.TRAPDOOR_OPEN_W],true]
  ])ids.forEach((id,dir)=>{variants.set(id,{base,dir,open});m[id]=m[base]});
  variants.set(B.WOOD_SLAB_TOP,{base:B.WOOD_SLAB,dir:0,open:false});
  const custom=new Set([
    B.WOOD_STAIRS,B.STONE_STAIRS,B.WOOD_SLAB,B.WOOD_SLAB_TOP,B.IRON_BARS,
    B.WOOD_FENCE,B.FENCE_GATE,B.LADDER,B.TRAPDOOR,
    B.LANTERN,B.BARREL,B.CAMPFIRE,B.SLEEPING_BAG_WORLD,...variants.keys()
  ]);
  const gateIds=[B.FENCE_GATE,B.FENCE_GATE_E,B.FENCE_GATE_S,B.FENCE_GATE_W];
  const openGateIds=[B.FENCE_GATE_OPEN_N,B.FENCE_GATE_OPEN_E,B.FENCE_GATE_OPEN_S,B.FENCE_GATE_OPEN_W];
  const openTrapIds=[B.TRAPDOOR_OPEN_N,B.TRAPDOOR_OPEN_E,B.TRAPDOOR_OPEN_S,B.TRAPDOOR_OPEN_W];
  const canonical=id=>variants.get(id)?.base??id;
  const dir=id=>variants.get(id)?.dir??0;
  const opened=id=>!!variants.get(id)?.open;
  const rotateDir=(x,z,d)=>{
    const a=-d*Math.PI/2,cs=Math.cos(a),sn=Math.sin(a);
    return [x*cs+z*sn,-x*sn+z*cs];
  };
  // Each rectangle is [minX,maxX,minY,maxY,minZ,maxZ], centered on the voxel.
  // They are used for real player collision (a slab is not a 1-block cube).
  function collisionBoxes(id){
    const type=canonical(id),d=dir(id);
    if(id===B.WOOD_SLAB)return [[-.5,.5,-.5,0,-.5,.5]];
    if(id===B.WOOD_SLAB_TOP)return [[-.5,.5,0,.5,-.5,.5]];
    if(type===B.WOOD_STAIRS||type===B.STONE_STAIRS){
      const [x,z]=rotateDir(0,-.25,d);
      const upper=Math.abs(x)>.20
        ?[x>0?0:-.5,x>0?.5:0,0,.5,-.5,.5]
        :[-.5,.5,0,.5,z>0?0:-.5,z>0?.5:0];
      return [[-.5,.5,-.5,0,-.5,.5],upper];
    }
    if(type===B.IRON_BARS)return [[-.12,.12,-.5,.5,-.5,.5],[-.5,.5,-.5,.5,-.12,.12]];
    if(type===B.WOOD_FENCE)return [[-.19,.19,-.5,.5,-.19,.19],[-.50,.50,-.12,.32,-.07,.07],[-.07,.07,-.12,.32,-.50,.50]];
    if(type===B.FENCE_GATE){
      if(opened(id))return [];
      return d%2===0?[[-.50,.50,-.5,.5,-.10,.10]]:[[-.10,.10,-.5,.5,-.50,.50]];
    }
    if(type===B.LADDER||type===B.LANTERN||type===B.CAMPFIRE||type===B.SLEEPING_BAG_WORLD)return [];
    if(type===B.TRAPDOOR){
      if(!opened(id))return [[-.5,.5,-.5,-.37,-.5,.5]];
      const [x,z]=rotateDir(0,-.43,d);
      return Math.abs(x)>.3?
        [[x>0?.37:-.5,x>0?.5:-.37,-.5,.5,-.5,.5]]:
        [[-.5,.5,-.5,.5,z>0?.37:-.5,z>0?.5:-.37]];
    }
    if(type===B.BARREL)return [[-.43,.43,-.5,.5,-.43,.43]];
    return null;
  }
  function boxesFor(type,d,open,pt,read){
    const parts=[];
    function add(mat,x,y,z,sx,sy,sz,shape='cube',angle=0){
      parts.push({mat,x,y,z,sx,sy,sz,shape,angle});
    }
    const wood='wood',stone='brick-stone';
    if(type===B.WOOD_STAIRS||type===B.STONE_STAIRS){
      const mat=type===B.WOOD_STAIRS?wood:stone;
      // Actual half-height leading tread, full-height trailing riser.
      add(mat,0,-.25,0,1,.5,1);
      add(mat,0,.25,-.25,1,.5,.5);
    }else if(type===B.WOOD_SLAB||type===B.WOOD_SLAB_TOP){
      const upper=type===B.WOOD_SLAB_TOP,cy=upper?.25:-.25;
      add(wood,0,cy,0,1,.50,1);
      // Narrow darker rim makes the real half-block silhouette obvious.
      add('wood-dark',0,cy+.235,.47,1,.03,.045);
      add('wood-dark',0,cy+.235,-.47,1,.03,.045);
    }else if(type===B.IRON_BARS){
      // Open lattice, unmistakably thinner than a stone wall.
      for(const x of [-.42,-.14,.14,.42])add('iron',x,0,0,.09,1,.10);
      for(const z of [-.42,.42])add('iron',0,0,z,1,.10,.09);
      for(const y of [-.31,.30])add('iron',0,y,0,1,.075,.13);
      add('trim',0,0,0,.11,1,.11);
    }else if(type===B.WOOD_FENCE){
      add('fence',0,-.01,0,.22,.99,.22);
      add('wood-top',0,.46,0,.28,.10,.28);
      // Join neighboring fence/gate or solid building with two slim beams.
      const neighbors=[[1,0],[-1,0],[0,1],[0,-1]];
      for(const [dx,dz] of neighbors){
        const n=read(pt.x+dx,pt.y,pt.z+dz);
        if(n===B.AIR||n===B.WATER||n===B.LADDER||n===B.LANTERN||n===B.CAMPFIRE)continue;
        const x=dx*.31,z=dz*.31;
        for(const y of [-.13,.18])add('fence',x,y,z,dx? .63:.095,.105,dz? .63:.095);
      }
    }else if(type===B.FENCE_GATE){
      add('fence',-.43,0,0,.13,1,.22);
      add('fence',.43,0,0,.13,1,.22);
      for(const x of [-.43,.43])add('wood-top',x,.48,0,.19,.075,.25);
      if(open){
        // Hinged leaf folded 90 degrees against the left side.
        add('wood-dark',-.43,-.09,-.24,.10,.19,.49);
        add('wood-dark',-.43,.23,-.24,.10,.17,.49);
        add('fence',-.43,.04,-.46,.10,.65,.10);
      }else{
        for(const y of [-.13,.22])add('wood-dark',0,y,0,.83,.16,.12);
        add('wood-top',0,.04,0,.065,.35,.16);
        add('iron',.10,.14,.092,.09,.085,.04);
      }
    }else if(type===B.LADDER){
      for(const x of [-.33,.33])add('wood-dark',x,0,-.425,.10,.97,.115);
      for(let y=-.35;y<=.36;y+=.23)add('wood',0,y,-.37,.72,.085,.14);
    }else if(type===B.TRAPDOOR){
      if(open){
        add('wood-dark',0,0,-.43,.90,.96,.115);
        add('wood',0,0,-.36,.75,.81,.04);
        for(const y of [-.39,.39])add('wood-dark',0,y,-.30,.82,.07,.045);
        for(const x of [-.30,.30])add('iron',x,0,-.315,.04,.78,.035);
      }else{
        add('wood-dark',0,-.43,0,.98,.13,.98);
        add('wood',0,-.34,0,.86,.065,.86);
        for(const x of [-.3,.30])add('iron',x,-.29,0,.038,.045,.69);
        for(const z of [-.30,.30])add('wood-dark',0,-.28,z,.79,.042,.052);
        add('iron',0,-.275,-.36,.20,.047,.085);
      }
    }else if(type===B.LANTERN){
      add('lanternFrame',0,-.43,0,.40,.13,.40);
      add('lanternGlow',0,-.17,0,.32,.39,.32);
      add('lanternFlame',0,-.17,.165,.15,.29,.03);
      for(const x of [-.19,.19])for(const z of [-.19,.19])
        add('lanternFrame',x,-.13,z,.055,.49,.055);
      add('lanternFrame',0,.14,0,.47,.11,.47);
      add('lanternFrame',0,.28,0,.15,.19,.16);
      add('trim',0,.36,0,.29,.07,.29);
    }else if(type===B.BARREL){
      add('barrel',0,-.02,0,.41,.78,.41,'cylinder');
      add('barrel-top',0,.39,0,.40,.075,.40,'cylinder');
      add('iron',0,-.34,0,.43,.095,.43,'cylinder');
      add('iron',0,.29,0,.43,.095,.43,'cylinder');
      add('wood',0,-.39,0,.38,.07,.38,'cylinder');
      add('trim',0,.43,0,.08,.034,.12);
    }else if(type===B.SLEEPING_BAG_WORLD){
      // A laid-out, low bedroll, not a full voxel. It can be walked across.
      add('wood-dark',0,-.475,0,.83,.05,.96);
      add('fence',0,-.395,.09,.73,.11,.73);
      add('wood-top',0,-.352,-.33,.71,.18,.24);
      add('trim',0,-.43,.42,.83,.04,.08);
      for(const x of [-.34,.34])add('wood-dark',x,-.405,.06,.045,.12,.78);
    }else if(type===B.CAMPFIRE){
      add('charcoal',0,-.43,0,.88,.08,.88);
      for(const x of [-.20,.20]){
        add('wood-dark',x,-.32,0,.22,.17,.92);
        add('wood',0,-.21,x,.92,.16,.21);
      }
      for(const [x,z] of [[0,0],[-.14,.1],[.14,-.06]]){
        add('fire',x,-.08,z,.24,.40,.24,'cone');
        add('fireHot',x,.03,z,.13,.27,.13,'cone');
      }
      for(const x of [-.29,.29])add('ember',x,-.22,.31,.12,.06,.08);
    }
    return parts;
  }
  function build(id,points,scene,meshes,lookup,built,read){
    if(!points.length)return;
    const type=id===B.WOOD_SLAB_TOP?B.WOOD_SLAB_TOP:canonical(id),d=dir(id),openedState=opened(id);
    const angle=-d*Math.PI/2,buckets=new Map();
    function bucket(part,anchor){
      const key=part.shape+':'+part.mat;
      if(!buckets.has(key))buckets.set(key,{geo:meshG[part.shape],mat:mats[part.mat],rows:[],anchors:[]});
      const group=buckets.get(key);
      group.rows.push({part,anchor});group.anchors.push(anchor);
    }
    for(const p of points)
      for(const part of boxesFor(type,d,openedState,p,read))bucket(part,p);
    const dummy=new THREE.Object3D();
    for(const group of buckets.values()){
      const inst=new THREE.InstancedMesh(group.geo,group.mat,group.rows.length);
      inst.userData.id=id;inst.castShadow=false;inst.receiveShadow=true;inst.frustumCulled=false;
      group.rows.forEach(({part,anchor},i)=>{
        const [x,z]=rotateDir(part.x,part.z,d);
        dummy.position.set(anchor.x+x,anchor.y+part.y,anchor.z+z);
        dummy.rotation.set(0,angle+part.angle,0);
        dummy.scale.set(part.sx,part.sy,part.sz);
        dummy.updateMatrix();inst.setMatrixAt(i,dummy.matrix);
      });
      inst.instanceMatrix.needsUpdate=true;
      scene.add(inst);meshes.push(inst);lookup.set(inst.uuid,group.anchors);built.push(inst);
    }
  }
  const interact=id=>canonical(id)===B.FENCE_GATE||canonical(id)===B.TRAPDOOR;
  function toggle(id){
    const type=canonical(id),direction=dir(id);
    if(type===B.FENCE_GATE)return opened(id)?gateIds[direction]:openGateIds[direction];
    if(type===B.TRAPDOOR)return opened(id)?B.TRAPDOOR:openTrapIds[direction];
    return id;
  }
  function placedVariant(id,direction){
    const d=((direction%4)+4)%4;
    if(id===B.WOOD_STAIRS)return [B.WOOD_STAIRS,B.WOOD_STAIRS_E,B.WOOD_STAIRS_S,B.WOOD_STAIRS_W][d];
    if(id===B.STONE_STAIRS)return [B.STONE_STAIRS,B.STONE_STAIRS_E,B.STONE_STAIRS_S,B.STONE_STAIRS_W][d];
    if(id===B.FENCE_GATE)return gateIds[d];
    if(id===B.LADDER)return [B.LADDER,B.LADDER_E,B.LADDER_S,B.LADDER_W][d];
    return id;
  }
  return {materials:m,custom,canonical,collisionBoxes,interact,toggle,placedVariant,build,opened};
}
