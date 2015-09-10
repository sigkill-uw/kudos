/*
 * kudos_grid_manager_wrapper.js - "Friendly" wrapper around KudosGridManager
 * Revised 31/08/2015 by sigkill
 * Licensed under MIT-Zero
 */

/* KudosGridManagerWrapper(queue_size, callback, [grid])
 * Constructor. A wrapper around KudosGridManager.
 * queue_size represents the maximum size of the undo backlog.
 * callback is a function taking a single boolean argument.
 * callback is invoked every time some aspect of the internal
 * wrapper state changes, and its paramater indicates
 * whether or not the grid itself has been modified.
 * grid represents the initial current grid, and is optional. */
function KudosGridManagerWrapper(queue_size, callback, grid)
{
	this.build_mode = false;
	this.manager = new KudosGridManager(queue_size, grid);
	this.callback = callback;

	var self = this;
	this.cursor = new KudosCursor(function() {
		self.callback();
	});
}

/* The majority of the below functions are simple wrappers around the
 * KudosGridManager object. More comprehensive documentation can
 * be found there. */

/* KudosGridManagerWrapper.poke(value)
 * Possibly changes the value of the cell pointed to by the cursor. */
KudosGridManagerWrapper.prototype.poke = function(value) {
	if(this.build_mode)
	{
		if(this.manager.poke(this.cursor.x, this.cursor.y, -value))
			this.callback(true);
	}
	else
	{
		if(this.manager.current_grid.get(this.cursor.x, this.cursor.y) >= 0)
		{
			if(this.manager.poke(this.cursor.x, this.cursor.y, value))
				this.callback(true);
		}
	}
};

/* KudosGridManagerWrapper.enumerate() -> array
 * Returns an array enumerating the possible values for the
 * cell pointed to by the cursor. */
KudosGridManagerWrapper.prototype.enumerate = function() {
	return this.current_grid.enumerate(this.cursor.x, this.cursor.y);
};

/* KudosGridManagerWrapper.undo()
 * Possibly undoes an action. */
KudosGridManagerWrapper.prototype.undo = function() {
	if(this.manager.undo())
		this.callback(true);
};

/* KudosGridManagerWrapper.redo()
 * Possibly redoes a previously undone action. */
KudosGridManagerWrapper.prototype.redo = function() {
	if(this.manager.redo())
		this.callback(true);
};

/* KudosGridManagerWrapper.insertGrid(grid)
 * Inserts a grid. */
KudosGridManagerWrapper.prototype.insertGrid = function(grid) {
	this.manager.insertGrid(grid);
	this.callback(true);
};

/* KudosGridManagerWrapper.clear()
 * Clears the grid, being mindful of the build mode */
KudosGridManagerWrapper.prototype.clear = function() {
	/* Clear everything if build_mode, otherwie just non perm. */

	if(this.build_mode)
	{
		if(this.manager.clear())
			this.callback(true);
	}
	else
	{
		if(this.manager.clearNonPermanent())
			this.callback(true);
	}
};

/* KudosGridManagerWrapper.solve(mode)
 * Solves the current grid */
KudosGridManagerWrapper.prototype.solve = function() {
	this.manager.solve();
	this.callback(true);
};

/* KudosGridManagerWrapper.setBuildMode(mode)
 * Sets the build mode. */
KudosGridManagerWrapper.prototype.quickFill = function() {
	if(this.manager.quickFill())
		this.callback(true);
};

/* KudosGridManagerWrapper.toggleBuildMode(mode)
 * Toggles the build mode. */
KudosGridManagerWrapper.prototype.toggleBuildMode = function() {
	this.build_mode = !this.build_mode;
	this.callback(false);
};

/* KudosGridManagerWrapper.setBuildMode(mode)
 * Sets the build mode. */
KudosGridManagerWrapper.prototype.setBuildMode = function(mode) {
	this.build_mode = mode;
	this.callback(false);
}

/* The below exposes some properties in a sliiightly more friendly way */

Object.defineProperty(KudosGridManagerWrapper.prototype, "redo_count", {
    get: function() {
		return this.manager.redo_stack.length;
	}
});

Object.defineProperty(KudosGridManagerWrapper.prototype, "undo_count", {
    get: function() {
		return this.manager.undo_buffer.length;
	}
});

Object.defineProperty(KudosGridManagerWrapper.prototype, "current_grid", {
    get: function() {
		return this.manager.current_grid;
	}
});
