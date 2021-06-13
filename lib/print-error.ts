import chalk from 'chalk';

export const printError = (message: any) => {
  console.error();
  console.error(chalk.red(message));
};
