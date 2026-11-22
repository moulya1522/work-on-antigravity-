const mongoose = require('mongoose');
const { getCollection } = require('../utils/jsonStore');

// Helper to wrap Mongoose model or fallback to JSON collection
const createDualModel = (modelName, collectionName, mongooseModel) => {
  const handler = {
    get(target, prop, receiver) {
      // Check if Mongoose is connected to MongoDB
      const isMongooseConnected = mongoose.connection.readyState === 1;

      if (isMongooseConnected) {
        return Reflect.get(mongooseModel, prop, receiver);
      }

      // Otherwise, use persistent local JSON store
      const collection = getCollection(collectionName);
      if (typeof collection[prop] === 'function') {
        return collection[prop].bind(collection);
      }
      return collection[prop];
    }
  };

  return new Proxy(mongooseModel, handler);
};

module.exports = { createDualModel };
