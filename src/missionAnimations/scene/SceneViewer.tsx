import {useEffect,useMemo,useRef,useState,Component,type ReactNode} from 'react';
import {Canvas,useFrame,useThree} from '@react-three/fiber';
import * as T from 'three';
import {AnimationController} from '../animation/controller';
import type {Location,SceneState} from '../animation/types';
import {createBaseModel,animateModel,LOCATIONS,type BaseModel} from './model';
import {SoftwareRenderer} from './SoftwareRenderer';
interface Props {controller:AnimationController;state:SceneState;location:Location;reducedMotion:boolean;modelFactory?:()=>BaseModel}
function canWebGL(){try{const canvas=document.createElement('canvas'),gl=canvas.getContext('webgl2');if(gl){gl.getExtension('WEBGL_lose_context')?.loseContext();return true;}}catch{}return false;}
function cameraStep(camera:T.Camera,model:BaseModel,props:Props,angle:number,zoom:number,time:number){
 const snap=props.controller.getSnapshot(),loc=snap.active?snap.request!.location:props.location,center=new T.Vector3(...LOCATIONS[loc]);
 const isSolar=loc==='solar';const mobile=innerWidth<700;const radius=(isSolar?12:9)*zoom;
 const dest=center.clone().add(new T.Vector3(Math.sin(.55+angle)*radius,mobile?10:8,Math.cos(.55+angle)*radius));
 let shake=0;if(snap.active&&snap.request?.id==='marsquake'&&!snap.request.reducedMotion)shake=Math.sin(snap.progress*110)*.055*Math.sin(snap.progress*Math.PI);
 dest.x+=shake;camera.position.lerp(dest,props.reducedMotion?1:.1);camera.lookAt(center.clone().add(new T.Vector3(0,.55,0)));return animateModel(model,props.state,snap,time);
}
function LiveScene({model,props,control}:{model:BaseModel;props:Props;control:React.RefObject<{angle:number;zoom:number}>}){
 const {camera,scene}=useThree();useEffect(()=>{scene.background=new T.Color('#7e6654');scene.fog=new T.FogExp2('#a27958',.015);return()=>{scene.fog=null;};},[scene]);
 useFrame(({clock})=>{const {storm}=cameraStep(camera,model,props,control.current.angle,control.current.zoom,clock.elapsedTime);if(scene.fog instanceof T.FogExp2)scene.fog.density=.015+storm*.07;});
 return <primitive object={model.root}/>;
}
class Boundary extends Component<{children:ReactNode;fallback:ReactNode},{failed:boolean}>{state={failed:false};static getDerivedStateFromError(){return {failed:true};}render(){return this.state.failed?this.props.fallback:this.props.children;}}
function SoftwareScene({props,control}:{props:Props;control:React.RefObject<{angle:number;zoom:number}>}){
 const ref=useRef<HTMLCanvasElement>(null),latest=useRef(props);latest.current=props;
 useEffect(()=>{const model=props.modelFactory?.()??createBaseModel(),camera=new T.PerspectiveCamera(43,1,.1,200);camera.position.set(12,15,20);const renderer=new SoftwareRenderer(ref.current!,model.root);let raf=0,last=0;
  const run=(t:number)=>{raf=requestAnimationFrame(run);if(t-last<40)return;last=t;const fx=cameraStep(camera,model,latest.current,control.current.angle,control.current.zoom,t/1000);renderer.render(model.root,camera,fx.storm);};raf=requestAnimationFrame(run);return()=>{cancelAnimationFrame(raf);model.dispose();};
 },[control,props.modelFactory]);return <canvas ref={ref} aria-label="Yazılımsal çizimle gerçek 3D sahne"/>;
}
export function SceneViewer(props:Props){
 const [gpu]=useState(canWebGL),control=useRef({angle:0,zoom:1}),drag=useRef<number|null>(null);const model=useMemo(()=>props.modelFactory?.()??createBaseModel(),[props.modelFactory]);useEffect(()=>()=>model.dispose(),[model]);
 const fallback=<SoftwareScene props={props} control={control}/>;
 return <div className="viewport" onPointerDown={e=>{drag.current=e.clientX;e.currentTarget.setPointerCapture(e.pointerId);}} onPointerMove={e=>{if(drag.current!==null){control.current.angle+=(e.clientX-drag.current)*.005;drag.current=e.clientX;}}} onPointerUp={()=>drag.current=null} onPointerCancel={()=>drag.current=null} onWheel={e=>{control.current.zoom=T.MathUtils.clamp(control.current.zoom+e.deltaY*.0006,.65,1.6);}}>
 {gpu?<Boundary fallback={fallback}><Canvas shadows camera={{fov:43,position:[12,15,20]}} dpr={[1,1.5]} gl={{antialias:true,powerPreference:'high-performance'}} fallback={fallback}><LiveScene model={model} props={props} control={control}/></Canvas></Boundary>:fallback}
 <div className="render-note">{gpu?'WEBGL / REACT THREE FIBER':'3D YAZILIMSAL ÇİZİM · WEBGL KULLANILAMIYOR'}</div>
 </div>;
}
