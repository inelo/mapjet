import { Map, Map as MapLibre } from 'maplibre-gl';

import { MapJet } from './mapjet-core';
import { MapJetOptions, MapJetPlugin, MapJetResourcesPlugin } from './mapjet-core.model';
import { ContainerResizeObserverPlugin } from './util-plugins/container-resize-observer/container-resize-observer.plugin';
import { Log } from './utils/log';
import { ResourceLoader } from './utils/resource-loader/resource-loader';

jest.mock('./util-plugins/container-resize-observer/container-resize-observer.plugin', () => {
  const originalModuleMock: any = jest.genMockFromModule('./util-plugins/container-resize-observer/container-resize-observer.plugin');

  return {
    ...originalModuleMock,
    ContainerResizeObserverPlugin: class ContainerResizeObserverPlugin extends originalModuleMock.ContainerResizeObserverPlugin {
      id = 'containerResizePlugin';
    },
  };
});

jest.mock('./utils/log');
jest.mock('maplibre-gl', () => {
  const originalModuleMock: any = jest.genMockFromModule('maplibre-gl');

  return {
    ...originalModuleMock,
    Map: class FakeMap extends originalModuleMock.Map {
      scrollZoom = { setWheelZoomRate: jest.fn() };
    },
  };
});


const FakePlugin: MapJetPlugin = {
  id: '1234',
  onAdd(_mapjet) {},
  onRemove(_mapjet) {},
};

class FakePluginX implements MapJetPlugin {
  public readonly id = '4567';

  onAdd(_mapjet) {}

  onRemove(_mapjet) {}
}

class FakeResourcePlugin implements MapJetResourcesPlugin {
  public readonly id = '4567';
  public readonly resourceLoader: ResourceLoader = new ResourceLoader();

  onAdd(_mapjet) {}

  onRemove(_mapjet) {}
}

