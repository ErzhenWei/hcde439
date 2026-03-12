// Store ultrasonic distance from Arduino
let distance = 0;

// Store accelerometer X value from Arduino
let accelX = 0;

// Serial communication variables
let port;
let reader;
let writer;

// Creates a string variable
let incomingText = "";

// Setup runs once at beginning
function setup() {

  // Create a 3D canvas (drawing area) using WEBGL renderer
  createCanvas(windowWidth, windowHeight, WEBGL);

  // Set background once initially
  // Fills canvas with dark gray color for better visuability
  background(20);

  // Add the user gesture (click) to open port
  document.getElementById("connectButton").addEventListener("click", connectSerial);
}

// Draw runs continuously (~60 frames per second)
function draw() {

  // Reset canvas before drawing new frame
  background(20);

  // Enable normal material for lighting effect
  normalMaterial();

  // Add basic light to scene
  // Adds light source to the 3D world
  directionalLight(255, 255, 255, 0, 0, -1);

  // Map accelerometer value to rotation in radians
  let rotationY = map(accelX, -17000, 17000, -PI, PI);

  // Rotate 3D object based on accelerometer tilt
  rotateY(rotationY);

  // Map ultrasonic distance to Z position
  let zPosition = map(distance, 0, 100, 300, -300);

  // Move object forward/backward based on distance
  translate(0, 0, zPosition);

  // Draw 3D cube of size 150
  box(150);

  // If serial writer exists, send LED brightness to Arduino
  if (writer) {

    // Map mouse X position to brightness (0–255)
    let brightness = int(map(mouseX, 0, width, 0, 255));

    // Constrain brightness within valid range
    brightness = constrain(brightness, 0, 255);

    // Send brightness value followed by newline
    writer.write(new TextEncoder().encode(brightness + "\n"));
  }
}

// Function to connect to Arduino using WebSerial
async function connectSerial() {

  // Ask user to select Arduino
  port = await navigator.serial.requestPort();

  // Open serial port at 9600 baud
  await port.open({ baudRate: 9600 });

  // Create reader for incoming data
  reader = port.readable.getReader();
  // Define the writer
  writer = port.writable.getWriter();

  // Start reading continuously
  readSerial(reader);
}

// Continuously read incoming serial data
async function readSerial(reader) {
  // loop forever  
  while (true) {
    // Wait for Arduino to send bytes to continue
    // value is still raw (binary data) here
    const { value, done } = await reader.read();

    // If text is undefined, the procedure shall stop
    if (done) break;
    let text = new TextDecoder().decode(value);
    // Append text to buffer
    incomingText += text;
    // Check if full line has been received
    if (incomingText.includes("\n")) {

      // Split by newline
      let lines = incomingText.split("\n");

      // Take first complete line
      let completeLine = lines[0];

      // Save remaining partial data
      incomingText = lines.slice(1).join("\n");

      // Parse the completed line
      parseData(completeLine);
    }
  }
}

// Function to parse Arduino data
function parseData(data) {
  // Split data using comma separator
  let values = data.split(",");
  // Only continue if successfully received two values
  if (values.length == 2) {
    // Convert text into actual number
    distance = Number(values[0]);
    accelX = Number(values[1]);
  }
}