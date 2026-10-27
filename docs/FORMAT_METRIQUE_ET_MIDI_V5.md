# Format métrique et entrées MIDI — V5

## Trois axes distincts

Les notes restent en secondes dans l’axe de la partition. Leur instant audio est `note.time + chart.offset`. Les BPM (`tempoMap`) sont datés dans l’axe de la partition, avant cet offset. `gridOffset` est un temps de cet axe définissant l’origine de la grille.

La carte métrique utilise des **noires relatives à cette origine**, pas des secondes, ni les unités du dénominateur :

```json
{
  "bpm": 120,
  "offset": 2,
  "gridOffset": 0,
  "tempoMap": [{"time":0,"bpm":120}],
  "meterMap": [
    {"beat":0,"numerator":3,"denominator":4,"groups":[1,1,1]},
    {"beat":12,"numerator":7,"denominator":8,"groups":[2,2,3]},
    {"beat":26,"numerator":6,"denominator":8,"groups":[3,3]}
  ]
}
```

Ici le 7/8 commence à l’audio 8 s, après quatre mesures de 3/4. Le 6/8 commence à 15 s, après quatre mesures supplémentaires de 7/8. Les positions des notes ne sont pas modifiées lorsqu’on change cette carte.

Une mesure occupe `numerator * 4 / denominator` noires. La position d’un changement doit être une frontière complète de la signature précédente, avec tolérance numérique bornée. La première entrée commence à 0. Maximum 512 entrées, pulsation de 0 à 50 000, numérateur entier de 1 à 16, dénominateur 2/4/8/16. Les groupes sont des entiers positifs dont la somme vaut le numérateur.

Sans `meterMap`, l’ancien comportement 4/4 reste en place. La validation renvoie une copie ; une erreur empêche de remplacer la carte en cours. Les numéros de mesure et durées calculées ne sont pas enregistrés comme vérité indépendante : ils sont recalculés depuis les signatures.

## Grille et métronome

Les subdivisions simples ou ternaires restent exprimées relativement à la noire. Une ligne de mesure est ajoutée même si la subdivision visible ne tombe pas naturellement dessus, par exemple une grille de noires dans du 7/8. Le métronome utilise les unités du dénominateur, distingue la première pulsation et les débuts de groupes. Les événements PV automatiques sont créés toutes les quatre mesures réelles ; leur temps est conservé en secondes audio.

Le générateur de notes n’identifie pas automatiquement les signatures. `meterMap` pilote l’édition, le métronome et le montage ; il ne transforme pas une génération précédente en nouvelle transcription.

## Fichiers MIDI

L’export SMF conserve ses deux pistes et 9 600 ticks par noire. Il écrit les véritables numérateurs/dénominateurs en méta-événements `0x58`, leurs temps tenant compte de la carte de tempo, de l’origine de grille et de l’offset. L’état à l’audio zéro est émis à zéro ; les changements antérieurs ne créent pas de temps MIDI négatif.

La métadonnée texte `DIVA-PULSE-CHART:` contient le JSON natif exact, dont la carte métrique, les groupes personnalisés, les notes et leurs positions. Le MIDI standard seul ne code pas ces placements, ni les groupes tels que 2+2+3. Ses temps sont arrondis aux ticks.

À l’import natif, les données natives validées sont prioritaires. Dans un MIDI musical ordinaire, les signatures standard sont converties vers la carte métrique. Les doublons au même instant utilisent le dernier état lu. Si la carte impose un changement au milieu de mesure ou une valeur non admise, la conversion conserve les notes et les métadonnées `timeSignatures`, affiche un avertissement, mais laisse la grille en 4/4. Elle ne déplace pas les notes pour satisfaire artificiellement la validation.

## Entrées matérielles : distinctes du fichier MIDI

L’import MIDI est un lecteur de fichier ; l’entrée Web MIDI est une autre fonction. La connexion n’est demandée que depuis le bouton de réglages, avec `{sysex:false}`. Aucun port de sortie n’est utilisé. Le navigateur doit rendre cette API disponible et autoriser l’accès.

Six notes distinctes de 0 à 127 correspondent aux six lignes de jeu. Le mapping initial est 60, 62, 64, 65, 67, 69 ; le canal 0 du réglage signifie tous les canaux, 1–16 désigne un canal précis. Le sélecteur d’entrée filtre un port ou tous les ports.

Chaque source de maintien est identifiée par port, canal et note. Une touche tenue sur deux appareils reste maintenue tant que les deux sources ne sont pas relâchées. Note-off, note-on de vélocité zéro et contrôleurs 120/123 sont reconnus. Les états système ou messages malformés sont ignorés. Le canal et le port de la remise à zéro sont respectés.

L’apprentissage de mapping ne frappe pas une note de jeu. Une note déjà affectée échange les deux attributions ; elle ne crée pas une touche ambiguë. Le mapping ne synthétise aucun instrument et ne modifie aucune partition avant un enregistrement volontaire dans le studio.
