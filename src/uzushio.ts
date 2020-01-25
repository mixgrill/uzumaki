export type TOnReject = (arg:any)=>void;
export type TOnResolve<P> = (resolveInfo:P) => void;
export type TDataRecieverFunc<D,T> = (data:D,oldModel:T)=>T;
export type TDataEmitterFunc<D,P> = (f:(data:D)=>boolean )=>Promise<P>;
export interface IDispatcher<T>{
    model:T;
}
export class Kernel<T> {
    private _dispatcher:IDispatcher<T>;
    public hasher:any;
    public crossroads:any;
    constructor(
        dispatcher:IDispatcher<T>
    ){ 
        this._dispatcher = dispatcher;
        
    }
    public registerProcess<D,P>(
        emitterFunc:TDataEmitterFunc<D,P>,
        recieverFunc:TDataRecieverFunc<D,T>,
        onResolveFunc:TOnResolve<P>,
        onRejectFunc:TOnReject
    ){
        let self=this;
        let promise:Promise<P>;
        let wrappedRecieverFunc:(data:D)=>boolean=function(data:D):boolean{
            let mdl = recieverFunc(data,self._dispatcher.model);
            if (mdl !== null){
                self._dispatcher.model = mdl;
                return true;
            }else{
                return false;
            }
        }
        promise = emitterFunc.bind(emitterFunc,wrappedRecieverFunc);
        promise.then(onResolveFunc);
        promise.catch(onRejectFunc);
    }
}