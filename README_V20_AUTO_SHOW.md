# DIVA PULSE V20 — Auto Show

Version 20.0.0. Extension réalisée depuis l’archive V19 Studio & Reliability. Jeu local autonome : aucune clé, aucun service IA distant et aucun média officiel supplémentaire. Ce guide concerne les nouveautés V20 ; les documents V2–V19 sont conservés comme historique, pas comme preuve de tests V20.

## Démarrer

Décompresser l’archive. Ouvrir `DIVA_PULSE_JOUER.html` sur PC, ou utiliser les lanceurs fournis avec Python 3. Le lanceur conserve une adresse locale stable. `index.html` contient le même jeu. Aucun `npm install` n’est nécessaire pour jouer.

Exporter d’abord la bibliothèque de l’ancienne version en `.pulsepack`, puis la restaurer dans la V20. Garder cette sauvegarde jusqu’au contrôle des morceaux restaurés. Le badge **TEMPORAIRE** indique qu’il faut exporter avant de fermer ; les fichiers et spectacles ne sont alors conservés que pour la session. La validation navigateur de cette livraison utilise ce mode temporaire, pas un redémarrage d’IndexedDB.

## Une musique → un spectacle

Dans **Jouer**, laisser cochés **5 difficultés automatiques** et **Spectacle automatique**, puis importer un WAV/MP3 ou un autre audio décodable. Le jeu prépare les difficultés manquantes et le spectacle dans l’enregistrement du morceau. Si AutoMap est décoché mais le spectacle activé, l’audio est tout de même analysé et un PV peut être joué sans partition.

La proposition couvre toute la durée audio. Elle utilise la pulsation et la carte de tempo disponibles, les signatures du chart de référence, l’énergie et les pauses mesurées. Les rôles « refrain », « solo » ou « montée » restent des estimations, pas une transcription certaine de la composition.

Le jeu détermine les décors parmi **Neon Arena, Midnight City, Sakura Garden et Glass Orbit**. Il programme les motifs de danse, les formations/présences, les déplacements de caméra et les variations de lumière. Il ne génère pas de nouveaux modèles ou décors 3D à partir d’un texte.

Ouvrir **SPECTACLE · AUTO / MANUEL** sous les informations de la partition, puis **Voir le PV avec la musique**. Le PV revient à la bibliothèque en fin de morceau et n’écrit pas de score. Le spectacle s’affiche également pendant le jeu. Une vidéo associée, lorsque sa lecture est activée, garde son rôle de fond vidéo ; la V20 ne remplace pas ce média manuel.

## Les trois cas de chorégraphie

1. Sans pack MMD : les personnages procéduraux déjà présents utilisent des motifs synchronisés à la pulsation (pas latéraux stylisés, vagues, clap, bras levés, pose). La graine contrôle les variantes ; les phrases comparables peuvent réutiliser le même motif.
2. Avec des PMX/PMD et sans VMD compatible : le Director crée automatiquement des pistes procédurales pour les os reconnus. Ce repli anime surtout le haut du corps (tête, buste, bras/coudes), suivant des alias japonais/anglais. Il ne constitue pas un retargeting universel, une chorégraphie apprise, une simulation de pieds ou un lip-sync. Un squelette inconnu reste en pose avec un diagnostic.
3. Avec VMD compatibles : la V20 mesure leur activité angulaire et leurs noms d’os, puis les sélectionne pour les phrases musicales. Les motions sont montées, bouclées au besoin et fondues. Leur tempo propre n’est pas estimé : elles gardent leur vitesse source. Les limites de section suivent la musique, mais chaque pas d’un VMD arbitraire n’est pas garanti calé au beat. Aucune motion officielle n’est créée ou retrouvée automatiquement.

Importer les modèles, textures et motions ensemble via **Modules → MMD Stage**. Un pack de deux PMD sans VMD suffit pour essayer la génération procédurale multi-personnages. Le runtime existant accepte jusqu’à quatre emplacements MMD et jusqu’à trois silhouettes procédurales. La sélection du casting et ses costumes ne sont pas remplacés par Auto Show.

## Respect du manuel

La proposition V20 est stockée dans `song.scene.autoShow`, à côté des données manuelles, et non à leur place. Les notes ne sont jamais réécrites par la création du spectacle.

Les pistes indépendantes sont **scène**, **chorégraphie**, **formations**, **caméra** et **lumière**. Les choix manuels existants identifiables et les modifications ultérieures prennent priorité. Une caméra manuelle peut ainsi rester intacte tandis que les mouvements et lumières libres sont complétés. Certains anciens événements contenant plusieurs valeurs protègent plusieurs pistes par prudence.

