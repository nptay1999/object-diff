# json-object-diff

`json-object-diff` is a TypeScript library designed to calculate and apply differences between JSON objects. One of its key features is the ability to identify elements in arrays using keys rather than indices, making array handling more intuitive.

## Installation

```sh
npm install json-object-diff
```

In TypeScript or ES Modules, you can import the `diff` function like this:

```typescript
import { diff } from 'json-object-diff';
```

## Capabilities

### `diff`

Generates a difference set for JSON objects. When comparing arrays, if a specific embeddedObjKeys is provided, differences are determined by matching elements via this key rather than array indices.

#### Examples using mock data':'

```typescript
import { diff } from 'json-object-diff';

const movieData = {
  title: 'The Galactic Odyssey',
  genre: 'Science Fiction',
  director: 'Nova Wilder',
  releaseYear: 2035,
  characters: [
    {
      id: 'AST',
      name: 'Astra Nova',
      role: 'Captain',
      force: true,
      movies: [
        { title: 'Starfall: A New Dawn', year: 2030 },
        { title: 'Cosmic Storm: Battle for Zyron', year: 2033 }
      ],
      backstory: 'Astra Nova is the fearless leader of the Star Rangers, known for her tactical brilliance and unyielding determination in defending Zyron from intergalactic threats.'
    },
    {
      id: 'KAI',
      name: 'Kai Zenith',
      role: 'Pilot',
      force: false,
      movies: [
        { title: 'Flight of the Phoenix', year: 2032 },
        { title: 'Cosmic Storm: Battle for Zyron', year: 2033 }
      ],
      backstory: 'Kai Zenith, a former rebel turned Star Ranger, is one of the best pilots in the galaxy. His loyalty and flying skills have saved countless lives.'
    }
  ],
  weapons: ['Photon Blaster', 'Energy Sword'],
  boxOffice: {
    budget: 150000000,
  },
  rating: 8.7
};

const newMovieData = {
  title: 'The Galactic Odyssey',
  genre: 'Science Fiction',
  director: 'Nova Wilder',
  releaseYear: 2036,
  characters: [
    {
      id: 'AST',
      name: 'Astra Nova',
      force: true,
      movies: [
        { title: 'Starfall: A New Dawn', year: 2030 },
        { title: 'Cosmic Storm: Battle for Zyron', year: 2033 }
      ],
      backstory: 'Astra Nova is the fearless leader of the Star Rangers, known for her tactical brilliance and unyielding determination in defending Zyron from intergalactic threats.'
    },
    {
      id: 'KAI',
      name: 'Kai Hr. Zenith',
      role: 'Pilot',
      force: false,
      movies: [
        { title: 'Flight of the Phoenix', year: 2032 },
        { title: 'Cosmic Storm: Battle for Zyron', year: 2033 },
        { title: 'the last flight', year: 2034 },
      ],
      backstory: 'Kai Zenith, a former rebel turned Star Ranger, is one of the best pilots in the galaxy. His loyalty and flying skills have saved countless lives.'
    }
  ],
  weapons: ['Photon Blaster', 'Energy Sword'],
  boxOffice: {
    budget: 160000000,
    revenue: 800000000
  },
  rating: 8.6
};

const diffs = diff(movieData, newMovieData, {
  embeddedObjKeys: new Map<string | RegExp, string>([
    ["characters", "id"],
    [/characters\.[^.]+\.movies$/, "title"],
    ["weapons", "$value"],
  ]),
});

const expectedDiffs = [
  {
    "type": "NORMAL",
    "key": "title",
    "oldValue": "The Galactic Odyssey",
    "newValue": "The Galactic Odyssey"
  },
  {
    "type": "NORMAL",
    "key": "genre",
    "oldValue": "Science Fiction",
    "newValue": "Science Fiction"
  },
  {
    "type": "NORMAL",
    "key": "director",
    "oldValue": "Nova Wilder",
    "newValue": "Nova Wilder"
  },
  {
    "type": "UPDATE",
    "key": "releaseYear",
    "oldValue": 2035,
    "newValue": 2036
  },
  {
    "type": "UPDATE",
    "key": "characters",
    "changes": [
      {
        "type": "UPDATE",
        "key": "AST",
        "changes": [
          {
            "type": "NORMAL",
            "key": "id",
            "oldValue": "AST",
            "newValue": "AST"
          },
          {
            "type": "NORMAL",
            "key": "name",
            "oldValue": "Astra Nova",
            "newValue": "Astra Nova"
          },
          {
            "type": "REMOVE",
            "key": "role",
            "oldValue": "Captain"
          },
          {
            "type": "NORMAL",
            "key": "force",
            "oldValue": true,
            "newValue": true
          },
          {
            "type": "NORMAL",
            "key": "movies",
            "changes": [
              {
                "type": "NORMAL",
                "key": "Starfall: A New Dawn",
                "changes": [
                  {
                    "type": "NORMAL",
                    "key": "title",
                    "oldValue": "Starfall: A New Dawn",
                    "newValue": "Starfall: A New Dawn"
                  },
                  {
                    "type": "NORMAL",
                    "key": "year",
                    "oldValue": 2030,
                    "newValue": 2030
                  }
                ]
              },
              {
                "type": "NORMAL",
                "key": "Cosmic Storm: Battle for Zyron",
                "changes": [
                  {
                    "type": "NORMAL",
                    "key": "title",
                    "oldValue": "Cosmic Storm: Battle for Zyron",
                    "newValue": "Cosmic Storm: Battle for Zyron"
                  },
                  {
                    "type": "NORMAL",
                    "key": "year",
                    "oldValue": 2033,
                    "newValue": 2033
                  }
                ]
              }
            ],
            "embeddedKey": "title"
          },
          {
            "type": "NORMAL",
            "key": "backstory",
            "oldValue": "Astra Nova is the fearless leader of the Star Rangers, known for her tactical brilliance and unyielding determination in defending Zyron from intergalactic threats.",
            "newValue": "Astra Nova is the fearless leader of the Star Rangers, known for her tactical brilliance and unyielding determination in defending Zyron from intergalactic threats."
          }
        ]
      },
      {
        "type": "UPDATE",
        "key": "KAI",
        "changes": [
          {
            "type": "NORMAL",
            "key": "id",
            "oldValue": "KAI",
            "newValue": "KAI"
          },
          {
            "type": "UPDATE",
            "key": "name",
            "oldValue": "Kai Zenith",
            "newValue": "Kai Hr. Zenith"
          },
          {
            "type": "NORMAL",
            "key": "role",
            "oldValue": "Pilot",
            "newValue": "Pilot"
          },
          {
            "type": "NORMAL",
            "key": "force",
            "oldValue": false,
            "newValue": false
          },
          {
            "type": "UPDATE",
            "key": "movies",
            "changes": [
              {
                "type": "NORMAL",
                "key": "Flight of the Phoenix",
                "changes": [
                  {
                    "type": "NORMAL",
                    "key": "title",
                    "oldValue": "Flight of the Phoenix",
                    "newValue": "Flight of the Phoenix"
                  },
                  {
                    "type": "NORMAL",
                    "key": "year",
                    "oldValue": 2032,
                    "newValue": 2032
                  }
                ]
              },
              {
                "type": "NORMAL",
                "key": "Cosmic Storm: Battle for Zyron",
                "changes": [
                  {
                    "type": "NORMAL",
                    "key": "title",
                    "oldValue": "Cosmic Storm: Battle for Zyron",
                    "newValue": "Cosmic Storm: Battle for Zyron"
                  },
                  {
                    "type": "NORMAL",
                    "key": "year",
                    "oldValue": 2033,
                    "newValue": 2033
                  }
                ]
              },
              {
                "type": "ADD",
                "key": "the last flight",
                "changes": [
                  {
                    "type": "ADD",
                    "key": "title",
                    "newValue": "the last flight"
                  },
                  {
                    "type": "ADD",
                    "key": "year",
                    "newValue": 2034
                  }
                ]
              }
            ],
            "embeddedKey": "title"
          },
          {
            "type": "NORMAL",
            "key": "backstory",
            "oldValue": "Kai Zenith, a former rebel turned Star Ranger, is one of the best pilots in the galaxy. His loyalty and flying skills have saved countless lives.",
            "newValue": "Kai Zenith, a former rebel turned Star Ranger, is one of the best pilots in the galaxy. His loyalty and flying skills have saved countless lives."
          }
        ]
      }
    ],
    "embeddedKey": "id"
  },
  {
    "type": "NORMAL",
    "key": "weapons",
    "changes": [
      {
        "type": "NORMAL",
        "key": "Photon Blaster",
        "oldValue": "Photon Blaster",
        "newValue": "Photon Blaster"
      },
      {
        "type": "NORMAL",
        "key": "Energy Sword",
        "oldValue": "Energy Sword",
        "newValue": "Energy Sword"
      }
    ],
    "embeddedKey": "$value"
  },
  {
    "type": "UPDATE",
    "key": "boxOffice",
    "changes": [
      {
        "type": "UPDATE",
        "key": "budget",
        "oldValue": 150000000,
        "newValue": 160000000
      },
      {
        "type": "ADD",
        "key": "revenue",
        "newValue": 800000000
      }
    ]
  },
  {
    "type": "UPDATE",
    "key": "rating",
    "oldValue": 8.7,
    "newValue": 8.6
  }
]
```

## Acknowledgments

This project takes inspiration and code from [diff-json](https://www.npmjs.com/package/diff-json) by <viruschidai@gmail.com>.
