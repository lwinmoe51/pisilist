/**
 * CardPreview component tests.
 *
 * Uses @testing-library/react-native v14 (async render).
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ThemeProvider } from '../../theme/ThemeContext';
import CardPreview from '../../components/CardPreview';
import type { Card } from '../../types';

function makeCard(overrides: Partial<Card> = {}): Card {
  return {
    id: 'card-1',
    title: 'Test Card',
    ownerId: 'user-1',
    collaborators: [],
    pinned: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
}

describe('CardPreview', () => {
  it('should render the card title', async () => {
    const card = makeCard({ title: 'My Groceries' });
    const screen = await renderWithTheme(
      <CardPreview card={card} cardWidth={200} onPress={jest.fn()} />,
    );

    expect(screen.getByText('My Groceries')).toBeTruthy();
  });

  it('should show "No tasks yet" when taskCount is 0', async () => {
    const card = makeCard();
    const screen = await renderWithTheme(
      <CardPreview card={card} cardWidth={200} taskCount={0} onPress={jest.fn()} />,
    );

    expect(screen.getByText('No tasks yet')).toBeTruthy();
  });

  it('should show tasks remaining when there are unchecked tasks', async () => {
    const card = makeCard();
    const screen = await renderWithTheme(
      <CardPreview
        card={card}
        cardWidth={200}
        taskCount={5}
        completedCount={2}
        onPress={jest.fn()}
      />,
    );

    expect(screen.getByText('3 tasks remaining')).toBeTruthy();
  });

  it('should show singular "task" when exactly 1 unchecked', async () => {
    const card = makeCard();
    const screen = await renderWithTheme(
      <CardPreview
        card={card}
        cardWidth={200}
        taskCount={3}
        completedCount={2}
        onPress={jest.fn()}
      />,
    );

    expect(screen.getByText('1 task remaining')).toBeTruthy();
  });

  it('should show completed count when > 0', async () => {
    const card = makeCard();
    const screen = await renderWithTheme(
      <CardPreview
        card={card}
        cardWidth={200}
        taskCount={5}
        completedCount={3}
        onPress={jest.fn()}
      />,
    );

    expect(screen.getByText('3 checked')).toBeTruthy();
  });

  it('should not show "No tasks yet" when tasks exist', async () => {
    const card = makeCard();
    const screen = await renderWithTheme(
      <CardPreview card={card} cardWidth={200} taskCount={2} onPress={jest.fn()} />,
    );

    expect(screen.queryByText('No tasks yet')).toBeNull();
  });

  it('should show pinned icon when card is pinned', async () => {
    const card = makeCard({ pinned: true });
    const screen = await renderWithTheme(
      <CardPreview card={card} cardWidth={200} onPress={jest.fn()} />,
    );

    expect(screen.getByText('📌')).toBeTruthy();
  });

  it('should not show pinned icon when card is not pinned', async () => {
    const card = makeCard({ pinned: false });
    const screen = await renderWithTheme(
      <CardPreview card={card} cardWidth={200} onPress={jest.fn()} />,
    );

    expect(screen.queryByText('📌')).toBeNull();
  });

  it('should show "Shared with you" when card is shared', async () => {
    const card = makeCard({
      ownerId: 'other-user',
      collaborators: ['user-1'],
    });
    const screen = await renderWithTheme(
      <CardPreview
        card={card}
        cardWidth={200}
        currentUserId="user-1"
        onPress={jest.fn()}
      />,
    );

    expect(screen.getByText('↗ Shared with you')).toBeTruthy();
  });

  it('should NOT show "Shared with you" for own cards', async () => {
    const card = makeCard({ ownerId: 'user-1' });
    const screen = await renderWithTheme(
      <CardPreview
        card={card}
        cardWidth={200}
        currentUserId="user-1"
        onPress={jest.fn()}
      />,
    );

    expect(screen.queryByText('↗ Shared with you')).toBeNull();
  });

  it('should show collaborator count badge when there are collaborators', async () => {
    const card = makeCard({ collaborators: ['user-2', 'user-3'] });
    const screen = await renderWithTheme(
      <CardPreview card={card} cardWidth={200} onPress={jest.fn()} />,
    );

    expect(screen.getByText('👥 2')).toBeTruthy();
  });

  it('should not show collaborator badge when no collaborators', async () => {
    const card = makeCard({ collaborators: [] });
    const screen = await renderWithTheme(
      <CardPreview card={card} cardWidth={200} onPress={jest.fn()} />,
    );

    expect(screen.queryByText(/👥/)).toBeNull();
  });

  it('should call onPress when tapped', async () => {
    const onPress = jest.fn();
    const card = makeCard();
    const screen = await renderWithTheme(
      <CardPreview card={card} cardWidth={200} onPress={onPress} />,
    );

    fireEvent.press(screen.getByText('Test Card'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
