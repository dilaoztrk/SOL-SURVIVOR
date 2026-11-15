import * as T from 'three';
import {addTechnicalNodes} from '../technical/model';
import {applyTechnicalState} from '../technical/render';
import {getAnimationDefinitions} from '../animation/registry';
import type {Location,PlaybackSnapshot,SceneState,Equipment} from '../animation/types';
export const LOCATIONS:Record<Location,[number,number,number]>={shelter:[-7,0,-7],habitat:[-7,0,2],greenhouse:[4,0,-7],utilities:[4,0,3],solar:[12,0,4],departure:[-7,0,13],archive:[19,0,-14]};
export const SCENE_CONTRACT_VERSION='ares7-proxy-1';
export interface BaseModel {root:T.Group;nodes:Map<string,T.Object3D>;sun:T.DirectionalLight;dust:T.Mesh[];dispose:()=>void}
export function createBaseModel():BaseModel{
 const root=new T.Group(),nodes=new Map<string,T.Object3D>();root.name='ARES7';
 const materials=new Map<string,T.MeshStandardMaterial>();
 function material(color:string){if(!materials.has(color))materials.set(color,new T.MeshStandardMaterial({color,roughness:.76,metalness:.18}));return materials.get(color)!;}
 function box(name:string,size:number[],pos:number[],color:string,parent:T.Object3D=root){const mesh=new T.Mesh(new T.BoxGeometry(...size as [number,number,number]),material(color).clone());mesh.position.set(...pos as [number,number,number]);mesh.name=name;mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);nodes.set(name,mesh);return mesh;}
 function cylinder(name:string,r:number,h:number,pos:number[],color:string,parent:T.Object3D=root){const mesh=new T.Mesh(new T.CylinderGeometry(r,r,h,12),material(color).clone());mesh.position.set(...pos as [number,number,number]);mesh.name=name;mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);nodes.set(name,mesh);return mesh;}
 function group(name:string,pos:number[]){const g=new T.Group();g.name=name;g.position.set(...pos as [number,number,number]);root.add(g);nodes.set(name,g);return g;}
 root.add(new T.HemisphereLight('#d9e6ee','#703d27',2));const sun=new T.DirectionalLight('#ffdfbb',3);sun.position.set(-12,24,10);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);sun.shadow.camera.left=-35;sun.shadow.camera.right=35;sun.shadow.camera.top=35;sun.shadow.camera.bottom=-35;root.add(sun);
 box('environment.ground',[110,.2,110],[0,-.25,0],'#925c40');
 for(let i=0;i<32;i++){let x=Math.sin(i*78.3)*36,z=Math.cos(i*32.8)*34;if(Math.abs(x)<17&&Math.abs(z)<17)continue;let m=new T.Mesh(new T.DodecahedronGeometry(.15+(i%4)*.16,0),material('#77513d'));m.position.set(x,.07,z);m.scale.y=.5;root.add(m);}
 for(const area of ['shelter','habitat','greenhouse','utilities'] as const){const g=group(area,LOCATIONS[area]);box(area+'.floor',[6,.2,5],[0,.05,0],'#969b95',g);box(area+'.backWall',[6,2.6,.16],[0,1.4,-2.5],'#c7c9bb',g);box(area+'.sideWall',[.15,1.1,5],[-3,.6,0],'#c7c9bb',g);box(area+'.trim',[6,.18,.2],[0,.8,-2.37],'#df824b',g);box(area+'.door',[1.1,1.8,.14],[2.1,1.05,-2.34],'#3d535c',g);box(area+'.serviceLights',[4,.08,.12],[0,2.55,-2.3],'#8ae5dd',g);box(area+'.essentialAir',[.9,.3,.15],[-2,2.05,-2.3],'#579f98',g);}
 const shelter=nodes.get('shelter')!;
 for(let i=0;i<3;i++)cylinder('shelter.water.'+i,.3,.9,[-1.8+i*.8,.6,-.8],'#728e99',shelter);
 box('shelter.radio',[1,.5,.7],[1,.6,-1],'#374954',shelter);box('shelter.monitor',[1.4,.75,.12],[0,1.8,-2.3],'#8c9a55',shelter);
 const hab=nodes.get('habitat')!;box('habitat.table',[2.6,.14,1.4],[0,.9,0],'#40505a',hab);box('habitat.table.leg',[.2,.8,.2],[0,.5,0],'#6e7977',hab);
 for(let i=0;i<4;i++){box('habitat.meal.'+i,[.4,.12,.35],[-.8+(i%2)*1.5,1.04,-.42+Math.floor(i/2)*.8],'#eb9f5f',hab);box('habitat.bunk.'+i,[.9,.35,1.45],[-2.1+(i%2)*4.2,.45,-.8+Math.floor(i/2)*2],'#55716e',hab);}
 const green=nodes.get('greenhouse')!;
 for(let i=0;i<8;i++){let x=-1.9+(i%4)*1.2,z=-.85+Math.floor(i/4)*1.7;box('greenhouse.bed.'+i,[1,.3,1.15],[x,.4,z],'#4c5c50',green);cylinder('greenhouse.crop.'+i,.18,.65,[x,.85,z],'#668553',green);const fruit=new T.Mesh(new T.SphereGeometry(.16,8,6),material('#dd7245'));fruit.name='greenhouse.produce.'+i;fruit.position.set(x+.1,1.15,z);green.add(fruit);nodes.set(fruit.name,fruit);box('greenhouse.led.'+i,[.8,.07,.5],[x,2.3,z],'#c9d9b0',green);}
 box('greenhouse.harvestCrate',[1.1,.4,.7],[2,.4,1.9],'#cf8a4d',green);box('greenhouse.heater',[.7,.8,.5],[-2, .7,-1.85],'#4b6470',green);box('greenhouse.heater.warning',[.12,.12,.08],[-2,.9,-1.57],'#ccb65e',green);
 const utility=nodes.get('utilities')!;
 for(const [i,name] of ['valve','filter','heater','battery','air'].entries()){const x=-2.2+i*1.1;box('utilities.device.'+name,[.75,.95,.7],[x,.7,-1.25],'#5d7276',utility);box('utilities.warning.'+name,[.18,.13,.08],[x,1.02,-.86],'#c7b75b',utility);box('utilities.gauge.'+name,[.1,.4,.06],[x+.16,.7,-.85],'#73bbb1',utility);}
 box('utilities.backup.module',[1,.8,.9],[-3.2,.6,1.2],'#d5c9ac',utility);cylinder('utilities.backup.tank',.45,1.3,[-3.2,.85,1.2],'#b0c4c2',utility);box('utilities.coupler',[1,.1,.1],[-.5,.5,1.2],'#d77f47',utility);box('utilities.testLight',[.2,.2,.2],[1,.8,1.2],'#a58c54',utility);box('utilities.auxiliaryLine',[5,.12,.15],[0,.25,2],'#779b9e',utility);box('utilities.inspectionBeacon',[.18,.35,.18],[2,.5,2],'#6ea194',utility);
 const solar=group('solar',LOCATIONS.solar);
 for(let i=0;i<6;i++){const panel=new T.Group();panel.position.set(-2.3+(i%3)*2.3,.9,-1.3+Math.floor(i/3)*2.6);panel.rotation.x=-.22;solar.add(panel);panel.name='solar.panel.'+i;nodes.set(panel.name,panel);box('solar.frame.'+i,[2.1,.1,2.1],[0,0,0],'#a7b3ae',panel);box('solar.cell.'+i,[1.96,.03,1.95],[0,.075,0],'#254a6f',panel);for(let k=0;k<3;k++)box('solar.grid.'+i+'.'+k,[.025,.01,1.95],[-.65+k*.65,.1,0],'#83a5bc',panel);box('solar.dust.'+i,[1.95,.02,1.95],[0,.12,0],'#ba8a5e',panel);box('solar.leg.'+i,[.16,.8,.18],[panel.position.x,.45,panel.position.z],'#5d6969',solar);}
 box('solar.productionConsole',[1.5,.8,.3],[2,.6,-3.2],'#344d59',solar);box('solar.productionIndicator',[1.15,.12,.04],[2,.8,-3.03],'#74c5a7',solar);
 const dep=group('departure',LOCATIONS.departure);cylinder('departure.pad',3,.12,[0,.03,0],'#737e7c',dep);cylinder('departure.vehicle',1.05,2.4,[0,1.45,0],'#c6c8bd',dep);cylinder('departure.roof',.7,.45,[0,2.85,0],'#dee0cf',dep);box('departure.airlock',[.8,1.3,.1],[0,1.2,1.07],'#354f60',dep);box('departure.payload',[1,.7,.8],[2,.55,1.8],'#d99355',dep);box('departure.accessLights',[3,.07,.17],[0,.15,3.2],'#78a7a0',dep);for(let i=0;i<3;i++)box('departure.step.'+i,[1,.12,.4],[0,.15+i*.12,2.3-i*.4],'#9aa39a',dep);
 const archive=group('archive',LOCATIONS.archive);const crater=new T.Mesh(new T.TorusGeometry(2,.4,6,24),material('#af7650'));crater.rotation.x=Math.PI/2;crater.position.y=.05;crater.name='archive.crater';archive.add(crater);nodes.set(crater.name,crater);cylinder('archive.floor',1.7,.08,[0,-.1,0],'#613f2d',archive);
 for(let i=0;i<35;i++)box('archive.seismogram.'+i,[.065,.05,.05],[-2.5+i*.15,1.1,3],'#70b7ac',archive);
 for(let i=0;i<4;i++){const g=group('crew.'+i,[-8+(i%2)*1.7,0,1+Math.floor(i/2)*1.8]);box('crew.'+i+'.torso',[.45,.6,.3],[0,.85,0],'#d7bfa3',g);const head=new T.Mesh(new T.SphereGeometry(.24,10,8),material('#d3d7c9'));head.position.y=1.4;g.add(head);box('crew.'+i+'.visor',[.32,.16,.12],[0,1.4,.18],'#294c63',g);box('crew.'+i+'.pack',[.4,.4,.2],[0,.95,-.22],'#e38b4c',g);for(let side of [-1,1]){box('crew.'+i+'.arm.'+side,[.13,.5,.15],[side*.33,.82,0],'#b7b6a3',g);box('crew.'+i+'.leg.'+side,[.17,.5,.2],[side*.13,.32,0],'#b7b6a3',g);}}
 const dust:T.Mesh[]=[];for(let i=0;i<55;i++){const m=box('environment.dust.'+i,[.18+(i%3)*.1,.025,.035],[0,0,0],'#dbb07d');m.visible=false;dust.push(m);}
 // Orange maintenance robot is a shared static landmark; environmental wind never drives it.
 const robot=group('maintenance.robot',[9,.2,7]);box('maintenance.robot.body',[.8,.4,.6],[0,.25,0],'#df8347',robot);box('maintenance.robot.sensor',[.2,.2,.2],[.2,.55,0],'#48616a',robot);
 addTechnicalNodes(root,nodes);
 return {root,nodes,sun,dust,dispose(){root.traverse(o=>{if(o instanceof T.Mesh){o.geometry.dispose();const ms=Array.isArray(o.material)?o.material:[o.material];ms.forEach(m=>m.dispose());}});materials.forEach(m=>m.dispose());}};
}
const smooth=(n:number)=>{const x=T.MathUtils.clamp(n,0,1);return x*x*(3-2*x);};
const mix=(a:number,b:number,p:number)=>T.MathUtils.lerp(a,b,smooth(p));
function paint(node:T.Object3D|undefined,color:string,intensity=0){if(node instanceof T.Mesh){const m=node.material as T.MeshStandardMaterial;m.color.set(color);m.emissive.set(color);m.emissiveIntensity=intensity;}}
export function animateModel(model:BaseModel,state:SceneState,snapshot:PlaybackSnapshot,time:number){
 const n=model.nodes,req=snapshot.request,active=snapshot.active&&req,p=active?snapshot.progress:1,before=snapshot.before??state;
 const is=(id:string)=>!!active&&req.id===id;const base=active?before:state;
 let shelter=base.shelterReady,light=base.greenhouseLight,dust=base.panelDust,meal=base.rations==='extra'?1:base.rations==='limited'?.3:.65;
 if(is('shelter_prepare'))shelter=mix(shelter,req!.variant==='full'?1:.45,p);
 if(is('greenhouse_lighting'))light=mix(light,req!.variant==='dim'?.3:req!.variant==='maintain'?1:light,p);
 if(is('crew_meal_rest'))meal=mix(meal,req!.variant==='extra'?1:.3,p);
 if(is('dust_storm'))dust=mix(dust,1,p*1.5);
 if(is('wind_cleaning'))dust=mix(dust,0,p);
 const closed={...base.closed},low={...base.lowActivity};if(is('section_shutdown')){closed[req!.location]=req!.variant==='close'&&p>.55;low[req!.location]=req!.variant==='low_activity'&&p>.55;}
 for(const area of ['shelter','habitat','greenhouse','utilities'] as const){
  const door=n.get(area+'.door')!;door.position.x=closed[area]?2.1:low[area]?2.65:3.1;if(is('section_shutdown')&&req!.location===area)door.position.x=mix(before.closed[area]?2.1:before.lowActivity[area]?2.65:3.1,req!.variant==='close'?2.1:2.65,p);
  paint(n.get(area+'.serviceLights'),closed[area]?'#3b4c4f':low[area]?'#6b8b81':'#a7ded5',closed[area]?.03:low[area]?.2:.8);paint(n.get(area+'.essentialAir'),'#6dcdb3',.35);
 }
 for(let i=0;i<3;i++){const w=n.get('shelter.water.'+i)!;w.position.y=.6+(1-smooth(Math.max(0,shelter*1.5-i*.15)))*1.6;paint(w,shelter>.4?'#a2c3bf':'#728e99');}
 paint(n.get('shelter.monitor'),base.radiationAlert||is('radiation_alert')?'#e97d49':shelter>.6?'#71d2b2':'#b4a25d',.3);
 n.get('shelter.radio')!.rotation.y=is('shelter_prepare')?(1-smooth(p))*1.3:0;
 for(let i=0;i<8;i++){paint(n.get('greenhouse.led.'+i),light>.5?'#d2e8bd':'#516456',light*1.6);n.get('greenhouse.led.'+i)!.scale.x=.8+light*.2;const fruit=n.get('greenhouse.produce.'+i)!;const original=new T.Vector3(-1.8+(i%4)*1.2,1.15,-.85+Math.floor(i/4)*1.7);const target=new T.Vector3(1.75+(i%3)*.17,.7,1.85+(i%2)*.15);let h=base.harvested?1:0;if(is('harvest_result'))h=smooth(T.MathUtils.clamp(p*1.7-i*.08,0,1));fruit.position.copy(original).lerp(target,h);fruit.visible=true;}
 for(let i=0;i<6;i++){const tile=n.get('solar.dust.'+i)!;tile.scale.x=Math.max(.001,dust);tile.position.x=0;tile.visible=dust>.005;}
 for(let i=0;i<4;i++){const m=n.get('habitat.meal.'+i)!;m.scale.setScalar(meal);m.position.y=1.04+(is('crew_meal_rest')?(1-smooth(p))*.7:0);}
 const connected=base.module.connected;let connect=connected?1:0;if(is('backup_module_connect'))connect=mix(connect,1,p*.95);
 const kind=is('backup_module_connect')?req!.variant:base.module.kind;for(const k of ['module','tank']){const obj=n.get('utilities.backup.'+k)!;obj.visible=k===kind;obj.position.x=mix(-3.2,0,connect);}
 n.get('utilities.coupler')!.scale.x=Math.max(.01,connect);paint(n.get('utilities.testLight'),base.module.status==='ready'||is('capacity_recovery')&&p>.85?'#70d6ae':connect>.7?'#e8b35b':'#5c706b',.4);
 const equipment:Equipment[]=['valve','filter','heater','battery','air'];
 for(const name of equipment){const failed=base.failures[name]||is('delayed_failure')&&req!.variant===name&&p>.45;const warn=is('delayed_failure')&&req!.variant===name&&p<.45;
 paint(n.get('utilities.warning.'+name),failed?'#f26648':warn?'#eec45d':'#82bca6',failed?.65:.1);const device=name==='filter'?'water':name==='heater'?'food':name==='battery'?'power':null;const recovering=is('capacity_recovery')&&device===req!.variant;n.get('utilities.gauge.'+name)!.scale.y=failed?.2:recovering?mix(.3,1,p):device&&base.capacities[device]?1:.5;
 const obj=n.get('utilities.device.'+name)!;obj.position.y=.7+(is('marsquake')&&!req!.reducedMotion?Math.sin(p*90+equipment.indexOf(name))*.025*Math.sin(p*Math.PI):0);
 }
 paint(n.get('greenhouse.heater.warning'),base.failures.heater||is('delayed_failure')&&req!.variant==='heater'&&p>.45?'#ef674b':'#c8b960',.3);
 const inspect=base.quakeInspection||is('marsquake')&&p>.55;paint(n.get('utilities.inspectionBeacon'),inspect?'#ef8452':'#6ba194',inspect?.7:0);
 const vehicle=n.get('departure.airlock')!;const depVariant=is('departure_prepare')?req!.variant:base.departure;const dp=is('departure_prepare')?smooth(p):1;vehicle.position.x=depVariant==='airlock'?dp*.65:0;n.get('departure.payload')!.position.x=depVariant==='unload'||depVariant==='unloaded'?mix(2,3.8,dp):2;paint(n.get('departure.accessLights'),depVariant==='external'?'#b8e6d0':'#657d7c',depVariant==='external'?dp:0);
 for(let i=0;i<4;i++){const crew=n.get('crew.'+i)!;const home=new T.Vector3(-8+(i%2)*1.7,0,1+Math.floor(i/2)*1.8);let goal=home.clone(),f=1;
 if(base.crewInShelter)goal.set(-8+(i%2)*1.5,0,-7+Math.floor(i/2)*1.2);
 if(is('radiation_alert')){goal.set(-8+(i%2)*1.5,0,-7+Math.floor(i/2)*1.2);f=smooth(p);}
 if(is('crew_meal_rest')||base.rations!=='normal'&&!base.crewInShelter&&!is('radiation_alert')){goal.set(-8+(i%2)*2,0,i<2?2.8:4.1);f=is('crew_meal_rest')?smooth(p):1;}
 if(is('departure_prepare')||base.departure!=='idle'){goal.set(-8+(i%2)*1.3,0,14+Math.floor(i/2)*.8);f=is('departure_prepare')?smooth(p):1;}
 const from=base.crewInShelter?new T.Vector3(-8+(i%2)*1.5,0,-7+Math.floor(i/2)*1.2):home;crew.position.copy(from).lerp(goal,f);
 for(const side of [-1,1]){const leg=n.get('crew.'+i+'.leg.'+side)!;leg.rotation.x=active&&!req!.reducedMotion&&p>.05&&p<.95&&(is('radiation_alert')||is('crew_meal_rest')||is('departure_prepare'))?Math.sin(time*7+i)*.24*side:0;}
 }
 let storm=0;if(is('dust_storm'))storm=p<.3?smooth(p/.3):p<.65?1:1-smooth((p-.65)/.35);model.sun.intensity=3*(1-storm*.85);n.get('solar.productionIndicator')!.scale.x=Math.max(.05,(1-dust*.75)*(1-storm*.8));
 for(let i=0;i<model.dust.length;i++){const m=model.dust[i],wind=is('wind_cleaning');m.visible=storm>.03||wind&&p<.98;if(!m.visible)continue;const center=LOCATIONS.solar;const motion=req?.reducedMotion?0:time;m.position.set(center[0]+((i*2.73+motion*7)%22)-11,.4+(i%9)*.38,center[2]+((i*3.13+motion*1.6)%12)-6);m.scale.x=wind?1.8:1+storm*2;}
 for(let i=0;i<35;i++){const m=n.get('archive.seismogram.'+i)!;const amp=is('impact_archive')?Math.sin((i-p*30)*2)*Math.exp(-Math.pow((i/35-.5)*4,2)):.05*Math.sin(i*3);m.position.y=1.1+amp*.55;}
 applyTechnicalState(n,base);
 for(const d of getAnimationDefinitions())if(d.render)d.render({nodes:n,state:base,before,request:req??null,progress:p,active:!!active&&req!.id===d.id,elapsed:time,reducedMotion:req?.reducedMotion??false});
 return {storm};
}
