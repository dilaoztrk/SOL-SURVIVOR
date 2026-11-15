import * as T from 'three';
import type {AnimationRenderContext,SceneState,Equipment} from '../animation/types';
import {readTechnical} from './state';
const clamp=(x:number)=>T.MathUtils.clamp(x,0,1);const ease=(x:number)=>{const p=clamp(x);return p*p*(3-2*p);};
function paint(o:T.Object3D|undefined,c:string,glow=.2){if(o instanceof T.Mesh){const m=o.material as T.MeshStandardMaterial;m.color.set(c);m.emissive.set(c);m.emissiveIntensity=glow;}}
function equipmentPosition(target:string){const names=['valve','filter','heater','battery','air'];return [-2.2+Math.max(0,names.indexOf(target))*1.1,.8,-.7] as const;}
/** Shared baseline applied after the existing14 animation views, before technical active motion. */
export function applyTechnicalState(nodes:Map<string,T.Object3D>,state:SceneState){
 const t=readTechnical(state);
 for(const [name,o] of nodes)if(name.startsWith('tech.')){const b=o.userData.technicalBase;if(b){o.position.copy(b.position);o.rotation.copy(b.rotation);o.scale.copy(b.scale);}o.visible=false;}
 const show=(name:string)=>{const o=nodes.get('tech.'+name);if(o)o.visible=true;return o;};
 for(const name of ['console','screen','valveWheel','heaterCover','heaterElement','exterior.connection','exterior.warning','batterySwitch','alarmPanel','robotBrush','robotMast'])show(name);
 for(let i=0;i<4;i++){show('robotWheel.'+i);paint(show('check.'+i),t.systemChecked||t.systemQuick&&i<2?'#83d5b6':'#bd9f61');paint(show('route.'+i),t.powerRoute==='greenhouse'&&i>1||t.powerRoute==='critical'&&i<2||t.powerRoute==='balanced'?'#88dbbe':'#536f7d');}
 for(let i=0;i<5;i++){paint(show('alarm.'+i),t.alarmTested?'#82d3b7':'#aa9568');show('alarmCable.'+i);}
 paint(nodes.get('tech.alarmPanel'),t.alarmTested?'#82d3b7':'#8d8259');
 nodes.get('utilities.device.battery')!.position.set(1.1,.7,-1.25);
 const statuses:Record<string,boolean|undefined>={valve:t.valveReplaced,filter:t.filterReplaced||t.waterServiced,heater:t.heaterServiced,battery:t.batteryIsolated,air:t.airServiced};
 for(const target of ['valve','filter','heater','battery','air']){
  show('cover.'+target);show('old.'+target);const fixed=!!statuses[target];
  if(fixed&&!state.failures[target as Equipment])paint(nodes.get('utilities.warning.'+target),'#7dd7b4',.4);
  if(t.temporaryTarget===target&&!state.failures[target as Equipment])paint(nodes.get('utilities.warning.'+target),'#e7b15e',.4);
  if(t.deferredTarget===target&&!state.failures[target as Equipment])paint(nodes.get('utilities.warning.'+target),'#edb45b',.5);
 }
 if(t.filterReplaced&&!t.waterServiced&&!state.capacities.water&&!state.failures.filter)paint(nodes.get('utilities.warning.filter'),'#e6b36a',.4);
 if(t.deferredTarget){const badge=show('pendingBadge')!;if(t.deferredTarget==='panels')badge.position.set(12,2,4);else if(t.deferredTarget==='heater')badge.position.set(2,1.5,-8.4);else{const e=equipmentPosition(t.deferredTarget);badge.position.set(4+e[0],e[1]+.6,3+e[2]);}}
 if(t.valveReplaced){nodes.get('tech.old.valve')!.visible=false;show('new.valve')!.position.set(-2.2,.7,-.65);}
 if(t.filterReplaced){nodes.get('tech.old.filter')!.visible=false;show('new.filter')!.position.set(-1.1,.7,-.65);}
 if(t.heaterServiced&&!state.failures.heater)paint(nodes.get('greenhouse.heater.warning'),'#7dd7b4',.4);
 if(t.exteriorInspected)paint(nodes.get('tech.exterior.warning'),'#7dd7b4',.4);
 if(t.batteryIsolated){nodes.get('utilities.device.battery')!.position.set(1.1,.7,.4);show('batterySpare')!.position.set(1.1,.7,-1.25);nodes.get('tech.cover.battery')!.position.z=.85;nodes.get('tech.old.battery')!.visible=false;}
 if(t.temporaryTarget==='valve')show('patch.valve')!.position.set(-2.2,.75,-.55);
 if(t.temporaryTarget==='quake')show('quakeClamp')!.position.set(2,.25,2);
 const robot=nodes.get('maintenance.robot')!;robot.position.set(9,.2,7);robot.rotation.set(0,0,0);
 for(let i=0;i<4;i++)for(const side of [-1,1])nodes.get(`crew.${i}.arm.${side}`)!.rotation.x=0;
}
export function renderTechnical(c:AnimationRenderContext){
 if(!c.active||!c.request)return;
 const {nodes:n,request:r,progress:p,elapsed:time,before,reducedMotion}=c;const q=ease(p),wave=reducedMotion?0:Math.sin(time*9)*Math.sin(p*Math.PI);
 const show=(name:string)=>{const obj=n.get('tech.'+name)!;obj.visible=true;return obj;};
 const light=(target:string,ready:boolean)=>paint(n.get('utilities.warning.'+target),ready?'#7dd7b4':'#e4af62',.4);
 switch(r.id){
 case 'system_check':{
  const scan=show('scan');scan.position.x=-.45+q*1.5;
  for(let i=0;i<4;i++){paint(n.get('tech.check.'+i),p>(i+1)/5&&(r.variant!=='quick'||i<2)?'#7dd7b4':'#ddb05d',.6);}
  break;
 }
 case 'alarm_test':{
  for(let i=0;i<5;i++)paint(n.get('tech.alarm.'+i),p>(i+1)/6?'#7dd7b4':'#d8a35e',.7);
  show('scan').position.x=-.45+q*1.5;paint(n.get('tech.alarmPanel'),p>.8?'#7dd7b4':'#e4b96e',.6);break;
 }
 case 'valve_replace':{
  const cover=show('cover.valve');cover.position.z=-.8+Math.sin(p*Math.PI)*.65;
  const old=show('old.valve');old.visible=p<.65;old.position.z=-.65+ease(p/.45)*1.8;old.position.y=.7-ease(p/.45)*.3;
  const fresh=show('new.valve');fresh.visible=p>.25;fresh.position.z=1.25-ease((p-.3)/.5)*1.9;
  n.get('tech.valveWheel')!.rotation.z=q*Math.PI*.5;light('valve',p>.88);break;
 }
 case 'temporary_repair':{
  if(r.variant==='quake'){const clamp=show('quakeClamp');clamp.position.z=1.1+q*.9;clamp.position.y=.45-q*.2;paint(n.get('utilities.inspectionBeacon'),p>.85?'#7dd7b4':'#f0a55e',.5);}
  else{const patch=show('patch.valve');patch.position.z=1.7-q*2.25;patch.position.y=.4+q*.35;show('tool.valve').position.z=1.5-Math.sin(p*Math.PI)*1.9;light('valve',r.variant==='permanent'&&p>.9);}
  break;
 }
 case 'filter_replace':{
  show('cover.filter').position.z=-.8+Math.sin(p*Math.PI)*.7;const old=show('old.filter');old.position.z=-.65+ease(p/.5)*2;old.visible=p<.7;const fresh=show('new.filter');fresh.position.z=1.25-ease((p-.3)/.55)*1.9;fresh.visible=p>.2;light('filter',false);break;
 }
 case 'filter_service':{
  const target=r.variant==='air'?'air':'filter';show('cover.'+target).position.z=-.8+Math.sin(p*Math.PI)*.6;show('old.'+target).rotation.y=q*Math.PI*2;const tool=show('tool.'+target);tool.position.z=1.5-Math.sin(p*Math.PI)*2;tool.rotation.z=wave*.3;light(target,p>.9);break;
 }
 case 'heater_service':{
  show('heaterCover').position.x=-2-Math.sin(p*Math.PI)*.8;const tool=show('heaterTool');tool.position.z=.8-Math.sin(p*Math.PI)*2.2;tool.rotation.z=wave*.25;paint(n.get('tech.heaterElement'),p>.85?'#e2ae65':'#5d6872',p>.85?.4:0);paint(n.get('greenhouse.heater.warning'),p>.9?'#7dd7b4':'#dca666',.5);break;
 }
 case 'external_inspection':{
  const probe=show('exterior.probe');probe.position.set(7.4+Math.sin(q*Math.PI*2)*.6,1+Math.cos(q*Math.PI*2)*.25,2.3);paint(n.get('tech.exterior.warning'),p>.85?'#7dd7b4':'#e8b369',.6);
  const crew=n.get('crew.0')!;crew.position.set(7.9,.1,2.8);n.get('crew.0.arm.-1')!.rotation.x=-.65+wave*.15;break;
 }
 case 'robot_panel_clean':case 'crew_panel_clean':{
  const phase=clamp((p-.1)/.8),raw=Math.min(5.999,phase*6),index=Math.floor(raw),part=raw-index,robot=n.get('maintenance.robot')!;
  const panel=n.get('solar.panel.'+index)!;panel.updateWorldMatrix(true,false);const pos=panel.getWorldPosition(new T.Vector3());pos.x+=-1+part*2;pos.y+=.3;
  for(let i=0;i<6;i++){const tile=n.get('solar.dust.'+i)!;const remaining=i<index?0:i===index?1-part:1;tile.scale.x=Math.max(.001,before.panelDust*remaining);tile.position.x=i===index?part*before.panelDust*.975:0;tile.visible=before.panelDust*remaining>.005;}
  const fadeIn=ease(p/.1),fadeOut=ease((p-.9)/.1);
  if(r.id==='robot_panel_clean'){
   const dock=new T.Vector3(9,.2,7);robot.position.copy(dock).lerp(pos,fadeIn).lerp(dock,fadeOut);robot.rotation.x=-.22*Math.sin(p*Math.PI);n.get('tech.robotBrush')!.rotation.z=wave*.05;
  }else{
   const crew=n.get('crew.0')!,home=new T.Vector3(-8,0,1),work=pos.clone().add(new T.Vector3(.5,-1.1,.8));crew.position.copy(home).lerp(work,fadeIn).lerp(home,fadeOut);n.get('crew.0.arm.-1')!.rotation.x=-.9*Math.sin(p*Math.PI);const brush=show('crewBrush');brush.position.copy(pos).add(new T.Vector3(-.3,.05,0));brush.rotation.z=wave*.08;brush.visible=p>.08&&p<.95;
  }
  n.get('solar.productionIndicator')!.scale.x=.25+phase*.75;break;
 }
 case 'battery_isolate':{
  const module=n.get('utilities.device.battery')!;module.position.z=-1.25+ease(p/.45)*1.65;const spare=show('batterySpare');spare.position.z=1.3-ease((p-.35)/.55)*2.55;show('cover.battery').position.z=-.8+q*1.65;show('old.battery').visible=false;show('batterySwitch').rotation.z=q*Math.PI*.5;light('battery',p>.9);break;
 }
 case 'power_reroute':{
  for(let i=0;i<4;i++){paint(n.get('tech.route.'+i),p>(i+1)/5?'#91dcc0':'#c1a463',.6);n.get('tech.route.'+i)!.scale.x=.2+q*.8;}
  show('scan').position.x=-.45+q*1.5;break;
 }
 case 'maintenance_deferred':{
  const badge=show('pendingBadge');if(r.location==='solar')badge.position.set(12,2,4);else if(r.location==='greenhouse')badge.position.set(2,1.5,-8.4);else{const e=equipmentPosition(r.variant);badge.position.set(4+e[0],e[1]+.6,3+e[2]);}badge.scale.setScalar(.7+q*.3);if(r.variant!=='panels')light(r.variant,false);break;
 }
 case 'continue_operation':{
  const pulse=show('operationPulse');const centers:{[k:string]:number[]}={utilities:[4,1.5,3],solar:[12,1.5,4],greenhouse:[4,1.5,-7],habitat:[-7,1.5,2],shelter:[-7,1.5,-7]};pulse.position.set(...(centers[r.location]??centers.utilities) as [number,number,number]);pulse.position.x+=Math.sin(q*Math.PI*2)*1.1;pulse.scale.setScalar(r.variant==='limited'?.6:1);break;
 }
 }
}
