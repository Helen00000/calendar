import jsPDF from 'jspdf';
import { toPng } from 'html-to-image';

export const exportPlanToPdf = async (
  elementId: string,
  filename: string = `Content-Strategy-${new Date().getFullYear()}.pdf`
) => {
  const element = document.getElementById(elementId);
  if (!element) {
    alert('Элемент для экспорта не найден');
    return;
  }

  try {
    // Generate high resolution PNG using html-to-image which natively supports modern CSS (oklab/oklch/Tailwind v4)
    const imgData = await toPng(element, {
      quality: 0.98,
      pixelRatio: 2,
      backgroundColor: '#FFFFFF',
      cacheBust: true,
    });

    const img = new Image();
    img.src = imgData;

    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = (e) => reject(e);
    });

    const imgWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const imgHeight = (img.height * imgWidth) / img.width;

    const pdf = new jsPDF('p', 'mm', 'a4');
    let heightLeft = imgHeight;
    let position = 0;

    // First page
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
    heightLeft -= pageHeight;

    // Add extra pages if needed
    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pageHeight;
    }

    pdf.save(filename);
  } catch (err) {
    console.error('Error generating PDF with html-to-image:', err);
    alert('Не удалось сгенерировать PDF отчет. Пожалуйста, попробуйте еще раз.');
  }
};
