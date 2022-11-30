import { LayerSpecification } from 'maplibre-gl';
import { MapJet } from '../../mapjet-core';
import { AssetLoader, Result, SourceLoader } from './resource-loader.model';

export class ResourceLoader {
  private readonly layers: LayerSpecification[] = [];
  private readonly assets: AssetLoader[] = [];
  private readonly sources: SourceLoader[] = [];

  private mapJet?: MapJet;
  private destroyed: boolean = false;

  public attach(mapJet: MapJet) {
    if (this.mapJet) {
      throw new Error('Resource Loader is already attached');
    }
    this.mapJet = mapJet;
  }

  public async load(sources: SourceLoader[], layers: LayerSpecification[], assets: AssetLoader[]): Promise<void> {
    this.throwIfNoAttached();

    const [addedAssetsSuccess, addedAssets, assetsLoadingError] = await this.resolveAssets(assets);

    if (!addedAssetsSuccess) {
      this.removeAssets(addedAssets);
      throw assetsLoadingError;
    }

    if (this.destroyed) {
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

    this.assets.push(...addedAssets);
    this.sources.push(...addedSources);
    this.layers.push(...addedLayers);
  }

  public destroy(): void {
    this.throwIfNoAttached();

    this.destroyed = true;

    this.removeLayers(this.layers);
    this.removeAssets(this.assets);
    this.removeSources(this.sources);
  }

  private async resolveAssets(assets: AssetLoader[]): Promise<Result<AssetLoader[]>> {
    const loadedAssets: AssetLoader[] = [];

    try {
      await Promise.all(
        assets.map(async asset => {
          await asset.load(this.mapJet!.map);
  
          if (!this.destroyed) {
            asset.addToMap(this.mapJet!.map);
            loadedAssets.push(asset)
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

    return [true, addedSources]
  }

  private addLayers(layers: LayerSpecification[]): Result<LayerSpecification[]> {
    const addedLayers: LayerSpecification[] = [];

    try {
      layers.forEach(layer => {
        this.mapJet!.map.addLayer(layer);
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

  private removeLayers(layers: LayerSpecification[]): void {
    layers.forEach(layer => {
      if (this.mapJet!.map.getLayer(layer.id)) {
        this.mapJet!.map.removeLayer(layer.id);
      }
    });
  }
}
