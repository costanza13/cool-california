const sequelize = require('../config/connection');
const { User } = require('../models');

const userdata = [
  {
    username: 'bgerner',
    email: 'brgerner@gmail.com',
    password: 'password123'
  },
  {
    username: 'costanza13',
    email: 'costanza13@gmail.com',
    password: 'password123'
  },
  {
    username: 'follestad',
    email: 'follestad@gmail.com',
    password: 'password123'
  },
  {
    username: 'obi',
    email: 'obi@gmail.com',
    password: 'password123'
  },
  {
    username: 'trae-young',
    email: 'tyoung@gmail.com',
    password: 'password123'
  },
  {
    username: 'j-cole',
    email: 'jcole@gmail.com',
    password: 'password123'
  },
  {
    username: 'tyler-childers',
    email: 'tchilders@gmail.com',
    password: 'password123'
  }
];

const seedUsers = () => User.bulkCreate(userdata, {individualHooks: true});

module.exports = seedUsers;
