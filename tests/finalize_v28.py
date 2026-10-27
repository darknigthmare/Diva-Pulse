from pathlib import Path
import json,hashlib,re,subprocess,importlib.metadata
R=Path(__file__).resolve().parents[1];Q=R/'qa/v28'
sha=hashlib.sha256((R/'index.html').read_bytes()).hexdigest();assert (R/'index.html').read_bytes()==(R/'DIVA_PULSE_JOUER.html').read_bytes()
commands=json.loads((Q/'release-commands.json').read_text());assert commands['htmlSha256']==sha;assert len(commands['commands'])==11;assert all(c['returncode']==0 for c in commands['commands'])
unittext=(Q/'logic-final.txt').read_text();passed=int(re.search(r'^# pass (\d+)',unittext,re.M)[1]);failed=int(re.search(r'^# fail (\d+)',unittext,re.M)[1]);assert failed==0
suites=[]
for directory in ['features','playback','regression-v20','regression-v24','regression-v25','regression-v26','regression-v27']:
 file=Q/directory/'browser-final.json';d=json.loads(file.read_text());assert d['buildSha256']==sha;assert not d.get('failure') and not d.get('failed') and not d.get('errors') and not d.get('uncaughtErrors');suites.append({'name':directory,'passed':d['passed'],'path':file.relative_to(R).as_posix()})
