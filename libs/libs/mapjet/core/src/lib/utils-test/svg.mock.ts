import { Map } from 'maplibre-gl';

export function loadSvgMock(map: Map, path: string, name: string, _options: any) {
  return new Promise(resolve => {
    setTimeout(() => {
      map.addImage(name, { path } as any);
      resolve(true);
    }, 240);
  });
}
