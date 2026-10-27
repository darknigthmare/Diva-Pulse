# DIVA PULSE V24 — Rapport de vérification

Date : 7 octobre 2026. Base : archive V23 complète, extraite sans modification de l’original.
Version : **24.0.0 — Squelettes, tempo et sauvegardes**.
HTML autonome / index : **716882 octets**, strictement identiques.

**SHA-256 du HTML réellement exécuté :** `d3435fc9cdc9136f252bd088b5566b403f724ada48b7817eff34c1416ace17d3`

## Résultats exécutés

| Suite | Résultat | Journal / preuve |
|---|---:|---|
| Logique complète, dont 55 nouveaux tests | 603/603 | `qa/v24/logic-final.txt` |
| Nouveaux parcours V24 | 35/35 | `qa/v24/features/browser-final.json` |
| Parcours de fiabilité V23 repris sur V24 | 39/39 | `qa/v24/regression-v23/browser-final.json` |
| Surfaces et Motion Sync V22 repris sur V24 | 28/28 | `qa/v24/regression-v22/browser-final.json` |
| Import/troupe MMD V21 repris sur V24 | 44/44 | `qa/v24/regression-v21/browser-final.json` |
| Auto Show V20 repris sur V24 | 57/57 | `qa/v24/regression-v20/browser-final.json` |
| Diagnostic PMX/VMD avec WebGL2 | 4/4 | `qa/v24/v24_native_mmd_browser.py.log` |
| Lanceur et serveur Python | 10/10 | `qa/v24/launcher-results.json` |

Les **203 contrôles navigateur** sont les vérifications de cinq parcours sur le même HTML, pas 203 appareils ni 203 sessions humaines indépendantes. Les tests historiques n’ont pas été simplement recopiés : leurs scripts V24 relisent ce HTML et leurs journaux portent cette empreinte.

Les tests sont automatisés. Ce total n’est ni une certification sans défaut ni une preuve de compatibilité universelle avec tous les modèles MMD, musiques et contrôleurs.

## Squelette et rendu effectivement contrôlés

- PMX original binaire à héritage de rotation et de translation importé via l’interface ; aperçu WebGL distinct puis import dans le morceau, sans modifier les partitions.
- Le modèle chargé reçoit réellement les transformations attendues : à 0,25 s, l’os suiveur hérite d’environ 0,2 unité en X et 0,4 radian en Z. Les valeurs sont lues dans les os du renderer.
- Revenir à zéro annule l’héritage ; répéter le même instant ne l’accumule pas.
- Une limite XYZ d’un lien IK est appliquée au quaternion du squelette effectivement utilisé. Les tests de logique vérifient séparément les conversions de repère et bornes binaires PMX.
- Les dépendances, ratios négatifs et cycles d’append sont couverts par les tests de logique.
- La reprise V23 exécute aussi les 36 comparaisons CPU/GPU SDEF/QDEF/LBS précédentes, la réutilisation de palette, les morphs et la reconstruction après perte réelle de contexte.

Le sous-ensemble d’héritage standard n’inclut pas les héritages locaux/monde, l’ordre complet après IK/physique ou les axes spécifiques. Les limites XYZ et le budget de 32 itérations ne remplacent pas le comportement exhaustif de MMD Desktop.

## Propositions de tempo, protection du manuel et sauvegardes

Le parcours lit le VMD importé, détecte son cycle synthétique d’une seconde et propose plusieurs interprétations (60, 120, 240 BPM). L’analyse seule ne modifie ni la scène ni les notes. Sélectionner une proposition remplit le formulaire ; annuler conserve la scène. Enregistrer 120 BPM transmet bien ce tempo aux clips automatiques du renderer.

Un montage ensuite rendu manuel à 120 BPM reste intact lorsqu’on règle son fichier source à 90 BPM. L’export et la restauration en copie remappent les références : le modèle est rechargé avec le calage manuel conservé et le profil source distinct.

Un refus d’écriture en lecture seule est provoqué dans le vrai Store ; la scène reste inchangée, le dialogue permet de réessayer et l’export complet reste possible. Les réglages d’horloge et le remappage clavier sont également refusés sans promesse non interceptée ni changement conservé à tort. Les erreurs volontairement provoquées restent dans les journaux.

