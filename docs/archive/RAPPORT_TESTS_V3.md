# DIVA PULSE V3 — Rapport de tests et limites

Version 3.0.0 · 6 octobre 2026 · Performance & Creator Edition.

Base de travail : archive `DIVA_PULSE_V2_STAGE_EDITION_COMPLET.zip` fournie dans la conversation. La livraison V3 reprend et modifie ces sources. Aucun site existant n’a été modifié ou redéployé.

## Résultat de la passe finale

**99 tests moteur réussis sur 99 ; 101 vérifications navigateur réussies sur 101.** Zéro erreur JavaScript non interceptée dans les trois suites navigateur finales. Ces nombres décrivent les cas exécutés, pas une certification d’absence universelle de bugs ou de fidélité 1:1.

| Suite | Réussis | Échecs | Preuve fournie |
|---|---:|---:|---|
| Moteur V2 conservé + fonctions V3 | 99 | 0 | `qa/all-core-v3.tap` |
| Parcours de non-régression | 32 | 0 | `qa/regression-v3.json` |
| Média / contrôles avancés | 19 | 0 | `qa/advanced-results.json` |
| Nouveaux parcours V3 | 50 | 0 | `qa/creator-browser-results.json` |

Le journal séquentiel final est `qa/FINAL_BROWSER_SUITES.log`. Les anciens rapports V2, lorsqu’ils sont conservés, se trouvent explicitement dans `qa/archive-v2/` et `docs/archive/`. Ils ne sont pas utilisés comme preuve d’exécution V3.

## Environnement et mode d’exécution

Node 22.16.0 ; Python/Playwright ; Chromium 144.0.7559.96 sous Linux, Xvfb et GPU logiciel SwiftShader. Le serveur localhost et la navigation de fichier étaient bloqués par la politique du navigateur de l’environnement. Aucune politique n’a été modifiée. Le HTML a été exécuté via `set_content`, sur une origine opaque. Sans affichage Xvfb fonctionnel, le GPU logiciel ne donnait pas de contexte WebGL2 ; le fallback sans 3D restait jouable. Les suites 3D finales ont utilisé Xvfb.

Cela teste les scripts, la structure DOM, les contrôles, les médias, les shaders et le rendu WebGL réel. Cela **ne certifie pas** l’installation locale, les politiques `file://`, IndexedDB après rechargement ou le téléchargement final par le système d’exploitation. Les exports sont interceptés sous forme de chaînes/Blobs pour vérifier leur contenu.

## Moteur : cas exécutés

Les 48 contrôles V2 du moteur ont été relancés : validation, jugements symétriques, accords, fautes de touche, HOLD/CHAIN, fail/No Fail, offset, entraînement, quinze partitions démo en Autoplay, import DSC synthétique, CSV, historique, analyse des silences/attaques, génération reproductible, synthèse audio, matrices/quaternions et géométries.

Les 51 contrôles V3 ajoutés portent sur : intégration et inversion du tempo (1 000 instants), événements de tempo invalides, subdivisions et phase de grille, groupes transactionnels, collisions refusées, copie/paste avec IDs uniques, quatre dispositions, contrôle non destructif, statistique de timing, passages difficiles, intervalle d’entraînement exclusif à droite, calcul HOLD au relâchement, indépendance des grosses/petites images pour les cas testés, chaînes maintenues malgré une image lente, validation/simulation de replay.

MIDI : format 0 et 1, running status, tempo variable, note-off et vélocité zéro, SysEx borné, SMPTE 25 et 29,97 fps, rejet type 2, en-têtes/résolutions invalides, troncature à chaque octet du fixture, note-off manquant signalé, options maintiens/percussion, accords réaffectés/écartés annoncés, mapping à six touches, exactitude des métadonnées natives et précision des événements standard, offset audio positif/négatif, rejet du temps audible négatif, tempo hors plage et aller-retour natif de **5 000 notes**.

La validation stricte refuse les durées/approches/décalages hors capacité au lieu de les modifier silencieusement. Les données source restent distinctes des versions dérivées.

## Navigateur : résultats significatifs

Les parcours V2 ont été rejoués sur le build V3 : trois démos/quinze charts, vrai contexte WebGL et shaders, trio et costumes par emplacement, scène Sakura, GLB embarqué skinné animé et retrait, WAV de huit secondes, JSON/LRC, Autoplay complet, pause/reprise, éditeur et undo/redo, versions dérivées, plans PV, génération de cinq difficultés, DSC, réimport audio identique, mauvais import refusé, export et restauration, favoris/recherche, petits écrans.

