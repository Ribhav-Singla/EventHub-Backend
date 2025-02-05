"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.categorizeAge = void 0;
const categorizeAge = (age) => {
    if (age < 15)
        return '<15 age';
    if (age < 30)
        return '15-29 age';
    if (age < 45)
        return '30-44 age';
    if (age < 60)
        return '45-59 age';
    if (age < 75)
        return '60-74 age';
    if (age < 90)
        return '75-89 age';
    return '90+ age';
};
exports.categorizeAge = categorizeAge;
