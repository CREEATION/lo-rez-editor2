import { diff } from '@/modules/color.js';

export function Palette(colors = []) {
    this.subscriptions = new Set();
    this.colorWeights = {};
    this.colorReplacements = {};

    this.colors = new Set(colors);
    this.index = 0;

    return this;
}

Palette.prototype.toArray = function () {
    return [...this.colors];
};

Palette.prototype.subscribe = function (callback) {
    this.subscriptions.add(callback);

    return () => {
        this.subscriptions.delete(callback);
    };
};

Palette.prototype.notify = function () {
    this.subscriptions.forEach((callback) => {
        callback(this);
    });

    return this;
};

Palette.prototype.cleanup = function () {
    if (this.colors.size < 6) {
        console.debug('Will not clean up palettes with less than 6 colors');

        return this.notify();
    }

    console.debug(`Palette size before cleanup = ${this.colors.size}`);
    console.debug([...this.colors]);

    console.groupCollapsed('Palette cleanup');

    for (let colorA of this.colors) {
        let minDiff = Number.MAX_SAFE_INTEGER;
        let sibling = null;

        const weightA = this.colorWeights[colorA];

        if (weightA > 8) {
            continue;
        }

        for (let colorB of this.colors) {
            if (colorA === colorB) {
                continue;
            }

            const weightB = this.colorWeights[colorB];
            if (weightB <= 8) {
                continue;
            }

            const difference = diff(colorA, colorB);
            if (difference < minDiff) {
                minDiff = difference;
                sibling = colorB;
            }
        }

        if (minDiff > 12) {
            continue;
        }

        console.debug('%d x %s -(±%d)-> %s', weightA, colorA, minDiff, sibling);

        this.colorReplacements[colorA] = sibling;
        this.colors.delete(colorA);
    }

    console.groupEnd();

    console.debug(`Palette size after cleanup = ${this.colors.size}`);
    console.debug([...this.colors]);

    return this.notify();
};

Palette.prototype.addColor = function (color) {
    if (color.match(/^#[a-f0-9]{8}$/i) === null) {
        throw new Error(`Color ${color} is not in the correct format`);
    }

    this.colors.add(color);
    this.colorWeights[color] = (this.colorWeights[color] || 0) + 1;

    return this.notify();
};

Palette.prototype.setColor = function (color) {
    this.index = this.findIndex(color);

    return this.notify();
};

Palette.prototype.setIndex = function (index) {
    if (index < 0 || index >= this.colors.size) {
        throw new Error(`Palette index ${index} out of range`);
    }

    this.index = index;

    return this.notify();
};

Palette.prototype.findIndex = function (color) {
    if (!this.colors.has(color)) {
        if (this.colorReplacements[color]) {
            return this.findIndex(this.colorReplacements[color]);
        }

        throw new Error(`Color ${color} is not in palette`);
    }

    return this.toArray().indexOf(color);
};

Palette.prototype.getDefault = function () {
    let defaultIndex = 0;
    let maxWeight = 0;

    for (let color of this.colors) {
        if (color.endsWith('00')) {
            return this.toArray().indexOf(color);
        }

        const weight = this.colorWeights[color];

        if (weight > maxWeight) {
            defaultIndex = this.toArray().indexOf(color);
            maxWeight = weight;
        }
    }

    return defaultIndex;
};
