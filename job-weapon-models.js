/* Genuine rotatable 3D geometry for NEXACRAFT class weapons.
 * Models consist of extruded bevelled polygon meshes, cylinders, ring meshes,
 * crystals, and fittings; they are NOT 2D billboards or image planes.
 */
export function makeDetailedJobWeapon(T,d){
  const g=new T.Group(),key=d.key,k=d.kind,rank=d.level||1;
  const royal=['warrior','swordmaster','axer','lancer'].includes(key);
  const scarlet=['berserker','battleMage','tank'].includes(key);
  const emerald=['swiftArcher','supportMage'].includes(key);
  const bright=scarlet?0xff475d:emerald?0x5be4bd:royal?0x45dfdb:0x9c91ff;
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
  // Long blades: all parts stay true volumetric 3D meshes, with a blade
  // bevel, darker spine, inset glowing runes and a real sculpted crossguard.
  function sword(){
    const huge=k==='greatsword',dual=k==='dual',elite=rank>=30;
    const L=huge?1.88:dual?(elite?1.03:.77):elite?1.28:1.04;
    const w=huge?.43:dual?(elite?.18:.13):elite?.225:.175;
    const y0=.30;
    wrap(-.28,.25,huge?.14:.105,huge?10:7);
    band(-.26,huge?.15:.115);band(.26,huge?.15:.12);
    gem(0,-.36,0,.095,.11,.09);
    const guard=huge?.68:dual?.31:.48;
    poly([[-guard,.29],[-guard*.85,.36],[-.15,.39],[0,.31],
      [.15,.39],[guard*.85,.36],[guard,.29],[guard*.84,.22],
      [.14,.23],[0,.17],[-.14,.23],[-guard*.84,.22]],.19,'gold',0,.017);
    gem(0,.30,.113,.085,.095,.035);
    gem(0,.30,-.113,.085,.095,.035);
    // Faceted blade profile has raised shoulders and a tapering point.
    const pts=[[-w*.84,y0],[-w,y0+.12],[-w*.93,y0+L*.72],
      [-w*.64,y0+L*.88],[0,y0+L],[w*.64,y0+L*.88],
      [w*.93,y0+L*.72],[w,y0+.12],[w*.84,y0]];
    poly(pts,huge?.21:.105,'blade',0,.018);
    const backStart=g.children.length;
    poly([[-w*.62,y0+.05],[-w*.57,y0+L*.79],[0,y0+L*.99],
      [w*.57,y0+L*.79],[w*.62,y0+.05]],huge?.15:.07,
      huge?'black':'steel',.085,.009);
    poly([[-w*.12,y0+.1],[0,y0+L*.90],[w*.12,y0+.1]],
      .012,'edge',.174,0);
    pipe([0,y0+.11,.187],[0,y0+L*.66,.187],.012,'accent',5);
    for(const t of [.27,.46,.61])diamond(0,y0+L*t,.201,w*.16,L*.042);
    if(huge){
      for(const sign of [-1,1]){
        poly([[sign*w*.78,y0+.24],[sign*w*1.10,y0+.30],
          [sign*w*.91,y0+.43]],.06,'gold',.1,.006);
      }
      rivets([-.18,.18],[y0+.14,y0+.45],.18);
    }else if(elite){
      poly([[-w*.5,y0+.32],[0,y0+.68],[w*.5,y0+.32]],.017,'gold',.177,.003);
    }
    if(dual&&elite){
      // Crimson asymmetric jagged outer blade spine for the Berserker.
      for(const sign of [-1,1])for(let i=0;i<3;i++){
        const y=y0+L*(.28+i*.18);
        poly([[sign*w*.89,y-.065],[sign*(w+.15),y+.035],
          [sign*w*.83,y+.12]],.065,'black',-.045,.007);
      }
      for(let i=0;i<3;i++)diamond(0,y0+L*(.19+i*.24),.215,.035,.08);
    }
    mirrorRear(backStart,'Sword rear raised bevels and luminous runes');
  }
  function axe(){
    wrap(-.55,.62,.096,10);band(-.55);band(.65);
    pipe([0,.53,0],[0,1.6,0],.087,'brown');
    [1.06,1.44].forEach(y=>band(y,.12));
    cube(.33,.38,.21,'black',0,1.5,0);
    // Split war-axe cutting edges: genuine curved polygon silhouettes.
    for(const side of [-1,1]){
      const pts=[[side*.13,1.26],[side*.31,1.44],[side*.43,1.82],
        [side*.79,2.02],[side*1.06,2.08],[side*.92,1.81],
        [side*.91,1.40],[side*1.06,1.17],[side*.73,1.23],
        [side*.44,1.33]];
      poly(pts,.17,'blade',0,.023);
      const backStart=g.children.length;
      poly([[side*.36,1.42],[side*.55,1.81],[side*.92,1.97],
        [side*.77,1.73],[side*.8,1.39]],.045,'black',.105,.01);
      poly([[side*.55,1.40],[side*.73,1.70],[side*.85,1.83],
        [side*.8,1.50]],.022,'gold',.144,.009);
      for(const y of [1.45,1.65])diamond(side*.62,y,.165,.029,.065);
      mirrorRear(backStart,'Battle-axe rear steel plating and runes');
    }
    poly([[-.31,1.43],[-.17,1.9],[0,2.05],
      [.17,1.9],[.31,1.43],[0,1.35]],.245,'black',.02,.02);
    gem(0,1.76,.17,.15,.19,.055);
    gem(0,1.76,-.17,.15,.19,.055);
    tip(0,2.11,.03,.17,.24);
    gem(0,-.63,0,.085,.10,.08);
  }
  function spear(){
    wrap(-.56,.75,.075,12);
    pipe([0,.62,0],[0,2.12,0],.069,'brown');
    for(const y of [-.57,.03,.70,1.15,1.79])band(y,.09);
    cylinder(.105,.105,.16,'gold',0,1.87,0,8);
    poly([[-.10,1.97],[-.20,2.15],[-.25,2.36],[0,3.08],
      [.25,2.36],[.20,2.15],[.10,1.97]],.13,'edge',0,.02);
    const backStart=g.children.length;
    poly([[-.085,2.09],[0,3.0],[.085,2.09]],.02,'steel',.087,.004);
    pipe([0,2.15,.115],[0,2.89,.112],.011,'accent',5);
    gem(0,2.22,.133,.09,.145,.03);
    mirrorRear(backStart,'Spearhead rear blade ridge and gem');
    for(const side of [-1,1]){
      poly([[0,1.98],[side*.34,2.07],[side*.29,2.26],
        [side*.19,2.12]],.13,'gold',0,.013);
      // The alternate shaft accents keep the silhouette legible at distance.
      poly([[0,.90],[side*.19,1.00],[side*.13,1.18]],.07,'steel',0,.009);
    }
    tip(0,-.75,0,.095,.19);
  }
  function shield(){
    const heavy=key==='heavy',tank=key==='tank',elite=rank>=30;
    const w=heavy?.87:tank?.76:elite?.65:.57;
    const ht=heavy?1.67:tank?1.52:elite?1.38:1.21;
    const top=ht*.52,bottom=-ht*.52;
    const polygon=heavy
      ?[[-w,top*.75],[-w*.78,top],[w*.78,top],[w,top*.75],
        [w,bottom*.6],[w*.74,bottom],[0,bottom-.10],[-w*.74,bottom],[-w,bottom*.6]]
      :[[-w*.77,top],[-w*.98,top*.78],[-w,0],[0,bottom],
        [w,0],[w*.98,top*.78],[w*.77,top]];
    poly(polygon,.27,'gold',.07,.035);
    const inset=polygon.map(([x,y])=>[x*.89,y*.90+.02]);
    poly(inset,.265,'steel',0,.023);
    const inner=polygon.map(([x,y])=>[x*.68,y*.77+.03]);
    poly(inner,.27,heavy?'black':elite?'blade':'black',-.012,.015);
    // Riveted layered backplate with genuine raised armor ribs.
    poly(polygon.map(([x,y])=>[x*.82,y*.84]),.05,'recessed',-.20,.01);
    for(const sign of [-1,1]){
      const x=sign*w*.68;
      poly([[x-sign*.09,top*.72],[x+sign*.09,top*.72],
        [x+sign*.09,bottom*.73],[x-sign*.09,bottom*.73]],
        .06,'gold',-.275,.01);
      rivets([sign*w*.60],[top*.53,.07,-.20,bottom*.59],-.325);
      poly([[sign*.21,top*.78],[sign*w*.69,top*.66],
        [sign*w*.64,top*.53],[sign*.20,top*.64]],.07,'steel',-.27,.01);
      poly([[sign*.21,bottom*.78],[sign*w*.69,bottom*.67],
        [sign*w*.64,bottom*.52],[sign*.20,bottom*.63]],.07,'steel',-.27,.01);
    }
    // Real shield grip on reverse face, not a painted motif.
    cube(.34,.44,.15,'brown',0,-.04,-.27);
    for(const y of [-.20,.21]){
      cube(w*.92,.08,.06,'brown',0,y,-.23);
      rivets([-w*.46,w*.46],[y],-.23);
    }
    // Front cross and raised metal armor plates.
    const z=.30;
    poly([[-.1,top*.82],[.10,top*.82],[.16,bottom*.81],
      [0,bottom*.96],[-.16,bottom*.81]],.074,'gold',z,.01);
    poly([[-w*.63,.11],[w*.63,.11],[w*.63,-.04],
      [-w*.63,-.04]],.063,'gold',z+.04,.009);
    gem(0,.06,z+.13,heavy?.16:.13,heavy?.19:.14,.065);
    if(heavy||tank){
      for(const x of [-w*.73,w*.73]){
        poly([[x-.10,top*.75],[x,top+(.12)],[x+.10,top*.75],
          [x+.12,bottom*.53],[x-.12,bottom*.53]],.08,'gold',.26,.014);
      }
      for(const x of [-w*.58,w*.58])for(const y of [top*.52,0,bottom*.51])bead(x,y,.33,.033);
    }
    if(tank){
      for(const x of [-w*.72,0,w*.72]){
        const spike=add(new T.ConeGeometry(.12,.29,6),'steel',[x,.11,.51]);
        spike.rotation.x=Math.PI/2;
      }
    }
  }
  function bow(){
    const powerful=key==='powerArcher',swift=key==='swiftArcher';
    const ht=powerful?1.66:swift?1.38:1.52,span=powerful?.60:swift?.39:.51;
    wrap(-.20,.20,.117,4);band(-.20,.135);band(.20,.135);
    // Two shaped recurved limbs with distinct riser profiles.
    for(const sy of [-1,1]){
      const vertices=[
        [-.045,.10],[span*.48,.30],[span*.88,.56],[span,.74],
        [span*.86,.90],[span*.66,1.04],[span*.70,1.15]
      ].map(([x,y])=>[x,sy*y*ht/1.5]);
      for(let i=1;i<vertices.length;i++){
        const [x1,y1]=vertices[i-1],[x2,y2]=vertices[i],t=i/vertices.length;
        pipe([x1,y1,0],[x2,y2,0],powerful?.105-t*.025:swift?.051:.069,
          i%2===0?'gold':'brown',10);
        pipe([x1+.03,y1,.025],[x2+.03,y2,.025],.017,'blade',7);
        pipe([x1+.03,y1,-.025],[x2+.03,y2,-.025],.017,'blade',7);
      }
      const [tipx,tipy]=vertices.at(-1);
      gem(tipx,tipy,.06,.055,.11,.048);
      pipe([tipx,tipy,0],[-.13,0,0],.012,'linen',6);
      const backStart=g.children.length;
      poly([[span*.31,sy*.36*ht],[span*.65,sy*.58*ht],
        [span*.69,sy*.72*ht],[span*.42,sy*.47*ht]],.08,'steel',.06,.008);
      mirrorRear(backStart,'Bow reverse limb armor');
    }
    cube(.12,.31,.17,'gold',0,0,0);
    gem(0,0,.12,.11,.10,.06);
    gem(0,0,-.12,.11,.10,.06);
    if(powerful)for(const y of [-.55,.55]){
      poly([[.33,y],[.57,y+.11],[.45,y+.22]],.085,'steel',.10,.007);
    }
  }
  function staff(){
    const attack=key==='battleMage',support=key==='supportMage',up=rank>=30;
    wrap(-.63,.16,.076,10);
    pipe([0,.05,0],[0,1.50,0],.065,attack?'black':'brown');
    for(const y of [-.58,-.02,.53,1.10,1.42])band(y,.10);
    tip(0,-.84,0,.085,.20);
    const centerY=1.83,crystalSize=up?.37:.29;
    // Magic cage: sculpted curved prongs around a genuine 3D faceted gem.
    const core=add(new T.OctahedronGeometry(1),'accent',[0,centerY,0]);
    core.scale.set(attack?.30:crystalSize,attack?.57:.46,crystalSize*.9);
    const ringR=support?.65:attack?.50:.47;
    const ring=add(new T.TorusGeometry(ringR,up?.034:.025,8,44),'gold',[0,centerY,0]);
    ring.rotation.y=.15;
    const ring2=add(new T.TorusGeometry(ringR*.88,.021,8,40),'steel',[0,centerY,0]);
    ring2.rotation.x=.54;
    for(const side of [-1,1]){
      curve([[0,1.36,0],[side*.29,1.54,.0],[side*ringR,1.91,0],
        [side*.27,2.20,0],[side*.06,2.37,0]],attack?.065:.046,
        attack?'black':'gold');
      gem(side*(ringR+.08),centerY,.04,.075,.15,.065);
    }
    const backStart=g.children.length;
    for(const y of [1.53,2.12]){
      poly([[-.13,y],[0,y+.13],[.13,y]],.065,'gold',.15,.008);
    }
    mirrorRear(backStart,'Magic staff rear metalwork');
    if(attack){
      // Sinister black fangs and additional red spines.
      for(const side of [-1,1]){
        poly([[side*.34,1.45],[side*.77,1.67],[side*.48,1.78]],.12,'black',.01,.013);
        poly([[side*.43,1.93],[side*.72,2.20],[side*.30,2.09]],.10,'black',-.04,.012);
      }
      gem(0,2.30,.03,.09,.20,.10);
    }else if(support){
      for(const side of [-1,1]){
        pipe([side*.48,1.81,.01],[side*.56,1.21,.01],.012,'gold',6);
        gem(side*.56,1.18,0,.065,.15,.047);
        poly([[side*.26,1.44],[side*.33,.85],
          [side*.55,1.06],[side*.48,1.50]],.009,'linen',0,0);
      }
      gem(0,2.38,0,.08,.20,.08);
    }else{
      gem(0,2.34,0,.075,.15,.065);
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