describe('MapJet', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('should create MapLibre with correct default Options', () => {
    const { map } = createCore();

    expect(MapLibre).toHaveBeenCalledWith({
      container: 'test',
      dragRotate: false,
      center: [7, 44],
      minZoom: 2.5,
      style: '',
    });

    expect(map.scrollZoom.setWheelZoomRate).toBeCalledWith(1 / 140);
  });

  it('should create MapLibre with correct provided Options', () => {
    const { map } = createCore({
      internalMapOptions: { scrollZoomSpeed: 2.2 },
      container: 'test',
      mapOptions: { minZoom: 22, style: 'testStyle', container: 'test', center: [2, 2] },
    });

    expect(MapLibre).toHaveBeenCalledWith({
      container: 'test',
      style: 'testStyle',
      dragRotate: false,
      center: [2, 2],
      minZoom: 22,
    });

    expect(map.scrollZoom.setWheelZoomRate).toBeCalledWith(2.2);
  });

  it('should use map from options', () => {
    const mapInstance: Map = new Map({ container: '', style: '' });

    const { map } = createCore({
      map: mapInstance,
    });

    expect(MapLibre).toHaveBeenCalledOnce();
    expect(map).toEqual(mapInstance);
  });

  describe('addPlugin', () => {
    let mapCore: MapJet;

    beforeEach(() => {
      mapCore = createCore();
      jest.resetAllMocks();
    });

    it('should throw error when plugin with same id exists', () => {
      mapCore = createCore({ debug: true });
      const plugin = { ...FakePlugin };

      mapCore.addPlugin(plugin);

      expect(() => mapCore.addPlugin(plugin)).toThrowError(`Plugin with id ${plugin.id} already exists`);
    });

    it('should throw error when provided incorrect plugin id', () => {
      mapCore = createCore({ debug: true });
      const plugin = { ...FakePlugin, id: undefined };

      expect(() => mapCore.addPlugin(plugin)).toThrowError(`Invalid plugin id`);
    });

    it('should call onAdd callback on plugin', () => {
      const plugin = { ...FakePlugin };
      jest.spyOn(plugin, 'onAdd');

      mapCore.addPlugin(plugin);

      expect(plugin.onAdd).toHaveBeenCalledWith(mapCore);
    });

    it('should call attach method on plugin when plugin implements MapJetResourcesPlugin interface', () => {
      const plugin = new FakeResourcePlugin();
      jest.spyOn(plugin.resourceLoader, 'attach');

      mapCore.addPlugin(plugin);

      expect(plugin.resourceLoader.attach).toHaveBeenCalledWith(mapCore);
    });

    it('should dispatch event', done => {
      const plugin = { ...FakePlugin };

      mapCore.on('pluginAdded', data => {
        expect(data).toEqual(plugin);
        done();
      });

      mapCore.addPlugin(plugin);
    });

    it('should log', () => {
      mapCore = createCore({ debug: true });
      const plugin = { ...FakePlugin };

      mapCore.addPlugin(plugin);

      expect(Log.info).toHaveBeenCalledWith('Added new plugin', plugin);
    });

    it('should no register plugin and log message when mapjet destroyed', () => {
      mapCore = createCore({ debug: true });
      const plugin = { ...FakePlugin };

      mapCore.destroy();
      jest.spyOn(plugin, 'onAdd');
      mapCore.addPlugin(plugin);

      expect(Log.info).toHaveBeenCalledWith('Mapjet was destroyed. This operation will have no effect.');
      expect(plugin.onAdd).not.toHaveBeenCalled();
      expect(() => mapCore.addPlugin(plugin)).not.toThrow();
    });
  });

  describe('removePlugin', () => {
    let mapCore: MapJet;

    beforeEach(() => {
      mapCore = createCore();
      jest.resetAllMocks();
    });

    it('should throw error when plugin with id not exists', () => {
      mapCore = createCore({ debug: true });
      const plugin = { ...FakePlugin };

      expect(() => mapCore.removePlugin(plugin)).toThrowError(`Plugin with id ${plugin.id} not exists`);
    });

    it('should throw error when provided incorrect plugin id', () => {
      mapCore = createCore({ debug: true });

      expect(() => mapCore.removePlugin(null)).toThrowError(`Invalid input`);
      expect(() => mapCore.removePlugin(undefined)).toThrowError(`Invalid input`);
    });

    it('should call onRemove callback on plugin', () => {
      const plugin = { ...FakePlugin };
      jest.spyOn(plugin, 'onRemove');

      mapCore.addPlugin(plugin);
      mapCore.removePlugin(plugin);

      expect(plugin.onRemove).toHaveBeenCalledWith(mapCore);
    });

    it('should dispatch event', done => {
      const plugin = { ...FakePlugin };
      mapCore.addPlugin(plugin);

      mapCore.on('pluginRemoved', data => {
        expect(data).toEqual(plugin);
        done();
      });

      mapCore.removePlugin(plugin);
    });

    it('should log', () => {
      mapCore = createCore({ debug: true });
      const plugin = { ...FakePlugin };

      mapCore.addPlugin(plugin);
      mapCore.removePlugin(plugin);

      expect(Log.info).toHaveBeenCalledWith('Removed plugin', plugin);
    });

    it('should no deregister plugin and log message when mapjet destroyed', () => {
      mapCore = createCore({ debug: true });
      const plugin = { ...FakePlugin };

      mapCore.addPlugin(plugin);
      mapCore.destroy();

      jest.spyOn(plugin, 'onRemove');
      mapCore.removePlugin(plugin);

      expect(Log.info).toHaveBeenCalledWith(
        'Mapjet was destroyed, all plugins were removed during this operation. This operation will have no effect.'
      );
      expect(plugin.onRemove).not.toHaveBeenCalled();
      expect(() => mapCore.removePlugin(plugin)).not.toThrow();
    });

    it('should call destroy method on plugin when plugin implements MapJetResourcesPlugin interface', () => {
      const plugin = new FakeResourcePlugin();
      jest.spyOn(plugin.resourceLoader, 'destroy');

      mapCore.addPlugin(plugin);
      mapCore.removePlugin(plugin);

      expect(plugin.resourceLoader.destroy).toHaveBeenCalledWith();
    });
  });

  describe('removePluginIfExists', () => {
    it('should remove plugin and return true when plugin exists', () => {
      const mapCore = createCore({ debug: true });
      const plugin = new FakeResourcePlugin();
      jest.spyOn(plugin.resourceLoader, 'destroy');

      mapCore.addPlugin(plugin);
      const result = mapCore.removePluginIfExists(plugin);

      expect(result).toBeTruthy();
      expect(plugin.resourceLoader.destroy).toHaveBeenCalledWith();
    });

    it('should return false when plugin not exists', () => {
      const mapCore = createCore({ debug: true });
      const plugin = new FakeResourcePlugin();
      jest.spyOn(plugin.resourceLoader, 'destroy');

      const result = mapCore.removePluginIfExists(plugin);

      expect(result).toBeFalse();
    });
  });

  describe('getPlugin()', () => {
    let mapCore: MapJet;

    beforeEach(() => {
      mapCore = createCore();
    });

    it('should return plugin instance when plugin is added', () => {
      const plugin = { ...FakePlugin };
      mapCore.addPlugin(plugin);

      expect(mapCore.getPlugin(plugin.id)).toEqual(plugin);
    });

    it('should return undefined when plugin not exists', () => {
      expect(mapCore.getPlugin('asdf')).toEqual(undefined);
    });
  });

  describe('hasPlugin()', () => {
    let mapCore: MapJet;

    beforeEach(() => {
      mapCore = createCore();
    });

    it('should return true when plugin is added', () => {
      const plugin = { ...FakePlugin };
      mapCore.addPlugin(plugin);

      expect(mapCore.hasPlugin(plugin.id)).toBeTruthy();
      expect(mapCore.hasPlugin(plugin)).toBeTruthy();
    });

    it('should return false when plugin is not added', () => {
      const plugin = { ...FakePlugin };

      expect(mapCore.hasPlugin(plugin.id)).toBeFalsy();
      expect(mapCore.hasPlugin(plugin)).toBeFalsy();
    });
  });


  describe('destroy', () => {
    let mapCore: MapJet;

    beforeEach(() => {
      mapCore = createCore();
    });

    it('should remove map', () => {
      jest.spyOn(mapCore.map, 'remove');
      mapCore.destroy();

      expect(mapCore.map.remove).toHaveBeenCalled();
    });

    it('should destroy all plugins', () => {
      const plugin = { ...FakePlugin };
      const pluginX = new FakePluginX();

      mapCore.addPlugin(plugin);
      mapCore.addPlugin(pluginX);

      jest.spyOn(plugin, 'onRemove');
      jest.spyOn(pluginX, 'onRemove');

      mapCore.destroy();

      expect(plugin.onRemove).toHaveBeenCalledWith(mapCore);
      expect(pluginX.onRemove).toHaveBeenCalledWith(mapCore);
    });

    it('should dispatch event', done => {
      mapCore.on('destroy', () => {
        done();
      });

      mapCore.destroy();
    });

    it('should change state isDestroyed property', () => {
      expect(mapCore.isDestroyed).toEqual(false);

      mapCore.destroy();

      expect(mapCore.isDestroyed).toEqual(true);
    });
  });

  describe('on', () => {
    let mapCore: MapJet;

    beforeEach(() => {
      mapCore = createCore();
    });

    it('should handle event', done => {
      mapCore.on('destroy', () => {
        done();
      });

      mapCore.destroy();
    });
  });

  describe('off', () => {
    let mapCore: MapJet;

    beforeEach(() => {
      mapCore = createCore();
    });

    it('should no handle event', done => {
      const callback = () => {
        done.fail();
      };

      mapCore.on('destroy', callback);
      mapCore.off('destroy', callback);

      mapCore.destroy();
      done();
    });
  });

  describe('options', () => {
    describe('resizeObserver', () => {
      beforeEach(() => {
        (ContainerResizeObserverPlugin as any).mockReset();
      });

      it('when is true/null/undefined/noKey should add resize observer plugin', () => {
        [true, null, undefined, 'noKey'].map(val => {
          new MapJet({
            ...(val !== 'noKey' && { resizeObserver: val as any }),
            container: 'test',
          });
        });

        expect(ContainerResizeObserverPlugin).toHaveBeenCalled();
      });

      it('when is false should no add resize observer plugin', () => {
        new MapJet({
          resizeObserver: false,
          container: 'test',
        });

        expect(ContainerResizeObserverPlugin).not.toHaveBeenCalled();
      });
    });

    describe('debug', () => {
      beforeEach(() => {
        (Log.enable as any).mockReset();
      });

      it('when is true should enable logger', () => {
        new MapJet({
          debug: true,
          container: 'test',
        });

        expect(Log.enable).toHaveBeenCalled();
      });

      it('when is false/null/undefined/noKey should no enable logger', () => {
        [false, null, undefined, 'noKey'].map(val => {
          new MapJet({
            ...(val !== 'noKey' && { debug: val as any }),
            container: 'test',
          });
        });

        expect(Log.enable).not.toHaveBeenCalled();
      });
    });
  });
});

function createCore(opts: Partial<MapJetOptions> = {}) {
  return new MapJet({ container: 'test', ...opts });
}
