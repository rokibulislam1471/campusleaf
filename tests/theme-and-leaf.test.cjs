const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');
const services = require('../data-services.js');
const root = path.resolve(__dirname, '..');
function createApp(existing) {
  const events = {}, view = { innerHTML: '' }, storage = {};
  if (existing) storage['campusleaf.hswt.v1'] = JSON.stringify(existing);
  const doc = {
    documentElement:{lang:'en',dataset:{}},
    body:{classList:{value:'',toggle(k,v){if(k==='dark')this.value=v?'dark':''}},appendChild(){}},
    querySelector(sel){return sel==='#app'?view:null},
    addEventListener(k,fn){events[k]=fn},
    get activeElement(){return {tagName:'BODY'}}
  };
  const ctx={document:doc,window:{location:{protocol:'file:'},scrollTo(){}},navigator:{},localStorage:{getItem:k=>storage[k]||null,setItem:(k,v)=>storage[k]=v,removeItem:k=>delete storage[k]},sessionStorage:{getItem:()=>null,setItem(){}},CampusServices:services,Date,Intl,console,crypto:{randomUUID:()=> 'id'},setTimeout,clearTimeout,fetch:async()=>({ok:false}),confirm:()=>true};
  vm.runInNewContext(fs.readFileSync(path.join(root,'app.js'),'utf8'),ctx);
  return {events,storage,doc,get html(){return view.innerHTML}};
}
function click(app,act,dataset={}) {const b={dataset:{action:act,...dataset}};app.events.click({target:{id:'',closest:()=>b}})}
test('new installs start dark with the same icon on header',()=>{
 const a=createApp();assert.equal(a.doc.body.classList.value,'dark');
 assert.match(a.html,/\.\/assets\/favicon\.svg/);
 click(a,'nav',{screen:'more'});
 assert.match(a.html,/data-theme="dark"/);
 assert.match(a.html,/data-theme="light"/);
});
test('students can select light and dark and preference stays saved',()=>{
 const a=createApp();click(a,'nav',{screen:'more'});
 click(a,'set-theme',{theme:'light'});
 assert.equal(a.doc.body.classList.value,'');assert.equal(a.doc.documentElement.dataset.firstTheme,'light');
 assert.equal(JSON.parse(a.storage['campusleaf.hswt.v1']).theme,'light');
 const b=createApp({theme:'light'});assert.equal(b.doc.body.classList.value,'');
 click(b,'set-theme',{theme:'dark'});assert.equal(b.doc.body.classList.value,'dark');
});
test('native icon assets and Android workflow present',()=>{
 const svg=fs.readFileSync(path.join(root,'assets/favicon.svg'),'utf8');
 assert.match(svg,/M20 3C9 3 4 7/);
 assert.doesNotMatch(svg,/M40 108V54/); // previous building icon
 assert.equal(fs.existsSync(path.join(root,'assets/android-brand/splash.png')),true);
 const yml=fs.readFileSync(path.join(root,'.github/workflows/android-apk.yml'),'utf8');
 assert.match(yml,/Apply CampusLeaf leaf icon and splash resources/);
 assert.match(yml,/mipmap-anydpi-v26/);
});
