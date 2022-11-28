import { FitBoundsOptions } from 'maplibre-gl';

export type ViewPluginEventType = 'loaded';

export type ViewPluginOptions = {
  keepViewDisabled: boolean;
  fitBoundsOptions?: FitBoundsOptions;
  maxZoom: number;
  id: string;
};
