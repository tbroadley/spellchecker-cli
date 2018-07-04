import chalk from 'chalk';

export const printError = (message) => {
  console.error();
  console.error(chalk.red(message));
};