Dans le panneau du spectacle :

- **Automatique** : réactualiser seulement les pistes libres lorsque la source change ou à la demande.
- **Figé** : conserver la proposition actuelle ; une nouvelle analyse ne régénère pas le spectacle.
- **Désactivé** : utiliser la scène manuelle sans la couche Auto Show.
- **Protéger une piste** : garder ses valeurs actuelles lors des prochaines générations.

Décocher volontairement une protection puis enregistrer autorise l’auto à reprendre cette piste. Les anciennes valeurs manuelles ne sont pas supprimées. Choisir le mode Désactivé permet de revenir à la scène manuelle, mais ce n’est pas un historique infini de toutes les propositions précédentes.

Le Director MMD peut ouvrir les clips générés pour les éditer. Enregistrer ce montage le transforme en réglage manuel prioritaire. Son aperçu ne doit pas être écrasé par Auto Show.

## Réglages et bibliothèque existante

**Équilibrée**, **Calme** et **Concert** modifient le traitement du spectacle. La même musique, la même analyse et la même graine donnent la même proposition. Changer de difficulté sélectionnée ne reconstruit pas le PV.

**Réexaminer l’audio & les motions** mesure réellement l’audio disponible et les fichiers MMD. Cette opération ne retouche pas les partitions. Elle peut être annulée avant la sauvegarde finale. En cas de refus d’enregistrement, l’ancienne proposition reste conservée.

**Réglages → Une musique. Un spectacle. → Compléter les spectacles de la bibliothèque** traite chaque morceau sans remplacer le manuel. Les morceaux sont également préparés au chargement lorsqu’ils n’ont pas de spectacle. Si un ancien morceau n’a pas d’analyse audio, la première proposition utilise sa grille disponible et l’annonce ; utiliser Réexaminer pour mesurer son audio.

L’option de réduction des mouvements stabilise la caméra et la lumière automatiques. Le cadrage élargit la distance en portrait pour tenir compte du groupe. Les changements de scène ne sont pas des transitions cinématiques fondues : ils utilisent les environnements intégrés.

## Sauvegardes

Exporter le morceau ou la bibliothèque en `.pulsepack` pour conserver musique, partitions, scènes, modèles, textures, motions et plan automatique. La restauration crée une copie et remappe aussi les identifiants utilisés par le Director automatique. Un média requis manquant ou une proposition invalide doit faire refuser la transaction entière.

**Exporter le plan & diagnostic** produit un `.pulseshow.json` d’inspection. Ce fichier seul ne contient pas les médias et n’a pas de bouton d’import dédié dans cette version ; ce n’est pas une alternative au `.pulsepack`.

## Essai immédiat sans contenu officiel

Importer `examples/v19/TRIPLE_PULSE.wav` : cet instrumental original dure environ huit secondes. Les cinq difficultés et le spectacle sont créés automatiquement. Puis, dans Modules, importer `PULSE_BOT_A.pmd`, `PULSE_BOT_B.pmd` et `DIAG.tga` du même dossier, **sans VMD**, pour voir le repli procédural. Ajouter ensuite `MOTION_A.vmd` et `MOTION_B.vmd` en réimportant le pack complet pour essayer la sélection de motions mesurées. Ces robots sont des diagnostics originaux, pas des modèles Vocaloid finalisés.

## Développer et vérifier

`python3 build.py` reconstruit les deux HTML depuis `src/`. `npm test` lance les contrats Node (Node 22+). Les tests navigateur nécessitent Playwright et Chromium ; sur Linux sans écran, `xvfb-run -a python3 tests/v20_browser_test.py`. Ils injectent le document parce que la navigation locale est bloquée dans l’environnement de livraison. Le test serveur est séparé : `python3 tests/launcher_test.py`.

Lire `RAPPORT_V20.md` et les journaux `qa/v20/` pour les résultats réels. Les journaux de développement échoués sont gardés avec leur statut, jamais additionnés aux réussites finales.

## Limites conservées

Les spectacles sont procéduraux et heuristiques. Pas de compréhension des paroles, reconnaissance certaine de couplets/refrains, extraction de danse depuis une chanson, retargeting universel ou nouvelle scène 3D photoréaliste. Les physiques Bullet/rigid bodies/joints/soft bodies exhaustifs, le SDEF/QDEF exact et le rendu MMD Desktop pixel-perfect ne sont pas ajoutés par cette passe.

Safari/iPhone, les manettes/MIDI physiques, les performances GPU matérielles, la persistance après fermeture et l’installation complète hors ligne restent à valider. Aucun site distant n’est modifié par cette livraison.
