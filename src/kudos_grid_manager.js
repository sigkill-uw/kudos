/*
 * kudos_grid_manager.js - manages grid states alongside undo/redo functionality
 * Revised 31/08/2015 by sigkill
 * Licensed under MIT-Zero
 */

/* This class provides an interface similar to KudosGrid for modifying grids,
 * but caches a backlog of navigable previous states. */

/* NB. that, like in most text editors and word processors, if a modification
 * to the current state is made when the redo stack is non-empty,
 * the redo stack will be cleared. */

/* KudosGridManager(queue_size, [grid])
 * Creates a new manager capable of holding queue_size undo/redo states.
 * Optionally takes an initial grid, otherwise defaults to blank. */
function KudosGridManager(queue_size, grid)
{
	/* Current grid */
	this.current_grid = (grid) ? grid : new KudosGrid();

	/* Size-limited stack structure for undos */
	this.undo_buffer = new KudosRotatingBuffer(queue_size);

	/* Stack for redos */
	this.redo_stack = [];
}

/* KudosGridManager.poke(x, y, value) -> boolean
 * Changes the value of a given cell, caching the old state.
 * Returns true if the grid is actually modified, and false otherwise. */
KudosGridManager.prototype.poke = function(x, y, value) {
	/* Clone grid */
	var grid = KudosGrid.cloneFrom(this.current_grid);

	/* Try update */
	if(grid.poke(x, y, value))
	{
		/* Upate successful - insert new state, caching the old one */
		this.insertGrid(grid);
		return true;
	}
	else return false;
};

/* KudosGridManager.undo() -> boolean
 * Shifts back to the previous state, if it is possible to do so.
 * Returns true if the state changed, and false otherwise. */
KudosGridManager.prototype.undo = function() {
	if(this.undo_buffer.length <= 0) return false;

	/* Push the current state onto the redo stack */
	this.redo_stack.push(this.current_grid);

	/* Fetch the previous state */
	this.current_grid = this.undo_buffer.pop();

	return true;
};

/* KudosGridManager.redo() -> boolean
 * Shits forward to the next state, if it is possible to do so.
 * Returns true if the state changed, and false otherwise. */
KudosGridManager.prototype.redo = function() {
	if(this.redo_stack.length <= 0) return false;

	/* Analgous to undo */
	this.undo_buffer.push(this.current_grid);
	this.current_grid = this.redo_stack.pop();

	return true;
};

/* KudosGridManager.insertGrid(grid)
 * Inserts a grid into the stream. */
KudosGridManager.prototype.insertGrid = function(grid) {
	this.redo_stack = [];
	this.undo_buffer.push(this.current_grid);
	this.current_grid = grid;
};

/* KudosGridManager.clear()
 * Inserts a blank grid, if the current grid is not blank.
 * Returns a flag indicating whether the state changed. */
KudosGridManager.prototype.clear = function() {
	/* Insert if blank */
	if(this.current_grid.n_filled !== 0)
	{
		this.insertGrid(new KudosGrid());
		return true;
	}
	else return false;
};

/* KudosGridManager.clearNonPermanent()
 * Clears any non-permanent cells in the current grid.
 * If there are none, no change is made.
 * Returns a flag indicating whether the state changed. */
KudosGridManager.prototype.clearNonPermanent = function () {
	/* Clone */
	var grid = KudosGrid.cloneFrom(this.current_grid);

	var flag = false;

	/* Iterate */
	grid.forEach(function(v, x, y, g) {
		if(v > 0) /* Non-empty, non-permanent cells must be blanked */
		{
			flag = true;
			g.poke(x, y, 0);
		}
	});

	/* If there was a change, insert the grid */
	if(flag)
		this.insertGrid(grid);

	return flag;
};

/* KudosGridManager.solve() -> boolean
 * Solves the current grid if it is possible to do so,
 * returning a flag indicating whether the grid was solved. */
KudosGridManager.prototype.solve = function() {
	var grid = KudosGrid.cloneFrom(this.current_grid);
	if(grid.solve())
	{
		this.insertGrid(grid);
		return true;
	}
	else return false;
};

/* KudosGridManager.quickFill() -> boolean
 * Fills in any obvious cells in the grid,
 * returning true if the grid changed and false otherwise. */
KudosGridManager.prototype.quickFill = function() {
	var grid = KudosGrid.cloneFrom(this.current_grid);
	if(grid.quickFill())
	{
		this.insertGrid(grid);
		return true;
	}
	else return false;
};
