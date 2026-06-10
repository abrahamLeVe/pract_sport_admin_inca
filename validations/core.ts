export interface ActionState<T = void> {
  success?: boolean;
  message?: string;
  zodErrors?: Partial<Record<keyof T, string[]>> | null;
  data?: Partial<T>;
}

export type ToggleAction = (
  id: number,
  currentStatus: string,
) => Promise<ActionState>;

export interface PageProps {
  searchParams: Promise<{
    query?: string;
    page?: string;
  }>;
}
