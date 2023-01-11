import { LayerSpecification, Map, SourceSpecification } from 'maplibre-gl';

export interface AssetLoader {
  id: string;
  load(map: Map): Promise<void>;
  addToMap(map: Map): void;
  remove(map: Map): void;
}

export type SourceLoader = {
  id: string;
  specification: SourceSpecification;
};

export type Result<T> = [true, T, undefined?] | [false, T, unknown];

export type LayerLoader = {
  addBefore?: string;
  specification: LayerSpecification;
};
