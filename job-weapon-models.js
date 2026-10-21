import {makeReferenceWeapon} from './reference-weapon-models.js?v=20261022warAxeRef4View9';
/* Genuine rotatable 3D geometry for NEXACRAFT class weapons.
 * Models consist of extruded bevelled polygon meshes, cylinders, ring meshes,
 * crystals, and fittings; they are NOT 2D billboards or image planes.
 */

// SHIELD LINEAGE: all three classes now belong to the same equipment family
// as the reference-matched Heavy Soldier tower shield. Use THE SAME actual
// 3D shield mesh as a structural source and forge rank-specific armour above
// it. Never branch back into unrelated hexagonal/paladin/spiked designs.
function makeShieldFamilyWeapon(T,d){
  if(!['shield','shieldElite','tank'].includes(d.key))return null;
  // The Heavy Soldier shield establishes this family's materials and
  // turquoise rune language, NOT its exact silhouette/mesh geometry.
  // Each tier has exactly ONE structural body, not a cloned Heavy shield.
  const starter=d.key==='shield',elite=d.key==='shieldElite',tank=d.key==='tank';
  const group=new T.Group();
  const m={
    bronze:new T.MeshStandardMaterial({color:0x94734f,metalness:.82,roughness:.35,side:T.DoubleSide}),
    brass:new T.MeshStandardMaterial({color:0xc4a379,metalness:.84,roughness:.29,side:T.DoubleSide}),
    steel:new T.MeshStandardMaterial({color:0xabbcc3,metalness:.84,roughness:.31,side:T.DoubleSide}),
    bright:new T.MeshStandardMaterial({color:0xd8e3e5,metalness:.89,roughness:.26,side:T.DoubleSide}),
    iron:new T.MeshStandardMaterial({color:0x63717a,metalness:.81,roughness:.37,side:T.DoubleSide}),
    dark:new T.MeshStandardMaterial({color:0x29343b,metalness:.67,roughness:.43,side:T.DoubleSide}),
    recess:new T.MeshStandardMaterial({color:0x17252e,metalness:.45,roughness:.49,side:T.DoubleSide}),
    leather:new T.MeshStandardMaterial({color:0x45352c,roughness:.88,side:T.DoubleSide}),
    strap:new T.MeshStandardMaterial({color:0x74533a,roughness:.82,side:T.DoubleSide}),
    rune:new T.MeshStandardMaterial({color:0x48e5d1,metalness:.24,roughness:.2,
      emissive:0x38c9b6,emissiveIntensity:.58,side:T.DoubleSide})
  };
  const mesh=(geom,mat,x=0,y=0,z=0)=>{
    const item=new T.Mesh(geom,m[mat]);item.position.set(x,y,z);
    item.castShadow=true;item.receiveShadow=true;group.add(item);return item;
  };
  const plate=(pts,thickness,mat,z,bevel=.007)=>{
    const shape=new T.Shape();
    shape.moveTo(pts[0][0],pts[0][1]);
    for(let i=1;i<pts.length;i++)shape.lineTo(pts[i][0],pts[i][1]);
    shape.closePath();
    return mesh(new T.ExtrudeGeometry(shape,{depth:thickness,steps:1,
      bevelEnabled:bevel>0,bevelThickness:bevel,bevelSize:bevel,bevelSegments:2}),
      mat,0,0,z-thickness/2);
  };
  const mirror=(pts,sign)=>pts.map(([x,y])=>[sign*x,y]);
  const rod=(a,b,r,mat)=>{
    const p=new T.Vector3(...a),q=new T.Vector3(...b),delta=q.clone().sub(p);
    const item=mesh(new T.CylinderGeometry(r,r,delta.length(),9),mat,
      (p.x+q.x)/2,(p.y+q.y)/2,(p.z+q.z)/2);
    item.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),delta.normalize());
    return item;
  };
  const gem=(x,y,z,rx,ry,rz)=>{
    const item=mesh(new T.OctahedronGeometry(1), 'rune',x,y,z);
    item.scale.set(rx,ry,rz);return item;
  };
  const diamond=(x,y,z,w,h,mat='brass',th=.025)=>plate([
    [x,y+h],[x+w,y],[x,y-h],[x-w,y]],th,mat,z,.002);
  const rivet=(x,y,z)=>mesh(new T.SphereGeometry(.023,8,6),'brass',x,y,z);
  const inlay=(pts,z,r=.011)=>{for(let i=1;i<pts.length;i++){
    rod([pts[i-1][0],pts[i-1][1],z],
        [pts[i][0],pts[i][1],z],r,'rune');
  }};
  const rearGrip=(y,half,z)=>{
    // A single physical grip bar, rather than a second shield body.
    for(const s of [-1,1]){
      const x=s*half;
      mesh(new T.BoxGeometry(.112,.18,.095),'bronze',x,y,z+.09);
      rivet(x,y+.050,z-.005);rivet(x,y-.050,z-.005);
    }
    rod([-half,y,z],[half,y,z],.060,'leather');
    for(let i=0;i<9;i++){
      const x=-half+.045+i*(half*2-.09)/9;
      rod([x,y-.041,z-.049],[x+.035,y+.041,z-.049],.007,'strap');
    }
  };
  if(starter){
    // LV1: one *small* and light iron kite, not a miniature full-body Heavy.
    // Single dark metal face, restrained bronze edge, small rune and grip.
    const outline=[[-.38,.62],[-.52,.39],[-.51,-.16],
      [-.34,-.55],[0,-.78],[.34,-.55],[.51,-.16],
      [.52,.39],[.38,.62],[0,.66]];
    plate(outline,.18,'bronze',0,.018);
    plate(outline.map(([x,y])=>[x*.90,y*.92]),.18,'dark',.007,.011);
    // Just two broad shallow facets, modest enough for the starting job.
    for(const s of [-1,1]){
      plate(mirror([[.10,.40],[.34,.48],[.42,.30],[.39,-.22],
        [.25,-.49],[.09,-.52]],s),.045,'iron',.127,.009);
      plate(mirror([[.15,.34],[.28,.39],[.34,.20],
        [.31,-.16],[.22,-.37]],s),.018,'steel',.161,.003);
      for(const y of [.30,-.18])rivet(s*.438,y,.122);
    }
    plate([[-.065,.46],[0,.58],[.065,.46],
      [.075,-.51],[0,-.65],[-.075,-.51]],
      .046,'bronze',.153,.006);
    // Small centered gem; no towering cathedral crest or multiple lights.
    diamond(0,.09,.186,.100,.145,'dark',.026);
    gem(0,.09,.216,.069,.10,.031);
    rearGrip(-.055,.26,-.180);
    group.userData.shieldStyle='Light shield: plain bronze/iron kite, single crystal';
  }else if(elite){
    // LV30: medium, elongated angular knight shield; a clear advancement
    // from starter but visibly smaller/simpler than Heavy Soldier's tower.
    const outline=[[-.40,.90],[-.62,.65],[-.68,.15],
      [-.54,-.45],[-.30,-.92],[0,-1.10],
      [.30,-.92],[.54,-.45],[.68,.15],[.62,.65],
      [.40,.90],[0,1.02]];
    plate(outline,.27,'bronze',0,.021);
    plate(outline.map(([x,y])=>[x*.93,y*.94]),.27,'dark',.005,.016);
    plate(outline.map(([x,y])=>[x*.865,y*.89]),.270,'iron',.025,.012);
    for(const s of [-1,1]){
      // Two staggered silver-forged plates on each side (not a second shield).
      plate(mirror([[.15,.65],[.38,.76],[.56,.53],[.51,-.17],
        [.35,-.51],[.14,-.44]],s),.075,'dark',.188,.010);
      plate(mirror([[.19,.61],[.37,.69],[.49,.49],
        [.45,-.13],[.34,-.40],[.18,-.36]],s),
        .065,'steel',.237,.007);
      plate(mirror([[.17,-.44],[.33,-.40],[.48,-.58],
        [.31,-.89],[.12,-.95]],s),.070,'dark',.202,.009);
      plate(mirror([[.21,-.50],[.33,-.48],[.41,-.59],
        [.28,-.78],[.17,-.82]],s),.050,'bright',.245,.006);
      // Angular raised shoulder wings integrated into the same hull.
      plate(mirror([[.30,.72],[.55,.88],[.63,.69],
        [.54,.51],[.35,.55]],s),.063,'brass',.225,.010);
      rivet(s*.55,.46,.274);rivet(s*.45,-.58,.277);
    }
    plate([[-.13,.82],[0,1.08],[.13,.82],
      [.115,-.91],[0,-1.04],[-.115,-.91]],
      .073,'bronze',.260,.007);
    plate([[-.081,.67],[0,.88],[.081,.67],
      [.077,-.83],[0,-.92],[-.077,-.83]],
      .048,'recess',.313,.006);
    inlay([[0,.63],[0,.21],[0,-.20],[0,-.72]],.354,.013);
    diamond(0,.14,.365,.115,.172,'brass',.036);
    gem(0,.14,.399,.071,.111,.038);
    // Back of the same single shell: two lighter horizontal grips.
    rearGrip(.28,.36,-.240);rearGrip(-.35,.36,-.240);
    group.userData.shieldStyle='Evolved shield: slender silver layers, bronze wings and rune';
  }else{
    // LV90 TANK: only ONE broad fortress shield. Previous regression was
    // caused by adding an entirely new full-front shield atop Heavy's body.
    // This hull is unique: flat shoulder profile, heavy 4-quarter plate design.
    const outline=[[-.75,1.05],[-.95,.89],[-.98,.23],
      [-.90,-.56],[-.68,-1.00],[0,-1.26],
      [.68,-1.00],[.90,-.56],[.98,.23],
      [.95,.89],[.75,1.05],[0,1.08]];
    plate(outline,.46,'bronze',0,.031);
    plate(outline.map(([x,y])=>[x*.95,y*.95]),.466,'dark',.003,.024);
    plate(outline.map(([x,y])=>[x*.88,y*.90]),.468,'iron',.008,.014);
    // Four armour QUADRANTS are smaller distinct metal plates attached to
    // the same hull. No full-size second silhouette and no forward spikes.
    for(const s of [-1,1]){
      plate(mirror([[.18,.79],[.66,.87],[.82,.63],
        [.79,.06],[.26,.06]],s),.098,'dark',.295,.017);
      plate(mirror([[.225,.72],[.63,.79],[.72,.59],
        [.69,.15],[.28,.14]],s),.076,'steel',.365,.009);
      plate(mirror([[.30,.62],[.56,.68],[.62,.49],
        [.58,.23],[.32,.23]],s),.029,'bright',.414,.006);
      plate(mirror([[.22,-.03],[.76,-.04],[.78,-.52],
        [.58,-.95],[.22,-1.09]],s),.106,'dark',.299,.016);
      plate(mirror([[.275,-.12],[.67,-.12],[.69,-.47],
        [.52,-.84],[.27,-.96]],s),.081,'steel',.372,.009);
      plate(mirror([[.325,-.21],[.54,-.23],[.55,-.51],
        [.37,-.78]],s),.030,'bright',.423,.005);
      // Heavy bronze side bars and rivets clearly distinguish tank rank.
      plate(mirror([[.80,.86],[.97,.82],[.93,-.55],
        [.69,-.98],[.74,-.55]],s),.130,'bronze',.316,.014);
      for(const y of [.61,.18,-.28,-.71])rivet(s*.82,y,.382);
    }
    // Cross brace inside the *single* shield body.
    plate([[-.19,.89],[0,1.10],[.19,.89],
      [.205,-1.07],[0,-1.23],[-.205,-1.07]],
      .101,'bronze',.398,.013);
    plate([[-.13,.77],[0,.91],[.13,.77],
      [.15,-.96],[0,-1.11],[-.15,-.96]],
      .072,'recess',.474,.006);
    inlay([[0,.65],[0,.22],[0,-.24],[0,-.92]],.527,.015);
    diamond(0,.09,.531,.176,.258,'brass',.055);
    diamond(0,.09,.568,.119,.174,'dark',.031);
    gem(0,.09,.595,.103,.154,.052);
    for(const s of [-1,1]){
      rod([s*.65,.69,.474],[0,.10,.545],.019,'brass');
      rod([s*.60,-.73,.476],[0,.04,.545],.019,'brass');
    }
    // Reinforcement bars are fixed to the back of THIS hull.
    for(const s of [-1,1]){
      plate(mirror([[.23,.83],[.68,.73],[.64,-.79],
        [.31,-1.00]],s),.048,'dark',-.269,.007);
    }
    rearGrip(.34,.57,-.314);rearGrip(-.46,.57,-.314);
    group.userData.shieldStyle='Tank: single thick fortress hull, four armour quadrants';
  }
  group.userData.jobWeapon=d.key;
  group.userData.shieldFamily='Heavy Soldier bronze-steel-cyan material language';
  group.userData.weaponTier=starter?'starter':elite?'evolved':'tank';
  group.userData.singleShieldBody=true;
  group.name=(d.name||d.key)+' shield · distinct bronze/steel family';
  return group;
}

