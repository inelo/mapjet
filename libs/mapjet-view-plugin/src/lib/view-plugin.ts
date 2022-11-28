import { FitBoundsOptions, LngLatBounds, MapLibreEvent } from 'maplibre-gl';

import { MapJetPlugin, MapJet, MapJetEventablePlugin, Dispatcher } from '@inelo/mapjet-core';

import { ViewPluginEventType, ViewPluginOptions } from './view-plugin.models';

export class ViewPlugin implements MapJetPlugin, MapJetEventablePlugin {
  public readonly id: string;

  private readonly dispatcher = new Dispatcher();

  private mapJet!: MapJet;
  private options: ViewPluginOptions = {
    keepViewDisabled: false,
    maxZoom: 14,
    id: 'viewPlugin',
  };

  private readonly mapInteractionHandler = this.mapInteraction.bind(this);
  private readonly recalculateBoundsHandler = this.recalculateBounds.bind(this);

  private keepZoomEnabled = true;
  private bounds = new LngLatBounds();
  private fitBoundsOptions = this.options.fitBoundsOptions;

  constructor(opts: Partial<ViewPluginOptions> = {}) {
    this.options = { ...this.options, ...opts };
    this.id = this.options.id;
  }

  public onAdd(mapJet: MapJet): void {
    this.mapJet = mapJet;

    if (this.options.keepViewDisabled !== true) {
      this.enableKeepView();
      this.recalculateBounds();
      this.fire('loaded', this);
    } else {
      this.disableKeepView();
    }
  }

  public onRemove(): void {
    this.disableKeepView();
  }

  public on(event: ViewPluginEventType, callback: (...args: any) => void): void {
    this.dispatcher.on(event, callback);
  }

  public off(event: ViewPluginEventType, callback: (...args: any) => void) {
    this.dispatcher.off(event, callback);
  }

  public setView(bounds: LngLatBounds, options?: FitBoundsOptions): void {
    this.bounds = bounds;
    this.fitBoundsOptions = options ?? this.options.fitBoundsOptions;

    this.recalculateBounds();
  }

  public enableKeepView(): void {
    this.disableKeepView();
    this.keepZoomEnabled = true;
    this.mapJet?.map?.on('move', this.mapInteractionHandler);
    this.mapJet?.map?.on('resize', this.recalculateBoundsHandler);
  }

  public disableKeepView(): void {
    this.keepZoomEnabled = false;
    this.mapJet?.map?.off('move', this.mapInteractionHandler);
    this.mapJet?.map?.off('resize', this.recalculateBoundsHandler);
  }

  private mapInteraction(e: MapLibreEvent<any>): void {
    if (e.originalEvent && !['resize', 'orientationchange'].includes(e.originalEvent.type)) {
      this.disableKeepView();
    }
  }

  private recalculateBounds(): void {
    if (this.keepZoomEnabled && !this.bounds.isEmpty()) {
      this.mapJet?.map?.fitBounds(this.bounds, {
        animate: true,
        duration: 500,
        padding: 20,
        maxZoom: this.options.maxZoom,
        ...this.fitBoundsOptions,
      });
    }
  }

  private fire(event: ViewPluginEventType, data: any): void {
    this.dispatcher.fire(event, data);
  }
}
