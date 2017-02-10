#! /usr/bin/env node

// Import modules
var PCB = require('../kicad_pcb.js');
var FS  = require('fs');

// Load sample board.
var pcb = PCB.parseFile("sample.kicad_pcb");

// Find out required offsets
var dx = PCB.size.width(pcb) + 2.54;
var dy = PCB.size.height(pcb) + 2.54;

// Create a simple 10 columns, 5 rows panel
var panel = PCB.clone(pcb);
PCB.panelize(dx,dy, 10,5, panel);
PCB.saveFile('panel.kicad_pcb', panel);

// Custom panelization:
// Sensible placement of the auxiliary origin marker woud have been nice,
// but using incremental transformations on 'tmp' will do nicely.
// If you find this hard to grasp then try saving and inspecting the partials.

//   Start with a single copy, let's call it "top left".
var panel = PCB.clone(pcb); 

//   Make a rotated copy to the right, i.e., rotate around the top-right,
//   then move right another 2.54mm for clearance.
var tmp = PCB.clone(pcb);
PCB.transform(2.54, 0, 90, PCB.coord.topRight(tmp), tmp);
PCB.join(panel, tmp);

//   tmp is still at the top-right, so to get a board on the bottom-right
//   we rotate tmp around it's bottom-right corner then move down 2.54mm
//   for clearance.
PCB.transform(0, 2.54, 90, PCB.coord.bottomRight(tmp), tmp);
PCB.join(panel, tmp);

//   tmp is still at the bottom-right, so to get a board on the bottom-left
//   we rotate tmp around it's bottom-left corner then move left 2.54mm
//   for clearance.
PCB.transform(-2.54, 0, 90, PCB.coord.bottomLeft(tmp), tmp);
PCB.join(panel, tmp);

// Repeat 4x4 grid
var dx = PCB.size.width(panel) + 2.54;
var dy = PCB.size.height(panel) + 2.54;
PCB.panelize(dx,dy,4,4,panel);

PCB.saveFile('panel2.kicad_pcb', panel);
