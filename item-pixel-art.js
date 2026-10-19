/* NEXACRAFT pixel sprites, 16x16 native canvas art.
 * Every item has a recognizable silhouette: no letters, emoji or text.
 * Shared by inventory, recipe cards, hotbar, drops and held-item sprites.
 * All drawing is deterministic and needs no external images or fonts.
 */
const R=(g,x,y,w,h,c)=>{g.fillStyle=c;g.fillRect(x,y,w,h)};
const P=(g,points,c)=>{g.fillStyle=c;g.beginPath();g.moveTo(points[0][0],points[0][1]);for(let i=1;i<points.length;i++)g.lineTo(points[i][0],points[i][1]);g.closePath();g.fill()};
function L(g,x,y,xx,yy,c,w=1){
  x|=0;y|=0;xx|=0;yy|=0;
  let dx=Math.abs(xx-x),sx=x<xx?1:-1,dy=-Math.abs(yy-y),sy=y<yy?1:-1,e=dx+dy;
  while(true){R(g,x,y,w,w,c);if(x===xx&&y===yy)break;const z=2*e;if(z>=dy){e+=dy;x+=sx}if(z<=dx){e+=dx;y+=sy}}
}
const METAL='#d2dce0',HI='#f7ffff',EDGE='#394b56',STEEL='#8198a1';
const WOOD='#9a6338',WOODHI='#df9d5a',DARKWOOD='#4b3023';
const OLIVE='#648045',LIGHTOLIVE='#a4ba75';
const OUTLINE='#252932';
function bottle(g,fluid,shine){
  // Cork, narrow glass neck, wide rounded glass body and transparent reflections.
  R(g,6,1,4,2,'#503525');R(g,7,1,2,1,'#e5ac68');
  R(g,6,3,4,3,'#566976');R(g,7,3,2,3,'#cfecf4');
  P(g,[[5,5],[11,5],[13,8],[13,13],[11,15],[4,15],[2,13],[2,8]],'#364e61');
  P(g,[[5,6],[10,6],[12,9],[12,12],[10,14],[5,14],[3,12],[3,9]],'#bbd9e1');
  P(g,[[4,9],[11,9],[11,13],[5,13],[3,12]],fluid);
  R(g,4,7,1,4,'#ffffff');R(g,6,10,1,3,shine);
  R(g,10,7,1,1,'#e7ffff');R(g,11,11,1,2,'#477183');
}
function bolt(g,tip,shaft,tail){
  L(g,3,13,11,5,'#334047',3);
  L(g,3,13,11,5,shaft,1);
  P(g,[[9,3],[15,0],[14,7],[11,7]],'#29383e');
  P(g,[[10,4],[14,1],[13,6],[11,6]],tip);
  R(g,1,10,3,1,tail);R(g,4,13,1,3,tail);
}
export function drawNewItemArt(g,id){
 switch(id){
  case 168:{ // SPEAR - long ash shaft and broad forged leaf tip
   L(g,2,14,10,5,'#35291f',3);L(g,2,14,10,5,WOOD,2);
   L(g,3,13,9,6,WOODHI,1);
   P(g,[[8,7],[10,3],[14,0],[14,5],[11,8]],EDGE);
   P(g,[[10,5],[13,1],[13,5],[11,7]],METAL);
   L(g,11,3,11,6,HI,1);R(g,6,8,2,2,'#c7ab6f');
   return true;
  }
  case 169:{ // IRON DAGGER
   L(g,2,14,6,10,'#281f22',4);L(g,3,14,6,10,'#7d4b35',2);
   R(g,1,12,3,1,'#c1a268');R(g,3,13,2,1,'#dfc486');
   P(g,[[6,11],[8,7],[12,2],[15,1],[13,5],[9,10]],EDGE);
   P(g,[[7,10],[9,7],[13,2],[13,5],[9,9]],METAL);
   L(g,12,3,8,9,HI,1);
   L(g,5,10,8,12,'#33424b',2);R(g,4,11,3,1,'#b8bfc6');
   return true;
  }
  case 170:{ // BATTLE AXE - double edged heavy head
   L(g,3,14,9,5,DARKWOOD,4);L(g,4,13,9,5,WOOD,2);L(g,5,12,8,6,WOODHI,1);
   P(g,[[7,3],[12,2],[15,4],[13,9],[9,8],[6,6],[2,9],[1,4],[5,2]],'#32424d');
   P(g,[[6,4],[10,3],[13,4],[12,7],[8,6],[5,5],[2,7],[2,4]],'#aebdc5');
   R(g,7,4,4,1,HI);R(g,6,6,3,1,STEEL);
   R(g,7,8,3,2,'#b9a46a');return true;
  }
  case 171:{ // HAMMER - faceted steel maul head
   L(g,3,14,9,6,DARKWOOD,4);L(g,4,14,9,6,WOOD,2);
   P(g,[[4,2],[10,1],[15,4],[12,9],[6,8],[2,5]],EDGE);
   P(g,[[5,3],[10,2],[13,4],[11,7],[6,7],[3,5]],STEEL);
   P(g,[[5,3],[10,2],[11,3],[5,5]],METAL);
   R(g,7,4,3,1,HI);L(g,6,9,8,7,'#dabd7e',2);return true;
  }
  case 172:{ // CROSSBOW: horizontal bow with taut cord and wooden stock
   P(g,[[1,4],[5,1],[11,1],[15,4],[12,6],[4,6]],'#303c45');
   P(g,[[2,4],[5,2],[11,2],[14,4],[11,5],[5,5]],'#9f6941');
   L(g,3,4,13,4,'#f4e2c0',1);R(g,7,2,2,8,'#634127');
   P(g,[[5,7],[10,7],[11,14],[8,15],[6,14]],'#49362a');
   R(g,7,8,2,5,'#b98a53');R(g,8,10,3,2,'#d7b172');
   L(g,8,1,8,8,'#eff5ec',1);R(g,7,2,2,2,'#e1e7db');
   return true;
  }
  case 173:{ // THROWING KNIFE: slim blade, ringed steel pommel
   P(g,[[5,11],[8,7],[13,1],[15,0],[14,4],[9,10]],'#34434c');
   P(g,[[7,9],[10,5],[14,1],[13,4],[9,9]],'#d1e4e8');
   L(g,12,3,8,8,'#ffffff',1);
   L(g,3,13,6,10,'#6d5142',3);L(g,3,13,6,10,'#b18966',1);
   R(g,2,13,2,2,'#c6d0d3');R(g,2,14,1,1,'#38454a');
   R(g,5,10,4,1,'#2d3c43');return true;
  }
  case 174:{ // MOLOTOV: glass bottle and burning cloth wick
   P(g,[[5,6],[10,6],[12,9],[12,14],[4,14],[3,12],[3,9]],'#334c59');
   P(g,[[5,7],[10,7],[11,10],[11,13],[4,13],[4,10]],'#bd9b62');
   R(g,5,10,6,3,'#9a5826');R(g,4,8,1,4,'#e6d3a4');
   R(g,6,4,3,3,'#604432');R(g,7,3,2,2,'#e9c499');
   P(g,[[7,5],[5,3],[7,2],[8,0],[10,3],[12,1],[12,5],[9,7]],'#d34b17');
   P(g,[[7,5],[7,3],[9,1],[9,4],[10,3],[10,6]],'#ffb62a');
   R(g,8,3,1,2,'#fff3b2');R(g,8,8,2,1,'#ffe5aa');
   return true;
  }
  case 175:{ // HEAL POTION: carmine red liquid and medical cross on glass
   bottle(g,'#c63754','#f49b9d');
   R(g,7,8,2,5,'#fff0cf');R(g,5,10,6,2,'#fff0cf');
   R(g,10,13,1,1,'#832a47');return true;
  }
  case 176:{ // STAMINA POTION: azure blue-green liquid, lightning sparkle
   bottle(g,'#239ac7','#83faff');
   P(g,[[9,7],[6,11],[8,11],[7,14],[12,9],[9,9]],'#d6ffff');
   R(g,11,12,1,1,'#4bf1d3');return true;
  }
  case 177:{ // POISON ARROW: emerald arrowhead, violet-green envenomed shaft
   L(g,2,14,11,5,'#352f39',3);L(g,3,13,11,5,'#98664d',1);
   P(g,[[9,3],[15,0],[14,7],[11,7]],'#2f4150');
   P(g,[[10,4],[14,1],[13,6],[11,6]],'#54d279');
   L(g,11,4,12,6,'#effe8d',1);
   R(g,1,11,3,1,'#6b51ab');R(g,4,13,1,3,'#9576db');
   R(g,8,8,2,1,'#b85bf0');R(g,6,10,1,1,'#61db75');
   return true;
  }
  case 189:{ // WATER BUCKET: filled with bright blue water
    P(g,[[4,5],[4,3],[6,1],[10,1],[12,3],[12,5]],'#586875');
    P(g,[[5,5],[5,3],[7,2],[9,2],[11,3],[11,5]],'#f6fcff');
    P(g,[[2,5],[14,5],[12,14],[4,14]],'#334957');
    P(g,[[3,6],[13,6],[11,13],[5,13]],'#a4beca');
    P(g,[[3,6],[13,6],[12,10],[4,10]],'#287dca');
    R(g,4,7,7,2,'#5dc8f9');R(g,5,10,5,1,'#b9f5ff');
    R(g,2,5,12,1,'#eff8fc');return true;
  }
  case 178:{ // BUCKET: open metal pail with water and round bail handle
   P(g,[[4,5],[4,3],[6,1],[10,1],[12,3],[12,5]],'#586875');
   P(g,[[5,5],[5,3],[7,2],[9,2],[11,3],[11,5]],'#e5ecef');
   P(g,[[2,5],[14,5],[12,14],[4,14]],'#394b56');
   P(g,[[3,6],[13,6],[11,13],[5,13]],'#99adb6');
   P(g,[[3,6],[13,6],[12,8],[4,8]],'#4cadd1');
   R(g,4,7,7,1,'#8ee2ed');R(g,5,9,1,3,'#e7f7f4');R(g,10,10,2,1,'#5b7d8b');
   R(g,2,5,12,1,'#e9f1ee');return true;
  }
  case 179:{ // FISHING ROD: curved wooden rod, thin line, bright float & hook
   L(g,2,14,8,4,DARKWOOD,3);L(g,3,13,8,4,WOODHI,1);
   L(g,7,4,10,1,'#d7b478',2);
   L(g,10,1,13,5,'#ba9c67',1);
   L(g,13,5,13,11,'#d8dce0',1);
   R(g,12,10,3,2,'#e04c37');R(g,13,9,1,1,'#ffffff');
   L(g,13,12,11,14,'#dbe2e4',1);R(g,11,14,2,1,'#727d82');
   R(g,3,11,2,2,'#564234');return true;
  }
  case 180:{ // COMPASS: heavy brass bezel and red north-pointing needle
   P(g,[[6,1],[10,1],[14,5],[15,9],[12,13],[9,15],[5,14],[1,10],[1,6]],'#4d3c2a');
   P(g,[[6,2],[10,2],[13,5],[14,9],[11,12],[8,14],[5,13],[2,10],[2,6]],'#e5b961');
   P(g,[[6,3],[10,3],[12,5],[13,9],[10,12],[6,12],[3,9],[3,6]],'#304657');
   P(g,[[7,5],[11,2],[9,9],[8,8]],'#e9554f');
   P(g,[[8,8],[7,12],[5,13],[7,6]],'#e1ecf3');
   R(g,7,7,2,2,'#ffda87');R(g,7,2,2,1,'#fff3bf');return true;
  }
  case 181:{ // MAP: folded parchment sheet, painted river, forest and trail
   P(g,[[2,4],[6,2],[10,4],[14,2],[14,12],[10,14],[6,12],[2,14]],'#443a2d');
   P(g,[[3,5],[6,3],[10,5],[13,3],[13,11],[10,13],[6,11],[3,13]],'#e9d4a1');
   L(g,6,3,6,11,'#b4a27d',1);L(g,10,5,10,13,'#b4a27d',1);
   P(g,[[3,9],[6,8],[8,9],[9,6],[11,7],[13,9],[13,11],[10,10],[8,12],[6,10],[3,12]],'#78bad2');
   R(g,5,5,2,2,'#649262');R(g,11,5,1,2,'#3c784f');R(g,9,11,2,1,'#8fa363');
   R(g,3,5,1,7,'#fff1cc');return true;
  }
  case 182:{ // BINOCULARS: two deep navy barrels with cyan optic lenses
   R(g,3,3,4,4,'#273440');R(g,9,3,4,4,'#273440');
   R(g,5,4,6,4,'#4c646b');
   P(g,[[2,5],[7,5],[8,12],[6,15],[1,14],[1,9]],'#1f2935');
   P(g,[[9,5],[14,5],[15,9],[15,14],[10,15],[8,12]],'#1f2935');
   P(g,[[2,9],[7,9],[7,13],[2,13]],'#42657b');
   P(g,[[9,9],[14,9],[14,13],[9,13]],'#42657b');
   R(g,3,10,3,2,'#79dcdf');R(g,10,10,3,2,'#79dcdf');
   R(g,3,6,3,1,'#9aabb2');R(g,10,6,3,1,'#9aabb2');return true;
  }
  case 183:{ // ROPE: braided coil with open center and dangling loose end
   P(g,[[5,1],[11,1],[14,4],[14,10],[11,13],[5,13],[2,10],[2,4]],'#5e4329');
   P(g,[[5,2],[11,2],[13,4],[13,10],[11,12],[5,12],[3,10],[3,4]],'#d8a86a');
   P(g,[[6,5],[10,5],[11,7],[10,9],[6,9],[5,7]],'#67503b');
   P(g,[[6,6],[10,6],[10,8],[6,8]],'#24353a');
   L(g,4,4,5,3,'#fff0a7',1);L(g,12,10,10,12,'#8a5e38',1);
   L(g,10,12,11,15,'#b88546',3);R(g,11,14,1,1,'#f3d28d');
   R(g,3,7,1,3,'#f2ce88');return true;
  }
  case 184:{ // NAME TAG: cut-corner parchment with punched hole & tie
   L(g,1,1,4,4,'#a47b48',1);
   P(g,[[6,2],[14,2],[14,11],[9,15],[2,9]],'#493723');
   P(g,[[6,3],[13,3],[13,10],[9,14],[3,9]],'#e9cb8c');
   P(g,[[6,3],[9,3],[5,7],[3,9]],'#f6e6b3');
   R(g,5,5,2,2,'#6b5c45');R(g,5,5,1,1,'#dbe8dd');
   L(g,8,7,12,7,'#906c44',1);L(g,7,10,11,10,'#906c44',1);
   R(g,11,4,1,1,'#fff2cc');return true;
  }
  case 185:{ // BACKPACK: full rucksack with padded straps, pouch & brass clasp
   R(g,4,1,8,4,'#5b3b27');R(g,6,2,4,2,'#d1a16b');
   R(g,1,5,3,7,'#463326');R(g,12,5,3,7,'#463326');
   P(g,[[5,3],[11,3],[14,6],[14,14],[2,14],[2,6]],'#473127');
   P(g,[[5,4],[11,4],[13,6],[13,13],[3,13],[3,6]],'#a96e3e');
   R(g,4,5,8,3,'#c99254');R(g,4,8,8,1,'#603c2b');
   R(g,5,9,6,4,'#764629');R(g,6,10,4,2,'#bd8248');
   R(g,7,8,2,3,'#f4d68f');R(g,5,13,6,1,'#5a3b28');
   return true;
  }
  case 186:{ // GLIDER: large swept wings, ribbing and central braced keel
   P(g,[[1,3],[8,6],[15,3],[14,10],[10,12],[8,15],[6,12],[2,10]],'#2d4959');
   P(g,[[2,4],[7,7],[7,12],[4,10]],'#63c2c4');
   P(g,[[14,4],[9,7],[9,12],[12,10]],'#76ced6');
   P(g,[[8,7],[7,12],[8,15],[9,12]],'#d8efdf');
   L(g,2,4,7,8,'#b2fff0',1);L(g,14,4,9,8,'#b2fff0',1);
   L(g,8,7,4,10,'#397a85',1);L(g,8,7,12,10,'#397a85',1);
   R(g,7,6,2,4,'#9b793d');return true;
  }
  case 187:{ // SLEEPING BAG: rolled olive bedding with white pillow and zipper
   P(g,[[8,1],[13,4],[15,12],[12,15],[3,14],[1,11],[3,5]],'#343b30');
   P(g,[[8,2],[12,5],[14,12],[11,14],[4,13],[2,11],[4,5]],'#597247');
   P(g,[[6,3],[9,3],[11,5],[9,7],[5,7],[4,5]],'#ece3cc');
   R(g,5,5,4,1,'#fff7e5');
   L(g,9,7,12,12,'#cfb06b',1);
   L(g,4,9,6,12,'#90a36e',2);
   R(g,10,10,1,1,'#f4d6a4');R(g,11,13,2,1,'#35452d');return true;
  }
  case 188:{ // FLINT AND STEEL: actual U-shaped striker and flint with sparks
   P(g,[[2,4],[5,4],[5,11],[8,12],[11,11],[11,5],[14,5],[14,11],[11,14],[5,14],[2,11]],'#33424a');
   P(g,[[3,5],[4,5],[4,11],[7,13],[11,12],[12,10],[12,6],[13,6],[13,11],[11,13],[6,13],[3,11]],'#c3cdd1');
   P(g,[[9,6],[12,4],[14,7],[12,10],[9,9]],'#414851');
   P(g,[[10,6],[12,5],[13,7],[12,8],[10,8]],'#72828a');
   P(g,[[10,3],[11,0],[12,3],[15,2],[13,5]],'#f9a735');
   R(g,11,1,1,2,'#ffffc5');R(g,14,5,1,1,'#f2741f');
   return true;
  }
  default:return false;
 }
}

