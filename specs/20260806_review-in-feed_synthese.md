## Me
Pour un refactoring que nous devons entreprendre, j'ai réalisé deux feuilles de route en m'aidant de deux agents/models IA différents.
- Analyse les deux discutions et les deux feuilles de route
- Choisi celle qui te semble la plus claire et exhaustive afin d'éviter au maximum les surprises durant la mise en oeuvre.
- Une fois ce choix fait, si tu trouves des détails ou des choix dans la feuille de route non sélectionnée qui pourraient enrichir la feuille de route sélectionnée, liste-les moi et nous déciderons ensemble de les y inclure ou pas.

Voici les fichiers:
- Codex - GPT-5.6 Terra - High: @file:20260804_review-in-feed-form_GPT-5.6.md @file:20260805_cadrage-review-dans-feed-form_GPT-5.6.md
- Claude - Sonnet 5 - High: @file:20260804_review-in-feed-form_Claude-Sonnet-5.md @file:20260805_review-in-feed-form_decisions_Claude-Sonnet-5.md

## AI Assistant
# Conclusion

Je choisirais **la feuille de cadrage Claude Sonnet 5** (`20260805_review-in-feed-form_decisions_Claude-Sonnet-5.md`) comme base de la future feuille de route.

C’est la plus **opérationnelle, détaillée et proche du code actuel**. Elle identifie plusieurs difficultés techniques concrètes que le document GPT laisse à un niveau plus architectural :

- paramétrage des reducers et providers pour isoler les brouillons ;
- comportement des sous-formulaires ;
- polymorphisme de `FeedSummary` ;
- initialisation des flags de complétude ;
- adaptation du diff et de l’audit à `FeedFormState` ;
- sémantique de `isNew` ;
- gestion particulière d’une `PieceVersion` partagée ;
- garde garantissant une seule revue active par reviewer ;
- inventaire assez précis des fichiers supprimés ou adaptés.

Elle devrait donc limiter davantage les découvertes tardives pendant l’implémentation.

Cela dit, **ce choix est assorti de réserves importantes** : le document Claude contient quelques ambiguïtés ou décisions fragiles qu’il faudrait corriger avant d’en faire une véritable feuille de route.

---

# Analyse comparative

## 1. Qualité des discussions de cadrage

### Discussion GPT-5.6

Ses points forts sont :

- une démarche claire, centrée sur les décisions fonctionnelles ;
- un bon cadrage des autorisations ;
- une distinction nette entre :
    - persistance locale ;
    - données métier ;
    - approbation finale ;
- une bonne anticipation du futur mode `self-source-edit` ;
- une conception prudente de la soumission serveur et de la transaction.

La discussion GPT a toutefois moins inspecté les obstacles concrets du formulaire existant. Elle ne met notamment pas en évidence :

- les clés `localStorage` figées dans les reducers ;
- le flag manuel `allSourceOnPieceVersionsDone` ;
- la sémantique particulière de `isNew` ;
- le branchement codé en dur de la soumission finale ;
- le problème spécifique des `PieceVersion` partagées.

Elle produit donc un **meilleur cadrage architectural général**, mais une base moins directement exploitable pour découper les travaux.

### Discussion Claude Sonnet 5

La discussion Claude est plus incisive techniquement. Ses questions A à I ciblent de vrais points susceptibles de provoquer des surprises :

- incompatibilité entre `ChecklistGraph` et le futur contrat `FeedFormState` ;
- complétude des étapes préremplies ;
- collision potentielle de sens de `isNew` ;
- architecture actuelle de la persistance locale ;
- absence d’un véritable mode générique ;
- soumission de création actuellement codée en dur ;
- reprise d’un brouillon ;
- redirection vers une revue active ;
- cycle de vie du commentaire général.

C’est précisément le genre d’analyse préalable qui sécurise une mise en œuvre confiée à plusieurs agents.

Sa faiblesse est d’avoir parfois transformé certaines réponses en décisions techniques très affirmatives, alors qu’elles mériteraient encore une validation ou un approfondissement — principalement autour de `isNew`, du fork de `PieceVersion` et du chargement de la baseline d’audit.

---

## 2. Qualité des deux documents finaux

## Document GPT-5.6

Le document GPT est :

- mieux structuré comme **contrat architectural** ;
- plus concis ;
- très clair sur les invariants ;
- particulièrement solide concernant :
    - l’absence de persistance métier intermédiaire ;
    - l’autorisation serveur ;
    - la transaction finale ;
    - la baseline relue depuis la base ;
    - le recalcul des données dérivées ;
    - l’isolation du formulaire de saisie initiale.

