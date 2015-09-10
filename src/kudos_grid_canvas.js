/*
 * kudos_grid_canvas.js - Defines a class for DOM display of a grid
 * Revised 09/09/2015 by sigkill
 * Licensed under MIT-Zero
 */

/* KudosGridCanvas(container, selection_callback)
 * Constructor. Creates a canvas element as a child of container
 * on which a sudoku grid can be displayed.
 * Supports selection of particular grid cell via mouse or touch;
 * when a selection is detected, selection_callback is invoked
 * with the x and y position of the selected cell. */
function KudosGridCanvas(container, selection_callback)
{
	this.selection_callback = selection_callback;

	/* Canvas */
	var canvas = document.createElement("canvas");

	/* Size */
	canvas.width = KudosCFG.GRID_CANVAS_SIZE;
	canvas.height = KudosCFG.GRID_CANVAS_SIZE;

	/* Maybe this should be in the main class, but I dunno */
	canvas.style.float = "left";

	/* Canvas context. Use translate hack to get sharp pixels */
	this.context = canvas.getContext("2d");
	this.context.translate(0.5, 0.5);

	/* Fill the canvas first out of paranoia */
	this.context.fillStyle = KudosCFG.CELL_BG_COLORS[0];
	this.context.fillRect(0, 0, KudosCFG.GRID_CANVAS_SIZE, KudosCFG.GRID_CANVAS_SIZE);

	/* These don't change at all during any drawing operations we do */
	this.context.strokeStyle = KudosCFG.FG_COLOR;
	this.context.textAlign = "center";
	this.context.textBaseline = "middle";

	/* Drawing many lines */
	this.context.beginPath();

	/* Trace outer border */
	KudosTraceRect(this.context, 0, 0, KudosCFG.GRID_CANVAS_SIZE, KudosCFG.GRID_CANVAS_SIZE);

	/* First horizontal line */
	this.context.moveTo(0, 1 + KudosCFG.CELL_CLUSTER_SIZE);
	this.context.lineTo(KudosCFG.GRID_CANVAS_SIZE - 1, 1 + KudosCFG.CELL_CLUSTER_SIZE);

	/* Second hortizontal line */
	this.context.moveTo(0, 2 + 2 * KudosCFG.CELL_CLUSTER_SIZE);
	this.context.lineTo(KudosCFG.GRID_CANVAS_SIZE - 1, 2 + 2 * KudosCFG.CELL_CLUSTER_SIZE);

	/* First vertical line */
	this.context.moveTo(1 + KudosCFG.CELL_CLUSTER_SIZE, 0);
	this.context.lineTo(1 + KudosCFG.CELL_CLUSTER_SIZE, KudosCFG.GRID_CANVAS_SIZE - 1);

	/* Second vertical line */
	this.context.moveTo(2 + 2 * KudosCFG.CELL_CLUSTER_SIZE, 0);
	this.context.lineTo(2 + 2 * KudosCFG.CELL_CLUSTER_SIZE, KudosCFG.GRID_CANVAS_SIZE - 1);

	/* Stroke */
	this.context.stroke();

	var self = this;

	/* The mouse and touch events trigger calls to the selection callback,
	 * with parameters x and y indicating the selected cell.
	 * I'd like to believe that this is pretty intuitive. */

	/* If the user clicks, select the appropriate cell */
	canvas.onmousedown = function(e) {
		/* Don't preventDefault here. Causes weird issues with selection */
		self.handleClick(e.offsetX, e.offsetY);
	};

	/* If the user is currently clicking, and the mouse moves, do the same */
	canvas.onmousemove = function(e) {
		if(e.buttons)
		{
			e.preventDefault(); /* Might not need this but doesn't cause problems */
			self.handleClick(e.offsetX, e.offsetY);
		}
	};

	/* This is a little harder - touch events don't give offset coords. */
	var touch_handler = function(e) {
		/* No zoom or anything */
		e.preventDefault();

		/* Client position of the canvas on the page */
		var rect = canvas.getBoundingClientRect();

		/* Calculate the offset coords. and handle the "click" */
		self.handleClick(
			e.targetTouches[0].clientX - rect.left,
			e.targetTouches[0].clientY - rect.top
		);
	};

	/* touchstart and touchmove are identical */
	canvas.addEventListener("touchstart", touch_handler);
	canvas.addEventListener("touchmove", touch_handler);

	/* Stick the canvas onto the parent */
	container.appendChild(canvas);
}

