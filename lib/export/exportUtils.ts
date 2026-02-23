import jsPDF from "jspdf";
import { Document, Paragraph, TextRun, HeadingLevel, AlignmentType, Packer } from "docx";
import { saveAs } from "file-saver";

type Phase = {
  title: string;
  description: string | null;
  content: string;
};

type Module = {
  title: string;
  description: string | null;
  phases: Phase[];
};

type ExportData = {
  projectTitle: string;
  projectDescription: string | null;
  modules: Module[];
};

// ============================================
// EXPORT AS PDF
// ============================================
export const exportAsPDF = (data: ExportData) => {
  const doc = new jsPDF();
  let yPosition = 20;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 20;
  const lineHeight = 7;

  // Helper to add new page if needed
  const checkPageBreak = (additionalHeight: number = 10) => {
    if (yPosition + additionalHeight > pageHeight - margin) {
      doc.addPage();
      yPosition = margin;
    }
  };

  // Title Page
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text(data.projectTitle, margin, yPosition);
  yPosition += 15;

  if (data.projectDescription) {
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    const descLines = doc.splitTextToSize(data.projectDescription, 170);
    doc.text(descLines, margin, yPosition);
    yPosition += descLines.length * lineHeight + 10;
  }

  yPosition += 10;

  // Modules and Phases
  data.modules.forEach((module, moduleIndex) => {
    checkPageBreak(20);

    // Module title
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text(`${moduleIndex + 1}. ${module.title}`, margin, yPosition);
    yPosition += 10;

    if (module.description) {
      doc.setFontSize(11);
      doc.setFont("helvetica", "italic");
      const modDescLines = doc.splitTextToSize(module.description, 170);
      doc.text(modDescLines, margin, yPosition);
      yPosition += modDescLines.length * lineHeight + 5;
    }

    // Phases
    module.phases.forEach((phase, phaseIndex) => {
      checkPageBreak(15);

      // Phase title
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text(`${moduleIndex + 1}.${phaseIndex + 1} ${phase.title}`, margin + 5, yPosition);
      yPosition += 8;

      if (phase.description) {
        doc.setFontSize(10);
        doc.setFont("helvetica", "italic");
        const phaseDescLines = doc.splitTextToSize(phase.description, 165);
        doc.text(phaseDescLines, margin + 5, yPosition);
        yPosition += phaseDescLines.length * lineHeight + 3;
      }

      // Phase content
      if (phase.content) {
        doc.setFontSize(11);
        doc.setFont("helvetica", "normal");
        const contentLines = doc.splitTextToSize(phase.content, 165);
        
        contentLines.forEach((line: string) => {
          checkPageBreak();
          doc.text(line, margin + 5, yPosition);
          yPosition += lineHeight;
        });
        
        yPosition += 10;
      }
    });

    yPosition += 5;
  });

  // Save PDF
  doc.save(`${data.projectTitle}.pdf`);
};

