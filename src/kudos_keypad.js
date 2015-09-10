/*
 * kudos_keypad.js - specifies a function to instantiate an on-screen 1-9 keypad
 * Revised 28/08/2015 by sigkill
 * Licensed under MIT-Zero
 */

/* KudosCreateKeypad(container, callback)
 * Appends a canvas element representing an on-screen 1-to-9 keypad to the given
 * container element. The keypad is actuated via mousedown or touchstart events,
 * and signals interactions via the interface specified by callback.
 * callback is of the form function(n) { ... }, where n is an integer from
 * 0 to 9, 0 representing a "delete" by convention.
 * Within the callback, `this` is undefined.
 * This is implemented as a function rather than as a class because
 * there is no need to manipulate the keypad once instantiated. */
function KudosCreateKeypad(container, callback)
{
	/* Create canvas */
	var canvas = document.createElement("canvas");
	canvas.width = KudosCFG.KEYPAD_WIDTH;
	canvas.height = KudosCFG.KEYPAD_HEIGHT;
	canvas.style.marginBottom = "8px";

	/* Create context. Translate for precise pixels */
	var context = canvas.getContext("2d");
	context.translate(0.5, 0.5);

	/* Centered text, etc. */
	context.strokeStyle = KudosCFG.FG_COLOR;
	context.font = KudosCFG.KEYPAD_FONT;
	context.textAlign = "center";
	context.textBaseline = "middle";

	/* We use KudosTraceRect, so we open a path first */
	context.beginPath();

	/* Keypad is 5 tiles wide and 2 high. Looks like:
	 * 1 2 3 4 5
	 * 6 7 8 9 _ */
	for(var i = 0; i < 5; i ++)
	{
		for(j = 0; j < 2; j ++)
		{
			/* Top left coordinate of this tile */
			var x = i * KudosCFG.KEYPAD_CELL_SIZE;
			var y = j * KudosCFG.KEYPAD_CELL_SIZE;

			/* Same BG color as (half) the sudoku grid */
			context.fillStyle = KudosCFG.CELL_BG_COLORS[1];

			/* We actually draw the cell as 2 pixels smaller than KEYPAD_CELL_SIZE,
			 * but capture input over the full size. Looks and feels okay.
			 * Gaps in the drawing just get rendered as transparent,
			 * so the tiles look separated */

			/* Draw the "inner" background */
			context.fillRect(
				x + 2, y + 2,
				KudosCFG.KEYPAD_CELL_SIZE - 4,
				KudosCFG.KEYPAD_CELL_SIZE - 4
			);

			/* Trace the outline (stroked below the loop) */
			KudosTraceRect(context,
				1 + x, 1 + y,
				KudosCFG.KEYPAD_CELL_SIZE - 2,
				KudosCFG.KEYPAD_CELL_SIZE - 2
			);

			/* No text in the bottom right cell (bottom right is "delete") */
			if(i !== 4 || j !== 1)
			{
				/* Draw the appropriate number. This is centered as specified earlier */
				context.fillStyle = KudosCFG.FG_COLOR;
				context.fillText(
					1 + i + 5 * j,
					x + KudosCFG.KEYPAD_CELL_SIZE / 2,
					y + KudosCFG.KEYPAD_CELL_SIZE / 2
				);
			}
		}
	}

	/* Stroke the cell outlines */
	context.stroke();

	/* For maximum responsiveness, we capture the earliest events -
	 * mousedown and touchstart */

	/* Self-explanatory */
	canvas.onmousedown = function(e) {
		/* Don't preventDefault because of weird selection issues */

		var u, v;

		u = Math.floor(e.offsetX / KudosCFG.KEYPAD_CELL_SIZE);
		v = Math.floor(e.offsetY / KudosCFG.KEYPAD_CELL_SIZE);

		/* Calculate the clicked number. Note the 0 (as opposed to 10) */
		callback((u === 4 && v === 1) ? 0 : 1 + u + 5 * v);
	};

	/* Less self-explanatory */
	canvas.addEventListener("touchstart", function(e) {
		/* Necessary to avoid setting off mouse events */
		e.preventDefault();

		var u, v;

		/* We need to actually calculate the offset position with this event */
		var rect = this.getBoundingClientRect();
		u = Math.floor((e.targetTouches[0].clientX - rect.left) / KudosCFG.KEYPAD_CELL_SIZE);
		v = Math.floor((e.targetTouches[0].clientY - rect.top) / KudosCFG.KEYPAD_CELL_SIZE);

		callback((u === 4 && v === 1) ? 0 : 1 + u + 5 * v);
	});

	/* Stick the finished canvas into the container */
	container.appendChild(canvas);
}
