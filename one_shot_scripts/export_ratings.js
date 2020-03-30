const mongoose = require('mongoose');
const fs = require('fs');
const CardRating = require('../models/cardrating');
const mongosecrets = require('../../cubecobrasecrets/mongodb');
const carddb = require('../serverjs/cards.js');

const batchSize = 100;
(async () => {
  await carddb.initializeCardDb();

  mongoose.connect(mongosecrets.connectionString).then(async () => {
    console.log(`starting...`);
    const count = await CardRating.countDocuments();
    console.log(`counted...`);
    const cursor = CardRating.find()
      .lean()
      .cursor();

    console.log(`${count} documents to export`);
    let index = 0;
    // batch them
    for (let i = 0; i < count; i += batchSize) {
      const queries = [];
      for (let j = 0; j < batchSize; j++) {
        if (i + j < count) {
          try {
            // eslint-disable-next-line no-await-in-loop
            const rating = await cursor.next();
            if (rating) {
              // eslint-disable-next-line no-await-in-loop
              queries.push(rating);
            }
          } catch (err) {
            console.error(err);
          }
        }
      }
      console.log(`Writing... ${Math.min(count, i + batchSize)} of ${count} ratings`);
      try {
        // eslint-disable-next-line no-await-in-loop
        const data = await Promise.all(queries);
        fs.writeFileSync(`private/export/rating/rating.${index}.json`, JSON.stringify(data));
      } catch (err) {
        console.error(err);
      }
      index += 1;
    }
    mongoose.disconnect();
    console.log('done');
    process.exit();
  });
})();
