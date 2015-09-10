# Kudos
An in-browser HTML5 sudoku engine, pre-loaded with puzzles.
Written by Adam `sigkill` Richardson.

## Development
Kudos is written in vanilla Javascript, utilising HTML5 features.
The build process utilises a small node.js script alongside
a simple makefile and the `cat` utility.

## Files
The `src` directory contains the source files for the Kudos game,
alongside a brief README discussing some aspects of the project's
development.

The `puzzles` directory contains several `1.lst`, ..., `5.lst`,
each file containing a set of puzzles corresponding to a given
difficulty level from 1 to 5. This directory is read by
`build_puzzles.js` as part of the build process.

`tst/index.html` is a simple example page demonstrating the
deployment of Kudos. This is an imperfect demonstration
on mobile as no particular attention is payed to viewports.

## Dependencies
Kudos requires node.js, as well as the node.js minifier package,
in order to build. Once built, it can be expected to work in
any modern browser (IE 9+, etc.), and furthermore has
fairly good mobile support.

## Deployment
`make all` will create kudos.js and kudos.min.js in the current
directory. The `Kudos` class defined by either of these files
can be used in an HTML5 document by calling the constructor
with a container element as the parameter; `see tst/index.html`
for an example.

## License
Kudos is licensed under MIT-Zero, reproduced below:
```
The MIT-Zero License

Copyright (c) 2015 Adam `sigkill` Richardson

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
```

Puzzles have been sourced from
[printable-sudoku-puzzles.com/wfiles/](http://printable-sudoku-puzzles.com/wfiles/).
The author of these puzzles and associated services requests that a link
to their website be included alongside; I do so here and in a "splashscreen"
dialog in the software itself.
