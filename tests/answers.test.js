const fs = require("fs");
const vm = require("vm");

const src = fs.readFileSync(require("path").join(__dirname, "..", "data", "exercises.js"), "utf8");
const sandbox = {window:{}};
vm.createContext(sandbox);
vm.runInContext(src, sandbox);

const ex2 = sandbox.window.CUBE_EXERCISES.find(x => x.number === 2);

function silhouette(heights){
  const max = Math.max(1, ...heights);
  return Array.from({length:max}, (_,r)=>heights.map(h=>h>=max-r));
}
function toVoxels(structure){
  if(structure && Array.isArray(structure.voxels)) return structure.voxels;
  const out=[];
  structure.forEach((row,z)=>row.forEach((h,x)=>{
    for(let y=0;y<h;y++) out.push([x,y,z]);
  }));
  return out;
}
function projections(structure){
  const vox=toVoxels(structure);
  const maxX=Math.max(...vox.map(v=>v[0]));
  const maxY=Math.max(...vox.map(v=>v[1]));
  const maxZ=Math.max(...vox.map(v=>v[2]));
  const top=Array.from({length:maxZ+1},()=>Array(maxX+1).fill(false));
  const front=Array.from({length:maxY+1},()=>Array(maxX+1).fill(false));
  const left=Array.from({length:maxY+1},()=>Array(maxZ+1).fill(false));
  for(const [x,y,z] of vox){
    top[z][x]=true;
    front[maxY-y][x]=true;
    left[maxY-y][z]=true;
  }
  return {top,front,left,right:left.map(row=>[...row].reverse())};
}
function crop(m){
  const cells=[];
  m.forEach((row,r)=>row.forEach((v,c)=>{if(v)cells.push([r,c])}));
  if(!cells.length)return [];
  const rs=cells.map(x=>x[0]), cs=cells.map(x=>x[1]);
  const r0=Math.min(...rs),r1=Math.max(...rs),c0=Math.min(...cs),c1=Math.max(...cs);
  return m.slice(r0,r1+1).map(row=>row.slice(c0,c1+1));
}
function same(a,b){ return JSON.stringify(crop(a))===JSON.stringify(crop(b.map(row=>row.map(Boolean)))); }

let failed = 0;
for(const q of ex2.questions){
  const p = projections(q.options[q.correct]);
  for(const [key,want] of Object.entries(q.views)){
    if(!same(p[key], want)){
      console.error(`FAIL exercise 2 ${q.label}: ${key}`);
      failed++;
    }
  }
}
if(failed) process.exit(1);
console.log("All exercise-2 answer/view checks passed.");
