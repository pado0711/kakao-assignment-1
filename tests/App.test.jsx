import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../src/App.jsx';
import { STORAGE_KEY } from '../src/features/todo/todoConstants.js';

const setup = () => {
  const user = userEvent.setup();
  render(<App />);
  return { user };
};

const addTodo = async (user, content, date) => {
  await user.clear(screen.getByLabelText('할 일'));
  await user.type(screen.getByLabelText('할 일'), content);
  if (date) {
    await user.clear(screen.getByLabelText('날짜'));
    await user.type(screen.getByLabelText('날짜'), date);
  }
  await user.click(screen.getByRole('button', { name: '추가' }));
};

const closeModal = async (user) => {
  await user.click(screen.getByRole('button', { name: '확인' }));
};

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
});

describe('App todo interactions', () => {
  it('adds a todo for valid input', async () => {
    const { user } = setup();

    await addTodo(user, '테스트 할 일');

    expect(screen.getByText('테스트 할 일')).toBeInTheDocument();
  });

  it('shows a modal and does not add a todo for empty input', async () => {
    const { user } = setup();

    await user.click(screen.getByRole('button', { name: '추가' }));

    expect(screen.getByRole('alertdialog')).toHaveTextContent('할 일을 입력해 주세요.');
    expect(screen.getByText('해당 조건의 할 일이 없습니다.')).toBeInTheDocument();
  });

  it('shows a modal and does not add a todo for content longer than 50 characters', async () => {
    const { user } = setup();

    await addTodo(user, '가'.repeat(51));

    expect(screen.getByRole('alertdialog')).toHaveTextContent('할 일은 50자 이내로 입력해 주세요.');
    expect(screen.getByText('해당 조건의 할 일이 없습니다.')).toBeInTheDocument();
  });

  it('keeps date view and status filter independent', async () => {
    const { user } = setup();

    await addTodo(user, '오늘 할 일');
    await addTodo(user, '다른 날짜 할 일', '2026-06-01');
    expect(screen.queryByText('오늘 할 일')).not.toBeInTheDocument();
    expect(screen.getByText('다른 날짜 할 일')).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: '전체' }));

    expect(screen.getByText('오늘 할 일')).toBeInTheDocument();
    expect(screen.getByText('다른 날짜 할 일')).toBeInTheDocument();
  });

  it('updates a todo with Enter and cancels editing with Escape', async () => {
    const { user } = setup();

    await addTodo(user, '수정 전');
    await user.click(screen.getByRole('button', { name: '수정' }));
    await user.clear(screen.getByLabelText('할 일 수정'));
    await user.type(screen.getByLabelText('할 일 수정'), '수정 후{Enter}');

    expect(screen.getByText('수정 후')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '수정' }));
    await user.clear(screen.getByLabelText('할 일 수정'));
    await user.type(screen.getByLabelText('할 일 수정'), '취소할 내용{Escape}');

    expect(screen.getByText('수정 후')).toBeInTheDocument();
    expect(screen.queryByText('취소할 내용')).not.toBeInTheDocument();
  });

  it('updates a todo when the edit button is clicked again while editing', async () => {
    const { user } = setup();

    await addTodo(user, '버튼 수정 전');
    await user.click(screen.getByRole('button', { name: '수정' }));
    await user.clear(screen.getByLabelText('할 일 수정'));
    await user.type(screen.getByLabelText('할 일 수정'), '버튼 수정 후');
    await user.click(screen.getByRole('button', { name: '수정' }));

    expect(screen.getByText('버튼 수정 후')).toBeInTheDocument();
    expect(screen.queryByText('버튼 수정 전')).not.toBeInTheDocument();
  });

  it('shows a modal and keeps existing text when editing to an empty value', async () => {
    const { user } = setup();

    await addTodo(user, '유지할 할 일');
    await user.click(screen.getByRole('button', { name: '수정' }));
    await user.clear(screen.getByLabelText('할 일 수정'));
    await user.keyboard('{Enter}');

    expect(screen.getByRole('alertdialog')).toHaveTextContent('할 일을 입력해 주세요.');
    await closeModal(user);
    await user.click(screen.getByLabelText('할 일 수정'));
    await user.keyboard('{Escape}');
    expect(screen.getByText('유지할 할 일')).toBeInTheDocument();
  });

  it('toggles completion and updates the completed filter immediately', async () => {
    const { user } = setup();

    await addTodo(user, '완료할 일');
    await user.click(screen.getByLabelText('완료할 일 완료 처리'));
    await user.click(screen.getByRole('tab', { name: '완료' }));

    expect(screen.getByText('완료할 일')).toBeInTheDocument();

    await user.click(screen.getByLabelText('완료할 일 완료 처리'));

    expect(screen.getByText('해당 조건의 할 일이 없습니다.')).toBeInTheDocument();
  });

  it('keeps a todo when delete confirm is canceled and removes it when confirmed', async () => {
    const { user } = setup();
    const confirmSpy = vi.spyOn(window, 'confirm');

    await addTodo(user, '삭제 대상');

    confirmSpy.mockReturnValueOnce(false);
    await user.click(screen.getByRole('button', { name: '삭제' }));
    expect(screen.getByText('삭제 대상')).toBeInTheDocument();

    confirmSpy.mockReturnValueOnce(true);
    await user.click(screen.getByRole('button', { name: '삭제' }));
    expect(screen.queryByText('삭제 대상')).not.toBeInTheDocument();
  });

  it('shows pagination for more than six todos and resets to page one after date/filter changes', async () => {
    const { user } = setup();

    for (let index = 1; index <= 7; index += 1) {
      await addTodo(user, `페이지 할 일 ${index}`);
    }

    expect(screen.getByRole('button', { name: '2' })).toBeInTheDocument();
    expect(screen.queryByText('페이지 할 일 1')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '2' }));
    expect(screen.getByText('페이지 할 일 1')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '이전 날짜' }));
    expect(screen.queryByRole('button', { name: '2' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: '전체' }));
    expect(screen.queryByText('페이지 할 일 1')).not.toBeInTheDocument();
  });

  it('shows a modal for damaged localStorage data', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    localStorage.setItem(STORAGE_KEY, 'INVALID_JSON');

    setup();

    expect(screen.getByRole('alertdialog')).toHaveTextContent('저장된 데이터를 읽을 수 없어 빈 목록으로 시작합니다.');
    consoleSpy.mockRestore();
  });

  it('normalizes legacy localStorage data and writes the recovered shape back', async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([{
      id: 'legacy-1',
      content: '기존 데이터',
      date: '2026-06-10',
      createdAt: 1,
      updatedAt: 1,
      state: '완료',
    }]));

    setup();

    expect(screen.getByText('기존 데이터')).toBeInTheDocument();
    await waitFor(() => {
      expect(JSON.parse(localStorage.getItem(STORAGE_KEY))[0]).toMatchObject({
        status: 'completed',
        state: '완료',
      });
    });
  });

  it('shows a modal when saving to localStorage fails', async () => {
    const { user } = setup();
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('Quota exceeded', 'QuotaExceededError');
    });

    await addTodo(user, '저장 실패');

    await waitFor(() => {
      expect(screen.getByRole('alertdialog')).toHaveTextContent('변경사항을 저장하지 못했습니다.');
    });
    consoleSpy.mockRestore();
  });

  it('shows unavailable storage notice when localStorage cannot be used', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('Blocked', 'SecurityError');
    });

    setup();

    expect(screen.getByRole('status')).toHaveTextContent('저장 불가 모드');
    expect(screen.getByRole('alertdialog')).toHaveTextContent('로컬스토리지를 사용할 수 없어 변경사항이 저장되지 않습니다.');
  });
});
