import * as uz from "./uzumaki";
// 犬の持つ状態
class DogEntity {
  public stomach:number;
  public food:number;
  public state:'NORMAL'|'DEAD';
}

class ResolveArg{
  public some:string;
}
//犬単体で行う行動と持ち物を規定する。
class DogDispatcher implements uz.IDispatcher<DogEntity,ResolveArg>{
  private _dogEntity:DogEntity;
  constructor(){
    this._dogEntity = new DogEntity();
    this._dogEntity.stomach = 60;
    this._dogEntity.food = 0;
    this._dogEntity.state = 'NORMAL';
  }
  private eat(){
    if (this._dogEntity.food > 0){
      console.log("ガブガブ")
      this._dogEntity.stomach+=this._dogEntity.food;
      this._dogEntity.food = 0;
    }
  }
  private die(){
    console.log("キャイーン")
    this._dogEntity.state = "DEAD";
  }
  public setModel(environment: uz.Environment<DogEntity, ResolveArg>, model: DogEntity): void {
    if (this._dogEntity.state=='DEAD'){
      console.log("へんじがない。ただのしかばねのようだ。")
      return;
    }
    this._dogEntity = model;
    this.eat();
    if (this._dogEntity.stomach<0){
      this.die();
    }
  }  
  public getModel(): DogEntity {
    console.log("状態:",this._dogEntity)
    return this._dogEntity;
  }
}

//犬を取り巻く環境
class DogEnvironment extends uz.Environment<DogEntity,ResolveArg>{
  private consumeCalorie(amount:number):void{
    let model = this.dispatcher.getModel();
    model.stomach -= amount;
    this.dispatcher.setModel(this,model);
  }
  //１秒に１腹が減る
  public makingHungryExecutor():Promise<ResolveArg>{
    let self = this;
    return new Promise<ResolveArg>(
      (resolve,reject)=>{
        let hndl = setInterval(
          ()=>{
            self.consumeCalorie(1);
            if (self.dispatcher.getModel().state == "DEAD"){
              clearInterval(hndl);
              reject();
            }
          },1000
        )
      }
    )
  }
}

var dog = new DogEnvironment(new DogDispatcher(),'ポチ');
dog.registerProcess(dog.makingHungryExecutor.bind(dog),null,null,0);

