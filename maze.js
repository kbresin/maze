function Coord(cs) {
	var data = cs.split(',');
	this.x = parseInt(data[0]);
	this.y = parseInt(data[1]);
	this.d = 'X';
	if (data.length > 2) {
		this.d = data[2];
	}
	this.orig = cs;
}

function mkcoord(x,y,d) {
	if(typeof(d)==='undefined') d = '';
	x = x.toString();
	y = y.toString();
	if ( d == '' ) {
		return x+','+y;
	} else {
		return x+','+y+','+d;
	}
}

// North, East, South, West connectivity tracking:
function Node(N,E,S,W) {
	if(typeof(N)==='undefined') N = false;
	if(typeof(E)==='undefined') E = false;
	if(typeof(S)==='undefined') S = false;
	if(typeof(W)==='undefined') W = false;
	this.N = N;
	this.E = E;
	this.S = S;
	this.W = W;
}

function Maze(maxX, maxY, type, seed) {
	if(typeof(maxY)==='undefined') maxY = maxX;
	if(typeof(type)==='undefined') type = 0;
	if(typeof(seed)==='undefined') seed = 0;
	this.maxX = maxX;
	this.maxY = maxY;
	this.type = type;
	this.seed = seed;
	this.rule = 'L';
	var blockSize = 15;
	this.blockSize = blockSize;
	this.offsetX = blockSize;
	this.offsetY = blockSize;

	this.setType = function setType(type) {
		this.type = type;
	}

	this.flipRule = function flipRule() {
		if (this.rule == 'L') {
			this.rule = 'R';
		} else if (this.rule == 'R') this.rule = 'L';
	}

	this.setOffset = function setOffset(x,y) {
		this.offsetX = x;
		this.offsetY = y;
	}

	this.setOffsetBlock = function setOffsetBlock(x,y) {
		this.offsetX = this.blockSize * (this.maxX+1)*x + this.blockSize*(x+0.5);
		this.offsetY = this.blockSize * (this.maxY+1)*y + this.blockSize*(y+0.5);
	}

	var connectionMap = new Array(this.maxX); // temp array to track how many walls to remove
	this.node = new Array(this.maxX); // this will track each node, and which nodes it is attached to.  Gets calculated after we form the maze
	this.walls = []; // starts will all walls, we remove them one by one
	for (x=0; x<maxX; x++) {
		connectionMap[x] = new Array(this.maxY);
		this.node[x] = new Array(this.maxY);
		for (y=0; y<maxY; y++) {
			if ( x != (maxX-1)) { this.walls.push( mkcoord(x,y,'E') ); } // E = East
			if ( y != (maxY-1)) { this.walls.push( mkcoord(x,y,'S') ); } // S = South
			this.node[x][y] = new Node();
			connectionMap[x][y] = new Object;
			connectionMap[x][y][mkcoord(x,y)] = true;
		}
	}
	// TODO make this support a maxY that != maxX
	if ( this.type == 1 ) { // cheat to make a center focused "labrynth"
		var center = Math.floor(this.maxX/2);
		var centerm1 = center-1;
		var centerp1 = center+1;

		var removeNodes = [];
		var ringNodes = [];
		for (var i=centerm1; i<= center; i++ ) {
			var remove;
			removeNodes.push(this.walls.indexOf(mkcoord(i,centerm1,'E')));
			removeNodes.push(this.walls.indexOf(mkcoord(i,centerp1,'E')));
			removeNodes.push(this.walls.indexOf(mkcoord(centerm1,i,'S')));
			removeNodes.push(this.walls.indexOf(mkcoord(centerp1,i,'S')));
		}
		for (var x=centerm1; x<= centerp1; x++ ) {
			for (var y=centerm1; y<= centerp1; y++ ) {
				if ( x != center || y != center ) {
					ringNodes[mkcoord(x,y)] = true;
				}
			}
		}
		for (var n in ringNodes) {
			var coord = new Coord(n);
			connectionMap[coord.x][coord.y] = ringNodes;
		}
		// sort decending to remove the larger indexes first
		removeNodes.sort(function(a, b){return b>a});
		var skip = Math.floor(Math.random()*8);
		for (i=0; i<removeNodes.length; i++) {
			if (i != skip) {
				this.walls.splice(removeNodes[i],1);
			}
		}
	}
	// type = 0 -> Randomized Kruskal
//	if ( this.type == 0 ) {
	if ( this.type == 0 || this.type == 1) {
		var goal = this.maxX*this.maxY;
		// stop when all nodes are connected:
		while ( Object.keys(connectionMap[0][0]).length < goal ) {

			var wallChoice = Math.floor(Math.random()*this.walls.length);
			var chosenWall = new Coord(this.walls[wallChoice]);
			var x = chosenWall.x;
			var y = chosenWall.y;
			var neighborX = x;
			var neighborY = y;
			switch(chosenWall.d) {
				case 'E':
					neighborX += 1;
					break;
				case 'S':
					neighborY += 1;
					break;
			}
			var neighborNode = mkcoord(neighborX,neighborY);
			if ( !(neighborNode in connectionMap[x][y]) ) {
//				alert("removing wall:"+chosenWall+" neighborX="+neighborX);
				// mr gorbachev tear down this wall!
				this.walls.splice(wallChoice,1);
	
				// Merge the connections of the two nodes
				var newCellConnections = connectionMap[x][y];
				for ( var cell in connectionMap[neighborX][neighborY] ) {
					newCellConnections[cell] = true;
					// do nothing
				}
	
				// Update the connections for all connected nodes:
				for ( var cell in newCellConnections ) {
					var coord = cell.split(',');
					var x = parseInt(coord[0]);
					var y = parseInt(coord[1]);
					connectionMap[x][y] = newCellConnections;
				}
//				alert(Object.keys(connectionMap[x][y]).length);
			}
		} // end while loop
	} // end if this.type == 0

	// Calculate cell connectivity
	for (x=0; x<maxX; x++) {
		for (y=0; y<maxY; y++) {
			var right = mkcoord(x,y,'E');
			if ( this.walls.indexOf(right) == -1 && x != (maxX-1) ) {
				this.node[x][y].E = mkcoord(x+1,y); 		// we can get to them
				this.node[x+1][y].W = mkcoord(x,y);		// they can get to us
			}
			var down = mkcoord(x,y,'S');
			if ( this.walls.indexOf(down) == -1 && y != (maxY-1) ) {
				this.node[x][y].S = mkcoord(x,y+1);		// we can get to them
				this.node[x][y+1].N = mkcoord(x,y); 	// they can get to us
			}
		}
	}

	// Start drawWalls Function:
	this.drawWalls = function drawWalls() {
		var c = document.getElementById("myCanvas");
		var ctx = c.getContext("2d");
		ctx.beginPath();
		//alert(this.walls);
		var wallCount = this.walls.length;
		for (var i = 0; i < wallCount; i++) {
			var info = this.walls[i].split(',');
			var x = info[0];
			var y = info[1];
			var d = info[2];
			var startX = x*blockSize + this.offsetX;
			var startY = y*blockSize + this.offsetY;
			var endX = startX;
			var endY = startY;
			switch(d) {
				case 'E':
					startX += blockSize;
					endX += blockSize;
					endY += blockSize;
					break;
//				case 'N':
//					endX += blockSize;
//					break;
				case 'S':
					startY += blockSize;
					endY += blockSize;
					endX += blockSize;
					break;
//				case 'W':
//					endY += blockSize;
//					break;
//					endY += blockSize;
//					break;
			}
			ctx.moveTo(startX,startY);
			ctx.lineTo(endX,endY);
		}
		// now draw the frame:
		ctx.moveTo(this.offsetX,this.offsetY);
		ctx.lineTo(this.offsetX+this.maxX*blockSize,this.offsetY);
		ctx.lineTo(this.offsetX+this.maxX*blockSize,this.offsetY+this.maxX*blockSize-blockSize);
		ctx.moveTo(this.offsetX+this.maxX*blockSize,this.offsetY+this.maxX*blockSize);
		ctx.lineTo(this.offsetX,this.offsetY+this.maxY*blockSize);
		ctx.lineTo(this.offsetX,this.offsetY+blockSize);
		//ctx.closePath();
		ctx.lineWidth = 2;
		ctx.strokeStyle = "black";
		ctx.stroke();

		// old method of using "white" to draw the entrance/exit:
		////ctx.strokeStyle = "rgba(255,0,0,0)";
		//ctx.beginPath();
		//ctx.moveTo(this.offsetX,this.offsetY+1);
		//ctx.lineTo(this.offsetX,this.offsetY+blockSize-2);
		//ctx.moveTo(this.offsetX+this.maxX*blockSize,this.offsetY+this.maxX*blockSize-1);
		//ctx.lineTo(this.offsetX+this.maxX*blockSize,this.offsetY+this.maxX*blockSize-blockSize+2);
		//ctx.closePath();
		//ctx.lineWidth = 2;
		//ctx.strokeStyle = "white";
		//ctx.stroke();
	} // end drawWalls()

	this.moveToNode = function moveToNode(x,y,ctx) {
		var additional_offsetX = 2.5;
		var additional_offsetY = 2.5;
		if ( this.rule == 'L' ) {
			additional_offsetX = -1*additional_offsetX;
			additional_offsetY = -1*additional_offsetY;
		} else if ( this.rule == 'R' ) {
			additional_offsetX = -1*additional_offsetX;
			additional_offsetY = additional_offsetY;
			//
		}
		ctx.moveTo(additional_offsetX+this.offsetX+x*blockSize+blockSize*0.5,additional_offsetY+this.offsetY+y*blockSize+blockSize*0.5);
	}
	this.lineToNode = function lineToNode(x,y,ctx,dir,cornerType) {
		if(typeof(dir)==='undefined') dir = 'E';
		if(typeof(doubleBack)==='undefined') doubleBack = false;
		var additional_offsetX = 2.5;
		var additional_offsetY = 2.5;
		if ( this.rule == 'L' ) {
			if (dir == 'N' || dir == 'E') additional_offsetX = -1*additional_offsetX;
			if (dir == 'S' || dir == 'E') additional_offsetY = -1*additional_offsetY;
		} else if ( this.rule == 'R' ) {
			// TODO: logic swap S=E, N=W
			if (dir == 'S' || dir == 'E') additional_offsetX = -1*additional_offsetX;
			if (dir == 'S' || dir == 'W') additional_offsetY = -1*additional_offsetY;
		}
//		if (false && backtrack_direction == 'W' || backtrack_direction == 'S') {
//			additional_offsetX = additional_offsetX * -1;
//			additional_offsetY = additional_offsetY * -1;
//		}
//		alert(dir+" "+additional_offsetX+","+additional_offsetY);
		ctx.lineTo(additional_offsetX+this.offsetX+x*blockSize+blockSize*0.5,additional_offsetY+this.offsetY+y*blockSize+blockSize*0.5);
		if ( cornerType > 1 ) {
			if ( dir == 'W' || dir == 'E' ) {
				ctx.lineTo(-additional_offsetX+this.offsetX+x*blockSize+blockSize*0.5,additional_offsetY+this.offsetY+y*blockSize+blockSize*0.5);
			} else {
				ctx.lineTo(additional_offsetX+this.offsetX+x*blockSize+blockSize*0.5,-additional_offsetY+this.offsetY+y*blockSize+blockSize*0.5);
			}
			if ( cornerType > 2 ) {
				if ( dir == 'W' || dir == 'E' ) {
					ctx.lineTo(-additional_offsetX+this.offsetX+x*blockSize+blockSize*0.5,-additional_offsetY+this.offsetY+y*blockSize+blockSize*0.5);
				} else {
					ctx.lineTo(-additional_offsetX+this.offsetX+x*blockSize+blockSize*0.5,-additional_offsetY+this.offsetY+y*blockSize+blockSize*0.5);
				}
			}
		} else if ( !this.node[x][y][dir] ) {
//			if ( dir == 'W' || dir == 'E' ) {
//				ctx.lineTo(-additional_offsetX+this.offsetX+x*blockSize+blockSize*0.5,additional_offsetY+this.offsetY+y*blockSize+blockSize*0.5);
//			} else {
//				ctx.lineTo(additional_offsetX+this.offsetX+x*blockSize+blockSize*0.5,-additional_offsetY+this.offsetY+y*blockSize+blockSize*0.5);
//			}
		}
		
	}

} // end maze class

