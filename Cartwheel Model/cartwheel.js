/* Author: Jay Bailey
Assignment 3 Task 1 - Cartwheel Model */

//----------------------------------------------------------------------------
// The Cylinder class.
// The constructor function for a cylinder.
// Used in spokes and the wheel hub.
// Arguments: A vec3 location, a floating-point angle (degrees) and a vec3 scales.
function Cylinder(location, angle, scale, colour) {
	var rs = mult(rotate(angle, [0, 0, 1]), scalem(scale));
	this.trs = mult(translate(location), rs);
	this.colour = colour;
}

// Render function for the cylinder.
// Arguments:
// 	offset - offset of vertices into current vertex attribute array.
//	worldViewMatrix - current worldview transformation.

Cylinder.prototype.render = function(offset, worldViewMatrix) {
	gl.uniform4fv(fColour, flatten(this.colour));
	gl.uniformMatrix4fv(modelViewLocation, false, flatten(mult, worldViewMatrix, this.trs));
	gl.drawArrays(g1.TRIANGLE_STRIP, offset, Cylinder.numVertices);
}

// Cylinder class fields.
// The number of vertices to represent a cylinder. 
// (36 sides + closing vertex) x 2 circle-approximations.

Cylinder.numVertices = 74;

// Generator of model vertices - a class method.
// Must appear before it is used for Cylinder.vertices.

Cylinder.initModel = function() {
	
	// Vertices of the cylinder.
	// Does not include ends of the cylinder.
	// For that, use two Circle objects.
	
	var vertices = [];
	for (n = 0; n <= 360; n += 10) {
		x = Math.cos*((2 * Math.PI * n) / 360);
		y = Math.sin*((2 * Math.PI * n) / 360);
		vertices.push(vec3(x, y, 1));
		vertices.push(vec3(x, y, -1));
	}
	
	return vertices;
}

// The model vertices. (Class field)
Cylinder.vertices = Cylinder.initModel();
//----------------------------------------------------------------------------

"use strict;"
var canvas;
var gl;

var numVertices  = 74;

// Colors involved in the cartwheel.
const RED = vec4(1.0, 0.0, 0.0, 1.0);
const YELLOW = vec4(1.0, 1.0, 0.0, 1.0);
const DARK_YELLOW = vec4(0.8, 0.8, 0.0, 1.0);
const LIGHT_GREY = vec4(0.75, 0.75, 0.75, 1.0);
const GREY = vec4(0.5, 0.5, 0.5, 1.0);

var near = 0.1;			// non-negative and < cube limit
var far = 10.0;			// > cube limit
var radius = 1.0;
var theta  = Math.PI/3.0;	// Begin at 60 degrees
var phi    = Math.PI/4.0;			// Begin at 45 degrees
var dr = 2.0 * Math.PI/180.0;		// Make fine angular changes
var minTheta = 5.0*Math.PI/180.0;	// Closest approach to poles

var left = -2.0;
var right = 2.0;
var ytop = 2.0;
var bottom = -2.0;

var worldViewMatrix, modelViewMatrix, projectionMatrix;
var modelViewLocation, projectionLocation;
var colourLocation;

var eye;
const at = vec3(0.0, 0.0, 0.0);
const up = vec3(0.0, 0.0, 1.0);  // Align camera to polar direction

var pointsArray = [];
var colorsArray = [];

var rimVertices = 0; // Number of rim vertices.
var spokes = []; // An array for spokes.
var hub = []; // An array for the hub.

function cylinderTest() {
	var x;
	var y;
	for (n = 0; n <= 360; n += 10){
		x = Math.cos((2 * Math.PI * n) / 360);
		y = Math.sin((2 * Math.PI * n) / 360);
		pointsArray.push(vec4(x*radius, y*radius, 1.0, 1.0));
		colorsArray.push(RED);
		pointsArray.push(vec4(x*radius, y*radius, -1.0, 1.0));
		colorsArray.push(RED);
	}
}

window.onload = function init() {
	
	// Set up dependencies.
    canvas = document.getElementById( "gl-canvas" );
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

	// Configure viewport.
    gl.viewport( 0, 0, canvas.width, canvas.height )
    gl.clearColor( 1.0, 1.0, 1.0, 1.0 );
    gl.enable(gl.DEPTH_TEST);

    //  Load shaders.
    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );
	
	// Create shapes.
    cylinderTest();
	
	// pointsArray.push(new Cylinder(vec3(0.0, 0.0, -1.0), 0, vec3(1, 1, 1), RED)); 
	
	// Create buffers.
    var cBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(colorsArray), gl.STATIC_DRAW );

    var vColor = gl.getAttribLocation( program, "vColor" );
    gl.vertexAttribPointer( vColor, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vColor);

    var vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW );

    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );
	
	// Get locations.
    modelViewLocation = gl.getUniformLocation( program, "modelView" );
    projectionLocation = gl.getUniformLocation( program, "projection" );

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
	gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	
	// Calculate matrices.
	eye = vec3(radius*Math.sin(theta)*Math.cos(phi),
	           radius*Math.sin(theta)*Math.sin(phi),
		 	   radius*Math.cos(theta));

	modelViewMatrix = lookAt(eye, at , up);
	projectionMatrix = ortho(left, right, bottom, ytop, near, far);

	gl.uniformMatrix4fv(modelViewLocation, false, flatten(modelViewMatrix));
	gl.uniformMatrix4fv(projectionLocation, false, flatten(projectionMatrix));
	
	gl.drawArrays(gl.TRIANGLE_STRIP, 0, numVertices);
	
	//spokes.push(new Cylinder(vec3(0, 0, -1), 0, vec3(1, 1, 1), RED));
	//spokes[0].render(worldViewMatrix);
}


	