function cube(g,top,front,side){
 P(g,[[2,4],[8,1],[14,4],[8,7]],top);
 P(g,[[2,4],[8,7],[8,14],[2,11]],front);
 P(g,[[8,7],[14,4],[14,11],[8,14]],side);
 R(g,2,5,1,6,'#ffffff22');R(g,13,5,1,6,'#00000033');
}
export function drawNewBlockArt(g,id){
 switch(id){
  case 37:case 38:case 39:{ // stone brick variants: mortar, moss, cracks
   const moss=id===38,crack=id===39;
   cube(g,moss?'#94a594':'#a5a7a9',moss?'#647567':'#7b8085',moss?'#455b4a':'#5d6369');
   L(g,2,8,7,9,'#454e50',1);L(g,2,11,7,12,'#4b5555',1);
   L(g,9,9,13,8,'#444f55',1);R(g,5,5,1,3,'#c6cace');
   if(moss){R(g,4,9,3,1,'#537b3b');R(g,9,8,2,3,'#376f3e');R(g,11,4,2,1,'#6b9f51')}
   if(crack){L(g,10,5,9,8,'#2c3639');L(g,9,8,12,11,'#2c3639');L(g,12,11,11,13,'#2c3639')}
   return true;
  }
  case 40:case 41:case 42:{ // polished stone, marble, volcanic obsidian
   const marble=id===41,obs=id===42;
   cube(g,marble?'#f4f0e7':obs?'#534568':'#c1c6c8',
     marble?'#dedfd8':obs?'#30283d':'#9ea5a9',
     marble?'#c0c5c5':obs?'#191728':'#727d82');
   L(g,4,8,7,5,marble?'#b9b7b1':obs?'#7f5899':'#cbd8df');
   L(g,9,8,12,5,marble?'#c5c6c4':obs?'#8e6eb3':'#8c9ba1');
   R(g,4,4,2,1,obs?'#a392c6':'#ffffff');return true;
  }
  case 43:{ // red bricks and mortar
   cube(g,'#d2896a','#bd604a','#8e4238');
   L(g,2,8,7,9,'#edc0a2',1);L(g,2,11,7,12,'#e0a187',1);
   R(g,5,6,1,2,'#ecad8b');R(g,11,7,1,4,'#e8ac90');return true;
  }
  case 44:case 45:{ // stair: visible silhouette rather than a solid block
   const wood=id===44,mid=wood?'#bf8650':'#a0a4a6',top=wood?'#e6b47a':'#d4d9dc',dark=wood?'#6f4728':'#575d62';
   P(g,[[1,9],[7,6],[14,9],[8,13]],dark);
   P(g,[[1,9],[7,6],[14,9],[8,12]],mid);
   P(g,[[2,11],[8,13],[8,15],[2,13]],wood?'#8b542e':'#737a7f');
   P(g,[[8,13],[14,9],[14,12],[8,15]],dark);
   P(g,[[4,6],[9,3],[13,5],[8,8]],top);
   P(g,[[4,6],[8,8],[8,11],[4,9]],mid);
   P(g,[[8,8],[13,5],[13,8],[8,11]],dark);
   if(wood){R(g,5,7,3,1,'#d69a61');R(g,9,12,2,1,'#a76b3e')}
   return true;
  }
  case 46:{ // half slab at half height
   P(g,[[2,7],[8,4],[14,7],[8,10]],'#e4b077');
   P(g,[[2,7],[8,10],[8,14],[2,11]],'#aa6f40');
   P(g,[[8,10],[14,7],[14,11],[8,14]],'#78502c');
   R(g,4,8,3,1,'#f6c68c');return true;
  }
  case 47:{ // metal bars with daylight visible between rods
   R(g,2,3,12,2,'#2f3940');R(g,2,11,12,2,'#3a4650');
   for(const x of [3,7,11]){R(g,x,1,2,14,'#30424e');R(g,x+1,2,1,12,'#becbd0')}
   R(g,2,4,12,1,'#adbbc0');R(g,2,12,12,1,'#687782');return true;
  }
  case 48:case 49:{ // fence/gate: thick posts and horizontal planks
   const gate=id===49;
   for(const x of [2,12]){R(g,x,3,3,12,'#4b3527');R(g,x+1,4,1,9,'#d4a16a')}
   R(g,4,6,9,2,'#74502f');R(g,4,10,9,2,'#74502f');
   R(g,5,6,7,1,'#dda469');R(g,5,10,7,1,'#dda469');
   if(gate){L(g,6,8,11,12,'#533927',2);R(g,11,7,1,3,'#d5dce1')}
   return true;
  }
  case 50:{ // ladder
   R(g,3,1,2,14,'#543820');R(g,11,1,2,14,'#543820');
   R(g,4,2,1,12,'#ddb07d');R(g,11,2,1,12,'#dda671');
   for(const y of [4,7,10,13]){R(g,4,y,8,2,'#6d432a');R(g,5,y,6,1,'#c38e54')}
   return true;
  }
  case 51:{ // hinged wooden floor hatch
   P(g,[[2,5],[10,1],[15,7],[7,12]],'#583923');
   P(g,[[3,5],[10,2],[14,7],[7,11]],'#c9945a');
   L(g,5,4,10,9,'#754929',1);L(g,9,2,14,7,'#754929',1);
   R(g,5,7,3,2,'#4f4d4a');R(g,10,4,2,2,'#e0dbcb');return true;
  }
  case 52:{ // lantern with illuminated cage
   R(g,7,0,2,3,'#454545');R(g,5,2,6,2,'#566167');
   P(g,[[5,4],[11,4],[13,7],[12,13],[4,13],[3,7]],'#403b35');
   P(g,[[5,5],[11,5],[12,8],[11,12],[5,12],[4,8]],'#f7a632');
   P(g,[[7,6],[9,6],[10,10],[8,12],[6,10]],'#fff2a4');
   R(g,4,6,2,7,'#647479');R(g,10,6,2,7,'#54626c');
   R(g,3,13,10,2,'#384349');return true;
  }
  case 53:{ // bookshelf, upright multicolor spines
   R(g,1,2,14,13,'#59361f');R(g,2,3,12,10,'#b67b48');
   for(const [x,color] of [[3,'#b3463b'],[5,'#509d82'],[7,'#6c66aa'],[9,'#d4b24a'],[11,'#51759d']]){
     R(g,x,4,2,5,color);R(g,x,10,2,3,color);
   }
   R(g,2,8,12,2,'#704328');R(g,2,13,12,2,'#613a27');
   R(g,4,5,1,1,'#e6d29a');R(g,8,11,1,1,'#d6d0ef');return true;
  }
  case 54:{ // barrel, tapered staves and iron hoops
   P(g,[[3,2],[13,2],[14,5],[13,14],[3,14],[2,5]],'#3e2d26');
   P(g,[[4,3],[12,3],[13,6],[12,13],[4,13],[3,6]],'#976337');
   R(g,6,3,2,10,'#bd8446');R(g,10,3,1,10,'#6d442b');
   for(const y of [5,11]){R(g,2,y,12,2,'#51575a');R(g,3,y,9,1,'#aab5b8')}
   return true;
  }
  case 55:{ // TNT red crate with black fuse, yellow warning hazard
   cube(g,'#f28b71','#c63131','#912c30');
   R(g,4,7,3,2,'#f4eee1');R(g,4,11,3,2,'#f4eee1');
   R(g,9,7,4,2,'#f1dcc2');R(g,9,11,4,2,'#e1c7b4');
   R(g,7,2,2,2,'#272a31');R(g,8,1,1,2,'#ffcd45');
   return true;
  }
  case 56:{ // glowing campfire: crossing logs and tall animated-like flame
   L(g,2,12,13,12,'#56351e',3);L(g,4,14,12,9,'#85532f',3);
   L(g,2,9,13,14,'#9e6339',3);L(g,3,9,11,13,'#d4a06a',1);
   P(g,[[6,11],[4,8],[7,6],[7,2],[10,5],[12,3],[12,8],[9,12]],'#df511f');
   P(g,[[7,10],[6,8],[8,6],[9,3],[10,8],[9,11]],'#ffc341');
   R(g,8,6,1,3,'#fff5a6');
   return true;
  }
  default:return false;
 }
}