Son principal défaut est qu’il reste volontairement un document de cadrage. Il explique bien **ce qui doit être vrai**, mais moins précisément **quels mécanismes existants doivent être transformés**.

## Document Claude Sonnet 5

Le document Claude est plus exhaustif sur :

- les composants et modules concernés ;
- les types à faire évoluer ;
- la stratégie d’hydratation ;
- le stockage des sous-formulaires ;
- le comportement des étapes ;
- le payload de soumission ;
- les éléments à supprimer ;
- les tests et zones techniques implicitement touchés.

Il se rapproche déjà d’une pré-feuille de route technique. Pour une implémentation par agents IA, cet aspect est précieux : les agents disposeront de davantage de points de repère et risqueront moins d’oublier un reducer, un provider ou une ancienne dépendance à la checklist.

---

# Réserves à corriger dans le document Claude

Ces points ne proviennent pas du document GPT à ajouter : ce sont des problèmes internes à clarifier avant de convertir le document Claude en feuille de route.

## 1. Contradiction sur les entités déjà globalement revues

La discussion GPT et son document concluent :

> les entités déjà globalement revues restent modifiables, avec indication visuelle et audit des modifications.

Le document Claude conclut au contraire :

> `isNew: false` les rend sélectionnables mais non éditables en place.

Ce n’est pas seulement un détail d’implémentation : c’est une **différence fonctionnelle majeure**.

La réponse donnée pendant la discussion Claude semble avoir fait évoluer la décision initiale, mais elle n’est pas totalement explicite. Elle dit en substance que le comportement existant de `isNew` paraît approprié, puis demande à l’agent de signaler si cette compréhension est erronée. Or la discussion s’arrête sans réponse argumentée de Claude avant la synthèse.

Il faut donc confirmer explicitement l’une de ces règles :

1. **Entité déjà revue modifiable en place**, avec badge informatif et audit ;
2. **Entité déjà revue non modifiable**, avec création d’une copie lorsqu’un mécanisme de copie existe ;
3. comportement différencié selon le type d’entité.

À ce stade, la feuille Claude retient implicitement les options 2 et 3, mais cela mérite une décision formelle.

---

## 2. Le fork de `PieceVersion` est encore insuffisamment spécifié

L’identification du problème est excellente, mais la solution proposée ouvre plusieurs questions :

- Comment déterminer précisément qu’une `PieceVersion` a été modifiée ?
- Le test d’utilisation par une autre source doit-il exclure la source actuellement revue ?
- Faut-il cloner également :
    - les indications de tempo ;
    - les contributions associées ;
    - les autres dépendances ou relations de la version ?
- Que deviennent les identifiants utilisés dans les entrées d’audit ?
- L’audit doit-il représenter :
    - la création d’une nouvelle version et de ses enfants ;
    - la mise à jour de la relation source/version ;
    - ou aussi la divergence par rapport à la version d’origine ?
- Le nouveau `ReviewedEntity` doit-il viser l’ancienne version, la copie, ou seulement la copie ?
- Que se passe-t-il si deux relations de la source courante pointent vers la même version ?
- Le fork doit-il s’appliquer dès qu’un enfant `Movement` ou `Section` change, même si la ligne `PieceVersion` elle-même est identique ?

Ce mécanisme devrait faire l’objet d’un sous-chantier autonome, avec contrat de remapping et tests transactionnels.

---

## 3. Baseline « au moment du start » ou relue au submit

Le document Claude indique :

> baseline issue de la DB au moment du `start`.

Cette formulation est dangereuse ou au minimum ambiguë. Si la baseline est une copie conservée côté client depuis le démarrage, elle ne doit pas être utilisée comme autorité au moment de la soumission.

Même avec un verrou sur la MM Source, certaines entités liées peuvent être partagées et modifiées par d’autres flux. La baseline fiable pour le diff et la persistance doit être **relue côté serveur au moment de la soumission, dans le cadre de la transaction ou avec les garanties de cohérence appropriées**.

Il faut également décider si le diff compare :

- l’état final à l’état réellement présent en base au moment du submit ;
- ou l’état final à un snapshot historique figé au démarrage.

Le document GPT retient clairement la première stratégie.

---

## 4. Validation serveur des étapes

Claude propose de « rejouer les mêmes prédicats `isComplete` » côté serveur. L’intention est correcte, mais il vaut mieux éviter de promettre la réutilisation directe des prédicats UI sans vérifier :

