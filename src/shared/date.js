const KST_TIME_ZONE = 'Asia/Seoul';

export const getKstDate = (date = new Date()) => new Intl.DateTimeFormat('sv-SE', {
  timeZone: KST_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
}).format(date);

export const formatKstDateLabel = (dateString) => {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: KST_TIME_ZONE,
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  }).format(new Date(Date.UTC(year, month - 1, day, 12)));
};

export const shiftDate = (dateString, amount) => {
  const date = new Date(`${dateString}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + amount);
  return date.toISOString().slice(0, 10);
};
