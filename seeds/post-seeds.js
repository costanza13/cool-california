const { Post } = require('../models');

const postData = [
  {
    title: 'Turtle Rock',
    description: "A quick walk from the parking lot, Turtle Rock is easily accessible and with no traffic less than 30 minutes from San Francisco. It's a beginner friendly area, so bring your new crash pad and christen your climbing shoes. V0 problems are a plenty, but on a weekend afternoon, plan to alternate with other climbers. Turtle Rock offers the most spectacular views in the area - 360 sights of the Bay, city skyline and multimillion dollar homes nestled below. Even if you're a more experienced climber, there is something for everyone.",
    image_url: '',
    latitude: '37.91123',
    longitude: '-122.49158',
    user_id: 1
  },
  {
    title: 'Eagle Lake Trail',
    description: "The Eagle Falls Trail showcases some of the most striking landscape the Lake Tahoe Basin has to offer. This route is short and easy enough for the whole family. There is something for everyone here; waterfalls, creeks, lakes, granite peaks, and lush vegetation. After obtaining your wilderness permit at the Eagle Falls Trailhead, continue southwest on the trail. Climbing gently at first, and then ascending a steep set of stone steps. Quickly you’ll come across the falls. Some hikers choose to turn around here. If you’re continuing to the lake, follow the trail gradually uphill another half mile or so until you reach a fork. The trail on the right leads to the lake, resting in a glacial cirque below North Maggie’s Peak. The following coordinates are for the start (and end) of the trail.",
    image_url: '',
    latitude: '38.95197',
    longitude: '-120.11317',
    user_id: 3
  },
  {
    title: 'Tamarack Peak',
    description: "This popular ski tour in the Mount Rose area has great skiing in all directions including the NE facing hourglass bowl. On the 1000 foot climb to the summit, you’ll get panoramic views of the Washoe Valley, Mount Rose, Lake Tahoe and Relay Peak. The easy access and straightforward climb make Tamarack a favorite in the Mount Rose area. To get to the trailhead from Lake Tahoe, head north on Hwy 431 from Hwy 28. A small plowed parking area is located about 8 miles northeast of Hwy 28, directly east of Tamarack Peak and close to Tamarack Lake.",
    image_url: '',
    latitude: '39.31862',
    longitude: '-119.92171',
    user_id: 2
  },
  {
    title: 'The Moon',
    description: 'A bit out of the way, the moon is a great destination for anyone wanting to "get away from it all" for a day or two. Parking is never a problem, but getting there can be a bit challenging, and you can\'t really use GPS. Definitely worth the effort, though. Once there, the hiking is pretty much the easy part. With 1/6 Earth\'s gravity, even the steepest ascents are a walk in the park -- and falls don\'t hurt nearly as much. Be warned, you may need to book your visit years in advance.',
    image_url: 'https://res.cloudinary.com/cool-california/image/upload/v1624669719/vpjik6wtqcnmh37ldlo0.jpg',
    latitude: 1000000,
    longitude: 1000000,
    user_id: 2
  }
];

const seedPosts = () => Post.bulkCreate(postData);

module.exports = seedPosts;
