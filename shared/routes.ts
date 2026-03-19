import { z } from 'zod';

export const errorSchemas = {
  validation: z.object({ message: z.string(), field: z.string().optional() }),
  notFound: z.object({ message: z.string() }),
  internal: z.object({ message: z.string() }),
};

export const api = {
  auth: {
    login: {
      method: 'POST' as const,
      path: '/api/auth/login' as const,
      input: z.object({ username: z.string(), password: z.string() }),
      responses: {
        200: z.object({ id: z.number(), username: z.string() }),
        401: errorSchemas.internal
      }
    },
    logout: {
      method: 'POST' as const,
      path: '/api/auth/logout' as const,
      responses: { 200: z.void() }
    },
    me: {
      method: 'GET' as const,
      path: '/api/auth/me' as const,
      responses: {
        200: z.object({ id: z.number(), username: z.string(), monthlyBudget: z.number() }).nullable(),
      }
    }
  },
  fixedExpenses: {
    list: { method: 'GET' as const, path: '/api/fixed-expenses' as const, responses: { 200: z.array(z.any()) } },
    create: { method: 'POST' as const, path: '/api/fixed-expenses' as const, input: z.any(), responses: { 201: z.any() } },
    update: { method: 'PUT' as const, path: '/api/fixed-expenses/:id' as const, input: z.any(), responses: { 200: z.any() } },
    delete: { method: 'DELETE' as const, path: '/api/fixed-expenses/:id' as const, responses: { 204: z.void() } },
  },
  variableExpenses: {
    list: { method: 'GET' as const, path: '/api/variable-expenses' as const, responses: { 200: z.array(z.any()) } },
    create: { method: 'POST' as const, path: '/api/variable-expenses' as const, input: z.any(), responses: { 201: z.any() } },
    update: { method: 'PUT' as const, path: '/api/variable-expenses/:id' as const, input: z.any(), responses: { 200: z.any() } },
    delete: { method: 'DELETE' as const, path: '/api/variable-expenses/:id' as const, responses: { 204: z.void() } },
  },
  creditCards: {
    list: { method: 'GET' as const, path: '/api/credit-cards' as const, responses: { 200: z.array(z.any()) } },
    create: { method: 'POST' as const, path: '/api/credit-cards' as const, input: z.any(), responses: { 201: z.any() } },
    update: { method: 'PUT' as const, path: '/api/credit-cards/:id' as const, input: z.any(), responses: { 200: z.any() } },
    delete: { method: 'DELETE' as const, path: '/api/credit-cards/:id' as const, responses: { 204: z.void() } },
  },
  loans: {
    list: { method: 'GET' as const, path: '/api/loans' as const, responses: { 200: z.array(z.any()) } },
    create: { method: 'POST' as const, path: '/api/loans' as const, input: z.any(), responses: { 201: z.any() } },
    update: { method: 'PUT' as const, path: '/api/loans/:id' as const, input: z.any(), responses: { 200: z.any() } },
    delete: { method: 'DELETE' as const, path: '/api/loans/:id' as const, responses: { 204: z.void() } },
  },
  fixedIncomes: {
    list: { method: 'GET' as const, path: '/api/fixed-incomes' as const, responses: { 200: z.array(z.any()) } },
    create: { method: 'POST' as const, path: '/api/fixed-incomes' as const, input: z.any(), responses: { 201: z.any() } },
    update: { method: 'PUT' as const, path: '/api/fixed-incomes/:id' as const, input: z.any(), responses: { 200: z.any() } },
    delete: { method: 'DELETE' as const, path: '/api/fixed-incomes/:id' as const, responses: { 204: z.void() } },
  },
  variableIncomes: {
    list: { method: 'GET' as const, path: '/api/variable-incomes' as const, responses: { 200: z.array(z.any()) } },
    create: { method: 'POST' as const, path: '/api/variable-incomes' as const, input: z.any(), responses: { 201: z.any() } },
    update: { method: 'PUT' as const, path: '/api/variable-incomes/:id' as const, input: z.any(), responses: { 200: z.any() } },
    delete: { method: 'DELETE' as const, path: '/api/variable-incomes/:id' as const, responses: { 204: z.void() } },
  },
  expectedIncomes: {
    list: { method: 'GET' as const, path: '/api/expected-incomes' as const, responses: { 200: z.array(z.any()) } },
    create: { method: 'POST' as const, path: '/api/expected-incomes' as const, input: z.any(), responses: { 201: z.any() } },
    approve: { method: 'PUT' as const, path: '/api/expected-incomes/:id/approve' as const, responses: { 200: z.any() } },
    delete: { method: 'DELETE' as const, path: '/api/expected-incomes/:id' as const, responses: { 204: z.void() } },
  },
  wallets: {
    list: { method: 'GET' as const, path: '/api/wallets' as const, responses: { 200: z.array(z.any()) } },
    update: { method: 'PUT' as const, path: '/api/wallets/:id' as const, input: z.any(), responses: { 200: z.any() } },
  },
  chat: {
    message: {
      method: 'POST' as const,
      path: '/api/chat' as const,
      input: z.object({ message: z.string() }),
      responses: { 200: z.object({ response: z.string() }), 500: errorSchemas.internal }
    }
  }
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
