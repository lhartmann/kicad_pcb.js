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
// Sensible placement of the auxiliary origin marker woud have been nice...

//   Start with a single copy
var panel = PCB.clone(pcb); 

//   Add a rotated copy to the right
var tmp = PCB.clone(pcb);
PCB.transform(2.54, 0, 90, PCB.coord.topRight(tmp), tmp);
PCB.join(panel, tmp);

//   Add a couple more rotated copies below
var tmp = PCB.clone(panel);
PCB.transform(
	0, // X displacement
	PCB.size.width(pcb)-PCB.size.height(pcb)+2.54, // Y displacement
	180, // Rotation
	PCB.coord.fraction(.5,1,tmp), // Rotation reference (bottom-center)
	tmp
);
PCB.join(panel, tmp);

// Repeat 4x4 grid
var dx = PCB.size.width(panel) + 2.54;
var dy = PCB.size.height(panel) + 2.54;
PCB.panelize(dx,dy,4,4,panel);

PCB.saveFile('panel2.kicad_pcb', panel);
