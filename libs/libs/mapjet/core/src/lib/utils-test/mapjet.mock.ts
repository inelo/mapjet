export const mapJetMock = () =>
  ({
    map: {
      getContainer() {
        return '<div></div>';
      },
      resize() {},
      addControl() {},
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
