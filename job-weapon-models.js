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
    let outline;
    if(heavy){
      outline=[[-w*.77,top+.17],[-w,top*.70],[-w,bottom*.73],
        [-w*.62,bottom],[0,bottom-.19],[w*.62,bottom],
        [w,bottom*.73],[w,top*.70],[w*.77,top+.17],
        [w*.28,top*.96],[0,top+.27],[-w*.28,top*.96]];
    }else if(tank){
      outline=[[-w*.73,top+.10],[-w*1.06,top*.63],
        [-w,0],[-w*.77,bottom*.77],[0,bottom-.20],
        [w*.77,bottom*.77],[w,0],[w*1.06,top*.63],
        [w*.73,top+.10],[0,top+.23]];
    }else if(elite){
      outline=[[-w*.63,top+.07],[-w,top*.67],
        [-w*.94,-.05],[-w*.69,bottom*.70],[0,bottom-.13],
        [w*.69,bottom*.70],[w*.94,-.05],
        [w,top*.67],[w*.63,top+.07],[0,top+.20]];
    }else{
      outline=[[-w*.65,top],[-w,top*.69],[-w*.96,-.10],
        [0,bottom-.07],[w*.96,-.10],[w,top*.69],[w*.65,top]];
    }
    const shape=(pts,scaleX=1,scaleY=1)=>pts.map(([x,y])=>[x*scaleX,y*scaleY]);
    poly(outline,.31,'gold',.015,.031);
    poly(shape(outline,.92,.93),.32,'black',.017,.022);
    poly(shape(outline,.86,.86),.38,'steel',-.006,.016);
    // Faceted back is dark metal, NOT a copy of the front decoration.
    poly(shape(outline,.82,.85),.10,'recessed',-.20,.011);
    for(const sy of [-1,1]){
      for(const y of [-.30,.27]){
        poly([[sy*w*.22,y+.06],[sy*w*.70,y+.09],
          [sy*w*.72,y-.07],[sy*w*.21,y-.08]],
          .045,'gold',-.278,.006);
        bead(sy*w*.58,y,-.307,.038,'steel');
      }
      const x=sy*w*.71;
      poly([[x-.06,top*.77],[x+.06,top*.77],
        [x+.08,bottom*.69],[x-.08,bottom*.69]],
        .068,'black',-.277,.008);
      for(const y of [top*.55,.02,bottom*.53])bead(x,y,-.33,.039,'gold');
    }
    // Hand grip and leather straps visible from back when rotating.
    cube(.35,.49,.11,'leather',0,-.03,-.33);
    for(const y of [-.21,.21]){
      cube(w*1.00,.105,.10,'brown',0,y,-.37);
      for(const x of [-w*.50,w*.50])bead(x,y,-.43,.035,'gold');
    }
    // Large front central ridge and separate raised defensive plates.
    for(const face of [1]){
      const z=.25;
      poly([[-.12,top*.94],[0,top+(.14)],[.12,top*.94],
        [.19,bottom*.75],[0,bottom-.11],
        [-.19,bottom*.75]],.099,'gold',z,.010);
      poly([[-.071,top*.75],[.071,top*.75],
        [.10,bottom*.71],[0,bottom*.98],
        [-.10,bottom*.71]],.027,'black',z+.072,.007);
      pipe([0,top*.68,z+.117],[0,bottom*.76,z+.117],.017,'accent');
      poly([[-w*.78,.13],[w*.78,.13],
        [w*.64,-.047],[-w*.64,-.047]],.084,'gold',z,.011);
      // Split flank plates are fully extruded and overlap the centerplate.
      for(const side of [-1,1]){
        poly([[side*.18,top*.79],[side*w*.78,top*.72],
          [side*w*.81,top*.37],[side*w*.56,.12],
          [side*.18,.03]],.070,
          heavy?'blade':elite?'steel':'black',z+.016,.015);
        poly([[side*.21,bottom*.05],[side*w*.56,-.08],
          [side*w*.83,bottom*.49],[side*w*.62,bottom*.79],
          [side*.20,bottom*.76]],.074,
          heavy?'blade':'steel',z+.019,.012);
        for(const y of [top*.52,-.09,bottom*.48])
          bead(side*w*.68,y,z+.111,.034);
        // Gold-painted actual raised linear ribs.
        pipe([side*w*.76,top*.56,z+.116],
          [side*w*.70,bottom*.63,z+.119],.028,'gold');
      }
      // Jewel is enclosed inside an extruded diamond-shaped setting.
      poly([[0,.34],[.24,.075],[0,-.20],[-.24,.075]],
        .082,'gold',z+.10,.015);
      poly([[0,.25],[.15,.075],[0,-.11],[-.15,.075]],
        .045,'recessed',z+.173,.006);
      gem(0,.072,z+.206,heavy?.146:.11,heavy?.182:.136,.049);
      for(const y of [.44,-.40])diamond(0,y,z+.127,.050,.085);
    }
    if(heavy){
      // Tower shield really is tall, thick and almost full-body width.
      for(const side of [-1,1]){
        const x=side*w*.83;
        poly([[x-.14,top*.77],[x,top+.26],
          [x+.14,top*.77],[x+.12,bottom*.68],
          [x,bottom*.86],[x-.12,bottom*.68]],.12,'gold',.265,.016);
        for(const y of [top*.56,0,bottom*.56])bead(x,y,.36,.043,'black');
      }
      poly([[-w*.35,top*.92],[0,top+.37],
        [w*.35,top*.92]],.12,'gold',.28,.012);
      gem(0,top+.21,.36,.098,.14,.037);
    }else if(elite){
      // Noble parrying shield: arched crest and winged corner flanges.
      for(const side of [-1,1]){
        poly([[side*.25,top*.74],[side*w*.96,top+.10],
          [side*w*.74,top*.41],[side*.30,top*.32]],
          .10,'gold',.28,.012);
        diamond(side*.37,top*.47,.38,.056,.086);
      }
    }else if(tank){
      // Offensive tank shield protrusions differ from massive tower shield.
      for(const x of [-w*.69,0,w*.69]){
        const spike=add(new T.ConeGeometry(.148,.46,8),'steel',[x,.14,.61]);
        spike.rotation.x=Math.PI/2;
        cylinder(.13,.13,.12,'gold',x,.14,.40,8).rotation.x=Math.PI/2;
      }
      for(const side of [-1,1]){
        poly([[side*w*.80,top*.78],[side*(w+.20),top*.47],
          [side*w*.96,top*.35]],.13,'black',.21,.013);
      }
    }else{
      // Small starting shield includes two wood-grain inset panels.
      for(const side of [-1,1]){
        poly([[side*.20,top*.48],[side*w*.60,top*.52],
          [side*w*.58,bottom*.44],[side*.19,bottom*.37]],
          .019,'brown',.37,.005);
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
