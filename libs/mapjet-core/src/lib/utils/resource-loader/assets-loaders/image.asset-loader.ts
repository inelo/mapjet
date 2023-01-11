import { Map, StyleImageMetadata } from 'maplibre-gl';
import { AssetLoader } from '../resource-loader.model';

export class ImageAssetLoader implements AssetLoader {
  protected readonly image: HTMLImageElement;

  constructor(
    protected readonly url: string,
    protected readonly imageName: string,
    protected readonly styleImage: Partial<StyleImageMetadata> = {},
    protected readonly throwOnLoadError: boolean = false,
    protected readonly throwOnAddError: boolean = false
  ) {
    this.image = new Image();
  }

  public load(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.image.onload = () => {
        resolve();
      };

      this.image.onerror = e => {
        if (this.throwOnLoadError) {
          reject();
          return;
        }

        console.warn(`Unable to load image(${this.url}), Empty image set.`);
        this.image.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==';
        resolve();
      };

      this.image.src = this.url;
    });
  }

  public addToMap(map: Map): void {
    map.addImage(this.imageName, this.image, this.styleImage);
  }

  public remove(map: Map): void {
    if (map.hasImage(this.imageName)) {
      map.removeImage(this.imageName);
    }
  }
}
