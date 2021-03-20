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

const headersVF = {
  'User-Agent': 'user-agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3703.0 Safari/537.36',
  'Content-Type' : 'application/x-www-form-urlencoded',
  'cache-control': 'max-age=0',
  'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3',
  'upgrade-insecure-requests':1,
  'accept-language': 'en-GB,en-US;q=0.9,en;q=0.8'
};

const headersMT = {
  //'User-Agent': 'user-agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3703.0 Safari/537.36',
  'Content-Type' : 'application/x-www-form-urlencoded',
  'cache-control': 'max-age=0',
  'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3',
  'upgrade-insecure-requests':1,
  'accept-language': 'en-GB,en-US;q=0.9,en;q=0.8'
};

function getLocationFromVF(mmsi, cb) {
  const url = `https://www.vesselfinder.com/vessels/somestring-MMSI-${mmsi}`;
  debug('getLocationFromVF', url);

  headers = headersVF;

  const options = {
    url,
    headers,
  };
  request(options, function (error, response, html) {
    if (!error && response.statusCode == 200 || typeof response != 'undefined' && response.statusCode == 403) {
      const $ = cheerio.load(html);


      const position = $('.vfix-top:nth-of-type(1) .tparams tr:nth-of-type(9) .v3').text();

      const course_speed = $('.vfix-top:nth-of-type(1) .tparams tr:nth-of-type(9) .v3').text();
      let course, speed;
      if(course_speed.length > 0){
         course = course_speed.split('/')[0].replace('° ', '');
         speed = course_speed.split('/')[1].replace(' kn', '');
      }
      const lat_lon = $('.vfix-top:nth-of-type(1) .tparams tr:nth-of-type(10) .v3').text();

      debug('Extracted: ', lat_lon, speed, course);

      const splitted = lat_lon.split('/');
      if(splitted.length <= 1){
        debug('error VF');
        cb({ error: 'an unknown error occured' });
        return false;
      }
      const latitude = splitted[0].indexOf('N') === -1 ? parseFloat(splitted[0]) * -1 : parseFloat(splitted[0]);
      const longitude = splitted[1].indexOf('E') === -1 ? parseFloat(splitted[1]) * -1 : parseFloat(splitted[1]);

      const timestamp = new Date($('#lastrep').attr('data-title')).toISOString();
      const unixtime = new Date(timestamp).getTime()/1000;

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
  const url = `https://www.marinetraffic.com/en/data/?asset_type=vessels&columns=flag,shipname,photo,recognized_next_port,reported_eta,reported_destination,current_port,imo,mmsi,ship_type,show_on_live_map,time_of_latest_position,lat_of_latest_position,lon_of_latest_position&mmsi|eq|mmsi=${mmsi}`;
  debug('getLocationFromMT', url);

  headers = headersMT;

  const options = {
    url,
    headers,
  };

  request(options, function (error, response, html) {



    if (!error && response.statusCode == 200 || response.statusCode == 403)  {


      console.log('first request successsfull, set cookie');
      let secondRequestHeaders = headers;
      secondRequestHeaders.cookie = response.headers['set-cookie'];
      secondRequestHeaders.referer = `https://www.marinetraffic.com/en/data/?asset_type=vessels&columns=flag,shipname,photo,recognized_next_port,reported_eta,reported_destination,current_port,imo,mmsi,ship_type,show_on_live_map,time_of_latest_position,lat_of_latest_position,lon_of_latest_position&mmsi|eq|mmsi=${mmsi}`;
      secondRequestHeaders['Vessel-Image'] = '007fb60815c6558c472a846479502b668e08';

      request({ url: `https://www.marinetraffic.com/en/reports?asset_type=vessels&columns=flag,shipname,photo,recognized_next_port,reported_eta,reported_destination,current_port,imo,mmsi,ship_type,show_on_live_map,time_of_latest_position,lat_of_latest_position,lon_of_latest_position&mmsi=${mmsi}`, headers:secondRequestHeaders},function(error, response, html){

        if (!error && response.statusCode == 200 || response.statusCode == 403) {

            console.log('second request worked');

            console.log(html);

            let parsed = JSON.parse(html);

            console.log(parsed);
            if (parsed.totalCount > 0)
              {

              const latitude = parseFloat(parsed.data[0].LAT);
              const longitude = parseFloat(parsed.data[0].LON);
              const speed = parseFloat(parsed.data[0].SPEED);
              const course = parseFloat(parsed.data[0].COURSE);

              const timestamp = new Date(parsed.data[0].LAST_POS*1000).toISOString();
              const unixtime = new Date(parsed.data[0].LAST_POS*1000).getTime()/1000;
              console.log(123);

              //const $ = cheerio.load(html);
              console.log(timestamp, speed ,course ,latitude ,longitude)

              if (timestamp && speed && course && latitude && longitude) {
                cb(
                  parsePosition({
                    error: null,
                    data: {
                      timestamp: timestamp,
                      unixtime,
                      course: course,
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
              cb({ error: 'no records were found' });
            }
        } else {
          cb({ error });
        }

      });

    } else {
      cb({ error });
    }



  });
}

function getLocation(mmsi, cb) {
  debug('getting location for vessel: ', mmsi);
  getLocationFromVF(mmsi, function(VFResult) {
    debug('got location from vf', VFResult);

    getLocationFromMT(mmsi, function(MTResult) {
      if(MTResult.error){
        cb(VFResult);
      }else{
        debug('got location from mt', MTResult);
        if(!VFResult.data){
          return cb(MTResult);
        }
        const vfDate = moment( VFResult.data.timestamp);
        const mtDate = moment(MTResult.data.timestamp);
        const secondsDiff = mtDate.diff(vfDate, 'seconds')
        debug('time diff in seconds: ', secondsDiff);

        cb(secondsDiff > 0 ? MTResult : VFResult);
      }
    });
  });
}

module.exports = {
  getLocationFromVF: getLocationFromVF,
  getLocationFromMT: getLocationFromMT,
  getLocation: getLocation,
};
