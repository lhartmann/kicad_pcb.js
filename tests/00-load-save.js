#! /usr/bin/env node

// Import modules
var PCB = require('../kicad_pcb.js');
var FS  = require('fs');

// Load sample board from a file.
var pcb = PCB.readFileSync("sample.kicad_pcb");

// If running in-browser you may not have filsystem access, so you
// can get the .kicad_pcb file contents, but in-memory as a string.
var str = PCB.stringify(pcb);

// Also you can parse a .kicad_pcb from memory.
var pcb2 = PCB.parse(str);

// Save sample board to a file directly.
PCB.writeFileSync('out.kicad_pcb', pcb2);
