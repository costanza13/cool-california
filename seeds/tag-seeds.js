const { Tag } = require('../models');

const tagData = [
  {
    tag_name: 'climbing',
  },
  {
    tag_name: 'skiing',
  },
  {
    tag_name: 'hiking',
  },
  {
    tag_name: 'surfing',
  },
  {
    tag_name: 'biking',
  },
  {
    tag_name: 'chilling',
  },
  {
    tag_name: 'swimming'
  }
];

const seedTags = () => Tag.bulkCreate(tagData);

module.exports = seedTags;