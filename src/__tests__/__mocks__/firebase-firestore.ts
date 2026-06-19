/** Minimal mock of firebase/firestore for unit tests. */

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

export function getFirestore() {
  return {};
}

export function collection() {
  return {};
}

export function doc() {
  return {};
}

export function addDoc() {
  return Promise.resolve({ id: 'mock-doc-id' });
}

export function updateDoc() {
  return Promise.resolve();
}

export function deleteDoc() {
  return Promise.resolve();
}

export function getDoc() {
  return Promise.resolve({ exists: () => false, id: 'mock', data: () => ({}) });
}

export function getDocs() {
  return Promise.resolve({ empty: true, docs: [] });
}

export function setDoc() {
  return Promise.resolve();
}

export function query() {
  return {};
}

export function where() {
  return {};
}

export function orderBy() {
  return {};
}

export function limit() {
  return {};
}

export function onSnapshot() {
  return () => {}; // unsubscribe
}

export function writeBatch() {
  return {
    set: () => {},
    update: () => {},
    delete: () => {},
    commit: () => Promise.resolve(),
  };
}

export function serverTimestamp() {
  return Timestamp.fromDate(new Date());
}

export function increment(n: number) {
  return n;
}

export function arrayUnion(...items: any[]) {
  return items;
}
