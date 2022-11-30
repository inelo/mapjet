import { AssetLoader } from '../resource-loader.model';
import { ImageAssetLoader } from './image.asset-loader';

export class SVGAssetLoader extends ImageAssetLoader implements AssetLoader {
  protected override readonly image: HTMLImageElement;

  constructor(
    protected override readonly url: string,
    protected override readonly imageName: string,
    {
      width,
      height,
      scale,
      throwOnLoadError,
    }: { width: number; height: number; scale: number; throwOnLoadError?: boolean }
  ) {
    super(url, imageName, throwOnLoadError);
    const newWidth = width / scale;
    const newHeight = height / scale;
    this.image = new Image(newWidth, newHeight);
  }
}
