/// <reference types="jest" />

import {
  formatDate,
  formatNumber,
  formatCurrency,
  formatPercent,
  formatDecimal,
  truncate,
  capitalize,
  pluralize,
} from './format';

describe('Format Utilities', () => {
  describe('formatDate', () => {
    it('should format date correctly', () => {
      const date = new Date(2025, 0, 15); // Month is 0-indexed
      const result = formatDate(date);
      expect(result).toBe('January 15, 2025');
    });
  });

  describe('formatNumber', () => {
    it('should format numbers with commas', () => {
      expect(formatNumber(1000)).toBe('1,000');
      expect(formatNumber(1000000)).toBe('1,000,000');
    });
  });

  describe('formatCurrency', () => {
    it('should format currency', () => {
      expect(formatCurrency(99.99)).toBe('$99.99');
      expect(formatCurrency(1000)).toBe('$1,000.00');
    });
  });

  describe('formatPercent', () => {
    it('should format percentages', () => {
      expect(formatPercent(0.5)).toBe('50.0%');
      expect(formatPercent(0.123, 2)).toBe('12.30%');
    });
  });

  describe('formatDecimal', () => {
    it('should format decimals', () => {
      expect(formatDecimal(1.2345)).toBe('1.23');
      expect(formatDecimal(1.2355, 3)).toBe('1.236');
    });
  });

  describe('truncate', () => {
    it('should truncate long strings', () => {
      expect(truncate('Hello World', 5)).toBe('Hello...');
    });

    it('should not truncate short strings', () => {
      expect(truncate('Hi', 10)).toBe('Hi');
    });
  });

  describe('capitalize', () => {
    it('should capitalize first letter', () => {
      expect(capitalize('hello')).toBe('Hello');
      expect(capitalize('WORLD')).toBe('World');
    });
  });

  describe('pluralize', () => {
    it('should return singular for count of 1', () => {
      expect(pluralize(1, 'item')).toBe('item');
    });

    it('should return plural for count other than 1', () => {
      expect(pluralize(2, 'item')).toBe('items');
      expect(pluralize(0, 'item')).toBe('items');
    });

    it('should use custom plural form', () => {
      expect(pluralize(2, 'person', 'people')).toBe('people');
    });
  });
});
