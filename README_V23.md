# DIVA PULSE V23 — Audit & Compatibility

## Jouer et migrer

Exporte ta bibliothèque précédente en `.pulsepack` et conserve ce fichier. Décompresse le ZIP V23. Ouvre `DIVA_PULSE_JOUER.html`, ou lance `lancer.py` avec Python 3 au moyen des lanceurs fournis. Le serveur utilise une adresse locale fixe ; ne confonds pas sa bibliothèque avec celle d’un autre navigateur ou d’un HTML ouvert directement.

Dans Réglages, restaure le `.pulsepack` en copies. Vérifie les musiques, partitions, modèles, motions et les spectacles avant d’effacer une ancienne sauvegarde. Les options de reprise des préférences restent explicites.

**TEMPORAIRE : les données ne sont pas garanties après fermeture. Exporte avant de quitter.** STOCKAGE FERMÉ signifie que la connexion a été invalidée ; recharge l’application, ne continue pas à éditer en croyant être enregistré. Le ZIP contient le code et ses démos, pas les musiques personnelles que tu as importées dans une autre session de navigateur.

## Ce qui change en V23

Cette passe traite les échecs de sauvegarde, la récupération du Director, la perte de la 3D, la déformation SDEF/QDEF et les coûts d’AutoMap. Les systèmes précédents restent présents : partitions exactes du catalogue local, cinq difficultés automatiques, studio manuel, MIDI, replays, entraînement, PMX/PMD/VMD, Auto Show et protections du manuel.

L’audit complet et ses points ouverts sont dans **AUDIT_V23.md**. Les tests réellement exécutés et leurs limites sont dans **RAPPORT_V23.md**. Le JSON d’audit est prévu pour le suivi de développement.

## Contrôler la bibliothèque

Ouvre **Réglages → Diagnostic → CONTRÔLER AVANT DE JOUER**. Le bouton **Auditer ma bibliothèque** examine les difficultés absentes, partitions invalides ou hors de l’audio, médias référencés manquants, plans de spectacle invalides et motions non calées. Ouvre les lignes des morceaux pour voir leur détail. **Exporter le diagnostic JSON** produit un fichier indépendant.

Le diagnostic ne modifie et ne supprime rien. Une difficulté absente ou un BPM de motion non renseigné est une information, pas nécessairement une erreur. Une bibliothèque sans anomalie structurelle peut néanmoins contenir un mapping musical à corriger ou un modèle graphiquement incompatible.

Les six raccourcis du haut des réglages conduisent à Audio, Commandes, Sauvegardes, AutoMap, Spectacle et Diagnostic.

## Récupérer un Director non terminé

Dans Modules → MMD Stage → Director, chaque modification valide crée un brouillon séparé. La scène enregistrée reste inchangée tant que tu n’utilises pas **Enregistrer**. Le statut indique si le brouillon a été enregistré localement, s’il est temporaire ou si l’écriture a échoué.

Après fermeture du panneau, rouvre le Director et utilise **Reprendre le brouillon**. Cette action reste annulable. Même si l’écriture a échoué, l’état récent reste disponible en mémoire pendant la session. L’export `.pulsepack` V23 emporte aussi les brouillons Director et leurs médias ; une restauration en copies remappe leurs identifiants.

**Un brouillon dans le stockage TEMPORAIRE n’est pas durable.** Exporte avant fermeture. La persistance des brouillons après fermeture complète d’un vrai navigateur avec IndexedDB n’a pas pu être testée ici. L’export du Director JSON permet également de conserver son montage séparément, mais ne contient pas à lui seul les modèles et textures.

## Sauvegarder après un refus d’écriture

Un favori, un titre, une préférence ou une setlist refusés ne doivent plus apparaître comme enregistrés. Le champ ou la file de travail reste disponible pour réessayer. L’export de la bibliothèque ne réenregistre plus automatiquement les morceaux avant de les lire ; il peut donc servir de récupération lorsque les nouvelles écritures échouent mais que les données existantes restent lisibles.

Ce mécanisme ne récupère pas des données que le navigateur a déjà supprimées. Un stockage totalement fermé exige un rechargement ; ne force pas un faux passage en mémoire vide.

## Modèles MMD et nouveau calcul de déformation

Importe le ZIP MMD ou le dossier complet, en conservant les textures et leurs chemins. Utilise le contrôle et l’aperçu 3D avant confirmation. Le traitement SDEF/QDEF s’active automatiquement suivant les types de sommets du PMX ; il n’y a pas de case supplémentaire à cocher.

Pour un contrôle technique original, `examples/v23/` contient `SDEF_STRIP.pmx`, `QDEF_STRIP.pmx` et `BEND.vmd`. Les bandelettes se déforment sous deux os et utilisent deux matériaux. **Ce ne sont pas des personnages finalisés.** Les exemples MMD plus anciens sont conservés.

Le calcul de déformation ne remplace pas Bullet, les contraintes complexes des os ou le retargeting. Un PMX importable peut encore différer de MMD Desktop. Les modèles et motions téléchargés par le joueur restent à vérifier dans l’aperçu.

## Que se passe-t-il si la 3D tombe ?

La perte du contexte graphique est détectée. Une partie en cours est mise en pause, y compris son horloge audio. Si le navigateur restitue le contexte, le jeu recrée les ressources et recharge les personnages depuis les médias locaux. Il **ne relance pas la partie sans ton intervention**.

Si le contexte n’est pas restitué, ou que les médias ne sont plus lisibles, le message reste explicite. Les partitions et le spectacle enregistré ne sont pas réécrits pour contourner la panne.

## AutoMap et spectacle automatique

Garde **5 difficultés automatiques** et **Spectacle automatique** cochés pour préparer les deux à l’import. Une source exacte disponible localement reste prioritaire. Le spectacle utilise les scènes intégrées, la troupe choisie et les VMD compatibles, ou un repli procédural limité aux os reconnus.

V23 accélère une partie du générateur sans changer les notes produites par V22 pour une même analyse et les mêmes options. Les timings, types et positions ont été comparés, pas seulement leurs nombres. Il faut toujours écouter et éventuellement corriger les propositions sur les chansons difficiles à analyser.

Les pistes manuelles, plans figés et charts importées ne deviennent pas automatiques lors de cette mise à jour. Le BPM source d’un VMD reste à renseigner pour son calage musical précis ; la génération ne déduit pas encore un tempo fiable pour toute chorégraphie.

## Tests et développement

Construction : `python3 build.py`. Tests de logique : `node --test tests/*.test.cjs` avec Node 22 ou plus. Le jeu n’a besoin d’aucune dépendance npm pour être ouvert. Les scripts navigateur nécessitent séparément Python Playwright et Chromium ; leur configuration utilise un rendu logiciel et n’est pas une validation de toutes les plateformes.

`qa/v23/final-launch.txt` décrit les commandes finales. Les JSON navigateur contiennent l’empreinte exacte du HTML testé. Les anciens rapports restent historiques. `SHA256SUMS.txt` interne décrit les fichiers du package, à l’exception de lui-même.

## Google Drive

La V22 existante reste intacte dans le dossier dédié. **La V23 n’a pas pu être téléversée pendant cette session : les actions actuelles de la connexion Google Drive permettent la lecture, mais pas la création ou l’envoi de fichiers.** Les fichiers de cette livraison sont fournis en téléchargement séparé.

Un dépôt du ZIP sur Drive ne serait ni un hébergement du jeu ni une synchronisation de la bibliothèque du navigateur. Aucun nouveau partage public et aucun déploiement distant ne sont effectués.
