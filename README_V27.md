# DIVA PULSE V27 — Dynamique secondaire & diagnostics

## Démarrer et migrer

Cette livraison reprend l’archive V26, sans modifier celle-ci. Décompresser le ZIP, puis ouvrir `DIVA_PULSE_JOUER.html`, ou utiliser `LANCER_WINDOWS.bat` / `LANCER_MAC_LINUX.command` avec Python 3. Aucun CDN ni téléchargement de moteur physique n’est nécessaire.

Exporter d’abord la bibliothèque précédente en `.pulsepack` ou `.pulsebundle`, fermer les anciennes fenêtres et restaurer la sauvegarde en copies. Conserver l’original jusqu’à vérification. Le badge **TEMPORAIRE** signifie que le contenu doit être exporté avant fermeture. Cette version ne certifie pas la persistance après fermeture sur tous les navigateurs.

Le dossier Google Drive conserve les livrables, pas la bibliothèque du navigateur. Il n’héberge pas le jeu et n’active aucune synchronisation automatique.

## Ce que cette passe ajoute

La V26 lisait la géométrie, les os et les morphs mais ne rendait pas les tables de corps et d’articulations disponibles à une simulation. La V27 ajoute :

- lecture contrôlée des données physiques PMX et PMD ;
- diagnostic avant import et diagnostic par danseur ;
- simulation secondaire native, optionnelle et indépendante pour chaque modèle ;
- aperçu silencieux, lecture/pause/retour, réglages et enregistrement par morceau ;
- export JSON du diagnostic et conservation des réglages dans les archives du jeu.

**Il s’agit d’un solveur positionnel expérimental, pas de Bullet.** Il donne une première réaction dynamique aux chaînes compatibles ; il ne garantit pas le comportement de MikuMikuDance Desktop. Les médias officiels et modèles propriétaires ne sont pas fournis.

## Essayer immédiatement

1. Choisir un morceau, puis ouvrir **Modules → MMD Stage**.
2. Importer `examples/v27/PENDULE.pmx` avec `ANCRAGE.vmd`. Le contrôle annonce deux corps physiques et une articulation. Valider l’import.
3. Ouvrir **DYNAMIQUE SECONDAIRE · EXPÉRIMENTALE**.
4. Cocher l’activation et cliquer sur **Lire l’aperçu silencieux**. La bande articulée du diagnostic oscille autour de son ancrage. Le mouvement VMD déplace aussi l’ancrage.
5. Mettre en pause pour figer la pose, ou remettre le curseur au début pour réinitialiser la simulation.
6. Cliquer sur **Enregistrer la dynamique** pour appliquer l’option au morceau. **Annuler / fermer** rétablit ses options précédentes.

Ce petit pendule est un fichier PMX original de contrôle, pas un personnage finalisé. `PHYSIQUE_PMD.pmd` exerce également la lecture des corps relatifs aux os dans le format PMD.

## Réglages

| Réglage | Sens |
|---|---|
| Activation | Désactivée par défaut. L’import d’un modèle n’active pas sa dynamique silencieusement. |
| Gravité | 0 à 100 unités de modèle par seconde carrée. L’échelle du fichier influence le résultat ; aucune conversion automatique en mètres. |
| Amortissement | Valeur additionnelle entre 0 et 0,95. Augmenter pour calmer les oscillations. |
| Influence | 0 à 1 : mélange entre pose animée et pose simulée. Zéro restitue l’animation sans influence physique. |
| Itérations | 2 à 12 corrections par pas de simulation ; plus d’itérations peut stabiliser une chaîne, mais coûte davantage. |
| Collisions | Interactions locales au modèle, filtrées par ses groupes et masques. |
| Sol | Plan facultatif à Y = 0, dans le repère du modèle. Ce n’est pas la collision avec la géométrie détaillée du décor. |

Les champs non finis et hors plage sont refusés. Les réglages de prévisualisation ne sont pas écrits sur le morceau. L’enregistrement écrit d’abord la copie validée ; une erreur conserve l’ancien morceau et le formulaire pour réessayer. La fermeture du panneau abandonne ces réglages non enregistrés : **pas d’autosauvegarde du brouillon de physique dans cette passe**.

L’export JSON du panneau contient options, compteurs, avertissements et limites. C’est un diagnostic, pas un format importable de chorégraphie.

## Ce qui est simulé

Les corps de mode 0 sont guidés par les os. Les corps de mode 1 peuvent transmettre position et rotation au squelette. Le mode 2 conserve la position animée de l’os et transmet une rotation physique. Une masse nulle est traitée comme fixe et signalée.

