// @vitest-environment jsdom
// Specs for the workbench atoms ported from the fork-local kit: pager,
// paginator hook, results table + row-delete button, form-card pieces,
// clipped tag list, and the sidebar foot trigger/modal chrome.
import { useCallback, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  DataTable,
  DeleteRowButton,
  EmptyState,
  ErrorBanner,
  FormActions,
  FormCard,
  FormError,
  FormField,
  FormFieldGroup,
  FormFooter,
  ListPager,
  Pagination,
  pagerLabels,
  parseTags,
  ResultsTable,
  SearchField,
  SidebarFootAction,
  SidebarFootModal,
  SidebarGroupsContext,
  type SidebarGroupsApi,
  TagList,
  TagsField,
  TextField,
  usePagination,
} from '@deepseek-ai/dsh-client-ui-primitives'

afterEach(cleanup)

describe('TagList', () => {
  it('renders nothing for an empty tag list', () => {
    const { container } = render(<TagList tags={[]} />)
    expect(container.childNodes).toHaveLength(0)
  })

  it('renders one pill per tag and shows the full list in a hover tooltip', () => {
    render(<TagList tags={['美食', '探店', 'AI']} />)
    expect(screen.getByText('美食')).toBeDefined()
    expect(screen.getByText('探店')).toBeDefined()
    expect(screen.getByText('AI')).toBeDefined()
    const anchor = screen.getByText('美食').parentElement as HTMLElement
    fireEvent.pointerEnter(anchor)
    expect(screen.getByRole('tooltip').textContent).toBe('美食，探店，AI')
    fireEvent.pointerLeave(anchor)
    expect(screen.queryByRole('tooltip')).toBeNull()
  })
})

describe('Pagination', () => {
  const labels = {
    nav: 'Pagination',
    prev: 'Prev',
    next: 'Next',
    page: (n: number) => `Page ${n}`,
  }

  it('renders one button per page and disables the edges at the bounds', () => {
    render(<Pagination page={1} pageCount={3} onPageChange={() => {}} labels={labels} />)
    expect(screen.getByRole('navigation', { name: 'Pagination' })).toBeDefined()
    expect(screen.getByRole<HTMLButtonElement>('button', { name: 'Prev' }).disabled).toBe(true)
    expect(screen.getByRole<HTMLButtonElement>('button', { name: 'Next' }).disabled).toBe(false)
    expect(screen.getByRole('button', { name: 'Page 1' }).getAttribute('aria-current')).toBe('page')
    expect(screen.getByRole('button', { name: 'Page 3' }).getAttribute('aria-current')).toBeNull()
  })

  it('fires onPageChange with the target page', () => {
    const onPageChange = vi.fn()
    render(<Pagination page={2} pageCount={3} onPageChange={onPageChange} labels={labels} />)
    fireEvent.click(screen.getByRole<HTMLButtonElement>('button', { name: 'Next' }))
    expect(onPageChange).toHaveBeenCalledWith(3)
    fireEvent.click(screen.getByRole<HTMLButtonElement>('button', { name: 'Prev' }))
    expect(onPageChange).toHaveBeenCalledWith(1)
    fireEvent.click(screen.getByRole('button', { name: 'Page 3' }))
    expect(onPageChange).toHaveBeenCalledWith(3)
  })

  it('clamps an out-of-range page and a sub-one page count', () => {
    const onPageChange = vi.fn()
    const { rerender } = render(
      <Pagination page={9} pageCount={3} onPageChange={onPageChange} labels={labels} />,
    )
    // page 9 clamps to the last page (3): Next is disabled and page 3 is current.
    expect(screen.getByRole<HTMLButtonElement>('button', { name: 'Next' }).disabled).toBe(true)
    expect(screen.getByRole('button', { name: 'Page 3' }).getAttribute('aria-current')).toBe('page')

    rerender(<Pagination page={1} pageCount={0} onPageChange={onPageChange} labels={labels} />)
    // pageCount 0 clamps to 1: one page button, both edges disabled.
    expect(screen.getAllByRole('button', { name: /^Page / })).toHaveLength(1)
    expect(screen.getByRole<HTMLButtonElement>('button', { name: 'Prev' }).disabled).toBe(true)
    expect(screen.getByRole<HTMLButtonElement>('button', { name: 'Next' }).disabled).toBe(true)
  })

  it('builds labels from a namespace translator carrying the shared pager keys', () => {
    const dict: Record<string, string> = {
      'pager.nav': '分页导航',
      'pager.prev': '上一页',
      'pager.next': '下一页',
      'pager.page': '第 {page} 页',
    }
    const fakeT = (
      key: 'pager.nav' | 'pager.prev' | 'pager.next' | 'pager.page',
      params?: { page?: number },
    ): string => dict[key]!.replace('{page}', String(params?.page ?? ''))
    const built = pagerLabels(fakeT)
    expect(built.nav).toBe('分页导航')
    expect(built.prev).toBe('上一页')
    expect(built.next).toBe('下一页')
    expect(built.page(7)).toBe('第 7 页')
  })
})

