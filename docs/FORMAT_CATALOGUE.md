# Catalogue de partitions `.pulsecharts` — V4

## But et frontière

Partager les partitions sans copier les fichiers audio. Le catalogue est local et ne recherche aucune donnée sur Internet. Une association d’empreinte ne prouve ni l’origine officielle d’une partition, ni la permission d’utiliser l’œuvre ; elle indique seulement que l’audio référencé possède la même empreinte d’octets.

```json
{
  "format": "DIVA-PULSE-CHART-CATALOG",
  "version": 1,
  "title": "Mon catalogue",
  "entries": [
    {
      "id": "exemple",
      "title": "Mon morceau",
      "artist": "Artiste",
      "author": "Auteur du niveau",
      "edition": "Version longue — niveau personnel",
      "duration": 120,
      "audioHash": null,
      "demoId": null,
      "sourceUrl": "",
      "charts": [
        {
          "id": "chart-example",
          "title": "Mon morceau",
          "difficulty": "NORMAL",
          "bpm": 120,
          "offset": 0,
          "notes": [
            {"id":"note-1","time":2,"lane":0,"type":"tap","x":0.4,"y":0.4}
          ]
        }
      ]
    }
  ]
}
```

Les fichiers générés par le jeu incluent aussi les valeurs par défaut normalisées et les métadonnées du format natif. `version:1` est la version du **format catalogue**, indépendante de la version du moteur 4.0.0.

## Identité audio

`audioHash` est nul, ou `sha256:` suivi de 64 caractères hexadécimaux minuscules calculés sur le fichier audio complet. Un SHA tronqué, une URL placée dans ce champ ou une empreinte faible sont refusés. Un fichier réencodé, même musicalement identique, change généralement d’octets : l’empreinte n’est pas une reconnaissance acoustique.

`demoId` ne peut référencer qu’une des trois démos embarquées. Il ne rend l’association vérifiée que pour un morceau marqué comme démo intégrée par le jeu. Changer le titre d’un morceau personnel ne le transforme pas en démo vérifiée.

Si aucune identité vérifiable ne correspond, la case de confirmation de version audio est obligatoire. Même après cette confirmation, la provenance ne devient pas « SHA-256 identique ». Aucun offset n’est calculé automatiquement.

## Import et association

L’import du catalogue commence par validation puis confirmation ; aucun morceau existant n’est remplacé. L’association se fait ensuite à un morceau précis, avec sélection des partitions. Les timings et positions des notes, offsets, tempos et sections sont conservés. Les identifiants de partition sont renouvelés pour éviter les collisions, et la source devient `catalogue`. `parent` et `provenance` conservent l’identifiant/source d’origine, le catalogue, son édition, l’auteur renseigné et le degré d’identification audio.

Le studio traite `catalogue` comme une source : une modification enregistrée produit `manual-derived`. Il ne remplace pas la partition importée. Les opérations de catalogue et génération sauvegardent les nouvelles données avant de remplacer les objets en mémoire.

## Limites

Fichier de 24 Mo maximum ; 250 entrées ; 50 partitions par entrée ; 250 000 notes au total dans le catalogue ; limite de 50 partitions par morceau lors de l’association. Les valeurs de chaque note doivent aussi satisfaire le validateur natif. Les champs inconnus de partition peuvent rester comme métadonnées, mais ne donnent pas de nouvelles capacités au moteur.

La déduplication utilise le contenu sérialisé normalisé, pas un simple titre ni une empreinte courte. Une partition comportant un autre tempo ou d’autres sections est conservée comme variante. La déduplication n’est pas un algorithme général d’équivalence sémantique : des identifiants de notes différents peuvent conserver deux variantes pourtant visuellement identiques.

`sourceUrl`, lorsqu’il est présent, doit commencer par HTTP(S). Il est conservé pour attribution et n’est pas téléchargé ou exécuté par le jeu. Il ne s’agit pas d’un connecteur de téléchargement.

## Exemples inclus

`CATALOGUE_ORIGINAL_V4.pulsecharts` référence le WAV de contrôle fourni et la démo Neon Promise. Le SHA-256 du WAV est calculé par `tests/make_v4_fixtures.cjs` à partir des octets présents dans l’archive. Ces niveaux sont des créations d’exercice DIVA PULSE, pas des niveaux SEGA.
