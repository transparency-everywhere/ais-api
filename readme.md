AIS API
=======
I looked for a free API solution to access machine readable AIS Data. This solution uses the free web solutions to crawl the data and returns them in json.

##How to use
This is a nodejs web app.

##Paths

/getLastPosition/:mmsi/:imo
---------------------------
Takes position from MT and from VT and returns the newest
example: http://localhost:5000/getLastPosition/244140096/7302225

/getLastPositionFromVF/:imo
---------------------------
Returns position from VF
example: http://localhost:5000/getLastPosition/7302225

/getLastPositionFromMT/:mmsi
-----------------------------
Returns position from MT
example: http://localhost:5000/getLastPosition/244140096

###Install on local machine

Requirements: npm & nodejs.

1. clone this repo

2. run `npm install`

3. run `node index.js`

###Deploy to heroku

This application can be easily deployed to heroku, simply install the heroku cli and run the following commands:

`heroku create`

`git push heroku master`




