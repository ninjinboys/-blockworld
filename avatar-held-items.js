/* NEXACRAFT visible third/front-person equipment.
 * Lightweight item view models attached to the existing animated wrist pivots.
 * This file affects rendering only, never inventories, saves or combat.
 */
import {makeNewHeldItemModel} from './item-held-models.js?v=20261020spearBlade03';
import {makeJobWeaponModel,jobWeapon} from './job-system.js?v=20261022powerSwiftBowDistinct11';

export function makeAvatarHeldItems(THREE,drawItemIcon){
  const swords=new Set([111,115,119,123]);
  const CHIMERA_DAGGER=164,CHIMERA_BOW=166;
  const picks=new Set([104,105,114,118,122]);
  const axes=new Set([112,116,120,124,138]);
  const shovels=new Set([113,117,121,125]);
  const blockColors={1:0x65aa45,2:0x8c5837,3:0x86898b,4:0xe4d3a0,5:0x4088c3,
    6:0x86542b,7:0x457b3a,8:0x55565b,9:0x9d8879,10:0xcda545,11:0x43bfcc,
    12:0xeff5fb,13:0x92877f,14:0x448d3d,15:0xb47d45,16:0x777a7d,
    17:0xb2e4eb,18:0x424346,19:0x9c6237,20:0x777b7e,32:0x916033};
  const mat=c=>new THREE.MeshLambertMaterial({color:c});
  function box(group,w,h,d,color,x=0,y=0,z=0){
    const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat(color));
    mesh.position.set(x,y,z);mesh.castShadow=true;group.add(mesh);return mesh;
  }
  function group(){return new THREE.Group()}
  function tier(id){
    if([104,138].includes(id))return [0x98602e,0xc99554,0x624328];
    if([105,111,112,113].includes(id))return [0x899198,0xc0c6c9,0x53595e];
    if([114,115,116,117].includes(id))return [0xbbc8d0,0xe8f1f7,0x657784];
    if([118,119,120,121].includes(id))return [0xe9b832,0xffe789,0x986c15];
    return [0x3cc7d9,0xa4f9fb,0x127d91];
  }
  function tool(id){
    const g=group(),[base,light,dark]=tier(id),wood=0x79512f;
    // Handles are gripped near local Y=0 and point forward out of the fist.
    box(g,.095,.61,.095,wood,0,.245,0);
    box(g,.04,.56,.012,0xb98756,-.025,.245,-.055);
    box(g,.12,.10,.12,dark,0,-.065,0);
    if(swords.has(id)){
      // Every material tier shares a broad, curved, one-edged katana profile.
      box(g,.16,.38,.16,0x38323c,0,.065,0);
      for(let j=0;j<5;j++)
        box(g,.17,.032,.17,j%2?0xc9b58f:dark,0,-.06+j*.085,0);
      box(g,.49,.077,.34,dark,0,.315,0);
      box(g,.40,.092,.40,base,0,.326,0);
      box(g,.24,.10,.19,light,0,.378,0);
      for(let j=0;j<5;j++){
        const x=[.005,.024,.052,.098,.151][j],y=.47+j*.175,w=j===4?.22:.285;
        const segment=box(g,w,.205,.175,base,x,y,0);
        segment.rotation.z=-.045-j*.027;
        const cutting=box(g,.067,.205,.179,light,x-w*.31,y,-.005);
        cutting.rotation.z=segment.rotation.z;
        const spine=box(g,.046,.199,.177,dark,x+w*.33,y,.006);
        spine.rotation.z=segment.rotation.z;
      }
      const point=box(g,.174,.151,.12,base,.196,1.28,0);
      point.rotation.z=-.22;
      const tipEdge=box(g,.068,.155,.122,light,.133,1.28,-.008);
      tipEdge.rotation.z=-.22;
    }else if(picks.has(id)){
      box(g,.63,.15,.15,base,0,.65,0);
      box(g,.55,.045,.09,light,0,.74,-.01);
      for(const side of [-1,1]){const a=box(g,.20,.10,.15,dark,side*.37,.60,0);a.rotation.z=-side*.35}
    }else if(axes.has(id)){
      box(g,.30,.40,.20,base,-.15,.62,0);
      box(g,.095,.45,.20,light,-.32,.62,0);
      box(g,.11,.19,.20,dark,.08,.62,0);
    }else if(shovels.has(id)){
      box(g,.31,.37,.12,base,0,.73,0);
      box(g,.25,.30,.045,light,0,.74,-.083);
      box(g,.17,.11,.12,dark,0,.52,0);
    }
    return g;
  }
  function chimeraDagger(){
    // A short fang-edged wakizashi, matching the other katana swords.
    const g=group();
    box(g,.15,.35,.15,0x392939,0,.07,0);
    for(let i=0;i<4;i++)
      box(g,.165,.036,.166,i%2?0x77536d:0xd1af7b,0,-.05+i*.086,0);
    box(g,.43,.08,.35,0xc39e78,0,.32,0);
    box(g,.32,.09,.37,0x332b3d,0,.34,0);
    for(let j=0;j<4;j++){
      const x=[0,.025,.064,.116][j],y=.47+j*.165,w=j===3?.21:.28;
      const segment=box(g,w,.202,.17,0xd8c7a5,x,y,0);
      segment.rotation.z=-.05-j*.032;
      const edge=box(g,.072,.198,.17,0xffeed0,x-w*.31,y,-.005);
      edge.rotation.z=segment.rotation.z;
    }
    const tip=box(g,.16,.14,.12,0xf4ddba,.163,1.115,0);
    tip.rotation.z=-.22;
    return g;
  }
  function chimeraBow(){
    const g=group();
    for(let i=0;i<=8;i++){
      const t=i/8,y=(t-.5)*1.2;
      const seg=box(g,.105,.17,.14,i%2?0x6f616e:0xb9a89a,
        -.29*Math.sin(Math.PI*t),y,0);
      seg.rotation.z=(t-.5)*.85;
    }
    box(g,.028,1.2,.023,0xe9cb82,.075,0,-.07);
    box(g,.17,.20,.22,0x3d283b,-.30,0,0);
    box(g,.095,.16,.115,0xf1dfb7,.045,.62,0);
    box(g,.095,.16,.115,0xf1dfb7,.045,-.62,0);
    return g;
  }
  function bow(){
    const g=group();
    for(let i=0;i<=8;i++){
      const t=i/8, a=(t-.5)*1.02;
      const seg=box(g,.075,.15,.085,i%2?0x986038:0xc58b50,
        -.19*Math.sin(Math.PI*t),a,0);
      seg.rotation.z=(t-.5)*.65;
    }
    box(g,.025,1.04,.02,0xe4d9c0,.025,0,-.025);
    return g;
  }
  function torch(){
    const g=group();
    box(g,.11,.56,.11,0x7e4c28,0,.21,0);
    box(g,.04,.51,.018,0xba8150,-.035,.21,-.057);
    box(g,.16,.09,.16,0x463324,0,.52,0);
    box(g,.20,.19,.20,0xef7920,0,.65,0);
    box(g,.13,.17,.13,0xffd159,0,.73,-.02);
    box(g,.07,.10,.08,0xfff4b1,0,.81,-.03);
    return g;
  }
  function shield(){
    const g=group();
    // Front face is local -Z. Angular perimeter ends in a real pointed tip.
    function plate(outline,z,depth,color){
      const shape=new THREE.Shape();shape.moveTo(...outline[0]);
      for(let i=1;i<outline.length;i++)shape.lineTo(...outline[i]);
      shape.closePath();
      const mesh=new THREE.Mesh(new THREE.ExtrudeGeometry(shape,{
        depth,steps:1,bevelEnabled:false
      }),mat(color));
      mesh.position.z=z;mesh.castShadow=true;g.add(mesh);
    }
    plate([[-.37,.42],[.37,.42],[.44,.33],[.44,-.12],[.35,-.30],
      [0,-.84],[-.35,-.30],[-.44,-.12],[-.44,.33]],-.05,.15,0x515b61);
    plate([[-.35,.39],[.35,.39],[.41,.29],[.41,-.12],[.32,-.29],
      [0,-.77],[-.32,-.29],[-.41,-.12],[-.41,.29]],-.12,.04,0xaebbc1);
    plate([[-.29,.33],[.29,.33],[.34,.25],[.34,-.11],[.27,-.26],
      [0,-.65],[-.27,-.26],[-.34,-.11],[-.34,.25]],-.165,.035,0x8d5e39);
    box(g,.042,.47,.021,0x553a26,-.12,-.01,-.211);
    box(g,.042,.47,.021,0x553a26,.12,-.01,-.211);
    box(g,.27,.27,.075,0xaebdc2,0,.03,-.242);
    box(g,.14,.14,.079,0xdbe8ec,0,.03,-.29);
    for(const x of [-.30,.30])for(const y of [-.02,.23])
      box(g,.057,.057,.05,0xdbe8ec,x,y,-.22);
    return g;
  }
  function sprite(id){
    const g=group(),canvas=document.createElement('canvas');
    canvas.width=16;canvas.height=16;
    const ctx=canvas.getContext('2d');
    if(!ctx)return g;
    ctx.imageSmoothingEnabled=false;
    drawItemIcon(ctx,id);
    const tex=new THREE.CanvasTexture(canvas);
    tex.magFilter=THREE.NearestFilter;
    tex.minFilter=THREE.NearestFilter;
    tex.colorSpace=THREE.SRGBColorSpace;
    const mesh=new THREE.Mesh(new THREE.PlaneGeometry(.40,.40),
      new THREE.MeshBasicMaterial({map:tex,transparent:true,alphaTest:.08,side:THREE.DoubleSide}));
    mesh.position.y=.18;
    g.add(mesh);
    return g;
  }
  function build(id){
    if(jobWeapon(id))return makeJobWeaponModel(THREE,id);
    if(id>=168&&id<=188)return makeNewHeldItemModel(THREE,id);
    if(id===156)return shield();
    if(id===147||id===31)return torch();
    if(id===CHIMERA_DAGGER)return chimeraDagger();
    if(id===CHIMERA_BOW)return chimeraBow();
    if(id===149)return bow();
    if(swords.has(id)||picks.has(id)||axes.has(id)||shovels.has(id))return tool(id);
    if(Object.hasOwn(blockColors,id)){
      const g=group(),c=blockColors[id];
      const faceColors=id===1?[0x795538,0x795538,0x74c053,0x795538,c,c]:null;
      const mesh=new THREE.Mesh(new THREE.BoxGeometry(.33,.33,.33),
        faceColors?faceColors.map(mat):mat(c));
      mesh.rotation.set(.16,.43,-.1);mesh.position.y=.13;
      mesh.castShadow=true;g.add(mesh);return g;
    }
    return sprite(id);
  }
  function removeParts(anchor){
    for(const node of [...anchor.children]){
      anchor.remove(node);
      node.traverse(n=>{
        if(n.geometry)n.geometry.dispose();
        if(n.material){
          for(const m of (Array.isArray(n.material)?n.material:[n.material])){
            if(m.map)m.map.dispose();
            m.dispose();
          }
        }
      });
    }
  }
  function validId(id){return Number.isInteger(id)&&id>0&&id<=207?id:null}
  function sync(model,mainId,offhandId){
    if(!model?.userData?.limbs)return;
    let state=model.userData.heldItemsView;
    if(!state){
      const right=group(),left=group();
      // Anchor both objects in front of the fists. Their arms are slightly
      // spread while equipped, so the items stay outside the torso from
      // both front-facing and rear-facing camera views.
      right.position.set(.035,-.62,-.33);
      right.rotation.set(-.24,.08,-.22);
      left.position.set(-.045,-.62,-.34);
      left.rotation.set(-.12,0,.08);
      model.userData.limbs.rightArm.add(right);
      model.userData.limbs.leftArm.add(left);
      state={right,left,mainId:null,offhandId:null};
      model.userData.heldItemsView=state;
    }
    const main=validId(mainId),offhand=
      offhandId===147||offhandId===156?offhandId:
      jobWeapon(main)?.kind==='dual'?main:null;
    if(main!==state.mainId){
      removeParts(state.right);
      if(main!=null){
        const item=build(main);
        // Held tools were 0.74x, leaned far forward and disappeared inside
        // the torso. Keep recognizable 3D proportions next to the hand.
        if(main===156){
          item.scale.setScalar(1.12);
          item.position.set(.07,.22,-.08);
          item.rotation.y=-.20;
        }else if(main===147||main===31){
          item.scale.setScalar(1.25);
        }else if(jobWeapon(main)){
          const kind=jobWeapon(main).kind;
          item.scale.setScalar(kind==='greatsword'?.66:kind==='spear'?.69:kind==='shield'?.86:.75);
          item.rotation.set(-.14,.1,-.12);
          item.position.set(0,-.06,-.05);
        }else if(main>=168&&main<=188){
          const longItem=[168,170,171,172,179,186].includes(main);
          item.scale.setScalar(main===168?1.05:longItem?.78:.66);
          item.rotation.set(-.10,.16,-.12);
          item.position.set(.015,-.045,-.02);
        }else if(main===CHIMERA_DAGGER){
          item.scale.setScalar(1.34);
        }else if(swords.has(main)||picks.has(main)||axes.has(main)||shovels.has(main)){
          item.scale.setScalar(1.35);
        }else if(main===149||main===CHIMERA_BOW){
          item.scale.setScalar(1.35);
        }else if(Object.hasOwn(blockColors,main)){
          item.scale.setScalar(1.65);
        }else{
          item.scale.setScalar(1.55);
        }
        state.right.add(item);
      }
      state.mainId=main;
    }
    if(offhand!==state.offhandId){
      removeParts(state.left);
      if(offhand!=null){
        const item=build(offhand);
        if(jobWeapon(offhand)?.kind==='dual'){
          item.position.set(-.04,-.06,-.05);
          item.rotation.set(-.10,-.19,.17);
          item.scale.setScalar(.83);
        }else if(offhand===156){
          // The heater shield covers the forearm, with its point downward
          // and the outer edge clear of the character's body.
          item.position.set(-.12,.24,-.10);
          item.rotation.set(.12,-.13,.04);
          item.scale.setScalar(1.08);
        }else{
          item.position.set(-.02,-.04,-.02);
          item.rotation.x=-.06;
          item.scale.setScalar(1.26);
        }
        state.left.add(item);
      }
      state.offhandId=offhand;
    }
  }
  // Overlay combat/use animations on top of the walking leg/arm pose.
  // The arm pivots already own equipped armor and held tools, so their
  // 3D models swing together. No changes to collision or hit detection.
  function animate(model,now,{kind=null,at=-Infinity,mining=false,drawing=false,guarding=false,riding=false}={}){
    if(!model?.userData?.limbs||riding)return;
    const {leftArm,rightArm}=model.userData.limbs;
    const state=model.userData.heldItemsView;
    if(!state)return;
    // Restore the grip after a completed jab (never leave the spear tilted).
    state.right.rotation.x=-.24;
    const ease=t=>{const x=Math.max(0,Math.min(1,t));return x*x*(3-2*x)};
    if(drawing&&(state.mainId===149||state.mainId===CHIMERA_BOW||jobWeapon(state.mainId)?.kind==='bow')){
      // Two-handed bow stance: both arms reach forward, one draws the string.
      rightArm.rotation.x=1.25;
      rightArm.rotation.y=-.16;
      rightArm.rotation.z=.20;
      leftArm.rotation.x=1.17;
      leftArm.rotation.y=.19;
      leftArm.rotation.z=-.16;
    }else if(mining){
      // Continuous rhythmic pickaxe/hand swings while the attack button is held.
      const phase=(now*.001/.46)*Math.PI*2;
      const lift=(1-Math.cos(phase))*.5;
      rightArm.rotation.x=.10+1.28*lift;
      rightArm.rotation.y=-.22*Math.sin(phase);
      rightArm.rotation.z=.24+.13*Math.sin(phase);
    }else{
      // Attack is wind-up -> decisive downward strike -> recovery.
      // A single click still plays the full motion across subsequent frames.
      const seconds=(now-at)/1000;
      if(Number.isFinite(seconds)&&seconds>=0){
        const baseX=rightArm.rotation.x,baseZ=rightArm.rotation.z;
        if(kind==='thrust'&&(state.mainId===168||jobWeapon(state.mainId)?.kind==='spear')&&seconds<.43){
          // Draw back, extend the elbow, drive the spear straight ahead,
          // and retract. Distinct from the sword's vertical chopping arc.
          const jab=seconds<.09?ease(seconds/.09)*.35:
            seconds<.22?.35+.65*ease((seconds-.09)/.13):
            1-ease((seconds-.22)/.21);
          rightArm.rotation.x=baseX+1.20*jab;
          rightArm.rotation.z=baseZ-.12*jab;
          rightArm.rotation.y=-.21*jab;
          state.right.rotation.x=-.24-1.00*jab;
          leftArm.rotation.x+=.22*jab;
        }else if(kind==='attack'&&jobWeapon(state.mainId)?.kind==='dual'&&seconds<.37){
          // Twin blades alternate instead of mimicking a single heavy sword.
          const quick=Math.sin(Math.PI*seconds/.37);
          rightArm.rotation.x=baseX+1.25*quick;
          rightArm.rotation.z=baseZ+.17*quick;
          leftArm.rotation.x=leftArm.rotation.x+1.20*(1-quick);
          leftArm.rotation.z=-.27*quick;
        }else if(kind==='attack'&&seconds<.46){
          let x;
          if(seconds<.12)x=baseX+(1.55-baseX)*ease(seconds/.12);
          else if(seconds<.26)x=1.55+(-.53-1.55)*ease((seconds-.12)/.14);
          else x=-.53+(baseX+.53)*ease((seconds-.26)/.20);
          rightArm.rotation.x=x;
          rightArm.rotation.y=-.28*Math.sin(Math.PI*seconds/.46);
          rightArm.rotation.z=baseZ+.18*Math.sin(Math.PI*seconds/.46);
        }else if(kind==='use'&&seconds<.34){
          const reach=Math.sin(Math.PI*seconds/.34);
          rightArm.rotation.x=baseX+1.02*reach;
          rightArm.rotation.y=-.12*reach;
        }else if(kind==='fire'&&seconds<.24){
          const snap=1-ease(seconds/.24);
          rightArm.rotation.x=baseX+.86*snap;
          leftArm.rotation.x+=.42*snap;
        }
      }
    }
    if(guarding&&state.offhandId===156&&!drawing){
      // Raise the equipped shield in front of the upper body.
      leftArm.rotation.x=1.22;
      leftArm.rotation.y=-.18;
      leftArm.rotation.z=-.12;
    }
  }
  function dispose(model){
    const state=model?.userData?.heldItemsView;
    if(!state)return;
    removeParts(state.right);removeParts(state.left);
    state.right.removeFromParent();state.left.removeFromParent();
    delete model.userData.heldItemsView;
  }
  return {sync,animate,dispose};
}
