/*
 * kudos_keys.js - convenience functions for creating key handlers
 * Revised 29/08/2015 by sigkill
 * Licensed under MIT-Zero
 */

/* KudosPossiblyHandleKey(event, hotkey, action) -> boolean
 * Possibly handles a key event by stopping propagation, preventDefaulting()ing,
 * and calling the action callback. hotkey is an object specify a key combination,
 * hotkey contains optional booleans ctrl, alt, and shift, indicating whether the
 * action should occur only with these modifiers; hotkey furthermore contains
 * key, either an integer representing a single keycode, or a function mapping
 * keycodes to booleans indicating whether a given key should be handled.
 * Returns true if the key was handled, or false otherwise. */
function KudosPossiblyHandleKey(event, hotkey, action)
{
	/* Check modifiers */
	if(
		event.ctrlKey === !!hotkey.ctrl &&
		event.altKey === !!hotkey.alt &&
		event.shiftKey === !!hotkey.shift
	)
	{
		/* Check that the key matches expectations */
		if(
			(hotkey.key instanceof Function && hotkey.key(event.keyCode)) ||
			(!(hotkey.key instanceof Function) && hotkey.key === event.keyCode)
		)
		{
			/* Handle */
			event.stopPropagation();
			event.preventDefault();
			action(event.keyCode);

			return true;
		}
	}

	return false;
}

/* KudosCreateKeyHandler(handlers) -> (function(e) { ... } -> boolean)
 * Returns a function that applies KudosPossiblyHandleKey to many hotkey/action pairs
 * at once. handlers is an array of objects, where each object contains a hotkey
 * and action callback using the same conventions specified above.
 * The key handler returned by this function will iterate over its hotkey/action pairs
 * and stop if and when a hotkey match is found. If such a match is found, the action
 * will be called and the key handler returns true; otherwise, the handler returns false. */
function KudosCreateKeyHandler(handlers)
{
	/* Event handler */
	return function(event) {
		/* Iterate.
		 * .some terminates when its callback returns false;
		 * .some itself returns a boolean indicating whether early termination happened.
		 * Makes me feel clever. */
		return handlers.some(function(h) {
			return KudosPossiblyHandleKey(event, h.hotkey, h.action);
		});
	};
}
