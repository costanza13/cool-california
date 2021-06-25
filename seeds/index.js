const seedUsers = require('./user-seeds');
const seedTags = require('./tag-seeds');
const seedPosts = require('./post-seeds');
const seedPostTags = require('./post-tag-seeds');
const seedUserTags = require('./user-tag-seeds');

const sequelize = require('../config/connection');

const seedAll = async () => {
  await sequelize.sync({ force: true });
  console.log('\n----- DATABASE SYNCED -----\n');

  await seedUsers();
  console.log('\n----- USERS SEEDED -----\n');

  await seedTags();
  console.log('\n----- TAGS SEEDED -----\n');

  await seedPosts();
  console.log('\n----- POSTS SEEDED -----\n');

  await seedPostTags();
  console.log('\n----- POST TAGS SEEDED -----\n');

  await seedUserTags();
  console.log('\n----- USER TAGS SEEDED -----\n');

  process.exit(0);
};

seedAll();