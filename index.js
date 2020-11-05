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
lightsEvent.maxValue = 100
const heavyLightEvent = new gamesense.GameEvent("HEAVY_LIGHTS")
const beaconEvent = new gamesense.GameEvent('BEACON_LIGHTS')
const speedEvent = new gamesense.GameEvent('SPEED')
speedEvent.maxValue = 90
const speedLimitEvent = new gamesense.GameEvent('SPEED_LIMIT')

let interval;

function startapp(){
    console.log("Connected")
    client.registerGame()
    .then(bindBrake)
    .then(bindRightBlinker)
    .then(bindLeftBlinker)
    .then(bindLights)
    .then(bindHeavyLights)
    .then(bindBeacon)
    .then(bindSpeed)
    .then(bindSpeedLimit)
    .then(startEventUpdates)
    .catch((err) => console.log(err));
}

startapp();





function bindBrake() {
    let handler = new gamesense.GameEventHandler(gamesense.DeviceType.KEYBOARD, gamesense.RgbPerKeyZone.SPACEBAR, colors.red);
    return client.bindEvent(parkBrakeEvent, [handler])
}
function bindLeftBlinker(){
    let handler = new gamesense.GameEventHandler(gamesense.DeviceType.KEYBOARD, gamesense.RgbPerKeyZone.LEFT_BRACKET, colors.green)
    return client.bindEvent(leftBlinkerEvent, [handler])
}
function bindRightBlinker(){
    let handler = new gamesense.GameEventHandler(gamesense.DeviceType.KEYBOARD, gamesense.RgbPerKeyZone.RIGHT_BRACKET, colors.green)
    return client.bindEvent(rightBlinkerEvent, [handler])
}
function bindLights() {
    let lightsRange = new gamesense.ColorRanges([
        new gamesense.ColorRange(0, 33, colors.black),
        new gamesense.ColorRange(34, 66, colors.halfYellow),
        new gamesense.ColorRange(67, 100, colors.yellow)
    ])
    let handler = new gamesense.GameEventHandler(gamesense.DeviceType.KEYBOARD, gamesense.RgbPerKeyZone.L, lightsRange)
    return client.bindEvent(lightsEvent, [handler])
}
function bindHeavyLights() {
    let handler = new gamesense.GameEventHandler(gamesense.DeviceType.KEYBOARD, gamesense.RgbPerKeyZone.K, colors.blue)
    return client.bindEvent(heavyLightEvent, [handler])
}
function bindBeacon() {
    let handler = new gamesense.GameEventHandler(gamesense.DeviceType.KEYBOARD, gamesense.RgbPerKeyZone.O, colors.orange)
    handler.rate = new gamesense.FlashEffectFrequency(0.5)
    return client.bindEvent(beaconEvent, [handler])
}
function bindSpeed() {
    let handler = new gamesense.GameEventHandler(gamesense.DeviceType.KEYBOARD, gamesense.KeyboardZone.NUMBER_KEYS, colors.green)
    handler.mode = gamesense.VisualizationMode.PERCENT
    return client.bindEvent(speedEvent, [handler])
}
function bindSpeedLimit(){
    let handler = new gamesense.GameEventHandler(gamesense.DeviceType.KEYBOARD, gamesense.RgbPerKeyZone.BACKSPACE, colors.red)
    handler.customZoneKeys = [42, 45, 46]
    handler.rate = new gamesense.FlashEffectFrequency(1)
    return client.bindEvent(speedLimitEvent, [handler])
}




function startEventUpdates(){
    interval = setInterval(updateValues, 50);
}
function lookForGame(){
    axios.get(URL)
    .then(res => {
        console.log("looking")
        if (res.data.game.connected){
            clearInterval(interval)
            setTimeout(startapp, 1000);
        }
    });
}

function updateValues(){
    axios.get(URL)
    .then(res => {
        if (!res.data.game.connected){
            console.log("Disconnected")
            clearInterval(interval)
            client.removeGame();
            setTimeout(() => {
                interval = setInterval(lookForGame, 5000)
            }, 1000)
            
        } else {
            let truck = res.data.truck;
            updateBooleanValue(parkBrakeEvent, truck.parkBrakeOn);
            updateBooleanValue(leftBlinkerEvent, truck.blinkerLeftOn);
            updateBooleanValue(rightBlinkerEvent, truck.blinkerRightOn);
            updateValue(lightsEvent, truck.lightsParkingOn ? truck.lightsBeamLowOn ? 100 : 50 : 0)
            updateBooleanValue(heavyLightEvent, truck.lightsBeamHighOn)
            updateBooleanValue(beaconEvent, truck.lightsBeaconOn)
            updateValue(speedEvent, truck.speed)
            let overspeedLimit = Number(truck.speed)  >= Number(res.data.navigation.speedLimit + 5)
            updateBooleanValue(speedLimitEvent, overspeedLimit)
        }
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

