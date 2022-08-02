import { Source } from 'maplibre-gl';

import { MapJetEventablePlugin, MapJetPlugin } from '../mapjet-core.model';

export type DataSource = Source & { setData: (data: any) => any; getData: () => any };

export function isEventablePlugin(plugin: MapJetPlugin): plugin is MapJetPlugin & MapJetEventablePlugin {
  return (
    (plugin as MapJetPlugin & MapJetEventablePlugin).on !== undefined &&
    (plugin as MapJetPlugin & MapJetEventablePlugin).off !== undefined
  );
}