- leurs imports de composants React ;
- leurs dépendances client ;
- leur caractère réellement déterministe ;
- les flags UI tels que `introDone` et `allSourceOnPieceVersionsDone`.

La feuille de route devrait plutôt exiger un **validateur métier partagé et compatible serveur**, utilisé par les prédicats UI et par la route de soumission lorsque cela est possible.

Autrement, un payload pourrait être considéré complet uniquement parce qu’un flag client vaut `true`, alors que les données sous-jacentes ne sont pas cohérentes.

---

## 5. Clé fixe du brouillon et identité de la revue

Une clé fixe respecte la règle actuelle « une seule revue active par reviewer », mais elle présente un risque :

- un ancien brouillon local peut appartenir à une autre revue ;
- une revue peut être abandonnée ou réattribuée depuis un autre navigateur ;
- une requête de démarrage ou un état incohérent peut laisser un brouillon résiduel ;
- plusieurs comptes peuvent utiliser le même navigateur.

Même avec une clé fixe, l’enveloppe stockée devrait impérativement contenir au minimum :

- le `reviewId` ;
- idéalement l’identifiant du reviewer ;
- la version du schéma ;
- éventuellement l’identifiant de la MM Source.

À l’hydratation, ces valeurs doivent correspondre à la revue chargée. Sinon, le brouillon doit être ignoré ou supprimé.

---

## 6. Emplacement du commentaire général

Le document dit alternativement qu’il vit dans :

- `FeedFormState` ;
- le brouillon local ;
- les métadonnées de session.

Il faut choisir un contrat précis. Comme `overallComment` n’est pas une donnée métier du formulaire Feed, le choix architectural le plus propre semble être de le conserver dans les **métadonnées de session**, persistées dans la même enveloppe locale, mais pas nécessairement dans le cœur de `FeedFormState`.

---

## 7. Comptage des étapes

L’exemple « 3 / 5 étapes » doit être formalisé :

- l’introduction prévalidée compte-t-elle ?
- le résumé compte-t-il, alors que son `isComplete` retourne toujours `false` ?
- seules les quatre étapes de saisie doivent-elles être comptées ?

Le document GPT est plus précis : le récapitulatif ne constitue pas une unité de vérification métier. Je recommande donc un décompte des **étapes de données applicables au mode**, sans l’introduction sautée ni le résumé final.

---

# Éléments du document GPT susceptibles d’enrichir la feuille Claude

Voici les ajouts que je vous propose de discuter.

## Proposition 1 — Recharger la baseline côté serveur au submit

**Importance : critique.**

Le document GPT exige explicitement que la soumission :

- recharge la baseline depuis la base ;
- normalise l’état reçu ;
- calcule le diff côté serveur.

Cela corrigerait l’ambiguïté « baseline au moment du start » du document Claude.

**Recommandation : à inclure impérativement.**

---

## Proposition 2 — Décrire explicitement la transaction et l’ordre des mutations

GPT précise que la route doit :

- appliquer toutes les mutations dans une transaction unique ;
- respecter l’ordre des dépendances ;
- enregistrer audit, données métier, `ReviewedEntity`, commentaire et transitions d’état ensemble.

Claude parle bien du traitement final, mais décrit moins explicitement l’atomicité et l’ordre de persistance, notamment avec le fork de `PieceVersion`.

**Recommandation : à inclure impérativement.**

---

## Proposition 3 — Recalculer les données dérivées

GPT cite notamment le recalcul de `sectionCount` lorsque la structure change.

Claude ne l’intègre pas explicitement, alors que le clonage ou la modification de mouvements et sections peut rendre certaines valeurs dérivées obsolètes.

**Recommandation : à inclure.**

---

## Proposition 4 — Formaliser l’interdiction des écritures métier intermédiaires

GPT pose cet invariant clairement :

> les modifications restent locales jusqu’à l’approbation finale.

Claude le laisse comprendre via le brouillon, mais il serait utile de le transformer en exigence explicite pour tous les sous-formulaires et toutes les sélections/créations effectuées pendant la revue.

Il faut notamment vérifier qu’aucun sous-formulaire réutilisé ne persiste immédiatement une nouvelle entité.

**Recommandation : à inclure impérativement.**

---

## Proposition 5 — Utiliser une clé de brouillon dérivée du `reviewId`

GPT préfère un espace local dédié à chaque `reviewId`, tandis que Claude choisit une clé fixe en raison de la règle d’unicité.

