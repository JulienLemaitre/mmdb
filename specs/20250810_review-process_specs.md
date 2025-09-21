# Specifications for the Review Process

## Glossary

#### Metronome Mark
A *Metronome Mark* (MM) is a combination of note value and corresponding frequency per minute, measured in beats per minute (BPM).

#### Metronome Mark Source
An *MM Source* is any document that provides a metronome mark for a given piece. In most cases, it will be editions of scores, but it can also be a letter or diary in which the metronome mark is mentioned.

#### Metronome Mark Source Contribution
An *MM Source Contribution* is any person or organization involved in the MM Source. One of the following roles needs to be selected: MM provider, arranger, editor, publisher, transcriber, translator. The most important role is the MM provider, who is the person that gave the MM to the piece in question.

#### Piece Version
A Piece Version is the structure of a piece, which consists of one or more movements (e.g., movements of a sonata or symphony). Each movement, in turn, is made up of one or more sections (e.g., the introduction of a movement and the main part).
Note: When a piece has not been composed with movements, It technically has one single movement in the database, and this leads to display rules where we don't show a "movement" explicitly in the interface.

#### Section
A Section is defined by the following three characteristics:
- time signature,
- tempo indication
- metronome mark
  If any of the three characteristics above change, a new section must be entered. For each section created, the maximum number of notes per bar for each structural, staccato, repeated and ornamental note is entered. If the tempo indication changes within a sonata movement, but no new metronome mark is given, the section in question should be entered without a metronome mark.

#### Collection
A collection consists of multiple pieces with the same opus number, e.g., Beethoven’s Op.10 or Schumann’s Kinderszenen. The pieces in a collection are either separated by numbering (e.g., Op.10 No.1, Op.10 No.2, etc.) or by other means such as names.

## Present state of our application

The first phase of development has been finished and well tested: the MM source data entering a section of the website.
Users with an 'EDITOR' role can access a multistep tunnel that allows them to completely describe an MM Source, its contributors, collections and pieces found in it, every section that these pieces contain with its time structure (metre), tempo indication and maximum number of notes per bar, and the metronome marks assigned to these sections when it exists.

The basis of a data exploration section has also been included in the website, but this will be for a later time in the project.

### Database structure

The current database structure can be found in the file ![[schema.dbml]]

## Motivation for a data review section

This database is meant to be used as a research support tool to lead inquiry into the use of metronome throughout the last two centuries.
The subject is raising controversy and will trigger hostile reactions when published.
It is an absolute necessity to organize the data collection in as an unbiased and conservative manner as possible.
This will be the case in the way we define the difference between structural and ornamental notes, for example, in our guidelines for the editors, and the general rules "when in doubt, take the more conservative choice".
Concerning the data, we need to double-check everything that is entered in the database, hence the necessity of a review process.
It will also serve as a safeguard later, when we plan to grant people outside of our small team the right to enter new data in the database.
## General remarks

### Technically

The new database structures dedicated to the review process shall meet this requirement:
- We need to register:
- The fact that a reviewer has started the review of an MM Source
- The fact that a review is completed or canceled.
- The changes the reviewer made.
- It would be handy to have an up-to-date *reviewStatus* column in the mMSource table to easily fetch mMSources that need to be reviewed or not.

### Consideration about the interface

- A logged-in user is considered a reviewer if he has a 'REVIEWER' role
- Only logged-in reviewers can access the review section.
- The reviewer of a Metronome Mark Source (review.creatorId) cannot be the person who entered the data in the first place (MMSource.creatorId).
- When a Metronome Mark Source is being reviewed by a user, it is not shown in the list anymore.
- When a reviewer has started a review, he cannot navigate to the list of MM Sources to be reviewed and choose another one. He must finish or abort the ongoing review first.
- The changes made by a reviewer always overrule the data entered by the first person
- When a composer / piece version is entered for the first time, the complete information needs to be reviewed. If either has been reviewed once, it does not need to be reviewed again (maybe we can connect the reviewed status of composers / piece versions with their respective IDs)