export function makeDetailedJobWeapon(T,d){
  const matched=makeReferenceWeapon(T,d);
  if(matched)return matched;
  const family=makeShieldFamilyWeapon(T,d);
  if(family)return family;
  const g=new T.Group(),key=d.key,k=d.kind,rank=d.level||1;
  const royal=['warrior','swordmaster','axer','lancer'].includes(key);
  const scarlet=['berserker','battleMage','tank'].includes(key);
  const emerald=['swiftArcher','supportMage'].includes(key);
  const bright=key==='heavy'?0x48e0d2:scarlet?0xff475d:emerald?0x5be4bd:royal?0x45dfdb:0x9c91ff;
  const metal=d.key==='heavy'?0x707e87:0x9aabb9;
  const mats={
    steel:new T.MeshStandardMaterial({color:metal,metalness:.82,roughness:.31,side:T.DoubleSide}),
    blade:new T.MeshStandardMaterial({color:0xcedde5,metalness:.85,roughness:.22,side:T.DoubleSide}),
    edge:new T.MeshStandardMaterial({color:0xe8f1ec,metalness:.92,roughness:.21,side:T.DoubleSide}),
    black:new T.MeshStandardMaterial({color:0x343e49,metalness:.67,roughness:.42,side:T.DoubleSide}),
    recessed:new T.MeshStandardMaterial({color:0x1a252d,metalness:.46,roughness:.5,side:T.DoubleSide}),
    gold:new T.MeshStandardMaterial({color:rank>1?0xcc9d5d:0xb8a17c,metalness:.82,roughness:.29,side:T.DoubleSide}),
    brown:new T.MeshStandardMaterial({color:0x493829,roughness:.89,side:T.DoubleSide}),
    leather:new T.MeshStandardMaterial({color:0x292c33,roughness:.86,side:T.DoubleSide}),
    accent:new T.MeshStandardMaterial({color:bright,metalness:.32,roughness:.2,emissive:bright,emissiveIntensity:.57,side:T.DoubleSide}),
    linen:new T.MeshStandardMaterial({color:0xd2c7b2,metalness:0,roughness:.93,side:T.DoubleSide}),
  };
  const add=(geom,material,pos=[0,0,0])=>{
    const m=new T.Mesh(geom,mats[material]||mats.steel);m.position.set(...pos);
    m.castShadow=true;m.receiveShadow=true;g.add(m);return m;
  };
  const cube=(w,h,dep,mat,x=0,y=0,z=0)=>add(new T.BoxGeometry(w,h,dep),mat,[x,y,z]);
  const cylinder=(r1,r2,h,mat,x,y,z,seg=12)=>
    add(new T.CylinderGeometry(r1,r2,h,seg),mat,[x,y,z]);
  const pipe=(a,b,r,mat,segments=10)=>{
    const p=new T.Vector3(...a),q=new T.Vector3(...b),v=q.clone().sub(p);
    if(v.length()<.001)return;
    const m=add(new T.CylinderGeometry(r,r,v.length(),segments),mat,
      [(p.x+q.x)/2,(p.y+q.y)/2,(p.z+q.z)/2]);
    m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),v.normalize());return m;
  };
  const curve=(points,r,mat)=>{
    const path=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p)));
    return add(new T.TubeGeometry(path,Math.max(12,points.length*6),r,7,false),mat);
  };
  const poly=(pts,depth,mat,z=0,bevel=.014)=>{
    const sh=new T.Shape();sh.moveTo(pts[0][0],pts[0][1]);
    for(let i=1;i<pts.length;i++)sh.lineTo(pts[i][0],pts[i][1]);sh.closePath();
    return add(new T.ExtrudeGeometry(sh,{
      depth,steps:1,bevelEnabled:bevel>0,
      bevelThickness:bevel,bevelSize:bevel,bevelSegments:2,curveSegments:8
    }),mat,[0,0,z-depth/2]);
  };
  const gem=(x,y,z,rx=.1,ry=.14,rz=.08)=>{
    const m=add(new T.OctahedronGeometry(1), 'accent',[x,y,z]);m.scale.set(rx,ry,rz);return m;
  };
  const bead=(x,y,z,r=.034,mat='gold')=>add(new T.SphereGeometry(r,8,6),mat,[x,y,z]);
  const band=(y,r=.11)=>{
    cylinder(r,r,.065,'gold',0,y,0);
    cylinder(r*.81,r*.81,.012,'edge',0,y+.033,0);
  };
  const wrap=(bottom,top,r=.1,turns=7)=>{
    cylinder(r,r,top-bottom,'leather',0,(bottom+top)/2,0,10);
    for(let i=0;i<=turns*9;i++){
      const t=i/(turns*9),a=t*Math.PI*2*turns;
      const p=[Math.cos(a)*(r+.006),bottom+t*(top-bottom),Math.sin(a)*(r+.006)];
      if(i)pipe(wrap._prev,p,.009,'brown',5);
      wrap._prev=p;
    }
    wrap._prev=null;
  };
  const tip=(x,y,z,w=.09,h=.18)=>poly([
    [x-w,y],[x,y+h],[x+w,y],[x,y-h*.18]
  ],.065,'gold',z);
  const diamond=(x,y,z,w=.08,h=.13)=>poly([
    [x,y+h],[x+w,y],[x,y-h],[x-w,y]
  ],.016,'accent',z,0);
  const rivets=(xPositions,yPositions,z=.1)=>{
    for(const x of xPositions)for(const y of yPositions)bead(x,y,z,.028,'gold');
  };
  // Real rear-face meshes. Mirror only raised decor, NEVER the weapon
  // body: duplicating coincident solid surfaces would cause z-fighting.
  function mirrorRear(start,name){
    const details=g.children.slice(start);
    if(!details.length)return;
    const back=new T.Group();back.name=name+' (reverse face)';
    back.scale.z=-1;
    for(const src of details)back.add(src.clone());
    g.add(back);
  }

  // Do not scale the hilt or greatsword: only non-Warrior sword blades
  // should become thinner, including BOTH sculpted sides and their jewels.
  const flattenSwordBladeFrom=(start,ratio)=>{
    for(const part of g.children.slice(start)){
      part.position.z*=ratio;
      part.scale.z*=ratio;
    }
  };
  // Reference-matched sword geometry: rebuilt from the front, edge and
  // rear silhouettes of the user's Swordsman / Warrior concept sheets.
  // Important: EVERY layer here is actual volumetric geometry, not an image.
  function referenceSword(isGreat=false,master=false){
    const p=isGreat?1.19:master?1.10:1, w=isGreat?.47:master?.325:.302;
    const bladeBase=.46, bladeLength=(isGreat?2.17:1.93)*p;
    const top=bladeBase+bladeLength,bladeDepth=isGreat?.27:.19;
    // Dark leather handle with a diagonal double-cross woven leather wrap.
    const gripBottom=isGreat?-.79:-.62,gripTop=.24;
    wrap(gripBottom,gripTop,isGreat?.14:.116,isGreat?9:7);
    // Matching criss-cross straps visibly wrap across the grip.
    for(const dir of [-1,1]){
      const stitches=[];
      const steps=48;
      for(let i=0;i<=steps;i++){
        const t=i/steps,ang=dir*t*Math.PI*(isGreat?17:13)+(dir<0?Math.PI:0);
        const rad=isGreat?.153:.129;
        stitches.push([rad*Math.sin(ang),gripBottom+t*(gripTop-gripBottom),rad*Math.cos(ang)]);
      }
      // Continuous 3D tube = 1 GPU draw call per woven strap.
      curve(stitches,.009,'brown');
    }
    band(gripBottom,isGreat?.175:.141);
    band(gripTop,isGreat?.175:.142);
    // Distinctive pommel: faceted gold cage, protruding dark-metal diamond,
    // turquoise cut jewel on BOTH front and back.
    const basePom=gripBottom-.11;
    poly([[-.135,basePom+.04],[-.162,basePom-.105],[0,basePom-.27],
      [.162,basePom-.105],[.135,basePom+.04],[0,basePom+.13]],
      .18,'gold',0,.014);
    poly([[-.093,basePom+.022],[0,basePom+.092],[.095,basePom+.02],
      [.11,basePom-.10],[0,basePom-.21],[-.11,basePom-.10]],
      .19,'black',.015,.007);
    for(const sign of [-1,1]){
      const z=sign*.137;
      gem(0,basePom-.072,z,.076,.125,.042);
      pipe([-.102,basePom-.12,z],[0,basePom+.095,z],.014,'gold',6);
      pipe([.102,basePom-.12,z],[0,basePom+.095,z],.014,'gold',6);
    }
    for(const y of [gripBottom+.09,gripTop-.05]){
      cylinder(isGreat?.175:.149,isGreat?.16:.137,.04,'gold',0,y,0,12);
      cylinder(isGreat?.158:.136,isGreat?.158:.136,.016,'accent',0,y+.023,0,12);
    }
    // Trapezoidal blade with raised angular shoulders and a narrow spear
    // point; the old simple straight box had no correspondence to the sheet.
    const silhouette=[
      [-w*.87,bladeBase],[-w,bladeBase+.17],
      [-w*.90,bladeBase+.34],[-w*1.11,bladeBase+.39],
      [-w*.99,bladeBase+.50],[-w*.87,top-.56],
      [-w*.83,top-.40],[-w*.96,top-.32],
      [-w*.68,top-.14],[0,top],
      [w*.68,top-.14],[w*.96,top-.32],
      [w*.83,top-.40],[w*.87,top-.56],
      [w*.99,bladeBase+.50],[w*1.11,bladeBase+.39],
      [w*.90,bladeBase+.34],[w,bladeBase+.17],[w*.87,bladeBase]
    ];
    const bladeMeshStart=g.children.length;
    poly(silhouette,bladeDepth,'blade',0,.008);
    // True extruded bevel layers on both blade faces. Reverse faces
    // are individually modeled, not a transparent texture projection.
    for(const face of [-1,1]){
      const z=face*(bladeDepth*.5+.017);
      const inner=face*(bladeDepth*.5+.035);
      for(const side of [-1,1]){
        poly([[side*w*.94,bladeBase+.06],
          [side*w*.73,bladeBase+.19],
          [side*w*.69,top-.50],
          [side*w*.62,top-.22],
          [side*w*.79,top-.28],
          [side*w*.85,bladeBase+.39]],
          .020,'steel',z,.003);
        poly([[side*w*.82,bladeBase+.15],
          [side*w*.57,bladeBase+.43],
          [side*w*.51,top-.33],
          [side*w*.69,top-.22],
          [side*w*.72,bladeBase+.49]],
          .014,'edge',inner,.002);
      }
      // Inset charcoal fuller in the middle with a faceted silver ridge.
      const fuller=[[-w*.43,bladeBase+.065],[-w*.37,top-.58],
        [-w*.16,top-.17],[0,top-.08],[w*.16,top-.17],
        [w*.37,top-.58],[w*.43,bladeBase+.065]];
      poly(fuller,.022,'black',z+face*.018,.003);
      poly([[-w*.29,bladeBase+.105],[-w*.23,top-.58],
        [0,top-.20],[w*.23,top-.58],[w*.29,bladeBase+.105]],
        .012,'recessed',z+face*.031,.002);
      // Thin illuminated cyan rune channel with diamond interruptions.
      const front=face*(bladeDepth*.5+.072);
      curve([[0,bladeBase+.11,front],
        [0,bladeBase+.39,front],[0,bladeBase+.65,front],
        [0,top-.64,front]],.013,'accent');
      for(const t of [.25,.46,.62]){
        const yy=bladeBase+bladeLength*t;
        const rw=t===.46?.076:.041;
        poly([[0,yy+rw*1.75],[rw,yy],
          [0,yy-rw*1.75],[-rw,yy]],
          .018,'accent',front,.003);
        poly([[0,yy+rw*.90],[rw*.35,yy],
          [0,yy-rw*.9],[-rw*.35,yy]],
          .01,'black',front+face*.018,0);
      }
      // Reference's forked cyan line details around larger runes.
      for(const t of [.21,.43,.66]){
        const y=bladeBase+bladeLength*t;
        for(const side of [-1,1]){
          pipe([0,y-.075,front],[side*.058,y+.02,front],.010,'accent',5);
          pipe([side*.058,y+.02,front],[0,y+.08,front],.008,'accent',5);
        }
      }
      // Tiny cold-silver forged scratches follow the blade facet direction.
      for(let i=0;i<8;i++){
        const y=bladeBase+.18+((i*11)%19)/19*bladeLength*.74;
        const side=i%2?1:-1;
        pipe([side*w*.73,y,inner+face*.008],
          [side*w*.60,y+.055+((i*3)%4)*.015,inner+face*.008],
          .0035,'edge',4);
      }
    }
    if(!isGreat)flattenSwordBladeFrom(bladeMeshStart,.48);
    // Large angular flared crossguard with branching wing tips, directly
    // derived from the reference's bronze + silver layered profile.
    const guardY=.305,span=isGreat?.79:.655;
    const guardBody=[[-span,guardY+.08],[-span*.91,guardY+.22],
      [-span*.71,guardY+.14],[-.22,guardY+.17],
      [-.13,guardY+.29],[0,guardY+.12],
      [.13,guardY+.29],[.22,guardY+.17],
      [span*.71,guardY+.14],[span*.91,guardY+.22],
      [span,guardY+.08],[span*.88,guardY-.09],
      [span*.57,guardY-.005],[.16,guardY-.05],
      [0,guardY-.18],[-.16,guardY-.05],
      [-span*.57,guardY-.005],[-span*.88,guardY-.09]];
    poly(guardBody,.24,'gold',0,.017);
    for(const face of [-1,1]){
      const z=face*.143;
      poly([[-span*.91,guardY+.13],[-span*.73,guardY+.105],
        [-.22,guardY+.085],[-.13,guardY+.18],
        [0,guardY+.055],[.13,guardY+.18],
        [.22,guardY+.085],[span*.73,guardY+.105],
        [span*.91,guardY+.13],[span*.82,guardY+.012],
        [.17,guardY+.025],[0,guardY-.12],
        [-.17,guardY+.025],[-span*.82,guardY+.012]],
        .029,'black',z,.008);
      for(const side of [-1,1]){
        poly([[side*.14,guardY+.11],[side*.32,guardY+.082],
          [side*span*.88,guardY+.141],
          [side*span*.70,guardY+.051],
          [side*.27,guardY+.035]],
          .018,'blade',face*.184,.004);
        poly([[side*.25,guardY-.029],[side*span*.70,guardY-.011],
          [side*span*.91,guardY-.084],
          [side*span*.75,guardY-.058],[side*.18,guardY-.084]],
          .020,'steel',face*.171,.006);
        bead(side*span*.84,guardY+.085,face*.20,.022,'gold');
      }
      // Central diamond is a raised, framed jewel, not just a cyan plane.
      poly([[0,guardY+.29],[.17,guardY+.08],
        [0,guardY-.17],[-.17,guardY+.08]],
        .058,'gold',face*.19,.014);
      poly([[0,guardY+.235],[.115,guardY+.08],
        [0,guardY-.11],[-.115,guardY+.08]],
        .040,'black',face*.237,.003);
      gem(0,guardY+.076,face*.273,.096,.155,.038);
      pipe([0,guardY+.18,face*.292],[0,guardY-.01,face*.292],
        .009,'edge',5);
    }
    // Steel collar and layered gold sockets just below the guard.
    cylinder(isGreat?.185:.153,isGreat?.14:.13,.16,'black',0,.14,0,12);
    for(const y of [.095,.18]){
      cylinder(isGreat?.20:.175,isGreat?.18:.16,.038,'gold',0,y,0,12);
    }
    g.userData.referenceMatch='Swordsman sword image / Warrior greatsword design';
  }
  // Long blades: all parts stay true volumetric 3D meshes, with a blade
  // bevel, darker spine, inset glowing runes and a real sculpted crossguard.
  function sword(){
    if(k!=='dual'){referenceSword(k==='greatsword',rank>=30);return}
    const berserker=key==='berserker',y0=.34;
    const length=berserker?1.33:1.04,w=berserker?.29:.19;
    // Each of these is ONE genuine 3D blade. First-person and third-person
    // rigs equip an instance in EACH hand, rather than two swords in one hand.
    wrap(-.45,.21,.105,9);
    for(const y of [-.47,.20])band(y,.141);
    for(const face of [-1,1])gem(0,-.53,face*.085,.094,.12,.047);
    // Swept, serrated asymmetric blade for the Berserker, straight practical
    // steel for the Mercenary. Curvature exists in the actual mesh silhouette.
    const blade=berserker
      ?[[-w*.69,y0],[-w*1.11,y0+.25],
        [-w*1.34,y0+.48],[-w*1.16,y0+.65],
        [-w*.92,y0+.86],[-w*.75,y0+length*.96],
        [-w*1.22,y0+length*1.03],
        [-w*.19,y0+length*.92],
        [w*.17,y0+length*.78],[w*.70,y0+length*.38],
        [w*.97,y0+.22],[w*.80,y0]]
      :[[-w,y0],[-w*1.12,y0+.21],[-w*.85,y0+length*.8],
        [0,y0+length],[w*.85,y0+length*.8],[w,y0+.21]];
    const bladeMeshStart=g.children.length;
    poly(blade,berserker?.18:.14,berserker?'steel':'blade',0,.016);
    for(const face of [-1,1]){
      const z=face*(berserker?.112:.092);
      const dark=berserker?'recessed':'black';
      poly([[-w*.65,y0+.08],[-w*.86,y0+.37],
        [-w*.54,y0+length*.70],[0,y0+length*.89],
        [w*.12,y0+length*.66],[w*.55,y0+.27],
        [w*.59,y0+.07]],.025,dark,z,.006);
      // Visible refined silver knife edge and glowing runic center.
      poly([[-w*.70,y0+.09],[-w*.86,y0+.31],
        [-w*.57,y0+length*.85],[0,y0+length*.90],
        [-w*.33,y0+length*.49]],.012,'edge',z+face*.033,.004);
      curve([[0,y0+.07,z+face*.044],
        [-w*.21,y0+length*.35,z+face*.044],
        [-w*.36,y0+length*.7,z+face*.044]],.015,'accent');
      for(const t of [0.24,0.48,0.7]){
        diamond(-w*.21,y0+length*t,z+face*.064,.044,.077);
      }
      if(berserker){
        for(let i=0;i<3;i++){
          const yy=y0+.27+i*.25;
          poly([[-w*.95,yy-.065],[-w*1.65,yy+.02],
            [-w*1.03,yy+.13]],.075,'black',0,.012);
          gem(-w*.73,yy+.05,z+face*.05,.029,.05,.021);
        }
      }
    }
    // Mercenary blade: keep the handle/guard solid, blade profile slim.
    flattenSwordBladeFrom(bladeMeshStart,.55);
    const gd=berserker?.53:.36;
    poly([[-gd,.24],[-gd*.93,.44],[-gd*.68,.36],
      [-.13,.42],[0,.31],[.13,.42],[gd*.68,.36],
      [gd*.93,.44],[gd,.24],[gd*.68,.17],
      [0,.14],[-gd*.68,.17]],.18,berserker?'black':'gold',0,.019);
    for(const face of [-1,1]){
      gem(0,.30,face*.119,berserker?.13:.08,berserker?.17:.09,.055);
      for(const side of [-1,1]){
        poly([[side*.13,.30],[side*gd*.92,.37],
          [side*gd*.70,.26]],.025,'gold',face*.105,.005);
      }
    }
    cylinder(.14,.12,.14,'gold',0,.15,0);
  }
  function axe(){
    // Volumetric double crescent head rebuilt to resemble the asset design:
    // slotted heavy steel blades, gilded center boss, carved butt counterweight.
    wrap(-.76,.55,.125,11);
    for(const y of [-.72,-.30,.37,.59])band(y,.152);
    pipe([0,.49,0],[0,1.65,0],.124,'brown',12);
    pipe([0,.78,.07],[0,1.55,.07],.019,'accent');
    for(const y of [1.00,1.47]){
      band(y,.162);
      for(const face of [-1,1])gem(0,y,face*.17,.060,.073,.033);
    }
    poly([[-.20,1.35],[0,1.28],[.20,1.35],
      [.24,1.98],[0,2.29],[-.24,1.98]],.26,'black',0,.025);
    for(const sign of [-1,1]){
      // Concave underside and pointed upper horn are sculpted into the edge.
      const points=[
        [sign*.16,1.34],[sign*.30,1.46],
        [sign*.44,1.55],[sign*.60,1.50],
        [sign*.94,1.35],[sign*1.20,1.30],
        [sign*1.01,1.49],[sign*.91,1.76],
        [sign*1.02,2.02],[sign*1.20,2.23],
        [sign*.92,2.18],[sign*.56,2.10],
        [sign*.36,1.92],[sign*.18,1.97]
      ];
      poly(points,.25,'blade',0,.021);
      for(const face of [-1,1]){
        const z=face*.145,front=face*.177;
        poly([[sign*.26,1.49],[sign*.51,1.57],
          [sign*.85,1.48],[sign*.91,1.72],
          [sign*.91,2.08],[sign*.55,2.01],
          [sign*.37,1.84]],.035,'black',z,.011);
        poly([[sign*.54,1.57],[sign*.80,1.54],
          [sign*.84,1.79],[sign*.91,2.09],
          [sign*.72,2.02],[sign*.64,1.82]],.023,'steel',front,.006);
        pipe([sign*.63,1.61,face*.205],[sign*.81,1.85,face*.205],.012,'accent');
        pipe([sign*.81,1.85,face*.205],[sign*.76,2.02,face*.205],.012,'accent');
        for(const y of [1.62,1.9])diamond(sign*.55,y,face*.208,.042,.063);
      }
      for(const y of [1.37,2.05]){
        poly([[sign*.40,y],[sign*.48,y+.09],
          [sign*.59,y+.01]],.03,'gold',.04,.009);
      }
    }
    // Raised center crest with a cut gemstone on both faces.
    poly([[-.24,1.39],[0,1.29],[.24,1.39],
      [.31,1.67],[.18,1.96],[0,2.18],
      [-.18,1.96],[-.31,1.67]],.29,'gold',0,.023);
    poly([[-.14,1.45],[0,1.40],[.14,1.45],
      [.20,1.70],[0,2.08],[-.20,1.70]],.31,'black',0,.010);
    for(const face of [-1,1]){
      gem(0,1.76,face*.19,.139,.19,.056);
      poly([[0,2.13],[.088,1.98],[0,1.94],
        [-.088,1.98]],.025,'gold',face*.21,.006);
    }
    // Pommel is an actual gilded cage with recessed blue jewel.
    poly([[-.14,-.73],[-.20,-.87],[0,-1.08],
      [.20,-.87],[.14,-.73]],.18,'gold',0,.016);
    for(const face of [-1,1])gem(0,-.87,face*.13,.077,.104,.033);
  }
  function spear(){
    // Extra-long spear / lance with broad diamond cross-section leaf point.
    wrap(-.78,.60,.081,14);
    pipe([0,.55,0],[0,2.37,0],.079,'brown',12);
    // Contrast the brown wrapped grip and inlaid dark-steel midsection.
    cylinder(.095,.095,.66,'black',0,1.48,0,10);
    for(const y of [-.76,-.28,.36,.66,1.13,1.78,2.21])band(y,.102);
    for(const face of [-1,1]){
      const z=face*.095;
      poly([[-.067,1.21],[-.062,1.83],[0,1.91],
        [.062,1.83],[.067,1.21]],.025,'gold',z,.005);
      pipe([0,1.25,face*.13],[0,1.86,face*.13],.012,'accent');
      for(const y of [1.25,1.86])gem(0,y,face*.133,.050,.071,.023);
    }
    // Winged socket holding an extruded steel spearhead with ridge.
    cylinder(.17,.13,.19,'gold',0,2.32,0,10);
    for(const sign of [-1,1]){
      poly([[sign*.04,2.25],[sign*.43,2.33],
        [sign*.35,2.55],[sign*.19,2.43],
        [sign*.06,2.58]],.12,'gold',0,.014);
      poly([[sign*.07,2.41],[sign*.31,2.45],
        [sign*.28,2.50]],.021,'blade',.073,.003);
    }
    const p=[[-.13,2.42],[-.20,2.65],[-.31,2.94],
      [-.22,3.24],[0,3.82],[.22,3.24],
      [.31,2.94],[.20,2.65],[.13,2.42]];
    poly(p,.19,'blade',0,.015);
    for(const face of [-1,1]){
      const z=face*.12;
      poly([[-.10,2.54],[-.14,2.83],
        [0,3.71],[.14,2.83],[.10,2.54]],
        .028,'steel',z,.007);
      poly([[-.041,2.66],[0,3.68],
        [.041,2.66]],.013,'black',z+face*.035,.003);
      pipe([0,2.71,face*.18],[0,3.48,face*.18],.012,'accent');
      gem(0,2.67,face*.197,.078,.118,.035);
      for(const y of [2.85,3.19])diamond(0,y,face*.19,.037,.080);
    }
    // Bottom steel spear (counterweight) shaped and gilded.
    poly([[-.10,-.72],[-.14,-.84],[0,-1.21],
      [.14,-.84],[.10,-.72]],.14,'steel',0,.016);
    for(const face of [-1,1])gem(0,-.86,face*.103,.051,.085,.029);
  }
  function shield(){
    // Four genuinely different, double-sided shield models. Each has a
    // thick extruded metal chassis, front plates, and two rear grip straps.
    const heavy=key==='heavy',elite=key==='shieldElite',tank=key==='tank';
    const w=heavy?1.01:tank?.82:elite?.67:.59;
    const ht=heavy?2.17:tank?1.80:elite?1.55:1.31;
    const top=ht*.47,bottom=-ht*.53;
    if(heavy){
      // Reference: towering cathedral-shaped shield, weathered layered
      // gunmetal armor, bronze crown, turquoise inlays, two leather handles.
      // True multi-layer geometry on front AND back; nothing is a flat image.
      const outline=[
        [-.92,.83],[-.67,1.22],[-.50,.96],[-.35,1.04],
        [0,1.40],[.35,1.04],[.50,.96],[.67,1.22],[.92,.83],
        [1.00,-.68],[.70,-1.13],[0,-1.47],
        [-.70,-1.13],[-1.00,-.68]
      ];
      const p=(pts,material,z=.28,depth=.065,bevel=.011)=>
        poly(pts,depth,material,z,bevel);
      const mirror=pts=>pts.map(([x,y])=>[-x,y]).reverse();
      const pin=(x,y,z=.41)=>bead(x,y,z,.029,'gold');
      const seam=(a,b,z=.41,material='gold',radius=.014)=>
        pipe([a[0],a[1],z],[b[0],b[1],z],radius,material,7);
      // Thick fully enclosed body; the edge can be examined from the side.
      p(outline,'gold',0,.37,.038);
      p(outline.map(([x,y])=>[x*.955,y*.96]),'black',.035,.375,.024);
      p(outline.map(([x,y])=>[x*.91,y*.915]),'steel',.095,.39,.020);
      p(outline.map(([x,y])=>[x*.88,y*.89]),'recessed',.240,.06,.013);
      // Raised bronze perimeter; individually segmented, not painted-on.
      for(const side of [-1,1]){
        const x=side;
        p([[x*.82,.77],[x*1.00,.81],[x*1.025,-.72],
          [x*.76,-1.13],[x*.58,-1.07],[x*.84,-.57]],
          'gold',.245,.13,.020);
        p([[x*.88,.48],[x*.96,.51],[x*.96,-.62],
          [x*.71,-.98],[x*.74,-.65]],'black',.340,.07,.007);
        p([[x*.79,.45],[x*.89,.36],[x*.88,-.61],
          [x*.65,-.95],[x*.68,-.62]],'blade',.359,.052,.008);
      }
      // The two tall pointed bronze finials anchor the entire silhouette.
      for(const side of [-1,1]){
        const x=side;
        p([[x*.52,.91],[x*.63,1.25],[x*.80,.86],
          [x*.94,.77],[x*.77,.53],[x*.62,.73]],
          'gold',.327,.16,.023);
        p([[x*.61,.94],[x*.63,1.16],[x*.70,.92],
          [x*.64,.79]],'black',.429,.033,.007);
        gem(x*.645,.987,.456,.055,.11,.027);
        // Shoulder guards with silver faces and their own chamfered edges.
        p([[x*.44,.84],[x*.82,.76],[x*.80,.46],
          [x*.57,.19],[x*.28,.25],[x*.22,.66]],
          'gold',.34,.073,.013);
        p([[x*.46,.76],[x*.71,.69],[x*.72,.48],
          [x*.53,.29],[x*.31,.33],[x*.33,.63]],
          'blade',.397,.068,.012);
        p([[x*.43,.67],[x*.62,.64],[x*.65,.46],
          [x*.51,.35],[x*.40,.40]],'steel',.453,.031,.006);
        pin(x*.72,.73,.465);
      }
      // Central recessed longitudinal stripe, matching the reference.
      p([[-.25,.86],[0,1.20],[.25,.86],
        [.20,-1.14],[0,-1.33],[-.20,-1.14]],
        'gold',.361,.074,.016);
      p([[-.16,.77],[0,1.10],[.16,.77],
        [.125,-1.12],[0,-1.26],[-.125,-1.12]],
        'recessed',.412,.077,.009);
      // Continuous turquoise tracery and the lower mid-shield diamond.
      seam([0,.70],[0,-1.00],.464,'accent',.011);
      for(const y of [-.63,.01,.47]){
        p([[0,y+.12],[.055,y],[0,y-.10],[-.055,y]],
          'gold',.473,.042,.003);
        gem(0,y,.502,.031,.062,.020);
      }
      p([[0,.22],[.13,.03],[0,-.18],[-.13,.03]],
        'gold',.496,.061,.006);
      p([[0,.16],[.083,.03],[0,-.11],[-.083,.03]],
        'recessed',.542,.025,.002);
      gem(0,.028,.570,.069,.124,.029);
      // Sculpted overlapping armor with a visible seam between every plate.
      for(const side of [-1,1]){
        const x=side;
        // Upper vertical plates flank the recessed central ridge.
        p([[x*.23,.69],[x*.52,.72],[x*.67,.44],
          [x*.64,.11],[x*.45,-.05],[x*.20,.05]],
          'black',.33,.093,.011);
        p([[x*.26,.64],[x*.51,.66],[x*.60,.42],
          [x*.58,.16],[x*.43,.03],[x*.25,.11]],
          'blade',.394,.078,.009);
        p([[x*.30,.56],[x*.47,.56],[x*.51,.24],
          [x*.42,.16],[x*.32,.24]],'steel',.456,.026,.004);
        // Shield-height plate in two segmented tiers.
        p([[x*.20,-.10],[x*.43,-.02],[x*.68,-.14],
          [x*.72,-.57],[x*.55,-.85],[x*.19,-.96]],
          'black',.353,.095,.011);
        p([[x*.24,-.16],[x*.44,-.10],[x*.61,-.21],
          [x*.65,-.56],[x*.52,-.77],[x*.23,-.86]],
          'blade',.405,.071,.009);
        p([[x*.27,-.22],[x*.46,-.19],[x*.54,-.32],
          [x*.56,-.57],[x*.46,-.66]],'steel',.458,.028,.004);
        // Bright lower corner riveted panel, as in the front view.
        p([[x*.61,-.80],[x*.80,-.69],[x*.83,-.88],
          [x*.64,-1.09],[x*.35,-1.23],[x*.43,-1.04]],
          'gold',.374,.087,.012);
        p([[x*.60,-.83],[x*.74,-.76],[x*.77,-.86],
          [x*.59,-1.04],[x*.40,-1.15],[x*.48,-1.03]],
          'blade',.433,.058,.008);
        pin(x*.54,-.88,.487);
        // Visible long runic side channel between armor segments.
        seam([x*.74,.13],[x*.76,-.48],.441,'accent',.012);
        pin(x*.66,-.03,.468);
        pin(x*.70,-.51,.471);
        // Structural chamfers on overlapping plates.
        seam([x*.27,.59],[x*.29,.13],.493,'edge',.012);
        seam([x*.29,-.22],[x*.31,-.79],.490,'edge',.012);
      }
      // Ornate bronze top crown with faceted turquoise crystal.
      p([[-.75,.77],[-.49,.91],[-.35,.98],[0,1.42],
        [.35,.98],[.49,.91],[.75,.77],
        [.51,.69],[.20,.79],[0,.66],[-.20,.79],[-.51,.69]],
        'gold',.446,.115,.021);
      p([[-.37,.87],[0,1.33],[.37,.87],
        [.17,.77],[0,.62],[-.17,.77]],
        'black',.526,.064,.015);
      p([[-.26,.90],[0,1.19],[.26,.90],[0,.75]],
        'gold',.566,.053,.011);
      p([[-.15,.92],[0,1.10],[.15,.92],[0,.79]],
        'recessed',.611,.028,.004);
      gem(0,.949,.646,.124,.183,.052);
      for(const x of [-.51,.51])pin(x,.822,.584);
      // Reinforced central bottom point with its own gemstone.
      p([[-.39,-1.08],[0,-1.43],[.39,-1.08],
        [.20,-1.02],[0,-1.24],[-.20,-1.02]],
        'gold',.435,.107,.015);
      p([[-.21,-1.13],[0,-1.35],[.21,-1.13],[0,-1.20]],
        'blade',.504,.056,.009);
      gem(0,-1.205,.553,.065,.094,.035);
      // Backside: matte metal chassis, armor ribs, two separate brown
      // leather-wrap horizontal handgrips + bronze mounting brackets.
      p(outline.map(([x,y])=>[x*.875,y*.865]),
        'black',-.246,.051,.013);
      for(const side of [-1,1]){
        const x=side;
        p([[x*.17,.76],[x*.66,.82],[x*.73,.33],
          [x*.61,-.93],[x*.25,-1.12]],'steel',-.292,.063,.014);
        p([[x*.22,.64],[x*.56,.67],[x*.58,-.88],
          [x*.27,-.99]],'recessed',-.344,.049,.010);
        for(const y of [.66,.32,0,-.38,-.68,-.94]){
          pin(x*.67,y,-.385);
        }
      }
      // Rear backbone and crowned upper rear structural strap.
      p([[-.10,1.16],[.10,1.16],[.18,-1.06],
        [0,-1.27],[-.18,-1.06]],'black',-.349,.074,.012);
      p([[-.71,.87],[0,1.19],[.71,.87],
        [.43,.75],[0,.93],[-.43,.75]],'gold',-.397,.075,.013);
      p([[-.10,.60],[.10,.60],[.13,-1.01],
        [0,-1.23],[-.13,-1.01]],'steel',-.407,.053,.006);
      // 2 leather crosswise handles, visually distinct front vs back.
      for(const y of [.40,-.46]){
        for(const side of [-1,1]){
          const x=side*.60;
          cube(.18,.26,.108,'gold',x,y,-.455);
          cube(.125,.17,.10,'black',x,y,-.519);
          for(const dy of [-.08,.08])pin(x,y+dy,-.580);
        }
        cube(1.25,.16,.17,'brown',0,y,-.538);
        cube(1.05,.137,.151,'leather',0,y,-.641);
        for(let i=0;i<15;i++){
          const x=-.49+i*.070;
          const leather=pipe([x,y-.059,-.735],
            [x+.041,y+.057,-.735],.008,'brown',5);
        }
        for(const end of [-.53,.53]){
          cube(.047,.18,.175,'gold',end,y,-.636);
        }
      }
      return;
    }

    // Individually sculpted shield designs. The old path gave all three
    // shield jobs an almost identical diamond plate; avoid any shared
    // faceplate silhouette, crest or size across these independent models.
    // Coordinates are actual closed beveled THREE.ExtrudeGeometry meshes.
    const panel=(pts,dep,material,z=0,bev=.009)=>poly(pts,dep,material,z,bev);
    const backHandle=(y,half,z)=>{
      // A leather-gripped metal crossbar, both mounts visible from rear.
      for(const side of [-1,1]){
        const x=side*half;
        cube(.13,.21,.13,'gold',x,y,z+.03);
        cube(.09,.15,.11,'black',x,y,z-.055);
        for(const dy of [-.062,.062])bead(x,y+dy,z-.12,.023,'gold');
      }
      pipe([-half,y,z-.14],[half,y,z-.14],.075,'leather',10);
      for(let i=0;i<12;i++){
        const x=-half+.04+i*(2*half-.08)/12;
        pipe([x,y-.054,z-.197],[x+.040,y+.052,z-.197],.007,'brown',5);
      }
    };
    const sideGem=(x,y,z,rx,ry)=>{
      diamond(x,y,z,.030+rx*1.25,.045+ry*1.20);
      gem(x,y,z+.034,rx,ry,.031);
    };
    if(key==='shield'){
      // STARTER SHIELD: small iron-edged HEXAGONAL KITE, dark oak-backed,
      // reinforced with an eight-point hand-forged cross. No crown/spikes.
      const outline=[[-.44,.66],[-.58,.42],[-.57,-.11],[-.43,-.48],
        [0,-.86],[.43,-.48],[.57,-.11],[.58,.42],[.44,.66],[0,.72]];
      panel(outline,.30,'gold',0,.022);
      panel(outline.map(([x,y])=>[x*.93,y*.94]),.32,'black',.016,.016);
      panel(outline.map(([x,y])=>[x*.86,y*.87]),.33,'brown',.034,.013);
      // A real raised iron hexagon, not the other shields' layered plates.
      panel([[-.38,.52],[0,.62],[.38,.52],[.44,.24],[.44,-.19],
        [0,-.72],[-.44,-.19],[-.44,.24]],.089,'steel',.216,.015);
      panel([[-.33,.44],[0,.53],[.33,.44],[.37,.22],[.36,-.14],
        [0,-.62],[-.36,-.14],[-.37,.22]],.050,'black',.270,.011);
      // Dark, leather/bronze-cross central insignia.
      panel([[-.089,.42],[.089,.42],[.12,.14],[.115,-.44],
        [0,-.55],[-.115,-.44],[-.12,.14]],.056,'gold',.318,.013);
      panel([[-.06,.35],[.06,.35],[.075,-.38],[0,-.46],
        [-.075,-.38]],.039,'steel',.367,.004);
      panel([[-.35,.075],[.35,.075],[.32,-.065],[-.32,-.065]],
        .072,'steel',.315,.009);
      for(const s of [-1,1]){
        // Individually applied sloping iron braces & closed corner guards.
        panel([[s*.13,.42],[s*.35,.46],[s*.39,.29],[s*.16,.16]],
          .051,'gold',.296,.009);
        panel([[s*.13,-.14],[s*.38,-.20],[s*.32,-.39],
          [s*.11,-.38]],.055,'steel',.294,.006);
        pipe([s*.40,.40,.335],[s*.41,-.19,.335],.020,'gold');
        for(const y of [.40,.16,-.15,-.36])bead(s*.47,y,.294,.028,'gold');
      }
      // Small single turquoise gem in a modest, square recessed boss.
      panel([[-.16,.08],[0,.24],[.16,.08],[0,-.12]],
        .058,'black',.380,.009);
      sideGem(0,.071,.435,.075,.104);
      // Backside is solid oak/iron with ONE handgrip, different from Elite.
      panel(outline.map(([x,y])=>[x*.81,y*.84]),.072,'leather',-.200,.009);
      panel([[-.12,.53],[.12,.53],[.14,-.51],[0,-.63],
        [-.14,-.51]],.055,'steel',-.251,.011);
      for(const s of [-1,1]){
        panel([[s*.22,.43],[s*.41,.37],[s*.39,-.29],
          [s*.20,-.42]],.052,'brown',-.266,.009);
        for(const y of [.35,-.29])bead(s*.38,y,-.307,.030,'gold');
      }
      backHandle(-.02,.33,-.33);
      g.userData.shieldStyle='starter iron kite with forged cross and single rear grip';
      return;
    }
    if(key==='shieldElite'){
      // EVOLVED SHIELD SOLDIER: tall elegant silver/GOLD PALADIN crest
      // with two flared heraldic wings and layered facets. Not a basic kite.
      const outline=[[-.42,.88],[-.71,.63],[-.77,.32],[-.64,-.30],
        [-.44,-.79],[0,-1.11],[.44,-.79],[.64,-.30],
        [.77,.32],[.71,.63],[.42,.88],[0,1.08]];
      panel(outline,.37,'gold',0,.023);
      panel(outline.map(([x,y])=>[x*.93,y*.94]),.37,'black',.014,.017);
      panel(outline.map(([x,y])=>[x*.86,y*.86]),.40,'steel',.055,.018);
      // Symmetric independent raised silver plates, with deep dark relief.
      for(const s of [-1,1]){
        panel([[s*.19,.62],[s*.50,.75],[s*.67,.42],
          [s*.52,-.17],[s*.27,-.33],[s*.18,.11]],
          .091,'black',.267,.010);
        panel([[s*.245,.60],[s*.48,.65],[s*.56,.39],
          [s*.46,-.12],[s*.275,-.23],[s*.225,.11]],
          .087,'blade',.323,.010);
        panel([[s*.27,.51],[s*.38,.56],[s*.41,.25],
          [s*.35,-.08]],.025,'edge',.378,.004);
        panel([[s*.18,-.36],[s*.43,-.29],[s*.57,-.46],
          [s*.38,-.77],[s*.13,-.91]],.114,'black',.271,.015);
        panel([[s*.22,-.39],[s*.44,-.36],[s*.46,-.51],
          [s*.35,-.68],[s*.21,-.77]],.085,'blade',.347,.008);
        // Sweeping gold winged cheek guards ABOVE the top corners.
        panel([[s*.15,.65],[s*.42,.84],[s*.71,1.07],
          [s*.64,.67],[s*.49,.52],[s*.23,.49]],
          .155,'gold',.30,.019);
        panel([[s*.33,.69],[s*.59,.88],[s*.57,.69],
          [s*.45,.58]],.040,'steel',.401,.005);
        pipe([s*.55,.46,.43],[s*.52,-.59,.43],.023,'gold');
        for(const y of [.35,-.01,-.43])bead(s*.61,y,.382,.027,'gold');
        // Long pale-magenta arcane trace distinguishes evolved type.
        pipe([s*.45,.44,.45],[s*.43,-.22,.45],.011,'accent');
      }
      // Centered gilded spine interrupted by diamond jewels.
      panel([[-.15,.75],[0,1.18],[.15,.75],
        [.14,-.82],[0,-1.02],[-.14,-.82]],.093,'gold',.375,.013);
      panel([[-.085,.66],[0,.94],[.085,.66],
        [.075,-.79],[0,-.92],[-.075,-.79]],.058,'recessed',.442,.007);
      for(const y of [.38,-.16,-.61]){
        diamond(0,y,.480,y===.38?.110:.064,y===.38?.166:.095);
        gem(0,y,.511,y===.38?.079:.044,y===.38?.122:.069,.043);
      }
      // Recessed twin chevrons, not the heavy tower's straight power core.
      for(const y of [.13,-.42]){
        for(const s of [-1,1]){
          pipe([s*.28,y+.08,.443],[0,y-.06,.479],.016,'gold');
        }
      }
      // Gilded crest with upper triangular horn and inset gem.
      panel([[-.38,.79],[0,1.27],[.38,.79],
        [.26,.65],[0,.56],[-.26,.65]],.149,'gold',.470,.015);
      panel([[-.19,.83],[0,1.14],[.19,.83],[0,.67]],
        .063,'black',.555,.007);
      gem(0,.866,.604,.129,.195,.061);
      // Rear: dark separate plate, TWO straps rather than starter single.
      panel(outline.map(([x,y])=>[x*.85,y*.86]),.095,'recessed',-.254,.015);
      for(const s of [-1,1]){
        panel([[s*.13,.81],[s*.56,.71],[s*.48,-.69],
          [s*.22,-.92]],.076,'steel',-.327,.010);
        panel([[s*.23,.67],[s*.46,.59],[s*.39,-.62],
          [s*.23,-.74]],.047,'black',-.384,.007);
        for(const y of [.57,.15,-.28,-.59])bead(s*.48,y,-.417,.032,'gold');
      }
      panel([[-.095,1.06],[.095,1.06],[.14,-.86],
        [0,-1.04],[-.14,-.86]],.081,'gold',-.383,.009);
      backHandle(.31,.42,-.45);
      backHandle(-.40,.42,-.45);
      g.userData.shieldStyle='evolved silver paladin wing shield with double straps';
      return;
    }
    // TANK: imposing nearly square dark-steel BULWARK, capped shoulders,
    // three forward spikes, a huge red crystal and reinforced quadrants.
    const outline=[[-.77,.99],[-1.05,.76],[-1.10,.29],[-1.01,-.57],
      [-.73,-.93],[0,-1.19],[.73,-.93],[1.01,-.57],
      [1.10,.29],[1.05,.76],[.77,.99],[0,1.08]];
    panel(outline,.54,'gold',0,.026);
    panel(outline.map(([x,y])=>[x*.96,y*.95]),.54,'black',.015,.020);
    panel(outline.map(([x,y])=>[x*.91,y*.90]),.57,'steel',.028,.017);
    panel(outline.map(([x,y])=>[x*.85,y*.84]),.61,'recessed',.060,.016);
    // Broad aggressive, visibly separated angular armour plates.
    for(const s of [-1,1]){
      panel([[s*.17,.79],[s*.83,.79],[s*.96,.47],
        [s*.90,.06],[s*.30,.07],[s*.18,.31]],
        .116,'black',.366,.015);
      panel([[s*.23,.72],[s*.78,.69],[s*.82,.43],
        [s*.75,.16],[s*.31,.17]],.105,'steel',.439,.014);
      panel([[s*.29,.62],[s*.63,.59],[s*.70,.32],
        [s*.37,.25]],.034,'blade',.509,.007);
      panel([[s*.24,-.06],[s*.87,-.04],[s*.89,-.52],
        [s*.65,-.78],[s*.20,-.95]],.122,'black',.366,.015);
      panel([[s*.30,-.15],[s*.78,-.16],[s*.79,-.48],
        [s*.60,-.70],[s*.29,-.77]],.104,'steel',.453,.010);
      panel([[s*.36,-.22],[s*.65,-.24],[s*.64,-.49],
        [s*.41,-.65]],.036,'blade',.520,.005);
      // Structural outer flanges extend beyond main chassis.
      panel([[s*.78,.81],[s*1.15,.67],[s*1.09,.30],
        [s*.87,.37]],.17,'gold',.307,.014);
      panel([[s*.84,-.36],[s*1.14,-.51],[s*.86,-.94],
        [s*.68,-.77]],.16,'black',.326,.013);
      for(const y of [.56,.07,-.43,-.72])bead(s*.87,y,.500,.039,'gold');
      pipe([s*.90,.54,.511],[s*.90,-.51,.515],.032,'gold');
      pipe([s*.36,.48,.535],[s*.34,-.64,.540],.013,'accent');
    }
    // Tank's distinctive three forward-facing STEEL SPIKES, actually 3D.
    for(const x of [-.66,0,.66]){
      const spike=add(new T.ConeGeometry(x===0?.18:.16,x===0?.60:.49,10),
        'blade',[x,.10,.94]);
      spike.rotation.x=Math.PI/2;
      const flange=cylinder(x===0?.18:.15,x===0?.18:.15,.13,
        'gold',x,.10,.64,10);
      flange.rotation.x=Math.PI/2;
      // Raised dark socket plate behind each spearpoint.
      panel([[x-.19,.36],[x+.19,.36],[x+.20,-.16],
        [x-.20,-.16]],.062,'black',.576,.009);
    }
    // Reinforced bronze X across the center of the heavy bulwark.
    for(const s of [-1,1]){
      pipe([s*.75,.65,.56],[0,.07,.62],.065,'gold');
      pipe([s*.75,-.72,.56],[0,.07,.62],.065,'gold');
      pipe([s*.74,.64,.61],[0,.07,.655],.023,'steel');
    }
    panel([[-.24,.86],[0,1.13],[.24,.86],
      [.30,-.86],[0,-1.09],[-.30,-.86]],.111,'gold',.468,.016);
    panel([[-.16,.75],[0,.93],[.16,.75],
      [.18,-.77],[0,-.92],[-.18,-.77]],.073,'black',.540,.007);
    // Three-layer gemstone setting with vivid red core.
    diamond(0,.09,.674,.27,.34);
    diamond(0,.09,.716,.20,.26,'black',.043);
    gem(0,.09,.769,.154,.210,.078);
    gem(0,-.63,.685,.078,.122,.035);
    // Rear two massive handrails and cross bracing.
    panel(outline.map(([x,y])=>[x*.87,y*.87]),.075,'black',-.312,.013);
    for(const s of [-1,1]){
      panel([[s*.20,.84],[s*.82,.74],[s*.80,-.69],
        [s*.32,-.95]],.100,'steel',-.399,.014);
      panel([[s*.29,.62],[s*.67,.58],[s*.66,-.67],
        [s*.32,-.77]],.067,'recessed',-.463,.011);
      for(const y of [.61,.23,-.20,-.62])bead(s*.76,y,-.503,.043,'gold');
    }
    panel([[-.13,1.02],[.13,1.02],[.19,-.89],
      [0,-1.10],[-.19,-.89]],.104,'steel',-.489,.012);
    backHandle(.37,.65,-.59);
    backHandle(-.49,.65,-.59);
    g.userData.shieldStyle='tank broad spiked red-core bulwark with double heavy handrails';
  }

  function bow(){
    const power=key==='powerArcher',fast=key==='swiftArcher';
    const halfH=power?1.13:fast?.79:.94;
    const width=power?.68:fast?.45:.60;
    const thickness=power?.125:fast?.057:.084;
    // Proper recurve silhouette, reinforced riser and taut straight
    // bowstring. Fast bow is visibly thin, power bow massive.
    wrap(-.24,.25,power?.142:.111,power?7:5);
    for(const y of [-.24,.25])band(y,power?.163:.137);
    cube(.16,.45,.18,'gold',-.025,.02,0);
    for(const face of [-1,1]){
      const z=face*.13;
      poly([[-.11,-.18],[.11,-.18],
        [.22,.04],[.11,.25],[-.11,.25],[-.22,.04]],.052,
        'black',z,.010);
      gem(0,.045,z+face*.027,.11,.12,.034);
      poly([[-.12,.25],[.14,.25],[.04,.34],
        [-.15,.32]],.044,'gold',z,.008);
    }
    const limbTips=[];
    for(const sign of [-1,1]){
      const sy=sign;
      // x/y points of a compound-reflex bow curved away then inward.
      const stations=[
        [-.015,.21],[width*.34,.32],[width*.74,.53],
        [width,.71],[width*.91,.84],[width*.70,.98],
        [width*.79,1.09]
      ].map(([x,y])=>[x,sy*y*halfH/1.08]);
      limbTips.push(stations.at(-1));
      for(let i=1;i<stations.length;i++){
        const p=stations[i-1],q=stations[i],pr=(i/(stations.length-1));
        pipe([p[0],p[1],0],[q[0],q[1],0],
          thickness*(1-pr*.52),i%2===0?'brown':'black',12);
        pipe([p[0]-.020,p[1],.054],
          [q[0]-.020,q[1],.054],.019,'gold',8);
        pipe([p[0]-.020,p[1],-.054],
          [q[0]-.020,q[1],-.054],.019,'steel',8);
      }
      const tip=stations.at(-1);
      // A true curved forged limb plate following the geometry.
      for(const face of [-1,1]){
        poly([
          [width*.31,sy*.31*halfH],
          [width*.87,sy*.53*halfH],
          [width*1.04,sy*.73*halfH],
          [width*.74,sy*.88*halfH],
          [width*.79,sy*1.07*halfH],
          [width*.61,sy*.99*halfH],
          [width*.78,sy*.72*halfH],
          [width*.54,sy*.56*halfH]
        ],power?.17:.092,power?'steel':fast?'black':'brown',
        face*(power?.085:.075),.009);
        // Glowing power channel differs from the streamlined fast limbs.
        curve([
          [width*.52,sy*.46*halfH,face*.139],
          [width*.89,sy*.69*halfH,face*.139],
          [width*.67,sy*.96*halfH,face*.139]
        ],power?.017:.012,fast?'gold':'accent');
      }
      // One string segment each side, together a continuous bowstring.
      const stringX=width*.79;
      pipe([tip[0],tip[1],0],[stringX,0,0],.014,'linen',7);
      gem(tip[0],tip[1],.032,power?.076:.053,.107,.040);
      for(const face of [-1,1]){
        diamond(width*.72,sy*.64*halfH,face*.16,.045,.083);
      }
      if(power){
        // Heavy limbs feature broad reinforcing metal spurs.
        poly([[width*.69,sy*.52*halfH],
          [width*1.23,sy*.65*halfH],
          [width*.97,sy*.81*halfH]],.14,'steel',0,.015);
        for(const face of [-1,1])
          gem(width*.92,sy*.72*halfH,face*.11,.07,.10,.034);
      }else if(fast){
        // Slim speed bow has two directional fins, not heavy armor.
        poly([[width*.65,sy*.70*halfH],
          [width*1.13,sy*.89*halfH],
          [width*.65,sy*.81*halfH]],.075,'gold',0,.006);
      }
    }
    // Real cross grip and bowstring knock - visible from the side.
    poly([[-.22,-.12],[-.28,.04],[-.13,.21],
      [.03,.11],[.03,-.14]],.12,'gold',0,.011);
    for(const face of [-1,1])diamond(0,.03,face*.16,.076,.105);
  }
  function staff(){
    const attack=key==='battleMage',support=key==='supportMage',base=key==='mage';
    const mag=attack?.57:support?.64:.46;
    // Double-ended arcane staff: braided shaft, gilded collars, faceted
    // purple/red/green crystal, actual 3D rings and hooked metal prongs.
    wrap(-.82,.46,.088,12);
    pipe([0,.42,0],[0,1.51,0],.079,attack?'black':'brown',12);
    for(const y of [-.79,-.35,.41,.82,1.29,1.51])band(y,.118);
    cylinder(.102,.095,.55,'black',0,.91,0,12);
    for(const face of [-1,1]){
      pipe([0,.71,face*.102],[0,1.15,face*.102],.014,'accent');
      for(const y of [.74,1.12]){
        poly([[0,y+.11],[.092,y],[0,y-.11],[-.092,y]],
          .024,'gold',face*.122,.005);
        gem(0,y,face*.144,.047,.060,.024);
      }
    }
    // Lower crystal finial is functional 3D geometry, not a painted glyph.
    poly([[-.16,-.79],[0,-.67],[.16,-.79],[.24,-.97],
      [.12,-1.19],[0,-1.38],[-.12,-1.19],[-.24,-.97]],
      .17,'gold',0,.014);
    poly([[-.11,-.92],[0,-.83],[.11,-.92],
      [0,-1.30]],.16,'black',.015,.008);
    for(const face of [-1,1])gem(0,-1.04,face*.118,.085,.19,.062);
    tip(0,-1.37,0,.062,.13);
    // Magical cage anchored with an ornate collar and three supporting arcs.
    const cy=2.02,rad=mag;
    cylinder(.18,.115,.15,'gold',0,1.48,0,10);
    const core=add(new T.OctahedronGeometry(1),'accent',[0,cy,0]);
    core.scale.set(attack?.28:support?.40:.32,
      attack?.62:support?.53:.47,attack?.32:support?.37:.29);
    const ring=add(new T.TorusGeometry(rad,.049,10,48),'gold',[0,cy,0]);
    ring.rotation.y=.15;
    const ring2=add(new T.TorusGeometry(rad*.84,.026,9,44),
      attack?'black':'steel',[0,cy,0]);ring2.rotation.x=.49;
    // Visibly raised gilded crescents curl towards the floating gemstone.
    for(const side of [-1,1]){
      curve([[0,1.45,0],[side*.27,1.58,.0],
        [side*rad*.83,1.87,0],[side*rad,2.12,0],
        [side*rad*.71,2.43,0],[side*.12,2.57,0]],
        attack?.081:support?.055:.066,attack?'black':'gold');
      curve([[side*.03,1.57,.10],[side*rad*.71,1.83,.10],
        [side*rad*.88,2.23,.10],[side*.15,2.56,.10]],
        .022,'steel');
      gem(side*(rad+.10),cy,.02,.083,.17,.074);
      for(const face of [-1,1]){
        poly([[side*.08,1.51],[side*.24,1.66],
          [side*rad*.94,2.12],
          [side*.30,1.94]],.065,'gold',face*.095,.009);
      }
      // Diamond insets on the side forks.
      gem(side*rad*.86,2.23,.105,.061,.095,.033);
    }
    // Four supporting crystal points around the ring are proper octahedra.
    for(let i=0;i<4;i++){
      const angle=i*Math.PI/2,r=rad*.80;
      gem(Math.sin(angle)*r,cy+Math.cos(angle)*r,.09,.065,.114,.052);
    }
    for(const face of [-1,1]){
      poly([[-.26,1.50],[0,1.36],[.26,1.50],
        [.15,1.64],[0,1.59],[-.15,1.64]],.071,'gold',face*.117,.013);
      poly([[-.16,2.52],[0,2.80],[.16,2.52]],
        .066,'gold',face*.015,.009);
      gem(0,2.70,face*.075,.074,.12,.032);
    }
    if(attack){
      // Attack mage = sinister black flanged head and bright crimson heart.
      for(const side of [-1,1]){
        poly([[side*.39,1.68],[side*.85,1.91],
          [side*.65,2.08],[side*.43,1.97]],.17,'black',.0,.014);
        poly([[side*.38,2.16],[side*.82,2.52],
          [side*.45,2.41]],.14,'black',0,.012);
        for(const face of [-1,1]){
          pipe([side*.51,1.80,face*.16],
            [side*.65,2.00,face*.16],.016,'accent');
        }
      }
      gem(0,2.91,0,.10,.22,.10);
    }else if(support){
      // Support mage = orbital aureole, hanging chains and crystal pendants.
      const halo=add(new T.TorusGeometry(.72,.028,8,44),
        'accent',[0,cy,0]);halo.rotation.y=.26;
      for(const side of [-1,1]){
        pipe([side*.66,1.99,.04],
          [side*.74,1.30,.04],.018,'gold');
        gem(side*.74,1.25,.04,.090,.20,.068);
        for(const face of [-1,1]){
          // Short arcane cloth banners, genuinely shaped mesh surfaces.
          poly([[side*.50,1.74],[side*.54,1.12],
            [side*.74,1.27],[side*.69,1.79]],.011,
            'linen',face*.045,0);
          diamond(side*.61,1.52,face*.067,.035,.105);
        }
      }
      gem(0,2.98,.0,.11,.19,.098);
    }else{
      // Starting magic staff: modest floating blue crystal crest.
      gem(0,2.81,0,.092,.15,.079);
    }
  }
  if(k==='sword'||k==='greatsword'||k==='dual')sword();
  else if(k==='axe')axe();
  else if(k==='spear')spear();
  else if(k==='shield')shield();
  else if(k==='bow')bow();
  else if(k==='staff')staff();
  g.userData.jobWeapon=d.key;
  g.name=(d.name||d.key)+' 3D weapon';
  return g;
}
