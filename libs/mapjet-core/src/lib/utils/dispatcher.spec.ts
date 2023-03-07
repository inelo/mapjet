import { Dispatcher } from './dispatcher';

describe('Dispatcher', () => {
  describe('on', () => {
    it('should handle to specific event', done => {
      const dispatcher = new Dispatcher<Record<string, any>>();
      const data = 'test';

      dispatcher.on('event', incomingData => {
        expect(incomingData).toEqual(data);
        done();
      });

      dispatcher.fire('event', data);
    });

    it('should no handle to other events', done => {
      const dispatcher = new Dispatcher<Record<string, any>>();
      const data = 'test';

      dispatcher.on('eventZ', () => {
        done.fail();
      });

      dispatcher.fire('eventA', data);
      dispatcher.fire('eventB', data);
      dispatcher.fire('eventC', data);

      done();
    });
  });

  describe('off', () => {
    it('should delete callback from specific event', done => {
      const dispatcher = new Dispatcher<Record<string, any>>();
      const data = 'test';

      const callback = () => {
        done.fail();
      };

      const callback1 = () => {
        done();
      };

      dispatcher.on('event', callback);
      dispatcher.on('event', callback1);

      dispatcher.off('event', callback);

      dispatcher.fire('event', data);
    });
  });
});
