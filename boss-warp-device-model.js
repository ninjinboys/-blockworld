// NEXACRAFT placed boss warp obelisk.
// The geometry below is ported directly from warp-device.html's latest
// visual reference; it is NOT a simplified alternative design.
// Sculpt once and reuse its geometry through instancing inside game chunks.
// Preview's ~20-unit obelisk is reduced to 5.2 blocks at .255 world scale.
export function createBossWarpDeviceModel(T){
  let template=null;
  function makeTemplate(){
    const g=new T.Group();
const C={
 basalt:0x1c2326,deep:0x11191c,shadow:0x0c1417,stone:0x313b3d,
 mid:0x414c4c,edge:0x596362,light:0x636962,moss:0x38583b,leaf:0x507144,
 teal:0x26c9b7,glow:0x79ffdf
};
const blocks=[],lights=[];
let seed=1741;
function rnd(){seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296}
const stones=[C.basalt,C.stone,C.mid,C.stone,C.edge,C.mid,C.basalt];
function pick(){return stones[Math.floor(rnd()*stones.length)]}
function b(x,y,z,w,h,d,color=C.stone,rot=0){blocks.push({x,y,z,w,h,d,color,rot})}
function lit(x,y,z,w,h,d,color=C.teal,rot=0){lights.push({x,y,z,w,h,d,color,rot})}
function planeShape(points,z0,z1,color,bevel=.025){
 const p=new T.Shape();p.moveTo(points[0][0],points[0][1]);
 for(let i=1;i<points.length;i++)p.lineTo(...points[i]);p.closePath();
 const mesh=new T.Mesh(new T.ExtrudeGeometry(p,{
  depth:z1-z0,bevelEnabled:bevel>0,bevelThickness:bevel,
  bevelSize:bevel,bevelSegments:1,steps:1,curveSegments:1
 }),new T.MeshStandardMaterial({color,flatShading:true,roughness:.95,metalness:0}));
 mesh.position.z=z0;g.add(mesh);return mesh;
}
function gem(x,y,z,sx,sy,sz,bright=false){
 const o=new T.Mesh(new T.OctahedronGeometry(1,0),new T.MeshStandardMaterial({
  color:bright?0xb4ffea:0x45dac9,
  emissive:bright?0x4affa5:0x19c2b8,emissiveIntensity:bright?1.65:.95,
  metalness:.10,roughness:.13,flatShading:true,transparent:true,opacity:.90
 }));
 o.position.set(x,y,z);o.scale.set(sx,sy,sz);g.add(o);
 if(bright){
  const edges=new T.LineSegments(new T.EdgesGeometry(o.geometry),
   new T.LineBasicMaterial({color:0xcffff4,transparent:true,opacity:.66}));
  edges.position.copy(o.position);edges.scale.copy(o.scale).multiplyScalar(1.012);g.add(edges);
 }
 return o;
}
// Ancient ruined platform, a broad black stone pedestal, not a toy foundation.
b(0,.24,-.33,11.8,.48,8.05,C.deep);
b(0,.53,-.33,11.4,.22,7.8,C.basalt);
for(let ix=-11;ix<=11;ix++)for(let iz=-7;iz<=7;iz++){
 const x=ix*.49,z=iz*.49-.44;
 if(Math.abs(x)>5.46||Math.abs(z+.33)>3.74)continue;
 const col=pick();
 b(x,.73+(rnd()-.5)*.02,z,.466,.19,.465,col);
 if(rnd()<.057)b(x+.10,.835,z,.22,.035,.16,C.moss);
}
for(const side of [-1,1]){
 for(let i=-7;i<=7;i++){
  b(side*5.67,.89,i*.49-.32,.49,.73,.52,pick());
  if(i%3===0)b(side*5.68,1.33,i*.49-.32,.48,.12,.54,C.edge);
 }
 for(let p=0;p<2;p++){
  const x=side*4.64,z=p===0?1.98:-2.63;
  b(x,1.26,z,1.06,1.17,1.11,C.stone);
  b(x,1.92,z,1.19,.19,1.23,C.edge);
  b(x,1.26,z+.60,.76,.67,.10,C.deep);
  gem(x,1.26,z+.69,.23,.37,.10,true);
  b(x-.15,1.98,z+.14,.35,.07,.24,C.moss);
 }
}
for(let step=0;step<4;step++){
 const z=4.24-step*.49;
 for(let i=-5;i<=5;i++){
  const x=i*.47,height=.16+(step+1)*.17;
  b(x,height/2,z,.45,height,.52,step%3===0?C.mid:C.stone);
  b(x,height+.06,z,.445,.12,.50,i%4===0?C.edge:C.mid);
 }
}
// Obelisk base risers and heavy corner supports.
for(let i=-2;i<=2;i++)for(let j=-2;j<=1;j++)
 b(i*.7,1.08,j*.65-1.26,.68,.64,.62,pick());
for(const side of [-1,1]){
 for(let j=0;j<5;j++){
  b(side*(4.51-j*.11),1.56+j*.37,-1.47,.99,.74,1.46,pick());
 }
}
// Two BROKEN half-rings: huge sweeping stone limbs beside the obelisk.
// They rise well above the core but stop before meeting, matching the photo.
const archStoneMats=[C.basalt,C.stone,C.mid,C.stone,C.edge].map(c=>
 new T.MeshStandardMaterial({color:c,roughness:.95,flatShading:true}));
const glowMat=new T.MeshBasicMaterial({color:0x36c8b6,toneMapped:false});
const seamVertices=[];
const archBase=2.15,archRise=12.4,archSpan=5.18,arcMax=1.14;
function circlePt(side,r,a){return [side*r*Math.cos(a),archBase+archRise*(r/archSpan)*Math.sin(a)]}
function wedge(side,inner,outer,a0,a1,material,z0=-1.46,z1=.05){
 const points=[
  circlePt(side,inner,a0),circlePt(side,outer,a0),
  circlePt(side,outer,a1),circlePt(side,inner,a1)
 ];
 const shape=new T.Shape();shape.moveTo(...points[0]);for(let i=1;i<4;i++)shape.lineTo(...points[i]);shape.closePath();
 const glow=material===glowMat;
 const geo=new T.ExtrudeGeometry(shape,{
  depth:z1-z0,bevelEnabled:!glow,bevelThickness:glow?0:.045,
  bevelSize:glow?0:.035,bevelSegments:1,steps:1
 });
 const mesh=new T.Mesh(geo,material);mesh.position.z=z0;g.add(mesh);
}
for(const side of [-1,1]){
 const n=15;
 for(let j=0;j<n;j++){
  const a0=j*arcMax/n+.003,a1=(j+1)*arcMax/n-.005;
  wedge(side,4.14,5.21,a0,a1,archStoneMats[(j+Math.floor(rnd()*3))%archStoneMats.length]);
  // Thin turquoise inner inlay, not wide blocks of neon.
  wedge(side,4.07,4.14,a0+.002,a1-.002,glowMat,-.82,-.65);
  if(j%3===1){
   const a=(a0+a1)*.5,[x,y]=circlePt(side,5.23,a);
   seamVertices.push(x,y,.105,x+side*.20,y+.25,.107,x+side*.20,y+.25,.107,x-side*.14,y+.42,.107);
  }
  if(j%4===0){
   const [x,y]=circlePt(side,5.25,(a0+a1)/2);
   b(x,y+.13,.22,.37,.18,.33,C.moss,-side*(a0+a1)/2);
  }
 }
 const tip=circlePt(side,4.72,arcMax);
 b(tip[0]+side*.12,tip[1]+.29,-.70,1.45,.76,1.29,C.stone,-side*arcMax);
 b(tip[0]+side*.27,tip[1]+.65,-.81,.95,.38,.95,C.mid,-side*(arcMax+.08));
 // Crumbled stone and vines at both arch feet.
 for(let j=0;j<9;j++){
  const a=.12+(j%6)*.12,[x,y]=circlePt(side,5.22,a);
  if(j%3===0){
   b(x,y,.23,.24,.23,.33,C.moss,-side*a);
   for(let h=0;h<3;h++)b(x+side*.09,y-.27*h,.38,.105,.25,.11,C.leaf);
  }
 }
}
// One dominating ARK-like obelisk, tapered and angular: rises ABOVE both arches.
planeShape([[-1.21,2.04],[1.21,2.04],[1.35,5.95],[1.00,7.10],
 [1.01,13.0],[.79,14.65],[.73,17.45],[.66,19.38],[.50,20.16],
 [.16,20.25],[-.10,20.06],[-.36,20.28],[-.57,20.02],[-.70,19.44],[-.73,17.45],[-.79,14.65],
 [-1.01,13.0],[-1.00,7.1],[-1.35,5.95]],-3.09,-1.36,C.basalt,.075);
planeShape([[-.72,4.10],[.72,4.10],[.76,11.6],[.55,15.4],
 [.35,18.15],[.25,19.35],[.08,19.88],[-.20,19.62],[-.35,18.15],[-.55,15.4],[-.76,11.6]],-1.42,-1.26,C.stone,.025);
// Stone masonry relief. Keep the obelisk ONE monolithic form, not stacked Lego.
for(let j=0;j<22;j++){
 const y=2.80+j*.69,w=y<6.8?1.25:y<13?.95:y<17?.69:.39;
 for(let k=0;k<3;k++){
  const px=(k-1)*w*.63;
  b(px,y,-1.21,.52+(w-.50)*.37,.13,.085,j%5===0?C.edge:C.mid);
  if((j+k)%6===0)b(px,y+.24,-1.21,.062,.48,.092,C.deep);
 }
 if(j>3&&j<17&&j%2===0){
  for(const side of [-1,1])lit(side*w*.73,y+.15,-1.12,.072,.47,.09,C.teal);
 }
}
for(const side of [-1,1]){
 // Angular outriggers and secondary antenna-spires (ARK technology).
 planeShape([[side*.85,2.2],[side*2.34,2.2],[side*2.14,4.8],
  [side*1.63,6.1],[side*1.41,10.7],[side*1.15,11.8],
  [side*.96,10.4]],-2.95,-1.50,C.stone,.03);
 planeShape([[side*1.46,4.4],[side*1.76,5.2],[side*1.57,9.8],
  [side*1.47,10.8],[side*1.39,9.5]],-1.47,-1.38,C.deep,0);
 for(let k=0;k<11;k++){
  const y=4.1+k*.58;
  lit(side*(1.55-.03*k),y,-1.34,.105,.32,.075,C.teal);
 }
 // Thick ornament at central star: carved angular armored collar.
 planeShape([[side*.55,5.1],[side*1.68,6.2],[side*1.84,7.8],
 [side*1.33,9.7],[side*.81,10.1],[side*.90,8.3],
 [side*.61,7.4]],-.99,-.43,C.mid,.045);
 planeShape([[side*.83,6.05],[side*1.48,6.83],[side*1.61,7.85],
 [side*1.12,8.78],[side*.91,8.1]],-.37,-.25,C.basalt,.025);
 // Sharp fins at upper tower, separated from core.
 planeShape([[side*.75,12.3],[side*1.20,13.1],[side*1.22,15.8],
 [side*.89,17.0],[side*.71,16.4]],-2.75,-2.15,C.mid,.015);
 for(let j=0;j<4;j++){
  const y=10.0+j*1.35;
  b(side*(1.14+.13*j),y,-2.76,.37,.46,.35,pick());
 }
}
// Floating shattered masonry set in purposeful orbit around the obelisk.
const debris=[
 [-6.15,7.10,-.87,.78],[-5.42,11.14,-1.34,1.18],
 [-3.76,15.11,-1.65,1.05],[-2.06,17.40,-2.12,1.18],
 [2.11,17.70,-1.98,1.06],[3.83,15.12,-1.64,1.18],
 [5.40,11.44,-1.30,1.05],[6.27,7.35,-1.00,.72],
 [-2.20,9.32,.67,.42],[2.26,10.12,.74,.41],
 [-1.51,7.01,1.11,.31],[1.42,7.15,1.05,.30]
];
for(const [i,[x,y,z,size]] of debris.entries()){
 const phi=(rnd()-.5)*.54,stone=pick();
 b(x,y,z,size,size*(.77+.15*rnd()),size*.95,stone,phi);
 b(x+.08,y-size*.18,z+size*.48,size*.45,.079,.068,C.deep,phi);
 lit(x-.08,y-.16,z+size*.50,size*.40,.045,.042,C.teal,phi);
 if(i%3===0)b(x-.13,y+size*.41,z,.28,.07,.30,C.moss,phi);
 if(size>.95)b(x+size*.33,y+.10,z-.24,size*.37,.41,.50,C.stone,phi);
}
// Central energy STAR: exactly four long sharp rays, encircled by relic armor.
const shape=new T.Shape();
shape.moveTo(0,1.91);shape.lineTo(.22,.26);shape.lineTo(1.98,0);
shape.lineTo(.22,-.26);shape.lineTo(0,-1.92);shape.lineTo(-.22,-.26);
shape.lineTo(-1.98,0);shape.lineTo(-.22,.26);shape.closePath();
const starGeo=new T.ExtrudeGeometry(shape,{depth:.18,
 bevelEnabled:true,bevelThickness:.095,bevelSize:.10,bevelSegments:1});
const star=new T.Mesh(starGeo,new T.MeshBasicMaterial({color:0x69f6d8,toneMapped:false}));
star.position.set(0,8.42,.20);g.add(star);
const core=new T.Mesh(new T.OctahedronGeometry(1,0),
 new T.MeshStandardMaterial({color:0xc3fff2,emissive:0x6effc8,
 emissiveIntensity:2.0,roughness:.05,transparent:true,opacity:.96}));
core.position.set(0,8.42,.52);core.scale.set(.42,.64,.35);g.add(core);
const diamondStar=new T.Mesh(starGeo,new T.MeshBasicMaterial({color:0xffffff,toneMapped:false}));
diamondStar.position.set(0,8.42,.58);diamondStar.scale.set(.25,.25,.37);g.add(diamondStar);
for(const side of [-1,1]){
 lit(side*.41,8.42,-.47,.10,3.6,.16,C.teal);
 lit(side*.91,8.4,-.42,.05,2.1,.10,C.teal);
 for(let j=0;j<4;j++)gem(side*(1.46+j*.22),8.42+(j-1.5)*.6,.24,.12,.19,.10,true);
}
lit(0,8.5,-1.11,.23,5.0,.17,C.teal);
lit(0,5.03,-.98,.43,2.75,.16,0x0a7778);
for(let j=0;j<11;j++){
 const a=j*2.4,r=1.5+(j%3)*.29;
 gem(Math.cos(a)*r,8.42+Math.sin(a)*r*.89,.62+(j%2)*.20,
  .09+(j%2)*.07,.13+(j%3)*.06,.13,true);
}
// Central altar receives artifacts and activates the four guardian boss portals.
b(0,1.35,.18,2.3,.52,1.74,C.basalt);
for(let j=0;j<4;j++)b(0,1.66+j*.17,.18,2.2-j*.17,.16,1.65-j*.12,pick());
lit(0,2.29,.34,.90,.060,.85);
b(-1.78,1.14,1.69,1.50,.88,1.40,C.stone);
b(-1.78,1.62,1.69,1.61,.13,1.54,C.edge);
lit(-1.78,1.70,1.69,1.04,.05,.99);
b(-1.78,1.74,1.69,.72,.06,.66,C.shadow);
gem(-1.78,1.22,2.42,.20,.34,.14,true);
// Subtle radial glow is baked into one translucent sprite: no costly bloom pass.
const glowCanvas=document.createElement('canvas');
glowCanvas.width=glowCanvas.height=64;const gx=glowCanvas.getContext('2d');
const gradient=gx.createRadialGradient(32,32,2,32,32,32);
gradient.addColorStop(0,'rgba(85,255,202,.39)');
gradient.addColorStop(.36,'rgba(21,196,165,.13)');
gradient.addColorStop(1,'rgba(21,196,165,0)');
gx.fillStyle=gradient;gx.fillRect(0,0,64,64);
const corona=new T.Sprite(new T.SpriteMaterial({
 map:new T.CanvasTexture(glowCanvas),
 transparent:true,blending:T.AdditiveBlending,depthWrite:false
}));
corona.position.set(0,8.42,.30);corona.scale.set(5.7,5.7,1);g.add(corona);
// Sparse moss and ancient dark rubble grow only at actual masonry joints.
for(const side of [-1,1]){
 for(let k=0;k<13;k++){
  const a=.13+(k%9)*.085,[x,y]=circlePt(side,5.26,a);
  if(k%3===1){b(x,y+.12,.29,.27,.15,.28,C.moss,-side*a);
   if(k%2===1)for(let j=0;j<3;j++)b(x,y-.16-j*.20,.34,.10,.22,.13,C.leaf);}
 }
 for(let k=0;k<11;k++){
  const x=side*(3+rnd()*1.8),z=-2.80+rnd()*1.65;
  b(x,.94+rnd()*.30,z,.29+rnd()*.46,.26+rnd()*.33,.32+rnd()*.34,pick());
 }
}
if(seamVertices.length){
 const geom=new T.BufferGeometry();
 geom.setAttribute('position',new T.Float32BufferAttribute(seamVertices,3));
 g.add(new T.LineSegments(geom,new T.LineBasicMaterial({color:0x0a1114,transparent:true,opacity:.85})));
}
// Use instancing rather than hundreds of draw calls, keeping iPad performance.
const boxGeo=new T.BoxGeometry(1,1,1),D=new T.Object3D();
function addBatch(list,material,perInstanceColors=true){
 const mesh=new T.InstancedMesh(boxGeo,material,list.length);mesh.instanceMatrix.setUsage(T.StaticDrawUsage);
 list.forEach((p,i)=>{D.position.set(p.x,p.y,p.z);D.rotation.set(0,0,p.rot||0);D.scale.set(p.w,p.h,p.d);D.updateMatrix();mesh.setMatrixAt(i,D.matrix);if(perInstanceColors)mesh.setColorAt(i,new T.Color(p.color))});
 mesh.instanceMatrix.needsUpdate=true;if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;
 mesh.frustumCulled=false;g.add(mesh);
}
addBatch(blocks,new T.MeshStandardMaterial({color:0xffffff,roughness:.85,metalness:0,flatShading:true,vertexColors:false}));
addBatch(lights,new T.MeshBasicMaterial({color:0xffffff,toneMapped:false}));

    return g;
  }
  function build(anchors,scene,meshes,lookup,built,id){
    if(!anchors.length)return;
    if(!template)template=makeTemplate();
    const dummy=new T.Object3D(),root=new T.Object3D(),inner=new T.Matrix4(),world=new T.Matrix4();
    const anchorList=anchors.map(a=>{
      const pivot=new T.Object3D();
      pivot.position.set(a.x,a.y-.5,a.z);
      pivot.scale.setScalar(.255);
      pivot.updateMatrix();
      return pivot.matrix.clone();
    });
    for(const source of template.children){
      // Lines and glow sprites do not affect portal selection. Solid
      // masonry, floating stones, cyan inlays and star remain actual 3D.
      if(!source.isMesh)continue;
      const n=source.isInstancedMesh?source.count:1;
      const mesh=new T.InstancedMesh(source.geometry,source.material,anchors.length*n);
      const targets=[];let index=0;
      source.updateMatrix();
      for(let a=0;a<anchors.length;a++){
        for(let i=0;i<n;i++){
          if(source.isInstancedMesh)source.getMatrixAt(i,inner);
          else inner.identity();
          world.copy(anchorList[a]).multiply(source.matrix).multiply(inner);
          mesh.setMatrixAt(index++,world);
          targets.push(anchors[a]);
        }
      }
      mesh.instanceMatrix.needsUpdate=true;
      if(source.isInstancedMesh&&source.instanceColor){
        for(let a=0;a<anchors.length;a++)for(let i=0;i<n;i++){
          const color=new T.Color();source.getColorAt(i,color);
          mesh.setColorAt(a*n+i,color);
        }
        mesh.instanceColor.needsUpdate=true;
      }
      mesh.userData.id=id;
      mesh.castShadow=false;mesh.receiveShadow=true;mesh.frustumCulled=false;
      scene.add(mesh);meshes.push(mesh);lookup.set(mesh.uuid,targets);built.push(mesh);
    }
  }
  return {build};
}
