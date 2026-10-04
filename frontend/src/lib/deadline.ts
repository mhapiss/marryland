// Tenggat galeri disimpan sebagai tanggal (DATE). Server menganggap tenggat berlaku sampai akhir hari
// tersebut menurut waktu WIB, jadi klien harus memakai aturan yang sama (bukan tengah malam UTC).

/** Akhir hari tenggat (23:59:59.999 WIB) sebagai objek Date, atau null bila tidak ada tenggat. */
export function getDeadlineEnd(deadlineDate: string | null | undefined): Date | null {
  if (!deadlineDate) return null;
  const datePart = String(deadlineDate).slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(datePart)) return null;
  const end = new Date(`${datePart}T23:59:59.999+07:00`);
  return Number.isNaN(end.getTime()) ? null : end;
}

/** True bila tenggat sudah lewat (hari tenggat itu sendiri masih dianggap berlaku). */
export function isDeadlinePassed(deadlineDate: string | null | undefined, now: Date = new Date()): boolean {
  const end = getDeadlineEnd(deadlineDate);
  return end ? end.getTime() < now.getTime() : false;
}

/** Sisa hari sampai akhir hari tenggat (0 berarti berakhir hari ini), atau null bila tidak ada tenggat. */
export function daysUntilDeadline(deadlineDate: string | null | undefined, now: Date = new Date()): number | null {
  const end = getDeadlineEnd(deadlineDate);
  if (!end) return null;
  return Math.max(0, Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) - 1);
}
