import * as uz from "./uzushio";
function hello(name: string): string {
    return `Hello, ${name}!`;
  }
  
console.log(hello("World"));
let kernel = new uz.Kernel(null);
