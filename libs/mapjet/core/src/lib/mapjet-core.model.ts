import { MapOptions, StyleSpecification } from 'maplibre-gl';

import type { MapJet } from './mapjet-core';

export type MapJetOptions = {
  container: MapOptions['container'];
  style: StyleSpecification | string;
  mapOptions?: MapOptions;
  internalMapOptions?: InternalMapOptions;
  resizeObserver?: boolean;
  debug?: boolean;
};

export type InternalMapOptions = {
  scrollZoomSpeed?: number;
};

export type MapJetEventType = 'pluginAdded' | 'pluginRemoved' | 'destroy';

export interface MapJetPlugin {
  readonly id: string;

  onAdd(mapjet: MapJet): void;

  onRemove(mapjet: MapJet): void;
}

export interface MapJetEventablePlugin {
  on(event: string, callback: (...args: any) => void): void;

  off(event: string, callback: (...args: any) => void): void;
}
