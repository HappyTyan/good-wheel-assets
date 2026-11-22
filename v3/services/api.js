import { CONFIG, SECTORS } from "../config.js";
const KEY="good-wheel-v3-mock";
const sample=[
  ["Вас ждёт приятная неожиданность","Сегодня может появиться повод для радости.","Замечайте хорошие возможности."],
  ["Маленький шаг принесёт пользу","Небольшие решения открывают путь к переменам.","Двигайтесь в своём темпе."],
  ["Ваше желание заслуживает шанса","Большая мечта начинается с первого шага.","Уделите время своей цели."],
  ["Добро возвращается","Тёплые слова способны изменить чей-то день.","Поддержите близкого человека."]
];
const dayKst = (date=new Date()) => new Intl.DateTimeFormat("en-CA",{timeZone:CONFIG.dayZone,year:"numeric",month:"2-digit",day:"2-digit"}).format(date);

export function createMockApi({now=()=>Date.now(),storage=globalThis.localStorage}={}){
  function load(){
    try{
      const data=JSON.parse(storage.getItem(KEY)||"null");
      if(!data||!Array.isArray(data.spins)||!Array.isArray(data.history))return {spins:[],history:[],keys:{}};
      return {spins:data.spins.filter(Number.isFinite),history:data.history.filter(x=>x&&typeof x==="object").slice(0,100),keys:data.keys&&typeof data.keys==="object"?data.keys:{}};
    }catch{return {spins:[],history:[],keys:{}};}
  }
  function save(data){try{storage.setItem(KEY,JSON.stringify(data));}catch{}}
  function state(data,time=now()){
    const today=dayKst(new Date(time));
    const todaySpins=data.spins.filter(t=>dayKst(new Date(t))===today).sort((a,b)=>a-b);
    const used=todaySpins.length;
    const unlock=todaySpins[0]+CONFIG.unlockMinutes*60000;
    const available=Math.max(0,(used<CONFIG.immediateSpins?CONFIG.immediateSpins:time>=unlock?CONFIG.dailyLimit:CONFIG.immediateSpins)-used);
    return {day:today,used,available,nextUnlockAt:used>=CONFIG.immediateSpins&&used<CONFIG.dailyLimit&&time<unlock?new Date(unlock).toISOString():null};
  }
  return {
    async getState(){return state(load());},
    async spin(key){
      if(typeof key!=="string"||!key)throw Error("Missing idempotency key");
      const data=load();
      if(data.keys[key])return data.keys[key];
      const s=state(data);
      if(s.available<1)throw Error("Сегодня пока нет доступных вращений");
      const time=now();
      const index=Math.floor(Math.random()*SECTORS.length),item=SECTORS[index],message=sample[Math.floor(Math.random()*sample.length)];
      const prediction={id:"mock-"+time,category:item.category,title:message[0],text:message[1],advice:message[2],icon:null};
      const entry={...prediction,at:new Date(time).toISOString()};
      data.spins.push(time);data.history.unshift(entry);data.history=data.history.slice(0,100);
      const result={sectorIndex:index,prediction,state:state(data,time)};
      data.keys[key]=result;
      if(Object.keys(data.keys).length>120)data.keys=Object.fromEntries(Object.entries(data.keys).slice(-100));
      save(data);return result;
    },
    async history(limit=20,offset=0){return load().history.slice(offset,offset+limit);}
  };
}
export function createApi(options){if(CONFIG.apiMode!=="mock")throw Error("Supabase API will be implemented in stage 5");return createMockApi(options);}