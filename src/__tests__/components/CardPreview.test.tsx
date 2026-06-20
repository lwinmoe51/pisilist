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
    color: null,
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

  it('should show unchecked task names when tasks exist', async () => {
    const card = makeCard();
    const screen = await renderWithTheme(
      <CardPreview
        card={card}
        cardWidth={200}
        taskCount={5}
        completedCount={0}
        uncheckedTasks={['Buy milk', 'Walk dog', 'Call mom', 'Do laundry', 'Clean kitchen']}
        onPress={jest.fn()}
      />,
    );

    expect(screen.getByText('Buy milk')).toBeTruthy();
    expect(screen.getByText('Walk dog')).toBeTruthy();
    expect(screen.getByText('Call mom')).toBeTruthy();
    expect(screen.getByText('+2 more')).toBeTruthy();
  });

  it('should show progress count', async () => {
    const card = makeCard();
    const screen = await renderWithTheme(
      <CardPreview
        card={card}
        cardWidth={200}
        taskCount={5}
        completedCount={3}
        uncheckedTasks={['Task 1', 'Task 2']}
        onPress={jest.fn()}
      />,
    );

    expect(screen.getByText(/3\/5/)).toBeTruthy();
  });

  it('should show no "more" when 3 or fewer unchecked tasks', async () => {
    const card = makeCard();
    const screen = await renderWithTheme(
      <CardPreview
        card={card}
        cardWidth={200}
        taskCount={3}
        completedCount={0}
        uncheckedTasks={['A', 'B', 'C']}
        onPress={jest.fn()}
      />,
    );

    expect(screen.getByText('A')).toBeTruthy();
    expect(screen.getByText('B')).toBeTruthy();
    expect(screen.getByText('C')).toBeTruthy();
    expect(screen.queryByText(/more/)).toBeNull();
  });

  it('should not show "No tasks yet" when tasks exist', async () => {
    const card = makeCard();
    const screen = await renderWithTheme(
      <CardPreview
        card={card}
        cardWidth={200}
        taskCount={2}
        uncheckedTasks={['X', 'Y']}
        onPress={jest.fn()}
      />,
    );

    expect(screen.queryByText('No tasks yet')).toBeNull();
  });

  it('should show pinned icon when card is pinned', async () => {
    const card = makeCard({ pinned: true });
    const screen = await renderWithTheme(
      <CardPreview card={card} cardWidth={200} onPress={jest.fn()} />,
    );

    // Pin icon in title row + pin button in footer
    const pins = screen.getAllByText('📌');
    expect(pins.length).toBeGreaterThanOrEqual(1);
  });

  it('should not show pinned icon in title when card is not pinned', async () => {
    const card = makeCard({ pinned: false });
    const screen = await renderWithTheme(
      <CardPreview card={card} cardWidth={200} onPress={jest.fn()} />,
    );

    // Footer pin button shows 📍 for unpinned, so check title area has no 📌
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
