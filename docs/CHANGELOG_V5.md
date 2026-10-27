# V5.0.0 — Precision & Musical Studio Edition

Base conservée : l’archive V4 fournie, sans réécriture du jeu depuis une maquette vide.

## Audio et entraînement

Traitement WSOLA local mono/stéréo dans un Worker ; tampon temporaire pour un passage de 120 secondes maximum, plafonné en mémoire. Lecture du tampon à hauteur conservée avec temps musical distinct, sans écraser le buffer original. Source multicanale refusée plutôt que tronquée silencieusement. Validation des échantillons non finis, annulation et timeout.

Compensation des entrées en millisecondes réelles ajustée au ralenti. Clics de pré-décompte séparés. Progression adaptative : préparation du nouveau tampon avant la tentative à vitesse accrue ; pause/reprise/sortie sans tampon orphelin. Le mode classique sans traitement reste disponible.

## Création musicale

Carte `meterMap` optionnelle, origine en noires, numérateurs 1–16 et dénominateurs 2/4/8/16, groupes d’accents. Changements sur débuts de mesure uniquement. Grille, numéros, métronome et montage automatique PV suivent mesures/BPM sans retimer les notes.

Édition par panneau, repère au curseur, annuler/rétablir, dérivation des sources et sauvegarde de brouillon. Export des signatures standard MIDI et du JSON natif complet. Import des signatures MIDI valides ; avertissement et conservation des métadonnées originales si la grille ne peut pas représenter le changement.

## Entrées MIDI

Connexion explicite sans SysEx et sans sortie instrumentale, entrée/canal, six notes configurables et apprentissage avec échange d’assignations. Utilisable en jeu ou dans l’enregistrement du studio. Sources indépendantes par port/canal/touche, messages malformés ignorés, vélocité nulle traitée comme relâchement, répétitions filtrées. Nettoyage à l’arrêt, la pause, la perte de focus et la déconnexion.

## Académie et contenu original

Six leçons sur un nouvel instrumental de 32 secondes : pulsation, alternance, accords, HOLD, slides/chaînes, finale. Installation à la première utilisation, sans doubler le morceau aux lancements suivants. Les trois démos / quinze charts précédents sont conservés.

Médailles à vitesse complète, objectif de précision et absence de MISS/WRONG, bonus HOLD requis pour sa leçon. Progression séparée des records, export V5 et fusion préservant les meilleurs résultats. Ajout d’un exercice importable original en 3/4 → 7/8 → 6/8 et d’un catalogue avec empreintes audio réelles.

## Robustesse et sauvegardes

Diagnostic non destructif des médias/partitions et export du diagnostic. Isolation au démarrage d’un morceau invalide, conservation/export de l’enregistrement brut. Refus des accès à une base invalidée plutôt que repli silencieux sur une mémoire vide. Contrôles de compatibilité dans les imports de progression.

Le cache statique et le lanceur portent la version 5.0.0, avec la même adresse locale fixe par défaut. Les règles normales restent rules4. L’archive fournit une version autonome, pas un nouveau déploiement.

## Ce qui n’a pas été ajouté

Pas de recherche en ligne de niveaux officiels, ni médias/modèles/chorégraphies officiels, rendu ou scoring SEGA intégral, compte cloud, classement distant, application native ou certification de performance. Les tests ne couvrent pas le matériel MIDI réel, Safari/iOS, ni la persistance IndexedDB après fermeture. Voir le rapport et les limites.
