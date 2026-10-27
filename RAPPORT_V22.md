# DIVA PULSE V22 — Rapport de tests

## Traçabilité

Base : archive V21 complète réellement extraite et contrôlée, sans modification de l’original. La V22 est reconstruite à partir de ses sources dans cette livraison.

Version : **22.0.0 — MMD Surfaces & Motion Sync**. HTML : **673462 octets**. Le jeu autonome et `index.html` sont identiques.

**Empreinte SHA-256 du HTML réellement testé et livré :**

`2d22a7ab40274ebe001cc9cbadea2343e9cd1d90a105b96c9d795606f5b46779`

Toutes les suites navigateur ci-dessous portent cette empreinte. La reconstruction finale `python build.py` a reproduit les mêmes octets ; les anciens résultats V21 ne sont pas simplement réutilisés comme preuves V22.

## Contrôles exécutés

| Suite | Résultat | Preuve locale |
|---|---:|---|
| Logique, historique et nouveaux contrats | 474/474 | qa/v22/logic-final.txt |
| Nouveaux parcours V22 | 28/28 | qa/v22/integration/browser-final.json |
| Reprise import MMD et troupe V21 sur V22 | 44/44 | qa/v22/regression-v21/browser-final.json |
| Reprise Auto Show V20 sur V22 | 57/57 | qa/v22/regression-v20/browser-final.json |
| Diagnostic natif PMX/VMD WebGL2 | 4/4 | qa/v22/native-run.txt |
| Lanceur et serveur local | 10/10 | qa/v22/launcher-final.txt |

Les 433 tests historiques ont passé après intégration ; 41 nouveaux tests portent le total à 474. Les 129 contrôles navigateur répartis en trois suites sont des vérifications de parcours, pas 129 environnements différents. Aucun événement JavaScript non intercepté ni panne de rendu n’est enregistré dans les sorties finales.

## Surfaces réellement vérifiées

Le parcours importe un PMX original avec deux matériaux, sa TGA et un VMD contenant seulement un morph. L’aperçu est un renderer indépendant. Le test vérifie la sélection de ce VMD par Auto Show et la préservation des charts.

Dans une scène dédiée, le morph d’opacité change effectivement le tampon de pixels et atteint zéro pour les deux matériaux. Le tampon UV GPU est lu pour contrôler son déplacement et sa remise à zéro. Un groupe de morphs combine UV et transparence. Le retour aux poids nuls ne modifie pas les données de base. Les opérations de matériaux, leurs cibles, nombres finis et cycles de groupes sont également contrôlés par les tests de logique.

Les teintes de texture/sphère sont implémentées et leurs calculs testés ; ces essais ne certifient pas un rendu pixel-perfect de tous les matériaux MMD.

## Calage musical et sauvegardes

Les champs de BPM, premier temps et boucle sont remplis via la vraie interface. Le temps source transmis au runtime est observé et comparé à la conversion musicale. Un BPM invalide laisse la scène intacte. Une écriture refusée volontairement conserve la scène et le dialogue à réessayer.

Un montage devenu manuel reste intact après modification du profil source. L’export `.pulsepack`, la restauration en copies, le remappage des médias et le rechargement des personnages sont vérifiés. Le profil restauré et le calage différent conservé par le montage manuel sont contrôlés séparément.

La disposition de la modale est examinée à 390 × 844 pixels. Les captures correspondantes sont incluses.

## Non-régression

Les suites V21/V20 sont réexécutées sur le HTML V22 : ZIP, contrôle avant écriture, aperçu, import, textures à chemins relatifs, invalides, troupe par défaut, palette d’os, import WAV, cinq difficultés, spectacle automatique, protection du manuel, pause/reprise, partie Autoplay, sauvegardes et repli sans WebGL.

## Limites d’exécution

Les essais utilisent Chromium, Playwright, Xvfb et **WebGL2 logiciel SwiftShader**, pas un GPU physique. Le HTML exact est injecté dans un document, car la navigation loopback du navigateur est bloquée dans cette infrastructure. Le lanceur HTTP est testé séparément avec ses réponses et les fichiers servis.

Le stockage du document d’essai est **TEMPORAIRE**. Ces résultats vérifient l’export/restauration et les refus d’écriture, mais **pas** la persistance IndexedDB après fermeture du navigateur, l’installation PWA complète, Safari/iPhone ou des périphériques MIDI/manette physiques.

Les modèles utilisés sont des diagnostics originaux, pas une collection représentative de tous les modèles MMD téléchargés. La compatibilité universelle n’est pas acquise.

## Limites fonctionnelles

Le calage demande un BPM source fourni et correct ; il ne le détecte pas dans un VMD arbitraire. Il ne répare pas les pieds, les proportions et les contraintes du squelette, ni un tempo source variable dans la motion. Les notes et le travail manuel sont protégés.

Les morphs UV supplémentaires, ambiance/spéculaire/contour/toon ne sont pas rendus exhaustivement. Bullet complet, corps souples, MME, SDEF/QDEF exacts et contraintes IK complètes restent à développer. Les fonctionnalités conservées et les nouveaux réglages sont décrits dans README_V22.md.

## Livraison

Le ZIP est intégralement relu et les empreintes de chaque fichier sont vérifiées avant le transfert. Les rapports antérieurs conservés dans l’archive restent historiques. `SHA256SUMS.txt` interne décrit tous les fichiers sauf lui-même.

Le dépôt Google Drive est une copie des livrables : il n’héberge pas le jeu et n’ajoute pas de synchronisation au navigateur. La réussite du dépôt est confirmée séparément par les retours du connecteur et la relecture du dossier. Aucun partage public ni déploiement de site n’est effectué.
