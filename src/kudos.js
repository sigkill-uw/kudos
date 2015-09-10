/*
 * kudos.js - entry point for Kudos. UI and initialization.
 * Revised 09/09/2015 by sigkill
 * Licensed under MIT-Zero
 */

/* Kudos(parent_tag)
 * Constructor. Initializes the Kudos game engine and appends
 * its container element to the given parent tag. */
function Kudos(parent_tag)
{
	var self = this;

	this.g_manager = new KudosGridManagerWrapper(
		99, /* Undo backlog size */

		/* Callback */
		function(grid_changed) {
			/* Refresh a few buttons */
			self.buttons.build_toggle.refreshText();
			self.buttons.undo.refreshText();
			self.buttons.redo.refreshText();

			/* Re-render the grid with a possibly-changed cursor */
			self.grid_canvas.renderGrid(
				self.g_manager.current_grid,
				self.g_manager.cursor
			);

			/* If the grid has been updated and is now complete, */
			if(grid_changed && self.g_manager.current_grid.complete)
				self.dialog_box.flashText("<b>Complete!</b>", true); /* Flash cute message */

			/* Update our persistent storage */
			KudosStorage.current_grid = self.g_manager.current_grid;
		},

		/* Initial grid */
		KudosStorage.current_grid
	);

	/* Create container */
	var container = document.createElement("div");

	/* Create an associated canvas */
	this.grid_canvas = new KudosGridCanvas(
		container,
		function(x, y) {
			self.g_manager.cursor.set(x, y);
		}
	);

	/* Initialize the control dock */
	this.initializeControls(container);

	/* More initialization for the container... */

	/* Vertically centered */
	container.style.display = "block";
	container.style.marginLeft = "auto";
	container.style.marginRight = "auto";

	/* Size */
	container.style.width = KudosCFG.CONTAINER_WIDTH + "px";
	container.style.height = KudosCFG.CONTAINER_HEIGHT + "px";

	/* We need a tabindex so the element is focusable, but we don't want the outline. */
	container.style.outline = "none";
	container.setAttribute("tabindex", "0");

	/* We use two different key handlers - one for hotkeyed buttons, and a more general one.
	 * Let them both try to handle it. */
	container.onkeydown = function(e) { self.buttons.hotkeyHandler(e) || self.keyHandler(e); };

	/* No select or context menu from within the app.
	 * This maaaybe should also be applied to individual elements, but I'll save that
	 * for the next project. Modularity isn't perfect but I like the KISS rule. */
	container.onselectstart = function (e) { e.preventDefault(); return false; };
	container.oncontextmenu = function(e) { e.preventDefault(); return false; };

	/* Listen for mouseover in the bubbling stage rather than in propagation.
	 * This lets the buttons receive focus on mouseover,
	 * but returns focus to the container on mouseout. */
	container.addEventListener("mouseover", function() { this.focus(); }, true);

	/* Storage callback. We display storage stats on this button, so refresh it. */
	KudosStorage.callback = self.buttons.load.refreshText.bind(self.buttons.load);

	/* Create a general key handler */
	this.keyHandler = KudosCreateKeyHandler([
		{
			/* Left arrow key - arrow keys move the cursor */
			hotkey: {key: 37},
			action: function() {
				self.g_manager.cursor.left(!self.g_manager.build_mode, self.g_manager.current_grid);
			}
		},

		{
			/* Up arrow key */
			hotkey: {key: 38},
			action: function() {
				self.g_manager.cursor.up(!self.g_manager.build_mode, self.g_manager.current_grid);
			}
		},

		{
			/* Right arrow key */
			hotkey: {key: 39},
			action: function() {
				self.g_manager.cursor.right(!self.g_manager.build_mode, self.g_manager.current_grid);
			}
		},

		{
			/* Down arrow key */
			hotkey: {key: 40},
			action: function() {
				self.g_manager.cursor.down(!self.g_manager.build_mode, self.g_manager.current_grid);
			}
		},

		{
			/* Backspace or delete - clears the current cell */
			hotkey: {key: function(key) { return (key == 8 || key == 46); }},
			action: function() {
				self.g_manager.poke(0);
			}
		},

		{
			/* Numbers - sets the current cell */
			hotkey: {key: function(key) { return (49 <= key && key <= 57); }},
			action: function(key) {
				self.g_manager.poke(key - 48);
			}
		},

		{
			/* Numpad numbers - also sets the current cell */
			hotkey: {key: function(key) { return (97 <= key && key <= 105); }},
			action: function(key) {
				self.g_manager.poke(key - 96);
			}
		}
	]);

	/* Call the grid manager callback, just to get everything rendered. */
	this.g_manager.callback(false);

	/* Splash dialog to credit author of puzzles */
	this.dialog_box.flashText(
		"Puzzles in this build of Kudos are sourced from " +
		"<a href=\"http://printable-sudoku-puzzles.com/wfiles/\" " +
		"target=\"_blank\">" +
		"Free Printable Sudoku Puzzles</a>.",
		false,
		10000
	);

	/* Append the container and focus it */
	parent_tag.appendChild(container);
	container.focus();
};

/* Kudos.initializeControls(container)
 * Helper. Initializes the control dock and appends it to the container. */
