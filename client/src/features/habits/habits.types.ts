export interface Habit {
  id: string;
  name: string;
  type?: string;
  description?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}
