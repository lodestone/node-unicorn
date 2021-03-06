/* jshint undef: true, node: true, esnext: true, eqeqeq: true */
'use strict';

/**
Simple ExpressJS server to talk to the Unicorn pHat.
Made of simple routes:
    - `GET /clear`: reset the LEDs (fills with zeros)
    - `POST /display + parameters`: display the array of colors.
    - `GET /stop`: will reset and stop the server.
    - TODO: `POST /brightness + parameters`: update the brightness.
*/

const express = require('express');
const bodyParser = require('body-parser');
const driver = require('rpi-ws281x-native');
const debug = require('debug')('led-server');

const NUMBER_OF_LEDS = 32; // For the pHat. Need testing for the Hat version!
const PORT = 3000;

let app = express();
app.use(bodyParser.json()); // for parsing application/json

// Set all the LEDs to zero
app.get('/clear', (req, res) => {
    // TODO: create the array of zeros dynamically according to NUMBER_OF_LEDS.
    const zeros = [
        0,0,0,0,0,0,0,0,
        0,0,0,0,0,0,0,0,
        0,0,0,0,0,0,0,0,
        0,0,0,0,0,0,0,0
    ];
    driver.render(zeros);
    res.json({response: 'ok'});
});

// Display an array of colors
app.post('/display', (req, res) => {
    let leds = req.body.leds;

    function isAValidColor(elt, index, array) { 
        return (elt >= 0 && elt <= 0xffffff);
    }

    // validate the input: must be an array of number in the color range
    if (leds && Array.isArray(leds) && (leds.length === NUMBER_OF_LEDS) && leds.every(isAValidColor)) {
        debug('Valid Display command received. LEDs are: ' + leds);
        driver.render(leds);
        res.json({response: 'ok'});
    } else {
        debug('ERROR: Invalid Display command received. LEDs are: ' + leds);
        res.status(400).json({response: 'error', received: leds});
    }
});

// a stop route to shutdown everything gracefully
// TODO: is there any risk the server stops before returning?
app.get('/stop', (req, res) => {
    debug('Stop command received. Shuting down the server.');
    res.json({response: 'ok'});
    driver.reset();
    server.close();
    process.exit(0);
});

// Listen to localhost only
let server = app.listen(PORT, 'localhost', function () {
    driver.init(NUMBER_OF_LEDS);
    driver.setBrightness(10);
    console.log('Main LED server started on port ' + PORT);
});