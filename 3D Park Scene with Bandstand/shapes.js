// RectangularPrism class.
// Used for hedges and posts.

"use strict";

// Constructor for a hedge.
// Arguments: location (vec3), angle in degrees(float), scale (vec3), colour (vec4)

function RectangularPrism(location, angle, scale, colour) {
	this.trs = mult(translate(location), mult(rotate(angle, [0, 0, 1]), scalem(scale)));
	this.colour = colour;
}
	
// Render function.
RectangularPrism.prototype.render = function(worldViewMatrix) {
	gl.uniform4fv(colorLocation, flatten(this.colour));
	gl.uniformMatrix4fv(modelViewLocation, false, flatten(mult(worldViewMatrix, this.trs)));
	gl.drawArrays(gl.TRIANGLE_STRIP, RectangularPrism.offset, RectangularPrism.numVertices);
};

//RectangularPrism class fields.

// 12 triangle fans make up a rectangular prism - 2 for each side.
RectangularPrism.numVertices = 36;

RectangularPrism.initModel = function() {
	
	var corners = [
		vec3(0.0, 0.0, 1.0),
		vec3(0.0, 1.0, 1.0),
		vec3(1.0, 1.0, 1.0),
		vec3(1.0, 0.0, 1.0),
		vec3(0.0, 0.0, 0.0),
		vec3(0.0, 1.0, 0.0),
		vec3(1.0, 1.0, 0.0),
		vec3(1.0, 0.0, 0.0)
	];
	
	var vertices = [];
	
	// Takes in 4 numbers representing corners vertices.
	// Outputs six vertices that are used for two triangle strips to make a prism face.
	function createFace(a, b, c, d) {
		var faceVertices = [a, b, c, a, c, d];
		for (var i = 0; i < faceVertices.length; i++) {
			vertices.push(corners[faceVertices[i]]);
		}
	}
	
	function buildPrism() {
		createFace(1, 0, 3, 2);
		createFace(2, 3, 7, 6);
		createFace(3, 0, 4, 7);
		createFace(6, 5, 1, 2);
		createFace(4, 5, 6, 7);
		createFace(5, 4, 0, 1);
	}
	
	buildPrism();
	return vertices;
}

RectangularPrism.vertices = RectangularPrism.initModel();

// Circle class.
// Used to ensure cones/cylinders are enclosed. 

function Circle(location, angle, scale, colour) {
	this.trs = mult(translate(location), mult(rotate(angle, [0, 0, 1]), scalem(scale)));
	this.colour = colour;
}
	
// Render function.

Circle.prototype.render = function(worldViewMatrix) {
	gl.uniform4fv(colorLocation, flatten(this.colour));
	gl.uniformMatrix4fv(modelViewLocation, false, flatten(mult(worldViewMatrix, this.trs)));
	gl.drawArrays(gl.TRIANGLE_FAN, Circle.offset, Circle.numVertices);
}	
// Class fields.

Circle.numVertices = 37;
Circle.initModel = function() {
	var x, y;
	var vertices = [];
	for (var n = 0; n <= 360; n += 10) {
		x = Math.cos((2 * Math.PI * n) / 360);
		y = Math.sin((2 * Math.PI * n) / 360);
		vertices.push(vec3(x, y, 0));
	}
	
	return vertices;
}
	
Circle.vertices = Circle.initModel();

// Cylinder class.
// Used to create the trunks of trees.

function Cylinder(location, angle, scale, colour) {
	this.trs = mult(translate(location), mult(rotate(angle, [0, 0, 1]), scalem(scale)));
	this.colour = colour;
}

// Render function
Cylinder.prototype.render = function(worldViewMatrix) {
	gl.uniform4fv(colorLocation, flatten(this.colour));
	gl.uniformMatrix4fv(modelViewLocation, false, flatten(mult(worldViewMatrix, this.trs)));
	gl.drawArrays(gl.TRIANGLE_STRIP, Cylinder.offset, Cylinder.numVertices);
}

// Class fields.

Cylinder.numVertices = 74;
Cylinder.initModel = function() {
	var x, y;
	var vertices = [];
	for (var n = 0; n <= 360; n += 10) {
		x = Math.cos((2 * Math.PI * n) / 360);
		y = Math.sin((2 * Math.PI * n) / 360);
		vertices.push(vec3(x, y, 0));
		vertices.push(vec3(x, y, 1));
	}
	return vertices;
}

