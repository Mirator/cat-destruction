export class GameEvents {
    static listeners = new Map();

    static EVENT_TYPES = {
        FOOD_ADDED: 'foodAdded',
        FOOD_REMOVED: 'foodRemoved',
        FOOD_CONSUMED: 'foodConsumed',
        BOWL_STATE_CHANGED: 'bowlStateChanged',
        CAT_STATE_CHANGED: 'catStateChanged',
        ACTIVITY_CHANGED: 'activityChanged'
    };

    static subscribe(eventType, callback) {
        if (!this.listeners.has(eventType)) {
            this.listeners.set(eventType, new Set());
        }
        this.listeners.get(eventType).add(callback);
        
        // Return unsubscribe function
        return () => this.unsubscribe(eventType, callback);
    }

    static unsubscribe(eventType, callback) {
        if (this.listeners.has(eventType)) {
            this.listeners.get(eventType).delete(callback);
        }
    }

    static emit(eventType, data) {
        if (this.listeners.has(eventType)) {
            this.listeners.get(eventType).forEach(callback => callback(data));
        }
    }
} 