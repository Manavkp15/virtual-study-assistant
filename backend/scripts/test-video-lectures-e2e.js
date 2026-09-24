const fs = require('fs');
const path = require('path');

async function runE2ETest() {
  console.log('🧪 Starting Video Lectures End-to-End Tests...\n');

  const baseUrl = 'http://localhost:5000';

  // 1. Register Teacher
  const teacherEmail = `teacher_test_${Date.now()}@example.com`;
  const teacherPass = 'TeacherPass123!';

  console.log('1. Registering test teacher:', teacherEmail);
  const regRes = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: teacherEmail,
      password: teacherPass,
      name: 'Prof. Test Video Teacher',
      role: 'ADMIN'
    })
  });

  const regData = await regRes.json();
  if (!regRes.ok) {
    throw new Error('Teacher registration failed: ' + JSON.stringify(regData));
  }
  const token = regData.token;
  console.log('   Teacher registered and token acquired.');

  // Fetch a subject
  const subjRes = await fetch(`${baseUrl}/api/student/subjects`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const subjData = await subjRes.json();
  const subject = subjData.subjects[0];
  console.log('   Using subject:', subject.name, 'ID:', subject.id);

  // 2. Test uploading a non-MP4 file (e.g., text file) -> MUST FAIL
  console.log('\n2. Testing rejection of non-MP4 file...');
  const textBlob = new Blob(['Not a video file'], { type: 'text/plain' });
  const badFormData = new FormData();
  badFormData.append('video', textBlob, 'fake_video.txt');
  badFormData.append('title', 'Bad File Test');
  badFormData.append('subjectId', subject.id);
  badFormData.append('standard', 'Standard 8');

  const badRes = await fetch(`${baseUrl}/api/video-lectures/teacher/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: badFormData
  });

  const badData = await badRes.json();
  console.log('   Status:', badRes.status, 'Error:', badData.error);
  if (badRes.status === 400 && badData.error && badData.error.includes('MP4')) {
    console.log('   ✅ Successfully rejected non-MP4 file!');
  } else {
    throw new Error('Failed to reject non-MP4 file: ' + JSON.stringify(badData));
  }

  // 3. Test uploading a valid MP4 file
  console.log('\n3. Testing valid MP4 file upload...');
  // MP4 ftyp header bytes (standard ISO MP4 box header)
  const mp4Header = Buffer.from([
    0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70,
    0x69, 0x73, 0x6f, 0x6d, 0x00, 0x00, 0x02, 0x00,
    0x69, 0x73, 0x6f, 0x6d, 0x69, 0x73, 0x6f, 0x32,
    0x00, 0x00, 0x00, 0x08, 0x66, 0x72, 0x65, 0x65
  ]);
  const mp4Blob = new Blob([mp4Header], { type: 'video/mp4' });
  const goodFormData = new FormData();
  goodFormData.append('video', mp4Blob, 'quadratic_formula_mastery.mp4');
  goodFormData.append('title', 'Quadratic Equations Complete Derivation');
  goodFormData.append('titleGu', 'દ્વિઘાત સમીકરણો સંપૂર્ણ સાબિતી');
  goodFormData.append('description', 'Step by step derivation of discriminant and roots.');
  goodFormData.append('descriptionGu', 'વિવેચક અને બીજ શોધવાની સંપૂર્ણ પદ્ધતિ.');
  goodFormData.append('standard', 'Standard 8');
  goodFormData.append('subjectId', subject.id);

  const goodRes = await fetch(`${baseUrl}/api/video-lectures/teacher/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: goodFormData
  });

  const goodData = await goodRes.json();
  if (!goodRes.ok) {
    throw new Error('MP4 upload failed: ' + JSON.stringify(goodData));
  }
  const createdLecture = goodData.lecture;
  console.log('   ✅ Uploaded MP4 lecture successfully! ID:', createdLecture.id);
  console.log('   Stored file:', createdLecture.videoFilePath);

  // 4. Test Teacher list
  console.log('\n4. Fetching teacher video lectures list...');
  const tListRes = await fetch(`${baseUrl}/api/video-lectures/teacher/all?standard=Standard 8`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const tListData = await tListRes.json();
  console.log('   Total lectures found for teacher:', tListData.lectures.length);
  if (tListData.lectures.length < 1) {
    throw new Error('Lecture not found in teacher list');
  }

  // 5. Register Student (Standard 8)
  const studentEmail = `student_test_${Date.now()}@example.com`;
  console.log('\n5. Registering test student (Standard 8):', studentEmail);
  const sRegRes = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: studentEmail,
      password: 'StudentPass123!',
      name: 'Zain Test Student',
      role: 'STUDENT',
      standard: 'Standard 8'
    })
  });
  const sRegData = await sRegRes.json();
  const studentToken = sRegData.token;

  // 6. Test Student list
  console.log('\n6. Fetching student video lectures...');
  const sListRes = await fetch(`${baseUrl}/api/video-lectures/student?standard=Standard 8`, {
    headers: { Authorization: `Bearer ${studentToken}` }
  });
  const sListData = await sListRes.json();
  console.log('   Student visible lectures:', sListData.lectures.length);
  const found = sListData.lectures.find(l => l.id === createdLecture.id);
  if (!found) {
    throw new Error('Created lecture not visible to student');
  }
  console.log('   ✅ Student sees the lecture:', found.title);

  // 7. Test HTTP 206 Streaming endpoint with Range header
  console.log('\n7. Testing HTTP 206 byte-range streaming...');
  const streamRes = await fetch(`${baseUrl}/api/video-lectures/${createdLecture.id}/stream`, {
    headers: {
      Authorization: `Bearer ${studentToken}`,
      Range: 'bytes=0-15'
    }
  });

  console.log('   Stream Status:', streamRes.status);
  console.log('   Content-Range:', streamRes.headers.get('content-range'));
  console.log('   Content-Type:', streamRes.headers.get('content-type'));

  if (streamRes.status === 206 && streamRes.headers.get('content-type') === 'video/mp4') {
    console.log('   ✅ HTTP 206 streaming working perfectly!');
  } else {
    throw new Error('Streaming check failed with status: ' + streamRes.status);
  }

  // 8. Test tracking view
  console.log('\n8. Tracking video view...');
  const viewRes = await fetch(`${baseUrl}/api/video-lectures/${createdLecture.id}/view`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${studentToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ watchDurationSeconds: 45 })
  });
  const viewData = await viewRes.json();
  console.log('   View tracking response:', viewData.message);

  // 9. Clean up test lecture
  console.log('\n9. Cleaning up test video lecture...');
  const delRes = await fetch(`${baseUrl}/api/video-lectures/teacher/${createdLecture.id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  });
  const delData = await delRes.json();
  console.log('   Delete response:', delData.message);

  // Clean up users via db:clear script or prisma
  console.log('\n✅ ALL VIDEO LECTURE E2E TESTS PASSED SUCCESSFULLY!\n');
}

runE2ETest().catch(err => {
  console.error('❌ E2E Test Error:', err);
  process.exit(1);
});
