import { app, ipcMain, BrowserWindow } from "electron";
import { fileURLToPath } from "node:url";
import path$2 from "node:path";
import require$$0$3 from "events";
import require$$1 from "util";
import require$$0 from "crypto";
import require$$0$1 from "stream";
import require$$1$1 from "timers";
import require$$2 from "buffer";
import require$$0$2 from "fs";
import path$1 from "path";
import { randomUUID } from "node:crypto";
function getDefaultExportFromCjs(x) {
  return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, "default") ? x["default"] : x;
}
var model$4 = {};
var utils = {};
const uniq$2 = (array, iteratee) => {
  if (iteratee) return [...new Map(array.map((x) => [iteratee(x), x])).values()];
  else return [...new Set(array)];
};
const isObject = (arg) => typeof arg === "object" && arg !== null;
const isDate$3 = (d) => isObject(d) && Object.prototype.toString.call(d) === "[object Date]";
const isRegExp$1 = (re) => isObject(re) && Object.prototype.toString.call(re) === "[object RegExp]";
const pick$1 = (object, keys) => {
  return keys.reduce((obj, key) => {
    if (object && Object.prototype.hasOwnProperty.call(object, key)) {
      obj[key] = object[key];
    }
    return obj;
  }, {});
};
const filterIndexNames$1 = (indexNames) => ([k, v]) => !!(typeof v === "string" || typeof v === "number" || typeof v === "boolean" || isDate$3(v) || v === null) && indexNames.includes(k);
utils.uniq = uniq$2;
utils.isDate = isDate$3;
utils.isRegExp = isRegExp$1;
utils.pick = pick$1;
utils.filterIndexNames = filterIndexNames$1;
const { uniq: uniq$1, isDate: isDate$2, isRegExp } = utils;
const checkKey = (k, v) => {
  if (typeof k === "number") k = k.toString();
  if (k[0] === "$" && !(k === "$$date" && typeof v === "number") && !(k === "$$deleted" && v === true) && !(k === "$$indexCreated") && !(k === "$$indexRemoved")) throw new Error("Field names cannot begin with the $ character");
  if (k.indexOf(".") !== -1) throw new Error("Field names cannot contain a .");
};
const checkObject = (obj) => {
  if (Array.isArray(obj)) {
    obj.forEach((o) => {
      checkObject(o);
    });
  }
  if (typeof obj === "object" && obj !== null) {
    for (const k in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, k)) {
        checkKey(k, obj[k]);
        checkObject(obj[k]);
      }
    }
  }
};
const serialize = (obj) => {
  return JSON.stringify(obj, function(k, v) {
    checkKey(k, v);
    if (v === void 0) return void 0;
    if (v === null) return null;
    if (typeof this[k].getTime === "function") return { $$date: this[k].getTime() };
    return v;
  });
};
const deserialize = (rawData) => JSON.parse(rawData, function(k, v) {
  if (k === "$$date") return new Date(v);
  if (typeof v === "string" || typeof v === "number" || typeof v === "boolean" || v === null) return v;
  if (v && v.$$date) return v.$$date;
  return v;
});
function deepCopy(obj, strictKeys) {
  if (typeof obj === "boolean" || typeof obj === "number" || typeof obj === "string" || obj === null || isDate$2(obj)) return obj;
  if (Array.isArray(obj)) return obj.map((o) => deepCopy(o, strictKeys));
  if (typeof obj === "object") {
    const res = {};
    for (const k in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, k) && (!strictKeys || k[0] !== "$" && k.indexOf(".") === -1)) {
        res[k] = deepCopy(obj[k], strictKeys);
      }
    }
    return res;
  }
  return void 0;
}
const isPrimitiveType = (obj) => typeof obj === "boolean" || typeof obj === "number" || typeof obj === "string" || obj === null || isDate$2(obj) || Array.isArray(obj);
const compareNSB = (a, b) => {
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
};
const compareArrays = (a, b) => {
  const minLength = Math.min(a.length, b.length);
  for (let i = 0; i < minLength; i += 1) {
    const comp = compareThings(a[i], b[i]);
    if (comp !== 0) return comp;
  }
  return compareNSB(a.length, b.length);
};
const compareThings = (a, b, _compareStrings) => {
  const compareStrings = _compareStrings || compareNSB;
  if (a === void 0) return b === void 0 ? 0 : -1;
  if (b === void 0) return 1;
  if (a === null) return b === null ? 0 : -1;
  if (b === null) return 1;
  if (typeof a === "number") return typeof b === "number" ? compareNSB(a, b) : -1;
  if (typeof b === "number") return typeof a === "number" ? compareNSB(a, b) : 1;
  if (typeof a === "string") return typeof b === "string" ? compareStrings(a, b) : -1;
  if (typeof b === "string") return typeof a === "string" ? compareStrings(a, b) : 1;
  if (typeof a === "boolean") return typeof b === "boolean" ? compareNSB(a, b) : -1;
  if (typeof b === "boolean") return typeof a === "boolean" ? compareNSB(a, b) : 1;
  if (isDate$2(a)) return isDate$2(b) ? compareNSB(a.getTime(), b.getTime()) : -1;
  if (isDate$2(b)) return isDate$2(a) ? compareNSB(a.getTime(), b.getTime()) : 1;
  if (Array.isArray(a)) return Array.isArray(b) ? compareArrays(a, b) : -1;
  if (Array.isArray(b)) return Array.isArray(a) ? compareArrays(a, b) : 1;
  const aKeys = Object.keys(a).sort();
  const bKeys = Object.keys(b).sort();
  for (let i = 0; i < Math.min(aKeys.length, bKeys.length); i += 1) {
    const comp = compareThings(a[aKeys[i]], b[bKeys[i]]);
    if (comp !== 0) return comp;
  }
  return compareNSB(aKeys.length, bKeys.length);
};
const createModifierFunction = (lastStepModifierFunction, unset = false) => {
  const func = (obj, field, value) => {
    const fieldParts = typeof field === "string" ? field.split(".") : field;
    if (fieldParts.length === 1) lastStepModifierFunction(obj, field, value);
    else {
      if (obj[fieldParts[0]] === void 0) {
        if (unset) return;
        obj[fieldParts[0]] = {};
      }
      func(obj[fieldParts[0]], fieldParts.slice(1), value);
    }
  };
  return func;
};
const $addToSetPartial = (obj, field, value) => {
  if (!Object.prototype.hasOwnProperty.call(obj, field)) {
    obj[field] = [];
  }
  if (!Array.isArray(obj[field])) throw new Error("Can't $addToSet an element on non-array values");
  if (value !== null && typeof value === "object" && value.$each) {
    if (Object.keys(value).length > 1) throw new Error("Can't use another field in conjunction with $each");
    if (!Array.isArray(value.$each)) throw new Error("$each requires an array value");
    value.$each.forEach((v) => {
      $addToSetPartial(obj, field, v);
    });
  } else {
    let addToSet = true;
    obj[field].forEach((v) => {
      if (compareThings(v, value) === 0) addToSet = false;
    });
    if (addToSet) obj[field].push(value);
  }
};
const modifierFunctions = {
  /**
   * Set a field to a new value
   */
  $set: createModifierFunction((obj, field, value) => {
    obj[field] = value;
  }),
  /**
   * Unset a field
   */
  $unset: createModifierFunction((obj, field, value) => {
    delete obj[field];
  }, true),
  /**
   * Updates the value of the field, only if specified field is smaller than the current value of the field
   */
  $min: createModifierFunction((obj, field, value) => {
    if (typeof obj[field] === "undefined") obj[field] = value;
    else if (value < obj[field]) obj[field] = value;
  }),
  /**
   * Updates the value of the field, only if specified field is greater than the current value of the field
   */
  $max: createModifierFunction((obj, field, value) => {
    if (typeof obj[field] === "undefined") obj[field] = value;
    else if (value > obj[field]) obj[field] = value;
  }),
  /**
   * Increment a numeric field's value
   */
  $inc: createModifierFunction((obj, field, value) => {
    if (typeof value !== "number") throw new Error(`${value} must be a number`);
    if (typeof obj[field] !== "number") {
      if (!Object.prototype.hasOwnProperty.call(obj, field)) obj[field] = value;
      else throw new Error("Don't use the $inc modifier on non-number fields");
    } else obj[field] += value;
  }),
  /**
   * Removes all instances of a value from an existing array
   */
  $pull: createModifierFunction((obj, field, value) => {
    if (!Array.isArray(obj[field])) throw new Error("Can't $pull an element from non-array values");
    const arr = obj[field];
    for (let i = arr.length - 1; i >= 0; i -= 1) {
      if (match(arr[i], value)) arr.splice(i, 1);
    }
  }),
  /**
   * Remove the first or last element of an array
   */
  $pop: createModifierFunction((obj, field, value) => {
    if (!Array.isArray(obj[field])) throw new Error("Can't $pop an element from non-array values");
    if (typeof value !== "number") throw new Error(`${value} isn't an integer, can't use it with $pop`);
    if (value === 0) return;
    if (value > 0) obj[field] = obj[field].slice(0, obj[field].length - 1);
    else obj[field] = obj[field].slice(1);
  }),
  /**
   * Add an element to an array field only if it is not already in it
   * No modification if the element is already in the array
   * Note that it doesn't check whether the original array contains duplicates
   */
  $addToSet: createModifierFunction($addToSetPartial),
  /**
   * Push an element to the end of an array field
   * Optional modifier $each instead of value to push several values
   * Optional modifier $slice to slice the resulting array, see https://docs.mongodb.org/manual/reference/operator/update/slice/
   * Difference with MongoDB: if $slice is specified and not $each, we act as if value is an empty array
   */
  $push: createModifierFunction((obj, field, value) => {
    if (!Object.prototype.hasOwnProperty.call(obj, field)) obj[field] = [];
    if (!Array.isArray(obj[field])) throw new Error("Can't $push an element on non-array values");
    if (value !== null && typeof value === "object" && value.$slice && value.$each === void 0) value.$each = [];
    if (value !== null && typeof value === "object" && value.$each) {
      if (Object.keys(value).length >= 3 || Object.keys(value).length === 2 && value.$slice === void 0) throw new Error("Can only use $slice in cunjunction with $each when $push to array");
      if (!Array.isArray(value.$each)) throw new Error("$each requires an array value");
      value.$each.forEach((v) => {
        obj[field].push(v);
      });
      if (value.$slice === void 0 || typeof value.$slice !== "number") return;
      if (value.$slice === 0) obj[field] = [];
      else {
        let start;
        let end;
        const n = obj[field].length;
        if (value.$slice < 0) {
          start = Math.max(0, n + value.$slice);
          end = n;
        } else if (value.$slice > 0) {
          start = 0;
          end = Math.min(n, value.$slice);
        }
        obj[field] = obj[field].slice(start, end);
      }
    } else {
      obj[field].push(value);
    }
  })
};
const modify = (obj, updateQuery) => {
  const keys = Object.keys(updateQuery);
  const firstChars = keys.map((item) => item[0]);
  const dollarFirstChars = firstChars.filter((c) => c === "$");
  let newDoc;
  let modifiers;
  if (keys.indexOf("_id") !== -1 && updateQuery._id !== obj._id) throw new Error("You cannot change a document's _id");
  if (dollarFirstChars.length !== 0 && dollarFirstChars.length !== firstChars.length) throw new Error("You cannot mix modifiers and normal fields");
  if (dollarFirstChars.length === 0) {
    newDoc = deepCopy(updateQuery);
    newDoc._id = obj._id;
  } else {
    modifiers = uniq$1(keys);
    newDoc = deepCopy(obj);
    modifiers.forEach((m) => {
      if (!modifierFunctions[m]) throw new Error(`Unknown modifier ${m}`);
      if (typeof updateQuery[m] !== "object") throw new Error(`Modifier ${m}'s argument must be an object`);
      const keys2 = Object.keys(updateQuery[m]);
      keys2.forEach((k) => {
        modifierFunctions[m](newDoc, k, updateQuery[m][k]);
      });
    });
  }
  checkObject(newDoc);
  if (obj._id !== newDoc._id) throw new Error("You can't change a document's _id");
  return newDoc;
};
const getDotValue = (obj, field) => {
  const fieldParts = typeof field === "string" ? field.split(".") : field;
  if (!obj) return void 0;
  if (fieldParts.length === 0) return obj;
  if (fieldParts.length === 1) return obj[fieldParts[0]];
  if (Array.isArray(obj[fieldParts[0]])) {
    const i = parseInt(fieldParts[1], 10);
    if (typeof i === "number" && !isNaN(i)) return getDotValue(obj[fieldParts[0]][i], fieldParts.slice(2));
    return obj[fieldParts[0]].map((el) => getDotValue(el, fieldParts.slice(1)));
  } else return getDotValue(obj[fieldParts[0]], fieldParts.slice(1));
};
const getDotValues = (obj, fields) => {
  if (!Array.isArray(fields)) throw new Error("fields must be an Array");
  if (fields.length > 1) {
    const key = {};
    for (const field of fields) {
      key[field] = getDotValue(obj, field);
    }
    return key;
  } else return getDotValue(obj, fields[0]);
};
const areThingsEqual = (a, b) => {
  if (a === null || typeof a === "string" || typeof a === "boolean" || typeof a === "number" || b === null || typeof b === "string" || typeof b === "boolean" || typeof b === "number") return a === b;
  if (isDate$2(a) || isDate$2(b)) return isDate$2(a) && isDate$2(b) && a.getTime() === b.getTime();
  if (!(Array.isArray(a) && Array.isArray(b)) && (Array.isArray(a) || Array.isArray(b)) || a === void 0 || b === void 0) return false;
  let aKeys;
  let bKeys;
  try {
    aKeys = Object.keys(a);
    bKeys = Object.keys(b);
  } catch (e) {
    return false;
  }
  if (aKeys.length !== bKeys.length) return false;
  for (const el of aKeys) {
    if (bKeys.indexOf(el) === -1) return false;
    if (!areThingsEqual(a[el], b[el])) return false;
  }
  return true;
};
const areComparable = (a, b) => {
  if (typeof a !== "string" && typeof a !== "number" && !isDate$2(a) && typeof b !== "string" && typeof b !== "number" && !isDate$2(b)) return false;
  if (typeof a !== typeof b) return false;
  return true;
};
const comparisonFunctions = {
  /** Lower than */
  $lt: (a, b) => areComparable(a, b) && a < b,
  /** Lower than or equals */
  $lte: (a, b) => areComparable(a, b) && a <= b,
  /** Greater than */
  $gt: (a, b) => areComparable(a, b) && a > b,
  /** Greater than or equals */
  $gte: (a, b) => areComparable(a, b) && a >= b,
  /** Does not equal */
  $ne: (a, b) => a === void 0 || !areThingsEqual(a, b),
  /** Is in Array */
  $in: (a, b) => {
    if (!Array.isArray(b)) throw new Error("$in operator called with a non-array");
    for (const el of b) {
      if (areThingsEqual(a, el)) return true;
    }
    return false;
  },
  /** Is not in Array */
  $nin: (a, b) => {
    if (!Array.isArray(b)) throw new Error("$nin operator called with a non-array");
    return !comparisonFunctions.$in(a, b);
  },
  /** Matches Regexp */
  $regex: (a, b) => {
    if (!isRegExp(b)) throw new Error("$regex operator called with non regular expression");
    if (typeof a !== "string") return false;
    else return b.test(a);
  },
  /** Returns true if field exists */
  $exists: (a, b) => {
    if (b || b === "") b = true;
    else b = false;
    if (a === void 0) return !b;
    else return b;
  },
  /** Specific to Arrays, returns true if a length equals b */
  $size: (a, b) => {
    if (!Array.isArray(a)) return false;
    if (b % 1 !== 0) throw new Error("$size operator called without an integer");
    return a.length === b;
  },
  /** Specific to Arrays, returns true if some elements of a match the query b */
  $elemMatch: (a, b) => {
    if (!Array.isArray(a)) return false;
    return a.some((el) => match(el, b));
  }
};
const arrayComparisonFunctions = { $size: true, $elemMatch: true };
const logicalOperators = {
  /**
   * Match any of the subqueries
   * @param {document} obj
   * @param {query[]} query
   * @return {boolean}
   */
  $or: (obj, query) => {
    if (!Array.isArray(query)) throw new Error("$or operator used without an array");
    for (let i = 0; i < query.length; i += 1) {
      if (match(obj, query[i])) return true;
    }
    return false;
  },
  /**
   * Match all of the subqueries
   * @param {document} obj
   * @param {query[]} query
   * @return {boolean}
   */
  $and: (obj, query) => {
    if (!Array.isArray(query)) throw new Error("$and operator used without an array");
    for (let i = 0; i < query.length; i += 1) {
      if (!match(obj, query[i])) return false;
    }
    return true;
  },
  /**
   * Inverted match of the query
   * @param {document} obj
   * @param {query} query
   * @return {boolean}
   */
  $not: (obj, query) => !match(obj, query),
  /**
   * @callback whereCallback
   * @param {document} obj
   * @return {boolean}
   */
  /**
   * Use a function to match
   * @param {document} obj
   * @param {whereCallback} fn
   * @return {boolean}
   */
  $where: (obj, fn) => {
    if (typeof fn !== "function") throw new Error("$where operator used without a function");
    const result = fn.call(obj);
    if (typeof result !== "boolean") throw new Error("$where function must return boolean");
    return result;
  }
};
const match = (obj, query) => {
  if (isPrimitiveType(obj) || isPrimitiveType(query)) return matchQueryPart({ needAKey: obj }, "needAKey", query);
  for (const queryKey in query) {
    if (Object.prototype.hasOwnProperty.call(query, queryKey)) {
      const queryValue = query[queryKey];
      if (queryKey[0] === "$") {
        if (!logicalOperators[queryKey]) throw new Error(`Unknown logical operator ${queryKey}`);
        if (!logicalOperators[queryKey](obj, queryValue)) return false;
      } else if (!matchQueryPart(obj, queryKey, queryValue)) return false;
    }
  }
  return true;
};
function matchQueryPart(obj, queryKey, queryValue, treatObjAsValue) {
  const objValue = getDotValue(obj, queryKey);
  if (Array.isArray(objValue) && !treatObjAsValue) {
    if (Array.isArray(queryValue)) return matchQueryPart(obj, queryKey, queryValue, true);
    if (queryValue !== null && typeof queryValue === "object" && !isRegExp(queryValue)) {
      for (const key in queryValue) {
        if (Object.prototype.hasOwnProperty.call(queryValue, key) && arrayComparisonFunctions[key]) {
          return matchQueryPart(obj, queryKey, queryValue, true);
        }
      }
    }
    for (const el of objValue) {
      if (matchQueryPart({ k: el }, "k", queryValue)) return true;
    }
    return false;
  }
  if (queryValue !== null && typeof queryValue === "object" && !isRegExp(queryValue) && !Array.isArray(queryValue)) {
    const keys = Object.keys(queryValue);
    const firstChars = keys.map((item) => item[0]);
    const dollarFirstChars = firstChars.filter((c) => c === "$");
    if (dollarFirstChars.length !== 0 && dollarFirstChars.length !== firstChars.length) throw new Error("You cannot mix operators and normal fields");
    if (dollarFirstChars.length > 0) {
      for (const key of keys) {
        if (!comparisonFunctions[key]) throw new Error(`Unknown comparison function ${key}`);
        if (!comparisonFunctions[key](objValue, queryValue[key])) return false;
      }
      return true;
    }
  }
  if (isRegExp(queryValue)) return comparisonFunctions.$regex(objValue, queryValue);
  return areThingsEqual(objValue, queryValue);
}
model$4.serialize = serialize;
model$4.deserialize = deserialize;
model$4.deepCopy = deepCopy;
model$4.checkObject = checkObject;
model$4.isPrimitiveType = isPrimitiveType;
model$4.modify = modify;
model$4.getDotValue = getDotValue;
model$4.getDotValues = getDotValues;
model$4.match = match;
model$4.areThingsEqual = areThingsEqual;
model$4.compareThings = compareThings;
const model$3 = model$4;
const { callbackify: callbackify$1 } = require$$1;
let Cursor$1 = class Cursor {
  /**
   * Create a new cursor for this collection.
   * @param {Datastore} db - The datastore this cursor is bound to
   * @param {query} query - The query this cursor will operate on
   * @param {Cursor~mapFn} [mapFn] - Handler to be executed after cursor has found the results and before the callback passed to find/findOne/update/remove
   */
  constructor(db, query, mapFn) {
    this.db = db;
    this.query = query || {};
    if (mapFn) this.mapFn = mapFn;
    this._limit = void 0;
    this._skip = void 0;
    this._sort = void 0;
    this._projection = void 0;
  }
  /**
   * Set a limit to the number of results for the given Cursor.
   * @param {Number} limit
   * @return {Cursor} the same instance of Cursor, (useful for chaining).
   */
  limit(limit) {
    this._limit = limit;
    return this;
  }
  /**
   * Skip a number of results for the given Cursor.
   * @param {Number} skip
   * @return {Cursor} the same instance of Cursor, (useful for chaining).
   */
  skip(skip) {
    this._skip = skip;
    return this;
  }
  /**
   * Sort results of the query for the given Cursor.
   * @param {Object.<string, number>} sortQuery - sortQuery is { field: order }, field can use the dot-notation, order is 1 for ascending and -1 for descending
   * @return {Cursor} the same instance of Cursor, (useful for chaining).
   */
  sort(sortQuery) {
    this._sort = sortQuery;
    return this;
  }
  /**
   * Add the use of a projection to the given Cursor.
   * @param {Object.<string, number>} projection - MongoDB-style projection. {} means take all fields. Then it's { key1: 1, key2: 1 } to take only key1 and key2
   * { key1: 0, key2: 0 } to omit only key1 and key2. Except _id, you can't mix takes and omits.
   * @return {Cursor} the same instance of Cursor, (useful for chaining).
   */
  projection(projection) {
    this._projection = projection;
    return this;
  }
  /**
   * Apply the projection.
   *
   * This is an internal function. You should use {@link Cursor#execAsync} or {@link Cursor#exec}.
   * @param {document[]} candidates
   * @return {document[]}
   * @private
   */
  _project(candidates) {
    const res = [];
    let action;
    if (this._projection === void 0 || Object.keys(this._projection).length === 0) {
      return candidates;
    }
    const keepId = this._projection._id !== 0;
    const { _id, ...rest } = this._projection;
    this._projection = rest;
    const keys = Object.keys(this._projection);
    keys.forEach((k) => {
      if (action !== void 0 && this._projection[k] !== action) throw new Error("Can't both keep and omit fields except for _id");
      action = this._projection[k];
    });
    candidates.forEach((candidate) => {
      let toPush;
      if (action === 1) {
        toPush = { $set: {} };
        keys.forEach((k) => {
          toPush.$set[k] = model$3.getDotValue(candidate, k);
          if (toPush.$set[k] === void 0) delete toPush.$set[k];
        });
        toPush = model$3.modify({}, toPush);
      } else {
        toPush = { $unset: {} };
        keys.forEach((k) => {
          toPush.$unset[k] = true;
        });
        toPush = model$3.modify(candidate, toPush);
      }
      if (keepId) toPush._id = candidate._id;
      else delete toPush._id;
      res.push(toPush);
    });
    return res;
  }
  /**
   * Get all matching elements
   * Will return pointers to matched elements (shallow copies), returning full copies is the role of find or findOne
   * This is an internal function, use execAsync which uses the executor
   * @return {document[]|Promise<*>}
   * @private
   */
  async _execAsync() {
    let res = [];
    let added = 0;
    let skipped = 0;
    const candidates = await this.db._getCandidatesAsync(this.query);
    for (const candidate of candidates) {
      if (model$3.match(candidate, this.query)) {
        if (!this._sort) {
          if (this._skip && this._skip > skipped) skipped += 1;
          else {
            res.push(candidate);
            added += 1;
            if (this._limit && this._limit <= added) break;
          }
        } else res.push(candidate);
      }
    }
    if (this._sort) {
      const criteria = Object.entries(this._sort).map(([key, direction]) => ({ key, direction }));
      res.sort((a, b) => {
        for (const criterion of criteria) {
          const compare = criterion.direction * model$3.compareThings(model$3.getDotValue(a, criterion.key), model$3.getDotValue(b, criterion.key), this.db.compareStrings);
          if (compare !== 0) return compare;
        }
        return 0;
      });
      const limit = this._limit || res.length;
      const skip = this._skip || 0;
      res = res.slice(skip, skip + limit);
    }
    res = this._project(res);
    if (this.mapFn) return this.mapFn(res);
    return res;
  }
  /**
   * @callback Cursor~execCallback
   * @param {Error} err
   * @param {document[]|*} res If a mapFn was given to the Cursor, then the type of this parameter is the one returned by the mapFn.
   */
  /**
   * Callback version of {@link Cursor#exec}.
   * @param {Cursor~execCallback} _callback
   * @see Cursor#execAsync
   */
  exec(_callback) {
    callbackify$1(() => this.execAsync())(_callback);
  }
  /**
   * Get all matching elements.
   * Will return pointers to matched elements (shallow copies), returning full copies is the role of {@link Datastore#findAsync} or {@link Datastore#findOneAsync}.
   * @return {Promise<document[]|*>}
   * @async
   */
  execAsync() {
    return this.db.executor.pushAsync(() => this._execAsync());
  }
  then(onFulfilled, onRejected) {
    return this.execAsync().then(onFulfilled, onRejected);
  }
  catch(onRejected) {
    return this.execAsync().catch(onRejected);
  }
  finally(onFinally) {
    return this.execAsync().finally(onFinally);
  }
};
var cursor = Cursor$1;
var customUtils$4 = {};
const crypto = require$$0;
const uid = (len) => crypto.randomBytes(Math.ceil(Math.max(8, len * 2))).toString("base64").replace(/[+/]/g, "").slice(0, len);
customUtils$4.uid = uid;
let Waterfall$2 = class Waterfall {
  /**
   * Instantiate a new Waterfall.
   */
  constructor() {
    this.guardian = Promise.resolve();
  }
  /**
   *
   * @param {AsyncFunction} func
   * @return {AsyncFunction}
   */
  waterfall(func) {
    return (...args) => {
      this.guardian = this.guardian.then(() => {
        return func(...args).then((result) => ({ error: false, result }), (result) => ({ error: true, result }));
      });
      return this.guardian.then(({ error, result }) => {
        if (error) return Promise.reject(result);
        else return Promise.resolve(result);
      });
    };
  }
  /**
   * Shorthand for chaining a promise to the Waterfall
   * @param {Promise} promise
   * @return {Promise}
   */
  chain(promise) {
    return this.waterfall(() => promise)();
  }
};
var waterfall = Waterfall$2;
const Waterfall$1 = waterfall;
let Executor$1 = class Executor {
  /**
   * Instantiates a new Executor.
   */
  constructor() {
    this.ready = false;
    this.queue = new Waterfall$1();
    this.buffer = null;
    this._triggerBuffer = null;
    this.resetBuffer();
  }
  /**
   * If executor is ready, queue task (and process it immediately if executor was idle)
   * If not, buffer task for later processing
   * @param {AsyncFunction} task Function to execute
   * @param {boolean} [forceQueuing = false] Optional (defaults to false) force executor to queue task even if it is not ready
   * @return {Promise<*>}
   * @async
   * @see Executor#push
   */
  pushAsync(task, forceQueuing = false) {
    if (this.ready || forceQueuing) return this.queue.waterfall(task)();
    else return this.buffer.waterfall(task)();
  }
  /**
   * Queue all tasks in buffer (in the same order they came in)
   * Automatically sets executor as ready
   */
  processBuffer() {
    this.ready = true;
    this._triggerBuffer();
    this.queue.waterfall(() => this.buffer.guardian);
  }
  /**
   * Removes all tasks queued up in the buffer
   */
  resetBuffer() {
    this.buffer = new Waterfall$1();
    this.buffer.chain(new Promise((resolve) => {
      this._triggerBuffer = resolve;
    }));
    if (this.ready) this._triggerBuffer();
  }
};
var executor = Executor$1;
var binarySearchTree = {};
var customUtils$3 = {};
const getRandomArray = (n) => {
  if (n === 0) return [];
  if (n === 1) return [0];
  const res = getRandomArray(n - 1);
  const next = Math.floor(Math.random() * n);
  res.splice(next, 0, n - 1);
  return res;
};
customUtils$3.getRandomArray = getRandomArray;
const defaultCompareKeysFunction = (a, b) => {
  if (a < b) return -1;
  if (a > b) return 1;
  if (a === b) return 0;
  const err = new Error("Couldn't compare elements");
  err.a = a;
  err.b = b;
  throw err;
};
customUtils$3.defaultCompareKeysFunction = defaultCompareKeysFunction;
const defaultCheckValueEquality = (a, b) => a === b;
customUtils$3.defaultCheckValueEquality = defaultCheckValueEquality;
const customUtils$2 = customUtils$3;
let BinarySearchTree$2 = class BinarySearchTree {
  /**
   * Constructor
   * @param {Object} options Optional
   * @param {Boolean}  options.unique Whether to enforce a 'unique' constraint on the key or not
   * @param {Key}      options.key Initialize this BST's key with key
   * @param {Value}    options.value Initialize this BST's data with [value]
   * @param {Function} options.compareKeys Initialize this BST's compareKeys
   */
  constructor(options) {
    options = options || {};
    this.left = null;
    this.right = null;
    this.parent = options.parent !== void 0 ? options.parent : null;
    if (Object.prototype.hasOwnProperty.call(options, "key")) {
      this.key = options.key;
    }
    this.data = Object.prototype.hasOwnProperty.call(options, "value") ? [options.value] : [];
    this.unique = options.unique || false;
    this.compareKeys = options.compareKeys || customUtils$2.defaultCompareKeysFunction;
    this.checkValueEquality = options.checkValueEquality || customUtils$2.defaultCheckValueEquality;
  }
  /**
   * Get the descendant with max key
   */
  getMaxKeyDescendant() {
    if (this.right) return this.right.getMaxKeyDescendant();
    else return this;
  }
  /**
   * Get the maximum key
   */
  getMaxKey() {
    return this.getMaxKeyDescendant().key;
  }
  /**
   * Get the descendant with min key
   */
  getMinKeyDescendant() {
    if (this.left) return this.left.getMinKeyDescendant();
    else return this;
  }
  /**
   * Get the minimum key
   */
  getMinKey() {
    return this.getMinKeyDescendant().key;
  }
  /**
   * Check that all nodes (incl. leaves) fullfil condition given by fn
   * test is a function passed every (key, data) and which throws if the condition is not met
   */
  checkAllNodesFullfillCondition(test) {
    if (!Object.prototype.hasOwnProperty.call(this, "key")) return;
    test(this.key, this.data);
    if (this.left) this.left.checkAllNodesFullfillCondition(test);
    if (this.right) this.right.checkAllNodesFullfillCondition(test);
  }
  /**
   * Check that the core BST properties on node ordering are verified
   * Throw if they aren't
   */
  checkNodeOrdering() {
    if (!Object.prototype.hasOwnProperty.call(this, "key")) return;
    if (this.left) {
      this.left.checkAllNodesFullfillCondition((k) => {
        if (this.compareKeys(k, this.key) >= 0) throw new Error(`Tree with root ${this.key} is not a binary search tree`);
      });
      this.left.checkNodeOrdering();
    }
    if (this.right) {
      this.right.checkAllNodesFullfillCondition((k) => {
        if (this.compareKeys(k, this.key) <= 0) throw new Error(`Tree with root ${this.key} is not a binary search tree`);
      });
      this.right.checkNodeOrdering();
    }
  }
  /**
   * Check that all pointers are coherent in this tree
   */
  checkInternalPointers() {
    if (this.left) {
      if (this.left.parent !== this) throw new Error(`Parent pointer broken for key ${this.key}`);
      this.left.checkInternalPointers();
    }
    if (this.right) {
      if (this.right.parent !== this) throw new Error(`Parent pointer broken for key ${this.key}`);
      this.right.checkInternalPointers();
    }
  }
  /**
   * Check that a tree is a BST as defined here (node ordering and pointer references)
   */
  checkIsBST() {
    this.checkNodeOrdering();
    this.checkInternalPointers();
    if (this.parent) throw new Error("The root shouldn't have a parent");
  }
  /**
   * Get number of keys inserted
   */
  getNumberOfKeys() {
    let res;
    if (!Object.prototype.hasOwnProperty.call(this, "key")) return 0;
    res = 1;
    if (this.left) res += this.left.getNumberOfKeys();
    if (this.right) res += this.right.getNumberOfKeys();
    return res;
  }
  /**
   * Create a BST similar (i.e. same options except for key and value) to the current one
   * Use the same constructor (i.e. BinarySearchTree, AVLTree etc)
   * @param {Object} options see constructor
   */
  createSimilar(options) {
    options = options || {};
    options.unique = this.unique;
    options.compareKeys = this.compareKeys;
    options.checkValueEquality = this.checkValueEquality;
    return new this.constructor(options);
  }
  /**
   * Create the left child of this BST and return it
   */
  createLeftChild(options) {
    const leftChild = this.createSimilar(options);
    leftChild.parent = this;
    this.left = leftChild;
    return leftChild;
  }
  /**
   * Create the right child of this BST and return it
   */
  createRightChild(options) {
    const rightChild = this.createSimilar(options);
    rightChild.parent = this;
    this.right = rightChild;
    return rightChild;
  }
  /**
   * Insert a new element
   */
  insert(key, value) {
    if (!Object.prototype.hasOwnProperty.call(this, "key")) {
      this.key = key;
      this.data.push(value);
      return;
    }
    if (this.compareKeys(this.key, key) === 0) {
      if (this.unique) {
        const err = new Error(`Can't insert key ${JSON.stringify(key)}, it violates the unique constraint`);
        err.key = key;
        err.errorType = "uniqueViolated";
        throw err;
      } else this.data.push(value);
      return;
    }
    if (this.compareKeys(key, this.key) < 0) {
      if (this.left) this.left.insert(key, value);
      else this.createLeftChild({ key, value });
    } else {
      if (this.right) this.right.insert(key, value);
      else this.createRightChild({ key, value });
    }
  }
  /**
   * Search for all data corresponding to a key
   */
  search(key) {
    if (!Object.prototype.hasOwnProperty.call(this, "key")) return [];
    if (this.compareKeys(this.key, key) === 0) return this.data;
    if (this.compareKeys(key, this.key) < 0) {
      if (this.left) return this.left.search(key);
      else return [];
    } else {
      if (this.right) return this.right.search(key);
      else return [];
    }
  }
  /**
   * Return a function that tells whether a given key matches a lower bound
   */
  getLowerBoundMatcher(query) {
    if (!Object.prototype.hasOwnProperty.call(query, "$gt") && !Object.prototype.hasOwnProperty.call(query, "$gte")) return () => true;
    if (Object.prototype.hasOwnProperty.call(query, "$gt") && Object.prototype.hasOwnProperty.call(query, "$gte")) {
      if (this.compareKeys(query.$gte, query.$gt) === 0) return (key) => this.compareKeys(key, query.$gt) > 0;
      if (this.compareKeys(query.$gte, query.$gt) > 0) return (key) => this.compareKeys(key, query.$gte) >= 0;
      else return (key) => this.compareKeys(key, query.$gt) > 0;
    }
    if (Object.prototype.hasOwnProperty.call(query, "$gt")) return (key) => this.compareKeys(key, query.$gt) > 0;
    else return (key) => this.compareKeys(key, query.$gte) >= 0;
  }
  /**
   * Return a function that tells whether a given key matches an upper bound
   */
  getUpperBoundMatcher(query) {
    if (!Object.prototype.hasOwnProperty.call(query, "$lt") && !Object.prototype.hasOwnProperty.call(query, "$lte")) return () => true;
    if (Object.prototype.hasOwnProperty.call(query, "$lt") && Object.prototype.hasOwnProperty.call(query, "$lte")) {
      if (this.compareKeys(query.$lte, query.$lt) === 0) return (key) => this.compareKeys(key, query.$lt) < 0;
      if (this.compareKeys(query.$lte, query.$lt) < 0) return (key) => this.compareKeys(key, query.$lte) <= 0;
      else return (key) => this.compareKeys(key, query.$lt) < 0;
    }
    if (Object.prototype.hasOwnProperty.call(query, "$lt")) return (key) => this.compareKeys(key, query.$lt) < 0;
    else return (key) => this.compareKeys(key, query.$lte) <= 0;
  }
  /**
   * Get all data for a key between bounds
   * Return it in key order
   * @param {Object} query Mongo-style query where keys are $lt, $lte, $gt or $gte (other keys are not considered)
   * @param {Functions} lbm/ubm matching functions calculated at the first recursive step
   */
  betweenBounds(query, lbm, ubm) {
    const res = [];
    if (!Object.prototype.hasOwnProperty.call(this, "key")) return [];
    lbm = lbm || this.getLowerBoundMatcher(query);
    ubm = ubm || this.getUpperBoundMatcher(query);
    if (lbm(this.key) && this.left) append(res, this.left.betweenBounds(query, lbm, ubm));
    if (lbm(this.key) && ubm(this.key)) append(res, this.data);
    if (ubm(this.key) && this.right) append(res, this.right.betweenBounds(query, lbm, ubm));
    return res;
  }
  /**
   * Delete the current node if it is a leaf
   * Return true if it was deleted
   */
  deleteIfLeaf() {
    if (this.left || this.right) return false;
    if (!this.parent) {
      delete this.key;
      this.data = [];
      return true;
    }
    if (this.parent.left === this) this.parent.left = null;
    else this.parent.right = null;
    return true;
  }
  /**
   * Delete the current node if it has only one child
   * Return true if it was deleted
   */
  deleteIfOnlyOneChild() {
    let child;
    if (this.left && !this.right) child = this.left;
    if (!this.left && this.right) child = this.right;
    if (!child) return false;
    if (!this.parent) {
      this.key = child.key;
      this.data = child.data;
      this.left = null;
      if (child.left) {
        this.left = child.left;
        child.left.parent = this;
      }
      this.right = null;
      if (child.right) {
        this.right = child.right;
        child.right.parent = this;
      }
      return true;
    }
    if (this.parent.left === this) {
      this.parent.left = child;
      child.parent = this.parent;
    } else {
      this.parent.right = child;
      child.parent = this.parent;
    }
    return true;
  }
  /**
   * Delete a key or just a value
   * @param {Key} key
   * @param {Value} value Optional. If not set, the whole key is deleted. If set, only this value is deleted
   */
  delete(key, value) {
    const newData = [];
    let replaceWith;
    if (!Object.prototype.hasOwnProperty.call(this, "key")) return;
    if (this.compareKeys(key, this.key) < 0) {
      if (this.left) this.left.delete(key, value);
      return;
    }
    if (this.compareKeys(key, this.key) > 0) {
      if (this.right) this.right.delete(key, value);
      return;
    }
    if (!this.compareKeys(key, this.key) === 0) return;
    if (this.data.length > 1 && value !== void 0) {
      this.data.forEach((d) => {
        if (!this.checkValueEquality(d, value)) newData.push(d);
      });
      this.data = newData;
      return;
    }
    if (this.deleteIfLeaf()) return;
    if (this.deleteIfOnlyOneChild()) return;
    if (Math.random() >= 0.5) {
      replaceWith = this.left.getMaxKeyDescendant();
      this.key = replaceWith.key;
      this.data = replaceWith.data;
      if (this === replaceWith.parent) {
        this.left = replaceWith.left;
        if (replaceWith.left) replaceWith.left.parent = replaceWith.parent;
      } else {
        replaceWith.parent.right = replaceWith.left;
        if (replaceWith.left) replaceWith.left.parent = replaceWith.parent;
      }
    } else {
      replaceWith = this.right.getMinKeyDescendant();
      this.key = replaceWith.key;
      this.data = replaceWith.data;
      if (this === replaceWith.parent) {
        this.right = replaceWith.right;
        if (replaceWith.right) replaceWith.right.parent = replaceWith.parent;
      } else {
        replaceWith.parent.left = replaceWith.right;
        if (replaceWith.right) replaceWith.right.parent = replaceWith.parent;
      }
    }
  }
  /**
   * Execute a function on every node of the tree, in key order
   * @param {Function} fn Signature: node. Most useful will probably be node.key and node.data
   */
  executeOnEveryNode(fn) {
    if (this.left) this.left.executeOnEveryNode(fn);
    fn(this);
    if (this.right) this.right.executeOnEveryNode(fn);
  }
  /**
   * Pretty print a tree
   * @param {Boolean} printData To print the nodes' data along with the key
   */
  prettyPrint(printData, spacing) {
    spacing = spacing || "";
    console.log(`${spacing}* ${this.key}`);
    if (printData) console.log(`${spacing}* ${this.data}`);
    if (!this.left && !this.right) return;
    if (this.left) this.left.prettyPrint(printData, `${spacing}  `);
    else console.log(`${spacing}  *`);
    if (this.right) this.right.prettyPrint(printData, `${spacing}  `);
    else console.log(`${spacing}  *`);
  }
};
function append(array, toAppend) {
  for (let i = 0; i < toAppend.length; i += 1) {
    array.push(toAppend[i]);
  }
}
var bst = BinarySearchTree$2;
const BinarySearchTree$1 = bst;
const customUtils$1 = customUtils$3;
class AVLTree {
  /**
   * Constructor
   * We can't use a direct pointer to the root node (as in the simple binary search tree)
   * as the root will change during tree rotations
   * @param {Boolean}  options.unique Whether to enforce a 'unique' constraint on the key or not
   * @param {Function} options.compareKeys Initialize this BST's compareKeys
   */
  constructor(options) {
    this.tree = new _AVLTree(options);
  }
  checkIsAVLT() {
    this.tree.checkIsAVLT();
  }
  // Insert in the internal tree, update the pointer to the root if needed
  insert(key, value) {
    const newTree = this.tree.insert(key, value);
    if (newTree) {
      this.tree = newTree;
    }
  }
  // Delete a value
  delete(key, value) {
    const newTree = this.tree.delete(key, value);
    if (newTree) {
      this.tree = newTree;
    }
  }
}
class _AVLTree extends BinarySearchTree$1 {
  /**
   * Constructor of the internal AVLTree
   * @param {Object} options Optional
   * @param {Boolean}  options.unique Whether to enforce a 'unique' constraint on the key or not
   * @param {Key}      options.key Initialize this BST's key with key
   * @param {Value}    options.value Initialize this BST's data with [value]
   * @param {Function} options.compareKeys Initialize this BST's compareKeys
   */
  constructor(options) {
    super();
    options = options || {};
    this.left = null;
    this.right = null;
    this.parent = options.parent !== void 0 ? options.parent : null;
    if (Object.prototype.hasOwnProperty.call(options, "key")) this.key = options.key;
    this.data = Object.prototype.hasOwnProperty.call(options, "value") ? [options.value] : [];
    this.unique = options.unique || false;
    this.compareKeys = options.compareKeys || customUtils$1.defaultCompareKeysFunction;
    this.checkValueEquality = options.checkValueEquality || customUtils$1.defaultCheckValueEquality;
  }
  /**
   * Check the recorded height is correct for every node
   * Throws if one height doesn't match
   */
  checkHeightCorrect() {
    if (!Object.prototype.hasOwnProperty.call(this, "key")) {
      return;
    }
    if (this.left && this.left.height === void 0) {
      throw new Error("Undefined height for node " + this.left.key);
    }
    if (this.right && this.right.height === void 0) {
      throw new Error("Undefined height for node " + this.right.key);
    }
    if (this.height === void 0) {
      throw new Error("Undefined height for node " + this.key);
    }
    const leftH = this.left ? this.left.height : 0;
    const rightH = this.right ? this.right.height : 0;
    if (this.height !== 1 + Math.max(leftH, rightH)) {
      throw new Error("Height constraint failed for node " + this.key);
    }
    if (this.left) {
      this.left.checkHeightCorrect();
    }
    if (this.right) {
      this.right.checkHeightCorrect();
    }
  }
  /**
   * Return the balance factor
   */
  balanceFactor() {
    const leftH = this.left ? this.left.height : 0;
    const rightH = this.right ? this.right.height : 0;
    return leftH - rightH;
  }
  /**
   * Check that the balance factors are all between -1 and 1
   */
  checkBalanceFactors() {
    if (Math.abs(this.balanceFactor()) > 1) {
      throw new Error("Tree is unbalanced at node " + this.key);
    }
    if (this.left) {
      this.left.checkBalanceFactors();
    }
    if (this.right) {
      this.right.checkBalanceFactors();
    }
  }
  /**
   * When checking if the BST conditions are met, also check that the heights are correct
   * and the tree is balanced
   */
  checkIsAVLT() {
    super.checkIsBST();
    this.checkHeightCorrect();
    this.checkBalanceFactors();
  }
  /**
   * Perform a right rotation of the tree if possible
   * and return the root of the resulting tree
   * The resulting tree's nodes' heights are also updated
   */
  rightRotation() {
    const q = this;
    const p = this.left;
    if (!p) return q;
    const b = p.right;
    if (q.parent) {
      p.parent = q.parent;
      if (q.parent.left === q) q.parent.left = p;
      else q.parent.right = p;
    } else {
      p.parent = null;
    }
    p.right = q;
    q.parent = p;
    q.left = b;
    if (b) {
      b.parent = q;
    }
    const ah = p.left ? p.left.height : 0;
    const bh = b ? b.height : 0;
    const ch = q.right ? q.right.height : 0;
    q.height = Math.max(bh, ch) + 1;
    p.height = Math.max(ah, q.height) + 1;
    return p;
  }
  /**
   * Perform a left rotation of the tree if possible
   * and return the root of the resulting tree
   * The resulting tree's nodes' heights are also updated
   */
  leftRotation() {
    const p = this;
    const q = this.right;
    if (!q) {
      return this;
    }
    const b = q.left;
    if (p.parent) {
      q.parent = p.parent;
      if (p.parent.left === p) p.parent.left = q;
      else p.parent.right = q;
    } else {
      q.parent = null;
    }
    q.left = p;
    p.parent = q;
    p.right = b;
    if (b) {
      b.parent = p;
    }
    const ah = p.left ? p.left.height : 0;
    const bh = b ? b.height : 0;
    const ch = q.right ? q.right.height : 0;
    p.height = Math.max(ah, bh) + 1;
    q.height = Math.max(ch, p.height) + 1;
    return q;
  }
  /**
   * Modify the tree if its right subtree is too small compared to the left
   * Return the new root if any
   */
  rightTooSmall() {
    if (this.balanceFactor() <= 1) return this;
    if (this.left.balanceFactor() < 0) this.left.leftRotation();
    return this.rightRotation();
  }
  /**
   * Modify the tree if its left subtree is too small compared to the right
   * Return the new root if any
   */
  leftTooSmall() {
    if (this.balanceFactor() >= -1) {
      return this;
    }
    if (this.right.balanceFactor() > 0) this.right.rightRotation();
    return this.leftRotation();
  }
  /**
   * Rebalance the tree along the given path. The path is given reversed (as he was calculated
   * in the insert and delete functions).
   * Returns the new root of the tree
   * Of course, the first element of the path must be the root of the tree
   */
  rebalanceAlongPath(path2) {
    let newRoot = this;
    let rotated;
    let i;
    if (!Object.prototype.hasOwnProperty.call(this, "key")) {
      delete this.height;
      return this;
    }
    for (i = path2.length - 1; i >= 0; i -= 1) {
      path2[i].height = 1 + Math.max(path2[i].left ? path2[i].left.height : 0, path2[i].right ? path2[i].right.height : 0);
      if (path2[i].balanceFactor() > 1) {
        rotated = path2[i].rightTooSmall();
        if (i === 0) newRoot = rotated;
      }
      if (path2[i].balanceFactor() < -1) {
        rotated = path2[i].leftTooSmall();
        if (i === 0) newRoot = rotated;
      }
    }
    return newRoot;
  }
  /**
   * Insert a key, value pair in the tree while maintaining the AVL tree height constraint
   * Return a pointer to the root node, which may have changed
   */
  insert(key, value) {
    const insertPath = [];
    let currentNode = this;
    if (!Object.prototype.hasOwnProperty.call(this, "key")) {
      this.key = key;
      this.data.push(value);
      this.height = 1;
      return this;
    }
    while (true) {
      if (currentNode.compareKeys(currentNode.key, key) === 0) {
        if (currentNode.unique) {
          const err = new Error(`Can't insert key ${JSON.stringify(key)}, it violates the unique constraint`);
          err.key = key;
          err.errorType = "uniqueViolated";
          throw err;
        } else currentNode.data.push(value);
        return this;
      }
      insertPath.push(currentNode);
      if (currentNode.compareKeys(key, currentNode.key) < 0) {
        if (!currentNode.left) {
          insertPath.push(currentNode.createLeftChild({ key, value }));
          break;
        } else currentNode = currentNode.left;
      } else {
        if (!currentNode.right) {
          insertPath.push(currentNode.createRightChild({ key, value }));
          break;
        } else currentNode = currentNode.right;
      }
    }
    return this.rebalanceAlongPath(insertPath);
  }
  /**
   * Delete a key or just a value and return the new root of the tree
   * @param {Key} key
   * @param {Value} value Optional. If not set, the whole key is deleted. If set, only this value is deleted
   */
  delete(key, value) {
    const newData = [];
    let replaceWith;
    let currentNode = this;
    const deletePath = [];
    if (!Object.prototype.hasOwnProperty.call(this, "key")) return this;
    while (true) {
      if (currentNode.compareKeys(key, currentNode.key) === 0) {
        break;
      }
      deletePath.push(currentNode);
      if (currentNode.compareKeys(key, currentNode.key) < 0) {
        if (currentNode.left) {
          currentNode = currentNode.left;
        } else return this;
      } else {
        if (currentNode.right) {
          currentNode = currentNode.right;
        } else return this;
      }
    }
    if (currentNode.data.length > 1 && value !== void 0) {
      currentNode.data.forEach(function(d) {
        if (!currentNode.checkValueEquality(d, value)) newData.push(d);
      });
      currentNode.data = newData;
      return this;
    }
    if (!currentNode.left && !currentNode.right) {
      if (currentNode === this) {
        delete currentNode.key;
        currentNode.data = [];
        delete currentNode.height;
        return this;
      } else {
        if (currentNode.parent.left === currentNode) currentNode.parent.left = null;
        else currentNode.parent.right = null;
        return this.rebalanceAlongPath(deletePath);
      }
    }
    if (!currentNode.left || !currentNode.right) {
      replaceWith = currentNode.left ? currentNode.left : currentNode.right;
      if (currentNode === this) {
        replaceWith.parent = null;
        return replaceWith;
      } else {
        if (currentNode.parent.left === currentNode) {
          currentNode.parent.left = replaceWith;
          replaceWith.parent = currentNode.parent;
        } else {
          currentNode.parent.right = replaceWith;
          replaceWith.parent = currentNode.parent;
        }
        return this.rebalanceAlongPath(deletePath);
      }
    }
    deletePath.push(currentNode);
    replaceWith = currentNode.left;
    if (!replaceWith.right) {
      currentNode.key = replaceWith.key;
      currentNode.data = replaceWith.data;
      currentNode.left = replaceWith.left;
      if (replaceWith.left) {
        replaceWith.left.parent = currentNode;
      }
      return this.rebalanceAlongPath(deletePath);
    }
    while (true) {
      if (replaceWith.right) {
        deletePath.push(replaceWith);
        replaceWith = replaceWith.right;
      } else break;
    }
    currentNode.key = replaceWith.key;
    currentNode.data = replaceWith.data;
    replaceWith.parent.right = replaceWith.left;
    if (replaceWith.left) replaceWith.left.parent = replaceWith.parent;
    return this.rebalanceAlongPath(deletePath);
  }
}
AVLTree._AVLTree = _AVLTree;
["getNumberOfKeys", "search", "betweenBounds", "prettyPrint", "executeOnEveryNode"].forEach(function(fn) {
  AVLTree.prototype[fn] = function() {
    return this.tree[fn].apply(this.tree, arguments);
  };
});
var avltree = AVLTree;
binarySearchTree.BinarySearchTree = bst;
binarySearchTree.AVLTree = avltree;
const BinarySearchTree2 = binarySearchTree.AVLTree;
const model$2 = model$4;
const { uniq, isDate: isDate$1 } = utils;
const checkValueEquality = (a, b) => a === b;
const projectForUnique = (elt) => {
  if (elt === null) return "$null";
  if (typeof elt === "string") return "$string" + elt;
  if (typeof elt === "boolean") return "$boolean" + elt;
  if (typeof elt === "number") return "$number" + elt;
  if (isDate$1(elt)) return "$date" + elt.getTime();
  return elt;
};
let Index$2 = class Index {
  /**
   * Create a new index
   * All methods on an index guarantee that either the whole operation was successful and the index changed
   * or the operation was unsuccessful and an error is thrown while the index is unchanged
   * @param {object} options
   * @param {string} options.fieldName On which field should the index apply, can use dot notation to index on sub fields, can use comma-separated notation to use compound indexes
   * @param {boolean} [options.unique = false] Enforces a unique constraint
   * @param {boolean} [options.sparse = false] Allows a sparse index (we can have documents for which fieldName is `undefined`)
   */
  constructor(options) {
    this.fieldName = options.fieldName;
    if (typeof this.fieldName !== "string") throw new Error("fieldName must be a string");
    this._fields = this.fieldName.split(",");
    this.unique = options.unique || false;
    this.sparse = options.sparse || false;
    this.treeOptions = { unique: this.unique, compareKeys: model$2.compareThings, checkValueEquality };
    this.tree = new BinarySearchTree2(this.treeOptions);
  }
  /**
   * Reset an index
   * @param {?document|?document[]} [newData] Data to initialize the index with. If an error is thrown during
   * insertion, the index is not modified.
   */
  reset(newData) {
    this.tree = new BinarySearchTree2(this.treeOptions);
    if (newData) this.insert(newData);
  }
  /**
   * Insert a new document in the index
   * If an array is passed, we insert all its elements (if one insertion fails the index is not modified)
   * O(log(n))
   * @param {document|document[]} doc The document, or array of documents, to insert.
   */
  insert(doc) {
    let keys;
    let failingIndex;
    let error;
    if (Array.isArray(doc)) {
      this.insertMultipleDocs(doc);
      return;
    }
    const key = model$2.getDotValues(doc, this._fields);
    if ((key === void 0 || typeof key === "object" && key !== null && Object.values(key).every((el) => el === void 0)) && this.sparse) return;
    if (!Array.isArray(key)) this.tree.insert(key, doc);
    else {
      keys = uniq(key, projectForUnique);
      for (let i = 0; i < keys.length; i += 1) {
        try {
          this.tree.insert(keys[i], doc);
        } catch (e) {
          error = e;
          failingIndex = i;
          break;
        }
      }
      if (error) {
        for (let i = 0; i < failingIndex; i += 1) {
          this.tree.delete(keys[i], doc);
        }
        throw error;
      }
    }
  }
  /**
   * Insert an array of documents in the index
   * If a constraint is violated, the changes should be rolled back and an error thrown
   * @param {document[]} docs Array of documents to insert.
   * @private
   */
  insertMultipleDocs(docs) {
    let error;
    let failingIndex;
    for (let i = 0; i < docs.length; i += 1) {
      try {
        this.insert(docs[i]);
      } catch (e) {
        error = e;
        failingIndex = i;
        break;
      }
    }
    if (error) {
      for (let i = 0; i < failingIndex; i += 1) {
        this.remove(docs[i]);
      }
      throw error;
    }
  }
  /**
   * Removes a document from the index.
   * If an array is passed, we remove all its elements
   * The remove operation is safe with regards to the 'unique' constraint
   * O(log(n))
   * @param {document[]|document} doc The document, or Array of documents, to remove.
   */
  remove(doc) {
    if (Array.isArray(doc)) {
      doc.forEach((d) => {
        this.remove(d);
      });
      return;
    }
    const key = model$2.getDotValues(doc, this._fields);
    if (key === void 0 && this.sparse) return;
    if (!Array.isArray(key)) {
      this.tree.delete(key, doc);
    } else {
      uniq(key, projectForUnique).forEach((_key) => {
        this.tree.delete(_key, doc);
      });
    }
  }
  /**
   * Update a document in the index
   * If a constraint is violated, changes are rolled back and an error thrown
   * Naive implementation, still in O(log(n))
   * @param {document|Array.<{oldDoc: document, newDoc: document}>} oldDoc Document to update, or an `Array` of
   * `{oldDoc, newDoc}` pairs.
   * @param {document} [newDoc] Document to replace the oldDoc with. If the first argument is an `Array` of
   * `{oldDoc, newDoc}` pairs, this second argument is ignored.
   */
  update(oldDoc, newDoc) {
    if (Array.isArray(oldDoc)) {
      this.updateMultipleDocs(oldDoc);
      return;
    }
    this.remove(oldDoc);
    try {
      this.insert(newDoc);
    } catch (e) {
      this.insert(oldDoc);
      throw e;
    }
  }
  /**
   * Update multiple documents in the index
   * If a constraint is violated, the changes need to be rolled back
   * and an error thrown
   * @param {Array.<{oldDoc: document, newDoc: document}>} pairs
   *
   * @private
   */
  updateMultipleDocs(pairs) {
    let failingIndex;
    let error;
    for (let i = 0; i < pairs.length; i += 1) {
      this.remove(pairs[i].oldDoc);
    }
    for (let i = 0; i < pairs.length; i += 1) {
      try {
        this.insert(pairs[i].newDoc);
      } catch (e) {
        error = e;
        failingIndex = i;
        break;
      }
    }
    if (error) {
      for (let i = 0; i < failingIndex; i += 1) {
        this.remove(pairs[i].newDoc);
      }
      for (let i = 0; i < pairs.length; i += 1) {
        this.insert(pairs[i].oldDoc);
      }
      throw error;
    }
  }
  /**
   * Revert an update
   * @param {document|Array.<{oldDoc: document, newDoc: document}>} oldDoc Document to revert to, or an `Array` of `{oldDoc, newDoc}` pairs.
   * @param {document} [newDoc] Document to revert from. If the first argument is an Array of {oldDoc, newDoc}, this second argument is ignored.
   */
  revertUpdate(oldDoc, newDoc) {
    const revert = [];
    if (!Array.isArray(oldDoc)) this.update(newDoc, oldDoc);
    else {
      oldDoc.forEach((pair) => {
        revert.push({ oldDoc: pair.newDoc, newDoc: pair.oldDoc });
      });
      this.update(revert);
    }
  }
  /**
   * Get all documents in index whose key match value (if it is a Thing) or one of the elements of value (if it is an array of Things)
   * @param {Array.<*>|*} value Value to match the key against
   * @return {document[]}
   */
  getMatching(value) {
    if (!Array.isArray(value)) return this.tree.search(value);
    else {
      const _res = {};
      const res = [];
      value.forEach((v) => {
        this.getMatching(v).forEach((doc) => {
          _res[doc._id] = doc;
        });
      });
      Object.keys(_res).forEach((_id) => {
        res.push(_res[_id]);
      });
      return res;
    }
  }
  /**
   * Get all documents in index whose key is between bounds are they are defined by query
   * Documents are sorted by key
   * @param {object} query An object with at least one matcher among $gt, $gte, $lt, $lte.
   * @param {*} [query.$gt] Greater than matcher.
   * @param {*} [query.$gte] Greater than or equal matcher.
   * @param {*} [query.$lt] Lower than matcher.
   * @param {*} [query.$lte] Lower than or equal matcher.
   * @return {document[]}
   */
  getBetweenBounds(query) {
    return this.tree.betweenBounds(query);
  }
  /**
   * Get all elements in the index
   * @return {document[]}
   */
  getAll() {
    const res = [];
    this.tree.executeOnEveryNode((node) => {
      res.push(...node.data);
    });
    return res;
  }
};
var indexes = Index$2;
const stream = require$$0$1;
const timers = require$$1$1;
const { Buffer } = require$$2;
const createLineStream = (readStream, options) => {
  if (!readStream) throw new Error("expected readStream");
  if (!readStream.readable) throw new Error("readStream must be readable");
  const ls = new LineStream(options);
  readStream.pipe(ls);
  return ls;
};
class LineStream extends stream.Transform {
  constructor(options) {
    super(options);
    options = options || {};
    this._readableState.objectMode = true;
    this._lineBuffer = [];
    this._keepEmptyLines = options.keepEmptyLines || false;
    this._lastChunkEndedWithCR = false;
    this.once("pipe", (src) => {
      if (!this.encoding && src instanceof stream.Readable) this.encoding = src._readableState.encoding;
    });
  }
  _transform(chunk, encoding, done) {
    encoding = encoding || "utf8";
    if (Buffer.isBuffer(chunk)) {
      if (encoding === "buffer") {
        chunk = chunk.toString();
        encoding = "utf8";
      } else chunk = chunk.toString(encoding);
    }
    this._chunkEncoding = encoding;
    const lines = chunk.split(/\r\n|[\n\v\f\r\x85\u2028\u2029]/g);
    if (this._lastChunkEndedWithCR && chunk[0] === "\n") lines.shift();
    if (this._lineBuffer.length > 0) {
      this._lineBuffer[this._lineBuffer.length - 1] += lines[0];
      lines.shift();
    }
    this._lastChunkEndedWithCR = chunk[chunk.length - 1] === "\r";
    this._lineBuffer = this._lineBuffer.concat(lines);
    this._pushBuffer(encoding, 1, done);
  }
  _pushBuffer(encoding, keep, done) {
    while (this._lineBuffer.length > keep) {
      const line = this._lineBuffer.shift();
      if (this._keepEmptyLines || line.length > 0) {
        if (!this.push(this._reencode(line, encoding))) {
          timers.setImmediate(() => {
            this._pushBuffer(encoding, keep, done);
          });
          return;
        }
      }
    }
    done();
  }
  _flush(done) {
    this._pushBuffer(this._chunkEncoding, 0, done);
  }
  // see Readable::push
  _reencode(line, chunkEncoding) {
    if (this.encoding && this.encoding !== chunkEncoding) return Buffer.from(line, chunkEncoding).toString(this.encoding);
    else if (this.encoding) return line;
    else return Buffer.from(line, chunkEncoding);
  }
}
var byline$1 = createLineStream;
var storage$1 = {};
const fs = require$$0$2;
const fsPromises = fs.promises;
const path = path$1;
const { Readable } = require$$0$1;
const DEFAULT_DIR_MODE$1 = 493;
const DEFAULT_FILE_MODE$1 = 420;
const existsAsync = (file) => fsPromises.access(file, fs.constants.F_OK).then(() => true, () => false);
const renameAsync = fsPromises.rename;
const writeFileAsync = fsPromises.writeFile;
const writeFileStream = fs.createWriteStream;
const unlinkAsync = fsPromises.unlink;
const appendFileAsync = fsPromises.appendFile;
const readFileAsync = fsPromises.readFile;
const readFileStream = fs.createReadStream;
const mkdirAsync = fsPromises.mkdir;
const ensureFileDoesntExistAsync = async (file) => {
  if (await existsAsync(file)) await unlinkAsync(file);
};
const flushToStorageAsync = async (options) => {
  let filename;
  let flags;
  let mode;
  if (typeof options === "string") {
    filename = options;
    flags = "r+";
    mode = DEFAULT_FILE_MODE$1;
  } else {
    filename = options.filename;
    flags = options.isDir ? "r" : "r+";
    mode = options.mode !== void 0 ? options.mode : DEFAULT_FILE_MODE$1;
  }
  let filehandle, errorOnFsync, errorOnClose;
  try {
    filehandle = await fsPromises.open(filename, flags, mode);
    try {
      await filehandle.sync();
    } catch (errFS) {
      errorOnFsync = errFS;
    }
  } catch (error) {
    if (error.code !== "EISDIR" || !options.isDir) throw error;
  } finally {
    try {
      await filehandle.close();
    } catch (errC) {
      errorOnClose = errC;
    }
  }
  if ((errorOnFsync || errorOnClose) && !((errorOnFsync.code === "EPERM" || errorOnClose.code === "EISDIR") && options.isDir)) {
    const e = new Error("Failed to flush to storage");
    e.errorOnFsync = errorOnFsync;
    e.errorOnClose = errorOnClose;
    throw e;
  }
};
const writeFileLinesAsync = (filename, lines, mode = DEFAULT_FILE_MODE$1) => new Promise((resolve, reject) => {
  try {
    const stream2 = writeFileStream(filename, { mode });
    const readable = Readable.from(lines);
    readable.on("data", (line) => {
      try {
        stream2.write(line + "\n");
      } catch (err) {
        reject(err);
      }
    });
    readable.on("end", () => {
      stream2.close((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    readable.on("error", (err) => {
      reject(err);
    });
    stream2.on("error", (err) => {
      reject(err);
    });
  } catch (err) {
    reject(err);
  }
});
const crashSafeWriteFileLinesAsync = async (filename, lines, modes = { fileMode: DEFAULT_FILE_MODE$1, dirMode: DEFAULT_DIR_MODE$1 }) => {
  const tempFilename = filename + "~";
  await flushToStorageAsync({ filename: path.dirname(filename), isDir: true, mode: modes.dirMode });
  const exists = await existsAsync(filename);
  if (exists) await flushToStorageAsync({ filename, mode: modes.fileMode });
  await writeFileLinesAsync(tempFilename, lines, modes.fileMode);
  await flushToStorageAsync({ filename: tempFilename, mode: modes.fileMode });
  await renameAsync(tempFilename, filename);
  await flushToStorageAsync({ filename: path.dirname(filename), isDir: true, mode: modes.dirMode });
};
const ensureDatafileIntegrityAsync = async (filename, mode = DEFAULT_FILE_MODE$1) => {
  const tempFilename = filename + "~";
  const filenameExists = await existsAsync(filename);
  if (filenameExists) return;
  const oldFilenameExists = await existsAsync(tempFilename);
  if (!oldFilenameExists) await writeFileAsync(filename, "", { encoding: "utf8", mode });
  else await renameAsync(tempFilename, filename);
};
const ensureParentDirectoryExistsAsync = async (filename, mode) => {
  const dir = path.dirname(filename);
  const parsedDir = path.parse(path.resolve(dir));
  if (process.platform !== "win32" || parsedDir.dir !== parsedDir.root || parsedDir.base !== "") {
    await mkdirAsync(dir, { recursive: true, mode });
  }
};
storage$1.existsAsync = existsAsync;
storage$1.renameAsync = renameAsync;
storage$1.writeFileAsync = writeFileAsync;
storage$1.writeFileLinesAsync = writeFileLinesAsync;
storage$1.crashSafeWriteFileLinesAsync = crashSafeWriteFileLinesAsync;
storage$1.appendFileAsync = appendFileAsync;
storage$1.readFileAsync = readFileAsync;
storage$1.unlinkAsync = unlinkAsync;
storage$1.mkdirAsync = mkdirAsync;
storage$1.readFileStream = readFileStream;
storage$1.flushToStorageAsync = flushToStorageAsync;
storage$1.ensureDatafileIntegrityAsync = ensureDatafileIntegrityAsync;
storage$1.ensureFileDoesntExistAsync = ensureFileDoesntExistAsync;
storage$1.ensureParentDirectoryExistsAsync = ensureParentDirectoryExistsAsync;
const { deprecate: deprecate$1 } = require$$1;
const byline = byline$1;
const Index$1 = indexes;
const model$1 = model$4;
const storage = storage$1;
const Waterfall2 = waterfall;
const DEFAULT_DIR_MODE = 493;
const DEFAULT_FILE_MODE = 420;
let Persistence$1 = class Persistence {
  /**
   * Create a new Persistence object for database options.db
   * @param {Datastore} options.db
   * @param {Number} [options.corruptAlertThreshold] Optional, threshold after which an alert is thrown if too much data is corrupt
   * @param {serializationHook} [options.beforeDeserialization] Hook you can use to transform data after it was serialized and before it is written to disk.
   * @param {serializationHook} [options.afterSerialization] Inverse of `afterSerialization`.
   * @param {object} [options.modes] Modes to use for FS permissions. Will not work on Windows.
   * @param {number} [options.modes.fileMode=0o644] Mode to use for files.
   * @param {number} [options.modes.dirMode=0o755] Mode to use for directories.
   */
  constructor(options) {
    this.db = options.db;
    this.inMemoryOnly = this.db.inMemoryOnly;
    this.filename = this.db.filename;
    this.corruptAlertThreshold = options.corruptAlertThreshold !== void 0 ? options.corruptAlertThreshold : 0.1;
    this.modes = options.modes !== void 0 ? options.modes : {
      fileMode: DEFAULT_FILE_MODE,
      dirMode: DEFAULT_DIR_MODE
    };
    if (this.modes.fileMode === void 0) this.modes.fileMode = DEFAULT_FILE_MODE;
    if (this.modes.dirMode === void 0) this.modes.dirMode = DEFAULT_DIR_MODE;
    if (!this.inMemoryOnly && this.filename && this.filename.charAt(this.filename.length - 1) === "~") throw new Error("The datafile name can't end with a ~, which is reserved for crash safe backup files");
    if (options.afterSerialization && !options.beforeDeserialization) throw new Error("Serialization hook defined but deserialization hook undefined, cautiously refusing to start NeDB to prevent dataloss");
    if (!options.afterSerialization && options.beforeDeserialization) throw new Error("Serialization hook undefined but deserialization hook defined, cautiously refusing to start NeDB to prevent dataloss");
    this.afterSerialization = async (s) => (options.afterSerialization || ((x) => x))(s);
    this.beforeDeserialization = async (s) => (options.beforeDeserialization || ((x) => x))(s);
  }
  /**
   * Internal version without using the {@link Datastore#executor} of {@link Datastore#compactDatafileAsync}, use it instead.
   * @return {Promise<void>}
   * @private
   */
  async persistCachedDatabaseAsync() {
    const lines = [];
    if (this.inMemoryOnly) return;
    for (const doc of this.db.getAllData()) {
      lines.push(await this.afterSerialization(model$1.serialize(doc)));
    }
    for (const fieldName of Object.keys(this.db.indexes)) {
      if (fieldName !== "_id") {
        lines.push(await this.afterSerialization(model$1.serialize({
          $$indexCreated: {
            fieldName: this.db.indexes[fieldName].fieldName,
            unique: this.db.indexes[fieldName].unique,
            sparse: this.db.indexes[fieldName].sparse
          }
        })));
      }
    }
    await storage.crashSafeWriteFileLinesAsync(this.filename, lines, this.modes);
    this.db.emit("compaction.done");
  }
  /**
   * @see Datastore#compactDatafile
   * @deprecated
   * @param {NoParamCallback} [callback = () => {}]
   * @see Persistence#compactDatafileAsync
   */
  compactDatafile(callback) {
    deprecate$1((_callback) => this.db.compactDatafile(_callback), "@seald-io/nedb: calling Datastore#persistence#compactDatafile is deprecated, please use Datastore#compactDatafile, it will be removed in the next major version.")(callback);
  }
  /**
   * @see Datastore#setAutocompactionInterval
   * @deprecated
   */
  setAutocompactionInterval(interval) {
    deprecate$1((_interval) => this.db.setAutocompactionInterval(_interval), "@seald-io/nedb: calling Datastore#persistence#setAutocompactionInterval is deprecated, please use Datastore#setAutocompactionInterval, it will be removed in the next major version.")(interval);
  }
  /**
   * @see Datastore#stopAutocompaction
   * @deprecated
   */
  stopAutocompaction() {
    deprecate$1(() => this.db.stopAutocompaction(), "@seald-io/nedb: calling Datastore#persistence#stopAutocompaction is deprecated, please use Datastore#stopAutocompaction, it will be removed in the next major version.")();
  }
  /**
   * Persist new state for the given newDocs (can be insertion, update or removal)
   * Use an append-only format
   *
   * Do not use directly, it should only used by a {@link Datastore} instance.
   * @param {document[]} newDocs Can be empty if no doc was updated/removed
   * @return {Promise}
   * @private
   */
  async persistNewStateAsync(newDocs) {
    let toPersist = "";
    if (this.inMemoryOnly) return;
    for (const doc of newDocs) {
      toPersist += await this.afterSerialization(model$1.serialize(doc)) + "\n";
    }
    if (toPersist.length === 0) return;
    await storage.appendFileAsync(this.filename, toPersist, { encoding: "utf8", mode: this.modes.fileMode });
  }
  /**
   * @typedef rawIndex
   * @property {string} fieldName
   * @property {boolean} [unique]
   * @property {boolean} [sparse]
   */
  /**
   * From a database's raw data, return the corresponding machine understandable collection.
   *
   * Do not use directly, it should only used by a {@link Datastore} instance.
   * @param {string} rawData database file
   * @return {{data: document[], indexes: Object.<string, rawIndex>}}
   * @private
   */
  async treatRawData(rawData) {
    const data = rawData.split("\n").filter((datum) => datum !== "").map(async (datum) => model$1.deserialize(await this.beforeDeserialization(datum)));
    const dataById = {};
    const indexes2 = {};
    const dataLength = data.length;
    let corruptItems = 0;
    for (const docToAwait of data) {
      try {
        const doc = await docToAwait;
        if (doc._id) {
          if (doc.$$deleted === true) delete dataById[doc._id];
          else dataById[doc._id] = doc;
        } else if (doc.$$indexCreated && doc.$$indexCreated.fieldName != null) indexes2[doc.$$indexCreated.fieldName] = doc.$$indexCreated;
        else if (typeof doc.$$indexRemoved === "string") delete indexes2[doc.$$indexRemoved];
      } catch (e) {
        corruptItems += 1;
      }
    }
    if (dataLength > 0) {
      const corruptionRate = corruptItems / dataLength;
      if (corruptionRate > this.corruptAlertThreshold) {
        const error = new Error(`${Math.floor(100 * corruptionRate)}% of the data file is corrupt, more than given corruptAlertThreshold (${Math.floor(100 * this.corruptAlertThreshold)}%). Cautiously refusing to start NeDB to prevent dataloss.`);
        error.corruptionRate = corruptionRate;
        error.corruptItems = corruptItems;
        error.dataLength = dataLength;
        throw error;
      }
    }
    const tdata = Object.values(dataById);
    return { data: tdata, indexes: indexes2 };
  }
  /**
   * From a database's raw data stream, return the corresponding machine understandable collection
   * Is only used by a {@link Datastore} instance.
   *
   * Is only used in the Node.js version, since [React-Native]{@link module:storageReactNative} &
   * [browser]{@link module:storageBrowser} storage modules don't provide an equivalent of
   * {@link module:storage.readFileStream}.
   *
   * Do not use directly, it should only used by a {@link Datastore} instance.
   * @param {Readable} rawStream
   * @return {Promise<{data: document[], indexes: Object.<string, rawIndex>}>}
   * @async
   * @private
   */
  treatRawStreamAsync(rawStream) {
    return new Promise((resolve, reject) => {
      const dataById = {};
      const indexes2 = {};
      let corruptItems = 0;
      const lineStream = byline(rawStream);
      let dataLength = 0;
      const waterfall2 = new Waterfall2();
      lineStream.on("data", (line) => {
        const deserializedPromise = this.beforeDeserialization(line);
        return waterfall2.waterfall(async () => {
          if (line === "") return;
          try {
            const doc = model$1.deserialize(await deserializedPromise);
            if (doc._id) {
              if (doc.$$deleted === true) delete dataById[doc._id];
              else dataById[doc._id] = doc;
            } else if (doc.$$indexCreated && doc.$$indexCreated.fieldName != null) indexes2[doc.$$indexCreated.fieldName] = doc.$$indexCreated;
            else if (typeof doc.$$indexRemoved === "string") delete indexes2[doc.$$indexRemoved];
          } catch (e) {
            corruptItems += 1;
          }
          dataLength++;
        })();
      });
      lineStream.on("end", async () => {
        await waterfall2.guardian;
        if (dataLength > 0) {
          const corruptionRate = corruptItems / dataLength;
          if (corruptionRate > this.corruptAlertThreshold) {
            const error = new Error(`${Math.floor(100 * corruptionRate)}% of the data file is corrupt, more than given corruptAlertThreshold (${Math.floor(100 * this.corruptAlertThreshold)}%). Cautiously refusing to start NeDB to prevent dataloss.`);
            error.corruptionRate = corruptionRate;
            error.corruptItems = corruptItems;
            error.dataLength = dataLength;
            reject(error, null);
            return;
          }
        }
        const data = Object.values(dataById);
        resolve({ data, indexes: indexes2 });
      });
      lineStream.on("error", function(err) {
        reject(err, null);
      });
    });
  }
  /**
   * Load the database
   * 1) Create all indexes
   * 2) Insert all data
   * 3) Compact the database
   *
   * This means pulling data out of the data file or creating it if it doesn't exist
   * Also, all data is persisted right away, which has the effect of compacting the database file
   * This operation is very quick at startup for a big collection (60ms for ~10k docs)
   *
   * Do not use directly as it does not use the [Executor]{@link Datastore.executor}, use {@link Datastore#loadDatabaseAsync} instead.
   * @return {Promise<void>}
   * @private
   */
  async loadDatabaseAsync() {
    this.db._resetIndexes();
    if (this.inMemoryOnly) return;
    await Persistence.ensureParentDirectoryExistsAsync(this.filename, this.modes.dirMode);
    await storage.ensureDatafileIntegrityAsync(this.filename, this.modes.fileMode);
    let treatedData;
    if (storage.readFileStream) {
      const fileStream = storage.readFileStream(this.filename, { encoding: "utf8", mode: this.modes.fileMode });
      treatedData = await this.treatRawStreamAsync(fileStream);
    } else {
      const rawData = await storage.readFileAsync(this.filename, { encoding: "utf8", mode: this.modes.fileMode });
      treatedData = await this.treatRawData(rawData);
    }
    Object.keys(treatedData.indexes).forEach((key) => {
      this.db.indexes[key] = new Index$1(treatedData.indexes[key]);
    });
    try {
      this.db._resetIndexes(treatedData.data);
    } catch (e) {
      this.db._resetIndexes();
      throw e;
    }
    await this.db.persistence.persistCachedDatabaseAsync();
    this.db.executor.processBuffer();
  }
  /**
   * See {@link Datastore#dropDatabaseAsync}. This function uses {@link Datastore#executor} internally. Decorating this
   * function with an {@link Executor#pushAsync} will result in a deadlock.
   * @return {Promise<void>}
   * @private
   * @see Datastore#dropDatabaseAsync
   */
  async dropDatabaseAsync() {
    this.db.stopAutocompaction();
    this.db.executor.ready = false;
    this.db.executor.resetBuffer();
    await this.db.executor.queue.guardian;
    this.db.indexes = {};
    this.db.indexes._id = new Index$1({ fieldName: "_id", unique: true });
    this.db.ttlIndexes = {};
    if (!this.db.inMemoryOnly) {
      await this.db.executor.pushAsync(async () => {
        if (await storage.existsAsync(this.filename)) await storage.unlinkAsync(this.filename);
      }, true);
    }
  }
  /**
   * Check if a directory stat and create it on the fly if it is not the case.
   * @param {string} dir
   * @param {number} [mode=0o777]
   * @return {Promise<void>}
   * @private
   */
  static async ensureParentDirectoryExistsAsync(dir, mode = DEFAULT_DIR_MODE) {
    return storage.ensureParentDirectoryExistsAsync(dir, mode);
  }
};
var persistence = Persistence$1;
const { EventEmitter } = require$$0$3;
const { callbackify, deprecate } = require$$1;
const Cursor2 = cursor;
const customUtils = customUtils$4;
const Executor2 = executor;
const Index2 = indexes;
const model = model$4;
const Persistence2 = persistence;
const { isDate, pick, filterIndexNames } = utils;
let Datastore$2 = class Datastore extends EventEmitter {
  /**
   * Create a new collection, either persistent or in-memory.
   *
   * If you use a persistent datastore without the `autoload` option, you need to call {@link Datastore#loadDatabase} or
   * {@link Datastore#loadDatabaseAsync} manually. This function fetches the data from datafile and prepares the database.
   * **Don't forget it!** If you use a persistent datastore, no command (insert, find, update, remove) will be executed
   * before it is called, so make sure to call it yourself or use the `autoload` option.
   *
   * Also, if loading fails, all commands registered to the {@link Datastore#executor} afterwards will not be executed.
   * They will be registered and executed, in sequence, only after a successful loading.
   *
   * @param {object|string} options Can be an object or a string. If options is a string, the behavior is the same as in
   * v0.6: it will be interpreted as `options.filename`. **Giving a string is deprecated, and will be removed in the
   * next major version.**
   * @param {string} [options.filename = null] Path to the file where the data is persisted. If left blank, the datastore is
   * automatically considered in-memory only. It cannot end with a `~` which is used in the temporary files NeDB uses to
   * perform crash-safe writes. Not used if `options.inMemoryOnly` is `true`.
   * @param {boolean} [options.inMemoryOnly = false] If set to true, no data will be written in storage. This option has
   * priority over `options.filename`.
   * @param {object} [options.modes] Permissions to use for FS. Only used for Node.js storage module. Will not work on Windows.
   * @param {number} [options.modes.fileMode = 0o644] Permissions to use for database files
   * @param {number} [options.modes.dirMode = 0o755] Permissions to use for database directories
   * @param {boolean} [options.timestampData = false] If set to true, createdAt and updatedAt will be created and
   * populated automatically (if not specified by user)
   * @param {boolean} [options.autoload = false] If used, the database will automatically be loaded from the datafile
   * upon creation (you don't need to call `loadDatabase`). Any command issued before load is finished is buffered and
   * will be executed when load is done. When autoloading is done, you can either use the `onload` callback, or you can
   * use `this.autoloadPromise` which resolves (or rejects) when autloading is done.
   * @param {NoParamCallback} [options.onload] If you use autoloading, this is the handler called after the `loadDatabase`. It
   * takes one `error` argument. If you use autoloading without specifying this handler, and an error happens during
   * load, an error will be thrown.
   * @param {serializationHook} [options.beforeDeserialization] Hook you can use to transform data after it was serialized and
   * before it is written to disk. Can be used for example to encrypt data before writing database to disk. This
   * function takes a string as parameter (one line of an NeDB data file) and outputs the transformed string, **which
   * must absolutely not contain a `\n` character** (or data will be lost).
   * @param {serializationHook} [options.afterSerialization] Inverse of `afterSerialization`. Make sure to include both and not
   * just one, or you risk data loss. For the same reason, make sure both functions are inverses of one another. Some
   * failsafe mechanisms are in place to prevent data loss if you misuse the serialization hooks: NeDB checks that never
   * one is declared without the other, and checks that they are reverse of one another by testing on random strings of
   * various lengths. In addition, if too much data is detected as corrupt, NeDB will refuse to start as it could mean
   * you're not using the deserialization hook corresponding to the serialization hook used before.
   * @param {number} [options.corruptAlertThreshold = 0.1] Between 0 and 1, defaults to 10%. NeDB will refuse to start
   * if more than this percentage of the datafile is corrupt. 0 means you don't tolerate any corruption, 1 means you
   * don't care.
   * @param {compareStrings} [options.compareStrings] If specified, it overrides default string comparison which is not
   * well adapted to non-US characters in particular accented letters. Native `localCompare` will most of the time be
   * the right choice.
   * @param {boolean} [options.testSerializationHooks=true] Whether to test the serialization hooks or not,
   * might be CPU-intensive
   */
  constructor(options) {
    super();
    let filename;
    if (typeof options === "string") {
      deprecate(() => {
        filename = options;
        this.inMemoryOnly = false;
      }, "@seald-io/nedb: Giving a string to the Datastore constructor is deprecated and will be removed in the next major version. Please use an options object with an argument 'filename'.")();
    } else {
      options = options || {};
      filename = options.filename;
      this.inMemoryOnly = options.inMemoryOnly || false;
      this.autoload = options.autoload || false;
      this.timestampData = options.timestampData || false;
    }
    if (!filename || typeof filename !== "string" || filename.length === 0) {
      this.filename = null;
      this.inMemoryOnly = true;
    } else {
      this.filename = filename;
    }
    this.compareStrings = options.compareStrings;
    this.persistence = new Persistence2({
      db: this,
      afterSerialization: options.afterSerialization,
      beforeDeserialization: options.beforeDeserialization,
      corruptAlertThreshold: options.corruptAlertThreshold,
      modes: options.modes,
      testSerializationHooks: options.testSerializationHooks
    });
    this.executor = new Executor2();
    if (this.inMemoryOnly) this.executor.ready = true;
    this.indexes = {};
    this.indexes._id = new Index2({ fieldName: "_id", unique: true });
    this.ttlIndexes = {};
    if (this.autoload) {
      this.autoloadPromise = this.loadDatabaseAsync();
      this.autoloadPromise.then(() => {
        if (options.onload) options.onload();
      }, (err) => {
        if (options.onload) options.onload(err);
        else throw err;
      });
    } else this.autoloadPromise = null;
    this._autocompactionIntervalId = null;
  }
  /**
   * Queue a compaction/rewrite of the datafile.
   * It works by rewriting the database file, and compacts it since the cache always contains only the number of
   * documents in the collection while the data file is append-only so it may grow larger.
   *
   * @async
   */
  compactDatafileAsync() {
    return this.executor.pushAsync(() => this.persistence.persistCachedDatabaseAsync());
  }
  /**
   * Callback version of {@link Datastore#compactDatafileAsync}.
   * @param {NoParamCallback} [callback = () => {}]
   * @see Datastore#compactDatafileAsync
   */
  compactDatafile(callback) {
    const promise = this.compactDatafileAsync();
    if (typeof callback === "function") callbackify(() => promise)(callback);
  }
  /**
   * Set automatic compaction every `interval` ms
   * @param {Number} interval in milliseconds, with an enforced minimum of 5000 milliseconds
   */
  setAutocompactionInterval(interval) {
    const minInterval = 5e3;
    if (Number.isNaN(Number(interval))) throw new Error("Interval must be a non-NaN number");
    const realInterval = Math.max(Number(interval), minInterval);
    this.stopAutocompaction();
    this._autocompactionIntervalId = setInterval(() => {
      this.compactDatafile();
    }, realInterval);
  }
  /**
   * Stop autocompaction (do nothing if automatic compaction was not running)
   */
  stopAutocompaction() {
    if (this._autocompactionIntervalId) {
      clearInterval(this._autocompactionIntervalId);
      this._autocompactionIntervalId = null;
    }
  }
  /**
   * Callback version of {@link Datastore#loadDatabaseAsync}.
   * @param {NoParamCallback} [callback]
   * @see Datastore#loadDatabaseAsync
   */
  loadDatabase(callback) {
    const promise = this.loadDatabaseAsync();
    if (typeof callback === "function") callbackify(() => promise)(callback);
  }
  /**
   * Stops auto-compaction, finishes all queued operations, drops the database both in memory and in storage.
   * **WARNING**: it is not recommended re-using an instance of NeDB if its database has been dropped, it is
   * preferable to instantiate a new one.
   * @async
   * @return {Promise}
   */
  dropDatabaseAsync() {
    return this.persistence.dropDatabaseAsync();
  }
  /**
   * Callback version of {@link Datastore#dropDatabaseAsync}.
   * @param {NoParamCallback} [callback]
   * @see Datastore#dropDatabaseAsync
   */
  dropDatabase(callback) {
    const promise = this.dropDatabaseAsync();
    if (typeof callback === "function") callbackify(() => promise)(callback);
  }
  /**
   * Load the database from the datafile, and trigger the execution of buffered commands if any.
   * @async
   * @return {Promise}
   */
  loadDatabaseAsync() {
    return this.executor.pushAsync(() => this.persistence.loadDatabaseAsync(), true);
  }
  /**
   * Get an array of all the data in the database.
   * @return {document[]}
   */
  getAllData() {
    return this.indexes._id.getAll();
  }
  /**
   * Reset all currently defined indexes.
   * @param {?document|?document[]} [newData]
   * @private
   */
  _resetIndexes(newData) {
    for (const index of Object.values(this.indexes)) {
      index.reset(newData);
    }
  }
  /**
   * Callback version of {@link Datastore#ensureIndex}.
   * @param {object} options
   * @param {string|string[]} options.fieldName
   * @param {boolean} [options.unique = false]
   * @param {boolean} [options.sparse = false]
   * @param {number} [options.expireAfterSeconds]
   * @param {NoParamCallback} [callback]
   * @see Datastore#ensureIndex
   */
  ensureIndex(options = {}, callback) {
    const promise = this.ensureIndexAsync(options);
    if (typeof callback === "function") callbackify(() => promise)(callback);
  }
  /**
   * Ensure an index is kept for this field. Same parameters as lib/indexes
   * This function acts synchronously on the indexes, however the persistence of the indexes is deferred with the
   * executor.
   * @param {object} options
   * @param {string|string[]} options.fieldName Name of the field to index. Use the dot notation to index a field in a nested
   * document. For a compound index, use an array of field names. Using a comma in a field name is not permitted.
   * @param {boolean} [options.unique = false] Enforce field uniqueness. Note that a unique index will raise an error
   * if you try to index two documents for which the field is not defined.
   * @param {boolean} [options.sparse = false] Don't index documents for which the field is not defined. Use this option
   * along with "unique" if you want to accept multiple documents for which it is not defined.
   * @param {number} [options.expireAfterSeconds] - If set, the created index is a TTL (time to live) index, that will
   * automatically remove documents when the system date becomes larger than the date on the indexed field plus
   * `expireAfterSeconds`. Documents where the indexed field is not specified or not a `Date` object are ignored.
   * @return {Promise<void>}
   */
  async ensureIndexAsync(options = {}) {
    if (!options.fieldName) {
      const err = new Error("Cannot create an index without a fieldName");
      err.missingFieldName = true;
      throw err;
    }
    const _fields = [].concat(options.fieldName).sort();
    if (_fields.some((field) => field.includes(","))) {
      throw new Error("Cannot use comma in index fieldName");
    }
    const _options = {
      ...options,
      fieldName: _fields.join(",")
    };
    if (this.indexes[_options.fieldName]) return;
    this.indexes[_options.fieldName] = new Index2(_options);
    if (options.expireAfterSeconds !== void 0) this.ttlIndexes[_options.fieldName] = _options.expireAfterSeconds;
    try {
      this.indexes[_options.fieldName].insert(this.getAllData());
    } catch (e) {
      delete this.indexes[_options.fieldName];
      throw e;
    }
    await this.executor.pushAsync(() => this.persistence.persistNewStateAsync([{ $$indexCreated: _options }]), true);
  }
  /**
   * Callback version of {@link Datastore#removeIndexAsync}.
   * @param {string} fieldName
   * @param {NoParamCallback} [callback]
   * @see Datastore#removeIndexAsync
   */
  removeIndex(fieldName, callback = () => {
  }) {
    const promise = this.removeIndexAsync(fieldName);
    callbackify(() => promise)(callback);
  }
  /**
   * Remove an index.
   * @param {string} fieldName Field name of the index to remove. Use the dot notation to remove an index referring to a
   * field in a nested document.
   * @return {Promise<void>}
   * @see Datastore#removeIndex
   */
  async removeIndexAsync(fieldName) {
    delete this.indexes[fieldName];
    await this.executor.pushAsync(() => this.persistence.persistNewStateAsync([{ $$indexRemoved: fieldName }]), true);
  }
  /**
   * Add one or several document(s) to all indexes.
   *
   * This is an internal function.
   * @param {document} doc
   * @private
   */
  _addToIndexes(doc) {
    let failingIndex;
    let error;
    const keys = Object.keys(this.indexes);
    for (let i = 0; i < keys.length; i += 1) {
      try {
        this.indexes[keys[i]].insert(doc);
      } catch (e) {
        failingIndex = i;
        error = e;
        break;
      }
    }
    if (error) {
      for (let i = 0; i < failingIndex; i += 1) {
        this.indexes[keys[i]].remove(doc);
      }
      throw error;
    }
  }
  /**
   * Remove one or several document(s) from all indexes.
   *
   * This is an internal function.
   * @param {document} doc
   * @private
   */
  _removeFromIndexes(doc) {
    for (const index of Object.values(this.indexes)) {
      index.remove(doc);
    }
  }
  /**
   * Update one or several documents in all indexes.
   *
   * To update multiple documents, oldDoc must be an array of { oldDoc, newDoc } pairs.
   *
   * If one update violates a constraint, all changes are rolled back.
   *
   * This is an internal function.
   * @param {document|Array.<{oldDoc: document, newDoc: document}>} oldDoc Document to update, or an `Array` of
   * `{oldDoc, newDoc}` pairs.
   * @param {document} [newDoc] Document to replace the oldDoc with. If the first argument is an `Array` of
   * `{oldDoc, newDoc}` pairs, this second argument is ignored.
   * @private
   */
  _updateIndexes(oldDoc, newDoc) {
    let failingIndex;
    let error;
    const keys = Object.keys(this.indexes);
    for (let i = 0; i < keys.length; i += 1) {
      try {
        this.indexes[keys[i]].update(oldDoc, newDoc);
      } catch (e) {
        failingIndex = i;
        error = e;
        break;
      }
    }
    if (error) {
      for (let i = 0; i < failingIndex; i += 1) {
        this.indexes[keys[i]].revertUpdate(oldDoc, newDoc);
      }
      throw error;
    }
  }
  /**
   * Get all candidate documents matching the query, regardless of their expiry status.
   * @param {query} query
   * @return {document[]}
   *
   * @private
   */
  _getRawCandidates(query) {
    const indexNames = Object.keys(this.indexes);
    let usableQuery;
    usableQuery = Object.entries(query).filter(filterIndexNames(indexNames)).pop();
    if (usableQuery) return this.indexes[usableQuery[0]].getMatching(usableQuery[1]);
    const compoundQueryKeys = indexNames.filter((indexName) => indexName.indexOf(",") !== -1).map((indexName) => indexName.split(",")).filter(
      (subIndexNames) => Object.entries(query).filter(filterIndexNames(subIndexNames)).length === subIndexNames.length
    );
    if (compoundQueryKeys.length > 0) return this.indexes[compoundQueryKeys[0]].getMatching(pick(query, compoundQueryKeys[0]));
    usableQuery = Object.entries(query).filter(
      ([k, v]) => !!(query[k] && Object.prototype.hasOwnProperty.call(query[k], "$in")) && indexNames.includes(k)
    ).pop();
    if (usableQuery) return this.indexes[usableQuery[0]].getMatching(usableQuery[1].$in);
    usableQuery = Object.entries(query).filter(
      ([k, v]) => !!(query[k] && (Object.prototype.hasOwnProperty.call(query[k], "$lt") || Object.prototype.hasOwnProperty.call(query[k], "$lte") || Object.prototype.hasOwnProperty.call(query[k], "$gt") || Object.prototype.hasOwnProperty.call(query[k], "$gte"))) && indexNames.includes(k)
    ).pop();
    if (usableQuery) return this.indexes[usableQuery[0]].getBetweenBounds(usableQuery[1]);
    return this.getAllData();
  }
  /**
   * Return the list of candidates for a given query
   * Crude implementation for now, we return the candidates given by the first usable index if any
   * We try the following query types, in this order: basic match, $in match, comparison match
   * One way to make it better would be to enable the use of multiple indexes if the first usable index
   * returns too much data. I may do it in the future.
   *
   * Returned candidates will be scanned to find and remove all expired documents
   *
   * This is an internal function.
   * @param {query} query
   * @param {boolean} [dontExpireStaleDocs = false] If true don't remove stale docs. Useful for the remove function
   * which shouldn't be impacted by expirations.
   * @return {Promise<document[]>} candidates
   * @private
   */
  async _getCandidatesAsync(query, dontExpireStaleDocs = false) {
    const validDocs = [];
    const docs = this._getRawCandidates(query);
    if (!dontExpireStaleDocs) {
      const expiredDocsIds = [];
      const ttlIndexesFieldNames = Object.keys(this.ttlIndexes);
      docs.forEach((doc) => {
        if (ttlIndexesFieldNames.every((i) => !(doc[i] !== void 0 && isDate(doc[i]) && Date.now() > doc[i].getTime() + this.ttlIndexes[i] * 1e3))) validDocs.push(doc);
        else expiredDocsIds.push(doc._id);
      });
      for (const _id of expiredDocsIds) {
        await this._removeAsync({ _id }, {});
      }
    } else validDocs.push(...docs);
    return validDocs;
  }
  /**
   * Insert a new document
   * This is an internal function, use {@link Datastore#insertAsync} which has the same signature.
   * @param {document|document[]} newDoc
   * @return {Promise<document|document[]>}
   * @private
   */
  async _insertAsync(newDoc) {
    const preparedDoc = this._prepareDocumentForInsertion(newDoc);
    this._insertInCache(preparedDoc);
    await this.persistence.persistNewStateAsync(Array.isArray(preparedDoc) ? preparedDoc : [preparedDoc]);
    return model.deepCopy(preparedDoc);
  }
  /**
   * Create a new _id that's not already in use
   * @return {string} id
   * @private
   */
  _createNewId() {
    let attemptId = customUtils.uid(16);
    if (this.indexes._id.getMatching(attemptId).length > 0) attemptId = this._createNewId();
    return attemptId;
  }
  /**
   * Prepare a document (or array of documents) to be inserted in a database
   * Meaning adds _id and timestamps if necessary on a copy of newDoc to avoid any side effect on user input
   * @param {document|document[]} newDoc document, or Array of documents, to prepare
   * @return {document|document[]} prepared document, or Array of prepared documents
   * @private
   */
  _prepareDocumentForInsertion(newDoc) {
    let preparedDoc;
    if (Array.isArray(newDoc)) {
      preparedDoc = [];
      newDoc.forEach((doc) => {
        preparedDoc.push(this._prepareDocumentForInsertion(doc));
      });
    } else {
      preparedDoc = model.deepCopy(newDoc);
      if (preparedDoc._id === void 0) preparedDoc._id = this._createNewId();
      const now = /* @__PURE__ */ new Date();
      if (this.timestampData && preparedDoc.createdAt === void 0) preparedDoc.createdAt = now;
      if (this.timestampData && preparedDoc.updatedAt === void 0) preparedDoc.updatedAt = now;
      model.checkObject(preparedDoc);
    }
    return preparedDoc;
  }
  /**
   * If newDoc is an array of documents, this will insert all documents in the cache
   * @param {document|document[]} preparedDoc
   * @private
   */
  _insertInCache(preparedDoc) {
    if (Array.isArray(preparedDoc)) this._insertMultipleDocsInCache(preparedDoc);
    else this._addToIndexes(preparedDoc);
  }
  /**
   * If one insertion fails (e.g. because of a unique constraint), roll back all previous
   * inserts and throws the error
   * @param {document[]} preparedDocs
   * @private
   */
  _insertMultipleDocsInCache(preparedDocs) {
    let failingIndex;
    let error;
    for (let i = 0; i < preparedDocs.length; i += 1) {
      try {
        this._addToIndexes(preparedDocs[i]);
      } catch (e) {
        error = e;
        failingIndex = i;
        break;
      }
    }
    if (error) {
      for (let i = 0; i < failingIndex; i += 1) {
        this._removeFromIndexes(preparedDocs[i]);
      }
      throw error;
    }
  }
  /**
   * Callback version of {@link Datastore#insertAsync}.
   * @param {document|document[]} newDoc
   * @param {SingleDocumentCallback|MultipleDocumentsCallback} [callback]
   * @see Datastore#insertAsync
   */
  insert(newDoc, callback) {
    const promise = this.insertAsync(newDoc);
    if (typeof callback === "function") callbackify(() => promise)(callback);
  }
  /**
   * Insert a new document, or new documents.
   * @param {document|document[]} newDoc Document or array of documents to insert.
   * @return {Promise<document|document[]>} The document(s) inserted.
   * @async
   */
  insertAsync(newDoc) {
    return this.executor.pushAsync(() => this._insertAsync(newDoc));
  }
  /**
   * Callback for {@link Datastore#countCallback}.
   * @callback Datastore~countCallback
   * @param {?Error} err
   * @param {?number} count
   */
  /**
   * Callback-version of {@link Datastore#countAsync}.
   * @param {query} query
   * @param {Datastore~countCallback} [callback]
   * @return {Cursor<number>|undefined}
   * @see Datastore#countAsync
   */
  count(query, callback) {
    const cursor2 = this.countAsync(query);
    if (typeof callback === "function") callbackify(cursor2.execAsync.bind(cursor2))(callback);
    else return cursor2;
  }
  /**
   * Count all documents matching the query.
   * @param {query} query MongoDB-style query
   * @return {Cursor<number>} count
   * @async
   */
  countAsync(query) {
    return new Cursor2(this, query, (docs) => docs.length);
  }
  /**
   * Callback version of {@link Datastore#findAsync}.
   * @param {query} query
   * @param {projection|MultipleDocumentsCallback} [projection = {}]
   * @param {MultipleDocumentsCallback} [callback]
   * @return {Cursor<document[]>|undefined}
   * @see Datastore#findAsync
   */
  find(query, projection, callback) {
    if (arguments.length === 1) {
      projection = {};
    } else if (arguments.length === 2) {
      if (typeof projection === "function") {
        callback = projection;
        projection = {};
      }
    }
    const cursor2 = this.findAsync(query, projection);
    if (typeof callback === "function") callbackify(cursor2.execAsync.bind(cursor2))(callback);
    else return cursor2;
  }
  /**
   * Find all documents matching the query.
   * We return the {@link Cursor} that the user can either `await` directly or use to can {@link Cursor#limit} or
   * {@link Cursor#skip} before.
   * @param {query} query MongoDB-style query
   * @param {projection} [projection = {}] MongoDB-style projection
   * @return {Cursor<document[]>}
   * @async
   */
  findAsync(query, projection = {}) {
    const cursor2 = new Cursor2(this, query, (docs) => docs.map((doc) => model.deepCopy(doc)));
    cursor2.projection(projection);
    return cursor2;
  }
  /**
   * @callback Datastore~findOneCallback
   * @param {?Error} err
   * @param {document} doc
   */
  /**
   * Callback version of {@link Datastore#findOneAsync}.
   * @param {query} query
   * @param {projection|SingleDocumentCallback} [projection = {}]
   * @param {SingleDocumentCallback} [callback]
   * @return {Cursor<document>|undefined}
   * @see Datastore#findOneAsync
   */
  findOne(query, projection, callback) {
    if (arguments.length === 1) {
      projection = {};
    } else if (arguments.length === 2) {
      if (typeof projection === "function") {
        callback = projection;
        projection = {};
      }
    }
    const cursor2 = this.findOneAsync(query, projection);
    if (typeof callback === "function") callbackify(cursor2.execAsync.bind(cursor2))(callback);
    else return cursor2;
  }
  /**
   * Find one document matching the query.
   * We return the {@link Cursor} that the user can either `await` directly or use to can {@link Cursor#skip} before.
   * @param {query} query MongoDB-style query
   * @param {projection} projection MongoDB-style projection
   * @return {Cursor<document>}
   */
  findOneAsync(query, projection = {}) {
    const cursor2 = new Cursor2(this, query, (docs) => docs.length === 1 ? model.deepCopy(docs[0]) : null);
    cursor2.projection(projection).limit(1);
    return cursor2;
  }
  /**
   * See {@link Datastore#updateAsync} return type for the definition of the callback parameters.
   *
   * **WARNING:** Prior to 3.0.0, `upsert` was either `true` of falsy (but not `false`), it is now always a boolean.
   * `affectedDocuments` could be `undefined` when `returnUpdatedDocs` was `false`, it is now `null` in these cases.
   *
   * **WARNING:** Prior to 1.8.0, the `upsert` argument was not given, it was impossible for the developer to determine
   * during a `{ multi: false, returnUpdatedDocs: true, upsert: true }` update if it inserted a document or just updated
   * it.
   *
   * @callback Datastore~updateCallback
   * @param {?Error} err
   * @param {number} numAffected
   * @param {?document[]|?document} affectedDocuments
   * @param {boolean} upsert
   * @see {Datastore#updateAsync}
   */
  /**
   * Version without the using {@link Datastore~executor} of {@link Datastore#updateAsync}, use it instead.
   *
   * @param {query} query
   * @param {document|update} update
   * @param {Object} options
   * @param {boolean} [options.multi = false]
   * @param {boolean} [options.upsert = false]
   * @param {boolean} [options.returnUpdatedDocs = false]
   * @return {Promise<{numAffected: number, affectedDocuments: document[]|document|null, upsert: boolean}>}
   * @private
   * @see Datastore#updateAsync
   */
  async _updateAsync(query, update, options) {
    const multi = options.multi !== void 0 ? options.multi : false;
    const upsert = options.upsert !== void 0 ? options.upsert : false;
    if (upsert) {
      const cursor2 = new Cursor2(this, query);
      const docs = await cursor2.limit(1)._execAsync();
      if (docs.length !== 1) {
        let toBeInserted;
        try {
          model.checkObject(update);
          toBeInserted = update;
        } catch (e) {
          toBeInserted = model.modify(model.deepCopy(query, true), update);
        }
        const newDoc = await this._insertAsync(toBeInserted);
        return { numAffected: 1, affectedDocuments: newDoc, upsert: true };
      }
    }
    let numReplaced = 0;
    let modifiedDoc;
    const modifications = [];
    let createdAt;
    const candidates = await this._getCandidatesAsync(query);
    for (const candidate of candidates) {
      if (model.match(candidate, query) && (multi || numReplaced === 0)) {
        numReplaced += 1;
        if (this.timestampData) {
          createdAt = candidate.createdAt;
        }
        modifiedDoc = model.modify(candidate, update);
        if (this.timestampData) {
          modifiedDoc.createdAt = createdAt;
          modifiedDoc.updatedAt = /* @__PURE__ */ new Date();
        }
        modifications.push({ oldDoc: candidate, newDoc: modifiedDoc });
      }
    }
    this._updateIndexes(modifications);
    const updatedDocs = modifications.map((x) => x.newDoc);
    await this.persistence.persistNewStateAsync(updatedDocs);
    if (!options.returnUpdatedDocs) return { numAffected: numReplaced, upsert: false, affectedDocuments: null };
    else {
      let updatedDocsDC = [];
      updatedDocs.forEach((doc) => {
        updatedDocsDC.push(model.deepCopy(doc));
      });
      if (!multi) updatedDocsDC = updatedDocsDC[0];
      return { numAffected: numReplaced, affectedDocuments: updatedDocsDC, upsert: false };
    }
  }
  /**
   * Callback version of {@link Datastore#updateAsync}.
   * @param {query} query
   * @param {document|*} update
   * @param {Object|Datastore~updateCallback} [options|]
   * @param {boolean} [options.multi = false]
   * @param {boolean} [options.upsert = false]
   * @param {boolean} [options.returnUpdatedDocs = false]
   * @param {Datastore~updateCallback} [callback]
   * @see Datastore#updateAsync
   *
   */
  update(query, update, options, callback) {
    if (typeof options === "function") {
      callback = options;
      options = {};
    }
    const _callback = (err, res = {}) => {
      if (callback) callback(err, res.numAffected, res.affectedDocuments, res.upsert);
    };
    callbackify((query2, update2, options2) => this.updateAsync(query2, update2, options2))(query, update, options, _callback);
  }
  /**
   * Update all docs matching query.
   * @param {query} query is the same kind of finding query you use with `find` and `findOne`.
   * @param {document|*} update specifies how the documents should be modified. It is either a new document or a
   * set of modifiers (you cannot use both together, it doesn't make sense!). Using a new document will replace the
   * matched docs. Using a set of modifiers will create the fields they need to modify if they don't exist, and you can
   * apply them to subdocs. Available field modifiers are `$set` to change a field's value, `$unset` to delete a field,
   * `$inc` to increment a field's value and `$min`/`$max` to change field's value, only if provided value is
   * less/greater than current value. To work on arrays, you have `$push`, `$pop`, `$addToSet`, `$pull`, and the special
   * `$each` and `$slice`.
   * @param {Object} [options = {}] Optional options
   * @param {boolean} [options.multi = false] If true, can update multiple documents
   * @param {boolean} [options.upsert = false] If true, can insert a new document corresponding to the `update` rules if
   * your `query` doesn't match anything. If your `update` is a simple object with no modifiers, it is the inserted
   * document. In the other case, the `query` is stripped from all operator recursively, and the `update` is applied to
   * it.
   * @param {boolean} [options.returnUpdatedDocs = false] (not Mongo-DB compatible) If true and update is not an upsert,
   * will return the array of documents matched by the find query and updated. Updated documents will be returned even
   * if the update did not actually modify them.
   * @return {Promise<{numAffected: number, affectedDocuments: document[]|document|null, upsert: boolean}>}
   * - `upsert` is `true` if and only if the update did insert a document, **cannot be true if `options.upsert !== true`**.
   * - `numAffected` is the number of documents affected by the update or insertion (if `options.multi` is `false` or `options.upsert` is `true`, cannot exceed `1`);
   * - `affectedDocuments` can be one of the following:
   *    - If `upsert` is `true`, the inserted document;
   *    - If `options.returnUpdatedDocs` is `false`, `null`;
   *    - If `options.returnUpdatedDocs` is `true`:
   *      - If `options.multi` is `false`, the updated document;
   *      - If `options.multi` is `true`, the array of updated documents.
   * @async
   */
  updateAsync(query, update, options = {}) {
    return this.executor.pushAsync(() => this._updateAsync(query, update, options));
  }
  /**
   * @callback Datastore~removeCallback
   * @param {?Error} err
   * @param {?number} numRemoved
   */
  /**
   * Internal version without using the {@link Datastore#executor} of {@link Datastore#removeAsync}, use it instead.
   *
   * @param {query} query
   * @param {object} [options]
   * @param {boolean} [options.multi = false]
   * @return {Promise<number>}
   * @private
   * @see Datastore#removeAsync
   */
  async _removeAsync(query, options = {}) {
    const multi = options.multi !== void 0 ? options.multi : false;
    const candidates = await this._getCandidatesAsync(query, true);
    const removedDocs = [];
    let numRemoved = 0;
    candidates.forEach((d) => {
      if (model.match(d, query) && (multi || numRemoved === 0)) {
        numRemoved += 1;
        removedDocs.push({ $$deleted: true, _id: d._id });
        this._removeFromIndexes(d);
      }
    });
    await this.persistence.persistNewStateAsync(removedDocs);
    return numRemoved;
  }
  /**
   * Callback version of {@link Datastore#removeAsync}.
   * @param {query} query
   * @param {object|Datastore~removeCallback} [options={}]
   * @param {boolean} [options.multi = false]
   * @param {Datastore~removeCallback} [cb = () => {}]
   * @see Datastore#removeAsync
   */
  remove(query, options, cb) {
    if (typeof options === "function") {
      cb = options;
      options = {};
    }
    const callback = cb || (() => {
    });
    callbackify((query2, options2) => this.removeAsync(query2, options2))(query, options, callback);
  }
  /**
   * Remove all docs matching the query.
   * @param {query} query MongoDB-style query
   * @param {object} [options={}] Optional options
   * @param {boolean} [options.multi = false] If true, can update multiple documents
   * @return {Promise<number>} How many documents were removed
   * @async
   */
  removeAsync(query, options = {}) {
    return this.executor.pushAsync(() => this._removeAsync(query, options));
  }
};
var datastore = Datastore$2;
const Datastore2 = datastore;
var nedb = Datastore2;
const Datastore$1 = /* @__PURE__ */ getDefaultExportFromCjs(nedb);
const HABITS_DB_PATH = path$1.join(
  app.getPath("userData"),
  "atomic_progress_templates.db"
);
const SESSIONS_DB_PATH = path$1.join(
  app.getPath("userData"),
  "atomic_progress_sessions.db"
);
new Datastore$1({
  filename: SESSIONS_DB_PATH,
  autoload: true
});
const HABITS_DB = new Datastore$1({
  filename: HABITS_DB_PATH,
  autoload: true
});
const createHabit = async () => {
  return await HABITS_DB.count({}, async (err, count) => {
    if (err) {
      console.error("Failed to count habits:", err);
      return;
    }
    if (count > 0) return;
    await HABITS_DB.insert({
      id: randomUUID(),
      name: "Wake-Up",
      type: "default",
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    });
  });
};
const getHabits = async () => {
  try {
    let habits = await HABITS_DB.findAsync({});
    if (habits.length <= 1) {
      await createHabit();
      habits = await HABITS_DB.findAsync({});
    }
    return habits;
  } catch (err) {
    throw new Error("Failed to fetch habits" + err);
  }
};
const getHabitsIpc = () => {
  ipcMain.handle("get-habits", async () => {
    const habits = await getHabits();
    return habits;
  });
};
const __dirname$1 = path$2.dirname(fileURLToPath(import.meta.url));
process.env.APP_ROOT = path$2.join(__dirname$1, "..");
const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
const MAIN_DIST = path$2.join(process.env.APP_ROOT, "dist-electron");
const RENDERER_DIST = path$2.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path$2.join(process.env.APP_ROOT, "public") : RENDERER_DIST;
let win;
function createWindow() {
  win = new BrowserWindow({
    icon: path$2.join(process.env.VITE_PUBLIC, "electron-vite.svg"),
    webPreferences: {
      preload: path$2.join(__dirname$1, "preload.mjs")
    }
  });
  win.webContents.on("did-finish-load", () => {
    win == null ? void 0 : win.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
  });
  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path$2.join(RENDERER_DIST, "index.html"));
  }
}
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
    win = null;
  }
});
app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
getHabitsIpc();
app.whenReady().then(createWindow);
export {
  MAIN_DIST,
  RENDERER_DIST,
  VITE_DEV_SERVER_URL
};
