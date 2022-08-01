import { Log } from './log';

describe('Log', () => {
  const testParams = ['My awesome message object', { foo: 'bar' }];
  let globalConsole;

  beforeAll(() => {
    globalConsole = global.console;
    global.console = <any>{ warn: jest.fn(), info: jest.fn(), log: jest.fn(), error: jest.fn() };
  });

  afterAll(() => {
    global.console = globalConsole;
  });

  it('should be disabled by default', () => {
    Log.info('test');

    expect(console.info).not.toHaveBeenCalled();
  });

  describe('enable()', () => {
    it('should print messages', () => {
      Log.enable();

      Log.info('test');

      expect(console.info).toHaveBeenCalled();
    });
  });

  describe('disable()', () => {
    it('should no print messages', () => {
      Log.enable();
      Log.disable();

      Log.info('test');

      expect(console.info).toHaveBeenCalled();
    });
  });

  describe('message()', () => {
    it('should print by console.log', () => {
      Log.enable();

      Log.message(...testParams);

      expect(console.log).toHaveBeenCalledWith('MapJet[Debug]::', ...testParams);
    });
  });

  describe('warn()', () => {
    it('should print by console.warn', () => {
      Log.enable();

      Log.warn(...testParams);

      expect(console.warn).toHaveBeenCalledWith('MapJet[Debug]::', ...testParams);
    });
  });

  describe('info()', () => {
    it('should print by console.info', () => {
      Log.enable();

      Log.info(...testParams);

      expect(console.info).toHaveBeenCalledWith('MapJet[Debug]::', ...testParams);
    });
  });

  describe('error()', () => {
    it('should print by console.error', () => {
      Log.enable();

      Log.error(...testParams);

      expect(console.error).toHaveBeenCalledWith('MapJet[Debug]::', ...testParams);
    });
  });
});
