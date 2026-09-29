import { useEffect, useMemo, useState } from 'react'

const STORAGE_KEY = 'daymark.tasks.v1'
const TAGS = ['Work', 'Personal', 'Urgent']
const FILTERS = ['All tasks', ...TAGS]

const TAG_STYLES = {
  Work: 'bg-[#edf1eb] text-[#536b57]',
  Personal: 'bg-[#f4eee5] text-[#9a714c]',
  Urgent: 'bg-[#f6e9e5] text-[#b35c4b]',
}

function readStoredTasks() {
  try {
    const storedValue = window.localStorage.getItem(STORAGE_KEY)
    if (storedValue === null) return { tasks: [], warning: '' }

    const parsedValue = JSON.parse(storedValue)
    if (
      !Array.isArray(parsedValue) ||
      !parsedValue.every(
        (task) =>
          task &&
          typeof task.id === 'string' &&
          typeof task.title === 'string' &&
          typeof task.notes === 'string' &&
          TAGS.includes(task.tag) &&
          typeof task.completed === 'boolean',
      )
    ) {
      return {
        tasks: [],
        warning: 'Saved tasks could not be read. Your saved data was left unchanged.',
      }
    }

    return { tasks: parsedValue, warning: '' }
  } catch {
    return {
      tasks: [],
      warning: 'Saved tasks could not be read. Your saved data was left unchanged.',
    }
  }
}

function Icon({ name, size = 18, className = '' }) {
  const paths = {
    check: <path d="m5 12 4 4L19 6" />,
    plus: <path d="M12 5v14M5 12h14" />,
    search: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-4-4" />
      </>
    ),
    note: (
      <>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <path d="M14 2v6h6M8 13h8M8 17h6" />
      </>
    ),
    edit: (
      <>
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L9 17l-4 1 1-4Z" />
      </>
    ),
    trash: (
      <>
        <path d="M3 6h18M8 6V4h8v2m3 0-1 14H6L5 6" />
        <path d="M10 11v5m4-5v5" />
      </>
    ),
    chevron: <path d="m9 18 6-6-6-6" />,
    sparkle: (
      <>
        <path d="m12 3 1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2L12 3Z" />
        <path d="m19 14 1.2 2.8L23 18l-2.8 1.2L19 22l-1.2-2.8L15 18l2.8-1.2L19 14Z" />
      </>
    ),
    close: <path d="m18 6-12 12M6 6l12 12" />,
  }

  return (
    <svg
      aria-hidden="true"
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name]}
    </svg>
  )
}

