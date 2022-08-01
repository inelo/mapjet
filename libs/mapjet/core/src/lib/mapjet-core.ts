import { Map as MapLibre } from 'maplibre-gl';

import { ContainerResizeObserverPlugin } from './util-plugins/container-resize-observer';
import { Dispatcher } from './utils/dispatcher';
import { Log } from './utils/log';

import type { MapJetEventType, MapJetOptions, MapJetPlugin } from './mapjet-core.model';

export class MapJet {
  public readonly map: MapLibre;

  private readonly plugins = new Map<string, MapJetPlugin>();
  private readonly dispatcher = new Dispatcher();

  constructor(public readonly options: MapJetOptions) {
    if (this.options.debug === true) {
      Log.enable();
    }

    this.map = new MapLibre({
      container: this.options.container,
      style: this.options.style || '',
      dragRotate: false,
      minZoom: 2.5,
      center: [7, 44],
      ...this.options.mapOptions,
    });

    if (this.options.resizeObserver !== false) {
      const resizeObserverPlugin = new ContainerResizeObserverPlugin();
      this.addPlugin(resizeObserverPlugin);
    }

    this.map.scrollZoom.setWheelZoomRate(this.options.internalMapOptions?.scrollZoomSpeed || 1 / 140);
  }

  public addPlugin(plugin: MapJetPlugin) {
    if (this.plugins.has(plugin.id)) {
      throw new Error(`Plugin with id ${plugin.id} already exists`);
    }

    plugin.onAdd(this);
    this.plugins.set(plugin.id, plugin);
    this.dispatch('pluginAdded', plugin);
    Log.info('Added new plugin', plugin);
  }

  public removePlugin(plugin: MapJetPlugin) {
    if (!this.plugins.has(plugin.id)) {
      throw new Error(`Plugin with id ${plugin.id} not exists`);
    }

    plugin.onRemove(this);
    this.plugins.delete(plugin.id);
    this.dispatch('pluginRemoved', plugin);
    Log.info('Removed plugin', plugin);
  }

  public getPlugin<T extends MapJetPlugin>(pluginId: string) {
    return this.plugins.get(pluginId) as T;
  }

  public getPlugins(): MapJetPlugin[] {
    return [...this.plugins.values()];
  }

  public destroy() {
    Array.from(this.plugins.keys()).forEach(pluginId => this.removePlugin(this.plugins.get(pluginId) as MapJetPlugin));
    this.map.remove();
    this.dispatch('destroy', this);
    this.plugins.clear();
  }

  public on(event: MapJetEventType, callback: (...args: any) => void) {
    this.dispatcher.on(event, callback);
  }

  public off(event: MapJetEventType, callback: (...args: any) => void) {
    this.dispatcher.off(event, callback);
  }

  public dispatch(event: MapJetEventType, data) {
    this.dispatcher.fire(event, data);
  }
}
