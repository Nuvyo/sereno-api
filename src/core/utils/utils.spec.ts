import { test } from 'node:test';
import assert from 'node:assert/strict';
import { daysInMilliseconds } from './utils';

test('daysInMilliseconds retorna 0 para 0 dias', () => {
	assert.equal(daysInMilliseconds(0), 0);
});

test('daysInMilliseconds converte 1 dia corretamente', () => {
	assert.equal(daysInMilliseconds(1), 24 * 60 * 60 * 1000);
});

test('daysInMilliseconds suporta valores fracionários', () => {
	const halfDayMs = 0.5 * 24 * 60 * 60 * 1000;
	assert.equal(daysInMilliseconds(0.5), halfDayMs);
});

test('daysInMilliseconds lida com valores negativos', () => {
	const minusOneDay = -1 * 24 * 60 * 60 * 1000;
	assert.equal(daysInMilliseconds(-1), minusOneDay);
});
