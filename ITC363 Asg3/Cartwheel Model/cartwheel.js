// Author: Jay Bailey
// Task 1: Cartwheel
// Creates the cartwheel in orthographic view.

// Instantiate initial variables.
"use strict;"
var canvas;
var gl;

var near = 0.1;			// non-negative and < cube limit
var far = 10.0;			// > cube limit
var radius = 2.0;
var theta  = Math.PI/3.0;	// Begin at 60 degrees
var phi    = Math.PI/4.0;			// Begin at 45 degrees
var dr = 2.0 * Math.PI/180.0;		// Make fine angular changes
var minTheta = 5.0*Math.PI/180.0;	// Closest approach to poles

var left = -2.0;
var right = 2.0;
var ytop = 2.0;
var bottom = -2.0;

var worldViewMatrix, modelViewMatrix, projectionMatrix;
var modelViewLocation, projectionLocation, colorLocation;

var eye = vec3(0.0, 0.0, 0.0);
var at = vec3(0.0, 0.0, 0.0);   // Uses standing height.
const up = vec3(0.0, 0.0, 1.0); // View-up point.

// Colors
const HUB_CYLINDER = vec4(1.0, 1.0, 0.0, 1.0); // Yellow
const HUB_CIRCLE = vec4(0.85, 0.85, 0.0, 1.0); // Darker yellow.
const SPOKES = vec4(1.0, 0.0, 0.0, 1.0); // Red
const OUTER_RIM = vec4(0.8, 0.8, 0.8, 1.0); // Light grey.
const INNER_RIM = vec4(0.95, 0.95, 0.95, 1.0); // White
const RIM_SIDES = vec4(0.9, 0.7, 0.7, 1.0); // Pale red.

// Arrays for instance transformations.
var hubCylinder = [];
var hubCircles = [];
var spokes = [];
var rimStrips = [];
var rimSides = [];

window.onload = function init() {
	
	// Initial dependencies.
	canvas = document.getElementById("gl-canvas");
    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) { alert("WebGL isn't available"); }

	// Adjust viewport.
    gl.viewport(0, 0, canvas.width, canvas.height);
    aspect =  canvas.width/canvas.height;
	
	gl.clearColor(0.5, 0.5, 0.5, 1.0); // Create dark grey background.
	gl.enable(gl.DEPTH_TEST);
	
	//Initialise objects
	generateHub();
	generateSpokes();
	generateRim();
	
	// Load shaders
	var program = initShaders(gl, "vertex-shader", "fragment-shader");
	gl.useProgram(program)
	
	var vBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
	
	var vPosition = gl.getAttribLocation(program, "vPosition");
	gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(vPosition);
	
	// Look up locations
	modelViewLocation = gl.getUniformLocation(program, "modelView");
	projectionLocation = gl.getUniformLocation(program, "projection");
	colorLocation = gl.getUniformLocation(program, "colour");
	
	// Total number of vertices for buffer.
	var totalVertices = sizeof['vec3'] * (Cylinder.numVertices +
	Circle.numVertices + CircularStrip.numVertices);
	
	gl.bufferData(gl.ARRAY_BUFFER, totalVertices, gl.STATIC_DRAW);
	
	// Calculate initial projection matrix.
	var aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
	projection = ortho(left, right, ytop, bottom, near, far);
	gl.uniformMatrix4fv(projectionLocation, false, flatten(projection));

	// Make buffer space for trees.
	Cylinder.offset = 0;
	gl.bufferSubData(gl.ARRAY_BUFFER, sizeof['vec3'] * Cylinder.offset, flatten(Cylinder.vertices));

	Circle.offset = Cylinder.offset + Cylinder.numVertices;
	gl.bufferSubData(gl.ARRAY_BUFFER, sizeof['vec3'] * Circle.offset, flatten(Circle.vertices));
	
	CircularStrip.offset = Circle.offset + Circle.numVertices;
	gl.bufferSubData(gl.ARRAY_BUFFER, sizeof['vec3'] * CircularStrip.offset, flatten(CircularStrip.vertices));
	
	// keys to change viewing position
	window.onkeydown = function(event) {
		var key = String.fromCharCode(event.keyCode);
		switch( key ) {
		  case 'W':
			theta -= dr;
			// On decrease prevent theta < minimum
			if (theta < minTheta) {
				theta = minTheta;
			}
			break;
		  case 'S':
			theta += dr;
			// On increase prevent theta > maximum
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
	};
	
	render();
}

