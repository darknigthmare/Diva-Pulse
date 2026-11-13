# DIVA PULSE : livraison statique Vercel

Projet : `diva-pulse` (`prj_8DgFfcdqT0fiaBSL2dSnHEW9NKE6`), équipe `darknigthmares-projects`. Domaine de production affecté : https://diva-pulse.vercel.app/ ; sa disponibilité doit être contrôlée sur le déploiement courant.

Révision de préparation : `9bbf125cba1f20f49634a4cf49a346d87b2f013e`. `index.html` et `DIVA_PULSE_JOUER.html` sont identiques : 922 489 octets, SHA-256 `61d87a5929a91331b699005c4a5582e312a84abf821460fa915091f5b4bfd8ba`. Version du programme : V37.

Le fichier `vercel.json` conserve le build de copie testé. Réglages du projet : Framework Other/null, Root Directory vide, Node.js 24.x, branche de production `main`, protection SSO désactivée pour ce site public demandé. L'installation vaut `true` et ne lance pas npm install.

La sortie `.vercel-static/` contient seulement les deux HTML, `manifest.webmanifest`, `sw.js`, `icons/icon-192.png` et `icons/icon-512.png`. Le deuxième HTML conserve le start_url de la PWA. Le serveur Python local et sa route `/pulse-health` servent au lanceur de bureau ; ils ne sont pas nécessaires sur le CDN.

Les fichiers HTML du jeu ne sont ni réécrits ni minifiés. La sortie autorisée ne contient ni sources de développement, ni rapports, ni historiques. Aucun backend, fonction applicative, base de données, secret de jeu ou abonnement payant n'est ajouté.

Le numéro de version décrit le build, pas une validation exhaustive de la partie. Les profils sauvegardés restent propres à chaque origine navigateur ; utiliser les commandes d'export/import du jeu pour transférer un profil local.

Validation : comparer les six fichiers servis en HTTPS à leurs sources, ouvrir bibliothèque → éditeur → bibliothèque puis Autoplay natif, vérifier scène WebGL et audio en cours. Une démonstration assistée courte ne certifie ni jeu rythmique manuel, ni latence acoustique matérielle, ni compatibilité universelle des imports MMD.
