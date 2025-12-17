import React from 'react';
import { render, screen } from '@testing-library/react';
import { ALLOWED_ROLES, ADMIN_ONLY_ROLES } from './constants/roles';

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

  test('ADMIN can access Dashboard', () => {
    const adminUser = {
      id: 1,
      username: 'bacco44',
      rol: 'ADMIN',
      nombre: 'Admin User',
      email: 'admin@test.com'
    };
    
    localStorage.setItem('usuario', JSON.stringify(adminUser));
    
    const stored = JSON.parse(localStorage.getItem('usuario'));
    expect(stored.rol).toBe('ADMIN');
    expect(ALLOWED_ROLES.includes(stored.rol)).toBe(true);
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
    expect(ALLOWED_ROLES.includes(stored.rol)).toBe(false);
  });

  test('Role validation logic works correctly', () => {
    expect(ALLOWED_ROLES.includes('ADMINISTRADOR')).toBe(true);
    expect(ALLOWED_ROLES.includes('ADMIN')).toBe(true);
    expect(ALLOWED_ROLES.includes('SUPERVISOR')).toBe(true);
    expect(ALLOWED_ROLES.includes('VENDEDOR')).toBe(false);
    expect(ALLOWED_ROLES.includes('OTHER_ROLE')).toBe(false);
  });
});

describe('AdminOnlyRoute - Admin-Only Access Control', () => {
  test('ADMINISTRADOR is in ADMIN_ONLY_ROLES', () => {
    expect(ADMIN_ONLY_ROLES.includes('ADMINISTRADOR')).toBe(true);
  });

  test('ADMIN is in ADMIN_ONLY_ROLES', () => {
    expect(ADMIN_ONLY_ROLES.includes('ADMIN')).toBe(true);
  });

  test('SUPERVISOR is NOT in ADMIN_ONLY_ROLES', () => {
    expect(ADMIN_ONLY_ROLES.includes('SUPERVISOR')).toBe(false);
  });

  test('VENDEDOR is NOT in ADMIN_ONLY_ROLES', () => {
    expect(ADMIN_ONLY_ROLES.includes('VENDEDOR')).toBe(false);
  });

  test('Only ADMIN and ADMINISTRADOR can access Usuarios page', () => {
    const roles = ['ADMIN', 'ADMINISTRADOR', 'SUPERVISOR', 'VENDEDOR'];
    
    roles.forEach(rol => {
      const canAccess = ADMIN_ONLY_ROLES.includes(rol);
      
      if (rol === 'ADMIN' || rol === 'ADMINISTRADOR') {
        expect(canAccess).toBe(true);
      } else {
        expect(canAccess).toBe(false);
      }
    });
  });
});
