// Class to generate a conifer tree
// A tree is made up of a cylindrical trunk with conical shape representing branches & leaves
"use strict";

function Tree(location, angle, scales, leafColour, trunkColour) {
  this.leaves = new Cone(
    add(location, vec3(0, 0, scales[2])),
    angle,
    mult(scales, vec3(1.7, 1.7, 2.0)),
    leafColour
  );
  this.trunk = new Cylinder(
    location,
    angle,
    mult(scales, vec3(0.4, 0.4, 1.0)),
    trunkColour
  );
}

Tree.prototype.render = function(worldview) {
  this.trunk.render(worldview);
  this.leaves.render(worldview);
}
