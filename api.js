const cheerio = require('cheerio');
const moment = require('moment');
const request = require('request');

const debug = (...args) => {
  if (true) {
    console.log.apply(console, args);
  }
}

function parsePosition(position) {
  debug('Position: ', position);

  return {
    "error": position.error,
    "data":
      {
        timestamp: position.data.timestamp,
        unixtime: position.data.unixtime,
        latitude: parseFloat(position.data.latitude),
        longitude: parseFloat(position.data.longitude),
        course: parseFloat(position.data.course),
        speed: parseFloat(position.data.speed)
      }
  }
}

const headers = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.8; rv:24.0) Gecko/20100101 Firefox/24.0',
  'Content-Type' : 'application/x-www-form-urlencoded'
};

function getLocationFromVF(mmsi, cb) {
  const url = `https://www.vesselfinder.com/vessels/somestring-MMSI-${mmsi}`;
  debug('getLocationFromVF', url);

  const options = {
    url,
    headers,
  };

  request(options, function (error, response, html) {
    if (!error && response.statusCode == 200 || typeof response != 'undefined' && response.statusCode == 403) {
      const $ = cheerio.load(html);
      const course_speed = $('.vfix-top:nth-of-type(2) .tparams tr:nth-of-type(9) .v3').text();
      let course, speed;
      if(course_speed.length > 0){
         course = course_speed.split('/')[0].replace('° ', '');
         speed = course_speed.split('/')[1].replace(' kn', '');
      }
      const lat_lon = $('.vfix-top:nth-of-type(2) .tparams tr:nth-of-type(10) .v3').text();

      debug('Extracted: ', lat_lon, speed, course);

      const splitted = lat_lon.split('/');
      console.log(lat_lon, splitted, typeof splitted);
      if(splitted.length <= 1){
        debug('error VF');
        cb({ error: 'an unknown error occured' });
        return false;
      }
      const latitude = splitted[0].indexOf('N') === -1 ? parseFloat(splitted[0]) * -1 : parseFloat(splitted[0]);
      const longitude = splitted[1].indexOf('E') === -1 ? parseFloat(splitted[1]) * -1 : parseFloat(splitted[1]);

      const timestamp = new Date($('.vfix-top:nth-of-type(2) .tparams tr:nth-of-type(11) .v3').text()).toString();
      const unixtime = new Date($('.vfix-top:nth-of-type(2) .tparams tr:nth-of-type(11) .v3').text()).getTime()/1000;

      cb(
        parsePosition({
          error: null,
          data: {
            timestamp,
            unixtime,
            course,
            speed: speed.trim(),
            latitude,
            longitude,
          }
        })
      );
    } else {
      debug('error VF');
      cb({ error: 'an unknown error occured' });
    }
  });
}


function getLocationFromMT(mmsi, cb) {
  const url = `https://www.marinetraffic.com/en/ais/details/ships/mmsi:${mmsi}`;
  debug('getLocationFromMT', url);

  const options = {
    url,
    headers,
  };

  request(options, function (error, response, html) {
    if (!error && response.statusCode == 200 || response.statusCode == 403) {
      const $ = cheerio.load(html);

      // convert 1 hour, 11 minutes ago (2018-11-23 01:17 (UTC)) to 2018-11-23 01:17 (UTC)
      let date_match = $('#tabs-last-pos .group-ib strong').first().text()

      if(date_match.indexOf('(') > -1){

        date_match = date_match.match(/\(([^)]+)\)/);
        debug('date_match before transformation');
        debug(date_match);
      }

      debug('date_match after transformation');
      debug(date_match);
      if (date_match == null || typeof date_match == 'object' && date_match.length < 2) {
        cb({ error: 'could not parse extracted date 123: ' + date_match });
        return false;
      }
      let date_str;
      if(typeof date_match == 'object')
        date_str = date_match[1]+')';
      else
        date_str = date_match;
      /*console.log(date_match.length);
      console.log(typeof date_match);
      try{
        const date_str = date_match[1]+')';
      }catch(e){
        const date_str = String(date_match)+')';
      }*/
      if(typeof date_str == 'undefined')
        return cb({ error: 'could not parse date from date str' });

      debug('got date_str: '+date_str);

      const timestamp = new Date(date_str).toString();
      const unixtime = new Date(date_str).getTime()/1000;

      const speed_course = $('#tabs-last-pos .group-ib:nth-child(6) strong').first().text();
      const speed = speed_course.split('/')[0].replace('kn ','');
      const course = speed_course.split('/')[1].replace('°','');

      const lat_lon = $('#tabs-last-pos .details_data_link').text().replace('°','').replace('°','');

      debug('Extracted: ', lat_lon, speed, course);

      const splitted = lat_lon.split('/');
      const latitude = splitted[0].indexOf('N') > -1 ? parseFloat(splitted[0]) * -1 : parseFloat(splitted[0]);
      const longitude = splitted[1].indexOf('E') > -1 ? parseFloat(splitted[1]) * -1 : parseFloat(splitted[1]);

      if (timestamp && speed && course && latitude, longitude) {
        cb(
          parsePosition({
            error: null,
            data: {
              timestamp: timestamp.trim(),
              unixtime,
              course: course.trim(),
              speed,
              latitude,
              longitude,
            }
          })
        );
      } else {
        cb({ error: 'missing needed position data' });
      }
    } else {
      cb({ error });
    }
  });
}

function getLocation(mmsi, cb) {
  debug('getting location for vehicle: ', mmsi);
  getLocationFromVF(mmsi, function(VFResult) {
    debug('got location from vf', VFResult);

    getLocationFromMT(mmsi, function(MTResult) {
      debug('got location from mt', MTResult);
      if(!VFResult.data){
        return cb(MTResult);
      }
      const vfDate = moment(VFResult.data.timestamp);
      const mtDate = moment(MTResult.data.timestamp);
      const secondsDiff = mtDate.diff(vfDate, 'seconds')
      debug('time diff in seconds: ', secondsDiff);

      cb(secondsDiff > 0 ? MTResult : VFResult);
    });
  });
}

module.exports = {
  getLocationFromVF: getLocationFromVF,
  getLocationFromMT: getLocationFromMT,
  getLocation: getLocation,
};
