Nous allons changer complètement l'interface de review de Source musicale (MMSource) : La première page de liste des MMSource à revoir va rester, mais au lieu que le process de review se passe dans l'interface dédiée actuelle (@app/(signedIn)/review/[reviewId]/checklist ), nous allons reprendre intégralement l'interface d'entrée de données initiales (@app/(signedIn)/feed ), la préremplir avec les données de la MMSource à revoir, et la sauvegarde de fin vaudra enregistrement de la review.

Les principes sont clairs :
- On garde la liste des MMSource qui attendent une review
- Lorsque le reviewer sélectionne une MMSource et confirme, nous gardons tout le mécanisme de lock sur la MMSource en revue. Le traitement en back reste le même.
- Il faut, je pense concevoir une nouvelle page app/(signedIn)/review/[reviewId]/page.tsx avec son layout, qui va récupérer les données de la MMSource à revoir pour les injecter dans l'interface du formulaire de feed.
- Tout ce qui constitue aujourd'hui le bridge entre l'interface checklist et l'interface de feed utilisée pour les éditions de donnée durant la revue va disparaître.
- Le mécanisme de bootState pur initialiser le formulaire de feed me semble bon à reprendre (state avec la clé de localStorage FEED_FORM_BOOT_KEY), mais il peut aussi être jugé superflu à présent qu'il n'y aura plus d'aller et retour entre deux interfaces comme actuellement.                                       
- Il faut un contexte ou un simple wrapper qui permette de savoir visuellement que nous sommes dans une revue en cours, pour en indiquer la progression par rapport à tout ce qu'il y a à revoir (quelque chose de simple, pas dans le détail comme aujourd'hui avec la checklist), et pour donner la possibilité d'abandonner la revue en cours.
- La fin du formulaire doit donner lieu aux traitements spécifiques à une revue, pas au feedForm.
- Il faut garder la logique d'un auditLog que l'on sauvegarde à côté des entités qui sont modifiées durant la review, comme c'est le cas aujourd'hui.         
- À garder en tête : nous implémenterons dans une prochaine étape une fonctionnalité qui permettra à un éditeur de modifier une MMSource qu'il a enregistré avant que celle-ci ait commencé à être reviewée, ceci avec la même approche, en réutilisant le formulaire de feed pré-rempli et en sauvegardant les modifications en fin de formulaire.

Ta tâche ici est d'analyser le projet et ces évolutions proposées, et de me poser toutes les questions nécessaires afin de rédiger un document clair et concis rassemblant toutes les modifications clés à mener. Pas encore une feuille de route complète, mais s'assurer que nous avons pris toutes les décisions qui permettent d'avoir un plan sans zone d'ombre. À toi donc de me questionner si tu trouves des zones d'ombre, et quand tu n'en auras plus, indique-le-moi afin que je te donne le GO pour rédiger le document récapitulant tout ce que ce projet implique. Je compte ensuite utiliser ce document pour en faire une véritable feuille de route et faire travailler mes agents IA pour l'implémentation.

## Claude - Sonnet 5 (1M) - High

Bien confirmé, `/review/:path*` couvre déjà `/review/[reviewId]` sans changement à faire. J'ai maintenant exploré en profondeur le mécanisme actuel. J'ai des questions concrètes, ancrées dans le code, qui n'ont pas forcément été soulevées ailleurs.

Voici mon analyse indépendante. J'ai lu en détail : `reviewEditBridge.ts`, `feedFormContext.tsx`, `feedFormReducer.ts` + `localStorageReducerWrapper.ts`, `reviewChecklistSchema.ts`, `reviewDiff.ts`/`auditCompose.ts`, `getReviewOverview.ts`, les routes API review (`start`/`submit`/`abort`/`overview`) et `feedForm`, le schema Prisma (`Review`/`ReviewedEntity`/`AuditLog`), `stepsUtils.ts`, `FeedSummary.tsx`, `ReviewEditBanner.tsx`, et `proxy.ts`.

Quelques constats de code changent la donne par rapport à une lecture superficielle du prompt. Je vous pose mes questions dans cet ordre : d'abord les contraintes techniques concrètes que j'ai trouvées et qu'il faut trancher, ensuite les décisions de produit plus ouvertes.

