const sequelize = require('../config/connection');
const { User } = require('../models');

const userdata = [
  {
    username: 'bgerner',
    email: 'brgerner@gmail.com',
    nickname: 'Ben',
    password: 'password123'
  },
  {
    username: 'costanza13',
    email: 'costanza@gmail.com',
    nickname: 'MCC',
    password: 'password123'
  },
  {
    username: 'follestad',
    email: 'follestad@gmail.com',
    nickname: 'Jeff',
    password: 'password123'
  },
  {
    username: 'obi',
    email: 'obi@gmail.com',
    nickname: 'Obi',
    password: 'password123'
  },
  {
    username: 'trae-young',
    email: 'tyoung@gmail.com',
    nickname: 'Trae',
    password: 'password123'
  },
  {
    username: 'j-cole',
    email: 'jcole@gmail.com',
    nickname: 'Jay',
    password: 'password123'
  },
  {
    username: 'tyler-childers',
    email: 'tchilders@gmail.com',
    nickname: 'Tyler',
    password: 'password123'
  }
];

const seedUsers = async () => {
  for (let i = 0; i < userdata.length; i++) {
    await User.create(userdata[i], { individualHooks: true });
  }
}


module.exports = seedUsers;
