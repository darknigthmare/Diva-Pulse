# DIVA PULSE V28 — Continuité physique & reprise

## Démarrer sans perdre sa bibliothèque

Cette livraison est reconstruite depuis l’archive V27 complète. La tentative V28 précédente n’avait laissé que des captures et un dossier Drive vide ; ses sources n’ont pas été présumées disponibles. L’archive V27 d’origine n’est pas modifiée.

Exporter d’abord la bibliothèque de la version précédente en `.pulsepack` ou `.pulsebundle`, fermer les anciennes fenêtres, ouvrir la V28 et restaurer en copies. Garder la sauvegarde d’origine jusqu’à vérification des morceaux. Les nouveaux brouillons physiques nécessitent la V28 pour être récupérés : une version antérieure peut ignorer ce champ.

Décompresser le ZIP, puis ouvrir `DIVA_PULSE_JOUER.html`. Les lanceurs Windows et macOS/Linux utilisent Python 3 et une adresse locale stable. Le HTML contient tout le code nécessaire ; aucune clé API ni CDN ne sont requis. Si le badge **TEMPORAIRE** apparaît, exporter avant de fermer : le dépôt Drive conserve le jeu et ses sources, pas la bibliothèque du navigateur.

## 1. Les images lentes ne remettent plus systématiquement la physique à zéro

La V27 réinitialisait la simulation après une image de plus de 133 ms. La V28 conserve les poses échantillonnées et fait progresser la simulation par pas de **1/60 s**, avec un maximum de **12 pas par appel de rendu**.

Une image lente peut donc laisser un retard physique temporaire. Celui-ci est affiché en millisecondes dans le panneau. Les appels suivants rattrapent ce retard sans supprimer l’élan ni utiliser uniquement la dernière pose d’animation. Les cibles guidées sont interpolées entre les échantillons qui encadrent réellement le temps simulé.

La simulation n’effectue pas un rattrapage sans limite. Un saut du temps audio de plus de **1 seconde**, un retard accumulé de plus de **1 seconde**, un retour arrière, une pose discontinue ou un dépassement de la file de sécurité provoque une remise à zéro. Le motif est visible. Une pause au même instant ne vide pas artificiellement le retard : elle conserve la pose, sans continuer à simuler pendant que la musique est arrêtée.

Le scénario reproductible de deux secondes à cinq images simulées par seconde donne : V27, **11 réinitialisations et aucun pas** ; V28, **une initialisation et 120 pas**. La pose finale V28 est identique à celle à 60 images/s dans ce cas. Ce sont des mesures sur le pendule original à deux corps et une cible fixe ou linéaire, pas un gain de fréquence d’affichage ni une certification sur personnages complexes.

La dynamique reste **optionnelle, expérimentale, et différente de Bullet**. Les corps souples, les contacts entre danseurs, le retargeting universel, les tissus et les effets MME ne sont pas ajoutés dans cette passe. Les limites de 128 corps et 256 articulations par modèle sont conservées. Baisser la charge graphique ou désactiver l’option reste utile sur une machine lente.

## 2. Un brouillon indépendant pour les réglages physiques

Ouvrir **Modules → MMD Stage → DYNAMIQUE SECONDAIRE · EXPÉRIMENTALE**. Les réglages valides sont conservés à part lorsque leur modification est validée dans le champ. Le curseur est également mémorisé lors de son déplacement validé. Les champs invalides ne remplacent pas le dernier brouillon valide.

**Fermer sans appliquer** revient aux réglages enregistrés de la scène. À la réouverture, un encart propose **Reprendre le brouillon** ou **Écarter ce brouillon**. La présence d’un brouillon n’active pas la physique silencieusement.

Reprendre recharge les champs et le curseur uniquement dans l’aperçu. **Enregistrer la dynamique** reste nécessaire pour modifier le morceau. Un changement du pack MMD ou des paramètres enregistrés depuis la création du brouillon est signalé avant la reprise. Il faut alors contrôler le résultat sur les modèles actuels.

Le brouillon ne stocke pas un état de simulation complet. Sa reprise commence depuis la pose animée au curseur mémorisé : l’historique des forces n’est pas rejoué. Il ne s’agit pas d’une reprise bit-à-bit d’un mouvement physique ancien.

## 3. Publication atomique et export de secours

Les paramètres de scène et la clôture de leur brouillon sont enregistrés dans une seule transaction. Si la sauvegarde échoue, l’ancienne scène reste intacte et le formulaire reste disponible. Une écriture de brouillon refusée conserve sa dernière version en mémoire, avec un avertissement visible.

Les exports `.pulsepack` et `.pulsebundle` récupèrent ces brouillons, y compris lorsqu’aucune nouvelle écriture n’est possible. Ils sont inclus avec le morceau propriétaire. La restauration crée de nouveaux morceaux, remappe les propriétaires et les packs MMD, puis propose la reprise explicitement.

Les brouillons avec propriétaire absent ou dupliqué, curseur hors durée, réglages invalides ou collection mal formée sont refusés avant la confirmation. Les suppressions confirmées participent à l’ordre des versions, afin qu’une ancienne copie ne fasse pas réapparaître un brouillon écarté.

Cette protection dépend des opérations effectivement terminées. Elle ne rend pas le mode temporaire durable et ne garantit pas qu’une écriture en cours survive à une fermeture brutale. Exporter régulièrement reste nécessaire.

## 4. Essai immédiat

Importer `examples/v27/PENDULE.pmx` et `ANCRAGE.vmd`. Le petit pendule articulé est un diagnostic original, pas un personnage finalisé. Activer la dynamique dans son aperçu, changer la gravité, puis fermer sans appliquer. Rouvrir : la scène originale est toujours utilisée et l’encart de récupération permet de retrouver le réglage.

Pour tester la sauvegarde portable, exporter un `.pulsebundle` avec un brouillon non appliqué, le restaurer en copies et ouvrir la dynamique du morceau copié. Reprendre puis enregistrer le brouillon pour le publier.

`node --test tests/*.test.cjs` exécute les tests de logique. `node tests/v28_timing_benchmark.cjs` compare la V28 au code réel de la V27 conservé comme référence. Les tests navigateur utilisent Playwright, Chromium et Xvfb ; leurs versions d’outils sont consignées dans le rapport de livraison. Le jeu lui-même ne dépend pas de ces outils.

## Fonctions conservées, pas nouvellement certifiées

L’import musical et ses cinq difficultés AutoMap, les partitions exactes locales, les rapprochements acoustiques, le studio manuel, Auto Show, Director, visage, PMX/PMD/VMD, SDEF/QDEF, sauvegardes et replays restent dans le projet. Les reprises de tests exécutées sur ce HTML sont listées dans `RAPPORT_V28.md`, séparément des preuves historiques conservées dans l’archive.

Le système reste incomplet par rapport à Project DIVA et MMD Desktop : pas de catalogue officiel embarqué, pas de médias propriétaires redistribués, pas de physique Bullet complète, ni de validation universelle sur tout modèle téléchargé. Les essais sur appareils physiques, Safari/iPhone, persistance IndexedDB après fermeture et installation hors ligne restent ouverts.
