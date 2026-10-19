const assert = require('node:assert/strict');
const {test} = require('node:test');
const {VENUES,isoWeek,parseEatJSON,parseOpenMensaJSON,parseICS} = require('../data-services.js');
test('all known HSWT-campus dining locations',()=>{
  assert.equal(VENUES.filter(v=>v.campus==='weihenstephan').length,5);
  assert.equal(VENUES.filter(v=>v.campus==='triesdorf').length,2);
  assert.ok(VENUES.some(v=>v.name==='Mensa Weihenstephan'&&v.provider==='eat'));
});
test('ISO week across year boundary',()=>{assert.deepEqual(isoWeek(new Date(2026,9,19)),{year:2026,week:'43'});assert.deepEqual(isoWeek(new Date(2027,0,1)),{year:2026,week:'53'});});
test('eat-api fixture supports student prices and labels',()=>{
 const x=parseEatJSON({days:[{date:'2026-10-19',dishes:[{name:'Vegetable curry',dish_type:'Main',labels:['VEGAN'],prices:{students:{base_price:2.95,price_per_unit:0,unit:''}}}]}]},'2026-10-19');
 assert.equal(x[0].name,'Vegetable curry');assert.equal(x[0].price,2.95);assert.deepEqual(x[0].labels,['VEGAN']);
 assert.equal(parseEatJSON({days:[]},'2026-10-19'),null);
});
test('OpenMensa fixture supports numeric student prices',()=>{
 const x=parseOpenMensaJSON([{id:3,name:'Suppe',category:'Soup',prices:{students:1.45},notes:['vegan']}]);assert.equal(x[0].price,1.45);
});
test('ical weekly recurrence, line folding, EXDATE',()=>{
 const ics=`BEGIN:VCALENDAR\r\nVERSION:2.0\r\nBEGIN:VEVENT\r\nUID:test\r\nSUMMARY:Applied Calcu\r\n lus\r\nLOCATION:C4.201\r\nDTSTART;TZID=Europe/Berlin:20261019T090000\r\nDTEND;TZID=Europe/Berlin:20261019T103000\r\nRRULE:FREQ=WEEKLY;COUNT=6;BYDAY=MO\r\nEXDATE;TZID=Europe/Berlin:20261102T090000\r\nEND:VEVENT\r\nEND:VCALENDAR`;
 const list=parseICS(ics,{start:'2026-10-01',days:100});assert.equal(list.length,5);assert.equal(list[0].title,'Applied Calculus');assert.equal(list[0].date,'2026-10-19');assert.ok(!list.some(e=>e.date==='2026-11-02'));
});
test('one-off events are not repeated, no events invalid ICS rejected',()=>{
 const s=`BEGIN:VCALENDAR\nBEGIN:VEVENT\nDTSTART:20261020T140000\nDTEND:20261020T153000\nSUMMARY:Exam\nEND:VEVENT\nEND:VCALENDAR`;
 assert.equal(parseICS(s,{start:'2026-10-01',days:50}).length,1);
 assert.throws(()=>parseICS('junk'),/No calendar/);
});
test('official Triesdorf PDF-derived venue can render a published snapshot inside the app',async()=>{
  const {loadMenu,VENUES} = require('../data-services.js');
  const oldFetch=global.fetch;
  const savedDate=new Date().toLocaleDateString('sv-SE',{timeZone:'Europe/Berlin'});
  global.fetch=async url=>{
    assert.match(url,/menu-snapshot\.json/);
    return {ok:true,json:async()=>({generatedAt:new Date().toISOString(),venues:{
      'mensa-triesdorf':{method:'operator-pdf',source:'https://www.triesdorf.de/essen-trinken-einkaufen/speiseplan',
        days:{[savedDate]:[{name:'Published test fixture',type:'Menü I',price:null,labels:[],unitPrice:null,unit:''}]}}
    }})};
  };
  try {
    const venue=VENUES.find(v=>v.id==='mensa-triesdorf');
    const result=await loadMenu(venue,savedDate);
    assert.equal(result.status,'live');
    assert.equal(result.dishes[0].name,'Published test fixture');
    assert.equal(result.method,'operator-pdf');
  } finally {global.fetch=oldFetch}
});
