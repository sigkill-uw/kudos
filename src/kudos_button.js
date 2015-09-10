/*
 * kudos_button.js - Defines a class representing a DOM button
 * Revised 09/09/2015 by sigkill
 * Licensed under MIT-Zero
 */

/* KudosCreateButtons(container, tooltip_callback, button_descriptors) -> object
 * This is a fairly complicated interface.
 *
 * container is a DOM element into which the button elements will be appended.
 * tooltip_callback is a callback in one parameter, accepting either a string
 * or null, that performs the relevant action when a button tooltip is activated.
 *
 * button_descriptors is an array of objects, where each object has fields
 * text, tooltip, and action, and optionally small, left, hotkey, and handle.
 * text is either a string or a function (w/ no arguments) returning a string,
 * and represents the text of a given button. tooltip is a string and
 * represents the tooltip for a given button. action is a function (w/ no args.)
 * to be called when the button is actuated. small is a boolean indicating
 * that the button should be shown as small; if small is true, then left
 * indicates whether the button should be floated left or right.
 * hotkey represents a key combination that actuates the given button,
 * and is an object containing key and optional shift, alt, and ctrl.
 * The former indicates the key code (or a function mapping key code to boolean),
 * and the latter indicates any key modifiers that must also be present
 * for actuation.
 *
 * This function firstly appends the created buttons into the DOM
 * within container. Furthermore, this function returns an object
 * containing, at minimum, a property hotkeyHandler, a function in one
 * parameter designed to be used as a keydown event.
 * hotkeyHandler actuates the buttons as specified by their respective
 * hotkey properties. Furthermore, the returned object contains references
 * to any buttons specified in button_descriptor that included a handle.
 *
 * See kudos.js for example usage. */
function KudosCreateButtons(container, tooltip_callback, button_descriptors)
{
	/* Return value */
	var result = {};

	/* Array of hotkey handlers to be passed on to KudosCreateKeyHandler */
	var key_handlers = [];

	/* Wrapper associating the hotkey with a simulated click,
	 * rather than the button's real action. Used to fill previous array. */
	var make_handler = function(hotkey, cur_button) {
		return {"hotkey": hotkey, "action": function() { cur_button.simulateClick(); }};
	};

	/* Iterate over button descriptors */
	button_descriptors.forEach(function(bc) {
		/* We append a string specify the hotkey onto the supplied tooltip */
		var hotkey_string = (!bc.hotkey) ? "" : (
			"<br /><b>Hotkey: " +
			((bc.hotkey.ctrl) ? "Ctrl + " : "") +
			((bc.hotkey.alt) ? "Alt + " : "") + 
			((bc.hotkey.shift) ? "Shift + " : "") +
			String.fromCharCode(bc.hotkey.key) +
			"</b>"
		);
		/* The above only works for alphanumeric keys. Not fixing it for this project. */

		/* Create the new button */
		var button = new KudosButton(
			bc.text,
			bc.tooltip + hotkey_string,
			bc.action,
			bc.small,
			bc.left,
			tooltip_callback
		);

		/* If necessary, add to our array of key handlers */
		if(bc.hotkey)
			key_handlers.push(make_handler(bc.hotkey, button));

		/* If necessary, add the button to the return object */
		if(bc.handle)
			result[bc.handle] = button;

		/* Append the button's element to the DOM */
		container.appendChild(button.elem);
	});

	/* Build the key handling function and stick it in the return object */
	result.hotkeyHandler = KudosCreateKeyHandler(key_handlers);

	return result;
}

/* KudosButton(text, tooltip, action, small, left, tooltip_callback)
 * Constructor. Creates a new button object.
 * text is a string or a function in no arguments, used to populate
 * the button's text. tooltip is a string to be displayed as a tooltip.
 * action is a function in no arguments to be called when the button is actuated.
 * small and left indicate whether the button should be small or large,
 * and (if small) whether it should float left or right.
 * tooltip_callback is a function taking one argument that is called
 * with a string with the tooltip is displayed, and with null
 * when the tooltip is hidden.
 * This class bucks the convention I've set elsewhere of taking
 * a container element and attaching itself in its constructor,
 * but I only use it with the above wrapper anyway so I think it's fine. */
