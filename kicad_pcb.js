var DEBUG = function(data) { console.log(data); }

function isToken(token_or_value) {
	return typeof token_or_value == 'object' || typeof token_or_value == 'array';
}

// Reads a single data value
function read_value(data) {
//	DEBUG('(RD');
	var value = "";
	if (data.s.charAt(0) == '\"') {
		// String data, anoying to read
		data.s = data.s.substring(1);
		var bs = 0;
		
		// Continues until finds " preceeded by an even number of backslashes.
		//        " stops parsing, zero is even.
		//       \" does not
		//  \\\\\\" stops
		// \\\\\\\" does not
		while (data.s.charAt(0) != '\"' || bs%2) {
			// Count sequential backslashses
			if (data.s.charAt(0) == '\\') bs++;
			else bs = 0;
			
			value = value + "" + data.s.charAt(0);
			
			data.s = data.s.substring(1);
		}
		
		// Use JSON to decode the string
		value = JSON.parse('\"' + value + '\"');
		
		// Drop '\"'
		data.s = data.s.substring(1);
	} else {
		// Simple data, read until a terminator char is found.
		while (" \r\n\t\f\b()".indexOf(data.s.charAt(0)) == -1) {
			value = value + "" + data.s.charAt(0);
			data.s = data.s.substring(1);
		}
		
		// Check if value is a number
		if (/^[+-]?([0-9]+\.?[0-9]*|\.[0-9]+)(e[+-]?[0-9]+)?$/i.test(value))
			value = eval(value);
	}
//	DEBUG(value + ')');
	return value;
}

// Read a single token, a single value or from '(' to ')'
function read_token(data) {
//	DEBUG('RT(', data.s.substring(0,10), data.s.length);
		
	// Skip leading blanks
	while (" \r\n\t\f\b".indexOf(data.s.charAt(0)) != -1)
		data.s = data.s.substring(1);
	
	// Call read_value if this is not a list
	if (data.s.charAt(0) != '(')
		return read_value(data);
		
	// We are reading a list. Drop the starting '('
//	DEBUG('Length before: ', data.s.length);
	data.s = data.s.substring(1);
//	DEBUG('Length after: ',  data.s.length);
	
	// Lists are read as arrays
	var token = new Array();
	
	// Read a list of elements
	while (data.s.charAt(0) != ')') {
		token.push(read_token(data));

		// Skip blanks
		while (" \r\n\t\f\b".indexOf(data.s.charAt(0)) != -1)
			data.s = data.s.substring(1);
	}
	
	// Drop ')'
	data.s = data.s.substring(1);
	
//	DEBUG(token[0] + ' RT)');
	return token;
}

// Decodes .kicab_pcb S-expressions to javascript Arrays
function parse(file_contents) {
	// Make data an object, so it is passed by reference.
	// This is needed to remove tokens as they are parsed.
	var data = new Object();
	data.s = new String(file_contents);
	
	return read_token(data);
}

// Write a single token, a single value or from '(' to ')'
function write_token(token) {
	var str = "";
	
	// Use JSON to encode single values. It is close enough.
	if (!isToken(token)) {
		if (typeof token == 'string' && (
			token.indexOf('(') >= 0 ||
			token.indexOf(')') >= 0 ||
			token.indexOf(' ') >= 0 ||
			token == ""
		))
			return JSON.stringify(token);
		else
			return token;
	}
	
	// Iterate on objects
	str += '(' + token[0];
	for (var i=1; i<token.length; ++i)
		str += ' ' + write_token(token[i]);
	str += ')\n';
		
	return str;
}
// Encodes .kicad_pcb S-expressions from javascript Arrays
function stringify(token) {
	return write_token(token);
}

//
function parseFile(name) {
	return parse(require('fs').readFileSync(name));
}

function saveFile(name, pcb) {
	require('fs').writeFileSync(name, stringify(pcb));
}

