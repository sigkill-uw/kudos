/*
 * kudos_cfg.js - Specifies any and all configurable options and magic numbers.
 * Revised 30/08/2015 by sigkill
 * Licensed under MIT-Zero
 */

/* Unless otherwise specified, size units are in pixels and are expressed in integers.
 * I could simplify the code in certain places by simply specifying sizes as CSS strings,
 * ie. "1337px", "95%", etc., but this project is fairly inflexibly based in pixels
 * rather than any other unit. Next time. */

/* This file uses the C convention of all caps for symbolic constants */

/* NB. Not every value in this file is "configuration" per se;
 * Some are basically magic values that have just been factored out
 * into this central location. */

/* Global-scope config object */
var KudosCFG = {};

/* Foreground color for text, grid lines, etc. */
KudosCFG.FG_COLOR = "#333";

/* Font stack */
KudosCFG.FONT_FAMILY = "Arial, 'Helvetica Neue', Helvetica, sans-serif";

/* Sudoku grid is two-toned */
KudosCFG.CELL_BG_COLORS = ["#ddd", "#fcffff"];

/* The currently-selected cell has a special background color */
KudosCFG.CELL_FOCUSED_BG_COLOR = "#fc3";

/* Text colors for erroneous cells or cells in a completed grid */
KudosCFG.CELL_ERROR_COLOR = "#f00";
KudosCFG.CELL_COMPLETE_COLOR = "#0a0";

/* Size of the cell and of the text therein */
KudosCFG.CELL_SIZE = 50;
KudosCFG.CELL_FONT_SIZE = 45;

/* We need this to actually set context.font */
KudosCFG.CELL_FONT = KudosCFG.CELL_FONT_SIZE + "px " + KudosCFG.FONT_FAMILY;

/* Size of a cluster of 9 cells -
 * 3 cells across and down, but with overlapping borders */
KudosCFG.CELL_CLUSTER_SIZE = 3 * KudosCFG.CELL_SIZE - 2;

/* Position of a given cell by index, along either axis */
KudosCFG.CELL_RELATIVE_POS = function(i) {
	/* b is the "cluster index" */
	var b = Math.floor(i / 3);

	/* Offset within a single cluster */
	i %= 3;

	/* 1 for border at top left,
	 * b different clusters plus the 1px borders between them
	 * i different cells within the cluster, taking into account overlapping borders.
	 * See kudos_grid_canvas.js */
	return 1 + b * (KudosCFG.CELL_CLUSTER_SIZE + 1) + i * (KudosCFG.CELL_SIZE - 1);
};

/* Total canvas size (+ 2 for outer borders) */
KudosCFG.GRID_CANVAS_SIZE = 3 * KudosCFG.CELL_CLUSTER_SIZE + 2 + 2;

/* Cell size and font size for the keypad control */
KudosCFG.KEYPAD_CELL_SIZE = 40;
KudosCFG.KEYPAD_CELL_FONT_SIZE = 33;

/* Keypad font - we need this because we're using canvas rather than DOM */
KudosCFG.KEYPAD_FONT = KudosCFG.KEYPAD_CELL_FONT_SIZE + "px " + KudosCFG.FONT_FAMILY;

/* Size of keypad control. Looks like:
 * 1 2 3 4 5
 * 6 7 8 9 _ */
KudosCFG.KEYPAD_WIDTH = 5 * KudosCFG.KEYPAD_CELL_SIZE;
KudosCFG.KEYPAD_HEIGHT = 2 * KudosCFG.KEYPAD_CELL_SIZE;

/* Size of control dock (keypad, buttons, dialog box) */
KudosCFG.CONTROL_DOCK_WIDTH = KudosCFG.KEYPAD_WIDTH;
KudosCFG.CONTROL_DOCK_HEIGHT = KudosCFG.GRID_CANVAS_SIZE;

/* Overall size of the game container.
 * The grid canvas floats left, the control dock right;
 * we add 20px for a little space between them. */
KudosCFG.CONTAINER_WIDTH = KudosCFG.GRID_CANVAS_SIZE + KudosCFG.CONTROL_DOCK_WIDTH + 20;
KudosCFG.CONTAINER_HEIGHT = KudosCFG.GRID_CANVAS_SIZE;

/* Button color constants */
KudosCFG.BUTTON_FG_COLOR = "#bdc3c7";
KudosCFG.BUTTON_BG_COLOR = "#2c3e50";
KudosCFG.BUTTON_FOCUSED_FG_COLOR = "#fff";
KudosCFG.BUTTON_PRESSED_BG_COLOR = "#2980b9";

/* Button font size */
KudosCFG.BUTTON_FONT_SIZE = 16;

/* Button height - width is always 100% or ~50% */
KudosCFG.BUTTON_HEIGHT = 26;

/* Height of dialog box (width is always 100%)
 * This is a magic number.
 * It just fits the size and number of buttons in the interface. */
KudosCFG.DIALOG_BOX_HEIGHT = 94;

/* Font size stuff for the two dialog box size modes */
KudosCFG.DIALOG_BOX_SMALL_FONT_SIZE = 11;
KudosCFG.DIALOG_BOX_LARGE_FONT_SIZE = 25;
