const assert = require('node:assert/strict');
const {test} = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const services = require('../data-services.js');
const KEY='campusleaf.hswt.v1';
function boot(lang='en',initial={}) {
  const callbacks = {}, view={innerHTML:''},opened=[];
  const doc={
    documentElement:{lang:'en'},body:{classList:{toggle(){}},appendChild(){}},
    querySelector(q){return q==='#app'?view:null;},
    createElement(){return {setAttribute(){},remove(){}};},
    addEventListener(n,fn){callbacks[n]=fn;},
    get activeElement(){return {tagName:'BODY'};}
  };
  const storage={[KEY]:JSON.stringify({lang,...initial})};
  const ctx={document:doc,window:{location:{protocol:'file:'},scrollTo(){},open:(...args)=>opened.push(args)},navigator:{},
    localStorage:{getItem:k=>storage[k]||null,setItem:(k,v)=>{storage[k]=v},removeItem:k=>delete storage[k]},
    sessionStorage:{getItem:()=>null,setItem:()=>{}},
    CampusServices:services,Date,Intl,console,crypto:{randomUUID:()=> 'fixture-id'},setTimeout,clearTimeout};
  vm.runInNewContext(fs.readFileSync(path.resolve(__dirname,'../app.js'),'utf8'),ctx);
  return {view,callbacks,storage,opened};
}
function click(app,action,dataset={}){app.callbacks.click({target:{id:'',closest:()=>({dataset:{action,...dataset}})}})}
function showEmail(app){click(app,'nav',{screen:'mail'})}
test('Email appears in main navigation and dashboard shortcut',()=>{
  const app=boot();
  assert.match(app.view.innerHTML,/data-screen="mail"/);
  assert.match(app.view.innerHTML,/HSWT Email/);
});
test('mail page opens verified official webmail without password form or embedding',()=>{
  const app=boot();showEmail(app);
  assert.match(app.view.innerHTML,/Student email/);
  assert.match(app.view.innerHTML,/https:\/\/xmail\.mwn\.de\/owa\//);
  assert.match(app.view.innerHTML,/target="_blank" rel="noopener noreferrer"/);
  assert.match(app.view.innerHTML,/Open my HSWT inbox/);
  assert.match(app.view.innerHTML,/CampusLeaf never collects or stores/);
  assert.match(app.view.innerHTML,/HSWT may still require another sign-in/);
  assert.doesNotMatch(app.view.innerHTML,/<input[^>]*type=["']password/);
  assert.doesNotMatch(app.view.innerHTML,/<iframe/i);
});
test('german email interface and secure guidance',()=>{
  const app=boot('de');showEmail(app);
  assert.match(app.view.innerHTML,/Studierenden-E-Mail/);
  assert.match(app.view.innerHTML,/Mein HSWT-Postfach öffnen/);
  assert.match(app.view.innerHTML,/Angemeldet bleiben, soweit möglich/);
});
test('quick-open is opt-in, persists a boolean and launches the official site only on an explicit Email tap',()=>{
  const app=boot();showEmail(app);
  assert.equal(app.opened.length,0);
  assert.match(app.view.innerHTML,/role="switch" aria-checked="false"/);
  click(app,'toggle-mail-quick-open');
  assert.equal(JSON.parse(app.storage[KEY]).mailQuickOpen,true);
  assert.match(app.view.innerHTML,/role="switch" aria-checked="true"/);
  assert.equal(app.opened.length,0);
  click(app,'nav',{screen:'home'});
  assert.equal(app.opened.length,0);
  click(app,'nav',{screen:'mail'});
  assert.equal(app.opened.length,1);
  assert.equal(app.opened[0][0],'https://xmail.mwn.de/owa/');
  assert.equal(app.opened[0][1],'_blank');
  assert.equal(app.opened[0][2],'noopener,noreferrer');
  assert.doesNotMatch(JSON.stringify(app.storage),/password|access_token|refresh_token|owa\/auth/gi);
  click(app,'toggle-mail-quick-open');
  assert.equal(JSON.parse(app.storage[KEY]).mailQuickOpen,false);
  click(app,'nav',{screen:'mail'});
  assert.equal(app.opened.length,1);
});
test('existing user can opt in and it remains enabled after app restart',()=>{
  const app=boot('en',{mailQuickOpen:true});
  click(app,'nav',{screen:'mail'});
  assert.equal(app.opened.length,1);
  assert.match(app.view.innerHTML,/role="switch" aria-checked="true"/);
});
