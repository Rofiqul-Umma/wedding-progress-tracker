import type { PlanState, Task } from '@domain/entities/types';
import { addTo, insertInto, removeFrom, updateIn } from './_collection';
import { uid } from './id';

/** Fields supplied when creating a task; `done`/`created` are set here. */
export type NewTaskInput = Omit<Task, 'id' | 'done' | 'created'>;

export function addTask(
  state: PlanState,
  data: NewTaskInput,
  created: string,
): PlanState {
  const task: Task = { id: uid(), done: false, created, ...data };
  return { ...state, tasks: addTo(state.tasks, task) };
}

export function updateTask(
  state: PlanState,
  id: string,
  patch: Partial<Task>,
): PlanState {
  return { ...state, tasks: updateIn(state.tasks, id, patch) };
}

export interface TaskRemoval {
  state: PlanState;
  removed: Task | null;
  index: number;
}

export function deleteTask(state: PlanState, id: string): TaskRemoval {
  const r = removeFrom(state.tasks, id);
  return { state: { ...state, tasks: r.list }, removed: r.removed, index: r.index };
}

export function insertTask(state: PlanState, task: Task, index: number): PlanState {
  return { ...state, tasks: insertInto(state.tasks, task, index) };
}

export function toggleTaskDone(state: PlanState, id: string): PlanState {
  return {
    ...state,
    tasks: state.tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)),
  };
}
