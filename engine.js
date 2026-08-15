/* 
 * File: engine.js
 * ----------
 * The heart and soul (and engine) of Picobot!
 * 
 */

var DEBUG = 0; // set to 0 to turn off debugging

// how big we want our grid to be
var MAXROWS = 25;
var MAXCOLS = 25;

// because picobot is a cookie monster...
var MAXCOOKIES = 625
var cookies_remaining = MAXCOOKIES
// otherwise picobot wouldn't be turing complete!

// color the world!!!
var COLORS = ["white","blue","lime","red","#808080","aaaaff","ff11dd"]
var COOKIE_COLOR = 6
var DONE_COLOR = 5
var VISITED_COLOR = 4
var ERROR_COLOR = 3
var ROBOT_COLOR = 2
var WALL_COLOR = 1
var CLEAR_COLOR = 0

// docstring symbols 
SINGLE_QUOTES_DOCSTR_MARKER = "\'\'\'"
DOUBLE_QUOTES_DOCSTR_MARKER = "\"\"\""

NUM_MILLISECS_PER_SEC = 1000

// internal clock...tick tick tick
MAX_DELAY = 100;

var timingDelay = 20;

// set the default value of the speed slider
let speedSlider = document.getElementById("speed-slider")
speedSlider.oninput = (function () { 
	clearTimeout(timerID); 
	changeSpeed(Number(speedSlider.value)); 
	updateStepsPerSec();
});
speedSlider.min = String(0);
speedSlider.max = String(MAX_DELAY);
speedSlider.value = String(MAX_DELAY - timingDelay);
speedSlider.style.width = "350px";
updateStepsPerSec();

function updateStepsPerSec() {
	document.getElementById("rate").textContent = `Speed: ${(NUM_MILLISECS_PER_SEC / timingDelay).toFixed(2)} steps/sec`
}

// for dynamic walls (coined "dynawalls")
// keep track of all the dynamic walls currently in play
var dynawalls = [];
// keep track of which rule we're on in order to successfully update the dynawalls
var ruleCounter = 0;
// keep track of visited cells
var visited = new Set();

