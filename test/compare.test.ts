import { keyBy } from 'lodash'
import {
  convertArrayToObject,
  diff,
  getKey,
  getObjectKey,
  getObjectType,
} from './../src'

jest.mock('lodash', () => ({
  keyBy: jest.fn(),
  union: jest.fn(),
}))

describe('getOBjectType', () => {
  it('should return "undefined" for undefined', () => {
    expect(getObjectType(undefined)).toBe('undefined')
  })

  it('should return null for null', () => {
    expect(getObjectType(null)).toBeNull()
  })

  it('should return "Object" for plain objects', () => {
    expect(getObjectType({})).toBe('Object')
  })

  it('should return "Array" for arrays', () => {
    expect(getObjectType([])).toBe('Array')
  })

  it('should return "String" for strings', () => {
    expect(getObjectType('hello')).toBe('String')
    expect(getObjectType(new String('hello'))).toBe('String')
  })

  it('should return "Number" for numbers', () => {
    expect(getObjectType(42)).toBe('Number')
    expect(getObjectType(new Number(42))).toBe('Number')
  })

  it('should return "Boolean" for booleans', () => {
    expect(getObjectType(true)).toBe('Boolean')
    expect(getObjectType(false)).toBe('Boolean')
    expect(getObjectType(new Boolean(true))).toBe('Boolean')
  })

  it('should return "Function" for functions', () => {
    expect(getObjectType(() => {})).toBe('Function')
    expect(getObjectType(function () {})).toBe('Function')
  })

  it('should return "Date" for Date objects', () => {
    expect(getObjectType(new Date())).toBe('Date')
  })

  it('should return "RegExp" for regular expressions', () => {
    expect(getObjectType(/abc/)).toBe('RegExp')
    expect(getObjectType(new RegExp('abc'))).toBe('RegExp')
  })

  it('should return "Map" for Map objects', () => {
    expect(getObjectType(new Map())).toBe('Map')
  })

  it('should return "Set" for Set objects', () => {
    expect(getObjectType(new Set())).toBe('Set')
  })

  it('should return "Symbol" for symbols', () => {
    expect(getObjectType(Symbol('test'))).toBe('Symbol')
  })

  it('should return "Error" for an Error object', () => {
    expect(getObjectType(new Error())).toBe('Error')
  })
})

describe('getKey', () => {
  // Test cases for array of strings
  it('should return the last element of the array', () => {
    expect(getKey(['user', 'name'])).toBe('name') // last element is 'name'
    expect(getKey(['path', 'to', 'key'])).toBe('key') // last element is 'key'
    expect(getKey(['abc'])).toBe('abc') // last element is 'abc'
  })

  it('should return "$root" for an empty array', () => {
    expect(getKey([])).toBe('$root') // empty array should return $root
  })

  it('should return "$root" if the last element is null or undefined', () => {
    expect(getKey(['user', null])).toBe('$root') // null in array should return $root
    expect(getKey(['path', undefined])).toBe('$root') // undefined in array should return $root
  })

  it('should handle arrays with special characters correctly', () => {
    expect(getKey(['@path', '!'])).toBe('!') // last element is '!'
    expect(getKey(['123', '456'])).toBe('456') // last element is '456'
  })
})

describe('convertArrayToObject', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should convert array to object with $value key', () => {
    const arr = ['a', 'b', 'c']
    const result = convertArrayToObject(arr, '$value')
    expect(result).toEqual({
      a: 'a',
      b: 'b',
      c: 'c',
    })
  })

  it('should convert array to object with $index key', () => {
    const arr = ['x', 'y', 'z']
    const result = convertArrayToObject(arr, '$index')
    expect(result).toEqual({
      0: 'x',
      1: 'y',
      2: 'z',
    })
  })

  it('should call keyBy with uniqKey for other cases', () => {
    const arr = [
      { id: 1, name: 'John' },
      { id: 2, name: 'Jane' },
    ]
    const uniqKey = 'id'

    // Mock the behavior of lodash.keyBy
    const mockKeyByResult = {
      1: { id: 1, name: 'John' },
      2: { id: 2, name: 'Jane' },
    }
    ;(keyBy as jest.Mock).mockReturnValue(mockKeyByResult)

    const result = convertArrayToObject(arr, uniqKey)

    expect(keyBy).toHaveBeenCalledWith(arr, uniqKey)
    expect(result).toEqual(mockKeyByResult)
  })
})