L’API de quota/protection est volontairement remplacée par une API qui refuse ses appels : le diagnostic devient partiel sans casser le jeu. Les dimensions du panneau et des propositions sont contrôlées à 390 × 844 pixels, avec captures inspectées.

## Limites de la vérification du stockage

Les tests utilisent Chromium + Xvfb + **WebGL2 logiciel SwiftShader**, et non un GPU physique. La navigation locale du navigateur est bloquée dans cette infrastructure ; le HTML exact est injecté dans un document de test. Son origine ne permet pas IndexedDB : le stockage des parcours est **TEMPORAIRE**.

La logique de réservation Web Locks est testée dans deux contextes JavaScript distincts qui partagent un gestionnaire de verrous simulé : un seul écrivain, lecture seule pour l’autre, libération à la sortie puis nouveau droit d’écriture. Le parcours UI force l’état lecture seule pour vérifier les erreurs, les reprises et l’export. **Cela ne valide pas l’exécution native IndexedDB/Web Locks dans plusieurs fenêtres, ni la persistance après fermeture.**

Le serveur HTTP est testé séparément via des requêtes Python réelles. Il sert le HTML exact et garde une adresse stable. Les caches et manifest conservés ne constituent pas une certification de l’installation PWA complète. Safari/iPhone, les manettes et MIDI physiques restent non exécutés.

## Corpus AutoMap et mesures

Cinq WAV de seize secondes ont été synthétisés avec des attaques annotées : binaire, ternaire, swing, passage 120 → 150 BPM et pause silencieuse. Sur ces signaux simples, précision et rappel des attaques sont de 1 ; l’erreur absolue moyenne varie d’environ **0,85 à 0,91 ms**. Les cinq familles passent les contraintes internes et l’héritage des notes. La pause reste vide.

Ces mesures figurent dans `qa/v24/audio-corpus.json`. Elles concernent des impulsions connues, pas des chansons mixées ni un jugement humain sur l’agrément du mapping. La V24 ajoute ce banc d’essai ; elle conserve l’algorithme de génération V23. Une difficulté peut garder la même densité que la précédente lorsque les attaques ne justifient pas d’en ajouter.

## Défauts détectés pendant cette passe

1. La proposition théorique à 240 BPM était exclue après une petite erreur numérique de périodicité. La présentation au dixième de BPM évite cette fausse précision ; le parcours est rejoué avec les alternatives attendues. Le premier journal échoué est conservé comme historique.
2. Un appel de vérification interrompu avant son rapport final n’est pas compté. Les parcours complets listés ci-dessus sont les exécutions ultérieures terminées.
3. Le lanceur affichait encore la version statique 23.0.0. Il lit maintenant `VERSION.txt` ; les dix contrôles HTTP sont rejoués et passent. Le premier journal échoué est conservé.

## Chantiers non clôturés

Bullet et corps souples, MME/matériaux exhaustifs, retargeting des proportions et appuis des pieds, visèmes, modèles finalisés, reconnaissance acoustique des réencodages, catalogue réseau, grandes sauvegardes en streaming, fidélité des règles SEGA et évaluation de vrais morceaux restent ouverts. L’audit réévalue les 40 constats V23 et ajoute les constats de cette livraison sans qualifier le projet de terminé.

## Reproduction et livraison

`python build.py` reconstruit un HTML autonome sans CDN. `node --test tests/*.test.cjs` exécute la logique. Les scripts `tests/v24*_browser*.py` portent la vérification graphique ; `tests/run_v24_verification.py` les orchestre. `python tests/launcher_test.py` teste le serveur.

L’intégrité du ZIP et du manifeste interne est contrôlée avant transfert. Le résultat Google Drive est confirmé séparément par l’action d’envoi et la relecture des noms, tailles et parents. Ni la création d’un dossier ni ce rapport ne constituent à eux seuls une preuve que le ZIP a été transféré. Aucun partage public et aucun déploiement ne sont demandés.
