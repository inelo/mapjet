import { MapJet, mapJetMock as jetMock } from '@inelo/mapjet-core';
import { LngLatBounds, Map } from 'maplibre-gl';

import { ViewPlugin } from './view-plugin';
import { ViewPluginOptions } from './view-plugin.models';

describe('ViewPlugin', () => {
  describe('onAdd', () => {
    it('should fitBounds when enabled', async () => {
      const { mapJet, plugin } = setupPlugin();
      plugin.setView(new LngLatBounds([11, 12], [11, 12]));

      expect(mapJet.map.fitBounds).toHaveBeenCalled();
    });

    it('should no fitBounds when keepViewDisabled', async () => {
      const { mapJet, plugin } = setupPlugin({ keepViewDisabled: true });
      plugin.setView(new LngLatBounds([11, 12], [11, 12]));

      expect(mapJet.map.fitBounds).not.toHaveBeenCalled();
    });
  });

  it('should override fitParams', async () => {
    const { mapJet, plugin } = setupPlugin({ fitBoundsOptions: { padding: 40 } });
    plugin.setView(new LngLatBounds([11, 12], [11, 12]));

    expect(mapJet.map.fitBounds).toHaveBeenCalledWith(
      expect.any(LngLatBounds),
      expect.objectContaining({ padding: 40 })
    );
  });

  describe('setView()', () => {
    it('should be fit map to view', async () => {
      const { mapJet, plugin } = setupPlugin();
      plugin.setView(new LngLatBounds([11, 12], [11, 12]));

      expect(mapJet.map.fitBounds).toBeCalledWith(
        expect.objectContaining({ _ne: { lat: 12, lng: 11 }, _sw: { lat: 12, lng: 11 } }),
        { animate: true, duration: 500, maxZoom: 14, padding: 20 }
      );
    });
  });

  describe('keep zoom', () => {
    it('should be disabled when user move map', async () => {
      const { mapJet, plugin } = setupPlugin();

      (mapJet.map as any).move({ originalEvent: {} });
      plugin.setView(new LngLatBounds([11, 12], [11, 12]));

      expect(mapJet.map.fitBounds).not.toBeCalled();
    });

    it('should be enabled when move map programmatically', async () => {
      const { mapJet, plugin } = setupPlugin();

      (mapJet.map as any).move({});
      plugin.setView(new LngLatBounds([11, 12], [11, 12]));

      expect(mapJet.map.fitBounds).toHaveBeenCalledTimes(1);
    });

    it('should not be disabled when move map by orientationchange or resize', async () => {
      const { mapJet, plugin } = setupPlugin();

      (mapJet.map as any).move({ originalEvent: { type: 'orientationchange' } });
      (mapJet.map as any).move({ originalEvent: { type: 'resize' } });
      plugin.setView(new LngLatBounds([11, 12], [11, 12]));

      expect(mapJet.map.fitBounds).toHaveBeenCalledTimes(1);
    });

    it('should keep zoom when resize', async () => {
      const { mapJet, plugin } = setupPlugin();
      plugin.setView(new LngLatBounds([11, 12], [11, 12]));

      (mapJet.map as any).resize();

      expect(mapJet.map.fitBounds).toHaveBeenCalledTimes(2);
    });

    it('should keep zoom when resize with provided options', async () => {
      const { mapJet, plugin } = setupPlugin();
      plugin.setView(new LngLatBounds([11, 12], [11, 12]), { padding: 444 });

      (mapJet.map as any).resize();

      expect(mapJet.map.fitBounds).toHaveBeenCalledTimes(2);
      expect(mapJet.map.fitBounds).toHaveBeenLastCalledWith(new LngLatBounds([11, 12], [11, 12]), {
        padding: 444,
        maxZoom: 14,
        duration: 500,
        animate: true,
      });
    });
  });

  describe('disableKeepView()', () => {
    it('should no keep zoom', async () => {
      const { plugin, mapJet } = setupPlugin();
      plugin.disableKeepView();
      (mapJet.map as any).resize();
      (mapJet.map as any).move({ originalEvent: {} });
      plugin.setView(new LngLatBounds([11, 12], [11, 12]));

      expect(mapJet.map.fitBounds).not.toBeCalled();
    });
  });

  describe('enableKeepView()', () => {
    it('should keep zoom', async () => {
      const { plugin, mapJet } = setupPlugin();
      plugin.disableKeepView();
      plugin.enableKeepView();
      plugin.setView(new LngLatBounds([11, 12], [11, 12]));

      expect(mapJet.map.fitBounds).toHaveBeenCalledTimes(1);
    });
  });
});

const mapJetMock = (opts: Partial<Map> = {}): MapJet => {
  const mock: any = jetMock();

  return {
    ...mock,
    map: <any>{
      ...mock.map,
      callbacks: [],
      on(event, callback) {
        this.callbacks[event] = [...(this.callbacks[event] || []), callback];
      },
      off(event, callback) {
        this.callbacks[event] = (this.callbacks[event] || []).filter(c => c !== callback);
      },
      fitBounds: jest.fn(),
      move(e = {}) {
        this.callbacks['move'].forEach(c => c(e));
      },
      resize(e = {}) {
        this.callbacks['resize'].forEach(c => c(e));
      },
      ...opts,
    },
  };
};

const setupPlugin = (options: Partial<ViewPluginOptions> = {}): { plugin: ViewPlugin; mapJet: MapJet } => {
  const plugin = new ViewPlugin(options);
  const mapJet = mapJetMock();

  plugin.onAdd(mapJet);

  return { plugin, mapJet };
};
