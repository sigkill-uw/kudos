/*
 * kudos_grid.js - Specifies a low-level interface to a sudoku grid
 * Revised 30/08/2015 by sigkill
 * Licensed under MIT-Zero
 */

/* The KudosGrid and all its functions operate on the convention that a cell
 * contains a value between -9 and 9. Negative numbers indicate a "permanent" cell,
 * positive numbers a regular cell, and 0 an empty cell. */

/* I've experimented a little bit with the sort of iteration patterns that seem to be
 * idiomatic in Javascript; this class implements a forEach and some that are
 * loosely analgous to their array counterparts. I hope I didn't mess it up. */

/* KudosGrid([matrix])
 * Constructor. Matrix may be omitted, or may be a 9x9 2D array of integers -9 to 9.
 * Instantiates the internal state of the grid. */
function KudosGrid(matrix)
{
	/* Create new, blank matrix if none was provided; otherwise, clone. */
	if(!matrix)
		this.matrix = KudosGrid.createArray(9, 9, 0);
	else
		this.matrix = KudosGrid.cloneArray(matrix);

	/* The count field is used for enumeration and error detection.
	 * count.cols[x][v] represents the number of occurrences of v in column x;
	 * count.rows[y][v] represents the number of occurrences of v in row y;
	 * count.rows[bx][by][v] represents the nubmer of occurences of v in box (bx, by).
	 * NB. v is in absolute value in this context. */
	this.count = {
		cols: KudosGrid.createArray(9, 10, 0),
		rows: KudosGrid.createArray(9, 10, 0),
		boxes: KudosGrid.createArray(3, 3, 10, 0)
	};

	/* The number of filled cells in the grid. We use this to check for completeness. */
	this.n_filled = 0;

	/* Iterate over the grid */
	this.forEach(function(v, x, y) {
		/* Take v in abs */
		v = Math.abs(v);

		/* Update the coutns as appropriate */
		this.count.cols[x][v] ++;
		this.count.rows[y][v] ++;
		this.count.boxes[Math.floor(x / 3)][Math.floor(y / 3)][v] ++;

		/* Fill count */
		if(v !== 0) this.n_filled ++;
	}, this);

	/* A boolean flag indicating whether the grid is in fact complete,
	 * that is to say fully filled with no errors. */
	this.complete = this.checkComplete();
}

/* KudosGrid.poke(x, y, v) -> boolean
 * Updates the value of the cell at (x, y) to v, maintaining internal state.
 * The return value indicates whether the cell was in fact changed.
 * We have -9 <= v <= 9, again obeying the negative-permanent convetion. */
KudosGrid.prototype.poke = function(x, y, v) {
	/* There's no change if the new and old values are equal */
	if(this.get(x, y) !== v)
	{
		/* Indices for the "cluster" in x and y */
		var bx = Math.floor(x / 3);
		var by = Math.floor(y / 3);

		/* Absolute values of new and old values */
		var nv = Math.abs(v);
		var ov = Math.abs(this.get(x, y));

		/* Decrement counts for the old value */
		this.count.cols[x][ov] --;
		this.count.rows[y][ov] --;
		this.count.boxes[bx][by][ov] --;

		/* Increment counts for the new value */
		this.count.cols[x][nv] ++;
		this.count.rows[y][nv] ++;
		this.count.boxes[bx][by][nv] ++;

		/* Update the matrix */
		this.matrix[x][y] = v;

		/* NB. that we can't have ov === nv === 0 */
		if(ov === 0)
			this.n_filled ++;
		else if(nv === 0)
			this.n_filled --;

		/* Maintain completion flag */
		this.complete = this.checkComplete();

		/* Grid was changed; return true */
		return true;
	}
	else return false; /* Grid wasn't changed */
};

/* KudosGrid.get(x, y) -> integer
 * Returns the value of the specified cell. Just a wrapper over the matrix. */
KudosGrid.prototype.get = function(x, y) {
	return this.matrix[x][y];
};

/* KudosGrid.err(x, y) -> booean
 * Returns a flag indicating whether the given cell is "erroneous",
 * that is to say whether it conflicts with another cell in its row/col./box. */
KudosGrid.prototype.err = function(x, y) {
	/* Take value in abs */
	var v = Math.abs(this.get(x, y));

	/* No error if the cell is blank.
	 * Otherwise ensure that it is the only such value in its row/col./box. */
	return v !== 0 && (
		this.count.cols[x][v] > 1 ||
		this.count.rows[y][v] > 1 ||
		this.count.boxes[Math.floor(x / 3)][Math.floor(y / 3)][v] > 1
	);
};