describe('usePagination', () => {
  function Harness(props: { items: readonly number[]; resetKey: string }) {
    const { page, pageCount, paged, setPage } = usePagination(props.items, 5, props.resetKey)
    return (
      <div>
        <span data-testid="meta">page {page} of {pageCount}: {paged.join(',')}</span>
        <button type="button" onClick={() => { setPage(page + 1) }}>next</button>
      </div>
    )
  }

  it('slices pages, resets on the filter key, and clamps a shrinking last page', () => {
    const items = Array.from({ length: 10 }, (_, index) => index + 1)
    const { rerender } = render(<Harness items={items} resetKey="all" />)
    expect(screen.getByTestId('meta').textContent).toBe('page 1 of 2: 1,2,3,4,5')

    fireEvent.click(screen.getByRole('button', { name: 'next' }))
    expect(screen.getByTestId('meta').textContent).toBe('page 2 of 2: 6,7,8,9,10')

    // A changed filter key restarts from page one.
    rerender(<Harness items={items} resetKey="filtered" />)
    expect(screen.getByTestId('meta').textContent).toBe('page 1 of 2: 1,2,3,4,5')

    // From page two of a six-item list, shrinking to five clamps back to page one.
    rerender(<Harness items={items.slice(0, 6)} resetKey="filtered" />)
    fireEvent.click(screen.getByRole('button', { name: 'next' }))
    expect(screen.getByTestId('meta').textContent).toBe('page 2 of 2: 6')
    rerender(<Harness items={items.slice(0, 5)} resetKey="filtered" />)
    expect(screen.getByTestId('meta').textContent).toBe('page 1 of 1: 1,2,3,4,5')
  })
})

