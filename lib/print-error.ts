import chalk from 'chalk';

export const printError = (message: string): void => {
  console.error();
  console.error(chalk.red(message));
};
