# The Metronome Mark Database

The Metronome Mark Database is a project to create a database of metronome marks and time signatures for classical music compositions. It aims at being a useful tool for musical research.

The data for a piece are the following :
- **Piece** : basic information about the piece (composer, title, date of composition, etc.)
- **Piece versions** : the different versions of a piece, which may differ in terms of instrumentation or time signature. A Piece Version is described with its movements and sections if any.
- **Metronome mark Source** : describe the source of metronome mark (manuscript, first edition, etc.). Related to this source are the following data :
  - the **Piece Versions** that appears in this source
  - the **Contributors** to this source (editor, publisher, etc.)
  - the **Metronome Marks** that appears in this source
  - the **Fastest notes** for each section of the related piece versions, expressed in terms of _Number of notes per bar_ for :
    - the fastest _structural_ notes
    - the fastest _staccato_ notes
    - the fastest _repeated_ notes
    - the fastest _ornamental_ notes

## Getting Started

First, run the development server:

```bash
npm run dev --turbo
```
