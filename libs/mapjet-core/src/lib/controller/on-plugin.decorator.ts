export function OnPlugin<T extends string>(pluginId: string, event: T) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const key = '_pluginDefs';
    let pluginDefs = target[key] || {};
    const events = pluginDefs[pluginId] && pluginDefs[pluginId][event] ? pluginDefs[pluginId][event] : [];

    pluginDefs[pluginId] = { ...pluginDefs[pluginId], [event]: [...events, descriptor.value] };

    Reflect.deleteProperty(target, key);
    Reflect.defineProperty(target, key, {
      get() {
        return pluginDefs;
      },
      set(value) {
        pluginDefs = value;
      },
      enumerable: true,
      configurable: true,
    });
  };
}