// start Solution Class:
function MazeSolution(maze, method ) {
	//todo overall score
	if(typeof(method)==='undefined') method = maze.rule;
	this.currentNode = new Coord(mkcoord(0,0));
	this.facing = 'E'; // cardinal direction we are facing
	this.visitedNodes = new Object; // hash of visited nodes
	this.visitedNodes[this.currentNode.orig] = true;
	this.path = [ this.currentNode.orig ]; // sequential list of nodes traversed
	this.method = method;
	this.maze = maze;
	this.goal = [ mkcoord(maze.maxX-1,maze.maxY-1) ];
	this.backTrackNodes = new Array; // TODO, use this when no nodes found.
	this.solution = false;
	var pathColor = new Object;
	pathColor['L'] = 'green';
	pathColor['R'] = 'red';

	// todo: limit edge connections
	this.addCornerGoals = function addCornerGoals(right,down) {
		var rightCorner = true;
		var downCorner = true;
		if(typeof(right)==='undefined') right = true;
		if(typeof(down)==='undefined') down = true;
		rightCorner = right;
		downCorner = down;
		if (!rightCorner && !downCorner) return;
		if (!rightCorner || !downCorner) this.goal = new Array(3);
		if (rightCorner) this.goal.push( mkcoord(maze.maxX-1, 0) );
		if (downCorner) this.goal.push( mkcoord(0, maze.maxY-1) );
	}

	// begin movePreference
	this.movePreference = function movePreference(dir) {
		if(typeof(dir)==='undefined') dir = this.facing;
		var facing_value;
		switch(dir) {
			case 'N':
				facing_value = 0;
				break;
			case 'E':
				facing_value = 1;
				if ( this.method == 'R' ) {
					facing_value = 3;
				}
				break;
			case 'S':
				facing_value = 2;
				break;
			case 'W':
				facing_value = 3;
				if ( this.method == 'R' ) {
					facing_value = 1;
				}
				break;
		}
		preferences = ['W','N','E','S','W','N','E'];
		if ( this.method == 'R' ) {
			preferences.reverse();
		}
		return preferences.slice(facing_value,facing_value+4);
	} // end movePreference

	// begin solve
	this.solve = function solve() {
//		while ( this.currentNode.orig != this.goal ) {
		while ( this.goal.indexOf(this.currentNode.orig) < 0 ) {
			this.nextStep();
		}
		var arrival = this.goal.indexOf(this.currentNode.orig);
		this.endPoint = new Coord(this.goal[arrival]);
	} // end solve

	function determineFacing(from,to) {
		from = new Coord(from);
		to = new Coord(to);
		if (from.x == to.x) {
			if (from.y > to.y) {
				return 'N';
			} else {
				return 'S';
			}
		} else {
			if (from.x > to.x) {
				return 'W';
			} else {
				return 'E';
			}
		}
	} //end determineFacing

	this.nextStep = function nextStep() {
		var options = this.maze.node[this.currentNode.x][this.currentNode.y];
		var nextMove;
		var nextNode;
		var found = 0;
		dirs = this.movePreference();
		for ( var i=0; i < 4; i++ ) {
			dir = dirs[i];
			if ( options[dir] && !(options[dir] in this.visitedNodes) ) {
				if ( found == 0 ) { nextMove = dir; }
				found += 1;
			}
		}
		if ( found == 0 ) {
//			alert("found no nodes!");
			if ( this.backTrackNodes.length > 0 ) {
				// Visual TODO draw little turn-around circle
				var backTrack = this.backTrackNodes.pop();
				if (backTrack === this.currentNode.orig) backTrack = this.backTrackNodes.pop();
//				alert("backtrracking to "+backTrack);
				i = this.path.indexOf(this.currentNode.orig)-1;
				this.currentNode = new Coord(backTrack);
				while ( this.path[i] != backTrack && i > 0) {
					this.path.push(this.path[i]);
					i -= 1
				}
				// TODO determine facing direction (by comparing most recent path node to the backtrack node)
				this.facing = determineFacing(this.path[this.path.length-1],backTrack);
				this.path.push(backTrack);
			} else {
				alert('out of nodes!');
			}
		} else {
			// TODO I think this if never gets called...
			if ( found == 1 && this.backTrackNodes.indexOf(this.currentNode.orig) > -1 ) {
				var backTrackCleanUp = this.backTrackNodes.indexOf(this.currentNode.orig);
//				alert("removing "+this.backTrackNodes[backTrackCleanUp]);
				this.backTrackNodes.splice(backTrackCleanUp,1);
//				alert('adding backtrack node:'+this.currentNode.orig);
			} else { // more than one node available, remember!
				this.backTrackNodes.push(this.currentNode.orig);
			}
			this.facing = nextMove;
			this.currentNode = new Coord(options[nextMove]);
			this.visitedNodes[this.currentNode.orig] = true
			this.path.push(this.currentNode.orig);
		}
	} // end nextStep
	// TODO scoring

	// begin drawSolution()
	this.drawSolution = function drawSolution() {
//		alert("drawing:"+this.path);
		var c = document.getElementById("myCanvas");
		var ctx = c.getContext("2d");
		ctx.beginPath();
		ctx.lineWidth = 2;
		ctx.strokeStyle = pathColor[this.method];
//		ctx.strokeStyle = "rgba(0, 255, 0, 0.4)";;
		var startCoord = new Coord(this.path[0]);
		this.maze.moveToNode(startCoord.x,startCoord.y,ctx);
		var drawn = new Object;
		var path_length = this.path.length;
		var backtrack = false;
		for (var i=1; i< path_length; i++) {
			nodeCoord = new Coord(this.path[i]);
//			if ( backtrack && (i+1) < path_length && !(this.path[i+1] in drawn) ) backtrack = false;
			var dir = determineFacing(this.path[i-1],this.path[i]);
			var move_order = this.movePreference(dir);
			var node = this.maze.node[nodeCoord.x][nodeCoord.y];
			var cornerType = 0;
			if ( !node[move_order[0]] && !node[move_order[1]] ) {
				cornerType = 2;
				if (!node[move_order[2]]) cornerType++;
			}
//			var doubleBack = false;
//			if ( (i+1) < path_length && (this.path[i-1] === this.path[i+1]) ) {
//				doubleBack = true;
//			}
				
//			var backtrack_direction = false;
//			if (backtrack) backtrack_direction = determineFacing(this.path[i-1],this.path[i]);
//			drawn[this.path[i]] = true;
//			this.maze.lineToNode(nodeCoord.x,nodeCoord.y,ctx,dir, doubleBack);
			// draw initial line
			if ( i == 1 ) this.maze.lineToNode(startCoord.x,startCoord.y,ctx,dir);
			this.maze.lineToNode(nodeCoord.x,nodeCoord.y,ctx,dir, cornerType);
//			if ( !backtrack && (i+1) < path_length && i>0 && this.path[i-1] == this.path[i+1] ) { 
//				backtrack = true
//				backtrack_direction = determineFacing(this.path[i-1],this.path[i]);
//				this.maze.lineToNode(nodeCoord.x,nodeCoord.y,ctx,backtrack_direction);
//			}
		}
		ctx.stroke();
	}
}
