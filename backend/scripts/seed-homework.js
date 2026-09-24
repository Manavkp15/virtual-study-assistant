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
<< /Length 52 >>
stream
BT
/F1 18 Tf
50 720 Td
(Virtual Study Assistant - Homework Submission) Tj
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
318
%%EOF`;

async function main() {
  console.log('🌱 Seeding sample Homework assignments...');

  const uploadDir = path.resolve(__dirname, '../uploads/homework');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  // Find teacher and student
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

  // 1. Homework: Linear Equations Problem Set (Standard 8)
  const hw1 = await prisma.homework.create({
    data: {
      title: 'Linear Equations & Variable Systems Problem Set',
      titleGu: 'સુરેખ સમીકરણો અને ચલ પ્રણાલી પ્રશ્ન સેટ',
      instructions: 'Solve questions 1 through 10 on page 42. Show all step-by-step working clearly and state the solution set.',
      instructionsGu: 'પાના નંબર 42 પરના પ્રશ્ન 1 થી 10 ઉકેલો. તમામ સ્ટેપ-બાય-સ્ટેપ ગણતરી સ્પષ્ટ રીતે દર્શાવો અને ઉકેલ ગણ જણાવો.',
      subjectId: math.id,
      chapterId: mathChapter?.id || null,
      topicId: mathTopic?.id || null,
      standard: 'Standard 8',
      teacherId: teacher.id,
      assignedDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // 4 days ago
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // Due in 3 days
      maxMarks: 20.0,
      allowResubmission: true
    }
  });

  // 2. Homework: Quadratic Identities & Graphing (Checked with marks and feedback)
  const hw2 = await prisma.homework.create({
    data: {
      title: 'Algebraic Identities & Factorization Practice',
      titleGu: 'બીજગણિતીય નિત્યસમ અને અવયવીકરણ અભ્યાસ',
      instructions: 'Factorize the 8 polynomial expressions provided in the worksheet and verify using distributive expansion.',
      instructionsGu: 'વર્કશીટમાં આપેલી 8 બહુપદી પદાવલિઓનું અવયવીકરણ કરો અને વિસ્તરણ દ્વારા ચકાસો.',
      subjectId: math.id,
      chapterId: mathChapter?.id || null,
      topicId: mathTopic?.id || null,
      standard: 'Standard 8',
      teacherId: teacher.id,
      assignedDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // Due yesterday
      maxMarks: 20.0,
      allowResubmission: true
    }
  });

  // 3. Homework: Science experiment report (Overdue / Late)
  if (science) {
    const sciChapter = await prisma.chapter.findFirst({ where: { subjectId: science.id } });
    const sciTopic = sciChapter ? await prisma.topic.findFirst({ where: { chapterId: sciChapter.id } }) : null;

    await prisma.homework.create({
      data: {
        title: 'Chemical Reactions & Balanced Equations',
        titleGu: 'રાસાયણિક પ્રક્રિયાઓ અને સંતુલિત સમીકરણો',
        instructions: 'Write the balanced chemical equations for combustion, neutralization, and displacement reactions studied in Chapter 1.',
        instructionsGu: 'પ્રકરણ 1 માં અભ્યાસ કરેલ દહન, તટસ્થીકરણ અને વિસ્થાપન પ્રક્રિયાઓ માટે સંતુલિત રાસાયણિક સમીકરણો લખો.',
        subjectId: science.id,
        chapterId: sciChapter?.id || null,
        topicId: sciTopic?.id || null,
        standard: 'Standard 8',
        teacherId: teacher.id,
        assignedDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // Due in 5 days
        maxMarks: 25.0,
        allowResubmission: true
      }
    });
  }

  // Create sample submission for hw2 that is already evaluated/checked
  if (student) {
    const sampleFileName = `hw-sample-${student.id}.pdf`;
    const sampleFilePath = path.join(uploadDir, sampleFileName);
    fs.writeFileSync(sampleFilePath, samplePdfContent);

    await prisma.homeworkSubmission.create({
      data: {
        homeworkId: hw2.id,
        studentId: student.id,
        pdfFilePath: sampleFileName,
        originalFileName: 'algebra_identities_zain.pdf',
        fileSizeBytes: samplePdfContent.length,
        mimeType: 'application/pdf',
        status: 'CHECKED',
        submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        marksObtained: 18.5,
        teacherFeedback: 'Excellent presentation and accurate factorization steps! Pay attention to negative sign distribution in question 6.',
        evaluatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        evaluatedBy: teacher.id,
        submissionVersion: 1
      }
    });

    // Create notification for student
    await prisma.notification.create({
      data: {
        userId: student.id,
        title: 'Homework Checked & Evaluated',
        titleGu: 'ગૃહકાર્ય ચકાસણી પૂર્ણ',
        message: `Your Mathematics homework "Algebraic Identities & Factorization Practice" has been checked. Marks: 18.5/20. Feedback: "Excellent presentation and accurate factorization steps!"`,
        messageGu: `તમારા ગણિત ગૃહકાર્ય "બીજગણિતીય નિત્યસમ અને અવયવીકરણ અભ્યાસ" ની ચકાસણી પૂર્ણ થઈ છે. ગુણ: 18.5/20. શિક્ષક પ્રતિસાદ: "સરસ પ્રેઝન્ટેશન અને સાચા સ્ટેપ્સ!"`,
        type: 'HOMEWORK'
      }
    });

    console.log('✅ Created sample evaluated submission and notification for student.');
  }

  console.log('✅ Seeded homework assignments successfully.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
