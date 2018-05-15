"use strict";

// WebGL related variables
var gl;
var canvas;

var fColour;
var vPosition;
var modelViewLocation;
var projectionLocation;

// View related variables
var near = 1.0;
var far = 300;

var fovy = 27.0;
var aspect;

var worldView;
var modelView;
var projection;

var eye = vec3(0.0, -75.0, 2.0);
var at = vec3(0.0, 0.0, 2.0);
const up = vec3(0.0, 0.0, 1.0);

// Colours
const LIGHT_GREEN = vec4(0.48, 0.70, 0.22, 1.0);
const MED_GREEN = vec4(0.41, 0.62, 0.27, 1.0);
const DARK_GREEN = vec4(0.33, 0.55, 0.33, 1.0);
const BROWN = vec4(0.55, 0.47, 0.37, 1.0);
const STONE = vec4(0.93, 0.87, 0.80, 1.0);
const DARK_STONE = vec4(0.85, 0.82, 0.74, 1.0);

// Objects in scene
// Grass (2000m x 2000m)
var grass = [
  vec3(1000.0, -1000.0, 0.0),
  vec3(1000.0, 1000.0, 0.0),
  vec3(-1000.0, 1000.0, 0.0),
  vec3(-1000.0, -1000.0, 0.0)
];
var numGrassVertices = grass.length;
var grassOffset;

// North-South Path
var pathNS = [];
var numPathNSVertices;
var pathNSOffset;

// East-West Path
var pathEW = [];
var numPathEWVertices;
var pathEWOffset;

// Trees
var trees = [];

// Temple
const COLUMN_HEIGHT = 4.0;
const COLUMN_DIAMETER = 1.0;
const COLUMN_SPACING = 2.0;
const LINTEL_HEIGHT = 0.5;
const BASE_WIDTH = 8.0;
const BASE_LENGTH = 13.0;
const BASE_LENGTH_EDGE = 1.5;
const BASE_X = BASE_WIDTH / 2;
const BASE_Y = BASE_LENGTH / 2;

const NUM_COLUMNS_LONG = 6;
const NUM_COLUMNS_SHORT = 4;

// Generate temple base (13m x 8m)
var base = [
  vec3(-BASE_X, -BASE_Y, 0.02),
  vec3(BASE_X, -BASE_Y, 0.02),
  vec3(BASE_X, BASE_Y, 0.02),
  vec3(-BASE_X, BASE_Y, 0.02),
]
var numBaseVertices = base.length;
var baseOffset;

var columns = [];
var lintels = [];

var roof = [];
var numRoofVertices;
var roofOffset;

window.onload = function init() {
  // Initialise dependencies
  canvas = document.getElementById("gl-canvas");
  gl = WebGLUtils.setupWebGL(canvas);
  if (!gl) { alert("WebGL isn't available"); }

  // Configure viewport
  gl.viewport(0, 0, canvas.width, canvas.height);
  aspect = canvas.width / canvas.height;

  gl.clearColor(0.64, 0.87, 1.0, 1.0);   // Sky blue
  gl.enable(gl.DEPTH_TEST);

  // Initialise objects
  generatePaths();
  generateTrees();
  generateTemple();

  // Load shaders
  var program = initShaders(gl, "vertex-shader", "fragment-shader");
  gl.useProgram(program);

  // Look up uniform/attribute locations
  fColour = gl.getUniformLocation(program, "fColour");
  vPosition = gl.getAttribLocation(program, "vPosition");
  modelViewLocation = gl.getUniformLocation(program, "modelView");
  projectionLocation = gl.getUniformLocation(program, "projection");

  // Create buffer and associate shader variable
  var vBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);

  // Calculate buffer data and object offsets
  var totalVertices = sizeof['vec3'] * (
    numGrassVertices + numPathNSVertices + numPathEWVertices +
    numBaseVertices + numRoofVertices + Cylinder.numVertices +
    Cone.numVertices + Cube.numVertices
  );
  gl.bufferData(gl.ARRAY_BUFFER, totalVertices, gl.STATIC_DRAW);

  grassOffset = 0;
  gl.bufferSubData(gl.ARRAY_BUFFER, sizeof['vec3'] * grassOffset, flatten(grass));

  pathNSOffset = grassOffset + numGrassVertices;
  gl.bufferSubData(gl.ARRAY_BUFFER, sizeof['vec3'] * pathNSOffset, flatten(pathNS));

  pathEWOffset = pathNSOffset + numPathNSVertices;
  gl.bufferSubData(gl.ARRAY_BUFFER, sizeof['vec3'] * pathEWOffset, flatten(pathEW));

  baseOffset = pathEWOffset + numPathEWVertices;
  gl.bufferSubData(gl.ARRAY_BUFFER, sizeof['vec3'] * baseOffset, flatten(base));

  roofOffset = baseOffset + numBaseVertices;
  gl.bufferSubData(gl.ARRAY_BUFFER, sizeof['vec3'] * roofOffset, flatten(roof));

  Cylinder.offset = roofOffset + numRoofVertices;
  gl.bufferSubData(gl.ARRAY_BUFFER, sizeof['vec3'] * Cylinder.offset, flatten(Cylinder.vertices));

  Cone.offset = Cylinder.offset + Cylinder.numVertices;
  gl.bufferSubData(gl.ARRAY_BUFFER, sizeof['vec3'] * Cone.offset, flatten(Cone.vertices));

  Cube.offset = Cone.offset + Cone.numVertices;
  gl.bufferSubData(gl.ARRAY_BUFFER, sizeof['vec3'] * Cube.offset, flatten(Cube.vertices));

  gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vPosition);

  // Calculate initial projection matrix
  projection = perspective(fovy, aspect, near, far);
  gl.uniformMatrix4fv(projectionLocation, false, flatten(projection));

  // Initialise event handler
  window.onkeydown = handleKeyDown;

  // Go!
  render();
}