describe('getObjectKey', () => {
  it('should return undefined if embeddedObjKeys is null or undefined', () => {
    expect(getObjectKey(null, ['a', 'b'])).toBeUndefined()
    expect(getObjectKey(undefined, ['a', 'b'])).toBeUndefined()
  })

  it('should return value if keyPath matches exactly in Map', () => {
    const embeddedObjKeys = new Map([['a.b', 'matchedValue']])
    const keyPath = ['a', 'b']
    const result = getObjectKey(embeddedObjKeys, keyPath)
    expect(result).toBe('matchedValue')
  })

  it('should return value if keyPath matches RegExp in Map', () => {
    const embeddedObjKeys = new Map([[/^a\.b$/, 'regexpMatchedValue']])
    const keyPath = ['a', 'b']
    const result = getObjectKey(embeddedObjKeys, keyPath)
    expect(result).toBe('regexpMatchedValue')
  })

  it('should return value if keyPath matches exactly in object', () => {
    const embeddedObjKeys = {
      'a.b': 'matchedObjectValue',
    }
    const keyPath = ['a', 'b']
    const result = getObjectKey(embeddedObjKeys, keyPath)
    expect(result).toBe('matchedObjectValue')
  })

  it('should return undefined if keyPath does not match in object or Map', () => {
    const embeddedObjKeys = {
      'x.y': 'someValue',
    }
    const keyPath = ['a', 'b']
    const result = getObjectKey(embeddedObjKeys, keyPath)
    expect(result).toBeUndefined()
  })

  it('should return undefined if no match is found in Map', () => {
    const embeddedObjKeys = new Map([['c.d', 'anotherValue']])
    const keyPath = ['a', 'b']
    const result = getObjectKey(embeddedObjKeys, keyPath)
    expect(result).toBeUndefined()
  })
})

describe('diff function', () => {
  it('should generate the correct diff for oldData and newData with specific keys for arrays', () => {
    const oldData = {
      name: 'a',
      planet: 'Tatooine',
      faction: 'Jedi',
      characters: [
        { id: 'LUK', name: 'Luke Skywalker', force: true },
        { id: 'LEI', name: 'Leia Organa', force: true },
      ],
      weapons: ['Lightsaber', 'Blaster'],
    }

    const newData = {
      name: 'a',
      planet: 'Alderaan',
      faction: 'Rebel Alliance',
      characters: [
        { id: 'LUK', name: 'Luke Skywalker', force: true, rank: 'Commander' },
        { id: 'HAN', name: 'Han Solo', force: false },
      ],
      weapons: ['Lightsaber', 'Blaster', 'Bowcaster'],
    }

    const expectedDiffs = [
      {
        type: 'NORMAL',
        key: 'name',
        oldValue: 'a',
        newValue: 'a',
      },
      {
        type: 'UPDATE',
        key: 'planet',
        oldValue: 'Tatooine',
        newValue: 'Alderaan',
      },
      {
        type: 'UPDATE',
        key: 'faction',
        oldValue: 'Jedi',
        newValue: 'Rebel Alliance',
      },
      {
        type: 'UPDATE',
        key: 'characters',
        embeddedKey: 'id',
        changes: [
          {
            type: 'NORMAL',
            key: 'id',
            oldValue: 'LUK',
            newValue: 'LUK',
          },
          {
            type: 'NORMAL',
            key: 'name',
            oldValue: 'Luke Skywalker',
            newValue: 'Luke Skywalker',
          },
          {
            type: 'NORMAL',
            key: 'force',
            oldValue: true,
            newValue: true,
          },
          {
            type: 'ADD',
            key: 'rank',
            newValue: 'Commander',
          },
          {
            type: 'REMOVE',
            key: 'LEI',
            oldValue: {
              id: 'LEI',
              name: 'Leia Organa',
              force: true,
            },
          },
          {
            type: 'ADD',
            key: 'HAN',
            newValue: {
              id: 'HAN',
              name: 'Han Solo',
              force: false,
            },
          },
        ],
      },
      {
        type: 'UPDATE',
        key: 'weapons',
        embeddedKey: '$value',
        changes: [
          {
            type: 'NORMAL',
            key: 'Lightsaber',
            oldValue: 'Lightsaber',
            newValue: 'Lightsaber',
          },
          {
            type: 'NORMAL',
            key: 'Blaster',
            oldValue: 'Blaster',
            newValue: 'Blaster',
          },
          {
            type: 'ADD',
            key: 'Bowcaster',
            newValue: 'Bowcaster',
          },
        ],
      },
    ]

    const diffs = diff(oldData, newData, {
      embeddedObjKeys: { characters: 'id', weapons: '$value' },
    })
    expect(diffs).toMatchSnapshot()
  })
})
