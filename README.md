# DIVA PULSE — V29 « Montage & sauvegardes »

Jeu de rythme local avec partitions automatiques/manuelles, import de médias, scène 3D, import MMD et Director éditable. Cette version reprend l’archive complète V28 : elle ne remplace pas le projet par une démonstration simplifiée.

## Jouer

Télécharger le dépôt, extraire son contenu puis lancer **LANCER_WINDOWS.bat** sous Windows, ou **LANCER_MAC_LINUX.command** sous macOS/Linux. Python 3 est nécessaire au serveur local. Autre possibilité :

```sh
python3 lancer.py
```

Le lanceur sert le jeu sur une origine locale stable. Le double-clic sur `DIVA_PULSE_JOUER.html` conserve un mode autonome, mais ne garantit pas les mêmes possibilités de stockage/hors-ligne que le serveur local. Exporter régulièrement un `.pulsebundle` ; le stockage du navigateur n’est pas une sauvegarde externe.

Pour reconstruire le HTML à partir de `src/` :

```sh
python3 build.py
npm test
python3 tools/verify_release.py
```

Node 22 ou plus récent est utilisé pour la suite logique. Le jeu compilé ne dépend d’aucun CDN.

## Suivi des manquants

**[Classeur Excel complet](docs/DIVA_PULSE_SUIVI_COMPLET.xlsx)** — 7 onglets, 90 sujets suivis : 88 encore ouverts, 1 validation limitée à Chromium et 1 option cloud hors du cœur hors ligne. Chaque sujet contient priorité, état, travaux précis, critère d’acceptation, dépendances, preuve et périmètre.

Le classeur contient aussi 12 livraisons V29, les 58 constats de l’audit V28 conservés comme historique, la matrice de compatibilité MMD et les preuves de tests. Les compteurs de synthèse sont calculés ; ils ne constituent pas un pourcentage de « jeu terminé ».

Compagnons lisibles dans Git : [JSON](docs/suivi-v29.json), [CSV](docs/suivi-v29.csv), [rapport V29](docs/RAPPORT_V29.md).

## Nouveautés réellement livrées en V29

Le Director permet de sélectionner plusieurs clips et clés de caméra/lumière, de les copier/coller au curseur, les décaler ensemble ou les supprimer. Le collage conserve les écarts temporels et les pistes d’origine. L’annulation/rétablissement est conservé. Une collision ou une sortie de durée refuse l’ensemble de l’opération, sans modification partielle.

Une grille de curseur propose libre, demi-temps, temps et quatre temps au BPM courant. Ce n’est pas encore une grille musicale complète à métriques variables.

L’enregistrement du spectacle et l’invalidation de son brouillon se font dans une même transaction. Un refus garde la scène sauvegardée intacte ; un brouillon appliqué ne réapparaît plus à la réouverture ni dans l’export portable. Le bandeau d’état ne masque plus les commandes du Director. Les contrôles de montage restent utilisables sans débordement horizontal dans le viewport Chromium de 390 × 844 testé.

## Vérifications exécutées

| Campagne | Résultat | Preuve |
|---|---:|---|
| Logique V29 | 810 / 810 | [TAP](qa/v29/logic.tap) |
| Director, UI et rendu WebGL2 | 23 / 23 | [JSON](qa/v29/director/results.json) |
| Stockage natif, deux fenêtres et hors-ligne | 14 / 14 | [JSON](qa/v29/persistence/results.json) |
| Lanceur local | 10 / 10 | [Journal](qa/v29/launcher.txt) |

[Exécution GitHub Actions relue](https://github.com/darknigthmare/Diva-Pulse/actions/runs/40498154007).
Les 782 tests logiques V28 sont inclus dans les 810. Les anciennes campagnes navigateur sont conservées, pas revendiquées comme rejouées. Les 14 contrôles natifs ont été exécutés en CI Chromium Linux avec vrai HTTP, IndexedDB, profil persistant, Web Locks et service worker. Un viewport mobile n’est pas un iPhone réel.

## Limites encore ouvertes

L’import ne garantit pas que n’importe quel modèle MMD téléchargé fonctionnera parfaitement. Les corpus externes autorisés, les rigs complexes, la physique complète, le retargeting avancé, le lipsync phonétique et plusieurs effets MMD demandent encore du travail. AutoMap et AutoShow restent à évaluer humainement sur des musiques variées. Safari/iPhone, manettes physiques, latence matérielle et endurance ne sont pas certifiés par cette passe.

Le projet et le suivi sont publiés ; le jeu n’est pas présenté comme fini, universellement compatible ou prêt à commercialiser. Les droits de chaque média externe restent à documenter avant redistribution.

## Organisation

`src/` : sources ; `tests/` : tests ; `examples/` : exemples récupérés ; `qa/` : preuves datées ; `docs/` : formats, rapports et suivi. Les documents anciens conservent leur numéro de version et ne décrivent pas nécessairement le dernier état.
