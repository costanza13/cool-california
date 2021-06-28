const router = require('express').Router();
const sequelize = require('../config/connection');
const { Op } = require('sequelize');
const { Post, User, Comment, PostTag, Tag, Vote } = require('../models');

const POST_IMAGE_WIDTH = 400;

router.get('/', (req, res) => {
  Post.findAll({
    attributes: [
      'id',
      'title',
      'description',
      'image_url',
      'latitude',
      'longitude',
      'created_at',
      [sequelize.literal('(SELECT COUNT(*) FROM vote WHERE post.id = vote.post_id AND `like`)'), 'likes'],
      [sequelize.literal('(SELECT COUNT(*) FROM vote WHERE post.id = vote.post_id AND NOT `like`)'), 'dislikes'],
      [sequelize.literal('(SELECT COUNT(*) FROM comment WHERE post.id = comment.post_id)'), 'comment_count']
    ],
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
        if (post.votes[0] && post.votes[0].like) {
          post.liked = true;
        } else if (post.votes[0] && post.votes[0].like === false) {
          post.unliked = true;
        } else {
          post.novote = true;
        }
      });
      res.render('homepage', { posts, loggedIn: req.session.loggedIn });
    })
    .catch(err => {
      console.log(err);
      res.status(500).json(err);
    });
});

router.get('/user/:id', (req, res) => {
  Post.findAll({
    where: {
      user_id: req.params.id
    },
    attributes: [
      'id',
      'title',
      'description',
      'image_url',
      'latitude',
      'longitude',
      'created_at',
      [sequelize.literal('(SELECT COUNT(*) FROM vote WHERE post.id = vote.post_id AND `like`)'), 'likes'],
      [sequelize.literal('(SELECT COUNT(*) FROM vote WHERE post.id = vote.post_id AND NOT `like`)'), 'dislikes'],
      [sequelize.literal('(SELECT COUNT(*) FROM comment WHERE post.id = comment.post_id)'), 'comment_count']
    ],
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
              } else {
                post.novote = true;
              }
            });
            const nickname = dbUserData.dataValues.nickname;
            res.render('homepage', { posts, loggedIn: req.session.loggedIn, nickname, nextUrl: '/user/' + req.params.id });
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

router.get('/tag/:id', (req, res) => {
  PostTag.findAll({
    where: {
      tag_id: req.params.id
    },
    attributes: ['post_id']
  })
    .then(taggedPostIds => {
      const postIds = taggedPostIds.map(postTag => postTag.get({ plain: true }).post_id);
      return Post.findAll({
        where: {
          id: { [Op.in]: postIds }
        },
        attributes: [
          'id',
          'title',
          'description',
          'image_url',
          'latitude',
          'longitude',
          'created_at',
          [sequelize.literal('(SELECT COUNT(*) FROM vote WHERE post.id = vote.post_id AND `like`)'), 'likes'],
          [sequelize.literal('(SELECT COUNT(*) FROM vote WHERE post.id = vote.post_id AND NOT `like`)'), 'dislikes'],
          [sequelize.literal('(SELECT COUNT(*) FROM comment WHERE post_id = comment.post_id)'), 'comment_count']
        ],
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
      })
    })
    .then(dbPostData => {
      const posts = dbPostData.map(post => post.get({ plain: true }));
      posts.forEach(post => {
        post.image_url_sized = post.image_url ? post.image_url.replace('upload/', 'upload/' + `c_scale,w_${POST_IMAGE_WIDTH}/`) : '';
        if (post.votes[0] && post.votes[0].like) {
          post.liked = true;
        } else if (post.votes[0] && post.votes[0].like === false) {
          post.unliked = true;
        } else {
          post.novote = true;
        }
      });
      // const tag = tagResults.tag_name;
      const tag = 'shoe';
      console.log('tag posts', posts);
      res.render('homepage', { posts, loggedIn: req.session.loggedIn, tag, nextUrl: '/tag/' + req.params.id });
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
  Post.findOne({
    where: {
      id: req.params.id
    },
    attributes: [
      'id',
      'title',
      'description',
      'image_url',
      'latitude',
      'longitude',
      'created_at',
      [sequelize.literal('(SELECT COUNT(*) FROM vote WHERE post.id = vote.post_id AND `like`)'), 'likes'],
      [sequelize.literal('(SELECT COUNT(*) FROM vote WHERE post.id = vote.post_id AND NOT `like`)'), 'dislikes'],
      [sequelize.literal('(SELECT COUNT(*) FROM comment WHERE post.id = comment.post_id)'), 'comment_count']
    ],
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
          attributes: ['username']
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
      } else {
        post.novote = true;
      }
      post.loggedIn = req.session.loggedIn;
      post.comments.loggedIn = req.session.loggedIn;
      console.log(post);
    
      res.render('single-post', post);
    })
    .catch(err => {
      console.log(err);
      res.status(500).json(err);
    });
});

module.exports = router;