Les articulations standard de type 0 appliquent un cadre de connexion, des limites de translation/rotation XYZ et des corrections de rappel. Le calcul utilise une approximation de masse angulaire scalaire, **pas un tenseur d’inertie et un solveur d’impulsions complets**. Plusieurs corps peuvent être lus pour un même os, mais seul le premier corps dynamique lui transmet une transformation ; ce cas est annoncé.

Les corps dynamiques utilisent des enveloppes sphériques. Une boîte ou capsule dynamique n’est donc pas une forme de collision exacte. Les obstacles guidés peuvent être traités comme sphères, boîtes orientées ou capsules. Un premier test de distance exclut les paires éloignées avant les projections détaillées. Il n’y a pas de détection continue des collisions rapides.

La simulation fonctionne dans le repère du modèle. Les déplacements de formation et les changements de scène ne lui ajoutent pas d’inertie. Les danseurs ne se heurtent pas entre eux.

## Horloge, pause et sécurité

Pas fixe de **1/60 de seconde musicale** : les affichages à 30, 60 et 120 images par seconde ont été comparés sur un scénario déterministe. La pause du morceau ne fait pas avancer la simulation. Le ralenti suit le temps musical, et non un second chronomètre indépendant.

Premier affichage, retour arrière, boucle, saut de plus de huit pas (environ 133 ms) ou déplacement discontinu important : remise à zéro depuis la pose animée. **Déplacer le curseur ne recalcule pas tout l’historique des forces.** Une image très lente peut donc réinitialiser les mouvements secondaires plutôt que provoquer un rattrapage coûteux.

Les personnages masqués continuent de recevoir leur pose animée quand leur clip l’exige, mais leur simulation est libérée. Au retour, elle repart de cette pose. Désactiver la fonction ou décharger le modèle libère ses états.

Une défaillance numérique arrête le solveur du modèle et laisse l’animation disponible. Elle est conservée dans le diagnostic, sans nouvelle tentative à chaque image. Réinitialiser ou changer les options permet une reprise explicite.

## Budgets et compatibilité

Simulation limitée à **128 corps et 256 articulations par modèle**. Au-delà, les données sont diagnostiquées mais la simulation n’est pas appliquée ; la géométrie n’est pas volontairement tronquée pour rentrer dans le budget. Les lecteurs binaires possèdent des plafonds plus larges et refusent les index absents, dimensions ou masses invalides, nombres non finis et tables tronquées.

Les articulations non standard, auto-liées ou liées au monde ne sont pas exécutées. Les corps souples PMX 2.1 sont signalés, pas simulés. Les tables physiques incomplètes ou limites inversées peuvent entraîner un refus : ce lecteur n’est pas une garantie universelle d’import de tous les fichiers produits par tous les outils MMD.

Restent absents : Bullet, tissus/corps souples, impulsions de morphs, intégration complète après-physique des os, effets MME, adaptation universelle des motions et correction des appuis. Les vêtements et cheveux d’un modèle complexe peuvent donc se déformer différemment ; revenir au VMD seul en décochant l’option.

## Fonctions précédentes et données manuelles

AutoMap, Auto Show, Director, pistes faciales, récupération des brouillons, reconnaissance acoustique et les deux formats de sauvegarde restent présents. Cette passe ne prétend pas améliorer la compréhension musicale de l’AutoMap ni ajouter un catalogue en ligne.

Enregistrer la dynamique ne modifie ni les notes, ni les clips VMD, ni les modèles d’origine. L’archive `.pulsebundle` conserve les options du morceau et les octets PMX/PMD comprenant leurs tables physiques. Une restauration remappe les médias et recharge le modèle, avec ses options. Les autres morceaux ne sont pas automatiquement activés, et les scènes manuelles ne sont pas régénérées.

## Reproduire les vérifications

- `npm test` : logique historique et nouveaux contrats.
- `python build.py` : reconstruit les deux HTML identiques.
- `python tests/launcher_test.py` : lanceur HTTP local.
- `xvfb-run -a python tests/v27_browser_test.py` : import, options, aperçu et archives.
- `xvfb-run -a python tests/v27_playback_browser_test.py` : PV/Autoplay, pause/reprise et défaut simulé du solveur.
- `python tests/v27_run_regressions.py` : parcours historiques adaptés seulement à l’étiquette de la version et au dossier de preuve.
- `node tests/v27_benchmark.cjs` : scénarios synthétiques 2–128 corps et pendule 60 secondes.

Les tests du navigateur de cette livraison utilisent Chromium/SwiftShader et un document injecté en mémoire, faute de navigation loopback autorisée dans l’environnement. Le stockage est TEMPORAIRE. Les résultats ne certifient pas Safari, iPhone, un GPU ou contrôleur physique, l’installation hors ligne ou IndexedDB après fermeture.
