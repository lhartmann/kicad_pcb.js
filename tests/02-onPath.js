#! /usr/bin/env node

// Import modules
var PCB = require('../kicad_pcb.js');
var FS  = require('fs');

// Load sample board.
var pcb = PCB.readFileSync("sample.kicad_pcb");

// Create a token manipulation function.
function f(token) {
	// You can change the token, but for now just print.
	console.log(token);
}

// Call f() on starting coordinates of graphical lines of the pcb.
// The list must include the root token name too.
PCB.onPath(['kicad_pcb', 'gr_line', 'start'], pcb, f);
