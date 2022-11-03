import { Map, MapEvent } from 'maplibre-gl';

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

  public on(eventName: MapEvent, layerId: string, callback: () => any): void {
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
      this.handlers[eventName][layerId] = callback;
    }
  }

  public off(eventName: MapEvent, layerId: string): void {
    if (this.handlers[eventName] && this.handlers[eventName][layerId]) {
      this.handlers[eventName][layerId] = null;
      delete this.handlers[eventName][layerId];
    }
  }

  private _onMapEvent(event): void {
    var layers = this.getHandleLayers(event.type); //unordered list of layers to be checked

    let eventName = event.type;

    // This gets the features that was clicked in the correct layer order
    var eventFeatures = this.map.queryRenderedFeatures(event.point, { layers: layers });

    // This makes a sorted array of the layers that are clicked
    var sortedLayers = eventFeatures.reduce((sorted: any[], next) => {
      let nextLayerId = next.layer.id;
      if (sorted.indexOf(nextLayerId) === -1) {
        return sorted.concat([nextLayerId]);
      }
      return sorted;
    }, []);

    // Add the layers and features info to the event
    event.eventLayers = sortedLayers;
    event.eventFeatures = eventFeatures;

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
      bubbleEvent = this.handlers[eventName][layerId](event, layerFeatures);
    }

    if (bubbleEvent === true) {
      // No events has cancelled the bubbling
      if (!this.defaultHandlers[eventName]) {
        return;
      }

      this.defaultHandlers[eventName].forEach(handler => {
        handler(event);
      });
    }
  }

  private getHandleLayers(eventName) {
    if (!this.handlers[eventName]) {
      return [];
    }
    return Object.keys(this.handlers[eventName]);
  }
}