/* KudosGrid.enumerate(x, y) -> array of integers
 * Returns an array of positive integers in asc. order representing
 * the values that "could" fill the cell. For permanent cells,
 * this means the abs of the cell's value. For other cells,
 * this includes any values not already "spoken for" by other cells
 * in the row, column, or box. */
KudosGrid.prototype.enumerate = function(x, y) {
	/* Permanent cell */
	if(this.get(x, y) < 0)
	{
		return [-this.get(x, y)];
	}
	else
	{
		/* Box coords. */
		var bx = Math.floor(x / 3);
		var by = Math.floor(y / 3);

		/* Result */
		var e = [];

		/* For every possibility, */
		for(var v = 1; v <= 9; v ++)
		{
			/* If we're examining the cell's value itself,
			 * it suffices that there are no OTHER cells
			 * in the vicinity with that value. */
			if(v === this.get(x, y))
			{
				if(
					this.count.cols[x][v] === 1 &&
					this.count.rows[y][v] === 1 &&
					this.count.boxes[bx][bx][v] === 1
				)
				{
					e.push(v);
				}
			}
			else
			{
				/* Otherwise, there must be NO cells
				 * in the vicinity with that value. */
				if(
					this.count.cols[x][v] === 0 &&
					this.count.rows[y][v] === 0 &&
					this.count.boxes[bx][by][v] === 0
				)
				{
					e.push(v);
				}
			}
		}

		return e;
	}
};

/* KudosGrid.solve() -> boolean
 * Composes a complete solution of the grid, if it is possible to do so.
 * Returns a flag indicating whether grid was solved. */
KudosGrid.prototype.solve = function() {
	/* Zero any non-permanent cells */
	this.forEach(function(v, x, y, g) {
		if(v > 0) g.poke(x, y, 0);
	});

	/* Check for any erroneous cells */
	var err = this.some(function(v, x, y, g) {
		return g.err(x, y) || g.enumerate(x, y).length === 0;
	});

	/* If there are errors, it's definitely unsolvable */
	if(err) return;

	/* Invoke recursive backtracking solver */
	return this.solveRecursive(0, 0);
};

/* KudosGrid.solveRecursive(x, y) -> boolean
 * Helper function to solve. Recursive backtracking implementation.
 * Returns a flag indicating whether a solution was found. */
KudosGrid.prototype.solveRecursive = function(x, y) {
	/* We advance just by incrementing x, so check if we go to far */
	if(x >= 9)
	{
		x = 0;
		y ++;
	}

	/* If we get to row 9 without problems, we've solved it */
	if(y >= 9)
		return true;

	/* Skip permanent cells */
	if(this.get(x, y) < 0)
	{
		return this.solveRecursive(x + 1, y);
	}
	else
	{
		/* Check if there is some value
		 * for which a recursive solution exists */
		var solved = this.enumerate(x, y).some(function(v) {
				/* Set cell */
				this.poke(x, y, v);

				/* Check for a solution recursively*/
				return this.solveRecursive(x + 1, y);
		}, this);

		if(solved) /* Success */
		{
			return true;
		}
		else /* Failure */
		{
			/* Zero the cell again */
			this.poke(x, y, 0);

			return false;
		}
	}
}

/* KudosGrid.quickFill() -> boolean
 * Fills in any "obvious" grid cells - non-permanent cells
 * for which there clearly is only one possible value.
 * Returns a boolean indicating whether the grid was changed. */
KudosGrid.prototype.quickFill = function() {
	/* Change flag */
	var flag = false;

	/* Clone the grid and then iterate over it.
	 * If we instead manipulated the grid directly,
	 * changes made earlier in the iteration would affect
	 * the later rounds. */
	KudosGrid.cloneFrom(this).forEach(function(v, x, y, g) {
		if(v >= 0) /* Non-permanent? */
		{
			/* Fill in if obvious; update flag */
			var e = g.enumerate(x, y);
			if(e.length === 1)
				flag |= this.poke(x, y, e[0]);
		}
	}, this);

	return flag;
};

/* KudosGrid.checkComplete() -> boolean
 * Determines whether grid is complete (fill and correct).
 * This is also stored as a public flag, with state maintained
 * in the constructor and in poke. In some sense it's probably
 * better design to just use the method instead, but for such a small
 * class I think it's okay to optimize slightly like this. */
