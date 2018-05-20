// Author: Jay Bailey
// Task 2: Bandstand
// Creates the full bandstand scene.

// Instantiate initial variables.
"use strict;"
var canvas;
var gl;

var near = 1.0; // Clipping volume in meters.
var far = 300;

var fovy = 27.0;
var aspect;

var worldViewMatrix, modelViewMatrix, projectionMatrix;
var modelViewLocation, projectionLocation, colorLocation;

var eye = vec3(0.0, -75.0, 2.0); // Starts 75m back from origin, facing towards it.
var at = vec3(0.0, 0.0, 2.0);   // Uses standing height.
const up = vec3(0.0, 0.0, 1.0); // View-up point.

// Colors
const GRASS = vec4(0.0, 1.0, 0.0, 1.0); // Bright green
const PATHWAY = vec4(0.3, 0.3, 0.3, 1.0); // Gravel grey
const HEDGE = vec4(0.0, 0.3, 0.0, 1.0); // Dark green
const LEAVES = vec4(0.0, 0.6, 0.0, 1.0); // Medium green
const TRUNK = vec4(0.55, 0.25, 0.08, 1.0) // Brown
const BANDSTAND_BASE = vec4(0.95, 0.95, 0.95, 1.0); // White
const BANDSTAND_STEP = vec4(0.8, 0.8, 0.8, 1.0); // Light grey
const BANDSTAND_POST = vec4(0.4, 0.27, 0.13, 1.0) // Darker brown
const BANDSTAND_ROOF_BASE = vec4(1.0, 0.9, 0.8, 1.0) // Moccasin.
const BANDSTAND_ROOF = vec4(0.7, 0.12, 0.12, 1.0); // Terracotta red

// Create grass between -1000 and 1000 meters.
var grass = [
	vec3(1000, -1000.0, 0.0), 
	vec3(1000.0, 1000.0, 0.0),
	vec3(-1000.0, 1000.0, 0.0),
	vec3(-1000.0, -1000.0, 0.0)
];
	
var numGrassVertices = 4; // Total grass vertices.

var eastWestPath = [
	vec3(-500.0, 1.0, 0.01),
	vec3(500.0, 1.0, 0.01),
	vec3(500.0, -1.0, 0.01),
	vec3(-500.0, -1.0, 0.01)
];

var numEWPathVertices = 4;

var northSouthPath = [
	vec3(-1.0, 500.0, 0.01),
	vec3(1.0, 500.0, 0.01),
	vec3(1.0, -500.0, 0.01),
	vec3(-1.0, -500.0, 0.01)
]

var numNSPathVertices = 4;

// Arrays for instance transformations.
var hedges = [];
var trees = [];
var steps = []; 
var posts = [];
var roofBase = [];
var roof = [];

