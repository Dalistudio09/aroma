export function formatTenge(value: number): string {
  return `${Math.round(value).toLocaleString("ru-RU")} ₸`;
}

export function formatOrderNumber(id: number): string {
  return `#${id}`;
}
