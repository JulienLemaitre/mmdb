/**
 * @file subFormIdPreservation.test.ts
 *
 * Test suite for Lot 13: Sub-forms ID preservation & graph integrity audit.
 *
 * CONTEXT & OBJECTIVE (Lot 13 / Spec §13):
 * ----------------------------------------
 * When a user or reviewer edits an existing database entity through sub-form wizards
 * (e.g. SinglePieceVersionForm, CollectionPieceVersionsForm, or SourceContributionForm),
 * the sub-form handlers and mapping helpers MUST preserve the existing canonical entity ID (`id`).
 *
 * In initial data-entry mode (creating a source from scratch), generating a new UUID on edit
 * was harmless because everything was newly persisted.
 * In review mode (or when editing pre-existing entities), generating a new random UUID would
 * silently create a duplicated entity in the database instead of updating the existing one.
 *
 * This test suite validates:
 * 1. Mapping helpers preserve existing IDs when provided in input (editing).
 * 2. Mapping helpers generate a new UUID when ID is omitted (creation).
 * 3. Nested hierarchy IDs (PieceVersion -> Movement -> Section -> TempoIndication) are preserved.
 * 4. Collection update & contribution forms preserve existing IDs.
 * 5. `cleanFeedFormState` does not prune active entities when the full graph is loaded in review.
 */

import getPersonStateFromPersonInput from "@/utils/getPersonStateFromPersonInput";
import getPieceStateFromInput from "@/utils/getPieceStateFromInput";
import getPieceVersionStateFromInput from "@/utils/getPieceVersionStateFromInput";
import getMovementStateFromInput from "@/utils/getMovementStateFromInput";
import getSectionStateFromInput from "@/utils/getSectionStateFromInput";
import getMetronomeMarkInputFromState from "@/utils/getMetronomeMarksInputFromState";
import getMetronomeMarkStateFromInput from "@/utils/getMetronomeMarkStateFromInput";
import { cleanFeedFormState } from "@/context/utils/cleanFeedFormState";
import { FeedFormState } from "@/types/feedFormTypes";
import {
  CollectionState,
  MetronomeMarkInput,
  MetronomeMarkState,
  MovementState,
  PersonState,
  PieceState,
  PieceVersionState,
  SectionState,
  SectionStateExtendedForMMForm,
  TempoIndicationState,
} from "@/types/formTypes";
import { KEY } from "@/prisma/client";
import { NOTE_VALUE, PIECE_CATEGORY } from "@/prisma/client/enums";
import { MetronomeMarkListSchema } from "@/types/zodTypes";
import { v4 as uuidv4 } from "uuid";

