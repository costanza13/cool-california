const { Vote } = require('../models');

const voteData = [
  {
    like: true,
    user_id: 4,
    post_id: 2
  },
  {
    like: true,
    user_id: 2,
    post_id: 4
  },
  {
    like: true,
    user_id: 2,
    post_id: 2
  }
];

const seedVotes = () => Vote.bulkCreate(voteData);

module.exports = seedVotes;