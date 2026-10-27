# DIVA PULSE V28 — Rapport de vérification

## Base et traçabilité

Reprise réelle depuis `DIVA_PULSE_V27_DYNAMIQUE_SECONDAIRE_COMPLET.zip` : SHA-256 `3c5e4c68d05c985c3ec496e59d714b3e0fa6b506458bb0fe5bd4185e9d5bb371`. Le ZIP V27 et ses 1015 empreintes ont été vérifiés. Les captures de la tentative V28 précédente ont été retrouvées, mais pas son code ; les améliorations ont été reconstruites sans supposer qu’elles étaient disponibles.

HTML livré : **819746 octets**, SHA-256 **`bb12344ec8884095d2909000c9cd522c80e18050e94fe53793b2d102af7e7fc4`**. `index.html` et `DIVA_PULSE_JOUER.html` sont identiques. Les sept suites navigateur et le diagnostic MMD ci-dessous sont liés à cette empreinte.

## Résultats exécutés sur cette version

| Contrôle | Résultat | Preuve |
|---|---:|---|
| Logique historique + 37 nouveaux tests | 782/782 | qa/v28/logic-final.txt |
| Parcours V28 — brouillons et archives | 34/34 | qa/v28/features/browser-final.json |
| PV, pause/reprise, Autoplay et panne physique | 14/14 | qa/v28/playback/browser-final.json |
| Auto Show V20 rejoué | 57/57 | qa/v28/regression-v20/browser-final.json |
| Héritages, IK, motion et stockage V24 rejoués | 35/35 | qa/v28/regression-v24/browser-final.json |
| Visage et archives V25 rejoués | 40/40 | qa/v28/regression-v25/browser-final.json |
| Reconnaissance et reprise V26 rejouées | 51/51 | qa/v28/regression-v26/browser-final.json |
| Physique V27 rejouée | 38/38 | qa/v28/regression-v27/browser-final.json |
| Diagnostic natif PMX/VMD WebGL2 | 4/4 | qa/v28/native-final.txt |
| Lanceur/serveur HTTP | 10/10 | qa/v28/launcher-final.txt |

Total navigateur : **269 contrôles**, répartis sur sept suites, pas 269 appareils. Les autres suites historiques conservées ne sont pas annoncées comme réexécutées. Le total navigateur n’est donc pas une accumulation des résultats V27.

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

v22.16.0 ; Chromium 144.0.7559.96 built on Debian GNU/Linux 13 (trixie) ; Playwright 1.57.0 ; Xvfb ; **WebGL2 logiciel SwiftShader**.

Deux sondes de navigation navigateur ont été bloquées par l’infrastructure avant chargement du document. Les suites utilisent donc l’injection du HTML exact dans un document temporaire, comme les précédentes. Le lanceur HTTP est vérifié séparément par un client Python. **La persistance native IndexedDB après fermeture et le verrouillage multi-fenêtres natif ne sont pas certifiés.** Voir `qa/v28/native-storage-probes.json`.

Les appareils physiques, Safari/iPhone, installation PWA complète, grands modèles MMD variés, retargeting, corps souples et fidélité intégrale Project DIVA restent ouverts. La dynamique reste désactivée par défaut. Le fichier `AUDIT_V28.md` distingue les fonctions conservées, améliorations de cette passe et chantiers non terminés.

## Livraison

Le ZIP est relu et toutes ses empreintes internes sont contrôlées avant transfert. Le dépôt Drive fait l’objet d’un reçu séparé, seulement après retour des envois et relecture des métadonnées. Le dépôt n’héberge pas le jeu et ne synchronise pas le stockage local. Aucun partage public ni déploiement de site n’est effectué.
