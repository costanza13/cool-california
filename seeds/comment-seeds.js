const { Comment } = require('../models');

const commentData = [
  {
    comment_text: "This rock looks dope! Gonna have to check it out this weekend",
    user_id: 1,
    post_id: 1
  },
  {
    comment_text: "Sweet",
    user_id: 4,
    post_id: 1
  },
  {
    comment_text: "Eagle Lake! Love this place, great trip for the whole family",
    user_id: 2,
    post_id: 2
  },
  {
    comment_text: "This place looks awesome!",
    user_id: 3,
    post_id: 2
  },
  {
    comment_text: "Skied this for the first time last year. Relatively short hike for some great turns!",
    user_id: 5,
    post_id: 3
  },
  {
    comment_text: "Love taking ice baths in here during the winter",
    user_id: 1,
    post_id: 4
  },
  {
    comment_text: "Elephant seals! Dope!",
    user_id: 7,
    post_id: 5
  },
  {
    comment_text: "Just went out there after seeing your post! Beautiful!",
    user_id: 7,
    post_id: 5
  },
  {
    comment_text: "Sat here and meditated for 6 hours. SERENE",
    user_id: 6,
    post_id: 6
  }
];

const seedComments = () => Comment.bulkCreate(commentData);

module.exports = seedComments;
