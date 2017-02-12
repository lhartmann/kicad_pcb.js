#! /usr/bin/env node

// Import modules
var PCB = require('../kicad_pcb.js');
var FS  = require('fs');

// Load sample board.
var pcb = PCB.readFileSync("sample.kicad_pcb");

// Transformations will change the PCB on which they are called,
// therefore we create clones for each example.
var newpcb;

// Transformations are easier to understand if you can see before
// and after at the same time, although it would be an impractical
// PCB. To make it better we then save 2 copies, one just transformed
// and one with before/after overlapping each other.
function save(prefix, newpcb) {
	// Save the transformed pcb
	PCB.writeFileSync('out_' + prefix + '.kicad_pcb', newpcb);
	
	// Overlay the original board on top
	PCB.join(newpcb, pcb);
	
	// Save the overlapping boards
	PCB.writeFileSync('out_' + prefix + '_ov.kicad_pcb', newpcb);
}

// EXAMPLE 1: Rotate PCB 30 degrees around auxiliary axis origin
newpcb = PCB.clone(pcb);
PCB.transform(0, 0, 30, null, newpcb);
save('r_aao', newpcb);

// EXAMPLE 2: Translate (move) PCB 10mm left, 5mm down.
newpcb = PCB.clone(pcb);
PCB.transform(-10, +5, 0, null, newpcb);
save('t', newpcb);

// EXAMPLE 3: Rotate 90 degrees around top right corner.
newpcb = PCB.clone(pcb);
var ref = PCB.coord.topRight(pcb); //fraction(0.5, 0.5, pcb);
PCB.transform(0, 0, 90, ref, newpcb);
save('r_tr', newpcb);

// EXAMPLE 4: Rotate 60 degrees around center of the pcb.
newpcb = PCB.clone(pcb);
var ref = PCB.coord.fraction(0.5, 0.5, pcb);
PCB.transform(0, 0, 60, ref, newpcb);
save('r_c', newpcb);
