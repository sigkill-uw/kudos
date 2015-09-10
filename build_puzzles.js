var fs = require("fs");
var format = require("util").format;

var output = "";
var flag = false;

for(var d = 1; d <= 5; d ++)
{
	var puzzles = fs.readFileSync(format("puzzles/%d.list", d)).toString().split("\n");

	for(var i = 0; i < puzzles.length; i ++)
	{
		if(puzzles[i])
		{
			output += format("%s\n\t{puzzle: \"%s\", difficulty: %d}",
				flag ? "," : "",
				puzzles[i],
				d
			);

			flag = true;
		}
	}
}

console.log("var KudosGames = [" + output + "\n]");