// Calls function on select elements of a PCB
// target takes the form [ 'kicad_pcb', 'general', 'links' ]
function onPath(target, token, fcn) {
	// Am I in the right place?
	if (!isToken(token)) return;
	if (token[0] != target[0]) return;
	
	// Is target found?
	if (target.length == 1) {
		// Call the function
		fcn(token);
		return;
	}
	
	// Keep on searching
	for (var i=1; i<token.length; ++i)
		onPath(target.slice(1), token[i], fcn);
}

// Calls function on select elements of a PCB
// target takes the form 'at'
function onAll(target, token, fcn) {
	// Am I in the right place?
	if (!isToken(token)) return;

	// Call the function on the right elements
	if (token[0] == target) fcn(token);
	
	// Keep on searching
	for (var i=1; i<token.length; ++i)
		onAll(target, token[i], fcn);
}

// Like Array.indexOf, but looks for child token names.
function indexOf(name, token) {
	// Start from 1 so as to skip own token's name.
	for (var i=1; i<token.length; ++i) {
		if (!isToken(token[i]))
			continue;
		if (token[i][0] == name)
			return i;
	}
	return -1;
}

// Removes all elements matching a path
function removeByPath(target, token) {
	var parent_path = target.slice(0, target.length-1);
	var token_name  = target[target.length-1];
	
	onPath(parent_path, token, function(t) {
		var i = indexOf(token_name, t);
		if (i>=0)
			t.splice(i);
	});
}

// Removes all elements matching a name
function removeByName(token_name, token) {
	if (!isToken(token))
		return;
//	DEBUG(token[0]);
	
	while (true) {
		var i = indexOf(token_name, token);
		if (i<0) break;
//		DEBUG(token_name + ' found.');
		token.splice(i,1);
	}
	
	for (var i=0; i<token.length; ++i)
		removeByName(token_name, token[i]);
}
function getFirstByPath(path, token) {
	var ret = null;
	onPath(path, token, function(t) {
		if (ret == null) ret = t;
	});
	return ret;
}
function getFirstByName(name, token) {
	var ret = null;
	onAll(name, token, function(t) {
		if (ret == null) ret = t;
	});
	return ret;
}
function getAllByPath(path, token) {
	var ret = new Array();
	onPath(path, token, function(t) {
		ret[ret.length] = t;
	});
	return ret;
}
function getAllByName(name, token) {
	var ret = new Array();
	onAll(name, token, function(t) {
		ret[ret.length] = t;
	});
	return ret;
}

function pathExists(target, token) {
	var res = false;
	onPath(target, token, (t) => { res=true; });
	return res;
}

function pathContains(target, value, token) {
	var res = false;
	onPath(target, token, (t) => { res |= t.indexOf(value)>0; });
	return res;
}

// Returns a copy of the token, not a reference to it
function clone(token) {
	return JSON.parse(JSON.stringify(token));
}

// Copies all PCB2 elements onto PCB1
function join(pcb1, pcb2) {
	// Break references
	pcb2 = clone(pcb2);
	
	// Remove timestamps, cause they have to be unique
	removeByName('tstamp', pcb2);
	
	// Paths to copy over
	var paths = [
		['kicad_pcb', 'module'],
		['kicad_pcb', 'target'],
		['kicad_pcb', 'gr_line'],
		['kicad_pcb', 'gr_text'],
		['kicad_pcb', 'segment'],
		['kicad_pcb', 'zone'],
		['kicad_pcb', 'gr_arc'],
		['kicad_pcb', 'gr_circle'],
	];
	
	// Copy over
	for (var p=0; p<paths.length; ++p) {
		onPath(paths[p], pcb2, function(t) {
			pcb1.splice(-1,0,t);
		});
	}
}

