/* NEXACRAFT original wildlife and hostile models for the 3D encyclopedia.
 * Geometry is reused verbatim from app.js as of 2026-10-18: the gallery shows
 * the actual in-game cows, sheep, pigs, horses, bison, lions, anacondas,
 * zombies, and skeletons, without modifying gameplay or saved worlds.
 * Keep this gallery copy in sync when their in-game meshes change.
 */
export const LEGACY_MOBS=[
 {id:'sheep',name:'羊',kind:'草食・草原',height:'約1.6ブロック'},
 {id:'pig',name:'豚',kind:'草食・草原',height:'約1.5ブロック'},
 {id:'cow',name:'牛',kind:'草食・草原',height:'約1.7ブロック'},
 {id:'zombie',name:'ゾンビ',kind:'敵対・夜',height:'約1.8ブロック'},
 {id:'horse',name:'馬',kind:'草食・草原／騎乗可能',height:'約2.9ブロック'},
 {id:'bison',name:'バイソン',kind:'大型・草原',height:'約3.6ブロック'},
 {id:'lion',name:'ライオン',kind:'肉食・草原',height:'約3.3ブロック'},
 {id:'anaconda',name:'オオアナコンダ',kind:'肉食・草原',height:'全長約8ブロック'},
 {id:'skeleton',name:'スケルトン',kind:'敵対・夜',height:'約1.8ブロック'}
];
export function createLegacyMobModels(THREE){
 const mobMaterials=new Map();
 function mobMat(color){
  const key=String(color);
  if(!mobMaterials.has(key))mobMaterials.set(key,new THREE.MeshLambertMaterial({color}));
  return mobMaterials.get(key);
 }
 function cube(g,sx,sy,sz,color,x,y,z,rx=0,ry=0,rz=0){
  const m=new THREE.Mesh(new THREE.BoxGeometry(sx,sy,sz),mobMat(color));
  m.position.set(x,y,z);m.rotation.set(rx,ry,rz);
  m.castShadow=true;m.receiveShadow=true;g.add(m);return m;
 }
 function voxelPatch(g,color,x,y,z,sx,sy,sz){return cube(g,sx,sy,sz,color,x,y,z)}
function buildSheep(){
  const g=new THREE.Group();
  const wool=0xf2efe6,woolLight=0xfffdf7,woolShade=0xd9d4c8,skin=0xd8c6aa,ear=0xe8b0a3,eye=0x171717,nose=0xd98987,hoof=0x4a3b35;

  // About 1 block wide and under 2 blocks long overall.
  cube(g,.96,.74,1.10,wool,0,1.00,.02);
  cube(g,.86,.16,1.16,woolLight,0,1.40,.02);
  for(const x of[-.29,0,.29])for(const z of[-.36,0,.36]){
    cube(g,.24,.18,.28,(x===0?woolLight:woolShade),x,1.37,z);
  }

  // head
  cube(g,.58,.58,.50,skin,0,1.08,-.78);
  cube(g,.66,.20,.57,woolLight,0,1.40,-.77);
  cube(g,.16,.22,.16,woolShade,-.23,1.45,-.88);
  cube(g,.16,.22,.16,woolShade,.23,1.45,-.88);

  // ears
  cube(g,.20,.16,.12,skin,-.35,1.18,-.79,0,0,.14);
  cube(g,.20,.16,.12,skin,.35,1.18,-.79,0,0,-.14);
  cube(g,.11,.09,.07,ear,-.36,1.18,-.86,0,0,.14);
  cube(g,.11,.09,.07,ear,.36,1.18,-.86,0,0,-.14);

  // face
  cube(g,.09,.14,.035,eye,-.15,1.19,-1.045);
  cube(g,.09,.14,.035,eye,.15,1.19,-1.045);
  cube(g,.18,.11,.055,nose,0,1.03,-1.05);
  cube(g,.07,.06,.06,0x7a514a,0,.96,-1.055);

  // legs
  for(const x of[-.29,.29])for(const z of[-.36,.36]){
    cube(g,.20,.50,.20,skin,x,.47,z);
    cube(g,.22,.14,.22,hoof,x,.17,z);
  }
  return g;
}

function buildPig(){
  const g=new THREE.Group();
  const pink=0xef8f95,pinkLight=0xf6a4a9,pinkShade=0xd96f78,snout=0xf3a0a2,nostril=0x70464a,eye=0x171717,hoof=0x5b3c3e;

  // slimmer body, longer front-to-back silhouette
  cube(g,.95,.68,1.12,pink,0,.94,.02);
  cube(g,.84,.14,1.16,pinkLight,0,1.31,.02);

  // head
  cube(g,.60,.56,.50,pinkLight,0,1.03,-.80);
  cube(g,.36,.22,.14,snout,0,.96,-1.095);
  cube(g,.07,.07,.035,nostril,-.10,.96,-1.175);
  cube(g,.07,.07,.035,nostril,.10,.96,-1.175);
  cube(g,.08,.13,.035,eye,-.15,1.17,-1.045);
  cube(g,.08,.13,.035,eye,.15,1.17,-1.045);

  // ears
  cube(g,.20,.25,.11,pinkShade,-.27,1.34,-.80,0,0,-.10);
  cube(g,.20,.25,.11,pinkShade,.27,1.34,-.80,0,0,.10);

  // legs
  for(const x of[-.29,.29])for(const z of[-.37,.37]){
    cube(g,.20,.46,.20,pinkShade,x,.44,z);
    cube(g,.22,.13,.22,hoof,x,.17,z);
  }

  // curled tail
  cube(g,.10,.10,.20,pinkShade,.35,1.02,.62);
  cube(g,.10,.22,.10,pinkShade,.35,1.12,.73);
  cube(g,.17,.10,.10,pinkShade,.28,1.22,.73);
  return g;
}

function buildCow(){
  const g=new THREE.Group();
  const brown=0x744a32,brownDark=0x4f3024,white=0xf1eee5,cream=0xd9c6aa,pink=0xd88f91,eye=0x141414,hoof=0x292525,horn=0xcab489;

  // roughly one block wide, just under two blocks long overall
  cube(g,1.00,.76,1.20,brown,0,1.02,.03);

  // patches adjusted to the slimmer, longer body
  voxelPatch(g,white,-.27,1.22,-.34,.34,.28,.04);
  voxelPatch(g,white,.25,1.08,.50,.30,.34,.04);
  voxelPatch(g,white,-.03,1.40,.06,.42,.07,.56);
  voxelPatch(g,white,.48,1.03,.05,.04,.40,.44);

  // head + muzzle
  cube(g,.62,.60,.54,brownDark,0,1.10,-.84);
  voxelPatch(g,white,-.15,1.22,-1.125,.23,.30,.035);
  cube(g,.40,.23,.16,cream,0,.98,-1.145);
  cube(g,.07,.07,.035,0x4b3a33,-.11,.98,-1.235);
  cube(g,.07,.07,.035,0x4b3a33,.11,.98,-1.235);
  cube(g,.08,.13,.035,eye,-.16,1.23,-1.115);
  cube(g,.08,.13,.035,eye,.16,1.23,-1.115);

  // ears
  cube(g,.22,.16,.13,brown,-.37,1.27,-.84,0,0,.14);
  cube(g,.22,.16,.13,brown,.37,1.27,-.84,0,0,-.14);
  cube(g,.11,.07,.07,pink,-.38,1.27,-.91);
  cube(g,.11,.07,.07,pink,.38,1.27,-.91);

  // horns
  cube(g,.11,.22,.11,horn,-.22,1.50,-.85,0,0,-.14);
  cube(g,.11,.22,.11,horn,.22,1.50,-.85,0,0,.14);

  // legs
  for(const x of[-.31,.31])for(const z of[-.40,.40]){
    cube(g,.22,.52,.22,brown,x,.47,z);
    cube(g,.23,.16,.23,white,x,.24,z);
    cube(g,.24,.12,.24,hoof,x,.12,z);
  }

  // udder + tail
  cube(g,.32,.14,.28,pink,0,.57,.30);
  cube(g,.10,.40,.10,brownDark,0,1.00,.68,0,0,.10);
  cube(g,.15,.15,.15,hoof,0,.75,.78);
  return g;
}

function createMobLegs(g,positions,color,hoof,thickness,height){
  const legs=[];
  for(const [x,z] of positions){
    const pivot=new THREE.Group();pivot.position.set(x,.91,z);
    cube(pivot,thickness,height,thickness*1.08,color,0,-height*.49,0);
    cube(pivot,thickness+.065,.18,thickness*1.26,hoof,0,-height+.075,-.045);
    g.add(pivot);legs.push(pivot);
  }
  g.userData.walkLegs=legs;
}

function buildHorse(){
  const g=new THREE.Group();
  // Lean riding-sized horse: long back, tapered forward neck, narrow muzzle,
  // side-facing eyes and properly long hooved legs. < 1 block shoulder width.
  const coat=0x93572f,chestnut=0xaa6b3a,highlight=0xb67b45;
  const shade=0x78462a,cream=0xcfaa86,muzzle=0xb58d6a;
  const mane=0x30241e,maneShade=0x483028,hooves=0x282522,eye=0x151311;
  cube(g,.88,.74,1.90,coat,0,1.50,.14);
  cube(g,.82,.14,1.78,chestnut,0,1.90,.13);
  cube(g,.83,.64,.59,highlight,0,1.48,.76);
  cube(g,.85,.75,.56,chestnut,0,1.53,-.56);
  cube(g,.72,.13,1.50,shade,0,1.17,.12);
  cube(g,.56,.19,.76,chestnut,0,1.97,-.43);
  cube(g,.44,1.02,.49,coat,0,2.08,-.80,-.34);
  cube(g,.37,.72,.40,chestnut,0,2.26,-1.04,-.29);
  cube(g,.47,.42,.64,chestnut,0,2.46,-1.37,.13);
  cube(g,.42,.23,.45,muzzle,0,2.29,-1.79,.14);
  cube(g,.40,.12,.34,cream,0,2.18,-1.80,.05);
  cube(g,.41,.07,.29,shade,0,2.12,-1.82);
  for(const sign of [-1,1]){
    const x=sign*.17;
    cube(g,.14,.29,.18,coat,x,2.79,-1.14,0,0,sign*-.10);
    cube(g,.07,.18,.14,muzzle,x,2.82,-1.25);
    cube(g,.065,.12,.12,shade,sign*.24,2.52,-1.42);
    cube(g,.044,.078,.082,eye,sign*.279,2.53,-1.43);
    cube(g,.034,.042,.037,eye,sign*.13,2.33,-2.015);
  }
  // Short dark mane along the sloping back of the neck.
  cube(g,.43,.15,.25,mane,0,2.72,-1.21);
  for(let i=0;i<6;i++)
    cube(g,.46-i*.013,.14,.20,i%2?maneShade:mane,0,2.65-i*.17,-1.10+i*.092,-.20);
  // Slim tail at the rump (rather than a giant vertical appendage).
  cube(g,.16,.16,.44,coat,0,1.64,1.17,-.29);
  cube(g,.20,.49,.22,maneShade,0,1.27,1.42,-.26);
  cube(g,.25,.35,.28,mane,0,1.00,1.49,-.13);
  const legs=[];
  for(const [x,z] of [[-.31,-.59],[.31,-.59],[-.31,.77],[.31,.77]]){
    const joint=new THREE.Group();joint.position.set(x,1.23,z);
    cube(joint,.20,.58,.25,chestnut,0,-.29,0);
    cube(joint,.16,.52,.21,coat,0,-.80,-.025);
    cube(joint,.26,.16,.34,hooves,0,-1.14,-.085);
    cube(joint,.19,.085,.22,shade,0,-.58,.012);
    g.add(joint);legs.push(joint);
  }
  g.userData.walkLegs=legs;
  return g;
}

const LARGE_PREDATOR_SCALE=1.5; // Uniform size increase for bison and lions.
function buildBison(){
  const g=new THREE.Group();
  g.scale.setScalar(LARGE_PREDATOR_SCALE);
  // Black buffalo: layered near-black charcoal fur and subtle silver-gray
  // highlights retain the massive shape and texture in both daylight and dusk.
  // Ivory horns stay pale for contrast; the nose is dark slate instead of brown.
  const brown=0x1a1c1d,back=0x34383a,dark=0x121416,deep=0x090b0d;
  const fur=0x101214,furLite=0x292d30,horn=0xcfc2a0,tip=0xf0e5cb;
  const nose=0x272a2d,nostril=0x070809,eye=0xff3042,pupil=0x160609;
  // Front-heavy powerful body with a high shoulder hump.
  cube(g,1.52,1.16,2.07,brown,0,1.13,.15);
  cube(g,1.47,.28,1.73,back,0,1.76,.40);
  cube(g,1.61,1.42,1.19,fur,0,1.67,-.45);
  cube(g,1.48,.39,1.05,furLite,0,2.34,-.39);
  for(const x of[-.59,-.30,0,.30,.59])for(const z of[-.94,-.64,-.34]){
    cube(g,.30,.17,.32,(Math.abs(x)<.3?fur:dark),x,2.35-Math.abs(x)*.12,z);
  }
  // Rough block fur on chest and cheeks.
  for(const x of[-.62,-.34,0,.34,.62]){
    cube(g,.24,.51,.30,x===0?deep:fur,x,.79,-.98);
    cube(g,.24,.40,.29,fur,x,1.47,-1.08);
  }
  cube(g,1.07,.80,.79,dark,0,1.65,-1.13);
  cube(g,.79,.43,.51,nose,0,1.36,-1.57);
  for(const x of[-.25,.25]){
    cube(g,.12,.085,.04,nostril,x,1.36,-1.848);
    // Red, front-facing eyes with a narrow dark pupil, visible on black fur.
    cube(g,.18,.16,.075,eye,x*1.55,1.79,-1.55);
    cube(g,.057,.105,.038,pupil,x*1.55,1.79,-1.604);
    cube(g,.16,.12,.14,tip,x*1.49,2.05,-1.29);
    const side=Math.sign(x);
    cube(g,.38,.21,.29,horn,side*.67,2.01,-1.18,0,0,side*.14);
    cube(g,.22,.38,.21,tip,side*.86,2.23,-1.14,0,0,side*.28);
  }
  cube(g,.34,.43,.37,deep,0,.93,-1.39);
  cube(g,.16,.28,.20,deep,0,1.12,1.26,.16);
  cube(g,.24,.28,.17,fur,0,.92,1.32);
  createMobLegs(g,[[-.55,-.56],[.55,-.56],[-.53,.77],[.53,.77]],brown,deep,.34,.73);
  return g;
}
function buildLion(){
  const g=new THREE.Group();
  g.scale.setScalar(LARGE_PREDATOR_SCALE);
  const gold=0xc68d4d,light=0xe2ac65,brown=0x874c2b,mane=0x684027;
  const deep=0x442719,cream=0xeac895,eye=0xe5bc43,black=0x251c16,tooth=0xfff3dd;
  cube(g,1.38,.88,1.86,gold,0,1.17,.13);
  cube(g,1.25,.16,1.45,light,0,1.62,.22);
  cube(g,1.56,1.38,1.11,mane,0,1.57,-.73);
  for(const x of[-.65,-.35,0,.35,.65]){
    cube(g,.33,.39,.34,x===0?brown:deep,x,1.10,-1.07);
    cube(g,.28,.25,.36,brown,x,2.23-Math.abs(x)*.25,-.79);
  }
  // Squared muzzle, watchful yellow eyes and toothy mouth.
  cube(g,.90,.70,.74,gold,0,1.67,-1.25);
  cube(g,.89,.19,.20,cream,0,1.43,-1.68);
  cube(g,.46,.26,.33,cream,0,1.50,-1.66);
  cube(g,.35,.14,.20,deep,0,1.27,-1.72);
  cube(g,.29,.17,.17,black,0,1.64,-1.83);
  for(const x of[-.35,.35]){
    cube(g,.20,.24,.16,light,x,2.12,-1.16);
    cube(g,.15,.10,.035,black,x*.74,1.83,-1.661);
    cube(g,.105,.11,.04,eye,x*.74,1.72,-1.677);
    cube(g,.06,.11,.05,black,x*.74,1.72,-1.704);
    cube(g,.085,.14,.09,tooth,x*.70,1.29,-1.79);
    cube(g,.28,.12,.13,brown,x,1.88,-1.62);
  }
  cube(g,.15,.16,.14,tooth,0,1.24,-1.77);
  // Tail with the recognisable dark tuft.
  cube(g,.17,.16,.56,gold,0,1.35,1.24,-.19);
  cube(g,.22,.18,.42,brown,0,1.29,1.66,.07);
  cube(g,.30,.27,.35,deep,0,1.32,1.88);
  createMobLegs(g,[[-.51,-.58],[.51,-.58],[-.51,.71],[.51,.71]],gold,brown,.33,.70);
  return g;
}

const ANACONDA_BODY=[
  // sideways offset, longitudinal z, whole width, whole height, depth, center Y
  [-.03,-2.40,.86,.69,.92,1.23],
  [-.11,-1.63,1.00,.85,.96,1.08],
  [-.25,-.85,1.14,.98,.98,1.04],
  [-.12,-.07,1.20,1.01,.99,1.04],
  [ .17, .71,1.18,1.00,.98,1.01],
  [ .28,1.49,1.12,.96,.96,.98],
  [ .16,2.27,.92,.82,.90,.90],
  [-.12,3.02,.70,.65,.76,.82],
  [-.25,3.57,.45,.44,.61,.75],
  [-.25,3.93,.22,.24,.48,.70]
];
// Extra ends: the front slips inside the raised head, while the far end
// shrinks into a point. The model head/tail combined remain ~8 blocks.
const ANACONDA_SKIN_PATH=[
  [-.02,-2.78,.67,.54,1.35],
  ...ANACONDA_BODY.map(([x,z,w,h,depth,y])=>[x,z,w,h,y]),
  [-.25,4.17,.035,.045,.70]
];
const ANACONDA_BLOTCHES=Array.from({length:13},(_,i)=>[
  -2.23+i*.47+Math.sin(i*7.43)*.13,
  Math.PI/2+(i%2?.57:-.56)+Math.sin(i*2.3)*.12,
  .19+Math.abs(Math.sin(i*1.27))*.095,
  .26+Math.abs(Math.cos(i*3.1))*.09
]);
const anacondaSkinMaterial=new THREE.MeshLambertMaterial({
  color:0xffffff,vertexColors:true
});
function anacondaProfile(z){
  const points=ANACONDA_SKIN_PATH;
  let k=0;
  while(k<points.length-2&&points[k+1][1]<z)k++;
  const a=points[k],b=points[k+1];
  const t=Math.max(0,Math.min(1,(z-a[1])/(b[1]-a[1])));
  // Catmull-Rom interpolation eliminates discontinuities at every body ring.
  const before=points[Math.max(0,k-1)],after=points[Math.min(points.length-1,k+2)];
  return [0,2,3,4].map(index=>{
    const A=before[index],B=a[index],C=b[index],D=after[index];
    return .5*(2*B+(-A+C)*t+(2*A-5*B+4*C-D)*t*t+(-A+3*B-3*C+D)*t*t*t);
  });
}
function buildAnaconda(){
  const g=new THREE.Group();
  const green=0x526d31,dark=0x293b23,olive=0x6e8541;
  const belly=0xc6b783,eye=0xe9d05d,pupil=0x11170c,red=0xb8202b;
  // Construct ONE continuous, low-poly body mesh, without separate rings.
  // Vertex colors paint scales, belly and markings directly on the skin:
  // no raised bumps, joints, collars or cubes along the back.
  const vertices=[],colors=[],indices=[];
  const zStart=ANACONDA_SKIN_PATH[0][1],zEnd=4.17;
  const lengthSteps=72,radialSteps=20;
  const pigment=Object.fromEntries([
    ['green',0x556e34],['shade',0x3c572c],['side',0x637c3c],
    ['belly',0xc6b783],['bellyShade',0xab9869],['spot',0x243820],
    ['highlight',0x71884b]
  ].map(([name,color])=>[name,new THREE.Color(color)]));
  for(let i=0;i<=lengthSteps;i++){
    const z=zStart+(zEnd-zStart)*i/lengthSteps;
    const [side,width,height,centerY]=anacondaProfile(z);
    for(let j=0;j<=radialSteps;j++){
      const theta=j*Math.PI*2/radialSteps;
      const radialX=Math.cos(theta),radialY=Math.sin(theta);
      vertices.push(side+radialX*width*.5,centerY+radialY*height*.5,z);
      let shade=radialY<-.60?(i%11<6?'belly':'bellyShade'):
        radialY>.78?'green':radialY>.20?'side':'shade';
      if(radialY>.13){
        for(const [spotZ,spotTheta,zRadius,thetaRadius] of ANACONDA_BLOTCHES){
          let dTheta=Math.abs(theta-spotTheta);
          dTheta=Math.min(dTheta,2*Math.PI-dTheta);
          const distance=((z-spotZ)/zRadius)**2+(dTheta/thetaRadius)**2;
          if(distance<1){shade='spot';break}
        }
      }
      // A narrow, uninterrupted darker dorsal stripe follows the snake.
      if(radialY>.94&&shade!=='spot')shade='highlight';
      const col=pigment[shade];
      colors.push(col.r,col.g,col.b);
    }
  }
  for(let i=0;i<lengthSteps;i++)for(let j=0;j<radialSteps;j++){
    const a=i*(radialSteps+1)+j,b=a+radialSteps+1;
    indices.push(a,a+1,b,b,a+1,b+1);
  }
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
  geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  const body=new THREE.Mesh(geometry,anacondaSkinMaterial);
  body.castShadow=true;body.receiveShadow=true;g.add(body);
  g.userData.snakeBody=body;
  g.userData.snakeBasePositions=Float32Array.from(vertices);

  // Long low triangular-looking head and a subtly raised neck.
  // Its snout, tiny eyes and horizontal slit distinguish it from a grub.
  cube(g,.86,.36,.89,dark,0,1.66,-3.10);
  cube(g,.80,.16,.82,belly,0,1.46,-3.21);
  cube(g,.81,.19,.72,olive,0,1.84,-3.23);
  cube(g,.68,.23,.55,green,0,1.67,-3.53);
  cube(g,.65,.055,.38,0x1d2319,0,1.52,-3.53);
  for(const sign of [-1,1]){
    // Yellow eyes on BOTH sides: real snake rather than a segmented larva.
    cube(g,.13,.14,.15,eye,sign*.435,1.87,-3.18);
    cube(g,.04,.105,.065,pupil,sign*.505,1.87,-3.21);
    cube(g,.075,.045,.07,0x202a19,sign*.21,1.74,-3.79);
  }
  cube(g,.09,.045,.19,red,0,1.52,-3.73);
  cube(g,.043,.035,.14,red,-.06,1.52,-3.79,0,-.22);
  cube(g,.043,.035,.14,red,.06,1.52,-3.79,0,.22);
  return g;
}
function animateAnaconda(m,dt,now,moving){
  const mesh=m.userData.snakeBody,original=m.userData.snakeBasePositions;
  if(!mesh||!original)return;
  const target=moving?.105:.016;
  m.userData.snakeSway=(m.userData.snakeSway||0)*(1-Math.min(1,dt*6))+
    target*Math.min(1,dt*6);
  // Animate the vertices of ONE continuous skin. Never part the body into
  // visible sections. Keep the neck stationary and move mainly the tail.
  const positions=mesh.geometry.attributes.position;
  const phase=m.userData.phase||0;
  for(let k=0;k<original.length;k+=3){
    const z=original[k+2];
    const tailBias=Math.max(0,Math.min(1,(z+2.0)/6.17));
    positions.array[k]=original[k]+Math.sin(now*.004-z*1.05+phase)*
      m.userData.snakeSway*tailBias;
  }
  positions.needsUpdate=true;
}

function buildZombie(){
  const g=new THREE.Group();
  const skin=0x6fbf5f,skinLight=0x8bd275,skinDark=0x447c3c;
  const shirt=0x4e9848,shirtLight=0x69af60,shirtDark=0x397438;
  const pants=0x386c3e,pantsShade=0x2a5732,boots=0x23492a,sole=0x1d3724;
  const eyes=0xddebc9,eyeDark=0x202d20;

  // Same short head / tall torso / blocky limbs as the player avatar.
  cube(g,.66,.52,.53,skin,0,1.53,0);
  cube(g,.66,.10,.53,skinLight,0,1.75,0);
  cube(g,.08,.10,.027,eyes,-.16,1.53,-.281);
  cube(g,.08,.10,.027,eyes,.16,1.53,-.281);
  cube(g,.04,.06,.030,eyeDark,-.16,1.53,-.298);
  cube(g,.04,.06,.030,eyeDark,.16,1.53,-.298);
  cube(g,.18,.045,.03,skinDark,0,1.40,-.285);

  cube(g,.74,.85,.42,shirt,0,1.00,0);
  cube(g,.69,.10,.44,shirtLight,0,1.37,0);
  cube(g,.12,.60,.025,shirtDark,0,1.00,-.224);

  const leftArm=new THREE.Group(),rightArm=new THREE.Group();
  const leftLeg=new THREE.Group(),rightLeg=new THREE.Group();
  for(const [side,arm,leg] of [[-1,leftArm,leftLeg],[1,rightArm,rightLeg]]){
    arm.position.set(side*.36,1.30,0);
    cube(arm,.255,.45,.35,shirt,0,-.22,0);
    cube(arm,.262,.12,.36,shirtDark,0,-.47,0);
    cube(arm,.225,.18,.29,skin,0,-.61,0);
    // Positive X rotation brings a hanging arm toward local -Z (the front).
    arm.rotation.x=1.38;
    g.add(arm);

    leg.position.set(side*.20,.69,0);
    cube(leg,.29,.54,.34,pants,0,-.24,0);
    cube(leg,.29,.11,.345,pantsShade,0,-.51,0);
    cube(leg,.32,.14,.43,boots,0,-.61,-.04);
    cube(leg,.325,.055,.45,sole,0,-.69,-.045);
    g.add(leg);
  }
  g.userData.parts={leftArm,rightArm,leftLeg,rightLeg};
  // Match the compact player's overall proportions.
  g.scale.x=.72;
  g.scale.z=.88;
  return g;
}

function buildSkeleton(){
  const g=new THREE.Group();
  const bone=0xe7e3d6,light=0xf6f3e8,shadow=0xb8b3a7,dark=0x27282d;
  const wood=0x87552f,string=0xeee8cf;
  // Angular skull with recessed dark eyes and an open toothy jaw.
  cube(g,.63,.55,.53,bone,0,1.50,0);
  cube(g,.57,.09,.55,light,0,1.78,0);
  cube(g,.17,.17,.035,dark,-.16,1.52,-.281);
  cube(g,.17,.17,.035,dark,.16,1.52,-.281);
  cube(g,.10,.12,.035,shadow,0,1.40,-.285);
  cube(g,.46,.105,.43,shadow,0,1.25,.01);
  for(const x of [-.15,-.05,.05,.15])cube(g,.057,.075,.036,light,x,1.24,-.215);
  // Spine, collarbone, and thin ribs with visible dark gaps.
  cube(g,.11,.68,.12,shadow,0,.98,.03);
  cube(g,.64,.085,.15,light,0,1.36,.01);
  for(const y of [1.27,1.13,.99,.85]){
    cube(g,.57,.077,.13,bone,0,y,-.025);
    cube(g,.49,.055,.10,shadow,0,y+.013,.10);
  }
  cube(g,.53,.14,.23,bone,0,.69,0);
  const leftArm=new THREE.Group(),rightArm=new THREE.Group();
  const leftLeg=new THREE.Group(),rightLeg=new THREE.Group();
  for(const [side,arm,leg] of [[-1,leftArm,leftLeg],[1,rightArm,rightLeg]]){
    arm.position.set(side*.36,1.32,0);
    cube(arm,.15,.34,.16,bone,0,-.20,0);
    cube(arm,.18,.13,.18,shadow,0,-.41,0);
    cube(arm,.14,.28,.14,light,0,-.56,-.02);
    cube(arm,.21,.12,.18,bone,0,-.72,-.02);
    g.add(arm);
    leg.position.set(side*.19,.67,0);
    cube(leg,.17,.34,.19,bone,0,-.20,0);
    cube(leg,.20,.14,.21,shadow,0,-.40,0);
    cube(leg,.16,.28,.18,light,0,-.55,0);
    cube(leg,.26,.10,.35,bone,0,-.71,-.07);
    g.add(leg);
  }
  // Wooden recurved bow attached to the left wrist, string on the right.
  const bow=new THREE.Group();
  bow.position.set(-.065,-.69,-.18);
  bow.rotation.set(.12,-.18,-.04);
  for(let i=0;i<=8;i++){
    const t=i/8,y=(t-.5)*1.02;
    const slat=cube(bow,.085,.16,.10,i%2?wood:0xb27c44,
      -.25*Math.sin(Math.PI*t),y,0);
    slat.rotation.z=(t-.5)*.7;
  }
  cube(bow,.024,1.10,.022,string,.025,0,-.03);
  leftArm.add(bow);
  g.userData.parts={leftArm,rightArm,leftLeg,rightLeg};
  g.scale.x=.80;g.scale.z=.88;
  return g;
}

 const builders={
  sheep:buildSheep,pig:buildPig,cow:buildCow,zombie:buildZombie,
  horse:buildHorse,bison:buildBison,lion:buildLion,
  anaconda:buildAnaconda,skeleton:buildSkeleton
 };
 return {
  build(id){
   const fn=builders[id];
   if(!fn)throw new Error('Unknown original NEXACRAFT mob: '+id);
   const model=fn();model.userData.galleryLegacyType=id;return model;
  },
  animate(model,t,moving=true){
   const type=model.userData.galleryLegacyType;
   if(type==='anaconda'){
    animateAnaconda(model,1/60,t*1000,moving);return;
   }
   const stride=moving?Math.sin(t*5)*.21:0;
   for(const [i,leg] of (model.userData.walkLegs||[]).entries())
     leg.rotation.x=(i===0||i===3?1:-1)*stride;
   const parts=model.userData.parts;
   if(parts){
    if(parts.leftLeg)parts.leftLeg.rotation.x=stride;
    if(parts.rightLeg)parts.rightLeg.rotation.x=-stride;
    if(type==='skeleton'){
     parts.leftArm.rotation.x=moving?-.14+Math.sin(t*5)*.07:-.14;
     parts.rightArm.rotation.x=moving?Math.sin(t*5)*.12:0;
    }
   }
  }
 };
}
