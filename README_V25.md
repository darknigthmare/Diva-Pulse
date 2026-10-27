# DIVA PULSE V25 — Visages & archives binaires

Version 25.0.0 — 7 octobre 2026. Reprise de la V24 complète vérifiée, sans modification de son archive. Le moteur de rythme, AutoMap et MMD Director restent présents. Cette passe ajoute une piste de bouche, des contrôles de priorité faciale, une sauvegarde binaire et une réduction des allocations de morphs.

## Démarrer, migrer et conserver ses données

Exporter d’abord la bibliothèque de la version précédente en `.pulsepack`. Fermer les anciennes fenêtres, décompresser la V25 dans un dossier distinct, puis ouvrir `DIVA_PULSE_JOUER.html` ou le lanceur Python 3 fourni (`LANCER_WINDOWS.bat`, `LANCER_MAC_LINUX.command`). Le lanceur conserve une adresse stable et signale les conflits de port.

Dans **Réglages → Importer .pulsepack / .pulsebundle**, restaurer le fichier. La restauration ajoute des copies : conserver l’ancienne sauvegarde jusqu’à avoir vérifié les chansons, partitions, modèles, textures et spectacles. Les réglages ne sont remplacés qu’en cochant l’option correspondante.

**TEMPORAIRE = exporter avant de fermer.** La copie du projet sur Drive n’héberge pas le jeu et ne synchronise pas la bibliothèque du navigateur. Une autre adresse, un autre navigateur ou un autre appareil ne retrouve pas automatiquement les données locales.

Le verrou d’écriture reste nommé `DIVA-PULSE-V24-WRITER` : les V24 et V25 qui utilisent Web Locks peuvent ainsi se coordonner. Cette présence dans le code n’est pas une validation de la persistance après fermeture. Dans l’environnement de tests, les navigations locales sont bloquées ; les parcours emploient le HTML exact dans un document temporaire. Aucun contournement de cette restriction n’est inclus.

## 1. Une piste de bouche indépendante, pas une reconnaissance phonétique

Ouvrir **Modules → MMD Stage → VISAGE · AUDIO / CLÉS MANUELLES**. Il faut un PMX/PMD possédant un morph de bouche reconnu, ou choisir explicitement le morph du modèle chargé. Un personnage sans morph utilisable conserve sa pose et affiche un diagnostic. Les personnages procéduraux sans morphs n’acquièrent pas une bouche articulée grâce à ce panneau.

La piste vit dans `scene.faceTrack` ; ni les clés du VMD ni les notes ne sont réécrites. Trois modes sont disponibles : **Désactivé**, **Enveloppe audio** et **Clés manuelles**. Le curseur fait avancer le corps et le visage dans un aperçu silencieux. Le petit écran montre le rendu réel de la scène, sans charger un deuxième exemplaire du personnage.

### Préparer depuis l’audio

**Analyser le mix du morceau** calcule une ouverture selon l’énergie du son. Une voix, une batterie ou un synthétiseur peuvent tous déclencher cette ouverture : le calcul ne sait pas lequel chante. C’est une approximation, pas des visèmes A/I/U/E/O, pas une transcription des paroles et pas une séparation des sources.

**Charger une voix isolée** permet de fournir une piste vocale préparée séparément. Son amplitude est analysée et sa ressource conservée avec le morceau. Elle n’est jamais jouée en plus de la musique. Vérifier son alignement avec le mix ; régler le retard si nécessaire. Le jeu ne fabrique pas cette voix isolée à partir du morceau.

Le traitement local s’effectue dans un Worker, sur un ou deux canaux séparés. Il mesure l’énergie sur des fenêtres centrées, enlève la composante constante, préserve l’activité stéréo en opposition de phase et applique un lissage d’ouverture/fermeture. La courbe finale contient 25 valeurs par seconde ; le runtime l’interpole selon l’horloge musicale, sans accumuler du temps d’une image à l’autre.

Limites : 10 minutes d’audio analysé, 128 Mio de PCM mono/stéréo copié, fichier de voix guide de 80 Mio maximum. Le décodage peut consommer plus de mémoire que le fichier compressé. Un signal quasi silencieux ne crée pas de faux mouvement. Hors de la durée du signal analysé, la bouche se referme.

Réglages : gain, maximum d’ouverture, seuil d’énergie, retard/avance et morph. **Retard positif = bouche plus tardive.** Choisir un danseur précis ou suivre le personnage principal des formations. Un clignement procédural optionnel s’applique seulement aux morphs reconnus ; ce n’est pas une animation faciale universelle.

### Préserver une animation manuelle

La protection VMD est cochée par défaut. Elle protège un morph déjà présent dans la motion même si sa clé vaut zéro, ainsi que les morphs contenus dans un groupe et ceux de la motion sortante pendant un fondu. Décocher autorise explicitement le remplacement sur la bouche concernée ; cela ne réécrit toujours pas le fichier VMD.

L’analyse ne sauvegarde rien. Cliquer sur **ENREGISTRER LE VISAGE** pour appliquer la piste. Un refus d’écriture laisse le formulaire et l’ancienne scène intacts ; un nouvel essai peut ensuite réussir. **Annuler / fermer** rétablit la scène enregistrée. Le brouillon de ce panneau n’est pas un autosave durable : exporter sa piste JSON avant de fermer si nécessaire.

### Création manuelle et partage d’une piste

Dans **Clés manuelles d’ouverture**, placer le curseur, choisir une ouverture de 0 à 1, puis ajouter une clé. Entre les clés, la valeur est interpolée linéairement. Ajouter au même instant remplace la clé de cet instant. Les boutons retirent des clés du brouillon, pas de la scène enregistrée.