Le contrôle Autoplay termine le fixture audio/partition de quinze notes à 100 %. Le parcours avancé utilise les vrais handlers clavier avec des événements DOM cadencés sur l’horloge audio, ainsi qu’une **simulation** de l’API Gamepad : il ne correspond pas à un joueur physique. Un clear normal écrit un record ; No Fail ne le remplace pas. Le même parcours teste boucle d’entraînement, enregistrement manuel de frappes/maintien, remapping, lecture MP4 PV, pause vidéo et GLB invalide.

Les nouveaux parcours vérifient l’aperçu MIDI avant confirmation et son annulation, la préservation native de sept notes/trois tempos, l’audit sans mutation, l’édition BPM sans déplacement des notes, l’historique tempo, sélection/copie/collage de groupe, disposition et undo atomiques, rejet d’un déplacement négatif, angle/distance, source MIDI protégée, export MIDI binaire et métadonnées, montage de caméras sur mesures, métronome Web Audio, réouverture du bon chart, public/projecteurs désactivables, espacement, caméra déterministe après recherche temporelle, transformation du GLB, horloge de présentation facultative.

Pour le replay, la prise de contrôle finale comporte **7 COOL sur sept notes**, pour **7228 points**, via des événements clavier DOM pendant une lecture audio. La simulation hors rendu puis la lecture temps réel du replay, avec pause/reprise, retrouvent le score et les comptes de jugement. Aucun record n’est écrit par la relecture. Ce cas ne garantit pas les mêmes résultats sur tous les périphériques, versions du moteur ou situations de gel.

La setlist conserve l’identité du chart, démarre le bon morceau et attend l’action du joueur pour le suivant. La transition de setlist utilise une terminaison moteur contrôlée dans le test, pas une prestation humaine. La restauration des records utilise un enregistrement synthétique explicitement construit pour vérifier les nouvelles références. Les copies de morceaux, médias, records et setlists ne remplacent pas les sources. Une transaction mémoire invalide et un pack/replay invalide sont refusés sans import partiel.

Les vues bibliothèque, studio, modules et réglages ont été vérifiées aux formats **390 × 844** et **844 × 390** sans débordement horizontal du document. Les captures montrent le rendu effectif, pas un visuel de présentation généré.

## Corrections issues de la passe

Voir `docs/CHANGELOG_V3.md`. Parmi les défauts corrigés : notes hors section comptées dans l’entraînement, bonus HOLD tronqué entre deux images, chaînes dépendantes du moment du rendu, aide V3 utilisant un mauvais sélecteur, chart périmé à la réouverture du studio, map de tempo écrasée lors de l’édition du BPM initial, touches de replay perdues lors d’une pause, absence de transaction préparée dans le repli mémoire.

Les tests de rendu attendent maintenant les états effectifs des contrôles asynchrones plutôt qu’un délai arbitraire. La restauration V3 attend une confirmation ; l’export contient les médias référencés, pas ceux retirés de la scène. Les assertions ont été adaptées à ces deux comportements attendus, en conservant la vérification des références complètes.

## Non validé ou non livré

Pas de test physique de clavier, manette, écran tactile ou casque Bluetooth ; pas de mesure matérielle de latence. Safari/iOS, Firefox, Android, appareils peu puissants, interruptions audio système, persistance durable après fermeture, contexte sécurisé selon l’hébergement et téléchargement OS restent à vérifier. La demande de stockage durable dépend du navigateur. En mode TEMPORAIRE, exporter avant fermeture.

Pas de modèles détaillés officiels, chansons/clips/charts officiels inclus, recherche automatique de niveaux sur Internet, barème SEGA exhaustif, expressions/lip-sync/physique/IK complets, PMX/VMD/MMD, compte cloud ou nouveau déploiement. L’import DSC est partiel et testé avec des fixtures synthétiques, pas avec tout le catalogue commercial. L’import MIDI ordinaire est un mapping adapté ; seules les métadonnées natives embarquées permettent de restituer exactement les champs de chart.

La génération audio propose un tempo global et des attaques : pas de transcription exacte ni de détection garantie d’une carte de tempo variable. Les repères de mesure et le montage automatique du studio sont en 4/4. Le ralenti modifie aussi la hauteur. Les personnages restent procéduraux, le GLB n’est pas un moteur PBR complet et les mouvements intégrés ne sont pas des chorégraphies officielles.

## Reproduire et vérifier l’intégrité

`python3 build.py` reconstruit le HTML sans réseau. La reconstruction du build livré a produit les mêmes octets. `npm test` exécute les 99 tests du moteur. `python3 tests/run_browser_suites.py` exécute les trois suites séquentiellement, avec Playwright/Chromium et Xvfb disponibles. Les tests capturent la sérialisation des exports, pas le téléchargement OS. `SHA256SUMS.txt` donne l’intégrité des fichiers du pack.

SHA-256 du jeu HTML autonome :

`4022f2efa20a6fe284e99b8566f2890800ddbc6c170974233cdbefb0997e37dd`
