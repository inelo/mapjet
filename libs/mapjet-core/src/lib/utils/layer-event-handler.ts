import { Feature, Map, MapEvent, MapGeoJSONFeature } from 'maplibre-gl';

export type LayerEvent<T> = {
  cancelBubble: boolean;
  cancelImmediate: boolean;
  features: MapGeoJSONFeature[],
  stopPropagation(): void;
  stopImmediatePropagation(): void;
} & T;

// Code example: https://github.com/mapbox/mapbox-gl-js/issues/5783#issuecomment-394856120
export class LayerEventHandler {
  private readonly map: Map;
  private readonly handlers: Record<string, any>;
  private readonly defaultHandlers: Record<string, any>;

  constructor(map) {
    this.map = map;

    this.handlers = {};
    this.defaultHandlers = {};

    this._onMapEvent = this._onMapEvent.bind(this);
  }

  public on(eventName: MapEvent, layerId: string | null, callback: (...args: any[]) => any): void {
    if (!this.defaultHandlers[eventName] && !this.handlers[eventName]) {
      // Create new event name keys in our storage maps
      this.defaultHandlers[eventName] = [];
      this.handlers[eventName] = {};

      // Register a map event for the given event name
      this.map.on(eventName, this._onMapEvent);
    }

    if (!layerId) {
      // layerId is not specified, so this is a 'default handler' that will be called if no other events have cancelled the event
      this.defaultHandlers[eventName].push(callback);
    } else {
      // layerId is specified, so this is a specific handler for that layer
      this.handlers[eventName][layerId] = [...(this.handlers[eventName][layerId] || []), callback];
    }
  }

  public off(eventName: MapEvent, layerId: string | null, callbackRef: (...args: any[]) => any): void {
    if (layerId && this.handlers[eventName] && this.handlers[eventName][layerId]) {
      this.handlers[eventName][layerId] = this.handlers[eventName][layerId].filter(cb => cb !== callbackRef);

      if (this.handlers[eventName][layerId].length === 0) {
        delete this.handlers[eventName][layerId];
      }
    } else if (!layerId && this.defaultHandlers[eventName]) {
      this.defaultHandlers[eventName] = this.defaultHandlers[eventName].filter(cb => cb !== callbackRef);
    }

    if (Object.keys(this.handlers[eventName] || {}).length === 0 && this.defaultHandlers[eventName]?.length === 0) {
      this.map.off(eventName, this._onMapEvent);
      delete this.defaultHandlers[eventName];
      delete this.handlers[eventName];
    }
  }

  private _onMapEvent(event): void {
    const layers = this.getHandleLayers(event.type); //unordered list of layers to be checked

    let eventName = event.type;

    // This gets the features that was clicked in the correct layer order
    const eventFeatures = this.map.queryRenderedFeatures(event.point, { layers: layers, validate: false });

    // This makes a sorted array of the layers that are clicked
    const sortedLayers = eventFeatures.reduce((sorted: any[], next) => {
      let nextLayerId = next.layer.id;
      return sorted.indexOf(nextLayerId) === -1 ? sorted.concat([nextLayerId]) : sorted;
    }, []);

    // Add the layers and features info to the event
    event.eventLayers = sortedLayers;
    event.features = eventFeatures;
    event.cancelBubble = false;
    event.cancelImmediate = false;

    event.stopPropagation = function () {
      this.cancelBubble = true;
    };

    event.stopImmediatePropagation = function () {
      this.cancelImmediate = true;
    };

    let bubbleEvent = true;

    // Loop through each of the sorted layers starting with the first (top-most clicked layer)
    // Call the handler for each layer in order, and potentially stop propagating the event
    for (let i = 0; i < sortedLayers.length; i++) {
      if (bubbleEvent !== true) {
        break;
      }
      let layerId = sortedLayers[i];
      // Filter out only the features for this layer
      let layerFeatures = eventFeatures.filter(feature => {
        return feature.layer.id === layerId;
      });

      // Call the layer handler for this layer, giving the clicked features
      for (const callback of this.handlers[eventName][layerId]) {
        callback(event, layerFeatures);

        bubbleEvent = !event.cancelBubble;

        if (event.cancelImmediate) {
          break;
        }
      }
    }

    if (bubbleEvent === true) {
      // No events has cancelled the bubbling
      if (!this.defaultHandlers[eventName]) {
        return;
      }

      for (const handler of this.defaultHandlers[eventName]) {
        handler(event);

        bubbleEvent = !event.cancelBubble;

        if (!event.cancelImmediate) {
          break;
        }
      }
    }
  }

  private getHandleLayers(eventName) {
    if (!this.handlers[eventName]) {
      return [];
    }
    return Object.keys(this.handlers[eventName]);
  }
}
