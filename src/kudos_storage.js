/*
 * kudos_storage.js - Interface to HTML5 localStorage for Kudos
 * Revised 29/08/2015 by sigkill
 * Licensed under MIT-Zero
 */

/* This is implemented as a namespace containing simple functions, rather than a class,
 * because the functions herein operate on a single backend. */

/* Namespace */
KudosStorage = {};

/* localStorage["kudos.current_grid"] represents a serialized version of the current sudoku grid.
 * localStorage["kudos.saved_grids"] represents a serialized version of an array of
 * saved grid states. */

/* First make sure that the relevant values actually exist in localStorage */

if(!localStorage["kudos.current_grid"])
	localStorage["kudos.current_grid"] = (new KudosGrid()).toString();

if(!localStorage["kudos.saved_grids"])
	localStorage["kudos.saved_grids"] = "[]";

/* Making reference to the serialized copy in localStorage for every access doesn't sound smart;
 * cache saved states as an array in the namespace. */
KudosStorage.saved_grids = JSON.parse(localStorage["kudos.saved_grids"]);

/* Callback to be called whenever a grid is saved, loaded, or cleared. No params. */
KudosStorage.callback = function() {};

/* KudosStorage.current_grid
 * get returns a KudosGrid; set accepts a KudosGrid.
 * These are of course stored as strings in localStorage..
 * We use this property to make the currently-displayed grid consistent across sessions. */
Object.defineProperty(KudosStorage, "current_grid", {
    get: function() {
		return KudosGrid.fromString(localStorage["kudos.current_grid"]);
	},

	set: function(g) {
		localStorage["kudos.current_grid"] = g.toString();
	}
});

/* The functions below all invoke the callback */

/* KudosStorage.saveGrid(grid)
 * Tacks a save state onto the current set */
KudosStorage.saveGrid = function(grid) {
	/* Serialize and push */
	KudosStorage.saved_grids.push(grid.toString());

	/* Update backend */
	localStorage["kudos.saved_grids"] = JSON.stringify(KudosStorage.saved_grids);

	KudosStorage.callback();
};

/* KudosStorage.loadSavedGrid() -> KudosGrid
 * Returns the least-recently-saved grid from the set of saved grids,
 * removing it from the set in parallel. We warn the user of this destructive behaviour
 * in the UI. */
KudosStorage.loadSavedGrid = function () {
	/* Return null if there are no saved grids. We're trying for EAFP */
	if(KudosStorage.saved_grids.length <= 0)
		return null;

	/* Deserialize */
	var grid = KudosGrid.fromString(KudosStorage.saved_grids[0]);

	/* Delete */
	KudosStorage.saved_grids.splice(0, 1);

	/* Update backend */
	localStorage["kudos.saved_grids"] = JSON.stringify(KudosStorage.saved_grids);

	KudosStorage.callback();

	return grid;
};

/* KudosStorage.clearSavedGrids()
 * Wipes the set of saved grids */
KudosStorage.clearSavedGrids = function() {
	/* Delete all and upate backend */
	KudosStorage.saved_grids = [];
	localStorage["kudos.saved_grids"] = "[]";

	KudosStorage.callback();
};
