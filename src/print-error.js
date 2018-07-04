const chalk = require('chalk');

exports.printError = (message) => {
  console.error();
  console.error(chalk.default.red(message));
};
