const axios = require('axios');
const URL = "http://localhost:25555/api/ets2/telemetry";
const gamesense = require('gamesense-client');
const endpoint = new gamesense.ServerEndpoint();
endpoint.discoverUrl();
const game = new gamesense.Game("ETS2", "Euro Truck Simulator 2", gamesense.GameColor.BLUE);
const client = new gamesense.GameClient(game, endpoint);
const colors = require('./colors.js')

//events
const parkBrakeEvent = new gamesense.GameEvent('BRAKE_ACTIVE')
const leftBlinkerEvent = new gamesense.GameEvent('LEFT_BLINKER')
const rightBlinkerEvent = new gamesense.GameEvent('RIGHT_BLINKER')
const lightsEvent = new gamesense.GameEvent('LIGHTS_ON')
lightsEvent.maxValue = 1




client.registerGame()
    .then(bindBrake)
    .then(bindRightBlinker)
    .then(bindLeftBlinker)
    .then(bindLights)
    .then(startEventUpdates)
    .catch((err) => console.log(err));


function bindBrake() {
    let redSpaceHandler = new gamesense.GameEventHandler(gamesense.DeviceType.KEYBOARD, gamesense.RgbPerKeyZone.SPACEBAR, colors.red);
    return client.bindEvent(parkBrakeEvent, [redSpaceHandler])
}
function bindLeftBlinker(){
    let greenLHandler = new gamesense.GameEventHandler(gamesense.DeviceType.KEYBOARD, gamesense.RgbPerKeyZone.LEFT_BRACKET, colors.green)
    return client.bindEvent(leftBlinkerEvent, [greenLHandler])
}
function bindRightBlinker(){
    let greenLHandler = new gamesense.GameEventHandler(gamesense.DeviceType.KEYBOARD, gamesense.RgbPerKeyZone.RIGHT_BRACKET, colors.green)
    return client.bindEvent(rightBlinkerEvent, [greenLHandler])
}
function bindLights() {
    let lightsHandler = new gamesense.GameEventHandler(gamesense.DeviceType.KEYBOARD, gamesense.RgbPerKeyZone.L, colors.yellow)
    lightsHandler.mode = gamesense.VisualizationMode.PERCENT
    new client.bindEvent(lightsEvent, [lightsHandler])
}




function startEventUpdates(){
    setInterval(updateValues, 50);
}
function updateValues(){
    axios.get(URL)
    .then(res => {
        let truck = res.data.truck;
        updateBooleanValue(parkBrakeEvent, truck.parkBrakeOn);
        updateBooleanValue(leftBlinkerEvent, truck.blinkerLeftOn);
        updateBooleanValue(rightBlinkerEvent, truck.blinkerRightOn);
        updateValue(lightsEvent, truck.lightsBeamLowOn ? truck.lightsBeamHighOn ? 1 : 0.5 : 0)
    })
    .catch(err => console.log(err))
}

function updateBooleanValue(event, value){
    event.value = value ? 1 : 0
    client.sendGameEventUpdate(event)
}

function updateValue(event, value){
    event.value = value
    client.sendGameEventUpdate(event)
}

