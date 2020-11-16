const axios = require('axios');
const URL = "http://localhost:25555/api/ets2/telemetry";
const gamesense = require('gamesense-client');
const endpoint = new gamesense.ServerEndpoint();
endpoint.discoverUrl('/mnt/c/ProgramData/SteelSeries/SteelSeries Engine 3/coreProps.json');
const game = new gamesense.Game("ETS2", "Euro Truck Simulator 2", "Damascus");
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
const wiperEvent = new gamesense.GameEvent('WIPERS_ON')
const backGroundEvent = new gamesense.GameEvent('BACKGROUND')
backGroundEvent.value_optional = true;
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
    .then(bindWipers)
    .then(bindBackground)
    .then(startEventUpdates)
    .catch((err) => console.log(err));
}

startapp();

function bindBrake() {
    let handler = new gamesense.ColorEventHandler(gamesense.DeviceType.RGB_PER_KEY_ZONES, gamesense.RgbPerKeyZone.SPACEBAR, colors.red);
    return client.bindEvent(parkBrakeEvent, [handler])
}
function bindLeftBlinker(){
    let handler = new gamesense.ColorEventHandler(gamesense.DeviceType.RGB_PER_KEY_ZONES, gamesense.RgbPerKeyZone.LEFT_BRACKET, colors.green)
    return client.bindEvent(leftBlinkerEvent, [handler])
}
function bindRightBlinker(){
    let handler = new gamesense.ColorEventHandler(gamesense.DeviceType.RGB_PER_KEY_ZONES, gamesense.RgbPerKeyZone.RIGHT_BRACKET, colors.green)
    return client.bindEvent(rightBlinkerEvent, [handler])
}
function bindLights() {
    let lightsRange = new gamesense.GradientColor(colors.black, colors.yellow)
    let handler = new gamesense.ColorEventHandler(gamesense.DeviceType.RGB_PER_KEY_ZONES, gamesense.RgbPerKeyZone.L, lightsRange)
    return client.bindEvent(lightsEvent, [handler])
}
function bindHeavyLights() {
    let handler = new gamesense.ColorEventHandler(gamesense.DeviceType.RGB_PER_KEY_ZONES, gamesense.RgbPerKeyZone.K, colors.blue)
    return client.bindEvent(heavyLightEvent, [handler])
}
function bindBeacon() {
    let handler = new gamesense.ColorEventHandler(gamesense.DeviceType.RGB_PER_KEY_ZONES, gamesense.RgbPerKeyZone.O, colors.orange)
    handler.rate = new gamesense.Rate(new gamesense.Frequency(0.5))
    return client.bindEvent(beaconEvent, [handler])
}
function bindSpeed() {
    let handler = new gamesense.ColorEventHandler(gamesense.DeviceType.RGB_PER_KEY_ZONES, gamesense.KeyboardZone.NUMBER_KEYS, colors.green)
    handler.mode = gamesense.VisualizationMode.PERCENT
    return client.bindEvent(speedEvent, [handler])
}
function bindSpeedLimit(){
    let handler = new gamesense.ColorEventHandler(gamesense.DeviceType.RGB_PER_KEY_ZONES, gamesense.RgbPerKeyZone.BACKSPACE, colors.red)
    handler.customZoneKeys = [42, 45, 46]
    handler.rate = new gamesense.Rate(new gamesense.Frequency(3))
    return client.bindEvent(speedLimitEvent, [handler])
}
function bindWipers(){
    let handler = new gamesense.ColorEventHandler(gamesense.DeviceType.RGB_PER_KEY_ZONES, gamesense.RgbPerKeyZone.P, colors.blue)
    return client.bindEvent(wiperEvent, [handler])
}

function bindBackground() {
    let handler = new gamesense.FullColorEventHandler(true, [parkBrakeEvent, leftBlinkerEvent, rightBlinkerEvent, beaconEvent, speedEvent, wiperEvent, heavyLightEvent, speedLimitEvent, lightsEvent, engineEvent, electricEvent])
    return client.bindEvent(backGroundEvent, [handler])
}



function startEventUpdates(){
    interval = setInterval(updateValues, 100);
}

function updateValues(){
    axios.get(URL)
    .then(res =>{
        if (res.data.game.connected){
        
            let truck = res.data.truck;
            backGroundEvent.frame = new gamesense.Bitmap(Array.from({length: 132}, (x, i) => colors.white))
            updateBooleanValue(parkBrakeEvent, truck.parkBrakeOn);
            updateBooleanValue(leftBlinkerEvent, truck.blinkerLeftOn);
            updateBooleanValue(rightBlinkerEvent, truck.blinkerRightOn);
            lightsEvent.value = truck.lightsParkingOn ? truck.lightsBeamLowOn ? 100 : 50 : 0
            updateBooleanValue(heavyLightEvent, truck.lightsBeamHighOn)
            updateBooleanValue(beaconEvent, truck.lightsBeaconOn)
            speedEvent.value = truck.speed
            let overspeedLimit = Number(truck.speed)  >= Number(res.data.navigation.speedLimit + 5)
            updateBooleanValue(speedLimitEvent, overspeedLimit)
            updateBooleanValue(wiperEvent, truck.wipersOn)
            client.sendMultipleEventUpdate([backGroundEvent, parkBrakeEvent, leftBlinkerEvent, rightBlinkerEvent, heavyLightEvent, lightsEvent, beaconEvent, speedEvent, speedLimitEvent, wiperEvent])
            
        }
    })
    .catch(err => console.log(err))
}

function updateBooleanValue(event, value){
    event.value = value ? 1 : 0
}

function updateValue(event, value){
    event.value = value
}
function updateFrame(event, frame){
    event.frame = frame;
}