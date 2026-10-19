"""Create a clearly labeled standalone OFFLINE UI preview, never shipped as production data."""
import datetime as dt
import json
from pathlib import Path

root=Path(__file__).resolve().parents[1]
html=(root/'index.html').read_text(encoding='utf-8')
html=html.replace('<link rel="stylesheet" href="./styles.css" />','<style>'+ (root/'styles.css').read_text(encoding='utf-8')+'</style>')
html=html.replace('    <link rel="manifest" href="./manifest.webmanifest" />','')
html=html.replace('    <link rel="icon" href="./assets/favicon.svg" type="image/svg+xml" />','')
html=html.replace('    <link rel="apple-touch-icon" href="./assets/icon-192.png" />','')
html=html.replace('    <div id="app"></div>',
'''    <div role="note" style="background:#fff4dc;color:#764414;padding:9px 14px;text-align:center;font:600 13px system-ui;position:relative;z-index:1000">
    UI PREVIEW — example meals are fictional. Student email opens official Outlook in a separate browser tab.
    </div><div id="app"></div>''')
html=html.replace('<script src="./data-services.js" defer></script>', '<script>'+(root/'data-services.js').read_text(encoding='utf-8')+'</script>')
current=dt.datetime.now().strftime('%Y-%m-%d')
fixture={'schemaVersion':3,'generatedAt':dt.datetime.now(dt.timezone.utc).isoformat(),
         'venues':{
           'mensa-weihenstephan':{'method':'DEMO ONLY','source':'https://github.com/TUM-Dev/eat-api','days':{
             current:[{'name':'DEMO ONLY — Example vegetable curry','type':'Illustrative item (not a published dish)','labels':['VEGAN'],'price':2.95,'unitPrice':None,'unit':''},
                      {'name':'DEMO ONLY — Example pasta','type':'Illustrative item (not a published dish)','labels':['VEGETARIAN'],'price':3.49,'unitPrice':None,'unit':''}]}},
           'mensateria-triesdorf':{'method':'DEMO ONLY','source':'https://www.werkswelt.de/index?id=trie','days':{
             current:[{'name':'DEMO ONLY — Example lunch','type':'Illustrative item (not a published dish)','labels':[],'price':3.85,'unitPrice':None,'unit':''}]}}
         }}
mock='''<script>
// Preview environment only. This file does not contain live food data.
const _campusleafPreviewData = '''+json.dumps(fixture,ensure_ascii=False)+''';
window.fetch = async function(url) {
  if (String(url).includes('menu-snapshot.json'))
    return {ok:true,json:async()=>_campusleafPreviewData};
  throw new Error('Offline preview cannot access remote sources');
};
</script>'''
html=html.replace('<script src="./app.js" defer></script>',mock+'<script>'+(root/'app.js').read_text(encoding='utf-8')+'</script>')
target=root.parents[0]/'CampusLeaf-v4-Preview.html'
target.write_text(html,encoding='utf-8')
print('Built offline UI preview:',target,len(html),'bytes')