**A. Le moteur de diff/audit est câblé sur `ChecklistGraph`, pas sur `FeedFormState`**
`reviewDiff.ts` et `auditCompose.ts` comparent deux `ChecklistGraph` en s'appuyant sur `REVIEW_CHECKLIST_SCHEMA` (liste de champs par type d'entité) pour produire les entrées `AuditLog` (before/after par entité). Bonne nouvelle : `ChecklistGraph` a déjà été délibérément aligné sur les types `feedFormTypes`/`formTypes` (nested `pieceVersions[].movements[].sections[]`, mêmes `*State` types) — donc la conversion FeedFormState ⇄ graphe de diff est réaliste, pas un chantier énorme. Mais il faut trancher : **est-ce qu'on fait diffuser/auditer directement `FeedFormState` (en adaptant `reviewDiff`/`auditCompose` à ce type), ou est-ce qu'on garde un type `ChecklistGraph`-like en interne côté serveur, uniquement comme représentation de diff, alimenté par la baseline DB et le `FeedFormState` soumis ?** Dans les deux cas `REVIEW_CHECKLIST_SCHEMA` (la liste des champs par entité, sans les `label`s inutiles maintenant) doit rester quelque part comme "liste des champs pertinents pour le diff", non ?

**B. `allSourceOnPieceVersionsDone` est un flag manuel, pas dérivé des données**
`stepsUtils.ts` step 3 (`mMSourceOnPieceVersions`) n'est marquée complète que si `state.formInfo.allSourceOnPieceVersionsDone === true` — un flag posé uniquement quand l'utilisateur clique "Continuer" dans `MMSourceOnPieceVersions.tsx`. Le bridge actuel ne le positionne jamais au boot (`reviewEditBridge.ts:231`, commenté). Ça n'avait pas d'importance aujourd'hui car la soumission de review ne dépend pas de la validité des steps Feed. Mais dans le nouveau design, **la validité de toutes les steps Feed devient la condition d'approbation** → si on préremplit une review déjà complète sans ce flag, l'étape 3 apparaîtra "incomplète" alors que les données sont bonnes. Faut-il : (a) positionner ce flag automatiquement au boot dès que les données préremplies sont cohérentes (comportement dérivé), ou (b) accepter que le reviewer doive cliquer une fois sur "Continuer" à cette étape même sans rien changer (friction mineure mais réelle) ?

**C. Le flag `isNew` a un double sens qui va entrer en collision**
Dans le feed form normal, `isNew` sur une entité (Person/Piece/...) signifie "créée dans cette session, pas sélectionnée depuis l'existant" et pilote la logique UI de `ComposerSelectOrCreate`/`PieceSelectOrCreate`/etc. Le bridge actuel *réutilise* ce même champ pour signifier "pas encore globalement reviewée" (`isNew: !globallyReviewed.personIds.includes(...)`) — ce qui fonctionne uniquement parce que dans l'ancien flux, une entité "already reviewed" n'était de toute façon jamais présentée comme nouvellement créable. Vous avez dit vouloir un indicateur visuel "déjà reviewée" sur les entités concernées : **il faut un champ distinct** (p.ex. `alreadyReviewed?: boolean`) plutôt que de continuer à surcharger `isNew`, sans quoi on risque de casser la logique création/sélection du feed form normal. Vous confirmez qu'on introduit ce champ séparé ?

**D. Le localStorage du feed form est câblé en dur sur une seule clé, à la définition du reducer**
`feedFormReducer.ts:644` fait `withLocalStorage(reducer, FEED_FORM_LOCAL_STORAGE_KEY, initialState)` — la clé est figée **au chargement du module**, pas passée en prop du provider (`FeedFormProviderProps = { children }` uniquement, aucun paramètre). Pour isoler un brouillon par `reviewId` comme vous le souhaitez, il faut refactorer `feedFormReducer`/`FeedFormProvider` pour accepter une clé de stockage dynamique (factory ou paramètre de provider), et pareil pour les sous-wizards single-piece/collection qui ont eux aussi une clé globale unique. C'est un vrai chantier technique transverse, pas juste "changer une constante" — êtes-vous d'accord pour l'inclure explicitement dans la feuille de route (plutôt que de le découvrir en cours d'implémentation) ?

