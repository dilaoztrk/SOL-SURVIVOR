import * as T from 'three';
export function addTechnicalNodes(root:T.Group,nodes:Map<string,T.Object3D>){
 const mat=(c:string)=>new T.MeshStandardMaterial({color:c,roughness:.65,metalness:.28});
 function box(name:string,size:number[],position:number[],color:string,parent:T.Object3D=root){const m=new T.Mesh(new T.BoxGeometry(...size as [number,number,number]),mat(color));m.position.set(...position as [number,number,number]);m.name='tech.'+name;m.castShadow=true;m.receiveShadow=true;parent.add(m);nodes.set(m.name,m);return m;}
 function cyl(name:string,r:number,h:number,position:number[],color:string,parent:T.Object3D=root){const m=new T.Mesh(new T.CylinderGeometry(r,r,h,12),mat(color));m.position.set(...position as [number,number,number]);m.name='tech.'+name;m.castShadow=true;parent.add(m);nodes.set(m.name,m);return m;}
 const util=nodes.get('utilities')!,green=nodes.get('greenhouse')!,shelter=nodes.get('shelter')!;
 box('console',[2.1,.8,.7],[.3,.65,.2],'#314b5d',util);box('screen',[1.8,.85,.08],[.3,1.35,.15],'#163444',util);
 for(let i=0;i<4;i++)box('check.'+i,[.28,.18,.07],[-.3+i*.4,1.4,.22],'#bda361',util);
 box('scan',[.035,.65,.09],[-.45,1.35,.23],'#96e1c8',util);
 for(let i=0;i<5;i++){const relay=box('alarm.'+i,[.17,.17,.17],[-7+i*2.75,1.3,-7+i*2.5],'#bc9d65');box('alarmCable.'+i,[2.65,.035,.035],[-5.7+i*2.75,.2,-7+i*2.5],'#9e764e');relay.visible=true;}
 box('alarmPanel',[.7,.4,.08],[1.5,1.8,-2.3],'#736f51',shelter);
 for(const [i,target] of ['valve','filter','heater','battery','air'].entries()){
  const x=-2.2+i*1.1;
  box('cover.'+target,[.78,.6,.12],[x,.78,-.8],'#9facaa',util);
  cyl('old.'+target,.18,.43,[x,.7,-.65],'#a87c56',util);
  cyl('new.'+target,.18,.43,[x,.65,1.25],'#78b5a9',util);
  box('patch.'+target,[.48,.12,.14],[x,.4,1.7],'#e5b16b',util);
  box('tool.'+target,[.08,.55,.12],[x,.7,1.5],'#dd9c64',util);
 }
 const wheel=new T.Mesh(new T.TorusGeometry(.22,.035,6,12),mat('#d88752'));wheel.name='tech.valveWheel';wheel.position.set(-2.2,1,-.65);util.add(wheel);nodes.set(wheel.name,wheel);
 box('heaterCover',[.74,.65,.1],[-2,.73,-1.55],'#9aa9a1',green);box('heaterElement',[.52,.38,.08],[-2,.72,-1.58],'#cd9454',green);box('heaterTool',[.08,.45,.08],[-2,.5,.8],'#e1af6f',green);
 box('exterior.connection',[1.1,.7,.3],[7.4,.9,2],'#8c9e9b');box('exterior.warning',[.15,.15,.07],[7.4,1.05,2.18],'#bfa25a');box('exterior.probe',[.07,.45,.07],[8.2,1.2,3],'#e7ad69');
 for(let i=0;i<4;i++)box('route.'+i,[.9,.08,.08],[-1+i*.8,1.55,.23],'#7e9b9e',util);
 box('batterySpare',[.7,.8,.7],[1.1,.65,1.3],'#a4b9ad',util);box('batterySwitch',[.2,.12,.12],[1.1,1.25,-.8],'#d78e55',util);
 box('quakeClamp',[.5,.1,.22],[2,.45,1.1],'#e2ad6b',util);
 const robot=nodes.get('maintenance.robot')!;
 box('robotBrush',[.24,.12,1.85],[-.5,.1,0],'#edab70',robot);box('robotMast',[.07,.45,.07],[-.1,.4,0],'#a2b6ae',robot);
 for(let i=0;i<4;i++){const wheel=cyl('robotWheel.'+i,.13,.12,[-.25+(i%2)*.5,.05,-.38+Math.floor(i/2)*.76],'#263b46',robot);wheel.rotation.x=Math.PI/2;}
 box('crewBrush',[.1,.12,1.2],[0,0,0],'#dea16a');box('pendingBadge',[.5,.28,.1],[4,1.8,3],'#d8a552');box('operationPulse',[.22,.22,.22],[4,1,3],'#7ed2b5');
 // Capture absolute local baselines. Every frame starts here, avoiding accumulated transforms.
 for(const [name,o] of nodes)if(name.startsWith('tech.')){o.userData.technicalBase={position:o.position.clone(),rotation:o.rotation.clone(),scale:o.scale.clone()};}
}
