const Serialport = require("serialport");
const EnttecUsbProMk2Driver = require("fivetwelve-driver-usbpro/es5");

async function start() {
  const deviceList = await Serialport.list();
  const dmxDevice = deviceList.find(
    device => device.manufacturer === "DMXking.com"
  );
  const usbproSerialport = new Serialport(dmxDevice.comName);
  const driver = new EnttecUsbProMk2Driver(usbproSerialport);

  const getDmxValue = dt => {
    const dmxValue = new Buffer(512);

    const createSetter = offset => (r, g, b, w) => {
      dmxValue[offset + 3] = 255;
      dmxValue[offset + 4] = Math.round(r * 255); // red
      dmxValue[offset + 5] = Math.round(g * 255); // green
      dmxValue[offset + 6] = Math.round(b * 255); // blue
      dmxValue[offset + 7] = Math.round(w * 255); // white
    };

    const createPanSetter = offset => (r, g, b, w, pan, tilt) => {
      dmxValue[offset + 1] = 127; // pan
      dmxValue[offset + 2] = 127; // pan fine
      dmxValue[offset + 3] = 129; // tilt
      dmxValue[offset + 4] = 127; // tilt fine
      dmxValue[offset + 5] = 2; // movement speed, lower is faster
      dmxValue[offset + 6] = 250; // 0-135, dim. 135-239 strobe. 240+ solid
      dmxValue[offset + 7] = Math.round(r * 255); // red
      dmxValue[offset + 8] = Math.round(g * 255); // green
      dmxValue[offset + 9] = Math.round(b * 255); // blue
      dmxValue[offset + 10] = Math.round(w * 255); // white
      dmxValue[offset + 11] = 0; // ?
      dmxValue[offset + 12] = 0; // ?
      dmxValue[offset + 13] = 0; // ?
      dmxValue[offset + 14] = 0; // ?
    };

    const panLights = [createPanSetter(80), createPanSetter(80 + 14)];

    const lights = [
      createSetter(0 * 8),
      createSetter(1 * 8),
      createSetter(2 * 8),
      createSetter(3 * 8),
      createSetter(4 * 8),
      createSetter(5 * 8),
      createSetter(6 * 8),
      createSetter(7 * 8),
      createSetter(8 * 8),
      createSetter(9 * 8)
    ];
    const f = Math.sin(dt / 5000) / 5 + 0.8;
    lights.forEach(setLight => setLight(f, f / 2, f / 2, f));
    panLights.forEach(setLight => setLight(f, f / 2, f / 2, 0));

    return dmxValue;
  };

  const startTime = Date.now();
  setInterval(() => {
    const now = Date.now();
    const dt = now - startTime;
    driver.send(getDmxValue(dt), 1);
  }, 16);
}

start().then(() => console.log("done"), console.error);
