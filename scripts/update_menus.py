#!/usr/bin/env python3
"""Build dated public dining menus for a static CampusLeaf GitHub Pages PWA.

Never fabricates food, dates, prices or dietary labels. A missing feed yields an
explicit unavailable status; the browser can still show an in-app venue card.
"""
from __future__ import annotations

import datetime as dt
import io
import json
import logging
import re
import urllib.parse
import urllib.request
from pathlib import Path
from zoneinfo import ZoneInfo

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / 'data' / 'menu-snapshot.json'
MANUAL = ROOT / 'data' / 'editorial-menus.json'
EAT_API = 'https://tum-dev.github.io/eat-api'
OPENMENSA = 'https://openmensa.org/api/v2'
WERKSWELT = 'https://www.werkswelt.de/index?id=trie'
TRIESDORF = 'https://www.triesdorf.de/essen-trinken-einkaufen/speiseplan'
EAT_CANTEENS = {
    'mensa-weihenstephan': 'mensa-weihenstephan',
    'stucafe-weihenstephan-maximus': 'stucafe-weihenstephan-maximus',
    'stucafe-akademie-weihenstephan': 'stucafe-akademie-weihenstephan',
}
VENUE_IDS = set(EAT_CANTEENS) | {
    'mensateria-triesdorf', 'mensa-triesdorf',
    'espressobar-weihenstephan', 'stulounge-weihenstephan',
}


def get_bytes(url):
    req = urllib.request.Request(url, headers={
        'Accept': 'application/json, text/html, application/pdf',
        'User-Agent': 'CampusLeaf HSWT student project, public menu collector'})
    with urllib.request.urlopen(req, timeout=18) as res:
        data = res.read(6_000_001)
        if len(data) > 6_000_000:
            raise ValueError('Remote document exceeded 6 MB')
        return data


def get_json(url):
    return json.loads(get_bytes(url))


def safe_price(value):
    try:
        number = float(str(value).replace(',', '.'))
        return round(number, 3) if 0 <= number < 1000 else None
    except (ValueError, TypeError):
        return None


def clean(s, limit=220):
    return ' '.join(str(s or '').split())[:limit]


def dish(name, category='', price=None, labels=None, unit_price=None, unit=''):
    return dict(name=clean(name), type=clean(category, 100), price=safe_price(price),
                labels=[clean(x, 60) for x in (labels or []) if clean(x, 60)][:20],
                unitPrice=safe_price(unit_price), unit=clean(unit, 30))


def normalize_eat_payload(raw):
    if not isinstance(raw, dict):
        return []
    blocks = raw.get('weeks') if isinstance(raw.get('weeks'), list) else [raw]
    return [day for b in blocks if isinstance(b, dict)
            for day in (b.get('days') or []) if isinstance(day, dict)]


def transform_eat(raw, day):
    match = next((d for d in normalize_eat_payload(raw) if d.get('date') == day), None)
    if not isinstance(match, dict) or not isinstance(match.get('dishes'), list):
        return None
    result = []
    for d in match['dishes']:
        if not isinstance(d, dict) or not d.get('name'):
            continue
        students = (d.get('prices') or {}).get('students') or {}
        result.append(dish(d['name'], d.get('dish_type'), students.get('base_price'),
                           d.get('labels'), students.get('price_per_unit'), students.get('unit')))
    return result


def transform_openmensa(meals):
    return [dish(m.get('name'), m.get('category'), (m.get('prices') or {}).get('students'),m.get('notes'))
            for m in meals if isinstance(m, dict) and m.get('name')]


def next_dates(today, count=16):
    return [today + dt.timedelta(days=i) for i in range(count)]


def try_eat_api(today, snapshot):
    days = next_dates(today)
    weeks = sorted({(d.isocalendar().year, d.isocalendar().week) for d in days})
    for venue_id, key in EAT_CANTEENS.items():
        dest = snapshot['venues'][venue_id]
        dest['source'] = f'https://github.com/TUM-Dev/eat-api'
        dest['method'] = 'public-json'
        for year, week in weeks:
            url = f'{EAT_API}/{key}/{year}/{week:02d}.json'
            try:
                raw = get_json(url)
                for day in days:
                    if (day.isocalendar().year, day.isocalendar().week) != (year, week):
                        continue
                    found = transform_eat(raw, day.isoformat())
                    if found is not None:
                        dest['days'][day.isoformat()] = found
            except Exception as exc:
                logging.warning('eat-api %s: %s', url, exc)


