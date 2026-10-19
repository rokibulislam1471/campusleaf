/* CampusLeaf v3 data adapters. No university passwords are requested or transmitted. */
(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.CampusServices = api;
})(typeof window !== 'undefined' ? window : null, function () {
  'use strict';
  const EAT_ROOT = 'https://tum-dev.github.io/eat-api';
  const OPENMENSA_ROOT = 'https://openmensa.org/api/v2';
  const VENUES = [
    {id:'mensa-weihenstephan',campus:'weihenstephan',name:'Mensa Weihenstephan',kind:'Mensa',address:'Maximus-von-Imhof-Forum 5, 85354 Freising',hours:'Mo–Fr · 11:00–13:30',provider:'eat',key:'mensa-weihenstephan',official:'https://www.studierendenwerk-muenchen-oberbayern.de/gastronomie/standorte-und-oeffnungszeiten/freising-weihenstephan/'},
    {id:'stucafe-weihenstephan-maximus',campus:'weihenstephan',name:'StuBistro Maximus',kind:'Bistro',address:'Maximus-von-Imhof-Forum 5, 85354 Freising',hours:'Mo–Do · 08:30–15:00 · Fr 08:30–14:30',provider:'eat',key:'stucafe-weihenstephan-maximus',official:'https://www.studierendenwerk-muenchen-oberbayern.de/gastronomie/standorte-und-oeffnungszeiten/freising-weihenstephan/'},
    {id:'stucafe-akademie-weihenstephan',campus:'weihenstephan',name:'StuBistro Akademie',kind:'Bistro',address:'Alte Akademie 1, 85354 Freising',hours:'Mo–Do · 08:00–14:30 · Fr 08:00–14:00',provider:'eat',key:'stucafe-akademie-weihenstephan',official:'https://www.studierendenwerk-muenchen-oberbayern.de/gastronomie/standorte-und-oeffnungszeiten/freising-weihenstephan/'},
    {id:'espressobar-weihenstephan',campus:'weihenstephan',name:'Espressobar Weihenstephan',kind:'Coffee',address:'Maximus-von-Imhof-Forum 5, 85354 Freising',hours:'Mo–Do · 11:30–13:30 (seasonal closures)',provider:'official',official:'https://www.studierendenwerk-muenchen-oberbayern.de/gastronomie/standorte-und-oeffnungszeiten/freising-weihenstephan/'},
    {id:'stulounge-weihenstephan',campus:'weihenstephan',name:'StuLounge Weihenstephan',kind:'Lounge',address:'Am Staudengarten 1, 85354 Freising',hours:'Mo–Do · 07:45–14:30 · Fr 07:45–13:00 (breaks)',provider:'official',official:'https://www.studierendenwerk-muenchen-oberbayern.de/gastronomie/standorte-und-oeffnungszeiten/freising-weihenstephan/'},
    {id:'mensateria-triesdorf',campus:'triesdorf',name:'Mensateria Gastwirtschaft zum Adler',kind:'Mensateria',address:'Markgrafenstraße 14, 91746 Weidenbach',hours:'See operator for current hours',provider:'operator-html',search:/mensateria|gastwirtschaft|adler/i,official:'https://www.werkswelt.de/index?id=trie'},
    {id:'mensa-triesdorf',campus:'triesdorf',name:'Mensa der Landwirtschaftlichen Lehranstalten',kind:'Mensa',address:'Markgrafenstraße 12, 91746 Weidenbach',hours:'Mo–Do · 11:00–13:15 · Fr 11:00–13:00 (lunch)',provider:'operator-pdf',official:'https://www.triesdorf.de/essen-trinken-einkaufen/speiseplan'}
  ];
  const dateKey = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  function isoWeek(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const y = d.getUTCFullYear();
    const week = Math.ceil((((d - Date.UTC(y, 0, 1))/86400000) + 1)/7);
    return {year:y,week:String(week).padStart(2,'0')};
  }
  function parseEatJSON(payload, day) {
    const weeks = Array.isArray(payload?.weeks) ? payload.weeks : [payload];
    const days = weeks.flatMap(w => Array.isArray(w?.days) ? w.days : []);
    const match = days.find(d=>d.date===day);
    return Array.isArray(match?.dishes) ? match.dishes.map((d,i)=>({
      id:`eat-${day}-${i}`,name:String(d.name||'Unnamed dish').slice(0,220),type:String(d.dish_type||''),labels:Array.isArray(d.labels)?d.labels.map(String):[],
      price: Number.isFinite(d.prices?.students?.base_price) ? d.prices.students.base_price : null,
      unit: String(d.prices?.students?.unit||''),unitPrice:Number.isFinite(d.prices?.students?.price_per_unit)?d.prices.students.price_per_unit:null
    })) : null;
  }
  function parseOpenMensaJSON(meals){
    return Array.isArray(meals) ? meals.map((m,i)=>({id:`om-${m.id||i}`,name:String(m.name||'Unnamed dish').slice(0,220),type:String(m.category||''),labels:Array.isArray(m.notes)?m.notes.map(String):[],price:typeof m.prices?.students==='number'?m.prices.students:null,unit:'',unitPrice:null})) : null;
  }
  async function getJSON(url) {
    const ctl = new AbortController(), timeout = setTimeout(()=>ctl.abort(),11000);
    try { const res=await fetch(url,{signal:ctl.signal,cache:'no-store',headers:{Accept:'application/json'}});if(!res.ok)throw new Error(`HTTP ${res.status}`);return await res.json(); }
    finally {clearTimeout(timeout)}
  }
  async function findTriesdorfId() {
    const url = `${OPENMENSA_ROOT}/canteens?near%5Blat%5D=49.20&near%5Blng%5D=10.64&near%5Bdist%5D=12`;
    const list=await getJSON(url);
    const match = Array.isArray(list)&&list.find(c=>/mensateria|gastwirtschaft zum adler/i.test(c.name||'') && /triesdorf|weidenbach/i.test(`${c.name} ${c.city} ${c.address}`));
    return match?.id || null;
  }
  // Read daily menu snapshots regardless of venue type. A source-backed editorial
  // entry, an official HTML/PDF parser or a public JSON API can all populate it.
  // No placeholders or invented dishes are ever displayed as actual menus.
  async function loadMenu(venue,day){
    let snapshot = null;
    try {
      snapshot = await getJSON('./data/menu-snapshot.json');
      const item = snapshot?.venues?.[venue.id];
      const dishes = item?.days?.[day];
      if (Array.isArray(dishes)) {
        const age = Date.now()-new Date(snapshot.generatedAt).getTime();
        if (Number.isFinite(age) && age>=0 && age<72*3600000) {
          return {status:age<=36*3600000?'live':'cached',dishes:dishes.map((d,i)=>({...d,id:`snapshot-${i}`})),
            source:item.source||venue.official, method:item.method||'public-feed', generatedAt:snapshot.generatedAt};
        }
      }
    } catch (_e) { /* Source might be unavailable before first GitHub deployment */ }

    if(venue.provider==='eat'){
      const w=isoWeek(new Date(`${day}T12:00:00`));
      const url=`${EAT_ROOT}/${venue.key}/${w.year}/${w.week}.json`;
      try {
        const dishes=parseEatJSON(await getJSON(url),day);
        if (dishes!==null) return {status:'live',dishes,source:url,method:'public-json'};
      } catch (_e) { /* Browser CORS or network can block a third-party source */ }
    }
    if(venue.provider==='operator-html' && venue.campus==='triesdorf') {
      // The scheduled GitHub Actions collector can read the operator website.
      // Browser-side HTML reads are not possible when the provider disallows CORS.
      try {
        const id=await findTriesdorfId();
        if(id){
          const url=`${OPENMENSA_ROOT}/canteens/${id}/days/${day}/meals`;
          const meals=parseOpenMensaJSON(await getJSON(url));
          if(meals.length) return {status:'live',dishes:meals,source:url,method:'openmensa'};
        }
      } catch (_e) { /* No CORS or matching canteen */ }
    }
    return {status:'unavailable',dishes:[],source:venue.official,
      generatedAt:snapshot?.generatedAt||null};
  }
  function unfoldICS(text){return String(text).replace(/\r\n/g,'\n').replace(/\r/g,'\n').replace(/\n[ \t]/g,'').split('\n');}
  function textUnescape(s){return String(s||'').replace(/\\n/gi,'\n').replace(/\\,/g,',').replace(/\\;/g,';').replace(/\\\\/g,'\\')}
  function dateParts(value, property='') {
    const v=String(value||'').trim();if(!/^\d{8}(T\d{6}Z?)?$/.test(v))return null;
    const y=+v.slice(0,4),m=+v.slice(4,6),d=+v.slice(6,8),hour=v.length>8?+v.slice(9,11):0,min=v.length>8?+v.slice(11,13):0;
    if(m<1||m>12||d<1||d>31||hour>23||min>59)return null;
    if(v.endsWith('Z')){
      const dt=new Date(Date.UTC(y,m-1,d,hour,min));
      const parts=Object.fromEntries(new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Berlin',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(dt).filter(x=>x.type!=='literal').map(x=>[x.type,x.value]));
      return {date:`${parts.year}-${parts.month}-${parts.day}`,hour:`${parts.hour}:${parts.minute}`,daylong:v.length===8};
    }
    // Floating times and TZID=Europe/Berlin are treated as German local wall time.
    // Other named TZIDs are not converted; the import UI explains this limitation.
    return {date:`${v.slice(0,4)}-${v.slice(4,6)}-${v.slice(6,8)}`,hour:`${String(hour).padStart(2,'0')}:${String(min).padStart(2,'0')}`,daylong:v.length===8};
  }
  function plusDays(d,n){const x=new Date(`${d}T12:00:00`);x.setDate(x.getDate()+n);return dateKey(x)}
  function parseICS(text,{start=plusDays(dateKey(new Date()),-70),days=440}={}) {
    if(String(text).length>1_500_000)throw new Error('Calendar file is too large (1.5 MB limit)');
    const unfolded=unfoldICS(text),blocks=[];let current=null;
    for(const line of unfolded){
      if(line==='BEGIN:VEVENT'){current={};continue}
      if(line==='END:VEVENT'){if(current)blocks.push(current);current=null;continue}
      if(!current)continue;
      const pos=line.indexOf(':');if(pos<0)continue;
      const key=line.slice(0,pos).split(';')[0].toUpperCase(),value=line.slice(pos+1);
      if(key==='EXDATE')current.EXDATE=(current.EXDATE||[]).concat(value.split(','));
      else if(key==='RDATE')current.RDATE=(current.RDATE||[]).concat(value.split(','));
      else current[key]=value;
    }
    if(!blocks.length)throw new Error('No calendar events were found in this .ics file');
    const events=[],maxEnd=plusDays(start,days), weekdays=['MO','TU','WE','TH','FR','SA','SU'];
    for(const b of blocks.slice(0,800)){
      const st=dateParts(b.DTSTART),en=dateParts(b.DTEND);if(!st)continue;
      const base=new Date(`${st.date}T12:00:00`),weekday=(base.getDay()+6)%7;
      let endHour=en?.hour||st.hour;const title=textUnescape(b.SUMMARY||'Class').slice(0,110),room=textUnescape(b.LOCATION||'').slice(0,100);
      const exclude=new Set((b.EXDATE||[]).map(s=>dateParts(s)?.date).filter(Boolean));
      const rule=Object.fromEntries((b.RRULE||'').split(';').filter(Boolean).map(s=>{let i=s.indexOf('=');return [s.slice(0,i).toUpperCase(),s.slice(i+1)]}));
      const freq=rule.FREQ,interval=Math.min(52,Math.max(1,parseInt(rule.INTERVAL||'1',10)||1)),until=rule.UNTIL?dateParts(rule.UNTIL)?.date:null;
      const bydays=(rule.BYDAY||weekdays[weekday]).split(',').map(s=>weekdays.indexOf(s.slice(-2))).filter(i=>i>=0);
      const count=rule.COUNT?Math.min(2000,Math.max(1,+rule.COUNT||1)):Infinity;let emitted=0;
      function add(day){if(day<start||day>maxEnd||exclude.has(day))return;events.push({id:`ics-${events.length}`,source:'ics',date:day,title,room,start:st.hour,end:endHour,teacher:'',day:(new Date(`${day}T12:00:00`).getDay()+6)%7});}
      if(!freq){add(st.date);continue}
      const scanStart=new Date(`${st.date}T12:00:00`),stop=plusDays(st.date,Math.min(days+180,760));
      for(let i=0;i<=760&&emitted<count;i++){
        const day=plusDays(st.date,i);if(day>maxEnd||day>stop||(until&&day>until))break;
        const dow=(scanStart.getDay()+6+i)%7,stepDays=i;
        let valid=false;
        if(freq==='WEEKLY')valid=bydays.includes(dow) && Math.floor((stepDays+weekday)/7)%interval===0;
        else if(freq==='DAILY')valid=i%interval===0;
        else if(freq==='MONTHLY'){const d=new Date(`${day}T12:00:00`);valid=d.getDate()===scanStart.getDate()&&((d.getFullYear()-scanStart.getFullYear())*12+d.getMonth()-scanStart.getMonth())%interval===0;}
        if(!valid)continue;emitted++;add(day);
      }
      for(const extra of b.RDATE||[]){const p=dateParts(extra);if(p)add(p.date)}
    }
    const unique=new Map();for(const e of events){unique.set([e.date,e.start,e.title,e.room].join('|'),e)}
    return [...unique.values()].sort((a,b)=>(a.date+a.start).localeCompare(b.date+b.start)).slice(0,3500);
  }
  return {VENUES,isoWeek,dateKey,loadMenu,parseICS,parseEatJSON,parseOpenMensaJSON};
});
