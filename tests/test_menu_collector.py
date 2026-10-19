"""Offline fixture tests for source formats; no live network claimed."""
import datetime as dt
import io
import sys
import unittest
from pathlib import Path

sys.path.insert(0,str(Path(__file__).resolve().parents[1] / 'scripts'))
import update_menus as m


class MenuTests(unittest.TestCase):
    def test_eat_payload_and_date(self):
        j = {'weeks':[{'days':[{'date':'2026-10-19','dishes':[
            {'name':'Gemüsepfanne','dish_type':'Gericht 1','labels':['VEGAN'],
             'prices':{'students':{'base_price':3.25,'price_per_unit':None}}}]}]}]}
        self.assertEqual(m.transform_eat(j,'2026-10-19')[0]['price'],3.25)
        self.assertEqual(m.transform_eat(j,'2026-10-20'),None)
        self.assertEqual(m.transform_eat({'days':[]},'2026-10-19'),None)

    def test_werkswelt_visible_date_and_prices(self):
        page = '''<html><h1>Mensateria Gastwirtschaft zum Adler Triesdorf</h1>
          <h2>Speiseplan</h2><h3>Montag 19.10.2026</h3>
          <div>Essen 1</div><div>Schweineschnitzel Wiener Art mit Kartoffelsalat</div>
          <div>3,79 € (Stud.) 4,99 € (Bed.)</div>
          <div>Essen 2</div><div>Ofenkartoffel mit Smoky BBQ-Linsen</div>
          <div>3,85 € (Stud.) 5,05 € (Bed.)</div>
          <h4>Öffnungszeiten</h4><p>11-14</p></html>'''
        date, dishes = m.parse_werkswelt_html(page)
        self.assertEqual(date,'2026-10-19')
        self.assertEqual(len(dishes),2)
        self.assertEqual(dishes[0]['price'],3.79)
        self.assertIn('Ofenkartoffel',dishes[1]['name'])
        self.assertEqual(m.parse_werkswelt_html('<h2>nothing</h2>'),(None,[]))

    def test_pdf_discovery_restricted_to_operator_domain(self):
        page='<a href="/web/content/22575/2026%20Speiseplan%20KW%2038.pdf">Aktuelles Menü</a>'
        self.assertIn('triesdorf.de/web/content',m.discover_pdf_link(page))
        self.assertIsNone(m.discover_pdf_link('<a href="https://example.com/menus.pdf">Speiseplan</a>'))

    def test_pdf_table_week_mapping(self):
        from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph
        from reportlab.lib.styles import getSampleStyleSheet
        from reportlab.lib import colors
        doc = io.BytesIO()
        p = SimpleDocTemplate(doc, pagesize=(900,700), topMargin=30, leftMargin=20, rightMargin=20)
        table = Table([
            ['KW 43','MONTAG','DIENSTAG','MITTWOCH','DONNERSTAG','FREITAG'],
            ['Menü I','Kürbissuppe','Falafel','Pasta','Schnitzel','Curry'],
            ['Menü II','Apfelkuchen','Salat','Reis','Fisch','Gnocchi'],
        ],colWidths=[110]+[140]*5,rowHeights=37)
        table.setStyle(TableStyle([('GRID',(0,0),(-1,-1),1,colors.black)]))
        p.build([Paragraph('Speiseplan 19.10.2026 – 23.10.2026',getSampleStyleSheet()['Title']),table])
        r=m.parse_triesdorf_pdf(doc.getvalue())
        self.assertEqual(len(r),5)
        self.assertEqual(r['2026-10-19'][0]['name'],'Kürbissuppe')
        self.assertEqual(r['2026-10-23'][1]['name'],'Gnocchi')

    def test_editorial_unverified_dates_rejected(self):
        import tempfile, json
        original=m.MANUAL
        with tempfile.TemporaryDirectory() as td:
            f=Path(td)/'editorial.json'
            f.write_text(json.dumps({'venues':{'espressobar-weihenstephan':{
                'source':'https://example.org/real',
                'days':{'2026-10-20':[{'name':'Published coffee', 'price':2.0}],
                        '2025-10-20':[{'name':'Last year','price':2.0}]}}}}))
            m.MANUAL=f
            snapshot={'venues':{vid:{'source':'','days':{}} for vid in m.VENUE_IDS}}
            m.apply_editorial(dt.date(2026,10,19),snapshot)
            days=snapshot['venues']['espressobar-weihenstephan']['days']
            self.assertEqual(list(days),['2026-10-20'])
            m.MANUAL=original


if __name__=='__main__':
    unittest.main()
