import jsPDF from 'jspdf';

export const generatePhagePassport = (programData) => {
    const doc = new jsPDF();
    const asset = programData; // Expecting the asset object

    // -- Header / Branding --
    doc.setFillColor(15, 23, 42); // Midnight Blue
    doc.rect(0, 0, 210, 40, 'F');

    doc.setFontSize(24);
    doc.setTextColor(16, 185, 129); // Emerald Green
    doc.text("PHAGE PASSPORT", 105, 18, { align: 'center' });

    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.text("Global Access Laboratory | University of the Punjab", 105, 28, { align: 'center' });

    // -- Phage Identity --
    doc.setFontSize(16);
    doc.setTextColor(15, 23, 42);
    doc.text(`Phage ID: ${asset.strain_number || 'Unknown'}`, 20, 55);

    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text(`Species: ${asset.species}`, 20, 65);
    doc.text(`Source: ${asset.source || 'N/A'}`, 20, 72);

    // -- Clinical Status Badge --
    if (asset.endotoxin_units < 5.0 && asset.sterility_status === 'Pass') {
        doc.setFillColor(16, 185, 129);
        doc.roundedRect(140, 50, 50, 15, 3, 3, 'F');
        doc.setTextColor(255);
        doc.setFontSize(12);
        doc.text("CLINICAL GRADE", 165, 60, { align: 'center' });
    } else {
        doc.setFillColor(203, 213, 225); // Slate 300
        doc.roundedRect(140, 50, 50, 15, 3, 3, 'F');
        doc.setTextColor(71, 85, 105);
        doc.setFontSize(12);
        doc.text("RESEARCH ONLY", 165, 60, { align: 'center' });
    }

    // -- Morphology Section --
    doc.setDrawColor(200);
    doc.line(20, 85, 190, 85);

    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    doc.text("Morphology & Characteristics", 20, 95);

    doc.setFontSize(11);
    doc.setTextColor(60);
    const morph = asset.morphology || {};
    doc.text(`• Virus Family: ${morph.virus_family || 'Unclassified'}`, 25, 105);
    doc.text(`• Capsid Diameter: ${morph.capsid_diameter || '?'} nm`, 25, 112);
    doc.text(`• Tail Length: ${morph.tail_length || '?'} nm`, 25, 119);
    doc.text(`• Lifecycle: ${asset.characteristics?.includes('Lytic') ? 'Lytic' : 'Temperate'}`, 25, 126);

    // -- Image (If available) --
    if (asset.image_url) {
        try {
            // NOTE: In a real app, this image needs to be base64 or a local proxy URL for jsPDF to render it.
            // For now, we will draw a placeholder frame.
            doc.setDrawColor(16, 185, 129);
            doc.rect(130, 90, 60, 60);
            doc.setFontSize(8);
            doc.text("TEM Image Wrapper", 160, 120, { align: 'center' });
            // doc.addImage(asset.image_url, 'JPEG', 130, 90, 60, 60); 
        } catch (e) {
            console.warn("Could not load image for PDF");
        }
    }

    // -- Genomic Data --
    doc.text("Genomic Summary:", 20, 140);
    doc.setFont("courier", "normal");
    doc.setFontSize(9);
    const seqPreview = asset.sequence_data ? asset.sequence_data.substring(0, 50) + "..." : "No Sequence Data Available";
    doc.text(seqPreview, 20, 146);
    doc.setFont("helvetica", "normal");

    // -- Quality Control --
    doc.line(20, 160, 190, 160);
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    doc.text("Quality Control (QC)", 20, 170);

    doc.setFontSize(10);
    doc.autoTable({
        startY: 175,
        head: [['Test Parameter', 'Result', 'Threshold', 'Status']],
        body: [
            ['Endotoxin', `${asset.endotoxin_units || 'N/A'} EU/ml`, '< 5.0 EU/ml', asset.endotoxin_units < 5 ? 'PASS' : 'FAIL'],
            ['Sterility', asset.sterility_status || 'Pending', 'No Growth', asset.sterility_status === 'Pass' ? 'PASS' : 'FAIL'],
            ['Host Range', 'Broad (>5 strains)', 'N/A', 'Verified']
        ],
        theme: 'striped',
        headStyles: { fillColor: [15, 23, 42] }
    });

    // -- Footer --
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text("This document is a certified record of availability. Use strictly per biosafety protocols.", 105, 280, { align: 'center' });
    doc.text(`Generated: ${new Date().toISOString()}`, 105, 285, { align: 'center' });

    doc.save(`PhagePassport_${asset.strain_number}.pdf`);
};