// simple grid paneliation
function panelize(dx, dy, nx, ny, pcb) {
	var stamp = clone(pcb);
	for (var i=1; i<nx; ++i) {
		transform(dx, 0, 0, null, stamp);
		join(pcb, stamp);
	}
	
	var stamp = clone(pcb);
	for (var i=1; i<ny; ++i) {
		transform(0, dy, 0, null, stamp);
		join(pcb, stamp);
	}
}

// Get coordinates from a PCB.
// Edge.cuts layer considered

// Run through a PCB seeking for points that may help identify how big it is
// Call fcn([x,y]) on each point.
function onPointsOfInterest(pcb, fcn) {
	// Seek on gr_lines
	onPath(['kicad_pcb', 'gr_line'], pcb, function(gr_line) {
		if (!pathContains(['gr_line', 'layer'], 'Edge.Cuts', gr_line))
			return;
		
		var start = getFirstByName('start', gr_line);
		var end   = getFirstByName('end', gr_line);
		
		fcn(start.slice(1));
		fcn(end.slice(1));
	});
	
	// Seek on gr_circles
	onPath(['kicad_pcb', 'gr_circle'], pcb, function(gr_circle) {
		if (!pathContains(['gr_circle', 'layer'], 'Edge.Cuts', gr_circle))
			return;
		
		var center = getFirstByName('center', gr_circle);
		var end    = getFirstByName('end',    gr_circle);
		var radius = Math.sqrt(Math.pow(end[2]-center[2],2) + Math.pow(end[1]-center[1],2));
		
		fcn([center[1]+radius, center[2]+radius]);
		fcn([center[1]+radius, center[2]-radius]);
		fcn([center[1]-radius, center[2]+radius]);
		fcn([center[1]-radius, center[2]-radius]);
	});
	
	// Seek on gr_arcs
	onPath(['kicad_pcb', 'gr_arc'], pcb, function(gr_arc) {
		if (!pathContains(['gr_arc', 'layer'], 'Edge.Cuts', gr_arc))
			return;
		
		var start  = getFirstByName('start', gr_arc);
		var end    = getFirstByName('end',   gr_arc);
		var angle  = getFirstByName('angle', gr_arc);
		
		var radius = Math.sqrt(Math.pow(end[2]-start[2],2) + Math.pow(end[1]-start[1],2));
		var theta0 = Math.atan2(end[2]-start[2], end[1]-start[1]);
		var theta1 = theta0 + angle[1] * Math.PI / 180;
		
		// Analythic is hard, go brute force...
		for (var i=0; i<512; ++i) {
			var theta = theta0 + i/(512-1) * (theta1 - theta0);
			
			fcn([start[1] + radius * Math.cos(theta), start[2] - radius * Math.sin(theta)]);
		}
	});
}

var coord = new Object();
coord.top = function (pcb) {
	var top  = 1e99;
	onPointsOfInterest(pcb, function(point) {
		if (point[1] < top) top = point[1];
	});
	return top;
}
coord.left = function (pcb) {
	var left = 1e99;
	onPointsOfInterest(pcb, function(point) {
		if (point[0] < left) left = point[0];
	});
	return left;
}
coord.bottom = function (pcb) {
	var bottom  = 0;
	onPointsOfInterest(pcb, function(point) {
		if (point[1] > bottom) bottom = point[1];
	});
	return bottom;
}
coord.right = function (pcb) {
	var right = 0;
	onPointsOfInterest(pcb, function(point) {
		if (point[0] > right) right = point[0];
	});
	return right;
}
coord.topLeft = function (pcb) {
	return [ coord.left(pcb), coord.top(pcb) ];
}
coord.topRight = function (pcb) {
	return [ coord.right(pcb), coord.top(pcb) ];
}
coord.bottomLeft = function (pcb) {
	return [ coord.left(pcb), coord.bottom(pcb) ];
}
coord.bottomRight = function (pcb) {
	return [ coord.right(pcb), coord.bottom(pcb) ];
}

