const upload = (url, id) => {
  cloudinary.v2.uploader.upload(
    url,
    { public_id: id },
    function (error, result) {
      console.log(result);
    }
  );
};

module.exports = { upload }