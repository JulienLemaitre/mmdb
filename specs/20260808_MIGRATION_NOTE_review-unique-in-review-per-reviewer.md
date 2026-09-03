# Review process — Constraint “one active review per reviewer” (partial unique index)

**Date :** 2026-08-08 / 2026-08-25
**Lot associé :** Lot 11 — Gardes de démarrage et contraintes en base (`specs/review-in-feed-form/20260808_feuille-de-route_review-in-feed-form.md`)

---

## 1) Objectif

Garantir au niveau de la base de données PostgreSQL qu'un reviewer ne peut avoir au plus qu'**une seule revue active (`state = 'IN_REVIEW'`)** à un instant donné.
Cette contrainte empêche un reviewer d'ouvrir simultanément plusieurs revues en parallèle, prévenant ainsi la dispersion du travail et les conflits de session ou de brouillons locaux.

---

## 2) Déclaration dans le schéma Prisma (`prisma/schema.prisma`)

Dans le modèle `Review` :

```prisma
model Review {
  id             String       @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  mMSource       MMSource     @relation(fields: [mMSourceId], references: [id], onDelete: Cascade)
  mMSourceId     String       @db.Uuid
  creator        User         @relation(fields: [creatorId], references: [id])
  creatorId      String       @db.Uuid
  state          REVIEW_STATE @default(PENDING)
  startedAt      DateTime     @default(now())
  endedAt        DateTime?
  overallComment String?
  createdAt      DateTime     @default(now())
  updatedAt      DateTime     @updatedAt

  auditLogs        AuditLog[]
  reviewedEntities ReviewedEntity[]

  @@unique([mMSourceId], map: "review_unique_in_review_per_source", where: raw("state = 'IN_REVIEW'"))
  @@unique([creatorId], map: "review_unique_in_review_per_reviewer", where: raw("state = 'IN_REVIEW'"))
  @@index([mMSourceId])
}
```

---

## 3) Définition SQL de l'index partiel

Migration : `prisma/migrations/20260825182000_review_unique_in_review_per_reviewer/migration.sql`

```sql
-- prisma-migrate-disable-next-transaction
CREATE UNIQUE INDEX CONCURRENTLY review_unique_in_review_per_reviewer
    ON "Review" ("creatorId")
    WHERE state = 'IN_REVIEW';
```

Cet index partiel unique garantit :
- L'unicité de `creatorId` pour les enregistrements `Review` où `state = 'IN_REVIEW'`.
- La possibilité pour un même utilisateur d'avoir plusieurs revues dans les états `PENDING`, `APPROVED` ou `ABORTED`.
- L'utilisation du mot-clé `CONCURRENTLY` pour ne pas bloquer les opérations concurrentes sur la table lors de l'application.

---

## 4) Vérification en base de données

Vérification dans le catalogue PostgreSQL :

```sql
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'Review' 
AND indexname = 'review_unique_in_review_per_reviewer';
```

Résultat attendu :
```
               indexname                |                                                    indexdef                                                    
----------------------------------------+----------------------------------------------------------------------------------------------------------------
 review_unique_in_review_per_reviewer   | CREATE UNIQUE INDEX review_unique_in_review_per_reviewer ON public."Review" USING btree ("creatorId") WHERE (state = 'IN_REVIEW'::"REVIEW_STATE")
```
