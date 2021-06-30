const { Model, DataTypes } = require("sequelize");
const sequelize = require("../config/connection");
const GoogleMapsAPI = require('googlemaps');

class Post extends Model {
  // like or dislike a post
  static vote(body, models) {
    return models.Vote.upsert({
      user_id: body.user_id,
      post_id: body.post_id,
      like: body.like
    }).then(() => {
      return Post.findOne({
        where: {
          id: body.post_id,
        },
        attributes: [
          "id",
          [sequelize.literal("(SELECT COUNT(*) FROM vote WHERE post.id = vote.post_id AND `like`)"), "likes"],
          [sequelize.literal("(SELECT COUNT(*) FROM vote WHERE post.id = vote.post_id AND NOT `like`)"), "dislikes"],
          [sequelize.literal("(SELECT '" + (body.like ? 'like' : 'dislike') + "')"), "vote"]
        ],
      });
    });
  }

  // un-like or un-dislike a post
  static unvote(body, models) {
    return models.Vote.destroy({
      where: {
        user_id: body.user_id,
        post_id: body.post_id
      }
    }).then(() => {
      return Post.findOne({
        where: {
          id: body.post_id,
        },
        attributes: [
          "id",
          [sequelize.literal("(SELECT COUNT(*) FROM vote WHERE post.id = vote.post_id AND `like`)"), "likes"],
          [sequelize.literal("(SELECT COUNT(*) FROM vote WHERE post.id = vote.post_id AND NOT `like`)"), "dislikes"],
          [sequelize.literal("(SELECT 'no-vote')"), "vote"]
        ],
      });
    });
  }

  // tag a post
  static tag(body, models) {
    return models.PostTag.create({
      post_id: body.post_id,
      tag_id: body.tag_id
    }).then(() => {
      return Post.findOne({
        where: {
          id: body.post_id,
        },
        attributes: [
          "id"
        ],
        include: {
          model: models.Tag,
          attributes: ['tag_name']
        }
      });
    });
  }

  // remove a tag from a post
  static untag(body, models) {
    return models.PostTag.destroy({
      where: {
        post_id: body.post_id,
        tag_id: body.tag_id
      }
    }).then(() => {
      return Post.findOne({
        where: {
          id: body.post_id,
        },
        attributes: [
          "id"
        ],
        include: {
          model: models.Tag,
          attributes: ['tag_name']
        }
      });
    });
  }
}

// create fields/columns for Post model
Post.init(
  {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    image_url: {
      type: DataTypes.STRING,
      allowNull: true
    },
    latitude: {
      type: DataTypes.DECIMAL(8, 5),
      allowNull: true
    },
    longitude: {
      type: DataTypes.DECIMAL(8, 5),
      allowNull: true
    },
    map_url: {
      type: DataTypes.STRING,
      allowNull: true
    },
    user_id: {
      type: DataTypes.INTEGER,
      references: {
        model: "user",
        key: "id",
      },
    },
  },
  {
    hooks: {
      // set up beforeCreate lifecycle "hook" functionality
      async beforeCreate(newPostData) {
        // embedded map
        let map_url = false;
        if (newPostData.latitude && newPostData.longitude) {
          const publicConfig = {
            key: process.env.GOOGLE_MAPS_API_KEY,
            stagger_time: 1000, // for elevationPath
            encode_polylines: false,
            secure: true, // use https
          };
          const gmAPI = new GoogleMapsAPI(publicConfig);
          const params = {
            center: newPostData.latitude + ',' + newPostData.longitude,
            zoom: 13,
            size: '300x300',
            maptype: 'roadmap',
            markers: [{ location: newPostData.latitude + ',' + newPostData.longitude }],
            style: [{ feature: 'road', element: 'all' }]
          };
          newPostData.map_url = gmAPI.staticMap(params); // return static map URL
        }
        return newPostData;
      },

      // set up beforeCreate lifecycle "hook" functionality
      async beforeUpdate(editPostData) {
        // embedded map
        let map_url = false;
        if (editPostData.latitude && editPostData.longitude) {
          const publicConfig = {
            key: process.env.GOOGLE_MAPS_API_KEY,
            stagger_time: 1000, // for elevationPath
            encode_polylines: false,
            secure: true, // use https
          };
          const gmAPI = new GoogleMapsAPI(publicConfig);
          const params = {
            center: editPostData.latitude + ',' + editPostData.longitude,
            zoom: 13,
            size: '300x300',
            maptype: 'roadmap',
            markers: [{ location: editPostData.latitude + ',' + editPostData.longitude }],
            style: [{ feature: 'road', element: 'all' }]
          };
          newPostData.map_url = gmAPI.staticMap(params); // return static map URL
        }
        return editPostData;
      },
    },
    sequelize,
    freezeTableName: true,
    underscored: true,
    modelName: "post",
  }
);

module.exports = Post;
