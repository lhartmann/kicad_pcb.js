#! /usr/bin/env node

// Import modules
var PCB = require('../kicad_pcb.js');
var FS  = require('fs');

// Load sample board.
var pcb = PCB.readFileSync("sample.kicad_pcb");

// Iterate all modules by path
PCB.onPath(['kicad_pcb', 'module'], pcb, (module) => {
	// Find all pads by path
	var squarePads = new Array();
	PCB.onPath(['module', 'pad'], module, (pad) => {
		// Ignore all but rectangular pads.
		if (pad[3] != 'rect')
			return;
		
		// Add the name of rectangular pads to the list.
		squarePads.splice(0,0,pad[1]);
	});

	// Skip module if no square pads were found
	if (!squarePads.length)
		return;
	
	// Find out the name of the module
	var reference = false;
	PCB.onPath(['module', 'fp_text'], module, (fp_text) => {
		if (fp_text[1] == 'reference')
			reference = fp_text[2];
	});
	
	// Ignore if name not found
	if (!reference) return;
	
	// Print what we just found out
	console.log("Component " + reference + " has square pads: " + squarePads.join());
});
