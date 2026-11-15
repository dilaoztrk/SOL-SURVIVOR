import {animationRegistry,resolveRequest} from './registry';
import {copyState,type AnimationRequest,type AnimationCallbacks,type PlaybackSnapshot,type SceneState} from './types';
/** Headless controller: no RAF, sol scheduling, resource scores, or renderer dependencies. */
export class AnimationController {
 private snapshot:PlaybackSnapshot={active:false,request:null,progress:0,before:null,last:null};
 private start=0;private listeners=new Set<()=>void>();
 private readState:()=>SceneState;
 private commitState:(s:SceneState)=>void;
 private callbacks:AnimationCallbacks;
 private now:()=>number;
 constructor(readState:()=>SceneState,commitState:(s:SceneState)=>void,callbacks:AnimationCallbacks={},now=()=>performance.now()){this.readState=readState;this.commitState=commitState;this.callbacks=callbacks;this.now=now;}
 getSnapshot=()=>this.snapshot;
 subscribe=(listener:()=>void)=>{this.listeners.add(listener);return()=>{this.listeners.delete(listener);};};
 private emit(){for(const l of this.listeners)l();}
 playAnimation=(raw:AnimationRequest):{accepted:boolean;reason?:'busy'}=>{
  if(this.snapshot.active)return {accepted:false,reason:'busy'};
  const request=resolveRequest(raw);this.start=this.now();this.snapshot={active:true,request,progress:0,before:copyState(this.readState()),last:this.snapshot.last};
  this.emit();this.call(()=>this.callbacks.onStart?.(request));return {accepted:true};
 };
 tick=(time=this.now())=>{if(!this.snapshot.active||!this.snapshot.request)return;
  const p=Math.min(1,Math.max(0,(time-this.start)/(this.snapshot.request.duration*1000)));
  if(p>=1){this.finish(false);return;}this.snapshot={...this.snapshot,progress:p};this.emit();
 };
 skip=()=>{if(this.snapshot.active)this.finish(true);};
 private finish(skipped:boolean){
  const current=this.snapshot;if(!current.active||!current.request)return;
  const finalState=animationRegistry[current.request.id].final(this.readState(),current.request);
  // Mark inactive before emitting/callbacks; tick or skip cannot complete this run twice.
  const last={request:current.request,skipped,finalState:copyState(finalState)};
  this.snapshot={...current,active:false,progress:1,last};this.commitState(finalState);this.emit();this.call(()=>this.callbacks.onComplete?.(last));
 }
 private call(fn:()=>void){try{fn();}catch(error){this.callbacks.onError?.(error);}}
 resetPlayback=()=>{if(this.snapshot.active)return false;this.snapshot={active:false,request:null,progress:0,before:null,last:null};this.emit();return true;};
 dispose=()=>{this.listeners.clear();};
}
