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

## Codex - GPT-5.6 Terra - High

Je vais cartographier le parcours actuel de revue, le formulaire Feed et leurs points de jonction afin d’identifier uniquement les décisions qui restent à prendre — sans modifier le code.

Le point structurant confirmé : le formulaire Feed sait déjà être amorcé depuis un état de revue, mais cet amorçage sert aujourd’hui à des allers-retours ciblés depuis la checklist. Je vérifie maintenant les différences de modèle et la soumission afin de distinguer ce qui peut être réemployé de ce qui doit être remplacé.

Le parcours actuel révèle aussi deux implications à arbitrer : l’ancienne checklist est la seule source des validations explicites et l’état de travail de revue est aujourd’hui stocké dans le navigateur. Je consulte les spécifications déjà présentes pour éviter de rouvrir une décision qui aurait été prise auparavant.

L’analyse confirme que le changement est faisable en réemployant le formulaire Feed, mais les décisions suivantes sont nécessaires avant de pouvoir rédiger un document sans ambiguïté :

1. La checklist détaillée disparaît-elle totalement, y compris sa règle « chaque champ doit être coché » ?  
   Je propose que l’approbation nécessite seulement : toutes les étapes Feed valides, puis une confirmation explicite de fin de revue. La progression afficherait les étapes complétées (et éventuellement le nombre de sections/marques concernées), sans validation champ par champ.

2. Souhaitez-vous conserver un brouillon de revue après rechargement/nouvelle session navigateur ?  
   Je recommande oui, mais dans un espace `localStorage` dédié à `reviewId`, isolé du brouillon normal de `/feed`. Le `FEED_FORM_BOOT_KEY` et le bridge aller-retour deviendraient alors inutiles.

3. À la fin, faut-il conserver le champ de commentaire général de revue (`Review.overallComment`) ?  
   Il existe dans le modèle et dans l’API actuelle, mais n’est pas indispensable à votre nouvelle interface.

4. Lorsque la revue est approuvée sans checklist, confirmez-vous que les `ReviewedEntity` doivent toujours être créées pour toutes les entités éligibles de la source (personnes, organisations, collections, pièces, versions) ?  
   C’est ce qui préserve la règle historique « ne pas revoir deux fois ».

5. Les entités déjà globalement revues restent-elles modifiables dans ce nouveau formulaire de revue, comme aujourd’hui ?  
   Je recommande oui : leur modification doit rester auditée, même si elles ne sont plus spécialement signalées par une checklist.

6. Pour l’abandon, validez-vous ce comportement : modal de confirmation, appel de l’API d’abandon, suppression du brouillon local de cette revue, puis retour à la liste ?  
   Toute modification non soumise serait donc perdue, comme dans le processus actuel.

7. Pour les administrateurs : conserve-t-on l’accès en lecture/abandon à une revue détenue par un autre reviewer, ou doivent-ils aussi pouvoir la soumettre à sa place ?  
   Le code actuel est incohérent : l’admin peut ouvrir/abandonner, mais pas soumettre.

8. Souhaitez-vous supprimer complètement l’ancienne route `/review/[reviewId]/checklist` et ses composants, ou garder une redirection temporaire vers `/review/[reviewId]` ?  
   Je recommande une redirection de compatibilité pendant la transition, puis une suppression dans un nettoyage ultérieur.

9. Pour préparer l’édition future par l’éditeur avant revue : confirmez-vous que l’architecture doit introduire dès maintenant un contexte générique de « session de formulaire sur une source existante » (`mode: review | editor-edit`), tout en n’implémentant aujourd’hui que le mode `review` ?  
   Cela évitera de recâbler le formulaire lors de l’étape suivante.

Le point technique important : l’API de soumission de revue peut conserver sa transaction, ses verrous et son audit log ; elle devra recevoir l’état du formulaire Feed et le convertir côté serveur dans la représentation utilisée pour le diff/audit, au lieu de recevoir une `workingCopy` issue de la checklist.

Dès vos réponses à ces neuf points, je pourrai rédiger le document récapitulatif clair et concis demandé.

## Moi