**Exporter cette piste JSON** crée un `.pulseface.json` indépendant, contenant la courbe/les clés mais pas l’audio. Importer ce fichier charge un brouillon ; la durée du morceau courant est contrôlée. Un nom de morph absent reste visible et peut être remplacé par un morph compatible. Enregistrer reste nécessaire.

### Automatiser les futures importations

Dans **Réglages → Visages & archives**, cocher **Préparer une bouche automatique à l’import des nouvelles musiques**. L’option est désactivée par défaut pour ne pas faire chanter systématiquement les instrumentaux.

Une nouvelle musique sans piste faciale reçoit alors sa courbe en plus des cinq difficultés et du spectacle automatique si ces options sont actives. Une piste existante n’est pas écrasée. Cette option ne transforme pas la génération de notes ni ne répare un squelette inconnu. Le réglage et la piste voyagent dans les sauvegardes.

## 2. Sauvegarde `.pulsebundle` sans base64 des médias

Dans **Réglages → Visages & archives**, cliquer sur **Exporter .pulsebundle binaire**. La bibliothèque est lue sans demander de nouvelle écriture. Le morceau, ses partitions, scènes, médias référencés, voix guides, brouillons récupérables, records et réglages sont transportés avec le même modèle de données que l’export historique.

Le manifeste JSON et chaque bloc de média de 1 Mio possèdent une empreinte SHA-256. Les médias restent des octets binaires, sans conversion de tous les fichiers en grandes chaînes base64. Un fichier de 256 Mio d’octets de contrôle produit environ 256 Mio plus 17 448 octets dans le banc d’essai Node fourni.

**Les empreintes vérifient l’intégrité, pas l’identité de l’auteur.** Le fichier n’est ni chiffré ni signé, et les métadonnées sont lisibles. Ne distribuer que les ressources dont le partage est autorisé.

La restauration vérifie le manifeste, la taille exacte, les identifiants et tous les blocs avant de proposer sa confirmation. Un média altéré, une troncature, des octets supplémentaires ou un identifiant dupliqué sont refusés. L’annulation est prise en compte entre les blocs. Après confirmation, les validations et la transaction de restauration en copies restent celles du jeu ; les nouveaux identifiants sont réassociés aux personnages et voix guides.

Plafonds de format : 1 Gio de médias, 1 000 ressources, 16 Mio de métadonnées, 250 morceaux par restauration. Ce sont des plafonds de contrôle, pas une promesse de prise en charge confortable sur tout téléphone. Le test de 256 Mio est un banc synthétique Node, pas une restauration IndexedDB de 256 Mio sur iPhone. Le navigateur conserve ses propres contraintes de quota et de mémoire.

Le `.pulsepack` historique reste disponible pour les versions précédentes, avec son plafond existant de 180 Mio de médias. **Le `.pulsebundle` nécessite la V25 ou une version ultérieure qui prend ce format en charge.** Garder un export `.pulsepack` compatible en cas de retour à une ancienne version.

## 3. Performance et compatibilité conservées

Les morphs de sommets utilisent maintenant un tampon de travail réutilisé. Il est réinitialisé depuis la géométrie originale à chaque évaluation utile ; les déformations ne s’accumulent pas. Revenir à un poids nul restaure le tampon GPU. Le test lit réellement ce tampon et vérifie l’identité de la mémoire de travail entre les images.

Le SDEF/QDEF, les héritages standards, limites IK et surfaces V24 sont conservés. Les parcours antérieurs V20 à V24 sont réexécutés sur le nouveau HTML. AutoMap n’est pas remplacé par un nouveau moteur musical dans cette passe ; son fonctionnement et la priorité des sources existantes restent testés.

## 4. Exemples et développement

`examples/v25/FACE_ROBOT.pmx` est un robot original volontairement simple, avec `mouthOpen`, `blink` et le groupe `Talk`. `BOUCHE_VMD_ZERO.vmd` et `GROUPE_VMD_ZERO.vmd` possèdent des clés à zéro pour vérifier la priorité de l’animation existante. `VOIX_SYNTHETIQUE_TEST.wav` contient des sons harmoniques pulsés, **pas une personne parlant ni un vrai chant**. `EXEMPLE_FACE_MANUELLE.pulseface.json` montre une piste manuelle.

Construire : `python build.py`. Logique : `node --test tests/*.test.cjs`. Parcours V25 : `python tests/v25_browser_test.py`, avec Playwright/Chromium et WebGL disponibles. Sur une machine Linux de test dépourvue d’écran, `xvfb-run -a` fournit un affichage logiciel. Les tests du lanceur sont indépendants. Le HTML autonome ne requiert ni Node ni npm pour jouer.

`node tests/v25_bundle_benchmark.cjs` exécute le banc synthétique binaire de 256 Mio ; les données volumineuses ne sont pas déposées dans l’archive du projet. Les anciens rapports restent historiques. Lire `RAPPORT_V25.md` pour la portée exacte de chaque résultat.

## 5. Chantiers non fermés

Les vrais visèmes, reconnaissance des paroles, séparation vocale, adaptation des motions/contacts au sol, Bullet et corps souples, effets MME complets, corpus de modèles représentatif, catalogue en ligne, identification des réencodages audio et équivalence SEGA 1:1 ne sont pas terminés par cette passe. La qualité musicale des charts sur de vraies chansons nécessite encore une écoute et un corpus annoté varié.

La persistance après fermeture, la coordination native de plusieurs fenêtres, Safari/iPhone, l’installation hors ligne complète et les contrôleurs physiques restent non certifiés. Le HTML de test est injecté dans un document autorisé en mémoire, pas navigué à une adresse bloquée par les règles du navigateur.
