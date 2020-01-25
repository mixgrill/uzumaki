import * as uz from "./uzumaki";
function hello(name: string): string {
    return `Hello, ${name}!`;
  }
  
console.log(hello("World"));
var p = Promise.resolve(null);
setTimeout(function(){p.then(function(){console.log("yeah")})},1000);