// Paths are 5m wide and cross the entirety of the "map"
function generatePaths() {
  for (var i = -1000; i <= 1000; i += 100) {
    pathNS.push(vec3(i, -2.5, 0.01));
    pathNS.push(vec3(i, 2.5, 0.01));
    pathEW.push(vec3(-2.5, i, 0.01));
    pathEW.push(vec3(2.5, i, 0.01));
  }
  numPathNSVertices = pathNS.length;
  numPathEWVertices = pathEW.length;
}

// Randomly positions and sizes trees across the entire map
function generateTrees() {
  for (var i = -500; i < 500; i += 10) {
    var x = (Math.random() > 0.5 ? -1 : 1) * i * Math.random();
    var y = (Math.random() > 0.5 ? -1 : 1) * i * Math.random();

    // Ensure trees aren't spawned on top of temple
    if ((x > -BASE_X - 1 || x < BASE_X + 1) && (y > BASE_Y + 1 || y < -BASE_Y - 1)) {
      trees.push(
        new Tree(
          vec3(x, y, 0),
          Math.random(),
          vec3(1.0, 1.0, 1.0 + Math.random()),
          DARK_GREEN,
          BROWN
        )
      );
    }
  }
}

function generateTemple() {
  // Generate columns
  var scale = vec3(COLUMN_DIAMETER / 2, COLUMN_DIAMETER / 2, COLUMN_HEIGHT);

  // sides
  for (var i = BASE_LENGTH_EDGE; i < BASE_LENGTH; i += COLUMN_SPACING) {
    columns.push(new Cylinder(vec3(-BASE_X + 1, BASE_Y - i, 0), 0, scale, STONE));
    columns.push(new Cylinder(vec3(BASE_X - 1, BASE_Y - i, 0), 0, scale, STONE));
  }

  // front
  columns.push(new Cylinder(vec3(-BASE_X + 3, -BASE_Y + BASE_LENGTH_EDGE, 0), 0, scale, STONE));
  columns.push(new Cylinder(vec3(BASE_X - 3, -BASE_Y + BASE_LENGTH_EDGE, 0), 0, scale, STONE));

  // back
  columns.push(new Cylinder(vec3(-BASE_X + 3, BASE_Y - BASE_LENGTH_EDGE, 0), 0, scale, STONE));
  columns.push(new Cylinder(vec3(BASE_X - 3, BASE_Y - BASE_LENGTH_EDGE, 0), 0, scale, STONE));

  // Generate lintels
  // left and right
  scale = vec3(COLUMN_DIAMETER, BASE_LENGTH - 2, LINTEL_HEIGHT);
  lintels.push(new Cube(vec3(BASE_X - COLUMN_DIAMETER, -BASE_Y + BASE_LENGTH / 2, COLUMN_HEIGHT), 0, scale, DARK_STONE));
  lintels.push(new Cube(vec3(-BASE_X + COLUMN_DIAMETER, -BASE_Y + BASE_LENGTH / 2, COLUMN_HEIGHT), 0, scale, DARK_STONE));

  // front and back
  scale = vec3(BASE_WIDTH - 1.5, COLUMN_DIAMETER, LINTEL_HEIGHT);
  lintels.push(new Cube(vec3(-BASE_X + BASE_WIDTH / 2, -BASE_Y + BASE_LENGTH_EDGE, COLUMN_HEIGHT), 0, scale, DARK_STONE));
  lintels.push(new Cube(vec3(-BASE_X + BASE_WIDTH / 2, BASE_Y - BASE_LENGTH_EDGE, COLUMN_HEIGHT), 0, scale, DARK_STONE));

  // Generate roof
  roof = [
    // Front gable
    vec3(-BASE_X, -BASE_Y + 1, COLUMN_HEIGHT + LINTEL_HEIGHT - 0.25),
    vec3(-BASE_X + BASE_WIDTH, -BASE_Y + 1, COLUMN_HEIGHT + LINTEL_HEIGHT - 0.25),
    vec3(-BASE_X + (BASE_WIDTH / 2), -BASE_Y + 1, COLUMN_HEIGHT + LINTEL_HEIGHT + 1),

    // Back gable
    vec3(-BASE_X, BASE_Y - 1, COLUMN_HEIGHT + LINTEL_HEIGHT - 0.25),
    vec3(-BASE_X + BASE_WIDTH, BASE_Y - 1, COLUMN_HEIGHT + LINTEL_HEIGHT - 0.25),
    vec3(-BASE_X + (BASE_WIDTH / 2), BASE_Y - 1, COLUMN_HEIGHT + LINTEL_HEIGHT + 1),

    // Left side roof slope
    vec3(-BASE_X + (BASE_WIDTH / 2), -BASE_Y + 1, COLUMN_HEIGHT + LINTEL_HEIGHT + 1),
    vec3(-BASE_X, -BASE_Y + 1, COLUMN_HEIGHT + LINTEL_HEIGHT - 0.25),
    vec3(-BASE_X, BASE_Y - 1, COLUMN_HEIGHT + LINTEL_HEIGHT - 0.25),
    vec3(-BASE_X + (BASE_WIDTH / 2), BASE_Y - 1, COLUMN_HEIGHT + LINTEL_HEIGHT + 1),
    vec3(-BASE_X, BASE_Y - 1, COLUMN_HEIGHT + LINTEL_HEIGHT - 0.25),
    vec3(-BASE_X + (BASE_WIDTH / 2), -BASE_Y + 1, COLUMN_HEIGHT + LINTEL_HEIGHT + 1),

    // Right side roof slope
    vec3(-BASE_X + (BASE_WIDTH / 2), -BASE_Y + 1, COLUMN_HEIGHT + LINTEL_HEIGHT + 1),
    vec3(-BASE_X + BASE_WIDTH, -BASE_Y + 1, COLUMN_HEIGHT + LINTEL_HEIGHT - 0.25),
    vec3(-BASE_X + BASE_WIDTH, BASE_Y - 1, COLUMN_HEIGHT + LINTEL_HEIGHT - 0.25),
    vec3(-BASE_X + (BASE_WIDTH / 2), BASE_Y - 1, COLUMN_HEIGHT + LINTEL_HEIGHT + 1),
    vec3(-BASE_X + (BASE_WIDTH / 2), -BASE_Y + 1, COLUMN_HEIGHT + LINTEL_HEIGHT + 1),
    vec3(-BASE_X + BASE_WIDTH, BASE_Y - 1, COLUMN_HEIGHT + LINTEL_HEIGHT - 0.25),
  ]
  numRoofVertices = roof.length;
}

