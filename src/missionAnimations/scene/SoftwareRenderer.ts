import * as T from 'three';
/** Projects real Three.js mesh triangles through the same 3D camera when WebGL is unavailable. */
export class SoftwareRenderer {
 private ctx:CanvasRenderingContext2D;
 private meshes:{mesh:T.Mesh;triangles:{a:T.Vector3;b:T.Vector3;c:T.Vector3;normal:T.Vector3}[]}[]=[];
 private canvas:HTMLCanvasElement;
 constructor(canvas:HTMLCanvasElement,root:T.Object3D){
  this.canvas=canvas;
  this.ctx=canvas.getContext('2d')!;root.traverse(o=>{if(!(o instanceof T.Mesh)||o.name==='environment.ground')return;const p=o.geometry.attributes.position,idx=o.geometry.index,tris=[];
   for(let i=0;i<(idx?idx.count:p.count);i+=3){const a=new T.Vector3().fromBufferAttribute(p,idx?idx.getX(i):i),b=new T.Vector3().fromBufferAttribute(p,idx?idx.getX(i+1):i+1),c=new T.Vector3().fromBufferAttribute(p,idx?idx.getX(i+2):i+2);tris.push({a,b,c,normal:new T.Vector3().subVectors(b,a).cross(new T.Vector3().subVectors(c,a)).normalize()});}this.meshes.push({mesh:o,triangles:tris});
  });
 }
 render(root:T.Group,camera:T.PerspectiveCamera,storm:number){
  const w=this.canvas.clientWidth,h=this.canvas.clientHeight;if(!w||!h)return;if(this.canvas.width!==w||this.canvas.height!==h){this.canvas.width=w;this.canvas.height=h;}camera.aspect=w/h;camera.updateProjectionMatrix();root.updateMatrixWorld();camera.updateMatrixWorld();
  const ctx=this.ctx,gradient=ctx.createLinearGradient(0,0,0,h);gradient.addColorStop(0,'#202c37');gradient.addColorStop(.45,'#976f56');gradient.addColorStop(1,'#81533e');ctx.fillStyle=gradient;ctx.fillRect(0,0,w,h);
  const vp=new T.Matrix4().multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse),sun=new T.Vector3(-.4,1,.3).normalize();const faces:{xy:number[];z:number;color:string}[]=[];
  for(const {mesh,triangles} of this.meshes){let visible=true;for(let o:T.Object3D|null=mesh;o;o=o.parent)if(!o.visible){visible=false;break;}if(!visible)continue;const mvp=new T.Matrix4().multiplyMatrices(vp,mesh.matrixWorld),normalMatrix=new T.Matrix3().getNormalMatrix(mesh.matrixWorld);const material=mesh.material as T.MeshStandardMaterial;
   for(const tri of triangles){const a=tri.a.clone().applyMatrix4(mvp),b=tri.b.clone().applyMatrix4(mvp),c=tri.c.clone().applyMatrix4(mvp);if([a,b,c].some(v=>v.z< -1||v.z>1))continue;const xy=[(a.x+1)*w/2,(1-a.y)*h/2,(b.x+1)*w/2,(1-b.y)*h/2,(c.x+1)*w/2,(1-c.y)*h/2];if((xy[2]-xy[0])*(xy[5]-xy[1])-(xy[3]-xy[1])*(xy[4]-xy[0])>0)continue;
    const shade=.53+.47*Math.max(0,tri.normal.clone().applyMatrix3(normalMatrix).normalize().dot(sun));const color=material.color.clone().multiplyScalar(shade).add(material.emissive.clone().multiplyScalar(material.emissiveIntensity*.2)).convertLinearToSRGB();faces.push({xy,z:(a.z+b.z+c.z)/3,color:color.getStyle()});
   }
  }faces.sort((a,b)=>b.z-a.z);for(const f of faces){ctx.fillStyle=f.color;ctx.beginPath();ctx.moveTo(f.xy[0],f.xy[1]);ctx.lineTo(f.xy[2],f.xy[3]);ctx.lineTo(f.xy[4],f.xy[5]);ctx.closePath();ctx.fill();}
  if(storm>0){ctx.fillStyle=`rgba(129,79,41,${storm*.72})`;ctx.fillRect(0,0,w,h);}
 }
}