La clé fixe est plus simple, mais une clé dérivée du `reviewId` :

- empêche le chargement accidentel d’un brouillon d’une autre revue ;
- facilite un nettoyage ciblé ;
- résiste mieux aux incohérences serveur ou multi-comptes ;
- rend l’identité du brouillon explicite.

Le coût technique supplémentaire est faible dès lors que les providers doivent de toute façon devenir paramétrables.

**Recommandation : je préfère la stratégie GPT**, ou au minimum une clé fixe contenant une enveloppe strictement validée par `reviewId`.

---

## Proposition 6 — Séparer clairement état du formulaire et métadonnées de session

GPT définit le contexte de session comme porteur des données qui ne sont pas des données de formulaire :

- mode ;
- `reviewId` ;
- identifiants globalement revus ;
- commentaire général ;
- progression dérivable.

Claude place davantage de ces éléments dans `formInfo`.

La séparation proposée par GPT offre un contrat plus propre pour le futur mode `self-source-edit` et évite de faire circuler des métadonnées de revue dans le payload métier de `FeedFormState`.

**Recommandation : à inclure, au moins comme principe à évaluer.**

---

## Proposition 7 — Normalisation serveur avant diff et persistance

GPT introduit explicitement une étape de normalisation de `FeedFormState` vers une représentation persistable avant :

- comparaison ;
- audit ;
- mutations.

Même si Claude veut supprimer `ChecklistGraph`, une représentation normalisée temporaire peut rester utile sans devenir un second modèle métier permanent. Elle permet notamment de gérer :

- les valeurs UI ;
- les rangs ;
- les références ;
- les créations et suppressions ;
- les remappings d’identifiants ;
- le fork de `PieceVersion`.

**Recommandation : à inclure.**  
Cela ne remet pas nécessairement en cause la décision de faire de `FeedFormState` le contrat d’entrée principal.

---

## Proposition 8 — Refactorer le vocabulaire de checklist jusque dans les tests et types

GPT précise que les helpers, types et tests doivent être renommés autour des notions de :

- snapshot de revue ;
- diff d’audit.

Claude prévoit le renommage du schéma et de plusieurs fonctions, mais cet objectif global pourrait être affirmé davantage afin d’éviter de conserver des concepts morts dans les noms.

**Recommandation : à inclure.**

---

## Proposition 9 — Définir explicitement la fin de session locale

GPT précise que le brouillon ne doit être supprimé **qu’après le succès de la transaction**.

Cela mérite une exigence et des tests spécifiques :

- aucune suppression au clic ;
- aucune suppression après une erreur réseau ;
- aucune suppression après une validation serveur refusée ;
- suppression après confirmation du succès seulement.

**Recommandation : à inclure.**

---

## Proposition 10 — Conserver les invariants comme critères d’acceptation transverses

La section « Invariants à préserver » du document GPT est excellente et gagnerait à être reprise presque intégralement dans la base Claude :

- une seule revue active par source ;
- pas de revue par son propre auteur ;
- une seule session active par reviewer ;
- aucune mutation métier avant approbation ;
- audit atomique ;
- isolation stricte des brouillons ;
- autorisation et validation exclusivement garanties côté serveur.

**Recommandation : à inclure impérativement.**

---

# Synthèse de ma recommandation

Je propose donc :

1. **Prendre le document Claude comme document principal**.
2. Avant d’en dériver la feuille de route, trancher :
    - la modification ou non des entités déjà revues ;
    - le contrat exact du fork de `PieceVersion` ;
    - l’identité et la validation du brouillon local ;
    - l’emplacement du commentaire général ;
    - la validation métier serveur des étapes.
3. Enrichir ce document avec, au minimum, les propositions GPT suivantes :
    - **1 — baseline relue au submit** ;
    - **2 — transaction et ordre des mutations** ;
    - **3 — données dérivées** ;
    - **4 — aucune écriture intermédiaire** ;
    - **7 — normalisation serveur** ;
    - **9 — nettoyage local après succès uniquement** ;
    - **10 — invariants transverses**.
4. Décider ensemble entre :
    - la **clé fixe Claude** ;
    - la **clé par `reviewId` GPT**, que je considère plus robuste.
5. Évaluer la séparation GPT entre :
    - `FeedFormState` métier ;
    - métadonnées génériques de session.

En bref : **Claude fournit le meilleur squelette d’implémentation ; GPT fournit plusieurs garde-fous architecturaux et transactionnels indispensables pour le fiabiliser.**
