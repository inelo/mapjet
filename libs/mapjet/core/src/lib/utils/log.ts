let enabled = false;

export class Log {
  static logPrefix = 'MapJet[Debug]::';

  static enable() {
    enabled = true;
  }

  static disable() {
    enabled = false;
  }

  static info(...args: any) {
    Log.print(console.info, args);
  }

  static message(...args: any) {
    Log.print(console.log, args);
  }

  static warn(...args: any) {
    Log.print(console.warn, args);
  }

  static error(...args: any) {
    Log.print(console.error, args);
  }

  static print(logHandler, args) {
    if (enabled) logHandler(Log.logPrefix, ...args);
  }
}
