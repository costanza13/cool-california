const router = require('express').Router();
const sequelize = require('../config/connection');
const { Post, User, Comment, PostTag, Tag } = require('../models');

router.get('/', (req, res) => {
  console.log(req.session);
  Post.findAll({
    attributes: [
      'id',
      'title',
      'description',
      'image_url',
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
      }
    ]
  })
    .then(dbPostData => {
      const posts = dbPostData.map(post => post.get({ plain: true }));
      // console.log('post tags', posts[0].tags);
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
  Tag.findOne({
    where: {
      id: req.params.id
    },
    attributes: [['id', 'tag_id'], 'tag_name'],
    include: [
      {
        model: Post,
        attributes: [
          'id',
          'title',
          'description',
          'image_url',
          'created_at',
          [sequelize.literal('(SELECT COUNT(*) FROM vote WHERE post_id = vote.post_id AND `like`)'), 'likes'],
          [sequelize.literal('(SELECT COUNT(*) FROM vote WHERE post_id = vote.post_id AND NOT `like`)'), 'dislikes'],
          [sequelize.literal('(SELECT COUNT(*) FROM comment WHERE post_id = comment.post_id)'), 'comment_count']
        ],
        order: [['created_at', 'DESC'], ['id', 'DESC']],
        through: {
          model: PostTag,
          attributes: []
        },
        include: [
          {
            model: User,
            attributes: [['id', 'post_author_id'], ['nickname', 'post_author']]
          },
          {
            model: Tag,
            attributes: [['id', 'tag_id'], 'tag_name'],
            through: {
              model: PostTag,
              attributes: []
            },
          }
        ]
      }
    ]
  })
    .then(dbPostData => {
      // console.log(dbPostData);
      const tagResults = dbPostData.get({ plain: true });
      console.log(tagResults);
      const posts = tagResults.posts;
      const tag = tagResults.tag_name;
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
      }
    ]
  })
    .then(dbPostData => {
      const post = dbPostData.get({ plain: true });
      console.log('MCC - post:', post);
      res.render('single-post', { post, loggedIn: req.session.loggedIn });
    })
    .catch(err => {
      console.log(err);
      res.status(500).json(err);
    });
});

module.exports = router;
