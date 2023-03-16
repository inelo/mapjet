import { Map, MapOptions, StyleSpecification } from 'maplibre-gl';

import type { MapJet } from './mapjet-core';
import { ResourceLoader } from './utils/resource-loader/resource-loader';

export type MapJetOptions = {
  container: MapOptions['container'];
  style?: StyleSpecification | string;
  mapOptions?: MapOptions;
  internalMapOptions?: InternalMapOptions;
  resizeObserver?: boolean;
  debug?: boolean;
  map?: Map;
};

export type InternalMapOptions = {
  scrollZoomSpeed?: number;
};

export interface MapJetEventsMap {
  pluginAdded: MapJetPlugin;
  pluginRemoved: MapJetPlugin;
  destroy: MapJet;
}

export interface MapJetPlugin {
  readonly id: string;

  onAdd(mapjet: MapJet): void;

  onRemove(mapjet: MapJet): void;
}

export interface MapJetEventablePlugin {
  on(event: string, callback: (...args: any) => void): void;
  off(event: string, callback: (...args: any) => void): void;
}

export interface MapJetResourcesPlugin {
  resourceLoader: ResourceLoader;
}
