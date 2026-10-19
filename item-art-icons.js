/* NEXACRAFT: hand-drawn 16x16 pixel art for 20 construction blocks and 21 items.
 * No font/glyph fallback. Drawn directly on the existing inventory, hotbar,
 * crafting, dropped-item and held-item canvases: no image downloads required.
 * IDs are fixed by the save format; keep mappings stable when adding items.
 */
export function drawDetailedItemIcon(g,id){
  id=Number(id);
  if((id<37||id>56)&&(id<168||id>188))return false;
  const p=(x,y,w,h,c)=>{g.fillStyle=c;g.fillRect(x,y,w,h)};
  const poly=(points,c)=>{
    g.fillStyle=c;g.beginPath();g.moveTo(points[0][0],points[0][1]);
    for(let i=1;i<points.length;i++)g.lineTo(points[i][0],points[i][1]);
    g.closePath();g.fill();
  };
  const line=(x0,y0,x1,y1,c,w=1)=>{
    x0=Math.round(x0);y0=Math.round(y0);x1=Math.round(x1);y1=Math.round(y1);
    let dx=Math.abs(x1-x0),dy=-Math.abs(y1-y0),sx=x0<x1?1:-1,sy=y0<y1?1:-1,err=dx+dy;
    for(;;){
      p(x0,y0,w,w,c);
      if(x0===x1&&y0===y1)break;
      const e=err*2;
      if(e>=dy){err+=dy;x0+=sx}
      if(e<=dx){err+=dx;y0+=sy}
    }
  };
  const rim='#24252c',iron='#a5b4be',bright='#ecf4f6',shade='#5c6973';
  const wood='#916038',woodLight='#dba56c',woodDark='#51321e';
  const gold='#e2b94b',goldLight='#ffe59a';
  const cube=(top,front,side)=>{
    poly([[2,5],[8,2],[14,5],[8,8]],rim);
    poly([[3,5],[8,3],[13,5],[8,7]],top);
    poly([[2,5],[8,8],[8,14],[2,11]],rim);
    poly([[3,6],[7,8],[7,13],[3,10]],front);
    poly([[8,8],[14,5],[14,11],[8,14]],rim);
    poly([[9,8],[13,6],[13,11],[9,13]],side);
    p(3,6,1,4,'#ffffff24');
  };
  const shaft=(x0,y0,x1,y1,base=wood)=>{
    line(x0+1,y0,x1+1,y1,rim,3);
    line(x0,y0,x1,y1,base,2);
    line(x0,y0,x1,y1,woodLight,1);
  };
  const arrow=(poison=false)=>{
    shaft(3,13,11,5,wood);
    poly([[10,3],[15,1],[13,6],[11,8]],poison?'#254b31':shade);
    poly([[11,3],[14,2],[13,5]],poison?'#84f167':bright);
    p(2,11,2,4,poison?'#319c5e':'#e7e2c5');
    p(4,12,2,2,poison?'#77ec87':'#f5ebd0');
    if(poison){p(12,3,1,2,'#d7ff77');p(10,6,1,2,'#45bd64')}
  };
  const potion=(fill,dark,light,mark)=>{
    p(6,1,5,2,rim);p(7,1,3,2,'#b78b5e');p(6,3,5,2,'#bfd3da');
    poly([[5,4],[12,4],[14,7],[13,13],[11,15],[5,15],[3,12],[3,8]],rim);
    poly([[6,5],[11,5],[13,8],[12,12],[10,14],[5,14],[4,11],[4,8]],'#b9dbe1');
    poly([[5,9],[12,9],[12,12],[10,14],[5,14],[4,11]],fill);
    p(5,10,2,3,light);p(10,10,2,3,dark);
    p(6,6,1,3,'#ffffff');p(7,5,2,1,'#f8feff');
    if(mark==='heart'){
      poly([[6,10],[7,9],[8,10],[9,9],[11,10],[11,11],[8,13],[5,11]],'#fff3f0');
    }else if(mark==='bolt'){
      poly([[9,9],[7,11],[9,11],[8,13],[11,10],[9,10]],'#f6ffbb');
    }
  };
  const buckle=(x,y)=>{p(x,y,3,3,'#483b2c');p(x+1,y+1,2,1,goldLight)};
  switch(id){
    /* ------------ Distinctive architectural blocks (37..56) ------------ */
    case 37: // Stone bricks: staggered courses, mortar joints and highlights.
    case 38:
    case 39: {
      const moss=id===38,cracked=id===39;
      cube(moss?'#8c9c7b':'#aaaeb3',moss?'#6b8270':'#888e97',moss?'#466b57':'#666f7b');
      line(3,8,7,10,moss?'#425d47':'#505861');
      line(3,11,7,13,moss?'#3e5a43':'#555a61');
      p(5,8,1,2,'#d0d6d0');p(11,8,2,1,'#424954');
      line(10,8,13,7,'#39434d');
      p(10,10,1,3,'#404a52');p(4,4,2,1,'#e3e4e2');
      if(moss){p(4,7,2,2,'#508751');p(6,11,1,2,'#83af58');p(11,6,2,2,'#6e9f55')}
      if(cracked){line(6,5,8,8,'#303741');line(8,8,6,11,'#303741');line(9,9,11,11,'#2d3945')}
      break;
    }
    case 40: // Polished stone
      cube('#d1d5d8','#a6afb9','#778794');
      line(5,4,9,5,'#eff7ff');p(4,7,1,4,'#d2d9df');p(10,8,1,4,'#a2b3be');
      break;
    case 41: // Marble
      cube('#fffbf0','#e2e6e4','#c7d6d8');
      line(5,4,7,5,'#b6bccb');line(11,7,9,10,'#b0bed0');line(3,9,5,11,'#bcc5ca');
      p(10,12,2,1,'#faffff');break;
    case 42: // Purple-black obsidian with bright angular seams
      cube('#554263','#30283e','#1a1d33');
      poly([[5,3],[8,3],[7,6]],'#9180ae');
      line(3,7,6,10,'#986ec1');line(10,8,12,6,'#664794');
      p(11,9,1,2,'#8d72c9');p(4,10,1,2,'#0d0c17');break;
    case 43: // Fired brick wall
      cube('#e1a17b','#bc624e','#8e423b');
      line(3,8,7,10,'#eed4ac');line(3,11,7,13,'#e7b691');
      line(8,10,13,8,'#c1826c');p(5,7,1,3,'#f0c8a8');
      p(10,9,1,2,'#6c3030');p(9,4,2,1,'#ffc69d');break;
    case 44: // Wood stairs: true two-level outline, not a cube.
    case 45: {
      const st=id===44?['#d6a06a','#ae7647','#795131']:['#b7bdc0','#899197','#656d75'];
      poly([[2,9],[7,6],[10,7],[13,5],[15,6],[15,11],[9,15],[2,12]],rim);
      poly([[3,9],[7,7],[10,9],[7,11]],st[0]);
      poly([[7,7],[10,5],[14,6],[10,9]],st[0]);
      poly([[3,10],[7,12],[7,14],[3,12]],st[1]);
      poly([[7,11],[10,9],[10,13],[7,14]],st[1]);
      poly([[10,9],[14,6],[14,11],[10,13]],st[2]);
      p(7,9,3,1,st[2]);p(10,7,2,1,st[1]);p(5,10,2,1,st[2]);break;
    }
    case 46: // Wooden slab, half the height of a full cube
      poly([[2,8],[8,5],[14,8],[8,11]],rim);
      poly([[3,8],[8,6],[13,8],[8,10]],'#d9a26e');
      poly([[2,8],[8,11],[8,14],[2,11]],'#a57643');
      poly([[8,11],[14,8],[14,11],[8,14]],'#714a2b');
      line(4,8,10,8,'#85512c');p(4,11,1,1,'#f2c588');break;
    case 47: // Iron prison bars
      p(2,4,12,2,'#3c4752');p(2,5,12,1,'#e1e9e9');
      p(2,12,12,2,'#364b5b');p(2,12,12,1,'#adbfc7');
      for(const x of [4,8,12]){
        p(x,2,2,12,rim);p(x,3,1,10,'#becdd6');p(x+1,4,1,8,'#7b8c97');
      }break;
    case 48: // Fence: tall posts and horizontal rails
    case 49: {
      p(2,3,4,12,rim);p(3,3,2,11,woodLight);
      p(11,3,4,12,rim);p(12,3,2,11,woodLight);
      p(1,4,5,2,woodDark);p(11,4,5,2,woodDark);
      p(5,7,7,3,rim);p(5,7,7,2,wood);
      p(5,11,7,2,rim);p(5,11,7,1,woodLight);
      p(4,5,1,8,woodDark);p(13,5,1,8,'#76512d');
      if(id===49){p(8,6,1,7,'#492c20');p(11,8,2,3,goldLight)}
      break;
    }
    case 50: // Ladder with separate side rails/rungs.
      line(4,1,4,14,rim,3);line(11,1,11,14,rim,3);
      p(4,2,2,12,woodLight);p(11,2,2,12,wood);
      for(let y=4;y<=12;y+=3){p(5,y,7,2,woodDark);p(6,y,5,1,'#ecc08a')}
      break;
    case 51: // Hinged trap door seen from above
      poly([[3,4],[12,2],[15,11],[6,14]],rim);
      poly([[4,5],[11,3],[14,11],[6,13]],wood);
      poly([[5,6],[11,5],[12,10],[6,11]],'#d6a06e');
      line(6,7,12,6,woodDark);line(6,10,12,9,woodDark);
      p(4,5,2,2,iron);p(11,10,2,1,iron);break;
    case 52: // Golden cage lantern, illuminated yellow center.
      p(7,1,3,3,rim);p(8,1,1,2,goldLight);p(6,3,5,2,iron);
      poly([[4,5],[12,5],[14,9],[12,14],[4,14],[2,9]],rim);
      poly([[5,6],[11,6],[12,9],[11,13],[5,13],[4,9]],'#d08a25');
      p(6,7,5,5,'#fff0a3');p(7,8,3,4,'#fff8d3');
      p(4,7,2,6,'#68533b');p(11,7,2,6,'#6a5136');
      p(4,13,9,2,'#a7abb0');break;
    case 53: // Bookshelf full of differently colored book spines
      p(1,2,14,13,rim);p(2,3,12,11,wood);
      p(2,3,12,2,woodLight);p(2,9,12,2,woodDark);p(2,13,12,1,'#e9aa69');
      for(const [x,w,c] of [[3,2,'#c84e42'],[5,2,'#4c7d9e'],[7,2,'#e3c56a'],[9,2,'#538c65'],[11,2,'#965b95']]){
        p(x,5,w,4,c);p(x,6,1,2,'#ffffff77');
      }
      for(const [x,c] of [[3,'#8eb5a1'],[6,'#b05a4d'],[8,'#d2a64a'],[11,'#6d76a9']])p(x,11,2,2,c);
      break;
    case 54: // Barrel, banded vertical staves
      poly([[4,2],[12,2],[14,5],[14,12],[12,15],[4,15],[2,12],[2,5]],rim);
      p(3,5,10,8,'#996638');p(4,4,8,10,'#be8852');
      for(const x of [5,8,11])p(x,5,1,8,woodDark);
      p(3,5,10,2,shade);p(3,11,10,2,shade);
      p(4,5,8,1,'#c5d0d1');p(4,11,8,1,'#bcc6c6');
      poly([[4,2],[11,2],[13,4],[11,5],[4,5],[3,4]],'#bd8b55');
      p(7,3,2,1,'#724826');break;
    case 55: // TNT stick bundle with black fuse and red binding (no text).
      p(7,1,2,5,'#151a1c');p(8,1,2,1,'#ffb652');
      cube('#ffb0a7','#d9433b','#9f222a');
      p(3,8,4,3,'#faf2d8');p(9,7,4,2,'#f0e5c9');
      p(4,7,2,1,'#672923');p(10,10,2,1,'#612322');
      p(5,3,2,1,'#fff0de');break;
    case 56: // Logs + flickering fire
      line(2,12,13,12,woodDark,3);line(3,13,12,10,'#704225',3);
      line(3,12,12,12,woodLight);line(11,12,5,13,'#d49c5e');
      poly([[6,10],[4,8],[6,4],[8,6],[9,1],[12,7],[11,11],[7,13]],'#b7421f');
      poly([[7,11],[6,8],[8,5],[9,7],[10,4],[11,9],[9,12]],'#ffa62e');
      poly([[8,10],[8,7],[10,9],[9,11]],'#fff2a1');
      p(3,3,1,1,'#ffd473');p(13,5,1,1,'#ffab42');break;
    /* ---------------- All 21 new items: silhouettes only ---------------- */
    case 168: // Long spear with faceted steel head and wrapped grip
      shaft(3,14,11,5);
      poly([[9,5],[11,1],[14,0],[14,4],[11,8]],rim);
      poly([[10,5],[12,2],[13,1],[13,4],[11,6]],iron);
      line(11,2,11,5,bright);p(4,12,2,1,'#e3bc7a');break;
    case 169: // Short iron dagger, double edge and dark hilt
      shaft(4,14,7,10,woodDark);
      poly([[6,11],[8,6],[13,1],[15,0],[14,5],[10,9]],rim);
      poly([[7,10],[9,6],[13,2],[13,5],[9,9]],iron);
      line(12,3,8,9,bright);line(4,10,9,12,'#6b7485',2);
      p(3,13,2,2,'#d6bd82');break;
    case 170: // Massive dual-headed battle axe with iron teeth
      shaft(8,6,5,14);
      poly([[4,2],[8,3],[9,6],[7,10],[2,10],[4,7],[2,5]],rim);
      poly([[5,3],[8,4],[8,7],[6,9],[3,9],[5,7],[3,5]],iron);
      poly([[10,3],[13,2],[15,5],[13,8],[10,8],[9,6]],shade);
      poly([[10,4],[13,3],[14,5],[12,7],[10,7]],bright);
      p(6,5,2,2,'#f7fdff');break;
    case 171: // Steel smithing hammer with solid head
      shaft(8,7,4,14);
      poly([[3,2],[13,1],[14,6],[4,8]],rim);
      poly([[4,3],[12,2],[13,5],[5,7]],iron);
      p(4,3,8,1,bright);p(10,5,3,1,shade);
      p(5,13,2,2,'#8c5e36');break;
    case 172: // Stock, bow limbs, drawn string and loaded bolt
      shaft(4,14,9,5);
      line(4,4,12,4,rim,2);line(3,5,13,2,shade,2);
      line(3,5,10,9,'#bcb6a4');
      line(13,2,10,9,'#f1e6ca');
      p(5,5,7,2,wood);p(6,5,6,1,woodLight);
      line(6,11,12,5,goldLight);p(11,4,3,2,iron);
      p(5,12,2,2,woodDark);break;
    case 173: // Small throwing knife with exposed blade
      shaft(3,13,7,10,woodDark);
      poly([[6,9],[9,4],[15,1],[12,6],[9,10]],rim);
      poly([[8,8],[10,5],[14,2],[12,6],[9,9]],iron);
      line(12,3,9,8,bright);p(4,11,2,1,goldLight);break;
    case 174: // Molotov: transparent glass bottle, cork rag and hot flame
      p(8,1,2,5,woodDark);
      poly([[8,1],[11,3],[11,6],[13,8],[12,14],[4,14],[3,8],[6,6],[6,4]],rim);
      poly([[7,5],[10,5],[12,8],[11,13],[5,13],[4,8]],'#b6b1a0');
      p(5,9,6,4,'#b96327');p(6,10,4,3,'#e38a2d');
      p(6,6,1,3,'#e9fbf0');
      poly([[8,5],[7,3],[9,0],[10,3],[12,3],[10,6]],'#f4601f');
      poly([[8,4],[8,2],[10,4],[9,5]],'#ffe56f');break;
    case 175: potion('#db375e','#9a1735','#ff8295','heart');break;
    case 176: potion('#34aad0','#246bba','#86f1fb','bolt');break;
    case 177: arrow(true);break;
    case 178: // Bucket with bail handle and metallic lips
      line(3,5,4,2,rim,2);line(4,2,11,2,iron);
      line(11,2,13,5,rim,2);
      poly([[2,5],[14,5],[12,14],[4,14]],rim);
      poly([[3,6],[13,6],[11,13],[5,13]],iron);
      poly([[4,7],[12,7],[11,12],[5,12]],shade);
      p(4,6,8,2,bright);p(5,8,1,4,'#dce8e8');p(10,9,1,3,'#405461');
      break;
    case 179: // Fishing rod, fine line and curving hook
      line(4,14,11,3,woodDark,3);line(4,14,11,3,woodLight,1);
      p(10,2,2,2,gold);line(12,3,14,6,bright);
      line(14,6,13,12,bright);line(13,12,11,13,iron);
      p(5,11,2,3,'#684628');p(6,10,2,1,goldLight);break;
    case 180: // Round brass compass with NE red needle
      poly([[6,1],[10,1],[14,5],[15,8],[12,13],[8,15],[4,13],[1,9],[2,5]],rim);
      poly([[6,2],[10,2],[13,5],[14,8],[11,12],[8,14],[4,12],[2,8],[3,5]],gold);
      poly([[6,4],[10,4],[12,6],[12,10],[9,12],[6,12],[4,10],[4,6]],'#cddcdf');
      poly([[8,8],[6,4],[10,7]],'#d54542');poly([[8,8],[10,12],[6,9]],'#385d87');
      p(7,7,2,2,'#252c31');p(7,2,2,1,goldLight);break;
    case 181: // Unrolled chart / map with terrain and grid
      poly([[2,3],[5,2],[12,3],[14,5],[13,13],[4,14],[2,12]],rim);
      poly([[3,4],[5,3],[12,4],[13,6],[12,12],[4,13],[3,11]],'#f0d5a2');
      poly([[5,7],[8,4],[11,6],[9,9],[5,10]],'#60977a');
      poly([[8,8],[10,9],[12,8],[12,11],[9,11]],'#9bc3d3');
      p(5,5,1,1,'#cb8051');p(10,4,1,1,'#d49a50');
      line(4,11,6,12,'#a97e54');break;
    case 182: // Twin binocular barrels with glass lenses
      p(3,3,4,3,rim);p(9,3,4,3,rim);p(6,6,4,2,'#5c5344');
      poly([[2,6],[7,6],[8,12],[6,15],[2,13]],rim);
      poly([[9,6],[14,6],[15,13],[12,15],[8,12]],rim);
      p(3,7,3,5,'#687e8d');p(10,7,3,5,'#667b89');
      p(4,7,2,4,'#acc7cf');p(11,7,2,4,'#8dcbd3');
      p(3,12,3,2,'#263a47');p(10,12,3,2,'#274152');break;
    case 183: // Three overlapping coils of braided hemp rope
      poly([[3,4],[6,2],[11,2],[14,5],[14,10],[11,14],[5,14],[2,10]],rim);
      poly([[4,4],[7,3],[11,4],[12,6],[12,10],[10,12],[6,13],[4,10]],'#8d6032');
      poly([[5,5],[7,4],[10,5],[11,7],[10,10],[7,11],[5,9]],'#e2ad6b');
      poly([[6,6],[9,6],[10,9],[7,10],[6,8]],'#64442a');
      p(7,7,2,2,'#b78047');p(11,3,1,2,'#f9d594');p(4,10,2,2,'#e9b874');
      break;
    case 184: // Blank brass-edged hanging name tag, no literal lettering
      line(4,3,6,1,'#c2d5d6');p(6,1,3,2,'#6c737c');
      poly([[5,3],[13,5],[13,13],[5,14],[2,10]],rim);
      poly([[5,4],[12,6],[12,12],[5,13],[3,10]],'#eacb8d');
      p(5,6,2,2,'#765b34');p(7,9,4,1,'#9b7c52');p(7,11,3,1,'#9b7c52');
      break;
    case 185: // Leather explorer backpack, pocket and shoulder straps
      poly([[5,1],[11,1],[14,4],[14,14],[3,15],[2,5]],rim);
      p(5,2,6,3,'#bd925e');p(4,4,9,9,'#a56d40');
      p(5,5,7,5,'#d09860');p(5,10,7,4,woodDark);
      p(6,10,5,3,'#c08b54');buckle(7,10);
      p(2,5,2,7,'#593c2a');p(13,5,2,7,'#62412d');
      p(7,2,3,1,'#edd1a4');break;
    case 186: // Open delta glider: swept cloth wings and rigid mast
      poly([[8,1],[15,9],[12,12],[8,10],[4,12],[1,9]],rim);
      poly([[8,2],[14,9],[11,10],[8,8]],'#78bcd0');
      poly([[8,2],[2,9],[5,10],[8,8]],'#e6d4a1');
      line(8,2,8,14,woodDark,2);line(8,9,3,12,'#657d88');
      line(8,9,13,12,'#657d88');
      p(7,11,3,1,'#efcb6a');break;
    case 187: // Rolled green sleeping bag with buckles and pillow
      poly([[4,1],[12,1],[14,3],[14,14],[12,15],[4,15],[2,13],[2,4]],rim);
      p(4,2,8,12,'#54825e');p(4,4,8,2,'#729b7b');
      p(4,11,8,2,'#355941');p(3,3,3,10,'#355842');
      p(5,1,6,3,'#b9c7a8');p(6,2,4,1,'#e4e6c7');
      p(5,6,7,2,'#8c6b4d');p(5,11,7,2,'#8c6b4d');
      p(7,6,2,2,goldLight);p(7,11,2,2,goldLight);break;
    case 188: // Flint and steel: iron striker, flint shard and sparks
      poly([[4,7],[10,2],[14,4],[13,10],[8,13],[4,12]],rim);
      poly([[5,8],[10,3],[13,5],[12,9],[8,12]],shade);
      line(4,12,12,12,iron,2);line(5,11,11,11,bright);
      poly([[2,6],[4,2],[5,6]],'#f1b538');
      p(12,1,2,2,'#fff4b8');p(2,10,2,1,'#ee742a');
      p(8,2,2,1,'#d5eef4');break;
  }
  return true;
}
