const router = require('express').Router();
const sequelize = require('../config/connection');
const { Op } = require('sequelize');
const { Post, User, Comment, Tag, PostTag, Vote, UserTag } = require('../models');
const { withAuth } = require('../utils/auth');

const POST_IMAGE_WIDTH = 400;

router.get('/', withAuth, (req, res) => {
  User.findOne({
    where: {
      id: req.session.user_id
    },
    attributes: [
      'id',
      'nickname',
      'email',
      [sequelize.literal('(SELECT COUNT(*) FROM vote WHERE user.id = vote.user_id AND `like`)'), 'likes_count'],
      [sequelize.literal('(SELECT COUNT(*) FROM vote WHERE user.id = vote.user_id AND NOT`like`)'), 'dislikes_count']
    ],
    include: [
      {
        model: Tag,
        attributes: [['id', 'tag_id'], 'tag_name'],
        through: {
          model: UserTag,
          attributes: []
        }
      }
    ]
  })
    .then(dbUserData => {
      const user = dbUserData.get({ plain: true });
      return Post.findAll({
        where: {
          user_id: req.session.user_id
        },
        attributes: [
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
            attributes: [['id', 'vote_id'], 'like']
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
            }
          });
          return { user, posts };
        });
    })
    .then(({ user, posts }) => {
      const selectedTagIds = user.tags.map(tag => tag.tag_id);
      return Tag.findAll({
        attributes: [['id', 'tag_id'], 'tag_name'],
        order: [['tag_name', 'ASC']]
      })
        .then(dbTagData => {
          const allTags = dbTagData.map(tag => {
            const merged = tag.get({ plain: true });
            merged.selected = selectedTagIds.includes(merged.tag_id);
            return merged;
          });

          const dashboard = { user, posts, other_tags: allTags, loggedIn: req.session.loggedIn };
          // console.log('dashboard data', dashboard);
          res.render('dashboard-posts', dashboard);
        })
    })
    .catch(err => {
      console.log(err);
      res.status(500).json(err);
    });
});

const getVoted = function (req, type) {
  return Vote.findAll({
    where: {
      user_id: req.session.user_id,
      like: { [Op.is]: (type === 'likes') }
    },
    attributes: ['post_id']
  })
    .then(votedPostIds => {
      const postIds = votedPostIds.map(postVote => postVote.get({ plain: true }).post_id);
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
          'map_url',
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
            attributes: [['id', 'vote_id'], 'like']
          }
        ]
      });
    });
};

router.get('/likes', withAuth, (req, res) => {
  getVoted(req, 'likes')
    .then(dbPostData => {
      const posts = dbPostData.map(post => post.get({ plain: true }));
      posts.forEach(post => {
        post.image_url_sized = post.image_url ? post.image_url.replace('upload/', 'upload/' + `c_scale,w_${POST_IMAGE_WIDTH}/`) : '';
        post.liked = true;
      });
      res.render('dashboard-likes', { posts, tab: 'Liked', loggedIn: req.session.loggedIn });
    })
    .catch(err => {
      console.log(err);
      res.status(500).json(err);
    });
});

router.get('/dislikes', withAuth, (req, res) => {
  getVoted(req, 'dislikes')
    .then(dbPostData => {
      const posts = dbPostData.map(post => post.get({ plain: true }));
      console.log('disliked posts', posts);
      posts.forEach(post => {
        post.image_url_sized = post.image_url ? post.image_url.replace('upload/', 'upload/' + `c_scale,w_${POST_IMAGE_WIDTH}/`) : '';
        post.unliked = true;
      });
      res.render('dashboard-likes', { posts, tab: 'Disliked', loggedIn: req.session.loggedIn });
    })
    .catch(err => {
      console.log(err);
      res.status(500).json(err);
    });
});

router.get('/create', withAuth, (req, res) => {
  const post = {
    id: 0,
    title: '',
    body: '',
  };
  Tag.findAll({
    attributes: ['id', 'tag_name']
  })
    .then(dbTagData => {
      const tags = dbTagData.map(tag => tag.get({ plain: true }));
      res.render('edit-post', { post, tags, loggedIn: req.session.loggedIn });
    });
});

router.get('/edit/:id', withAuth, (req, res) => {
  Post.findOne({
    where: {
      id: req.params.id,
      user_id: req.session.user_id
    },
    attributes: [
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
      [sequelize.literal('(SELECT COUNT(*) FROM comment WHERE post.id = comment.post_id)'), 'comment_count']
    ],
    include: [
      {
        model: Comment,
        attributes: ['id', 'comment_text', 'post_id', 'user_id', 'created_at'],
        include: {
          model: User,
          attributes: ['username']
        }
      },
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
        attributes: ['username']
      }
    ]
  })
    .then(dbPostData => {
      const post = dbPostData.get({ plain: true });
      // get all available tags
      Tag.findAll({
        attributes: ['id', 'tag_name']
      })
        .then(dbTagData => {
          const tags = dbTagData.map(tag => {
            const currentTag = tag.get({ plain: true });
            currentTag.checked = post.tags.filter(postTag => currentTag.id === postTag.tag_id).length > 0;
            return currentTag;
          });
          res.render('edit-post', { post, tags, loggedIn: req.session.loggedIn });
        });
    })
    .catch(err => {
      console.log(err);
      res.status(500).json(err);
    });
});

module.exports = router;