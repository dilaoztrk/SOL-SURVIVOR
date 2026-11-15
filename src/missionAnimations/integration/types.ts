import type {AnimationRequest,AnimationResult,SceneState} from '../animation/types';
export interface CutsceneRequest {eventId:string;title?:string;steps:AnimationRequest[]}
export interface CutsceneResult {eventId:string;skipped:boolean;completedSteps:number;results:AnimationResult[];finalState:SceneState}
export type RejectionReason='busy'|'duplicate'|'invalid';
export interface AnimationPlayerProps {
 request:CutsceneRequest|null;
 sceneState:SceneState;
 onSceneStateChange:(state:SceneState)=>void;
 onComplete:(result:CutsceneResult)=>void;
 onRejected?:(eventId:string,reason:RejectionReason,message?:string)=>void;
 reducedMotion?:boolean;
 modelFactory?:()=>import('../scene/model').BaseModel;
}
