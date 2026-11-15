export const animationIds = ['shelter_prepare','section_shutdown','greenhouse_lighting','crew_meal_rest','backup_module_connect','departure_prepare','dust_storm','radiation_alert','wind_cleaning','impact_archive','marsquake','harvest_result','capacity_recovery','delayed_failure'] as const;
export type AnimationId = typeof animationIds[number] | (string & {});
export type Location = 'shelter'|'habitat'|'greenhouse'|'utilities'|'solar'|'departure'|'archive';
export type Device = 'water'|'food'|'power';
export type Equipment = 'valve'|'filter'|'heater'|'battery'|'air';
export interface SceneState {
 extensions:Record<string,unknown>; shelterReady:number; closed:Record<Location,boolean>; lowActivity:Record<Location,boolean>; greenhouseLight:number; rations:'normal'|'extra'|'limited';
 module:{kind:'module'|'tank';connected:boolean;status:'offline'|'testing'|'ready'};
 departure:'idle'|'external'|'airlock'|'unloaded'; panelDust:number; radiationAlert:boolean; crewInShelter:boolean;
 quakeInspection:boolean; harvested:boolean; capacities:Record<Device,boolean>; failures:Record<Equipment,boolean>;
}
export interface AnimationRequest {id:AnimationId;location?:Location;variant?:string;duration?:number;reducedMotion?:boolean}
export interface ResolvedRequest {id:AnimationId;location:Location;variant:string;duration:number;reducedMotion:boolean}
export interface AnimationResult {request:ResolvedRequest;skipped:boolean;finalState:SceneState}
export interface AnimationCallbacks {onStart?:(request:ResolvedRequest)=>void;onComplete?:(result:AnimationResult)=>void;onError?:(error:unknown)=>void}
export interface Definition {id:AnimationId;title:string;category:'Üs işlemleri'|'Çevresel olaylar'|'Gecikmeli sonuçlar';description:string;location:Location;locations:Location[];variants:readonly string[];duration:number;objects:string[];result:string;cards:string;final:(s:SceneState,r:ResolvedRequest)=>SceneState; render?:(context:AnimationRenderContext)=>void}
export interface PlaybackSnapshot {active:boolean;request:ResolvedRequest|null;progress:number;before:SceneState|null;last:AnimationResult|null}
export const createInitialSceneState=():SceneState=>({extensions:{},shelterReady:0,closed:{shelter:false,habitat:false,greenhouse:false,utilities:false,solar:false,departure:false,archive:false},lowActivity:{shelter:false,habitat:false,greenhouse:false,utilities:false,solar:false,departure:false,archive:false},greenhouseLight:1,rations:'normal',module:{kind:'module',connected:false,status:'offline'},departure:'idle',panelDust:.85,radiationAlert:false,crewInShelter:false,quakeInspection:false,harvested:false,capacities:{water:false,food:false,power:false},failures:{valve:false,filter:false,heater:false,battery:false,air:false}});
export const copyState=(s:SceneState):SceneState=>structuredClone(s);
export interface ScienceRecord {mission:string;eventDate:string;title:string;observation:string;adaptation:string;sourceUrl:string}

export interface AnimationRenderContext {
 nodes:Map<string,import('three').Object3D>;state:SceneState;before:SceneState;request:ResolvedRequest|null;progress:number;active:boolean;elapsed:number;reducedMotion:boolean;
}
