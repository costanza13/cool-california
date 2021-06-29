const router = require('express').Router();
const { User, Post, Tag, UserTag } = require('../../models');
const { withAuthApi } = require('../../utils/auth');

// get all users
router.get('/', withAuthApi, (req, res) => {
  User.findAll({
    attributes: { exclude: ['password'] }
  })
    .then(dbUserData => res.json(dbUserData))
    .catch(err => {
      console.log(err);
      res.status(500).json(err);
    });
});

router.get('/tags', withAuthApi, (req, res) => {
  Tag.findAll({
    attributes: ['tag_name'],
    include: [
      {
        model: User,
        where: {
          id: req.session.user_id
        },
        through: {
          module: UserTag,
        }
      }
    ],
  })
    .then(dbUserTags => {
      const tags = dbUserTags.map(tag => tag.get({ plain: true }).tag_name);
      res.json(tags);
    })
    .catch(err => {
      console.log(err);
      res.status(500).json(err);
    });
});

router.get('/:id', withAuthApi, (req, res) => {
  User.findOne({
    attributes: { exclude: ['password'] },
    where: {
      id: req.params.id
    },
    include: [
      {
        model: Post,
        attributes: ['id', 'title', 'created_at']
      }
    ]
  })
    .then(dbUserData => {
      if (!dbUserData) {
        res.status(404).json({ message: 'No user found with this id' });
        return;
      }
      res.json(dbUserData);
    })
    .catch(err => {
      console.log(err);
      res.status(500).json(err);
    });
});

router.post('/', (req, res) => {
  User.create({
    username: req.body.username,
    email: req.body.email,
    nickname: req.body.nickname,
    password: req.body.password
  })
    .then(dbUserData => {
      req.session.save(() => {
        req.session.user_id = dbUserData.id;
        req.session.username = dbUserData.username;
        req.session.nickname = dbUserData.nickname;
        req.session.loggedIn = true;

        res.json(dbUserData);
      });
    })
    .catch(err => {
      console.log(err);
      var message;
      if (err.errors) {
        message = err.errors[0].message;
      } else {
        message = err.message;
      }
      res.status(500).json({ message });
    });
});

router.post('/login', (req, res) => {
  // console.log('login attempt', req.body)
  User.findOne({
    where: {
      username: req.body.username
    }
  })
    .then(dbUserData => {
      if (!dbUserData) {
        res.status(400).json({ message: 'No user with that email address!' });
        return;
      }

      // verify user
      const validPassword = dbUserData.checkPassword(req.body.password);

      if (!validPassword) {
        res.status(400).json({ message: 'Incorrect password!' });
        return;
      }

      req.session.save(() => {
        req.session.user_id = dbUserData.id;
        req.session.username = dbUserData.username;
        req.session.nickname = dbUserData.nickname;
        req.session.loggedIn = true;

        res.json({ user: dbUserData, message: 'You are now logged in!' });
      });
    });
});

router.post('/logout', (req, res) => {
  if (req.session.loggedIn) {
    req.session.destroy(() => {
      res.status(204).end();
    });
  } else {
    res.status(404).end();
  }
});

router.post('/tag', withAuthApi, (req, res) => {
  UserTag.create({
    user_id: req.session.user_id,
    tag_id: req.body.tag_id
  })
    .then(dbAddTagData => {
      res.json(dbAddTagData);
    })
    .catch(err => {
      console.log(err);
      res.status(500).json(err);
    });
});

router.delete('/tag/:id', withAuthApi, (req, res) => {
  UserTag.destroy({
    where: {
      user_id: req.session.user_id,
      tag_id: req.params.id
    }
  })
    .then(dbAddTagData => {
      res.json(dbAddTagData);
    })
    .catch(err => {
      console.log(err);
      res.status(500).json(err);
    });
});

router.put('/:id', withAuthApi, (req, res) => {
  if (parseInt(req.params.id) === req.session.user_id) {
    User.update(
      {
        username: req.body.username,
        email: req.body.email,
        nickname: req.body.nickname,
        password: req.body.password
      },
      {
        individualHooks: true,
        where: {
          id: req.params.id
        }
      })
      .then(dbUserData => {
        if (!dbUserData[0]) {
          res.status(404).json({ message: 'No user found with this id' });
          return;
        }
        res.json(dbUserData);
      })
      .catch(err => {
        console.log(err);
        res.status(500).json(err);
      });
  } else {
    res.status(403).json('Permission denied.')
  }
});

router.delete('/:id', withAuthApi, (req, res) => {
  User.destroy({
    where: {
      id: req.params.id
    }
  })
    .then(dbUserData => {
      if (!dbUserData) {
        res.status(404).json({ message: 'No user found with this id' });
        return;
      }
      res.json(dbUserData);
    })
    .catch(err => {
      console.log(err);
      res.status(500).json(err);
    });
});

module.exports = router;
