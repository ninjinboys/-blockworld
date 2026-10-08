import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js';

/* FOOTBALL ARENA 26 — real-time 3D match renderer.
   The original 11v11 simulation and all mobile controls stay unchanged.
   Only the view is replaced; WebGL/CDN failures leave the working 2D game intact. */
export function enable3D(api) {
  const U = 20, L = 840 / U, H = 520 / U, GOAL = 119 / U;
  const roots = new Map();
  const groundShadows = new Map();
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0c2032);
  scene.fog = new THREE.Fog(0x10273a, 72, 175);
  const camera = new THREE.PerspectiveCamera(43, 1, .1, 270);
  const renderer = new THREE.WebGLRenderer({ antialias:true, alpha:false, powerPreference:'high-performance' });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.35;
  renderer.setClearColor(0x0c2032);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, innerWidth < 800 ? 1.2 : 1.6));
  const canvas = renderer.domElement;
  canvas.id = 'field3d';
  canvas.setAttribute('aria-label', '3Dサッカーフィールド');
  canvas.style.cssText = 'display:block;position:absolute;inset:0;width:100%;height:100%;pointer-events:none;touch-action:none';
  api.field.after(canvas);

  const hemi = new THREE.HemisphereLight(0xc4e6ff, 0x26482d, 2.15); scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xfff5df, 2.9); sun.position.set(-18,48,24); scene.add(sun);
  const fill = new THREE.DirectionalLight(0x63abff, 1.15); fill.position.set(35,26,-28); scene.add(fill);
  const mat = (color, roughness=.88, metalness=0) => new THREE.MeshStandardMaterial({ color, roughness, metalness });
  const unlit = color => new THREE.MeshBasicMaterial({ color });
  const mesh = (geo, m, parent=scene) => { const o = new THREE.Mesh(geo,m); parent.add(o); return o; };
  const box = (w,h,d,material,x,y,z,parent=scene) => {
    const o=mesh(new THREE.BoxGeometry(w,h,d),material,parent);
    o.position.set(x,y,z); return o;
  };
  const pitchBorder = unlit(0xe5f4e9);
  const grass = [mat(0x236d41),mat(0x287748)];
  box(190,.95,118,mat(0x122a2b),0,-.78,0);
  box(87,.20,55,mat(0x174f30),0,-.16,0);
  for(let i=0;i<16;i++) {
    box(L*2/16,.025,H*2,grass[i%2],-L+(i+.5)*L*2/16,.015,0);
  }
  function line(x1,z1,x2,z2, thick=.085) {
    const distance = Math.hypot(x2-x1,z2-z1);
    const part=box(distance,.021,thick,pitchBorder,(x1+x2)/2,.044,(z1+z2)/2);
    part.rotation.y=-Math.atan2(z2-z1,x2-x1);
    return part;
  }
  function rect(x1,z1,x2,z2) {
    line(x1,z1,x2,z1); line(x2,z1,x2,z2);line(x2,z2,x1,z2);line(x1,z2,x1,z1);
  }
  function arc(cx,cz,r,a0,a1, count=64) {
    let px=cx+Math.cos(a0)*r,pz=cz+Math.sin(a0)*r;
    for(let i=1;i<=count;i++) {
      const a=a0+(a1-a0)*i/count,nx=cx+Math.cos(a)*r,nz=cz+Math.sin(a)*r;
      line(px,pz,nx,nz,.075);px=nx;pz=nz;
    }
  }
  rect(-L,-H,L,H);
  line(0,-H,0,H);
  arc(0,0,112/U,0,Math.PI*2);
  mesh(new THREE.CylinderGeometry(.11,.11,.035,16),pitchBorder).position.set(0,.055,0);
  for(const s of [-1,1]) {
    const a=s*L,b=s*(L-255/U),c=s*(L-80/U);
    rect(Math.min(a,b),-245/U,Math.max(a,b),245/U);
    rect(Math.min(a,c),-125/U,Math.max(a,c),125/U);
    mesh(new THREE.CylinderGeometry(.12,.12,.035,12),pitchBorder).position.set(s*(L-178/U),.058,0);
    const cx=s*(L-178/U);
    // The penalty arc is the visible outside part of the centre-circle-radius arc.
    if(s===1)arc(cx,0,112/U,Math.PI/2-.93,Math.PI/2+.93,27);
    else arc(cx,0,112/U,-Math.PI/2-.93,-Math.PI/2+.93,27);
    for(const edge of [-1,1])arc(s*L,edge*H,.9,edge===1?Math.PI:0,edge===1?Math.PI*1.5:Math.PI*.5,12);
  }
  // Real 3D goals: upright posts, crossbars and mesh nets.
  const postMat = mat(0xf5ffff,.38,.36), netMat = new THREE.LineBasicMaterial({color:0xdce9f5,transparent:true,opacity:.38});
  function pole(a,b,r=.09,parent=scene,material=postMat) {
    const p=new THREE.Vector3(...a),q=new THREE.Vector3(...b);
    const o=mesh(new THREE.CylinderGeometry(r,r,p.distanceTo(q),7),material,parent);
    o.position.copy(p).add(q).multiplyScalar(.5);
    o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),q.sub(p).normalize());
    return o;
  }
  function goal(x,sign) {
    const back=x+sign*3.0, g=GOAL, y=2.7;
    pole([x,0,-g],[x,y,-g],.11);pole([x,0,g],[x,y,g],.11);pole([x,y,-g],[x,y,g],.105);
    pole([x,y,-g],[back,y-.75,-g],.052);pole([x,y,g],[back,y-.75,g],.052);
    pole([back,.1,-g],[back,y-.75,-g],.048);pole([back,.1,g],[back,y-.75,g],.048);
    const vertices=[];
    const segment=(a,b)=>vertices.push(...a,...b);
    for(let i=0;i<=12;i++) {
      const z=-g+(i/12)*2*g;
      segment([x,y,z],[back,y-.75,z]);
      segment([back,y-.75,z],[back,.13,z]);
    }
    for(let i=0;i<=8;i++) {
      const py=.12+(i/8)*(y-.87);
      segment([back,py,-g],[back,py,g]);
      segment([x+(back-x)*i/8,y-(y-.75)*i/8,-g],[x+(back-x)*i/8,y-(y-.75)*i/8,g]);
    }
    for(let i=0;i<=12;i++) {
      const z=-g+(i/12)*2*g;
      segment([x,.12,z],[back,.12,z]);
    }
    const geo=new THREE.BufferGeometry();
    geo.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
    scene.add(new THREE.LineSegments(geo,netMat));
  }
  goal(-L,-1);goal(L,1);
  // Stadium terraces and crowds (instancing keeps this inexpensive on mobile).
  const stepMaterial=[mat(0x1b303e),mat(0x1d3546),mat(0x233949)];
  for(const sign of [-1,1]) {
    for(let row=0;row<7;row++) {
      const z=sign*(H+2.3+row*1.7);
      box(106, .55, 1.8, stepMaterial[row%3],0, row*.49-.22, z);
    }
    box(108,.8,1.15,mat(0x132a40),0,3.65,sign*(H+14.0));
  }
  for(const sign of [-1,1])for(let row=0;row<5;row++)
    box(1.5,.5,78,stepMaterial[row%3],sign*(L+5.0+row*1.8),row*.47-.1,0);
  const crowdColors=[0x84bafa,0xeef6ff,0x3b87d6,0xeab95f,0xff6d78,0x263e60,0xbfdab1];
  const crowdGeo=new THREE.BoxGeometry(.26,.47,.25);
  const crowdMat=new THREE.MeshStandardMaterial({vertexColors:true,roughness:1});
  const crowdItems=[];
  for(let sign of [-1,1])for(let row=0;row<6;row++)
    for(let i=0;i<118;i++)
      crowdItems.push([-51+i*.87, row*.49+.22, sign*(H+2.5+row*1.7)]);
  for(let sign of [-1,1])for(let row=0;row<4;row++)
    for(let i=0;i<82;i++)
      crowdItems.push([sign*(L+5.1+row*1.8), row*.46+.26,-36+i*.9]);
  const audience=new THREE.InstancedMesh(crowdGeo,crowdMat,crowdItems.length);
  const dummy=new THREE.Object3D();
  crowdItems.forEach((p,i)=>{
    const variance=(Math.sin(i*14.618)*.5+.5);
    dummy.position.set(p[0]+Math.sin(i*2.1)*.23,p[1]+variance*.17,p[2]+Math.cos(i*1.7)*.20);
    dummy.scale.set(.8+variance*.4, .75+variance*.45,1);
    dummy.updateMatrix(); audience.setMatrixAt(i,dummy.matrix);
    audience.setColorAt(i,new THREE.Color(crowdColors[(i*7+Math.floor(i/11))%crowdColors.length]));
  });
  audience.instanceMatrix.needsUpdate=true; scene.add(audience);

  function makeAdTexture(text,bg,fg='#ecf9ff') {
    const c=document.createElement('canvas');c.width=512;c.height=80;
    const ctx=c.getContext('2d');ctx.fillStyle=bg;ctx.fillRect(0,0,512,80);
    ctx.fillStyle=fg;ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.font='italic 900 35px Arial';ctx.fillText(text,256,41);
    const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace; return tex;
  }
  const ads=[
    new THREE.MeshBasicMaterial({map:makeAdTexture('FOOTBALL ARENA 26','#163b65')}),
    new THREE.MeshBasicMaterial({map:makeAdTexture('PLAY THE GAME','#194d4f','#e1ff63')}),
    new THREE.MeshBasicMaterial({map:makeAdTexture('BLUE COMETS','#18468b')}),
    new THREE.MeshBasicMaterial({map:makeAdTexture('RED PHOENIX','#8a2444')}),
  ];
  for(const side of [-1,1])for(let i=0;i<12;i++) {
    const a=mesh(new THREE.PlaneGeometry(7.2,.85),ads[i%4]);
    a.position.set(-40+i*7.25,.50,side*(H+1.0));
    if(side===1)a.rotation.y=Math.PI;
    box(7.25,.92,.20,unlit(0x142533),-40+i*7.25,.5,side*(H+1.18));
  }
  // Four stadium lamp towers.
  for(const x of [-49,49])for(const z of [-37,37]) {
    pole([x,0,z],[x,17,z],.3,scene,mat(0x74899b,.4,.6));
    box(7,.7,.65,unlit(0xe9f5ff),x,17,z);
    for(let i=-2;i<=2;i++) {
      const bulb=mesh(new THREE.SphereGeometry(.27,8,6),new THREE.MeshBasicMaterial({color:0xe3faff}));
      bulb.position.set(x+i*1.2,17.05,z+.4);
    }
  }
  const white=mat(0xffffff,.58), navy=mat(0x101d36),skin=mat(0xe9b995),darkHair=mat(0x20242a);
  const shirtB=mat(0x2388ef,.72), shirtR=mat(0xe83a5e,.72);
  const shirtGkB=mat(0xffc446,.7),shirtGkR=mat(0x54d4a0,.7);
  const blueStripe=mat(0xc9edff,.78),redStripe=mat(0xffbfd0,.78);
  const shortsB=mat(0x19366a),shortsR=mat(0x622440);
  const sockB=mat(0x1c64ad),sockR=mat(0xc52c51);
  const shared={
    head:new THREE.SphereGeometry(.27,10,8),
    hair:new THREE.SphereGeometry(.278,10,8,0,Math.PI*2,0,1.28),
    shirt:new THREE.BoxGeometry(.57,.80,.76),
    stripe:new THREE.BoxGeometry(.585,.63,.13),
    short:new THREE.BoxGeometry(.44,.30,.63),
    limb:new THREE.BoxGeometry(.20,.63,.22),
    arm:new THREE.BoxGeometry(.19,.64,.20),
    foot:new THREE.BoxGeometry(.42,.14,.25),
    shadow:new THREE.CircleGeometry(.55,18),
  };
  const shadowMat=new THREE.MeshBasicMaterial({color:0x061a10,transparent:true,opacity:.27,depthWrite:false});
  const selectedRing=mesh(new THREE.TorusGeometry(.72,.075,6,48),new THREE.MeshBasicMaterial({color:0xe9ff48}));
  selectedRing.rotation.x=Math.PI/2;selectedRing.position.y=.07;
  const indicator=mesh(new THREE.ConeGeometry(.28,.42,5),new THREE.MeshBasicMaterial({color:0xeaff56}));
  indicator.rotation.z=Math.PI; 
  function createAvatar(p) {
    const body=new THREE.Group();
    const keeper=p.index===0;
    const isBlue=p.team===0;
    const jersey=keeper?(isBlue?shirtGkB:shirtGkR):(isBlue?shirtB:shirtR);
    const shorts=isBlue?shortsB:shortsR,socks=isBlue?sockB:sockR;
    const skinMat=mat([0xf2c49f,0xc68b64,0xe0a983,0x8f614c][p.index%4]);
    boxMesh(shared.shirt,jersey,0,1.37,0,body);
    if(!keeper)boxMesh(shared.stripe,isBlue?blueStripe:redStripe,.296,1.39,0,body);
    boxMesh(shared.short,shorts,0,.91,0,body);
    boxMesh(shared.head,skinMat,0,2.04,0,body);
    boxMesh(shared.hair,darkHair,0,2.09,0,body);
    // Shirt front faces +X; thin back numeral.
    const arms=[];
    for(const side of [-1,1]){
      const armPivot=new THREE.Group();armPivot.position.set(0,1.66,side*.49);body.add(armPivot);
      boxMesh(shared.arm,jersey,0,-.30,0,armPivot);arms.push(armPivot);
    }
    const legs=[];
    for(const side of [-1,1]){
      const pivot=new THREE.Group();pivot.position.set(0,.83,side*.20);body.add(pivot);
      boxMesh(shared.limb,skinMat,0,-.32,0,pivot);
      box(.21,.21,.225,socks,0,-.61,0,pivot);
      boxMesh(shared.foot,navy,.13,-.76,0,pivot);legs.push(pivot);
    }
    const mark = mesh(shared.shadow,shadowMat);
    mark.rotation.x=-Math.PI/2; mark.position.y=.062;
    roots.set(p,{body,arms,legs}); groundShadows.set(p,mark);
    scene.add(body);
  }
  function boxMesh(geo, material, x,y,z,parent){const o=mesh(geo,material,parent);o.position.set(x,y,z);return o;}
  function syncPlayers(ps) {
    // Old simulation replaces objects on restart. Clear obsolete avatars.
    if(roots.size===ps.length && ps.every(p=>roots.has(p)))return;
    for(const v of roots.values())scene.remove(v.body);
    for(const shadow of groundShadows.values())scene.remove(shadow);
    roots.clear();groundShadows.clear();
    for(const p of ps)createAvatar(p);
  }
  const ballRoot=new THREE.Group();
  const ballMesh=mesh(new THREE.SphereGeometry(.29,16,12),white,ballRoot);
  for(let i=0;i<9;i++){
    const phi=Math.acos(1-2*(i+.5)/9),theta=i*2.39996;
    const spot=mesh(new THREE.CircleGeometry(.096,6),navy,ballRoot);
    spot.position.set(.297*Math.sin(phi)*Math.cos(theta), .297*Math.cos(phi),.297*Math.sin(phi)*Math.sin(theta));
    spot.lookAt(spot.position.clone().multiplyScalar(2));
  }
  scene.add(ballRoot);
  const ballShadow=mesh(new THREE.CircleGeometry(.32,16),shadowMat);
  ballShadow.rotation.x=-Math.PI/2;ballShadow.position.y=.075;
  const target = new THREE.Vector3(0,0,0);
  let cameraX=0,cameraZ=0,lastTime=performance.now(),active=false;
  function onResize() {
    const w=Math.max(1,innerWidth),h=Math.max(1,innerHeight);
    camera.aspect=w/h; camera.fov=w<h?51:44;camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,w<800?1.2:1.6));
    renderer.setSize(w,h,false);
  }
  window.addEventListener('resize',onResize);
  onResize();
  function drawFrame() {
    const s=api.getState();
    syncPlayers(s.players);
    const now=performance.now();
    const seconds=Math.min(.05,(now-lastTime)/1000);lastTime=now;
    for(const p of s.players) {
      const v=roots.get(p),o=v.body,shadow=groundShadows.get(p);
      if(!v)continue;
      const wx=p.x/U,wz=p.y/U;
      o.position.set(wx,0,wz);
      o.rotation.y=-p.dir;
      shadow.position.set(wx,.064,wz);
      const t=p.run * .30,amp=Math.min(.48,Math.hypot(p.vx,p.vy)/300*.50);
      v.legs[0].rotation.z=Math.sin(t)*amp;
      v.legs[1].rotation.z=-Math.sin(t)*amp;
      v.arms[0].rotation.z=-Math.sin(t)*amp*.8;
      v.arms[1].rotation.z=Math.sin(t)*amp*.8;
    }
    if(s.selected) {
      selectedRing.visible=true;indicator.visible=true;
      selectedRing.position.set(s.selected.x/U,.09,s.selected.y/U);
      indicator.position.set(s.selected.x/U,2.85+Math.sin(now*.004)*.10,s.selected.y/U);
      selectedRing.rotation.z=now*.0002;
    } else {selectedRing.visible=false;indicator.visible=false;}
    ballRoot.position.set(s.ball.x/U,.32+Math.max(0,s.ball.z)/U,s.ball.y/U);
    ballRoot.rotation.z+=seconds*Math.hypot(s.ball.vx,s.ball.vy)/U*.15;
    ballShadow.position.set(s.ball.x/U,.073,s.ball.y/U);
    const focus=s.mode==='menu'?{x:0,y:0}:(s.ball.owner||s.ball);
    const centerX = Math.max(-20,Math.min(20,focus.x/U*.64));
    const centerZ = Math.max(-7,Math.min(7,focus.y/U*.23));
    const smooth=Math.min(1,seconds*2.5);
    cameraX+=(centerX-cameraX)*smooth;cameraZ+=(centerZ-cameraZ)*smooth;
    const aspect=innerWidth/Math.max(1,innerHeight);
    const landscape=aspect>=1;
    target.set(cameraX,0,cameraZ);
    camera.position.set(cameraX+(landscape?9:5),landscape?29:43, cameraZ+(landscape?51:61));
    camera.lookAt(target);
    renderer.render(scene,camera);
    // Preserve charge bar and goal/kick-off announcements from the original HUD.
    if(s.charging&&s.mode==='play') {
      const charge=Math.min(1,(now-s.shootStart)/1150);
      document.getElementById('chargeFill').style.width=(charge*100)+'%';
    }
    if(s.noticeTill && now>s.noticeTill){
      document.getElementById('notice').classList.add('hidden');
      api.clearNotice();
    }
  }
  // Only swap to 3D after a full successful initialization and first render.
  try{
    drawFrame();
    api.setRender(drawFrame);
    api.field.style.display='none';
    const badge=document.getElementById('threeDBadge');
    if(badge) badge.textContent='3D LIVE';
    active=true;
  }catch(error){
    console.warn('3D unavailable, using 2D fallback',error);
    canvas.remove();
    renderer.dispose();
    window.removeEventListener('resize',onResize);
    throw error;
  }
  // Graceful WebGL context loss: restore 2D simulation rendering.
  canvas.addEventListener('webglcontextlost', e=>{
    e.preventDefault();
    if(active){api.restoreRender();api.field.style.display='block';canvas.style.display='none';active=false;}
  },{once:true});
  return {dispose(){window.removeEventListener('resize',onResize);renderer.dispose();canvas.remove();}};
}
