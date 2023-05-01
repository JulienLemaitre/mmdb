const seedProblems = [
  {
    pieceName: "Escuela de guitarra, 1st ed.",
    movement: {
      rank: 6,
      key: "A_MAJOR"
    },
    section: {
      rank: 1,
      tempoIndication: "Andante"
    },
    metronomeMark: {
      beatUnit: "EIGHTH",
      bpm: 84,
      notes: {
        fastestStructuralNote: "TRIPLET_SIXTEENTH",
        fastestOrnamentalNote: null
      },
      notesPerSecond: {
        fastestStructuralNote: 4.2,
        fastestOrnamentalNote: 16.8
      }
    }
  },
  {
    pieceName: "Escuela de guitarra, 1st ed.",
    movement: {
      rank: 13,
      key: "A_MAJOR"
    },
    section: {
      rank: 1,
      tempoIndication: "Allegro cómodo"
    },
    metronomeMark: {
      beatUnit: "QUARTER",
      bpm: 63,
      notes: {
        fastestStructuralNote: null
      },
      notesPerSecond: {
        fastestStructuralNote: "Considering the amount of mordents, should they be considered structural?"
      }
    }
  },
  {
    pieceName: "Escuela de guitarra, 2nd ed.",
    movement: {
      rank: 6,
      key: "A_MAJOR"
    },
    section: {
      rank: 1,
      tempoIndication: "Andante"
    },
    metronomeMark: {
      beatUnit: "EIGHTH",
      bpm: 84,
      notes: {
        fastestStructuralNote: "TRIPLET_SIXTEENTH",
        fastestOrnamentalNote: null
      },
      notesPerSecond: {
        fastestStructuralNote: 4.2,
        fastestOrnamentalNote: 16.8
      }
    }
  },
  {
    pieceName: "Escuela de guitarra, 2nd ed.",
    movement: {
      rank: 13,
      key: "A_MAJOR"
    },
    section: {
      rank: 1,
      tempoIndication: "Allegro comodo"
    },
    metronomeMark: {
      beatUnit: "QUARTER",
      bpm: 63,
      notes: {
        fastestStructuralNote: null
      },
      notesPerSecond: {
        fastestStructuralNote: "Considering the amount of mordents, should they be considered structural?"
      }
    }
  },
  {
    pieceName: "Nuevo método para guitarra",
    movement: {
      rank: 12,
      key: "A_MAJOR"
    },
    section: {
      rank: 1,
      tempoIndication: "Allegro cómodo"
    },
    metronomeMark: {
      beatUnit: "QUARTER",
      bpm: 63,
      notes: {
        fastestStructuralNote: null
      },
      notesPerSecond: {
        fastestStructuralNote: "Considering the amount of mordents, should they be considered structural?"
      }
    }
  },
  {
    pieceName: "Symphony No.9, Op. 125",
    movement: {
      rank: 4,
      key: "D_MINOR"
    },
    section: {
      rank: 6,
      tempoIndication: "Adagio ma non troppo ma divoto"
    },
    metronomeMark: {
      beatUnit: "HALF",
      bpm: 60,
      notes: {
        fastestStructuralNote: null,
        fastestOrnamentalNote: "SIXTEENTH"
      },
      notesPerSecond: {
        fastestStructuralNote: 3,
        fastestOrnamentalNote: 8
      }
    }
  },
  {
    pieceName: "Ein deutsches Requiem, Op.45",
    movement: {
      rank: 5,
      key: "G_MAJOR"
    },
    section: {
      rank: 1,
      tempoIndication: "Langsam"
    },
    metronomeMark: {
      beatUnit: "EIGHTH",
      bpm: 104,
      notes: {
        fastestStructuralNote: "EIGHTH",
        fastestStacattoNote: null
      },
      notesPerSecond: {
        fastestStructuralNote: 1.73,
        fastestStacattoNote: 0.86
      }
    }
  },
  {
    pieceName: "Ein deutsches Requiem, Op.45",
    movement: {
      rank: 6,
      key: "C_MINOR"
    },
    section: {
      rank: 3,
      tempoIndication: "Allegro"
    },
    metronomeMark: {
      beatUnit: "HALF",
      bpm: 100,
      notes: {
        fastestStructuralNote: null,
        fastestStacattoNote: "QUARTER",
        fastestOrnamentalNote: "SIXTEENTH"
      },
      notesPerSecond: {
        fastestStructuralNote: 5,
        fastestStacattoNote: 3.33,
        fastestOrnamentalNote: 13.33
      }
    }
  },
  {
    pieceName: "Rinaldo, Op.50",
    movement: {
      rank: 7,
      key: "C_MINOR"
    },
    section: {
      rank: 1,
      tempoIndication: "Allegro"
    },
    metronomeMark: {
      beatUnit: "HALF",
      bpm: 104,
      notes: {
        fastestStructuralNote: "EIGHTH",
        fastestStacattoNote: null,
        fastestOrnamentalNote: "SIXTEENTH"
      },
      notesPerSecond: {
        fastestStructuralNote: 6.93,
        fastestStacattoNote: 5.2,
        fastestOrnamentalNote: 13.86
      }
    }
  },
  {
    pieceName: "Adagio et divertissements, Op.50",
    movement: {
      rank: 2,
      key: "D_MAJOR"
    },
    section: {
      rank: 1
    },
    metronomeMark: {
      beatUnit: "QUARTER",
      bpm: 152,
      notes: {
        fastestStructuralNote: null
      },
      notesPerSecond: {
        fastestStructuralNote: "16th as fastest?"
      }
    }
  },
  {
    pieceName: "Adagio et divertissements, Op.50",
    movement: {
      rank: 4,
      key: "G_MAJOR"
    },
    section: {
      rank: 1,
      tempoIndication: "Andantino"
    },
    metronomeMark: {
      beatUnit: "QUARTER",
      bpm: 66,
      notes: {
        fastestStructuralNote: null
      },
      notesPerSecond: {
        fastestStructuralNote: "16th as fastest?"
      }
    }
  },
  {
    pieceName: "Adagio et divertissements, Op.50",
    movement: {
      rank: 4,
      key: "G_MAJOR"
    },
    section: {
      rank: 2
    },
    metronomeMark: {
      beatUnit: "QUARTER",
      bpm: 144,
      notes: {
        fastestStructuralNote: null,
        fastestOrnamentalNote: "SIXTEENTH"
      },
      notesPerSecond: {
        fastestStructuralNote: "16th as fastest?",
        fastestOrnamentalNote: 9.6
      }
    }
  },
  {
    pieceName: "Récréation du guitariste, Op.51",
    movement: {
      rank: 2,
      key: "C_MAJOR"
    },
    section: {
      rank: 1
    },
    metronomeMark: {
      beatUnit: "QUARTER",
      bpm: 116,
      notes: {
        fastestStructuralNote: null
      },
      notesPerSecond: {
        fastestStructuralNote: "16th as fastest?"
      }
    }
  },
  {
    pieceName: "Récréation du guitariste, Op.51",
    movement: {
      rank: 11,
      key: "G_MAJOR"
    },
    section: {
      rank: 1
    },
    metronomeMark: {
      beatUnit: "QUARTER",
      bpm: 112,
      notes: {
        fastestStructuralNote: null
      },
      notesPerSecond: {
        fastestStructuralNote: "16th as fastest?"
      }
    }
  },
  {
    pieceName: "The School of Velocity, Op.299",
    movement: {
      rank: 26,
      key: "A_MAJOR"
    },
    section: {
      rank: 1,
      tempoIndication: "Allegro"
    },
    metronomeMark: {
      beatUnit: "DOTTED_QUARTER",
      bpm: 88,
      notes: {
        fastestStructuralNote: null,
        fastestOrnamentalNote: "SIXTEENTH"
      },
      notesPerSecond: {
        fastestStructuralNote: 19.06,
        fastestOrnamentalNote: 8.8
      }
    }
  },
  {
    pieceName: "40 Daily Exercises, Op.337",
    movement: {
      rank: 32,
      key: "C_MAJOR"
    },
    section: {
      rank: 1,
      tempoIndication: "Allegro molto veloce"
    },
    metronomeMark: {
      beatUnit: "QUARTER",
      bpm: 120,
      notes: {
        fastestStructuralNote: null
      },
      notesPerSecond: {
        fastestStructuralNote: 18
      }
    }
  },
  {
    pieceName: "40 Daily Exercises, Op.337",
    movement: {
      rank: 33,
      key: "E_FLAT_MAJOR"
    },
    section: {
      rank: 1,
      tempoIndication: "Allegro"
    },
    metronomeMark: {
      beatUnit: "QUARTER",
      bpm: 92,
      notes: {
        fastestStructuralNote: null,
        fastestStacattoNote: null
      },
      notesPerSecond: {
        fastestStructuralNote: 12.8,
        fastestStacattoNote: 3.2
      }
    }
  },
  {
    pieceName: "Symphony No.5, Op.76",
    movement: {
      rank: 3,
      key: "B_FLAT_MAJOR"
    },
    section: {
      rank: 1,
      tempoIndication: "Allegro scherzando"
    },
    metronomeMark: {
      beatUnit: "DOTTED_QUARTER",
      bpm: 76,
      notes: {
        fastestStructuralNote: "SIXTEENTH",
        fastestStacattoNote: "SIXTEENTH",
        fastestOrnamentalNote: null
      },
      notesPerSecond: {
        fastestStructuralNote: 7.6,
        fastestStacattoNote: 7.6,
        fastestOrnamentalNote: 8.86
      }
    }
  },
  {
    pieceName: "Variations on a Theme by Carafa, Op. 114",
    movement: {
      rank: 1,
      key: "A_MINOR"
    },
    section: {
      rank: 1,
      tempoIndication: "Andante sostenuto"
    },
    metronomeMark: {
      beatUnit: "QUARTER",
      bpm: 54,
      notes: {
        fastestStructuralNote: null,
        fastestStacattoNote: null
      },
      notesPerSecond: {
        fastestStructuralNote: 8.1,
        fastestStacattoNote: 8.1
      }
    }
  },
  {
    pieceName: "Symphony No.5, Op.64",
    movement: {
      rank: 2,
      key: "D_MAJOR"
    },
    section: {
      rank: 6,
      tempoIndication: "Moderato con anima"
    },
    metronomeMark: {
      beatUnit: "QUARTER",
      bpm: 100,
      notes: {
        fastestStructuralNote: "SIXTEENTH",
        fastestOrnamentalNote: null
      },
      notesPerSecond: {
        fastestStructuralNote: 6.66,
        fastestOrnamentalNote: 15
      }
    }
  }
]
