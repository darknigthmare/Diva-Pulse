# Exemples techniques originaux

Ces médias servent à vérifier les imports. Ils ne sont pas des niveaux ou fichiers officiels de Project DIVA.

Importer CONTROLE_120_BPM.wav, puis CONTROLE_120_BPM.json : la partie comporte quinze notes et dure huit secondes. Le fichier LRC correspondant ajoute des instructions synchronisées. Le DSC synthétique est une autre petite partition de sept notes, écrite pour vérifier les unités et le mapping FT/MM+ ; elle peut être importée comme variante sur le même audio.

MANNEQUIN_QA_ANIME.glb est un volume technique à douze triangles et deux articulations, avec une boucle d’animation. Il sert à vérifier le chargement du squelette, pas à remplacer les silhouettes par un personnage détaillé.

CLIP_CONTROLE.mp4 est une mire technique animée originale de quatre secondes, produite avec le filtre testsrc2 de FFmpeg. Elle permet de contrôler la lecture d’un MP4 local ; le lecteur se fige ensuite sur sa fin si l’audio continue.

## Nouveaux contrôles V3

`CONTROLE_TEMPO_VARIABLE_V3.mid` : MIDI type 1 exporté par V3, avec une partition native de sept notes, trois tempos 120/180/90 et des trajectoires. `CONTROLE_TEMPO_VARIABLE_V3.json` est la même partition lisible. Le réimport natif conserve les valeurs exactes ; décocher le natif dans l’aperçu permet d’observer le mapping des événements MIDI ordinaires.

`CONTROLE_REPLAY_V3.pulsereplay` : sept notes et leurs transitions de touches déterministes. Associer explicitement ce replay au WAV de contrôle ; aucun audio n’y est embarqué et aucune empreinte n’a été inventée. Le signal audio garde sa pulsation fixe : ce fixture vérifie la chronologie et le tempo de grille séparément, pas une chanson arrangée à tempo variable.