function App() {
  const [storedState] = useState(readStoredTasks)
  const [tasks, setTasks] = useState(storedState.tasks)
  const [activeFilter, setActiveFilter] = useState('All tasks')
  const [searchQuery, setSearchQuery] = useState('')
  const [newTitle, setNewTitle] = useState('')
  const [newTag, setNewTag] = useState('Personal')
  const [editingId, setEditingId] = useState(null)
  const [editingTitle, setEditingTitle] = useState('')
  const [expandedNotes, setExpandedNotes] = useState([])
  const [storageWarning, setStorageWarning] = useState(storedState.warning)
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    if (!hasChanges || tasks === null) return

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks))
      setStorageWarning('')
    } catch {
      setStorageWarning('Changes could not be saved in this browser.')
    }
  }, [hasChanges, tasks])

  const updateTasks = (updater) => {
    setTasks((previousTasks) =>
      previousTasks === null ? previousTasks : updater(previousTasks),
    )
    setHasChanges(true)
  }

  const visibleTasks = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase()

    return tasks
      .filter((task) => activeFilter === 'All tasks' || task.tag === activeFilter)
      .filter(
        (task) =>
          !normalizedQuery ||
          task.title.toLowerCase().includes(normalizedQuery) ||
          task.notes.toLowerCase().includes(normalizedQuery),
      )
      .sort(
        (first, second) =>
          Number(first.completed) - Number(second.completed) ||
          (second.createdAt ?? 0) - (first.createdAt ?? 0),
      )
  }, [activeFilter, searchQuery, tasks])

  const completedCount = tasks.filter((task) => task.completed).length
  const remainingCount = tasks.length - completedCount
  const progress = tasks.length
    ? Math.round((completedCount / tasks.length) * 100)
    : 0
  const dateLabel = new Intl.DateTimeFormat('en', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(new Date())

  const handleAddTask = (event) => {
    event.preventDefault()
    const title = newTitle.trim()
    if (!title) return

    updateTasks((previousTasks) => [
      {
        id: crypto.randomUUID(),
        title,
        notes: '',
        tag: newTag,
        completed: false,
        createdAt: Date.now(),
      },
      ...previousTasks,
    ])
    setNewTitle('')
  }

  const handleToggleTask = (taskId) => {
    updateTasks((previousTasks) =>
      previousTasks.map((task) =>
        task.id === taskId ? { ...task, completed: !task.completed } : task,
      ),
    )
  }

  const handleDeleteTask = (taskId) => {
    updateTasks((previousTasks) =>
      previousTasks.filter((task) => task.id !== taskId),
    )
    setExpandedNotes((previousItems) =>
      previousItems.filter((id) => id !== taskId),
    )
    if (editingId === taskId) setEditingId(null)
  }

  const handleSaveTitle = (taskId) => {
    const title = editingTitle.trim()
    if (title) {
      updateTasks((previousTasks) =>
        previousTasks.map((task) =>
          task.id === taskId ? { ...task, title } : task,
        ),
      )
    }
    setEditingId(null)
  }

  const handleUpdateNotes = (taskId, notes) => {
    updateTasks((previousTasks) =>
      previousTasks.map((task) =>
        task.id === taskId ? { ...task, notes } : task,
      ),
    )
  }

  const handleToggleNotes = (taskId) => {
    setExpandedNotes((previousItems) =>
      previousItems.includes(taskId)
        ? previousItems.filter((id) => id !== taskId)
        : [...previousItems, taskId],
    )
  }

  return (
    <div className="min-h-screen bg-[#f7f6f2] text-[#262b28]">
      <aside className="fixed inset-y-0 left-0 hidden w-[250px] flex-col border-r border-[#e9e7e0] bg-[#fbfaf7] px-6 py-8 lg:flex">
        <a
          href="#main"
          className="flex w-fit items-center gap-3 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#587565]"
          aria-label="Daymark home"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-[#587565] text-white shadow-sm">
            <Icon name="check" size={21} />
          </span>
          <span className="text-[19px] font-semibold tracking-[-0.6px]">
            daymark<span className="text-[#78907b]">.</span>
          </span>
        </a>

        <div className="mt-14">
          <p className="mb-3 px-3 text-[10px] font-semibold tracking-[1.7px] text-[#a2a49c] uppercase">
            Workspace
          </p>
          <nav aria-label="Task filters" className="space-y-1">
            {FILTERS.map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setActiveFilter(filter)}
                aria-pressed={activeFilter === filter}
                className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-[13px] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#587565] ${
                  activeFilter === filter
                    ? 'bg-[#edf0e9] font-medium text-[#405849]'
                    : 'text-[#777b74] hover:bg-[#f2f1ec] hover:text-[#373d38]'
                }`}
              >
                <span className="flex items-center gap-3">
                  <span
                    aria-hidden="true"
                    className={`h-[7px] w-[7px] rounded-full ${
                      filter === 'Work'
                        ? 'bg-[#718b71]'
                        : filter === 'Personal'
                          ? 'bg-[#c09161]'
                          : filter === 'Urgent'
                            ? 'bg-[#cc7662]'
                            : 'bg-[#87958a]'
                    }`}
                  />
                  {filter}
                </span>
                <span className="text-[11px] text-[#969991]">
                  {filter === 'All tasks'
                    ? tasks.length
                    : tasks.filter((task) => task.tag === filter).length}
                </span>
              </button>
            ))}
          </nav>
        </div>

        <div className="mt-auto rounded-2xl border border-[#ece9e1] bg-white p-4">
          <span className="mb-3 flex h-8 w-8 items-center justify-center rounded-xl bg-[#f4f1e9] text-[#9c885f]">
            <Icon name="sparkle" size={17} />
          </span>
          <p className="text-[12px] font-medium text-[#434a44]">
            A little progress adds up.
          </p>
          <p className="mt-1 text-[11px] leading-relaxed text-[#969991]">
            Keep showing up for the things that matter.
          </p>
        </div>
        <p className="mt-5 px-1 text-[10px] tracking-wide text-[#aaaba5]">
          YOUR SPACE, AT YOUR PACE
        </p>
      </aside>

      <div className="lg:pl-[250px]">
        <header className="sticky top-0 z-10 border-b border-[#ebe9e3] bg-[#f7f6f2]/90 px-5 backdrop-blur-md sm:px-9 lg:px-14">
          <div className="mx-auto flex h-[68px] max-w-[1100px] items-center justify-between">
            <a
              href="#main"
              className="flex items-center gap-2.5 rounded-lg text-[16px] font-semibold tracking-[-0.5px] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#587565] lg:hidden"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-[11px] bg-[#587565] text-white">
                <Icon name="check" size={17} />
              </span>
              daymark<span className="-ml-2 text-[#78907b]">.</span>
            </a>
            <p className="hidden text-[12px] font-medium tracking-wide text-[#898c84] lg:block">
              YOUR PERSONAL WORKSPACE
            </p>
            <div className="flex items-center gap-3">
              <span className="hidden text-[12px] text-[#898c84] sm:block">
                {dateLabel}
              </span>
              <span
                className="flex h-9 w-9 items-center justify-center rounded-full border border-[#e7e3d9] bg-[#efede5] text-[11px] font-semibold text-[#647263]"
                aria-label="Your profile"
                title="Your profile"
              >
                Y
              </span>
            </div>
          </div>
        </header>

        <main
          id="main"
          className="mx-auto min-h-[calc(100vh-68px)] max-w-[1100px] px-5 py-9 sm:px-9 sm:py-12 lg:px-14 lg:py-14"
        >
          <section className="mb-10 flex flex-col justify-between gap-7 md:mb-12 md:flex-row md:items-end">
            <div>
              <p className="mb-2 text-[11px] font-semibold tracking-[1.5px] text-[#9b9c94] uppercase">
                {dateLabel}
              </p>
              <h1 className="text-[34px] leading-tight font-medium tracking-[-1.7px] text-[#303631] sm:text-[42px]">
                Make room for
                <br className="sm:hidden" /> what matters.
              </h1>
              <p className="mt-3 text-[14px] text-[#858981]">
                {remainingCount === 0 && tasks.length > 0
                  ? 'Everything is wrapped up. Well done.'
                  : remainingCount === 0
                    ? 'A clear mind starts with a clear list.'
                    : `You have ${remainingCount} ${remainingCount === 1 ? 'thing' : 'things'} on your plate. Take them one at a time.`}
              </p>
            </div>

            <div className="flex w-full items-center gap-4 rounded-2xl border border-[#eae8e1] bg-[#fbfaf7] px-4 py-3.5 md:w-[230px]">
              <div className="relative flex h-[54px] w-[54px] shrink-0 items-center justify-center rounded-full bg-[#eeede7]">
                <svg
                  className="absolute inset-0 -rotate-90"
                  viewBox="0 0 54 54"
                  aria-hidden="true"
                >
                  <circle
                    cx="27"
                    cy="27"
                    r="23"
                    fill="none"
                    stroke="#e2e1d9"
                    strokeWidth="3.5"
                  />
                  <circle
                    cx="27"
                    cy="27"
                    r="23"
                    fill="none"
                    stroke="#718b71"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeDasharray={`${(progress / 100) * 144.5} 144.5`}
                    className="transition-[stroke-dasharray] duration-500"
                  />
                </svg>
                <span className="text-[12px] font-semibold text-[#4e6251]">
                  {progress}%
                </span>
              </div>
              <div>
                <p className="text-[13px] font-medium text-[#414740]">
                  Daily progress
                </p>
                <p className="mt-1 text-[11px] text-[#94968f]">
                  {completedCount} of {tasks.length} completed
                </p>
              </div>
            </div>
          </section>

          {storageWarning && (
            <p
              role="status"
              className="mb-5 rounded-xl border border-[#ead8cc] bg-[#fbf1eb] px-4 py-3 text-[12px] text-[#9a5947]"
            >
              {storageWarning}
            </p>
          )}

          <form
            onSubmit={handleAddTask}
            className="mb-9 rounded-2xl border border-[#e9e7e0] bg-[#fbfaf7] p-3 shadow-[0_2px_8px_rgba(43,48,43,0.025)] transition-shadow focus-within:shadow-[0_4px_18px_rgba(43,48,43,0.06)] sm:flex sm:items-center sm:p-2.5"
          >
            <label htmlFor="new-task" className="sr-only">
              Add a task
            </label>
            <span className="hidden pl-3 text-[#899487] sm:block">
              <Icon name="plus" size={19} />
            </span>
            <input
              id="new-task"
              value={newTitle}
              onChange={(event) => setNewTitle(event.target.value)}
              placeholder="What needs your attention?"
              className="min-w-0 flex-1 bg-transparent px-2.5 py-3 text-[13px] text-[#394039] outline-none placeholder:text-[#aaa9a1] focus-visible:outline-none"
            />
            <div className="flex items-center gap-2 border-t border-[#eeece6] pt-2 sm:border-0 sm:pt-0">
              <label htmlFor="new-task-tag" className="sr-only">
                Choose a task tag
              </label>
              <select
                id="new-task-tag"
                value={newTag}
                onChange={(event) => setNewTag(event.target.value)}
                className="min-h-10 flex-1 rounded-lg border-0 bg-transparent px-2 text-[11px] text-[#767970] outline-none transition hover:bg-[#f2f1ec] focus-visible:outline-2 focus-visible:outline-[#587565] sm:flex-none"
              >
                {TAGS.map((tag) => (
                  <option key={tag} value={tag}>
                    {tag}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                disabled={!newTitle.trim()}
                className="flex min-h-10 items-center justify-center gap-2 rounded-xl bg-[#587565] px-4 text-[12px] font-medium text-white transition hover:bg-[#486554] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#587565] disabled:cursor-not-allowed disabled:opacity-45"
              >
                <Icon name="plus" size={15} />
                Add task
              </button>
            </div>
          </form>

          <section aria-labelledby="tasks-heading">
            <div className="mb-4 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div className="flex items-center gap-3">
                <h2
                  id="tasks-heading"
                  className="text-[16px] font-semibold tracking-[-0.3px] text-[#343a35]"
                >
                  {activeFilter === 'All tasks' ? 'Your tasks' : activeFilter}
                </h2>
                <span className="rounded-full bg-[#eeede7] px-2 py-0.5 text-[10px] font-medium text-[#85877f]">
                  {visibleTasks.length}
                </span>
              </div>
              <div className="flex items-center gap-2 sm:gap-1.5">
                <div className="relative flex min-w-0 flex-1 items-center sm:flex-none">
                  <Icon
                    name="search"
                    size={15}
                    className="pointer-events-none absolute left-2.5 text-[#a2a39b]"
                  />
                  <label htmlFor="search-tasks" className="sr-only">
                    Search tasks and notes
                  </label>
                  <input
                    id="search-tasks"
                    type="search"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Search tasks"
                    className="h-9 w-full rounded-lg border border-[#e9e7e0] bg-[#fbfaf7] pl-8 pr-3 text-[11px] text-[#444a44] outline-none transition focus:border-[#9dad9f] focus-visible:ring-2 focus-visible:ring-[#dce4db] sm:w-[156px]"
                  />
                </div>
                <div
                  className="flex shrink-0 items-center gap-1 rounded-lg border border-[#e9e7e0] bg-[#fbfaf7] p-1"
                  aria-label="Filter tasks by tag"
                >
                  {FILTERS.map((filter) => (
                    <button
                      key={filter}
                      type="button"
                      onClick={() => setActiveFilter(filter)}
                      aria-label={`Filter by ${filter}`}
                      aria-pressed={activeFilter === filter}
                      className={`min-h-7 rounded-md px-2 text-[10px] transition focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#587565] ${
                        activeFilter === filter
                          ? 'bg-[#e9eee7] font-medium text-[#4f6655]'
                          : 'text-[#8b8d85] hover:bg-[#f1f0eb] hover:text-[#555b54]'
                      }`}
                    >
                      {filter === 'All tasks' ? 'All' : filter}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {visibleTasks.length === 0 ? (
              <div className="flex min-h-[220px] flex-col items-center justify-center rounded-2xl border border-dashed border-[#dfded7] bg-[#fbfaf7]/70 px-6 text-center">
                <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#eeefe9] text-[#78907b]">
                  {searchQuery || activeFilter !== 'All tasks' ? (
                    <Icon name="search" size={19} />
                  ) : (
                    <Icon name="check" size={20} />
                  )}
                </span>
                <p className="text-[13px] font-medium text-[#4a504a]">
                  {searchQuery || activeFilter !== 'All tasks'
                    ? 'No tasks found'
                    : 'A fresh start.'}
                </p>
                <p className="mt-1 max-w-[270px] text-[11px] leading-relaxed text-[#969890]">
                  {searchQuery || activeFilter !== 'All tasks'
                    ? 'Try another search or choose a different tag.'
                    : 'Add a task above and make a little progress today.'}
                </p>
              </div>
            ) : (
              <ul className="overflow-hidden rounded-2xl border border-[#e9e7e0] bg-[#fbfaf7]">
                {visibleTasks.map((task, index) => {
                  const notesAreExpanded = expandedNotes.includes(task.id)
                  const hasNotes = task.notes.length > 0

                  return (
                    <li
                      key={task.id}
                      className={`group px-4 transition-colors hover:bg-white/70 sm:px-5 ${
                        index > 0 ? 'border-t border-[#eeece6]' : ''
                      } ${task.completed ? 'bg-[#f8f8f4]' : ''}`}
                    >
                      <div className="flex min-h-[72px] items-center gap-3">
                        <button
                          type="button"
                          onClick={() => handleToggleTask(task.id)}
                          aria-label={
                            task.completed
                              ? `Mark "${task.title}" as incomplete`
                              : `Mark "${task.title}" as complete`
                          }
                          aria-pressed={task.completed}
                          className={`flex h-[19px] w-[19px] shrink-0 items-center justify-center rounded-full border transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#587565] ${
                            task.completed
                              ? 'border-[#718b71] bg-[#718b71] text-white'
                              : 'border-[#d1d2c9] bg-transparent text-transparent hover:border-[#718b71] hover:text-[#718b71]'
                          }`}
                        >
                          {task.completed && <Icon name="check" size={12} />}
                        </button>

                        <div className="min-w-0 flex-1">
                          {editingId === task.id ? (
                            <input
                              autoFocus
                              aria-label="Edit task title"
                              value={editingTitle}
                              onChange={(event) =>
                                setEditingTitle(event.target.value)
                              }
                              onBlur={() => handleSaveTitle(task.id)}
                              onKeyDown={(event) => {
                                if (event.key === 'Enter') {
                                  event.preventDefault()
                                  handleSaveTitle(task.id)
                                }
                                if (event.key === 'Escape') setEditingId(null)
                              }}
                              className="w-full rounded border-b border-[#9dad9f] bg-transparent py-1 text-[13px] outline-none focus-visible:ring-2 focus-visible:ring-[#dce4db]"
                            />
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingId(task.id)
                                setEditingTitle(task.title)
                              }}
                              aria-label={`Edit task: ${task.title}`}
                              className={`block max-w-full truncate rounded text-left text-[13px] transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#587565] ${
                                task.completed
                                  ? 'text-[#a5a69f] line-through'
                                  : 'text-[#414741]'
                              }`}
                            >
                              {task.title}
                            </button>
                          )}
                          <div className="mt-1.5 flex items-center gap-2">
                            <span
                              className={`rounded-md px-1.5 py-[3px] text-[9px] font-medium ${TAG_STYLES[task.tag]}`}
                            >
                              {task.tag}
                            </span>
                            {hasNotes && (
                              <span className="flex items-center gap-1 text-[10px] text-[#a0a198]">
                                <Icon name="note" size={11} />
                                Note
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex shrink-0 items-center gap-0.5">
                          <button
                            type="button"
                            onClick={() => handleToggleNotes(task.id)}
                            aria-label={`${notesAreExpanded ? 'Hide' : 'Show'} notes for ${task.title}`}
                            aria-expanded={notesAreExpanded}
                            className="flex h-9 w-9 items-center justify-center rounded-lg text-[#92958d] transition hover:bg-[#efeee8] hover:text-[#596c5d] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#587565]"
                          >
                            <Icon name="note" size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingId(task.id)
                              setEditingTitle(task.title)
                            }}
                            aria-label={`Edit title for ${task.title}`}
                            className="flex h-9 w-9 items-center justify-center rounded-lg text-[#92958d] transition hover:bg-[#efeee8] hover:text-[#596c5d] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#587565]"
                          >
                            <Icon name="edit" size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteTask(task.id)}
                            aria-label={`Delete ${task.title}`}
                            className="flex h-9 w-9 items-center justify-center rounded-lg text-[#aaa9a1] transition hover:bg-[#f7eae6] hover:text-[#b35c4b] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#b35c4b]"
                          >
                            <Icon name="trash" size={15} />
                          </button>
                        </div>
                      </div>

                      {notesAreExpanded && (
                        <div className="ml-8 border-t border-[#eeece6] pb-4 pt-3 sm:ml-8">
                          <label
                            htmlFor={`notes-${task.id}`}
                            className="mb-1.5 block text-[10px] font-medium tracking-wide text-[#898d84]"
                          >
                            NOTES
                          </label>
                          <textarea
                            id={`notes-${task.id}`}
                            value={task.notes}
                            onChange={(event) =>
                              handleUpdateNotes(task.id, event.target.value)
                            }
                            placeholder="Add a note to remember the details..."
                            rows={2}
                            className="w-full resize-y rounded-lg border border-[#e9e7e0] bg-white px-3 py-2.5 text-[12px] leading-relaxed text-[#555c55] outline-none transition placeholder:text-[#b0b0a8] focus:border-[#9dad9f] focus-visible:ring-2 focus-visible:ring-[#dce4db]"
                          />
                        </div>
                      )}
                    </li>
                  )
                })}
              </ul>
            )}
          </section>

          <footer className="mt-6 flex flex-col justify-between gap-2 text-[10px] text-[#a1a29b] sm:flex-row sm:items-center">
            <p>
              {completedCount} completed · {remainingCount} left to do
            </p>
            {tasks.length > 0 && completedCount > 0 && (
              <button
                type="button"
                onClick={() =>
                  updateTasks((previousTasks) =>
                    previousTasks.filter((task) => !task.completed),
                  )
                }
                className="w-fit rounded text-[#898d84] transition hover:text-[#b35c4b] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#587565]"
              >
                Clear completed
              </button>
            )}
          </footer>
        </main>
      </div>
    </div>
  )
}

export default App
