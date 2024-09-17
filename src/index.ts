import { keyBy, union } from 'lodash'

export enum ObjectType {
  Undefined = 'undefined',
  Null = 'null',
  Array = 'Array',
  Object = 'Object',
  Function = 'Function',
  String = 'String',
  Number = 'Number',
  Boolean = 'Boolean',
  Date = 'Date',
  RegExp = 'RegExp',
}

export enum Operation {
  REMOVE = 'REMOVE',
  ADD = 'ADD',
  UPDATE = 'UPDATE',
  NORMAL = 'NORMAL',
}

export type TCompareOptions = { nullIsValue?: boolean; embeddedObjKeys: any }
type FunctionKey = (obj: any, shouldReturnKeyName?: boolean) => any

export interface IChange {
  type: Operation
  key: string
  embeddedKey?: string | FunctionKey
  oldValue?: any
  newValue?: any
  changes?: IChange[]
}

export const diff = (
  oldObj: any,
  newObj: any,
  options: TCompareOptions,
): IChange[] => {
  let { embeddedObjKeys } = options
  // Trim leading '.' from keys in embeddedObjKeys
  if (embeddedObjKeys instanceof Map) {
    embeddedObjKeys = new Map(
      Array.from(embeddedObjKeys.entries()).map(([key, value]) => [
        key instanceof RegExp ? key : key.replace(/^\./, ''),
        value,
      ]),
    )
  } else if (embeddedObjKeys) {
    embeddedObjKeys = Object.fromEntries(
      Object.entries(embeddedObjKeys).map(([key, value]) => [
        key.replace(/^\./, ''),
        value,
      ]),
    )
  }

  return compare(oldObj, newObj, [], { ...options, embeddedObjKeys })
}

export const getObjectType = (
  obj: any,
  nullIsValue?: boolean,
): ObjectType | null => {
  if (typeof obj === 'undefined') return ObjectType.Undefined
  if (obj === null) return nullIsValue === false ? ObjectType.Undefined : null

  /** Extract Type in [object Type] */
  const match = Object.prototype.toString.call(obj).match(/^\[object\s(.*)\]$/)
  return match ? (match[1] as ObjectType) : null
}

export const getKey = (path: any[]) => {
  const left = path[path.length - 1]
  return left != null ? left : '$root'
}

export const comparePrimitives = (oldObj: any, newObj: any, path: any) => {
  const oldObjType = getObjectType(oldObj)
  const newObjType = getObjectType(newObj)
  const change = {
    type: Operation.NORMAL,
    key: getKey(path),
    oldValue: oldObj,
    newValue: newObj,
  }
  if (
    oldObjType === ObjectType.Undefined &&
    newObjType !== ObjectType.Undefined
  ) {
    change.type = Operation.ADD
  } else if (
    oldObjType !== ObjectType.Undefined &&
    newObjType === ObjectType.Undefined
  ) {
    change.type = Operation.REMOVE
  } else if (oldObj === newObj) {
    change.type = Operation.NORMAL
  } else {
    change.type = Operation.UPDATE
  }
  return [change]
}

