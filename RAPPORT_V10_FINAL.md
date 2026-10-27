# DIVA PULSE V10 — Rapport final

## Ajouts de clôture
- Jusqu'à 4 danseurs PMX simultanés.
- PMX distinct sélectionnable par danseur.
- Motion VMD de base distincte par danseur.
- Timeline de clips VMD par danseur : début/fin, vitesse, boucle, temps local et caméra.
- Sélection du clip réellement exécutée selon le temps musical.
- Génération automatique du spectacle depuis les sections de partition ; fallback en phrases musicales quand aucune section n'existe.
- Rotation des motions disponibles entre sections et danseurs.
- Plans caméra automatiques toutes les quatre mesures.
- Sauvegarde/restauration pulsepack : remapping modèle, motion de base et motions des clips.
- AutoMap cinq difficultés, studio, MIDI, entraînement, académie et fonctions V1–V9 conservés.

## Validation exécutée
- `npm test` : 268/268 PASS.
- `python3 tests/launcher_test.py` : 10/10 PASS.
- `xvfb-run -a python3 tests/mmd_runtime_browser.py` : 4/4 PASS (PMX réellement rendu, os VMD animé, WebGL sans erreur, contrôles MMD présents).
- Build autonome : HTML inline sans CDN.

## Limites restantes explicites
Ce projet n'est pas une réimplémentation exhaustive de MikuMikuDance ni de Project DIVA. PMX est le format rendu par le runtime ; PMD reste inspectable. SDEF n'est pas exact, les courbes Bézier VMD ne sont pas reproduites intégralement, Bullet/rigid bodies/soft bodies ne sont pas actifs, et SPH/SPA/toon/TGA ne sont pas tous reproduits comme MMD natif. Les médias, modèles et chorégraphies propriétaires ne sont pas fournis.

La génération AutoMap est heuristique et doit pouvoir être corrigée manuellement ; elle n'est pas présentée comme la partition officielle d'une chanson.
