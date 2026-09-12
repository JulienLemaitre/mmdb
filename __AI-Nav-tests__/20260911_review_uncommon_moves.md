# Review UI test — uncommon moves — 2026-09-11

Tested in a visible Chrome browser on `localhost:3000` with the `REVIEWER` test account, using review `Invention in C major, BWV 772` by J.S Bach (15 pieces / sections).

| Screen / step | Actions and fields tested | Result |
|---|---|---|
| Review entry | Started the review and checked the persistent header actions. | Pass. `View Changes`, `General Comment`, and `Abort Review` remained available. |
| Pieces and Versions — order | Moved `Invention in C major, BWV 772` from rank 1 to rank 2 with `↓`. | Pass. The list reordered immediately; `View Changes` showed `MM_Source — UPDATE` with the first two `contentsOrder[].pieceVersionId` values swapped. |
| Pieces and Versions — delete section | Edited `Invention in C minor, BWV 773`; deleted its only section via the confirmation dialog; submitted the piece. | Pass. The empty movement was accepted. The diff contained `Section — DELETE`. |
| Pieces and Versions — add section after deletion | Added a replacement section; toggled Common Time to initialise `4/4`; retained `Allegro`, structural `16` and ornamental `32`; submitted and confirmed the piece. | Pass. The replacement appeared once at rank 1 and the diff contained both `Section — DELETE` and `Section — CREATE`. Observation: immediately after adding, unchecking Common Time leaves numerator/denominator disabled at `0` and shows validation errors; re-checking it restores valid `4/4`. |
| Metronome Marks — section coherence | Opened the final mark step after the delete/recreate operation; inspected all 15 section blocks and their existing marks. | Pass. The removed C-minor section had no orphan/duplicate mark block. Its replacement appeared exactly once with empty beat-unit/BPM controls; the 14 untouched sections retained their displayed marks. |
| Metronome Marks — no-mark toggle | Checked `No Metronome Mark` on the replacement and saved. Then unchecked it, selected `Quarter`, entered BPM `111`, and saved again. | UI pass. The toggle disabled beat-unit/BPM and allowed a save; after re-enabling, both fields accepted the new value. |
| Diff modal — new mark auditability | Opened `View Changes` after saving `Quarter = 111`; used `Expand all`. | **Fail / audit risk.** The modal listed only `Section — DELETE`, `Section — CREATE`, and `MM_Source — UPDATE`; it did not list `Metronome_Mark — CREATE` (nor an update), although the mark had been saved. As this modal uses the audit diff engine, this can omit the new mark from the audit trail. |
| Summary | Reached the summary and checked the reordered source contents, replacement section and calculated mark display. | Pass for displayed data. C minor was first; its only section was the replacement and displayed `Quarter = 111` with recalculated values (structural `7.4`, ornamental `14.8`). All other pieces/marks were still present. |
| Cleanup | Confirmed `Abort Review`. | Pass. The browser returned to `/review`; no review was approved or persisted. |

## Findings

- Section deletion/recreation correctly refreshes the final metronome-mark screen: no orphan block, no duplicate, and a new mark can be entered for the replacement section.
- Source piece reordering is represented in the source diff payload.
- **Defect:** a metronome mark created for a newly created replacement section is present in the final summary but absent from `View Changes`. This creates an audit-log coverage risk if approval follows the same diff result.
- **Minor form defect:** a fresh section defaults to Common Time with disabled `0/0` values. Toggling Common Time off leaves the values disabled and invalid; toggling it on restores `4/4`.
