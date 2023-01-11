import { LayerSpecification, Source } from 'maplibre-gl';
import { MapJet } from '../../mapjet-core';
import { AssetLoader, LayerLoader, Result, SourceLoader } from './resource-loader.model';

export class ResourceLoader {
  private readonly layers: Map<string, LayerLoader> = new Map();
  private readonly assets: Map<string, AssetLoader> = new Map();
  private readonly sources: Map<string, SourceLoader> = new Map();

  private mapJet?: MapJet;
  private destroyed: boolean = false;

  public attach(mapJet: MapJet) {
    if (this.mapJet) {
      throw new Error('Resource Loader is already attached');
    }

    this.mapJet = mapJet;
  }

  public async load(sources: SourceLoader[], layers: LayerLoader[] = [], assets: AssetLoader[] = []): Promise<void> {
    this.throwIfNoAttached();

    const [addedAssetsSuccess, addedAssets, assetsLoadingError] = await this.resolveAssets(assets);

    if (!addedAssetsSuccess) {
      this.removeAssets(addedAssets);
      throw assetsLoadingError;
    }

    if (this.destroyed) {
      this.removeAssets(addedAssets);
      throw new Error('Destroyed');
    }

    const [addSourceSuccess, addedSources, addedSourcesError] = this.addSources(sources);

    if (!addSourceSuccess) {
      this.removeAssets(addedAssets);
      this.removeSources(addedSources);

      throw addedSourcesError;
    }

    const [addLayersSuccess, addedLayers, addedLayersError] = this.addLayers(layers);

    if (!addLayersSuccess) {
      this.removeLayers(addedLayers);
      this.removeAssets(addedAssets);
      this.removeSources(addedSources);

      throw addedLayersError;
    }

    addedAssets.forEach(asset => this.assets.set(asset.id, asset));
    addedSources.forEach(source => this.sources.set(source.id, source));
    addedLayers.forEach(layer => this.layers.set(layer.specification.id, layer));
  }

  public unload(
    sources: SourceLoader[] | SourceLoader['id'][],
    layers: LayerLoader[] | LayerLoader['specification']['id'][] = [],
    assets: AssetLoader[] | AssetLoader['id'][] = []
  ): void {
    this.throwIfNoAttached();

    layers.forEach((layerDef: LayerLoader | LayerLoader['specification']['id']) => {
      const layerId = layerDef instanceof Object ? layerDef.specification.id : layerDef;

      if (this.layers.has(layerId)) {
        const layer: LayerLoader = this.layers.get(layerId)!;

        this.removeLayers([layer]);
        this.assets.delete(layer.specification.id);
      }
    });

    assets.forEach((assetDef: AssetLoader | string) => {
      const assetId = assetDef instanceof Object ? assetDef.id : assetDef;

      if (this.assets.has(assetId)) {
        const asset: AssetLoader = this.assets.get(assetId)!;

        this.removeAssets([asset]);
        this.assets.delete(asset.id);
      }
    });

    sources.forEach((source: SourceLoader | SourceLoader['id']) => {
      const sourceId = source instanceof Object ? source.id : source;

      if (this.sources.has(sourceId)) {
        const source: SourceLoader = this.sources.get(sourceId)!;

        this.removeSources([source]);
        this.sources.delete(source.id);
      }
    });
  }

  public destroy(): void {
    this.throwIfNoAttached();

    this.destroyed = true;

    this.removeLayers(Array.from(this.layers.values()));
    this.removeAssets(Array.from(this.assets.values()));
    this.removeSources(Array.from(this.sources.values()));
  }

  private async resolveAssets(assets: AssetLoader[]): Promise<Result<AssetLoader[]>> {
    const loadedAssets: AssetLoader[] = [];

    try {
      await Promise.all(
        assets.map(async asset => {
          await asset.load(this.mapJet!.map);

          if (!this.destroyed) {
            asset.addToMap(this.mapJet!.map);
            loadedAssets.push(asset);
          }
        })
      );
    } catch (error: unknown) {
      return [false, loadedAssets, error];
    }

    return [true, loadedAssets];
  }

  private addSources(sources: SourceLoader[]): Result<SourceLoader[]> {
    const addedSources: SourceLoader[] = [];

    try {
      sources.forEach(source => {
        this.mapJet!.map.addSource(source.id, source.specification);
        addedSources.push(source);
      });
    } catch (error) {
      return [false, addedSources, error];
    }

    return [true, addedSources];
  }

  private addLayers(layers: LayerLoader[]): Result<LayerLoader[]> {
    const addedLayers: LayerLoader[] = [];

    try {
      layers.forEach(layer => {
        this.mapJet!.map.addLayer(layer.specification, layer.addBefore);
        addedLayers.push(layer);
      });
    } catch (error: unknown) {
      return [false, addedLayers, error];
    }

    return [true, addedLayers];
  }

  private throwIfNoAttached() {
    if (!this.mapJet) {
      throw new Error('Resource Loader no attached');
    }
  }

  private removeSources(sources: SourceLoader[]): void {
    sources.forEach(source => {
      if (this.mapJet!.map.getSource(source.id)) {
        this.mapJet!.map.removeSource(source.id);
      }
    });
  }

  private removeAssets(assets: AssetLoader[]): void {
    assets.forEach(asset => asset.remove(this.mapJet!.map));
  }

  private removeLayers(layers: LayerLoader[]): void {
    layers.forEach(layer => {
      if (this.mapJet!.map.getLayer(layer.specification.id)) {
        this.mapJet!.map.removeLayer(layer.specification.id);
      }
    });
  }
}
