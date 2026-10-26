// Which pastes become proof. Only pastes that carry files; and a copy that also carries text
// (from Excel or OneNote, for example) into a text field stays text.
export function filesFromTransfer(dt) {
  return dt && dt.files ? Array.from(dt.files) : [];
}

const editable = (t) => !!t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable === true);

export function shouldTakePaste(event) {
  const dt = event.clipboardData;
  if (!filesFromTransfer(dt).length) return false;
  const hasText = !!dt && Array.from(dt.types || []).includes('text/plain');
  return !(hasText && editable(event.target));
}