window.onload = function init() {
	
	// Initial dependencies.
	canvas = document.getElementById("gl-canvas");
    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) { alert("WebGL isn't available"); }

	// Adjust viewport.
    gl.viewport(0, 0, canvas.width, canvas.height);
    aspect =  canvas.width/canvas.height;
	
	gl.clearColor(0.6, 0.8, 1.0, 1.0); // Create sky background.
	gl.enable(gl.DEPTH_TEST);
	
	//Initialise objects
	generateHedges();
	generateTrees();
	generateBandstand();
	
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
	var totalVertices = sizeof['vec3'] * (numGrassVertices + numEWPathVertices +
	numNSPathVertices + RectangularPrism.numVertices + Cylinder.numVertices + 
	Cone.numVertices + Octagon.numVertices + Step.numVertices + 
	OctagonalPyramid.numVertices);
	
	gl.bufferData(gl.ARRAY_BUFFER, totalVertices, gl.STATIC_DRAW);
	
	// Calculate initial projection matrix.
	projection = perspective(fovy, aspect, near, far);
	gl.uniformMatrix4fv(projectionLocation, false, flatten(projection));
	
	// Make buffer space for grass.
	grassOffset = 0;
	gl.bufferSubData(gl.ARRAY_BUFFER, sizeof['vec3'] * grassOffset, flatten(grass));
	
	// Make buffer space for east-west path.
	pathEWOffset = grassOffset + numGrassVertices;
	gl.bufferSubData(gl.ARRAY_BUFFER, sizeof['vec3'] * pathEWOffset, flatten(eastWestPath));
	
	// Make buffer space for north-south path.
	pathNSOffset = pathEWOffset + numEWPathVertices;
	gl.bufferSubData(gl.ARRAY_BUFFER, sizeof['vec3'] * pathNSOffset, flatten(northSouthPath));
	
	// Make buffer space for hedges.
	RectangularPrism.offset = pathNSOffset + numNSPathVertices;
	gl.bufferSubData(gl.ARRAY_BUFFER, sizeof['vec3'] * RectangularPrism.offset, flatten(RectangularPrism.vertices));
	
	// Make buffer space for trees.
	Cylinder.offset = RectangularPrism.offset + RectangularPrism.numVertices;
	gl.bufferSubData(gl.ARRAY_BUFFER, sizeof['vec3'] * Cylinder.offset, flatten(Cylinder.vertices));
	
	Cone.offset = Cylinder.offset + Cylinder.numVertices;
	gl.bufferSubData(gl.ARRAY_BUFFER, sizeof['vec3'] * Cone.offset, flatten(Cone.vertices));
	
	// Make buffer space for bandstand steps.
	Octagon.offset = Cone.offset + Cone.numVertices;
	gl.bufferSubData(gl.ARRAY_BUFFER, sizeof['vec3'] * Octagon.offset, flatten(Octagon.vertices));
	
	Step.offset = Octagon.offset + Octagon.numVertices;
	gl.bufferSubData(gl.ARRAY_BUFFER, sizeof['vec3'] * Step.offset, flatten(Step.vertices));
	
	// Make buffer space for roof.
	OctagonalPyramid.offset = Step.offset + Step.numVertices;
	gl.bufferSubData(gl.ARRAY_BUFFER, sizeof['vec3'] * OctagonalPyramid.offset, flatten(OctagonalPyramid.vertices));
	
	// Event handlers
	// Buttons to change fovy
	// Taken from Ken Lodge's "desert" code.
	document.getElementById("Button1").onclick = function() {
		fovy += 6.0;
		if (fovy > 45.0) {fovy = 45.0;}
		projection = perspective(fovy, aspect, near, far);
		gl.uniformMatrix4fv(projectionLocation, false, flatten(projection));
		render();
	};
	document.getElementById("Button2").onclick = function() {
		fovy -= 6.0;
		if (fovy < 15.0) {fovy = 15.0;}
		projection = perspective(fovy, aspect, near, far);
		gl.uniformMatrix4fv(projectionLocation, false, flatten(projection));
		render();
	};

	// Keys to change viewing position/direction
	// Inefficient code arranged for readability
	// Taken from Ken Lodge's "desert" code.
	window.onkeydown = function(event) {
		var key = String.fromCharCode(event.keyCode);
		var forev = subtract(at, eye);				// current view forward vector
		var foreLen = length(forev);				// current view forward vector length
		var fore = normalize(forev);				// current view forward direction
		var right = normalize(cross(fore, up));		// current horizontal right direction
		var ddir = 2.0*Math.PI/180.0;				// incremental view angle change
		var dat;									// incremental at change
		switch( key ) {
		  case 'W':
			at = add(at, fore);
			eye = add(eye, fore);
			break;
		  case 'S':
			at = subtract(at, fore);
			eye = subtract(eye, fore);
			break;
		  case 'A':
		    at = subtract(at, right);
		    eye = subtract(eye, right);
		    break;
		  case 'D':
		    at = add(at, right);
		    eye = add(eye, right);
		    break;
		  // The following calculate the displacement of 'at' for +/- 2 degree view angle change
		  //   around the horizontal circle centred at 'eye', then apply it to 'at'
		  case 'Q':
		    dat = subtract(scale(foreLen*(Math.cos(ddir) - 1.0), fore), scale(foreLen*Math.sin(ddir), right));
		    at = add(at, dat);
		    break;
		  case 'E':
		    dat = add(scale(foreLen*(Math.cos(ddir) - 1.0), fore), scale(foreLen*Math.sin(ddir), right));
		    at = add(at, dat);
		    break;
		case 'Z':
			eye[2] += 0.25;
			at[2] += 0.25;
			break;
		case 'X':
			eye[2] -= 0.25;
			at[2] -= 0.25;
			break;
		}
		render();
	};
	
	render();
}