def find_openmensa_triesdorf_id():
    params = urllib.parse.urlencode({'near[lat]': 49.20, 'near[lng]': 10.64, 'near[dist]': 12})
    canteens = get_json(f'{OPENMENSA}/canteens?{params}')
    for entry in canteens if isinstance(canteens, list) else []:
        name = str(entry.get('name','')).lower()
        place = f"{name} {entry.get('city','')} {entry.get('address','')}".lower()
        if ('mensateria' in name or 'gastwirtschaft zum adler' in name) and ('triesdorf' in place or 'weidenbach' in place):
            return entry.get('id')
    return None


def parse_werkswelt_html(html_text: str) -> tuple[str | None, list]:
    """Read the CURRENTLY SHOWN day only, never assume that it's today's date.

    The canteen website shows a German date followed by Essen 1, Essen 2 and
    student prices. This is best-effort, guarded by an exact date and price.
    """
    from bs4 import BeautifulSoup
    soup = BeautifulSoup(html_text, 'html.parser')
    for node in soup(['script', 'style', 'nav', 'footer']):
        node.decompose()
    lines = [clean(x, 700) for x in soup.get_text('\n', strip=True).splitlines()]
    lines = [x for x in lines if x]
    date_pattern = re.compile(r'(?:Montag|Dienstag|Mittwoch|Donnerstag|Freitag|Samstag|Sonntag)\s+(\d{1,2})\.(\d{1,2})\.(20\d{2})', re.I)
    found = next(((i, m) for i, text in enumerate(lines) if (m := date_pattern.search(text))), None)
    if not found:
        return None, []
    index, date_match = found
    try:
        day = dt.date(int(date_match[3]), int(date_match[2]), int(date_match[1])).isoformat()
    except ValueError:
        return None, []
    # Limit to the dated menu section to avoid footer / second day content.
    stop = next((i for i in range(index + 1, len(lines))
                 if lines[i].lower() in ('öffnungszeiten', 'opening hours', 'allergene:', 'allergene')),len(lines))
    scoped = lines[index+1:stop]
    price_pattern = re.compile(r'(\d{1,3}[,.]\d{2})\s*€\s*\(?Stud\.?\)?', re.I)
    meal_mark = re.compile(r'^Essen\s*(\d+)$', re.I)
    meals = []
    for i, line in enumerate(scoped):
        match = meal_mark.match(line)
        if not match:
            continue
        text = []
        price = None
        for nxt in scoped[i + 1:i + 14]:
            if meal_mark.match(nxt) or date_pattern.search(nxt):
                break
            price_match = price_pattern.search(nxt)
            if price_match:
                price = safe_price(price_match[1]); break
            if nxt.lower().startswith(('nährwertangaben', 'energy', 'energie', 'image:', 'food-icon')):
                continue
            if re.fullmatch(r'[A-Za-z]{1,8}', nxt) and not text:
                continue
            text.append(nxt)
        name = clean(' '.join(text), 220)
        if name and price is not None:
            # Do not assert vegetarian status without structured dietary data.
            meals.append(dish(name, f'Essen {match[1]}', price))
    return day, meals


def try_werkswelt(today, snapshot):
    dest = snapshot['venues']['mensateria-triesdorf']
    dest['source'] = WERKSWELT
    dest['method'] = 'operator-webpage'
    try:
        day, meals = parse_werkswelt_html(get_bytes(WERKSWELT).decode('utf-8', 'replace'))
        if day and meals and today - dt.timedelta(days=1) <= dt.date.fromisoformat(day) <= today + dt.timedelta(days=16):
            dest['days'][day] = meals
    except Exception as exc:
        logging.warning('Triesdorf operator page: %s', exc)
    # Fill other published dates only through an optional public OpenMensa canteen.
    try:
        cid = find_openmensa_triesdorf_id()
        if cid:
            for day in next_dates(today):
                key = day.isoformat()
                if key in dest['days']:
                    continue
                try:
                    url = f'{OPENMENSA}/canteens/{cid}/days/{key}/meals'
                    data = get_json(url)
                    meals = transform_openmensa(data)
                    if meals:
                        dest['days'][key] = meals
                except Exception:
                    pass
    except Exception as exc:
        logging.info('OpenMensa Triesdorf optional fallback unavailable: %s', exc)


def discover_pdf_link(html_text):
    """Follow only PDF hrefs advertised by the official Triesdorf menu page."""
    from bs4 import BeautifulSoup
    soup = BeautifulSoup(html_text, 'html.parser')
    for a in soup.find_all('a', href=True):
        href = a['href']
        if '.pdf' in href.lower() and ('menü' in a.get_text(' ', strip=True).lower()
                                     or 'speiseplan' in href.lower() or 'speiseplan' in a.get_text(' ',strip=True).lower()):
            result = urllib.parse.urljoin(TRIESDORF, href)
            if urllib.parse.urlsplit(result).hostname in ('triesdorf.de', 'www.triesdorf.de'):
                return result
    return None


