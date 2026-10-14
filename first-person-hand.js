/* NEXACRAFT right-hand 3D viewmodel, matched to current inventory icon IDs.
 * Camera-attached so it never changes world interaction/raycasting.
 * No external textures. Hotbar art uses the game's existing drawItemIcon().
 */
export function makeFirstPersonHand(THREE,{scene,camera,drawItemIcon,getHeld,isVisible,getMovement,isMining}){
  const basic=(color)=>new THREE.MeshBasicMaterial({
    color,depthTest:false,depthWrite:false,toneMapped:false
  });
  const skin=basic(0xd4a078),skinSide=basic(0xbc8760);
  const jacket=basic(0x247f9b),jacketShade=basic(0x185569),cuff=basic(0x38a5b6);
  const root=new THREE.Group();
  root.name='NEXACRAFT right hand and held item';
  root.position.set(.72,-.82,-1.08);
  root.rotation.z=.65;
  const pivot=new THREE.Group();
  root.add(pivot);
  const shape=(parent,w,h,d,material,x,y,z)=>{
    const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);
    mesh.position.set(x,y,z);
    mesh.renderOrder=10000;
    mesh.frustumCulled=false;
    parent.add(mesh);return mesh;
  };
  // A square sleeved player forearm extends from the bottom-right corner
  // into a distinct hand at the wrist. Colors match the actual 3D player.
  shape(pivot,.28,.69,.31,jacket,0,-.13,.00);
  shape(pivot,.30,.11,.33,jacketShade,0,.18,.00);
  shape(pivot,.292,.06,.337,cuff,0,.24,.002);
  shape(pivot,.258,.25,.287,skin,0,.385,-.012);
  shape(pivot,.083,.133,.11,skinSide,-.156,.385,-.086);
  const held=new THREE.Group();
  held.position.set(-.018,.60,-.155);
  pivot.add(held);
  const blockColors={
    1:0x6a9b3c,2:0x81532f,3:0x888d8e,4:0xd6c28b,5:0x3486bc,
    6:0x946332,7:0x508b39,8:0x383a41,9:0xa39b8d,10:0xc7a13b,
    11:0x3acbd3,12:0xe8eff4,13:0x9e988e,14:0x398a40,
    15:0xc18d53,16:0x7f8182,17:0xbddfe1,18:0x25252b,
    19:0x8c552e,20:0x767b81,21:0xae5250,32:0x8c572e
  };
  let currentId=null,object=null,swingTime=0,walkPhase=0,lastMineSwing=0;
  const itemMat=(c)=>basic(c);
  function clearHeld(){
    if(!object)return;
    held.remove(object);
    object.traverse(child=>{
      if(child.geometry)child.geometry.dispose();
      if(child.material){
        const ms=Array.isArray(child.material)?child.material:[child.material];
        for(const m of ms){m.map?.dispose();m.dispose();}
      }
    });
    object=null;
  }
  function buildHeld(id){
    clearHeld();
    if(id==null)return;
    const placeBlock = Object.hasOwn(blockColors,id) && id!==5;
    if(placeBlock){
      const color=blockColors[id];
      const side=id===1?0x77532e:color;
      const top=id===1?0x6bb750:color;
      const materials=[side,side,top,side,color,color].map(itemMat);
      object=new THREE.Mesh(new THREE.BoxGeometry(.33,.33,.33),materials);
      object.rotation.set(.18,.52,-.18);
      object.position.set(.005,.025,-.015);
    }else{
      // Tools, swords, bow, food, torches and every special item keep their
      // exact recognizable pixel-icon appearance from the NEXACRAFT hotbar.
      const cv=document.createElement('canvas');cv.width=16;cv.height=16;
      const ctx=cv.getContext('2d');
      if(!ctx)return;
      ctx.imageSmoothingEnabled=false;drawItemIcon(ctx,id);
      const texture=new THREE.CanvasTexture(cv);
      texture.magFilter=THREE.NearestFilter;
      texture.minFilter=THREE.NearestFilter;
      texture.colorSpace=THREE.SRGBColorSpace;
      const material=new THREE.MeshBasicMaterial({
        map:texture,transparent:true,alphaTest:.075,side:THREE.DoubleSide,
        depthTest:false,depthWrite:false,toneMapped:false
      });
      object=new THREE.Mesh(new THREE.PlaneGeometry(.55,.55),material);
      object.rotation.set(-.07,.12,-.29);
      object.position.set(-.035,.095,-.025);
    }
    object.name='Held item '+id;
    object.frustumCulled=false;
    object.renderOrder=10002;
    held.add(object);
  }
  camera.add(root);
  if(!camera.parent)scene.add(camera);
  root.visible=false;
  return {
    swing(power=1){
      swingTime=.39;
    },
    update(dt,now){
      const visible=Boolean(isVisible());
      root.visible=visible;
      if(!visible)return;
      const st=getHeld();
      const id=(st && Number(st.qty)>0)?st.id:null;
      if(id!==currentId){currentId=id;buildHeld(id)}
      const movement=Math.min(1,Math.max(0,Number(getMovement())||0)/4.4);
      walkPhase+=dt*(7.8+movement*2.9);
      if(isMining() && now-lastMineSwing>440){
        lastMineSwing=now;swingTime=.39;
      }
      swingTime=Math.max(0,swingTime-dt);
      const swing=swingTime>0?Math.sin(Math.PI*(1-swingTime/.39)):0;
      const bob=movement*Math.sin(walkPhase)*.017;
      root.position.set(.72+bob*.45,-.82+movement*Math.abs(Math.sin(walkPhase))*.027,-1.08);
      root.rotation.set(-swing*.18,0,.65-swing*.66+bob*.45);
      pivot.rotation.x=-swing*.70;
      pivot.rotation.z=swing*.19;
      held.rotation.set(swing*.08,0,-swing*.15);
    }
  };
}
