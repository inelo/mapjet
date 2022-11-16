import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, NgZone, ViewChild } from '@angular/core';

import { MapJet } from '@inelo/mapjet-core';
import { ViewPlugin } from '@inelo/mapjet-view-plugin';
import { StyleSpecification } from 'maplibre-gl';

@Component({
  selector: 'libs-app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent implements AfterViewInit {
  @ViewChild('mapContainer') private mapContainer?: ElementRef;

  constructor(private readonly ngZone: NgZone) {}

  ngAfterViewInit() {
    this.ngZone.runOutsideAngular(() => {
      if (!this.mapContainer) return;

      const mapCore = new MapJet({
        container: this.mapContainer.nativeElement,
        style: this.defaultStyle || '',
      });

      const viewPlugin = new ViewPlugin();
      mapCore.map.on('load', () => {
        mapCore.addPlugin(viewPlugin);
      });
    });
  }

  public getCurrentYear(): string {
    const startYear = 2022;
    const currentYear = new Date().getFullYear();
    return currentYear === startYear ? `${currentYear}` : `${startYear} - ${currentYear}`;
  }

  private get defaultStyle(): any {
    return {
      version: 8,
      sources: {
        osm: {
          type: 'raster',
          tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
          tileSize: 256,
          attribution:
            'Map tiles by <a target="_top" rel="noopener" href="https://tile.openstreetmap.org/">OpenStreetMap tile servers</a>, under the <a target="_top" rel="noopener" href="https://operations.osmfoundation.org/policies/tiles/">tile usage policy</a>. Data by <a target="_top" rel="noopener" href="http://openstreetmap.org">OpenStreetMap</a>',
        },
      },
      layers: [
        {
          id: 'osmx',
          type: 'raster',
          source: 'osm',
        },
      ],
    };
  }
}