Kudos.prototype.initializeControls = function(container) {
	/* Element */
	var dock = document.createElement("div");

	/* Float it to the right of the canvas */
	dock.style.float = "right";

	/* Hack to allow the dialog box to be 1px off the bottom */
	dock.style.position = "relative";

	/* Sizing */
	dock.style.width = KudosCFG.CONTROL_DOCK_WIDTH + "px";
	dock.style.height = KudosCFG.CONTROL_DOCK_HEIGHT + "px";

	var self = this;

	/* Create the keybad */
	KudosCreateKeypad(dock, function(v) {
		self.g_manager.poke(v);
	});

	/* Create the dialog box */
	this.dialog_box = new KudosDialogBox(dock);

	/* Create the buttons. Hopefully these are self-explanatory */
	this.buttons = KudosCreateButtons(
		dock, /* Parent - the dock */
		self.dialog_box.showText.bind(self.dialog_box), /* Show tooltips on the dialog box */
		[
			{
				handle: "build_toggle",
				text: function() {
					return "Toggle Build Mode [" + (self.g_manager.build_mode ? "ON" : "OFF") + "]";
				},
				tooltip:
						"Build mode allows you to place 'permanent' cells; " +
						"As in real-world sudoku, these cells cannot be altered with build mode off, " +
						"allowing you to construct your own puzzle.",
				action: function() {
					self.g_manager.toggleBuildMode();
				},
				hotkey: {"ctrl": true, "key": "B".charCodeAt(0)}
			},

			{
				text: "Quick Play",
				tooltip:
						"Loads a random pre-built puzzle of random difficulty " +
						"for you to solve.",
				small: true,
				left: true,
				action: function() {
					/* Load game, insert it, flash difficulty message */

					var game = KudosGames[Math.floor(Math.random() * KudosGames.length)];

					self.g_manager.insertGrid(KudosGrid.fromString(game.puzzle, true));
					self.g_manager.setBuildMode(false);
					self.dialog_box.flashText(
						"<b>Difficulty: " +
						(
							(game.difficulty === 1) ? "*" :
							(game.difficulty === 2) ? "**" :
							(game.difficulty === 3) ? "***" :
							(game.difficulty === 4) ? "****" :
							(game.difficulty === 5) ? "*****" : null
						) +
						"</b>", true);
				},
				hotkey: {"ctrl": true, "key": "Q".charCodeAt(0)}
			},

			{
				text: "Clear Grid",
				tooltip:
					"In build mode, clears the grid to blank in its entirety; " +
					"Outside of build mode, clears all non-permanent cells.",
				small: true,
				left: false,
				action: function() {
					self.g_manager.clear(); /* With build mode off, only clears non-perm. cells */
				},
				hotkey: {"ctrl": true, "key": "C".charCodeAt(0)}
			},

			{
				text: "Save",
				tooltip:
					"Saves the current grid state to internally such that it can be accessed later. " +
					"Too many saved states may be hard to manage; be judicious.",
				small: true,
				left: true,
				action: function() {
					KudosStorage.saveGrid(self.g_manager.current_grid);
				},
				hotkey: {"ctrl": true, "key": "S".charCodeAt(0)}
			},

			{
				handle: "load",
				text: function() {
					return "Load [" + KudosStorage.saved_grids.length + "]";
				},
				tooltip:
					"Loads the least-recently saved grid state, removing it from the set of saved states." +
					"Use with caution and be sure to re-save any loaded states that you want to keep.",
				small: true,
				left: false,
				action: function() {
					self.g_manager.insertGrid(KudosStorage.loadSavedGrid());
				},
				hotkey: {"ctrl": true, "key": "L".charCodeAt(0)}
			},

			{
				text: "Clear Saved States",
				tooltip: "Clears all saved grid states.",
				action: function() {
					KudosStorage.clearSavedGrids();
				},
				hotkey: {"ctrl": true, "key": "D".charCodeAt(0)}
			},

			{
				handle: "undo",
				text: function() {
					return "Undo [" + self.g_manager.undo_count + "]";
				},
				tooltip: "Un-does the last change made to the grid.",
				small: true,
				left: true,
				action: function() {
					self.g_manager.undo();
				},
				hotkey: {"ctrl": true, "key": "Z".charCodeAt(0)}
			},

			{
				handle: "redo",
				text: function() {
					return "Redo [" + self.g_manager.redo_count + "]";
				},
				tooltip: "Re-does a previously-undone action.",
				small: true,
				left: false,
				action: function() {
					self.g_manager.redo();
				},
				hotkey: {"ctrl": true, "key": "Y".charCodeAt(0)}
			},

			{
				text: "Solve",
				tooltip: "Fills the grid in in its entirety, if it is possible to do so.",
				small: true,
				left: true,
				action: function() {
					self.g_manager.solve();
				},
				hotkey: {"ctrl": true, "key": "G".charCodeAt(0)}
			},

			{
				text: "Quick Fill",
				tooltip:
					"Fills in any \"obvious\" cells in the grid - " +
					"those cells for which there is only one possible value.",
				small: true,
				left: false,
				action: function() {
					self.g_manager.quickFill();
				},
				hotkey: {"ctrl": true, "key": "F".charCodeAt(0)}
			},

			{
				text: "Enumerate",
				tooltip: "Indicates the possible values for the currently-selected cell.",
				small: true,
				left: true,
				action: function() {
					var e = self.g_manager.enumerate();

					var string;
					if(e.length === 0)
					{
						string = "None";
					}
					else
					{
						string = "";
						e.forEach(function(v, i) {
							string += (i > 0 ? (i == 5 ? "<br />" : " ") : "") + v;
						});
					}

					self.dialog_box.flashText("<b>" + string + "</b>", true);
				},
				hotkey: {"ctrl": true, "key": "E".charCodeAt(0)}
			},

			{
				text: "Github",
				tooltip:
					"This project is free and open source; view its source code, " +
					"documentation, acknowledgements, and license on Github.",
				small: true,
				left: false,
				action: function() {
					window.open("https://github.com/sigkill-rcode/kudos");
				}
			}
		]
	);

	container.appendChild(dock);
};
