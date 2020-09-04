export const T = _class(init, null, {
    size: size,
    min: min,
    max: max,
    add: add,
    remove: remove,
    toString: toString
});

function init(self, initial) {
    self.ranges = null;
    if (initial instanceof T) {

    } else if (typeof initial === 'string') {
        if (initial.length > 0) {
            var prev;
            initial.split(',').forEach(rangeString => {
                var pair = rangeString.split(':');
                var lo = parseInt(pair[0]);
                var range = pair.length === 2 ? {lo: lo, hi: parseInt(pair[1])} : {lo: lo, hi: lo};
                if (prev) {
                    prev.next = range;
                } else {
                    self.ranges = range;
                }
                prev = range;
            });
        }
    }
}

function size(self) {
    let size = 0;
    for (let range = self.ranges; range; range = range.next) {
        size += range.hi - range.lo + 1;
        range = range.next;
    }
    return size;
}

function min(self) {
    return self.ranges.lo;
}

function max(self) {
    var range = self.ranges;
    while (range.next) range = range.next;
    return range.hi;
}

function add(self, lo, hi) {
    if (hi === undefined) {
        const element = lo;
        let prev = null;
        for (let range = self.ranges; range; range = range.next) {
            if (range.lo > element + 1) {
                if (prev) {
                    prev.next = {lo: element, hi: element, next: null};
                } else {
                    self.ranges = {lo: element, hi: element, next: null};
                }
                return true;
            } else if (range.lo === element + 1) {
                range.lo = element;
                return true;
            } else if (range.hi >= element) {
                return false;
            } else if (range.hi === element - 1) {
                range.hi = element;
                const next = range.next;
                if (next) {
                    if (next.lo === element + 1) {
                        range.hi = next.hi;
                        range.next = next.next;
                    }
                }
                return true;
            }
            prev = range;
        }
        if (prev) {
            prev.next = {lo: element, hi: element, next: null};
        } else {
            self.ranges = {lo: element, hi: element, next: null};
        }
        return true;
    } else {
        throw 'Not implemented yet!';
    }
}

function remove(self, lo, hi) {
    if (hi === undefined) {
        const element = lo;
        let prev = null;
        for (let range = self.ranges; range; range = range.next) {
            if (element < range.lo) {
                return false;
            } else if (element > range.hi) {
                prev = range;
                continue;
            } else if (range.lo === element) {
                if (range.hi === element) {
                    if (prev) {
                        prev.next = range.next;
                    } else {
                        self.ranges = range.next;
                    }
                } else {
                    range.lo = element + 1;
                }
                return true;
            } else if (range.hi === element) {
                range.hi = element - 1;
                return true;
            } else {
                const next = {lo: lo, hi: element - 1, range: null};
                range.lo = element + 1;
                if (prev) {
                    prev.next = next;
                } else {
                    self.ranges = next;
                }
                return true;
            }
        }
        return false;
    } else {
        throw 'Not implemented yet!';
    }
}

function toString(self) {
    let range = self.ranges;
    if (!range) return '';
    let string = range.lo.toString();
    if (range.hi > range.lo) string += ':' + range.hi.toString();
    while ((range = range.next)) {
        string += ',' + range.lo;
        if (range.hi > range.lo) string += ':' + range.hi.toString();
    }
    return string;
}