KudosGrid.prototype.checkComplete = function() {
	/* A grid is complete if it has 81 filled cells,
	 * and does not have some cell that is erroneous.
	 * This iteration stuff makes me feel clever. */
	return this.n_filled === 81 &&
		!this.some(function(v, x, y, g) {
			return g.err(x, y);
		});
};

/* KudosGrid.forEach(fn, which)
 * Analgous to the builtin array forEach.
 * Iterates over the cells of the grid in row-major order.
 * For each cell, the callback is called as fn(v, x, y, g),
 * specifying the value, coordinates, and grid object.
 * If which is supplied, then fn is called with this === which. */
KudosGrid.prototype.forEach = function(fn, which) {
	for(var y = 0; y < 9; y ++)
		for(var x = 0; x < 9; x ++)
			fn.call(which, this.get(x, y), x, y, this);
};

/* KudosGrid.some(fn, which) -> boolean
 * Analgous to the builtin array some.
 * Iterates over the cells with the same order and interface
 * as forEach, but terminates early if fn returns true.
 * The function itself returns true if fn returned true for
 * any cell, and false otherwise. */
KudosGrid.prototype.some = function(fn, which) {
	for(var y = 0; y < 9; y ++)
		for(var x = 0; x < 9; x ++)
			if(fn.call(which, this.get(x, y), x, y, this))
				return true;

	return false;
};

/* KudosGrid.cloneFrom(from) -> KudosGrid
 * Constructor. Creates a copy of from that shares no
 * references in common with from. */
KudosGrid.cloneFrom = function(from) {
	return new KudosGrid(from.matrix);
};

/* KudosGrid.fromString(string, build) -> KudosGrid
 * Constructor. Creates new KudosGrid based on the serialization provided.
 * build is a boolean. If build is true, then every non-empty cell
 * in the grid will be overridden to permanent; otherwise the sign
 * of each cell will be untouched */
KudosGrid.fromString = function(string, build) {
	var result = new KudosGrid();

	/* Index into the string */
	var i = 0;

	result.forEach(function(n, x, y) {
		/* Value to insert */
		var v;
		if(string[i] == '-') /* Permanent */
		{
			/* The next character is a digit */
			v = -parseInt(string[i + 1]);
			i += 2;
		}
		else v = parseInt(string[i ++]); /* Non-perm */

		result.poke(x, y, build ? -Math.abs(v) : v);
	});

	return result;
};

/* KudosGrid.toString() -> string
 * Serializes the grid. String has length of between 81 and 162.
 * Not really useful for display but deserializable with fromString. */
KudosGrid.prototype.toString = function() {
	var string = "";

	/* Simple. v is either a digit, or a '-' followed by a digit. */
	this.forEach(function(v) {
		string += v;
	});

	return string;			
};

/* KudosGrid.createArray(i, j, k, ..., v) -> array
 * Static. Not really a grid function, but I didn't want it global.
 * Creates a multidimensional array, with dimensions i * j * k * ...;
 * the deepest-nested array's elements are  v. */
KudosGrid.createArray = function() {
	/* If it's one argument, return the value */
	if(arguments.length === 1)
	{
		return arguments[0];
	}
	else
	{
		/* Otherwise build up an array of appropriate length */
		var r = [];

		/* This gets passed along recursively */
		var new_args = Array.prototype.slice.call(arguments, 1);

		/* Fill r with the appropriate number of elements,
		 * each element being the appropriate sub-array. Weird. */
		for(var i = 0; i < arguments[0]; i ++)
			r.push(KudosGrid.createArray.apply(null, new_args));

		return r;
	}
};

/* KudosGrid.cloneArray(v) -> array
 * Again, a static function that isn't really grid-related.
 * I only use this to clone a single matrix, so maybe I should just
 * use a more specific solution, but whatever.
 * Clones a multidimensional array recursively and returns a "deep copy".
 * NB. that the deepest-nested value is copied literally rather than deeply;
 * this is fine for numbers, etc. but not for objects. */
KudosGrid.cloneArray = function(v) {
	/* If it's an array, process recursively; otherwise just return the value. */
	if(v instanceof Array)
	{
		/* Iterate over the sub-arrays and clone them recursively */
		var r = [];
		v.forEach(function(row) {
			r.push(KudosGrid.cloneArray(row));
		});

		return r;
	}
	else return v;
};
