import { Map, StyleImageMetadata } from 'maplibre-gl';
import { AssetLoader } from '../resource-loader.model';
import { ImageAssetLoader } from './image.asset-loader';

export class SVGAssetLoader extends ImageAssetLoader implements AssetLoader {
  protected override readonly image: HTMLImageElement;
  private readonly scale: number;

  constructor(
    protected override readonly url: string,
    protected override readonly imageName: string,
    {
      width,
      height,
      throwOnLoadError,
    }: { width: number; height: number; throwOnLoadError?: boolean },
    protected override readonly styleImage: Partial<StyleImageMetadata> = {},
  ) {
    super(url, imageName, styleImage, throwOnLoadError);
    this.scale = styleImage?.pixelRatio || window.devicePixelRatio;
    const newWidth = width * this.scale;
    const newHeight = height * this.scale;
    this.image = new Image(newWidth, newHeight);
  }

  public override addToMap(map: Map): void {
    map.addImage(this.imageName, this.image, { pixelRatio: this.scale, ...this.styleImage });
  }
}
