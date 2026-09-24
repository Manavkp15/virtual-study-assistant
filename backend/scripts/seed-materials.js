const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

const samplePdfContent = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >>
endobj
4 0 obj
<< /Length 55 >>
stream
BT
/F1 18 Tf
50 720 Td
(Virtual Study Assistant - Official Study Material) Tj
ET
endstream
endobj
xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000216 00000 n 
trailer
<< /Size 5 /Root 1 0 R >>
startxref
321
%%EOF`;

async function main() {
  console.log('🌱 Seeding sample Study Materials...');

  const uploadDir = path.resolve(__dirname, '../uploads/materials');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const teacher = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  const student = await prisma.user.findFirst({ where: { role: 'STUDENT' } });
  const math = await prisma.subject.findFirst({ where: { name: 'Mathematics' } });
  const science = await prisma.subject.findFirst({ where: { name: 'Science' } });

  if (!teacher || !math) {
    console.error('Teacher or Math subject not found. Run db:init first.');
    return;
  }

  const mathChapter = await prisma.chapter.findFirst({ where: { subjectId: math.id } });
  const mathTopic = mathChapter ? await prisma.topic.findFirst({ where: { chapterId: mathChapter.id } }) : null;

  const scienceChapter = science ? await prisma.chapter.findFirst({ where: { subjectId: science.id } }) : null;
  const scienceTopic = scienceChapter ? await prisma.topic.findFirst({ where: { chapterId: scienceChapter.id } }) : null;

  // Write sample PDF files to uploadDir
  const mathPdfName = `mat-seed-algebra-linear-equations.pdf`;
  const sciencePdfName = `mat-seed-science-force-motion.pdf`;
  fs.writeFileSync(path.join(uploadDir, mathPdfName), samplePdfContent);
  fs.writeFileSync(path.join(uploadDir, sciencePdfName), samplePdfContent);

  // Clear existing study materials if any
  await prisma.studyMaterialAccess.deleteMany();
  await prisma.studyMaterial.deleteMany();

  // 1. Math Material - Published
  const mat1 = await prisma.studyMaterial.create({
    data: {
      title: 'Algebra – Linear Equations Master Guide',
      titleGu: 'બીજગણિત – સુરેખ સમીકરણો માસ્ટર માર્ગદર્શિકા',
      description: 'Comprehensive study material covering 1-variable & 2-variable linear equations, elimination method, graphical representation, and word problems with step-by-step solutions.',
      descriptionGu: '૧-ચલ અને ૨-ચલ સુરેખ સમીકરણો, લોપની રીત, આલેખીય નિરૂપણ અને તબક્કાવાર ઉકેલ સાથેની વિગતવાર અભ્યાસ સામગ્રી.',
      subjectId: math.id,
      chapterId: mathChapter?.id || null,
      topicId: mathTopic?.id || null,
      standard: 'Standard 8',
      teacherId: teacher.id,
      pdfFilePath: mathPdfName,
      pdfFileName: 'Algebra_Linear_Equations_Study_Notes.pdf',
      fileSizeBytes: samplePdfContent.length,
      mimeType: 'application/pdf',
      videoTitle: 'Linear Equations in One Variable - Complete Concept & Tricks',
      videoUrl: 'https://www.youtube.com/watch?v=bAerID24QJg',
      status: 'PUBLISHED',
      viewsCount: 24,
      downloadsCount: 14,
      videoClicksCount: 9,
      publishedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
    }
  });

  // 2. Science Material - Published
  const mat2 = await prisma.studyMaterial.create({
    data: {
      title: 'Force, Pressure & Laws of Motion Notes',
      titleGu: 'બળ, દબાણ અને ગતિના નિયમો નોંધ',
      description: 'Illustrated notes on types of contact & non-contact forces, atmospheric pressure, Newton laws of motion, and everyday practical applications with numerical formulas.',
      descriptionGu: 'સંપર્ક અને બિન-સંપર્ક બળો, વાતાવરણીય દબાણ, ન્યૂટનના ગતિના નિયમો અને દાખલાઓ સાથે સચિત્ર નોંધ.',
      subjectId: science ? science.id : math.id,
      chapterId: scienceChapter?.id || null,
      topicId: scienceTopic?.id || null,
      standard: 'Standard 8',
      teacherId: teacher.id,
      pdfFilePath: sciencePdfName,
      pdfFileName: 'Force_and_Pressure_Revision_Notes.pdf',
      fileSizeBytes: samplePdfContent.length,
      mimeType: 'application/pdf',
      videoTitle: 'Newton Laws of Motion Explained with Real-life Experiments',
      videoUrl: 'https://www.youtube.com/watch?v=kKKM8Y-u7ds',
      status: 'PUBLISHED',
      viewsCount: 18,
      downloadsCount: 10,
      videoClicksCount: 7,
      publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
    }
  });

  // 3. Draft Material - Teacher only
  const mat3 = await prisma.studyMaterial.create({
    data: {
      title: 'Draft: Microorganisms – Friend and Foe Diagrams',
      titleGu: 'ડ્રાફ્ટ: સૂક્ષ્મજીવો – મિત્ર અને શત્રુ આકૃતિઓ',
      description: 'Work in progress notes on bacterial culture, viruses, food preservation methods, and nitrogen cycle diagrams.',
      descriptionGu: 'બેક્ટેરિયા સંવર્ધન, વાયરસ, ખાદ્ય જાળવણી પદ્ધતિઓ અને નાઇટ્રોજન ચક્ર આકૃતિઓ પર પ્રગતિ હેઠળની નોંધ.',
      subjectId: science ? science.id : math.id,
      chapterId: scienceChapter?.id || null,
      topicId: scienceTopic?.id || null,
      standard: 'Standard 8',
      teacherId: teacher.id,
      status: 'DRAFT',
      viewsCount: 0,
      downloadsCount: 0,
      videoClicksCount: 0
    }
  });

  // Seed student interactions if student exists
  if (student) {
    await prisma.studyMaterialAccess.createMany({
      data: [
        { materialId: mat1.id, studentId: student.id, eventType: 'VIEW' },
        { materialId: mat1.id, studentId: student.id, eventType: 'PDF_VIEW' },
        { materialId: mat1.id, studentId: student.id, eventType: 'PDF_DOWNLOAD' },
        { materialId: mat1.id, studentId: student.id, eventType: 'STUDIED' },
        { materialId: mat2.id, studentId: student.id, eventType: 'VIEW' },
        { materialId: mat2.id, studentId: student.id, eventType: 'VIDEO_CLICK' }
      ]
    });

    // Notify student about published study material
    await prisma.notification.create({
      data: {
        userId: student.id,
        title: 'New Study Material: Algebra Linear Equations',
        titleGu: 'નવું અભ્યાસ સાહિત્ય: બીજગણિત સુરેખ સમીકરણો',
        message: 'Your teacher has uploaded new Mathematics study material with complete PDF and video lesson.',
        messageGu: 'તમારા શિક્ષકે સંપૂર્ણ પીડીએફ અને વિડિયો લેસન સાથે નવું ગણિત અભ્યાસ સાહિત્ય અપલોડ કર્યું છે.',
        type: 'STUDY_MATERIAL'
      }
    });
  }

  console.log('✅ Seeded 3 study materials (2 published, 1 draft) successfully!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
