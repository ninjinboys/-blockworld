/* NEXACRAFT job system: pure data + shared 3D/icon construction.
 * Existing survival equipment remains usable. Job weapons 190–207 are
 * restricted to their job (except the weaker all-rounder).
 */
export const JOBS={
  sword:{name:'剣士',group:'sword',level:1,weapon:190,kind:'sword',damage:3,cooldown:630,range:4.5,desc:'標準的な片手剣。LV30で4方向に進化',next:['warrior','swordmaster','axer','lancer']},
  merc:{name:'傭兵',group:'merc',level:1,weapon:191,kind:'dual',damage:2,cooldown:360,range:4.2,desc:'双剣で素早く攻撃',next:['berserker']},
  shield:{name:'盾兵',group:'shield',level:1,weapon:192,kind:'shield',damage:1,cooldown:950,range:3.9,defense:.20,desc:'盾による防御と打撃',next:['heavy','shieldElite']},
  archer:{name:'弓兵',group:'archer',level:1,weapon:193,kind:'bow',damage:4,cooldown:670,range:60,draw:680,desc:'遠距離攻撃の専門職',next:['powerArcher','swiftArcher']},
  mage:{name:'魔術師',group:'mage',level:1,weapon:194,kind:'staff',damage:2,cooldown:1150,range:3.4,radius:2.2,desc:'複数の敵に魔法攻撃',next:['battleMage','supportMage']},
  all:{name:'オールラウンダー',group:'all',level:1,weapon:195,kind:'sword',damage:2,cooldown:740,range:4.5,desc:'すべてのジョブ武器を使えるが性能は低い',next:[]},
  warrior:{name:'戦士',group:'sword',level:30,weapon:196,kind:'greatsword',damage:12,cooldown:1540,range:5,desc:'大剣／超高攻撃力・低速'},
  swordmaster:{name:'剣士',group:'sword',level:30,weapon:197,kind:'sword',damage:7,cooldown:630,range:4.7,desc:'剣／高攻撃力・標準速度'},
  axer:{name:'戦斧',group:'sword',level:30,weapon:198,kind:'axe',damage:10,cooldown:1320,range:4.4,desc:'戦斧／高攻撃力・低速'},
  lancer:{name:'槍使い',group:'sword',level:30,weapon:199,kind:'spear',damage:5,cooldown:760,range:6.8,desc:'槍／広い攻撃範囲'},
  berserker:{name:'バーサーカー',group:'merc',level:30,weapon:200,kind:'dual',damage:3,cooldown:180,range:4.2,desc:'双剣／超高速連続攻撃'},
  heavy:{name:'重装兵',group:'shield',level:30,weapon:201,kind:'shield',damage:1,cooldown:1820,range:3.8,defense:.67,desc:'超高防御・超低攻撃力・超低速'},
  shieldElite:{name:'盾兵',group:'shield',level:30,weapon:202,kind:'shield',damage:3,cooldown:680,range:4.1,defense:.35,desc:'高防御・標準速度。LV90でタンクに進化',next:['tank']},
  tank:{name:'タンク',group:'shield',level:90,weapon:203,kind:'shield',damage:4,cooldown:620,range:4.2,defense:.48,desc:'高防御を維持しつつ標準的に攻撃'},
  powerArcher:{name:'剛弓',group:'archer',level:30,weapon:204,kind:'bow',damage:9,cooldown:820,range:74,draw:820,desc:'剛弓／高火力・標準連射'},
  swiftArcher:{name:'速弓',group:'archer',level:30,weapon:205,kind:'bow',damage:5,cooldown:280,range:66,draw:320,desc:'速弓／高速連射'},
  battleMage:{name:'攻撃系魔術師',group:'mage',level:30,weapon:206,kind:'staff',damage:9,cooldown:1440,range:6,radius:3.6,desc:'高火力の範囲魔法'},
  supportMage:{name:'バッファー・デバッファー',group:'mage',level:30,weapon:207,kind:'staff',damage:1,cooldown:1400,range:9,radius:8.5,desc:'広範囲の敵を弱体化。味方の回復も得意'}
};
export const STARTING_JOBS=['sword','merc','shield','archer','mage','all'];
export const JOB_WEAPON_IDS=Object.values(JOBS).map(j=>j.weapon);
const byWeapon=new Map(Object.entries(JOBS).map(([key,j])=>[j.weapon,{...j,key}]));
export const jobWeapon=id=>byWeapon.get(id)||null;
export function jobCanUse(activeJob,id){
  const item=jobWeapon(id);
  return !item||activeJob==='all'||JOBS[activeJob]?.group===item.group;
}
export function jobNextOptions(key,level){
  const job=JOBS[key];
  return job?(job.next||[]).filter(id=>level>=JOBS[id].level):[];
}
export function jobCanChange(from,to,level){
  return !!(JOBS[from]&&JOBS[to]&&from!==to&&
    (JOBS[from].next||[]).includes(to)&&level>=JOBS[to].level);
}
export function drawJobWeaponIcon(g,id){
  const data=jobWeapon(id);if(!data)return false;
  const {kind,group}=data;
  const ink=group==='mage'?'#a89afa':group==='archer'?'#e6b67f':
    group==='shield'?'#a4bdca':group==='merc'?'#e7b9a0':'#b9dbe8';
  const h='#ffffff',edge='#283b50',gold='#e2ad62';
  const rect=(x,y,w,z,col)=>{g.fillStyle=col;g.fillRect(x,y,w,z)};
  g.clearRect(0,0,16,16);
  if(kind==='bow'){
    for(let i=2;i<14;i++){
      let x=5+Math.round(Math.abs(i-8)*.12);rect(x,i,2,1,ink);
      rect(10,i,1,1,h);
    }rect(6,7,5,2,gold);
  }else if(kind==='staff'){
    rect(8,5,2,10,gold);rect(7,6,1,8,edge);
    rect(5,2,6,5,ink);rect(7,0,2,7,h);
    rect(6,10,4,1,edge);
  }else if(kind==='shield'){
    rect(3,3,10,6,edge);rect(4,4,8,7,ink);
    rect(5,9,6,2,ink);rect(6,11,4,2,gold);rect(7,13,2,2,edge);
    rect(7,5,2,6,h);
  }else if(kind==='dual'){
    for(let sign of [-1,1]){
      const x=sign>0?10:4;
      rect(x,2,2,8,ink);rect(x,1,2,2,h);
      rect(x-1,10,4,1,gold);rect(x,11,2,4,edge);
    }
  }else if(kind==='axe'){
    rect(7,3,2,12,gold);rect(4,2,8,6,ink);
    rect(3,3,2,4,h);rect(11,3,2,4,edge);
  }else if(kind==='spear'){
    rect(7,6,2,10,gold);rect(6,2,4,6,ink);
    rect(7,0,2,5,h);rect(5,7,6,2,edge);
  }else{
    const wide=kind==='greatsword';
    rect(7,wide?1:2,wide?4:3,10,ink);
    rect(7,1,2,5,h);rect(4,11,9,2,gold);
    rect(7,13,3,3,edge);
  }
  return true;
}
export function makeJobWeaponModel(T,id){
  const d=jobWeapon(id);if(!d)return null;
  const g=new T.Group(),mats=new Map();
  const colors={metal:0xb8cad5,blade:0xe2f3fc,edge:0x708594,wood:0x956843,
    grip:0x343b4c,gold:0xd8ac5d,dark:0x27313a,leather:0x775740,
    magic:d.group==='mage'?0x9876ee:0x83dbea};
  const mat=c=>{if(!mats.has(c))mats.set(c,new T.MeshLambertMaterial({color:c,side:T.DoubleSide}));return mats.get(c)};
  function box(w,h,dep,col,x=0,y=0,z=0){
    const mesh=new T.Mesh(new T.BoxGeometry(w,h,dep),mat(col));
    mesh.position.set(x,y,z);mesh.castShadow=true;g.add(mesh);return mesh;
  }
  function rod(a,b,r,c,rad=6){
    const p=new T.Vector3(...a),q=new T.Vector3(...b),v=q.clone().sub(p);
    const mesh=new T.Mesh(new T.CylinderGeometry(r,r,v.length(),rad),mat(c));
    mesh.position.copy(p).add(q).multiplyScalar(.5);
    mesh.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),v.normalize());
    mesh.castShadow=true;g.add(mesh);
  }
  const k=d.kind;
  if(['sword','greatsword','axe','spear','dual'].includes(k)){
    const dual=k==='dual',spear=k==='spear',great=k==='greatsword';
    const n=dual?2:1;
    for(let i=0;i<n;i++){
      const x=dual?(i===0?-.23:.23):0;
      const upper=spear?1.78:great?1.22:k==='axe'?.95:dual?.72:.85;
      box(.11,upper*.51,.11,colors.wood,x,upper*.23,0);
      box(.14,.30,.13,colors.grip,x,.06,0);
      for(let j=0;j<3;j++)box(.16,.025,.14,colors.gold,x,-.09+j*.10,0);
      box(.36,.09,.23,colors.gold,x,upper*.51,0);
      if(k==='axe'){
        box(.56,.46,.18,colors.metal,x,upper*.76,0);
        box(.08,.48,.2,colors.blade,x-.28,upper*.76,0);
        box(.09,.42,.2,colors.edge,x+.28,upper*.76,0);
      }else if(spear){
        rod([x,upper*.50,0],[x,upper,0],.055,colors.wood);
        const tip=new T.Mesh(new T.ConeGeometry(.17,.58,4),mat(colors.blade));
        tip.position.set(x,upper+.23,0);tip.rotation.y=Math.PI/4;g.add(tip);
        box(.2,.17,.15,colors.metal,x,upper-.06,0);
      }else{
        const bladeH=great?1.04:dual?.53:.78;
        const bladeW=great?.39:dual?.13:.2;
        box(bladeW,bladeH,.12,colors.metal,x,upper*.51+bladeH*.5+.04,0);
        box(bladeW*.22,bladeH*.98,.125,colors.blade,x-bladeW*.34,upper*.51+bladeH*.5+.04,-.008);
        const tip=new T.Mesh(new T.ConeGeometry(bladeW*.60,.20,4),mat(colors.blade));
        tip.position.set(x,upper*.51+bladeH+.14,0);tip.rotation.y=Math.PI/4;g.add(tip);
      }
    }
  }else if(k==='shield'){
    // Pointed full-size knight shield with gilded rim and reinforced center.
    box(.30,.45,.22,colors.wood,0,-.06,.04);
    const shape=new T.Shape();
    shape.moveTo(-.45,.43);shape.lineTo(.45,.43);shape.lineTo(.48,-.17);
    shape.lineTo(0,-.98);shape.lineTo(-.48,-.17);shape.closePath();
    for(const [z,color,depth] of [[-.07,colors.edge,.13],[-.17,colors.metal,.035],[-.21,colors.leather,.03]]){
      const mesh=new T.Mesh(new T.ExtrudeGeometry(shape,{depth,bevelEnabled:false}),mat(color));
      mesh.position.z=z;g.add(mesh);
    }
    box(.15,.71,.075,colors.gold,0,-.02,-.24);
    box(.57,.13,.076,colors.gold,0,.1,-.24);
  }else if(k==='bow'){
    box(.15,.45,.17,colors.wood,0,.04,0);
    for(let i=0;i<10;i++){
      const t=i/9,a=(t-.5)*1.5;
      const x=-.35*Math.sin(Math.PI*t);
      const seg=box(.09,.22,.13,i%2?colors.wood:colors.gold,x,a,0);
      seg.rotation.z=(t-.5)*1.1;
    }
    rod([.02,-.74,-.025],[.02,.74,-.025],.015,colors.blade,4);
    box(.18,.26,.13,colors.gold,-.34,.0,0);
  }else if(k==='staff'){
    rod([0,-.27,0],[0,1.33,0],.055,colors.wood);
    box(.14,.12,.16,colors.gold,0,1.15,0);
    const crystal=new T.Mesh(new T.OctahedronGeometry(.25,0),mat(colors.magic));
    crystal.position.set(0,1.46,0);g.add(crystal);
    for(const sign of [-1,1]){
      rod([0,1.08,0],[sign*.25,1.45,0],.039,colors.metal);
      const orb=new T.Mesh(new T.SphereGeometry(.09,8,6),mat(colors.blade));
      orb.position.set(sign*.27,1.48,0);g.add(orb);
    }
    box(.14,.10,.13,colors.gold,0,-.31,0);
  }
  // Each variant remains identifiable by class through the accent color.
  g.name='Job-exclusive weapon: '+d.name+' '+id;
  return g;
}
