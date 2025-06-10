import chalk from 'chalk';

export class Logger {
  success(message: string, ...args: any[]) {
    console.log(chalk.green('✓'), message, ...args);
  }

  info(message: string, ...args: any[]) {
    console.log(chalk.blue('ℹ'), message, ...args);
  }

  warn(message: string, ...args: any[]) {
    console.log(chalk.yellow('⚠'), message, ...args);
  }

  error(message: string, ...args: any[]) {
    console.error(chalk.red('✗'), message, ...args);
  }

  debug(message: string, ...args: any[]) {
    if (process.env.DEBUG) {
      console.log(chalk.gray('🐛'), message, ...args);
    }
  }

  log(message: string, ...args: any[]) {
    console.log(message, ...args);
  }

  title(message: string) {
    console.log(chalk.bold.blue(message));
  }

  subtitle(message: string) {
    console.log(chalk.bold(message));
  }

  divider() {
    console.log(chalk.gray('─'.repeat(50)));
  }

  newLine() {
    console.log();
  }

  table(data: Record<string, any>[]) {
    if (data.length === 0) return;

    const keys = Object.keys(data[0]);
    const maxLengths = keys.map(key => 
      Math.max(key.length, ...data.map(row => String(row[key]).length))
    );

    // Header
    const header = keys.map((key, i) => key.padEnd(maxLengths[i])).join(' | ');
    console.log(chalk.bold(header));
    console.log(keys.map((_, i) => '─'.repeat(maxLengths[i])).join('─┼─'));

    // Rows
    data.forEach(row => {
      const rowStr = keys.map((key, i) => 
        String(row[key]).padEnd(maxLengths[i])
      ).join(' | ');
      console.log(rowStr);
    });
  }

  progress(current: number, total: number, message?: string) {
    const percentage = Math.round((current / total) * 100);
    const filled = Math.round((current / total) * 20);
    const bar = '█'.repeat(filled) + '░'.repeat(20 - filled);
    
    const progressText = `${bar} ${percentage}% (${current}/${total})`;
    const fullMessage = message ? `${message} ${progressText}` : progressText;
    
    process.stdout.write(`\r${fullMessage}`);
    
    if (current === total) {
      console.log(); // New line when complete
    }
  }
}