function KudosButton(text, tooltip, action, small, left, tooltip_callback)
{
	/* Create the button's DOM element */
	this.elem = document.createElement("div");

	/* Font stuff */
	this.elem.style.fontFamily = KudosCFG.FONT_FAMILY;
	this.elem.style.fontSize = KudosCFG.BUTTON_FONT_SIZE + "px";
	this.elem.style.fontWeight = "bold";
	this.elem.style.textAlign = "center";

	/* border-box is so much simpler */
	this.elem.style.boxSizing = "border-box";

	/* Sizing */
	this.elem.style.width = small ? "47%" : "100%";
	this.elem.style.height = KudosCFG.BUTTON_HEIGHT + "px";

	/* Margin and padding here are kind of magic numbers */
	this.elem.style.border = "none";
	this.elem.style.margin = "0";
	this.elem.style.marginBottom = "10px";
	this.elem.style.padding = "0";
	this.elem.style.paddingTop = "4px";

	/* Don't present the button's text as selectable */
	this.elem.style.cursor = "default";

	/* Don't allow button content to override the button's size */
	this.elem.style.whiteSpace = "nowrap";
	this.elem.style.overflow = "hidden";

	/* Intialize the button coloring to the "unpressed" colors */
	this.unpress();

	/* Make the button focusable, but don't outline on focus */
	this.elem.style.outline = "none";
	this.elem.setAttribute("tabindex", "0");

	/* Small buttons float left or right */
	if(small)
	{
		if(left) this.elem.style.float = "left";
		else this.elem.style.float = "right";
	}

	/* Set initial text and action */
	this.refreshText(text);
	this.action = action;

	var self = this;

	/* Focus and blur on mouseover and mouseout */
	this.elem.onmouseover = HTMLElement.prototype.focus;
	this.elem.onmouseout = HTMLElement.prototype.blur;

	/* Focusing brightens the text and shows the tooltip */
	this.elem.onfocus = function() {
		this.style.color = KudosCFG.BUTTON_FOCUSED_FG_COLOR;
		tooltip_callback(tooltip);
	};

	/* Blurring resets the text and background, and hides the tooltip */
	this.elem.onblur = function() {
		this.style.color = KudosCFG.BUTTON_FG_COLOR;
		this.style.backgroundColor = KudosCFG.BUTTON_BG_COLOR;
		tooltip_callback(null);
	};

	/* Mousedown changes the color scheme to "pressed",
	 * but doesn't trigger the action. */
	this.elem.onmousedown = function(e) {
		/* Don't preventDefault because of weird selection issues */
		self.press();
	};

	/* Mouseup changes the coor scheme to "unpressed",
	 * and triggers the action. */
	this.elem.onmouseup = function(e) {
		e.preventDefault();

		self.unpress();
		self.action();
	};

	/* Simulate a press when the enter key goes down */
	this.elem.onkeydown = function(e) {
		if(e.keyCode == 13)
		{
			e.preventDefault();
			e.stopPropagation();

			self.press();
		}
	};

	/* Simulate an unpress (and trigger the action) when the enter key goes up */
	this.elem.onkeyup = function(e) {
		if(e.keyCode == 13)
		{
			e.preventDefault();
			e.stopPropagation();

			self.unpress();
			self.action();
		}
	};

	/* Same as the above. Touching is equivalent to pressing */
	this.elem.addEventListener("touchstart", function(e) {
		e.preventDefault();

		self.elem.focus();
		self.press();
	});

	/* Ending a touch is equivalent to unpressing */
	this.elem.addEventListener("touchend", function(e) {
		e.preventDefault();

		self.unpress();
		self.action();
	});

	/* For touchleave and touchcancel */
	var f = function(e) {
		e.preventDefault();
		self.elem.blur();
	};

	/* I can't even get this events to trigger in testing,
	 * but just in case. Straying off the button w/ touch
	 * should cancel the press/unpress. */
	this.elem.addEventListener("touchleave", f);
	this.elem.addEventListener("touchcancel", f);
}

/* KudosButton.press()
 * Sets the button color scheme to the "pressed" position */
KudosButton.prototype.press = function() {
	this.elem.style.color = KudosCFG.BUTTON_FOCUSED_FG_COLOR;
	this.elem.style.backgroundColor = KudosCFG.BUTTON_PRESSED_BG_COLOR;
};

/* KudosButton.unpress()
 * Sets the button color scheme to the "unpressed" position,
 * respecting the focused/blurred text color */
KudosButton.prototype.unpress = function() {
	this.elem.style.color = (this.elem === document.activeElement) ?
		KudosCFG.BUTTON_FOCUSED_FG_COLOR :
		KudosCFG.BUTTON_FG_COLOR;

	this.elem.style.backgroundColor = KudosCFG.BUTTON_BG_COLOR;
};

/* KudosButton.simulateClick()
 * Visually simulates a click of the button, and triggers its action. */
KudosButton.prototype.simulateClick = function(e) {
	var self = this;

	/* Press */
	self.press();

	/* 30ms later, unpress and trigger the action */
	setTimeout(function() {
		self.action();
		self.unpress();
	}, 30);		
};

/* KudosButton.refreshText([new_text])
 * Possibly sets the text of the button.
 * Refreshes the button's text. If the current or provided text value
 * is a function, the function is called with no arguments to populate
 * the button; if it is a string, it is used as is. */
KudosButton.prototype.refreshText = function(new_text) {
	/* new_text is optional */
	if(new_text !== undefined) this.text = new_text;

	if(this.text instanceof Function)
		this.elem.innerHTML = this.text();
	else
		this.elem.innerHTML = this.text;
};
