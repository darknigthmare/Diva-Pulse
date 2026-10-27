# Format binaire DIVA PULSE — PULSEB25, version 1

Ce format local original stocke une bibliothèque sans transformer tous les médias en base64. Il ne compresse pas, ne chiffre pas et ne signe pas son contenu.

## En-tête de 44 octets

- Octets 0 à 7 : ASCII `PULSEB25`.
- Octets 8 à 11 : taille du manifeste JSON UTF-8, entier non signé little-endian.
- Octets 12 à 43 : SHA-256 binaire des octets exacts du manifeste.

## Manifeste et médias

Le manifeste a les propriétés `format: "DIVA-PULSE-BUNDLE"`, `version: 1`, `chunkSize: 1048576` et `library`. Cette dernière conserve la structure `DIVA-PULSE-LIBRARY`; son tableau `assets` décrit `id`, `name`, `kind`, `type`, `size` et `hashes`.

Les corps de médias sont concaténés après le manifeste dans l’ordre des descripteurs, sans remplissage. `hashes` possède une empreinte SHA-256 hexadécimale de 64 caractères par bloc de 1 048 576 octets ; le dernier bloc peut être plus petit. Un fichier vide possède zéro bloc. L’empreinte du manifeste lie les descripteurs à leurs tailles/empreintes ; un attaquant capable de réécrire le fichier entier peut recalculer toutes les empreintes. L’intégrité n’établit donc pas une origine de confiance.

## Contrôles avant restauration

Le lecteur refuse signature/version/taille incohérentes, UTF-8/JSON invalides, média nul ou dupliqué, somme de tailles dépassant le plafond, nombre incorrect de hashes, hash altéré, fin prématurée et données supplémentaires. Il vérifie tous les octets avant de proposer la transaction d’import, puis la couche applicative valide les références entre morceaux, scènes et ressources. Annuler avant validation ne modifie pas la bibliothèque.

Plafonds : 1 Gio de corps, 16 Mio de manifeste, 1 000 médias. La couche applicative ajoute ses plafonds (250 morceaux, 50 charts par morceau...). Ils sont indépendants du quota et de la mémoire disponibles.

Le lecteur actuel travaille avec `Blob.slice()` par blocs et SHA-256, natif lorsque disponible, sinon via le calcul local existant. Il n’affirme pas que le navigateur ne conserve jamais un média en mémoire ; il évite l’encodage/décodage base64 global du format précédent.

Implémentation : `src/bundle-core.js`. Validation : `tests/v25.test.cjs`, `tests/v25_browser_test.py`, `tests/v25_bundle_benchmark.cjs`.
