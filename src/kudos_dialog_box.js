/*
 * kudos_dialog_box.js - Specifies a class representing an on-screen dialog box
 * Revised 29/08/2015 by sigkill
 * Licensed under MIT-Zero
 */

/* The dialog box is capable of two mechanisms - "showing" text and "flashing" text.
 * Shown text is set and cleared by showText and clearText.
 * Flashed text is set by flashText and is cleared automatically after
 * a specified duration. If both shown text and flashed text are currently active,
 * it is the flashed text that is displayed. If neither is active, then the
 * dialog box is rendered as blank. */

/* KudosDialogBox(container)
 * Constructor. Creates a dialog box, appending the corresponding DOM element to the given container. */
function KudosDialogBox(container)
{
	/* Create element */
	this.element = document.createElement("div");

	/* Basic setup */
	this.element.style.boxSizing = "border-box";
	this.element.style.border = "1px solid black";
	this.element.style.margin = 0;
	this.element.style.padding = "10px";

	this.element.style.cursor = "default";

	/* Size */
	this.element.style.width = "100%";
	this.element.style.height = KudosCFG.DIALOG_BOX_HEIGHT + "px";

	/* Some magic. This makes the dialog box appear 1px from the bottom of its parent,
	 * contingent on (container.style.position === "relative"). This is slightly kludgy
	 * and it could arguably be refactored into a better place, but it works and the
	 * application is pretty specific. */
	this.element.style.position = "absolute";
	this.element.style.bottom = "1px";

	/* Font */
	this.element.style.fontFamily = KudosCFG.FONT_FAMILY;

	/* shown_text and flashing_text are strings representing the current text of that class,
	 * or null if no text exists. */
	this.shown_text = null;
	this.flashing_text = null;

	/* We need this to cancel an "unflash" - see flashText */
	this.timeout_handle = null;

	/* Flags indicating whether the text of each class is large or small */
	this.shown_text_large = false;
	this.flashing_text_large = false;

	/* Stick the element onto the container */
	container.appendChild(this.element);
}

/* KudosDialogBox.refresh()
 * The core of the dialog box. Updates the DOM to reflect the internal state of the box. */
KudosDialogBox.prototype.refresh = function() {
	/* Size of text to be displayed */
	var size;

	/* Prioritize flashing text */
	if(this.flashing_text)
	{
		/* Set appropriate size */
		size = (this.flashing_text_large) ?
				KudosCFG.DIALOG_BOX_LARGE_FONT_SIZE :
				KudosCFG.DIALOG_BOX_SMALL_FONT_SIZE;
	}
	else if(this.shown_text)
	{
		/* Ditto */
		size = (this.shown_text_large) ?
				KudosCFG.DIALOG_BOX_LARGE_FONT_SIZE :
				KudosCFG.DIALOG_BOX_SMALL_FONT_SIZE;
	}
	else size = 0; /* Whatever */

	/* Set font size and line height */
	this.element.style.fontSize = size + "px";
	this.element.style.lineHeight = (size + 1) + "px";

	/* Set text, prioritizing flashed over shown and falling back to an empty string */
	this.element.innerHTML = this.flashing_text || this.shown_text || "";
};

/* KudosDialogBox.showText(text, [large = false])
 * Sets the "shown" text to the provided text, erasing any previous shown text.
 * "Shown" text does not expire. Though it is superseded by flashing text,
 * it is only removed completely by clearText() */
KudosDialogBox.prototype.showText = function(text, large) {
	/* EAFP support */
	if(text === null)
	{
		this.clearText();
	}
	else
	{
		/* Set text */
		this.shown_text = text;

		/* Coerce to boolean - allows the argument to be omitted */
		this.shown_text_large = !!large;

		/* Update DOM */
		this.refresh();
	}
};

/* KudosDialogBox.clearText()
 * Clears the "shown" text immediately.
 * NB. that the flashed text remains untouched. */
KudosDialogBox.prototype.clearText = function() {
	this.shown_text = null;
	this.refresh();
};

/* KudosDialogBox.flashText(text, [large = false], [duration = 5000])
 * Sets text to flash for the specified duration, errasing any previously flashed text.
 * Supersedes shown text. Not intended to be cleared.
 * Duration is specified in MS. */
KudosDialogBox.prototype.flashText = function(text, large, duration) {
	/* Default duration of flash */
	duration = duration || 5000;

	/* The timeout handle corresponds to a "clear" of the flash text;
	 * We don't want any "clear" until after the appropriate duration,
	 * so nuke the old handle and make a new one. */
	if(this.timeout_handle !== null)
		clearTimeout(this.timeout_handle);

	/* Set text */
	this.flashing_text = text;

	/* Coerce to boolean for default false value */
	this.flashing_text_large = !!large;

	/* Update DOM */
	this.refresh();

	/* After the appropriate delay, */
	var self = this;
	this.timeout_handle = setTimeout(function() {
		/* Clear the flashing text - NB. we don't touch any "shown" text */
		self.flashing_text = null;
		self.timeout_handle = null;
		self.refresh();
	}, duration);
};
