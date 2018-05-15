"use strict";

// WebGL related variables
var gl;
var canvas;
var vPosition;
var fColour;

// View related variables
var near = 0.1;
var far = 10;
var radius = 6.0;

var left = -2.0;
var right = 2.0;
var ytop = 2.0;
var bottom = -2.0;

var theta = Math.PI / 3.0;  // 60 degrees
var phi = Math.PI / 4.0;  // 45 degrees
var dr = 2.0 * Math.PI / 180.0;  // Fine angular changes
var minTheta = 5.0 * Math.PI / 180.0;  // Closest approach to poles

var eye;
const at = vec3(0.0, 0.0, 0.0);
const up = vec3(0.0, 0.0, 1.0);  // z axis points up

var modelViewMatrix, modelViewMatrixLocation;
var projectionMatrix, projectionMatrixLocation;

// Colours
const PURPLE = vec4(0.5, 0.3, 0.9, 1.0);
const BLACK = vec4(0.0, 0.0, 0.0, 1.0);
const WHITE = vec4(1.0, 1.0, 1.0, 1.0);

// Objects to be rendered
const ROWS = 51;
const COLUMNS = 51;

var data = [];
var pointsArray = [];
var elementsArray = [];

window.onload = function init() {
  // Initialise dependencies
  canvas = document.getElementById("gl-canvas");
  gl = WebGLUtils.setupWebGL(canvas);
  if (!gl) { alert("WebGL isn't available"); }

  // Configure viewport
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0.9, 0.9, 0.9, 1.0);
  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);
  gl.enable(gl.POLYGON_OFFSET_FILL);
  gl.polygonOffset(1.0, 2.0);

  // Calculate function points
  generateFunction();

  // Load shaders
  var program = initShaders(gl, "vertex-shader", "fragment-shader");
  gl.useProgram(program);

  // Look up uniform/attribute locations
  vPosition = gl.getAttribLocation(program, "vPosition");
  fColour = gl.getUniformLocation(program, "fColour");
  modelViewMatrixLocation = gl.getUniformLocation(program, "modelViewMatrix");
  projectionMatrixLocation = gl.getUniformLocation(program, "projectionMatrix");

  // Create buffers and associate shader variables
  var vBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW);
  gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vPosition);

  var iBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(elementsArray), gl.STATIC_DRAW);

  // Initialise event handlers
  window.onkeydown = handleKeyDown;

  render();
}

function render() {
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // Calculate Model-View and Projection matrices
  eye = vec3(radius * Math.sin(theta) * Math.sin(phi),
             radius * Math.sin(theta) * Math.cos(phi),
             radius * Math.cos(theta));

  modelViewMatrix = lookAt(eye, at, up);
  projectionMatrix = ortho(left, right, bottom, ytop, near, far);

  gl.uniformMatrix4fv(modelViewMatrixLocation, false, flatten(modelViewMatrix));
  gl.uniformMatrix4fv(projectionMatrixLocation, false, flatten(projectionMatrix));

  // Render the function plane
  gl.uniform4fv(fColour, flatten(PURPLE));
  for (var i = 0; i < ROWS - 1; i++) {
    gl.drawElements(gl.TRIANGLE_STRIP, 2 * COLUMNS, gl.UNSIGNED_SHORT, 2 * (COLUMNS * ROWS + i * 2 * COLUMNS));
  }

  // Render the mesh
  gl.uniform4fv(fColour, flatten(WHITE));
  for (var i = 0; i < ROWS; i++) {
    gl.drawArrays(gl.LINE_STRIP, i * COLUMNS, COLUMNS);
  }

  gl.uniform4fv(fColour, flatten(BLACK));
  for (var j = 0; j < COLUMNS; j++) {
    gl.drawElements(gl.LINE_STRIP, ROWS, gl.UNSIGNED_SHORT, 2 * j * ROWS);
  }
}

function handleKeyDown(event) {
  var key = String.fromCharCode(event.keyCode);
  switch(key) {
    case 'W':
      theta -= dr;
      if (theta < minTheta) {
        theta = minTheta;
      }
      break;
    case 'S':
      theta += dr;
      if (theta > Math.PI - minTheta) {
        theta = Math.PI - minTheta;
      }
      break;
    case 'A':
      phi -= dr;
      break;
    case 'D':
      phi += dr;
      break;
  }
  render();
}

function generateFunction() {
  // Calculate points
  for (var i = 0; i < ROWS; i++) {
    for (var j = 0; j < COLUMNS; j++) {
      var x = i / (ROWS-1);
      var y = j / (COLUMNS-1);
      var z = (x * x + y * y) * (x * x + y * y) - (x * x + y * y);

      pointsArray.push(vec4(
        2 * i / (ROWS - 1) - 1,
        2 * j / (COLUMNS - 1) - 1,
        z,
        1.0
      ));
    }
  }

  // Calculate meshes along columns
  for (var j = 0; j < COLUMNS; j++) {
    for (var i = 0; i < ROWS; i++) {
      elementsArray.push(j + i * COLUMNS);
    }
  }
  for (var i = 0; i < ROWS; i++) {
    for (var j = 0; j < COLUMNS; j++) {
      elementsArray.push(j + i * COLUMNS);
      elementsArray.push(j + (i + 1) * COLUMNS);
    }
  }
}
