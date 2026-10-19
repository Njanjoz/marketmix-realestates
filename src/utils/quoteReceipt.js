const printable = (value) => String(value ?? '')
  .replace(/[×·–—]/g, '-')
  .replace(/[^\x20-\x7E]/g, '?')
  .replace(/[\\()]/g, '\\$&');

const money = (value) => `KSh ${Number(value || 0).toLocaleString('en-KE')}`;

export function downloadTransportQuoteReceipt(quote = {}) {
  const commands = [];
  let y = 748;
  const text = (value, size = 11, x = 48, weight = 'normal') => {
    commands.push(`BT /${weight === 'bold' ? 'F2' : 'F1'} ${size} Tf ${x} ${y} Td (${printable(value)}) Tj ET`);
    y -= size + 10;
  };
  const rule = () => {
    commands.push(`0.75 w 48 ${y + 4} m 564 ${y + 4} l S`);
    y -= 12;
  };
  const row = (label, value) => {
    const safeValue = printable(value);
    text(label, 10, 48);
    const rightX = Math.max(280, 564 - safeValue.length * 5.5);
    commands.push(`BT /F2 10 Tf ${rightX} ${y + 21} Td (${safeValue}) Tj ET`);
  };

  text('MARKETMIX MOVING', 18, 48, 'bold');
  text('DRIVER QUOTE RECEIPT', 12, 48, 'bold');
  text(`Reference: ${quote.requestId || 'QUOTE PREVIEW'}`, 10);
  text(`Issued: ${quote.issuedAt || new Date().toLocaleString('en-KE')}`, 10);
  rule();
  text('TRIP DETAILS', 11, 48, 'bold');
  text(`Customer: ${quote.customerName || 'MarketMix customer'}`, 10);
  text(`Pickup: ${quote.pickupLabel || 'Not provided'}`, 10);
  text(`Destination: ${quote.destinationLabel || 'Not provided'}`, 10);
  text(`Vehicle: ${quote.vehicleLabel || 'Not selected'}`, 10);
  text(`Driver: ${quote.driverName || 'Selected local driver'}`, 10);
  const itemLines = Object.entries(quote.items || {}).filter(([, count]) => Number(count) > 0);
  if (itemLines.length) {
    text(`Belongings (${quote.itemCount ?? itemLines.reduce((sum, [, count]) => sum + Number(count), 0)} items):`, 10, 48, 'bold');
    itemLines.slice(0, 5).forEach(([name, count]) => text(`- ${name}: ${count}`, 9, 60));
    if (itemLines.length > 5) text(`And ${itemLines.length - 5} more item types`, 9, 60);
  }
  rule();
  text('FARE CALCULATION', 11, 48, 'bold');
  row('Estimated road distance', `${Number(quote.routeKm || 0).toFixed(1)} km`);
  row('Driver rate card', `${money(quote.ratePerKm)} / km`);
  if (Number(quote.itemFeeTotal) > 0) row('Item-specific charges', money(quote.itemFeeTotal));
  row('Trip quote', money(quote.total),);
  y -= 10;
  rule();
  text(`Quote status: ${quote.status || 'Awaiting customer decision'}`, 10, 48, 'bold');
  text('Distance is estimated from the selected map pins. The quote uses the selected driver vehicle rate and any listed item-specific charges.', 9);
  text('Extra trips, loading, stairs, waiting time, or changes to the load may require an updated quote.', 9);

  const stream = commands.join('\n');
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>',
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
  ];
  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => { pdf += `${String(offset).padStart(10, '0')} 00000 n \n`; });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  const blob = new Blob([pdf], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `MarketMix-Quote-${printable(quote.requestId || 'preview').replace(/[^A-Za-z0-9-]/g, '-')}.pdf`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
