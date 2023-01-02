import { LayerSpecification, Map, SourceSpecification } from 'maplibre-gl';
import { MapJet } from '../../mapjet-core';
import { mapJetMock } from '../../utils-test/mapjet.mock';
import { ResourceLoader } from './resource-loader';
import { AssetLoader, LayerLoader, SourceLoader } from './resource-loader.model';

class FakeAssetLoader implements AssetLoader {
  public successLoad: () => void;
  public errorLoad: (error?: unknown) => void;

  public async load(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.successLoad = resolve;
      this.errorLoad = reject;
    });
  }

  public addToMap(_map: Map): void {}
  public remove(_map: Map): void {}
}

describe('ResourceLoader', () => {
  describe('attach()', () => {
    test('should throw error when attached', () => {
      const resourceLoader = new ResourceLoader();
      const mapJet = mapJetMock();
      resourceLoader.attach(mapJet);

      expect(() => resourceLoader.attach(mapJet)).toThrowError('Resource Loader is already attached');
    });
  });

  describe('destroy()', () => {
    test('should throw error when no attached', () => {
      const resourceLoader = new ResourceLoader();

      expect(() => resourceLoader.destroy()).toThrowError('Resource Loader no attached');
    });

    test('should remove resources in correct order', async () => {
      const mapJet = mapJetMock();
      const resourceLoader = new ResourceLoader();
      const assetLoader = new FakeAssetLoader();
      const layer: LayerLoader = <LayerLoader>{ specification: { id: '__FAKE_LAYER__' } };
      const source: SourceLoader = <SourceLoader>{ id: '__FAKE_SOURCE__' };

      resourceLoader.attach(mapJet);
      jest.spyOn(mapJet.map, 'getLayer').mockImplementation((_): any => true);
      jest.spyOn(mapJet.map, 'getSource').mockImplementation((_): any => true);
      jest.spyOn(mapJet.map, 'hasImage').mockImplementation((_): any => true);

      jest.spyOn(assetLoader, 'remove').mockImplementation(map => map.removeImage(''));
      jest.spyOn(mapJet.map, 'removeLayer');
      jest.spyOn(mapJet.map, 'removeSource');
      jest.spyOn(mapJet.map, 'removeImage');

      setTimeout(() => {
        assetLoader.successLoad();
      }, 200);

      await resourceLoader.load([source], [layer], [assetLoader]);
      resourceLoader.destroy();

      //@ts-ignore
      expect(mapJet.map.removeImage).toHaveBeenCalledAfter(mapJet.map.removeLayer);
      //@ts-ignore
      expect(mapJet.map.removeLayer).toHaveBeenCalledBefore(mapJet.map.removeSource);
    });
  });

  describe('load()', () => {
    test('should throw error when no attached', async () => {
      const resourceLoader = new ResourceLoader();

      await expect(resourceLoader.load([], [], [])).rejects.toThrow('Resource Loader no attached');
    });

    describe('when attached', () => {
      let resourceLoader: ResourceLoader;
      let mapJet: MapJet;
      let assetLoader: FakeAssetLoader;

      const layer: LayerLoader = <LayerLoader>{ specification: { id: '__FAKE_LAYER__' }, addBefore: 'before_layer' };
      const source: SourceLoader = <SourceLoader>{ id: '__FAKE_SOURCE__' };

      beforeEach(() => {
        mapJet = mapJetMock();
        resourceLoader = new ResourceLoader();
        resourceLoader.attach(mapJet);
        assetLoader = new FakeAssetLoader();

        jest.spyOn(assetLoader, 'load');
        jest.spyOn(assetLoader, 'addToMap');
        jest.spyOn(assetLoader, 'remove');
        jest.spyOn(mapJet.map, 'addLayer');
        jest.spyOn(mapJet.map, 'removeLayer');
        jest.spyOn(mapJet.map, 'getLayer');
        jest.spyOn(mapJet.map, 'addSource');
        jest.spyOn(mapJet.map, 'getSource');
        jest.spyOn(mapJet.map, 'removeSource');
      });

      test('should load assets before add layers and add source before add layers', async () => {
        setTimeout(() => {
          assetLoader.successLoad();
        }, 200);

        await resourceLoader.load([source], [layer], [assetLoader]);
        expect(assetLoader.load).toHaveBeenCalled();
        expect(assetLoader.addToMap).toHaveBeenCalledWith(mapJet.map);
        expect(mapJet.map.addLayer).toHaveBeenCalledWith(layer.specification, 'before_layer');
        //@ts-ignore
        expect(assetLoader.addToMap).toHaveBeenCalledBefore(mapJet.map.addLayer);
        //@ts-ignore
        expect(mapJet.map.addSource).toHaveBeenCalledBefore(mapJet.map.addLayer);
      });

      test('should no add layer and source when asset loading failed', async () => {
        setTimeout(() => {
          assetLoader.errorLoad();
        }, 200);

        await resourceLoader.load([source], [layer], [assetLoader]).catch(() => {});

        expect(assetLoader.load).toHaveBeenCalled();
        expect(assetLoader.addToMap).not.toHaveBeenCalledWith(mapJet.map);
        expect(mapJet.map.addLayer).not.toHaveBeenCalledWith(layer);
        expect(mapJet.map.addSource).not.toHaveBeenCalledWith(layer);
      });

      test('should no add layer when loader destroyed', async () => {
        setTimeout(() => {
          resourceLoader.destroy();
          assetLoader.successLoad();
        }, 200);

        await resourceLoader.load([source], [layer], [assetLoader]).catch(() => {});

        expect(assetLoader.load).toHaveBeenCalled();
        expect(assetLoader.addToMap).not.toHaveBeenCalledWith(mapJet.map);
        expect(mapJet.map.addLayer).not.toHaveBeenCalledWith(layer);
        expect(mapJet.map.addSource).not.toHaveBeenCalledWith(layer);
      });

      test('should unload loaded assets when on of assets is throw error and other is loaded', async () => {
        const errorAssetLoader = new FakeAssetLoader();
        const firstSuccessAssetLoader = new FakeAssetLoader();
        const secondSuccessAssetLoader = new FakeAssetLoader();
        const assets = [firstSuccessAssetLoader, errorAssetLoader, secondSuccessAssetLoader];

        assets.forEach(asset => {
          jest.spyOn(asset, 'load');
          jest.spyOn(asset, 'addToMap');
          jest.spyOn(asset, 'remove');
        });

        setTimeout(() => {
          firstSuccessAssetLoader.successLoad();
          errorAssetLoader.errorLoad(new Error('Asset Load Error'));
          secondSuccessAssetLoader.successLoad();
        }, 200);

        await expect(resourceLoader.load([source], [layer], assets)).rejects.toThrowError('Asset Load Error');

        expect(firstSuccessAssetLoader.addToMap).toHaveBeenCalledWith(mapJet.map);
        expect(firstSuccessAssetLoader.remove).toHaveBeenCalledWith(mapJet.map);

        expect(secondSuccessAssetLoader.addToMap).toHaveBeenCalledWith(mapJet.map);
        expect(secondSuccessAssetLoader.remove).toHaveBeenCalledWith(mapJet.map);

        expect(errorAssetLoader.load).toHaveBeenCalled();
        expect(errorAssetLoader.addToMap).not.toHaveBeenCalled();
        expect(errorAssetLoader.remove).not.toHaveBeenCalled();
      });

      test('should unload loaded assets and added sources when add sources throw error', async () => {
        const throwSource: SourceLoader = { id: 'throw', specification: <SourceSpecification>{} };
        const afterThrowSource: SourceLoader = { id: 'source:123', specification: <SourceSpecification>{} };

        jest.spyOn(mapJet.map, 'addSource').mockImplementation((id, _) => {
          if (id === 'throw') {
            throw new Error('Add Source Error');
          }

          return mapJet.map;
        });

        jest.spyOn(mapJet.map, 'getSource').mockImplementation((_): any => true);

        setTimeout(() => {
          assetLoader.successLoad();
        }, 200);

        await expect(
          resourceLoader.load([source, throwSource, afterThrowSource], [layer], [assetLoader])
        ).rejects.toThrowError('Add Source Error');

        expect(assetLoader.addToMap).toHaveBeenCalledWith(mapJet.map);
        expect(assetLoader.remove).toHaveBeenCalledWith(mapJet.map);

        expect(mapJet.map.addSource).toHaveBeenCalledWith(source.id, source.specification);
        expect(mapJet.map.removeSource).toHaveBeenCalledWith(source.id);

        expect(mapJet.map.addSource).toHaveBeenCalledWith(throwSource.id, throwSource.specification);
        expect(mapJet.map.removeSource).not.toHaveBeenCalledWith(throwSource.id);

        expect(mapJet.map.addSource).not.toHaveBeenCalledWith(afterThrowSource.id, afterThrowSource.specification);
        expect(mapJet.map.removeSource).not.toHaveBeenCalledWith(afterThrowSource.id);
      });

      test('should unload loaded assets, sources and added layers when add layer throw error', async () => {
        const throwLayer: LayerLoader = <LayerLoader>{ specification: { id: 'throw' } };
        const afterThrowLayer: LayerLoader = <LayerLoader>{ specification: { id: 'after_throw_layer' } };

        jest.spyOn(mapJet.map, 'addLayer').mockImplementation(({ id }) => {
          if (id === 'throw') {
            throw new Error('Add Layer Error');
          }

          return mapJet.map;
        });

        jest.spyOn(mapJet.map, 'getLayer').mockImplementation((_): any => true);
        jest.spyOn(mapJet.map, 'getSource').mockImplementation((_): any => true);

        setTimeout(() => {
          assetLoader.successLoad();
        }, 200);

        await expect(
          resourceLoader.load([source], [layer, throwLayer, afterThrowLayer], [assetLoader])
        ).rejects.toThrowError('Add Layer Error');

        expect(assetLoader.addToMap).toHaveBeenCalledWith(mapJet.map);
        expect(assetLoader.remove).toHaveBeenCalledWith(mapJet.map);

        expect(mapJet.map.addSource).toHaveBeenCalledWith(source.id, source.specification);
        expect(mapJet.map.removeSource).toHaveBeenCalledWith(source.id);

        expect(mapJet.map.addLayer).toHaveBeenCalledWith(throwLayer.specification, undefined);
        expect(mapJet.map.removeLayer).not.toHaveBeenCalledWith(throwLayer.specification.id);

        expect(mapJet.map.addLayer).not.toHaveBeenCalledWith(afterThrowLayer.specification, afterThrowLayer);
        expect(mapJet.map.removeLayer).not.toHaveBeenCalledWith(afterThrowLayer.specification.id);
      });
    });
  });
});
