const sequelize = require('../config/connection');
const { Post, User, Comment, PostTag, UserTag, Tag, Vote } = require('../models');

const POST_IMAGE_WIDTH = 400;

const getPostQueryAttributes = function (session) {
  // post attributes we want to see
  const attributes = [
    'id',
    'title',
    'description',
    'image_url',
    'latitude',
    'longitude',
    'map_url',
    'created_at',
    [sequelize.literal('(SELECT COUNT(*) FROM vote WHERE post.id = vote.post_id AND `like`)'), 'likes'],
    [sequelize.literal('(SELECT COUNT(*) FROM vote WHERE post.id = vote.post_id AND NOT `like`)'), 'dislikes'],
    [sequelize.literal('(SELECT COUNT(*) FROM comment WHERE post.id = comment.post_id)'), 'comment_count'],
  ];

  // apply user-specific parameters
  if (session.loggedIn) {
    attributes.push(
      [sequelize.literal('(SELECT `like` FROM vote WHERE vote.post_id = post.id AND vote.user_id = ' + session.user_id + ')'), 'vote']
    )
  }

  return attributes;
};

const getPostQueryInclude = function () {
  return [
    {
      model: Tag,
      attributes: [['id', 'tag_id'], 'tag_name'],
      through: {
        model: PostTag,
        attributes: []
      }
    },
    {
      model: User,
      attributes: [['id', 'post_author_id'], ['nickname', 'post_author']]
    }
  ]
}

const processPostsDbData = function (postsData, session) {
  // clean out the extra stuff Sequelize returns with the data
  const posts = postsData.map(post => post.get({ plain: true }));

  // add some data to each post
  posts.forEach(post => {
    // add the url of a scaled (by Cloudinary) post image
    post.image_url_sized = post.image_url ? post.image_url.replace('upload/', 'upload/' + `c_scale,w_${POST_IMAGE_WIDTH}/`) : '';

    // calculate the "like score" -- for now, just likes minus dislikes
    post.like_score = post.likes - post.dislikes;

    // add a flag for whether the post was liked or disliked
    if (session.loggedIn) {
      if (post.vote === 1) {
        post.liked = true;
      } else if (post.vote === 0) {
        post.disliked = true;
      }
    }
  });

  return posts;
};

const sortPosts = function (posts, query) {
  return posts;
}

module.exports = { getPostQueryAttributes, getPostQueryInclude, processPostsDbData, sortPosts };