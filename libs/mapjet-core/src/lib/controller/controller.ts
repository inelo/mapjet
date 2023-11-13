import { MapJet } from '../mapjet-core';
import { MapJetEventablePlugin, MapJetPlugin } from '../mapjet-core.model';
import { isEventablePlugin } from '../utils/models';

export type PluginDefs = { [key in string]: { [key in string]: ((e: any) => void)[] } };

export class MapJetController {
  protected mapJet?: MapJet;

  private readonly onPluginAddedHandler = this.bindPlugin.bind(this);
  private readonly onPluginRemovedHandler = this.unbindPlugin.bind(this);
  private _pluginDefs?: PluginDefs;
  private pluginDefs: PluginDefs = {};

  initialize(mapJet: MapJet) {
    this.mapJet = mapJet;

    this.bindDefs();
    this.bindExistingPlugins();
    this.mapJet?.on('pluginAdded', this.onPluginAddedHandler);
    this.mapJet?.on('pluginRemoved', this.onPluginRemovedHandler);
  }

  destroy() {
    this.mapJet?.off('pluginAdded', this.onPluginAddedHandler);
    this.mapJet?.off('pluginRemoved', this.onPluginRemovedHandler);
    this.unbindAll();
  }

  private bindDefs() {
    if (!this._pluginDefs) {
      return;
    }

    const defs = this._pluginDefs || {};

    this.pluginDefs = Object.keys(defs).reduce((acc, pluginId) => {
      acc[pluginId] = Object.keys(defs[pluginId]).reduce((accn, eventName) => {
        accn[eventName] = defs[pluginId][eventName].map(callback => callback.bind(this));

        return accn;
      }, {});

      return acc;
    }, {});
  }

  private bindPlugin(plugin: MapJetPlugin) {
    if (this.pluginDefs[plugin.id]) {
      Object.keys(this.pluginDefs[plugin.id]).forEach(eventName => {
        this.pluginDefs[plugin.id][eventName].forEach(callback => {
          if (isEventablePlugin(plugin)) {
            plugin.on(eventName, callback);
          }
        });
      });
    }
  }

  private unbindPlugin(plugin: MapJetPlugin) {
    if (this.pluginDefs[plugin.id]) {
      Object.keys(this.pluginDefs[plugin.id]).forEach(eventName => {
        this.pluginDefs[plugin.id][eventName].forEach(callback => {
          if (isEventablePlugin(plugin)) {
            plugin.off(eventName, callback);
          }
        });
      });
    }
  }

  private bindExistingPlugins() {
    this.mapJet?.getPlugins().forEach(plugin => {
      if (isEventablePlugin(plugin)) {
        this.bindPlugin(plugin);
      }
    });
  }

  private unbindAll() {
    this.mapJet?.getPlugins().forEach(plugin => {
      if (isEventablePlugin(plugin)) {
        this.unbindPlugin(plugin);
      }
    });
  }
}