export const compare = (
  oldObj: any,
  newObj: any,
  path: any,
  options: TCompareOptions,
): IChange[] => {
  let changes: any[] = []

  const oldObjType = getObjectType(oldObj, options.nullIsValue)
  const newObjType = getObjectType(newObj, options.nullIsValue)

  if (
    oldObjType !== ObjectType.Undefined &&
    newObjType === ObjectType.Undefined
  ) {
    let diffs: any[] = []
    let uniqKey: string | undefined = undefined
    if (oldObjType === ObjectType.Object) {
      diffs = compareObject(oldObj, {}, path, options)
    }
    if (oldObjType === ObjectType.Array) {
      uniqKey = getObjectKey(options.embeddedObjKeys, path) ?? '$index'
      diffs = compareArray(oldObj, [], path, options)
    }
    changes.push({
      type: Operation.REMOVE,
      key: getKey(path),
      oldValue: diffs?.length ? undefined : oldObj,
      changes: diffs?.length ? diffs[0].changes : undefined,
      embeddedKey: uniqKey,
    })
    return changes
  }

  if (oldObjType === ObjectType.Undefined && newObjType == ObjectType.Object) {
    const diffs = compareObject({}, newObj, path, options)
    changes.push({
      type: Operation.ADD,
      key: getKey(path),
      changes: diffs[0].changes,
    })
    return changes
  }

  if (oldObjType === ObjectType.Undefined && newObjType == ObjectType.Array) {
    const uniqKey = getObjectKey(options.embeddedObjKeys, path) ?? '$index'
    const diffs = compareArray([], newObj, path, options)
    changes.push({
      type: Operation.ADD,
      key: getKey(path),
      embeddedKey: uniqKey,
      changes: diffs[0].changes,
    })
    return changes
  }

  if (oldObjType === ObjectType.Array && newObjType === ObjectType.Object) {
    changes.push({
      type: Operation.UPDATE,
      key: getKey(path),
      oldValue: oldObj,
      newValue: newObj,
    })
    return changes
  }

  switch (oldObjType) {
    case ObjectType.Date: {
      const diffs = comparePrimitives(
        oldObj.getTime(),
        newObj.getTime(),
        path,
      ).map(x => ({
        ...x,
        oldValue: new Date(x.oldValue),
        newValue: new Date(x.newValue),
      }))
      changes = changes.concat(diffs)
      break
    }
    case ObjectType.Object: {
      const diffs = compareObject(oldObj, newObj, path, options)
      changes = changes.concat(diffs)
      break
    }
    case ObjectType.Array:
      changes = changes.concat(compareArray(oldObj, newObj, path, options))
      break
    case ObjectType.Function:
      break
    default:
      changes = changes.concat(comparePrimitives(oldObj, newObj, path))
  }

  return changes
}

export const compareObject = (
  oldObj: any,
  newObj: any,
  path: any,
  options: TCompareOptions,
) => {
  let changes: any[] = []

  const oldObjKeys = Object.keys(oldObj)
  const newObjKeys = Object.keys(newObj)

  const unionKeys = union(oldObjKeys, newObjKeys)

  if (!Array.isArray(unionKeys)) {
    return changes
  }

  for (let k of unionKeys) {
    const newPath = path.concat([k])
    const diffs = compare(oldObj[k], newObj[k], newPath, options)
    if (diffs.length) {
      changes = changes.concat(diffs)
    }
  }

  const keyPath = getKey(path)
  if (keyPath === '$root') return changes

  const isUpdate = changes.some(d => d.type !== Operation.NORMAL)
  return [
    {
      type: isUpdate ? Operation.UPDATE : Operation.NORMAL,
      key: keyPath,
      changes: changes,
    },
  ]
}

export const compareArray = (
  oldObj: any,
  newObj: any,
  path: any,
  options: TCompareOptions,
) => {
  if (getObjectType(newObj, options.nullIsValue) !== ObjectType.Array) {
    return [
      {
        type: Operation.UPDATE,
        key: getKey(path),
        oldValue: oldObj,
        newValue: newObj,
      },
    ]
  }

  const uniqKey = getObjectKey(options.embeddedObjKeys, path) ?? '$index'
  const indexedOldObj = convertArrayToObject(oldObj, uniqKey)
  const indexedNewObj = convertArrayToObject(newObj, uniqKey)

  const diffs = compareObject(indexedOldObj, indexedNewObj, path, options)
  if (diffs.length) {
    return diffs.map(d => ({
      ...d,
      embeddedKey: uniqKey,
    }))
  } else {
    return []
  }
}

export const convertArrayToObject = (arr: any[], uniqKey: any) => {
  let obj: any = {}
  if (uniqKey === '$value') {
    arr.forEach(v => {
      obj[v] = v
    })
  } else if (uniqKey !== '$index') {
    obj = keyBy(arr, uniqKey)
  } else {
    for (let i = 0; i < arr.length; ++i) {
      obj[i] = arr[i]
    }
  }
  return obj
}

export const getObjectKey = (embeddedObjKeys: any, keyPath: any[]) => {
  if (embeddedObjKeys != null) {
    const path = keyPath.join('.')

    if (embeddedObjKeys instanceof Map) {
      for (const [key, value] of embeddedObjKeys.entries()) {
        if (key instanceof RegExp) {
          if (path.match(key)) {
            return value
          }
        } else if (path === key) return value
      }
    }

    const key = embeddedObjKeys[path]
    if (key != null) {
      return key
    }
  }
  return undefined
}
