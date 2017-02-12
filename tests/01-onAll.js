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

// Call f() on all 'at' tokens in the pcb.
PCB.onAll('at', pcb, f);