// Get a specific fractional coordinate inside the board.
// fx: 0=left, 1=right, 0.5=horizontal center.
// fy: 0=top, 1=bottom, 0.5=vertical center.
coord.fraction = function(fx, fy, pcb) {
	var T = coord.top(pcb);
	var L = coord.left(pcb);
	var B = coord.bottom(pcb);
	var R = coord.right(pcb);
	return [
		L + (R-L) * fx,
		T + (B-T) * fy
	];
};

// Get the position of the auxiliary axis origin marker
coord.auxiliaryAxisOrigin = function(pcb) {
	var aao = [0,0];
	onPath(['kicad_pcb', 'setup', 'aux_axis_origin'], pcb, function(t) {
		aao = t.slice(1);
	});
	return aao;
}

var size = new Object();
size.width = function(pcb) {
	return coord.right(pcb) - coord.left(pcb);
}
size.height = function(pcb) {
	return coord.bottom(pcb) - coord.top(pcb);
}


// Rotate and translate a PCB around the aux_origin marker
// Rotation is done first.
function transform(dx, dy, rot_deg, ref, pcb) {
//	DEBUG("transform("+dx+","+dy+")");
	var rot_rad = rot_deg * Math.PI / 180;
	var S = Math.sin(rot_rad);
	var C = Math.cos(rot_rad);
	
	// If ref is set to null the use auxiliary origin
	if (!ref || ref == null) ref = coord.auxiliaryAxisOrigin(pcb);
	if (!ref) return;
	
	// Data transformation function for xy
	function trf_xy(t) {
		// Read source coordinate relative to aux origin.
		var x = t[1] - ref[0];
		var y = t[2] - ref[1];
		
		// Rotate first, then transform
		var nx = + x * C + y * S + dx;
		var ny = - x * S + y * C + dy;
		
		// Store final coordinate relative to main origin
		t[1] = nx + ref[0];
		t[2] = ny + ref[1];
		
	}
	// fix at angle too
	function trf_xya(t) {
		trf_xy(t);
		// 'at' tokens may also have an angle, except on targets.
		if (t[0] == 'at') 
			t[3] = rot_deg + (t[3] || 0);
	}
	
	// Paths that needs correction on translation / rotation:
	var paths = [
		[ 'kicad_pcb', 'module', 'at' ],
		[ 'kicad_pcb', 'gr_line', 'start' ],
		[ 'kicad_pcb', 'gr_line', 'end' ],
		[ 'kicad_pcb', 'gr_text', 'at' ],
		[ 'kicad_pcb', 'segment', 'start' ],
		[ 'kicad_pcb', 'segment', 'end' ],
		[ 'kicad_pcb', 'zone', 'polygon', 'pts', 'xy' ],
		[ 'kicad_pcb', 'zone', 'filled_polygon', 'pts', 'xy' ],
		[ 'kicad_pcb', 'gr_circle', 'center' ],
		[ 'kicad_pcb', 'gr_circle', 'end' ],
		[ 'kicad_pcb', 'gr_arc', 'start' ],
		[ 'kicad_pcb', 'gr_arc', 'end' ]
	];
	
	// Apply transformation function to data
	for (var p=0; p<paths.length; ++p)
		onPath(paths[p], pcb, trf_xya);
	
	// target nodes have no angle, ever!
	onPath([ 'kicad_pcb', 'target', 'at' ], pcb, trf_xy);	
}

module.exports = {
	parse: parse,
	stringify: stringify,
	parseFile: parseFile,
	saveFile: saveFile,
	onPath: onPath,
	onAll: onAll,
	pathExists: pathExists,
	pathContains: pathContains,
	getFirstByPath: getFirstByPath,
	getFirstByName: getFirstByName,
	getAllByPath: getAllByPath,
	getAllByName: getAllByName,
	indexOf: indexOf,
	removeByPath: removeByPath,
	removeByName: removeByName,
	transform: transform,
	clone: clone,
	join: join, 
	panelize: panelize,
	coord: coord,
	size: size
};
