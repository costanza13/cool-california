const router = require('express').Router();
const sequelize = require('../../config/connection');
const { Post, User, Comment, Tag, PostTag, Vote } = require('../../models');
const { withAuthApi } = require('../../utils/auth');

router.get('/', (req, res) => {
  console.log('======================');
  Post.findAll({
    attributes: [
      'id',
      'title',
      'description',
      'created_at',
      'updated_at',
      [sequelize.literal('(SELECT COUNT(*) FROM vote WHERE post.id = vote.post_id AND `like`)'), 'likes'],
      [sequelize.literal('(SELECT COUNT(*) FROM vote WHERE post.id = vote.post_id AND NOT `like`)'), 'dislikes']
    ],
    order: [['created_at', 'DESC'], ['id', 'DESC']],
    include: [
      {
        model: Tag,
        attributes: ['tag_name'],
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
    .then(dbPostData => res.json(dbPostData))
    .catch(err => {
      console.log(err);
      res.status(500).json(err);
    });
});

router.get('/:id', (req, res) => {
  Post.findOne({
    where: {
      id: req.params.id
    },
    attributes: [
      'id',
      'title',
      'description',
      'created_at',
      'updated_at',
      [sequelize.literal('(SELECT COUNT(*) FROM vote WHERE post.id = vote.post_id AND `like`)'), 'likes'],
      [sequelize.literal('(SELECT COUNT(*) FROM vote WHERE post.id = vote.post_id AND NOT `like`)'), 'dislikes']
    ],
    include: [
      {
        model: User,
        attributes: ['username']
      },
      {
        model: Tag,
        attributes: ['tag_name'],
        through: {
          model: PostTag,
          attributes: []
        },
      },
      {
        model: Comment,
        attributes: ['comment_text', 'created_at'],
        include: {
          model: User,
          attributes: ['username']
        }
      }
    ]
  })
    .then(dbPostData => {
      if (!dbPostData) {
        res.status(404).json({ message: 'No post found with this id' });
        return;
      }
      res.json(dbPostData);
    })
    .catch(err => {
      console.log(err);
      res.status(500).json(err);
    });
});

router.post('/', withAuthApi, (req, res) => {
  // console.log(req.body);
  if (req.body.title.trim() && req.body.description.trim()) {
    Post.create({
      title: req.body.title,
      description: req.body.description,
      image_url: req.body.image_url,
      latitude: req.body.latitude ? req.body.latitude : null,
      longitude: req.body.longitude ? req.body.longitude : null,
      user_id: req.session.user_id
    })
      .then(dbPostData => {
        const post = dbPostData.get({ plain: true });
        const postTags = req.body.tags.split(',').map(tagId => { return { post_id: post.id, tag_id: tagId }; });
        return PostTag.bulkCreate(postTags).then(dbPostTagData => {
          const postTags = dbPostTagData.map(tag => tag.get({ plain: true }));
          post.tags = postTags;
          res.status(200).json(post);
        })
      })
      .catch(err => {
        console.log(err);
        res.status(500).json(err);
      });
  } else {
    res.status(400).json({ message: 'Title and Description required.' });
  }
});

// these must come before the /:id route to avoid being considered a post id
router.post('/vote', withAuthApi, (req, res) => {
  Post.vote({ ...req.body, user_id: req.session.user_id }, { Vote })
    .then(dbPostData => res.json(dbPostData))
    .catch(err => {
      console.log(err);
      res.status(400).json(err);
    });
});

router.delete('/vote', withAuthApi, (req, res) => {
  Post.unvote({ ...req.body, user_id: req.session.user_id }, { Vote })
    .then(dbPostData => res.json(dbPostData))
    .catch(err => {
      console.log(err);
      res.status(400).json(err);
    });
});

router.post('/tag', withAuthApi, (req, res) => {
  Post.findOne({
    where: {
      id: req.body.post_id,
      user_id: req.session.user_id
    },
    attributes: ['id']
  })
    .then(dbPostData => {
      console.log('find a post', dbPostData);
      if (!dbPostData) {
        res.status(403).json({ message: 'Forbidden' });
        return;
      }

      Post.tag(req.body, { PostTag, Tag })
        .then(dbPostData => res.json(dbPostData))
        .catch(err => {
          console.log(err);
          res.status(400).json(err);
        });
    });
});

router.delete('/tag', withAuthApi, (req, res) => {
  Post.findOne({
    where: {
      id: req.body.post_id,
      user_id: req.session.user_id
    },
    attributes: ['id']
  })
    .then(dbPostData => {
      if (!dbPostData) {
        res.status(403).json({ message: 'Forbidden' });
        return;
      }

      Post.untag(req.body, { PostTag, Tag })
        .then(dbPostData => res.json(dbPostData))
        .catch(err => {
          console.log(err);
          res.status(400).json(err);
        });
    });
});

router.put('/:id', withAuthApi, (req, res) => {
  Post.update(
    {
      title: req.body.title,
      body: req.body.description
    },
    {
      where: {
        id: req.params.id,
        user_id: req.session.user_id
      }
    }
  )
    .then(dbPostData => {
      if (!dbPostData) {
        res.status(404).json({ message: 'No post found with this id' });
        return;
      }
      const postTags = req.body.tags.split(',').map(tagId => { return { post_id: req.params.id, tag_id: tagId }; });
      return PostTag.destroy({ where: { post_id: req.params.id } })
        .then(dbPostDeleteData => {
          return PostTag.bulkCreate(postTags).then(dbPostTagData => {
            const postTags = dbPostTagData.map(tag => tag.get({ plain: true }));
            res.status(200).json(dbPostData);
          })
        })
    })
    .catch(err => {
      console.log(err);
      res.status(500).json(err);
    });
});

router.delete('/:id', withAuthApi, (req, res) => {
  Post.destroy({
    where: {
      id: req.params.id,
      user_id: req.session.user_id
    }
  })
    .then(dbPostData => {
      if (!dbPostData) {
        res.status(404).json({ message: 'No post found with this id' });
        return;
      }
      res.json(dbPostData);
    })
    .catch(err => {
      console.log(err);
      res.status(500).json(err);
    });
});

module.exports = router;