function render() {
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	
	worldViewMatrix = lookAt(eye, at, up);
	
	gl.uniformMatrix4fv(modelViewLocation, false, flatten(worldViewMatrix));
	
	// Render grass.
	gl.uniform4fv(colorLocation, flatten(GRASS));
	gl.drawArrays(gl.TRIANGLE_FAN, 0, numGrassVertices);
	
	// Render pathways.
	gl.uniform4fv(colorLocation, flatten(PATHWAY));
	gl.drawArrays(gl.TRIANGLE_FAN, pathEWOffset, numEWPathVertices);
	
	gl.uniform4fv(colorLocation, flatten(PATHWAY));
	gl.drawArrays(gl.TRIANGLE_FAN, pathNSOffset, numNSPathVertices);
	
	// Render hedges. 
	hedges.forEach(function(RectangularPrism) { RectangularPrism.render(worldViewMatrix) });
	
	// Render trees.
	trees.forEach(function(Tree) { Tree.render(worldViewMatrix) });
	
	// Render steps.
	steps.forEach(function(BandstandBase) { BandstandBase.render(worldViewMatrix) });
	
	// Render posts.
	posts.forEach(function(RectangularPrism) { RectangularPrism.render(worldViewMatrix) });
	
	// Render roof. (Extendable to multiple bandstands)
	roofBase.forEach(function(Octagon) { Octagon.render(worldViewMatrix) });
	roof.forEach(function(OctagonalPyramid) { OctagonalPyramid.render(worldViewMatrix) });

}

// Create hedges.

function generateHedges() {
	
	var verticalScale = vec3(2, 39, 3); // Vertically-faced hedges.
	var horizontalScale = vec3(39, 2, 3); // Horizontally-faced hedges.
	
	// Vertical hedges.
	hedges.push(new RectangularPrism(vec3(-40, -40, 0), 0, verticalScale, HEDGE));
	hedges.push(new RectangularPrism(vec3(-40, 1, 0), 0, verticalScale, HEDGE));
	hedges.push(new RectangularPrism(vec3(38, 1, 0), 0, verticalScale, HEDGE));
	hedges.push(new RectangularPrism(vec3(38, -40, 0), 0, verticalScale, HEDGE));
	
	//Horizontal hedges.
	hedges.push(new RectangularPrism(vec3(-40, -40, 0), 0, horizontalScale, HEDGE));
	hedges.push(new RectangularPrism(vec3(-40, 38, 0), 0, horizontalScale, HEDGE));
	hedges.push(new RectangularPrism(vec3(1, 38, 0), 0, horizontalScale, HEDGE));
	hedges.push(new RectangularPrism(vec3(1, -40, 0), 0, horizontalScale, HEDGE));
}

