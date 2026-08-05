import { ModuleEventDefinition } from './types';

export type EventCallback = (event: { eventType: string; moduleId: string; timestamp: string; payload: any }) => void;

export class EventRegistryEngine {
  private static instance: EventRegistryEngine;
  private eventDefinitions: Map<string, { definition: ModuleEventDefinition; moduleId: string }> = new Map();
  private subscribers: Map<string, Set<EventCallback>> = new Map();
  private globalSubscribers: Set<EventCallback> = new Set();
  private eventHistory: { eventId: string; eventType: string; moduleId: string; timestamp: string; payload: any }[] = [];

  private constructor() {}

  public static getInstance(): EventRegistryEngine {
    if (!EventRegistryEngine.instance) {
      EventRegistryEngine.instance = new EventRegistryEngine();
    }
    return EventRegistryEngine.instance;
  }

  public registerEventDefinition(moduleId: string, eventDef: ModuleEventDefinition): void {
    this.eventDefinitions.set(eventDef.eventType, { definition: eventDef, moduleId });
  }

  public unregisterModuleEvents(moduleId: string): void {
    for (const [key, val] of this.eventDefinitions.entries()) {
      if (val.moduleId === moduleId) {
        this.eventDefinitions.delete(key);
      }
    }
  }

  public subscribe(eventType: string, callback: EventCallback): () => void {
    if (!this.subscribers.has(eventType)) {
      this.subscribers.set(eventType, new Set());
    }
    this.subscribers.get(eventType)!.add(callback);
    return () => {
      this.subscribers.get(eventType)?.delete(callback);
    };
  }

  public subscribeGlobal(callback: EventCallback): () => void {
    this.globalSubscribers.add(callback);
    return () => {
      this.globalSubscribers.delete(callback);
    };
  }

  public publish(eventType: string, moduleId: string, payload: any): void {
    const timestamp = new Date().toISOString();
    const eventId = `EVT-${Date.now()}-${Math.floor(Math.random() * 899 + 100)}`;
    const eventObj = { eventId, eventType, moduleId, timestamp, payload };

    this.eventHistory.unshift(eventObj);
    if (this.eventHistory.length > 300) {
      this.eventHistory.pop();
    }

    const callbacks = this.subscribers.get(eventType);
    if (callbacks) {
      callbacks.forEach(cb => {
        try { cb(eventObj); } catch (e) { console.error(`Error in event callback for ${eventType}:`, e); }
      });
    }

    this.globalSubscribers.forEach(cb => {
      try { cb(eventObj); } catch (e) { console.error(`Error in global event callback:`, e); }
    });
  }

  public getAllEventDefinitions(): { eventType: string; description: string; moduleId: string }[] {
    return Array.from(this.eventDefinitions.values()).map(item => ({
      eventType: item.definition.eventType,
      description: item.definition.description,
      moduleId: item.moduleId
    }));
  }

  public getRecentEvents(limit: number = 50) {
    return this.eventHistory.slice(0, limit);
  }
}

export const eventRegistryEngine = EventRegistryEngine.getInstance();
