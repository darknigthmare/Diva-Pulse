# V33 — Ressenti du live et entrées fiables

## VFX / SFX

Le retour de frappe suit les événements de jugement, pas une double émission touche + jugement. COOL utilise un halo et des rayons courts, FINE un anneau, les erreurs une petite croix. Les slides disposent d'une indication directionnelle et les maintiens d'un arc de progression. Les symboles, les fenêtres de jugement, les notes et le score ne sont pas modifiés.

Les sons Pulse, Arcade et Soft sont synthétisés localement à partir d'ondes et d'enveloppes ; aucun échantillon commercial ou téléchargement n'est nécessaire. Le timbre dépend de la piste, du jugement et du type tap/slide. Les sons d'erreur sont désactivés par défaut. Le réglage « Sons de frappe » s'applique aussi à l'autoplay. Volume nul, pause et sortie interrompent les sons actifs.

Dans Réglages > Chaque frappe compte : intensité visuelle 0–100 %, choix du timbre, signal sonore d'erreur et bouton d'écoute. Une sauvegarde refusée conserve le réglage précédent et remet le contrôle en cohérence. Les options « Réduire les éclats », « Réduire les mouvements » et la préférence de mouvement réduit du système sont respectées. Pas de flash plein écran. Ce n'est pas une certification de photosensibilité.

Budgets : 48 impacts en mémoire, 12 voix audio simultanées et 96 buffers maximum. Le mode sobre supprime les rayons et maintient les anneaux à une position fixe. Ces limites ne remplacent pas une mesure de performance sur tous les appareils.

## Correctifs gameplay

Une reprise en attente de l'initialisation audio vérifie encore la partie et la vue au retour : quitter le morceau pendant cette attente ne relance plus la musique cachée. Les entrées pendant la pause ne restent pas armées. Une perte de capture tactile relâche uniquement la source concernée ; une touche clavier simultanée reste maintenue. Les pistes hors plage et temps non finis sont refusés avant le calcul des bonus de maintien.

## Vérifier

```sh
python3 build.py
npm test
python3 tests/launcher_test.py
xvfb-run -a python3 tests/v33_browser_test.py
```

Le test navigateur utilise HTTP/IndexedDB par défaut. `PULSE_DOCUMENT_MODE=1` est un mode de document injecté explicite pour les environnements restreints ; il ne constitue pas une preuve de persistance native. Le vérificateur `tools/verify_pr33.py` refuse ce mode comme validation native. Le test de charge injecte des événements : il ne simule pas une partie entière de 10 000 notes jouée manuellement.

## Périmètre restant

Mixage artistique complet, voix, ambiances de scènes, corpus de morceaux denses, mesure de latence acoustique et qualification iPhone/Safari/Firefox/manettes restent ouverts. Aucun changement des schémas de sauvegarde Director 19/20 ni des règles de score n'est requis. Les acquis audio/montage/sauvegardes V30–V32 restent conservés.
