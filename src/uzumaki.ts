const NUM_PROCESS:number=10;
// There are rules for generics specifier in this project
// P is Promise resolve type
// D is data type that DataEmitter generate/DataReciever accept.
// T is model(the only entity) in this system
// このプロジェクトでは、ジェネリクスにつかう型についてルールを使います。
// P が Promise が resolve されるときの引数となるものです。
// D は このシステムでいうデータエミッタとデータレシーバが処理の対象とするタイプ
// T は このシステムのモデル（ひとつのエンティティ）の型です。
// reject function type for Promise that returned by Process
// reject 関数型
export type TRejectFunc = (arg:any)=>void;
// resolve function type for Promise that returned by Process
// resolve 関数型
export type TResolveFunc<P> = (resolveInfo:P) => void;
// DataReciever function type in Process
// データレシーバ関数型
export type TDataRecieverFunc<D,T> = (data:D,oldModel:T)=>T;
// DataEmitter function type in Process
// データエミッタ関数型
export type TDataEmitterFunc<D,P> = (f:(data:D)=>boolean )=>Promise<P>;
// Class that represent what the process made of
// プロセスの作成素材をひとまとまりにした型
export class ProcessSource<D,T,P>{
    public emitterFunc:TDataEmitterFunc<D,P>;
    public recieverFunc:TDataRecieverFunc<D,T>;
    public resolveFunc:TResolveFunc<P>;
    public rejectFunc:TRejectFunc;
}
export interface IDispatcher<T,P>{
    setModel(kernel:Kernel<T,P>,model:T):void;
    getModel():T;
}
export class Kernel<T,P> {
    private _dispatcher:IDispatcher<T,P>;
    public taskId: string;
    private _processSlot: Promise<P>[];
    constructor(
        dispatcher:IDispatcher<T,P>,
        taskId:string
    ){ 
        this._dispatcher = dispatcher;
        this.taskId = taskId
        for (let i = 0; i < NUM_PROCESS; i++){
            //push resolved promises
            //プロセススロットにすでに解決されているプロミスを詰め込み
            this._processSlot.push(Promise.resolve(null));
        }
    }
    public registerProcess<D>(
        processSource:ProcessSource<D,T,P>
    ){
        let self=this;
        let promise:Promise<P>;
        let wrappedRecieverFunc:(data:D)=>boolean=function(data:D):boolean{
            let mdl = processSource.recieverFunc(data,self._dispatcher.getModel());
            if (mdl !== null){
                self._dispatcher.setModel(this,mdl)
                return true;
            }else{
                return false;
            }
        }
        promise = processSource.emitterFunc.bind(processSource.emitterFunc,wrappedRecieverFunc);
        promise.then(processSource.resolveFunc);
        promise.catch(processSource.rejectFunc);
    }
}