function handleKeyDown(event) {
  var key = String.fromCharCode(event.keyCode);
  var forwardVector = subtract(at, eye);
  var forwardVectorLength = length(forwardVector);
  var forward = normalize(forwardVector);
  var right = normalize(cross(forward, up));
  var viewAngleChange = 2.0 * Math.PI / 180.0;
  var atChange;

  switch(key) {
    case 'W':
      at = add(at, forward);
      eye = add(eye, forward);
      break;
    case 'S':
      at = subtract(at, forward);
      eye = subtract(eye, forward);
      break;
    case 'A':
      at = subtract(at, right);
      eye = subtract(eye, right);
      break;
    case 'D':
      at = add(at, right);
      eye = add(eye, right);
      break;
    case 'Q':
      atChange = subtract(
        scale(forwardVectorLength * (Math.cos(viewAngleChange) - 1.0), forward),
        scale(forwardVectorLength * Math.sin(viewAngleChange), right)
      );
      at = add(at, atChange);
      break;
    case 'E':
      atChange = add(
        scale(forwardVectorLength * (Math.cos(viewAngleChange) - 1.0), forward),
        scale(forwardVectorLength * Math.sin(viewAngleChange), right)
      );
      at = add(at, atChange);
      break;
  }
  render();
}

function render() {
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // Calculate model-view matrix
  worldView = lookAt(eye, at, up);
  gl.uniformMatrix4fv(modelViewLocation, false, flatten(worldView));

  // Render grass
  gl.uniform4fv(fColour, flatten(LIGHT_GREEN));
  gl.drawArrays(gl.TRIANGLE_FAN, 0, numGrassVertices);

  // Render paths
  gl.uniform4fv(fColour, flatten(MED_GREEN));
  gl.drawArrays(gl.TRIANGLE_STRIP, pathNSOffset, numPathNSVertices);

  gl.uniform4fv(fColour, flatten(MED_GREEN));
  gl.drawArrays(gl.TRIANGLE_STRIP, pathEWOffset, numPathEWVertices);

  // Render temple
  gl.uniform4fv(fColour, flatten(DARK_STONE));
  gl.drawArrays(gl.TRIANGLE_FAN, baseOffset, numBaseVertices);

  gl.uniform4fv(fColour, flatten(STONE));
  gl.drawArrays(gl.TRIANGLES, roofOffset, numRoofVertices);

  columns.forEach(function(column) { column.render(worldView) });
  lintels.forEach(function(lintel) { lintel.render(worldView) });

  // Render trees
  trees.forEach(function(tree) { tree.render(worldView) });
}
