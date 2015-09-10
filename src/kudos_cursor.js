/*
 * kudos_cursor.js - Defines a cursor within a sudoku grid
 * Revised 31/08/2015 by sigkill
 * Licensed under MIT-Zero
 */

/* KudosCursor(callback)
 * Constructor. Creates a cursor, initially centered at (4, 4),
 * designed for use with a sudoku grid. Exposes methods to allow
 * movement of the cursor. When the cursor's "pointed-to" cell
 * changes, the given callback is invoked with params
 * (new_x, new_y) and with `this` being the cursor object
 * (w/ c.x and c.y accessible). */
function KudosCursor(callback)
{
	/* Cursor starts centered */
	this.x = 4;
	this.y = 4;

	this.callback = callback;

	/* Some magic variables to make the cursor move a little smarter */
	this.left_bias = true;
	this.up_bias = true;
}

/* KudosCursor.set(x, y)
 * Sets the position of the cursor, invoking the callback
 * if the position changes. */
KudosCursor.prototype.set = function(x, y) {
	/* Defensive programming */
	if(x < 0 || y < 0 || x >= 9 || y >= 9)
		return;

	/* Set the position if necessary */
	if(x != this.x || y != this.y)
	{
		var old = {x: this.x, y: this.y};

		this.x = x;
		this.y = y;

		this.callback(old.x, old.y);
	}
};

/* The code below is a bit of a mess but I'm not sure how to improve things.
 * Background:
 * The cursor is intended to function in two modes: "skipping" and non-skipping.
 * Non-skipping mode allows navigation between adjacent cells with left/right/up/down.
 * It's intuitive and easy to implement.
 * Skipping mode is intended to allow "guided" navigation for the sudoku app,
 * when the game is not in "build mode" - it skips over permanent cells
 * (ie. only selects cells that are editable). This turns out to be difficult
 * to implement, because the most intuitive implementations result in unreachable
 * cells in certain grid layouts. I have managed to work around this, but only
 * by writing some very large, ugly, and repetitive methods. */

/* KudosCursor.initBest()
 * Helper function. Returns a "first guess" at the best new position
 * for the cursor. */
KudosCursor.prototype.initBest = function() {
	/* Use the current cell as a fallback, but assume that's infinitely far away */
	return {x: this.x, y: this.y, d: Infinity};
};

/* KudosCursor.updateBest()
 * Helper function. Updates the "guess" at the best position */
KudosCursor.prototype.updateBest = function(grid, best, x, y) {
	/* Only concerned about mutable cells */
	if(grid.get(x, y) >= 0)
	{
		/* If the distance is lower than our best guess thus far, revise our guess */
		var d = Math.abs(this.x - x) + Math.abs(this.y - y);
		if(d < best.d)
		{
			best.x = x;
			best.y = y;
			best.d = d;
		}
	}
};

/* KudosCursor.left(skip_perm, grid)
 * Attempts to shift the cursor left.
 * skip_perm is a boolean indicating whether to skip permanent cells.
 * grid is a KudosGrid which may be examined to find permanent cells. */
KudosCursor.prototype.left = function(skip_perm, grid) {
	var old = {x: this.x, y: this.y};

	/* If we could conceivably move left, */
	if(this.x > 0)
	{
		if(skip_perm)
		{
			/* Complicated skipping strategy */

			/* First guess */
			var best = this.initBest();

			/* Examine cells to the left */
			for(var x = 0; x < this.x; x ++)
			{
				/* If we're "biased" to higher cells, then start from the top,
				 * otherwise start from the bottom */
				if(this.up_bias)
				{
					for(var y = 0; y < 9; y ++)
						this.updateBest(grid, best, x, y);
				}
				else
				{
					for(var y = 9; y -- > 0;)
						this.updateBest(grid, best, x, y);
				}
			}

			/* Set coordinates */
			this.x = best.x;
			this.y = best.y;
		}
		else
		{
			/* Intuitive cell-wise movement */
			this.x --;
		}
	}

	/* If, in moving left, we also moved down, we want our next move to be biased up.
	 * ... and vice versa. */
	if(old.y < this.y)
		this.up_bias = true;
	else if(old.y > this.y)
		this.up_bias = false;

	/* If the coordinates have changed, call the callback */
	if(old.x != this.x || old.y != this.y)
		this.callback(old.x, old.y);
};

/* The following 3 functions are analgous to the above */

/* KudosCursor.up(skip_perm, grid)
 * Attemtps to shift the cursor upward. */
KudosCursor.prototype.up = function(skip_perm, grid) {
	var old = {x: this.x, y: this.y};

	/* If we can move up, */
	if(this.y > 0)
	{
		if(skip_perm)
		{
			/* First guess */
			var best = this.initBest();

			for(var y = 0; y < this.y; y ++)
			{
				/* If we're biased left, start from the left. Otherwise from the right */
				if(this.left_bias)
				{
					for(var x = 0; x < 9; x ++)
						this.updateBest(grid, best, x, y);
				}
				else
				{
					for(var x = 9; x -- > 0;)
						this.updateBest(grid, best, x, y);
				}
			}

			this.x = best.x;
			this.y = best.y;
		}
		else
		{
			this.y --;
		}
	}

	/* If we moved right in going up, we're biased left now, and vice versa. */
	if(old.x < this.x)
		this.left_bias = true;
	else if(old.x > this.x)
		this.left_bias = false;

	if(old.x != this.x || old.y != this.y)
		this.callback(old.x, old.y);
};

/* KudosCursor.prototype.right(skip_perm, grid)
 * Attempts to shift the cursor rightward */
KudosCursor.prototype.right = function(skip_perm, grid) {
	var old = {x: this.x, y: this.y};

	/* If we can maybe move right, */
	if(this.x < 8)
	{
		if(skip_perm)
		{
			var best = this.initBest();

			for(var x = this.x + 1; x < 9; x ++)
			{
				/* If we're biased up, start search from upward, and vice versa */
				if(this.up_bias)
				{
					for(var y = 0; y < 9; y ++)
						this.updateBest(grid, best, x, y);
				}
				else
				{
					for(var y = 9; y -- > 0;)
						this.updateBest(grid, best, x, y);
				}
			}

			this.x = best.x;
			this.y = best.y;
		}
		else
		{
			this.x ++;
		}
	}

	/* Same old */
	if(old.y < this.y)
		this.up_bias = true;
	else if(old.y > this.y)
		this.up_bias = false;

	if(old.x != this.x || old.y != this.y)
		this.callback(old.x, old.y);
};

/* KudosCursor.down(skip_perm, grid)
 * Attempts to shift the cursor down. */
KudosCursor.prototype.down = function(skip_perm, grid) {
	/* Not gonna comment this - it's just like the first 3 :) */

	var old = {x: this.x, y: this.y};

	if(this.y < 8)
	{
		if(skip_perm)
		{
			var best = this.initBest();

			for(var y = this.y + 1; y < 9; y ++)
			{
				if(this.left_bias)
				{
					for(var x = 0; x < 9; x ++)
						this.updateBest(grid, best, x, y);
				}
				else
				{
					for(var x = 9; x -- > 0;)
						this.updateBest(grid, best, x, y);
				}
			}

			this.x = best.x;
			this.y = best.y;
		}
		else
		{
			this.y ++;
		}
	}

	if(old.x < this.x)
		this.left_bias = true;
	else if(old.x > this.x)
		this.left_bias = false;

	if(old.x != this.x || old.y != this.y)
		this.callback(old.x, old.y);
};
