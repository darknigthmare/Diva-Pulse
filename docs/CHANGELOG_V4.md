# V4 — Encore & Library Edition / 4.0.0

Base : archive V3 Performance & Creator Edition fournie. Les sources V3 sont étendues ; les moteurs 3D, imports existants, exemples et 15 partitions de démo sont conservés.

## Bibliothèque et niveaux existants

Catalogue local `.pulsecharts`, import avec confirmation, examen des difficultés, association exacte aux octets SHA-256 ou à l’identifiant d’une démo, confirmation explicite des associations non vérifiées. Conservation du timing et de la provenance ; éditions différentes disponibles sans modification silencieuse. Déduplication de contenu et garde-fous de capacité. Ajout/export du morceau courant au catalogue, export sans audio, sauvegarde du catalogue global dans `.pulsepack`.

Tri par identité de morceau, y compris titres identiques ; aperçu audio de quinze secondes interrompu par navigation ; histogramme de densité ; suppression explicite d’une partition précédée d’un choix de sauvegarde JSON.

## Génération

Sélection d’attaques selon difficulté et densité, motifs de touches réutilisés pour phrases rythmiques similaires, variantes de placement, activation séparée des accords/HOLD/slides, maintien limité à l’énergie audible mesurée. Quantification facultative plafonnée à 35 ms. Aperçu avant ajout avec densités, nombre de notes, tempo et confiance. Annulation non destructive. Analyse du canal de plus forte énergie pour éviter la disparition d’un signal stéréo en opposition de phase ; rééchantillonnage par tranches avec annulation.

La détection reste globale et heuristique. Pas de séparation vocale, transcription de mélodie, compréhension des paroles ou classification automatique de refrain.

## Studio et entraînement

Brouillons séparés des sources, écritures séquentielles avec statut visible, récupération/export/abandon explicites. Échec d’une sauvegarde de morceau : brouillon et état modifié restent récupérables. Récupération d’un parent supprimé sans écrasement d’une autre partition. Une sauvegarde réussie efface le brouillon concerné.

Sections audio nommées, validation, écoute, entraînement et historique annuler/rétablir. Boucles avec progression de vitesse de 5 points après objectif atteint sans MISS/WRONG. Historique de tentatives local séparé des records. Raccourcis d’accords clavier optionnels et deux macros de gâchettes manette, avec sources de maintien indépendantes.

## Moteur, rendu et stockage

Correction reproduite : maintenir la touche avant la tête de chaîne validait toutes ses notes ; une tête valide est désormais nécessaire. Compatibilité historique explicitement limitée aux replays V3 pour cette interprétation. Records des règles V4 séparés des anciens records, sans suppression.

Fenêtre de notes visible obtenue par recherche binaire dans la liste triée, recherche d’erreur de touche bornée. Masque du décor, taille des symboles et réduction des effets. Scène 2D simplifiée explicitement annoncée lorsque WebGL 2 est absent.

Base IndexedDB historique conservée, traitement de fermeture par changement de version et refus des écritures plutôt qu’un faux succès en mémoire. Import natif avec restauration de l’objet vivant en cas de refus de stockage. Sauvegardes V4 : catalogue et brouillons en plus des données V3, remappage des propriétaires lors de la restauration transactionnelle en copies. Les historiques de sessions/replays/tentatives ne sont pas fusionnés automatiquement.

Lanceur à origine locale fixe, contrôle de la version exacte déjà démarrée et refus de changer silencieusement de port. Manifest et service worker facultatifs ; logique de cache limitée aux fichiers du jeu, pas aux médias personnels ; pas de remplacement forcé du runtime pendant une partie. Le service worker conserve une réponse réseau valide même si son écriture de cache échoue.

## Vérification et périmètre

Voir le rapport de tests pour les comptes exécutés. Les tests de service worker sont des contrats isolés, non des installations navigateur ; les tests de lanceur sont HTTP, non des preuves de persistance. Pas de certification Safari/iPhone, contrôleur physique ou latence instrumentale. Pas de publication en ligne, de modèles officiels, de niveaux officiels téléchargés ou de promesse de clone complet 1:1.
