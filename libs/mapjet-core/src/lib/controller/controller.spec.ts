import { MapJet } from '../mapjet-core';
import { MapJetController } from './controller';
import { OnPlugin } from './on-plugin.decorator';
import { Dispatcher } from '../utils/dispatcher';

class MapJetMock {
  dispatcher = new Dispatcher<Record<string, any>>();

  getPlugins() {
    return [];
  }

  on(eventName, callback) {
    this.dispatcher.on(eventName, callback);
  }

  off(eventName, callback) {
    this.dispatcher.off(eventName, callback);
  }
}

interface VehiclePluginEventsMap {
  vehicleAdded: string;
}

class FakeController extends MapJetController {
  public vehicleAdded?: any;

  @OnPlugin<VehiclePluginEventsMap>('vehiclesPlugin', 'vehicleAdded')
  onVehicleAdded(data) {
    this.vehicleAdded = data;
  }
}

class FakeControllerWithoutDecorator extends MapJetController {
  foo() {
    return 'bar';
  }
}

class FakeVehiclesPlugin {
  public readonly id = 'vehiclesPlugin';
  dispatcher = new Dispatcher<Record<string, any>>();

  on(eventName, callback) {
    this.dispatcher.on(eventName, callback);
  }

  off(eventName, callback) {
    this.dispatcher.off(eventName, callback);
  }
}

class NoEventablePlugin {
  public readonly id = 'noEventablePlugin';
}

describe('MapJetController', () => {
  it('should handle plugin event', () => {
    const controller = new FakeController();
    const mapJet = new MapJetMock();
    const plugin = new FakeVehiclesPlugin();
    jest.spyOn(controller, 'onVehicleAdded');

    controller.initialize(mapJet as unknown as MapJet);
    mapJet.dispatcher.fire('pluginAdded', plugin);
    plugin.dispatcher.fire('vehicleAdded', { id: 'vehicleid' });

    expect(controller.vehicleAdded).toEqual({ id: 'vehicleid' });
  });

  it('should bind existing plugins', () => {
    const controller = new FakeController();
    const mapJet = new MapJetMock();
    const plugin = new FakeVehiclesPlugin();

    jest.spyOn(mapJet, 'getPlugins').mockReturnValue([plugin]);

    jest.spyOn(plugin, 'on');

    controller.initialize(mapJet as unknown as MapJet);

    expect(plugin.on).toHaveBeenCalled();
  });

  it('should no throw error', () => {
    const controller = new FakeControllerWithoutDecorator();
    const mapJet = new MapJetMock();

    controller.initialize(mapJet as unknown as MapJet);

    expect(controller.foo()).toEqual('bar');
  });

  it('should unbind from events on destroy', () => {
    const controller = new FakeController();
    const mapJet = new MapJetMock();
    const plugin = new FakeVehiclesPlugin();
    const noEventablePlugin = new NoEventablePlugin();

    jest.spyOn(mapJet, 'getPlugins').mockReturnValue([plugin, noEventablePlugin]);
    jest.spyOn(plugin, 'off');

    controller.initialize(mapJet as unknown as MapJet);
    controller.destroy();

    expect(plugin.off).toHaveBeenCalled();
  });
});
