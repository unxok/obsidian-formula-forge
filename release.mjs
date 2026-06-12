import { exec } from "child_process";
const args = process.argv.slice(2);

const help = "Usage:\n\n" + "npm run release -- <version>";

if (!args.length) {
	console.error(help);
	process.exit(-1);
}

const version = args[0];

exec(
	`git tag -a ${version} -m "${version}" && git push origin ${version}`,
	(error, stdout, stderr) => {
		if (error) {
			console.error(error.message);
			process.exit(-1);
		}
		if (stderr) {
			console.error(stderr);
			process.exit(-1);
		}
		console.log(stdout);
	}
);
