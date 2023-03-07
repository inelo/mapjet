import { Map as MapLibre } from 'maplibre-gl';

import { ContainerResizeObserverPlugin } from './util-plugins/container-resize-observer';
import { Dispatcher } from './utils/dispatcher';
import { Log } from './utils/log';

import type { MapJetEventsMap, MapJetOptions, MapJetPlugin, MapJetResourcesPlugin } from './mapjet-core.model';
import { LayerEventHandler } from './utils/layer-event-handler';

export class MapJet {
  public readonly map: MapLibre;
  public readonly layerEventHandler: LayerEventHandler;

  public get isDestroyed(): boolean {
    return this.destroyed;
  }

  private destroyed: boolean = false;

  private readonly plugins = new Map<string, MapJetPlugin>();
  private readonly dispatcher: Dispatcher<MapJetEventsMap> = new Dispatcher();

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

    this.layerEventHandler = new LayerEventHandler(this.map);
    this.map.scrollZoom.setWheelZoomRate(this.options.internalMapOptions?.scrollZoomSpeed || 1 / 140);
  }

  public addPlugin(plugin: MapJetPlugin) {
    if (this.destroyed) {
      Log.info('Mapjet was destroyed. This operation will have no effect.');
      return;
    }

    if (this.plugins.has(plugin.id)) {
      throw new Error(`Plugin with id ${plugin.id} already exists`);
    }

    if (isResourcePlugin(plugin)) {
      plugin.resourceLoader.attach(this);
    }

    plugin.onAdd(this);
    this.plugins.set(plugin.id, plugin);
    this.dispatch('pluginAdded', plugin);
    Log.info('Added new plugin', plugin);
  }

  public removePlugin(plugin: MapJetPlugin) {
    if (this.destroyed) {
      Log.info(
        'Mapjet was destroyed, all plugins were removed during this operation. This operation will have no effect.'
      );
      return;
    }

    if (!this.plugins.has(plugin.id)) {
      throw new Error(`Plugin with id ${plugin.id} not exists`);
    }

    plugin.onRemove(this);

    if (isResourcePlugin(plugin)) {
      plugin.resourceLoader.destroy();
    }

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
    this.destroyed = true;
  }

  public on<E extends keyof MapJetEventsMap>(event: E, callback: (event: MapJetEventsMap[E]) => void) {
    this.dispatcher.on(event, callback);
  }

  public off<E extends keyof MapJetEventsMap>(event: E, callback: (event: MapJetEventsMap[E]) => void) {
    this.dispatcher.off(event, callback);
  }

  public dispatch<E extends keyof MapJetEventsMap>(event: E, data: MapJetEventsMap[E]) {
    this.dispatcher.fire(event, data);
  }
}

function isResourcePlugin(plugin: MapJetPlugin | MapJetResourcesPlugin): plugin is MapJetResourcesPlugin {
  return 'resourceLoader' in plugin;
}
