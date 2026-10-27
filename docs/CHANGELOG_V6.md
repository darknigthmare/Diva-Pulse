# V6.0 — AutoMap & Coherent Difficulties

Base : V5 Precision Edition fournie. Livraison autonome du 6 octobre 2026. Runtime 6.0.0 ; format de sauvegarde natif 5 conservé pour compatibilité additive ; scoring normal rules4 inchangé.

## Ajouts exécutables

- Import audio générant automatiquement les cinq difficultés absentes, activé par défaut, sélection multiple et dépôt sur la bibliothèque.
- Traitement séquentiel de douze fichiers maximum, limites de volume, annulation et bilan détaillé par fichier.
- Priorité aux charts du catalogue correspondant à la même empreinte SHA-256, sans réécriture de timing/placement ni remplacement des sources.
- SHA-256 de repli dans un Worker lorsque SubtleCrypto n’est pas disponible ; migration des anciens fichiers à empreinte courte seulement après vérification des octets stockés.
- Analyse V6 : rééchantillonnage par canal, FFT et nouveauté sur trois bandes, localisation fine des attaques, énergie/silences, tempo global et alternatives, fenêtres locales pour avertir des changements de pulsation.
- Famille de cinq difficultés imbriquées : mêmes repères, touches, types et cibles partagés, budgets distincts, figures récurrentes, maintiens dans les espaces audibles, accords et slides bornés.
- Contrôle indépendant des niveaux avant sauvegarde : limites temporelles, cibles, cadence, densités, accords, maintiens et inclusion des repères des niveaux inférieurs.
- Rapport avec densités, étoiles internes, avertissements de pulsation, diagnostic JSON et écoute des frappes sur l’audio original.
- Paramètres d’import mémorisés ; complétion volontaire de la bibliothèque existante ; aperçu avant ajout de variantes manuelles de génération.
- Original de démonstration Neon Steps, cinq partitions d’exemple, catalogue vérifié par SHA-256 et cas de contrôle.

## Correctifs

La V5 n’ajoutait aucun chart à l’import audio simple : ce parcours est désormais pris en charge. Les différents niveaux ne sont plus générés par cinq tirages indépendants. L’analyse n’additionne pas les PCM gauche/droite, ce qui évite l’annulation des canaux en opposition de phase et conserve leurs attaques alternées.

Une défaillance de sauvegarde ne publie pas de nouvelles partitions en mémoire ; le refus d’un réglage rétablit la case précédente. L’écoute de mapping est arrêtée en fermant le panneau ou en changeant de vue. Le diagnostic d’un chart généré ne valide pas silencieusement sa variante manuelle. La complétion cible la bonne copie restaurée lorsqu’un même fichier audio existe dans plusieurs entrées. Les niveaux générés corrigés dans le studio deviennent des variantes, sans perte de l’original. Le panneau musical reste dans le flux de la page : le pied fixe ne masque plus ses boutons. Les noms de fichiers longs ne provoquent plus de débordement horizontal de la sélection musicale. Le rapport occupe une largeur adaptée sur ordinateur, avec une disposition compacte sur téléphone.

Le cache de shell et l’identification du lanceur sont versionnés 6.0.0. Les médias sources ne sont ni normalisés ni réencodés à l’import ; l’analyse et le ralenti travaillent sur des données temporaires.

## Limites maintenues

Pas de catalogue Internet officiel automatique, de transcription exacte du chant, de source separation, de carte de tempo/signature entièrement déduite ou de garantie perceptuelle sur toute musique. Pas de nouveaux modèles 1:1, PMX/VMD, scénario de PV officiel ou scoring SEGA exhaustif. Pas de publication web ni de test physique de manette/MIDI/iPhone. Le statut détaillé et les validations réelles figurent dans les autres documents V6.