function render() {
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	
	eye = vec3(radius*Math.sin(theta)*Math.cos(phi),
	           radius*Math.sin(theta)*Math.sin(phi),
		 	   radius*Math.cos(theta));
			   
	worldViewMatrix = lookAt(eye, at, up);
	projectionMatrix = ortho(left, right, bottom, ytop, near, far);
	
	gl.uniformMatrix4fv(modelViewLocation, false, flatten(worldViewMatrix));
	gl.uniformMatrix4fv(projectionLocation, false, flatten(projectionMatrix));
	
	// Render central hub.
	hubCylinder.forEach(function(Cylinder) { Cylinder.render(worldViewMatrix) });
	hubCircles.forEach(function(Circle) { Circle.render(worldViewMatrix) });
	
	// Render spokes.
	spokes.forEach(function(Cylinder) { Cylinder.render(worldViewMatrix) });
	
	// Render rim.
	rimStrips.forEach(function(Cylinder) { Cylinder.render(worldViewMatrix) });
	rimSides.forEach(function(CircularStrip) { CircularStrip.render(worldViewMatrix) });
}

function generateHub() {
	
	var hubScale = vec3(0.2, 0.2, 0.2);
	var hubAngle = 90.0;
	
	hubCylinder.push(new Cylinder(vec3(0.0, 0.0, 0.0), hubAngle, hubScale, HUB_CYLINDER));
	hubCircles.push(new Circle(vec3(0.0, -0.2, 0.0), hubAngle, hubScale, HUB_CIRCLE));
	hubCircles.push(new Circle(vec3(0.0, 0.2, 0.0), hubAngle, hubScale, HUB_CIRCLE));
}

function generateSpokes() {
	
	var spokeAngle = 0.0;
    var innerRadius = 0.2;
    var outerRadius = 0.85;
    var spokeScale = vec3(0.02, 0.02, (outerRadius - innerRadius) / 2);
	
	for (var i = 0; i < 12; i++) {
		var x = Math.cos((2 * Math.PI * i * 30) / 360) * 0.2;
		var y = Math.sin((2 * Math.PI * i * 30) / 360) * 0.2;
		var spoke = new Cylinder(vec3(0, 0, 0.0), 0, vec3(0,0,0), SPOKES);
        spoke.trs = mult(rotate((i/12)*360, [0, 1, 0]), mult(translate(0,0,(innerRadius + outerRadius)*0.5),scalem(spokeScale)) );
        spokes.push(spoke);
	}
}

function generateRim() {
	
	var outerRimScale = vec3(1.0, 1.0, 0.1);
	var innerRimScale = vec3(0.85, 0.85, 0.1);
	var stripScale = vec3(1.0, 1.0, 0.1);
	
	var rimAngle = 90.0;
	var stripAngle = 90.0;
	
	rimStrips.push(new Cylinder(vec3(0, 0, 0), rimAngle, outerRimScale, OUTER_RIM));
	rimStrips.push(new Cylinder(vec3(0, 0, 0), rimAngle, innerRimScale, INNER_RIM));
	
	rimSides.push(new CircularStrip(vec3(0, 0, 0), stripAngle, stripScale, RIM_SIDES));
	rimSides.push(new CircularStrip(vec3(0.0, 0.2, 0.0), stripAngle, stripScale, RIM_SIDES));
}