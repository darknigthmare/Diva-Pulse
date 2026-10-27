"""Compile release evidence from executed logs. No synthetic success counters."""
from pathlib import Path
import hashlib,json,re
R=Path(__file__).resolve().parents[1];Q=R/'qa/v27';H=hashlib.sha256((R/'index.html').read_bytes()).hexdigest()
commands=json.loads((Q/'release-exits.json').read_text());assert len(commands)==11 and all(c['returncode']==0 for c in commands),commands
assert (R/'index.html').read_bytes()==(R/'DIVA_PULSE_JOUER.html').read_bytes()
unit=int(re.search(r'^# pass (\d+)$',(Q/'logic-final.txt').read_text(),re.M)[1]);assert '# fail 0' in (Q/'logic-final.txt').read_text()
rows=[]
for name in ['features','playback']+[f'regression-v{i}' for i in range(20,27)]:
 d=json.loads((Q/name/'browser-final.json').read_text());assert d['buildSha256']==H,(name,'hash mismatch');assert not d.get('failure') and not d.get('failed',0) and not d.get('errors'),(name,d)
 rows.append({'name':name,'passed':d['passed'],'path':str((Q/name/'browser-final.json').relative_to(R))})
native=json.loads((Q/'native-final.txt').read_text().strip().splitlines()[-1]);assert native['buildSha256']==H and not native['errors'];assert 'TOTAL 10 PASS' in (Q/'launcher-final.txt').read_text()
assert (Q/'playback-final.exit').read_text().strip()=='0'
summary={'version':'27.0.0','htmlSha256':H,'htmlBytes':(R/'index.html').stat().st_size,'unit':{'passed':unit,'failed':0},'browserTotal':sum(x['passed'] for x in rows),'browserSuites':rows,'nativeMMD':native['passed'],'launcher':10,'commands':commands,'playback':{'path':'tests/v27_playback_browser_test.py','returncode':0,'htmlSha256':H},'limits':['Secondary PBD approximation, not Bullet','Synthetic models, SwiftShader, temporary document','Large software-rendered viewport triggered slow-frame resets','Native IndexedDB durability and real devices not certified']}
(Q/'validation-summary.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2)+'\n')
bm=json.loads((Q/'benchmark-final.json').read_text());largest=bm['samples'][-1];audit=json.loads((R/'AUDIT_V27.json').read_text());audit['testedHtmlSha256']=H;(R/'AUDIT_V27.json').write_text(json.dumps(audit,ensure_ascii=False,indent=2)+'\n')
text=f'''# DIVA PULSE V27 — Rapport de vérification

## Traçabilité

Base : archive V26 complète fournie dans la conversation, extraite sans modifier l’original. SHA-256 de la base : `{audit['baseArchiveSha256']}`.

Version **27.0.0 — Dynamique secondaire & diagnostics**. Les deux HTML reconstruits sont identiques, **{summary['htmlBytes']} octets**. Empreinte du HTML testé :

`{H}`

Les suites graphiques ci-dessous ont toutes été réexécutées sur ces octets. Les journaux et captures antérieurs conservés ne sont pas recomptés comme validations V27. Le script `tests/v27_make_report.py` vérifie les codes de sortie, empreintes et compteurs ; il refuse un assemblage de preuves incompatibles.

## Résultats finaux

| Ensemble | Résultat | Preuve |
|---|---:|---|
| Logique historique et V27 | {unit}/{unit} | `qa/v27/logic-final.txt` |
| Nouveaux contrôles d’import, aperçu, réglages et archive | {rows[0]['passed']}/{rows[0]['passed']} | `qa/v27/features/browser-final.json` |
| Lecture PV/Autoplay avec dynamique, pause et défaut provoqué | {rows[1]['passed']}/{rows[1]['passed']} | `qa/v27/playback/browser-final.json` |
'''
for row in rows[2:]:text+=f"| Reprise du parcours {row['name'].replace('regression-','').upper()} sur V27 | {row['passed']}/{row['passed']} | `{row['path']}` |\n"
text+=f'''| Diagnostic PMX/VMD WebGL2 | {native['passed']}/{native['passed']} | `qa/v27/native-final.txt` |
| Lanceur et serveur local | 10/10 | `qa/v27/launcher-final.txt` |

**{summary['browserTotal']} contrôles navigateur** au total, répartis en neuf suites, et non autant de machines différentes. La suite de logique comprend les 711 tests V26 et 34 nouveaux contrats physiques.

## Ce que les tests physiques prouvent

Les lecteurs sont exercés sur de vrais octets PMX et PMD originaux : nombres de corps et articulations, références d’os, positions PMD relatives, conversion du repère et limites. Les masses/dimensions invalides, nombres non finis, tables tronquées et index absents sont refusés. Les types non exécutés et les budgets sont annoncés.

Le solveur positionnel natif applique la gravité à un petit pendule articulé, conserve son pivot et restitue des transformations finies. Les scénarios couvrent le mode d’alignement sur l’os, les contacts sphère/boîte/capsule, le sol facultatif, les masques de collision, les limites angulaires, l’influence zéro, l’indépendance des danseurs, la libération des états, la pause, le retour et le saut temporel. La pose source et les données du modèle ne sont pas réécrites.

Les affichages synthétiques 30, 60 et 120 Hz convergent vers les mêmes 120 pas de simulation pour deux secondes. Un pendule est simulé pendant **60 secondes / 3 600 pas**, avec valeurs finies et pivot contrôlé. Cela ne prouve pas la stabilité de toutes les chaînes PMX.

Dans le vrai renderer, l’import fait parvenir les deux corps et leur articulation au modèle. Le panneau fait changer un os visible, puis la pause conserve la pose. Annuler remet le moteur en lecture animée sans simulation. Une écriture volontairement refusée préserve l’ancien morceau et laisse les champs à réessayer. L’export `.pulsebundle` et sa restauration conservent les réglages, remappent les médias et permettent de recharger puis de simuler la copie.

## Lecture et défaillance

Un WAV original de huit secondes est décodé et joue avec le PMX physique. Le test constate une rotation physique dans un véritable frame de PV ; il attend que le renderer ait atteint l’instant de pause avant de comparer l’immobilité. Après reprise, le PV atteint la fin sans créer de score. Une partie Autoplay avec l’option active termine à **100 %**, sans modifier les notes.

Le parcours injecte ensuite une exception dans le solveur : celle-ci est visible dans le diagnostic, le monde est libéré et l’échec est verrouillé au lieu d’être réessayé à chaque image. Une réinitialisation explicite permet de repartir. Aucun événement JavaScript non intercepté ni erreur de frame de l’application n’apparaît dans les résultats finaux.

## Limite importante observée en rendu logiciel

Le premier parcours en 1280×900 sous SwiftShader a déclenché trop de remises à zéro pour accumuler la simulation attendue dans le délai. Ce n’est pas effacé du rapport : `playback-large-viewport.txt` et les relevés de `playback/debug-game.json` conservent le diagnostic. La grande fenêtre logicielle n’est pas déclarée validée pour une physique fluide.

Le parcours final complet utilise une fenêtre **800×520**. Des resets restent possibles ; la validation établit le fonctionnement et la reprise, pas une cadence garantie. La simulation réinitialise au-delà d’environ 133 ms pour éviter un rattrapage sans borne. En cas de saccades, réduire la charge ou désactiver l’option. Un GPU physique et une collection réelle de personnages restent à tester.

Une assertion intermédiaire observait la pose dans un autre frame que celui signalé par l’attente ; elle a été remplacée par un échantillon atomique du renderer. La pause est observée après le dernier rattrapage à son horodatage. Ces changements de test ne déplacent pas les horloges de production.

## Performance synthétique

Le banc Node compare des ensembles indépendants de 2, 16, 64 et 128 corps. Les paires éloignées sont écartées avant la projection des collisions. Pour le scénario 128 corps / 64 joints / 6 itérations, cette exécution a mesuré une médiane de **{largest['medianMs']:.2f} ms par pas**, et un 95e percentile de **{largest['p95Ms']:.2f} ms**.

Mesure indicative sous Node, une exécution synthétique, sans rendu ni simulation de vêtements imbriqués. Ce n’est ni une comparaison contrôlée à Bullet, ni un engagement à 60 images par seconde sur appareil réel. Les logs avant optimisation ne sont pas un benchmark statistique A/B.

## Défauts corrigés pendant les essais

Le diagnostic physique était caché dans un détail replié : un résumé est maintenant visible avant confirmation. Le nouveau dialogue débordait en portrait : largeur et boutons sont bornés, contrôlés à 390×844.

L’arrêt de l’animation des danseurs masqués a cassé deux anciens contrôles de chorégraphie/horloge : la pose animée est rétablie, seule la simulation invisible est arrêtée. Le bouton Autoplay était bloqué par le pied de page à 800×520 après un PV : son flux a été corrigé, sans forcer le clic dans le test. Une ancienne assertion de titre cherchait « Reconnaissance » ; seule son étiquette de release a été adaptée.

Les échecs intermédiaires demeurent dans `qa/v27/initial-regressions/` et les logs de développement. Seuls les résultats finaux listés plus haut sont comptés.

## Portée et travaux ouverts

**Ce n’est pas Bullet.** Solveur positionnel secondaire, masses angulaires scalaires, collisions approchées ; pas de tenseur d’inertie complet, de détection continue, de corps souples, de morphs d’impulsion ou d’interactions entre danseurs. Une boîte/capsule dynamique est remplacée par une enveloppe sphérique. Les articulations spéciales et le pipeline complet après-physique ne sont pas reproduits.

Les PMX/PMD sont des originaux de diagnostic, pas un échantillon représentatif de tous les modèles téléchargés. La fidélité universelle à MMD ou Project DIVA n’est pas certifiée.

Les essais graphiques utilisent Chromium, Playwright, Xvfb et **SwiftShader logiciel**. La navigation loopback est bloquée par l’environnement ; le HTML est injecté tel quel dans un document, son stockage est **TEMPORAIRE**. Les réponses HTTP du lanceur sont testées séparément. Pas de validation native IndexedDB après fermeture, de vraie coordination inter-fenêtres, de Safari/iPhone, de MIDI/manette physiques ou d’installation PWA complète.

## Livraison

Le manifeste interne couvre les fichiers réellement archivés sauf lui-même. Le ZIP est relu et chaque empreinte vérifiée avant transfert. Le dépôt Google Drive doit être confirmé séparément par ses résultats, la relecture du dossier et le reçu local. Aucun partage public, changement de site ou synchronisation du navigateur n’est demandé ni ajouté.
'''
(R/'RAPPORT_V27.md').write_text(text)
print(json.dumps({'unit':unit,'browser':summary['browserTotal'],'native':native['passed'],'launcher':10,'hash':H},indent=2))
