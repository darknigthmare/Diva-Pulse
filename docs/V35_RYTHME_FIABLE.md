# V35 — Rythme fiable et préparations annulables

## Application des guides gamedev

La V35 applique la sélection figée du [guide de développement](GUIDE_DEVELOPPEMENT_GAMEDEV.md) au moteur maison : `input-systems`, `audio-design` et `game-ui-ux`. Elle transforme les principes en corrections observables, en résultats numériques attendus et en parcours navigateur. Le projet reste autonome en JavaScript, Canvas 2D, WebGL 2 direct et Web Audio.

## Chaînes et ordre musical

Avant la correction, les mêmes entrées pouvaient produire deux résultats : tête de slide à 1,000 s, continuation à 1,020 s, relâchement à 1,030 s. Sans image intermédiaire : 1 COOL, 1 MISS et 1 000 points ; avec une image à 1,021 s : 2 COOL et 2 002 points.

`press()` et `release()` font avancer les événements jusqu'au timestamp de l'entrée avant de changer les touches maintenues. Les MISS et continuations sont résolus dans l'ordre musical, même lorsqu'une image franchit plusieurs échéances. Une garde évite la récursion de l'autoplay. Les relâchements retardés et doublons de touche ne font pas reculer l'horizon de présentation.

La suite `tests/rhythm-events.test.cjs` contient 23 tests : fenêtres exactes et voisines, offsets ±250 ms, événements simultanés, autoplay, compatibilité de chaînes V3, HOLD à 200 points/s et plafond de cinq secondes, puis comparaison à 0/30/60/144 Hz simulés. Ces garanties supposent des événements livrés chronologiquement ; le moteur ne reconstruit pas rétroactivement une entrée reçue après une mise à jour plus avancée.

## Lancements, reprises et boucles

Chaque demande conserve son identité avant les préparations asynchrones. Un masquage de la page, une interruption audio, une navigation ou une demande plus récente invalide la précédente. Le résultat tardif d'un worker ne peut pas autoriser une nouvelle lecture.

Le lancement prépare l'audio, la scène et la vidéo avant de démarrer le transport. Une sauvegarde légitime du Studio peut créer une partition dérivée : le lancement utilise cette version enregistrée. Les extensions propagent l'annulation, y compris le replay ; une vidéo tardive ne laisse pas une partie partiellement initialisée avec le mauvais profil de jugement.

Une boucle en cours de préparation s'arrête aussi lorsque le contexte audio est suspendu. Le retour à un contexte actif ou à un onglet visible ne redémarre pas la musique. Le bouton Reprendre conserve son rôle explicite. Une ancienne reprise qui échoue après une reprise plus récente ne coupe pas la lecture courante.

Le parcours `tests/v35_playback_browser.py` vérifie 22 comportements sur HTTP/IndexedDB et Web Audio natifs. Il diffère volontairement certaines promesses et injecte les événements de visibilité pour reproduire les courses ; son cas WSOLA final utilise le vrai worker. Cela ne mesure pas la latence acoustique ni le throttling d'un appareil physique.

## Cibles et contrat des règles

Le rendu utilisait une limite tardive fixe de 150 ms. Le profil Accessible acceptait pourtant les frappes jusqu'à 180 ms : une cible pouvait devenir invisible alors qu'elle restait jugeable. La sélection et le rendu suivent maintenant `engine.windows[3]`, donc le profil de la prise ou du replay. Les bornes standard/accessibles/précision restent 140/180/100 ms. Les fenêtres de jugement ne sont pas élargies.

Le [contrat `rules4`](REGLES_DIVA_PULSE_V1.md) documente les profils, le score, la précision, la vie, le combo, HOLD, chaînes, accords, offsets, entraînement, replays et records. Ses 135 tests comprennent 20 scénarios aux résultats chiffrés, 17 simulations de replay, des frontières signées et le vrai `drawGame` instrumenté. Une cible accessible à +170 ms reste dessinée et reçoit SAD.

Les formats et records existants sont conservés sans migration ni recalcul automatique. Un ancien résultat enregistré peut différer d'un replay recalculé avec V35 : les anciennes cadences d'affichage et les délais de livraison ne sont pas enregistrés. La compatibilité du format ne certifie pas la reproduction numérique de chaque ancien moteur.

## Preuves et suivi

- Suite Node : 1 200 tests, dont 158 nouveaux (135 de contrat et 23 d'événements).
- Lanceur : 10 contrôles HTTP locaux.
- Parcours V35 : 22 contrôles navigateur ; les huit suites précédentes apportent 164 contrôles de régression supplémentaires.
- `tools/verify_release.py` contrôle la version et les deux HTML identiques, générés de façon reproductible depuis les sources.
- `tools/verify_pr35.py` exige les preuves fraîches des neuf parcours sur le même hash de build, le TAP complet, le lanceur, le hash exact du classeur et l'égalité des 136 lignes entre Excel, JSON et CSV. La CI produit `qa/v35/verified.json` et conserve ses résultats avec le commit examiné.

Les 23 contrôles Director hérités utilisent un document injecté. Les autres parcours imposés ici utilisent HTTP natif ; le nettoyage vérifie un véritable abort IndexedDB après une requête de suppression. Le GPU est logiciel et les dimensions mobiles sont émulées. Aucun appareil physique, périphérique, corpus MMD complet ou résultat acoustique n'est certifié.

Le [suivi V35](../planning/README.md) conserve 136 points et 17 onglets. `GAME-01` devient Partiel ; les règles maison sont spécifiées, mais aucune édition officielle de Project DIVA n'a été choisie comme référence certifiée. Les autres statuts restent inchangés. Les onglets et fichiers historiques V30–V34 sont conservés.
