AIS API
=======
I looked for a free API solution to access machine readable AIS Data. This solution uses the free web solutions to crawl the data and returns them in json.

## How to use
This is a nodejs web app.

### Paths

#### /getLastPosition/:mmsi
Takes position from MT and from VT and returns the newest
example: http://localhost:5000/getLastPosition/211281610

#### /getLastPositionFromVF/:mmsi
Returns position from VF
example: http://localhost:5000/getLastPositionFromVF/

#### /getLastPositionFromMT/:mmsi
Returns position from MT
example: http://localhost:5000/getLastPositionFromMT/211281610

#### /getVesselsInArea/:area
Returns all vessels in area, defined by a list of area keywords
example: http://localhost:5000/getVesselsInArea/WMED,EMED
``` Javascript
[{
  name: vessel.SHIPNAME,
  id: vessel.SHIP_ID,
  lat: Number(vessel.LAT),
  lon: Number(vessel.LON),
  timestamp: vessel.LAST_POS,
  mmsi: vessel.MMSI,
  imo: vessel.IMO,
  callsign: vessel.CALLSIGN,
  speed: Number(vessel.SPEED),
  area: vessel.AREA_CODE,
  type: vessel.TYPE_SUMMARY,
  country: vessel.COUNTRY,
  destination: vessel.DESTINATION,
  port_current_id: vessel.PORT_ID,
  port_current: vessel.CURRENT_PORT,
  port_next_id: vessel.NEXT_PORT_ID,
  port_next: vessel.NEXT_PORT_NAME,
},…]
```

## Install on local machine

Requirements: npm & nodejs.

1. clone this repo

2. run `npm install`

3. run `node index.js`

## Install as docker container  
  
Requirements: docker  

1. `docker build -t ais-api .`  

2. `docker run -p 5000:5000 ais-api`  


## Deploy to heroku

This application can be easily deployed to heroku, simply install the heroku cli and run the following commands:

`heroku create`

`git push heroku master`
