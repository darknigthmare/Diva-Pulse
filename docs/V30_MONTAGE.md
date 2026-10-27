# V30 — Montage musical et suivi des manquants

Proposition issue de `main` **1552fd8f89a27f0914a203f2d973b3beee17f4e5**, dans la PR #1. Aucune fusion automatique.

## Nouveautés

Le Director sait aligner son curseur ou une sélection mixte (clips, caméra, lumière) sur une grille musicale. La grille intègre les changements de tempo, le décalage de partition et l'origine de grille. Les subdivisions proposées sont le quart, le triolet, le demi-temps, le temps, quatre temps et la mesure réelle ; cette dernière respecte la carte des signatures. Aligner un groupe déplace son premier événement puis conserve tous les écarts internes. Une collision ou une sortie de durée refuse la totalité de l'édition.

Les temps du Director sont des **secondes audio**. `chart.offset` convertit les secondes de partition vers les secondes audio. `chart.gridOffset` détermine l'origine de la grille dans l'axe partition. Les calculs passent par `timeToBeat`/`beatToTime` ; comparer uniquement le BPM courant ne conserve pas la phase lors d'un changement de tempo. Le choix du point le plus proche compare les distances en secondes audio, y compris à cheval sur deux tempos. Le mode libre ne quantifie pas. Un alignement ne crée pas de point hors de la chanson pour ensuite le tronquer arbitrairement.

## Clavier

Avec le focus dans le Director, hors d'un champ de saisie : Ctrl/Cmd+A sélectionne ; C copie ; V colle ; Z annule ; Maj+Z ou Y rétablit ; Ctrl/Cmd+S enregistre. Sans modificateur, Suppr/Retour arrière supprime, S scinde, G aligne et les flèches déplacent le curseur de 0,1 s. Les touches de copie/collage nécessitent bien Ctrl/Cmd. Les champs, listes, zones éditables, événements IME, touches Alt et événements répétés gardent leurs comportements natifs. Les commandes ne sont pas interceptées hors du Director.

## Scission et limites explicites

La scission travaille sur une sélection composée uniquement de clips. Chaque clip doit contenir strictement le point de coupe. La partie droite poursuit le même temps source VMD, conserve la vitesse et reçoit un ID distinct ; aucun fondu supplémentaire n'est ajouté à la coupe. La limite de 512 clips par danseur est toujours appliquée. Tout le groupe est refusé si un seul élément est invalide.

Les clips synchronisés à un BPM source et les coupes à l'intérieur d'un fondu actif sont **refusés**, pas approximés. La fusion, les trajectoires et le traitement complet du root motion restent dans le backlog. Le glisser d'un groupe n'est pas encore disponible : le glisser déplace un clip, les commandes numériques et d'alignement déplacent le groupe.

## Reprise et intégrité

La récupération efface les sélections indexées et l'historique de rétablissement devenus périmés. Une annulation revenant jusqu'à l'état initial réécrit aussi cet état dans le brouillon : l'ancienne modification ne doit plus être proposée lors d'une réouverture. `pointercancel` et la perte de capture restaurent la position du bloc sans enregistrer une édition partielle.

Un Director JSON doit déclarer `format: DIVA-PULSE-DIRECTOR`, `version: 19` et un document objet. La version du **schéma sauvegardé reste 19**, même si l'application passe en 30.0.0. Les versions futures, structures invalides et références médias absentes sont refusées avant toute écriture. Les autres formats du jeu ne sont pas migrés par cette PR.

## Exécuter les contrôles

```sh
python3 build.py
npm test
python3 tests/launcher_test.py
python3 tools/verify_release.py
python3 -m pip install -r requirements-test.txt
python3 -m playwright install --with-deps chromium
# Définir CHROMIUM_PATH si Chromium n'est pas /usr/bin/chromium.
xvfb-run -a python3 tests/v30_browser_test.py
xvfb-run -a python3 tests/v29_browser_test.py
xvfb-run -a python3 tests/v29_persistence_test.py
python3 tools/verify_pr30.py
```

Sur le banc local de cette conversation, les accès HTTP sont bloqués par l'environnement : `PULSE_DOCUMENT_MODE=1` permet seulement le parcours UI par injection du document. Le rapport marque explicitement ce mode ; il ne qualifie pas la persistance. La CI GitHub exécute le parcours HTTP/IndexedDB réel et le test de fermeture/réouverture sans ce mode. La vérification distante refuse un rapport injecté pour ces contrôles natifs.

Les 862 tests logiques incluent 52 nouveaux tests ; les scénarios comportent 18 contrôles UI V30, 23 contrôles de régression Director et 14 contrôles natifs de persistance. Les 10 contrôles du lanceur sont distincts. Les reprises d'un même scénario ne s'additionnent pas. Un viewport mobile ne certifie pas un iPhone physique ; Safari, Firefox, les manettes et le corpus MMD réel restent à qualifier.

## CI et classeur

`quality.yml` est une vérification **en lecture seule**, sans publication vers main et sans installation de dépendances applicatives. Les anciens workflows d'autopublication V28/V29 sont remplacés par des notices manuelles sans écriture. Les sources de récupération restent dans l'historique Git. Ne pas lancer `tools/apply_v29.py` sur la V30 : il s'agit d'un outil historique.

`planning/DIVA_PULSE_MANQUANTS_V30.xlsx` contient 114 lignes, 9 onglets, filtres, listes de statuts et compteurs calculés. Le JSON et le CSV voisins permettent la revue textuelle. Les descriptions provenant de l'ancienne variante locale ont été corrigées : elles ne constituent pas la preuve que cette variante est sur main. « Fait » signifie vérifié dans la portée de la ligne, pas jeu commercialement terminé.
