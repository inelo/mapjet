import { ImageAssetLoader, MapJet, MapJetPlugin, MapJetResourcesPlugin, ResourceLoader, SVGAssetLoader } from '@inelo/mapjet-core';
import { featureCollection, point } from '@turf/helpers';

export class ExamplePlugin implements MapJetPlugin, MapJetResourcesPlugin {
  public id = 'ExamplePlugin';

  public readonly resourceLoader: ResourceLoader = new ResourceLoader();

  constructor(private ids: number) {}

  public onAdd(mapJet: MapJet): void {
    this.resourceLoader
      .load(
        [{ id: 'point', specification: { type: 'geojson', data: featureCollection([point([11, 11])]) } }],
        [{ addBefore: '', specification: {id: '1', source: 'point', type: 'symbol', layout: { 'icon-image': 'iconxz' }} }],
        [
          new SVGAssetLoader('assets/icon.svg', 'icon', { width: 100, height: 100 }),
          new SVGAssetLoader('assets/iconx.svg', 'iconx', { width: 111, height: 111 }),
          new SVGAssetLoader('assets/icon.svg', 'iconxz', { width: 111, height: 111 }),
        ]
      )
      .then(() => {
        console.log('loaded', this.ids);

        mapJet.layerEventHandler.on('mousemove', '1', console.log)
        this.resourceLoader.unload([], ['1'])
        mapJet.layerEventHandler.off('mousemove', '1', console.log)
      })
      .catch((e) => {
        console.log('terespol', e);
      });

  }

  public onRemove(): void {}
}
