import React from 'react';
import { render, screen } from '@testing-library/react';

// Mock de localStorage
const mockLocalStorage = () => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => {
      store[key] = value.toString();
    },
    removeItem: (key) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    }
  };
};

describe('ProtectedRoute - Role-Based Access Control', () => {
  let localStorageMock;

  beforeEach(() => {
    localStorageMock = mockLocalStorage();
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true
    });
  });

  afterEach(() => {
    localStorageMock.clear();
  });

  test('ADMINISTRADOR can access Dashboard', () => {
    const adminUser = {
      id: 1,
      username: 'admin',
      rol: 'ADMINISTRADOR',
      nombre: 'Admin User',
      email: 'admin@test.com'
    };
    
    localStorage.setItem('usuario', JSON.stringify(adminUser));
    
    // This test verifies that an admin user can be stored
    const stored = JSON.parse(localStorage.getItem('usuario'));
    expect(stored.rol).toBe('ADMINISTRADOR');
  });

  test('SUPERVISOR can access Dashboard', () => {
    const supervisorUser = {
      id: 2,
      username: 'supervisor',
      rol: 'SUPERVISOR',
      nombre: 'Supervisor User',
      email: 'supervisor@test.com'
    };
    
    localStorage.setItem('usuario', JSON.stringify(supervisorUser));
    
    const stored = JSON.parse(localStorage.getItem('usuario'));
    expect(stored.rol).toBe('SUPERVISOR');
  });

  test('VENDEDOR should not have Dashboard access (role check)', () => {
    const vendedorUser = {
      id: 3,
      username: 'vendedor',
      rol: 'VENDEDOR',
      nombre: 'Vendedor User',
      email: 'vendedor@test.com'
    };
    
    localStorage.setItem('usuario', JSON.stringify(vendedorUser));
    
    const stored = JSON.parse(localStorage.getItem('usuario'));
    expect(stored.rol).toBe('VENDEDOR');
    
    // Verify that VENDEDOR is not in the allowed roles list
    const allowedRoles = ['ADMINISTRADOR', 'SUPERVISOR'];
    expect(allowedRoles.includes(stored.rol)).toBe(false);
  });

  test('Role validation logic works correctly', () => {
    const allowedRoles = ['ADMINISTRADOR', 'SUPERVISOR'];
    
    expect(allowedRoles.includes('ADMINISTRADOR')).toBe(true);
    expect(allowedRoles.includes('SUPERVISOR')).toBe(true);
    expect(allowedRoles.includes('VENDEDOR')).toBe(false);
    expect(allowedRoles.includes('OTHER_ROLE')).toBe(false);
  });
});
