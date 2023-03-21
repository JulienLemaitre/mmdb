// xlsxParseOutput

const dataSheet = [
  {
    Composer: 'Beethoven, Ludwig van',
    Title: 'Symphony No.1, Op.21',
    'Year of Composition': 1800,
    'Year of Publication': '1809 (1817)',
    Publisher: 'Cianchettini & Sperati',
    Editor: 'N/A',
    Link: 'https://ks.imslp.info/files/imglnks/usimg/4/4a/IMSLP46060-PMLP01582-Op.21.pdf'
  },
  {
    'Movement of Work': 'i',
    Key: 'C major',
    'Tempo Indication': 'Adagio',
    Metre: 'C',
    'Metronome Marking': 'E = 88',
    'Fastest Structural Notes (notes/s)': 5.86,
    'Fastest Ornamental Notes (notes/s)': 5.86
  },
  {
    'Tempo Indication': 'Allegro con brio',
    Metre: 'C',
    'Metronome Marking': 'H = 112',
    'Fastest Structural Notes (notes/s)': 14.9,
    'Fastest Stacatto Notes (notes/s)': 7.46
  },
  {
    'Movement of Work': 'ii',
    Key: 'F major',
    'Tempo Indication': 'Andante cantabile con moto',
    Metre: '3/8',
    'Metronome Marking': 'E = 120',
    'Fastest Structural Notes (notes/s)': 8,
    'Fastest Stacatto Notes (notes/s)': 8,
    'Fastest Ornamental Notes (notes/s)': 8
  },
  {
    'Movement of Work': 'iii',
    Key: 'C major',
    'Tempo Indication': 'Allegro molto e vivace',
    Metre: '3/4',
    'Metronome Marking': 'Dotted H = 108',
    'Fastest Structural Notes (notes/s)': 10.8,
    'Fastest Stacatto Notes (notes/s)': 10.8,
    'Additional Notes': 'Minuet and trio'
  },
  {
    'Movement of Work': 'iv',
    Key: 'C major',
    'Tempo Indication': 'Adagio',
    Metre: '2/4',
    'Metronome Marking': 'E = 63',
    'Fastest Structural Notes (notes/s)': 4.2,
    'Fastest Stacatto Notes (notes/s)': 4.2
  },
  {
    'Tempo Indication': 'Allegro molto e vivace',
    Metre: '2/4',
    'Metronome Marking': 'H = 88',
    'Fastest Structural Notes (notes/s)': 11.7,
    'Fastest Stacatto Notes (notes/s)': 11.7
  },
  {
    Composer: 'Beethoven, Ludwig van',
    Title: 'Symphony No.2, Op.36',
    'Year of Composition': 1802,
    'Year of Publication': '1809 (1817)',
    Publisher: 'Cianchettini & Sperati',
    Editor: 'N/A',
    Link: 'https://ks.imslp.info/files/imglnks/usimg/4/45/IMSLP46061-PMLP02580-Op.36.pdf'
  },
  {
    'Movement of Work': 'i',
    Key: 'D major',
    'Tempo Indication': 'Adagio molto',
    Metre: '3/4',
    'Metronome Marking': 'E = 84',
    'Fastest Structural Notes (notes/s)': 11.2,
    'Fastest Stacatto Notes (notes/s)': 5.6,
    'Fastest Ornamental Notes (notes/s)': 5.6
  },
  {
    'Tempo Indication': 'Allegro con brio',
    Metre: 'C',
    'Metronome Marking': 'H = 100',
    'Fastest Structural Notes (notes/s)': 20,
    'Fastest Stacatto Notes (notes/s)': 13.33,
    'Fastest Ornamental Notes (notes/s)': 26.66
  },
  {
    'Movement of Work': 'ii',
    Key: 'A major',
    'Tempo Indication': 'Larghetto',
    Metre: '3/8',
    'Metronome Marking': 'E = 92',
    'Fastest Structural Notes (notes/s)': 6.13,
    'Fastest Stacatto Notes (notes/s)': 6.13
  },
  {
    'Movement of Work': 'iii',
    Key: 'D major',
    'Tempo Indication': 'Allegro',
    Metre: '3/4',
    'Metronome Marking': 'Dotted H = 100',
    'Fastest Structural Notes (notes/s)': 10,
    'Fastest Stacatto Notes (notes/s)': 10,
    'Additional Notes': 'Scherzo'
  },
  {
    'Movement of Work': 'iv',
    Key: 'D major',
    'Tempo Indication': 'Allegro molto',
    Metre: 'C',
    'Metronome Marking': 'H = 152',
    'Fastest Structural Notes (notes/s)': 10.13,
    'Fastest Stacatto Notes (notes/s)': 10.13,
    'Fastest Ornamental Notes (notes/s)': 20.26
  },
  {
    Composer: 'Beethoven, Ludwig van',
    Title: 'Symphony No.3, Op.55',
    'Year of Composition': 1804,
    'Year of Publication': '1809 (1817)',
    Publisher: 'Cianchettini & Sperati',
    Editor: 'N/A',
    'Additional Notes': '"Eroica" Symphony',
    Link: 'https://ks4.imslp.net/files/imglnks/usimg/e/e2/IMSLP46066-PMLP02581-Op.55.pdf'
  },
  {
    'Movement of Work': 'i',
    Key: 'Eb major',
    'Tempo Indication': 'Allegro con brio',
    Metre: '3/4',
    'Metronome Marking': 'Dotted H = 60',
    'Fastest Structural Notes (notes/s)': 12,
    'Fastest Stacatto Notes (notes/s)': 6
  },
  {
    'Movement of Work': 'ii',
    Key: 'C minor',
    'Tempo Indication': 'Adagio assai',
    Metre: '2/4',
    'Metronome Marking': 'E = 80',
    'Fastest Structural Notes (notes/s)': 8,
    'Fastest Stacatto Notes (notes/s)': 5.33,
    'Fastest Ornamental Notes (notes/s)': 8,
    'Additional Notes': 'Funeral march'
  },
  {
    'Movement of Work': 'iii',
    Key: 'Eb major',
    'Tempo Indication': 'Allegro vivace',
    Metre: '3/4',
    'Metronome Marking': 'Dotted H = 116',
    'Fastest Structural Notes (notes/s)': 11.6,
    'Fastest Stacatto Notes (notes/s)': 5.8,
    'Fastest Ornamental Notes (notes/s)': 5.8,
    'Additional Notes': 'Scherzo'
  },
  {
    'Tempo Indication': 'Alla breve',
    Metre: 'C',
    'Metronome Marking': 'W = 116',
    'Fastest Structural Notes (notes/s)': 15.46,
    'Fastest Stacatto Notes (notes/s)': 7.73
  },
  {
    'Movement of Work': 'iv',
    Key: 'Eb major',
    'Tempo Indication': 'Allegro molto',
    Metre: '2/4',
    'Metronome Marking': 'H = 76',
    'Fastest Structural Notes (notes/s)': 10.13,
    'Fastest Stacatto Notes (notes/s)': 10.13
  },
  {
    'Tempo Indication': 'Poco Andante',
    Metre: '2/4',
    'Metronome Marking': 'E = 108',
    'Fastest Structural Notes (notes/s)': 7.2,
    'Fastest Stacatto Notes (notes/s)': 7.2
  },
  {
    'Tempo Indication': 'Presto',
    Metre: '2/4',
    'Metronome Marking': 'E(Q) = 116 ',
    'Fastest Structural Notes (notes/s)': '7.73 (15.46)',
    'Fastest Stacatto Notes (notes/s)': '3.86 (7.73)',
    'Additional Notes': 'Identified as misprint; see Noorduin, 2016'
  },
  {
    Composer: 'Beethoven, Ludwig van',
    Title: 'Symphony No.4, Op.60',
    'Year of Composition': 1806,
    'Year of Publication': '1823 (1817)',
    Publisher: 'N. Simrock',
    Editor: 'N/A',
    Link: 'https://ks4.imslp.net/files/imglnks/usimg/c/c4/IMSLP46075-PMLP01585-Op.60.pdf'
  },
  {
    'Movement of Work': 'i',
    Key: 'Bb major',
    'Tempo Indication': 'Adagio',
    Metre: 'C',
    'Metronome Marking': 'Q = 66',
    'Fastest Structural Notes (notes/s)': 4.4,
    'Fastest Ornamental Notes (notes/s)': 11
  },
  {
    'Tempo Indication': 'Allegro vivace',
    Metre: 'C',
    'Metronome Marking': 'W = 80',
    'Fastest Structural Notes (notes/s)': 21.33,
    'Fastest Stacatto Notes (notes/s)': 5.33,
    'Fastest Ornamental Notes (notes/s)': 42.66
  },
  {
    'Movement of Work': 'ii',
    Key: 'Eb major',
    'Tempo Indication': 'Adagio',
    Metre: '3/4',
    'Metronome Marking': 'E = 84',
    'Fastest Structural Notes (notes/s)': 5.6,
    'Fastest Stacatto Notes (notes/s)': 5.6,
    'Fastest Ornamental Notes (notes/s)': 11.2,
    'Additional Notes': 'Ornamented notes are tremolo'
  },
  {
    'Movement of Work': 'iii',
    Key: 'Bb major',
    'Tempo Indication': 'Allegro molto e vivace',
    Metre: '3/4',
    'Metronome Marking': 'Dotted H = 100',
    'Fastest Structural Notes (notes/s)': 5,
    'Fastest Stacatto Notes (notes/s)': 5,
    'Additional Notes': 'Scherzo'
  },
  {
    'Tempo Indication': 'Un poco meno allegro',
    Metre: '3/4',
    'Metronome Marking': 'Dotted H = 88',
    'Fastest Structural Notes (notes/s)': 8.8,
    'Fastest Stacatto Notes (notes/s)': 8.8,
    'Fastest Ornamental Notes (notes/s)': 17.6,
    'Additional Notes': 'Trio'
  },
  {
    'Movement of Work': 'iv',
    Key: 'Bb major',
    'Tempo Indication': 'Allegro ma non troppo',
    Metre: '2/4',
    'Metronome Marking': 'H = 80',
    'Fastest Structural Notes (notes/s)': 10.66,
    'Fastest Stacatto Notes (notes/s)': 10.66,
    'Fastest Ornamental Notes (notes/s)': 21.33
  },
  {
    Composer: 'Beethoven, Ludwig van',
    Title: 'Symphony No.5, Op.67',
    'Year of Composition': 1808,
    'Year of Publication': '1808 (1817)',
    Publisher: 'Manuscript',
    Editor: 'N/A',
    Link: 'https://ks.imslp.info/files/imglnks/usimg/4/4b/IMSLP46080-PMLP01586-Op.67_Manuscript.pdf'
  },
  {
    'Movement of Work': 'i',
    Key: 'C minor',
    'Tempo Indication': 'Allegro con brio',
    Metre: '2/4',
    'Metronome Marking': 'H = 108',
    'Fastest Structural Notes (notes/s)': 7.2,
    'Fastest Stacatto Notes (notes/s)': 7.2
  },
  {
    'Movement of Work': 'ii',
    Key: 'Ab major',
    'Tempo Indication': 'Andante con moto',
    Metre: '3/8',
    'Metronome Marking': 'E = 92',
    'Fastest Structural Notes (notes/s)': 6.13,
    'Fastest Stacatto Notes (notes/s)': 4.6,
    'Fastest Ornamental Notes (notes/s)': 12.26
  },
  {
    'Tempo Indication': 'Piu moto',
    Metre: '3/8',
    'Metronome Marking': 'E = 116',
    'Fastest Structural Notes (notes/s)': 7.73,
    'Fastest Stacatto Notes (notes/s)': 5.8
  },
  {
    'Movement of Work': 'iii',
    Key: 'C minor - major',
    'Tempo Indication': 'Allegro',
    Metre: '3/4',
    'Metronome Marking': 'Dotted H = 96',
    'Fastest Structural Notes (notes/s)': 9.6,
    'Fastest Stacatto Notes (notes/s)': 9.6,
    'Fastest Ornamental Notes (notes/s)': 19.2,
    'Additional Notes': 'Scherzo; fugue in movement'
  },
  {
    'Movement of Work': 'iv',
    Key: 'C major',
    'Tempo Indication': 'Allegro',
    Metre: 'C',
    'Metronome Marking': 'H = 84',
    'Fastest Structural Notes (notes/s)': 11.2,
    'Fastest Stacatto Notes (notes/s)': 5.6,
    'Fastest Ornamental Notes (notes/s)': 11.2
  },
  {
    'Tempo Indication': 'Tempo I',
    Metre: '3/4',
    'Metronome Marking': 'Dotted H = 96',
    'Fastest Structural Notes (notes/s)': 9.6,
    'Fastest Stacatto Notes (notes/s)': 4.8
  },
  {
    'Tempo Indication': 'Allegro',
    Metre: 'C',
    'Metronome Marking': 'H = 84',
    'Fastest Structural Notes (notes/s)': 11.2,
    'Fastest Stacatto Notes (notes/s)': 5.6,
    'Fastest Ornamental Notes (notes/s)': 11.2
  },
  {
    'Tempo Indication': 'Presto',
    Metre: 'C',
    'Metronome Marking': 'W = 112',
    'Fastest Structural Notes (notes/s)': 14.93,
    'Fastest Ornamental Notes (notes/s)': 29.86,
    'Additional Notes': 'Ornamented notes are tremolo'
  },
  {
    Composer: 'Beethoven, Ludwig van',
    Title: 'Symphony No.6, Op.68',
    'Year of Composition': 1808,
    'Year of Publication': '1826 (1817)',
    Publisher: 'Breitkopf and Hartel',
    Editor: 'N/A',
    'Additional Notes': '"Pastoral" Symphony',
    Link: 'https://ks.imslp.info/files/imglnks/usimg/1/1b/IMSLP46101-PMLP01595-Op.68_Score.pdf'
  },
  {
    'Movement of Work': 'i',
    Key: 'F major',
    'Tempo Indication': 'Allegro ma non troppo',
    Metre: '2/4',
    'Metronome Marking': 'H = 66',
    'Fastest Structural Notes (notes/s)': 8.8,
    'Fastest Stacatto Notes (notes/s)': 4.4,
    'Fastest Ornamental Notes (notes/s)': 13.2
  },
  {
    'Movement of Work': 'ii',
    Key: 'Bb major',
    'Tempo Indication': 'Andante molto moto',
    Metre: '12/8',
    'Metronome Marking': 'Dotted Q = 50',
    'Fastest Structural Notes (notes/s)': 10,
    'Fastest Stacatto Notes (notes/s)': 5,
    'Fastest Ornamental Notes (notes/s)': 10
  },
  {
    'Movement of Work': 'iii',
    Key: 'F major',
    'Tempo Indication': 'Allegro',
    Metre: '3/4',
    'Metronome Marking': 'Dotted H = 108',
    'Fastest Structural Notes (notes/s)': 10.8,
    'Fastest Stacatto Notes (notes/s)': 5.4,
    'Fastest Ornamental Notes (notes/s)': 21.6
  },
  {
    'Tempo Indication': 'A tempo allegro',
    Metre: '2/4',
    'Metronome Marking': 'Q = 132',
    'Fastest Structural Notes (notes/s)': 8.8,
    'Fastest Ornamental Notes (notes/s)': 17.6
  },
  {
    'Movement of Work': 'iv',
    Key: 'F minor',
    'Tempo Indication': 'Allegro',
    Metre: 'C',
    'Metronome Marking': 'H = 80',
    'Fastest Structural Notes (notes/s)': 13.33,
    'Fastest Stacatto Notes (notes/s)': 5.33,
    'Fastest Ornamental Notes (notes/s)': 10.66
  },
  {
    'Movement of Work': 'v',
    Key: 'F major',
    'Tempo Indication': 'Allegretto',
    Metre: '6/8',
    'Metronome Marking': 'Dotted Q = 60',
    'Fastest Structural Notes (notes/s)': 9,
    'Fastest Stacatto Notes (notes/s)': 6
  },
  {
    Composer: 'Beethoven, Ludwig van',
    Title: 'Symphony No.7, Op.92',
    'Year of Composition': 1812,
    'Year of Publication': '1816 (1817)',
    Publisher: 'S.A. Steiner & Co.',
    Editor: 'N/A',
    Link: 'https://ks.imslp.info/files/imglnks/usimg/6/66/IMSLP46251-PMLP01600-Op.92.pdf'
  },
  {
    'Movement of Work': 'i',
    Key: 'A major',
    'Tempo Indication': 'Poco sostenuto',
    Metre: 'C',
    'Metronome Marking': 'Q = 69',
    'Fastest Structural Notes (notes/s)': 4.6,
    'Fastest Stacatto Notes (notes/s)': 4.6,
    'Fastest Ornamental Notes (notes/s)': 9.2
  },
  {
    'Tempo Indication': 'Vivace',
    Metre: '6/8',
    'Metronome Marking': 'Dotted Q = 104',
    'Fastest Structural Notes (notes/s)': 15.6,
    'Fastest Stacatto Notes (notes/s)': 10.4,
    'Fastest Ornamental Notes (notes/s)': 20.8
  },
  {
    'Movement of Work': 'ii',
    Key: 'A minor',
    'Tempo Indication': 'Allegretto',
    Metre: '2/4',
    'Metronome Marking': 'Q = 76',
    'Fastest Structural Notes (notes/s)': 5.06,
    'Fastest Stacatto Notes (notes/s)': 5.06,
    'Fastest Ornamental Notes (notes/s)': 5.06
  },
  {
    'Movement of Work': 'iii',
    Key: 'F major',
    'Tempo Indication': 'Presto',
    Metre: '3/4',
    'Metronome Marking': 'Dotted H = 132',
    'Fastest Structural Notes (notes/s)': 6.6,
    'Fastest Stacatto Notes (notes/s)': 6.6,
    'Fastest Ornamental Notes (notes/s)': 26.4
  },
  {
    'Tempo Indication': 'Assai meno presto',
    Metre: '3/4',
    'Metronome Marking': 'Dotted H = 84',
    'Fastest Structural Notes (notes/s)': 8.4,
    'Fastest Stacatto Notes (notes/s)': 4.2,
    'Fastest Ornamental Notes (notes/s)': 16.8
  },
  {
    'Movement of Work': 'iv',
    Key: 'A major',
    'Tempo Indication': 'Allegro con brio',
    Metre: '2/4',
    'Metronome Marking': 'H = 72',
    'Fastest Structural Notes (notes/s)': 9.6,
    'Fastest Ornamental Notes (notes/s)': 14.4
  },
  {
    Composer: 'Beethoven, Ludwig van',
    Title: 'Symphony No. 8, Op.93',
    'Year of Composition': 1812,
    'Year of Publication': '1816 (1817)',
    Publisher: 'S.A. Steiner & Co.',
    Editor: 'N/A',
    Link: 'https://ks.imslp.info/files/imglnks/usimg/0/04/IMSLP46253-PMLP01605-Op.93.pdf'
  },
  {
    'Movement of Work': 'i',
    Key: 'F major',
    'Tempo Indication': 'Allegro vivace e con brio',
    Metre: '3/4',
    'Metronome Marking': 'Dotted H = 69',
    'Fastest Structural Notes (notes/s)': 13.8,
    'Fastest Stacatto Notes (notes/s)': 6.9,
    'Fastest Ornamental Notes (notes/s)': 13.8
  },
  {
    'Movement of Work': 'ii',
    Key: 'Bb major',
    'Tempo Indication': 'Allegretto scherzando',
    Metre: '2/4',
    'Metronome Marking': 'E = 88',
    'Fastest Structural Notes (notes/s)': 11.73,
    'Fastest Stacatto Notes (notes/s)': 5.86,
    'Fastest Ornamental Notes (notes/s)': 11.73,
    'Additional Notes': 'Based on the "Maezel" Canon'
  },
  {
    'Movement of Work': 'iii',
    Key: 'F major',
    'Tempo Indication': 'Tempo di Menuetto',
    Metre: '3/4',
    'Metronome Marking': 'Q = 126',
    'Fastest Structural Notes (notes/s)': 6.3,
    'Fastest Stacatto Notes (notes/s)': 6.3,
    'Fastest Ornamental Notes (notes/s)': 12.6,
    'Additional Notes': 'Minuetto and trio'
  },
  {
    'Movement of Work': 'iv',
    Key: 'F major',
    'Tempo Indication': 'Allegro vivace',
    Metre: 'C',
    'Metronome Marking': 'W = 84',
    'Fastest Structural Notes (notes/s)': 16.8,
    'Fastest Stacatto Notes (notes/s)': 5.6,
    'Fastest Ornamental Notes (notes/s)': 16.8
  }
]


// Turn into a module
export default dataSheet;