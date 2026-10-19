/* NEXACRAFT: real low-poly hand-held geometry for the 21 new items.
 * Uses the same lightweight voxel/metal style as the existing weapons.
 * Exported to both first-person and third-person views; IDs follow app.js.
 */
export function makeNewHeldItemModel(T,id){
  if(!Number.isInteger(id)||id<168||id>188)return null;
  const g=new T.Group(),materials=new Map();
  const pal={wood:0x956138,woodHi:0xc79154,woodDark:0x482b1d,
    iron:0xaebfc7,bright:0xe5f5f8,dark:0x4d5e6b,
    gold:0xedc353,brass:0x9c7136,leather:0xa46e46,
    fire:0xf68b22,flame:0xffe68b,red:0xd44558,blue:0x37aacb,
    black:0x222a32,green:0x64916b};
  function mat(color,transparent=false){
    const k=color+':'+transparent;
    if(!materials.has(k))
      materials.set(k,new T.MeshLambertMaterial({color,transparent,opacity:transparent?.76:1,depthWrite:!transparent}));
    return materials.get(k);
  }
  function box(w,h,d,col,x=0,y=0,z=0,rz=0){
    const m=new T.Mesh(new T.BoxGeometry(w,h,d),mat(col));
    m.position.set(x,y,z);m.rotation.z=rz;m.castShadow=true;g.add(m);return m;
  }
  function rod(x0,y0,z0,x1,y1,z1,r,col){
    const a=new T.Vector3(x0,y0,z0),b=new T.Vector3(x1,y1,z1),v=b.clone().sub(a);
    const m=new T.Mesh(new T.CylinderGeometry(r,r,v.length(),5),mat(col));
    m.position.copy(a.add(b).multiplyScalar(.5));
    m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),v.normalize());
    m.castShadow=true;g.add(m);return m;
  }
  function stick(len=.9){box(.075,len,.08,pal.wood,0,len*.5-.12,0);box(.025,len*.92,.011,pal.woodHi,-.029,len*.5-.12,-.048);}
  function steelBlade(len=.53,w=.16){
    box(w,len,.10,pal.iron,.005,.38+len*.5,0,-.06);
    box(.040,len-.04,.112,pal.bright,-w*.36,.38+len*.5,-.003,-.06);
    box(.055,len-.06,.10,pal.dark,w*.31,.38+len*.5,.01,-.06);
    box(w*.7,.10,.09,pal.bright,-.005,.38+len+.05,0,-.23);
  }
  function daggerGrip(){
    box(.105,.36,.115,pal.black,0,.01,0);
    for(let i=0;i<4;i++)box(.12,.025,.12,i%2?pal.brass:pal.leather,0,-.13+i*.09,0);
    box(.30,.06,.20,pal.dark,0,.21,0);
  }
  function potion(color,bright){
    box(.17,.20,.17,pal.dark,0,.10,0);
    box(.13,.19,.13,pal.iron,0,.22,0);
    box(.13,.10,.13,pal.wood,0,.32,0);
    box(.32,.42,.27,pal.iron,0,-.14,0);
    box(.29,.30,.28,color,0,-.18,-.008);
    box(.06,.20,.018,bright,-.10,-.13,-.151);
    box(.23,.06,.22,pal.bright,0,.058,0);
    box(.31,.055,.28,pal.dark,0,-.34,0);
  }
  switch(id){
    case 168: { // Full-sized thrusting spear: segmented wood shaft, long leaf blade.
      // Hand grips near the butt, so the complete weapon extends far in front.
      rod(0,-.31,0,0,1.52,0,.070,pal.woodDark);
      rod(-.018,-.25,-.031,-.018,1.42,-.031,.046,pal.woodHi);
      for(let j=0;j<7;j++){
        const h=-.18+j*.115;
        box(.146,.035,.145,j%2?pal.woodDark:pal.leather,0,h,0);
      }
      for(let j=0;j<4;j++){
        const h=.95+j*.16;
        box(.153,.036,.153,j%2?pal.brass:pal.dark,0,h,0);
      }
      box(.18,.23,.18,pal.iron,0,1.50,0);
      box(.28,.11,.17,pal.gold,0,1.56,0);
      for(const x of [-.16,.16]){
        const wing=box(.12,.06,.14,pal.dark,x,1.55,0);
        wing.rotation.z=x>0?.29:-.29;
      }
      const blade=new T.Shape();
      blade.moveTo(0,2.35);
      blade.lineTo(-.082,2.18);
      blade.lineTo(-.18,1.93);
      blade.lineTo(-.20,1.78);
      blade.lineTo(-.12,1.65);
      blade.lineTo(0,1.62);
      blade.lineTo(.12,1.65);
      blade.lineTo(.20,1.78);
      blade.lineTo(.18,1.93);
      blade.lineTo(.082,2.18);
      blade.closePath();
      const steel=new T.Mesh(new T.ExtrudeGeometry(blade,{
        depth:.085,steps:1,bevelEnabled:true,bevelThickness:.016,
        bevelSize:.012,bevelSegments:1
      }),mat(pal.iron));
      steel.position.z=-.05;steel.castShadow=true;g.add(steel);
      rod(0,1.69,-.08,0,2.26,-.08,.026,pal.bright);
      for(const x of [-.13,.13])box(.035,.31,.025,pal.bright,x*.52,1.89,-.055,x<0?-.16:.16);
      box(.12,.12,.12,pal.dark,0,-.32,0);
      box(.15,.045,.15,pal.gold,0,-.37,0);
      break;
    }
    case 169: // Iron dagger
      daggerGrip();steelBlade(.51,.18);break;
    case 170: // Battle axe: broad double blade with split highlights
      stick(1.05);
      box(.62,.40,.18,pal.dark,-.01,.80,0);
      box(.34,.46,.21,pal.iron,-.20,.80,0);
      box(.13,.43,.22,pal.bright,-.39,.80,-.002);
      box(.29,.37,.17,pal.iron,.25,.80,0);
      box(.10,.35,.19,pal.bright,.39,.80,0);
      box(.16,.10,.20,pal.brass,0,.60,0);break;
    case 171: // Hammer, reinforced heavy rectangular head
      stick(.97);
      box(.69,.31,.30,pal.dark,0,.81,0);
      box(.57,.25,.32,pal.iron,0,.82,0);
      box(.12,.27,.35,pal.bright,-.29,.81,0);
      box(.12,.27,.35,pal.dark,.29,.81,0);
      box(.18,.12,.20,pal.brass,0,.65,0);break;
    case 172: // Crossbow: solid wooden stock, opposing limbs and bowstring
      box(.13,1.02,.16,pal.wood,0,.34,0);
      box(.12,.94,.04,pal.woodHi,-.015,.38,-.10);
      box(.95,.095,.17,pal.dark,0,.70,-.025);
      for(const sign of [-1,1]){
        rod(sign*.30,.72,-.02,sign*.56,.85,-.04,.055,pal.iron);
        rod(sign*.56,.85,-.04,0,.58,-.13,.012,pal.bright);
      }
      box(.10,.34,.11,pal.dark,0,.13,0);
      rod(0,.49,-.15,0,.87,-.15,.018,pal.gold);
      box(.09,.10,.10,pal.iron,0,.90,-.15);break;
    case 173: // Throwing knife with balanced short blade
      daggerGrip();steelBlade(.34,.13);g.scale.setScalar(.9);break;
    case 174: // Molotov bottle with burning rag
      potion(0xbc642b,0xf1b15a);
      box(.12,.24,.09,pal.leather,0,.39,0);
      box(.20,.22,.16,pal.fire,0,.50,0);
      box(.11,.14,.12,pal.flame,0,.60,-.03);break;
    case 175:potion(pal.red,0xffa3b3);break;
    case 176:potion(pal.blue,0xa0edff);break;
    case 177: // Poison arrow with barbed green metal head
      rod(0,-.22,0,0,.63,0,.03,pal.wood);
      box(.19,.22,.05,pal.green,0,.70,0);
      {const t=new T.Mesh(new T.ConeGeometry(.115,.27,4),mat(0x8de85d));t.position.y=.89;g.add(t);}
      box(.17,.17,.04,pal.iron,-.055,-.26,0,.35);
      box(.17,.17,.04,pal.iron,.055,-.26,0,-.35);break;
    case 178: // Metal bucket with actual hollow rim and arched handle
      {const body=new T.Mesh(new T.CylinderGeometry(.205,.15,.42,8,1,true),mat(pal.iron));body.position.y=.01;body.castShadow=true;g.add(body);
       const floor=new T.Mesh(new T.CylinderGeometry(.15,.15,.025,8),mat(pal.dark));floor.position.y=-.20;g.add(floor);
       const rim=new T.Mesh(new T.TorusGeometry(.205,.026,5,12),mat(pal.bright));rim.rotation.x=Math.PI/2;rim.position.y=.23;g.add(rim);}
      rod(-.20,.17,0,-.17,.48,0,.021,pal.dark);rod(-.17,.48,0,.17,.48,0,.021,pal.dark);rod(.17,.48,0,.20,.17,0,.021,pal.dark);
      box(.12,.23,.03,pal.bright,-.12,.00,-.18);break;
    case 179: // Fishing rod with distinct flexible tip + thin line
      rod(0,-.19,0,.22,1.15,0,.036,pal.wood);
      rod(.10,.52,0,.22,1.16,0,.020,pal.woodHi);
      rod(.22,1.15,0,.40,.81,0,.008,pal.bright);
      rod(.40,.81,0,.40,-.10,0,.007,pal.bright);
      box(.055,.065,.055,pal.iron,.40,-.14,0);
      box(.13,.12,.07,pal.dark,.03,.02,-.06);break;
    case 180: // Pocket compass with compass rose/needle
      {const disc=new T.Mesh(new T.CylinderGeometry(.24,.24,.075,12),mat(pal.brass));disc.rotation.x=Math.PI/2;disc.position.y=.20;g.add(disc);
       const face=new T.Mesh(new T.CylinderGeometry(.205,.205,.077,12),mat(0xe7e4cd));face.rotation.x=Math.PI/2;face.position.set(0,.20,-.013);g.add(face);}
      rod(-.095,.07,-.075,.10,.36,-.075,.027,0xd03f3b);
      rod(.09,.32,-.078,-.08,.09,-.078,.022,pal.dark);
      box(.10,.04,.07,pal.gold,0,-.03,0);break;
    case 181: // Unrolled parchment with a green terrain print
      box(.46,.55,.04,0xe7d5a5,0,.25,-.08);
      box(.14,.20,.047,pal.green,-.12,.30,-.107);
      box(.13,.13,.047,pal.blue,.12,.18,-.107);
      box(.17,.04,.054,pal.brass,0,.44,-.113);
      box(.47,.085,.10,0xc49c6a,0,.54,-.04);
      box(.47,.085,.10,0xc49c6a,0,-.04,-.04);break;
    case 182: // Binoculars: a pair of cylindrical lens housings
      for(const x of [-.145,.145]){
        const b=new T.Mesh(new T.CylinderGeometry(.122,.128,.47,8),mat(pal.dark));
        b.rotation.x=Math.PI/2;b.position.set(x,.20,-.10);g.add(b);
        const lens=new T.Mesh(new T.CylinderGeometry(.103,.103,.012,8),mat(0x76cbd8));
        lens.rotation.x=Math.PI/2;lens.position.set(x,.20,-.353);g.add(lens);
        box(.14,.05,.04,pal.bright,x,.25,-.354);
      }
      box(.21,.19,.19,pal.leather,0,.20,-.015);break;
    case 183: // Coiled rope 3D loop
      for(let j=0;j<3;j++){
        const coil=new T.Mesh(new T.TorusGeometry(.20,.041,5,12),mat(j===1?0xb58048:0xd2a267));
        coil.position.set(0,.18+j*.055,0);coil.rotation.set(.12,0,.18);g.add(coil);
      }
      box(.11,.16,.11,pal.brass,.14,.17,.0);break;
    case 184: // Blank name tag with string loop
      box(.40,.25,.045,0xe5c88f,0,.18,-.08);
      box(.37,.035,.048,pal.brass,0,.30,-.08);
      box(.28,.025,.050,pal.brass,0,.11,-.08);
      rod(-.12,.32,0,-.07,.48,0,.012,pal.iron);
      rod(-.07,.48,0,.12,.38,0,.012,pal.iron);break;
    case 185: // Wearable backpack with flap, pocket, buckles
      box(.48,.65,.32,pal.dark,0,.18,.0);
      box(.43,.59,.33,pal.leather,0,.20,-.01);
      box(.44,.15,.36,pal.woodHi,0,.48,-.02);
      box(.31,.24,.06,pal.wood,0,.00,-.20);
      box(.12,.075,.065,pal.gold,0,.05,-.238);
      for(const sign of [-1,1]){
        box(.072,.49,.045,pal.woodDark,sign*.17,.15,.19);
      }break;
    case 186: // V-shaped glider with actual two wings
      {const shape=new T.Shape();
        shape.moveTo(-.72,.48);shape.lineTo(0,.74);shape.lineTo(.72,.48);
        shape.lineTo(.31,.34);shape.lineTo(0,.48);shape.lineTo(-.31,.34);shape.closePath();
        const wing=new T.Mesh(new T.ShapeGeometry(shape),mat(0x8fbec8));wing.position.z=-.17;g.add(wing);}
      rod(-.68,.47,-.14,.68,.47,-.14,.023,pal.dark);
      rod(0,.62,-.10,0,-.28,-.10,.028,pal.woodDark);
      rod(-.46,.46,-.14,0,-.12,-.10,.014,pal.bright);
      rod(.46,.46,-.14,0,-.12,-.10,.014,pal.bright);break;
    case 187: // Rolled sleeping bag with rope bindings
      box(.40,.80,.24,pal.dark,0,.15,0);
      box(.38,.76,.25,pal.green,0,.14,-.005);
      box(.40,.11,.27,pal.leather,0,.36,0);
      box(.40,.11,.27,pal.leather,0,-.13,0);
      box(.08,.11,.29,pal.gold,0,.36,-.005);
      box(.08,.11,.29,pal.gold,0,-.13,-.005);
      box(.30,.13,.27,0xc6d0b7,0,.49,0);break;
    case 188: // Flint shard and metallic striking loop
      box(.17,.34,.15,pal.dark,-.13,.19,0,-.35);
      box(.12,.26,.12,pal.iron,-.22,.23,-.04,-.35);
      box(.25,.075,.07,pal.bright,.05,.04,-.07);
      rod(.08,.04,-.03,.19,.37,-.03,.027,pal.iron);
      rod(.19,.37,-.03,.30,.23,-.03,.027,pal.iron);
      box(.08,.09,.08,pal.gold,.31,.45,-.05);break;
  }
  g.name='NEXACRAFT new item '+id;
  return g;
}