Mes réponses :
1. Oui, la checklist détaillée disparaît complètement. Approbation = toutes les étapes Feed valides, puis une confirmation explicite de fin de revue.
2. Oui, conserver un brouillon de revue après rechargement/nouvelle session navigateur, dans un espace localStorage dédié à reviewId, isolé du brouillon normal de /feed.
3. Oui, conserver le champ de commentaire général de revue (Review.overallComment). Idéalement, il faudrait qu'il soit accessible est éditable durant tout le processus de review. Je me dis qu'un bouton devrait permettre d'y accéder et de le compléter n'importe quand dans la zone de contexte, à côté du bouton pour abandonner la review.
4. Oui, je confirme que les ReviewedEntity doivent toujours être créées pour toutes les entités éligibles de la source (personnes, organisations, collections, pièces, versions)
5. Oui, les entités déjà globalement revues restent modifiables, avec modifications auditées. Le fait qu'elles ont déjà été revue au moins une fois devrait être indiqué visuellement.
6. Je valide le comportement proposé.
7. Je ne comprends pas à quoi cela fait référence. Depuis quelle interface les admins peuvent-ils lire et abandonner une review en cours d'un autre utilisateur ?
8. L'interface n'est pas en production à ce jour, donc nous allons supprimer complètement l'ancienne route et ses composants.
9. Oui, il faut une architecture avec un contexte générique d'utilisation du feed form adapté aux trois cas actuels 'data entering', 'self-source-edit' et 'review'.
   J'approuve le point technique final également.

## GPT

Merci, ces choix fixent l’essentiel du nouveau flux. Je clarifie maintenant le seul point resté ouvert sur les administrateurs à partir des écrans réellement présents, puis je vérifierai les conséquences du nouveau contexte générique sur l’initialisation et la persistance du formulaire.

Pour le point 7 : il n’existe pas aujourd’hui d’écran administrateur permettant d’ouvrir ou d’abandonner une revue active. Le tableau Admin affiche seulement les revues et leurs audit logs.

L’ambiguïté vient des autorisations techniques actuelles : un admin qui connaît l’URL `/review/[reviewId]/checklist` peut ouvrir une revue dont il n’est pas propriétaire ; l’API d’abandon l’y autorise aussi. En revanche, l’API de soumission exige que l’admin soit le reviewer propriétaire. C’est donc une capacité non exposée par l’interface, et partiellement incohérente.

Je propose de la sortir du périmètre de cette évolution : la nouvelle interface de revue est réservée à son reviewer propriétaire ; l’admin conserve le tableau de suivi et une future action explicite d’abandon/réattribution pourra être ajoutée dans l’admin. Est-ce bien la règle à retenir ?

Il reste aussi une décision de présentation, mineure mais utile au plan : je propose que la zone de contexte affiche une progression par étapes du formulaire, par exemple « 3 étapes de saisie validées sur 4 », puis « Prêt à approuver » lorsque les quatre étapes de données sont valides. Elle afficherait aussi le statut de revue, le bouton de commentaire général et le bouton d’abandon. Confirmez-vous cette métrique, plutôt qu’un décompte d’entités ou de champs ?

## Moi

Pour le point 7, on retient la règle proposé: nouvelle interface réservée à son propriétaire reviewer.

Pour la présentation, il faut totalement abandonner le suivi par champ et entité. Je suis favorable à une progression par étape du formulaire, mais je ne veux pas réintroduire quelque chose de complexe à gérer par-dessus le formulaire lui-même. Donc OK seulement si c'est léger techniquement.

## GPT

Toutes les décisions nécessaires sont désormais prises.

La progression sera légère : elle réutilisera simplement les prédicats de complétude déjà définis pour les étapes Feed, sans suivi additionnel de champs ni d’entités.

Le document pourra donc cadrer :

- le nouveau parcours `/review/[reviewId]` ;
- le contexte générique `data-entering | self-source-edit | review` ;
- le brouillon isolé par revue dans `localStorage` ;
- le commentaire général éditable durant toute la revue ;
- l’approbation après validation du formulaire et confirmation ;
- la soumission de revue, l’audit et les `ReviewedEntity` conservés ;
- l’abandon et le nettoyage du brouillon ;
- la suppression intégrale de la checklist, du bridge et de ses composants ;
- l’accès limité au reviewer propriétaire.

Donnez-moi le GO et je rédigerai le document récapitulatif.