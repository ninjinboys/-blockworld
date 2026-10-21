/* NEXACRAFT: eight reference-sheet matched REAL 3D class weapons.
 * Structural polygon extrusion, rear relief and physically raised detailing.
 * The player-supplied orthographic sheets are design references, not textures.
 */
const TARGETS=new Set(['sword','warrior','axer','lancer','berserker','heavy','archer','mage']);
export function makeReferenceWeapon(T,d){
 if(!TARGETS.has(d.key))return null;
 const g=new T.Group(),name=d.key;
 const cyan=0x36ead6,red=0xff304e,purple=0x9974ff;
 const glow=name==='berserker'?red:name==='mage'?purple:cyan;
 const M={
  iron:new T.MeshStandardMaterial({color:0x777c81,metalness:.87,roughness:.36,side:T.DoubleSide}),
  silver:new T.MeshStandardMaterial({color:0xbcc7cc,metalness:.85,roughness:.28,side:T.DoubleSide}),
  edge:new T.MeshStandardMaterial({color:0xe4e9e6,metalness:.88,roughness:.25,side:T.DoubleSide}),
  graphite:new T.MeshStandardMaterial({color:0x30383c,metalness:.78,roughness:.39,side:T.DoubleSide}),
  inset:new T.MeshStandardMaterial({color:0x151e26,metalness:.50,roughness:.43,side:T.DoubleSide}),
  bronze:new T.MeshStandardMaterial({color:0x987450,metalness:.82,roughness:.33,side:T.DoubleSide}),
  gild:new T.MeshStandardMaterial({color:0xc5a16e,metalness:.86,roughness:.27,side:T.DoubleSide}),
  leather:new T.MeshStandardMaterial({color:0x342721,roughness:.91,side:T.DoubleSide}),
  wrap:new T.MeshStandardMaterial({color:0x5a4437,roughness:.87,side:T.DoubleSide}),
  light:new T.MeshStandardMaterial({color:glow,metalness:.36,roughness:.19,emissive:glow,emissiveIntensity:.84,side:T.DoubleSide}),
  crystal:new T.MeshStandardMaterial({color:glow,metalness:.13,roughness:.12,emissive:glow,emissiveIntensity:.56,transparent:false,side:T.DoubleSide})
 };
 const add=(geo,mat,x=0,y=0,z=0)=>{
  const m=new T.Mesh(geo,M[mat]);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;g.add(m);return m;
 };
 const prism=(pts,depth,mat,z=0,bevel=.009)=>{
  const shape=new T.Shape();shape.moveTo(pts[0][0],pts[0][1]);
  for(let i=1;i<pts.length;i++)shape.lineTo(pts[i][0],pts[i][1]);shape.closePath();
  return add(new T.ExtrudeGeometry(shape,{depth,steps:1,bevelEnabled:bevel>0,bevelThickness:bevel,bevelSize:bevel,bevelSegments:2}),mat,0,0,z-depth/2);
 };
 const rod=(a,b,r,mat,segments=9)=>{
  const p=new T.Vector3(...a),q=new T.Vector3(...b),vec=q.clone().sub(p);
  const m=add(new T.CylinderGeometry(r,r,vec.length(),segments),mat,(p.x+q.x)/2,(p.y+q.y)/2,(p.z+q.z)/2);
  m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),vec.normalize());return m;
 };
 const curve=(pts,r,mat)=>{
  const c=new T.CatmullRomCurve3(pts.map(p=>new T.Vector3(...p)));
  return add(new T.TubeGeometry(c,Math.max(16,pts.length*9),r,7,false),mat);
 };
 const cube=(w,h,dep,mat,x,y,z)=>add(new T.BoxGeometry(w,h,dep),mat,x,y,z);
 const gem=(x,y,z,sx=.09,sy=.15,sz=.07,mat='crystal')=>{
  const m=add(new T.OctahedronGeometry(1,0),mat,x,y,z);m.scale.set(sx,sy,sz);return m;
 };
 const diamond=(x,y,z,wx,hy,mat='gild',depth=.03)=>prism([[x,y+hy],[x+wx,y],[x,y-hy],[x-wx,y]],depth,mat,z,.002);
 const trim=(a,b,z,mat='gild',r=.012)=>rod([a[0],a[1],z],[b[0],b[1],z],r,mat,6);
 const rivet=(x,y,z)=>add(new T.SphereGeometry(.025,8,6),'bronze',x,y,z);
 function grip(y0,y1,r=.11,turns=10){
  add(new T.CylinderGeometry(r,r,y1-y0,12),'leather',0,(y0+y1)/2,0);
  const pts=[];
  for(let i=0;i<=turns*8;i++){
   const t=i/(turns*8),a=t*turns*Math.PI*2;
   pts.push([(r+.006)*Math.sin(a),y0+t*(y1-y0),(r+.006)*Math.cos(a)]);
  }
  curve(pts,.010,'wrap');
  for(const y of [y0+.035,y1-.025]){
   add(new T.CylinderGeometry(r*1.32,r*1.32,.055,12),'bronze',0,y,0);
   add(new T.CylinderGeometry(r*1.12,r*1.12,.012,12),'gild',0,y+.035,0);
  }
 }
 function pommel(y,scale=1,colour='crystal'){
  prism([[-.14*scale,y+.12*scale],[0,y+.22*scale],[.14*scale,y+.12*scale],
   [.19*scale,y-.095*scale],[0,y-.25*scale],[-.19*scale,y-.095*scale]],.20*scale,'bronze');
  for(const side of [-1,1]){
   diamond(0,y-.015*scale,side*.125*scale,.11*scale,.14*scale,'graphite',.034);
   gem(0,y-.018*scale,side*.153*scale,.066*scale,.105*scale,.041*scale,colour);
  }
 }
 function layeredBlade(outline,halfWidth,start,tip,thickness,serrated=false){
  prism(outline,thickness,'iron',0,.012);
  for(const face of [-1,1]){
   const base=face*(thickness/2+.019),upper=face*(thickness/2+.046);
   // Forged, separate raised edge bevels on the two opposing faces.
   for(const sign of [-1,1]){
    prism([[sign*halfWidth*.90,start+.06],[sign*halfWidth*.96,start+.35],
     [sign*halfWidth*.97,tip-.42],[sign*halfWidth*.77,tip-.16],
     [sign*halfWidth*.55,tip-.39],[sign*halfWidth*.61,start+.31]],
     .034,'silver',base,.004);
    trim([sign*halfWidth*.75,start+.30],[sign*halfWidth*.80,tip-.29],upper,'edge',.010);
   }
   prism([[-halfWidth*.45,start+.11],[-halfWidth*.36,tip-.53],[0,tip-.18],
    [halfWidth*.36,tip-.53],[halfWidth*.45,start+.11]],.032,'graphite',base+face*.033,.004);
   prism([[-halfWidth*.27,start+.18],[-halfWidth*.20,tip-.53],
    [0,tip-.29],[halfWidth*.20,tip-.53],[halfWidth*.27,start+.18]],
    .014,'inset',base+face*.052,.002);
   // Inlaid enamel runes with diamonds interrupting continuous channels.
   const z=face*(thickness/2+.120);
   curve([[0,start+.11,z],[0,start+.46,z],[0,tip-.61,z]],.012,'light');
   for(const frac of [.25,.50,.70]){
    const y=start+(tip-start)*frac,sz=frac===.50?.080:.039;
    diamond(0,y,z,sz,sz*1.75,'gild',.016);
    gem(0,y,z+face*.033,sz*.54,sz*.88,.022);
   }
   for(const sign of [-1,1]){
    trim([0,start+(tip-start)*.46,z],[sign*.087,start+(tip-start)*.54,z],z,'light',.008);
   }
   // Etched seams are deliberately visible on the reverse face.
   for(let i=0;i<7;i++){
    const y=start+.23+i*(tip-start-.64)/7,x=(i%2?1:-1)*halfWidth*.77;
    trim([x,y],[x*.81,y+.075],upper,'edge',.004);
   }
  }
  if(serrated){
   for(const side of [-1,1])for(const y of [start+.43,start+.73,start+1.02]){
    prism([[side*halfWidth*.91,y-.10],[side*halfWidth*1.20,y],
      [side*halfWidth*.90,y+.11]],.10,'graphite',0,.010);
   }
  }
 }
 function guard(y,span,depth=.27){
  const shape=[[-span,y+.03],[-span*.94,y+.23],[-span*.73,y+.15],
   [-.23,y+.16],[0,y+.33],[.23,y+.16],[span*.73,y+.15],
   [span*.94,y+.23],[span,y+.03],[span*.86,y-.11],
   [span*.61,y-.035],[.18,y-.065],[0,y-.18],
   [-.18,y-.065],[-span*.61,y-.035],[-span*.86,y-.11]];
  prism(shape,depth,'bronze',0,.023);
  for(const f of [-1,1]){
   prism(shape.map(([x,v])=>[x*.90,y+(v-y)*.69]),.031,'gild',
    f*(depth/2+.034),.008);
   for(const side of [-1,1]){
    prism([[side*.17,y+.12],[side*span*.77,y+.10],
     [side*span*.91,y+.20],[side*span*.75,y-.01],
     [side*.20,y+.01]],.032,'graphite',f*(depth/2+.058),.005);
    rivet(side*span*.84,y+.09,f*(depth/2+.09));
   }
   diamond(0,y+.065,f*(depth/2+.105),.184,.255,'gild',.066);
   diamond(0,y+.065,f*(depth/2+.149),.135,.195,'graphite',.034);
   gem(0,y+.065,f*(depth/2+.19),.10,.14,.040);
  }
 }
 function sword(great){
  const start=.47,top=great?3.28:3.06,w=great?.51:.325;
  grip(great?-.79:-.65,.20,great?.142:.113,great?12:9);
  pommel(great?-.93:-.79,great?1.14:.93);
  // Distinct heavy cleaver point vs narrower, piercing Swordsman profile.
  const sil=great
    ?[[-w*.82,start],[-w*.98,start+.24],[-w*.93,start+.46],[-w*1.05,start+.63],
      [-w*1.04,top-.72],[-w*1.24,top-.40],[-w*.93,top-.13],
      [0,top],[w*.93,top-.13],[w*1.24,top-.40],
      [w*1.04,top-.72],[w*1.05,start+.63],[w*.93,start+.46],[w*.98,start+.24],[w*.82,start]]
    :[[-w*.75,start],[-w*.98,start+.26],[-w*.92,start+.56],
      [-w*1.04,top-.78],[-w*.84,top-.38],[0,top],
      [w*.84,top-.38],[w*1.04,top-.78],[w*.92,start+.56],[w*.98,start+.26],[w*.75,start]];
  layeredBlade(sil,w,start,top,great?.32:.205);
  guard(.32,great?.79:.64,great?.32:.25);
 }
 function axe(){
  // Two opposing deep hollow-backed crescents, not flat triangles.
  grip(-.85,.40,.125,13);pommel(-1.02,1.18);
  rod([0,.35,0],[0,1.93,0],.119,'leather',12);
  for(const y of [.45,.92,1.37]){
   add(new T.CylinderGeometry(.164,.164,.055,12),'bronze',0,y,0);
   for(const f of [-1,1]){gem(0,y,f*.13,.061,.083,.027);}
  }
  prism([[-.22,1.30],[0,1.20],[.22,1.30],
    [.28,1.99],[0,2.30],[-.28,1.99]],.28,'graphite',0,.02);
  for(const s of [-1,1]){
   const blade=[[s*.18,1.28],[s*.42,1.48],[s*.66,1.44],
    [s*.94,1.30],[s*1.19,1.29],[s*1.05,1.55],
    [s*.92,1.90],[s*1.02,2.12],[s*1.18,2.29],
    [s*.86,2.23],[s*.54,2.07],[s*.29,1.93]];
   prism(blade,.30,'silver',0,.017);
   for(const f of [-1,1]){
    prism([[s*.23,1.43],[s*.52,1.54],[s*.81,1.52],
     [s*.83,1.89],[s*.94,2.16],[s*.60,2.04],[s*.32,1.85]],
      .065,'graphite',f*.173,.010);
    prism([[s*.65,1.52],[s*.89,1.44],[s*.90,1.83],
      [s*.98,2.15],[s*.79,2.07]],.025,'iron',f*.216,.003);
    curve([[s*.41,1.57,f*.225],[s*.65,1.68,f*.225],
      [s*.62,1.93,f*.225]],.018,'light');
    for(const y of [1.63,1.94]){
     diamond(s*.59,y,f*.240,.055,.079,'gild',.024);
     gem(s*.59,y,f*.266,.026,.049,.021);
    }
   }
  }
  prism([[-.31,1.40],[0,1.25],[.31,1.40],
   [.33,1.78],[.20,2.07],[0,2.28],
   [-.20,2.07],[-.33,1.78]],.37,'bronze',0,.020);
  for(const f of [-1,1]){
   diamond(0,1.75,f*.22,.21,.31,'graphite',.053);
   diamond(0,1.75,f*.261,.153,.23,'gild',.035);
   gem(0,1.75,f*.297,.120,.175,.052);
   trim([-.23,1.46],[0,1.32],f*.24);trim([.23,1.46],[0,1.32],f*.24);
  }
 }
 function spear(){
  // Long proportional wooden-and-black-steel shaft, winged brass socket.
  grip(-.84,.62,.076,17);
  rod([0,.58,0],[0,2.55,0],.071,'graphite',12);
  for(const y of [-.79,-.27,.25,.67,1.17,1.71,2.22,2.49])
   add(new T.CylinderGeometry(.105,.105,.055,12),'bronze',0,y,0);
  for(const f of [-1,1]){
   prism([[-.067,1.14],[-.085,1.82],[0,1.91],[.085,1.82],[.067,1.14]],
    .036,'bronze',f*.082,.006);
   trim([0,1.20],[0,1.85],f*.116,'light');
   for(const y of [1.18,1.87,2.18])gem(0,y,f*.123,.047,.071,.026);
  }
  prism([[-.18,2.48],[-.24,2.72],[-.32,3.05],
   [-.21,3.43],[0,4.01],[.21,3.43],
   [.32,3.05],[.24,2.72],[.18,2.48]],.22,'silver',0,.018);
  for(const f of [-1,1]){
   prism([[-.11,2.62],[-.16,2.95],[0,3.90],
    [.16,2.95],[.11,2.62]],.038,'graphite',f*.135,.008);
   prism([[-.042,2.70],[0,3.83],[.042,2.70]],.017,'inset',f*.162,.003);
   trim([0,2.78],[0,3.66],f*.181,'light',.016);
   gem(0,2.73,f*.206,.086,.117,.042);
   for(const y of [3.00,3.37])gem(0,y,f*.196,.034,.070,.018);
  }
  for(const s of [-1,1]){
   prism([[s*.07,2.51],[s*.42,2.66],[s*.52,2.89],
    [s*.32,2.81],[s*.18,2.93],[s*.08,2.80]],.16,'bronze',0,.018);
   for(const f of [-1,1])gem(s*.32,2.71,f*.100,.049,.072,.035);
  }
  prism([[-.13,-.79],[-.17,-.95],[0,-1.30],
   [.17,-.95],[.13,-.79]],.17,'iron',0,.01);
  for(const f of [-1,1])gem(0,-.91,f*.11,.066,.093,.034);
 }
 function dual(){
  // One of TWO separately held Berserker blades; serrations are mesh geometry.
  grip(-.54,.18,.113,9);pommel(-.69,.88);
  const base=.38,top=2.13;
  const outline=[[-.24,base],[-.40,base+.22],[-.35,base+.40],
    [-.49,base+.57],[-.39,base+.76],[-.53,base+.93],
    [-.42,base+1.12],[-.56,base+1.34],[-.41,top-.26],
    [-.12,top],[.18,top-.14],[.42,top-.36],
    [.36,base+.89],[.30,base+.42],[.22,base]];
  prism(outline,.24,'silver',0,.014);
  for(const f of [-1,1]){
   prism([[-.19,base+.13],[-.33,base+.46],
    [-.29,base+.90],[-.42,base+1.32],
    [-.13,top-.16],[.22,top-.37],[.16,base+.12]],
    .043,'graphite',f*.144,.009);
   prism([[-.08,base+.13],[-.18,base+.51],
    [-.21,base+1.04],[-.15,top-.23],
    [.04,top-.44],[.04,base+.14]],.023,'inset',f*.18,.003);
   curve([[0,base+.07,f*.224],[-.08,base+.61,f*.224],
    [-.20,base+1.21,f*.224],[-.12,top-.35,f*.224]],.020,'light');
   for(const y of [base+.47,base+.86,base+1.30]){
    diamond(-.105,y,f*.239,.065,.09,'bronze',.024);
    gem(-.105,y,f*.263,.039,.052,.026);
   }
  }
  for(const y of [base+.39,base+.71,base+1.04,base+1.38]){
   prism([[-.35,y-.12],[-.62,y+.045],[-.42,y+.16]],
    .16,'iron',0,.012);
  }
  const gy=.30;
  prism([[-.66,gy+.13],[-.54,gy+.35],[-.29,gy+.17],
    [0,gy+.38],[.27,gy+.21],[.60,gy+.37],
    [.69,gy+.12],[.48,gy-.09],[0,gy-.19],[-.45,gy-.09]],
    .31,'bronze',0,.022);
  for(const f of [-1,1]){
   diamond(0,gy+.075,f*.195,.205,.266,'graphite',.054);
   gem(0,gy+.075,f*.238,.133,.172,.055);
   for(const s of [-1,1]){
    prism([[s*.26,gy+.16],[s*.59,gy+.31],
     [s*.47,gy+.04]],.061,'graphite',f*.19,.007);
   }
  }
 }
 function shield(){
  // 2026-10-21 orthographic Heavy Soldier TOWER SHIELD.
  // All five depths are physical closed/raised 3D mesh geometry.
  // Front reference: three cathedral finials, dark vertical energy trench,
  // overlapping long silver panels, stepped gold edge, pointed lower prow.
  // Back reference: black riveted shell, buttresses, TWO leather cross grips.
  const edge=[
    [-.74,.89],[-.77,1.13],[-.60,1.34],[-.46,1.01],
    [-.29,1.08],[0,1.54],[.29,1.08],[.46,1.01],
    [.60,1.34],[.77,1.13],[.74,.89],
    [.89,.76],[.87,-.64],[.69,-1.12],[.32,-1.42],
    [0,-1.58],[-.32,-1.42],[-.69,-1.12],[-.87,-.64],[-.89,.76]
  ];
  const scaled=(p,sx,sy)=>p.map(([x,y])=>[x*sx,y*sy]);
  const profile=(points,th,mat,z,bevel=.014)=>prism(points,th,mat,z,bevel);
  const mirrored=(pts,s)=>pts.map(([x,y])=>[s*x,y]);
  const panel=(points,mat,z,th=.07)=>profile(points,th,mat,z,.007);
  const line=(a,b,z,mat='gild',r=.012)=>trim(a,b,z,mat,r);
  // Full-depth enclosed metal core. Size retains tower proportions:
  // ~1.8 units wide, ~3.1 units tall and ~0.50 units thick.
  profile(edge,.48,'bronze',0,.026);
  profile(scaled(edge,.960,.965),.49,'graphite',.005,.018);
  profile(scaled(edge,.907,.940),.50,'iron',.015,.012);
  profile(scaled(edge,.856,.907),.504,'graphite',.026,.007);
  // Separate dark inset creates a structural negative-space look.
  for(const s of [-1,1]){
    // Side profile: fully extruded bronze guard gives a thick side wall,
    // plus bronze/silver nose plates proud of the shield's front face.
    panel(mirrored([[.76,.83],[.91,.78],[.92,-.64],
     [.70,-1.16],[.59,-1.21],[.79,-.57]],s),'bronze',.300,.19);
    panel(mirrored([[.79,.61],[.84,.55],[.85,-.60],
     [.67,-1.06],[.64,-.94],[.78,-.45]],s),'graphite',.415,.082);
    panel(mirrored([[.80,.39],[.85,.27],[.85,-.57],
     [.68,-.98],[.67,-.81],[.78,-.44]],s),'silver',.463,.046);
    // Side glimmer runs behind overlapping lower steel plates.
    line([s*.72,.28],[s*.75,-.71],.501,'light',.013);
    // Pointed bronze side finial, three-dimensional with cyan inset.
    panel(mirrored([[.44,.99],[.56,1.21],[.63,1.43],
     [.76,1.10],[.86,.92],[.72,.73],[.54,.81]],s),'bronze',.378,.19);
    panel(mirrored([[.55,1.10],[.63,1.32],[.70,1.09],
     [.64,.93]],s),'inset',.496,.06);
    gem(s*.635,1.119,.544,.057,.133,.052);
    line([s*.60,1.31],[s*.65,1.02],.555,'gild',.010);
    // Thick broad shoulder support connecting crown to side wall.
    panel(mirrored([[.29,.94],[.58,.99],[.83,.77],
      [.70,.53],[.43,.49],[.22,.69]],s),'bronze',.370,.104);
    panel(mirrored([[.33,.88],[.55,.92],[.73,.75],
      [.65,.61],[.40,.57],[.26,.69]],s),'graphite',.436,.060);
    line([s*.32,.86],[s*.68,.72],.477,'gild',.022);
    // The two main tall silver armor plates are separately forged,
    // thickness-stepped, faceted and divided by real dark gaps.
    const topArmor=[[.23,.68],[.46,.83],[.66,.69],[.64,.14],
      [.54,-.20],[.37,-.32],[.17,-.23],[.19,.25]];
    panel(mirrored(topArmor,s),'graphite',.385,.15);
    panel(mirrored([[.26,.60],[.46,.73],[.57,.62],[.58,.18],
      [.49,-.10],[.36,-.22],[.24,-.16],[.25,.30]],s),'silver',.488,.074);
    panel(mirrored([[.31,.56],[.45,.64],[.49,.53],[.50,.14],
      [.42,-.08],[.34,-.13]],s),'iron',.543,.023);
    // Long seam following the bevel of each upper protective plate.
    line([s*.29,.54],[s*.30,-.10],.564,'edge',.011);
    line([s*.56,.57],[s*.55,.18],.541,'gild',.010);
    for(const p of [[.45,.66],[.51,-.13]])rivet(s*p[0],p[1],.560);
    // Lower armored halves form long tapered breastplates.
    panel(mirrored([[.16,-.29],[.34,-.23],[.61,-.30],
      [.67,-.79],[.51,-1.23],[.23,-1.41],[.11,-1.10]],s),
      'graphite',.382,.155);
    panel(mirrored([[.21,-.34],[.39,-.29],[.57,-.38],
      [.60,-.79],[.46,-1.13],[.23,-1.29],[.17,-1.09]],s),
      'silver',.477,.089);
    panel(mirrored([[.23,-.42],[.42,-.39],[.50,-.50],
      [.51,-.85],[.39,-1.05],[.25,-1.13]],s),'iron',.540,.022);
    line([s*.28,-.48],[s*.25,-1.13],.563,'edge',.012);
    line([s*.52,-.45],[s*.52,-.79],.548,'gild',.012);
    for(const p of [[.49,-.44],[.45,-1.12]])rivet(s*p[0],p[1],.548);
    // Overlapping faceted lower end guards and pointed bronze corners.
    panel(mirrored([[.52,-.90],[.72,-.72],[.85,-.79],
      [.79,-1.04],[.61,-1.32],[.29,-1.48],[.37,-1.25]],s),
      'bronze',.387,.133);
    panel(mirrored([[.55,-.92],[.71,-.79],[.76,-.83],
      [.72,-1.02],[.53,-1.23],[.37,-1.35],[.42,-1.22]],s),
      'silver',.462,.073);
    for(const y of [-.16,-.57,-.95])rivet(s*.79,y,.468);
  }
  // Central uninterrupted recessed black strip, engineered to sit visibly
  // BETWEEN the side plates rather than flush with their surface.
  panel([[-.21,.95],[0,1.26],[.21,.95],[.175,-1.31],
    [0,-1.55],[-.175,-1.31]],'bronze',.422,.108);
  panel([[-.142,.84],[0,1.15],[.142,.84],[.119,-1.31],
    [0,-1.47],[-.119,-1.31]],'graphite',.486,.071);
  panel([[-.078,.76],[0,.91],[.078,.76],[.075,-1.23],
    [0,-1.38],[-.075,-1.23]],'inset',.532,.033);
  // Fluorescent turquoise line and forked geometric circuitry.
  curve([[0,.74,.560],[0,.39,.560],[0,-.18,.560],
    [0,-.89,.560],[0,-1.23,.560]],.015,'light');
  for(const [y,size] of [[.16,.13],[-.34,.095],[-.72,.073]]){
    diamond(0,y,.582,size*.69,size,'bronze',.042);
    diamond(0,y,.620,size*.48,size*.75,'light',.025);
    for(const s of [-1,1]){
      line([0,y+.11],[s*.066,y+.20],.608,'light',.009);
      line([s*.066,y+.20],[0,y+.28],.608,'light',.007);
    }
  }
  // Cathedral crest in front of the shell, its silhouette has THREE
  // distinct upward finials, a V-shaped nested central frame and both
  // a small apex gem and a big diamond at the heart of the crown.
  panel([[-.73,.87],[-.45,1.07],[-.26,1.13],[0,1.56],
    [.26,1.13],[.45,1.07],[.73,.87],
    [.55,.77],[.30,.86],[0,.60],[-.30,.86],[-.55,.77]],
    'bronze',.535,.16);
  panel([[-.60,.87],[-.35,1.04],[-.22,1.10],[0,1.45],
    [.22,1.10],[.35,1.04],[.60,.87],
    [.46,.85],[.21,.93],[0,.75],[-.21,.93],[-.46,.85]],
    'gild',.640,.065);
  panel([[-.20,1.02],[0,1.41],[.20,1.02],
    [.17,.84],[0,.65],[-.17,.84]],'graphite',.693,.072);
  diamond(0,.984,.756,.205,.295,'bronze',.081);
  diamond(0,.984,.805,.153,.220,'inset',.047);
  gem(0,.993,.861,.125,.175,.065);
  // Upper smallest diamond in its own raised cathedral apex.
  diamond(0,1.384,.749,.080,.125,'bronze',.052);
  gem(0,1.390,.790,.049,.087,.042);
  for(const s of [-1,1]){
    line([s*.23,1.06],[s*.49,.923],.702,'bronze',.022);
    line([s*.27,.92],[s*.53,.85],.725,'gild',.012);
    rivet(s*.49,.916,.710);
  }
  // Triangular bottom crest with a clear separate turquoise gem.
  panel([[-.33,-1.30],[0,-1.61],[.33,-1.30],
    [.20,-1.16],[0,-1.41],[-.20,-1.16]],'bronze',.474,.15);
  panel([[-.20,-1.34],[0,-1.53],[.20,-1.34],
    [0,-1.42]],'graphite',.571,.060);
  diamond(0,-1.397,.608,.118,.173,'gild',.047);
  gem(0,-1.399,.645,.064,.104,.036);
  // REAR: matte heavily reinforced plate, each part a genuine
  // separate extrusion; NOT the front surface mirrored backwards.
  panel(scaled(edge,.906,.921),'graphite',-.302,.090);
  for(const s of [-1,1]){
    panel(mirrored([[.12,.89],[.57,.99],[.68,.62],[.64,-.95],
      [.46,-1.31],[.19,-1.34]],s),'iron',-.374,.073);
    panel(mirrored([[.20,.68],[.49,.77],[.56,.59],
      [.55,-1.02],[.36,-1.21],[.22,-1.16]],s),
      'graphite',-.434,.041);
    panel(mirrored([[.65,.77],[.75,.73],[.76,-.77],
      [.62,-1.15],[.54,-1.13],[.67,-.67]],s),
      'bronze',-.414,.075);
    for(const y of [.80,.49,.18,-.15,-.51,-.86,-1.10])
      rivet(s*.635,y,-.484);
    line([s*.43,.65],[s*.43,-.92],-.481,'bronze',.013);
    // Rear top shoulders and small riveted corner guards.
    panel(mirrored([[.19,.98],[.48,1.03],[.61,1.27],
      [.72,.96],[.64,.78],[.27,.79]],s),
      'bronze',-.432,.085);
    rivet(s*.54,.95,-.494);
  }
  // Raised central dorsal brace with gothic pointed arch.
  panel([[-.13,1.42],[0,1.59],[.13,1.42],
    [.185,-1.21],[0,-1.51],[-.185,-1.21]],'bronze',-.454,.072);
  panel([[-.083,1.34],[0,1.48],[.083,1.34],
    [.105,-1.19],[0,-1.40],[-.105,-1.19]],'graphite',-.505,.050);
  for(const y of [.91,.65,.18,-.34,-.86,-1.25])rivet(0,y,-.545);
  // TWO independent horizontally oriented real leather grips.
  // Bronze anchors, dark leather cylinders, thin spiral leather stitches.
  for(const y of [.39,-.49]){
    for(const s of [-1,1]){
      cube(.18,.31,.17,'bronze',s*.54,y,-.583);
      cube(.123,.225,.10,'graphite',s*.54,y,-.678);
      for(const dy of [-.088,.088])rivet(s*.54,y+dy,-.752);
      // Buckled bronze joint at each end of the grip.
      cube(.056,.20,.19,'gild',s*.48,y,-.731);
    }
    rod([-.50,y,-.750],[.50,y,-.750],.096,'leather',12);
    // Real cross-laced leather wrapping following the round crossbar.
    for(let i=0;i<13;i++){
      const x=-.455+i*.076;
      curve([[x,y-.067,-.818],[x+.024,y,-.854],
        [x+.054,y+.066,-.822]],.009,'wrap');
    }
  }
  // Weathered forged seam lines (physical fine metallic meshes) front
  // and back, spaced so armor relief is visible from any angle.
  for(const s of [-1,1])for(let i=0;i<7;i++){
    const y=.50-i*.255,x=s*(i%2?.41:.46);
    line([x,y],[x-s*.034,y+.052],.589,'edge',.0035);
  }
  // Slightly taller and slimmer than the previous squarish shield.
  // Changes the DISPLAY MESH ONLY, never collision, stats or recipes.
  g.scale.x=.88;
  g.userData.referenceSheet='Heavy Soldier Tower Shield — 4-view reference / 3D re-sculpt';
  g.userData.hasRearLeatherGrips=true;
 }
 function bow(){
  const w=.71,h=1.38;
  // Two sweeping recurve limbs with contrasting dark core, silver armor.
  grip(-.24,.24,.122,6);
  cube(.18,.56,.20,'bronze',.01,0,0);
  for(const f of [-1,1]){
   diamond(0,0,f*.139,.15,.216,'bronze',.058);
   gem(0,0,f*.18,.097,.134,.040);
  }
  for(const side of [-1,1]){
   const st=[[-.045,.20],[.21,.41],[.48,.64],[.67,.84],
     [.70,1.04],[.55,1.25],[.61,1.39]]
     .map(([x,y])=>[x,y*side*h/1.39]);
   for(let i=1;i<st.length;i++){
    const a=st[i-1],b=st[i];
    rod([a[0],a[1],0],[b[0],b[1],0],
      .115*(1-i*.07),'graphite',12);
    for(const f of [-1,1]){
     rod([a[0]-.025,a[1],f*.075],[b[0]-.025,b[1],f*.075],
      .020,'bronze',8);
    }
   }
   for(const f of [-1,1]){
    prism([[.13,side*.36],[.43,side*.59],[.70,side*.83],
      [.58,side*1.15],[.65,side*1.39],[.47,side*1.23],
      [.53,side*.84],[.28,side*.58]],.108,
      'bronze',f*.050,.010);
    prism([[.20,side*.41],[.45,side*.64],[.63,side*.85],
      [.53,side*1.10],[.57,side*1.27],[.42,side*1.10],
      [.44,side*.83],[.27,side*.61]],.066,
      'graphite',f*.123,.008);
    curve([[.29,side*.51,f*.167],[.56,side*.79,f*.167],
      [.48,side*1.12,f*.167]],.017,'light');
    gem(.57,side*.91,f*.169,.036,.083,.028);
   }
   // Three-dimensional recurved golden tip and string anchor.
   prism([[.44,side*1.23],[.65,side*1.45],
     [.78,side*1.30],[.60,side*1.17]],.16,'gild',0,.013);
   gem(.66,side*1.32,.123,.067,.109,.044);
   const tip=[.65,side*1.40,0];
   rod(tip,[.73,0,0],.009,'silver',6);
   // Reinforcing sweep and raised spike between upper/lower limb.
   prism([[.37,side*.57],[.81,side*.72],
     [.66,side*.86],[.40,side*.69]],.12,'iron',0,.011);
  }
  prism([[-.25,-.18],[-.32,-.07],[-.12,.25],
    [.10,.16],[.04,-.18]],.18,'bronze',0,.012);
 }
 function staff(){
  grip(-.83,.51,.085,14);
  rod([0,.48,0],[0,1.57,0],.077,'graphite',12);
  for(const y of [-.75,-.34,.44,.90,1.32,1.54])
   add(new T.CylinderGeometry(.120,.120,.045,12),'gild',0,y,0);
  for(const f of [-1,1]){
   trim([0,.68],[0,1.18],f*.10,'light',.014);
   for(const y of [.78,1.16]){
    diamond(0,y,f*.113,.090,.12,'bronze',.028);
    gem(0,y,f*.142,.047,.075,.028);
   }
  }
  // Faceted crystal on the lower opposite end of the shaft.
  prism([[-.14,-.77],[0,-.68],[.14,-.77],
    [.23,-1.02],[0,-1.40],[-.23,-1.02]],.19,'bronze',0,.017);
  for(const f of [-1,1]){
   diamond(0,-1.06,f*.126,.13,.255,'graphite',.047);
   gem(0,-1.07,f*.172,.091,.184,.057);
  }
  // Gold circular armature, inner floating purple core and 4 satellites.
  const cy=2.12,R=.52;
  add(new T.TorusGeometry(R,.063,12,48),'bronze',0,cy,0);
  const inset=add(new T.TorusGeometry(R*.83,.031,10,48),'gild',0,cy,.023);
  inset.rotation.y=.12;
  const core=gem(0,cy,0,.29,.48,.26);
  for(const f of [-1,1]){
   diamond(0,cy,f*.19,.20,.40,'crystal',.017);
   for(const s of [-1,1]){
    curve([[s*.10,1.62,f*.09],[s*.42,1.73,f*.09],
      [s*.62,2.13,f*.09],[s*.51,2.51,f*.09],
      [s*.19,2.67,f*.09]],.058,'bronze');
    curve([[s*.14,1.65,f*.155],[s*.47,1.86,f*.155],
      [s*.53,2.33,f*.155],[s*.16,2.60,f*.155]],.021,'gild');
    gem(s*.69,2.13,f*.08,.090,.17,.080);
    prism([[s*.44,1.84],[s*.73,2.07],
      [s*.62,2.18],[s*.45,2.06]],.060,'graphite',f*.12,.009);
   }
   prism([[-.24,1.61],[0,1.42],[.24,1.61],
    [.15,1.78],[0,1.73],[-.15,1.78]],.11,'bronze',f*.125,.01);
   gem(0,1.63,f*.21,.11,.17,.05);
   prism([[-.18,2.59],[0,2.91],[.18,2.59]],.08,'bronze',f*.032,.013);
   gem(0,2.79,f*.09,.091,.14,.047);
  }
  gem(0,2.94,0,.079,.125,.073);
 }
 if(name==='sword')sword(false);
 else if(name==='warrior')sword(true);
 else if(name==='axer')axe();
 else if(name==='lancer')spear();
 else if(name==='berserker')dual();
 else if(name==='heavy')shield();
 else if(name==='archer')bow();
 else if(name==='mage')staff();
 g.name=(d.name||name)+' reference sheet 3D';
 g.userData.jobWeapon=name;
 g.userData.referenceSheet='2026-10-21 eight weapon four-view sheets';
 return g;
}
