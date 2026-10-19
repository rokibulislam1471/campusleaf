const assert = require('node:assert/strict');
const {test} = require('node:test');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const services = require('../data-services.js');
function createApp(initial={}){
 const events={}, view={innerHTML:'',querySelector:()=>null};
 const doc={documentElement:{lang:'en'},body:{classList:{toggle(){}},appendChild(){}},querySelector(selector){return selector==='#app'?view:null},addEventListener(name,fn){events[name]=fn},get activeElement(){return{tagName:'BODY'}}};
 const storage={};
 if(initial)storage['campusleaf.hswt.v1']=JSON.stringify(initial);
 const fetch=async url=>({ok:true, json:async()=>({generatedAt:new Date().toISOString(),venues:{'mensa-weihenstephan':{source:'test fixture',days:{[services.dateKey(new Date())]:[{name:'Vegetable pasta',price:3.5,type:'Daily dish',labels:['VEGAN'],unitPrice:null,unit:''}]}}}})});
 const ctx={document:doc,window:{location:{protocol:'file:'},scrollTo(){}},navigator:{},localStorage:{getItem:k=>storage[k]||null,setItem:(k,v)=>storage[k]=v,removeItem:k=>delete storage[k]},sessionStorage:{getItem:()=>null,setItem:()=>{}},CampusServices:{...services,loadMenu:async() => ({status:'live',dishes:[{name:'Vegetable pasta',price:3.5,type:'Daily dish',labels:['VEGAN'],unitPrice:null,unit:''}]})},Date,Intl,console,crypto:{randomUUID:()=>'sample-id'},setTimeout,clearTimeout,fetch,confirm:()=>true};
 vm.runInNewContext(fs.readFileSync(path.resolve(__dirname,'../app.js'),'utf8'),ctx);
 return {get html(){return view.innerHTML},events,storage};
}
function click(app,action,dataset={}){
 const el={dataset:{action,...dataset}};
 app.events.click({target:{id:'',closest:()=>el}});
}
test('dashboard, timetable, dining render without runtime exception',async()=>{
 const app=createApp();assert.match(app.html,/Everything campus/);
 click(app,'nav',{screen:'schedule'});assert.match(app.html,/My timetable/);assert.match(app.html,/Calendar not connected/);
 click(app,'week-next');assert.match(app.html,/My timetable/);
 click(app,'nav',{screen:'food'});assert.match(app.html,/Mensa Weihenstephan/);
 await new Promise(r=>setTimeout(r,60));assert.match(app.html,/Vegetable pasta/);
 assert.match(app.html,/Published menu/);
 click(app,'diet-veg');assert.match(app.html,/Vegetable pasta/);
 click(app,'nav',{screen:'campus'});assert.match(app.html,/Find a campus building/);
 click(app,'nav',{screen:'more'});assert.match(app.html,/Calendar connection/);
 assert.match(app.html,/Install on your phone/);
});
test('imported calendar appears in timetable',()=>{
 const date=services.dateKey(new Date());const day=(new Date().getDay()+6)%7;
 const app=createApp({calendarEvents:[{id:'abc',date,title:'My lab',start:'09:00',end:'10:00',room:'A6',day,source:'ics'}],classes:[],reminders:[]});
 click(app,'nav',{screen:'schedule'});assert.match(app.html,/My lab/);assert.match(app.html,/iCal/);
});
