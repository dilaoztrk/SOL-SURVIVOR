import type {AnimationRequest} from '../animation/types';
export type Resources={energy:number;food:number;lifeSupport:number;shield:number};
export interface CardChoice {id:string;label:string;effects:Resources;animations:AnimationRequest[];delayedNote?:string}
export interface DemoCard {id:string;sol:number;title:string;description:string;choices:CardChoice[]}
export interface DecisionLedger {resources:Resources;appliedIds:string[]}
/** DEMO HOST ONLY. The animation package does not import or modify resources. */
export function commitChoice(ledger:DecisionLedger,eventId:string,effects:Resources):{accepted:boolean;ledger:DecisionLedger}{
 if(ledger.appliedIds.includes(eventId))return {accepted:false,ledger};
 const r={...ledger.resources};for(const k of Object.keys(r) as (keyof Resources)[]){if(!Number.isFinite(effects[k]))throw new Error('Geçersiz kaynak etkisi');r[k]=Math.min(100,Math.max(0,r[k]+effects[k]));}
 return {accepted:true,ledger:{resources:r,appliedIds:[...ledger.appliedIds,eventId]}};
}