def parse_triesdorf_pdf(raw_pdf):
    """Best effort extraction of a published weekly 5-column menu table.

    Return only validated day cells, never assign stale PDF dishes to this week.
    Layout may change, so reject ambiguous tables instead of guessing.
    """
    import pdfplumber
    with pdfplumber.open(io.BytesIO(raw_pdf)) as pdf:
        if not pdf.pages:
            return {}
        page = pdf.pages[0]
        headline = page.extract_text() or ''
        m = re.search(r'Speiseplan\s+(\d{2})\.(\d{2})\.(20\d{2})\s*[–-]\s*(\d{2})\.(\d{2})\.(20\d{2})', headline, re.I)
        if not m:
            return {}
        start = dt.date(int(m[3]), int(m[2]), int(m[1])); end = dt.date(int(m[6]),int(m[5]),int(m[4]))
        if (end - start).days != 4 or start.weekday() != 0:
            return {}
        rows = None
        for table in page.extract_tables() or []:
            if table and any('MONTAG' in str(c).upper() for c in table[0]):
                rows = table; break
        if not rows or len(rows[0]) < 6:
            return {}
        results = {}
        for day_num in range(5):
            date = (start + dt.timedelta(days=day_num)).isoformat()
            dishes = []
            for cells in rows[1:]:
                if len(cells) <= day_num + 1:
                    continue
                category = clean(cells[0],60)
                if not (category.startswith('Menü') or category.startswith('Menue') or category in ('Vorspeise','Nachspeise')):
                    continue
                text = clean(cells[day_num+1],220)
                if text:
                    dishes.append(dish(text,category))
            if dishes:
                results[date] = dishes
        return results


def try_triesdorf_pdf(today, snapshot):
    dest = snapshot['venues']['mensa-triesdorf']
    dest['source'] = TRIESDORF
    dest['method'] = 'operator-pdf'
    try:
        url = discover_pdf_link(get_bytes(TRIESDORF).decode('utf-8','replace'))
        if not url:
            return
        menus = parse_triesdorf_pdf(get_bytes(url))
        acceptable = {d.isoformat() for d in next_dates(today,16)}
        dest['days'].update({date: meals for date,meals in menus.items() if date in acceptable})
        if dest['days']:
            dest['source'] = url
    except Exception as exc:
        logging.warning('Triesdorf PDF: %s', exc)


def apply_editorial(today,snapshot):
    """Optional human-verified menu entries for venues that publish no API.

    Edit data/editorial-menus.json in GitHub, with source URLs and actual dates;
    never use this feature to add fictional example menus to a live deployment.
    """
    if not MANUAL.exists():
        return
    try:
        data = json.loads(MANUAL.read_text(encoding='utf-8'))
        dates = {x.isoformat() for x in next_dates(today)}
        for vid, record in data.get('venues', {}).items():
            if vid not in VENUE_IDS or not isinstance(record,dict):
                continue
            src=record.get('source','')
            if not isinstance(src,str) or not src.startswith('https://'):
                continue
            for date,entries in record.get('days',{}).items():
                if date not in dates or not isinstance(entries,list):
                    continue
                clean_entries=[dish(d.get('name'),d.get('type'),d.get('price'),d.get('labels'),d.get('unitPrice'),d.get('unit'))
                               for d in entries[:70] if isinstance(d,dict) and d.get('name')]
                if clean_entries:
                    dest=snapshot['venues'][vid]
                    dest['days'][date]=clean_entries
                    dest['source']=src
                    dest['method']='editorial-verification'
    except Exception as exc:
        logging.warning('Editorial menu ignored: %s',exc)


def build(today=None):
    today = today or dt.datetime.now(ZoneInfo('Europe/Berlin')).date()
    snapshot = {
        'schemaVersion':3,
        'generatedAt': dt.datetime.now(dt.timezone.utc).isoformat(timespec='seconds'),
        'description':'Verified public dining menus for CampusLeaf; never student records',
        'venues':{vid:{'source':'','method':'not-published','days':{}} for vid in sorted(VENUE_IDS)},
    }
    try_eat_api(today, snapshot)
    try_werkswelt(today, snapshot)
    try_triesdorf_pdf(today, snapshot)
    apply_editorial(today, snapshot)
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(json.dumps(snapshot, ensure_ascii=False, separators=(',',':'))+'\n',encoding='utf-8')
    counts={key:len(v['days']) for key,v in snapshot['venues'].items()}
    print('CampusLeaf menu snapshot generated:', OUTPUT, 'published days:', counts)
    return snapshot


if __name__ == '__main__':
    logging.basicConfig(level=logging.INFO)
    build()
