const assert=require('node:assert/strict');
const {test}=require('node:test');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const app=fs.readFileSync(path.resolve(__dirname,'../app.js'),'utf8');
const style=fs.readFileSync(path.resolve(__dirname,'../styles.css'),'utf8');
const src=fs.readFileSync(path.resolve(__dirname,'../.github/workflows/android-apk.yml'),'utf8');
function setup(){
  const handlers={};const view={innerHTML:''};let opened=[],gets=0;
  const context={document:{documentElement:{lang:'en',dataset:{}},body:{classList:{toggle(){}},appendChild(){}},querySelector(sel){return sel==='#app'?view:null},addEventListener(n,f){handlers[n]=f},activeElement:{tagName:'BODY'}},window:{location:{protocol:'file:'},scrollTo(){},open(url){opened.push(url)},},navigator:{geolocation:{getCurrentPosition(success){gets++;success({coords:{latitude:48.1,longitude:11.2,accuracy:11}})}}},localStorage:{getItem:()=>null,setItem(){}},sessionStorage:{getItem:()=>null},CampusServices:{dateKey:()=> '2026-10-19', VENUES:[]},Date,Intl,console,crypto:{randomUUID:()=> '123'},setTimeout,clearTimeout,URL,URLSearchParams};
  vm.runInNewContext(app,context);
  const click=(act,data={})=>handlers.click({target:{id:'',closest:()=>({dataset:{action:act,...data}})}});
  return {click,view,handlers,opened,locates:()=>gets};
}
test('verified official building directory includes 23 Weihenstephan locations',()=>{const x=setup();x.click('nav',{screen:'campus'});assert.match(x.view.innerHTML,/23 HSWT addresses/);assert.match(x.view.innerHTML,/Am Hofgarten 1/);assert.match(x.view.innerHTML,/Hans-Carl-von-Carlowitz-Platz 3/);assert.doesNotMatch(x.view.innerHTML,/map-graphic/)});
test('Triesdorf builds a seven-building navigation directory',()=>{const x=setup();x.click('nav',{screen:'campus'});x.click('building-campus',{campus:'triesdorf'});assert.match(x.view.innerHTML,/7 HSWT addresses/);assert.match(x.view.innerHTML,/Steingruberstraße 2/);x.click('pick-building',{building:'B'});assert.match(x.view.innerHTML,/Markgrafenstraße 12/)});
test('current-location GPS only activates after student clicks and routes use walking origin',()=>{const x=setup();x.click('nav',{screen:'campus'});assert.equal(x.locates(),0);x.click('locate-me');assert.equal(x.locates(),1);x.click('building-directions',{building:'A1'});assert.match(x.opened[0],/google.com\/maps\/dir\//);assert.match(x.opened[0],/travelmode=walking/);assert.match(x.opened[0],/48.100000%2C11.200000/)});
test('Android APK uses explicit Capacitor geolocation with Android permission',()=>{assert.match(src,/\@capacitor\/geolocation\@7/);assert.match(src,/ACCESS_FINE_LOCATION/);assert.match(style,/building-layout/)});
