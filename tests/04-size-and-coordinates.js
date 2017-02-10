#! /usr/bin/env node

// Import modules
var PCB = require('../kicad_pcb.js');
var FS  = require('fs');

// Load sample board.
var pcb = PCB.parseFile("sample.kicad_pcb");

// PCB dimensions are read from gr_lines on Edge.Cuts layer, arcs and 
// circles are not considered yet. Also beware that kicad Y+ is downwards.
console.log('Sample pcb is at:\n' +
	'\t' + PCB.coord.left(pcb) + ' <= X <= ' + PCB.coord.right(pcb) +
	', ' + PCB.size.width(pcb) + ' width.\n' +
	'\t' + PCB.coord.top(pcb) + ' <= Y <= ' + PCB.coord.bottom(pcb) + 
	', ' + PCB.size.height(pcb) + ' height.');

// Auxiliay axis origin (very useful for rotations later on).
console.log('Auxiliary axis origin is at:\n\t' + 
	PCB.coord.auxiliaryAxisOrigin(pcb));
