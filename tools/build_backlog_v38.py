#!/usr/bin/env python3
"""Build the V38 backlog from the V37 rows.

Authoring tool only: it needs openpyxl locally. The release gate reads the
resulting workbook as XML, exactly like the historical V37 gate.
"""
from pathlib import Path
import csv
import json
from collections import Counter
from openpyxl import load_workbook

R = Path(__file__).resolve().parents[1]
P = R / 'planning'
source = json.loads((P / 'BACKLOG_V37.json').read_text())
rows = [list(row) for row in source['rows']]
index = {row[0]: row for row in rows}

UPDATES = {
    'GAME-06': {
        'status': 'Fait',
        'work': "V38 : progression locale dérivée (objectifs, niveaux, modules AURORA/EMBER) calculée depuis les records, sessions et médailles d’académie, sans double crédit ni compte. Panneau bibliothèque et dialogue dédiés ; contrôles logiques et parcours navigateur.",
        'evidence': "src/progression.js ; src/app.js ; src/style.css ; tests/v38.test.cjs ; tests/v38_browser_test.py ; qa/v38/results.json ; docs/V38_FINITION_JOYABLE.md",
        'scope': "Progression locale uniquement : aucun compte, aucun cloud, aucune migration de record. Les records assistés restent séparés ; QA-07 (utilisateurs réels) reste ouvert.",
    },
    'GAME-08': {
        'status': 'Partiel',
        'work': "V38 ajoute les leçons 07 (fenêtre de timing) et 08 (concert de contrôle) aux six existantes, plus un guide calibration/sauvegarde dans l’académie. La compréhension par un nouveau joueur n’est pas testée ici.",
        'evidence': "src/academy.js ; tests/v38.test.cjs ; tests/precision.test.cjs ; tests/v38_browser_test.py",
        'scope': "Partiel : couverture des types de notes et des bases calibration/sauvegarde ; QA-07 et les appareils physiques restent ouverts.",
    },
    'ART-06': {
        'status': 'Partiel',
        'work': "V38 ajoute MIDNIGHT DRIVE et CORAL SIGNAL : cinq démos originales, cinq difficultés chacune, synthèse déterministe et provenance documentée. Les niveaux ne sont pas évalués par des joueurs.",
        'evidence': "src/core.js ; tests/v38.test.cjs ; docs/PROVENANCE_CONTENUS.md ; qa/v38/results.json",
        'scope': "Partiel : aucun média tiers ; l’évaluation humaine des 25 partitions et le corpus MAP-01 restent ouverts.",
    },
    'UX-06': {
        'status': 'Fait',
        'work': "V38 ajoute un panneau d’erreur uniforme (réessayer, copier le détail, fermer) sans modifier le texte du toast existant, et des états vides actionnables pour la recherche et la bibliothèque.",
        'evidence': "src/ui-states.js ; src/style.css ; tests/v38_browser_test.py ; qa/v38/results.json",
        'scope': "Couverture des actions passant par app.run et de la recherche ; les dialogues historiques ne sont pas tous migrés.",
    },
    'PUB-05': {
        'status': 'Partiel',
        'work': "V38 publie docs/PROVENANCE_CONTENUS.md : inventaire des contenus distribués, empreintes, références non redistribuées et écarts. La provenance des icônes PWA et la licence du dépôt restent à confirmer.",
        'evidence': "docs/PROVENANCE_CONTENUS.md ; SHA256SUMS.txt ; docs/BIBLE_DIVA_PULSE_V1.md",
        'scope': "Partiel : aucun asset final sans fiche ; icônes et licence à décider par le propriétaire.",
    },
}
for item_id, change in UPDATES.items():
    row = index[item_id]
    row[3] = change['status']
    row[6] = change['work']
    row[8] = change['evidence']
    row[10] = change['scope']

counts = dict(Counter(row[3] for row in rows))
backlog = {
    'version': '38.0.0',
    'base': 'fc8e453d102c62c75b65d9a2a33dc076d2511330',
    'columns': source['columns'],
    'rows': rows,
    'statusCounts': counts,
}
(P / 'BACKLOG_V38.json').write_text(json.dumps(backlog, ensure_ascii=False, indent=2) + '\n')
with (P / 'MANQUANTS_V38.csv').open('w', encoding='utf-8-sig', newline='') as f:
    writer = csv.writer(f)
    writer.writerow(source['columns'])
    writer.writerows(rows)

workbook = load_workbook(P / 'DIVA_PULSE_MANQUANTS_V37.xlsx')
sheet = workbook.worksheets[1]
for row in sheet.iter_rows(min_row=6, max_row=141):
    item_id = row[0].value
    if item_id in UPDATES:
        row[3].value = UPDATES[item_id]['status']
        row[6].value = UPDATES[item_id]['work']
        row[8].value = UPDATES[item_id]['evidence']
        row[10].value = UPDATES[item_id]['scope']
summary = workbook.worksheets[0]
summary['A1'] = 'DIVA PULSE / V38'
summary['A3'] = 'Finition jouable : progression locale, académie étendue, cinq démos originales et états d’erreur uniformes.\nBase main fc8e453 • V37 conservée comme historique.'
from openpyxl.workbook.properties import CalcProperties
workbook.calculation = CalcProperties(fullCalcOnLoad=True)
workbook.save(P / 'DIVA_PULSE_MANQUANTS_V38.xlsx')
print(json.dumps({'rows': len(rows), 'statusCounts': counts}, ensure_ascii=False))
