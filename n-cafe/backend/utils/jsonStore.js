const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

class Collection {
  constructor(name) {
    this.name = name;
    this.filePath = path.join(dataDir, `${name}.json`);
    this.data = this._load();
  }

  _load() {
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf8');
        return JSON.parse(raw);
      }
    } catch (e) {
      console.warn(`[Store] Could not read ${this.filePath}, resetting:`, e.message);
    }
    return [];
  }

  _save() {
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2), 'utf8');
    } catch (e) {
      console.error(`[Store] Failed to save ${this.filePath}:`, e.message);
    }
  }

  _generateId() {
    return Math.random().toString(16).substring(2, 10) +
      Math.random().toString(16).substring(2, 10) +
      Math.random().toString(16).substring(2, 10);
  }

  _wrapDoc(raw) {
    if (!raw) return null;
    const doc = { ...raw };
    
    // Add Mongoose compatibility helpers
    doc._id = String(doc._id || doc.id);
    doc.id = doc._id;

    // Add comparePassword if User collection
    if (this.name === 'users') {
      doc.comparePassword = async function (candidatePassword) {
        if (!doc.password) return false;
        return bcrypt.compare(candidatePassword, doc.password);
      };
      doc.toJSON = function () {
        const copy = { ...doc };
        delete copy.password;
        return copy;
      };
    }

    doc.save = async () => {
      doc.updatedAt = new Date().toISOString();
      const idx = this.data.findIndex(item => String(item._id) === String(doc._id));
      if (idx !== -1) {
        this.data[idx] = { ...doc };
        this._save();
      }
      return doc;
    };

    return doc;
  }

  findById(id) {
    const self = this;
    const queryObj = {
      _id: id,
      select() { return this; },
      populate() { return this; },
      async exec() {
        if (!this._id) return null;
        const found = self.data.find(item => String(item._id) === String(this._id) || String(item.id) === String(this._id));
        return self._wrapDoc(found);
      },
      then(resolve, reject) {
        this.exec().then(resolve).catch(reject);
      }
    };
    return queryObj;
  }

  find(query = {}) {
    const self = this;
    let sortCriteria = null;
    let skipCount = 0;
    let limitCount = 1000;

    const queryObj = {
      _query: query,
      sort(criteria) {
        sortCriteria = criteria;
        return this;
      },
      skip(count) {
        skipCount = Number(count) || 0;
        return this;
      },
      limit(count) {
        limitCount = Number(count) || 1000;
        return this;
      },
      select() { return this; },
      populate() { return this; },
      async exec() {
        let results = self.data.map(item => self._wrapDoc(item));

        if (this._query && Object.keys(this._query).length > 0) {
          results = results.filter(item => {
            for (const [key, value] of Object.entries(this._query)) {
              if (key === '$or' && Array.isArray(value)) {
                const match = value.some(subQuery => {
                  for (const [sKey, sVal] of Object.entries(subQuery)) {
                    const itemVal = sKey.includes('.')
                      ? sKey.split('.').reduce((acc, part) => acc && acc[part], item)
                      : item[sKey];

                    if (sVal instanceof RegExp) {
                      if (itemVal && sVal.test(String(itemVal))) return true;
                    } else if (typeof sVal === 'object' && sVal.$regex) {
                      const reg = new RegExp(sVal.$regex, sVal.$options || '');
                      if (itemVal && reg.test(String(itemVal))) return true;
                    } else if (itemVal === sVal) {
                      return true;
                    }
                  }
                  return false;
                });
                if (!match) return false;
              } else if (key === '$expr') {
                if (value.$lte) {
                  return Number(item.quantity) <= Number(item.minStockLevel);
                }
              } else if (key.includes('.')) {
                const val = key.split('.').reduce((acc, part) => acc && acc[part], item);
                if (value instanceof RegExp) {
                  if (!value.test(String(val))) return false;
                } else if (val !== value) {
                  return false;
                }
              } else if (value instanceof RegExp) {
                if (!value.test(String(item[key]))) return false;
              } else if (typeof value === 'object' && value !== null) {
                if (value.$ne !== undefined && item[key] === value.$ne) return false;
                if (value.$in !== undefined && !value.$in.includes(item[key])) return false;
                if (value.$gte !== undefined && new Date(item[key]) < new Date(value.$gte)) return false;
                if (value.$lte !== undefined && new Date(item[key]) > new Date(value.$lte)) return false;
                if (value.$regex !== undefined) {
                  const reg = new RegExp(value.$regex, value.$options || '');
                  if (!reg.test(String(item[key]))) return false;
                }
              } else if (item[key] !== value) {
                return false;
              }
            }
            return true;
          });
        }

        if (sortCriteria) {
          const [field, direction] = typeof sortCriteria === 'string'
            ? [sortCriteria.replace(/^-/, ''), sortCriteria.startsWith('-') ? -1 : 1]
            : Object.entries(sortCriteria)[0] || ['createdAt', -1];
          
          results.sort((a, b) => {
            let aVal = a[field];
            let bVal = b[field];
            if (field === 'createdAt' || field === 'updatedAt') {
              aVal = new Date(aVal || 0).getTime();
              bVal = new Date(bVal || 0).getTime();
            }
            if (aVal < bVal) return direction === -1 ? 1 : -1;
            if (aVal > bVal) return direction === -1 ? -1 : 1;
            return 0;
          });
        }

        results = results.slice(skipCount, skipCount + limitCount);
        return results;
      },
      then(resolve, reject) {
        this.exec().then(resolve).catch(reject);
      }
    };

    return queryObj;
  }

  findOne(query = {}) {
    const self = this;
    let selectedFields = null;
    let sortCriteria = null;

    const queryObj = {
      _query: query,
      sort(criteria) {
        sortCriteria = criteria;
        return this;
      },
      select(fields) {
        selectedFields = fields;
        return this;
      },
      populate(field, select) {
        return this;
      },
      async exec() {
        const findQuery = self.find(this._query);
        if (sortCriteria) findQuery.sort(sortCriteria);
        const queryRes = await findQuery;
        const item = (Array.isArray(queryRes) ? queryRes[0] : queryRes?._results?.[0]) || null;
        return self._wrapDoc(item);
      },
      then(resolve, reject) {
        this.exec().then(resolve).catch(reject);
      }
    };

    return queryObj;
  }

  async findById(id) {
    if (!id) return null;
    const found = this.data.find(item => String(item._id) === String(id) || String(item.id) === String(id));
    if (!found) return null;
    const wrapped = this._wrapDoc(found);
    return {
      ...wrapped,
      select: function () { return wrapped; },
      populate: function () { return wrapped; },
      then: function (resolve) { resolve(wrapped); }
    };
  }

  async create(docData) {
    const now = new Date().toISOString();
    const newDoc = {
      ...docData,
      _id: this._generateId(),
      createdAt: docData.createdAt ? new Date(docData.createdAt).toISOString() : now,
      updatedAt: docData.updatedAt ? new Date(docData.updatedAt).toISOString() : now
    };

    if (this.name === 'users' && newDoc.password) {
      if (!newDoc.password.startsWith('$2a$') && !newDoc.password.startsWith('$2b$')) {
        const salt = await bcrypt.genSalt(10);
        newDoc.password = await bcrypt.hash(newDoc.password, salt);
      }
    }

    this.data.unshift(newDoc);
    this._save();
    return this._wrapDoc(newDoc);
  }

  async insertMany(docs) {
    const inserted = [];
    for (const d of docs) {
      const created = await this.create(d);
      inserted.push(created);
    }
    return inserted;
  }

  async findByIdAndUpdate(id, updates, options = {}) {
    const idx = this.data.findIndex(item => String(item._id) === String(id) || String(item.id) === String(id));
    if (idx === -1) return null;

    const current = this.data[idx];
    const updated = {
      ...current,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    if (updates.$inc) {
      for (const [key, val] of Object.entries(updates.$inc)) {
        updated[key] = (Number(updated[key]) || 0) + Number(val);
      }
      delete updated.$inc;
    }

    if (this.name === 'users' && updates.password) {
      if (!updates.password.startsWith('$2a$') && !updates.password.startsWith('$2b$')) {
        const salt = await bcrypt.genSalt(10);
        updated.password = await bcrypt.hash(updates.password, salt);
      }
    }

    this.data[idx] = updated;
    this._save();
    return this._wrapDoc(updated);
  }

  async findByIdAndDelete(id) {
    const idx = this.data.findIndex(item => String(item._id) === String(id) || String(item.id) === String(id));
    if (idx === -1) return null;
    const removed = this.data.splice(idx, 1)[0];
    this._save();
    return this._wrapDoc(removed);
  }

  async deleteMany(query = {}) {
    if (!query || Object.keys(query).length === 0) {
      const count = this.data.length;
      this.data = [];
      this._save();
      return { deletedCount: count };
    }
    const before = this.data.length;
    // Keep items that don't match query
    this.data = this.data.filter(item => {
      for (const [k, v] of Object.entries(query)) {
        if (item[k] === v) return false;
      }
      return true;
    });
    this._save();
    return { deletedCount: before - this.data.length };
  }

  async countDocuments(query = {}) {
    const queryRes = await this.find(query);
    if (Array.isArray(queryRes)) return queryRes.length;
    if (queryRes && queryRes._results) return queryRes._results.length;
    return 0;
  }

  async aggregate(pipeline = []) {
    let results = this.data.map(item => ({ ...item }));

    for (const stage of pipeline) {
      if (stage.$match) {
        const match = stage.$match;
        results = results.filter(item => {
          for (const [k, v] of Object.entries(match)) {
            if (k === 'status') {
              if (v.$ne && item.status === v.$ne) return false;
              if (v.$in && !v.$in.includes(item.status)) return false;
            } else if (k === 'createdAt') {
              const itemDate = new Date(item.createdAt);
              if (v.$gte && itemDate < new Date(v.$gte)) return false;
              if (v.$lte && itemDate > new Date(v.$lte)) return false;
            } else if (item[k] !== v) {
              return false;
            }
          }
          return true;
        });
      } else if (stage.$group) {
        const { _id, ...accumulators } = stage.$group;
        const groups = {};

        results.forEach(item => {
          let groupKey = 'all';
          if (_id === null) {
            groupKey = 'all';
          } else if (typeof _id === 'string' && _id.startsWith('$')) {
            const field = _id.slice(1);
            groupKey = item[field] || 'unknown';
          } else if (typeof _id === 'object') {
            if (_id.$dateToString) {
              groupKey = item.createdAt ? item.createdAt.split('T')[0] : 'unknown';
            } else if (_id.$week) {
              const d = new Date(item.createdAt || 0);
              const oneJan = new Date(d.getFullYear(), 0, 1);
              const numberOfDays = Math.floor((d - oneJan) / (24 * 60 * 60 * 1000));
              groupKey = Math.ceil((d.getDay() + 1 + numberOfDays) / 7);
            } else if (_id.year && _id.month) {
              const d = new Date(item.createdAt || 0);
              groupKey = `${d.getFullYear()}-${d.getMonth() + 1}`;
            }
          }

          if (!groups[groupKey]) {
            groups[groupKey] = { _id: _id === null ? null : groupKey };
            for (const [accKey, accOp] of Object.entries(accumulators)) {
              groups[groupKey][accKey] = 0;
            }
          }

          for (const [accKey, accOp] of Object.entries(accumulators)) {
            if (accOp.$sum) {
              if (typeof accOp.$sum === 'number') {
                groups[groupKey][accKey] += accOp.$sum;
              } else if (typeof accOp.$sum === 'string' && accOp.$sum.startsWith('$')) {
                const f = accOp.$sum.slice(1);
                groups[groupKey][accKey] += Number(item[f]) || 0;
              }
            }
          }
        });

        results = Object.values(groups);
      } else if (stage.$unwind) {
        const field = stage.$unwind.replace('$', '');
        const unwound = [];
        results.forEach(item => {
          if (Array.isArray(item[field])) {
            item[field].forEach(sub => {
              unwound.push({ ...item, [field]: sub });
            });
          }
        });
        results = unwound;
      } else if (stage.$sort) {
        const [field, direction] = Object.entries(stage.$sort)[0] || ['_id', 1];
        results.sort((a, b) => {
          if (a[field] < b[field]) return direction === -1 ? 1 : -1;
          if (a[field] > b[field]) return direction === -1 ? -1 : 1;
          return 0;
        });
      } else if (stage.$limit) {
        results = results.slice(0, stage.$limit);
      }
    }

    return results;
  }
}

const collections = {};
const getCollection = (name) => {
  if (!collections[name]) {
    collections[name] = new Collection(name);
  }
  return collections[name];
};

module.exports = {
  getCollection
};
