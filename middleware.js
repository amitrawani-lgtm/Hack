module.exports.getCoordinates = async (location)=> {
  const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}`);
  const data = await response.json();

  if (data.length > 0) {
    return {
      type: "Point",
      coordinates: [parseFloat(data[0].lon), parseFloat(data[0].lat)]
    };
  } else {
    throw new Error('Location not found');
  }
}