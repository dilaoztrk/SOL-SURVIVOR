import {AnimationController} from '../animation/controller';
import {resolveRequest} from '../animation/registry';
import {copyState,type AnimationRequest,type AnimationResult,type SceneState} from '../animation/types';
import type {CutsceneRequest,CutsceneResult,RejectionReason} from './types';
export interface SequenceSnapshot {active:boolean;eventId:string|null;title:string;step:number;total:number;last:CutsceneResult|null}
/** One sequence at a time. Identical event IDs are not replayed or completed twice. */
export class CutsceneRunner {
 readonly controller:AnimationController;
 private snap:SequenceSnapshot={active:false,eventId:null,title:'',step:0,total:0,last:null};
 private listeners=new Set<()=>void>();private seen=new Set<string>();private steps:AnimationRequest[]=[];private results:AnimationResult[]=[];private finishImmediately=false;
 private readState:()=>SceneState;
 private completed:(result:CutsceneResult)=>void;
 constructor(readState:()=>SceneState,commit:(state:SceneState)=>void,completed:(result:CutsceneResult)=>void,now?:()=>number){
  this.readState=readState;this.completed=completed;
  this.controller=new AnimationController(readState,commit,{onComplete:r=>this.stepComplete(r)},now);
 }
 getSnapshot=()=>this.snap;
 subscribe=(fn:()=>void)=>{this.listeners.add(fn);return()=>{this.listeners.delete(fn);};};
 private emit(){for(const l of this.listeners)l();}
 submit=(request:CutsceneRequest):{accepted:boolean;reason?:RejectionReason;message?:string}=>{
  if(this.seen.has(request.eventId))return {accepted:false,reason:'duplicate'};
  if(this.snap.active)return {accepted:false,reason:'busy'};
  try{if(!request.eventId.trim()||!request.steps.length||request.steps.length>20)throw new Error('eventId ve 1–20 adım gerekli');request.steps.forEach(resolveRequest);}catch(e){return {accepted:false,reason:'invalid',message:String(e)};}
  this.steps=structuredClone(request.steps);this.results=[];this.finishImmediately=false;this.seen.add(request.eventId);
  this.snap={active:true,eventId:request.eventId,title:request.title??'Karar uygulanıyor',step:0,total:this.steps.length,last:this.snap.last};this.emit();this.controller.playAnimation(this.steps[0]);return {accepted:true};
 };
 tick=(time?:number)=>this.controller.tick(time);
 skipCurrent=()=>this.controller.skip();
 skipAll=()=>{if(!this.snap.active)return;this.finishImmediately=true;this.controller.skip();};
 private stepComplete(result:AnimationResult){
  if(!this.snap.active)return;this.results.push(result);
  if(this.results.length<this.steps.length){this.snap={...this.snap,step:this.results.length};this.emit();this.controller.playAnimation(this.steps[this.results.length]);if(this.finishImmediately)this.controller.skip();return;}
  const done:CutsceneResult={eventId:this.snap.eventId!,skipped:this.results.some(r=>r.skipped),completedSteps:this.results.length,results:this.results.slice(),finalState:copyState(this.readState())};
  this.snap={...this.snap,active:false,last:done};this.emit();this.completed(done);
 }
}
