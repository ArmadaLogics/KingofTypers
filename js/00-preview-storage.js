
if(['#lancer-demo','#blightmother-demo','#turtle-wall-demo','#turtle-ball-demo'].includes(location.hash)){
 const reaperMemory=new Map();const disk=window.localStorage;
 const memory={getItem:key=>reaperMemory.get(String(key))??null,setItem:(key,value)=>reaperMemory.set(String(key),String(value)),removeItem:key=>reaperMemory.delete(String(key)),clear:()=>reaperMemory.clear(),key:i=>[...reaperMemory.keys()][i]??null,get length(){return reaperMemory.size;}};
 try{Object.defineProperty(window,'localStorage',{value:memory,configurable:true});}catch(e){throw Error('Cannot isolate boss preview storage.');}
}