## High-level plan

### General consideration

- During the initial data registering process, once the data is fully complete, the MM source is registered in the database, and it will not be possible for an editor to change it anymore.
- Editors can only create new data, not update data persisted in the database.
- After a review is complete and persisted in the database, no subsequent change to the reviewed data is supposed to take place.

### Necessary interface

#### List of MM Source to be reviewed

A reviewer will see the list of MM Sources that need a review and select one to begin a review.

Will be listed all MM Sources :
- that have not yet been reviewed, or with an aborted review (reviewState = PENDING or ABORTED)
- that are not currently being reviewed (reviewState = IN_REVIEW)

We need to show this MM Source information:
- title
- composer(s)
- link to online score
- person who entered the data
- sections count
- creation date

#### Confirmation modal

A confirmation step before starting the review.
This is a simple modal with "cancel" and "confirm" buttons.

#### The MM Source review per se

Described below

### General approach concerning interface for reviewing an MM source

#### New idea - 12/09/2025

I think we can have the simplest review process as possible if we rule out any "structural modification" of the data. That means not allowing the reviewer to add, remove or move collections, pieces, movements or sections.

This way, the reviewer is shown the data that needs to be reviewed, and he can only :
- mark each datum as reviewed or not.
- modify the field values if needed.

We can think of an ordered sequential way of showing one slice of data at a time: one source description, collection or piece at a time, with a "next" button to go to the next piece.

If any structural change is required, I'm thinking about taking the mMSource data being reviewed and using it as initial values in the data-entering process.

We just need to add something to the data-entering context to declare it to be part of the review process.
A simple button to switch to the data-entering process with the initial values of the mMSource being reviewed. And a simple button to switch back to the review process.
The changes that would be applied through the data-entering process will be persisted in the database only when the review is complete, and as part of the review audit log.

This data-entering process is currently able to store in its context (synced in localStorage) the exact interface the user is currently on. So we can even display the part of the source where the reviewer was reviewing when he decided the switch to the data modification mode (= data-entering process fed with initial values).

#### Previous idea I consider obsolete for the moment

I want to reuse as most as possible the forms developed for the data-entering process.

Consequently, here is my approach concerning the interface that we obtain once we choose an MM Source to review :
1. the general organization of the view will be close to the MM Source "Pieces and Versions" step in the data registering process :
    - the first block will present the MM Source description data, including references and contributions. Contribution roles and linkage are reviewed; Person/Organization core records are excluded if previously reviewed.
    - Then comes a list of single pieces and collections.
    - Each one (MM Source description block and each piece or collection of pieces) is marked as reviewed or not according to the fact that all of the related fields to review have been reviewed or not).
    - From there, we can select a piece or a collection and access a new page to review its parts.
2. Selecting a collection will display the same type of view as above:
    - a first block with the collection's info
    - a list of its pieces to review.
    - We can then select a piece and access a new page to review its parts.
3. When selecting a piece to review, a not yet developed view, called the Piece Review Checklist, will display the data of every bit of data that is related to this piece and needs to be reviewed, exhaustively. Each bit of data will have a checkbox that serves to declare it as reviewed once it has been verified by the reviewer.
4. To avoid multiplying new components to develop, the details of a collection, if it needs to be reviewed, will be part of the Piece Review Checklist as the first block on the page.
5. If data needs to be corrected, the reviewer will have an "edit" button to click beside this particular datum, and he will be presented with the corresponding form among those already used in the data entering process for updating data.
6. After submitting the changes, he'll be back to the Piece Review Checklist to continue marking each datum as reviewed. Any bit of data that would have been updated by the reviewer will have its review state reset and will require to be marked as checked by the reviewer.
7. When every data of a piece is reviewed, the reviewer will be able to declare this piece as reviewed.
8. In the case of collections, when the collection's description and all its pieces are marked as reviewed, the whole collection will also be considered reviewed.
9. When all pieces and collections are reviewed, the reviewer will be able to register his entire review.

