SRC = $(shell echo src/*.js) kudos_puzzles.js

.PHONY: all
.PHONY: clean

all: kudos.js kudos.min.js

kudos.min.js: kudos.js
	minify kudos.js

kudos.js: $(SRC)
	cat $(SRC) > kudos.js

kudos_puzzles.js: $(shell echo puzzles/*.list)
	node build_puzzles.js > kudos_puzzles.js

clean:
	rm kudos.js kudos.min.js kudos_puzzles.js
