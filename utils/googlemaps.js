
module.exports = (lat, lon) => {
  return `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lon}&zoom=13&size=300x300&maptype=roadmap
  &markers=${lat},${lon}&key=${process.env.GOOGLE_MAPS_API_KEY}`
}