**E. Le "mode" générique n'existe pas encore du tout dans le code**
`FeedFormInfo` n'a aujourd'hui qu'un `reviewContext?` optionnel (présence = on est en review-edit). Il n'y a pas de concept de `mode` (`data-entering | self-source-edit | review`). Question concrète d'architecture : la liste `steps` dans `stepsUtils.ts` est un tableau **statique** utilisé partout (`Steps.tsx`, `MMSourceForm.tsx`, `getLastCompletedStep`...). En mode review/self-edit, on veut sauter l'étape "Intro" et remplacer l'étape finale "Summary → Save" par un traitement différent. **Doit-on (a) faire dépendre la liste des steps du mode (une fonction `getSteps(mode)` qui retire Intro et substitue le composant final), ou (b) garder un tableau statique unique où chaque composant d'étape teste `state.formInfo.mode` en interne ?** Ça a un impact direct sur `MMSourceForm.tsx`, `Steps.tsx` et `getStepByRank`/`getStepById`.

**F. `FeedSummary.tsx` appelle en dur `POST /api/feedForm` qui fait un `mMSource.create`**
Le composant final actuel ne fait qu'une seule chose : créer une nouvelle source. Il faut soit le rendre polymorphe (branchement sur le mode pour appeler `/api/review/[reviewId]/submit` à la place), soit créer un composant "Summary" distinct par mode sélectionné via le point E. Ça découle de E mais je voulais le nommer explicitem*ent car c'est le point de bascule "sauvegarde = review" que vous demandez au principe 6.

Maintenant les questions plus ouvertes :

**G.** Le brouillon local d'une review — qu'en fait-on si le reviewer abandonne volontairement vs. s'il ferme simplement l'onglet sans rien faire (le lock DB reste `IN_REVIEW` indéfiniment) ? Voulez-vous un mécanisme de reprise automatique (retour sur `/review/[reviewId]` → même brouillon restauré), et si oui, sur quelle durée de vie avant de considérer la review comme abandonnée malgré elle ?

**H.** Aujourd'hui la liste `/review` redirige automatiquement le reviewer vers sa review `IN_REVIEW` active (`app/(signedIn)/review/page.tsx:30-36`, vers l'ancienne URL checklist). Ce comportement de redirection automatique est-il conservé vers la nouvelle URL `/review/[reviewId]` ?

**I.** Le commentaire général de review (`overallComment`) éditable "n'importe quand" — doit-il être persisté en base à chaque modification (petit call API dédié), ou seulement tenu en local et envoyé avec le payload final de soumission comme aujourd'hui (`submit/route.ts:59`) ? Sachant que si le navigateur crashe avant la soumission finale, un commentaire non persisté serait perdu.

## Moi

A. Je préfère que l'on se cale sur le type `FeedFormState` puisque tout part de cette structure de donnée. Pas besoin de garder inutilement un autre type/structure en interne sans valeur ajoutée. Donc il faut adapter `reviewDiff.ts` et `auditCompose.ts` .
Un `REVIEW_CHECKLIST_SCHEMA` épuré des `label` et renommé pour ne plus mentionner 'checklist' me semble utile en effet pour lister les champs à inclure dans les diffs. L'inconvénient est qu'il faut le faire évoluer si de nouveaux champs sont introduits en base de données (`movement.isVariation` récemment ajouté dans le schema par exemple), mais je doute que l'on puisse s'en passer.

B. Solution a = pas de friction

C. Plusieurs points ici :
- Je pense que dans le cadre d'une review, l'utilisation de `isNew` signifiant "pas encore globalement reviewée" est bonne à garder. Si une entité concernée a déjà été reviewée, elle est sélectionnée mais non éditable, c'est bien. Si on voulait la modifier, il faut en faire une copie (pour les pieceVersion c'est possible depuis peu avec le bouton "Create new piece version from selected"). Et si elle n'a pas été revue, elle aparaît dans el formulaire d'édition, c'est approprié il me semble. Les formulaires fonctionnent bien avec `isNew` , cela me parait compliqué d'ajouter un comportement avec un nouveau champ distinct potentiellement contradictoire. Dis-moi si je me trompe.
- Nous avons décidé récemment de donner la possibilité à un éditeur durant le feedForm, de choisir une pieceVersion existante même si celle-ci n'a pas été encore rervue. Ceci pour faciliter la tâche d'un éditeur qui peut entrer plusieurs sources d'une même pièce d'affilé = gain de temps et de confort pour eux. **Important**: en conséquence, si la pieceVersion est utilisée dans une autre MMSource et qu'elle est modifiée durant la review, il faut en faire une copie en modifiant tous les id pour ne pas toucher à la pieceVersion de l'autre MMSource. Je pense que cela devrait se produire dans le traitement côté serveur au moment la persistence de la review. Dis-moi si tu es d'accord.