try
{


/* drawOneSquare takes in three arguments:
 *     - (int) r
 *     - (int) c
 *     - (string) hexcolor
 * and colors the location at row `r` and column `c` to be the specified `hexcolor`
 */
function drawOneSquare(r, c, hexcolor)
{
    divName = 'r' + r + 'c' + c;
    document.getElementById(divName).style.backgroundColor = hexcolor;
}


/* updateCellColor takes in three arguments:
 *     - (int) r
 *     - (int) c
 *     - (int) colorIndex
 * and colors in the square cell at row `r`, column `c` with the color indicated by
 * `colorIndex`
 */
function updateCellColor( r, c, colorIndex )
{
    currentCells[r][c] = colorIndex;
    drawOneSquare(r,c,COLORS[colorIndex]);

	if (colorIndex == VISITED_COLOR) {
		visited.add(`(${r}, ${c})`);
	}
}

// global variable for current cells
var currentCells = Array(MAXROWS);

// draw the map above...
function drawMap( map )
{
    currentCells = Array(MAXROWS);
    // map will be a 25x25 2d array
    for (var r = 0 ; r < MAXROWS ; ++r)
    {
        currentCells[r] = Array(MAXCOLS); // make the row
        for (var c = 0 ; c < MAXCOLS ; ++c)
        {
            if (r < map.length && c < map[0].length)
            {
                currentCells[r][c] = map[r][c];
                drawOneSquare(r,c,COLORS[map[r][c]]);
            }
            else
            {
                currentCells[r][c] = CLEAR_COLOR;
                drawOneSquare(r,c,COLORS[CLEAR_COLOR])
            }
        }
    }
}

/* toggle_wall takes in two arguments, (int) `row` and (int) `col`, and turns the cell at
 * row `row` and column `col` to a wall cell
 */
function toggle_wall(row,col)
{
	if (currentCells[row][col] != ROBOT_COLOR);
	{
		if (currentCells[row][col] != WALL_COLOR)
			updateCellColor(row,col,WALL_COLOR);
		else if (currentCells[row][col] == WALL_COLOR)
			updateCellColor(row,col,CLEAR_COLOR);
	}
        clearVisited();
}

/* countSquares takes in two arguments, (Array) `m` and (int) `colorIndex`, and returns total number of 
 * cells of the color indicated by `colorIndex` in the map `m`
 */
function countSquares( m, colorIndex )
{
    var total = 0;

    for (var r = 0 ; r < MAXROWS ; ++r)
    {
        for (var c = 0 ; c < MAXCOLS ; ++c)
        {
            if (m[r][c] == colorIndex)
            {
                ++total;
            }
        }
    }
    return total;
}

/* clearVisited takes in no arguments and clears the map of all visited cells
 */
function clearVisited()
{
    for (var r = 0 ; r < MAXROWS ; ++r)
    {
        for (var c = 0 ; c < MAXCOLS ; ++c)
        {
            if (currentCells[r][c] == VISITED_COLOR)
            {
                currentCells[r][c] = CLEAR_COLOR;
                drawOneSquare(r,c,COLORS[CLEAR_COLOR]);
            }
        }
    }
	cookies = [];
    cookies_remaining = MAXCOOKIES;
	updateProgress;
}

/* fullReset takes in no arguments and blanks the map and resets the robot and dynawalls
 */
function fullReset()
{
    for (var r = 0 ; r < MAXROWS ; ++r)
    {
        for (var c = 0 ; c < MAXCOLS ; ++c)
        {
            if (currentCells[r][c] == VISITED_COLOR || currentCells[r][c] == ROBOT_COLOR
                          || currentCells[r][c] == ERROR_COLOR || currentCells[r][c] == COOKIE_COLOR)
            {
                currentCells[r][c] = CLEAR_COLOR;
                drawOneSquare(r,c,COLORS[CLEAR_COLOR]);
            }
        }
    }

    resetBot();

	// reset dynawalls
	dynawalls = [];
	visited = new Set();
	ruleCounter = 0;
}


// global variable for current rules
// RULES[state] is a mapping from one of the 16 'NEWS'-'xxxx' strings
//   to a direction to move and a new state to enter (or other activity)
var RULES = Array(); // supposedly will expand to fit!
var MAXRULES = 100;

// initialize the rules to a good size
for (rulenum=0 ; rulenum<MAXRULES ; ++rulenum)
{
	RULES[rulenum] = Array();
}

// global robot
var robot =  {row: 0, col: 0, state: 0};
// global cookies
var cookies = []

XXXX = 0
NXXX = 1
XEXX = 2
NEXX = 3
XXXS = 4
NXXS = 5
XEXS = 6
NEXS = 7
XXWX = 8
NXWX = 9
XEWX = 10
NEWX = 11
XXWS = 12
NXWS = 13
XEWS = 14
NEWS = 15

COOKIE = 16

var SURR_TEXT = ["xxxx", "Nxxx", "xExx", "NExx", "xxxS", "NxxS", 
                 "xExS", "NExS", "xxWx", "NxWx", "xEWx", "NEWx",
				 "xxWS", "NxWS", "xEWS", "NEWS",
				 "xxxx", "Nxxx", "xExx", "NExx", "xxxS", "NxxS", 
                 "xExS", "NExS", "xxWx", "NxWx", "xEWx", "NEWx",
				 "xxWS", "NxWS", "xEWS", "NEWS"]

MOVE_X = 0 // don't move at all - better change state!
MOVE_N = 1
MOVE_E = 2
MOVE_W = 3
MOVE_S = 4

OTHER = 0 // other actions

// we'll make our own rules for now
RULE_DIR = 0;
RULE_NEWSTATE = 1;
RULE_OTHERACTION = 2;
RULE_LINENUM = 3;
RULE_TEXT = 4;
RULE_COOKIE = 5; // index of the string the user typed

var isRunning = false;

/* cookieLocation takes in two arguments, (int) `row` and (int) `col`, and returns
 * the location of that cookie using a tricky yet simple and neat formula
 */
function cookieLocation(row,col)
{
	return col + MAXCOLS*row;
}

/* drawCookies takes in no arguments and draws all the cookies in the array `cookies`
 */
function drawCookies()
{
	var the_cookie = 0
	var r = 0
	var c = 0
	for (var i=0; i<cookies.length; i++)
	{
		the_cookie = cookies[i]
		c = the_cookie % MAXCOLS;
		r = (the_cookie - c)/MAXCOLS;	
		updateCellColor(r,c,COOKIE_COLOR);
	}
}

/* randomInRange takes in one argument, (int) `N`, and returns an integer
 * between 0 and `N`, inclusive
 */
function randomInRange(N)
{
	return Math.floor(N*Math.random())
}

/* resetBot takes in no arguments and...resets the bot. it gives the robot a new random location on the grid
 * and re-updates the squares on the grid
 */
function resetBot()
{
	var nrow;
	var ncol;
	found = false
	while(!found)
	{
		nrow = randomInRange(MAXROWS)
		ncol = randomInRange(MAXCOLS)
		if(currentCells[nrow][ncol] != WALL_COLOR)
			found = true
	}
	robot = {row: nrow, col: ncol, state: 0};
	drawOneSquare( robot.row, robot.col, COLORS[ROBOT_COLOR] );
	currentCells[robot.row][robot.col] = ROBOT_COLOR;

	// re-update the squares to go...
	document.getElementById('state').value = "0";
	document.getElementById('surroundings').value = SURR_TEXT[getSurroundings()];
	cookies = [];
    cookies_remaining = MAXCOOKIES;
	updateProgress();
}

/* teleportRobot takes in one argument, (string) `direction`, and attempts to move the robot in
 * that direction if the move is valid
 */
function teleportRobot(direction)
{
// will move the robot if it's legal to...
// will not mark the space moved from as grey, but clear
//
// direction must be 'W', 'E', 'N', or 'S' to move

	// get robot's current position
	var r = robot.row;
	var c = robot.col;

	var msgText = "";

      
        
	if (direction == 'W')
	{ 
		// check if it's safe to move...
		if (isWallToW(r,c))
		{
			msgText = "There is a wall to the west.\nNot moving the robot.";
		}
		else
		{
			// clear previous location
			updateCellColor(robot.row,robot.col,CLEAR_COLOR);
			// move it west
			robot.col = robot.col-1;
		}
	}
	
	else if (direction == 'E')
	{ 
		// check if it's safe to move...
		if (isWallToE(r,c))
		{
			msgText = "There is a wall to the east.\nNot moving the robot.";
		}
		else
		{
			// clear previous location
			updateCellColor(robot.row,robot.col,CLEAR_COLOR)
			// move it west
			robot.col = robot.col+1;
		}
	}
	else if (direction == 'N')
	{ 
		// check if it's safe to move...
		if (isWallToN(r,c))
		{
			msgText = "There is a wall to the north.\nNot moving the robot.";
		}
		else
		{
			// clear previous location
			updateCellColor(robot.row,robot.col,CLEAR_COLOR);
			// move it west
			robot.row = robot.row-1;
		}
	}
	else if (direction == 'S')
	{ 
		// check if it's safe to move...
		if (isWallToS(r,c))
		{
			msgText = "There is a wall to the south.\nNot moving the robot.";
		}
		else
		{
			// clear previous location
			updateCellColor(robot.row,robot.col,CLEAR_COLOR);
			// move it west
			robot.row = robot.row+1;
		}
	}
	
	robot.row = (robot.row + MAXROWS) % MAXROWS;
	robot.col = (robot.col + MAXCOLS) % MAXCOLS;
	
	// clear the cheated map
	clearVisited();
	// and draw cookies!
	drawCookies();
	// don't forget to draw the robot on top...
	updateCellColor(robot.row,robot.col,ROBOT_COLOR);
	// change the status tag
	document.getElementById('surroundings').value = SURR_TEXT[getSurroundings()];
	// print any messages
	document.getElementById('mesg').value = msgText;	 

}

/* moveRobot takes in one argument, (string) `rule`, and moves the robot and returns a string depending on the 
 * behavior of the robot in its new state
 */
function moveRobot(rule)
{
	var dir = rule[RULE_DIR];
	//alert('dir is' + dir)
	var newstate = rule[RULE_NEWSTATE];
	var newrow = robot.row;
	var newcol = robot.col;
	var r = newrow;
	var c = newcol;
	
	// Deal with cookies before we move!
	var cookieAction = rule[RULE_COOKIE];
	if (cookieAction == 1)
	{
        if (cookies_remaining > 0)
        {
            cookies_remaining += -1;
            cookies.push(cookieLocation(robot.row,robot.col));
        }
        else
            return "No more cookies. Stopping."
	}
    if (cookieAction == 2)
    {
        cookieIndexInList = cookies.indexOf(cookieLocation(r,c))
        if (cookieIndexInList == -1)
            return "There is no cookie here! You cannot pull cookies out of thin air!"
        else
        {
            cookies_remaining += 1;
            cookies.splice(cookieIndexInList,1)
        }
    }
	
	if (dir == MOVE_X) ;  // do not move at all
	else if (dir == MOVE_N)
	{
		if (!isWallToN(r,c)) newrow -= 1;
		else return "Can not move to the north!";
	}
	else if (dir == MOVE_E)
	{
		if (!isWallToE(r,c)) newcol += 1;
		else return "Can not move to the east!";
	}
	else if (dir == MOVE_W)
	{
		if (!isWallToW(r,c)) newcol -= 1;
		else return "Can not move to the west!";
	}
	else if (dir == MOVE_S)
	{
		if (!isWallToS(r,c)) newrow += 1;
		else return "Can not move to the south!";
	}
	else return 'Direction of ' + dir + ' not recognized.';

	// WRAP AROUND FUNCTIONALITY
	newrow = (newrow + MAXROWS) % MAXROWS;
	newcol = (newcol + MAXCOLS) % MAXCOLS;

	// check that it's not a wall or out of bounds...
	// we return a nonempty message if we are and
	// an empty string if everything is OK

	if (newcol < 0) return 'Trying to move to col -1! Stopping';
	if (newcol >= MAXCOLS) return 'Trying to move to col " + MAXCOLS + "! Stopping';
	if (newrow < 0) return 'Trying to move to row -1! Stopping';
	if (newrow >= MAXROWS) return 'Trying to move to row " + MAXROWS + "! Stopping';

	// now update the data structure and the display
	updateCellColor(robot.row,robot.col,VISITED_COLOR);
	robot.row = newrow;
	robot.col = newcol;
	drawCookies();
	updateCellColor(robot.row,robot.col,ROBOT_COLOR);

	// now update the state of the robot
	robot.state = newstate;

	if (DEBUG) return 'Robot is ' + robot;
	else return ''; // everything is OK

}

/* isWallToN takes in two arguments, (int) `r` and (int) `c`, and checks if there is a wall to
 * the north of the cell at row `r`, column `c`; it returns 1 if there is a wall and 0 otherwise
 */
function isWallToN(r,c)
{
	var CC = currentCells;
	//alert('r and c are ' + r + ' '  + c )
	var new_r = ((r - 1) + MAXROWS) % MAXROWS;
	if (CC[new_r][c] == WALL_COLOR ) return 1;
	return 0
}

/* isWallToE takes in two arguments, (int) `r` and (int) `c`, and checks if there is a wall to
 * the east of the cell at row `r`, column `c`; it returns 1 if there is a wall and 0 otherwise
 */
function isWallToE(r,c)
{
	var CC = currentCells;
	var new_c = ((c + 1) + MAXCOLS) % MAXCOLS;
	if (CC[r][new_c] == WALL_COLOR ) return 1;
	return 0
}

/* isWallToW takes in two arguments, (int) `r` and (int) `c`, and checks if there is a wall to
 * the west of the cell at row `r`, column `c`; it returns 1 if there is a wall and 0 otherwise
 */
function isWallToW(r,c)
{
	var CC = currentCells;
	var new_c = ((c - 1) + MAXCOLS) % MAXCOLS;
	if (CC[r][new_c] == WALL_COLOR ) return 1;
	return 0
}

/* isWallToS takes in two arguments, (int) `r` and (int) `c`, and checks if there is a wall to
 * the south of the cell at row `r`, column `c`; it returns 1 if there is a wall and 0 otherwise
 */
function isWallToS(r,c)
{
	var CC = currentCells;
	var new_r = ((r + 1) + MAXROWS) % MAXROWS;
	if (CC[new_r][c] == WALL_COLOR ) return 1;
	return 0
}

/* getSurroundings takes in no arguments and returns the surroundings (NEWS format)
 * of the current cell Picobot is on
 */
function getSurroundings()
{
	// look at the currentCells array and robot to 
	// see what's around us!
	// should make sure that we're in bounds!
	// check to the N
	var r = robot.row;
	var c = robot.col;
	
	if (cookies.indexOf(cookieLocation(r,c)) != -1)
		if (isWallToN(r,c)) // YES N
			if (isWallToE(r,c)) // YES E
				if (isWallToW(r,c)) // YES W
					if (isWallToS(r,c)) // YES S
						return NEWS + COOKIE;
					else // NO S
						return NEWX + COOKIE;
				else // NO W
					if (isWallToS(r,c)) // YES S
						return NEXS + COOKIE;
					else // NO S
						return NEXX + COOKIE;
			else // NO E
				if (isWallToW(r,c)) // YES W
					if (isWallToS(r,c)) // YES S
						return NXWS + COOKIE;
					else // NO S
						return NXWX + COOKIE;
				else // NO W
					if (isWallToS(r,c)) // YES S
						return NXXS + COOKIE;
					else // NO S
						return NXXX + COOKIE;
		else // NO N
			if (isWallToE(r,c)) // YES E
				if (isWallToW(r,c)) // YES W
					if (isWallToS(r,c)) // YES S
						return XEWS + COOKIE;
					else // NO S
						return XEWX + COOKIE;
				else // NO W
					if (isWallToS(r,c)) // YES S
						return XEXS + COOKIE;
					else // NO S
						return XEXX + COOKIE;
			else // NO E
				if (isWallToW(r,c)) // YES W
					if (isWallToS(r,c)) // YES S
						return XXWS + COOKIE;
					else // NO S
						return XXWX + COOKIE;
				else // NO W
					if (isWallToS(r,c)) // YES S
						return XXXS + COOKIE;
					else // NO S
						return XXXX + COOKIE;
						
	else
		if (isWallToN(r,c)) // YES N
			if (isWallToE(r,c)) // YES E
				if (isWallToW(r,c)) // YES W
					if (isWallToS(r,c)) // YES S
						return NEWS;
					else // NO S
						return NEWX;
				else // NO W
					if (isWallToS(r,c)) // YES S
						return NEXS;
					else // NO S
						return NEXX;
			else // NO E
				if (isWallToW(r,c)) // YES W
					if (isWallToS(r,c)) // YES S
						return NXWS;
					else // NO S
						return NXWX;
				else // NO W
					if (isWallToS(r,c)) // YES S
						return NXXS;
					else // NO S
						return NXXX;
		else // NO N
			if (isWallToE(r,c)) // YES E
				if (isWallToW(r,c)) // YES W
					if (isWallToS(r,c)) // YES S
						return XEWS;
					else // NO S
						return XEWX;
				else // NO W
					if (isWallToS(r,c)) // YES S
						return XEXS;
					else // NO S
						return XEXX;
			else // NO E
				if (isWallToW(r,c)) // YES W
					if (isWallToS(r,c)) // YES S
						return XXWS;
					else // NO S
						return XXWX;
				else // NO W
					if (isWallToS(r,c)) // YES S
						return XXXS;
					else // NO S
						return XXXX;
}

/* updateDynawalls takes in no arguments and is called in `update` to update the dynawalls
 * (since the re/disappearance of dynawalls depend on the number of rules executed!)
 */
function updateDynawalls() {
	for (let wall of dynawalls) {
		var period = 2 * wall.duration;
		var position = (ruleCounter + wall.offset) % period;

		// var show = (ruleCounter % wall.duration) === wall.offset;
		var show = (position < wall.duration);
		if (!wall.isAdd) {
			show = !show;
		}

		var nonWallColor = (visited.has(`(${wall.row}, ${wall.col})`))? VISITED_COLOR : CLEAR_COLOR;

		var color = (show)? WALL_COLOR : nonWallColor;

		// don't destroy the robot!
		if (wall.row == robot.row && wall.col == robot.col) {
			continue;
		}

		// otherwise we can safely continue...
		updateCellColor(wall.row, wall.col, color);
	}
}

/* update takes in no arguments and updates the game state, including the dynawalls, the bot,
 * and the messages to the client
 */
function update()
{
    console.log(timingDelay);
	// update dynawalls
	ruleCounter++;
	updateDynawalls();

	// what is the rule
	// it's the current robot's state and surr
	var currentstate = robot.state;
	var surr = getSurroundings();
	rule = RULES[currentstate][surr]
	var ruleText = "";
	var mesgText = "";
   
	if (!(rule))
	{
		ruleText = "none";
		mesgText = mesgText + "\n" + "No rule for state " + 
		currentstate + " and surr " + SURR_TEXT[surr] +
		"\nStopping."
	}
	else
	{ 
		// get the parts of the rule needed to move the robot
		mesgText = mesgText + moveRobot(rule) + "\n";
		ruleText = rule[RULE_TEXT];
	}

	// set the current (== previous) rule
	document.getElementById('currentrule').value = ruleText;

	// do it again to get the _next_ rule

	currentstate = robot.state;
	surr = getSurroundings();
	var newrule = RULES[currentstate][surr];
	var newruletext = "";


	if (!(newrule))
	{
		newruleText = "none";
	}
	else
	{ 
		// get the parts of the rule needed to move the robot
		//reply = moveRobot(newrule);
		newruleText = '' + newrule[RULE_TEXT];
	}

	// set the next rule
	document.getElementById('mesg').value = mesgText;
	document.getElementById('nextrule').value = newruleText;
	document.getElementById('state').value = currentstate;
	document.getElementById('surroundings').value = SURR_TEXT[surr];
	updateProgress();
}


var timerID = null

function changeSpeed(newSpeed) {
	timingDelay = MAX_DELAY - newSpeed;
	if (isRunning) {
		clearTimeout(timerID);
		clearInterval(timerID);
		timerID = setInterval(update, timingDelay);
	}
}

/* go takes in no arguments and is the heart and soul of Picobot...it calls `update`
 * every `timingDelay` milliseconds
 */
function go()
{
	isRunning = true;
	clearInterval(timerID);
	timerID=setInterval("update()",timingDelay);
}

/* stop takes in no arguments and stops the game loop started by `go`
 */
function stop()
{
	isRunning = false;
	clearInterval(timerID);
}

/* removeEmptyStrings takes in one argument, (Array) `arr`, and returns a new array
 * which is a copy of `arr` but without any empty strings...how nice! :)
 */
function removeEmptyStrings(arr)
{
	// returns an array without empty strings
	var newarr = Array()
	var n = 0 // location for next element of newarr
	for (var i=0 ; i<arr.length ; ++i)
	{
		if (arr[i] != '') newarr[n++] = arr[i]
	} 
	return newarr
}

/* addToList takes in two arguments, (Array) `sL` and (int) `n`, and appends all of the ints in sL
 * added with n to sL
 */
function addToList(sL,n)
{
	// append all of the ints in sL (with n added) to sL
	var L = sL.length;
	for (var i=0 ; i<L ; ++i)
	{
		sL[L+i] = sL[i] + n;
	}
	return sL
}

/* computeSurrFromString takes in one argument, (string) `surrStr`, and returns a list of surroundings
 * of surrStr or -1 if something catastrophic happened...
 */
function computeSurrFromString(surrStr)
{
	// must be length 4
	if (surrStr.length != 4) return -1; // ERROR
	// check first char: must be N, x, X, or *
	var nc = surrStr.charAt(0);
	if (nc != 'N' && nc != 'X' && nc != '*') return -1; //ERROR
	var ec = surrStr.charAt(1);
	if (ec != 'E' && ec != 'X' && ec != '*') return -1; //ERROR
	var wc = surrStr.charAt(2);
	if (wc != 'W' && wc != 'X' && wc != '*') return -1; //ERROR
	var sc = surrStr.charAt(3);
	if (sc != 'S' && sc != 'X' && sc != '*') return -1; //ERROR
	
	// everything is OK, we prepare the list of integers
	// to return - this is the list of surroundings matched
	// by the input surrStr
	surroundingsList = Array();
	var i = 0; // next element in surroundingsList
	// base value
	var base = (nc == 'N') + 2*(ec == 'E') + 4*(sc == 'S') + 8*(wc == 'W');
	// add them into the list
	surroundingsList[i++] = base;
	if (nc == '*') surroundingsList = addToList(surroundingsList,1) 
	if (ec == '*') surroundingsList = addToList(surroundingsList,2) 
	if (wc == '*') surroundingsList = addToList(surroundingsList,8) 
	if (sc == '*') surroundingsList = addToList(surroundingsList,4) 
	return surroundingsList
}

/* computeCookieSeeFromString takes in one argument, `string` cookieSeeStr, and determines whether the bot
 * should be doing anything if we are on a cookie
 */
function computeCookieSeeFromString(cookieSeeStr)
{
	if (cookieSeeStr == '*' || cookieSeeStr == '*M') return 0;
	if (cookieSeeStr == 'XM') return 1;
	if (cookieSeeStr == 'M' || cookieSeeStr == 'WM') return 2;
	else return -1;
}

/* computeCookieDoFromString takes in one argument, `string` cookieSeeStr, and checks what we should
 * do to the cookie
 */
function computeCookieDoFromString(cookieSeeStr)
{
	if (cookieSeeStr == '*') return 0;
	if (cookieSeeStr == 'DM') return 1;
	if (cookieSeeStr == 'PM') return 2;
	else return -1;
}

/* clearRules takes in no arguments and deletes all of the rules in `RULES`, wiping the slate clean
 */
function clearRules()
{
	var maxstates = RULES.length;
	for (var statenum=0 ; statenum<maxstates ; ++statenum)
	{
		RULES[statenum] = Array(); // gone!
		// does java script have garbage collection? I hope so!
		// Yes, it does!
	}
}

/* checkAndSetNewRule takes in seven arguments:
 *     - (int) state
 *     - (Array) surrList
 *     - (string) move
 *     - (int) cookieAction
 *     - (int) newstate
 *     - (int) linenum
 *     - (string) ruleStr
 * and checks the new rule, and if the rule is okay, then it is set and `RULES` is updated
 */
function checkAndSetNewRule(state,surrList,move,cookieAction,newstate,linenum,ruleStr)
{
    var reply = '';
    var message = '';

    // for each element of surr
    var L = surrList.length;
    for (var i=0 ; i<L ; ++i)
    {
        var surr = surrList[i];
        if (!(RULES[state][surr]))
        {
            if (DEBUG) reply += "No repeat rule. state:" + state + "  surr:" + surr + "\n";
            // it's OK, so set the rule (no action yet)
            RULES[state][surr] = [ move, newstate, OTHER, linenum, ruleStr, cookieAction ]; 
        }
        else
        {
            reply += "Repeat Rule! The state: " + state + "  surr: " + SURR_TEXT[surr] +
                "\n   was already handled on line #" + RULES[state][surr][3] +
                "\n   which reads as follows:" + 
                "\n   " + RULES[state][surr][4] + "\n";
            return reply;
        }
    }

    return reply;
}

/* isTuple takes in one argument, (string) `str`, and determines whether it is a tuple (i.e.
 * in the form (X,Y)); note that whitespace is allowed
 */
function isTuple(str) {
	if (str.length >= 5 &&
		str[0] === '(' &&
		str[str.length - 1] === ')' &&
		str.indexOf(',') !== -1) {
		return true;
	}

	return false;
}

/* isHashtagCommand takes in one argument, (string) `ruleStr`, and determinse whether the rule `ruleStr`
 * is a hashtag command (i.e. in the form # add (X,Y))
 */
function isHashtagCommand(ruleStr) {
	var tokens = ruleStr.split(' ');
	var hasValidLength = tokens.length >= 3;
	var hasValidFormat = (tokens[0] === '#') &&
						 (tokens[1] === 'add' || tokens[1] === 'sub') &&
						 (isTuple(ruleStr.substring(ruleStr.indexOf("("), ruleStr.indexOf(")") + 1)));

	if (hasValidLength && hasValidFormat) {
		return true;
	}

	return false;
}

/* isDynaCommand takes in one argument, (string) `hashtagCommand`, and determines whether the
 * hashtag command `hashtagCommand` is a dyna command (a command that dynamically alters cells);
 * returns true if it is and false otherwise
 */
function isDynaCommand(hashtagCommand) {
	hashtagCommand = hashtagCommand.toLowerCase();
	tokens = hashtagCommand.split(" ");
	if (tokens.includes("dyna")) {
		return true;
	}

	return false;
}

/* isAddCommand takes in one argument, (string) `hashtagCommand`, and determines whether the
 * valid hashtag command `hashtagCommand` is an "add" command (i.e. "adds a/many cell/s to the grid),
 * and hence can also determine whether `hashtagCommand` is also a "sub" command
 */
function isAddCommand(hashtagCommand) {
	var tokens = hashtagCommand.split(" ");
	if (tokens[1] === "add") {
		return true;
	}

	return false;
}

/* getDurationAndOffset takes in a dyna command, (string) `ruleStr`, and gets the duration and offset
 * of the dyna command, if provided. if not provided, the duration defaults to 25 and the offset
 * defaults to 0
 */
function getDurationAndOffset(ruleStr) {
	var duration = 25;  // recommended duration after trial and error
	var offset = 0;

	// rudimentary string parsing :,(
	tokens = ruleStr.split(" ");
	for (let token of tokens) {
		if (token.startsWith("d=")) {
			duration = parseInt(token.slice(2));
		}

		if (token.startsWith("o=")) {
			offset = parseInt(token.slice(2));
		}
	}

	return [duration, offset];
}

/* getNumsBetween takes in two arguments, (int) `num1` and (int) `num2`, and returns a list
 * of the numbers between `num1` and `num2`, inclusive
 */
function getNumsBetween(num1, num2) {
	var nums = [];
	for (let i = num1; i <= num2; i++) {
		nums.push(i);
	}
	return nums;
}

/* getIndices takes in one argument, (string) rangeStr, and returns an array of the rows or cols as indicated
 * by rangeStr
 */
function getIndices(rangeStr) {
	if (rangeStr.trim() === "*") {  // entire width
		return [...Array(MAXROWS).keys()];
	} else if (rangeStr.includes("-")) {  // number range
		var dashIndex = rangeStr.indexOf("-");
		
		var firstNum = parseInt(rangeStr.substring(0, dashIndex));
		var secondNum = parseInt(rangeStr.substring(dashIndex + 1));

		return getNumsBetween(firstNum, secondNum);
	}
	
	return [rangeStr];
}

/* processHashtagCommands takes in four arguments:
 *     - (string) ruleStr
 *     - (int) row
 *     - (int) col
 *     - (int) color
 * and given a hashtag command `ruleStr`, processHashtagCommands parses through `ruleStr`
 * and appropriately updates the cells according to `ruleStr`; note that this function also handles 
 * star and dyna commands
 */
function processHashtagCommands(ruleStr, row, col, color) {
	var rows = getIndices(row);
	var cols = getIndices(col);

	for (let r of rows) {
		for (let c of cols) {
			if (isDynaCommand(ruleStr)) {
				var duration, offset;
				[duration, offset] = getDurationAndOffset(ruleStr);

				dynawalls.push({
					isAdd: isAddCommand(ruleStr),
					row: parseInt(r),
					col: parseInt(c),
					duration: duration,
					offset: offset,
					origColor: color
				})
			}
			else {
				// don't destroy the robot!
				if (r == robot.row && c == robot.col) {
					continue;
				}
				// otherwise we can safely pass through...
				updateCellColor(parseInt(r), parseInt(c), color);
			}
		}
	}
}

/* removeDocstrings takes in two arguments, (string[]) `allRules` and (string) `docstringSymbol`, 
 * and parses `allRules` and removes any docstrings in the rules--note that `allRules` is 
 * passed by object!
 */
function removeDocstrings(allRules, docstringSymbol) {
	for (let i = 0; i < allRules.length; i++) {
		if (allRules[i].startsWith(docstringSymbol)) {
			// TWO EDGE CASES:

			// 1: END COMMENT IS ON THE SAME LINE

			if (allRules[i].endsWith(docstringSymbol) && allRules[i].length >= (2 * docstringSymbol.length)) {
				allRules[i] = "";
				continue;
			}

			// 2: END COMMENT IS ON A FUTURE LINE

			let afterRules = allRules.slice(i + 1);  // don't include the current rule
			for (let j = 0; j < afterRules.length; j++) {

				if (afterRules[j].endsWith(docstringSymbol)) {
					// +1 since j is zero-based
					for (let start = i; start <= (i + j + 1); start++) {
						allRules[start] = "";
					}

					// decrement as we don't want to skip over the line right after the docstring
					i--;

					// now break as we don't want to look through stale indices
					break;
				}

			}

		}
	}	
}

/* computeRules takes in one argument, (string) `s`, and parses `s` and extracts the rules 
 * (including comments!) from s
 */
function computeRules(s)
{
	// convert tabs to spaces
	// given that this is a browser, it's not clear
	// how you would even enter a tab, but anyway...
	s = s.replace('	',' ');

	// we should clear out the rules here...
	clearRules();

	// here are all of the typed rules, line-by-line
	var allRules = s.split('\n');
	var returnmessage = '';

	removeDocstrings(allRules, SINGLE_QUOTES_DOCSTR_MARKER);
	removeDocstrings(allRules, DOUBLE_QUOTES_DOCSTR_MARKER);

	// loop through them all...
	for (var linenum = 0 ; linenum < allRules.length ; ++linenum)
	{
		// the current rule == the current line's string
		var ruleStr = String(allRules[linenum]);

		console.log(`read line ${linenum}:`, ruleStr);

		returnmessage = "Oops...\n\nOn line number " + linenum + ", which is this:\n   " + ruleStr + "\n\n";

		// on IE we need to remove the '\r' at the end - this is weird!
		var L = ruleStr.length;
		if ( ruleStr.indexOf('\r') != -1 )
		{
			ruleStr = ruleStr.substring(0,ruleStr.indexOf('\r')); // get rid of the \r
		}

		///////////////////////////////////////////////////////////////

		// two cases when a line begins with a #
		// 1: it has add/sub after it, making it not a comment
		// 2: it doesn't follow the format of above, thus rendering it a comment...

	    // we've found a # add/sub command!
		if (isHashtagCommand(ruleStr)) {
			ruleStr = ruleStr.toLowerCase();

			// locate the indices around the numbers to locate where the numbers are
			// (note that the numbers can be two digits, which is why we have to be careful!)
			var leftParensIndex = ruleStr.indexOf('(');
			var commaIndex = ruleStr.indexOf(',');
			var rightParensIndex = ruleStr.indexOf(')');

			var row = ruleStr.substring(leftParensIndex + 1, commaIndex).trim();
			var col = ruleStr.substring(commaIndex + 1, rightParensIndex).trim();

			var cellColor = (isAddCommand(ruleStr)) ? WALL_COLOR : CLEAR_COLOR;

			processHashtagCommands(ruleStr, row, col, cellColor);
		}

		// throw out anything at or after the first # (commenting...)
		// (note that this also throws out the hashtag commands, but we rest assured knowing that we don't
		// need them anymore since we've already parsed them!)
		var locationOfHashtagComment = ruleStr.indexOf('#');
		if (locationOfHashtagComment != -1)   // there _was_ a comment
		{
			// this line turns the string into a blank line...
			// hence erasing the line from the universe :((
			ruleStr = ruleStr.substring(0,locationOfHashtagComment);
		}


		///////////////////////////////////////////////////////////////

		// make the whole thing uppercase
		ruleStr = ruleStr.toUpperCase();

		// tokenize on spaces into the list s
		var s = ruleStr.split(' '); 
		s = removeEmptyStrings(s);
		// blank lines are OK, but partial lines are not
		if (s.length == 0) continue;  // ignore lines with no tokens
		if (s.length < 5)
		{
			returnmessage += "There are too few tokens with only " + s.length + 
			" seen.\n\n  5 are needed, in the form\n " +
			" State Surr -> Move NewState";
			return returnmessage;
		}
		else if (s.length > 5)
		{
			returnmessage += "There are too many tokens with " + s.length + 
			" seen.\n\n  5 are needed, in the form\n " +
			" State Surr -> Move NewState";
			return returnmessage;
		}
		
		//////////////////////////////////////////////////////////////////////////////////////////////////
		// check stateStr
		var stateStr = s[0]
		var state = parseInt(stateStr)
		if (!(state>=0 && state<MAXRULES)) state = -1;
		if (state == -1) 
		{
			returnmessage += "The first token, representing the input state, was not an integer" +
			" between 0 and " + (MAXRULES-1) + " (inclusive).";
			return returnmessage;
		}
		//////////////////////////////////////////////////////////////////////////////////////////////////
		
		
		//////////////////////////////////////////////////////////////////////////////////////////////////
		// check surrStr
		var surrStr = s[1]
		var surr = computeSurrFromString(surrStr)

		if (surr == -1)
		{
			returnmessage += "The second token, representing the \"NEWS\" surroundings,\n  was not in" +
			" a recognized format. It should be\n  from xxxx to NEWS, with *s allowed.";
			return returnmessage;
		}
		// now surr is a list of the appropriate surroundings...
		// we should check against our rule base to see if s/t is
		// defined twice...
		// but we wait to do this until everything has parsed all right...
		//////////////////////////////////////////////////////////////////////////////////////////////////
        
		
		//////////////////////////////////////////////////////////////////////////////////////////////////
		// Check whether to do anything if we are on a cookie
		// If we were on an arrow, then we don't care about cookies so insert a *
		var cookieSeeStr = s[2];
		if (cookieSeeStr == "->")
		{
			s.splice(2,0,'*');
			cookieSeeStr = s[2];
		}
		if (cookieSeeStr == "-")
		{
			returnmessage += "It seems you have a dash - instead of an arrow ->\n" + 
			" Perhaps there's a space between the - and the >\n" +
			" Be sure your rule is in the form\n" + 
			" State Surr -> Move NewState";
			return returnmessage;
		}
		var cookieSee = computeCookieSeeFromString(cookieSeeStr);
		if (cookieSee == -1)
		{
			returnmessage += "This middle token should be an arrow: ->\n\nInstead, it was " + s[2] +
			"\n\n" + " Be sure your rule is in the form\n" + 
			" State Surr -> Move NewState";
			return returnmessage;
		}
		else if (cookieSee == 0)
		{
			surr = addToList(surr,16)
		}
		else if (cookieSee == 2)
		{
			surr = surr.map(function(item) { return item+16; });
		}
		//////////////////////////////////////////////////////////////////////////////////////////////////

		
		//////////////////////////////////////////////////////////////////////////////////////////////////
		// Not all that important...
		var arrowStr = s[3];
		if (arrowStr != "->")
		{
			returnmessage += "This middle token should be an arrow: ->\n\nInstead, it was " + s[2] +
			"\n\n" + " Be sure your rule is in the form\n" + 
			" State Surr -> Move NewState";
			return returnmessage;
		}
		//////////////////////////////////////////////////////////////////////////////////////////////////
		
		
		//////////////////////////////////////////////////////////////////////////////////////////////////
		// Check what we should do to the cookie
		// If we reach a direction command, clearly we will do nothing to the cookie
		var cookieDoStr = s[4];
		if ((cookieDoStr == 'N') || (cookieDoStr == 'E') || (cookieDoStr == 'S') || (cookieDoStr == 'W') || (cookieDoStr == 'X'))
		{
			s.splice(4,0,'*');
			cookieDoStr = s[4];
		}
		var cookieDo = computeCookieDoFromString(cookieDoStr);
		if (cookieDo == -1)
		{
			returnmessage += ":-) The token representing the movement direction" + 
			" should be one of these: N, E, W, S, or X." + 
			"\n\n" + " Rather, the token was " + String(cookieDoStr);
			return returnmessage;
		}
		//////////////////////////////////////////////////////////////////////////////////////////////////
		
		
		//////////////////////////////////////////////////////////////////////////////////////////////////
		// better be one of the five possibilities (so far)
		var dirStr = s[5]
		//return dirStr.length;
		if (dirStr.length != 1)
		{
			returnmessage += ":-) The token representing the movement direction" + 
			" should be only 1 character long: N, E, W, S, or X." + 
			"\n\n" + " Rather, the token was " + String(dirStr) + " with length " +
			String(dirStr.length);
			return returnmessage;
		}
		var dc = dirStr.charAt(0);
		if (dc != 'N' && dc != 'E' && dc != 'W' && dc != 'S' && dc != 'X')
		{
			returnmessage += "The token representing the movement direction" + 
			" should be one of N, E, W, S, or X." +
			"\n\n" + " Rather, the token was " + dirStr;
			return returnmessage;
		}
		var dir = 0;
		if (dc == 'N') dir = MOVE_N;
		if (dc == 'E') dir = MOVE_E;
		if (dc == 'W') dir = MOVE_W;
		if (dc == 'S') dir = MOVE_S;
		if (dc == 'X') dir = MOVE_X;
		//////////////////////////////////////////////////////////////////////////////////////////////////
		
		
		//////////////////////////////////////////////////////////////////////////////////////////////////
		// check the new state
		var newstateStr = s[6];
		var newstate = parseInt(newstateStr)
		if (!(newstate>=0 && newstate<MAXRULES)) newstate = -1;
		if (newstate == -1) 
		{
			returnmessage += "The last token, representing the output state, was not an integer" +
			" between 0 and " + MAXRULES + " (inclusive).";
			return returnmessage;
		}
		//////////////////////////////////////////////////////////////////////////////////////////////////
		

		// now check the rule for possible repeats -- or other things
		var reply = checkAndSetNewRule(state,surr,dir,cookieDo,newstate,linenum,ruleStr);
		if (reply != '')
		{
		// then it was an error message
			returnmessage += reply;
			if (DEBUG) returnmessage += "\n\n"; // keep accumulating information if we're debugging
			else return returnmessage;
		}

	}

	// update the positions of the dynawalls as soon as enter is pressed
	updateDynawalls();

	//return '' + state + ' ' + surrStr + ' ' + arrowStr + ' ' + dirStr + ' ' + newstate;
	if (DEBUG) return returnmessage; // show accumulated information, if we're debugging
	else return 'OK';

}

/* updateProgress takes in no arguments and provides a nice little check-in
 * about how Picobot is doing! <3
 */
function updateProgress()
{
  var total = countSquares( currentCells, CLEAR_COLOR );
  document.getElementById('progress').value = total;
  if (total == 0) {
    stop();
    document.getElementById('mesg').value = "\n** Complete ! **";
  } // end if done with environment
}



var currentMapIndex = 6;
var MAPS = [emptymap, mazemap, diamondmap, map3, map4, map5, map6];

/* getCMI takes in no arguments and returns the map index of the current map
 */
function getCMI()
{
  return currentMapIndex;
}

/* changeMap takes in one argument, (int) `value`, and changes the grid to another map based on the
 * map index `value`
 */
function changeMap(value)
{
    currentMapIndex += value;
    if (currentMapIndex >= MAPS.length)
	{
        currentMapIndex = 0;
    }
	else if (currentMapIndex < 0)
	{
		currentMapIndex = MAPS.length - 1;
	}
    
    // now do stuff to get the page ready to go...
    
    // draw the map!
    //alert('currentMapIndex is ' + currentMapIndex);
    drawMap( MAPS[currentMapIndex] ); // sets currentCells, too!
    
    // set and draw the robot
    resetBot();
    
    // compute the rules (the default rules at the start)
    document.calc.mesg.value = computeRules(document.calc.rules.value);
    
    // fill in the various text fields
    document.getElementById('state').value = "0";
    document.getElementById('surroundings').value = SURR_TEXT[getSurroundings()];
    updateProgress();
}

changeMap(1);


} catch(e) {
	for (var i in e) alert(e[i]);
}