describe('FormKit', () => {
  it('FormCard renders the heading and children, with an optional layout class', () => {
    const { rerender } = render(<FormCard title="新建记录"><span>body</span></FormCard>)
    expect(screen.getByRole('heading', { name: '新建记录' })).toBeDefined()
    expect(screen.getByText('body')).toBeDefined()
    rerender(
      <FormCard title="新建记录" className="wide"><span>body</span></FormCard>,
    )
    expect(document.querySelector('.wide')).not.toBeNull()
  })

  it('FormField renders a caption associated with its control', () => {
    render(
      <FormField label="名称">
        <input aria-label="name-input" />
      </FormField>,
    )
    const label = screen.getByText('名称').parentElement as HTMLLabelElement
    expect(label.tagName).toBe('LABEL')
    expect(label.querySelector('input')).not.toBeNull()
  })

  it('FormFieldGroup renders a caption without a label association', () => {
    render(
      <FormFieldGroup label="选项">
        <input type="radio" />
      </FormFieldGroup>,
    )
    const wrapper = screen.getByText('选项').parentElement as HTMLElement
    expect(wrapper.tagName).toBe('DIV')
  })

  it('TextField forwards input attributes and reports edits', () => {
    const onChange = vi.fn()
    render(
      <TextField
        label="标题"
        className="title-input"
        type="text"
        value="x"
        placeholder="请输入"
        onChange={onChange}
      />,
    )
    const input = screen.getByPlaceholderText<HTMLInputElement>('请输入')
    expect(input.value).toBe('x')
    fireEvent.change(input, { target: { value: 'xy' } })
    expect(onChange).toHaveBeenCalled()
  })

  it('parseTags splits on ASCII/Chinese commas, trims, and drops empties', () => {
    expect(parseTags('a, b， c,, d ')).toEqual(['a', 'b', 'c', 'd'])
    expect(parseTags('  ')).toEqual([])
  })

  it('TagsField reports the raw text on edit', () => {
    const onValueChange = vi.fn()
    render(
      <TagsField
        label="标签"
        value="a,b"
        placeholder="多个标签用逗号分隔"
        onValueChange={onValueChange}
      />,
    )
    fireEvent.change(screen.getByPlaceholderText('多个标签用逗号分隔'), { target: { value: 'a,b,c' } })
    expect(onValueChange).toHaveBeenCalledWith('a,b,c')
  })

  it('FormError announces its message', () => {
    render(<FormError>名称不能为空</FormError>)
    expect(screen.getByRole('alert').textContent).toBe('名称不能为空')
  })

  it('FormActions lays out its buttons', () => {
    render(<FormActions><button type="button">ok</button></FormActions>)
    expect(screen.getByRole('button', { name: 'ok' })).toBeDefined()
  })

  it('FormFooter renders the buttons and shows the validation alert only on error', () => {
    const onCancel = vi.fn()
    const onConfirm = vi.fn()
    const { rerender } = render(
      <FormFooter
        error={false}
        errorLabel="校验失败"
        cancelLabel="取消"
        confirmLabel="保存"
        confirmIcon={<svg data-testid="confirm-icon" />}
        onCancel={onCancel}
        onConfirm={onConfirm}
      />,
    )
    expect(screen.queryByRole('alert')).toBeNull()
    expect(screen.getByTestId('confirm-icon')).toBeDefined()
    fireEvent.click(screen.getByRole('button', { name: '取消' }))
    expect(onCancel).toHaveBeenCalledTimes(1)
    fireEvent.click(screen.getByRole('button', { name: '保存' }))
    expect(onConfirm).toHaveBeenCalledTimes(1)

    rerender(
      <FormFooter
        error
        errorLabel="校验失败"
        cancelLabel="取消"
        confirmLabel="保存"
        confirmIcon={<svg />}
        onCancel={onCancel}
        onConfirm={onConfirm}
      />,
    )
    expect(screen.getByRole('alert').textContent).toBe('校验失败')
  })

  it('ErrorBanner announces a panel failure', () => {
    render(<ErrorBanner>服务不可用</ErrorBanner>)
    expect(screen.getByRole('alert').textContent).toBe('服务不可用')
  })

  it('EmptyState renders a status region', () => {
    render(<EmptyState>没有数据</EmptyState>)
    expect(screen.getByRole('status').textContent).toBe('没有数据')
  })

  it('SearchField reports edits and names itself from ariaLabel or placeholder', () => {
    const onValueChange = vi.fn()
    const { rerender } = render(
      <SearchField value="" placeholder="搜索标题" onValueChange={onValueChange} />,
    )
    const byPlaceholder = screen.getByLabelText('搜索标题')
    fireEvent.change(byPlaceholder, { target: { value: '美' } })
    expect(onValueChange).toHaveBeenCalledWith('美')

    rerender(
      <SearchField
        value=""
        placeholder="搜索标题"
        ariaLabel="关键词过滤"
        onValueChange={onValueChange}
      />,
    )
    expect(screen.getByLabelText('关键词过滤')).toBeDefined()
  })

  it('ListPager renders nothing at one page and the pager past one page', () => {
    const onPageChange = vi.fn()
    const labels = {
      nav: 'Pagination',
      prev: 'Prev',
      next: 'Next',
      page: (n: number) => `Page ${n}`,
    }
    const { rerender, container } = render(
      <ListPager page={1} pageCount={1} onPageChange={onPageChange} labels={labels} />,
    )
    expect(container.childNodes).toHaveLength(0)
    rerender(<ListPager page={1} pageCount={2} onPageChange={onPageChange} labels={labels} />)
    expect(screen.getByRole('navigation', { name: 'Pagination' })).toBeDefined()
  })
})