/* KudosGridCanvas.handleClick(x, y)
 * Given an (x, y) offset into the canvas,
 * checks the "clicked" cell and possibly calls
 * the selection callback. */
KudosGridCanvas.prototype.handleClick = function(x, y) {
	/* Small pitfall: in the grid layout, cells actually overlap by 1px.
	 * Clicking on this 1px overlapping area will give priority to
	 * lower, farther-right cells. No big deal. */

	/* Horizontal and vertical indices */
	var u, v;

	/* Seek a horizontal index that is past the given coordinate */
	for(u = 0; u <= 9; u ++)
		if(KudosCFG.CELL_RELATIVE_POS(u) > x)
			break;

	/* 0 means we're too far left */
	if(u === 0) return;

	/* Decrement */
	u --;

	/* Same as above but along the vertical */
	for(v = 0; v <= 9; v ++)
		if(KudosCFG.CELL_RELATIVE_POS(v) > y)
			break;

	if(v === 0) return;
	v --;

	/* Now the cell at (u, v) may contain the given coordinate */

	/* Compute the offset and check for intersection with the point */
	var xt = KudosCFG.CELL_RELATIVE_POS(u);
	var yt = KudosCFG.CELL_RELATIVE_POS(v);
	if(x < xt + KudosCFG.CELL_SIZE && y < yt + KudosCFG.CELL_SIZE)
		this.selection_callback(u, v); /* If it intersects, select */
};


/* KudosGridCanvas.renderGrid(grid, cursor)
 * Renders a grid to the canvas element, with cursor
 * specify a "focused" cell within the grid. */
KudosGridCanvas.prototype.renderGrid = function(grid, cursor) {
	/* This is basically just an iteratation invoking the lower-level drawCell */
	grid.forEach(function(v, x, y, g) {
		this.drawCell(x, y, v, /* Position, value */
			x === cursor.x && y === cursor.y, /* Focus */
			g.err(x, y), /* Error */
			g.complete /* Completeness */
		);
	}, this);
};

/* KudosGridCanvas.drawCell(i, j, value, focused, erroneous, complete)
 * Low-level drawing function. Should maybe be earmarked as private.
 * i and j are horizontal and verticle indices. value is the value of the cell.
 * focused is a boolean indicating whether this cell should be drawn as "focused" -
 * ie. whether this cell is currently focused by the cursor.
 * erroneous is a boolean indicating whether the cell's value is "wrong".
 * complete is a boolean indicating whether the grid is complete. */
KudosGridCanvas.prototype.drawCell = function(i, j, value, focused, erroneous, complete) {
	/* Set fill style */
	if(focused)
	{
		/* Focused cells have a special color */
		this.context.fillStyle = KudosCFG.CELL_FOCUSED_BG_COLOR;
	}
	else
	{
		/* The 9 "boxes" alternate two different colors */
		var parity = (Math.floor(i / 3) + Math.floor(j / 3)) % 2;
		this.context.fillStyle = KudosCFG.CELL_BG_COLORS[parity];
	}

	/* Offset coordinates */
	var x = KudosCFG.CELL_RELATIVE_POS(i);
	var y = KudosCFG.CELL_RELATIVE_POS(j);

	/* This is magic. I'm not sure why these values work, but they seem to fill
	 * the cell perfectly without bleeding into the borders significantly.
	 * Other values make the rendering look subtly wrong.
	 * The parameters for this call were original (x, y, CELL_SIZE - 2, CELL_SIZE - 2). */
	this.context.fillRect(x + 0.5, y + 0.5, KudosCFG.CELL_SIZE - 1.5, KudosCFG.CELL_SIZE - 1.5);

	/* Retrace the border to correct for any bleeding from the fill */
	this.context.beginPath();
	KudosTraceRect(this.context, x, y, KudosCFG.CELL_SIZE, KudosCFG.CELL_SIZE);
	this.context.stroke();

	/* If the cell is non-empty, */
	if(value)
	{
		/* Use "complete" color if needed, or "erroneous" color. Fall back on the default. */
		this.context.fillStyle = (complete) ?
			KudosCFG.CELL_COMPLETE_COLOR :
			((erroneous) ? KudosCFG.CELL_ERROR_COLOR : KudosCFG.FG_COLOR);

		/* Set the font. Font is bold for permanent cells. */
		this.context.font = (value < 0 ? "bold " : "") + KudosCFG.CELL_FONT;

		/* Draw the cell text */
		this.context.fillText(Math.abs(value), x + KudosCFG.CELL_SIZE / 2, y + KudosCFG.CELL_SIZE / 2);
	}
};

