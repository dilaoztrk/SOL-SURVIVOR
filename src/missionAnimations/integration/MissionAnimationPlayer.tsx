import {useEffect,useMemo,useRef,useSyncExternalStore} from 'react';
import {createPortal} from 'react-dom';
import {CutsceneRunner} from './CutsceneRunner';
import {SceneViewer} from '../scene/SceneViewer';
import type {AnimationPlayerProps} from './types';
import './player.css';
/** Mount once beside your card UI. Set request after the host commits a decision. */
export function MissionAnimationPlayer(props:AnimationPlayerProps){
 const latest=useRef(props);latest.current=props;
 const scene=useRef(props.sceneState);scene.current=props.sceneState;
 const runner=useMemo(()=>new CutsceneRunner(()=>scene.current,s=>{scene.current=s;latest.current.onSceneStateChange(s);},r=>latest.current.onComplete(r)),[]);
 const seq=useSyncExternalStore(runner.subscribe,runner.getSnapshot),playback=useSyncExternalStore(runner.controller.subscribe,runner.controller.getSnapshot);
 useEffect(()=>{let raf=0;const loop=(time:number)=>{runner.tick(time);raf=requestAnimationFrame(loop);};raf=requestAnimationFrame(loop);return()=>cancelAnimationFrame(raf);},[runner]);
 useEffect(()=>{if(!props.request)return;const request={...props.request,steps:props.request.steps.map(s=>({...s,reducedMotion:s.reducedMotion??props.reducedMotion??false}))};const result=runner.submit(request);if(!result.accepted&&result.reason!=='duplicate')latest.current.onRejected?.(request.eventId,result.reason!,result.message);},[props.request,props.reducedMotion,runner]);
 const closeRef=useRef<HTMLButtonElement>(null);
 useEffect(()=>{if(!seq.active)return;const previous=document.activeElement as HTMLElement|null,overflow=document.body.style.overflow;document.body.style.overflow='hidden';closeRef.current?.focus();return()=>{document.body.style.overflow=overflow;previous?.focus();};},[seq.active]);
 if(!seq.active)return null;
 const location=playback.request?.location??props.request?.steps[seq.step]?.location??'habitat';
 return createPortal(<section className="sra-player" role="dialog" aria-modal="true" aria-label="Karar sonrası animasyon" onKeyDown={e=>{if(e.key==='Escape'){e.preventDefault();runner.skipAll();}if(e.key==='Tab'){e.preventDefault();closeRef.current?.focus();}}}>
 <SceneViewer controller={runner.controller} state={props.sceneState} location={location} reducedMotion={playback.request?.reducedMotion??props.reducedMotion??false} modelFactory={props.modelFactory}/>
 <header className="sra-heading"><div>SOL SURVIVOR <span>ARES–7 / KARAR UYGULANIYOR</span></div><span>{seq.step+1} / {seq.total}</span></header>
 <div className="sra-caption"><small>GÖREV ANİMASYONU</small><h2>{seq.title}</h2><p>Üsteki gelişmeler canlandırılıyor.</p><div className="sra-progress"><i style={{width:((seq.step+playback.progress)/seq.total)*100+'%'}}/></div><button ref={closeRef} onClick={runner.skipAll}>Animasyonu atla ↗</button><span className="sra-no-cost">Atlamak kaynak maliyetini tekrar uygulamaz.</span></div>
 </section>,document.body);
}
