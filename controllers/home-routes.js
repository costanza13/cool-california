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
}

const sortPosts = function (posts, orderBy) {
  return posts;
}

router.get('/', (req, res) => {

  const attributes = getPostQueryAttributes(req.session);

  Post.findAll({
    attributes,
    order: [['created_at', 'DESC'], ['id', 'DESC']],
    include: [
      {
        model: Tag,
        attributes: [['id', 'tag_id'], 'tag_name'],
        through: {
          model: PostTag,
          attributes: []
        },
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
  })
    .then(dbPostData => {
      const posts = dbPostData.map(post => post.get({ plain: true }));
      posts.forEach(post => {
        post.image_url_sized = post.image_url ? post.image_url.replace('upload/', 'upload/' + `c_scale,w_${POST_IMAGE_WIDTH}/`) : '';
        if (req.session.loggedIn) {
          if (post.vote === 1) {
            post.liked = true;
          } else if (post.vote === 0) {
            post.unliked = true;
          }
          post.can_vote = true;
        }
      });
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

  Post.findAll({
    where: {
      user_id: req.params.id
    },
    attributes,
    order: [['created_at', 'DESC'], ['id', 'DESC']],
    include: [
      {
        model: Tag,
        attributes: [['id', 'tag_id'], 'tag_name'],
        through: {
          model: PostTag,
          attributes: []
        },
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
            const posts = dbPostData.map(post => post.get({ plain: true }));
            posts.forEach(post => {
              post.image_url_sized = post.image_url ? post.image_url.replace('upload/', 'upload/' + `c_scale,w_${POST_IMAGE_WIDTH}/`) : '';
              if (post.votes[0] && post.votes[0].like) {
                post.liked = true;
              } else if (post.votes[0] && post.votes[0].like === false) {
                post.unliked = true;
              }
            });
            const nickname = dbUserData.dataValues.nickname;
            res.render('homepage', { posts, loggedIn: req.session.loggedIn, title: nickname + "'s Places", nextUrl: '/user/' + req.params.id });
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

      const postsQuery = {
        attributes,
        order: [['created_at', 'DESC'], ['id', 'DESC']],
        include: [
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
      };

      if (postIds.length) {
        postsQuery.where = { id: { [Op.in]: postIds } };
      }

      return Post.findAll(postsQuery);
    })
}

router.get('/tag/:tag_name', (req, res) => {
  findByTag(req.params.tag_name, req.session)
    .then(dbTagPostData => {
      let posts = dbTagPostData.map(tag => tag.get({ plain: true }));

      const orderBy = 'whatever';
      posts = sortPosts(posts, req.query);

      posts.forEach(post => {
        post.image_url_sized = post.image_url ? post.image_url.replace('upload/', 'upload/' + `c_scale,w_${POST_IMAGE_WIDTH}/`) : '';
        if (post.votes[0] && post.votes[0].like) {
          post.liked = true;
        } else if (post.votes[0] && post.votes[0].like === false) {
          post.unliked = true;
        }
      });
      const tag_string = req.params.tag_name.split(',').join(', ');
      const homepageData = { posts, loggedIn: req.session.loggedIn, title: "Places for " + tag_string, nextUrl: '/tag/' + req.params.id };
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
        .then(dbTagPostData => {
          // console.log('MCCMCCMCC multi tag', dbTagPostData);
          let posts = dbTagPostData.map(tag => tag.get({ plain: true }));

          const orderBy = 'whatever';
          posts = sortPosts(posts, req.query);

          posts.forEach(post => {
            post.image_url_sized = post.image_url ? post.image_url.replace('upload/', 'upload/' + `c_scale,w_${POST_IMAGE_WIDTH}/`) : '';
            if (post.votes[0] && post.votes[0].like) {
              post.liked = true;
            } else if (post.votes[0] && post.votes[0].like === false) {
              post.unliked = true;
            }
          });
          const tag_string = byTags ? byTags.split(',').join(', ') : 'any interest';
          const homepageData = { posts, loggedIn: req.session.loggedIn, title: "Places for " + tag_string, nextUrl: '/tag/' + req.params.id };
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

      return Post.findAll({
        where: {
          id: { [Op.in]: postIds }
        },
        attributes,
        order: [['created_at', 'DESC'], ['id', 'DESC']],
        include: [
          {
            model: Tag,
            attributes: [['id', 'tag_id'], 'tag_name'],
            through: {
              model: PostTag,
              attributes: []
            },
          },
          {
            model: User,
            attributes: [['id', 'post_author_id'], ['nickname', 'post_author']]
          },
          {
            model: Vote,
            attributes: [['id', 'vote_id'], 'like']
          }
        ]
      });
    });
};

router.get('/likes', withAuth, (req, res) => {
  getVoted('likes', req.session)
    .then(dbPostData => {
      const posts = dbPostData.map(post => post.get({ plain: true }));
      posts.forEach(post => {
        post.image_url_sized = post.image_url ? post.image_url.replace('upload/', 'upload/' + `c_scale,w_${POST_IMAGE_WIDTH}/`) : '';
        post.liked = true;
      });
      const homepageData = { posts, loggedIn: req.session.loggedIn, title: 'Places you like', nextUrl: '/likes' + req.params.id };
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

  Post.findOne({
    where: {
      id: req.params.id
    },
    attributes,
    include: [
      {
        model: Tag,
        attributes: [['id', 'tag_id'], 'tag_name'],
        through: {
          model: PostTag,
          attributes: []
        },
      },
      {
        model: User,
        attributes: [['id', 'post_author_id'], ['nickname', 'post_author']]
      },
      {
        model: Comment,
        attributes: ['id', 'comment_text', 'post_id', 'user_id', 'created_at'],
        include: {
          model: User,
          attributes: ['nickname']
        }
      },
      {
        model: Vote,
        attributes: ['like']
      }
    ]
  })
    .then(dbPostData => {
      const post = dbPostData.get({ plain: true });
      if (post.votes[0] && post.votes[0].like) {
        post.liked = true;
      } else if (post.votes[0] && post.votes[0].like === false) {
        post.unliked = true;
      }
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
