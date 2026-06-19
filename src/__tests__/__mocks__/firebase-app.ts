/**
 * Spy-enhanced mock of firebase/app for API contract tests.
 */

export const initializeApp = jest.fn((_config: any) => ({
  name: 'mock-app',
  options: _config,
}));

export const getApps = jest.fn(() => []);

/** Reset all mock call history and implementation chains between tests. */
export function resetAllAppMocks(): void {
  initializeApp.mockReset();
  getApps.mockReset();

  initializeApp.mockImplementation((_config: any) => ({
    name: 'mock-app',
    options: _config,
  }));
  getApps.mockReturnValue([]);
}
