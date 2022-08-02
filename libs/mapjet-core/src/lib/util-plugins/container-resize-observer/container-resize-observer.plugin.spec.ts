import { ContainerResizeObserverPlugin } from './container-resize-observer.plugin';
import { mapJetMock } from '../../utils-test/mapjet.mock';

let callbacks = [];

jest.mock('resize-observer-polyfill', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(callback => {
    callbacks.push(callback);

    return {
      observe: jest.fn(),
      unobserve: jest.fn(),
      disconnect() {
        callbacks = [];
      },
    };
  }),
}));

const emitResizeChanges = () => {
  callbacks.forEach(callback => callback());
};

describe('ContainerResizeObserverPlugin', () => {
  describe('onAdd', () => {
    it('should observe container resize', () => {
      const plugin = new ContainerResizeObserverPlugin();
      const mapJet = mapJetMock();

      plugin.onAdd(mapJet);

      jest.spyOn(mapJet.map, 'resize');
      emitResizeChanges();

      expect(mapJet.map.resize).toHaveBeenCalled();
    });
  });

  describe('onRemove', () => {
    it('should disconnect from resize observer', () => {
      const plugin = new ContainerResizeObserverPlugin();
      const mapJet = mapJetMock();

      plugin.onAdd(mapJet);
      plugin.onRemove();

      jest.spyOn(mapJet.map, 'resize');
      emitResizeChanges();

      expect(mapJet.map.resize).not.toHaveBeenCalled();
    });
  });
});
