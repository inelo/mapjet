import { throttle } from 'lodash';
import ResizeObserver from 'resize-observer-polyfill';

import { MapJet } from '../../mapjet-core';
import { MapJetPlugin } from '../../mapjet-core.model';

export class ContainerResizeObserverPlugin implements MapJetPlugin {
  public readonly id = 'containerResizeObserverPlugin';

  private readonly resizeObserver = new ResizeObserver(throttle(this.handleResize.bind(this), 100));
  private mapJet!: MapJet;

  onAdd(mapJet: MapJet) {
    this.mapJet = mapJet;

    this.resizeObserver.observe(this.mapJet.map.getContainer());
  }

  onRemove() {
    this.resizeObserver.disconnect();
  }

  private handleResize() {
    this.mapJet.map.resize();
  }
}
