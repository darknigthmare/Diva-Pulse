# QA-07 — Protocole de session humaine V39

Document de préparation. Aucune session n'est tenue : tant que les cinq grilles ne sont pas remplies, `QA-07`, `GAME-12` et `GAME-08` restent ouverts.

## 1. Objectif et seuils fixés avant la première session

Mesurer si une personne qui n'a jamais vu DIVA PULSE atteint sa première note, comprend les glyphes et retrouve ses données sans aide.

| Résultat | Décision |
| --- | --- |
| 4 ou 5 participants sur 5 réussissent la tâche A sans aide **et** médiane `ready` → première note ≤ 90 s | `GAME-12` peut passer à **Fait** |
| 3 participants sur 5 autonomes | `GAME-12` reste **Partiel** |
| 2 participants ou moins | Retour en conception de l'entrée de première visite |

Règles complémentaires :

- Toute aide de niveau L1, L2 ou L3 retire l'autonomie de la tâche concernée.
- Règle des 30 s : après 30 s sans action, l'animateur propose « Tu veux un indice ? » sans donner la solution.
- Une hésitation de plus de 5 s est notée, même si la tâche aboutit.
- Les seuils ci-dessus sont figés avant la première session et ne sont pas ajustés après lecture des résultats.

## 2. Participants

- Cinq adultes n'ayant jamais vu DIVA PULSE, hors équipe : deux novices du jeu de rythme, deux occasionnels, un expérimenté.
- Un participant en situation de handicap ne transforme pas la session en audit d'accessibilité : aucune conformité WCAG n'en sera déduite.
- Données brutes conservées hors dépôt ; seuls des codes anonymes (`P1`…`P5`) apparaissent dans `qa/v39/qa07/`.

## 3. Rôles et durée

| Rôle | Mission |
| --- | --- |
| Animateur | Accueille, lit le consentement, lance le chrono, applique l'aide graduée |
| Observateur | Remplit la grille, note les hésitations, ne parle pas |
| Participant | Exécute les tâches avec son propre casque filaire |

Durée : 60 minutes maximum, entrecoupées d'une pause. Build exact, `buildSha256`, navigateur et version du système sont consignés avant le début.

## 4. Tâches

| ID | Tâche | Mesures |
| --- | --- | --- |
| A | Ouvrir le jeu et atteindre la première note | clics, temps `ready` → première note, aide L0–L3 |
| B | Nommer les quatre glyphes et expliquer HOLD et CHAIN | réponses exactes / approximatives / fausses |
| C | Changer de difficulté, puis régler la compensation de saisie | réussite autonome, hésitations |
| D | Exporter la bibliothèque et retrouver le fichier | réussite autonome, erreur de manipulation |
| E | Quitter une partie, revenir à la bibliothèque et relancer | réussite autonome, compréhension de la pause |

## 5. Aide graduée

| Niveau | Comportement de l'animateur |
| --- | --- |
| L0 | Silence, observation seule |
| L1 | Nomme l'élément visible (« le bouton en bas à droite ») |
| L2 | Explique l'action attendue sans la faire |
| L3 | Fait l'action à la place du participant |

Chaque passage à un niveau supérieur est horodaté. Une tâche terminée après L1 ou plus est notée **non autonome**.

## 6. Grille d'observation (une par participant)

```
Participant : P_     Profil : novice / occasionnel / expérimenté
Build : 39.0.0   buildSha256 : __________   Commit : __________
Navigateur : __________   Système : __________   Casque : filaire / intégré
Consentement signé : oui / non      Enregistrement audio : oui / non

Tâche | Autonome (o/n) | Aide max (L0-L3) | Durée (s) | Hésitations >5 s | Notes
A     |               |                  |           |                   |
B     |               |                  |           |                   |
C     |               |                  |           |                   |
D     |               |                  |           |                   |
E     |               |                  |           |                   |

Temps ready → première note : ____ s
Frictions bloquantes : ______________________________________
Frictions gênantes : ________________________________________
Frictions cosmétiques : _____________________________________
Incident technique : ________________________________________
```

## 7. Synthèse et décisions

1. Consolider les cinq grilles dans `qa/v39/qa07/` (agrégat anonymisé).
2. Calculer le succès autonome par tâche et la médiane du temps `ready` → première note.
3. Classer les frictions en bloquantes, gênantes et cosmétiques, avec un identifiant de backlog pour chacune.
4. Écrire une décision explicite pour `QA-07`, `GAME-12` et `GAME-08`.
5. Publier une synthèse d'une page. Cinq participants n'autorisent aucune généralisation statistique.

## 8. Formulaire de consentement (à signer hors dépôt)

> **Étude d'utilisabilité — DIVA PULSE**
>
> But : observer la première utilisation d'un jeu de rythme local. Aucune évaluation de la personne n'est réalisée.
>
> Participation volontaire, sans rémunération, arrêtable à tout moment sans justification. Les données recueillies sont un code participant, un profil général, des durées, des niveaux d'aide et des notes d'observation.
>
> Enregistrement audio : **oui / non** (case séparée). Citation anonyme dans un rapport : **oui / non** (case séparée).
>
> Les données brutes sont conservées hors dépôt pendant 90 jours après la synthèse, puis supprimées. Le retrait est possible jusqu'à la publication de la synthèse, sur simple demande à l'animateur.
>
> Aucune donnée n'est envoyée à un service tiers ; le jeu reste local.
>
> Participant : ______________________  Date : __________
> Animateur : _______________________  Date : __________

## 9. Ce que ce protocole ne prouve pas

- Aucun appareil physique, aucune latence acoustique mesurée, aucun lecteur d'écran.
- Aucune conformité WCAG, aucune certification de qualité commerciale.
- Un test navigateur ne remplace pas une session humaine : il ne mesure pas la compréhension.
