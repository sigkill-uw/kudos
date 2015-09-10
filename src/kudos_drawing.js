/*
 * kudos_drawing.js - Drawing functions (only one as of this writing)
 * Revised 29/08/2015 by sigkill
 * Licensed under MIT-Zero
 */

/* KudosTraceRect(context, x, y, width, height)
 * The built-in canvas function context.strokeRect does not seem
 * well-defined, in the sense that I can't discern from the docs
 * whether width and height include the border of the stroked rect.
 * My testing didn't seem to show a sane convention.
 * There's probably a definite standard and a definite explanation
 * for the weird behaviour I observed, but it was simpler to just 
 * implement this function. It traces the outline of a rectangle
 * given a top-left corner and the width and height. The stroked figure
 * matches the given sizes, including its borders.
 * NB. this function does not call context.stroke(). */
function KudosTraceRect(context, x, y, width, height)
{
	context.moveTo(x, y);
	context.lineTo(x + width - 1, y);
	context.lineTo(x + width - 1, y + height - 1);
	context.lineTo(x, y + height - 1);
	context.lineTo(x, y);
}