describe('SidebarFootModal', () => {
  it('shows the label in the wide sidebar and opens and closes the modal', () => {
    render(
      <SidebarFootModal wide label="用户管理" closeLabel="关闭" icon={<span aria-hidden="true">★</span>}>
        <div>panel body</div>
      </SidebarFootModal>)
    const trigger = screen.getByRole('button', { name: '用户管理' })
    expect(trigger.getAttribute('aria-haspopup')).toBe('dialog')
    expect(trigger.getAttribute('aria-expanded')).toBe('false')
    expect(screen.queryByRole('dialog')).toBeNull()

    fireEvent.click(trigger)
    expect(screen.getByRole('dialog', { name: '用户管理' })).toBeDefined()
    expect(screen.getByText('panel body')).toBeDefined()
    expect(screen.getByRole('button', { name: '关闭' })).toBeDefined()

    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('uses an explicit title when given', () => {
    render(
      <SidebarFootModal
        wide
        label="用户管理"
        title="管理系统用户"
        closeLabel="关闭"
        icon={<span aria-hidden="true">★</span>}
      >
        <div>panel body</div>
      </SidebarFootModal>)
    fireEvent.click(screen.getByRole('button', { name: '用户管理' }))
    expect(screen.getByRole('dialog', { name: '管理系统用户' })).toBeDefined()
  })

  it('hides the visible label in the collapsed rail (the tooltip names it)', () => {
    render(
      <SidebarFootModal wide={false} label="用户管理" closeLabel="关闭" icon={<span>★</span>}>
        <div>panel body</div>
      </SidebarFootModal>)
    expect(screen.queryByText('用户管理')).toBeNull()
  })

  it('applies bodyClassName to the modal body wrapper', () => {
    render(
      <SidebarFootModal
        wide
        label="用户管理"
        closeLabel="关闭"
        icon={<span aria-hidden="true">★</span>}
        bodyClassName="fill-body"
      >
        <div>panel body</div>
      </SidebarFootModal>)
    fireEvent.click(screen.getByRole('button', { name: '用户管理' }))
    expect(document.querySelector('.fill-body')?.textContent).toContain('panel body')
  })
})

describe('SidebarFootAction', () => {
  it('shows the label in the wide sidebar and fires the action on click', () => {
    const onAction = vi.fn()
    render(<SidebarFootAction wide label="退出登录" icon={<span aria-hidden="true">⎋</span>} onAction={onAction} />)
    const trigger = screen.getByRole('button', { name: '退出登录' })
    // A direct action opens no popover: the dialog ARIA is absent by default.
    expect(trigger.getAttribute('aria-haspopup')).toBeNull()
    expect(trigger.getAttribute('aria-expanded')).toBeNull()

    fireEvent.click(trigger)
    expect(onAction).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('hides the visible label in the collapsed rail (the tooltip names it)', () => {
    render(
      <SidebarFootAction wide={false} label="退出登录" icon={<span>⎋</span>} onAction={() => {}} />,
    )
    expect(screen.queryByText('退出登录')).toBeNull()
  })

  it('renders the group caption only in the wide sidebar', () => {
    const { rerender } = render(
      <SidebarFootAction wide label="热点视频" icon={<span>▶</span>} groupHeader="视频业务" onAction={() => {}} />,
    )
    expect(screen.getByText('视频业务')).toBeDefined()
    rerender(
      <SidebarFootAction wide={false} label="热点视频" icon={<span>▶</span>} groupHeader="视频业务" onAction={() => {}} />,
    )
    expect(screen.queryByText('视频业务')).toBeNull()
  })

  it('renders no group caption without one or with a blank one', () => {
    const { rerender } = render(
      <SidebarFootAction wide label="热点视频" icon={<span>▶</span>} onAction={() => {}} />,
    )
    expect(screen.queryByText('视频业务')).toBeNull()
    // An explicit empty string is treated like "no caption" (no empty header box).
    rerender(
      <SidebarFootAction wide label="热点视频" icon={<span>▶</span>} groupHeader="" onAction={() => {}} />,
    )
    expect(document.querySelector('[class*="groupHeader"]')).toBeNull()
  })

  /**
   * Mount a shell-like harness holding collapse state the way SidebarRoot
   * does — a default-collapsed set (seeded by band leaders) plus explicit
   * user overrides — so the caption toggle drives real collapse behavior.
   */
  function SidebarHarness({ children, initialCollapsed = [] as string[] }: {
    children: ReactNode
    initialCollapsed?: string[]
  }) {
    const [defaultCollapsedKeys, setDefaultCollapsedKeys] = useState<ReadonlySet<string>>(
      () => new Set(initialCollapsed),
    )
    const [overrides, setOverrides] = useState<ReadonlyMap<string, boolean>>(() => new Map())
    const reportGroup = useCallback((key: string, startsCollapsed: boolean) => {
      if (!startsCollapsed) return
      setDefaultCollapsedKeys((previous) => {
        if (previous.has(key)) return previous
        const next = new Set(previous)
        next.add(key)
        return next
      })
    }, [])
    const toggle = useCallback((key: string) => {
      setOverrides((previous) => {
        const currently = previous.has(key)
          ? previous.get(key) === true
          : defaultCollapsedKeys.has(key)
        const next = new Map(previous)
        next.set(key, !currently)
        return next
      })
    }, [defaultCollapsedKeys])
    const collapsed = useMemo(() => {
      const effective = new Set(defaultCollapsedKeys)
      for (const [key, isCollapsed] of overrides) {
        if (isCollapsed) effective.add(key)
        else effective.delete(key)
      }
      return effective
    }, [defaultCollapsedKeys, overrides])
    const api: SidebarGroupsApi = { collapsed, toggle, reportGroup }
    return <SidebarGroupsContext.Provider value={api}>{children}</SidebarGroupsContext.Provider>
  }

  it('renders the group caption as a collapse toggle inside the sidebar context', () => {
    render(
      <SidebarHarness>
        <SidebarFootAction
          wide label="热点视频" icon={<span aria-hidden="true">▶</span>}
          groupHeader="视频业务" group="video" onAction={() => {}}
        />
      </SidebarHarness>,
    )
    const caption = screen.getByRole('button', { name: '视频业务' })
    // Expanded by default: aria-expanded true and the entry trigger visible.
    expect(caption.getAttribute('aria-expanded')).toBe('true')
    expect(screen.getByRole('button', { name: '热点视频' })).toBeDefined()

    fireEvent.click(caption)
    // Collapsed: the caption flips aria-expanded and the entry trigger hides,
    // but the caption itself stays clickable.
    expect(screen.getByRole('button', { name: '视频业务' }).getAttribute('aria-expanded')).toBe('false')
    expect(screen.queryByRole('button', { name: '热点视频' })).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: '视频业务' }))
    expect(screen.getByRole('button', { name: '视频业务' }).getAttribute('aria-expanded')).toBe('true')
    expect(screen.getByRole('button', { name: '热点视频' })).toBeDefined()
  })

  it('hides every entry carrying a collapsed group key, including entries without a caption', () => {
    render(
      <SidebarHarness initialCollapsed={['video']}>
        <SidebarFootAction
          wide label="热点视频" icon={<span aria-hidden="true">▶</span>}
          groupHeader="视频业务" group="video" onAction={() => {}}
        />
        <SidebarFootAction wide label="创作视频" icon={<span aria-hidden="true">✚</span>} group="video" onAction={() => {}} />
        <SidebarFootAction
          wide label="分类管理" icon={<span aria-hidden="true">▤</span>}
          groupHeader="资源管理" group="resources" onAction={() => {}}
        />
      </SidebarHarness>,
    )
    // The collapsed video band hides both its entries; its caption still shows,
    // and the other band is untouched.
    expect(screen.queryByRole('button', { name: '热点视频' })).toBeNull()
    expect(screen.queryByRole('button', { name: '创作视频' })).toBeNull()
    expect(screen.getByRole('button', { name: '视频业务' }).getAttribute('aria-expanded')).toBe('false')
    expect(screen.getByRole('button', { name: '分类管理' })).toBeDefined()
    expect(screen.getByRole('button', { name: '资源管理' }).getAttribute('aria-expanded')).toBe('true')
  })

  it('never collapses entries in the collapsed rail, even with a collapsed group key', () => {
    render(
      <SidebarHarness initialCollapsed={['video']}>
        <SidebarFootAction
          wide={false} label="热点视频" icon={<span aria-hidden="true">▶</span>}
          groupHeader="视频业务" group="video" onAction={() => {}}
        />
      </SidebarHarness>,
    )
    // The rail renders no caption, and the icon trigger stays visible.
    expect(screen.queryByRole('button', { name: '视频业务' })).toBeNull()
    // The trigger keeps its tooltip naming; in the rail it is the only button.
    expect(document.querySelector('button')).not.toBeNull()
  })

  it('falls back to a plain caption outside the sidebar context', () => {
    render(
      <SidebarFootAction
        wide label="热点视频" icon={<span aria-hidden="true">▶</span>}
        groupHeader="视频业务" group="video" onAction={() => {}}
      />,
    )
    // Without the shell's context provider the caption is a static header, not
    // a toggle button, and the entry stays visible.
    expect(screen.queryByRole('button', { name: '视频业务' })).toBeNull()
    expect(screen.getByText('视频业务')).toBeDefined()
    expect(screen.getByRole('button', { name: '热点视频' })).toBeDefined()
  })

  it('keeps entries without a group key visible while a group is collapsed', () => {
    render(
      <SidebarHarness initialCollapsed={['video']}>
        <SidebarFootAction wide label="退出登录" icon={<span aria-hidden="true">⎋</span>} onAction={() => {}} />
      </SidebarHarness>,
    )
    expect(screen.getByRole('button', { name: '退出登录' })).toBeDefined()
  })

  it('seeds a band collapsed on mount when its leader sets defaultCollapsed', () => {
    render(
      <SidebarHarness>
        <SidebarFootAction
          wide label="分类管理" icon={<span aria-hidden="true">▤</span>}
          groupHeader="资源管理" group="resources" defaultCollapsed onAction={() => {}}
        />
        <SidebarFootAction
          wide label="提示词管理" icon={<span aria-hidden="true">≣</span>}
          group="resources" onAction={() => {}}
        />
        <SidebarFootAction
          wide label="热点视频" icon={<span aria-hidden="true">▶</span>}
          groupHeader="视频业务" group="video" onAction={() => {}}
        />
      </SidebarHarness>,
    )
    // The resources band seeds collapsed on mount (pre-paint): both its
    // entries hide, while the video band that set no default stays expanded.
    expect(screen.queryByRole('button', { name: '分类管理' })).toBeNull()
    expect(screen.queryByRole('button', { name: '提示词管理' })).toBeNull()
    expect(screen.getByRole('button', { name: '资源管理' }).getAttribute('aria-expanded')).toBe('false')
    expect(screen.getByRole('button', { name: '热点视频' })).toBeDefined()
    expect(screen.getByRole('button', { name: '视频业务' }).getAttribute('aria-expanded')).toBe('true')

    // The seeded default yields to a user toggle: clicking the caption expands.
    fireEvent.click(screen.getByRole('button', { name: '资源管理' }))
    expect(screen.getByRole('button', { name: '分类管理' })).toBeDefined()
    expect(screen.getByRole('button', { name: '提示词管理' })).toBeDefined()
    expect(screen.getByRole('button', { name: '资源管理' }).getAttribute('aria-expanded')).toBe('true')
  })

  it('ignores defaultCollapsed in the collapsed rail', () => {
    render(
      <SidebarHarness>
        <SidebarFootAction
          wide={false} label="分类管理" icon={<span aria-hidden="true">▤</span>}
          groupHeader="资源管理" group="resources" defaultCollapsed onAction={() => {}}
        />
      </SidebarHarness>,
    )
    // The rail renders no caption, never collapses, and keeps its icon trigger.
    expect(screen.queryByRole('button', { name: '资源管理' })).toBeNull()
    expect(document.querySelector('button')).not.toBeNull()
  })
})

describe('DataTable', () => {
  const headers = (
    <>
      <th scope="col">名称</th>
      <th scope="col">状态</th>
    </>
  )

  it('renders rows without the optional count line', () => {
    render(
      <DataTable empty={false} emptyLabel="没有数据" headers={headers}>
        <tr><td>第一行</td><td>就绪</td></tr>
      </DataTable>,
    )
    expect(screen.getByRole('table')).toBeDefined()
    expect(screen.getByText('第一行')).toBeDefined()
    expect(screen.queryByText('没有数据')).toBeNull()
  })

  it('renders the count line when meta is supplied', () => {
    render(
      <DataTable meta="共 2 条" empty={false} emptyLabel="没有数据" headers={headers}>
        <tr><td>第一行</td><td>就绪</td></tr>
      </DataTable>,
    )
    expect(screen.getByText('共 2 条')).toBeDefined()
  })

  it('renders the empty state instead of the table when empty', () => {
    render(
      <DataTable meta="共 0 条" empty emptyLabel="没有数据" headers={headers}>
        {null}
      </DataTable>,
    )
    expect(screen.getByRole('status').textContent).toContain('没有数据')
    expect(screen.queryByRole('table')).toBeNull()
  })
})

describe('ResultsTable', () => {
  const headers = (
    <>
      <th scope="col">名称</th>
      <th scope="col">状态</th>
    </>
  )
  const t = (key: 'count' | 'empty', params?: Record<string, unknown>): string => {
    if (key === 'count') {
      const count = typeof params?.count === 'number' ? params.count : 0
      return `共 ${count} 条`
    }
    return '没有数据'
  }

  it('shows no empty state before the initial load completes', () => {
    render(
      <ResultsTable t={t} loaded={false} count={0} headers={headers}>
        {null}
      </ResultsTable>,
    )
    expect(screen.queryByRole('status')).toBeNull()
    expect(screen.getByRole('table')).toBeDefined()
  })

  it('shows the empty state when loaded with no rows', () => {
    render(
      <ResultsTable t={t} loaded count={0} headers={headers}>
        {null}
      </ResultsTable>,
    )
    expect(screen.getByRole('status').textContent).toContain('没有数据')
    expect(screen.queryByRole('table')).toBeNull()
  })

  it('shows the count line and rows when loaded with rows', () => {
    render(
      <ResultsTable t={t} loaded count={2} headers={headers}>
        <tr><td>第一行</td><td>就绪</td></tr>
      </ResultsTable>,
    )
    expect(screen.getByText('共 2 条')).toBeDefined()
    expect(screen.getByText('第一行')).toBeDefined()
  })
})

describe('DeleteRowButton', () => {
  const confirm = {
    title: '确认删除',
    message: '删除后不可恢复，确定要删除「测试」吗？',
    confirmLabel: '删除',
    cancelLabel: '取消',
  }

  it('deletes only after the confirmation dialog is confirmed', () => {
    const onDelete = vi.fn()
    render(<DeleteRowButton label="删除视频：测试" confirm={confirm} onDelete={onDelete} />)
    // The first click opens the dialog; nothing is deleted yet.
    fireEvent.click(screen.getByRole('button', { name: '删除视频：测试' }))
    expect(onDelete).not.toHaveBeenCalled()
    expect(screen.getByRole('alertdialog')).toBeDefined()
    expect(screen.getByText(confirm.message)).toBeDefined()
    // Cancelling closes the dialog without deleting.
    fireEvent.click(screen.getByRole('button', { name: '取消' }))
    expect(onDelete).not.toHaveBeenCalled()
    expect(screen.queryByRole('alertdialog')).toBeNull()
    // Reopen and confirm: the row is deleted and the dialog closes.
    fireEvent.click(screen.getByRole('button', { name: '删除视频：测试' }))
    fireEvent.click(screen.getByRole('button', { name: '删除' }))
    expect(onDelete).toHaveBeenCalledOnce()
    expect(screen.queryByRole('alertdialog')).toBeNull()
  })

  it('stays inert and opens no dialog while disabled', () => {
    const onDelete = vi.fn()
    render(<DeleteRowButton label="删除视频：测试" confirm={confirm} disabled onDelete={onDelete} />)
    const button = screen.getByRole('button', { name: '删除视频：测试' })
    expect(button.hasAttribute('disabled')).toBe(true)
    fireEvent.click(button)
    expect(screen.queryByRole('alertdialog')).toBeNull()
    expect(onDelete).not.toHaveBeenCalled()
  })

  it('closes the dialog on Escape without deleting', () => {
    const onDelete = vi.fn()
    render(<DeleteRowButton label="删除视频：测试" confirm={confirm} onDelete={onDelete} />)
    fireEvent.click(screen.getByRole('button', { name: '删除视频：测试' }))
    expect(screen.getByRole('alertdialog')).toBeDefined()
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(onDelete).not.toHaveBeenCalled()
    expect(screen.queryByRole('alertdialog')).toBeNull()
  })

  it('ignores non-Escape keys and closes on a mask click without deleting', () => {
    const onDelete = vi.fn()
    render(<DeleteRowButton label="删除视频：测试" confirm={confirm} onDelete={onDelete} />)
    fireEvent.click(screen.getByRole('button', { name: '删除视频：测试' }))
    expect(screen.getByRole('alertdialog')).toBeDefined()
    // A non-Escape key leaves the dialog open (only Escape is intercepted).
    fireEvent.keyDown(window, { key: 'Enter' })
    expect(screen.getByRole('alertdialog')).toBeDefined()
    expect(onDelete).not.toHaveBeenCalled()
    // A click on the scrim cancels, same as the cancel button. Match by class
    // (the trigger icon also carries aria-hidden).
    const mask = document.querySelector('[class*="mask"]') as HTMLElement
    fireEvent.click(mask)
    expect(onDelete).not.toHaveBeenCalled()
    expect(screen.queryByRole('alertdialog')).toBeNull()
  })

  it('marks the trigger with the dialog popup state', () => {
    render(<DeleteRowButton label="删除视频：测试" confirm={confirm} onDelete={vi.fn()} />)
    const trigger = screen.getByRole('button', { name: '删除视频：测试' })
    expect(trigger.getAttribute('aria-haspopup')).toBe('dialog')
    expect(trigger.getAttribute('aria-expanded')).toBe('false')
    fireEvent.click(trigger)
    expect(trigger.getAttribute('aria-expanded')).toBe('true')
  })
})
