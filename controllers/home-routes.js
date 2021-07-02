const router = require('express').Router();
const sequelize = require('../config/connection');
const { Op } = require('sequelize');
const { Post, User, Comment, PostTag, UserTag, Tag, Vote } = require('../models');
const { withAuth } = require('../utils/auth');

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
    },
    {
      model: Vote,
      attributes: ['like']
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

router.get('/', (req, res) => {

  const attributes = getPostQueryAttributes(req.session);
  const include = getPostQueryInclude();

  Post.findAll({
    attributes,
    order: [['created_at', 'DESC'], ['id', 'DESC']],
    include
  })
    .then(dbPostData => {
      let posts = processPostsDbData(dbPostData, req.session);
      posts = sortPosts(posts, req.query);

      // console.log('home posts', posts);
      res.render('homepage', { posts, title: "Awesome Places", loggedIn: req.session.loggedIn });
    })
    .catch(err => {
      console.log(err);
      res.status(500).json(err);
    });
});

router.get('/user/:id', (req, res) => {

  const attributes = getPostQueryAttributes(req.session);
  const include = getPostQueryInclude();

  Post.findAll({
    where: {
      user_id: req.params.id
    },
    attributes,
    order: [['created_at', 'DESC'], ['id', 'DESC']],
    include
  })
    .then(dbPostData => {
      User.findOne({
        where: {
          id: req.params.id
        },
        attributes: ['nickname']
      })
        .then(dbUserData => {
          if (dbUserData) {
            let posts = processPostsDbData(dbPostData, req.session);
            posts = sortPosts(posts, req.query);
            const nickname = dbUserData.dataValues.nickname;
            res.render('homepage', { posts, loggedIn: req.session.loggedIn, title: nickname + "'s Places", nextUrl: '/user/' + req.params.id, no_results: `${nickname} hasn't posted anything.` });
          } else {
            res.render('error', { status: 404, message: 'User not found' });
          }
        })
        .catch(err => {
          console.log(err);
          res.status(500).json(err);
        });
    })
    .catch(err => {
      console.log(err);
      res.status(500).json(err);
    });
});

const findByTag = function (tagString, session) {
  const tagsQuery = {
    attributes: ['id', 'tag_name'],
    include: {
      model: Post,
      through: {
        model: PostTag,
        attributes: []
      },
      attributes: ['id']
    }
  };

  const multiTags = tagString ? tagString.split(',') : [];
  if (multiTags.length) {
    tagsQuery.where = { tag_name: { [Op.in]: multiTags } };
  }

  return Tag.findAll(tagsQuery)
    .then(dbTagData => {
      const postIdArrays = dbTagData.map(tagData => tagData.get({ plain: true }).posts);
      let postIds = [];
      postIdArrays.forEach(postIdArr => {
        postIdArr.forEach(postId => {
          if (postIds.indexOf(postId.id) === -1) {
            postIds.push(postId.id);
          }
        })
      })

      const attributes = getPostQueryAttributes(session);
      const include = getPostQueryInclude();
      const postsQuery = {
        attributes,
        order: [['created_at', 'DESC'], ['id', 'DESC']],
        include
      };

      if (postIds.length) {
        postsQuery.where = { id: { [Op.in]: postIds } };
      } else if (tagString.length) {
        postsQuery.where = { id: 0 };
      }

      return Post.findAll(postsQuery);
    })
}

router.get('/tag/:tag_name', (req, res) => {
  findByTag(req.params.tag_name, req.session)
    .then(dbPostData => {
      let posts = processPostsDbData(dbPostData, req.session);
      posts = sortPosts(posts, req.query);

      const tag_string = req.params.tag_name.split(',').join(', ');
      const homepageData = { posts, loggedIn: req.session.loggedIn, title: "Places for " + tag_string, nextUrl: '/tag/' + req.params.tag_name, no_results: `No places match ${tag_string}.` };
      // console.log('homepage data', homepageData);
      res.render('homepage', homepageData);
    })
    .catch(err => {
      console.log(err);
      res.status(500).json(err);
    });
});

router.get('/interests', (req, res) => {

  User.findOne({
    where: {
      id: req.session.user_id
    },
    include: {
      model: Tag,
      attributes: ['id', 'tag_name'],
      through: {
        model: UserTag,
        attributes: []
      }
    }
  })
    .then(dbUserTagData => {
      const byTags = dbUserTagData.tags.map(tag => tag.get({ plain: true }).tag_name).join(',');
      // const byTags = req.query.tags ? req.query.tags : '';
      findByTag(byTags, req.session)
        .then(dbPostData => {
          // console.log('MCCMCCMCC multi tag', dbTagPostData);
          let posts = processPostsDbData(dbPostData, req.session);
          posts = sortPosts(posts, req.query);

          const tag_string = byTags ? byTags.split(',').join(', ') : 'any interest';
          const homepageData = { posts, loggedIn: req.session.loggedIn, title: "Places for " + tag_string, nextUrl: '/interests', no_results: `No places match your interests.` };
          // console.log('homepage data', homepageData);
          res.render('homepage', homepageData);
        })
        .catch(err => {
          console.log(err);
          res.status(500).json(err);
        });
    });
});

const getVoted = function (type, session) {
  return Vote.findAll({
    where: {
      user_id: session.user_id,
      like: { [Op.is]: (type === 'likes') }
    },
    attributes: ['post_id']
  })
    .then(votedPostIds => {
      const postIds = votedPostIds.map(postVote => postVote.get({ plain: true }).post_id);

      const attributes = getPostQueryAttributes(session);
      const include = getPostQueryInclude();

      return Post.findAll({
        where: {
          id: { [Op.in]: postIds }
        },
        attributes,
        order: [['created_at', 'DESC'], ['id', 'DESC']],
        include
      });
    });
};

router.get('/likes', withAuth, (req, res) => {
  getVoted('likes', req.session)
    .then(dbPostData => {
      let posts = processPostsDbData(dbPostData, req.session);
      posts = sortPosts(posts, req.query);
      const homepageData = { posts, loggedIn: req.session.loggedIn, title: 'Places you like', nextUrl: '/likes' + req.params.id, no_results: "You haven't liked any places yet." };
      // console.log('homepage data', homepageData);
      res.render('homepage', homepageData);
    })
    .catch(err => {
      console.log(err);
      res.status(500).json(err);
    });
});

router.get('/login', (req, res) => {
  if (req.session.loggedIn) {
    res.redirect('/');
    return;
  }
  res.render('login');
});

router.get('/post/:id', (req, res) => {

  const attributes = getPostQueryAttributes(req.session);
  const include = getPostQueryInclude();
  include.push({
    model: Comment,
    attributes: ['id', 'comment_text', 'post_id', 'user_id', 'created_at'],
    include: {
      model: User,
      attributes: ['nickname']
    }
  });

  Post.findOne({
    where: { id: req.params.id },
    attributes,
    include
  })
    .then(dbPostData => {
      const post = processPostsDbData([dbPostData], req.session)[0];
      post.loggedIn = req.session.loggedIn;
      // console.log(post);
      res.render('single-post', post);
    })
    .catch(err => {
      console.log(err);
      res.status(500).json(err);
    });
});

module.exports = router;
