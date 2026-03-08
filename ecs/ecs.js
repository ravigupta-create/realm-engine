// ecs/ecs.js — Simple Entity-Component-System core

const ECS = (() => {
  let _nextId = 1;
  const _systems = [];

  function createEntity() {
    return {
      id: _nextId++,
      components: new Set(),
      alive: true,
      x: 0,
      y: 0,
      dir: 'down',
      animState: Animations.createAnimState('idle'),
      speed: 2
    };
  }

  function addComponent(entity, componentType) {
    entity.components.add(componentType);
    // Apply default component data
    if (Components.defaults[componentType]) {
      const defaults = Components.defaults[componentType];
      for (const [key, val] of Object.entries(defaults)) {
        if (entity[key] === undefined) {
          entity[key] = typeof val === 'object' ? JSON.parse(JSON.stringify(val)) : val;
        }
      }
    }
  }

  function hasComponent(entity, componentType) {
    return entity.components.has(componentType);
  }

  function getEntitiesWithComponent(componentType) {
    return GS.entities.filter(e => e.components.has(componentType));
  }

  function registerSystem(system) {
    _systems.push(system);
  }

  function runSystems(dt) {
    for (const sys of _systems) {
      sys.update(dt);
    }
  }

  function removeEntity(entity) {
    entity.alive = false;
    const idx = GS.entities.indexOf(entity);
    if (idx >= 0) GS.entities.splice(idx, 1);
  }

  return { createEntity, addComponent, hasComponent, getEntitiesWithComponent, registerSystem, runSystems, removeEntity };
})();