D. Peut-on prendre un chemin plus simple avec une unique clé de localStorage pour une revue ? Pas besoin qu'elle soit dynamique, une seule revue en cours possible, on doit abandonner une revue en cours si on veut en débuter une nouvelle. Il faut trancher cette question maintenant en tout cas oui.

E. Les changements n'étant pas nombreux (saut de la première étape, fonction de submit à la fin), gardons le tableau statique comme liste de `steps` .

F. En conséquence du point E. nous allons rendre ce composant `FeedSummary.tsx` polymorphe, avec un routage du submit différent selon le mode.

G. - cf le point D. Une unique clé de localStorage pour "review en cours", sans id.
- Si le reviewer abandonne volontairement : mécanisme de libération de la MMSource pour la rendre disponible à la review + marquage de la review en ABORTED
- Sinon, la review reste `IN_REVIEW` (lock DB) indéfinimentet. Le brouillon de review doit être restauré automatiquement, comme c'est le cas pour le feed form actuel. Pas de péremption du localStorage.
- Mécanisme de vidage du localStorage lors d'un changement de version de localStorage, comme pour le feed form actuel.

H. Oui, redirection automatique du reviewer vers sa review en cours s'il en a une.

I. Le commentaire est persisté avec le payload final de la review.

## Sonnet 5

Vos réponses résolvent la plupart des points. J'ai vérifié deux choses dans le code avant de continuer, et il en ressort une clarification nécessaire sur le point C, plus deux conséquences directes de vos réponses B et D.

**C — le fork automatique dépend d'une prémisse UI que je n'ai pas encore vérifiée**

J'ai regardé `SinglePieceVersionFormContainer.tsx:239-263` : il existe déjà un mécanisme de clonage, mais c'est un **bouton explicite** ("Create new piece version from selected") qui génère de nouveaux ids pour la pieceVersion + movements + sections *avant* toute édition — donc l'original partagé n'est jamais muté par ce chemin-là. Ma question porte sur l'autre chemin : une fois qu'une pieceVersion existante-mais-non-reviewée est **sélectionnée** (pas clonée), est-ce que ses champs (category, movements, sections...) apparaissent ensuite dans un formulaire **éditable** qu'on peut modifier directement, sans passer par le bouton de clonage ? Si oui, votre préoccupation est fondée et il faut le fork serveur. Si non (sélection = verrouillé en lecture, seul le clonage permet l'édition), alors le risque n'existe pas dans l'UI actuelle et le fork automatique côté serveur devient une ceinture de sécurité plutôt qu'un besoin fonctionnel réel.

Deuxième sous-question, indépendante de la réponse à la première : ce risque de mutation d'une entité partagée concerne-t-il **seulement PieceVersion** (+ son arbre Movement/Section), comme dans votre exemple, ou aussi Person/Organization/Collection/Piece dès qu'ils sont sélectionnés existants-non-reviewés puis édités ? Et est-ce un risque **déjà présent aujourd'hui** dans la saisie normale `/feed` (un éditeur qui réutilise une pieceVersion d'une autre source non encore reviewée), ou un risque que la review-in-feed-form introduit nouvellement en rendant ces entités plus facilement atteignables ? Ça détermine si c'est un correctif à porter dans ce projet ou un souci préexistant à traiter séparément.

**D — conséquence sur `review/start`**

En confirmant "une seule review active possible, il faut l'abandonner pour en commencer une autre" : j'ai vérifié `app/api/review/start/route.ts`, et aujourd'hui il empêche seulement de reverrouiller la **même** MMSource (`db.review.findFirst({ mMSourceId, state: IN_REVIEW })`) — il ne vérifie pas si **ce reviewer** a déjà une autre review `IN_REVIEW` sur une source différente. La redirection auto de `/review` (point H) masque ce trou en pratique, mais elle est contournable (navigation directe, onglet différent). Puisque vous voulez une seule clé de brouillon "review en cours" sans id, deux reviews actives simultanées pour le même reviewer écraseraient silencieusement l'une des deux dans le localStorage. Je propose d'ajouter cette vérification serveur dans `review/start` (le reviewer ne peut démarrer une review que s'il n'en a pas déjà une `IN_REVIEW`). Vous confirmez ?

Aussi, pour D : même avec une clé statique, `FeedFormProvider` (et les deux providers de sous-wizard single-piece/collection) doivent quand même être modifiés pour choisir entre deux clés fixes (`"feedForm"` vs `"reviewDraft"` par ex.) selon le mode — aujourd'hui la clé est figée en dur à la définition du reducer (`feedFormReducer.ts:644`), donc il faut bien un petit refactor (juste plus simple qu'un templating par reviewId). Je le note comme acté, pas besoin de reconfirmer.

