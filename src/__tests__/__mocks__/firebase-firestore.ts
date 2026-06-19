/**
 * Spy-enhanced mock of firebase/firestore for API contract tests.
 *
 * Every exported function is a jest.fn() so tests can assert
 * `.toHaveBeenCalledWith()` on the exact Firestore SDK calls.
 */
/* eslint-disable @typescript-eslint/no-unused-vars */

// ── Timestamp ──────────────────────────────────────────────────────

export class Timestamp {
  constructor(
    public readonly seconds: number,
    public readonly nanoseconds: number,
  ) {}

  static fromDate(date: Date): Timestamp {
    return new Timestamp(
      Math.floor(date.getTime() / 1000),
      (date.getTime() % 1000) * 1e6,
    );
  }

  toDate(): Date {
    return new Date(this.seconds * 1000 + this.nanoseconds / 1e6);
  }
}

// ── Init ───────────────────────────────────────────────────────────

export const getFirestore = jest.fn(() => ({}));

// ── References ─────────────────────────────────────────────────────

export const collection = jest.fn((_db: any, ...pathSegments: string[]) => ({
  _type: 'collection',
  path: pathSegments.join('/'),
}));

export const doc = jest.fn((...args: any[]) => {
  // doc(db, 'collection', 'id') or doc(db, 'collection/id/subcollection', 'id')
  const db = args[0];
  const rest = args.slice(1);
  return { _type: 'doc', path: rest.join('/') };
});

// ── CRUD operations ────────────────────────────────────────────────

export const addDoc = jest.fn((_collectionRef: any, _data: any) =>
  Promise.resolve({ id: 'mock-doc-id' }),
);

export const updateDoc = jest.fn((_docRef: any, _data: any) =>
  Promise.resolve(),
);

export const deleteDoc = jest.fn((_docRef: any) => Promise.resolve());

export const setDoc = jest.fn(
  (_docRef: any, _data: any, _options?: any) => Promise.resolve(),
);

export const getDoc = jest.fn((_docRef: any) =>
  Promise.resolve({ exists: () => false, id: 'mock', data: () => ({}) }),
);

export const getDocs = jest.fn((_query: any) =>
  Promise.resolve({ empty: true, docs: [] }),
);

// ── Query building ─────────────────────────────────────────────────

export const query = jest.fn((_ref: any, ...constraints: any[]) => ({
  _type: 'query',
  constraints,
}));

export const where = jest.fn(
  (fieldPath: string, opStr: string, value: any) => ({
    _type: 'where',
    fieldPath,
    opStr,
    value,
  }),
);

export const orderBy = jest.fn((fieldPath: string, directionStr?: string) => ({
  _type: 'orderBy',
  fieldPath,
  directionStr,
}));

export const limit = jest.fn((n: number) => ({ _type: 'limit', n }));

// ── Real-time listeners ────────────────────────────────────────────

export const onSnapshot = jest.fn((_query: any, _onNext: any, _onError?: any) => {
  const unsubscribe = jest.fn();
  return unsubscribe;
});

// ── Batch writes ───────────────────────────────────────────────────

export const writeBatch = jest.fn((_db: any) => ({
  set: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  commit: jest.fn(() => Promise.resolve()),
}));

// ── Helpers ────────────────────────────────────────────────────────

export const serverTimestamp = jest.fn(() => Timestamp.fromDate(new Date()));

export const increment = jest.fn((n: number) => n);

export const arrayUnion = jest.fn((...items: any[]) => items);

// ── Test utilities ─────────────────────────────────────────────────

/**
 * Reset all mock call history AND implementation chains (mockResolvedValueOnce etc.)
 * between tests, then re-apply default implementations.
 */
export function resetAllFirestoreMocks(): void {
  // Reset clears calls AND implementation chains
  getFirestore.mockReset();
  collection.mockReset();
  doc.mockReset();
  addDoc.mockReset();
  updateDoc.mockReset();
  deleteDoc.mockReset();
  setDoc.mockReset();
  getDoc.mockReset();
  getDocs.mockReset();
  query.mockReset();
  where.mockReset();
  orderBy.mockReset();
  limit.mockReset();
  onSnapshot.mockReset();
  writeBatch.mockReset();
  serverTimestamp.mockReset();
  increment.mockReset();
  arrayUnion.mockReset();

  // Re-apply default implementations
  getFirestore.mockReturnValue({});
  collection.mockImplementation((_db: any, ...pathSegments: string[]) => ({
    _type: 'collection',
    path: pathSegments.join('/'),
  }));
  doc.mockImplementation((...args: any[]) => {
    const rest = args.slice(1);
    return { _type: 'doc', path: rest.join('/') };
  });
  addDoc.mockResolvedValue({ id: 'mock-doc-id' });
  updateDoc.mockResolvedValue(undefined);
  deleteDoc.mockResolvedValue(undefined);
  setDoc.mockResolvedValue(undefined);
  getDoc.mockResolvedValue({ exists: () => false, id: 'mock', data: () => ({}) });
  getDocs.mockResolvedValue({ empty: true, docs: [] });
  query.mockImplementation((_ref: any, ...constraints: any[]) => ({
    _type: 'query',
    constraints,
  }));
  where.mockImplementation((fieldPath: string, opStr: string, value: any) => ({
    _type: 'where',
    fieldPath,
    opStr,
    value,
  }));
  orderBy.mockImplementation((fieldPath: string, directionStr?: string) => ({
    _type: 'orderBy',
    fieldPath,
    directionStr,
  }));
  limit.mockImplementation((n: number) => ({ _type: 'limit', n }));
  onSnapshot.mockImplementation((_query: any, _onNext: any, _onError?: any) => {
    const unsubscribe = jest.fn();
    return unsubscribe;
  });
  writeBatch.mockImplementation((_db: any) => ({
    set: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    commit: jest.fn(() => Promise.resolve()),
  }));
  serverTimestamp.mockReturnValue(Timestamp.fromDate(new Date()));
  increment.mockImplementation((n: number) => n);
  arrayUnion.mockImplementation((...items: any[]) => items);
}
