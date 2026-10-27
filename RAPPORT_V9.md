# DIVA PULSE V9 — Rapport MMD Director

## Ajouts validés
- MMD Director additif, compatible avec les morceaux V8 sans Director.
- 1 à 4 instances PMX simultanées à partir du pack MMD du morceau.
- Sélection indépendante d'une motion VMD par danseur.
- Placement centré et espacement réglable, rotation Y, vitesse et caméra principale.
- Timeline interne de clips prête pour séquençage; génération de coupes caméra toutes les 4 mesures à partir du BPM.
- Restauration pulsepack : remapping des identifiants VMD utilisés par les slots Director.
- AutoMap V6/V8 conservé intégralement.

## Tests exécutés
- `npm test` : 264/264 PASS (260 hérités + 4 Director).
- `tests/launcher_test.py` : 10/10 PASS après passage du lanceur en version 9.0.0.
- Suite navigateur : démarrage et vrai WebGL2/rendu de scène confirmés avant expiration de la fenêtre d'exécution; la suite exhaustive n'a pas terminé dans la fenêtre disponible. Aucun total exhaustif navigateur V9 n'est revendiqué.

## Limites MMD encore réelles
- PMX natif; PMD reste inspection-only.
- SDEF approximé; courbes Bézier VMD non exactes.
- Pas de Bullet rigid bodies / soft bodies.
- Sphere maps SPH/SPA, toon MMD complet et TGA non exhaustifs.
- Le Director V9 réutilise le modèle PMX du pack du morceau; plusieurs modèles PMX totalement différents dans un même spectacle restent une étape suivante.
- Les coupes auto utilisent actuellement la structure métrique/BPM, pas encore une segmentation sémantique couplet/refrain issue d'un modèle ML.

## Sécurité / droits
Aucun modèle, motion ou chanson MMD tiers n'est redistribué. Les fichiers importés restent locaux et leurs licences restent celles de leurs auteurs.
