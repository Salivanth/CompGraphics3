// Classes to generate various basic shapes: cylinders, cones, cubes, rectangular pyramids
// These shapes are used in composite to generate other objects.
"use strict";

// A useful helper method.
function degToRad(angle) {
  return angle * (Math.PI / 180);
}

// ===== CUBE =====
// A cube is made up of 6 square faces of two triangles each
// Constructor
// Args: location <vec3>, angle in degrees <number>, scaling factors <vec3>, colour <vec4>
function Cube(location, angle, scale, colour) {
  this.trs = mult(translate(location), mult(rotate(angle, [0, 0, 1]), scalem(scale)));
  this.colour = colour;
}

// Render function
// Args: worldView <vec3>
Cube.prototype.render = function(worldview) {
  gl.uniform4fv(fColour, flatten(this.colour));
	gl.uniformMatrix4fv(modelViewLocation, false, flatten(mult(worldview, this.trs)));
	gl.drawArrays(gl.TRIANGLES, Cube.offset, Cube.numVertices);
};

// Static properties of cube objects
Cube.numVertices = 36;

Cube.initModel = function() {
	var corners = [
		vec3(-0.5, -0.5,  0.5),
		vec3(-0.5,  0.5,  0.5),
		vec3( 0.5,  0.5,  0.5),
		vec3( 0.5, -0.5,  0.5),
		vec3(-0.5, -0.5, -0.5),
		vec3(-0.5,  0.5, -0.5),
		vec3( 0.5,  0.5, -0.5),
		vec3( 0.5, -0.5, -0.5)
	];
	var vertices = [];

	function quad(a, b, c, d) {
		var indices = [a, b, c, a, c, d];
		for (var i = 0; i < indices.length; ++i) {
			vertices.push(corners[indices[i]]);
		}
	}

	function doCube() {
		quad(1, 0, 3, 2);
		quad(2, 3, 7, 6);
		quad(3, 0, 4, 7);
		quad(6, 5, 1, 2);
		quad(4, 5, 6, 7);
		quad(5, 4, 0, 1);
	}

	doCube();
	return vertices;
}

Cube.vertices = Cube.initModel();


// ===== CYLINDER =====
// A cylinder is made up of two circles with their associated vertices joined
// Constructor
// Args:
function Cylinder(location, angle, scale, colour) {
  this.trs = mult(translate(location), mult(rotate(angle, [0, 0, 1]), scalem(scale)));
  this.colour = colour;
}

// Render function
// Args: worldView <vec3>
Cylinder.prototype.render = function(worldView) {
  gl.uniform4fv(fColour, flatten(this.colour));
  gl.uniformMatrix4fv(modelViewLocation, false, flatten(mult(worldView, this.trs)));
  gl.drawArrays(gl.TRIANGLE_STRIP, Cylinder.offset, Cylinder.numVertices);
}

// Static properties of cylinder objects
Cylinder.numVertices = 26;
Cylinder.initModel = function() {
  var x, y;
  var vertices = [];
  for (var i = 0; i <= 360; i += 30) {
    x = Math.cos(degToRad(i));
    y = Math.sin(degToRad(i));
    vertices.push(vec3(x, y, 1));
    vertices.push(vec3(x, y, 0));
  }
  return vertices;
}

Cylinder.vertices = Cylinder.initModel();

// ===== CONE =====
// Constructor
// Args: location <vec3>, angle in degrees <number>, scaling factors <vec3>, colour <vec4>
function Cone(location, angle, scale, colour) {
  this.trs = mult(translate(location), mult(rotate(angle, [0, 0, 1]), scalem(scale)));
  this.colour = colour;
}

// Render function
// Args: worldView <vec3>
Cone.prototype.render = function(worldView) {
  gl.uniform4fv(fColour, flatten(this.colour));
  gl.uniformMatrix4fv(modelViewLocation, false, flatten(mult(worldView, this.trs)));
  gl.drawArrays(gl.TRIANGLE_FAN, Cone.offset, Cone.numVertices);
}

// Static properties of cylinder objects
Cone.numVertices = 14;
Cone.initModel = function() {
  var x, y;
  var vertices = [];
  // Peak of cone
  vertices.push(vec3(0, 0, 1));
  for (var i = 0; i <= 360; i += 30) {
    x = Math.cos(degToRad(i));
    y = Math.sin(degToRad(i));
    vertices.push(vec3(x, y, 0));
  }
  return vertices;
}

Cone.vertices = Cone.initModel();
