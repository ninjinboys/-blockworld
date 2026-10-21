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
  // Reference silhouette: three bronze cathedral finials and V point.
  const outline=[[-.90,.84],[-.68,1.21],[-.50,.96],
   [-.34,1.02],[0,1.41],[.34,1.02],[.50,.96],
   [.68,1.21],[.90,.84],[1.00,-.71],
   [.70,-1.15],[0,-1.48],[-.70,-1.15],[-1.00,-.71]];
  prism(outline,.43,'bronze',0,.033);
  prism(outline.map(([x,y])=>[x*.947,y*.948]),.41,'graphite',.016,.021);
  prism(outline.map(([x,y])=>[x*.895,y*.897]),.41,'iron',.040,.014);
  for(const s of [-1,1]){
   prism([[s*.82,.83],[s*.98,.80],[s*.98,-.67],
     [s*.73,-1.08],[s*.57,-1.07],[s*.83,-.53]],.17,'bronze',.253,.015);
   prism([[s*.59,.94],[s*.68,1.25],[s*.81,.89],
     [s*.93,.78],[s*.72,.52],[s*.54,.78]],.19,'gild',.304,.019);
   gem(s*.67,1.01,.421,.055,.106,.037);
   // Each protective panel is an individual multi-depth steel forging.
   for(const [high,low] of [[.70,.05],[-.06,-.83]]){
    prism([[s*.20,high],[s*.46,high+.05],[s*.69,high-.18],
      [s*.63,low+.13],[s*.44,low],[s*.19,low+.13]],
      .115,'graphite',.323,.012);
    prism([[s*.245,high-.06],[s*.46,high-.02],[s*.60,high-.21],
      [s*.56,low+.16],[s*.40,low+.08],[s*.25,low+.15]],
      .091,'silver',.411,.009);
    trim([s*.28,high-.13],[s*.29,low+.22],.483,'edge',.013);
    rivet(s*.49,high-.18,.492);
   }
   prism([[s*.63,-.80],[s*.83,-.69],[s*.84,-.90],
     [s*.64,-1.12],[s*.38,-1.22]],.11,'gild',.366,.011);
   prism([[s*.64,-.82],[s*.76,-.80],
     [s*.72,-.97],[s*.43,-1.12]],.067,'silver',.440,.008);
   trim([s*.74,.14],[s*.75,-.45],.455,'light',.017);
  }
  // A recessed central energy channel with gold separations and real jewels.
  prism([[-.22,.91],[0,1.25],[.22,.91],
    [.18,-1.17],[0,-1.34],[-.18,-1.17]],.111,'gild',.346,.013);
  prism([[-.145,.80],[0,1.14],[.145,.80],
    [.115,-1.10],[0,-1.26],[-.115,-1.10]],
    .072,'inset',.413,.009);
  curve([[0,.76,.468],[0,.33,.468],[0,-.17,.468],[0,-.96,.468]],.018,'light');
  for(const y of [-.80,-.16,.46]){
   diamond(0,y,.487,.09,.17,'bronze',.046);
   gem(0,y,.519,.058,.105,.040);
  }
  prism([[-.73,.80],[-.42,.96],[-.31,1.02],[0,1.42],
    [.31,1.02],[.42,.96],[.73,.80],[.43,.71],
    [0,.64],[-.43,.71]],.175,'bronze',.441,.019);
  diamond(0,.98,.563,.262,.357,'graphite',.082);
  diamond(0,.98,.616,.188,.262,'gild',.051);
  gem(0,.98,.676,.133,.188,.064);
  prism([[-.39,-1.10],[0,-1.48],[.39,-1.10],
    [.23,-1.03],[0,-1.26],[-.23,-1.03]],.127,'bronze',.440,.012);
  gem(0,-1.26,.538,.065,.092,.041);
  // Full shield BACK is built separately, with TWO leather crossbars.
  prism(outline.map(([x,y])=>[x*.88,y*.87]),.075,'graphite',-.249,.014);
  for(const s of [-1,1]){
   prism([[s*.18,.72],[s*.66,.82],[s*.72,.30],
     [s*.60,-.91],[s*.24,-1.09]],.08,'iron',-.301,.012);
   prism([[s*.22,.63],[s*.57,.68],[s*.58,-.90],
     [s*.27,-1.00]],.044,'inset',-.367,.007);
   for(const y of [.60,.25,-.10,-.45,-.83])rivet(s*.64,y,-.414);
  }
  prism([[-.11,1.16],[.11,1.16],[.17,-1.07],
    [0,-1.29],[-.17,-1.07]],.11,'bronze',-.390,.008);
  for(const y of [.42,-.46]){
   for(const x of [-.60,.60]){
    cube(.20,.25,.13,'bronze',x,y,-.475);
    cube(.13,.17,.09,'graphite',x,y,-.555);
    for(const dy of [-.08,.08])rivet(x,y+dy,-.615);
   }
   cube(1.28,.175,.185,'wrap',0,y,-.585);
   cube(1.05,.139,.16,'leather',0,y,-.697);
   for(let i=0;i<13;i++){
    const x=-.50+i*.083;
    rod([x,y-.064,-.794],[x+.045,y+.063,-.794],.009,'wrap',5);
   }
   for(const x of [-.55,.55])cube(.052,.19,.19,'bronze',x,y,-.680);
  }
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
