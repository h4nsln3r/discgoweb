/** Rader kopplade till competition_courses – sortera spelordning. */
export type CompetitionCourseOrderFields = {
  sort_order?: number | null;
  created_at?: string | null;
  course_id?: string | null;
};

export function compareCompetitionCourseOrder(
  a: CompetitionCourseOrderFields,
  b: CompetitionCourseOrderFields
): number {
  const ao = a.sort_order;
  const bo = b.sort_order;
  if (ao != null && bo != null && ao !== bo) return ao - bo;
  if (ao != null && bo == null) return -1;
  if (ao == null && bo != null) return 1;
  const ac = a.created_at ?? "";
  const bc = b.created_at ?? "";
  if (ac !== bc) return ac.localeCompare(bc);
  return (a.course_id ?? "").localeCompare(b.course_id ?? "");
}

export function sortCompetitionCourseLinks<T extends CompetitionCourseOrderFields>(rows: T[]): T[] {
  return [...rows].sort(compareCompetitionCourseOrder);
}