#### Advantages

- **Reuse of existing forms**
- The new Piece Review Checklist screen will be responsible for **presenting the entities that need to be reviewed and only them**. (As Stefan pointed it out, already reviewed persons (composer or MM Source contributors), organizations, collection and piece descriptions don't need to be reviewed again. Such reviewed data won't be presented to the reviewer nor editable by him.) => **This new screen will endorse this specific feature without the need to adapt other existing screens**.

#### Styles guidelines

- The presentation styles must stick as close as possible to the existing data-entering process.
- The Piece Review Checklist screen will be a new screen, but it should adhere to the same styles frame as the existing data-entering process:
- Entity / Daisy UI semantic color correspondence:
    - MM Source = info
    - Collection = warning
    - Piece = accent
    - Piece Version = accent
    - Movement = primary
    - Section = secondary
  - Titles
  - Tables: take an example on the summary section display table for the number of notes per bar and per second (in components/entities/section/SectionDetail.tsx)
  - Buttons action / color:
    - submit/validate/confirm/ok = primary
    - add = accent
    - reset = error
    - back = neutral
    - cancel = neutral
    - discard = warning
    - edit = ghost / hover:accent
    - delete = ghost / hover:error
    - remove = ghost / hover:error
    - save = primary
    - next = primary
  - padding and margins

A good example of these style usage and combination is the Summary step of the feedForm (components/multiStepMMSourceForm/stepForms/FeedSummary.tsx):
- capture of the whole page: specs/20250815_FeedForm_Summary.png
- capture of the section display table: specs/20250815_FeedForm_summary_section_display.png

## Remarks on the "not to be reviewed twice" entities

The following entities should not be presented for review to the reviewer of a piece if they already have been reviewed previously:
- person
- organization
- collection (*Collection* in db: title, composer)
- piece description (*Piece* in db: title, nickname, composition, date of composition)

#### Consequence

- We need to know at the entity level if it has been reviewed or not, at least for person, organization, piece and collection.


## Clarifications and decisions

### 1. Roles and permissions

- Possible roles are 'USER', 'EDITOR' and 'REVIEWER', in order. A role has all rights from previous roles. A reviewer can do what an editor can do (entering new data) but not the contrary. The fact that a reviewer cannot review MM Source data he himself entered still applies and must be enforced by the system.
- On top of these roles, there exists the 'ADMIN' role. This one will have the right to:
    - re-assign or abort an in-progress review.
    - assign roles to users
- When a review is aborted, we retain no data about it besides the fact that the review has been initiated (with the creation date) and aborted (with the end date as well), with a status ABORTED.

### 2. Review unit, scope, and granularity

- Top-level unit of a review session: a single MM Source.
- As with the data-entering process, we will use React context synced to browser local storage to store in-progress review data in order to allow a reviewer to start each time were he left his work the last time. We will persist in the database only when the review of a full MM Source is complete.
- In the Piece Review Checklist, absolutely every field that exists in the different entities' EditForms from the entering data process will have to be checked with a checkbox to be marked as "reviewed". These fields correspond to the database table fields for these entities, i.e. Collection, Piece, PieceVersion, Movement, Section, TempoIndication, MetronomeMark, MMSource, Reference, Contribution, Organization, Person.
- Visually, we can mark sub-MM Source entities as reviewed, but technically, it is each and every one of their fields that must be checked. These sub-entities are:
    - Collections (description fields only, not pieces).
    - Pieces (description fields).
    - Piece Versions (structure).
    - Movements.
    - Sections.
    - Metronome Marks (per section).

### 3. “Do not review twice” rules

- Entities that should not be reviewed again if previously reviewed:
    - Person
    - Organization
    - Collection (title, composer)
    - Piece description (title, nickname, composition, date of composition)

- Once Person/Organization/Collection (title, composer)/Piece(description) are reviewed, they cannot be edited through normal flows; only ADMIN may edit via back-office, and such edits do not flip any “reviewed” status.
- There is no difficulty in principle to have multiple subsequent reviews on a single MM Source, even if we do not plan on organizing such a process with our interface. We do consider using AI as a first pass review process, but the time has not come yet for that. When implemented, it could just be registered exactly the same way as a review with a user "AI".