Cylinder.vertices = Cylinder.initModel();
	
// Cone class.
// Used to create the leaves of trees.

function Cone(location, angle, scale, colour) {
	this.trs = mult(translate(location), mult(rotate(angle, [0, 0, 1]), scalem(scale)));
	this.colour = colour;
}

// Render function
Cone.prototype.render = function(worldViewMatrix) {
	gl.uniform4fv(colorLocation, flatten(this.colour));
	gl.uniformMatrix4fv(modelViewLocation, false, flatten(mult(worldViewMatrix, this.trs)));
	gl.drawArrays(gl.TRIANGLE_FAN, Cone.offset, Cone.numVertices);
}

// Class fields.
Cone.numVertices = 38;

Cone.initModel = function () {
	var x, y;
	var vertices = [];
	vertices.push(vec3(0, 0, 1)); // Peak of cone.
	for (var n = 0; n <= 360; n += 10) {
		x = Math.cos((2 * Math.PI * n) / 360);
		y = Math.sin((2 * Math.PI * n) / 360);
		vertices.push(vec3(x, y, 0));
	}
	return vertices;
}

Cone.vertices = Cone.initModel();

// Tree class.
function Tree(location, angle, scales, leafColour, trunkColour) {
	
	this.leaves = new Cone(
		add(location, vec3(0, 0, scales[2])), 
		angle,
		mult(scales, vec3(1.7, 1.7, 2.0)),
		leafColour
	);
	
	this.trunk = new Cylinder(location, angle, mult(scales, vec3(0.4, 0.4, 1.0)), trunkColour);
}

Tree.prototype.render = function(worldViewMatrix) {
	this.trunk.render(worldViewMatrix);
	this.leaves.render(worldViewMatrix);
}

// Octagon class.

function Octagon(location, angle, scales, colour) {
	this.trs = mult(translate(location), mult(rotate(angle, [0, 0, 1]), scalem(scale)));
	this.colour = colour;
}

// Render function
Octagon.prototype.render = function(worldViewMatrix) {
	gl.uniform4fv(colorLocation, flatten(this.colour));
	gl.uniformMatrix4fv(modelViewLocation, false, flatten(mult(worldViewMatrix, this.trs)));
	gl.drawArrays(gl.TRIANGLE_FAN, Octagon.offset, Octagon.numVertices);
}

// Class fields.
Octagon.numVertices = 8;

Octagon.initModel = function() {
	var x, y;
	var angle = 2 * Math.PI / 8.0;
	var radius = 1.0;
	var vertices = [];
	
	for (var i = 0; i < 8; i++) {
		x = radius * (Math.cos * (i + 1.0/2.0));
		y = radius * (Math.sin * (i + 1.0/2.0));
		vertices.push(vec3(x, y, 0));
	}
	
	return vertices;
}

Octagon.vertices = Octagon.initModel();
	
// OctagonalPrism class.
/* function OctagonalPrism(location, angle, scales, baseColour, sideColour, height) {
	
	this.floor = new Octagon(location, angle, scales, baseColour);
	
	this.ceiling = new Octagon(
		add(location, vec3(0, 0, height)), angle, scales, baseColour);
}

// Render function.
OctagonalPrism.prototype.render = function(worldViewMatrix) {
	
	this.floor.render(worldViewMatrix);
	this.ceiling.render(worldViewMatrix);
	
	gl.uniform4fv(colorLocation, flatten(this.sideColour));
	gl.uniformMatrix4fv(modelViewLocation, false, flatten(mult(worldViewMatrix, this.trs)));
	gl.drawArrays(gl.TRIANGLE_FAN, OctagonalPrism.offset, OctagonalPrism.numVertices);
}

// Class fields.
OctagonalPrism.numVertices = 16;

OctagonalPrism.initModel = function() {
	
	var vertices = [];
	
	this.floor = new Octagon(location, this.angle, this.scales, this.baseColour);
	
	this.ceiling = new Octagon(
		add(location, vec3(0, 0, this.height)), this.angle, this.scales, this.baseColour);
	
	for (var i = 0; i < 8; i++) {
		vertices.push(vec3(ceiling.vertices[i]));
		vertices.push(vec3(floor.vertices[i]));
	}

	return vertices;
	
}

OctagonalPrism.vertices = OctagonalPrism.initModel(); */
	

// OctagonalPyramid class.

// BandstandRoof class.

// CircularStrip class.

// CircularDisk class.
	
	