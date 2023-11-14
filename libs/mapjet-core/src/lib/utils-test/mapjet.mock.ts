import { MapJet } from "../mapjet-core";

export const mapJetMock = (): MapJet =>
  ({
    map: {
      getContainer() {
        return '<div></div>';
      },
      resize() {},
      addControl() {},
      addLayer() {},
      getLayer() {},
      removeLayer() {},
      addSource() {},
      getSource() {},
      removeSource() {},
      hasImage() {},
      removeImage() {},
      scrollZoom: {
        setWheelZoomRate() {},
      },
    },
    addPlugin() {},
    removePlugin() {},
    removePluginIfExists() {},
    getPlugin(_t) {
      return null;
    },
    getPlugins() {
      return [];
    },
    destroy() {},
    on() {},
    off() {},
    isDestroyed: false,
    layerEventHandler: {
      on() {},
      off() {}
    }
  } as unknown as MapJet);
