// UI Configuration
export const UI_CONFIG = {
    hungerBar: {
        position: { top: '20px', right: '20px' },
        size: { width: '200px', height: '20px' },
        colors: {
            background: 'rgba(0, 0, 0, 0.7)',
            fill: {
                good: '#4CAF50',
                warning: '#FFA726',
                critical: '#F44336'
            }
        }
    },
    statusBar: {
        position: { top: '100px', right: '20px' },
        size: { width: '200px' },
        style: {
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            padding: '10px',
            borderRadius: '5px',
            fontFamily: 'Arial, sans-serif',
            zIndex: '1000'
        },
        thresholds: {
            annoyed: 30,
            angry: 70
        }
    }
};

// Cat Configuration
export const CAT_CONFIG = {
    dimensions: {
        body: {
            width: 0.4,
            height: 0.25,
            depth: 0.25
        },
        head: {
            size: 0.25,
            heightOffset: 0.32
        },
        eye: {
            size: 0.05,
            spacing: 0.08,
            heightOffset: 0.34
        },
        ear: {
            radius: 0.05,
            height: 0.1,
            spacing: 0.08,
            heightOffset: 0.45,
            tiltAngle: 0.3
        },
        tail: {
            segmentLength: 0.1,
            segmentHeight: 0.06,
            segmentSpacing: 0.08,
            heightOffset: 0.25,
            segments: 4
        },
        leg: {
            width: 0.08,
            height: 0.2,
            spacing: {
                x: 0.15,
                z: 0.15
            }
        },
        paw: {
            width: 0.09,
            height: 0.04,
            depth: 0.1
        }
    },
    materials: {
        body: {
            color: 0xFFA500,
            flatShading: true
        },
        white: {
            color: 0xFFFFFF,
            flatShading: true
        },
        black: {
            color: 0x000000,
            flatShading: true
        }
    },
    movement: {
        maxSpeed: 1.5,
        rotationSpeed: 2.0,
        acceleration: 2.0,
        deceleration: 4.0,
        collisionRadius: 0.2,
        collisionRays: 8,
        turnThreshold: 0.1,
        minSpeedThreshold: 0.01,
        bowlDetectionRadius: 3.0,
        bowlReachRadius: 0.2
    },
    hunger: {
        initial: 50,
        increaseRate: 2.0,
        checkInterval: 1.0,
        thresholds: {
            hungry: 30,
            veryHungry: 70,
            meow: 50,
            interested: 20
        }
    },
    hearing: {
        range: 8.0,
        reactionDelay: 0.5
    },
    meow: {
        size: 0.2,
        duration: 1.0,
        height: 0.5,
        color: 0xFFFF00,
        chance: 0.005
    },
    room: {
        width: 6,
        length: 8,
        margin: 0.5
    }
};

// Food Configuration
export const FOOD_CONFIG = {
    types: {
        BASIC: {
            name: 'Basic Cat Food',
            color: {
                package: 0x8B4513,
                content: 0xCD853F
            },
            nutrition: 30,
            model: {
                width: 0.15,
                height: 0.1,
                depth: 0.15
            }
        },
        PREMIUM: {
            name: 'Premium Cat Food',
            color: {
                package: 0xFFD700,
                content: 0xFFA500
            },
            nutrition: 50,
            model: {
                width: 0.15,
                height: 0.12,
                depth: 0.15
            }
        }
    },
    interaction: {
        pickupRange: 0.7,
        hoverHeight: 1.0,
        carryOffset: 1.0,
        highlightColor: 0xFFFFFF,
        pulseSpeed: 2.0
    }
};

// Bowl Configuration
export const BOWL_CONFIG = {
    size: {
        radius: 0.2,
        height: 0.08
    },
    color: 0x808080,
    position: {
        wallOffset: 0.3
    },
    highlight: {
        color: 0x00FF00,
        pulseSpeed: 2.0,
        range: 1.0
    },
    food: {
        fillHeight: 0.04,
        fillRadius: 0.16
    },
    materials: {
        metalness: 0.7,
        roughness: 0.3
    }
};

// Activity Types
export const ACTIVITY_TYPES = {
    IDLE: 'idle',
    WALKING: 'walking',
    EATING: 'eating',
    SEARCHING_FOOD: 'searchingFood',
    MEOWING: 'meowing',
    ROTATING: 'rotating',
    HEARD_FOOD: 'heardFood'
};

// Activity Descriptions for UI
export const ACTIVITY_DESCRIPTIONS = {
    [ACTIVITY_TYPES.IDLE]: 'Relaxing',
    [ACTIVITY_TYPES.WALKING]: 'Exploring',
    [ACTIVITY_TYPES.EATING]: 'Eating',
    [ACTIVITY_TYPES.SEARCHING_FOOD]: 'Looking for Food',
    [ACTIVITY_TYPES.MEOWING]: 'Meowing',
    [ACTIVITY_TYPES.ROTATING]: 'Looking Around',
    [ACTIVITY_TYPES.HEARD_FOOD]: 'Noticed Food!'
}; 