function generateTrees() {
	
	var smallTree = vec3(1, 1, 1); // Scales to a small tree.
	var mediumTree = vec3(2, 2, 2); // Scales to a medium tree.
	var largeTree = vec3(3, 3, 3); // Scales to a large tree.
	var tallTree = vec3(2, 2, 5); // Scales to a tall tree.
	
	// Trees inside of hedge.
	trees.push(new Tree(vec3(-10, 20, 0), 0, largeTree, LEAVES, TRUNK));
	trees.push(new Tree(vec3(-10, 5, 0), 0, largeTree, LEAVES, TRUNK));
	trees.push(new Tree(vec3(-10, -10, 0), 0, largeTree, LEAVES, TRUNK));
	
	// Small trees outside entrances.
	trees.push(new Tree(vec3(5, -50, 0), 0, smallTree, LEAVES, TRUNK));
	trees.push(new Tree(vec3(-5, -50, 0), 0, smallTree, LEAVES, TRUNK));
	trees.push(new Tree(vec3(5, 50, 0), 0, smallTree, LEAVES, TRUNK));
	trees.push(new Tree(vec3(-5, 50, 0), 0, smallTree, LEAVES, TRUNK));
	
	trees.push(new Tree(vec3(-50, 5, 0), 0, smallTree, LEAVES, TRUNK));
	trees.push(new Tree(vec3(-50, -5, 0), 0, smallTree, LEAVES, TRUNK));
	trees.push(new Tree(vec3(50, 5, 0), 0, smallTree, LEAVES, TRUNK));
	trees.push(new Tree(vec3(50, -5, 0), 0, smallTree, LEAVES, TRUNK));
	
	// Trees in background.
	trees.push(new Tree(vec3(15, 75, 0), 0, tallTree, LEAVES, TRUNK));
	trees.push(new Tree(vec3(-25, 80, 0), 0, tallTree, LEAVES, TRUNK));
	trees.push(new Tree(vec3(-5, 90, 0), 0, tallTree, LEAVES, TRUNK));
	trees.push(new Tree(vec3(30, -60, 0), 0, mediumTree, LEAVES, TRUNK));
	trees.push(new Tree(vec3(-10, -55, 0), 0, mediumTree, LEAVES, TRUNK));
	
	trees.push(new Tree(vec3(70, 5, 0), 0, tallTree, LEAVES, TRUNK));
	trees.push(new Tree(vec3(-50, -15, 0), 0, tallTree, LEAVES, TRUNK));
	trees.push(new Tree(vec3(-90, -35, 0), 0, tallTree, LEAVES, TRUNK));
	trees.push(new Tree(vec3(85, 20, 0), 0, tallTree, LEAVES, TRUNK));
	
}

function generateBandstand() {
	
	// Scales needed for generation of Bandstand.
	var bandstandStepOne = vec3(8, 8, 0.25);
	var bandstandStepTwo = vec3(7.4, 7.4, 0.25);
	var bandstandStepThree = vec3(6.8, 6.8, 0.25);
	var squarePost = vec3(0.3, 0.3, 4);
	var bandstandRoofBase = vec3(6.8, 6.8, 0);
	var bandstandRoof = vec3(6.8, 6.8, 4);
	
	// Create steps.
	steps.push(new BandstandStep(vec3(0, 0, 0), 0, bandstandStepOne, BANDSTAND_BASE, BANDSTAND_STEP));
	steps.push(new BandstandStep(vec3(0, 0, 0.25), 0, bandstandStepTwo, BANDSTAND_BASE, BANDSTAND_STEP));
	steps.push(new BandstandStep(vec3(0, 0, 0.5), 0, bandstandStepThree, BANDSTAND_BASE, BANDSTAND_STEP));
	
	// Create posts.
	
	// Create an octagon around which posts can be placed.
	var angle = 2 * Math.PI / 8;
	var radius = 6;
	var x, y;
	
	for (i = 0; i < 8; i++) {
		// 1/2 is added so the octagon corners are not overlapping with the pathways.
		x = radius * Math.cos(angle * (i + 1.0/2.0));
		y = radius * Math.sin(angle * (i + 1.0/2.0));
		
		//Rendering with x and y at -0.15 ensures the 0.3m posts are centered at the point.
		//Otherwise, the posts wouldn't be symmetrical across the entire octagon.
		posts.push(new RectangularPrism(vec3(x - 0.15, y - 0.15, 0.4), 0, squarePost, BANDSTAND_POST));
	}
	
	// Create ceiling.
	roofBase.push(new Octagon(vec3(0, 0, 4.5), 0, bandstandRoofBase, BANDSTAND_BASE));
	roof.push(new OctagonalPyramid(vec3(0, 0, 4.5), 0, bandstandRoof, BANDSTAND_ROOF));
	
}