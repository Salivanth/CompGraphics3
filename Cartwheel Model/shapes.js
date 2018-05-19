// Cylinder class.
// Used to create spokes and the central hub.

function Cylinder(location, angle, scale, colour) {
	this.trs = mult(translate(location), mult(rotate(angle, [1, 0, 0]), scalem(scale)));
	this.colour = colour;
}

// Render function
Cylinder.prototype.render = function(worldViewMatrix) {
	gl.uniform4fv(colorLocation, flatten(this.colour));
	gl.uniformMatrix4fv(modelViewLocation, false, flatten(mult(worldViewMatrix, this.trs)));
	gl.drawArrays(gl.TRIANGLE_STRIP, Cylinder.offset, Cylinder.numVertices);
}

// Class fields.

Cylinder.numVertices = 146;
Cylinder.initModel = function() {
	var x, y;
	var vertices = [];
	for (var n = 0; n <= 360; n += 5) {
		x = Math.cos((2 * Math.PI * n) / 360);
		y = Math.sin((2 * Math.PI * n) / 360);
		vertices.push(vec3(x, y, -1));
		vertices.push(vec3(x, y, 1));
	}
	return vertices;
}

Cylinder.vertices = Cylinder.initModel();

// Circle class.
// Used to create the ends of the central hub.

function Circle(location, angle, scale, colour) {
	this.trs = mult(translate(location), mult(rotate(angle, [1, 0, 0]), scalem(scale)));
	this.colour = colour;
}

// Render function.

Circle.prototype.render = function(worldViewMatrix) {
	gl.uniform4fv(colorLocation, flatten(this.colour));
	gl.uniformMatrix4fv(modelViewLocation, false, flatten(mult(worldViewMatrix, this.trs)));
	gl.drawArrays(gl.TRIANGLE_FAN, Circle.offset, Circle.numVertices);
}

// Class fields.
Circle.numVertices = 73;

Circle.initModel = function() {
	var x, y;
	var vertices = [];
	
	for (var n = 0; n <= 360; n += 5) {
		x = Math.cos((2 * Math.PI * n) / 360);
		y = Math.sin((2 * Math.PI * n) / 360);
		vertices.push(vec3(x, y, 0));
	}
	return vertices;
}

Circle.vertices = Circle.initModel();

// CircularStrip class.
// Used for the rim sides.
function CircularStrip(location, angle, scale, colour) {
	this.trs = mult(translate(location), mult(rotate(angle, [1, 0, 0]), scalem(scale)));
	this.colour = colour;
}

CircularStrip.prototype.render = function(worldViewMatrix) {
	gl.uniform4fv(colorLocation, flatten(this.colour));
	gl.uniformMatrix4fv(modelViewLocation, false, flatten(mult(worldViewMatrix, this.trs)));
	gl.drawArrays(gl.TRIANGLE_STRIP, CircularStrip.offset, CircularStrip.numVertices);
}

CircularStrip.numVertices = 146;

CircularStrip.initModel = function() {
	var x1, x2, y1, y2;
	var vertices = [];
	
	for (var n = 0; n <= 360; n += 5) {
		x1 = Math.cos((2 * Math.PI * n) / 360);
		x2 = x1 * 0.85;
		y1 = Math.sin((2 * Math.PI * n) / 360);
		y2 = y1 * 0.85;
		
		vertices.push(x1, y1, 1);
		vertices.push(x2, y2, 1);
	}
	
	return vertices;
}

CircularStrip.vertices = CircularStrip.initModel();