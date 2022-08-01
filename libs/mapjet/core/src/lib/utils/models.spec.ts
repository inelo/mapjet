import { MapJetEventablePlugin, MapJetPlugin } from '../mapjet-core.model';
import { isEventablePlugin } from './models';

class EventablePlugin implements MapJetPlugin, MapJetEventablePlugin {
  public readonly id = 'eventablePlugin';
  onAdd() {}
  onRemove() {}
  on(_eventName, _callback) {}
  off(_eventName, _callback) {}
}

class NoEventablePlugin implements MapJetPlugin {
  public readonly id = 'noEventablePlugin';
  onAdd() {}
  onRemove() {}
}

describe('isEventablePlugin()', () => {
  it('should return true when provided eventable plugin', () => {
    expect(isEventablePlugin(new EventablePlugin())).toEqual(true);
  });

  it('should return false when provided no eventable plugin', () => {
    expect(isEventablePlugin(new NoEventablePlugin())).toEqual(false);
  });
});
