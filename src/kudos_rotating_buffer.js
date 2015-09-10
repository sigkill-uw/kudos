/*
 * kudos_rotating_buffer.js - Defines a class representing a size-limited queue
 * Revised 30/08/2015 by sigkill
 * Licensed under MIT-Zero
 */

/* The rotating buffer is a single-ended LIFO queue that automatically "deletes"
 * sufficiently old states as newer states come in (in fact overwriting them).
 * We use this to implement a size-limited "undo" structure - we can pull out
 * the most-recently-enqueued state easily. */

/* KudosRotatingBuffer(size)
 * Constructor. size specifies the maximum size of the backlog.
 * Any enqeueue operations when the queue is full will overwrite old states. */
function KudosRotatingBuffer(size)
{
	/* Internal queue */
	this.buffer = [];

	/* Index of the next insertion point */
	this.head = 0;

	/* Count of items currently in the queue */
	this.length = 0;

	/* Initialize buffer */
	for(var i = size; i -- > 0;)
		this.buffer.push(null);
}

/* KudosRotatingBuffer.push(item)
 * Pushes an item onto the end of the queue, possibly erasing an older item */
KudosRotatingBuffer.prototype.push = function(item) {
	/* Increase length if appropriate */
	if(this.length < this.buffer.length) this.length ++;

	/* Insert the new item and move the head pointer forward */
	this.buffer[this.head ++] = item;
	if(this.head >= this.buffer.length) this.head = 0;
};

/* KudosRotatingBuffer.pop() -> item
 * Removes and returns the most recently enqueued item from the buffer */
KudosRotatingBuffer.prototype.pop = function() {
	/* Move head backwards and update length */
	this.head --;
	this.length --;
	if(this.head < 0) this.head = this.buffer.length - 1;

	/* Return the relevant item */
	return this.buffer[this.head];
};
