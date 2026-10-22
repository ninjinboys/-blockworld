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

  // Flatten only the actual sword BLADE geometry in world-depth (Z).
  // Keep grip, pommel and guard round so a thin blade is still 3-dimensional.
  // Since both mesh placement and intrinsic depth are scaled, the raised
  // front/back ornaments do not float away from the thinner steel.
  const flattenBladeSince=(start,ratio)=>{
    for(const mesh of g.children.slice(start)){
      mesh.position.z*=ratio;
      mesh.scale.z*=ratio;
    }
  };
 function sword(great){
  if(great){greatsword();return;}
  // SWORDSMAN / SWORD — reference sheet 4-view reproduction.
  // A straight wide SILVER blade with an exceptionally long acute
  // spearpoint, side notches at the ricasso, recessed central black
  // fuller, emerald runes and a large winged bronze crossguard.
  // The model is REAL 3D: continuous forged diamond/wedge-section blade
  // with shiny bevels, not two skinny raised silver strips on a black bar.
  const P=(pts,depth,mat,z=0,bev=.008)=>prism(pts,depth,mat,z,bev);
  const mirror=(pts,s)=>pts.map(([x,y])=>[x*s,y]);
  const line=(a,b,z,mat='gild',r=.011)=>trim(a,b,z,mat,r);
  const stud=(x,y,z,r=.017)=>add(new T.SphereGeometry(r,8,6),'bronze',x,y,z);

  // Long dark-brown leather grip, spiral binding and jeweled pommel.
  grip(-.86,.20,.119,11);
  for(const yy of [-.84,-.25,.17]){
    add(new T.CylinderGeometry(.141,.141,.055,12),'bronze',0,yy,0);
    add(new T.CylinderGeometry(.134,.134,.014,12),'gild',0,yy+.032,0);
  }
  P([[-.115,-.83],[.114,-.83],[.225,-1.02],
    [.135,-1.18],[0,-1.30],[-.135,-1.18],[-.225,-1.02]],
    .168,'bronze',0,.013);
  for(const f of [-1,1]){
    diamond(0,-1.03,f*.115,.149,.185,'graphite',.044);
    diamond(0,-1.03,f*.144,.110,.139,'gild',.028);
    gem(0,-1.03,f*.175,.076,.104,.037);
  }

  // Straight sword, decidedly WIDER than the prior Swordsman weapon.
  // Near-tip shoulders extend into ONE continuous sharp point.
  const stations=[
    [.49,.275,.93],[.68,.340,1],[.85,.37,1],
    [.96,.30,1],[1.08,.423,1],
    [1.30,.425,1],[2.70,.425,1],
    [2.95,.432,.96],[3.09,.420,.93],
    [3.29,.293,.65],[3.55,.155,.34],[3.83,0,0]
  ];
  const fractions=[0,.21,.31,.47,.76,1];
  const elevations=[.082,.117,.163,.143,.055,.002];
  const mats=['inset','bronze','graphite','silver','edge'];
  const append=(ary,f,s,a,b,c)=>{
    const tri=f*s>0?[a,b,c]:[a,c,b];
    for(const v of tri)ary.push(v[0],v[1],v[2]);
  };
  const addSurface=(ary,mat)=>{
    const geo=new T.BufferGeometry();
    geo.setAttribute('position',new T.Float32BufferAttribute(ary,3));
    geo.computeVertexNormals();
    const object=new T.Mesh(geo,M[mat]);
    object.castShadow=true;object.receiveShadow=true;g.add(object);
  };
  for(const face of [-1,1])for(const s of [-1,1]){
    const sample=(i,j)=>{
      const [y,w,t]=stations[i];
      return [s*w*fractions[j],y,face*elevations[j]*t];
    };
    for(let band=0;band<5;band++){
      const triangles=[];
      for(let k=0;k<stations.length-1;k++){
        const a=sample(k,band),b=sample(k,band+1);
        const c=sample(k+1,band+1),d=sample(k+1,band);
        append(triangles,face,s,a,b,c);
        append(triangles,face,s,a,c,d);
      }
      addSurface(triangles,mats[band]);
    }
    // Close the thin forged blade's outside edge, from face to face.
    const edgeSide=[];
    for(let k=0;k<stations.length-1;k++){
      const [ya,wa,ta]=stations[k],[yb,wb,tb]=stations[k+1];
      const p1=[s*wa,ya,.002*ta],p2=[s*wb,yb,.002*tb],
        p3=[s*wb,yb,-.002*tb],p4=[s*wa,ya,-.002*ta];
      append(edgeSide,1,s,p1,p2,p3);
      append(edgeSide,1,s,p1,p3,p4);
    }
    addSurface(edgeSide,'edge');
    // Forged silver platelets over each raised shoulder, following the
    // actual bevel — no giant fake silver spikes at the point.
    const shoulder=[
      [.95,.312,.38],[1.10,.37,.423],
      [1.35,.38,.425],[2.65,.38,.425],
      [2.91,.39,.432]
    ];
    const insetFacet=[];
    const v=(k,j)=>{
      const [y,xmin,xmax]=shoulder[k];
      const x=j===0?xmin:j===1?(xmin+xmax)/2:xmax;
      const depth=j===0?.151:j===1?.123:.029;
      return [s*x,y,face*depth];
    };
    for(let k=0;k<shoulder.length-1;k++)
      for(let j=0;j<2;j++){
        const a=v(k,j),b=v(k,j+1),
          c=v(k+1,j+1),d=v(k+1,j);
        append(insetFacet,face,s,a,b,c);
        append(insetFacet,face,s,a,c,d);
      }
    addSurface(insetFacet,'silver');
    // Three steeply sloping facets meet at one piercing dagger point.
    const noseVerts=[];
    const fpoint=(x,y,z)=>[s*x,y,face*z];
    const nose=[
      [fpoint(.30,3.04,.155),fpoint(.40,3.10,.071),fpoint(.293,3.29,.098)],
      [fpoint(.30,3.04,.155),fpoint(.293,3.29,.098),fpoint(.18,3.49,.087)],
      [fpoint(.18,3.49,.087),fpoint(.293,3.29,.098),fpoint(0,3.83,0)]
    ];
    for(const tri of nose)append(noseVerts,face,s,...tri);
    addSurface(noseVerts,'silver');
  }

  // The reference uses a LONG black central fuller, set below the silver
  // and carrying a delicate continuous cyan sigil, with diamond symbols.
  for(const f of [-1,1]){
    const z=f*.099;
    curve([[0,.68,z],[0,1.13,z],[0,1.74,z],
      [0,2.41,z],[0,2.93,z]],.012,'light');
    diamond(0,1.18,f*.109,.090,.151,'bronze',.030);
    diamond(0,1.18,f*.128,.062,.112,'gild',.021);
    gem(0,1.18,f*.157,.049,.081,.029);
    for(const [y,size] of [[1.82,.057],[2.58,.033],[2.85,.025]]){
      diamond(0,y,f*.113,size,size*1.66,'bronze',.019);
      diamond(0,y,f*.130,size*.62,size*1.10,'light',.013);
    }
    for(const y of [1.53,2.22])for(const s of [-1,1]){
      line([0,y],[s*.059,y+.080],z,'light',.008);
      line([s*.059,y+.080],[0,y+.169],z,'light',.007);
    }
    // The two bronze traceries frame the recessed dark channel.
    for(const s of [-1,1]){
      line([s*.127,.81],[s*.131,2.67],f*.132,'bronze',.008);
      line([s*.131,2.67],[s*.070,3.13],f*.101,'bronze',.008);
    }
  }

  // Large gold-bronze guard with upturned angular wing tips and multiple
  // forged physical layers around a tall turquoise diamond ornament.
  const cy=.36;
  const guardOutline=[
    [-.88,cy+.03],[-.83,cy+.20],[-.67,cy+.145],
    [-.36,cy+.108],[0,cy+.28],[.36,cy+.108],
    [.67,cy+.145],[.83,cy+.20],[.88,cy+.03],
    [.76,cy-.109],[.53,cy-.09],[.208,cy-.060],
    [0,cy-.25],[-.208,cy-.060],[-.53,cy-.09],
    [-.76,cy-.109]
  ];
  P(guardOutline,.272,'bronze',0,.019);
  for(const f of [-1,1]){
    for(const s of [-1,1]){
      P(mirror([[.15,cy+.085],[.52,cy+.095],
        [.81,cy+.189],[.79,cy+.054],
        [.57,cy-.024],[.32,cy+.016]],s),
        .061,'gild',f*.160,.009);
      P(mirror([[.31,cy+.056],[.59,cy+.059],
        [.74,cy+.130],[.66,cy+.031]],s),
        .031,'graphite',f*.198,.005);
      line([s*.33,cy+.105],[s*.77,cy+.145],
        f*.217,'gild',.009);
      stud(s*.73,cy+.139,f*.227);
    }
    P([[-.249,cy+.14],[0,cy+.387],[.249,cy+.14],
       [.17,cy-.061],[0,cy-.312],[-.17,cy-.061]],
       .102,'bronze',f*.182,.011);
    P([[-.180,cy+.114],[0,cy+.282],[.180,cy+.114],
       [.124,cy-.037],[0,cy-.207],[-.124,cy-.037]],
       .055,'gild',f*.250,.007);
    diamond(0,cy+.066,f*.288,.168,.239,'graphite',.045);
    diamond(0,cy+.066,f*.315,.134,.183,'gild',.031);
    gem(0,cy+.066,f*.355,.094,.133,.047);
  }
  g.userData.referenceSheet='Swordsman Sword: wider straight silver 3D wedge, black cyan fuller, acute tapered tip and bronze-wing guard';
  g.userData.swordReferenceV2=true;
 }

 function greatsword(){
  // Warrior Greatsword from the supplied 4-view sheet.
  // Single WIDE black-steel blade, thin silver outer cutting bevels,
  // long strongly angular DIAMOND-POINT tip and sweeping jeweled guard.
  const P=(pts,th,mat,z=0,b=.007)=>prism(pts,th,mat,z,b);
  const F=(points,s)=>points.map(([x,y])=>[s*x,y]);
  const line=(a,b,z,mat='gild',r=.010)=>trim(a,b,z,mat,r);
  const riv=(x,y,z)=>add(new T.SphereGeometry(.024,8,6),'bronze',x,y,z);
  const jewel=(x,y,z,w,h)=>{
    diamond(x,y,z,w*1.3,h*1.26,'bronze',.058);
    diamond(x,y,z+.035,w,h,'gild',.032);
    gem(x,y,z+.079,w*.73,h*.78,.044);
  };

  // Long leather two-handed handle and the compact faceted pommel.
  grip(-1.35,.16,.151,15);
  for(const y of [-1.28,-.80,-.33,.11]){
    add(new T.CylinderGeometry(.177,.177,.057,14),'bronze',0,y,0);
    add(new T.CylinderGeometry(.159,.159,.014,14),'gild',0,y+.031,0);
  }
  P([[-.16,-1.34],[0,-1.22],[.16,-1.34],
    [.225,-1.56],[0,-1.80],[-.225,-1.56]],.235,'bronze',0,.013);
  for(const f of [-1,1]){
    diamond(0,-1.52,f*.145,.164,.205,'graphite',.057);
    diamond(0,-1.52,f*.182,.120,.156,'gild',.039);
    gem(0,-1.52,f*.228,.082,.114,.043);
  }
  // Reinforced steel ricasso / hilt socket.
  P([[-.23,.09],[-.29,.44],[0,.70],[.29,.44],[.23,.09]],
    .240,'graphite',0,.013);
  for(const f of [-1,1]){
    P([[-.17,.14],[-.20,.44],[0,.59],[.20,.44],[.17,.14]],
      .052,'bronze',f*.160,.007);
  }


  // Genuine forged wedge: steel thickest at inner shoulders, razor-thin
  // at BOTH lateral edges and tapering to zero through the diamond point.
  // Each material band is a 3D triangular surface with its own normals.
  const stations=[
    [.58,.52,.90],[.93,.60,1],[1.09,.49,1],[1.28,.61,1],
    [1.50,.70,1],[3.31,.70,1],[3.47,.81,.95],
    [3.63,.98,.90],[3.96,.87,.72],[4.20,.69,.52],
    [4.68,0,0]
  ];
  const ribs=[0,.27,.36,.66,.83,1];
  const elevations=[.13,.145,.26,.19,.07,.003];
  const materials=['inset','bronze','graphite','iron','edge'];
  for(const face of [-1,1])for(const side of [-1,1])
    for(let band=0;band<5;band++){
      const points=[];
      const pushTriangle=(a,b,c)=>{
        const tri=(face*side>0)?[a,b,c]:[a,c,b];
        for(const v of tri)points.push(v[0],v[1],v[2]);
      };
      const sample=(row,k)=>{
        const st=stations[row];
        return [side*st[1]*ribs[k],st[0],face*elevations[k]*st[2]];
      };
      for(let row=0;row<stations.length-1;row++){
        const a=sample(row,band),b=sample(row,band+1);
        const c=sample(row+1,band+1),d=sample(row+1,band);
        pushTriangle(a,b,c);pushTriangle(a,c,d);
      }
      const geometry=new T.BufferGeometry();
      geometry.setAttribute('position',new T.Float32BufferAttribute(points,3));
      geometry.computeVertexNormals();
      const m=new T.Mesh(geometry,M[materials[band]]);
      m.castShadow=true;m.receiveShadow=true;g.add(m);
    }
  // Sharp enclosed distal steel point, not a flat octagonal cap.
  P([[-.07,4.43],[0,4.73],[.07,4.43],[0,4.54]],
    .014,'silver',0,.001);
  for(const face of [-1,1]){
    const z=face*.163;
    for(const side of [-1,1]){
      line([side*.197,1.13],[side*.190,3.25],
        face*.178,'bronze',.012);
      line([side*.190,3.25],[side*.083,3.70],
        face*.164,'bronze',.009);
    }
    curve([[0,.93,z],[0,1.48,z],[0,2.21,z],
      [0,2.98,z],[0,3.41,z]],.015,'light');
    diamond(0,2.25,face*.191,.122,.181,'bronze',.041);
    diamond(0,2.25,face*.221,.089,.132,'gild',.030);
    gem(0,2.25,face*.256,.065,.096,.040);
    for(const yy of [1.24,1.54,3.04]){
      diamond(0,yy,face*.185,.052,.089,'gild',.023);
      diamond(0,yy,face*.205,.030,.053,'light',.015);
    }
  }
  g.userData.sharpEdgeGeometry=true;
  g.userData.bladeCrossSection='double beveled forged wedge with razor thin edges';
  // Sweeping, VERY WIDE bronze gothic crossguard (not a small generic T).
  const gy=.42;
  const horns=[[-1.24,gy+.07],[-1.20,gy+.32],
    [-.95,gy+.23],[-.73,gy+.14],
    [-.33,gy+.19],[0,gy+.43],
    [.33,gy+.19],[.73,gy+.14],
    [.95,gy+.23],[1.20,gy+.32],
    [1.24,gy+.07],[1.06,gy-.15],
    [.76,gy-.10],[.27,gy-.055],
    [0,gy-.33],[-.27,gy-.055],
    [-.76,gy-.10],[-1.06,gy-.15]];
  P(horns,.329,'bronze',0,.021);
  for(const f of [-1,1]){
    for(const s of [-1,1]){
      P(F([[.21,gy+.19],[.74,gy+.18],
        [1.19,gy+.31],[1.13,gy+.10],
        [.85,gy-.001],[.35,gy+.035]],s),
        .072,'gild',f*.204,.009);
      P(F([[.34,gy+.14],[.74,gy+.12],
        [1.08,gy+.25],[1.01,gy+.125],
        [.74,gy+.065]],s),.044,'graphite',f*.253,.006);
      line([s*.38,gy+.145],[s*1.10,gy+.231],f*.285,'bronze',.015);
      riv(s*1.04,gy+.215,f*.290);
    }
    P([[-.34,gy+.21],[0,gy+.51],[.34,gy+.21],
      [.235,gy-.018],[0,gy-.35],[-.235,gy-.018]],
      .126,'bronze',f*.263,.014);
    P([[-.23,gy+.19],[0,gy+.403],[.23,gy+.19],
      [.15,gy-.043],[0,gy-.245],[-.15,gy-.043]],
      .062,'gild',f*.352,.007);
    diamond(0,gy+.10,f*.395,.221,.284,'graphite',.060);
    diamond(0,gy+.10,f*.435,.17,.222,'gild',.041);
    gem(0,gy+.10,f*.480,.125,.159,.059);
  }
  g.userData.referenceSheet='Warrior Greatsword: reference four-view broad dark slab, angular spearpoint and sweeping bronze crossguard';
  g.userData.warriorRebuilt=true;
  g.userData.warriorBladeStyle='parallel broad dark steel with sharply tapered diamond end';
 }
 function axe(){
  // 2026-10-22 BATTLE AXE / WAR AXE: hand-sculpted four-view reference.
  // Front: opposed deep concave crescent blades, bright outer sharpened
  // edges, dark internal steel, bronze swept V crown & central cyan gem.
  // Side: slim forged blade profile; back: dark steel with engraved ribs.
  // Shaft: long wrapped leather grip, engraved steel upper shank, bronze
  // collars and matching jeweled pointed pommel.
  const P=(pts,dep,mat,z=0,bev=.007)=>prism(pts,dep,mat,z,bev);
  const F=(points,sign)=>points.map(([x,y])=>[x*sign,y]);
  const riv=(x,y,z,r=.024)=>add(new T.SphereGeometry(r,9,6),'bronze',x,y,z);
  const hair=(a,b,z,mat='edge',size=.004)=>trim(a,b,z,mat,size);
  const band=(y,r=.133,h=.066)=>{
    add(new T.CylinderGeometry(r,r,h,14),'bronze',0,y,0);
    add(new T.CylinderGeometry(r*.89,r*.89,.014,14),'gild',0,y+h*.50,0);
    add(new T.CylinderGeometry(r*.90,r*.90,.014,14),'graphite',0,y-h*.50,0);
    for(const side of [-1,1]){
      for(const f of [-1,1])riv(side*r*.68,y,f*r*.69,.012);
    }
  };
  // The long staff has TWO materials. Gold bands divide dark carved steel
  // at the top from the dark brown cross-wrapped lower two-thirds.
  rod([0,-1.46,0],[0,1.54,0],.077,'graphite',16);
  rod([0,-1.30,0],[0,-.06,0],.092,'leather',16);
  // Cross-wrap visible as physical spiral laces from all camera angles.
  for(let dir of [-1,1]){
    const pts=[];
    const turns=dir===1?12:-12;
    for(let i=0;i<=144;i++){
      const t=i/144,angle=t*turns*Math.PI*2+(dir===1?0:Math.PI);
      pts.push([Math.cos(angle)*.098,-1.30+t*1.24,
        Math.sin(angle)*.098]);
    }
    curve(pts,.010,'wrap');
  }
  for(const y of [-1.28,-.64,-.10,.17,1.13]){
    band(y,y>.90?.151:y<-.95?.137:.136,y>.90?.10:.066);
  }
  // The upper exposed forging has a proper narrow rectangular black steel
  // shaft with 2 raised gold rails framing a continuous cyan channel.
  P([[-.102,.12],[-.110,1.25],[0,1.48],[.110,1.25],
    [.102,.12]],.165,'iron',.008,.014);
  for(const f of [-1,1]){
    P([[-.070,.24],[-.075,1.26],[0,1.37],[.075,1.26],
      [.070,.24]],.034,'inset',f*.106,.005);
    curve([[0,.27,f*.130],[0,.52,f*.130],
      [0,.87,f*.130],[0,1.15,f*.130]],.012,'light');
    for(const y of [.47,.83]){
      diamond(0,y,f*.151,.039,.071,'bronze',.030);
      gem(0,y,f*.176,.024,.043,.017);
    }
    for(const sign of [-1,1]){
      hair([sign*.081,.28],[sign*.086,1.18],f*.128,'gild',.008);
    }
  }
  // Socket where both steel crescents join the shaft.
  P([[-.19,1.13],[0,1.03],[.19,1.13],
    [.22,1.57],[.17,2.02],[0,2.31],
    [-.17,2.02],[-.22,1.57]],.203,'graphite',0,.015);
  for(const sign of [-1,1]){
    // Opposing asymmetrical-in-depth curved blades: true enclosed 3D
    // extrusions. Outer horns rise sharply, lower points droop. The inner
    // contour curves inward in a C, forming a visible NOTCH, not a square.
    const crescent=F([
      [.14,1.50],[.24,1.68],[.36,1.81],
      [.48,1.86],[.58,1.82],[.64,1.74],
      [.69,1.61],[.65,1.42],[.54,1.23],
      [.51,1.00],[.63,.86],[.77,1.10],
      [.87,1.40],[.92,1.79],[.90,2.14],
      [.79,2.47],[.68,2.68],
      [.64,2.42],[.58,2.22],[.49,2.09],
      [.36,2.04],[.21,2.07],[.14,2.18]],sign);
    P(crescent,.174,'silver',0,.009);
    // Bright sharpened crescent around the OUTER edge. Narrow outer
    // metallic band and broad graphite inlay make the outline readable.
    const inner=F([
      [.20,1.61],[.35,1.88],[.49,1.98],
      [.62,1.89],[.71,1.73],[.74,1.53],
      [.70,1.36],[.62,1.19],[.59,1.02],
      [.73,1.27],[.80,1.58],[.81,1.90],
      [.76,2.25],[.68,2.54],[.64,2.31],
      [.55,2.08],[.41,1.97],[.24,2.00]],sign);
    for(const f of [-1,1]){
      const z=f*.108;
      P(inner,.043,'graphite',z,.009);
      // Recessed dark inset inside the crescent where cyan runes live.
      P(F([[.24,1.63],[.39,1.87],[.53,1.95],
        [.65,1.80],[.72,1.61],[.72,1.41],
        [.61,1.12],[.61,1.34],[.64,1.56],
        [.57,1.70],[.46,1.78],[.34,1.77]],sign),
        .022,'inset',z+f*.035,.004);
      // Separate hammered outer-edge silver facet: bright at outermost.
      P(F([[.68,2.56],[.79,2.32],[.86,2.07],
        [.875,1.76],[.82,1.44],[.69,1.06],
        [.60,.90],[.65,1.17],[.74,1.47],
        [.77,1.76],[.75,2.04],[.68,2.37]],sign),
        .030,'edge',z+f*.045,.005);
      // Long slanted forge seam runs behind the outer crescent edge.
      curve([[sign*.64,2.27,f*.167],[sign*.76,2.04,f*.167],
        [sign*.79,1.75,f*.167],[sign*.75,1.48,f*.167],
        [sign*.63,1.17,f*.167]],.008,'iron');
      // Low-profile pointed inset tracing the C-shaped inner void.
      curve([[sign*.38,1.96,f*.155],[sign*.51,1.90,f*.155],
        [sign*.65,1.70,f*.155],[sign*.63,1.45,f*.155]],.009,'bronze');
      if(f===1){
        // Characteristic bright cyan 3-pronged runes on FRONT only,
        // one near upper horn and one near lower inner crescent.
        curve([[sign*.62,2.25,.160],[sign*.58,2.13,.160],
          [sign*.56,1.98,.160]],.017,'light');
        diamond(sign*.59,2.09,.190,.049,.076,'gild',.023);
        gem(sign*.59,2.09,.211,.027,.048,.018);
        hair([sign*.58,2.13],[sign*.49,2.17],.191,'light',.011);
        curve([[sign*.62,1.56,.173],[sign*.54,1.40,.173],
          [sign*.58,1.25,.173]],.015,'light');
        diamond(sign*.57,1.40,.185,.041,.062,'gild',.019);
        gem(sign*.57,1.40,.209,.022,.038,.017);
      }else{
        // Reverse view deliberately uses carved black steel channels,
        // no mirrored glowing runes unlike the front reference.
        for(const y of [1.44,1.66,1.90]){
          hair([sign*.53,y],[sign*.68,y+.065],-.165,'iron',.008);
        }
      }
      // Small forged abrasion lines are 3D, no flat image billboard.
      for(let i=0;i<7;i++){
        const y=1.13+i*.16,x=sign*(.76+.055*Math.sin(i*.7));
        hair([x,y],[x-sign*.031,y+.045],f*.165,'silver',.003);
      }
    }
    // Metal socket arms cradle the blade root, integrating axe head
    // with a proper curved bridge as seen in its front and back views.
    P(F([[.16,1.55],[.26,1.86],[.45,2.02],
      [.52,2.14],[.41,2.11],[.25,2.04],[.15,1.95]],sign),
      .220,'bronze',0,.017);
  }
  // Ornamental gothic V across BOTH arms with three-dimensional bevels.
  // The topmost bronze vertex sits lower than the outer blade tips.
  P([[-.30,2.09],[-.42,2.17],[-.54,2.35],
     [-.44,2.23],[-.30,2.20],[0,2.43],
     [.30,2.20],[.44,2.23],[.54,2.35],
     [.42,2.17],[.30,2.09],[0,1.84]],.243,'bronze',0,.017);
  for(const f of [-1,1]){
    // Forged bronze plate along central shaft / head in front and rear.
    P([[-.24,1.65],[-.29,1.96],[0,2.37],
       [.29,1.96],[.24,1.65],[.11,1.47],[0,1.32],
       [-.11,1.47]],.065,'gild',f*.160,.009);
    P([[-.19,1.74],[0,2.24],[.19,1.74],
       [.10,1.55],[0,1.44],[-.10,1.55]],
      .047,'graphite',f*.214,.008);
    // Back central jewel frame in solid metal, FRONT actual turquoise.
    diamond(0,1.95,f*.264,.204,.305,'bronze',.077);
    diamond(0,1.95,f*.307,.153,.221,'gild',.047);
    if(f===1){
      diamond(0,1.95,.338,.121,.174,'inset',.032);
      gem(0,1.95,.374,.105,.151,.050);
    }else{
      diamond(0,1.95,-.340,.118,.176,'graphite',.039);
      diamond(0,1.95,-.369,.051,.090,'bronze',.021);
    }
    for(const sign of [-1,1]){
      curve([[sign*.18,1.94,f*.221],[sign*.32,2.15,f*.221],
        [sign*.48,2.24,f*.221]],.021,'gild');
      riv(sign*.39,2.17,f*.236,.017);
    }
    // Collar with a small matching jewel at the blade socket's base.
    P([[-.19,1.25],[0,1.15],[.19,1.25],
      [.21,1.44],[0,1.56],[-.21,1.44]],
      .056,'bronze',f*.166,.010);
    gem(0,1.36,f*.216,.044,.080,.028);
  }
  band(1.12,.195,.11);
  // Directionally aligned gold brackets link head to the long steel shaft.
  for(const f of [-1,1]){
    curve([[0,1.16,f*.165],[0,.99,f*.165],
      [0,.82,f*.165]],.012,'light');
  }
  // Pointed ornate jeweled pommel, at the end of the leather-wrapped pole.
  P([[-.105,-1.36],[-.17,-1.48],[-.27,-1.55],
    [-.21,-1.75],[0,-1.99],[.21,-1.75],
    [.27,-1.55],[.17,-1.48],[.105,-1.36]],
    .173,'bronze',0,.014);
  for(const f of [-1,1]){
    P([[-.135,-1.50],[-.18,-1.62],[0,-1.89],
      [.18,-1.62],[.135,-1.50]],
      .059,'graphite',f*.111,.007);
    diamond(0,-1.640,f*.151,.153,.216,'gild',.056);
    diamond(0,-1.640,f*.184,.109,.161,'inset',.029);
    gem(0,-1.640,f*.220,.077,.110,.041);
  }
  g.userData.referenceSheet='2026-10-22 Battle Axe War Axe 4-view 3D sculpt';
  g.userData.axeBladeProfile='opposed thin concave crescents with cut-out lower arches';
  g.userData.axeViews='front cyan runes; dark forged back; slim side; jeweled socket and pommel';
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
  // Berserker — identical twin weapons, true 3D forged broad curved
  // serrated demonic longswords, NOT short blocky dual daggers.
  // Matches four-view user reference: full-length outer sweeping silver
  // blade, deep saw notches on one edge, raised black fuller, crimson
  // rune, horned bronze guard, large red diamonds, leather grip.
  const P=(pts,depth,mat,z=0,bevel=.007)=>prism(pts,depth,mat,z,bevel);
  const lip=(a,b,z,mat='gild',r=.012)=>trim(a,b,z,mat,r);
  const stud=(x,y,z,r=.023)=>add(new T.SphereGeometry(r,9,6),'bronze',x,y,z);
  const cross=(pts,side)=>pts.map(([x,y])=>[x*side,y]);
  // Reference-hilt proportions: a usable leather-wrapped long grip.
  grip(-1.12,.20,.116,12);
  for(const y of [-1.12,-.76,.13]){
    add(new T.CylinderGeometry(.147,.147,.060,14),'bronze',0,y,0);
    add(new T.CylinderGeometry(.127,.127,.013,14),'gild',0,y+.035,0);
  }
  // Distinct sharply-pointed red jewel pommel with dimensional shoulders.
  P([[-.15,-1.09],[0,-.98],[.15,-1.09],
    [.225,-1.28],[.11,-1.45],[0,-1.57],
    [-.11,-1.45],[-.225,-1.28]],.205,'bronze',0,.015);
  for(const face of [-1,1]){
    diamond(0,-1.28,face*.134,.151,.197,'graphite',.050);
    diamond(0,-1.28,face*.168,.114,.151,'gild',.036);
    gem(0,-1.28,face*.213,.073,.106,.049);
  }

  // One continuous concave, LONG fighting blade: large silver swoop to
  // the left, an uninterrupted dagger point, and five deep RIGHT teeth.
  // The cutouts are real geometric negative spaces in the silhouette.
  const blade=[
    [-.18,.61],[-.32,.82],[-.45,1.06],
    [-.57,1.34],[-.72,1.70],[-.86,2.13],
    [-.86,2.43],[-.78,2.70],[-.62,3.07],
    [-.45,3.41],[-.24,3.69],[-.05,3.91],
    [.035,3.80],[.12,3.50],[.26,3.16],
    [.38,2.88],[.33,2.74],[.08,2.61],
    [.39,2.50],[.47,2.29],[.26,2.17],
    [.05,2.08],[.43,1.97],[.51,1.78],
    [.31,1.64],[.10,1.55],[.42,1.43],
    [.49,1.23],[.30,1.12],[.15,1.01],
    [.29,.85],[.16,.63]
  ];
  P(blade,.128,'silver',0,.010);
  // Actual forged steel panels raised above the blade's underlying
  // silver cutting edges, with separate illuminated narrow rune groove.
  for(const face of [-1,1]){
    const f=face;
    P([[-.145,.70],[-.30,.95],[-.44,1.26],
      [-.58,1.64],[-.70,2.10],[-.70,2.39],
      [-.64,2.66],[-.50,2.99],[-.32,3.37],
      [-.065,3.78],[.04,3.40],[.18,3.06],
      [.28,2.82],[.22,2.72],[-.04,2.60],
      [.26,2.48],[.36,2.31],[.16,2.18],
      [-.055,2.10],[.31,1.96],[.37,1.80],
      [.18,1.65],[-.06,1.54],[.30,1.41],
      [.33,1.25],[.12,1.11],[.04,.78]],
      .062,'graphite',f*.096,.007);
    // A second metal strip creates a pale faceted bevel on the convex
    // cutting edge. It runs nearly the entire blade length.
    P([[-.34,.97],[-.49,1.27],[-.63,1.67],
      [-.79,2.13],[-.79,2.42],[-.71,2.70],
      [-.56,3.06],[-.34,3.43],[-.055,3.84],
      [-.22,3.48],[-.43,3.05],[-.61,2.64],
      [-.65,2.37],[-.65,2.17],[-.49,1.68],
      [-.36,1.30]],.035,'edge',f*.144,.004);
    // Saw-tooth facets sit INSIDE the already serrated blade outline;
    // unlike added triangles, they cannot turn it into a blunt club.
    for(const [high,low] of [[1.23,1.47],[1.75,2.01],[2.25,2.48]]){
      P([[.10,high],[.34,high+.12],[.25,low],[-.02,low-.08]],
        .035,'iron',f*.143,.004);
    }
    // Long crimson engraved fuller: broad dark channel, raised red
    // inlay with one dominant diamond and smaller branching glyphs.
    P([[-.14,.77],[-.23,1.14],[-.33,1.73],
      [-.39,2.30],[-.27,2.91],[-.065,3.64],
      [.02,3.44],[-.08,2.84],[-.17,2.29],
      [-.08,1.69],[.10,1.14],[.09,.78]],
      .040,'inset',f*.146,.004);
    curve([[0,.76,f*.195],[-.075,1.25,f*.195],
      [-.20,1.82,f*.195],[-.27,2.31,f*.195],
      [-.19,2.86,f*.195],[-.052,3.49,f*.195]],
      .023,'light');
    diamond(-.18,2.21,f*.217,.128,.209,'bronze',.043);
    diamond(-.18,2.21,f*.244,.088,.145,'graphite',.032);
    gem(-.18,2.21,f*.279,.063,.107,.046);
    for(const [x,y,r] of [[-.078,1.31,.073],[-.245,2.77,.065],
      [-.10,3.19,.049]]){
      diamond(x,y,f*.225,r,r*1.42,'bronze',.023);
      diamond(x,y,f*.245,r*.58,r*.91,'light',.018);
    }
    for(const [x,y] of [[-.12,1.57],[-.245,2.48],[-.15,3.05]]){
      lip([x,y],[x+.095,y+.116],f*.209,'light',.012);
      lip([x+.095,y+.116],[x+.028,y+.19],f*.209,'light',.009);
    }
    // Engraving alongside the luminous central seam.
    curve([[-.30,1.13,f*.185],[-.48,1.78,f*.185],
      [-.55,2.34,f*.185],[-.39,2.96,f*.185]],
      .014,'bronze');
    for(let j=0;j<8;j++){
      const yy=1.27+j*.245;
      lip([-.66+yy*.022,yy],[-.635+yy*.022,yy+.057],
        f*.173,'silver',.004);
    }
  }

  // A very broad bat-winged demon crossguard. Upward horns and layered
  // red "dragon heart" armour link to the long serrated steel blade.
  const gy=.43;
  const wings=[
    [-1.03,gy+.12],[-.97,gy+.39],[-.68,gy+.21],
    [-.39,gy+.14],[0,gy+.35],
    [.39,gy+.14],[.68,gy+.21],
    [.97,gy+.39],[1.03,gy+.12],
    [.84,gy-.17],[.62,gy-.055],[.22,gy-.09],
    [0,gy-.35],[-.22,gy-.09],[-.62,gy-.055],
    [-.84,gy-.17]
  ];
  P(wings,.29,'bronze',0,.021);
  for(const face of [-1,1]){
    const f=face;
    for(const side of [-1,1]){
      P(cross([[.23,gy+.17],[.63,gy+.20],
        [.94,gy+.37],[.82,gy+.095],
        [.58,gy-.015],[.26,gy+.025]],side),
        .065,'graphite',f*.176,.009);
      P(cross([[.37,gy+.18],[.70,gy+.215],
        [.85,gy+.30],[.75,gy+.095],
        [.46,gy+.11]],side),.040,'gild',f*.228,.006);
      P(cross([[.58,gy+.25],[.95,gy+.48],
        [.83,gy+.16],[.66,gy+.125]],side),
        .085,'bronze',f*.203,.009);
      lip([side*.48,gy+.18],[side*.92,gy+.34],
        f*.262,'gild',.015);
      stud(side*.77,gy+.21,f*.27,.024);
    }
    P([[-.39,gy+.20],[0,gy+.65],[.39,gy+.20],
      [.27,gy-.11],[0,gy-.51],[-.27,gy-.11]],
      .115,'bronze',f*.242,.015);
    P([[-.272,gy+.15],[0,gy+.48],[.272,gy+.15],
      [.19,gy-.105],[0,gy-.34],[-.19,gy-.105]],
      .059,'graphite',f*.318,.008);
    diamond(0,gy+.07,f*.357,.251,.322,'bronze',.057);
    diamond(0,gy+.07,f*.398,.187,.251,'gild',.038);
    gem(0,gy+.07,f*.444,.132,.191,.059);
    gem(0,gy-.28,f*.356,.057,.086,.027);
  }
  g.userData.berserkerReferenceV2=true;
  g.userData.referenceSheet='Berserker Dual Blades 4-view: long serrated sickle-saber silver steel, red energy, horned bat-wing guard';
  g.userData.bladeLengthRatio='long demonic blade, ~3x grip length';
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
  // Reference-front reconstruction: project the supplied front elevation
  // into actual layered raised metalwork. Broad SILVER protective armour
  // must dominate the front; do not substitute thin upright dark bands.
  const faceMetal=(pts,depth,z,mat='silver')=>panel(pts,mat,z,depth);
  for(const side of [-1,1]){
    const F=points=>mirrored(points,side);
    // Thick black backing and its bronze perimeter act as the continuous
    // cladding behind each broad silver side panel.
    faceMetal(F([[.215,.68],[.36,.85],[.56,.80],[.73,.59],
      [.75,.23],[.72,-.28],[.77,-.67],[.69,-1.12],
      [.48,-1.44],[.27,-1.43],[.20,-1.20],[.20,-.48]]),
      .18,.622,'graphite');
    faceMetal(F([[.242,.66],[.39,.81],[.57,.72],[.695,.56],
      [.695,.20],[.665,-.30],[.70,-.69],[.624,-1.02],
      [.45,-1.337],[.28,-1.33],[.255,-1.16],[.24,-.45]]),
      .095,.733,'silver');
    // Raised narrow edge facet makes the large metal panel read as
    // a single shaped forged plate with a wide specular front surface.
    faceMetal(F([[.258,.56],[.36,.70],[.415,.72],[.377,.24],
      [.367,-.27],[.39,-.89],[.32,-1.17],[.289,-1.10]]),
      .029,.795,'edge');
    // Deep bevel on outer edge; dark seams delineate overlapping plates.
    faceMetal(F([[.59,.59],[.66,.55],[.64,.04],
      [.64,-.34],[.68,-.69],[.58,-1.08],
      [.54,-1.17],[.565,-.74],[.56,-.24]]),
      .052,.792,'iron');
    // The reference has a raised SHORTER panel above the main continuous
    // plate, sitting slightly outward, with actual beveled thickness.
    faceMetal(F([[.36,.13],[.58,.24],[.72,.13],[.745,-.20],
      [.705,-.64],[.57,-.86],[.38,-.72],[.36,-.41]]),
      .107,.833,'graphite');
    faceMetal(F([[.405,.065],[.582,.170],[.665,.067],[.690,-.20],
      [.66,-.55],[.556,-.72],[.43,-.645],[.418,-.32]]),
      .074,.912,'silver');
    // Large bright raised plane instead of three skinny white slivers.
    faceMetal(F([[.44,-.006],[.568,.082],[.587,-.125],
      [.58,-.51],[.535,-.59],[.47,-.55]]),
      .021,.966,'edge');
    line([side*.407,.034],[side*.413,-.575],.974,'gild',.011);
    line([side*.660,.04],[side*.675,-.51],.958,'iron',.011);
    for(const [x,y] of [[.582,.13],[.674,-.61],[.50,-.72]]){
      rivet(side*x,y,.965);
    }
    // Separate triangular lower armour plate with folded steel corners.
    faceMetal(F([[.24,-.85],[.44,-.78],[.67,-.86],
      [.714,-1.08],[.54,-1.37],[.31,-1.50],
      [.26,-1.33]]),.125,.836,'graphite');
    faceMetal(F([[.30,-.92],[.45,-.865],[.63,-.94],
      [.64,-1.08],[.505,-1.31],[.329,-1.406]]),
      .090,.922,'silver');
    faceMetal(F([[.34,-.99],[.43,-.943],[.445,-1.188],
      [.385,-1.31],[.341,-1.335]]),.024,.980,'edge');
    for(const y of [-1.00,-1.23])rivet(side*.579,y,.978);
    // Bronze side-fin, a narrow architectural rib NOT a dark broad band.
    faceMetal(F([[.75,.68],[.88,.74],[.86,-.68],
      [.70,-1.13],[.652,-1.23],[.724,-.64]]),
      .080,.717,'bronze');
    line([side*.804,.36],[side*.788,-.58],.777,'gild',.013);
  }

  // ONE wide central recessed trench bordered by two bronze rails.
  // Center occupies ~20% of shield width, with a single luminous spine.
  faceMetal([[-.218,.89],[0,1.18],[.218,.89],[.194,-1.32],
    [0,-1.54],[-.194,-1.32]],.125,.765,'bronze');
  faceMetal([[-.174,.785],[0,1.065],[.174,.785],
    [.149,-1.29],[0,-1.44],[-.149,-1.29]],
    .072,.843,'graphite');
  faceMetal([[-.127,.71],[0,.916],[.127,.71],
    [.117,-1.255],[0,-1.370],[-.117,-1.255]],
    .040,.893,'inset');
  for(const side of [-1,1]){
    line([side*.154,.68],[side*.143,-1.25],.939,'bronze',.020);
    line([side*.114,.67],[side*.106,-1.22],.944,'gild',.008);
  }
  // The energy motif follows the drawing: a continuous bright stroke,
  // one central framed diamond, subtle small diamond ornaments BELOW,
  // and a distinct lower crystal at the pointed shield nose.
  const emitZ=.965;
  curve([[0,.72,emitZ],[0,.29,emitZ],[0,-.12,emitZ],
    [0,-.46,emitZ],[0,-.98,emitZ]],.018,'light');
  // Dominant middle diamond: outer bevel, black inset, cyan faceted gem.
  diamond(0,-.12,.993,.130,.203,'gild',.054);
  diamond(0,-.12,1.027,.092,.148,'inset',.036);
  gem(0,-.12,1.061,.065,.113,.041);
  for(const [y,rx,ry] of [[-.54,.060,.103],[-.77,.039,.068]]){
    diamond(0,y,.994,rx,ry,'gild',.028);
    diamond(0,y,1.017,rx*.55,ry*.64,'light',.014);
  }
  // Narrow branch intersections above and below the large central gem.
  for(const s of [-1,1]){
    line([0,-.29],[s*.064,-.38],emitZ,'light',.009);
    line([s*.064,-.38],[0,-.46],emitZ,'light',.009);
    line([0,.20],[s*.062,.27],emitZ,'light',.009);
  }

  // Crown: broad bronze GOTHIC V, neither a row of standalone diamonds
  // nor thin upright metal prongs. This overhangs the silver side plates.
  faceMetal([[-.76,.86],[-.52,1.03],[-.30,1.08],[0,1.55],
    [.30,1.08],[.52,1.03],[.76,.86],
    [.60,.70],[.36,.76],[0,.515],[-.36,.76],[-.60,.70]],
    .202,.958,'bronze');
  faceMetal([[-.68,.854],[-.44,.991],[-.255,1.028],[0,1.444],
    [.255,1.028],[.44,.991],[.68,.854],
    [.547,.782],[.309,.845],[0,.625],[-.309,.845],[-.547,.782]],
    .080,1.081,'gild');
  faceMetal([[-.44,.936],[-.24,.990],[0,1.374],
    [.24,.990],[.44,.936],[.235,.792],[0,.580],[-.235,.792]],
    .070,1.158,'graphite');
  // Triangular jewel setting is larger than the old narrow upper spire.
  diamond(0,.985,1.225,.267,.346,'bronze',.076);
  diamond(0,.985,1.271,.196,.264,'gild',.062);
  diamond(0,.985,1.315,.142,.200,'inset',.034);
  gem(0,.988,1.364,.112,.163,.054);
  // Apex is a second SMALL turquoise jewel above the main crown jewel.
  diamond(0,1.423,1.260,.101,.142,'bronze',.054);
  gem(0,1.424,1.308,.065,.102,.036);
  for(const s of [-1,1]){
    line([s*.24,.966],[s*.62,.849],1.18,'gild',.016);
    line([s*.23,.823],[0,.594],1.200,'bronze',.020);
    rivet(s*.545,.855,1.150);
  }
  // Lower face is not an extension of the energy stripe: a separate
  // faceted armoured bronze spur supports one turquoise gemstone.
  faceMetal([[-.31,-1.275],[0,-1.605],[.31,-1.275],
    [.214,-1.194],[0,-1.381],[-.214,-1.194]],
    .150,1.013,'bronze');
  faceMetal([[-.185,-1.321],[0,-1.535],[.185,-1.321],
    [0,-1.421]],.067,1.102,'graphite');
  diamond(0,-1.394,1.148,.128,.174,'gild',.041);
  gem(0,-1.394,1.186,.073,.107,.045);
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
  // Procedural scratched PBR-metal finish. Metal, bronze and edge wear
  // are textured independently, without an image plane or downloaded asset.
  // Uses 256px maps, shared between corresponding meshes for mobile GPU use.
  if(typeof document!=='undefined' && typeof T.CanvasTexture==='function'){
    function forgedSurface(tint,seed){
      const canvas=document.createElement('canvas');
      canvas.width=256;canvas.height=256;
      const ctx=canvas.getContext('2d');
      if(!ctx)return null;
      const n=256;
      let state=seed>>>0;
      const rand=()=>((state=Math.imul(state,1664525)+1013904223>>>0)/4294967296);
      ctx.fillStyle=tint;
      ctx.fillRect(0,0,n,n);
      // Subtle oxidized spots and dents, not an overlaid flat noise picture.
      for(let i=0;i<1150;i++){
        const x=rand()*n,y=rand()*n,r=.4+rand()*7;
        ctx.fillStyle=rand()>.50?'rgba(248,245,226,.055)':'rgba(18,25,28,.060)';
        ctx.beginPath();ctx.ellipse(x,y,r,r*(.15+rand()*.45),
          rand()*Math.PI,0,Math.PI*2);ctx.fill();
      }
      // Scratches and diagonal tooling marks etched into aged metal.
      for(let i=0;i<410;i++){
        const x=rand()*n,y=rand()*n,len=1+rand()*18;
        ctx.beginPath();ctx.moveTo(x,y);
        ctx.lineTo(x+len*(rand()>.5?1:-1),y-len*(.20+rand()*.3));
        ctx.strokeStyle=rand()>.47?'rgba(255,247,230,.24)':'rgba(20,25,29,.16)';
        ctx.lineWidth=rand()>.93?1.2:.48;ctx.stroke();
      }
      const texture=new T.CanvasTexture(canvas);
      texture.wrapS=T.RepeatWrapping;texture.wrapT=T.RepeatWrapping;
      texture.repeat.set(1.30,1.50);
      if(T.SRGBColorSpace)texture.colorSpace=T.SRGBColorSpace;
      texture.anisotropy=2;
      return texture;
    }
    const steelFinish=forgedSurface('#e7e9e6',0x4a19e);
    const goldFinish=forgedSurface('#e7d8c1',0x7c4a12);
    const darkFinish=forgedSurface('#b3b4b2',0x539a74);
    for(const k of ['iron','silver','edge']){
      if(steelFinish){M[k].map=steelFinish;M[k].needsUpdate=true;}
    }
    for(const k of ['bronze','gild']){
      if(goldFinish){M[k].map=goldFinish;M[k].needsUpdate=true;}
    }
    if(darkFinish){M.graphite.map=darkFinish;M.graphite.needsUpdate=true;}
  }
  // Orthographic front reference: width 0.39~0.41 of full height.
  // Side reference: slim chassis with genuinely raised armor and 2 handles.
  // The previous model was nearly square in frontal projection and its
  // full unscaled Z range was almost as deep as its total visible width.
  // THESE ARE GEOMETRIC 3D TRANSFORMS, NOT a change to a flat image.
  g.scale.x=.715;
  g.scale.z=.285;
  g.userData.referenceSheet='Heavy Soldier Tower Shield — 4-view reference / 3D re-sculpt';
  g.userData.hasRearLeatherGrips=true;
 }
 function bow(){
  // 2026-10-22 ARCHER BOW / four-view image matched TRUE 3D model.
  // Recurve limbs sweep backward from a small leather grip. The
  // bowstring is a SINGLE straight taut string connecting the nocks,
  // NOT the previous fake triangular V running into the middle.
  // Front view: dark forged/wood limbs, long bronze-silver edges,
  // cyan channels, central leather wrap and opposing hooked tips.
  const P=(pts,dep,mat,z=0,b=.006)=>prism(pts,dep,mat,z,b);
  const sideShape=(pts,s)=>pts.map(([x,y])=>[x,y*s]);
  const draw=(pts,z,th,mat)=>P(pts,th,mat,z,.005);
  const line=(a,b,z,mat='gild',r=.010)=>trim(a,b,z,mat,r);
  const stud=(x,y,z,sz=.020)=>add(new T.SphereGeometry(sz,8,6),'bronze',x,y,z);
  // The precise string nocks are both LEFT of the riser in frontal view.
  const stringX=-.705,stringY=1.66;
  // Only one thin, dark, tensioned string, not two diagonals and not a bow
  // made of rods: strings are genuinely thin cylindrical geometry.
  rod([stringX,-stringY,0],[stringX,stringY,0],.007,'wrap',7);
  // Small end collars securing the cord to the curved metal nocks.
  for(const s of [-1,1]){
    rod([stringX,s*1.66,-.025],[stringX+.085,s*1.53,.004],.023,'bronze',9);
    rod([stringX,s*1.66,.013],[stringX+.068,s*1.60,.026],.014,'gild',8);
    gem(stringX+.055,s*1.57,.063,.032,.064,.024);
  }
  // The real lower two-thirds leather grip has two bronze ring collars.
  // Keep the grip compact: the reference is a bow, not an enormous hammer.
  rod([0,-.27,0],[0,.27,0],.094,'graphite',12);
  rod([0,-.235,0],[0,.235,0],.111,'leather',12);
  for(let s of [-1,1]){
    const spiral=[];
    const turns=s===1?7:-7;
    for(let i=0;i<=98;i++){
      const t=i/98,a=t*turns*Math.PI*2+(s===-1?Math.PI:0);
      spiral.push([Math.cos(a)*.116,-.23+t*.46,Math.sin(a)*.116]);
    }
    curve(spiral,.009,'wrap');
  }
  for(const y of [-.26,.26]){
    add(new T.CylinderGeometry(.128,.128,.062,12),'bronze',0,y,0);
    add(new T.CylinderGeometry(.123,.123,.012,12),'gild',0,y+.030,0);
  }
  // The two grip gems are integrated into socket ends rather than a
  // single oversized center diamond. They face the front and back.
  for(const s of [-1,1]){
    const gemY=s*.345;
    P([[-.18,gemY-s*.06],[-.08,gemY+s*.13],
      [.067,gemY+s*.17],[.22,gemY-s*.03],
      [.075,gemY-s*.16],[-.10,gemY-s*.15]],.175,'bronze',0,.013);
    for(const f of [-1,1]){
      diamond(0,gemY,f*.120,.119,.150,'graphite',.044);
      diamond(0,gemY,f*.149,.083,.111,'gild',.031);
      gem(0,gemY,f*.185,.057,.080,.032);
    }
  }
  // A shallow bronze brace bridges the grip to the two arched limbs.
  // The lower guard is inverted, just like the separate lower riser.
  for(const s of [-1,1]){
    P(sideShape([[.03,.225],[-.18,.34],[-.36,.42],
      [-.22,.52],[-.015,.415],[.19,.30]],s),
      .155,'bronze',0,.013);
    P(sideShape([[.02,.27],[-.16,.38],[-.275,.44],
      [-.15,.455],[.10,.32]],s),.078,'iron',.100,.006);
    // The reference's unmistakable ANTIQUE RECURVE blade silhouette.
    // The concave outer arc has TWO bends and flared spurs; the pointed
    // nock at +/- 1.7 is behind the riser, not parallel to it.
    const bowLimb=[
      [-.115,.29],[-.255,.40],[-.34,.53],[-.43,.71],
      [-.47,.94],[-.54,1.12],[-.635,1.31],
      [-.74,1.47],[-.78,1.70],[-.665,1.76],
      [-.59,1.63],[-.61,1.49],[-.54,1.28],
      [-.37,1.055],[-.24,.83],[-.16,.59],
      [.025,.42],[.21,.33],[.085,.26]
    ];
    P(sideShape(bowLimb,s),.172,'graphite',0,.016);
    // A narrower steel spine runs almost the entire length, creating
    // an authentic 3D bevel and a narrow SIDE orthographic profile.
    P(sideShape([[-.13,.39],[-.27,.57],[-.375,.83],
      [-.48,1.15],[-.665,1.47],[-.705,1.61],
      [-.679,1.67],[-.556,1.40],[-.35,1.04],
      [-.21,.75],[-.07,.52]],s),.192,'iron',0,.009);
    for(const f of [-1,1]){
      // Multi-level solid bronze border on BOTH faces. A separate bright
      // silver highlight runs along the swept outside edges.
      const z=f*.103;
      draw(sideShape([[-.14,.42],[-.30,.58],[-.411,.82],
        [-.491,1.125],[-.66,1.42],[-.745,1.66],
        [-.70,1.704],[-.588,1.43],[-.43,1.123],
        [-.269,.81],[-.12,.55]],s),z,.040,'bronze');
      draw(sideShape([[-.235,.53],[-.384,.79],
        [-.468,1.116],[-.647,1.43],[-.736,1.66],
        [-.708,1.676],[-.599,1.408],[-.43,1.106],
        [-.306,.79]],s),z+f*.032,.023,'gild');
      // Long dark central lane contained INSIDE each upper/lower
      // blade; do not create an additional independent bow body.
      draw(sideShape([[-.230,.48],[-.374,.70],[-.437,.92],
        [-.502,1.15],[-.665,1.43],[-.631,1.47],
        [-.446,1.17],[-.33,.94],[-.226,.70],
        [-.107,.50]],s),z+f*.041,.035,'inset');
      // Vertical illuminated cyan "inlaid glass" side channels.
      curve([[-.205,s*.53,f*.165],[-.325,s*.76,f*.165],
        [-.423,s*1.035,f*.165],[-.56,s*1.29,f*.165],
        [-.622,s*1.43,f*.165]],.012,'light');
      for(const t of [.70,1.31]){
        // Each turquoise rune has a tiny arrow-like branch.
        gem(-.33-(t-.70)*.38,s*t,f*.178,.024,.053,.023);
      }
      // Sharpened metallic line outside of the cyan channel.
      curve([[-.22,s*.51,f*.151],[-.385,s*.85,f*.151],
        [-.508,s*1.16,f*.151],[-.704,s*1.56,f*.151]],
        .010,'silver');
      // Raised pointed wing armour at limb roots, seen prominently
      // on the sheet as bronze spikes jutting inward toward the string.
      draw(sideShape([[-.085,.42],[-.41,.76],[-.60,.97],
        [-.54,.71],[-.43,.62],[-.36,.39],[-.19,.34]],s),
        f*.145,.116,'bronze');
      draw(sideShape([[-.16,.42],[-.40,.695],[-.518,.82],
        [-.45,.625],[-.31,.415]],s),
        f*.207,.040,'iron');
      draw(sideShape([[-.26,.46],[-.42,.68],[-.462,.70],
        [-.355,.50]],s),f*.244,.020,'gild');
      // Small high wing finials at the metal socket, not separate
      // free-floating spears.
      draw(sideShape([[.10,.31],[-.18,.55],[-.37,.58],
        [-.31,.38],[-.095,.255]],s),f*.161,.093,'bronze');
      draw(sideShape([[.01,.32],[-.20,.50],[-.282,.50],
        [-.21,.34]],s),f*.215,.030,'silver');
      stud(-.22,s*.43,f*.243,.025);
    }
    // A distinct curved gold cap protects each hooked nock.
    P(sideShape([[-.626,1.48],[-.76,1.61],[-.805,1.765],
      [-.664,1.84],[-.572,1.702],[-.607,1.58]],s),
      .21,'bronze',0,.016);
    P(sideShape([[-.655,1.59],[-.766,1.700],
      [-.688,1.785],[-.620,1.675]],s),
      .105,'gild',.094,.008);
    P(sideShape([[-.653,1.58],[-.736,1.66],
      [-.672,1.745],[-.638,1.67]],s),
      .050,'inset',.158,.006);
    gem(-.688,s*1.677,.208,.036,.069,.024);
    // End nock rivet and string wrap, visible from 3/4 angle.
    stud(-.687,s*1.60,.215,.019);
  }
  // Correct string anchor position and full-height straight alignment.
  // Tiny braided metallic wraps at each string-to-nock attachment.
  for(const s of [-1,1]){
    rod([stringX,s*1.605,-.015],[stringX,s*1.715,-.015],
      .012,'silver',7);
  }
  g.userData.referenceSheet='2026-10-22 Archer Bow 4-view 3D reference';
  g.userData.stringLayout='single straight vertical string, left of riser';
  g.userData.sideProfile='thin solid extruded recurve limbs, no image planes';
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
 else if(name==='warrior')greatsword();
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