native=json.loads((Q/'native-final.txt').read_text().strip().splitlines()[-1]);assert native['buildSha256']==sha and native['passed']==4 and not native['errors'];assert 'TOTAL 10 PASS' in (Q/'launcher-final.txt').read_text()
base=json.loads((Q/'base-integrity.json').read_text())
summary={'version':'28.0.0','htmlSha256':sha,'base':base,'unit':{'passed':passed,'failed':failed,'new':passed-745},'browserTotal':sum(d['passed'] for d in suites),'browserSuites':suites,'nativeMMD':4,'launcher':10,'commands':commands['commands'],'environment':{'node':subprocess.check_output(['node','--version'],text=True).strip(),'chromium':subprocess.check_output(['/usr/bin/chromium','--version'],text=True).strip(),'playwright':importlib.metadata.version('playwright'),'renderer':'SwiftShader software WebGL2','storage':'temporary, injected document'},'notValidated':['Native IndexedDB after full browser shutdown','Native multi-tab persistence and locks','Physical GPU, MIDI or gamepad','Safari/iPhone','Full offline installation','Universal MMD/Bullet/soft bodies']}
(Q/'validation-summary.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2)+'\n')
(Q/'native-storage-probes.json').write_text(json.dumps({'validated':False,'attempts':[{'target':'loopback HTTP owned test server','result':'ERR_BLOCKED_BY_ADMINISTRATOR before document navigation'},{'target':'locally fulfilled synthetic HTTPS test origin','result':'ERR_BLOCKED_BY_ADMINISTRATOR before document navigation'}],'conclusion':'Browser navigation was blocked; UI tests use set_content and cannot demonstrate native IndexedDB durability. The HTTP launcher is tested separately using the Python client.'},indent=2)+'\n')
report=f'''# DIVA PULSE V28 — Rapport de vérification

## Base et traçabilité

Reprise réelle depuis `{base['baseArchive']}` : SHA-256 `{base['sha256']}`. Le ZIP V27 et ses {base['verifiedHashes']} empreintes ont été vérifiés. Les captures de la tentative V28 précédente ont été retrouvées, mais pas son code ; les améliorations ont été reconstruites sans supposer qu’elles étaient disponibles.

HTML livré : **{(R/'index.html').stat().st_size} octets**, SHA-256 **`{sha}`**. `index.html` et `DIVA_PULSE_JOUER.html` sont identiques. Les sept suites navigateur et le diagnostic MMD ci-dessous sont liés à cette empreinte.

## Résultats exécutés sur cette version

| Contrôle | Résultat | Preuve |
|---|---:|---|
| Logique historique + {summary['unit']['new']} nouveaux tests | {passed}/{passed} | qa/v28/logic-final.txt |
| Parcours V28 — brouillons et archives | {suites[0]['passed']}/{suites[0]['passed']} | qa/v28/features/browser-final.json |
| PV, pause/reprise, Autoplay et panne physique | {suites[1]['passed']}/{suites[1]['passed']} | qa/v28/playback/browser-final.json |
| Auto Show V20 rejoué | {suites[2]['passed']}/{suites[2]['passed']} | qa/v28/regression-v20/browser-final.json |
| Héritages, IK, motion et stockage V24 rejoués | {suites[3]['passed']}/{suites[3]['passed']} | qa/v28/regression-v24/browser-final.json |
| Visage et archives V25 rejoués | {suites[4]['passed']}/{suites[4]['passed']} | qa/v28/regression-v25/browser-final.json |
| Reconnaissance et reprise V26 rejouées | {suites[5]['passed']}/{suites[5]['passed']} | qa/v28/regression-v26/browser-final.json |
| Physique V27 rejouée | {suites[6]['passed']}/{suites[6]['passed']} | qa/v28/regression-v27/browser-final.json |
| Diagnostic natif PMX/VMD WebGL2 | 4/4 | qa/v28/native-final.txt |
| Lanceur/serveur HTTP | 10/10 | qa/v28/launcher-final.txt |

Total navigateur : **{summary['browserTotal']} contrôles**, répartis sur sept suites, pas {summary['browserTotal']} appareils. Les autres suites historiques conservées ne sont pas annoncées comme réexécutées. Le total navigateur n’est donc pas une accumulation des résultats V27.

## Continuité physique mesurée

`tests/v28_timing_benchmark.cjs` charge le code réellement livré en V27, conservé dans `tests/reference/secondary-physics-v27.js`, et le compare au nouveau code. Sur un pendule original de deux corps, cible fixe, deux secondes à 5 appels de rendu/s : **V27 = 11 réinitialisations / 0 pas ; V28 = 1 initialisation / 120 pas**. La rotation finale V28 correspond à celle obtenue à 60 appels/s dans ce scénario.

Les tests couvrent aussi une cible cinématique linéaire, la dette de simulation, son rattrapage, une pause avec dette, la limite de 12 pas par appel, un vrai saut, le retour arrière, l’indépendance des mondes et leur libération. Les cibles sont conservées à part du tableau fourni par l’animation.

Il ne s’agit pas d’un benchmark de débit graphique. Le solveur ne devient pas Bullet et ne gagne pas une validation sur corps souples ou contacts complexes. Les écarts de rendu inférieurs à une seconde peuvent encore accumuler du retard si les calculs ne suivent pas. Une surcharge supérieure à une seconde est diagnostiquée et réinitialisée.

## Récupération et archives vérifiées de bout en bout

Le parcours importe un PMX/VMD original, change les paramètres dans le panneau, ferme, rouvre et reprend le brouillon explicitement. La scène enregistrée et les charts restent identiques. La gravité récupérée est observée dans la simulation réelle du renderer.

Les écritures sont ensuite refusées volontairement. La nouvelle version du brouillon reste en mémoire et apparaît dans l’export `.pulsebundle` et `.pulsepack`. La restauration en copies réassocie le brouillon au nouveau morceau et à son pack. Le personnage est rechargé et simulé, puis le brouillon est publié explicitement. La scène et la clôture du brouillon sont une seule transaction.

Le rejet d’un propriétaire absent est vérifié avant confirmation de restauration. Les tests unitaires refusent aussi les doublons, métadonnées invalides, paramètres absents et curseurs hors durée. Un état de suppression plus récent empêche la réapparition d’une ancienne récupération.

Les captures de la modale à 390×844 et en bureau sont incluses. Leur largeur et les débordements sont contrôlés ; cela n’est pas un test sur iPhone physique.

## Essais préliminaires et adaptations des oracles

Les premiers essais longs en grande fenêtre logicielle ont été interrompus par leur délai d’exécution ; ils ne sont pas comptés comme réussites. La passe finale des contrôles physiques utilise 1000×800, et la partie avec audio 800×520.

La première reprise du contrôle V24 exigeait encore littéralement « V27 » dans le titre. Cet oracle de version a été corrigé en « V28 », sans assouplir les assertions de comportement. Son échec est conservé dans `qa/v28/attempts/`. Le contrôle de refus d’écriture V27 injecte maintenant l’échec dans `atomic()` plutôt que `put()`, car la publication de la scène utilise désormais une transaction à deux lignes.

Aucune exception JavaScript non interceptée et aucun échec de boucle de rendu n’apparaissent dans les sorties finales. Les refus d’écriture et de solveur injectés délibérément restent des cas de tests, pas des opérations réussies en secret.

## Environnement et limites

{summary['environment']['node']} ; {summary['environment']['chromium']} ; Playwright {summary['environment']['playwright']} ; Xvfb ; **WebGL2 logiciel SwiftShader**.

Deux sondes de navigation navigateur ont été bloquées par l’infrastructure avant chargement du document. Les suites utilisent donc l’injection du HTML exact dans un document temporaire, comme les précédentes. Le lanceur HTTP est vérifié séparément par un client Python. **La persistance native IndexedDB après fermeture et le verrouillage multi-fenêtres natif ne sont pas certifiés.** Voir `qa/v28/native-storage-probes.json`.

Les appareils physiques, Safari/iPhone, installation PWA complète, grands modèles MMD variés, retargeting, corps souples et fidélité intégrale Project DIVA restent ouverts. La dynamique reste désactivée par défaut. Le fichier `AUDIT_V28.md` distingue les fonctions conservées, améliorations de cette passe et chantiers non terminés.

## Livraison

Le ZIP est relu et toutes ses empreintes internes sont contrôlées avant transfert. Le dépôt Drive fait l’objet d’un reçu séparé, seulement après retour des envois et relecture des métadonnées. Le dépôt n’héberge pas le jeu et ne synchronise pas le stockage local. Aucun partage public ni déploiement de site n’est effectué.
'''
(R/'RAPPORT_V28.md').write_text(report)
print(json.dumps({'htmlSha256':sha,'unit':passed,'browser':summary['browserTotal'],'native':4,'launcher':10}))