// ============================================
// EXPORT AS DOCX (CORRECTED VERSION)
// ============================================
export const exportAsDOCX = async (data: ExportData) => {
  const children: any[] = [];

  // Title
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: data.projectTitle,
          bold: true,
          size: 32,
        }),
      ],
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
    })
  );

  // Project description
  if (data.projectDescription) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: data.projectDescription,
            size: 24,
          }),
        ],
        spacing: { after: 400 },
      })
    );
  }

  // Modules and phases
  data.modules.forEach((module, moduleIndex) => {
    // Module heading
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `${moduleIndex + 1}. ${module.title}`,
            bold: true,
            size: 28,
          }),
        ],
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 },
      })
    );

    if (module.description) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: module.description,
              italics: true,  // italics goes inside TextRun, not Paragraph
              size: 22,
            }),
          ],
          spacing: { after: 200 },
        })
      );
    }

    // Phases
    module.phases.forEach((phase, phaseIndex) => {
      // Phase heading
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `${moduleIndex + 1}.${phaseIndex + 1} ${phase.title}`,
              bold: true,
              size: 24,
            }),
          ],
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 300, after: 100 },
        })
      );

      if (phase.description) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: phase.description,
                italics: true,  // italics goes inside TextRun
                size: 20,
              }),
            ],
            spacing: { after: 100 },
          })
        );
      }

      // Phase content
      if (phase.content) {
        const paragraphs = phase.content.split("\n\n");
        paragraphs.forEach((para) => {
          if (para.trim()) {
            children.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: para.trim(),
                    size: 22,
                  }),
                ],
                spacing: { after: 200 },
              })
            );
          }
        });
      }
    });
  });

  // Create document
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: children,
      },
    ],
  });

  // Generate and save
  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${data.projectTitle}.docx`);
};

// ============================================
// EXPORT AS TXT
// ============================================
export const exportAsTXT = (data: ExportData) => {
  let content = "";

  // Title
  content += `${data.projectTitle.toUpperCase()}\n`;
  content += "=".repeat(data.projectTitle.length) + "\n\n";

  // Project description
  if (data.projectDescription) {
    content += `${data.projectDescription}\n\n`;
  }

  content += "\n\n";

  // Modules and phases
  data.modules.forEach((module, moduleIndex) => {
    content += `${moduleIndex + 1}. ${module.title.toUpperCase()}\n`;
    content += "-".repeat(module.title.length + 3) + "\n\n";

    if (module.description) {
      content += `${module.description}\n\n`;
    }

    module.phases.forEach((phase, phaseIndex) => {
      content += `  ${moduleIndex + 1}.${phaseIndex + 1} ${phase.title}\n\n`;

      if (phase.description) {
        content += `  ${phase.description}\n\n`;
      }

      if (phase.content) {
        // Indent content properly
        const contentLines = phase.content.split('\n');
        contentLines.forEach(line => {
          content += `  ${line}\n`;
        });
        content += "\n";
      }

      content += "\n";
    });

    content += "\n\n";
  });

  // Create blob and download
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  saveAs(blob, `${data.projectTitle}.txt`);
};

// Optional: Enhanced version with better styling
export const exportAsDOCXEnhanced = async (data: ExportData) => {
  const children: any[] = [];

  // Title with styling
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: data.projectTitle,
          bold: true,
          size: 36,
          font: "Arial",
        }),
      ],
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
    })
  );

  // Project description with styling
  if (data.projectDescription) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: data.projectDescription,
            size: 24,
            font: "Arial",
            color: "666666", // Gray color
          }),
        ],
        spacing: { after: 400 },
      })
    );
  }

  // Add a horizontal line
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: "─────────────────────────────────",
          size: 20,
          color: "CCCCCC",
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 300 },
    })
  );

  // Modules and phases
  data.modules.forEach((module, moduleIndex) => {
    // Module heading with background
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `${moduleIndex + 1}. ${module.title}`,
            bold: true,
            size: 28,
            font: "Arial",
          }),
        ],
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 },
      })
    );

    if (module.description) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: module.description,
              italics: true,
              size: 22,
              font: "Arial",
              color: "444444",
            }),
          ],
          spacing: { after: 200 },
        })
      );
    }

    // Phases
    module.phases.forEach((phase, phaseIndex) => {
      // Phase heading with bullet
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `  ${moduleIndex + 1}.${phaseIndex + 1} ${phase.title}`,
              bold: true,
              size: 24,
              font: "Arial",
            }),
          ],
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 300, after: 100 },
          bullet: {
            level: 0, // Bullet point
          },
        })
      );

      if (phase.description) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `    ${phase.description}`,
                italics: true,
                size: 20,
                font: "Arial",
                color: "666666",
              }),
            ],
            spacing: { after: 100 },
          })
        );
      }

      // Phase content
      if (phase.content) {
        const paragraphs = phase.content.split("\n\n");
        paragraphs.forEach((para) => {
          if (para.trim()) {
            children.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: `      ${para.trim()}`,
                    size: 22,
                    font: "Arial",
                  }),
                ],
                spacing: { after: 200 },
              })
            );
          }
        });
      }
    });
  });

  // Add footer
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `\nGenerated on ${new Date().toLocaleDateString()}`,
          size: 16,
          font: "Arial",
          color: "999999",
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { before: 400 },
    })
  );

  // Create document
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: children,
      },
    ],
  });

  // Generate and save
  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${data.projectTitle}.docx`);
};