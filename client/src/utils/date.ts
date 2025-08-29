// Simple date helpers so both cards agree on "a day"
export function addDays(d: Date, days: number) {
    const nd = new Date(d);
    nd.setDate(nd.getDate() + days);
    return nd;
  }
  
  // Format like "Friday 29 August"
  export function formatDayLabel(d: Date) {
    return new Intl.DateTimeFormat(undefined, {
      weekday: "long",
      day: "2-digit",
      month: "long",
    }).format(d);
  }
  