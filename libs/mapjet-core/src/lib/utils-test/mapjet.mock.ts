export const mapJetMock = () =>
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
    getPlugin(_t) {
      return null;
    },
    destroy() {},
    on() {},
    off() {},
  } as any);
