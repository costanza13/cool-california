const router = require('express').Router();
const sequelize = require('../config/connection');
const { Op } = require('sequelize');
const { Post, User, Comment, PostTag, Tag, Vote } = require('../models');

const POST_IMAGE_WIDTH = 400;

router.get('/', (req, res) => {

  // user filters
  let voteFilter = null;

  // post attributes we want to see
  const attributes = [
    'id',
    'title',
    'description',
    'image_url',
    'latitude',
    'longitude',
    'created_at',
    [sequelize.literal('(SELECT COUNT(*) FROM vote WHERE post.id = vote.post_id AND `like`)'), 'likes'],
    [sequelize.literal('(SELECT COUNT(*) FROM vote WHERE post.id = vote.post_id AND NOT `like`)'), 'dislikes'],
    [sequelize.literal('(SELECT COUNT(*) FROM comment WHERE post.id = comment.post_id)'), 'comment_count'],
  ];

  // apply user-specific parameters
  if (req.session.loggedIn) {
    attributes.push(
      [sequelize.literal('(SELECT `like` FROM vote WHERE vote.post_id = post.id AND vote.user_id = ' + req.session.user_id + ')'), 'vote']
    )

    if (typeof req.query.like !== 'undefined' && !isNaN(parseInt(req.query.like))) {
      voteFilter = { like: req.query.like, user_id: req.session.user_id };
    }
  }

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
        where: voteFilter,
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
        }
      });
      console.log('home posts', posts);
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

router.get('/tag/:tag_name', (req, res) => {
  const where = {};
  const multiTags = req.params.tag_name.split(',');
  if (multiTags.length) {
    where.tag_name = { [Op.in]: multiTags };
  } else {
    res.status(400).send('Bad request');
  }

  Tag.findAll({
    where,
    attributes: ['id', 'tag_name'],
    include: {
      model: Post,
      through: {
        model: PostTag,
        attributes: []
      },
      attributes: ['id']
    }
  })
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
      console.log('PULL IT OUT OF HERE', postIds);
      return Post.findAll({
        where: { id: { [Op.in]: postIds } },
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
      });
    })
    .then(dbTagPostData => {
      // console.log('MCCMCCMCC multi tag', dbTagPostData);
      let posts = dbTagPostData.map(tag => tag.get({ plain: true }));
      console.log('MCCMCCMCC multi tag', posts);

      
      /***************************************************/
      // JEFF -- Insert the sorting logic down here  vvv
      /***************************************************/
      // posts = posts.sort((a, b) => a.created_at > b.created_at ? 1 : -1); // << JEFF - this created_at sort is no longer needed, but you can use it as an example


      // console.log('MCCMCCMCC multi tag posts', posts);
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
      const tag_string = req.params.tag_name;
      const homepageData = { posts, loggedIn: req.session.loggedIn, tag_string, nextUrl: '/tag/' + req.params.id };
      console.log('homepage data', homepageData);
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
