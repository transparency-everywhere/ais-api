var cheerio = require('cheerio');
var moment = require('moment');
var request = require('request');

function parsePosition(position) {
  console.log(position);
  return {
    "error":position.error,
    "data" :
      {
        timestamp: position.data.timestamp,
        unixtime: position.data.unixtime,
        latitude:parseFloat(position.data.latitude),
        longitude:parseFloat(position.data.longitude),
        course:parseFloat(position.data.course),
        speed:parseFloat(position.data.speed)
      }
  }
}

var headers = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.8; rv:24.0) Gecko/20100101 Firefox/24.0',
  'Content-Type' : 'application/x-www-form-urlencoded'
};

function getLocationFromVF(MMSI,cb) {
  var url = 'https://www.vesselfinder.com/vessels/somestring-MMSI-'+MMSI;
  console.log(url);
  var options = {
    url: url,
    headers: headers
  };
  request(options, function (error, response, html) {
    if (!error && response.statusCode == 200 || response.statusCode == 403) {
      var $ = cheerio.load(html);
      var course_speed = $('.vfix-top:nth-of-type(2) .tparams tr:nth-of-type(9) .v3').text();
      var course = course_speed.split('/')[0].replace('° ', '');
      var speed = course_speed.split('/')[1].replace(' kn', '');
      var lat_lon = $('.vfix-top:nth-of-type(2) .tparams tr:nth-of-type(10) .v3').text();
      console.log(lat_lon);

      var lat = lat_lon. split('/')[0]
      if(lat.indexOf('N')==-1){
        lat = parseFloat(lat)*-1
        console.log('contains no N', lat);
      }else
        lat = parseFloat(lat);

      var lon = lat_lon. split ('/') [1];

      if(lon.indexOf('E')==-1){
        lon = parseFloat(lon)*-1
        console.log('contains no E', lon);
      }else
        parseFloat(lon)


      var timestamp = new Date($('.vfix-top:nth-of-type(2) .tparams tr:nth-of-type(11) .v3').text()).toString();
    var unixtime = new Date($('.vfix-top:nth-of-type(2) .tparams tr:nth-of-type(11) .v3').text()).getTime()/1000;
      cb(parsePosition({error:null,data:{ timestamp: timestamp, unixtime: unixtime, latitude:lat, longitude:lon, course:course, speed:speed.trim()}}))
    }else{
      console.log('error VF');
      //console.log(html);
      cb({error:'an unknown error occured'});
    }
  });
}


function getLocationFromMT(mmsi,cb) {
  var url = 'https://www.marinetraffic.com/en/ais/details/ships/mmsi:'+mmsi+'';
  console.log(url);
  var options = {
    url: url,
    headers: headers
  };
  request(options, function (error, response, html) {
    if (!error && response.statusCode == 200 || response.statusCode == 403) {
      //console.log(html);
      var $ = cheerio.load(html);

      /*
    convert 1 hour, 11 minutes ago (2018-11-23 01:17 (UTC))
    to 2018-11-23 01:17 (UTC)
      */
      var date_match = $('#tabs-last-pos .group-ib strong').first().text().match(/\(([^)]+)\)/);

      if (date_match.length < 2) {
        cb({error: 'could not parse extracted date: ' + date_match.toString()});
      }

      var date_str = date_match[1]+')';

      var timestamp = new Date(date_str).toString();
      var unixtime = new Date(date_str).getTime()/1000;

      var lat_lon = $('#tabs-last-pos .details_data_link').text().replace('°','').replace('°','');
      var lat = lat_lon.split('/')[0];
      var lon = lat_lon.split('/')[1];

      if(lat.indexOf('N')>-1){
        lat = parseFloat(lat)*-1
        console.log('contains no N', lat);
      }else
        lat = parseFloat(lat);

      if(lon.indexOf('E') > -1){
        lon = parseFloat(lon)*-1
        console.log('contains no E', lon);
      }else
        parseFloat(lon)

      var speed_course = $('#tabs-last-pos .group-ib:nth-child(6) strong').first().text();
      var speed = speed_course.split('/')[0].replace('kn ','');
      var course = speed_course.split('/')[1].replace('°','');
      if(timestamp && speed && lat && lon && course)
        cb(parsePosition({error:null,data:{ timestamp: timestamp.trim(), unixtime:unixtime, latitude:lat, longitude:lon,speed:speed,course:course.trim()}}));
      else
        cb({error:'an unknown error occured'});
    }else{
      cb({error:error});
    }
  });
}

function getLocation(mmsi, cb) {
  console.log(mmsi);
  console.log('getting location for vehicle',mmsi);
  getLocationFromVF(mmsi,function(VFResult) {

    console.log('got location from vf');
    getLocationFromMT(mmsi,function(MTResult){

      var vfDate = moment(VFResult.data.timestamp);
      var mtDate = moment(MTResult.data.timestamp);
      var secondsDiff = mtDate.diff(vfDate, 'seconds')
      console.log(secondsDiff)
      if(secondsDiff < 0){
        cb(VFResult);
      }else if(secondsDiff > 0){
        cb(MTResult);
      }else{
        cb(VFResult);
      }
    });

  });
}

module.exports = {
  getLocationFromVF: getLocationFromVF,
  getLocationFromMT: getLocationFromMT,
  getLocation: getLocation,
};
