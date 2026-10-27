# Passage de la V2 à la V3

## Musical et édition

Carte de tempo cumulative utilisée par grille/métronome ; événements BPM éditables avec historique ; origine de grille distincte de l’audio ; subdivisions ternaires ; sélection multiple et rectangle ; opérations atomiques de groupe ; collage et duplication ; dispositions de cibles ; inspector angle/distance ; contrôle de partition non destructif. La réouverture du studio suit la partition sélectionnée, sans réutiliser une ancienne version par erreur.

## Import/export

Lecteur MIDI 0/1 borné, aperçu et avertissements, mapping adapté/Pulse, option maintiens, piste/percussions, métadonnées natives exactes ; export SMF 1. Les valeurs de chart invalides ne sont plus silencieusement limitées. Les sources MIDI sont protégées comme les sources JSON/DSC/CSV/démo. Un groupe de notes invalide est entièrement refusé.

## Moteur et résultats

Intervalle d’entraînement borné des deux côtés ; bonus HOLD calculé jusqu’au timestamp précis du relâchement ; cumul stable entre grandes et petites images ; chaînes maintenues traitées sans dépendre d’une image rendue au même instant ; prise en compte du timestamp d’événement ; présentation-clock optionnelle avec repli ; statistique médiane/dispersion ; reprise de segments ; capture/export/import/lecture de replays ; pause de replay conservant ses touches enregistrées ; records non modifiés par replays/No Fail.

## Spectacle et bibliothèque

Setlists ordonnées avec identités de charts ; lancement explicite du morceau suivant ; caméra à transitions temporelles déterministes ; montage toutes les quatre mesures ; public/projecteurs activables ; espacement des partenaires ; orientation/taille GLB ; offset vidéo par morceau.

Export par morceau ou bibliothèque ; médias référencés seulement ; restauration V2/V3 avec confirmation ; copies et nouveaux IDs ; rattachement des records ; remplacement de préférences facultatif ; setlists remappées. Le repli mémoire utilise aussi une transaction préparée avant écriture : une erreur de ligne ne laisse pas de demi-import.

## Corrections trouvées durant la passe QA V3

Correction de l’aide V3 (mauvais sélecteur DOM), de la conservation de sélection de chart dans le studio, de l’état des HOLD lors d’une pause de replay et du relâchement provenant d’une entrée physique non utilisée pendant un replay. Réinitialisation du métronome après recherche temporelle. Conservation des tempos suivants lors de l’édition du BPM initial. Contrôles asynchrones testés avec attente de leur état final, pas avec une durée arbitraire dépendant de la vitesse du GPU logiciel.

Les anciennes assertions de sauvegarde ont été adaptées au comportement voulu : la V3 n’exporte plus les médias orphelins (ex. GLB retiré de la scène), et la restauration exige une confirmation. Les vérifications gardent le contrôle d’intégralité de toutes les références effectivement utilisées.

Aucun changement ne prétend importer tous les modèles/partitions/chorégraphies officiels ou reproduire le barème SEGA 1:1.