### 4. State model and lifecycle (MM Source review)

The following is the first thought. It could be changed if a better way is proposed.

- A Review entity needs to be built, minimally with the fields:
    - id
    - sourceId (MMSource.id)
    - creatorId (userId)
    - startedAt
    - endedAt
    - state: PENDING, IN_REVIEW, APPROVED, ABORTED
- MM Source could have a reviewState field with the same values possible as the review.state field. MMSource.reviewState is a denormalized mirror updated by the backend (via triggers probably).
- For each reviewed entity (collection/piece/piece version/movement/section/MM/reference/tempo indication), we should be able to link it to the review or reviews concerning it. An auditLog type table might be suitable in this case; we should see if there are lighter solutions.

### 6. Review locking

When the reviewer confirms starting a review, we will create the review entity in the database with the state IN_REVIEW, the id of the source it relates to, the user and the date.
This will be used as to:
- Prevent and forbid having two ongoing reviews for the same MM Source (another reviewer cannot choose to review this MM Source anymore)
- not include in review MM Source in the general list of MM Sources waiting for review.

The review process can be long (several days for long musical pieces). We do not need to define an active stale lock policy. We can have an overview of the opened review for the admin and let them decide to abort a review if it has been open for too long and release it to be chosen again by another reviewer.

### 7. Where “review edits” live before completion

- During review, like during the initial registering data process, edits are applied to a client-side working copy (React context synced with local storage) only.
- On completion:
    - Persist changes.
    - Persist an immutable audit record with a diff per changed field, linked to reviewId.
    - single transaction to apply changes and write audit log rows, then set Review.state = APPROVED and MM Source reviewState = APPROVED. => single transaction = all succeeds or none

### 8. Review evidence and rationale

The review consists of verifying the entered data by comparing it to an online musical score. There is no other source of data involved.
Consequently, there is no need to provide review comments on a by-field process.
We can, however, add a general comment field in the Review table that the reviewer can fill at the final step of its review.

### 9. UX considerations

Every field is important to check, so we cannot provide any easy "check all fields" shortcut.

otherwise, we should:
- Provide progress indicators and filters (e.g., show or highlight unchecked, show or highlight changed).
- Disable final submission until 100% of required checks are completed.
### 10. Handling optional/missing fields

- Show “Not provided / N/A” fields; they still require a review checkbox with that status.
- Validation: The review form should not force making previously optional fields non-empty, unless a rule explicitly requires it.

### 11. Reassignment and abort flow

- Abort immediately releases the MM Source for the other reviewers.
- UI instructs the reviewer that his review has been discarded and automatically discards local storage data for that review.

### 12. Multiple reviews on the same MM Source

We said we don't plan to organize multiple reviews for a given MM Source for the moment, but as a general rule, a review is seen as a data refinement by a person of confidence, so:
- Current data is always the result of the latest complete and approved review.
- MM Source reviewState reflects the most recent review lifecycle.
- We should maintain links from entities to all reviews that changed them for history.

### 13. Review states and transitions

The possible review states transitions are:

- PENDING -> IN_REVIEW on lock creation. => triggered by a reviewer who confirms starting the review of an MM Source.
- IN_REVIEW -> APPROVED on successful submission.
- IN_REVIEW -> ABORTED on admin or user abort. => The MM Source is then released and back in the list of MM Source to be reviewed.
- ABORTED -> IN_REVIEW => triggered by a reviewer starting a new review. It will create a new review row distinct from the aborted one.

### 14. Audit log schema

A minimal idea for an audit log is to have the following fields: reviewId, entityType, entityId, operation (CREATE, UPDATE or DELETE), before (jsonb of the entity), after (jsonb of the entity), authorId, createdAt, comment.

This is a first thought, it could be changed and optimized according to other choices.