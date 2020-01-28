//process number in a task
//タスクあたりのプロセス数
const NUM_PROCESS:number=10;

const BUSY_SLOT:number = -1;
// There are rules for generics specifier in this project.
// P is Promise resolve type.
// D is data type that DataEmitter generate/DataReciever accept.
// T is model(the only entity) in this system.
// このプロジェクトでは、ジェネリクスにつかう型についてルールを使います。
// P が Promise が resolve されるときの引数となるものです。
// D は このシステムでいうデータエミッタとデータレシーバが処理の対象とするタイプ
// T は このシステムのモデル（ひとつのエンティティ）の型です。

// reject function type for Promise that returned by Process
// reject 関数型
export type TRejectFunc = (err:any)=>void;

// resolve function type for Promise that returned by Process
// resolve 関数型
export type TResolveFunc<P> = (resolveInfo:P) => void;

// executor
// エグゼキュータ関数型
export type TExecutorFunc<P> = ()=>Promise<P>;

// Class that represent what the process made of
// Each Func should not have dependency to this.
// プロセスの作成素材をひとまとまりにした型
// それぞれの関数は、thisに依存しないように注意すること
export class ProcessSource<T,D,P>{
    public execFunc:TExecutorFunc<P>;
    public resolveFunc:TResolveFunc<P>;
    public rejectFunc:TRejectFunc;
}
export type TProcessState = 'RUNNING'|'REJECTED'|'RESOLVED'|'EMPTY'|'NOPROCESS';

// Dispatcher interface
// The dispatcher in this system has an instance of the model and, if requested by others, the model (or copy)
// is returned.
// Also accept changes in the model. (setModel)
// This method has a Environment as an argument because it calls Environment's registerProcess () when set.
//Dispatcher のインターフェイス
//このシステムでのディスパッチャは、モデルのインスタンすを持ち、他から要求があれば、そのモデル（またはコピー）
//をリターンする。
//また、モデルの変更も受け付ける。(setModel)
//このメソッドが引数にカーネルを持つのは、セットされたときにカーネルのregisterProcess()を呼ぶため。
export interface IDispatcher<T,P>{
    setModel(environment:Environment<T,P>,model:T):void;
    getModel():T;
}

//このシステムでのEnvironmentクラスはディスパッチャや、外部からの要求をプロセスにて受け付け、
//プロセスが新しいモデルを生成することにより、ディスパッチャに更新を促す役割を担当する。
//カーネルはモデル本体を持たない。
//カーネルはプロセスの管理係として機能する。
export class Environment<T,P> {
    //dispatcher
    protected dispatcher:IDispatcher<T,P>;
    //process slot
    protected processSlot: Promise<void|P>[];
    //process state
    protected processState: TProcessState[];
    //process queue
    protected processQueue: ProcessSource<T,any,P>[][];
    // In this system, the environment consisting of one Environment and Dispatcher is called Task.
    // Set taskId to be unique in the whole system for each tasks.
    //このシステムではひとつのEnvironmentとDispatcherからなる環境をTaskと呼ぶ。
    //taskId は全体のシステムで一意になるように設定する。
    public taskId: string;
    
    //dispatcher and taskId are injected by constructor;
    constructor(
        dispatcher:IDispatcher<T,P>,
        taskId:string
    ){ 
        this.dispatcher = dispatcher;
        this.taskId = taskId
        this.processSlot = [];
        this.processState = [];
        this.processQueue = [];
        for (let i = 0; i < NUM_PROCESS; i++){
            //push null to process slot
            //プロセススロットに null 詰め込み
            this.processSlot.push(null);
            // All slots are empty
            //すべてのスロットは空
            this.processState.push('EMPTY');

            this.processQueue.push([]);
        }
    }

    //default resolve behaviour
    protected processResolve(resolveInfo:P,slotNumber:number):void{
        this.processState[slotNumber] = 'RESOLVED';
    }

    //default reject behaviour
    protected processReject(arg:any,slotNumber:number):void{
        this.processState[slotNumber] = 'REJECTED';
    }

    //default reject behaviour
    protected processFinally(slotNumber:number):void{
        this.processSlot[slotNumber] = null;
        this.processState[slotNumber] = 'EMPTY';
        if (this.processQueue[slotNumber].length>0){
            //this.registerProcess(this.processQueue[slotNumber].shift(),slotNumber);
        }
    }

    // public enqueueProcess(
    //     processSource:ProcessSource<T,D,P>,
    //     slotNumber:number
    // ):number{
    //     if (slotNumber >= NUM_PROCESS || slotNumber < 0){
    //         return BUSY_SLOT;
    //     }
    //     let self=this;

    //     if (self.processState[slotNumber] === "EMPTY"){
    //         return self.registerProcess(processSource,slotNumber);
    //     }

    //     if (self.processState[slotNumber] === 'RUNNING'
    //        ||self.processState[slotNumber] === 'REJECTED'
    //        ||self.processState[slotNumber] === 'RESOLVED'){
    //         this.processQueue[slotNumber].push(processSource);
    //     }
    //     return slotNumber;
    // }

    public registerProcess(
        execFunc:TExecutorFunc<P>,
        resolveFunc:TResolveFunc<P>,
        rejectFunc:TRejectFunc,
        slotNumber?:number
    ):number{
        let self=this;

        let sn:number;
        //determine where slot number to use.
        //スロット番号の解決
        if (slotNumber == undefined){
            sn_ok:do {
                for (let i = 0; i < NUM_PROCESS; i++){
                    if (self.processState[i]==="EMPTY"){
                        sn = i;
                        break sn_ok;
                    }
                }
                return BUSY_SLOT;
            } while(false);
        }if (slotNumber >= NUM_PROCESS || slotNumber < 0){
            return BUSY_SLOT;
        }else{
            if (self.processState[slotNumber]!=="EMPTY"){
                return BUSY_SLOT;
            } 
        }
        let newpromise:Promise<void|P> = null;
        newpromise = execFunc();
        if (resolveFunc !== null){
            newpromise = newpromise.then(resolveFunc);
        }
        newpromise = newpromise.then((resolveInfo:P)=>{
            self.processResolve(resolveInfo,slotNumber);
        });

        if (rejectFunc !== null){
            newpromise = newpromise.catch(rejectFunc);
        }
        newpromise = newpromise.catch((arg:any)=>{
            self.processReject(arg,slotNumber);
        });
        newpromise = newpromise.finally(()=>{
            self.processFinally(slotNumber);
        });
        
        self.processSlot[slotNumber] = newpromise;
        
        self.processState[slotNumber] = 'RUNNING';
        
        return slotNumber;
    }
}