## Me

C. Si elle n'est pas reviewée, une pieceVersion avoir `isNew: true` , et ainsi sera accessible en mode éditable dans le formulaire. C'est ce qui est voulu et rend la revue sans friction. C'est donc bien un fork serveur qu'il faut prévoir, en clonant la pieceVersion si elle est utilisée dans une autre MMSource (et en reportant le nouvel id de pieceVersion dans le MMSourceOnPieceVersion correspondant dans les données de la review en question)
=> Cela ne concerne que l'entité pieceVersion, les autres (Person/Organization/Collection/Piece) peuvent voir leurs propriétés modifiées durant la review sans changer d'id.

D. Je confirme que c'est une bonne chose de vérifier côté serveur que le reviewer n'a pas de review en cours.

## Sonnet 5

C et D sont clairs et cohérents (musicalement ça a du sens : PieceVersion/Movement/Section capturent une structure propre à l'édition-source, donc jamais partagée en mutation, alors que Person/Organization/Collection/Piece sont des référentiels canoniques qu'on corrige en place). Je note pour le document : fork serveur au submit, uniquement sur PieceVersion (+ ses Movement/Section), avec report du nouvel id dans le `mMSourceOnPieceVersion` correspondant à *cette* review — et remap des `MetronomeMark.sectionId` de cette même MMSource vers les nouveaux ids de section clonés.

Une dernière incohérence que j'ai trouvée en comparant les routes actuelles, à trancher avant de rédiger :

**Accès admin à une review en cours d'un autre reviewer**

Aujourd'hui : `getReviewOverview.ts` et l'ancien `checklist/layout.tsx` autorisent `isOwner || isAdmin` à consulter/éditer une review active, mais `submit/route.ts` refuse avec 403 si `review.creatorId !== userId` — donc un admin peut déjà aujourd'hui ouvrir et modifier la checklist d'un autre reviewer, mais ne peut jamais la soumettre (incohérence déjà présente, sans grande consé quence puisque la checklist est une UI de lecture/coche assez neutre).

Le problème devient plus concret avec le nouveau design : la nouvelle page `/review/[reviewId]` sera littéralement le formulaire feed, entièrement éditable, avec sauvegarde locale automatique dans la clé "review en cours". Si on garde la même règle d'accès (`isOwner || isAdmin`), un admin qui ouvre par erreur/curiosité la review d'un autre reviewer se retrouve avec un formulaire pleinement éditable qui écrit dans son propre brouillon local "review en cours" — et qui échouera de toute façon au submit final (403). Trois options :
- (a) Restreindre `/review/[reviewId]` strictement au reviewer propriétaire (l'admin perd l'accès direct à une review active, il garde la liste + l'audit log une fois terminée) ;
- (b) Autoriser aussi l'admin à soumettre (aligner `submit/route.ts` sur `isOwner || isAdmin`), assumant qu'un admin peut reprendre/finir la review de quelqu'un d'autre ;
- (c) Garder l'admin en lecture seule uniquement (nécessite un mode "lecture" du formulaire feed qui n'existe pas aujourd'hui — plus de travail, pour un besoin qui n'est pas exprimé).

Je recommande (a), la plus simple et cohérente avec le reste (aucune UI admin n'expose aujourd'hui d'action sur une review active de quelqu'un d'autre). Vous validez ?

Une fois ce point tranché, je considère qu'on n'a plus de zone d'ombre bloquante pour rédiger le document récapitulatif — dites-moi si c'est le cas pour vous aussi, ou s'il reste un point que vous voulez ajouter.

## Me

Option a : de toute façon, un admin qui ouvre une review d'un autre reviewer n'aura pas accès à son brouillon qui vit dans le navigateur de l'autre, donc c'est inutile.
Tu peux rédiger le document. Mets-le dans 'specs/review-in-feed-form' stp.

## Sonnet 5

J'ai rédigé le document dans `specs/review-in-feed-form/20260805_decisions.md`. Il couvre les 12 points tranchés : principe général, mode générique du feed form, hydratation des données (remplaçant le bridge), persistance locale, wrapper "review en cours", diff & audit, `isNew`/fork de PieceVersion, abandon, accès/concurrence, commentaire général, la liste des fichiers à supprimer/adapter/conserver, et le rappel du hors-scope (`self-source-edit`).

Ce document est prêt à servir de base pour la feuille de route détaillée.