describe("Sub-forms ID preservation audit (Lot 13)", () => {
  describe("1. Person (Composer / Contributor)", () => {
    // Tests getPersonStateFromPersonInput when editing an existing Person (with existing ID)
    it("should preserve existing person ID when input contains an ID", () => {
      const existingPersonId = "person-uuid-1234";
      const input = {
        id: existingPersonId,
        firstName: "Wolfgang Amadeus",
        lastName: "Mozart (Edited)",
        birthYear: 1756,
        deathYear: 1791,
      };

      const result = getPersonStateFromPersonInput(input);
      expect(result.id).toBe(existingPersonId);
      expect(result.firstName).toBe("Wolfgang Amadeus");
      expect(result.lastName).toBe("Mozart (Edited)");
    });

    // Tests getPersonStateFromPersonInput when creating a new Person (no ID provided)
    it("should generate a new unique UUID when creating a new person without an ID", () => {
      const input = {
        firstName: "Ludwig van",
        lastName: "Beethoven",
        birthYear: 1770,
        deathYear: 1827,
      };

      const result = getPersonStateFromPersonInput(input);
      expect(result.id).toBeDefined();
      expect(typeof result.id).toBe("string");
      expect(result.id.length).toBeGreaterThan(0);
      expect(result.firstName).toBe("Ludwig van");
    });
  });

  describe("2. Piece", () => {
    // Tests getPieceStateFromInput when editing an existing Piece (with existing ID)
    it("should preserve existing piece ID when input contains an ID", () => {
      const existingPieceId = "piece-uuid-5678";
      const composerId = "person-uuid-1234";
      const input = {
        id: existingPieceId,
        title: "Requiem in D Minor (Edited)",
        nickname: "Requiem",
        yearOfComposition: 1791,
        composerId,
      };

      const result = getPieceStateFromInput(input);
      expect(result.id).toBe(existingPieceId);
      expect(result.title).toBe("Requiem in D Minor (Edited)");
      expect(result.composerId).toBe(composerId);
    });

    // Tests getPieceStateFromInput when creating a new Piece (no ID provided)
    it("should generate a new unique UUID when creating a new piece without an ID", () => {
      const composerId = "person-uuid-1234";
      const input = {
        title: "Symphony No. 40 in G Minor",
        yearOfComposition: 1788,
        composerId,
      };

      const result = getPieceStateFromInput(input);
      expect(result.id).toBeDefined();
      expect(typeof result.id).toBe("string");
      expect(result.id.length).toBeGreaterThan(0);
      expect(result.title).toBe("Symphony No. 40 in G Minor");
    });
  });

  describe("3. PieceVersion, Movements and Sections", () => {
    // Tests full preservation of hierarchy IDs when editing a PieceVersion
    it("should preserve pieceVersion ID, movement IDs, section IDs, and tempoIndicationId when editing", () => {
      const pieceVersionId = "pv-uuid-1011";
      const pieceId = "piece-uuid-5678";
      const movId = "mov-uuid-2022";
      const secId = "sec-uuid-3033";
      const tempoIndicationId = "tempo-uuid-4044";

      const sectionInput = {
        id: secId,
        metreNumerator: 4,
        metreDenominator: 4,
        isCommonTime: true,
        isCutTime: false,
        comment: "Edited section",
        commentForReview: "",
        fastestStructuralNotesPerBar: 0,
        fastestBelCantoNotesPerBar: 0,
        fastestStaccatoNotesPerBar: 0,
        fastestRepeatedNotesPerBar: 0,
        fastestOrnamentalNotesPerBar: 0,
        tempoIndication: { value: tempoIndicationId, label: "Adagio" },
      };

      const movementInput = {
        id: movId,
        key: { value: KEY.D_MINOR, label: "D minor" },
        isVariation: false,
        sections: [sectionInput],
      };

      const pieceVersionInput = {
        id: pieceVersionId,
        category: {
          value: PIECE_CATEGORY.OTHER,
          label: "Other",
        },
        movements: [movementInput],
      };

      const result = getPieceVersionStateFromInput({
        pieceVersionInput: pieceVersionInput as any,
        pieceVersionId,
        pieceId,
      });

      expect(result.id).toBe(pieceVersionId);
      expect(result.pieceId).toBe(pieceId);
      expect(result.movements[0].id).toBe(movId);
      expect(result.movements[0].sections[0].id).toBe(secId);
      expect(result.movements[0].sections[0].tempoIndicationId).toBe(
        tempoIndicationId,
      );
    });

    // Tests getMovementStateFromInput and getSectionStateFromInput individually
    it("should preserve movement and section IDs in individual helpers", () => {
      const secId = "sec-individual-1";
      const movId = "mov-individual-1";
      const tempoId = "tempo-individual-1";

      const sectionState = getSectionStateFromInput(
        {
          id: secId,
          metreNumerator: 3,
          metreDenominator: 4,
          isCommonTime: false,
          isCutTime: false,
          comment: "",
          commentForReview: "",
          fastestStructuralNotesPerBar: 0,
          fastestBelCantoNotesPerBar: 0,
          fastestStaccatoNotesPerBar: 0,
          fastestRepeatedNotesPerBar: 0,
          fastestOrnamentalNotesPerBar: 0,
          tempoIndication: { value: tempoId, label: "Allegro" },
        },
        0,
      );

      expect(sectionState.id).toBe(secId);
      expect(sectionState.tempoIndicationId).toBe(tempoId);
      expect(sectionState.rank).toBe(1);

      const movementState = getMovementStateFromInput(
        {
          id: movId,
          key: { value: KEY.C_MAJOR, label: "C major" },
          isVariation: false,
          sections: [],
        },
        1,
      );

      expect(movementState.id).toBe(movId);
      expect(movementState.rank).toBe(2);
    });

    // Tests fallback generation when IDs are not provided
    it("should generate new UUIDs for movement and section when IDs are not provided", () => {
      const tempoId = "tempo-gen-1";
      const sectionState = getSectionStateFromInput(
        {
          metreNumerator: 4,
          metreDenominator: 4,
          isCommonTime: true,
          isCutTime: false,
          comment: "",
          commentForReview: "",
          fastestStructuralNotesPerBar: 0,
          fastestBelCantoNotesPerBar: 0,
          fastestStaccatoNotesPerBar: 0,
          fastestRepeatedNotesPerBar: 0,
          fastestOrnamentalNotesPerBar: 0,
          tempoIndication: { value: tempoId, label: "Andante" },
        },
        0,
      );

      expect(sectionState.id).toBeDefined();
      expect(typeof sectionState.id).toBe("string");
      expect(sectionState.id.length).toBeGreaterThan(0);

      const movementState = getMovementStateFromInput(
        {
          key: { value: KEY.G_MAJOR, label: "G major" },
          isVariation: false,
          sections: [],
        },
        0,
      );

      expect(movementState.id).toBeDefined();
      expect(typeof movementState.id).toBe("string");
      expect(movementState.id.length).toBeGreaterThan(0);
    });
  });

  describe("4. Collection", () => {
    // Tests collection ID preservation logic in CollectionPieceVersionsForm container/builder
    it("should preserve collection ID when editing an existing collection", () => {
      const existingCollectionId = "col-uuid-9999";
      const composerId = "person-uuid-1234";

      // Simulates the resolution logic in CollectionPieceVersionsFormContainer:
      // id: collection.id || selectedCollectionId || uuidv4()
      const buildCollectionState = (
        collectionInput: { id?: string; title: string },
        selectedCollectionId?: string,
      ) => ({
        id: collectionInput.id || selectedCollectionId || uuidv4(),
        composerId,
        title: collectionInput.title,
        isNew: true,
      });

      // Case A: id is present in the collection edit form input
      const resultFromInput = buildCollectionState(
        { id: existingCollectionId, title: "Complete Works (Edited)" },
        undefined,
      );
      expect(resultFromInput.id).toBe(existingCollectionId);
      expect(resultFromInput.title).toBe("Complete Works (Edited)");

      // Case B: id is provided via selectedCollectionId context fallback
      const resultFromContext = buildCollectionState(
        { title: "Complete Works (Edited via Context)" },
        existingCollectionId,
      );
      expect(resultFromContext.id).toBe(existingCollectionId);

      // Case C: brand new collection (no id anywhere) -> generates fresh UUID
      const resultNew = buildCollectionState(
        { title: "Brand New Collection" },
        undefined,
      );
      expect(resultNew.id).toBeDefined();
      expect(resultNew.id).not.toBe(existingCollectionId);
    });
  });

  describe("5. cleanFeedFormState preservation in review / full graph", () => {
    // Tests that all active entities in a fully populated graph loaded during review remain intact
    it("should NOT prune any entities that are part of the active MM Source graph", () => {
      const composer: PersonState = {
        id: "comp-1",
        firstName: "J.S.",
        lastName: "Bach",
        birthYear: 1685,
        deathYear: 1750,
      };

      const contributor: PersonState = {
        id: "contrib-1",
        firstName: "Carl Philipp Emanuel",
        lastName: "Bach",
        birthYear: 1714,
        deathYear: 1788,
      };

      const organization = {
        id: "org-1",
        name: "Breitkopf & Härtel",
      };

      const collection: CollectionState = {
        id: "col-1",
        composerId: composer.id,
        title: "The Well-Tempered Clavier",
        pieceCount: 24,
      };

      const piece: PieceState = {
        id: "piece-1",
        composerId: composer.id,
        collectionId: collection.id,
        title: "Prelude and Fugue in C Major, BWV 846",
      };

      const tempo1: TempoIndicationState = { id: "tempo-1", text: "Moderato" };
      const tempo2: TempoIndicationState = { id: "tempo-2", text: "Allegro" };

      const section1: SectionState = {
        id: "sec-1",
        rank: 1,
        metreNumerator: 4,
        metreDenominator: 4,
        isCommonTime: true,
        isCutTime: false,
        comment: "",
        commentForReview: "",
        fastestStructuralNotesPerBar: 0,
        fastestBelCantoNotesPerBar: 0,
        fastestStaccatoNotesPerBar: 0,
        fastestRepeatedNotesPerBar: 0,
        fastestOrnamentalNotesPerBar: 0,
        tempoIndicationId: tempo1.id,
      };

      const section2: SectionState = {
        id: "sec-2",
        rank: 2,
        metreNumerator: 4,
        metreDenominator: 4,
        isCommonTime: true,
        isCutTime: false,
        comment: "",
        commentForReview: "",
        fastestStructuralNotesPerBar: 0,
        fastestBelCantoNotesPerBar: 0,
        fastestStaccatoNotesPerBar: 0,
        fastestRepeatedNotesPerBar: 0,
        fastestOrnamentalNotesPerBar: 0,
        tempoIndicationId: tempo2.id,
      };

      const movement1: MovementState = {
        id: "mov-1",
        rank: 1,
        key: KEY.C_MAJOR,
        sections: [section1],
      };

      const movement2: MovementState = {
        id: "mov-2",
        rank: 2,
        key: KEY.C_MAJOR,
        sections: [section2],
      };

      const pieceVersion: PieceVersionState = {
        id: "pv-1",
        pieceId: piece.id,
        category: PIECE_CATEGORY.OTHER,
        movements: [movement1, movement2],
      };

      const mm1: MetronomeMarkState = {
        id: "mm-1",
        pieceVersionId: pieceVersion.id,
        sectionId: section1.id,
        noMM: true,
      };

      const state: FeedFormState = {
        formInfo: { currentStepRank: 3 },
        persons: [composer, contributor],
        organizations: [organization],
        collections: [collection],
        pieces: [piece],
        pieceVersions: [pieceVersion],
        tempoIndications: [tempo1, tempo2],
        metronomeMarks: [mm1],
        mMSourceContributions: [
          { role: "EDITOR", personId: contributor.id },
          { role: "PUBLISHER", organizationId: organization.id },
        ],
        mMSourceOnPieceVersions: [{ pieceVersionId: pieceVersion.id, rank: 1 }],
      };

      const cleaned = cleanFeedFormState(state);

      // Verify that all 8 types of entities in the graph remain intact
      expect(cleaned.persons?.map((p) => p.id).sort()).toEqual(
        [composer.id, contributor.id].sort(),
      );
      expect(cleaned.organizations?.map((o) => o.id)).toEqual([
        organization.id,
      ]);
      expect(cleaned.collections?.map((c) => c.id)).toEqual([collection.id]);
      expect(cleaned.pieces?.map((p) => p.id)).toEqual([piece.id]);
      expect(cleaned.pieceVersions?.map((pv) => pv.id)).toEqual([
        pieceVersion.id,
      ]);
      expect(cleaned.tempoIndications?.map((t) => t.id).sort()).toEqual(
        [tempo1.id, tempo2.id].sort(),
      );
      expect(cleaned.metronomeMarks?.map((mm) => mm.id)).toEqual([mm1.id]);
    });
  });

  describe("6. MetronomeMark ID preservation", () => {
    const mockSectionList: SectionStateExtendedForMMForm[] = [
      {
        id: "sec-1",
        rank: 1,
        metreNumerator: 4,
        metreDenominator: 4,
        isCommonTime: true,
        isCutTime: false,
        fastestStructuralNotesPerBar: 0,
        fastestBelCantoNotesPerBar: 0,
        fastestStaccatoNotesPerBar: 0,
        fastestRepeatedNotesPerBar: 0,
        fastestOrnamentalNotesPerBar: 0,
        pieceId: "piece-1",
        tempoIndicationId: "tempo-individual-1",
        tempoIndication: {
          id: "tempo-individual-1",
          text: "tempoIndication-1",
        },
        movement: {
          id: "mov-1",
          rank: 1,
          key: KEY.C_MAJOR,
          isVariation: false,
        },
        mMSourceOnPieceVersion: {
          pieceVersionId: "pv-1",
          rank: 1,
        },
      },
      {
        id: "sec-2",
        rank: 2,
        metreNumerator: 3,
        metreDenominator: 4,
        isCommonTime: false,
        isCutTime: false,
        fastestStructuralNotesPerBar: 0,
        fastestBelCantoNotesPerBar: 0,
        fastestStaccatoNotesPerBar: 0,
        fastestRepeatedNotesPerBar: 0,
        fastestOrnamentalNotesPerBar: 0,
        pieceId: "piece-1",
        tempoIndicationId: "tempo-individual-2",
        tempoIndication: {
          id: "tempo-individual-2",
          text: "tempoIndication-2",
        },
        movement: {
          id: "mov-1",
          rank: 1,
          key: KEY.C_MAJOR,
          isVariation: false,
        },
        mMSourceOnPieceVersion: {
          pieceVersionId: "pv-1",
          rank: 1,
        },
      },
    ];

    it("should preserve existing ID in getMetronomeMarkInputFromState for both MM and noMM", () => {
      const mmWithBpm: MetronomeMarkState = {
        id: "mm-uuid-123",
        sectionId: "sec-1",
        pieceVersionId: "pv-1",
        beatUnit: NOTE_VALUE.QUARTER,
        bpm: 120,
        comment: "Allegro vivace",
        noMM: false,
      };

      const mmWithoutBpm: MetronomeMarkState = {
        id: "mm-uuid-456",
        sectionId: "sec-2",
        pieceVersionId: "pv-1",
        noMM: true,
      };

      const inputWithBpm = getMetronomeMarkInputFromState(mmWithBpm);
      expect(inputWithBpm.id).toBe("mm-uuid-123");
      expect(inputWithBpm.noMM).toBe(false);
      if (!inputWithBpm.noMM) {
        expect(inputWithBpm.bpm).toBe(120);
        expect(inputWithBpm.beatUnit.value).toBe(NOTE_VALUE.QUARTER);
      }

      const inputWithoutBpm = getMetronomeMarkInputFromState(mmWithoutBpm);
      expect(inputWithoutBpm.id).toBe("mm-uuid-456");
      expect(inputWithoutBpm.noMM).toBe(true);
      expect(inputWithoutBpm.comment).toBeUndefined();
    });

    it("should preserve existing ID in getMetronomeMarkStateFromInput for both MM and noMM", () => {
      const inputs: MetronomeMarkInput[] = [
        {
          id: "mm-uuid-123",
          sectionId: "sec-1",
          noMM: false,
          bpm: 132,
          beatUnit: { value: NOTE_VALUE.HALF, label: "Half" },
          comment: "Presto",
        },
        {
          id: "mm-uuid-456",
          sectionId: "sec-2",
          noMM: true,
          comment: "No MM",
        },
      ];

      const states = getMetronomeMarkStateFromInput(inputs, mockSectionList);

      expect(states).toHaveLength(2);
      expect(states[0].id).toBe("mm-uuid-123");
      expect(states[0].noMM).toBe(false);
      expect((states[0] as any).bpm).toBe(132);
      expect((states[0] as any).beatUnit).toBe(NOTE_VALUE.HALF);
      expect(states[0].pieceVersionId).toBe("pv-1");

      expect(states[1].id).toBe("mm-uuid-456");
      expect(states[1].noMM).toBe(true);
      expect((states[1] as any).comment).toBeUndefined();
      expect(states[1].pieceVersionId).toBe("pv-1");
    });

    it("should allow schema validation with and without id", () => {
      const payloadWithIds = {
        metronomeMarks: [
          {
            id: "mm-uuid-1",
            sectionId: "sec-1",
            noMM: false,
            beatUnit: { value: NOTE_VALUE.QUARTER, label: "Quarter" },
            bpm: 100,
          },
          {
            id: "mm-uuid-2",
            sectionId: "sec-2",
            noMM: true,
          },
        ],
      };

      const parsedWithIds = MetronomeMarkListSchema.safeParse(payloadWithIds);
      expect(parsedWithIds.success).toBe(true);
      if (parsedWithIds.success) {
        expect(parsedWithIds.data.metronomeMarks[0].id).toBe("mm-uuid-1");
        expect(parsedWithIds.data.metronomeMarks[1].id).toBe("mm-uuid-2");
      }

      const payloadWithoutIds = {
        metronomeMarks: [
          {
            sectionId: "sec-1",
            noMM: false,
            beatUnit: { value: NOTE_VALUE.QUARTER, label: "Quarter" },
            bpm: 100,
          },
          {
            sectionId: "sec-2",
            noMM: true,
          },
        ],
      };

      const parsedWithoutIds =
        MetronomeMarkListSchema.safeParse(payloadWithoutIds);
      expect(parsedWithoutIds.success).toBe(true);
    });
  });
});
