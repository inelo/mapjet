import { Map } from 'maplibre-gl';

export function loadSvg(map: Map, path, name, { width, height, scale }) {
  return new Promise((resolve, reject) => {
    const newWidth = width / scale;
    const newHeight = height / scale;

    const img = new Image(newWidth, newHeight);

    img.onload = () => {
      map.addImage(name, img);
      resolve(true);
    };

    img.onerror = e => {
      reject(e);
    };

    img.src = path;
  });
}
