import {copyState,type SceneState} from '../animation/types';
export interface TechnicalState {
 systemChecked?:boolean;systemQuick?:boolean;alarmTested?:boolean;valveReplaced?:boolean;temporaryTarget?:string;
 filterReplaced?:boolean;waterServiced?:boolean;airServiced?:boolean;heaterServiced?:boolean;
 exteriorInspected?:boolean;robotCleaned?:boolean;crewCleaned?:boolean;batteryIsolated?:boolean;
 powerRoute?:string;deferredTarget?:string;continued?:string;
}
export const readTechnical=(s:SceneState):TechnicalState=>(s.extensions.technical??{}) as TechnicalState;
export function patchTechnical(s:SceneState,patch:TechnicalState,extra?:(next:SceneState)=>void){const next=copyState(s);next.extensions.technical={...readTechnical(next),...patch};extra?.(next);return next;}
